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
const HOCH = new THREE.Vector3(0, 1, 0), VORN = new THREE.Vector3(0, 0, 1);

/* Ausdrücke: braueHoch −1…1 · braueDreh in rad (plus = grimmiges V) · lid 0 offen … 1 zu · unterlid 0…1 von unten (lachende Augen) · pupille Größe
   · mund 0…1 offen · breit · winkel −1…1 · laecheln 0…1 (breiter Lächelbogen) */
const NEUTRAL = { braueHoch: 0, braueDreh: 0, lid: 0, unterlid: 0, pupille: 1, mund: 0, breit: 1, winkel: 0, laecheln: 0 };
const AUSDRUECKE = {
  neutral: NEUTRAL,
  froehlich: { ...NEUTRAL, braueHoch: 0.95, braueDreh: -0.24, unterlid: 0.36, pupille: 1.2, mund: 0.42, breit: 1.2, winkel: 1, laecheln: 1 },
  erschrocken: { ...NEUTRAL, braueHoch: 1, braueDreh: -0.5, pupille: 0.55, mund: 1, breit: 0.9, winkel: -0.4 },
  ueberrascht: { ...NEUTRAL, braueHoch: 0.9, braueDreh: -0.3, pupille: 0.85, mund: 0.55, breit: 0.6 },
  grimmig: { ...NEUTRAL, braueHoch: -0.7, braueDreh: 0.32, lid: 0.42, pupille: 0.9, winkel: -1 },
};
/* Mundformen von Rhubarb Lip Sync (A–F Grundformen, G, H, X Zusatz): [offen, breit] */
export const MUNDFORMEN = { X: [0, 1], A: [0.03, 0.9], B: [0.28, 1.05], C: [0.6, 1], D: [1, 1.1], E: [0.65, 0.72], F: [0.35, 0.5], G: [0.16, 0.95], H: [0.5, 0.8] };

/* hals = Höhe des Halsansatzes über dem Boden (darauf wird der Körper verkleinert) · weg = Teile des Körpers, die nicht gezeigt werden
   teile = aufgesteckte Stücke [Name in der Teile-Datei, Knochen, Größe, Versatz] · hand = Stück für den Handplatz · gesten = Knopf → [Bewegung, Ausdruck] */
