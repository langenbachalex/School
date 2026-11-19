#!/usr/bin/env node
// Festes Testprogramm (ALLE, 15.11.2026, Entscheidung Mr. Alex) – ein Befehl, Ausgabe „ALLES OK“ oder eine Fehlerliste.
//   node werkzeuge/testprogramm.js            alle drei Apps (EN6, EN9, FR)
//   node werkzeuge/testprogramm.js EN9 FR     nur diese Apps
//   node werkzeuge/testprogramm.js --ohne-update   ohne den langsamen Update-Test (Service Worker)
//   node werkzeuge/testprogramm.js --format=handy  nur ein Format (laptop, handy, ipad; mehrere mit Komma)
// Drei Formate (Mr. Alex 15.11.: heute Windows-Laptop, Handy muss gehen, künftig iPad): Laptop 1366×768 mit Maus,
// Handy 360×740 mit Touch, iPad 820×1180 mit Touch. Laptop und Handy laufen in Chromium (Chrome/Edge), das iPad in WebKit (Safari-Technik).
// Fehlt WebKit, installiert das Testprogramm es selbst (ca. 1 Min., braucht cdn.playwright.dev); klappt das nicht, läuft das iPad
// ersatzweise in Chromium und am Ende steht ein deutlicher Hinweis.
// Geprüft wird je App und Format: lädt ohne Konsolenfehler · die wichtigsten Wege (Start, eine Übung,
// Runner-Start, Shop) · kein Feld breiter als der Bildschirm · ein Update kommt an (Service Worker).
// Ändert keine Datei: der eingebaute Server liefert die App aus dem Repo, für den Update-Test nur im Speicher verändert.
// Neue Fehler: zuerst hier einen Test ergänzen, der den Fehler zeigt (Regel in CLAUDE.md).
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium, webkit } = require("playwright");
const { spawnSync } = require("child_process");

