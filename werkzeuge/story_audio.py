"""Vertont die Geschichten des London Run (Story-Modus) mit Mr. Alex' Stimme (ElevenLabs, Eleven v4).

Quelle: STORY in app/app.js (Text wörtlich wie in docs/runner/story-london-01.md). Ziel: app/audio/story/<welt>_<key>.mp3.
Vorhandene Dateien werden nicht überschrieben. Aufruf: python3 werkzeuge/story_audio.py [--zaehlen]
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import audio_erzeugen

BASIS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZIEL = os.path.join(BASIS, "app", "audio", "story")


def stuecke():
    js = open(os.path.join(BASIS, "app", "app.js"), encoding="utf-8").read()
    block = js[js.index("const STORY = {"):js.index("const STORY_PUNKTE")]
    for welt in re.findall(r"\n    (\w+): \{ id: \"\w+\"", block):
        teil = block[block.index(f"    {welt}: {{"):]
        teil = teil[teil.index("teile: {"):teil.index("},\n")]
        for key, text in re.findall(r"(\w+): \"([^\"]+)\"", teil):
            yield welt, key, text
        yield welt, "sofar", "The story so far."


def main():
    nur_zaehlen = "--zaehlen" in sys.argv
    os.makedirs(ZIEL, exist_ok=True)
    offen = [(w, k, t) for w, k, t in stuecke() if not os.path.exists(os.path.join(ZIEL, f"{w}_{k}.mp3"))]
    print(f"{len(offen)} Stücke offen, {sum(len(t) for _, _, t in offen)} Zeichen")
    if nur_zaehlen:
        for w, k, t in offen: print(f"  {w}_{k}: {t}")
        return
    for w, k, t in offen:
        audio_erzeugen.sprechen("en", "en", t, os.path.join(ZIEL, f"{w}_{k}.mp3"))
        print("  ✓", f"{w}_{k}", t)


if __name__ == "__main__":
    main()
