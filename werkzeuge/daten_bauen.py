"""Baut app/daten.js aus inhalte/*.tsv (damit die App auch per Doppelklick ohne Server läuft).
Aufruf: python3 werkzeuge/daten_bauen.py
"""
import csv, json, os, re, sys

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
    {"nr": 4, "titel": "Aufgaben verstehen", "symbol": "🔍", "lob": "beim Aufgaben-Verstehen",
     "schritte": [
         {"art": "erklaerung", "name": "true / false / not in the text", "bloecke": [
             {"typ": "text", "text": "Lernen wir, Aufgaben genau zu verstehen! Erst lesen, dann verstehen, dann lösen."},
             {"typ": "regeln", "punkte": [
                 ["true:", "Das steht so im Text."],
                 ["false:", "Der Text sagt etwas anderes."],
                 ["not in the text:", "Davon steht gar nichts im Text."]]},
             {"typ": "merksatz", "text": "Steht das wirklich im Text? Wenn nicht: not in the text!"}]},
         {"art": "lesen", "name": "Ben's Saturday", "titel": "Ben's Saturday", "text": "st4_text",
          "instruction": "Read the text. True, false or not in the text?",
          "optionen": ["true", "false", "not in the text"], "aufgaben": [
              {"satz": "st4_a_01", "loesung": "true"},
              {"satz": "st4_a_02", "loesung": "false", "hinweis": "Im Text steht: with his mum."},
              {"satz": "st4_a_03", "loesung": "false", "hinweis": "Im Text steht: he cycles – er fährt mit dem Rad."},
              {"satz": "st4_a_04", "loesung": "not in the text", "hinweis": "Steht das wirklich im Text? Wenn nicht: not in the text!"},
              {"satz": "st4_a_05", "loesung": "true"},
              {"satz": "st4_a_06", "loesung": "not in the text", "hinweis": "Steht das wirklich im Text? Wenn nicht: not in the text!"}]},
         {"art": "lr", "name": "cycle oder circle?", "stufen": [1, 2], "saetze": ["st4_cycle_satz", "st4_circle_satz"]},
         {"art": "hoerwahl", "name": "Welches Wort?", "paare": [
             [["st4_cycle_wort", "🚴", "cycle"], ["st4_circle_wort", "⭕", "circle"],
              "cycle klingt wie „sei-kl“ (Rad fahren), circle wie „sö-kl“ (Kreis)."],
             [["st4w_walk", "🚶", "walk"], ["st4w_work", "💼", "work"],
              "walk klingt wie „wook“ (gehen), work wie „wöök“ (arbeiten)."],
             [["st4w_three", "3️⃣", "three"], ["st4w_tree", "🌳", "tree"],
              "three beginnt mit dem th-Laut (Zunge zwischen die Zähne), tree mit einem normalen t."],
             [["st4w_thirteen", "13", "thirteen"], ["st4w_thirty", "30", "thirty"],
              "thirteen wird hinten betont: thir-TEEN. thirty wird vorne betont: THIR-ty."],
             [["st4w_fifteen", "15", "fifteen"], ["st4w_fifty", "50", "fifty"],
              "fifteen wird hinten betont: fif-TEEN. fifty wird vorne betont: FIF-ty."]]},
     ]},
    {"nr": 5, "titel": "Spiele", "symbol": "🎲", "lob": "bei den Spielen",
     "schritte": [
         {"art": "memory", "name": "Memory", "paare": 6,
          "pool": ["bus", "car", "train", "wheelchair", "shower", "breakfast", "newspaper", "clock", "letter",
                   "card", "sea", "money", "light", "cafe", "tooth"]},
         {"art": "detektiv", "name": "-s-Detektiv", "runden": 8,
          "personen": [["I", False], ["You", False], ["We", False], ["They", False],
                       ["He", True], ["She", True], ["Emily", True], ["Ben", True], ["Mia", True], ["My dad", True]],
          "verben": [["get", "gets", "up at 7."], ["play", "plays", "football."], ["go", "goes", "to school by bus."],
                     ["watch", "watches", "TV."], ["have", "has", "breakfast at 7.30."], ["like", "likes", "music."],
                     ["read", "reads", "a book."], ["walk", "walks", "to school."], ["wash", "washes", "the car."],
                     ["eat", "eats", "an apple."], ["do", "does", "the shopping."]]},
     ]},
    {"nr": 6, "titel": "Hörverstehen", "symbol": "🎧", "lob": "beim Hörverstehen", "schritte": []},  # aus inhalte/hoeren
    # Neu: neue Inhalte als Abschnitte (je Erklärung, Listen and Repeat, Übung); Woche für Woche erweiterbar
    {"nr": 8, "titel": "Neu", "symbol": "💡", "lob": "bei den neuen Themen", "schritte": [], "gruppen": [
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
         {"art": "vok_bild", "name": "Bild → Wort"},
         {"art": "vok_luecke", "name": "Lückensätze"},
         {"art": "vok_abfrage", "name": "Englisch → Deutsch", "richtung": "en_de"},
         {"art": "vok_abfrage", "name": "Deutsch → Englisch", "richtung": "de_en"},
     ]},
]


