"""Mundformen aus den Aufnahmen rechnen (Rhubarb Lip Sync, MIT) – einmal vorab, die App spielt nur ab.

Aufruf:  python werkzeuge/tower_lippen.py [gary] [mrflex] [sergeant] [tourist] [--alles]
         Ohne Angabe alle Figuren. **Gerechnet wird nur, was neu ist oder sich geändert hat** (19.11.2026: vorher wurde jedes Mal
         alles neu gerechnet – Gary zwei Minuten, Mr. Flex zehn). Geändert heißt: Die MP3 hat eine andere Größe als beim letzten
         Rechnen (Feld "groesse"). Einträge ohne dieses Feld gelten als aktuell und bekommen es nachgetragen. `--alles` rechnet alles neu.
         Einträge, deren Aufnahme es nicht mehr gibt, fallen weg.
Ausgabe: app/tower/figuren/mund_<figur>.json, **eine Aufnahme je Zeile** (damit Git Änderungen aus zwei Chats zusammenführen kann):
         {"gary_01": {"dauer": 4.64, "zeiten": [[0.0, "X"], [0.07, "B"], ...], "groesse": 74713}, ...}
Braucht (nur lokal, nicht im Repo):
  werkzeuge/extern/rhubarb/Rhubarb-Lip-Sync-*/rhubarb(.exe)  von https://github.com/DanielSWolf/rhubarb-lip-sync/releases
  ffmpeg ODER Blender (wandelt MP3 in WAV um, weil Rhubarb nur WAV und Ogg liest; ist ffmpeg da, wird es genommen).
Mundformen: A–F Grundformen, G, H, X Zusatz; was sie im Gesicht bedeuten, steht in app/tower/probe3d_figuren.js (MUNDFORMEN).
Zeilen der Geschichte (Figuren 9, 20.11.): Aufnahmen k1_<id>.mp3 und k1_<id>_einfach.mp3 gehören zu der Figur, die in den Texttabellen
         (tower_kapitel1.tsv, tower_hof_den.tsv, Spalte sprecher) spricht. Erfasst werden sie für die Figuren in MIT_GESCHICHTE – bisher nur der Tourist (k1_w08*).
Zuständigkeit (Mr. Alex 19.11.): Wer Aufnahmen macht oder ändert, rechnet danach die Mundformen – dank „nur Neues“ in Sekunden.
"""
import csv
import glob
import json
import os
import shutil
import subprocess
import sys
import tempfile

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ALLE_FIGUREN = ["gary", "mrflex", "sergeant", "tourist"]
ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
ALLES = "--alles" in sys.argv
FIGUREN = [f for f in ALLE_FIGUREN if not ARGS or f in ARGS]   # python werkzeuge/tower_lippen.py mrflex = nur diese Figur; die übrigen Dateien bleiben
AUDIO = os.path.join(REPO, "app", "audio", "tower")
AUFNAHMEN = {f: sorted(os.path.basename(d)[:-4] for d in glob.glob(os.path.join(AUDIO, f + "_*.mp3"))) for f in FIGUREN}
MIT_GESCHICHTE = ["tourist"]   # für diese Figuren auch die Zeilen der Geschichte (k1_…); weitere Figuren hier eintragen, dann rechnet der nächste Lauf sie nach
GESCHICHTE = {}                # Kennung der Aufnahme (k1_w08b, k1_w08b_einfach) -> (Sprecher, Text)
for tabelle in ("tower_kapitel1.tsv", "tower_hof_den.tsv"):
    with open(os.path.join(REPO, "inhalte", "abenteuer", tabelle), encoding="utf-8") as f:
        for z in csv.DictReader(f, delimiter="\t", quoting=csv.QUOTE_NONE):
            GESCHICHTE["k1_" + z["id"]] = (z["sprecher"], z["englisch"])
            GESCHICHTE["k1_" + z["id"] + "_einfach"] = (z["sprecher"], z.get("einfach") or z["englisch"])
for f in FIGUREN:
    if f in MIT_GESCHICHTE:
        AUFNAHMEN[f] = sorted(AUFNAHMEN[f] + [k for k, (wer, _) in GESCHICHTE.items() if wer == f and os.path.exists(os.path.join(AUDIO, k + ".mp3"))])
