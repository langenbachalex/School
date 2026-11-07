"""Erzeugt fehlende Audios der Französisch-App mit ElevenLabs (Eleven v4).

Dialoge: je Zeile eine Datei, A = Jules, B = Cécile (gleicher Satz + gleiche Stimme = eine Datei).
Namen (Prononciation): Mr. Alex' eigene Stimme.
Vorhandene Dateien bleiben. Neu erzeugen: Datei löschen. Danach werkzeuge/franz_bauen.py laufen lassen.
Aufruf: python3 werkzeuge/franz_audio.py [--zaehlen]
"""
import json, os, re, sys, time, urllib.request, urllib.error

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import franz_bauen as fb

STIMMEN = {"A": "8qnuneLiGjGrT4A62CCe",   # Jules – conversational
           "B": "yatuMX0k4Dh41R64sbGj",   # Cécile
           "alex": "AK2WYGe96RmMwFKM5KEz"}  # Mr. Alex
EINSTELLUNG = {"stability": 0.5, "similarity_boost": 0.75}
TAGS = [(re.compile(r"^Ha ha"), "[laughs] Ha ha"), (re.compile(r"« La la la laaaa"), "[sings] « La la la laaaa"), (re.compile(r"^Chut"), "[whispers] Chut")]


def sprechen(stimme, text, ziel):
    body = json.dumps({"text": text, "model_id": "eleven_v4", "language_code": "fr", "voice_settings": EINSTELLUNG}).encode()
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{STIMMEN[stimme]}?output_format=mp3_44100_128",
                                 data=body, headers={"Content-Type": "application/json", "xi-api-key": "dummy"})
    with urllib.request.urlopen(req, timeout=120) as r:
        daten = r.read()
    os.makedirs(os.path.dirname(ziel), exist_ok=True)
    with open(ziel, "wb") as f:
        f.write(daten)


def auftraege():
    for z in fb.tsv("dialoge.tsv"):
        text = fb.ohne_klammern(z["fr"])
        for muster, ersatz in TAGS:
            text = muster.sub(ersatz, text, count=1)
        yield z["wer"], text, fb.audio_name(z["wer"], z["fr"])
    for z in fb.tsv("namen.tsv"):
        yield "alex", z["name"] + ".", f"audio/namen/{z['id']}.mp3"


def main():
    offen, gesehen = [], set()
    for stimme, text, rel in auftraege():
        if rel in gesehen or os.path.exists(os.path.join(fb.APP, rel)):
            continue
        gesehen.add(rel)
        offen.append((stimme, text, rel))
    print(f"{len(offen)} Dateien fehlen, {sum(len(t) for _, t, _ in offen)} Zeichen")
    if "--zaehlen" in sys.argv:
        return
    for stimme, text, rel in offen:
        for versuch in range(3):
            try:
                sprechen(stimme, text, os.path.join(fb.APP, rel))
                print("ok", rel, text)
                break
            except urllib.error.HTTPError as e:
                print("Fehler", e.code, e.read()[:200])
                if e.code in (400, 401, 403):
                    return
                time.sleep(5 * (versuch + 1))


if __name__ == "__main__":
    main()
