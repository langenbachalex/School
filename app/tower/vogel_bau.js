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
    /* Flug: Flügelschlag im Sitzen langsam und schwer (Sekunden) · Landen · Takt der Schläge im Anflug · Neigung des Körpers im Flug · wie weit Arm, Hand und Federn sich öffnen */
    /* Tempo aus den Filmen der Tower-Raben (Mr. Alex 19.11.: die erste Fassung war „viel zu langsam“): Flügel strecken im Sitzen rund 1 s,
       im Flug drei Schläge je Sekunde, beim Bremsen fünf */
    flug: { schlagDauer: 1.55, takt: 0.33, bremsTakt: 0.2, anflug: 1.3, bremsen: 0.55, setzen: 0.95, bremsweg: 1.4, bremsHoch: 0.5, neig: 0.75,
      aufrichten: 0.2, ducken: 0.3, abstoss: 0.14, vorlauf: 0.04, schlagOben: 0.075, schlagHalt: 0.03, schlagAb: 0.07, hocke: 0.085, streck: 0.05, schenkel: 0.075, lauf: 0.118, abTakt: 0.17, steigen: 1.1, tempoAb: 4, tempo: 10, schlagen: 1.3, gleiten: 1.0, schraeg: 0.55, schraegMax: 0.6,   // freier Flug: Sekunden ducken · Sekunden bis zum Reiseflug · m/s beim Abheben und im Flug · Sekunden schlagen und gleiten im Wechsel · Schräglage je Kursänderung (rad je rad/s) und höchstens
      arm: 0.3, armJe: 0.03, armLang: 0.9, armDick: 1.25, hand: 0.45, handLang: 0.25, faecher: 0.8, faecherJe: 0.183, armLangJe: 0.07, woelb: -0.07, armWoelb: 0.14, schwanzLinie: 0.76, schwanzFaecher: 0.11 },
    pluster: { dauer: 1.9, kehle: 0.45, koerper: 0.06, schuettel: 0.1 },   // Plustern: Sekunden · so viel weiter stehen die Kehlfedern ab · so viel runder wird der Körper · Schütteln (Bogenmaß)
    schluessel: { vor: 0.095, hoch: -0.004, lang: 0.15, schnabel: 0.14 },      // Schlüssel quer im Schnabel (w07): Ort vor dem Gelenk des Unterschnabels · Länge · so weit steht der Schnabel offen
    ring: RINGE.arthur,
    schaedel: 0.058,                                  // Halbe Höhe des Schädels (vor der Vergrößerung): die Kehlfedern am Rumpf müssen darunter bleiben
    datei: "figuren/rabe.glb",                        // Blender-Fassung (werkzeuge/blender/tower_rabe.py); ladeVogel nimmt sie, bauVogel baut die einfache Fassung im Programm
    stueck: null,                                     // Erkennungsstück: (anker) => Mesh an anker.hals / .schnabel / .bein / .kopf; Arthur hat keins (goldene Augen)
  },
};

/* Die sechs anderen Raben (Figuren 8, 19.11., Tabelle von Mr. Alex abgenommen): derselbe Körper wie Arthur, deutlich kleiner als der König (82–90 %, Mordred 80 %),
   jeder mit seinem Ring, eigener Gestalt, eigenem Farbton im Schwarz und eigenem Temperament.
   gestalt: kehle = Kehlfedern (breit, lang) · schwanz, fluegel, kopf = Größe dieser Teile · koerper = [breit, hoch, lang] · neigung = Haltung (+ geduckt, − aufrecht) · ton = Schimmer des Gefieders
   blick.ruck: wie ruckartig der Kopf dreht (3 = ruhig) · plusterOft: Sekunden zwischen zwei Malen Plustern von selbst
   Mordred, die Elster, die sich als siebter Rabe ausgibt: der Kleinste, ohne Ring, langer Schwanz, blaugrüner Schimmer, schaut unruhig und ruckartig umher. */
