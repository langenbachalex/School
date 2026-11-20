/* Figuren für The Keys of the Tower (Block A, 17./18.11.2026; Entscheidung Mr. Alex nach der Probe mit drei Garys):
   Jede Figur = ein Körper aus „KayKit Adventurers“ (CC0) + eigener Kopf aus Blender, auf die Knochen gesteckt (steckeAuf).
   Alle Körper teilen sich ein Skelett, deshalb wird figuren/kaykit_bewegungen.glb nur einmal geladen und gilt für alle.
   Stehen, Gehen, Rennen sind fertige Bewegungen, Gesten laufen einmal ab; Reden und Verbeugen entstehen hier und liegen über dem Stehen.
   Gesicht: bewegliche Teile mit festen Namen, gleich für alle Köpfe – braue_l/r, lid_l/r, pupille_l/r, mund, kiefer, mundwinkel_l/r.
   Dateien bauen: node werkzeuge/glb_teilen.js (Körper, Bewegungen) · blender -b --python werkzeuge/blender/tower_gary.py (Kopf, Schwanz, Stab)
   · python werkzeuge/tower_lippen.py (Mundformen aus den Aufnahmen). Quellen und Lizenzen: figuren/QUELLEN.md. */
import * as THREE from "three";

const VERBEUGEN = 2.4;                                 // Dauer in s
const weich = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const beuge = (z) => weich(z / 0.6) * (1 - weich((z - 1.6) / 0.8));   // 0 → 1 → halten → 0
const HOCH = new THREE.Vector3(0, 1, 0), VORN = new THREE.Vector3(0, 0, 1), QUER = new THREE.Vector3(1, 0, 0), ARM = 0.5;

/* Ausdrücke – Gesicht: braueHoch −1…1 · braueDreh in rad (plus = grimmiges V) · schief (linke Braue höher) · lid 0 offen … 1 zu
   · unterlid 0…1 von unten (lachende Augen) · pupille Größe · mund 0…1 offen (der Unterkiefer klappt am Gelenk) · breit
   · winkel −1…1 (Mundwinkel: +1 hoch und nach hinten in die Wange, −1 nach unten) · winkelSchief (linker Mundwinkel höher)
   · wange 0…1 (Wangenpolster schieben sich hoch) · ohr −1…1 (aufgestellt) · eckzahn 0…1 (Eckzähne stehen über die Unterlippe)
   Haltung: neig (Kopf zur Seite, rad) · kinn (Kinn hoch, rad) · brust (Brust raus) · arme (offen) · hueften (Hände in die Hüften)
   kamera: true = die Pupillen schauen zum Publikum, also in die Kamera */
export const NEUTRAL = { braueHoch: 0, braueDreh: 0, schief: 0, lid: 0, unterlid: 0, pupille: 1, mund: 0, breit: 1, winkel: 0, winkelSchief: 0, wange: 0, ohr: 0, eckzahn: 0, neig: 0, kinn: 0, brust: 0, arme: 0, hueften: 0 };
export const AUSDRUECKE = {
  neutral: NEUTRAL,
  // Fröhlich in zwei Stufen (Mr. Alex 18.11.): geschlossenes Lächeln – die Mundlinie schwingt in die Wange hinauf …
  froehlich: { ...NEUTRAL, braueHoch: 0.4, braueDreh: -0.06, unterlid: 0.32, winkel: 1, wange: 0.85, ohr: 0.7, neig: 0.1 },
  // … und Lachen: Mund offen, obere Zahnreihe, Zunge; das ganze Gesicht und der Körper machen mit
  lachen: { ...NEUTRAL, braueHoch: 0.55, braueDreh: -0.08, unterlid: 0.36, mund: 0.62, winkel: 1, wange: 1, ohr: 1, neig: 0.14, arme: 1 },
  erschrocken: { ...NEUTRAL, braueHoch: 0.9, braueDreh: -0.3, pupille: 0.6, mund: 1, breit: 0.8, winkel: -0.35, ohr: -0.5 },
  ueberrascht: { ...NEUTRAL, braueHoch: 0.95, braueDreh: -0.12, pupille: 0.85, mund: 0.5, breit: 0.5, winkel: 0.25, ohr: 0.6 },
  grimmig: { ...NEUTRAL, braueHoch: -1.05, braueDreh: 0.52, lid: 0.42, pupille: 0.9, winkel: -0.85, eckzahn: 1 },
  // Stolz = aufgesetzt, Pose zur Kamera: fast geschlossenes selbstzufriedenes Lächeln, ein Mundwinkel höher, halbe Lider, eine Braue höher, Hände in die Hüften
  stolz: { ...NEUTRAL, braueHoch: 0.35, schief: 1, lid: 0.32, mund: 0.1, winkel: 0.55, winkelSchief: 0.5, kinn: 0.04, neig: -0.15, brust: 1, hueften: 1, kamera: true },
  reden: { ...NEUTRAL, braueHoch: 0.25, unterlid: 0.15, winkel: 0.65, wange: 0.45, ohr: 0.3 },   // Grundausdruck beim Reden: geschlossenes Lächeln
  // Mr. Flex (Kopf-Probe 18.11.): Schelmisch = breites Grinsen, Mundwinkel deutlich hoch, Wangen schieben nach oben, Augen schmal (Unterlider hoch), eine Braue höher
  schelmisch: { ...NEUTRAL, braueHoch: 0.3, schief: 0.45, lid: 0.1, unterlid: 0.52, mund: 0.24, winkel: 1, wange: 1, neig: 0.08, kamera: true },
  // Ernst und geheimnisvoll: ruhiger gerader Blick, Brauen tief, halbe Lider, ganz leichtes Lächeln nur mit einem Mundwinkel
  geheimnisvoll: { ...NEUTRAL, braueHoch: -0.7, braueDreh: 0.14, lid: 0.3, winkel: 0.12, winkelSchief: 0.5, kamera: true },
};
/* Mundformen von Rhubarb Lip Sync (A–F Grundformen, G, H, X Zusatz): [offen, breit] */
/* Dritte und vierte Zahl nur für Menschenmünder (Mr. Flex, 18.11.): G = Unterlippe unter den oberen Zähnen (f, v) · H = Zungenspitze oben (l). Gary liest nur die ersten zwei. */
export const MUNDFORMEN = { X: [0, 1], A: [0.03, 0.9], B: [0.28, 1.05], C: [0.6, 1], D: [1, 1.1], E: [0.65, 0.72], F: [0.35, 0.5], G: [0.16, 0.95, 1, 0], H: [0.5, 0.8, 0, 1] };

