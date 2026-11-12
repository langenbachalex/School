"""Vertont die kleinen Runner-Posten der Audio-Vormerkliste (freigegeben 31.10.) und liefert die Dateipfade für die Bauskripte.

Posten: Boss-Banner + Boss-Sprüche richtig/falsch aller zehn Welten (Mr. Alex; Klasse 6: Westminster + London Eye + Tower Bridge + The Tube + Wembley), Levelstart/-ende je Welt
(Klasse 9: Start Jeremy, Ende Jessica; Klasse 6: Start Elrond, Ende Emmaline), Cameo-Sätze der zehn Superhelden (Klasse 6,
je Held eine eigene Stimme, siehe audio_erzeugen.STIMMEN h_<id>) und die 34 Border-Patrol-Einzelwörter
(Klasse 9, Einträge aus klasse9_audio.py: britisch Mr. Alex, amerikanisch Jeremy).
Texte: WELTEN und CAMEO in app/klasse9/runner.js (einzige Quelle). Ziele: app/klasse9/audio/runner/<welt>_<art>.mp3,
app/audio/runner/westminster_<art>.mp3, app/audio/runner/cameo_<held>.mp3, app/klasse9/audio/beae/w_<id>_<be|ae>.mp3.
Vorhandene Dateien werden nie überschrieben. Obergrenze je Lauf: GRENZE Zeichen (sonst wird nichts vertont).
Heldenfilme (6.11.2026): app/audio/helden/intro_<held>.mp3 (Text: Spalte intro in inhalte/helden.tsv, Stimme wie das Cameo).
Mr. Alex' Zurufe im Lauf (7.11.2026): Texte ALEX_ZURUFE in runner.js, Stimme en_alex (Mr. Alex, Stabilität 0,4) mit leichten Audio-Tags (ALEX_TAGS),
einmal vertont nach app/audio/alex/<key>.mp3 (Klasse 6) und von dort nach app/klasse9/audio/alex/ kopiert (gleiche Zeilen für beide Klassen; --nur=audio/alex/).
Vier Ton-Posten vom 12.11.2026 (Mr. Alex): Geheimakten (audio/akten/<id>_<nr>.mp3, je Absatz; Klasse 6 Mr. Alex, Klasse 9 Jeremy/Jessica),
Skin-Menü (app/klasse9/audio/skin/<wendung>.mp3, Jeremy/Jessica im Wechsel; Klasse 6 bleibt bei der Geräte-Stimme, siehe skin_wendungen),
Combo-Sprüche beim Vokabellernen (COMBO_SPRUECHE, audio/alex/vok_<key>.mp3, Mr. Alex, Kopie für Klasse 9) und Grenzer-Sprüche in Border Patrol
(GRENZER, app/klasse9/audio/grenzer/<key>.mp3: amerikanische Seite Jeremy, britische Seite Mr. Alex).
Nachtrag 12.11.2026 (Mr. Alex): Skin-Menü Klasse 6 britisch mit Mr. Alex (app/audio/skin/<wendung>.mp3, en_alex, immer [British accent]) und
Goldene Akten beider Klassen (audio/akten/<id>_<nr>.mp3 aus goldakten.tsv, Stimmen wie die Geheimakten; Klasse 9 je Absatz nach AKTEN9_STIMMEN).
--nur= nimmt auch mehrere Pfad-Anfänge, mit Komma getrennt (für Läufe unter der Grenze).
Aufruf: python3 werkzeuge/runner_audio.py --zaehlen   (nur zählen; --nur=<pfad-anfang> beschränkt auf diese Posten)
        python3 werkzeuge/runner_audio.py             (erzeugen, danach daten_bauen.py und klasse9_bauen.py)
"""
import json, os, re, sys, urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