def lesen(name):
    with open(os.path.join(INHALTE, name), encoding="utf-8") as f:
        return list(csv.DictReader(f, delimiter="\t"))


# Belohnungen (Stufe A, docs/gamification/konzept.md): Titel nach Punkten, London-Orte, Superhelden
TITEL = [(0, "Butterfingers", "🧈"), (100, "Sidekick", "🎒"), (300, "Hero in Training", "🦸"), (700, "Hero", "⚡"),
         (1200, "Superhero", "🌟"), (2000, "Mega Hero", "👑")]
# Nächster Termin für den Countdown auf der Startseite (in Wochen); nach dem Termin verschwindet er
TERMIN = {"name": "GLN 2", "datum": "2026-11-24", "powerup": True}  # powerup: 14 Tage vorher werden alle erledigten Teile fällig (⚡ Power Up)
# Word Gym (docs/word-gym/konzept.md): Standard-Pensum und Boxen-Intervalle in Tagen
GYM = {"pensum": {"neu": 3, "wdh": 6}, "grenzen": {"neu": [1, 6], "wdh": [4, 12]}, "intervalle": [1, 3, 7, 14, 30, 60, 120]}
SPIEL_TEXTE = {  # gesprochen von Mr. Alex (audio/spiel/<id>.mp3)
    "titel_sidekick": "Congratulations! You are a Sidekick now!",
    "titel_hero_in_training": "Congratulations! You are a Hero in Training now!",
    "titel_hero": "Congratulations! You are a real Hero now!",
    "titel_superhero": "Congratulations! You are a Superhero now!",
    "titel_mega_hero": "Wow! You are a Mega Hero now! I'm so proud of you!",
    "feuer": "You're on fire! Three days in a row!",
    "woche": "Perfect week! You practised every school day. Here is your new superhero!",
    "monat": "Four perfect weeks in a row! You are a true champion!",
    "team": "You collected all ten superheroes. Your team is complete. You are a legend!",
    "gym_fini": "That's it for today. See you tomorrow!",
    "gym_pause": "Break! Come back later and finish your Word Gym.",
    "powerup": "Powered up! Your English is fully charged again.",
}

# Shop (Coins = gespiegelte Punkte, nicht rückwirkend; docs/gamification/konzept.md „Coins und Shop“). Erweiterbar: neue Artikel hier eintragen.
# bald: wird gezeigt, ist aber noch nicht kaufbar · rahmen: CSS-Klasse rahmen-<farbe> für Titel-Schild und Startkarte
SHOP = [
    {"id": "runner", "symbol": "🎮", "name": "Runner-Ticket", "unter": "Eintritt für das Jump'n'Run", "preis": 100, "bald": True, "hinweis": "Das Spiel kommt bald. Spar schon mal!"},
    {"id": "rahmen_rot", "symbol": "🎨", "name": "Rahmen für dein Titel-Schild", "unter": "Rot", "preis": 50, "rahmen": "rot"},
    {"id": "rahmen_blau", "symbol": "🎨", "name": "Rahmen für dein Titel-Schild", "unter": "Blau", "preis": 50, "rahmen": "blau"},
    {"id": "rahmen_gruen", "symbol": "🎨", "name": "Rahmen für dein Titel-Schild", "unter": "Grün", "preis": 50, "rahmen": "gruen"},
]


