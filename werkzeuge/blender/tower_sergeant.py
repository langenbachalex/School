"""Sergeant Bearskin: Kopf mit Fellmuetze fuer den gestreckten KayKit-Knight (Teil C, Schritt 1, 18.11.2026).

Aufruf:  blender -b --python werkzeuge/blender/tower_sergeant.py      (wenige Sekunden)
Ausgabe: app/tower/figuren/sergeant_teile.glb mit dem Kopf "sergeantkopf". Zur Wahl standen Schnurrbart oder Bart (Figurenblatt, Profile-Tabelle: „Schnurrbart oder Bart: zwei Varianten
am Kopf zeigen, Mr. Alex waehlt“) – gewaehlt 18.11.: Bart, rothaarig; voll=False baut weiter den Kopf nur mit Schnurrbart. Der Browser (app/tower/probe3d_bau.js) steckt sie auf den Kopfknochen.
Der Kopf ist der von Mr. Flex (tower_flex.py, gleiche Teilenamen, gleicher Mund) mit anderen Massen und Farben: breiter, kantiger Kiefer, rotes Gesicht,
dicke dunkle Brauen, kein Haar zu sehen, keine Brille. Neu: "fellmuetze" (eigenes Gelenk am Scheitel – wackelt spaeter beim Salutieren), "kotelette".
Der Bart ist die Kieferflaeche in Bartfarbe (bei Mr. Flex der Bartschatten): er klappt mit dem Unterkiefer auf und zu.
"""
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tower_flex as fx
import tower_gary as g

ROTBRAUN, HAUT = (0.80, 0.30, 0.04), (0.92, 0.66, 0.56)   # Bart und Haar leuchtend rot-orange, helle Haut
MZ = 0.218                                             # Unterkante der Fellmuetze: dicht ueber den Brauen


