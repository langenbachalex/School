"""The Keys of the Tower – Hand mit beweglichen Fingern für die Menschenfiguren (A2 bis A5, 18.11.2026).

Aufruf:  blender -b --python werkzeuge/blender/tower_haende.py      ->  app/tower/figuren/haende.glb   (wenige Sekunden)

EINE Hand im Stil der Figuren: Handfläche, vier Finger aus je zwei Gliedern und ein Daumen, rund wie die Fäustlinge
(Mr. Alex 18.11.: runder, nicht klobig, die Dicke bleibt; vier Finger; Finger sitzen an der Handfläche und eng beieinander).
Die Glieder sind einzelne Teile mit dem Drehpunkt im Gelenk – die App rollt sie ein (offen, Zeigefinger, Faust mit weichem Übergang):
  hand → flaeche, f1 … f4 (Grundglied, f1 = Zeigefinger) → f1b … f4b (Endglied), daumen
Gebaut ist die RECHTE Hand bei seitlich ausgestrecktem Arm: Ursprung am Handgelenk, Finger zeigen nach -X (vom Körper weg),
Handfläche nach unten, Daumen nach vorn. Die linke Hand entsteht in der App durch Spiegeln. Gary behält seine Pfoten.
"""
import bpy, os, math
from mathutils import Matrix, Euler

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
ZIEL = os.path.join(REPO, "app", "tower", "figuren", "haende.glb")
bpy.ops.wm.read_factory_settings(use_empty=True)
haut = bpy.data.materials.new("haut"); haut.use_nodes = True
haut.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.80, 0.42, 0.28, 1)
haut.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.8

def teil(name, mitte, mass, gelenk, eltern=None, dreh=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1)
    o = bpy.context.object; o.name = name; o.data.name = name
    o.matrix_world = Matrix.Translation(mitte) @ Euler([math.radians(w) for w in dreh]).to_matrix().to_4x4() @ Matrix.Diagonal((*mass, 1))
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    b = o.modifiers.new("kante", "BEVEL"); b.width = min(mass) * 0.42; b.segments = 3      # fast rund: Finger werden zu kleinen Walzen
    bpy.ops.object.modifier_apply(modifier="kante")
    for f in o.data.polygons: f.use_smooth = True
    o.data.materials.append(haut)
    bpy.context.scene.cursor.location = gelenk; bpy.ops.object.origin_set(type="ORIGIN_CURSOR")   # Drehpunkt ins Gelenk
    if eltern: o.parent = eltern; o.matrix_parent_inverse = eltern.matrix_world.inverted()
    return o

hand = bpy.data.objects.new("hand", None); bpy.context.scene.collection.objects.link(hand)
bpy.context.view_layer.update()
teil("flaeche", (-0.052, 0, 0), (0.105, 0.125, 0.046), (0, 0, 0), hand)
KNOECHEL, GLIED, DICK = -0.090, 0.050, 0.027
for i, y in enumerate((-0.0435, -0.0145, 0.0145, 0.0435)):                # f1 = Zeigefinger, auf der Daumenseite (-Y)
    kurz = 0.006 if i in (0, 3) else 0.0                                   # Zeige- und kleiner Finger etwas kürzer
    a = teil("f%d" % (i + 1), (KNOECHEL - GLIED / 2, y, 0), (GLIED + 0.012, DICK, DICK), (KNOECHEL, y, 0), hand)
    bpy.context.view_layer.update()
    teil("f%db" % (i + 1), (KNOECHEL - GLIED - (GLIED - kurz) / 2, y, 0), (GLIED - kurz + 0.012, DICK, DICK), (KNOECHEL - GLIED, y, 0), a)
teil("daumen", (-0.050, -0.084, 0), (0.030, 0.066, 0.028), (-0.036, -0.056, 0), hand, (0, 0, 27))
bpy.ops.export_scene.gltf(filepath=ZIEL, export_format="GLB", export_cameras=False, export_lights=False, export_animations=False, export_yup=True, export_texcoords=False)
print("HAENDE", round(os.path.getsize(ZIEL) / 1000), "KB")
