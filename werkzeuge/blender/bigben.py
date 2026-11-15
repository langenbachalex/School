"""Big Ben Probe-Film: stilisierte Low-Poly-Szene, komplett per Skript (bpy, ohne Oberflaeche).

Aufruf:  venv/bin/python bigben.py            -> alle Bilder nach frames/
         F0=60 F1=60 venv/bin/python bigben.py -> nur Bild 60
Umgebungsvariablen: F0, F1 (Bildbereich), SAMPLES, RESX, RESY, FPS, SECONDS, OUT
"""
import math
import os
import time

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
FPS = int(os.environ.get("FPS", 24))
SECONDS = float(os.environ.get("SECONDS", 5))
NFRAMES = int(FPS * SECONDS)
F0 = int(os.environ.get("F0", 1))
F1 = int(os.environ.get("F1", NFRAMES))
SAMPLES = int(os.environ.get("SAMPLES", 16))
RESX = int(os.environ.get("RESX", 640))
RESY = int(os.environ.get("RESY", 360))
OUT = os.environ.get("OUT", os.path.join(HERE, "frames"))

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---------- Material-Helfer ----------
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


STONE = mat("stone", (0.80, 0.62, 0.36))
STONE_D = mat("stone_dark", (0.58, 0.43, 0.25))
ROOF = mat("roof", (0.20, 0.24, 0.30), 0.5)
GOLD = mat("gold", (1.0, 0.72, 0.15), 0.35, 0.8)
FACE = mat("face", (1.0, 0.97, 0.85), 0.6, emit=0.6)
BLACK = mat("black", (0.03, 0.03, 0.04), 0.5)
WINDOW = mat("window", (0.20, 0.30, 0.42), 0.2)
GRASS = mat("grass", (0.30, 0.62, 0.25))
ROAD = mat("road", (0.25, 0.26, 0.29))
PAVE = mat("pave", (0.78, 0.74, 0.66))
WATER = mat("water", (0.10, 0.36, 0.55), 0.08)
RED = mat("bus_red", (0.85, 0.05, 0.05), 0.35)
BUSWIN = mat("bus_window", (0.75, 0.90, 1.0), 0.1)
TRUNK = mat("trunk", (0.36, 0.22, 0.12))
LEAF = mat("leaf", (0.20, 0.55, 0.20))
LEAF2 = mat("leaf2", (0.35, 0.68, 0.22))
LAMP = mat("lamp", (1.0, 0.85, 0.5), emit=4.0)


def finish(ob, material, parent=None):
    ob.data.materials.append(material)
    if parent:
        ob.parent = parent
    return ob


def box(name, size, loc, material, parent=None, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    ob = bpy.context.object
    ob.name = name
    ob.scale = size
    return finish(ob, material, parent)


def cyl(name, r, depth, loc, material, parent=None, rot=(0, 0, 0), verts=16):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, rotation=rot, vertices=verts)
    ob = bpy.context.object
    ob.name = name
    return finish(ob, material, parent)


def cone(name, r, depth, loc, material, verts=4, rot=(0, 0, math.radians(45)), parent=None):
    bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=0, depth=depth, location=loc, rotation=rot, vertices=verts)
    ob = bpy.context.object
    ob.name = name
    return finish(ob, material, parent)


def ball(name, r, loc, material, parent=None):
    bpy.ops.mesh.primitive_ico_sphere_add(radius=r, subdivisions=1, location=loc)
    ob = bpy.context.object
    ob.name = name
    return finish(ob, material, parent)


# ---------- Boden, Fluss, Strasse ----------
box("grass", (160, 80, 0.2), (0, 34, -0.1), GRASS)
box("pavement", (160, 6, 0.3), (0, -3.5, -0.05), PAVE)
box("road", (160, 5, 0.3), (0, -8.5, -0.1), ROAD)
box("promenade", (160, 3, 0.3), (0, -12.5, -0.05), PAVE)
box("quay_wall", (160, 0.5, 1.6), (0, -14.2, -0.2), STONE_D)
box("water", (300, 120, 0.1), (0, -74, -1.2), WATER)
for i in range(-10, 11):  # Mittelstreifen
    box("stripe", (2.0, 0.15, 0.02), (i * 5, -8.5, 0.06), PAVE)

# ---------- Turm ----------
box("tower_base", (5.2, 5.2, 2.0), (0, 0, 1.0), STONE_D)
box("tower_body", (4.2, 4.2, 17.0), (0, 0, 10.5), STONE)
for x in (-1.2, 0, 1.2):  # senkrechte Fensterbaender
    box("tower_slit", (0.45, 0.1, 13.0), (x, -2.12, 10.5), STONE_D)
    box("tower_slit", (0.1, 0.45, 13.0), (-2.12, x, 10.5), STONE_D)
    box("tower_slit", (0.1, 0.45, 13.0), (2.12, x, 10.5), STONE_D)
