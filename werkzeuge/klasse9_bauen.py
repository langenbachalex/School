"""Baut die App Klasse 9 (America) in app/klasse9/: daten.js, basis.css, Lob-Audios, Icons, Manifest, sw.js.
Inhalte: inhalte/klasse9/*.tsv. Aufruf: python3 werkzeuge/klasse9_bauen.py
"""
import csv, hashlib, json, os, re, shutil, sys
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hausaufgaben
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
         # 🏁 Road to GLN (12.11.2026): Reading „Notice board“ – Kurztexte zuordnen. Eigene Inhalte (andere Schulen, Namen, Anlässe als im Lehrwerk),
         # zwei Sätze, die App wechselt sie bei jedem Durchgang. Je Satz acht Aushänge A–H und sechs Schüler; G-Kurs: die ersten vier ("g": True).
         # Zwei Aushänge bleiben immer übrig.
         {"name": "Notice board", "symbol": "📌",
          "schritte": [{"art": "aushang", "name": "Notice board", "tafeln": [
              {"titel": "Notice board at Riverside High", "aushaenge": [
                  ["🚲", "FOR SALE", "Mountain bike, blue, two years old, $60. Text Jamal after 4 p.m."],
                  ["⚽", "TRYOUTS", "Girls' soccer team. Tuesday, 3:30 p.m., field 2. Bring water and sneakers."],
                  ["➗", "WANTED", "Math tutor for a 9th grader. One hour a week. I pay $10. Ask for Priya in room 114."],
                  ["🍪", "BAKE SALE", "Friday at lunch in the cafeteria. Cookies and brownies from $1. All the money goes to the animal shelter."],
                  ["🧥", "LOST", "Black hoodie with a yellow tiger on it. I left it in the gym on Monday. Please take it to the school office."],
                  ["🎭", "DRAMA CLUB", "We need actors and helpers for the spring musical. First meeting: Thursday, 3 p.m., auditorium."],
                  ["🚗", "RIDE WANTED", "I live on Maple Street and need a ride to school at 7:30 a.m. I can share the gas money. – Elena"],
                  ["📸", "YEARBOOK", "Photo day is on Wednesday. Wear your favorite school shirt. Sign up for your time online."]],
               "personen": [
                   {"name": "Mia", "text": "I'm good at algebra and I'd like to earn some money.", "passt": "C", "g": True},
                   {"name": "Carlos", "text": "I found a sweatshirt under the bleachers yesterday. Whose is it?", "passt": "E", "g": True},
                   {"name": "Aisha", "text": "I love singing and I want to be on stage.", "passt": "F", "g": True},
                   {"name": "Tyler", "text": "I need something to ride to school, but I don't have much money.", "passt": "A", "g": True},
                   {"name": "Hannah", "text": "I drive to school every morning and I pass Maple Street.", "passt": "G"},
                   {"name": "Noah", "text": "I want to help dogs and cats – and I'm always hungry at noon.", "passt": "D"}]},
              {"titel": "Notice board at Oakwood High", "aushaenge": [
                  ["📣", "PEP RALLY", "Friday, 2 p.m., in the gym. Wear green and white and cheer for our football team!"],
                  ["💻", "FOR SALE", "Used laptop, works well, $120. The charger is included. Call Devon."],
                  ["🌳", "VOLUNTEERS NEEDED", "Help clean up Lake Park on Saturday from 9 a.m. to noon. Gloves and snacks are free."],
                  ["🥁", "SCHOOL BAND", "We are looking for a drummer. Practice is on Mondays and Wednesdays after school."],
                  ["📿", "FOUND", "Silver bracelet near locker 208. Describe it at the school office and get it back."],
                  ["🌮", "SPANISH CLUB", "Movie night with tacos! Thursday, 6 p.m., room 21. Beginners are welcome."],
                  ["🛒", "JOB", "The school store needs a student helper during lunch break. $9 an hour. Talk to Ms. Carter."],
                  ["🏀", "BASKETBALL TRYOUTS", "Boys' team, Monday, 4 p.m., main gym. No experience? Come anyway!"]],
               "personen": [
                   {"name": "Lena", "text": "I lost my jewelry on Tuesday. My grandma gave it to me!", "passt": "E", "g": True},
                   {"name": "Marcus", "text": "I've played the drums since I was eight.", "passt": "D", "g": True},
                   {"name": "Sofia", "text": "I care about nature and I'm free this weekend.", "passt": "C", "g": True},
                   {"name": "Ben", "text": "I need a computer for my homework, but new ones are too expensive.", "passt": "B", "g": True},
                   {"name": "Olivia", "text": "I'd like to earn some money at school, but I only have time at noon.", "passt": "G"},
                   {"name": "Jayden", "text": "I just started learning a new language and I love Mexican food.", "passt": "F"}]},
          ]}]},
     ]},
    {"nr": 2, "titel": "Vocabulary", "unter": {"G": "Wörter in ganzen Sätzen", "E": "Words in whole sentences"},
     "symbol": "🔤", "vokabeln": True,  # Units/Abschnitte entstehen in der App aus D.units; dazu feste Gruppen:
     "gruppen": [beae("Unit 1 · p. 20", [f"ba_{i:02d}" for i in range(1, 9)]),
                 beae("More words", [f"ba_{i:02d}" for i in range(9, 18)])]},
    {"nr": 3, "titel": "Language", "unter": {"G": "So funktioniert die Sprache", "E": "How English works"}, "symbol": "🧩",
     "gruppen": [
         # Umbau 12.11.2026 (Mr. Alex): zwei Gruppen statt „-ing form & prepositions“; erst Sätze, dann üben, die Regel am Ende.
         # Alter Fortschritt zieht in der App um (umbauLanguage in app.js). „-ing form“ bleibt die erste Gruppe (Ziel 3/1), „Prepositions“ ist 3/2.
         {"name": "-ing form", "symbol": "➕ ing",
          "schritte": [
              {"art": "lr", "name": "Sentences", "saetze": ["la_01", "la_02", "la_03", "la_04", "la_05", "la_12"]},
              {"art": "verbform", "name": "-ing or not?", "ansage": {
                  "G": "Which form is right? – Welche Form passt? Tipp sie an!", "E": "Which form is right? Tap it!"},
               "aufgaben": [
                  {"satz": "la_01", "richtig": "playing", "falsch": ["play", "to playing"]},
                  {"satz": "la_02", "richtig": "walking", "falsch": ["walk", "walks"]},
                  {"satz": "la_03", "richtig": "getting", "falsch": ["get", "gets"]},
                  {"satz": "la_04", "richtig": "Dancing", "falsch": ["Dances", "Danced"]},
                  {"satz": "la_05", "richtig": "Learning", "falsch": ["Learn", "Learns"]},
                  {"satz": "la_12", "luecke": "eating", "richtig": "eating", "falsch": ["eat", "to eat"]},
                  {"satz": "la_14", "luecke": "helping", "richtig": "helping", "falsch": ["help", "to help"]},
                  {"satz": "la_09", "luecke": "seeing", "richtig": "seeing", "falsch": ["see", "saw"]},
              ], "hilfe": {"G": "Nach enjoy, don't mind, hate, am Satzanfang und nach einer Präposition kommt die -ing-Form.",
                           "E": "After enjoy, don't mind, hate, at the start of a sentence and after a preposition we use the -ing form."}},
              {"art": "eigener", "name": "Your sentence", "anzahl": 4,
               "ausdruecke": [  # vorn: die -ing-Form steht am Satzanfang; falsch: zweiter Ablenker (to + Grundform wäre nach like und am Satzanfang richtig, darum dort to + -ing)
                   {"en": "I like", "de": "Ich mag es, …", "falsch": "to_ing"},
                   {"en": "I enjoy", "de": "Ich … gern", "falsch": "to"},
                   {"en": "I don't mind", "de": "Es macht mir nichts aus, …", "falsch": "to"},
                   {"en": "I'm good at", "de": "Ich kann gut …", "falsch": "to"},
                   {"en": "is fun", "de": "… macht Spaß", "vorn": True, "falsch": "to_ing"},
                   {"en": "is easy", "de": "… ist leicht", "vorn": True, "falsch": "to_ing"}],
               "taetigkeiten": [  # [Symbol, Grundform, -ing-Form (fest, nicht berechnet), Deutsch]
                   ["🎸", "play the guitar", "playing the guitar", "Gitarre spielen"],
                   ["💃", "dance", "dancing", "tanzen"],
                   ["🏊", "swim", "swimming", "schwimmen"],
                   ["🏃", "run", "running", "laufen"],
                   ["🎨", "draw pictures", "drawing pictures", "Bilder zeichnen"],
                   ["🍪", "bake cookies", "baking cookies", "Kekse backen"],
                   ["🎭", "act in the school play", "acting in the school play", "im Schultheater spielen"],
                   ["✏️", "write stories", "writing stories", "Geschichten schreiben"]]},
              {"art": "erklaerung", "name": "Rule", "bloecke": [
                  {"typ": "text", "G": "Das kannst du jetzt schon. Hier steht es noch einmal kurz: Die -ing-Form (gerund) ist ein Verb, das wie ein Nomen benutzt wird.",
                   "E": "You can already do this. Here it is again in short: the -ing form (gerund) is a verb that we use like a noun."},
                  {"typ": "regeln", "punkte": [
                      [{"G": "Nach love, like, hate, enjoy, don't mind:", "E": "After love, like, hate, enjoy, don't mind:"}, "la_01"],
                      [{"G": "Am Satzanfang (als Subjekt):", "E": "At the start of a sentence (as the subject):"}, "la_04"],
                      [{"G": "Nach einer Präposition (before, at, of …):", "E": "After a preposition (before, at, of …):"}, "la_12"]]},
                  {"typ": "liste_de", "punkte": [{"G": "Achte auf die Schreibung:", "E": "Watch the spelling:"}]},
                  {"typ": "liste", "punkte": ["dance → dancing · write → writing", "swim → swimming · run → running"]},
                  {"typ": "merksatz", "G": "like, enjoy, don't mind + -ing. Und am Satzanfang: Dancing is fun.", "E": "like, enjoy, don't mind + -ing. And at the start: Dancing is fun."}]},
          ]},
         {"name": "Prepositions", "symbol": "🔗", "neu_ab": "2026-11-12",
          "schritte": [
              {"art": "lr", "name": "Sentences", "saetze": ["la_06", "la_07", "la_08", "la_09", "la_10", "la_11", "la_13", "la_14"] + [f"la_{i}" for i in range(15, 23)]},
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
                  {"satz": "la_15", "luecke": "about", "richtig": "about", "falsch": ["of", "at"]},
                  {"satz": "la_16", "luecke": "about", "richtig": "about", "falsch": ["for", "in"]},
                  {"satz": "la_17", "luecke": "about", "richtig": "about", "falsch": ["at", "of"]},
                  {"satz": "la_18", "luecke": "at", "richtig": "at", "falsch": ["in", "about"]},
                  {"satz": "la_19", "luecke": "to", "richtig": "to", "falsch": ["at", "for"]},
                  {"satz": "la_20", "luecke": "in", "richtig": "in", "falsch": ["at", "of"]},
                  {"satz": "la_21", "luecke": "of", "richtig": "of", "falsch": ["for", "about"]},
                  {"satz": "la_22", "luecke": "of", "richtig": "of", "falsch": ["about", "in"]},
              ], "hilfe": {"G": "Lerne die festen Paare: good at, bad at · interested in, take part in · nervous about, excited about, worry about, think about · afraid of, tired of, dream of, a way of, instead of · thanks for · be used to.",
                           "E": "Learn the pairs: good at, bad at · interested in, take part in · nervous about, excited about, worry about, think about · afraid of, tired of, dream of, a way of, instead of · thanks for · be used to."}},
              {"art": "paare", "name": "Pairs", "anzahl": 6, "knoepfe": ["at", "in", "about", "of", "to", "for", "on"],
               "paare": [  # Ausdruck, Präposition, Beispielsatz (ganzer Satz erscheint und wird gesprochen)
                   {"wort": "good", "prep": "at", "satz": "la_06"},
                   {"wort": "bad", "prep": "at", "satz": "la_18"},
                   {"wort": "interested", "prep": "in", "satz": "la_07"},
                   {"wort": "take part", "prep": "in", "satz": "la_20"},
                   {"wort": "afraid", "prep": "of", "satz": "la_08"},
                   {"wort": "tired", "prep": "of", "satz": "la_13"},
                   {"wort": "dream", "prep": "of", "satz": "la_22"},
                   {"wort": "nervous", "prep": "about", "satz": "la_15"},
                   {"wort": "excited", "prep": "about", "satz": "la_16"},
                   {"wort": "look forward", "prep": "to", "satz": "la_09"},
                   {"wort": "be used", "prep": "to", "satz": "la_19"},
                   {"wort": "thanks", "prep": "for", "satz": "la_14"}]},
              {"art": "lueckentext", "name": "Gap text", "kasten": ["about", "at", "for", "in", "of", "to"],
               "texte": [  # eigene Texte; {…} = Lücke. Zwei Texte, die sich abwechseln (stand.var)
                   {"titel": "Emma's message", "text": "Hi Grandma! My first week at Lincoln High is over. On Monday I was really nervous {about} meeting new people, but everyone is friendly. "
                    "I'm already good {at} finding my classrooms. I'm interested {in} joining the art club, and I dream {of} playing on the soccer team. "
                    "I'm still not used {to} getting up at six! Thanks {for} sending me the backpack. I'm looking forward {to} seeing you at Thanksgiving. Love, Emma"},
                   {"titel": "Leo's message", "text": "Hey Ben! How's your new school? Mine is huge. I was afraid {of} getting lost, so a girl from my class showed me around. "
                    "On Friday we're going to take part {in} decorating the gym. I'm excited {about} going to my first homecoming dance. "
                    "I'm bad {at} dancing, but don't worry {about} me! Joining the band is a great way {of} making friends. "
                    "Thanks {for} listening – I'm looking forward {to} hearing from you! Leo"}]},
              {"art": "erklaerung", "name": "Rule", "bloecke": [
                  {"typ": "text", "G": "Das kannst du jetzt schon. Hier ist die Übersicht: Viele Ausdrücke haben eine feste Präposition. Nach der Präposition steht das Verb in der -ing-Form.",
                   "E": "You can already do this. Here is the overview: many phrases have a fixed preposition. After the preposition, the verb is in the -ing form."},
                  {"typ": "regeln", "punkte": [
                      [{"G": "at – good at, bad at:", "E": "at – good at, bad at:"}, "la_06"],
                      [{"G": "in – interested in, take part in:", "E": "in – interested in, take part in:"}, "la_07"],
                      [{"G": "about – nervous about, excited about, worry about, think about:", "E": "about – nervous about, excited about, worry about, think about:"}, "la_15"],
                      [{"G": "of – afraid of, tired of, dream of, a way of, instead of:", "E": "of – afraid of, tired of, dream of, a way of, instead of:"}, "la_08"],
                      [{"G": "for – thanks for:", "E": "for – thanks for:"}, "la_14"],
                      [{"G": "to – look forward to. Achtung, Falle: Hier ist to eine Präposition, also -ing!", "E": "to – look forward to. Watch out: here to is a preposition, so use -ing!"}, "la_09"],
                      [{"G": "to – be used to (etwas gewohnt sein), auch mit -ing:", "E": "to – be used to, also with -ing:"}, "la_19"]]},
                  {"typ": "merksatz", "G": "Präposition + Verb? Dann immer -ing! Auch nach to in look forward to und be used to.",
                   "E": "Preposition + verb? Always -ing! Also after to in look forward to and be used to."}]},
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
    import webapp_bauen  # Build-Flag TESTBUILD (Schalter --test: Test-Haken an, nur für eigene Tests)
    webapp_bauen.testbuild_setzen([os.path.join(APP, "app.js"), os.path.join(APP, "runner.js")], "--test" in sys.argv)
    saetze, stimme = {}, 0
    # Abwechselnd Mann/Frau: Reihenfolge der Sätze bestimmt die Stimme (gleich wie im Audio-Skript)
    for z in tsv("saetze.tsv"):
        saetze[z["id"]] = {"en": z["englisch"], "de": z["deutsch"], "luecke": z["luecke"] or None,
                           "stimme": "mf"[stimme % 2], "audio": audio(f"audio/saetze/{z['id']}.mp3")}
        stimme += 1
    vokabeln, units = [], {"1": [], "2": [], "3": []}
    # Symbole (7.11.2026, Bild → Wort): inhalte/klasse9/symbole.tsv – Emoji oder „svg:<name>“ (inhalte/klasse9/symbole/<name>.svg, eingebettet)
    symbole = {}
    for z in tsv("symbole.tsv"):
        if z["symbol"].startswith("svg:"):
            with open(os.path.join(INHALTE, "symbole", z["symbol"][4:] + ".svg"), encoding="utf-8") as f:
                symbole[z["id"]] = {"svg": f.read().strip()}
        else:
            symbole[z["id"]] = {"symbol": z["symbol"]}
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
                         "audio": audio(f"audio/vokabeln/{v['id']}.mp3"), **symbole.get(v["id"], {})})
        stimme += 1
    unbekannt = set(symbole) - {v["id"] for v in vokabeln}
    assert not unbekannt, f"symbole.tsv: unbekannte Vokabel-IDs {sorted(unbekannt)}"
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
                paar_ids = [p["satz"] if isinstance(p, dict) else p for p in s.get("paare", [])]
                for sid in s.get("saetze", []) + s.get("text", []) + paar_ids + [x[0] for x in s.get("zeilen", [])] + [a["satz"] for a in s.get("aufgaben", [])]:
                    assert sid in saetze, sid
                for a in s.get("aufgaben", []) if s["art"] == "verbform" else []:  # Lücke muss als ganzes Wort im Satz stehen (lueckenSatz in app.js sucht ganze Wörter)
                    w = a.get("luecke") or saetze[a["satz"]]["luecke"]
                    m = re.search(r"(?<![A-Za-z'])" + re.escape(w) + r"(?![A-Za-z'])", saetze[a["satz"]]["en"])
                    assert m, (a["satz"], w)
                if s["art"] == "paare":
                    for p in s["paare"]:
                        assert p["prep"] in s["knoepfe"] and re.search(r"\b" + re.escape(p["wort"].split()[-1]) + r"\w* " + p["prep"] + r"\b", saetze[p["satz"]]["en"], re.I), p
                if s["art"] == "lueckentext":
                    for x in s["texte"]:
                        luecken = re.findall(r"\{(\w+)\}", x["text"])
                        assert 7 <= len(luecken) <= 8 and all(l in s["kasten"] for l in luecken), x["titel"]
                        assert 60 <= len(x["text"].split()) <= 85, (x["titel"], len(x["text"].split()))
    # 📝 Hausaufgabe (inhalte/klasse9/hausaufgabe.tsv, Schema in inhalte/klasse9/LIESMICH.md): Ziele gegen die Teile prüfen, wie die App sie zählt
    def vok_teile(ids):  # wie vokSchritte() in der App
        namen = ["Words"] + [f"Sentences · Step {i}" for i in (1, 2, 3)]
        if any(next(v for v in vokabeln if v["id"] == i)["def"] for i in ids):
            namen.append("Find the word")
        namen += ["EN → DE", "DE → EN"]
        if sum(1 for i in ids if i in symbole) >= 2:  # Bild → Wort (hinten angehängt, damit ältere Teil-Nummern gleich bleiben)
            namen.append("Picture → Word")
        return namen
    def gruppen_von(k):
        g = [{"schluessel": f"u{u}:{x['name']}", "name": f"Unit {u} · {x['name']}", "teile": vok_teile(x["vokabeln"])} for u, xs in units.items() for x in xs] if k.get("vokabeln") else []
        g += [{"schluessel": x["name"], "name": x["name"], "teile": vok_teile(x["vokabeln"]) if x.get("vokabeln") else hausaufgaben.teile_namen(x["schritte"], [1, 2, 3], "Step")}
              for x in k.get("gruppen", [])]
        return g or None
    einheiten = [{"nr": k["nr"], "titel": k["titel"], "gruppen": gruppen_von(k), "teile": None} for k in KATEGORIEN]
    hw = hausaufgaben.lesen(os.path.join(INHALTE, "hausaufgabe.tsv"), einheiten)
    daten = {"lob": lob, "saetze": saetze, "vokabeln": vokabeln, "units": units, "kategorien": KATEGORIEN, "hoeren": hoeren,
             "spiel": dict(spieldaten(), grammar=grammar_spiele(saetze)), "gym": GYM, "termin": TERMIN, "hausaufgaben": hw,
             "gln": hausaufgaben.lesen_gln(os.path.join(INHALTE, "gln.tsv"), einheiten)}  # 🏁 Road to GLN
    with open(os.path.join(APP, "daten.js"), "w", encoding="utf-8") as f:
        f.write("// Automatisch erzeugt von werkzeuge/klasse9_bauen.py – bitte nicht von Hand ändern.\n")
        f.write("window.DATEN = " + json.dumps(daten, ensure_ascii=False, indent=1) + ";\n")
    shutil.copyfile(os.path.join(BASIS, "app", "style.css"), os.path.join(APP, "basis.css"))
    os.makedirs(os.path.join(APP, "schriften"), exist_ok=True)  # Flaggen-Schrift (8.11.) für basis.css
    for n in ("TwemojiCountryFlags.woff2", "LIZENZ-TwemojiCountryFlags.md"):
        shutil.copyfile(os.path.join(BASIS, "app", "schriften", n), os.path.join(APP, "schriften", n))
    webapp()
    print("Klasse 9:", len(vokabeln), "Vokabeln,", len(saetze), "Sätze,",
          sum(1 for s in saetze.values() if s["audio"]), "mit Audio")


