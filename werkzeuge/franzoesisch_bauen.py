"""Baut die persönliche Französisch-App in app/franzoesisch/: daten.js, basis.css, Icons, Manifest, sw.js.
Inhalte: inhalte/franzoesisch/*.tsv (ein TSV je Thema, Reihenfolge = THEMEN). Aufruf: python3 werkzeuge/franzoesisch_bauen.py
Konzept: docs/franzoesisch/konzept.md
"""
import csv, hashlib, json, os, shutil, sys
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
BASIS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INHALTE = os.path.join(BASIS, "inhalte", "franzoesisch")
APP = os.path.join(BASIS, "app", "franzoesisch")
SCHRIFT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

# Themen in Lernreihenfolge (die tägliche Séance nimmt neue Wendungen in dieser Reihenfolge)
THEMEN = [
    {"id": "profs", "name": "Entre profs", "de": "Unter Lehrern – mit Aurélien", "symbol": "🧑‍🏫", "datei": "entre_profs.tsv"},
    {"id": "sentiments", "name": "Sentiments et ambiances", "de": "Gefühle und Stimmungen", "symbol": "🎭", "datei": "sentiments.tsv"},
    {"id": "chats", "name": "Les chats", "de": "Die Katzen", "symbol": "🐈", "datei": "chats.tsv"},
    {"id": "musique", "name": "Musique et langue", "de": "Musik und Sprache", "symbol": "🎵", "datei": "musique.tsv"},
    {"id": "histoires", "name": "Histoires et fantasy", "de": "Geschichten und Fantasy", "symbol": "🐉", "datei": "histoires.tsv"},
]

# Titel – französische Delikatessen, vom kleinen Éclair bis zum Kaviar (Vorschlag, docs/franzoesisch/konzept.md)
TITEL = [(0, "Petit éclair", "🍮"), (300, "Croissant", "🥐"), (900, "Baguette", "🥖"), (1800, "Crêpe", "🥞"),
         (3000, "Fromage", "🧀"), (4500, "Huîtres", "🦪"), (6500, "Caviar", "✨")]
SPIEL_TEXTE = {  # gesprochen von Mr. Alex (audio/spiel/<id>.mp3), solange keine Datei da ist: Stimme des Geräts
    "feuer": "Tu es en feu ! Trois jours de suite !",
    "woche": "Semaine parfaite ! Tu as travaillé chaque jour d'école. Bravo !",
    "monat": "Quatre semaines parfaites de suite ! Quel champion !",
    "fini": "C'est fini pour aujourd'hui. À demain !",
}
# Tagespensum (Mr. Alex, 13.10.): 5 neue Wendungen, höchstens 15 Wiederholungen
PENSUM = {"neu": 5, "wiederholung": 15}
# Leitner-Stufen: nach so vielen Tagen kommt eine Wendung wieder (Stufe 0 = neu / vergessen)
INTERVALLE = [1, 3, 7, 14, 30, 60, 120]


def tsv(name):
    with open(os.path.join(INHALTE, name), encoding="utf-8") as f:
        return list(csv.DictReader(f, delimiter="\t"))


def rein(markup):
    """comm{an|en}ç{on|on}s → commençons"""
    import re
    return re.sub(r"\{[a-z]+\|([^}]*)\}", r"\1", markup)


def audio(rel):
    """Pfad relativ zu app/franzoesisch, nur wenn die Datei existiert (sonst Sprachausgabe des Geräts)."""
    return rel if os.path.exists(os.path.join(APP, rel)) else None


