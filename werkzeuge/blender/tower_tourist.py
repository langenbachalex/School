"""Der verirrte Tourist: Kopf fuer den gestreckten KayKit-Rogue (Figuren 9, 20.11.2026).

Aufruf:  blender -b --python werkzeuge/blender/tower_tourist.py      (wenige Sekunden)
Ausgabe: app/tower/figuren/tourist_teile.glb mit dem Kopf "touristkopf". Der Browser (app/tower/probe3d_bau.js, TOURIST) steckt ihn auf den Kopfknochen.
Der Kopf ist der von Mr. Flex (tower_flex.py, gleiche Teilenamen, gleicher Mund) mit anderen Farben und Teilen (Mr. Alex 20.11.):
Sonnenbrand mit hellem Abdruck einer Sonnenbrille um die Augen, abstehende Ohren, orange Haare, darauf eine viel zu kleine Kappe mit Union Jack
(eigenes Gelenk "kappe" am Scheitel). Kein Bart, keine Brille.
"""
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tower_flex as fx
import tower_gary as g
from tower_rabe import stoff

BRAND, BLASS, ORANGE = (0.95, 0.47, 0.40), (1.0, 0.90, 0.82), (0.95, 0.40, 0.03)   # sonnenverbrannte Haut · helle Haut unter der Brille · Haare
BLAU, ROT, WEISS = (0.02, 0.05, 0.32), (0.80, 0.03, 0.05), (0.95, 0.95, 0.93)


