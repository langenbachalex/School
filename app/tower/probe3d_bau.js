/* The Keys of the Tower – PROBE „Körperbau als Wert je Figur“ (A3, 18.11.2026; vorläufig, fällt weg, wenn Mr. Flex gebaut ist).
   Ein KayKit-Körper (Mage mit seinem vorläufigen Kopf) wird über vier Zahlen gestreckt und bekommt Hände zum Wechseln.
   Gary und probe3d_figuren.js sind davon unberührt.

   So geht das Strecken: Nach jedem Bild werden die Abstände der Gelenke vergrößert (die Haut zwischen den Gelenken zieht sich mit),
   die Hüfte steht entsprechend höher, der Kopf-Knochen wird kleiner. Kein neues Modell, keine Datei je Figur.
   Achtung: Der Mixer schreibt Knochen nur neu, wenn sich ihr Wert ändert – deshalb den Rohwert der Hüfte merken. */
import * as THREE from "three";

export const BAU_START = { arm: 1.6, bein: 2.0, kopf: 0.72, rumpf: 0.9 };
const HAND = 1.7, HALS = 0.785;                        // Handgröße (Mr. Alex 18.11.: die Dicke passt) · Halshöhe des ungestreckten Körpers wie bei Gary
const DAUER = { stehen: "Idle", gehen: "Walking_A", rennen: "Running_A" };
const EINMAL = { achselzucken: "Geste_Achselzucken", zeigen: "Geste_Zeigen", abwinken: "Geste_Abwinken", arme: "Geste_ArmeAusbreiten",
  kick: "KungFu_HoherKick", mabu: "KungFu_MaBu", pubu: "KungFu_PuBu", spagat: "KungFu_Spagat" };
const v = () => new THREE.Vector3();

