"""Erzeugt fehlende Audios der Französisch-App mit ElevenLabs (Eleven v4).

Dialoge: je Zeile eine Datei, A = Jules, B = Cécile (gleicher Satz + gleiche Stimme = eine Datei).
Namen (Prononciation), Paris-Orte, Paris-Run-Zurufe und -Wörter: Mr. Alex' eigene Stimme; Paris-Run-Cameos: Heldenstimmen.
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
# Aussprache-Hilfen (7.11., Mr. Alex): stummes H bei „Hugo“ – sonst spricht die Stimme ein H
SPRECH = {"hugo": "Victor Ugo", "ekitike": "Ugo Ekitiké", "t_hernandez": "Théo Ernandez", "l_hernandez": "Lucas Ernandez",
          "metz": "Messe", "olise": "Maïkeul Olisse", "gusto": "Malo Gusteau", "kone": "Manue Koné", "rabiot": "Àdrien Rabiot"}  # 8.11. (Mr. Alex: „Mess“ [mɛs]) – neu vertont 8.11.
TAGS = [(re.compile(r"^Ha ha"), "[laughs] Ha ha"), (re.compile(r"« La la la laaaa"), "[sings] « La la la laaaa"), (re.compile(r"^Chut"), "[whispers] Chut")]


def sprechen(stimme, text, ziel):
    # Helden (7.11.): eigene Stimme je Held (Voice-ID direkt aus helden.tsv), Stabilität 0,3 wie die Klasse-6-Helden
    held = stimme.startswith("held:")
    body = json.dumps({"text": text, "model_id": "eleven_v4", "language_code": "fr", "voice_settings": {"stability": 0.3, "similarity_boost": 0.75} if held else EINSTELLUNG}).encode()
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{stimme[5:] if held else STIMMEN[stimme]}?output_format=mp3_44100_128",
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
    # Lob und Rückmeldungen (8.11., Mr. Alex): inhalte/franz/lob.tsv, seine Stimme mit [French]; starke Sprüche begeistert, Spiel-Sprüche gespielt verzweifelt
    for z in fb.tsv("lob.tsv"):
        tag = "[French] [excited] " if z["art"] in ("stark", "geschafft", "voll", "doch", "feuer3", "feuer6", "feuer9", "feuer", "wochenende", "ferien", "woche", "monat") else "[French] [exasperated] " if z["art"] == "spiel" else "[French] "
        yield "alex", tag + z["text"], f"audio/lob/{z['id']}.mp3"
    for wer in ("A", "B"):  # Parle de toi (8.11.): Satzstücke und Chips einzeln, Jules (A) und Cécile (B); die App spielt sie hintereinander
        for x in fb.parle_stuecke():
            yield wer, x, fb.parle_name(wer, x)
    tags_h = {z["id"]: z["tags"] for z in fb.tsv("helden.tsv")}
    for stimme, text, rel in fb.saetze():  # 8.11.: Wendungen (Held mit eigener Stimme + Tag) und feste Sätze statt Geräte-Stimme
        held = rel.split("/")[-1].split("_")[1] if stimme.startswith("held:") else None
        yield stimme, (f"{tags_h.get(held, '')} {text}".strip() if held else "[French] " + text), rel
    for z in fb.tsv("namen.tsv"):
        yield "alex", "[French] " + SPRECH.get(z["id"], z["name"]) + ".", f"audio/namen/{z['id']}.mp3"  # 7.11. (Mr. Alex): Tag [French] erzwingt französische Aussprache (sonst z. B. „Kylian“ englisch)
    for z in fb.tsv("paris.tsv"):  # Paris-Karte: Text des Orts, Mr. Alex' Stimme (römische Zahl ausgeschrieben)
        yield "alex", "[French] " + z["fr"].replace("Louis XIV", "Louis quatorze"), f"audio/paris/{z['id']}.mp3"
    for z in fb.tsv("france.tsv"):  # Frankreich-Karte (8.11.): Text des Orts wie Paris; Metz = „Mess“ [mɛs], Zahl mit Leerzeichen ausgeschrieben
        yield "alex", "[French] " + z["fr"].replace("Metz", "Messe").replace("3 000", "trois mille"), f"audio/france/{z['id']}.mp3"
    for z in fb.tsv("helden.tsv"):  # Superhelden: Selbstvorstellung mit Tag passend zum Charakter
        yield "held:" + z["stimme"], f"{z['tags']} {z['intro_fr']}", f"audio/helden/intro_{z['id']}.mp3"
    tags = {z["id"]: z["tags"] for z in fb.tsv("helden.tsv")}
    for gruppe, key, text, rel, stimme in fb.paris_runner():  # Paris Run (7.11.): Zurufe/Hinweise/Boss Mr. Alex mit [French], Cameo-Sätze mit Heldenstimme + Tag
        yield stimme, (f"{tags.get(key, '')} {text}".strip() if gruppe == "cameo" else "[French] " + text), rel
    for _, _, text, rel, stimme in fb.disco_runner():  # Disco Run Französisch (7.11.): Mr. Alex, übertrieben wie im englischen Disco Run
        yield stimme, "[French] [excited] " + text, rel
    for z in fb.tsv("woerter.tsv"):  # Wörter für den Paris Run: Mr. Alex' Stimme
        yield "alex", "[French] " + z["fr"] + ".", fb.audio_name("alex", z["fr"])


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
