"""Keys of the Tower – der Hof (Tower Green) bei Nacht, nach dem Rezept des Guard Rooms. PROBE: nur die Suedseite, nur Bilder.

Vorher einmal:  python werkzeuge/blender/modelle_holen.py   (freie Modelle und Texturen von Poly Haven, CC0)
Aufruf (Windows, im Repo-Ordner):
  "C:\\Program Files\\Blender Foundation\\Blender 5.3\\blender.exe" -b -P werkzeuge/blender/hof.py
Umgebungsvariablen: OUT (Zielordner, sonst frames/), RESX, RESY, SAMPLES, ANSICHT (z. B. "1" oder "1,3"; sonst alle)
Masse und Lagen wie app/tower/hof_bau.js (50 x 40 m). Blender: x = Osten, y = Norden (also y = -z der Seite), z = oben.
Die Suedseite liegt bei y = -20: Queen's House (Fachwerk) mit der Tuer zur Wachstube und Garys Fass,
links der Bell Tower mit der Uhr, rechts der Bloody Tower mit dem grossen Tor.
Thema (Mr. Alex 21.11.2026): die alte Stimmung des Guard Rooms bewahren – gemalter Realismus, mittelalterlich,
kein Fotorealismus, kein Bilderbuch. Nacht: kuehles Mondlicht, warme Laternen und Fenster.
"""
import math
import os
import sys
import time

import bpy
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
MODELLE = os.path.join(HERE, "modelle")
OUT = os.environ.get("OUT", os.path.join(HERE, "frames"))
RESX = int(os.environ.get("RESX", 1600))
RESY = int(os.environ.get("RESY", 900))
SAMPLES = int(os.environ.get("SAMPLES", 96))
R = math.radians

if not os.path.isdir(os.path.join(MODELLE, "castle_wall_slates")):
    print("FEHLER: Texturen fehlen – zuerst  python werkzeuge/blender/modelle_holen.py", flush=True)
    sys.exit(1)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# Masse wie hof_bau.js
B, T = 50.0, 40.0
W, S = B / 2, T / 2
FRONT = -S                    # Hauswand, Erdgeschoss
OBEN = FRONT + 0.45           # das Obergeschoss kragt vor
TUER_X = -B / 4
HAUS_X0, HAUS_X1 = -W, W - 10.0
GESCHOSS, TRAUFE = 3.1, 5.6

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


def textur(name, ordner, mass=0.5, ton=(1, 1, 1), relief=0.35):
    """Poly-Haven-Textur, von allen Seiten ueber Welt-Koordinaten aufgelegt (Kasten-Projektion), eingefaerbt mit ton."""
    m = mat(name, (0.5, 0.5, 0.5))
    nt = m.node_tree
    b = nt.nodes.get("Principled BSDF")
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (mass, mass, mass)
    nt.links.new(geo.outputs["Position"], mp.inputs["Vector"])

    def bild(datei, farbraum):
        n = nt.nodes.new("ShaderNodeTexImage")
        n.image = bpy.data.images.load(os.path.join(MODELLE, ordner, datei), check_existing=True)
        n.image.colorspace_settings.name = farbraum
        n.projection = "BOX"
        n.projection_blend = 0.2
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