box("ledge1", (5.0, 5.0, 0.4), (0, 0, 19.0), GOLD)
box("clock_block", (4.9, 4.9, 4.8), (0, 0, 21.6), STONE)
box("ledge2", (5.3, 5.3, 0.4), (0, 0, 24.1), GOLD)
box("belfry", (4.0, 4.0, 2.0), (0, 0, 25.3), STONE_D)
for x in (-1.2, 0, 1.2):
    box("belfry_open", (0.6, 4.1, 1.3), (x, 0, 25.3), BLACK)
    box("belfry_open", (4.1, 0.6, 1.3), (0, x, 25.3), BLACK)
cone("roof", 3.6, 5.0, (0, 0, 28.8), ROOF)
box("lantern", (1.3, 1.3, 1.2), (0, 0, 31.2), GOLD)
cone("spire", 1.1, 3.6, (0, 0, 33.6), ROOF)
ball("finial", 0.28, (0, 0, 35.5), GOLD)
for sx in (-1, 1):
    for sy in (-1, 1):
        cone("pinnacle", 0.45, 1.6, (sx * 2.3, sy * 2.3, 25.1), GOLD)

# Zifferblaetter (vorn, links, rechts) mit Zeigern auf 10:10
H = math.pi / 2
for (dx, dy, rz) in ((0, -1, 0), (-1, 0, -H), (1, 0, H)):
    hub = bpy.data.objects.new("clock_hub", None)
    scene.collection.objects.link(hub)
    hub.location = (dx * 2.46, dy * 2.46, 21.6)
    hub.rotation_euler = (0, 0, rz)
    cyl("clock_rim", 2.15, 0.10, (0, 0, 0), GOLD, hub, rot=(H, 0, 0), verts=24)
    cyl("clock_face", 1.90, 0.12, (0, -0.03, 0), FACE, hub, rot=(H, 0, 0), verts=24)
    for k in range(12):
        a = k * math.pi / 6
        box("tick", (0.12, 0.05, 0.36), (math.sin(a) * 1.6, -0.11, math.cos(a) * 1.6), BLACK, hub, rot=(0, a, 0))
    a = math.radians(-60)  # Stundenzeiger auf 10
    box("hand_h", (0.20, 0.05, 1.0), (math.sin(a) * 0.5, -0.13, math.cos(a) * 0.5), BLACK, hub, rot=(0, a, 0))
    a = math.radians(60)  # Minutenzeiger auf 2
    box("hand_m", (0.13, 0.05, 1.5), (math.sin(a) * 0.75, -0.15, math.cos(a) * 0.75), BLACK, hub, rot=(0, a, 0))
    cyl("hand_cap", 0.16, 0.08, (0, -0.17, 0), GOLD, hub, rot=(H, 0, 0), verts=12)

# ---------- Parlament ----------
box("parl", (30, 6, 7), (17.5, 1, 3.5), STONE)
box("parl_roof", (30.4, 6.4, 0.5), (17.5, 1, 7.2), STONE_D)
for i in range(13):
    x = 4.5 + i * 2.2
    box("parl_win", (0.9, 0.1, 3.2), (x, -2.02, 3.8), WINDOW)
    if i % 3 == 0:
        box("parl_pier", (0.6, 0.6, 8.6), (x - 1.1, -2.1, 4.3), STONE_D)
        cone("parl_pin", 0.5, 1.4, (x - 1.1, -2.1, 9.3), GOLD)
box("parl_tower", (5, 5, 12), (30, 1.5, 6), STONE)
cone("parl_tower_roof", 3.9, 4, (30, 1.5, 14), ROOF)
box("wall_left", (26, 0.6, 2.0), (-16, -1.0, 1.0), STONE_D)
for i in range(9):
    box("wall_post", (0.8, 0.8, 2.6), (-4 - i * 3.0, -1.0, 1.3), STONE)

# ---------- Baeume und Laternen ----------
for i, x in enumerate((-26, -19, -12, -6, 7, 14, 21, 28)):
    cyl("trunk", 0.22, 2.2, (x, -4.2, 1.1), TRUNK, verts=8)
    ball("crown", 1.5, (x, -4.2, 3.2), LEAF if i % 2 else LEAF2)
    ball("crown2", 1.0, (x + 0.5, -4.4, 4.3), LEAF2 if i % 2 else LEAF)
for x in range(-30, 31, 10):
    cyl("lamp_post", 0.09, 3.2, (x + 3, -11.6, 1.6), BLACK, verts=8)
    ball("lamp", 0.32, (x + 3, -11.6, 3.4), LAMP)

# ---------- Doppeldeckerbus ----------
bus = bpy.data.objects.new("bus", None)
scene.collection.objects.link(bus)
box("bus_body", (7.0, 2.3, 3.6), (0, 0, 2.2), RED, bus)
box("bus_roof", (6.8, 2.1, 0.15), (0, 0, 4.05), mat("bus_roof", (0.95, 0.9, 0.85)), bus)
for z in (1.75, 3.25):
    box("bus_win", (6.2, 2.34, 0.75), (-0.1, 0, z), BUSWIN, bus)
    box("bus_win_front", (0.1, 1.9, 0.75), (3.5, 0, z), BUSWIN, bus)
