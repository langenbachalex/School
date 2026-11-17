"""Keys of the Tower – Guard Room (Kapitel 1): ein Lauf liefert drei Dateien.

  guardroom.jpg       das Bild des Raums
  guardroom_ids.png   Tipp-Flaechen: jeder Gegenstand hat eine eigene Farbe (halbe Groesse)
  guardroom.json      Name, Farbe, Rahmen und Mitte jedes Gegenstands (Anteile 0..1)

Aufruf (Windows, im Repo-Ordner):
  "C:\\Program Files\\Blender Foundation\\Blender 5.3\\blender.exe" -b -P werkzeuge/blender/guardroom.py
Umgebungsvariablen: OUT (Zielordner), RESX, RESY, SAMPLES, NUR_IDS=1 (nur Flaechen, schnell)
Masse in Metern. Rueckwand bei y=0, Kamera schaut in +y, x = rechts, z = oben.
"""
import json
import math
import os
import sys
import time

import bpy
import numpy as np
from bpy_extras.object_utils import world_to_camera_view  # noqa: F401 (fuer spaetere Figuren-Standpunkte)

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
OUT = os.environ.get("OUT", os.path.join(REPO, "app", "tower", "raum"))
RESX = int(os.environ.get("RESX", 1920))
RESY = int(os.environ.get("RESY", 1080))
SAMPLES = int(os.environ.get("SAMPLES", 96))
NUR_IDS = os.environ.get("NUR_IDS") == "1"
R = math.radians

# Kennung -> Name wie in inhalte/abenteuer/tower_kapitel1.tsv, Spalte "gegenstand"
DINGE = [
    ("haken", "Schlüsselhaken"), ("stiefel", "Stiefel"), ("tanzschuh", "Tanzschuh"), ("helm", "Helm"),
    ("laterne", "Laterne"), ("uhr", "Uhr"), ("teekanne", "Teekanne"), ("tassen", "Tassen"),
    ("kruemel", "Krümel"), ("karte", "Karte"), ("mantel", "Mantel"), ("fenster", "Fenster"),
    ("kamin", "Kamin"), ("kleine_tuer", "Kleine Tür (nur mit Laterne sichtbar)"), ("truhe", "Truhe"),
    ("treppe", "Treppe"),
]
STUFEN = (60, 150, 240)
PALETTE = [(r, g, b) for r in STUFEN for g in STUFEN for b in STUFEN][1:]  # ohne die dunkelste
FARBE = {kennung: PALETTE[i] for i, (kennung, _) in enumerate(DINGE)}

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---------- Material ----------
_mats = {}


def mat(name, color, rough=0.8, metallic=0.0, emit=0.0):
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metallic
    if emit:
        b.inputs["Emission Color"].default_value = (*color, 1)
        b.inputs["Emission Strength"].default_value = emit
    _mats[name] = m
    return m


def mauer(name, c1, c2, fuge, achsen, scale, breit=0.5, hoch=0.25):
    """Steine oder Dielen als gerechnetes Muster; achsen = welche Welt-Achsen das Muster tragen."""
    m = mat(name, c1, 0.9)
    nt = m.node_tree
    b = nt.nodes.get("Principled BSDF")
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    comb = nt.nodes.new("ShaderNodeCombineXYZ")
    brick = nt.nodes.new("ShaderNodeTexBrick")
    nt.links.new(geo.outputs["Position"], sep.inputs[0])
    nt.links.new(sep.outputs[achsen[0]], comb.inputs["X"])
    nt.links.new(sep.outputs[achsen[1]], comb.inputs["Y"])
    nt.links.new(comb.outputs[0], brick.inputs["Vector"])
    brick.inputs["Color1"].default_value = (*c1, 1)
    brick.inputs["Color2"].default_value = (*c2, 1)
    brick.inputs["Mortar"].default_value = (*fuge, 1)
    brick.inputs["Scale"].default_value = scale
    brick.inputs["Mortar Size"].default_value = 0.012
    brick.inputs["Brick Width"].default_value = breit
    brick.inputs["Row Height"].default_value = hoch
    nt.links.new(brick.outputs["Color"], b.inputs["Base Color"])
    return m


