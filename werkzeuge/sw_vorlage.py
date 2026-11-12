"""Gemeinsamer Baustein für die Service Worker (sw.js) der Apps: robuste, sparsame Einrichtung des Offline-Speichers (12.11.2026).

Vorher lud jedes Update ALLE Dateien auf einmal neu (Klasse 9: rund 1400 Dateien, 65 MB, alle gleichzeitig). Scheiterte eine einzige Anfrage
oder wurde die App vorher geschlossen, blieb die alte Version – das Update kam nie an. Jetzt:
- Dateien mit unveränderter Prüfsumme werden aus dem alten Speicher übernommen; nur Geändertes kommt frisch vom Server (cache: "reload",
  damit eine neu vertonte mp3 nie alt bleibt).
- Höchstens sechs Anfragen gleichzeitig, jede bis zu viermal versucht.
- Eine abgebrochene Einrichtung macht beim nächsten Mal dort weiter, wo sie war.
DATEIEN ist ein Objekt {Pfad: Prüfsumme}; die Liste liegt als "__dateien" im Speicher, damit die nächste Version vergleichen kann.
"""
import hashlib


def pruefsumme(pfad):
    with open(pfad, "rb") as f:
        return hashlib.sha1(f.read()).hexdigest()[:8]


def einrichten_js(eigener_speicher):
    """eigener_speicher: JS-Ausdruck mit der Variablen k, der die Speicher DIESER App erkennt, z. B. 'k.startsWith("mralex9-")'."""
    return """const MERK = "__dateien";
async function einrichten() {
  const neu = await caches.open(VERSION);
  let alt = null, altListe = {};
  for (const k of await caches.keys()) {
    if (k === VERSION || !(%s)) continue;
    const c = await caches.open(k), m = await c.match(MERK);
    if (m) { alt = c; altListe = await m.json(); break; }
  }
  const namen = Object.keys(DATEIEN);
  let i = 0;
  const holen = async (u) => {
    if (await neu.match(u)) return; // schon da: abgebrochene Einrichtung geht weiter
    if (alt && altListe[u] === DATEIEN[u]) { const r = await alt.match(u); if (r) return neu.put(u, r); } // unverändert: aus dem alten Speicher
    for (let versuch = 0; ; versuch++) {
      try {
        const r = await fetch(new Request(u, { cache: "reload" }));
        if (!r.ok) throw new Error("HTTP " + r.status);
        return await neu.put(u, r);
      } catch (e) {
        if (versuch >= 3) throw e;
        await new Promise((ok) => setTimeout(ok, 800 * (versuch + 1)));
      }
    }
  };
  const arbeiter = async () => { while (i < namen.length) await holen(namen[i++]); };
  await Promise.all(Array.from({ length: 6 }, arbeiter));
  await neu.put(MERK, new Response(JSON.stringify(DATEIEN), { headers: { "Content-Type": "application/json" } }));
}
self.addEventListener("install", (e) => { e.waitUntil(einrichten().then(() => self.skipWaiting())); });
""" % eigener_speicher