# Belohnungen (docs/gamification/konzept.md): High-School-Titel, USA-Karte (50 Staaten), Landmark-Karten
TITEL = [(0, "Freshman"), (300, "Sophomore"), (900, "Junior"), (1800, "Senior"), (3000, "Graduate"), (4500, "All-American Legend")]
# Titel-Tiers (6.11.2026, Mr. Alex): je Tier ein Block (Name, Rahmenfarbe am Titel-Schild, Satz zum Eintritt, Stufen mit Symbol). Tier 1 = TITEL oben
# (Symbole wie bisher: 🎓, der höchste 👑). Neues Tier = eine Zeile anhängen. Schwellen: Tier 1 endet bei 4500, darum Tier 2 und 3 je +3000
# gegenüber dem Vorschlag (3000 … 85000 → 6000 … 88000).
TIERS = [
    {"id": "high_school", "name": "High School", "farbe": None, "satz": None,
     "stufen": [(ab, n, "👑" if i == len(TITEL) - 1 else "🎓") for i, (ab, n) in enumerate(TITEL)]},
    {"id": "hollywood", "name": "Hollywood", "farbe": "#d4a017", "satz": "Welcome to Hollywood! The red carpet is rolled out just for you!",
     "stufen": [(6000, "Extra", "🎬"), (7500, "Stunt Double", "🤸"), (9500, "Supporting Star", "⭐"), (12000, "Leading Star", "🌟"),
                (15000, "Director", "🎥"), (19000, "Oscar Winner", "🏆"), (24000, "Hollywood Legend", "🌠")]},
    {"id": "mission_to_mars", "name": "Mission to Mars", "farbe": "#c1440e", "satz": "Welcome to Mission to Mars! Get ready for lift-off to the red planet!",
     "stufen": [(30000, "Space Cadet", "🚀"), (37000, "Test Pilot", "✈️"), (45000, "Astronaut", "👩‍🚀"), (54000, "Moonwalker", "🌕"),
                (64000, "Mission Commander", "🛰️"), (75000, "Mars Pioneer", "🔴"), (88000, "Star Voyager", "🌌")]},
]
titel_id = lambda n: re.sub(r"[^a-z0-9]+", "_", n.lower()).strip("_")
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
    **{f"titel_{titel_id(n)}": f"Congratulations! You are {'an' if n[0] in 'AEIOU' else 'a'} {n} now!" for t in TIERS[1:] for _, n, _ in t["stufen"]},
    **{f"tier_{t['id']}": t["satz"] for t in TIERS[1:]},
    # Mega-Lob (6.11.): erster Abschluss eines Themas mit laufender Serie – Power ab 3, Superpower ab 5, Mega ab 10 Schultagen (oder Perfect month)
    "mega_power_1": "That's real power – well done!", "mega_power_2": "Power! You keep going and going!",
    "mega_power_3": "Look at you – a whole station and still on fire!",
    "mega_super_1": "Superpower unlocked! I'm so proud of you!", "mega_super_2": "Five days in a row and a whole station – wow!",
    "mega_super_3": "You've got superpowers now!",
    "mega_mega_1": "This is beyond anything I've ever seen!", "mega_mega_2": "Mega! You are unstoppable!",
    "mega_mega_3": "Legendary! The whole class should see this!",
}
# Word Gym (docs/word-gym/konzept.md): Standard-Pensum und Boxen-Intervalle in Tagen
# Nächster Termin für den Countdown auf der Startseite (in Wochen); nach dem Termin verschwindet er
TERMIN = {"name": "GLN 2", "datum": "2026-11-24", "powerup": True}  # powerup: 14 Tage vorher werden alle erledigten Teile fällig (⚡ Power Up)
GYM = {"pensum": {"neu": 4, "wdh": 8}, "grenzen": {"neu": [1, 6], "wdh": [4, 12]}, "intervalle": [1, 3, 7, 14, 30, 60, 120]}

