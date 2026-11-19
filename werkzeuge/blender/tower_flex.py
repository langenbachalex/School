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
KM, KR = (0, -0.012, 0.045), (0.097, 0.119, 0.088)    # Kiefer: Mitte und Halbachsen (unten nur wenig vor dem Schaedel, damit er glatt ins Gesicht uebergeht; bis 19.11. 0.126)
MW = 1.0                                              # Mundbreite gegenueber Mr. Flex (schmale Gesichter: kleiner, sonst haengen die Lippen seitlich in der Luft)
KINN = ((0, -0.110, 0.000), (0.034, 0.026, 0.026))    # Kinn: Mitte und Halbachsen; verschmilzt mit dem Kiefer zu einer Flaeche (kopfhaut)
GJ = (0, 0.030, LZ)                                   # Kiefergelenk: hinten bei den Ohren, auf Hoehe der Lippennaht
WEICH = 0.008                                         # so weich gehen Schaedel, Kiefer und Kinn ineinander ueber (m)
AX, AZ = 0.050, 0.172                                 # Augen: Abstand von der Mitte, Hoehe


def haut_vorn(x, z, vor=0.0):
    """y der Gesichtsflaeche an der Stelle (x, z); vor = so weit davor."""
    return -RY * max(0.02, 1 - (x / RX) ** 2 - ((z - CZ) / RZ) ** 2) ** 0.5 - vor


def gesicht_vorn(x, z):
    """Vorderste Flaeche des Gesichts an der Stelle (x, z): Schaedel oder Kiefer."""
    q = max(0.0, 1 - (x / KR[0]) ** 2 - ((z - KM[2]) / KR[2]) ** 2) ** 0.5
    return min(haut_vorn(x, z), KM[1] - KR[1] * q)


def hautfeld(p):
    """Gesichtsflaeche als Feld: < 0 innen, > 0 aussen (m); weiche Vereinigung von Schaedel, Kiefer und Kinn – dieselbe Flaeche wie kopfhaut."""
    werte = []
    for c, r in (((0, 0, CZ), (RX, RY, RZ)), (KM, KR), KINN):
        werte.append((sum(((p[n] - c[n]) / r[n]) ** 2 for n in range(3)) ** 0.5 - 1) * min(r))
    return -WEICH * math.log(sum(math.exp(-w / WEICH) for w in werte))


def mundloch(breiten):
    """So weit seitlich (Winkel vom Kiefergelenk aus, Grad) ist die Kopfhaut am Mund offen; daneben liegt die Wange (Gitterlinie von kopfhaut)."""
    mundrand = math.degrees(math.asin(min(1.0, 0.056 * MW / 0.155)))
    schritt = 176 / (breiten - 1)
    return min(-88 + schritt * i for i in range(breiten - 1) if -88 + schritt * (i + 0.5) >= mundrand)