WAND_H = mauer("wand_hinten", (0.36, 0.33, 0.29), (0.28, 0.26, 0.23), (0.10, 0.09, 0.08), "XZ", 1.2)
WAND_S = mauer("wand_seite", (0.36, 0.33, 0.29), (0.28, 0.26, 0.23), (0.10, 0.09, 0.08), "YZ", 1.2)
BODEN = mauer("boden", (0.36, 0.23, 0.13), (0.30, 0.19, 0.10), (0.10, 0.06, 0.03), "YX", 1.0, 2.2, 0.28)
HOLZ = mat("holz", (0.33, 0.20, 0.10), 0.7)
HOLZ_D = mat("holz_dunkel", (0.16, 0.09, 0.05), 0.7)
STEIN = mat("stein", (0.44, 0.41, 0.36), 0.9)
RUSS = mat("russ", (0.02, 0.02, 0.02), 1.0)
EISEN = mat("eisen", (0.10, 0.10, 0.11), 0.45, 0.9)
STAHL = mat("stahl", (0.62, 0.64, 0.68), 0.3, 1.0)
MESSING = mat("messing", (0.85, 0.62, 0.22), 0.35, 0.9)
SCHWARZ = mat("leder_schwarz", (0.03, 0.03, 0.035), 0.4)
LEDER = mat("leder_braun", (0.26, 0.15, 0.08), 0.5)
TRUHE = mat("truhe_holz", (0.46, 0.29, 0.13), 0.65)
LICHT_AN = mat("laterne_licht", (1.0, 0.72, 0.30), 0.2, emit=3.0)
ROT = mat("rot", (0.75, 0.05, 0.08), 0.5)
BLAU = mat("mantel_blau", (0.05, 0.08, 0.22), 0.85)
WEISS = mat("porzellan", (0.92, 0.90, 0.85), 0.25)
KANNE = mat("kanne", (0.20, 0.45, 0.50), 0.25)
PERGAMENT = mat("pergament", (0.80, 0.68, 0.45), 0.9)
TINTE = mat("tinte", (0.30, 0.20, 0.12), 0.9)
PAPIER = mat("papier", (0.90, 0.85, 0.70), 0.9)
BROT = mat("kruemel", (0.85, 0.68, 0.38), 0.9)
ZIFFER = mat("zifferblatt", (0.95, 0.92, 0.80), 0.6, emit=0.25)
NACHT = mat("nacht", (0.10, 0.18, 0.45), 0.3, emit=1.2)
FEUER = mat("feuer", (1.0, 0.30, 0.04), emit=3.0)
FEUER_KERN = mat("feuer_kern", (1.0, 0.75, 0.20), emit=7.0)
GLUT = mat("glut", (1.0, 0.18, 0.02), emit=5.0)
LATERNE_GLAS = mat("laterne_glas", (0.9, 0.8, 0.55), 0.2, emit=0.15)  # noch aus

# ---------- Bau-Helfer ----------


def fertig(ob, name, material, grp):
    ob.name = name
    ob.data.materials.append(material)
    if grp:
        ob["gruppe"] = grp
    return ob


def box(name, size, loc, material, grp=None, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    ob = bpy.context.object
    ob.scale = size
    return fertig(ob, name, material, grp)


def cyl(name, r, depth, loc, material, grp=None, rot=(0, 0, 0), verts=24):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, rotation=rot, vertices=verts)
    return fertig(bpy.context.object, name, material, grp)


def cone(name, r, depth, loc, material, grp=None, verts=8, r2=0.0):
    bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r2, depth=depth, location=loc, vertices=verts)
    return fertig(bpy.context.object, name, material, grp)


def ball(name, r, loc, material, grp=None, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=24, ring_count=12)
    ob = bpy.context.object
    ob.scale = scale
    bpy.ops.object.shade_smooth()
    return fertig(ob, name, material, grp)


def weich(ob, breite=0.03):
    """Kanten abrunden (fuer Stoff): Groesse fest einrechnen, Fase, glatt schattieren."""
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    m = ob.modifiers.new("fase", "BEVEL")
    m.width = breite
    m.segments = 4
    for p in ob.data.polygons:
        p.use_smooth = True
    return ob


def torus(name, R_, r, loc, material, grp=None, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R_, minor_radius=r, location=loc, rotation=rot)
    return fertig(bpy.context.object, name, material, grp)