BASIS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP6, APP9 = os.path.join(BASIS, "app"), os.path.join(BASIS, "app", "klasse9")
ENGINE = os.path.join(APP9, "runner.js")
GRENZE = 2500
WELTEN9, WELTEN6 = ("ny", "route66", "az", "sd", "ca", "realm6"), ("westminster", "londoneye", "towerbridge", "tube", "wembley")   # Klasse 6: Welt 4 The Tube (31.10.) und Welt 5 Wembley (1.11.) kennt das Skript, Dateien erst nach dem 13.11.
ARTEN = ("banner", "richtig", "falsch", "start", "ende")
# Disco Run (Bonus-Level, 7.11.2026): Mr. Alex spricht alles selbst, übertrieben (eleven_v4, Stabilität 0,3 = Stimme en_alex_disco), Kl. 6 britisch, Kl. 9 [American accent];
# Ziele app/audio/runner/disco_<art>.mp3 bzw. app/klasse9/audio/runner/disco_<art>.mp3, Zurufe audio/alex/disco_<key>.mp3 (Texte DISCO_ZURUFE_EN in runner.js)
DISCO_TAGS = {"banner": "[excited] [laughs]", "richtig": "[dramatic] [sobbing]", "falsch": "[laughs]", "start": "[excited] [shouting]", "ende": "[excited] [laughs]"}
# Klasse 9 Kapitel 6 (geheim, 2.11., nur geplant – Vertonung nach dem 13.11.): Boss Elena Cruz spricht ihre Sprüche selbst (Jessica = f), das Banner bleibt beim Erzähler (Mr. Alex)
STIMME9 = {"realm6": {"richtig": "f", "falsch": "f"}}
JUNGEN, MAEDCHEN = ("leo", "kenji", "felix", "max"), ("camilla", "ellie", "olivia", "zara", "penny", "tessa")
CAMEO_STIMME = {h: f"h_{h}" for h in JUNGEN + MAEDCHEN}   # 7.11.: jeder Held eine eigene Stimme (audio_erzeugen.STIMMEN h_<id>)
# Klasse 9 (7.11.2026, Etappe 2): 13 US-Helden (inhalte/klasse9/helden.tsv), je eine eigene amerikanische Stimme (audio_erzeugen.STIMMEN h_<id>), Ziel app/klasse9/audio/runner/cameo_<id>.mp3
HELDEN9 = ("eddie", "bonnie", "gus", "cody", "ally", "rosie", "benny", "pennypuma", "archie", "molly", "holly", "maya", "sunny")


# Audio-Tags (7.11.2026, Mr. Alex: „lots of emotions", v4, Stabilität 0,3): nur im gesprochenen Text, nicht im Untertitel (helden.tsv / runner.js bleiben ohne Tags)
HELD_TAGS = {"leo": "[energetic]", "camilla": "[proud]", "ellie": "[thoughtful]", "olivia": "[calm]", "kenji": "[excited]", "zara": "[playful]",
             "penny": "[cheerful]", "felix": "[confident]", "tessa": "[warm]", "max": "[mischievous]",
             # Klasse 9 (7.11.): Pilot, Rockerin, Bodyguard, Cowboy, Surferin, Ninja, Baumeister, Parkour, Texas-Cowboy, Punk-Drummerin, Heilerin, Gala-Lady, Popstar
             "eddie": "[confident]", "bonnie": "[excited]", "gus": "[calm]", "cody": "[energetic]", "ally": "[cheerful]", "rosie": "[whispers]",
             "benny": "[cheerful]", "pennypuma": "[excited]", "archie": "[laid-back]", "molly": "[shouting]", "holly": "[warm]", "maya": "[elegant]", "sunny": "[excited]"}
