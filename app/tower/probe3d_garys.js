/* Figuren-Probe 17.11.2026 (Keys of the Tower): Gary the Great auf drei Arten nebeneinander, im selben Licht.
   1 · eigene Figur per Skript (figuren/gary1.glb aus werkzeuge/blender/tower_gary.py) – Gelenke, die dieses Skript selbst bewegt
   2 · Mixamo-Grundfigur „X Bot“ mit Skelett und fertigen Bewegungen (figuren/gary2_mixamo_xbot.glb), Fuchskopf und Schwanz aufgesteckt
   3 · KayKit Adventurers „Mage“ (CC0) mit Skelett und fertigen Bewegungen (figuren/gary3_kaykit_mage.glb), Kopf und Hut getauscht
   Fuchskopf und Schwanz für 2 und 3 kommen aus figuren/gary_teile.glb und werden hier auf die Knochen gesteckt – so wie später Kleidung im Baukasten.
   Quellen und Lizenzen: figuren/QUELLEN.md. Jede Figur kann stehen, gehen und sich verbeugen (die Verbeugung ist bei allen dreien hier gebaut). */
import * as THREE from "three";

const HALS = 0.785;          // Höhe des Halsansatzes von Gary über dem Boden (aus Art 1); die Grundfiguren werden darauf verkleinert
const BAHN = 2.4, TEMPO = 0.9, VERBEUGEN = 2.4;   // Gehstrecke in m, m/s, Dauer in s
const weich = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const beuge = (z) => weich(z / 0.6) * (1 - weich((z - 1.6) / 0.8));   // 0 → 1 → halten → 0

function schild(text) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 96;
  const x = c.getContext("2d");
  x.fillStyle = "rgba(15,9,6,.82)"; x.beginPath(); x.roundRect(4, 4, 504, 88, 20); x.fill();
  x.fillStyle = "#f3e6d0"; x.font = "600 44px system-ui, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, 256, 50);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, transparent: true }));
  s.scale.set(1.0, 0.19, 1); s.renderOrder = 6;
  return s;
}

/* Ein Teil (Kopf, Schwanz) so auf einen Knochen stecken, dass es in der Grundhaltung aufrecht steht und in der Welt `mass` gross ist. */
function steckeAuf(teil, knochen, figur, mass, versatz) {
  figur.updateMatrixWorld(true);
  const kq = knochen.getWorldQuaternion(new THREE.Quaternion()), fq = figur.getWorldQuaternion(new THREE.Quaternion());
  const ks = knochen.getWorldScale(new THREE.Vector3()).x;
  teil.quaternion.copy(kq.invert().multiply(fq));
  teil.scale.setScalar(mass / ks);
  teil.position.copy(new THREE.Vector3(...versatz).applyQuaternion(teil.quaternion).multiplyScalar(1 / ks));
  knochen.add(teil);
  return teil;
}

