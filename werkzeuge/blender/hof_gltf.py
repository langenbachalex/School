"""Der Hof (Tower Green) als echtes 3D fuer den Browser (Uebergabe 21.11.2026).

Aufruf ueber hof.py mit GLTF=1 (baut den Hof wie immer, rechnet dann aber kein Bild):
    GLTF=1 BAUM=mischung blender -b -P werkzeuge/blender/hof.py      (ohne NEBEL: der Nebel kommt im Spiel dazu und ist dort abschaltbar)
    GLTF=1 GLTF_KLEIN=1 ...   = schneller Probelauf (kleine Texturen, wenig Strahlen)
    GLTF=liste ...            = nur die Liste aller Teile ausgeben

Was passiert (Rezept wie tower_gltf.py beim Guard Room, fuer den grossen Hof erweitert):
  1. Uhrzeiger und Laternenglas fallen weg (die Zeiger laufen im Spiel, die Flammen sollen zu sehen sein).
  2. Baeume: Stamm und Laub werden getrennt. Die drei Baum-Modelle haben zusammen 11,3 Mio. Dreiecke (gemessen 21.11.) -
     fuer den Browser wird das Laub ausgeduennt (LAUB_ANTEIL der Blaetter bleibt, jedes um LAUB_GROSS vergroessert, dazu grober).
     Die Schatten auf Boden und Mauern werden vorher mit den vollen Baeumen eingebrannt.
  3. Gehkarte: Raster 0,25 m ueber den Platz; frei ist, wo von 1,7 m Hoehe nach unten zuerst der Boden kommt.
  4. Alles andere wird nach Himmelsrichtung zu wenigen grossen Stuecken verbunden; Cycles brennt Licht, Schatten und Farbe
     in EINE Textur je Stueck ein (Mond, Laternen, Fenster). Das Laub bekommt sein Licht je Eckpunkt (Farbe am Eckpunkt mal Blatt-Textur).
  5. Ausgabe: werkzeuge/blender/quellen/hof_roh.glb und app/tower/raum3d/hof3d.json (Gehkarte, Lichter, Uhr).
  6. Danach "node werkzeuge/raum_verkleinern.js hof": macht daraus app/tower/raum3d/hof.glb (WebP, Formen komprimiert).
"""
import json
import math
import os
import time

import bmesh
import bpy
import numpy as np
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(REPO, "app", "tower", "raum3d")
KLEIN = os.environ.get("GLTF_KLEIN") == "1"
SAMPLES = int(os.environ.get("SAMPLES3D", 4 if KLEIN else 32))
LAUB_ANTEIL = float(os.environ.get("LAUB_ANTEIL", 0.2))     # so viele Blaetter bleiben
LAUB_GROSS = float(os.environ.get("LAUB_GROSS", 1.6))       # jedes verbliebene Blatt wird so viel groesser
LAUB_GROB = float(os.environ.get("LAUB_GROB", 0.4))         # und so viel grober (Anteil der Dreiecke je Blatt)
ZWEIG_GROB = float(os.environ.get("ZWEIG_GROB", 0.1))
W, S = 25.0, 20.0                                            # halbe Breite und Tiefe des Platzes (wie hof.py)
PX = {"boden_w": 4096, "boden_o": 4096, "sued_w": 4096, "sued_o": 4096, "west": 4096, "nord": 4096, "ost": 4096,
      "platanen": 2048, "klein": 2048, "staemme": 2048, "hof_tuerblatt": 1024, "grund": 512}
MAX_TEIL = 4000          # einzelne Kleinteile (Laternen, Fass, Tuer) werden vor dem Verbinden auf so viele Dreiecke vereinfacht
MAX_STAMM = 15000        # je Stamm


def _dreiecke(ob):
    return sum(len(p.vertices) - 2 for p in ob.data.polygons)


def _kasten(o):
    e = [o.matrix_world @ Vector(c) for c in o.bound_box]
    return [min(v[i] for v in e) for i in range(3)], [max(v[i] for v in e) for i in range(3)]


def liste(scene):
    bpy.context.view_layer.update()
    for o in sorted(scene.objects, key=lambda o: o.name):
        if o.type != "MESH":
            print(f"TEIL {o.type:6s} {o.name}", flush=True)
            continue
        lo, hi = _kasten(o)
        print(f"TEIL MESH {o.name:28s} {_dreiecke(o):7d} x {lo[0]:6.1f}..{hi[0]:6.1f} y {lo[1]:6.1f}..{hi[1]:6.1f} z {lo[2]:5.1f}..{hi[2]:5.1f} "
              + ",".join(s.material.name for s in o.material_slots if s.material), flush=True)