FFMPEG = shutil.which("ffmpeg")
BLENDER = os.environ.get("BLENDER") or next(iter(sorted(glob.glob(r"C:\Program Files\Blender Foundation\Blender *\blender.exe"), reverse=True)), "blender")


def rhubarb():
    r = next(iter(p for p in glob.glob(os.path.join(REPO, "werkzeuge", "extern", "rhubarb", "*", "rhubarb*")) if os.path.isfile(p)), None)
    if not r:
        sys.exit("Rhubarb Lip Sync fehlt in werkzeuge/extern/rhubarb/ (siehe Kopf dieser Datei).")
    return r


def als_wav(mp3, wav):
    if FFMPEG:
        subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-i", mp3, "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", wav], check=False)
    else:   # Blender meldet nach dem Schreiben manchmal einen Fehler beim letzten Tonstück; die Datei ist trotzdem vollständig
        code = f"import aud\ntry:\n    aud.Sound('{mp3}').write('{wav}', aud.RATE_48000, aud.CHANNELS_MONO, aud.FORMAT_S16, aud.CONTAINER_WAV, aud.CODEC_PCM)\nexcept Exception as e:\n    print(e)"
        subprocess.run([BLENDER, "-b", "--python-expr", code], capture_output=True, check=False)
    return os.path.exists(wav)


def schreiben(ziel, daten):
    """eine Aufnahme je Zeile, nach Kennung sortiert"""
    zeilen = [json.dumps(k) + ":" + json.dumps(daten[k], separators=(",", ":")) for k in sorted(daten)]
    with open(ziel, "w", encoding="utf-8", newline="\n") as f:
        f.write("{\n" + ",\n".join(zeilen) + "\n}\n")


def main():
    with open(os.path.join(REPO, "inhalte", "abenteuer", "tower_sprueche.tsv"), encoding="utf-8") as f:
        texte = {z["id"]: z["text"] for z in csv.DictReader(f, delimiter="\t", quoting=csv.QUOTE_NONE)}
    texte.update({k: text for k, (_, text) in GESCHICHTE.items()})
    prog = None
    with tempfile.TemporaryDirectory() as tmp:
        for figur, ids in AUFNAHMEN.items():
            ziel = os.path.join(REPO, "app", "tower", "figuren", f"mund_{figur}.json")
            alt = {}
            if os.path.exists(ziel) and not ALLES:
                with open(ziel, encoding="utf-8") as f:
                    alt = json.load(f)
            aus, neu = {}, 0
            for i in ids:
                mp3 = os.path.join(AUDIO, i + ".mp3").replace("\\", "/")
                groesse = os.path.getsize(mp3)
                e = alt.get(i)
                if e and e.get("groesse", groesse) == groesse:      # schon gerechnet und unverändert
                    aus[i] = {**e, "groesse": groesse}
                    continue
                prog = prog or rhubarb()
                wav, txt = os.path.join(tmp, i + ".wav").replace("\\", "/"), os.path.join(tmp, i + ".txt")
                if not als_wav(mp3, wav):
                    sys.exit(f"{i}: Umwandeln in WAV hat nicht geklappt")
                with open(txt, "w", encoding="utf-8") as f:
                    f.write(texte.get(i, "").replace("…", " "))
                mit_text = ["-d", txt] if texte.get(i) else []   # mehrteilige Aufnahmen (gary_20_1 …) haben keinen eigenen Text
                r = subprocess.run([prog, "-f", "json", "--extendedShapes", "GHX", *mit_text, wav], capture_output=True, text=True, check=True)
                d = json.loads(r.stdout)
                aus[i] = {"dauer": d["metadata"]["duration"], "zeiten": [[c["start"], c["value"]] for c in d["mouthCues"]], "groesse": groesse}
                neu += 1
                print(f"{i}: {d['metadata']['duration']} s, {len(d['mouthCues'])} Mundformen", flush=True)
            weg = sorted(set(alt) - set(aus))
            if ids or alt:
                schreiben(ziel, aus)
            print(f"{os.path.basename(ziel)}: {len(aus)} Aufnahmen, {neu} neu gerechnet, {len(aus) - neu} unverändert" + (f", {len(weg)} entfernt" if weg else ""))


if __name__ == "__main__":
    main()