# ---------- Raum: 8 m breit, 10,5 m tief, 3,6 m hoch ----------
B, T, H = 4.0, -10.5, 3.6
TX0, TX1, TY0, TY1 = 2.4, 3.7, -4.2, -2.4  # Treppenloch im Boden
box("boden_links", (B + TX0, -T, 0.2), ((TX0 - B) / 2, T / 2, -0.1), BODEN)
box("boden_rechts_hinten", (B - TX0, -TY1, 0.2), ((B + TX0) / 2, TY1 / 2, -0.1), BODEN)
box("boden_rechts_vorn", (B - TX0, TY0 - T, 0.2), ((B + TX0) / 2, (TY0 + T) / 2, -0.1), BODEN)
box("boden_rand", (B - TX1, TY1 - TY0, 0.2), ((B + TX1) / 2, (TY0 + TY1) / 2, -0.1), BODEN)
box("wand_hinten", (2 * B + 0.4, 0.2, H), (0, 0.1, H / 2), WAND_H)
box("wand_links", (0.2, -T, H), (-B - 0.1, T / 2, H / 2), WAND_S)
box("wand_rechts", (0.2, -T, H), (B + 0.1, T / 2, H / 2), WAND_S)
box("decke", (2 * B, -T, 0.2), (0, T / 2, H + 0.1), HOLZ_D)
for i in range(5):
    box(f"balken{i}", (2 * B, 0.22, 0.24), (0, -0.9 - i * 2.0, H - 0.12), HOLZ)

# Kamin (Mitte der Rueckwand) mit Zettel in der Ecke
box("kamin_l", (0.35, 0.5, 1.5), (-0.95, -0.25, 0.75), STEIN, "kamin")
box("kamin_r", (0.35, 0.5, 1.5), (0.95, -0.25, 0.75), STEIN, "kamin")
box("kamin_sims", (2.6, 0.62, 0.22), (0, -0.29, 1.61), STEIN, "kamin")
box("kamin_esse", (1.9, 0.4, 1.9), (0, -0.2, 2.67), STEIN)
box("kamin_loch", (1.55, 0.08, 1.5), (0, -0.05, 0.75), RUSS, "kamin")
box("kamin_boden", (1.55, 0.5, 0.06), (0, -0.25, 0.03), RUSS, "kamin")
for i, (x, rz) in enumerate([(-0.25, 0.3), (0.2, -0.4), (0.0, 1.2)]):
    cyl(f"scheit{i}", 0.07, 0.8, (x * 0.6, -0.26, 0.10 + 0.07 * (i == 2)), HOLZ_D, "kamin", rot=(0, R(90), rz), verts=10)
for i, (x, h) in enumerate([(-0.30, 0.30), (-0.12, 0.46), (0.06, 0.54), (0.24, 0.36), (0.36, 0.24)]):
    ball(f"flamme{i}", 0.11, (x, -0.24, 0.16 + h / 2), FEUER, "kamin", scale=(1, 0.7, h / 0.22))
    ball(f"flamme_kern{i}", 0.06, (x, -0.30, 0.14 + h / 3), FEUER_KERN, "kamin", scale=(1, 0.7, h / 0.2))
box("kamin_innen_l", (0.04, 0.45, 1.5), (-0.76, -0.25, 0.75), RUSS, "kamin")
box("kamin_innen_r", (0.04, 0.45, 1.5), (0.76, -0.25, 0.75), RUSS, "kamin")
box("glut", (0.9, 0.3, 0.04), (0, -0.26, 0.08), GLUT, "kamin")
box("brief", (0.20, 0.14, 0.01), (0.56, -0.38, 0.075), PAPIER, "kamin", rot=(0, R(-12), R(25)))

# Uhr ueber dem Kamin: zwanzig nach neun
UZ = 2.45
cyl("uhr_rahmen", 0.36, 0.10, (0, -0.45, UZ), HOLZ_D, "uhr", rot=(R(90), 0, 0), verts=32)
cyl("uhr_blatt", 0.30, 0.02, (0, -0.51, UZ), ZIFFER, "uhr", rot=(R(90), 0, 0), verts=32)
for k in range(12):
    a = R(k * 30)
    box(f"uhr_strich{k}", (0.02, 0.01, 0.05), (math.sin(a) * 0.25, -0.525, UZ + math.cos(a) * 0.25), SCHWARZ, "uhr", rot=(0, a, 0))
for nm, a, lang, dick in [("stunde", R(280), 0.16, 0.03), ("minute", R(120), 0.24, 0.02)]:
    box(f"uhr_{nm}", (dick, 0.01, lang), (math.sin(a) * lang / 2, -0.53, UZ + math.cos(a) * lang / 2), SCHWARZ, "uhr", rot=(0, a, 0))

