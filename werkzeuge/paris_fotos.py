"""Lädt Fotos für die Paris-Karte der Französisch-App (inhalte/franz/paris.tsv), die noch keins haben, von Wikimedia Commons.

Erlaubt: Public Domain, CC0, CC BY, CC BY-SA (Quellenzeile mit Urheber und Lizenz). Erst bekannte Dateinamen (KANDIDATEN), sonst Commons-Suche.
Commons sperrt schnell (429) → lange Pausen; fertige Orte werden übersprungen, das Skript kann jederzeit neu gestartet werden.
Ablage: app/franz/bilder/paris/<id>.jpg (max. 960 px) + Zeile in inhalte/franz/paris_fotos.tsv. Danach werkzeuge/franz_bauen.py.
Aufruf: python3 werkzeuge/paris_fotos.py [--pause 90]
"""
import io, json, os, re, sys, time, urllib.error, urllib.parse, urllib.request
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import franz_bauen as fb

UA = "SchoolLearningApp/1.0 (https://github.com/langenbachalex/School; non-commercial classroom app)"
API = "https://commons.wikimedia.org/w/api.php"
ZIEL = os.path.join(fb.APP, "bilder", "paris")
TSV = os.path.join(fb.INHALT, "paris_fotos.tsv")
KANDIDATEN = {
    "sacre_coeur": ["Basilique du Sacré-Cœur de Montmartre, Paris 18e 140223 2.jpg", "Le sacre coeur.jpg"],
    "montmartre": ["Place du Tertre.jpg"],
    "orsay": ["Musée d'Orsay clock.jpg"],
    "metro": [], "boulangerie": [], "pompidou": [], "stade_de_france": [],
}
SUCHE = {"sacre_coeur": "Sacré-Cœur Montmartre basilica", "montmartre": "Place du Tertre painters", "orsay": "Musée d'Orsay clock",
         "metro": "Abbesses metro station entrance Guimard", "boulangerie": "boulangerie Paris storefront", "pompidou": "Centre Pompidou facade",
         "stade_de_france": "Stade de France stadium"}


def holen(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def info(titel):
    q = urllib.parse.urlencode({"action": "query", "format": "json", "titles": "File:" + titel, "prop": "imageinfo",
                                "iiprop": "url|extmetadata", "iiurlwidth": 960})
    for s in json.loads(holen(f"{API}?{q}"))["query"]["pages"].values():
        if "imageinfo" in s:
            return s["imageinfo"][0]
    return None


def suche(text):
    q = urllib.parse.urlencode({"action": "query", "format": "json", "list": "search", "srnamespace": 6, "srlimit": 5,
                                "srsearch": f"{text} filetype:bitmap"})
    return [t["title"][5:] for t in json.loads(holen(f"{API}?{q}"))["query"]["search"]]


def lizenz(ii):
    l = ii.get("extmetadata", {}).get("LicenseShortName", {}).get("value", "")
    return l if re.search(r"public domain|^PD|CC0|CC BY", l, re.I) and not re.search(r"NC|ND", l) else None


def main():
    pause = float(sys.argv[sys.argv.index("--pause") + 1]) if "--pause" in sys.argv else 90
    os.makedirs(ZIEL, exist_ok=True)
    zeilen = fb.tsv("paris_fotos.tsv") if os.path.exists(TSV) else []
    fertig = {z["id"] for z in zeilen}
    for o in fb.tsv("paris.tsv"):
        if o["id"] in fertig or os.path.exists(os.path.join(ZIEL, o["id"] + ".jpg")):
            continue
        titel = list(KANDIDATEN.get(o["id"], []))
        for versuch in range(4):
            try:
                if not titel:
                    titel = suche(SUCHE.get(o["id"], o["name"]))
                    time.sleep(pause)
                gefunden = False
                for t in titel:
                    ii = info(t)
                    time.sleep(pause)
                    l = ii and lizenz(ii)
                    if not l:
                        print("  nicht frei/fehlt:", t)
                        continue
                    im = Image.open(io.BytesIO(holen(ii.get("thumburl") or ii["url"]))).convert("RGB")
                    im.thumbnail((960, 960))
                    im.save(os.path.join(ZIEL, o["id"] + ".jpg"), quality=82)
                    autor = re.sub(r"<[^>]+>", "", ii.get("extmetadata", {}).get("Artist", {}).get("value", "")).strip() or "unbekannt"
                    zeilen.append({"id": o["id"], "quelle": f"Foto: {autor[:70]} · {l} · Wikimedia Commons"})
                    with open(TSV, "w", encoding="utf-8") as f:
                        f.write("id\tquelle\n" + "".join(f"{z['id']}\t{z['quelle']}\n" for z in zeilen))
                    print("ok", o["id"], t, l, flush=True)
                    gefunden = True
                    break
                if not gefunden:
                    print("kein freies Foto:", o["id"], flush=True)
                break
            except urllib.error.HTTPError as e:
                print("  HTTP", e.code, o["id"], "– warte", flush=True)
                time.sleep(pause * 3)
        time.sleep(pause)


if __name__ == "__main__":
    main()
