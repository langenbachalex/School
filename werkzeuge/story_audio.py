"""Vertont die Geschichten des London Run (Story-Modus, Klasse 6) mit Mr. Alex' Stimme (ElevenLabs, Eleven v4).

Quelle: alle Welten in STORY in app/app.js (Text wörtlich wie in docs/runner/story-london-0n.md). Ziel: app/audio/story/<welt>_<key>.mp3 (Präfix = Welt-Id),
dazu je Welt <welt>_sofar.mp3 („The story so far.“). Vorhandene Dateien werden nicht überschrieben.
Aufruf: python3 werkzeuge/story_audio.py [--zaehlen] [--welt westminster|londoneye|towerbridge|tube]   (Welt 4 „tube“: Vertonung erst nach dem 13.11.)
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

BASIS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZIEL = os.path.join(BASIS, "app", "audio", "story")


def welten():
    """Welt-Ids aus STORY in app/app.js (Reihenfolge wie dort)."""
    js = open(os.path.join(BASIS, "app", "app.js"), encoding="utf-8").read()
    block = js[js.index("const STORY = {"):js.index("const STORY_PUNKTE")]
    return block, re.findall(r"\n    (\w+): \{ id: \"(?:\w+)\"", block)


def stuecke(nur=None):
    block, ids = welten()
    for welt in ids:
        if nur and welt != nur:
            continue
        rest = block[block.index(f"    {welt}: {{ id: \"{welt}\""):]
        teil = rest[rest.index("teile: {"):]
        teil = teil[:re.search(r"\n\s+(?://|audio:)", teil).start()]   # bis zur Audio-Zeile (bzw. ihrem Kommentar)
        for key, text in re.findall(r"\"?(\w+)\"?: \"((?:[^\"\\]|\\.)*)\"", teil):
            yield welt, key, text.replace('\\"', '"')
        yield welt, "sofar", "The story so far."


def main():
    nur_zaehlen = "--zaehlen" in sys.argv
    nur = sys.argv[sys.argv.index("--welt") + 1] if "--welt" in sys.argv else None
    os.makedirs(ZIEL, exist_ok=True)
    alle = list(stuecke(nur))
    offen = [(w, k, t) for w, k, t in alle if not os.path.exists(os.path.join(ZIEL, f"{w}_{k}.mp3"))]
    print(f"{len(alle)} Stücke, {len(offen)} offen, {sum(len(t) for _, _, t in offen)} Zeichen offen")
    for w in dict.fromkeys(x[0] for x in alle):
        o = [x for x in offen if x[0] == w]
        print(f"  {w}: {len([x for x in alle if x[0] == w])} Stücke, {len(o)} offen, {sum(len(t) for _, _, t in o)} Zeichen")
    if nur_zaehlen:
        for w, k, t in offen: print(f"  {w}_{k} ({len(t)}): {t}")
        return
    import audio_erzeugen
    for w, k, t in offen:
        audio_erzeugen.sprechen("en", "en", t, os.path.join(ZIEL, f"{w}_{k}.mp3"))
        print("  ✓", f"{w}_{k}", t)


if __name__ == "__main__":
    main()
