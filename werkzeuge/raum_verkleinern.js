/* Raumdatei für den Browser verkleinern (Entscheidung Mr. Alex 18.11.2026, Variante B):
   Bilder höchstens 2048 × 2048 und als WebP, Formen mit Meshopt komprimiert. Das eingebrannte Licht wird nicht neu gerechnet,
   nur die fertigen Bilder werden kleiner – das Licht kann sich dadurch nicht verschieben.

   Aufruf:  node werkzeuge/raum_verkleinern.js            (etwa eine halbe Minute)
   Quelle:  werkzeuge/blender/quellen/guardroom_roh.glb   (schreibt werkzeuge/blender/tower_gltf.py)
   Ziel:    app/tower/raum3d/guardroom.glb                (die Seite braucht dafür lib/meshopt_decoder.module.js)
   Braucht: npm install -g @gltf-transform/cli            (MIT; nur auf dem Baurechner, nicht in der App) */
const fs = require("fs"), path = require("path"), os = require("os"), { execFileSync } = require("child_process");
const REPO = path.join(__dirname, "..");
const ALLE = [{ name: "guardroom", quelle: "werkzeuge/blender/quellen/guardroom_roh.glb", ziel: "app/tower/raum3d/guardroom.glb", px: 2048 },
  { name: "hof", quelle: "werkzeuge/blender/quellen/hof_roh.glb", ziel: "app/tower/raum3d/hof.glb", px: 4096 },            // Hof: erst gut bauen (Mr. Alex 21.11.), verkleinert wird nach der Messung auf dem Schul-Laptop
  { name: "hof_klein", quelle: "werkzeuge/blender/quellen/hof_roh_klein.glb", ziel: "app/tower/raum3d/hof.glb", px: 4096 }];   // schneller Probelauf (GLTF_KLEIN=1)
const RAEUME = ALLE.filter((r) => r.name === (process.argv[2] || "guardroom"));   // Aufruf: node werkzeuge/raum_verkleinern.js [guardroom|hof]
const WEBP_GUETE = 88;

function lauf(...teile) { execFileSync("gltf-transform", teile, { stdio: ["ignore", "ignore", "inherit"], shell: process.platform === "win32" }); }

function bericht(datei) {                                  // Größe, Dreiecke und geschätzter Grafikspeicher der Bilder (4 Byte je Bildpunkt, ein Drittel mehr für die Verkleinerungsstufen)
  const b = fs.readFileSync(datei), l = b.readUInt32LE(12), j = JSON.parse(b.subarray(20, 20 + l)), bin = b.subarray(20 + l + 8);
  let speicher = 0, groesste = 0;
  for (const im of j.images || []) {
    const v = j.bufferViews[im.bufferView], d = bin.subarray(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength);
    let w = 0, h = 0;
    if (im.mimeType === "image/jpeg") { for (let p = 2; p < d.length;) { const m = d[p + 1], n = d.readUInt16BE(p + 2); if (m >= 0xc0 && m <= 0xc3) { h = d.readUInt16BE(p + 5); w = d.readUInt16BE(p + 7); break; } p += 2 + n; } }
    else if (im.mimeType === "image/webp") { const art = d.toString("latin1", 12, 16); if (art === "VP8X") { w = 1 + d.readUIntLE(24, 3); h = 1 + d.readUIntLE(27, 3); } else if (art === "VP8 ") { w = d.readUInt16LE(26) & 0x3fff; h = d.readUInt16LE(28) & 0x3fff; } else { const x = d.readUInt32LE(21); w = 1 + (x & 0x3fff); h = 1 + ((x >> 14) & 0x3fff); } }
    speicher += w * h * 4 * 1.33; groesste = Math.max(groesste, w, h);
  }
  return `${(b.length / 1e6).toFixed(1)} MB · ${(j.images || []).length} Bilder (größtes ${groesste} px) · Grafikspeicher der Bilder etwa ${Math.round(speicher / 1048576)} MB`;
}

for (const r of RAEUME) {
  const quelle = path.join(REPO, r.quelle), ziel = path.join(REPO, r.ziel), tmp = fs.mkdtempSync(path.join(os.tmpdir(), "raum-"));
  const a = path.join(tmp, "a.glb"), b = path.join(tmp, "b.glb");
  console.log(`vorher:  ${bericht(quelle)}`);
  lauf("resize", quelle, a, "--width", r.px, "--height", r.px);
  lauf("webp", a, b, "--quality", WEBP_GUETE);
  lauf("meshopt", b, ziel, "--level", "medium", "--quantize-color", 16);   // Farbe am Eckpunkt (Licht im Laub) fein genug für die dunkle Nacht
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`nachher: ${bericht(ziel)}`);
}
