"""Setzt die Prüfbilder aus tower_gesten.py zu Blättern zusammen (braucht Pillow).

Aufruf:  python werkzeuge/blender/tower_gesten_blatt.py
Ergebnis in werkzeuge/blender/frames/:  gesten_blatt_<Gruppe>.jpg (je Bewegung vier Phasen)
                                         gesten_<Gruppe>.gif      (alle Bewegungen der Gruppe laufen in einer Schleife)
"""
import glob, os, re
from PIL import Image, ImageDraw

HIER = os.path.dirname(os.path.abspath(__file__))
BILDER, AUS = os.path.join(HIER, "frames", "gesten"), os.path.join(HIER, "frames")
namen = {}
for f in sorted(glob.glob(os.path.join(BILDER, "*.png"))):
    m = re.match(r"(.+)_(\d\d)\.png$", os.path.basename(f)); namen.setdefault(m.group(1), []).append(f)
gruppen = {}
for n in namen: gruppen.setdefault(n.split("_")[0], []).append(n)
K = 220
def zelle(f, text):
    b = Image.open(f).convert("RGB"); d = ImageDraw.Draw(b)
    if text: d.rectangle((0, 0, K, 14), fill="white"); d.text((3, 1), text, fill="black")
    return b
for g, liste in gruppen.items():
    phasen = (3, 6, 9, 12)
    blatt = Image.new("RGB", (len(phasen) * K * 2, ((len(liste) + 1) // 2) * K), "white")
    for i, n in enumerate(liste):
        for j, p in enumerate(phasen):
            blatt.paste(zelle(namen[n][p], n.split("_", 1)[1] if j == 0 else ""), ((i % 2) * len(phasen) * K + j * K, (i // 2) * K))
    blatt.save(os.path.join(AUS, "gesten_blatt_%s.jpg" % g), quality=85)
    sp = min(5, len(liste)); bilder = []
    for k in range(len(namen[liste[0]])):
        b = Image.new("RGB", (sp * K, ((len(liste) + sp - 1) // sp) * K), "white")
        for i, n in enumerate(liste): b.paste(zelle(namen[n][k], n.split("_", 1)[1]), ((i % sp) * K, (i // sp) * K))
        bilder.append(b.quantize(64))
    bilder[0].save(os.path.join(AUS, "gesten_%s.gif" % g), save_all=True, append_images=bilder[1:], duration=110, loop=0)
    print(g, len(liste), "Bewegungen")