def spieldaten():
    a = lambda pfad: pfad if os.path.exists(os.path.join(BASIS, "app", pfad)) else None
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import frei_saarland
    return {
        "titel": [{"ab": ab, "name": n, "symbol": sym, "audio": a(f"audio/spiel/titel_{n.lower().replace(' ', '_')}.mp3")} for ab, n, sym in TITEL],
        "texte": {k: {"text": t, "audio": a(f"audio/spiel/{k}.mp3")} for k, t in SPIEL_TEXTE.items()},
        "orte": [dict(z, x=int(z["x"]), y=int(z["y"]), audio=a(f"audio/london/{z['id']}.mp3")) for z in lesen("london.tsv")],
        "helden": [dict(z, bild=f"bilder/helden/{z['bild']}.jpg", audio=a(f"audio/helden/{z['id']}.mp3")) for z in lesen("helden.tsv")],
        "akten": [dict(z, absaetze=z["text"].split(" ¶ "), fragen=[dict(zip(("frage", "antwort"), f.split("|"))) for f in z["fragen"].split(";;")]) for z in lesen("geheimakten.tsv")],
        "frei": frei_saarland.als_daten(),
        "shop": SHOP,
    }


def main():
    symbole = {z["wort"]: z["symbol"] for z in lesen("symbole.tsv")}
    saetze = {}
    for z in lesen("kernsaetze.tsv"):
        luecke = re.search(r"\[([^\]]+)\]", z["englisch"])
        # Ein Audio pro Satz (Englisch). Fehlt die Datei, bekommt die App den Sprechtext für die Sprachausgabe des Geräts.
        audio = {}
        text = z["englisch_gesprochen"] or z["englisch"]
        if text:
            if os.path.exists(os.path.join(AUDIO, f"{z['id']}_en.mp3")):
                audio["en"] = f"audio/kernsaetze/{z['id']}_en.mp3"
            else:
                audio["en"] = {"tts": re.sub(r"<[^>]+>|\[|\]", "", text), "lang": "en-GB", "stimme": "m"}
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
                    b.pop("sprache", None)
                    b["dateien"] = [saetze[i]["audio"]["en"] for i in ids if "en" in saetze[i]["audio"]]
            if s["art"] == "auswahl":
                for a in s["aufgaben"]:
                    a.setdefault("richtig", a["optionen"][0])
                    assert a["satz"] in saetze, a["satz"]
            if s["art"] == "lesen":
                assert s["text"] in saetze
                for a in s["aufgaben"]:
                    assert a["satz"] in saetze and a["loesung"] in s["optionen"], a
            if s["art"] == "hoerwahl":
                s["paare"] = [{"optionen": [{"wort": w, "symbol": sym, "audio": saetze[i]["audio"]["en"]} for i, sym, w in p[:2]],
                               "hilfe": p[2]} for p in s["paare"]]
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
    # Wörter, deren Symbol das Wort eindeutig zeigt (für „Bild → Wort“)
    BILD = {"bus", "car", "train", "clock", "morning", "evening", "newspaper", "wheelchair", "cafe", "shower", "breakfast",
            "tooth_pl_teeth", "brush", "sea", "money", "pound", "penny_pl_pence", "jigsaw", "drama", "cycle", "hike", "run",
            "trampolining", "light", "card", "group", "letter"}
    def antwortform(en):  # was man eintippt: ohne „(to)“, Klammern und Zweitformen
        f = re.sub(r"\s*\(.*?\)", "", re.sub(r"^\(to\) ", "", en)).split(",")[0].strip()
        return f
    def tippbar(f):
        return not re.search(r"[/…]|\.\.\.|\bsb\.|\bsth\.|=|\d", f) and len(f.split()) <= 4
    # Word Gym: Beispielsätze für Wörter ohne Kernsatz (gesprochen von Mr. Alex, audio/gym/)
    gym_saetze = {}
    for z in lesen("gym_saetze6.tsv"):
        assert z["luecke"] in z["englisch"], z["id"]
        saetze["gym_" + z["id"]] = {"en": z["englisch"], "de": z["deutsch"], "luecke": z["luecke"], "audio": {"en": f"audio/gym/{z['id']}_en.mp3"}}
        gym_saetze[z["id"]] = "gym_" + z["id"]
    for v in lesen("vokabeln.tsv"):
        luecke = v.get("luecke") or re.sub(r"^\(to\) ", "", v["englisch"])
        if v["satz"]:
            satz = saetze.get(v["satz"])
            assert satz, f"Vokabel {v['id']}: Satz {v['satz']} fehlt"
            assert luecke.lower() in satz["en"].lower(), f"Vokabel {v['id']} steht nicht im Satz {v['satz']}"
        form = antwortform(v["englisch"])
        vokabeln.append({"id": v["id"], "en": v["englisch"], "de": v["deutsch"], "symbol": v["symbol"],
                         "form": form, "tippbar": tippbar(form), "bild": v["id"].split("_", 1)[1].split("_", 1)[1] in BILD and v["id"] != "u3_097_letter",
                         "satz": v["satz"], "luecke": luecke, "gymsatz": v["satz"] or gym_saetze.get(v["id"], ""),
                         "audio": {"en": f"audio/vokabeln/{v['id']}_en.mp3"}})
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
    # Memory-Karten aus den Vokabeln (Symbol, Wort, Audio)
    kurz = lambda en: re.sub(r"\s*\(.*?\)|,.*$", "", re.sub(r"^\(to\) ", "", en)).strip()
    vok = {}
    for v in vokabeln:  # bei doppelten Wörtern (letter) zählt die erste Bedeutung
        vok.setdefault(kurz(v["en"]).lower(), v)
    for st in STATIONEN:
        for s in st["schritte"]:
            if s["art"] == "memory":
                s["karten"] = [{"id": vok[w]["id"], "wort": kurz(vok[w]["en"]), "symbol": vok[w]["symbol"],
                                "audio": vok[w]["audio"]["en"]} for w in s.pop("pool")]
    # Lob und Rückmeldungen (gesprochen von Mr. Alex), nach Art gruppiert
    lob = {}
    # Arten: lob (kurz), stark (Serie von 5 / fertiger Teil), fehler, spiel, geschafft, voll, doch; gruppe: Schlüsselwörter gegen Wortwiederholung
    for z in lesen("lob.tsv"):
        if z["klasse"] == "9":
            continue
        if os.path.exists(os.path.join(BASIS, "app", "audio", "lob", z["id"] + ".mp3")):
            lob.setdefault(z["art"], []).append({"text": z["text"], "audio": f"audio/lob/{z['id']}.mp3",
                                                 "gruppe": [g for g in z["gruppe"].split(",") if g], "de": z["de"]})
    STATIONEN.sort(key=lambda x: x["nr"])
    daten = {"stationen": STATIONEN, "saetze": saetze, "vokabeln": vokabeln, "lob": lob, "gym": GYM, "termin": TERMIN,
             "mittel": {k: symbole[k] for k in ("bus", "car", "bike", "train", "walk")},
             "spiel": spieldaten()}
    ziel = os.path.join(BASIS, "app", "daten.js")
    with open(ziel, "w", encoding="utf-8") as f:
        f.write("// Automatisch erzeugt von werkzeuge/daten_bauen.py – bitte nicht von Hand ändern.\n")
        f.write("window.DATEN = " + json.dumps(daten, ensure_ascii=False, indent=1) + ";\n")
    print(ziel, len(saetze), "Sätze")
    import webapp_bauen
    webapp_bauen.main()


if __name__ == "__main__":
    main()
