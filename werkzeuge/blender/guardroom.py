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
box("karte_rahmen", (1.15, 0.04, 0.85), (2.0, -0.02, 2.0), HOLZ_D, "karte")
box("karte", (1.03, 0.02, 0.73), (2.0, -0.045, 2.0), PERGAMENT, "karte")
box("karte_tower", (0.26, 0.01, 0.22), (2.0, -0.06, 2.0), TINTE, "karte")
for dx, dz in [(-0.16, -0.14), (0.16, -0.14), (-0.16, 0.14), (0.16, 0.14)]:
    box("karte_turm", (0.07, 0.01, 0.07), (2.0 + dx, -0.06, 2.0 + dz), TINTE, "karte")
box("karte_mauer", (0.80, 0.01, 0.02), (2.0, -0.06, 1.73), TINTE, "karte")
box("karte_fluss", (0.90, 0.01, 0.035), (2.0, -0.06, 1.68), mat("fluss", (0.25, 0.40, 0.55)), "karte")
box("tuer", (0.95, 0.08, 2.1), (3.35, -0.04, 1.05), HOLZ, None)
box("tuer_band1", (0.95, 0.09, 0.07), (3.35, -0.045, 0.5), EISEN)
box("tuer_band2", (0.95, 0.09, 0.07), (3.35, -0.045, 1.6), EISEN)
ball("tuer_knauf", 0.045, (3.02, -0.11, 1.05), MESSING)
box("laterne_arm", (0.04, 0.22, 0.04), (2.75, -0.11, 1.78), EISEN, "laterne")
box("laterne_dach", (0.20, 0.20, 0.05), (2.75, -0.20, 1.72), EISEN, "laterne")
box("laterne_glas", (0.15, 0.15, 0.24), (2.75, -0.20, 1.58), LATERNE_GLAS, "laterne")
box("laterne_fuss", (0.20, 0.20, 0.04), (2.75, -0.20, 1.45), EISEN, "laterne")

# Kleine Tuer in der dunklen Ecke hinten links (linke Wand)
box("kleine_tuer", (0.06, 0.75, 1.15), (-B + 0.03, -0.75, 0.575), HOLZ_D, "kleine_tuer")
box("kleine_tuer_band", (0.07, 0.75, 0.06), (-B + 0.035, -0.75, 0.85), EISEN, "kleine_tuer")
box("federschloss", (0.08, 0.10, 0.14), (-B + 0.05, -1.02, 0.60), MESSING, "kleine_tuer")

# Bank an der linken Wand, darunter Stiefel und Tanzschuh, darueber das Brett mit dem Helm
BY = -2.9
box("bank", (0.5, 1.9, 0.07), (-3.7, BY, 0.50), HOLZ)
for y in (BY - 0.88, BY + 0.88):
    for x in (-3.9, -3.5):
        box("bank_bein", (0.06, 0.06, 0.48), (x, y, 0.24), HOLZ)
box("stiefel_fuss", (0.34, 0.14, 0.12), (-3.50, BY - 0.35, 0.06), SCHWARZ, "stiefel")
box("stiefel_schaft", (0.15, 0.14, 0.34), (-3.59, BY - 0.35, 0.25), SCHWARZ, "stiefel")
box("tanzschuh", (0.26, 0.09, 0.06), (-3.45, BY + 0.15, 0.05), ROT, "tanzschuh", rot=(0, R(-8), 0))
box("tanzschuh_absatz", (0.05, 0.07, 0.07), (-3.55, BY + 0.15, 0.035), ROT, "tanzschuh")
box("tanzschuh_schleife", (0.07, 0.11, 0.03), (-3.39, BY + 0.15, 0.085), MESSING, "tanzschuh")
box("brett", (0.42, 1.7, 0.05), (-3.78, BY, 1.85), HOLZ)
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
for i, x in enumerate((TXM + 0.12, TXM + 0.52)):
    cyl(f"tasse{i}", 0.055, 0.09, (x, TYM - 0.12, TZ + 0.045), WEISS, "tassen")
    cyl(f"untertasse{i}", 0.09, 0.012, (x, TYM - 0.12, TZ + 0.006), WEISS, "tassen")
    torus(f"tassenhenkel{i}", 0.03, 0.008, (x + 0.07, TYM - 0.12, TZ + 0.05), WEISS, "tassen", rot=(R(90), 0, 0))
box("loeffel", (0.022, 0.15, 0.008), (TXM + 0.32, TYM - 0.12, TZ + 0.005), STAHL, "tassen", rot=(0, 0, R(15)))
ball("loeffel_kopf", 0.022, (TXM + 0.30, TYM - 0.04, TZ + 0.007), STAHL, "tassen", scale=(1, 1.4, 0.3))
for i in range(14):
    kx = TXM - 0.3 + ((i * 37) % 60) / 100.0
    ky = TYM - 0.42 + ((i * 53) % 34) / 100.0
    box(f"kruemel{i}", (0.035, 0.03, 0.02), (kx, ky, 0.01), BROT, "kruemel", rot=(0, 0, i))

