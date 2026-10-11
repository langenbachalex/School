"""Baut die App Klasse 9 (America) in app/klasse9/: daten.js, basis.css, Lob-Audios, Icons, Manifest, sw.js.
Inhalte: inhalte/klasse9/*.tsv. Aufruf: python3 werkzeuge/klasse9_bauen.py
"""
import csv, hashlib, json, os, shutil
from PIL import Image, ImageDraw, ImageFont

BASIS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INHALTE = os.path.join(BASIS, "inhalte", "klasse9")
APP = os.path.join(BASIS, "app", "klasse9")
SCHRIFT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

# Lob von Mr. Alex (dieselben Audios wie in Klasse 6, inhalte/lob.tsv)
LOB9 = {
    "lob": ["lob_amazing", "lob_fantastic", "lob_wonderful", "lob_great", "lob_superstar", "lob_outstanding",
            "lob_love", "lob_niceone", "lob_spoton"],
    "fehler": ["fehler_ohno", "fehler_sorry", "spiel_terrible"],
    "geschafft": ["geschafft_didit", "geschafft_outstanding"],
    "voll": ["voll_fullmarks"],
    "doch": ["doch_seeyoucan"],
}

ABSCHNITTE = {"start": "Start", "theme1": "Theme 1", "theme2": "Theme 2", "fol": "Focus on language",
              "story": "Story", "skills": "Skills training"}
MAX_GRUPPE = 14  # größere Abschnitte werden geteilt (Story 1, Story 2)

def dialog(name, symbol, praefix, zeilen, eigene=False):
    """Fester Dialog A/B: hören, nachsprechen, Rolle A, Rolle B (A = Jeremy B., B = Jessica)."""
    z = [[f"{praefix}_{i:02d}", "AB"[(i - 1) % 2]] for i in range(1, zeilen + 1)]
    schritte = [{"art": "dialog", "name": "Listen", "zeilen": z, "rolle": None},
                {"art": "lr", "name": "Lines", "stufen": [1, 3], "saetze": [x[0] for x in z]},
                {"art": "dialog", "name": "You are A", "zeilen": z, "rolle": "A"},
                {"art": "dialog", "name": "You are B", "zeilen": z, "rolle": "B"}]
    if eigene:
        schritte.append({"art": "erklaerung", "name": "Your own dialogue", "bloecke": [
            {"typ": "text", "G": "Jetzt du mit einem Partner: Macht euren eigenen Dialog! (E-Kurs: Pflicht, G-Kurs: Bonus)",
             "E": "Now you and a partner: make your own dialogue!"},
            {"typ": "liste", "punkte": ["mood · come by · apartment · embarrassing", "fall asleep · subway · diner · check out",
                                        "stoop · cheer", "That sounds awesome / boring / embarrassing!"]},
            {"typ": "merksatz", "G": "Mindestens 5 Wechsel pro Person!", "E": "Aim for at least 5 exchanges each!"}]})
    return {"name": name, "symbol": symbol, "schritte": schritte}