def touristkopf(name="touristkopf", ort=(0, 0, 0)):
    f = fx.farben("tou", haut=BRAND, wange=(0.96, 0.38, 0.33), bartschatten=BRAND, schnurrbart=BRAND, braue=(0.85, 0.36, 0.04), falte=(0.70, 0.24, 0.20))
    k = fx.flexkopf(None, ort, name, f=f, ohr=(0.022, 0.030, 0.044, 0.9), haare=False, brille=False, bart=(0.004, 0.001, 0.0), braue=0.0065)
    blass = g.farbe("tou_blass", BLASS, 0.75)

    def netz(name, eltern, punkte, flaechen, material, farben=None):
        me = bpy.data.meshes.new(name)
        me.from_pydata(punkte, [], flaechen)
        if farben:
            col = me.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
            for i, c in enumerate(farben):
                col.data[i].color = (*c, 1)
        for p in me.polygons:
            p.use_smooth = True
        me.materials.append(material)
        ob = bpy.data.objects.new(name, me)
        bpy.context.scene.collection.objects.link(ob)
        ob.parent = eltern
        return ob

    # Abdruck der Sonnenbrille (Mr. Alex 20.11.: glatt): EINE helle Flaeche je Auge, die der Woelbung des Gesichts folgt und knapp ueber der Haut liegt;
    # die Augenoeffnung bleibt frei. Dazu ein Steg ueber der Nasenwurzel.
    for s in (-1, 1):
        punkte, flaechen, N, M = [], [], 40, 5
        for i in range(N):
            w = 2 * math.pi * i / N
            for j in range(M + 1):
                t = j / M
                dx, dz = math.cos(w) * (0.030 + 0.017 * t), math.sin(w) * (0.0185 + 0.0165 * t)
                x, z = s * (fx.AX + 0.004) + dx, fx.AZ + 0.002 + dz
                punkte.append((x, fx.haut_vorn(x, z) - 0.0016 * math.sin(math.pi * min(1, t * 1.15)), z))
        for i in range(N):
            for j in range(M):
                a0, b0 = i * (M + 1) + j, ((i + 1) % N) * (M + 1) + j
                flaechen.append((a0, b0, b0 + 1, a0 + 1))
        ob = netz("brillenabdruck", k, punkte, flaechen, blass)
        ob.data.materials[0].use_backface_culling = False
    g.kugel("brillenabdruck", k, (0, fx.haut_vorn(0, fx.AZ + 0.006) + 0.002, fx.AZ + 0.006), (0.02, 0.01, 0.007), blass, fein=16)

    # Haare: orange Locken, die rund um die zu kleine Kappe hervorquellen (Mr. Alex 20.11.: die Tolle spaltete die Kappe – zurueck zu den Locken).
    # Alles bleibt unter dem Rand der Kappe oder in ihrer Kuppel, damit sie in einem Stueck auf dem Kopf sitzt.
    haar = g.farbe("tou_haar", ORANGE, 0.8)
    oben = fx.CZ + fx.RZ
    g.kugel("haar_hinten", k, (0, 0.03, fx.CZ + 0.012), (fx.RX + 0.006, fx.RY + 0.004, fx.RZ + 0.004), haar, fein=32)
    for s in (-1, 1):
        for x, y, z, dick, dreh in ((fx.RX + 0.012, 0.0, oben - 0.085, 0.036, 0.5), (fx.RX + 0.02, 0.03, oben - 0.115, 0.034, 0.9), (fx.RX - 0.03, -0.085, oben - 0.07, 0.03, 0.3), (0.045, -0.115, oben - 0.068, 0.03, 0.1),
                                  (fx.RX - 0.01, 0.09, oben - 0.1, 0.034, 0.6), (0.05, 0.14, oben - 0.105, 0.034, 0.2)):
            g.kugel("haar_bueschel", k, (s * x, y, z), (dick * 1.3, dick, dick * 0.8), haar, dreh=(0, s * -dreh, 0), fein=14)

    # Kappe (Mr. Alex 20.11., nach seinen Bildern): eine richtige Baseballkappe, die Flagge gross ueber die ganze Kuppel, roter Schirm. Sie ist ihm zu klein und sitzt
    # fest oben auf dem Kopf, leicht schief – rundum quellen die Locken darunter hervor. Eigenes Gelenk "kappe".
    kap = g.gelenk("kappe", k, (0.004, 0.012, oben - 0.03))
    kap.rotation_euler = (math.radians(8), math.radians(4), 0)
    stoffbild, rot = stoff("tou_kappe", 0.75), g.farbe("tou_rot", ROT, 0.6)
    KX, KY, KZ = 0.116, 0.124, 0.092

    def flagge(u, v):                                     # u quer, v nach vorn (je -1..1): rotes Kreuz mit weissem Rand, weisse Schraegen mit rotem Kern, blaue Felder
        au, av = abs(u), abs(v)
        if au < 0.13 or av < 0.13:
            return ROT
        if au < 0.24 or av < 0.24:
            return WEISS
        d = abs(au - av) / 1.414
        return ROT if d < 0.045 else WEISS if d < 0.13 else BLAU

    punkte, flaechen, farben, N, M = [], [], [], 96, 28
    for j in range(M + 1):
        th = (math.pi / 2) * j / M
        for i in range(N):
            ph = 2 * math.pi * i / N
            x, y = KX * math.cos(th) * math.cos(ph), KY * math.cos(th) * math.sin(ph)
            hoch = KZ * math.sin(th) ** 0.8 * (1 + 0.1 * max(0.0, -math.sin(ph)) * math.cos(th))   # vorn etwas hoeher und steiler: die feste Stirn einer Baseballkappe
            punkte.append((x, y, hoch))
            farben.append(flagge(x / KX, y / KY))
    for j in range(M):
        for i in range(N):
            a0, b0 = j * N + i, j * N + (i + 1) % N
            flaechen.append((a0, b0, b0 + N, a0 + N))
    netz("kappe_kuppel", kap, punkte, flaechen, stoffbild, farben)
    schirm = g.kugel("kappe_schirm", kap, (0, -KY - 0.04, 0.008), (0.082, 0.082, 0.007), rot, fein=28)
    for p in schirm.data.vertices:
        p.co.z -= 3.0 * p.co.x ** 2                       # der Schirm ist zu den Seiten hin nach unten gebogen
    g.kugel("kappe_knopf", kap, (0, 0, KZ), (0.012, 0.012, 0.007), rot, fein=10)
    return k


if __name__ == "__main__":
    g.neu()
    touristkopf()
    ziel = os.path.join(g.OUT, "tourist_teile.glb")
    bpy.ops.export_scene.gltf(filepath=ziel, export_format="GLB", export_cameras=False, export_lights=False, export_animations=False, export_yup=True, export_vertex_color="MATERIAL")
    print(f"TOURIST tourist_teile.glb: {os.path.getsize(ziel) / 1000:.0f} KB", flush=True)