export async function ladeBauProbe(lader, szene, platz) {
  const lade = (n) => lader.loadAsync(`figuren/${n}.glb`), clips = {};
  const [koerper, haende, ...dateien] = await Promise.all([lade("probe_mage_ganz"), lade("haende"), lade("kaykit_bewegungen"), lade("gesten"), lade("kungfu")]);
  for (const d of dateien) for (const c of d.animations) clips[c.name] = c;
  const m = koerper.scene, K = (n) => m.getObjectByName(n), bau = { ...BAU_START };
  m.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
  const anker = new THREE.Group(); anker.add(m); anker.position.set(platz.x, 0, platz.z); szene.add(anker);
  m.updateMatrixWorld(true);
  const mass = HALS / K("head").getWorldPosition(v()).y;
  m.scale.setScalar(mass); anker.updateMatrixWorld(true);
  const schatten = new THREE.Mesh(new THREE.CircleGeometry(0.28, 32), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.38, depthWrite: false }));
  schatten.rotation.x = -Math.PI / 2; schatten.position.y = 0.012; anker.add(schatten);

  const gruppen = { arm: [], bein: [], rumpf: ["spine", "chest", "head"].map(K) };
  for (const s of "lr") { gruppen.arm.push(K("lowerarm" + s), K("wrist" + s)); gruppen.bein.push(K("lowerleg" + s), K("foot" + s)); }
  const ruhe = new Map(Object.values(gruppen).flat().map((b) => [b, b.position.clone()]));
  const hips = K("hips"), head = K("head"), fuesse = ["footl", "footr", "toesl", "toesr"].map(K);
  const hueftHoehe = hips.getWorldPosition(v()).y / mass, beinLaenge = K("lowerlegl").position.length() + K("footl").position.length();
  const tief = () => Math.min(...fuesse.map((f) => f.getWorldPosition(v()).y));
  const fussRuhe = tief();

  // Hände zum Wechseln: der Fäustling schrumpft weg, am Handgelenk sitzt ein Halter mit den drei Formen (links gespiegelt)
  const halter = [];
  for (const [s, vz] of [["r", -1], ["l", 1]]) {
    const gelenk = K("wrist" + s), ort = gelenk.getWorldPosition(v()), arm = ort.clone().sub(K("lowerarm" + s).getWorldPosition(v())).normalize();
    const h = new THREE.Group(); szene.add(h);
    h.position.copy(ort); h.quaternion.setFromUnitVectors(new THREE.Vector3(vz, 0, 0), arm); h.scale.set(-vz * mass * HAND, mass * HAND, mass * HAND);
    for (const f of ["offen", "zeigen", "faust"]) { const t = haende.scene.getObjectByName("hand_" + f).clone(); t.name = f; t.position.set(0, 0, 0); t.frustumCulled = false; h.add(t); }
    h.updateMatrixWorld(true); gelenk.attach(h); halter.push(h);
  }

  const mixer = new THREE.AnimationMixer(m), roh = hips.position.clone(), gesetzt = v().set(NaN, NaN, NaN);
  const hoeher = () => (hueftHoehe + (bau.bein - 1) * beinLaenge) / hueftHoehe;
  const nach = () => {                                  // nach jedem Bild: strecken, Kopf verkleinern, Füße auf den Boden
    for (const [art, liste] of Object.entries(gruppen)) for (const b of liste) b.position.copy(ruhe.get(b)).multiplyScalar(bau[art]);
    if (!hips.position.equals(gesetzt)) roh.copy(hips.position);
    hips.position.copy(roh).multiplyScalar(hoeher()); gesetzt.copy(hips.position);
    head.scale.setScalar(bau.kopf);
    for (const s of "lr") K("hand" + s).scale.setScalar(0.001);
    m.position.y = 0; anker.updateMatrixWorld(true);
    const t = tief();
    if (t < fussRuhe - 0.003) { m.position.y = fussRuhe - t; anker.updateMatrixWorld(true); }   // tiefe Haltungen (Spagat): nicht im Boden versinken
  };
  const aktion = {};
  for (const [knopf, name] of Object.entries({ ...DAUER, ...EINMAL })) {
    const a = mixer.clipAction(clips[name]); aktion[knopf] = a;
    if (EINMAL[knopf]) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
  }
  // Wie schnell trägt ein Schritt bei diesen Beinen? Wie bei Gary am Fuß gemessen, damit nichts rutscht.
  const tempo = { gehen: 0, rennen: 0 };
  const messeTempo = () => {
    const fuss = K("footl"), p = v();
    for (const art of ["gehen", "rennen"]) {
      const a = aktion[art], dauer = a.getClip().duration, N = 32, z = [];
      mixer.stopAllAction(); gesetzt.set(NaN, NaN, NaN); a.reset().play();
      for (let i = 0; i <= N; i++) { a.time = (dauer * (i % N)) / N; mixer.update(0); nach(); z.push(anker.worldToLocal(fuss.getWorldPosition(p)).z); }
      const zurueck = z.slice(1).map((w, i) => ((z[i] - w) * N) / dauer).sort((x, y) => y - x);
      tempo[art] = (zurueck[0] + zurueck[1] + zurueck[2] + zurueck[3]) / 4;
    }
    mixer.stopAllAction(); gesetzt.set(NaN, NaN, NaN);
  };
  const g = { modus: "stehen", hand: "offen", weg: 0, hin: 1, dreh: 0, bahn: platz.bahn || 2.4, laeuft: null };
  const starte = (modus) => {
    const a = aktion[modus]; if (!a) return;
    if (g.laeuft && g.laeuft !== a) g.laeuft.fadeOut(0.18);
    a.reset().setEffectiveWeight(1).fadeIn(0.18).play(); g.laeuft = a; g.modus = modus;
  };
  mixer.addEventListener("finished", () => starte("stehen"));
  const zeigeHand = (form) => { g.hand = form; for (const h of halter) for (const t of h.children) t.visible = t.name === form; };
  messeTempo(); zeigeHand("offen"); starte("stehen"); mixer.update(0); nach();

  return {
    befehl: starte,
    haende: zeigeHand,
    setze(name, wert) { if (name in bau && wert > 0) { bau[name] = wert; const modus = g.modus; messeTempo(); g.laeuft = null; starte(DAUER[modus] ? modus : "stehen"); } },
    bewege(dt) {
      const unterwegs = g.modus === "gehen" || g.modus === "rennen";
      if (unterwegs) {
        g.weg += g.hin * tempo[g.modus] * dt;                                    // auf der Bahn hin und her, am Ende umdrehen (wie Gary)
        if (g.weg > g.bahn) { g.weg = g.bahn; g.hin = -1; }
        if (g.weg < 0) { g.weg = 0; g.hin = 1; }
      }
      const soll = unterwegs && g.hin < 0 ? Math.PI : 0;
      g.dreh += (soll - g.dreh) * Math.min(1, dt * 7);
      anker.position.z = platz.z + g.weg; m.rotation.y = g.dreh;
      mixer.update(dt); nach();
    },
    zustand: () => ({ modus: g.modus, hand: g.hand, weg: +g.weg.toFixed(2), bau: { ...bau }, schritt: +hoeher().toFixed(2), gehen: +tempo.gehen.toFixed(2), rennen: +tempo.rennen.toFixed(2),
      hals: +head.getWorldPosition(v()).y.toFixed(3), fussTief: +tief().toFixed(3), zehe: +Math.max(K("toesr").getWorldPosition(v()).y, K("toesl").getWorldPosition(v()).y).toFixed(3),
      handBreit: +new THREE.Box3().setFromObject(halter[0]).getSize(v()).length().toFixed(3), ort: [+anker.position.x.toFixed(2), +anker.position.z.toFixed(2)] }),
  };
}
