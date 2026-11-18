"""Gary the Great (Fuchs mit Zauberhut): Kopf und Schwanz fuer den KayKit-Koerper (Block A, 17.11.2026).

Aufruf:  blender -b --python werkzeuge/blender/tower_gary.py      (wenige Sekunden)
Ausgabe: app/tower/figuren/gary_teile.glb mit Fuchskopf samt Hut ("fuchskopf") und Schwanz ("fuchsschwanz").
Der Browser (app/tower/probe3d_figuren.js) steckt beides auf den Koerper figuren/koerper_mage.glb – so wie spaeter Kleidung.
Die ganze Figur per Skript (Art 1 der Probe, gary1.glb) ist seit der Entscheidung vom 17.11. entfallen; sie steht in der Git-Geschichte.
Formen und Farben wie in tower_figuren.gary(). Die Teile schauen nach -y (im Browser nach vorn, +z).
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


def kugel(name, eltern, ort, mass, material, dreh=(0, 0, 0), fein=24):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=fein, ring_count=max(4, fein * 7 // 12))
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


def oben(ob):
    """Ursprung an die Oberkante legen: der Browser macht das Teil dann nur hoeher oder flacher (Lid schliesst, Mund oeffnet nach unten)."""
    h = max(v.co.z for v in ob.data.vertices)
    ob.data.transform(Matrix.Translation((0, 0, -h)))
    ob.location.z += h
    return ob


def unten(ob):
    """Ursprung an die Unterkante legen (Unterlid: schiebt sich von unten ueber das Auge – lachende Augen)."""
    t = min(v.co.z for v in ob.data.vertices)
    ob.data.transform(Matrix.Translation((0, 0, -t)))
    ob.location.z += t
    return ob


def bogen(name, eltern, linien, r, material, ursprung=None):
    """Glatte runde Straenge durch die Punkte (Kurve mit Dicke, in ein Netz umgewandelt). linien = eine Punktliste oder mehrere;
    der Ursprung liegt am ersten Punkt oder an `ursprung` (dort dreht und waechst das Teil im Browser)."""
    if not isinstance(linien[0][0], (tuple, list)):
        linien = [linien]
    u = ursprung or linien[0][0]
    kurve = bpy.data.curves.new(name + "_kurve", "CURVE")
    kurve.dimensions = "3D"
    kurve.bevel_depth = r
    kurve.bevel_resolution = 2
    kurve.use_fill_caps = True
    for punkte in linien:
        linie = kurve.splines.new("POLY")
        linie.points.add(len(punkte) - 1)
        for pt, q in zip(linie.points, punkte):
            pt.co = (q[0] - u[0], q[1] - u[1], q[2] - u[2], 1)
    vor = bpy.data.objects.new(name + "_vor", kurve)
    bpy.context.scene.collection.objects.link(vor)
    netz = bpy.data.meshes.new_from_object(vor.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    bpy.data.objects.remove(vor)
    ob = bpy.data.objects.new(name, netz)
    bpy.context.scene.collection.objects.link(ob)
    for fl in netz.polygons:
        fl.use_smooth = True
    netz.materials.append(material)
    ob.parent = eltern
    ob.location = u
    return ob


def farben():
    return dict(
        orange=farbe("fuchs_orange", (0.80, 0.32, 0.07), 0.9), weiss=farbe("fuchs_weiss", (0.93, 0.90, 0.84), 0.9),
        schwarz=farbe("fuchs_schwarz", (0.03, 0.025, 0.02), 0.8), hut=farbe("hut_stoff", (0.10, 0.06, 0.30), 0.85),
        gold=farbe("gold", (1.0, 0.72, 0.18), 0.3, 1.0), stern=farbe("stern", (1.0, 0.85, 0.35), 0.4, 0.0, 2.5),
        auge=farbe("auge_weiss", (0.95, 0.95, 0.92), 0.2), pupille=farbe("pupille", (0.02, 0.015, 0.01), 0.1),
        holz=farbe("zauberstab", (0.02, 0.02, 0.025), 0.35), stabweiss=farbe("stab_weiss", (0.95, 0.94, 0.90), 0.4),
        rachen=farbe("rachen", (0.20, 0.03, 0.05), 0.7), creme=farbe("fuchs_creme", (1.0, 0.93, 0.78), 0.85, 0.0, 0.28),
        augenweiss=farbe("augenweiss", (1.0, 1.0, 0.97), 0.25, 0.0, 0.4), glanz=farbe("glanz", (1.0, 1.0, 1.0), 0.2, 0.0, 2.0),
        zunge=farbe("zunge", (0.95, 0.42, 0.45), 0.6, 0.0, 0.15), zahn=farbe("zahn", (1.0, 1.0, 0.96), 0.3, 0.0, 0.35))


def fuchskopf(eltern, ort=(0, 0, 0), name="fuchskopf"):
    """Kopf mit Hut; Ursprung am Halsansatz, Kopfmitte 17 cm darueber.
    Bewegliche Gesichtsteile (Namen gelten fuer alle Koepfe, der Browser bewegt sie): braue_l/r, lid_l/r, unterlid_l/r, pupille_l/r,
    wange_l/r, ohr_l/r, mund (Mundhoehle, Ursprung oben), kiefer (mit Zunge), laecheln (hochgezogene Mundwinkel)."""
    f = farben()
    k = gelenk(name, eltern, ort)
    kugel("kopf_rund", k, (0, -0.02, 0.17), (0.185, 0.162, 0.157), f["orange"])
    for s, seite in ((-1, "r"), (1, "l")):
        kegel("backe", k, (s * 0.17, -0.02, 0.115), 0.085, 0.20, f["orange"], (0, R(s * 112), 0))
        # Ohr als eigenes Gelenk am Ansatz: stellt sich bei Freude auf
        ansatz = (s * 0.095, 0.004, 0.232)
        ohr = gelenk("ohr_" + seite, k, ansatz)
        for teil, pos, r, h, farbname, dreh in (("ohr", (s * 0.150, 0.01, 0.355), 0.082, 0.27, "orange", (R(-4), R(s * 24), 0)),
                                                ("innenohr", (s * 0.150, -0.022, 0.345), 0.048, 0.19, "creme", (R(4), R(s * 24), 0)),
                                                ("ohrspitze", (s * 0.196, 0.003, 0.464), 0.028, 0.085, "schwarz", (R(-4), R(s * 24), 0))):
            kegel(teil, ohr, tuple(a - b for a, b in zip(pos, ansatz)), r, h, f[farbname], dreh)
        # Wangenpolster neben der Schnauze: schieben sich beim Laecheln nach oben gegen die Augen
        kugel("wange_" + seite, k, (s * 0.092, -0.118, 0.128), (0.058, 0.052, 0.046), f["creme"])
        # Auge: Augenweiss, kleine Pupille mit Glanzpunkt (vom Betrachter aus oben links)
        kugel("auge", k, (s * 0.074, -0.152, 0.214), (0.043, 0.028, 0.050), f["augenweiss"])
        pupille = kugel("pupille_" + seite, k, (s * 0.071, -0.178, 0.212), (0.019, 0.011, 0.023), f["pupille"])
        kugel("glanz", pupille, (-0.0065, -0.008, 0.0085), (0.0062, 0.004, 0.0062), f["glanz"])
        # Braue: Bogen mit Abstand ueber dem Auge, aussen leicht hoeher
        bz = [(s * (0.030 + 0.090 * t), -0.176 + 0.050 * t ** 1.6, 0.276 + 0.018 * (1 - (2 * t - 0.9) ** 2) + 0.006 * t) for t in [i / 8 for i in range(9)]]
        bogen("braue_" + seite, k, bz, 0.0078, f["schwarz"], ursprung=(s * 0.075, -0.160, 0.290))
        oben(kugel("lid_" + seite, k, (s * 0.074, -0.152, 0.214), (0.047, 0.045, 0.054), f["orange"]))
        unten(kugel("unterlid_" + seite, k, (s * 0.074, -0.150, 0.214), (0.047, 0.037, 0.054), f["orange"]))
    # Schnauze (cremeweiss) und Unterkiefer; dazwischen oeffnet sich der Mund breit, mit Zahnreihe oben und Zunge unten
    kugel("nasenruecken", k, (0, -0.165, 0.170), (0.051, 0.102, 0.036), f["orange"])
    kugel("schnauze", k, (0, -0.185, 0.130), (0.078, 0.119, 0.044), f["creme"])
    kugel("nase", k, (0, -0.298, 0.152), (0.0375, 0.027, 0.0255), f["pupille"])
    zaehne = []
    for i in range(11):
        x = (i - 5) / 5 * 0.058
        zaehne.append((x, -0.185 - 0.112 * max(0.05, 1 - (x / 0.078) ** 2) ** 0.5, 0.098))
    bogen("zaehne", k, zaehne, 0.0075, f["zahn"])
    oben(kugel("mund", k, (0, -0.212, 0.064), (0.066, 0.086, 0.038), f["rachen"]))
    kiefer = kugel("kiefer", k, (0, -0.196, 0.094), (0.070, 0.104, 0.024), f["creme"])
    kugel("zunge", kiefer, (0, -0.040, 0.019), (0.036, 0.052, 0.012), f["zunge"])
    # hochgezogene Mundwinkel fuer das Laecheln: von den Seiten der Schnauze spitz nach oben bis unter die Augenmitte (sonst unsichtbar)
    winkel = []
    for s in (-1, 1):
        winkel.append([(s * (0.030 + 0.052 * t), -0.292 + 0.150 * t ** 1.5, 0.098 + 0.062 * t ** 2.2) for t in [i / 10 for i in range(11)]])
    bogen("laecheln", k, winkel, 0.0070, f["schwarz"], ursprung=(0, -0.25, 0.10))
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


def zauberstab(eltern, ort=(0, 0, 0), name="zauberstab"):
    """Buehnen-Zauberstab, schwarz mit weissen Enden, in den Massen des KayKit-Handplatzes (Griff im Ursprung, Spitze nach oben).
    Der Browser haengt ihn ohne Umrechnen an den Knochen "handslot.r"; "stabspitze" ist der Ort fuer die Funken."""
    f = farben()
    s = gelenk(name, eltern, ort)
    stab("stab_schwarz", s, (0, 0, 0.24), 0.042, 0.56, f["holz"])
    stab("stab_ende_unten", s, (0, 0, -0.10), 0.045, 0.13, f["stabweiss"])
    stab("stab_ende_oben", s, (0, 0, 0.58), 0.045, 0.13, f["stabweiss"])
    gelenk("stabspitze", s, (0, 0, 0.65))
    return s


def pruefbilder(datei):
    """Selbstpruefung (Regel 18.11.): kleine Bilder aus festen Kameras ohne Fenster rechnen, dazu Pruefzahlen ausgeben."""
    import bmesh
    dreiecke = 0
    for ob in bpy.context.scene.objects:
        if ob.type == "MESH":
            bm = bmesh.new(); bm.from_mesh(ob.data); dreiecke += len(bm.calc_loop_triangles()); bm.free()
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"; sc.cycles.samples = 24; sc.cycles.device = "CPU"
    sc.render.resolution_x = sc.render.resolution_y = 420
    sc.world = bpy.data.worlds.new("hell"); sc.world.use_nodes = True
    sc.world.node_tree.nodes["Background"].inputs[0].default_value = (0.55, 0.5, 0.45, 1)
    sonne = bpy.data.objects.new("sonne", bpy.data.lights.new("sonne", "SUN")); sonne.data.energy = 3; sonne.rotation_euler = (R(55), 0, R(-30)); sc.collection.objects.link(sonne)
    kam = bpy.data.objects.new("kamera", bpy.data.cameras.new("kamera")); sc.collection.objects.link(kam); sc.camera = kam
    kam.data.lens = 70
    ziel = os.path.join(REPO, "werkzeuge", "blender", "frames")
    os.makedirs(ziel, exist_ok=True)
    for blick, ort in (("vorn", (0, -3.2, 0.42)), ("schraeg", (2.3, -2.3, 0.6)), ("seite", (3.2, 0, 0.42))):
        kam.location = ort
        kam.rotation_euler = (Matrix.Translation(ort).inverted() @ Matrix.Identity(4)).to_euler()
        richtung = Matrix.Translation((0, 0, 0.42)).translation - kam.location
        kam.rotation_euler = richtung.to_track_quat("-Z", "Y").to_euler()
        sc.render.filepath = os.path.join(ziel, f"pruef_{datei}_{blick}.png")
        bpy.ops.render.render(write_still=True)
    for ob in (sonne, kam):
        bpy.data.objects.remove(ob)
    print(f"PRUEF {datei}: {dreiecke} Dreiecke", flush=True)


def neu():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _mats.clear()


def ausgabe(datei):
    os.makedirs(OUT, exist_ok=True)
    ziel = os.path.join(OUT, datei)
    bpy.ops.export_scene.gltf(filepath=ziel, export_format="GLB", export_cameras=False, export_lights=False,
                              export_animations=False, export_yup=True)
    print(f"GARY {datei}: {os.path.getsize(ziel) / 1000:.0f} KB", flush=True)


# ---------- Kopf und Schwanz als Einzelteile ----------
neu()
fuchskopf(None)
fuchsschwanz(None)
zauberstab(None, (0.9, 0, 0.15))
ausgabe("gary_teile.glb")
pruefbilder("gary_teile")
