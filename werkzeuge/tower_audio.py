"""Vertont EN6 „The Keys of the Tower“ (ElevenLabs, Eleven v4): Kapitel 1 und die 221 Sprüche.

Quelle: inhalte/abenteuer/tower_kapitel1.tsv, tower_hof_den.tsv und tower_sprueche.tsv, Spalte `regie` – wörtlich, mit allen Tags (Mr. Alex 17.11.).
Nicht vertont: Zeilen ohne Regie und Zeilen mit `nur_text`. Zweitfassung (Spalte `einfach`): die Tags vom Anfang der Regie + der einfache Text.
` || ` in der Regie = zwei Teile, einzeln erzeugt. Taube: Stille am Ende von Teil 1 gekürzt, zusammengesetzt (Teil 1 Tempo 1,2, Teil 2 1,05).
Garys Pannen (Mr. Alex 17.11.): zwei getrennte Dateien <id>_1.mp3 und <id>_2.mp3, damit im Spiel das Geräusch dazwischen passt.
Ziel: app/audio/tower/k1_<id>.mp3, k1_<id>_einfach.mp3, <spruch-id>.mp3 – Lautheit in zwei Durchgängen angeglichen (messen, gezielt verstärken,
Spitzen −1,5 dB): alle −16 LUFS, der Sergeant −14 (Mr. Alex 17.11.). `--lautheit` gleicht alles Vorhandene neu an (0 Credits), `--messen` misst nur.
Vorhandene Dateien werden nie überschrieben; nach einem Abbruch einfach neu starten (bezahlte Rohteile liegen in audio-roh/tower/).
Stimmen und Einstellungen: docs/spiele/keys-of-the-tower-figuren.md, Abschnitt Stimmen.
Aufruf: python3 werkzeuge/tower_audio.py --zaehlen [--liste]      (kostet nichts)
        python3 werkzeuge/tower_audio.py [--nur kapitel|hofden|sprueche] [--figur gary] [--hoechstens 5]
"""
import csv, json, os, re, subprocess, sys, tempfile, time, urllib.request, urllib.error

BASIS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QUELLE = os.path.join(BASIS, "inhalte", "abenteuer")
ZIEL = os.path.join(BASIS, "app", "audio", "tower")
ROH = os.path.join(BASIS, "audio-roh", "tower")                  # unbearbeitete Teile, im Repo gesichert (nicht unter app/, wird nicht veröffentlicht)
PROTOKOLL = os.path.join(QUELLE, "tower_audio_protokoll.tsv")    # Datei · Zeichen · Character-Cost
CREDITS_JE_ZEICHEN = 0.44                                        # gemessen 17.11. (Eleven v4, Tags zählen mit)

ALEX = "AK2WYGe96RmMwFKM5KEz"
ERZAEHLER = "xzWQmpTSWiCLfroVrnh4"   # „Best Narrator“ (Mr. Alex 17.11.: er selbst ist nur noch Mr. Flex); britisch, daher ohne Akzent-Tag
STIMMEN = {  # Figur: (Voice-Id, Tempo)
    "erzaehler": (ERZAEHLER, None), "karte": (ERZAEHLER, None), "mrflex": (ALEX, None),
    "sergeant": ("kVBPcEMsUF1nsAO1oNWw", None),   # Andy (leise -> loudnorm)
    "gary": ("IKne3meq5aSn9XLyUdCD", None),       # Charlie
    "arthur": ("FUdtnSGebmUJVfZnamcB", None),     # Kiel
    "taube": ("YPbk892xlMnFoVOkxyGD", 1.15),      # Blondie
    "tourist": ("btaSeNTVh1pGx4pjFzub", None),    # Jeremy B. (Mr. Alex 18.11., nach Stimmprobe gegen Hayden, Alpha Texan, Drew, Titan); Texas-Regie in der Tabelle
}
TAUBE_TEILE = (1.2, 1.05)                         # Fassung B (Runde 5): Höhepunkt schneller als der Rest
MODELL, EINSTELLUNGEN = "eleven_v4", {"stability": 0.3, "similarity_boost": 0.75}
# Lautheit (Mr. Alex 17.11.): jede Datei auf ±0,5 LU genau, der Sergeant 2 LU lauter als die anderen
ZIEL_LUFS = {"sonst": -16.0, "sergeant": -14.0}
SPITZE = 0.841                                    # Spitzenbegrenzung −1,5 dB
# Nähte, die Mr. Alex beanstandet hat (17.11.: taube_18, Teil 2 setzte zu dicht und zu hart ein): zusätzliche Pause in Sekunden
NAHT_PAUSE = {}   # taube_18: die Störung lag in der Aufnahme von Teil 2, nicht an der Naht – Teil 2 neu aufgenommen
STILLE_WEG = "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse"


