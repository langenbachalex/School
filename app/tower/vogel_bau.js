/* Keys of the Tower – Vogelkörper (Figuren 7, 19.11.2026): EIN Körper für alle Raben (Arthur und die sechs anderen, später die Elster)
   und – mit eigenem Profil – für die Taube. Kein KayKit, keine Datei: der Körper entsteht hier aus einfachen Formen mit eigenen Gelenken.
   Blick nach vorn = +z, die Füße stehen auf y = 0. Ein neuer Rabe = ein Eintrag in VOEGEL mit `wie: "arthur"` und einem eigenen `stueck`.
   Schritt 1 (schlanke Variante): Körper, Sitzen, langsame Kopfdrehung. Flügelschlag, Plustern, Landen, Schlüssel kommen nach der Abnahme. */
import * as THREE from "three";

/* Fußringe (Mr. Alex 19.11.): Jeder Rabe trägt wie die echten Tower-Raben einen farbigen Ring am rechten Bein – das feste Kennzeichen.
   Die Farben sind fest zugeordnet und von Mr. Alex abgenommen (19.11.); ein neuer Rabe nimmt seine Farbe von hier (ring: RINGE.name).
   Mordred, die Elster, trägt keinen Ring (entschieden Mr. Alex 19.11.) – eine Spur für aufmerksame Kinder. */
export const RINGE = {
  arthur: { farbe: 0xf2c21a, name: "gelb" },        // Gold wie seine Augen; der König
  guinevere: { farbe: 0xd8262e, name: "rot" },
  lancelot: { farbe: 0x1f6fd6, name: "blau" },
  morgana: { farbe: 0x8a3fc4, name: "violett" },
  gawain: { farbe: 0x2e9d48, name: "grün" },         // der Grüne Ritter
  percival: { farbe: 0xf2f2ec, name: "weiß" },
  mordred: null,
};

export const VOEGEL = {
  arthur: {
    name: "Arthur",
    gross: 1.3,                                       // sitzend rund 0,65 m: riesig, reicht dem Kind (1,41 m) fast bis zur Hüfte (Mr. Alex 19.11.: „huge and awe-inspiring“)
    farbe: { feder: 0x3a3a54, fluegel: 0x2e2e46, schnabel: 0x34343c, bein: 0x34343c, auge: 0xf2b824, pupille: 0x050505 },
    /* Blick (Profil-Tabelle „Arthur“): fast reglos; dreht langsam den ganzen Kopf und legt ihn schief – jede Kopfdrehung zählt */
    blick: { pause: [6, 11], weit: 1.2, tempo: 0.8, schief: 0.35, schiefOft: 0.35 },   // Sekunden zwischen zwei Drehungen · Bogenmaß · Bogenmaß je Sekunde
    blinzeln: [5, 9],
    ring: RINGE.arthur,
    schaedel: 0.058,                                  // Halbe Höhe des Schädels (vor der Vergrößerung): die Kehlfedern am Rumpf müssen darunter bleiben
    datei: "figuren/rabe.glb",                        // Blender-Fassung (werkzeuge/blender/tower_rabe.py); ladeVogel nimmt sie, bauVogel baut die einfache Fassung im Programm
    stueck: null,                                     // Erkennungsstück: (anker) => Mesh an anker.hals / .schnabel / .bein / .kopf; Arthur hat keins (goldene Augen)
  },
};

const zufall = ([a, b]) => a + Math.random() * (b - a);

