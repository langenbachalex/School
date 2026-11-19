/* Keys of the Tower – der Hof (Tower Green) als ROHBAU, eigener Abschnitt (Mr. Alex 19.11.).
   Folgt dem echten Tower, erkennbar, nicht maßstabsgetreu (docs/spiele/keys-of-the-tower-orte.md, „Der echte Tower als Grundriss“):
   Südwestecke des inneren Hofs. Norden = −z, Osten = +x; der begehbare Platz liegt um den Nullpunkt, breit × tief Meter.
   Nur schlichte Klötze mit richtigen Maßen und Lagen – kein Mauerwerk, kein Licht, kein Nebel (das ist Block C).
   bauHof liefert dieselbe Form wie ein geladener Raum: { scene, info: { gehkarte, dinge, lichter }, plan }. */
import * as THREE from "three";

export const HOF_GROESSEN = { "30x25": [30, 25], "40x30": [40, 30], "50x40": [50, 40] };
export const HOF_START = "50x40";   // Entscheidung Mr. Alex 19.11.: die größte Größe

/* Rohbau-Maße in Metern (gestaucht gegenüber dem echten Tower) */
export const HOF_MASSE = {
  haus: { hoch: 7, tief: 6 },                    // Queen's House, Südseite: darin die Wachstube
  tuer: { breit: 1.1, hoch: 3 },                 // Tür zur Wachstube; 3 m hoch (Mr. Alex 19.11.: neben der Tür von 2,1 m wirkte der Sergeant zu groß)
  fass: { hoch: 1.0, dick: 0.7 },                // Garys Fass
  uhrturm: { hoch: 12, radius: 3.5, uhr: 2, uhrHoehe: 10 },   // Bell Tower, Südwestecke
  torturm: { breit: 10, tief: 8, hoch: 9 },      // Bloody Tower, Südostecke
  tor: { breit: 4, hoch: 5 },                    // das große Tor, zu
  rabenmauer: { hoch: 3, dick: 1.2, raben: 7 },  // Mauer Nr. 9 im Osten
  westmauer: { hoch: 6, dick: 1.5 },
  beauchamp: { hoch: 9, radius: 4 },             // Beauchamp Tower, Westseite
  nordmauer: { hoch: 1.2, dick: 0.4 },           // niedrig, damit die Kapelle zu sehen ist
  kapelle: { breit: 20, tief: 8, hoch: 6 },      // St Peter ad Vincula, Kulisse im Norden
  whiteTower: { breit: 18, tief: 16, hoch: 14 }, // Kulisse im Osten
  kreis: 3,                                      // Marsch-Kreis des Sergeants, Radius
};

const FARBE = { boden: 0x243023, stein: 0x55565f, haus: 0x5f5448, turm: 0x666873, kulisse: 0x3d3f4a, holz: 0x6a4424, tor: 0x3a2716, uhr: 0xe8dcb4, zeiger: 0x1a1a1a, rabe: 0x0c0c10, platz: 0xc9a24a, weg: 0x8fa0a8 };

/* Klotz mit drei Helligkeiten (oben, Ost/West, Nord/Süd): so ist die Form ohne Licht zu erkennen */
function klotz(b, h, t, farbe) {
  const f = new THREE.Color(farbe), m = (k) => new THREE.MeshBasicMaterial({ color: f.clone().multiplyScalar(k) });
  const seite = m(0.8), oben = m(1.15), vorn = m(1);
  return new THREE.Mesh(new THREE.BoxGeometry(b, h, t), [seite, seite, oben, oben, vorn, vorn]);
}
function rund(r, h, farbe) {
  const f = new THREE.Color(farbe);
  return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20), [new THREE.MeshBasicMaterial({ color: f.clone().multiplyScalar(0.9) }), new THREE.MeshBasicMaterial({ color: f.clone().multiplyScalar(1.15) }), new THREE.MeshBasicMaterial({ color: f })]);
}