# Die 9 Kategorien (3×3). „bald“ = noch ohne Inhalt.
KATEGORIEN = [
    {"nr": 1, "titel": "Reading", "unter": {"G": "Leseverstehen", "E": "Reading comprehension"}, "symbol": "📖",
     "gruppen": [
         {"name": "Task words", "symbol": "✔️ ✏️ 🔗",
          "schritte": [
              {"art": "lr", "name": "Task words", "saetze": [f"tw_{i:02d}" for i in range(1, 17)]},
              {"art": "auswahl", "name": "What do you do?", "aufgaben": [
                  {"satz": "tw_01", "optionen": [
                      {"G": "ein Kreuz ✗ in das richtige Kästchen machen", "E": "put a cross ✗ in the right box"},
                      {"G": "die richtige Antwort abschreiben", "E": "copy the right answer"},
                      {"G": "die richtige Antwort unterstreichen", "E": "draw a line under the right answer"}]},
                  {"satz": "tw_02", "optionen": [
                      {"G": "die Bilder ankreuzen, die im Text passieren", "E": "tick the pictures that happen in the text"},
                      {"G": "zu jedem Bild einen Satz schreiben", "E": "write a sentence about every picture"},
                      {"G": "alle Bilder ankreuzen", "E": "tick all the pictures"}]},
                  {"satz": "tw_03", "optionen": [
                      {"G": "Einige Bilder bleiben übrig – nicht alle passen.", "E": "Some pictures are left over – not all of them fit."},
                      {"G": "Es fehlen Bilder – du musst selbst malen.", "E": "Pictures are missing – you have to draw some."},
                      {"G": "Jedes Bild passt genau einmal.", "E": "Every picture fits exactly once."}]},
                  {"satz": "tw_04", "optionen": [
                      {"G": "Personen und Aushänge zuordnen (verbinden)", "E": "find the right notice for each person"},
                      {"G": "einen Aushang schreiben", "E": "write a notice"},
                      {"G": "die Personen beschreiben", "E": "describe the people"}]},
                  {"satz": "tw_09", "optionen": [
                      {"G": "entscheiden: richtig, falsch oder steht nicht im Text", "E": "decide: true, false or the text doesn't say"},
                      {"G": "die Aussagen abschreiben", "E": "copy the statements"},
                      {"G": "nur die richtigen Aussagen ankreuzen", "E": "only tick the true statements"}]},
                  {"satz": "tw_11", "optionen": [
                      {"G": "die richtige Information in einem ganzen Satz aufschreiben", "E": "write the right information in a complete sentence"},
                      {"G": "ein Wort reicht", "E": "one word is enough"},
                      {"G": "die Information ankreuzen", "E": "tick the information"}]},
                  {"satz": "tw_12", "optionen": [
                      {"G": "kurz antworten – ein paar Wörter reichen", "E": "answer with a few words"},
                      {"G": "lange Antworten mit mindestens drei Sätzen", "E": "write at least three sentences"},
                      {"G": "die Fragen abschreiben", "E": "copy the questions"}]},
                  {"satz": "tw_08", "optionen": [
                      {"G": "die Sätze nummerieren: 1, 2, 3 …", "E": "number the sentences: 1, 2, 3 …"},
                      {"G": "die Sätze übersetzen", "E": "translate the sentences"},
                      {"G": "die falschen Sätze durchstreichen", "E": "cross out the wrong sentences"}]},
                  {"satz": "tw_16", "optionen": [
                      {"G": "auf Deutsch erklären, was im englischen Text steht", "E": "explain the English text in German"},
                      {"G": "den Text ins Englische übersetzen", "E": "translate the text into English"},
                      {"G": "den Text Wort für Wort übersetzen", "E": "translate every single word"}]},
              ]},
              {"art": "bilder", "name": "Pictures", "titel": "My first day at Lincoln High",
               "text": [f"rd1_{i:02d}" for i in range(1, 7)],
               "instruction": "Look at the pictures and tick the events in the text. There are more pictures than you need.",
               "bilder": [
                   {"symbol": "🧭", "G": "sich verlaufen", "E": "get lost", "beleg": "rd1_02"},
                   {"symbol": "🛗", "G": "Aufzug fahren", "E": "take the elevator"},
                   {"symbol": "📣", "G": "eine Cheerleaderin treffen", "E": "meet a cheerleader", "beleg": "rd1_03"},
                   {"symbol": "📚", "G": "in die Bibliothek gehen", "E": "go to the library"},
                   {"symbol": "🍕", "G": "Pizza essen", "E": "eat pizza", "beleg": "rd1_04"},
                   {"symbol": "🎵", "G": "Querflöte spielen", "E": "play the flute"},
                   {"symbol": "🚌", "G": "mit dem Bus fahren", "E": "take the bus", "beleg": "rd1_05", "nur": "E"},
                   {"symbol": "🔐", "G": "den Spind öffnen", "E": "open the locker", "nur": "E"},
               ]},
          ]},
     ]},
    {"nr": 2, "titel": "Vocabulary", "unter": {"G": "Wörter in ganzen Sätzen", "E": "Words in whole sentences"},
     "symbol": "🔤", "vokabeln": True},
    {"nr": 3, "titel": "Language", "unter": {"G": "So funktioniert die Sprache", "E": "How English works"}, "symbol": "🧩",
     "gruppen": [
         {"name": "-ing form & prepositions", "symbol": "➕ ing",
          "schritte": [
              {"art": "erklaerung", "name": "Rules", "bloecke": [
                  {"typ": "text", "G": "Die -ing-Form (gerund) ist ein Verb, das wie ein Nomen benutzt wird.",
                   "E": "The -ing form (gerund) is a verb that we use like a noun."},
                  {"typ": "regeln", "punkte": [
                      [{"G": "Nach love, like, hate, enjoy, don't mind:", "E": "After love, like, hate, enjoy, don't mind:"}, "la_01"],
                      [{"G": "Am Satzanfang (als Subjekt):", "E": "At the start of a sentence (as the subject):"}, "la_04"],
                      [{"G": "Nach einer Präposition kommt immer -ing:", "E": "After a preposition, always use -ing:"}, "la_06"],
                      [{"G": "Auch nach to in look forward to:", "E": "Also after to in look forward to:"}, "la_09"]]},
                  {"typ": "merksatz", "G": "Präposition + Verb? Dann immer -ing!", "E": "Preposition + verb? Always -ing!"}]},
              {"art": "lr", "name": "Sentences", "saetze": [f"la_{i:02d}" for i in range(1, 15)]},
              {"art": "verbform", "name": "-ing or not?", "ansage": {
                  "G": "Which form is right? – Welche Form passt? Tipp sie an!", "E": "Which form is right? Tap it!"},
               "aufgaben": [
                  {"satz": "la_01", "richtig": "playing", "falsch": ["play", "to playing"]},
                  {"satz": "la_02", "richtig": "walking", "falsch": ["walk", "walks"]},
                  {"satz": "la_03", "richtig": "getting", "falsch": ["get", "gets"]},
                  {"satz": "la_04", "richtig": "Dancing", "falsch": ["Dance", "Danced"]},
                  {"satz": "la_05", "richtig": "Learning", "falsch": ["Learn", "Learns"]},
                  {"satz": "la_12", "luecke": "eating", "richtig": "eating", "falsch": ["eat", "to eat"]},
                  {"satz": "la_14", "luecke": "helping", "richtig": "helping", "falsch": ["help", "to help"]},
                  {"satz": "la_09", "luecke": "seeing", "richtig": "seeing", "falsch": ["see", "saw"]},
              ], "hilfe": {"G": "Nach enjoy, don't mind, hate, am Satzanfang und nach einer Präposition kommt die -ing-Form.",
                           "E": "After enjoy, don't mind, hate, at the start of a sentence and after a preposition we use the -ing form."}},
              {"art": "verbform", "name": "Which preposition?", "ansage": {
                  "G": "Which preposition is right? – Welche Präposition passt?", "E": "Which preposition is right?"},
               "aufgaben": [
                  {"satz": "la_06", "luecke": "at", "richtig": "at", "falsch": ["in", "of"]},
                  {"satz": "la_07", "luecke": "in", "richtig": "in", "falsch": ["at", "for"]},
                  {"satz": "la_08", "luecke": "of", "richtig": "of", "falsch": ["at", "in"]},
                  {"satz": "la_10", "luecke": "about", "richtig": "about", "falsch": ["at", "for"]},
                  {"satz": "la_11", "luecke": "of", "richtig": "of", "falsch": ["for", "in"]},
                  {"satz": "la_13", "luecke": "of", "richtig": "of", "falsch": ["at", "with"]},
                  {"satz": "la_14", "luecke": "for", "richtig": "for", "falsch": ["of", "with"]},
              ], "hilfe": {"G": "Lerne die festen Paare: good at, interested in, afraid of, think about, instead of, tired of, thanks for.",
                           "E": "Learn the pairs: good at, interested in, afraid of, think about, instead of, tired of, thanks for."}},
          ]},
     ]},
    {"nr": 4, "titel": "Listening", "unter": {"G": "Hörverstehen", "E": "Listening comprehension"}, "symbol": "🎧",
     "gruppen": [
         {"name": "After-school activities", "symbol": "🤖 📰 🐶 📣",
          "schritte": [
              {"art": "lr", "name": "Words first", "stufen": [1, 2], "saetze": ["hw_01", "hw_02", "hw_03", "hw_04", "hw_05", "hw_06"]},
              {"art": "hoeren", "name": "Listening", "uebung": "after_school"},
          ]},
     ]},
    {"nr": 5, "titel": "Writing", "unter": {"G": "Schreiben", "E": "Writing texts"}, "symbol": "✍️",
     "gruppen": [
         {"name": "Information about your school", "symbol": "🏫 ✉️", "schritte": [
             {"art": "mustertext", "name": "Model text", "titel": "An email to Ryan from Texas", "eigene_zeile": ["wm_01", "wm_12"],
              "abschnitte": [
                  {"label": {"G": "Anfang (beginning)", "E": "Beginning"}, "saetze": ["wm_01", "wm_02", "wm_03"]},
                  {"label": {"G": "Mittelteil (middle)", "E": "Middle"}, "saetze": ["wm_04", "wm_05", "wm_06", "wm_07", "wm_08", "wm_09"]},
                  {"label": {"G": "Schluss (end)", "E": "End"}, "saetze": ["wm_10", "wm_11", "wm_12"]}]},
             {"art": "lr", "name": "Useful phrases", "saetze": ["wm_03", "wm_04", "wm_05", "wm_06", "wm_07", "wm_08", "wm_09", "wm_10", "wm_11", "wm_12"]},
             {"art": "schreiben", "name": "Your text", "speicher": "schule",
              "aufgabe": {"G": "Ryan from Texas is going to be in your class soon. Write him an email about your school. – Ryan aus Texas kommt bald in deine Klasse. Schreib ihm eine E-Mail über deine Schule.",
                          "E": "Ryan from Texas is going to be in your class soon. Write him an email about your school."},
              "min": {"G": 6, "E": 9},
              "inhalt": [
                  {"G": "Name und Größe der Schule", "E": "name and size of your school", "muster": "called|students|big|small|huge"},
                  {"G": "Schultag (Uhrzeiten)", "E": "your school day (times)", "muster": "\\d|start|end|o'clock"},
                  {"G": "Lieblingsfach und warum", "E": "your favourite subject and why", "muster": "subject|because"},
                  {"G": "AGs / Freizeit an der Schule", "E": "clubs and activities", "muster": "club|band|team|after school"},
                  {"G": "Was dir am besten gefällt", "E": "what you like best", "muster": "like|love|best"}],
              "bausteine": ["Hi Ryan,", "I'm writing to tell you about my school.", "Our school is called … and it has about … students.",
                            "School starts at … and ends at …", "My favourite subject is … because …",
                            "There are lots of clubs, for example …", "We have …", "We don't wear school uniforms.",
                            "What I like best about my school is …", "I'm really looking forward to meeting you!", "Best wishes,"]},
         ]},
         {"name": "Check and correct", "symbol": "🔍 ✔️", "schritte": [
             {"art": "erklaerung", "name": "Checklist", "bloecke": [
                 {"typ": "text", "G": "Lies deinen Text am Ende mehrmals durch. So bekommst du mehr Punkte (Kriterien A–F):",
                  "E": "Read your text several times at the end. This gets you more points (criteria A–F):"},
                 {"typ": "liste_de", "punkte": [
                     {"G": "Alle Punkte der Aufgabe drin? (Inhalt ist am wichtigsten!)", "E": "Did you write about all points of the task? (Content matters most!)"},
                     {"G": "Anfang – Mittelteil – Schluss", "E": "Beginning – middle – end"},
                     {"G": "Ganze Sätze und Verbindungswörter: and, but, because, so, for example", "E": "Full sentences and linking words: and, but, because, so, for example"},
                     {"G": "Starke Wörter statt good / nice: amazing, huge, delicious …", "E": "Strong words instead of good / nice: amazing, huge, delicious …"},
                     {"G": "„I“ immer groß!", "E": "Always write “I” with a capital letter!"},
                     {"G": "Zeitform richtig? he/she/it + s? Wortstellung: Ort vor Zeit", "E": "Right tense? he/she/it + s? Word order: place before time"}]},
                 {"typ": "merksatz", "G": "A = 13–15 Punkte: alles drin, gut verständlich, nur wenige Fehler.",
                  "E": "A = 13–15 points: everything is there, easy to understand, only a few mistakes."}]},
             {"art": "verbform", "name": "Fix it!", "ansage": {
                 "G": "Which is right? – Typische Fehler aus dem Skills File. Was ist richtig?",
                 "E": "Which is right? Typical mistakes from the Skills File."},
              "hilfe": {"G": "Denk an die Tipps aus dem Skills File (S. 168).", "E": "Think of the tips in the Skills File (p. 168)."},
              "aufgaben": [
                  {"satz": "wk_01", "richtig": "in", "falsch": ["for", "at"], "vorher": "I'm interested for sports",
                   "hilfe": {"G": "be interested in – lern die Präposition immer mit!", "E": "be interested in – always learn the preposition!"}},
                  {"satz": "wk_02", "richtig": "was", "falsch": ["made"], "vorher": "That made fun",
                   "hilfe": {"G": "„Das hat Spaß gemacht“ heißt: That was fun.", "E": "In English we say: That was fun."}},
                  {"satz": "wk_03", "richtig": "huge", "falsch": ["great"], "vorher": "My school is great (= groß)",
                   "hilfe": {"G": "great = großartig; groß = big / huge.", "E": "great = wonderful; big / huge = large."}},
                  {"satz": "wk_04", "richtig": "borrow", "falsch": ["lend"], "vorher": "Can I lend your pen?",
                   "hilfe": {"G": "leihen (von jemandem) = borrow; verleihen = lend.", "E": "You borrow from someone, you lend to someone."}},
                  {"satz": "wk_05", "richtig": "had", "falsch": ["would have"], "vorher": "If I would have more time …",
                   "hilfe": {"G": "If-Satz Typ 2: im if-Teil simple past, im Hauptsatz would.", "E": "If-clause type 2: simple past in the if-clause, would in the main clause."}},
                  {"satz": "wk_06", "richtig": "by bus", "falsch": ["with the bus"], "vorher": "We go with the bus to school",
                   "hilfe": {"G": "mit dem Bus = by bus.", "E": "We say: by bus, by car, by train."}},
                  {"satz": "wk_07", "richtig": "In my opinion", "falsch": ["After my opinion"], "vorher": "After my opinion, …",
                   "hilfe": {"G": "meiner Meinung nach = in my opinion.", "E": "We say: in my opinion."}},
                  {"satz": "wk_08", "richtig": "to Central Park in the morning", "falsch": ["in the morning to Central Park"],
                   "vorher": "We went in the morning to Central Park",
                   "hilfe": {"G": "Im Englischen: Ort vor Zeit.", "E": "In English: place before time."}},
              ]}]},
     ]},
    {"nr": 6, "titel": "Speaking", "unter": {"G": "Dialoge sprechen", "E": "Dialogues"}, "symbol": "💬",
     "gruppen": [
         {"name": "Useful phrases", "symbol": "🗣️ 👍 🤔", "schritte": [
             {"art": "lr", "name": "Phrases", "saetze": [f"sp_{i:02d}" for i in range(1, 11)]}]},
         dialog("Dialogue 1 · Quick agreement", "🗽 🏙️", "d1", 6),
         dialog("Dialogue 2 · Disagree, then agree", "⛰️ 🏖️", "d2", 7),
         dialog("New York — Yes or No?", "🌳 ♨️", "d3", 11),
         dialog("Brooklyn or Bust?", "🏠 🚇 🍔", "d4", 10, eigene=True),
     ]},
    {"nr": 7, "titel": "BE vs AE", "unter": {"G": "Britisch und amerikanisch", "E": "British and American English"},
     "symbol": "🇬🇧 🇺🇸", "gruppen": [
         {"name": "Unit 1 · p. 20", "symbol": "🍬 🔦 🗑️", "schritte": [
             {"art": "lr", "name": "Sentences", "saetze": [f"ba_{i:02d}" for i in range(1, 9)]},
             {"art": "beae_quiz", "name": "British or American?", "paare": [f"ba_{i:02d}" for i in range(1, 9)]}]},
         {"name": "More words", "symbol": "🚇 👟 🍟", "schritte": [
             {"art": "lr", "name": "Sentences", "saetze": [f"ba_{i:02d}" for i in range(9, 18)]},
             {"art": "beae_quiz", "name": "British or American?", "paare": [f"ba_{i:02d}" for i in range(9, 18)]}]},
     ]},
    {"nr": 8, "titel": "New", "unter": {"G": "Neu diese Woche", "E": "New this week"}, "symbol": "✨", "farbe": "neu", "bald": True},
    {"nr": 9, "titel": "Hall of Fame", "unter": {"G": "Aus euren Texten", "E": "From your texts"}, "symbol": "🏆",
     "gruppen": [
         {"name": "Strong moments", "symbol": "🌟 ✍️", "schritte": [
             {"art": "lr", "name": "Your best sentences", "saetze": [f"hf_{i:02d}" for i in range(1, 12)]}]},
         {"name": "Common mistakes", "symbol": "✗ → ✓", "schritte": [
             {"art": "verbform", "name": "Fix it!", "ansage": {
                 "G": "Fix the mistake! – Diese Fehler kamen in euren Texten oft vor. Welche Form ist richtig?",
                 "E": "Fix the mistake! These mistakes were common in your texts. Which form is right?"},
              "hilfe": {"G": "Bei he, she, it: doesn't und -s am Verb.", "E": "With he, she, it: doesn't and -s on the verb."},
              "aufgaben": [
                  {"satz": "hm_01", "richtig": "doesn't", "falsch": ["don't"], "vorher": "he don't take me"},
                  {"satz": "hm_02", "richtig": "understands", "falsch": ["understand"], "vorher": "she understand me"},
                  {"satz": "hm_03", "richtig": "doesn't", "falsch": ["don't"], "vorher": "it don't matter"},
                  {"satz": "hm_04", "richtig": "her", "falsch": ["she"], "vorher": "I like she",
                   "hilfe": {"G": "she macht etwas (Subjekt), her bekommt etwas ab (Objekt): I like her.",
                             "E": "she does the action (subject), her is the object: I like her."}},
                  {"satz": "hm_05", "richtig": "her", "falsch": ["she"], "vorher": "I talk with she",
                   "hilfe": {"G": "Nach with, to, for … kommt her, nicht she.", "E": "After with, to, for … use her, not she."}},
                  {"satz": "hm_06", "richtig": "doesn't", "falsch": ["don't"], "vorher": "my brother don't like pizza"},
                  {"satz": "hm_07", "richtig": "I", "falsch": ["i"], "vorher": "yesterday i went to the park",
                   "hilfe": {"G": "„I“ (ich) schreibt man im Englischen immer groß – egal wo im Satz.",
                             "E": "We always write “I” with a capital letter – wherever it is in the sentence."}},
              ]},
             {"art": "lr", "name": "Say it right", "stufen": [1, 3], "saetze": [f"hm_{i:02d}" for i in range(1, 8)]}]},
         {"name": "Vocabulary boost", "symbol": "😃 😌 🤩", "schritte": [
             {"art": "erklaerung", "name": "Strong words", "bloecke": [
                 {"typ": "text", "G": "Statt immer nur happy, good oder nice: Viele von euch haben starke Wörter benutzt. Genau so!",
                  "E": "Instead of happy, good or nice every time: many of you used strong words. Keep it up!"},
                 {"typ": "liste", "punkte": ["excited · relieved · proud · grateful · relaxed",
                                             "amazing · awesome · fantastic · unbelievable · exciting · incredible",
                                             "delicious · shocked · weird · scary · boring · huge · tiny"]}]},
             {"art": "lr", "name": "Sentences", "saetze": [f"hb_{i:02d}" for i in range(1, 8)]}]},
         {"name": "From your texts (GLN 1)", "symbol": "📝", "schritte": [
             {"art": "lr", "name": "Sentences", "saetze": [f"he_{i:02d}" for i in range(1, 13)]}]},
         {"name": "Trapped (Unit 1)", "symbol": "🔒 🕵️", "schritte": [
             {"art": "lr", "name": "Sentences", "saetze": [f"ht_{i:02d}" for i in range(1, 9)]}]},
         {"name": "Unit 1 check", "symbol": "🗽 🌉", "schritte": [
             {"art": "lr", "name": "Sentences", "saetze": [f"hv_{i:02d}" for i in range(1, 17)]}]},
     ]},
]


