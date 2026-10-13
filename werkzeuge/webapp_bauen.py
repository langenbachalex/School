"""Macht aus app/ eine installierbare Web-App: Icons, Manifest und Offline-Speicher (sw.js).
Wird von daten_bauen.py automatisch mit aufgerufen.
"""
import hashlib, json, os
from PIL import Image, ImageDraw, ImageFont

BASIS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = os.path.join(BASIS, "app")
BLAU, WEISS, GELB = (31, 95, 209), (255, 255, 255), (255, 210, 63)
SCHRIFT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def icon(groesse, ziel):
    if os.path.exists(ziel):
        return
    img = Image.new("RGB", (groesse, groesse), BLAU)
    d = ImageDraw.Draw(img)
    gross = ImageFont.truetype(SCHRIFT, int(groesse * 0.5))
    klein = ImageFont.truetype(SCHRIFT, int(groesse * 0.16))
    d.text((groesse / 2, groesse * 0.47), "6", font=gross, fill=WEISS, anchor="mm")
    d.text((groesse / 2, groesse * 0.8), "English", font=klein, fill=GELB, anchor="mm")
    img.save(ziel)


def main():
    os.makedirs(os.path.join(APP, "icons"), exist_ok=True)
    for g in (180, 192, 512):
        icon(g, os.path.join(APP, "icons", f"icon-{g}.png"))
    manifest = {
        "name": "English 6", "short_name": "English 6", "lang": "de",
        "start_url": "./", "scope": "./", "display": "standalone",
        "background_color": "#f3f6fb", "theme_color": "#1f5fd1",
        "icons": [{"src": f"icons/icon-{g}.png", "sizes": f"{g}x{g}", "type": "image/png", "purpose": "any maskable"}
                  for g in (192, 512)],
    }
    with open(os.path.join(APP, "manifest.webmanifest"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
    # Alle Dateien für den Offline-Speicher; die Version ändert sich, sobald sich eine Datei ändert
    dateien, h = ["./"], hashlib.sha1()
    for wurzel, _, namen in sorted(os.walk(APP)):
        for n in sorted(namen):
            pfad = os.path.join(wurzel, n)
            rel = os.path.relpath(pfad, APP).replace(os.sep, "/")
            if rel in ("sw.js", "LIESMICH.md") or rel.startswith(("klasse9/", "franzoesisch/")):  # eigene Apps mit eigenem Offline-Speicher
                continue
            dateien.append(rel)
            with open(pfad, "rb") as f:
                h.update(rel.encode() + f.read())
    version = h.hexdigest()[:12]
    with open(os.path.join(APP, "sw.js"), "w", encoding="utf-8") as f:
        f.write(f"""// Automatisch erzeugt von werkzeuge/webapp_bauen.py – Offline-Speicher der App.
const VERSION = "mralex-{version}";
const DATEIEN = {json.dumps(dateien)};
self.addEventListener("install", (e) => {{
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
}});
self.addEventListener("activate", (e) => {{
  // nur eigene alte Speicher löschen – nicht die von Klasse 9 (mralex9-) oder Französisch (mralex-fr-)
  e.waitUntil(caches.keys().then((alle) => Promise.all(alle.filter((k) => /^mralex-[0-9a-f]+$/.test(k) && k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
}});
self.addEventListener("fetch", (e) => {{
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request, {{ ignoreSearch: true }}).then((r) => r || fetch(e.request)));
}});
""")
    print("Web-App:", len(dateien), "Dateien, Version", version)


if __name__ == "__main__":
    main()