HELD_INTRO_TAGS = {   # Film-Vorstellung mit Tags an passenden Stellen (Text wie Spalte intro in helden.tsv)
    "leo": "[energetic] Hi, I'm Leo the Lion! My superpower is super speed. [fast] I can run faster than a car! [laughs]",
    "camilla": "[proud] Hi, I'm Camilla the Camel! I'm super strong. [grunts] Look, I can carry a car on my back! [laughs]",
    "ellie": "[thoughtful] Hi, I'm Ellie the Elephant! I never forget a word. [proud] I can remember every page of every book!",
    "olivia": "[calm] Hi, I'm Olivia the Owl! I can see in the dark. [whispers] At night, I watch London and find lost things.",
    "kenji": "[excited] Hi, I'm Kenji the Kangaroo! My superpower is super jump. [laughs] I can jump over houses!",
    "zara": "[playful] Hi, I'm Zara the Zebra! I can become invisible. [whispers] Now you see me, [giggles] now you don't!",
    "penny": "[cheerful] Hi, I'm Penny the Penguin! I have ice powers. [whispers] I can freeze water in one second! [giggles]",
    "felix": "[confident] Hi, I'm Felix the Falcon! I can fly around the world in one day. [awe] I see everything from the sky!",
    "tessa": "[warm] Hi, I'm Tessa the Turtle! I'm unbreakable. [chuckles] Nothing can hurt my shell!",
    "max": "[mischievous] Hi, I'm Max the Monkey! I'm a genius inventor. [excited] I build a new gadget every day!",
}
# Klasse 9 – Heldenfilme (7.11.2026, Etappe 3): Vorstellung je US-Held (Spalte intro in inhalte/klasse9/helden.tsv), dieselbe Stimme wie sein Cameo (h_<id>),
# immer [American accent]; Tags an passenden Stellen, ohne Tags muss der Text genau der Spalte intro entsprechen (Prüfung in auftraege)
HELD_INTRO_TAGS9 = {
    "eddie": "[confident] [American accent] Hi, I'm Eddie the Eagle! I've been flying over Alaska since I was a little chick. [serious] Nothing escapes my eyes – and if I need to, I can fire laser beams with them!",
    "bonnie": "[excited] [American accent] Hey, I'm Bonnie the Bison! I grew up on the wide prairies of Yellowstone. [laughs] If something blocks your way, just call me – I'll push it out of the way!",
    "gus": "[calm] [American accent] Hi there, I'm Gus the Grizzly from Montana! [chuckles] I'm big, but I'm a gentle giant. [serious] When danger comes, I build a force field, and nothing can get through it.",
    "cody": "[energetic] [American accent] Yo, I'm Cody the Coyote! I live in the Arizona desert near the Grand Canyon. [fast] I'm the fastest runner in the West – if you blink, you'll miss me!",
    "ally": "[cheerful] [American accent] Hi, I'm Ally the Alligator! I come from the Everglades in Florida. [playful] Watch out, villains – one splash from me and you're gone!",
    "rosie": "[whispers] [American accent] Psst, it's me, Rosie the Raccoon! I grew up in Central Park in New York. [mischievously] Now you see me – and now you don't!",
    "benny": "[cheerful] [American accent] Hey, I'm Benny the Beaver from Minnesota, the land of ten thousand lakes! [curious] Is there a river in your way? [confident] No problem – I'll build you a bridge in no time.",
    "pennypuma": "[excited] [American accent] Hi, I'm Penny the Puma! I live high up in the Rocky Mountains of Colorado. [playful] One big jump and I'm over any wall – want to see?",
    "archie": "[laid-back] [American accent] Howdy, I'm Archie the Armadillo from Texas! [proud] My shell is tougher than steel. [excited] Watch me roll up into a ball and smash through everything!",
    "molly": "[playful] [American accent] Hi, I'm Molly the Moose from Maine! I'm tall and I'm strong. [shouting] When I stomp my hooves, the whole ground shakes like thunder!",
    "holly": "[warm] [American accent] Hi, I'm Holly the Hummingbird! I zoom around the flower gardens of California. [gently] I'm small, but I can heal you in a heartbeat!",
    "maya": "[elegant] [American accent] Hello, I'm Maya the Monarch! Every autumn I fly all the way across the USA to Mexico. [softly] Hold on tight – I'll let you float with me!",
    "sunny": "[excited] [American accent] Hey everyone, I'm Sunny the Songbird from Nashville! I'm a pop star and a superhero. [laughs] When I sing, the bad guys just can't stop dancing!",
}
HELD_RUFE = {   # Ausrufe in den Heldenfilmen (Sprechblase im Film = dieser Text)
    "ellie": "Every word!", "olivia": "Found it!", "kenji": "Boing!", "zara": "Surprise!",
    "penny": "Ice cream for everybody!", "felix": "Around the world in one day!", "tessa": "Bonk!", "max": "Homework done!",
    "leo": "Too fast for you!", "camilla": "Easy peasy!",
}

