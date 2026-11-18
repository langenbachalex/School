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
KM, KR = (0, -0.012, 0.045), (0.097, 0.126, 0.088)    # Kiefer und Bartschatten: Mitte und Halbachsen (unten etwas vor dem Schaedel)
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
        lippe=f("flex_lippe", (0.50, 0.22, 0.20), 0.7), lippe_unten=f("flex_lippe_unten", (0.64, 0.33, 0.30), 0.7), falte=f("flex_falte", (0.60, 0.38, 0.30), 0.8),
        iris=f("flex_iris", (0.07, 0.30, 0.74), 0.2, 0.0, 0.55), augenweiss=f("augenweiss", (1.0, 1.0, 0.97), 0.25, 0.0, 0.4),
        pupille=f("pupille", (0.02, 0.015, 0.01), 0.1), glanz=f("glanz", (1.0, 1.0, 1.0), 0.2, 0.0, 2.0),
        rachen=f("rachen", (0.20, 0.03, 0.05), 0.7), zunge=f("zunge", (0.95, 0.42, 0.45), 0.6, 0.0, 0.15),
        zahn=f("zahn", (1.0, 1.0, 0.96), 0.3, 0.0, 0.35), glas=f("brille_glas", (0.015, 0.015, 0.025), 0.12, 0.4),
        gestell=f("brille_gestell", (0.03, 0.03, 0.035), 0.4))