def tabelle(name):
    with open(os.path.join(QUELLE, name), encoding="utf-8") as f:
        return list(csv.DictReader(f, delimiter="\t", quoting=csv.QUOTE_NONE))


def stuecke(nur=None, figur=None):
    """liefert (Datei, Figur, [Teile])"""
    aus = []
    for name, teil in (("tower_kapitel1.tsv", "kapitel"), ("tower_hof_den.tsv", "hofden")):   # Hof und The Den: gleiche Spalten, gleiche Namen k1_<id>
        if nur not in (None, teil):
            continue
        for z in tabelle(name):
            regie = (z["regie"] or "").strip()
            if not regie or "nur_text" in z.values():
                continue
            aus.append((f"k1_{z['id']}.mp3", z["sprecher"], regie.split(" || ")))
            einfach = (z["einfach"] or "").strip()
            if einfach:
                tags = re.match(r"(\s*\[[^\]]*\]\s*)*", regie).group(0)
                aus.append((f"k1_{z['id']}_einfach.mp3", z["sprecher"], [tags + einfach]))
    if nur in (None, "sprueche"):
        for z in tabelle("tower_sprueche.tsv"):
            teile = (z["regie"] or "").strip().split(" || ")
            if len(teile) == 2 and z["figur"] != "taube":      # Garys Pannen: zwei getrennte Dateien, das Geräusch (CLANG) kommt im Spiel dazwischen
                aus += [(f"{z['id']}_{i + 1}.mp3", z["figur"], [t], [f"{z['id']}_{i}.mp3"]) for i, t in enumerate(teile)]
            else:
                aus.append((f"{z['id']}.mp3", z["figur"], teile))
    aus = [s if len(s) == 4 else (*s, [f"{s[0][:-4]}_{i}.mp3" for i in range(len(s[2]))]) for s in aus]   # 4. Feld: Namen der Rohteile
    fremd = sorted({s[1] for s in aus} - set(STIMMEN))
    if fremd:
        sys.exit(f"Keine Stimme für: {fremd}")
    return [s for s in aus if not figur or s[1] == figur]


def zeichen(teile):
    return sum(len(t) for t in teile)


def erzeugen(voice, text, ziel, tempo):
    """ein ElevenLabs-Aufruf; gibt die Kosten laut Antwortkopf zurück (None, wenn der Kopf fehlt)"""
    body = json.dumps({"text": text, "model_id": MODELL,
                       "voice_settings": {**EINSTELLUNGEN, **({"speed": tempo} if tempo else {})}}).encode()
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128",
                                 data=body, headers={"Content-Type": "application/json"})
    for versuch in (1, 2):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                daten, kosten = r.read(), r.headers.get("Character-Cost")
            break
        except urllib.error.HTTPError as e:
            if versuch == 2 or e.code not in (429, 500, 502, 503, 504):
                raise RuntimeError(f"HTTP {e.code}: {e.read()[:200].decode('utf-8', 'replace')}")
            time.sleep(8)
    if len(daten) < 1000:
        raise RuntimeError("Antwort zu klein")
    with open(ziel + ".teil", "wb") as f:
        f.write(daten)
    os.replace(ziel + ".teil", ziel)
    return int(kosten) if kosten and kosten.isdigit() else None