HELD_RUFE9 = {   # Ausrufe in den Kl.-9-Heldenfilmen (gleicher Text wie HELD9_RUF in app/klasse9/runner.js)
    "eddie": "Target locked!", "bonnie": "Rock on!", "gus": "Not on my watch!", "cody": "Yee-haw!", "ally": "Cowabunga!", "rosie": "Now you don't!", "benny": "Bridge is open!", "pennypuma": "Sky high!", "archie": "Rollin', y'all!", "molly": "Drum roll!", "holly": "All better now!", "maya": "Simply divine!", "sunny": "Encore!",
}

# Regel Mr. Alex (7.11.2026): kurze Zurufe (bis ~4 Wörter), besonders mit R am Wortende („fire“), bekommen zusätzlich den Tag [British accent],
# sonst spricht die Stimme das End-R amerikanisch. Gilt für alle kurzen englischen Zeilen (v4 kennt keinen language_code en-GB).
# Klasse 9 (Mr. Alex, 7.11.): US-Helden sprechen IMMER mit [American accent] (auch kurze Zeilen), nie britisch – britisch(text, klasse=9).
def britisch(text, klasse=6):
    if klasse == 9:
        return " [American accent]"
    kurz = len(re.findall(r"[A-Za-z']+", text)) <= 4
    end_r = bool(re.search(r"[aeiou]r\b", text, re.I))
    return " [British accent]" if kurz or end_r else ""


ALEX_TAGS = {"start": "[cheerful]", "combo3": "[cheerful]", "combo5": "[excited]", "combo8": "[excited]", "tore3": "[cheerful]", "leben": "[encouraging]",
             "letztes": "[calm]", "halb": "[cheerful]", "boss": "[encouraging]", "ende": "[warm]", "fail": "[warm]"}   # leichte Tags je Moment (nur im gesprochenen Text)


def alex_zurufe():
    """[(key, text)] aus ALEX_ZURUFE in runner.js (einzige Textquelle)."""
    js = open(ENGINE, encoding="utf-8").read()
    block = js[js.index("const ALEX_ZURUFE = {"):js.index("const ALEX_ABSTAND")]
    return re.findall(r'\["(\w+)", "([^"]+)"\]', block)


def disco_zurufe():
    """[(key, text)] aus DISCO_ZURUFE_EN in runner.js."""
    js = open(ENGINE, encoding="utf-8").read()
    block = js[js.index("const DISCO_ZURUFE_EN = {"):js.index("const DISCO_ZURUFE_FR")]
    return re.findall(r'\["(\w+)", "([^"]+)"\]', block)


def alex_kopieren():
    """Die Zurufe gibt es einmal (Klasse 6); Klasse 9 bekommt Kopien (nur fehlende)."""
    for key in [k for k, _ in alex_zurufe()] + [f"vok_{k}" for l in COMBO_SPRUECHE.values() for k, _ in l]:
        q, z = os.path.join(APP6, "audio", "alex", f"{key}.mp3"), os.path.join(APP9, "audio", "alex", f"{key}.mp3")
        if os.path.exists(q) and not os.path.exists(z):
            os.makedirs(os.path.dirname(z), exist_ok=True)
            import shutil; shutil.copyfile(q, z)


