"""The Keys of the Tower – eigene Bewegungen für alle Figuren mit KayKit-Körper (Rede-Gesten, Figuren-Gesten, Kung-Fu).

Aufruf:  blender -b --python werkzeuge/blender/tower_gesten.py            (wenige Sekunden)
         ... -- nurbild   rechnet nur die Prüfbilder, schreibt keine Datei

Ergebnis: werkzeuge/blender/quellen/tower_gesten_roh.glb (alle Bewegungen, nur Skelett)
          danach `node werkzeuge/glb_teilen.js` -> app/tower/figuren/gesten.glb und kungfu.glb
Prüfbilder: werkzeuge/blender/frames/gesten/<Name>_<Bild>.png (16 Bilder je Bewegung; Blatt und GIF baut tower_gesten_blatt.py)

So ist eine Bewegung beschrieben (Liste CLIPS): Zeit in Sekunden und eine Haltung. Eine Haltung nennt nur, was vom
ruhigen Stehen abweicht. Gliedmaßen bekommen eine Richtung (seitlich nach außen, nach vorn, nach oben); ohne Endung
".l"/".r" gilt sie für beide Seiten gespiegelt. Rumpf und Kopf bekommen Winkel in Grad: vor (vorbeugen), dreh (nach
links drehen), seit (nach links neigen). Die Füße bleiben von selbst auf dem Boden (die Hüfte wird passend verschoben).
Das Skelett wird nicht verändert, die Bewegungen passen deshalb auf Mage, Knight, Barbarian und Rogue.
"""
import bpy, sys, os, math
from mathutils import Vector, Matrix

HIER = os.path.dirname(os.path.abspath(__file__))
KOERPER = os.path.join(HIER, "quellen", "kaykit_knight.glb")
ROH = os.path.join(HIER, "quellen", "tower_gesten_roh.glb")
BILDER = os.path.join(HIER, "frames", "gesten")
NURBILD = "nurbild" in sys.argv
FPS, BILDZAHL = 30, 16

# ---------------------------------------------------------------- Haltungen
S = {}                                                  # ruhiges Stehen
def h(**k): return {a.replace("_", "."): b for a, b in k.items()}

ZEIG = h(upperarm_r=(.15, 1, .0), lowerarm_r=(.05, 1, .08), chest=dict(dreh=8))
ZUCK = h(upperarm=(.55, .15, -1), lowerarm=(1, .5, .35), head=dict(seit=10), chest=dict(vor=-4))
WINK1 = h(upperarm_r=(.4, .5, -.6), lowerarm_r=(.1, .5, 1), head=dict(dreh=14))
WINK2 = h(upperarm_r=(.4, .5, -.6), lowerarm_r=(.9, .8, -.2), head=dict(dreh=18, seit=6))
REIB_A = h(upperarm=(.3, .6, -1), lowerarm_l=(-1, .55, .45), lowerarm_r=(-1, .55, .15), chest=dict(vor=8), head=dict(vor=-6))
REIB_B = h(upperarm=(.3, .6, -1), lowerarm_l=(-1, .55, .15), lowerarm_r=(-1, .55, .45), chest=dict(vor=8), head=dict(vor=-6))
BREIT = h(upperarm=(1, .25, .1), lowerarm=(1, .35, .45), chest=dict(vor=-8), head=dict(vor=-5))
MAHN_A = h(upperarm_r=(.45, .6, -.25), lowerarm_r=(.3, .2, 1), head=dict(vor=6))
MAHN_B = h(upperarm_r=(.45, .6, -.25), lowerarm_r=(-.25, .2, 1), head=dict(vor=6))
DENK = h(upperarm_r=(.15, .6, -.8), lowerarm_r=(-.55, .25, 1), upperarm_l=(.15, .35, -1), lowerarm_l=(-1, .45, .0), head=dict(seit=-10, vor=5))
HUEFT = h(upperarm=(.85, -.3, -.6), lowerarm=(-.75, .45, -.45), chest=dict(vor=-5))
STIRN = h(upperarm_r=(.1, .75, -.25), lowerarm_r=(-.5, .0, 1), head=dict(vor=22), chest=dict(vor=6))
KLATSCH_A = h(upperarm=(.35, .6, -.8), lowerarm=(-.35, 1, .35))
KLATSCH_B = h(upperarm=(.3, .6, -.8), lowerarm=(-.95, .85, .35))
FIVE_A = h(upperarm_r=(.6, .2, -.7), lowerarm_r=(.05, .3, 1), chest=dict(vor=-3, dreh=-6))        # Arm angewinkelt, Hand neben dem Kopf (Mr. Alex 18.11.)
FIVE_B = h(upperarm_r=(.6, .45, -.5), lowerarm_r=(.0, .4, 1), chest=dict(vor=5, dreh=8))           # kurzer Schwung nach vorn – der Ellbogen bleibt angewinkelt, der Arm wird NIE gestreckt
NICK = h(head=dict(vor=16))
NEIN_A, NEIN_B = h(head=dict(dreh=22)), h(head=dict(dreh=-22))

