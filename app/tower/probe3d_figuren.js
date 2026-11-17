/* Figuren für The Keys of the Tower (Block A, 17.11.2026; Entscheidung Mr. Alex nach der Probe mit drei Garys):
   Jede Figur = ein Körper aus „KayKit Adventurers“ (CC0) + eigener Kopf aus Blender, auf die Knochen gesteckt (steckeAuf).
   Alle Körper teilen sich ein Skelett, deshalb wird figuren/kaykit_bewegungen.glb nur einmal geladen und gilt für alle.
   Stehen und Gehen sind fertige Bewegungen, Gesten laufen einmal ab; Reden und Verbeugen entstehen hier und liegen über dem Stehen.
   Dateien bauen: node werkzeuge/glb_teilen.js (Körper, Bewegungen) · blender -b --python werkzeuge/blender/tower_gary.py (Kopf, Schwanz).
   Quellen und Lizenzen: figuren/QUELLEN.md. */
import * as THREE from "three";

const BAHN = 2.4, TEMPO = 0.9, VERBEUGEN = 2.4;   // Gehstrecke in m, m/s, Dauer in s
const weich = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const beuge = (z) => weich(z / 0.6) * (1 - weich((z - 1.6) / 0.8));   // 0 → 1 → halten → 0
const HOCH = new THREE.Vector3(0, 1, 0);

/* hals = Höhe des Halsansatzes über dem Boden (darauf wird der Körper verkleinert) · weg = Teile des Körpers, die nicht gezeigt werden
   teile = aufgesteckte Stücke [Name in der Teile-Datei, Knochen, Größe, Versatz] · gesten = Knopf → Bewegung aus der Bibliothek */
const FIGUREN = {
  gary: {
    koerper: "koerper_mage", teileDatei: "gary_teile", hals: 0.785, weg: [],
    teile: { kopf: ["fuchskopf", "head", 1.0, [0, -0.03, 0]], schwanz: ["fuchsschwanz", "hips", 1.0, [0, 0, -0.10]] },
    gesten: { zaubern: "Spellcast_Long", tadaa: "Cheer", schreck: "Hit_A" },
  },
};

/* Ein Teil (Kopf, Schwanz, später Kleidung) so auf einen Knochen stecken, dass es in der Grundhaltung aufrecht steht und in der Welt `mass` gross ist. */
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

