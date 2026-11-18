/* The Keys of the Tower – PROBE „Körperbau als Wert je Figur“ (A3/A4, 18.11.2026; vorläufig, fällt weg, wenn Mr. Flex gebaut ist).
   Ein KayKit-Körper (Mage mit seinem vorläufigen Kopf) wird über vier Zahlen gestreckt und bekommt Hände zum Wechseln.
   Gary und probe3d_figuren.js sind davon unberührt.

   So geht das Strecken: Nach jedem Bild werden die Abstände der Gelenke vergrößert (die Haut zwischen den Gelenken zieht sich mit),
   die Hüfte steht entsprechend höher, der Kopf-Knochen wird kleiner. Kein neues Modell, keine Datei je Figur.
   Achtung: Der Mixer schreibt Knochen nur neu, wenn sich ihr Wert ändert – deshalb den Rohwert der Hüfte merken.
   Stiefel: Sie hängen an einem eigenen Hilfsknochen unten am Unterschenkel und behalten ihre Länge; es wächst nur die Hose (stiefelFest).
   Boden: Nach jedem Bild wird der tiefste Punkt des Körpers auf den Boden gesetzt (auch im Spagat, bei jedem Maß). */
import * as THREE from "three";

export const BAU_START = { arm: 1.8, bein: 3.0, kopf: 0.66, rumpf: 1.16 };   // Maße von Mr. Alex für Mr. Flex (18.11.)
const HAND = 1.7, HALS = 0.785;                        // Handgröße (Mr. Alex 18.11.: die Dicke passt) · Halshöhe des ungestreckten Körpers wie bei Gary
const STIEFEL = { kante: 0.335, knie: 0.42 };          // Mage-Körper: bis hier reicht der Stiefel · bis hier der Ring direkt über dem Knie (Höhen im ungestreckten Körper)
const R = "offen", Z = "zeigen", F = "faust";
/* Gesten-Tabelle: Knopf → [Bewegung, Beschriftung, Gruppe, Handform]. Handform: eine für beide Hände oder [rechts, links];
   null = die Hände bleiben, wie sie am Schalter gewählt sind. Nach der Geste gilt wieder der Schalter. */
export const GESTEN = {
  stehen: ["Idle", "Stehen", "Grund", null], gehen: ["Walking_A", "Gehen", "Grund", null], rennen: ["Running_A", "Rennen", "Grund", null],
  zeigen: ["Geste_Zeigen", "Zeigen", "Rede-Gesten", [Z, R]], achselzucken: ["Geste_Achselzucken", "Achselzucken", "Rede-Gesten", R], abwinken: ["Geste_Abwinken", "Abwinken", "Rede-Gesten", R],
  reiben: ["Geste_HaendeReiben", "Hände reiben", "Rede-Gesten", R], arme: ["Geste_ArmeAusbreiten", "Arme ausbreiten", "Rede-Gesten", R], mahnen: ["Geste_Mahnen", "Mahnen", "Rede-Gesten", [Z, R]],
  denken: ["Geste_Nachdenken", "Nachdenken", "Rede-Gesten", [F, R]], hueften: ["Geste_HaendeHueften", "Hände in die Hüften", "Rede-Gesten", F], stirn: ["Geste_HandVorStirn", "Hand vor die Stirn", "Rede-Gesten", R],
  klatschen: ["Geste_Klatschen", "Klatschen", "Rede-Gesten", R], highfive: ["Geste_HighFive", "High five", "Rede-Gesten", R], nicken: ["Geste_Nicken", "Nicken", "Rede-Gesten", null],
  kopfschuetteln: ["Geste_Kopfschuetteln", "Kopfschütteln", "Rede-Gesten", null],
  salut: ["Sgt_Salutieren", "Salutieren", "Sergeant", R], marsch: ["Sgt_MarschAufDerStelle", "Marsch auf der Stelle", "Sergeant", F], wippen: ["Sgt_FussWippen", "Fußwippen", "Sergeant", null],
  bizeps: ["Flex_Bizeps", "Bizeps", "Mr. Flex", F], tee: ["Flex_TeeTrinken", "Tee trinken", "Mr. Flex", [F, R]], brille: ["Flex_BrilleSchieben", "Brille schieben", "Mr. Flex", [Z, R]],
  pistolen: ["Flex_Fingerpistolen", "Fingerpistolen", "Mr. Flex", Z],
  kick: ["KungFu_HoherKick", "Kick", "Kung-Fu", F], mabu: ["KungFu_MaBu", "Ma Bu", "Kung-Fu", F], pubu: ["KungFu_PuBu", "Pu Bu", "Kung-Fu", R], xubu: ["KungFu_XuBu", "Xu Bu", "Kung-Fu", R],
  spagat: ["KungFu_Spagat", "Spagat", "Kung-Fu", R], rolle: ["KungFu_RolleVorwaerts", "Rolle vorwärts", "Kung-Fu", F],
};
const DAUERND = ["stehen", "gehen", "rennen"];
const v = () => new THREE.Vector3();