const WURZEL = path.resolve(__dirname, "..");
const FORMATE = [
  { name: "Laptop", id: "laptop", viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false },
  { name: "Handy", id: "handy", viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true },
  { name: "iPad", id: "ipad", webkit: true, viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true,
    userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" },
];
const args = process.argv.slice(2);
const fArg = (args.find((a) => a.startsWith("--format=")) || "").slice(9);
const formate = fArg ? FORMATE.filter((f) => fArg.toLowerCase().split(",").includes(f.id)) : FORMATE;
const OHNE_UPDATE = args.includes("--ohne-update");
const NUR_STORY = args.includes("--nur-story");   // nur das Story-Spiel prüfen (Tower-Test und 3D-Probe), ohne die Lern-App – für Bauten, die nur die Figuren betreffen
const NUR_3D_AUS = args.includes("--ohne-3d");   // 3D-Probe auslassen (z. B. wenn tower/raum3d/ noch nicht gerechnet ist)
const gewaehlt = args.filter((a) => !a.startsWith("--")).map((a) => a.toUpperCase());

/* ---------- Spielstand mit gültigem Siegel (für Tickets): Siegel-Funktion wird aus der App gelesen, nicht nachgebaut ---------- */
function siegelAus(appJs, art) {
  const salz = appJs.match(/const SIEGEL_SALZ = [^\n]*?;/);
  if (!salz) throw new Error("SIEGEL_SALZ nicht gefunden");
  if (art === "fr") {
    const einst = appJs.match(/const EINSTELLUNGEN = [^\n]*;/), fn = appJs.match(/function siegel\(o\) \{[\s\S]*?\n  \}/);
    if (!einst || !fn) throw new Error("Siegel-Funktion (FR) nicht gefunden");
    return new Function(`${einst[0]}\n${salz[0]}\n${fn[0]}\nreturn siegel;`)();
  }
  const v = appJs.match(/const SIEGEL_V = \d+;/), fn = appJs.match(/const siegel = \(o, v = SIEGEL_V\) => \{[\s\S]*?\n  \};/);
  if (!v || !fn) throw new Error("Siegel-Funktion nicht gefunden");
  return new Function(`${salz[0]}\n${v[0]}\n${fn[0]}\nreturn [siegel, SIEGEL_V];`)();
}
// Nimmt den Spielstand, den die App selbst angelegt hat, gibt Coins und Tickets dazu und siegelt neu.
function mitTickets(app, roh, patch) {
  const appJs = fs.readFileSync(path.join(WURZEL, app.pfad, "app.js"), "utf8");
  const s = roh ? JSON.parse(roh) : {};
  if (app.art === "fr") {
    const siegel = siegelAus(appJs, "fr");
    s.coins = 500; s.parisRun = Object.assign({ gespielt: 0, geschafft: 0, beste: 0 }, s.parisRun, { tickets: 3 });
    if (patch) patch(s);
    s._s = siegel(s); return s;
  }
  const [siegel, V] = siegelAus(appJs, "en");
  s.spiel = s.spiel || {}; s.spiel.coins = 500;
  s.spiel.runner = Object.assign({ level: {}, gespielt: 0, geschafft: 0, titel: 0 }, s.spiel.runner, { tickets: 3 });
  if (patch) patch(s);
  s._v = V; s._s = siegel(s, V); return s;
}

/* ---------- Die drei Apps und ihre Wege ---------- */
const APPS = [
  { kurz: "EN6", pfad: "app", speicher: "auffrischen-v1", art: "en",
    uebung: [/^Station 1:/, /Weiter/], runner: [/^Station 5/, /^London Run$/, /Spielen \(🎟️/], shop: [/Shop$/] },
  { kurz: "EN9", pfad: "app/klasse9", speicher: "america9-v1", art: "en",
    uebung: [/^1 Reading$/, /^Task words$/], runner: [/^8 Games$/, /^Road Trip Run$/, /(Spielen|Play) \(🎟️/], shop: [/Shop$/] },
  { kurz: "FR", pfad: "app/franz", speicher: "fr_stand", art: "fr",
    uebung: [/Dialogues/, /Il y a deux/], runner: [/Paris Run/, /Los geht's ! \(🎟️/], shop: [/^🛍️ Boutique$/] },
].filter((a) => !gewaehlt.length || gewaehlt.includes(a.kurz));

/* ---------- Kleiner Server: liefert das Repo; im Update-Test eine „neue Version“ (sw.js + app.js nur im Speicher geändert) ---------- */
const TYPEN = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json",
  ".webmanifest": "application/manifest+json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".webp": "image/webp",
  ".mp3": "audio/mpeg", ".woff2": "font/woff2", ".ico": "image/x-icon", ".tsv": "text/plain; charset=utf-8" };
const neueVersion = new Set(); // App-Pfade, für die der Server gerade die „neue Version“ liefert
function server() {
  return http.createServer((req, res) => {
    let rel = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/+/, "");
    let datei = path.join(WURZEL, rel);
    if (!datei.startsWith(WURZEL)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(datei) && fs.statSync(datei).isDirectory()) datei = path.join(datei, "index.html");
    if (!fs.existsSync(datei)) { res.writeHead(404); return res.end("fehlt: " + rel); }
    let inhalt = fs.readFileSync(datei);
    const ordner = path.relative(WURZEL, path.dirname(datei)).split(path.sep).join("/");
    if (neueVersion.has(ordner)) {
      const name = path.basename(datei);
      if (name === "sw.js") inhalt = Buffer.from(inhalt.toString("utf8")
        .replace(/const VERSION = "([^"]+)"/, (m, v) => `const VERSION = "${v.replace(/([0-9a-f])([^0-9a-f]*)$/, "$1a$2")}"`)
        .replace(/"app\.js": "[0-9a-f]+"/, '"app.js": "0000test"'));
      if (name === "app.js") inhalt = Buffer.concat([inhalt, Buffer.from("\nwindow.__testprogrammNeu = true;\n")]);
    }
    res.writeHead(200, { "Content-Type": TYPEN[path.extname(datei).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(inhalt);
  });
}

/* ---------- Prüfhilfen ---------- */
async function zuBreit(pg) {
  return pg.evaluate(() => {
    const B = window.innerWidth;
    const raus = [];
    if (document.documentElement.scrollWidth > B + 1) raus.push(`Seite ${document.documentElement.scrollWidth} px breit`);
    for (const e of document.querySelectorAll("body *")) {
      if (!e.offsetParent && getComputedStyle(e).position !== "fixed") continue;
      const r = e.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || r.right <= B + 1) continue;
      let p = e.parentElement, eingefasst = false; // in einem waagerecht scrollenden/abgeschnittenen Kasten ist das gewollt
      while (p && p !== document.body) { const ox = getComputedStyle(p).overflowX; if (ox !== "visible") { eingefasst = true; break; } p = p.parentElement; }
      if (eingefasst) continue;
      const name = e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + (e.className && typeof e.className === "string" ? "." + e.className.trim().split(/\s+/).join(".") : "");
      raus.push(`${name} reicht bis ${Math.round(r.right)} px („${(e.textContent || "").trim().slice(0, 30)}“)`);
      if (raus.length >= 5) break;
    }
    return raus;
  });
}
async function klicke(pg, name) {
  const k = pg.getByRole("button", { name }).first();
  await k.waitFor({ state: "visible", timeout: 5000 });
  await k.click();
  await pg.waitForTimeout(600);
}
const kontext = (browser, f, extra = {}) => browser.newContext(Object.assign({ viewport: f.viewport, isMobile: f.isMobile, hasTouch: f.hasTouch },
  f.userAgent ? { userAgent: f.userAgent } : {}, extra));
async function neueSeite(browser, basis, app, tickets, f, patch) {
  const ctx = await kontext(browser, f, { serviceWorkers: "block" });
  const pg = await ctx.newPage(), fehler = [];
  if (tickets) { // erst die App ihren Stand anlegen lassen, dann Tickets dazu
    await pg.goto(`${basis}/${app.pfad}/`); await pg.waitForTimeout(1200);
    const roh = await pg.evaluate((k) => localStorage.getItem(k), app.speicher);
    const neu = JSON.stringify(mitTickets(app, roh, patch));
    await pg.evaluate(([k, s]) => { localStorage.setItem(k, s); localStorage.setItem(k + "-b", s); }, [app.speicher, neu]);
  }
  pg.on("console", (m) => { if (m.type() === "error") fehler.push("Konsole: " + m.text().slice(0, 200)); });
  pg.on("pageerror", (e) => fehler.push("Skriptfehler: " + e.message.slice(0, 200)));
  pg.on("response", (r) => { if (r.status() >= 400) fehler.push(`Datei fehlt (${r.status()}): ${r.url().replace(basis, "")}`); });
  await pg.goto(`${basis}/${app.pfad}/`, { waitUntil: "load" });
  await pg.waitForTimeout(1200);
  return { ctx, pg, fehler };
}

/* ---------- Ein Weg: Seite öffnen, Knöpfe der Reihe nach, unterwegs 360 px prüfen ---------- */
async function weg(browser, basis, app, titel, knoepfe, opt = {}) {
  const fehl = [];
  const { ctx, pg, fehler } = await neueSeite(browser, basis, app, opt.tickets || !!opt.stand, opt.format, opt.stand);
  try {
    for (const b of await zuBreit(pg)) fehl.push(`${titel}, Startseite: ${b}`);
    for (const k of knoepfe) {
      try { await klicke(pg, k); } catch (e) { fehl.push(`${titel}: Knopf ${k} nicht gefunden`); break; }
      for (const b of await zuBreit(pg)) fehl.push(`${titel}, nach ${k}: ${b}`);
    }
    if (opt.pruefe) { const f = await opt.pruefe(pg); if (f) fehl.push(`${titel}: ${f}`); }
  } finally {
    await pg.waitForTimeout(300);
    fehl.push(...[...new Set(fehler)].map((f) => `${titel}: ${f}`));
    await ctx.close();
  }
  return fehl;
}

/* ---------- EN6 „The Keys of the Tower“, technische 3D-Probe (17.11.2026): tower/probe3d.html lädt den Raum als glTF,
   die Uhr lässt sich antippen (Ort auf dem Bildschirm aus window.__probe3d), ein Tipp auf den Boden geht dorthin, nichts ist breiter als der Bildschirm. ---------- */
async function probe3dTest(browser, basis, app, name, fm) {
  const titel = `${name} · Keys of the Tower 3D-Probe`, fehl = [];
  const { ctx, pg, fehler } = await neueSeite(browser, basis, app, false, fm);
  try {
    await pg.goto(`${basis}/${app.pfad}/tower/probe3d.html`, { waitUntil: "load" });
    await pg.waitForSelector("#buehne[data-bereit]", { timeout: 40000 });
    await pg.evaluate(() => { window.__towerSchnell = true; });
    const ort = await pg.evaluate(() => window.__probe3d.ort("uhr"));
    await pg.mouse.click(ort.x, ort.y);   // die Figur geht erst hin (um die Möbel herum), dann spricht der Erzähler
    await pg.waitForFunction(() => document.getElementById("buehne").dataset.zuletzt, null, { timeout: 20000 }).catch(() => {});
    const zuletzt = await pg.evaluate(() => document.getElementById("buehne").dataset.zuletzt);
    if (zuletzt !== "uhr") fehl.push(`${titel}: Tipp auf die Uhr führt zu „${zuletzt || "nichts"}“`);
    if (!/clock/i.test(await pg.locator("#text").textContent())) fehl.push(`${titel}: kein Text zur angetippten Uhr`);
    // Boden antippen = dorthin gehen (Bauplan Abschnitt 3: alles geht mit Finger und Maus, nichts nur mit Tasten)
    const vorher = await pg.evaluate(() => window.__probe3d.stand());
    const boden = await pg.evaluate(() => window.__probe3d.boden());
    if (!boden) fehl.push(`${titel}: keine freie Bodenstelle im Bild`);
    else await pg.mouse.click(boden.x, boden.y);
    await pg.waitForTimeout(1500);
    const nachher = await pg.evaluate(() => window.__probe3d.stand());
    if (Math.hypot(nachher[0] - vorher[0], nachher[1] - vorher[1]) < 0.2) fehl.push(`${titel}: Tipp auf den Boden bewegt die Figur nicht`);
    for (const k of ["puppenhaus", "augen", "hinten"]) {   // drei Kameras zum Vergleichen
      await pg.click(`#kameras button[data-kamera="${k}"]`); await pg.waitForTimeout(200);
      if ((await pg.evaluate(() => document.getElementById("buehne").dataset.kamera)) !== k) fehl.push(`${titel}: Kamera „${k}“ lässt sich nicht wählen`);
    }
    // Figuren (Block A): Gary endgültig – KayKit-Körper mit eigenem Kopf; Stehen, Gehen, Reden, Verbeugen und drei Gesten
    const figuren = () => pg.evaluate(() => window.__probe3d.figuren());
    const namen = (await figuren()).map((g) => g.name).join(",");
    if (namen !== "gary") fehl.push(`${titel}: im Raum stehen „${namen}“ statt nur Gary`);
    await pg.evaluate(() => { window.__towerTonTest = 1200; });   // Aufnahmen werden nur nachgestellt: 1,2 s, ohne Ton
    const stumm = () => pg.waitForFunction(() => !document.getElementById("buehne").dataset.ton, null, { timeout: 15000 });
    await pg.evaluate(() => window.__probe3d.halt(true));   // Figuren anhalten und in festen Schritten rechnen: kurze Gesten (Erschrecken 0,5 s) hängen sonst vom Tempo des Testrechners ab
    for (const m of ["reden", "verbeugen", "zaubern", "tadaa", "schreck", "rennen", "stehen"]) {
      await pg.click(`#figuren button[data-figur="${m}"]`); await pg.evaluate(() => window.__probe3d.takt(6, 16.7));
      if (!(await figuren()).every((g) => g.modus === m)) fehl.push(`${titel}: Gary kann nicht „${m}“`);
    }
    await pg.evaluate(() => window.__probe3d.halt(false));
    await pg.click('#figuren button[data-figur="gehen"]'); await pg.waitForTimeout(1500);
    if (!(await figuren()).every((g) => g.modus === "gehen" && g.weg > 0.05)) fehl.push(`${titel}: Gary geht nicht`);
    // Fehler 17.11.: beim Reden drehte sich der Kopf in den Körper, beim Verbeugen rotierte der Oberkörper wild – Winkel über die Zeit messen
    const messe = async (ms) => { const m = { k: 0, r: 0, h: 0 }; for (let z = 0; z < ms; z += 100) { await pg.evaluate(() => window.__probe3d.takt(6, 16.7)); const g = (await figuren())[0]; m.k = Math.max(m.k, g.kopfWinkel); m.r = Math.max(m.r, g.rumpfWinkel); m.h = Math.max(m.h, g.hutAbstand); } return m; };   // rechnet in Schritten wie bei 60 Bildern pro Sekunde, unabhängig vom Tempo des Testrechners
    await pg.click('#figuren button[data-figur="stehen"]'); await stumm();
    await pg.evaluate(() => { window.__towerTonTest = 6000; });
    await pg.click('#figuren button[data-figur="reden"]');
    let w = await messe(3000);
    if (w.k > 30 || w.r > 20 || w.h > 0.3) fehl.push(`${titel}: beim Reden dreht sich Gary zu weit (Kopf ${w.k}°, Rumpf ${w.r}°, Hut ${w.h} m neben den Füßen)`);
    await pg.click('#figuren button[data-figur="verbeugen"]');
    w = await messe(2600);
    if (w.r > 80 || w.r < 25 || w.k > 30) fehl.push(`${titel}: Verbeugung stimmt nicht (Rumpf ${w.r}°, erwartet 25–80°; Kopf ${w.k}°)`);
    await messe(800); w = await messe(500);
    if (w.r > 20 || w.k > 30) fehl.push(`${titel}: nach der Verbeugung steht Gary nicht wieder gerade (Rumpf ${w.r}°, Kopf ${w.k}°)`);
    // Schritt 1b (18.11.): Rennen ist schneller als Gehen · Zaubern macht Funken · Gesicht · Mund auf zwei Wegen · Aufnahmen werden zu Ende gesprochen
    const takt = async (n) => { await pg.evaluate((k) => window.__probe3d.takt(k, 16.7), n); return (await figuren())[0]; };
    await pg.click('#figuren button[data-figur="gehen"]'); const gehen = (await takt(90)).tempo;
    await pg.click('#figuren button[data-figur="rennen"]'); const rennen = (await takt(120)).tempo;
    if (!(gehen > 0.3 && rennen > gehen * 1.5)) fehl.push(`${titel}: Rennen (${rennen} m/s) ist nicht deutlich schneller als Gehen (${gehen} m/s)`);
    await pg.click('#figuren button[data-figur="zaubern"]');
    const funken = (await takt(60)).funken;
    if (funken < 5 || funken > 60) fehl.push(`${titel}: beim Zaubern fliegen ${funken} Funken (erwartet 5–60)`);
    await pg.click('#figuren button[data-figur="stehen"]');
    await stumm();                                          // die nachgestellte Aufnahme von oben muss fertig sein, sonst bewegt sie noch den Mund
    await pg.click('#figuren button[data-gesicht="erschrocken"]');
    let g = await takt(60);
    if (g.braue < 0.6 || g.mund < 0.5) fehl.push(`${titel}: Ausdruck „erschrocken“ kommt nicht an (Braue ${g.braue}, Mund ${g.mund})`);
    await pg.click('#figuren button[data-gesicht="froehlich"]');
    g = await takt(90);
    if (g.winkel < 0.8 || g.mund > 0.2 || g.zeigt !== "froehlich") fehl.push(`${titel}: Ausdruck „fröhlich“ (geschlossenes Lächeln) kommt nicht an (Mundwinkel ${g.winkel}, Mund ${g.mund})`);
    await pg.click('#figuren button[data-gesicht="lachen"]');
    g = await takt(90);
    if (g.winkel < 0.8 || g.mund < 0.4) fehl.push(`${titel}: Ausdruck „Lachen“ kommt nicht an (Mundwinkel ${g.winkel}, Mund ${g.mund})`);
    // unruhiger Blick (Profil Gary): die Pupillen springen und bleiben im Augenweiß (Blick −1…1 entspricht höchstens 12,5 mm Weg)
    await pg.click('#figuren button[data-gesicht="neutral"]');
    let bMin = 0, bMax = 0;
    for (let i = 0; i < 40; i++) { const b = (await takt(15)).blick; bMin = Math.min(bMin, b); bMax = Math.max(bMax, b); }
    if (bMax - bMin < 0.4 || bMax > 1.001 || bMin < -1.001) fehl.push(`${titel}: unruhiger Blick stimmt nicht (Pupillen zwischen ${bMin} und ${bMax}, erwartet Bewegung innerhalb −1…1)`);
    await pg.click('#figuren button[data-blick]');
    if (Math.abs((await takt(60)).blick) > 0.05) fehl.push(`${titel}: Schalter „Unruhiger Blick“ schaltet nicht aus`);
    await pg.click('#figuren button[data-blick]');
    await pg.click('#figuren button[data-gesicht="stolz"]');
    g = await takt(90);
    if (g.kinn < 0.02 || g.winkel < 0.4 || g.kopfWinkel > 30) fehl.push(`${titel}: Ausdruck „stolz“ kommt nicht an (Kinn ${g.kinn}, Mundwinkel ${g.winkel}, Kopf ${g.kopfWinkel}°)`);
    await pg.click('#figuren button[data-gesicht="neutral"]');
    await pg.click('#figuren button[data-figur="tadaa"]');   // nach dem Ta-daa! bleibt Gary zwei Sekunden stolz stehen
    g = await takt(115);
    if (g.zeigt !== "stolz") fehl.push(`${titel}: nach dem Ta-daa! zeigt Gary „${g.zeigt}“ statt „stolz“`);
    // PROBE A3/A4 (18.11.): gestreckter Körper mit Händen neben Gary – Kasten mit allen Bewegungen, Hände-Schalter, Regler für die Maße
    const bau = () => pg.evaluate(() => window.__probe3d.bau()), bauTakt = async (n) => { await pg.evaluate((k) => window.__probe3d.bauTakt(k, 16.7), n); return bau(); };
    const regler = (name, wert) => pg.evaluate(([n, w]) => { const r = document.querySelector('#bau input[data-mass="' + n + '"]'); r.value = String(w); r.dispatchEvent(new Event("input", { bubbles: true })); }, [name, wert]);
    let b = await bau();
    // Teil C, Schritt 1 (18.11.): Sergeant Bearskin steht im Raum (Kopf mit Bart, Wahl Mr. Alex) – gestreckter Knight, eigener Kopf mit Gesicht, grimmig, Füße am Boden
    const sgt = await pg.evaluate(() => window.__probe3d.sergeant());
    if (sgt.length !== 1) fehl.push(`${titel}: es stehen ${sgt.length} Sergeants im Raum statt einem`);
    for (const [i, z] of sgt.entries()) {
      if (!z.kopf || !["braue_l", "lid_l", "kiefer", "oberlippe"].every((n) => z.kopf.teile.includes(n))) fehl.push(`${titel}: Sergeant ${i + 1} hat kein bewegliches Gesicht`);
      else if (z.kopf.ausdruck !== "grimmig") fehl.push(`${titel}: Sergeant ${i + 1} schaut „${z.kopf.ausdruck}“ statt grimmig`);
      if (Math.abs(z.bau.bein - 3.3) > 0.01 || Math.abs(z.bau.rumpf - 1.3) > 0.01 || !(z.hals > 1.4)) fehl.push(`${titel}: Sergeant ${i + 1} ist keine lange Bohnenstange (Bein ${z.bau.bein}, Rumpf ${z.bau.rumpf}, Hals ${z.hals} m)`);
      if (Math.abs(z.tief) > 0.01) fehl.push(`${titel}: Sergeant ${i + 1} steht nicht auf dem Boden (${z.tief} m)`);
    }
    // Kein Kragen (Mr. Alex 19.11., Standard für alle Figuren): Kragenflächen gelöscht, Schulterkappe geschlossen, der Hals gehört zum Kopf.
    // Mund (19.11.): die Haut unter der Unterlippe reicht seitlich bis unter die Wange – sonst bleibt neben dem Mundwinkel ein Spalt.
    for (const [wer, z, breit] of [["Mr. Flex", await pg.evaluate(() => window.__probe3d.bau()), 0.14], ["der Sergeant", sgt[0], 0.11]]) {
      const k = z && z.ohneKragen;
      if (!k || !(k.geloescht > 20 && k.rand >= 8)) fehl.push(`${titel}: ${wer} hat noch einen Kragen (${JSON.stringify(k)})`);
      // Schulterlinie (Standard, Mr. Alex 19.11.): sichtbarer Hals, Schultern tiefer und breiter als der Hals – die Arme wachsen nicht aus dem Hals; schlanke Figuren sind gebaut, nicht gequetscht
      const sl = z && z.schulterLinie;
      if (!sl || !(sl.hals >= 0.22) || !(sl.breit >= 0.16)) fehl.push(`${titel}: bei ${wer} setzen die Schultern zu hoch oder zu eng an (Kopf ${sl && sl.hals} über den Schultergelenken, halbe Breite ${sl && sl.breit}; Soll mindestens 0,22 und 0,16)`);
      if (sl && sl.gequetscht) fehl.push(`${titel}: ${wer} ist gequetscht statt schlank gebaut (verzerrt gedrehte Glieder, die Hand zuckt beim Salutieren)`);
      else { if (!k.hals) fehl.push(`${titel}: ${wer} hat ohne Kragen keinen Hals`); if (!(k.mundHaut >= breit)) fehl.push(`${titel}: bei ${wer} reicht die Haut neben dem Mund nicht bis zur Wange (${k.mundHaut} m) – Spalt am Mundwinkel`); }
    }
    // Stramme Haltung (Mr. Alex 19.11.): Im Stehen hängen die Arme des Sergeants gestreckt an der Hosennaht, die Beine sind gestreckt – nicht breitarmig, keine durchgedrückten Knie.
    if (sgt[0] && sgt[0].modus === "stehen") {
      const z = sgt[0], weit = Math.hypot(z.faustR[0] - z.faustL[0], z.faustR[2] - z.faustL[2]), tief = Math.max(z.faustR[1], z.faustL[1]);
      if (!(weit < 0.45) || !(tief < z.hals - 0.5)) fehl.push(`${titel}: der Sergeant steht nicht stramm – die Hände sind ${weit.toFixed(2)} m auseinander (höchstens 0,45) und ${(z.hals - tief).toFixed(2)} m unter dem Hals (mindestens 0,5)`);
      if (!(Math.min(...z.knieGrad) > 168)) fehl.push(`${titel}: der Sergeant steht nicht mit gestreckten Beinen (Knie ${z.knieGrad.join(" und ")} Grad, Soll über 168)`);
    }
    // Beine nebeneinander (Mr. Alex 19.11.: „die Beine dürfen nicht ineinandergreifen oder sich verschlingen“): Im Stehen bleibt zwischen den Beinen in jeder
    // Höhe eine Lücke – gemessen an den verformten Netzen. (Die Ringe am Knie saßen versetzt, die Knie griffen 5 cm ineinander, obwohl die Knochen richtig standen.)
    for (const [wer, z] of [["Mr. Flex", await pg.evaluate(() => window.__probe3d.bau())], ["der Sergeant", sgt[0]]]) {
      const b = z && z.modus === "stehen" && z.beine;
      if (b && !(b.luecke >= 0.02)) fehl.push(`${titel}: bei ${wer} greifen die Beine im Stehen ineinander (Lücke von unten nach oben: ${b.luecken.join(", ")} m; Soll überall mindestens 0,02)`);
      else if (z && z.modus === "stehen" && !b) fehl.push(`${titel}: bei ${wer} lässt sich die Lücke zwischen den Beinen nicht messen`);
    }
    // Kinnkette der Fellmütze (19.11.): goldene Glieder am Kopf; öffnet er den Mund, geht das Glied am Kinn mit dem Unterkiefer nach unten
    if (sgt[0] && !(sgt[0].kette && sgt[0].kette.zahl > 20)) fehl.push(`${titel}: der Sergeant hat keine Kinnkette`);
    else if (sgt[0]) {
      const zu = sgt[0].kette.kinn; await pg.evaluate(() => window.__probe3d.sergeantMund([1, 0.5]));
      const mit = await pg.waitForFunction((y) => window.__probe3d.sergeant()[0].kette.kinn < y - 0.004, zu, { timeout: 8000 }).then(() => true).catch(() => false);
      if (!mit) fehl.push(`${titel}: die Kinnkette geht beim Sprechen nicht mit dem Unterkiefer mit`);
      await pg.evaluate(() => window.__probe3d.sergeantMund(null));
    }
    const knoepfe = await pg.locator("#bau button[data-bau]").count();
    if (knoepfe !== 29) fehl.push(`${titel}: im Probe-Kasten stehen ${knoepfe} Bewegungen statt 29 (26 eigene + Stehen, Gehen, Rennen)`);
    const kaesten = await pg.evaluate(() => ["bau", "figuren"].map((id) => { const r = document.getElementById(id).getBoundingClientRect(); return [r.left, r.right, r.top, r.bottom]; }));
    if (kaesten[0][1] > kaesten[1][0] && kaesten[0][3] > kaesten[1][2] && kaesten[0][2] < kaesten[1][3]) fehl.push(`${titel}: der Kasten der Probe-Figur liegt über Garys Kasten`);
    const klappe = pg.locator("#bau .kopf"), klappbar = await klappe.isVisible();   // schmale Bildschirme: der Kasten ist eingeklappt und ersetzt offen Garys Kasten
    if (klappbar) { await klappe.click(); if (await pg.locator("#figuren").isVisible()) fehl.push(`${titel}: der offene Probe-Kasten verdeckt Garys Kasten nicht sauber`); }
    // Figur wählen (19.11.): mit „Sergeant“ gelten die Knöpfe des Kastens für ihn, Mr. Flex bleibt stehen; danach zurück zu Mr. Flex
    if (sgt[0]) {
      await pg.click('#bau button[data-wahl="sergeant"]'); await pg.click('#bau button[data-bau="gehen"]');
      const geht = await pg.waitForFunction(() => window.__probe3d.sergeant()[0].modus === "gehen" && window.__probe3d.bau().modus === "stehen", null, { timeout: 8000 }).then(() => true).catch(() => false);
      if (!geht) fehl.push(`${titel}: mit der Auswahl „Sergeant“ steuern die Knöpfe nicht den Sergeant`);
      // Drill-Gang (19.11., Figurenblatt: britischer Drill – Knie hoch, Arme gestreckt bis Schulterhöhe, nie mit durchgestreckten Beinen) und Beine nebeneinander:
      // über mehrere Schritte bleibt zwischen den Beinen eine Lücke (Mr. Alex: „die Beine dürfen nicht ineinandergreifen oder sich verschlingen“).
      if (geht) {
        let luecke = 9, armVorn = -99, armHinten = 99, knie = 0, krumm = 180, beuge = 180;
        for (let k = 0; k < 24; k++) { await pg.waitForTimeout(70); const z = (await pg.evaluate(() => window.__probe3d.sergeant()))[0]; if (!z.drill || z.drill.an < 0.9) continue;
          luecke = Math.min(luecke, z.beine.luecke); armVorn = Math.max(armVorn, z.drill.armR); armHinten = Math.min(armHinten, z.drill.armR); knie = Math.max(knie, z.drill.knieHoch); krumm = Math.min(krumm, z.drill.ellbogen); beuge = Math.min(beuge, ...z.knieGrad); }
        if (!(luecke >= 0.015)) fehl.push(`${titel}: beim Drill-Gang greifen die Beine des Sergeants ineinander (kleinste Lücke ${luecke} m, Soll mindestens 0,015)`);
        if (!(armVorn > 70 && armHinten < -15)) fehl.push(`${titel}: beim Drill-Gang schwingen die Arme nicht bis Schulterhöhe (vorn ${armVorn}°, hinten ${armHinten}°; Soll über 70 und unter −15)`);
        if (!(krumm > 160)) fehl.push(`${titel}: beim Drill-Gang sind die Arme nicht gestreckt (Ellbogen ${krumm}°, Soll über 160)`);
        if (!(knie > 0.8)) fehl.push(`${titel}: beim Drill-Gang hebt der Sergeant das Knie nicht hoch (höchstes Knie auf ${knie} der Hüfthöhe, Soll über 0,8)`);
        if (!(beuge < 120)) fehl.push(`${titel}: beim Drill-Gang beugt der Sergeant das Knie kaum (kleinster Kniewinkel ${beuge}°) – wirkt wie ein Stechschritt`);
      }
      await pg.click('#bau button[data-bau="stehen"]'); await pg.click('#bau button[data-wahl="flex"]');
    }
    if (!(b.hals > 1.1)) fehl.push(`${titel}: Probe-Figur ist nicht gestreckt (Hals in ${b.hals} m Höhe, ungestreckt 0,785)`);
    if (b.stiefelOben > b.knie - 0.05) fehl.push(`${titel}: die Stiefel der Probe-Figur enden nicht unter dem Knie (Stiefelkante ${b.stiefelOben} m, Knie ${b.knie} m)`);
    await pg.evaluate(() => window.__probe3d.halt(true));   // kurz und mit angehaltener Zeit messen – sonst ist die Figur nach einmal Hin und Zurück wieder am Start
    await pg.click('#bau button[data-bau="gehen"]'); b = await bauTakt(40);
    await pg.evaluate(() => window.__probe3d.halt(false));
    if (!(b.modus === "gehen" && b.weg > 0.3)) fehl.push(`${titel}: Probe-Figur geht nicht (Weg ${b.weg} m)`);
    await pg.click('#bau button[data-bau="kick"]');
    let hoch = 0, faust = false; for (let k = 0; k < 22; k++) { const x = await bauTakt(3); hoch = Math.max(hoch, x.zehe); faust = faust || x.hand[0] === "faust"; }
    if (hoch < b.hals * 0.8) fehl.push(`${titel}: der Kick der Probe-Figur bleibt niedrig (Fußspitze ${hoch} m, Hals ${b.hals} m)`);
    if (!faust) fehl.push(`${titel}: beim Kick ballt die Probe-Figur keine Faust`);
    b = await bauTakt(60);
    if (b.modus !== "stehen" || b.hand[0] !== "offen") fehl.push(`${titel}: nach dem Kick steht die Probe-Figur nicht wieder mit offenen Händen (${b.modus}, ${b.hand})`);
    await pg.click('#bau button[data-bau="zeigen"]'); b = await bauTakt(25);   // die Handform wechselt mit der Geste: rechts Zeigefinger, links offen
    if (b.hand[0] !== "zeigen" || b.hand[1] !== "offen") fehl.push(`${titel}: beim Zeigen streckt die Probe-Figur den Zeigefinger nicht aus (Hände ${b.hand})`);
    await pg.click('#bau button[data-bau="mabu"]'); b = await bauTakt(50);     // Ma Bu: beide Fäuste gleich hoch und gleich weit vorn
    if (Math.abs(b.faustR[1] - b.faustL[1]) > 0.06 || Math.abs(b.faustR[2] - b.faustL[2]) > 0.06) fehl.push(`${titel}: im Ma Bu sind die Fäuste nicht parallel (rechts ${b.faustR}, links ${b.faustL})`);
    for (const bein of [3, 4]) {                                                 // tiefe Haltungen: der tiefste Punkt der Figur liegt nie unter dem Boden, bei jedem Maß
      await regler("bein", bein);
      for (const pose of ["spagat", "pubu", "mabu", "xubu", "rolle"]) {
        await pg.click(`#bau button[data-bau="${pose}"]`);
        let unten = 0; for (let k = 0; k < 12; k++) unten = Math.min(unten, (await bauTakt(5)).tief);
        if (unten < -0.01) fehl.push(`${titel}: Probe-Figur versinkt bei „${pose}“ im Boden (${unten} m, Bein ${bein})`);
        await pg.click('#bau button[data-bau="stehen"]'); await bauTakt(15);
      }
      b = await bau();
      if (b.stiefelOben > b.knie - 0.05) fehl.push(`${titel}: bei Bein ${bein} enden die Stiefel nicht unter dem Knie (Stiefelkante ${b.stiefelOben} m, Knie ${b.knie} m)`);
    }
    // A5: Knie in der Mitte, Handziele (Berührung statt Durchdringen), Finger rollen weich ein, Bizeps wächst
    b = await bau();
    if (Math.abs(b.knieAnteil - 0.56) > 0.02) fehl.push(`${titel}: das Knie der Probe-Figur liegt bei ${b.knieAnteil} der Hüfthöhe statt bei 0,56`);
    await regler("knie", 0.45);
    if (Math.abs((await bau()).knieAnteil - 0.45) > 0.02) fehl.push(`${titel}: der Regler „Knie“ ändert die Kniehöhe nicht`);
    await regler("knie", 0.56);
    await pg.evaluate(() => window.__probe3d.halt(true));   // für die genauen Messungen läuft die Zeit nur im Takt des Tests
    await pg.click('#bau button[data-bau="klatschen"]');
    let nah = 9, weit = 0; for (let k = 0; k < 26; k++) { const x = await bauTakt(3); if (k > 6 && k < 20) { nah = Math.min(nah, x.handAbstand); weit = Math.max(weit, x.handAbstand); } }
    if (nah < 0.05 || nah > 0.14 || weit < 0.2) fehl.push(`${titel}: beim Klatschen treffen sich die Handflächen nicht (Abstand ${nah} bis ${weit}; Berührung bei etwa 0,08)`);
    await bauTakt(30);
    await pg.click('#bau button[data-bau="hueften"]'); b = await bauTakt(55);
    if (Math.abs(b.flaecheR[0]) < 0.37 || Math.abs(b.flaecheL[0]) < 0.37) fehl.push(`${titel}: „Hände in die Hüften“ greift in die Kleidung (Handflächen bei ${b.flaecheR[0]} und ${b.flaecheL[0]}, Kleidung reicht bis 0,39)`);
    await pg.click('#bau button[data-bau="stehen"]'); await bauTakt(40);
    await pg.click('#bau button[data-hand="faust"]'); b = await bauTakt(4);
    if (!(b.krall > 0.05 && b.krall < 0.9)) fehl.push(`${titel}: die Finger springen zur Faust statt einzurollen (nach vier Bildern ${b.krall})`);
    b = await bauTakt(50);
    if (b.krall < 0.95) fehl.push(`${titel}: die Faust schließt sich nicht ganz (${b.krall})`);
    await pg.click('#bau button[data-hand="offen"]');
    await pg.click('#bau button[data-bau="bizeps"]');
    let dick = 0; for (let k = 0; k < 20; k++) dick = Math.max(dick, (await bauTakt(4)).muskel);
    if (dick < 0.17) fehl.push(`${titel}: bei der Bizeps-Pose wächst kein Bizeps (${dick})`);
    await pg.click('#bau button[data-bau="stehen"]'); await bauTakt(30);
    // A6 – WICHTIG (Mr. Alex 18.11.): High five ist eine Hand neben dem Kopf, Finger nach oben, Ellbogen angewinkelt – nie ein gestreckter Arm
    await pg.click('#bau button[data-bau="highfive"]');
    let gestreckt = 0, schief = 0; for (let k = 0; k < 24; k++) { const x = await bauTakt(3); gestreckt = Math.max(gestreckt, x.armR.ellbogen); if (k > 7 && k < 17) schief = Math.max(schief, x.armR.fingerHoch); }
    if (gestreckt > 150) fehl.push(`${titel}: beim High five streckt die Probe-Figur den Arm durch (Ellbogen ${gestreckt}°, erlaubt höchstens 150°)`);
    if (schief > 25) fehl.push(`${titel}: beim High five zeigen die Finger nicht nach oben (${schief}° zur Senkrechten)`);
    await bauTakt(30);
    const gruss = await pg.evaluate(() => window.__probe3d.bauGruss());   // alle Bewegungen: kein durchgestreckter Arm schräg nach vorn oben mit flacher Hand
    if (gruss.length) fehl.push(`${titel}: Bewegung kann wie ein Gruß mit gestrecktem Arm wirken: ${gruss.map((x) => `${x.knopf} bei ${x.zeit} s`).join(", ")}`);
    for (const [pose, seiten] of [["mabu", ["R", "L"]], ["pubu", ["L"]], ["xubu", ["L"]]]) {   // Standposen: die Sohle liegt flach auf (Pu Bu, Xu Bu: das Standbein)
      await pg.click(`#bau button[data-bau="${pose}"]`); b = await bauTakt(50);
      for (const s of seiten) if (b["sohle" + s] > 8) fehl.push(`${titel}: bei „${pose}“ liegt die Sohle nicht flach auf (${s === "R" ? "rechts" : "links"} ${b["sohle" + s]}°)`);
      await pg.click('#bau button[data-bau="stehen"]'); await bauTakt(30);
    }
    // A7 (Mr. Alex 18.11.): Tasche und Buchhalter sind weg, das Knie hält im tiefen Knick sein Volumen, der Standfuß gleitet nicht
    if (!(b.kleidung > 200)) fehl.push(`${titel}: die Probe-Figur trägt Gürteltasche und Buchhalter noch (eingezogene Punkte: ${b.kleidung})`);
    await pg.click('#bau button[data-bau="denken"]'); b = await bauTakt(70);
    if (!(b.flaecheL[2] > 0.42)) fehl.push(`${titel}: beim Nachdenken liegt die linke Hand nicht mit Abstand vor dem Bauch (Tiefe ${b.flaecheL[2]}, verlangt über 0,42)`);
    await pg.click('#bau button[data-bau="stehen"]'); await bauTakt(30);
    for (const [pose, mindestens] of [["pubu", 0.8], ["mabu", 0.8], ["xubu", 0.8], ["spagat", 0.8], ["rolle", 0.8], ["kick", 0.7]]) {   // A8: zwei Ringe am Knie (abgeschrägte Ecke); beim Kick ist das Knie ganz gefaltet, dort reicht etwas weniger
      await pg.click(`#bau button[data-bau="${pose}"]`); let duenn = 9;
      for (let k = 0; k < 40; k++) { b = await bauTakt(3); if (b.modus !== pose) break; duenn = Math.min(duenn, b.knieDick); }
      if (duenn < mindestens) fehl.push(`${titel}: bei „${pose}“ wird das Bein am Knie zu dünn (${Math.round(duenn * 100)} % der Dicke, verlangt ${mindestens * 100} %)`);
      await pg.click('#bau button[data-bau="stehen"]'); await bauTakt(30);
    }
    // Rundkurs (Mr. Alex 18.11.): Rennen auf langer Strecke – die Probe-Figur läuft im Raum im Kreis und dreht nicht nach zwei, drei Schritten um
    await pg.click('#bau button[data-bau="rennen"]'); await bauTakt(45);
    { let lang = 0, wenden = 0, vor = null, rund = true;
      for (let k = 0; k < 90; k++) { const x = await bauTakt(2); if (vor) lang += Math.hypot(x.ort[0] - vor[0], x.ort[1] - vor[1]); vor = x.ort; if (x.wendet) wenden++; rund = rund && x.runde; }
      if (!rund || lang < 14 || wenden > 0) fehl.push(`${titel}: beim Rennen läuft die Probe-Figur keine lange Strecke am Stück (Rundkurs ${rund}, ${lang.toFixed(1)} m in 3 Sekunden, ${wenden} Bilder mit Wenden)`); }
    await pg.click('#bau button[data-bau="stehen"]'); await bauTakt(30);
    await pg.evaluate(() => window.__probe3d.bauBahn(60));                        // lange Strecke: ohne Wenden messen
    for (const [art, anteil, ruckMax] of [["gehen", 0.6, 0.006], ["rennen", 0.28, 0.016]]) {   // A8: beim Rennen längerer Bodenkontakt; die Hüfte läuft ohne Ruck
      await pg.click(`#bau button[data-bau="${art}"]`); await bauTakt(30);
      const reihe = []; for (let k = 0; k < 130; k++) reihe.push(await bauTakt(1));
      const tiefK = Math.min(...reihe.flatMap((x) => [x.fussL[0][0], x.fussR[0][0]])), tiefZ = Math.min(...reihe.flatMap((x) => [x.fussL[1][0], x.fussR[1][0]]));
      let rutsch = 0, fest = 0, schwebt = 0, auf = 0, knieStand = 180, knieLuft = 180;
      for (let k = 1; k < reihe.length; k++) for (const s of ["L", "R"]) {
        const [vor, nun] = [reihe[k - 1], reihe[k]].map((x) => ({ fest: x["stand" + s], knoechel: x["fuss" + s][0], zehen: x["fuss" + s][1], ferse: x["ferse" + s], knie: x.knieGrad[s === "L" ? 0 : 1] }));
        const flach = (f) => f.knoechel[0] < tiefK + 0.01 && f.zehen[0] < tiefZ + 0.005;                  // der Fuß liegt flach auf dem Boden (unabhängig von der Meldung „fest“)
        const unten = { ferse: (f) => f.ferse[0] < 0.012, zehen: (f) => f.zehen[0] < tiefZ + 0.005 };
        if (art === "gehen") {                                                                            // A9: der Fuß rollt ab – fest ist der Punkt, der gerade aufliegt (Ferse, dann Ballen)
          for (const teil of ["ferse", "zehen"]) if (vor.fest && nun.fest && unten[teil](vor) && unten[teil](nun)) rutsch = Math.max(rutsch, Math.abs(nun[teil][1] - vor[teil][1]));
          if (nun.fest && !unten.ferse(nun) && !unten.zehen(nun)) schwebt++;
          if (flach(vor) && flach(nun)) rutsch = Math.max(rutsch, Math.abs(nun.knoechel[1] - vor.knoechel[1]));
          if (!vor.fest && nun.fest) { auf++; if (nun.knie < 150) fehl.push(`${titel}: beim Gehen setzt der Fuß mit gebeugtem Knie auf (${nun.knie}°, verlangt mind. 150 – sonst wirkt der Gang stampfig)`);
            if (!(unten.ferse(nun) && nun.zehen[0] > tiefZ + 0.02)) fehl.push(`${titel}: beim Gehen setzt der Fuß nicht mit der Ferse zuerst auf (Ferse ${nun.ferse[0]}, Zehen ${nun.zehen[0]} hoch)`); }
          if (vor.fest && !nun.fest && !(vor.ferse[0] > 0.04 && unten.zehen(vor))) fehl.push(`${titel}: beim Gehen drückt sich der Fuß nicht über den Ballen ab (Ferse ${vor.ferse[0]}, Zehen ${vor.zehen[0]} hoch)`);
          if (nun.fest) knieStand = Math.min(knieStand, nun.knie); else knieLuft = Math.min(knieLuft, nun.knie);
        } else if ((vor.fest && nun.fest) || (flach(vor) && flach(nun))) rutsch = Math.max(rutsch, Math.abs(nun.knoechel[1] - vor.knoechel[1]));
        if (nun.fest) fest++;
      }
      if (rutsch > 0.012) fehl.push(`${titel}: beim ${art === "gehen" ? "Gehen" : "Rennen"} gleitet der Standfuß der Probe-Figur über den Boden (${Math.round(rutsch * 1000)} mm in einem Bild, erlaubt 12)`);
      if (art === "gehen") {
        if (auf < 2) fehl.push(`${titel}: beim Gehen wurde kein Aufsetzen eines Fußes gemessen`);
        if (schwebt > 0) fehl.push(`${titel}: beim Gehen liegt der Standfuß in ${schwebt} Bildern weder mit der Ferse noch mit dem Ballen auf`);
        if (!(knieLuft < 130 && knieStand >= 130)) fehl.push(`${titel}: beim Gehen soll das Knie vor allem in der Schwungphase beugen (kleinster Kniewinkel in der Luft ${knieLuft}°, am Boden ${knieStand}°)`);
      }
      if (fest / reihe.length < anteil) fehl.push(`${titel}: beim ${art === "gehen" ? "Gehen" : "Rennen"} steht zu selten ein Fuß fest am Boden (${fest} von ${reihe.length} Bildern)`);
      let ruck = 0; for (let k = 2; k < reihe.length; k++) ruck = Math.max(ruck, Math.abs(reihe[k].huefte - 2 * reihe[k - 1].huefte + reihe[k - 2].huefte));
      if (ruck > ruckMax) fehl.push(`${titel}: beim ${art === "gehen" ? "Gehen" : "Rennen"} ruckt die Hüfte der Probe-Figur (Sprung von ${(ruck * 1000).toFixed(1)} mm zwischen zwei Bildern, erlaubt ${ruckMax * 1000})`);
      const strecke = reihe[reihe.length - 1].weg - reihe[0].weg, soll = reihe[0][art] * (reihe.length - 1) * 0.0167;
      if (Math.abs(strecke - soll) > 0.1 * soll) fehl.push(`${titel}: beim ${art === "gehen" ? "Gehen" : "Rennen"} passt der Weg (${strecke.toFixed(2)} m) nicht zum Tempo (${soll.toFixed(2)} m)`);
    }
    await pg.click('#bau button[data-bau="stehen"]'); await bauTakt(30);
    await pg.evaluate(() => window.__probe3d.bauBahn(0));                         // zurück auf die Bahn im Raum
    // A8 (Mr. Alex 18.11.): Ma Bu unter dem Kragen, Fußwippen wippt, nichts durch die Hutkrempe, Ellbogen hält sein Volumen, Hände außen herum an die Hüften
    const ganz = async (knopf, lies) => {                                        // spielt eine Geste ganz durch und sammelt je Bild einen Wert
      await pg.click(`#bau button[data-bau="${knopf}"]`); const werte = [];
      for (let k = 0; k < 90; k++) { const x = await bauTakt(2); if (x.modus !== knopf) break; werte.push(lies(x)); }
      await pg.click('#bau button[data-bau="stehen"]'); await bauTakt(30); return werte;
    };
    // A9 (Mr. Alex 18.11.): Hut von Mr. Flex – Zipfel steht spitz nach oben, Krempe fällt in einer Rundung ab, kein Band, eigene matte Farbe
    const hm = (await bauTakt(1)).hutMass;
    if (!hm || hm.hoch < 1.2 || hm.hinten > 0.2) fehl.push(`${titel}: der Zipfel am Hut der Probe-Figur steht nicht nach oben (${JSON.stringify(hm)}; verlangt Höhe ab 1,2, höchstens 0,2 hinter der Achse)`);
    else if (hm.band || !hm.eigeneFarbe) fehl.push(`${titel}: der Hut der Probe-Figur hat noch Band oder die alte Farbe (${JSON.stringify(hm)})`);
    else if (!(hm.bogen > 0.02 && hm.faellt > 0.1)) fehl.push(`${titel}: die Hutkrempe der Probe-Figur ist eine gerade Scheibe statt einer abfallenden Rundung (${JSON.stringify(hm)})`);
    // Kopf-Probe Mr. Flex (18.11.): eigener Kopf mit dem gemeinsamen Gesichtsaufbau und der neuen Iris, Ausdrücke, Sonnenbrille, Funkeln
    const kopfKlick = async (was, takte) => { await pg.click(`#bau button[data-kopf="${was}"]`); return (await bauTakt(takte)).kopf; };
    let kf = (await bauTakt(1)).kopf;
    const fehlt = ["braue_l", "braue_r", "lid_l", "lid_r", "unterlid_l", "unterlid_r", "pupille_l", "pupille_r", "iris_l", "iris_r", "wange_l", "wange_r", "mund", "kiefer", "oberlippe", "mundlinie", "zaehne"].filter((n) => !kf || !kf.teile.includes(n));
    if (!kf || fehlt.length || !kf.brilleDa) fehl.push(`${titel}: dem Kopf von Mr. Flex fehlen Gesichtsteile oder die Sonnenbrille (${fehlt.join(", ") || "Brille"})`);
    else {
      kf = await kopfKlick("schelmisch", 50);
      if (!(kf.winkel > 0.8 && kf.unterlid > 0.4)) fehl.push(`${titel}: „Schelmisch“ zeigt kein Grinsen mit schmalen Augen (Mundwinkel ${kf.winkel}, Unterlid ${kf.unterlid})`);
      kf = await kopfKlick("geheimnisvoll", 50);
      if (!(kf.braue < -0.4 && kf.winkel < 0.4)) fehl.push(`${titel}: „Ernst-geheimnisvoll“ hat keine tiefen Brauen (Brauen ${kf.braue}, Mundwinkel ${kf.winkel})`);
      kf = await kopfKlick("brille_unten", 50);
      if (!(kf.brille > 0.4 && kf.brille < 0.6)) fehl.push(`${titel}: „Brille herunter“ schiebt die Sonnenbrille nicht auf die Nase (${kf.brille})`);
      const hoehepunkt = async (was) => { await pg.click(`#bau button[data-kopf="${was}"]`); let best = { funkeln: 0 }; for (let k = 0; k < 40; k++) { const x = (await bauTakt(2)).kopf; if (x.funkeln > best.funkeln) best = x; } return best; };
      let fu = await hoehepunkt("protzen");
      if (!(fu.funkeln > 0.5 && !fu.durchBrille && fu.brille < 0.2)) fehl.push(`${titel}: „Brille ab + Funkeln“ – die Augen funkeln nicht ohne Brille (${JSON.stringify(fu)})`);
      fu = await hoehepunkt("magisch");
      if (!(fu.funkeln > 0.5 && fu.durchBrille)) fehl.push(`${titel}: „Funkeln durch die Brille“ funkelt nicht durch die Gläser (${JSON.stringify(fu)})`);
      await kopfKlick("neutral", 20);
      // Reden mit Lippenbewegung und Gestik (Mr. Alex 18.11.): der Mund folgt der Aufnahme, der Kiefer klappt auf, an den Einsätzen kommen Gesten
      await pg.waitForFunction(() => !document.getElementById("buehne").dataset.ton, null, { timeout: 15000 }).catch(() => {});   // eine frühere Aufnahme zu Ende „sprechen“ lassen, sonst wartet diese
      const tonVorher = await pg.evaluate(() => { const alt = window.__towerTonTest; window.__towerTonTest = 4000; return alt; });
      const gestenVor = (await bauTakt(1)).kopf.redeGesten;   // vor dem Klick lesen: die erste Geste beginnt gleich mit dem ersten Wort
      await pg.click('#bau button[data-kopfrede="gestik"]');
      let mundMax = 0, gesten = 0, lippeMax = 0, nickMax = 0;
      for (let k = 0; k < 140 && !(gesten >= 1 && mundMax >= 0.2 && lippeMax > 0.3 && nickMax > 1); k++) { const x = (await bauTakt(2)).kopf; mundMax = Math.max(mundMax, x.mund); lippeMax = Math.max(lippeMax, x.rund, x.breit); nickMax = Math.max(nickMax, x.nick); gesten = x.redeGesten - gestenVor; await pg.waitForTimeout(25); }
      if (lippeMax <= 0.3) fehl.push(`${titel}: beim Reden formen die Lippen von Mr. Flex keine Laute (weder gespitzt noch breit, größter Wert ${lippeMax})`);
      if (nickMax <= 1) fehl.push(`${titel}: beim Reden bewegt Mr. Flex den Kopf nicht (${nickMax}°)`);
      if (mundMax < 0.2) fehl.push(`${titel}: beim Reden bewegt Mr. Flex den Mund nicht (größte Öffnung ${mundMax})`);
      if (gesten < 1) fehl.push(`${titel}: bei „Reden mit Gestik“ macht Mr. Flex keine Geste`);
      await pg.waitForFunction(() => !document.getElementById("buehne").dataset.ton, null, { timeout: 12000 }).catch(() => {});
      await pg.evaluate((alt) => { window.__towerTonTest = alt; }, tonVorher);
      await pg.click('#bau button[data-bau="stehen"]'); await bauTakt(40);
      const ruhe = (await bauTakt(1)).kopf;
      if (ruhe.mund > 0.05 || ruhe.nick > 0.5) fehl.push(`${titel}: nach dem Reden bleibt der Mund von Mr. Flex offen oder der Kopf nickt weiter (Mund ${ruhe.mund}, Kopf ${ruhe.nick}°)`);
    }
    const kopfDatei = fs.statSync(path.join(__dirname, "..", "app", "tower", "figuren", "flex_teile.glb")).size;
    if (kopfDatei > 1e6) fehl.push(`${titel}: die Kopf-Datei von Mr. Flex ist größer als 1 MB (${Math.round(kopfDatei / 1000)} KB)`);
    const zehen = await ganz("wippen", (x) => x.zehe);
    if (Math.max(...zehen) - Math.min(...zehen) < 0.05) fehl.push(`${titel}: beim Fußwippen bewegt sich der Fuß nicht (Zehen heben sich nur ${Math.round((Math.max(...zehen) - Math.min(...zehen)) * 1000)} mm)`);
    await pg.click('#bau button[data-bau="mabu"]'); b = await bauTakt(50);
    for (const s of ["R", "L"]) if (!(b["hoch" + s][1] < b["hoch" + s][0] - 0.2 && b["hoch" + s][2] < b["hoch" + s][0] - 0.2)) fehl.push(`${titel}: im Ma Bu liegen die Arme nicht unter dem Kragen (Schulter, Ellbogen, Handgelenk ${s === "R" ? "rechts" : "links"}: ${b["hoch" + s].join(" / ")})`);
    await pg.click('#bau button[data-bau="stehen"]'); await bauTakt(30);
    for (const [knopf, erlaubt] of [["highfive", 0], ["salut", 0], ["mahnen", 0], ["bizeps", 0], ["abwinken", 0], ["stirn", 1], ["brille", 1]]) {   // Stirn und Brille: ein Finger liegt direkt unter der Krempe
      const hut = Math.max(...(await ganz(knopf, (x) => x.hut)));
      if (hut > erlaubt) fehl.push(`${titel}: bei „${knopf}“ geht die Hand durch den Hut der Probe-Figur (${hut} Messpunkte in Krempe oder Kappe)`);
    }
    for (const knopf of ["bizeps", "denken", "tee", "mabu", "highfive"]) {
      const arm = Math.min(...(await ganz(knopf, (x) => x.armDick)));
      if (arm < 0.9) fehl.push(`${titel}: bei „${knopf}“ wird der Arm am Ellbogen zu dünn (${Math.round(arm * 100)} % der Dicke, verlangt 90 %)`);
    }
    const mantel = Math.min(...(await ganz("hueften", (x) => Math.min(...["R", "L"].map((s) => (x["flaeche" + s][0] / 0.4) ** 2 + (x["flaeche" + s][2] / 0.34) ** 2)))));
    if (mantel < 1) fehl.push(`${titel}: bei „Hände in die Hüften“ geht eine Hand auf dem Weg durch den Mantel (Maß ${mantel.toFixed(2)}, außerhalb ab 1)`);
    await pg.evaluate(() => window.__probe3d.halt(false));
    await pg.click('#bau button[data-hand="zeigen"]');
    if ((await bau()).wahl !== "zeigen") fehl.push(`${titel}: Hände der Probe-Figur lassen sich nicht wechseln`);
    await pg.click('#bau button[data-hand="offen"]');
    const lang = (await bauTakt(30)).hals;
    await regler("bein", 1); b = await bauTakt(30);
    if (!(b.hals < lang - 0.1) || b.bau.bein !== 1) fehl.push(`${titel}: der Regler „Bein“ ändert die Probe-Figur nicht (Hals ${lang} → ${b.hals} m)`);
    if ((await pg.evaluate(() => document.querySelector('#bau input[data-mass="bein"]').parentElement.querySelector("output").textContent)) !== "1,00") fehl.push(`${titel}: der Regler „Bein“ zeigt seine Zahl nicht an`);
    await regler("bein", 3);
    if (klappbar) { await klappe.click(); if (!(await pg.locator("#figuren").isVisible())) fehl.push(`${titel}: nach dem Einklappen des Probe-Kastens fehlt Garys Kasten`); }
    g = await takt(240);
    if (g.braue > 0.1 || g.mund > 0.1) fehl.push(`${titel}: Gesicht geht nicht auf „neutral“ zurück (Braue ${g.braue}, Mund ${g.mund})`);
    await stumm();
    await pg.evaluate(() => { window.__towerTonTest = 1500; });
    for (const art of ["mit Mundformen", "ohne Mundformen (Reserve Lautstärke)"]) {   // Mund beim Reden: Mundformen von Rhubarb; fehlen sie, folgt der Mund der Lautstärke
      await pg.evaluate((an) => window.__probe3d.mundformen(an), art === "mit Mundformen");
      await pg.click('#figuren button[data-figur="reden"]');
      let auf = 0;
      for (let i = 0; i < 12; i++) { auf = Math.max(auf, (await takt(3)).mund); await pg.waitForTimeout(80); }
      if (auf < 0.15) fehl.push(`${titel}: beim Reden (${art}) bewegt sich Garys Mund nicht (höchstens ${auf})`);
      await stumm();
      if ((await takt(40)).mund > 0.1) fehl.push(`${titel}: nach dem Reden (${art}) bleibt Garys Mund offen`);
    }
    await pg.evaluate(() => window.__probe3d.mundformen(true));
    // Gestik beim Reden (Machbarkeitsprobe): an den Satzanfängen der Aufnahme laufen Gesten für Oberkörper und Arme
    await pg.evaluate(() => { window.__towerTonTest = 4000; });
    await pg.click('#figuren button[data-figur="gestik"]');
    const vorGestik = (await figuren())[0].gesten;
    let gesten = 0;
    for (let i = 0; i < 50 && gesten < 2; i++) { gesten = (await takt(6)).gesten - vorGestik; await pg.waitForTimeout(100); }   // bis etwa 6 s: die Gesten kommen zur echten Zeit der Aufnahme; seit der Test-Browser mit Grafikkarte läuft (19.11.), waren 25 Runden vor dem zweiten Satzanfang vorbei
    if (gesten < 2) fehl.push(`${titel}: beim Reden mit Gestik laufen nur ${gesten} Gesten (erwartet mindestens 2)`);
    await stumm();
    // jede Gary-Aufnahme braucht vorab gerechnete Mundformen (wie beim Offline-Speicher: ein vergessener Rechenlauf soll auffallen)
    const formen = JSON.parse(fs.readFileSync(path.join(__dirname, "..", app.pfad, "tower", "figuren", "mund_gary.json"), "utf8"));
    const ohne = fs.readdirSync(path.join(__dirname, "..", app.pfad, "audio", "tower")).filter((d) => /^gary_.*\.mp3$/.test(d) && !formen[d.slice(0, -4)]);
    if (ohne.length) fehl.push(`${titel}: ${ohne.length} Gary-Aufnahmen ohne Mundformen (${ohne.slice(0, 4).join(", ")} …) – python werkzeuge/tower_lippen.py laufen lassen`);
    const ton = () => pg.evaluate(() => { const d = document.getElementById("buehne").dataset; return [d.ton || "", d.wartet || ""]; });
    await pg.evaluate(() => { window.__towerTonTest = 5000; });
    await pg.click('#figuren button[data-figur="reden"]'); const [erste] = await ton();
    await pg.click('#figuren button[data-figur="reden"]'); const [nochErste, wartet] = await ton();
    if (!erste || nochErste !== erste || !wartet || wartet === erste) fehl.push(`${titel}: die zweite Aufnahme schneidet die erste ab (läuft „${nochErste}“, wartet „${wartet}“)`);
    await pg.waitForFunction((w) => document.getElementById("buehne").dataset.ton === w, wartet, { timeout: 15000 }).catch(() => fehl.push(`${titel}: die wartende Aufnahme beginnt nicht, wenn die erste fertig ist`));
    await stumm();
    const ordner = path.join(__dirname, "..", app.pfad, "tower", "figuren");   // Körper und Bewegungen nur einmal, jede Datei unter 1 MB
    const raumGroesse = fs.statSync(path.join(__dirname, "..", app.pfad, "tower", "raum3d", "guardroom.glb")).size;   // Raumdatei verkleinert (werkzeuge/raum_verkleinern.js): vorher 14,7 MB
    if (raumGroesse > 6e6) fehl.push(`${titel}: raum3d/guardroom.glb hat ${(raumGroesse / 1e6).toFixed(1)} MB (höchstens 6 MB) – node werkzeuge/raum_verkleinern.js laufen lassen`);
    for (const d of fs.readdirSync(ordner)) if (d.endsWith(".glb") && fs.statSync(path.join(ordner, d)).size > 1e6) fehl.push(`${titel}: figuren/${d} ist größer als 1 MB`);
    for (const b of await zuBreit(pg)) fehl.push(`${titel}: ${b}`);
  } catch (e) {
    const meldung = await pg.locator("#laden").textContent().catch(() => "?");
    fehl.push(`${titel}: ${String(e.message || e).split("\n")[0].slice(0, 160)} – Meldung auf der Seite: ${meldung}`);
  } finally {
    fehl.push(...[...new Set(fehler)].map((f) => `${titel}: ${f}`));
    await ctx.close();
  }
  return fehl;
}

/* ---------- EN6 „The Keys of the Tower“ (17.11.2026): Kachel → Figur → Anfang → Spiegel → verschlossene Tür; mit Schlüssel im Raum
   einen Gegenstand antippen (Mitte aus guardroom.json) → Text erscheint, Zähler zählt. Ohne Ton (window.__towerSchnell). ---------- */
async function towerTest(browser, basis, app, name, fm) {
  const titel = `${name} · Keys of the Tower`, fehl = [];
  const { ctx, pg, fehler } = await neueSeite(browser, basis, app, false, fm);
  try {
    await klicke(pg, /^Station 5/);
    if (await pg.getByRole("button", { name: /^The Keys of the Tower$/ }).count()) fehl.push(`${titel}: Kachel ist ohne Freischaltung (?tower) sichtbar`);
    await pg.goto(`${basis}/${app.pfad}/?tower`, { waitUntil: "load" }); await pg.waitForTimeout(800);
    await pg.evaluate(() => { window.__towerSchnell = true; });
    for (const k of [/^Station 5/, /^The Keys of the Tower$/]) await klicke(pg, k);
    await klicke(pg, /^Alfie$/);
    await klicke(pg, /^Start/);
    await klicke(pg, /^Go on/);   // Anfang vor der Tür ist durch
    await klicke(pg, /^Go on/);   // Mr. Flex im Spiegel ist durch
    if (!(await pg.getByText("The Guard Room is locked.").count())) fehl.push(`${titel}: Tür ist ohne Word Gym nicht verschlossen`);
    for (const b of await zuBreit(pg)) fehl.push(`${titel}, Tür: ${b}`);
    // Schlüssel ist da (Stand gesetzt, wie nach einer Runde Word Gym) → Raum
    await pg.evaluate(() => { const s = JSON.parse(localStorage.getItem("tower-k1")); s.schluessel = true; s.schritt = "raum"; localStorage.setItem("tower-k1", JSON.stringify(s)); });
    await pg.reload({ waitUntil: "load" }); await pg.waitForTimeout(800);
    await pg.evaluate(() => { window.__towerSchnell = true; });
    for (const k of [/^Station 5/, /^The Keys of the Tower$/]) await klicke(pg, k);
    await pg.waitForSelector(".tower-buehne[data-bereit]", { timeout: 8000 });
    const raum = JSON.parse(fs.readFileSync(path.join(WURZEL, "app", "tower", "raum", "guardroom.json"), "utf8"));
    const kasten = await pg.locator(".tower-buehne").boundingBox();
    for (const id of ["uhr", "teekanne", "kruemel"]) {
      const d = raum.dinge.find((x) => x.id === id);
      await pg.mouse.click(kasten.x + d.mitte[0] * kasten.width, kasten.y + d.mitte[1] * kasten.height);
      await pg.waitForTimeout(250);
      const zuletzt = await pg.evaluate(() => document.querySelector(".tower-buehne").dataset.zuletzt);
      if (zuletzt !== id) fehl.push(`${titel}: Tipp auf ${d.name} trifft nicht (getroffen: ${zuletzt || "nichts"})`);
    }
    await pg.waitForTimeout(400);
    const zaehler = await pg.locator(".tower-zaehler").textContent();
    if (!/3\/14/.test(zaehler)) fehl.push(`${titel}: Zähler zeigt „${zaehler}“ statt 3/14`);
    if (!(await pg.locator(".tower-text .en").count())) fehl.push(`${titel}: kein Text zum angetippten Gegenstand`);
    for (const b of await zuBreit(pg)) fehl.push(`${titel}, Raum: ${b}`);
    // Der Fall: Fenster zweimal (Taube erzählt, fünf Fragen) → Uhr (Zettel) → Treppe (Arthur, Ortskarte) → Film → Ende
    const tippe = async (id) => { const d = raum.dinge.find((x) => x.id === id); await pg.mouse.click(kasten.x + d.mitte[0] * kasten.width, kasten.y + d.mitte[1] * kasten.height); await pg.waitForTimeout(250); };
    await tippe("fenster"); await tippe("fenster");
    for (const antwort of [/^Yes, she does\.$/, /^No, she doesn't\.$/, /^She doesn't say\.$/, /^No, she doesn't\.$/, /^Yes, she does\.$/]) await klicke(pg, antwort);
    await pg.waitForSelector('.tower-buehne[data-taube="2"]', { timeout: 8000 });
    await tippe("uhr");
    await pg.waitForSelector('.tower-buehne[data-zettel="1"]', { timeout: 8000 });
    await tippe("treppe");
    await klicke(pg, /^under the bench$/);   // falsche Karte: Arthur fragt noch einmal
    await klicke(pg, /^behind the clock$/);
    await pg.getByRole("button", { name: /^Back to the Guard Room$/ }).waitFor({ state: "visible", timeout: 20000 });
    for (const b of await zuBreit(pg)) fehl.push(`${titel}, Ende: ${b}`);
  } catch (e) {
    const sichtbar = await pg.evaluate(() => [...document.querySelectorAll("button")].filter((x) => x.offsetParent).map((x) => x.textContent.trim().slice(0, 24)).slice(0, 8).join(" | ")).catch(() => "?");
    fehl.push(`${titel}: ${String(e.message || e).split("\n")[0].slice(0, 160)} – sichtbare Knöpfe: ${sichtbar}`);
  } finally {
    fehl.push(...[...new Set(fehler)].map((f) => `${titel}: ${f}`));
    await ctx.close();
  }
  return fehl;
}

/* ---------- Update-Test: Service Worker installiert, neue Version veröffentlicht → kommt sie an? ---------- */
async function updateTest(browser, basis, app) {
  const ctx = await kontext(browser, formate[0]);
  const pg = await ctx.newPage(), fehl = [];
  // Die App lädt sich bei einem Update selbst neu – Navigationen dürfen sich überschneiden.
  const laden = () => pg.goto(`${basis}/${app.pfad}/`).catch(() => {});
  const frage = async (fn) => { for (let i = 0; ; i++) { try { return await pg.evaluate(fn); } catch (e) { if (i >= 5) throw e; await pg.waitForTimeout(1000); } } };
  try {
    await laden();
    const bereit = await pg.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, { timeout: 120000 }).then(() => true, () => false);
    if (!bereit) return [`Update: Offline-Speicher (Service Worker) wird nicht eingerichtet`];
    const altKeys = await frage(() => caches.keys());
    neueVersion.add(app.pfad);
    await laden();
    // Die App sucht beim Start nach einer neuen Version; danach muss der neue Speicher stehen und der alte weg sein.
    const ok = await pg.waitForFunction(async (alt) => { const k = await caches.keys(); return k.some((x) => !alt.includes(x)) && navigator.serviceWorker.controller; },
      altKeys, { timeout: 120000, polling: 1000 }).then(() => true, () => false);
    if (!ok) return [`Update: neue Version wird nicht geladen (Speicher bleibt ${altKeys.join(", ")})`];
    await pg.waitForTimeout(1500);
    await laden(); await pg.waitForTimeout(1500);
    if (!(await frage(() => window.__testprogrammNeu === true))) fehl.push("Update: nach dem Neuladen läuft noch die alte app.js");
    const jetzt = await frage(() => caches.keys());
    const reste = altKeys.filter((k) => jetzt.includes(k)); // frischer Browser: altKeys sind nur die Speicher dieser App
    if (reste.length) fehl.push(`Update: alter Speicher nicht gelöscht (${reste.join(", ")})`);
  } finally {
    neueVersion.delete(app.pfad);
    await ctx.close();
  }
  return fehl;
}

/* ---------- WebKit fürs iPad: starten, sonst einmal installieren, sonst Chromium als Ersatz ---------- */
const hinweise = [];
async function webkitStarten() {
  try { return await webkit.launch(); } catch (e) { /* fehlt wohl: installieren */ }
  console.log("WebKit (Safari-Technik fürs iPad) fehlt – wird installiert, ca. 1 Minute …");
  const cli = path.join(path.dirname(require.resolve("playwright/package.json")), "cli.js");
  const erg = spawnSync(process.execPath, [cli, "install", "--with-deps", "webkit"], { stdio: "ignore", timeout: 10 * 60 * 1000 });
  try { return await webkit.launch(); } catch (e) {
    hinweise.push(`⚠ WebKit ließ sich nicht installieren (Code ${erg.status}) – iPad nur in Chromium nachgestellt, Safari ungeprüft. ` +
      "Mögliche Ursache: cdn.playwright.dev ist im Netzwerk der Umgebung nicht freigegeben. Bitte Mr. Alex fragen.");
    return null;
  }
}

// FR (16.11.2026, Meldung eines Schülers über Mr. Alex): Wer in Prononciation eine Gruppe ganz durchgearbeitet hat,
// muss die Gruppe in der Übersicht grün sehen – und auf der Startseite den Stand der Kachel Prononciation.
async function frGruppeGruen(pg) {
  for (let i = 0; i < 3; i++) {   // drei Namen: hören, Nachsprech-Balken abwarten, weiter
    const k = pg.getByRole("button", { name: /^(Weiter ➜|Fertig ✓)$/ }).first();
    try { await pg.waitForFunction(() => { const b = [...document.querySelectorAll("button")].find((x) => /^(Weiter ➜|Fertig ✓)/.test(x.textContent)); return b && !b.disabled && b.getAttribute("aria-disabled") !== "true"; }, null, { timeout: 25000 }); }
    catch (e) { return `Name ${i + 1}: „Weiter“ wird nicht frei (Ton oder Nachsprech-Balken hängt)`; }
    await k.click(); await pg.waitForTimeout(500);
  }
  await pg.getByRole("button", { name: /Prononciation|Zurück|←/ }).first().click(); await pg.waitForTimeout(500);
  const gruppe = await pg.evaluate(() => { const k = [...document.querySelectorAll(".kachel")].find((x) => /stars/.test(x.textContent)); return k ? { text: k.textContent, gruen: k.classList.contains("erledigt") } : null; });
  if (!gruppe) return "Übersicht Prononciation nicht erreicht";
  if (!/3\/3 geschafft/.test(gruppe.text)) return `Gruppe zählt nicht 3/3 (${gruppe.text.slice(-20)})`;
  if (!gruppe.gruen) return "Gruppe ist ganz geschafft, aber in der Übersicht nicht grün";
  await pg.getByRole("button", { name: /Start|Accueil|←/ }).first().click(); await pg.waitForTimeout(500);
  const start = await pg.evaluate(() => { const k = [...document.querySelectorAll(".kachel")].find((x) => /Prononciation/.test(x.textContent)); return k ? k.textContent : null; });
  if (!start) return "Startseite nicht erreicht";
  if (!/1\/4 Gruppen/.test(start)) return `Startseite: Kachel Prononciation zeigt den Stand nicht (${start})`;
  return null;
}

// FR (16.11.2026, Mr. Alex: auch die anderen Kacheln prüfen): Spiele und Beats zählen einmal am Tag. Wer heute alles gemacht hat,
// muss das auf der Startseite (Jeux, Beat-Studio) und in Jeux (Memory, Qui est-ce ?, Dans l'ordre) sehen – mit Stand und in Grün.
function frHeuteAlles(s) {
  const heute = new Date().toISOString().slice(0, 10), m = {};
  new Function("window", fs.readFileSync(path.join(WURZEL, "app/franz/daten_fr.js"), "utf8"))(m);
  s.spiele = Object.assign({}, s.spiele, { memory: heute, qui: heute, ordre: heute });
  s.beats = {}; m.DATEN_FR.beats.forEach((b) => { s.beats[b.id] = heute; });
}
async function frKachelnHeute(pg) {
  const lies = () => pg.evaluate(() => [...document.querySelectorAll(".kachel")].map((k) => ({ text: k.textContent, gruen: k.classList.contains("erledigt") })));
  const fehlt = (liste, name, stand) => { const k = liste.find((x) => x.text.includes(name)); return !k ? `Kachel ${name} fehlt` : !k.gruen ? `Kachel ${name} ist heute fertig, aber nicht grün` : stand && !stand.test(k.text) ? `Kachel ${name} zeigt den Stand nicht (${k.text})` : null; };
  let k = await lies();
  const f1 = fehlt(k, "Jeux", /3\/3/) || fehlt(k, "Beat-Studio", /(\d+)\/\1/);
  if (f1) return f1;
  await klicke(pg, /Jeux/); k = await lies();
  return fehlt(k, "Memory") || fehlt(k, "Qui est-ce") || fehlt(k, "Dans l'ordre");
}

// EN6 + EN9 (16.11.2026, Mr. Alex: dieselbe Prüfung wie in FR): Hauptkette „alle Teile eines Bereichs fertig → Bereich in der Übersicht grün“.
// Der eingespielte Stand hat alle Teile eines Bereichs bis auf einen Erklärteil; der wird im Browser gemacht (Erklärteile geben keine Punkte, zählen aber).
// Danach muss die Kachel auf der Startseite grün sein. Dazu: Spiele zählen einmal am Tag – wer heute alle gespielt hat, sieht das an der Kachel
// der Spiele (Stand „4/4 heute“, grün) und an jedem Spiel („✓ heute“, grün). EN9: Reiter „Unit 1“ trägt ein ✓, wenn alle Abschnitte der Unit geschafft sind.
const tagLokal = () => { const d = new Date(), z = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; };
const EN_KETTE = {
  EN6: { nr: 2, gruppe: null, stufen: [1, 2, 3, 4], offen: "Ausnahmen", marken: ["memoryTag", "catchTag", "beeTag", "detektivTag"],
    bereich: /^Station 2:/, spiele: /^Station 5/, heute: /4\/4 heute/, haken: /✓ heute/, start: /Zur Startseite/,
    spielNamen: ["Memory", "Catch the Word", "Spelling Bee", "-s-Detektiv"] },
  EN9: { nr: 3, gruppe: "-ing form", stufen: [1, 2, 3], offen: "Rule", marken: ["memoryTag", "patrolTag", "grammarTag", "sprintTag", "catchTag", "beeTag"],
    bereich: /^3 Language/, spiele: /^8 Games/, heute: /6\/6 (heute|today)/, haken: /✓ (heute|today)/, start: /Zur Startseite|Back to start/,
    spielNamen: ["Memory", "Border Patrol", "Grammar Patrol", "Chunk Sprint", "Catch the Word", "Spelling Bee"] },
};
function enDaten(app) { const m = {}; new Function("window", fs.readFileSync(path.join(WURZEL, app.pfad, "daten.js"), "utf8"))(m); return m.DATEN; }
// Teil-Nummern wie teileVon() in der App: ein Listen-and-Repeat-Schritt zählt je Stufe einen Teil
function enTeile(schritte, stufen) { const t = []; schritte.forEach((x) => { if (x.art === "lr") (x.stufen || stufen).forEach(() => t.push(x)); else t.push(x); }); return t; }
function enFastFertig(app) {
  const K = EN_KETTE[app.kurz], D = enDaten(app), heute = tagLokal(), fertig = { am: heute, s: 0 };
  return (s) => {
    if (!s.gym) throw new Error("Testdaten: Die App hat noch keinen Word-Gym-Stand angelegt");
    s.teile = s.teile || {}; K.marken.forEach((m) => { s.gym[m] = heute; });
    const alle = (schritte, gruppe, ausser) => { // alle Teile fertig, bis auf den Erklärteil „ausser“
      let da = !ausser;
      enTeile(schritte, K.stufen).forEach((x, i) => { if (ausser && x.art === "erklaerung" && x.name === ausser) da = true; else s.teile[`${K.nr}|${gruppe == null ? "" : gruppe}|${i}`] = fertig; });
      if (!da) throw new Error(`Testdaten passen nicht mehr: Erklärteil „${ausser}“ fehlt`);
    };
    if (app.kurz === "EN6") alle(D.stationen.find((x) => x.nr === K.nr).schritte, null, K.offen);
    else {
      const k = D.kategorien.find((x) => x.nr === K.nr);
      k.gruppen.forEach((g) => alle(g.schritte, g.name, g.name === K.gruppe ? K.offen : null));
      s.gruppen = Object.assign({}, s.gruppen, { [K.nr]: k.gruppen.map((g) => g.name).filter((n) => n !== K.gruppe), 2: D.units["1"].map((g) => "u1:" + g.name) });
    }
  };
}
async function enKetteGruen(app, pg) {
  const K = EN_KETTE[app.kurz];
  const lies = () => pg.evaluate(() => [...document.querySelectorAll(".kachel")].map((k) => ({ name: k.getAttribute("aria-label") || "", text: k.textContent, gruen: k.classList.contains("erledigt"),
    knapp: k.scrollHeight > k.clientHeight + 2 || k.scrollWidth > k.clientWidth + 2 })));   // knapp: Text passt nicht in die Kachel
  const kachel = async (re) => (await lies()).find((x) => re.test(x.name));
  const zuVoll = async (wo) => { const x = (await lies()).find((y) => y.knapp); return x ? `${wo}: Text passt nicht in die Kachel ${x.name}` : null; };
  const v1 = await zuVoll("Startseite"); if (v1) return v1;
  let k = await kachel(K.bereich);
  if (!k) return "Startseite: Kachel des Bereichs fehlt";
  if (k.gruen) return "Bereich ist grün, obwohl noch ein Teil fehlt";
  k = await kachel(K.spiele);
  if (!k) return "Startseite: Kachel der Spiele fehlt";
  if (!K.heute.test(k.text)) return `Kachel der Spiele zeigt den Stand von heute nicht (${k.text})`;
  if (!k.gruen) return "Heute alle Spiele gespielt, aber die Kachel der Spiele ist nicht grün";
  // den letzten offenen Teil (Erklärung) machen
  try {
    await klicke(pg, K.bereich);
    if (K.gruppe) await klicke(pg, new RegExp("^" + K.gruppe));
    await klicke(pg, new RegExp("^" + K.offen));
    await klicke(pg, /^(Weiter|Next)/);
  } catch (e) { return "Weg zum letzten offenen Teil klappt nicht: " + e.message.split("\n")[0]; }
  await pg.waitForTimeout(800);
  await pg.evaluate(() => document.querySelectorAll(".feier, .overlay, dialog[open]").forEach((x) => x.remove())); // Lob-Feier nicht abwarten
  try { await klicke(pg, K.start); } catch (e) { return "Nach dem letzten Teil kommt die Seite „geschafft“ nicht (Knopf zur Startseite fehlt)"; }
  k = await kachel(K.bereich);
  if (!k) return "Startseite nach dem letzten Teil nicht erreicht";
  if (!k.gruen) return "Alle Teile des Bereichs sind fertig, aber die Kachel auf der Startseite ist nicht grün";
  if (K.gruppe) { // EN9: auch die Themen in der Übersicht der Kategorie
    await klicke(pg, K.bereich);
    const offen = (await lies()).filter((x) => !x.gruen);
    if (offen.length) return `Thema ${offen[0].name} ist fertig, aber nicht grün`;
    await klicke(pg, /^← /);
    await klicke(pg, /^2 Vocabulary/);
    const reiter = await pg.evaluate(() => [...document.querySelectorAll(".reiter-knopf")].map((b) => b.textContent));
    if (!reiter.some((t) => /^Unit 1.*✓/.test(t))) return `Unit 1 ist ganz geschafft, aber der Reiter zeigt es nicht (${reiter.join(" | ")})`;
    if (reiter.some((t) => /^Unit [23].*✓/.test(t))) return `Reiter zeigt ✓ für eine Unit, die nicht fertig ist (${reiter.join(" | ")})`;
    for (const b of await zuBreit(pg)) return "Vocabulary: " + b;
    await klicke(pg, /^← /);
  }
  await klicke(pg, K.spiele);
  const spiele = await lies();
  for (const n of K.spielNamen) {
    const x = spiele.find((y) => y.name === n);
    if (!x) return `Spiel ${n} fehlt`;
    if (!K.haken.test(x.text)) return `Spiel ${n} ist heute gespielt, zeigt es aber nicht (${x.text})`;
    if (!x.gruen) return `Spiel ${n} ist heute gespielt, aber nicht grün`;
  }
  for (const b of await zuBreit(pg)) return "Spiele: " + b;
  return zuVoll("Spiele");
}

/* ---------- Offline-Speicher aktuell? (17.11.2026: 45 neue Tower-Aufnahmen waren hochgeladen, sw.js aber nicht neu gebaut –
   die Anhör-Seite kam weiter alt aus dem Speicher). Jede mp3 unter audio/ muss in der Liste von sw.js stehen, jede gelistete Datei
   muss es geben; die Anhör-Seite (nur für Mr. Alex, soll immer frisch sein) darf nicht im Speicher liegen. Ohne Browser. ---------- */
function speicherTest(app) {
  const fehl = [], wurzel = path.join(WURZEL, app.pfad), sw = path.join(wurzel, "sw.js");
  if (!fs.existsSync(sw)) return fehl;
  const m = fs.readFileSync(sw, "utf8").match(/const DATEIEN = (\{.*?\});/s);
  if (!m) return ["Offline-Speicher: Dateiliste in sw.js nicht gefunden"];
  const liste = JSON.parse(m[1]);
  const fehlt = Object.keys(liste).filter((d) => d !== "./" && !fs.existsSync(path.join(wurzel, d)));
  if (fehlt.length) fehl.push(`Offline-Speicher: ${fehlt.length} gelistete Dateien gibt es nicht (z. B. ${fehlt[0]}) – App neu bauen`);
  const neu = [], lauf = (ordner) => { for (const e of fs.readdirSync(ordner, { withFileTypes: true })) {
    const p = path.join(ordner, e.name);
    if (e.isDirectory()) lauf(p); else if (e.name.endsWith(".mp3") && !(path.relative(wurzel, p).split(path.sep).join("/") in liste)) neu.push(e.name);
  } };
  if (fs.existsSync(path.join(wurzel, "audio"))) lauf(path.join(wurzel, "audio"));
  if (neu.length) fehl.push(`Offline-Speicher: ${neu.length} Aufnahmen stehen nicht in sw.js (z. B. ${neu[0]}) – App neu bauen, sonst kommt kein Update an`);
  if ("tower-anhoeren.html" in liste) fehl.push("Offline-Speicher: die Anhör-Seite liegt im Speicher und bleibt deshalb alt");
  return fehl;
}

/* ---------- Ablauf ---------- */
(async () => {
  const srv = server();
  await new Promise((ok) => srv.listen(0, "127.0.0.1", ok));
  const basis = `http://127.0.0.1:${srv.address().port}`;
  // Windows (AlexPC): ohne diese Schalter zeichnet der Test-Browser die 3D-Szene ohne Grafikkarte (SwiftShader, 3 Bilder pro Sekunde im Laptop-Format) –
  // der Laptop-Lauf des Story-Spiels brauchte dann weit über 20 Minuten (19.11.). Mit Grafikkarte sind es rund 57 Bilder pro Sekunde.
  const browser = await chromium.launch(process.platform === "win32" ? { args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] } : {});
  const safari = formate.some((f) => f.webkit) ? await webkitStarten() : null;
  const alleFehler = [];
  try {
    for (const app of APPS) {
      const start = Date.now(), f = [];
      for (const fm of formate) {
        const b = fm.webkit && safari ? safari : browser, name = fm.webkit && !safari ? fm.name + " (Chromium)" : fm.name;
        const w = (titel, knoepfe, opt = {}) => weg(b, basis, app, `${name} · ${titel}`, knoepfe, Object.assign({ format: fm }, opt));
        if (NUR_STORY) { if (app.kurz === "EN6" && fm.id !== "handy") { f.push(...await towerTest(b, basis, app, name, fm)); f.push(...await probe3dTest(b, basis, app, name, fm)); } continue; }
        f.push(...await w("Start", []));
        f.push(...await w("Übung", app.uebung));
        f.push(...await w("Shop", app.shop));
        f.push(...await w("Runner", app.runner, { tickets: true, pruefe: async (pg) => {
          await pg.waitForTimeout(1500);
          const vp = pg.viewportSize(); await pg.mouse.click(vp.width / 2, vp.height / 2); await pg.waitForTimeout(800); // einmal springen
          const n = await pg.evaluate(() => [...document.querySelectorAll(".runner-buehne canvas")].filter((c) => c.offsetParent && c.width > 0).length);
          return n ? null : "Runner startet nicht (keine Spielbühne mit Zeichenfläche)";
        } }));
        const story = app.kurz === "EN6" && fm.id !== "handy";   // Story-Spiel: kein Handy-Test (Regel Mr. Alex 18.11.) – die Lern-Apps werden weiter auch im Handy-Format geprüft
        if (story) f.push(...await towerTest(b, basis, app, name, fm));
        if (story && !NUR_3D_AUS) f.push(...await probe3dTest(b, basis, app, name, fm));
        if (EN_KETTE[app.kurz]) f.push(...await w("Bereich wird grün, Spiele zeigen den Stand von heute", [], { stand: enFastFertig(app), pruefe: (pg) => enKetteGruen(app, pg) }));
        if (app.kurz === "FR") f.push(...await w("Prononciation grün", [/Prononciation/, /Président & stars/, /Alle der Reihe nach/], { pruefe: frGruppeGruen }));
        if (app.kurz === "FR") f.push(...await w("Kacheln zeigen den Stand von heute", [], { stand: frHeuteAlles, pruefe: frKachelnHeute }));
      }
      f.push(...speicherTest(app));
      if (!OHNE_UPDATE) f.push(...await updateTest(browser, basis, app));
      console.log(`${f.length ? "✗" : "✓"} ${app.kurz}  (${((Date.now() - start) / 1000).toFixed(0)} s)`);
      for (const x of f) console.log("    - " + x);
      alleFehler.push(...f.map((x) => `${app.kurz} · ${x}`));
    }
  } finally {
    await browser.close();
    if (safari) await safari.close();
    srv.close();
  }
  for (const h of hinweise) console.log("\n" + h);
  console.log(alleFehler.length ? `\n${alleFehler.length} FEHLER` : "\nALLES OK");
  process.exit(alleFehler.length ? 1 : 0);
})().catch((e) => { console.error("Testprogramm abgebrochen:", e); process.exit(2); });