SALUT = h(upperarm_r=(1, .15, .0), lowerarm_r=(-.95, .3, .62), chest=dict(vor=-4), head=dict(vor=-4))
MARSCH_A = h(upperleg_l=(.05, .9, -.45), lowerleg_l=(0, .05, -1), upperarm_r=(.2, .7, -.7), upperarm_l=(.2, -.5, -.9))
MARSCH_B = h(upperleg_r=(.05, .9, -.45), lowerleg_r=(0, .05, -1), upperarm_l=(.2, .7, -.7), upperarm_r=(.2, -.5, -.9))
WIPP = h(foot_r=(.15, 1, .55))
BIZEPS_A = h(upperarm=(1, .0, .12), lowerarm=(-.3, .1, 1), chest=dict(vor=-8), head=dict(vor=-6))
BIZEPS_B = h(upperarm=(1, .0, .2), lowerarm=(-.65, .1, 1), chest=dict(vor=-10), head=dict(vor=-6))
TEE_A = h(upperarm_r=(.3, .7, -.6), lowerarm_r=(-.2, .8, .6))
TEE_B = h(upperarm_r=(.3, .6, -.45), lowerarm_r=(-.6, .25, 1), head=dict(vor=-14))
BRILLE = h(upperarm_r=(.5, .6, -.2), lowerarm_r=(-.5, .1, 1), head=dict(vor=16, dreh=-8))
PISTOL_A = h(upperarm=(.2, 1, -.2), lowerarm=(.1, 1, .2), chest=dict(vor=-8), head=dict(seit=8))
PISTOL_B = h(upperarm=(.2, 1, -.1), lowerarm=(.1, .7, .75), chest=dict(vor=-10), head=dict(seit=8))

DECKUNG = dict(upperarm_l=(.3, .6, -.5), lowerarm_l=(-.2, .5, 1), upperarm_r=(.6, -.4, -.6), lowerarm_r=(.2, .3, .3))
KICK_A = h(upperleg_r=(.1, .75, .7), lowerleg_r=(0, -.35, -1), foot_r=(0, .5, -.8), chest=dict(vor=-4), **DECKUNG)      # Knie hoch, Unterschenkel angewinkelt
KICK_B = h(upperleg_r=(.1, .72, .8), lowerleg_r=(.1, .8, .62), foot_r=(0, .3, 1), chest=dict(vor=-20), hips=dict(vor=-10), **DECKUNG)   # Unterschenkel und Fuß schnellen heraus
MABU = h(upperleg=(1, .3, -.3), lowerleg=(.05, -.1, -1), foot=(.45, 1, 0),
         upperarm=(.12, 1, .1), lowerarm=(.04, 1, .1))                    # beide Fäuste parallel nach vorn (Mr. Alex 18.11.)
MABU_ZU = h(upperleg=(1, .3, -.3), lowerleg=(.05, -.1, -1), foot=(.45, 1, 0),
            upperarm=(.5, -.5, -.6), lowerarm=(-.2, 1, .1))
PUBU = h(upperleg_r=(1, .05, -.1), lowerleg_r=(1, .05, -.1), foot_r=(.4, 1, 0),
         upperleg_l=(.75, .55, .2), lowerleg_l=(-.35, -.3, -1), foot_l=(.7, .7, 0),
         hips=dict(seit=14), chest=dict(seit=-16, vor=14), head=dict(dreh=-30),
         upperarm_r=(1, .2, -.5), lowerarm_r=(1, .2, -.5), upperarm_l=(.8, -.2, .7), lowerarm_l=(.8, -.2, .7))
