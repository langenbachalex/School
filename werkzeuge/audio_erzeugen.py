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
    "en_alex": ("AK2WYGe96RmMwFKM5KEz", "en", "Mr. Alex – Zurufe im Runner (7.11.2026, v4 mit Audio-Tags, Stabilität 0,4 für etwas mehr Ausdruck)"),
    "en_f": ("Xb7hH8MSUJpSbSDYk0k2", "en", "Alice – britische Frauenstimme (weibliche Personen in Hörtexten bis 28.10.)"),
    # Jugendstimmen für Hörtexte (Wahl von Mr. Alex, 29.10.2026, Hörprobe docs/klasse6/hoerprobe/jugend): alle Eleven v4.
    # Mr. Alex spricht in Hörtexten nur noch Lehrer/Interviewer "(alex)" und die Lösungs-Aussagen. Archiv: docs/stimmen.md
    "m1":   ("5sxKKBj5y1Bji6769iwE", "en", "Elrond – britisch, jung (1. Junge)"),
    "m2":   ("qxjGnozOAtD4eqNuXms4", "en", "John Shaw – britisch, jung (2. Junge)"),
    "f1":   ("nDJIICjR9zfJExIFeSCN", "en", "Emmaline – britisches Mädchen (1. Mädchen)"),
    "f2":   ("Xb7hH8MSUJpSbSDYk0k2", "en", "Alice – britisch (2. Mädchen)"),
    # Superhelden (7.11.2026, Mr. Alex: jeder Held eine eigene Stimme, v4 mit Audio-Tags und Stabilität 0,3 für viel Ausdruck) – Cameo, Film-Intro und Ausruf
    "h_leo":     ("SOYHLrjzK2X1ezoPC6cr", "en", "Harry – Fierce Warrior (Leo the Lion)"),
    "h_camilla": ("pFZP5JQG7iQjIQuC4Bku", "en", "Lily – Velvety Actress, britisch (Camilla the Camel)"),
    "h_ellie":   ("Xb7hH8MSUJpSbSDYk0k2", "en", "Alice – Clear Educator, britisch (Ellie the Elephant)"),
    "h_olivia":  ("XrExE9yKIg1WjnnlVkGX", "en", "Matilda – Knowledgable (Olivia the Owl)"),
    "h_kenji":   ("IKne3meq5aSn9XLyUdCD", "en", "Charlie – Energetic, australisch (Kenji the Kangaroo)"),
    "h_zara":    ("FGY2WhTYpPnrIDTdsKH5", "en", "Laura – Quirky (Zara the Zebra)"),
    "h_penny":   ("nDJIICjR9zfJExIFeSCN", "en", "Emmaline – young British girl (Penny the Penguin)"),
    "h_felix":   ("TX3LPaxmHKxFdv7VOQHJ", "en", "Liam – Energetic (Felix the Falcon)"),
    "h_tessa":   ("EXAVITQu4vr4xnSDxMaL", "en", "Sarah – Mature, Reassuring (Tessa the Turtle)"),
    "h_max":     ("N2lVS1w4EtoT3dr4eOWO", "en", "Callum – Husky Trickster (Max the Monkey)"),
    # Klasse 9 (7.11.2026, Etappe 2): 13 US-Helden, je eine eigene AMERIKANISCHE Stimme aus der Voice Library (jung, passend zur Rolle; Cameo „Road Trip Run“), immer mit [American accent]
    "h_eddie":     ("6IwYbsNENZgAB1dtBZDp", "en", "Jett – Gritty and Spunky Young Hero, US (Eddie the Eagle, Pilot)"),
    "h_bonnie":    ("qjuLAJDfQb9pT33FphKb", "en", "Mia – Deep Raspy Californian, US (Bonnie the Bison, Rockerin)"),
    "h_gus":       ("dtSEyYGNJqjrtBArPCVZ", "en", "Titan – Deep, Bold, Powerful, US (Gus the Grizzly, Bodyguard)"),
    "h_cody":      ("BAa4mkwD2kJCAJebRztV", "en", "Alpha Texan – leichter Texas-Akzent, jung (Cody the Coyote, Cowboy)"),
    "h_ally":      ("8DzKSPdgEQPaK5vKG0Rs", "en", "Vanessa – Beach Girl, US (Ally the Alligator, Surferin)"),
    "h_rosie":     ("Z3R5wn05IrDiVCyEkUrK", "en", "Arabella – Mysterious and Emotive, US (Rosie the Raccoon, Ninja)"),
    "h_benny":     ("q0IMILNRPxOgtBTS4taI", "en", "Drew – Casual, Curious & Fun, US (Benny the Beaver, Baumeister)"),
    "h_pennypuma": ("XZUXLIpE3dqJ9aCZUj2R", "en", "Kristen – Upbeat, US (Penny the Puma, Parkour)"),
    "h_archie":    ("Zg15Et3nnFl0MqqzwK3w", "en", "Hayden – Southern, Bold and Clear, Texas (Archie the Armadillo, Texas-Cowboy)"),
    "h_molly":     ("TPPp5Y7VlA8wm6T8DFrK", "en", "Sloane Madison – Gen Z, Edgy & Playful, US (Molly the Moose, Punk-Drummerin)"),
    "h_holly":     ("qBDvhofpxp92JgXJxDjB", "en", "Lily Wolff – Expressive and Kind, US (Holly the Hummingbird, Heilerin)"),
    "h_maya":      ("TOXPlnYC7z5SQSV2Zgc5", "en", "Jade – Elegant, Calm, Emotive, US (Maya the Monarch, Gala-Lady)"),
    "h_sunny":     ("5ArfLwnbSFfIMBPFkuFv", "en", "Alanna – Californian, energetic and poppy (Sunny the Songbird, Popstar)"),
}
# Modell und Einstellungen je Stimme (Alex: wie auf der ElevenLabs-Webseite eingestellt)
MODELLE = {
    "en":   ("eleven_v4", {"stability": 0.5, "similarity_boost": 0.75}),
    "en_alex": ("eleven_v4", {"stability": 0.4, "similarity_boost": 0.75}),
    "en_f": ("eleven_multilingual_v2", {"stability": 0.6, "similarity_boost": 0.75, "speed": 0.9}),
    "m1":   ("eleven_v4", {"stability": 0.5, "similarity_boost": 0.75}),
    "m2":   ("eleven_v4", {"stability": 0.5, "similarity_boost": 0.75}),
    "f1":   ("eleven_v4", {"stability": 0.5, "similarity_boost": 0.75}),
    "f2":   ("eleven_v4", {"stability": 0.5, "similarity_boost": 0.75}),
    **{f"h_{h}": ("eleven_v4", {"stability": 0.3, "similarity_boost": 0.75}) for h in ("leo", "camilla", "ellie", "olivia", "kenji", "zara", "penny", "felix", "tessa", "max",
                                                                                     "eddie", "bonnie", "gus", "cody", "ally", "rosie", "benny", "pennypuma", "archie", "molly", "holly", "maya", "sunny")},
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
        if stimme in ("en", "en_alex") and e.code in (401, 403) and b"quota" not in body:
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
    # Word Gym: Beispielsätze für Wörter ohne Kernsatz (inhalte/gym_saetze6.tsv)
    with open(os.path.join(BASIS, "inhalte", "gym_saetze6.tsv"), encoding="utf-8") as f:
        for z in csv.DictReader(f, delimiter="\t"):
            auftraege.append(("gym", f"{z['id']}_en", "en", "en", z["englisch"], None))
    # Lob und Rückmeldungen (Mr. Alex' eigene Stimme)
    with open(os.path.join(BASIS, "inhalte", "lob.tsv"), encoding="utf-8") as f:
        for z in csv.DictReader(f, delimiter="\t"):
            auftraege.append(("lob", z["id"], "en", "en", z["text"], None))
    # Belohnungen: London-Fakten, Superhelden-Steckbriefe, Titel und Serien (alles Mr. Alex)
    import daten_bauen
    for z in daten_bauen.lesen("london.tsv"):
        auftraege.append(("london", z["id"], "en", "en", f"{z['name']}. {z['fakt']}", None))
    for z in daten_bauen.lesen("helden.tsv"):
        auftraege.append(("helden", z["id"], "en", "en", f"{z['name']}. {z['steckbrief']}", None))
    for k, t in daten_bauen.SPIEL_TEXTE.items():
        auftraege.append(("spiel", k, "en", "en", t, None))
    for u in hoeren.lesen():
        for t in u["teile"]:
            auftraege.append(("hoeren", t["datei"], t["stimme"] if t["stimme"] in STIMMEN else "en", "en", t["sprech"], None))
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
