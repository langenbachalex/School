// Probe 17.11.2026: macht aus figuren_probe_gezeichnet.html ein Bild (frames/figuren_gezeichnet.png).
// Aufruf: node werkzeuge/blender/figuren_probe.js   (braucht Playwright wie das Testprogramm)
const path = require("path");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const seite = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await seite.goto("file:///" + path.join(__dirname, "figuren_probe_gezeichnet.html").replace(/\\/g, "/"));
  await seite.waitForFunction(() => document.title === "fertig", null, { timeout: 15000 });
  await seite.screenshot({ path: path.join(__dirname, "frames", "figuren_gezeichnet.jpg"), type: "jpeg", quality: 88 });
  await seite.screenshot({ path: path.join(__dirname, "frames", "figuren_gezeichnet_ausschnitt.jpg"), type: "jpeg", quality: 90, clip: { x: 1152, y: 216, width: 768, height: 810 } });
  await browser.close();
  console.log("Probe fertig: frames/figuren_gezeichnet.jpg");
})().catch((e) => { console.error(e); process.exit(1); });