const FIGUREN = {
  gary: {
    koerper: "koerper_mage", teileDatei: "gary_teile", hals: 0.785, weg: ["1H_Wand"], kieferWeg: 0.045,
    teile: { kopf: ["fuchskopf", "head", 1.0, [0, -0.03, 0]], schwanz: ["fuchsschwanz", "hips", 1.0, [0, 0, -0.10]] },
    hand: "zauberstab",
    gestik: { haeufig: 1, gross: 1, lieblinge: ["Interact", "Spellcast_Shoot", "Cheer", "Throw", "Use_Item"] },   // Gestik-Profil: Gary gestikuliert viel und groß
    gesten: { zaubern: ["Spellcast_Long", "froehlich"], tadaa: ["Cheer", "froehlich"], schreck: ["Hit_A", "erschrocken"] },
  },
};

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
function baueGesicht(kopf, kieferWeg) {
  const teil = (n) => { const o = kopf.getObjectByName(n); return o ? { o, ort: o.position.clone(), q: o.quaternion.clone() } : null; };
  const t = Object.fromEntries(["braue_l", "braue_r", "lid_l", "lid_r", "unterlid_l", "unterlid_r", "laecheln", "pupille_l", "pupille_r", "mund", "kiefer", "mundwinkel_l", "mundwinkel_r"].map((n) => [n, teil(n)]));
  const jetzt = { ...NEUTRAL }, dreh = new THREE.Quaternion();
  let blinzeln = 2, zu = 0;
  return {
    wert: jetzt,
    bewege(dt, ziel, mund) {                             // mund = [offen, breit] aus der Lippenbewegung oder null
      for (const k in jetzt) jetzt[k] += (ziel[k] - jetzt[k]) * Math.min(1, dt * 10);
      blinzeln -= dt;
      if (blinzeln < 0) { blinzeln = 2.2 + Math.random() * 3; zu = 0.16; }
      zu = Math.max(0, zu - dt);
      const lid = Math.max(jetzt.lid, zu > 0 ? Math.sin((zu / 0.16) * Math.PI) : 0);
      const offen = mund ? Math.max(mund[0], jetzt.mund * 0.25) : jetzt.mund, breit = mund ? mund[1] : jetzt.breit;
      this.offen = offen; this.lid = lid;
      for (const [seite, s] of [["l", 1], ["r", -1]]) {
        const b = t["braue_" + seite], l = t["lid_" + seite], p = t["pupille_" + seite], w = t["mundwinkel_" + seite];
        if (b) { b.o.position.y = b.ort.y + jetzt.braueHoch * 0.026; b.o.quaternion.copy(dreh.setFromAxisAngle(VORN, s * jetzt.braueDreh)).multiply(b.q); }
        if (l) { l.o.scale.y = Math.max(0.001, lid); l.o.visible = lid > 0.03; }
        const u = t["unterlid_" + seite];
        if (u) { u.o.scale.y = Math.max(0.001, jetzt.unterlid); u.o.visible = jetzt.unterlid > 0.03; }
        if (p) p.o.scale.setScalar(jetzt.pupille);
        if (w) { w.o.position.y = w.ort.y + jetzt.winkel * 0.008 - offen * 0.004; w.o.visible = offen < 0.45 && jetzt.laecheln < 0.3; }
      }
      if (t.mund) { t.mund.o.visible = offen > 0.04; t.mund.o.scale.set(breit, Math.max(0.05, offen), 1); }
      if (t.laecheln) { t.laecheln.o.visible = jetzt.laecheln > 0.08; t.laecheln.o.scale.setScalar(0.7 + 0.3 * jetzt.laecheln); }
      if (t.kiefer) t.kiefer.o.position.y = t.kiefer.ort.y - offen * kieferWeg;
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

export async function ladeFiguren(lader, szene, orte) {
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
    const gesicht = baueGesicht(stueck.kopf, o.kieferWeg), funken = spitze ? baueFunken(szene) : null;

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
    for (const [knopf, [n, ausdruck]] of Object.entries(o.gesten)) {
      const a = clip(n); a.setLoop(THREE.LoopOnce); a.clampWhenFinished = true; a.setEffectiveWeight(0);
      gesten[knopf] = { a, dauer: a.getClip().duration, gewicht: 0, ausdruck };
    }
    const profil = o.gestik || { haeufig: 0, gross: 1, lieblinge: [] }, ruheClip = bewegungen.find((a) => a.name === "Idle");
    const gestik = profil.lieblinge.map((n) => {
      const a = mixer.clipAction(nurOberkoerper(bewegungen.find((b) => b.name === n), ruheClip), undefined, THREE.AdditiveAnimationBlendMode);
      a.setLoop(THREE.LoopOnce); a.clampWhenFinished = true; a.setEffectiveWeight(0);
      return { a, name: n, dauer: a.getClip().duration };
    });
    const kopf = knochen("head"), ruecken = [knochen("spine"), knochen("chest")];
    const zusatz = [kopf, ...ruecken].map((k) => [k, k.quaternion.clone()]);   // Knochen, über deren Bewegung Reden und Verbeugen gelegt werden
    // Messwerte fürs Testprogramm: wie weit Kopf und Rumpf aus der Grundhaltung gedreht sind (Grad), wie weit der Hut neben den Füßen steht (m)
    const lage = (kind, eltern) => eltern.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(kind.getWorldQuaternion(new THREE.Quaternion()));
    mixer.update(0); m.updateMatrixWorld(true);
    const kopfRuhe = lage(kopf, ruecken[1]), rumpfRuhe = lage(ruecken[1], m);
    const grad = (q, ruhe) => +(q.angleTo(ruhe) * 180 / Math.PI).toFixed(1);
    const sp = new THREE.Vector3(), ri = new THREE.Vector3(), sq = new THREE.Quaternion();

    figuren.push({
      name, anker, modell: m, z0: platz.z, bahn: platz.bahn || 2.4, weg: 0, hin: 1, dreh: 0, modus: "stehen", gang: 0, tempo: 0, redet: 0, seit: 0, ausdruck: "neutral", mund: null, funken, rede: null, geste: null, gestenZahl: 0, gestenNr: 0,
      mass() {
        const h = stueck.kopf.getWorldPosition(new THREE.Vector3());
        return { kopfWinkel: grad(lage(kopf, ruecken[1]), kopfRuhe), rumpfWinkel: grad(lage(ruecken[1], m), rumpfRuhe), hutAbstand: +Math.hypot(h.x - anker.position.x, h.z - anker.position.z).toFixed(2),
          tempo: +this.tempo.toFixed(2), mund: +(gesicht.offen || 0).toFixed(2), lid: +(gesicht.lid || 0).toFixed(2), braue: +gesicht.wert.braueHoch.toFixed(2), laecheln: +gesicht.wert.laecheln.toFixed(2), funken: funken ? funken.zahl() : 0, gesten: this.gestenZahl, geste: this.geste ? this.geste.x.name : "" };
      },
      start(modus) { this.modus = modus; this.seit = 0; if (gesten[modus]) gesten[modus].a.reset().play(); },
      bewege(dt, t) {
        const g = this, geste = gesten[g.modus];
        g.seit += dt;
        if ((g.modus === "verbeugen" && g.seit > VERBEUGEN) || (geste && g.seit > geste.dauer - 0.2)) g.modus = "stehen";
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
        anker.position.z = g.z0 + g.weg; m.rotation.y = g.dreh;
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
        if (schwanzRuhe) stueck.schwanz.quaternion.copy(schwanzRuhe).multiply(sq.setFromAxisAngle(HOCH, Math.sin(t / 260) * (0.18 + 0.1 * g.gang + 0.15 * r) + Math.sin(t / 75) * 0.32 * gesicht.wert.laecheln));   // fröhlich: der Schwanz wedelt
        gesicht.bewege(dt, AUSDRUECKE[geste ? geste.ausdruck : g.ausdruck] || AUSDRUECKE.neutral, g.mund);
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
    ausdruck(a) { for (const g of figuren) g.ausdruck = a; },
    rede(name, r) { for (const g of figuren) if (g.name === name) g.rede = r ? { ...r, i: 0 } : null; },   // { einsaetze: [s, …], zeit: () => s } oder null
    mund(name, m) { for (const g of figuren) if (g.name === name) g.mund = m; },      // [offen, breit] aus der Lippenbewegung, null = schweigt
    bewege(dt, t) { for (const g of figuren) g.bewege(dt, t); },
  };
}

/* Mundform zu einem Zeitpunkt aus den vorab gerechneten Zeiten von Rhubarb: [[Beginn in s, Form], …] */
export function mundAusZeiten(zeiten, zeit) {
  let form = "X";
  for (const [ab, f] of zeiten) { if (ab > zeit) break; form = f; }
  return MUNDFORMEN[form] || MUNDFORMEN.X;
}