/* hals = Höhe des Halsansatzes über dem Boden (darauf wird der Körper verkleinert) · weg = Teile des Körpers, die nicht gezeigt werden
   teile = aufgesteckte Stücke [Name in der Teile-Datei, Knochen, Größe, Versatz] · hand = Stück für den Handplatz · gesten = Knopf → [Bewegung, Ausdruck] */
const FIGUREN = {
  gary: {
    koerper: "koerper_mage", teileDatei: "gary_teile", hals: 0.785, weg: ["1H_Wand"], kieferWinkel: 0.5,
    teile: { kopf: ["fuchskopf", "head", 1.0, [0, -0.03, 0]], schwanz: ["fuchsschwanz", "hips", 1.0, [0, 0, -0.10]] },
    hand: "zauberstab",
    gestik: { haeufig: 1, gross: 1, tempo: 1, lieblinge: ["Interact", "Spellcast_Shoot", "Cheer", "Throw", "Use_Item"] },   // Gestik-Profil: Gary gestikuliert viel und groß
    gesten: { zaubern: ["Spellcast_Long", "lachen", "stolz"], tadaa: ["Cheer", "lachen", "stolz"], schreck: ["Hit_A", "erschrocken"] },   // Knopf → [Bewegung, Ausdruck dabei, Ausdruck danach]
    /* Profil der Figur – woran man sie allein an der Bewegung erkennt. Vorgemerkt (Mr. Alex/Master 18.11.), ausgewertet sind `gestik`, `blick` und `mimikTempo`, der Rest noch nicht:
       blick (unruhe = wie oft die Pupillen springen, kamera = schaut bei Posen zum Publikum) · mimikTempo · gestik.tempo · gang (tempo, schritt) · rennen (tempo) */
    profil: { blick: { unruhe: 0.8, kamera: true }, mimikTempo: 1.3, gang: { tempo: 1, schritt: 1 }, rennen: { tempo: 1 } },
  },
};

/* Menschenmund (Mr. Alex 18.11.: bei „i“ – „Yes, it is me“ – wirkte der Mund geschlossen, man sah nur die Zähne): Bei B geht der Kiefer weiter auf,
   damit unter der oberen Zahnreihe ein dunkler Spalt bleibt. Garys Schnauze behält die Werte oben. */
export const MUNDFORMEN_MENSCH = { ...MUNDFORMEN, B: [0.52, 1.05] };

/* Gestik beim Reden (Machbarkeitsprobe 18.11.): eine fertige Bewegung nur für Oberkörper und Arme, als Zugabe über Stehen oder Gehen gelegt.
   Die Beine behalten ihre Bewegung. „Zugabe“ heißt: gezählt wird nur der Unterschied zur Ruhehaltung (additive Bewegung). */
const OBEN = /^(chest|upperarm|lowerarm|wrist|hand)[lr]?\.quaternion$/;
function nurOberkoerper(clip, ruhe) {
  const c = new THREE.AnimationClip(clip.name + "_oben", clip.duration, clip.tracks.filter((t) => OBEN.test(t.name)).map((t) => t.clone()));
  return THREE.AnimationUtils.makeClipAdditive(c, 0, ruhe);
}
/* Einsätze für Gesten aus den Mundform-Zeiten: jeder Satzanfang nach einer Pause, in langen Sätzen zusätzlich eine weit offene Silbe (Betonung). */
export function einsaetzeAus(zeiten) {
  const aus = []; let pause = true, letzter = -9;
  for (const [ab, form] of zeiten) {
    if (form === "X") { pause = true; continue; }
    if (pause || (form === "D" && ab - letzter > 1.5)) { aus.push(ab); letzter = ab; }
    pause = false;
  }
  return aus;
}

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

