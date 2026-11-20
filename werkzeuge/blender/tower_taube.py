"""Die Taube: eigener kleiner Vogelkoerper (Figuren 9, 20.11.2026).

Aufruf:  blender -b --python werkzeuge/blender/tower_taube.py              (wenige Sekunden)
         blender -b --python werkzeuge/blender/tower_taube.py -- --bild <ordner>   (dazu vier Ansichten als ein Bild, zum Abnehmen)
Ausgabe: app/tower/figuren/taube.glb. Der Browser (app/tower/vogel_bau.js) bewegt die Gelenke ueber ihre Namen.
Vorbild: die Stadttaube – kleiner runder Kopf, kurzer duenner Schnabel mit weisser Wachshaut, pralle Brust, Koerper fast waagerecht,
blaugrau mit zwei schwarzen Fluegelbinden, gruen und violett schillernder Hals, orangerote Augen, kurze rote Beine.
Merkmal aus dem Figurenblatt: ein heller Ring am Hals.

Gebaut wie der Rabe (tower_rabe.py: dieselben Helfer, dieselbe Ordnung der Gelenke, Namen taube_… statt rabe_…), dazu ein Gelenk fuer den Hals:
taube > taube_koerper > taube_hals > taube_kopf (> taube_schnabel_unten, taube_auge_l/r); der Hals nickt beim Gehen, der Kopf bleibt dabei waagerecht.
"""
import math
import os
import random
import sys

import bpy
from mathutils import Vector as V

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tower_gary as g
from tower_rabe import B, Teil, X, dreh, ellipsoid, mix, rohr, stoff, verschmelzen

GRAU, HELL, DUNKEL = (0.56, 0.58, 0.60), (0.80, 0.80, 0.77), (0.17, 0.19, 0.23)   # Grundfarbe fast weiss (Mr. Alex 20.11.), nicht grau
SCHWARZ, WEISS = (0.10, 0.11, 0.14), (0.90, 0.90, 0.87)                         # die Binden sind dunkelgrau, nicht schwarz
GRUEN, LILA = (0.36, 0.50, 0.43), (0.55, 0.44, 0.58)                             # Hals: stumpf und weich schillernd (Mr. Alex 20.11.: die erste Fassung war zu kraeftig)
ROT, ROT_HELL, KRALLE, SCHNABEL = (0.50, 0.045, 0.04), (0.75, 0.16, 0.13), (0.02, 0.015, 0.015), (0.035, 0.035, 0.045)


def feder(t, p, d, m, lang, breit, farbe, heben=0.0):
    """Eine Feder mit rundem Ende: Ansatz p, zeigt nach d, Oberseite nach m. farbe(tt 0..1 entlang der Feder) -> rgb"""
    d = d.normalized()
    m = (m - d * m.dot(d)).normalized()
    s = d.cross(m)
    k = random.uniform(0.9, 1.08)
    reihen = []
    for tt, w in ((0, 0.55), (0.25, 0.9), (0.5, 1), (0.75, 0.92), (0.93, 0.6)):
        c = p + d * (lang * tt) + m * (0.12 * breit * math.sin(math.pi * tt) + heben * lang * tt * tt)
        hw = breit / 2 * w
        grat = tuple(x * k for x in farbe(tt))
        rand = tuple(x * 0.8 for x in grat)
        reihen.append((t.punkt(c - s * hw, rand), t.punkt(c + m * (0.3 * hw), grat), t.punkt(c + s * hw, rand)))
    sp = t.punkt(p + d * lang + m * (heben * lang), tuple(x * k * 0.85 for x in farbe(1)))
    for a, b in zip(reihen, reihen[1:]):
        t.f += [(a[0], a[1], b[1], b[0]), (a[1], a[2], b[2], b[1])]
    t.f += [(reihen[-1][0], reihen[-1][1], sp), (reihen[-1][1], reihen[-1][2], sp)]


def binde(grund, ab, bis, ton=SCHWARZ):
    """Federfarbe mit einem dunklen Querband zwischen ab und bis (Fluegelbinden, Schwanzende)"""
    return lambda tt: ton if ab <= tt <= bis else grund


