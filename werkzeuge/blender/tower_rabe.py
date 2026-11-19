"""Der Rabe (Arthur und die sechs anderen): eigener Vogelkoerper mit Gefieder (Figuren 7, 19.11.2026).

Aufruf:  blender -b --python werkzeuge/blender/tower_rabe.py      (wenige Sekunden)
Ausgabe: app/tower/figuren/rabe.glb. Der Browser (app/tower/vogel_bau.js, ladeVogel) bewegt die Gelenke ueber ihre Namen.
Vorbild: die echten Tower-Raben (Fotos Mr. Alex 19.11.) – riesig, steil aufrecht, schwerer Hakenschnabel, zottige Kehle, finsterer Blick,
blauschwarzer Glanz. Der Glanz ist Farbe am Modell (Farbe je Punkt), damit er auch ohne Licht im Hof zu sehen ist.

Gebaut wird in den Massen des Browsers (x rechts, y oben, z vorn, Fuesse auf y = 0, Einheit Meter vor der Vergroesserung im Profil);
B() rechnet in die Blender-Richtung um. Alle Gelenke sind ungedreht, die Form steckt in den Punkten.
Gelenke: rabe > rabe_koerper > rabe_kehle, rabe_kopf (> rabe_schnabel_unten, rabe_auge_l/r), rabe_fluegel_l/r (> rabe_hand_l/r), rabe_schwanz · rabe > rabe_bein_l/r (> rabe_ring am rechten Bein).
"""
import math
import os
import random
import sys

import bpy
import bmesh
from mathutils import Matrix, Vector as V

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tower_gary as g   # nur die Bau-Helfer (farbe, gelenk, neu); Gary selbst wird dabei nicht gebaut

SCHWARZ, BLAU, VIOLETT = (0.010, 0.010, 0.018), (0.040, 0.075, 0.21), (0.055, 0.060, 0.22)
HORN, HORN_HELL, KRALLE = (0.010, 0.010, 0.014), (0.04, 0.047, 0.065), (0.004, 0.004, 0.005)
BEIN, BEIN_HELL = (0.011, 0.011, 0.015), (0.03, 0.033, 0.042)
X = V((1, 0, 0))


def B(v):
    return (v.x, -v.z, v.y)


def mix(a, b, t):
    t = max(0.0, min(1.0, t))
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