# Shop (Coins = gespiegelte Punkte, nicht rückwirkend; docs/gamification/konzept.md „Coins und Shop“). Erweiterbar: neue Artikel hier eintragen.
# Texte mit G/E wie bei "unter" der Kacheln (tx). bald: gezeigt, noch nicht kaufbar · rahmen: CSS-Klasse rahmen-<farbe> für Titel-Schild und Startkarte
# runner: Ticket wird nicht im Shop gekauft, sondern beim Start des Spiels abgebucht (app.js runnerSpiel); der Artikel führt zur Startseite des Runners.
# skin: Figur-Teil für den Runner (app/klasse9/runner.js SKIN_GRUPPEN; frei sind die ersten Werte je Option, s. dort `frei`), id = skin_<option>_<wert>.
# Preis 30, Ausgefallenes 60 (5. Feld; muss zu `preis` in SKIN_GRUPPEN passen). Figur v2 (29.10.): neue Frisuren, Bärte, Haarfarben, Körper-Übertreibungen.
from runner_skins import SKIN_PREIS, SKIN_PREIS_TEUER, SKIN_ARTIKEL, skin_artikel  # gemeinsam mit Klasse 6 (London Run), nur dort pflegen
SHOP = [
    {"id": "runner", "symbol": "🏃", "name": {"G": "Runner-Ticket", "E": "Runner ticket"}, "unter": {"G": "Eintritt für Road Trip Run – wird beim Start abgebucht", "E": "Entry to Road Trip Run – paid when you start"}, "preis": 150, "runner": True},
    {"id": "rahmen_rot", "symbol": "🎨", "name": {"G": "Rahmen für dein Titel-Schild", "E": "Frame for your title card"}, "unter": {"G": "Rot", "E": "Red"}, "preis": 75, "rahmen": "rot"},
    {"id": "rahmen_blau", "symbol": "🎨", "name": {"G": "Rahmen für dein Titel-Schild", "E": "Frame for your title card"}, "unter": {"G": "Blau", "E": "Blue"}, "preis": 75, "rahmen": "blau"},
    {"id": "rahmen_gruen", "symbol": "🎨", "name": {"G": "Rahmen für dein Titel-Schild", "E": "Frame for your title card"}, "unter": {"G": "Grün", "E": "Green"}, "preis": 75, "rahmen": "gruen"},
] + skin_artikel(lambda g, e: {"G": g, "E": e}, {"G": "Figur im Road Trip Run", "E": "Your Road Trip Run character"})


