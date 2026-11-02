"""Vertont die Story „The Lost Map“ (Road Trip Run, Klasse 9) mit verteilten Stimmen (ElevenLabs) – Kapitel 1 New York (STORY.ny, Präfix ny_), Kapitel 2 Route 66 (STORY.route66, Präfix route66_),
Kapitel 3 Grand Canyon (STORY.az, Präfix az_), Kapitel 4 Mount Rushmore (STORY.sd, Präfix sd_; Welt-Id sd = South Dakota)
und Kapitel 5 Golden Gate (STORY.ca, Präfix ca_; drei Enden E1_17 … E3_20; nur geplant, Vertonung nach dem 13.11.)
sowie das geheime Kapitel 6 „The Keeper's Journal“ (STORY.realm6, Präfix realm6_; Stück 1 als 1E1/1E2/1E3; nur geplant, Vertonung nach dem 13.11.).

Erzähler = Mr. Alex (alex). Wörtliche Rede: Maya und die Frau mit dem Kompass = Jessica (f), Jayden, Lucas, der Ritter, Sheriff Rattlesnake und Grizzly Grandpa = Jeremy (m); Sätze des Spielers („No, thanks.“,
„We have to go“, „Tell us the truth. Now.“, „Later. First we get past that truck.“, „Stay close to me“, „It's yours. Keep it safe.“, „You've got the plan. Keep it.“, „Everybody makes mistakes … Give it back. Now.“,
„Go … We can't trust you anymore.“) und die Stimme aus dem Licht liest der Erzähler.
Verschachtelte Zitate (Tagebuchtext in einfachen Anführungszeichen innerhalb von Lucas' Rede, Kapitel 3 Stück 5 und A8) spricht Lucas (m) mit; das Tagebuch-Zitat in Kapitel 4 A9 („'I need a torch,'“, einfache
Anführungszeichen außerhalb einer Rede) ist eine eigene Passage (EINZEL) und bekommt Jeremy (m).
Ein Stück mit nur einer Stimme → app/klasse9/audio/story/<praefix>_<key>.mp3; mit Wechsel → <praefix>_<key>_1.mp3, _2.mp3 … (die App spielt sie hintereinander).
Quelle der Texte: STORY.<welt>.teile in app/klasse9/app.js. Vorhandene Dateien werden nicht überschrieben.
Aufruf: python3 werkzeuge/story_audio9.py [--zaehlen] [--welt ny|route66|az|sd|ca|realm6]
"""
import json, os, re, sys, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import klasse9_audio as ka
import klasse9_bauen as k9

ZIEL = os.path.join(k9.APP, "audio", "story")
WELTEN = ["ny", "route66", "az", "sd", "ca", "realm6"]   # Kapitel in Reihenfolge; Dateipräfix = Welt-Id
# Wer spricht die wörtliche Rede je Stück (Reihenfolge der Anführungszeichen-Passagen)? Fehlt ein Eintrag: alles Erzähler.
SPRECHER = {
    # Kapitel 1 New York (vertont 31.10.): Y15 („No, thanks.“ = der Spieler) und Y19 (Stimme aus dem Licht) spricht der Erzähler.
    "ny": {"A7": ["f"], "B9": ["m"], "B10": ["f"], "12": ["f", "f"], "13": ["m"], "X16": ["f"], "Y16": ["f"],
           "X20": ["m"], "Y20": ["m"], "R2": ["m"], "R3": ["m", "m"]},
    # Kapitel 2 Route 66 (Sprecherplan): Maya + Frau = f (Jessica), Jayden/Lucas/Ritter = m (Jeremy); A10, X15, Y15 = Spieler → Erzähler (kein Eintrag).
    "route66": {"2X": ["f"], "2Y": ["f", "f"], "5": ["m"], "A6": ["f"], "A7": ["m"], "B6": ["m"], "B7": ["f"], "B10": ["m", "m"],
                "13": ["f"], "14": ["f"], "X16": ["m"], "X18": ["f", "f"], "X20": ["f", "f"], "Y20": ["m"], "R2": ["m"], "R3": ["m", "m"]},
    # Kapitel 3 Grand Canyon (Sprecherplan, noch nicht vertont): Maya + Frau = f (Jessica); Jayden, Lucas, Ritter, Sheriff = m (Jeremy); 2X, X15, Y15 = Spieler → Erzähler (kein Eintrag);
    # 5 und A8: Lucas liest aus dem Tagebuch (inneres Zitat in einfachen Anführungszeichen bleibt im Text) = m.
    "az": {"2Y": ["m", "m"], "4": ["m"], "5": ["m", "m"], "A7": ["f"], "A8": ["m"], "A9": ["m"], "B8": ["m"], "12": ["m"], "14": ["f", "f"],
           "X18": ["f", "f"], "X19": ["m"], "X20": ["m"], "Y18": ["f", "f"], "Y20": ["m"], "R2": ["m"], "R3": ["m", "m"]},
    # Kapitel 4 Mount Rushmore (Sprecherplan, Vertonung nach dem 13.11.): Maya + Frau = f (Jessica); Jayden, Lucas, Ritter, Grizzly Grandpa = m (Jeremy); X15, Y15 = Spieler → Erzähler (kein Eintrag);
    # A9: Tagebuch-Zitat 'I need a torch,' (einfache Anführungszeichen, siehe EINZEL) = m, dann Jayden zweimal = m.
    "sd": {"4": ["m", "m"], "5": ["f"], "A7": ["m"], "A9": ["m", "m", "m"], "A10": ["f", "f"], "B7": ["m", "m"], "B8": ["f", "f"], "12": ["m"], "14": ["m", "m"],
           "X18": ["m", "m"], "X19": ["f"], "Y18": ["m"], "R2": ["m"], "R3": ["m", "m"]},
    # Kapitel 5 Golden Gate (Sprecherplan, Vertonung nach dem 13.11.): Maya + Elena = f (Jessica); Jayden (auch seine SMS 2Y), Lucas, Ritter, Captain Fog = m (Jeremy); X15, Y15 = Spieler → Erzähler (kein Eintrag).
    "ca": {"2X": ["m", "m"], "2Y": ["m"], "5": ["f"], "A8": ["m", "m"], "B7": ["f"], "12": ["m", "m"], "13": ["f"], "14": ["f", "f"], "Y16": ["f"],
           "E1_19": ["m"], "E2_18": ["f"], "E2_19": ["f", "f"], "E3_18": ["f"], "R2": ["m"], "R3": ["m", "m"]},
    # Kapitel 6 The Keeper's Journal (Sprecherplan, Vertonung nach dem 13.11.): Erzähler alex; Großvater (Tagebuchsätze 5–10) und Ritter = m (Jeremy); Elena = f (Jessica).
    # 5: 'Dear Lucas,' it said. 'If you …' (EINZEL: einfache Anführungszeichen = Großvater); 6–10 ganz Tagebuch (GANZ).
    "realm6": {"3": ["m", "m"], "5": ["m", "m"], "11": ["f"]},
}
# Stücke, die ganz eine Figur spricht (Tagebuchtext; einfache Anführungszeichen außen werden entfernt)
GANZ = {"realm6": {"6": "m", "7": "m", "8": "m", "9": "m", "10": "m"}}
# Stücke, in denen auch eine Passage in einfachen Anführungszeichen (… ,' / .') als Figurenrede zählt (Tagebuch-Zitat außerhalb einer wörtlichen Rede)
EINZEL = {"sd": {"A9"}, "realm6": {"5"}}


