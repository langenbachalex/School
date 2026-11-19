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
import { baueGesicht, AUSDRUECKE, NEUTRAL } from "./probe3d_figuren.js";

export const BAU_START = { arm: 1.8, bein: 3.0, kopf: 0.66, rumpf: 1.16, knie: 0.56 };   // endgültige Maße von Mr. Alex für Mr. Flex (18.11.)
const HAND = 1.7, HALS = 0.785;                        // Handgröße (Mr. Alex 18.11.: die Dicke passt) · Halshöhe des ungestreckten Körpers wie bei Gary
const STIEFEL = { kante: 0.335, knie: 0.42, hose: 0.48 };          // Mage-Körper: bis hier reicht der Stiefel · bis hier der Ring direkt über dem Knie (Höhen im ungestreckten Körper)
const MANTEL = { ab: 0.56, tief: 0.2, anteil: 0.8, vornAb: 0.84, vornTief: 0.46 };   // Mage-Körper: unterhalb `ab` folgt der Mantel den Oberschenkeln, am Saum mit `anteil`; vorn (Bauchteil) schon ab `vornAb`
const PLAETZE = { tasche: [[-0.38, 0.53, 0.19], [-0.16, 0.77, 0.40]], buch: [[0.13, 0.53, 0.18], [0.38, 0.84, 0.41]] };   // Mage-Körper: Kästen [von, bis] um Gürteltasche und Buchhalter (x zur linken Seite, y hoch, z nach vorn)
const GURT = { breit: 0.39, tief: 0.32, unten: 0.625, oben: 0.735, farbe: [0.69, 0.10] };   // Mage-Körper: Gürtel als Ellipse (halbe Breite, halbe Tiefe), Höhe des Bandes, Stelle der Gürtelfarbe im Körperbild
export const KLEIDUNG_START = { tasche: false, buch: false, krempe: 0.4, krempeRund: 0.07, zipfel: "spitz", hutband: false, hutFarbe: 0x51627f, kopf: "flexkopf", hutWeit: 0.62, hutHoch: -0.03 };   // Mr. Flex trägt beides nicht – die Arme gingen bei vielen Gesten hindurch (Gary hat einen eigenen Körper und behält seine); krempe = Breite der Hutkrempe (1 = wie das Modell): Mr. Flex trägt einen Spitzhut mit schmaler Krempe, damit die Hände am Kopf nicht hindurchgehen
const ARM_RING = [0.33, 0.5], ARM_MITTE = 0.42;                           // Mage-Körper: zwischen diesen Abständen von der Mitte liegen die zwei Ringe am Ellbogen
const KNIE_BREIT = 1.45, KNIE_FASE = 0.07, ARM_FASE = 0.05;   // FASE: so weit vor und hinter dem Gelenk sitzen die zwei Ringe (abgeschrägte Ecke statt Spitze) //                               // so viel breiter dürfen die Ringe an Knie und Ellbogen im tiefsten Knick höchstens werden
/* Hut je Figur (A9, Mr. Alex 18.11.): krempeRund = die Krempe fällt in einer weichen Rundung ab (0 = gerade Scheibe) · zipfel "spitz" = der Zipfel
   steht spitz nach oben (sonst hängt er wie beim Mage-Hut nach hinten) · hutband false = ohne Band und Schnalle · hutFarbe = eine matte Farbe für den ganzen Hut. */
const ZIPFEL = { ab: 0.5, mitten: [[0.61, -0.07, 0.25], [0.88, -0.17, 0.12], [0.86, -0.38, 0.06], [0.75, -0.44, 0.03]], lage: [0, 0.45, 0.8, 1], lang: 0.66, neigung: 0.1 };   // Mage-Hut: Ringe des Zipfels (Höhe, Tiefe, Radius)
const HUTBAND = { von: 0.15, bis: 0.36, unten: 0.52, oben: 0.4 };   // Mage-Hut: Höhe des Bandes und Radius der Kappe darunter
const krempeBogen = (f, rund) => rund * (0.6 * Math.sin(Math.PI * f) - f * f);   // Rundung der Krempe: innen leicht gewölbt, zum Rand hin fällt sie ab
const KREMPE = { innen: 0.52, aussen: 1.11, oben: 0.15, unten: -0.15 };   // Mage-Hut (Maße des Hutes): Krempe von der Kappe (innen, oben) bis zum Rand (aussen, unten)
const RENN_STAND = 2.2, HUEPF = 0.5, HOEHE_GLATT = { gehen: 14, rennen: 20 };    // Rennen: der Fuß gilt früher und länger als „am Boden“ · Anteil des Flugbogens · so schnell folgt die Höhe der Figur (je Sekunde)
const MABU_HOCH = -0.12;                                  // Ma Bu: Höhe der Fäuste zur Brust (unter der Kragenkante)
const SOHLE_FREI = { wippen: "r" };                       // dieser Fuß soll sich bewegen: keine flache Sohle (sonst wippt er nicht)
const STAND_HOCH = 0.09;                               // so weit über seinem tiefsten Stand gilt der Knöchel noch als „am Boden“ (Maß des ungestreckten Körpers)
/* Gehen (A9, Mr. Alex 18.11.: „stampfig – das Knie bleibt angewinkelt, die Ferse haut in den Boden“): Anteile einer Runde und Winkel.
   stand = so lange steht ein Fuß · rollt = bis dahin legt sich die Sohle nach dem Aufsetzen der Ferse ab · flach = ab da hebt sich die Ferse ·
   ferse/ballen = Winkel der Sohle beim Aufsetzen und beim Abdruck · heben = so hoch schwingt der Fuß (Maß des ungestreckten Körpers) ·
   wippen = Auf und Ab der Hüfte · streck = so weit streckt sich das Bein höchstens (Anteil der Beinlänge) · spur = Spurbreite (Anteil der Hüftbreite) */
const GEHEN = { stand: 0.57, rollt: 0.08, flach: 0.31, ferse: 0.31, ballen: 0.66, heben: 0.11, wippen: 0.1, streck: 0.99, spur: 0.8, an: 0.25, hinten: 0 };
const FERSE_Z = -0.11;                                 // Mage-Körper: dort liegt die Ferse auf (Tiefe im Maß des Körpers)
const REDE_GESTEN = ["zeigen", "arme", "abwinken", "mahnen", "achselzucken", "pistolen"];   // Mr. Flex gestikuliert beim Reden groß
const KOPF_SITZ = [0, -0.03, 0.0], FUNKEL = 0.6;        // eigener Kopf: Sitz über dem Kopfknochen (m) · Dauer des Funkelns (s)
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
  /* Eigene Gesten des Sergeants (Figuren 6, 19.11.; Figurenblatt: selten, eckig, zackig – schnell hinein, dann eingefroren). Sie werden im Programm gestellt
     (POSEN und ZIELE), nicht in Blender: fünfter Eintrag = Dauer in Sekunden, die Bewegung darunter ist das ruhige Stehen. */
  sgtUnten: ["Idle", "Zeigen nach unten", "Sergeant", [Z, R], 1.9], sgtSeite: ["Idle", "Zeigen zur Seite", "Sergeant", [Z, R], 1.9],
  ruecken: ["Idle", "Hände auf dem Rücken", "Sergeant", R, 3], hutsuchen: ["Idle", "Hut suchen", "Sergeant", R, 3.2],
  bizeps: ["Flex_Bizeps", "Bizeps", "Mr. Flex", F], tee: ["Flex_TeeTrinken", "Tee trinken", "Mr. Flex", [F, R]], brille: ["Flex_BrilleSchieben", "Brille schieben", "Mr. Flex", [Z, R]],
  pistolen: ["Flex_Fingerpistolen", "Fingerpistolen", "Mr. Flex", Z],
  kick: ["KungFu_HoherKick", "Kick", "Kung-Fu", F], mabu: ["KungFu_MaBu", "Ma Bu", "Kung-Fu", F], pubu: ["KungFu_PuBu", "Pu Bu", "Kung-Fu", R], xubu: ["KungFu_XuBu", "Xu Bu", "Kung-Fu", R],
  spagat: ["KungFu_Spagat", "Spagat", "Kung-Fu", R], rolle: ["KungFu_RolleVorwaerts", "Rolle vorwärts", "Kung-Fu", F],
};
const DAUERND = ["stehen", "gehen", "rennen"];
const STRAMM_BEI = ["salut", "sgtUnten", "sgtSeite", "ruecken", "hutsuchen"];   // bei diesen Gesten bleibt eine stramme Figur stramm (Beine, Rücken, freier Arm)
const STELLE_RUNDEN = 3, BLICK_DAUER = 1.6, ZUCK_DAUER = 0.9, OHREN_DAUER = 3.5;   // Marsch auf der Stelle: so viele Runden (je zwei Schritte) · Dauer von Seitenblick, Bartzucken, roten Ohren (s)
const v = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), Q = () => new THREE.Quaternion();
const weich = (x, a, b) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const dabei = (u, ein0, ein1, aus0, aus1) => weich(u, ein0, ein1) * (1 - weich(u, aus0, aus1));   // Gewicht eines Handziels über die Dauer der Geste (0…1)

/* Handziele: Geste → (Seite −1 rechts / +1 links, Anteil der Dauer u, Zeit t in s) → Ziel oder null.
   knochen + ort: Punkt am Körper in den Maßen des ungestreckten Körpers (x zur linken Seite der Figur, y hoch, z nach vorn).
   Ohne `finger` zeigt die Hand in Richtung des Unterarms, und `reich` sagt, welcher Punkt der Hand das Ziel trifft (0 Handgelenk … 1 Fingerspitzen).
   Mit `finger` und `flaeche` (Richtung der Finger und Blickrichtung der Handfläche) wird auch die Hand gedreht; das Ziel trifft dann die Mitte der Handfläche.
   pol = wohin der Ellenbogen zeigt. */
/* Gestreckter Arm (Sergeant): Geste → Anteil der Dauer u → Richtung des ganzen rechten Arms im Körper, Blickrichtung der Handfläche, Gewicht; blick = die Augen gehen mit. */
const POSEN = {
  sgtUnten: (u) => ({ arm: [-0.05, -0.88, 0.47], flaeche: [1, 0, 0], gewicht: dabei(u, 0.03, 0.09, 0.86, 0.94) }),            // „Here!“ – der Finger zeigt vor die Füße
  sgtSeite: (u) => ({ arm: [-1, 0.0, 0.05], flaeche: [0, -1, 0], blick: -1, gewicht: dabei(u, 0.03, 0.09, 0.86, 0.94) }),    // „That way!“ – waagrecht zur Seite, nur die Augen folgen
};
const ZIELE = {
  hueften: (s, u) => { const weg = 1 - dabei(u, 0.07, 0.22, 0.8, 0.95);          // A8: der Weg führt außen herum – erst seitlich hinaus, dann an die Hüfte (und so auch zurück)
    return { knochen: "hips", ort: [s * (0.41 + 0.34 * weg), 0.30, 0.02 + 0.12 * weg], reich: 0.3, pol: [s, -0.1, -0.6], gewicht: dabei(u, 0.0, 0.08, 0.93, 1.0) }; },   // auf der Kleidung, nicht darin
  /* Bizeps (A8): Die Fäuste stehen neben dem Kopf außerhalb der schmalen Krempe. */
  bizeps: (s, u) => ({ knochen: "head", ort: [s * 0.98, 0.5, 0.02], reich: 0, pol: [s, -0.35, -0.1], gewicht: dabei(u, 0.1, 0.26, 0.82, 0.96) }),
  /* Ma Bu (A8): Die Fäuste liegen unter der Kragenkante vor der Brust, Ellbogen nach unten – sonst kommen die Arme mitten aus dem Kragen. */
  mabu: (s, u) => ({ knochen: "chest", ort: [s * 0.3, MABU_HOCH, 0.8], finger: [0, 0, 1], flaeche: [0, -1, 0], pol: [s * 0.5, -1, -0.3], gewicht: dabei(u, 0.13, 0.24, 0.76, 0.92) }),
  klatschen: (s, u, t) => ({ knochen: "chest", ort: [s * (0.04 + 0.13 * (0.5 - 0.5 * Math.cos((2 * Math.PI * (t - 0.32)) / 0.24))), 0.0, 0.62], finger: [0, 0.45, 0.9], flaeche: [-s, 0, 0],
    pol: [s * 0.7, -1, 0], gewicht: dabei(u, 0.1, 0.22, 0.84, 0.98) }),                                   // die Handflächen treffen sich (0,04 = halbe Handdicke)
  reiben: (s, u, t) => { const hin = 0.05 * Math.sin((2 * Math.PI * t) / 0.3) * s; return { knochen: "chest", ort: [s * 0.04, -0.2 + hin * 0.3, 0.6 + hin], finger: [0, 0.3, 0.95], flaeche: [-s, 0, 0],
    pol: [s * 0.7, -1, 0], gewicht: dabei(u, 0.1, 0.22, 0.8, 0.96) }; },                                   // Handfläche an Handfläche, gegeneinander geschoben
  /* High five (Mr. Alex 18.11., wichtig): Ellbogen bleibt angewinkelt, Hand auf Kopfhöhe neben dem Kopf, Handfläche senkrecht nach vorn,
     Finger nach oben – nur ein kurzer Schwung nach vorn und zurück, nie ein gestreckter Arm. */
  highfive: (s, u) => (s > 0 ? null : { knochen: "chest", ort: [-0.66, 0.6, 0.12 + 0.22 * dabei(u, 0.38, 0.5, 0.56, 0.7)], finger: [0, 1, 0], flaeche: [0, 0, 1],
    pol: [-0.5, -1, -0.1], gewicht: dabei(u, 0.1, 0.26, 0.8, 0.95) }),
  /* Nachdenken (A7): Der linke Unterarm liegt quer vor dem Bauch – mit etwas Abstand, damit er nicht im Mantel versinkt. */
  denken: (s, u) => (s < 0 ? null : { knochen: "hips", ort: [-0.2, 0.42, 0.47], finger: [-1, 0, 0.15], flaeche: [0, 0.4, -1], pol: [0.7, -1, 0.2], gewicht: dabei(u, 0.06, 0.18, 0.84, 0.97) }),
  /* Hände auf dem Rücken (Sergeant): beide Hände übereinander im Kreuz, Ellbogen nach außen und hinten. */
  ruecken: (s, u, t, schlank) => ({ knochen: "hips", ort: [s * 0.05, 0.3 + s * 0.03, -0.3 * schlank - 0.05], reich: 0.3, pol: [s, -0.2, -0.8], gewicht: dabei(u, 0.05, 0.14, 0.86, 0.95) }),
  /* Hut suchen (Sergeant): beide Hände tasten zweimal seitlich an die Mütze – die Augen suchen dabei rechts und links, der Kopf bleibt starr. */
  hutsuchen: (s, u, t) => ({ knochen: "head", ort: [s * (0.27 + 0.05 * Math.sin((2 * Math.PI * t) / 0.5)), 1.0, 0.06], finger: [0, 1, 0], flaeche: [-s, 0, 0], pol: [s, 0.25, 0.05], gewicht: dabei(u, 0.05, 0.14, 0.86, 0.95) }),
  salut: (s, u) => (s > 0 ? null : { knochen: "head", ort: [-0.3, 0.52, 0.4], reich: 1, pol: [-1, 0.1, -0.3], gewicht: dabei(u, 0.05, 0.11, 0.88, 0.97) }),   // Fingerspitzen an die Stirn
};

