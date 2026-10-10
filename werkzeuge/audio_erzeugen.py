"""Erzeugt die Audios zu inhalte/kernsaetze.tsv mit ElevenLabs und schreibt docs/sprechtexte.md.

Vorhandene Dateien werden nicht überschrieben (eigene Aufnahmen bleiben erhalten).
Neu erzeugen: Datei löschen und Skript erneut starten.
Spalte "tempo" (optional): eigenes Sprechtempo für die Zeile, 0.7 bis 1.2 (Standard 0.9).
Aufruf: python3 werkzeuge/audio_erzeugen.py
"""
import csv, json, os, re, urllib.request, urllib.error

import hoeren

BASIS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TSV = os.path.join(BASIS, "inhalte", "kernsaetze.tsv")
AUDIO_BASIS = os.path.join(BASIS, "app", "audio")
AUDIO = os.path.join(AUDIO_BASIS, "kernsaetze")
LISTE = os.path.join(BASIS, "docs", "sprechtexte.md")

# Festgelegt am 10.10.2026 nach der Hörprobe
STIMMEN = {
    "en_m": ("5sxKKBj5y1Bji6769iwE", "en", "Elrond – junge britische Männerstimme"),
    "en_f": ("Xb7hH8MSUJpSbSDYk0k2", "en", "Alice – britische Frauenstimme"),
    "de":   ("onwK4e9ZLuTAKqWW03F9", "de", "Daniel – deutsche Stimme"),
    "en_g": ("JBFqnCBsd6RMkjVDRZzb", "en", "George – britische Männerstimme (Vokabeln)"),
}
MODELL = "eleven_multilingual_v2"
EINSTELLUNGEN = {"stability": 0.6, "similarity_boost": 0.75, "speed": 0.9}


def sprechen(stimme, sprache, text, ziel, tempo=None):
    voice_id = STIMMEN[stimme][0]
    body = json.dumps({"text": text, "model_id": MODELL, "language_code": sprache,
                       "voice_settings": {**EINSTELLUNGEN, **({"speed": tempo} if tempo else {})}}).encode()
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128",
        data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r:
        data = r.read()
    with open(ziel, "wb") as f:
        f.write(data)


def main():
    os.makedirs(AUDIO, exist_ok=True)
    with open(TSV, encoding="utf-8") as f:
        zeilen = list(csv.DictReader(f, delimiter="\t"))
    # Aufträge: (Unterordner, Dateiname ohne Endung, Stimme, Sprache, Sprechtext, Tempo)
    auftraege = []
    for z in zeilen:
        tempo = float(z["tempo"]) if z.get("tempo") else None
        if z["englisch"]:
            text = z["englisch_gesprochen"] or z["englisch"].replace("[", "").replace("]", "")
            auftraege += [("kernsaetze", f"{z['id']}_en_m", "en_m", "en", text, tempo),
                          ("kernsaetze", f"{z['id']}_en_f", "en_f", "en", text, tempo)]
        if z["deutsch"]:
            auftraege.append(("kernsaetze", f"{z['id']}_de", "de", "de", z["deutsch_gesprochen"] or z["deutsch"], tempo))
    with open(os.path.join(BASIS, "inhalte", "vokabeln.tsv"), encoding="utf-8") as f:
        for v in csv.DictReader(f, delimiter="\t"):
            auftraege += [("vokabeln", f"{v['id']}_en", "en_g", "en", v["englisch_gesprochen"], None),
                          ("vokabeln", f"{v['id']}_de", "de", "de", v["deutsch_gesprochen"], None)]
    for u in hoeren.lesen():
        for t in u["teile"]:
            auftraege.append(("hoeren", t["datei"], t["stimme"], "en", t["sprech"], None))
        for a in u["aufgaben"]:
            if "datei" in a:
                auftraege.append(("hoeren", a["datei"], "en_m", "en", a["sprech"], None))

    liste, neu, fehler = [], 0, 0
    for ordner, datei, stimme, sprache, text, tempo in auftraege:
        os.makedirs(os.path.join(AUDIO_BASIS, ordner), exist_ok=True)
        ziel = os.path.join(AUDIO_BASIS, ordner, datei + ".mp3")
        liste.append((f"{ordner}/{datei}.mp3", STIMMEN[stimme][2].split(" – ")[0],
                      re.sub(r"\s*<break[^>]*/>", " …", text)))
        if os.path.exists(ziel):
            continue
        try:
            sprechen(stimme, sprache, text, ziel, tempo)
            neu += 1
            print("neu:", ordner, datei)
        except urllib.error.HTTPError as e:
            fehler += 1
            print("FEHLER:", datei, e.code, e.read()[:200])
    with open(LISTE, "w", encoding="utf-8") as f:
        f.write("# Sprechtexte\n\n")
        f.write("Automatisch erzeugt aus `inhalte/kernsaetze.tsv`, `inhalte/vokabeln.tsv` und `inhalte/hoeren/` durch `werkzeuge/audio_erzeugen.py`.\n\n")
        f.write("**Eigene Aufnahme:** Datei als MP3 mit genau diesem Namen in `app/audio/` (im angegebenen Unterordner) "
                "ablegen. Sie ersetzt dann das KI-Audio.\n\n")
        f.write("Stimmen: " + "; ".join(v[2] for v in STIMMEN.values()) + ".\n\n")
        f.write("| Datei | Stimme | Sprechtext |\n|---|---|---|\n")
        for name, stimme, text in liste:
            f.write(f"| `{name}` | {stimme} | {text} |\n")
    print(f"{neu} neu, {fehler} Fehler, {len(liste)} Dateien in der Liste")


if __name__ == "__main__":
    main()