XUBU = h(upperleg_l=(.5, .25, -.7), lowerleg_l=(-.1, -.5, -1), foot_l=(.8, .6, 0),
         upperleg_r=(.0, .85, -.6), lowerleg_r=(0, .45, -1), foot_r=(0, .5, -.9),
         chest=dict(vor=-4, dreh=-12),
         upperarm_r=(.3, .9, .1), lowerarm_r=(.0, .45, .9), upperarm_l=(.7, -.6, .35), lowerarm_l=(.3, -.7, -.5))
SPAGAT_HALB = h(upperleg=(1, 0, -.8), lowerleg=(1, 0, -.8), upperarm=(1, 0, .1), lowerarm=(1, 0, .2))
SPAGAT = h(upperleg=(1, 0, -.02), lowerleg=(1, 0, .0), foot=(.2, .3, 1), upperarm=(.6, 0, 1), lowerarm=(.5, 0, 1), head=dict(vor=-6))
def rolle(w): return dict(h(upperleg=(.2, 1, .35), lowerleg=(.1, -.2, -1), upperarm=(.3, 1, -.3), lowerarm=(-.3, .8, .2),
                            chest=dict(vor=35), head=dict(vor=30), hips=dict(vor=w)), lokal=True, alle=True)
HOCKE = h(upperleg=(.3, 1, .2), lowerleg=(.05, -.35, -1), chest=dict(vor=25), upperarm=(.3, 1, -.5), lowerarm=(.1, 1, -.3))

# ---------------------------------------------------------------- Bewegungen: (Sekunde, Haltung)
CLIPS = {
  # Rede-Gesten für alle
  "Geste_Zeigen":        [(0, S), (.25, ZEIG), (.9, ZEIG), (1.2, S)],
  "Geste_Achselzucken":  [(0, S), (.22, ZUCK), (.7, ZUCK), (1.0, S)],
  "Geste_Abwinken":      [(0, S), (.2, WINK1), (.4, WINK2), (.55, WINK1), (.72, WINK2), (1.1, S)],
  "Geste_HaendeReiben":  [(0, S), (.25, REIB_A), (.4, REIB_B), (.55, REIB_A), (.7, REIB_B), (.85, REIB_A), (1.0, REIB_B), (1.3, S)],
  "Geste_ArmeAusbreiten": [(0, S), (.3, BREIT), (1.0, BREIT), (1.35, S)],
  "Geste_Mahnen":        [(0, S), (.25, MAHN_A), (.42, MAHN_B), (.59, MAHN_A), (.76, MAHN_B), (.93, MAHN_A), (1.25, S)],
  "Geste_Nachdenken":    [(0, S), (.4, DENK), (1.8, DENK), (2.2, S)],
  "Geste_HaendeHueften": [(0, S), (.3, HUEFT), (1.6, HUEFT), (1.9, S)],
  "Geste_HandVorStirn":  [(0, S), (.3, STIRN), (1.2, STIRN), (1.5, S)],
  "Geste_Klatschen":     [(0, S), (.2, KLATSCH_A), (.32, KLATSCH_B), (.44, KLATSCH_A), (.56, KLATSCH_B), (.68, KLATSCH_A), (.8, KLATSCH_B), (.92, KLATSCH_A), (1.04, KLATSCH_B), (1.3, S)],
  "Geste_HighFive":      [(0, S), (.3, FIVE_A), (.42, FIVE_A), (.54, FIVE_B), (.72, FIVE_B), (.88, FIVE_A), (1.2, S)],
  "Geste_Nicken":        [(0, S), (.15, NICK), (.3, S), (.45, NICK), (.65, S)],
  "Geste_Kopfschuetteln": [(0, S), (.15, NEIN_A), (.35, NEIN_B), (.55, NEIN_A), (.75, NEIN_B), (.95, S)],
  # Sergeant
  "Sgt_Salutieren":      [(0, S), (.12, SALUT), (1.1, SALUT), (1.22, S)],
  "Sgt_MarschAufDerStelle": [(0, S), (.2, MARSCH_A), (.4, S), (.6, MARSCH_B), (.8, S)],
  "Sgt_FussWippen":      [(0, S), (.12, WIPP), (.25, S), (.37, WIPP), (.5, S)],
  # Mr. Flex
  "Flex_Bizeps":         [(0, S), (.25, BIZEPS_A), (.5, BIZEPS_B), (.7, BIZEPS_A), (.9, BIZEPS_B), (1.6, BIZEPS_B), (1.9, S)],
  "Flex_TeeTrinken":     [(0, S), (.3, TEE_A), (.7, TEE_B), (1.5, TEE_B), (1.9, TEE_A), (2.2, S)],
  "Flex_BrilleSchieben": [(0, S), (.3, BRILLE), (1.4, BRILLE), (1.7, S)],
  "Flex_Fingerpistolen": [(0, S), (.2, PISTOL_A), (.32, PISTOL_B), (.5, PISTOL_A), (.62, PISTOL_B), (.8, PISTOL_A), (1.2, PISTOL_A), (1.5, S)],
  # Kung-Fu
  "KungFu_HoherKick":    [(0, S), (.25, KICK_A), (.33, KICK_A), (.42, KICK_B), (.52, KICK_B), (.64, KICK_A), (.74, KICK_A), (1.0, S)],
  "KungFu_MaBu":         [(0, S), (.25, MABU_ZU), (.4, MABU), (1.4, MABU), (1.75, S)],
  "KungFu_PuBu":         [(0, S), (.4, PUBU), (1.5, PUBU), (1.9, S)],
  "KungFu_XuBu":         [(0, S), (.35, XUBU), (1.4, XUBU), (1.75, S)],
  "KungFu_Spagat":       [(0, S), (.3, SPAGAT_HALB), (.65, SPAGAT), (1.9, SPAGAT), (2.3, SPAGAT_HALB), (2.6, S)],
  "KungFu_RolleVorwaerts": [(0, S), (.2, HOCKE), (.35, rolle(60)), (.5, rolle(140)), (.65, rolle(220)), (.8, rolle(300)), (.95, dict(HOCKE, hips=dict(vor=360))), (1.2, dict(S, hips=dict(vor=360)))],
}

