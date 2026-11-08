"""Lädt Fotos für die Frankreich-Karte der Französisch-App (inhalte/franz/france.tsv), die noch keins haben (8.11.2026).

Quelle 1: Library of Congress (Photochrome um 1890–1900 und Postkarten, gemeinfrei, keine Sperre) – feste Liste LOC (Bild-Kennung → Item-Nummer).
Quelle 2 (nur Orte ohne LoC-Bild): Wikimedia Commons, langsam (Takt --pause, Standard 150 s; bei 429 fünf Minuten warten).
Ablage: app/franz/bilder/france/<id>.jpg (max. 960 px wie Paris) + Zeile in inhalte/franz/france_fotos.tsv. Danach werkzeuge/franz_bauen.py.
Fertige Orte werden übersprungen, das Skript kann jederzeit neu gestartet werden.
Aufruf: python3 werkzeuge/france_fotos.py [--pause 150] [--ohne-commons]
"""
import io, json, os, re, sys, time, urllib.error, urllib.parse, urllib.request
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import franz_bauen as fb

UA = "SchoolLearningApp/1.0 (https://github.com/langenbachalex/School; non-commercial classroom app)"
ZIEL = os.path.join(fb.APP, "bilder", "france")
TSV = os.path.join(fb.INHALT, "france_fotos.tsv")
# id → (LoC-Item-Nummer, Bild-URL auf tile.loc.gov, Art, Motiv)
T = "https://tile.loc.gov/storage-services/service/pnp/"
LOC = {
    "metz": ("2002695073", T + "ppmsca/00000/00001v.jpg", "Photochrom", "Porte des Allemands"),
    "bordeaux": ("2017659774", T + "ppmsca/52400/52463v.jpg", "Photochrom", "La Bourse"),
    "lyon": ("2001698424", T + "ppmsc/05000/05083v.jpg", "Photochrom", "Place des Terreaux"),
    "aix": ("2001698591", T + "ppmsc/05200/05248v.jpg", "Photochrom", "La Rotonde"),
    "chateauneuf": ("2001698586", T + "ppmsc/05200/05243v.jpg", "Photochrom", "Papstpalast in Avignon, nahe Châteauneuf"),
    "mont_saint_michel": ("2001698477", T + "ppmsc/05100/05135v.jpg", "Photochrom", "Südseite vom Damm"),
    "carnac": ("2025705671", T + "pcrd/1b00000/1b02000/1b02700/1b02773v.jpg", "Postkarte", "Alignements de Kermario"),
    "nantes": ("2001698484", T + "ppmsc/05100/05142v.jpg", "Photochrom", "Château des ducs de Bretagne"),
    "chambord": ("2017659781", T + "ppmsca/52400/52470v.jpg", "Photochrom", "Château de Chambord"),
    "dijon": ("2001698106", T + "ppmsc/05000/05016v.jpg", "Photochrom", "Notre-Dame, Kirche mit der Chouette"),
    "lille": ("2001698413", T + "ppmsc/05000/05072v.jpg", "Photochrom", "Grand-Place"),
    "strasbourg": ("2017660020", T + "ppmsca/52500/52512v.jpg", "Photochrom", "Saint-Thomas und Münster"),
    "chamonix": ("2017650152", T + "ppmsca/52900/52907v.jpg", "Photochrom", "Chamonix und Mont Blanc"),
    "marseille": ("2001698459", T + "ppmsc/05100/05117v.jpg", "Photochrom", "Hafen"),
    "nice": ("2002715107", T + "ppmsc/09900/09990v.jpg", "Photochrom", "Hafen"),
    "carcassonne": ("2025707170", T + "pcrd/1b00000/1b04000/1b04200/1b04249v.jpg", "Postkarte", "La Cité, Haupteingang"),
    "toulouse": ("2001698712", T + "ppmsc/05300/05369v.jpg", "Photochrom", "Blick über die Stadt"),
}
COMMONS = {"forbach": "Forbach château Schlossberg", "sarreguemines": "Sarreguemines faïencerie", "saint_avold": "Saint-Avold",
           "freyming": "Freyming-Merlebach chevalement", "sarralbe": "Sarralbe église",
           "ajaccio": "Ajaccio port citadelle"}   # LoC hat nur eine Schwarz-Weiß-Postkarte (2025705400)
