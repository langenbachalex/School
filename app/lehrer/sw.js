// Offline-Speicher der Lehrer-Übersicht (Sync Stufe A, 10.11.2026): nur diese eine Seite; Netz zuerst, sonst Speicher.
const VERSION = "mralex-lehrer-1";
self.addEventListener("install", (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(["./"])).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((alle) => Promise.all(alle.filter((k) => k.startsWith("mralex-lehrer") && k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const k = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, k)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("./"))));
});
