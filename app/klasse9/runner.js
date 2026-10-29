/* Road Trip Run – Runner-Modul für Klasse 9 (aus docs/runner/prototyp/index.html herausgelöst, Konzept docs/runner/konzept-entwurf.md).
   Kein eigenes Menü: Start, Skins, Coins und Ende kommen aus der App (app.js „Games: Road Trip Run“).
   Schnittstelle: window.Runner.start({ wrapper, woerter:[{en,de}], skin, texte, stimme:{ wort(i), boss(text) }, onEnde(ergebnis) })
   → zeichnet ein Canvas (plus Boss-Frage als Overlay) in wrapper; ergebnis = { geschafft, diamanten, max, toreRichtig, leben, dauer, maxCombo }.
   Figur v2 (29.10.): zeichneFigur mit Hals/Proportionen, 14 Frisuren, 7 Bärte, 12 Haarfarben, Körper-Übertreibungen (Giraffenhals, Kugelbauch, Hulk, Riesenfüße) und Gesichtsausdruck als Spielreaktion (Parameter ausdruck).
   Mittel-Pop-up nur noch für Tor-Ergebnis und Boss-Antwort; Combo-Texte und Boss-Banner bleiben mittig.
   Combo (29.10.): Wort-Diamanten in Serie → 3 Funken + Jingle, 5 goldene Spur, 8+ „On fire!“ mit Flammen; Reset bei Lebensverlust oder verpasstem Diamant.
   Wortanzeige (29.10., Mr. Alex): Sprechblase an der Figur (1,6 s, folgt auch im Sprung, kippt am rechten Rand), Wortbank als Chip-Leiste im HUD, Echo 6–8 s später (stimme.wort(i, {leise:true}) + Untertitel unten).
   Gegner-Klänge (Web Audio): Taube flattert, Waschbär knurrt, Eichhörnchen zirpt (je Art höchstens alle 1,5 s, nie in Sequenz/Boss), Plattdrücken = Plopp + Sternchen.
   window.Runner.stopp() beendet Schleife, Eingabe und Audio. Alle Klänge aus Web Audio (keine Dateien); Wörter spricht die App (stimme.wort).
   Test-Haken wie im Prototyp: window.__runner (stand, springe, teleport, teleportBoss, antwort …). */