/* Gesicht: sucht die benannten Teile im Kopf und bewegt sie weich auf den gewünschten Ausdruck zu; blinzelt von selbst. */
/* opt (für Köpfe mit flachem Gesicht, zuerst Mr. Flex): mass = Wege der Teile im Verhältnis zu Garys Kopf · flach = die Mundhöhle wächst mit der Öffnung
   (ohne Schnauze gibt es keinen Rachen, in den man hineinsieht). Neu für alle Köpfe: iris_l/r wandert mit der Pupille; falte_l/r = Lachfalten beim Grinsen. */
export function baueGesicht(kopf, kieferWinkel, opt = {}) {
  const M = opt.mass || 1;
  const teil = (n) => { const o = kopf.getObjectByName(n); return o ? { o, ort: o.position.clone(), q: o.quaternion.clone() } : null; };
  const t = Object.fromEntries(["braue_l", "braue_r", "lid_l", "lid_r", "unterlid_l", "unterlid_r", "wange_l", "wange_r", "ohr_l", "ohr_r", "pupille_l", "pupille_r", "iris_l", "iris_r", "falte_l", "falte_r",
    "mund", "kiefer", "zunge", "oberlippe", "mundlinie", "unterlippe", "zaehne", "zaehne_unten", "eckzahn_l", "eckzahn_r"].map((n) => [n, teil(n)]));
  const linie = t.mundlinie && t.mundlinie.o.morphTargetDictionary ? t.mundlinie.o : null;   // die Lippenlinie biegt sich (Formschlüssel hoch_l/r, tief_l/r)
  const biegsam = [linie, ...["zahnreihe", "unterlippe", "lippenhaut"].map((n) => kopf.getObjectByName(n)).filter((o) => o && o.morphTargetDictionary)].filter(Boolean);   // Zahnreihe und Unterlippe biegen sich mit der Lippenlinie (Mr. Flex)
  const form = (n, w) => { for (const o of biegsam) { const i = o.morphTargetDictionary[n]; if (i !== undefined) o.morphTargetInfluences[i] = Math.max(0, w); } };
  const jetzt = { ...NEUTRAL }, dreh = new THREE.Quaternion();
  let blinzeln = 2, zu = 0;
  const lippen = { offen: 0, rund: 0, breit: 0, f: 0, l: 0 };   // Menschenmund: weich nachgeführte Lippenformen
  return {
    wert: jetzt, lippen, teile: Object.keys(t).filter((n) => t[n]),
    blinzle() { zu = 0.16; blinzeln = 1.5 + Math.random() * 3; },
    bewege(dt, ziel, mund, blick, tempo) {              // mund = [offen, breit, f, l, laut] aus der Lippenbewegung oder null · blick −1…1 (Pupillen nach rechts … links)
      for (const k in jetzt) jetzt[k] += (ziel[k] - jetzt[k]) * Math.min(1, dt * 10 * tempo);
      blinzeln -= dt;
      if (blinzeln < 0) this.blinzle();
      zu = Math.max(0, zu - dt);
      const lid = Math.max(jetzt.lid, zu > 0 ? Math.sin((zu / 0.16) * Math.PI) : 0);
      let offen = mund ? Math.max(mund[0], jetzt.mund * 0.25) : jetzt.mund; const breit = mund ? mund[1] : jetzt.breit;
      if (opt.flach) {
        /* Menschenmund, lippensynchron (Mr. Alex 18.11.): Laute Silben öffnen weiter (laut 0…1). Der Kiefer geht schnell auf und langsamer zu,
           die Lippen sind flinker als der Kiefer – beides läuft nicht starr im Gleichschritt. */
        if (mund && mund[4] != null) offen *= 0.68 + 0.6 * mund[4];
        const zu_ = (k, soll, rauf, runter) => { lippen[k] += (soll - lippen[k]) * Math.min(1, dt * (soll > lippen[k] ? rauf : runter)); };
        zu_("offen", Math.min(1.15, offen), 24, 12);
        zu_("rund", Math.min(1, Math.max(0, (1 - breit) / 0.36)), 30, 22); zu_("breit", Math.min(1, Math.max(0, (breit - 1) / 0.1)), 30, 22);
        zu_("f", mund ? mund[2] || 0 : 0, 34, 24); zu_("l", mund ? mund[3] || 0 : 0, 34, 24);
        offen = lippen.offen;
      }
      this.offen = offen; this.lid = lid;
      for (const [seite, s] of [["l", 1], ["r", -1]]) {
        const b = t["braue_" + seite], l = t["lid_" + seite], u = t["unterlid_" + seite], p = t["pupille_" + seite], wa = t["wange_" + seite], oh = t["ohr_" + seite], ez = t["eckzahn_" + seite], ir = t["iris_" + seite], fa = t["falte_" + seite];
        const hoch = jetzt.braueHoch + (s > 0 ? jetzt.schief * 0.9 : 0);
        if (b) { b.o.position.y = b.ort.y + hoch * 0.026 * M; b.o.quaternion.copy(dreh.setFromAxisAngle(VORN, s * (jetzt.braueDreh - (s > 0 ? jetzt.schief * 0.18 : 0)))).multiply(b.q); }
        if (wa) { wa.o.position.y = wa.ort.y + jetzt.wange * 0.030 * M; wa.o.scale.setScalar(1 + jetzt.wange * 0.1); if (opt.wangeVor) wa.o.scale.z = 1 + jetzt.wange * opt.wangeVor; }   // wangeVor (Menschenköpfe): in Ruhe bündig im Gesicht, beim Lächeln wölbt sich die Wange hervor
        if (oh) oh.o.quaternion.copy(dreh.setFromAxisAngle(VORN, -s * jetzt.ohr * 0.22)).multiply(oh.q);
        if (l) { l.o.scale.y = Math.max(0.001, lid); l.o.visible = lid > 0.03; }
        if (u) { u.o.scale.y = Math.max(0.001, jetzt.unterlid); u.o.visible = jetzt.unterlid > 0.03; }
        if (p) { p.o.scale.setScalar(jetzt.pupille); p.o.position.x = p.ort.x + blick * 0.0125 * M; p.o.position.z = p.ort.z - Math.abs(blick) * 0.002 * M; }
        if (ir) { ir.o.position.x = ir.ort.x + blick * 0.0125 * M; ir.o.position.z = ir.ort.z - Math.abs(blick) * 0.002 * M; }
        if (fa) fa.o.visible = jetzt.wange > 0.4;
        if (ez) { ez.o.visible = offen > 0.1 || jetzt.eckzahn > 0.1; ez.o.scale.y = 1 + 0.45 * jetzt.eckzahn; }
      }
      if (linie) {
        const spitz = opt.flach ? 1 - 0.85 * lippen.rund : 1;   // gespitzte Lippen (o, u, w) lächeln nicht
        const wl = (jetzt.winkel + jetzt.winkelSchief) * spitz, wr = (jetzt.winkel - jetzt.winkelSchief * 0.5) * spitz;
        form("hoch_l", wl); form("tief_l", -wl); form("hoch_r", wr); form("tief_r", -wr);
      }
      if (t.kiefer) { t.kiefer.o.quaternion.copy(dreh.setFromAxisAngle(QUER, offen * kieferWinkel)).multiply(t.kiefer.q); if (!opt.flach) t.kiefer.o.scale.x = 0.7 + 0.3 * Math.min(1, breit); }
      if (opt.flach) {                                    // Menschenmund: der Kiefer ist die untere Gesichtshälfte und bleibt so breit; schmal oder breit werden die Lippen, und die Unterlippe zieht ihre Winkel beim Öffnen hinauf
        form("auf", offen); form("rund", lippen.rund); form("breit", lippen.breit * (1 - lippen.rund)); form("f", lippen.f);
        if (t.zunge) { t.zunge.o.position.y = t.zunge.ort.y + lippen.l * 0.011; t.zunge.o.position.z = t.zunge.ort.z + lippen.l * 0.008; }   // l: die Zungenspitze hebt sich hinter die oberen Zähne
      }
      if (t.oberlippe) t.oberlippe.o.position.y = t.oberlippe.ort.y + offen * 0.004 * M;
      if (t.mund) t.mund.o.visible = offen > 0.05;
      if (t.unterlippe) t.unterlippe.o.visible = !!opt.flach || offen > 0.08;
      if (t.zaehne) t.zaehne.o.visible = offen > 0.1 && !(opt.flach && lippen.rund > 0.6);   // bei gespitzten Lippen sieht man die Zähne nicht
      if (t.zaehne_unten) t.zaehne_unten.o.visible = offen > 0.7;
    },
  };
}