def flexkopf(eltern=None, ort=(0, 0, 0), name="flexkopf"):
    f = farben()
    k = g.gelenk(name, eltern, ort)
    g.kugel("kopf_rund", k, (0, 0, CZ), (RX, RY, RZ), f["haut"], fein=32)
    # Bartschatten um Mund und Kiefer, an der Lippennaht geteilt: der obere Teil gehoert zum Kopf, der untere ist der Unterkiefer (siehe Mund)
    ok = g.kugel("oberkiefer", k, KM, KR, f["schatten"], fein=32)
    for v in ok.data.vertices:
        v.co.z = max(v.co.z, LZ - KM[2])
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

    # ---- Mund nach Garys Prinzip (Mr. Alex 18.11.: „der Mund ist nur obendrauf, im Konflikt mit dem Unterkiefer“):
    # Der Unterkiefer ist die untere Haelfte der Gesichtsform und klappt am Gelenk bei den Ohren nach unten; Ober- und Unterlippe sind schmale
    # Koerper an seinen Raendern, die Mundhoehle liegt dahinter. Mundwinkel: beide Lippen biegen sich (Formschluessel hoch/tief), und beim
    # Oeffnen zieht die Unterlippe ihre Winkel zur Oberlippe hinauf (Formschluessel "auf") – der offene Mund ist ein Bogen, kein Spalt.
    def vorn(x, zz, vor=0.0):
        """Vorderste Flaeche an der Stelle: Schaedel oder Kiefer."""
        q = max(0.0, 1 - (x / KR[0]) ** 2 - ((zz - KM[2]) / KR[2]) ** 2) ** 0.5
        return min(haut_vorn(x, zz), KM[1] - KR[1] * q) - vor

    def lippenlinie(hoch_l=0.0, hoch_r=0.0, dz=0.0, auf=0.0, weit=1.0, vor=0.004, tief=None, mweit=1.0, ddz=0.0, dvor=0.0):
        """mweit, ddz, dvor = Lippenform fuer einen Laut: schmaler oder breiter, hoeher oder tiefer, weiter nach vorn (siehe LAUTE)."""
        weit, dz, vor = weit * mweit, dz + ddz, vor + dvor
        if tief is not None:
            tief -= dvor
        pkt = []
        for i in range(-8, 9):
            t = i / 8
            a, h = abs(t), (hoch_l if t > 0 else hoch_r)
            x = t * weit * (0.050 + 0.020 * max(h, 0) * a)
            zz = LZ + dz * (1 - 0.8 * a ** 3) - 0.002 * a * a + (0.021 * h * a ** 2.2 if h > 0 else 0.014 * h * a * a) + auf * 0.030 * a ** 1.6
            if tief is None:
                pkt.append((x, vorn(x, min(zz, LZ + 0.004) if dz > 0 else zz, vor), zz))
            else:                                          # senkrecht zur Kieferflaeche um `tief` versenkt (ueberall gleich weit, auch an den Seiten)
                q = max(0.02, 1 - (x / KR[0]) ** 2 - ((zz - KM[2]) / KR[2]) ** 2) ** 0.5
                y = KM[1] - KR[1] * 1.006 * q
                n = (x / KR[0] ** 2, (y - KM[1]) / KR[1] ** 2, (zz - KM[2]) / KR[2] ** 2)
                l = sum(c * c for c in n) ** 0.5
                pkt.append((x - n[0] / l * tief, y - n[1] / l * tief, zz - n[2] / l * tief))
        return pkt

    # Lippenformen je Laut (Lippensynchron, Mr. Alex 18.11.): "rund" = gespitzt und nach vorn (o, u, w) · "breit" = breit gezogen (i, e)
    # · "f" = Unterlippe hoch unter die oberen Zaehne (f, v) – nur Unterlippe und Haut darunter
    LAUTE = {"rund": dict(mweit=0.56, dvor=0.0065), "breit": dict(mweit=1.17, dvor=-0.001)}
    LAUTE_UNTEN = {**LAUTE, "f": dict(ddz=0.0050, dvor=-0.0035)}
    LAUTE_HAUT = {**LAUTE_UNTEN, "rund": dict(dvor=0.0040)}   # die Haut bleibt breit: neben gespitzten Lippen darf die Mundhoehle nicht hervorschauen

    def formen(rel, laute=LAUTE, **fest):
        return {"hoch_l": rel(lippenlinie(1, 0, **fest)), "hoch_r": rel(lippenlinie(0, 1, **fest)), "tief_l": rel(lippenlinie(-1, 0, **fest)), "tief_r": rel(lippenlinie(0, -1, **fest)),
                **{n: rel(lippenlinie(**fest, **z)) for n, z in laute.items()}}

    oberlippe = g.gelenk("oberlippe", k, (0, -0.13, LZ))
    rel = lambda pkt: [(x, y + 0.13, zz - LZ) for x, y, zz in pkt]
    g.bogen_mit_formen("mundlinie", oberlippe, rel(lippenlinie(dz=0.0032)), formen(rel, dz=0.0032), 0.0040, f["lippe"], (0, 0, 0))
    zaehne = g.gelenk("zaehne", oberlippe, (0, 0, 0))
    zahn = dict(dz=-0.0034, weit=0.86, vor=-0.0015)       # obere Zahnreihe: dicht unter der Oberlippe, etwas dahinter, biegt sich mit ihr
    g.bogen_mit_formen("zahnreihe", zaehne, rel(lippenlinie(**zahn)), formen(rel, **zahn), 0.0037, f["zahn"], (0, 0, 0))   # schmal: darunter bleibt bei halb offenem Mund ein dunkler Spalt
    # blonder Schnurrbart: kraeftig, zwei Schwuenge von der Mitte nach aussen, der Mund darunter bleibt frei
    bart = g.gelenk("schnurrbart", oberlippe, (0, 0, 0))
    for s in (-1, 1):
        straenge = []
        for versatz, dick in ((0.0078, 1.0), (0.0, 1.0), (-0.0078, 1.0), (0.0, 1.6)):
            linie = []
            for i in range(13):
                t = i / 12
                x, zz = s * (0.002 + 0.060 * t), 0.086 - 0.003 * t - 0.016 * t ** 3 + versatz * (1 - 0.75 * t)
                linie.append((x, vorn(x, zz, 0.008 + 0.004 * dick * (1 - t)) + 0.13, zz - LZ))
            straenge.append(linie)
        g.bogen("bart", bart, straenge, 0.0095, f["bart"])
    g.kugel("mund", k, (0, -0.1095, LZ - 0.012), (0.045, 0.0257, 0.028), f["rachen"])                 # Mundhoehle hinter den Lippen: sichtbar, sobald der Kiefer aufklappt
    GJ = (0, 0.030, LZ + 0.012)                                                                       # Kiefergelenk: hinten bei den Ohren
    kiefer = g.gelenk("kiefer", k, GJ)
    kr = lambda pkt: [(x, y - GJ[1], zz - GJ[2]) for x, y, zz in pkt]
    uk = g.kugel("unterkiefer", kiefer, (KM[0] - GJ[0], KM[1] - GJ[1], KM[2] - GJ[2]), (KR[0] * 1.012, KR[1] * 1.006, KR[2]), f["schatten"], fein=32)   # eine Spur groesser: die Naht zum Oberkiefer ist eine saubere Kante
    for v in uk.data.vertices:
        v.co.z = min(v.co.z, LZ - KM[2])                                                               # oben flach: dort liegt die Lippennaht
    g.kugel("kinn", kiefer, (0, -0.118 - GJ[1], 0.000 - GJ[2]), (0.036, 0.026, 0.026), f["schatten"])  # deutliches Kinn
    g.kugel("mundboden", kiefer, (0, -0.075 - GJ[1], LZ - 0.0005 - GJ[2]), (0.042, 0.050, 0.003), f["rachen"])
    g.kugel("zunge", kiefer, (0, -0.098 - GJ[1], LZ + 0.001 - GJ[2]), (0.028, 0.030, 0.006), f["zunge"])
    unten = dict(dz=-0.0036)
    mit_auf = lambda fest: {**{n: kr(q) for n, q in formen(lambda q: q, LAUTE_UNTEN, **fest).items()}, "auf": kr(lippenlinie(auf=1, **fest))}
    g.bogen_mit_formen("unterlippe", kiefer, kr(lippenlinie(**unten)), mit_auf(unten), 0.0046, f["lippe_unten"], (0, 0, 0))
    # Haut unter der Unterlippe: eine glatte Flaeche, die sich mit der Unterlippe biegt. Beim Oeffnen schliesst sie die Luecke zwischen den hochgezogenen
    # Mundwinkeln und dem Kieferrand – sonst schaut dort die Mundhoehle neben den Lippen hervor. Keine Straenge: die sahen aus wie weitere Lippen (Mr. Alex 18.11.).
    reihen = [dict(dz=-0.0030 - 0.0050 * i, tief=-0.0007) for i in range(9)]   # ein Hauch vor dem Kiefer, vom Lippenrand bis unter den tiefsten Mundwinkel

    def hautflaeche(**zusatz):
        return [kr(lippenlinie(**{**h, **zusatz})) for h in reihen]

    def netz_aus(zeilen):
        punkte = [q for zeile in zeilen for q in zeile]
        n = len(zeilen[0])
        flaechen = [(r * n + c, r * n + c + 1, (r + 1) * n + c + 1, (r + 1) * n + c) for r in range(len(zeilen) - 1) for c in range(n - 1)]
        return punkte, flaechen

    punkte, flaechen = netz_aus(hautflaeche())
    netz = bpy.data.meshes.new("lippenhaut")
    netz.from_pydata(punkte, [], flaechen)
    netz.update()
    if netz.polygons[len(flaechen) // 2].normal.y > 0:     # die Flaeche muss nach vorn schauen (das Gesicht schaut nach -y)
        netz.flip_normals()
    for fl in netz.polygons:
        fl.use_smooth = True
    netz.materials.append(f["schatten"])
    lh = bpy.data.objects.new("lippenhaut", netz)
    bpy.context.scene.collection.objects.link(lh)
    lh.parent = kiefer
    lh.shape_key_add(name="Basis")
    for name, zusatz in (("hoch_l", dict(hoch_l=1)), ("hoch_r", dict(hoch_r=1)), ("tief_l", dict(hoch_l=-1)), ("tief_r", dict(hoch_r=-1)), ("auf", dict(auf=1)), *LAUTE_HAUT.items()):
        form = lh.shape_key_add(name=name)
        form.value = 0
        for ziel, q in zip(form.data, netz_aus(hautflaeche(**zusatz))[0]):
            ziel.co = q
    # ---- Haare: blond, schulterlang, unter dem Hut ----
    g.kugel("haar_hinten", k, (0, 0.036, 0.125), (0.139, 0.136, 0.160), f["blond"], fein=32)   # endet unter dem Hut, damit der Hinterkopf nicht durch die Kappe ragt
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
