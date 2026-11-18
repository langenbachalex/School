"""Probe A2: setzt die Aufnahmen aus koerperbau_probe.js zusammen (braucht Pillow).
Aufruf:  python werkzeuge/blender/koerperbau_blatt.py
Ergebnis in werkzeuge/blender/frames/: koerperbau_blatt.jpg (je Szene das Bild mit der größten Bewegung), koerperbau.gif, dazu Messwerte auf dem Bildschirm."""
import glob, json, os
from PIL import Image
HIER = os.path.dirname(os.path.abspath(__file__)); B = os.path.join(HIER, "frames", "koerperbau"); AUS = os.path.join(HIER, "frames")
m = json.load(open(os.path.join(B, "masse.json"), encoding="utf8"))
def gipfel(i):                                   # Bild, in dem rechte Hand oder rechter Fuß der gestreckten Figur am höchsten ist
    r = m["verlauf"][i]; return max(range(len(r)), key=lambda k: max(r[k]["flex"]["handR"], r[k]["flex"]["zeheR"] + .3))
n = len(m["szenen"]); blatt = Image.new("RGB", (1800, 520 * ((n + 1) // 2)), "white")
for i in range(n):
    k = len(m["verlauf"][i]) // 2 if m["szenen"][i]["titel"] in ("Stehen", "Gehen") else gipfel(i)
    blatt.paste(Image.open(os.path.join(B, "s%02d_f%03d.png" % (i, k))).convert("RGB"), ((i % 2) * 900, (i // 2) * 520))
blatt.save(os.path.join(AUS, "koerperbau_blatt.jpg"), quality=86)
bilder = [Image.open(f).convert("RGB").resize((720, 416)).quantize(96) for f in sorted(glob.glob(os.path.join(B, "s*.png")))]
bilder[0].save(os.path.join(AUS, "koerperbau.gif"), save_all=True, append_images=bilder[1:], duration=100, loop=0)
print("Bau", m["bau"], "Schrittlänge mal %.2f" % m["schritt"])
for i, s in enumerate(m["szenen"]):
    r = m["verlauf"][i]; z = lambda wer, was, f: f(x[wer][was] for x in r)
    print("%-28s  heute: Hand max %.2f, Hand–Hals min %.2f, Zehe max %.2f, Hals %.2f, Fuß tief %.2f | gestreckt: Hand max %.2f, Hand–Hals min %.2f, Zehe max %.2f, Hals %.2f, Fuß tief %.2f" % (
        s["titel"], z("heute", "handR", max), z("heute", "handZumHals", min), z("heute", "zeheR", max), z("heute", "hals", max), z("heute", "fussTief", min),
        z("flex", "handR", max), z("flex", "handZumHals", min), z("flex", "zeheR", max), z("flex", "hals", max), z("flex", "fussTief", min)))