def taube():
    random.seed(11)
    gefieder, horn = stoff("gefieder", 0.62), stoff("horn", 0.4)
    auge = g.farbe("taubenauge", (0.95, 0.30, 0.03), rau=0.3, leuchten=0.35)
    pupille = g.farbe("taubenpupille", (0.0, 0.0, 0.0), rau=0.2)
    NEIG = 0.35                                                           # der Koerper liegt fast waagerecht, die Brust etwas hoeher
    a, n = V((0, math.sin(NEIG), math.cos(NEIG))), V((0, math.cos(NEIG), -math.sin(NEIG)))
    C = V((0, 0.15, 0))
    P = lambda la, ln=0.0, lx=0.0: C + a * la + n * ln + X * lx
    einfarbig = lambda ton: (lambda tt: ton)

    wurzel = Teil("taube", None, (0, 0, 0))

    # ---------- Rumpf: prall und rund, Brust weit vorn ----------
    koerper = Teil("taube_koerper", wurzel, C)
    formen = [(C, X * 0.068, n * 0.066, a * 0.125), (P(0.06, -0.016), X * 0.071, n * 0.068, a * 0.08), (P(-0.10, 0.004), X * 0.046, n * 0.04, a * 0.07)]
    for c, ex, ey, ez in formen:
        ellipsoid(koerper, c, ex, ey, ez, lambda p, aus: GRAU)
    verschmelzen(koerper.netz(gefieder, True), 0.008, lambda co, no: mix(HELL, GRAU, 0.55 + 0.45 * no.z))   # Bauch heller als der Ruecken

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
        return (q + r * (weit + 0.002), r) if weit and weit > 0.015 else None

    for zeile, h in enumerate((0.115, 0.08, 0.045, 0.01, -0.025, -0.06, -0.095)):
        for i in range(13):
            phi = math.radians(-166 + i * 27.7 + (13.8 if zeile % 2 else 0))
            pr = rumpf_rand(h, phi)
            if pr:
                ton = mix(HELL, GRAU, 0.5 - 0.5 * math.cos(phi))            # Bauch hell, Ruecken blaugrau
                feder(koerper, pr[0], -a + pr[1] * 0.1, pr[1], 0.055, 0.042, einfarbig(ton), heben=0.02)
    koerper.netz(gefieder)

    # ---------- Hals: eigenes Gelenk (nickt beim Gehen); oben gruen, unten violett schillernd, darunter der helle Ring ----------
    HP = P(0.085, 0.012)                                                  # Drehpunkt tief in der Brust
    H, K = P(0.115, 0.035), V((0, 0.292, 0.128))                          # Halsansatz · Kopfgelenk
    hals = Teil("taube_hals", koerper, HP)
    ha = (K - H).normalized()
    hq = ha.cross(X).normalized()                                         # zeigt nach hinten
    for s, r in ((0.0, 0.046), (0.45, 0.039), (0.85, 0.033)):
        ellipsoid(hals, H + (K - H) * s, X * r, V((0, r, 0)), V((0, 0, r)), lambda p, aus: LILA)
    hoehe = (K - H).length
    def halsfarbe(co, no):                                                # co in Blender-Richtung, vom Drehpunkt aus
        s = (co.z - (H.y - HP.y)) / hoehe
        return mix(mix(LILA, GRUEN, (s - 0.2) / 0.5), GRAU, (-s - 0.1) / 0.3)
    verschmelzen(hals.netz(gefieder, True), 0.006, halsfarbe)
    for zeile, (s, r, ton, lang) in enumerate(((0.72, 0.034, GRUEN, 0.03), (0.48, 0.039, mix(GRUEN, LILA, 0.35), 0.032), (0.24, 0.044, LILA, 0.034), (0.0, 0.048, LILA, 0.036), (-0.2, 0.052, WEISS, 0.03))):
        for i in range(15):
            phi = math.radians(i * 24 + (12 if zeile % 2 else 0))
            rr = X * math.sin(phi) - hq * math.cos(phi)
            schimmer = ton if ton == WEISS else mix(ton, random.choice((GRUEN, LILA)), random.uniform(0, 0.15))
            feder(hals, H + (K - H) * s + rr * r, -ha + rr * 0.3, rr, lang, 0.021, einfarbig(schimmer), heben=0.03)
    hals.netz(gefieder)

    # ---------- Kopf: klein und rund, kurzer duenner Schnabel, weisse Wachshaut ----------
    kopf = Teil("taube_kopf", hals, K)
    f, u = V((0, 0, 1)), V((0, 1, 0))
    KOPF = (0.50, 0.53, 0.57)
    ellipsoid(kopf, K, X * 0.031, u * 0.031, f * 0.036, lambda p, aus: KOPF)
    ellipsoid(kopf, K + f * 0.02 - u * 0.004, X * 0.022, u * 0.02, f * 0.024, lambda p, aus: KOPF)   # Stirn laeuft flach in den Schnabel
    verschmelzen(kopf.netz(gefieder, True), 0.004, lambda co, no: mix(KOPF, GRAU, 0.35 * max(0.0, no.z)))
    # Persoenlichkeit im Aussehen (Mr. Alex 20.11.): die Tratschtante – zerzauster kleiner Schopf am Hinterkopf, grosse runde Augen mit weissem Ring (staunt immer)
    for j, lang in ((-2, 0.02), (2, 0.022), (-1, 0.03), (1, 0.026), (0, 0.034)):
        feder(kopf, K + u * 0.026 - f * 0.014 + X * (j * 0.005), u * 0.75 - f * 0.65 + X * (j * 0.22 + random.uniform(-0.12, 0.12)), f, lang, 0.011, einfarbig(mix(KOPF, HELL, 0.5)), heben=0.2)
    kopf.netz(gefieder)
    sb = K + f * 0.036 - u * 0.006
    rohr(kopf, [sb, sb + f * 0.016, sb + f * 0.03 - u * 0.002, sb + f * 0.038 - u * 0.007], [(0.0085, 0.0075), (0.007, 0.006), (0.0045, 0.004), (0, 0)], u, lambda i, hoch: SCHNABEL, n=8)
    for v in (1, -1):                                                     # Wachshaut: zwei weisse Hoecker auf dem Schnabelansatz
        ellipsoid(kopf, sb + f * 0.006 + u * 0.0065 + X * (v * 0.0035), X * 0.0048, u * 0.004, f * 0.008, lambda p, aus: WEISS, n=8, m=6)
        ellipsoid(kopf, K + X * (v * 0.024) + u * 0.006 + f * 0.012, X * 0.004, u * 0.0118, f * 0.0118, lambda p, aus: WEISS, n=12, m=6)   # weisser Augenring
    kopf.netz(horn, True)
    unten = Teil("taube_schnabel_unten", kopf, sb - u * 0.007)            # Unterschnabel: klappt beim Reden
    rohr(unten, [unten.ort, unten.ort + f * 0.016, unten.ort + f * 0.031 + u * 0.001], [(0.007, 0.004), (0.0055, 0.0032), (0, 0)], u, lambda i, hoch: tuple(c * 0.8 for c in SCHNABEL), n=8)
    unten.netz(horn, True)
    weiss = lambda p, aus: (1, 1, 1)
    for seite, v in (("l", 1), ("r", -1)):
        ort = K + X * (v * 0.0245) + u * 0.006 + f * 0.012
        au = Teil("taube_auge_" + seite, kopf, ort)
        ellipsoid(au, ort, X * 0.0086, u * 0.0086, f * 0.0086, weiss, n=12, m=8)
        au.netz(auge, True)
        ellipsoid(au, ort + X * (v * 0.0056) + f * 0.0012, X * 0.004, u * 0.004, f * 0.004, weiss, n=10, m=6)
        au.netz(pupille, True)

    # ---------- Fluegel: wie beim Raben Schulter und Hand als zwei Gelenke; hellgrau mit zwei schwarzen Binden, dunkle Spitzen ----------
    for seite, v in (("l", 1), ("r", -1)):
        S = P(0.07, 0.03, v * 0.062)
        fl = Teil("taube_fluegel_" + seite, koerper, S)
        wd = (-a + n * 0.06 - X * (v * 0.11)).normalized()                 # dahin zeigen die Federn
        wn = (X * (v * 0.85) + n * 0.5)
        wn = (wn - wd * wn.dot(wd)).normalized()                           # Aussenseite
        e = wd.cross(wn)
        e = e if e.dot(-n) > 0 else -e                                     # zur Bauchseite (Hinterkante)
        fl.ob["wd"], fl.ob["wn"], fl.ob["e"] = list(wd), list(wn), list(e)
        ellipsoid(fl, S + wd * 0.07 + e * 0.012, wn * 0.013, e * 0.04, wd * 0.095, lambda p, aus: HELL, n=10, m=6)
        for i in range(6):                                                 # Armschwingen mit der hinteren Binde
            ansatz = S + wd * 0.055 + e * (-0.02 + i * 0.012) + wn * 0.012
            schwinge = Teil(f"taube_as_{seite}_{i}", fl, ansatz)
            feder(schwinge, ansatz, wd + e * (0.04 + i * 0.045), wn, 0.095, 0.03, binde(HELL, 0.5, 0.82), heben=0.01)
            schwinge.netz(gefieder)
        decke = Teil("taube_decke_" + seite, fl, S)
        for reihe, dr in enumerate((0.052, 0.027, 0.0)):                   # Deckfedern, drei Reihen; die hinterste traegt die vordere Binde
            for i in range(5):
                farbe = binde(HELL, 0.55, 0.9) if reihe == 0 else einfarbig(HELL)
                feder(decke, S + wd * (dr - 0.006) + e * (-0.024 + i * 0.013 + (0.006 if reihe % 2 else 0)) + wn * (0.013 + 0.002 * (2 - reihe)), wd + e * 0.15, wn, 0.05, 0.03, farbe, heben=0.02)
        fl.netz(gefieder)
        decke.netz(gefieder)
        hand = Teil("taube_hand_" + seite, fl, S + wd * 0.012 - e * 0.022 + wn * 0.008)
        spitze = lambda tt: mix(GRAU, DUNKEL, tt * 1.3)                    # Handschwingen: zur Spitze hin fast schwarz
        for j in range(7):
            ansatz = hand.ort + wd * (0.03 + j * 0.0075) + e * (j * 0.0025) - wn * (0.0012 * j)
            schwinge = Teil(f"taube_hs_{seite}_{j}", hand, ansatz)
            feder(schwinge, ansatz, wd + e * (-0.05 + j * 0.045), wn, 0.19 - j * 0.014, 0.03, spitze)
            schwinge.netz(gefieder)
        merk = random.getstate()
        random.seed(31 + v)
        arm = Teil("taube_arm_" + seite, fl, S)                            # Arm des ausgebreiteten Fluegels (angelegt macht der Browser ihn unsichtbar)
        ellipsoid(arm, S + e * 0.072 + wd * 0.01, e * 0.085, wn * 0.009, wd * 0.02, lambda p, aus: HELL, n=10, m=6)
        KV = 1.25
        for reihe, (dw, lang, hoch) in enumerate(((0.031, 0.094, 0.0075), (0.0, 0.062, 0.0105))):
            for k in range(10):
                feder(arm, S + (e * (0.0075 + k * 0.017 + (0.008 if reihe else 0)) + wd * dw + wn * hoch) / KV, wd + e * 0.08 - wn * 0.03, wn, lang / KV, 0.034, binde(HELL, 0.6, 0.92) if reihe == 0 else einfarbig(HELL), heben=-0.02)
            for k in range(1, 6):
                richtung = dreh(wd, wn, -v * (k * 0.11)) + e * 0.08 - wn * 0.04
                feder(arm, S + (e * (0.166 + k * 0.0045) + wd * (dw + 0.0125 - k * 0.0025) + wn * hoch) / KV, richtung, wn, (lang - k * 0.0025) / KV, 0.034, einfarbig(HELL), heben=-0.02)
        arm.netz(gefieder)
        breit = Teil("taube_handoffen_" + seite, hand, hand.ort)           # breite Hand des ausgebreiteten Fluegels
        wirr = lambda weit: random.uniform(-weit, weit)
        for k in range(12):
            aussen = 1 - k / 11
            richtung = dreh(wd, wn, -v * (0.8 - k * 0.095 + wirr(0.05))) - wn * (0.06 + 0.2 * aussen + wirr(0.03))
            ansatz = hand.ort + wd * (0.019 + k * 0.006) + e * (k * 0.003) - wn * (0.0025 + (k % 3) * 0.0075 + wirr(0.0025))
            feder(breit, ansatz, richtung, wn + e * wirr(0.2), 0.26 - k * 0.0075 + wirr(0.014), 0.052, spitze, heben=-(0.05 + 0.1 * aussen))
        for reihe, (lang, hoch) in enumerate(((0.094, 0.004), (0.056, 0.008))):
            for k in range(10):
                richtung = dreh(wd, wn, -v * (0.75 - k * 0.105 + wirr(0.015))) - wn * (0.05 + 0.1 * (1 - k / 9))
                feder(breit, hand.ort + wd * (0.016 + k * 0.007) + e * (k * 0.003) + wn * (hoch + wirr(0.002)), richtung, wn, lang + wirr(0.0025), 0.036, einfarbig(GRAU), heben=-0.03)
        breit.netz(gefieder)
        random.setstate(merk)

    # ---------- Schwanz: kurz und breit, dunkelgrau mit schwarzem Endband; heller Buerzel ----------
    T = P(-0.125, 0.0)
    schwanz = Teil("taube_schwanz", koerper, T)
    FLACH = 0.12
    td, tn = V((0, -math.sin(FLACH), -math.cos(FLACH))), V((0, math.cos(FLACH), -math.sin(FLACH)))
    wirr = lambda weit: random.uniform(-weit, weit)
    schwanz.ob["tn"], zahl = list(tn), 0
    for i in (-5, 5, -4, 4, -3, 3, -2, 2, -1, 1, 0):
        lage = 0 if abs(i) <= 1 else 1 if abs(i) <= 3 else 2
        ansatz = T - td * 0.04 + X * (i * 0.0055) + tn * (0.008 - lage * 0.006 + wirr(0.002))
        sf = Teil(f"taube_sf_{zahl}", schwanz, ansatz)
        sf.ob["i"] = float(i)
        zahl += 1
        feder(sf, ansatz, dreh(td, tn, -i * 0.045 + wirr(0.01)), tn + X * (i * 0.2), 0.17 - abs(i) * 0.006 + wirr(0.004), 0.044, binde(mix(GRAU, DUNKEL, 0.45), 0.74, 1.0))
        sf.netz(gefieder)
    for j in (-2, 2, -1, 1, 0):                                           # Unterschwanzdecken
        feder(schwanz, T - td * 0.05 - tn * (0.03 - abs(j) * 0.003) + X * (j * 0.013), td + tn * 0.1 + X * (j * 0.05), -tn + X * (j * 0.3), 0.1 + wirr(0.01), 0.04, einfarbig(GRAU))
    schwanz.netz(gefieder)
    buerzel = Teil("taube_buerzel", koerper, T)                          # heller Buerzel: Federn vom Ruecken auf den Schwanz
    for la, ln, steil, lang, breite in ((-0.065, 0.047, 0.22, 0.11, 2), (-0.03, 0.058, 0.3, 0.08, 2)):
        zd, zn = V((0, -math.sin(steil), -math.cos(steil))), V((0, math.cos(steil), -math.sin(steil)))
        for j in sorted(range(-breite, breite + 1), key=lambda q: -abs(q)):
            feder(buerzel, P(la, ln - abs(j) * 0.006, j * 0.016), zd + X * (j * 0.07), zn + X * (j * 0.26), lang - abs(j) * 0.008 + wirr(0.008), 0.044, einfarbig(mix(HELL, WEISS, 0.45)), heben=0.02)
    buerzel.netz(gefieder)
    random.seed(23)

    # ---------- Beine: kurz und rot, drei Zehen nach vorn, eine nach hinten ----------
    for seite, v in (("l", 1), ("r", -1)):
        ob = V((v * 0.032, 0.085, -0.008))
        bein = Teil("taube_bein_" + seite, wurzel, ob)
        ellipsoid(bein, ob + V((0, 0.012, 0)), X * 0.02, V((0, 0.024, 0)), V((0, 0, 0.024)), lambda p, aus: HELL, n=10, m=6)
        for i in range(7):
            phi = 2 * math.pi * i / 7
            r = V((math.sin(phi), 0, math.cos(phi)))
            feder(bein, ob + V((0, 0.022, 0)) + r * 0.016, V((0, -1, 0)) + r * 0.15, r, 0.034, 0.022, einfarbig(HELL), heben=0.05)
        bein.netz(gefieder)
        lauf = Teil("taube_lauf_" + seite, bein, ob)
        if seite == "r":
            Teil("taube_ring", lauf, V((v * 0.032, 0.04, -0.008)))
        beinfarbe = lambda i, hoch: mix(ROT, ROT_HELL, max(0.0, hoch - 0.5) * 1.5)
        fuss = V((v * 0.032, 0.007, -0.008))
        rohr(lauf, [ob + V((0, 0.005, 0)), fuss], [(0.0062, 0.0062), (0.0058, 0.0058)], V((0, 0, 1)), beinfarbe, n=8)
        lauf.netz(horn, True)
        zehen = Teil("taube_fuss_" + seite, lauf, fuss)
        krallen = []
        for wx, lang in ((-0.55, 0.036), (0, 0.042), (0.55, 0.036), (math.pi, 0.022)):
            dh = V((math.sin(wx), 0, math.cos(wx)))
            ende = fuss + dh * lang + V((0, -0.002, 0))
            rohr(zehen, [fuss, fuss + dh * (lang * 0.5) + V((0, 0.002, 0)), ende], [(0.0048, 0.0048), (0.0042, 0.0042), (0.0034, 0.0034)], V((0, 1, 0)), beinfarbe, n=8)
            krallen.append((ende, dh))
        zehen.netz(horn, True)
        for ende, dh in krallen:
            rohr(zehen, [ende, ende + dh * 0.007 + V((0, 0.0015, 0)), ende + dh * 0.013 + V((0, -0.004, 0))], [(0.003, 0.003), (0.002, 0.0024), (0, 0)], V((0, 1, 0)), lambda i, hoch: KRALLE, n=6)
        zehen.netz(horn, True)