# Stuhl mit dem Mantel von Mr Pike (dunkelblau mit rotem Rand)
SX, SY = 1.05, -4.25
box("stuhl_sitz", (0.46, 0.46, 0.05), (SX, SY, 0.46), HOLZ)
for dx in (-0.2, 0.2):
    for dy in (-0.2, 0.2):
        box("stuhlbein", (0.05, 0.05, 0.46), (SX + dx, SY + dy, 0.23), HOLZ)
box("stuhl_lehne", (0.46, 0.05, 0.62), (SX, SY + 0.21, 0.79), HOLZ)
MY = SY + 0.16
box("mantel_ruecken", (0.62, 0.08, 0.80), (SX, MY, 0.74), BLAU, "mantel")
box("mantel_schulter", (0.70, 0.18, 0.08), (SX, MY + 0.04, 1.14), BLAU, "mantel")
box("mantel_kragen", (0.30, 0.19, 0.07), (SX, MY + 0.04, 1.20), ROT, "mantel")
box("mantel_saum", (0.63, 0.085, 0.07), (SX, MY, 0.375), ROT, "mantel")
box("mantel_streifen", (0.07, 0.085, 0.66), (SX, MY, 0.74), ROT, "mantel")
for dx in (-0.39, 0.39):
    box("mantel_aermel", (0.14, 0.12, 0.66), (SX + dx, MY, 0.80), BLAU, "mantel")
    box("mantel_aufschlag", (0.145, 0.125, 0.08), (SX + dx, MY, 0.50), ROT, "mantel")
for k in range(4):
    ball("mantel_knopf", 0.022, (SX + 0.09, MY - 0.045, 0.52 + k * 0.15), MESSING, "mantel")

# Truhe vorn links (die Truhe des Kindes)
CX, CY = -2.6, -0.5
box("truhe", (0.95, 0.55, 0.42), (CX, CY, 0.21), HOLZ, "truhe")
cyl("truhe_deckel", 0.275, 0.95, (CX, CY, 0.42), HOLZ, "truhe", rot=(0, R(90), 0), verts=20)
for dx in (-0.32, 0.32):
    box("truhe_band", (0.06, 0.57, 0.44), (CX + dx, CY, 0.22), EISEN, "truhe")
    cyl("truhe_band_o", 0.285, 0.06, (CX + dx, CY, 0.42), EISEN, "truhe", rot=(0, R(90), 0), verts=20)
box("truhe_schloss", (0.10, 0.03, 0.12), (CX, CY - 0.285, 0.36), MESSING, "truhe")

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
cam_data.lens = 28
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
licht("vorn", "AREA", 30, (1.0, 0.85, 0.70), (0, -9.5, 2.6), rot=(R(75), 0, 0), groesse=4.0)
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

# ---------- 3. Lage-Datei aus den wirklich sichtbaren Pixeln ----------
img = bpy.data.images.load(ids_pfad)
px = np.empty(IW * IH * 4, dtype=np.float32)
img.pixels.foreach_get(px)
px = (px.reshape(IH, IW, 4)[::-1, :, :3] * 255 + 0.5).astype(np.int32)  # Zeile 0 = oben
dinge, fehler = [], []
for kennung, name in DINGE:
    treffer = (np.abs(px - np.array(FARBE[kennung])) <= 12).all(axis=2)
    n = int(treffer.sum())
    if n < 40:
        fehler.append(f"{kennung}: nur {n} Pixel sichtbar")
        continue
    ys, xs = np.nonzero(treffer)
    dinge.append({
        "id": kennung, "name": name, "farbe": list(FARBE[kennung]), "pixel": n,
        "box": [round(float(xs.min()) / IW, 4), round(float(ys.min()) / IH, 4),
                round(float(xs.max() + 1) / IW, 4), round(float(ys.max() + 1) / IH, 4)],
        "mitte": [round(float(xs.mean()) / IW, 4), round(float(ys.mean()) / IH, 4)],
    })
    print(f"  {kennung:12s} {n:6d} Pixel  Rahmen {dinge[-1]['box']}", flush=True)
with open(os.path.join(OUT, "guardroom.json"), "w", encoding="utf-8") as f:
    json.dump({"raum": "guardroom", "bild": "guardroom.jpg", "flaechen": "guardroom_ids.png",
               "breite": RESX, "hoehe": RESY, "toleranz": 12, "dinge": dinge}, f, ensure_ascii=False, indent=1)
if fehler:
    print("FEHLER – nicht sichtbar: " + "; ".join(fehler), flush=True)
    sys.exit(1)
print(f"ALLES OK – {len(dinge)} Gegenstaende, Dateien in {OUT}", flush=True)
