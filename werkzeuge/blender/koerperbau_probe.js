/* Prüfseite Körperbau (A2 bis A4, 18.11.2026): nimmt koerperbau_probe.html Bild für Bild auf (ohne Fenster) und schreibt Messwerte.
   Aufruf (Git Bash, im Repo-Ordner):  NODE_PATH="$APPDATA/npm/node_modules" node werkzeuge/blender/koerperbau_probe.js [arm=1.8 bein=3 kopf=0.66 rumpf=1.16]
   Ergebnis: werkzeuge/blender/frames/koerperbau/sNN_fNNN.png und masse.json; danach python werkzeuge/blender/koerperbau_blatt.py */
const http = require("http"), fs = require("fs"), path = require("path"), { chromium } = require("playwright");
const REPO = path.join(__dirname, "..", ".."), AUS = path.join(__dirname, "frames", "koerperbau"), FPS = 12;
const ART = { ".html": "text/html", ".js": "text/javascript", ".glb": "model/gltf-binary", ".json": "application/json" };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/app/tower/koerperbau_probe.html") p = "/werkzeuge/blender/koerperbau_probe.html";
  const datei = path.join(REPO, p);
  if (!datei.startsWith(REPO) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": ART[path.extname(datei)] || "application/octet-stream" }); fs.createReadStream(datei).pipe(res);
});
(async () => {
  await new Promise((ok) => srv.listen(0, "127.0.0.1", ok));
  fs.rmSync(AUS, { recursive: true, force: true }); fs.mkdirSync(AUS, { recursive: true });
  const browser = await chromium.launch(), seite = await browser.newPage({ viewport: { width: 900, height: 560 } });
  const fehler = []; seite.on("console", (m) => { if (m.type() === "error") fehler.push(m.text()); }); seite.on("pageerror", (e) => fehler.push(String(e)));
  await seite.goto(`http://127.0.0.1:${srv.address().port}/app/tower/koerperbau_probe.html?${process.argv.slice(2).join("&")}`);
  await seite.waitForFunction(() => document.title === "bereit", null, { timeout: 60000 }).catch(() => {});
  if (fehler.length) console.log("FEHLER auf der Seite:\n" + fehler.join("\n"));
  const szenen = await seite.evaluate(() => window.probe.szenen), masse = { szenen, verlauf: [] };
  for (let i = 0; i < szenen.length; i++) {
    await seite.evaluate((k) => window.probe.setze(k), i);
    const n = Math.max(8, Math.round(szenen[i].dauer * FPS * (szenen[i].dauernd ? 2 : 1))), reihe = [];
    for (let f = 0; f < n; f++) {
      reihe.push(await seite.evaluate((dt) => window.probe.takt(dt), 1 / FPS));
      await seite.screenshot({ path: path.join(AUS, `s${String(i).padStart(2, "0")}_f${String(f).padStart(3, "0")}.png`) });
    }
    masse.verlauf.push(reihe);
  }
  fs.writeFileSync(path.join(AUS, "masse.json"), JSON.stringify(masse));
  await browser.close(); srv.close();
  console.log("aufgenommen:", szenen.length, "Szenen | Bau", JSON.stringify(masse.verlauf[0][0].bau), "| Schrittlänge mal", masse.verlauf[0][0].schritt);
})();