def staat_foto(sid):
    """Staaten-Szene (6.11.): Foto + Quellenzeile am Ende der Szene (app/klasse9/bilder/staaten/<id>.jpg, Quellen inhalte/klasse9/staaten_fotos.tsv)."""
    if not os.path.exists(os.path.join(INHALTE, "staaten_fotos.tsv")) or not os.path.exists(os.path.join(APP, "bilder", "staaten", f"{sid}.jpg")):
        return {}
    q = {z["id"]: z for z in tsv("staaten_fotos.tsv")}.get(sid)
    if not q:
        return {}
    if "wikimedia.org" in q["link"]:  # 7.11.: einzelne bessere Motive von Wikimedia Commons
        return {"foto": f"bilder/staaten/{sid}.jpg", "foto_quelle": f"Foto: {q['urheber']}, {q['lizenz']}, Wikimedia Commons"}
    if "nps.gov" in q["link"]:  # 7.11.: Foto des National Park Service (gemeinfrei)
        return {"foto": f"bilder/staaten/{sid}.jpg", "foto_quelle": f"Foto: National Park Service ({q['lizenz']})"}
    return {"foto": f"bilder/staaten/{sid}.jpg", "foto_quelle": f"Foto: {q['urheber']}, Library of Congress ({q['lizenz']})"}