export async function ladeFiguren(lader, szene, orte) {
  const lade = (n) => lader.loadAsync(`figuren/${n}.glb`);
  const bewegungen = (await lade("kaykit_bewegungen")).animations;
  const figuren = [];

  for (const [name, ort] of Object.entries(orte)) {
    const o = FIGUREN[name], [koerper, teile] = await Promise.all([lade(o.koerper), lade(o.teileDatei)]);
    const m = koerper.scene, knochen = (n) => m.getObjectByName(n);
    m.traverse((x) => { if (o.weg.includes(x.name)) x.visible = false; if (x.isMesh) x.frustumCulled = false; });
    m.updateMatrixWorld(true);
    m.scale.setScalar(o.hals / knochen("head").getWorldPosition(new THREE.Vector3()).y);
    const stueck = {};
    for (const [platz, [teil, an, mass, versatz]] of Object.entries(o.teile)) stueck[platz] = steckeAuf(teile.scene.getObjectByName(teil).clone(), knochen(an), m, mass, versatz);
    const schwanzRuhe = stueck.schwanz ? stueck.schwanz.quaternion.clone() : null;

    const anker = new THREE.Group();
    anker.add(m); anker.position.set(ort.x, 0, ort.z);
    const schatten = new THREE.Mesh(new THREE.CircleGeometry(0.26, 32), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.38, depthWrite: false }));
    schatten.rotation.x = -Math.PI / 2; schatten.position.y = 0.012; anker.add(schatten);
    szene.add(anker);

    const mixer = new THREE.AnimationMixer(m), clip = (n) => mixer.clipAction(bewegungen.find((a) => a.name === n));
    const stehen = clip("Idle"), gehen = clip("Walking_A"), gesten = {};
    stehen.play(); gehen.play();
    for (const [knopf, n] of Object.entries(o.gesten)) {
      const a = clip(n); a.setLoop(THREE.LoopOnce); a.clampWhenFinished = true; a.setEffectiveWeight(0);
      gesten[knopf] = { a, dauer: a.getClip().duration, gewicht: 0 };
    }
    const kopf = knochen("head"), ruecken = [knochen("spine"), knochen("chest")];
    // Messwerte fürs Testprogramm: wie weit Kopf und Rumpf aus der Grundhaltung gedreht sind (Grad), wie weit der Hut neben den Füßen steht (m)
    const lage = (kind, eltern) => eltern.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(kind.getWorldQuaternion(new THREE.Quaternion()));
    const kopfRuhe = lage(kopf, ruecken[1]), rumpfRuhe = lage(ruecken[1], m);
    const grad = (q, ruhe) => +(q.angleTo(ruhe) * 180 / Math.PI).toFixed(1);
    const mass = () => { const p = stueck.kopf.getWorldPosition(new THREE.Vector3()); return { kopfWinkel: grad(lage(kopf, ruecken[1]), kopfRuhe), rumpfWinkel: grad(lage(ruecken[1], m), rumpfRuhe), hutAbstand: +Math.hypot(p.x - anker.position.x, p.z - anker.position.z).toFixed(2) }; };

    figuren.push({
      name, anker, mass, modell: m, z0: ort.z, weg: 0, hin: 1, dreh: 0, modus: "stehen", geht: 0, redet: 0, seit: 0,
      start(modus) { this.modus = modus; this.seit = 0; if (gesten[modus]) gesten[modus].a.reset().play(); },
      bewege(dt, t) {
        const g = this, geste = gesten[g.modus];
        g.seit += dt;
        if ((g.modus === "verbeugen" && g.seit > VERBEUGEN) || (geste && g.seit > geste.dauer - 0.2)) g.modus = "stehen";
        const unterwegs = g.modus === "gehen";
        if (unterwegs) {                                    // auf der Bahn hin und her, am Ende umdrehen
          g.weg += g.hin * TEMPO * dt;
          if (g.weg > BAHN) { g.weg = BAHN; g.hin = -1; }
          if (g.weg < 0) { g.weg = 0; g.hin = 1; }
        }
        const soll = unterwegs && g.hin < 0 ? Math.PI : 0;   // im Stehen zur Tür (zum Spieler) gewandt
        g.dreh += (soll - g.dreh) * Math.min(1, dt * 7);
        g.geht += ((unterwegs ? 1 : 0) - g.geht) * Math.min(1, dt * 6);
        g.redet += ((g.modus === "reden" ? 1 : 0) - g.redet) * Math.min(1, dt * 6);
        anker.position.z = g.z0 + g.weg; m.rotation.y = g.dreh;
        let summe = 0;                                       // Gesten weich ein- und ausblenden, der Rest teilt sich Stehen und Gehen
        for (const [knopf, x] of Object.entries(gesten)) {
          x.gewicht += ((knopf === g.modus ? 1 : 0) - x.gewicht) * Math.min(1, dt * 8);
          x.a.setEffectiveWeight(x.gewicht); summe += x.gewicht;
        }
        const rest = Math.max(0, 1 - summe);
        stehen.setEffectiveWeight((1 - g.geht) * rest); gehen.setEffectiveWeight(g.geht * rest);
        mixer.update(dt);
        const b = g.modus === "verbeugen" ? beuge(g.seit) : 0, r = g.redet;
        for (const k of ruecken) k.rotateX(0.5 * b + 0.04 * r * Math.sin(t / 310));          // Verbeugung: den Rücken nach vorn rollen
        kopf.rotateX(r * (0.10 * Math.sin(t / 95) + 0.07 * Math.sin(t / 233)));               // Reden: der Kopf nickt und wiegt sich lebhaft
        kopf.rotateY(r * 0.16 * Math.sin(t / 410)); kopf.rotateZ(r * 0.07 * Math.sin(t / 170));
        if (schwanzRuhe) stueck.schwanz.quaternion.copy(schwanzRuhe).multiply(new THREE.Quaternion().setFromAxisAngle(HOCH, Math.sin(t / 260) * (0.18 + 0.2 * g.geht + 0.15 * r)));
      },
    });
  }

  return {
    liste: () => figuren.map((g) => ({ name: g.name, modus: g.modus, weg: +g.weg.toFixed(2), ort: [g.anker.position.x, g.anker.position.z], ...g.mass() })),
    befehl(modus) { for (const g of figuren) g.start(modus); },
    bewege(dt, t) { for (const g of figuren) g.bewege(dt, t); },
  };
}