# Combo-Sprüche beim Vokabellernen (12.11.2026): Mini-Reward bei 3/5/8 richtigen in Folge (app.js comboPruefen), Mr. Alex (en_alex) mit leichten Tags.
# Einzige Textquelle; kein Untertitel in der App. Einmal vertont nach app/audio/alex/vok_<key>.mp3, Kopie nach app/klasse9/audio/alex/ (alex_kopieren).
COMBO_SPRUECHE = {
    3: [("combo3_1", "Three in a row – nice!"), ("combo3_2", "Good start – keep going!")],
    5: [("combo5_1", "Five in a row – great!"), ("combo5_2", "You know your words!")],
    8: [("combo8_1", "Eight in a row – wow!"), ("combo8_2", "You are a word champion!")],
}
# Grenzer-Sprüche in Border Patrol (Klasse 9, 12.11.2026): (Moment, Stimme, Tag, Text) – amerikanische Seite Jeremy (m), britische Seite Mr. Alex (alex, mit [British accent]).
# ok_<seite>: richtig einsortiert auf dieser Seite; falsch_<seite>: Wort fälschlich auf diese Seite geschoben (der Grenzer dieser Seite weist es ab).
GRENZER = {
    "start_1": ("start", "m", "[cheerful]", "Welcome to the border! Passports, please!"),
    "start_2": ("start", "alex", "[cheerful]", "Border control! Where are your words from?"),
    "ok_ae_1": ("ok_ae", "m", "[cheerful]", "Welcome to the USA!"),
    "ok_ae_2": ("ok_ae", "m", "[cheerful]", "Go right ahead!"),
    "ok_be_1": ("ok_be", "alex", "[cheerful]", "Welcome to Britain!"),
    "ok_be_2": ("ok_be", "alex", "[warm]", "Lovely – come in!"),
    "falsch_ae_1": ("falsch_ae", "m", "[surprised]", "Wrong side of the ocean!"),
    "falsch_be_1": ("falsch_be", "alex", "[surprised]", "Sorry, that's not British!"),
    "ende_gut_1": ("ende_gut", "m", "[excited]", "Great job, officer!"),
    "ende_zu_1": ("ende_zu", "alex", "[calm]", "The border is closed for today."),
}
# Geheimakten Klasse 9: Stimme je Absatz passend zur Figur im Absatz (m = Jeremy, f = Jessica); ohne Eintrag im Wechsel m/f
AKTEN9_STIMMEN = {"liberty_ny": "fmmf", "gold_yearbook": "fmffmfmf", "gold_gold_rush": "fmmffmm", "gold_route66_radio": "mffmfmfm"}


def akten(klasse):
    """[(id, nr, sprechtext)] je Absatz aus inhalte[/klasse9]/geheimakten.tsv und goldakten.tsv (Goldene Akten, 12.11.) – Worthilfen {wort|deutsch} werden zu wort."""
    import daten_bauen
    for datei in ("geheimakten.tsv", "goldakten.tsv"):
        for z in daten_bauen.lesen(datei if klasse == 6 else os.path.join("klasse9", datei)):
            for nr, absatz in enumerate(z["text"].split(" ¶ "), 1):
                yield z["id"], nr, re.sub(r"\{([^|}]*)\|[^}]*\}", r"\1", absatz).strip()


def skin_wendungen():
    """Wendungen des Skin-Menüs aus SPRECH/FARBE_EN/TOP_EN in runner.js (wie sprechText(); „Power level n“ spricht das Menü nicht) → [(wendung, dateiname)].
    Klasse 9: Jeremy/Jessica im Wechsel (amerikanisch); Klasse 6 (freigegeben 12.11.): Mr. Alex (en_alex), britisch – jede Wendung mit [British accent],
    weil alle kurz sind (Regel 7.11.). SPRECH/FARBE_EN/TOP_EN sind in app/runner.js und app/klasse9/runner.js gleich."""
    js = open(ENGINE, encoding="utf-8").read()
    block = js[js.index("const SPRECH = {"):js.index("const FARBE_EN")]
    liste = re.findall(r': "([^"]+)"', block)
    farben = re.findall(r': "([^"]+)"', re.search(r"const FARBE_EN = \{(.*?)\};", js).group(1))
    tops = re.findall(r': "([^"]+)"', re.search(r"const TOP_EN = \{(.*?)\};", js).group(1))
    liste += [f"{f} {t}" for f in farben for t in tops]
    return [(w, re.sub(r"[^a-z0-9]+", "_", w.lower()).strip("_")) for w in dict.fromkeys(liste)]


