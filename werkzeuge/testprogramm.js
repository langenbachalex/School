#!/usr/bin/env node
// Festes Testprogramm (ALLE, 15.11.2026, Entscheidung Mr. Alex) – ein Befehl, Ausgabe „ALLES OK“ oder eine Fehlerliste.
//   node werkzeuge/testprogramm.js            alle drei Apps (EN6, EN9, FR)
//   node werkzeuge/testprogramm.js EN9 FR     nur diese Apps
//   node werkzeuge/testprogramm.js --ohne-update   ohne den langsamen Update-Test (Service Worker)
//   node werkzeuge/testprogramm.js --format=handy  nur ein Format (laptop, handy, ipad; mehrere mit Komma)
// Drei Formate (Mr. Alex 15.11.: heute Windows-Laptop, Handy muss gehen, künftig iPad): Laptop 1366×768 mit Maus,
// Handy 360×740 mit Touch, iPad 820×1180 mit Touch. Hier läuft nur Chromium: das iPad wird in Größe, Touch und Kennung
// nachgestellt, Safari selbst (WebKit) wird nicht geprüft.
// Geprüft wird je App und Format: lädt ohne Konsolenfehler · die wichtigsten Wege (Start, eine Übung,
// Runner-Start, Shop) · kein Feld breiter als der Bildschirm · ein Update kommt an (Service Worker).
// Ändert keine Datei: der eingebaute Server liefert die App aus dem Repo, für den Update-Test nur im Speicher verändert.
// Neue Fehler: zuerst hier einen Test ergänzen, der den Fehler zeigt (Regel in CLAUDE.md).
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const WURZEL = path.resolve(__dirname, "..");
const FORMATE = [
  { name: "Laptop", id: "laptop", viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false },
  { name: "Handy", id: "handy", viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true },
  { name: "iPad", id: "ipad", viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true,
    userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" },
];
const args = process.argv.slice(2);
const fArg = (args.find((a) => a.startsWith("--format=")) || "").slice(9);
const formate = fArg ? FORMATE.filter((f) => fArg.toLowerCase().split(",").includes(f.id)) : FORMATE;
const OHNE_UPDATE = args.includes("--ohne-update");
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
function mitTickets(app, roh) {
  const appJs = fs.readFileSync(path.join(WURZEL, app.pfad, "app.js"), "utf8");
  const s = roh ? JSON.parse(roh) : {};
  if (app.art === "fr") {
    const siegel = siegelAus(appJs, "fr");
    s.coins = 500; s.parisRun = Object.assign({ gespielt: 0, geschafft: 0, beste: 0 }, s.parisRun, { tickets: 3 });
    s._s = siegel(s); return s;
  }
  const [siegel, V] = siegelAus(appJs, "en");
  s.spiel = s.spiel || {}; s.spiel.coins = 500;
  s.spiel.runner = Object.assign({ level: {}, gespielt: 0, geschafft: 0, titel: 0 }, s.spiel.runner, { tickets: 3 });
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
async function neueSeite(browser, basis, app, tickets, f) {
  const ctx = await kontext(browser, f, { serviceWorkers: "block" });
  const pg = await ctx.newPage(), fehler = [];
  if (tickets) { // erst die App ihren Stand anlegen lassen, dann Tickets dazu
    await pg.goto(`${basis}/${app.pfad}/`); await pg.waitForTimeout(1200);
    const roh = await pg.evaluate((k) => localStorage.getItem(k), app.speicher);
    const neu = JSON.stringify(mitTickets(app, roh));
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
  const { ctx, pg, fehler } = await neueSeite(browser, basis, app, opt.tickets, opt.format);
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

/* ---------- Ablauf ---------- */
(async () => {
  const srv = server();
  await new Promise((ok) => srv.listen(0, "127.0.0.1", ok));
  const basis = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch();
  const alleFehler = [];
  try {
    for (const app of APPS) {
      const start = Date.now(), f = [];
      for (const fm of formate) {
        const w = (titel, knoepfe, opt = {}) => weg(browser, basis, app, `${fm.name} · ${titel}`, knoepfe, Object.assign({ format: fm }, opt));
        f.push(...await w("Start", []));
        f.push(...await w("Übung", app.uebung));
        f.push(...await w("Shop", app.shop));
        f.push(...await w("Runner", app.runner, { tickets: true, pruefe: async (pg) => {
          await pg.waitForTimeout(1500);
          const vp = pg.viewportSize(); await pg.mouse.click(vp.width / 2, vp.height / 2); await pg.waitForTimeout(800); // einmal springen
          const n = await pg.evaluate(() => [...document.querySelectorAll(".runner-buehne canvas")].filter((c) => c.offsetParent && c.width > 0).length);
          return n ? null : "Runner startet nicht (keine Spielbühne mit Zeichenfläche)";
        } }));
      }
      if (!OHNE_UPDATE) f.push(...await updateTest(browser, basis, app));
      console.log(`${f.length ? "✗" : "✓"} ${app.kurz}  (${((Date.now() - start) / 1000).toFixed(0)} s)`);
      for (const x of f) console.log("    - " + x);
      alleFehler.push(...f.map((x) => `${app.kurz} · ${x}`));
    }
  } finally {
    await browser.close();
    srv.close();
  }
  console.log(alleFehler.length ? `\n${alleFehler.length} FEHLER` : "\nALLES OK");
  process.exit(alleFehler.length ? 1 : 0);
})().catch((e) => { console.error("Testprogramm abgebrochen:", e); process.exit(2); });