# ---------------------------------------------------------------- Aufbau
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=KOERPER)
arm = next(o for o in bpy.context.scene.objects if o.type == "ARMATURE")
sc = bpy.context.scene
sc.render.fps = FPS
def upd(): bpy.context.view_layer.update()

ad = arm.animation_data or arm.animation_data_create()
for t in list(ad.nla_tracks): ad.nla_tracks.remove(t)
ruhe = bpy.data.actions.get("Idle")
ad.action = ruhe
try: ad.action_slot = ruhe.slots[0]
except Exception as e: print("Hinweis Slot:", e)
sc.frame_set(int(ruhe.frame_range[0])); upd()
BASIS = {pb.name: pb.matrix_basis.copy() for pb in arm.pose.bones}
ad.action = None
for a in list(bpy.data.actions): bpy.data.actions.remove(a)
B = arm.pose.bones
for pb in B: pb.rotation_mode = "QUATERNION"
def ruhig():
    for pb in B: pb.matrix_basis = BASIS[pb.name].copy()
    upd()
ruhig()
SL = 1 if B["upperarm.l"].matrix.to_translation().x > 0 else -1
FUSS = ("foot.l", "foot.r", "toes.l", "toes.r")
KOERPERTEILE = [pb.name for pb in B if not pb.name.startswith(("IK", "control", "elbowIK", "kneeIK", "handIK", "heelIK", "root"))]
def tief(namen): return min(B[n].matrix.to_translation().z for n in namen)
BODEN, BODEN_ALLE = tief(FUSS), tief(KOERPERTEILE)
print("Maße: Kopf z=%.2f, Hüfte z=%.2f, Boden=%.2f, links ist x%+d" % (B["head"].matrix.to_translation().z, B["hips"].matrix.to_translation().z, BODEN, SL))

def welt_drehen(pb, R):
    M = pb.matrix.copy(); k = M.to_translation()
    pb.matrix = Matrix.Translation(k) @ R.to_4x4() @ Matrix.Translation(-k) @ M; upd()
def richte(pb, kind, ziel):
    d = kind.matrix.to_translation() - pb.matrix.to_translation()
    if d.length < 1e-5: return
    welt_drehen(pb, d.normalized().rotation_difference(ziel.normalized()).to_matrix())
