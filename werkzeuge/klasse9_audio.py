"""Audios für die App Klasse 9 (amerikanische Stimmen, abwechselnd Mann/Frau).
Vorhandene Dateien bleiben erhalten (eigene Aufnahmen auch). Lob kommt aus Klasse 6 (Mr. Alex' Stimme).
Aufruf:  python3 werkzeuge/klasse9_audio.py --zaehlen   (nur Zeichen zählen, keine Credits)
         python3 werkzeuge/klasse9_audio.py            (erzeugen, danach klasse9_bauen.py)
"""
import json, os, sys, urllib.request, urllib.error

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import klasse9_bauen as k9

STIMMEN = {"m": "btaSeNTVh1pGx4pjFzub",  # Jeremy B. – Casual, Warm, Natural
           "f": "cgSgspJ2msm6clMCkdW9"}  # Jessica – Playful, Bright, Warm
MODELL, EINSTELLUNGEN = "eleven_multilingual_v2", {"stability": 0.5, "similarity_boost": 0.75}


def sprechtext(t):
    return t.replace("(AE)", "").replace("(BE)", "").replace("(infml)", "").replace("sth.", "something").replace("sb.", "somebody").strip()


def auftraege():
    liste, stimme = [], 0
    for z in k9.tsv("saetze.tsv"):
        liste.append((f"audio/saetze/{z['id']}.mp3", "mf"[stimme % 2], z["englisch"])); stimme += 1
    for v in k9.tsv("vokabeln.tsv"):
        s = "mf"[stimme % 2]; stimme += 1
        liste.append((f"audio/vokabeln/{v['id']}.mp3", s, sprechtext(v["englisch"])))
        liste.append((f"audio/vokabeln/{v['id']}_s.mp3", s, v["satz_en"]))
    return liste


def main():
    offen = [a for a in auftraege() if not os.path.exists(os.path.join(k9.APP, a[0]))]
    print(len(offen), "Audios fehlen,", sum(len(a[2]) for a in offen), "Zeichen")
    if "--zaehlen" in sys.argv:
        return
    neu = fehler = 0
    for pfad, stimme, text in offen:
        ziel = os.path.join(k9.APP, pfad)
        os.makedirs(os.path.dirname(ziel), exist_ok=True)
        body = json.dumps({"text": text, "model_id": MODELL, "voice_settings": EINSTELLUNGEN}).encode()
        req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{STIMMEN[stimme]}?output_format=mp3_44100_128",
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