/* Stiefel behalten ihre Länge: Alles unterhalb der Stiefelkante hängt an einem Hilfsknochen, der mit dem Unterschenkel nach unten wandert;
   der Ring über dem Knie gehört ganz zum Unterschenkel, die Hose darüber ganz zum Oberschenkel. So wächst nur die Hose. */
function stiefelFest(m, K) {
  const helfer = {};
  for (const [s, seite] of [["l", "Left"], ["r", "Right"]]) {
    let netz = null; m.traverse((o) => { if (o.isSkinnedMesh && o.name.endsWith("Leg" + seite)) netz = o; });
    if (!netz) continue;
    const alt = netz.skeleton, unter = K("lowerleg" + s), H = new THREE.Bone(); H.name = "stiefel" + s; unter.add(H);
    const knochen = [...alt.bones, H], kehr = [...alt.boneInverses.map((x) => x.clone()), alt.boneInverses[alt.bones.indexOf(unter)].clone()];
    const iO = knochen.indexOf(K("upperleg" + s)), iU = knochen.indexOf(unter), iH = knochen.length - 1;
    const P = netz.geometry.attributes.position, I = netz.geometry.attributes.skinIndex, W = netz.geometry.attributes.skinWeight;
    for (let i = 0; i < P.count; i++) {
      const y = P.getY(i); let w = new Map();
      for (let k = 0; k < 4; k++) { const g = W.getComponent(i, k), n = I.getComponent(i, k); if (g > 0) w.set(n, (w.get(n) || 0) + g); }
      if (y >= STIEFEL.knie) w = new Map([[iO, 1]]);
      else if (y >= STIEFEL.kante) w = new Map([[iU, 1]]);
      else { w.delete(iO); if (w.has(iU)) { w.set(iH, w.get(iU)); w.delete(iU); } if (!w.size) w.set(iH, 1); }
      const liste = [...w].sort((a, b) => b[1] - a[1]).slice(0, 4), summe = liste.reduce((a, x) => a + x[1], 0);
      for (let k = 0; k < 4; k++) { I.setComponent(i, k, liste[k] ? liste[k][0] : 0); W.setComponent(i, k, liste[k] ? liste[k][1] / summe : 0); }
    }
    I.needsUpdate = W.needsUpdate = true;
    netz.bind(new THREE.Skeleton(knochen, kehr), netz.bindMatrix);
    helfer[s] = H;
  }
  return helfer;
}