def tsv(name):
    with open(os.path.join(INHALTE, name), encoding="utf-8") as f:
        return list(csv.DictReader(f, delimiter="\t"))


def audio(rel):
    """Pfad relativ zu app/klasse9, nur wenn die Datei existiert (sonst Sprachausgabe des Geräts)."""
    return rel if os.path.exists(os.path.join(APP, rel)) else None


def main():
    os.makedirs(APP, exist_ok=True)
    saetze, stimme = {}, 0
    # Abwechselnd Mann/Frau: Reihenfolge der Sätze bestimmt die Stimme (gleich wie im Audio-Skript)
    for z in tsv("saetze.tsv"):
        saetze[z["id"]] = {"en": z["englisch"], "de": z["deutsch"], "luecke": z["luecke"] or None,
                           "stimme": "mf"[stimme % 2], "audio": audio(f"audio/saetze/{z['id']}.mp3")}
        stimme += 1
    vokabeln, units = [], {"1": [], "2": [], "3": []}
    for v in tsv("vokabeln.tsv"):
        sid = v["id"] + "_s"
        saetze[sid] = {"en": v["satz_en"], "de": v["satz_de"], "luecke": v["luecke"],
                       "stimme": "mf"[stimme % 2], "audio": audio(f"audio/vokabeln/{sid}.mp3")}
        vokabeln.append({"id": v["id"], "unit": v["unit"], "en": v["englisch"], "de": v["deutsch"], "satz": sid,
                         "def": v["definition"] or None, "stimme": "mf"[stimme % 2],
                         "audio": audio(f"audio/vokabeln/{v['id']}.mp3")})
        stimme += 1
    # BE vs AE: amerikanischer Satz (Jeremy B./Jessica) mit britischem Gegenstück (Mr. Alex' Stimme)
    for z in tsv("beae.tsv"):
        saetze[z["id"]] = {"en": z["amerikanisch"], "de": z["deutsch"], "luecke": z["luecke"], "stimme": "mf"[stimme % 2],
                           "audio": audio(f"audio/beae/{z['id']}.mp3"),
                           "be": {"en": z["britisch"], "audio": audio(f"audio/beae/{z['id']}_be.mp3")}}
        stimme += 1
    # Listening: Wörter vorab und Hörtext
    with open(os.path.join(INHALTE, "listening.json"), encoding="utf-8") as f:
        hv = json.load(f)
    for wid, en, de, luecke in hv.pop("woerter"):
        saetze[wid] = {"en": en, "de": de, "luecke": luecke, "stimme": "mf"[stimme % 2], "audio": audio(f"audio/hoeren/{wid}.mp3")}
        stimme += 1
    for t in hv["teile"]:
        t["audio"] = audio(f"audio/hoeren/{t['id']}.mp3")
    # Speaking und Hall of Fame (Dialogzeilen mit fester Stimme: A = Jeremy B., B = Jessica)
    for z in tsv("saetze2.tsv"):
        st = z["stimme"] or "mf"[stimme % 2]
        if not z["stimme"]:
            stimme += 1
        saetze[z["id"]] = {"en": z["englisch"], "de": z["deutsch"], "luecke": z["luecke"] or None,
                           "stimme": st, "audio": audio(f"audio/saetze/{z['id']}.mp3")}
    hoeren = {hv["id"]: hv}
    # Abschnitte je Unit (Reihenfolge wie im Buch), große Abschnitte teilen
    for unit in units:
        reihe = [v for v in tsv("vokabeln.tsv") if v["unit"] == unit]
        abschnitte = []
        for v in reihe:
            if not abschnitte or abschnitte[-1][0] != v["abschnitt"]:
                abschnitte.append((v["abschnitt"], []))
            abschnitte[-1][1].append(v["id"])
        for ab, ids in abschnitte:
            teile = -(-len(ids) // MAX_GRUPPE)
            groesse = -(-len(ids) // teile)
            for k in range(teile):
                name = ABSCHNITTE.get(ab, ab) + (f" · Part {k + 1}" if teile > 1 else "")
                units[unit].append({"name": name, "vokabeln": ids[k * groesse:(k + 1) * groesse]})
    lob_alle = {z["id"]: z["text"] for z in csv.DictReader(open(os.path.join(BASIS, "inhalte", "lob.tsv"), encoding="utf-8"), delimiter="\t")}
    os.makedirs(os.path.join(APP, "audio", "lob"), exist_ok=True)
    lob = {}
    for art, ids in LOB9.items():
        for i in ids:
            quelle = os.path.join(BASIS, "app", "audio", "lob", i + ".mp3")
            if os.path.exists(quelle):
                shutil.copyfile(quelle, os.path.join(APP, "audio", "lob", i + ".mp3"))
            lob.setdefault(art, []).append({"text": lob_alle[i], "audio": audio(f"audio/lob/{i}.mp3")})
    for k in KATEGORIEN:  # Satz-IDs prüfen
        for g in k.get("gruppen", []):
            for s in g["schritte"]:
                for sid in s.get("saetze", []) + s.get("text", []) + s.get("paare", []) + [x[0] for x in s.get("zeilen", [])] + [a["satz"] for a in s.get("aufgaben", [])]:
                    assert sid in saetze, sid
    daten = {"lob": lob, "saetze": saetze, "vokabeln": vokabeln, "units": units, "kategorien": KATEGORIEN, "hoeren": hoeren}
    with open(os.path.join(APP, "daten.js"), "w", encoding="utf-8") as f:
        f.write("// Automatisch erzeugt von werkzeuge/klasse9_bauen.py – bitte nicht von Hand ändern.\n")
        f.write("window.DATEN = " + json.dumps(daten, ensure_ascii=False, indent=1) + ";\n")
    shutil.copyfile(os.path.join(BASIS, "app", "style.css"), os.path.join(APP, "basis.css"))
    webapp()
    print("Klasse 9:", len(vokabeln), "Vokabeln,", len(saetze), "Sätze,",
          sum(1 for s in saetze.values() if s["audio"]), "mit Audio")


ROT, NAVY, WEISS = (200, 40, 50), (24, 44, 92), (255, 255, 255)


def webapp():
    os.makedirs(os.path.join(APP, "icons"), exist_ok=True)
    for g in (180, 192, 512):
        ziel = os.path.join(APP, "icons", f"icon-{g}.png")
        if os.path.exists(ziel):
            continue
        img = Image.new("RGB", (g, g), NAVY)
        d = ImageDraw.Draw(img)
        for i in range(4):  # Streifen unten
            d.rectangle([0, g * (0.78 + i * 0.055), g, g * (0.78 + i * 0.055) + g * 0.0275], fill=ROT)
        d.text((g / 2, g * 0.4), "9", font=ImageFont.truetype(SCHRIFT, int(g * 0.5)), fill=WEISS, anchor="mm")
        img.save(ziel)
    manifest = {"name": "America with Mr. Alex", "short_name": "Mr. Alex 9", "lang": "en",
                "start_url": "./", "scope": "./", "display": "standalone",
                "background_color": "#f4f6fb", "theme_color": "#182c5c",
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
        f.write(f"""// Automatisch erzeugt von werkzeuge/klasse9_bauen.py – Offline-Speicher der App Klasse 9.
const VERSION = "mralex9-{version}";
const DATEIEN = {json.dumps(dateien)};
self.addEventListener("install", (e) => {{
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
}});
self.addEventListener("activate", (e) => {{
  e.waitUntil(caches.keys().then((alle) => Promise.all(alle.filter((k) => k.startsWith("mralex9-") && k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
}});
self.addEventListener("fetch", (e) => {{
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request, {{ ignoreSearch: true }}).then((r) => r || fetch(e.request)));
}});
""")
    print("Web-App Klasse 9:", len(dateien), "Dateien, Version", version)


if __name__ == "__main__":
    main()