def stoff(name, rau):
    """Material, dessen Farbe aus der Farbe je Punkt kommt (so kommt sie auch in die glb-Datei)."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    c = m.node_tree.nodes.new("ShaderNodeVertexColor")
    c.layer_name = "Col"
    m.node_tree.links.new(c.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = rau
    return m


class Teil:
    """Ein Gelenk und die Punkte, die daran haengen. Punkte werden in Weltmassen angegeben."""

    def __init__(self, name, eltern, ort):
        self.name, self.ort, self.v, self.f, self.c, self.n = name, V(ort), [], [], [], 0
        self.ob = g.gelenk(name, eltern.ob if eltern else None, B(self.ort - (eltern.ort if eltern else V((0, 0, 0)))))

    def punkt(self, p, farbe):
        self.v.append(B(p - self.ort))
        self.c.append(farbe)
        return len(self.v) - 1

    def netz(self, mat, geschlossen=False):
        self.n += 1
        me = bpy.data.meshes.new(f"{self.name}_netz{self.n}")
        me.from_pydata(self.v, [], self.f)
        if geschlossen:
            bm = bmesh.new()
            bm.from_mesh(me)
            bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
            bm.to_mesh(me)
            bm.free()
        col = me.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
        for i, c in enumerate(self.c):
            col.data[i].color = (*c, 1)
        for p in me.polygons:
            p.use_smooth = True
        me.materials.append(mat)
        ob = bpy.data.objects.new(me.name, me)
        bpy.context.scene.collection.objects.link(ob)
        ob.parent = self.ob
        self.v, self.f, self.c = [], [], []
        return ob


def ellipsoid(t, c, ex, ey, ez, farbe, n=14, m=9):
    """ex, ey, ez = Halbachsen als Vektoren. farbe(p, nach_aussen) -> rgb"""
    c = V(c)
    reihen = []
    for i in range(m + 1):
        th = math.pi * i / m
        reihe = []
        for j in range(1 if i in (0, m) else n):
            ph = 2 * math.pi * j / n
            d = V((math.sin(th) * math.cos(ph), math.cos(th), math.sin(th) * math.sin(ph)))
            p = c + ex * d.x + ey * d.y + ez * d.z
            reihe.append(t.punkt(p, farbe(p, (p - c).normalized())))
        reihen.append(reihe)
    for i in range(m):
        a, b = reihen[i], reihen[i + 1]
        for j in range(n):
            k = (j + 1) % n
            if len(a) == 1:
                t.f.append((a[0], b[k], b[j]))
            elif len(b) == 1:
                t.f.append((a[j], a[k], b[0]))
            else:
                t.f.append((a[j], a[k], b[k], b[j]))


def rohr(t, punkte, radien, oben, farbe, n=10):
    """Schlauch entlang der Punkte; radien = (seitlich, hoch) je Punkt, (0, 0) = Spitze. farbe(i, winkel_oben 0..1) -> rgb"""
    ringe = []
    for i, p in enumerate(punkte):
        p = V(p)
        tang = (V(punkte[min(i + 1, len(punkte) - 1)]) - V(punkte[max(i - 1, 0)])).normalized()
        seite = tang.cross(oben).normalized()
        hoch = seite.cross(tang).normalized()
        rx, ry = radien[i]
        if rx == 0:
            ringe.append([t.punkt(p, farbe(i, 0.5))])
        else:
            ringe.append([t.punkt(p + seite * (rx * math.cos(2 * math.pi * j / n)) + hoch * (ry * math.sin(2 * math.pi * j / n)), farbe(i, 0.5 + 0.5 * math.sin(2 * math.pi * j / n))) for j in range(n)])
    mitte = t.punkt(V(punkte[0]), farbe(0, 0.5))
    for j in range(n):
        t.f.append((mitte, ringe[0][j], ringe[0][(j + 1) % n]))
    for a, b in zip(ringe, ringe[1:]):
        for j in range(n):
            k = (j + 1) % n
            t.f.append((a[j], a[k], b[0]) if len(b) == 1 else (a[j], a[k], b[k], b[j]))


def feder(t, p, d, m, lang, breit, heben=0.0, ton=None, glanz=1.0):
    """Eine Feder: Ansatz p, zeigt nach d, Oberseite nach m. Der Grat schimmert blau oder violett, die Raender sind schwarz."""
    d = d.normalized()
    m = (m - d * m.dot(d)).normalized()
    s = d.cross(m)
    ton = ton or random.choice((BLAU, BLAU, BLAU, VIOLETT))
    k = random.uniform(0.65, 1.15) * glanz
    reihen = []
    for tt, w in ((0, 0.5), (0.2, 0.85), (0.45, 1), (0.7, 0.8), (0.9, 0.45)):
        c = p + d * (lang * tt) + m * (0.12 * breit * math.sin(math.pi * tt) + heben * lang * tt * tt)
        hw = breit / 2 * w
        rand, grat = mix(SCHWARZ, ton, 0.22 * tt * k), mix(SCHWARZ, ton, (0.45 + 0.55 * tt) * k)
        reihen.append((t.punkt(c - s * hw, rand), t.punkt(c + m * (0.3 * hw), grat), t.punkt(c + s * hw, rand)))
    sp = t.punkt(p + d * lang + m * (heben * lang), mix(SCHWARZ, ton, 0.8 * k))
    for a, b in zip(reihen, reihen[1:]):
        t.f += [(a[0], a[1], b[1], b[0]), (a[1], a[2], b[2], b[1])]
    t.f += [(reihen[-1][0], reihen[-1][1], sp), (reihen[-1][1], reihen[-1][2], sp)]


def verschmelzen(ob, voxel, farbe):
    """Macht aus mehreren ueberlappenden Formen eine glatte Haut. farbe(ort, nach_aussen) in Blender-Richtung -> rgb"""
    mat = ob.data.materials[0]
    with bpy.context.temp_override(object=ob, active_object=ob, selected_objects=[ob]):
        m = ob.modifiers.new("haut", "REMESH")
        m.mode, m.voxel_size, m.use_smooth_shade = "VOXEL", voxel, True
        bpy.ops.object.modifier_apply(modifier="haut")
        m = ob.modifiers.new("glatt", "SMOOTH")
        m.factor, m.iterations = 0.7, 6
        bpy.ops.object.modifier_apply(modifier="glatt")
    me = ob.data
    if not me.materials:
        me.materials.append(mat)
    col = me.color_attributes.get("Col") or me.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
    for i, v in enumerate(me.vertices):
        col.data[i].color = (*farbe(v.co, v.normal), 1)
    for p in me.polygons:
        p.use_smooth = True


def dreh(v, achse, winkel):
    return Matrix.Rotation(winkel, 3, achse) @ v


def rabe():
    random.seed(7)
    gefieder, horn = stoff("gefieder", 0.42), stoff("horn", 0.3)
    auge = g.farbe("rabenauge", (0.9, 0.48, 0.02), rau=0.3, leuchten=0.7)
    pupille = g.farbe("rabenpupille", (0.0, 0.0, 0.0), rau=0.2)
    NEIG = 0.9                                                            # so steil sitzt er: Brust oben
    a, n = V((0, math.sin(NEIG), math.cos(NEIG))), V((0, math.cos(NEIG), -math.sin(NEIG)))   # Koerperachse (nach vorn oben) · Rueckenseite
    C = V((0, 0.25, 0))
    P = lambda la, ln=0.0, lx=0.0: C + a * la + n * ln + X * lx
    haut = lambda p, aus: mix(SCHWARZ, BLAU, 0.10 + 0.25 * max(0.0, aus.y))   # glatte Flaechen: oben ein wenig Schimmer
    haut_b = lambda co, no: mix(SCHWARZ, BLAU, 0.10 + 0.25 * max(0.0, no.z))

    wurzel = Teil("rabe", None, (0, 0, 0))

    # ---------- Rumpf mit Hals: eine glatte Haut, darueber Federreihen wie Schuppen ----------
    koerper = Teil("rabe_koerper", wurzel, C)
    H = P(0.17, 0.03)                                                     # Halsansatz
    K = V((0, 0.452, 0.098))                                              # Kopfgelenk: kurzer, dicker Hals – der Kopf sitzt auf den Schultern (Mr. Alex 19.11.: mit langem Hals und Halskrause sah er nach Geier aus)
    formen = [(C, X * 0.1, n * 0.1, a * 0.2), (P(0.085, -0.02), X * 0.105, n * 0.085, a * 0.11), (P(-0.15), X * 0.07, n * 0.06, a * 0.1)]
    for c, ex, ey, ez in formen:
        ellipsoid(koerper, c, ex, ey, ez, haut)
    ellipsoid(koerper, H, X * 0.068, V((0, 0.068, 0)), V((0, 0, 0.068)), haut)
    ellipsoid(koerper, (H + K) / 2, X * 0.066, V((0, 0.062, 0)), V((0, 0, 0.066)), haut)
    verschmelzen(koerper.netz(gefieder, True), 0.011, haut_b)

    def rumpf_rand(h, phi):                                               # Punkt auf der Rumpfhaut: Hoehe h auf der Achse, Winkel phi um die Achse (0 = Bauchseite)
        q, r = C + a * h, (-n * math.cos(phi) + X * math.sin(phi))
        weit = None
        for c, ex, ey, ez in formen[:2]:
            o = q - c
            o2 = V((o.dot(ex) / ex.length_squared, o.dot(ey) / ey.length_squared, o.dot(ez) / ez.length_squared))
            r2 = V((r.dot(ex) / ex.length_squared, r.dot(ey) / ey.length_squared, r.dot(ez) / ez.length_squared))
            aa, bb, cc = r2.dot(r2), 2 * o2.dot(r2), o2.dot(o2) - 1
            dis = bb * bb - 4 * aa * cc
            if dis >= 0:
                tt = (-bb + math.sqrt(dis)) / (2 * aa)
                weit = tt if weit is None else max(weit, tt)
        return (q + r * (weit + 0.003), r) if weit and weit > 0.02 else None

    for zeile, h in enumerate((0.16, 0.115, 0.07, 0.025, -0.02, -0.065, -0.11, -0.15)):
        for i in range(13):
            phi = math.radians(-160 + i * 26.6 + (13 if zeile % 2 else 0))
            pr = rumpf_rand(h, phi)
            if pr:
                feder(koerper, pr[0], -a + pr[1] * 0.12, pr[1], 0.085, 0.058, heben=0.03, glanz=0.8)
    for zeile, (y, lang) in enumerate(((0.045, 0.06), (0.015, 0.07), (-0.02, 0.08))):   # Nacken: Federn vom Hinterkopf den Ruecken hinunter
        for i in range(6):
            phi = math.radians(115 + i * 26 + (13 if zeile % 2 else 0))
            r = V((math.sin(phi), 0, math.cos(phi)))
            feder(koerper, H + r * 0.066 + V((0, y, 0)), V((0, -1, 0)) + r * 0.25 - a * 0.3, r, lang, 0.045, heben=0.04, glanz=0.9)
    koerper.netz(gefieder)

    # ---------- Kehle: lange, spitze, zottige Federn wie ein Bart – eigenes Gelenk, damit sie sich plustern kann ----------
    G = (H + K) / 2 + V((0, -0.005, 0.012))
    kehle = Teil("rabe_kehle", koerper, G)
    for zeile, (y, lang, heben) in enumerate(((-0.036, 0.07, 0.07), (-0.056, 0.085, 0.10), (-0.076, 0.095, 0.12), (-0.096, 0.105, 0.14))):   # beginnt erst unter dem Kopf (Mr. Alex 19.11.: der Kopf drehte sich durch die oberen Federn)
        for i in range(10):
            phi = math.radians(-81 + i * 18 + (9 if zeile % 2 else 0))
            r = V((math.sin(phi), 0, math.cos(phi)))
            feder(kehle, G + r * (0.058 + (-0.036 - y) * 0.45) + V((0, y, 0)), V((0, -1, 0)) + r * 0.22, r, lang * (0.85 + 0.25 * math.cos(phi)), 0.024, heben=heben, glanz=1.15)
    kehle.netz(gefieder)

    # ---------- Kopf: flacher, langer Schaedel, schwere Brauen, Borsten ueber dem Schnabel ----------
    kopf = Teil("rabe_kopf", koerper, K)
    SENK = 0.12                                                           # Kopf leicht gesenkt: er schaut von oben herab
    f, u = V((0, -math.sin(SENK), math.cos(SENK))), V((0, math.cos(SENK), math.sin(SENK)))
    ellipsoid(kopf, K, X * 0.06, u * 0.058, f * 0.07, haut)                 # runder, hoher Schaedel
    ellipsoid(kopf, K + f * 0.082 + u * 0.014, X * 0.024, u * 0.021, f * 0.052, haut)   # Borsten: decken das hintere Drittel des Schnabels
    for v in (1, -1):
        ellipsoid(kopf, K + X * (v * 0.045) + u * 0.0225 + f * 0.04, X * 0.021, u * 0.011 + f * 0.003, f * 0.038 - u * 0.014, haut, n=10, m=6)   # schwere Braue, faellt nach vorn ab
    verschmelzen(kopf.netz(gefieder, True), 0.006, lambda co, no: mix(SCHWARZ, BLAU, 0.12 + 0.4 * max(0.0, no.z)))
    for i in range(8):                                                    # Kinnreihe: haengt am Kopf und dreht sich mit, ueberdeckt die Naht zur Kehle
        phi = math.radians(-84 + i * 24)
        rr = V((math.sin(phi), 0, math.cos(phi)))
        feder(kopf, K + rr * 0.05 - u * 0.03, -u + rr * 0.3 - f * 0.1, rr, 0.062 * (0.85 + 0.2 * math.cos(phi)), 0.026, heben=0.10, glanz=1.15)
    kopf.netz(gefieder)
    sb = K + f * 0.05 - u * 0.004                                         # Oberschnabel: so lang wie der Kopf, oben gewoelbt, vorn ein Haken
    VORN, FIRST = (0.048, 0.070, 0.120), (0.075, 0.112, 0.185)            # nur der vordere Teil ist horngrau, der Ansatz unter den Borsten bleibt schwarz (Mr. Alex 19.11.)
    def hornfarbe(i, hoch, dunkler=1.0, bis=3.0, ab=1.0):
        tt = max(0.0, min(1.0, (i - ab) / bis))
        return tuple(c * dunkler for c in mix(mix(HORN, VORN, tt), FIRST, max(0.0, hoch - 0.55) * 1.5 * (0.25 + 0.75 * tt)))
    rohr(kopf, [sb, sb + f * 0.04 + u * 0.005, sb + f * 0.08 + u * 0.003, sb + f * 0.115 - u * 0.004, sb + f * 0.138 - u * 0.014, sb + f * 0.147 - u * 0.023],
         [(0.026, 0.035), (0.024, 0.032), (0.019, 0.026), (0.013, 0.018), (0.007, 0.009), (0, 0)], u, hornfarbe)
    kopf.netz(horn, True)
    unten = Teil("rabe_schnabel_unten", kopf, K + f * 0.05 - u * 0.02)    # Unterschnabel: klappt (Reden, Schluessel)
    rohr(unten, [unten.ort, unten.ort + f * 0.05 - u * 0.004, unten.ort + f * 0.098 - u * 0.002, unten.ort + f * 0.118 + u * 0.002], [(0.021, 0.012), (0.017, 0.010), (0.010, 0.006), (0, 0)], u, lambda i, hoch: hornfarbe(i, 0.0, dunkler=0.8, bis=2.0, ab=0.5))
    unten.netz(horn, True)
    weiss = lambda p, aus: (1, 1, 1)
    for seite, v in (("l", 1), ("r", -1)):
        ort = K + X * (v * 0.052) + u * 0.009 + f * 0.036
        au = Teil("rabe_auge_" + seite, kopf, ort)
        ellipsoid(au, ort, X * 0.008, u * 0.008, f * 0.008, weiss, n=12, m=8)
        au.netz(auge, True)
        ellipsoid(au, ort + X * (v * 0.0052) + f * 0.0025, X * 0.0042, u * 0.0042, f * 0.0042, weiss, n=10, m=6)
        au.netz(pupille, True)

    # ---------- Fluegel: Schulter und Hand als zwei Gelenke (zum Ausbreiten); angelegt reichen die Spitzen bis zum Schwanz ----------
    for seite, v in (("l", 1), ("r", -1)):
        S = P(0.1, 0.035, v * 0.088)
        fl = Teil("rabe_fluegel_" + seite, koerper, S)
        wd = (-a + n * 0.12 - X * (v * 0.12)).normalized()                 # dahin zeigen die Federn
        wn = (X * (v * 0.85) + n * 0.5)
        wn = (wn - wd * wn.dot(wd)).normalized()                           # Aussenseite
        e = wd.cross(wn)
        e = e if e.dot(-n) > 0 else -e                                     # zur Bauchseite (Hinterkante)
        fl.ob["wd"], fl.ob["wn"], fl.ob["e"] = list(wd), list(wn), list(e)   # Richtungen des angelegten Fluegels (Masse des Browsers): daraus rechnet vogel_bau.js das Ausbreiten
        ellipsoid(fl, S + wd * 0.11 + e * 0.02, wn * 0.02, e * 0.06, wd * 0.15, lambda p, aus: SCHWARZ, n=10, m=6)
        for i in range(6):                                                 # Armschwingen: jede mit eigenem Gelenk am Ansatz (faechern sich beim Ausbreiten)
            ansatz = S + wd * 0.09 + e * (-0.03 + i * 0.018) + wn * 0.018
            schwinge = Teil(f"rabe_as_{seite}_{i}", fl, ansatz)
            feder(schwinge, ansatz, wd + e * (0.04 + i * 0.045), wn, 0.15, 0.04, heben=0.01)
            schwinge.netz(gefieder)
        for reihe, dr in enumerate((0.085, 0.045, 0.0)):                   # Deckfedern, drei Reihen, von hinten nach vorn uebereinander
            for i in range(5):
                feder(fl, S + wd * (dr - 0.01) + e * (-0.035 + i * 0.02 + (0.01 if reihe % 2 else 0)) + wn * (0.02 + 0.003 * (2 - reihe)), wd + e * 0.15, wn, 0.075, 0.042, heben=0.02, glanz=1.1)
        fl.netz(gefieder)
        hand = Teil("rabe_hand_" + seite, fl, S + wd * 0.02 - e * 0.035 + wn * 0.012)
        for j in range(7):                                                 # Handschwingen: lang und spitz, die vorderste am laengsten; jede mit eigenem Gelenk
            ansatz = hand.ort + wd * (0.05 + j * 0.012) + e * (j * 0.004) - wn * (0.002 * j)
            schwinge = Teil(f"rabe_hs_{seite}_{j}", hand, ansatz)
            feder(schwinge, ansatz, wd + e * (-0.05 + j * 0.045), wn, 0.30 - j * 0.022, 0.046, heben=0.0, glanz=1.2)
            schwinge.netz(gefieder)
        # Arm des ausgebreiteten Fluegels: angelegt unsichtbar (der Browser macht ihn klein), ausgebreitet traegt er die Deckfedern bis zum Handgelenk.
        # Eigene Zufallsfolge, damit das abgenommene Gefieder genau gleich bleibt.
        merk = random.getstate()
        random.seed(31 + v)
        arm = Teil("rabe_arm_" + seite, fl, S)
        ellipsoid(arm, S + e * 0.115 + wd * 0.015, e * 0.135, wn * 0.014, wd * 0.032, lambda p, aus: SCHWARZ, n=10, m=6)
        for reihe, (dw, lang) in enumerate(((0.035, 0.11), (-0.005, 0.08))):
            for k in range(9):
                feder(arm, S + e * (0.005 + k * 0.027 + (0.013 if reihe else 0)) + wd * dw + wn * (0.013 + 0.003 * reihe), wd + e * 0.1, wn, lang, 0.052, heben=0.01, glanz=1.0)
        arm.netz(gefieder)
        random.setstate(merk)

    # ---------- Schwanz: Keil aus neun Federn, flacher als der Koerper, damit er ueber dem Boden bleibt ----------
    T = P(-0.15, -0.02)
    schwanz = Teil("rabe_schwanz", koerper, T)
    FLACH = NEIG - 0.76                                                   # flacher gestellt, damit der laengere Schwanz ueber dem Boden bleibt
    td, tn = V((0, -math.sin(FLACH), -math.cos(FLACH))), V((0, math.cos(FLACH), -math.sin(FLACH)))
    # Mr. Alex 19.11.: von der Seite war der Schwanz „mickrig“ – Lagen wie Dachziegel, die aeusseren Federn fallen dachfoermig ab,
    # dazu Ober- und Unterschwanzdecken. Zweite Runde: die Mitte laenger (von oben ein Keil), vier Lagen mit mehr Abstand, im Profil hoeher
    # und unordentlicher – jede Feder weicht in Hoehe, Neigung und Laenge ein wenig ab. Der Faecher von oben bleibt, wie er war.
    wirr = lambda weit: random.uniform(-weit, weit)                       # dritte Runde (Mr. Alex 19.11.): Unordnung etwa verdoppelt
    for i in (-5, 5, -4, 4, -3, 3, -2, 2, -1, 1, 0):
        lage = 0 if abs(i) <= 1 else 1 if abs(i) <= 3 else 2
        feder(schwanz, T - td * 0.04 + X * (i * 0.009) + tn * (0.02 - lage * 0.016 + wirr(0.010)), dreh(td, tn, -i * 0.062 + wirr(0.02)) + tn * wirr(0.09), tn + X * (i * 0.22 + wirr(0.26)),
              0.465 - abs(i) * 0.026 + 0.023 * max(0.0, 1 - abs(i) / 4) + wirr(0.02 if abs(i) < 4 else 0.006), 0.078, glanz=1.1)   # Mitte noch 3 cm laenger, die Aussenfedern bleiben
    for i in (-3.5, 3.5, -1.5, 1.5):                                      # vierte Lage: haengt unter den anderen, von oben nicht zu sehen
        feder(schwanz, T - td * 0.04 + X * (i * 0.009) + tn * (-0.03 + wirr(0.010)), dreh(td, tn, -i * 0.062 + wirr(0.03)) - tn * (0.07 + wirr(0.07)), tn + X * (i * 0.22 + wirr(0.3)),
              0.37 - abs(i) * 0.02 + wirr(0.03), 0.07, glanz=0.9)
    for j in (-2, 2, -1, 1, 0):                                           # Unterschwanzdecken: vom Bauch hinauf zum Schwanz
        feder(schwanz, T - td * 0.06 - tn * (0.066 - abs(j) * 0.004 + wirr(0.004)) + X * (j * 0.02), td + tn * (0.14 + wirr(0.09)) + X * (j * 0.05 + wirr(0.03)), -tn + X * (j * 0.3 + wirr(0.2)), 0.19 + wirr(0.03), 0.062, glanz=0.9)
    for j in (-2, 2, -1, 1, 0):                                           # Oberschwanzdecken: vom Ruecken hinunter auf den Schwanz, setzen hoch an
        feder(schwanz, T - td * 0.10 + tn * (0.068 - abs(j) * 0.006 + wirr(0.004)) + X * (j * 0.02), td - tn * (0.13 + wirr(0.09)) + X * (j * 0.05 + wirr(0.03)), tn + X * (j * 0.3 + wirr(0.2)), 0.19 + wirr(0.03), 0.064, heben=0.03, glanz=1.0)
    # Zwischenlage vom Ruecken (Mr. Alex 19.11.: „vom Ruecken her gibt es eine zu starke Kante“): setzt hoeher an und liegt in einem Winkel zwischen
    # Ruecken (steil) und Schwanz (flach) – im Profil ein Bogen in Stufen statt eines Knicks
    for la, ln, steil, lang, zahl in ((-0.075, 0.088, 0.50, 0.26, 3), (-0.025, 0.096, 0.70, 0.17, 2)):
        zd, zn = V((0, -math.sin(steil), -math.cos(steil))), V((0, math.cos(steil), -math.sin(steil)))
        for j in sorted(range(-zahl, zahl + 1), key=lambda q: -abs(q)):
            feder(schwanz, P(la, ln - abs(j) * 0.007 + wirr(0.004), j * 0.019), zd + X * (j * 0.07 + wirr(0.03)) + zn * wirr(0.07), zn + X * (j * 0.26 + wirr(0.2)), lang - abs(j) * 0.018 + wirr(0.025), 0.07, heben=0.02, glanz=1.0)
    schwanz.netz(gefieder)
    random.seed(23)                                                       # ab hier eigene Zufallsfolge: Aenderungen am Schwanz veraendern die Beinfedern nicht mehr

    # ---------- Beine: gefiederte „Hosen“, kraeftige Zehen, Krallen ----------
    for seite, v in (("l", 1), ("r", -1)):
        ob = V((v * 0.045, 0.13, 0.0))
        bein = Teil("rabe_bein_" + seite, wurzel, ob)
        ellipsoid(bein, ob + V((0, 0.04, 0)), X * 0.03, V((0, 0.055, 0)), V((0, 0, 0.035)), lambda p, aus: SCHWARZ, n=10, m=6)
        for i in range(8):
            phi = 2 * math.pi * i / 8
            r = V((math.sin(phi), 0, math.cos(phi)))
            feder(bein, ob + V((0, 0.07, 0)) + r * 0.028, V((0, -1, 0)) + r * 0.12, r, 0.085, 0.036, heben=0.05, glanz=0.8)
        bein.netz(gefieder)
        if seite == "r":
            Teil("rabe_ring", bein, V((v * 0.045, 0.058, 0.0)))               # Ansatzpunkt fuer den farbigen Fussring (Kennzeichen je Rabe; die Farbe setzt der Browser)
        beinfarbe = lambda i, hoch: mix(BEIN, BEIN_HELL, max(0.0, hoch - 0.5) * 1.5)
        fuss = V((v * 0.045, 0.012, 0.0))
        rohr(bein, [ob + V((0, 0.01, 0)), fuss], [(0.013, 0.013), (0.012, 0.012)], V((0, 0, 1)), beinfarbe, n=8)
        krallen = []
        for wx, lang in ((-0.5, 0.075), (0, 0.085), (0.5, 0.075), (math.pi, 0.05)):   # drei Zehen nach vorn, eine nach hinten
            dh = V((math.sin(wx), 0, math.cos(wx)))
            ende = fuss + dh * lang + V((0, -0.004, 0))
            rohr(bein, [fuss, fuss + dh * (lang * 0.5) + V((0, 0.004, 0)), ende], [(0.0085, 0.0085), (0.0075, 0.0075), (0.006, 0.006)], V((0, 1, 0)), beinfarbe, n=8)
            krallen.append((ende, dh))
        bein.netz(horn, True)
        for ende, dh in krallen:
            rohr(bein, [ende, ende + dh * 0.014 + V((0, 0.003, 0)), ende + dh * 0.027 + V((0, -0.0075, 0))], [(0.005, 0.005), (0.0035, 0.004), (0, 0)], V((0, 1, 0)), lambda i, hoch: KRALLE, n=6)
        bein.netz(horn, True)


def ausgabe(datei):
    ziel = os.path.join(g.OUT, datei)
    bpy.ops.export_scene.gltf(filepath=ziel, export_format="GLB", export_cameras=False, export_lights=False, export_animations=False, export_yup=True, export_extras=True,
                              export_vertex_color="MATERIAL")
    dreiecke = sum(len(p.vertices) - 2 for o in bpy.data.objects if o.type == "MESH" for p in o.data.polygons)
    print(f"RABE {datei}: {os.path.getsize(ziel) / 1000:.0f} KB, {dreiecke} Dreiecke", flush=True)


if __name__ == "__main__":
    g.neu()
    rabe()
    ausgabe("rabe.glb")