def _waehle(obs):
    bpy.ops.object.select_all(action="DESELECT")
    for o in obs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = obs[0]


def _einfacher(ob, anteil):
    _waehle([ob])
    m = ob.modifiers.new("einfacher", "DECIMATE")
    m.ratio = anteil
    bpy.ops.object.modifier_apply(modifier=m.name)


def _waehle_flaechen(ob, maske):
    """Flaechen nach maske auswaehlen (Objekt-Modus); danach steht das Objekt im Bearbeiten-Modus."""
    me = ob.data
    me.vertices.foreach_set("select", np.zeros(len(me.vertices), dtype=bool))
    me.edges.foreach_set("select", np.zeros(len(me.edges), dtype=bool))
    me.polygons.foreach_set("select", maske.astype(bool))
    _waehle([ob])
    bpy.context.tool_settings.mesh_select_mode = (False, False, True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_mode(type="FACE")


def _mitten(ob):
    me = ob.data
    c = np.empty(len(me.polygons) * 3, dtype=np.float32)
    me.polygons.foreach_get("center", c)
    return c.reshape(-1, 3)


def _schnitt(ob, achse, wert, name_a, name_b):
    """Ein Stueck an einer senkrechten Ebene in zwei teilen (jede Haelfte bekommt ihre eigene, schaerfere Textur)."""
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    no = Vector((1, 0, 0)) if achse == 0 else Vector((0, 1, 0))
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=no * wert, plane_no=no)
    bm.to_mesh(ob.data)
    bm.free()
    vorher = set(bpy.data.objects)
    _waehle_flaechen(ob, _mitten(ob)[:, achse] > wert)
    bpy.ops.mesh.separate(type="SELECTED")
    bpy.ops.object.mode_set(mode="OBJECT")
    neu = [o for o in bpy.data.objects if o not in vorher][0]
    ob.name = ob.data.name = name_a
    neu.name = neu.data.name = name_b
    ob["gruppe"], neu["gruppe"] = name_a, name_b
    return [ob, neu]


def _inseln(me):
    """Zusammenhaengende Teile eines Netzes: Kennzahl je Eckpunkt."""
    k = np.empty(len(me.edges) * 2, dtype=np.int32)
    me.edges.foreach_get("vertices", k)
    k = k.reshape(-1, 2).astype(np.int64)
    lab = np.arange(len(me.vertices))
    for _ in range(400):
        m = np.minimum(lab[k[:, 0]], lab[k[:, 1]])
        neu = lab.copy()
        np.minimum.at(neu, k[:, 0], m)
        np.minimum.at(neu, k[:, 1], m)
        neu = neu[neu]
        if np.array_equal(neu, lab):
            break
        lab = neu
    return lab


def _laub_ausduennen(ob, zufall):
    me = ob.data
    lab = _inseln(me)
    co = np.empty(len(me.vertices) * 3, dtype=np.float32)
    me.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3).astype(np.float64)
    n = np.maximum(np.bincount(lab, minlength=len(lab)), 1)[:, None]
    mitte = np.stack([np.bincount(lab, weights=co[:, i], minlength=len(lab)) for i in range(3)], axis=1) / n
    co = mitte[lab] + (co - mitte[lab]) * LAUB_GROSS
    me.vertices.foreach_set("co", co.astype(np.float32).ravel())
    bleibt = zufall.random(len(lab)) < LAUB_ANTEIL          # je Insel (Kennzahl = kleinster Eckpunkt der Insel)
    ls = np.empty(len(me.polygons), dtype=np.int32)
    me.polygons.foreach_get("loop_start", ls)
    lv = np.empty(len(me.loops), dtype=np.int32)
    me.loops.foreach_get("vertex_index", lv)
    _waehle_flaechen(ob, ~bleibt[lab[lv[ls]]])
    bpy.ops.mesh.delete(type="FACE")
    bpy.ops.object.mode_set(mode="OBJECT")
    _einfacher(ob, LAUB_GROB)


