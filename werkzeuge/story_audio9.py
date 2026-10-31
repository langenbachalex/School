"""Vertont die Story „The Lost Map“ (Road Trip Run, Klasse 9) mit verteilten Stimmen (ElevenLabs).

Erzähler = Mr. Alex (alex). Wörtliche Rede: Maya und die Frau mit dem Kompass = Jessica (f), Jayden, Lucas und der Ritter = Jeremy (m).
Ein Stück mit nur einer Stimme → app/klasse9/audio/story/ny_<key>.mp3; mit Wechsel → ny_<key>_1.mp3, _2.mp3 … (die App spielt sie hintereinander).
Quelle der Texte: STORY.ny in app/klasse9/app.js. Vorhandene Dateien werden nicht überschrieben.
Aufruf: python3 werkzeuge/story_audio9.py [--zaehlen]
"""
import json, os, re, sys, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import klasse9_audio as ka
import klasse9_bauen as k9

ZIEL = os.path.join(k9.APP, "audio", "story")
# Wer spricht die wörtliche Rede je Stück (Reihenfolge der Anführungszeichen-Passagen)? Fehlt ein Eintrag: alles Erzähler.
SPRECHER = {"A7": ["f"], "B9": ["m"], "B10": ["f"], "12": ["f", "f"], "13": ["m"], "X16": ["f"], "Y16": ["f"],
            "X20": ["m"], "Y20": ["m"], "R2": ["m"], "R3": ["m", "m"]}
# Y15 („No, thanks.“ = der Spieler) und Y19 (Stimme aus dem Licht) spricht der Erzähler.


def stuecke():
    js = open(os.path.join(k9.APP, "app.js"), encoding="utf-8").read()
    block = js[js.index("const STORY = {"):js.index("const STORY_PUNKTE")]
    teil = block[block.index("teile: {"):block.index("audio:")]
    for key, text in re.findall(r"(\w+): \"((?:[^\"\\]|\\.)*)\"", teil):
        yield key, text.replace('\\"', '"')
    yield "sofar", "The story so far."


def segmente(key, text):
    """Teilt in (stimme, text) – wörtliche Rede an die Figur, der Rest an den Erzähler."""
    rollen = SPRECHER.get(key)
    if not rollen:
        return [("alex", text)]
    teile, i, rest = [], 0, text
    for m in re.finditer(r'"[^"]+"', text):
        davor = text[i:m.start()].strip(" ")
        if davor: teile.append(("alex", davor))
        teile.append((rollen[min(len(teile) and sum(1 for t in teile if t[0] != "alex") or 0, len(rollen) - 1)], m.group(0).strip('"')))
        i = m.end()
    danach = text[i:].strip(" ")
    if danach: teile.append(("alex", danach))
    # zusammenhängende Erzähler-Teile wie „she said.“ bleiben eigene Dateien (kurz, aber in der richtigen Reihenfolge)
    return teile


def main():
    plan = []
    for key, text in stuecke():
        seg = segmente(key, text)
        if len(seg) == 1:
            plan.append((f"ny_{key}.mp3", seg[0][0], seg[0][1]))
        else:
            for n, (st, t) in enumerate(seg, 1):
                plan.append((f"ny_{key}_{n}.mp3", st, t))
    offen = [p for p in plan if not os.path.exists(os.path.join(ZIEL, p[0]))]
    print(f"{len(offen)} Dateien offen, {sum(len(t) for _, _, t in offen)} Zeichen")
    for datei, st, t in offen: print(f"  {st:4} {datei:14} {t}")
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
