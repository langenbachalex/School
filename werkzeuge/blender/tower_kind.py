"""Spielfigur fuer Keys of the Tower als bewegliche 3D-Figur (Probe 17.11.2026): ein Kind, ca. 1,40 m.

Aufruf:  blender -b --python werkzeuge/blender/tower_kind.py   ->  app/tower/figuren/kind.glb   (wenige Sekunden)

Die Figur besteht aus weichen Grundformen an Gelenken (leere Objekte mit festen Namen). Der Browser bewegt die Gelenke
selbst (Gehen, Stehen, Kopf drehen) – deshalb braucht die Datei keine Bewegungen und bleibt winzig.
Gelenke: wurzel > huefte > (bein_l > knie_l, bein_r > knie_r, rumpf > (arm_l > ellbogen_l, arm_r > ellbogen_r, kopf)).
Die Figur schaut nach -y (im Browser: nach vorn, +z). Links/rechts aus Sicht der Figur.
"""
import os

import bpy
from mathutils import Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(REPO, "app", "tower", "figuren")

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def farbe(name, rgb, rau=0.75):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rau
    return m


HAUT = farbe("haut", (0.80, 0.52, 0.38))
HAAR = farbe("haar", (0.16, 0.08, 0.04), 0.6)
PULLI = farbe("pulli", (0.78, 0.50, 0.08), 0.9)
HOSE = farbe("hose", (0.05, 0.08, 0.20), 0.85)
SCHUH = farbe("schuh", (0.22, 0.10, 0.05), 0.5)
SCHAL = farbe("schal", (0.62, 0.05, 0.06), 0.9)
AUGE = farbe("auge", (0.02, 0.015, 0.01), 0.2)
MUND = farbe("mund", (0.45, 0.12, 0.10), 0.6)
TASCHE = farbe("tasche", (0.30, 0.16, 0.07), 0.55)


def gelenk(name, eltern, ort):
    ob = bpy.data.objects.new(name, None)
    scene.collection.objects.link(ob)
    ob.parent = eltern
    ob.location = ort
    return ob


def _fertig(ob, name, eltern, ort, mass, material):
    ob.name = ob.data.name = name
    ob.data.transform(Matrix.Diagonal((*mass, 1)))
    for p in ob.data.polygons:
        p.use_smooth = True
    ob.data.materials.append(material)
    ob.parent = eltern
    ob.location = ort
    return ob


def kugel(name, eltern, ort, mass, material):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=24, ring_count=14)
    return _fertig(bpy.context.object, name, eltern, ort, mass, material)


def ring(name, eltern, ort, gross, dick, material):
    bpy.ops.mesh.primitive_torus_add(major_radius=gross, minor_radius=dick, major_segments=24, minor_segments=10)
    return _fertig(bpy.context.object, name, eltern, ort, (1, 1, 1), material)


wurzel = gelenk("wurzel", None, (0, 0, 0))
huefte = gelenk("huefte", wurzel, (0, 0, 0.56))
kugel("becken", huefte, (0, 0, 0.02), (0.15, 0.115, 0.11), HOSE)
for seite, v in (("l", 1), ("r", -1)):
    bein = gelenk("bein_" + seite, huefte, (0.078 * v, 0, 0))
    kugel("oberschenkel_" + seite, bein, (0, 0, -0.13), (0.072, 0.078, 0.165), HOSE)
    knie = gelenk("knie_" + seite, bein, (0, 0, -0.26))
    kugel("unterschenkel_" + seite, knie, (0, 0, -0.12), (0.058, 0.064, 0.155), HOSE)
    kugel("schuh_" + seite, knie, (0, -0.045, -0.262), (0.066, 0.118, 0.05), SCHUH)

rumpf = gelenk("rumpf", huefte, (0, 0, 0.05))
kugel("koerper", rumpf, (0, 0, 0.17), (0.168, 0.125, 0.225), PULLI)
ring("schal", rumpf, (0, 0, 0.375), 0.082, 0.036, SCHAL)
kugel("schal_ende", rumpf, (0.07, -0.105, 0.27), (0.035, 0.02, 0.10), SCHAL)
kugel("tasche", rumpf, (-0.185, 0.0, -0.02), (0.045, 0.095, 0.085), TASCHE)
for seite, v in (("l", 1), ("r", -1)):
    arm = gelenk("arm_" + seite, rumpf, (0.178 * v, 0, 0.30))
    kugel("oberarm_" + seite, arm, (0.018 * v, 0, -0.10), (0.052, 0.054, 0.13), PULLI)
    ell = gelenk("ellbogen_" + seite, arm, (0.028 * v, 0, -0.205))
    kugel("unterarm_" + seite, ell, (0, 0, -0.09), (0.044, 0.046, 0.115), PULLI)
    kugel("hand_" + seite, ell, (0, 0, -0.205), (0.047, 0.047, 0.05), HAUT)

kopf = gelenk("kopf", rumpf, (0, 0, 0.42))
kugel("gesicht", kopf, (0, 0, 0.17), (0.18, 0.172, 0.18), HAUT)
kugel("haare", kopf, (0, 0.036, 0.205), (0.19, 0.178, 0.178), HAAR)
kugel("pony", kopf, (0.03, -0.115, 0.305), (0.13, 0.07, 0.05), HAAR)
for v in (1, -1):
    kugel("auge", kopf, (0.066 * v, -0.158, 0.185), (0.021, 0.014, 0.026), AUGE)
    kugel("ohr", kopf, (0.176 * v, 0.0, 0.165), (0.022, 0.03, 0.038), HAUT)
kugel("nase", kopf, (0, -0.176, 0.145), (0.02, 0.018, 0.018), HAUT)
kugel("mund", kopf, (0, -0.163, 0.092), (0.036, 0.008, 0.011), MUND)

os.makedirs(OUT, exist_ok=True)
ziel = os.path.join(OUT, "kind.glb")
bpy.ops.export_scene.gltf(filepath=ziel, export_format="GLB", export_cameras=False, export_lights=False,
                          export_animations=False, export_yup=True)
print(f"KIND fertig: {os.path.getsize(ziel) / 1000:.0f} KB – {ziel}", flush=True)