# Sieben leere Schluesselhaken links vom Kamin
box("haken_brett", (1.7, 0.05, 0.22), (-2.3, -0.03, 1.95), HOLZ, "haken")
for i in range(7):
    x = -2.3 + (i - 3) * 0.23
    cyl(f"haken{i}", 0.014, 0.10, (x, -0.10, 1.93), MESSING, "haken", rot=(R(90), 0, 0), verts=8)
    cyl(f"haken_spitze{i}", 0.014, 0.06, (x, -0.15, 1.96), MESSING, "haken", verts=8)

# Karte, Laterne und Eingangstuer rechts vom Kamin
KX = 1.9
box("karte_rahmen", (1.15, 0.04, 0.85), (KX, -0.02, 2.0), HOLZ_D, "karte")
box("karte", (1.03, 0.02, 0.73), (KX, -0.045, 2.0), PERGAMENT, "karte")
box("karte_tower", (0.26, 0.01, 0.22), (KX, -0.06, 2.0), TINTE, "karte")
for dx, dz in [(-0.16, -0.14), (0.16, -0.14), (-0.16, 0.14), (0.16, 0.14)]:
    box("karte_turm", (0.07, 0.01, 0.07), (KX + dx, -0.06, 2.0 + dz), TINTE, "karte")
box("karte_mauer", (0.80, 0.01, 0.02), (KX, -0.06, 1.73), TINTE, "karte")
box("karte_fluss", (0.90, 0.01, 0.035), (KX, -0.06, 1.68), mat("fluss", (0.25, 0.40, 0.55)), "karte")
box("tuer", (0.95, 0.08, 2.1), (3.35, -0.04, 1.05), HOLZ, None)
box("tuer_band1", (0.95, 0.09, 0.07), (3.35, -0.045, 0.5), EISEN)
box("tuer_band2", (0.95, 0.09, 0.07), (3.35, -0.045, 1.6), EISEN)
ball("tuer_knauf", 0.045, (3.02, -0.11, 1.05), MESSING)
# Laterne: gross, mit Dach, Gitter und schwachem Schein (richtig hell wird sie erst im Spiel)
LX, LY, LZ = 2.67, -0.34, 1.52
box("laterne_arm", (0.05, 0.36, 0.05), (LX, -0.17, LZ + 0.50), EISEN, "laterne")
torus("laterne_ring", 0.05, 0.012, (LX, LY, LZ + 0.44), EISEN, "laterne", rot=(R(90), 0, 0))
cone("laterne_dach", 0.24, 0.16, (LX, LY, LZ + 0.32), EISEN, "laterne", verts=4)
box("laterne_glas", (0.24, 0.24, 0.42), (LX, LY, LZ), LICHT_AN, "laterne")
for dx in (-0.13, 0.13):
    for dy in (-0.13, 0.13):
        box("laterne_stab", (0.03, 0.03, 0.46), (LX + dx, LY + dy, LZ), EISEN, "laterne")
box("laterne_fuss", (0.32, 0.32, 0.05), (LX, LY, LZ - 0.24), EISEN, "laterne")

# Kleine Tuer in der dunklen Ecke hinten links (Rueckwand)
TKX = -3.5
box("kleine_tuer", (0.75, 0.06, 1.15), (TKX, -0.03, 0.575), HOLZ_D, "kleine_tuer")
box("kleine_tuer_band", (0.75, 0.07, 0.06), (TKX, -0.035, 0.85), EISEN, "kleine_tuer")
box("federschloss", (0.10, 0.08, 0.14), (TKX + 0.27, -0.05, 0.60), MESSING, "kleine_tuer")

# Bank an der linken Wand, darunter Stiefel und Tanzschuh, darueber das Brett mit dem Helm
BY = -2.8
box("bank", (0.6, 1.6, 0.07), (-3.68, BY, 0.52), HOLZ)
for y in (BY - 0.73, BY + 0.73):
    for x in (-3.92, -3.44):
        box("bank_bein", (0.06, 0.06, 0.50), (x, y, 0.25), HOLZ)
