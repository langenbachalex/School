"""Keys of the Tower – Guard Room (Kapitel 1) als Tudor-Wachstube bei Kerzenlicht. Ein Lauf liefert drei Dateien:

  guardroom.jpg       das Bild des Raums
  guardroom_ids.png   Tipp-Flaechen: jeder Gegenstand hat eine eigene Farbe (halbe Groesse)
  guardroom.json      Name, Farbe, Rahmen und Mitte jedes Gegenstands (Anteile 0..1)

Vorher einmal:  python werkzeuge/blender/modelle_holen.py   (freie Modelle und Texturen von Poly Haven, CC0)
Aufruf (Windows, im Repo-Ordner):
  "C:\\Program Files\\Blender Foundation\\Blender 5.3\\blender.exe" -b -P werkzeuge/blender/guardroom.py
Umgebungsvariablen: OUT (Zielordner), RESX, RESY, SAMPLES, NUR_IDS=1 (nur Flaechen, schnell)
Masse in Metern. Rueckwand bei y=0, Kamera schaut in +y, x = rechts, z = oben.
Thema (Mr. Alex 17.11.2026): Wachstube der Yeoman Warders, Tudor – gekalkter Stein, dunkle Eiche, Scharlachrot, Messing;
Licht warmroetlich von Feuer, Laterne und Kerze, Blau nur als Mond am Fenster.
"""
import json
import math
import os
import random
import sys
import time

import bpy
import numpy as np
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
MODELLE = os.path.join(HERE, "modelle")
sys.path.insert(0, HERE)
import tower_jacke  # noqa: E402  (Uniformjacke als Stoff-Simulation)

rnd = random.Random(7)   # fester Zufall: jedes Rechnen ergibt dasselbe Bild
OUT = os.environ.get("OUT", os.path.join(REPO, "app", "tower", "raum"))
RESX = int(os.environ.get("RESX", 1920))
RESY = int(os.environ.get("RESY", 1080))
SAMPLES = int(os.environ.get("SAMPLES", 128))
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

if not os.path.isdir(os.path.join(MODELLE, "tea_set_01")):
    print("FEHLER: Modelle fehlen – zuerst  python werkzeuge/blender/modelle_holen.py", flush=True)
    sys.exit(1)

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