export async function ladeBauProbe(lader, szene, platz) {
  const lade = (n) => lader.loadAsync(`figuren/${n}.glb`), clips = {};
  const [koerper, haende, ...dateien] = await Promise.all([lade("probe_mage_ganz"), lade("haende"), lade("kaykit_bewegungen"), lade("gesten"), lade("kungfu")]);
  for (const d of dateien) for (const c of d.animations) clips[c.name] = c;
  const m = koerper.scene, K = (n) => m.getObjectByName(n), bau = { ...BAU_START };
  const haut = []; m.traverse((o) => { if (o.isMesh) o.frustumCulled = false; if (o.isSkinnedMesh && !/Cape/.test(o.name)) haut.push(o); });
  const anker = new THREE.Group(); anker.add(m); anker.position.set(platz.x, 0, platz.z); szene.add(anker);
  m.updateMatrixWorld(true);
  const mass = HALS / K("head").getWorldPosition(v()).y;
  m.scale.setScalar(mass); anker.updateMatrixWorld(true);
  const schatten = new THREE.Mesh(new THREE.CircleGeometry(0.28, 32), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.38, depthWrite: false }));
  schatten.rotation.x = -Math.PI / 2; schatten.position.y = 0.012; anker.add(schatten);

  const gruppen = { arm: [], bein: [], rumpf: ["spine", "chest", "head"].map(K) };
  for (const s of "lr") { gruppen.arm.push(K("lowerarm" + s), K("wrist" + s)); gruppen.bein.push(K("lowerleg" + s), K("foot" + s)); }
  const ruhe = new Map(Object.values(gruppen).flat().map((b) => [b, b.position.clone()]));
  const hips = K("hips"), head = K("head");
  const hueftHoehe = hips.getWorldPosition(v()).y / mass, beinLaenge = K("lowerlegl").position.length() + K("footl").position.length();

  // Hände zum Wechseln: der Fäustling schrumpft weg, am Handgelenk sitzt ein Halter mit den drei Formen (links gespiegelt)
  const halter = {};
  for (const [s, vz] of [["r", -1], ["l", 1]]) {
    const gelenk = K("wrist" + s), ort = gelenk.getWorldPosition(v()), arm = ort.clone().sub(K("lowerarm" + s).getWorldPosition(v())).normalize();
    const h = new THREE.Group(); szene.add(h);
    h.position.copy(ort); h.quaternion.setFromUnitVectors(new THREE.Vector3(vz, 0, 0), arm); h.scale.set(-vz * mass * HAND, mass * HAND, mass * HAND);
    for (const f of [R, Z, F]) { const t = haende.scene.getObjectByName("hand_" + f).clone(); t.name = f; t.position.set(0, 0, 0); t.frustumCulled = false; h.add(t); }
    h.updateMatrixWorld(true); gelenk.attach(h); halter[s] = h;
  }
  const stiefel = stiefelFest(m, K);

  const mixer = new THREE.AnimationMixer(m), roh = hips.position.clone(), gesetzt = v().set(NaN, NaN, NaN), kasten = new THREE.Box3(), teil = new THREE.Box3();
  const hoeher = () => (hueftHoehe + (bau.bein - 1) * beinLaenge) / hueftHoehe;
  const tief = () => {                                  // tiefster Punkt von Körper und Händen (ohne Umhang), mit allen Verformungen
    kasten.makeEmpty();
    for (const n of haut) { n.computeBoundingBox(); kasten.union(teil.copy(n.boundingBox).applyMatrix4(n.matrixWorld)); }
    for (const s of "lr") kasten.union(teil.setFromObject(halter[s]));
    return kasten.min.y;
  };
  const nach = () => {                                  // nach jedem Bild: strecken, Kopf verkleinern, tiefsten Punkt auf den Boden
    for (const [art, liste] of Object.entries(gruppen)) for (const b of liste) b.position.copy(ruhe.get(b)).multiplyScalar(bau[art]);
    for (const s of "lr") if (stiefel[s]) stiefel[s].position.copy(ruhe.get(K("foot" + s))).multiplyScalar(bau.bein - 1);
    if (!hips.position.equals(gesetzt)) roh.copy(hips.position);
    hips.position.copy(roh).multiplyScalar(hoeher()); gesetzt.copy(hips.position);
    head.scale.setScalar(bau.kopf);
    for (const s of "lr") K("hand" + s).scale.setScalar(0.001);
    m.position.y = 0; anker.updateMatrixWorld(true);
    const t = tief();
    if (Math.abs(t) > 0.002) { m.position.y = -t; anker.updateMatrixWorld(true); }
  };
  const aktion = {};
  for (const [knopf, [name]] of Object.entries(GESTEN)) {
    const a = mixer.clipAction(clips[name]); aktion[knopf] = a;
    if (!DAUERND.includes(knopf)) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
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
  const g = { modus: "stehen", wahl: R, hand: [R, R], weg: 0, hin: 1, dreh: 0, bahn: platz.bahn || 2.4, laeuft: null };
  const zeigeHand = (form) => {                         // form: eine Handform für beide oder [rechts, links]
    g.hand = Array.isArray(form) ? form : [form, form];
    [halter.r, halter.l].forEach((h, i) => { for (const t of h.children) t.visible = t.name === g.hand[i]; });
  };
  const starte = (modus) => {
    const a = aktion[modus]; if (!a) return;
    if (g.laeuft && g.laeuft !== a) g.laeuft.fadeOut(0.18);
    a.reset().setEffectiveWeight(1).fadeIn(0.18).play(); g.laeuft = a; g.modus = modus;
    zeigeHand(GESTEN[modus][3] || g.wahl);              // die Handform wechselt mit der Geste und danach zurück zum Schalter
  };
  mixer.addEventListener("finished", (e) => { if (e.action === g.laeuft) starte("stehen"); });   // nur die laufende Geste führt zurück ins Stehen, keine schon abgelöste
  messeTempo(); starte("stehen"); mixer.update(0); nach();

  return {
    befehl: starte,
    haende(form) { g.wahl = form; zeigeHand(GESTEN[g.modus][3] || form); },
    setze(name, wert) { if (name in bau && wert > 0) { bau[name] = wert; const modus = g.modus; messeTempo(); g.laeuft = null; starte(DAUERND.includes(modus) ? modus : "stehen"); } },
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
    zustand: () => ({ modus: g.modus, hand: g.hand, wahl: g.wahl, weg: +g.weg.toFixed(2), bau: { ...bau }, schritt: +hoeher().toFixed(2), gehen: +tempo.gehen.toFixed(2), rennen: +tempo.rennen.toFixed(2),
      hals: +head.getWorldPosition(v()).y.toFixed(3), tief: +tief().toFixed(3), zehe: +Math.max(K("toesr").getWorldPosition(v()).y, K("toesl").getWorldPosition(v()).y).toFixed(3),
      knie: +K("lowerlegl").getWorldPosition(v()).y.toFixed(3), stiefelOben: +(stiefel.l.getWorldPosition(v()).y + (STIEFEL.kante - 0.293) * mass).toFixed(3),
      faustR: K("wristr").getWorldPosition(v()).toArray().map((x) => +x.toFixed(2)), faustL: K("wristl").getWorldPosition(v()).toArray().map((x) => +x.toFixed(2)),
      ort: [+anker.position.x.toFixed(2), +anker.position.z.toFixed(2)] }),
  };
}