/* Funken und Sterne aus der Stabspitze: wenige Dutzend leuchtende Punkte und ein kurzes Aufleuchten. */
function baueFunken(szene) {
  const N = 48, ort = new Float32Array(N * 3).fill(-99), farbe = new Float32Array(N * 3), tempo = new Float32Array(N * 3), leben = new Float32Array(N);
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const x = c.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.25, "rgba(255,240,190,.9)"); g.addColorStop(1, "rgba(255,200,80,0)");
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  x.fillStyle = "#fff"; x.beginPath();                    // vierzackiger Stern in der Mitte
  for (let i = 0; i < 8; i++) { const r = i % 2 ? 5 : 30, w = (i * Math.PI) / 4; x.lineTo(32 + Math.cos(w) * r, 32 + Math.sin(w) * r); }
  x.fill();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(ort, 3)); geo.setAttribute("color", new THREE.BufferAttribute(farbe, 3));
  const punkte = new THREE.Points(geo, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(c), size: 0.11, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  punkte.frustumCulled = false; punkte.renderOrder = 5; szene.add(punkte);
  const licht = new THREE.PointLight(0xffd070, 0, 2.2, 2); szene.add(licht);
  let naechster = 0, schuld = 0, hell = 0;
  return {
    zahl: () => leben.reduce((n, l) => n + (l > 0 ? 1 : 0), 0),
    bewege(dt, an, spitze, richtung) {
      schuld = an ? schuld + dt * 34 : 0;
      for (; schuld >= 1; schuld--) {
        const i = naechster; naechster = (naechster + 1) % N;
        ort.set([spitze.x, spitze.y, spitze.z], i * 3);
        tempo.set([richtung.x * 0.5 + (Math.random() - 0.5) * 0.9, richtung.y * 0.5 + 0.5 + Math.random() * 0.7, richtung.z * 0.5 + (Math.random() - 0.5) * 0.9], i * 3);
        leben[i] = 0.7 + Math.random() * 0.6;
      }
      for (let i = 0; i < N; i++) {
        if (leben[i] <= 0) continue;
        leben[i] -= dt;
        if (leben[i] <= 0) { ort[i * 3 + 1] = -99; continue; }
        tempo[i * 3 + 1] -= 1.1 * dt;
        for (let k = 0; k < 3; k++) ort[i * 3 + k] += tempo[i * 3 + k] * dt;
        const h = Math.min(1, leben[i] * 2.2), funkeln = 0.75 + 0.25 * Math.sin(leben[i] * 40 + i);
        farbe.set([h * funkeln, h * funkeln * (0.78 + (i % 3) * 0.1), h * funkeln * (0.3 + (i % 4) * 0.2)], i * 3);
      }
      geo.attributes.position.needsUpdate = geo.attributes.color.needsUpdate = true;
      hell += ((an ? 1 : 0) - hell) * Math.min(1, dt * (an ? 14 : 4));
      licht.intensity = hell * (0.55 + Math.sin(performance.now() / 45) * 0.12); licht.position.copy(spitze);
    },
  };
}

