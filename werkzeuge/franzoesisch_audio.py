"""Audios für die Französisch-App – nur Mr. Alex' eigene Stimme, auf Französisch (Hörprobe 13.10. freigegeben:
docs/franzoesisch/hoerprobe/alex_fr_1.mp3). Vorhandene Dateien bleiben erhalten (eigene Aufnahmen auch).
Aufruf:  python3 werkzeuge/franzoesisch_audio.py --zaehlen   (nur Zeichen zählen, keine Credits)
         python3 werkzeuge/franzoesisch_audio.py            (erzeugen, danach franzoesisch_bauen.py)
"""
import json, os, sys, urllib.request, urllib.error

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import franzoesisch_bauen as fb

# Mr. Alex' Klon „Alex Langenbach“ – nur mit Eleven v4; language_code fr macht daraus Französisch
STIMME, MODELL = "AK2WYGe96RmMwFKM5KEz", "eleven_v4"
EINSTELLUNGEN = {"stability": 0.5, "similarity_boost": 0.75}
# Aurélien (Rolle B in den Dialogen): zweite männliche französische Stimme aus der ElevenLabs-Bibliothek.
# None = noch nicht gewählt (Hörproben: docs/franzoesisch/hoerprobe/aurelien_*.mp3); dann werden B-Zeilen übersprungen.
AURELIEN = ("eOwAMwUJEGkP44SKOXIH", "eleven_multilingual_v2")  # Julien – Professional (gewählt 13.10.)


def auftraege():
    liste = []
    for t in fb.THEMEN:
        for z in fb.tsv(t["datei"]):
            wid = z["id"]
            liste.append((f"audio/wendungen/{wid}.mp3", z["wendung"]))
            liste.append((f"audio/saetze/{wid}.mp3", z["satz_fr"]))
            if z["passe_compose"]:
                liste.append((f"audio/saetze/{wid}_pc.mp3", z["passe_compose"]))
                liste.append((f"audio/saetze/{wid}_fp.mp3", z["futur_proche"]))
    for z in fb.tsv("dialoge.tsv"):
        liste.append((f"audio/dialoge/{z['id']}.mp3", z["fr"], "alex" if z["rolle"] == "A" else "aurelien"))
    for z in fb.tsv("lob.tsv"):
        liste.append((f"audio/lob/{z['id']}.mp3", z["text"]))
    for k, t in fb.SPIEL_TEXTE.items():
        liste.append((f"audio/spiel/{k}.mp3", t))
    for i, (_, name, _) in enumerate(fb.TITEL):
        if i:
            liste.append((f"audio/spiel/titel_{i}.mp3", f"Félicitations ! Tu es maintenant {name} !"))
    return liste


def main():
    offen = [a for a in auftraege() if not os.path.exists(os.path.join(fb.APP, a[0]))]
    offen = [a for a in offen if len(a) < 3 or a[2] == "alex" or AURELIEN]
    print(len(offen), "Audios fehlen,", sum(len(a[1]) for a in offen), "Zeichen")
    if "--zaehlen" in sys.argv:
        return
    neu = fehler = 0
    for pfad, text, *rest in offen:
        ziel = os.path.join(fb.APP, pfad)
        os.makedirs(os.path.dirname(ziel), exist_ok=True)
        if rest and rest[0] == "aurelien":
            stimme, modell = AURELIEN
            body = json.dumps({"text": text, "model_id": modell, "voice_settings": EINSTELLUNGEN}).encode()
        else:
            stimme = STIMME
            body = json.dumps({"text": text, "model_id": MODELL, "language_code": "fr", "voice_settings": EINSTELLUNGEN}).encode()
        req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{stimme}?output_format=mp3_44100_128",
                                     data=body, headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req) as r:
                daten = r.read()
            with open(ziel, "wb") as f:
                f.write(daten)
            neu += 1
        except urllib.error.HTTPError as e:
            fehler += 1
            print("FEHLER:", pfad, e.code, e.read()[:200])
            if e.code in (401, 402, 429):
                break
    print(neu, "neu,", fehler, "Fehler")


if __name__ == "__main__":
    main()