def texte():
    """{welt: {banner, richtig, falsch, start, ende}}, {held: satz} aus der Engine."""
    js = open(ENGINE, encoding="utf-8").read()
    konst = dict(re.findall(r"const (\w+) = \"([^\"]+)\";", js))
    welten = {}
    for w in WELTEN9 + WELTEN6:
        zeile = re.search(r"\n    %s: \{ id: '%s',(.*?)\n      [a-z]" % (w, w), js, re.S).group(1)
        t = {}
        for art in ARTEN:
            m = re.search(r"\b%s: (?:\"([^\"]+)\"|'([^']+)'|([A-Z_]+))" % art, zeile)
            t[art] = m.group(1) or m.group(2) or konst[m.group(3)]
        welten[w] = t
    zeile = re.search(r"\n    disco: \{ id: 'disco',(.*?)\n      [a-z]", js, re.S).group(1)
    welten["disco"] = {art: re.search(r"\b%s: (?:\"([^\"]+)\"|'([^']+)')" % art, zeile).group(1) or re.search(r"\b%s: (?:\"([^\"]+)\"|'([^']+)')" % art, zeile).group(2) for art in ARTEN}
    block = js[js.index("const CAMEO = {"):js.index("const cameoInfo")]
    cameo = dict(re.findall(r"(\w+): \{ satz: \"([^\"]+)\"", block))
    return welten, cameo