# Games „Grammar Patrol“ und „Chunk Sprint“ (12.11.2026, Mr. Alex): Daten aus den Sätzen la_01–la_22 (Gruppen „-ing form“ und „Prepositions“).
# Grundform zum -ing-Wort jedes Satzes (steht sonst nirgends in den Daten; nicht in JS erraten).
GRAMMAR_GRUND = {"la_01": "play", "la_02": "walk", "la_03": "get", "la_04": "Dance", "la_05": "Learn", "la_06": "draw", "la_07": "join",
                 "la_08": "speak", "la_09": "see", "la_10": "buy", "la_11": "watch", "la_12": "eat", "la_13": "wait", "la_14": "help",
                 "la_15": "meet", "la_16": "go", "la_17": "make", "la_18": "remember", "la_19": "take", "la_20": "decorate", "la_21": "make",
                 "la_22": "play"}
GRAMMAR_PREPS = ["at", "in", "about", "of", "to", "for", "on"]
# Nur typische Verwechslungen als Fehler zeigen (Mr. Alex, 12.11.): at ↔ in, of ↔ about, for ↔ to – keine Fehler, die kein Kind macht („Thanks on helping“)
GRAMMAR_TYPISCH = {"at": ["in"], "in": ["at"], "of": ["about"], "about": ["of"], "to": ["for"], "for": ["to"]}
# Erzeugte Fehlersätze, die (auch) richtiges oder strittiges Englisch wären – nie als „falsch“ zeigen (einmal alle durchgesehen, 12.11.):
# (Satz, falsche Präposition) bzw. (Satz, "grund") = Grundform statt -ing, (Satz, "to") bei reinen -ing-Sätzen = „to“ + Grundform.
GRAMMAR_AUS = {
    ("la_03", "to"),                     # hates to get up – richtig
    ("la_04", "grund"), ("la_04", "to"),  # Dance is my favorite hobby / To dance is … – richtig
    ("la_05", "to"),                     # To learn a new language takes time – richtig
    ("la_06", "for"), ("la_18", "for"),  # good for / bad for – gibt es (andere Bedeutung)
    ("la_07", "about"),                  # interested about – umgangssprachlich zu hören
    ("la_08", "about"), ("la_08", "for"),  # afraid about / afraid for – strittig
    ("la_10", "of"), ("la_10", "on"),    # thinking of buying – richtig; think on – veraltet
    ("la_15", "of"), ("la_15", "at"),    # nervous of (britisch) – richtig; nervous at – strittig
    ("la_16", "at"), ("la_16", "for"),   # excited at / excited for – gibt es
    ("la_17", "for"), ("la_17", "of"), ("la_17", "at"),  # worry for / of / at – strittig
    ("la_19", "for"),                    # is used for taking – grammatisch (andere Bedeutung)
    ("la_19", "grund"),                  # „Maya is used to take the school bus“ ist als Passiv lesbar (jemand setzt sie ein) – nicht eindeutig falsch, darum nie als Fehler zeigen (Mr. Alex, 12.11.)
    ("la_21", "for"), ("la_21", "to"), ("la_21", "in"),  # a way for / to / in … – strittig
    ("la_22", "about"), ("la_22", "on"),  # dreams about playing – richtig; dream on – gibt es
    ("la_06", "about"), ("la_18", "about"),  # good about / bad about doing – amerikanische Wendung
    ("la_14", "to"),                     # Thanks to helping … – „dank“, als Satzanfang möglich
    ("la_15", "for"), ("la_17", "in"), ("la_19", "in"),  # nervous for / worry in / is used in taking – strittig
}


