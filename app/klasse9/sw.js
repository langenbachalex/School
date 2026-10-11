// Automatisch erzeugt von werkzeuge/klasse9_bauen.py – Offline-Speicher der App Klasse 9.
const VERSION = "mralex9-8e468f3cef22";
const DATEIEN = ["./", "app.js", "basis.css", "daten.js", "index.html", "klasse9.css", "manifest.webmanifest", "audio/lob/doch_seeyoucan.mp3", "audio/lob/fehler_ohno.mp3", "audio/lob/fehler_sorry.mp3", "audio/lob/geschafft_didit.mp3", "audio/lob/geschafft_outstanding.mp3", "audio/lob/lob_amazing.mp3", "audio/lob/lob_fantastic.mp3", "audio/lob/lob_great.mp3", "audio/lob/lob_love.mp3", "audio/lob/lob_niceone.mp3", "audio/lob/lob_outstanding.mp3", "audio/lob/lob_spoton.mp3", "audio/lob/lob_superstar.mp3", "audio/lob/lob_wonderful.mp3", "audio/lob/spiel_terrible.mp3", "audio/lob/voll_fullmarks.mp3", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((alle) => Promise.all(alle.filter((k) => k.startsWith("mralex9-") && k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request)));
});