def ausgabe(datei):
    ziel = os.path.join(g.OUT, datei)
    bpy.ops.export_scene.gltf(filepath=ziel, export_format="GLB", export_cameras=False, export_lights=False, export_animations=False, export_yup=True, export_extras=True,
                              export_vertex_color="MATERIAL")
    dreiecke = sum(len(p.vertices) - 2 for o in bpy.data.objects if o.type == "MESH" for p in o.data.polygons)
    print(f"TAUBE {datei}: {os.path.getsize(ziel) / 1000:.0f} KB, {dreiecke} Dreiecke", flush=True)


def bilder(ordner):
    """Vier Ansichten (Seite, schraeg vorn, vorn, schraeg hinten) als ein Bild – nur zum Abnehmen des Aussehens."""
    import numpy as np
    sz = bpy.context.scene
    for o in bpy.data.objects:                                            # die Teile des ausgebreiteten Fluegels blendet sonst der Browser aus
        if o.name.startswith(("taube_arm_", "taube_handoffen_")):
            for kind in o.children_recursive:
                kind.hide_render = True
    sz.render.engine = "BLENDER_EEVEE"
    sz.render.resolution_x, sz.render.resolution_y = 800, 640
    sz.view_settings.view_transform = "Standard"
    welt = bpy.data.worlds.new("welt")
    welt.use_nodes = True
    welt.node_tree.nodes["Background"].inputs[0].default_value = (0.55, 0.50, 0.42, 1)
    welt.node_tree.nodes["Background"].inputs[1].default_value = 0.9
    sz.world = welt
    sonne = bpy.data.objects.new("sonne", bpy.data.lights.new("sonne", "SUN"))
    sonne.data.energy = 3.0
    sonne.rotation_euler = (0.9, 0.2, -0.6)
    sz.collection.objects.link(sonne)
    boden = bpy.data.meshes.new("boden")
    boden.from_pydata([(-3, -3, 0), (3, -3, 0), (3, 3, 0), (-3, 3, 0)], [], [(0, 1, 2, 3)])
    bo = bpy.data.objects.new("boden", boden)
    boden.materials.append(g.farbe("pflaster", (0.42, 0.38, 0.32), rau=0.9))
    sz.collection.objects.link(bo)
    ziel = bpy.data.objects.new("ziel", None)
    ziel.location = (0, 0.02, 0.17)
    sz.collection.objects.link(ziel)
    kam = bpy.data.objects.new("kamera", bpy.data.cameras.new("kamera"))
    kam.data.lens = 70
    sz.collection.objects.link(kam)
    sz.camera = kam
    kam.constraints.new("TRACK_TO").target = ziel
    teile = []
    for i, ort in enumerate(((1.0, 0.02, 0.22), (0.62, -0.78, 0.3), (0.0, -1.0, 0.2), (0.6, 0.8, 0.38))):
        kam.location = ort
        sz.render.filepath = os.path.join(ordner, f"taube_{i}.png")
        bpy.ops.render.render(write_still=True)
        bild = bpy.data.images.load(sz.render.filepath)
        teile.append(np.array(bild.pixels[:]).reshape(640, 800, 4))
    blatt = np.concatenate([np.concatenate(teile[2:], axis=1), np.concatenate(teile[:2], axis=1)], axis=0)   # Zeilen laufen in Blender von unten nach oben
    aus = bpy.data.images.new("blatt", 1600, 1280)
    aus.pixels = blatt.ravel().tolist()
    aus.filepath_raw = os.path.join(ordner, "taube_blatt.png")
    aus.file_format = "PNG"
    aus.save()
    print("TAUBE Bild:", aus.filepath_raw, flush=True)


if __name__ == "__main__":
    g.neu()
    taube()
    ausgabe("taube.glb")
    if "--bild" in sys.argv:
        bilder(sys.argv[sys.argv.index("--bild") + 1])
