"""Lädt gemeinfreie Bilder der Persönlichkeiten (inhalte/franz/namen.tsv, Spalte bild = „wm:…“) von Wikimedia Commons.

Nur Public Domain / CC0. Erst die bekannten Dateinamen (KANDIDATEN), sonst Commons-Suche; lange Pausen (Commons sperrt sonst mit 429).
Ablage: app/franz/bilder/namen/<id>.jpg (quadratisch, 360 px) + inhalte/franz/namen_fotos.tsv (Quellenzeile). Danach franz_bauen.py.
Aufruf: python3 werkzeuge/franz_fotos.py [--pause 150]
"""
import io, json, os, re, sys, time, urllib.parse, urllib.request
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import franz_bauen as fb

UA = "SchoolLearningApp/1.0 (https://github.com/langenbachalex/School; non-commercial classroom app)"
API = "https://commons.wikimedia.org/w/api.php"
ZIEL = os.path.join(fb.APP, "bilder", "namen")
TSV = os.path.join(fb.INHALT, "namen_fotos.tsv")
KANDIDATEN = {
    "napoleon": ["Jacques-Louis David - The Emperor Napoleon in His Study at the Tuileries - Google Art Project.jpg"],
    "charlemagne": ["Albrecht Dürer - Emperor Charlemagne - Google Art Project.jpg"],
    "vercingetorix": ["Lionel Royer - Vercingetorix jette ses armes aux pieds de Jules César.jpg"],
    "jeanne": ["Jean Auguste Dominique Ingres - Joan of Arc at the Coronation of Charles VII - Google Art Project 2.jpg"],
    "louis14": ["Louis XIV of France.jpg"],
    "curie": ["Marie Curie c1920.jpg"],
    "pasteur": ["Albert Edelfelt - Louis Pasteur - 1885.jpg"],
    "braille": ["Louis Braille.jpg"],
    "lumiere": ["Auguste and Louis Lumière.jpg"],
    "eiffel": ["Gustave Eiffel 1888.jpg", "Gustave Eiffel.jpg"],
    "verne": ["Félix Nadar 1820-1910 portraits Jules Verne.jpg"],
    "hugo": ["Victor Hugo by Étienne Carjat 1876 - full.jpg"],
    "dumas": ["Nadar - Alexander Dumas père (1802-1870) - Google Art Project 2.jpg", "Alexandre Dumas.jpg"],
    "moliere": ["Molière - Nicolas Mignard (Avignon 1658).jpg"],
    "monet": ["Claude Monet 1899 Nadar crop.jpg"],
    "coubertin": ["Pierre de Coubertin anagoria.JPG", "Pierre de Coubertin.jpg"],
}


def holen(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def info(titel):
    q = urllib.parse.urlencode({"action": "query", "format": "json", "titles": "File:" + titel, "prop": "imageinfo",
                                "iiprop": "url|extmetadata", "iiurlwidth": 400})
    seiten = json.loads(holen(f"{API}?{q}"))["query"]["pages"]
    for s in seiten.values():
        if "imageinfo" in s:
            return s["title"][5:], s["imageinfo"][0]
    return None, None


def suche(text):
    q = urllib.parse.urlencode({"action": "query", "format": "json", "list": "search", "srnamespace": 6, "srlimit": 5,
                                "srsearch": f"{text} portrait filetype:bitmap"})
    return [t["title"][5:] for t in json.loads(holen(f"{API}?{q}"))["query"]["search"]]


def frei(ii):
    m = ii.get("extmetadata", {})
    lizenz = m.get("LicenseShortName", {}).get("value", "")
    return lizenz if re.search(r"public domain|^PD|CC0", lizenz, re.I) else None


def quelle(ii, lizenz):
    autor = re.sub(r"<[^>]+>", "", ii.get("extmetadata", {}).get("Artist", {}).get("value", "")).strip() or "unbekannt"
    return f"{autor[:80]} · {lizenz} · Wikimedia Commons"


def main():
    pause = float(sys.argv[sys.argv.index("--pause") + 1]) if "--pause" in sys.argv else 150
    os.makedirs(ZIEL, exist_ok=True)
    zeilen = fb.tsv("namen_fotos.tsv") if os.path.exists(TSV) else []
    fertig = {z["id"] for z in zeilen}
    for n in fb.tsv("namen.tsv"):
        if not n["bild"].startswith("wm:") or n["id"] in fertig:
            continue
        try:
            treffer = None
            for titel in KANDIDATEN.get(n["id"], []) + ["?"]:
                kandidaten = suche(n["name"]) if titel == "?" else [titel]
                for k in kandidaten:
                    t, ii = info(k)
                    time.sleep(5)
                    if ii and frei(ii):
                        treffer = (t, ii)
                        break
                if treffer:
                    break
            if not treffer:
                print("kein freies Bild:", n["id"])
                continue
            t, ii = treffer
            img = Image.open(io.BytesIO(holen((ii.get("thumburl") or ii["url"]).replace("//thumb.wikimedia.org/", "//upload.wikimedia.org/")))).convert("RGB")
            w, h = img.size
            s = min(w, h)
            img = img.crop(((w - s) // 2, 0, (w - s) // 2 + s, s)).resize((360, 360))  # Porträt: oben bleibt der Kopf
            img.save(os.path.join(ZIEL, n["id"] + ".jpg"), quality=82)
            zeilen.append({"id": n["id"], "datei": t, "quelle": quelle(ii, frei(ii))})
            with open(TSV, "w", encoding="utf-8") as f:
                f.write("id\tdatei\tquelle\n" + "".join(f"{z['id']}\t{z['datei']}\t{z['quelle']}\n" for z in zeilen))
            print("ok", n["id"], t, flush=True)
        except Exception as e:  # 429 usw.: später erneut starten, Fertiges bleibt
            print("Fehler", n["id"], e, flush=True)
        time.sleep(pause)


if __name__ == "__main__":
    main()
