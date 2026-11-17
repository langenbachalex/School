"""Figuren fuer Keys of the Tower als 3D-Modelle (Probe 17.11.2026): Gary the Great (Fuchs mit Zauberhut) und die Taube.

Gebaut aus weichen Grundformen, die zu einem Koerper verschmolzen werden (Remesh), mit Fell-Material; stehen im Licht des Raums.
gary(scene, ort, dreh) / taube(scene, ort, dreh) -> Anker-Objekt. Benutzt von guardroom.py (Schalter FIGUREN=1).
"""
import math

import bpy

R = math.radians
_mats = {}


def _fell(name, farbe, rau=0.95, staerke=0.25):
    """Weiches, mattes Fell: Grundfarbe mit leichtem Rauschen, Samt-Schimmer am Rand, feine Struktur."""
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes.get("Principled BSDF")
    b.inputs["Roughness"].default_value = rau
    for eingang, wert in (("Sheen Weight", 0.6), ("Sheen Roughness", 0.4), ("Subsurface Weight", 0.08)):
        if eingang in b.inputs:
            b.inputs[eingang].default_value = wert
    tc = nt.nodes.new("ShaderNodeTexCoord")
    rausch = nt.nodes.new("ShaderNodeTexNoise")
    rausch.inputs["Scale"].default_value = 180
    rausch.inputs["Detail"].default_value = 8
    rampe = nt.nodes.new("ShaderNodeValToRGB")
    rampe.color_ramp.elements[0].color = (farbe[0] * 0.72, farbe[1] * 0.72, farbe[2] * 0.72, 1)
    rampe.color_ramp.elements[1].color = (min(1, farbe[0] * 1.12), min(1, farbe[1] * 1.12), min(1, farbe[2] * 1.12), 1)
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = staerke
    nt.links.new(tc.outputs["Object"], rausch.inputs["Vector"])
    nt.links.new(rausch.outputs["Fac"], rampe.inputs["Fac"])
    nt.links.new(rampe.outputs["Color"], b.inputs["Base Color"])
    nt.links.new(rausch.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    _mats[name] = m
    return m


def _glatt(name, farbe, rau=0.5, metall=0.0, leuchten=0.0):
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*farbe, 1)
    b.inputs["Roughness"].default_value = rau
    b.inputs["Metallic"].default_value = metall
    if leuchten:
        b.inputs["Emission Color"].default_value = (*farbe, 1)
        b.inputs["Emission Strength"].default_value = leuchten
    _mats[name] = m
    return m


class Bau:
    """Sammelt Teile einer Figur; verschmolzene Gruppen werden zu einem weichen Koerper."""

    def __init__(self, scene, name):
        self.scene, self.name, self.teile = scene, name, []

    def kugel(self, ort, r, mass=(1, 1, 1), dreh=(0, 0, 0)):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=ort, rotation=dreh, segments=32, ring_count=16)
        ob = bpy.context.object
        ob.scale = mass
        return ob

    def kegel(self, ort, r, hoehe, dreh=(0, 0, 0), r2=0.0, ecken=24):
        bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r2, depth=hoehe, location=ort, rotation=dreh, vertices=ecken)
        return bpy.context.object

    def stab(self, ort, r, laenge, dreh=(0, 0, 0)):
        bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=laenge, location=ort, rotation=dreh, vertices=16)
        return bpy.context.object

    def ring(self, ort, gross, klein, dreh=(0, 0, 0)):
        bpy.ops.mesh.primitive_torus_add(major_radius=gross, minor_radius=klein, location=ort, rotation=dreh)
        return bpy.context.object

    def koerper(self, formen, material, voxel=0.012, name="koerper"):
        """Mehrere Formen zu einem weichen Koerper verschmelzen."""
        bpy.ops.object.select_all(action="DESELECT")
        for o in formen:
            o.select_set(True)
        bpy.context.view_layer.objects.active = formen[0]
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        if len(formen) > 1:
            bpy.ops.object.join()
        ob = bpy.context.object
        ob.name = f"{self.name}_{name}"
        m = ob.modifiers.new("verschmelzen", "REMESH")
        m.mode = "VOXEL"
        m.voxel_size = voxel
        m.use_smooth_shade = True
        w = ob.modifiers.new("weich", "CORRECTIVE_SMOOTH")
        w.iterations = 12
        w.factor = 0.6
        ob.data.materials.append(material)
        self.teile.append(ob)
        return ob

    def teil(self, ob, material, glatt=True, name="teil"):
        ob.name = f"{self.name}_{name}"
        if glatt:
            for p in ob.data.polygons:
                p.use_smooth = True
        ob.data.materials.append(material)
        self.teile.append(ob)
        return ob

    def fertig(self, ort, dreh=0.0, mass=1.0):
        anker = bpy.data.objects.new(self.name + "_anker", None)
        self.scene.collection.objects.link(anker)
        bpy.context.view_layer.update()
        for o in self.teile:
            mw = o.matrix_world.copy()
            o.parent = anker
            o.matrix_parent_inverse = anker.matrix_world.inverted()
            o.matrix_world = mw
        anker.location = ort
        anker.rotation_euler = (0, 0, dreh)
        anker.scale = (mass,) * 3
        return anker


