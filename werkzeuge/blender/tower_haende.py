"""The Keys of the Tower – wechselbare Hände für die Menschenfiguren (Probe A2, 18.11.2026).

Aufruf:  blender -b --python werkzeuge/blender/tower_haende.py      ->  app/tower/figuren/haende.glb   (wenige Sekunden)

Drei schlichte Handformen im Stil der Figuren (drei Finger und Daumen, rund wie die Fäustlinge – Mr. Alex 18.11.: runder,
aber nicht klobig, die Dicke bleibt): hand_offen, hand_zeigen, hand_faust.
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

def kasten(mitte, mass, dreh=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1)
    o = bpy.context.object
    o.matrix_world = Matrix.Translation(mitte) @ Euler([math.radians(w) for w in dreh]).to_matrix().to_4x4() @ Matrix.Diagonal((*mass, 1))
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    b = o.modifiers.new("kante", "BEVEL"); b.width = min(mass) * 0.42; b.segments = 3      # fast rund: Finger werden zu kleinen Walzen
    bpy.ops.object.modifier_apply(modifier="kante")
    for f in o.data.polygons: f.use_smooth = True
    o.data.materials.append(haut)
    return o

FINGER_Y = (-0.04, 0.0, 0.04)                 # Zeigefinger liegt auf der Daumenseite (-Y)
def finger(y, gestreckt, faecher=0):
    if gestreckt: return [kasten((-0.150, y + faecher * 0.012, 0), (0.095, 0.028, 0.028), (0, 0, faecher * 9))]
    return [kasten((-0.112, y, -0.020), (0.032, 0.028, 0.052)), kasten((-0.086, y, -0.040), (0.050, 0.028, 0.026))]
def daumen(offen):
    if offen: return [kasten((-0.050, -0.082, 0), (0.030, 0.065, 0.028), (0, 0, 28))]
    return [kasten((-0.088, -0.066, -0.016), (0.055, 0.026, 0.028), (0, 0, 8))]
def hand(name, gestreckt, daumen_offen):
    teile = [kasten((-0.052, 0, 0), (0.105, 0.118, 0.046))]
    for i, y in enumerate(FINGER_Y): teile += finger(y, gestreckt[i], (i - 1) if all(gestreckt) else 0)
    teile += daumen(daumen_offen)
    bpy.ops.object.select_all(action="DESELECT")
    for t in teile: t.select_set(True)
    bpy.context.view_layer.objects.active = teile[0]
    bpy.ops.object.join()
    o = bpy.context.object; o.name = name; o.data.name = name
    bpy.context.scene.cursor.location = (0, 0, 0); bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
    return o

hand("hand_offen", (True, True, True), True)
hand("hand_zeigen", (True, False, False), False)
hand("hand_faust", (False, False, False), False)
bpy.ops.export_scene.gltf(filepath=ZIEL, export_format="GLB", export_cameras=False, export_lights=False, export_animations=False, export_yup=True, export_texcoords=False)
print("HAENDE", round(os.path.getsize(ZIEL) / 1000), "KB")