KETTE = (("upperarm", "lowerarm"), ("lowerarm", "wrist"), ("upperleg", "lowerleg"), ("lowerleg", "foot"), ("foot", "toes"))
def stelle(p):
    ruhig()
    Rh = Matrix.Identity(3)
    for n in ("hips", "spine", "chest", "head"):
        d = p.get(n)
        if not d: continue
        R = Matrix.Rotation(math.radians(d.get("dreh", 0)), 3, "Z") @ Matrix.Rotation(math.radians(d.get("vor", 0)), 3, "X") @ Matrix.Rotation(math.radians(d.get("seit", 0)), 3, "Y")
        welt_drehen(B[n], R)
        if n == "hips": Rh = R
    for n, kind in KETTE:
        for s, sg in ((".l", SL), (".r", -SL)):
            v = p.get(n + s, p.get(n))
            if v is None: continue
            z = Vector((v[0] * sg, -v[1], v[2]))
            if p.get("lokal"): z = Rh @ z
            richte(B[n + s], B[kind + s], z)
    if p.get("boden", True):
        dz = (BODEN_ALLE - tief(KOERPERTEILE)) if p.get("alle") else (BODEN - tief(FUSS))
        B["hips"].matrix = Matrix.Translation((0, 0, dz + p.get("dz", 0))) @ B["hips"].matrix; upd()

LETZT = {}
def schluessel(f):
    for pb in B:
        q = pb.rotation_quaternion.copy()
        if pb.name in LETZT and q.dot(LETZT[pb.name]) < 0: q.negate(); pb.rotation_quaternion = q
        LETZT[pb.name] = q
        pb.keyframe_insert("rotation_quaternion", frame=f)
        if pb.name == "hips": pb.keyframe_insert("location", frame=f)

# ---------------------------------------------------------------- Kamera für die Prüfbilder
for o in bpy.data.objects:
    if o.type == "MESH" and any(k in o.name for k in ("1H_", "2H_", "Shield", "Cape")): o.hide_render = True
cam = bpy.data.objects.new("k", bpy.data.cameras.new("k")); sc.collection.objects.link(cam); sc.camera = cam
cam.data.type = "ORTHO"; cam.data.ortho_scale = 3.1
w = math.radians(25); cam.location = (8 * math.sin(w), -8 * math.cos(w), 2.0)
ziel = bpy.data.objects.new("z", None); sc.collection.objects.link(ziel); ziel.location = (0, 0, .85)
cam.constraints.new("TRACK_TO").target = ziel
sc.render.engine = "BLENDER_WORKBENCH"; sc.display.shading.light = "STUDIO"; sc.display.shading.color_type = "TEXTURE"
sc.render.resolution_x = sc.render.resolution_y = 220
sc.world = bpy.data.worlds.new("w"); sc.world.color = (.8, .8, .8)
os.makedirs(BILDER, exist_ok=True)

# ---------------------------------------------------------------- Bewegungen bauen
spuren = []
for name, folge in CLIPS.items():
    act = bpy.data.actions.new(name); ad.action = act; LETZT.clear()
    for t, pose in folge:
        stelle(pose); schluessel(1 + round(t * FPS))
    ende = 1 + round(folge[-1][0] * FPS)
    for i in range(BILDZAHL):
        sc.frame_set(1 + round((ende - 1) * i / (BILDZAHL - 1)))
        sc.render.filepath = os.path.join(BILDER, "%s_%02d.png" % (name, i)); bpy.ops.render.render(write_still=True)
    slot = act.slots[0] if getattr(act, "slots", None) else None
    ad.action = None
    spur = ad.nla_tracks.new(); spur.name = name
    streifen = spur.strips.new(name, 1, act)
    try:
        if slot: streifen.action_slot = slot
    except Exception as e: print("Hinweis Streifen:", e)
    spur.mute = True; spuren.append(spur)
    print("gebaut", name, "%.2f s" % folge[-1][0])

if not NURBILD:
    for s in spuren: s.mute = False
    ruhig()
    for o in bpy.data.objects: o.select_set(o == arm)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.export_scene.gltf(filepath=ROH, export_format="GLB", use_selection=True, export_animations=True,
                              export_animation_mode="NLA_TRACKS", export_force_sampling=True, export_optimize_animation_size=True,
                              export_skins=True, export_yup=True)
    print("geschrieben", ROH, round(os.path.getsize(ROH) / 1000), "KB")
print("FERTIG", len(CLIPS))
