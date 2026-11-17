"""Probe: Uniformjacke als Stoff, der per Simulation ueber die Stuhllehne faellt (Keys of the Tower, Guard Room).

Aufruf:  blender -b -P werkzeuge/blender/jacke_probe.py     -> werkzeuge/blender/frames/jacke_probe.jpg
Nur ein Probebild fuer Mr. Alex; der Raum (guardroom.py) wird davon nicht veraendert.
"""
import math
import os

import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
MODELLE = os.path.join(HERE, "modelle")
R = math.radians
BILDER = int(os.environ.get("BILDER", 90))

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def mat(name, color, rough=0.8, metallic=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metallic
    return m


BLAU = mat("jacke_blau", (0.04, 0.06, 0.20), 0.9)
ROT = mat("scharlach", (0.70, 0.04, 0.05), 0.7)
BODEN = mat("boden", (0.25, 0.15, 0.09), 0.8)
WAND = mat("wand", (0.55, 0.48, 0.38), 0.9)

# Stuhl wie im Raum (ohne Drehung)
SX, SY = 0.0, 0.0
vorher = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=os.path.join(MODELLE, "WoodenChair_01", "WoodenChair_01.gltf"))
bpy.context.view_layer.update()
netze = [o for o in bpy.data.objects if o not in vorher and o.type == "MESH"]
for o in netze:
    mw = o.matrix_world.copy()
    o.parent = None
    o.matrix_world = mw
for o in [o for o in bpy.data.objects if o not in vorher and o.type != "MESH"]:
    bpy.data.objects.remove(o, do_unlink=True)