for (const [wer, mehr] of Object.entries({
  guinevere: { name: "Guinevere", gross: 1.118, blick: { pause: [7, 12], weit: 1.0, tempo: 0.7, schief: 0.38, schiefOft: 0.7 }, gestalt: { kehle: [0.85, 0.8], schwanz: 1.18, fluegel: 1, kopf: 1, koerper: [0.93, 1, 1], neigung: 0, ton: 0x2a1208 } },                       // schlank, glatte Kehle, langer Schwanz, warmes Braun; legt den Kopf oft schief
  lancelot: { name: "Lancelot", gross: 1.17, blick: { pause: [4, 7], weit: 1.2, tempo: 1.1, schief: 0.3, schiefOft: 0.2 }, gestalt: { kehle: [1.1, 1], schwanz: 1, fluegel: 1.04, kopf: 1, koerper: [1.1, 1, 1], neigung: -0.1, ton: 0x06162e } },                            // breite Brust, aufrecht, Stahlblau; wach, dreht zügig
  morgana: { name: "Morgana", gross: 1.092, blick: { pause: [10, 17], weit: 0.9, tempo: 0.45, schief: 0.4, schiefOft: 0.4 }, gestalt: { kehle: [1.25, 1.45], schwanz: 1, fluegel: 1, kopf: 1, koerper: [1, 1, 1], neigung: 0.04, ton: 0x1c0830 } },                           // lange, zottige Kehlfedern, Violett; sehr langsam, lange Pausen
  gawain: { name: "Gawain", gross: 1.144, blick: { pause: [6, 10], weit: 1.2, tempo: 0.85, schief: 0.3, schiefOft: 0.3 }, plusterOft: [9, 16], gestalt: { kehle: [1.15, 1.1], schwanz: 0.84, fluegel: 0.97, kopf: 1, koerper: [1.12, 1.03, 0.97], neigung: 0, ton: 0x06200c } },   // rundlich, kurzer Schwanz, grüner Glanz; plustert sich öfter
  percival: { name: "Percival", gross: 1.066, blick: { pause: [3, 6], weit: 1.2, tempo: 1.0, schief: 0.4, schiefOft: 0.5 }, blinzeln: [1.5, 3.5], gestalt: { kehle: [0.9, 0.9], schwanz: 1, fluegel: 1, kopf: 0.9, koerper: [0.94, 1, 1], neigung: -0.04, ton: 0x1c1e22 } },   // kleiner Kopf, schlank, silbriges Grau; neugierig, blinzelt oft
  mordred: { name: "Mordred", gross: 1.04, blick: { pause: [1, 3], weit: 1.4, tempo: 2.4, schief: 0.25, schiefOft: 0.25, ruck: 10 }, blinzeln: [2, 5], gestalt: { kehle: [0.85, 0.7], schwanz: 1.3, fluegel: 1, kopf: 1, koerper: [0.95, 1, 1], neigung: 0.12, ton: 0x04262a } },   // kürzere Kehlfedern, langer Schwanz, geduckt, blaugrüner Elsternglanz
})) VOEGEL[wer] = { ...VOEGEL.arthur, ...mehr, ring: RINGE[wer] };
export const RABENREIHE = ["guinevere", "lancelot", "morgana", "arthur", "gawain", "percival", "mordred"];
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
  const hin = (wert, ziel, dt) => wert + Math.max(-P.blick.tempo * dt, Math.min(P.blick.tempo * dt, (ziel - wert) * Math.min(1, dt * (P.blick.ruck || 3))));
  const pl = { t: -1, auf: 0, warte: P.plusterOft ? zufall(P.plusterOft) : Infinity }, koerperDreh = koerper.rotation.y;
  /* Gestalt je Rabe: Teile strecken oder stauchen, Haltung, Schimmer im Gefieder – Arthur hat keine (er ist das Maß) */
  const GE = P.gestalt || null, kMass = GE ? GE.koerper : [1, 1, 1], kehleMass = GE ? GE.kehle : [1, 1];
  if (GE) {
    if (g.kehle) g.kehle.scale.set(kehleMass[0], kehleMass[1], kehleMass[0]);
    g.schwanz.scale.setScalar(GE.schwanz); kopf.scale.setScalar(GE.kopf); g.fluegel_l.scale.setScalar(GE.fluegel); g.fluegel_r.scale.setScalar(GE.fluegel); koerper.rotation.x += GE.neigung;
    const fertig = new Set(); wurzel.traverse((o) => { if (o.isMesh && o.material && o.material.name === "gefieder" && !fertig.has(o.material)) { fertig.add(o.material); o.material.emissive = new THREE.Color(GE.ton); o.material.emissiveIntensity = 0.3; /* nur ein Hauch – sie bleiben schwarze Raben */ } });
  }
  /* Plustern (Figuren 8): nur im Sitzen */
  function plustere() { if (flug.tut !== "sitzt" || pl.t >= 0) return false; pl.t = 0; return true; }
  /* Schlüssel im Schnabel (w07 „There is a key in his beak.“): ein alter goldener Schlüssel, quer gehalten; der Schnabel steht dafür einen Spalt offen */
  let schluesselTeil = null;
  function schluessel(an) {
    const S = P.schluessel, unten = g.schnabel_unten;
    if (an && !schluesselTeil) {
      const gold = new THREE.MeshStandardMaterial({ color: 0xd9a520, roughness: 0.35, metalness: 0.6, emissive: 0x4a3200, emissiveIntensity: 0.6 });
      const teil = (geo, x, y) => { const m = new THREE.Mesh(geo, gold); m.position.set(x, y, 0); schluesselTeil.add(m); return m; };
      schluesselTeil = new THREE.Group(); schluesselTeil.name = "vogel_schluessel";
      teil(new THREE.CylinderGeometry(0.006, 0.006, S.lang, 8), 0, 0).rotation.z = Math.PI / 2;                       // Schaft, quer
      teil(new THREE.TorusGeometry(0.02, 0.006, 8, 16), -S.lang / 2 - 0.018, 0);                                      // Griff (Reide)
      teil(new THREE.BoxGeometry(0.02, 0.03, 0.006), S.lang / 2 - 0.012, -0.015); teil(new THREE.BoxGeometry(0.01, 0.02, 0.006), S.lang / 2 - 0.032, -0.01);   // Bart
      schluesselTeil.position.set(unten.position.x, unten.position.y + S.hoch, unten.position.z + S.vor); unten.parent.add(schluesselTeil);
    }
    if (schluesselTeil) schluesselTeil.visible = !!an;
    unten.rotation.x = an ? S.schnabel : 0; return !!an;
  }
  function bewege(dt) {
    z.zeit += dt;
    if (flug.tut !== "sitzt") { bewegeFlug(dt); z.warte = Math.max(z.warte, 1); }
    { const atem = 1 + Math.sin(z.zeit * 1.1) * 0.012; koerper.scale.set(kMass[0] * atem, kMass[1] * atem, kMass[2] * atem); }   // atmen
    if (flug.tut === "sitzt" && pl.t < 0 && (pl.warte -= dt) <= 0) { pl.warte = zufall(P.plusterOft); pl.t = 0; }   // manche plustern sich von selbst
    if (pl.t >= 0) {                                                                      // plustern: Kehlfedern stellen sich auf, der Körper wird runder, ein kurzes Schütteln, alles legt sich wieder
      pl.t += dt; const u = pl.t / P.pluster.dauer; pl.auf = u >= 1 ? 0 : stufen(u, [[0, 0], [0.22, 1], [0.7, 1], [1, 0]]); if (u >= 1) pl.t = -1;
      koerper.scale.multiplyScalar(1 + P.pluster.koerper * pl.auf); if (g.kehle) g.kehle.scale.set(kehleMass[0] * (1 + P.pluster.kehle * pl.auf), kehleMass[1] * (1 + P.pluster.kehle * 0.4 * pl.auf), kehleMass[0] * (1 + P.pluster.kehle * pl.auf));
      koerper.rotation.y = koerperDreh + (u < 1 ? Math.sin(pl.t * 34) * P.pluster.schuettel * glatt((u - 0.3) / 0.1) * (1 - glatt((u - 0.6) / 0.12)) : 0);
    }
    if ((z.warte -= dt) <= 0) {
      z.warte = zufall(P.blick.pause); z.drehungen++;
      let neu; do { neu = (Math.random() * 2 - 1) * P.blick.weit; } while (Math.abs(neu - z.zielY) < 0.5);   // immer eine deutliche Drehung
      z.zielY = neu; z.zielZ = Math.random() < P.blick.schiefOft ? (Math.random() < 0.5 ? 1 : -1) * P.blick.schief : 0;
    }
    kopf.rotation.y = hin(kopf.rotation.y, z.zielY, dt); kopf.rotation.z = hin(kopf.rotation.z, z.zielZ, dt);
    if ((z.blinzel -= dt) <= 0) { z.blinzel = zufall(P.blinzeln); z.zu = 0.14; }
    z.zu = Math.max(0, z.zu - dt); for (const a of augen) a.scale.y = z.zu > 0 ? 0.12 : 1;
  }
  /* ---------- Flügel (nur Blender-Fassung): ausbreiten, schlagen, landen ----------
     Der Flügel ist angelegt gebaut. Aus seinen drei Richtungen (wd = dahin zeigen die Federn, wn = Außenseite, e = Hinterkante) wird die Drehung
     in die ausgebreitete Lage gerechnet: e zeigt dann zur Seite, wd nach hinten, wn nach oben. Hand und Schwungfedern fächern sich dazu auf.
     auf: 0 = angelegt … 1 = ausgebreitet · schlag: Winkel um die Längsachse (+ = Flügel oben) · neig: so weit ist der Körper nach vorn gekippt (Flug) */
  const FL = P.flug, glatt = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
  const seiten = bau === "blender" ? [["l", 1], ["r", -1]].map(([s, v]) => {
    const F = g["fluegel_" + s], H = g["hand_" + s], arm = g.figur.getObjectByName("rabe_arm_" + s), vek = (n) => new THREE.Vector3(...F.userData[n]);
    const teile = (kurz, zahl) => Array.from({ length: zahl }, (_, i) => { const o = g.figur.getObjectByName("rabe_" + kurz + "_" + s + "_" + i); return { o, ort: o.position.clone() }; });
    return { v, F, H, arm, decke: g.figur.getObjectByName("rabe_decke_" + s), breit: g.figur.getObjectByName("rabe_handoffen_" + s), wd: vek("wd"), wn: vek("wn"), e: vek("e"), handOrt: H.position.clone(), arme: teile("as", 6), haende: teile("hs", 7) };
  }) : [];
  const flug = { tut: "sitzt", t: 0, auf: 0, schlag: 0, neig: 0, knick: 0, biege: 0, faecher: 0, senk: 0, beine: 0, ziel: null, von: null };
  const mA = new THREE.Matrix4(), mB = new THREE.Matrix4(), qOffen = new THREE.Quaternion(), qSchlag = new THREE.Quaternion(), qNull = new THREE.Quaternion(), qVor = new THREE.Quaternion(), va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3();
  /* Schwanz: jede Feder mit eigenem Gelenk (Angabe i = Platz im Fächer), der Bürzel dreht halb mit */
  const schwanzTn = seiten.length ? new THREE.Vector3(...g.schwanz.userData.tn) : null, buerzel = seiten.length ? g.figur.getObjectByName("rabe_buerzel") : null;
  const schwanzfedern = seiten.length ? g.schwanz.children.filter((o) => o.name.startsWith("rabe_sf_")).map((o) => ({ o, i: o.userData.i })) : [];
  const RUHE = { auf: 0, schlag: 0, neig: 0, knick: 0, biege: 0, faecher: 0, senk: 0, beine: 0 };
  /* pose: die ganze Flughaltung aus acht Zahlen.
     auf 0…1 ausgebreitet · schlag = Winkel der Flügel (+ oben) · neig = Körper nach vorn gekippt (waagerecht im Flug, negativ = zurückgelehnt beim Bremsen)
     knick = Handgelenk (+ Spitzen oben, − Hand hängt: das „M“ beim Anheben, die Wölbung im Gleiten) · biege = die äußeren Handschwingen biegen sich hoch
     faecher 0…1 Schwanz gefächert · senk = Schwanz nach unten gedrückt (Bremse) · beine = Beine nach vorn gestreckt */
  function pose(p) {
    Object.assign(flug, p);
    const { auf, schlag, neig, knick, biege, faecher, senk, beine } = p;
    g.figur.rotation.x = neig; kopf.rotation.x = -neig * 0.85; g.bein_l.rotation.x = g.bein_r.rotation.x = neig * 1.25 - beine;
    const c = Math.cos(neig), sn = Math.sin(neig);
    for (const w of seiten) {
      mA.makeBasis(w.e, w.wn, w.wd).transpose();                                         // angelegte Lage → Grundlage
      mB.makeBasis(va.set(w.v, 0, 0), vb.set(0, c, -sn), vc.set(0, -sn, -c));             // Ziel: zur Seite, oben, hinten (gegen die Neigung des Körpers gerechnet)
      qOffen.setFromRotationMatrix(mB.multiply(mA));
      qSchlag.setFromAxisAngle(va.set(0, sn, c), w.v * schlag);
      w.F.quaternion.copy(qNull).slerp(qOffen, auf).premultiply(qSchlag); if (p.vor) w.F.quaternion.premultiply(qVor.setFromAxisAngle(vb.set(0, c, -sn), w.v * p.vor));   // vor: die Flügel schwingen im Abschlag nach vorn (Film: beim Abheben greifen sie vor den Körper)
      w.H.position.copy(w.handOrt).addScaledVector(w.e, FL.arm * auf);
      w.H.quaternion.setFromAxisAngle(w.wn, -w.v * FL.hand * auf).premultiply(qSchlag.setFromAxisAngle(w.wd, -w.v * (knick + FL.woelb) * auf));   // FL.woelb: die Hand hängt immer ein wenig – der Flügel ist nach unten gewölbt
      w.haende.forEach((f, j) => { f.o.quaternion.setFromAxisAngle(w.wn, -w.v * (FL.faecher - j * FL.faecherJe) * auf).premultiply(qSchlag.setFromAxisAngle(w.wd, -w.v * biege * auf * (1 - j / 6))); f.o.scale.setScalar(1 + FL.handLang * auf); });
      w.arme.forEach((f, i) => { f.o.position.copy(f.ort).addScaledVector(w.e, (0.05 + i * FL.armJe) * auf); f.o.quaternion.setFromAxisAngle(w.wn, -w.v * i * 0.05 * auf).premultiply(qSchlag.setFromAxisAngle(w.e, -w.v * FL.armWoelb * auf)); f.o.scale.setScalar(1 + (FL.armLang + i * FL.armLangJe) * auf); });   // armLangJe: nach außen werden die Armschwingen länger – die Hinterkante läuft rund in die Hand · armWoelb: die Hinterkante am Arm liegt etwas tiefer
      w.arm.visible = auf > 0.02; w.arm.scale.setScalar(Math.max(auf * FL.armDick, 0.001));
      w.decke.visible = auf < 0.98; w.decke.scale.setScalar(Math.max(1 - auf, 0.001));    // die Deckfedern des angelegten Flügels weichen der glatten Armdecke
      w.breit.visible = auf > 0.02; w.breit.scale.setScalar(Math.max(auf, 0.001));          // die breite Hand wächst beim Ausbreiten aus dem Handgelenk
    }
    const lage = Math.max(0, Math.min(1, neig / FL.neig));                                // im Flug liegt der Schwanz in einer Linie mit dem Körper
    g.schwanz.rotation.x = -FL.schwanzLinie * lage - senk; buerzel.rotation.x = g.schwanz.rotation.x * 0.5;
    for (const f of schwanzfedern) f.o.quaternion.setFromAxisAngle(schwanzTn, -f.i * FL.schwanzFaecher * faecher);
  }
  /* Hocke (Figuren 8): der Körper sinkt um d, die Füße bleiben stehen. Das Bein hat zwei Glieder – Schenkel (in den „Hosen“, Länge FL.schenkel) und Lauf (FL.lauf) –,
     die Ferse dazwischen knickt nach hinten; der Fuß bleibt flach auf dem Boden, auch wenn der Körper um neig vorgebeugt ist. d = 0 stellt alles zurück. */
  const beinTeile = seiten.length ? ["l", "r"].map((s) => ({ bein: g["bein_" + s], lauf: g.figur.getObjectByName("rabe_lauf_" + s), fuss: g.figur.getObjectByName("rabe_fuss_" + s), ort: g["bein_" + s].position.clone() })).filter((bn) => bn.lauf && bn.fuss) : [];
  const koerperHoch = koerper.position.y;
  function hocke(d, neig) {
    flug.hocke = d; koerper.position.y = koerperHoch - d;
    const L1 = FL.schenkel, L2 = FL.lauf, D = L1 + L2 - d, A = d > 0 ? Math.acos(Math.max(-1, Math.min(1, (L2 * L2 + D * D - L1 * L1) / (2 * L2 * D)))) : 0, w = d > 0 ? Math.atan2(L2 * Math.sin(A), D - L2 * Math.cos(A)) : 0;
    for (const bn of beinTeile) {
      bn.bein.position.set(bn.ort.x, bn.ort.y + L2 * (Math.cos(A) - 1), bn.ort.z - L2 * Math.sin(A));
      if (d > 0 || neig) { bn.bein.rotation.x = w; bn.fuss.rotation.x = A - neig; } else bn.fuss.rotation.x = 0;
      bn.lauf.rotation.x = -A - w;
    }
  }
  if (seiten.length) pose(RUHE);
  const stufen = (u, punkte) => { for (let i = 1; i < punkte.length; i++) if (u <= punkte[i][0]) { const [u0, w0] = punkte[i - 1], [u1, w1] = punkte[i]; return w0 + (w1 - w0) * glatt((u - u0) / (u1 - u0)); } return punkte[punkte.length - 1][1]; };
  /* Ein Schlag im Flug: φ = 0 Flügel oben. Im Abschlag läuft die Hand nach (Spitzen oben), im Aufschlag hängt sie und der Flügel zieht sich etwas ein. */
  const schlagen = (phi, weit, mitte) => { const w = 2 * Math.PI * phi, si = Math.sin(w); return { schlag: mitte + weit * Math.cos(w), knick: si > 0 ? 0.45 * si : 0.3 * si, biege: 0.25 + 0.3 * Math.max(0, si), auf: 1 - 0.18 * Math.max(0, -si) }; };
  /* Flügelschlag im Sitzen (Filme der Tower-Raben: rund eine Sekunde): hochreißen – die Handgelenke zuerst, „M“ –, steil zum V, ein kräftiger Schlag, anlegen */
  function fluegelschlag() { if (!seiten.length || flug.tut !== "sitzt") return false; flug.tut = "schlag"; flug.t = 0; z.zielY = z.zielZ = 0; return true; }
  /* Landen: tiefer, schneller Anflug von `von` auf `ziel` zu, dann hartes Bremsen – aufgerichtet, Flügel im V mit kurzen schnellen Schlägen,
     Schwanz weit gefächert und nach unten, Beine nach vorn –, aufsetzen, anlegen */
  function lande(ziel, von, aus = null) { if (!seiten.length) return false; flug.tut = "landet"; flug.t = 0; flug.ziel = ziel; flug.von = von; flug.aus = aus; flug.roll = 0; g.figur.rotation.z = 0; z.zielY = z.zielZ = 0; kopf.rotation.y = kopf.rotation.z = 0; return true; }   // aus: Haltung, aus der er kommt (freier Flug) – der Anflug blendet weich über
  /* Freier Flug (Figuren 8, Wunsch Mr. Alex 19.11.): kurz ducken, mit schnellen Schlägen abheben, dann die Bahn durch `punkte` fliegen – Schräglage in den Kurven,
     Schlagen und Gleiten im Wechsel –, am letzten Punkt geht es in lande(ziel) über. Der letzte Punkt liegt tief und gut 10 m vor dem Ziel. */
  function fliege(punkte, ziel) {
    if (!seiten.length || flug.tut !== "sitzt") return false; const p = wurzel.position;
    flug.bahn = new THREE.CatmullRomCurve3([p.clone(), ...punkte.map((q) => new THREE.Vector3(q.x, q.y, q.z))], false, "centripetal"); flug.lang = flug.bahn.getLength();
    flug.weg = 0; flug.roll = 0; flug.phi = 0.5; flug.kurs = wurzel.rotation.y; flug.tut = "fliegt"; flug.t = 0; flug.ziel = ziel; z.zielY = z.zielZ = 0; kopf.rotation.y = kopf.rotation.z = 0; return true;
  }
  function bewegeFlug(dt) {
    flug.t += dt; const t = flug.t;
    if (flug.tut === "schlag") {
      const u = t / FL.schlagDauer;
      /* Figuren 8 (19.11., Rückmeldung Claude, OK Mr. Alex): zwei kräftige Schläge statt einem, der Körper geht mit (vor im Aufschlag, zurück und hoch im Abschlag), ruhiges Anlegen in einer halben Sekunde */
      pose({ auf: stufen(u, [[0, 0], [0.14, 0.75], [0.24, 1], [0.68, 1], [1, 0]]), schlag: stufen(u, [[0, 0], [0.14, 0.75], [0.25, 1.15], [0.37, -0.4], [0.49, 0.95], [0.61, -0.35], [0.71, 0.2], [1, 0]]),
        knick: stufen(u, [[0, 0], [0.12, -0.7], [0.25, 0], [0.31, 0.5], [0.37, 0], [0.43, -0.3], [0.49, 0], [0.55, 0.5], [0.61, 0], [1, 0]]), biege: stufen(u, [[0, 0], [0.25, 0.3], [0.31, 0.6], [0.43, 0.25], [0.55, 0.6], [0.7, 0.2], [1, 0]]),
        neig: stufen(u, [[0, 0], [0.1, 0.07], [0.25, 0.2], [0.37, 0.04], [0.49, 0.18], [0.61, 0.03], [0.8, 0.06], [1, 0]]), faecher: stufen(u, [[0, 0], [0.25, 0.45], [0.66, 0.45], [1, 0]]), senk: stufen(u, [[0, 0], [0.25, 0], [0.37, 0.14], [0.49, 0], [0.61, 0.14], [0.78, 0], [1, 0]]), beine: 0 });
      g.figur.position.y = 0.04 * P.gross * stufen(u, [[0, 0], [0.25, 0], [0.37, 1], [0.49, 0.25], [0.61, 1], [0.76, 0], [1, 0]]);      // jeder Schlag hebt ihn ein wenig
      if (u >= 1) { pose(RUHE); g.figur.position.y = 0; flug.tut = "sitzt"; z.warte = zufall(P.blick.pause) / 2; }
    } else if (flug.tut === "fliegt") {
      /* Abheben in Schlüsselhaltungen aus dem Zeitlupen-Film „Raven taking flight!“ (Mr. Alex 19.11.: erst ein Sprung aus den Füßen mit EINEM großen Flügelschlag, dann schnell):
         ducken (tD) – die Fersen knicken nach hinten, der Körper sinkt und schiebt sich vor, Flügel angelegt · abstoßen (tP) – die Beine strecken sich schlagartig ·
         Sprung auf der Bahn: die Flügel gehen in EINEM Zug hoch (oben nach tO) und ziehen einmal tief durch (unten nach tU), die Beine hängen nach · erst dann schnelle Schläge.
         Die Flügel beginnen schon im Abstoßen und laufen ohne Halt durch den Absprung – kein Schnitt zwischen den Teilen. */
      const tA = FL.aufrichten; if (t < tA) { pose(RUHE); hocke(-FL.streck * glatt(t / tA), 0); return; }   // erst richtet er sich auf (die Schenkel kommen aus dem Gefieder) – dann hat das Ducken Weg nach unten (OK Mr. Alex 19.11.)
      const T = t - tA, tD = FL.ducken, tP = FL.abstoss, tO = FL.schlagOben - FL.vorlauf + FL.schlagHalt, tU = tO + FL.schlagAb, tS = FL.steigen, tf = T - tD - tP;   // tf: Zeit, seit die Füße den Boden verlassen haben
      const fl = tf + FL.vorlauf, hoch1 = glatt(fl / FL.schlagOben), ab1 = glatt((tf - tO) / (tU - tO));   // Zeiten Bild für Bild aus der Zeitlupe (4-fach): die Flügel öffnen sich einen Wimpernschlag vor dem Absprung, sind nach 0,06 s oben und nach weiteren 0,08 s unten
      const erster = { auf: glatt(fl / (FL.schlagOben * 0.8)), schlag: 1.2 * hoch1 - 1.95 * ab1, knick: -0.55 * Math.sin(Math.PI * hoch1) * (1 - ab1) + 0.45 * Math.sin(Math.PI * ab1), biege: 0.25 * hoch1 + 0.3 * Math.sin(Math.PI * ab1), vor: -0.95 * glatt(ab1 * 1.2) };   // der Abschlag endet vorn unter dem Körper (Film)
      if (tf < 0) {                                                                          // noch am Boden: ducken, dann abstoßen
        const u = (T - tD) / tP, neig = 0.5 * glatt(T / tD) - 0.08 * glatt(u);
        pose({ ...erster, neig, faecher: 0, senk: 0, beine: 0 }); hocke(T < tD ? -FL.streck + (FL.hocke + FL.streck) * glatt(T / tD) : FL.hocke - (FL.hocke + FL.streck) * u * u, neig); return;   // abstoßen: die Beine strecken sich ganz, der Körper hebt sich über die Sitzhöhe (die Schenkel kommen aus dem Gefieder)
      }
      const start = glatt((tf - tU) / tS);                                                   // start 0…1: nach dem Sprung vom schnellen Steigen in den Reiseflug
      flug.weg += dt * (FL.tempoAb + (FL.tempo - FL.tempoAb) * start);
      if (flug.weg >= flug.lang) { const e = flug.bahn.getPointAt(1, va); hocke(0, 0); lande(flug.ziel, { x: e.x, y: e.y, z: e.z }, { auf: flug.auf, schlag: flug.schlag, knick: flug.knick, biege: flug.biege }); bewegeFlug(0); return; }
      const k = flug.weg / flug.lang, ri = flug.bahn.getTangentAt(k, vb); wurzel.position.copy(flug.bahn.getPointAt(k, va));
      const kurs = Math.atan2(ri.x, ri.z), dk = Math.atan2(Math.sin(kurs - flug.kurs), Math.cos(kurs - flug.kurs)); flug.kurs = kurs; wurzel.rotation.y = kurs;
      if (dt > 0) flug.roll += (Math.max(-FL.schraegMax, Math.min(FL.schraegMax, -dk / dt * FL.schraeg)) * start - flug.roll) * Math.min(1, dt * 3);   // Schräglage: in die Kurve gelegt
      g.figur.rotation.z = flug.roll;
      const neig = Math.max(0.32, 0.42 - 0.04 * glatt(tf / tO) + (FL.neig - 0.38) * glatt((tf - tU) / 0.7) - ri.y * 0.2 * glatt(tf / 0.15)),   /* Mr. Alex 19.11.: er bleibt nach dem Ducken vorgebeugt und richtet den Oberkörper im Absprung NICHT auf – von der Hocke geht es vorgebeugt in den Flug */ beine = -0.5 * (1 - glatt((tf - tU) / 0.4));   // im Sprung Kopf voran schräg nach oben, die Beine hängen nach
      if (tf < tU) pose({ ...erster, neig, faecher: 0.35 * hoch1, senk: 0, beine });
      else {
        flug.phi += dt / (FL.abTakt + (FL.takt - FL.abTakt) * start);
        const zyk = Math.max(0, tf - tU - tS) % (FL.schlagen + FL.gleiten), gleiten = tf < tU + tS ? 0 : glatt((zyk - FL.schlagen) / 0.25) * (1 - glatt((zyk - FL.schlagen - FL.gleiten + 0.25) / 0.25));
        const s = schlagen(flug.phi, 0.9 - 0.3 * start, 0.15 - 0.1 * start);
        const eng = s.auf - 0.3 * (1 - start) * Math.max(0, -Math.sin(2 * Math.PI * flug.phi));   // in den ersten Aufschlägen zieht er die Flügel eng an den Körper (Film)
        pose({ vor: -0.95 * (1 - glatt((tf - tU) / 0.09)), auf: eng + (1 - eng) * gleiten, schlag: s.schlag + (-0.06 - s.schlag) * gleiten, knick: s.knick + (-0.05 - s.knick) * gleiten, biege: s.biege + (0.5 - s.biege) * gleiten, neig, faecher: 0.35, senk: 0, beine });
      }
      hocke(-FL.streck * (1 - glatt(tf / 0.3)), 0); const m = glatt(tf / 0.12);                                               // die gestreckten Beine schwingen weich nach hinten, die Zehen zeigen kurz nach unten
      for (const bn of beinTeile) { bn.bein.rotation.x *= m; bn.fuss.rotation.x = 0.9 * m * (1 - glatt((tf - 0.3) / 0.3)); }
    } else if (flug.tut === "landet") {
      const { ziel, von } = flug, tA = FL.anflug, tB = FL.bremsen, tC = FL.setzen, weit = Math.hypot(ziel.x - von.x, ziel.z - von.z), bremsweg = Math.min(FL.bremsweg, weit * 0.4);
      let weg, hoch, p;
      if (t < tA) {                                                                        // Anflug: erst drei Schläge je Sekunde, dann mit gewölbten Flügeln gleiten
        const u = t / tA; weg = (weit - bremsweg) * u; hoch = FL.bremsHoch + (von.y - ziel.y - FL.bremsHoch) * (1 - glatt(u));
        const gleiten = glatt((u - 0.62) / 0.2), s = schlagen(t / FL.takt, 0.6, 0.05);   // Figuren 8: etwas länger und kräftiger schlagen, dann gleiten
        p = { auf: s.auf + (1 - s.auf) * gleiten, schlag: s.schlag + (-0.06 - s.schlag) * gleiten, knick: s.knick + (-0.05 - s.knick) * gleiten, biege: s.biege + (0.5 - s.biege) * gleiten   /* Gleiten (Mr. Alex 19.11.: die Hand knickte „zu weit nach unten“, bei echten Raben ist es ein Bogen): der Arm fällt ab der Schulter leicht ab, am Handgelenk nur rund 7 Grad */, neig: FL.neig, faecher: 0.35, senk: 0, beine: 0 };
      } else if (t < tA + tB) {                                                            // Bremsen: aufrichten, Flügel hoch, kurze schnelle Schläge
        const u = (t - tA) / tB, s = schlagen((t - tA) / FL.bremsTakt, 0.38, 0.75);
        weg = weit - bremsweg * (1 - u) * (1 - u); hoch = FL.bremsHoch * (1 - Math.pow(u, 1.6));
        p = { auf: s.auf, schlag: s.schlag, knick: s.knick, biege: s.biege, neig: FL.neig + (-0.3 - FL.neig) * glatt(u / 0.6), faecher: 0.35 + 0.65 * glatt(u / 0.4), senk: 0.45 * glatt(u / 0.5), beine: 0.55 * glatt(u / 0.5) };
      } else {                                                                             // Aufsetzen: ein letzter halber Schlag, dann anlegen
        const u = Math.min(1, (t - tA - tB) / tC); weg = weit; hoch = 0;
        /* Figuren 8 (19.11.): der Schwung kippt ihn nach vorn (Schwanz hoch), er federt zurück, legt die Flügel ruhig an und rückt sie einmal zurecht */
        p = { auf: stufen(u, [[0, 1], [0.18, 1], [0.6, 0], [0.7, 0], [0.8, 0.2], [1, 0]]), schlag: stufen(u, [[0, 1.0], [0.18, 0.2], [0.6, 0], [1, 0]]), knick: stufen(u, [[0, 0.3], [0.22, -0.3], [0.6, 0], [1, 0]]), biege: 0.4 * (1 - glatt(u / 0.6)), neig: stufen(u, [[0, -0.3], [0.22, 0.22], [0.48, -0.06], [0.72, 0.04], [1, 0]]), faecher: stufen(u, [[0, 1], [0.6, 0.2], [1, 0]]), senk: stufen(u, [[0, 0.45], [0.22, -0.12], [0.5, 0.05], [1, 0]]), beine: 0.55 * (1 - glatt(u / 0.22)) };
      }
      const k = weit ? weg / weit : 1; wurzel.position.set(von.x + (ziel.x - von.x) * k, ziel.y + hoch, von.z + (ziel.z - von.z) * k);
      const flugDreh = Math.atan2(ziel.x - von.x, ziel.z - von.z); let d = (ziel.dreh - flugDreh) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
      wurzel.rotation.y = flugDreh + d * glatt((t - tA) / tB);
      if (flug.aus && t < 0.3) { const m = glatt(t / 0.3); for (const n in flug.aus) p[n] = flug.aus[n] + (p[n] - flug.aus[n]) * m; }   // aus dem freien Flug weich in den Anflug
      pose(p);
      if (t >= tA + tB + tC) { pose(RUHE); setze(ziel.x, ziel.y, ziel.z, ziel.dreh); flug.tut = "sitzt"; z.warte = zufall(P.blick.pause) / 2; }
    }
  }
  const kasten = new THREE.Box3(), ort = new THREE.Vector3();
  /* schau: Kopf sofort in eine Richtung stellen und dort halten (Bilder, Prüfung) */
  const schau = (y, schief = 0) => { z.zielY = kopf.rotation.y = y; z.zielZ = kopf.rotation.z = schief; z.warte = 30; };
  function zustand() {
    wurzel.updateMatrixWorld(true); kasten.setFromObject(wurzel);
    const kehleOben = g.kehle ? +kasten.clone().setFromObject(g.kehle).max.y.toFixed(3) : null, kopfUnten = +(kopf.getWorldPosition(ort).y - P.schaedel * P.gross).toFixed(3);
    const gr = kasten.getSize(ort.clone());
    const angelegt = !seiten.length || (flug.auf === 0 && seiten.every((w) => Math.abs(w.F.quaternion.w) > 0.99999 && Math.abs(w.H.quaternion.w) > 0.99999) && Math.abs(g.schwanz.rotation.x) < 1e-6 && Math.abs(g.figur.rotation.x) < 1e-6 && Math.abs(koerper.position.y - koerperHoch) < 1e-6);
    return { wer, bau, tut: flug.tut, angelegt, schlag: +flug.schlag.toFixed(3), neig: +flug.neig.toFixed(3), roll: +(flug.roll || 0).toFixed(3), pluster: +pl.auf.toFixed(3), gross: P.gross, ton: GE ? GE.ton : null, schluessel: !!(schluesselTeil && schluesselTeil.visible), schluesselOrt: schluesselTeil && schluesselTeil.visible ? schluesselTeil.getWorldPosition(new THREE.Vector3()).toArray().map((v) => +v.toFixed(3)) : null, kopfOrt: kopf.getWorldPosition(new THREE.Vector3()).toArray().map((v) => +v.toFixed(3)), hocke: +(flug.hocke || 0).toFixed(3), auf: +flug.auf.toFixed(3), breit: +Math.max(gr.x, gr.z).toFixed(3), kehleOben, kopfUnten, ring: P.ring ? { name: P.ring.name, hoch: +g.ring.getWorldPosition(ort).y.toFixed(3) } : null, name: P.name, ort: wurzel.position.toArray().map((v) => +v.toFixed(3)), dreh: +wurzel.rotation.y.toFixed(3), hoch: +(kasten.max.y - kasten.min.y).toFixed(3), fuss: +kasten.min.y.toFixed(3),
      kopf: [+kopf.rotation.y.toFixed(4), +kopf.rotation.z.toFixed(4)], drehungen: z.drehungen, blick: P.blick };
  }
  /* setze: Ort der Füße und Blickrichtung (0 = nach Süden, +z) */
  const setze = (x, y, zz, dreh = 0) => { wurzel.position.set(x, y, zz); wurzel.rotation.y = dreh; };
  return { wurzel, g, bewege, zustand, setze, schau, fluegelschlag, lande, fliege, plustere, schluessel };
}