def textur(name, ordner, achsen, mass=0.5, ton=(1, 1, 1), relief=0.35):
    """Poly-Haven-Textur, ueber Welt-Koordinaten aufgelegt (achsen = die zwei Achsen der Flaeche), eingefaerbt mit ton."""
    m = mat(name, (0.5, 0.5, 0.5))
    nt = m.node_tree
    b = nt.nodes.get("Principled BSDF")
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    comb = nt.nodes.new("ShaderNodeCombineXYZ")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (mass, mass, mass)
    nt.links.new(geo.outputs["Position"], sep.inputs[0])
    nt.links.new(sep.outputs[achsen[0]], comb.inputs["X"])
    nt.links.new(sep.outputs[achsen[1]], comb.inputs["Y"])
    nt.links.new(comb.outputs[0], mp.inputs["Vector"])

    def bild(datei, farbraum):
        n = nt.nodes.new("ShaderNodeTexImage")
        n.image = bpy.data.images.load(os.path.join(MODELLE, ordner, datei), check_existing=True)
        n.image.colorspace_settings.name = farbraum
        nt.links.new(mp.outputs["Vector"], n.inputs["Vector"])
        return n

    d, r = bild("diff.jpg", "sRGB"), bild("rough.jpg", "Non-Color")
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    mix.inputs[0].default_value = 1.0
    nt.links.new(d.outputs["Color"], mix.inputs[6])
    mix.inputs[7].default_value = (*ton, 1)
    nt.links.new(mix.outputs[2], b.inputs["Base Color"])
    nt.links.new(r.outputs["Color"], b.inputs["Roughness"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = relief
    nt.links.new(d.outputs["Color"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    return m


KALK = (2.6, 2.35, 2.0)       # gekalkter Stein, leicht warm
EICHE = (0.55, 0.38, 0.26)     # dunkle Eiche
WAND_H = textur("wand_hinten", "plastered_stone_wall", "XZ", 0.45, KALK)
WAND_S = textur("wand_seite", "plastered_stone_wall", "YZ", 0.45, KALK)
BODEN = textur("boden", "old_wood_floor", "YX", 0.5, (0.75, 0.58, 0.45))
STEIN_H = textur("stein_hinten", "medieval_blocks_02", "XZ", 0.6, (0.95, 0.88, 0.78))
STEIN_S = textur("stein_seite", "medieval_blocks_02", "YZ", 0.6, (0.95, 0.88, 0.78))
STEIN_B = textur("stein_boden", "medieval_blocks_02", "XY", 0.6, (0.85, 0.80, 0.72))
EICHE_H = textur("eiche_hinten", "dark_wood", "XZ", 0.9, EICHE)
EICHE_S = textur("eiche_seite", "dark_wood", "YZ", 0.9, EICHE)
EICHE_B = textur("eiche_boden", "dark_wood", "XY", 0.9, EICHE)
EICHE_HELL = textur("eiche_hell", "dark_wood", "XZ", 0.9, (1.5, 1.05, 0.65))
RUSS = mat("russ", (0.015, 0.012, 0.01), 1.0)
EISEN = mat("eisen", (0.07, 0.07, 0.075), 0.5, 0.9)
STAHL = mat("stahl", (0.70, 0.71, 0.74), 0.28, 1.0)
SILBER = mat("silber", (0.86, 0.84, 0.80), 0.42, 1.0)
MESSING = mat("messing", (0.90, 0.62, 0.20), 0.3, 1.0)
LEDER = mat("leder_braun", (0.16, 0.08, 0.04), 0.45)
SCHWARZ = mat("leder_schwarz", (0.03, 0.03, 0.035), 0.4)
ROT = mat("scharlach", (0.70, 0.04, 0.05), 0.55)
SEIDE = mat("seide_rot", (0.80, 0.05, 0.10), 0.3)
BLAU = mat("jacke_blau", (0.04, 0.06, 0.20), 0.85)
PERGAMENT = mat("pergament", (0.78, 0.63, 0.40), 0.9)
TINTE = mat("tinte", (0.18, 0.10, 0.05), 0.9)
TINTE_ROT = mat("tinte_rot", (0.50, 0.08, 0.05), 0.9)
WASSER = mat("tinte_blau", (0.22, 0.35, 0.48), 0.9)
PAPIER = mat("papier", (0.88, 0.80, 0.62), 0.9)
BROT = mat("kruemel", (0.90, 0.74, 0.46), 0.9)
BROT_D = mat("kruemel_dunkel", (0.72, 0.52, 0.28), 0.9)
KAESE = mat("kaese", (0.95, 0.72, 0.15), 0.5)


def brot_material(name, hell, dunkel, poren):
    m = mat(name, hell, 0.95)
    nt = m.node_tree
    b = nt.nodes.get("Principled BSDF")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    rausch = nt.nodes.new("ShaderNodeTexNoise")
    rausch.inputs["Scale"].default_value = 35
    rausch.inputs["Detail"].default_value = 6
    zellen = nt.nodes.new("ShaderNodeTexVoronoi")
    zellen.inputs["Scale"].default_value = poren
    rampe = nt.nodes.new("ShaderNodeValToRGB")
    rampe.color_ramp.elements[0].position = 0.0
    rampe.color_ramp.elements[0].color = (*dunkel, 1)
    rampe.color_ramp.elements[1].position = 0.22
    rampe.color_ramp.elements[1].color = (*hell, 1)
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    mix.inputs[0].default_value = 0.35
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.6
    nt.links.new(tc.outputs["Object"], rausch.inputs["Vector"])
    nt.links.new(tc.outputs["Object"], zellen.inputs["Vector"])
    nt.links.new(zellen.outputs["Distance"], rampe.inputs["Fac"])
    nt.links.new(rampe.outputs["Color"], mix.inputs[6])
    nt.links.new(rausch.outputs["Color"], mix.inputs[7])
    nt.links.new(mix.outputs[2], b.inputs["Base Color"])
    nt.links.new(zellen.outputs["Distance"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    return m


TOAST = brot_material("toast", (0.95, 0.84, 0.60), (0.62, 0.44, 0.22), 160)
KRUME = brot_material("krume", (0.93, 0.80, 0.55), (0.60, 0.42, 0.20), 60)
RINDE_B = brot_material("brotrinde", (0.55, 0.33, 0.13), (0.30, 0.16, 0.05), 120)
KRUSTE = mat("kruste", (0.50, 0.30, 0.12), 0.85)
SCHINKEN = mat("schinken", (0.85, 0.42, 0.40), 0.6)
SALAT = mat("salat", (0.30, 0.55, 0.15), 0.6)
RINDE = mat("rinde", (0.12, 0.07, 0.04), 0.95)
ZIFFER = mat("zifferblatt", (0.90, 0.84, 0.66), 0.6, emit=0.12)
NACHT = mat("nacht", (0.07, 0.13, 0.36), 0.25, emit=0.9)
FENSTERSTEIN = mat("fensterstein", (0.30, 0.26, 0.21), 0.92)
WACHS = mat("wachs", (0.92, 0.85, 0.65), 0.6, emit=0.15)


def flamme_material(name, staerke):
    """Flamme: unten tiefrot, Mitte orange, Spitze gelb; zur Spitze hin durchsichtig."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    farbe = nt.nodes.new("ShaderNodeValToRGB")
    farbe.color_ramp.elements[0].position = 0.0
    farbe.color_ramp.elements[0].color = (0.9, 0.06, 0.0, 1)
    farbe.color_ramp.elements[1].position = 1.0
    farbe.color_ramp.elements[1].color = (1.0, 0.50, 0.06, 1)
    mitte = farbe.color_ramp.elements.new(0.55)
    mitte.color = (1.0, 0.20, 0.01, 1)
    durch = nt.nodes.new("ShaderNodeValToRGB")
    durch.color_ramp.elements[0].position = 0.5
    durch.color_ramp.elements[0].color = (0, 0, 0, 1)
    durch.color_ramp.elements[1].position = 1.0
    durch.color_ramp.elements[1].color = (0.85, 0.85, 0.85, 1)
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Strength"].default_value = staerke
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    mix = nt.nodes.new("ShaderNodeMixShader")
    aus = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(tc.outputs["Generated"], sep.inputs[0])
    nt.links.new(sep.outputs["Z"], farbe.inputs["Fac"])
    nt.links.new(sep.outputs["Z"], durch.inputs["Fac"])
    nt.links.new(farbe.outputs["Color"], em.inputs["Color"])
    nt.links.new(durch.outputs["Color"], mix.inputs["Fac"])
    nt.links.new(em.outputs[0], mix.inputs[1])
    nt.links.new(tr.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], aus.inputs["Surface"])
    return m


FLAMME = flamme_material("flamme", 1.0)
FLAMME_KERN = mat("flamme_kern", (1.0, 0.62, 0.10), emit=2.0)
FLAMME_KLEIN = flamme_material("flamme_klein", 4.0)
GLUT = mat("glut", (1.0, 0.16, 0.01), emit=2.2)

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


def cone(name, r, depth, loc, material, grp=None, verts=8, r2=0.0, rot=(0, 0, 0), glatt=False):
    bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r2, depth=depth, location=loc, vertices=verts, rotation=rot)
    if glatt:
        bpy.ops.object.shade_smooth()
    return fertig(bpy.context.object, name, material, grp)


def ball(name, r, loc, material, grp=None, scale=(1, 1, 1), rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=32, ring_count=16, rotation=rot)
    ob = bpy.context.object
    ob.scale = scale
    bpy.ops.object.shade_smooth()
    return fertig(ob, name, material, grp)


def torus(name, R_, r, loc, material, grp=None, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R_, minor_radius=r, location=loc, rotation=rot)
    bpy.ops.object.shade_smooth()
    return fertig(bpy.context.object, name, material, grp)


def weich(ob, breite=0.03):
    """Kanten abrunden (Stoff, Leder): Groesse fest einrechnen, Fase, glatt schattieren."""
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    m = ob.modifiers.new("fase", "BEVEL")
    m.width = breite
    m.segments = 4
    for p in ob.data.polygons:
        p.use_smooth = True
    return ob


def schrift(text, ort, groesse, material, grp=None, rot=(R(90), 0, 0)):
    cu = bpy.data.curves.new("schrift", "FONT")
    cu.body = text
    cu.align_x = "CENTER"
    cu.align_y = "CENTER"
    cu.size = groesse
    cu.extrude = 0.002
    ob = bpy.data.objects.new("schrift_" + text[:8], cu)
    scene.collection.objects.link(ob)
    ob.location = ort
    ob.rotation_euler = rot
    cu.materials.append(material)
    if grp:
        ob["gruppe"] = grp
    return ob


def modell(name, ort, groesse=1.0, dreh=0.0, grp=None, teile=None, ersatz=None):
    """Poly-Haven-Modell laden und mit der Unterkante seiner Mitte auf ort stellen. teile = nur Objekte mit diesen Namensanfaengen."""
    vorher = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(MODELLE, name, name + ".gltf"))
    bpy.context.view_layer.update()
    neu = [o for o in bpy.data.objects if o not in vorher]
    netze = [o for o in neu if o.type == "MESH" and (teile is None or any(o.name.startswith(t) for t in teile))]
    for o in netze:
        mw = o.matrix_world.copy()
        o.parent = None
        o.matrix_world = mw
    for o in neu:
        if o not in netze:
            bpy.data.objects.remove(o, do_unlink=True)
    bpy.context.view_layer.update()
    ecken = [o.matrix_world @ Vector(c) for o in netze for c in o.bound_box]
    lo = [min(e[i] for e in ecken) for i in range(3)]
    hi = [max(e[i] for e in ecken) for i in range(3)]
    anker = bpy.data.objects.new(name + "_anker", None)
    scene.collection.objects.link(anker)
    anker.location = ((lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, lo[2])
    bpy.context.view_layer.update()
    for o in netze:
        mw = o.matrix_world.copy()
        o.parent = anker
        o.matrix_parent_inverse = anker.matrix_world.inverted()
        o.matrix_world = mw
        if grp:
            o["gruppe"] = grp
        if ersatz:
            o.data = o.data.copy()
            o.data.materials.clear()
            o.data.materials.append(ersatz)
            for platz in o.material_slots:
                platz.material = ersatz
    anker.location = ort
    anker.scale = (groesse,) * 3 if isinstance(groesse, (int, float)) else groesse
    anker.rotation_euler = (0, 0, dreh)
    return anker


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
box("decke", (2 * B, -T, 0.2), (0, T / 2, H + 0.1), EICHE_B)
for i in range(6):
    box(f"balken{i}", (2 * B, 0.26, 0.30), (0, -0.7 - i * 1.7, H - 0.15), EICHE_H)
for x in (-B + 0.13, B - 0.13):
    box("laengsbalken", (0.26, -T, 0.26), (x, T / 2, H - 0.43), EICHE_S)

# Halbhohe Eichenvertaefelung mit Leisten
VH = 1.05
box("taefel_hinten", (2 * B, 0.04, VH), (0, -0.02, VH / 2), EICHE_H)
box("taefel_links", (0.04, -T, VH), (-B + 0.02, T / 2, VH / 2), EICHE_S)
box("taefel_rechts", (0.04, -T, VH), (B - 0.02, T / 2, VH / 2), EICHE_S)
box("leiste_hinten", (2 * B, 0.08, 0.07), (0, -0.04, VH), EICHE_H)
box("leiste_links", (0.08, -T, 0.07), (-B + 0.04, T / 2, VH), EICHE_S)
box("leiste_rechts", (0.08, -T, 0.07), (B - 0.04, T / 2, VH), EICHE_S)
for i in range(12):
    x = -B + 0.35 + i * 0.66
    box("steg_hinten", (0.07, 0.06, VH), (x, -0.03, VH / 2), EICHE_H)
for i in range(11):
    y = -0.5 - i * 0.66
    box("steg_links", (0.06, 0.07, VH), (-B + 0.03, y, VH / 2), EICHE_S)
    box("steg_rechts", (0.06, 0.07, VH), (B - 0.03, y, VH / 2), EICHE_S)

# ---------- Kamin mit flachem Tudor-Bogen, Feuer mit Tiefe ----------
KT = 0.75   # Tiefe der Feuerstelle in den Raum
box("kamin_l", (0.42, KT, 1.55), (-1.0, -KT / 2, 0.775), STEIN_H, "kamin")
box("kamin_r", (0.42, KT, 1.55), (1.0, -KT / 2, 0.775), STEIN_H, "kamin")
box("kamin_sturz", (2.42, KT, 0.38), (0, -KT / 2, 1.74), STEIN_H, "kamin")
for s in (-1, 1):   # flacher Tudor-Bogen: kleine Eckkonsolen unter dem Sturz
    box("kamin_konsole", (0.20, KT, 0.20), (s * 0.70, -KT / 2, 1.46), STEIN_H, "kamin", rot=(0, R(45), 0))
box("kamin_sims", (2.75, KT + 0.14, 0.12), (0, -KT / 2 - 0.05, 1.99), STEIN_H, "kamin")
box("kamin_esse", (2.0, 0.5, H - 2.05), (0, -0.25, (H + 2.05) / 2), WAND_H)
box("kamin_rueck", (1.6, 0.04, 1.6), (0, -0.03, 0.8), RUSS, "kamin")
box("kamin_innen_l", (0.03, KT - 0.1, 1.6), (-0.78, -KT / 2, 0.8), RUSS, "kamin")
box("kamin_innen_r", (0.03, KT - 0.1, 1.6), (0.78, -KT / 2, 0.8), RUSS, "kamin")
box("kamin_herd", (1.9, KT + 0.35, 0.06), (0, -KT / 2 - 0.12, 0.03), STEIN_B, "kamin")
for s in (-1, 1):   # Feuerboecke aus Eisen
    box("feuerbock", (0.04, 0.5, 0.05), (s * 0.42, -0.42, 0.20), EISEN, "kamin")
    box("feuerbock_fuss", (0.04, 0.04, 0.34), (s * 0.42, -0.66, 0.20), EISEN, "kamin")
    ball("feuerbock_knauf", 0.045, (s * 0.42, -0.66, 0.40), MESSING, "kamin")
for i, (x, y, z, rz) in enumerate([(-0.02, -0.40, 0.29, 4), (0.05, -0.30, 0.30, -6), (-0.05, -0.50, 0.30, 8), (0.0, -0.36, 0.41, 20), (0.06, -0.46, 0.42, -18)]):
    cyl(f"scheit{i}", 0.065, 1.0, (x, y, z), RINDE, "kamin", rot=(0, R(90), R(rz)), verts=12)
box("glut", (0.95, 0.42, 0.05), (0, -0.40, 0.085), GLUT, "kamin")
FL = [(-0.36, -0.40, 0.34, 0.085), (-0.25, -0.30, 0.52, 0.095), (-0.15, -0.46, 0.66, 0.10), (-0.04, -0.34, 0.78, 0.105), (0.07, -0.44, 0.70, 0.10),
      (0.17, -0.30, 0.58, 0.095), (0.27, -0.42, 0.46, 0.09), (0.37, -0.34, 0.32, 0.08), (-0.09, -0.56, 0.40, 0.075), (0.12, -0.58, 0.36, 0.07),
      (0.0, -0.24, 0.50, 0.09), (-0.30, -0.54, 0.26, 0.065), (0.31, -0.56, 0.24, 0.06)]
for i, (x, y, h, r) in enumerate(FL):   # Flammen als Tropfen: aussen rot-orange, innen ein gelber Kern; sie werfen keinen Schatten
    neig = (R((i * 7 % 11 - 5) * 1.6), R((i * 5 % 9 - 4) * 2.2), 0)
    f = ball(f"flamme{i}", r, (x, y, 0.34 + h / 2), FLAMME, "kamin", scale=(1.0, 0.75, h / (2 * r)), rot=neig)
    k = ball(f"flamme_kern{i}", r * 0.42, (x, y - 0.03, 0.34 + h * 0.28), FLAMME_KERN, "kamin", scale=(1.0, 0.75, h * 0.42 / (2 * r * 0.42)), rot=neig)
    f.visible_shadow = k.visible_shadow = False
box("brief", (0.22, 0.15, 0.012), (0.60, -0.62, 0.075), PAPIER, "kamin", rot=(0, R(-10), R(25)))

# Uhr ueber dem Kamin: zwanzig nach neun (Messingrand, Eichenkasten)
UY, UZ = -0.52, 2.62
cyl("uhr_kasten", 0.40, 0.12, (0, UY + 0.02, UZ), EICHE_H, "uhr", rot=(R(90), 0, 0), verts=40)
torus("uhr_rand", 0.37, 0.035, (0, UY - 0.04, UZ), MESSING, "uhr", rot=(R(90), 0, 0))
cyl("uhr_blatt", 0.34, 0.02, (0, UY - 0.045, UZ), ZIFFER, "uhr", rot=(R(90), 0, 0), verts=40)
for k in range(12):
    a = R(k * 30)
    lang = 0.085 if k % 3 == 0 else 0.05
    box(f"uhr_strich{k}", (0.022 if k % 3 == 0 else 0.014, 0.01, lang), (math.sin(a) * 0.275, UY - 0.06, UZ + math.cos(a) * 0.275), TINTE, "uhr", rot=(0, a, 0))
for nm, a, lang, dick in [("stunde", R(280), 0.17, 0.035), ("minute", R(120), 0.26, 0.024)]:
    box(f"uhr_{nm}", (dick, 0.012, lang), (math.sin(a) * lang / 2, UY - 0.07, UZ + math.cos(a) * lang / 2), SCHWARZ, "uhr", rot=(0, a, 0))
ball("uhr_nabe", 0.025, (0, UY - 0.075, UZ), MESSING, "uhr")

# Sieben leere Schluesselhaken links vom Kamin: Eichenbrett, geschmiedete Haken
HX, HZ = -2.25, 1.62
box("haken_brett", (1.80, 0.05, 0.28), (HX, -0.07, HZ), EICHE_HELL, "haken")
for i in range(7):
    x = HX + (i - 3) * 0.24
    cyl(f"haken{i}", 0.020, 0.12, (x, -0.14, HZ - 0.05), MESSING, "haken", rot=(R(90), 0, 0), verts=10)
    cyl(f"haken_spitze{i}", 0.020, 0.10, (x, -0.20, HZ - 0.01), MESSING, "haken", verts=10)
    ball(f"haken_niet{i}", 0.03, (x, -0.10, HZ + 0.07), MESSING, "haken")

WKX, WKZ = -1.22, 1.75
box("wandkerze_arm", (0.04, 0.26, 0.04), (WKX, -0.13, WKZ), EISEN)
cyl("wandkerze_teller", 0.07, 0.015, (WKX, -0.26, WKZ + 0.02), MESSING, verts=16)
cyl("wandkerze", 0.025, 0.20, (WKX, -0.26, WKZ + 0.12), WACHS, verts=12)
cone("wandkerze_flamme", 0.02, 0.085, (WKX, -0.26, WKZ + 0.27), FLAMME_KLEIN, verts=12, glatt=True)

# Karte darueber: alter Plan des Towers auf Pergament, Schrift TOWER MAP
KX, KZ, KY = -2.25, 2.55, -0.06
box("karte_rahmen", (1.72, 0.05, 1.22), (KX, -0.025, KZ), EICHE_H, "karte")
box("karte", (1.56, 0.02, 1.06), (KX, -0.05, KZ), PERGAMENT, "karte")
schrift("TOWER MAP", (KX, KY - 0.01, KZ + 0.40), 0.17, TINTE, "karte")
schrift("London", (KX + 0.50, KY - 0.01, KZ + 0.22), 0.07, TINTE_ROT, "karte")
box("karte_fluss", (1.50, 0.006, 0.11), (KX, KY, KZ - 0.42), WASSER, "karte")
schrift("River Thames", (KX, KY - 0.012, KZ - 0.42), 0.06, PERGAMENT, "karte")
MZ = KZ - 0.06   # Mitte der Burg


def linie(x0, z0, x1, z1, dick=0.022, material=TINTE):
    lang = math.hypot(x1 - x0, z1 - z0)
    box("karte_linie", (lang, 0.006, dick), (KX + (x0 + x1) / 2, KY, MZ + (z0 + z1) / 2), material, "karte", rot=(0, -math.atan2(z1 - z0, x1 - x0), 0))


aussen = [(-0.56, -0.22), (-0.50, 0.20), (-0.10, 0.27), (0.42, 0.22), (0.56, -0.08), (0.48, -0.24)]
for i in range(len(aussen)):   # aeussere Mauer mit Tuermen an den Ecken
    (x0, z0), (x1, z1) = aussen[i], aussen[(i + 1) % len(aussen)]
    linie(x0, z0, x1, z1)
    cyl("karte_turm", 0.035, 0.008, (KX + x0, KY - 0.002, MZ + z0), TINTE, "karte", rot=(R(90), 0, 0), verts=12)
innen = [(-0.36, -0.13), (-0.32, 0.11), (0.28, 0.12), (0.34, -0.13)]
for i in range(len(innen)):    # innere Mauer
    (x0, z0), (x1, z1) = innen[i], innen[(i + 1) % len(innen)]
    linie(x0, z0, x1, z1, 0.014)
box("karte_white_tower", (0.20, 0.008, 0.17), (KX - 0.02, KY - 0.002, MZ), TINTE_ROT, "karte")
for dx, dz in [(-0.1, -0.085), (0.1, -0.085), (-0.1, 0.085), (0.1, 0.085)]:
    cyl("karte_eckturm", 0.03, 0.01, (KX - 0.02 + dx, KY - 0.004, MZ + dz), TINTE_ROT, "karte", rot=(R(90), 0, 0), verts=12)
for a in range(0, 360, 45):    # Windrose
    lang = 0.10 if a % 90 == 0 else 0.06
    box("karte_rose", (0.016, 0.006, lang), (KX + 0.62 + math.sin(R(a)) * lang / 2, KY, KZ - 0.20 + math.cos(R(a)) * lang / 2), TINTE, "karte", rot=(0, R(a), 0))
schrift("N", (KX + 0.62, KY - 0.01, KZ - 0.05), 0.06, TINTE, "karte")

# Rechts vom Kamin: Wappenschild, Holzlaterne am Eisenarm, Eingangstuer (vor der Vertaefelung), Partisane in der Ecke, Fass
modell("kite_shield", (1.80, -0.12, 1.75), 0.72)
LX, LY, LZ = 2.22, -0.36, 1.22
box("laterne_arm", (0.04, 0.42, 0.04), (LX, -0.20, LZ + 0.74), EISEN, "laterne")
box("laterne_stuetze", (0.035, 0.035, 0.36), (LX, -0.05, LZ + 0.58), EISEN, "laterne", rot=(R(-35), 0, 0))
torus("laterne_ring", 0.035, 0.008, (LX, LY, LZ + 0.70), EISEN, "laterne", rot=(R(90), 0, 0))
modell("Lantern_01", (LX, LY, LZ), 2.3, grp="laterne")
cone("laterne_flamme", 0.035, 0.13, (LX, LY, LZ + 0.26), FLAMME_KLEIN, "laterne", verts=12, glatt=True)
modell("large_castle_door", (3.22, -0.20, 0.0), 0.72)
# Zweite, kleine Laterne (gleiches Modell) an der linken Wand ueber der Truhe: hellt die Ecke auf
EX, EY, EZ = -3.74, -0.95, 1.25
box("ecklaterne_arm", (0.34, 0.035, 0.035), (-3.84, EY, EZ + 0.50), EISEN)
torus("ecklaterne_ring", 0.025, 0.006, (EX, EY, EZ + 0.48), EISEN, rot=(0, R(90), 0))
modell("Lantern_01", (EX, EY, EZ), 1.6, dreh=R(90))
cone("ecklaterne_flamme", 0.025, 0.09, (EX, EY, EZ + 0.18), FLAMME_KLEIN, verts=12, glatt=True)
cyl("partisane_schaft", 0.022, 2.5, (3.90, -0.42, 1.22), EICHE_H, rot=(R(4), R(-3), 0), verts=10)
cone("partisane_klinge", 0.07, 0.42, (3.965, -0.51, 2.66), STAHL, verts=4, rot=(R(4), R(-3), R(45)))
ball("partisane_quaste", 0.05, (3.955, -0.495, 2.40), ROT, scale=(1, 1, 1.5))
modell("wine_barrel_01", (3.45, -1.25, 0.0), 0.9)

# Kleine Tuer in der dunklen Ecke hinten links (Rueckwand), mit dem Federschloss
TKX = -3.5
box("kleine_tuer", (0.78, 0.07, 1.20), (TKX, -0.06, 0.60), EICHE_H, "kleine_tuer")
for z in (0.25, 0.95):
    box("kleine_tuer_band", (0.70, 0.08, 0.06), (TKX, -0.065, z), EISEN, "kleine_tuer")
box("federschloss", (0.11, 0.08, 0.15), (TKX + 0.27, -0.08, 0.60), MESSING, "kleine_tuer")

# Linke Wand: Truhe des Kindes, dann die Bank mit Stiefel und Tanzschuh, darueber das Brett mit dem Helm
modell("treasure_chest", (-3.56, -1.30, 0.0), 1.12, dreh=R(90), grp="truhe")
BY = -2.85
box("bank", (0.55, 1.65, 0.07), (-3.70, BY, 0.56), EICHE_B)
for y in (BY - 0.74, BY + 0.74):
    for x in (-3.92, -3.48):
        box("bank_bein", (0.07, 0.07, 0.54), (x, y, 0.27), EICHE_S)
    box("bank_strebe", (0.42, 0.05, 0.06), (-3.70, y, 0.16), EICHE_S)
modell("rubber_boots", (-3.58, BY - 0.20, 0.0), 1.30, dreh=R(90), grp="stiefel", teile=["rubber_boots_l"], ersatz=LEDER)
box("stiefel_stulpe", (0.20, 0.17, 0.06), (-3.70, BY - 0.20, 0.45), SCHWARZ, "stiefel")
# Tanzschuh (Seitenansicht zur Kamera): ein geformter Koerper mit spitzer Kappe, hoher Ferse, Absatz, Riemen und Schnalle
def kurve(punkte, t):
    for (t0, w0), (t1, w1) in zip(punkte, punkte[1:]):
        if t <= t1:
            return w0 + (w1 - w0) * (t - t0) / (t1 - t0)
    return punkte[-1][1]


SL = 0.44                                  # Laenge des Schuhs (groesser als echt, damit man ihn erkennt)
SCX, SCY = -3.50, BY + 0.38                # Mitte
S_BREIT = [(0, 0.03), (0.06, 0.10), (0.3, 0.115), (0.62, 0.135), (0.85, 0.085), (1, 0.012)]
S_SOHLE = [(0, 0.27), (0.1, 0.25), (0.55, 0.03), (0.7, 0.0), (0.95, 0.0), (1, 0.02)]
S_HOCH = [(0, 0.10), (0.06, 0.24), (0.3, 0.17), (0.55, 0.14), (0.75, 0.13), (1, 0.035)]
SK, SM = 22, 18
s_pkt, s_fl = [], []
for k in range(SK + 1):
    t = k / SK
    hw, zb, hh = kurve(S_BREIT, t) * SL, kurve(S_SOHLE, t) * SL, kurve(S_HOCH, t) * SL
    for m in range(SM):
        w = 2 * math.pi * m / SM
        sn = math.sin(w)
        s_pkt.append((SCX - SL / 2 + t * SL, SCY + hw * math.cos(w), zb + hh / 2 + hh / 2 * math.copysign(abs(sn) ** 0.7, sn)))
for k in range(SK):
    for m in range(SM):
        a, b = k * SM + m, k * SM + (m + 1) % SM
        s_fl.append((a, b, b + SM, a + SM))
s_fl.append(tuple(range(SM - 1, -1, -1)))
s_fl.append(tuple(range(SK * SM, SK * SM + SM)))
s_netz = bpy.data.meshes.new("tanzschuh")
s_netz.from_pydata(s_pkt, [], s_fl)
s_netz.update()
schuh = bpy.data.objects.new("tanzschuh", s_netz)
scene.collection.objects.link(schuh)
for f in s_netz.polygons:
    f.use_smooth = True
schuh.modifiers.new("glatt", "SUBSURF").levels = 1
fertig(schuh, "tanzschuh", SEIDE, "tanzschuh")
cone("tanzschuh_absatz", 0.07 * SL, 0.26 * SL, (SCX - SL / 2 + 0.085 * SL, SCY, 0.13 * SL), SEIDE, "tanzschuh", verts=16, r2=0.035 * SL, rot=(R(180), 0, 0))
ball("tanzschuh_oeffnung", 0.5, (SCX - SL / 2 + 0.30 * SL, SCY, (kurve(S_SOHLE, 0.3) + kurve(S_HOCH, 0.3)) * SL - 0.004), SCHWARZ, "tanzschuh",
     scale=(0.24 * SL * 2, 0.085 * SL * 2, 0.02), rot=(0, R(32), 0))
box("tanzschuh_riemen", (0.035 * SL, 0.25 * SL, 0.012), (SCX - SL / 2 + 0.44 * SL, SCY, (kurve(S_SOHLE, 0.44) + kurve(S_HOCH, 0.44)) * SL + 0.012), SEIDE, "tanzschuh")
box("tanzschuh_schnalle", (0.07 * SL, 0.02, 0.06 * SL), (SCX - SL / 2 + 0.44 * SL, SCY - 0.125 * SL, (kurve(S_SOHLE, 0.44) + kurve(S_HOCH, 0.44) * 0.75) * SL), MESSING, "tanzschuh")
for s_ in (-1, 1):
    ball("tanzschuh_schleife", 0.045 * SL, (SCX - SL / 2 + 0.70 * SL, SCY + s_ * 0.05 * SL, 0.15 * SL), SEIDE, "tanzschuh", scale=(0.8, 1.3, 0.6))
ball("tanzschuh_schleifenknopf", 0.022 * SL, (SCX - SL / 2 + 0.70 * SL, SCY, 0.16 * SL), MESSING, "tanzschuh")
# Helm: Morion (Seitenansicht zur Kamera) – hohe Glocke, Kamm darueber, Krempe vorn und hinten spitz hochgezogen
box("brett", (0.46, 1.5, 0.06), (-3.76, BY, 1.82), EICHE_B)
for y in (BY - 0.6, BY + 0.6):
    box("brett_stuetze", (0.34, 0.05, 0.05), (-3.80, y, 1.70), EICHE_S, rot=(0, R(35), 0))
HMX, HMZ = -3.70, 1.85
cyl("helm_staender", 0.05, 0.14, (HMX, BY, HMZ + 0.07), EICHE_B, verts=12)
ball("helm", 0.20, (HMX, BY, HMZ + 0.26), STAHL, "helm", scale=(1.15, 0.9, 1.2))
cyl("helm_kamm", 0.33, 0.035, (HMX, BY, HMZ + 0.25), STAHL, "helm", rot=(R(90), 0, 0), verts=48).scale = (0.80, 1.0, 1.0)
ball("helm_krempe", 0.20, (HMX, BY, HMZ + 0.12), STAHL, "helm", scale=(1.55, 1.05, 0.12))
for s in (-1, 1):
    cone("helm_spitze", 0.08, 0.24, (HMX + s * 0.34, BY, HMZ + 0.19), STAHL, "helm", verts=20, glatt=True, rot=(0, R(s * 50), 0))
for dx in (-0.12, 0.0, 0.12):
    ball("helm_niet", 0.018, (HMX + dx, BY - 0.165, HMZ + 0.17), MESSING, "helm")

# Tisch mit Teekanne, zwei Tassen, Loeffel dazwischen und Kerze; Kruemel darunter
TXM, TYM = -0.9, -4.4
modell("WoodenTable_01", (TXM, TYM, 0.0), (1.0, 1.3, 1.42))
TZ = 0.55 * 1.42
modell("tea_set_01", (TXM - 0.50, TYM - 0.05, TZ), 1.9, dreh=R(90), grp="teekanne", teile=["tea_set_01_teapot_01"])
for i, x in enumerate((TXM + 0.02, TXM + 0.56)):
    modell("tea_set_01", (x, TYM - 0.16, TZ), 1.9, grp="tassen", teile=["tea_set_01_saucer_circular_03"])
    modell("tea_set_01", (x, TYM - 0.16, TZ + 0.012), 1.9, dreh=R(40 + i * 100), grp="tassen", teile=["tea_set_01_cup_small_01"])
loeffel = modell("wooden_spoon", (TXM + 0.29, TYM - 0.24, TZ + 0.001), 2.1, dreh=R(45), grp="tassen", ersatz=SILBER)   # schraeg, damit man Stiel und Laffe sieht
KEX, KEY = TXM + 0.30, TYM + 0.22
modell("brass_candleholders", (KEX, KEY, TZ), 0.9, teile=["brass_candleholder_02"])
# Angebissenes Sandwich: dreieckig geschnittenes Toastbrot, Schnittkante mit Schinken, Kaese und Salat zeigt zur Kamera
SWX, SWY, SWW, SWL = TXM + 0.05, TYM - 0.45, R(10), 0.44   # Mitte der Schnittkante, Drehung, Laenge der Schnittkante


def sw_ort(x, y):
    return (SWX + x * math.cos(SWW) - y * math.sin(SWW), SWY + x * math.sin(SWW) + y * math.cos(SWW))


def dreieck(name, z0, hoehe, material, mass=1.0, fase=0.006):
    a = SWL / 2 * mass
    pkt = [(-a, 0, 0), (a, 0, 0), (0, a, 0), (-a, 0, hoehe), (a, 0, hoehe), (0, a, hoehe)]
    netz = bpy.data.meshes.new(name)
    netz.from_pydata(pkt, [], [(0, 2, 1), (3, 4, 5), (0, 1, 4, 3), (1, 2, 5, 4), (2, 0, 3, 5)])
    netz.update()
    ob = bpy.data.objects.new(name, netz)
    scene.collection.objects.link(ob)
    ob.location = (SWX, SWY, z0)
    ob.rotation_euler = (0, 0, SWW)
    m = ob.modifiers.new("fase", "BEVEL")
    m.width = fase
    m.segments = 2
    return fertig(ob, name, material, "kruemel")


sandwich = [
    dreieck("sandwich_unten", 0.0, 0.042, TOAST),
    dreieck("sandwich_schinken", 0.042, 0.012, SCHINKEN, 1.03, 0.003),
    dreieck("sandwich_kaese", 0.054, 0.010, KAESE, 1.01, 0.003),
    dreieck("sandwich_salat", 0.064, 0.010, SALAT, 1.07, 0.003),
    dreieck("sandwich_oben", 0.074, 0.042, TOAST, 0.98),
]
for z in (0.021, 0.095):   # dunkle Rinde an den beiden Aussenkanten jeder Scheibe
    for s_ in (-1, 1):
        x, y = sw_ort(s_ * SWL / 4, SWL / 4)
        sandwich.append(box("sandwich_rinde", (SWL / math.sqrt(2), 0.014, 0.04), (x, y, z), RINDE_B, "kruemel", rot=(0, 0, SWW - s_ * R(45))))
biss = []
BX, BY_ = sw_ort(SWL / 2 - 0.085, 0.02)   # Biss an der rechten Spitze: drei Boegen = Zahnabdruck
for dx, dy in ((-0.055, -0.03), (0.0, 0.0), (0.03, 0.055), (0.07, -0.02), (0.11, 0.0)):   # die letzten zwei nehmen die Spitze ganz weg
    z = cyl("biss", 0.05, 0.4, (BX + dx, BY_ + dy, 0.05), TOAST, verts=20)
    z.hide_render = True
    biss.append(z)
for teil in sandwich:
    for z in biss:
        m = teil.modifiers.new("biss", "BOOLEAN")
        m.operation = "DIFFERENCE"
        m.object = z
for i in range(170):   # Kruemel: viele winzige, wenige grosse, kantig, dicht am Biss und vereinzelt weit weg
    if rnd.random() < 0.72:
        kx, ky = rnd.gauss(BX + 0.03, 0.20), rnd.gauss(BY_ - 0.05, 0.15)
    else:
        kx, ky = rnd.uniform(TXM - 0.85, TXM + 0.85), rnd.uniform(TYM - 0.85, TYM + 0.15)
    if math.hypot(kx - SWX, ky - SWY - 0.08) < 0.20:
        continue
    g = 0.005 + 0.021 * rnd.random() ** 2.6
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=g, location=(kx, ky, g * 0.4), rotation=(rnd.uniform(0, 6.3), rnd.uniform(0, 6.3), rnd.uniform(0, 6.3)))
    k = bpy.context.object
    k.scale = (rnd.uniform(0.7, 1.5), rnd.uniform(0.6, 1.2), rnd.uniform(0.4, 0.9))
    fertig(k, "kruemel", RINDE_B if rnd.random() < 0.22 else (KRUME if rnd.random() < 0.65 else TOAST), "kruemel")

# Stuhl, leicht gedreht; die Uniformjacke von Mr Pike faellt als Stoff ueber die Lehne (tower_jacke.py)
SX, SY, SW = 1.05, -4.25, R(-24)
stuhl = modell("WoodenChair_01", (SX, SY, 0.0), (0.80, 0.62, 0.52))
bpy.context.view_layer.update()
j_anker = tower_jacke.baue_jacke(scene, [o for o in stuhl.children if o.type == "MESH"], SX, SY,
                                 {"blau": BLAU, "rot": ROT, "messing": MESSING}, gruppe="mantel")
stuhl.rotation_euler = (0, 0, SW)      # Stuhl und Jacke drehen sich gemeinsam
j_anker.rotation_euler = (0, 0, SW)

# Fenster in der rechten Wand: Bleirauten, tiefe Steinnische, Fensterbank fuer die Taube
FY, FZ = -1.5, 2.05
box("fenster_nische", (0.08, 1.05, 1.45), (B - 0.04, FY, FZ), FENSTERSTEIN, "fenster")
box("fenster_glas", (0.04, 0.82, 1.22), (B - 0.09, FY, FZ), NACHT, "fenster")
FB, FH, FW = 0.80, 1.20, R(35)   # Glasflaeche und Winkel der Bleirauten
for i in range(-9, 10):         # Bleistege, sauber auf die Glasflaeche zugeschnitten
    for s in (-1, 1):
        c, k = i * 0.16, s * math.tan(FW)   # Gerade: y = c + k * z (Mitte des Fensters = Nullpunkt)
        zs = sorted([-FH / 2, FH / 2, (-FB / 2 - c) / k, (FB / 2 - c) / k])
        z0, z1 = zs[1], zs[2]
        if z1 - z0 < 0.03 or abs(c + k * (z0 + z1) / 2) > FB / 2:
            continue
        lang = (z1 - z0) / math.cos(FW)
        box("fenster_blei", (0.012, 0.014, lang), (B - 0.115, FY + c + k * (z0 + z1) / 2, FZ + (z0 + z1) / 2), EISEN, "fenster", rot=(R(-s * 35), 0, 0))
for dy in (-0.45, 0.45):
    box("fenster_laibung", (0.10, 0.12, 1.44), (B - 0.10, FY + dy, FZ), FENSTERSTEIN, "fenster")
for dz in (-0.66, 0.66):
    box("fenster_laibung", (0.104, 0.78, 0.12), (B - 0.10, FY, FZ + dz), FENSTERSTEIN, "fenster")
box("fensterbank", (0.32, 1.2, 0.07), (B - 0.16, FY, FZ - 0.77), STEIN_B, "fenster")

# Treppe nach unten (Loch im Boden rechts) mit Eichengelaender
N = 6
for i in range(N):
    tiefe = (TY1 - TY0) / N
    box(f"stufe{i}", (TX1 - TX0, tiefe, 0.2), ((TX0 + TX1) / 2, TY0 + tiefe * (i + 0.5), -0.1 - 0.22 * (i + 1)), STEIN_B, "treppe")
box("schacht_boden", (TX1 - TX0, TY1 - TY0, 0.1), ((TX0 + TX1) / 2, (TY0 + TY1) / 2, -1.8), RUSS, "treppe")
box("schacht_l", (0.05, TY1 - TY0, 1.8), (TX0 - 0.025, (TY0 + TY1) / 2, -1.0), STEIN_S, "treppe")
box("schacht_r", (0.05, TY1 - TY0, 1.8), (TX1 + 0.025, (TY0 + TY1) / 2, -1.0), STEIN_S, "treppe")
box("schacht_h", (TX1 - TX0, 0.05, 1.8), ((TX0 + TX1) / 2, TY1 + 0.025, -1.0), STEIN_H, "treppe")
for y in (TY0, (TY0 + TY1) / 2, TY1):
    box("gelaender_pfosten", (0.08, 0.08, 0.95), (TX0 - 0.04, y, 0.475), EICHE_S, "treppe")
    ball("gelaender_knauf", 0.06, (TX0 - 0.04, y, 0.98), EICHE_S, "treppe")
box("gelaender", (0.08, TY1 - TY0 + 0.06, 0.07), (TX0 - 0.04, (TY0 + TY1) / 2, 0.88), EICHE_S, "treppe")
box("gelaender_h", (TX1 - TX0, 0.08, 0.07), ((TX0 + TX1) / 2, TY1, 0.88), EICHE_H, "treppe")
box("gelaender_pfosten", (0.08, 0.08, 0.95), (TX1, TY1, 0.475), EICHE_S, "treppe")

# ---------- Figuren-Probe (nur mit FIGUREN=1; das Bild fuer die App entsteht ohne) ----------
if os.environ.get("FIGUREN"):
    import tower_figuren
    tower_figuren.gary(scene, (1.95, -4.95, 0.0), dreh=R(-38), mass=1.0)
    vogel = tower_figuren.taube(scene, (B - 0.17, FY - 0.25, FZ - 0.735), dreh=R(-75), mass=1.25)
    OHNE_MOND = [o for o in vogel.children]

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

# ---------- Licht: fast alles kommt vom Feuer, von der Laterne und der Kerze ----------


def licht(name, typ, energie, farbe, loc, rot=(0, 0, 0), groesse=None, weich_=0.12):
    d = bpy.data.lights.new(name, typ)
    d.energy = energie
    d.color = farbe
    if groesse:
        d.size = groesse
    if typ == "POINT":
        d.shadow_soft_size = weich_
    ob = bpy.data.objects.new(name, d)
    scene.collection.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = rot
    return ob


licht("feuer", "POINT", 330, (1.0, 0.34, 0.08), (0, -0.62, 0.72), weich_=0.3)
licht("feuer_glut", "POINT", 60, (1.0, 0.14, 0.02), (0, -0.80, 0.18), weich_=0.2)
licht("laterne", "POINT", 110, (1.0, 0.55, 0.20), (LX, LY - 0.22, LZ + 0.30))
licht("ecklaterne", "POINT", 42, (1.0, 0.55, 0.20), (EX + 0.22, EY, EZ + 0.20))
licht("kerze", "POINT", 26, (1.0, 0.62, 0.25), (KEX, KEY - 0.06, TZ + 0.46), weich_=0.05)
licht("wandkerze", "POINT", 48, (1.0, 0.58, 0.22), (WKX, -0.42, WKZ + 0.30), weich_=0.05)
licht("raum", "AREA", 30, (1.0, 0.62, 0.38), (0, -5.0, 3.2), groesse=5.0)
licht("vorn", "AREA", 95, (1.0, 0.60, 0.36), (-0.5, -9.3, 2.4), rot=(R(72), 0, 0), groesse=4.0)
licht("bank", "POINT", 3, (1.0, 0.62, 0.38), (-2.2, BY - 1.6, 0.5))
mond = licht("mond", "AREA", 55, (0.50, 0.66, 1.0), (B - 0.35, FY, FZ), rot=(0, R(-90), 0), groesse=0.9)
if os.environ.get("FIGUREN"):
    try:
        ohne = bpy.data.collections.new("ohne_mond")
        for o in OHNE_MOND:
            ohne.objects.link(o)
        mond.light_linking.receiver_collection = ohne
        for eintrag in ohne.collection_objects:
            eintrag.light_linking.link_state = "EXCLUDE"
    except Exception as e:
        print("Mondlicht liess sich nicht von der Taube trennen:", e, flush=True)

world = bpy.data.worlds.new("dunkel")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.03, 0.015, 0.01, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.3

# ---------- 3D-Fassung fuer den Browser (nur mit GLTF=1; dann wird kein Bild gerechnet) ----------
if os.environ.get("GLTF"):
    import tower_gltf
    tower_gltf.ausgeben(scene, cam, ziel, DINGE)
    sys.exit(0)

os.makedirs(OUT, exist_ok=True)
scene.render.resolution_percentage = 100
scene.render.use_file_extension = True

# ---------- 1. Das Bild ----------
if not NUR_IDS:
    t0 = time.time()
    if os.environ.get("AUSSCHNITT"):   # z. B. AUSSCHNITT=0.32,0.52,0.33,0.47 (links, rechts, unten, oben): nur diesen Teil gross rechnen, zum Pruefen
        x0, x1, y0, y1 = [float(v) for v in os.environ["AUSSCHNITT"].split(",")]
        scene.render.use_border = scene.render.use_crop_to_border = True
        scene.render.border_min_x, scene.render.border_max_x, scene.render.border_min_y, scene.render.border_max_y = x0, x1, y0, y1
        scene.render.resolution_percentage = 250
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = SAMPLES
    scene.cycles.max_bounces = 5
    scene.cycles.use_denoising = True
    scene.render.resolution_x = RESX
    scene.render.resolution_y = RESY
    scene.render.image_settings.file_format = "JPEG"
    scene.render.image_settings.quality = 86
    try:
        scene.view_settings.view_transform = "AgX"
        scene.view_settings.look = "AgX - Medium High Contrast"
    except Exception as e:
        print("Farbabstimmung AgX nicht gesetzt:", e, flush=True)
    scene.render.filepath = os.path.join(OUT, "guardroom.jpg")
    bpy.ops.render.render(write_still=True)
    print(f"BILD fertig in {time.time() - t0:.1f} s", flush=True)
    if os.environ.get("AUSSCHNITT"):
        sys.exit(0)

# ---------- 2. Tipp-Flaechen: jeder Gegenstand in seiner Farbe, alles andere schwarz ----------


def linear(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


for ob in scene.objects:
    if ob.type not in ("MESH", "FONT"):
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
img = bpy.data.images.load(ids_pfad, check_existing=False)
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
    print("FEHLER: " + "; ".join(fehler), flush=True)
    sys.exit(1)
print(f"ALLES OK – {len(dinge)} Gegenstaende, Dateien in {OUT}", flush=True)