/* Stiefel behalten ihre Länge: Alles unterhalb der Stiefelkante hängt an einem Hilfsknochen, der mit dem Unterschenkel nach unten wandert;
   die Hose über dem Knie gehört ganz zum Oberschenkel. So wächst nur die Hose.
   Der Ring am Knie und der unterste Ring der Hose hängen an zwei eigenen Knie-Gelenken (A7/A8): Hinge der Ring am Unterschenkel, stünde er
   im tiefen Knick quer zum Oberschenkel, und das Bein würde dort dünn wie ein abgeknickter Schlauch (Pu Bu, Mr. Alex 18.11.). Mit nur einem
   Gelenk auf halber Beuge blieb eine spitze Ecke; zwei Ringe kurz vor und kurz hinter dem Gelenk (ein Viertel und drei Viertel der Beuge) schrägen sie ab. */
function stiefelFest(m, K) {
  const helfer = {};
  for (const [s, seite] of [["l", "Left"], ["r", "Right"]]) {
    let netz = null; m.traverse((o) => { if (o.isSkinnedMesh && o.name.endsWith("Leg" + seite)) netz = o; });
    if (!netz) continue;
    const alt = netz.skeleton, unter = K("lowerleg" + s), H = new THREE.Bone(); H.name = "stiefel" + s; unter.add(H);
    const gelenk = (name) => { const G = new THREE.Bone(); G.name = name + s; G.matrixAutoUpdate = false; G.matrix.copy(unter.matrix); unter.parent.add(G); return G; };
    const G = gelenk("knie"), G2 = gelenk("knieoben");                             // zwei Knie-Gelenke: sie drehen ein und zwei Drittel der Beuge mit (siehe knieRund)
    const kehrUnter = alt.boneInverses[alt.bones.indexOf(unter)];
    const knochen = [...alt.bones, H, G, G2], kehr = [...alt.boneInverses.map((x) => x.clone()), kehrUnter.clone(), kehrUnter.clone(), kehrUnter.clone()];
    const iO = knochen.indexOf(K("upperleg" + s)), iU = knochen.indexOf(unter), iH = knochen.length - 3, iG = knochen.length - 2, iG2 = knochen.length - 1;
    gewichte(netz, (y, x, z, w) => {
      if (y >= STIEFEL.knie) return new Map([[y < STIEFEL.hose ? iG2 : iO, 1]]);
      if (y >= STIEFEL.kante) return new Map([[iG, 1]]);
      w.delete(iO); if (w.has(iU)) { w.set(iH, w.get(iU)); w.delete(iU); } if (!w.size) w.set(iH, 1);
      return w;
    });
    netz.bind(new THREE.Skeleton(knochen, kehr), netz.bindMatrix);
    const P = netz.geometry.attributes.position, punkte = [], oben = []; let vor = Infinity, hinter = -Infinity;
    for (let i = 0; i < P.count; i++) {
      if (P.getY(i) >= STIEFEL.kante && P.getY(i) < STIEFEL.knie) { punkte.push(i); vor = Math.min(vor, P.getZ(i)); hinter = Math.max(hinter, P.getZ(i)); }
      else if (P.getY(i) >= STIEFEL.knie && P.getY(i) < STIEFEL.hose) oben.push(i);
    }
    helfer["knie" + s] = { gelenke: [[G2, 0.25, -1, ringMitte(netz, unter, (x, y) => y >= STIEFEL.knie && y < STIEFEL.hose)], [G, 0.75, 1, ringMitte(netz, unter, (x, y) => y >= STIEFEL.kante && y < STIEFEL.knie)]],
      ruhe: unter.quaternion.clone(), unten: unter, kind: K("foot" + s), fase: KNIE_FASE };
    helfer[s] = H; helfer["ring" + s] = { netz, punkte, oben, dick: hinter - vor };    // die zwei Ringe am Knie: daran wird gemessen, ob das Bein im Knick sein Volumen hält
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
/* Kleidungsplätze (A7, Mr. Alex 18.11.): Tasche und Buchhalter sind fest in den Körper modelliert. Ein Stück ist eine Insel des Netzes,
   die ganz in ihrem Kasten liegt (PLAETZE); `false` im Profil der Figur zieht sie in den Körper zurück, sodass keine Hand mehr hindurchgeht. */
function kleidungAb(m, kleidung) {
  let netz = null; m.traverse((o) => { if (o.isSkinnedMesh && o.name.endsWith("_Body")) netz = o; });
  const kaesten = Object.entries(PLAETZE).filter(([n]) => kleidung[n] === false).map(([, k]) => k);
  if (!netz || !kaesten.length) return 0;
  const P = netz.geometry.attributes.position, UV = netz.geometry.attributes.uv, N = netz.geometry.attributes.normal, I = netz.geometry.index, nr = new Map(), id = [];
  for (let i = 0; i < P.count; i++) { const k = [P.getX(i), P.getY(i), P.getZ(i)].map((c) => c.toFixed(4)).join() + "|" + UV.getX(i).toFixed(3) + "," + UV.getY(i).toFixed(3); if (!nr.has(k)) nr.set(k, nr.size); id.push(nr.get(k)); }
  const eltern = [...Array(nr.size).keys()], wurzel = (x) => (eltern[x] === x ? x : (eltern[x] = wurzel(eltern[x])));
  for (let t = 0; t < I.count; t += 3) { eltern[wurzel(id[I.getX(t)])] = wurzel(id[I.getX(t + 1)]); eltern[wurzel(id[I.getX(t + 1)])] = wurzel(id[I.getX(t + 2)]); }
  const inseln = new Map();
  for (let i = 0; i < P.count; i++) { const w = wurzel(id[i]); if (!inseln.has(w)) inseln.set(w, []); inseln.get(w).push(i); }
  let zahl = 0;
  for (const punkte of inseln.values()) {
    const drin = (k) => punkte.every((i) => P.getX(i) >= k[0][0] && P.getX(i) <= k[1][0] && P.getY(i) >= k[0][1] && P.getY(i) <= k[1][1] && P.getZ(i) >= k[0][2] && P.getZ(i) <= k[1][2]);
    if (!kaesten.some(drin)) continue;
    for (const i of punkte) {                                                      // flach in das Gürtelband legen, knapp unter die Gürtelfläche: füllt die Lücke, die unter dem Stück im Gürtel ist
      const x = P.getX(i), z = P.getZ(i), r = (GURT.tief * 0.97) / Math.hypot((x * GURT.tief) / GURT.breit, z);
      P.setXYZ(i, x * r, Math.min(GURT.oben, Math.max(GURT.unten, P.getY(i))), z * r);
      N.setXYZ(i, ...v(x / GURT.breit ** 2, 0, z / GURT.tief ** 2).normalize().toArray()); UV.setXY(i, ...GURT.farbe);
    }
    zahl += punkte.length;
  }
  P.needsUpdate = N.needsUpdate = UV.needsUpdate = true;
  return zahl;
}
/* Ellbogen (A8): wie am Knie – die zwei Ringe am Ellbogen hängen an zwei eigenen Gelenken, die ein und drei Viertel der Beuge mitdrehen; Oberarm und Unterarm
   gehören darüber und darunter ganz ihrem Knochen. So bleibt der Arm im Knick dick. */
function ellbogenFest(m, K) {
  const aus = [];
  for (const [s, seite] of [["l", "Left"], ["r", "Right"]]) {
    let netz = null; m.traverse((o) => { if (o.isSkinnedMesh && o.name.endsWith("Arm" + seite)) netz = o; });
    if (!netz) continue;
    const alt = netz.skeleton, unter = K("lowerarm" + s), kehrUnter = alt.boneInverses[alt.bones.indexOf(unter)];
    const gelenk = (name) => { const G = new THREE.Bone(); G.name = name + s; G.matrixAutoUpdate = false; G.matrix.copy(unter.matrix); unter.parent.add(G); return G; };
    const G1 = gelenk("ellbogenoben"), G2 = gelenk("ellbogen");
    const knochen = [...alt.bones, G1, G2], kehr = [...alt.boneInverses.map((x) => x.clone()), kehrUnter.clone(), kehrUnter.clone()];
    const iO = knochen.indexOf(K("upperarm" + s)), iU = knochen.indexOf(unter), iG1 = knochen.length - 2, iG2 = knochen.length - 1;
    gewichte(netz, (y, x, z, w) => {
      const ab = Math.abs(x);
      if (ab > ARM_RING[0] && ab < ARM_RING[1]) return new Map([[ab < ARM_MITTE ? iG1 : iG2, 1]]);
      if (ab <= ARM_RING[0]) { w.delete(iU); if (!w.size) w.set(iO, 1); } else { w.delete(iO); if (!w.size) w.set(iU, 1); }
      return w;
    });
    netz.bind(new THREE.Skeleton(knochen, kehr), netz.bindMatrix);
    const ring = (von, bis) => ringMitte(netz, unter, (x) => Math.abs(x) > von && Math.abs(x) < bis);
    aus.push({ gelenke: [[G1, 0.25, -1, ring(ARM_RING[0], ARM_MITTE)], [G2, 0.75, 1, ring(ARM_MITTE, ARM_RING[1])]], ruhe: unter.quaternion.clone(), unten: unter, kind: K("wrist" + s), fase: ARM_FASE });
  }
  return aus;
}
/* Hut je Figur: derselbe Hut wird beim Laden umgeformt, keine neue Datei.
   Schmale Krempe (A8): zur Kappe hin zusammengeschoben und etwas flacher. A9: Rundung der Krempe, spitzer Zipfel nach oben, kein Band, eine matte Farbe. */
function hutForm(m, kleid) {
  let hut = null; m.traverse((o) => { if (o.isMesh && /_Hat$/.test(o.name)) hut = o; });
  if (!hut) return hut;
  const geo = hut.geometry, P = geo.attributes.position, UV = geo.attributes.uv, breit = kleid.krempe > 0 ? kleid.krempe : 1, rund = kleid.krempeRund || 0;
  const band = (i) => UV.getX(i) > 0.6, schnalle = (i) => UV.getX(i) > 0.35 && UV.getX(i) <= 0.6;   // Stellen im Bild des Körpers: orange Band, graue Schnalle
  if (kleid.hutFarbe != null) {                          // eine Farbe: die Helligkeit kommt weiter aus dem Bild (Unterseite dunkler), Band und Schnalle wie die Kappe
    let hell = () => 1;
    try {
      const bild = hut.material.map.image, c = document.createElement("canvas"); c.width = bild.width; c.height = bild.height;
      const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(bild, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data;
      hell = (i) => { const k = 4 * (Math.min(c.height - 1, Math.floor(UV.getY(i) * c.height)) * c.width + Math.min(c.width - 1, Math.floor(UV.getX(i) * c.width))); return Math.min(1.2, Math.max(0.5, (0.3 * d[k] + 0.6 * d[k + 1] + 0.1 * d[k + 2]) / 95)); };
    } catch (e) { /* ohne Bild: gleichmäßig */ }
    const farbe = new THREE.Color(kleid.hutFarbe), F = new Float32Array(P.count * 3);
    for (let i = 0; i < P.count; i++) { const h = (kleid.hutband === false && (band(i) || schnalle(i)) ? 1 : hell(i)) ** 2; F[3 * i] = farbe.r * h; F[3 * i + 1] = farbe.g * h; F[3 * i + 2] = farbe.b * h; }
    geo.setAttribute("color", new THREE.BufferAttribute(F, 3));
    hut.material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
  }
  if (kleid.hutband === false) {                         // Band liegt glatt auf der Kappe, die Schnalle verschwindet darunter
    for (let i = 0; i < P.count; i++) {
      if (!band(i) && !schnalle(i)) continue;
      const x = P.getX(i), y = Math.min(HUTBAND.bis, Math.max(HUTBAND.von, P.getY(i))), z = P.getZ(i), r = Math.hypot(x, z) || 1;
      const soll = HUTBAND.unten + ((y - HUTBAND.von) / (HUTBAND.bis - HUTBAND.von)) * (HUTBAND.oben - HUTBAND.unten) + 0.004;
      if (band(i)) { const tief = P.getY(i) < 0.2 ? 0.03 : 0, neu = tief ? soll + tief : Math.min(r, soll); P.setXYZ(i, (x * neu) / r, y - 1.5 * tief, (z * neu) / r); }   // der untere Rand steckt in der Krempe (sonst klafft ein Spalt)
      else P.setXYZ(i, 0, 0.25, 0);   // die Schnalle fällt in einen Punkt im Hut zusammen
    }
  }
  if (kleid.zipfel === "spitz") {                        // die Ringe des hängenden Zipfels auf eine gerade Linie nach oben setzen
    const mitten = ZIPFEL.mitten.map(([y, z]) => new THREE.Vector3(0, y, z)), ring = new Int8Array(P.count).fill(-1), ort = new THREE.Vector3();
    for (let lauf = 0; lauf < 2; lauf++) {               // jeden Punkt dem nächsten Ring zuordnen, dann die Ringmitten nachmessen
      const summe = mitten.map(() => new THREE.Vector3()), zahl = mitten.map(() => 0);
      for (let i = 0; i < P.count; i++) {
        if (P.getY(i) < ZIPFEL.ab) continue; ort.fromBufferAttribute(P, i);
        let best = 0, nah = Infinity; mitten.forEach((c, k) => { const d = ort.distanceTo(c); if (d < nah) { nah = d; best = k; } });
        ring[i] = best; summe[best].add(ort); zahl[best]++;
      }
      mitten.forEach((c, k) => { if (zahl[k]) c.copy(summe[k].multiplyScalar(1 / zahl[k])).setX(0); });
    }
    const X = new THREE.Vector3(1, 0, 0), hoch = new THREE.Vector3(0, 1, ZIPFEL.neigung).normalize(), nachHinten = hoch.clone().cross(X);
    const laengs = mitten.map((c, k) => mitten[Math.min(k + 1, mitten.length - 1)].clone().sub(mitten[Math.max(k - 1, 0)]).normalize().cross(X));
    for (let i = 0; i < P.count; i++) {
      const k = ring[i]; if (k < 1) continue;
      const ab = ort.fromBufferAttribute(P, i).sub(mitten[k]), b = Math.sign(ab.dot(laengs[k]) || 1) * Math.hypot(ab.y, ab.z), seitlich = ab.x, eng = k === 3 ? 0 : 1;   // die Spitze selbst ist ein Punkt
      ort.copy(mitten[0]).addScaledVector(hoch, ZIPFEL.lage[k] * ZIPFEL.lang).addScaledVector(X, seitlich * eng).addScaledVector(nachHinten, b * eng);
      P.setXYZ(i, ort.x, ort.y, ort.z);
    }
    // Schattierung des Zipfels neu: Flächen-Richtungen je Ort mitteln (die Punkte liegen doppelt, einmal je Farbstelle)
    const N = geo.attributes.normal, I = geo.index, je = new Map(), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), key = (i) => [P.getX(i), P.getY(i), P.getZ(i)].map((w) => Math.round(w * 500)).join(",");
    for (let f = 0; f < (I ? I.count : P.count); f += 3) {
      const e = [0, 1, 2].map((n) => (I ? I.getX(f + n) : f + n)); if (!e.some((i) => ring[i] >= 1)) continue;
      a.fromBufferAttribute(P, e[0]); b.fromBufferAttribute(P, e[1]).sub(a); c.fromBufferAttribute(P, e[2]).sub(a); b.cross(c);
      for (const i of e) { const k = key(i); if (!je.has(k)) je.set(k, new THREE.Vector3()); je.get(k).add(b); }
    }
    for (let i = 0; i < P.count; i++) if (ring[i] >= 1) { const n = je.get(key(i)); if (n && n.lengthSq() > 0) { a.copy(n).normalize(); N.setXYZ(i, a.x, a.y, a.z); } }
    N.needsUpdate = true;
  }
  const rand = KREMPE.innen + (KREMPE.aussen - KREMPE.innen) * breit;
  if (breit !== 1 || rund) for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i), r = Math.hypot(x, z); if (r <= KREMPE.innen || y > 0.5) continue;
    const neu = KREMPE.innen + (r - KREMPE.innen) * breit, k = neu / r;
    P.setXYZ(i, x * k, (y < KREMPE.oben ? KREMPE.oben + (y - KREMPE.oben) * (0.4 + 0.6 * breit) : y) + krempeBogen(Math.min(1, (neu - KREMPE.innen) / (rand - KREMPE.innen)), rund), z * k);
  }
  P.needsUpdate = true; geo.computeBoundingBox(); geo.computeBoundingSphere();
  return hut;
}
function ringMitte(netz, knochen, drin) {                // Mitte der Punkte eines Rings, gesehen vom Gelenk-Knochen in Ruhe
  const P = netz.geometry.attributes.position, mitte = new THREE.Vector3(); let n = 0;
  for (let i = 0; i < P.count; i++) if (drin(P.getX(i), P.getY(i), P.getZ(i))) { mitte.add(new THREE.Vector3(P.getX(i), P.getY(i), P.getZ(i))); n++; }
  return knochen.worldToLocal(netz.localToWorld(mitte.multiplyScalar(1 / Math.max(1, n))));
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

/* Rundkurs (Mr. Alex 18.11.: „Rennen kann man mehr beurteilen, wenn er nicht nur zwei, drei Schritte geradeaus macht und sich dann schon umdreht“):
   ein Rechteck mit runden Ecken, x0…x1 und z0…z1, Eckenradius r; die Figur startet auf der Kante z0 und läuft ohne Wenden im Kreis.
   Liefert Ort und Blickrichtung nach `weg` Metern (die Richtung läuft stetig weiter, ohne Sprung nach einer Runde) und die Länge einer Runde. */
export function rundeOrt(ru, weg) {
  const a = ru.x1 - ru.x0 - 2 * ru.r, b = ru.z1 - ru.z0 - 2 * ru.r, q = (Math.PI * ru.r) / 2, lang = 2 * (a + b) + 4 * q;
  let s = weg + (ru.start || 0); const runden = Math.floor(s / lang); s -= runden * lang;
  const ecken = [[ru.x1 - ru.r, ru.z0 + ru.r], [ru.x1 - ru.r, ru.z1 - ru.r], [ru.x0 + ru.r, ru.z1 - ru.r], [ru.x0 + ru.r, ru.z0 + ru.r]];
  const anfang = [[ru.x0 + ru.r, ru.z0], [ru.x1, ru.z0 + ru.r], [ru.x1 - ru.r, ru.z1], [ru.x0, ru.z1 - ru.r]];
  for (let k = 0; k < 4; k++) {
    const w0 = Math.PI / 2 - (k * Math.PI) / 2, gerade = k % 2 ? b : a;
    if (s < gerade) return { x: anfang[k][0] + Math.sin(w0) * s, z: anfang[k][1] + Math.cos(w0) * s, winkel: w0 - 2 * Math.PI * runden, lang };
    s -= gerade;
    if (s < q) { const w = w0 - s / ru.r; return { x: ecken[k][0] + ru.r * Math.cos(w), z: ecken[k][1] - ru.r * Math.sin(w), winkel: w - 2 * Math.PI * runden, lang }; }
    s -= q;
  }
  return { x: anfang[0][0], z: anfang[0][1], winkel: Math.PI / 2 - 2 * Math.PI * (runden + 1), lang };
}
/* Sergeant Bearskin (Teil C, Schritt 1): KayKit-Knight, gestreckt nach der Profile-Tabelle, Kopf mit Fellmütze aus tower_sergeant.py.
   umfaerben: Körperteil → Farbfeld des Körperbilds (Spalte,Zeile von 8 × 4) → neues Feld. Aus der Rüstung wird die Uniform der Garde:
   roter Rock, weißer Gürtel, goldene Schnalle und Abzeichen, schwarze Hose und Stiefel. */
const ROT = [0, 1], WEISS = [1, 1], GOLD = [4, 1], SCHWARZ = [2, 0];
export const SERGEANT = { koerper: "koerper_knight", teile: "sergeant_teile", bau: { arm: 1.9, bein: 3.3, kopf: 0.7, rumpf: 1.3 }, schlank: 0.6, fuss: 0.9, schulter: { hals: 0.025 }, stramm: true,
  gang: { heben: 0.85, ferse: 0, rollt: 0.04, ballen: 0.35, wippen: 0.03, spur: 1, tempo: 1.3 }, drill: { vorn: 85, hinten: 30, schnell: 2.2 },   // britischer Drill (Figurenblatt): Knie hoch, der Fuß stampft flach auf, Arme gestreckt bis Schulterhöhe, 1,3 m/s; Spur = Hüftbreite, damit die Beine aneinander vorbeigehen
    // Mr. Alex 18.11.: rappeldürr, eine lange Bohnenstange (schlank = Breite und Tiefe von Rumpf, Armen und Beinen, 1 = wie das Modell; seit 19.11. sauber gebaut statt gequetscht, siehe schlankBauen · fuss = Länge der Füße: 0.9 ist die Hälfte länger als die gequetschten 0.6)
  kopf: "sergeantkopf", hand: 0.72,   // Kopf mit Bart, rothaarig, Knollennase (Wahl Mr. Alex 18./19.11.) · hand = Handgröße gegenüber Mr. Flex
 
  uniform: { saum: [0.70, 1.10, 0.02], knoepfe: [0.75, 0.82, 0.89, 0.96, 1.03], knopf: 0.026 },   // weißer Saum vorn (von, bis, halbe Breite) und silberne Knöpfe (Höhen, Größe), Maße des ungestreckten Körpers
  umfaerben: { Body: { "3,0": ROT, "7,0": ROT,   // kein schwarzer Kragen mehr (Mr. Alex 19.11.: bringt nur Probleme)
    "7,1": (y) => (y >= 1.1 ? ROT : SCHWARZ), "6,0": WEISS, "2,1": GOLD, "0,1": GOLD }, Arm: { "3,0": ROT, "4,0": ROT, "7,0": ROT, "6,0": ROT }, Leg: { "3,0": SCHWARZ, "7,0": SCHWARZ, "7,1": SCHWARZ, "6,0": SCHWARZ } } };
/* Uniform (Mr. Alex 19.11., nach seinem Foto der Garde): weißer Saum vorn und silberne Knöpfe darauf. Die Teile liegen auf der Vorderseite des Körpernetzes
   (Strahl von vorn) und bekommen die Gewichte der Stelle, auf der sie liegen – so strecken, biegen und bewegen sie sich mit dem Rock. */
function uniformTeile(m, plan, duenn) {
  let rumpf = null; m.traverse((o) => { if (o.isSkinnedMesh && /_Body$/.test(o.name)) rumpf = o; }); if (!rumpf) return;
  const G = rumpf.geometry, P = G.attributes.position, I = G.index, SI = G.attributes.skinIndex, SW = G.attributes.skinWeight;
  const vorn = (x, y) => {                              // vorderster Punkt des Rumpfs bei (x, y): Tiefe und der nächste Eckpunkt
    let best = null;
    for (let t = 0; t < I.count; t += 3) {
      const [a, b, c] = [I.getX(t), I.getX(t + 1), I.getX(t + 2)], ax = P.getX(a), ay = P.getY(a), bx = P.getX(b), by = P.getY(b), cx = P.getX(c), cy = P.getY(c);
      const d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy); if (Math.abs(d) < 1e-9) continue;
      const u = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / d, w = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / d, r = 1 - u - w; if (u < 0 || w < 0 || r < 0) continue;
      const z = u * P.getZ(a) + w * P.getZ(b) + r * P.getZ(c); if (!best || z > best.z) best = { z, i: u >= w && u >= r ? a : w >= r ? b : c };
    }
    return best;
  };
  const ort = [], norm = [], farbe = [], si = [], sw = [], idx = [], WEISS_F = [0.93, 0.93, 0.91], SILBER = [0.74, 0.77, 0.82];
  const punkt = (x, y, z, n, f, von) => { ort.push(x, y, z); norm.push(...n); farbe.push(...f); for (const k of "XYZW") { si.push(SI["get" + k](von)); sw.push(SW["get" + k](von)); } return ort.length / 3 - 1; };
  const [von, bis, breit] = plan.saum, N = 20; let zuletzt = null, davor = null;
  for (let k = 0; k <= N; k++) {
    const y = von + ((bis - von) * k) / N, h = vorn(0, y) || zuletzt; if (!h) continue; zuletzt = h;
    const l = punkt(breit / duenn, y, h.z + 0.007, [0, 0, 1], WEISS_F, h.i), r = punkt(-breit / duenn, y, h.z + 0.007, [0, 0, 1], WEISS_F, h.i);
    if (davor) idx.push(davor[0], r, davor[1], davor[0], l, r); davor = [l, r];
  }
  for (const y of plan.knoepfe) {
    const h = vorn(0, y); if (!h) continue;
    const R = plan.knopf, ringe = 4, teile = 10, erste = ort.length / 3;
    for (let a = 0; a <= ringe; a++) for (let b = 0; b < teile; b++) {
      const hoch = (a / ringe) * (Math.PI / 2), rund = (b / teile) * 2 * Math.PI, n = [Math.cos(hoch) * Math.cos(rund), Math.cos(hoch) * Math.sin(rund), Math.sin(hoch)];
      punkt((n[0] * R) / duenn, y + n[1] * R, h.z + 0.007 + n[2] * R * 0.6, n, SILBER, h.i);
    }
    for (let a = 0; a < ringe; a++) for (let b = 0; b < teile; b++) { const p = erste + a * teile + b, q = erste + a * teile + ((b + 1) % teile); idx.push(p, q, q + teile, p, q + teile, p + teile); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(ort, 3)); geo.setAttribute("normal", new THREE.Float32BufferAttribute(norm, 3)); geo.setAttribute("color", new THREE.Float32BufferAttribute(farbe, 3));
  geo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(si, 4)); geo.setAttribute("skinWeight", new THREE.Float32BufferAttribute(sw, 4)); geo.setIndex(idx);
  const teil = new THREE.SkinnedMesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.15 }));
  teil.name = "uniform"; teil.frustumCulled = false; teil.position.copy(rumpf.position); teil.quaternion.copy(rumpf.quaternion); teil.scale.copy(rumpf.scale);
  rumpf.parent.add(teil); teil.bind(rumpf.skeleton, rumpf.bindMatrix);
}
/* Kein Kragen (Mr. Alex 19.11.: Standard für alle Figuren, er bringt mehr Probleme, als er löst; nur besondere Figuren behalten ihn mit kragen: false).
   Alle Flächen des Körpers über der Schulterhöhe (plan.ab, Maß des ungestreckten Körpers) werden gelöscht: Kragen und Halsstumpf. Das Loch schließt eine flache
   Schulterkappe in der Farbe der Kleidung, die am Schnittrand ansetzt und dessen Knochen-Gewichte übernimmt; der Hals selbst gehört zum Kopf (tower_flex.py, "hals"). */
