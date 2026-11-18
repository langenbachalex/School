"""Sergeant Bearskin: Kopf mit Fellmuetze fuer den gestreckten KayKit-Knight (Teil C, Schritt 1, 18.11.2026).

Aufruf:  blender -b --python werkzeuge/blender/tower_sergeant.py      (wenige Sekunden)
Ausgabe: app/tower/figuren/sergeant_teile.glb mit dem Kopf "sergeantkopf". Zur Wahl standen Schnurrbart oder Bart (Figurenblatt, Profile-Tabelle: „Schnurrbart oder Bart: zwei Varianten
am Kopf zeigen, Mr. Alex waehlt“) – gewaehlt 18.11.: Bart, rothaarig; voll=False baut weiter den Kopf nur mit Schnurrbart. Der Browser (app/tower/probe3d_bau.js) steckt sie auf den Kopfknochen.
Der Kopf ist der von Mr. Flex (tower_flex.py, gleiche Teilenamen, gleicher Mund) mit anderen Massen und Farben: breiter, kantiger Kiefer, rotes Gesicht,
dicke dunkle Brauen, kein Haar zu sehen, keine Brille. Neu: "fellmuetze" (eigenes Gelenk am Scheitel – wackelt spaeter beim Salutieren), "kotelette".
Der Bart ist die Kieferflaeche in Bartfarbe (bei Mr. Flex der Bartschatten): er klappt mit dem Unterkiefer auf und zu.
"""
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tower_flex as fx
import tower_gary as g

ROTBRAUN, HAUT = (0.80, 0.30, 0.04), (0.92, 0.66, 0.56)   # Bart und Haar leuchtend rot-orange, helle Haut
MZ = 0.218                                             # Unterkante der Fellmuetze: dicht ueber den Brauen


def sergeantkopf(name, ort, voll):
    """voll = True: Vollbart (kurz, kantig) · False: nur der grosse Schnurrbart."""
    vor = "sgt_bart" if voll else "sgt"
    f = fx.farben(vor, haut=HAUT, wange=(0.86, 0.50, 0.42), bartschatten=ROTBRAUN if voll else (0.78, 0.53, 0.45), schnurrbart=(0.88, 0.38, 0.06),
                  braue=(0.66, 0.24, 0.03), iris=(0.04, 0.80, 0.22), falte=(0.60, 0.34, 0.28))
    k = fx.flexkopf(None, ort, name, f=f, haare=False, brille=False, bart=(0.070, 0.0125, 0.012), braue=0.0080)
    fell = g.farbe("sgt_fell", (0.025, 0.022, 0.022), 0.95)
    m = g.gelenk("fellmuetze", k, (0, 0, MZ))
    for mitte, mass in (((0, 0.012, 0.150), (0.158, 0.172, 0.250)), ((0, -0.012, 0.215), (0.140, 0.150, 0.200))):   # hoher Fellkoerper, oben etwas nach vorn
        teil = g.kugel("fell", m, mitte, mass, fell, fein=32)
        for p in teil.data.vertices:
            p.co.z = max(p.co.z, -mitte[2])                # unten gerade abgeschnitten
    g.kugel("haar_kurz", k, (0, 0.022, 0.150), (fx.RX + 0.003, 0.140, 0.180), g.farbe("sgt_haar", ROTBRAUN, 0.85), fein=24)   # kurz geschoren: nur hinten unter der Muetze
    if voll:
        for s in (-1, 1):
            g.kugel("kotelette", k, (s * (fx.RX - 0.012), -0.040, 0.118), (0.012, 0.030, 0.062), f["schatten"])
    return k


if __name__ == "__main__":
    g.neu()
    fx.RX, fx.KR = 0.140, (0.108, 0.128, 0.093)         # breiter Schaedel, kantiger Kiefer (die Funktionen von tower_flex lesen diese Masse beim Bauen)
    sergeantkopf("sergeantkopf", (0, 0, 0), True)       # Mr. Alex 18.11.: der Kopf mit Bart, rothaarig ("ginger")
    ziel = os.path.join(g.OUT, "sergeant_teile.glb")
    bpy.ops.export_scene.gltf(filepath=ziel, export_format="GLB", export_cameras=False, export_lights=False, export_animations=False, export_yup=True)
    print(f"SERGEANT sergeant_teile.glb: {os.path.getsize(ziel) / 1000:.0f} KB", flush=True)