def auftraege():
    """(klasse, app-ordner, relativer pfad, stimme, text). Stimmen Klasse 9: alex/m/f (klasse9_audio), Klasse 6: en/m1/m2/f1/f2 (audio_erzeugen)."""
    welten, cameo = texte()
    liste = []
    for w in WELTEN9:
        for art in ARTEN:
            liste.append((9, APP9, f"audio/runner/{w}_{art}.mp3", STIMME9.get(w, {}).get(art) or {"start": "m", "ende": "f"}.get(art, "alex"), welten[w][art]))
    for w in WELTEN6:
        for art in ARTEN:
            liste.append((6, APP6, f"audio/runner/{w}_{art}.mp3", {"start": "m1", "ende": "f1"}.get(art, "en"), welten[w][art]))
    for h in JUNGEN + MAEDCHEN:
        liste.append((6, APP6, f"audio/runner/cameo_{h}.mp3", CAMEO_STIMME[h], f"{HELD_TAGS[h]} {cameo[h]}"))
    for h in HELDEN9:   # Klasse 9: US-Stimme, [American accent] (britisch(…, 9))
        liste.append((9, APP9, f"audio/runner/cameo_{h}.mp3", f"h_{h}", f"{HELD_TAGS[h]}{britisch(cameo[h], 9)} {cameo[h]}"))
    # Heldenfilme (6.11.2026): Selbstvorstellung je Held (Spalte intro in inhalte/helden.tsv), dieselbe Stimme wie sein Cameo
    import daten_bauen
    for z in daten_bauen.lesen("helden.tsv"):
        if z.get("intro"):
            liste.append((6, APP6, f"audio/helden/intro_{z['id']}.mp3", CAMEO_STIMME[z["id"]], HELD_INTRO_TAGS.get(z["id"], z["intro"])))
    # Klasse 9 – Heldenfilme (7.11.2026, Etappe 3): app/klasse9/audio/helden/intro_<id>.mp3
    import re
    for z in daten_bauen.lesen(os.path.join("klasse9", "helden.tsv")):
        text = HELD_INTRO_TAGS9.get(z["id"]) or f"{HELD_TAGS[z['id']]}{britisch(z['intro'], 9)} {z['intro']}"
        assert re.sub(r"\[[^\]]+\] ?", "", text).strip() == z["intro"], f"Tags-Text weicht von intro ab: {z['id']}"
        liste.append((9, APP9, f"audio/helden/intro_{z['id']}.mp3", f"h_{z['id']}", text))
    # Ausrufe in den Heldenfilmen (7.11.2026, Mr. Alex: auch sprechen) – dieselbe Stimme; Zeitpunkt steht in runner.js (Klang 'ruf')
    for h, text in HELD_RUFE.items():
        liste.append((6, APP6, f"audio/helden/ruf_{h}.mp3", CAMEO_STIMME[h], f"{HELD_TAGS[h]} {text}"))
    for h, text in HELD_RUFE9.items():   # Klasse 9: immer [American accent]
        liste.append((9, APP9, f"audio/helden/ruf_{h}.mp3", f"h_{h}", f"{HELD_TAGS[h]}{britisch(text, 9)} {text}"))
    # Mr. Alex' Zurufe im Lauf (7.11.2026): einmal vertonen (Klasse 6), Kopie für Klasse 9 (alex_kopieren)
    for key, text in alex_zurufe():
        liste.append((6, APP6, f"audio/alex/{key}.mp3", "en_alex", f"{ALEX_TAGS[key.rsplit('_', 1)[0]]}{britisch(text)} {text}"))
    for kl, app in ((6, APP6), (9, APP9)):   # Disco Run: Mr. Alex, übertrieben
        for art in ARTEN:
            t = welten["disco"][art]
            liste.append((kl, app, f"audio/runner/disco_{art}.mp3", "en_alex_disco", f"{DISCO_TAGS[art]}{britisch(t, kl)} {t}"))
        for key, text in disco_zurufe():
            liste.append((kl, app, f"audio/alex/{key}.mp3", "en_alex_disco", f"[excited]{britisch(text, kl)} {text}"))
    # Vier Ton-Posten vom 12.11.2026: Geheimakten, Skin-Menü, Combo-Sprüche, Grenzer
    for id_, nr, text in akten(6):
        liste.append((6, APP6, f"audio/akten/{id_}_{nr}.mp3", "en", text))
    for id_, nr, text in akten(9):
        liste.append((9, APP9, f"audio/akten/{id_}_{nr}.mp3", (AKTEN9_STIMMEN.get(id_, "") + "mf" * 20)[nr - 1], text))
    for i, (wendung, datei) in enumerate(skin_wendungen()):
        liste.append((9, APP9, f"audio/skin/{datei}.mp3", "mf"[i % 2], wendung))
    for wendung, datei in skin_wendungen():   # Klasse 6: Mr. Alex, britisch (Tag nur im gesprochenen Text)
        liste.append((6, APP6, f"audio/skin/{datei}.mp3", "en_alex", f"[British accent] {wendung}"))
    for n, sprueche in COMBO_SPRUECHE.items():
        for key, text in sprueche:
            liste.append((6, APP6, f"audio/alex/vok_{key}.mp3", "en_alex", f"{ALEX_TAGS[f'combo{n}']}{britisch(text)} {text}"))
    for key, (_, stimme, tag, text) in GRENZER.items():
        liste.append((9, APP9, f"audio/grenzer/{key}.mp3", stimme, f"{tag}{' [British accent]' if stimme == 'alex' else ''} {text}"))
    import klasse9_audio
    for pfad, stimme, text in klasse9_audio.auftraege():
        if pfad.startswith("audio/beae/w_"):
            liste.append((9, APP9, pfad, stimme, text))
    return liste


