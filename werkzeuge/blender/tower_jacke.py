"""Uniformjacke von Mr Pike als Stoff: faellt per Simulation ueber die Stuhllehne (Keys of the Tower, Guard Room).

baue_jacke(scene, stuhl_netze, sx, sy, mats) -> Anker-Objekt, an dem alle Teile der Jacke haengen.
Der Stuhl muss dabei ungedreht bei (sx, sy) stehen; danach Stuhl und Jacken-Anker gemeinsam drehen.
Benutzt von guardroom.py und jacke_probe.py.
"""
import math

import bpy
from mathutils import Vector

R = math.radians
ZELLE = 0.02
BREIT, LANG = 0.25, 0.74          # halbe Breite des Rumpfs, Laenge Kragen -> Saum
AERMEL, ARM_B = 0.58, 0.18        # Aermellaenge und -breite
LINIE = 0.12                      # so weit unter dem Kragen liegt die Jacke auf der Lehne auf


def _drin(u, v):
    if abs(u) <= BREIT and 0 <= v <= LANG:
        return True
    t = (abs(u) - BREIT) / AERMEL
    return 0 <= t <= 1 and 0.02 + 0.06 * t <= v <= 0.02 + ARM_B + 0.06 * t


def _rot(u, v):
    t = (abs(u) - BREIT) / AERMEL
    return v > LANG - 0.055 or t > 0.83 or (abs(u) < 0.028 and v > 0.03)


