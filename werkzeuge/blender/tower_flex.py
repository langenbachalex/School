"""Mr. Flex: der erste Menschenkopf fuer den gestreckten KayKit-Koerper (Machbarkeitsprobe, 18.11.2026).

Aufruf:  blender -b --python werkzeuge/blender/tower_flex.py      (wenige Sekunden)
Ausgabe: app/tower/figuren/flex_teile.glb mit dem Kopf ("flexkopf"). Der Browser (app/tower/probe3d_bau.js) steckt ihn auf den Kopfknochen.
Karikatur im Stil der Figuren, keine Fototextur: schmales langes Gesicht, hohe Stirn, kraeftige gerade Nase, Wangenknochen, schmale Lippen,
grauer Bartschatten, blonder Schnurrbart (der Mund bleibt frei), blonde Haare, hellblaue Augen.
Gesichtsaufbau und Teilenamen wie bei Gary (tower_gary.py): braue_l/r, lid_l/r, unterlid_l/r, pupille_l/r, wange_l/r, oberlippe mit mundlinie
(Formschluessel hoch_l/r, tief_l/r), mund, kiefer, zaehne, zunge. Neu fuer alle Koepfe: iris_l/r (Farbe je Figur) zwischen Augenweiss und Pupille.
Nur dieser Kopf: falte_l/r (Lachfalten), schnurrbart, sonnenbrille (abnehmbar). Masse in Metern, Ursprung am Halsansatz, das Gesicht schaut nach -y.
"""
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tower_gary as g   # nur die Bau-Helfer (kugel, bogen, gelenk ...); Gary selbst wird dabei nicht gebaut

R = math.radians
CZ, RX, RY, RZ = 0.150, 0.132, 0.150, 0.185           # Schaedel: Hoehe der Mitte und Halbachsen (schmal und lang)
LZ = 0.056                                            # Hoehe der Lippennaht
AX, AZ = 0.050, 0.172                                 # Augen: Abstand von der Mitte, Hoehe


def haut_vorn(x, z, vor=0.0):
    """y der Gesichtsflaeche an der Stelle (x, z); vor = so weit davor."""
    return -RY * max(0.02, 1 - (x / RX) ** 2 - ((z - CZ) / RZ) ** 2) ** 0.5 - vor


def farben():
    f = g.farbe
    return dict(
        haut=f("flex_haut", (0.86, 0.62, 0.50), 0.75), wange=f("flex_wange", (0.86, 0.615, 0.50), 0.75),
        schatten=f("flex_bartschatten", (0.79, 0.60, 0.52), 0.85), blond=f("flex_blond", (0.88, 0.68, 0.30), 0.7),
        bart=f("flex_schnurrbart", (0.93, 0.82, 0.52), 0.75), braue=f("flex_braue", (0.60, 0.44, 0.20), 0.8),
        lippe=f("flex_lippe", (0.36, 0.12, 0.10), 0.7), falte=f("flex_falte", (0.60, 0.38, 0.30), 0.8),
        iris=f("flex_iris", (0.22, 0.58, 1.0), 0.2, 0.0, 0.9), augenweiss=f("augenweiss", (1.0, 1.0, 0.97), 0.25, 0.0, 0.4),
        pupille=f("pupille", (0.02, 0.015, 0.01), 0.1), glanz=f("glanz", (1.0, 1.0, 1.0), 0.2, 0.0, 2.0),
        rachen=f("rachen", (0.20, 0.03, 0.05), 0.7), zunge=f("zunge", (0.95, 0.42, 0.45), 0.6, 0.0, 0.15),
        zahn=f("zahn", (1.0, 1.0, 0.96), 0.3, 0.0, 0.35), glas=f("brille_glas", (0.015, 0.015, 0.025), 0.12, 0.4),
        gestell=f("brille_gestell", (0.03, 0.03, 0.035), 0.4))