def daten(klasse):
    """Für die Bauskripte: {welt: {boss: {banner, richtig, falsch}, start, ende[, cameo]}} – nur vorhandene Dateien, sonst None (Geräte-Stimme)."""
    app, welten = (APP9, WELTEN9) if klasse == 9 else (APP6, WELTEN6)
    a = lambda rel: rel if os.path.exists(os.path.join(app, rel)) else None
    aus = {}
    for w in welten:
        d = {"boss": {art: a(f"audio/runner/{w}_{art}.mp3") for art in ("banner", "richtig", "falsch")},
             "start": a(f"audio/runner/{w}_start.mp3"), "ende": a(f"audio/runner/{w}_ende.mp3")}
        d["cameo"] = {h: a(f"audio/runner/cameo_{h}.mp3") for h in (JUNGEN + MAEDCHEN if klasse == 6 else HELDEN9)}
        aus[w] = d
    aus["disco"] = {"boss": {art: a(f"audio/runner/disco_{art}.mp3") for art in ("banner", "richtig", "falsch")},
                    "start": a("audio/runner/disco_start.mp3"), "ende": a("audio/runner/disco_ende.mp3")}   # Disco Run (Bonus)
    aus["alex"] = {key: a(f"audio/alex/{key}.mp3") for key, _ in alex_zurufe() + disco_zurufe()}   # Mr. Alex' Zurufe (7.11.), beide Klassen dieselben Dateien
    # Vier Ton-Posten vom 12.11.2026 – nur vorhandene Dateien (fehlt eine, bleibt es bei Geräte-Stimme bzw. Stille)
    aus["akten"] = {}
    for id_, nr, _ in akten(klasse):
        aus["akten"].setdefault(id_, []).append(a(f"audio/akten/{id_}_{nr}.mp3"))
    aus["akten"] = {k: v for k, v in aus["akten"].items() if all(v)}   # eine Akte wird nur ganz vorgelesen
    aus["skin"] = {w: f"audio/skin/{d}.mp3" for w, d in skin_wendungen() if a(f"audio/skin/{d}.mp3")}   # Klasse 9 Jeremy/Jessica, Klasse 6 Mr. Alex
    aus["vok_combo"] = {str(n): [p for p in (a(f"audio/alex/vok_{key}.mp3") for key, _ in l) if p] for n, l in COMBO_SPRUECHE.items()}
    if klasse == 9:
        aus["grenzer"] = {}
        for key, (moment, *_rest) in GRENZER.items():
            if a(f"audio/grenzer/{key}.mp3"):
                aus["grenzer"].setdefault(moment, []).append(f"audio/grenzer/{key}.mp3")
    return aus


def sprechen9(stimme, text, ziel):
    import klasse9_audio as k
    stimm_id, modell, einst = k.ALEX if stimme == "alex" else (k.STIMMEN[stimme], *k.MODELLE.get(stimme, (k.MODELL, k.EINSTELLUNGEN)))
    body = json.dumps({"text": text, "model_id": modell, "voice_settings": einst}).encode()
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{stimm_id}?output_format=mp3_44100_128",
                                 data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r:
        daten_ = r.read()
    with open(ziel, "wb") as f:
        f.write(daten_)


def main():
    nur = next((tuple(a.split("=", 1)[1].split(",")) for a in sys.argv if a.startswith("--nur=")), None)   # z. B. --nur=audio/helden/intro_ (nur diese Posten; mehrere Anfänge mit Komma)
    offen = [x for x in auftraege() if not os.path.exists(os.path.join(x[1], x[2])) and (not nur or x[2].startswith(nur))]
    summe = sum(len(x[4]) for x in offen)
    print(f"{len(offen)} Dateien offen, {summe} Zeichen (Grenze {GRENZE})")
    for kl, _, pfad, stimme, text in offen:
        print(f"  K{kl} {pfad} [{stimme}] {len(text):3d}  {text}")
    if "--zaehlen" in sys.argv:
        return
    if summe > GRENZE:
        print("Über der Grenze – nichts vertont.")
        return
    import audio_erzeugen
    for kl, app, pfad, stimme, text in offen:
        ziel = os.path.join(app, pfad)
        if os.path.exists(ziel):
            continue
        os.makedirs(os.path.dirname(ziel), exist_ok=True)
        for versuch in (1, 2, 3):   # bei API-Fehlern höchstens 3 Versuche je Datei, dann Abbruch (keine halben Dateien)
            try:
                if kl == 9 and not stimme.startswith(("h_", "en_alex_disco")):   # Klasse-9-Helden (h_<id>) über audio_erzeugen
                    sprechen9(stimme, text, ziel)
                else:
                    audio_erzeugen.sprechen(stimme, "en", text, ziel)
                break
            except Exception as e:
                print(f"  FEHLER ({versuch}/3) {pfad}: {e}")
                if os.path.exists(ziel):
                    os.remove(ziel)
                if versuch == 3:
                    print("Abbruch nach 3 Versuchen.")
                    alex_kopieren()
                    sys.exit(1)
                import time; time.sleep(5 * versuch)
        print("  ✓", pfad)
    alex_kopieren()


if __name__ == "__main__":
    main()