box("stiefel_fuss", (0.44, 0.17, 0.14), (-3.60, BY - 0.32, 0.07), LEDER, "stiefel")
box("stiefel_schaft", (0.18, 0.17, 0.36), (-3.73, BY - 0.32, 0.29), LEDER, "stiefel")
box("stiefel_stulpe", (0.20, 0.19, 0.07), (-3.73, BY - 0.32, 0.42), SCHWARZ, "stiefel")
box("stiefel_schnalle", (0.07, 0.18, 0.05), (-3.66, BY - 0.32, 0.16), MESSING, "stiefel")
box("tanzschuh", (0.40, 0.14, 0.09), (-3.58, BY + 0.28, 0.06), ROT, "tanzschuh", rot=(0, R(-6), 0))
box("tanzschuh_absatz", (0.07, 0.11, 0.11), (-3.74, BY + 0.28, 0.055), ROT, "tanzschuh")
box("tanzschuh_schleife", (0.11, 0.17, 0.05), (-3.50, BY + 0.28, 0.13), MESSING, "tanzschuh")
box("brett", (0.42, 1.4, 0.05), (-3.78, BY, 1.85), HOLZ)
ball("helm", 0.21, (-3.74, BY, 2.02), STAHL, "helm", scale=(1, 1, 1.05))
cyl("helm_rand", 0.30, 0.03, (-3.74, BY, 1.90), STAHL, "helm")
box("helm_kamm", (0.03, 0.40, 0.07), (-3.74, BY, 2.20), STAHL, "helm")

# Tisch mit Teekanne, zwei Tassen, Loeffel dazwischen; Kruemel darunter
TXM, TYM, TZ = -0.9, -4.4, 0.78
box("tisch", (1.7, 1.0, 0.07), (TXM, TYM, TZ - 0.035), HOLZ)
for dx in (-0.75, 0.75):
    for dy in (-0.4, 0.4):
        box("tischbein", (0.08, 0.08, TZ - 0.07), (TXM + dx, TYM + dy, (TZ - 0.07) / 2), HOLZ)
ball("teekanne", 0.15, (TXM - 0.45, TYM, TZ + 0.13), KANNE, "teekanne", scale=(1, 1, 0.9))
cyl("teekanne_tuelle", 0.025, 0.20, (TXM - 0.63, TYM, TZ + 0.17), KANNE, "teekanne", rot=(0, R(-50), 0), verts=10)
torus("teekanne_henkel", 0.08, 0.018, (TXM - 0.29, TYM, TZ + 0.14), KANNE, "teekanne", rot=(R(90), 0, 0))
ball("teekanne_knopf", 0.03, (TXM - 0.45, TYM, TZ + 0.28), KANNE, "teekanne")
for i, x in enumerate((TXM + 0.05, TXM + 0.62)):
    cyl(f"tasse{i}", 0.07, 0.11, (x, TYM - 0.12, TZ + 0.055), WEISS, "tassen")
    cyl(f"untertasse{i}", 0.115, 0.014, (x, TYM - 0.12, TZ + 0.007), WEISS, "tassen")
    torus(f"tassenhenkel{i}", 0.038, 0.011, (x + 0.09, TYM - 0.12, TZ + 0.06), WEISS, "tassen", rot=(R(90), 0, 0))
box("loeffel", (0.26, 0.035, 0.014), (TXM + 0.30, TYM - 0.20, TZ + 0.008), STAHL, "tassen", rot=(0, 0, R(10)))
ball("loeffel_kopf", 0.05, (TXM + 0.44, TYM - 0.175, TZ + 0.012), STAHL, "tassen", scale=(1.3, 0.9, 0.3))
for i in range(18):
    kx = TXM - 0.45 + ((i * 37) % 90) / 100.0
    ky = TYM - 0.55 + ((i * 53) % 50) / 100.0
    box(f"kruemel{i}", (0.07, 0.06, 0.035), (kx, ky, 0.018), BROT, "kruemel", rot=(0, 0, i))
box("kruste1", (0.17, 0.10, 0.045), (TXM - 0.1, TYM - 0.35, 0.023), BROT, "kruemel", rot=(0, 0, 0.5))
box("kruste2", (0.14, 0.09, 0.045), (TXM + 0.22, TYM - 0.2, 0.023), BROT, "kruemel", rot=(0, 0, -0.8))

# Stuhl mit der Uniformjacke von Mr Pike ueber der Lehne (dunkelblau, rote Raender, Messingknoepfe)
SX, SY = 1.08, -4.25
box("stuhl_sitz", (0.46, 0.46, 0.05), (SX, SY, 0.46), HOLZ)
for dx in (-0.2, 0.2):
    for dy in (-0.2, 0.2):
        box("stuhlbein", (0.05, 0.05, 0.46), (SX + dx, SY + dy, 0.23), HOLZ)
    box("stuhl_pfosten", (0.05, 0.05, 0.84), (SX + dx, SY + 0.21, 0.88), HOLZ)
    ball("stuhl_knauf", 0.04, (SX + dx, SY + 0.21, 1.32), HOLZ)
