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


def sergeantkopf(name, ort, voll, nase="haken"):
    """voll = True: Vollbart (kurz, kantig) · False: nur der grosse Schnurrbart. nase = "haken" (lang, schmal, die Spitze haengt) oder "knolle" (dick, rund, rot)."""
    vor = "sgt_bart" if voll else "sgt"
    f = fx.farben(vor, haut=HAUT, wange=(0.86, 0.50, 0.42), bartschatten=ROTBRAUN if voll else (0.78, 0.53, 0.45), schnurrbart=(0.88, 0.38, 0.06),
                  braue=(0.66, 0.24, 0.03), iris=(0.04, 0.80, 0.22), falte=(0.60, 0.34, 0.28))
    k = fx.flexkopf(None, ort, name, f=f, haare=False, brille=False, bart=(0.070, 0.0125, 0.012), braue=0.0080, nase=False)
    R = fx.R
    if nase == "knolle":
        rot = g.farbe("sgt_knolle", (0.88, 0.36, 0.30), 0.6)
        g.kugel("nasenruecken", k, (0, fx.haut_vorn(0, 0.140) - 0.006, 0.140), (0.017, 0.020, 0.036), f["haut"])
        g.kugel("nasenspitze", k, (0, -0.176, 0.106), (0.034, 0.031, 0.030), rot, fein=32)
        for s in (-1, 1):
            g.kugel("nasenfluegel", k, (s * 0.027, -0.160, 0.097), (0.016, 0.017, 0.014), rot)
    else:
        g.kugel("nasenruecken", k, (0, fx.haut_vorn(0, 0.150) - 0.014, 0.150), (0.0115, 0.026, 0.050), f["haut"], (R(-14), 0, 0))   # schmal, steht oben weit vor
        g.kugel("nasenhoecker", k, (0, -0.186, 0.134), (0.0115, 0.017, 0.024), f["haut"])
        g.kugel("nasenspitze", k, (0, -0.186, 0.098), (0.0125, 0.021, 0.024), f["haut"], (R(28), 0, 0))                           # die Spitze haengt ueber den Schnurrbart
        for s in (-1, 1):
            g.kugel("nasenfluegel", k, (s * 0.014, -0.160, 0.100), (0.009, 0.013, 0.010), f["haut"])
    fell = g.farbe("sgt_fell", (0.025, 0.022, 0.022), 0.95)
    m = g.gelenk("fellmuetze", k, (0, 0, MZ))
    for mitte, mass in (((0, 0.012, 0.150), (0.158, 0.172, 0.250)), ((0, -0.012, 0.215), (0.140, 0.150, 0.200))):   # hoher Fellkoerper, oben etwas nach vorn
        teil = g.kugel("fell", m, mitte, mass, fell, fein=32)
        for p in teil.data.vertices:
            p.co.z = max(p.co.z, -mitte[2])                # unten gerade abgeschnitten
    g.kugel("haar_kurz", k, (0, 0.022, 0.150), (fx.RX + 0.003, 0.140, 0.180), g.farbe("sgt_haar", ROTBRAUN, 0.85), fein=24)   # kurz geschoren: nur hinten unter der Muetze
    if voll:
        # Backenbart: der Bart laeuft vom Kiefer vor dem Ohr hinauf bis unter die Muetze (Mr. Alex 19.11.: Uebergang vom Kinn zum Backenbart)
        for s in (-1, 1):
            g.kugel("backenbart", k, (s * 0.113, -0.046, 0.126), (0.021, 0.042, 0.102), f["schatten"], (R(-6), s * R(12), 0))   # ein glatter Streifen (eine Reihe Kugeln sah aus wie eine Perlenkette)
    return k


if __name__ == "__main__":
    fx.RX, fx.KR = 0.140, (0.108, 0.128, 0.093)         # breiter Schaedel, kantiger Kiefer (die Funktionen von tower_flex lesen diese Masse beim Bauen)
    for datei, nase in (("sergeant_teile.glb", "haken"), ("sergeant_knolle_teile.glb", "knolle")):   # zwei Nasen zur Wahl (Mr. Alex 19.11.), je Datei ein Kopf
        g.neu()
        sergeantkopf("sergeantkopf", (0, 0, 0), True, nase)   # Mr. Alex 18.11.: der Kopf mit Bart, rothaarig ("ginger")
        ziel = os.path.join(g.OUT, datei)
        bpy.ops.export_scene.gltf(filepath=ziel, export_format="GLB", export_cameras=False, export_lights=False, export_animations=False, export_yup=True)
        print(f"SERGEANT {datei}: {os.path.getsize(ziel) / 1000:.0f} KB", flush=True)