def main():
    os.makedirs(APP, exist_ok=True)
    wendungen, themen = [], []
    for t in THEMEN:
        ids = []
        for z in tsv(t["datei"]):
            wid = z["id"]
            assert wid not in [w["id"] for w in wendungen], f"doppelte ID {wid}"
            assert z["luecke"] in z["satz_fr"], f"{wid}: Lücke „{z['luecke']}“ steht nicht im Satz"
            assert bool(z["passe_compose"]) == bool(z["futur_proche"]), f"{wid}: Zeitmaschine braucht beide Zeiten"
            w = {"id": wid, "thema": t["id"], "fr": z["wendung"], "de": z["deutsch"], "register": z["register"] or "tu",
                 "anker": z["anker"], "audio": audio(f"audio/wendungen/{wid}.mp3"),
                 "satz": {"fr": z["satz_fr"], "de": z["satz_de"], "luecke": z["luecke"], "audio": audio(f"audio/saetze/{wid}.mp3")},
                 "zeit": None}
            if z["passe_compose"]:
                w["zeit"] = {"pc": {"fr": z["passe_compose"], "audio": audio(f"audio/saetze/{wid}_pc.mp3")},
                             "fp": {"fr": z["futur_proche"], "audio": audio(f"audio/saetze/{wid}_fp.mp3")}}
            wendungen.append(w)
            ids.append(wid)
        themen.append({"id": t["id"], "name": t["name"], "de": t["de"], "symbol": t["symbol"], "wendungen": ids})
    # Dialoge mit Aurélien: A = Alex (Mr. Alex' Stimme), B = Aurélien (zweite Stimme, siehe franzoesisch_audio.py)
    dialoge = []
    for z in tsv("dialoge.tsv"):
        if not dialoge or dialoge[-1]["id"] != z["dialog"]:
            dialoge.append({"id": z["dialog"], "titel": z["titel"], "ort": z["ort"], "zeilen": []})
        dialoge[-1]["zeilen"].append({"id": z["id"], "rolle": z["rolle"], "fr": z["fr"], "de": z["de"], "audio": audio(f"audio/dialoge/{z['id']}.mp3")})
    # Prononciation – Nasallaute: Klänge, Minimalpaare, beide Klänge in einem Wort (Markup {klang|buchstaben})
    nasale = {"klaenge": {}, "paare": [], "beide": []}
    zeilen = tsv("nasale.tsv")
    for z in zeilen:
        wort = rein(z["wort"])
        eintrag = {"id": z["id"], "wort": wort, "de": z["de"], "klang": z["klang"], "audio": audio(f"audio/nasale/{z['id']}.mp3")}
        if z["teil"] == "klang":
            nasale["klaenge"].setdefault(z["klang"], []).append(eintrag)
        elif z["teil"] == "paar" and z["id"].endswith("a"):
            b = next(x for x in zeilen if x["id"] == z["partner"])
            eintrag["gruppe"] = z["id"].split("_")[0]
            eintrag["b"] = {"id": b["id"], "wort": rein(b["wort"]), "de": b["de"], "klang": b["klang"], "audio": audio(f"audio/nasale/{b['id']}.mp3")}
            nasale["paare"].append(eintrag)
        elif z["teil"] == "beide":
            eintrag["markup"] = z["wort"]; eintrag["klaenge"] = z["klang"].split(",")
            nasale["beide"].append(eintrag)
    # Geschichte « Le secret du Louvre »: ein Kapitel je perfekte Woche (Kapitel 1 frei), Absätze mit **Wendungen**
    geschichte = []
    for z in tsv("geschichte.tsv"):
        if not geschichte or geschichte[-1]["nr"] != int(z["kapitel"]):
            geschichte.append({"nr": int(z["kapitel"]), "titel": z["titel"], "absaetze": []})
        aid = f"k{int(z['kapitel']):02d}_{int(z['nr']):02d}"
        geschichte[-1]["absaetze"].append({"id": aid, "fr": z["fr"], "de": z["de"], "audio": audio(f"audio/geschichte/{aid}.mp3")})
    lob = {}
    for z in tsv("lob.tsv"):
        lob.setdefault(z["art"], []).append({"text": z["text"], "audio": audio(f"audio/lob/{z['id']}.mp3"),
                                             "gruppe": [g for g in z["gruppe"].split(",") if g]})
    daten = {"themen": themen, "wendungen": wendungen, "dialoge": dialoge, "nasale": nasale, "geschichte": geschichte, "lob": lob, "pensum": PENSUM, "intervalle": INTERVALLE,
             "spiel": spieldaten()}
    with open(os.path.join(APP, "daten.js"), "w", encoding="utf-8") as f:
        f.write("// Automatisch erzeugt von werkzeuge/franzoesisch_bauen.py – bitte nicht von Hand ändern.\n")
        f.write("window.DATEN = " + json.dumps(daten, ensure_ascii=False, indent=1) + ";\n")
    shutil.copyfile(os.path.join(BASIS, "app", "style.css"), os.path.join(APP, "basis.css"))
    webapp()
    mit_audio = sum(1 for w in wendungen if w["satz"]["audio"])
    print("Französisch:", len(themen), "Themen,", len(wendungen), "Wendungen,", mit_audio, "Sätze mit Audio")