for x in (-2.6, -1.3, 0.0, 1.3, 2.6):
    box("bus_pillar", (0.14, 2.38, 2.4), (x, 0, 2.5), RED, bus)
box("bus_band", (7.02, 2.36, 0.3), (0, 0, 2.5), RED, bus)
box("bus_sign", (0.1, 1.4, 0.35), (3.52, 0, 2.5), mat("sign", (1.0, 0.85, 0.2), emit=1.5), bus)
for x in (-2.3, 2.3):
    for y in (-1.1, 1.1):
        cyl("wheel", 0.55, 0.35, (x, y, 0.55), BLACK, bus, rot=(H, 0, 0), verts=14)
bus.location = (-30, -8.5, 0.05)
bus.keyframe_insert("location", frame=1)
bus.location = (34, -8.5, 0.05)
bus.keyframe_insert("location", frame=NFRAMES)

# ---------- Kamera: Bogen von unten/seitlich hinauf zum Zifferblatt ----------
target = bpy.data.objects.new("cam_target", None)
scene.collection.objects.link(target)
cam_data = bpy.data.cameras.new("cam")
cam_data.lens = 20
cam = bpy.data.objects.new("cam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
con = cam.constraints.new("TRACK_TO")
con.target = target
con.track_axis = "TRACK_NEGATIVE_Z"
con.up_axis = "UP_Y"


def lerp(a, b, t):
    return a + (b - a) * t


for f in range(1, NFRAMES + 1):
    t = (f - 1) / max(1, NFRAMES - 1)
    s = t * t * (3 - 2 * t)  # weiches An- und Abbremsen
    ang = math.radians(lerp(-122, -72, s))
    rad = lerp(46, 26, s)
    cam.location = (math.cos(ang) * rad, math.sin(ang) * rad, lerp(1.2, 9.0, s))
    target.location = (lerp(2.0, 0.0, s), 0, lerp(11.0, 19.5, s))
    cam.keyframe_insert("location", frame=f)
    target.keyframe_insert("location", frame=f)

# ---------- Licht und Himmel ----------
sun_data = bpy.data.lights.new("sun", "SUN")
sun_data.energy = 4.0
sun_data.color = (1.0, 0.86, 0.68)
sun_data.angle = math.radians(3)
sun = bpy.data.objects.new("sun", sun_data)
scene.collection.objects.link(sun)
sun.rotation_euler = (math.radians(58), 0, math.radians(-38))  # warm, von vorn links

world = bpy.data.worlds.new("sky")
scene.world = world
world.use_nodes = True
nt = world.node_tree
bg = nt.nodes["Background"]
bg.inputs["Strength"].default_value = 1.0
tc = nt.nodes.new("ShaderNodeTexCoord")
sep = nt.nodes.new("ShaderNodeSeparateXYZ")
ramp = nt.nodes.new("ShaderNodeValToRGB")
ramp.color_ramp.elements[0].position = 0.0
ramp.color_ramp.elements[0].color = (1.0, 0.80, 0.58, 1)  # warmer Horizont
ramp.color_ramp.elements[1].position = 0.55
ramp.color_ramp.elements[1].color = (0.30, 0.58, 0.95, 1)  # Blau oben
nt.links.new(tc.outputs["Generated"], sep.inputs[0])
nt.links.new(sep.outputs["Z"], ramp.inputs["Fac"])
nt.links.new(ramp.outputs["Color"], bg.inputs["Color"])

# ---------- Render-Einstellungen: Cycles auf CPU ----------
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = SAMPLES
scene.cycles.use_adaptive_sampling = False
scene.cycles.max_bounces = 3
scene.cycles.use_denoising = True
try:
    scene.cycles.denoiser = "OPENIMAGEDENOISE"
except Exception as e:  # Fallback, falls OIDN im Wheel fehlt
    print("OIDN nicht verfuegbar:", e)
    scene.cycles.use_denoising = False
scene.render.use_persistent_data = True
scene.render.threads_mode = "AUTO"
scene.render.resolution_x = RESX
scene.render.resolution_y = RESY
scene.render.resolution_percentage = 100
scene.render.fps = FPS
scene.render.image_settings.file_format = "PNG"
scene.view_settings.view_transform = "Standard"
scene.frame_start = 1
scene.frame_end = NFRAMES

os.makedirs(OUT, exist_ok=True)
t_all = time.time()
for f in range(F0, F1 + 1):
    t0 = time.time()
    scene.frame_set(f)
    scene.render.filepath = os.path.join(OUT, f"f{f:04d}.png")
    bpy.ops.render.render(write_still=True)
    print(f"BILD {f} fertig in {time.time() - t0:.2f} s", flush=True)
print(f"GESAMT {F1 - F0 + 1} Bilder in {time.time() - t_all:.1f} s", flush=True)
