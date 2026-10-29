/* Road Trip Run – Runner-Modul für Klasse 9 (aus docs/runner/prototyp/index.html herausgelöst, Konzept docs/runner/konzept-entwurf.md).
   Kein eigenes Menü: Start, Skins, Coins und Ende kommen aus der App (app.js „Games: Road Trip Run“).
   Schnittstelle: window.Runner.start({ wrapper, woerter:[{en,de}], skin, texte, stimme:{ wort(i), boss(text) }, onEnde(ergebnis) })
   → zeichnet ein Canvas (plus Boss-Frage als Overlay) in wrapper; ergebnis = { geschafft, diamanten, max, toreRichtig, leben, dauer }.
   window.Runner.stopp() beendet Schleife, Eingabe und Audio. Alle Klänge aus Web Audio (keine Dateien); Wörter spricht die App (stimme.wort).
   Test-Haken wie im Prototyp: window.__runner (stand, springe, teleport, teleportBoss, antwort …). */
(function () {
  "use strict";

  /* ---------- Skins: Gruppen (Reiter in der App), Werte, Namen (G/E) und was ohne Kauf frei ist (frei = erste n Werte) ---------- */
  const SKIN_GRUPPEN = [
    { id: "haare", symbol: "💇", titel: ["Haare", "Hair"], optionen: [
      { key: "haar", label: ["Frisur", "Hairstyle"], werte: ["kurz", "lang", "zopf", "locken", "afro"], namen: { kurz: ["kurz", "short"], lang: ["lang", "long"], zopf: ["Zopf", "ponytail"], locken: ["Locken", "curly"], afro: ["Afro", "afro"] } },
      { key: "haarfarbe", label: ["Haarfarbe", "Hair colour"], werte: ["braun", "blond", "schwarz", "rot"], namen: { braun: ["braun", "brown"], blond: ["blond", "blond"], schwarz: ["schwarz", "black"], rot: ["rot", "red"] } },
      { key: "haarschmuck", label: ["Haarschmuck", "Hair accessory"], werte: ["keiner", "schleife", "haarband"], namen: { keiner: ["keiner", "none"], schleife: ["Schleife", "bow"], haarband: ["Haarband", "headband"] } },
    ] },
    { id: "hut", symbol: "🧢", titel: ["Hut", "Hat"], optionen: [
      { key: "hut", label: ["Kopfbedeckung", "Headwear"], werte: ["keiner", "cap", "cowboy", "zylinder"], namen: { keiner: ["keine", "none"], cap: ["Cap", "cap"], cowboy: ["Cowboyhut", "cowboy hat"], zylinder: ["Zylinder", "top hat"] } },
    ] },
    { id: "gesicht", symbol: "😎", titel: ["Gesicht", "Face"], optionen: [
      { key: "brille", label: ["Sonnenbrille", "Sunglasses"], werte: ["aus", "an"], namen: { aus: ["aus", "off"], an: ["an", "on"] } },
      { key: "bart", label: ["Schnurrbart", "Moustache"], werte: ["aus", "an"], namen: { aus: ["aus", "off"], an: ["an", "on"] } },
      { key: "nase", label: ["Nase", "Nose"], werte: ["rund", "spitz", "knubbel"], namen: { rund: ["rund", "round"], spitz: ["spitz", "pointy"], knubbel: ["Knubbel", "button"] } },
    ] },
    { id: "oberteil", symbol: "👕", titel: ["Oberteil", "Top"], optionen: [
      { key: "top", label: ["Oberteil", "Top"], werte: ["shirt", "hoodie"], namen: { shirt: ["T-Shirt", "T-shirt"], hoodie: ["Hoodie", "hoodie"] } },
      { key: "topfarbe", label: ["Farbe", "Colour"], werte: ["rot", "blau", "gelb", "grün"], namen: { rot: ["rot", "red"], blau: ["blau", "blue"], gelb: ["gelb", "yellow"], "grün": ["grün", "green"] } },
    ] },
    { id: "schuhe", symbol: "👟", titel: ["Schuhe", "Shoes"], optionen: [
      { key: "schuhe", label: ["Schuhe", "Shoes"], werte: ["weiß", "rot", "schwarz"], namen: { "weiß": ["weiß", "white"], rot: ["rot", "red"], schwarz: ["schwarz", "black"] } },
    ] },
    { id: "schmuck", symbol: "💍", titel: ["Schmuck", "Jewelry"], optionen: [
      { key: "schmuck", label: ["Schmuck", "Jewelry"], werte: ["keiner", "ohrring", "kette", "beides"], namen: { keiner: ["keiner", "none"], ohrring: ["Ohrring", "earring"], kette: ["Kette", "necklace"], beides: ["beides", "both"] } },
    ] },
    { id: "koerper", symbol: "💪", titel: ["Körper", "Body"], optionen: [
      { key: "bauch", label: ["Bauch", "Belly"], werte: ["schmal", "normal", "kräftig"], namen: { schmal: ["schmal", "slim"], normal: ["normal", "normal"], "kräftig": ["kräftig", "big"] } },
      { key: "brust", label: ["Brust/Schultern", "Chest/shoulders"], werte: ["schmal", "normal", "kräftig"], namen: { schmal: ["schmal", "narrow"], normal: ["normal", "normal"], "kräftig": ["breit", "broad"] } },
      { key: "muskeln", label: ["Muskeln", "Muscles"], werte: ["schmal", "normal", "kräftig"], frei: 3, namen: { schmal: ["dünn", "thin"], normal: ["normal", "normal"], "kräftig": ["stark", "strong"] } },
      { key: "power", label: ["Power-Körper nach Punkten", "Power body by points"], werte: ["aus", "an"], namen: { aus: ["aus", "off"], an: ["an", "on"] } },
    ] },
    { id: "aura", symbol: "✨", titel: ["Aura", "Aura"], optionen: [
      { key: "aura", label: ["Superkraft-Aura", "Super aura"], werte: ["aus", "an"], namen: { aus: ["aus", "off"], an: ["an", "on"] } },
    ] },
  ];
  const SKIN_OPTIONEN = SKIN_GRUPPEN.flatMap((g) => g.optionen);
  const SKIN_STANDARD = {
    haar: "kurz", haarfarbe: "braun", haarschmuck: "keiner", hut: "cap", brille: "aus", nase: "rund", bart: "aus", schmuck: "keiner",
    top: "shirt", topfarbe: "rot", schuhe: "weiß", aura: "aus", bauch: "normal", brust: "normal", muskeln: "normal", power: "an",
  };
  const STUFE = { schmal: 0, normal: 1, "kräftig": 2 };
  const FARBEN = { braun: "#6b3e1e", blond: "#e7c35a", schwarz: "#1a1a1a", rot: "#c8283a", blau: "#1d3f8f", gelb: "#e0a400", "grün": "#2e9e5b", "weiß": "#f4f4f4" };
  // frei ohne Kauf: die ersten n Werte einer Option (Standard 2); alles andere ist ein Shop-Artikel skin_<key>_<wert> (30 Coins)
  const skinFrei = (key, wert) => { const o = SKIN_OPTIONEN.find((x) => x.key === key); return !o || o.werte.indexOf(wert) < (o.frei || 2); };
  const skinArtikel = (key, wert) => `skin_${key}_${wert}`;
  // Power-Körper: Punkte-Titel-Stufe (0–5) → Muskeln + kleine Aura; s.muskelnManuell überschreibt die Muskeln von Hand. Liefert die wirksame Kopie.
  function powerAnwenden(s, stufe) {
    const w = Object.assign({}, SKIN_STANDARD, s);
    const st = Math.max(0, Math.min(5, Number(stufe) || 0));
    if (w.power === "an") {
      w.muskeln = w.muskelnManuell || (st <= 0 ? "schmal" : st <= 2 ? "normal" : "kräftig");
      w.powerAura = st >= 4 ? (st - 3) / 2 : 0;
    } else w.powerAura = 0;
    return w;
  }
  // Skin-Stimme: gesprochene Wendung je Auswahl (Liste docs/runner/skin-stimme.txt; bis zur Vertonung Geräte-Stimme oder stumm)
  const SPRECH = {
    haar: { kurz: "Short hair", lang: "Long hair", zopf: "Ponytail", locken: "Curly", afro: "Afro" },
    haarfarbe: { braun: "Brown hair", blond: "Blond hair", schwarz: "Black hair", rot: "Red hair" },
    haarschmuck: { keiner: "No hair accessory", schleife: "Bow", haarband: "Headband" },
    hut: { keiner: "No hat", cap: "Cap", cowboy: "Cowboy hat", zylinder: "Top hat" },
    brille: { aus: "Sunglasses off", an: "Sunglasses on" },
    nase: { rund: "Round nose", spitz: "Pointy nose", knubbel: "Button nose" },
    bart: { aus: "Moustache off", an: "Moustache on" },
    schmuck: { keiner: "No jewelry", ohrring: "Earring", kette: "Necklace", beides: "Earring and necklace" },
    schuhe: { "weiß": "White shoes", rot: "Red shoes", schwarz: "Black shoes" },
    aura: { aus: "Aura off", an: "Super aura on" },
    bauch: { schmal: "Slim belly", normal: "Normal belly", "kräftig": "Big belly" },
    brust: { schmal: "Narrow shoulders", normal: "Normal shoulders", "kräftig": "Broad shoulders" },
    muskeln: { schmal: "Thin arms", normal: "Normal arms", "kräftig": "Strong arms" },
    power: { aus: "Power body off", an: "Power body on" },
  };
  const FARBE_EN = { rot: "Red", blau: "Blue", gelb: "Yellow", "grün": "Green" };
  const TOP_EN = { shirt: "T-shirt", hoodie: "hoodie" };
  function sprechText(s, key, wert) {
    if (key === "top" || key === "topfarbe") return `${FARBE_EN[s.topfarbe] || "Red"} ${TOP_EN[s.top] || "T-shirt"}`;
    return (SPRECH[key] || {})[wert] || String(wert);
  }
  function sprechListe() {
    const l = [];
    for (const k in SPRECH) for (const w in SPRECH[k]) l.push(SPRECH[k][w]);
    for (const f in FARBE_EN) for (const t in TOP_EN) l.push(`${FARBE_EN[f]} ${TOP_EN[t]}`);
    for (let i = 0; i <= 5; i++) l.push(`Power level ${i}`);
    return l;
  }
  const kurzDe = (de) => String(de || "").split(/[,;]/)[0].replace(/\(.*?\)/g, "").trim();

  // Texte, die die App (G/E) überschreiben kann
  const TEXTE = {
    quer: "Tipp: Handy quer halten 📱↔",
    tor: (de) => `Welcher Diamant heißt „${de}“?`,
    richtigWaere: " – richtig wäre: ",
    sequenz: "Zwischensequenz …",
    boss: "Boss! Beantworte die Frage.",
    tuer: "The door is open – go!",
    bossTitel: "Mr. Alligator fragt …",
    bossHinweis: "Richtig = die Tür geht auf. Falsch = ein Leben weg.",
    frage: (de) => `„Was heißt ‚${de}‘ auf Englisch?“`,
  };

  /* ---------- Canvas / Skalierung (im Wrapper der App, nicht im Fenster) ---------- */
  const H = 400;                 // logische Höhe
  const BODEN_Y = 330;           // Oberkante Boden
  let wrapper = null, canvas = null, ctx = null;
  let dpr = 1, cssW = 0, cssH = 0, bereich = { x: 0, y: 0, w: 0, h: 0 }, skala = 1, viewW = 640;
  function groesseAnpassen() {
    if (!wrapper || !canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cssW = wrapper.clientWidth || window.innerWidth; cssH = wrapper.clientHeight || window.innerHeight;
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + "px"; canvas.style.height = cssH + "px";
    if (cssW / cssH < 1.2) {            // Hochformat: 16:10-Fenster, Rest dunkel + Hinweis
      const h = Math.round(cssW / 1.6);
      bereich = { x: 0, y: Math.round((cssH - h) / 2), w: cssW, h };
    } else {
      bereich = { x: 0, y: 0, w: cssW, h: cssH };
    }
    skala = bereich.h / H;
    viewW = bereich.w / skala;
  }

  /* ---------- Audio (Web Audio, keine Dateien) ---------- */
  let actx = null;
  function audioAn() { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* ohne Klang */ } } if (actx && actx.state === "suspended") actx.resume(); }
  function audioAus() { if (actx) { try { actx.close(); } catch (e) { /* egal */ } actx = null; } }
  function ton(freq, dauer, typ = "square", lautst = 0.08, start = 0) {
    if (!actx) return;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = typ; o.frequency.value = freq;
    const t0 = actx.currentTime + start;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(lautst, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dauer);
    o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0 + dauer + 0.02);
  }
  const klang = {
    sprung() { ton(300, 0.12, "square", 0.05); ton(520, 0.1, "square", 0.04, 0.05); },
    diamant() { ton(880, 0.1, "triangle", 0.1); ton(1320, 0.14, "triangle", 0.1, 0.08); ton(1760, 0.2, "triangle", 0.08, 0.16); },
    wort() { [523, 659, 784, 1047].forEach((f, i) => ton(f, 0.18, "triangle", 0.1, i * 0.09)); },
    richtig() { [659, 784, 988, 1319].forEach((f, i) => ton(f, 0.2, "triangle", 0.1, i * 0.1)); },
    falsch() { ton(180, 0.3, "sawtooth", 0.08); ton(140, 0.35, "sawtooth", 0.08, 0.15); },
    aua() { ton(220, 0.15, "square", 0.08); ton(160, 0.25, "square", 0.08, 0.12); },
    stampf() { ton(200, 0.08, "square", 0.08); ton(120, 0.1, "square", 0.06, 0.06); },
    fanfare() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => ton(f, 0.25, "triangle", 0.1, i * 0.14)); },
    tuer() { ton(110, 0.6, "sawtooth", 0.05); ton(220, 0.5, "triangle", 0.05, 0.3); },
    checkpoint() { [784, 1047].forEach((f, i) => ton(f, 0.16, "triangle", 0.09, i * 0.12)); },
    klick() { ton(900, 0.05, "square", 0.04); },
    grollen() { ton(70, 0.9, "sawtooth", 0.09); ton(55, 1.1, "sawtooth", 0.07, 0.2); ton(95, 0.4, "square", 0.04, 0.6); },
    dramatik() { [196, 185, 175].forEach((f, i) => ton(f, 0.5, "triangle", 0.09, i * 0.35)); },
  };

  /* ---------- Figur (Ebenen; aus dem Prototyp) ---------- */
  // (x, y) = Fußpunkt Mitte, h = Körperhöhe, pose = 'lauf' | 'sprung' | 'steh', t = Zeit; s.bauch/brust/muskeln = schmal|normal|kräftig, s.powerAura 0..1
  function zeichneFigur(c, x, y, h, s, pose, t) {
    const u = h / 80;
    c.save(); c.translate(x, y); c.scale(u, u);
    const haut = '#f1c27d', hautD = '#d9a866';
    const topF = FARBEN[s.topfarbe] || '#c8283a';
    const haarF = FARBEN[s.haarfarbe] || '#6b3e1e';
    const schuhF = FARBEN[s.schuhe] || '#f4f4f4';
    const shortsF = '#2a4a8a';
    const p = pose === 'lauf' ? t * 13 : 0;
    const st = v => typeof v === 'number' ? Math.max(0, Math.min(2, v)) : (STUFE[v] ?? 1);
    const bauch = st(s.bauch), brust = st(s.brust), musk = st(s.muskeln);
    const sw = [10, 12, 15][brust];          // Schulter-Halbbreite
    const hw = [10, 12, 14][bauch];          // Hüft-Halbbreite
    const armB = [5, 6.5, 9][musk];          // Arm-Dicke
    const beinB = [6.5, 8, 10.5][musk];      // Bein-Dicke
    const schulterR = [5, 6, 8][brust];
    const powerAura = Math.max(0, Math.min(1, Number(s.powerAura) || 0));

    // Aura (hinter allem)
    if (s.aura === 'an') {
      const puls = 1 + 0.08 * Math.sin(t * 6);
      const g = c.createRadialGradient(0, -42, 10, 0, -42, 56 * puls);
      g.addColorStop(0, 'rgba(255,230,80,0.55)'); g.addColorStop(0.6, 'rgba(255,200,40,0.25)'); g.addColorStop(1, 'rgba(255,200,40,0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, -42, 56 * puls, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff3a0';
      for (let i = 0; i < 5; i++) {
        const a = t * 2 + i * 1.26, r = 46 + 6 * Math.sin(t * 5 + i);
        const sx = Math.cos(a) * r, sy = -42 + Math.sin(a) * r * 0.9;
        c.beginPath(); c.moveTo(sx, sy - 4); c.lineTo(sx + 1.5, sy); c.lineTo(sx, sy + 4); c.lineTo(sx - 1.5, sy); c.closePath(); c.fill();
      }
    }
    // Power-Aura (klein, orange, um Schultern/Arme)
    if (powerAura > 0) {
      const r = 24 + 10 * powerAura + 2 * Math.sin(t * 8);
      const g = c.createRadialGradient(0, -52, 6, 0, -52, r);
      g.addColorStop(0, `rgba(255,120,30,${0.45 * powerAura})`); g.addColorStop(1, 'rgba(255,120,30,0)');
      c.fillStyle = g; c.beginPath(); c.ellipse(0, -52, r * 1.25, r, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffb347';
      const n = 2 + Math.round(powerAura * 3);
      for (let i = 0; i < n; i++) {
        const a = t * 3 + i * (Math.PI * 2 / n), rr = 20 + 4 * powerAura;
        c.beginPath(); c.arc(Math.cos(a) * rr * 1.3, -52 + Math.sin(a) * rr, 1.6, 0, Math.PI * 2); c.fill();
      }
    }

    // Beine
    let beinHinten, beinVorn;
    if (pose === 'lauf') {
      beinHinten = { fx: 12 * Math.sin(p), fy: -Math.max(0, -Math.cos(p)) * 9 };
      beinVorn   = { fx: 12 * Math.sin(p + Math.PI), fy: -Math.max(0, Math.cos(p)) * 9 };
    } else if (pose === 'sprung') {
      beinHinten = { fx: -8, fy: -14 }; beinVorn = { fx: 9, fy: -8 };
    } else {
      beinHinten = { fx: -4, fy: 0 }; beinVorn = { fx: 5, fy: 0 };
    }
    const bein = (b, farbe, schuh) => {
      c.lineCap = 'round'; c.lineWidth = beinB; c.strokeStyle = farbe;
      c.beginPath(); c.moveTo(0, -34);
      c.quadraticCurveTo(b.fx * 0.5 + 6, -20 + b.fy * 0.5, b.fx, b.fy - 3); c.stroke();
      if (musk === 2) { c.lineWidth = beinB + 3; c.beginPath(); c.moveTo(0, -34); c.quadraticCurveTo(b.fx * 0.25 + 3, -27 + b.fy * 0.25, b.fx * 0.4 + 4, -22 + b.fy * 0.4); c.stroke(); } // Oberschenkel kräftiger
      // Schuh
      c.fillStyle = schuh; c.strokeStyle = '#333'; c.lineWidth = 1.2;
      c.beginPath(); c.ellipse(b.fx + 3, b.fy - 1.5, 8, 4.2, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    };
    bein(beinHinten, hautD, schuhF);
    // Shorts (über den Hüften)
    c.fillStyle = shortsF; c.beginPath(); c.roundRect(-hw, -40, hw * 2, 16, 5); c.fill();
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-hw, -30, hw * 2, 2);
    bein(beinVorn, haut, schuhF);

    // Arme
    const armWinkel = pose === 'lauf' ? Math.sin(p) * 0.9 : (pose === 'sprung' ? -2.2 : 0.3);
    const arm = (w, farbe) => {
      c.lineCap = 'round'; c.lineWidth = armB; c.strokeStyle = farbe;
      const ex = Math.sin(w) * 10, ey = -54 + Math.cos(w) * 11;
      c.beginPath(); c.moveTo(0, -54); c.lineTo(ex, ey);
      c.lineTo(ex + Math.cos(w) * 10, ey - Math.sin(w) * 10 + 6); c.stroke();
      if (musk === 2) { c.lineWidth = armB + 3; c.beginPath(); c.moveTo(0, -54); c.lineTo(ex * 0.6, -54 + (ey + 54) * 0.6); c.stroke(); } // Oberarm/Bizeps kräftiger
    };
    arm(-armWinkel, hautD);

    // Torso / Oberteil (Schultern sw, Hüfte hw)
    const torso = () => {
      c.beginPath(); c.moveTo(-sw, -60); c.lineTo(sw, -60);
      c.quadraticCurveTo(sw + (bauch === 2 ? 4 : 0), -46, hw, -32); c.lineTo(-hw, -32);
      c.quadraticCurveTo(-sw - (bauch === 2 ? 1 : 0), -46, -sw, -60); c.closePath();
    };
    c.fillStyle = topF; torso(); c.fill();
    if (bauch === 2) { c.beginPath(); c.ellipse(hw - 4, -40, 9, 8.5, 0, 0, Math.PI * 2); c.fill(); }   // Bauch
    if (s.top === 'hoodie') {
      c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.roundRect(-hw + 1, -48, hw * 2 - 2, 10, 3); c.fill(); // Tasche
      c.fillStyle = topF; c.beginPath(); c.ellipse(0, -60, sw + 2, 7, 0, Math.PI, 0); c.fill(); // Kapuze
      c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-3, -58); c.lineTo(-4, -46); c.moveTo(3, -58); c.lineTo(4, -46); c.stroke(); // Kordeln
    } else {
      c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.arc(3, -47, 5, 0, Math.PI * 2); c.fill(); // Logo
      c.fillStyle = topF; c.beginPath(); c.arc(3, -47, 2.5, 0, Math.PI * 2); c.fill();
    }
    // Kette (am Hals, vor dem Oberteil)
    if (s.schmuck === 'kette' || s.schmuck === 'beides') {
      c.strokeStyle = '#e0a400'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(-7, -59); c.quadraticCurveTo(0, -50, 8, -58); c.stroke();
      c.fillStyle = '#e0a400'; c.beginPath(); c.arc(1, -53, 3, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff6c0'; c.beginPath(); c.arc(0, -54, 1.1, 0, Math.PI * 2); c.fill();
    }
    // Ärmel vorn (Schulterkappe)
    c.fillStyle = topF; c.beginPath(); c.arc(0, -54, schulterR, 0, Math.PI * 2); c.fill();
    // Vorderer Arm
    arm(armWinkel, haut);

    // Afro (hinterer Teil vor dem Kopf zeichnen, damit das Gesicht frei bleibt)
    if (s.haar === 'afro') {
      c.fillStyle = haarF; c.beginPath(); c.arc(-2, -72, 19, 0, Math.PI * 2); c.fill();
      for (let i = 0; i < 9; i++) { const a = Math.PI * 0.9 + i * (Math.PI * 1.1 / 8); c.beginPath(); c.arc(-2 + Math.cos(a) * 17, -72 + Math.sin(a) * 17, 6, 0, Math.PI * 2); c.fill(); }
    }
    // Lange Haare (hinten, hinter dem Kopf)
    if (s.haar === 'lang') {
      const wipp = pose === 'lauf' ? Math.sin(t * 13) * 2.5 : 0;
      c.fillStyle = haarF; c.beginPath(); c.moveTo(-6, -78); c.quadraticCurveTo(-18, -70 + wipp, -15, -46 + wipp);
      c.quadraticCurveTo(-8, -44 + wipp, -2, -50); c.lineTo(4, -58); c.closePath(); c.fill();
    }
    // Kopf
    c.fillStyle = haut; c.beginPath(); c.arc(0, -68, 12.5, 0, Math.PI * 2); c.fill();
    // Ohr
    c.fillStyle = hautD; c.beginPath(); c.arc(-9, -68, 3, 0, Math.PI * 2); c.fill();
    // Ohrring
    if (s.schmuck === 'ohrring' || s.schmuck === 'beides') {
      c.strokeStyle = '#e0a400'; c.lineWidth = 1.8; c.beginPath(); c.arc(-9.5, -62.5, 3.2, 0, Math.PI * 2); c.stroke();
    }
    // Nase (3 Formen)
    c.fillStyle = hautD;
    if (s.nase === 'spitz') { c.beginPath(); c.moveTo(11, -70); c.lineTo(17.5, -65); c.lineTo(11, -63); c.closePath(); c.fill(); }
    else if (s.nase === 'knubbel') { c.beginPath(); c.arc(12.8, -65.5, 3.6, 0, Math.PI * 2); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(12, -66.5, 1.2, 0, Math.PI * 2); c.fill(); }
    else { c.beginPath(); c.arc(12, -66, 2.6, 0, Math.PI * 2); c.fill(); }
    // Mund
    c.strokeStyle = '#8a3b2b'; c.lineWidth = 1.4; c.beginPath(); c.arc(6, -62, 3.5, 0.2, Math.PI - 0.4); c.stroke();
    // Auge
    if (s.brille === 'an') {
      c.fillStyle = '#18213a'; c.beginPath(); c.roundRect(2, -73, 12, 7, 3); c.fill();
      c.strokeStyle = '#18213a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(2, -70); c.lineTo(-9, -71); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(4, -72, 4, 2);
    } else {
      c.fillStyle = '#fff'; c.beginPath(); c.arc(7, -70, 3.4, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#18213a'; c.beginPath(); c.arc(8, -70, 1.8, 0, Math.PI * 2); c.fill();
    }
    // Schnurrbart
    if (s.bart === 'an') {
      c.fillStyle = haarF; c.beginPath(); c.moveTo(12, -63.5); c.quadraticCurveTo(7, -67, 3, -62); c.quadraticCurveTo(8, -62, 12, -63.5); c.fill();
    }
    // Haare (oben)
    c.fillStyle = haarF;
    if (s.haar === 'kurz') {
      c.beginPath(); c.arc(0, -70, 12.8, Math.PI * 1.05, Math.PI * 1.95); c.lineTo(10, -74); c.lineTo(-5, -70); c.closePath(); c.fill();
    } else if (s.haar === 'lang') {
      c.beginPath(); c.arc(0, -70, 12.8, Math.PI * 1.0, Math.PI * 1.97); c.lineTo(11, -73); c.lineTo(-8, -66); c.closePath(); c.fill();
    } else if (s.haar === 'zopf') {
      c.beginPath(); c.arc(0, -70, 12.8, Math.PI * 1.02, Math.PI * 1.98); c.lineTo(11, -73); c.lineTo(-6, -69); c.closePath(); c.fill();
      const wipp = pose === 'lauf' ? Math.sin(t * 13) * 3 : 0;
      c.lineCap = 'round'; c.lineWidth = 6; c.strokeStyle = haarF;
      c.beginPath(); c.moveTo(-11, -72); c.quadraticCurveTo(-22, -70 + wipp, -20, -56 + wipp); c.stroke();
      c.fillStyle = '#c8283a'; c.beginPath(); c.arc(-12, -72, 2.6, 0, Math.PI * 2); c.fill(); // Haargummi
    } else if (s.haar === 'locken') {
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * 1.0 + i * (Math.PI / 6.5);
        c.beginPath(); c.arc(Math.cos(a) * 11, -70 + Math.sin(a) * 11, 5, 0, Math.PI * 2); c.fill();
      }
    } else if (s.haar === 'afro') {
      for (let i = 0; i < 5; i++) { const a = Math.PI * 1.15 + i * 0.3; c.beginPath(); c.arc(-2 + Math.cos(a) * 16, -72 + Math.sin(a) * 16, 6.5, 0, Math.PI * 2); c.fill(); }
    }
    // Haarschmuck
    const hutOben = s.haar === 'afro' ? -14 : 0;
    if (s.haarschmuck === 'schleife') {
      c.fillStyle = '#e8467c';
      c.beginPath(); c.moveTo(-6, -80 + hutOben); c.lineTo(-14, -86 + hutOben); c.lineTo(-13, -75 + hutOben); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(-6, -80 + hutOben); c.lineTo(1, -87 + hutOben); c.lineTo(3, -77 + hutOben); c.closePath(); c.fill();
      c.fillStyle = '#b2224f'; c.beginPath(); c.arc(-6, -80 + hutOben, 2.4, 0, Math.PI * 2); c.fill();
    } else if (s.haarschmuck === 'haarband') {
      c.strokeStyle = '#e8467c'; c.lineWidth = 3.2; c.lineCap = 'butt';
      const r = s.haar === 'afro' ? 19.5 : 13;
      c.beginPath(); c.arc(s.haar === 'afro' ? -2 : 0, -70 - (s.haar === 'afro' ? 2 : 0), r, Math.PI * 1.1, Math.PI * 1.85); c.stroke();
    }
    // Hüte
    if (s.hut === 'cap') {
      c.save(); c.translate(0, hutOben);
      c.fillStyle = '#1d3f8f'; c.beginPath(); c.arc(0, -75, 12, Math.PI, 0); c.closePath(); c.fill();
      c.beginPath(); c.roundRect(2, -77, 20, 4, 2); c.fill();
      c.fillStyle = '#e0a400'; c.beginPath(); c.arc(0, -84, 2.2, 0, Math.PI * 2); c.fill();
      c.restore();
    } else if (s.hut === 'cowboy') {
      c.save(); c.translate(0, hutOben);
      c.fillStyle = '#8a5a2b';
      c.beginPath(); c.ellipse(0, -77, 20, 4.5, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.roundRect(-9, -92, 18, 16, 4); c.fill();
      c.fillStyle = '#5a3a18'; c.fillRect(-9, -80, 18, 3);
      c.restore();
    } else if (s.hut === 'zylinder') {
      c.save(); c.translate(0, hutOben);
      c.fillStyle = '#18213a';
      c.beginPath(); c.ellipse(0, -77, 16, 3.5, 0, 0, Math.PI * 2); c.fill();
      c.fillRect(-9, -98, 18, 22);
      c.fillStyle = '#c8283a'; c.fillRect(-9, -80, 18, 3);
      c.restore();
    }
    c.restore();
  }

  /* ---------- Level (aus Abschnitts-Mustern; ≈ 28.000 Einheiten, ≥ 2 Minuten) ---------- */
  const KISTE = 40;
  function levelBauen() {
    const L = { boden:[], plattformen:[], kisten:[], gegner:[], diamanten:[], tore:[], checkpoints:[] };
    let x = 0, bodenAb = 0, wort = 0;
    const plat = (dx, y, w) => L.plattformen.push({ x:x + dx, y, w });
    const kiste = (dx, n = 1) => { for (let i = 0; i < n; i++) L.kisten.push({ x:x + dx, y:BODEN_Y - KISTE * (i + 1) }); };
    const dia = (dx, y = 298) => L.diamanten.push({ x:x + dx, y, wort:wort++ });
    const geg = (art, von, bis) => L.gegner.push({ art, x:x + (von + bis) / 2, y: art === 'taube' ? 262 : BODEN_Y, von:x + von, bis:x + bis, richtung:-1 });
    const luecke = (dx, w) => { L.boden.push([bodenAb, x + dx]); bodenAb = x + dx + w; };
    const tor = (dx, wort, falsch) => L.tore.push({ x:x + dx, wort, falsch });
    const cp = dx => L.checkpoints.push({ x:x + dx });
    const abschnitte = [
      () => { dia(350); kiste(650); x += 900; },                                             // 1 Aufwärmen
      () => { plat(150, 235, 160); dia(230, 195); geg('taube', 500, 720); x += 950; },       // 2 Plattform + Taube
      () => { kiste(200); kiste(240, 2); dia(260, 215); x += 750; },                          // 3 Kistenstufe
      () => { luecke(250, 170); x += 950; },                                                  // 4 erste Lücke
      () => { geg('waschbaer', 150, 450); plat(650, 240, 150); dia(725, 200); x += 1000; },   // 5 Waschbär + Plattform
      () => { kiste(150); kiste(190, 2); kiste(230, 3); dia(250, 180); x += 800; },           // 6 Treppe hoch (elevator)
      () => { geg('eichhoernchen', 200, 600); x += 800; },                                    // 7 Eichhörnchen
      () => { luecke(200, 200); plat(150, 230, 300); dia(300, 190); x += 900; },              // 8 Plattform über Lücke
      () => { geg('taube', 200, 400); kiste(600); x += 850; },                                // 9
      () => { plat(100, 245, 140); plat(380, 185, 140); dia(450, 145); x += 950; },           // 10 Doppelplattform
      () => { tor(400, 4, [5, 1]); x += 900; },                                               // 11 TOR 1: Aufzug → elevator
      () => { cp(150); geg('waschbaer', 450, 750); x += 1000; },                              // 12 CHECKPOINT 1
      () => { luecke(250, 160); luecke(660, 160); x += 1150; },                               // 13 Doppellücke
      () => { kiste(200, 2); kiste(240, 2); geg('eichhoernchen', 450, 800); x += 1000; },     // 14 Kistenmauer
      () => { plat(150, 240, 160); plat(400, 180, 160); plat(650, 240, 160); dia(480, 140); x += 1050; }, // 15 Dreier-Plattform
      () => { geg('taube', 150, 350); luecke(500, 180); x += 1100; },                         // 16
      () => { kiste(150); kiste(190); kiste(230); geg('waschbaer', 500, 800); x += 1000; },   // 17 Kistenreihe
      () => { plat(200, 235, 200); dia(300, 195); kiste(650); x += 950; },                    // 18
      () => { geg('eichhoernchen', 150, 500); luecke(650, 170); x += 1050; },                 // 19
      () => { dia(200); plat(450, 240, 140); plat(700, 175, 140); dia(770, 135); x += 1050; },// 20 (debate, contract)
      () => { tor(350, 10, [7, 9]); x += 850; },                                              // 21 TOR 2: Vertrag → contract
      () => { cp(150); kiste(500); kiste(540, 2); x += 850; },                                // 22 CHECKPOINT 2
      () => { geg('waschbaer', 100, 400); geg('taube', 550, 750); x += 1000; },               // 23 Gegner-Paar
      () => { luecke(200, 190); plat(150, 230, 320); dia(310, 190); geg('eichhoernchen', 650, 950); x += 1150; }, // 24
      () => { kiste(150); kiste(190, 2); kiste(230, 3); kiste(270, 2); kiste(310); x += 750; }, // 25 Pyramide
      () => { geg('taube', 150, 350); luecke(500, 160); geg('waschbaer', 800, 1050); x += 1200; }, // 26
      () => { plat(150, 240, 150); plat(400, 180, 150); plat(650, 240, 150); geg('eichhoernchen', 850, 1100); x += 1250; }, // 27
      () => { luecke(200, 170); kiste(600); kiste(640); x += 950; },                          // 28
    ];
    for (const a of abschnitte) a();
    L.sequenzX = x + 250;             // hier übernimmt das Spiel (≈ 600 vor dem Boss)
    L.stopX = L.sequenzX + 430;       // hier bleibt die Figur stehen
    L.bossX = L.stopX + 170;
    L.tuerX = L.bossX + 130;
    L.ende = L.tuerX + 400;
    L.boden.push([bodenAb, L.ende]);
    return L;
  }
  const level = levelBauen();

  /* ---------- Spielzustand (ein Spiel zu einer Zeit) ---------- */
  let opt = null, woerter = [], skin = Object.assign({}, SKIN_STANDARD), stimme = { wort() {}, boss() {} }, texte = TEXTE;
  let laeuft = false, rafId = 0, startZeit = 0, endeGemeldet = false;
  let zustand = "aus";   // aus | spiel | sequenz | boss | finale | fertig | gameover
  let spieler, diamanten, gegner, tore, checkpoints, leben, gesammelt, kamera, zeit, popup, meldung, checkpoint, boss, tuer, tot, bossFrage, torErgebnisse;
  let sequenz = null, zoom = 1, banner = null, bossSpruch = null;
  let halten = false, haltZeit = 0, sprungGedrueckt = false;
  const SPEED = 230, GRAV = 1600, GRAV_HALT = 800, SPRUNG_V = -480, HALT_MAX = 0.32;
  const PW = 30, PH = 78;  // Trefferbox
  const SEQUENZ = { zoom: 1.5, stand: 1.0, banner: 2.4, boss: 1.3, zurueck: 0.8 };
  const SEQUENZ_MIN = Object.values(SEQUENZ).reduce((a, b) => a + b, 0);
  const BANNER_TEXT = "It's time for Mr. Alligator!";
  const BOSS_RICHTIG = "Correct – the door opens!", BOSS_FALSCH = "Not this time!";

  function torBauen(w) {
    const optionen = [ { wort:w.wort, richtig:true }, { wort:w.falsch[0], richtig:false }, { wort:w.falsch[1], richtig:false } ];
    optionen.sort(() => Math.random() - 0.5);
    return { x:w.x, wort:w.wort, de:kurzDe(woerter[w.wort].de), erledigt:false, steine:optionen.map((o, i) => ({ ...o, y:[305, 220, 130][i] })) };
  }
  function neuesSpiel() {
    spieler = { x:120, y:BODEN_Y, vy:0, amBoden:true, unverwundbar:0, pose:'lauf' };
    diamanten = level.diamanten.map(d => ({ ...d, weg:false, funkel:Math.random() * 6 }));
    gegner = level.gegner.map(g => ({ ...g, tot:0, flug:Math.random() * 6 }));
    tore = level.tore.map(torBauen);
    checkpoints = level.checkpoints.map(c => ({ ...c, erreicht:false }));
    torErgebnisse = tore.map(() => null);
    leben = 3; gesammelt = 0; kamera = 0; zeit = 0; popup = null; meldung = null; tot = 0;
    checkpoint = 120; boss = { maul:0, weg:0, sichtbar:0, deckel:0 }; tuer = { offen:0 }; bossFrage = null;
    sequenz = null; zoom = 1; banner = null; bossSpruch = null;
  }

  /* ---------- Eingabe ---------- */
  function sprungStart() {
    audioAn();
    if (zustand !== 'spiel') return;          // in der Sequenz und beim Boss ist die Eingabe gesperrt
    if (spieler.amBoden && tot <= 0) {
      spieler.vy = SPRUNG_V; spieler.amBoden = false; halten = true; haltZeit = 0; klang.sprung();
    }
  }
  function sprungEnde() { halten = false; }

  const aufPointerDown = (e) => { e.preventDefault(); sprungStart(); };
  const aufPointerUp = () => sprungEnde();
  const aufKeyDown = (e) => {
    if (e.target && e.target.closest && e.target.closest("textarea, input, dialog[open]")) return;
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") { e.preventDefault(); if (!sprungGedrueckt) { sprungGedrueckt = true; sprungStart(); } }
    if (zustand === "boss" && bossFrage && ["Digit1", "Digit2", "Digit3"].includes(e.code)) antwortGeben(Number(e.code.slice(-1)) - 1);
  };
  const aufKeyUp = (e) => { if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") { sprungGedrueckt = false; sprungEnde(); } };
  const aufResize = () => groesseAnpassen();


  /* ---------- Logik ---------- */
  function ueberlappt(ax, ay, aw, ah, bx, by, bw, bh) { return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by; }

  function solideOben() {  // alle Flächen, auf denen man landen kann: {x, y(top), w, voll}
    const liste = [];
    for (const [a, b] of level.boden) liste.push({ x:a, y:BODEN_Y, w:b - a, h:H - BODEN_Y, voll:false });
    for (const p of level.plattformen) liste.push({ x:p.x, y:p.y, w:p.w, h:14, voll:false });
    for (const k of level.kisten) liste.push({ x:k.x, y:k.y, w:KISTE, h:KISTE, voll:true });
    return liste;
  }


  function schaden(grund) {
    if (spieler.unverwundbar > 0 || tot > 0) return;
    leben--; klang.aua();
    if (leben <= 0) { zustand = 'gameover'; zeigeEnde(false); return; }
    tot = 0.9; meldung = { text: grund === 'wasser' ? 'Splash! 💦' : 'Ouch!', zeit: 1.2 };
  }
  function wiederbeleben() {
    spieler.x = checkpoint; spieler.y = BODEN_Y; spieler.vy = 0; spieler.amBoden = true; spieler.unverwundbar = 1.6;
    halten = false;
  }
  function gegnerBewegen(dt) {
    for (const g of gegner) {
      g.flug += dt;
      if (g.tot > 0) { g.tot += dt; continue; }
      g.x += g.richtung * (g.art === 'taube' ? 70 : (g.art === 'eichhoernchen' ? 95 : 55)) * dt;
      if (g.x < g.von) g.richtung = 1; if (g.x > g.bis) g.richtung = -1;
    }
  }
  function gegnerBox(g) {
    if (g.art === 'taube') return { x: g.x - 16, y: g.y - 14 + Math.sin(g.flug * 3) * 8, w: 32, h: 26 };
    if (g.art === 'eichhoernchen') { const hop = Math.abs(Math.sin(g.flug * 6)) * 14; return { x: g.x - 15, y: g.y - 24 - hop, w: 30, h: 24 }; }
    return { x: g.x - 20, y: g.y - 26, w: 40, h: 26 };
  }
  const SOLIDE = solideOben();

  function update(dt) {
    const eingefroren = zustand === 'sequenz' && sequenz.phase === 'stand';
    if (!eingefroren) zeit += dt;
    if (popup) { popup.zeit -= dt; if (popup.zeit <= 0) popup = null; }
    if (meldung) { meldung.zeit -= dt; if (meldung.zeit <= 0) meldung = null; }
    if (bossSpruch) { bossSpruch.zeit -= dt; if (bossSpruch.zeit <= 0) bossSpruch = null; }
    if (!eingefroren) { gegnerBewegen(dt); for (const d of diamanten) d.funkel += dt; }

    if (zustand === 'spiel') {
      if (tot > 0) { tot -= dt; if (tot <= 0) wiederbeleben(); return; }
      if (spieler.unverwundbar > 0) spieler.unverwundbar -= dt;

      // Horizontal
      let nx = spieler.x + SPEED * dt;
      const oben = spieler.y - PH;
      for (const s of SOLIDE) {
        if (!s.voll) continue;
        if (ueberlappt(nx - PW / 2, oben, PW, PH - 2, s.x, s.y, s.w, s.h) && spieler.y > s.y + 4) {
          nx = Math.min(nx, s.x - PW / 2);
        }
      }
      spieler.x = nx;

      // Vertikal
      if (!spieler.amBoden) {
        const g = (halten && spieler.vy < 0 && haltZeit < HALT_MAX) ? GRAV_HALT : GRAV;
        if (halten) haltZeit += dt;
        spieler.vy += g * dt;
      }
      const altY = spieler.y;
      spieler.y += spieler.vy * dt;
      let gelandet = false;
      if (spieler.vy >= 0) {
        for (const s of SOLIDE) {
          if (spieler.x + PW / 2 > s.x && spieler.x - PW / 2 < s.x + s.w && altY <= s.y + 0.01 && spieler.y >= s.y) {
            spieler.y = s.y; spieler.vy = 0; gelandet = true;
          }
        }
      } else {
        for (const s of SOLIDE) {
          if (!s.voll) continue;
          if (spieler.x + PW / 2 > s.x + 3 && spieler.x - PW / 2 < s.x + s.w - 3 && altY - PH >= s.y + s.h - 0.01 && spieler.y - PH < s.y + s.h) {
            spieler.y = s.y + s.h + PH; spieler.vy = 0;
          }
        }
      }
      spieler.amBoden = gelandet;
      if (spieler.amBoden && spieler.vy === 0) {
        let hatBoden = false;
        for (const s of SOLIDE) if (spieler.x + PW / 2 > s.x && spieler.x - PW / 2 < s.x + s.w && Math.abs(spieler.y - s.y) < 0.5) hatBoden = true;
        if (!hatBoden) spieler.amBoden = false;
      }
      spieler.pose = spieler.amBoden ? 'lauf' : 'sprung';
      if (spieler.y > H + 20) { schaden('wasser'); return; }

      // Checkpoints (Fahnen)
      for (const cp of checkpoints) {
        if (!cp.erreicht && spieler.x >= cp.x) {
          cp.erreicht = true; checkpoint = cp.x; klang.checkpoint();
          meldung = { text:'Checkpoint! 🚩', zeit:1.4 };
        }
      }

      // Diamanten
      const box = { x: spieler.x - PW / 2, y: spieler.y - PH, w: PW, h: PH };
      for (const d of diamanten) {
        if (d.weg) continue;
        if (ueberlappt(box.x, box.y, box.w, box.h, d.x - 14, d.y - 16, 28, 32)) {
          d.weg = true; gesammelt++; klang.wort();
          const w = woerter[d.wort];
          popup = { en: w.en, de: w.de, zeit: 1.8, art:'wort' };
          stimme.wort(d.wort);
        }
      }
      // Frage-Tore
      tore.forEach((tor, ti) => {
        if (tor.erledigt) return;
        for (const s of tor.steine) {
          if (ueberlappt(box.x, box.y, box.w, box.h, tor.x - 16, s.y - 18, 32, 36)) {
            tor.erledigt = true; torErgebnisse[ti] = s.richtig;
            const w = woerter[s.wort];
            if (s.richtig) { klang.richtig(); popup = { en: w.en + ' ✓', de: tor.de, zeit: 2, art:'richtig' }; gesammelt++; }
            else { klang.falsch(); popup = { en: w.en + ' ✗', de: kurzDe(w.de) + texte.richtigWaere + woerter[tor.wort].en, zeit: 2.4, art:'falsch' }; }
            stimme.wort(tor.wort);
            break;
          }
        }
      });
      // Gegner
      for (const g of gegner) {
        if (g.tot > 0) continue;
        const gb = gegnerBox(g);
        if (ueberlappt(box.x + 4, box.y + 6, box.w - 8, box.h - 6, gb.x, gb.y, gb.w, gb.h)) {
          if (spieler.vy > 0 && altY <= gb.y + 14) { g.tot = 0.01; spieler.vy = -320; spieler.amBoden = false; klang.stampf(); }
          else schaden('gegner');
        }
      }
      // Boss-Sequenz beginnt
      if (spieler.x >= level.sequenzX && spieler.amBoden) {
        zustand = 'sequenz'; sequenz = { phase:'zoom', t:0 }; halten = false; spieler.unverwundbar = 0;
        klang.dramatik();
      }
    } else if (zustand === 'sequenz') {
      sequenz.t += dt;
      const ph = sequenz.phase;
      if (ph === 'zoom') {
        zoom = 1 + 0.4 * Math.min(1, sequenz.t / SEQUENZ.zoom);
        if (spieler.x < level.stopX) { spieler.x = Math.min(level.stopX, spieler.x + SPEED * dt); spieler.pose = 'lauf'; }
        else spieler.pose = 'steh';
        if (spieler.x >= level.stopX && sequenz.t >= SEQUENZ.zoom) { sequenz = { phase:'stand', t:0 }; spieler.pose = 'steh'; }
      } else if (ph === 'stand') {
        if (sequenz.t >= SEQUENZ.stand) { sequenz = { phase:'banner', t:0 }; banner = { text:BANNER_TEXT, zeit:SEQUENZ.banner }; stimme.boss(BANNER_TEXT); }
      } else if (ph === 'banner') {
        banner.zeit -= dt;
        if (sequenz.t >= SEQUENZ.banner) { sequenz = { phase:'boss', t:0 }; banner = null; klang.grollen(); }
      } else if (ph === 'boss') {
        const f = Math.min(1, sequenz.t / SEQUENZ.boss);
        boss.sichtbar = 1 - Math.pow(1 - f, 3);
        boss.deckel = Math.min(1, sequenz.t / 0.6);
        boss.maul = f < 0.7 ? 0 : (f - 0.7) / 0.3;
        if (sequenz.t >= SEQUENZ.boss) { sequenz = { phase:'zurueck', t:0 }; }
      } else if (ph === 'zurueck') {
        zoom = 1.4 - 0.4 * Math.min(1, sequenz.t / SEQUENZ.zurueck);
        if (sequenz.t >= SEQUENZ.zurueck) { zoom = 1; sequenz = null; zustand = 'boss'; bossFragen(); }
      }
    } else if (zustand === 'boss') {
      boss.maul = 0.5 + 0.5 * Math.sin(zeit * 4);
    } else if (zustand === 'finale') {
      tuer.offen = Math.min(1, tuer.offen + dt * 1.2);
      boss.weg = Math.min(1, boss.weg + dt * 0.8);
      boss.maul = 0;
      if (tuer.offen > 0.6) {
        spieler.pose = 'lauf';
        spieler.x += SPEED * 0.8 * dt;
        if (spieler.x > level.tuerX + 10) { zustand = 'fertig'; klang.fanfare(); zeigeEnde(true); }
      }
    }
    const ziel = Math.max(0, Math.min(spieler.x - viewW * (viewW < 450 ? 0.28 : 0.33), level.ende - viewW));
    kamera += (ziel - kamera) * Math.min(1, dt * 10);
  }

  /* ---------- Boss-Frage (Overlay im Wrapper; Antworten antippen oder Tasten 1–3) ---------- */
  let frageBox = null, frageText = null, antworten = null, spruchEl = null, frageZaehler = 0;
  const el = (tag, klasse, text) => { const e = document.createElement(tag); if (klasse) e.className = klasse; if (text != null) e.textContent = text; return e; };
  function frageBauen() {
    frageBox = el("div", "runner-frage"); frageBox.hidden = true;
    const box = el("div", "runner-frage-box");
    box.append(el("h2", null, "🐊 " + texte.bossTitel), el("p", "klein", texte.bossHinweis));
    spruchEl = el("p", "spruch"); frageText = el("p", "frage-text"); antworten = el("div", "antworten");
    box.append(spruchEl, frageText, antworten); frageBox.append(box);
    return frageBox;
  }
  function bossFragen() {
    const torWoerter = level.tore.map((t) => t.wort);
    const pool = woerter.map((w, i) => i).filter((i) => !torWoerter.includes(i));
    const richtig = pool[(frageZaehler * 3 + 1) % pool.length]; frageZaehler++;
    const andere = pool.filter((i) => i !== richtig).sort(() => Math.random() - 0.5).slice(0, 2);
    const o = [richtig, ...andere].sort(() => Math.random() - 0.5);
    bossFrage = { richtig, opt: o };
    frageText.textContent = texte.frage(kurzDe(woerter[richtig].de));
    antworten.replaceChildren(...o.map((i, n) => {
      const b = el("button", "knopf antwort", `${n + 1}. ${woerter[i].en}`); b.type = "button"; b.lang = "en";
      b.addEventListener("click", () => antwortGeben(n));
      return b;
    }));
    frageBox.hidden = false;
  }
  function bossSagt(text, dauer = 2.5) {
    bossSpruch = { text, zeit: dauer }; spruchEl.textContent = "🐊 " + text;
    try { stimme.boss(text); } catch (e) { /* stumm */ }
  }
  function antwortGeben(n) {
    if (!bossFrage || zustand !== "boss") return;
    const i = bossFrage.opt[n];
    if (i == null) return;
    if (i === bossFrage.richtig) {
      klang.richtig(); klang.tuer();
      frageBox.hidden = true; bossFrage = null; zustand = "finale";
      popup = { en: woerter[i].en + " ✓", de: woerter[i].de, zeit: 2.5, art: "richtig" };
      bossSagt(BOSS_RICHTIG, 3);
    } else {
      klang.falsch(); leben--;
      popup = { en: woerter[i].en + " ✗", de: woerter[i].de, zeit: 2, art: "falsch" };
      if (leben <= 0) { frageBox.hidden = true; bossFrage = null; zustand = "gameover"; zeigeEnde(false); }
      else { bossFragen(); bossSagt(BOSS_FALSCH); }
    }
  }

  /* ---------- Ende: Ergebnis an die App ---------- */
  const ergebnis = (geschafft) => ({
    geschafft, diamanten: gesammelt, max: woerter.length + level.tore.length,
    toreRichtig: torErgebnisse.filter(Boolean).length, leben, dauer: Math.round((performance.now() - startZeit) / 1000),
  });
  function zeigeEnde(gewonnen) {
    if (endeGemeldet) return;
    endeGemeldet = true;
    const e = ergebnis(gewonnen), mein = opt;
    setTimeout(() => { if (laeuft && opt === mein && typeof mein.onEnde === "function") mein.onEnde(e); }, gewonnen ? 900 : 500);
  }


  /* ---------- Zeichnen ---------- */
  function diamant(c, x, y, r, farbe, label) {
    c.save(); c.translate(x, y);
    c.fillStyle = farbe; c.beginPath();
    c.moveTo(-r, -r * 0.25); c.lineTo(-r * 0.5, -r); c.lineTo(r * 0.5, -r); c.lineTo(r, -r * 0.25); c.lineTo(0, r); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.moveTo(-r * 0.5, -r); c.lineTo(r * 0.1, -r); c.lineTo(-r * 0.3, -r * 0.25); c.lineTo(-r, -r * 0.25); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(0,40,80,.5)'; c.lineWidth = 1.5; c.beginPath();
    c.moveTo(-r, -r * 0.25); c.lineTo(-r * 0.5, -r); c.lineTo(r * 0.5, -r); c.lineTo(r, -r * 0.25); c.lineTo(0, r); c.closePath(); c.stroke();
    c.beginPath(); c.moveTo(-r, -r * 0.25); c.lineTo(r, -r * 0.25); c.stroke();
    if (label) {
      c.font = 'bold 14px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#fff'; c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 3; c.strokeText(label, 0, r + 14); c.fillText(label, 0, r + 14);
    }
    c.restore();
  }
  function taube(c, g) {
    // Stadttaube: gedrungener Körper, kleiner runder Kopf, kurzer Schnabel, schillernder Hals, gefächerte Schwanzfedern, Flügelschlag
    const b = gegnerBox(g); const cx = b.x + 16, cy = b.y + 14;
    c.save(); c.translate(cx, cy); if (g.richtung > 0) c.scale(-1, 1);
    if (g.tot > 0) c.scale(1, Math.max(0.2, 1 - g.tot * 2));
    const fl = Math.sin(g.flug * 14);
    // hinterer Flügel (oben)
    c.fillStyle = '#6f7686'; c.beginPath(); c.moveTo(-2, -2); c.quadraticCurveTo(8, -12 - fl * 9, 16, -6 - fl * 12); c.quadraticCurveTo(10, -1, 4, 2); c.closePath(); c.fill();
    // Schwanzfedern (gefächert, hinten rechts)
    c.fillStyle = '#5d6373';
    for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(9, 1); c.lineTo(19, -1 + i * 4); c.lineTo(19, 3 + i * 4); c.closePath(); c.fill(); }
    // Körper
    c.fillStyle = '#8d93a3'; c.beginPath(); c.ellipse(0, 2, 12, 7.5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#b9bdc8'; c.beginPath(); c.ellipse(-2, 5, 8, 3.5, 0, 0, Math.PI * 2); c.fill();   // heller Bauch
    // Hals schillernd
    c.fillStyle = '#5e9a7a'; c.beginPath(); c.ellipse(-9, -2, 4.5, 4, -0.3, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(160,90,200,.55)'; c.beginPath(); c.ellipse(-10, -3, 3, 2.4, -0.3, 0, Math.PI * 2); c.fill();
    // Kopf klein, rund
    c.fillStyle = '#7f8595'; c.beginPath(); c.arc(-12, -7, 4.6, 0, Math.PI * 2); c.fill();
    // Schnabel kurz, dünn
    c.fillStyle = '#4a4a4a'; c.beginPath(); c.moveTo(-16, -7.5); c.lineTo(-20.5, -6.3); c.lineTo(-16, -5.3); c.closePath(); c.fill();
    c.fillStyle = '#e9e9e9'; c.beginPath(); c.arc(-16.2, -7.6, 1, 0, Math.PI * 2); c.fill();   // Wachshaut
    // Auge orange mit Pupille
    c.fillStyle = '#f0a030'; c.beginPath(); c.arc(-13, -8.2, 1.6, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#18213a'; c.beginPath(); c.arc(-13.2, -8.2, 0.8, 0, Math.PI * 2); c.fill();
    // vorderer Flügel
    c.fillStyle = '#5d6373'; c.beginPath(); c.moveTo(-3, 0); c.quadraticCurveTo(6, -10 + fl * 9, 14, -4 + fl * 12); c.quadraticCurveTo(8, 1, 2, 4); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 1); c.lineTo(10, -3 + fl * 9); c.stroke();
    // Füße eingezogen (rot)
    c.strokeStyle = '#d04a3a'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-3, 8); c.lineTo(-5, 11); c.moveTo(1, 8); c.lineTo(-1, 11); c.stroke();
    c.restore();
  }
  function waschbaer(c, g) {
    const b = gegnerBox(g); const cx = b.x + 20, cy = b.y + 26;
    c.save(); c.translate(cx, cy); if (g.richtung > 0) c.scale(-1, 1);
    if (g.tot > 0) c.scale(1, Math.max(0.15, 1 - g.tot * 2));
    const w = Math.sin(g.flug * 10) * 3;
    c.fillStyle = '#6e6a66'; c.beginPath(); c.ellipse(0, -11, 18, 10, 0, 0, Math.PI * 2); c.fill();
    c.lineCap = 'round'; c.lineWidth = 7; c.strokeStyle = '#6e6a66'; c.beginPath(); c.moveTo(14, -12); c.quadraticCurveTo(28, -24 + w, 24, -30 + w); c.stroke();
    c.strokeStyle = '#2a2622'; c.lineWidth = 7; c.setLineDash([4, 5]); c.beginPath(); c.moveTo(14, -12); c.quadraticCurveTo(28, -24 + w, 24, -30 + w); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#8a8580'; c.beginPath(); c.arc(-14, -16, 9, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#8a8580'; c.beginPath(); c.moveTo(-20, -22); c.lineTo(-18, -29); c.lineTo(-13, -23); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-10, -23); c.lineTo(-7, -29); c.lineTo(-5, -21); c.closePath(); c.fill();
    c.fillStyle = '#2a2622'; c.beginPath(); c.ellipse(-16, -16, 8, 3.5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(-18, -16, 1.8, 0, Math.PI * 2); c.arc(-12, -16, 1.8, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#2a2622'; c.beginPath(); c.arc(-22, -11, 1.8, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#4a4542';
    c.beginPath(); c.roundRect(-10 + w, -5, 6, 5, 2); c.roundRect(4 - w, -5, 6, 5, 2); c.fill();
    c.restore();
  }
  function eichhoernchen(c, g) {
    // Hüpfendes Eichhörnchen: rotbraun, buschiger Schwanz über dem Rücken, Ohrpinsel, heller Bauch
    const b = gegnerBox(g); const cx = b.x + 15, cy = b.y + 24;
    c.save(); c.translate(cx, cy); if (g.richtung > 0) c.scale(-1, 1);
    if (g.tot > 0) c.scale(1, Math.max(0.15, 1 - g.tot * 2));
    const w = Math.sin(g.flug * 12) * 2;
    // Schwanz
    c.lineCap = 'round'; c.lineWidth = 9; c.strokeStyle = '#b5562a'; c.beginPath(); c.moveTo(10, -8); c.quadraticCurveTo(22, -14 + w, 16, -30 + w); c.quadraticCurveTo(12, -36, 6, -30); c.stroke();
    c.lineWidth = 4; c.strokeStyle = '#e08a55'; c.beginPath(); c.moveTo(11, -10); c.quadraticCurveTo(20, -15 + w, 15, -28 + w); c.stroke();
    // Körper
    c.fillStyle = '#b5562a'; c.beginPath(); c.ellipse(0, -9, 12, 8, -0.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f3d9b8'; c.beginPath(); c.ellipse(-3, -6, 6, 4.5, -0.2, 0, Math.PI * 2); c.fill();
    // Kopf + Ohren mit Pinseln
    c.fillStyle = '#b5562a'; c.beginPath(); c.arc(-11, -16, 6.5, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(-15, -20); c.lineTo(-15, -29); c.lineTo(-11, -22); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-9, -22); c.lineTo(-7, -30); c.lineTo(-5, -21); c.closePath(); c.fill();
    c.fillStyle = '#f3d9b8'; c.beginPath(); c.arc(-14, -13, 2.6, 0, Math.PI * 2); c.fill();   // Wange
    c.fillStyle = '#18213a'; c.beginPath(); c.arc(-13, -17.5, 1.5, 0, Math.PI * 2); c.fill();  // Auge
    c.beginPath(); c.arc(-17.5, -13.5, 1.3, 0, Math.PI * 2); c.fill();                           // Nase
    // Pfoten
    c.fillStyle = '#8a3f1c'; c.beginPath(); c.roundRect(-9 + w, -3, 5, 4, 2); c.roundRect(3 - w, -3, 6, 4, 2); c.fill();
    c.restore();
  }
  function kanaldeckel(c, x, y) {
    c.save(); c.translate(x, y);
    c.fillStyle = '#3a3a3a'; c.beginPath(); c.ellipse(0, 2, 44, 7, 0, 0, Math.PI * 2); c.fill();   // Loch
    const d = boss.deckel;
    c.save(); c.translate(-30 * d, -90 * d * (1 - d * 0.5) - 2); c.rotate(-0.9 * d);
    c.fillStyle = '#6b6b6b'; c.beginPath(); c.ellipse(0, 0, 44, 7, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#444'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(0, 0, 32, 4.5, 0, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#444'; c.font = 'bold 7px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('NYC', 0, 0);
    c.restore();
    c.restore();
  }
  function alligator(c, x, y) {
    if (boss.sichtbar <= 0) return;
    c.save();
    c.beginPath(); c.rect(x - 220, 0, 480, y + 1); c.clip();          // taucht aus dem Kanal auf: unterhalb des Bodens unsichtbar
    c.translate(x + boss.weg * 260, y + (1 - boss.sichtbar) * 110); c.globalAlpha = 1 - boss.weg * 0.9;
    const m = boss.maul;
    c.fillStyle = '#3f8a3e';
    c.beginPath(); c.ellipse(20, -22, 46, 20, 0, 0, Math.PI * 2); c.fill();        // Körper
    c.fillStyle = '#2f6b2e';
    for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-6 + i * 14, -40); c.lineTo(1 + i * 14, -50); c.lineTo(8 + i * 14, -40); c.closePath(); c.fill(); }
    c.fillStyle = '#3f8a3e';
    c.beginPath(); c.moveTo(60, -30); c.quadraticCurveTo(95, -40, 110, -15); c.quadraticCurveTo(90, -22, 60, -12); c.closePath(); c.fill(); // Schwanz
    c.fillStyle = '#2f6b2e'; c.beginPath(); c.roundRect(-10, -10, 14, 10, 3); c.roundRect(30, -10, 14, 10, 3); c.fill();
    c.save(); c.translate(-26, -30);
    c.fillStyle = '#4b9a48';
    c.beginPath(); c.roundRect(-44, -4, 50, 14, 5); c.fill();          // Unterkiefer
    c.save(); c.translate(0, -2); c.rotate(-0.55 * m);
    c.fillStyle = '#3f8a3e'; c.beginPath(); c.roundRect(-46, -14, 54, 14, 6); c.fill();  // Oberkiefer
    c.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-42 + i * 8, 0); c.lineTo(-39 + i * 8, 5); c.lineTo(-36 + i * 8, 0); c.closePath(); c.fill(); }
    c.fillStyle = '#18213a'; c.beginPath(); c.arc(-36, -10, 1.6, 0, Math.PI * 2); c.fill();
    c.restore();
    c.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-40 + i * 8, -3); c.lineTo(-37 + i * 8, -8); c.lineTo(-34 + i * 8, -3); c.closePath(); c.fill(); }
    c.fillStyle = '#e9e9c0'; c.beginPath(); c.arc(-2, -14, 6, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#18213a'; c.beginPath(); c.ellipse(-4, -14, 1.8, 3.5, 0, 0, Math.PI * 2); c.fill();
    c.restore();
    // Spritzer beim Auftauchen
    if (boss.sichtbar < 1) {
      c.fillStyle = 'rgba(120,160,200,.8)';
      for (let i = 0; i < 6; i++) { const a = -Math.PI * (0.2 + i * 0.12), r = 40 + boss.sichtbar * 50; c.beginPath(); c.arc(10 + Math.cos(a) * r, -(1 - boss.sichtbar) * 110 + Math.sin(a) * r * 0.5, 3, 0, Math.PI * 2); c.fill(); }
    }
    c.restore();
  }
  function tuerZeichnen(c, x, y) {
    c.save(); c.translate(x, y);
    c.fillStyle = '#9b8d7c'; c.fillRect(-70, -170, 240, 170);
    c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1.5;
    for (let r = 0; r < 9; r++) { const yy = -170 + r * 19; c.beginPath(); c.moveTo(-70, yy); c.lineTo(170, yy); c.stroke();
      for (let k = 0; k < 7; k++) { const xx = -70 + k * 36 + (r % 2) * 18; c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx, yy + 19); c.stroke(); } }
    c.fillStyle = '#5a4634'; c.beginPath(); c.moveTo(-34, 0); c.lineTo(-34, -90); c.arc(0, -90, 34, Math.PI, 0); c.lineTo(34, 0); c.closePath(); c.fill();
    const offen = tuer.offen;
    const bw = 30 * (1 - offen);
    c.fillStyle = '#8b5a2b'; c.beginPath(); c.moveTo(-30, -2); c.lineTo(-30, -90); c.arc(0, -90, 30, Math.PI, 0); c.lineTo(30, -2); c.closePath();
    c.save(); c.clip();
    c.fillRect(-30, -130, 60, 130);
    if (offen > 0) { c.fillStyle = `rgba(255,240,180,${0.9 * offen})`; c.fillRect(-30 + bw, -130, 60 - 2 * bw, 130); }
    c.restore();
    c.strokeStyle = '#3d2a14'; c.lineWidth = 3; c.stroke();
    if (offen < 0.5) { c.fillStyle = '#e0a400'; c.beginPath(); c.arc(-14, -40, 5, 0, Math.PI * 2); c.fill(); c.fillRect(-16, -40, 4, 10); }
    c.fillStyle = '#e0a400'; c.beginPath(); c.arc(0, -140, 12, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#e0a400'; c.lineWidth = 2.5; for (let i = 0; i < 7; i++) { const a = -Math.PI + i * (Math.PI / 6); c.beginPath(); c.moveTo(Math.cos(a) * 13, -140 + Math.sin(a) * 13); c.lineTo(Math.cos(a) * 21, -140 + Math.sin(a) * 21); c.stroke(); }
    c.restore();
  }
  function fahne(c, x, y, erreicht) {
    c.save(); c.translate(x, y);
    c.fillStyle = '#555'; c.fillRect(-2, -78, 4, 78);
    c.fillStyle = '#888'; c.beginPath(); c.ellipse(0, 0, 10, 3.5, 0, 0, Math.PI * 2); c.fill();
    const fy = erreicht ? -76 : -50;
    c.fillStyle = erreicht ? '#2e9e5b' : '#c8283a';
    c.beginPath(); c.moveTo(2, fy); c.lineTo(30 + Math.sin(zeit * 4) * 2, fy + 10); c.lineTo(2, fy + 20); c.closePath(); c.fill();
    if (erreicht) { c.fillStyle = '#fff'; c.font = 'bold 9px system-ui, sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('✓', 6, fy + 10); }
    c.restore();
  }
  function freiheitsstatue(c, x, y, s, farbe) {
    c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = farbe; c.strokeStyle = farbe; c.lineCap = 'round';
    c.fillRect(-34, -20, 68, 20); c.fillRect(-26, -46, 52, 26); c.fillRect(-18, -60, 36, 14);
    c.beginPath(); c.moveTo(-16, -60); c.lineTo(-10, -130); c.lineTo(10, -130); c.lineTo(18, -60); c.closePath(); c.fill();
    c.lineWidth = 6; c.beginPath(); c.moveTo(-8, -118); c.lineTo(-20, -104); c.stroke(); c.fillRect(-26, -112, 8, 12);
    c.beginPath(); c.moveTo(8, -122); c.lineTo(16, -158); c.stroke();
    c.fillRect(13, -168, 6, 12);
    c.beginPath(); c.moveTo(16, -168); c.quadraticCurveTo(24, -176, 16, -184); c.quadraticCurveTo(8, -176, 16, -168); c.fill();
    c.beginPath(); c.arc(0, -138, 7, 0, Math.PI * 2); c.fill();
    c.lineWidth = 2; for (let i = -3; i <= 3; i++) { const a = -Math.PI / 2 + i * 0.32; c.beginPath(); c.moveTo(Math.cos(a) * 7, -138 + Math.sin(a) * 7); c.lineTo(Math.cos(a) * 15, -138 + Math.sin(a) * 15); c.stroke(); }
    c.restore();
  }
  function hintergrund(c) {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#6ec3f2'); g.addColorStop(0.65, '#cfeeff'); g.addColorStop(1, '#f7f1dc');
    c.fillStyle = g; c.fillRect(-viewW, -H, viewW * 3, H * 3);
    c.fillStyle = 'rgba(255,255,255,.9)';
    for (let i = 0; i < 6; i++) {
      const wx = ((i * 330 + 80 - kamera * 0.12) % (viewW + 300) + viewW + 300) % (viewW + 300) - 150, wy = 40 + (i % 3) * 28;
      c.beginPath(); c.arc(wx, wy, 18, 0, Math.PI * 2); c.arc(wx + 20, wy - 8, 22, 0, Math.PI * 2); c.arc(wx + 44, wy, 16, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = '#9fb6cf';
    for (let i = 0; i < 40; i++) {
      const bx = ((i * 70 - kamera * 0.08) % (viewW + 200) + viewW + 200) % (viewW + 200) - 100;
      const bh = 40 + ((i * 37) % 70); c.fillRect(bx, 240 - bh, 46, bh + 10);
      if (i % 5 === 0) c.fillRect(bx + 18, 240 - bh - 22, 8, 22);
    }
    // Statue of Liberty: kommt über das Level langsam näher (Parallaxe + Größe)
    const naehe = Math.min(1, kamera / level.ende);
    freiheitsstatue(c, viewW * 0.72 - kamera * 0.03, 250, 0.9 + naehe * 0.5, '#4f7f8c');
    c.fillStyle = '#4f9bd6'; c.fillRect(-viewW, 250, viewW * 3, H * 2);
    c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      const wx = ((i * 110 - kamera * 0.3 + Math.sin(zeit + i) * 6) % (viewW + 120) + viewW + 120) % (viewW + 120) - 60;
      c.beginPath(); c.moveTo(wx, 262 + (i % 4) * 16); c.quadraticCurveTo(wx + 10, 258 + (i % 4) * 16, wx + 20, 262 + (i % 4) * 16); c.stroke();
    }
    c.fillStyle = '#4fae5f';
    for (let i = 0; i < 12; i++) {
      const bx = ((i * 190 + 40 - kamera * 0.6) % (viewW + 200) + viewW + 200) % (viewW + 200) - 100;
      c.beginPath(); c.arc(bx, 330, 16, Math.PI, 0); c.arc(bx + 22, 330, 20, Math.PI, 0); c.arc(bx + 44, 330, 14, Math.PI, 0); c.fill();
    }
  }
  function welt(c) {
    const links = kamera - 100, rechts = kamera + viewW + 100;
    for (const [a, b] of level.boden) {
      if (b < links || a > rechts) continue;
      const x0 = a - kamera, w = b - a;
      c.fillStyle = '#b9ad9a'; c.fillRect(x0, BODEN_Y, w, H - BODEN_Y + 200);
      c.fillStyle = '#d9cfbb'; c.fillRect(x0, BODEN_Y, w, 10);
      c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 1;
      for (let x = Math.max(Math.ceil(a / 40) * 40, Math.floor(links / 40) * 40); x < Math.min(b, rechts); x += 40) { c.beginPath(); c.moveTo(x - kamera, BODEN_Y + 10); c.lineTo(x - kamera, H); c.stroke(); }
      c.fillStyle = '#8f8472'; c.fillRect(x0, BODEN_Y + 10, w, 2);
    }
    for (const p of level.plattformen) {
      const x = p.x - kamera; if (x > viewW + 100 || x + p.w < -100) continue;
      c.fillStyle = '#8b5a2b'; c.beginPath(); c.roundRect(x, p.y, p.w, 14, 4); c.fill();
      c.fillStyle = '#4fae5f'; c.beginPath(); c.roundRect(x - 2, p.y - 3, p.w + 4, 7, 3); c.fill();
    }
    for (const k of level.kisten) {
      const x = k.x - kamera; if (x > viewW + 100 || x + KISTE < -100) continue;
      c.fillStyle = '#c98a3e'; c.fillRect(x, k.y, KISTE, KISTE);
      c.strokeStyle = '#7a4a16'; c.lineWidth = 3; c.strokeRect(x + 1.5, k.y + 1.5, KISTE - 3, KISTE - 3);
      c.beginPath(); c.moveTo(x + 4, k.y + 4); c.lineTo(x + KISTE - 4, k.y + KISTE - 4); c.moveTo(x + KISTE - 4, k.y + 4); c.lineTo(x + 4, k.y + KISTE - 4); c.stroke();
    }
    for (const cp of checkpoints) { const x = cp.x - kamera; if (x > -60 && x < viewW + 60) fahne(c, x, BODEN_Y, cp.erreicht); }
    for (const d of diamanten) {
      if (d.weg) continue; const x = d.x - kamera; if (x < -40 || x > viewW + 40) continue;
      const schweb = Math.sin(d.funkel * 3) * 4;
      diamant(c, x, d.y + schweb, 14, '#39c6f0');
      c.fillStyle = 'rgba(255,255,255,.9)'; const fs = 2 + Math.sin(d.funkel * 7) * 1.5;
      c.beginPath(); c.arc(x + 9, d.y + schweb - 14, Math.max(0.5, fs), 0, Math.PI * 2); c.fill();
    }
    for (const tor of tore) {
      if (tor.erledigt) continue;
      const x = tor.x - kamera;
      if (x > -60 && x < viewW + 60) {
        c.strokeStyle = 'rgba(224,164,0,.6)'; c.lineWidth = 4; c.setLineDash([8, 10]); c.beginPath(); c.moveTo(x, 90); c.lineTo(x, BODEN_Y); c.stroke(); c.setLineDash([]);
        for (const s of tor.steine) diamant(c, x, s.y, 16, '#e0a400', woerter[s.wort].en);
      }
    }
    for (const g of gegner) {
      if (g.tot > 0.6) continue; const x = g.x - kamera; if (x < -60 || x > viewW + 60) continue;
      c.save(); c.translate(-kamera, 0);
      if (g.art === 'taube') taube(c, g); else if (g.art === 'eichhoernchen') eichhoernchen(c, g); else waschbaer(c, g);
      c.restore();
    }
    if (level.tuerX - kamera < viewW + 400) {
      tuerZeichnen(c, level.tuerX - kamera, BODEN_Y);
      kanaldeckel(c, level.bossX - kamera, BODEN_Y);
      alligator(c, level.bossX - kamera, BODEN_Y);
      if (bossSpruch) sprechblase(c, level.bossX - kamera - 20, BODEN_Y - 70, bossSpruch.text);
    }
    if (tot <= 0) {
      const blink = spieler.unverwundbar > 0 && Math.floor(zeit * 12) % 2 === 0;
      c.globalAlpha = blink ? 0.35 : 1;
      zeichneFigur(c, spieler.x - kamera, spieler.y, 80, skin, spieler.pose, zeit);
      c.globalAlpha = 1;
    }
  }
  function sprechblase(c, x, y, text) {
    c.save(); c.font = 'bold 16px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const w = c.measureText(text).width + 24;
    c.fillStyle = '#fff'; c.strokeStyle = '#2f6b2e'; c.lineWidth = 2;
    c.beginPath(); c.roundRect(x - w / 2, y - 40, w, 32, 10); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(x - 10, y - 8); c.lineTo(x - 2, y + 4); c.lineTo(x + 6, y - 8); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#2f6b2e'; c.fillText(text, x, y - 24);
    c.restore();
  }
  function hud(c) {
    for (let i = 0; i < 3; i++) {
      c.fillStyle = i < leben ? '#e63946' : 'rgba(0,0,0,.2)';
      herz(c, 24 + i * 26, 24, 9);
    }
    const max = woerter.length + level.tore.length;
    diamant(c, viewW - 118, 24, 10, '#39c6f0');   // Platz für den ✕-Knopf der App rechts oben
    c.font = 'bold 18px system-ui, sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillStyle = '#18213a'; c.fillText(`${gesammelt} / ${max}`, viewW - 102, 24);
    // Fortschritt mit Marken für Tore (gold) und Checkpoints (grün)
    const ende = level.tuerX; const f = Math.min(1, spieler.x / ende);
    const bx = viewW / 2 - 90, bwid = 180;
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.roundRect(bx, 16, bwid, 8, 4); c.fill();
    c.fillStyle = '#1d3f8f'; c.beginPath(); c.roundRect(bx, 16, bwid * f, 8, 4); c.fill();
    for (const t of level.tore) { c.fillStyle = '#e0a400'; c.fillRect(bx + bwid * t.x / ende - 1.5, 13, 3, 14); }
    for (const cp of level.checkpoints) { c.fillStyle = '#2e9e5b'; c.fillRect(bx + bwid * cp.x / ende - 1.5, 13, 3, 14); }
    freiheitsstatue(c, viewW / 2 + 92, 34, 0.14, '#1d3f8f');
    // Tor-Hinweis
    if (zustand === 'spiel') {
      const tor = tore.find(t => !t.erledigt && spieler.x > t.x - 520 && spieler.x < t.x + 40);
      if (tor) {
        c.font = 'bold 20px system-ui, sans-serif'; c.textAlign = 'center';
        const txt = texte.tor(tor.de);
        const w = c.measureText(txt).width + 28;
        c.fillStyle = 'rgba(224,164,0,.92)'; c.beginPath(); c.roundRect(viewW / 2 - w / 2, 40, w, 34, 10); c.fill();
        c.fillStyle = '#18213a'; c.fillText(txt, viewW / 2, 57);
      }
    }
    if (popup) {
      const a = Math.min(1, popup.zeit / 0.4);
      c.globalAlpha = a;
      const farbe = popup.art === 'falsch' ? '#c8283a' : (popup.art === 'richtig' ? '#2e9e5b' : '#1d3f8f');
      c.font = 'bold 40px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      const w = Math.max(c.measureText(popup.en).width, 180) + 50;
      c.fillStyle = 'rgba(255,255,255,.92)'; c.beginPath(); c.roundRect(viewW / 2 - w / 2, 100, w, 84, 16); c.fill();
      c.fillStyle = farbe; c.fillText(popup.en, viewW / 2, 128);
      c.font = '600 20px system-ui, sans-serif'; c.fillStyle = '#444'; c.fillText(popup.de, viewW / 2, 164);
      c.globalAlpha = 1;
    }
    if (meldung) {
      c.font = 'bold 30px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#fff'; c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 5; c.strokeText(meldung.text, viewW / 2, 210); c.fillText(meldung.text, viewW / 2, 210);
    }
    // Banner der Zwischensequenz (Platzhalter für Mr. Alex' Stimme)
    if (banner) {
      const a = Math.min(1, banner.zeit / 0.3, (SEQUENZ.banner - banner.zeit) / 0.25 + 0.05);
      c.globalAlpha = Math.max(0, Math.min(1, a));
      c.fillStyle = 'rgba(24,33,58,.85)'; c.fillRect(0, 150, viewW, 100);
      c.fillStyle = '#e0a400'; c.fillRect(0, 150, viewW, 4); c.fillRect(0, 246, viewW, 4);
      c.font = `bold ${viewW < 700 ? 30 : 38}px system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#fff'; c.fillText(banner.text, viewW / 2, 192);
      c.font = '600 15px system-ui, sans-serif'; c.fillStyle = '#ffd36b'; c.fillText('🎙 Mr. Alex', viewW / 2, 228);
      c.globalAlpha = 1;
    }
    if (zustand === 'sequenz' && !banner) {
      c.font = '600 14px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = 'rgba(255,255,255,.85)'; c.fillText(texte.sequenz, viewW / 2, H - 16);
    }
    if (zustand === 'boss' || zustand === 'finale') {
      c.font = 'bold 22px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#fff'; c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 5;
      const t = zustand === 'boss' ? texte.boss : texte.tuer;
      c.strokeText(t, viewW / 2, 100); c.fillText(t, viewW / 2, 100);
    }
  }
  function herz(c, x, y, r) {
    c.beginPath(); c.moveTo(x, y + r);
    c.bezierCurveTo(x - r * 1.4, y - r * 0.2, x - r * 0.6, y - r * 1.2, x, y - r * 0.4);
    c.bezierCurveTo(x + r * 0.6, y - r * 1.2, x + r * 1.4, y - r * 0.2, x, y + r); c.fill();
  }

  function zeichnen() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#18213a"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (bereich.y > 0) {
      ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.font = `${Math.round(16 * dpr)}px system-ui, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(texte.quer, canvas.width / 2, (bereich.y + bereich.h + 40) * dpr);
    }
    ctx.setTransform(dpr * skala, 0, 0, dpr * skala, dpr * bereich.x, dpr * bereich.y);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, viewW, H); ctx.clip();
    if (zoom !== 1) {   // Kamera fährt heran und herunter: Zoom um die Figur
      const fx = Math.min(viewW * 0.6, spieler.x - kamera), fy = spieler.y - 30;
      ctx.translate(fx, fy); ctx.scale(zoom, zoom); ctx.translate(-fx, -fy);
    }
    hintergrund(ctx);
    welt(ctx);
    ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, viewW, H); ctx.clip(); hud(ctx); ctx.restore();
  }

  /* ---------- Schleife (läuft nur zwischen start und stopp) ---------- */
  let letzte = 0, frames = 0, fpsZeit = 0, fps = 0;
  function schleife(now) {
    if (!laeuft) return;
    let dt = (now - letzte) / 1000; letzte = now;
    if (dt > 0.05) dt = 0.05;
    if (dt < 0) dt = 0;
    frames++; fpsZeit += dt; if (fpsZeit >= 1) { fps = frames; frames = 0; fpsZeit = 0; }
    update(dt);
    zeichnen();
    rafId = requestAnimationFrame(schleife);
  }

  /* ---------- Start / Stopp ---------- */
  function start(o) {
    stopp();
    opt = o || {};
    wrapper = opt.wrapper;
    if (!wrapper) throw new Error("Runner.start: wrapper fehlt");
    woerter = (opt.woerter || []).filter((w) => w && w.en).map((w) => ({ en: String(w.en), de: String(w.de || "") }));
    if (!woerter.length) throw new Error("Runner.start: keine Wörter");
    const n = woerter.length;
    for (let i = 0; woerter.length < 12; i++) woerter.push(woerter[i % n]);   // zu kurze Listen auffüllen (Level hat 12 Diamanten + 2 Tore)
    woerter = woerter.slice(0, 12);
    skin = Object.assign({}, SKIN_STANDARD, opt.skin || {});
    stimme = Object.assign({ wort() {}, boss() {} }, opt.stimme || {});
    texte = Object.assign({}, TEXTE, opt.texte || {});
    canvas = el("canvas", "runner-canvas"); canvas.setAttribute("aria-label", "Road Trip Run");
    ctx = canvas.getContext("2d");
    wrapper.append(canvas, frageBauen());
    groesseAnpassen();
    neuesSpiel();
    frageZaehler = 0; endeGemeldet = false; zustand = "spiel"; laeuft = true;
    startZeit = performance.now(); letzte = startZeit; frames = 0; fpsZeit = 0; fps = 0;
    canvas.addEventListener("pointerdown", aufPointerDown);
    canvas.addEventListener("pointerup", aufPointerUp);
    canvas.addEventListener("pointercancel", aufPointerUp);
    window.addEventListener("keydown", aufKeyDown);
    window.addEventListener("keyup", aufKeyUp);
    window.addEventListener("resize", aufResize);
    rafId = requestAnimationFrame(schleife);
    window.__runner = haken;
    return { stopp };
  }
  function stopp() {
    if (!laeuft && !canvas) return;
    laeuft = false; zustand = "aus";
    if (rafId) cancelAnimationFrame(rafId); rafId = 0;
    window.removeEventListener("keydown", aufKeyDown);
    window.removeEventListener("keyup", aufKeyUp);
    window.removeEventListener("resize", aufResize);
    if (canvas) { canvas.removeEventListener("pointerdown", aufPointerDown); canvas.removeEventListener("pointerup", aufPointerUp); canvas.removeEventListener("pointercancel", aufPointerUp); canvas.remove(); }
    if (frageBox) frageBox.remove();
    canvas = ctx = frageBox = null; halten = false; sprungGedrueckt = false; bossFrage = null;
    audioAus();
    if (window.__runner === haken) delete window.__runner;
  }

  /* ---------- Test-Haken (Playwright) ---------- */
  const haken = {
    springe(haltenMs = 250) { sprungStart(); setTimeout(sprungEnde, haltenMs); },
    stand() {
      return {
        zustand, laeuft, x: spieler.x, y: spieler.y, amBoden: spieler.amBoden, leben, diamanten: gesammelt, kamera, fps,
        popup: popup ? popup.en : null, torErgebnisse: [...torErgebnisse], checkpoint, checkpoints: checkpoints.map((c) => c.erreicht),
        frageOffen: !!frageBox && !frageBox.hidden, bossFrage: bossFrage ? bossFrage.opt.map((i) => woerter[i].en) : null, richtig: bossFrage ? woerter[bossFrage.richtig].en : null,
        zoom, sequenz: sequenz ? sequenz.phase : null, eingabeGesperrt: zustand !== "spiel", banner: banner ? banner.text : null,
        bossSichtbar: boss.sichtbar, bossSpruch: bossSpruch ? bossSpruch.text : null,
        koerper: { bauch: skin.bauch, brust: skin.brust, muskeln: skin.muskeln, power: skin.power, powerAura: skin.powerAura || 0 },
        hochformatHinweis: bereich.y > 0, viewW, speed: SPEED, strecke: level.stopX, sequenzMinDauer: SEQUENZ_MIN, woerter: woerter.map((w) => w.en),
      };
    },
    teleport(x) { tot = 0; spieler.unverwundbar = 0; spieler.x = x; spieler.y = BODEN_Y; spieler.vy = 0; spieler.amBoden = true; kamera = Math.max(0, Math.min(x - viewW * 0.33, level.ende - viewW)); },
    teleportBoss() { this.teleport(level.sequenzX - 250); },
    antwort(n) { antwortGeben(n); },
    schaden() { schaden("gegner"); },
    setSkin(o) { Object.assign(skin, o); },
    sprechListe, level, SEQUENZ, BANNER_TEXT,
  };

  window.Runner = { start, stopp, zeichneFigur, powerAnwenden, sprechText, sprechListe, skinFrei, skinArtikel, kurzDe, SKIN_GRUPPEN, SKIN_STANDARD, FARBEN, level, SEQUENZ, BANNER_TEXT };
})();
