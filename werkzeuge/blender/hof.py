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
RASEN = textur("rasen", "leafy_grass", 0.45, (0.50, 0.62, 0.36), relief=0.2)
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
BLATT = mat("uhr_blatt_alt", (0.50, 0.45, 0.34), 0.85, emit=0.05)   # verwittertes, helles Zifferblatt
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


def modell(name, ort, hoehe=None, breite=None, dreh=0.0):
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
    anker.scale = (kx, kx if breite else kz, kz)
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


def laterne(name, x, y, z, energie=260):
    """Laterne an einem eisernen Arm (wie die Laternen im Guard Room), haengt bei (x, y, z) vor der Wand."""
    box(name + "_arm", (0.05, abs(y - (FRONT)) + 0.1, 0.05), (x, (y + FRONT) / 2, z + 0.62), EISEN)
    box(name + "_kette", (0.02, 0.02, 0.14), (x, y, z + 0.55), EISEN)
    modell("Lantern_01", (x, y, z), hoehe=0.5)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.035, location=(x, y, z + 0.2))
    fertig(bpy.context.object, name + "_flamme", FLAMME)
    licht(name, "POINT", energie, WARM, (x, y + 0.25, z + 0.2), weich_=0.08)


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
TW, TZ0, TZ1 = 3.3, UH - 0.2, UH + 5.1          # Uhrtuermchen: Breite, Unter- und Oberkante
UM = Vector((UTX, UTY, UH + 3.35)) + N_ * (TW / 2)   # Mitte des Zifferblatts, auf der Hofseite des Tuermchens
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


# Uhrtuermchen (Mr. Alex 21.11.: die Uhr organisch eingefasst wie am Somerset House): viereckig, aus dem Stein des Turms gewachsen,
# helle Eckquader und Gesimse, das Blatt in einer runden Steinfassung, obenauf eine Bleikuppel mit Wetterfahne
TM = Vector((UTX, UTY, 0))
DREH = R(-45)                                  # eine Seite schaut nach Nordosten in den Hof
box("uhrturm_aufsatz", (TW, TW, TZ1 - TZ0), TM + HOCH * (TZ0 + TZ1) / 2, STEIN, rot=(0, 0, DREH))
for k, (a_, b_) in enumerate([(1, 1), (1, -1), (-1, 1), (-1, -1)]):      # Eckquader
    box(f"aufsatz_ecke{k}", (0.42, 0.42, TZ1 - TZ0), TM + (RECHTS * a_ + N_ * b_) * (TW / 2 - 0.12) + HOCH * (TZ0 + TZ1) / 2, KALKSTEIN, rot=(0, 0, DREH))
box("aufsatz_sockel", (TW + 0.3, TW + 0.3, 0.3), TM + HOCH * (UH + 0.35), KALKSTEIN, rot=(0, 0, DREH))
box("aufsatz_gesims", (TW + 0.5, TW + 0.5, 0.22), TM + HOCH * (TZ1 - 0.05), KALKSTEIN, rot=(0, 0, DREH))
box("aufsatz_gesims2", (TW + 0.25, TW + 0.25, 0.16), TM + HOCH * (TZ1 - 0.24), KALKSTEIN, rot=(0, 0, DREH))
bpy.ops.mesh.primitive_uv_sphere_add(radius=TW / 2 + 0.05, location=TM + HOCH * (TZ1 + 0.02), segments=40, ring_count=20)
kuppel = fertig(bpy.context.object, "aufsatz_kuppel", BLEI)
kuppel.scale = (1, 1, 0.8)
bpy.ops.object.shade_smooth()
cyl("aufsatz_knauf", 0.22, 0.3, TM + HOCH * (TZ1 + 1.42), BLEI, verts=16)
cyl("aufsatz_stange", 0.03, 1.3, TM + HOCH * (TZ1 + 2.1), GOLD, verts=8)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.13, location=TM + HOCH * (TZ1 + 1.75))
fertig(bpy.context.object, "aufsatz_kugel", GOLD)
box("aufsatz_fahne", (0.5, 0.02, 0.22), TM + HOCH * (TZ1 + 2.55) + Vector((0.2, 0.12, 0)), GOLD, rot=(0, 0, R(30)))
for k, sx in enumerate((-1, 1)):               # die Nachbarseiten: schmale dunkle Schalloeffnungen statt einer Uhr
    box(f"aufsatz_luke{k}", (0.06, 0.6, 1.5), TM + RECHTS * sx * (TW / 2) + HOCH * (UH + 3.35), UHR_SCHWARZ, rot=(0, 0, DREH))
# das Zifferblatt liegt vertieft in einer runden Fassung aus hellem Stein
cyl("uhr_fassung", 1.3, 0.24, UM + N_ * 0.0, KALKSTEIN, rot=(R(90), 0, R(-45)), verts=64)
cyl("uhr_blatt", 1.12, 0.1, UM + N_ * 0.09, BLATT, rot=(R(90), 0, R(-45)), verts=64)
bpy.ops.mesh.primitive_torus_add(major_radius=1.14, minor_radius=0.06, location=UM + N_ * 0.13, rotation=(R(90), 0, R(-45)), major_segments=64)
fertig(bpy.context.object, "uhr_wulst", KALKSTEIN)
ZIFFERN = ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"]
for i, zf in enumerate(ZIFFERN):
    a_ = i * math.pi / 6
    cu = bpy.data.curves.new("ziffer", "FONT")
    cu.body, cu.align_x, cu.align_y, cu.size, cu.extrude = zf, "CENTER", "CENTER", 0.26, 0.008
    cu.materials.append(ZEIGER)
    ob = bpy.data.objects.new(f"uhr_ziffer{i}", cu)
    scene.collection.objects.link(ob)
    ob.matrix_world = Matrix.Translation(UM + N_ * 0.145 + (HOCH * math.cos(a_) + RECHTS * math.sin(a_)) * 0.84) @ BASIS @ Matrix.Rotation(-a_, 4, "Z") @ Matrix.Diagonal((0.8, 1.0, 1.0, 1))
for i in range(60):
    an_der_uhr(f"uhr_strich{i}", i * math.pi / 30, 1.01 if i % 5 else 0.99, 1.06, 0.012 if i % 5 else 0.03, ZEIGER, 0.145)
an_der_uhr("uhr_minute", R(90), -0.16, 0.92, 0.05, ZEIGER, 0.19)        # Viertel nach neun (im Spiel laeuft die Uhr von selbst)
an_der_uhr("uhr_stunde", R(277.5), -0.12, 0.56, 0.085, ZEIGER, 0.17)
cyl("uhr_nabe", 0.07, 0.08, UM + N_ * 0.2, ZEIGER, rot=(R(90), 0, R(-45)), verts=24)
licht("uhr_lampe", "POINT", 26, WARM, UM + N_ * 1.6 + HOCH * 0.2, weich_=0.3)

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
    "3": ("uhr", (-10.0, FRONT + 14.0, 1.5), (UTX + 2.5, UTY + 2.5, 8.6), 22), # Bell Tower mit der Uhr
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
for nr in os.environ.get("ANSICHT", "1,2,3").split(","):
    name, ort, blick, brennweite = ANSICHTEN[nr.strip()]
    cam.location, ziel.location, cam_data.lens = ort, blick, brennweite
    t0 = time.time()
    scene.render.filepath = os.path.join(OUT, f"hof_sued_{nr.strip()}_{name}.jpg")
    bpy.ops.render.render(write_still=True)
    print(f"BILD {name} fertig in {time.time() - t0:.1f} s", flush=True)