API = "https://commons.wikimedia.org/w/api.php"


def holen(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for versuch in range(4):
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or versuch == 3:
                raise
            print("  429 – warte 5 Minuten"); time.sleep(300)
        except Exception:
            if versuch == 3:
                raise
            time.sleep(10)


def speichern(oid, daten):
    im = Image.open(io.BytesIO(daten)).convert("RGB")
    im.thumbnail((960, 960))
    im.save(os.path.join(ZIEL, oid + ".jpg"), quality=82)


def loc_kennung(url):
    m = re.search(r"/pnp/(ppmsca?|pcrd)/.*/(\w+?)v\.jpg$", url)
    return f"LC-DIG-{m.group(1)}-{m.group(2)}" if m and m.group(1) != "pcrd" else None


def commons(oid, text, pause):
    q = urllib.parse.urlencode({"action": "query", "format": "json", "generator": "search", "gsrnamespace": 6, "gsrlimit": 6,
                                "gsrsearch": f"{text} filetype:bitmap", "prop": "imageinfo", "iiprop": "url|extmetadata|size", "iiurlwidth": 960})
    seiten = json.loads(holen(f"{API}?{q}")).get("query", {}).get("pages", {}).values()
    time.sleep(pause)
    for s in sorted(seiten, key=lambda s: s.get("index", 99)):
        ii = (s.get("imageinfo") or [{}])[0]
        meta = ii.get("extmetadata", {})
        lz = meta.get("LicenseShortName", {}).get("value", "")
        if not re.search(r"public domain|^PD|CC0|CC BY", lz, re.I) or re.search(r"NC|ND", lz) or ii.get("width", 0) < ii.get("height", 1):
            print("  übersprungen:", s["title"], lz); continue
        daten = holen(ii["thumburl"])
        if Image.open(io.BytesIO(daten)).mode in ("L", "1", "LA"):
            print("  schwarz-weiß:", s["title"]); time.sleep(pause); continue
        speichern(oid, daten)
        autor = re.sub(r"<[^>]+>", "", meta.get("Artist", {}).get("value", "")).strip() or "unbekannt"
        return f"Foto: {autor} · {lz} · Wikimedia Commons ({s['title'][5:]})"
    return None


def main():
    pause = float(sys.argv[sys.argv.index("--pause") + 1]) if "--pause" in sys.argv else 150
    os.makedirs(ZIEL, exist_ok=True)
    zeilen = fb.tsv("france_fotos.tsv") if os.path.exists(TSV) else []
    fertig = {z["id"] for z in zeilen}
    for o in fb.tsv("france.tsv"):
        oid = o["id"]
        if oid in fertig and os.path.exists(os.path.join(ZIEL, oid + ".jpg")):
            continue
        quelle = None
        try:
            if oid in LOC:
                nr, url, art, motiv = LOC[oid]
                speichern(oid, holen(url))
                kenn = loc_kennung(url) or nr
                zeit = "um 1890–1900" if art == "Photochrom" else "um 1900–1920"
                quelle = f"Foto: {art} {zeit} ({motiv}) · Library of Congress ({kenn}) · gemeinfrei"
                time.sleep(2)
            elif oid in COMMONS and "--ohne-commons" not in sys.argv:
                quelle = commons(oid, COMMONS[oid], pause)
        except Exception as e:
            print("Fehler", oid, e)
        if quelle:
            zeilen = [z for z in zeilen if z["id"] != oid] + [{"id": oid, "quelle": quelle}]
            with open(TSV, "w", encoding="utf-8") as f:
                f.write("id\tquelle\n" + "".join(f"{z['id']}\t{z['quelle']}\n" for z in zeilen))
            print("ok", oid, quelle)
        else:
            print("kein Foto:", oid)


if __name__ == "__main__":
    main()