export async function baueGarys(lader, szene, plaetze) {
  const [eigen, teile, xbot, mage] = await Promise.all(["gary1", "gary_teile", "gary2_mixamo_xbot", "gary3_kaykit_mage"].map((n) => lader.loadAsync(`figuren/${n}.glb`)));
  const kopfVorlage = teile.scene.getObjectByName("fuchskopf"), schwanzVorlage = teile.scene.getObjectByName("fuchsschwanz");
  const garys = [];

  function neuerGary(art, name, modell, ort, bewege) {
    const anker = new THREE.Group();
    anker.add(modell); anker.position.set(ort.x, 0, ort.z);
    const s = schild(name); s.position.y = 1.78; anker.add(s);
    const schatten = new THREE.Mesh(new THREE.CircleGeometry(0.26, 32), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.38, depthWrite: false }));
    schatten.rotation.x = -Math.PI / 2; schatten.position.y = 0.012; anker.add(schatten);
    szene.add(anker);
    modell.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
    const g = { art, name, anker, modell, z0: ort.z, weg: 0, hin: 1, dreh: 0, modus: "stehen", geht: 0, phase: 0, seit: 0, bewege };
    garys.push(g);
    return g;
  }

  // ---- Art 1: eigene Figur; Gehen, Stehen, Verbeugen entstehen hier aus Formeln an den Gelenken ----
  {
    const m = eigen.scene, j = Object.fromEntries(["huefte", "rumpf", "kopf", "schwanz", "bein_l", "bein_r", "knie_l", "knie_r", "arm_l", "arm_r", "ellbogen_l", "ellbogen_r"].map((n) => [n, m.getObjectByName(n)]));
    const hoehe = j.huefte.position.y;
    neuerGary(1, "1 · Eigene Figur", m, plaetze[0], (g, dt, t) => {
      const s = Math.sin(g.phase), w = g.geht, ruhe = 1 - w, b = g.modus === "verbeugen" ? beuge(g.seit) : 0;
      j.bein_l.rotation.x = -0.6 * s * w; j.bein_r.rotation.x = 0.6 * s * w;
      j.knie_l.rotation.x = Math.max(0, Math.cos(g.phase)) * 0.9 * w; j.knie_r.rotation.x = Math.max(0, -Math.cos(g.phase)) * 0.9 * w;
      j.arm_l.rotation.x = 0.5 * s * w + 0.7 * b; j.arm_r.rotation.x = -0.5 * s * w - 1.1 * b;      // linke Pfote nach hinten, rechte mit dem Stab vor die Brust
      j.arm_l.rotation.z = 0.12 + 0.5 * b; j.arm_r.rotation.z = -0.12 + 0.5 * b;
      j.ellbogen_l.rotation.x = -0.3 * w - 0.1; j.ellbogen_r.rotation.x = -0.3 * w - 0.1 - 1.2 * b;
      j.huefte.position.y = hoehe + Math.abs(Math.cos(g.phase)) * 0.02 * w;
      j.rumpf.rotation.x = 0.06 * w + 0.95 * b; j.rumpf.rotation.y = 0.1 * s * w;
      j.rumpf.scale.y = 1 + Math.sin(t / 900) * 0.015 * ruhe;
      j.kopf.rotation.x = 0.3 * b + Math.sin(t / 3100) * 0.05 * ruhe; j.kopf.rotation.y = Math.sin(t / 2300) * 0.25 * ruhe * (1 - b);
      j.schwanz.rotation.y = Math.sin(t / 260) * (0.18 + 0.2 * w); j.schwanz.rotation.x = -0.5 * b;
    });
  }

  // ---- Art 2 und 3: Grundfigur mit Skelett; Stehen und Gehen sind fertige Bewegungen aus der Bibliothek ----
  function ausBibliothek(art, name, gltf, ort, o) {
    const m = gltf.scene;
    m.traverse((x) => {
      if (o.weg.includes(x.name)) x.visible = false;
      if (x.isMesh && o.farbe) for (const mat of [].concat(x.material)) o.farbe(mat, x);
    });
    const knochen = (n) => m.getObjectByName(n);
    m.updateMatrixWorld(true);
    m.scale.setScalar(HALS / knochen(o.kopf).getWorldPosition(new THREE.Vector3()).y);
    steckeAuf(kopfVorlage.clone(), knochen(o.kopf), m, o.kopfMass, o.kopfVersatz);
    const schwanz = steckeAuf(schwanzVorlage.clone(), knochen(o.becken), m, o.kopfMass, o.schwanzVersatz), schwanzRuhe = schwanz.quaternion.clone();
    const mixer = new THREE.AnimationMixer(m), clip = (n) => mixer.clipAction(gltf.animations.find((a) => a.name === n));
    const stehen = clip(o.stehen), gehen = clip(o.gehen);
    stehen.play(); gehen.play();
    const ruecken = o.ruecken.map(knochen), hoch = new THREE.Vector3(0, 1, 0);
    neuerGary(art, name, m, ort, (g, dt, t) => {
      const b = g.modus === "verbeugen" ? beuge(g.seit) : 0;
      stehen.setEffectiveWeight(1 - g.geht); gehen.setEffectiveWeight(g.geht);
      mixer.update(dt);
      for (const k of ruecken) k.rotateX(o.beugen * b);          // Verbeugung: den Rücken nach vorn rollen, über die fertige Bewegung gelegt
      schwanz.quaternion.copy(schwanzRuhe).multiply(new THREE.Quaternion().setFromAxisAngle(hoch, Math.sin(t / 260) * (0.18 + 0.2 * g.geht)));
    });
  }
  ausBibliothek(2, "2 · Mixamo", xbot, plaetze[1], {
    weg: [], kopf: "mixamorigHead", becken: "mixamorigHips", ruecken: ["mixamorigSpine", "mixamorigSpine1", "mixamorigSpine2"], beugen: 0.36,
    stehen: "idle", gehen: "walk", kopfMass: 0.8, kopfVersatz: [0, -0.02, 0], schwanzVersatz: [0, 0.02, -0.07],
    farbe: (mat, netz) => { mat.color.set(netz.name === "Beta_Joints" ? 0x1a120c : 0xcc5212); mat.metalness = 0; mat.roughness = 0.9; },
  });
  ausBibliothek(3, "3 · KayKit", mage, plaetze[2], {
    weg: ["Mage_Head", "Mage_Hat", "Spellbook", "Spellbook_open", "2H_Staff"], kopf: "head", becken: "hips", ruecken: ["spine", "chest"], beugen: 0.5,
    stehen: "Idle", gehen: "Walking_A", kopfMass: 1.0, kopfVersatz: [0, -0.03, 0], schwanzVersatz: [0, 0.0, -0.10],
    farbe: null,
  });

  return {
    liste: () => garys.map((g) => ({ art: g.art, modus: g.modus, weg: +g.weg.toFixed(2) })),
    befehl(modus) { for (const g of garys) { g.modus = modus; g.seit = 0; } },
    bewege(dt, t) {
      for (const g of garys) {
        g.seit += dt;
        if (g.modus === "verbeugen" && g.seit > VERBEUGEN) g.modus = "stehen";
        const unterwegs = g.modus === "gehen";
        if (unterwegs) {                                    // auf der Bahn hin und her, am Ende umdrehen
          const schritt = TEMPO * dt;
          g.weg += g.hin * schritt; g.phase += schritt * 9;
          if (g.weg > BAHN) { g.weg = BAHN; g.hin = -1; }
          if (g.weg < 0) { g.weg = 0; g.hin = 1; }
        }
        const soll = unterwegs && g.hin < 0 ? Math.PI : 0;   // im Stehen und beim Verbeugen zur Tür (zum Spieler) gewandt
        g.dreh += (soll - g.dreh) * Math.min(1, dt * 7);
        g.geht += ((unterwegs ? 1 : 0) - g.geht) * Math.min(1, dt * 6);
        g.anker.position.z = g.z0 + g.weg; g.modell.rotation.y = g.dreh;
        g.bewege(g, dt, t);
      }
    },
  };
}
