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

# Stimmen (Stand 10.10.2026): Englisch nur noch eine Stimme – Mr. Alex' eigene Stimme.
# Weibliche Personen in Hörtexten sprechen mit Alice. Keine deutschen Audios mehr.
STIMMEN = {
    # Mr. Alex' eigene Stimme – funktioniert nur mit Eleven v4 (mit v2/flash/turbo: Serverfehler 500, mit v3: klingt fremd)
    "en":   ("AK2WYGe96RmMwFKM5KEz", "en", "Alex Langenbach – Mr. Alex' eigene Stimme"),
    "en_f": ("Xb7hH8MSUJpSbSDYk0k2", "en", "Alice – britische Frauenstimme (weibliche Personen in Hörtexten)"),
}
# Modell und Einstellungen je Stimme (Alex: wie auf der ElevenLabs-Webseite eingestellt)
MODELLE = {
    "en":   ("eleven_v4", {"stability": 0.5, "similarity_boost": 0.75}),
    "en_f": ("eleven_multilingual_v2", {"stability": 0.6, "similarity_boost": 0.75, "speed": 0.9}),
}
ERSATZ = ("JBFqnCBsd6RMkjVDRZzb", "en", "George – britische Männerstimme (Ersatz)")
MODELL = "eleven_multilingual_v2"
EINSTELLUNGEN = {"stability": 0.6, "similarity_boost": 0.75, "speed": 0.9}


def sprechen(stimme, sprache, text, ziel, tempo=None):
    try:
        return _sprechen(STIMMEN[stimme][0], sprache, text, ziel, tempo, *MODELLE[stimme])
    except urllib.error.HTTPError as e:
        body = e.read()
        # Eigene (geklonte) Stimme im Tarif nicht erlaubt -> dauerhaft auf George umstellen
        if stimme == "en" and e.code in (401, 403) and b"quota" not in body:
            print("Stimme Alex nicht verfügbar – nehme George.", body[:160])
            STIMMEN["en"] = ERSATZ
            return _sprechen(ERSATZ[0], sprache, text, ziel, tempo, MODELL, EINSTELLUNGEN)
        raise urllib.error.HTTPError(e.url, e.code, e.msg, e.hdrs, __import__("io").BytesIO(body))


def _sprechen(voice_id, sprache, text, ziel, tempo, modell, einstellungen):
    body = json.dumps({"text": text, "model_id": modell,
                       "voice_settings": {**einstellungen, **({"speed": tempo} if tempo else {})}}).encode()
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
            auftraege.append(("kernsaetze", f"{z['id']}_en", "en", "en", text, tempo))
    with open(os.path.join(BASIS, "inhalte", "vokabeln.tsv"), encoding="utf-8") as f:
        for v in csv.DictReader(f, delimiter="\t"):
            auftraege.append(("vokabeln", f"{v['id']}_en", "en", "en", v["englisch_gesprochen"], None))
    # Lob und Rückmeldungen (Mr. Alex' eigene Stimme)
    with open(os.path.join(BASIS, "inhalte", "lob.tsv"), encoding="utf-8") as f:
        for z in csv.DictReader(f, delimiter="\t"):
            auftraege.append(("lob", z["id"], "en", "en", z["text"], None))
    for u in hoeren.lesen():
        for t in u["teile"]:
            auftraege.append(("hoeren", t["datei"], "en_f" if t["stimme"] == "en_f" else "en", "en", t["sprech"], None))
        for a in u["aufgaben"]:
            if "datei" in a:
                auftraege.append(("hoeren", a["datei"], "en", "en", a["sprech"], None))

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
