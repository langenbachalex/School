"""Gary the Great (Fuchs mit Zauberhut) fuer die Figuren-Probe 17.11.2026 – drei Arten nebeneinander.

Aufruf:  blender -b --python werkzeuge/blender/tower_gary.py      (wenige Sekunden)
Ausgabe in app/tower/figuren/:
  gary1.glb       Art 1: ganze Figur per Skript, an benannten Gelenken (wie kind.glb); der Browser bewegt die Gelenke.
  gary_teile.glb  Fuchskopf mit Hut ("fuchskopf") und Schwanz ("fuchsschwanz") als Einzelteile. Die Probe-Seite steckt sie
                  auf die Grundfiguren von Art 2 (Mixamo) und Art 3 (KayKit) – so wie spaeter Kleidung im Baukasten.
Formen und Farben wie in tower_figuren.gary(). Die Figur schaut nach -y (im Browser nach vorn, +z).
"""
import math
import os

import bpy
from mathutils import Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(REPO, "app", "tower", "figuren")
R = math.radians
_mats = {}


def farbe(name, rgb, rau=0.8, metall=0.0, leuchten=0.0):
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rau
    b.inputs["Metallic"].default_value = metall
    if leuchten:
        b.inputs["Emission Color"].default_value = (*rgb, 1)
        b.inputs["Emission Strength"].default_value = leuchten
    _mats[name] = m
    return m


def gelenk(name, eltern, ort):
    ob = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(ob)
    ob.parent = eltern
    ob.location = ort
    return ob


def _fertig(ob, name, eltern, ort, mass, material, dreh):
    ob.name = ob.data.name = name
    ob.data.transform(Matrix.Diagonal((*mass, 1)))
    for p in ob.data.polygons:
        p.use_smooth = True
    ob.data.materials.append(material)
    ob.parent = eltern
    ob.location = ort
    ob.rotation_euler = dreh
    return ob


def kugel(name, eltern, ort, mass, material, dreh=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=24, ring_count=14)
    return _fertig(bpy.context.object, name, eltern, ort, mass, material, dreh)


def kegel(name, eltern, ort, r, hoehe, material, dreh=(0, 0, 0), r2=0.0):
    bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r2, depth=hoehe, vertices=24)
    return _fertig(bpy.context.object, name, eltern, ort, (1, 1, 1), material, dreh)


def ring(name, eltern, ort, gross, dick, material, dreh=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=gross, minor_radius=dick, major_segments=24, minor_segments=10)
    return _fertig(bpy.context.object, name, eltern, ort, (1, 1, 1), material, dreh)


def stab(name, eltern, ort, r, laenge, material, dreh=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=laenge, vertices=12)
    return _fertig(bpy.context.object, name, eltern, ort, (1, 1, 1), material, dreh)


def farben():
    return dict(
        orange=farbe("fuchs_orange", (0.80, 0.32, 0.07), 0.9), weiss=farbe("fuchs_weiss", (0.93, 0.90, 0.84), 0.9),
        schwarz=farbe("fuchs_schwarz", (0.03, 0.025, 0.02), 0.8), hut=farbe("hut_stoff", (0.10, 0.06, 0.30), 0.85),
        gold=farbe("gold", (1.0, 0.72, 0.18), 0.3, 1.0), stern=farbe("stern", (1.0, 0.85, 0.35), 0.4, 0.0, 2.5),
        auge=farbe("auge_weiss", (0.95, 0.95, 0.92), 0.2), pupille=farbe("pupille", (0.02, 0.015, 0.01), 0.1),
        holz=farbe("zauberstab", (0.05, 0.04, 0.04), 0.3))


def fuchskopf(eltern, ort=(0, 0, 0), name="fuchskopf"):
    """Kopf mit Hut; Ursprung am Halsansatz, Kopfmitte 17 cm darueber."""
    f = farben()
    k = gelenk(name, eltern, ort)
    kugel("kopf_rund", k, (0, -0.02, 0.17), (0.185, 0.162, 0.157), f["orange"])
    for s in (-1, 1):
        kegel("backe", k, (s * 0.17, -0.02, 0.115), 0.085, 0.20, f["orange"], (0, R(s * 112), 0))
        kegel("ohr", k, (s * 0.150, 0.01, 0.355), 0.082, 0.27, f["orange"], (R(-4), R(s * 24), 0))
        kegel("innenohr", k, (s * 0.150, -0.022, 0.345), 0.048, 0.19, f["weiss"], (R(4), R(s * 24), 0))
        kegel("ohrspitze", k, (s * 0.196, 0.003, 0.464), 0.028, 0.085, f["schwarz"], (R(-4), R(s * 24), 0))
        kugel("wange", k, (s * 0.06, -0.125, 0.098), (0.046, 0.038, 0.029), f["weiss"])
        kugel("auge", k, (s * 0.074, -0.152, 0.225), (0.040, 0.026, 0.049), f["auge"])
        kugel("pupille", k, (s * 0.070, -0.178, 0.222), (0.024, 0.012, 0.028), f["pupille"])
        kugel("braue", k, (s * 0.080, -0.152, 0.288), (0.044, 0.012, 0.0085), f["schwarz"], (0, R(s * -14), 0))
        kugel("mund", k, (s * 0.028, -0.262, 0.092), (0.029, 0.012, 0.0066), f["schwarz"], (0, R(s * -22), R(s * 30)))
    kugel("nasenruecken", k, (0, -0.165, 0.165), (0.051, 0.102, 0.036), f["orange"])
    kugel("schnauze", k, (0, -0.185, 0.122), (0.068, 0.119, 0.049), f["weiss"])
    kugel("nase", k, (0, -0.298, 0.145), (0.0375, 0.027, 0.0255), f["pupille"])
    # Zauberhut zwischen den Ohren: hoher Kegel mit geknickter Spitze, Krempe, goldenes Band, Sterne
    kegel("hut", k, (0, 0.0, 0.51), 0.115, 0.42, f["hut"], (R(-6), 0, 0), r2=0.045)
    kegel("hutspitze", k, (0.035, 0.03, 0.79), 0.05, 0.22, f["hut"], (R(-12), R(28), 0))
    kugel("krempe", k, (0, 0.01, 0.315), (0.165, 0.165, 0.015), f["hut"], (R(-6), 0, 0))
    ring("hutband", k, (0, 0.005, 0.345), 0.112, 0.016, f["gold"], (R(-6), 0, 0))
    for w, z, r in ((R(-70), 0.44, 0.02), (R(-110), 0.56, 0.016), (R(-55), 0.63, 0.013), (R(-125), 0.39, 0.014), (R(-88), 0.69, 0.011)):
        rad = 0.115 - (z - 0.31) * 0.17
        kugel("stern", k, (math.cos(w) * rad, math.sin(w) * rad - 0.014, z), (r, r * 0.35, r), f["stern"])
    kugel("hutkugel", k, (0.085, 0.045, 0.895), (0.028, 0.028, 0.028), f["gold"])
    return k


