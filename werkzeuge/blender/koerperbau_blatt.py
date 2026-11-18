"""Prüfseite Körperbau: setzt die Aufnahmen aus koerperbau_probe.js zusammen (braucht Pillow).
Aufruf:  python werkzeuge/blender/koerperbau_blatt.py
Ergebnis in werkzeuge/blender/frames/: koerperbau_blatt.jpg (je Szene ein Standbild), koerperbau_nah.jpg (nur die Probe-Figur, größer),
koerperbau.gif (alles bewegt), dazu Messwerte auf dem Bildschirm."""
import glob, json, os
from PIL import Image
HIER = os.path.dirname(os.path.abspath(__file__)); B = os.path.join(HIER, "frames", "koerperbau"); AUS = os.path.join(HIER, "frames")
m = json.load(open(os.path.join(B, "masse.json"), encoding="utf8")); n = len(m["szenen"])
def bild(i):
    r = m["verlauf"][i]; k = min(len(r) - 1, round(len(r) * m["szenen"][i]["stelle"] * (0.5 if m["szenen"][i]["dauernd"] else 1)))
    return Image.open(os.path.join(B, "s%02d_f%03d.png" % (i, k))).convert("RGB")
W, H = bild(0).size
blatt = Image.new("RGB", (W * 2, H * ((n + 1) // 2)), "white")
for i in range(n): blatt.paste(bild(i), ((i % 2) * W, (i // 2) * H))
blatt.save(os.path.join(AUS, "koerperbau_blatt.jpg"), quality=84)
SP = 8; aus = (560, 60, 900, 540)                      # Ausschnitt mit der Probe-Figur
nah = Image.new("RGB", (SP * 340, ((n + SP - 1) // SP) * 480), "white")
for i in range(n): nah.paste(bild(i).crop(aus), ((i % SP) * 340, (i // SP) * 480))
nah.save(os.path.join(AUS, "koerperbau_nah.jpg"), quality=86)
bilder = [Image.open(f).convert("RGB").resize((W * 4 // 5, H * 4 // 5)).quantize(96) for f in sorted(glob.glob(os.path.join(B, "s*.png")))]
bilder[0].save(os.path.join(AUS, "koerperbau.gif"), save_all=True, append_images=bilder[1:], duration=83, loop=0)
for i, s in enumerate(m["szenen"]):
    r = m["verlauf"][i]
    print("%-22s tiefster Punkt %.3f | Fußspitze max %.2f | Hals %.2f | Knie %.2f | Stiefelkante %.2f | Hände %s" % (
        s["titel"], min(x["tief"] for x in r), max(x["zehe"] for x in r), max(x["hals"] for x in r), r[0]["knie"], r[0]["stiefelOben"], r[len(r) // 2]["hand"]))
