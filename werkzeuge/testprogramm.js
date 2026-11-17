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
    // Figuren-Probe: Gary auf drei Arten, alle können sich verbeugen und gehen
    const garys = () => pg.evaluate(() => window.__probe3d.garys());
    if ((await garys()).length !== 3) fehl.push(`${titel}: es stehen nicht drei Garys im Raum`);
    await pg.click('#garys button[data-gary="verbeugen"]'); await pg.waitForTimeout(200);
    if (!(await garys()).every((g) => g.modus === "verbeugen")) fehl.push(`${titel}: nicht alle Garys verbeugen sich`);
    await pg.click('#garys button[data-gary="gehen"]'); await pg.waitForTimeout(1500);
    if (!(await garys()).every((g) => g.modus === "gehen" && g.weg > 0.05)) fehl.push(`${titel}: nicht alle Garys gehen`);
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
  const browser = await chromium.launch();
  const safari = formate.some((f) => f.webkit) ? await webkitStarten() : null;
  const alleFehler = [];
  try {
    for (const app of APPS) {
      const start = Date.now(), f = [];
      for (const fm of formate) {
        const b = fm.webkit && safari ? safari : browser, name = fm.webkit && !safari ? fm.name + " (Chromium)" : fm.name;
        const w = (titel, knoepfe, opt = {}) => weg(b, basis, app, `${name} · ${titel}`, knoepfe, Object.assign({ format: fm }, opt));
        f.push(...await w("Start", []));
        f.push(...await w("Übung", app.uebung));
        f.push(...await w("Shop", app.shop));
        f.push(...await w("Runner", app.runner, { tickets: true, pruefe: async (pg) => {
          await pg.waitForTimeout(1500);
          const vp = pg.viewportSize(); await pg.mouse.click(vp.width / 2, vp.height / 2); await pg.waitForTimeout(800); // einmal springen
          const n = await pg.evaluate(() => [...document.querySelectorAll(".runner-buehne canvas")].filter((c) => c.offsetParent && c.width > 0).length);
          return n ? null : "Runner startet nicht (keine Spielbühne mit Zeichenfläche)";
        } }));
        if (app.kurz === "EN6") f.push(...await towerTest(b, basis, app, name, fm));
        if (app.kurz === "EN6" && !NUR_3D_AUS) f.push(...await probe3dTest(b, basis, app, name, fm));
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