def kopfhaut(k, kiefer, f, breiten=25, laengen=72, kiefer_bis=-100):
    """Haut des Kopfes als EINE glatt verschmolzene Flaeche aus Schaedel, Kiefer und Kinn (Mr. Alex 19.11.: der Kiefer war deutlich abgesetzt,
    andere Helligkeit, zackige Grenzlinie). Zwei Netze auf derselben Flaeche: "kopfhaut" (fest) und "unterkiefer" (klappt am Gelenk GJ auf).
    Das Gitter dreht sich um die Achse durch das Kiefergelenk: die Lippennaht (vorn, waagrecht) und der hintere Rand des Unterkiefers sind
    Gitterlinien, die Raender passen genau aufeinander. Die Richtung der Flaeche (Normale) kommt aus der Formel, darum gibt es an den Raendern
    keinen Helligkeitssprung. Unter dem Unterkiefer liegt eine etwas kleinere Innenflaeche, damit beim Oeffnen kein Loch entsteht."""
    kugeln = [((0, 0, CZ), (RX, RY, RZ)), (KM, KR), KINN]

    def teil(p, i):
        c, r = kugeln[i]
        return (sum(((p[n] - c[n]) / r[n]) ** 2 for n in range(3)) ** 0.5 - 1) * min(r)

    def feld(p):                                          # < 0 innen, > 0 aussen; weiche Vereinigung der drei Kugeln
        return -WEICH * math.log(sum(math.exp(-teil(p, i) / WEICH) for i in range(3)))

    def richtung(p, e=0.0015):
        n = [feld([p[m] + (e if m == a else 0) for m in range(3)]) - feld([p[m] - (e if m == a else 0) for m in range(3)]) for a in range(3)]
        l = sum(c * c for c in n) ** 0.5
        return tuple(c / l for c in n)

    def rand(d):                                          # Abstand der Flaeche vom Gelenk in Richtung d
        innen, aussen = 0.0, 0.45
        for _ in range(26):
            m = (innen + aussen) / 2
            if feld([GJ[n] + d[n] * m for n in range(3)]) < 0:
                innen = m
            else:
                aussen = m
        return (innen + aussen) / 2

    spalten = range(laengen)
    winkel = lambda j: math.radians(j * 360 / laengen if j * 360 / laengen <= 180 else j * 360 / laengen - 360)   # 0 = nach vorn, plus = nach oben
    im_kiefer = lambda j: kiefer_bis < math.degrees(winkel(j)) < 0
    am_kiefer = lambda j: kiefer_bis <= math.degrees(winkel(j)) <= 0
    lappen = lambda j: 0 < math.degrees(winkel(j)) <= 15   # seitlich reicht der Unterkiefer ein Stueck ueber die Lippennaht hinauf: klappt er auf, entsteht an der Wange kein Spalt
    mundrand = math.degrees(math.asin(min(1.0, 0.056 * MW / 0.155)))   # so weit seitlich reicht der Mund (Winkel vom Gelenk aus); daneben ist die Wange geschlossen
    seite = lambda i: abs(-88 + 176 * (i + 0.5) / (breiten - 1)) >= mundrand

    def bauen(name, eltern, ursprung, welche, innen, material_fuer):
        punkte, normalen, nr = [], [], {}
        for i in range(breiten):
            a = math.radians(-88 + 176 * i / (breiten - 1))
            for j in welche:
                w = winkel(j)
                d = (math.sin(a), -math.cos(a) * math.cos(w), math.cos(a) * math.sin(w))
                r = rand(d)
                p = [GJ[n] + d[n] * r for n in range(3)]
                normalen.append(richtung(p))
                if innen and im_kiefer(j):
                    p = [GJ[n] + d[n] * r * 0.955 for n in range(3)]
                if not innen and lappen(j):
                    p = [GJ[n] + d[n] * r * 1.006 for n in range(3)]
                nr[(i, j)] = len(punkte)
                punkte.append(tuple(p[n] - ursprung[n] for n in range(3)))
        flaechen, stoffe = [], []
        for i in range(breiten - 1):
            for j in welche:
                j2 = (j + 1) % laengen
                if (i, j2) not in nr or (not innen and not ((am_kiefer(j) and am_kiefer(j2)) or (seite(i) and (am_kiefer(j) or lappen(j)) and lappen(j2)))):
                    continue
                if innen and -45 < math.degrees(winkel(j)) < 0 and not seite(i):
                    continue                              # Loch in der Innenflaeche: dahinter liegt die Mundhoehle
                flaechen.append((nr[(i, j)], nr[(i + 1, j)], nr[(i + 1, j2)], nr[(i, j2)]))
                mitte = [sum(punkte[e][n] for e in flaechen[-1]) / 4 + ursprung[n] for n in range(3)]
                stoffe.append(material_fuer(mitte))
        netz = bpy.data.meshes.new(name)
        netz.from_pydata(punkte, [], flaechen)
        netz.update()
        m0 = [sum(punkte[e][n] for e in flaechen[0]) / 4 + ursprung[n] - GJ[n] for n in range(3)]
        if sum(netz.polygons[0].normal[n] * m0[n] for n in range(3)) < 0:
            netz.flip_normals()
        for fl, st in zip(netz.polygons, stoffe):
            fl.use_smooth = True
            fl.material_index = st
        netz.materials.append(f["haut"])
        netz.materials.append(f["schatten"])
        netz.normals_split_custom_set_from_vertices(normalen)
        ob = bpy.data.objects.new(name, netz)
        bpy.context.scene.collection.objects.link(ob)
        ob.parent = eltern
        return ob

    bart = lambda p: 1 if teil(p, 1) < teil(p, 0) + 0.009 or teil(p, 2) < teil(p, 0) else 0   # Kiefer und Kinn: Bartflaeche (bei Mr. Flex Hautfarbe)
    bauen("kopfhaut", k, (0, 0, 0), spalten, True, lambda p: bart(p) if p[2] >= LZ - 0.002 else 0)
    bauen("unterkiefer", kiefer, GJ, [j for j in spalten if am_kiefer(j) or lappen(j)], False, lambda p: bart(p) if p[2] >= LZ - 0.002 else 1)