export function bauVogel(wer = "arthur") {
  const P = VOEGEL[wer], F = P.farbe;
  const stoff = (farbe, mehr) => new THREE.MeshStandardMaterial({ color: farbe, roughness: 0.6, metalness: 0.05, flatShading: true, ...mehr });
  const feder = stoff(F.feder), dunkel = stoff(F.fluegel), horn = stoff(F.schnabel);
  const kugel = (rx, ry, rz, mat, n = 12) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, n, Math.max(6, n - 4)), mat); m.scale.set(rx, ry, rz); return m; };
  const gruppe = (eltern, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); eltern.add(g); return g; };
  const an = (eltern, netz, x, y, z) => { netz.position.set(x, y, z); eltern.add(netz); return netz; };

  const wurzel = new THREE.Group(); wurzel.name = "vogel_" + wer;
  const figur = gruppe(wurzel, 0, 0, 0); figur.scale.setScalar(P.gross);
  /* Vorbild: die echten Tower-Raben (Foto Mr. Alex 19.11.) – riesig, aufrecht, schwerer Hakenschnabel, zottige Kehle, finsterer Blick: ein Unglücksbote, kein Küken */
  const NEIG = -0.9;                                                    // sitzt steil aufrecht: Brust oben, die Flügelspitzen reichen bis zum Boden
  const koerper = gruppe(figur, 0, 0.25, 0); koerper.rotation.x = NEIG;
  an(koerper, kugel(0.1, 0.1, 0.2, feder, 14), 0, 0, 0);
  an(koerper, kugel(0.105, 0.085, 0.11, feder), 0, -0.02, 0.085);         // breite Brust und Schultern
  const schwanz = gruppe(koerper, 0, -0.02, -0.15); schwanz.rotation.x = 0.5;   // langer Keilschwanz, flacher als der Körper, damit er über dem Boden bleibt
  const sf = an(schwanz, new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, 0.21, 6), dunkel), 0, 0, -0.105); sf.rotation.x = Math.PI / 2; sf.scale.set(1, 1, 0.32);
  const fluegel = {};
  for (const [seite, v] of [["l", 1], ["r", -1]]) {                        // Gelenk an der Schulter; lange, spitze Flügel, eng angelegt
    const f = fluegel[seite] = gruppe(koerper, v * 0.088, 0.035, 0.1);
    const blatt = an(f, kugel(0.024, 0.085, 0.17, dunkel), v * 0.006, -0.025, -0.15); blatt.rotation.y = v * 0.08;
    const spitze = an(f, new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.16, 5), dunkel), v * -0.012, -0.045, -0.3); spitze.rotation.x = -Math.PI / 2; spitze.scale.set(0.45, 1, 1);
  }
  const hals = gruppe(koerper, 0, 0.03, 0.17); hals.rotation.x = -NEIG + 0.12;   // Kopf leicht gesenkt: er schaut von oben herab
  an(hals, kugel(0.07, 0.07, 0.07, feder), 0, 0.0, 0.0);
  for (const [x, y, zz, lang] of [[0, -0.03, 0.05, 0.11], [-0.035, -0.02, 0.04, 0.1], [0.035, -0.02, 0.04, 0.1], [-0.02, -0.055, 0.045, 0.1], [0.02, -0.055, 0.045, 0.1], [-0.055, -0.03, 0.01, 0.09], [0.055, -0.03, 0.01, 0.09]]) {
    const zotte = an(hals, new THREE.Mesh(new THREE.ConeGeometry(0.024, lang, 4), feder), x, y, zz); zotte.rotation.x = Math.PI - 0.35; zotte.rotation.z = x * 4;   // zottige Kehlfedern, hängen wie ein Bart (plustern sich später)
  }
  const kopf = gruppe(hals, 0, 0.068, 0.025);
  an(kopf, kugel(0.054, 0.05, 0.072, feder), 0, 0, 0);                    // flacher, langer Schädel
  const schnabel = gruppe(kopf, 0, -0.004, 0.055);                        // schwerer Schnabel, so lang wie der Kopf, mit Haken; der untere Teil klappt (Reden, Schlüssel)
  const oben = an(schnabel, new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.036, 0.13, 6), horn), 0, 0.006, 0.062); oben.rotation.x = Math.PI / 2 + 0.1; oben.scale.set(0.72, 1, 1.1);
  const haken = an(schnabel, new THREE.Mesh(new THREE.ConeGeometry(0.0135, 0.045, 6), horn), 0, -0.012, 0.136); haken.rotation.x = Math.PI / 2 + 0.85; haken.scale.set(0.72, 1, 1.1);
  an(schnabel, kugel(0.027, 0.02, 0.05, feder, 8), 0, 0.03, 0.02);        // Borsten über dem Schnabelansatz
  const unten = gruppe(schnabel, 0, -0.012, 0.0);
  const uk = an(unten, new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.024, 0.105, 6), horn), 0, -0.008, 0.05); uk.rotation.x = Math.PI / 2; uk.scale.set(0.72, 1, 0.5);
  const augen = [];
  for (const v of [1, -1]) {
    const a = gruppe(kopf, v * 0.045, 0.012, 0.034);
    an(a, kugel(0.0095, 0.0095, 0.0095, new THREE.MeshStandardMaterial({ color: F.auge, emissive: F.auge, emissiveIntensity: 0.7, roughness: 0.3 }), 10), 0, 0, 0);
    an(a, kugel(0.005, 0.005, 0.005, new THREE.MeshBasicMaterial({ color: F.pupille }), 8), v * 0.0062, 0, 0.003);
    const braue = an(a, kugel(0.016, 0.008, 0.028, feder, 8), v * 0.001, 0.0095, 0.002); braue.rotation.x = 0.4; braue.rotation.z = v * -0.25;   // schwere, nach vorn abfallende Braue: finsterer Blick
    augen.push(a);
  }
  const beine = {};
  for (const [seite, v] of [["l", 1], ["r", -1]]) {
    const b = beine[seite] = gruppe(figur, v * 0.045, 0.13, 0.0);
    an(b, kugel(0.034, 0.06, 0.04, feder, 8), 0, 0.005, -0.005);          // gefiederte „Hosen“
    an(b, new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.012, 0.13, 5), stoff(F.bein)), 0, -0.065, 0);
    for (const [wx, lang] of [[-0.5, 0.075], [0, 0.085], [0.5, 0.075], [Math.PI, 0.05]]) {   // drei Zehen nach vorn, eine nach hinten, mit Krallen
      const zeh = an(b, new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.012, lang), stoff(F.bein)), Math.sin(wx) * lang / 2, -0.124, Math.cos(wx) * lang / 2); zeh.rotation.y = wx;
      const kralle = an(b, new THREE.Mesh(new THREE.ConeGeometry(0.0055, 0.028, 4), stoff(0x0a0a0c)), Math.sin(wx) * (lang + 0.008), -0.118, Math.cos(wx) * (lang + 0.008)); kralle.rotation.order = "YXZ"; kralle.rotation.y = wx; kralle.rotation.x = Math.PI / 2 + 0.6;
    }
  }
  const g = { ring: gruppe(beine.r, 0, -0.072, 0), figur, koerper, hals, kopf, schnabel, schnabel_unten: unten, fluegel_l: fluegel.l, fluegel_r: fluegel.r, schwanz, bein_l: beine.l, bein_r: beine.r };
  if (P.stueck) P.stueck({ hals, kopf, schnabel, bein: beine.r });
  return verhalten(wer, wurzel, g, augen);
}

