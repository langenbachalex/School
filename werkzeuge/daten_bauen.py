"""Baut app/daten.js aus inhalte/*.tsv (damit die App auch per Doppelklick ohne Server läuft).
Aufruf: python3 werkzeuge/daten_bauen.py
"""
import csv, json, os, re

BASIS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INHALTE = os.path.join(BASIS, "inhalte")
AUDIO = os.path.join(BASIS, "app", "audio", "kernsaetze")

STATIONEN = [
    {"nr": 1, "titel": "Wege zur Schule", "symbol": "🚌", "lob": "bei den Wegen zur Schule",
     "schritte": [{"art": "lr", "saetze": [f"st1_{i:02d}" for i in range(1, 11)]}]},
    {"nr": 2, "titel": "he / she / it + s", "symbol": "➕", "lob": "bei he/she/it", "schritte": []},
    {"nr": 3, "titel": "Uhrzeiten", "symbol": "🕖", "lob": "bei den Uhrzeiten", "schritte": []},
    {"nr": 4, "titel": "Aufgaben verstehen", "symbol": "🔍", "lob": "beim Aufgaben-Verstehen", "schritte": []},
    {"nr": 5, "titel": "Spiele", "symbol": "🎲", "lob": "bei den Spielen", "schritte": []},
]


def lesen(name):
    with open(os.path.join(INHALTE, name), encoding="utf-8") as f:
        return list(csv.DictReader(f, delimiter="\t"))


def main():
    symbole = {z["wort"]: z["symbol"] for z in lesen("symbole.tsv")}
    saetze = {}
    for z in lesen("kernsaetze.tsv"):
        luecke = re.search(r"\[([^\]]+)\]", z["englisch"])
        audio = {k: f"audio/kernsaetze/{z['id']}_{k}.mp3" for k in ("en_m", "en_f", "de")
                 if os.path.exists(os.path.join(AUDIO, f"{z['id']}_{k}.mp3"))}
        saetze[z["id"]] = {
            "en": z["englisch"].replace("[", "").replace("]", ""),
            "de": z["deutsch"],
            "luecke": luecke.group(1) if luecke else "",
            "symbol": symbole.get(luecke.group(1), "") if luecke else "",
            "hinweis": z.get("hinweis", ""),
            "audio": audio,
        }
    for st in STATIONEN:
        for s in st["schritte"]:
            for sid in s.get("saetze", []):
                assert sid in saetze, f"Satz {sid} fehlt in kernsaetze.tsv"
    daten = {"stationen": STATIONEN, "saetze": saetze}
    ziel = os.path.join(BASIS, "app", "daten.js")
    with open(ziel, "w", encoding="utf-8") as f:
        f.write("// Automatisch erzeugt von werkzeuge/daten_bauen.py – bitte nicht von Hand ändern.\n")
        f.write("window.DATEN = " + json.dumps(daten, ensure_ascii=False, indent=1) + ";\n")
    print(ziel, len(saetze), "Sätze")


if __name__ == "__main__":
    main()
