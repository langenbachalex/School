"""Guard Room als echtes 3D fuer den Browser (Probe 17.11.2026).

Aufruf ueber guardroom.py mit GLTF=1 (baut den Raum wie immer, rechnet dann aber kein Bild):
    GLTF=1 blender -b --python werkzeuge/blender/guardroom.py
    GLTF=1 GLTF_KLEIN=1 ...   = schneller Probelauf (kleine Texturen, wenig Strahlen)

Was passiert:
  1. Alle Teile eines Gegenstands werden zu einem Objekt verbunden (Name = Kennung, z. B. "uhr");
     der Rest des Raums wird zu "raum_gross" (Waende, Boden), "raum_decke" (Decke, Balken) und "raum_klein" (Moebel, Kleinteile).
  2. Jedes Objekt bekommt eine eigene Abwicklung, und Cycles brennt Licht, Schatten und Farbe
     in EINE Textur je Objekt ein. Im Browser muss dann kein Licht mehr gerechnet werden.
  3. Ausgabe: werkzeuge/blender/quellen/guardroom_roh.glb (Rohdatei) und app/tower/raum3d/guardroom3d.json (Kamera, Dinge).
  4. Danach "node werkzeuge/raum_verkleinern.js": macht daraus app/tower/raum3d/guardroom.glb (Bilder 2048 und WebP, Formen komprimiert).
  GERAET=GPU brennt auf der Grafikkarte ein (AlexPC: Radeon RX 6500 XT ueber HIP); ohne die Angabe rechnet der Prozessor.
"""
import json
import math
import os
import time

import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
OUT = os.environ.get("OUT3D", os.path.join(REPO, "app", "tower", "raum3d"))
KLEIN = os.environ.get("GLTF_KLEIN") == "1"
PX_RAUM = int(os.environ.get("PX_RAUM", 1024 if KLEIN else 4096))
PX_DING = int(os.environ.get("PX_DING", 256 if KLEIN else 1024))
SAMPLES = int(os.environ.get("SAMPLES3D", 4 if KLEIN else 32))
MAX_DREIECKE = {"raum": 150000, "ding": 30000}   # mehr wird vor dem Einbrennen vereinfacht


def _waehle(obs):
    bpy.ops.object.select_all(action="DESELECT")
    for o in obs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = obs[0]


def _dreiecke(ob):
    return sum(len(p.vertices) - 2 for p in ob.data.polygons)


def _gehkarte(scene, zelle=0.125, rand=2):
    """Wo kann die Figur stehen? Raster ueber den Boden: frei ist eine Zelle, wenn von 1,7 m Hoehe nach unten
    zuerst der Boden kommt (kein Tisch, Stuhl, Kamin, Treppenloch). Hindernisse werden um die Figurbreite vergroessert."""
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    raum = scene.objects["raum_gross"]
    ecken = [raum.matrix_world @ Vector(e) for e in raum.bound_box]
    x0, x1 = min(e.x for e in ecken), max(e.x for e in ecken)
    y0, y1 = min(e.y for e in ecken), max(e.y for e in ecken)
    nx, ny = int((x1 - x0) / zelle), int((y1 - y0) / zelle)
    frei = [[False] * nx for _ in range(ny)]
    for j in range(ny):
        for i in range(nx):
            hit, ort, *_ = scene.ray_cast(dg, Vector((x0 + (i + 0.5) * zelle, y0 + (j + 0.5) * zelle, 1.7)), Vector((0, 0, -1)))
            frei[j][i] = bool(hit) and -0.05 < ort.z < 0.06
    for _ in range(rand):
        alt = [z[:] for z in frei]
        for j in range(ny):
            for i in range(nx):
                if alt[j][i] and not all(0 <= j + dj < ny and 0 <= i + di < nx and alt[j + dj][i + di]
                                         for dj in (-1, 0, 1) for di in (-1, 0, 1)):
                    frei[j][i] = False
    return {"x0": round(x0, 4), "y0": round(y0, 4), "zelle": zelle,
            "zeilen": ["".join("1" if f else "0" for f in z) for z in frei]}