def stuecke(welt):
    js = open(os.path.join(k9.APP, "app.js"), encoding="utf-8").read()
    block = js[js.index("const STORY = {"):js.index("const STORY_PUNKTE")]
    start = block.index(f'{welt}: {{ id: "{welt}"')
    rest = block[start:]
    teil = rest[rest.index("teile: {"):rest.index("audio:")]
    for key, text in re.findall(r"\"?(\w+)\"?: \"((?:[^\"\\]|\\.)*)\"", teil):
        yield key, text.replace('\\"', '"')
    yield "sofar", "The story so far."


def segmente(welt, key, text):
    """Teilt in (stimme, text) – wörtliche Rede an die Figur, der Rest an den Erzähler."""
    ganz = GANZ.get(welt, {}).get(key)
    if ganz:
        return [(ganz, text.strip("'"))]
    rollen = SPRECHER.get(welt, {}).get(key)
    if not rollen:
        return [("alex", text)]
    teile, i = [], 0
    muster = r'"[^"]+"|(?<!\w)\'[^\']+[,.!?]\'' if key in EINZEL.get(welt, set()) else r'"[^"]+"'
    for m in re.finditer(muster, text):
        davor = text[i:m.start()].strip(" ")
        if davor: teile.append(("alex", davor))
        n = sum(1 for t in teile if t[0] != "alex")   # wievielte wörtliche Rede
        teile.append((rollen[min(n, len(rollen) - 1)], m.group(0).strip('"\'')))
        i = m.end()
    danach = text[i:].strip(" ")
    if danach: teile.append(("alex", danach))
    # zusammenhängende Erzähler-Teile wie „she said.“ bleiben eigene Dateien (kurz, aber in der richtigen Reihenfolge)
    return teile


def plan(welt):
    liste = []
    for key, text in stuecke(welt):
        seg = segmente(welt, key, text)
        if len(seg) == 1:
            liste.append((f"{welt}_{key}.mp3", seg[0][0], seg[0][1]))
        else:
            for n, (st, t) in enumerate(seg, 1):
                liste.append((f"{welt}_{key}_{n}.mp3", st, t))
    return liste


def main():
    welten = [sys.argv[sys.argv.index("--welt") + 1]] if "--welt" in sys.argv else WELTEN
    offen = []
    for welt in welten:
        p = plan(welt)
        fehlt = [x for x in p if not os.path.exists(os.path.join(ZIEL, x[0]))]
        print(f"{welt}: {len(p)} Dateien geplant, {len(fehlt)} offen, {sum(len(t) for _, _, t in fehlt)} Zeichen offen")
        for datei, st, t in fehlt: print(f"  {st:4} {datei:20} {t}")
        offen += fehlt
    print(f"{len(offen)} Dateien offen, {sum(len(t) for _, _, t in offen)} Zeichen")
    if "--zaehlen" in sys.argv:
        return
    os.makedirs(ZIEL, exist_ok=True)
    for datei, st, t in offen:
        stimm_id, modell, einst = ka.ALEX if st == "alex" else (ka.STIMMEN[st], *ka.MODELLE.get(st, (ka.MODELL, ka.EINSTELLUNGEN)))
        body = json.dumps({"text": t, "model_id": modell, "voice_settings": einst}).encode()
        req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{stimm_id}?output_format=mp3_44100_128",
                                     data=body, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req) as r:
            daten = r.read()
        with open(os.path.join(ZIEL, datei), "wb") as f:
            f.write(daten)
        print("  ✓", datei)


if __name__ == "__main__":
    main()