def grammar_spiele(saetze):
    patrol, sprint = [], []
    ersetze = lambda s, alt, neu: s["en"].replace(alt, neu, 1)
    for nr in range(1, 23):
        sid = f"la_{nr:02d}"
        s, grund = saetze[sid], GRAMMAR_GRUND[sid]
        teile = s["luecke"].split()
        ing, prep = teile[-1], (teile[0] if len(teile) == 2 else None)
        assert s["en"].count(s["luecke"]) == 1 and ing.lower().endswith("ing") and ing.lower().startswith(grund.lower()[:2]), sid
        f_prep, f_ing = [], []
        if prep in GRAMMAR_PREPS:  # falsche Präposition
            f_prep = [ersetze(s, s["luecke"], f"{p} {ing}") for p in GRAMMAR_TYPISCH.get(prep, []) if (sid, p) not in GRAMMAR_AUS]
        if (sid, "grund") not in GRAMMAR_AUS:  # Grundform statt -ing (nach „to“: look forward to see / be used to take)
            f_ing.append(ersetze(s, ing, grund))
        if prep not in GRAMMAR_PREPS and (sid, "to") not in GRAMMAR_AUS:  # „to“ + Grundform statt -ing (nur ohne Präposition davor bzw. nach before)
            f_ing.append(ersetze(s, ing, "to " + grund))
        assert s["en"] not in f_prep + f_ing and len(set(f_prep + f_ing)) == len(f_prep + f_ing), sid
        # extra: weitere falsche Fassungen NUR als Auswahl nach dem Stopp (nie an der Grenze gezeigt), damit es immer etwas zu wählen gibt
        extra = [ersetze(s, s["luecke"], f"{p} {ing}") for p in GRAMMAR_PREPS if prep in GRAMMAR_PREPS and p != prep and (sid, p) not in GRAMMAR_AUS]
        if prep != "to" and (sid, "to") not in GRAMMAR_AUS:
            extra.append(ersetze(s, ing, "to " + grund))
        extra = [x for x in dict.fromkeys(extra) if x not in f_prep + f_ing and x != s["en"]]
        if (f_prep + f_ing) and len(f_prep + f_ing + extra) < 2:  # Notnagel: Verb mit -s („hates gets up“) – eindeutig falsch
            extra.append(ersetze(s, ing, grund + "s"))
        assert not (f_prep + f_ing) or len(f_prep + f_ing + extra) >= 2, sid
        patrol.append({"satz": sid, "prep": f_prep, "ing": f_ing, "extra": extra})
    for k in KATEGORIEN:  # Chunk Sprint: die Aufgaben der verbform-Schritte beider Gruppen …
        for g in k.get("gruppen", []):
            if g["name"] in ("-ing form", "Prepositions"):
                for st in g["schritte"]:
                    if st["art"] == "verbform":
                        sprint += [{"satz": a["satz"], "luecke": a.get("luecke") or saetze[a["satz"]]["luecke"], "richtig": a["richtig"], "falsch": a["falsch"]} for a in st["aufgaben"]]
    for sid, grund in GRAMMAR_GRUND.items():  # … und die -ing-Lücke der übrigen Sätze (Grundform / „to“ + Grundform), außer direkt nach „to“
        ing = saetze[sid]["luecke"].split()[-1]
        if not any(a["satz"] == sid and a["richtig"] == ing for a in sprint) and not saetze[sid]["luecke"].startswith("to "):
            sprint.append({"satz": sid, "luecke": ing, "richtig": ing, "falsch": [grund, "to " + grund]})
    assert len(sprint) >= 30 and all(len(a["falsch"]) == 2 and a["richtig"] not in a["falsch"] for a in sprint)
    if "--grammar" in sys.argv:  # Prüfliste: alle erzeugten Fehlersätze
        for p in patrol:
            print(p["satz"], "✓", saetze[p["satz"]]["en"])
            for f in p["prep"] + p["ing"]:
                print("      ✗", f)
        print(len(sprint), "Sprint-Aufgaben")
    return {"patrol": patrol, "sprint": sprint}