export async function ladeFiguren(lader, szene, orte, kamera) {
  const lade = (n) => lader.loadAsync(`figuren/${n}.glb`);
  const bewegungen = (await lade("kaykit_bewegungen")).animations;
  const figuren = [];

  for (const [name, platz] of Object.entries(orte)) {
    const o = FIGUREN[name], [koerper, teile] = await Promise.all([lade(o.koerper), lade(o.teileDatei)]);
    const m = koerper.scene, knochen = (n) => m.getObjectByName(n);
    m.traverse((x) => { if (o.weg.includes(x.name)) x.visible = false; if (x.isMesh) x.frustumCulled = false; });
    m.updateMatrixWorld(true);
    m.scale.setScalar(o.hals / knochen("head").getWorldPosition(new THREE.Vector3()).y);
    const stueck = {};
    for (const [wo, [teil, an, mass, versatz]] of Object.entries(o.teile)) stueck[wo] = steckeAuf(teile.scene.getObjectByName(teil).clone(), knochen(an), m, mass, versatz);
    const schwanzRuhe = stueck.schwanz ? stueck.schwanz.quaternion.clone() : null;
    let spitze = null;
    if (o.hand) {                                          // Handplatz: das Stück ist in den Maßen des Knochens „handslot.r“ gebaut
      const stab = teile.scene.getObjectByName(o.hand).clone(); stab.position.set(0, 0, 0);
      knochen("handslotr").add(stab); stueck.hand = stab; spitze = stab.getObjectByName("stabspitze");
    }
    const gesicht = baueGesicht(stueck.kopf, o.kieferWinkel), funken = spitze ? baueFunken(szene) : null;
    // Aufblitzen am Zahn, wenn der Stolz einsetzt: ein kleiner Stern vor der Zahnreihe
    const bc = document.createElement("canvas"); bc.width = bc.height = 64;
    const bx = bc.getContext("2d"); bx.fillStyle = "#fff"; bx.beginPath();
    for (let i = 0; i < 8; i++) { const r = i % 2 ? 4 : 31, w = (i * Math.PI) / 4; bx.lineTo(32 + Math.cos(w) * r, 32 + Math.sin(w) * r); }
    bx.fill();
    const blitz = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(bc), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    blitz.position.set(0.04, 0.094, 0.295); stueck.kopf.add(blitz);

    const anker = new THREE.Group();
    anker.add(m); anker.position.set(platz.x, 0, platz.z);
    const schatten = new THREE.Mesh(new THREE.CircleGeometry(0.26, 32), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.38, depthWrite: false }));
    schatten.rotation.x = -Math.PI / 2; schatten.position.y = 0.012; anker.add(schatten);
    szene.add(anker);

    const mixer = new THREE.AnimationMixer(m), clip = (n) => mixer.clipAction(bewegungen.find((a) => a.name === n));
    const stehen = clip("Idle"), gehen = clip("Walking_A"), rennen = clip("Running_A"), gesten = {};
    // Wie schnell trägt ein Schritt? Den Fuß über eine Runde der Bewegung messen, dann rutscht beim Gehen und Rennen nichts
    const fuss = knochen("footl"), p = new THREE.Vector3();
    const tempoVon = (a) => {
      const dauer = a.getClip().duration, N = 32, z = [];
      a.play(); a.setEffectiveWeight(1);
      for (let i = 0; i <= N; i++) { a.time = (dauer * (i % N)) / N; mixer.update(0); m.updateMatrixWorld(true); z.push(anker.worldToLocal(fuss.getWorldPosition(p)).z); }
      a.setEffectiveWeight(0); a.time = 0;
      const zurueck = z.slice(1).map((w, i) => ((z[i] - w) * N) / dauer).sort((x, y) => y - x);   // steht der Fuß am Boden, wandert er genau so schnell nach hinten, wie die Figur vorankommt
      return (zurueck[0] + zurueck[1] + zurueck[2] + zurueck[3]) / 4;
    };
    const tempoGehen = tempoVon(gehen), tempoRennen = Math.max(tempoVon(rennen), tempoGehen * 1.8);
    console.info(`Figur ${name}: Gehen ${tempoGehen.toFixed(2)} m/s, Rennen ${tempoRennen.toFixed(2)} m/s`);
    stehen.play(); stehen.setEffectiveWeight(1);
    for (const [knopf, [n, ausdruck, danach]] of Object.entries(o.gesten)) {
      const a = clip(n); a.setLoop(THREE.LoopOnce); a.clampWhenFinished = true; a.setEffectiveWeight(0);
      gesten[knopf] = { a, dauer: a.getClip().duration, gewicht: 0, ausdruck, danach };
    }
    const profil = o.gestik || { haeufig: 0, gross: 1, lieblinge: [] }, ruheClip = bewegungen.find((a) => a.name === "Idle");
    const gestik = profil.lieblinge.map((n) => {
      const a = mixer.clipAction(nurOberkoerper(bewegungen.find((b) => b.name === n), ruheClip), undefined, THREE.AdditiveAnimationBlendMode);
      a.setLoop(THREE.LoopOnce); a.clampWhenFinished = true; a.setEffectiveWeight(0);
      return { a, name: n, dauer: a.getClip().duration };
    });
    const kopf = knochen("head"), ruecken = [knochen("spine"), knochen("chest")];
    const arme = [knochen("upperarml"), knochen("upperarmr")], unterarme = [knochen("lowerarml"), knochen("lowerarmr")];
    const zusatz = [kopf, ...ruecken, ...arme, ...unterarme].map((k) => [k, k.quaternion.clone()]);   // Knochen, über deren Bewegung Reden und Verbeugen gelegt werden
    // Messwerte fürs Testprogramm: wie weit Kopf und Rumpf aus der Grundhaltung gedreht sind (Grad), wie weit der Hut neben den Füßen steht (m)
    const lage = (kind, eltern) => eltern.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(kind.getWorldQuaternion(new THREE.Quaternion()));
    mixer.update(0); m.updateMatrixWorld(true);
    const kopfRuhe = lage(kopf, ruecken[1]), rumpfRuhe = lage(ruecken[1], m);
    const grad = (q, ruhe) => +(q.angleTo(ruhe) * 180 / Math.PI).toFixed(1);
    const sp = new THREE.Vector3(), ri = new THREE.Vector3(), sq = new THREE.Quaternion();

    figuren.push({
      name, anker, modell: m, z0: platz.z, bahn: platz.bahn || 2.4, weg: 0, hin: 1, dreh: 0, modus: "stehen", gang: 0, tempo: 0, redet: 0, seit: 0, ausdruck: "neutral", mund: null, funken, rede: null, geste: null, gestenZahl: 0, gestenNr: 0, nachklang: null, zeigt: "neutral", huepf: 0, blick: 0, blickZiel: 0, blickWarte: 1, unruhig: true,
      mass() {
        const h = stueck.kopf.getWorldPosition(new THREE.Vector3());
        return { kopfWinkel: grad(lage(kopf, ruecken[1]), kopfRuhe), rumpfWinkel: grad(lage(ruecken[1], m), rumpfRuhe), hutAbstand: +Math.hypot(h.x - anker.position.x, h.z - anker.position.z).toFixed(2),
          tempo: +this.tempo.toFixed(2), mund: +(gesicht.offen || 0).toFixed(2), lid: +(gesicht.lid || 0).toFixed(2), braue: +gesicht.wert.braueHoch.toFixed(2), winkel: +gesicht.wert.winkel.toFixed(2), blick: +this.blick.toFixed(2), kinn: +gesicht.wert.kinn.toFixed(2), zeigt: this.zeigt, funken: funken ? funken.zahl() : 0, gesten: this.gestenZahl, geste: this.geste ? this.geste.x.name : "" };
      },
      start(modus) { this.modus = modus; this.seit = 0; if (gesten[modus]) gesten[modus].a.reset().play(); },
      bewege(dt, t) {
        const g = this, geste = gesten[g.modus];
        g.seit += dt;
        if (geste && g.seit > geste.dauer - 0.2 && geste.danach) g.nachklang = { ausdruck: geste.danach, rest: 2.2 };   // nach Zaubern und Ta-daa!: zwei Sekunden eingefrorener Stolz
        if ((g.modus === "verbeugen" && g.seit > VERBEUGEN) || (geste && g.seit > geste.dauer - 0.2)) g.modus = "stehen";
        if (g.nachklang && ((g.nachklang.rest -= dt) <= 0 || g.modus !== "stehen")) g.nachklang = null;
        const zielGang = g.modus === "gehen" ? 1 : g.modus === "rennen" ? 2 : 0, unterwegs = zielGang > 0;
        g.gang += (zielGang - g.gang) * Math.min(1, dt * 5);                       // 0 stehen · 1 gehen · 2 rennen, weich dazwischen
        const wS = Math.max(0, 1 - g.gang), wR = Math.max(0, g.gang - 1), wG = 1 - wS - wR;
        g.tempo = wG * tempoGehen + wR * tempoRennen;
        g.weg += g.hin * g.tempo * dt;                                             // auf der Bahn hin und her, am Ende umdrehen
        if (g.weg > g.bahn) { g.weg = g.bahn; g.hin = -1; }
        if (g.weg < 0) { g.weg = 0; g.hin = 1; }
        const soll = unterwegs && g.hin < 0 ? Math.PI : 0;                         // im Stehen zur Tür (zum Spieler) gewandt
        g.dreh += (soll - g.dreh) * Math.min(1, dt * 7);
        g.redet += ((g.modus === "reden" ? 1 : 0) - g.redet) * Math.min(1, dt * 6);
        anker.position.z = g.z0 + g.weg; m.rotation.y = g.dreh + (g.dreh0 || 0);
        let summe = 0;                                                             // Gesten weich ein- und ausblenden, der Rest teilt sich Stehen, Gehen, Rennen
        for (const [knopf, x] of Object.entries(gesten)) {
          x.gewicht += ((knopf === g.modus ? 1 : 0) - x.gewicht) * Math.min(1, dt * 8);
          x.a.setEffectiveWeight(x.gewicht); summe += x.gewicht;
        }
        const rest = Math.max(0, 1 - summe);
        if (wG > 0.001 && !gehen.isRunning()) gehen.play();
        if (wR > 0.001 && !rennen.isRunning()) rennen.play();
        stehen.setEffectiveWeight(wS * rest); gehen.setEffectiveWeight(wG * rest); rennen.setEffectiveWeight(wR * rest);
        if (g.rede && gestik.length) {                                             // Gestik: an jedem Einsatz der Aufnahme eine Geste aus dem Profil, eine nach der anderen
          const zeit = g.rede.zeit();
          while (g.rede.i < g.rede.einsaetze.length && g.rede.einsaetze[g.rede.i] <= zeit) {
            g.rede.i++;
            if (Math.random() < profil.haeufig) g.rede.offen = 1;                    // läuft noch eine Geste, rückt die nächste gleich danach nach
          }
          if (!g.geste && g.rede.offen) { g.rede.offen = 0; const x = gestik[g.gestenNr++ % gestik.length]; x.a.reset().play(); g.geste = { x, seit: 0 }; g.gestenZahl++; }
        }
        if (g.geste) {
          const { x } = g.geste; g.geste.seit += dt;
          x.a.setEffectiveWeight(profil.gross * Math.max(0, Math.min(1, g.geste.seit / 0.16, (x.dauer - g.geste.seit) / 0.3)));
          if (g.geste.seit >= x.dauer) { x.a.stop(); g.geste = null; }
        }
        for (const [k, q] of zusatz) k.quaternion.copy(q);   // Zusatzdrehungen vom letzten Bild zurücknehmen: der Mixer setzt Knochen nur neu, wenn sich die Bewegung ändert – sonst addieren sie sich auf
        mixer.update(dt);
        for (const [k, q] of zusatz) q.copy(k.quaternion);
        const b = g.modus === "verbeugen" ? beuge(g.seit) : 0, r = g.redet;
        for (const k of ruecken) k.rotateX(0.5 * b + 0.03 * r * Math.sin(t / 310));           // Verbeugung: den Rücken nach vorn rollen
        kopf.rotateX(r * (0.07 * Math.sin(t / 190) + 0.04 * Math.sin(t / 433)));               // Reden: der Kopf nickt und neigt sich leicht
        kopf.rotateY(r * 0.10 * Math.sin(t / 610)); kopf.rotateZ(r * 0.05 * Math.sin(t / 370));
        if (schwanzRuhe) stueck.schwanz.quaternion.copy(schwanzRuhe).multiply(sq.setFromAxisAngle(HOCH, Math.sin(t / 260) * (0.18 + 0.1 * g.gang + 0.15 * r) + Math.sin(t / 75) * 0.32 * gesicht.wert.wange));   // fröhlich: der Schwanz wedelt
        const zeigt = gesten[g.modus] ? gesten[g.modus].ausdruck : g.nachklang ? g.nachklang.ausdruck : g.ausdruck === "neutral" && (g.modus === "reden" || g.mund) ? "reden" : g.ausdruck;
        if (zeigt !== g.zeigt) { if (zeigt === "lachen") g.huepf = 0.42; if (zeigt === "stolz") g.blitz = 0.9; g.zeigt = zeigt; }
        // Blick: bei Posen zur Kamera; sonst springen die Pupillen je nach Profil kurz und schnell nach links und rechts (Gary: unruhig, frech)
        const ausdruck = AUSDRUECKE[zeigt] || NEUTRAL, bl0 = o.profil.blick;
        if (ausdruck.kamera && bl0.kamera && kamera) {
          const k = stueck.kopf.worldToLocal(kamera.getWorldPosition(sp));
          g.blickZiel = Math.max(-1, Math.min(1, (k.x / Math.max(0.3, k.z)) * 2.4)); g.blickWarte = 0.5;
        } else if (g.unruhig && bl0.unruhe > 0) {
          g.blickWarte -= dt * (geste || g.geste ? 0.3 : g.modus === "stehen" ? 1 : 0.6);   // während einer Geste ruhiger, im Stehen am unruhigsten
          if (g.blickWarte <= 0) {
            const alt = g.blickZiel;
            g.blickZiel = Math.random() < 0.3 ? 0 : (Math.random() < 0.5 ? -1 : 1) * (0.45 + Math.random() * 0.55);
            g.blickWarte = (0.22 + Math.random() * 1.1) / bl0.unruhe;
            if (Math.abs(g.blickZiel - alt) > 1.1 && Math.random() < 0.35) gesicht.blinzle();   // bei einem großen Sprung manchmal blinzeln
          }
        } else g.blickZiel = 0;
        g.blick += (g.blickZiel - g.blick) * Math.min(1, dt * 30);
        g.blitz = Math.max(0, (g.blitz || 0) - dt);
        const bl = g.blitz > 0.5 ? 0 : Math.sin((g.blitz / 0.5) * Math.PI);          // kurz nach dem Einsetzen, eine halbe Sekunde lang
        blitz.material.opacity = bl; blitz.scale.setScalar(0.015 + 0.05 * bl); blitz.material.rotation = g.blitz * 3;
        gesicht.bewege(dt, ausdruck, g.mund, g.blick, o.profil.mimikTempo);
        const w = gesicht.wert;                                                    // Haltung zum Ausdruck: Kopf, Brust, Arme, kleiner Hüpfer
        kopf.rotateZ(w.neig); kopf.rotateX(-w.kinn); ruecken[1].rotateX(-0.09 * w.brust);
        arme[0].rotateZ(ARM * w.arme); arme[1].rotateZ(-ARM * w.arme);
        for (let n = 0; n < 2; n++) { arme[n].rotateX(0.55 * w.hueften); unterarme[n].rotateX(-1.05 * w.hueften); }   // Hände in die Hüften: Oberarme ab, Unterarme nach innen
        g.huepf = Math.max(0, g.huepf - dt);
        m.position.y = Math.sin((1 - g.huepf / 0.42) * Math.PI) * 0.09 + Math.abs(Math.sin(t / 210)) * 0.012 * w.wange;
        if (funken) {
          m.updateMatrixWorld(true);
          spitze.getWorldPosition(sp); ri.set(0, 1, 0).applyQuaternion(spitze.getWorldQuaternion(sq));
          funken.bewege(dt, g.modus === "zaubern" && g.seit > 0.35 && g.seit < gesten.zaubern.dauer - 0.5, sp, ri);
        }
      },
    });
  }

  return {
    liste: () => figuren.map((g) => ({ name: g.name, modus: g.modus, weg: +g.weg.toFixed(2), ort: [g.anker.position.x, g.anker.position.z], ausdruck: g.ausdruck, ...g.mass() })),
    befehl(modus) { for (const g of figuren) g.start(modus); },
    setze(name, x, z, dreh = 0) { for (const g of figuren) if (g.name === name) { g.anker.position.x = x; g.anker.position.z = z; g.z0 = z; g.weg = 0; g.hin = 1; g.dreh0 = dreh; } },   // Block B2: fester Platz und Blickrichtung im Stehen (0 = nach Süden)
    wo(name) { const g = figuren.find((f) => f.name === name); return g ? { x: g.anker.position.x, z: g.anker.position.z } : null; },
    sichtbar(name, an) { for (const g of figuren) if (g.name === name) g.anker.visible = !!an; },   // Block B1: der Stand der Geschichte blendet eine Figur ein oder aus
    ausdruck(a) { for (const g of figuren) g.ausdruck = a; },
    unruhe(an) { for (const g of figuren) g.unruhig = an; },
    rede(name, r) { for (const g of figuren) if (g.name === name) g.rede = r ? { ...r, i: 0 } : null; },   // { einsaetze: [s, …], zeit: () => s } oder null
    mund(name, m) { for (const g of figuren) if (g.name === name) g.mund = m; },      // [offen, breit] aus der Lippenbewegung, null = schweigt
    bewege(dt, t) { for (const g of figuren) g.bewege(dt, t); },
  };
}

/* Mundform zu einem Zeitpunkt aus den vorab gerechneten Zeiten von Rhubarb: [[Beginn in s, Form], …] */
export function mundAusZeiten(zeiten, zeit, tabelle = MUNDFORMEN) {
  let form = "X";
  for (const [ab, f] of zeiten) { if (ab > zeit) break; form = f; }
  return tabelle[form] || tabelle.X;
}