def nasenform(k, stationen, material, n=11):
    """Ein Netz aus Ringen: jeder Ring ist ein halber Bogen von der linken Gesichtsflaeche ueber den Nasenruecken zur rechten."""
    gesicht = gesicht_vorn
    punkte = []
    for z, vor, breit in stationen:
        for i in range(n):
            w = math.pi * i / (n - 1)
            x = breit * math.cos(w)
            punkte.append((x, gesicht(x, z) + 0.004 - (vor + 0.004) * math.sin(w) ** 0.8, z))
    flaechen = [(r * n + c, r * n + c + 1, (r + 1) * n + c + 1, (r + 1) * n + c) for r in range(len(stationen) - 1) for c in range(n - 1)]
    netz = bpy.data.meshes.new("nase")
    netz.from_pydata(punkte, [], flaechen)
    netz.update()
    if netz.polygons[len(flaechen) // 2 + n // 2].normal.y > 0:   # die Flaeche muss nach vorn schauen (das Gesicht schaut nach -y)
        netz.flip_normals()
    for fl in netz.polygons:
        fl.use_smooth = True
    netz.materials.append(material)
    ob = bpy.data.objects.new("nase", netz)
    bpy.context.scene.collection.objects.link(ob)
    ob.parent = k
    return ob


def farben(vor="flex", **neu):
    """vor = Vorsilbe der Materialnamen (je Kopf eigene Farben), neu = Name -> (r, g, b) ersetzt die Farbe von Mr. Flex."""
    f = lambda name, rgb, *rest: g.farbe(name.replace("flex_", vor + "_"), neu.get(name[5:], rgb) if name.startswith("flex_") else rgb, *rest)
    return dict(
        haut=f("flex_haut", (0.86, 0.62, 0.50), 0.75), wange=f("flex_wange", (0.86, 0.62, 0.50), 0.75),
        schatten=f("flex_bartschatten", (0.86, 0.62, 0.50), 0.75), blond=f("flex_blond", (0.88, 0.68, 0.30), 0.7),
        bart=f("flex_schnurrbart", (0.93, 0.82, 0.52), 0.75), braue=f("flex_braue", (0.60, 0.44, 0.20), 0.8),
        lippe=f("flex_lippe", (0.50, 0.22, 0.20), 0.7), lippe_unten=f("flex_lippe_unten", (0.64, 0.33, 0.30), 0.7), falte=f("flex_falte", (0.60, 0.38, 0.30), 0.8),
        iris=f("flex_iris", (0.07, 0.30, 0.74), 0.2, 0.0, 0.55), augenweiss=f("augenweiss", (1.0, 1.0, 0.97), 0.25, 0.0, 0.4),
        pupille=f("pupille", (0.02, 0.015, 0.01), 0.1), glanz=f("glanz", (1.0, 1.0, 1.0), 0.2, 0.0, 2.0),
        rachen=f("rachen", (0.20, 0.03, 0.05), 0.7), zunge=f("zunge", (0.95, 0.42, 0.45), 0.6, 0.0, 0.15),
        zahn=f("zahn", (1.0, 1.0, 0.96), 0.3, 0.0, 0.35), glas=f("brille_glas", (0.015, 0.015, 0.025), 0.12, 0.4),
        gestell=f("brille_gestell", (0.03, 0.03, 0.035), 0.4))


def flexkopf(eltern=None, ort=(0, 0, 0), name="flexkopf", f=None, haare=True, brille=True, bart=(0.060, 0.0095, -0.016), braue=0.0055, nase=True, wange=(0.074, 0.108, 0.040, 0.031), fein=1):
    """f = eigene Farben (farben(...)) · haare, brille = False laesst sie weg · bart = (Laenge, Dicke, Schwung der Enden: plus = nach oben) · braue = Dicke · nase = False: der andere Kopf baut seine eigene Nase · wange = (Abstand von der Mitte, Hoehe, halbe Breite, halbe Hoehe), Farbe ueber farben(wange=...).
    Andere Koepfe (tower_sergeant.py) setzen vorher die Masse des Moduls (RX, KR ...) und haengen ihre eigenen Teile an das Gelenk, das zurueckkommt."""
    f = f or farben()
    k = g.gelenk(name, eltern, ort)
    kiefer = g.gelenk("kiefer", k, GJ)
    kopfhaut(k, kiefer, f, round(24 * fein) + 1, round(72 * fein))   # fein=1.5: feineres Gitter, wenn der Kiefer eine andere Farbe hat (Bart) – die Farbgrenze wird sonst eckig
    # Nase: kraeftig und gerade, EIN Stueck (Mr. Alex 19.11.: keine Nase mehr aus mehreren Kugeln) – Stationen (Hoehe, vor dem Gesicht, halbe Breite)
    if nase:
        nasenform(k, [(0.188, 0.002, 0.008), (0.174, 0.009, 0.012), (0.158, 0.017, 0.014), (0.142, 0.025, 0.015), (0.126, 0.034, 0.017), (0.112, 0.043, 0.022),
                      (0.100, 0.049, 0.027), (0.089, 0.045, 0.028), (0.080, 0.029, 0.023), (0.075, 0.008, 0.012)], f["haut"])
    # Hals (Mr. Alex 19.11.: Figuren ohne Kragen): hautfarbener Zylinder unter dem Kopf, steckt unten in der Schulterkappe des Koerpers (probe3d_bau.js, kragenWeg)
    g.stab("hals", k, (0, 0.012, -0.060), 0.050, 0.150, f["haut"])
    for s in (-1, 1):
        g.kugel("ohr", k, (s * (RX + 0.002), 0.0, 0.150), (0.013, 0.026, 0.036), f["haut"])
    for s, seite in ((-1, "r"), (1, "l")):
        # Wangenknochen: deutlich, schieben sich beim Laecheln nach oben
        # flach, breit und in Hautfarbe (Mr. Alex 19.11.: soll wie ein Teil des Gesichts aussehen, nicht wie ein angeklebter Klotz) – nur eine sanfte Woelbung
        # In Ruhe liegt sie fast buendig in der Gesichtsflaeche; beim Laecheln hebt und woelbt der Browser sie (baueGesicht, opt.wangeVor). Lage und Groesse je Kopf.
        wy = haut_vorn(s * wange[0], wange[1])
        g.kugel("wange_" + seite, k, (s * wange[0], wy + 0.0092, wange[1]), (wange[2], 0.0105, wange[3]), f["wange"], fein=32)
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
        g.bogen("braue_" + seite, k, [(x, haut_vorn(x, z, 0.004), z) for x, z in bz], braue, f["braue"], ursprung=(s * 0.052, haut_vorn(s * 0.052, 0.207, 0.004), 0.207))
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

    def auf_kiefer(x, zz, tief):
        """Punkt auf der echten Gesichtsflaeche (Schaedel, Kiefer und Kinn weich verschmolzen, wie kopfhaut) bei (x, zz), senkrecht dazu um `tief`
        versenkt (minus = davor). Bis 19.11. lag der Punkt auf der Kieferkugel allein: seitlich am Mundwinkel liegt die aber bis 1 cm hinter dem
        Gesicht, dort tauchten Lippe und Haut ab und es blieb ein Spalt neben dem Mundwinkel (Mr. Alex 19.11.)."""
        aussen, innen = -0.30, KM[1]
        if hautfeld((x, innen, zz)) >= 0:                  # ausserhalb des Kopfes (kommt bei den Massen der Koepfe nicht vor): alte Rechnung
            q = max(0.02, 1 - (x / KR[0]) ** 2 - ((zz - KM[2]) / KR[2]) ** 2) ** 0.5
            return (x, KM[1] - KR[1] * 1.006 * q + tief, zz)
        for _ in range(24):
            m = (aussen + innen) / 2
            if hautfeld((x, m, zz)) < 0:
                innen = m
            else:
                aussen = m
        p = (x, (aussen + innen) / 2, zz)
        e = 0.0015
        n = [hautfeld([p[m] + (e if m == a else 0) for m in range(3)]) - hautfeld([p[m] - (e if m == a else 0) for m in range(3)]) for a in range(3)]
        l = sum(c * c for c in n) ** 0.5
        return tuple(p[a] - n[a] / l * tief for a in range(3))

    def lippenlinie(hoch_l=0.0, hoch_r=0.0, dz=0.0, auf=0.0, weit=1.0, vor=0.004, tief=None, mweit=1.0, ddz=0.0, dvor=0.0, spitz=0.8, ende=None, sanft=False):
        """mweit, ddz, dvor = Lippenform fuer einen Laut: schmaler oder breiter, hoeher oder tiefer, weiter nach vorn (siehe LAUTE).
        spitz = so stark laufen die Linien am Mundwinkel zusammen (Lippen 0.8; die Haut darunter 0: ihre Reihen bleiben auch am Mundwinkel untereinander).
        ende = so tief liegt die Linie ganz am Mundwinkel in der Haut (Unterlippe: sie laeuft dort aus und verschwindet unter dem Ende der Oberlippe,
        statt mit einem stumpfen Ende daneben zu stehen – Mr. Alex 19.11.)"""
        weit, dz, vor = weit * mweit, dz + ddz, vor + dvor
        if tief is not None:
            tief -= dvor
        pkt = []
        for i in range(-8, 9):
            t = i / 8
            a, h = abs(t), (hoch_l if t > 0 else hoch_r)
            x = t * weit * MW * (0.050 + 0.020 * max(h, 0) * a)
            zz = LZ + dz * (1 - spitz * a ** 3) - 0.002 * a * a + (0.021 * h * a ** 2.2 if h > 0 else 0.014 * h * a * a) + auf * 0.030 * a ** 1.6
            if tief is None:
                pkt.append((x, vorn(x, min(zz, LZ + 0.004) if dz > 0 else zz, vor), zz))
            else:                                          # senkrecht zur Kieferflaeche um `tief` versenkt (ueberall gleich weit, auch an den Seiten)
                tf = tief + dvor * a * a if sanft else tief        # sanft (Haut): nur in der Mitte mit den gespitzten Lippen nach vorn, am Mundwinkel bleibt sie auf dem Gesicht – sonst schaut man hinter ihren Rand in den Mund
                pkt.append(auf_kiefer(x, zz, tf if ende is None else tf + (ende - tf) * a ** 6))
        return pkt

    # Lippenformen je Laut (Lippensynchron, Mr. Alex 18.11.): "rund" = gespitzt und nach vorn (o, u, w) · "breit" = breit gezogen (i, e)
    # · "f" = Unterlippe hoch unter die oberen Zaehne (f, v) – nur Unterlippe und Haut darunter
    LAUTE = {"rund": dict(mweit=0.56, dvor=0.0065), "breit": dict(mweit=1.17, dvor=-0.001)}
    LAUTE_UNTEN = {**LAUTE, "f": dict(ddz=0.0050, dvor=-0.0035)}
    LAUTE_HAUT = {**LAUTE_UNTEN, "rund": dict(mweit=0.56, dvor=0.0040)}   # die Haut bleibt breit: neben gespitzten Lippen darf die Mundhoehle nicht hervorschauen

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
    bartgelenk = g.gelenk("schnurrbart", oberlippe, (0, 0, 0))
    for s in (-1, 1):
        straenge = []
        for versatz, dick in ((0.0078, 1.0), (0.0, 1.0), (-0.0078, 1.0), (0.0, 1.6)):
            linie = []
            for i in range(13):
                t = i / 12
                x, zz = s * (0.002 + bart[0] * t), 0.086 - 0.003 * t + bart[2] * t ** 3 + versatz * (1 - 0.75 * t)
                linie.append((x, vorn(x, zz, 0.008 + 0.004 * dick * (1 - t)) + 0.13, zz - LZ))
            straenge.append(linie)
        g.bogen("bart", bartgelenk, straenge, bart[1], f["bart"])
    g.kugel("mund", k, (0, KM[1] - KR[1] + 0.0285, LZ - 0.012), (0.045 * MW, 0.0257, 0.028), f["rachen"])                 # Mundhoehle hinter den Lippen: sichtbar, sobald der Kiefer aufklappt
    kr = lambda pkt: [(x, y - GJ[1], zz - GJ[2]) for x, y, zz in pkt]
    g.kugel("mundboden", kiefer, (0, KM[1] - KR[1] + 0.063 - GJ[1], LZ - 0.0005 - GJ[2]), (0.042 * MW, 0.050, 0.003), f["rachen"])
    g.kugel("zunge", kiefer, (0, KM[1] - KR[1] + 0.040 - GJ[1], LZ + 0.001 - GJ[2]), (0.028 * MW, 0.030, 0.006), f["zunge"])
    unten = dict(dz=-0.0036, tief=0.0015, ende=0.005, weit=0.95)   # leicht in die Gesichtsflaeche eingelassen: von der Seite steht die Unterlippe nicht weiter vor als die Oberlippe (Mr. Alex 19.11.) # auf der Kieferflaeche wie die Haut darunter (lippenhaut): sonst steht die Unterlippe bei offenem Mund vor dem Gesicht in der Luft (Mr. Alex 19.11.)
    mit_auf = lambda fest: {**{n: kr(q) for n, q in formen(lambda q: q, LAUTE_UNTEN, **fest).items()}, "auf": kr(lippenlinie(auf=1, **fest))}
    g.bogen_mit_formen("unterlippe", kiefer, kr(lippenlinie(**unten)), mit_auf(unten), 0.0046, f["lippe_unten"], (0, 0, 0))
    # Haut unter der Unterlippe: eine glatte Flaeche, die sich mit der Unterlippe biegt. Beim Oeffnen schliesst sie die Luecke zwischen den hochgezogenen
    # Mundwinkeln und dem Kieferrand – sonst schaut dort die Mundhoehle neben den Lippen hervor. Keine Straenge: die sahen aus wie weitere Lippen (Mr. Alex 18.11.).
    reihen = [dict(dz=-0.0030 - 0.0050 * i, tief=-0.0014, spitz=2.6 if i == 0 else 0.0, sanft=True) for i in range(9)]   # Reihen bleiben am Mundwinkel untereinander: die Flaeche reicht dort vom Mundwinkel bis unter den Kieferrand und schliesst die Luecke neben der Lippe (Mr. Alex 19.11.) # ein Hauch vor dem Kiefer, vom Lippenrand bis unter den tiefsten Mundwinkel

    LOCH = mundloch(round(24 * fein) + 1)
    AUSSEN = 0.074 * MW                                    # bis hierhin reicht die Haut seitlich, wie breit oder schmal die Lippen gerade sind

    def hautflaeche(**zusatz):
        """Die Haut folgt in der Mitte der Unterlippe und laeuft seitlich auf der Hoehe der Mundwinkel weiter bis zur Wange. So schliesst sie den Mund neben
        den Lippen – auch wenn sie gespitzt sind oder der Mund weit offen ist (Mr. Alex 19.11.: die Unterlippe stand in der Luft, daneben sah man in den Mund)."""
        zeilen = []
        for h in reihen:
            linie = lippenlinie(**{**h, **zusatz})
            tief = h["tief"] - zusatz.get("dvor", 0.0)
            def weiter(ende, seite):
                x0, z0 = abs(ende[0]), ende[2]
                punkte = []
                for n in (1, 2, 3):
                    q = auf_kiefer(seite * (x0 + (max(AUSSEN, x0 + 0.006) - x0) * n / 3), z0, h["tief"])
                    if math.degrees(math.asin(min(1.0, abs(q[0]) / sum((q[m] - GJ[m]) ** 2 for m in range(3)) ** 0.5))) > LOCH + 1:
                        q = auf_kiefer(q[0], z0, 0.0006)   # neben dem Mund liegt die Wange darueber: dort taucht die Haut knapp unter sie (sonst flimmern zwei Flaechen, beim Sergeant in zwei Farben)
                    punkte.append(q)
                return punkte   # neben dem Mund liegt die Haut wieder auf dem Gesicht, auch wenn die Lippen gespitzt nach vorn kommen
            zeilen.append(kr(weiter(linie[0], -1)[::-1] + linie + weiter(linie[-1], 1)))
        return zeilen

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
    if haare:
        g.kugel("haar_hinten", k, (0, 0.036, 0.125), (0.139, 0.136, 0.160), f["blond"], fein=32)   # endet unter dem Hut, damit der Hinterkopf nicht durch die Kappe ragt
        g.kugel("haar_nacken", k, (0, 0.085, 0.010), (0.125, 0.062, 0.150), f["blond"])
        for s in (-1, 1):
            g.kugel("haar_seite", k, (s * 0.138, 0.014, 0.085), (0.034, 0.052, 0.170), f["blond"], (0, R(s * -5), 0))
    # ---- Sonnenbrille: eigenes Gelenk an der Nasenwurzel, der Browser schiebt sie herunter oder blendet sie aus ----
    if brille:
        b =g.gelenk("sonnenbrille", k, (0, -0.150, AZ))
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
