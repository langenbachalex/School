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
# Klasse 9 Kapitel 6 (geheim, 2.11., nur geplant – Vertonung nach dem 13.11.): Boss Elena Cruz spricht ihre Sprüche selbst (Jessica = f), das Banner bleibt beim Erzähler (Mr. Alex)
STIMME9 = {"realm6": {"richtig": "f", "falsch": "f"}}
JUNGEN, MAEDCHEN = ("leo", "kenji", "felix", "max"), ("camilla", "ellie", "olivia", "zara", "penny", "tessa")
CAMEO_STIMME = {h: f"h_{h}" for h in JUNGEN + MAEDCHEN}   # 7.11.: jeder Held eine eigene Stimme (audio_erzeugen.STIMMEN h_<id>)


# Audio-Tags (7.11.2026, Mr. Alex: „lots of emotions", v4, Stabilität 0,3): nur im gesprochenen Text, nicht im Untertitel (helden.tsv / runner.js bleiben ohne Tags)
HELD_TAGS = {"leo": "[energetic]", "camilla": "[proud]", "ellie": "[thoughtful]", "olivia": "[calm]", "kenji": "[excited]", "zara": "[playful]",
             "penny": "[cheerful]", "felix": "[confident]", "tessa": "[warm]", "max": "[mischievous]"}
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
HELD_RUFE = {   # Ausrufe in den Heldenfilmen (Sprechblase im Film = dieser Text)
    "ellie": "Every word!", "olivia": "Found it!", "kenji": "Boing!", "zara": "Surprise!",
    "penny": "Ice cream for everybody!", "felix": "Around the world in one day!", "tessa": "Bonk!", "max": "Homework done!",
    "leo": "Too fast for you!", "camilla": "Easy peasy!",
}

ALEX_TAGS = {"start": "[cheerful]", "combo3": "[cheerful]", "combo5": "[excited]", "combo8": "[excited]", "tore3": "[cheerful]", "leben": "[encouraging]",
             "letztes": "[calm]", "halb": "[cheerful]", "boss": "[encouraging]", "ende": "[warm]", "fail": "[warm]"}   # leichte Tags je Moment (nur im gesprochenen Text)


def alex_zurufe():
    """[(key, text)] aus ALEX_ZURUFE in runner.js (einzige Textquelle)."""
    js = open(ENGINE, encoding="utf-8").read()
    block = js[js.index("const ALEX_ZURUFE = {"):js.index("const ALEX_ABSTAND")]
    return re.findall(r'\["(\w+)", "([^"]+)"\]', block)


def alex_kopieren():
    """Die Zurufe gibt es einmal (Klasse 6); Klasse 9 bekommt Kopien (nur fehlende)."""
    for key, _ in alex_zurufe():
        q, z = os.path.join(APP6, "audio", "alex", f"{key}.mp3"), os.path.join(APP9, "audio", "alex", f"{key}.mp3")
        if os.path.exists(q) and not os.path.exists(z):
            os.makedirs(os.path.dirname(z), exist_ok=True)
            import shutil; shutil.copyfile(q, z)


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
    # Heldenfilme (6.11.2026): Selbstvorstellung je Held (Spalte intro in inhalte/helden.tsv), dieselbe Stimme wie sein Cameo
    import daten_bauen
    for z in daten_bauen.lesen("helden.tsv"):
        if z.get("intro"):
            liste.append((6, APP6, f"audio/helden/intro_{z['id']}.mp3", CAMEO_STIMME[z["id"]], HELD_INTRO_TAGS.get(z["id"], z["intro"])))
    # Ausrufe in den Heldenfilmen (7.11.2026, Mr. Alex: auch sprechen) – dieselbe Stimme; Zeitpunkt steht in runner.js (Klang 'ruf')
    for h, text in HELD_RUFE.items():
        liste.append((6, APP6, f"audio/helden/ruf_{h}.mp3", CAMEO_STIMME[h], f"{HELD_TAGS[h]} {text}"))
    # Mr. Alex' Zurufe im Lauf (7.11.2026): einmal vertonen (Klasse 6), Kopie für Klasse 9 (alex_kopieren)
    for key, text in alex_zurufe():
        liste.append((6, APP6, f"audio/alex/{key}.mp3", "en_alex", f"{ALEX_TAGS[key.rsplit('_', 1)[0]]} {text}"))
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
        if klasse == 6:
            d["cameo"] = {h: a(f"audio/runner/cameo_{h}.mp3") for h in JUNGEN + MAEDCHEN}
        aus[w] = d
    aus["alex"] = {key: a(f"audio/alex/{key}.mp3") for key, _ in alex_zurufe()}   # Mr. Alex' Zurufe (7.11.), beide Klassen dieselben Dateien
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
    nur = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--nur=")), None)   # z. B. --nur=audio/helden/intro_ (nur diese Posten)
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
        if kl == 9:
            sprechen9(stimme, text, ziel)
        else:
            audio_erzeugen.sprechen(stimme, "en", text, ziel)
        print("  ✓", pfad)
    alex_kopieren()


if __name__ == "__main__":
    main()
