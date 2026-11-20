#!/usr/bin/env node
// Kleiner Server zum Ansehen auf dem eigenen Rechner (Block B1, 20.11.2026): liefert den Ordner app/ unter http://localhost:8123/
//   node werkzeuge/probe_server.js        dann im Browser z. B. http://localhost:8123/tower/probe3d.html?ort=hof&spiel=1
// Nur von diesem Rechner aus erreichbar (127.0.0.1), ändert keine Datei. Beenden: Strg + C.
"use strict";
const http = require("http"), fs = require("fs"), path = require("path");
const WURZEL = path.resolve(__dirname, "..", "app"), PORT = +process.argv[2] || 8123;
const ART = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".mp3": "audio/mpeg",
  ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".glb": "model/gltf-binary", ".wasm": "application/wasm", ".tsv": "text/plain; charset=utf-8" };
http.createServer((req, res) => {
  let datei = path.join(WURZEL, decodeURIComponent(req.url.split("?")[0]));
  if (!datei.startsWith(WURZEL)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(datei) && fs.statSync(datei).isDirectory()) datei = path.join(datei, "index.html");
  fs.readFile(datei, (fehler, inhalt) => {
    if (fehler) { res.writeHead(404); return res.end("Nicht gefunden"); }
    res.writeHead(200, { "Content-Type": ART[path.extname(datei).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(inhalt);
  });
}).listen(PORT, "127.0.0.1", () => console.log(`Läuft: http://localhost:${PORT}/tower/probe3d.html?ort=hof&spiel=1   (Beenden: Strg + C)`));
