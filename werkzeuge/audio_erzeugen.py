"""Erzeugt die Audios zu inhalte/kernsaetze.tsv mit ElevenLabs und schreibt docs/sprechtexte.md.

Vorhandene Dateien werden nicht überschrieben (eigene Aufnahmen bleiben erhalten).
Neu erzeugen: Datei löschen und Skript erneut starten.
Spalte "tempo" (optional): eigenes Sprechtempo für die Zeile, 0.7 bis 1.2 (Standard 0.9).
Aufruf: python3 werkzeuge/audio_erzeugen.py
"""
import csv, json, os, re, urllib.request, urllib.error

BASIS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TSV = os.path.join(BASIS, "inhalte", "kernsaetze.tsv")
AUDIO = os.path.join(BASIS, "audio", "kernsaetze")
LISTE = os.path.join(BASIS, "docs", "sprechtexte.md")

# Festgelegt am 10.10.2026 nach der Hörprobe
STIMMEN = {
    "en_m": ("5sxKKBj5y1Bji6769iwE", "en", "Elrond – junge britische Männerstimme"),
    "en_f": ("Xb7hH8MSUJpSbSDYk0k2", "en", "Alice – britische Frauenstimme"),
    "de":   ("onwK4e9ZLuTAKqWW03F9", "de", "Daniel – deutsche Stimme"),
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
    liste, neu, fehler = [], 0, 0
    for z in zeilen:
        aufgaben = []
        if z["englisch"]:
            text = z["englisch_gesprochen"] or z["englisch"].replace("[", "").replace("]", "")
            aufgaben += [("en_m", "en", text), ("en_f", "en", text)]
        if z["deutsch"]:
            aufgaben.append(("de", "de", z["deutsch_gesprochen"] or z["deutsch"]))
        for stimme, sprache, text in aufgaben:
            name = f"{z['id']}_{stimme}.mp3"
            ziel = os.path.join(AUDIO, name)
            liste.append((name, STIMMEN[stimme][2].split(" – ")[0], re.sub(r"\s*<break[^>]*/>", " …", text)))
            if os.path.exists(ziel):
                continue
            try:
                sprechen(stimme, sprache, text, ziel, float(z["tempo"]) if z.get("tempo") else None)
                neu += 1
                print("neu:", name)
            except urllib.error.HTTPError as e:
                fehler += 1
                print("FEHLER:", name, e.code, e.read()[:200])
    with open(LISTE, "w", encoding="utf-8") as f:
        f.write("# Sprechtexte (Kernsätze)\n\n")
        f.write("Automatisch erzeugt aus `inhalte/kernsaetze.tsv` durch `werkzeuge/audio_erzeugen.py`.\n\n")
        f.write("**Eigene Aufnahme:** Datei als MP3 mit genau diesem Namen in `audio/kernsaetze/` ablegen. "
                "Sie ersetzt dann das KI-Audio.\n\n")
        f.write("Stimmen: " + "; ".join(v[2] for v in STIMMEN.values()) + ".\n\n")
        f.write("| Datei | Stimme | Sprechtext |\n|---|---|---|\n")
        for name, stimme, text in liste:
            f.write(f"| `{name}` | {stimme} | {text} |\n")
    print(f"{neu} neu, {fehler} Fehler, {len(liste)} Dateien in der Liste")


if __name__ == "__main__":
    main()