bpy.context.view_layer.update()
ecken = [o.matrix_world @ Vector(c) for o in netze for c in o.bound_box]
lo = [min(e[i] for e in ecken) for i in range(3)]
hi = [max(e[i] for e in ecken) for i in range(3)]
anker = bpy.data.objects.new("stuhl_anker", None)
scene.collection.objects.link(anker)
anker.location = ((lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, lo[2])
bpy.context.view_layer.update()
for o in netze:
    mw = o.matrix_world.copy()
    o.parent = anker
    o.matrix_parent_inverse = anker.matrix_world.inverted()
    o.matrix_world = mw
anker.location = (SX, SY, 0)
anker.scale = (0.80, 0.62, 0.52)
bpy.context.view_layer.update()
for o in netze:   # der Stuhl selbst haelt den Stoff auf
    o.modifiers.new("halt", "COLLISION")
    o.collision.thickness_outer = 0.012
    o.collision.cloth_friction = 25
ecken = [o.matrix_world @ Vector(c) for o in netze for c in o.bound_box]
OBEN = max(e[2] for e in ecken)
HINTEN = max(e[1] for e in ecken)
print(f"Stuhl: Oberkante {OBEN:.2f} m, Lehne bei y = {HINTEN:.2f}", flush=True)

bpy.ops.mesh.primitive_plane_add(size=8, location=(0, 0, 0))
boden = bpy.context.object
boden.data.materials.append(BODEN)
boden.modifiers.new("halt", "COLLISION")
bpy.ops.mesh.primitive_plane_add(size=8, location=(0, 1.2, 2), rotation=(R(90), 0, 0))
bpy.context.object.data.materials.append(WAND)

# ---------- Jacke als flaches Stoffstueck (Rueckenteil mit zwei Aermeln), liegt waagrecht ueber der Lehne ----------
ZELLE = 0.02
BREIT, LANG = 0.29, 0.74          # halbe Breite des Rumpfs, Laenge Kragen -> Saum
AERMEL, ARM_B = 0.56, 0.19        # Aermellaenge und -breite
LINIE = 0.13                      # so weit unter dem Kragen liegt die Jacke auf der Lehne auf
Y_LEHNE = HINTEN - 0.04


def drin(u, v):
    if abs(u) <= BREIT and 0 <= v <= LANG:
        return True
    t = (abs(u) - BREIT) / AERMEL
    return 0 <= t <= 1 and 0.01 + 0.10 * t <= v <= 0.01 + ARM_B + 0.10 * t


def rot(u, v):
    t = (abs(u) - BREIT) / AERMEL
    return v > LANG - 0.06 or t > 0.84 or (v < 0.05 and abs(u) < 0.17) or (abs(u) < 0.025 and v > 0.05)


nu, nv = int((BREIT + AERMEL) / ZELLE) + 1, int(LANG / ZELLE) + 1
punkte, nummer, flaechen, farben = [], {}, [], []


def punkt(i, j):
    if (i, j) not in nummer:
        u, v = i * ZELLE, j * ZELLE
        nummer[(i, j)] = len(punkte)
        punkte.append((SX + u, Y_LEHNE - (v - LINIE), OBEN + 0.03))
    return nummer[(i, j)]


for i in range(-nu, nu):
    for j in range(0, nv):
        u, v = (i + 0.5) * ZELLE, (j + 0.5) * ZELLE
        if drin(u, v):
            flaechen.append((punkt(i, j), punkt(i + 1, j), punkt(i + 1, j + 1), punkt(i, j + 1)))
            farben.append(1 if rot(u, v) else 0)
netz = bpy.data.meshes.new("jacke")
netz.from_pydata(punkte, [], flaechen)
netz.update()
jacke = bpy.data.objects.new("jacke", netz)
scene.collection.objects.link(jacke)
netz.materials.append(BLAU)
netz.materials.append(ROT)
for p, f in zip(netz.polygons, farben):
    p.material_index = f
    p.use_smooth = True
# Auf der Lehne festgehalten: eine Reihe quer ueber die Schultern (sonst rutscht die Jacke nach vorn herunter)
fest = jacke.vertex_groups.new(name="fest")
fest.add([n for (i, j), n in nummer.items() if abs(j * ZELLE - LINIE) < ZELLE * 0.6 and abs(i * ZELLE) <= BREIT - 0.03], 1.0, "REPLACE")

stoff = jacke.modifiers.new("stoff", "CLOTH")
stoff.settings.quality = 10
stoff.settings.mass = 0.25
stoff.settings.tension_stiffness = 12
stoff.settings.compression_stiffness = 12
stoff.settings.shear_stiffness = 6
stoff.settings.bending_stiffness = 0.4
stoff.settings.vertex_group_mass = "fest"
stoff.collision_settings.collision_quality = 4
stoff.collision_settings.distance_min = 0.012
stoff.collision_settings.use_self_collision = True
stoff.collision_settings.self_distance_min = 0.008
stoff.point_cache.frame_start = 1
stoff.point_cache.frame_end = BILDER
glatt = jacke.modifiers.new("glatt", "SUBSURF")
glatt.levels = glatt.render_levels = 1
dick = jacke.modifiers.new("dick", "SOLIDIFY")
dick.thickness = 0.007

scene.frame_start, scene.frame_end = 1, BILDER
for f in range(1, BILDER + 1):   # Stoff fallen lassen
    scene.frame_set(f)
print("Stoff gefallen", flush=True)

# ---------- Probebild ----------
cam_data = bpy.data.cameras.new("cam")
cam_data.lens = 50
cam = bpy.data.objects.new("cam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
cam.location = (0.9, -3.0, 1.25)
ziel = bpy.data.objects.new("ziel", None)
scene.collection.objects.link(ziel)
ziel.location = (0, 0, 0.72)
tr = cam.constraints.new("TRACK_TO")
tr.target = ziel
tr.track_axis = "TRACK_NEGATIVE_Z"
tr.up_axis = "UP_Y"
for name, energie, farbe, ort in [("feuer", 400, (1.0, 0.5, 0.2), (-2.0, -1.5, 1.0)), ("vorn", 250, (1.0, 0.8, 0.6), (1.5, -3.0, 2.5))]:
    d = bpy.data.lights.new(name, "POINT")
    d.energy = energie
    d.color = farbe
    d.shadow_soft_size = 0.4
    ob = bpy.data.objects.new(name, d)
    scene.collection.objects.link(ob)
    ob.location = ort
world = bpy.data.worlds.new("w")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.05, 0.03, 0.02, 1)
scene.render.engine = "CYCLES"
scene.cycles.samples = 64
scene.cycles.use_denoising = True
scene.render.resolution_x = 900
scene.render.resolution_y = 900
scene.render.image_settings.file_format = "JPEG"
scene.render.filepath = os.path.join(HERE, "frames", "jacke_probe.jpg")
bpy.ops.render.render(write_still=True)
print("PROBE fertig", flush=True)