/* Die Blender-Fassung laden: dieselben Gelenke (Namen rabe_…), dasselbe Verhalten */
export async function ladeVogel(lader, wer = "arthur") {
  const P = VOEGEL[wer], gltf = await lader.loadAsync(P.datei), teil = (n) => gltf.scene.getObjectByName("rabe_" + n);
  const wurzel = new THREE.Group(); wurzel.name = "vogel_" + wer;
  const figur = new THREE.Group(); figur.scale.setScalar(P.gross); figur.add(gltf.scene); wurzel.add(figur);
  const g = { figur, koerper: teil("koerper"), kehle: teil("kehle"), kopf: teil("kopf"), schnabel_unten: teil("schnabel_unten"), fluegel_l: teil("fluegel_l"), fluegel_r: teil("fluegel_r"), hand_l: teil("hand_l"), hand_r: teil("hand_r"), schwanz: teil("schwanz"), bein_l: teil("bein_l"), bein_r: teil("bein_r"), ring: teil("ring") };
  for (const [n, o] of Object.entries(g)) if (!o) throw new Error(`Rabe: Gelenk ${n} fehlt in ${P.datei}`);
  if (P.stueck) P.stueck({ hals: g.koerper, kopf: g.kopf, schnabel: g.schnabel_unten, bein: g.bein_r });
  return verhalten(wer, wurzel, g, [teil("auge_l"), teil("auge_r")], "blender");
}

