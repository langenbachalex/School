// Erzeugt pro Buchabschnitt eine PowerPoint mit einer Folie pro Vokabel (für den Import in Kahoot).
// Aufruf: node werkzeuge/kahoot_pptx.js  ->  export/kahoot-pptx/*.pptx
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");

const BASIS = path.join(__dirname, "..");
const ZIEL = path.join(BASIS, "export", "kahoot-pptx");
const BLAU = "1F5FD1", GELB = "FFD23F", DUNKEL = "17213A", GRAU = "56627A", HELL = "F3F6FB";

const zeilen = fs.readFileSync(path.join(BASIS, "inhalte", "vokabeln.tsv"), "utf8").trim().split("\n");
const kopf = zeilen.shift().split("\t");
const vok = zeilen.map((z) => Object.fromEntries(z.split("\t").map((w, i) => [kopf[i], w])));
const abschnitte = [];
for (const v of vok) {
  if (!abschnitte.length || abschnitte.at(-1).name !== v.abschnitt) abschnitte.push({ name: v.abschnitt, woerter: [] });
  abschnitte.at(-1).woerter.push(v);
}

(async () => {
  fs.mkdirSync(ZIEL, { recursive: true });
  for (const [i, a] of abschnitte.entries()) {
    const titel = a.name.startsWith("Unit 3") ? "Start (My day)" : a.name;
    const pres = new pptxgen();
    pres.layout = "LAYOUT_16x9";
    pres.title = `Unit 3 – ${titel}`;
    pres.author = "Mr. Alex";
    pres.theme = { headFontFace: "Arial", bodyFontFace: "Arial" };

    const t = pres.addSlide();
    t.background = { color: BLAU };
    t.addText("Unit 3 · Vocabulary", { x: 0.6, y: 1.3, w: 8.8, h: 0.6, fontSize: 20, color: GELB, bold: true, isTextBox: true, margin: 0 });
    t.addText(titel, { x: 0.6, y: 1.9, w: 8.8, h: 1.2, fontSize: 44, color: "FFFFFF", bold: true, isTextBox: true, margin: 0 });
    t.addText(`${a.woerter.length} Wörter · Auffrischen mit Mr. Alex`, { x: 0.6, y: 3.2, w: 8.8, h: 0.5, fontSize: 16, color: "FFFFFF", isTextBox: true, margin: 0 });

    a.woerter.forEach((v, n) => {
      const s = pres.addSlide();
      s.background = { color: "FFFFFF" };
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.35, w: 2.6, h: 2.6, fill: { color: HELL }, line: { color: HELL }, rectRadius: 0.3 });
      s.addText(v.symbol, { x: 0.6, y: 1.35, w: 2.6, h: 2.6, fontSize: 80, align: "center", valign: "middle", isTextBox: true, margin: 0 });
      s.addText(v.englisch, { x: 3.6, y: 1.45, w: 5.9, h: 1.3, fontSize: v.englisch.length > 22 ? 32 : 44, bold: true, color: DUNKEL, valign: "bottom", isTextBox: true, margin: 0 });
      s.addText(v.deutsch, { x: 3.6, y: 2.85, w: 5.9, h: 1.1, fontSize: v.deutsch.length > 40 ? 20 : 26, color: GRAU, valign: "top", isTextBox: true, margin: 0 });
      s.addText(`${titel} · ${n + 1}/${a.woerter.length}`, { x: 0.6, y: 4.9, w: 8.8, h: 0.35, fontSize: 11, color: GRAU, isTextBox: true, margin: 0 });
      s.addNotes(`${v.englisch} = ${v.deutsch}`);
    });
    const datei = path.join(ZIEL, `${String(i + 1).padStart(2, "0")} Unit3 ${titel}.pptx`);
    await pres.writeFile({ fileName: datei });
    console.log(path.basename(datei), a.woerter.length, "Wörter");
  }
})();