def flexkopf(eltern=None, ort=(0, 0, 0), name="flexkopf"):
    f = farben()
    k = g.gelenk(name, eltern, ort)
    g.kugel("kopf_rund", k, (0, 0, CZ), (RX, RY, RZ), f["haut"], fein=32)
    g.kugel("bartschatten", k, (0, -0.012, 0.045), (0.111, 0.126, 0.070), f["schatten"], fein=32)   # grauer Schatten um Mund und Kiefer
    # Nase: kraeftig und gerade
    g.kugel("nasenruecken", k, (0, haut_vorn(0, 0.135) - 0.010, 0.135), (0.016, 0.022, 0.046), f["haut"])
    g.kugel("nasenspitze", k, (0, -0.171, 0.098), (0.021, 0.022, 0.018), f["haut"])
    for s in (-1, 1):
        g.kugel("nasenfluegel", k, (s * 0.018, -0.158, 0.094), (0.012, 0.014, 0.011), f["haut"])
        g.kugel("ohr", k, (s * 0.134, 0.0, 0.150), (0.013, 0.026, 0.036), f["haut"])
    for s, seite in ((-1, "r"), (1, "l")):
        # Wangenknochen: deutlich, schieben sich beim Laecheln nach oben
        wy = haut_vorn(s * 0.078, 0.105) + 0.010
        g.kugel("wange_" + seite, k, (s * 0.078, wy + 0.008, 0.105), (0.034, 0.017, 0.024), f["wange"])
        # Auge: Augenweiss, hellblaue Iris (neues Teil), kleine Pupille mit Glanzpunkt
        ay = haut_vorn(s * AX, AZ) + 0.012
        g.kugel("auge", k, (s * AX, ay, AZ), (0.028, 0.014, 0.0175), f["augenweiss"])
        g.kugel("iris_" + seite, k, (s * AX * 1.05, ay - 0.0122, AZ), (0.0128, 0.004, 0.0128), f["iris"])
        pupille = g.kugel("pupille_" + seite, k, (s * AX * 1.05, ay - 0.0152, AZ), (0.0052, 0.0028, 0.0052), f["pupille"], fein=12)
        g.kugel("glanz", pupille, (-0.0045, -0.0015, 0.0045), (0.0032, 0.002, 0.0032), f["glanz"], fein=8)
        g.oben(g.kugel("lid_" + seite, k, (s * AX, ay, AZ), (0.031, 0.0185, 0.0200), f["haut"]))
        g.unten(g.kugel("unterlid_" + seite, k, (s * AX, ay, AZ), (0.031, 0.0180, 0.0200), f["haut"]))
        # Braue: Bogen ueber dem Auge
        bz = [(s * (0.022 + 0.062 * t), 0.203 + 0.010 * math.sin(math.pi * t * 0.8)) for t in [i / 8 for i in range(9)]]
        g.bogen("braue_" + seite, k, [(x, haut_vorn(x, z, 0.004), z) for x, z in bz], 0.0055, f["braue"], ursprung=(s * 0.052, haut_vorn(s * 0.052, 0.207, 0.004), 0.207))
        # Lachfalten aussen am Auge (der Browser zeigt sie beim Grinsen)
        ex = s * 0.083
        falten = [[(ex, haut_vorn(ex, AZ, 0.002), AZ), (ex + s * 0.018 * math.cos(w), haut_vorn(ex + s * 0.018 * math.cos(w), AZ + 0.018 * math.sin(w), 0.002), AZ + 0.018 * math.sin(w))] for w in (R(38), R(4), R(-30))]
        g.bogen("falte_" + seite, k, falten, 0.0016, f["falte"], ursprung=(ex, haut_vorn(ex, AZ, 0.002), AZ))

    # ---- Mund: schmale Lippenlinie auf der Gesichtsflaeche, Unterkiefer am Gelenk ----
    def lippenlinie(hoch_l=0.0, hoch_r=0.0):
        pkt = []
        for i in range(-8, 9):
            t = i / 8
            a, h = abs(t), (hoch_l if t > 0 else hoch_r)
            x = t * (0.052 + 0.022 * max(h, 0) * a)
            z = LZ - 0.002 * a * a + (0.021 * h * a ** 2.2 if h > 0 else 0.014 * h * a * a)
            pkt.append((x, haut_vorn(x, z, 0.007), z))
        return pkt

    oberlippe = g.gelenk("oberlippe", k, (0, -0.13, LZ))
    rel = lambda pkt: [(x, y + 0.13, z - LZ) for x, y, z in pkt]
    g.bogen_mit_formen("mundlinie", oberlippe, rel(lippenlinie()), {"hoch_l": rel(lippenlinie(1, 0)), "hoch_r": rel(lippenlinie(0, 1)),
                       "tief_l": rel(lippenlinie(-1, 0)), "tief_r": rel(lippenlinie(0, -1))}, 0.0042, f["lippe"], (0, 0, 0))
    zaehne = g.gelenk("zaehne", oberlippe, (0, 0, 0))
    g.kugel("zahnreihe", zaehne, (0, haut_vorn(0, LZ - 0.008, 0.009) + 0.13, -0.0085), (0.036, 0.006, 0.0085), f["zahn"])   # eine helle Reihe: auch klein gut lesbar
    # blonder Schnurrbart: kraeftig, zwei Schwuenge von der Mitte nach aussen, die Lippenlinie darunter bleibt frei
    bart = g.gelenk("schnurrbart", oberlippe, (0, 0, 0))
    for s in (-1, 1):
        straenge = []
        for versatz, dick in ((0.0078, 1.0), (0.0, 1.0), (-0.0078, 1.0), (0.0, 1.6)):
            linie = []
            for i in range(13):
                t = i / 12
                x, z = s * (0.002 + 0.060 * t), 0.086 - 0.003 * t - 0.016 * t ** 3 + versatz * (1 - 0.75 * t)
                linie.append((x, haut_vorn(x, z, 0.008 + 0.004 * dick * (1 - t)) + 0.13, z - LZ))
            straenge.append(linie)
        g.bogen("bart", bart, straenge, 0.0095, f["bart"])
    g.oben(g.kugel("mund", k, (0, -0.116, LZ - 0.029), (0.040, 0.020, 0.028), f["rachen"]))          # Mundhoehle: der Browser macht sie hoeher, wenn der Mund aufgeht
    kiefer = g.gelenk("kiefer", k, (0, -0.02, LZ))
    kinn = g.kugel("kinn", kiefer, (0, -0.050, -0.024), (0.068, 0.0715, 0.058), f["schatten"], fein=32)
    for v in kinn.data.vertices:
        v.co.z = min(v.co.z, 0.024)                                                                    # oben flach: dort liegt die Lippennaht
    g.kugel("zunge", kiefer, (0, -0.078, 0.001), (0.026, 0.030, 0.006), f["zunge"])
    lippe_unten = [(0.060 * math.sin(R(w)), -0.050 - 0.066 * math.cos(R(w)), 0.0) for w in range(-60, 61, 10)]
    g.bogen("unterlippe", kiefer, lippe_unten, 0.003, f["lippe"])
    # ---- Haare: blond, schulterlang, unter dem Hut ----
    g.kugel("haar_hinten", k, (0, 0.036, 0.170), (0.140, 0.134, 0.176), f["blond"], fein=32)
    g.kugel("haar_nacken", k, (0, 0.085, 0.010), (0.125, 0.062, 0.150), f["blond"])
    for s in (-1, 1):
        g.kugel("haar_seite", k, (s * 0.138, 0.014, 0.085), (0.034, 0.052, 0.170), f["blond"], (0, R(s * -5), 0))
    # ---- Sonnenbrille: eigenes Gelenk an der Nasenwurzel, der Browser schiebt sie herunter oder blendet sie aus ----
    b = g.gelenk("sonnenbrille", k, (0, -0.150, AZ))
    for s, seite in ((-1, "r"), (1, "l")):
        g.kugel("glas_" + seite, b, (s * AX, -0.008, -0.002), (0.034, 0.0045, 0.026), f["glas"])
        g.stab("buegel", b, (s * 0.088, 0.070, 0.004), 0.003, 0.150, f["gestell"], (R(90), 0, R(s * -8)))
    g.stab("steg", b, (0, -0.030, 0.006), 0.0035, 0.046, f["gestell"], (0, R(90), 0))
    for s in (-1, 1):
        g.stab("steg_seite", b, (s * 0.021, -0.020, 0.006), 0.003, 0.024, f["gestell"], (R(90), 0, R(s * 30)))
    return k


if __name__ == "__main__":
    g.neu()
    flexkopf()
    ziel = os.path.join(g.OUT, "flex_teile.glb")
    bpy.ops.export_scene.gltf(filepath=ziel, export_format="GLB", export_cameras=False, export_lights=False, export_animations=False, export_yup=True)
    print(f"FLEX flex_teile.glb: {os.path.getsize(ziel) / 1000:.0f} KB", flush=True)
