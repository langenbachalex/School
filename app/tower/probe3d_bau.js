/* The Keys of the Tower – PROBE „Körperbau als Wert je Figur“ (A3 bis A5, 18.11.2026; vorläufig, fällt weg, wenn Mr. Flex gebaut ist).
   Ein KayKit-Körper (Mage mit seinem vorläufigen Kopf) wird über Zahlen gestreckt und bekommt Hände mit beweglichen Fingern.
   Gary und probe3d_figuren.js sind davon unberührt.

   Strecken: Nach jedem Bild werden die Abstände der Gelenke vergrößert (die Haut zwischen den Gelenken zieht sich mit),
   die Hüfte steht entsprechend höher, der Kopf-Knochen wird kleiner. Kein neues Modell, keine Datei je Figur.
   Achtung: Der Mixer schreibt Knochen nur neu, wenn sich ihr Wert ändert – deshalb den Rohwert der Hüfte merken.
   Knie: `knie` = Höhe des Knies als Anteil der Hüfthöhe; Ober- und Unterschenkel teilen sich die Beinlänge danach.
   Stiefel: hängen an einem Hilfsknochen unten am Unterschenkel und behalten ihre Länge; es wächst nur die Hose (stiefelFest).
   Mantel: der Saum folgt den Oberschenkeln, damit ein hohes Bein ihn anhebt statt durchzustoßen (mantelFolgt).
   Handziele: Gesten mit Berührung nennen ein Ziel am Körper (ZIELE); Schulter und Ellenbogen werden so gestellt, dass die Hand
   dort ankommt – egal wie lang die Arme sind.
   Boden: Nach jedem Bild wird der tiefste Punkt des Körpers auf den Boden gesetzt (auch im Spagat, bei jedem Maß). */
import * as THREE from "three";

export const BAU_START = { arm: 1.8, bein: 3.0, kopf: 0.66, rumpf: 1.16, knie: 0.56 };   // endgültige Maße von Mr. Alex für Mr. Flex (18.11.)
const HAND = 1.7, HALS = 0.785;                        // Handgröße (Mr. Alex 18.11.: die Dicke passt) · Halshöhe des ungestreckten Körpers wie bei Gary
const STIEFEL = { kante: 0.335, knie: 0.42 };          // Mage-Körper: bis hier reicht der Stiefel · bis hier der Ring direkt über dem Knie (Höhen im ungestreckten Körper)
const MANTEL = { ab: 0.56, tief: 0.2, anteil: 0.8, vornAb: 0.84, vornTief: 0.46 };   // Mage-Körper: unterhalb `ab` folgt der Mantel den Oberschenkeln, am Saum mit `anteil`; vorn (Bauchteil) schon ab `vornAb`
const OHNE_SOHLE = ["gehen", "rennen", "rolle", "spagat"];   // hier bleibt der Fuß, wie die Bewegung ihn führt (Abrollen, Füße in der Luft)
const R = "offen", Z = "zeigen", F = "faust";
const FINGER = { offen: [0, 0, 0, 0, 0, 0], zeigen: [0, 1, 1, 1, 1, 0], faust: [1, 1, 1, 1, 1, 0], gespreizt: [0, 0, 0, 0, 0, 1] };   // Einrollen von Zeige-, Mittel-, Ring-, kleinem Finger und Daumen · Spreizen
/* Gesten-Tabelle: Knopf → [Bewegung, Beschriftung, Gruppe, Handform]. Handform: eine für beide Hände oder [rechts, links];
   null = die Hände bleiben, wie sie am Schalter gewählt sind. Nach der Geste gilt wieder der Schalter. */