function verhalten(wer, wurzel, g, augen, bau = "programm") {
  const P = VOEGEL[wer], { koerper, kopf } = g;
  if (P.ring) { const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.0175, 0.0175, 0.017, 14), new THREE.MeshStandardMaterial({ color: P.ring.farbe, roughness: 0.45, emissive: P.ring.farbe, emissiveIntensity: 0.25 })); ring.name = "vogel_ring"; g.ring.add(ring); }

  /* Sitzen: fast reglos. Nur der Atem, ein Blinzeln – und ab und zu dreht sich der ganze Kopf langsam in eine neue Richtung, manchmal legt er sich schief. */
  const z = { warte: zufall(P.blick.pause) / 2, zielY: 0, zielZ: 0, blinzel: zufall(P.blinzeln), zu: 0, zeit: 0, drehungen: 0 };
  const hin = (wert, ziel, dt) => wert + Math.max(-P.blick.tempo * dt, Math.min(P.blick.tempo * dt, (ziel - wert) * Math.min(1, dt * 3)));
  function bewege(dt) {
    z.zeit += dt;
    koerper.scale.setScalar(1 + Math.sin(z.zeit * 1.1) * 0.012);                        // atmen
    if ((z.warte -= dt) <= 0) {
      z.warte = zufall(P.blick.pause); z.drehungen++;
      let neu; do { neu = (Math.random() * 2 - 1) * P.blick.weit; } while (Math.abs(neu - z.zielY) < 0.5);   // immer eine deutliche Drehung
      z.zielY = neu; z.zielZ = Math.random() < P.blick.schiefOft ? (Math.random() < 0.5 ? 1 : -1) * P.blick.schief : 0;
    }
    kopf.rotation.y = hin(kopf.rotation.y, z.zielY, dt); kopf.rotation.z = hin(kopf.rotation.z, z.zielZ, dt);
    if ((z.blinzel -= dt) <= 0) { z.blinzel = zufall(P.blinzeln); z.zu = 0.14; }
    z.zu = Math.max(0, z.zu - dt); for (const a of augen) a.scale.y = z.zu > 0 ? 0.12 : 1;
  }
  const kasten = new THREE.Box3(), ort = new THREE.Vector3();
  /* schau: Kopf sofort in eine Richtung stellen und dort halten (Bilder, Prüfung) */
  const schau = (y, schief = 0) => { z.zielY = kopf.rotation.y = y; z.zielZ = kopf.rotation.z = schief; z.warte = 30; };
  function zustand() {
    wurzel.updateMatrixWorld(true); kasten.setFromObject(wurzel);
    const kehleOben = g.kehle ? +kasten.clone().setFromObject(g.kehle).max.y.toFixed(3) : null, kopfUnten = +(kopf.getWorldPosition(ort).y - P.schaedel * P.gross).toFixed(3);
    return { wer, bau, kehleOben, kopfUnten, ring: P.ring ? { name: P.ring.name, hoch: +g.ring.getWorldPosition(ort).y.toFixed(3) } : null, name: P.name, ort: wurzel.position.toArray().map((v) => +v.toFixed(3)), dreh: +wurzel.rotation.y.toFixed(3), hoch: +(kasten.max.y - kasten.min.y).toFixed(3), fuss: +kasten.min.y.toFixed(3),
      kopf: [+kopf.rotation.y.toFixed(4), +kopf.rotation.z.toFixed(4)], drehungen: z.drehungen, blick: P.blick };
  }
  /* setze: Ort der Füße und Blickrichtung (0 = nach Süden, +z) */
  const setze = (x, y, zz, dreh = 0) => { wurzel.position.set(x, y, zz); wurzel.rotation.y = dreh; };
  return { wurzel, g, bewege, zustand, setze, schau };
}
