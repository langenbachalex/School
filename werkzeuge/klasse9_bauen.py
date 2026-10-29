"""Baut die App Klasse 9 (America) in app/klasse9/: daten.js, basis.css, Lob-Audios, Icons, Manifest, sw.js.
Inhalte: inhalte/klasse9/*.tsv. Aufruf: python3 werkzeuge/klasse9_bauen.py
"""
import csv, hashlib, json, os, shutil, sys
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
BASIS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INHALTE = os.path.join(BASIS, "inhalte", "klasse9")
APP = os.path.join(BASIS, "app", "klasse9")
SCHRIFT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

# Lob von Mr. Alex (dieselben Audios wie in Klasse 6, inhalte/lob.tsv; Spalte klasse: leer = beide, 6 oder 9)
LOB9_ARTEN = {"lob", "stark", "fehler", "geschafft", "voll", "doch"}
LOB9_EXTRA = {"spiel_terrible": "fehler"}

ABSCHNITTE = {"usa": "USA – here we come", "start": "Start", "theme1": "Theme 1", "theme2": "Theme 2", "fol": "Focus on language",
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


# Fact sheet zur Writing-Aufgabe (Paralleltext zu S. 48, Hingham High School)
FAKTEN_LINCOLN = {"name": "Lincoln High School", "punkte": [
    ["students", "about 1,500 · grades 9–12 · age 14–18"],
    ["school day", "7:45 a.m. – 2:15 p.m. · clubs start at 2:45 p.m. · homework every day"],
    ["rules", "no cell phones in class · no smoking · appropriate clothes, no hats · students can't leave school during the day"]]}


# BE vs AE (seit 29.10.2026 als Gruppen in Vocabulary): amerikanischer Satz ↔ britisches Gegenstück
def beae(name, ids):
    return {"name": name, "reihe": "BE vs AE", "symbol": "🇬🇧🇺🇸", "unter": "British or American?", "neu_ab": "2026-10-29", "schritte": [
        {"art": "lr", "name": "Sentences", "saetze": ids},
        {"art": "beae_quiz", "name": "British or American?", "paare": ids}]}


# Die 8 Kategorien (Reihenfolge nach nr). „bald“ = noch ohne Inhalt, „spiele“ = zählt nicht für „All categories“.
# neu_ab: "YYYY-MM-DD" (Kategorie oder Gruppe) zeigt 14 Tage lang ein ✨-Schild und einen Sprung auf der Startseite.
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
               "text": [f"rd1_{i:02d}" for i in range(1, 9)],
               "instruction": "Look at the pictures and tick the events in the text. There are more pictures than you need.",
               "bilder": [
                   {"symbol": "🧭", "bild": "bilder/lesen/01-lost.jpg", "G": "sich verlaufen", "E": "get lost", "beleg": "rd1_02"},
                   {"symbol": "🛗", "bild": "bilder/lesen/02-elevator.jpg", "G": "Aufzug fahren", "E": "take the elevator"},
                   {"symbol": "📣", "bild": "bilder/lesen/03-cheerleader.jpg", "G": "eine Cheerleaderin treffen", "E": "meet a cheerleader", "beleg": "rd1_04"},
                   {"symbol": "📚", "bild": "bilder/lesen/04-library.jpg", "G": "in die Bibliothek gehen", "E": "go to the library"},
                   {"symbol": "🍕", "bild": "bilder/lesen/05-pizza.jpg", "G": "Pizza essen", "E": "eat pizza", "beleg": "rd1_05"},
                   {"symbol": "🎵", "bild": "bilder/lesen/06-flute.jpg", "G": "Querflöte spielen", "E": "play the flute"},
                   {"symbol": "🚌", "bild": "bilder/lesen/07-bus.jpg", "G": "mit dem Bus fahren", "E": "take the bus", "beleg": "rd1_07", "nur": "E"},
                   {"symbol": "🔐", "bild": "bilder/lesen/08-locker.jpg", "G": "den Spind öffnen", "E": "open the locker", "nur": "E"},
               ]},
          ]},
     ]},
    {"nr": 2, "titel": "Vocabulary", "unter": {"G": "Wörter in ganzen Sätzen", "E": "Words in whole sentences"},
     "symbol": "🔤", "vokabeln": True,  # Units/Abschnitte entstehen in der App aus D.units; dazu feste Gruppen:
     "gruppen": [beae("Unit 1 · p. 20", [f"ba_{i:02d}" for i in range(1, 9)]),
                 beae("More words", [f"ba_{i:02d}" for i in range(9, 18)])]},
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
         {"name": "After class at Lincoln High", "symbol": "🎤 🎭 🤝 🎺",
          "schritte": [
              {"art": "lr", "name": "Words first", "stufen": [1, 2], "saetze": [f"lw_{i:02d}" for i in range(1, 7)]},
              {"art": "hoeren", "name": "Listening", "uebung": "after_class"},
          ]},
     ]},
    {"nr": 5, "titel": "Writing", "unter": {"G": "Schreiben", "E": "Writing texts"}, "symbol": "✍️",
     "gruppen": [
         {"name": "Our school and a US high school", "symbol": "🏫 🇺🇸", "schritte": [
             {"art": "mustertext", "name": "Model text", "titel": "Our school and Lincoln High School", "fakten": FAKTEN_LINCOLN,
              "abschnitte": [
                  {"label": {"G": "Einleitung (opening sentence)", "E": "Opening sentence"}, "saetze": ["wn_01"]},
                  {"label": {"G": "Schüler (students)", "E": "Students"}, "saetze": ["wn_02", "wn_03"]},
                  {"label": {"G": "Schultag (school day)", "E": "School day"}, "saetze": ["wn_04", "wn_05", "wn_06"]},
                  {"label": {"G": "Regeln (rules)", "E": "Rules"}, "saetze": ["wn_07", "wn_08", "wn_09"]},
                  {"label": {"G": "Schluss (to sum up)", "E": "Conclusion"}, "saetze": ["wn_10", "wn_11"]}]},
             {"art": "lr", "name": "Useful phrases", "saetze": [f"wn_{i:02d}" for i in range(1, 12)]},
             {"art": "schreiben", "name": "Your text", "speicher": "vergleich", "fakten": FAKTEN_LINCOLN,
              "aufgabe": {"G": "Write a text comparing your school and Lincoln High School. Use the fact sheet. – Vergleiche deine Schule mit der Lincoln High School. Benutze das Fact sheet.",
                          "E": "Write a text comparing your school and Lincoln High School. Use the fact sheet."},
              "min": {"G": 7, "E": 10},
              "inhalt": [
                  {"G": "Einleitungssatz (similar / different)", "E": "Opening sentence (similar / different)", "muster": "similar|different|same"},
                  {"G": "Schüler: Größe, Alter, Klassen", "E": "Students: size, age, grades", "muster": "students|grades?\\b|years old|between \\d+ and"},
                  {"G": "Schultag: Beginn, Ende, AGs", "E": "School day: start, end, clubs", "muster": "starts?|ends?|finish|clubs?"},
                  {"G": "Regeln (phones, clothes, …)", "E": "Rules (phones, clothes, …)", "muster": "rules?|phones?|smok|clothes|hats?|dress code|leave school"},
                  {"G": "Schluss mit deiner Meinung", "E": "Conclusion with your opinion", "muster": "to sum up|in my opinion|I think|I would|all in all"}],
              "form": [
                  {"G": "Verbindungswörter: firstly, secondly, also, plus …", "E": "Linking words: firstly, secondly, also, plus …",
                   "muster": "\\b(firstly|secondly|thirdly|also|plus|and)\\b", "anzahl": 3},
                  {"G": "Gegensatz: but, on the other hand", "E": "Contrast: but, on the other hand", "muster": "\\b(but|on the other hand|however)\\b"},
                  {"G": "Vergleich: bigger than, the same as …", "E": "Comparison: bigger than, the same as …", "muster": "\\b\\w+er than\\b|more \\w+ than|the same as|as \\w+ as"},
                  {"G": "Beispiel: for example", "E": "Example: for example", "muster": "for example|for instance|such as"},
                  {"G": "One big advantage / difference …", "E": "One big advantage / difference …", "muster": "advantage|difference"},
                  {"G": "„I“ immer groß", "E": "“I” always with a capital letter", "test": "ich_gross"}],
              "bausteine": ["Our school and Lincoln High School are quite different.", "Our school and Lincoln High School are similar in some ways, but quite different in others.",
                            "Firstly, …", "Secondly, …", "Lincoln High is bigger than our school.", "At Lincoln High, school starts at … and ends at …",
                            "We usually finish at …", "When it comes to rules, …", "For example, …", "On the other hand, …",
                            "One big difference between our school and Lincoln High is …", "One big advantage of our school is …", "As a result, …", "To sum up, …"]},
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
    {"nr": 8, "titel": "Games", "unter": {"G": "Lernspiele", "E": "Learning games"}, "symbol": "🎮", "spiele": True, "neu_ab": "2026-10-29"},
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
    verweise = []  # Vokabeln, deren Satz schon anderswo vertont ist (satz_id)
    for v in tsv("vokabeln.tsv"):
        sid = v["id"] + "_s"
        if v.get("satz_id"):
            verweise.append((sid, v["satz_id"], v["luecke"]))
        else:
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
    for sid, quelle, luecke in verweise:  # gleicher Satz, gleiches Audio – nur die Lücke kann anders sein
        saetze[sid] = dict(saetze[quelle], luecke=luecke or saetze[quelle]["luecke"])
        assert saetze[sid]["luecke"] in saetze[sid]["en"], sid
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
    os.makedirs(os.path.join(APP, "audio", "lob"), exist_ok=True)
    lob = {}
    for z in csv.DictReader(open(os.path.join(BASIS, "inhalte", "lob.tsv"), encoding="utf-8"), delimiter="\t"):
        art = LOB9_EXTRA.get(z["id"], z["art"])
        if z["klasse"] == "6" or art not in LOB9_ARTEN:
            continue
        quelle = os.path.join(BASIS, "app", "audio", "lob", z["id"] + ".mp3")
        if not os.path.exists(quelle):
            continue
        shutil.copyfile(quelle, os.path.join(APP, "audio", "lob", z["id"] + ".mp3"))
        lob.setdefault(art, []).append({"text": z["text"], "audio": audio(f"audio/lob/{z['id']}.mp3"),
                                        "gruppe": [g for g in z["gruppe"].split(",") if g], "de": z["de"]})
    for k in KATEGORIEN:  # Satz-IDs prüfen
        for g in k.get("gruppen", []):
            for vid in g.get("vokabeln", []):
                assert any(v["id"] == vid for v in vokabeln), vid
            for s in g.get("schritte", []):
                for sid in s.get("saetze", []) + s.get("text", []) + s.get("paare", []) + [x[0] for x in s.get("zeilen", [])] + [a["satz"] for a in s.get("aufgaben", [])]:
                    assert sid in saetze, sid
    daten = {"lob": lob, "saetze": saetze, "vokabeln": vokabeln, "units": units, "kategorien": KATEGORIEN, "hoeren": hoeren,
             "spiel": spieldaten(), "gym": GYM, "termin": TERMIN}
    with open(os.path.join(APP, "daten.js"), "w", encoding="utf-8") as f:
        f.write("// Automatisch erzeugt von werkzeuge/klasse9_bauen.py – bitte nicht von Hand ändern.\n")
        f.write("window.DATEN = " + json.dumps(daten, ensure_ascii=False, indent=1) + ";\n")
    shutil.copyfile(os.path.join(BASIS, "app", "style.css"), os.path.join(APP, "basis.css"))
    webapp()
    print("Klasse 9:", len(vokabeln), "Vokabeln,", len(saetze), "Sätze,",
          sum(1 for s in saetze.values() if s["audio"]), "mit Audio")


# Belohnungen (docs/gamification/konzept.md): High-School-Titel, USA-Karte (50 Staaten), Landmark-Karten
TITEL = [(0, "Freshman"), (300, "Sophomore"), (900, "Junior"), (1800, "Senior"), (3000, "Graduate"), (4500, "All-American Legend")]
SPIEL_TEXTE = {  # gesprochen von Mr. Alex (audio/spiel/<id>.mp3)
    "titel_sophomore": "Congratulations! You are a Sophomore now!",
    "titel_junior": "Congratulations! You are a Junior now!",
    "titel_senior": "Congratulations! You are a Senior now!",
    "titel_graduate": "Congratulations! You graduated! Amazing work!",
    "titel_all_american_legend": "Wow! You are an All-American Legend! I'm so proud of you!",
    "feuer": "You're on fire! Three days in a row!",
    "woche": "Perfect week! You practised every school day. Here is your new landmark card!",
    "monat": "Four perfect weeks in a row! You are a true champion!",
    "team": "You collected all ten landmark cards. Your Great American Road Trip is complete!",
    "gym_fini": "That's it for today. See you tomorrow!",
    "gym_pause": "Break! Come back later and finish your Word Gym.",
    "powerup": "Powered up! Your English is fully charged again.",
}
# Word Gym (docs/word-gym/konzept.md): Standard-Pensum und Boxen-Intervalle in Tagen
# Nächster Termin für den Countdown auf der Startseite (in Wochen); nach dem Termin verschwindet er
TERMIN = {"name": "GLN 2", "datum": "2026-11-24", "powerup": True}  # powerup: 14 Tage vorher werden alle erledigten Teile fällig (⚡ Power Up)
GYM = {"pensum": {"neu": 4, "wdh": 8}, "grenzen": {"neu": [1, 6], "wdh": [4, 12]}, "intervalle": [1, 3, 7, 14, 30, 60, 120]}


def spieldaten():
    import frei_saarland, usa_karte
    a = lambda pfad: audio(pfad)
    quellen = {q["datei"]: q for q in json.load(open(os.path.join(BASIS, "docs", "gamification", "landmarks", "quellen.json"), encoding="utf-8"))}
    return {
        "titel": [{"ab": ab, "name": n, "audio": a(f"audio/spiel/titel_{n.lower().replace(' ', '_').replace('-', '_')}.mp3")} for ab, n in TITEL],
        "texte": {k: {"text": t, "audio": a(f"audio/spiel/{k}.mp3")} for k, t in SPIEL_TEXTE.items()},
        "staaten": [dict(z, audio=a(f"audio/staaten/{z['id']}.mp3")) for z in tsv("staaten.tsv")],
        "landmarks": [dict(z, bild=f"bilder/landmarks/{z['bild']}.jpg", audio=a(f"audio/landmarks/{z['id']}.mp3"),
                           quelle=quellen[z["bild"] + ".jpg"]["link"]) for z in tsv("landmarks.tsv")],
        "karte": usa_karte.pfade(os.path.join(INHALTE, "karte", "states-albers-10m.json")),
        "akten": [dict(z, absaetze=z["text"].split(" ¶ "), fragen=[dict(zip(("frage", "antwort"), f.split("|"))) for f in z["fragen"].split(";;")]) for z in tsv("geheimakten.tsv")],
        # Border Patrol (Games): Wortpaare britisch/amerikanisch; Einzelwort-Audios kommen nach Freigabe (sonst Geräte-Stimme)
        "patrol": [{"id": z["id"], "be": z["be_wort"], "ae": z["luecke"], "de": z["wort_de"],
                    "audio_be": a(f"audio/beae/w_{z['id']}_be.mp3"), "audio_ae": a(f"audio/beae/w_{z['id']}_ae.mp3")} for z in tsv("beae.tsv")],
        "frei": frei_saarland.als_daten(),
    }


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
    manifest = {"name": "Road Trip USA", "short_name": "Road Trip USA", "lang": "en",
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
