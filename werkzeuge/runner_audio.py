"""Vertont die kleinen Runner-Posten der Audio-Vormerkliste (freigegeben 31.10.) und liefert die Dateipfade für die Bauskripte.

Posten: Boss-Banner + Boss-Sprüche richtig/falsch aller acht Welten (Mr. Alex; Klasse 6: Westminster + London Eye + Tower Bridge), Levelstart/-ende je Welt
(Klasse 9: Start Jeremy, Ende Jessica; Klasse 6: Start Elrond, Ende Emmaline), Cameo-Sätze der zehn Superhelden (Klasse 6,
Jungen abwechselnd Elrond/John Shaw, Mädchen abwechselnd Emmaline/Alice) und die 34 Border-Patrol-Einzelwörter
(Klasse 9, Einträge aus klasse9_audio.py: britisch Mr. Alex, amerikanisch Jeremy).
Texte: WELTEN und CAMEO in app/klasse9/runner.js (einzige Quelle). Ziele: app/klasse9/audio/runner/<welt>_<art>.mp3,
app/audio/runner/westminster_<art>.mp3, app/audio/runner/cameo_<held>.mp3, app/klasse9/audio/beae/w_<id>_<be|ae>.mp3.
Vorhandene Dateien werden nie überschrieben. Obergrenze je Lauf: GRENZE Zeichen (sonst wird nichts vertont).
Aufruf: python3 werkzeuge/runner_audio.py --zaehlen   (nur zählen)
        python3 werkzeuge/runner_audio.py             (erzeugen, danach daten_bauen.py und klasse9_bauen.py)
"""
import json, os, re, sys, urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

BASIS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP6, APP9 = os.path.join(BASIS, "app"), os.path.join(BASIS, "app", "klasse9")
ENGINE = os.path.join(APP9, "runner.js")
GRENZE = 2500
WELTEN9, WELTEN6 = ("ny", "route66", "az", "sd", "ca"), ("westminster", "londoneye", "towerbridge")   # Klasse 6: Welt 2 London Eye + Welt 3 Tower Bridge (31.10.) kennt das Skript, Dateien noch nicht da
ARTEN = ("banner", "richtig", "falsch", "start", "ende")
JUNGEN, MAEDCHEN = ("leo", "kenji", "felix", "max"), ("camilla", "ellie", "olivia", "zara", "penny", "tessa")
CAMEO_STIMME = {h: ("m1", "m2")[i % 2] for i, h in enumerate(JUNGEN)} | {h: ("f1", "f2")[i % 2] for i, h in enumerate(MAEDCHEN)}


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
            liste.append((9, APP9, f"audio/runner/{w}_{art}.mp3", {"start": "m", "ende": "f"}.get(art, "alex"), welten[w][art]))
    for w in WELTEN6:
        for art in ARTEN:
            liste.append((6, APP6, f"audio/runner/{w}_{art}.mp3", {"start": "m1", "ende": "f1"}.get(art, "en"), welten[w][art]))
    for h in JUNGEN + MAEDCHEN:
        liste.append((6, APP6, f"audio/runner/cameo_{h}.mp3", CAMEO_STIMME[h], cameo[h]))
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
    offen = [x for x in auftraege() if not os.path.exists(os.path.join(x[1], x[2]))]
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


if __name__ == "__main__":
    main()
