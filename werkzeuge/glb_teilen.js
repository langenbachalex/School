/* Teilt eine glb-Figur (z. B. KayKit Adventurers) in kleine Dateien: Körper ohne Bewegungen, Bewegungen ohne Körper.
   Die Geometrie bleibt Byte für Byte gleich; es fällt nur weg, was nicht gebraucht wird.

   Aufruf:  node werkzeuge/glb_teilen.js        (baut die Dateien aus der Liste AUFTRAEGE unten, unter einer Sekunde)
   Die Originale liegen in werkzeuge/blender/quellen/ (Herkunft und Lizenz: app/tower/figuren/QUELLEN.md). */
const fs = require("fs"), path = require("path");
const REPO = path.join(__dirname, ".."), QUELLEN = path.join(__dirname, "blender", "quellen"), ZIEL = path.join(REPO, "app", "tower", "figuren");

// Bewegungen, die alle Figuren mit KayKit-Körper teilen (Skelett ist bei Mage, Knight, Barbarian, Rogue gleich)
const BEWEGUNGEN = ["Idle", "Walking_A", "Running_A", "Interact", "Cheer", "Hit_A", "Spellcast_Long", "Spellcast_Shoot", "Use_Item", "PickUp", "Throw", "Sit_Chair_Idle"];
const AUFTRAEGE = [
  { quelle: "kaykit_mage.glb", ziel: "kaykit_bewegungen.glb", bewegungen: BEWEGUNGEN, netze: false },
  { quelle: "kaykit_mage.glb", ziel: "koerper_mage.glb", bewegungen: [], ohne: ["Mage_Head", "Mage_Hat", "Spellbook", "Spellbook_open", "2H_Staff"] },
];

function lies(datei) {
  const b = fs.readFileSync(datei), l = b.readUInt32LE(12);
  return { json: JSON.parse(b.subarray(20, 20 + l).toString("utf8")), bin: b.subarray(20 + l + 8, 20 + l + 8 + b.readUInt32LE(20 + l)) };
}

function teile({ json: j, bin }, a) {
  j.animations = (j.animations || []).filter((x) => a.bewegungen.includes(x.name));
  const fehlt = a.bewegungen.filter((n) => !j.animations.some((x) => x.name === n));
  if (fehlt.length) throw new Error(`${a.quelle}: Bewegung fehlt: ${fehlt.join(", ")}`);
  if (!j.animations.length) delete j.animations;
  for (const n of j.nodes) if (n.mesh != null && (a.netze === false || (a.ohne || []).includes(n.name))) { delete n.mesh; delete n.skin; }
  if (a.netze === false) for (const k of ["skins", "materials", "textures", "images", "samplers"]) delete j[k];
  // Netze, Zugriffe und Speicherstücke neu durchzählen: nur behalten, was noch jemand benutzt
  const neu = (alt, benutzt) => { const nr = new Map(); [...benutzt].sort((x, y) => x - y).forEach((i, k) => nr.set(i, k)); return { nr, liste: [...nr.keys()].map((i) => alt[i]) }; };
  const netze = neu(j.meshes || [], new Set(j.nodes.filter((n) => n.mesh != null).map((n) => n.mesh)));
  for (const n of j.nodes) if (n.mesh != null) n.mesh = netze.nr.get(n.mesh);
  j.meshes = netze.liste; if (!j.meshes.length) delete j.meshes;
  const zu = new Set();
  for (const m of j.meshes || []) for (const p of m.primitives) { Object.values(p.attributes).forEach((i) => zu.add(i)); if (p.indices != null) zu.add(p.indices); }
  for (const s of j.skins || []) if (s.inverseBindMatrices != null) zu.add(s.inverseBindMatrices);
  for (const an of j.animations || []) for (const s of an.samplers) { zu.add(s.input); zu.add(s.output); }
  const zugriffe = neu(j.accessors, zu), z = (i) => zugriffe.nr.get(i);
  for (const m of j.meshes || []) for (const p of m.primitives) { for (const k in p.attributes) p.attributes[k] = z(p.attributes[k]); if (p.indices != null) p.indices = z(p.indices); }
  for (const s of j.skins || []) if (s.inverseBindMatrices != null) s.inverseBindMatrices = z(s.inverseBindMatrices);
  for (const an of j.animations || []) for (const s of an.samplers) { s.input = z(s.input); s.output = z(s.output); }
  j.accessors = zugriffe.liste;
  const stuecke = neu(j.bufferViews, new Set([...j.accessors.map((x) => x.bufferView), ...(j.images || []).map((x) => x.bufferView)].filter((i) => i != null)));
  for (const x of [...j.accessors, ...(j.images || [])]) if (x.bufferView != null) x.bufferView = stuecke.nr.get(x.bufferView);
  const teile = []; let laenge = 0;
  for (const v of stuecke.liste) {
    const daten = bin.subarray(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength), fuell = (4 - (daten.length % 4)) % 4;
    v.byteOffset = laenge; teile.push(daten, Buffer.alloc(fuell)); laenge += daten.length + fuell;
  }
  j.bufferViews = stuecke.liste; j.buffers = [{ byteLength: laenge }];
  let text = Buffer.from(JSON.stringify(j), "utf8");
  text = Buffer.concat([text, Buffer.alloc((4 - (text.length % 4)) % 4, 0x20)]);
  const kopf = Buffer.alloc(12), k1 = Buffer.alloc(8), k2 = Buffer.alloc(8);
  kopf.writeUInt32LE(0x46546c67, 0); kopf.writeUInt32LE(2, 4); kopf.writeUInt32LE(28 + text.length + laenge, 8);
  k1.writeUInt32LE(text.length, 0); k1.writeUInt32LE(0x4e4f534a, 4); k2.writeUInt32LE(laenge, 0); k2.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([kopf, k1, text, k2, ...teile]);
}

for (const a of AUFTRAEGE) {
  const aus = teile(lies(path.join(QUELLEN, a.quelle)), a);
  fs.writeFileSync(path.join(ZIEL, a.ziel), aus);
  console.log(`${a.ziel}: ${Math.round(aus.length / 1000)} KB`);
}