def sergeantkopf(name, ort, voll, nase="knolle"):
    """voll = True: Vollbart (kurz, kantig) · False: nur der grosse Schnurrbart. nase = "haken" (lang, schmal, die Spitze haengt) oder "knolle" (dick, rund, rot)."""
    vor = "sgt_bart" if voll else "sgt"
    f = fx.farben(vor, haut=HAUT, wange=HAUT, bartschatten=ROTBRAUN if voll else (0.78, 0.53, 0.45), schnurrbart=(0.88, 0.38, 0.06),
                  braue=(0.66, 0.24, 0.03), iris=(0.04, 0.80, 0.22), falte=(0.60, 0.34, 0.28))
    k = fx.flexkopf(None, ort, name, f=f, haare=False, brille=False, bart=(0.060, 0.0125, 0.012), braue=0.0080, nase=False, wange=(0.062, 0.110, 0.036, 0.030), fein=2)   # Wangen hautfarben wie bei Mr. Flex (Mr. Alex 19.11.)
    R = fx.R
    # Die Nase ist EIN Stueck (Mr. Alex 19.11.: nicht aus Kugeln zusammengesetzt): Stationen von der Nasenwurzel bis unter die Spitze,
    # je (Hoehe, so weit steht der Nasenruecken vor dem Gesicht, halbe Breite). Haken = schmal mit Buckel, die Spitze haengt; Knolle = kurzer Ruecken, dicke runde Kugel.
    if nase == "knolle":
        fx.nasenform(k, [(0.196, 0.002, 0.008), (0.180, 0.007, 0.011), (0.164, 0.011, 0.013), (0.150, 0.017, 0.017), (0.138, 0.030, 0.025), (0.126, 0.044, 0.032), (0.112, 0.052, 0.036),
                      (0.098, 0.051, 0.035), (0.086, 0.040, 0.030), (0.077, 0.024, 0.022), (0.072, 0.006, 0.010)], g.farbe("sgt_knolle", (0.90, 0.46, 0.40), 0.6))
    else:
        fx.nasenform(k, [(0.200, 0.002, 0.007), (0.186, 0.012, 0.010), (0.172, 0.026, 0.012), (0.158, 0.040, 0.013), (0.144, 0.047, 0.0135), (0.130, 0.048, 0.014), (0.116, 0.050, 0.015),
                      (0.102, 0.054, 0.017), (0.090, 0.053, 0.019), (0.080, 0.040, 0.018), (0.074, 0.022, 0.014), (0.071, 0.005, 0.008)], f["haut"])
    fell = g.farbe("sgt_fell", (0.025, 0.022, 0.022), 0.95)
    m = g.gelenk("fellmuetze", k, (0, 0, MZ))
    for mitte, mass in (((0, 0.012, 0.150), (fx.RX + 0.018, 0.172, 0.250)), ((0, -0.012, 0.215), (fx.RX, 0.150, 0.200))):   # hoher Fellkoerper, oben etwas nach vorn
        teil = g.kugel("fell", m, mitte, mass, fell, fein=32)
        for p in teil.data.vertices:
            p.co.z = max(p.co.z, -mitte[2])                # unten gerade abgeschnitten
    g.kugel("haar_kurz", k, (0, 0.022, 0.150), (fx.RX + 0.003, 0.140, 0.180), g.farbe("sgt_haar", ROTBRAUN, 0.85), fein=24)   # kurz geschoren: nur hinten unter der Muetze
    if voll:
        # Backenbart: der Bart laeuft vom Kiefer vor dem Ohr hinauf bis unter die Muetze (Mr. Alex 19.11.: Uebergang vom Kinn zum Backenbart)
        for s in (-1, 1):
            for x, y, z, dick in ((0.094, -0.066, 0.050, 0.026), (0.106, -0.056, 0.082, 0.025), (0.116, -0.046, 0.114, 0.023), (0.123, -0.038, 0.146, 0.021), (0.127, -0.032, 0.178, 0.019), (0.128, -0.028, 0.208, 0.018)):
                g.kugel("backenbart", k, (s * x * fx.RX / 0.140, y, z), (dick * 0.8, dick * 1.5, dick * 1.25), f["schatten"])   # Kugelreihe: sieht aus wie ein geflochtener Bart (Mr. Alex 19.11.: so lassen)
    # Kinnkette der Fellmuetze (Mr. Alex 19.11., nach seinem Foto): goldene Glieder von der Muetze an der Wange herunter und unter der Unterlippe ueber das Kinn.
    # Jedes Glied heisst kette_<Nr>_<Anteil>: mit diesem Anteil (0–100) geht es mit dem Unterkiefer mit (der Browser rechnet das, probe3d_bau.js) – oben an der Muetze 0, am Kinn 100.
    gold = g.farbe("sgt_gold", (0.95, 0.62, 0.08), 0.35, 0.2, 0.10)
    # Verlauf (Mr. Alex 19.11.): seitlich zwischen Ohr und Bartzopf herunter, dann UNTER dem Kinn durch, deutlich unter dem Bart, leicht durchhaengend
    r = fx.RX
    weg = [(r + 0.008, -0.010, MZ + 0.010), (r + 0.009, -0.012, 0.150), (r + 0.004, -0.022, 0.095), (r - 0.016, -0.040, 0.035),
           (r - 0.040, -0.070, -0.022), (0.036, -0.098, -0.047), (0.0, -0.108, -0.053)]
    glieder = []
    for i in range(len(weg) - 1):
        for j in range(4):
            t = j / 4
            glieder.append(tuple(weg[i][c] + (weg[i + 1][c] - weg[i][c]) * t for c in range(3)))
    nr = 0
    for s in (-1, 1):
        for x, y, z in glieder + ([weg[-1]] if s > 0 else []):
            if s < 0 and x == 0:
                continue
            anteil = max(0.0, min(1.0, (0.150 - z) / (0.150 - 0.035)))
            g.kugel(f"kette_{nr:02d}_{round(anteil * 100):03d}", k, (s * x, y, z), (0.0085, 0.0085, 0.0085), gold, fein=10)
            nr += 1
    return k


if __name__ == "__main__":
    fx.MW = 0.80                                        # Mund so viel schmaler wie das Gesicht
    fx.RX, fx.KR = 0.112, (0.086, 0.121, 0.093)         # schmales, langes Gesicht (Mr. Alex 19.11.: ein Fuenftel schmaler; vorher 0.140 und 0.108) (die Funktionen von tower_flex lesen diese Masse beim Bauen)
    g.neu()
    sergeantkopf("sergeantkopf", (0, 0, 0), True, "knolle")   # Mr. Alex: Kopf mit Bart, rothaarig (18.11.), Knollennase (19.11.) – gerade weil er so streng ist
    ziel = os.path.join(g.OUT, "sergeant_teile.glb")
    bpy.ops.export_scene.gltf(filepath=ziel, export_format="GLB", export_cameras=False, export_lights=False, export_animations=False, export_yup=True)
    print(f"SERGEANT sergeant_teile.glb: {os.path.getsize(ziel) / 1000:.0f} KB", flush=True)
