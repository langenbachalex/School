"""Baut app/daten.js aus inhalte/*.tsv (damit die App auch per Doppelklick ohne Server läuft).
Aufruf: python3 werkzeuge/daten_bauen.py
"""
import csv, json, os, re

import hoeren

BASIS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INHALTE = os.path.join(BASIS, "inhalte")
AUDIO = os.path.join(BASIS, "app", "audio", "kernsaetze")

A_PAARE = [[f"st2a_{i:02d}_i", f"st2a_{i:02d}_he"] for i in range(1, 7)]
B_PAARE = [[f"st2b_{i:02d}_i", f"st2b_{i:02d}_he"] for i in range(1, 6)]

HILFE_S = "Bei he, she, it braucht das Verb ein -s."
HILFE_O = "Verben auf -o bekommen -es: go → goes, do → does."
HILFE_SH_CH = "Verben auf -sh und -ch bekommen -es: wash → washes, watch → watches."
HILFE_HAS = "Ganz besonders: have wird zu has."
# Übung Station 2: richtige Form (= Lücke im Satz) und falsche Formen zur Auswahl
VERBFORMEN = {
    "plays": (["play"], HILFE_S), "likes": (["like"], HILFE_S), "walks": (["walk"], HILFE_S),
    "gets": (["get"], HILFE_S), "reads": (["read"], HILFE_S), "eats": (["eat"], HILFE_S),
    "goes": (["go", "gos"], HILFE_O), "does": (["do", "dos"], HILFE_O),
    "watches": (["watch", "watchs"], HILFE_SH_CH), "washes": (["wash", "washs"], HILFE_SH_CH),
    "has": (["have", "haves"], HILFE_HAS),
}

STATIONEN = [
    {"nr": 1, "titel": "Wege zur Schule", "symbol": "🚌", "lob": "bei den Wegen zur Schule",
     "schritte": [{"art": "lr", "name": "", "saetze": [f"st1_{i:02d}" for i in range(1, 11)]}]},
    {"nr": 2, "titel": "he / she / it + s", "symbol": "➕", "lob": "bei he/she/it",
     "schritte": [
         {"art": "lr", "name": "Teil A", "saetze": A_PAARE},
         {"art": "erklaerung", "name": "Übersicht", "bloecke": [
             {"typ": "text", "text": "Schau genau hin: Nur bei he, she und it bekommt das Verb ein -s."},
             {"typ": "tabelle", "zeilen": [
                 ["I", "walk to school.", "st2u_01"], ["you", "walk to school.", "st2u_02"],
                 ["he / she / it", "walks to school.", "st2u_03"], ["we", "walk to school.", "st2u_04"],
                 ["you", "walk to school.", "st2u_05"], ["they", "walk to school.", "st2u_06"]],
              "markiert": 2},
             {"typ": "merksatz", "text": "he, she, it – das s muss mit!", "audio": "st2_merksatz"}]},
         {"art": "lr", "name": "Teil B", "saetze": B_PAARE},
         {"art": "erklaerung", "name": "Ausnahmen", "bloecke": [
             {"typ": "text", "text": "Manche Verben bekommen nicht nur ein -s. Lernen wir die Ausnahmen!"},
             {"typ": "regeln", "punkte": [
                 ["Verben auf -o bekommen -es:", "go → goes, do → does"],
                 ["Verben auf -sh, -ch, -s, -x bekommen -es:", "wash → washes, watch → watches, kiss → kisses, mix → mixes"],
                 ["Ganz besonders:", "have → has"]]}]},
         {"art": "verbform", "name": "Übung", "saetze": [p[1] for p in A_PAARE + B_PAARE]},
     ]},
    {"nr": 3, "titel": "Uhrzeiten", "symbol": "🕖", "lob": "bei den Uhrzeiten", "schritte": []},
    {"nr": 4, "titel": "Aufgaben verstehen", "symbol": "🔍", "lob": "beim Aufgaben-Verstehen", "schritte": []},
    {"nr": 5, "titel": "Spiele", "symbol": "🎲", "lob": "bei den Spielen", "schritte": []},
    {"nr": 6, "titel": "Hörverstehen", "symbol": "🎧", "lob": "beim Hörverstehen", "schritte": []},  # aus inhalte/hoeren
    {"nr": 7, "titel": "Vokabeln", "symbol": "📖", "lob": "bei den Vokabeln",
     "schritte": [
         {"art": "vok_lernen", "name": "Wörter"},
         {"art": "vok_luecke", "name": "Lückensätze"},
         {"art": "vok_abfrage", "name": "Englisch → Deutsch", "richtung": "en_de"},
         {"art": "vok_abfrage", "name": "Deutsch → Englisch", "richtung": "de_en"},
     ]},
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
    uebungen = hoeren.lesen()
    for u in uebungen:
        for t in u["teile"] + u["aufgaben"]:
            if "datei" in t:
                t["audio"] = f"audio/hoeren/{t.pop('datei')}.mp3"
                t.pop("sprech", None)
        for a in u["aufgaben"]:
            if "mittel" in a:
                assert a["mittel"] in symbole, f"Unbekanntes Verkehrsmittel {a['mittel']} in {u['id']}"
        STATIONEN[5]["schritte"].append({"art": "hoeren", "name": f"Hören {len(STATIONEN[5]['schritte']) + 1}", "uebung": u})

    for st in STATIONEN:
        for s in st["schritte"]:
            for eintrag in s.get("saetze", []):
                for sid in (eintrag if isinstance(eintrag, list) else [eintrag]):
                    assert sid in saetze, f"Satz {sid} fehlt in kernsaetze.tsv"
            if s["art"] == "verbform":
                s["aufgaben"] = []
                for sid in s.pop("saetze"):
                    richtig = saetze[sid]["luecke"]
                    falsch, hilfe = VERBFORMEN[richtig]
                    s["aufgaben"].append({"satz": sid, "richtig": richtig, "falsch": falsch, "hilfe": hilfe})
    vokabeln = []
    for v in lesen("vokabeln.tsv"):
        satz = saetze.get(v["satz"])
        assert satz, f"Vokabel {v['id']}: Satz {v['satz']} fehlt"
        assert v["englisch"].lower() in satz["en"].lower(), f"Vokabel {v['id']} steht nicht im Satz {v['satz']}"
        vokabeln.append({"id": v["id"], "en": v["englisch"], "de": v["deutsch"], "symbol": v["symbol"],
                         "satz": v["satz"], "audio": {k: f"audio/vokabeln/{v['id']}_{k}.mp3" for k in ("en_m", "de")}})
    daten = {"stationen": STATIONEN, "saetze": saetze, "vokabeln": vokabeln,
             "mittel": {k: symbole[k] for k in ("bus", "car", "bike", "train", "walk")}}
    ziel = os.path.join(BASIS, "app", "daten.js")
    with open(ziel, "w", encoding="utf-8") as f:
        f.write("// Automatisch erzeugt von werkzeuge/daten_bauen.py – bitte nicht von Hand ändern.\n")
        f.write("window.DATEN = " + json.dumps(daten, ensure_ascii=False, indent=1) + ";\n")
    print(ziel, len(saetze), "Sätze")


if __name__ == "__main__":
    main()