(function () {
  "use strict";

  /* ---------- Skins: Gruppen (Reiter in der App), Werte, Namen (G/E) und was ohne Kauf frei ist (frei = erste n Werte) ---------- */
  const SKIN_GRUPPEN = [
    { id: "haare", symbol: "💇", titel: ["Haare", "Hair"], optionen: [
      { key: "haar", label: ["Frisur", "Hairstyle"], werte: ["kurz", "lang", "wuschel", "zopf", "locken", "afro", "irokese", "tolle", "zoepfe", "dutt", "flattop", "dreihaare", "riesenafro", "mohawk"], frei: 3, preis: { riesenafro: 60, mohawk: 60 },
        namen: { kurz: ["kurz", "short"], lang: ["lang", "long"], wuschel: ["Wuschelkopf", "messy"], zopf: ["Zopf", "ponytail"], locken: ["Locken", "curly"], afro: ["Afro", "afro"], irokese: ["Irokese", "mohawk"], tolle: ["Elvis-Tolle", "quiff"],
          zoepfe: ["Zöpfe", "pigtails"], dutt: ["Dutt", "bun"], flattop: ["Flat-Top", "flat top"], dreihaare: ["drei Haare", "three hairs"], riesenafro: ["Riesen-Afro", "giant afro"], mohawk: ["Regenbogen-Mohawk", "rainbow mohawk"] } },
      { key: "haarfarbe", label: ["Haarfarbe", "Hair colour"], werte: ["braun", "blond", "pink", "schwarz", "rot", "türkis", "lila", "neongrün", "feuerrot", "blau", "silber", "regenbogen"], frei: 3, preis: { regenbogen: 60 },
        namen: { braun: ["braun", "brown"], blond: ["blond", "blond"], pink: ["pink", "pink"], schwarz: ["schwarz", "black"], rot: ["rot", "red"], "türkis": ["türkis", "turquoise"], lila: ["lila", "purple"], "neongrün": ["neongrün", "neon green"],
          feuerrot: ["feuerrot", "fire red"], blau: ["blau", "blue"], silber: ["silber", "silver"], regenbogen: ["Regenbogen", "rainbow"] } },
      { key: "haarschmuck", label: ["Haarschmuck", "Hair accessory"], werte: ["keiner", "schleife", "haarband"], namen: { keiner: ["keiner", "none"], schleife: ["Schleife", "bow"], haarband: ["Haarband", "headband"] } },
    ] },
    { id: "hut", symbol: "🧢", titel: ["Hut", "Hat"], optionen: [
      { key: "hut", label: ["Kopfbedeckung", "Headwear"], werte: ["keiner", "cap", "cowboy", "zylinder"], namen: { keiner: ["keine", "none"], cap: ["Cap", "cap"], cowboy: ["Cowboyhut", "cowboy hat"], zylinder: ["Zylinder", "top hat"] } },
    ] },
    { id: "gesicht", symbol: "😎", titel: ["Gesicht", "Face"], optionen: [
      { key: "brille", label: ["Sonnenbrille (cool)", "Sunglasses (cool)"], werte: ["aus", "an"], namen: { aus: ["aus", "off"], an: ["an", "on"] } },
      { key: "nase", label: ["Nase", "Nose"], werte: ["rund", "spitz", "knubbel"], namen: { rund: ["rund", "round"], spitz: ["spitz", "pointy"], knubbel: ["Knubbel", "button"] } },
      { key: "bart", label: ["Bart", "Beard"], werte: ["aus", "schnauzer", "zwirbel", "walross", "kinnbart", "monobraue", "fumanchu"], preis: { fumanchu: 60 },
        namen: { aus: ["keiner", "none"], schnauzer: ["Schnauzer", "moustache"], zwirbel: ["Zwirbelbart", "handlebar"], walross: ["Walross", "walrus"], kinnbart: ["Kinnbart", "goatee"], monobraue: ["Monobraue + Schnauzer", "unibrow + moustache"], fumanchu: ["Fu-Manchu", "Fu Manchu"] } },
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
      { key: "hals", label: ["Hals", "Neck"], werte: ["normal", "giraffe"], frei: 1, preis: { giraffe: 60 }, namen: { normal: ["normal", "normal"], giraffe: ["Giraffenhals", "giraffe neck"] } },
      { key: "bauch", label: ["Bauch", "Belly"], werte: ["schmal", "normal", "kräftig", "kugel"], preis: { kugel: 60 }, namen: { schmal: ["schmal", "slim"], normal: ["normal", "normal"], "kräftig": ["kräftig", "big"], kugel: ["Kugelbauch", "ball belly"] } },
      { key: "brust", label: ["Brust/Schultern", "Chest/shoulders"], werte: ["schmal", "normal", "kräftig"], namen: { schmal: ["schmal", "narrow"], normal: ["normal", "normal"], "kräftig": ["breit", "broad"] } },
      { key: "muskeln", label: ["Muskeln", "Muscles"], werte: ["schmal", "normal", "kräftig", "hulk"], frei: 3, preis: { hulk: 60 }, namen: { schmal: ["dünn", "thin"], normal: ["normal", "normal"], "kräftig": ["stark", "strong"], hulk: ["Hulk", "Hulk"] } },
      { key: "fuesse", label: ["Füße", "Feet"], werte: ["normal", "riesen"], frei: 1, preis: { riesen: 60 }, namen: { normal: ["normal", "normal"], riesen: ["Riesenfüße", "giant feet"] } },
      { key: "power", label: ["Power-Körper nach Punkten", "Power body by points"], werte: ["aus", "an"], namen: { aus: ["aus", "off"], an: ["an", "on"] } },
    ] },
    { id: "aura", symbol: "✨", titel: ["Aura", "Aura"], optionen: [
      { key: "aura", label: ["Superkraft-Aura", "Super aura"], werte: ["aus", "an"], namen: { aus: ["aus", "off"], an: ["an", "on"] } },
    ] },
  ];
  const SKIN_OPTIONEN = SKIN_GRUPPEN.flatMap((g) => g.optionen);
  const SKIN_STANDARD = {
    haar: "kurz", haarfarbe: "braun", haarschmuck: "keiner", hut: "cap", brille: "aus", nase: "rund", bart: "aus", schmuck: "keiner",
    top: "shirt", topfarbe: "rot", schuhe: "weiß", aura: "aus", hals: "normal", bauch: "normal", brust: "normal", muskeln: "normal", fuesse: "normal", power: "an",
  };
  const STUFE = { schmal: 0, normal: 1, "kräftig": 2, kugel: 3, hulk: 3 };   // Stufe 3 nur bei Bauch (Kugelbauch) und Muskeln (Hulk)
  const FARBEN = { braun: "#6b3e1e", blond: "#e7c35a", schwarz: "#1a1a1a", rot: "#c8283a", blau: "#1d3f8f", gelb: "#e0a400", "grün": "#2e9e5b", "weiß": "#f4f4f4" };
  // Haarfarben: eigene Tabelle (Oberteil/Schuhe behalten FARBEN); regenbogen = senkrechter Verlauf, Regenbogen-Mohawk ist immer bunt
  const HAARFARBEN = Object.assign({}, FARBEN, { pink: "#ff3fa4", "türkis": "#19d3c5", lila: "#8a3ffc", "neongrün": "#7CFC00", feuerrot: "#ff3b1f", blau: "#2a6cff", silber: "#c9ced6", regenbogen: "regenbogen" });
  const REGENBOGEN = ["#ff2d2d", "#ff9f1a", "#ffe21a", "#2ecc71", "#2a8cff", "#9b4dff"];
  // frei ohne Kauf: die ersten n Werte einer Option (Standard 2); alles andere ist ein Shop-Artikel skin_<key>_<wert> (30 Coins, Ausgefallenes 60: o.preis[wert])
  const SKIN_PREIS = 30;
  const skinFrei = (key, wert) => { const o = SKIN_OPTIONEN.find((x) => x.key === key); return !o || o.werte.indexOf(wert) < (o.frei || 2); };
  const skinArtikel = (key, wert) => `skin_${key}_${wert}`;
  const skinPreis = (key, wert) => { const o = SKIN_OPTIONEN.find((x) => x.key === key); return (o && o.preis && o.preis[wert]) || SKIN_PREIS; };
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
    haar: { kurz: "Short hair", lang: "Long hair", wuschel: "Messy hair", zopf: "Ponytail", locken: "Curly", afro: "Afro", irokese: "Mohawk", tolle: "Quiff", zoepfe: "Pigtails", dutt: "Bun", flattop: "Flat top", dreihaare: "Three hairs", riesenafro: "Giant afro", mohawk: "Rainbow mohawk" },
    haarfarbe: { braun: "Brown hair", blond: "Blond hair", pink: "Pink hair", schwarz: "Black hair", rot: "Red hair", "türkis": "Turquoise hair", lila: "Purple hair", "neongrün": "Neon green hair", feuerrot: "Fire red hair", blau: "Blue hair", silber: "Silver hair", regenbogen: "Rainbow hair" },
    haarschmuck: { keiner: "No hair accessory", schleife: "Bow", haarband: "Headband" },
    hut: { keiner: "No hat", cap: "Cap", cowboy: "Cowboy hat", zylinder: "Top hat" },
    brille: { aus: "Sunglasses off", an: "Sunglasses on" },
    nase: { rund: "Round nose", spitz: "Pointy nose", knubbel: "Button nose" },
    bart: { aus: "No beard", schnauzer: "Moustache", zwirbel: "Handlebar moustache", walross: "Walrus moustache", kinnbart: "Goatee", monobraue: "Unibrow and moustache", fumanchu: "Fu Manchu" },
    schmuck: { keiner: "No jewelry", ohrring: "Earring", kette: "Necklace", beides: "Earring and necklace" },
    schuhe: { "weiß": "White shoes", rot: "Red shoes", schwarz: "Black shoes" },
    aura: { aus: "Aura off", an: "Super aura on" },
    hals: { normal: "Normal neck", giraffe: "Giraffe neck" },
    bauch: { schmal: "Slim belly", normal: "Normal belly", "kräftig": "Big belly", kugel: "Ball belly" },
    brust: { schmal: "Narrow shoulders", normal: "Normal shoulders", "kräftig": "Broad shoulders" },
    muskeln: { schmal: "Thin arms", normal: "Normal arms", "kräftig": "Strong arms", hulk: "Hulk arms" },
    fuesse: { normal: "Normal feet", riesen: "Giant feet" },
    power: { aus: "Power body off", an: "Power body on" },
  };
  const FARBE_EN = { rot: "Red", blau: "Blue", gelb: "Yellow", "grün": "Green" };
  const TOP_EN = { shirt: "T-shirt", hoodie: "hoodie" };
  function sprechText(s, key, wert) {
    if (key === "top" || key === "topfarbe") return `${FARBE_EN[s.topfarbe] || "Red"} ${TOP_EN[s.top] || "T-shirt"}`;
    if (key === "bart" && wert === "an") wert = "schnauzer";   // alter Spielstand (Schnurrbart an/aus)
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
  const EFFEKT_LAUT = 0.6;   // globaler Lautstärke-Faktor für alle Effekte (Gegner-Klänge sind zusätzlich leiser als Diamant/Wort)
  function huelle(g, t0, dauer, lautst) {
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, lautst * EFFEKT_LAUT), t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dauer);
  }
  function ton(freq, dauer, typ = "square", lautst = 0.08, start = 0, freqEnde = null) {
    if (!actx) return;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = typ; o.frequency.value = freq;
    const t0 = actx.currentTime + start;
    if (freqEnde != null) { o.frequency.setValueAtTime(freq, t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnde), t0 + dauer); }   // Tonhöhe gleitet
    huelle(g, t0, dauer, lautst);
    o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0 + dauer + 0.02);
  }
  // Rauschen mit Hüllkurve (Flattern, Rascheln); filter = { typ, freq } optional
  function rauschen(dauer, lautst = 0.05, start = 0, filter = null) {
    if (!actx) return;
    const sr = actx.sampleRate || 44100, n = Math.max(1, Math.floor(sr * dauer));
    const buf = actx.createBuffer(1, n, sr), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const q = actx.createBufferSource(); q.buffer = buf;
    const g = actx.createGain(); const t0 = actx.currentTime + start;
    huelle(g, t0, dauer, lautst);
    let kopf = q;
    if (filter && actx.createBiquadFilter) { const f = actx.createBiquadFilter(); f.type = filter.typ; f.frequency.value = filter.freq; q.connect(f); kopf = f; }
    kopf.connect(g); g.connect(actx.destination); q.start(t0); q.stop(t0 + dauer + 0.02);
  }
  const klang = {
    sprung() { ton(300, 0.12, "square", 0.05); ton(520, 0.1, "square", 0.04, 0.05); },
    diamant() { ton(880, 0.1, "triangle", 0.1); ton(1320, 0.14, "triangle", 0.1, 0.08); ton(1760, 0.2, "triangle", 0.08, 0.16); },
    wort() { [523, 659, 784, 1047].forEach((f, i) => ton(f, 0.18, "triangle", 0.1, i * 0.09)); },
    richtig() { [659, 784, 988, 1319].forEach((f, i) => ton(f, 0.2, "triangle", 0.1, i * 0.1)); },
    falsch() { ton(180, 0.3, "sawtooth", 0.08); ton(140, 0.35, "sawtooth", 0.08, 0.15); },
    aua() { ton(220, 0.15, "square", 0.08); ton(160, 0.25, "square", 0.08, 0.12); ton(180, 0.32, "sine", 0.1, 0.02, 70); },   // Autsch: dumpf, fällt ab
    combo(stufe) {   // kurzer aufsteigender Jingle: 3 Töne (3×), 4 Töne (5×), 5 Töne (8+)
      const noten = stufe >= 8 ? [523, 659, 784, 1047, 1319] : stufe >= 5 ? [659, 784, 988, 1319] : [660, 880, 1100];
      noten.forEach((f, i) => ton(f, 0.14, "triangle", 0.09, i * 0.07));
    },
    // Gegner-Klänge: leiser als Diamant/Wort
    taube() { for (let i = 0; i < 3; i++) rauschen(0.06, 0.05, i * 0.085, { typ: "bandpass", freq: 1400 }); },        // Flattern: 3 Rausch-Pulse
    waschbaer() { ton(110, 0.3, "sawtooth", 0.035, 0, 150); ton(140, 0.25, "sawtooth", 0.03, 0.16, 95); for (let i = 0; i < 3; i++) ton(620 + i * 60, 0.03, "square", 0.025, 0.42 + i * 0.06); },   // Knurren + Schnattern
    eichhoernchen() { ton(2400, 0.06, "sine", 0.035, 0, 3300); ton(2600, 0.06, "sine", 0.03, 0.09, 3500); },   // hohes Zirpen
    plopp() { ton(520, 0.13, "sine", 0.09, 0, 130); rauschen(0.05, 0.03, 0.02, { typ: "lowpass", freq: 900 }); },
    fanfare() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => ton(f, 0.25, "triangle", 0.1, i * 0.14)); },
    tuer() { ton(110, 0.6, "sawtooth", 0.05); ton(220, 0.5, "triangle", 0.05, 0.3); },
    checkpoint() { [784, 1047].forEach((f, i) => ton(f, 0.16, "triangle", 0.09, i * 0.12)); },
    klick() { ton(900, 0.05, "square", 0.04); },
    grollen() { ton(70, 0.9, "sawtooth", 0.09); ton(55, 1.1, "sawtooth", 0.07, 0.2); ton(95, 0.4, "square", 0.04, 0.6); },
    dramatik() { [196, 185, 175].forEach((f, i) => ton(f, 0.5, "triangle", 0.09, i * 0.35)); },
  };

  /* ---------- Figur v2 (29.10.; Vorschlag docs/runner/figur-vorschlaege, Entscheidungen Mr. Alex) ---------- */
  // (x, y) = Fußpunkt Mitte, h = Körperhöhe in 80 Einheiten (die Figur selbst ist ≈ 88 hoch, Kopf ≈ 1/3), pose = 'lauf' | 'sprung' | 'steh', t = Zeit.
  // ausdruck = 'grinsend' (Standard) | 'erstaunt' (Treffer) | 'zunge' (On fire / 5× Combo) – Spielreaktion, keine Skin-Option; Sonnenbrille (s.brille) = „cool“.
  // Ebenen: Aura → Beine → Shorts → hinterer Arm → Hals → Torso → vorderer Arm → Haare hinten → Kopf → Gesicht → Bart → Haare vorn → Haarschmuck → Hut.
  // Hut sitzt immer direkt auf dem Kopf (nie Luft dazwischen): große Frisuren werden darunter gestaucht oder ragen hinten/oben heraus.
  function zeichneFigur(c, x, y, h, s, pose, t, ausdruck) {
    s = Object.assign({}, SKIN_STANDARD, s);
    const u = h / 80;
    c.save(); c.translate(x, y); c.scale(u, u);
    const haut = '#f1c27d', hautD = '#d9a866', wange = 'rgba(255,120,110,.28)';
    const topF = FARBEN[s.topfarbe] || '#c8283a';
    const schuhF = FARBEN[s.schuhe] || '#f4f4f4';
    const shortsF = '#2a4a8a';
    const p = pose === 'lauf' ? t * 13 : 0;
    const st = (v, max) => Math.max(0, Math.min(max, typeof v === 'number' ? v : (STUFE[v] ?? 1)));
    const bauch = st(s.bauch, 3), brust = st(s.brust, 2), musk = st(s.muskeln, 3);   // Stufe 3 = Kugelbauch bzw. Hulk
    const giraffe = s.hals === 'giraffe', riesenfuss = s.fuesse === 'riesen', mitHut = !!s.hut && s.hut !== 'keiner';
    const hulk = musk === 3;
    const sw = [11, 13, 16][brust] + (hulk ? 3 : 0);     // Schulter-Halbbreite (immer breiter als der Hals, 4)
    const hw = [10, 12, 14, 17][bauch];                   // Hüft-Halbbreite
    const armB = [5, 6.5, 9, 12][musk];
    const beinB = [6.5, 8, 10.5, 13][musk];
    const schulterR = [5, 6, 8][brust] + (hulk ? 3 : 0);
    const HX = 0, HY = -74 - (giraffe ? 24 : 0), HR = 13;   // Kopf (Giraffenhals: 24 höher)
    const SCH = -54, AX = 1, AY = -49;                      // Schulterlinie, Armgelenk
    const g = ausdruck === 'erstaunt' || ausdruck === 'zunge' ? ausdruck : 'grinsend';
    const powerAura = Math.max(0, Math.min(1, Number(s.powerAura) || 0));
    const haar = s.haar;

    // Haarfarbe: Farbe oder Regenbogen-Verlauf (senkrecht über die Haarzone)
    const haarF = () => {
      const f = HAARFARBEN[s.haarfarbe] || '#6b3e1e';
      if (f !== 'regenbogen') return f;
      const gr = c.createLinearGradient(0, HY - 34, 0, HY + 30);
      REGENBOGEN.forEach((col, i) => gr.addColorStop(i / (REGENBOGEN.length - 1), col));
      return gr;
    };
    const haarDunkel = () => 'rgba(0,0,0,.22)';
    const braueF = () => { const f = HAARFARBEN[s.haarfarbe]; return (!f || f === 'regenbogen' || f === HAARFARBEN.silber || f === HAARFARBEN.blond) ? '#4a2c12' : f; };

    // ---- Aura (hinter allem)
    if (s.aura === 'an') {
      const puls = 1 + 0.08 * Math.sin(t * 6);
      const gr = c.createRadialGradient(0, -44, 10, 0, -44, 58 * puls);
      gr.addColorStop(0, 'rgba(255,230,80,0.55)'); gr.addColorStop(0.6, 'rgba(255,200,40,0.25)'); gr.addColorStop(1, 'rgba(255,200,40,0)');
      c.fillStyle = gr; c.beginPath(); c.arc(0, -44, 58 * puls, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff3a0';
      for (let i = 0; i < 5; i++) {
        const a = t * 2 + i * 1.26, r = 48 + 6 * Math.sin(t * 5 + i);
        const sx = Math.cos(a) * r, sy = -44 + Math.sin(a) * r * 0.9;
        c.beginPath(); c.moveTo(sx, sy - 4); c.lineTo(sx + 1.5, sy); c.lineTo(sx, sy + 4); c.lineTo(sx - 1.5, sy); c.closePath(); c.fill();
      }
    }
    // ---- Power-Aura (klein, orange, um Schultern/Arme)
    if (powerAura > 0) {
      const r = 24 + 10 * powerAura + 2 * Math.sin(t * 8);
      const gr = c.createRadialGradient(0, AY, 6, 0, AY, r);
      gr.addColorStop(0, `rgba(255,120,30,${0.45 * powerAura})`); gr.addColorStop(1, 'rgba(255,120,30,0)');
      c.fillStyle = gr; c.beginPath(); c.ellipse(0, AY, r * 1.25, r, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffb347';
      const n = 2 + Math.round(powerAura * 3);
      for (let i = 0; i < n; i++) {
        const a = t * 3 + i * (Math.PI * 2 / n), rr = 20 + 4 * powerAura;
        c.beginPath(); c.arc(Math.cos(a) * rr * 1.3, AY + Math.sin(a) * rr, 1.6, 0, Math.PI * 2); c.fill();
      }
    }

    // ---- Beine (Riesenfüße: lange Schuhe nach vorn)
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
      c.beginPath(); c.moveTo(0, -30);
      c.quadraticCurveTo(b.fx * 0.5 + 6, -18 + b.fy * 0.5, b.fx, b.fy - 3); c.stroke();
      if (musk >= 2) { c.lineWidth = beinB + (hulk ? 5 : 3); c.beginPath(); c.moveTo(0, -30); c.quadraticCurveTo(b.fx * 0.25 + 3, -24 + b.fy * 0.25, b.fx * 0.4 + 4, -19 + b.fy * 0.4); c.stroke(); }
      c.fillStyle = schuh; c.strokeStyle = '#333'; c.lineWidth = 1.2;
      if (riesenfuss) {
        c.beginPath(); c.ellipse(b.fx + 9, b.fy - 1.8, 15, 4.8, 0, 0, Math.PI * 2); c.fill(); c.stroke();
        c.fillStyle = 'rgba(0,0,0,.14)'; c.beginPath(); c.ellipse(b.fx + 17, b.fy - 1.8, 5, 3.2, 0, 0, Math.PI * 2); c.fill();   // Schuhspitze
        c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(b.fx + 2, b.fy - 4); c.lineTo(b.fx + 10, b.fy - 4.5); c.stroke(); // Schnürung
      } else { c.beginPath(); c.ellipse(b.fx + 3, b.fy - 1.5, 8, 4.2, 0, 0, Math.PI * 2); c.fill(); c.stroke(); }
    };
    bein(beinHinten, hautD, schuhF);
    c.fillStyle = shortsF; c.beginPath(); c.roundRect(-hw, -36, hw * 2, 15, 5); c.fill();
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-hw, -27, hw * 2, 2);
    bein(beinVorn, haut, schuhF);

    // ---- Arme (Gelenk auf Schulterhöhe; Hulk: dicke Oberarme)
    const armWinkel = pose === 'lauf' ? Math.sin(p) * 0.9 : (pose === 'sprung' ? -2.2 : 0.3);
    const arm = (w, farbe) => {
      c.lineCap = 'round'; c.lineWidth = armB; c.strokeStyle = farbe;
      const ex = AX + Math.sin(w) * 10, ey = AY + Math.cos(w) * 11;
      c.beginPath(); c.moveTo(AX, AY); c.lineTo(ex, ey);
      c.lineTo(ex + Math.cos(w) * 10, ey - Math.sin(w) * 10 + 6); c.stroke();
      if (musk >= 2) { c.lineWidth = armB + (hulk ? 6 : 3); c.beginPath(); c.moveTo(AX, AY); c.lineTo(AX + (ex - AX) * 0.6, AY + (ey - AY) * 0.6); c.stroke(); }
      if (hulk) { c.fillStyle = farbe; c.beginPath(); c.arc(AX + (ex - AX) * 0.45, AY + (ey - AY) * 0.45, 8.5, 0, Math.PI * 2); c.fill();     // Bizeps
        c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.arc(AX + (ex - AX) * 0.4 - 2, AY + (ey - AY) * 0.4 - 2.5, 2.6, 0, Math.PI * 2); c.fill(); }
    };
    arm(-armWinkel, hautD);

    // ---- Hals (sichtbar, schmaler als die Schultern; Giraffenhals: lang mit Flecken)
    c.fillStyle = haut; c.beginPath(); c.roundRect(-4, HY + 10, 8.5, SCH + 1 - (HY + 10), 2); c.fill();
    if (giraffe) { c.fillStyle = 'rgba(140,80,20,.35)'; [[-2, HY + 18], [1.5, HY + 25], [-1.5, HY + 32], [1.5, HY + 39]].forEach(([fx, fy]) => { c.beginPath(); c.ellipse(fx, fy, 2.2, 2.6, 0, 0, Math.PI * 2); c.fill(); }); }
    c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.roundRect(-4, HY + 12, 8.5, 3, 1); c.fill();   // Schatten unter dem Kinn

    // ---- Torso / Oberteil: runde Schultern; Kugelbauch wölbt sich weit nach vorn
    const wölb = bauch === 3 ? 10 : bauch === 2 ? 5 : 1;
    const torso = () => {
      c.beginPath();
      c.moveTo(-sw + 3, SCH); c.lineTo(sw - 3, SCH);
      c.quadraticCurveTo(sw + 1, SCH, sw + 0.5, SCH + 4);
      c.quadraticCurveTo(sw + wölb, -42, hw, -29); c.lineTo(-hw, -29);
      c.quadraticCurveTo(-sw - (bauch >= 2 ? 1 : 0), -42, -sw - 0.5, SCH + 4);
      c.quadraticCurveTo(-sw - 1, SCH, -sw + 3, SCH); c.closePath();
    };
    c.fillStyle = topF; torso(); c.fill();
    if (bauch === 2) { c.beginPath(); c.ellipse(hw - 4, -37, 9, 8.5, 0, 0, Math.PI * 2); c.fill(); }
    if (bauch === 3) {
      c.beginPath(); c.ellipse(hw - 5, -38, 15, 13, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(hw + 1, -43, 5, 3.5, -0.4, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.arc(hw + 3, -36, 1.6, 0, Math.PI * 2); c.fill();   // Bauchnabel durchs Shirt
    }
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(0, SCH, 6, 2.2, 0, 0, Math.PI); c.fill();   // Kragen
    if (s.top === 'hoodie') {
      c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.roundRect(-hw + 1, -43, hw * 2 - 2, 9, 3); c.fill();
      c.fillStyle = topF; c.beginPath(); c.ellipse(0, SCH, sw + 2, 6, 0, Math.PI, 0); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-3, SCH + 2); c.lineTo(-4, -42); c.moveTo(3, SCH + 2); c.lineTo(4, -42); c.stroke();
    } else {
      c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.arc(3, -42, 5, 0, Math.PI * 2); c.fill();
      c.fillStyle = topF; c.beginPath(); c.arc(3, -42, 2.5, 0, Math.PI * 2); c.fill();
    }
    if (s.schmuck === 'kette' || s.schmuck === 'beides') {   // Kette: dicker, größerer Anhänger
      c.strokeStyle = '#e0a400'; c.lineWidth = 2.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(-7, SCH + 1); c.quadraticCurveTo(0, -43, 8, SCH + 1); c.stroke();
      c.fillStyle = '#e0a400'; c.beginPath(); c.arc(1, -46.5, 4.2, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff6c0'; c.beginPath(); c.arc(0, -47.5, 1.5, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = topF; c.beginPath(); c.arc(AX, AY, schulterR, 0, Math.PI * 2); c.fill();   // Ärmel/Schulterkappe
    arm(armWinkel, haut);

    // ---- Haare HINTEN (vor dem Kopf gezeichnet, Gesicht bleibt frei)
    const wipp = pose === 'lauf' ? Math.sin(t * 13) * 2.5 : 0;
    c.fillStyle = haarF();
    if (haar === 'afro') {
      c.beginPath(); c.arc(-2, HY - 4, 19.5, 0, Math.PI * 2); c.fill();
      for (let i = 0; i < 9; i++) { const a = Math.PI * 0.9 + i * (Math.PI * 1.1 / 8); c.beginPath(); c.arc(-2 + Math.cos(a) * 17.5, HY - 4 + Math.sin(a) * 17.5, 6, 0, Math.PI * 2); c.fill(); }
    } else if (haar === 'riesenafro') {   // kompakte Glocke (≈ 1,7× Kopf), umschließt den Kopf oben und hinten, viele kleine Locken am Rand (29.10.: kleiner statt r 32)
      const AX0 = -3, AY0 = HY - 8, AR = 21;
      c.beginPath(); c.arc(AX0, AY0, AR, Math.PI * 0.72, Math.PI * 1.74); c.lineTo(10, HY - 9); c.lineTo(-4, HY + 11); c.closePath(); c.fill();
      for (let i = 0; i <= 12; i++) { const a = Math.PI * (0.75 + i / 12); c.beginPath(); c.arc(AX0 + Math.cos(a) * 20, AY0 + Math.sin(a) * 20, 4.6, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = haarDunkel();
      for (let i = 0; i < 7; i++) { const a = Math.PI * (0.85 + i * 0.13); c.beginPath(); c.arc(AX0 + Math.cos(a) * 13, AY0 + Math.sin(a) * 13, 2.2, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.arc(-10, HY - 20, 5, 0, Math.PI * 2); c.fill();
    } else if (haar === 'lang') {
      c.beginPath(); c.moveTo(-6, HY - 10); c.quadraticCurveTo(-19, HY - 2 + wipp, -16, HY + 34 + wipp);
      c.quadraticCurveTo(-8, HY + 36 + wipp, -2, HY + 28); c.lineTo(4, HY + 10); c.closePath(); c.fill();
    } else if (haar === 'wuschel') {
      const pts = mitHut ? [[-14, -6], [-16, -12], [15, -10], [-8, -12], [12, -14]] : [[-14, -6], [-16, -14], [-12, -22], [-4, -26], [5, -25], [12, -20], [15, -12], [-8, -12], [2, -16]];
      for (const [dx, dy] of pts) { c.beginPath(); c.arc(HX + dx, HY + dy, 8.5, 0, Math.PI * 2); c.fill(); }
    } else if (haar === 'zoepfe') {
      for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(-13 + Math.sin(i * 1.3 + wipp * 0.3) * 1.5, HY - 2 + i * 6, 4.2, 3.8, 0, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = haarDunkel();
      for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(-13 + Math.sin(i * 1.3 + wipp * 0.3) * 1.5 - 1.2, HY - 2 + i * 6 + 1, 2.4, 2.2, 0, 0, Math.PI * 2); c.fill(); }
    }

    // ---- Kopf: leicht eiförmig, runde Wange, Ohr, Ohrring (groß)
    c.fillStyle = haut;
    c.beginPath(); c.ellipse(HX, HY, HR, HR + 0.5, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(HX + 5, HY + 7, 7, 0, Math.PI * 2); c.fill();
    c.fillStyle = wange; c.beginPath(); c.ellipse(HX + 8, HY + 6, 3.6, 2.4, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = hautD; c.beginPath(); c.ellipse(HX - 10.5, HY + 1, 3.4, 4, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.ellipse(HX - 10.5, HY + 1.5, 1.6, 2, 0, 0, Math.PI * 2); c.fill();
    if (s.schmuck === 'ohrring' || s.schmuck === 'beides') {
      c.strokeStyle = '#e0a400'; c.lineWidth = 2.4; c.beginPath(); c.arc(HX - 11, HY + 8.5, 4.4, 0, Math.PI * 2); c.stroke();
      c.fillStyle = '#fff6c0'; c.beginPath(); c.arc(HX - 12.5, HY + 7, 1.1, 0, Math.PI * 2); c.fill();
    }
    // Nase
    c.fillStyle = hautD;
    if (s.nase === 'spitz') { c.beginPath(); c.moveTo(11.5, HY - 2); c.lineTo(18.5, HY + 3); c.lineTo(11.5, HY + 5); c.closePath(); c.fill(); }
    else if (s.nase === 'knubbel') { c.beginPath(); c.arc(13.5, HY + 3, 4, 0, Math.PI * 2); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(12.6, HY + 2, 1.3, 0, Math.PI * 2); c.fill(); }
    else { c.beginPath(); c.arc(12.8, HY + 2.5, 3, 0, Math.PI * 2); c.fill(); }

    // ---- Gesicht: Auge + Braue + Mund je Ausdruck; Sonnenbrille = cool
    const EX = 6.5, EY = HY - 2.5;
    const auge = (r, pupille) => {
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(EX, EY, r, r + 0.6, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#18213a'; c.beginPath(); c.arc(EX + 1.2, EY + 0.4, pupille, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(EX + 2, EY - 1, 0.9, 0, Math.PI * 2); c.fill();
    };
    const braue = (dy, neigung) => {
      c.strokeStyle = braueF(); c.lineCap = 'round'; c.lineWidth = 2.1;
      c.beginPath(); c.moveTo(1.5, EY - 7 + dy + neigung); c.quadraticCurveTo(6.5, EY - 10 + dy, 11.5, EY - 7.5 + dy - neigung); c.stroke();
    };
    const grinsen = (breit) => {
      c.fillStyle = '#7a2b22'; c.beginPath(); c.moveTo(2, HY + 7); c.quadraticCurveTo(7, HY + 7 + breit, 12.5, HY + 6); c.quadraticCurveTo(8, HY + 9, 2, HY + 7); c.closePath(); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.moveTo(3, HY + 7.2); c.lineTo(11.5, HY + 6.3); c.lineTo(10.5, HY + 8.2); c.lineTo(4, HY + 8.8); c.closePath(); c.fill();
    };
    const zunge = () => {
      c.fillStyle = '#f05a7a'; c.beginPath(); c.ellipse(9.5, HY + 11, 3.2, 4, 0.3, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1; c.beginPath(); c.moveTo(9.3, HY + 9); c.lineTo(10.3, HY + 13.5); c.stroke();
    };
    const oMund = () => {
      c.fillStyle = '#7a2b22'; c.beginPath(); c.ellipse(8, HY + 8, 3, 3.8, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#c0453a'; c.beginPath(); c.ellipse(8, HY + 9.6, 1.8, 1.4, 0, 0, Math.PI * 2); c.fill();
    };
    if (s.brille === 'an') {   // große Sonnenbrille („cool“)
      c.fillStyle = '#18213a'; c.beginPath(); c.roundRect(1, EY - 4.5, 13.5, 8.5, 3.5); c.fill();
      c.strokeStyle = '#18213a'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(1, EY - 1); c.lineTo(-10, EY - 2); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.roundRect(3.5, EY - 3, 4.5, 2, 1); c.fill();
      if (g === 'erstaunt') { oMund(); braue(-3, 0); }
      else if (g === 'zunge') { grinsen(4); zunge(); }
      else { c.strokeStyle = '#7a2b22'; c.lineWidth = 1.8; c.lineCap = 'round'; c.beginPath(); c.moveTo(4, HY + 7.5); c.quadraticCurveTo(9, HY + 10, 13, HY + 6); c.stroke(); braue(-1.5, -1); }
    } else if (g === 'erstaunt') {
      auge(5.2, 2.2); braue(-3.5, 0); oMund();
    } else if (g === 'zunge') {
      c.strokeStyle = '#18213a'; c.lineWidth = 2; c.lineCap = 'round'; c.beginPath(); c.arc(EX, EY + 1, 3.8, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
      braue(0.5, 0.5); grinsen(4); zunge();
    } else {
      auge(4.4, 2.6); braue(0, 0.5); grinsen(6);
    }

    // ---- Bärte (Farbe = Haarfarbe)
    const bartF = haarF();
    c.fillStyle = bartF; c.strokeStyle = bartF; c.lineCap = 'round';
    const BY = HY + 5.5;
    const schnauzer = () => { c.beginPath(); c.roundRect(2.5, BY - 1.5, 12, 3.6, 1.8); c.fill(); };
    if (s.bart === 'an' || s.bart === 'schnauzer') schnauzer();
    else if (s.bart === 'zwirbel') {
      c.lineWidth = 2.3;
      c.beginPath(); c.moveTo(8, BY); c.quadraticCurveTo(13, BY + 1, 17, BY - 3); c.quadraticCurveTo(19.5, BY - 6, 16.5, BY - 6.5); c.stroke();
      c.beginPath(); c.moveTo(8, BY); c.quadraticCurveTo(3, BY + 1, 0, BY - 3); c.quadraticCurveTo(-2, BY - 6, 1, BY - 6.5); c.stroke();
      c.beginPath(); c.arc(8, BY + 0.3, 1.6, 0, Math.PI * 2); c.fill();
    } else if (s.bart === 'walross') {
      c.beginPath(); c.moveTo(1.5, BY - 1); c.lineTo(14.5, BY - 1.5);
      c.quadraticCurveTo(16.5, BY + 4, 13.5, BY + 9); c.quadraticCurveTo(11, BY + 11, 9, BY + 8);
      c.quadraticCurveTo(7, BY + 11, 4.5, BY + 9); c.quadraticCurveTo(0.5, BY + 5, 1.5, BY - 1); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(9, BY + 2.5, 4.5, 1.4, 0, 0, Math.PI * 2); c.fill();
    } else if (s.bart === 'fumanchu') {
      c.beginPath(); c.roundRect(3.5, BY - 1.2, 10.5, 2.6, 1.3); c.fill();
      c.lineWidth = 2.4;
      c.beginPath(); c.moveTo(13.5, BY); c.quadraticCurveTo(16.5, BY + 8, 15, BY + 18 + wipp); c.stroke();
      c.beginPath(); c.moveTo(4, BY); c.quadraticCurveTo(2, BY + 8, 3.5, BY + 16 + wipp); c.stroke();
    } else if (s.bart === 'kinnbart') {
      c.beginPath(); c.roundRect(4, BY - 1.2, 9.5, 2.6, 1.3); c.fill();
      c.beginPath(); c.moveTo(2, HY + 11); c.lineTo(11, HY + 11.5); c.lineTo(7, HY + 21); c.closePath(); c.fill();
    } else if (s.bart === 'monobraue') {
      schnauzer();
      c.lineWidth = 3.4; c.beginPath(); c.moveTo(-6, EY - 8); c.quadraticCurveTo(4, EY - 11, 13, EY - 8); c.stroke();
    }

    // ---- Haare VORN / oben (unter einem Hut gestaucht: Tolle, Wuschel, Flat-Top, drei Haare)
    c.fillStyle = haarF(); c.strokeStyle = haarF(); c.lineCap = 'round';
    const kappe = (von, bis, stirnX, stirnY, nackenX, nackenY) => {
      c.beginPath(); c.arc(HX, HY - 1.5, HR + 0.6, Math.PI * von, Math.PI * bis); c.lineTo(stirnX, stirnY); c.lineTo(nackenX, nackenY); c.closePath(); c.fill();
    };
    if (haar === 'kurz') kappe(1.05, 1.95, 10, HY - 7, -5, HY - 3);
    else if (haar === 'lang') kappe(1.0, 1.97, 11, HY - 6, -8, HY + 2);
    else if (haar === 'zopf') {
      kappe(1.02, 1.98, 11, HY - 6, -6, HY - 2);
      c.lineWidth = 6; c.beginPath(); c.moveTo(-11, HY - 4); c.quadraticCurveTo(-23, HY - 2 + wipp, -21, HY + 14 + wipp); c.stroke();
      c.fillStyle = '#c8283a'; c.beginPath(); c.arc(-12, HY - 4, 2.6, 0, Math.PI * 2); c.fill();
    } else if (haar === 'locken') {
      for (let i = 0; i < 7; i++) { const a = Math.PI * 1.0 + i * (Math.PI / 6.5); c.beginPath(); c.arc(Math.cos(a) * 11.5, HY - 1.5 + Math.sin(a) * 11.5, 5.2, 0, Math.PI * 2); c.fill(); }
    } else if (haar === 'afro') {
      for (let i = 0; i < 5; i++) { const a = Math.PI * 1.15 + i * 0.3; c.beginPath(); c.arc(-2 + Math.cos(a) * 16.5, HY - 4 + Math.sin(a) * 16.5, 6.5, 0, Math.PI * 2); c.fill(); }
    } else if (haar === 'riesenafro') {   // Haaransatz: kleine Locken über der Stirn
      for (let i = 0; i < 6; i++) { const a = Math.PI * (1.12 + i * 0.13); c.beginPath(); c.arc(-3 + Math.cos(a) * 16, HY - 8 + Math.sin(a) * 16, 4.4, 0, Math.PI * 2); c.fill(); }
    } else if (haar === 'irokese' || haar === 'mohawk') {
      // Kamm von Nacken bis Stirn; mit Hut nur der hintere Teil (der Hut sitzt vorn)
      const hoch = haar === 'mohawk' ? 30 : 20, n = haar === 'mohawk' ? 6 : 5;
      const a0 = Math.PI * 1.08, a1 = mitHut ? Math.PI * 1.45 : Math.PI * 1.92, r0 = HR - 1;
      c.beginPath(); c.moveTo(HX + Math.cos(a0) * r0, HY - 1.5 + Math.sin(a0) * r0);
      for (let i = 1; i <= n; i++) {
        const a = a0 + (a1 - a0) * i / n, am = a0 + (a1 - a0) * (i - 0.5) / n;
        const hh = r0 + hoch - (haar === 'mohawk' ? Math.abs(i - 0.5 - n / 2) * 4 : 0);
        c.lineTo(HX + Math.cos(am) * hh, HY - 1.5 + Math.sin(am) * hh);
        c.lineTo(HX + Math.cos(a) * r0, HY - 1.5 + Math.sin(a) * r0);
      }
      c.closePath();
      if (haar === 'mohawk') {
        const g2 = c.createLinearGradient(-16, 0, 16, 0);
        REGENBOGEN.forEach((col, i) => { g2.addColorStop(i / REGENBOGEN.length, col); g2.addColorStop((i + 1) / REGENBOGEN.length - 0.001, col); });
        c.fillStyle = g2;
      }
      c.fill();
      c.fillStyle = haarF();
      c.beginPath(); c.arc(HX, HY - 1.5, r0, Math.PI * 1.08, Math.PI * 1.92); c.closePath(); c.fill();
    } else if (haar === 'tolle') {
      kappe(1.0, 1.95, 11, HY - 8, -7, HY + 2);
      if (!mitHut) {
        c.beginPath(); c.moveTo(-9, HY - 11); c.quadraticCurveTo(-2, HY - 30, 14, HY - 26); c.quadraticCurveTo(24, HY - 22, 17, HY - 14);
        c.quadraticCurveTo(14, HY - 9, 9, HY - 11); c.quadraticCurveTo(13, HY - 17, 7, HY - 19); c.quadraticCurveTo(0, HY - 18, -9, HY - 11); c.closePath(); c.fill();
        c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.ellipse(6, HY - 22, 7, 2.2, -0.2, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = haarF(); c.beginPath(); c.roundRect(-10, HY - 4, 3.2, 10, 1.5); c.fill();   // Kotelette
    } else if (haar === 'zoepfe') {
      kappe(1.02, 1.98, 11, HY - 6, -6, HY - 2);
      c.strokeStyle = haarDunkel(); c.lineWidth = 1; c.beginPath(); c.moveTo(-8, HY - 12); c.lineTo(10, HY - 7); c.stroke();
      for (let i = 0; i < 5; i++) { c.fillStyle = haarF(); c.beginPath(); c.ellipse(-7 + Math.sin(i * 1.3 + wipp * 0.3) * 1.5, HY + 4 + i * 6, 4.4, 4, 0, 0, Math.PI * 2); c.fill(); }
      const schleife = (x0, y0) => {
        c.fillStyle = '#e8467c';
        c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 - 6, y0 - 5); c.lineTo(x0 - 5, y0 + 3); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + 5, y0 - 5.5); c.lineTo(x0 + 6, y0 + 2); c.closePath(); c.fill();
        c.fillStyle = '#b2224f'; c.beginPath(); c.arc(x0, y0, 2, 0, Math.PI * 2); c.fill();
      };
      schleife(-13, HY - 3); schleife(-7, HY + 3);
    } else if (haar === 'dutt') {   // mit Hut rutscht der Dutt nach hinten, der Hut sitzt vorn
      kappe(1.0, 1.97, 11, HY - 6, -7, HY);
      const dx = mitHut ? -11 : -2, dy = mitHut ? HY - 15 : HY - 20;
      c.beginPath(); c.arc(dx, dy, 7.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.arc(dx - 2, dy - 2, 3, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#e8467c'; c.lineWidth = 2.2; c.beginPath(); c.arc(dx, dy + 6.5, 3.2, Math.PI * 0.1, Math.PI * 0.9); c.stroke();
    } else if (haar === 'wuschel') {
      const pts = mitHut ? [[-12, -8], [13, -6]] : [[-10, -10], [-2, -14], [7, -12], [13, -6], [-6, -16], [4, -18]];
      for (const [dx, dy] of pts) { c.beginPath(); c.arc(HX + dx, HY + dy, 8, 0, Math.PI * 2); c.fill(); }
      if (!mitHut) { c.lineWidth = 2.5; c.beginPath(); c.moveTo(-14, HY - 20); c.lineTo(-20, HY - 28); c.moveTo(4, HY - 25); c.lineTo(6, HY - 33); c.moveTo(14, HY - 18); c.lineTo(21, HY - 24); c.stroke(); }
    } else if (haar === 'dreihaare') {
      if (!mitHut) {
        c.lineWidth = 1.8;
        c.beginPath(); c.moveTo(-3, HY - 13); c.quadraticCurveTo(-8, HY - 22, -14, HY - 20); c.stroke();
        c.beginPath(); c.moveTo(1, HY - 13.5); c.quadraticCurveTo(0, HY - 25, 3, HY - 27); c.stroke();
        c.beginPath(); c.moveTo(5, HY - 12.5); c.quadraticCurveTo(10, HY - 20, 15, HY - 18); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.ellipse(-2, HY - 8, 5, 2.4, 0.2, 0, Math.PI * 2); c.fill();
      }
    } else if (haar === 'flattop') {
      const oben = mitHut ? HY - 13 : HY - 26;
      c.beginPath(); c.moveTo(-14, HY - 4); c.lineTo(-14, oben); c.lineTo(14, oben); c.lineTo(14, HY - 9); c.lineTo(10, HY - 9);
      c.quadraticCurveTo(0, HY - 12, -11, HY - 2); c.closePath(); c.fill();
      if (!mitHut) { c.fillStyle = haarDunkel(); c.fillRect(-14, oben, 28, 2.2); }
    }

    // ---- Haarschmuck (sitzt auf der Frisur)
    const hoch = { afro: -16, riesenafro: -17, irokese: -18, mohawk: -28, tolle: mitHut ? 0 : -20, dutt: -14, wuschel: mitHut ? -4 : -20, flattop: mitHut ? -8 : -20, locken: -4 }[haar] || 0;
    if (s.haarschmuck === 'schleife') {
      c.fillStyle = '#e8467c';
      c.beginPath(); c.moveTo(-6, HY - 12 + hoch); c.lineTo(-14, HY - 18 + hoch); c.lineTo(-13, HY - 7 + hoch); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(-6, HY - 12 + hoch); c.lineTo(1, HY - 19 + hoch); c.lineTo(3, HY - 9 + hoch); c.closePath(); c.fill();
      c.fillStyle = '#b2224f'; c.beginPath(); c.arc(-6, HY - 12 + hoch, 2.4, 0, Math.PI * 2); c.fill();
    } else if (s.haarschmuck === 'haarband') {
      c.strokeStyle = '#e8467c'; c.lineWidth = 3.2; c.lineCap = 'butt';
      c.beginPath(); c.arc(HX, HY - 1.5, HR + 0.8, Math.PI * 1.1, Math.PI * 1.85); c.stroke();
    }

    // ---- Hüte: immer direkt auf dem Kopf; bei Irokese/Mohawk/Dutt etwas nach vorn gerückt (Frisur ragt hinten heraus)
    const hutDX = (haar === 'irokese' || haar === 'mohawk' || haar === 'dutt') ? 4 : 0;
    // Riesen-Afro: ein kleines Hütchen (Faktor 0,5) sitzt oben auf der Kante der Glocke (Hutboden auf HY − 29,5, Lockenrand reicht bis ≈ HY − 33), nicht versunken
    const aufAfro = haar === 'riesenafro';
    const hutAn = () => { c.save(); c.translate(hutDX, 0); if (aufAfro) { c.translate(-3, HY - 11); c.scale(0.5, 0.5); c.translate(0, -(HY - 11) - 37); } };
    if (s.hut === 'cap') {
      hutAn();
      c.fillStyle = '#1d3f8f'; c.beginPath(); c.arc(HX, HY - 8, 13, Math.PI, 0); c.closePath(); c.fill();
      c.beginPath(); c.roundRect(2, HY - 10, 21, 4.2, 2); c.fill();
      c.fillStyle = '#e0a400'; c.beginPath(); c.arc(HX, HY - 18, 2.3, 0, Math.PI * 2); c.fill();
      c.restore();
    } else if (s.hut === 'cowboy') {
      hutAn(); c.fillStyle = '#8a5a2b';
      c.beginPath(); c.ellipse(0, HY - 11, 21, 4.5, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.roundRect(-9.5, HY - 26, 19, 16, 4); c.fill();
      c.fillStyle = '#5a3a18'; c.fillRect(-9.5, HY - 14, 19, 3); c.restore();
    } else if (s.hut === 'zylinder') {
      hutAn(); c.fillStyle = '#18213a';
      c.beginPath(); c.ellipse(0, HY - 11, 17, 3.5, 0, 0, Math.PI * 2); c.fill();
      c.fillRect(-9.5, HY - 32, 19, 22);
      c.fillStyle = '#c8283a'; c.fillRect(-9.5, HY - 14, 19, 3); c.restore();
    }
    c.restore();
  }
  // Sichtbare Höhe der Figur in Einheiten (Fußpunkt bis Haar-/Hutspitze) – für die Vorschau-Skalierung in der App
  function figurHoehe(s) {
    s = Object.assign({}, SKIN_STANDARD, s);
    const mitHut = !!s.hut && s.hut !== 'keiner';
    const hutH = { cap: 8, cowboy: 13, zylinder: 19 }[s.hut] || 0;
    const haarH = ({ irokese: 20, mohawk: 30, riesenafro: 20, afro: 10, tolle: mitHut ? 0 : 17, dutt: mitHut ? 9 : 14, wuschel: mitHut ? 0 : 21, flattop: mitHut ? 0 : 13, dreihaare: mitHut ? 0 : 14, locken: 3 })[s.haar] || 0;
    if (s.haar === 'riesenafro' && mitHut) return 88 + (s.hals === 'giraffe' ? 24 : 0) + haarH + Math.round(hutH * 0.5); // Hütchen (0,5) oben auf der Afro-Kante
    return 88 + (s.hals === 'giraffe' ? 24 : 0) + Math.max(hutH, haarH);
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
  // Combo + Effekte
  let combo = 0, maxCombo = 0, comboText = null, hudPuls = 0, spur = 0, onfire = false, partikel = [], spurPunkte = [];
  // Wortanzeige: Sprechblase an der Figur, Wortbank (Chips im HUD), Echo-Warteschlange (Wort 6–8 s später noch einmal, Untertitel unten)
  let blase = null, wortbank = [], echoWarteschlange = [], echo = null, echoLetzte = -9, echos = 0, stimmeAufrufe = 0;
  const BLASE_DAUER = 1.6, ECHO_MIN = 6, ECHO_MAX = 8, ECHO_ABSTAND = 2.5, ECHO_DAUER = 1.4, CHIP_MAX = 8, CHIP_ZEICHEN = 12;
  let erstauntZeit = 0, zungeZeit = 0;   // Gesichtsausdruck: erstaunt 0,8 s nach Treffer, Zunge raus 1 s bei „5× Combo!“ und solange On fire
  const ausdruckAktuell = () => (erstauntZeit > 0 ? "erstaunt" : (onfire || zungeZeit > 0) ? "zunge" : "grinsend");
  const gegnerKlangZeit = { taube: -9, waschbaer: -9, eichhoernchen: -9 };   // letzter Klang je Art (Spielzeit)
  let gegnerKlaenge = 0;   // Zähler für Tests
  const GEGNER_KLANG_ABSTAND = 1.5, GEGNER_NAEHE = 260, COMBO_TEXT_DAUER = 1.3;
  const ruhig = () => { try { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) { return false; } };
  const SPEED = 230, GRAV = 1600, GRAV_HALT = 800, SPRUNG_V = -480, HALT_MAX = 0.32;
  const PW = 30, PH = 84;  // Trefferbox (Figur v2 ist ≈ 88 Einheiten hoch; Hut/Frisur zählen nicht)
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
    combo = 0; maxCombo = 0; comboText = null; hudPuls = 0; spur = 0; onfire = false; partikel = []; spurPunkte = []; gegnerKlaenge = 0; erstauntZeit = 0; zungeZeit = 0;
    for (const k in gegnerKlangZeit) gegnerKlangZeit[k] = -9;
    blase = null; wortbank = []; echoWarteschlange = []; echo = null; echoLetzte = -9; echos = 0; stimmeAufrufe = 0;
  }

  /* ---------- Combo, Partikel, Gegner-Klänge ---------- */
  function funken(x, y, n, farben, tempo, dauer, art = "funke") {
    if (ruhig()) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = tempo * (0.4 + Math.random() * 0.6);
      partikel.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - tempo * 0.3, zeit: dauer * (0.6 + Math.random() * 0.4), dauer, farbe: farben[i % farben.length], r: 2 + Math.random() * 2.5, art });
    }
  }
  function comboReset() {
    combo = 0; onfire = false; spur = 0;
  }
  function diamantSammeln(d) {
    d.weg = true; gesammelt++; klang.wort();
    const w = woerter[d.wort];
    blase = { en: w.en, de: kurzDe(w.de) || w.de, zeit: BLASE_DAUER };
    if (!wortbank.some((b) => b.wort === d.wort)) wortbank.push({ wort: d.wort, en: w.en, puls: 1 });
    if (!echoWarteschlange.some((e) => e.wort === d.wort)) echoWarteschlange.push({ wort: d.wort, faellig: zeit + ECHO_MIN + Math.random() * (ECHO_MAX - ECHO_MIN) });   // nur ein Echo je Wort
    stimmeAufrufe++; stimme.wort(d.wort);
    combo++; if (combo > maxCombo) maxCombo = combo; hudPuls = 1;
    const fx = spieler.x, fy = spieler.y - 40;
    if (combo === 3) {
      comboText = { text: "3× Combo!", zeit: COMBO_TEXT_DAUER, stufe: 3 }; klang.combo(3);
      funken(fx, fy, 26, ["#ffd93d", "#fff6c0", "#ff9f1c"], 260, 0.8);
    } else if (combo === 5) {
      comboText = { text: "5× Combo!", zeit: COMBO_TEXT_DAUER, stufe: 5 }; klang.combo(5); zungeZeit = 1;
      funken(fx, fy, 40, ["#ffd93d", "#fff6c0", "#ff9f1c", "#ffffff"], 320, 0.9);
      if (!ruhig()) spur = 3;
    } else if (combo >= 8) {
      comboText = { text: "On fire! 🔥", zeit: COMBO_TEXT_DAUER, stufe: 8 };
      if (combo === 8) { klang.combo(8); funken(fx, fy, 40, ["#ff4d1c", "#ff9f1c", "#ffd93d"], 320, 0.9); }
      onfire = !ruhig();
    }
  }
  function gegnerPlatt(g) {
    g.tot = 0.01; spieler.vy = -320; spieler.amBoden = false;
    gegnerKlang("plopp");
    const b = gegnerBox(g); funken(b.x + b.w / 2, b.y + b.h / 2, 10, ["#fff6c0", "#ffd93d", "#ffffff"], 170, 0.5, "stern");
  }
  // Gegner-Klang: nur im laufenden Spiel (nie in Sequenz/Boss), je Art höchstens alle 1,5 s; "plopp" ist ein Ereignis ohne Sperre
  function gegnerKlang(art) {
    if (zustand !== 'spiel') return false;
    if (art !== "plopp") {
      if (zeit - gegnerKlangZeit[art] < GEGNER_KLANG_ABSTAND) return false;
      gegnerKlangZeit[art] = zeit;
    }
    gegnerKlaenge++;
    if (klang[art]) klang[art]();
    return true;
  }
  function gegnerKlaengeNaehe() {
    for (const g of gegner) {
      if (g.tot > 0) continue;
      const abstand = g.x - spieler.x;
      const nah = abstand > -40 && abstand < GEGNER_NAEHE;
      if (g.art === 'eichhoernchen') {   // Zirpen beim Absprung (Hüpfphase beginnt) – oder sofort, wenn es gerade nahe kommt
        const phase = Math.sin(g.flug * 6) >= 0;
        if (nah && ((phase && g.hopPhase === false) || !g.nahWar)) gegnerKlang('eichhoernchen');
        g.hopPhase = phase; g.nahWar = nah;
      } else if (nah) gegnerKlang(g.art);
    }
  }
  // Echo: fällige Wörter nacheinander (≥ 2,5 s Abstand), nur im laufenden Spiel ohne Sprechblase/Combo-Text/Pop-up (nie in Sequenz/Boss)
  function echoBewegen(dt) {
    if (blase) { blase.zeit -= dt; if (blase.zeit <= 0) blase = null; }
    if (echo) { echo.zeit -= dt; if (echo.zeit <= 0) echo = null; }
    for (const b of wortbank) if (b.puls > 0) b.puls = Math.max(0, b.puls - dt * 2);
    if (zustand !== 'spiel' || tot > 0 || blase || comboText || popup || !echoWarteschlange.length) return;
    if (zeit - echoLetzte < ECHO_ABSTAND || echoWarteschlange[0].faellig > zeit) return;
    const e = echoWarteschlange.shift(), w = woerter[e.wort];
    echoLetzte = zeit; echos++;
    echo = { text: `🔁 ${w.en} – ${kurzDe(w.de) || w.de}`, zeit: ECHO_DAUER };
    stimmeAufrufe++; stimme.wort(e.wort, { leise: true });
  }
  function effekteBewegen(dt) {
    echoBewegen(dt);
    if (hudPuls > 0) hudPuls = Math.max(0, hudPuls - dt * 2.2);
    if (comboText) { comboText.zeit -= dt; if (comboText.zeit <= 0) comboText = null; }
    if (erstauntZeit > 0) erstauntZeit = Math.max(0, erstauntZeit - dt);
    if (zungeZeit > 0) zungeZeit = Math.max(0, zungeZeit - dt);
    if (spur > 0) spur = Math.max(0, spur - dt);
    for (const q of partikel) { q.zeit -= dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.art !== "flamme") q.vy += 420 * dt; }
    partikel = partikel.filter((q) => q.zeit > 0);
    for (const q of spurPunkte) q.zeit -= dt;
    spurPunkte = spurPunkte.filter((q) => q.zeit > 0);
    if (zustand === 'spiel' && tot <= 0) {
      if (spur > 0) spurPunkte.push({ x: spieler.x - 6, y: spieler.y - 36 + Math.sin(zeit * 20) * 6, zeit: 0.6, r: 5 + Math.random() * 3 });
      if (onfire && partikel.length < 160) for (let i = 0; i < 2; i++) partikel.push({ x: spieler.x - 10 + Math.random() * 20, y: spieler.y - 2, vx: -60 - Math.random() * 60, vy: -40 - Math.random() * 60,
        zeit: 0.42, dauer: 0.42, farbe: ["#ff4d1c", "#ff9f1c", "#ffd93d"][i % 3], r: 3 + Math.random() * 3, art: "flamme" });
    }
  }
  function effekteZeichnen(c) {
    for (const q of spurPunkte) {
      c.globalAlpha = Math.max(0, q.zeit / 0.6) * 0.8;
      c.fillStyle = '#ffd93d'; c.beginPath(); c.arc(q.x - kamera, q.y, q.r * (0.4 + q.zeit / 0.6), 0, Math.PI * 2); c.fill();
    }
    for (const q of partikel) {
      const f = Math.max(0, q.zeit / q.dauer);
      c.globalAlpha = Math.min(1, f * 1.4);
      c.fillStyle = q.farbe;
      const x = q.x - kamera, r = q.art === "flamme" ? q.r * f : q.r;
      if (q.art === "stern") {
        c.beginPath(); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; c.moveTo(x, q.y); c.lineTo(x + Math.cos(a) * r * 2, q.y + Math.sin(a) * r * 2); }
        c.strokeStyle = q.farbe; c.lineWidth = 1.5; c.stroke();
      } else { c.beginPath(); c.arc(x, q.y, Math.max(0.3, r), 0, Math.PI * 2); c.fill(); }
    }
    c.globalAlpha = 1;
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
    leben--; klang.aua(); comboReset(); erstauntZeit = 0.8;
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
    if (!eingefroren) { gegnerBewegen(dt); for (const d of diamanten) d.funkel += dt; effekteBewegen(dt); }

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
        if (ueberlappt(box.x, box.y, box.w, box.h, d.x - 14, d.y - 16, 28, 32)) diamantSammeln(d);
        else if (!d.verpasst && d.x < spieler.x - PW / 2 - 20) { d.verpasst = true; comboReset(); }   // Diamant hinter der Figur: Serie reißt
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
          if (spieler.vy > 0 && altY <= gb.y + 14) gegnerPlatt(g);
          else schaden('gegner');
        }
      }
      gegnerKlaengeNaehe();
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
      klang.falsch(); leben--; comboReset(); erstauntZeit = 0.8;
      popup = { en: woerter[i].en + " ✗", de: woerter[i].de, zeit: 2, art: "falsch" };
      if (leben <= 0) { frageBox.hidden = true; bossFrage = null; zustand = "gameover"; zeigeEnde(false); }
      else { bossFragen(); bossSagt(BOSS_FALSCH); }
    }
  }

  /* ---------- Ende: Ergebnis an die App ---------- */
  const ergebnis = (geschafft) => ({
    geschafft, diamanten: gesammelt, max: woerter.length + level.tore.length,
    toreRichtig: torErgebnisse.filter(Boolean).length, leben, dauer: Math.round((performance.now() - startZeit) / 1000), maxCombo,
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
      zeichneFigur(c, spieler.x - kamera, spieler.y, 80, skin, spieler.pose, zeit, ausdruckAktuell());
      c.globalAlpha = 1;
    }
    effekteZeichnen(c);
    if (blase && tot <= 0) wortBlase(c);
  }
  // Comic-Sprechblase rechts oben neben dem Kopf (folgt der Figur, auch im Sprung); am rechten Rand nach links gekippt; Pop-in (reduced-motion: ohne)
  function wortBlase(c) {
    const kopfX = spieler.x - kamera + 11, kopfY = spieler.y - 74 - (skin.hals === 'giraffe' ? 24 : 0) - 6;   // Anker: rechte Kopfseite
    c.save();
    c.font = 'bold 20px system-ui, sans-serif'; const enW = c.measureText(blase.en).width;
    c.font = '600 13px system-ui, sans-serif'; const deW = c.measureText(blase.de).width;
    const w = Math.max(enW, deW, 60) + 26, h = 50;
    let links = kopfX + 12, oben = kopfY - 22 - h, rechts = false;
    if (links + w > viewW - 8) { rechts = true; links = kopfX - 22 - w - 12; }
    if (links < 4) links = 4;
    oben = Math.max(70, oben);
    const auf = BLASE_DAUER - blase.zeit;
    const a = Math.min(1, blase.zeit / 0.25);
    const sk = ruhig() ? 1 : (auf < 0.18 ? 0.4 + 0.6 * (auf / 0.18) * (1.25 - 0.25 * (auf / 0.18)) : (auf < 0.3 ? 1 + 0.08 * (1 - (auf - 0.18) / 0.12) : 1));
    const ax = rechts ? kopfX - 10 : kopfX + 10, ay = kopfY - 4;   // Schwänzchen-Spitze am Kopf
    c.globalAlpha = a; c.translate(ax, ay); c.scale(sk, sk); c.translate(-ax, -ay);
    c.fillStyle = '#fff'; c.strokeStyle = '#18213a'; c.lineWidth = 2.5; c.lineJoin = 'round';
    c.beginPath(); c.roundRect(links, oben, w, h, 12); c.fill(); c.stroke();
    const sx = rechts ? links + w - 22 : links + 22;
    c.beginPath(); c.moveTo(sx - 8, oben + h - 1); c.lineTo(ax, ay); c.lineTo(sx + 8, oben + h - 1); c.closePath(); c.fill();
    c.strokeStyle = '#18213a'; c.beginPath(); c.moveTo(sx - 8, oben + h - 1); c.lineTo(ax, ay); c.lineTo(sx + 8, oben + h - 1); c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = 'bold 20px system-ui, sans-serif'; c.fillStyle = '#1d3f8f'; c.fillText(blase.en, links + w / 2, oben + 18);
    c.font = '600 13px system-ui, sans-serif'; c.fillStyle = '#444'; c.fillText(blase.de, links + w / 2, oben + 37);
    c.restore();
  }
  // Wortbank: Chips (englisches Wort, max. 12 Zeichen) in einer Leiste unter der Herz-/Fortschrittszeile, von links; passen nicht alle, steht links ein Zähler „+n“ für die ältesten
  function wortbankZeichnen(c) {
    if (!wortbank.length) return;
    const y = 54, hh = 22, gap = 6, x0 = 14, frei = viewW - 70 - x0;   // rechts Platz für den ✕-Knopf der App
    c.save(); c.font = 'bold 13px system-ui, sans-serif'; c.textBaseline = 'middle';
    const chips = wortbank.map((b) => { const txt = b.en.length > CHIP_ZEICHEN ? b.en.slice(0, CHIP_ZEICHEN - 1) + '…' : b.en; return { b, txt, w: c.measureText(txt).width + 16 }; });
    let sichtbar = [], breite = 0, rest = 0;
    for (let i = chips.length - 1; i >= 0; i--) {
      const zaehlerW = i > 0 ? 40 : 0;   // Platz für „+n“, falls noch ältere übrig bleiben
      if (sichtbar.length >= CHIP_MAX || breite + chips[i].w + zaehlerW > frei) { rest = i + 1; break; }
      sichtbar.unshift(chips[i]); breite += chips[i].w + gap;
    }
    let x = x0;
    if (rest > 0) {
      const t = `+${rest}`, w = c.measureText(t).width + 14;
      c.fillStyle = 'rgba(24,33,58,.55)'; c.beginPath(); c.roundRect(x, y - hh / 2, w, hh, hh / 2); c.fill();
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText(t, x + w / 2, y + 1); x += w + gap;
    }
    for (let k = 0; k < sichtbar.length; k++) {
      const ch = sichtbar[k], neu = k === sichtbar.length - 1 && ch.b.puls > 0 && !ruhig();
      const sk = neu ? 1 + 0.18 * Math.sin(Math.min(1, ch.b.puls) * Math.PI) : 1;
      c.save(); c.translate(x + ch.w / 2, y); c.scale(sk, sk);
      c.fillStyle = neu ? 'rgba(255,217,61,.95)' : 'rgba(255,255,255,.9)'; c.strokeStyle = 'rgba(24,33,58,.35)'; c.lineWidth = 1;
      c.beginPath(); c.roundRect(-ch.w / 2, -hh / 2, ch.w, hh, hh / 2); c.fill(); c.stroke();
      c.fillStyle = '#18213a'; c.textAlign = 'center'; c.fillText(ch.txt, 0, 1);
      c.restore(); x += ch.w + gap;
    }
    c.restore();
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
    if (combo >= 2) {   // Combo-Zähler links neben dem Diamanten, pulsiert bei Erhöhung
      const puls = ruhig() ? 1 : 1 + 0.35 * Math.sin(Math.min(1, hudPuls) * Math.PI);
      c.save(); c.translate(viewW - 140, 24); c.scale(puls, puls);
      c.font = 'bold 18px system-ui, sans-serif'; c.textAlign = 'right'; c.textBaseline = 'middle';
      const txt = `🔥 ×${combo}`, tw = c.measureText(txt).width + 14;
      c.fillStyle = onfire ? 'rgba(255,77,28,.9)' : 'rgba(255,217,61,.9)'; c.beginPath(); c.roundRect(-tw, -13, tw, 26, 13); c.fill();
      c.fillStyle = onfire ? '#fff' : '#18213a'; c.fillText(txt, -7, 1);
      c.restore();
    }
    // Fortschritt mit Marken für Tore (gold) und Checkpoints (grün)
    const ende = level.tuerX; const f = Math.min(1, spieler.x / ende);
    const bx = viewW / 2 - 90, bwid = 180;
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.roundRect(bx, 16, bwid, 8, 4); c.fill();
    c.fillStyle = '#1d3f8f'; c.beginPath(); c.roundRect(bx, 16, bwid * f, 8, 4); c.fill();
    for (const t of level.tore) { c.fillStyle = '#e0a400'; c.fillRect(bx + bwid * t.x / ende - 1.5, 13, 3, 14); }
    for (const cp of level.checkpoints) { c.fillStyle = '#2e9e5b'; c.fillRect(bx + bwid * cp.x / ende - 1.5, 13, 3, 14); }
    freiheitsstatue(c, viewW / 2 + 92, 34, 0.14, '#1d3f8f');
    wortbankZeichnen(c);
    if (echo) {   // Echo-Untertitel unten mittig
      const a = Math.min(1, echo.zeit / 0.3, (ECHO_DAUER - echo.zeit) / 0.15);
      c.save(); c.globalAlpha = Math.max(0, a); c.font = '600 15px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      const w = c.measureText(echo.text).width + 24;
      c.fillStyle = 'rgba(24,33,58,.78)'; c.beginPath(); c.roundRect(viewW / 2 - w / 2, H - 36, w, 26, 13); c.fill();
      c.fillStyle = '#fff'; c.fillText(echo.text, viewW / 2, H - 23);
      c.restore();
    }
    // Tor-Hinweis
    if (zustand === 'spiel') {
      const tor = tore.find(t => !t.erledigt && spieler.x > t.x - 520 && spieler.x < t.x + 40);
      if (tor) {
        c.font = 'bold 20px system-ui, sans-serif'; c.textAlign = 'center';
        const txt = texte.tor(tor.de);
        const w = c.measureText(txt).width + 28;
        c.fillStyle = 'rgba(224,164,0,.92)'; c.beginPath(); c.roundRect(viewW / 2 - w / 2, 72, w, 34, 10); c.fill();   // unter der Wortbank-Leiste
        c.fillStyle = '#18213a'; c.fillText(txt, viewW / 2, 89);
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
    if (comboText) {   // Combo-Einblendung: springt auf, bleibt, blendet aus (reduced-motion: nur Text)
      const rest = comboText.zeit, auf = COMBO_TEXT_DAUER - rest;
      const a = Math.min(1, rest / 0.3, auf / 0.1 + 0.2);
      const s = ruhig() ? 1 : 1 + 0.45 * Math.max(0, 1 - auf / 0.25);
      const farbe = comboText.stufe >= 8 ? '#ff4d1c' : '#ffd93d';
      c.save(); c.globalAlpha = Math.max(0, a); c.translate(viewW / 2, 250); c.scale(s, s);
      c.font = `bold ${comboText.stufe >= 5 ? 36 : 30}px system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = farbe; c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 6; c.strokeText(comboText.text, 0, 0); c.fillText(comboText.text, 0, 0);
      c.restore();
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
        combo, maxCombo, comboText: comboText ? comboText.text : null, partikel: partikel.length, spur: spur > 0, spurPunkte: spurPunkte.length, onfire, ruhig: ruhig(), ausdruck: ausdruckAktuell(),
        blase: blase ? { en: blase.en, de: blase.de, zeit: Math.round(blase.zeit * 100) / 100 } : null, wortbank: wortbank.map((b) => b.en),
        echoWarteschlange: echoWarteschlange.map((e) => ({ wort: woerter[e.wort].en, in: Math.round((e.faellig - zeit) * 100) / 100 })), echo: echo ? echo.text : null, echos, stimmeAufrufe,
        gegnerKlaenge, gegnerNah: gegner.filter((g) => g.tot <= 0 && g.x - spieler.x > -40 && g.x - spieler.x < GEGNER_NAEHE).map((g) => g.art),
      };
    },
    sammle(i) { const d = diamanten[i]; if (d && !d.weg && zustand === "spiel") diamantSammeln(d); },   // Diamant i direkt einsammeln (Test)
    stampfe(i) { const g = gegner[i]; if (g && g.tot <= 0 && zustand === "spiel") gegnerPlatt(g); },                             // Gegner i plattdrücken (Test)
    gegnerKlang,
    teleport(x) { tot = 0; spieler.unverwundbar = 0; spieler.x = x; spieler.y = BODEN_Y; spieler.vy = 0; spieler.amBoden = true; kamera = Math.max(0, Math.min(x - viewW * 0.33, level.ende - viewW)); },
    teleportBoss() { this.teleport(level.sequenzX - 250); },
    antwort(n) { antwortGeben(n); },
    schaden() { schaden("gegner"); },
    setSkin(o) { Object.assign(skin, o); },
    sprechListe, level, SEQUENZ, BANNER_TEXT,
  };

  window.Runner = { start, stopp, zeichneFigur, figurHoehe, powerAnwenden, sprechText, sprechListe, skinFrei, skinArtikel, skinPreis, SKIN_PREIS, kurzDe, SKIN_GRUPPEN, SKIN_STANDARD, FARBEN, HAARFARBEN, level, SEQUENZ, BANNER_TEXT };
})();