def _gehkarte(scene, zelle=0.25, rand=1):
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    nx, ny = int(2 * W / zelle), int(2 * S / zelle)
    frei = [[False] * nx for _ in range(ny)]
    for j in range(ny):
        for i in range(nx):
            hit, ort, *_ = scene.ray_cast(dg, Vector((-W + (i + 0.5) * zelle, -S + (j + 0.5) * zelle, 1.7)), Vector((0, 0, -1)))
            frei[j][i] = bool(hit) and -0.1 < ort.z < 0.3
    for _ in range(rand):                                   # Hindernisse um die halbe Figurbreite vergroessern
        alt = [z[:] for z in frei]
        for j in range(ny):
            for i in range(nx):
                if alt[j][i] and not all(alt[j + dj][i + di] for dj in (-1, 0, 1) for di in (-1, 0, 1) if 0 <= j + dj < ny and 0 <= i + di < nx):
                    frei[j][i] = False
    for j in range(ny):                                     # der Rand ist zu, wie im Rohbau
        for i in range(nx):
            if i in (0, nx - 1) or j in (0, ny - 1):
                frei[j][i] = False
    return {"x0": -W, "y0": -S, "zelle": zelle, "zeilen": ["".join("1" if f else "0" for f in z) for z in frei]}


def _gruppe(o):
    n = o.name
    if o.get("gruppe"):
        return o["gruppe"]
    lo, hi = _kasten(o)
    cx, cy = (lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2
    if n == "grund":
        return "grund"
    if n.startswith(("large_castle_door_left", "large_castle_door_right")):
        return "hof_tuerblatt"
    if hi[2] < 0.5 and max(hi[0] - lo[0], hi[1] - lo[1]) > 2.5 and abs(cx) < W and abs(cy) < S:
        return "boden"
    if cy < -S + 1.4:
        return "sued"
    if cx > W - 0.6:
        return "ost"
    if cx < -W + 0.6:
        return "west"
    if cy > S - 0.6:
        return "nord"
    return "platanen" if n.startswith("platane") else "klein"


def _blattbild(material):
    knoten = [n for n in material.node_tree.nodes if n.type == "TEX_IMAGE" and n.image and "diff" in n.image.name.lower()]
    return knoten[0].image if knoten else None


def ausgeben(scene):
    t0 = time.time()
    os.makedirs(OUT, exist_ok=True)
    tmp = os.path.join(HERE, "frames", "bake_hof")
    os.makedirs(tmp, exist_ok=True)
    bpy.context.view_layer.update()
    lichter = [{"name": o.name, "ort": [round(v, 3) for v in o.matrix_world.translation], "farbe": [round(c, 3) for c in o.data.color], "watt": o.data.energy}
               for o in scene.objects if o.type == "LIGHT" and o.data.type == "POINT" and o.data.energy >= 100]
    q = math.sqrt(0.5)
    uhr = {"ort": [round(v, 3) for v in scene.objects["uhr_blatt"].matrix_world.translation], "vor": [q, q, 0], "radius": 1.02}

    # ---- 1. aufraeumen: Zeiger und Laternenglas weg, alles zu Gittern, Eltern loesen ----
    for o in list(scene.objects):
        if o.name.startswith(("uhr_minute", "uhr_stunde", "Lantern_01_glass")) or (o.type in ("MESH", "FONT", "CURVE") and o.hide_render):
            bpy.data.objects.remove(o)
    for o in scene.objects:
        if o.type not in ("MESH", "FONT", "CURVE"):
            o.name = "x_" + o.name
    geo = [o for o in scene.objects if o.type in ("MESH", "FONT", "CURVE")]
    for o in geo:
        o.hide_set(False)
        o.hide_select = False
    _waehle(geo)
    bpy.ops.object.convert(target="MESH")
    geo = [o for o in scene.objects if o.type == "MESH" and len(o.data.polygons)]
    _waehle(geo)
    bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
    for o in geo:                                           # mehrfach benutzte Netze (Laternen, Baum-Kopien) eigenstaendig machen
        if o.data.users > 1:
            o.data = o.data.copy()
    _waehle(geo)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    print(f"aufgeraeumt: {len(geo)} Teile ({time.time() - t0:.0f} s)", flush=True)

    # ---- 2. Baeume: nach Material trennen (Stamm, Zweige, Laub) ----
    laub = []
    for o in [o for o in geo if "_tree_" in o.name]:
        art = o.name.split("_LOD")[0]
        vorher = set(bpy.data.objects)
        _waehle([o])
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.mesh.separate(type="MATERIAL")
        bpy.ops.object.mode_set(mode="OBJECT")
        for t in [o] + [x for x in bpy.data.objects if x not in vorher]:
            mn = t.material_slots[0].material.name.lower() if t.material_slots and t.material_slots[0].material else ""
            if "leaves" in mn or "branches" in mn:
                t["laub"] = "blatt" if "leaves" in mn else "zweig"
                t["art"] = art
                laub.append(t)
            else:
                t["gruppe"] = "staemme"
                if _dreiecke(t) > MAX_STAMM:
                    _einfacher(t, MAX_STAMM / _dreiecke(t))
    print(f"Baeume getrennt: {len(laub)} Laub- und Zweigteile, {sum(_dreiecke(o) for o in laub)} Dreiecke ({time.time() - t0:.0f} s)", flush=True)

    # ---- 3. Gehkarte (ohne das Laub: tief haengende Zweige sperren keinen Weg) ----
    for o in laub:
        o.hide_viewport = True
    gehkarte = _gehkarte(scene)
    for o in laub:
        o.hide_viewport = False
    frei = sum(z.count("1") for z in gehkarte["zeilen"])
    print(f"Gehkarte: {frei} von {len(gehkarte['zeilen']) * len(gehkarte['zeilen'][0])} Zellen frei ({time.time() - t0:.0f} s)", flush=True)

    # ---- 4. Stuecke bilden ----
    gruppen = {}
    for o in [o for o in scene.objects if o.type == "MESH" and len(o.data.polygons) and not o.get("laub")]:
        g = _gruppe(o)
        if g in ("klein", "hof_tuerblatt", "sued") and _dreiecke(o) > MAX_TEIL:
            _einfacher(o, MAX_TEIL / _dreiecke(o))
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
    for g, achse, wert in (("boden", 0, 0.0), ("sued", 0, -6.0)):
        ob = next(o for o in objekte if o.name == g)
        objekte.remove(ob)
        objekte += _schnitt(ob, achse, wert, g + "_w", g + "_o")
    for o in list(scene.objects):
        if o.type == "EMPTY" and not o.name.startswith("x_ziel"):
            bpy.data.objects.remove(o)
    print("Stuecke: " + ", ".join(f"{o.name} {_dreiecke(o)}" for o in objekte) + f" ({time.time() - t0:.0f} s)", flush=True)

    # ---- 5. einbrennen: je Stueck eine Textur ----
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = SAMPLES
    scene.cycles.max_bounces = 5
    scene.cycles.use_denoising = True
    scene.render.image_settings.file_format = "JPEG"
    scene.render.image_settings.quality = 90
    scene.render.image_settings.color_mode = "RGB"
    bake = scene.render.bake
    bake.margin = 6
    bake.use_clear = True
    bericht = []
    for ob in sorted(objekte, key=lambda o: o.name):
        t1 = time.time()
        px = PX[ob.name] // (8 if KLEIN else 1)
        _waehle([ob])
        lage = ob.data.uv_layers.new(name="licht")
        ob.data.uv_layers.active = lage
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.003)
        try:
            bpy.ops.uv.average_islands_scale()
            bpy.ops.uv.pack_islands(margin=0.003)
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
        bild.save_render(pfad, scene=scene)       # mit derselben Farbabstimmung (AgX) wie die gerechneten Bilder
        neu = bpy.data.materials.new("gebrannt_" + ob.name)
        neu.use_nodes = True
        b = neu.node_tree.nodes.get("Principled BSDF")
        tex = neu.node_tree.nodes.new("ShaderNodeTexImage")
        tex.image = bpy.data.images.load(pfad)
        neu.node_tree.links.new(tex.outputs["Color"], b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 1.0
        ob["_neu"] = neu.name
        for l in [l for l in ob.data.uv_layers if l.name != "licht"]:
            ob.data.uv_layers.remove(l)
        bericht.append((ob.name, _dreiecke(ob)))
        print(f"  {ob.name:14s} {_dreiecke(ob):7d} Dreiecke, {px} px, {time.time() - t1:5.0f} s", flush=True)

    # ---- 6. Laub: ausduennen, Licht je Eckpunkt einbrennen, schlichtes Material mit der Blatt-Textur ----
    zufall = np.random.default_rng(11)
    vor = sum(_dreiecke(o) for o in laub)
    for o in laub:
        if o["laub"] == "blatt":
            _laub_ausduennen(o, zufall)
        else:
            _einfacher(o, ZWEIG_GROB)
    schlicht = {}
    for o in laub:                                           # ein schlichtes Material je Bild: nur die Farb-Textur
        mt = o.material_slots[0].material
        bild = _blattbild(mt)
        schluessel = os.path.basename(bild.filepath) if bild else mt.name
        if schluessel not in schlicht:
            m = bpy.data.materials.new("laub_" + os.path.splitext(schluessel)[0])
            m.use_nodes = True
            if bild:
                tx = m.node_tree.nodes.new("ShaderNodeTexImage")
                tx.image = bild
                m.node_tree.links.new(tx.outputs["Color"], m.node_tree.nodes["Principled BSDF"].inputs["Base Color"])
            schlicht[schluessel] = m
        o["_schlicht"] = schlicht[schluessel].name
    je_art = {}
    for o in laub:
        je_art.setdefault((o["art"], o["_schlicht"]), []).append(o)
    laubteile = []
    for k, ((art, sm), obs) in enumerate(je_art.items()):
        _waehle(obs)
        if len(obs) > 1:
            bpy.ops.object.join()
        ob = bpy.context.view_layer.objects.active
        ob.name = ob.data.name = f"laub_{k}"
        ob["gruppe"] = "laub"
        ob["_schlicht"] = sm
        farbe = ob.data.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
        ob.data.color_attributes.active_color = farbe
        ob.data.color_attributes.render_color_index = ob.data.color_attributes.find("Col")
        laubteile.append(ob)
    print(f"Laub: {vor} -> {sum(_dreiecke(o) for o in laubteile)} Dreiecke in {len(laubteile)} Teilen ({time.time() - t0:.0f} s)", flush=True)
    bake.target = "VERTEX_COLORS"
    bake.use_pass_direct, bake.use_pass_indirect, bake.use_pass_color = True, True, False
    for ob in laubteile:
        t1 = time.time()
        _waehle([ob])
        bpy.ops.object.bake(type="DIFFUSE")
        print(f"  {ob.name:14s} {_dreiecke(ob):7d} Dreiecke, Licht je Eckpunkt, {time.time() - t1:5.0f} s", flush=True)
        bericht.append((ob.name, _dreiecke(ob)))

    # ---- 7. Materialien tauschen (erst jetzt: vorher brauchen die Nachbarn die echten), ausgeben ----
    for ob in objekte + laubteile:
        neu = bpy.data.materials[ob["_neu"] if "_neu" in ob else ob["_schlicht"]]
        for k in ("_neu", "_schlicht"):
            if k in ob:
                del ob[k]
        ob.data.materials.clear()
        ob.data.materials.append(neu)
        ob.data.polygons.foreach_set("material_index", [0] * len(ob.data.polygons))
    for o in list(scene.objects):
        if o.type != "MESH":
            bpy.data.objects.remove(o)
    os.makedirs(os.path.join(HERE, "quellen"), exist_ok=True)
    glb = os.path.join(HERE, "quellen", "hof_roh_klein.glb" if KLEIN else "hof_roh.glb")
    wahl = dict(filepath=glb, export_format="GLB", export_image_format="JPEG", export_jpeg_quality=90, export_cameras=False, export_lights=False,
                export_extras=True, export_animations=False, export_yup=True)
    try:
        bpy.ops.export_scene.gltf(**wahl, export_vertex_color="ACTIVE", export_all_vertex_colors=False)
    except TypeError as e:
        print("Ausgabe ohne die Angabe zur Eckpunkt-Farbe:", e, flush=True)
        bpy.ops.export_scene.gltf(**wahl)
    gesamt = sum(b[1] for b in bericht)
    with open(os.path.join(OUT, "hof3d.json"), "w", encoding="utf-8") as f:
        json.dump({"raum": "hof", "modell": "hof.glb", "lichter": lichter, "uhr": uhr, "gehkarte": gehkarte, "dreiecke": gesamt,
                   "stuecke": [{"name": n, "dreiecke": d} for n, d in bericht]}, f, ensure_ascii=False, indent=1)
    print(f"3D fertig in {time.time() - t0:.0f} s - {len(bericht)} Stuecke, {gesamt} Dreiecke, {os.path.getsize(glb) / 1e6:.1f} MB: {glb}", flush=True)
    print("Jetzt noch: node werkzeuge/raum_verkleinern.js hof   (schreibt app/tower/raum3d/hof.glb)", flush=True)