export const GESTEN = {
  stehen: ["Idle", "Stehen", "Grund", null], gehen: ["Walking_A", "Gehen", "Grund", null], rennen: ["Running_A", "Rennen", "Grund", null],
  zeigen: ["Geste_Zeigen", "Zeigen", "Rede-Gesten", [Z, R]], achselzucken: ["Geste_Achselzucken", "Achselzucken", "Rede-Gesten", R], abwinken: ["Geste_Abwinken", "Abwinken", "Rede-Gesten", R],
  reiben: ["Geste_HaendeReiben", "Hände reiben", "Rede-Gesten", R], arme: ["Geste_ArmeAusbreiten", "Arme ausbreiten", "Rede-Gesten", R], mahnen: ["Geste_Mahnen", "Mahnen", "Rede-Gesten", [Z, R]],
  denken: ["Geste_Nachdenken", "Nachdenken", "Rede-Gesten", [F, R]], hueften: ["Geste_HaendeHueften", "Hände in die Hüften", "Rede-Gesten", F], stirn: ["Geste_HandVorStirn", "Hand vor die Stirn", "Rede-Gesten", R],
  klatschen: ["Geste_Klatschen", "Klatschen", "Rede-Gesten", R], highfive: ["Geste_HighFive", "High five", "Rede-Gesten", ["gespreizt", R]], nicken: ["Geste_Nicken", "Nicken", "Rede-Gesten", null],
  kopfschuetteln: ["Geste_Kopfschuetteln", "Kopfschütteln", "Rede-Gesten", null],
  salut: ["Sgt_Salutieren", "Salutieren", "Sergeant", R], marsch: ["Sgt_MarschAufDerStelle", "Marsch auf der Stelle", "Sergeant", F], wippen: ["Sgt_FussWippen", "Fußwippen", "Sergeant", null],
  bizeps: ["Flex_Bizeps", "Bizeps", "Mr. Flex", F], tee: ["Flex_TeeTrinken", "Tee trinken", "Mr. Flex", [F, R]], brille: ["Flex_BrilleSchieben", "Brille schieben", "Mr. Flex", [Z, R]],
  pistolen: ["Flex_Fingerpistolen", "Fingerpistolen", "Mr. Flex", Z],
  kick: ["KungFu_HoherKick", "Kick", "Kung-Fu", F], mabu: ["KungFu_MaBu", "Ma Bu", "Kung-Fu", F], pubu: ["KungFu_PuBu", "Pu Bu", "Kung-Fu", R], xubu: ["KungFu_XuBu", "Xu Bu", "Kung-Fu", R],
  spagat: ["KungFu_Spagat", "Spagat", "Kung-Fu", R], rolle: ["KungFu_RolleVorwaerts", "Rolle vorwärts", "Kung-Fu", F],
};
const DAUERND = ["stehen", "gehen", "rennen"];
const v = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), Q = () => new THREE.Quaternion();
const weich = (x, a, b) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const dabei = (u, ein0, ein1, aus0, aus1) => weich(u, ein0, ein1) * (1 - weich(u, aus0, aus1));   // Gewicht eines Handziels über die Dauer der Geste (0…1)

/* Handziele: Geste → (Seite −1 rechts / +1 links, Anteil der Dauer u, Zeit t in s) → Ziel oder null.
   knochen + ort: Punkt am Körper in den Maßen des ungestreckten Körpers (x zur linken Seite der Figur, y hoch, z nach vorn).
   Ohne `finger` zeigt die Hand in Richtung des Unterarms, und `reich` sagt, welcher Punkt der Hand das Ziel trifft (0 Handgelenk … 1 Fingerspitzen).
   Mit `finger` und `flaeche` (Richtung der Finger und Blickrichtung der Handfläche) wird auch die Hand gedreht; das Ziel trifft dann die Mitte der Handfläche.
   pol = wohin der Ellenbogen zeigt. */