const KRAGEN_WEG = { ab: 1.1 };
function kragenWeg(m, plan) {
  m.traverse((o) => {
    if (!o.isSkinnedMesh || !/_Body$/.test(o.name)) return;
    const g = o.geometry, P = g.attributes.position, alt = g.index.array, bleibt = [], rand = new Map();
    for (let i = 0; i < alt.length; i += 3) {
      const d = [alt[i], alt[i + 1], alt[i + 2]];
      if (!d.some((e) => P.getY(e) > plan.ab)) { bleibt.push(...d); continue; }
      for (const e of d) if (P.getY(e) <= plan.ab) rand.set([P.getX(e), P.getY(e), P.getZ(e)].map((x) => x.toFixed(3)).join(), e);   // Schnittrand, jede Stelle einmal
    }
    const ring = [...rand.values()].sort((a, b) => Math.atan2(P.getZ(a), P.getX(a)) - Math.atan2(P.getZ(b), P.getX(b))), n = ring.length;
    if (n < 3) return;
    const felder = {}; for (const e of ring) { const k = Math.floor(g.attributes.uv.getX(e) * 8) + "," + Math.floor(g.attributes.uv.getY(e) * 4); felder[k] = (felder[k] || 0) + 1; }
    const feld = Object.keys(felder).sort((a, b) => felder[b] - felder[a])[0].split(",").map(Number), uv = [(feld[0] + 0.5) / 8, (feld[1] + 0.5) / 4];   // die häufigste Farbe am Rand = Farbe der Kleidung
    // drei Ringe (Schnittrand, halbe Höhe, Halsansatz) und die Mitte; jeder neue Punkt übernimmt die Gewichte seines Randpunkts
    const STUFEN = [[0, 1, 0, 0.55], [0.034, 0.62, 0, 0.8], [0.056, 0, 0.085, 1]], neuP = [], neuN = [], neuVon = [];   // Höhe über ab · Anteil des Randradius · fester Radius · Normale nach oben
    for (const [hoch, anteil, fest, auf] of STUFEN) for (const e of ring) {
      const x = P.getX(e), z = P.getZ(e), r = Math.hypot(x, z) || 1, rn = r * anteil + fest, y = hoch ? plan.ab + hoch : P.getY(e);
      neuP.push(x / r * rn, y, z / r * rn); const l = Math.hypot(1 - auf, auf); neuN.push(x / r * (1 - auf) / l, auf / l, z / r * (1 - auf) / l); neuVon.push(e);
    }
    neuP.push(0, plan.ab + 0.058, 0); neuN.push(0, 1, 0); neuVon.push(ring[0]);
    const v0 = P.count, mitte = v0 + 3 * n, flaechen = [];
    const dreieck = (a, b, c) => {                         // immer so herum, dass die Fläche nach außen und oben schaut
      const p = (e) => [neuP[(e - v0) * 3], neuP[(e - v0) * 3 + 1], neuP[(e - v0) * 3 + 2]], [A, B, C] = [p(a), p(b), p(c)];
      const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], w = [C[0] - A[0], C[1] - A[1], C[2] - A[2]], nx = u[1] * w[2] - u[2] * w[1], ny = u[2] * w[0] - u[0] * w[2], nz = u[0] * w[1] - u[1] * w[0];
      const sx = A[0] + B[0] + C[0], sz = A[2] + B[2] + C[2];
      if (nx * sx + nz * sz + ny * 3 * Math.hypot(sx, sz) + ny * 0.001 >= 0) flaechen.push(a, b, c); else flaechen.push(a, c, b);
    };
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      for (let s = 0; s < 2; s++) { const a = v0 + s * n + i, b = v0 + s * n + j, c = v0 + (s + 1) * n + i, d = v0 + (s + 1) * n + j; dreieck(a, b, d); dreieck(a, d, c); }
      dreieck(v0 + 2 * n + i, v0 + 2 * n + j, mitte);
    }
    const mehr = neuVon.length, laenger = (name, fuellen) => {
      const at = g.attributes[name], feldNeu = new at.array.constructor((at.count + mehr) * at.itemSize); feldNeu.set(at.array);
      const neu = new THREE.BufferAttribute(feldNeu, at.itemSize, at.normalized);
      for (let k = 0; k < mehr; k++) fuellen(neu, at.count + k, k, at);
      g.setAttribute(name, neu);
    };
    for (const name of Object.keys(g.attributes)) {
      if (name === "position") laenger(name, (neu, i, k) => neu.setXYZ(i, neuP[k * 3], neuP[k * 3 + 1], neuP[k * 3 + 2]));
      else if (name === "normal") laenger(name, (neu, i, k) => neu.setXYZ(i, neuN[k * 3], neuN[k * 3 + 1], neuN[k * 3 + 2]));
      else if (name === "uv") laenger(name, (neu, i) => neu.setXY(i, uv[0], uv[1]));
      else laenger(name, (neu, i, k, at) => { for (let c = 0; c < at.itemSize; c++) neu.setComponent(i, c, at.getComponent(neuVon[k], c)); });   // Gewichte, Knochen, Farbe: wie der Randpunkt
    }
    g.setIndex([...bleibt, ...flaechen]); g.computeBoundingSphere(); g.computeBoundingBox();
    o.userData.kragenWeg = { rand: n, geloescht: (alt.length - bleibt.length) / 3 };
  });
}
/* Schulterlinie (Standard für alle Figuren ohne Kragen, Mr. Alex 19.11.: die Arme wuchsen aus dem Hals): sichtbarer Hals, Schultern tiefer, Schultern immer
   deutlich breiter als der Hals. Maße des ungestreckten Körpers: hals = so viel höher sitzt der Kopf · tief = so viel tiefer sitzen die Schultergelenke
   · breit = Mindestabstand des Schultergelenks von der Mitte (auch bei schlanken Figuren). Einzelne Figuren können mit figur.schulter abweichen. */