box("stuhl_querholz", (0.40, 0.04, 0.07), (SX, SY + 0.21, 0.66), HOLZ)
MY = SY + 0.15
weich(box("jacke", (0.34, 0.11, 0.42), (SX, MY, 0.93), BLAU, "mantel"), 0.04)
for dx in (-0.19, 0.19):
    ball("jacke_schulter", 0.085, (SX + dx * 0.9, MY, 1.10), BLAU, "mantel", scale=(1.1, 0.8, 0.8))
    cyl("jacke_aermel", 0.06, 0.46, (SX + dx * 1.22, MY, 0.88), BLAU, "mantel", rot=(0, R(8 if dx > 0 else -8), 0), verts=14)
    cyl("jacke_aufschlag", 0.066, 0.08, (SX + dx * 1.38, MY, 0.67), ROT, "mantel", rot=(0, R(8 if dx > 0 else -8), 0), verts=14)
weich(box("jacke_kragen", (0.20, 0.13, 0.07), (SX, MY, 1.16), ROT, "mantel"), 0.02)
weich(box("jacke_saum", (0.345, 0.115, 0.05), (SX, MY, 0.735), ROT, "mantel"), 0.015)
box("jacke_leiste", (0.045, 0.115, 0.36), (SX, MY, 0.94), ROT, "mantel")
for k in range(4):
    ball("jacke_knopf", 0.02, (SX + 0.05, MY - 0.06, 0.80 + k * 0.09), MESSING, "mantel")

# Truhe des Kindes: frei an der linken Wand zwischen Bank und kleiner Tuer
CX, CY = -3.60, -1.35
box("truhe", (0.58, 1.0, 0.44), (CX, CY, 0.22), TRUHE, "truhe")
cyl("truhe_deckel", 0.29, 0.99, (CX, CY, 0.44), TRUHE, "truhe", rot=(R(90), 0, 0), verts=20)
for dy in (-0.34, 0.34):
    box("truhe_band", (0.60, 0.06, 0.46), (CX, CY + dy, 0.23), EISEN, "truhe")
    cyl("truhe_band_o", 0.30, 0.06, (CX, CY + dy, 0.44), EISEN, "truhe", rot=(R(90), 0, 0), verts=20)
box("truhe_schloss", (0.03, 0.14, 0.16), (CX + 0.30, CY, 0.38), MESSING, "truhe")

# Fenster in der rechten Wand, Fensterbank fuer die Taube
FY, FZ = -1.5, 1.95
box("fenster_nische", (0.06, 1.0, 1.3), (B - 0.03, FY, FZ), STEIN, "fenster")
box("fenster_glas", (0.04, 0.8, 1.1), (B - 0.07, FY, FZ), NACHT, "fenster")
box("fenster_kreuz_h", (0.05, 0.8, 0.04), (B - 0.09, FY, FZ), EISEN, "fenster")
box("fenster_kreuz_v", (0.05, 0.04, 1.1), (B - 0.09, FY, FZ), EISEN, "fenster")
box("fensterbank", (0.30, 1.1, 0.06), (B - 0.15, FY, FZ - 0.68), STEIN, "fenster")

# Treppe nach unten (Loch im Boden rechts) mit Gelaender
N = 6
for i in range(N):
    tiefe = (TY1 - TY0) / N
    box(f"stufe{i}", (TX1 - TX0, tiefe, 0.2), ((TX0 + TX1) / 2, TY0 + tiefe * (i + 0.5), -0.1 - 0.22 * (i + 1)), STEIN, "treppe")
box("schacht_boden", (TX1 - TX0, TY1 - TY0, 0.1), ((TX0 + TX1) / 2, (TY0 + TY1) / 2, -1.8), RUSS, "treppe")
box("schacht_l", (0.05, TY1 - TY0, 1.8), (TX0 - 0.025, (TY0 + TY1) / 2, -1.0), STEIN, "treppe")
box("schacht_r", (0.05, TY1 - TY0, 1.8), (TX1 + 0.025, (TY0 + TY1) / 2, -1.0), STEIN, "treppe")
box("schacht_h", (TX1 - TX0, 0.05, 1.8), ((TX0 + TX1) / 2, TY1 + 0.025, -1.0), STEIN, "treppe")
for y in (TY0, (TY0 + TY1) / 2, TY1):
    box("gelaender_pfosten", (0.06, 0.06, 0.9), (TX0 - 0.03, y, 0.45), HOLZ_D, "treppe")