def ausgeben(scene, cam, ziel, dinge):
    t0 = time.time()
    os.makedirs(OUT, exist_ok=True)
    tmp = os.path.join(HERE, "frames", "bake")
    os.makedirs(tmp, exist_ok=True)
    bpy.context.view_layer.update()
    kamera = {"ort": list(cam.matrix_world.translation), "ziel": list(ziel.matrix_world.translation),
              "brennweite": cam.data.lens, "sensor": cam.data.sensor_width}

    lichter = [{"name": o.name, "ort": [round(v, 3) for v in o.matrix_world.translation], "farbe": list(o.data.color), "watt": o.data.energy}
               for o in scene.objects if o.type == "LIGHT" and o.data.type == "POINT"]

    # ---- 1. alles zu Gittern machen, Eltern loesen, je Gegenstand verbinden ----
    for o in scene.objects:                # Lichter heissen z. T. wie Gegenstaende ("laterne"): Namen freimachen
        if o.type not in ("MESH", "FONT", "CURVE"):
            o.name = "x_" + o.name
    for o in list(scene.objects):
        if o.type in ("MESH", "FONT", "CURVE") and o.hide_render:
            bpy.data.objects.remove(o)
    geo = [o for o in scene.objects if o.type in ("MESH", "FONT", "CURVE")]
    for o in geo:
        o.hide_set(False)
        o.hide_select = False
    _waehle(geo)
    bpy.ops.object.convert(target="MESH")
    geo = [o for o in scene.objects if o.type == "MESH" and len(o.data.polygons)]
    _waehle(geo)
    bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")

    gruppen = {}
    for o in geo:
        if o.name.startswith(("decke", "balken", "laengsbalken")):
            g = "raum_decke"                 # eigene Gruppe: die Puppenhaus-Kamera blendet die Decke aus
        else:
            g = o.get("gruppe") or ("raum_gross" if max(o.dimensions) > 2.5 else "raum_klein")
        gruppen.setdefault(g, []).append(o)
    objekte = []
    for g, obs in gruppen.items():
        _waehle(obs)
        if len(obs) > 1:
            bpy.ops.object.join()
        ob = bpy.context.view_layer.objects.active
        ob.name = ob.data.name = g
        ob["gruppe"] = g
        objekte.append(ob)
    for o in list(scene.objects):          # Lichter bleiben (zum Einbrennen), leere Helfer koennen weg
        if o.type == "EMPTY" and o is not ziel:
            bpy.data.objects.remove(o)

    gehkarte = _gehkarte(scene)

    # ---- 2. vereinfachen (nur wenn noetig), abwickeln, einbrennen ----
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    if os.environ.get("GERAET") == "GPU":          # Einbrennen auf der Grafikkarte (AlexPC: Radeon ueber HIP, HIP RT bleibt aus); Standard bleibt der Prozessor
        cp = bpy.context.preferences.addons["cycles"].preferences
        cp.compute_device_type = "HIP"
        cp.refresh_devices()
        if hasattr(cp, "use_hiprt"):
            cp.use_hiprt = False
        karten = [d for d in cp.devices if d.type == "HIP"]
        for d in cp.devices:
            d.use = d.type == "HIP"
        if karten:
            scene.cycles.device = "GPU"
        print("GERAET", scene.cycles.device, [d.name for d in karten], flush=True)
    scene.cycles.samples = SAMPLES
    scene.cycles.max_bounces = 5
    scene.cycles.use_denoising = True
    try:
        scene.view_settings.view_transform = "AgX"
        scene.view_settings.look = "AgX - Medium High Contrast"
    except Exception as e:
        print("Farbabstimmung AgX nicht gesetzt:", e, flush=True)
    scene.render.image_settings.file_format = "JPEG"
    scene.render.image_settings.quality = 88
    scene.render.image_settings.color_mode = "RGB"
    bake = scene.render.bake
    bake.margin = 6
    bake.use_clear = True

    bericht = []
    for ob in sorted(objekte, key=lambda o: o.name):
        t1 = time.time()
        raum = ob.name.startswith("raum_")
        px = (PX_RAUM // 2 if ob.name == "raum_decke" else PX_RAUM) if raum else PX_DING
        _waehle([ob])
        vorher = _dreiecke(ob)
        grenze = MAX_DREIECKE["raum" if raum else "ding"]
        if vorher > grenze:
            m = ob.modifiers.new("einfacher", "DECIMATE")
            m.ratio = grenze / vorher
            bpy.ops.object.modifier_apply(modifier=m.name)
        lage = ob.data.uv_layers.new(name="licht")
        ob.data.uv_layers.active = lage
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.004)
        try:
            bpy.ops.uv.average_islands_scale()
            bpy.ops.uv.pack_islands(margin=0.004)
        except Exception as e:
            print(f"  {ob.name}: Inseln nicht neu gepackt ({e})", flush=True)
        bpy.ops.object.mode_set(mode="OBJECT")

        bild = bpy.data.images.new("licht_" + ob.name, px, px, alpha=False, float_buffer=True)
        if not ob.data.materials:
            ob.data.materials.append(bpy.data.materials.new("leer"))
        for i, mt in enumerate(ob.data.materials):
            if mt is None:
                mt = ob.data.materials[i] = bpy.data.materials.new("leer")
            mt.use_nodes = True
            kn = mt.node_tree.nodes.get("LICHT_BAKE") or mt.node_tree.nodes.new("ShaderNodeTexImage")
            kn.name = "LICHT_BAKE"
            kn.image = bild
            for n in mt.node_tree.nodes:
                n.select = False
            kn.select = True
            mt.node_tree.nodes.active = kn
        bpy.ops.object.bake(type="COMBINED")
        pfad = os.path.join(tmp, ob.name + ".jpg")
        bild.save_render(pfad, scene=scene)       # mit derselben Farbabstimmung (AgX) wie das gerechnete Bild

        # ---- 3. ein einziges Material mit der eingebrannten Textur ----
        fertig = bpy.data.images.load(pfad)
        neu = bpy.data.materials.new("gebrannt_" + ob.name)
        neu.use_nodes = True
        b = neu.node_tree.nodes.get("Principled BSDF")
        tex = neu.node_tree.nodes.new("ShaderNodeTexImage")
        tex.image = fertig
        neu.node_tree.links.new(tex.outputs["Color"], b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 1.0
        ob["_neu"] = neu.name
        for l in [l for l in ob.data.uv_layers if l.name != "licht"]:
            ob.data.uv_layers.remove(l)
        bericht.append((ob.name, vorher, _dreiecke(ob), px, time.time() - t1))
        print(f"  {ob.name:12s} {vorher:7d} -> {_dreiecke(ob):7d} Dreiecke, {px} px, {time.time() - t1:5.0f} s", flush=True)

    for ob in objekte:                       # erst jetzt tauschen: vorher brauchen die Nachbarn die echten Materialien
        neu = bpy.data.materials[ob["_neu"]]
        del ob["_neu"]
        ob.data.materials.clear()
        ob.data.materials.append(neu)
        ob.data.polygons.foreach_set("material_index", [0] * len(ob.data.polygons))
    for o in list(scene.objects):
        if o.type != "MESH":
            bpy.data.objects.remove(o)

    # ---- 4. Ausgabe ----
    # Die Rohdatei (etwa 15 MB) geht in den Werkzeug-Ordner; fuer die App macht sie danach "node werkzeuge/raum_verkleinern.js" klein.
    roh = not os.environ.get("OUT3D")
    glb = os.path.join(HERE, "quellen", "guardroom_roh.glb") if roh else os.path.join(OUT, "guardroom.glb")
    bpy.ops.export_scene.gltf(filepath=glb, export_format="GLB", export_image_format="JPEG", export_jpeg_quality=85,
                              export_cameras=False, export_lights=False, export_extras=True, export_animations=False,
                              export_yup=True)
    namen = dict(dinge)
    with open(os.path.join(OUT, "guardroom3d.json"), "w", encoding="utf-8") as f:
        json.dump({"raum": "guardroom", "modell": "guardroom.glb", "kamera": kamera, "lichter": lichter, "gehkarte": gehkarte,
                   "dinge": [{"id": k, "name": namen[k]} for k, _ in dinge if k in gruppen],
                   "dreiecke": sum(b[2] for b in bericht)}, f, ensure_ascii=False, indent=1)
    fehlt = [k for k, _ in dinge if k not in gruppen]
    print(f"3D fertig in {time.time() - t0:.0f} s – {len(objekte)} Objekte, {sum(b[2] for b in bericht)} Dreiecke, "
          f"{os.path.getsize(glb) / 1e6:.1f} MB: {glb}", flush=True)
    if roh:
        print("Jetzt noch: node werkzeuge/raum_verkleinern.js   (schreibt app/tower/raum3d/guardroom.glb)", flush=True)
    if fehlt:
        print("FEHLER: ohne Geometrie: " + ", ".join(fehlt), flush=True)
        raise SystemExit(1)