const SCHULTER = { hals: 0.05, tief: 0.045, breit: 0.165 };
const ARM_HOCH = 1.107, BEIN_X = 0.171, KNOECHEL = 0.145;   // KayKit-Körper in Ruhe: Höhe der Armachse (Arme waagrecht zur Seite) · Abstand der Beinachse von der Mitte · Höhe des Fußgelenks
/* Schlanke Figur sauber gebaut (Mr. Alex 18./19.11.: bisher wurde die ganze Figur in Breite und Tiefe gequetscht – dann verzerrt sich jedes gedrehte Glied,
   die Hand zuckte beim Salutieren, und die Füße wurden kurz). Jetzt wird jedes Teil einmal um seine eigene Achse dünner gemacht: der Rumpf um die Körpermitte,
   die Arme um die Armachse, die Beine um die Beinachse; die Füße behalten ihre Länge (fuss). Die Gelenke rücken passend nach innen (gibt ihre neue Lage zurück). */
function schlankBauen(m, d, fuss) {
  m.traverse((o) => {
    if (!o.isSkinnedMesh) return;
    const P = o.geometry.attributes.position, arm = /_Arm/.test(o.name), bein = /_Leg/.test(o.name);
    if (!arm && !bein && !/_Body$/.test(o.name)) return;
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
      if (arm) P.setXYZ(i, x, ARM_HOCH + (y - ARM_HOCH) * d, z * d);
      else if (bein) { const s = Math.sign(x) || 1, t = Math.min(1, Math.max(0, (y - KNOECHEL) / 0.06)); P.setXYZ(i, s * BEIN_X + (x - s * BEIN_X) * d, y, z * (fuss + (d - fuss) * t)); }
      else P.setXYZ(i, x * d, y, z * d);
    }
    P.needsUpdate = true; o.geometry.computeBoundingBox(); o.geometry.computeBoundingSphere();
  });
}
/* Setzt einen Knochen im ruhenden, ungedrehten Körper an eine neue Stelle (Maße des Körpers) und gibt seine Lage im Elternknochen zurück. */
function knochenNach(m, k, aendern) { m.updateMatrixWorld(true); const p = k.getWorldPosition(new THREE.Vector3()); aendern(p); return k.parent.worldToLocal(p); }
function drehung(o) { const q = o.quaternion.clone(); for (let p = o.parent; p; p = p.parent) q.premultiply(p.quaternion); return q; }   // Drehung in der Welt ohne die Maße der Eltern (für Teile, die nicht mitgequetscht werden sollen)
function umfaerben(m, plan) {
  m.traverse((o) => {
    const teil = o.isSkinnedMesh && Object.keys(plan).find((k) => o.name.includes(k)); if (!teil) return;
    const UV = o.geometry.attributes.uv;
    for (let i = 0; i < UV.count; i++) { const u = UV.getX(i), w = UV.getY(i), su = Math.floor(u * 8), sw = Math.floor(w * 4), feld = plan[teil][su + "," + sw], neu = typeof feld === "function" ? feld(o.geometry.attributes.position.getY(i)) : feld; if (neu) UV.setXY(i, u + (neu[0] - su) / 8, w + (neu[1] - sw) / 4); }
    UV.needsUpdate = true;
  });
}
const GELADEN = new Map();                             // Bewegungen, Hände und Köpfe nur einmal laden, auch wenn mehrere Figuren im Raum stehen (der Körper wird je Figur neu geladen)
/* figur = eine andere Figur als Mr. Flex auf demselben Weg: { koerper, teile, bau, umfaerben } (siehe SERGEANT); ohne Angabe wie bisher Mr. Flex. */
export async function ladeBauProbe(lader, szene, platz, kleidung = KLEIDUNG_START, figur = {}) {
  const einmal = (n) => { if (!GELADEN.has(n)) GELADEN.set(n, lader.loadAsync(`figuren/${n}.glb`)); return GELADEN.get(n); };
  const lade = (n) => (n === (figur.koerper || "probe_mage_ganz") ? lader.loadAsync(`figuren/${n}.glb`) : einmal(n)), clips = {};
  const [koerper, haende, kopfDatei, ...dateien] = await Promise.all([lade(figur.koerper || "probe_mage_ganz"), lade("haende"), kleidung.kopf ? lade(figur.teile || "flex_teile") : null, lade("kaykit_bewegungen"), lade("gesten"), lade("kungfu")]);
  for (const d of dateien) for (const c of d.animations) clips[c.name] = c;
  const m = koerper.scene, K = (n) => m.getObjectByName(n), bau = { ...BAU_START, ...figur.bau };
  if (figur.kragen !== false) kragenWeg(m, figur.kragen || KRAGEN_WEG);
  if (figur.umfaerben) umfaerben(m, figur.umfaerben);
  // Schulterlinie und schlanker Körper: feste Lage der Gelenke, die sich nicht mit dem Körper strecken (strecke setzt sie in jedem Bild)
  const schulter = { ...SCHULTER, ...figur.schulter }, schlank = figur.schlank || 1, fussLang = figur.fuss || schlank, gelenkFest = [];
  if (figur.schlank) schlankBauen(m, schlank, fussLang);
  for (const s of "lr") {
    const vz = s === "l" ? 1 : -1;
    if (figur.kragen !== false) gelenkFest.push([K("upperarm" + s), knochenNach(m, K("upperarm" + s), (p) => { p.x = vz * Math.max(Math.abs(p.x) * schlank, schulter.breit * Math.min(1, schlank / 0.6)); p.y -= schulter.tief; })]);
    if (figur.schlank) { gelenkFest.push([K("upperleg" + s), knochenNach(m, K("upperleg" + s), (p) => { p.x *= schlank; })]); }
  }
  // (gesetzt werden Schulter- und Hüftgelenke erst, wenn die Ringe an Knie und Ellbogen eingemessen sind – die brauchen den Körper in Ruhe; sonst sitzen sie versetzt und die Beine greifen am Knie ineinander)
  if (figur.schlank) for (const s of "lr") { const k = K("toes" + s), ort = knochenNach(m, k, (p) => { p.z *= fussLang; }); k.position.copy(ort); gelenkFest.push([k, ort]); }
  const GANG = { ...GEHEN, ...figur.gang };            // Geh-Ablauf je Figur (Sergeant: britischer Drill)
  const FERSE = FERSE_Z * fussLang, halsHoch = figur.kragen !== false ? schulter.hals : 0;
  const handMass = HAND * (figur.hand || 1), handFolgt = [];
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
  const zehRuhe = {}, fersePunkt = {};                  // Lage der Zehen und Auflagepunkt der Ferse (für das Abrollen beim Gehen)
  for (const s of "lr") {
    handRuhe[s] = K("wrist" + s).getWorldQuaternion(Q()); fussRuhe[s] = K("foot" + s).getWorldQuaternion(Q()); zehRuhe[s] = K("toes" + s).getWorldQuaternion(Q());
    const pf = K("foot" + s).getWorldPosition(v()); fersePunkt[s] = K("foot" + s).worldToLocal(v(pf.x, 0, m.localToWorld(v(0, 0, FERSE)).z));
  }
  const fussMass = (() => {                             // Knöchel über dem Boden, Ferse hinter dem Knöchel, Zehengelenk vor dem Knöchel und über dem Boden
    const pf = K("footl").getWorldPosition(v()), pt = K("toesl").getWorldPosition(v());
    return { ha: pf.y, hb: pf.z - m.localToWorld(v(0, 0, FERSE)).z, bf: pt.z - pf.z, ht: pt.y };
  })();

  // Hand mit beweglichen Fingern: der Fäustling schrumpft weg, am Handgelenk sitzt ein Halter mit der Hand (links gespiegelt)
  const halter = {}, glieder = {}, krall = { r: [0, 0, 0, 0, 0, 0], l: [0, 0, 0, 0, 0, 0] };
  for (const [s, vz] of [["r", -1], ["l", 1]]) {
    const gelenk = K("wrist" + s), ort = gelenk.getWorldPosition(v()), arm = ort.clone().sub(K("lowerarm" + s).getWorldPosition(v())).normalize();
    const h = new THREE.Group(); szene.add(h);
    h.position.copy(ort); h.quaternion.setFromUnitVectors(v(vz, 0, 0), arm); h.scale.set(-vz * mass * handMass, mass * handMass, mass * handMass);
    const hand = haende.scene.getObjectByName("hand").clone(true); hand.position.set(0, 0, 0); h.add(hand);
    hand.traverse((o) => { o.frustumCulled = false; });
    glieder[s] = [1, 2, 3, 4].map((i) => [hand.getObjectByName("f" + i), hand.getObjectByName("f" + i + "b")]).concat([[hand.getObjectByName("daumen")]]);
    h.updateMatrixWorld(true); halter[s] = h;
    gelenk.attach(h);
  }
  const haendeNach = () => { for (const [h, gelenk, q] of handFolgt) { gelenk.getWorldPosition(h.position); h.quaternion.copy(drehung(gelenk)).multiply(q); h.updateMatrixWorld(true); } };
  const kleidungPunkte = kleidungAb(m, kleidung);
  const stiefel = stiefelFest(m, K), halbGelenke = [stiefel.kniel, stiefel.knier, ...ellbogenFest(m, K)].filter(Boolean), hut = hutForm(m, kleidung);
  for (const [k, ort] of gelenkFest) k.position.copy(ort);
  mantelFolgt(m, K);
  if (figur.uniform) uniformTeile(m, figur.uniform, 1);
  /* Eigener Kopf (Kopf-Probe Mr. Flex, 18.11.): der Kopf aus Blender sitzt auf dem Kopfknochen, der Mage-Kopf wird ausgeblendet; der Hut bleibt
     und wird auf den schmaleren Kopf angepasst (hutWeit, hutHoch je Figur). Gesicht wie bei Gary (baueGesicht), dazu Sonnenbrille und Funkeln. */
  let kopfTeil = null, gesicht = null, brille = null, bart = null; const ohren = [], OHR_ROT = new THREE.Color(0.86, 0.12, 0.1); const sterne = [], kette = { glieder: [] }, kq = Q(), kein = Q();
  const ketteNach = () => { if (!kette.glieder.length) return; kq.copy(kette.kiefer.quaternion).multiply(kette.ruhe); for (const [o, ort, anteil] of kette.glieder) o.position.copy(ort).sub(kette.kiefer.position).applyQuaternion(kein.identity().slerp(kq, anteil)).add(kette.kiefer.position); };
  if (kopfDatei) {
    m.traverse((o) => { if (o.isSkinnedMesh && /_Head$/.test(o.name)) o.visible = false; });
    kopfTeil = kopfDatei.scene.getObjectByName(kleidung.kopf); kopfTeil.traverse((o) => { o.frustumCulled = false; });
    const kq = head.getWorldQuaternion(Q()), ks = mass * bau.kopf;   // der Kopf ist in Metern gebaut, für die Kopfgröße von Mr. Flex
    kopfTeil.quaternion.copy(kq.invert().multiply(m.getWorldQuaternion(Q()))); kopfTeil.scale.setScalar(1 / ks);
    kopfTeil.position.copy(v(...KOPF_SITZ).applyQuaternion(kopfTeil.quaternion).multiplyScalar(1 / ks)); head.add(kopfTeil);
    if (hut) { hut.scale.multiplyScalar(kleidung.hutWeit || 1); hut.position.y += kleidung.hutHoch || 0; }
    gesicht = baueGesicht(kopfTeil, 0.19, { mass: 0.6, flach: true, wangeVor: 1.3 });
    const kf = kopfTeil.getObjectByName("kiefer");      // Kinnkette (Sergeant): Glieder kette_<Nr>_<Anteil> gehen mit diesem Anteil mit dem Unterkiefer mit
    if (kf) { kette.kiefer = kf; kette.ruhe = kf.quaternion.clone().invert(); for (const o of kopfTeil.children) { const t = /^kette_\d+_(\d+)/.exec(o.name); if (t) kette.glieder.push([o, o.position.clone(), +t[1] / 100]); } }
    const sb = kopfTeil.getObjectByName("schnurrbart"); if (sb) bart = { o: sb, ort: sb.position.clone(), q: sb.quaternion.clone() };
    kopfTeil.traverse((o) => { if (o.isMesh && /^ohr\d*$/.test(o.name)) { o.material = o.material.clone(); ohren.push({ farbe: o.material.color, haut: o.material.color.clone() }); } });   // eigene Farbe: die Ohren können rot werden
    const b = kopfTeil.getObjectByName("sonnenbrille"); if (b) brille = { o: b, ort: b.position.clone(), q: b.quaternion.clone() };
    const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"); x.fillStyle = "#fff"; x.beginPath();   // vierzackiger Stern wie der Blitz an Garys Zahn
    for (let i = 0; i < 8; i++) { const r = i % 2 ? 4 : 31, w = (i * Math.PI) / 4; x.lineTo(32 + Math.cos(w) * r, 32 + Math.sin(w) * r); }
    x.fill(); const bild = new THREE.CanvasTexture(c);
    for (const s of [-1, 1]) { const st = new THREE.Sprite(new THREE.SpriteMaterial({ map: bild, transparent: true, opacity: 0, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending })); st.renderOrder = 6; st.userData.seite = s; kopfTeil.add(st); sterne.push(st); }
  }
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
  /* Volumen an Knie und Ellbogen halten, und zwar rund: Zwei Ringe sitzen kurz vor dem Gelenk (auf der Achse des oberen Glieds) und kurz dahinter
     (auf der Achse des unteren), gedreht um ein Viertel und drei Viertel der Beuge und in der Beuge-Ebene um 1 / cos(ein Viertel der Beuge) breiter.
     So wird aus der spitzen Ecke eine abgeschrägte, und die Röhren bleiben so dick wie am gestreckten Glied. */
  const eins = Q(), stufe = Q(), streck = new THREE.Matrix4(), hilf = new THREE.Matrix4(), ohne = v(1, 1, 1), null3 = v();
  const knieRund = () => {
    for (const kn of halbGelenke) {
      const U = kn.unten, f = ruhe.get(kn.kind).clone().normalize(), beuge = kn.ruhe.clone().invert().multiply(U.quaternion);
      stufe.copy(eins).slerp(beuge, 0.25);
      const quer = f.clone().applyQuaternion(stufe).sub(f.clone().applyQuaternion(stufe.clone().invert())), c = f.dot(f.clone().applyQuaternion(stufe));
      const k = quer.lengthSq() > 1e-8 ? Math.min(KNIE_BREIT, 1 / Math.max(0.3, c)) - 1 : 0; quer.normalize();
      streck.set(1 + k * quer.x * quer.x, k * quer.x * quer.y, k * quer.x * quer.z, 0, k * quer.y * quer.x, 1 + k * quer.y * quer.y, k * quer.y * quer.z, 0, k * quer.z * quer.x, k * quer.z * quer.y, 1 + k * quer.z * quer.z, 0, 0, 0, 0, 1);
      for (const [G, anteil, seite, mitte] of kn.gelenke) {
        const ort = seite < 0 ? f.clone().multiplyScalar(-kn.fase) : f.clone().applyQuaternion(beuge).multiplyScalar(kn.fase);   // Mitte des Rings: vor dem Gelenk auf dem oberen Glied, dahinter auf dem unteren
        G.matrix.compose(U.position, kn.ruhe, ohne).multiply(hilf.compose(ort, stufe.copy(eins).slerp(beuge, anteil), ohne));
        if (k > 0) G.matrix.multiply(streck);
        G.matrix.multiply(hilf.makeTranslation(-mitte.x, -mitte.y, -mitte.z));
      }
    }
  };
  const strecke = () => {
    const b = beinTeile();
    for (const [art, liste] of Object.entries(gruppen)) for (const k of liste) k.position.copy(ruhe.get(k)).multiplyScalar(bau[art]);
    for (const k of bein.ober) k.position.copy(ruhe.get(k)).multiplyScalar(b.ober);
    for (const k of bein.unter) k.position.copy(ruhe.get(k)).multiplyScalar(b.unter);
    for (const [k, ort] of gelenkFest) k.position.copy(ort);
    if (halsHoch) head.position.y += halsHoch;         // sichtbarer Hals (Schulterlinie)
    for (const s of "lr") if (stiefel[s]) stiefel[s].position.copy(ruhe.get(K("foot" + s))).multiplyScalar(b.unter - 1);
    knieRund();
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
  const greife = (s, ziel, reich, pol, gewicht) => zweiGelenke(K("upperarm" + s), K("lowerarm" + s), K("wrist" + s), ziel, reich, pol, gewicht);
  const zweiGelenke = (S, E, W, ziel, reich, pol, gewicht) => {                   // Arm (Schulter, Ellenbogen, Handgelenk) oder Bein (Hüfte, Knie, Knöchel)
    const s0 = S.quaternion.clone(), e0 = E.quaternion.clone();
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
  const g = { stelle: 0, stelleW: 0, blick: 0, blickZiel: 0, blickBis: 0, blickGeste: 0, zuck: 0, ohren: 0, ohrRot: 0, stramm: 0, strammArm: 0, drill: 0, eilig: false, modus: "stehen", wahl: R, hand: [R, R], weg: 0, hin: 1, dreh: 0, bahn: platz.bahn || 2.4, runde: platz.runde || null, gerade: false, laeuft: null, flug: 0, wendet: false, grund: 0, hoehe: 0, steigt: 0, my: 0, dy: 0, geh: 0, ausdruck: "neutral", mund: null, rede: null, redeGesten: 0, redet: 0, akzent: 0, uhr: 0, nick: 0, brille: 1, brilleZiel: 1, funkel: 0, funkelIn: -1, blinkt: 0 };
  /* Stramme Haltung (Sergeant, Mr. Alex 19.11.: er stand breitarmig und mit durchgedrückten Knien): Im Stehen richten sich Rumpf, Arme und Beine nach festen
     Richtungen aus – Rücken gerade, Arme gestreckt an der Hosennaht, Handflächen am Bein, Beine gestreckt, Fersen zusammen, Fußspitzen leicht nach außen.
     Die Haltung blendet weich ein, sobald er steht, und sofort aus, wenn eine Geste oder der Gang beginnt (figur.stramm). */
  const sq = Q(), sw = Q(), sp = Q(), sa = v(), sb = v();
  const richte = (k, kind, nach, w) => {                // dreht den Knochen k, bis sein Kind in der Richtung `nach` (im Körper) liegt
    k.updateWorldMatrix(true, true);
    sa.copy(kind.getWorldPosition(sb)).sub(k.getWorldPosition(v())).normalize();
    sq.setFromUnitVectors(sa, sb.copy(nach).normalize().applyQuaternion(m.getWorldQuaternion(sw)));
    k.getWorldQuaternion(sw).premultiply(sq); k.parent.getWorldQuaternion(sp); sq.copy(sp).invert().multiply(sw);
    k.quaternion.slerp(sq, w);
  };
  const stramm = (dt) => {
    if (!figur.stramm) return;
    const steht = g.modus === "stehen", gruss = STRAMM_BEI.includes(g.modus);   // beim Salutieren bleibt der Körper stramm (Beine, linker Arm, Rücken) – nur der rechte Arm grüßt
    g.stramm += ((steht || gruss ? 1 : 0) - g.stramm) * Math.min(1, dt * (steht || gruss ? 7 : 14));
    g.strammArm += ((steht ? 1 : 0) - g.strammArm) * Math.min(1, dt * (steht ? 7 : 14));
    g.drill += ((g.modus === "gehen" && !g.wendet ? 1 : 0) - g.drill) * Math.min(1, dt * 8);
    if (g.drill > 0.01) {                                // Drill-Gang: Rücken starr und gerade, die Arme schwingen gestreckt bis Schulterhöhe, die Fäuste geschlossen (die Beine führt gehGang)
      const d = g.drill, G = gang.gehen, u0 = G.dauer ? aktion.gehen.time / G.dauer - G.phase : 0, DR = figur.drill || {};
      richte(K("spine"), K("chest"), v(0, 1, -0.02), d); richte(K("chest"), head, v(0, 1, 0.03), d);
      for (const [s, seite] of [["r", -1], ["l", 1]]) {
        const hin = Math.cos(2 * Math.PI * (u0 - (s === "l" ? 0.5 : 0))), mitte = ((DR.vorn ?? 85) - (DR.hinten ?? 30)) / 2, phi = ((mitte + ((DR.vorn ?? 85) - mitte) * hin) * Math.PI) / 180;   // der Arm ist vorn, wenn das andere Bein vorn ist
        const arm = v(seite * 0.04, -Math.cos(phi), Math.sin(phi));
        richte(K("upperarm" + s), K("lowerarm" + s), arm, d); richte(K("lowerarm" + s), K("wrist" + s), arm, d);
        dreheHand(s, arm.clone(), v(-seite, 0, 0), d);
      }
      if (d > 0.5 && g.modus === "gehen") g.hand = [F, F];   // nur im Gang: eine Geste gleich danach behält ihre Handform
      m.updateMatrixWorld(true);
    }
    const w = g.stramm; if (w < 0.01) return;
    richte(K("spine"), K("chest"), v(0, 1, -0.02), w); richte(K("chest"), head, v(0, 1, 0.03), w);                       // Rücken gerade, Brust leicht heraus
    for (const [s, seite] of [["r", -1], ["l", 1]]) {
      const wa = s === "r" ? Math.min(w, g.strammArm) : w;
      if (wa > 0.01) { richte(K("upperarm" + s), K("lowerarm" + s), v(seite * 0.05, -1, -0.02), wa); richte(K("lowerarm" + s), K("wrist" + s), v(-seite * 0.02, -1, 0.03), wa);   // Arme gestreckt an der Hosennaht
        dreheHand(s, v(0, -1, 0.05), v(-seite, 0, 0), wa); }                                                                // Finger nach unten, Handfläche am Bein
      richte(K("upperleg" + s), K("lowerleg" + s), v(0, -1, 0), w); richte(K("lowerleg" + s), K("foot" + s), v(0, -1, 0), w);   // Beine gestreckt und genau nebeneinander – nie nach innen: sie dürfen sich nicht berühren oder verschlingen (Mr. Alex 19.11.)
      richte(K("foot" + s), K("toes" + s), v(seite * 0.24, -0.72, 0.66), w);                                             // Fußspitzen leicht nach außen
    }
    m.updateMatrixWorld(true);
  };
  const posen = () => {                                 // gestreckter rechter Arm in eine feste Richtung (POSEN)
    g.blickGeste = 0; const regel = POSEN[g.modus]; if (!regel || !g.laeuft) return;
    const dauer = g.laeuft.getClip().duration, z = regel(Math.min(g.laeuft.time, dauer) / dauer); if (z.gewicht <= 0.001) return;
    const arm = v(...z.arm).normalize();
    richte(K("upperarmr"), K("lowerarmr"), arm, z.gewicht); richte(K("lowerarmr"), K("wristr"), arm, z.gewicht);
    dreheHand("r", arm, v(...z.flaeche), z.gewicht); g.blickGeste = (z.blick || 0) * z.gewicht; m.updateMatrixWorld(true);
  };
  const ziele = () => {
    const regel = ZIELE[g.modus]; if (!regel || !g.laeuft) return;
    const dauer = g.laeuft.getClip().duration, t = Math.min(g.laeuft.time, dauer), qm = m.getWorldQuaternion(Q());
    for (const [s, seite] of [["r", -1], ["l", 1]]) {
      const z = regel(seite, t / dauer, t, figur.schlank || 1); if (!z || z.gewicht <= 0.001) continue;
      const punkt = K(z.knochen).localToWorld(v(...z.ort)), pol = z.pol ? v(...z.pol).normalize().applyQuaternion(qm) : null, handLang = 0.19 * handMass * mass;
      if (z.finger) {
        const finger = v(...z.finger).normalize(), flaeche = v(...z.flaeche).normalize();
        flaeche.sub(finger.clone().multiplyScalar(flaeche.dot(finger))).normalize();                // genau senkrecht zu den Fingern
        greife(s, punkt.sub(finger.clone().applyQuaternion(qm).multiplyScalar(0.052 * handMass * mass)), 0, pol, z.gewicht);
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
      if (SOHLE_FREI[g.modus] === s) continue;
      const pf = hoehen[s], pk = wo(K("lowerleg" + s)), aufrecht = (pk.y - pf.y) / Math.max(1e-6, pk.distanceTo(pf));
      const w = (1 - weich(pf.y - unten, 0.03 * mass, 0.12 * mass)) * weich(aufrecht, 0.3, 0.6);
      if (w > 0.001) dreheWelt(K("foot" + s), Q().slerp(Q().setFromUnitVectors(sohlenHoch(s), v(0, 1, 0)), w));
    }
  };
  /* Gesicht, Sonnenbrille, Funkeln. Brille: 1 = auf, 0,5 = auf die Nase heruntergeschoben (Augen frei), 0 = ab.
     Funkeln: ein kurzer Stern an jedem Auge wie der Blitz an Garys Zahn; ist die Brille auf, funkelt es blau durch die Gläser. */
  const kopfLauf = (dt) => {
    if (!gesicht) return;
    if (g.rede) {                                        // Reden mit Gestik: an jedem Einsatz der Aufnahme eine große Geste aus seinem Vorrat, eine nach der anderen
      const zeit = g.rede.zeit(); let dran = false;
      while (g.rede.i < g.rede.einsaetze.length && g.rede.einsaetze[g.rede.i] <= zeit) { g.rede.i++; dran = true; }
      if (dran) g.rede.offen = true;
      if (g.rede.offen && g.modus === "stehen") { g.rede.offen = false; starte(REDE_GESTEN[g.redeGesten++ % REDE_GESTEN.length]); }
    }
    const zeigt = g.mund && g.ausdruck === "neutral" ? "reden" : g.ausdruck;   // Grundausdruck beim Reden: echtes Lächeln
    /* Kopf und Gesicht reden mit (Mr. Alex 18.11.): Der Kopf nickt und neigt sich leicht wie bei Gary, betonte (laute, weit offene) Silben heben
       die Brauen und geben dem Kopf einen kleinen Nicker, die Wangen gehen mit dem Mund mit. */
    g.uhr += dt; g.redet += ((g.mund ? 1 : 0) - g.redet) * Math.min(1, dt * 6);
    const betont = g.mund ? Math.max(0, Math.min(1, ((g.mund[4] == null ? 0.5 : g.mund[4]) * g.mund[0] - 0.3) / 0.35)) : 0;
    g.akzent += (betont - g.akzent) * Math.min(1, dt * (betont > g.akzent ? 16 : 5));
    const basis = AUSDRUECKE[zeigt] || NEUTRAL, ziel = g.redet > 0.01 ? { ...basis, braueHoch: basis.braueHoch + 0.45 * g.akzent, wange: Math.min(1, basis.wange + 0.25 * g.akzent) } : { ...basis };
    /* Die weichen Augenblicke des Sergeants (Figurenblatt): Seitenblick nur aus den Augenwinkeln – der Kopf bleibt; der Bart zuckt, wenn er fast lächelt; rote Ohren. */
    g.blickBis = Math.max(0, g.blickBis - dt); g.zuck = Math.max(0, g.zuck - dt); g.ohren = Math.max(0, g.ohren - dt);
    const sucht = g.modus === "hutsuchen" && g.laeuft ? dabei(g.laeuft.time / g.laeuft.getClip().duration, 0.05, 0.1, 0.86, 0.95) * (Math.sin((2 * Math.PI * g.laeuft.time) / 1.3) > 0 ? -1 : 1) : 0;
    g.blick += ((g.blickBis > 0 ? g.blickZiel : sucht || g.blickGeste) - g.blick) * Math.min(1, dt * 22);
    const zuck = g.zuck > 0 ? Math.sin((ZUCK_DAUER - g.zuck) * 2 * Math.PI * 5.5) * Math.sin((Math.PI * g.zuck) / ZUCK_DAUER) : 0;
    if (bart) { bart.o.quaternion.copy(bart.q).multiply(Q().setFromAxisAngle(v(0, 0, 1), 0.34 * zuck)); bart.o.position.copy(bart.ort).add(v(0, 0.006 * Math.abs(zuck), 0)); }
    if (g.zuck > 0) ziel.winkel = basis.winkel + 0.55 * Math.sin((Math.PI * g.zuck) / ZUCK_DAUER);
    g.ohrRot += ((g.ohren > 0 ? 1 : 0) - g.ohrRot) * Math.min(1, dt * (g.ohren > 0 ? 5 : 1.5));
    for (const o of ohren) o.farbe.copy(o.haut).lerp(OHR_ROT, 0.8 * g.ohrRot);
    gesicht.bewege(dt, ziel, g.mund, g.blick, 1);
    // Der Mixer setzt den Kopfknochen nur neu, wenn sich die Bewegung ändert – darum die Zusatzdrehung vom letzten Bild erst zurücknehmen
    if (g.kopfErgebnis && head.quaternion.equals(g.kopfErgebnis)) head.quaternion.copy(g.kopfBasis);
    g.kopfBasis = head.quaternion.clone();
    const r = g.redet, t = g.uhr * 1000;
    head.rotateX(r * (0.06 * Math.sin(t / 190) + 0.035 * Math.sin(t / 433)) + 0.07 * g.akzent * r);
    head.rotateY(r * 0.09 * Math.sin(t / 610)); head.rotateZ(r * 0.045 * Math.sin(t / 370));
    g.kopfErgebnis = head.quaternion.clone(); g.nick = g.kopfBasis.angleTo(g.kopfErgebnis);
    g.brille += (g.brilleZiel - g.brille) * Math.min(1, dt * 9);
    if (brille) {
      const unten = weich(1 - g.brille, 0, 0.5), weg = weich(1 - g.brille, 0.5, 1);
      brille.o.position.copy(brille.ort).add(v(0, -0.034 * unten, 0.012 * unten)); brille.o.quaternion.copy(brille.q).multiply(Q().setFromAxisAngle(v(1, 0, 0), 0.22 * unten));
      brille.o.scale.setScalar(Math.max(0.001, 1 - weg)); brille.o.visible = weg < 0.98;
    }
    if (g.funkelIn >= 0 && (g.funkelIn -= dt) < 0) { g.funkel = FUNKEL; g.funkelIn = -1; }
    g.funkel = Math.max(0, g.funkel - dt);
    const a = g.funkel > 0 ? Math.sin((1 - g.funkel / FUNKEL) * Math.PI) : 0, durch = g.brille > 0.75;   // durch die Brille: größer, blau, auf den Gläsern
    g.blinkt = a;
    for (const st of sterne) {
      st.position.set(st.userData.seite * 0.0525, 0.172 - (durch ? 0.002 : 0), durch ? 0.172 : 0.152);
      st.material.opacity = a; st.material.color.setHex(durch ? 0x3aa0ff : 0xcfeaff); st.material.rotation = g.funkel * 4; st.scale.setScalar((durch ? 0.03 : 0.018) + (durch ? 0.075 : 0.06) * a);
    }
  };
  const kopfBefehl = (was) => {                          // Ausdruck, Brille oder Effekt
    if (AUSDRUECKE[was]) g.ausdruck = was;
    else if (was === "brille_auf") g.brilleZiel = 1; else if (was === "brille_unten") g.brilleZiel = 0.5; else if (was === "brille_ab") g.brilleZiel = 0;
    else if (was === "funkeln") g.funkelIn = 0;
    else if (was === "seitenblick") { g.blickZiel = g.blickBis > 0 ? -g.blickZiel : -1.15; g.blickBis = BLICK_DAUER; }   // noch einmal gedrückt: zur anderen Seite
    else if (was === "bartzucken") g.zuck = ZUCK_DAUER;
    else if (was === "rote_ohren") g.ohren = OHREN_DAUER;
    else if (was === "protzen") { g.ausdruck = "schelmisch"; g.brilleZiel = 0; g.funkelIn = 0.55; }      // „Brille ab + Funkeln“
    else if (was === "magisch") { g.ausdruck = "geheimnisvoll"; g.brilleZiel = 1; g.funkelIn = 0.25; }   // „Funkeln durch die Brille“
  };
  const nach = (dt) => { strecke(); stramm(dt); posen(); ziele(); hoeheVor(dt); fuesse(dt); gehGang(dt); knieRund(); sohle(); finger(dt); bizeps(); kopfLauf(dt); ketteNach(); m.updateMatrixWorld(true); aufGang(); haendeNach(); };
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
  for (const [knopf, [name, , , , dauer]] of Object.entries(GESTEN)) {
    let clip = clips[name]; if (dauer) { clip = clip.clone(); clip.name = knopf; clip.duration = dauer; }   // im Programm gestellte Geste: ruhiges Stehen mit eigener Dauer
    const a = mixer.clipAction(clip); aktion[knopf] = a;
    if (!DAUERND.includes(knopf)) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
  }
  /* Gehen und Rennen ohne Rutschen (A7, Mr. Alex 18.11.: „er macht einen Schritt und gleitet dann“):
     Mit den langen Beinen läuft der Fuß am Boden ungleichmäßig schnell nach hinten (beim Gehen erst 2,6 m/s, dann 1 m/s), und das alte Tempo
     kam aus den schnellsten Augenblicken. Darum
     1. Tempo = Weg, den ein Fuß am Boden zurücklegt, geteilt durch seine Zeit am Boden – die Schrittlänge passt dann zum Tempo,
     2. der Fuß am Boden wird festgehalten: Solange der Knöchel unten ist, bleibt er an seiner Stelle; Hüfte und Knie stellen sich danach (fuesse),
     3. ist kein Fuß am Boden (Rennen), fliegt die Figur in einem kleinen Bogen, statt über den Boden zu gleiten. */
  const gang = { gehen: { tempo: 1, boden: 0, unten: 0, flug: 0 }, rennen: { tempo: 2, boden: 0, unten: 0, flug: 0 } };
  const stand = { l: { fest: false, x: 0, z: 0, dx: 0, dz: 0, dy: 0 }, r: { fest: false, x: 0, z: 0, dx: 0, dz: 0, dy: 0 } };
  const messeTempo = () => {
    const fuss = K("footl"), p = v();
    for (const art of ["gehen", "rennen"]) {
      const a = aktion[art], dauer = a.getClip().duration, N = 64, y = [], z = [], tiefe = []; let weg = 0, zeit = 0, boden = Infinity, luft = 0, laengste = 0;
      mixer.stopAllAction(); gesetzt.set(NaN, NaN, NaN); a.reset().play();
      for (let i = 0; i < N; i++) { a.time = (dauer * i) / N; mixer.update(0); strecke(); tiefe.push(tief()); anker.worldToLocal(fuss.getWorldPosition(p)); y.push(p.y); z.push(p.z); }
      const hoch = STAND_HOCH * mass * (art === "rennen" ? RENN_STAND : 1);            // Rennen: längerer Bodenkontakt (Mr. Alex 18.11.: „etwas zu hüpfig“), das Tempo bleibt
      const unten = Math.min(...y), am = y.map((h) => h < unten + STAND_HOCH * mass), fest = y.map((h) => h < unten + hoch), einer = (i) => fest[i % N] || fest[(i + N / 2) % N];   // der rechte Fuß macht dasselbe eine halbe Runde später
      for (let i = 0; i < N; i++) { if (am[i] && am[(i + 1) % N]) { weg += z[i] - z[(i + 1) % N]; zeit += dauer / N; } if (einer(i)) boden = Math.min(boden, tiefe[i]); }
      for (let i = 0; i < 2 * N; i++) { luft = einer(i) ? 0 : luft + 1; laengste = Math.max(laengste, luft); }
      gang[art] = { tempo: art === "gehen" && GANG.tempo ? GANG.tempo : zeit > 0 ? Math.max(0.3, weg / zeit) : 1, boden: -boden, unten, hoch, flug: (Math.min(laengste, N / 2) * dauer) / N };
      if (art === "gehen") {                                                           // Maße für den Geh-Ablauf (gehGang)
        const G = gang.gehen, D = GANG.stand, b = beinTeile(), lang = (oberschenkel * b.ober + unterschenkel * b.unter) * mass * GANG.streck, wipp = GANG.wippen * mass;
        let auf = 0; for (let i = 0; i < N; i++) if (!am[(i + N - 1) % N] && am[i]) auf = i;   // hier setzt der linke Fuß in der Bewegung auf: der Ablauf bleibt im Takt mit Armen und Rumpf
        let mitte = 0; for (let i = 0; i < N; i += 8) { a.time = (dauer * i) / N; mixer.update(0); strecke(); for (const s of "lr") mitte += (m.worldToLocal(K("upperleg" + s).getWorldPosition(p)).z * mass) / (2 * N / 8); }
        Object.assign(G, { mitte, stehHoch: fussMass.ha + lang, dauer, phase: auf / N - 0.04, weit: G.tempo * dauer, vorn: 0, spur: Math.abs(m.worldToLocal(K("upperlegl").getWorldPosition(p)).x) * mass * GANG.spur });
        G.vorn = mitte - GANG.hinten * mass + (G.weit * D - stehBahn(0, G).z - (stehBahn(D, G).z + G.weit * D)) / 2;   // der Knöchel schwingt gleich weit vor und hinter die Hüfte
        const e = 0.002, ende = stehBahn(D, G), davor = stehBahn(D - e, G); G.ab = [ende.z - davor.z, ende.y - davor.y, ende.th - davor.th].map((x) => (x / e) * (1 - D));   // Schwung am Ende der Standphase
        G.hoch = Infinity;                                                             // Hüftgelenk so hoch, dass das Bein beim Aufsetzen und Abdrücken fast gestreckt ist
        for (let u = 0; u <= D; u += 0.01) { const f = stehBahn(u, G); G.hoch = Math.min(G.hoch, f.y + Math.sqrt(Math.max(0, lang * lang - (f.z - mitte) ** 2)) + wippe(u) * wipp); }
      }
    }
    mixer.stopAllAction(); gesetzt.set(NaN, NaN, NaN); for (const s of "lr") Object.assign(stand[s], { fest: false, dx: 0, dz: 0, dy: 0 });
  };
  /* Höhe beim Gehen und Rennen (A8, Mr. Alex 18.11.: „kleiner Ruck beim Aufsetzen, die Hüfte hebt und senkt die Figur“):
     Die Hüfte läuft auf einer glatten Bahn (gedämpfte Feder zur Höhe, bei der der tiefste Punkt auf dem Boden läge);
     der Fuß am Boden gleicht den Unterschied aus – Knie und Hüftgelenk geben nach, statt dass die ganze Figur springt. */
  const hoeheVor = (dt) => {
    const G = gang[g.modus]; if (!G) return;
    const t = -tief(), hueftHoch = wo(hips).y;                                                        // beides bei Figur auf Höhe 0
    if (stand.l.fest || stand.r.fest || g.wendet) g.grund = t;
    const soll = Math.max(g.grund + HUEPF * Math.max(0, 4.9 * g.flug * (G.flug - g.flug)), t) + hueftHoch;   // kein Fuß am Boden: flacher Flugbogen
    for (let rest = Math.min(dt, 0.1); rest > 1e-6; rest -= 1 / 120) {
      const h = Math.min(rest, 1 / 120), w = HOEHE_GLATT[g.modus] || 14;
      g.steigt += ((soll - g.hoehe) * w * w - 2 * w * g.steigt) * h; g.hoehe += g.steigt * h;
    }
    g.my = g.hoehe - hueftHoch; g.dy = Math.max(-0.15 * mass, Math.min(0.15 * mass, t - g.my));      // so viel muss der Standfuß ausgleichen
  };
  /* Geh-Ablauf (A9): Die Beine folgen beim Gehen einer eigenen Bahn – Ferse setzt bei fast gestrecktem Knie auf, die Sohle legt sich ab,
     die Ferse hebt sich, Abdruck über den Ballen; in der Luft beugt das Knie, am Ende schwingt der Unterschenkel nach vorn aus.
     Die Bahn ist im Maß der Figur gerechnet und läuft am Boden genau so schnell nach hinten, wie die Figur nach vorn geht: Der Fuß gleitet nicht.
     Arme, Rumpf und Schultern bleiben, wie die Bewegung sie führt. */
  const wippe = (u) => (1 - Math.cos(4 * Math.PI * (u - 0.3))) / 2;                 // 0 mitten im Stand (Hüfte oben), 1 wenn beide Füße am Boden sind
  const stehBahn = (u, G) => {                                                       // Knöchel (vor/hoch) und Winkel der Sohle (+ = Zehen oben), solange der Fuß steht
    const F = fussMass, zc = G.vorn - G.weit * u;                                     // die Ferse liegt fest am Boden
    if (u < GANG.rollt) { const th = GANG.ferse * (1 - weich(u, 0, GANG.rollt)); return { z: zc + F.hb * Math.cos(th) - F.ha * Math.sin(th), y: F.hb * Math.sin(th) + F.ha * Math.cos(th), th }; }
    const k = Math.max(0, (u - GANG.flach) / (GANG.stand - GANG.flach)), th = -GANG.ballen * k * k, dy = F.ha - F.ht;   // danach dreht der Fuß um das Zehengelenk
    return { z: zc + F.hb + F.bf - F.bf * Math.cos(th) - dy * Math.sin(th), y: F.ht - F.bf * Math.sin(th) + dy * Math.cos(th), th };
  };
  const bogen = (a, ma, b, mb, s) => { const s2 = s * s, s3 = s2 * s; return (2 * s3 - 3 * s2 + 1) * a + (s3 - 2 * s2 + s) * ma + (3 * s2 - 2 * s3) * b + (s3 - s2) * mb; };
  const fussBahn = (u, G) => {
    if (u < GANG.stand) return { ...stehBahn(u, G), fest: true, zeh: 0 };
    const s = (u - GANG.stand) / (1 - GANG.stand), a = stehBahn(GANG.stand, G), b = stehBahn(0, G);   // Schwung: vom Abdruck zum nächsten Aufsetzen
    return { z: bogen(a.z, G.ab[0], b.z, -G.weit * (1 - GANG.stand), s), y: bogen(a.y, G.ab[1], b.y, 0, s) + GANG.heben * mass * Math.sin(Math.PI * Math.pow(s, 0.85)) ** 2,
      th: bogen(a.th, G.ab[2], b.th, 0, s), fest: false, zeh: weich(s, 0, 0.3) };
  };
  const quer = v(1, 0, 0);
  const gehGang = (dt) => {
    const G = gang.gehen, an = g.modus === "gehen" && !g.wendet;
    g.geh = Math.min(1, Math.max(0, g.geh + ((an ? 1 : -1) * dt) / GANG.an)); if (g.geh <= 0 || !G.dauer) return;
    const w = weich(g.geh, 0, 1), u0 = aktion.gehen.time / G.dauer - G.phase, qm = m.getWorldQuaternion(Q()), vorn = v(0, 0, 1).applyQuaternion(qm);
    let hoch = 0; for (const s of "lr") hoch += wo(K("upperleg" + s)).y / 2;         // Hüfte: sanftes Auf und Ab, oben mitten im Stand
    /* Marsch auf der Stelle (Mr. Alex 19.11.: im selben Drill wie sein Gang): derselbe Ablauf, aber die Füße bleiben unter der Hüfte und setzen flach auf. */
    g.stelleW += ((g.stelle > 0 ? 1 : an ? 0 : g.stelleW) - g.stelleW) * Math.min(1, dt * 10); const sw = g.stelleW;
    g.my += (G.hoch - wippe(u0) * GANG.wippen * mass + (G.stehHoch - G.hoch) * sw - hoch - g.my) * w; m.position.y = g.my; anker.updateMatrixWorld(true);
    for (const [s, seite] of [["l", 1], ["r", -1]]) {
      const u = (((u0 + (s === "r" ? 0.5 : 0)) % 1) + 1) % 1, f = fussBahn(u, G), F = K("foot" + s), Z = K("toes" + s);
      if (sw > 0) { f.z += (G.mitte - f.z) * sw; f.th *= 1 - sw; }
      zweiGelenke(K("upperleg" + s), K("lowerleg" + s), F, v(anker.position.x + Math.cos(g.dreh) * seite * G.spur + Math.sin(g.dreh) * f.z, f.y, anker.position.z - Math.sin(g.dreh) * seite * G.spur + Math.cos(g.dreh) * f.z), 0, vorn, w);   // in Laufrichtung, auch auf dem Rundkurs
      const lage = (th, ruhe) => qm.clone().multiply(Q().setFromAxisAngle(quer, -th)).multiply(ruhe);
      F.quaternion.slerp(F.parent.getWorldQuaternion(Q()).invert().multiply(lage(f.th, fussRuhe[s])), w); F.updateMatrixWorld(true);
      Z.quaternion.slerp(F.getWorldQuaternion(Q()).invert().multiply(lage(f.th > 0 ? f.th : f.th * f.zeh, zehRuhe[s])), w); Z.updateMatrixWorld(true);   // beim Abdruck bleiben die Zehen flach am Boden
      stand[s].fest = f.fest && w > 0.5;
    }
  };
  const fuesse = (dt) => {
    const G = gang[g.modus], frei = !G || g.wendet || g.modus === "gehen";
    for (const s of "lr") {
      const st = stand[s], F = K("foot" + s), ort = wo(F), q0 = F.getWorldQuaternion(Q());   // ein stehender Fuß bleibt etwas länger fest (Abrollen über die Zehen)
      if (!frei && ort.y < G.unten + G.hoch * (st.fest ? 1.6 : 1) && (!st.fest || Math.hypot(st.x - ort.x, st.z - ort.z) < 0.5 * mass)) {
        if (!st.fest) { st.fest = true; st.x = ort.x + st.dx; st.z = ort.z + st.dz; }                 // der Fuß bleibt an seiner Stelle am Boden, in jeder Laufrichtung (Rundkurs)
        st.dx = st.x - ort.x; st.dz = st.z - ort.z; st.dy += (g.dy - st.dy) * Math.min(1, dt * 30);
      } else { st.fest = false; st.dx *= Math.exp(-dt * 14); st.dz *= Math.exp(-dt * 14); st.dy *= Math.exp(-dt * 14); }   // losgelassen: der Rest klingt weich ab, der Fuß springt nicht
      if (Math.abs(st.dx) + Math.abs(st.dz) + Math.abs(st.dy) < 0.001) continue;
      zweiGelenke(K("upperleg" + s), K("lowerleg" + s), F, v(ort.x + st.dx, ort.y + st.dy, ort.z + st.dz), 0, null, 1);
      F.quaternion.copy(F.parent.getWorldQuaternion(Q()).invert().multiply(q0)); F.updateMatrixWorld(true);   // der Fuß behält seine Richtung
    }
    g.flug = G && !frei && !stand.l.fest && !stand.r.fest ? g.flug + dt : 0;
  };
  const aufGang = () => {
    if (!gang[g.modus]) { aufBoden(); g.hoehe = wo(hips).y; g.steigt = 0; return; }
    m.position.y = g.my; anker.updateMatrixWorld(true);
  };
  const zeigeHand = (form) => { g.hand = Array.isArray(form) ? form : [form, form]; };   // eine Handform für beide oder [rechts, links]; die Finger folgen weich
  const starte = (modus) => {
    /* Der Sergeant rennt nie (Figurenblatt, Mr. Alex 18.11.): „Rennen“ ist bei ihm derselbe Drill, nur rasend schnell – ein steifer Marsch mit hohen Knien.
       Der Geh-Ablauf läuft dafür schneller ab (figur.drill.schnell); die Schritte bleiben gleich lang, der Fuß gleitet nicht. */
    const stelle = modus === "marsch" && !!figur.drill && !!(gang.gehen && gang.gehen.dauer); if (stelle) modus = "gehen";   // Marsch auf der Stelle: bei Figuren mit Drill der eigene Gang ohne Vorwärtsgehen
    g.stelle = stelle ? STELLE_RUNDEN * gang.gehen.dauer : 0;
    const eilig = !!(figur.drill && figur.drill.schnell) && modus === "rennen"; if (eilig) modus = "gehen";
    if (aktion.gehen && (modus === "gehen" || g.eilig)) { g.eilig = eilig; aktion.gehen.timeScale = eilig ? figur.drill.schnell : 1; if (modus === "gehen" && g.laeuft === aktion.gehen) return; }   // schon im Marsch: nur das Tempo wechselt
    const a = aktion[modus]; if (!a) return;
    if (g.laeuft && g.laeuft !== a) g.laeuft.fadeOut(0.18);
    a.reset().setEffectiveWeight(1).fadeIn(0.18).play(); g.laeuft = a; g.modus = modus;
    zeigeHand(GESTEN[modus][3] || g.wahl);              // die Handform wechselt mit der Geste und danach zurück zum Schalter
  };
  mixer.addEventListener("finished", (e) => { if (e.action === g.laeuft) starte("stehen"); });   // nur die laufende Geste führt zurück ins Stehen, keine schon abgelöste
  messeTempo(); starte("stehen"); mixer.update(0); nach(1);

  /* Hält das Bein am Knie sein Volumen? Dicke des Knie-Rings in der Beuge-Ebene, einmal quer zum Oberschenkel und einmal quer zum Unterschenkel
     gemessen, als Anteil der Dicke am gestreckten Bein (1 = voll; nahe 0 = das Bein knickt wie ein Schlauch ab). */
  const knieDick = (s) => dicke(stiefel["ring" + s], K("upperleg" + s), K("lowerleg" + s), K("foot" + s));
  const armRing = {};                                   // die zwei Ringe am Ellbogen: daran wird gemessen, ob der Arm im Knick sein Volumen hält
  for (const [s, seite] of [["l", "Left"], ["r", "Right"]]) {
    let netz = null; m.traverse((o) => { if (o.isSkinnedMesh && o.name.endsWith("Arm" + seite)) netz = o; });
    const P = netz.geometry.attributes.position, punkte = [], oben = []; let von = Infinity, bis = -Infinity;
    for (let i = 0; i < P.count; i++) if (Math.abs(P.getX(i)) > ARM_RING[0] && Math.abs(P.getX(i)) < ARM_RING[1]) { (Math.abs(P.getX(i)) < ARM_MITTE ? oben : punkte).push(i); von = Math.min(von, P.getZ(i)); bis = Math.max(bis, P.getZ(i)); }
    armRing[s] = { netz, punkte, oben, dick: bis - von };
  }
  const dicke = (ring, oben, mitte, unten) => {         // Dicke eines Gelenk-Rings in der Beuge-Ebene, quer zu beiden Röhren gemessen, als Anteil der Dicke am gestreckten Glied
    const a = wo(mitte).sub(wo(oben)).normalize(), b = wo(unten).sub(wo(mitte)).normalize(), c = a.dot(b);
    if (!ring || c > 0.985) return 1;
    const quer = [b.clone().addScaledVector(a, -c).normalize(), a.clone().addScaledVector(b, -c).normalize()], von = [Infinity, Infinity], bis = [-Infinity, -Infinity], p = v();
    [ring.oben, ring.punkte].forEach((liste, k) => {      // der obere Ring schließt das obere Glied ab, der untere beginnt das untere
      for (const i of liste) { const d = ring.netz.getVertexPosition(i, p).applyMatrix4(ring.netz.matrixWorld).dot(quer[k]); von[k] = Math.min(von[k], d); bis[k] = Math.max(bis[k], d); }
    });
    return +(Math.min(bis[0] - von[0], bis[1] - von[1]) / (ring.dick * mass)).toFixed(2);
  };
  const armDick = (s) => dicke(armRing[s], K("upperarm" + s), K("lowerarm" + s), K("wrist" + s));
  const hutNah = () => {                                // gehen Hand oder Finger durch Krempe oder Kappe? (Maße des Hutes, mit der Krempenbreite dieser Figur)
    if (!hut) return 0;
    const b = kleidung.krempe || 1, rand = KREMPE.innen + (KREMPE.aussen - KREMPE.innen) * b; let zahl = 0;
    for (const s of "lr") for (const x of [0, -0.052, -0.12, -0.19]) {
      const p = hut.worldToLocal(halter[s].localToWorld(v(x, 0, 0))), r = Math.hypot(p.x, p.z);
      const f = (r - KREMPE.innen) / (rand - KREMPE.innen);
      if (r < KREMPE.innen ? p.y > KREMPE.oben - 0.03 && p.y < 0.9 : r < rand && Math.abs(p.y - (KREMPE.oben + f * (KREMPE.unten - KREMPE.oben) * (0.4 + 0.6 * b) + krempeBogen(f, kleidung.krempeRund || 0))) < 0.04) zahl++;
    }
    return zahl;
  };
  const armHoch = (s) => ["upperarm", "lowerarm", "wrist"].map((n) => +(wo(K(n + s)).y / mass).toFixed(3));   // Höhe von Schulter, Ellbogen, Handgelenk (Maß des Körpers)
  const knieWinkel = (s) => { const pk = wo(K("lowerleg" + s)); return grad(wo(K("upperleg" + s)).sub(pk).angleTo(wo(K("foot" + s)).sub(pk))); };   // 180 = Bein gestreckt
  const fersenOrt = (s) => { const p = K("foot" + s).localToWorld(fersePunkt[s].clone()); return [+p.y.toFixed(3), +p.z.toFixed(3)]; };   // Auflagepunkt der Ferse: Höhe und Ort längs der Bahn
  const fussOrt = (s) => [wo(K("foot" + s)), wo(K("toes" + s))].map((p) => [+p.y.toFixed(3), +p.z.toFixed(3)]);   // Knöchel und Zehen: Höhe und Ort längs der Bahn
  const hutMass = () => {                               // für das Testprogramm: höchster Punkt des Huts und wie weit er hinter der Achse liegt, Rand der Krempe gegen ihre Mitte, eigene Farbe
    if (!hut) return null;
    const P = hut.geometry.attributes.position, b = kleidung.krempe || 1, rand = KREMPE.innen + (KREMPE.aussen - KREMPE.innen) * b; let spitze = 0, innen = -9, mitte = -9, aussen = -9;
    for (let i = 0; i < P.count; i++) {
      const y = P.getY(i), r = Math.hypot(P.getX(i), P.getZ(i)); if (y > P.getY(spitze)) spitze = i;
      if (y < 0.5 && r > KREMPE.innen) { const f = (r - KREMPE.innen) / (rand - KREMPE.innen); if (f < 0.15) innen = Math.max(innen, y); else if (f > 0.4 && f < 0.6) mitte = Math.max(mitte, y); else if (f > 0.9) aussen = Math.max(aussen, y); }
    }
    return { hoch: +P.getY(spitze).toFixed(2), hinten: +(-P.getZ(spitze)).toFixed(2), bogen: +(mitte - (innen + aussen) / 2).toFixed(3), faellt: +(innen - aussen).toFixed(3), eigeneFarbe: !!hut.geometry.attributes.color, band: kleidung.hutband !== false };
  };
  const imKoerper = (p) => m.worldToLocal(p).toArray().map((x) => +x.toFixed(3));   // Ort in den Maßen des Körpers (x zur linken Seite, y hoch, z nach vorn)
  const flaeche = (s) => halter[s].localToWorld(v(-0.052, 0, 0));                    // Mitte der Handfläche
  return {
    befehl: starte, kopf: kopfBefehl,
    mund(form) { g.mund = form; },                         // [offen, breit] aus der Lippenbewegung, null = schweigt
    rede(r) { g.rede = r ? { ...r, i: 0, offen: false } : null; },   // { einsaetze: [s, …], zeit: () => s } oder null
    bahn(lang) { g.gerade = lang > 0; g.bahn = lang || platz.bahn || 2.4; g.weg = 0; g.hin = 1; g.dreh = 0; anker.position.x = platz.x; },   // lang > 0: gerade Strecke statt Rundkurs;                                                // nur für das Testprogramm: lange Strecke, um Gehen und Rennen ohne Wenden zu messen
    haende(form) { g.wahl = form; zeigeHand(GESTEN[g.modus][3] || form); },
    setze(name, wert) { if (name in bau && wert > 0) { bau[name] = wert; const modus = g.modus; messeTempo(); g.laeuft = null; starte(DAUERND.includes(modus) ? modus : "stehen"); } },
    bewege(dt) {
      if (g.stelle > 0 && (g.stelle = Math.max(1e-4, g.stelle - dt)) <= 1e-4) {   // Marsch auf der Stelle endet, wenn beide Füße am Boden sind
        const G = gang.gehen, u = (((aktion.gehen.time / G.dauer - G.phase) % 0.5) + 0.5) % 0.5; if (u < GANG.stand - 0.5) starte("stehen");
      }
      const unterwegs = (g.modus === "gehen" || g.modus === "rennen") && !(g.stelle > 0), rund = g.runde && !g.gerade;
      if (unterwegs && rund) g.weg += gang[g.modus].tempo * (g.eilig ? figur.drill.schnell : 1) * dt;                         // Rundkurs: immer weiter, ohne Wenden
      else if (unterwegs) {
        g.weg += g.hin * gang[g.modus].tempo * (g.eilig ? figur.drill.schnell : 1) * dt;                                    // auf der Bahn hin und her, am Ende umdrehen (wie Gary)
        if (g.weg > g.bahn) { g.weg = g.bahn; g.hin = -1; }
        if (g.weg < 0) { g.weg = 0; g.hin = 1; }
      }
      if (rund) {
        const p = rundeOrt(g.runde, g.weg), soll = unterwegs ? p.winkel : Math.round(g.dreh / (2 * Math.PI)) * 2 * Math.PI, ab = soll - g.dreh;   // im Stehen zur Tür gewandt
        anker.position.x = p.x; anker.position.z = p.z;
        if (unterwegs && Math.abs(ab) < 0.5) { g.dreh = soll; g.wendet = false; }      // unterwegs folgt die Figur der Bahn genau, auch durch die runden Ecken
        else { g.wendet = Math.abs(ab) > 0.05; g.dreh += ab * Math.min(1, dt * 7); }
      } else {
        const soll = unterwegs && g.hin < 0 ? Math.PI : 0;
        g.wendet = Math.abs(soll - g.dreh) > 0.05;
        g.dreh += (soll - g.dreh) * Math.min(1, dt * 7);
        anker.position.z = platz.z + g.weg;
      }
      m.rotation.y = g.dreh;
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
    zustand: () => ({ modus: g.modus, eilig: !!g.eilig, stelle: g.stelle > 0, blick: +g.blick.toFixed(2), zuck: +g.zuck.toFixed(2), bartDreh: bart ? grad(bart.o.quaternion.angleTo(bart.q)) : null, ohrRot: +g.ohrRot.toFixed(2), ohren: ohren.length, armR: armLage("r"), armL: armLage("l"), sohleR: grad(sohlenHoch("r").angleTo(v(0, 1, 0))), sohleL: grad(sohlenHoch("l").angleTo(v(0, 1, 0))), hand: g.hand, wahl: g.wahl, krall: +krall.r[1].toFixed(2), weg: +g.weg.toFixed(2), bau: { ...bau }, schritt: +hoeher().toFixed(2),
      gehen: +gang.gehen.tempo.toFixed(2), rennen: +gang.rennen.tempo.toFixed(2), standL: stand.l.fest, standR: stand.r.fest, wendet: !!g.wendet, knieAnteil: +beinTeile().anteil.toFixed(3),
      hals: +head.getWorldPosition(v()).y.toFixed(3), tief: +tief().toFixed(3), zehe: +Math.max(K("toesr").getWorldPosition(v()).y, K("toesl").getWorldPosition(v()).y).toFixed(3),
      knie: +K("lowerlegl").getWorldPosition(v()).y.toFixed(3), stiefelOben: +(stiefel.l.getWorldPosition(v()).y + (STIEFEL.kante - 0.293) * mass).toFixed(3),
      faustR: K("wristr").getWorldPosition(v()).toArray().map((x) => +x.toFixed(2)), faustL: K("wristl").getWorldPosition(v()).toArray().map((x) => +x.toFixed(2)),
      flaecheR: imKoerper(flaeche("r")), flaecheL: imKoerper(flaeche("l")), handAbstand: +(flaeche("r").distanceTo(flaeche("l")) / mass).toFixed(3), muskel: muskel.r.visible ? +muskel.r.scale.x.toFixed(3) : 0,
      knieDick: Math.min(knieDick("l"), knieDick("r")), armDick: Math.min(armDick("l"), armDick("r")), hochR: armHoch("r"), hochL: armHoch("l"), huefte: +wo(hips).y.toFixed(4), hut: hutNah(), knieGrad: [knieWinkel("l"), knieWinkel("r")], fussL: fussOrt("l"), fussR: fussOrt("r"), ferseL: fersenOrt("l"), ferseR: fersenOrt("r"), kleidung: kleidungPunkte, hutMass: hutMass(),
      schulterLinie: { hals: +((head.getWorldPosition(v()).y - K("upperarml").getWorldPosition(v()).y) / mass).toFixed(3), breit: +(K("upperarml").getWorldPosition(v()).distanceTo(K("upperarmr").getWorldPosition(v())) / 2 / mass).toFixed(3),
        gequetscht: Math.abs(m.scale.x - m.scale.y) > 1e-6, fuss: +(Math.abs(K("toesl").getWorldPosition(v()).distanceTo(K("footl").getWorldPosition(v()))) / mass).toFixed(3) },   // Testprogramm: Kopf über den Schultergelenken, halbe Schulterbreite, Fußlänge (Maße des Körpers), Figur nicht gequetscht
      beine: (() => {                                     // Testprogramm: Lücke zwischen linkem und rechtem Bein, gemessen an den verformten Netzen in zehn Höhen (m; unter 0 = die Beine greifen ineinander)
        const hl = K("upperlegl").getWorldPosition(v()), hr = K("upperlegr").getWorldPosition(v()), quer = hl.clone().sub(hr).normalize(), mitte = hl.clone().add(hr).multiplyScalar(0.5), hoch = hl.y, p = v();
        const links = Array(10).fill(Infinity), rechts = Array(10).fill(-Infinity);
        m.traverse((o) => {
          const l = /_LegLeft$/.test(o.name); if (!o.isSkinnedMesh || (!l && !/_LegRight$/.test(o.name))) return;
          for (let i = 0; i < o.geometry.attributes.position.count; i++) {
            o.getVertexPosition(i, p); p.applyMatrix4(o.matrixWorld); const n = Math.floor((p.y / hoch) * 10); if (n < 0 || n > 9) continue;
            const c = p.sub(mitte).dot(quer); if (l) links[n] = Math.min(links[n], c); else rechts[n] = Math.max(rechts[n], c);
          }
        });
        const luecken = links.map((x, n) => +(x - rechts[n]).toFixed(3)).filter((x) => Number.isFinite(x));
        return { luecke: Math.min(...luecken), luecken, huefte: +hl.distanceTo(hr).toFixed(3) };
      })(),
      drill: figur.stramm ? { an: +g.drill.toFixed(2), armR: grad(Math.atan2(m.worldToLocal(wo(K("wristr"))).z - m.worldToLocal(wo(K("upperarmr"))).z, m.worldToLocal(wo(K("upperarmr"))).y - m.worldToLocal(wo(K("wristr"))).y)),
        ellbogen: armLage("r").ellbogen, knieHoch: +(Math.max(wo(K("lowerlegl")).y, wo(K("lowerlegr")).y) / wo(K("upperlegl")).y).toFixed(2) } : null,   // Testprogramm: Drill-Gang – Winkel des rechten Arms (0 = hängt, 90 = waagrecht nach vorn), Ellbogen (180 = gestreckt), Höhe des höheren Knies gegenüber dem Hüftgelenk
      ohneKragen: (() => { let k = null; m.traverse((o) => { if (o.userData.kragenWeg) k = o.userData.kragenWeg; }); const haut = kopfTeil && kopfTeil.getObjectByName("lippenhaut"); if (haut && !haut.geometry.boundingBox) haut.geometry.computeBoundingBox();
        return k ? { ...k, hals: !!(kopfTeil && kopfTeil.getObjectByName("hals")), mundHaut: haut ? +(haut.geometry.boundingBox.max.x - haut.geometry.boundingBox.min.x).toFixed(3) : 0 } : null; })(),   // Testprogramm: Kragen gelöscht, Hals am Kopf, Breite der Haut unter der Unterlippe
      kette: kette.glieder.length ? { zahl: kette.glieder.length, kinn: +kette.glieder.reduce((a, b) => (b[2] > a[2] ? b : a))[0].position.y.toFixed(4) } : null,
      kopf: gesicht ? { teile: gesicht.teile, ausdruck: g.ausdruck, winkel: +gesicht.wert.winkel.toFixed(2), unterlid: +gesicht.wert.unterlid.toFixed(2), braue: +gesicht.wert.braueHoch.toFixed(2), mund: +(gesicht.offen || 0).toFixed(2), rund: +gesicht.lippen.rund.toFixed(2), breit: +gesicht.lippen.breit.toFixed(2), nick: +((g.nick * 180) / Math.PI).toFixed(1), redeGesten: g.redeGesten, brille: +g.brille.toFixed(2), brilleDa: !!brille, funkeln: +g.blinkt.toFixed(2), durchBrille: g.brille > 0.75 } : null, zeit: g.laeuft ? +g.laeuft.time.toFixed(3) : 0,
      ort: [+anker.position.x.toFixed(2), +anker.position.z.toFixed(2)], runde: !!(g.runde && !g.gerade), richtung: +g.dreh.toFixed(2) }),
  };
}