def gary(scene, ort, dreh=0.0, mass=1.0):
    """Gary the Great: aufrechter Fuchs, Blick nach -y, Zauberhut mit Sternen, Zauberstab in der erhobenen Pfote ("Ta-daa!")."""
    orange = _fell("fuchs_orange", (0.80, 0.32, 0.07))
    weiss = _fell("fuchs_weiss", (0.93, 0.90, 0.84), staerke=0.18)
    schwarz = _fell("fuchs_schwarz", (0.03, 0.025, 0.02), staerke=0.15)
    hut = _fell("hut_stoff", (0.10, 0.06, 0.30), rau=0.85, staerke=0.1)
    gold = _glatt("gold", (1.0, 0.72, 0.18), 0.3, 1.0)
    stern = _glatt("stern", (1.0, 0.85, 0.35), 0.4, 0.0, 2.5)
    auge = _glatt("auge_weiss", (0.95, 0.95, 0.92), 0.2)
    pupille = _glatt("pupille", (0.02, 0.015, 0.01), 0.1)
    glanz = _glatt("glanz", (1, 1, 1), 0.1, 0.0, 1.5)
    stabholz = _glatt("zauberstab", (0.05, 0.04, 0.04), 0.3)
    b = Bau(scene, "gary")

    # Koerper in Orange: Rumpf, Kopf mit Backenfell, Ohren, Arme, Beine, buschiger Schwanz
    f = [
        b.kugel((0, 0, 0.40), 0.20, (0.95, 0.85, 1.25)),                      # Rumpf, unten breiter
        b.kugel((0, 0.01, 0.30), 0.19, (1.05, 0.95, 0.9)),
        b.kugel((0, -0.02, 0.80), 0.17, (1.12, 0.98, 0.95)),                  # Kopf
        b.kugel((0, -0.01, 0.63), 0.08, (1.0, 0.9, 1.1)),                     # Hals
        b.kegel((-0.17, -0.02, 0.74), 0.09, 0.20, (0, R(-115), 0)),           # Backenfell links, rechts
        b.kegel((0.17, -0.02, 0.74), 0.09, 0.20, (0, R(115), 0)),
        b.kegel((-0.105, 0.0, 0.985), 0.07, 0.20, (0, R(-14), 0)),            # Ohren
        b.kegel((0.105, 0.0, 0.985), 0.07, 0.20, (0, R(14), 0)),
        b.kugel((0, -0.15, 0.775), 0.075, (0.95, 1.5, 0.75)),                 # Schnauze oben
        b.kugel((-0.22, -0.02, 0.50), 0.055, (1.0, 1.0, 2.2), (0, R(-28), 0)),   # linker Arm (zur Seite, "Ta-daa")
        b.kugel((-0.30, -0.04, 0.40), 0.05, (1.0, 1.0, 1.8), (0, R(-60), 0)),
        b.kugel((0.22, -0.03, 0.60), 0.055, (1.0, 1.0, 2.2), (0, R(35), 0)),     # rechter Arm erhoben
        b.kugel((0.31, -0.05, 0.76), 0.05, (1.0, 1.0, 2.0), (0, R(15), 0)),
        b.kugel((-0.10, -0.01, 0.13), 0.075, (1.0, 1.05, 1.6)),               # Beine
        b.kugel((0.10, -0.01, 0.13), 0.075, (1.0, 1.05, 1.6)),
    ]
    for i in range(9):   # Schwanz: Bogen aus Kugeln, in der Mitte am dicksten
        t = i / 8
        w = R(20 + 115 * t)
        r = 0.055 + 0.07 * math.sin(math.pi * min(1, t * 1.25)) ** 0.8
        f.append(b.kugel((0.20 + 0.30 * math.sin(w) - 0.1, 0.20 + 0.06 * t, 0.16 + 0.42 * (1 - math.cos(w)) * 0.75), r))
    b.koerper(f, orange)

    # Weiss: Latz, Schnauze unten, Schwanzspitze, Innenohr
    b.koerper([b.kugel((0, -0.10, 0.44), 0.13, (0.85, 0.6, 1.25)), b.kugel((0, -0.105, 0.60), 0.085, (1.0, 0.7, 0.9))], weiss, name="latz")
    b.koerper([b.kugel((0, -0.165, 0.745), 0.07, (1.1, 1.45, 0.62)), b.kugel((-0.09, -0.10, 0.73), 0.07, (1.0, 0.8, 0.7)), b.kugel((0.09, -0.10, 0.73), 0.07, (1.0, 0.8, 0.7))], weiss, name="schnauze")
    b.koerper([b.kugel((0.395, 0.275, 0.80), 0.085, (0.9, 0.9, 1.25), (0, R(-25), 0))], weiss, name="schwanzspitze")
    for s in (-1, 1):
        b.teil(b.kegel((s * 0.105, -0.028, 0.975), 0.04, 0.13, (R(8), R(s * 14), 0)), weiss, name="innenohr")
        b.teil(b.kegel((s * 0.128, 0.0, 1.075), 0.022, 0.06, (0, R(s * 14), 0)), schwarz, name="ohrspitze")
    # Schwarz: Pfoten, Nase, Mund
    for ort_, m_ in (((-0.375, -0.05, 0.345), (1.1, 1.0, 0.9)), ((0.325, -0.06, 0.865), (1.0, 1.0, 1.1)), ((-0.10, -0.06, 0.04), (1.0, 1.7, 0.6)), ((0.10, -0.06, 0.04), (1.0, 1.7, 0.6))):
        b.teil(b.kugel(ort_, 0.055, m_), schwarz, name="pfote")
    b.teil(b.kugel((0, -0.265, 0.775), 0.03, (1.2, 0.9, 0.85)), pupille, name="nase")
    mund = b.ring((0, -0.215, 0.735), 0.045, 0.007, (R(72), 0, 0))
    mund.scale = (1.3, 1, 1)
    b.teil(mund, schwarz, name="mund")
    # Augen: gross, wach, mit Glanzpunkt; freche Brauen
    for s in (-1, 1):
        b.teil(b.kugel((s * 0.072, -0.150, 0.845), 0.042, (0.9, 0.6, 1.1)), auge, name="auge")
        b.teil(b.kugel((s * 0.070, -0.175, 0.842), 0.023, (1.0, 0.5, 1.15)), pupille, name="pupille")
        b.teil(b.kugel((s * 0.062, -0.188, 0.853), 0.007), glanz, name="glanz")
        braue = b.kugel((s * 0.078, -0.150, 0.905), 0.02, (2.2, 0.6, 0.45), (0, R(s * -16), 0))
        b.teil(braue, schwarz, name="braue")

    # Zauberhut: hoher Kegel mit geknickter Spitze, Krempe, goldenes Band, leuchtende Sterne
    b.teil(b.kegel((0, 0.0, 1.12), 0.15, 0.42, (R(-6), 0, 0), r2=0.05), hut, name="hut")
    b.teil(b.kegel((0.035, 0.03, 1.40), 0.055, 0.22, (R(-12), R(28), 0)), hut, name="hutspitze")
    krempe = b.kugel((0, 0.01, 0.925), 0.25, (1.0, 1.0, 0.07), (R(-6), 0, 0))
    b.teil(krempe, hut, name="krempe")
    b.teil(b.ring((0, 0.005, 0.955), 0.148, 0.018, (R(-6), 0, 0)), gold, name="hutband")
    for w_, z_, r_ in ((R(-70), 1.05, 0.022), (R(-110), 1.17, 0.018), (R(-55), 1.24, 0.014), (R(-125), 0.995, 0.015), (R(-88), 1.30, 0.012)):
        rad = 0.15 - (z_ - 0.92) * 0.26
        b.teil(b.kugel((math.cos(w_) * rad, math.sin(w_) * rad - 0.012, z_), r_, (1, 0.35, 1)), stern, name="stern")
    b.teil(b.kugel((0.085, 0.045, 1.505), 0.03), gold, name="hutkugel")

    # Zauberstab in der erhobenen rechten Pfote, an der Spitze ein Funke
    b.teil(b.stab((0.365, -0.07, 1.01), 0.011, 0.34, (R(8), R(18), 0)), stabholz, name="stab")
    b.teil(b.stab((0.413, -0.092, 1.165), 0.0125, 0.045, (R(8), R(18), 0)), auge, name="stabspitze")
    b.teil(b.kugel((0.425, -0.097, 1.205), 0.022), stern, name="funke")
    # Fliege in Scharlachrot
    rot = _fell("fliege", (0.70, 0.04, 0.05), staerke=0.1)
    for s in (-1, 1):
        b.teil(b.kegel((s * 0.045, -0.155, 0.635), 0.04, 0.085, (0, R(s * 90), 0), ecken=4), rot, glatt=False, name="fliege")
    b.teil(b.kugel((0, -0.16, 0.635), 0.018), gold, name="fliegenknopf")
    return b.fertig(ort, dreh, mass)