def rautenglas(name, farbe, staerke, kerze=True):
    """Fenster mit Bleirauten wie im Guard Room; farbe leuchtet (warm = Licht im Haus, dunkelblau = kein Licht)."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(geo.outputs["Position"], sep.inputs[0])

    def rechne(op, a, b=None):
        n = nt.nodes.new("ShaderNodeMath")
        n.operation = op
        for i, v in enumerate((a, b)):
            if v is None:
                continue
            if isinstance(v, (int, float)):
                n.inputs[i].default_value = v
            else:
                nt.links.new(v, n.inputs[i])
        return n.outputs[0]

    def steg(summe):
        return rechne("GREATER_THAN", rechne("ABSOLUTE", rechne("SUBTRACT", rechne("FRACT", rechne("MULTIPLY", summe, 4.5)), 0.5)), 0.41)

    blei = rechne("MAXIMUM", steg(rechne("ADD", sep.outputs["X"], sep.outputs["Z"])), steg(rechne("SUBTRACT", sep.outputs["X"], sep.outputs["Z"])))
    # das Licht ist nicht gleichmaessig: unten heller (Kerze auf dem Tisch), kleine Flecken
    rausch = nt.nodes.new("ShaderNodeTexNoise")
    rausch.inputs["Scale"].default_value = 1.6
    glas = nt.nodes.new("ShaderNodeEmission")
    glas.inputs["Color"].default_value = (*farbe, 1)
    flackern = rechne("ADD", rausch.outputs[0], 0.25)
    if kerze:   # Schein einer Kerze: unten, etwas neben der Mitte am hellsten und gelber, zum Rand hin dunkler und roeter (Mr. Alex 21.11.)
        tc = nt.nodes.new("ShaderNodeTexCoord")
        eig = nt.nodes.new("ShaderNodeSeparateXYZ")
        nt.links.new(tc.outputs["Object"], eig.inputs[0])
        weg = rechne("SQRT", rechne("ADD", rechne("POWER", rechne("SUBTRACT", eig.outputs["X"], 0.12), 2.0), rechne("POWER", rechne("ADD", eig.outputs["Z"], 0.36), 2.0)))
        schein = rechne("POWER", rechne("MAXIMUM", rechne("SUBTRACT", 1.0, rechne("MULTIPLY", weg, 1.2)), 0.0), 1.7)
        ton = nt.nodes.new("ShaderNodeValToRGB")
        ton.color_ramp.elements[0].color = (farbe[0] * 0.85, farbe[1] * 0.55, farbe[2] * 0.4, 1)
        ton.color_ramp.elements[1].color = (1.0, 0.68, 0.30, 1)
        nt.links.new(schein, ton.inputs[0])
        nt.links.new(ton.outputs["Color"], glas.inputs["Color"])
        nt.links.new(rechne("MULTIPLY", rechne("MULTIPLY", rechne("ADD", rechne("MULTIPLY", schein, 1.5), 0.14), flackern), staerke), glas.inputs["Strength"])
    else:
        nt.links.new(rechne("MULTIPLY", flackern, staerke), glas.inputs["Strength"])
    dunkel = nt.nodes.new("ShaderNodeBsdfDiffuse")
    dunkel.inputs["Color"].default_value = (0.02, 0.02, 0.02, 1)
    misch = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(blei, misch.inputs[0])
    nt.links.new(glas.outputs[0], misch.inputs[1])
    nt.links.new(dunkel.outputs[0], misch.inputs[2])
    aus = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(misch.outputs[0], aus.inputs["Surface"])
    return m


STEIN = textur("bruchstein", "castle_wall_slates", 0.30, (0.82, 0.76, 0.68))          # Mauern und Tuerme
QUADER = textur("quader", "medieval_blocks_02", 0.55, (0.24, 0.22, 0.20), relief=0.5)   # wie der Kamin im Guard Room
PFLASTER = textur("pflaster", "cobblestone_floor_08", 0.42, (0.80, 0.72, 0.62), relief=0.6)
RASEN = textur("rasen", "leafy_grass", 0.45, (0.85, 1.05, 0.55), relief=0.2)


def maehstreifen(m, breit=2.2):
    """Helle und dunkle Bahnen von Nord nach Sued, wie auf dem echten Tower Green."""
    nt = m.node_tree
    b = nt.nodes.get("Principled BSDF")
    alt = b.inputs["Base Color"].links[0].from_socket
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(geo.outputs["Position"], sep.inputs[0])

    def rechne(op, a, wert):
        n = nt.nodes.new("ShaderNodeMath")
        n.operation = op
        nt.links.new(a, n.inputs[0])
        n.inputs[1].default_value = wert
        return n.outputs[0]

    bahn = rechne("GREATER_THAN", rechne("FRACT", rechne("MULTIPLY", sep.outputs["X"], 0.5 / breit), 0), 0.5)
    ton = nt.nodes.new("ShaderNodeValToRGB")
    ton.color_ramp.elements[0].color = (0.55, 0.60, 0.55, 1)
    ton.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1)
    nt.links.new(bahn, ton.inputs[0])
    mal = nt.nodes.new("ShaderNodeMix")
    mal.data_type, mal.blend_type = "RGBA", "MULTIPLY"
    mal.inputs[0].default_value = 1.0
    nt.links.new(alt, mal.inputs[6])
    nt.links.new(ton.outputs["Color"], mal.inputs[7])
    nt.links.new(mal.outputs[2], b.inputs["Base Color"])


maehstreifen(RASEN)
RINDE = textur("rinde", "dark_wood", 0.5, (0.42, 0.40, 0.34), relief=0.8)
LAUB = mat("laub", (0.035, 0.07, 0.025), 0.75)
GITTER = mat("gitter", (0.012, 0.012, 0.014), 0.45, 0.8)
PUTZ = textur("putz", "plastered_stone_wall", 0.45, (2.2, 1.95, 1.6))                 # gekalkt wie die Waende im Guard Room
EICHE = textur("eiche", "dark_wood", 0.9, (0.30, 0.21, 0.15))                          # Fachwerk, fast schwarz
EICHE_TOR = textur("eiche_tor", "dark_wood", 0.6, (0.55, 0.38, 0.26))
DACH = textur("dach", "clay_roof_tiles_02", 0.55, (0.70, 0.50, 0.42), relief=0.6)
ZIEGEL = textur("ziegel", "medieval_blocks_02", 1.2, (1.0, 0.55, 0.42))
EISEN = mat("eisen", (0.05, 0.05, 0.055), 0.5, 0.9)
BLEI = mat("blei", (0.16, 0.17, 0.19), 0.6, 0.6)
HOLZ_WEISS = mat("holz_weiss", (0.62, 0.58, 0.50), 0.8)
ZIFFER = mat("zifferblatt", (0.90, 0.84, 0.66), 0.6, emit=0.22)
ZEIGER = mat("zeiger", (0.02, 0.02, 0.02), 0.5)
GOLD = mat("gold", (0.80, 0.56, 0.20), 0.4, 1.0, emit=0.04)
def altes_blatt():
    """Verwittertes Zifferblatt: Stein bis Elfenbein, fleckig, mit feinen Rissen – nicht weiss, nicht glatt."""
    m = mat("uhr_blatt_alt", (0.4, 0.36, 0.28), 0.9)
    nt = m.node_tree
    b = nt.nodes.get("Principled BSDF")
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    fleck = nt.nodes.new("ShaderNodeTexNoise")
    fleck.inputs["Scale"].default_value = 2.2
    fleck.inputs["Detail"].default_value = 6.0
    riss = nt.nodes.new("ShaderNodeTexVoronoi")
    riss.feature = "DISTANCE_TO_EDGE"
    riss.inputs["Scale"].default_value = 3.5
    for n in (fleck, riss):
        nt.links.new(geo.outputs["Position"], n.inputs["Vector"])
    ton = nt.nodes.new("ShaderNodeValToRGB")
    ton.color_ramp.elements[0].position, ton.color_ramp.elements[0].color = 0.32, (0.17, 0.14, 0.10, 1)
    ton.color_ramp.elements[1].position, ton.color_ramp.elements[1].color = 0.68, (0.50, 0.45, 0.33, 1)
    nt.links.new(fleck.outputs[0], ton.inputs[0])
    kante = nt.nodes.new("ShaderNodeMath")
    kante.operation = "LESS_THAN"
    kante.inputs[1].default_value = 0.012
    nt.links.new(riss.outputs["Distance"], kante.inputs[0])
    misch = nt.nodes.new("ShaderNodeMix")
    misch.data_type = "RGBA"
    nt.links.new(kante.outputs[0], misch.inputs[0])
    nt.links.new(ton.outputs["Color"], misch.inputs[6])
    misch.inputs[7].default_value = (0.10, 0.08, 0.06, 1)
    nt.links.new(misch.outputs[2], b.inputs["Base Color"])
    return m


BLATT = altes_blatt()
GLAS_DUNKEL = mat("glas_dunkel", (0.01, 0.014, 0.03), 0.25)
ZIFFER_ALT = mat("ziffer_alt", (0.035, 0.03, 0.028), 0.8)
STEIN_HELL = textur("bruchstein_hell", "castle_wall_slates", 0.30, (2.7, 2.55, 2.3))   # White Tower: heller als die Mauern
UHR_SCHWARZ = mat("uhr_schwarz", (0.012, 0.012, 0.016), 0.45)
KALKSTEIN = mat("kalkstein", (0.40, 0.37, 0.31), 0.92)   # glatter, heller Werkstein fuer Uhrtafel und Laterne (ohne Textur: schraege Flaechen verziehen sie)
MESSING = mat("messing", (0.90, 0.62, 0.20), 0.3, 1.0)
FLAMME = mat("flamme", (1.0, 0.55, 0.14), emit=14.0)
LICHT_AN = rautenglas("fenster_an", (1.0, 0.42, 0.10), 1.5)
LICHT_SCHWACH = rautenglas("fenster_schwach", (1.0, 0.40, 0.10), 0.5)
LICHT_AUS = rautenglas("fenster_aus", (0.10, 0.16, 0.34), 0.10, kerze=False)

# ---------- Formen ----------


def fertig(ob, name, material):
    ob.name = name
    ob.data.materials.append(material)
    return ob


def box(name, size, loc, material, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    ob = bpy.context.object
    ob.scale = size
    return fertig(ob, name, material)


def cyl(name, r, depth, loc, material, rot=(0, 0, 0), verts=32):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, rotation=rot, vertices=verts)
    return fertig(bpy.context.object, name, material)


def cone(name, r, depth, loc, material, verts=4, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=0, depth=depth, location=loc, vertices=verts, rotation=rot)
    return fertig(bpy.context.object, name, material)


def netz(name, punkte, flaechen, material):
    me = bpy.data.meshes.new(name)
    me.from_pydata(punkte, [], flaechen)
    me.update()
    ob = bpy.data.objects.new(name, me)
    scene.collection.objects.link(ob)
    me.materials.append(material)
    return ob


def balken(name, p0, p1, dick, material=None, y=None):
    """Balken in der Wandebene (x, z) von p0 nach p1."""
    (x0, z0), (x1, z1) = p0, p1
    lang = math.hypot(x1 - x0, z1 - z0)
    return box(name, (lang, 0.09, dick), ((x0 + x1) / 2, y, (z0 + z1) / 2), material or EICHE, rot=(0, -math.atan2(z1 - z0, x1 - x0), 0))


def modell(name, ort, hoehe=None, breite=None, dreh=0.0, weit=1.0):
    """Poly-Haven-Modell laden, auf hoehe (und breite) bringen und mit der Unterkante seiner Mitte auf ort stellen."""
    vorher = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(MODELLE, name, name + ".gltf"))
    bpy.context.view_layer.update()
    neu = [o for o in bpy.data.objects if o not in vorher]
    netze = [o for o in neu if o.type == "MESH"]
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
    kz = hoehe / (hi[2] - lo[2]) if hoehe else 1.0
    kx = breite / (hi[0] - lo[0]) if breite else kz
    anker.location = ort
    anker.scale = (kx * weit, (kx if breite else kz) * weit, kz)      # weit > 1: breiter und dicker bei gleicher Hoehe
    anker["netze"] = [o.name for o in netze]
    anker.rotation_euler = (0, 0, dreh)
    print(f"MODELL {name}: {hi[0] - lo[0]:.2f} x {hi[1] - lo[1]:.2f} x {hi[2] - lo[2]:.2f} m", flush=True)
    return anker


def licht(name, typ, energie, farbe, loc, rot=(0, 0, 0), groesse=None, weich_=0.12):
    d = bpy.data.lights.new(name, typ)
    d.energy = energie
    d.color = farbe
    if groesse:
        d.size = groesse
    if typ == "POINT":
        d.shadow_soft_size = weich_
    if typ == "SUN":
        d.angle = R(3)
    ob = bpy.data.objects.new(name, d)
    scene.collection.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = rot
    return ob


WARM = (1.0, 0.55, 0.20)


def laterne(name, x, y, z, energie=260, wand=None):
    """Laterne an einem eisernen Arm (wie die Laternen im Guard Room), haengt bei (x, y, z) vor der Wand."""
    wand = FRONT if wand is None else wand
    box(name + "_arm", (0.05, abs(y - wand) + 0.1, 0.05), (x, (y + wand) / 2, z + 0.62), EISEN)
    box(name + "_kette", (0.02, 0.02, 0.14), (x, y, z + 0.55), EISEN)
    modell("Lantern_01", (x, y, z), hoehe=0.5)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.035, location=(x, y, z + 0.2))
    fertig(bpy.context.object, name + "_flamme", FLAMME)
    licht(name, "POINT", energie, WARM, (x, y + (0.25 if y > wand else -0.25), z + 0.2), weich_=0.08)


def fenster(name, x, z, breit, hoch, y, glas):
    box(name + "_rahmen", (breit + 0.2, 0.12, hoch + 0.2), (x, y + 0.02, z), EICHE)
    box(name + "_glas", (breit, 0.04, hoch), (x, y + 0.07, z), glas)
    n = max(1, round(breit / 0.6))
    for i in range(1, n):
        box(f"{name}_sprosse{i}", (0.07, 0.06, hoch), (x - breit / 2 + i * breit / n, y + 0.08, z), EICHE)
    box(name + "_bank", (breit + 0.3, 0.2, 0.08), (x, y + 0.08, z - hoch / 2 - 0.12), EICHE)
    if glas is LICHT_AN:
        licht(name + "_schein", "POINT", 45, WARM, (x, y + 0.7, z), weich_=0.4)


def zinnen_gerade(name, x0, x1, y, z, material, tief=0.6, entlang_y=False):
    n = int((x1 - x0) / 1.7)
    schritt = (x1 - x0) / n
    for i in range(n):
        m = x0 + (i + 0.5) * schritt
        ort = (y, m, z + 0.45) if entlang_y else (m, y, z + 0.45)
        gr = (tief, 0.95, 0.9) if entlang_y else (0.95, tief, 0.9)
        box(f"{name}{i}", gr, ort, material)


# ---------- Boden: Pflaster vor dem Haus, dahinter der Rasen (Tower Green) ----------
PFL = 9.0                                    # Tiefe des Pflasters vor der Hauswand
box("pflaster", (B + 4, PFL + 2, 0.2), (0, FRONT + PFL / 2 - 1, -0.1), PFLASTER)
box("rasen", (B + 4, T - PFL + 30, 0.2), (0, FRONT + PFL + (T - PFL + 30) / 2, -0.07), RASEN)
box("kante", (B + 4, 0.28, 0.14), (0, FRONT + PFL, 0.0), QUADER)
box("grund", (300, 300, 0.1), (0, 0, -0.3), mat("grund", (0.02, 0.025, 0.03), 1.0))

# ---------- Queen's House: Steinsockel, Fachwerk, Obergeschoss kragt vor, Ziegeldach mit vier Giebeln ----------
hm, hb = (HAUS_X0 + HAUS_X1) / 2, HAUS_X1 - HAUS_X0
box("haus_unten", (hb, 6, GESCHOSS), (hm, FRONT - 3, GESCHOSS / 2), PUTZ)
box("haus_oben", (hb, 6.45, TRAUFE - GESCHOSS), (hm, OBEN - 3.225, (TRAUFE + GESCHOSS) / 2), PUTZ)
box("sockel", (hb, 0.2, 0.75), (hm, FRONT + 0.06, 0.375), QUADER)
yu, yo = FRONT + 0.03, OBEN + 0.03           # Balkenebenen unten und oben
balken("schwelle", (HAUS_X0, 0.86), (HAUS_X1, 0.86), 0.22, y=yu)
box("kragbalken", (hb, 0.55, 0.30), (hm, FRONT + 0.22, GESCHOSS), EICHE)
balken("rahm", (HAUS_X0, TRAUFE - 0.12), (HAUS_X1, TRAUFE - 0.12), 0.24, y=yo)
balken("riegel_unten", (HAUS_X0, 2.0), (HAUS_X1, 2.0), 0.14, y=yu)
balken("riegel_oben", (HAUS_X0, 4.35), (HAUS_X1, 4.35), 0.14, y=yo)
n_st = int(hb / 1.25)
for i in range(n_st + 1):
    x = HAUS_X0 + 0.1 + i * (hb - 0.2) / n_st
    if abs(x - TUER_X) > 1.3:
        balken(f"staender_u{i}", (x, 0.86), (x, GESCHOSS), 0.17, y=yu)
    balken(f"staender_o{i}", (x, GESCHOSS), (x, TRAUFE), 0.17, y=yo)
    if i % 2 == 0:                            # Knaggen unter dem vorkragenden Geschoss
        box(f"knagge{i}", (0.16, 0.45, 0.16), (x, FRONT + 0.2, GESCHOSS - 0.3), EICHE, rot=(R(40), 0, 0))
    if i % 4 == 1 and i < n_st:               # Streben
        x2 = x + (hb - 0.2) / n_st
        balken(f"strebe_o{i}", (x, GESCHOSS + 0.15), (x2, 4.35), 0.13, y=yo)
        balken(f"strebe_p{i}", (x2 + (hb - 0.2) / n_st, GESCHOSS + 0.15), (x2, 4.35), 0.13, y=yo)

# Dach: Satteldach laengs, First bei z = 8.4
FIRST_Y, FIRST_Z = FRONT - 3.0, 8.4
ya, yb = OBEN + 0.35, FRONT - 6.3
netz("dach", [(HAUS_X0 - 0.3, ya, TRAUFE - 0.1), (HAUS_X1 + 0.3, ya, TRAUFE - 0.1), (HAUS_X1 + 0.3, FIRST_Y, FIRST_Z), (HAUS_X0 - 0.3, FIRST_Y, FIRST_Z),
              (HAUS_X0 - 0.3, yb, TRAUFE - 0.1), (HAUS_X1 + 0.3, yb, TRAUFE - 0.1)], [(0, 1, 2, 3), (3, 2, 5, 4)], DACH)
netz("giebelwand_w", [(HAUS_X0, ya, TRAUFE), (HAUS_X0, yb, TRAUFE), (HAUS_X0, FIRST_Y, FIRST_Z)], [(0, 1, 2)], PUTZ)
netz("giebelwand_o", [(HAUS_X1, ya, TRAUFE), (HAUS_X1, yb, TRAUFE), (HAUS_X1, FIRST_Y, FIRST_Z)], [(0, 1, 2)], PUTZ)
GIEBEL = [-20.0, -10.0, 0.0, 10.0]
GB, GH = 5.2, 2.5                              # Breite und Hoehe eines Giebels
for k, gx in enumerate(GIEBEL):
    a, b, c = (gx - GB / 2, OBEN, TRAUFE), (gx + GB / 2, OBEN, TRAUFE), (gx, OBEN, TRAUFE + GH)
    netz(f"giebel{k}", [a, b, c], [(0, 1, 2)], PUTZ)
    vor, hy = OBEN + 0.35, FIRST_Y - 0.3
    ue = 0.35                                 # Ueberstand seitlich
    al, br_, sp = (gx - GB / 2 - ue, TRAUFE - ue * GH / (GB / 2)), (gx + GB / 2 + ue, TRAUFE - ue * GH / (GB / 2)), (gx, TRAUFE + GH + 0.04)
    netz(f"giebeldach{k}", [(al[0], vor, al[1]), (sp[0], vor, sp[1]), (sp[0], hy, sp[1]), (al[0], hy, al[1]), (br_[0], vor, br_[1]), (br_[0], hy, br_[1])],
         [(0, 1, 2, 3), (1, 4, 5, 2)], DACH)
    balken(f"ortgang_l{k}", (al[0], al[1]), (sp[0], sp[1]), 0.22, y=OBEN + 0.3)
    balken(f"ortgang_r{k}", (br_[0], br_[1]), (sp[0], sp[1]), 0.22, y=OBEN + 0.3)
    balken(f"giebel_riegel{k}", (gx - GB / 2 + 1.1, TRAUFE + 1.25), (gx + GB / 2 - 1.1, TRAUFE + 1.25), 0.13, y=yo)
    balken(f"giebel_pfosten{k}", (gx, TRAUFE + 1.25), (gx, TRAUFE + GH - 0.1), 0.13, y=yo)
    for sx in (-1, 1):
        balken(f"giebel_st{k}{sx}", (gx + sx * 0.75, TRAUFE), (gx + sx * 0.75, TRAUFE + 1.25), 0.13, y=yo)
    fenster(f"giebelfenster{k}", gx, TRAUFE + 0.62, 0.9, 0.75, OBEN, LICHT_AUS if k != 1 else LICHT_SCHWACH)
for k, sx in enumerate((-15.0, -5.0, 5.0)):   # Schornsteine aus Ziegeln
    box(f"schornstein{k}", (1.1, 0.9, 2.4), (sx, FIRST_Y - 0.4, FIRST_Z + 0.5), ZIEGEL)
    box(f"schornstein_kopf{k}", (1.3, 1.1, 0.2), (sx, FIRST_Y - 0.4, FIRST_Z + 1.7), ZIEGEL)

# Fenster: oben unter jedem Giebel ein breites, unten kleinere; nur wenige sind erleuchtet
OBEN_AN = {1: LICHT_AN, 2: LICHT_SCHWACH}
for k, gx in enumerate(GIEBEL):
    fenster(f"fenster_o{k}", gx, 4.45, 2.4, 1.15, OBEN, OBEN_AN.get(k, LICHT_AUS))
UNTEN = [(-22.0, LICHT_AUS), (-17.5, LICHT_SCHWACH), (-8.0, LICHT_AN), (-3.0, LICHT_AUS), (3.0, LICHT_AUS), (8.0, LICHT_SCHWACH), (12.5, LICHT_AUS)]
for k, (fx, glas) in enumerate(UNTEN):
    fenster(f"fenster_u{k}", fx, 1.95, 1.25, 1.2, FRONT, glas)

# Tuer zur Wachstube: Burgtuer wie im Guard Room, 1,5 m breit und 3 m hoch (abgenommen 19.11.), Gewaende aus Quadern, Stufe
modell("large_castle_door", (TUER_X, FRONT + 0.12, 0.0), hoehe=3.0, breite=1.5, dreh=R(180))
for sx in (-1, 1):
    box(f"gewaende{sx}", (0.42, 0.34, 3.25), (TUER_X + sx * 0.96, FRONT + 0.1, 1.625), QUADER)
box("sturz", (2.6, 0.38, 0.5), (TUER_X, FRONT + 0.1, 3.3), QUADER)
box("stufe", (2.6, 1.1, 0.14), (TUER_X, FRONT + 0.6, 0.05), QUADER)
laterne("laterne_tuer", TUER_X + 1.55, FRONT + 0.75, 2.35, energie=190)
laterne("laterne_west", -21.0, FRONT + 0.85, 2.5, energie=170)
laterne("laterne_ost", 5.5, FRONT + 0.85, 2.5, energie=170)

# Garys Fass (Lage wie hof_bau.js: 2,2 m rechts der Tuer, 1 m vor der Wand)
modell("wine_barrel_01", (TUER_X + 2.2, FRONT + 1.0, 0.0), hoehe=1.0)

# ---------- Bell Tower mit der Uhr (Suedwestecke): Bruchstein, Zinnen, kleines weisses Glockentuermchen ----------
UTX, UTY, UR, UH = -W - 1.5, -S - 1.5, 3.5, 12.0
cyl("uhrturm", UR, UH, (UTX, UTY, UH / 2), STEIN, verts=48)
cyl("uhrturm_fuss", UR + 0.25, 1.0, (UTX, UTY, 0.5), QUADER, verts=48)
cyl("uhrturm_gesims", UR + 0.18, 0.28, (UTX, UTY, UH - 0.5), QUADER, verts=48)
for i in range(14):
    w_ = i * 2 * math.pi / 14
    box(f"uhrturm_zinne{i}", (0.95, 0.6, 0.9), (UTX + (UR - 0.25) * math.cos(w_), UTY + (UR - 0.25) * math.sin(w_), UH + 0.45), STEIN, rot=(0, 0, w_ + R(90)))
# (das Uhrtuermchen obenauf steht weiter unten bei der Uhr)
q = math.sqrt(0.5)
for k, (wi, hz, glas) in enumerate([(R(20), 4.2, LICHT_SCHWACH), (R(75), 7.4, LICHT_AUS)]):   # schmale Fenster zum Hof
    box(f"turmfenster{k}", (0.45, 0.2, 1.3), (UTX + (UR + 0.02) * math.cos(wi), UTY + (UR + 0.02) * math.sin(wi), hz), glas, rot=(0, 0, wi + R(90)))
# die Uhr schaut schraeg in den Hof (Nordosten), Mitte in 10 m Hoehe, 2 m gross
N_ = Vector((q, q, 0))
NT = 3.15                                    # Abstand der Nischen-Rueckwand von der Turmachse
UM = Vector((UTX, UTY, 10.1)) + N_ * NT       # Mitte des Zifferblatts: an der abgenommenen Stelle, in die Mauer eingelassen
RECHTS = Vector((-q, q, 0))                    # vom Betrachter aus rechts
HOCH = Vector((0, 0, 1))


def an_der_uhr(name, winkel, innen, aussen, dick, material, vor):
    """Strich auf dem Zifferblatt: winkel im Uhrzeigersinn ab der Zwoelf, von innen bis aussen (Meter ab Mitte)."""
    ri = HOCH * math.cos(winkel) + RECHTS * math.sin(winkel)
    quer = ri.cross(N_)
    ob = box(name, (1, 1, 1), (0, 0, 0), material)
    rot = Matrix((ri, N_, quer)).transposed().to_4x4()
    ob.matrix_world = Matrix.Translation(UM + N_ * vor + ri * (innen + aussen) / 2) @ rot @ Matrix.Diagonal((aussen - innen, 0.04, dick, 1))
    return ob


BASIS = Matrix((RECHTS, HOCH, N_)).transposed().to_4x4()      # x = rechts, y = oben, z = zum Betrachter


def platte(name, rechts, hoch, vor, breit, hoehe, tief, material):
    ob = box(name, (1, 1, 1), (0, 0, 0), material)
    ob.matrix_world = Matrix.Translation(UM + RECHTS * rechts + HOCH * hoch + N_ * vor) @ BASIS @ Matrix.Diagonal((breit, hoehe, tief, 1))
    return ob


# Die Uhr ist in die Turmwand eingelassen (Mr. Alex 21.11.: nichts Aufgesetztes): flache Nische mit Rundbogen, aus dem Turm geschnitten
turm = bpy.data.objects["uhrturm"]
NB, NR = 2.5, 1.25                              # Breite der Nische, Radius des Bogens
schneider = [platte("nische_kasten", 0, -0.675, 1.0, NB, 1.35, 2.0, STEIN),
             cyl("nische_bogen", NR, 2.0, UM + N_ * 1.0, STEIN, rot=(R(90), 0, R(-45)), verts=48)]
for k, sch in enumerate(schneider):
    mo = turm.modifiers.new(f"nische{k}", "BOOLEAN")
    mo.operation, mo.object = "DIFFERENCE", sch
    bpy.context.view_layer.objects.active = turm
    bpy.ops.object.modifier_apply(modifier=mo.name)
    bpy.data.objects.remove(sch, do_unlink=True)
bpy.ops.mesh.primitive_torus_add(major_radius=1.06, minor_radius=0.07, location=UM + N_ * 0.03, rotation=(R(90), 0, R(-45)), major_segments=64)
fertig(bpy.context.object, "uhr_ring", KALKSTEIN)
cyl("uhr_blatt", 1.02, 0.06, UM + N_ * 0.02, BLATT, rot=(R(90), 0, R(-45)), verts=64)
ZIFFERN = ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"]
for i, zf in enumerate(ZIFFERN):
    a_ = i * math.pi / 6
    cu = bpy.data.curves.new("ziffer", "FONT")
    cu.body, cu.align_x, cu.align_y, cu.size, cu.extrude = zf, "CENTER", "CENTER", 0.25, 0.004
    cu.materials.append(ZIFFER_ALT)
    ob = bpy.data.objects.new(f"uhr_ziffer{i}", cu)
    scene.collection.objects.link(ob)
    ob.matrix_world = Matrix.Translation(UM + N_ * 0.056 + (HOCH * math.cos(a_) + RECHTS * math.sin(a_)) * 0.76) @ BASIS @ Matrix.Rotation(-a_, 4, "Z") @ Matrix.Diagonal((0.78, 1.0, 1.0, 1))
for i in range(60):
    an_der_uhr(f"uhr_strich{i}", i * math.pi / 30, 0.93 if i % 5 else 0.91, 0.97, 0.01 if i % 5 else 0.028, ZIFFER_ALT, 0.056)
an_der_uhr("uhr_minute", R(90), -0.14, 0.86, 0.045, EISEN, 0.10)        # Viertel nach neun (im Spiel laeuft die Uhr von selbst)
an_der_uhr("uhr_stunde", R(277.5), -0.10, 0.40, 0.06, EISEN, 0.085)
an_der_uhr("uhr_stunde_spaten", R(277.5), 0.36, 0.50, 0.15, EISEN, 0.085)   # Spatenspitze
an_der_uhr("uhr_stunde_spitze", R(277.5), 0.50, 0.58, 0.05, EISEN, 0.085)
cyl("uhr_nabe", 0.06, 0.06, UM + N_ * 0.11, EISEN, rot=(R(90), 0, R(-45)), verts=24)
# kleine Laterne am Eisenarm neben der Nische: die Uhr ist nachts lesbar, ohne selbst zu leuchten
LO = UM - RECHTS * 1.75 + HOCH * 0.55 + N_ * 0.85
platte("uhr_arm", -1.75, 1.2, 0.35, 0.05, 0.05, 1.1, EISEN)
platte("uhr_kette", -1.75, 1.1, 0.85, 0.02, 0.2, 0.02, EISEN)
modell("Lantern_01", LO, hoehe=0.5)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.035, location=LO + HOCH * 0.2)
fertig(bpy.context.object, "uhr_laterne_flamme", FLAMME)
licht("uhr_laterne", "POINT", 75, WARM, LO + HOCH * 0.2 + N_ * 0.2, weich_=0.08)

# ---------- Osten: die Mauer der Raben, dahinter der White Tower (Wahrzeichen: heller Stein, vier Ecktuermchen mit Bleihauben) ----------
box("rabenmauer", (1.2, T, 3.0), (W + 0.6, 0, 1.5), STEIN)
box("rabenmauer_krone", (1.4, T, 0.14), (W + 0.6, 0, 3.05), KALKSTEIN)
WX0, WX1, WY0, WY1, WH = W + 3.0, W + 29.0, -10.0, 14.0, 19.0   # groesser und naeher an der Mauer (Mr. Alex 21.11.; Rohbau: 18 x 16 x 14 m, 8 m dahinter)
box("whitetower", (WX1 - WX0, WY1 - WY0, WH), ((WX0 + WX1) / 2, (WY0 + WY1) / 2, WH / 2), STEIN_HELL)
box("whitetower_sockel", (WX1 - WX0 + 0.5, WY1 - WY0 + 0.5, 1.4), ((WX0 + WX1) / 2, (WY0 + WY1) / 2, 0.7), STEIN_HELL)
zinnen_gerade("wt_zinne_w", WY0 + 3, WY1 - 3, WX0 + 0.3, WH, STEIN_HELL, entlang_y=True)
zinnen_gerade("wt_zinne_s", WX0 + 3, WX1 - 3, WY0 + 0.3, WH, STEIN_HELL)


def bogenfenster(name, ort, nach_x, glas):
    """Rundbogenfenster mit heller Steinfassung; nach_x = die Wand schaut nach Westen (sonst nach Sueden)."""
    x, y, z = ort
    gr, gr2, dreh = ((0.12, 0.9, 1.5), (0.1, 1.2, 1.8), (0, R(90), 0)) if nach_x else ((0.9, 0.12, 1.5), (1.2, 0.1, 1.8), (R(90), 0, 0))
    box(name + "_fassung", gr2, (x, y, z), KALKSTEIN)
    cyl(name + "_fassung_bogen", 0.6, 0.1, (x, y, z + 0.9), KALKSTEIN, rot=dreh)
    box(name, gr, (x, y, z), glas)
    cyl(name + "_bogen", 0.45, 0.12, (x, y, z + 0.75), glas, rot=dreh)


FY = [WY0 + 4.5 + i * (WY1 - WY0 - 9.0) / 4 for i in range(5)]
FX = [WX0 + 4.5 + i * (WX1 - WX0 - 9.0) / 4 for i in range(5)]
for reihe, hz in enumerate((0.42 * WH, 0.73 * WH)):
    for k, fy in enumerate(FY):
        bogenfenster(f"wt_fenster_w{reihe}{k}", (WX0 - 0.02, fy, hz), True, LICHT_SCHWACH if (reihe, k) == (0, 2) else GLAS_DUNKEL)
    for k, fx in enumerate(FX):
        bogenfenster(f"wt_fenster_s{reihe}{k}", (fx, WY0 - 0.02, hz), False, GLAS_DUNKEL)
for k, py in enumerate([(FY[i] + FY[i + 1]) / 2 for i in range(4)]):          # flache Wandpfeiler
    box(f"wt_pfeiler_w{k}", (0.3, 0.7, WH - 0.6), (WX0 - 0.12, py, WH / 2), STEIN_HELL)
for k, px in enumerate([(FX[i] + FX[i + 1]) / 2 for i in range(4)]):
    box(f"wt_pfeiler_s{k}", (0.7, 0.3, WH - 0.6), (px, WY0 - 0.12, WH / 2), STEIN_HELL)
TURM_H = WH + 5.5
for k, (ex, ey) in enumerate([(WX0 + 1.2, WY0 + 1.2), (WX0 + 1.2, WY1 - 1.2), (WX1 - 1.2, WY0 + 1.2), (WX1 - 1.2, WY1 - 1.2)]):
    if k == 3:                                 # das runde Tuermchen im Nordosten
        cyl(f"wt_eckturm{k}", 1.6, TURM_H, (ex, ey, TURM_H / 2), STEIN_HELL)
    else:
        box(f"wt_eckturm{k}", (2.8, 2.8, TURM_H), (ex, ey, TURM_H / 2), STEIN_HELL)
    box(f"wt_eckturm_gesims{k}", (3.2, 3.2, 0.25), (ex, ey, TURM_H - 0.1), KALKSTEIN)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1.3, location=(ex, ey, TURM_H + 0.35), segments=32, ring_count=16)
    haube = fertig(bpy.context.object, f"wt_haube{k}", BLEI)
    haube.scale = (1, 1, 1.25)
    bpy.ops.object.shade_smooth()
    cone(f"wt_haube_spitze{k}", 0.45, 1.3, (ex, ey, TURM_H + 2.35), BLEI, verts=16)
    cyl(f"wt_stange{k}", 0.03, 1.4, (ex, ey, TURM_H + 3.5), GOLD, verts=8)
    box(f"wt_fahne{k}", (0.55, 0.02, 0.3), (ex + 0.28, ey, TURM_H + 3.95), GOLD)
licht("mond_whitetower", "SPOT", 30000, (0.55, 0.68, 1.0), (5, 30, 45), rot=(0, 0, 0))

# ---------- Bloody Tower mit dem grossen Tor (Suedostecke) ----------
TX, TB, TT, TH = W - 5.0, 10.0, 8.0, 9.0
box("torturm", (TB, TT, TH), (TX, -S - TT / 2, TH / 2), STEIN)
box("torturm_gesims", (TB + 0.3, TT + 0.3, 0.28), (TX, -S - TT / 2, TH - 0.5), QUADER)
zinnen_gerade("torturm_zinne", TX - TB / 2, TX + TB / 2, FRONT - 0.3, TH, STEIN)
box("tor", (4.0, 0.2, 3.0), (TX, FRONT + 0.02, 1.5), EICHE_TOR)
cyl("tor_bogen", 2.0, 0.19, (TX, FRONT + 0.02, 3.0), EICHE_TOR, rot=(R(90), 0, 0), verts=48)
cyl("tor_bogenstein", 2.4, 0.16, (TX, FRONT - 0.02, 3.0), QUADER, rot=(R(90), 0, 0), verts=48)
for sx in (-1, 1):
    box(f"tor_gewaende{sx}", (0.42, 0.3, 3.0), (TX + sx * 2.2, FRONT, 1.5), QUADER)
for k, hz in enumerate((0.7, 2.0, 3.3)):
    box(f"tor_band{k}", (4.0 if hz < 3 else 3.7, 0.04, 0.12), (TX, FRONT + 0.13, hz), EISEN)
box("tor_spalt", (0.04, 0.03, 4.9), (TX, FRONT + 0.125, 2.45), ZEIGER)
laterne("laterne_tor", TX - 2.9, FRONT + 0.8, 2.9, energie=220)
box("torturm_fenster", (0.5, 0.1, 1.4), (TX, FRONT + 0.02, 6.6), LICHT_SCHWACH)

# ---------- Westmauer (nur damit der Blick nach Westen nicht ins Leere geht) ----------
box("westmauer", (1.5, T, 6.0), (-W - 0.75, 0, 3.0), STEIN)
zinnen_gerade("westmauer_zinne", -S + 3, S, -W - 0.3, 6.0, STEIN, entlang_y=True)

# ---------- Norden: niedrige Mauer, dahinter die Kapelle St Peter ad Vincula mit dem Glockentuermchen; Westen: Beauchamp Tower ----------
NY = S                                          # Nordkante des Platzes
box("nordmauer", (B, 0.4, 1.2), (0, NY + 0.2, 0.6), STEIN)
box("nordmauer_krone", (B, 0.55, 0.1), (0, NY + 0.2, 1.25), KALKSTEIN)
STEIN_KAPELLE = textur("stein_kapelle", "castle_wall_slates", 0.30, (1.7, 1.6, 1.4))
KX, KB, KT, KH = -B / 8, 20.0, 8.0, 6.0        # Mitte, Breite, Tiefe, Hoehe wie im Rohbau
KY = NY + 3.0                                   # Suedwand der Kapelle (schaut in den Hof)
box("kapelle", (KB, KT, KH), (KX, KY + KT / 2, KH / 2), STEIN_KAPELLE)
box("kapelle_sockel", (KB + 0.3, KT + 0.3, 0.7), (KX, KY + KT / 2, 0.35), QUADER)
box("kapelle_gesims", (KB + 0.3, KT + 0.3, 0.2), (KX, KY + KT / 2, KH - 0.5), KALKSTEIN)
box("kapelle_bruestung", (KB + 0.1, KT + 0.1, 0.12), (KX, KY + KT / 2, KH + 0.04), KALKSTEIN)
netz("kapelle_dach", [(KX - KB / 2, KY + 0.4, KH), (KX + KB / 2, KY + 0.4, KH), (KX + KB / 2, KY + KT / 2, KH + 1.1), (KX - KB / 2, KY + KT / 2, KH + 1.1),
                      (KX - KB / 2, KY + KT - 0.4, KH), (KX + KB / 2, KY + KT - 0.4, KH)], [(0, 1, 2, 3), (3, 2, 5, 4)], BLEI)
for k in range(5):                              # fuenf breite Tudor-Fenster mit flachem Bogen; in zweien brennt Kerzenlicht
    fx = KX - KB / 2 + 3.4 + k * 3.5
    glas = LICHT_AN if k == 3 else (LICHT_SCHWACH if k == 1 else GLAS_DUNKEL)
    box(f"kapelle_fassung{k}", (2.5, 0.1, 2.6), (fx, KY - 0.02, 2.9), KALKSTEIN)
    bo = cyl(f"kapelle_fassung_bogen{k}", 1.25, 0.1, (fx, KY - 0.02, 4.2), KALKSTEIN, rot=(R(90), 0, 0))
    bo.scale = (1, 1, 0.45)
    box(f"kapelle_fenster{k}", (2.1, 0.14, 2.4), (fx, KY - 0.03, 2.9), glas)
    bg = cyl(f"kapelle_fenster_bogen{k}", 1.05, 0.14, (fx, KY - 0.03, 4.1), glas, rot=(R(90), 0, 0))
    bg.scale = (1, 1, 0.42)
    for sx in (-0.35, 0.35):
        box(f"kapelle_pfosten{k}{sx}", (0.1, 0.18, 2.8), (fx + sx, KY - 0.04, 3.05), KALKSTEIN)
    if glas is LICHT_AN:
        licht(f"kapelle_schein{k}", "POINT", 60, WARM, (fx, KY - 0.8, 2.9), weich_=0.5)
box("kapelle_tuer", (1.3, 0.12, 2.3), (KX - KB / 2 + 1.2, KY - 0.03, 1.15), EICHE_TOR)
cyl("kapelle_tuer_bogen", 0.65, 0.12, (KX - KB / 2 + 1.2, KY - 0.03, 2.3), EICHE_TOR, rot=(R(90), 0, 0))
laterne("laterne_kapelle", KX - KB / 2 + 2.4, KY - 0.75, 2.5, energie=200, wand=KY)
laterne("laterne_kapelle_ost", KX + KB / 2 - 0.9, KY - 0.75, 2.6, energie=160, wand=KY)
# Glockentuermchen am Westende: viereckiger Steinturm, obenauf eine kleine weisse Holzlaterne mit Bleihaube
GTX, GTY = KX - KB / 2 - 1.2, KY + 2.0
box("glockenturm", (3.0, 3.0, 10.0), (GTX, GTY, 5.0), STEIN_KAPELLE)
box("glockenturm_gesims", (3.3, 3.3, 0.2), (GTX, GTY, 9.9), KALKSTEIN)
box("glockenturm_luke", (0.7, 0.1, 1.3), (GTX, GTY - 1.5, 8.2), UHR_SCHWARZ)
box("glockenstube", (1.5, 1.5, 1.6), (GTX, GTY, 10.8), HOLZ_WEISS)
for k in range(4):
    w_ = k * math.pi / 2
    box(f"glockenstube_bogen{k}", (0.7, 0.06, 1.0), (GTX + 0.75 * math.sin(w_), GTY - 0.75 * math.cos(w_), 10.85), UHR_SCHWARZ, rot=(0, 0, w_))
box("glockenstube_gesims", (1.8, 1.8, 0.12), (GTX, GTY, 11.65), HOLZ_WEISS)
cone("glockenstube_haube", 1.15, 1.3, (GTX, GTY, 12.35), BLEI, verts=4, rot=(0, 0, R(45)))
cyl("glockenstube_stange", 0.025, 0.9, (GTX, GTY, 13.4), GOLD, verts=8)
mk = licht("mond_kapelle", "SPOT", 11000, (0.55, 0.68, 1.0), (KX - 6, NY - 14.0, 34))   # ein Streifen Mondlicht auf Kapelle und Glockentuermchen
mk.data.spot_size, mk.data.spot_blend = R(30), 0.7
zk = bpy.data.objects.new("ziel_kapelle", None)
scene.collection.objects.link(zk)
zk.location = (KX - 3, KY + 2, 5.0)
tk = mk.constraints.new("TRACK_TO")
tk.target, tk.track_axis, tk.up_axis = zk, "TRACK_NEGATIVE_Z", "UP_Y"
# Beauchamp Tower an der Westmauer (Rohbau: rund, 9 m hoch) und eine dunkle Aussenmauer im Norden als Abschluss
BTX, BTY, BTR, BTH = -W - 4.2, T / 6, 4.0, 9.0
cyl("beauchamp", BTR, BTH, (BTX, BTY, BTH / 2), STEIN, verts=48)
cyl("beauchamp_gesims", BTR + 0.15, 0.25, (BTX, BTY, BTH - 0.5), QUADER, verts=48)
for i in range(16):
    w_ = i * 2 * math.pi / 16
    box(f"beauchamp_zinne{i}", (0.95, 0.6, 0.9), (BTX + (BTR - 0.25) * math.cos(w_), BTY + (BTR - 0.25) * math.sin(w_), BTH + 0.45), STEIN, rot=(0, 0, w_ + R(90)))
box("beauchamp_fenster", (0.2, 0.5, 1.3), (BTX + BTR + 0.02, BTY, 5.2), LICHT_SCHWACH)
box("aussenmauer_nord", (B + 70, 2.0, 9.0), (8, NY + 16.0, 4.5), STEIN)
zinnen_gerade("aussenmauer_zinne", -W - 27, W + 43, NY + 15.3, 9.0, STEIN)

# ---------- Alte Baeume auf dem Rasen (Mr. Alex 21.11.): knorrige Staemme, breite Kronen, Mondschatten auf dem Gruen ----------
import random
zufall = random.Random(11)
wolke = bpy.data.textures.new("laubwolke", "CLOUDS")
wolke.noise_scale = 0.45
wolke.noise_depth = 3


def ast(name, a, b, r0, r1):
    a, b = Vector(a), Vector(b)
    ri = b - a
    bpy.ops.mesh.primitive_cone_add(radius1=r0, radius2=r1, depth=ri.length, location=(a + b) / 2, vertices=12)
    ob = fertig(bpy.context.object, name, RINDE)
    ob.rotation_euler = ri.to_track_quat("Z", "Y").to_euler()
    return ob


def baum(name, x, y, hoch=11.0, breit=5.0):
    stamm = hoch * 0.30
    ast(name + "_stamm", (x, y, 0), (x + 0.25, y - 0.15, stamm), 0.62, 0.42)
    cyl(name + "_fuss", 0.75, 0.3, (x, y, 0.1), RINDE, verts=14)
    for i in range(8):
        w_ = i * 2 * math.pi / 8 + zufall.uniform(-0.4, 0.4)
        aus = zufall.uniform(0.3, 0.9) * breit
        ende = (x + aus * math.cos(w_), y + aus * math.sin(w_), stamm + zufall.uniform(0.18, 0.55) * hoch)
        ast(f"{name}_ast{i}", (x + 0.25, y - 0.15, stamm - 0.3), ende, 0.26, 0.06)
        for j in range(3):
            r = zufall.uniform(0.22, 0.38) * breit
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4, radius=r, location=(ende[0] + zufall.uniform(-1.3, 1.3), ende[1] + zufall.uniform(-1.3, 1.3), ende[2] + zufall.uniform(-0.6, 1.6)))
            bpy.ops.object.shade_smooth()
            krone = fertig(bpy.context.object, f"{name}_laub{i}{j}", LAUB)
            krone.scale = (1, 1, zufall.uniform(0.8, 1.05))
            ver = krone.modifiers.new("laub", "DISPLACE")
            ver.texture, ver.strength, ver.texture_coords = wolke, 0.9, "GLOBAL"
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4, radius=0.42 * breit, location=(x, y, hoch * 0.88))
    bpy.ops.object.shade_smooth()
    mitte = fertig(bpy.context.object, name + "_laub_mitte", LAUB)
    ver = mitte.modifiers.new("laub", "DISPLACE")
    ver.texture, ver.strength, ver.texture_coords = wolke, 0.9, "GLOBAL"


# Plaetze innerhalb des Rundkurses, neben den Wegen der Figuren (hof_bau.js): nicht auf x = 0, x = +-9, nicht im Kreis des Sergeants
BAEUME = [(-15.5, -2.0, 12.0, 5.5), (4.5, 6.0, 13.0, 6.0), (16.0, -3.5, 10.5, 5.0)]
BAUM = os.environ.get("BAUM", "eigen")       # "eigen" = selbst gebaut; sonst ein Poly-Haven-Modell (CC0), z. B. jacaranda_tree, island_tree_02
for k, (bx, by, bh, bb) in enumerate(BAEUME):
    if BAUM == "eigen":
        baum(f"baum{k}", bx, by, bh, bb)
    else:   # "mischung" = drei verschiedene alte Baeume: dicker, knorriger Stamm · breite Krone · gedrehte Staemme
        art = ["island_tree_01", "jacaranda_tree", "island_tree_02"][k] if BAUM == "mischung" else BAUM
        if BAUM == "mischung" and k == 0:
            # Der grosse alte Baum (Mr. Alex 21.11.: mindestens einer richtig gross und dick, Krone viel breiter und wuchtiger –
            # Vorbild: die alten Platanen auf Tower Green). Zwei ineinander gestellte, verdrehte Staemme ergeben einen
            # dicken, unregelmaessigen Stamm und eine dichte, breite Krone; dazu helle, fleckige Platanenrinde.
            teile = [modell(art, (bx, by, -0.1), hoehe=18.5, dreh=0.4, weit=1.45),
                     modell(art, (bx + 0.5, by - 0.3, -0.1), hoehe=16.5, dreh=2.9, weit=1.6)]
            # Krone noch breiter und geschlossener (Mr. Alex 21.11.): zwei weitere Kronen ohne Stamm, weiter ausladend
            import bmesh
            for dreh_, hoch_, weit_ in ((1.6, 17.5, 1.9), (4.4, 16.0, 2.05)):
                kr = modell(art, (bx, by, 0.6), hoehe=hoch_, dreh=dreh_, weit=weit_)
                for nm in kr["netze"]:
                    ob_ = bpy.data.objects[nm]
                    weg = [i for i, pl in enumerate(ob_.material_slots) if "leaves" not in pl.material.name.lower() and "branches" not in pl.material.name.lower()]
                    if weg:
                        ob_.data = ob_.data.copy()
                        bm = bmesh.new()
                        bm.from_mesh(ob_.data)
                        bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.material_index in weg], context="FACES")
                        bm.to_mesh(ob_.data)
                        bm.free()
            mb = licht("mond_baum", "SPOT", 14000, (0.55, 0.68, 1.0), (bx - 14, by + 26, 40))   # ein Streifen Mondlicht auf Stamm und Krone
            mb.data.spot_size, mb.data.spot_blend = R(34), 0.7
            zb = bpy.data.objects.new("ziel_baum", None)
            scene.collection.objects.link(zb)
            zb.location = (bx, by, 7.0)
            tb = mb.constraints.new("TRACK_TO")
            tb.target, tb.track_axis, tb.up_axis = zb, "TRACK_NEGATIVE_Z", "UP_Y"
            # eine Laterne an einer Kette vom Ast: warmes Licht auf die Rinde und von unten in die Krone
            lx, ly, lz = bx + 2.6, by - 2.4, 2.5
            cyl("baum_kette", 0.012, 2.6, (lx, ly, lz + 0.5 + 1.3), EISEN, verts=6)
            modell("Lantern_01", (lx, ly, lz), hoehe=0.55)
            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.04, location=(lx, ly, lz + 0.22))
            fertig(bpy.context.object, "baum_laterne_flamme", FLAMME)
            licht("baum_laterne", "POINT", 420, WARM, (lx, ly, lz + 0.22), weich_=0.1)
            for teil in teile:
                for nm in teil["netze"]:
                    for platz in bpy.data.objects[nm].material_slots:
                        m_ = platz.material
                        if m_ and not m_.get("platane") and "leaves" not in m_.name.lower() and "branches" not in m_.name.lower():   # nur der Stamm, nicht Zweige und Laub
                            m_["platane"] = 1
                            nt = m_.node_tree
                            b = nt.nodes.get("Principled BSDF")
                            if not b or not b.inputs["Base Color"].links:
                                continue
                            alt = b.inputs["Base Color"].links[0].from_socket
                            geo = nt.nodes.new("ShaderNodeNewGeometry")
                            lang = nt.nodes.new("ShaderNodeMapping")          # weiche, laengliche Flecken (in der Hoehe gestreckt)
                            lang.inputs["Scale"].default_value = (1.0, 1.0, 0.35)
                            nt.links.new(geo.outputs["Position"], lang.inputs["Vector"])
                            fleck = nt.nodes.new("ShaderNodeTexNoise")
                            fleck.inputs["Scale"].default_value = 1.5
                            fleck.inputs["Detail"].default_value = 3.0
                            nt.links.new(lang.outputs["Vector"], fleck.inputs["Vector"])
                            stufe = nt.nodes.new("ShaderNodeValToRGB")
                            stufe.color_ramp.elements[0].position, stufe.color_ramp.elements[1].position = 0.50, 0.62
                            nt.links.new(fleck.outputs[0], stufe.inputs[0])
                            hell = nt.nodes.new("ShaderNodeMix")
                            hell.data_type = "RGBA"
                            nt.links.new(stufe.outputs["Color"], hell.inputs[0])
                            nt.links.new(alt, hell.inputs[6])
                            hell.inputs[7].default_value = (0.62, 0.58, 0.44, 1)
                            nt.links.new(hell.outputs[2], b.inputs["Base Color"])
            continue
        modell(art, (bx, by, -0.05), hoehe=bh + 2.0, dreh=k * 2.1)

# ---------- Schwarzes Eisengitter an der Rasenkante (wie auf den Fotos). Nur zwei Stuecke: dazwischen und aussen laufen die Wege der Figuren ----------
GY = FRONT + PFL + 0.25
for k, (gx0, gx1) in enumerate([(-20.5, -11.5), (11.5, 20.5)]):
    n_ = int((gx1 - gx0) / 1.5)
    for i in range(n_ + 1):
        px = gx0 + i * (gx1 - gx0) / n_
        cyl(f"gitter{k}_pfosten{i}", 0.035, 1.05, (px, GY, 0.52), GITTER, verts=10)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.06, location=(px, GY, 1.08), segments=12, ring_count=8)
        fertig(bpy.context.object, f"gitter{k}_knauf{i}", GITTER)
    for j, hz in enumerate((0.5, 0.92)):
        cyl(f"gitter{k}_holm{j}", 0.02, gx1 - gx0, ((gx0 + gx1) / 2, GY, hz), GITTER, rot=(0, R(90), 0), verts=8)

# ---------- Licht: Nacht. Kuehler Mond von Nordosten, warm nur Laternen und Fenster ----------
licht("mond", "SUN", 1.1, (0.52, 0.66, 1.0), (0, 0, 30), rot=(R(-52), 0, R(28)))
world = bpy.data.worlds.new("nacht")
scene.world = world
world.use_nodes = True
wn = world.node_tree
hg = wn.nodes["Background"]
hg.inputs["Strength"].default_value = 1.0
tc = wn.nodes.new("ShaderNodeTexCoord")
sp_ = wn.nodes.new("ShaderNodeSeparateXYZ")
wn.links.new(tc.outputs["Generated"], sp_.inputs[0])
verlauf = wn.nodes.new("ShaderNodeValToRGB")          # am Horizont heller (die Lichter Londons), oben tiefes Nachtblau
verlauf.color_ramp.elements[0].position, verlauf.color_ramp.elements[0].color = 0.0, (0.05, 0.065, 0.12, 1)
verlauf.color_ramp.elements[1].position, verlauf.color_ramp.elements[1].color = 0.45, (0.008, 0.016, 0.05, 1)
wn.links.new(sp_.outputs["Z"], verlauf.inputs[0])
sterne = wn.nodes.new("ShaderNodeTexVoronoi")
sterne.inputs["Scale"].default_value = 140
wn.links.new(tc.outputs["Generated"], sterne.inputs["Vector"])
punkt = wn.nodes.new("ShaderNodeMath")
punkt.operation = "LESS_THAN"
punkt.inputs[1].default_value = 0.035
wn.links.new(sterne.outputs["Distance"], punkt.inputs[0])
hoch_ = wn.nodes.new("ShaderNodeMath")
hoch_.operation = "MULTIPLY"
wn.links.new(punkt.outputs[0], hoch_.inputs[0])
wn.links.new(sp_.outputs["Z"], hoch_.inputs[1])
plus = wn.nodes.new("ShaderNodeMix")
plus.data_type, plus.blend_type = "RGBA", "ADD"
wn.links.new(hoch_.outputs[0], plus.inputs[0])
wn.links.new(verlauf.outputs["Color"], plus.inputs[6])
plus.inputs[7].default_value = (0.9, 0.9, 1.0, 1)
wn.links.new(plus.outputs[2], hg.inputs["Color"])

# ---------- Kamera und Bilder ----------
cam_data = bpy.data.cameras.new("cam")
cam = bpy.data.objects.new("cam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
ziel = bpy.data.objects.new("ziel", None)
scene.collection.objects.link(ziel)
tr = cam.constraints.new("TRACK_TO")
tr.target = ziel
tr.track_axis = "TRACK_NEGATIVE_Z"
tr.up_axis = "UP_Y"

ANSICHTEN = {   # Nr.: (Name, Ort der Kamera, Blickziel, Brennweite)
    "1": ("ganz", (-4.0, -5.0, 1.6), (-7.0, FRONT, 4.6), 18),          # von der Platzmitte auf die ganze Suedseite
    "2": ("tuer", (-7.8, FRONT + 7.5, 1.5), (TUER_X + 0.6, FRONT, 1.9), 28),   # Tuer zur Wachstube, Fass, Laterne (Hoehe eines Kindes)
    "4": ("whitetower", (-4.0, FRONT + 3.0, 1.5), (W + 12.0, 3.0, 8.0), 20),   # vom Start nach Nordosten: Rabenmauer und White Tower
    "5": ("rasen", (-12.0, FRONT + 1.6, 1.5), (9.0, 4.0, 5.0), 19),   # von der Tuer ueber das Gruen: Baeume, Maehstreifen, Gitter, White Tower
    "6": ("grosser_baum", (6.0, FRONT + 3.0, 1.5), (-14.5, -3.0, 7.5), 16),   # der grosse alte Baum im Westen
    "7": ("nord", (2.0, FRONT + 2.6, 1.5), (-5.0, S + 4.0, 4.5), 17),   # vom Start nach Norden: Rasen, Kapelle, Glockentuermchen
    "8": ("kapelle", (-3.0, 3.0, 1.5), (KX - 2.5, KY, 5.0), 21),   # vom Rasen auf die Kapelle
    "3": ("uhr", (-12.0, FRONT + 12.0, 1.5), (UTX + 2.5, UTY + 2.5, 7.6), 24), # Bell Tower mit der Uhr
}
os.makedirs(OUT, exist_ok=True)
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = SAMPLES
scene.cycles.max_bounces = 5
scene.cycles.use_denoising = True
scene.render.resolution_x = RESX
scene.render.resolution_y = RESY
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "JPEG"
scene.render.image_settings.quality = 88
try:
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = float(os.environ.get("HELL", 0.0))
except Exception as e:
    print("Farbabstimmung AgX nicht gesetzt:", e, flush=True)
mw_ = bpy.data.objects["mond_whitetower"]      # ein Streifen Mondlicht nur auf den White Tower
mw_.data.spot_size, mw_.data.spot_blend = R(40), 0.6
zw = mw_.constraints.new("TRACK_TO")
zw.target = bpy.data.objects["whitetower"]
zw.track_axis, zw.up_axis = "TRACK_NEGATIVE_Z", "UP_Y"
for nr in os.environ.get("ANSICHT", "1,2,3,4,5,6,7,8").split(","):
    name, ort, blick, brennweite = ANSICHTEN[nr.strip()]
    cam.location, ziel.location, cam_data.lens = ort, blick, brennweite
    t0 = time.time()
    scene.render.filepath = os.path.join(OUT, f"hof_sued_{nr.strip()}_{name}" + ("" if BAUM == "eigen" else "_" + BAUM) + ".jpg")
    bpy.ops.render.render(write_still=True)
    print(f"BILD {name} fertig in {time.time() - t0:.1f} s", flush=True)