def spieldaten():
    import frei_saarland, frankreich_karte
    karte, departement, proj = frankreich_karte.laden(os.path.join(INHALTE, "karte"))
    orte = []
    for z in tsv("orte.tsv"):
        lon, lat = float(z["lon"]), float(z["lat"])
        x, y = proj(lon, lat)
        dep = departement(lon, lat)
        orte.append({"id": z["id"], "name": z["name"], "region": z["region"], "dep": dep, "dep_name": karte[dep]["nom"],
                     "x": x, "y": y, "fakt": z["fakt_fr"], "fakt_de": z["fakt_de"], "audio": audio(f"audio/orte/{z['id']}.mp3")})
    return {
        "orte": orte, "karte": karte,
        "titel": [{"ab": ab, "name": n, "symbol": s, "audio": audio(f"audio/spiel/titel_{i}.mp3")} for i, (ab, n, s) in enumerate(TITEL)],
        "texte": {k: {"text": t, "audio": audio(f"audio/spiel/{k}.mp3")} for k, t in SPIEL_TEXTE.items()},
        "frei": frei_saarland.als_daten(),
    }


BLEU, BLANC, ROUGE = (0, 85, 164), (255, 255, 255), (239, 65, 53)


def webapp():
    os.makedirs(os.path.join(APP, "icons"), exist_ok=True)
    for g in (180, 192, 512):
        ziel = os.path.join(APP, "icons", f"icon-{g}.png")
        if os.path.exists(ziel):
            continue
        img = Image.new("RGB", (g, g), BLEU)
        d = ImageDraw.Draw(img)
        d.rectangle([g / 3, 0, 2 * g / 3, g], fill=BLANC)   # Trikolore
        d.rectangle([2 * g / 3, 0, g, g], fill=ROUGE)
        d.ellipse([g * 0.22, g * 0.22, g * 0.78, g * 0.78], fill=BLANC, outline=(24, 44, 92), width=max(2, g // 40))
        d.text((g / 2, g * 0.5), "F", font=ImageFont.truetype(SCHRIFT, int(g * 0.42)), fill=(24, 44, 92), anchor="mm")
        img.save(ziel)
    manifest = {"name": "Mon français", "short_name": "Français", "lang": "fr",
                "start_url": "./", "scope": "./", "display": "standalone",
                "background_color": "#f4f6fb", "theme_color": "#0a2a6b",
                "icons": [{"src": f"icons/icon-{g}.png", "sizes": f"{g}x{g}", "type": "image/png", "purpose": "any maskable"}
                          for g in (192, 512)]}
    with open(os.path.join(APP, "manifest.webmanifest"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
    dateien, h = ["./"], hashlib.sha1()
    for wurzel, _, namen in sorted(os.walk(APP)):
        for n in sorted(namen):
            pfad = os.path.join(wurzel, n)
            rel = os.path.relpath(pfad, APP).replace(os.sep, "/")
            if rel in ("sw.js",):
                continue
            dateien.append(rel)
            with open(pfad, "rb") as f:
                h.update(rel.encode() + f.read())
    version = h.hexdigest()[:12]
    with open(os.path.join(APP, "sw.js"), "w", encoding="utf-8") as f:
        f.write(f"""// Automatisch erzeugt von werkzeuge/franzoesisch_bauen.py – Offline-Speicher der Französisch-App.
const VERSION = "mralex-fr-{version}";
const DATEIEN = {json.dumps(dateien)};
self.addEventListener("install", (e) => {{
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
}});
self.addEventListener("activate", (e) => {{
  e.waitUntil(caches.keys().then((alle) => Promise.all(alle.filter((k) => k.startsWith("mralex-fr-") && k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
}});
self.addEventListener("fetch", (e) => {{
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request, {{ ignoreSearch: true }}).then((r) => r || fetch(e.request)));
}});
""")
    print("Web-App Französisch:", len(dateien), "Dateien, Version", version)


if __name__ == "__main__":
    main()