box("gelaender", (0.07, TY1 - TY0 + 0.06, 0.06), (TX0 - 0.03, (TY0 + TY1) / 2, 0.9), HOLZ_D, "treppe")
box("gelaender_h", (TX1 - TX0, 0.07, 0.06), ((TX0 + TX1) / 2, TY1, 0.9), HOLZ_D, "treppe")
for x in (TX1,):
    box("gelaender_pfosten", (0.06, 0.06, 0.9), (x, TY1, 0.45), HOLZ_D, "treppe")

# ---------- Kamera ----------
cam_data = bpy.data.cameras.new("cam")
cam_data.lens = 26
cam = bpy.data.objects.new("cam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
cam.location = (0, -9.4, 1.65)
ziel = bpy.data.objects.new("ziel", None)
scene.collection.objects.link(ziel)
ziel.location = (0, 0, 0.95)
tr = cam.constraints.new("TRACK_TO")
tr.target = ziel
tr.track_axis = "TRACK_NEGATIVE_Z"
tr.up_axis = "UP_Y"

# ---------- Licht: Kaminfeuer, warmes Raumlicht, Mond am Fenster ----------


def licht(name, typ, energie, farbe, loc, rot=(0, 0, 0), groesse=None):
    d = bpy.data.lights.new(name, typ)
    d.energy = energie
    d.color = farbe
    if groesse:
        d.size = groesse
    if typ == "POINT":
        d.shadow_soft_size = 0.15
    ob = bpy.data.objects.new(name, d)
    scene.collection.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = rot
    return ob


licht("feuer", "POINT", 260, (1.0, 0.55, 0.22), (0, -0.95, 0.5))
licht("raum", "AREA", 45, (1.0, 0.82, 0.60), (0, -5.0, 3.3), groesse=5.0)
licht("vorn", "AREA", 42, (1.0, 0.85, 0.70), (0, -9.5, 2.6), rot=(R(75), 0, 0), groesse=4.0)
licht("laterne", "POINT", 14, (1.0, 0.68, 0.30), (LX, LY - 0.25, LZ))
licht("bank", "POINT", 9, (1.0, 0.80, 0.60), (-2.9, BY - 0.6, 0.35))
licht("mond", "AREA", 160, (0.55, 0.70, 1.0), (B - 0.3, FY, FZ), rot=(0, R(-90), 0), groesse=0.9)

world = bpy.data.worlds.new("dunkel")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.02, 0.02, 0.03, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.4

os.makedirs(OUT, exist_ok=True)
scene.render.resolution_percentage = 100
scene.render.use_file_extension = True

# ---------- 1. Das Bild ----------
if not NUR_IDS:
    t0 = time.time()
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = SAMPLES
    scene.cycles.max_bounces = 4
    scene.cycles.use_denoising = True
    scene.render.resolution_x = RESX
    scene.render.resolution_y = RESY
    scene.render.image_settings.file_format = "JPEG"
    scene.render.image_settings.quality = 86
    try:
        scene.view_settings.view_transform = "AgX"
    except Exception:
        scene.view_settings.view_transform = "Standard"
    scene.render.filepath = os.path.join(OUT, "guardroom.jpg")
    bpy.ops.render.render(write_still=True)
    print(f"BILD fertig in {time.time() - t0:.1f} s", flush=True)

# ---------- 2. Tipp-Flaechen: jeder Gegenstand in seiner Farbe, alles andere schwarz ----------


def linear(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


for ob in scene.objects:
    if ob.type != "MESH":
        continue
    grp = ob.get("gruppe")
    ob.color = (*[linear(c) for c in FARBE[grp]], 1) if grp else (0, 0, 0, 1)
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0, 0, 0, 1)
scene.render.engine = "BLENDER_WORKBENCH"
scene.display.shading.light = "FLAT"
scene.display.shading.color_type = "OBJECT"
scene.display.render_aa = "OFF"
scene.view_settings.view_transform = "Standard"
scene.view_settings.look = "None"
IW, IH = RESX // 2, RESY // 2
scene.render.resolution_x = IW
scene.render.resolution_y = IH
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"
scene.render.image_settings.compression = 90
ids_pfad = os.path.join(OUT, "guardroom_ids.png")
scene.render.filepath = ids_pfad
bpy.ops.render.render(write_still=True)

# ---------- 3. Tipp-Flaechen kleiner Dinge vergroessern, dann Lage-Datei aus den Pixeln ----------
MIN_PX = 48                      # kleinste Tipp-Flaeche auf einem Laptop mit 1366 x 768 (Regel: nie unter 44 x 44)
MIN_ID = math.ceil(MIN_PX * IW / 1366)
img = bpy.data.images.load(ids_pfad)
px = np.empty(IW * IH * 4, dtype=np.float32)
img.pixels.foreach_get(px)
px = (px.reshape(IH, IW, 4)[::-1, :, :3] * 255 + 0.5).astype(np.int32)  # Zeile 0 = oben
marke = np.zeros((IH, IW), dtype=np.int32)   # 0 = nichts, sonst Nummer des Gegenstands
for nr, (kennung, _) in enumerate(DINGE, 1):
    marke[(np.abs(px - np.array(FARBE[kennung])) <= 12).all(axis=2)] = nr


def rahmen(nr):
    ys, xs = np.nonzero(marke == nr)
    return (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1) if len(xs) else None


for nr in range(1, len(DINGE) + 1):
    for _ in range(40):
        r = rahmen(nr)
        if r is None or (r[2] - r[0] >= MIN_ID and r[3] - r[1] >= MIN_ID):
            break
        m = marke == nr
        g = m.copy()
        if r[2] - r[0] < MIN_ID:   # nur in die Richtung wachsen, die noch zu klein ist
            g[:, 1:] |= m[:, :-1]
            g[:, :-1] |= m[:, 1:]
        if r[3] - r[1] < MIN_ID:
            g[1:, :] |= m[:-1, :]
            g[:-1, :] |= m[1:, :]
        marke[g & (marke == 0)] = nr   # waechst nur in freie Flaeche, nie ueber andere Dinge
aus = np.zeros((IH, IW, 4), dtype=np.float32)
aus[..., 3] = 1
for nr, (kennung, _) in enumerate(DINGE, 1):
    aus[marke == nr, :3] = np.array(FARBE[kennung]) / 255.0
neu = bpy.data.images.new("ids_neu", IW, IH, alpha=False)
neu.pixels.foreach_set(aus[::-1].ravel())
neu.filepath_raw = ids_pfad
neu.file_format = "PNG"
neu.save()

pruef = bpy.data.images.load(ids_pfad, check_existing=False)
px = np.empty(IW * IH * 4, dtype=np.float32)
pruef.pixels.foreach_get(px)
px = (px.reshape(IH, IW, 4)[::-1, :, :3] * 255 + 0.5).astype(np.int32)
dinge, fehler = [], []
print("Tipp-Flaechen auf 1366 x 768:", flush=True)
for kennung, name in DINGE:
    treffer = (np.abs(px - np.array(FARBE[kennung])) <= 12).all(axis=2)
    n = int(treffer.sum())
    if n < 40:
        fehler.append(f"{kennung}: nur {n} Pixel sichtbar")
        continue
    ys, xs = np.nonzero(treffer)
    b = (xs.max() + 1 - xs.min()) * 1366 / IW
    h = (ys.max() + 1 - ys.min()) * 768 / IH
    if b < 44 or h < 44:
        fehler.append(f"{kennung}: Tipp-Flaeche nur {b:.0f} x {h:.0f}")
    dinge.append({
        "id": kennung, "name": name, "farbe": list(FARBE[kennung]), "pixel": n,
        "box": [round(float(xs.min()) / IW, 4), round(float(ys.min()) / IH, 4),
                round(float(xs.max() + 1) / IW, 4), round(float(ys.max() + 1) / IH, 4)],
        "mitte": [round(float(xs.mean()) / IW, 4), round(float(ys.mean()) / IH, 4)],
    })
    print(f"  {kennung:12s} {b:4.0f} x {h:4.0f}", flush=True)
if not NUR_IDS:   # Vorschau in Laptop-Groesse zum Ansehen (wird nicht eingecheckt)
    v = bpy.data.images.load(os.path.join(OUT, "guardroom.jpg"), check_existing=False)
    v.scale(1366, 768)
    os.makedirs(os.path.join(HERE, "frames"), exist_ok=True)
    v.filepath_raw = os.path.join(HERE, "frames", "guardroom_1366.jpg")
    v.file_format = "JPEG"
    v.save()
with open(os.path.join(OUT, "guardroom.json"), "w", encoding="utf-8") as f:
    json.dump({"raum": "guardroom", "bild": "guardroom.jpg", "flaechen": "guardroom_ids.png",
               "breite": RESX, "hoehe": RESY, "toleranz": 12, "dinge": dinge}, f, ensure_ascii=False, indent=1)
if fehler:
    print("FEHLER – nicht sichtbar: " + "; ".join(fehler), flush=True)
    sys.exit(1)
print(f"ALLES OK – {len(dinge)} Gegenstaende, Dateien in {OUT}", flush=True)