def fuchsschwanz(eltern, ort=(0, 0, 0), name="fuchsschwanz"):
    """Buschiger Schwanz nach hinten oben; Ursprung an der Wurzel. Der Browser laesst ihn wedeln."""
    f = farben()
    s = gelenk(name, eltern, ort)
    for i in range(12):
        t = i / 11
        r = 0.05 + 0.075 * math.sin(math.pi * (0.12 + 0.88 * t) ** 0.85)
        kugel("schwanz", s, (0.03 * math.sin(t * math.pi), 0.04 + 0.30 * t ** 0.8, 0.50 * t ** 1.5),
              (max(0.035, r),) * 3, f["weiss"] if i >= 10 else f["orange"])
    return s


def neu():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _mats.clear()


def ausgabe(datei):
    os.makedirs(OUT, exist_ok=True)
    ziel = os.path.join(OUT, datei)
    bpy.ops.export_scene.gltf(filepath=ziel, export_format="GLB", export_cameras=False, export_lights=False,
                              export_animations=False, export_yup=True)
    print(f"GARY {datei}: {os.path.getsize(ziel) / 1000:.0f} KB", flush=True)


# ---------- Art 1: ganze Figur per Skript, Gelenke wie bei kind.glb ----------
neu()
f = farben()
wurzel = gelenk("wurzel", None, (0, 0, 0))
huefte = gelenk("huefte", wurzel, (0, 0, 0.345))
kugel("becken", huefte, (0, 0.01, 0), (0.19, 0.17, 0.165), f["orange"])
for seite, v in (("l", 1), ("r", -1)):
    bein = gelenk("bein_" + seite, huefte, (0.10 * v, 0, -0.05))
    kugel("oberschenkel", bein, (0, 0, -0.07), (0.07, 0.075, 0.10), f["orange"])
    knie = gelenk("knie_" + seite, bein, (0, 0, -0.13))
    kugel("unterschenkel", knie, (0, 0, -0.055), (0.06, 0.065, 0.085), f["orange"])
    kugel("fuss", knie, (0, -0.05, -0.125), (0.062, 0.105, 0.04), f["schwarz"])
rumpf = gelenk("rumpf", huefte, (0, 0, 0.04))
kugel("brust", rumpf, (0, 0, 0.13), (0.17, 0.15, 0.23), f["orange"])
kugel("latz", rumpf, (0, -0.085, 0.14), (0.105, 0.08, 0.17), f["weiss"])
kugel("hals", rumpf, (0, -0.01, 0.33), (0.075, 0.068, 0.08), f["orange"])
for seite, v in (("l", 1), ("r", -1)):
    arm = gelenk("arm_" + seite, rumpf, (0.165 * v, 0, 0.25))
    kugel("oberarm", arm, (0.015 * v, 0, -0.085), (0.045, 0.045, 0.105), f["orange"])
    ell = gelenk("ellbogen_" + seite, arm, (0.02 * v, 0, -0.17))
    kugel("unterarm", ell, (0, 0, -0.075), (0.038, 0.038, 0.09), f["orange"])
    kugel("pfote", ell, (0, 0, -0.165), (0.045, 0.045, 0.045), f["schwarz"])
    if seite == "r":   # Zauberstab in der rechten Pfote
        stab("zauberstab", ell, (0, -0.13, -0.15), 0.011, 0.34, f["holz"], (R(98), 0, 0))
        kugel("funke", ell, (0, -0.30, -0.125), (0.022, 0.022, 0.022), f["stern"])
fuchskopf(rumpf, (0, 0, 0.40), name="kopf")
fuchsschwanz(huefte, (0, 0.13, 0.02), name="schwanz")
ausgabe("gary1.glb")

# ---------- Einzelteile fuer Art 2 und 3 ----------
neu()
fuchskopf(None)
fuchsschwanz(None)
ausgabe("gary_teile.glb")