export function bauHof(gross) {
  const [B, T] = HOF_GROESSEN[gross] || HOF_GROESSEN[HOF_START], M = HOF_MASSE, w = B / 2, s = T / 2;
  const scene = new THREE.Group(); scene.name = "hof";
  const stelle = (netz, x, y, z, name, gruppe) => { netz.position.set(x, y, z); if (name) netz.name = name; if (gruppe) netz.userData.gruppe = gruppe; scene.add(netz); return netz; };

  // Boden: der begehbare Platz (heißt wie im Raum „raum_gross“, daran hängen Kamera und Startplatz) und dunkler Grund für die Kulisse
  const boden = new THREE.Mesh(new THREE.PlaneGeometry(B, T), new THREE.MeshBasicMaterial({ color: FARBE.boden })); boden.rotation.x = -Math.PI / 2; stelle(boden, 0, 0, 0, "raum_gross");
  const grund = new THREE.Mesh(new THREE.PlaneGeometry(B + 120, T + 120), new THREE.MeshBasicMaterial({ color: 0x14181a })); grund.rotation.x = -Math.PI / 2; stelle(grund, 0, -0.03, 0, "hof_grund");

  // Süden: Queen's House mit der Tür zur Wachstube, links der Bell Tower mit der Uhr, rechts der Bloody Tower mit dem großen Tor
  const hausBreit = B - M.torturm.breit, tuerX = -B / 4;
  stelle(klotz(hausBreit, M.haus.hoch, M.haus.tief, FARBE.haus), -w + hausBreit / 2, M.haus.hoch / 2, s + M.haus.tief / 2, "hof_haus");
  stelle(klotz(M.tuer.breit, M.tuer.hoch, 0.16, FARBE.holz), tuerX, M.tuer.hoch / 2, s, "hof_tuer");
  const fass = { x: tuerX + 2.2, z: s - 1.0 };
  stelle(rund(M.fass.dick / 2, M.fass.hoch, FARBE.holz), fass.x, M.fass.hoch / 2, fass.z, "hof_fass");
  const ut = { x: -w - 1.5, z: s + 1.5 }, q = Math.SQRT1_2;
  stelle(rund(M.uhrturm.radius, M.uhrturm.hoch, FARBE.turm), ut.x, M.uhrturm.hoch / 2, ut.z, "hof_uhrturm");
  const uhr = new THREE.Mesh(new THREE.CylinderGeometry(M.uhrturm.uhr / 2, M.uhrturm.uhr / 2, 0.2, 24), new THREE.MeshBasicMaterial({ color: FARBE.uhr }));
  uhr.rotation.set(Math.PI / 2, 0, 0); uhr.rotation.order = "YXZ"; uhr.rotation.y = -Math.PI / 4 + Math.PI;        // die Uhr schaut schräg in den Hof (nach Nordosten)
  stelle(uhr, ut.x + q * M.uhrturm.radius, M.uhrturm.uhrHoehe, ut.z - q * M.uhrturm.radius, "hof_uhr");
  const tt = M.torturm, torX = w - tt.breit / 2;
  stelle(klotz(tt.breit, tt.hoch, tt.tief, FARBE.turm), torX, tt.hoch / 2, s + tt.tief / 2, "hof_torturm");
  stelle(klotz(M.tor.breit, M.tor.hoch, 0.2, FARBE.tor), torX, M.tor.hoch / 2, s, "hof_tor");

  // Osten: die niedrige Mauer mit den Plätzen für sieben Raben, dahinter der White Tower
  const rm = M.rabenmauer;
  stelle(klotz(rm.dick, rm.hoch, T, FARBE.stein), w + rm.dick / 2, rm.hoch / 2, 0, "hof_mauer");
  const raben = [];
  for (let i = 0; i < rm.raben; i++) { const z = (i - (rm.raben - 1) / 2) * 1.2; raben.push({ x: w + rm.dick / 2, z }); stelle(klotz(0.3, 0.35, 0.45, FARBE.rabe), w + rm.dick / 2, rm.hoch + 0.175, z, "hof_rabe" + (i + 1), "hof_mauer"); }
  const wt = M.whiteTower;
  stelle(klotz(wt.breit, wt.hoch, wt.tief, FARBE.kulisse), w + 8 + wt.breit / 2, wt.hoch / 2, -2, "hof_whitetower");

  // Westen: hohe Mauer mit dem Beauchamp Tower · Norden: niedrige Mauer, dahinter die Kapelle
  stelle(klotz(M.westmauer.dick, M.westmauer.hoch, T, FARBE.stein), -w - M.westmauer.dick / 2, M.westmauer.hoch / 2, 0, "hof_westmauer");
  stelle(rund(M.beauchamp.radius, M.beauchamp.hoch, FARBE.turm), -w - M.beauchamp.radius - 0.2, M.beauchamp.hoch / 2, -T / 6, "hof_beauchamp");
  stelle(klotz(B, M.nordmauer.hoch, M.nordmauer.dick, FARBE.stein), 0, M.nordmauer.hoch / 2, -s - M.nordmauer.dick / 2, "hof_nordmauer");
  stelle(klotz(M.kapelle.breit, M.kapelle.hoch, M.kapelle.tief, FARBE.kulisse), -B / 8, M.kapelle.hoch / 2, -s - 3 - M.kapelle.tief / 2, "hof_kapelle");

  // Platz für den Touristen: nördliche Mitte, beim Denkmal (Nr. 11) – nur eine Markierung am Boden
  const tourist = { x: B / 8, z: -s + 6 };
  const marke = new THREE.Mesh(new THREE.CircleGeometry(0.6, 28), new THREE.MeshBasicMaterial({ color: FARBE.platz })); marke.rotation.x = -Math.PI / 2; stelle(marke, tourist.x, 0.012, tourist.z, "hof_tourist");

  /* Wege (wandern mit der Größe mit). Der Spieler startet im Süden (z = s − 2,6) und schaut nach Norden; die Figuren stehen ihm zugewandt.
     Rundkurs einmal um den Platz · Kreis für den Marsch des Sergeants („In circles.“) · lange Bahnen von Norden nach Süden, auf den Spieler zu. */
  const runde = { x0: -w + 3, x1: w - 3, z0: -s + 3, z1: s - 6, r: 3 };
  const a = runde.x1 - runde.x0 - 2 * runde.r, b = runde.z1 - runde.z0 - 2 * runde.r, viertel = (Math.PI * runde.r) / 2;
  const rundeAb = (x) => a + viertel + b + viertel + (runde.x1 - runde.r - x);          // Start auf der südlichen Geraden bei x (dort läuft die Figur nach Westen)
  const kr = M.kreis, kreisMitte = { x: 6, z: runde.z1 - 2.5 - kr };
  const kreis = { x0: kreisMitte.x - kr, x1: kreisMitte.x + kr, z0: kreisMitte.z - kr, z1: kreisMitte.z + kr, r: kr, start: Math.PI * kr };   // Start am südlichsten Punkt
  const bahnLang = runde.z1 - runde.z0;
  const plan = {
    gross: [B, T], masse: M, fass, tourist, raben, tuer: { x: tuerX, z: s }, tor: { x: torX, z: s }, uhr: { x: uhr.position.x, y: uhr.position.y, z: uhr.position.z },
    start: { x: 0, z: s - 2.6 },
    gary: { x: 0, z: runde.z1 - 2 - 12, bahn: 12 },                                    // Gary: 12 m gerade auf den Spieler zu
    kurse: {
      flex: { rund: { runde: { ...runde, start: rundeAb(-2.5) } }, kreis: { runde: { ...kreis, x0: kreis.x0 - 12, x1: kreis.x1 - 12 } }, bahn: { x: -9, z: runde.z0, bahn: bahnLang } },
      sergeant: { rund: { runde: { ...runde, start: rundeAb(2.5) } }, kreis: { runde: kreis }, bahn: { x: 9, z: runde.z0, bahn: bahnLang } },
    },
    anfang: { flex: "rund", sergeant: "kreis" },
    laengen: { rund: 2 * (a + b) + 4 * viertel, kreis: 2 * Math.PI * kr, bahn: bahnLang },
  };

  // Die Wege als dünne Linien am Boden, damit man Längen und Lagen beurteilen kann
  const linie = (punkte) => { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(punkte.map(([x, z]) => new THREE.Vector3(x, 0.02, z))), new THREE.LineBasicMaterial({ color: FARBE.weg, transparent: true, opacity: 0.55 })); l.name = "hof_weg"; scene.add(l); };
  const bogen = (ru) => { const p = [], r = ru.r, ecken = [[ru.x1 - r, ru.z0 + r, -90], [ru.x1 - r, ru.z1 - r, 0], [ru.x0 + r, ru.z1 - r, 90], [ru.x0 + r, ru.z0 + r, 180]];
    for (const [x, z, w0] of ecken) for (let k = 0; k <= 8; k++) { const wi = ((w0 + k * 11.25) * Math.PI) / 180; p.push([x + r * Math.cos(wi), z + r * Math.sin(wi)]); }
    p.push(p[0]); return p; };
  linie(bogen(runde)); linie(bogen(kreis)); linie(bogen(plan.kurse.flex.kreis.runde));
  for (const k of [plan.kurse.flex.bahn, plan.kurse.sergeant.bahn]) linie([[k.x, k.z], [k.x, k.z + k.bahn]]);
  linie([[plan.gary.x, plan.gary.z], [plan.gary.x, plan.gary.z + plan.gary.bahn]]);

  // Gehkarte wie beim Raum (Blender-Richtung: y = −z): der ganze Platz ist frei, nur Fass und Turmfuß nicht
  const zelle = 0.25, NX = Math.round(B / zelle), NY = Math.round(T / zelle), zeilen = [];
  for (let j = 0; j < NY; j++) {
    let zeile = "";
    for (let i = 0; i < NX; i++) {
      const x = -w + (i + 0.5) * zelle, z = -(-s + (j + 0.5) * zelle);
      const zu = Math.hypot(x - fass.x, z - fass.z) < M.fass.dick / 2 + 0.3 || Math.hypot(x - ut.x, z - ut.z) < M.uhrturm.radius + 0.3 || i === 0 || j === 0 || i === NX - 1 || j === NY - 1;
      zeile += zu ? "0" : "1";
    }
    zeilen.push(zeile);
  }
  const dinge = [["hof_tuer", "Tür zur Wachstube"], ["hof_fass", "Garys Fass"], ["hof_uhr", "Turmuhr"], ["hof_tor", "das große Tor"], ["hof_mauer", "Mauer mit den Raben"], ["hof_tourist", "Platz für den Touristen"]].map(([id, name]) => ({ id, name }));
  return { scene, info: { gehkarte: { x0: -w, y0: -s, zelle, zeilen }, dinge, lichter: [] }, plan };
}
