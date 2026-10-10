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
    {"nr": 3, "titel": "Uhrzeiten", "symbol": "🕖", "lob": "bei den Uhrzeiten",
     "schritte": [
         {"art": "lr", "name": "", "saetze": [f"st3_{i:02d}" for i in range(1, 7)]},
         {"art": "erklaerung", "name": "a.m. / p.m.", "bloecke": [
             {"typ": "text", "text": "Lernen wir a.m. und p.m.! Im Englischen zählen wir die Stunden nur bis 12."},
             {"typ": "regeln", "punkte": [
                 ["a.m. = vormittags:", "von Mitternacht bis Mittag · 6.45 a.m. = 6:45 Uhr morgens"],
                 ["p.m. = nachmittags / abends:", "von Mittag bis Mitternacht · 3.20 p.m. = 15:20 Uhr (15 – 12 = 3)"]]},
             {"typ": "tabelle", "zeilen": [["20.00", "→ It's eight p.m.", "st3u_01"], ["13.15", "→ It's one fifteen p.m.", "st3u_02"],
                                           ["6.45", "→ It's six forty-five a.m.", "st3u_03"]], "markiert": -1},
             {"typ": "merksatz", "text": "Ab 13 Uhr: minus 12 – und dahinter p.m.!"}]},
         {"art": "auswahl", "name": "Übung", "ansage": "Wie sagst du die Uhrzeit auf Englisch? Tipp auf die richtige Antwort!",
          "aufgaben": [
              {"frage": "20.00 Uhr", "optionen": ["It's 8 p.m.", "It's 8 a.m.", "It's 20 p.m."], "satz": "st3u_01", "hilfe": "20 – 12 = 8. Und abends heißt p.m."},
              {"frage": "13.15 Uhr", "optionen": ["It's 1.15 p.m.", "It's 1.15 a.m.", "It's 13.15 p.m."], "satz": "st3u_02", "hilfe": "13 – 12 = 1. Und nachmittags heißt p.m."},
              {"frage": "6.45 Uhr", "optionen": ["It's 6.45 a.m.", "It's 6.45 p.m.", "It's 18.45 a.m."], "satz": "st3u_03", "hilfe": "Morgens, also vor Mittag, heißt a.m."},
              {"frage": "15.00 Uhr", "optionen": ["It's 3 p.m.", "It's 3 a.m.", "It's 15 p.m."], "satz": "st3u_04", "hilfe": "15 – 12 = 3. Und nachmittags heißt p.m."},
              {"frage": "7.30 Uhr", "optionen": ["It's 7.30 a.m.", "It's 7.30 p.m.", "It's 19.30 a.m."], "satz": "st3u_05", "hilfe": "Vor Mittag heißt a.m."},
              {"frage": "21.00 Uhr", "optionen": ["It's 9 p.m.", "It's 9 a.m.", "It's 21 p.m."], "satz": "st3u_06", "hilfe": "21 – 12 = 9. Und abends heißt p.m."}]},
     ]},
    {"nr": 4, "titel": "Aufgaben verstehen", "symbol": "🔍", "lob": "beim Aufgaben-Verstehen", "schritte": []},
    {"nr": 5, "titel": "Spiele", "symbol": "🎲", "lob": "bei den Spielen", "schritte": []},
    {"nr": 6, "titel": "Hörverstehen", "symbol": "🎧", "lob": "beim Hörverstehen", "schritte": []},  # aus inhalte/hoeren
    # Neu erklärt: neue Inhalte als Abschnitte (je Erklärung, Listen and Repeat, Übung); Woche für Woche erweiterbar
    {"nr": 8, "titel": "Neu erklärt", "symbol": "💡", "lob": "bei den neuen Themen", "schritte": [], "gruppen": [
        {"name": "How often? (never … always)", "symbol": "●●●○○○○", "schritte": [
            {"art": "erklaerung", "name": "Erklärung", "bloecke": [
                {"typ": "text", "text": "How often? – Wie oft? Die Punkte zeigen die sieben Tage einer Woche."},
                {"typ": "tabelle", "zeilen": [[w, d, f"st8s_{w}"] for w, d in [
                    ("never", "○○○○○○○"), ("rarely", "●○○○○○○"), ("sometimes", "●●●○○○○"), ("often", "●●●●●○○"), ("always", "●●●●●●●")]],
                 "markiert": -1},
                {"typ": "regeln", "punkte": [
                    ["Das Wort steht vor dem Verb:", "I often go cycling."],
                    ["Bei he / she / it bekommt das Verb trotzdem das -s:", "She often goes cycling."]]},
                {"typ": "merksatz", "text": "never – rarely – sometimes – often – always",
                 "saetze": [f"st8s_{w}" for w in ("never", "rarely", "sometimes", "often", "always")], "sprache": "en_m"}]},
            {"art": "lr", "name": "Sätze", "saetze": [[f"st8f_{i:02d}_i", f"st8f_{i:02d}_he"] for i in range(1, 6)]},
            {"art": "reihenfolge", "name": "Ordnen", "woerter": [f"st8s_{w}" for w in ("never", "rarely", "sometimes", "often", "always")],
             "hilfe": "Denk an die Punkte: An wie vielen Tagen pro Woche? Wir fangen bei „nie“ an."},
            {"art": "auswahl", "name": "Right or wrong?", "ansage": "Stimmt der Satz? Schau genau aufs Verb!", "aufgaben": [
                {"frage": t, "optionen": ["That's right.", "No, that's wrong."], "richtig": "That's right." if ok else "No, that's wrong.",
                 "satz": f"st8r_{i:02d}", "korrektur": True,
                 "hilfe": "Schau aufs Verb: I / you → play, go. He / she → plays, goes."}
                for i, (t, ok) in enumerate([("He sometimes play football.", False), ("I never go swimming.", True),
                    ("She often goes surfing.", True), ("You rarely plays hockey.", False), ("She always go cycling.", False),
                    ("I sometimes play football.", True), ("He never goes swimming.", True), ("I often goes cycling.", False)], 1)]},
            {"art": "lr", "name": "Übersetzen", "stufen": [4], "saetze": [f"st8w_{i:02d}" for i in range(1, 7)]},
        ]},
        {"name": "Sports and hobbies", "symbol": "🎭 🎨 🏏", "schritte": [
            {"art": "lr", "name": "I like …", "stufen": [1, 3], "saetze": [f"st8h_{i:02d}" for i in range(1, 15)]},
            {"art": "lr", "name": "Who does what?", "saetze": [f"st8p_{i:02d}" for i in range(1, 6)]},
            {"art": "lr", "name": "like … but", "saetze": [f"st8e_{i:02d}" for i in range(1, 5)]},
        ]},
        {"name": "School clubs", "symbol": "🏫 🎬 ⚽", "schritte": [
            {"art": "lr", "name": "Clubs", "stufen": [1, 2, 3], "saetze": [f"st8c_{i:02d}" for i in range(1, 14)]},
        ]},
    ]},
    # Vokabeln (Unit 3): erst Abschnitt wählen, dann je Abschnitt diese Schritte
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
        hv = next(x for x in STATIONEN if x["nr"] == 6)
        hv["schritte"].append({"art": "hoeren", "name": f"Hören {len(hv['schritte']) + 1}", "uebung": u})

    alle_schritte = lambda st: st["schritte"] + [x for g in st.get("gruppen", []) for x in g.get("schritte", [])]
    for st in STATIONEN:
        for s in alle_schritte(st):
            for b in s.get("bloecke", []):
                if b["typ"] == "merksatz":
                    ids = b.pop("saetze", [b.pop("audio")] if "audio" in b else [])
                    sprache = b.pop("sprache", "de")
                    b["dateien"] = [saetze[i]["audio"].get(sprache) for i in ids]
            if s["art"] == "auswahl":
                for a in s["aufgaben"]:
                    a.setdefault("richtig", a["optionen"][0])
                    assert a["satz"] in saetze, a["satz"]
            if s["art"] == "reihenfolge":
                for w in s["woerter"]:
                    assert w in saetze, w
        for s in alle_schritte(st):
            for eintrag in s.get("saetze", []):
                for sid in (eintrag if isinstance(eintrag, list) else [eintrag]):
                    assert sid in saetze, f"Satz {sid} fehlt in kernsaetze.tsv"
            if s["art"] == "verbform":
                s["aufgaben"] = []
                for sid in s.pop("saetze"):
                    richtig = saetze[sid]["luecke"]
                    falsch, hilfe = VERBFORMEN[richtig]
                    s["aufgaben"].append({"satz": sid, "richtig": richtig, "falsch": falsch, "hilfe": hilfe})
    vokabeln, abschnitte = [], []
    for v in lesen("vokabeln.tsv"):
        luecke = v.get("luecke") or re.sub(r"^\(to\) ", "", v["englisch"])
        if v["satz"]:
            satz = saetze.get(v["satz"])
            assert satz, f"Vokabel {v['id']}: Satz {v['satz']} fehlt"
            assert luecke.lower() in satz["en"].lower(), f"Vokabel {v['id']} steht nicht im Satz {v['satz']}"
        vokabeln.append({"id": v["id"], "en": v["englisch"], "de": v["deutsch"], "symbol": v["symbol"],
                         "satz": v["satz"], "luecke": luecke,
                         "audio": {k: f"audio/vokabeln/{v['id']}_{k}.mp3" for k in ("en", "de")}})
        if not abschnitte or abschnitte[-1][0] != v["abschnitt"]:
            abschnitte.append((v["abschnitt"], []))
        abschnitte[-1][1].append(v["id"])
    # Abschnitte wie im Buch; lange Abschnitte in Teile mit höchstens 13 Wörtern
    gruppen = []
    for name, ids in abschnitte:
        n = -(-len(ids) // 13)
        groesse = -(-len(ids) // n)
        for t in range(n):
            gruppen.append({"name": name + (f" · Teil {t + 1}" if n > 1 else ""), "vokabeln": ids[t * groesse:(t + 1) * groesse]})
    next(x for x in STATIONEN if x["nr"] == 7)["gruppen"] = gruppen
    STATIONEN.sort(key=lambda x: x["nr"])
    daten = {"stationen": STATIONEN, "saetze": saetze, "vokabeln": vokabeln,
             "mittel": {k: symbole[k] for k in ("bus", "car", "bike", "train", "walk")}}
    ziel = os.path.join(BASIS, "app", "daten.js")
    with open(ziel, "w", encoding="utf-8") as f:
        f.write("// Automatisch erzeugt von werkzeuge/daten_bauen.py – bitte nicht von Hand ändern.\n")
        f.write("window.DATEN = " + json.dumps(daten, ensure_ascii=False, indent=1) + ";\n")
    print(ziel, len(saetze), "Sätze")


if __name__ == "__main__":
    main()