const ZIELE = {
  hueften: (s, u) => ({ knochen: "hips", ort: [s * 0.41, 0.30, 0.02], reich: 0.3, pol: [s, -0.1, -0.6], gewicht: dabei(u, 0.08, 0.2, 0.82, 0.96) }),   // auf der Kleidung, nicht darin
  klatschen: (s, u, t) => ({ knochen: "chest", ort: [s * (0.04 + 0.13 * (0.5 - 0.5 * Math.cos((2 * Math.PI * (t - 0.32)) / 0.24))), 0.0, 0.62], finger: [0, 0.45, 0.9], flaeche: [-s, 0, 0],
    pol: [s * 0.7, -1, 0], gewicht: dabei(u, 0.1, 0.22, 0.84, 0.98) }),                                   // die Handflächen treffen sich (0,04 = halbe Handdicke)
  reiben: (s, u, t) => { const hin = 0.05 * Math.sin((2 * Math.PI * t) / 0.3) * s; return { knochen: "chest", ort: [s * 0.04, -0.2 + hin * 0.3, 0.6 + hin], finger: [0, 0.3, 0.95], flaeche: [-s, 0, 0],
    pol: [s * 0.7, -1, 0], gewicht: dabei(u, 0.1, 0.22, 0.8, 0.96) }; },                                   // Handfläche an Handfläche, gegeneinander geschoben
  /* High five (Mr. Alex 18.11., wichtig): Ellbogen bleibt angewinkelt, Hand auf Kopfhöhe neben dem Kopf, Handfläche senkrecht nach vorn,
     Finger nach oben – nur ein kurzer Schwung nach vorn und zurück, nie ein gestreckter Arm. */
  highfive: (s, u) => (s > 0 ? null : { knochen: "chest", ort: [-0.66, 0.6, 0.12 + 0.22 * dabei(u, 0.38, 0.5, 0.56, 0.7)], finger: [0, 1, 0], flaeche: [0, 0, 1],
    pol: [-0.5, -1, -0.1], gewicht: dabei(u, 0.1, 0.26, 0.8, 0.95) }),
  salut: (s, u) => (s > 0 ? null : { knochen: "head", ort: [-0.3, 0.52, 0.4], reich: 1, pol: [-1, 0.1, -0.3], gewicht: dabei(u, 0.05, 0.11, 0.88, 0.97) }),   // Fingerspitzen an die Stirn
};

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
    gewichte(netz, (y, x, z, w) => {
      if (y >= STIEFEL.knie) return new Map([[iO, 1]]);
      if (y >= STIEFEL.kante) return new Map([[iU, 1]]);
      w.delete(iO); if (w.has(iU)) { w.set(iH, w.get(iU)); w.delete(iU); } if (!w.size) w.set(iH, 1);
      return w;
    });
    netz.bind(new THREE.Skeleton(knochen, kehr), netz.bindMatrix);
    helfer[s] = H;
  }
  return helfer;
}
/* Der Mantel folgt den Oberschenkeln: je näher am Saum, desto mehr; links und rechts jeweils dem eigenen Bein, in der Mitte beiden. */
function mantelFolgt(m, K) {
  let netz = null; m.traverse((o) => { if (o.isSkinnedMesh && o.name.endsWith("_Body")) netz = o; });
  if (!netz) return;
  const iL = netz.skeleton.bones.indexOf(K("upperlegl")), iR = netz.skeleton.bones.indexOf(K("upperlegr"));
  gewichte(netz, (y, x, z, w) => {
    const vorn = Math.min(1, Math.max(0, (z - 0.05) / 0.2));                       // der Bauchteil geht weiter oben mit, damit ein hohes Knie nicht durchstößt
    const ab = MANTEL.ab + (MANTEL.vornAb - MANTEL.ab) * vorn, weit = MANTEL.tief + (MANTEL.vornTief - MANTEL.tief) * vorn;
    const f = Math.min(1, Math.max(0, (ab - y) / weit)) * MANTEL.anteil;
    if (f <= 0) return w;
    for (const [k, g] of w) w.set(k, g * (1 - f));
    const links = Math.min(1, Math.max(0, 0.5 + x / 0.16));                       // weicher Übergang in der Mitte
    w.set(iL, (w.get(iL) || 0) + f * links); w.set(iR, (w.get(iR) || 0) + f * (1 - links));
    return w;
  });
}
function gewichte(netz, regel) {                        // regel(Höhe, Seite, Tiefe, Gewichte je Knochen) → neue Gewichte; höchstens vier je Punkt
  const P = netz.geometry.attributes.position, I = netz.geometry.attributes.skinIndex, W = netz.geometry.attributes.skinWeight;
  for (let i = 0; i < P.count; i++) {
    let w = new Map();
    for (let k = 0; k < 4; k++) { const g = W.getComponent(i, k), n = I.getComponent(i, k); if (g > 0) w.set(n, (w.get(n) || 0) + g); }
    w = regel(P.getY(i), P.getX(i), P.getZ(i), w);
    const liste = [...w].filter((x) => x[1] > 0.001).sort((a, b) => b[1] - a[1]).slice(0, 4), summe = liste.reduce((a, x) => a + x[1], 0);
    for (let k = 0; k < 4; k++) { I.setComponent(i, k, liste[k] ? liste[k][0] : 0); W.setComponent(i, k, liste[k] ? liste[k][1] / summe : 0); }
  }
  I.needsUpdate = W.needsUpdate = true;
}
function aermelFarbe(m) {                               // Farbe des Ärmels aus dem Bild des Körpers lesen (für den wachsenden Bizeps)
  try {
    let netz = null; m.traverse((o) => { if (o.isSkinnedMesh && o.name.endsWith("ArmRight")) netz = o; });
    const bild = netz.material.map.image, c = document.createElement("canvas"); c.width = bild.width; c.height = bild.height;
    const x = c.getContext("2d"); x.drawImage(bild, 0, 0);
    const P = netz.geometry.attributes.position, UV = netz.geometry.attributes.uv;
    let i = 0; for (let k = 0; k < P.count; k++) if (Math.abs(P.getX(k)) < Math.abs(P.getX(i))) i = k;   // der Punkt, der der Schulter am nächsten ist
    const d = x.getImageData(Math.min(bild.width - 1, Math.floor(UV.getX(i) * bild.width)), Math.min(bild.height - 1, Math.floor(UV.getY(i) * bild.height)), 1, 1).data;
    return new THREE.Color().setRGB(d[0] / 255, d[1] / 255, d[2] / 255, THREE.SRGBColorSpace);
  } catch (e) { return new THREE.Color(0x463e7d); }
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

  const gruppen = { arm: [], rumpf: ["spine", "chest", "head"].map(K) }, bein = { ober: [], unter: [] };
  for (const s of "lr") { gruppen.arm.push(K("lowerarm" + s), K("wrist" + s)); bein.ober.push(K("lowerleg" + s)); bein.unter.push(K("foot" + s)); }
  const ruhe = new Map([...Object.values(gruppen).flat(), ...bein.ober, ...bein.unter].map((b) => [b, b.position.clone()]));
  const hips = K("hips"), head = K("head");
  const hueftHoehe = hips.getWorldPosition(v()).y / mass, oberschenkel = K("lowerlegl").position.length(), unterschenkel = K("footl").position.length();
  const knoechel = K("upperlegl").getWorldPosition(v()).y / mass - oberschenkel - unterschenkel;   // Höhe des Fußgelenks im ungestreckten Körper
  const handRuhe = {}, fussRuhe = {};                   // Lage der Hand- und Fußgelenke im ungestreckten, ungedrehten Körper (für Handziele und flache Sohlen)
  for (const s of "lr") { handRuhe[s] = K("wrist" + s).getWorldQuaternion(Q()); fussRuhe[s] = K("foot" + s).getWorldQuaternion(Q()); }

  // Hand mit beweglichen Fingern: der Fäustling schrumpft weg, am Handgelenk sitzt ein Halter mit der Hand (links gespiegelt)
  const halter = {}, glieder = {}, krall = { r: [0, 0, 0, 0, 0, 0], l: [0, 0, 0, 0, 0, 0] };
  for (const [s, vz] of [["r", -1], ["l", 1]]) {
    const gelenk = K("wrist" + s), ort = gelenk.getWorldPosition(v()), arm = ort.clone().sub(K("lowerarm" + s).getWorldPosition(v())).normalize();
    const h = new THREE.Group(); szene.add(h);
    h.position.copy(ort); h.quaternion.setFromUnitVectors(v(vz, 0, 0), arm); h.scale.set(-vz * mass * HAND, mass * HAND, mass * HAND);
    const hand = haende.scene.getObjectByName("hand").clone(true); hand.position.set(0, 0, 0); h.add(hand);
    hand.traverse((o) => { o.frustumCulled = false; });
    glieder[s] = [1, 2, 3, 4].map((i) => [hand.getObjectByName("f" + i), hand.getObjectByName("f" + i + "b")]).concat([[hand.getObjectByName("daumen")]]);
    h.updateMatrixWorld(true); gelenk.attach(h); halter[s] = h;
  }
  const stiefel = stiefelFest(m, K);
  mantelFolgt(m, K);
  // Bizeps: eine Wölbung in der Farbe des Ärmels, die beim Anspannen wächst
  const muskel = {}, stoff = new THREE.MeshStandardMaterial({ color: aermelFarbe(m), roughness: 0.9 });
  for (const s of "lr") {
    const b = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), stoff); b.visible = false; b.frustumCulled = false;
    b.quaternion.setFromUnitVectors(v(0, 1, 0), ruhe.get(K("lowerarm" + s)).clone().normalize()); K("upperarm" + s).add(b); muskel[s] = b;
  }

  const mixer = new THREE.AnimationMixer(m), roh = hips.position.clone(), gesetzt = v(NaN, NaN, NaN), kasten = new THREE.Box3(), stueck = new THREE.Box3();
  const hoeher = () => (hueftHoehe + (bau.bein - 1) * (oberschenkel + unterschenkel)) / hueftHoehe;
  const beinTeile = () => {                             // Länge von Ober- und Unterschenkel: zusammen bein × Ruhelänge, das Knie liegt bei `knie` der Hüfthöhe
    const lang = (oberschenkel + unterschenkel) * bau.bein, hueftgelenk = knoechel + lang;
    const unter = Math.min(lang - oberschenkel * 0.6, Math.max(unterschenkel, bau.knie * hueftgelenk - knoechel));
    return { ober: (lang - unter) / oberschenkel, unter: unter / unterschenkel, anteil: (knoechel + unter) / hueftgelenk };
  };
  const tief = () => {                                  // tiefster Punkt von Körper und Händen (ohne Umhang), mit allen Verformungen
    kasten.makeEmpty();
    for (const n of haut) { n.computeBoundingBox(); kasten.union(stueck.copy(n.boundingBox).applyMatrix4(n.matrixWorld)); }
    for (const s of "lr") kasten.union(stueck.setFromObject(halter[s]));
    return kasten.min.y;
  };
  const strecke = () => {
    const b = beinTeile();
    for (const [art, liste] of Object.entries(gruppen)) for (const k of liste) k.position.copy(ruhe.get(k)).multiplyScalar(bau[art]);
    for (const k of bein.ober) k.position.copy(ruhe.get(k)).multiplyScalar(b.ober);
    for (const k of bein.unter) k.position.copy(ruhe.get(k)).multiplyScalar(b.unter);
    for (const s of "lr") if (stiefel[s]) stiefel[s].position.copy(ruhe.get(K("foot" + s))).multiplyScalar(b.unter - 1);
    if (!hips.position.equals(gesetzt)) roh.copy(hips.position);
    hips.position.copy(roh).multiplyScalar(hoeher()); gesetzt.copy(hips.position);
    head.scale.setScalar(bau.kopf);
    for (const s of "lr") K("hand" + s).scale.setScalar(0.001);
    m.position.y = 0; anker.updateMatrixWorld(true);
  };
  const aufBoden = () => { const t = tief(); if (Math.abs(t) > 0.002) { m.position.y = -t; anker.updateMatrixWorld(true); } };

  // ---- Handziele: Schulter und Ellenbogen so stellen, dass die Hand am Ziel ankommt
  const wo = (o) => o.getWorldPosition(v());
  const dreheWelt = (knochen, q) => {                   // dreht einen Knochen um sein Gelenk, q in Weltrichtung
    knochen.quaternion.copy(knochen.parent.getWorldQuaternion(Q()).invert().multiply(q.clone().multiply(knochen.getWorldQuaternion(Q()))));
    knochen.updateMatrixWorld(true);
  };
  const greife = (s, ziel, reich, pol, gewicht) => {
    const S = K("upperarm" + s), E = K("lowerarm" + s), W = K("wrist" + s), s0 = S.quaternion.clone(), e0 = E.quaternion.clone();
    let ps = wo(S), pe = wo(E), unter = wo(W).sub(pe);
    const l1 = ps.distanceTo(pe), l2 = unter.length() + reich, ende = () => { pe = wo(E); return pe.clone().add(wo(W).sub(pe).normalize().multiplyScalar(l2)); };
    const d = Math.min(l1 + l2 - 0.001, Math.max(Math.abs(l1 - l2) + 0.001, ps.distanceTo(ziel)));
    const soll = Math.acos(Math.min(1, Math.max(-1, (l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2))));
    const a = ps.clone().sub(pe).normalize(), b = unter.clone().normalize(), ist = Math.acos(Math.min(1, Math.max(-1, a.dot(b))));
    let achse = a.clone().cross(b); if (achse.lengthSq() < 1e-6) achse = a.clone().cross(pol || v(0, 0, 1)); achse.normalize();
    dreheWelt(E, Q().setFromAxisAngle(achse, soll - ist));                        // Ellenbogen beugen, bis die Reichweite stimmt
    dreheWelt(S, Q().setFromUnitVectors(ende().sub(ps).normalize(), ziel.clone().sub(ps).normalize()));   // Arm auf das Ziel richten
    if (pol) {                                                                    // Ellenbogen um die Achse Schulter–Ziel dorthin drehen, wohin er zeigen soll
      const n = ziel.clone().sub(ps).normalize(), e = wo(E).sub(ps), ep = e.sub(n.clone().multiplyScalar(e.dot(n))), pp = pol.clone().sub(n.clone().multiplyScalar(pol.dot(n)));
      if (ep.lengthSq() > 1e-6 && pp.lengthSq() > 1e-6) { ep.normalize(); pp.normalize(); dreheWelt(S, Q().setFromAxisAngle(n, Math.atan2(n.dot(ep.clone().cross(pp)), ep.dot(pp)))); }
    }
    S.quaternion.copy(s0.slerp(S.quaternion, gewicht)); E.quaternion.copy(e0.slerp(E.quaternion, gewicht)); S.updateMatrixWorld(true);
  };
  const lage = (finger, flaeche) => new THREE.Matrix4().makeBasis(finger, flaeche, finger.clone().cross(flaeche));
  const dreheHand = (s, finger, flaeche, gewicht) => {  // Hand so drehen, dass die Finger nach `finger` zeigen und die Handfläche nach `flaeche` schaut (Richtungen des Körpers)
    const W = K("wrist" + s), vz = s === "r" ? -1 : 1, w0 = W.quaternion.clone();
    const dreh = Q().setFromRotationMatrix(lage(finger, flaeche).multiply(lage(v(vz, 0, 0), v(0, -1, 0)).transpose()));
    const welt = m.getWorldQuaternion(Q()).multiply(dreh).multiply(handRuhe[s]);
    W.quaternion.copy(w0.slerp(W.parent.getWorldQuaternion(Q()).invert().multiply(welt), gewicht)); W.updateMatrixWorld(true);
  };
  const g = { modus: "stehen", wahl: R, hand: [R, R], weg: 0, hin: 1, dreh: 0, bahn: platz.bahn || 2.4, laeuft: null };
  const ziele = () => {
    const regel = ZIELE[g.modus]; if (!regel || !g.laeuft) return;
    const dauer = g.laeuft.getClip().duration, t = Math.min(g.laeuft.time, dauer), qm = m.getWorldQuaternion(Q());
    for (const [s, seite] of [["r", -1], ["l", 1]]) {
      const z = regel(seite, t / dauer, t); if (!z || z.gewicht <= 0.001) continue;
      const punkt = K(z.knochen).localToWorld(v(...z.ort)), pol = z.pol ? v(...z.pol).normalize().applyQuaternion(qm) : null, handLang = 0.19 * HAND * mass;
      if (z.finger) {
        const finger = v(...z.finger).normalize(), flaeche = v(...z.flaeche).normalize();
        flaeche.sub(finger.clone().multiplyScalar(flaeche.dot(finger))).normalize();                // genau senkrecht zu den Fingern
        greife(s, punkt.sub(finger.clone().applyQuaternion(qm).multiplyScalar(0.052 * HAND * mass)), 0, pol, z.gewicht);
        dreheHand(s, finger, flaeche, z.gewicht);
      } else greife(s, punkt, z.reich * handLang, pol, z.gewicht);
    }
  };
  const finger = (dt) => {                              // Finger rollen weich ein und aus (etwa eine Viertelsekunde)
    [["r", 0], ["l", 1]].forEach(([s, i]) => {
      const soll = FINGER[g.hand[i]], ist = krall[s], k = Math.min(1, dt * 9);
      for (let n = 0; n < 6; n++) ist[n] += (soll[n] - ist[n]) * k;
      for (let n = 0; n < 4; n++) { glieder[s][n][0].rotation.set(0, (1.5 - n) * 0.14 * ist[5], ist[n] * 1.45); glieder[s][n][1].rotation.z = ist[n] * 1.6; }
      glieder[s][4][0].rotation.set(0, -1.0 * ist[4], 0.5 * ist[4]);
    });
  };
  const bizeps = () => {
    const an = g.modus === "bizeps" && g.laeuft ? dabei(g.laeuft.time / g.laeuft.getClip().duration, 0.1, 0.3, 0.84, 0.98) : 0;
    const pumpen = an * (1 + 0.12 * Math.sin((g.laeuft ? g.laeuft.time : 0) * 14));
    for (const s of "lr") {
      const b = muskel[s]; b.visible = an > 0.02; if (!b.visible) continue;
      b.position.copy(ruhe.get(K("lowerarm" + s))).multiplyScalar(bau.arm * 0.5);
      b.scale.set(0.2 * pumpen, 0.17 * bau.arm * 0.8, 0.2 * pumpen);              // der Ärmel ist etwa 0,14 dick – die Wölbung muss darüber hinausgehen
    }
  };
  /* Flache Sohlen (Regel für alle Standposen, Mr. Alex 18.11.): Steht ein Fuß am Boden und der Unterschenkel halbwegs aufrecht,
     gleicht der Knöchel aus, bis die Sohle flach aufliegt. */
  const sohlenHoch = (s) => v(0, 1, 0).applyQuaternion(K("foot" + s).getWorldQuaternion(Q()).multiply(m.getWorldQuaternion(Q()).multiply(fussRuhe[s]).invert()));
  const sohle = () => {
    if (OHNE_SOHLE.includes(g.modus)) return;
    const hoehen = {}; let unten = Infinity;
    for (const s of "lr") { hoehen[s] = wo(K("foot" + s)); unten = Math.min(unten, hoehen[s].y); }
    for (const s of "lr") {
      const pf = hoehen[s], pk = wo(K("lowerleg" + s)), aufrecht = (pk.y - pf.y) / Math.max(1e-6, pk.distanceTo(pf));
      const w = (1 - weich(pf.y - unten, 0.03 * mass, 0.12 * mass)) * weich(aufrecht, 0.3, 0.6);
      if (w > 0.001) dreheWelt(K("foot" + s), Q().slerp(Q().setFromUnitVectors(sohlenHoch(s), v(0, 1, 0)), w));
    }
  };
  const nach = (dt) => { strecke(); ziele(); sohle(); finger(dt); bizeps(); m.updateMatrixWorld(true); aufBoden(); };
  const grad = (x) => +((x * 180) / Math.PI).toFixed(1);
  const armLage = (s) => {                              // Ellbogenwinkel (180 = gestreckt), Richtung Schulter → Hand im Körper, Richtung der Finger zur Senkrechten
    const ps = wo(K("upperarm" + s)), pe = wo(K("lowerarm" + s)), pw = wo(K("wrist" + s)), qm = m.getWorldQuaternion(Q()).invert();
    const fingerRichtung = halter[s].localToWorld(v(-1, 0, 0)).sub(halter[s].localToWorld(v())).normalize();
    return { ellbogen: grad(ps.clone().sub(pe).angleTo(pw.clone().sub(pe))), richtung: pw.clone().sub(ps).normalize().applyQuaternion(qm).toArray().map((x) => +x.toFixed(2)),
      fingerHoch: grad(fingerRichtung.angleTo(v(0, 1, 0))), flach: Math.max(...krall[s].slice(0, 4)) < 0.5 };
  };
  /* Kein Gruß mit gestrecktem Arm (Mr. Alex 18.11.): Bei keiner Bewegung darf ein Arm durchgestreckt schräg nach vorn oben zeigen, während die Hand flach ist. */
  const wieGruss = (a) => a.ellbogen > 150 && a.flach && a.richtung[2] > 0.35 && a.richtung[1] > 0.15 && a.richtung[1] < 0.92 && Math.abs(a.richtung[0]) < 0.6;

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
      for (let i = 0; i <= N; i++) { a.time = (dauer * (i % N)) / N; mixer.update(0); strecke(); aufBoden(); z.push(anker.worldToLocal(fuss.getWorldPosition(p)).z); }
      const zurueck = z.slice(1).map((w, i) => ((z[i] - w) * N) / dauer).sort((x, y) => y - x);
      tempo[art] = (zurueck[0] + zurueck[1] + zurueck[2] + zurueck[3]) / 4;
    }
    mixer.stopAllAction(); gesetzt.set(NaN, NaN, NaN);
  };
  const zeigeHand = (form) => { g.hand = Array.isArray(form) ? form : [form, form]; };   // eine Handform für beide oder [rechts, links]; die Finger folgen weich
  const starte = (modus) => {
    const a = aktion[modus]; if (!a) return;
    if (g.laeuft && g.laeuft !== a) g.laeuft.fadeOut(0.18);
    a.reset().setEffectiveWeight(1).fadeIn(0.18).play(); g.laeuft = a; g.modus = modus;
    zeigeHand(GESTEN[modus][3] || g.wahl);              // die Handform wechselt mit der Geste und danach zurück zum Schalter
  };
  mixer.addEventListener("finished", (e) => { if (e.action === g.laeuft) starte("stehen"); });   // nur die laufende Geste führt zurück ins Stehen, keine schon abgelöste
  messeTempo(); starte("stehen"); mixer.update(0); nach(1);

  const imKoerper = (p) => m.worldToLocal(p).toArray().map((x) => +x.toFixed(3));   // Ort in den Maßen des Körpers (x zur linken Seite, y hoch, z nach vorn)
  const flaeche = (s) => halter[s].localToWorld(v(-0.052, 0, 0));                    // Mitte der Handfläche
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
      mixer.update(dt); nach(dt);
    },
    /* Spielt jede Bewegung einmal ganz durch und meldet, wo ein Arm wie ein Gruß mit gestrecktem Arm aussehen kann (für das Testprogramm). */
    gruss() {
      const fund = [];
      for (const knopf of Object.keys(GESTEN)) {
        starte(knopf); const dauer = aktion[knopf].getClip().duration;
        for (let t = 0; t < dauer; t += 1 / 30) { mixer.update(1 / 30); nach(1 / 30); for (const s of "rl") { const a = armLage(s); if (wieGruss(a)) { fund.push({ knopf, zeit: +t.toFixed(2), arm: s, ...a }); t = dauer; break; } } }
        starte("stehen"); for (let i = 0; i < 12; i++) { mixer.update(1 / 30); nach(1 / 30); }
      }
      return fund;
    },
    zustand: () => ({ modus: g.modus, armR: armLage("r"), armL: armLage("l"), sohleR: grad(sohlenHoch("r").angleTo(v(0, 1, 0))), sohleL: grad(sohlenHoch("l").angleTo(v(0, 1, 0))), hand: g.hand, wahl: g.wahl, krall: +krall.r[1].toFixed(2), weg: +g.weg.toFixed(2), bau: { ...bau }, schritt: +hoeher().toFixed(2),
      gehen: +tempo.gehen.toFixed(2), rennen: +tempo.rennen.toFixed(2), knieAnteil: +beinTeile().anteil.toFixed(3),
      hals: +head.getWorldPosition(v()).y.toFixed(3), tief: +tief().toFixed(3), zehe: +Math.max(K("toesr").getWorldPosition(v()).y, K("toesl").getWorldPosition(v()).y).toFixed(3),
      knie: +K("lowerlegl").getWorldPosition(v()).y.toFixed(3), stiefelOben: +(stiefel.l.getWorldPosition(v()).y + (STIEFEL.kante - 0.293) * mass).toFixed(3),
      faustR: K("wristr").getWorldPosition(v()).toArray().map((x) => +x.toFixed(2)), faustL: K("wristl").getWorldPosition(v()).toArray().map((x) => +x.toFixed(2)),
      flaecheR: imKoerper(flaeche("r")), flaecheL: imKoerper(flaeche("l")), handAbstand: +(flaeche("r").distanceTo(flaeche("l")) / mass).toFixed(3), muskel: muskel.r.visible ? +muskel.r.scale.x.toFixed(3) : 0,
      ort: [+anker.position.x.toFixed(2), +anker.position.z.toFixed(2)] }),
  };
}
