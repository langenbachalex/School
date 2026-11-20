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

BRAND, BLASS, ORANGE = (1.0, 0.36, 0.30), (1.0, 0.90, 0.82), (0.19, 0.085, 0.03)   # Mr. Alex 20.11.: Haut roetlicher; Haare braun statt orange (der Name ORANGE ist geblieben)   # sonnenverbrannte Haut · helle Haut unter der Brille · Haare
BLAU, ROT, WEISS = (0.02, 0.05, 0.32), (0.80, 0.03, 0.05), (0.95, 0.95, 0.93)


def touristkopf(name="touristkopf", ort=(0, 0, 0)):
    f = fx.farben("tou", haut=BRAND, wange=BRAND, bartschatten=BRAND, schnurrbart=BRAND, braue=(0.16, 0.07, 0.025), iris=(0.22, 0.09, 0.02), falte=(0.70, 0.24, 0.20))
    k = fx.flexkopf(None, ort, name, f=f, ohr=(0.022, 0.030, 0.044, 0.9), haare=False, brille=False, bart=(0.004, 0.001, 0.0), braue=0.0065)
    for sx in (-1, 1):                                    # Goofy-Freundlichkeit (Mr. Alex 20.11.): zwei grosse Schneidezaehne unter der Oberlippe
        g.kugel("schneidezahn", k, (sx * 0.0115, fx.gesicht_vorn(0, fx.LZ) - 0.0005, fx.LZ - 0.011), (0.0105, 0.005, 0.016), f["zahn"], fein=12)
    for ob in k.children:                                 # viel weichere Wangen (Mr. Alex 20.11.): flacher, groesser, in Hautfarbe – sie heben sich kaum vom Gesicht ab
        if ob.name.startswith("wange"):
            for p in ob.data.vertices:                    # in den Punkten, nicht im Massstab: den setzt der Browser beim Laecheln neu
                p.co.x, p.co.y, p.co.z = p.co.x * 1.25, p.co.y * 0.4, p.co.z * 1.25

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

    # Haare (Mr. Alex 20.11.: keine Wuelste, EIN Teil, die Muetze liegt darauf): eine glatte Haube wie ein Topfschnitt – orange, gerader Pony knapp ueber den Brauen,
    # an den Seiten bis ueber die Ohren, hinten bis in den Nacken; der Rand ist leicht gewellt und nach innen umgeschlagen, damit die Haube Dicke hat.
    haar = g.farbe("tou_haar", ORANGE, 0.7)
    oben = fx.CZ + fx.RZ
    hx, hy, hz, hcy, hcz = fx.RX + 0.014, fx.RY + 0.014, fx.RZ + 0.012, 0.006, fx.CZ + 0.004
    punkte, flaechen, N, M = [], [], 72, 22
    for i in range(N):
        ph = 2 * math.pi * i / N
        vorn, hinten = max(0.0, -math.sin(ph)), max(0.0, math.sin(ph))
        rand = 0.168 + vorn ** 2 * 0.082 - hinten ** 2 * 0.075 + 0.005 * math.sin(7 * ph)   # Hoehe des Haarrands: Pony vorn, Ohren, Nacken
        ende = math.acos(max(-1.0, min(1.0, (rand - hcz) / hz)))
        for j in range(M + 1):
            th = max(0.02, ende * j / M)
            punkte.append((hx * math.sin(th) * math.cos(ph), hcy + hy * math.sin(th) * math.sin(ph), hcz + hz * math.cos(th)))
        th = ende
        punkte.append((0.9 * hx * math.sin(th) * math.cos(ph), hcy + 0.9 * hy * math.sin(th) * math.sin(ph), hcz + hz * math.cos(th) + 0.006))   # umgeschlagener Rand
    for i in range(N):
        for j in range(M + 1):
            a0, b0 = i * (M + 2) + j, ((i + 1) % N) * (M + 2) + j
            flaechen.append((a0, a0 + 1, b0 + 1, b0))
    netz("haar_haube", k, punkte, flaechen, haar)

    # Kappe (Mr. Alex 20.11., nach seinen Bildern): eine richtige Baseballkappe, die Flagge gross ueber die ganze Kuppel, roter Schirm. Sie ist ihm zu klein und sitzt
    # fest oben auf der Haarhaube, leicht schief. Eigenes Gelenk "kappe".
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