def ffmpeg(*args):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *args], check=True)


def bauen(datei, figur, teile, rohnamen):
    """erzeugt die Rohteile (falls noch nicht da), setzt zusammen, gleicht die Lautheit an; gibt (Kosten, Kopf_fehlte) zurück"""
    voice, tempo = STIMMEN[figur]
    tempi = TAUBE_TEILE if figur == "taube" and len(teile) == 2 else [tempo] * len(teile)
    kosten, ohne_kopf, roh = 0, False, []
    for i, (text, t) in enumerate(zip(teile, tempi)):
        pfad = os.path.join(ROH, rohnamen[i])
        if not os.path.exists(pfad):
            k = erzeugen(voice, text, pfad, t)
            ohne_kopf |= k is None
            kosten += k or 0
            with open(PROTOKOLL, "a", encoding="utf-8") as f:
                f.write(f"{datei}\t{i}\t{len(text)}\t{'' if k is None else k}\n")
        roh.append(pfad)
    angleichen(roh, os.path.join(ZIEL, datei), figur)
    return kosten, ohne_kopf


def lautheit(pfad):
    """gemessene Lautheit in LUFS (ebur128, ganze Datei)"""
    aus = subprocess.run(["ffmpeg", "-nostats", "-i", pfad, "-af", "ebur128", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    werte = re.findall(r"I:\s+(-?[\d.]+) LUFS", aus[aus.rfind("Summary"):])
    return float(werte[0]) if werte else None


def angleichen(roh, fertig, figur):
    """zwei Durchgänge: messen, dann gezielt verstärken (Spitzen höchstens −1,5 dB), nachmessen und nachstellen, bis ±0,3 LU erreicht sind"""
    ziel = ZIEL_LUFS.get(figur, ZIEL_LUFS["sonst"])
    wav, tmp = fertig + ".wav", fertig + ".teil"
    if len(roh) == 1:
        ffmpeg("-i", roh[0], "-ar", "44100", "-ac", "1", wav)
    else:
        pause = NAHT_PAUSE.get(os.path.basename(fertig))
        if pause:   # Naht nachgebessert: längere Pause, Teil 2 weich eingeblendet
            kette = f"[0:a]{STILLE_WEG},apad=pad_dur={pause}[a];[1:a]afade=t=in:st=0:d=0.03[b];[a][b]concat=n=2:v=0:a=1"
        else:
            kette = f"[0:a]{STILLE_WEG}[a];[a][1:a]concat=n=2:v=0:a=1"
        ffmpeg("-i", roh[0], "-i", roh[1], "-filter_complex", kette, "-ar", "44100", "-ac", "1", wav)
    try:
        ist = lautheit(wav)
        gain = (ziel - ist) if ist is not None else 0.0
        for _ in range(5):
            ffmpeg("-i", wav, "-af", f"volume={gain:.2f}dB,alimiter=limit={SPITZE}:level=false:attack=2:release=40",
                   "-ar", "44100", "-b:a", "128k", "-f", "mp3", tmp)
            neu = lautheit(tmp)
            if neu is None or abs(neu - ziel) <= 0.3:
                break
            gain += ziel - neu
        os.replace(tmp, fertig)
    finally:
        os.remove(wav)
    return neu


def neu_angleichen(alle):
    """--lautheit: alle vorhandenen Aufnahmen aus den Rohteilen neu angleichen (kostet nichts; überschreibt nur die Lautheit)"""
    fehlt = []
    for d, fig, t, rohnamen in alle:
        roh = [os.path.join(ROH, r) for r in rohnamen]
        fertig = os.path.join(ZIEL, d)
        if not os.path.exists(fertig):
            continue
        if not all(os.path.exists(r) for r in roh):
            roh = [fertig + ".alt.mp3"]              # Rohteil fehlt: die fertige Datei selbst als Quelle
            os.replace(fertig, roh[0])
            fehlt.append(d)
        angleichen(roh, fertig, fig)
        if d in fehlt:
            os.remove(roh[0])
    if fehlt:
        print(f"{len(fehlt)} ohne Rohteil, aus der fertigen Datei angeglichen: {fehlt[:8]}")


def messen(alle):
    """--messen: Mittel und Spanne je Figur"""
    for fig in STIMMEN:
        w = [lautheit(os.path.join(ZIEL, d)) for d, f, _, _ in alle if f == fig and os.path.exists(os.path.join(ZIEL, d))]
        w = [x for x in w if x is not None]
        if w:
            print(f"  {fig}: {len(w)} Dateien, Mittel {sum(w) / len(w):.1f} LUFS, Spanne {min(w):.1f} bis {max(w):.1f} (Ziel {ZIEL_LUFS.get(fig, ZIEL_LUFS['sonst'])})")


def wert(name):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else None


def main():
    alle = stuecke(wert("--nur"), wert("--figur"))
    offen = [s for s in alle if not os.path.exists(os.path.join(ZIEL, s[0]))]
    z = sum(zeichen(s[2]) for s in offen)
    print(f"{len(alle)} Aufnahmen, {len(offen)} offen, {z} Zeichen offen, erwartet rund {round(z * CREDITS_JE_ZEICHEN)} Credits")
    for fig in STIMMEN:
        a = [s for s in alle if s[1] == fig]
        o = [s for s in offen if s[1] == fig]
        if a:
            print(f"  {fig}: {len(a)} Aufnahmen, {len(o)} offen, {sum(zeichen(s[2]) for s in o)} Zeichen")
    zweit = [s for s in offen if s[0].endswith("_einfach.mp3")]
    print(f"  davon Zweitfassungen: {len(zweit)} offen, {sum(zeichen(s[2]) for s in zweit)} Zeichen;"
          f" in zwei Teilen: {len([s for s in offen if len(s[2]) == 2])}")
    if "--lautheit" in sys.argv:
        neu_angleichen(alle)
    if "--lautheit" in sys.argv or "--messen" in sys.argv:
        return messen(alle)
    if "--zaehlen" in sys.argv:
        if "--liste" in sys.argv:
            for d, fig, t, _ in offen:
                print(f"  {d} [{fig}] ({zeichen(t)}): {' || '.join(t)}")
        return
    os.makedirs(ZIEL, exist_ok=True)
    os.makedirs(ROH, exist_ok=True)
    grenze = int(wert("--hoechstens") or len(offen))
    summe, fehler, ohne_kopf = 0, [], 0
    for n, (d, fig, t, roh) in enumerate(offen[:grenze], 1):
        try:
            k, fehlt = bauen(d, fig, t, roh)
            summe += k
            ohne_kopf += fehlt
            print(f"  ✓ {n}/{min(grenze, len(offen))} {d} ({zeichen(t)} Zeichen, {k} Credits, Summe {summe})", flush=True)
        except Exception as e:                      # Zeile merken, weiter mit der nächsten
            fehler.append((d, str(e)))
            print(f"  ✗ {d}: {e}", flush=True)
            if len(fehler) >= 8 and len(fehler) > n / 2:
                print("Zu viele Fehler – Abbruch.")
                break
    print(f"Fertig: {summe} Credits laut Character-Cost" + (f" ({ohne_kopf} Aufnahmen ohne Kostenangabe)" if ohne_kopf else ""))
    if fehler:
        print(f"{len(fehler)} fehlgeschlagen (neu starten holt nur diese nach):")
        for d, e in fehler:
            print(f"  {d}: {e}")


if __name__ == "__main__":
    main()
