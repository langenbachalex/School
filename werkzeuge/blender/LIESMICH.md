# Blender per Skript (Probe, 15.11.2026)

Machbarkeits-Test aus dem Master-Chat: Blender läuft ohne Oberfläche, ein Python-Skript baut die Szene und rechnet die Bilder, `ffmpeg` macht daraus den Film. Kein Teil der Apps; nichts hier wird vom Build benutzt.

## Einmal einrichten
```
python3 -m venv werkzeuge/blender/venv
werkzeuge/blender/venv/bin/pip install bpy        # Blender 5.3 als Python-Paket, ca. 1,1 GB
```
Auf dem eigenen Rechner geht auch ein normal installiertes Blender: `blender -b -P werkzeuge/blender/bigben.py`.

## Probe-Film Big Ben (5 s, 640×360)
```
cd werkzeuge/blender
venv/bin/python bigben.py                          # 120 Bilder nach frames/
ffmpeg -framerate 24 -i frames/f%04d.png -c:v libx264 -pix_fmt yuv420p bigben-probe.mp4
```
Schalter über Umgebungsvariablen: `F0`, `F1` (Bildbereich, z. B. `F0=60 F1=60` für ein Standbild), `SAMPLES`, `RESX`, `RESY`, `FPS`, `SECONDS`, `OUT`.

## Gemessen in der Cloud (4 Kerne, keine Grafikkarte, Cycles, 48 Samples)
- 4,2 s je Bild, 120 Bilder in rund 8,5 Minuten, Film 361 KB.
- Hochrechnung 10 s in 1280×720: etwa 55–70 Minuten. Für Längeres oder Schärferes lokal mit Grafikkarte rechnen.

## Stand und Grenzen
Low-Poly ohne Texturen und ohne Figuren („Bauklotz-Niveau“). Für mehr: fertige Modelle aus freien Bibliotheken (glTF) laden. Entscheidung Mr. Alex 15.11.: einfache Filme in der Cloud, hochwertige 3D-Filme und Spiele später und lokal. Bilder, Filme und das `venv` werden nicht eingecheckt (`.gitignore`).