def spieldaten():
    import frei_saarland, usa_karte, runner_audio
    a = lambda pfad: audio(pfad)
    quellen = {q["datei"]: q for q in json.load(open(os.path.join(BASIS, "docs", "gamification", "landmarks", "quellen.json"), encoding="utf-8"))}
    return {
        "titel": [{"ab": ab, "name": n, "symbol": sym, "tier": i, "audio": a(f"audio/spiel/titel_{titel_id(n)}.mp3")}
                  for i, t in enumerate(TIERS) for ab, n, sym in t["stufen"]],
        "tiers": [{"name": t["name"], "farbe": t["farbe"], "text": t["satz"], "audio": a(f"audio/spiel/tier_{t['id']}.mp3") if t["satz"] else None} for t in TIERS],
        "texte": {k: {"text": t, "audio": a(f"audio/spiel/{k}.mp3")} for k, t in SPIEL_TEXTE.items()},
        "staaten": [dict(z, audio=a(f"audio/staaten/{z['id']}.mp3"), **staat_foto(z["id"])) for z in tsv("staaten.tsv")],
        "landmarks": [dict(z, bild=f"bilder/landmarks/{z['bild']}.jpg", audio=a(f"audio/landmarks/{z['id']}.mp3"),
                           quelle=quellen[z["bild"] + ".jpg"]["link"],
                           # Orts-Szene (6.11.): Quellenzeile unter dem Foto am Ende der Szene (Fotos: Carol M. Highsmith, Library of Congress, gemeinfrei)
                           foto_quelle=f"Foto: {quellen[z['bild'] + '.jpg']['fotografin']}, Library of Congress (public domain)") for z in tsv("landmarks.tsv")],
        "karte": usa_karte.pfade(os.path.join(INHALTE, "karte", "states-albers-10m.json")),
        # Superhelden (7.11.2026): 13 US-Helden als Cameos im Road Trip Run (gezeichnet in runner.js HELDEN_ZEICHNUNG); Etappe 3: Sammelkarten + Heldenfilme
        # (Steckbrief, Vorstellung intro, Aufnahme audio/helden/intro_<id>.mp3 aus werkzeuge/runner_audio.py)
        "helden": [{"id": z["id"], "name": z["name"], "kraft": z["kraft"], "steckbrief": z["steckbrief"], "intro": z["intro"],
                    "intro_audio": a(f"audio/helden/intro_{z['id']}.mp3")} for z in tsv("helden.tsv")],
        "akten": [dict(z, absaetze=z["text"].split(" ¶ "), fragen=[dict(zip(("frage", "antwort"), f.split("|"))) for f in z["fragen"].split(";;")]) for z in tsv("geheimakten.tsv")],
        # Goldene Akten (Regel B, 7.11.2026): Freischaltung nach Serie (art „serie“, ziel = Schultage am Stück) oder perfekten Wochen (art „wochen“, ziel = Anzahl)
        "gold": [dict(z, ziel=int(z["ziel"]), absaetze=z["text"].split(" ¶ "), fragen=[dict(zip(("frage", "antwort"), f.split("|"))) for f in z["fragen"].split(";;")]) for z in tsv("goldakten.tsv")],
        # Border Patrol (Games): Wortpaare britisch/amerikanisch; Einzelwort-Audios kommen nach Freigabe (sonst Geräte-Stimme)
        "patrol": [{"id": z["id"], "be": z["be_wort"], "ae": z["luecke"], "de": z["wort_de"],
                    "audio_be": a(f"audio/beae/w_{z['id']}_be.mp3"), "audio_ae": a(f"audio/beae/w_{z['id']}_ae.mp3")} for z in tsv("beae.tsv")],
        "frei": frei_saarland.als_daten(),
        "shop": SHOP,
        # Road Trip Run: Aufnahmen je Welt (Boss-Banner/-Sprüche, Levelstart/-ende; werkzeuge/runner_audio.py), fehlende = Geräte-Stimme
        "runner_audio": runner_audio.daten(9),
        # Story-Modus New York (Kapitel 1): vorhandene Erzähler-Aufnahmen audio/story/ny_<key>.mp3 (noch keine – Vertonung braucht ein eigenes OK), fehlende = Geräte-Stimme
        "story_audio": sorted(f"audio/story/{f}" for f in os.listdir(os.path.join(APP, "audio", "story")) if f.endswith(".mp3")) if os.path.isdir(os.path.join(APP, "audio", "story")) else [],
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
            if rel in ("sw.js",) or n == "QUELLEN.md":  # Quellenliste der Fotos braucht die App offline nicht
                continue
            dateien.append(rel)
            with open(pfad, "rb") as f:
                h.update(rel.encode() + f.read())
    version = h.hexdigest()[:12]
    with open(os.path.join(APP, "sw.js"), "w", encoding="utf-8") as f:
        f.write(f"""// Automatisch erzeugt von werkzeuge/klasse9_bauen.py – Offline-Speicher der App Klasse 9.
const VERSION = "mralex9-{version}r";  // 8.11.: Update lädt alle Dateien frisch vom Server (cache: "reload"), sonst blieb eine neu vertonte mp3 alt
const DATEIEN = {json.dumps(dateien)};
self.addEventListener("install", (e) => {{
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(DATEIEN.map((u) => new Request(u, {{ cache: "reload" }})))).then(() => self.skipWaiting()));
}});
self.addEventListener("activate", (e) => {{
  e.waitUntil(caches.keys().then((alle) => Promise.all(alle.filter((k) => k.startsWith("mralex9-") && k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
}});
self.addEventListener("fetch", (e) => {{
  if (e.request.method !== "GET") return;
  // 11.11.2026: nur im EIGENEN Speicher suchen. caches.match() ohne Namen durchsucht alle Speicher der Seite in der Reihenfolge ihrer Entstehung –
  // die Französisch-App speichert ../style.css mit, und ihr älterer Speicher lieferte der Englisch-App ein altes Stylesheet (Road to GLN rot statt grün).
  e.respondWith(caches.open(VERSION).then((c) => c.match(e.request, {{ ignoreSearch: true }})).then((r) => r || fetch(e.request)));
}});
""")
    print("Web-App Klasse 9:", len(dateien), "Dateien, Version", version)


if __name__ == "__main__":
    main()