def taube(scene, ort, dreh=0.0, mass=1.0):
    """Stadttaube: sitzt, Blick nach -y; grauer Koerper, schillernder Hals, zwei dunkle Fluegelbinden, rosa Fuesse."""
    grau = _fell("taube_grau", (0.42, 0.45, 0.52), staerke=0.2)
    dunkel = _fell("taube_dunkel", (0.16, 0.17, 0.21), staerke=0.2)
    hell = _fell("taube_hell", (0.66, 0.68, 0.74), staerke=0.2)
    hals = _glatt("taube_hals", (0.10, 0.45, 0.30), 0.35, 0.6)
    lila = _glatt("taube_lila", (0.45, 0.20, 0.55), 0.35, 0.6)
    schnabel = _glatt("schnabel", (0.25, 0.22, 0.22), 0.4)
    wachs = _glatt("schnabelwachs", (0.92, 0.90, 0.86), 0.5)
    auge = _glatt("taube_auge", (0.95, 0.42, 0.08), 0.2)
    pupille = _glatt("pupille", (0.02, 0.015, 0.01), 0.1)
    rosa = _glatt("taube_fuss", (0.85, 0.35, 0.38), 0.6)
    b = Bau(scene, "taube")
    b.koerper([b.kugel((0, 0.02, 0.105), 0.085, (0.95, 1.45, 0.92), (R(-18), 0, 0)),
               b.kugel((0, -0.085, 0.215), 0.045, (1.0, 1.0, 1.05)),
               b.kugel((0, -0.06, 0.165), 0.05, (1.0, 0.9, 1.2), (R(-25), 0, 0))], grau, voxel=0.006)
    b.koerper([b.kugel((0, -0.075, 0.150), 0.052, (1.02, 0.75, 0.85), (R(-25), 0, 0))], hals, voxel=0.006, name="hals")
    b.koerper([b.kugel((0, -0.090, 0.128), 0.045, (1.04, 0.6, 0.6), (R(-25), 0, 0))], lila, voxel=0.006, name="brust")
    b.koerper([b.kugel((0, -0.03, 0.075), 0.07, (0.85, 1.2, 0.7), (R(-18), 0, 0))], hell, voxel=0.006, name="bauch")
    for s in (-1, 1):   # Fluegel mit zwei dunklen Binden
        b.teil(b.kugel((s * 0.072, 0.045, 0.115), 0.075, (0.28, 1.45, 0.72), (R(-22), 0, R(s * -6))), hell, name="fluegel")
        for k, dy in enumerate((0.075, 0.115)):
            b.teil(b.kugel((s * 0.079, dy, 0.092 - k * 0.012), 0.03, (0.22, 0.45, 1.5), (R(-40), 0, R(s * -6))), dunkel, name="binde")
        b.teil(b.kugel((s * 0.036, -0.122, 0.228), 0.0085), auge, name="auge")
        b.teil(b.kugel((s * 0.040, -0.125, 0.228), 0.0045), pupille, name="pupille")
        for zeh in (-0.5, 0, 0.5):
            b.teil(b.stab((s * 0.03 + zeh * 0.018, -0.045, 0.006), 0.004, 0.045, (R(90), 0, R(zeh * 35))), rosa, name="zeh")
        b.teil(b.stab((s * 0.03, -0.025, 0.02), 0.005, 0.04), rosa, name="bein")
    b.teil(b.kugel((0, 0.16, 0.085), 0.05, (0.9, 1.6, 0.22), (R(-10), 0, 0)), dunkel, name="schwanz")
    b.teil(b.kegel((0, -0.142, 0.210), 0.012, 0.04, (R(98), 0, 0)), schnabel, name="schnabel")
    b.teil(b.kugel((0, -0.128, 0.219), 0.011, (1.0, 1.0, 0.7)), wachs, name="wachshaut")
    return b.fertig(ort, dreh, mass)
