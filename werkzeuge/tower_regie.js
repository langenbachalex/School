// Keys of the Tower – Ausdruckswechsel im Satz aus der Regie-Spalte (Teil E, Mr. Alex 19.11.2026).
// Liest die Texttabellen in inhalte/abenteuer/ und schreibt app/tower/figuren/regie.json:
//   { "<Aufnahme>": [[Anteil des gesprochenen Textes 0…1, Ausdruck], …] }
// Die Regie-Spalte enthält Angaben in eckigen Klammern mitten im Satz, z. B. „[commanding] Detective! … [curt] Good. [stern] Now find my keys.“
// Jede Angabe, die zu einem Gesichtsausdruck passt, wird zu einem Wechsel an dieser Stelle. „grund“ = Grundausdruck der Figur,
// „verlegen“ = Grundausdruck und rote Ohren. Angaben ohne Entsprechung (Tempo, Akzent, Pausen) ändern nichts.
// Aufruf: node werkzeuge/tower_regie.js
const fs = require("fs"), path = require("path");
const HIER = path.join(__dirname, ".."), ZIEL = path.join(HIER, "app", "tower", "figuren", "regie.json");
const AUSDRUCK = {
  grimmig: ["stern", "commanding", "firm", "gruff", "furious", "outraged", "threatening", "indignant", "shouting", "grumbling", "curt", "stiff", "serious", "lecturing", "offended", "defensive", "scandalised", "unimpressed", "disappointed"],
  stolz: ["proud", "prouder", "smug", "showing off", "boasting", "confident", "grand", "important", "triumphant", "pleased with himself", "very pleased with himself", "self-absorbed", "satisfied", "dignified"],
  froehlich: ["friendly", "warm", "cheerful", "happy", "pleased", "content", "smiling", "bright", "hopeful", "relaxed", "reassuring", "impressed"],
  lachen: ["delighted", "thrilled", "excited", "genuinely excited", "amused"],
  schelmisch: ["teasing", "mocking", "innocent", "cool", "showman", "gossiping"],
  geheimnisvoll: ["mysterious", "whispers", "whispering", "hushed", "solemn", "wise", "dramatic", "suspicious", "storytelling", "detective voice"],
  erschrocken: ["panicking", "scared", "startled", "nervous", "breathless"],
  ueberrascht: ["surprised", "amazed", "puzzled", "confused", "curious", "doubtful", "unsure"],
  verlegen: ["embarrassed", "sheepish", "shy"],
  grund: ["calm", "flat", "matter-of-fact", "honest", "dry", "deadpan", "casual"],
};
const RANG = ["erschrocken", "verlegen", "ueberrascht", "lachen", "geheimnisvoll", "stolz", "schelmisch", "froehlich", "grimmig", "grund"];
const ZU = {}; for (const [a, liste] of Object.entries(AUSDRUCK)) for (const w of liste) ZU[w] = a;
const wechselAus = (regie) => {
  const teile = [...regie.matchAll(/\[([^\]]*)\]|([^\[]+)/g)], zahl = (t) => t.replace(/[^A-Za-z]/g, "").length;
  const gesamt = teile.reduce((n, t) => n + (t[2] ? zahl(t[2]) : 0), 0); if (!gesamt) return [];
  const aus = []; let bisher = 0;
  for (const t of teile) {
    if (t[2]) { bisher += zahl(t[2]); continue; }
    const alle = t[1].split(",").map((w) => ZU[w.trim().toLowerCase()]).filter(Boolean), a = RANG.find((x) => alle.includes(x));   // mehrere Angaben in einer Klammer: der auffälligere Ausdruck gewinnt
    if (a && (!aus.length || aus[aus.length - 1][1] !== a)) aus.push([+(bisher / gesamt).toFixed(3), a]);
  }
  return aus;
};
const lies = (datei) => { const z = fs.readFileSync(path.join(HIER, "inhalte", "abenteuer", datei), "utf8").split(/\r?\n/).filter(Boolean).map((x) => x.split("\t")), kopf = z[0]; return z.slice(1).map((x) => Object.fromEntries(kopf.map((k, i) => [k, x[i] || ""]))); };
const erg = {};
for (const [datei, vor] of [["tower_sprueche.tsv", ""], ["tower_kapitel1.tsv", "k1_"], ["tower_hof_den.tsv", "k1_"]])
  for (const z of lies(datei)) { const w = wechselAus(z.regie || ""); if (w.length) erg[vor + z.id] = w; }
fs.writeFileSync(ZIEL, JSON.stringify(erg));
const mehr = Object.values(erg).filter((w) => w.length > 1).length;
console.log(`regie.json: ${Object.keys(erg).length} Aufnahmen mit Ausdruck, davon ${mehr} mit Wechsel im Satz`);