def baue_jacke(scene, stuhl_netze, sx, sy, mats, bilder=90, gruppe=None):
    blau, rot, messing = mats["blau"], mats["rot"], mats["messing"]
    for o in stuhl_netze:   # der Stuhl haelt den Stoff auf
        if not o.collision or not any(m.type == "COLLISION" for m in o.modifiers):
            o.modifiers.new("halt", "COLLISION")
        o.collision.thickness_outer = 0.012
        o.collision.cloth_friction = 25
    bpy.context.view_layer.update()
    ecken = [o.matrix_world @ Vector(c) for o in stuhl_netze for c in o.bound_box]
    oben = max(e[2] for e in ecken)
    y_lehne = max(e[1] for e in ecken) - 0.04
    z0 = oben + 0.03

    # flaches Schnittmuster (Ruhe-Form) und Start-Lage: der linke Aermel ist nach vorn ueber den Rumpf geworfen
    nu, nv = int((BREIT + AERMEL) / ZELLE) + 1, int(LANG / ZELLE) + 1
    flach, start, nummer, uv, flaechen, farben = [], [], {}, [], [], []

    def punkt(i, j):
        if (i, j) not in nummer:
            u, v = i * ZELLE, j * ZELLE
            nummer[(i, j)] = len(flach)
            uv.append((u, v))
            x, y, z = sx + u, y_lehne - (v - LINIE), z0
            flach.append((x, y, z))
            t = (-u - BREIT) / AERMEL
            if t > 0:   # linker Aermel: um die Schulter nach vorn gedreht und angehoben
                w = R(-72) * min(1.0, t / 0.18)
                px, py = sx - BREIT, y_lehne - (0.11 - LINIE)
                dx, dy = x - px, y - py
                x, y = px + dx * math.cos(w) - dy * math.sin(w), py + dx * math.sin(w) + dy * math.cos(w)
                z = z0 + 0.05 * min(1.0, t / 0.18)
            start.append((x, y, z))
        return nummer[(i, j)]

    for i in range(-nu, nu):
        for j in range(0, nv):
            u, v = (i + 0.5) * ZELLE, (j + 0.5) * ZELLE
            if _drin(u, v):
                flaechen.append((punkt(i, j), punkt(i + 1, j), punkt(i + 1, j + 1), punkt(i, j + 1)))
                farben.append(1 if _rot(u, v) else 0)
    netz = bpy.data.meshes.new("jacke_stoff")
    netz.from_pydata(flach, [], flaechen)
    netz.update()
    stoff_ob = bpy.data.objects.new("jacke_stoff", netz)
    scene.collection.objects.link(stoff_ob)
    netz.materials.append(blau)
    netz.materials.append(rot)
    for p, f in zip(netz.polygons, farben):
        p.material_index = f
        p.use_smooth = True
    ruhe = stoff_ob.shape_key_add(name="Ruhe")
    lage = stoff_ob.shape_key_add(name="Start")
    for n, p in enumerate(start):
        lage.data[n].co = p
    lage.value = 1.0
    # Auf der Lehne festgehalten: eine Reihe quer ueber die Schultern (sonst rutscht die Jacke nach vorn herunter)
    fest = stoff_ob.vertex_groups.new(name="fest")
    fest.add([n for (i, j), n in nummer.items() if abs(j * ZELLE - LINIE) < ZELLE * 0.6 and abs(i * ZELLE) <= BREIT - 0.02], 1.0, "REPLACE")

    stoff = stoff_ob.modifiers.new("stoff", "CLOTH")
    stoff.settings.quality = 10
    stoff.settings.mass = 0.25
    stoff.settings.tension_stiffness = 12
    stoff.settings.compression_stiffness = 12
    stoff.settings.shear_stiffness = 6
    stoff.settings.bending_stiffness = 0.35
    stoff.settings.vertex_group_mass = "fest"
    stoff.settings.rest_shape_key = ruhe
    stoff.collision_settings.collision_quality = 4
    stoff.collision_settings.distance_min = 0.012
    stoff.collision_settings.use_self_collision = True
    stoff.collision_settings.self_distance_min = 0.008
    stoff.point_cache.frame_start = 1
    stoff.point_cache.frame_end = bilder
    glatt = stoff_ob.modifiers.new("glatt", "SUBSURF")
    glatt.levels = glatt.render_levels = 1
    dick = stoff_ob.modifiers.new("dick", "SOLIDIFY")
    dick.thickness = 0.007

    scene.frame_start, scene.frame_end = 1, bilder
    for f in range(1, bilder + 1):   # Stoff fallen lassen
        scene.frame_set(f)
    dg = bpy.context.evaluated_depsgraph_get()
    aus = stoff_ob.evaluated_get(dg)
    fest_netz = bpy.data.meshes.new_from_object(aus, preserve_all_data_layers=True, depsgraph=dg)
    lagen = [(aus.matrix_world @ aus.data.vertices[n].co, aus.matrix_world.to_3x3() @ aus.data.vertices[n].normal) for n in range(len(flach))]
    jacke = bpy.data.objects.new("jacke", fest_netz)   # fertig gefallene Jacke als festes Netz
    scene.collection.objects.link(jacke)
    jacke.matrix_world = aus.matrix_world.copy()
    for p in fest_netz.polygons:
        p.use_smooth = True
    bpy.data.objects.remove(stoff_ob, do_unlink=True)
    scene.frame_set(1)
    teile = [jacke]

    def kugel(name, r, ort, material, scale=(1, 1, 1)):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=ort, segments=16, ring_count=8)
        ob = bpy.context.object
        ob.name = name
        ob.scale = scale
        bpy.ops.object.shade_smooth()
        ob.data.materials.append(material)
        teile.append(ob)
        return ob

    # Messingknoepfe entlang der roten Leiste, auf dem gefallenen Stoff
    for v in (0.22, 0.32, 0.42, 0.52, 0.62):
        n = nummer.get((1, round(v / ZELLE)))
        if n is not None:
            ort, normale = lagen[n]
            if normale.y > 0:
                normale = -normale
            kugel("jacke_knopf", 0.017, ort + normale * 0.008, messing, scale=(1, 1, 1))
    # Stehkragen: roter Ring oben auf der Lehne, vorn offen
    bpy.ops.mesh.primitive_torus_add(major_radius=0.085, minor_radius=0.024, location=(sx, y_lehne + 0.01, z0 + 0.02), major_segments=32, minor_segments=10)
    kragen = bpy.context.object
    kragen.name = "jacke_kragen"
    kragen.scale = (1.0, 0.62, 1.6)
    bpy.ops.object.shade_smooth()
    kragen.data.materials.append(rot)
    teile.append(kragen)
    for s in (-1, 1):   # Schulterklappen mit Knopf
        bpy.ops.mesh.primitive_cube_add(size=1, location=(sx + s * 0.155, y_lehne - 0.01, z0 + 0.012))
        k = bpy.context.object
        k.name = "jacke_schulterklappe"
        k.scale = (0.09, 0.05, 0.012)
        k.data.materials.append(rot)
        teile.append(k)
        kugel("jacke_schulterknopf", 0.013, (sx + s * 0.125, y_lehne - 0.01, z0 + 0.022), messing)

    anker = bpy.data.objects.new("jacke_anker", None)
    scene.collection.objects.link(anker)
    anker.location = (sx, sy, 0)
    bpy.context.view_layer.update()
    for o in teile:
        mw = o.matrix_world.copy()
        o.parent = anker
        o.matrix_parent_inverse = anker.matrix_world.inverted()
        o.matrix_world = mw
        if gruppe:
            o["gruppe"] = gruppe
    return anker
