"""Mundformen aus den Aufnahmen rechnen (Rhubarb Lip Sync, MIT) – einmal vorab, die App spielt nur ab.

Aufruf:  python werkzeuge/tower_lippen.py [gary] [mrflex]   (ohne Angabe beide; Gary etwa zwei Minuten, Mr. Flex etwa zehn)
Ausgabe: app/tower/figuren/mund_gary.json, mund_mrflex.json   {"gary_01": {"dauer": 4.64, "zeiten": [[0.0, "X"], [0.07, "B"], ...]}, ...}
Braucht (nur lokal, nicht im Repo):
  werkzeuge/extern/rhubarb/Rhubarb-Lip-Sync-*/rhubarb(.exe)  von https://github.com/DanielSWolf/rhubarb-lip-sync/releases
  Blender (wandelt MP3 in WAV um, weil Rhubarb nur WAV und Ogg liest; ffmpeg ginge genauso).
Mundformen: A–F Grundformen, G, H, X Zusatz; was sie im Gesicht bedeuten, steht in app/tower/probe3d_figuren.js (MUNDFORMEN).
"""
import csv
import glob
import json
import os
import subprocess
import sys
import tempfile

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIGUREN = [f for f in ["gary", "mrflex", "sergeant"] if len(sys.argv) < 2 or f in sys.argv[1:]]   # python werkzeuge/tower_lippen.py mrflex = nur diese Figur; die uebrigen kommen mit Block B
AUFNAHMEN = {f: sorted(os.path.basename(d)[:-4] for d in glob.glob(os.path.join(REPO, "app", "audio", "tower", f + "_*.mp3"))) for f in FIGUREN}
BLENDER = os.environ.get("BLENDER") or next(iter(sorted(glob.glob(r"C:\Program Files\Blender Foundation\Blender *\blender.exe"), reverse=True)), "blender")
RHUBARB = next(iter(glob.glob(os.path.join(REPO, "werkzeuge", "extern", "rhubarb", "*", "rhubarb*"))), None)
if not RHUBARB:
    sys.exit("Rhubarb Lip Sync fehlt in werkzeuge/extern/rhubarb/ (siehe Kopf dieser Datei).")

with open(os.path.join(REPO, "inhalte", "abenteuer", "tower_sprueche.tsv"), encoding="utf-8") as f:
    TEXTE = {z["id"]: z["text"] for z in csv.DictReader(f, delimiter="\t")}

with tempfile.TemporaryDirectory() as tmp:
    for figur, ids in AUFNAHMEN.items():
        aus = {}
        for i in ids:
            mp3 = os.path.join(REPO, "app", "audio", "tower", i + ".mp3").replace("\\", "/")
            wav, txt = os.path.join(tmp, i + ".wav").replace("\\", "/"), os.path.join(tmp, i + ".txt")
            # Blender meldet nach dem Schreiben manchmal einen Fehler beim letzten Tonstueck; die Datei ist trotzdem vollstaendig
            code = f"import aud\ntry:\n    aud.Sound('{mp3}').write('{wav}', aud.RATE_48000, aud.CHANNELS_MONO, aud.FORMAT_S16, aud.CONTAINER_WAV, aud.CODEC_PCM)\nexcept Exception as e:\n    print('HINWEIS', e)\n"
            subprocess.run([BLENDER, "-b", "--python-expr", code], capture_output=True, check=False)
            if not os.path.exists(wav):
                sys.exit(f"{i}: Umwandeln in WAV hat nicht geklappt")
            with open(txt, "w", encoding="utf-8") as f:
                f.write(TEXTE.get(i, "").replace("…", " "))
            mit_text = ["-d", txt] if TEXTE.get(i) else []   # mehrteilige Aufnahmen (gary_20_1 …) haben keinen eigenen Text
            r = subprocess.run([RHUBARB, "-f", "json", "--extendedShapes", "GHX", *mit_text, wav], capture_output=True, text=True, check=True)
            d = json.loads(r.stdout)
            aus[i] = {"dauer": d["metadata"]["duration"], "zeiten": [[c["start"], c["value"]] for c in d["mouthCues"]]}
            print(f"{i}: {d['metadata']['duration']} s, {len(d['mouthCues'])} Mundformen")
        ziel = os.path.join(REPO, "app", "tower", "figuren", f"mund_{figur}.json")
        with open(ziel, "w", encoding="utf-8", newline="\n") as f:
            json.dump(aus, f, separators=(",", ":"))
        print(f"{os.path.basename(ziel)}: {os.path.getsize(ziel)} Bytes")
