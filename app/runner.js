/* AUTOMATISCH KOPIERT aus app/klasse9/runner.js von werkzeuge/webapp_bauen.py – hier NICHT ändern, sondern dort (eine Engine, zwei Apps:
   Klasse 9 „Road Trip Run“, Klasse 6 „London Run“). */
/* Road Trip Run – Runner-Modul für Klasse 9 (aus docs/runner/prototyp/index.html herausgelöst, Konzept docs/runner/konzept-entwurf.md).
   Kein eigenes Menü: Start, Skins, Coins und Ende kommen aus der App (app.js „Games: Road Trip Run“).
   Schnittstelle: window.Runner.start({ wrapper, woerter:[{en,de}], skin, texte, stimme:{ wort(i), boss(text) }, onEnde(ergebnis) })
   → zeichnet ein Canvas (plus Boss-Frage als Overlay) in wrapper; ergebnis = { geschafft, diamanten, max, toreRichtig, leben, dauer, maxCombo }.
   Figur v2 (29.10.): zeichneFigur mit Hals/Proportionen, 14 Frisuren, 7 Bärte, 12 Haarfarben, Körper-Übertreibungen (Giraffenhals, Kugelbauch, Hulk, Riesenfüße) und Gesichtsausdruck als Spielreaktion (Parameter ausdruck).
   Mittel-Pop-up nur noch für Tor-Ergebnis und Boss-Antwort; Combo-Texte und Boss-Banner bleiben mittig.
   Combo (29.10.): Wort-Diamanten in Serie → 3 Funken + Jingle, 5 goldene Spur, 8+ „On fire!“ mit Flammen; Reset bei Lebensverlust oder verpasstem Diamant.
   Wortanzeige (29.10., Mr. Alex): Sprechblase an der Figur (1,6 s, folgt auch im Sprung, kippt am rechten Rand), Wortbank als Chip-Leiste im HUD, Echo 6–8 s später (stimme.wort(i, {leise:true}) + Untertitel unten).
   Gegner-Klänge (Web Audio): Taube flattert, Waschbär knurrt, Eichhörnchen zirpt (je Art höchstens alle 1,5 s, nie in Sequenz/Boss), Plattdrücken = Plopp + Sternchen.
   Welten (29.10., Plan docs/runner/welten-2-5-plan.md): Runner.start({ …, welt: "ny" | "route66" }); je Welt ein Objekt in WELTEN (Kulisse, Boden, Kisten, Gegnerarten, Boss + Tür, Banner, Level-Muster).
   Welt 2 Route 66: Autos/Trucks (drüberspringen, Berührung = Leben weg), Ölflecken (0,6 s rutschen ohne Sprung), Reifenstapel, Kojote/Roadrunner/Gürteltier (rollt weg), Boss Big Rig Bob (Hupe), Mautstation mit Schlagbaum.
   Welt 3 Grand Canyon (30.10.): fallende Steine (Staub/Schatten als Warnung, dann Sturz; liegen 1,4 s), Hängebrücken (wackeln; > 1,5 s Bodenzeit auf der Brücke → Brett bricht, Sturz in die Schlucht), Kakteen, Felsbrocken,
   Klapperschlange/Geier/Skorpion, Boss Sheriff Rattlesnake (richtet sich aus dem Felsspalt auf, Rassel), Holztor einer Westernstadt.
   Welt 4 Mount Rushmore (30.10.): rollende Baumstämme (rollen los, sobald die Figur ≈ 520 davor ist; drüberspringen), Bäche (Lücke mit Wasser + Trittsteine), Windböen (0,5 s Blätter als Warnung, dann 0,8 s Schub
   zurück/vorwärts, währenddessen halber Sprung), Bärenhöhlen (Bär schaut 0,6 s heraus, dann Pranke davor), Büffel (nicht plattdrückbar – jede Berührung = Leben weg)/Biber/Adler, Boss Grizzly Grandpa (gähnt aus der Höhle, Brummen), Ranger-Station-Tor.
   Welt 5 California · Golden Gate Bridge (30.10.): Nebelabschnitte (Schleier über dem Spielfeld, Diamanten glühen durch), Seilbahn-Plattformen (Gondel pendelt am Seil über dem Pazifik, trägt die Figur mit), Surfbrett-Rutsche (Tempo × 1,6, springen erlaubt),
   Pazifik-Lücken, Möwe (klaut bei Berührung einen Diamanten statt ein Leben – plattdrücken oder mit gehaltenem Sprung drüber)/Seelöwe/Skater, Boss Captain Fog (Nebelgeist mit Kapitänsmütze, Nebelhorn), Brückentor (Golden-Gate-Pfeiler mit Gitter).
   Welt „westminster“ (31.10., nur Klasse 6 „London Run“): Themse mit Booten, Big Ben + Parlament wachsen im Hintergrund, London Eye, Nieselwolken, am Ende Regenbogen; Doppeldecker/Black Cabs (wie Autos),
   Pfützen (rutschen wie Öl), Telefonzellen/Postkästen als Stufen, Themse-Lücken, Taube/Stadtfuchs/graues Eichhörnchen, Boss Sergeant Bearskin (Royal Guard, nur die Augen bewegen sich; Trommelwirbel + Signal), Tor der Horse Guards.
   Cameos (31.10., Option cameos: [{ id, name, bild, kraft }]): 2–3 Gastauftritte der geheimen Superhelden je Lauf (rundes Kartenbild, Umhang, Sprechblase ≈ 2,5 s) mit kleinem Effekt (CAMEO);
   ohne die Option (Klasse 9) gibt es keine Cameos. stimme.cameo(text, id) spricht den Satz (optional).
   window.Runner.stopp() beendet Schleife, Eingabe und Audio. Alle Klänge aus Web Audio (keine Dateien); Wörter spricht die App (stimme.wort).
   Story-Modus (31.10., nur mit Option story – Klasse 6 London Run Welt 1, docs/runner/story-london-01.md; Klasse 9 übergibt keine, dort ändert sich nichts): eigene Strecke MUSTER_WESTMINSTER_STORY
   mit 12 Story-Kristallen ♪ (violett, Goldkante, Notensymbol, Glühen; Erzähler über stimme.erzaehler(text, { key, audio, sofort }), Text oben mittig als Schreibmaschine, Warteschlange ohne Überlagerung),
   Gabelung nach Stück 4 (♪A5 Straße / ♪B5 auf einem geparkten Doppeldecker: das zuerst genommene legt den Strang fest), 18 Punkte-Diamanten 💎 (Wort wie bisher), Stationen „The story so far“ an den Checkpoints
   (Spiel steht, Tap = weiter), Film am Ende (3 Szenen + Titelkarte mit der eigenen Figur, Tap = überspringen) und Runner.film(…) für die Story Library. Ergebnis zusätzlich { punkteDiamanten, diamantenMax, story }.
   Test-Haken wie im Prototyp: window.__runner (stand, springe, teleport, teleportBoss, antwort …; Story: story, gabelung, kristall, stationWeiter, filmStart, filmSkip). */
(function () {
  "use strict";

  /* ---------- Skins: Gruppen (Reiter in der App), Werte, Namen (G/E) und was ohne Kauf frei ist (frei = erste n Werte) ---------- */
  const SKIN_GRUPPEN = [
    { id: "haare", symbol: "💇", titel: ["Haare", "Hair"], optionen: [
      { key: "haar", label: ["Frisur", "Hairstyle"], werte: ["kurz", "lang", "wuschel", "zopf", "locken", "afro", "irokese", "tolle", "zoepfe", "dutt", "flattop", "dreihaare", "riesenafro", "mohawk"], frei: 3, preis: { riesenafro: 90, mohawk: 90 },
        namen: { kurz: ["kurz", "short"], lang: ["lang", "long"], wuschel: ["Wuschelkopf", "messy"], zopf: ["Zopf", "ponytail"], locken: ["Locken", "curly"], afro: ["Afro", "afro"], irokese: ["Irokese", "mohawk"], tolle: ["Elvis-Tolle", "quiff"],
          zoepfe: ["Zöpfe", "pigtails"], dutt: ["Dutt", "bun"], flattop: ["Flat-Top", "flat top"], dreihaare: ["drei Haare", "three hairs"], riesenafro: ["Riesen-Afro", "giant afro"], mohawk: ["Regenbogen-Mohawk", "rainbow mohawk"] } },
      { key: "haarfarbe", label: ["Haarfarbe", "Hair colour"], werte: ["braun", "blond", "pink", "schwarz", "rot", "türkis", "lila", "neongrün", "feuerrot", "blau", "silber", "regenbogen"], frei: 3, preis: { regenbogen: 90 },
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
      { key: "bart", label: ["Bart", "Beard"], werte: ["aus", "schnauzer", "zwirbel", "walross", "kinnbart", "monobraue", "fumanchu"], preis: { fumanchu: 90 },
        namen: { aus: ["keiner", "none"], schnauzer: ["Schnauzer", "moustache"], zwirbel: ["Zwirbelbart", "handlebar"], walross: ["Walross", "walrus"], kinnbart: ["Kinnbart", "goatee"], monobraue: ["Monobraue + Schnauzer", "unibrow + moustache"], fumanchu: ["Fu-Manchu", "Fu Manchu"] } },
    ] },
    { id: "oberteil", symbol: "👕", titel: ["Oberteil", "Top"], optionen: [
      { key: "top", label: ["Oberteil", "Top"], werte: ["shirt", "hoodie"], namen: { shirt: ["T-Shirt", "T-shirt"], hoodie: ["Hoodie", "hoodie"] } },
      { key: "topfarbe", label: ["Farbe", "Colour"], werte: ["rot", "blau", "gelb", "grün"], namen: { rot: ["rot", "red"], blau: ["blau", "blue"], gelb: ["gelb", "yellow"], "grün": ["grün", "green"] } },
    ] },
    { id: "schuhe", symbol: "👟", titel: ["Schuhe", "Shoes"], optionen: [
      { key: "schuhe", label: ["Schuhe", "Shoes"], werte: ["weiß", "rot", "schwarz", "rollschuhe"], preis: { rollschuhe: 90 }, namen: { "weiß": ["weiß", "white"], rot: ["rot", "red"], schwarz: ["schwarz", "black"], rollschuhe: ["Rollschuhe", "roller skates"] } },
    ] },
    { id: "schmuck", symbol: "💍", titel: ["Schmuck", "Jewelry"], optionen: [
      { key: "schmuck", label: ["Schmuck", "Jewelry"], werte: ["keiner", "ohrring", "kette", "beides"], namen: { keiner: ["keiner", "none"], ohrring: ["Ohrring", "earring"], kette: ["Kette", "necklace"], beides: ["beides", "both"] } },
    ] },
    { id: "koerper", symbol: "💪", titel: ["Körper", "Body"], optionen: [
      { key: "hals", label: ["Hals", "Neck"], werte: ["normal", "giraffe"], frei: 1, preis: { giraffe: 90 }, namen: { normal: ["normal", "normal"], giraffe: ["Giraffenhals", "giraffe neck"] } },
      { key: "bauch", label: ["Bauch", "Belly"], werte: ["schmal", "normal", "kräftig", "kugel"], preis: { kugel: 90 }, namen: { schmal: ["schmal", "slim"], normal: ["normal", "normal"], "kräftig": ["kräftig", "big"], kugel: ["Kugelbauch", "ball belly"] } },
      { key: "brust", label: ["Brust/Schultern", "Chest/shoulders"], werte: ["schmal", "normal", "kräftig"], namen: { schmal: ["schmal", "narrow"], normal: ["normal", "normal"], "kräftig": ["breit", "broad"] } },
      { key: "muskeln", label: ["Muskeln", "Muscles"], werte: ["schmal", "normal", "kräftig", "hulk"], frei: 3, preis: { hulk: 90 }, namen: { schmal: ["dünn", "thin"], normal: ["normal", "normal"], "kräftig": ["stark", "strong"], hulk: ["Hulk", "Hulk"] } },
      { key: "fuesse", label: ["Füße", "Feet"], werte: ["normal", "riesen"], frei: 1, preis: { riesen: 90 }, namen: { normal: ["normal", "normal"], riesen: ["Riesenfüße", "giant feet"] } },
      { key: "power", label: ["Power-Körper nach Punkten", "Power body by points"], werte: ["aus", "an"], namen: { aus: ["aus", "off"], an: ["an", "on"] } },
    ] },
    { id: "aura", symbol: "✨", titel: ["Aura", "Aura"], optionen: [
      { key: "aura", label: ["Superkraft-Aura", "Super aura"], werte: ["aus", "an"], namen: { aus: ["aus", "off"], an: ["an", "on"] } },
    ] },
    // Extras (Entwurf 30.10., noch nicht freigegeben): Rucksack und Handschuhe; Rollschuhe sind ein Wert der Option schuhe
    { id: "extras", symbol: "🎒", titel: ["Extras", "Extras"], optionen: [
      { key: "rucksack", label: ["Rucksack", "Backpack"], werte: ["keiner", "blau", "rot", "regenbogen"], frei: 1, preis: { regenbogen: 90 },
        namen: { keiner: ["keiner", "none"], blau: ["blau", "blue"], rot: ["rot", "red"], regenbogen: ["Regenbogen", "rainbow"] } },
      { key: "handschuhe", label: ["Handschuhe", "Gloves"], werte: ["keine", "weiß", "schwarz", "boxhandschuhe"], frei: 1, preis: { boxhandschuhe: 90 },
        namen: { keine: ["keine", "none"], "weiß": ["weiß", "white"], schwarz: ["schwarz", "black"], boxhandschuhe: ["Boxhandschuhe", "boxing gloves"] } },
    ] },
  ];
  const SKIN_OPTIONEN = SKIN_GRUPPEN.flatMap((g) => g.optionen);
  const SKIN_STANDARD = {
    haar: "kurz", haarfarbe: "braun", haarschmuck: "keiner", hut: "cap", brille: "aus", nase: "rund", bart: "aus", schmuck: "keiner",
    top: "shirt", topfarbe: "rot", schuhe: "weiß", aura: "aus", hals: "normal", bauch: "normal", brust: "normal", muskeln: "normal", fuesse: "normal", power: "an",
    rucksack: "keiner", handschuhe: "keine",
  };
  const STUFE = { schmal: 0, normal: 1, "kräftig": 2, kugel: 3, hulk: 3 };   // Stufe 3 nur bei Bauch (Kugelbauch) und Muskeln (Hulk)
  const FARBEN = { braun: "#6b3e1e", blond: "#e7c35a", schwarz: "#1a1a1a", rot: "#c8283a", blau: "#1d3f8f", gelb: "#e0a400", "grün": "#2e9e5b", "weiß": "#f4f4f4" };
  // Haarfarben: eigene Tabelle (Oberteil/Schuhe behalten FARBEN); regenbogen = senkrechter Verlauf, Regenbogen-Mohawk ist immer bunt
  const HAARFARBEN = Object.assign({}, FARBEN, { pink: "#ff3fa4", "türkis": "#19d3c5", lila: "#8a3ffc", "neongrün": "#7CFC00", feuerrot: "#ff3b1f", blau: "#2a6cff", silber: "#c9ced6", regenbogen: "regenbogen" });
  const REGENBOGEN = ["#ff2d2d", "#ff9f1a", "#ffe21a", "#2ecc71", "#2a8cff", "#9b4dff"];
  // frei ohne Kauf: die ersten n Werte einer Option (Standard 2); alles andere ist ein Shop-Artikel skin_<key>_<wert> (45 Coins, Ausgefallenes 90: o.preis[wert])
  const SKIN_PREIS = 45;
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
    schuhe: { "weiß": "White shoes", rot: "Red shoes", schwarz: "Black shoes", rollschuhe: "Roller skates" },
    aura: { aus: "Aura off", an: "Super aura on" },
    hals: { normal: "Normal neck", giraffe: "Giraffe neck" },
    bauch: { schmal: "Slim belly", normal: "Normal belly", "kräftig": "Big belly", kugel: "Ball belly" },
    brust: { schmal: "Narrow shoulders", normal: "Normal shoulders", "kräftig": "Broad shoulders" },
    muskeln: { schmal: "Thin arms", normal: "Normal arms", "kräftig": "Strong arms", hulk: "Hulk arms" },
    fuesse: { normal: "Normal feet", riesen: "Giant feet" },
    power: { aus: "Power body off", an: "Power body on" },
    rucksack: { keiner: "No backpack", blau: "Blue backpack", rot: "Red backpack", regenbogen: "Rainbow backpack" },
    handschuhe: { keine: "No gloves", "weiß": "White gloves", schwarz: "Black gloves", boxhandschuhe: "Boxing gloves" },
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
  const kurzDe = (de) => String(de || "").replace(/\(.*?\)/g, "").split(/[,;]/)[0].replace(/\s+/g, " ").trim();   // erst Klammern weg (auch mit Komma darin: „die (Wand-, Turm)uhr“), dann die erste Bedeutung

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
    // Welt 2 Route 66: Kojote heult, Roadrunner „meep meep“, Gürteltier rasselt/rollt, Ölfleck quietscht, Auto rauscht vorbei, Big Rig Bob hupt + Diesel
    kojote() { ton(380, 0.5, "sine", 0.035, 0, 720); ton(700, 0.4, "sine", 0.03, 0.45, 420); },
    roadrunner() { ton(1100, 0.07, "square", 0.03, 0, 1500); ton(1100, 0.07, "square", 0.03, 0.11, 1500); },
    guerteltier() { for (let i = 0; i < 4; i++) ton(160 + i * 10, 0.05, "sawtooth", 0.03, i * 0.07); rauschen(0.3, 0.025, 0, { typ: "lowpass", freq: 500 }); },
    rollt() { rauschen(0.5, 0.04, 0, { typ: "lowpass", freq: 600 }); ton(140, 0.4, "sawtooth", 0.03, 0, 90); },
    rutsch() { ton(1500, 0.35, "sine", 0.04, 0, 900); rauschen(0.3, 0.03, 0, { typ: "bandpass", freq: 2200 }); },
    auto() { rauschen(0.45, 0.035, 0, { typ: "lowpass", freq: 700 }); ton(90, 0.4, "sawtooth", 0.025, 0, 60); },
    hupe() { ton(185, 0.75, "sawtooth", 0.07); ton(233, 0.75, "sawtooth", 0.06); ton(185, 0.5, "sawtooth", 0.06, 0.95); ton(233, 0.5, "sawtooth", 0.05, 0.95); },
    diesel() { ton(60, 1.2, "sawtooth", 0.07, 0, 48); ton(45, 1.3, "square", 0.04, 0.1); rauschen(1.0, 0.03, 0, { typ: "lowpass", freq: 300 }); },
    // Welt 3 Grand Canyon: Klapperschlange rasselt, Geier krächzt, Skorpion klickt, Stein rumpelt (Warnung) und schlägt auf, Brücke knarrt und bricht, Sheriff Rattlesnake rasselt lang + Grollen
    klapperschlange() { for (let i = 0; i < 7; i++) rauschen(0.035, 0.04, i * 0.05, { typ: "bandpass", freq: 3200 }); },
    geier() { ton(760, 0.22, "sawtooth", 0.03, 0, 420); ton(720, 0.2, "sawtooth", 0.028, 0.26, 400); },
    skorpion() { for (let i = 0; i < 3; i++) ton(2100, 0.03, "square", 0.03, i * 0.08, 1500); },
    rumpeln() { rauschen(0.5, 0.035, 0, { typ: "lowpass", freq: 220 }); ton(48, 0.5, "sawtooth", 0.03, 0, 40); },
    stein() { ton(120, 0.2, "sine", 0.1, 0, 45); rauschen(0.18, 0.06, 0, { typ: "lowpass", freq: 500 }); },
    knarren() { ton(240, 0.35, "sawtooth", 0.03, 0, 170); ton(260, 0.3, "sawtooth", 0.025, 0.3, 180); },
    bruch() { rauschen(0.12, 0.07, 0, { typ: "bandpass", freq: 900 }); ton(300, 0.15, "square", 0.05, 0.02, 90); rauschen(0.3, 0.04, 0.12, { typ: "lowpass", freq: 400 }); },
    rassel() { for (let i = 0; i < 16; i++) rauschen(0.04, 0.05, i * 0.055, { typ: "bandpass", freq: 3000 }); ton(70, 1.0, "sawtooth", 0.07, 0.2); ton(55, 0.9, "sawtooth", 0.05, 0.5); },
    // Welt 4 Mount Rushmore: Büffel trampelt, Biber nagt (Klicks), Adler schreit, Baumstamm rumpelt beim Rollen, Blätter rascheln (Wind-Warnung), Böe rauscht, Bär knurrt (Vorwarnung) + Pranke zischt, Grizzly Grandpa brummt und gähnt
    bueffel() { for (let i = 0; i < 4; i++) { ton(70, 0.12, "sine", 0.09, i * 0.13, 40); rauschen(0.08, 0.04, i * 0.13, { typ: "lowpass", freq: 250 }); } },
    biber() { for (let i = 0; i < 5; i++) ton(1800 + (i % 2) * 300, 0.025, "square", 0.03, i * 0.06); },
    adler() { ton(2200, 0.45, "sawtooth", 0.03, 0, 900); ton(2400, 0.3, "sine", 0.025, 0.05, 1100); },
    stamm() { rauschen(0.7, 0.04, 0, { typ: "lowpass", freq: 320 }); for (let i = 0; i < 4; i++) ton(90, 0.08, "sine", 0.05, i * 0.16, 60); },
    blaetter() { for (let i = 0; i < 4; i++) rauschen(0.05, 0.03, i * 0.1, { typ: "highpass", freq: 2500 }); },
    wind() { rauschen(1.3, 0.05, 0, { typ: "bandpass", freq: 900 }); ton(500, 1.2, "sine", 0.02, 0.1, 900); },
    baer() { ton(95, 0.4, "sawtooth", 0.04, 0, 130); ton(120, 0.3, "sawtooth", 0.035, 0.3, 80); },
    pranke() { rauschen(0.18, 0.06, 0, { typ: "bandpass", freq: 1500 }); ton(600, 0.15, "sine", 0.04, 0, 200); },
    brummen() { ton(60, 1.4, "sawtooth", 0.09, 0, 45); ton(90, 1.2, "square", 0.04, 0.1, 70); rauschen(1.2, 0.03, 0, { typ: "lowpass", freq: 200 }); ton(220, 0.9, "sine", 0.06, 1.0, 330); ton(330, 0.7, "sine", 0.05, 1.7, 180); },   // Grollen, dann Gähnen (auf und ab)
    // Welt 5 Golden Gate: Möwe kreischt, Seelöwe bellt, Skater rollt (Rollen + Klick), Möwe klaut (Diamant-Jingle rückwärts), Surfbrett rauscht (Welle), Gondel knarrt, Captain Fog = Nebelhorn (zwei tiefe Stöße + Meeresrauschen)
    moewe() { ton(1500, 0.18, "sawtooth", 0.03, 0, 900); ton(1700, 0.14, "sawtooth", 0.028, 0.22, 1000); },
    seeloewe() { for (let i = 0; i < 2; i++) { ton(150, 0.16, "square", 0.04, i * 0.24, 110); rauschen(0.12, 0.035, i * 0.24, { typ: "bandpass", freq: 600 }); } },
    skater() { rauschen(0.45, 0.035, 0, { typ: "bandpass", freq: 1800 }); for (let i = 0; i < 3; i++) ton(900, 0.03, "square", 0.025, 0.1 + i * 0.12); },
    klau() { [1760, 1320, 880].forEach((f, i) => ton(f, 0.14, "triangle", 0.09, i * 0.09)); rauschen(0.08, 0.04, 0, { typ: "bandpass", freq: 1400 }); },
    welle() { rauschen(0.55, 0.05, 0, { typ: "bandpass", freq: 700 }); ton(280, 0.45, "sine", 0.03, 0, 620); },
    gondel() { ton(230, 0.3, "sawtooth", 0.025, 0, 180); },
    nebelhorn() { ton(110, 1.5, "sawtooth", 0.09); ton(138, 1.5, "sawtooth", 0.05); ton(55, 1.6, "sine", 0.07); rauschen(2.6, 0.025, 0, { typ: "lowpass", freq: 400 }); ton(110, 0.9, "sawtooth", 0.08, 1.8); ton(138, 0.9, "sawtooth", 0.045, 1.8); ton(55, 1.0, "sine", 0.06, 1.8); },
    // Welt Westminster (Klasse 6): Stadtfuchs kläfft, Pfütze platscht, Bus brummt + Klingel, Sergeant Bearskin = Trommelwirbel + kurzes Marsch-Signal; Cameo = Wusch + Glitzern, Schild = heller Gong
    fuchs() { ton(900, 0.08, "square", 0.03, 0, 600); ton(950, 0.08, "square", 0.028, 0.14, 620); },
    platsch() { rauschen(0.25, 0.05, 0, { typ: "bandpass", freq: 1200 }); ton(600, 0.15, "sine", 0.04, 0, 250); },
    bus() { rauschen(0.5, 0.035, 0, { typ: "lowpass", freq: 500 }); ton(70, 0.45, "sawtooth", 0.03, 0, 55); ton(1320, 0.08, "triangle", 0.035, 0.1); ton(1320, 0.08, "triangle", 0.035, 0.22); },
    trommel() { for (let i = 0; i < 18; i++) rauschen(0.04, 0.02 + i * 0.003, i * 0.045, { typ: "bandpass", freq: 2600 }); rauschen(0.12, 0.09, 0.84, { typ: "bandpass", freq: 1800 }); ton(90, 0.2, "sine", 0.08, 0.84, 60); },
    signal() { [392, 523, 659, 784, 659, 784].forEach((f, i) => ton(f, i === 5 ? 0.5 : 0.16, "triangle", 0.08, 1.05 + i * 0.17)); },
    cameo() { rauschen(0.35, 0.04, 0, { typ: "highpass", freq: 1800 }); [1047, 1319, 1568, 2093].forEach((f, i) => ton(f, 0.12, "triangle", 0.07, 0.12 + i * 0.07)); },
    schild() { ton(880, 0.4, "sine", 0.08); ton(1320, 0.35, "sine", 0.05, 0.05); },
    // Story-Modus: Kristall = Harfen-Arpeggio (anders als der Diamant-/Wort-Jingle), Puff = verschwindendes ♪ an der Gabelung, Station = zwei weiche Glocken
    kristall() { [784, 988, 1175, 1568].forEach((f, i) => ton(f, 0.32, "sine", 0.07, i * 0.06)); ton(392, 0.5, "triangle", 0.04); },
    puff() { rauschen(0.22, 0.04, 0, { typ: "lowpass", freq: 1200 }); ton(700, 0.18, "sine", 0.03, 0, 300); },
    station() { ton(523, 0.6, "sine", 0.06); ton(784, 0.7, "sine", 0.05, 0.18); },
  };

  /* ---------- Figur v2 (29.10.; Vorschlag docs/runner/figur-vorschlaege, Entscheidungen Mr. Alex) ---------- */
  // (x, y) = Fußpunkt Mitte, h = Körperhöhe in 80 Einheiten (die Figur selbst ist ≈ 88 hoch, Kopf ≈ 1/3), pose = 'lauf' | 'sprung' | 'steh', t = Zeit.
  // ausdruck = 'grinsend' (Standard) | 'erstaunt' (Treffer) | 'zunge' (On fire / 5× Combo) – Spielreaktion, keine Skin-Option; Sonnenbrille (s.brille) = „cool“.
  // Ebenen: Aura → Beine → Shorts → hinterer Arm → Rucksack → Hals → Torso (+ Rucksack-Träger) → vorderer Arm → Haare hinten → Kopf → Gesicht → Bart → Haare vorn → Haarschmuck → Hut.
  // Extras (Entwurf 30.10.): Rucksack (s.rucksack, wippt beim Laufen), Handschuhe an beiden Händen (s.handschuhe; Boxhandschuhe groß und rot),
  // Rollschuhe (s.schuhe = rollschuhe): Stiefel + Schiene + 2 Rollen (3 bei Riesenfüßen), Rollen drehen sich beim Laufen, Beine in Gleit-Haltung (weniger ausladend); Sprung normal.
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
    const rollschuhe = s.schuhe === 'rollschuhe', rucksack = s.rucksack && s.rucksack !== 'keiner' ? s.rucksack : null;
    const handschuhe = s.handschuhe && s.handschuhe !== 'keine' ? s.handschuhe : null, boxen = handschuhe === 'boxhandschuhe';
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
    if (pose === 'lauf' && rollschuhe) {   // Gleiten: halbes Tempo, kurze Schritte, Rollen bleiben fast am Boden
      const q = p * 0.5;
      beinHinten = { fx: -3 + 7 * Math.sin(q), fy: -Math.max(0, -Math.cos(q)) * 3 };
      beinVorn   = { fx: 4 + 7 * Math.sin(q + Math.PI), fy: -Math.max(0, Math.cos(q)) * 3 };
    } else if (pose === 'lauf') {
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
      if (rollschuhe) {   // Stiefel (weiß, hoher Schaft) auf Schiene, Rollen orange mit Speichen; Riesenfüße: langer Stiefel, 3 Rollen
        const lang = riesenfuss ? 15 : 8.5, mx = b.fx + (riesenfuss ? 9 : 3), oben = b.fy - 6;
        c.fillStyle = '#f4f4f4';
        c.beginPath(); c.roundRect(b.fx - 3.5, oben - 8, 8, 9, 2.5); c.fill(); c.stroke();                 // Schaft
        c.beginPath(); c.ellipse(mx, oben, lang, 4.2, 0, 0, Math.PI * 2); c.fill(); c.stroke();          // Stiefel
        c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(b.fx - 1, oben - 6); c.lineTo(b.fx + 3, oben - 6); c.moveTo(b.fx - 1, oben - 3); c.lineTo(b.fx + 3.5, oben - 3); c.stroke(); // Schnürung
        c.fillStyle = '#555'; c.beginPath(); c.roundRect(mx - lang + 2, oben + 2.2, lang * 2 - 4, 2.6, 1); c.fill();   // Schiene
        const rollen = riesenfuss ? [mx - lang + 5, mx, mx + lang - 5] : [mx - lang + 4.5, mx + lang - 4.5];
        const dreh = pose === 'lauf' ? t * 14 : 0, r = 2.9, ry = b.fy + 0.2;
        for (const rx of rollen) {
          c.fillStyle = '#ff7a1a'; c.beginPath(); c.arc(rx, ry, r, 0, Math.PI * 2); c.fill();
          c.strokeStyle = '#333'; c.lineWidth = 0.9; c.stroke();
          c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 1;
          c.beginPath(); c.moveTo(rx + Math.cos(dreh) * r, ry + Math.sin(dreh) * r); c.lineTo(rx - Math.cos(dreh) * r, ry - Math.sin(dreh) * r);
          c.moveTo(rx - Math.sin(dreh) * r, ry + Math.cos(dreh) * r); c.lineTo(rx + Math.sin(dreh) * r, ry - Math.cos(dreh) * r); c.stroke();   // Speichen drehen mit t
          c.fillStyle = '#fff'; c.beginPath(); c.arc(rx, ry, 0.8, 0, Math.PI * 2); c.fill();
        }
      } else if (riesenfuss) {
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
      const hx = ex + Math.cos(w) * 10, hy = ey - Math.sin(w) * 10 + 6;   // Hand
      c.beginPath(); c.moveTo(AX, AY); c.lineTo(ex, ey); c.lineTo(hx, hy); c.stroke();
      if (musk >= 2) { c.lineWidth = armB + (hulk ? 6 : 3); c.beginPath(); c.moveTo(AX, AY); c.lineTo(AX + (ex - AX) * 0.6, AY + (ey - AY) * 0.6); c.stroke(); }
      if (handschuhe) {   // Handschuh an der Hand: weiß/schwarz als Faust mit Bündchen; Boxhandschuhe groß, rot, mit Daumen
        const hinten = farbe === hautD;
        if (boxen) {
          c.fillStyle = hinten ? '#b31f2e' : '#e0232f'; c.beginPath(); c.ellipse(hx + 1, hy + 1, 7.5, 6.5, w * 0.3, 0, Math.PI * 2); c.fill();
          c.beginPath(); c.arc(hx - 3, hy - 3.5, 3.2, 0, Math.PI * 2); c.fill();                      // Daumen
          c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; c.beginPath(); c.ellipse(hx + 1, hy + 1, 7.5, 6.5, w * 0.3, 0, Math.PI * 2); c.stroke();
          c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.ellipse(hx + 2.5, hy - 1.5, 3, 1.8, -0.4, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#f4f4f4'; c.beginPath(); c.arc(hx - 4, hy - 0.5, 2.6, 0, Math.PI * 2); c.fill();   // Bündchen (weiß)
        } else {
          const gf = handschuhe === 'schwarz' ? (hinten ? '#2a2a2a' : '#1a1a1a') : (hinten ? '#d8d8d8' : '#f4f4f4');
          c.fillStyle = gf; c.beginPath(); c.arc(hx, hy, armB * 0.5 + 2.2, 0, Math.PI * 2); c.fill();
          c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 0.9; c.stroke();
          c.strokeStyle = handschuhe === 'schwarz' ? '#777' : '#c8283a'; c.lineWidth = 1.6;
          c.beginPath(); c.arc(hx, hy, armB * 0.5 + 2.2, w + Math.PI * 0.6, w + Math.PI * 1.4); c.stroke();   // Bündchen zur Armseite
        }
      }
      if (hulk) { c.fillStyle = farbe; c.beginPath(); c.arc(AX + (ex - AX) * 0.45, AY + (ey - AY) * 0.45, 8.5, 0, Math.PI * 2); c.fill();     // Bizeps
        c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.arc(AX + (ex - AX) * 0.4 - 2, AY + (ey - AY) * 0.4 - 2.5, 2.6, 0, Math.PI * 2); c.fill(); }
    };
    arm(-armWinkel, hautD);

    // ---- Rucksack (hinter dem Torso am Rücken, wippt beim Laufen; Träger kommen nach dem Torso vorn über die Schultern)
    const ruckF = rucksack === 'rot' ? '#d7263d' : rucksack === 'blau' ? '#1f6fe0' : '#ffb000';
    const ruckWipp = pose === 'lauf' ? Math.sin(t * 13 + 1) * 1.5 : 0;
    const rbx = -Math.max(sw, hw) - 1;   // Rückenkante
    if (rucksack) {
      const rx0 = rbx - 9, ry0 = SCH + 3 + ruckWipp, rw = 13, rh = 23;   // liegt 3–4 Einheiten unter der Rückenkante (Torso deckt den Rand)
      if (rucksack === 'regenbogen') {   // waagerechte Streifen
        c.save(); c.beginPath(); c.roundRect(rx0, ry0, rw, rh, 4); c.clip();
        REGENBOGEN.forEach((col, i) => { c.fillStyle = col; c.fillRect(rx0, ry0 + i * rh / REGENBOGEN.length, rw, rh / REGENBOGEN.length + 0.5); });
        c.restore();
      } else { c.fillStyle = ruckF; c.beginPath(); c.roundRect(rx0, ry0, rw, rh, 4); c.fill(); }
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; c.beginPath(); c.roundRect(rx0, ry0, rw, rh, 4); c.stroke();
      c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.roundRect(rx0 + 2, ry0 + 11, rw - 4, 8, 2.5); c.fill();   // Vortasche
      c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.roundRect(rx0 + 2, ry0 + 3, rw - 4, 2, 1); c.fill();   // Reißverschluss
      c.strokeStyle = '#333'; c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(rx0 + 3, ry0 - 1); c.quadraticCurveTo(rx0 + rw / 2, ry0 - 5, rx0 + rw - 3, ry0 - 1); c.stroke();   // Griff
    }

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
    if (rucksack) {   // Träger vorn über beide Schultern (dunkler Ton des Rucksacks, Regenbogen: dunkelgrau)
      c.strokeStyle = rucksack === 'regenbogen' ? '#444' : rucksack === 'rot' ? '#8f1526' : '#123f8a'; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(sw - 5, SCH + 1); c.quadraticCurveTo(sw - 6, -40, sw - 7, -31); c.moveTo(-2, SCH + 1); c.quadraticCurveTo(-3, -40, -4, -31); c.stroke();
      c.fillStyle = '#ddd'; c.beginPath(); c.roundRect(sw - 8, -41, 4, 3, 1); c.fill(); c.beginPath(); c.roundRect(-5, -41, 4, 3, 1); c.fill();   // Schnallen
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

  /* ---------- Level (aus Abschnitts-Mustern je Welt; ≈ 28.000 Einheiten, ≥ 2 Minuten) ---------- */
  const KISTE = 40, TRITT_W = 56;   // Kiste/Block 40 × 40; Trittstein im Bach (Welt 4) 56 breit
  // Welt-Muster: jeder Abschnitt ist (h) => { … h.vor(breite) } mit h = { plat, kiste, dia, geg, luecke, tor, cp, auto, oel, vor }
  const MUSTER_NY = [
      (h) => { h.dia(350); h.kiste(650); h.vor(900); },                                             // 1 Aufwärmen
      (h) => { h.plat(150, 235, 160); h.dia(230, 195); h.geg('taube', 500, 720); h.vor(950); },       // 2 Plattform + Taube
      (h) => { h.kiste(200); h.kiste(240, 2); h.dia(260, 215); h.vor(750); },                          // 3 Kistenstufe
      (h) => { h.luecke(250, 170); h.vor(950); },                                                  // 4 erste Lücke
      (h) => { h.geg('waschbaer', 150, 450); h.plat(650, 240, 150); h.dia(725, 200); h.vor(1000); },   // 5 Waschbär + Plattform
      (h) => { h.kiste(150); h.kiste(190, 2); h.kiste(230, 3); h.dia(250, 180); h.vor(800); },           // 6 Treppe hoch (elevator)
      (h) => { h.geg('eichhoernchen', 200, 600); h.vor(800); },                                    // 7 Eichhörnchen
      (h) => { h.luecke(200, 200); h.plat(150, 230, 300); h.dia(300, 190); h.vor(900); },              // 8 Plattform über Lücke
      (h) => { h.geg('taube', 200, 400); h.kiste(600); h.vor(850); },                                // 9
      (h) => { h.plat(100, 245, 140); h.plat(380, 185, 140); h.dia(450, 145); h.vor(950); },           // 10 Doppelplattform
      (h) => { h.tor(400, 4, [5, 1]); h.vor(900); },                                               // 11 TOR 1: Aufzug → elevator
      (h) => { h.cp(150); h.geg('waschbaer', 450, 750); h.vor(1000); },                              // 12 CHECKPOINT 1
      (h) => { h.luecke(250, 160); h.luecke(660, 160); h.vor(1150); },                               // 13 Doppellücke
      (h) => { h.kiste(200, 2); h.kiste(240, 2); h.geg('eichhoernchen', 450, 800); h.vor(1000); },     // 14 Kistenmauer
      (h) => { h.plat(150, 240, 160); h.plat(400, 180, 160); h.plat(650, 240, 160); h.dia(480, 140); h.vor(1050); }, // 15 Dreier-Plattform
      (h) => { h.geg('taube', 150, 350); h.luecke(500, 180); h.vor(1100); },                         // 16
      (h) => { h.kiste(150); h.kiste(190); h.kiste(230); h.geg('waschbaer', 500, 800); h.vor(1000); },   // 17 Kistenreihe
      (h) => { h.plat(200, 235, 200); h.dia(300, 195); h.kiste(650); h.vor(950); },                    // 18
      (h) => { h.geg('eichhoernchen', 150, 500); h.luecke(650, 170); h.vor(1050); },                 // 19
      (h) => { h.dia(200); h.plat(450, 240, 140); h.plat(700, 175, 140); h.dia(770, 135); h.vor(1050); },// 20 (debate, contract)
      (h) => { h.tor(350, 10, [7, 9]); h.vor(850); },                                              // 21 TOR 2: Vertrag → contract
      (h) => { h.cp(150); h.kiste(500); h.kiste(540, 2); h.vor(850); },                                // 22 CHECKPOINT 2
      (h) => { h.geg('waschbaer', 100, 400); h.geg('taube', 550, 750); h.vor(1000); },               // 23 Gegner-Paar
      (h) => { h.luecke(200, 190); h.plat(150, 230, 320); h.dia(310, 190); h.geg('eichhoernchen', 650, 950); h.vor(1150); }, // 24
      (h) => { h.kiste(150); h.kiste(190, 2); h.kiste(230, 3); h.kiste(270, 2); h.kiste(310); h.vor(750); }, // 25 Pyramide
      (h) => { h.geg('taube', 150, 350); h.luecke(500, 160); h.geg('waschbaer', 800, 1050); h.vor(1200); }, // 26
      (h) => { h.plat(150, 240, 150); h.plat(400, 180, 150); h.plat(650, 240, 150); h.geg('eichhoernchen', 850, 1100); h.vor(1250); }, // 27
      (h) => { h.luecke(200, 170); h.kiste(600); h.kiste(640); h.vor(950); },                          // 28
  ];
  // Welt 2 Route 66: Verkehr (Autos/Trucks fahren von rechts nach links, drüberspringen), Ölflecken (rutschen), Reifenstapel statt Kisten; Lücken = Baugruben
  const MUSTER_ROUTE66 = [
    (h) => { h.dia(350); h.kiste(650); h.vor(900); },                                                   // 1 Aufwärmen
    (h) => { h.auto('auto', 150, 950); h.dia(500, 250); h.vor(1000); },                                 // 2 erstes Auto
    (h) => { h.plat(150, 235, 160); h.dia(230, 195); h.geg('kojote', 450, 750); h.vor(950); },          // 3 Plattform + Kojote
    (h) => { h.kiste(200); h.kiste(240, 2); h.dia(260, 215); h.vor(750); },                             // 4 Reifenstufe
    (h) => { h.oel(300); h.geg('roadrunner', 500, 900); h.vor(1000); },                                 // 5 Ölfleck + Roadrunner
    (h) => { h.luecke(250, 170); h.vor(950); },                                                         // 6 erste Baugrube
    (h) => { h.auto('truck', 100, 1000); h.plat(600, 230, 160); h.dia(680, 190); h.vor(1100); },        // 7 Truck + Plattform
    (h) => { h.geg('guerteltier', 150, 500); h.kiste(650); h.kiste(690, 2); h.dia(710, 220); h.vor(900); }, // 8 Gürteltier
    (h) => { h.auto('auto', 100, 900); h.oel(550); h.vor(1000); },                                      // 9 Auto + Öl
    (h) => { h.plat(100, 245, 140); h.plat(380, 185, 140); h.dia(450, 145); h.vor(950); },              // 10 Doppelplattform
    (h) => { h.tor(400, 4, [5, 1]); h.vor(900); },                                                      // 11 TOR 1
    (h) => { h.cp(150); h.geg('kojote', 450, 750); h.vor(1000); },                                      // 12 CHECKPOINT 1
    (h) => { h.auto('auto', 100, 1000); h.dia(500, 250); h.auto('truck', 1000, 1900); h.vor(2000); },   // 13 Verkehr
    (h) => { h.kiste(200, 2); h.kiste(240, 2); h.geg('roadrunner', 450, 850); h.vor(1000); },           // 14 Reifenmauer + Roadrunner
    (h) => { h.luecke(250, 160); h.oel(600); h.vor(1000); },                                            // 15 Baugrube + Öl
    (h) => { h.plat(150, 240, 160); h.plat(400, 180, 160); h.plat(650, 240, 160); h.dia(480, 140); h.vor(1050); }, // 16 Dreier-Plattform
    (h) => { h.geg('guerteltier', 150, 450); h.auto('auto', 500, 1300); h.vor(1400); },                 // 17 Gürteltier + Auto
    (h) => { h.plat(200, 235, 200); h.dia(300, 195); h.kiste(650); h.vor(950); },                       // 18
    (h) => { h.oel(200); h.geg('kojote', 450, 800); h.vor(1000); },                                     // 19 Öl + Kojote
    (h) => { h.dia(200); h.plat(450, 240, 140); h.plat(700, 175, 140); h.dia(770, 135); h.vor(1050); }, // 20
    (h) => { h.tor(350, 10, [7, 9]); h.vor(850); },                                                     // 21 TOR 2
    (h) => { h.cp(150); h.kiste(500); h.kiste(540, 2); h.vor(850); },                                   // 22 CHECKPOINT 2
    (h) => { h.auto('truck', 100, 1000); h.geg('roadrunner', 1000, 1400); h.vor(1500); },               // 23 Truck + Roadrunner
    (h) => { h.luecke(200, 190); h.plat(150, 230, 320); h.geg('guerteltier', 650, 950); h.vor(1150); },                // 24 Plattform über Grube + Gürteltier
    (h) => { h.kiste(150); h.kiste(190, 2); h.kiste(230, 3); h.kiste(270, 2); h.kiste(310); h.vor(750); }, // 25 Reifen-Pyramide
    (h) => { h.oel(150); h.auto('auto', 300, 1100); h.geg('kojote', 1150, 1400); h.vor(1500); },        // 26 Öl + Auto + Kojote
    (h) => { h.plat(150, 240, 150); h.plat(400, 180, 150); h.plat(650, 240, 150); h.geg('roadrunner', 850, 1250); h.vor(1300); }, // 27
    (h) => { h.luecke(200, 170); h.auto('truck', 500, 1300); h.kiste(1350); h.vor(1500); },             // 28 Schluss-Verkehr
  ];
  // Welt 3 Grand Canyon: fallende Steine (h.stein: Warnung, wenn die Figur ≈ 300 davor ist → landet kurz vor ihr → drüberspringen), Hängebrücken (h.bruecke: Lücke + Brücke,
  // > 1,5 s Bodenzeit → Brett bricht → Sturz; eine Brücke ≥ 420 schafft man nur mit Sprung), Kakteen (h.kaktus: Berührung = Leben weg), Felsbrocken statt Kisten
  const MUSTER_AZ = [
    (h) => { h.dia(350); h.kiste(650); h.vor(900); },                                                   // 1 Aufwärmen
    (h) => { h.kaktus(300); h.dia(520, 250); h.geg('klapperschlange', 650, 950); h.vor(1050); },        // 2 Kaktus + Klapperschlange
    (h) => { h.plat(150, 235, 160); h.dia(230, 195); h.stein(700); h.vor(1000); },                      // 3 Plattform + erster Stein
    (h) => { h.kiste(200); h.kiste(240, 2); h.dia(260, 215); h.vor(750); },                             // 4 Felsstufe
    (h) => { h.bruecke(250, 300); h.vor(850); },                                                        // 5 erste (kurze) Hängebrücke
    (h) => { h.geg('geier', 250, 550); h.kaktus(700); h.vor(950); },                                    // 6 Geier + Kaktus
    (h) => { h.stein(450); h.plat(650, 230, 160); h.dia(730, 190); h.vor(1050); },                      // 7 Stein + Plattform
    (h) => { h.geg('skorpion', 150, 550); h.kiste(650); h.kiste(690, 2); h.dia(710, 220); h.vor(900); },// 8 Skorpion + Felsen
    (h) => { h.kaktus(200); h.kaktus(360); h.vor(900); },                                               // 9 Kaktus-Paar
    (h) => { h.plat(100, 245, 140); h.plat(380, 185, 140); h.dia(450, 145); h.vor(950); },              // 10 Doppelplattform
    (h) => { h.tor(400, 4, [5, 1]); h.vor(900); },                                                      // 11 TOR 1
    (h) => { h.cp(150); h.geg('klapperschlange', 450, 800); h.vor(1000); },                             // 12 CHECKPOINT 1
    (h) => { h.bruecke(200, 420); h.dia(410, 240); h.vor(1000); },                                      // 13 lange Brücke (Sprung nötig)
    (h) => { h.stein(350); h.kaktus(600); h.vor(1000); },                                               // 14 Stein, dann Kaktus
    (h) => { h.kiste(200, 2); h.kiste(240, 2); h.geg('skorpion', 450, 850); h.vor(1000); },             // 15 Felsmauer + Skorpion
    (h) => { h.plat(150, 240, 160); h.plat(400, 180, 160); h.plat(650, 240, 160); h.dia(480, 140); h.vor(1050); }, // 16 Dreier-Plattform
    (h) => { h.geg('geier', 150, 450); h.stein(750); h.vor(1100); },                                    // 17 Geier + Stein
    (h) => { h.plat(200, 235, 200); h.dia(300, 195); h.kaktus(650); h.vor(950); },                      // 18 Plattform + Kaktus
    (h) => { h.bruecke(250, 340); h.geg('klapperschlange', 700, 1000); h.vor(1150); },                  // 19 Brücke, dahinter Schlange
    (h) => { h.dia(200); h.plat(450, 240, 140); h.plat(700, 175, 140); h.dia(770, 135); h.vor(1050); }, // 20
    (h) => { h.tor(350, 10, [7, 9]); h.vor(850); },                                                     // 21 TOR 2
    (h) => { h.cp(150); h.kiste(500); h.kiste(540, 2); h.vor(850); },                                   // 22 CHECKPOINT 2
    (h) => { h.stein(400); h.geg('skorpion', 550, 900); h.vor(1050); },                                 // 23 Stein + Skorpion
    (h) => { h.bruecke(200, 480); h.vor(1050); },                                                       // 24 längste Brücke (nur mit Sprung)
    (h) => { h.kaktus(150); h.kiste(350); h.kiste(390, 2); h.kiste(430, 3); h.kiste(470, 2); h.kiste(510); h.vor(900); }, // 25 Kaktus + Felspyramide
    (h) => { h.geg('geier', 150, 400); h.stein(600); h.kaktus(900); h.vor(1200); },                     // 26 Geier, Stein, Kaktus
    (h) => { h.plat(150, 240, 150); h.plat(400, 180, 150); h.plat(650, 240, 150); h.geg('klapperschlange', 850, 1150); h.vor(1300); }, // 27
    (h) => { h.bruecke(200, 360); h.stein(850); h.kiste(1150); h.vor(1400); },                          // 28 Schluss: Brücke + Stein
  ];
  // Welt 4 Mount Rushmore: rollende Baumstämme (h.stamm: rollen von rechts den Hang herunter, sobald die Figur ≈ 520 davor ist → drüberspringen), Bäche (h.bach: Lücke mit Wasser + 1–2 Trittsteine),
  // Windböen (h.wind(dx, richtung): 0,5 s Blätter als Warnung, dann 0,8 s Schub zurück (-1) oder vorwärts (+1), währenddessen halber Sprung), Bärenhöhlen (h.hoehle: Bär schaut 0,6 s heraus, dann Pranke davor), Holzstapel statt Kisten
  const MUSTER_SD = [
    (h) => { h.dia(350); h.kiste(650); h.vor(900); },                                                   // 1 Aufwärmen
    (h) => { h.stamm(700); h.dia(300, 250); h.vor(1000); },                                             // 2 erster Baumstamm
    (h) => { h.plat(150, 235, 160); h.dia(230, 195); h.geg('biber', 450, 750); h.vor(950); },           // 3 Plattform + Biber
    (h) => { h.kiste(200); h.kiste(240, 2); h.dia(260, 215); h.vor(750); },                             // 4 Holzstufe
    (h) => { h.bach(250, 200); h.vor(850); },                                                           // 5 erster Bach (ein Trittstein)
    (h) => { h.wind(150, -1); h.geg('adler', 500, 800); h.vor(1000); },                                 // 6 Gegenwind + Adler
    (h) => { h.hoehle(450); h.plat(700, 230, 160); h.dia(780, 190); h.vor(1050); },                     // 7 erste Bärenhöhle + Plattform
    (h) => { h.geg('bueffel', 150, 900); h.vor(1000); },                                                // 8 erster Büffel (nur überspringen!)
    (h) => { h.stamm(750); h.kiste(900); h.kiste(940, 2); h.dia(960, 220); h.vor(1150); },              // 9 Baumstamm, dann Holzstufe
    (h) => { h.plat(100, 245, 140); h.plat(380, 185, 140); h.dia(450, 145); h.vor(950); },              // 10 Doppelplattform
    (h) => { h.tor(400, 4, [5, 1]); h.vor(900); },                                                      // 11 TOR 1
    (h) => { h.cp(150); h.geg('biber', 450, 800); h.vor(1000); },                                       // 12 CHECKPOINT 1
    (h) => { h.bach(200, 300); h.dia(350, 240); h.vor(900); },                                          // 13 breiter Bach (zwei Trittsteine)
    (h) => { h.wind(150, 1); h.kiste(650); h.vor(1000); },                                              // 14 Rückenwind, dann Holzstapel
    (h) => { h.kiste(200, 2); h.kiste(240, 2); h.geg('adler', 500, 850); h.vor(1000); },                // 15 Holzmauer + Adler
    (h) => { h.plat(150, 240, 160); h.plat(400, 180, 160); h.plat(650, 240, 160); h.dia(480, 140); h.vor(1050); }, // 16 Dreier-Plattform
    (h) => { h.hoehle(400); h.geg('bueffel', 750, 1300); h.vor(1400); },                                // 17 Höhle, dann Büffel
    (h) => { h.plat(200, 235, 200); h.dia(300, 195); h.stamm(850); h.vor(1150); },                      // 18 Plattform + Baumstamm
    (h) => { h.wind(150, -1); h.geg('biber', 550, 900); h.vor(1050); },                                 // 19 Gegenwind + Biber
    (h) => { h.dia(200); h.plat(450, 240, 140); h.plat(700, 175, 140); h.dia(770, 135); h.vor(1050); }, // 20
    (h) => { h.tor(350, 10, [7, 9]); h.vor(850); },                                                     // 21 TOR 2
    (h) => { h.cp(150); h.kiste(500); h.kiste(540, 2); h.vor(850); },                                   // 22 CHECKPOINT 2
    (h) => { h.bach(250, 260); h.geg('adler', 700, 1000); h.vor(1150); },                               // 23 Bach + Adler
    (h) => { h.stamm(800); h.hoehle(1250); h.vor(1500); },                                              // 24 Baumstamm, dann Höhle
    (h) => { h.kiste(150); h.kiste(190, 2); h.kiste(230, 3); h.kiste(270, 2); h.kiste(310); h.vor(750); }, // 25 Holzpyramide
    (h) => { h.wind(150, 1); h.geg('bueffel', 900, 1500); h.vor(1600); },                               // 26 Rückenwind, dann Büffel
    (h) => { h.plat(150, 240, 150); h.plat(400, 180, 150); h.plat(650, 240, 150); h.geg('biber', 850, 1150); h.vor(1300); }, // 27
    (h) => { h.bach(150, 200); h.stamm(950); h.kiste(1250); h.vor(1500); },                             // 28 Schluss: Bach + Baumstamm
  ];
  // Welt 5 Golden Gate: Nebelabschnitte (h.nebel(dx, w): Schleier über dem Spielfeld, weiche Ränder 160; Gegner darin nur schemenhaft, Diamanten glühen durch), Seilbahn-Plattformen (h.seilbahn(dx, w): Pazifik-Lücke w + Gondel 130 breit,
  // pendelt am Seil über der Lücke, trägt die Figur mit – Timing beim Absprung), Surfbrett-Rutsche (h.surf(dx, w): nasser Streifen, Tempo × 1,6, springen erlaubt), Pazifik-Lücken (h.luecke), Hafenkisten statt Kisten
  const MUSTER_CA = [
    (h) => { h.dia(350); h.kiste(650); h.vor(900); },                                                   // 1 Aufwärmen
    (h) => { h.geg('seeloewe', 300, 700); h.dia(500, 250); h.vor(1000); },                              // 2 erster Seelöwe
    (h) => { h.plat(150, 235, 160); h.dia(230, 195); h.geg('moewe', 550, 850); h.vor(950); },           // 3 Plattform + erste Möwe (klaut!)
    (h) => { h.kiste(200); h.kiste(240, 2); h.dia(260, 215); h.vor(750); },                             // 4 Kistenstufe
    (h) => { h.luecke(250, 180); h.vor(850); },                                                         // 5 erste Pazifik-Lücke
    (h) => { h.nebel(100, 700); h.geg('seeloewe', 350, 650); h.vor(1000); },                            // 6 erster Nebel (Seelöwe darin)
    (h) => { h.seilbahn(250, 360); h.vor(850); },                                                       // 7 erste Seilbahn-Gondel
    (h) => { h.surf(150, 240); h.dia(500, 250); h.geg('skater', 700, 1000); h.vor(1100); },             // 8 Surfbrett-Rutsche, dann Skater
    (h) => { h.geg('skater', 150, 800); h.kiste(850); h.kiste(890, 2); h.dia(910, 220); h.vor(1100); },  // 9 Skater + Kistenstufe
    (h) => { h.plat(100, 245, 140); h.plat(380, 185, 140); h.dia(450, 145); h.vor(950); },              // 10 Doppelplattform
    (h) => { h.tor(400, 4, [5, 1]); h.vor(900); },                                                      // 11 TOR 1
    (h) => { h.cp(150); h.geg('seeloewe', 450, 800); h.vor(1000); },                                    // 12 CHECKPOINT 1
    (h) => { h.nebel(150, 900); h.dia(500, 250); h.geg('moewe', 600, 900); h.vor(1200); },              // 13 Nebel mit Diamant und Möwe
    (h) => { h.seilbahn(200, 400); h.vor(900); },                                                       // 14 breite Seilbahn-Lücke
    (h) => { h.kiste(200, 2); h.kiste(240, 2); h.geg('skater', 500, 900); h.vor(1000); },               // 15 Kistenmauer + Skater
    (h) => { h.plat(150, 240, 160); h.plat(400, 180, 160); h.plat(650, 240, 160); h.dia(480, 140); h.vor(1050); }, // 16 Dreier-Plattform
    (h) => { h.surf(150, 260); h.luecke(600, 170); h.vor(1000); },                                      // 17 Surf, dann Lücke
    (h) => { h.plat(200, 235, 200); h.dia(300, 195); h.geg('moewe', 650, 950); h.vor(1050); },          // 18 Plattform + Möwe
    (h) => { h.luecke(250, 190); h.geg('seeloewe', 600, 950); h.vor(1100); },                           // 19 Lücke + Seelöwe
    (h) => { h.dia(200); h.plat(450, 240, 140); h.plat(700, 175, 140); h.dia(770, 135); h.vor(1050); }, // 20
    (h) => { h.tor(350, 10, [7, 9]); h.vor(850); },                                                     // 21 TOR 2
    (h) => { h.cp(150); h.kiste(500); h.kiste(540, 2); h.vor(850); },                                   // 22 CHECKPOINT 2
    (h) => { h.nebel(100, 1100); h.geg('seeloewe', 350, 650); h.geg('moewe', 800, 1100); h.vor(1300); },// 23 langer Nebel: Seelöwe + Möwe
    (h) => { h.seilbahn(200, 420); h.vor(1000); },                                                      // 24 breiteste Seilbahn-Lücke
    (h) => { h.kiste(150); h.kiste(190, 2); h.kiste(230, 3); h.kiste(270, 2); h.kiste(310); h.vor(750); }, // 25 Kistenpyramide
    (h) => { h.surf(150, 240); h.geg('skater', 700, 1100); h.vor(1200); },                              // 26 Surf + Skater
    (h) => { h.plat(150, 240, 150); h.plat(400, 180, 150); h.plat(650, 240, 150); h.geg('moewe', 850, 1150); h.vor(1300); }, // 27
    (h) => { h.luecke(200, 180); h.nebel(500, 600); h.kiste(1000); h.vor(1300); },                      // 28 Schluss: Lücke, Nebel, Kiste
  ];
  // Welt Westminster (Klasse 6 „London Run“, 31.10.): Black Cabs und Doppeldecker statt Autos/Trucks, Pfützen statt Öl, Telefonzellen (2 hoch) und Postkästen als Stufen, Themse-Lücken
  const MUSTER_WESTMINSTER = [
    (h) => { h.dia(350); h.kiste(650); h.vor(900); },                                                   // 1 Aufwärmen (Teekiste)
    (h) => { h.auto('cab', 150, 950); h.dia(500, 250); h.vor(1000); },                                  // 2 erstes Black Cab
    (h) => { h.plat(150, 235, 160); h.dia(230, 195); h.geg('taube', 500, 720); h.vor(950); },           // 3 Plattform + Taube vom Trafalgar Square
    (h) => { h.post(200); h.zelle(240); h.dia(260, 215); h.vor(750); },                                 // 4 Postkasten → Telefonzelle (Stufe)
    (h) => { h.pfuetze(300); h.geg('fuchs', 500, 900); h.vor(1000); },                                  // 5 Pfütze + Stadtfuchs
    (h) => { h.luecke(250, 170); h.vor(950); },                                                         // 6 erste Themse-Lücke
    (h) => { h.auto('bus', 100, 1000); h.plat(600, 230, 160); h.dia(680, 190); h.vor(1100); },          // 7 Doppeldecker + Plattform
    (h) => { h.geg('eichhoernchen', 150, 500); h.post(650); h.zelle(690); h.dia(710, 190); h.vor(900); }, // 8 Eichhörnchen (St James's Park) + Stufe
    (h) => { h.auto('cab', 100, 900); h.pfuetze(550); h.vor(1000); },                                   // 9 Cab + Pfütze
    (h) => { h.plat(100, 245, 140); h.plat(380, 185, 140); h.dia(450, 145); h.vor(950); },              // 10 Doppelplattform
    (h) => { h.tor(400, 4, [5, 1]); h.vor(900); },                                                      // 11 TOR 1
    (h) => { h.cp(150); h.geg('fuchs', 450, 750); h.vor(1000); },                                       // 12 CHECKPOINT 1
    (h) => { h.auto('cab', 100, 1000); h.dia(500, 250); h.auto('bus', 1000, 1900); h.vor(2000); },      // 13 Rushhour
    (h) => { h.zelle(200); h.zelle(240); h.geg('taube', 450, 850); h.vor(1000); },                      // 14 zwei Telefonzellen + Taube
    (h) => { h.luecke(250, 160); h.pfuetze(600); h.vor(1000); },                                        // 15 Themse + Pfütze
    (h) => { h.plat(150, 240, 160); h.plat(400, 180, 160); h.plat(650, 240, 160); h.dia(480, 140); h.vor(1050); }, // 16 Dreier-Plattform
    (h) => { h.geg('eichhoernchen', 150, 450); h.auto('bus', 500, 1300); h.vor(1400); },                // 17 Eichhörnchen + Bus
    (h) => { h.plat(200, 235, 200); h.dia(300, 195); h.post(650); h.vor(950); },                        // 18
    (h) => { h.pfuetze(200); h.geg('fuchs', 450, 800); h.vor(1000); },                                  // 19 Pfütze + Fuchs
    (h) => { h.dia(200); h.plat(450, 240, 140); h.plat(700, 175, 140); h.dia(770, 135); h.vor(1050); }, // 20
    (h) => { h.tor(350, 10, [7, 9]); h.vor(850); },                                                     // 21 TOR 2
    (h) => { h.cp(150); h.post(500); h.zelle(540); h.vor(850); },                                       // 22 CHECKPOINT 2
    (h) => { h.auto('bus', 100, 1000); h.geg('taube', 1000, 1400); h.vor(1500); },                      // 23 Bus + Taube
    (h) => { h.luecke(200, 190); h.plat(150, 230, 320); h.geg('fuchs', 650, 950); h.vor(1150); },       // 24 Plattform über der Themse
    (h) => { h.kiste(150); h.kiste(190, 2); h.kiste(230, 3); h.kiste(270, 2); h.kiste(310); h.vor(750); }, // 25 Teekisten-Pyramide
    (h) => { h.pfuetze(150); h.auto('cab', 300, 1100); h.geg('eichhoernchen', 1150, 1400); h.vor(1500); }, // 26 Pfütze + Cab + Eichhörnchen
    (h) => { h.plat(150, 240, 150); h.plat(400, 180, 150); h.plat(650, 240, 150); h.geg('fuchs', 850, 1250); h.vor(1300); }, // 27
    (h) => { h.luecke(200, 170); h.auto('bus', 500, 1300); h.post(1350); h.vor(1500); },                // 28 Schluss: Themse + Bus
  ];
  // Story-Modus London Welt 1 „The Guard Who Never Moved“ (31.10., docs/runner/story-london-01.md; nur mit Option story): dieselbe Strecke wie MUSTER_WESTMINSTER, dazu
  // 12 Story-Kristalle ♪ je Lauf (h.kristall(dx, y, nr, strang): Anfang 1–4 · Gabelung nach 4: A5 unten auf der Straße, B5 oben auf einem geparkten Doppeldecker (h.parkbus) ·
  // Strang A (unten) / B (oben) 6–8 an denselben Stellen · gemeinsam 9–10 · Ende 11–12 (strang 'E' = folgt dem Strang) hinter dem Boss im Finale),
  // Abstand ≥ 1.390 Einheiten (≈ 6 s = Schreibmaschine + 3,5 s stehen + Ausblenden), nie in den 520 vor einem Tor; 18 Punkte-Diamanten (6 mehr: über Lücken, auf Stufen, über der Busspur);
  // hinter den Checkpoints kein Gegner/Fahrzeug in den ersten 550 (nach der Station „The story so far“ fair weiter).
  const MUSTER_WESTMINSTER_STORY = [
    (h) => { h.dia(350); h.kristall(500, 290, 1); h.kiste(650); h.vor(900); },                         // 1 Aufwärmen · ♪1
    (h) => { h.auto('cab', 150, 950); h.dia(500, 250); h.vor(1000); },                                  // 2 erstes Black Cab
    (h) => { h.plat(150, 235, 160); h.dia(230, 195); h.kristall(450, 290, 2); h.geg('taube', 500, 720); h.vor(950); }, // 3 · ♪2
    (h) => { h.post(200); h.zelle(240); h.dia(260, 215); h.vor(750); },                                 // 4 Postkasten → Telefonzelle
    (h) => { h.pfuetze(300); h.geg('fuchs', 500, 900); h.vor(1000); },                                  // 5 Pfütze + Stadtfuchs
    (h) => { h.luecke(250, 170); h.dia(335, 250); h.kristall(700, 290, 3); h.vor(950); },               // 6 Themse-Lücke (💎 darüber) · ♪3
    (h) => { h.auto('bus', 100, 1000); h.plat(600, 230, 160); h.dia(680, 190); h.vor(1100); },          // 7 Doppeldecker + Plattform
    (h) => { h.geg('eichhoernchen', 150, 500); h.post(650); h.kristall(670, 262, 4); h.zelle(690); h.dia(710, 190); h.vor(900); }, // 8 · ♪4 über dem Postkasten
    (h) => { h.auto('cab', 100, 900); h.pfuetze(550); h.vor(1000); },                                   // 9 Cab + Pfütze
    (h) => { h.plat(100, 245, 140); h.plat(380, 185, 140); h.dia(450, 145); h.vor(950); },              // 10 Doppelplattform
    (h) => { h.tor(400, 4, [5, 1]); h.vor(900); },                                                      // 11 TOR 1
    (h) => { h.cp(150); h.geg('fuchs', 700, 950); h.vor(1000); },                                       // 12 CHECKPOINT 1 · Station 1 (Fuchs erst 550 dahinter)
    (h) => { h.kristall(200, 290, 5, 'A'); h.parkbus(300); h.kristall(360, 246, 5, 'B'); h.vor(1100); }, // 13 GABELUNG: ♪A5 Straße, ♪B5 auf dem Doppeldecker
    (h) => { h.auto('cab', 100, 1000); h.dia(500, 250); h.kristall(800, 290, 6, 'A'); h.kristall(800, 180, 6, 'B'); h.auto('bus', 1000, 1900); h.vor(2000); }, // 14 Rushhour · ♪6
    (h) => { h.zelle(200); h.zelle(240); h.dia(260, 222); h.geg('taube', 450, 850); h.vor(1000); },     // 15 zwei Telefonzellen (💎 oben) + Taube
    (h) => { h.luecke(250, 160); h.kristall(330, 200, 7, 'B'); h.kristall(800, 290, 7, 'A'); h.pfuetze(600); h.vor(1000); }, // 16 Themse (♪B7 darüber) + Pfütze · ♪A7
    (h) => { h.plat(150, 240, 160); h.plat(400, 180, 160); h.plat(650, 240, 160); h.dia(480, 140); h.vor(1050); }, // 17 Dreier-Plattform
    (h) => { h.geg('eichhoernchen', 150, 450); h.auto('bus', 500, 1300); h.dia(850, 240); h.vor(1400); }, // 18 Eichhörnchen + Bus (💎 über der Busspur)
    (h) => { h.kristall(100, 290, 8, 'A'); h.plat(200, 235, 200); h.dia(300, 195); h.post(650); h.kristall(750, 180, 8, 'B'); h.vor(950); }, // 19 · ♪A8 / ♪B8 (Sprung vom Postkasten)
    (h) => { h.pfuetze(200); h.geg('fuchs', 450, 800); h.vor(1000); },                                  // 20 Pfütze + Fuchs
    (h) => { h.dia(200); h.plat(450, 240, 140); h.plat(700, 175, 140); h.dia(770, 135); h.vor(1050); }, // 21
    (h) => { h.tor(350, 10, [7, 9]); h.vor(850); },                                                     // 22 TOR 2
    (h) => { h.cp(150); h.kristall(350, 290, 9); h.post(500); h.zelle(540); h.vor(850); },              // 23 CHECKPOINT 2 · Station 2 · ♪9
    (h) => { h.auto('bus', 100, 1000); h.geg('taube', 1000, 1400); h.vor(1500); },                      // 24 Bus + Taube
    (h) => { h.luecke(200, 190); h.plat(150, 230, 320); h.kristall(310, 200, 10); h.geg('fuchs', 650, 950); h.vor(1150); }, // 25 Plattform über der Themse · ♪10
    (h) => { h.kiste(150); h.kiste(190, 2); h.kiste(230, 3); h.kiste(270, 2); h.kiste(310); h.dia(250, 180); h.vor(750); }, // 26 Teekisten-Pyramide (💎 oben)
    (h) => { h.pfuetze(150); h.auto('cab', 300, 1100); h.geg('eichhoernchen', 1150, 1400); h.vor(1500); }, // 27 Pfütze + Cab + Eichhörnchen
    (h) => { h.plat(150, 240, 150); h.plat(400, 180, 150); h.plat(650, 240, 150); h.dia(475, 150); h.geg('fuchs', 850, 1250); h.vor(1300); }, // 28 (💎 auf der hohen Plattform)
    (h) => { h.luecke(200, 170); h.dia(285, 250); h.auto('bus', 500, 1300); h.post(1350); h.vor(1500); }, // 29 Schluss: Themse (💎 darüber) + Bus
  ];
  const PARKBUS_W = 118, PARKBUS_H = 54;   // geparkter Doppeldecker an der Gabelung (fest, begehbar)
  // Fahrzeuge: Breite/Höhe, Tempo, Startabstand vor dem rechten Ende (auto/truck wie seit Welt 2; bus/cab Welt Westminster)
  const AUTO_MASSE = { auto: { w: 80, h: 34, tempo: 270, start: 180 }, truck: { w: 130, h: 48, tempo: 230, start: 260 }, bus: { w: 118, h: 54, tempo: 200, start: 250 }, cab: { w: 78, h: 36, tempo: 260, start: 180 } };
  function levelBauen(muster) {
    const L = { boden:[], plattformen:[], kisten:[], gegner:[], diamanten:[], tore:[], checkpoints:[], autos:[], oel:[], steine:[], bruecken:[], kakteen:[], staemme:[], baeche:[], winde:[], hoehlen:[], nebel:[], seilbahnen:[], surfs:[], kristalle:[], parkbusse:[] };
    let x = 0, bodenAb = 0, wort = 0;
    const h = {
      plat: (dx, y, w) => L.plattformen.push({ x:x + dx, y, w }),
      kiste: (dx, n = 1) => { for (let i = 0; i < n; i++) L.kisten.push({ x:x + dx, y:BODEN_Y - KISTE * (i + 1) }); },
      dia: (dx, y = 298) => L.diamanten.push({ x:x + dx, y, wort:wort++ }),
      geg: (art, von, bis) => L.gegner.push({ art, x:x + (von + bis) / 2, y: art === 'taube' || art === 'geier' || art === 'adler' || art === 'moewe' ? 262 : BODEN_Y, von:x + von, bis:x + bis, richtung:-1 }),
      luecke: (dx, w) => { L.boden.push([bodenAb, x + dx]); bodenAb = x + dx + w; },
      tor: (dx, wort, falsch) => L.tore.push({ x:x + dx, wort, falsch }),
      cp: (dx) => L.checkpoints.push({ x:x + dx }),
      // Auto/Truck pendelt auf der Strecke von..bis (fährt nach links, erscheint rechts wieder) – so trifft man es sicher einmal
      auto: (art, von, bis) => { const m = AUTO_MASSE[art] || AUTO_MASSE.auto; L.autos.push({ art, von:x + von, bis:x + bis, start:x + bis - m.start, tempo:m.tempo, w:m.w, h:m.h }); },
      oel: (dx, w = 90) => L.oel.push({ x:x + dx, w }),
      // Welt Westminster: Pfütze (rutscht wie Öl), Telefonzelle = zwei Blöcke übereinander (teil 0 unten, 1 oben), Postkasten = ein Block
      pfuetze: (dx, w = 90) => L.oel.push({ x:x + dx, w, art:'pfuetze' }),
      zelle: (dx) => { L.kisten.push({ x:x + dx, y:BODEN_Y - KISTE, art:'zelle', teil:0 }, { x:x + dx, y:BODEN_Y - KISTE * 2, art:'zelle', teil:1 }); },
      post: (dx) => L.kisten.push({ x:x + dx, y:BODEN_Y - KISTE, art:'post' }),
      stein: (dx) => L.steine.push({ x:x + dx }),
      bruecke: (dx, w) => { h.luecke(dx, w); L.bruecken.push({ x:x + dx, w }); },
      kaktus: (dx) => L.kakteen.push({ x:x + dx }),
      // Welt 4: Baumstamm (Startpunkt oben am Hang), Bach = Lücke + Trittsteine (bis 260 breit einer, sonst zwei; als Plattformen mit art 'stein' auf Bodenhöhe), Windböe (richtung -1 = zurück, +1 = vorwärts), Bärenhöhle
      stamm: (dx) => L.staemme.push({ x:x + dx }),
      bach: (dx, w) => { h.luecke(dx, w); L.baeche.push({ x:x + dx, w }); const n = w > 260 ? 2 : 1; for (let i = 1; i <= n; i++) L.plattformen.push({ x:x + dx + (w * i) / (n + 1) - TRITT_W / 2, y:BODEN_Y, w:TRITT_W, art:'stein' }); },
      wind: (dx, richtung = -1) => L.winde.push({ x:x + dx, richtung }),
      hoehle: (dx) => L.hoehlen.push({ x:x + dx }),
      // Welt 5: Nebelabschnitt, Seilbahn = Pazifik-Lücke + Gondel (pendelt zwischen 30 und w − 160 relativ zum linken Ufer), Surfbrett-Rutsche
      nebel: (dx, w) => L.nebel.push({ x:x + dx, w }),
      seilbahn: (dx, w) => { h.luecke(dx, w); L.seilbahnen.push({ x:x + dx, w, phase: L.seilbahnen.length * 2.1 }); },
      surf: (dx, w = 240) => L.surfs.push({ x:x + dx, w }),
      // Story-Modus: Story-Kristall ♪ (nr 1–12, strang null | 'A' | 'B' | 'E' = Ende folgt dem Strang), geparkter Doppeldecker (feste Stufe 118 × 54)
      kristall: (dx, y, nr, strang = null) => L.kristalle.push({ x:x + dx, y, nr, strang }),
      parkbus: (dx) => L.parkbusse.push({ x:x + dx }),
      vor: (dx) => { x += dx; },
    };
    for (const a of muster) a(h);
    L.sequenzX = x + 250;             // hier übernimmt das Spiel (≈ 600 vor dem Boss)
    L.stopX = L.sequenzX + 430;       // hier bleibt die Figur stehen
    L.bossX = L.stopX + 170;
    L.tuerX = L.bossX + 130;
    L.ende = L.tuerX + 400;
    if (L.kristalle.length) L.kristalle.push({ x:L.stopX + 95, y:290, nr:11, strang:'E' }, { x:L.tuerX - 25, y:290, nr:12, strang:'E' });   // Ende 11–12: hinter dem Boss, im Finale eingesammelt
    L.boden.push([bodenAb, L.ende]);
    return L;
  }
  const LEVEL_NY = levelBauen(MUSTER_NY);   // Welt 1 (Export Runner.level für die App/Tests); das laufende Spiel baut sein Level in start()
  let level = LEVEL_NY, W = null;           // W = aktive Welt (WELTEN[id]), level = ihr Level

  /* ---------- Spielzustand (ein Spiel zu einer Zeit) ---------- */
  let opt = null, woerter = [], skin = Object.assign({}, SKIN_STANDARD), stimme = { wort() {}, boss() {} }, texte = TEXTE;
  let laeuft = false, rafId = 0, startZeit = 0, endeGemeldet = false;
  let zustand = "aus";   // aus | spiel | sequenz | boss | finale | fertig | gameover
  let spieler, diamanten, gegner, tore, checkpoints, leben, gesammelt, kamera, zeit, popup, meldung, checkpoint, boss, tuer, tot, bossFrage, torErgebnisse;
  // Welt 2: Autos/Trucks (rollende Hindernisse), Ölflecken (rutschen 0,6 s ohne Sprung), Hupen-Zähler (Tests)
  let autos = [], oel = [], rutscht = 0, hupen = 0;
  // Welt 3: fallende Steine (Phasen ruhe → warnung → faellt → liegt → weg), Hängebrücken (Bodenzeit, gebrochen), Kakteen, Rassel-Zähler (Tests)
  let steine = [], bruecken = [], kakteen = [], rasseln = 0;
  const STEIN_VORLAUF = 300, STEIN_WARNUNG = 0.6, STEIN_LIEGT = 1.4, BRUECKE_MAX = 1.5, KAKTUS_W = 22, KAKTUS_H = 50;
  const RUTSCH_DAUER = 0.6, AUTO_KLANG_ABSTAND = 1.2;
  // Welt 4: rollende Baumstämme (ruhe → rollt → weg), Windböen (eine aktive Böe: warnung 0,5 s → schub 0,8 s), Bärenhöhlen (ruhe → schaut → pranke → zurueck → weg), Brumm-Zähler (Tests)
  let staemme = [], winde = [], hoehlen = [], wind = null, brummt = 0;
  const STAMM_VORLAUF = 520, STAMM_TEMPO = 260, STAMM_R = 20, WIND_WARNUNG = 0.5, WIND_SCHUB = 0.8, WIND_KRAFT = 150, WIND_SPRUNG = 0.72;
  const HOEHLE_VORLAUF = 340, HOEHLE_SCHAUT = 0.6, HOEHLE_PRANKE = 0.9, HOEHLE_W = 70, PRANKE_H = 44;
  // Welt 5: Nebeldichte an der Figur (0..1), Gondeln (gx = aktuelle linke Kante, vx = Tempo), Index der Gondel unter der Figur, Surf-Timer (Tempo × 1,6), Zähler geklaute Diamanten / Nebelhorn (Tests)
  let nebelDichte = 0, gondeln = [], aufGondel = null, surfs = [], surft = 0, geklaut = 0, tutet = 0;
  const NEBEL_RAND = 160, NEBEL_MAX = 0.78, GONDEL_W = 130, GONDEL_Y = BODEN_Y - 30, GONDEL_T = 7, SURF_NACH = 0.3, SURF_TEMPO = 1.6;
  // Welt Westminster: Trommelwirbel-Zähler (Tests)
  let trommelt = 0;
  // Story-Modus (Klasse 6, Option story; Klasse 9 ohne → story = null, nichts ändert sich): Kristalle ♪, Erzähl-Warteschlange (nie zwei Stücke gleichzeitig), Stationen, Film am Ende
  let storyOpt = null, story = null, kristalle = [], diaGesammelt = 0, film = null, nurFilm = false;
  const TIPP_TEMPO = 24, STORY_STEHT = 3.5, STORY_AUS = 0.6, STORY_LUECKE = 0.3, STATION_MIN = 3, STATION_MAX = 40, STATION_SPERRE = 0.4;
  // Cameos (Klasse 6): Liste der Helden (opt.cameos), geladene Kartenbilder, Auftrittsplan (x-Marken), laufender Auftritt, Effekte (Restzeit in s)
  let cameoListe = [], cameoBilder = {}, cameoPlan = [], cameo = null, cameosGezeigt = 0, cameoEffekt = null;
  let schild = 0, sprungBonus = 0, durchlaessig = 0, eisZeit = 0, traegt = 0, traegtAktiv = false, eule = null;
  const CAMEO_DAUER = 2.5, CAMEO_EIN = 0.5, CAMEO_AUS = 0.45, CAMEO_R = 24;
  let autoKlangZeit = -9;
  let sequenz = null, zoom = 1, banner = null, bossSpruch = null;
  let halten = false, haltZeit = 0, sprungGedrueckt = false;
  // Combo + Effekte
  let combo = 0, maxCombo = 0, comboText = null, hudPuls = 0, spur = 0, onfire = false, partikel = [], spurPunkte = [];
  // Wortanzeige: Sprechblase an der Figur, Wortbank (Chips im HUD), Echo-Warteschlange (Wort 6–8 s später noch einmal, Untertitel unten)
  let blase = null, wortbank = [], echoWarteschlange = [], echo = null, echoLetzte = -9, echos = 0, stimmeAufrufe = 0;
  const BLASE_DAUER = 1.6, ECHO_MIN = 6, ECHO_MAX = 8, ECHO_ABSTAND = 2.5, ECHO_DAUER = 1.4, CHIP_MAX = 8, CHIP_ZEICHEN = 12;
  let erstauntZeit = 0, zungeZeit = 0;   // Gesichtsausdruck: erstaunt 0,8 s nach Treffer, Zunge raus 1 s bei „5× Combo!“ und solange On fire
  const ausdruckAktuell = () => (erstauntZeit > 0 ? "erstaunt" : (onfire || zungeZeit > 0) ? "zunge" : "grinsend");
  const gegnerKlangZeit = { taube: -9, waschbaer: -9, eichhoernchen: -9, kojote: -9, roadrunner: -9, guerteltier: -9, klapperschlange: -9, geier: -9, skorpion: -9, bueffel: -9, biber: -9, adler: -9, moewe: -9, seeloewe: -9, skater: -9, fuchs: -9 };   // letzter Klang je Art (Spielzeit)
  const GEGNER_TEMPO = { taube: 70, waschbaer: 55, eichhoernchen: 95, kojote: 70, roadrunner: 210, guerteltier: 60, klapperschlange: 60, geier: 85, skorpion: 150, bueffel: 170, biber: 65, adler: 90, moewe: 80, seeloewe: 50, skater: 140, fuchs: 75 };
  let gegnerKlaenge = 0;   // Zähler für Tests
  const GEGNER_KLANG_ABSTAND = 1.5, GEGNER_NAEHE = 260, COMBO_TEXT_DAUER = 1.3;
  const ruhig = () => { try { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) { return false; } };
  const SPEED = 230, GRAV = 1600, GRAV_HALT = 800, SPRUNG_V = -480, HALT_MAX = 0.32;
  const PW = 30, PH = 84;  // Trefferbox (Figur v2 ist ≈ 88 Einheiten hoch; Hut/Frisur zählen nicht)
  const SEQUENZ = { zoom: 1.5, stand: 1.0, banner: 2.4, boss: 1.3, zurueck: 0.8 };
  const SEQUENZ_MIN = Object.values(SEQUENZ).reduce((a, b) => a + b, 0);
  const BANNER_TEXT = "It's time for Mr. Alligator!";   // Welt 1 (je Welt: W.banner)
  const BOSS_RICHTIG = "Correct – the door opens!", BOSS_FALSCH = "Not this time!";

  function torBauen(w) {
    const optionen = [ { wort:w.wort, richtig:true }, { wort:w.falsch[0], richtig:false }, { wort:w.falsch[1], richtig:false } ];
    optionen.sort(() => Math.random() - 0.5);
    return { x:w.x, wort:w.wort, de:kurzDe(woerter[w.wort].de), erledigt:false, steine:optionen.map((o, i) => ({ ...o, y:[305, 220, 130][i] })) };
  }
  function neuesSpiel() {
    spieler = { x:120, y:BODEN_Y, vy:0, amBoden:true, unverwundbar:0, pose:'lauf' };
    diamanten = level.diamanten.map(d => ({ ...d, wort:d.wort % woerter.length, weg:false, funkel:Math.random() * 6 }));   // Story-Level: 18 Diamanten auf 12 Wörter
    gegner = level.gegner.map(g => ({ ...g, tot:0, flug:Math.random() * 6 }));
    tore = level.tore.map(torBauen);
    checkpoints = level.checkpoints.map(c => ({ ...c, erreicht:false }));
    torErgebnisse = tore.map(() => null);
    leben = 3; gesammelt = 0; kamera = 0; zeit = 0; popup = null; meldung = null; tot = 0;
    checkpoint = 120; boss = { maul:0, weg:0, sichtbar:0, deckel:0 }; tuer = { offen:0 }; bossFrage = null;
    autos = level.autos.map(a => ({ ...a, x:a.start, rad:0 })); oel = level.oel.map(o => ({ ...o, aktiv:false })); rutscht = 0; hupen = 0; autoKlangZeit = -9;
    steine = level.steine.map(s => ({ ...s, phase:'ruhe', t:0, y:-60, vy:0 })); bruecken = level.bruecken.map(b => ({ ...b, zeit:0, gebrochen:false, knarrte:false, bruch:0, bruchX:0 })); kakteen = level.kakteen.map(k => ({ ...k })); rasseln = 0;
    staemme = level.staemme.map(s => ({ ...s, phase:'ruhe', rx:s.x, rot:0 })); winde = level.winde.map(w => ({ ...w, aktiv:false })); hoehlen = level.hoehlen.map(h => ({ ...h, phase:'ruhe', t:0 })); wind = null; brummt = 0;
    gondeln = level.seilbahnen.map(g => ({ ...g, gx:g.x + 30, vx:0, knarrte:-9 })); aufGondel = null; surfs = level.surfs.map(s => ({ ...s, aktiv:false })); surft = 0; nebelDichte = 0; geklaut = 0; tutet = 0;
    sequenz = null; zoom = 1; banner = null; bossSpruch = null;
    combo = 0; maxCombo = 0; comboText = null; hudPuls = 0; spur = 0; onfire = false; partikel = []; spurPunkte = []; gegnerKlaenge = 0; erstauntZeit = 0; zungeZeit = 0;
    for (const k in gegnerKlangZeit) gegnerKlangZeit[k] = -9;
    trommelt = 0; cameo = null; cameosGezeigt = 0; cameoEffekt = null; schild = 0; sprungBonus = 0; durchlaessig = 0; eisZeit = 0; traegt = 0; traegtAktiv = false; eule = null;
    cameoPlan = cameoPlanBauen();
    blase = null; wortbank = []; echoWarteschlange = []; echo = null; echoLetzte = -9; echos = 0; stimmeAufrufe = 0;
    diaGesammelt = 0; film = null; storyNeu();
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
    d.weg = true; gesammelt++; diaGesammelt++; klang.wort();
    const w = woerter[d.wort];
    blase = { en: w.en, de: kurzDe(w.de) || w.de, zeit: BLASE_DAUER };
    if (!wortbank.some((b) => b.wort === d.wort)) wortbank.push({ wort: d.wort, en: w.en, puls: 1 });
    if (!echoWarteschlange.some((e) => e.wort === d.wort)) echoWarteschlange.push({ wort: d.wort, faellig: zeit + ECHO_MIN + Math.random() * (ECHO_MAX - ECHO_MIN) });   // nur ein Echo je Wort
    stimmeAufrufe++; if (story && story.aktiv) stimme.wort(d.wort, { warten: true }); else stimme.wort(d.wort);   // Story: das Wort wartet, bis der Erzähler fertig ist
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
    if (g.art === 'bueffel') return;   // Büffel ist nicht plattzudrücken (Welt 4)
    spieler.vy = -320; spieler.amBoden = false;
    if (g.art === 'guerteltier') { g.rollt = true; g.richtung = 1; g.harmlos = true; gegnerKlang("plopp"); gegnerKlang("rollt"); }   // Gürteltier: rollt als Kugel weg (= platt)
    else { g.tot = 0.01; gegnerKlang("plopp"); }
    const b = gegnerBox(g); funken(b.x + b.w / 2, b.y + b.h / 2, 10, ["#fff6c0", "#ffd93d", "#ffffff"], 170, 0.5, "stern");
  }
  // Welt 5: die Möwe nimmt kein Leben, sondern klaut einen Diamanten (Zähler −1, nie unter 0) und fliegt damit nach oben rechts davon; Serie reißt, Figur schaut erstaunt
  function moeweKlaut(g) {
    g.harmlos = true; g.klaut = 0.01; g.richtung = 1; g.beute = gesammelt > 0;
    comboReset(); erstauntZeit = 0.8; klang.klau();
    if (g.beute) { gesammelt--; geklaut++; hudPuls = 1; }
    meldung = { text: g.beute ? 'My diamond! 🐦' : 'Nothing to steal! 🐦', zeit: 1.2 };
    const b = gegnerBox(g); funken(b.x + b.w / 2, b.y + b.h / 2, 12, ["#39c6f0", "#bfefff", "#ffffff"], 170, 0.5);
  }
  /* ---------- Cameos: geheime Superhelden (Klasse 6) – Satz (Englisch, kurz), Umhangfarbe, Effekt-Symbol ----------
     Effekte (fair, nie mehr Diamanten als möglich): leo Funken-Spur + Combo +1 · kenji nächster Sprung höher (5 s) · tessa Schild gegen den nächsten Treffer (5 s, nicht beim Sturz)
     felix trägt über die nächste Lücke (5 s, einmal) · olivia zeigt die Frage des nächsten Tors sofort · ellie Echo des letzten Worts sofort · zara Gegner 3 s durchlässig
     penny Gegner 3 s eingefroren · max holt den zuletzt verpassten Diamanten zurück (sonst Combo +1) · camilla +1 Herz (bei 3 Herzen Combo +1); unbekannte Helden: Combo +1 */
  const CAMEO = {
    leo: { satz: "Leo here! Go, go, go!", farbe: "#e0a400", symbol: "⚡" },
    kenji: { satz: "Kenji here! Jump high!", farbe: "#ff7a1a", symbol: "🦘" },
    tessa: { satz: "Tessa here! I've got your back!", farbe: "#2e9e5b", symbol: "🛡️" },
    felix: { satz: "Felix here! I can carry you!", farbe: "#8a5a2b", symbol: "🦅" },
    olivia: { satz: "Olivia here! I can see the next gate!", farbe: "#8a3ffc", symbol: "🦉" },
    ellie: { satz: "Ellie here! Listen again!", farbe: "#7f8c9d", symbol: "🔁" },
    zara: { satz: "Zara here! Now they can't see you!", farbe: "#18213a", symbol: "👻" },
    penny: { satz: "Penny here! Freeze!", farbe: "#39c6f0", symbol: "❄️" },
    max: { satz: "Max here! I've got a gadget!", farbe: "#c8283a", symbol: "🔧" },
    camilla: { satz: "Camilla here! Have an extra heart!", farbe: "#d9a35a", symbol: "❤️" },
  };
  const cameoInfo = (held) => CAMEO[held && held.id] || { satz: `${(held && held.name) || "A hero"} is here!`, farbe: "#1d3f8f", symbol: "⭐" };
  // 2–3 Auftritte je Lauf (höchstens so viele wie Helden übergeben): x-Marken bei 22/50/78 % der Strecke, nie direkt an einem Tor (dann 400 dahinter)
  function cameoPlanBauen() {
    if (!cameoListe.length) return [];
    const n = Math.min(cameoListe.length, 2 + (Math.random() < 0.5 ? 1 : 0));
    const anteile = n === 1 ? [0.45] : n === 2 ? [0.3, 0.65] : [0.22, 0.5, 0.78];
    return anteile.map((f, i) => {
      let x = Math.round(level.sequenzX * f);
      for (const t of level.tore) if (x > t.x - 600 && x < t.x + 600) x = t.x + 650;   // nicht mit Tor-Hinweis/Tor-Ergebnis zusammen
      if (storyOpt) for (const k of level.kristalle) if (x > k.x - 250 && x < k.x + 1450) x = k.x + 1500;   // Story-Modus: nicht während ein Stück erzählt wird
      return { x, held: cameoListe[i], erledigt: false };
    });
  }
  function comboPlus() {
    combo++; if (combo > maxCombo) maxCombo = combo; hudPuls = 1;
    funken(spieler.x, spieler.y - 50, 12, ["#ffd93d", "#fff6c0"], 200, 0.6);
  }
  function cameoStart(held) {
    const info = cameoInfo(held);
    cameo = { held, t: 0, satz: (held && held.satz) || info.satz, info };
    cameosGezeigt++; klang.cameo();
    try { if (stimme.cameo) stimme.cameo(cameo.satz, held && held.id); } catch (e) { /* stumm */ }
    const id = held && held.id;
    if (id === 'leo') { if (!ruhig()) spur = Math.max(spur, 3); comboPlus(); cameoEffekt = 'combo'; }
    else if (id === 'kenji') { sprungBonus = 5; cameoEffekt = 'sprung'; }
    else if (id === 'tessa') { schild = 5; cameoEffekt = 'schild'; }
    else if (id === 'felix') { traegt = 5; cameoEffekt = 'traegt'; }
    else if (id === 'olivia' && tore.some((t) => !t.erledigt && t.x > spieler.x)) { eule = tore.find((t) => !t.erledigt && t.x > spieler.x); cameoEffekt = 'eule'; }
    else if (id === 'ellie' && wortbank.length) {
      const b = wortbank[wortbank.length - 1], w = woerter[b.wort];
      echo = { text: `🔁 ${w.en} – ${kurzDe(w.de) || w.de}`, zeit: ECHO_DAUER }; echoLetzte = zeit; echos++;
      stimmeAufrufe++; stimme.wort(b.wort, { leise: true }); cameoEffekt = 'echo';
    }
    else if (id === 'zara') { durchlaessig = 3; cameoEffekt = 'unsichtbar'; }
    else if (id === 'penny') { eisZeit = 3; cameoEffekt = 'eis'; }
    else if (id === 'max' && diamanten.some((d) => d.verpasst && !d.weg)) {
      const d = diamanten.filter((d) => d.verpasst && !d.weg).pop();
      let zx = spieler.x + 170;   // freie Bodenstelle vor der Figur (kein Loch, keine Kiste)
      for (let k = 0; k < 10; k++) { const x = spieler.x + 150 + k * 60; if (level.boden.some(([a, b]) => x - 30 > a && x + 30 < b) && !level.kisten.some((q) => q.x > x - 70 && q.x < x + 30)) { zx = x; break; } }
      d.x = zx; d.y = 290; d.verpasst = false; funken(d.x, d.y, 14, ["#39c6f0", "#bfefff", "#ffffff"], 180, 0.6); cameoEffekt = 'diamant';
    }
    else if (id === 'camilla' && leben < 3) { leben++; hudPuls = 1; cameoEffekt = 'herz'; }
    else { comboPlus(); cameoEffekt = 'combo'; }
  }
  function cameoBewegen(dt) {
    if (cameo) { cameo.t += dt; if (cameo.t >= CAMEO_DAUER) cameo = null; }
    if (schild > 0) schild = Math.max(0, schild - dt);
    if (sprungBonus > 0) sprungBonus = Math.max(0, sprungBonus - dt);
    if (durchlaessig > 0) durchlaessig = Math.max(0, durchlaessig - dt);
    if (eisZeit > 0) eisZeit = Math.max(0, eisZeit - dt);
    if (traegt > 0) traegt = Math.max(0, traegt - dt);
    if (eule && (eule.erledigt || spieler.x > eule.x + 40)) eule = null;
    if (!cameo && tot <= 0 && !popup) { const pl = cameoPlan.find((p) => !p.erledigt && spieler.x >= p.x); if (pl) { pl.erledigt = true; cameoStart(pl.held); } }
  }
  /* ---------- Story-Modus (Klasse 6, docs/runner/story-london-01.md): Kristalle ♪, Gabelung, Erzähl-Warteschlange, Stationen ----------
     Option story = { id, titel, teile: { "1"…"4", "A5"…"A8", "B5"…"B8", "9", "10", "A11", "A12", "B11", "B12": Text }, audio: { key: Datei } (optional, später) }.
     stimme.erzaehler(text, { key, audio, sofort }) spricht ein Stück (Geräte-Stimme, bis die Aufnahmen da sind) und darf ein Promise liefern (Ende der Lesung);
     stimme.still() bricht eine Lesung ab (Station/Film übersprungen). Wörter, die während eines Stücks gesammelt werden, warten hinter dem Erzähler (stimme.wort(i, { warten: true })). */
  const kristallKey = (k) => (k.nr <= 4 || k.nr === 9 || k.nr === 10) ? String(k.nr) : (k.strang === 'E' ? (story.strang || 'A') : k.strang) + k.nr;
  const storyText = (key) => (storyOpt && storyOpt.teile && storyOpt.teile[key]) || '';
  const storyAudio = (key) => (storyOpt && storyOpt.audio && storyOpt.audio[key]) || null;
  function kristallSichtbar(k) {
    if (k.weg) return false;
    if (!k.strang || k.strang === 'E') return true;
    if (k.nr === 5) return !story.strang || story.strang === k.strang;   // Gabelung: beide, bis eins genommen ist
    return story.strang === k.strang;                                    // danach nur der gewählte Strang
  }
  function storyNeu() {
    if (!storyOpt) { story = null; kristalle = []; return; }
    story = { strang: null, auto: false, gesammelt: [], schlange: [], aktiv: null, pause: 0, gesprochen: 0, station: null, stationen: 0, filmFertig: null };
    kristalle = level.kristalle.map((k) => ({ ...k, weg: false, funkel: Math.random() * 6, puff: 0 }));
  }
  function erzaehle(text, o) {
    story.gesprochen++;
    try { return stimme.erzaehler ? stimme.erzaehler(text, o) : null; } catch (e) { return null; }
  }
  function kristallSammeln(k, still) {
    k.weg = true;
    const key = kristallKey(k);
    if (!story.gesammelt.includes(key)) story.gesammelt.push(key);
    klang.kristall(); hudPuls = 1;
    funken(k.x, k.y, 24, ['#b07cff', '#ffd36b', '#fff6c0', '#ffffff'], 240, 0.8);
    if (k.nr === 5 && !story.strang) gabelLoesen(k.strang, false);
    if (!still) story.schlange.push(key);   // Ende 11–12 (im Finale): der Film erzählt sie
  }
  // Gabelung: das zuerst genommene ♪5 legt den Strang fest, das andere verschwindet mit einem kleinen Puff; ohne beide → Strang A (auto)
  function gabelLoesen(strang, auto) {
    story.strang = strang; story.auto = !!auto;
    for (const k of kristalle) if (k.nr === 5 && k.strang !== strang && !k.weg) { k.weg = true; k.puff = 0.6; klang.puff(); funken(k.x, k.y, 14, ['#c9c9d6', '#ffffff', '#b07cff'], 150, 0.5); }
  }
  // Warteschlange: ein Stück nach dem anderen – Schreibmaschine (24 Zeichen/s), 3,5 s stehen, 0,6 s ausblenden, 0,3 s Pause
  function storyBewegen(dt) {
    for (const k of kristalle) { k.funkel += dt; if (k.puff > 0) k.puff = Math.max(0, k.puff - dt); }
    const a = story.aktiv;
    if (a) { a.t += dt; if (a.t >= a.dauer) { story.aktiv = null; story.pause = STORY_LUECKE; } return; }
    if (story.pause > 0) { story.pause -= dt; return; }
    if (!story.schlange.length) return;
    const key = story.schlange.shift(), text = storyText(key), tipp = ruhig() ? 0 : text.length / TIPP_TEMPO;
    story.aktiv = { key, text, t: 0, tipp, dauer: tipp + STORY_STEHT + STORY_AUS };
    erzaehle(text, { key, audio: storyAudio(key) });
  }
  // Stationen an den Checkpoints: Spiel hält an, „The story so far“ mit allen bisherigen Stücken (verpasste „…“), der Erzähler liest die gesammelten noch einmal;
  // weiter nach der Lesung (mindestens 3 s) oder mit Tap/Leertaste (frühestens nach 0,4 s). Danach 1,2 s unverwundbar, Fahrzeuge vor der Figur fahren neu ein.
  function stationKeys(nr) { const st = story.strang || 'A', l = ['1', '2', '3', '4']; if (nr >= 2) l.push(st + '5', st + '6', st + '7', st + '8'); return l; }
  function stationStart(nr) {
    story.schlange = []; story.aktiv = null; story.pause = 0;
    zustand = 'station'; halten = false; spieler.pose = 'steh'; spieler.vy = 0;
    const keys = stationKeys(nr), gelesen = keys.filter((k) => story.gesammelt.includes(k)).map(storyText);
    const st = { nr, t: 0, keys, gelesen: false, lesezeit: 2 + gelesen.join(' ').split(/\s+/).filter(Boolean).length * 0.45 };
    story.station = st; story.stationen++;
    klang.station();
    const dateien = [storyAudio('sofar')].concat(keys.filter((k) => story.gesammelt.includes(k)).map(storyAudio)); // Aufnahmen (31.10.): „The story so far.“ + gesammelte Stücke
    const r = erzaehle(['The story so far.'].concat(gelesen).join(' '), { key: 'station' + nr, audio: dateien.every(Boolean) ? dateien : null, sofort: true });
    if (r && typeof r.then === 'function') { st.lesezeit = STATION_MAX; r.then(() => { st.gelesen = true; }, () => { st.gelesen = true; }); }
  }
  function stationBewegen(dt) {
    const st = story.station; st.t += dt;
    if ((st.t >= STATION_MIN && (st.gelesen || st.t >= st.lesezeit)) || st.t >= STATION_MAX) stationEnde(false);
  }
  function stationEnde(getippt) {
    if (!story || !story.station) return;
    if (getippt) { if (story.station.t < STATION_SPERRE) return; try { if (stimme.still) stimme.still(); } catch (e) { /* egal */ } }
    story.station = null; zustand = 'spiel'; halten = false;
    spieler.unverwundbar = Math.max(spieler.unverwundbar, 1.2);
    for (const a of autos) if (a.x > spieler.x - 60 && a.x < spieler.x + 450) a.x = a.bis;   // fair weiter: kein Fahrzeug direkt vor der Figur
  }

  /* ---------- Film am Ende (Story-Modus): 3 Szenen mit der eigenen Figur + Titelkarte; Tap überspringt ----------
     Ende A (Fuchs): Pferde kommen, Sergeant ohne Mütze → Figur bringt die Bärenfellmütze → setzt sie ihm auf, er lächelt kurz.
     Ende B (Taube): Pferde kommen → Babytauben im Hut auf Big Ben, Figur nimmt ihre Cap ab → setzt sie ihm auf, er lacht, alle lachen mit. */
  const FILM_SZENEN = { A: [['9', '10'], ['A11'], ['A12'], null], B: [['9', '10'], ['B11'], ['B12'], null] };
  let filmAllein = null;   // Optionen von Runner.film (Story Library), sonst null
  function filmStart(ende) {
    film = { ende: ende === 'B' ? 'B' : 'A', szene: -1, t: 0, gesamt: 0, gelesen: false, dauer: 0, text: '' };
    zustand = 'film'; tuer = { offen: 1 }; halten = false; zoom = 1; partikel = []; spurPunkte = []; blase = null; echo = null; popup = null; meldung = null; bossSpruch = null;
    if (frageBox) frageBox.hidden = true;
    if (story) story.schlange = [], story.aktiv = null;
    filmSzene(0);
  }
  function filmSzene(i) {
    film.szene = i; film.t = 0; film.gelesen = false;
    const keys = FILM_SZENEN[film.ende][i];
    if (!keys) { film.text = ''; film.dauer = 3.5; film.gelesen = true; klang.fanfare(); return; }
    film.text = keys.map(storyText).join(' ');
    film.dauer = Math.max(4.8, film.text.split(/\s+/).length * 0.42 + 1.6);
    const r = story ? erzaehle(film.text, { key: 'film' + film.ende + (i + 1), audio: keys.map(storyAudio), sofort: true }) : null;
    if (r && typeof r.then === 'function') r.then(() => { if (film && film.szene === i) film.gelesen = true; }, () => { if (film && film.szene === i) film.gelesen = true; });
    else film.gelesen = true;
  }
  function filmBewegen(dt) {
    film.t += dt; film.gesamt += dt;
    if (film.t >= film.dauer && (film.gelesen || film.t >= film.dauer + 4)) { if (film.szene < 3) filmSzene(film.szene + 1); else filmEnde(false); }
  }
  function filmEnde(getippt) {
    if (!film || zustand !== 'film') return;
    if (getippt) { if (film.gesamt < STATION_SPERRE) return; try { if (stimme.still) stimme.still(); } catch (e) { /* egal */ } }
    const ende = film.ende;
    if (story) story.filmFertig = { ende, uebersprungen: !!getippt, szene: film.szene };
    zustand = 'fertig';
    if (filmAllein) { const o = filmAllein; film.szene = 3; film.t = 99; setTimeout(() => { if (laeuft && opt === o && typeof o.onEnde === 'function') o.onEnde({ film: true, ende, uebersprungen: !!getippt }); }, 150); return; }
    film = null; zeigeEnde(true);
  }

  // Gegner-Klang: nur im laufenden Spiel (nie in Sequenz/Boss), je Art höchstens alle 1,5 s; "plopp" ist ein Ereignis ohne Sperre
  function gegnerKlang(art) {
    if (zustand !== 'spiel') return false;
    if (art !== "plopp" && art !== "rollt") {
      if (zeit - gegnerKlangZeit[art] < GEGNER_KLANG_ABSTAND) return false;
      gegnerKlangZeit[art] = zeit;
    }
    gegnerKlaenge++;
    if (klang[art]) klang[art]();
    return true;
  }
  function gegnerKlaengeNaehe() {
    for (const g of gegner) {
      if (g.tot > 0 || g.harmlos) continue;
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
    if (zustand === 'station') { stationEnde(true); return; }   // Story-Station: Tap = weiter
    if (zustand === 'film') { filmEnde(true); return; }         // Film: Tap = überspringen
    if (zustand !== 'spiel') return;          // in der Sequenz und beim Boss ist die Eingabe gesperrt
    if (rutscht > 0) return;                  // auf dem Ölfleck: kein Sprung möglich
    if (spieler.amBoden && tot <= 0) {
      spieler.vy = SPRUNG_V * (wind && wind.phase === 'schub' ? WIND_SPRUNG : 1); spieler.amBoden = false; halten = true; haltZeit = 0; klang.sprung();   // in der Windböe: halber Sprung
      if (sprungBonus > 0) { spieler.vy *= 1.3; sprungBonus = 0; meldung = { text: 'Boing! 🦘', zeit: 0.7 }; }   // Cameo Kenji: einmal höher
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
    level.bruecken.forEach((b, i) => liste.push({ x:b.x, y:BODEN_Y, w:b.w, h:14, voll:false, bruecke:i }));   // Hängebrücke: trägt, bis ein Brett bricht
    level.seilbahnen.forEach((g, i) => liste.push({ x:g.x + 30, y:GONDEL_Y, w:GONDEL_W, h:14, voll:false, gondel:i }));   // Welt 5: Gondel (x wird jeden Frame nachgeführt)
    for (const b of level.parkbusse) liste.push({ x:b.x, y:BODEN_Y - PARKBUS_H, w:PARKBUS_W, h:PARKBUS_H, voll:true });   // Story: geparkter Doppeldecker an der Gabelung
    return liste;
  }


  function schaden(grund) {
    if (spieler.unverwundbar > 0 || tot > 0) return;
    if (schild > 0 && grund !== 'wasser') { schild = 0; spieler.unverwundbar = 1.2; klang.schild(); meldung = { text: 'Shield! 🛡️', zeit: 1 }; return; }   // Cameo Tessa
    leben--; klang.aua(); comboReset(); erstauntZeit = 0.8; rutscht = 0; wind = null; surft = 0; aufGondel = null;
    if (leben <= 0) { zustand = 'gameover'; zeigeEnde(false); return; }
    tot = 0.9; meldung = { text: grund === 'wasser' ? W.sturz : TREFFER_TEXT[grund] || 'Ouch!', zeit: 1.2 };
  }
  const TREFFER_TEXT = { auto: 'Crash! 🚗', stein: 'Rock! 🪨', kaktus: 'Ouch! 🌵', stamm: 'Log! 🪵', baer: 'Grrr! 🐻', bueffel: 'Buffalo! 🦬', bus: 'Beep beep! 🚌', cab: 'Taxi! 🚕' };
  function wiederbeleben() {
    spieler.x = checkpoint; spieler.y = BODEN_Y; spieler.vy = 0; spieler.amBoden = true; spieler.unverwundbar = 1.6;
    halten = false;
    for (const b of bruecken) { b.gebrochen = false; b.zeit = 0; b.knarrte = false; b.bruch = 0; }   // Brücken heil, Steine zurück
    for (const s of steine) if (s.x > checkpoint) { s.phase = 'ruhe'; s.t = 0; }
    for (const s of staemme) if (s.x > checkpoint) { s.phase = 'ruhe'; s.rx = s.x; }   // Welt 4: Baumstämme zurück oben am Hang, Höhlen ruhig, Böen wieder scharf
    for (const h of hoehlen) if (h.x > checkpoint) { h.phase = 'ruhe'; h.t = 0; }
    for (const w of winde) if (w.x > checkpoint) w.aktiv = false;
    wind = null;
    for (const s of surfs) s.aktiv = false; surft = 0; aufGondel = null;   // Welt 5
  }
  // Welt 3: Steine fallen, sobald die Figur ≈ 300 davor ist (Staub + Schatten 0,6 s, dann Sturz; liegen 1,4 s gefährlich, dann zerbröseln); Brücken-Bruchstücke fallen nach
  function hindernisseBewegen(dt) {
    for (const s of steine) {
      if (s.phase === 'ruhe') { if (zustand === 'spiel' && tot <= 0 && spieler.x > s.x - STEIN_VORLAUF && spieler.x < s.x) { s.phase = 'warnung'; s.t = 0; klang.rumpeln(); } }
      else if (s.phase === 'warnung') { s.t += dt; if (s.t >= STEIN_WARNUNG) { s.phase = 'faellt'; s.y = -60; s.vy = 200; } }
      else if (s.phase === 'faellt') { s.vy += 2200 * dt; s.y += s.vy * dt; if (s.y >= BODEN_Y) { s.y = BODEN_Y; s.phase = 'liegt'; s.t = 0; klang.stein(); funken(s.x, BODEN_Y - 6, 14, ['#d9a37a', '#b4745a', '#f0c9a8'], 180, 0.6); } }
      else if (s.phase === 'liegt') { s.t += dt; if (s.t >= STEIN_LIEGT) { s.phase = 'weg'; funken(s.x, BODEN_Y - 16, 8, ['#8d5a46', '#b4745a'], 120, 0.5); } }
      else if (s.phase === 'weg') { if (spieler.x < s.x - STEIN_VORLAUF - 50) s.phase = 'ruhe'; }
    }
    for (const b of bruecken) if (b.gebrochen) b.bruch = Math.min(1.5, b.bruch + dt);
    // Welt 4: Baumstamm rollt los, sobald die Figur ≈ 520 davor ist; rollt nach links, bis er 250 hinter der Figur (oder 1400 weit) ist
    for (const s of staemme) {
      if (s.phase === 'ruhe') { if (zustand === 'spiel' && tot <= 0 && spieler.x > s.x - STAMM_VORLAUF && spieler.x < s.x) { s.phase = 'rollt'; s.rx = s.x; klang.stamm(); } }
      else if (s.phase === 'rollt') { s.rx -= STAMM_TEMPO * dt; s.rot -= STAMM_TEMPO * dt / STAMM_R; if (s.rx < spieler.x - 250 || s.rx < s.x - 1400) s.phase = 'weg'; }
      else if (s.phase === 'weg') { if (spieler.x < s.x - STAMM_VORLAUF - 50) { s.phase = 'ruhe'; s.rx = s.x; } }
    }
    // Bärenhöhle: Figur ≈ 340 davor → Bär schaut 0,6 s heraus (Knurren = Vorwarnung) → Pranke 0,9 s vor der Höhle (Treffer) → zieht sich 0,8 s zurück
    for (const h of hoehlen) {
      if (h.phase === 'ruhe') { if (zustand === 'spiel' && tot <= 0 && spieler.x > h.x - HOEHLE_VORLAUF && spieler.x < h.x) { h.phase = 'schaut'; h.t = 0; klang.baer(); } continue; }
      h.t += dt;
      if (h.phase === 'schaut' && h.t >= HOEHLE_SCHAUT) { h.phase = 'pranke'; h.t = 0; klang.pranke(); }
      else if (h.phase === 'pranke' && h.t >= HOEHLE_PRANKE) { h.phase = 'zurueck'; h.t = 0; }
      else if (h.phase === 'zurueck' && h.t >= 0.8) { h.phase = 'weg'; h.t = 0; }
      else if (h.phase === 'weg' && spieler.x < h.x - HOEHLE_VORLAUF - 50) { h.phase = 'ruhe'; h.t = 0; }
    }
    // Windböe: Warnung (Blätter) 0,5 s, dann Schub 0,8 s
    if (wind) { wind.t += dt; if (wind.phase === 'warnung' && wind.t >= WIND_WARNUNG) { wind.phase = 'schub'; wind.t = 0; klang.wind(); } else if (wind.phase === 'schub' && wind.t >= WIND_SCHUB) wind = null; }
    // Welt 5: Gondeln pendeln am Seil über der Lücke (Sinus, Periode 7 s, Weg 30 … w − 160 relativ zum linken Ufer); die Kollisionsflächen werden nachgeführt
    for (const g of gondeln) {
      const weg = Math.max(0, g.w - GONDEL_W - 60), a = zeit * Math.PI * 2 / GONDEL_T + g.phase;
      g.gx = g.x + 30 + weg * (0.5 + 0.5 * Math.sin(a)); g.vx = weg * 0.5 * Math.cos(a) * Math.PI * 2 / GONDEL_T;
    }
    for (const s of SOLIDE) if (s.gondel != null) s.x = gondeln[s.gondel].gx;
    nebelDichte = nebelDichteBei(spieler.x);
  }
  // Nebeldichte an einer Stelle: 1 im Abschnitt, weiche Ränder 160 davor/dahinter
  function nebelDichteBei(x) {
    let d = 0;
    for (const n of level.nebel) { const a = n.x - NEBEL_RAND, b = n.x + n.w + NEBEL_RAND; if (x <= a || x >= b) continue; d = Math.max(d, Math.min(1, (x - a) / NEBEL_RAND, (b - x) / NEBEL_RAND)); }
    return d;
  }
  const steinBox = (s) => ({ x: s.x - 20, y: s.y - 40, w: 40, h: 40 });
  const kaktusBox = (k) => ({ x: k.x - KAKTUS_W / 2, y: BODEN_Y - KAKTUS_H, w: KAKTUS_W, h: KAKTUS_H });
  function gegnerBewegen(dt) {
    for (const g of gegner) {
      if (eisZeit > 0 && g.tot <= 0 && !g.rollt && !g.klaut) continue;   // Cameo Penny: Gegner stehen eingefroren still
      g.flug += dt;
      if (g.tot > 0) { g.tot += dt; continue; }
      if (g.rollt) { g.x += 420 * dt; g.roll = (g.roll || 0) + dt * 14; if (g.x > g.bis + 900) g.tot = 1; continue; }   // weggerollte Kugel: schnell nach rechts, dann weg
      if (g.klaut) { g.klaut += dt; g.x += 170 * dt; g.y -= 130 * dt; if (g.klaut > 1.6) g.tot = 1; continue; }   // Möwe mit Beute: fliegt nach oben rechts davon
      g.x += g.richtung * GEGNER_TEMPO[g.art] * dt;
      if (g.art === 'roadrunner' || g.art === 'skater') { if (g.x < g.von) g.x = g.bis; continue; }   // Roadrunner/Skater laufen immer entgegen (nach links) und erscheinen rechts wieder
      if (g.art === 'bueffel') { if (g.x < g.von) { if (spieler.x < g.bis - 450) g.x = g.bis; else g.tot = 1; } continue; }   // Büffel rennt durch; kommt nur wieder, wenn die Figur noch weit genug vor dem Ende seiner Strecke ist
      if (g.x < g.von) g.richtung = 1; if (g.x > g.bis) g.richtung = -1;
    }
    for (const a of autos) {   // Verkehr: nach links, am linken Ende wieder rechts
      a.x -= a.tempo * dt; a.rad += a.tempo * dt / 12;
      if (a.x + a.w < a.von) a.x = a.bis;
    }
  }
  function gegnerBox(g) {
    if (g.art === 'taube') return { x: g.x - 16, y: g.y - 14 + Math.sin(g.flug * 3) * 8, w: 32, h: 26 };
    if (g.art === 'eichhoernchen') { const hop = Math.abs(Math.sin(g.flug * 6)) * 14; return { x: g.x - 15, y: g.y - 24 - hop, w: 30, h: 24 }; }
    if (g.art === 'roadrunner') return { x: g.x - 16, y: g.y - 22, w: 32, h: 22 };
    if (g.art === 'guerteltier') return { x: g.x - 15, y: g.y - 24, w: 30, h: 24 };
    if (g.art === 'kojote' || g.art === 'fuchs') return { x: g.x - 22, y: g.y - 30, w: 44, h: 30 };
    if (g.art === 'klapperschlange') return { x: g.x - 24, y: g.y - 18, w: 48, h: 18 };
    if (g.art === 'geier') return { x: g.x - 22, y: g.y - 14 + Math.sin(g.flug * 2.5) * 10, w: 44, h: 26 };
    if (g.art === 'skorpion') return { x: g.x - 14, y: g.y - 16, w: 28, h: 16 };
    if (g.art === 'bueffel') return { x: g.x - 36, y: g.y - 46, w: 72, h: 46 };
    if (g.art === 'biber') return { x: g.x - 16, y: g.y - 20, w: 32, h: 20 };
    if (g.art === 'adler') return { x: g.x - 26, y: g.y - 14 + Math.sin(g.flug * 2.5) * 10, w: 52, h: 26 };
    if (g.art === 'moewe') return { x: g.x - 18, y: g.y - 12 + (g.klaut ? 0 : Math.sin(g.flug * 2.8) * 8), w: 36, h: 24 };
    if (g.art === 'seeloewe') return { x: g.x - 25, y: g.y - 28, w: 50, h: 28 };
    if (g.art === 'skater') return { x: g.x - 15, y: g.y - 44, w: 30, h: 44 };
    return { x: g.x - 20, y: g.y - 26, w: 40, h: 26 };
  }
  const autoBox = (a) => ({ x: a.x, y: BODEN_Y - a.h, w: a.w, h: a.h });
  let SOLIDE = [];

  function update(dt) {
    if (zustand === 'film') { zeit += dt; filmBewegen(dt); return; }   // Story: Film am Ende (eigene Szene, keine Spielwelt)
    if (nurFilm) return;
    if (zustand === 'station') { stationBewegen(dt); return; }         // Story-Station: alles steht still
    const eingefroren = zustand === 'sequenz' && sequenz.phase === 'stand';
    if (!eingefroren) zeit += dt;
    if (popup) { popup.zeit -= dt; if (popup.zeit <= 0) popup = null; }
    if (meldung) { meldung.zeit -= dt; if (meldung.zeit <= 0) meldung = null; }
    if (bossSpruch) { bossSpruch.zeit -= dt; if (bossSpruch.zeit <= 0) bossSpruch = null; }
    if (!eingefroren) { gegnerBewegen(dt); hindernisseBewegen(dt); for (const d of diamanten) d.funkel += dt; effekteBewegen(dt); if (story) storyBewegen(dt); }

    if (zustand === 'spiel') {
      if (tot > 0) { tot -= dt; if (tot <= 0) wiederbeleben(); return; }
      if (spieler.unverwundbar > 0) spieler.unverwundbar -= dt;
      cameoBewegen(dt);
      if (rutscht > 0) { rutscht = Math.max(0, rutscht - dt); if (rutscht === 0) halten = false; }

      // Welt 4: Windböe auslösen (Figur passiert die Marke), schiebt in der Phase schub mit 150/s zurück oder vorwärts
      for (const w of winde) if (!w.aktiv && spieler.x >= w.x && spieler.x < w.x + 120) { w.aktiv = true; if (!wind) { wind = { phase:'warnung', t:0, richtung:w.richtung }; klang.blaetter(); } }
      const schub = wind && wind.phase === 'schub' ? wind.richtung * WIND_KRAFT : 0;
      if (surft > 0) surft = Math.max(0, surft - dt);
      // Horizontal (auf dem Ölfleck gleitet die Figur etwas schneller, auf dem Surfbrett deutlich; die Gondel trägt die Figur mit)
      let nx = spieler.x + (SPEED * (rutscht > 0 ? 1.15 : surft > 0 ? SURF_TEMPO : 1) + schub + (aufGondel != null && spieler.amBoden ? gondeln[aufGondel].vx : 0)) * dt;
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
          if (s.bruecke != null && bruecken[s.bruecke].gebrochen) continue;
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
      aufGondel = null;
      if (spieler.amBoden && spieler.vy === 0) {
        let hatBoden = false;
        for (const s of SOLIDE) if (!(s.bruecke != null && bruecken[s.bruecke].gebrochen) && spieler.x + PW / 2 > s.x && spieler.x - PW / 2 < s.x + s.w && Math.abs(spieler.y - s.y) < 0.5) { hatBoden = true; if (s.gondel != null) aufGondel = s.gondel; }
        if (!hatBoden) spieler.amBoden = false;
      }
      if (aufGondel != null && zeit - gondeln[aufGondel].knarrte > 1.2) { gondeln[aufGondel].knarrte = zeit; klang.gondel(); }   // Welt 5: Gondel knarrt unter der Figur
      spieler.pose = (rutscht > 0 || surft > 0) && spieler.amBoden ? 'steh' : spieler.amBoden ? 'lauf' : 'sprung';
      // Welt 5: Surfbrett-Rutsche – auf dem nassen Streifen (am Boden) Tempo × 1,6, läuft 0,3 s nach; springen bleibt erlaubt; Meldung + Welle je Streifen einmal pro Überquerung
      for (const s of surfs) {
        const drauf = spieler.amBoden && spieler.x + PW / 2 > s.x && spieler.x - PW / 2 < s.x + s.w;
        if (drauf) { surft = SURF_NACH; if (!s.aktiv) { s.aktiv = true; klang.welle(); meldung = { text: 'Whoosh! 🏄', zeit: 0.7 }; } }
        else if (s.aktiv && spieler.x - PW / 2 > s.x + s.w) s.aktiv = false;
      }
      // Hängebrücken: Bodenzeit auf der Brücke zählt (Sprung zählt nicht); ab 1,0 s knarrt es, ab 1,5 s bricht das Brett unter der Figur → Sturz in die Schlucht
      for (const b of bruecken) {
        const drueber = spieler.x + PW / 2 > b.x && spieler.x - PW / 2 < b.x + b.w;
        if (!drueber) { if (!b.gebrochen) b.zeit = 0; continue; }
        if (b.gebrochen || !spieler.amBoden || spieler.y !== BODEN_Y) continue;
        b.zeit += dt;
        if (b.zeit >= 1.0 && !b.knarrte) { b.knarrte = true; klang.knarren(); }
        if (b.zeit >= BRUECKE_MAX) { b.gebrochen = true; b.bruchX = spieler.x; b.bruch = 0; spieler.amBoden = false; klang.bruch(); meldung = { text: 'Crack! 🪵', zeit: 0.8 }; }
      }
      // Cameo Felix: über einer Lücke fängt der Falke die fallende Figur ab und trägt sie knapp über dem Boden-Niveau hinüber (einmal; wirkt, solange traegt > 0 oder er schon trägt)
      if (traegt > 0 || traegtAktiv) {
        const ueberLuecke = !level.boden.some(([a, b]) => spieler.x >= a && spieler.x <= b) && !SOLIDE.some((s) => !s.voll && s.bruecke == null && s.gondel == null && spieler.x >= s.x && spieler.x <= s.x + s.w && s.y < BODEN_Y + 1 && s.y > spieler.y - 1);
        if (ueberLuecke && !spieler.amBoden && spieler.vy > 0 && spieler.y > BODEN_Y - 30) { if (!traegtAktiv) meldung = { text: 'Whee! 🦅', zeit: 0.8 }; spieler.y = BODEN_Y - 30; spieler.vy = 0; traegtAktiv = true; }
        else if (!ueberLuecke && traegtAktiv) { traegtAktiv = false; traegt = 0; }
      }
      if (spieler.y > H + 20) { schaden('wasser'); return; }
      // Ölflecken: beim Betreten (am Boden) 0,6 s rutschen ohne Sprung; wirkt je Fleck einmal pro Überquerung
      for (const o of oel) {
        const drauf = spieler.amBoden && spieler.x + PW / 2 > o.x && spieler.x - PW / 2 < o.x + o.w;
        if (drauf && !o.aktiv && tot <= 0) { o.aktiv = true; rutscht = RUTSCH_DAUER; halten = false; klang.rutsch(); if (o.art === 'pfuetze') klang.platsch(); meldung = { text: o.art === 'pfuetze' ? 'Splish! 💦' : 'Whoa! 🛢️', zeit: 0.7 }; }
        else if (!drauf && o.aktiv && spieler.x - PW / 2 > o.x + o.w) o.aktiv = false;
      }

      // Checkpoints (Fahnen)
      for (const cp of checkpoints) {
        if (!cp.erreicht && spieler.x >= cp.x) {
          cp.erreicht = true; checkpoint = cp.x; klang.checkpoint();
          meldung = { text:'Checkpoint! 🚩', zeit:1.4 };
          if (story) { stationStart(checkpoints.indexOf(cp) + 1); return; }   // Story: Station „The story so far“
        }
      }

      // Diamanten
      const box = { x: spieler.x - PW / 2, y: spieler.y - PH, w: PW, h: PH };
      for (const d of diamanten) {
        if (d.weg) continue;
        if (ueberlappt(box.x, box.y, box.w, box.h, d.x - 14, d.y - 16, 28, 32)) diamantSammeln(d);
        else if (!d.verpasst && d.x < spieler.x - PW / 2 - 20) { d.verpasst = true; comboReset(); }   // Diamant hinter der Figur: Serie reißt
      }
      // Story-Kristalle ♪ (zählen nicht für die Combo); Gabelung ohne Wahl → Strang A
      if (story) {
        for (const k of kristalle) if (kristallSichtbar(k) && ueberlappt(box.x, box.y, box.w, box.h, k.x - 15, k.y - 20, 30, 40)) kristallSammeln(k, false);
        if (!story.strang) { const g = kristalle.filter((k) => k.nr === 5); if (g.length && spieler.x > Math.max(...g.map((k) => k.x)) + 40) gabelLoesen('A', true); }
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
            if (story && story.aktiv) stimme.wort(tor.wort, { warten: true }); else stimme.wort(tor.wort);
            break;
          }
        }
      });
      // Gegner
      for (const g of gegner) {
        if (g.tot > 0 || g.harmlos || durchlaessig > 0) continue;   // Cameo Zara: Gegner 3 s durchlässig
        const gb = gegnerBox(g);
        if (ueberlappt(box.x + 4, box.y + 6, box.w - 8, box.h - 6, gb.x, gb.y, gb.w, gb.h)) {
          if (g.art === 'bueffel') schaden('bueffel');   // Büffel: auch von oben = Leben weg (nur überspringen)
          else if (spieler.vy > 0 && altY <= gb.y + 14) gegnerPlatt(g);
          else if (g.art === 'moewe') moeweKlaut(g);     // Möwe: klaut einen Diamanten statt ein Leben zu nehmen
          else schaden('gegner');
        }
      }
      // Verkehr: Berührung = Leben weg, nicht plattzudrücken (drüberspringen!)
      for (const a of autos) {
        const ab = autoBox(a);
        if (ueberlappt(box.x + 4, box.y + 6, box.w - 8, box.h - 6, ab.x + 4, ab.y + 2, ab.w - 8, ab.h - 2)) { schaden(a.art === 'bus' || a.art === 'cab' ? a.art : 'auto'); break; }
        if (zeit - autoKlangZeit > AUTO_KLANG_ABSTAND && ab.x - spieler.x > 0 && ab.x - spieler.x < 320) { autoKlangZeit = zeit; if (a.art === 'bus') klang.bus(); else klang.auto(); }
      }
      // Welt 3: fallende/liegende Steine und Kakteen – Berührung = Leben weg (drüberspringen!)
      for (const s of steine) {
        if (s.phase !== 'faellt' && s.phase !== 'liegt') continue;
        const sb = steinBox(s);
        if (ueberlappt(box.x + 4, box.y + 6, box.w - 8, box.h - 6, sb.x + 4, sb.y + 4, sb.w - 8, sb.h - 4)) { schaden('stein'); break; }
      }
      for (const k of kakteen) {
        const kb = kaktusBox(k);
        if (ueberlappt(box.x + 4, box.y + 6, box.w - 8, box.h - 6, kb.x, kb.y + 2, kb.w, kb.h - 2)) { schaden('kaktus'); break; }
      }
      // Welt 4: rollende Baumstämme (drüberspringen) und die Bären-Pranke vor der Höhle – Berührung = Leben weg
      for (const s of staemme) {
        if (s.phase !== 'rollt') continue;
        if (ueberlappt(box.x + 4, box.y + 6, box.w - 8, box.h - 6, s.rx - STAMM_R + 3, BODEN_Y - STAMM_R * 2 + 4, STAMM_R * 2 - 6, STAMM_R * 2 - 4)) { schaden('stamm'); break; }
      }
      for (const h of hoehlen) {
        if (h.phase !== 'pranke') continue;
        if (ueberlappt(box.x + 4, box.y + 6, box.w - 8, box.h - 6, h.x - HOEHLE_W / 2, BODEN_Y - PRANKE_H, HOEHLE_W, PRANKE_H)) { schaden('baer'); break; }
      }
      gegnerKlaengeNaehe();
      // Boss-Sequenz beginnt
      if (spieler.x >= level.sequenzX && spieler.amBoden) {
        zustand = 'sequenz'; sequenz = { phase:'zoom', t:0 }; halten = false; spieler.unverwundbar = 0; cameo = null; eule = null; traegtAktiv = false; schild = sprungBonus = durchlaessig = eisZeit = traegt = 0;   // Cameo-Effekte enden vor dem Boss
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
        if (sequenz.t >= SEQUENZ.stand) { sequenz = { phase:'banner', t:0 }; banner = { text:W.banner, zeit:SEQUENZ.banner }; stimme.boss(W.banner); }
      } else if (ph === 'banner') {
        banner.zeit -= dt;
        if (sequenz.t >= SEQUENZ.banner) { sequenz = { phase:'boss', t:0 }; banner = null; W.bossKlang(); }
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
        if (story) for (const k of kristalle) if (k.strang === 'E' && !k.weg && Math.abs(spieler.x - k.x) < 20) kristallSammeln(k, true);   // Ende 11–12 hinter dem Boss (erzählt im Film)
        if (spieler.x > level.tuerX + 10) { zustand = 'fertig'; klang.fanfare(); if (story) filmStart(story.strang || 'A'); else zeigeEnde(true); }
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
    box.append(el("h2", null, W.bossSymbol + " " + texte.bossTitel), el("p", "klein", texte.bossHinweis));
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
    bossSpruch = { text, zeit: dauer }; spruchEl.textContent = W.bossSymbol + " " + text;
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
  const ergebnis = (geschafft) => Object.assign({
    geschafft, diamanten: gesammelt, max: (story ? diamanten.length : woerter.length) + level.tore.length,
    toreRichtig: torErgebnisse.filter(Boolean).length, leben, dauer: Math.round((performance.now() - startZeit) / 1000), maxCombo,
  }, story ? {   // Story-Modus: Punkte-Diamanten (ohne Tore) und die Geschichte (Strang = Ende, vollständig = alle 12 ♪ dieses Endes)
    punkteDiamanten: diaGesammelt, diamantenMax: diamanten.length,
    story: { id: storyOpt.id || W.id, ende: story.strang, gesammelt: story.gesammelt.slice(), anzahl: story.gesammelt.length, vollstaendig: !!story.strang && story.gesammelt.length >= 12 },
  } : {});
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
    const grau = !!W && W.id === 'westminster';   // St James's Park: graues Eichhörnchen
    const fell = grau ? '#8f8f8f' : '#b5562a', hell = grau ? '#cfcfcf' : '#e08a55', bauch = grau ? '#f0ece4' : '#f3d9b8', pfote = grau ? '#666666' : '#8a3f1c';
    // Schwanz
    c.lineCap = 'round'; c.lineWidth = 9; c.strokeStyle = fell; c.beginPath(); c.moveTo(10, -8); c.quadraticCurveTo(22, -14 + w, 16, -30 + w); c.quadraticCurveTo(12, -36, 6, -30); c.stroke();
    c.lineWidth = 4; c.strokeStyle = hell; c.beginPath(); c.moveTo(11, -10); c.quadraticCurveTo(20, -15 + w, 15, -28 + w); c.stroke();
    // Körper
    c.fillStyle = fell; c.beginPath(); c.ellipse(0, -9, 12, 8, -0.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = bauch; c.beginPath(); c.ellipse(-3, -6, 6, 4.5, -0.2, 0, Math.PI * 2); c.fill();
    // Kopf + Ohren mit Pinseln
    c.fillStyle = fell; c.beginPath(); c.arc(-11, -16, 6.5, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(-15, -20); c.lineTo(-15, -29); c.lineTo(-11, -22); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-9, -22); c.lineTo(-7, -30); c.lineTo(-5, -21); c.closePath(); c.fill();
    c.fillStyle = bauch; c.beginPath(); c.arc(-14, -13, 2.6, 0, Math.PI * 2); c.fill();   // Wange
    c.fillStyle = '#18213a'; c.beginPath(); c.arc(-13, -17.5, 1.5, 0, Math.PI * 2); c.fill();  // Auge
    c.beginPath(); c.arc(-17.5, -13.5, 1.3, 0, Math.PI * 2); c.fill();                           // Nase
    // Pfoten
    c.fillStyle = pfote; c.beginPath(); c.roundRect(-9 + w, -3, 5, 4, 2); c.roundRect(3 - w, -3, 6, 4, 2); c.fill();
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
  /* ---------- Welt 2 Route 66: Kulisse, Straße, Reifen, Verkehr, Öl, Gegner, Boss Big Rig Bob, Mautstation ---------- */
  const mischFarbe = (a, b, f) => {   // zwei Hex-Farben mischen (f 0..1)
    const p = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const x = p(a), y = p(b); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * f)).join(',')})`;
  };
  function schild66(c, x, y, s, farbe, text) {   // Route-66-Schild (Wappenform) mit Schrift
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = farbe; c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-30, -40); c.lineTo(30, -40); c.lineTo(30, -5); c.quadraticCurveTo(28, 20, 0, 34); c.quadraticCurveTo(-28, 20, -30, -5); c.closePath(); c.fill(); c.stroke();
    if (text !== false) {
      c.fillStyle = '#18213a'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = 'bold 11px system-ui, sans-serif'; c.fillText('ROUTE', 0, -26);
      c.font = 'bold 30px system-ui, sans-serif'; c.fillText('66', 0, 2);
      c.font = 'bold 8px system-ui, sans-serif'; c.fillText('ILLINOIS', 0, 22);
    }
    c.restore();
  }
  function hintergrundRoute66(c) {
    const naehe = Math.min(1, kamera / level.ende);   // nach rechts (Westen) wird die Wüste gelber/rötlicher, die Sonne tiefer
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, mischFarbe('#5fb4ee', '#f08a4b', naehe * 0.7)); g.addColorStop(0.55, mischFarbe('#bfe3fa', '#ffb36b', naehe)); g.addColorStop(1, mischFarbe('#f6e3b4', '#ffcf8a', naehe));
    c.fillStyle = g; c.fillRect(-viewW, -H, viewW * 3, H * 3);
    // Sonne tief über dem Horizont (steht fast still), wird im Westen größer und röter
    const sx = viewW * 0.78 - kamera * 0.01, sy = 120 + naehe * 70, sr = 26 + naehe * 14;
    const sg = c.createRadialGradient(sx, sy, sr * 0.5, sx, sy, sr * 3); sg.addColorStop(0, 'rgba(255,230,150,.55)'); sg.addColorStop(1, 'rgba(255,200,120,0)');
    c.fillStyle = sg; c.beginPath(); c.arc(sx, sy, sr * 3, 0, Math.PI * 2); c.fill();
    c.fillStyle = mischFarbe('#ffe27a', '#ff7a3d', naehe); c.beginPath(); c.arc(sx, sy, sr, 0, Math.PI * 2); c.fill();
    // ferne Tafelberge (Parallaxe 0,06)
    c.fillStyle = mischFarbe('#c9a37c', '#c0552f', naehe);
    for (let i = 0; i < 9; i++) {
      const bx = ((i * 310 - kamera * 0.06) % (viewW + 400) + viewW + 400) % (viewW + 400) - 200, bh = 36 + ((i * 53) % 50), bw = 120 + ((i * 37) % 90);
      c.beginPath(); c.moveTo(bx, 250); c.lineTo(bx + 22, 250 - bh); c.lineTo(bx + bw - 22, 250 - bh); c.lineTo(bx + bw, 250); c.closePath(); c.fill();
    }
    // Route-66-Schild als Zielmarke: kommt über das Level näher (Parallaxe + Größe)
    schild66(c, viewW * (0.8 - 0.5 * naehe), 212 - naehe * 12, 0.6 + naehe * 1.0, '#f4f4f4', true);   // wandert langsam von rechts in die Mitte und wächst bis zum Boss
    // Wüstenboden hinter der Straße (Sand → Rot), Lücken in der Straße zeigen ihn als Baugrube
    c.fillStyle = mischFarbe('#e8cf93', '#d98a4e', naehe); c.fillRect(-viewW, 250, viewW * 3, H * 2);
    c.fillStyle = mischFarbe('#d9b97a', '#c2703a', naehe); c.fillRect(-viewW, 250, viewW * 3, 6);
    // Mittelgrund (Parallaxe 0,35): Tankstelle, Motel-Schilder, Reklametafeln, Kakteen, Telegrafenmasten
    const n = viewW + 500;
    for (let i = 0; i < 10; i++) {
      const bx = ((i * 520 + 60 - kamera * 0.35) % n + n) % n - 250, art = i % 5;
      if (art === 0) {   // Tankstelle: Dach auf Stützen, Zapfsäulen, Schild „GAS“
        c.fillStyle = '#e63946'; c.fillRect(bx, 196, 110, 10); c.fillStyle = '#f4f4f4'; c.fillRect(bx + 8, 206, 5, 44); c.fillRect(bx + 97, 206, 5, 44);
        c.fillStyle = '#d9d9d9'; c.fillRect(bx + 60, 212, 50, 38); c.fillStyle = '#2a6cff'; c.fillRect(bx + 66, 218, 14, 16);
        c.fillStyle = '#f4f4f4'; c.fillRect(bx + 24, 226, 12, 24); c.fillRect(bx + 42, 226, 12, 24); c.fillStyle = '#e63946'; c.fillRect(bx + 26, 230, 8, 8); c.fillRect(bx + 44, 230, 8, 8);
        c.fillStyle = '#555'; c.fillRect(bx + 118, 170, 4, 80); c.fillStyle = '#ffd93d'; c.beginPath(); c.arc(bx + 120, 166, 16, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#18213a'; c.font = 'bold 11px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('GAS', bx + 120, 166);
      } else if (art === 1) {   // Motel-Schild mit Pfeil und „VACANCY“
        c.fillStyle = '#555'; c.fillRect(bx + 20, 160, 5, 90);
        c.fillStyle = '#1d3f8f'; c.beginPath(); c.roundRect(bx - 20, 140, 86, 30, 6); c.fill();
        c.fillStyle = '#ffd93d'; c.font = 'bold 15px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('MOTEL', bx + 23, 155);
        c.fillStyle = '#e63946'; c.beginPath(); c.moveTo(bx + 66, 155); c.lineTo(bx + 82, 155); c.lineTo(bx + 82, 148); c.lineTo(bx + 94, 158); c.lineTo(bx + 82, 168); c.lineTo(bx + 82, 161); c.lineTo(bx + 66, 161); c.closePath(); c.fill();
        c.fillStyle = Math.floor(zeit * 2 + i) % 2 ? '#ff5d5d' : '#ffb3b3'; c.font = 'bold 8px system-ui, sans-serif'; c.fillText('VACANCY', bx + 23, 178);
        c.fillStyle = '#c99a6a'; c.fillRect(bx - 40, 212, 120, 38); c.fillStyle = '#7a4a16'; for (let k = 0; k < 4; k++) c.fillRect(bx - 32 + k * 30, 222, 14, 28);
      } else if (art === 2) {   // Reklametafel
        c.fillStyle = '#555'; c.fillRect(bx + 10, 190, 4, 60); c.fillRect(bx + 70, 190, 4, 60);
        c.fillStyle = '#f4f4f4'; c.fillRect(bx - 6, 158, 96, 36); c.strokeStyle = '#7a4a16'; c.lineWidth = 2; c.strokeRect(bx - 6, 158, 96, 36);
        c.fillStyle = '#c8283a'; c.font = 'bold 12px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(i % 2 ? 'DINER 2 mi' : 'ROUTE 66', bx + 42, 176);
      } else if (art === 3) {   // Kakteen
        c.fillStyle = '#3f8a3e'; c.beginPath(); c.roundRect(bx, 196, 12, 54, 6); c.roundRect(bx - 12, 210, 8, 22, 4); c.roundRect(bx + 16, 204, 8, 26, 4); c.fill();
        c.fillRect(bx - 12, 214, 14, 7); c.fillRect(bx + 10, 208, 14, 7);
      } else {   // Telegrafenmast mit Leitung
        c.fillStyle = '#7a5a3a'; c.fillRect(bx, 170, 5, 80); c.fillRect(bx - 12, 178, 29, 4);
        c.strokeStyle = 'rgba(60,40,30,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(bx - 12, 180); c.quadraticCurveTo(bx + 250, 196, bx + 520 - 12, 180); c.stroke();
      }
    }
  }
  function strasseZeichnen(c, x0, w, a, b, links, rechts) {   // Highway: Asphalt, weiße Randlinie, gelber Mittelstreifen, Leitpfosten am Rand
    c.fillStyle = '#4a4a50'; c.fillRect(x0, BODEN_Y, w, H - BODEN_Y + 200);
    c.fillStyle = '#6a6a72'; c.fillRect(x0, BODEN_Y, w, 8);
    c.fillStyle = '#f4f4f4'; c.fillRect(x0, BODEN_Y + 12, w, 3);
    c.fillStyle = '#ffd93d';
    for (let x = Math.max(Math.ceil(a / 60) * 60, Math.floor(links / 60) * 60); x < Math.min(b, rechts); x += 60) c.fillRect(Math.max(x, a) - kamera, BODEN_Y + 44, Math.min(34, b - x), 5);
    for (let x = Math.max(Math.ceil(a / 400) * 400 + 200, Math.floor(links / 400) * 400 - 200); x < Math.min(b, rechts); x += 400) {   // Leitpfosten (weiß mit Reflektor)
      if (x < a + 10 || x > b - 10) continue; const px = x - kamera;
      c.fillStyle = '#f4f4f4'; c.fillRect(px - 2, BODEN_Y - 30, 5, 30); c.fillStyle = '#18213a'; c.fillRect(px - 2, BODEN_Y - 30, 5, 5); c.fillStyle = '#ff9f1c'; c.fillRect(px - 2, BODEN_Y - 24, 5, 4);
    }
  }
  function baugrube(c, a, b) {   // Lücke in der Straße: dunkle Grube + rot-weiße Absperrung an beiden Rändern
    const x0 = a - kamera, w = b - a;
    c.fillStyle = '#3a2a1c'; c.fillRect(x0, BODEN_Y + 30, w, H);
    for (const x of [x0 - 10, x0 + w - 8]) { c.fillStyle = '#f4f4f4'; c.fillRect(x, BODEN_Y - 22, 18, 7); c.fillStyle = '#e63946'; c.fillRect(x, BODEN_Y - 22, 6, 7); c.fillRect(x + 12, BODEN_Y - 22, 6, 7); c.fillStyle = '#555'; c.fillRect(x + 2, BODEN_Y - 15, 3, 15); c.fillRect(x + 13, BODEN_Y - 15, 3, 15); }
  }
  function reifen(c, x, y) {   // ein Reifen (liegend, 40 × 40) für Reifenstapel
    c.fillStyle = '#1a1a1a'; c.beginPath(); c.roundRect(x, y + 2, KISTE, KISTE - 4, 12); c.fill();
    c.fillStyle = '#3a3a3a'; c.beginPath(); c.ellipse(x + KISTE / 2, y + 10, 16, 5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#777'; c.beginPath(); c.ellipse(x + KISTE / 2, y + 10, 7, 2.5, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#444'; c.lineWidth = 1.5; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x + 6 + k * 9, y + 18); c.lineTo(x + 4 + k * 9, y + KISTE - 4); c.stroke(); }
  }
  function autoZeichnen(c, a) {   // Verkehr fährt nach links: Front links, Scheinwerfer an, Räder drehen sich
    if (a.art === 'bus' || a.art === 'cab') return londonFahrzeug(c, a);   // Welt Westminster
    const x = a.x - kamera, y = BODEN_Y;
    c.save(); c.translate(x, y);
    const karosse = a.art === 'truck' ? '#2a6cff' : ['#e63946', '#2e9e5b', '#ff9f1c', '#8a3ffc'][Math.abs(Math.round(a.von / 7)) % 4];
    if (a.art === 'truck') {
      c.fillStyle = '#e9e9e9'; c.beginPath(); c.roundRect(34, -a.h, a.w - 36, a.h - 12, 4); c.fill();   // Anhänger
      c.fillStyle = '#c8283a'; c.fillRect(40, -a.h + 12, a.w - 48, 6);
      c.fillStyle = karosse; c.beginPath(); c.roundRect(0, -a.h + 10, 38, a.h - 22, 6); c.fill();   // Fahrerhaus
      c.fillStyle = '#bfe3fa'; c.fillRect(4, -a.h + 14, 14, 12);
      c.fillStyle = '#ffd93d'; c.fillRect(-2, -16, 6, 6);
      c.fillStyle = '#555'; c.fillRect(-4, -12, a.w + 4, 4);
    } else {
      c.fillStyle = karosse; c.beginPath(); c.roundRect(0, -a.h + 14, a.w, a.h - 22, 7); c.fill();   // Unterbau
      c.beginPath(); c.moveTo(16, -a.h + 14); c.quadraticCurveTo(22, -a.h, 36, -a.h); c.lineTo(62, -a.h); c.quadraticCurveTo(70, -a.h, 70, -a.h + 14); c.closePath(); c.fill();   // Dach
      c.fillStyle = '#bfe3fa'; c.beginPath(); c.moveTo(22, -a.h + 13); c.quadraticCurveTo(26, -a.h + 3, 36, -a.h + 3); c.lineTo(62, -a.h + 3); c.lineTo(66, -a.h + 13); c.closePath(); c.fill();
      c.fillStyle = '#ffd93d'; c.fillRect(-1, -a.h + 18, 6, 6); c.fillStyle = '#e63946'; c.fillRect(a.w - 5, -a.h + 18, 5, 6);
      c.fillStyle = '#555'; c.fillRect(-3, -10, 8, 4); c.fillRect(a.w - 5, -10, 8, 4);
    }
    const raeder = a.art === 'truck' ? [16, a.w - 50, a.w - 22] : [16, a.w - 18];
    for (const rx of raeder) {
      c.fillStyle = '#1a1a1a'; c.beginPath(); c.arc(rx, -8, 9, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#aaa'; c.beginPath(); c.arc(rx, -8, 4, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#1a1a1a'; c.lineWidth = 2; c.beginPath(); c.moveTo(rx + Math.cos(a.rad) * 4, -8 + Math.sin(a.rad) * 4); c.lineTo(rx - Math.cos(a.rad) * 4, -8 - Math.sin(a.rad) * 4); c.stroke();
    }
    // Lichtkegel nach links
    c.fillStyle = 'rgba(255,240,170,.28)'; c.beginPath(); c.moveTo(0, -a.h + 20); c.lineTo(-46, -a.h + 6); c.lineTo(-46, -a.h + 36); c.closePath(); c.fill();
    c.restore();
  }
  function oelZeichnen(c, o) {   // Ölfleck: dunkle Pfütze mit Regenbogen-Glanz; warnt durch Glitzern, solange die Figur noch davor ist
    if (o.art === 'pfuetze') return pfuetzeZeichnen(c, o);   // Welt Westminster: Regenpfütze
    const x = o.x - kamera; const w = o.w;
    c.save(); c.translate(x + w / 2, BODEN_Y + 4);
    c.fillStyle = '#141a22'; c.beginPath(); c.ellipse(0, 0, w / 2, 7, 0, 0, Math.PI * 2); c.ellipse(-w / 4, 3, w / 5, 4, 0, 0, Math.PI * 2); c.fill();
    const gl = 0.5 + 0.5 * Math.sin(zeit * 6 + o.x);
    c.globalAlpha = 0.35 + 0.4 * gl; c.strokeStyle = '#8a3ffc'; c.lineWidth = 2; c.beginPath(); c.ellipse(4, -1, w / 3, 3.5, 0, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = '#19d3c5'; c.beginPath(); c.ellipse(-2, 1, w / 5, 2, 0, 0, Math.PI * 2); c.stroke();
    c.globalAlpha = 0.6 + 0.4 * gl; c.fillStyle = '#fff';
    c.beginPath(); c.moveTo(-w / 4, -4); c.lineTo(-w / 4 + 2, 0); c.lineTo(-w / 4, 4); c.lineTo(-w / 4 - 2, 0); c.closePath(); c.fill();
    c.restore();
  }
  function kojote(c, g) {   // Kojote: läuft wie der Waschbär, grau-braun, spitze Ohren, langer Schwanz
    const b = gegnerBox(g); const cx = b.x + 22, cy = b.y + 30;
    c.save(); c.translate(cx, cy); if (g.richtung > 0) c.scale(-1, 1);
    if (g.tot > 0) c.scale(1, Math.max(0.15, 1 - g.tot * 2));
    const w = Math.sin(g.flug * 10) * 3;
    c.lineCap = 'round'; c.lineWidth = 6; c.strokeStyle = '#a0866a'; c.beginPath(); c.moveTo(16, -16); c.quadraticCurveTo(30, -20 + w, 30, -34 + w); c.stroke();
    c.fillStyle = '#b89a78'; c.beginPath(); c.ellipse(0, -14, 20, 10, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#e6d4b8'; c.beginPath(); c.ellipse(-2, -10, 11, 5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#b89a78'; c.beginPath(); c.ellipse(-18, -20, 10, 8, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(-30, -22); c.lineTo(-34, -24); c.lineTo(-30, -18); c.closePath(); c.fill();   // Schnauze
    c.beginPath(); c.moveTo(-22, -26); c.lineTo(-22, -36); c.lineTo(-16, -27); c.closePath(); c.moveTo(-14, -27); c.lineTo(-11, -36); c.lineTo(-8, -26); c.closePath(); c.fill();   // Ohren
    c.fillStyle = '#18213a'; c.beginPath(); c.arc(-21, -22, 1.8, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(-33, -23, 1.6, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#8a6a48'; c.beginPath(); c.roundRect(-12 + w, -6, 6, 6, 2); c.roundRect(6 - w, -6, 6, 6, 2); c.fill();
    c.restore();
  }
  function roadrunner(c, g) {   // Roadrunner: schneller Laufvogel, blau-lila Federn, langer Schwanz, Beine als Wirbel
    const b = gegnerBox(g); const cx = b.x + 16, cy = b.y + 22;
    c.save(); c.translate(cx, cy); if (g.richtung > 0) c.scale(-1, 1);
    if (g.tot > 0) c.scale(1, Math.max(0.15, 1 - g.tot * 2));
    c.strokeStyle = 'rgba(80,80,120,.5)'; c.lineWidth = 2;   // Lauf-Wirbel
    for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(-2 + k * 3, -4, 5 + k * 2, Math.PI * 0.2, Math.PI * 0.9); c.stroke(); }
    c.fillStyle = '#4b4f9a'; c.beginPath(); c.moveTo(6, -12); c.lineTo(24, -22); c.lineTo(22, -10); c.closePath(); c.fill();   // Schwanz
    c.fillStyle = '#5f6ac4'; c.beginPath(); c.ellipse(0, -11, 11, 7, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#c9d2ff'; c.beginPath(); c.ellipse(-2, -8, 6, 3.5, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#5f6ac4'; c.lineWidth = 3; c.beginPath(); c.moveTo(-8, -14); c.lineTo(-12, -20); c.stroke();   // Hals
    c.fillStyle = '#5f6ac4'; c.beginPath(); c.arc(-14, -21, 4.5, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(-12, -25); c.lineTo(-10, -30); c.lineTo(-8, -24); c.closePath(); c.fill();   // Federkamm
    c.fillStyle = '#ffd93d'; c.beginPath(); c.moveTo(-18, -21); c.lineTo(-26, -20); c.lineTo(-18, -19); c.closePath(); c.fill();   // Schnabel
    c.fillStyle = '#18213a'; c.beginPath(); c.arc(-15, -22, 1.3, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  function guerteltier(c, g) {   // Gürteltier: rollt als Kugel; plattgedrückt rollt es als geschlossene Kugel schnell weg
    const b = gegnerBox(g); const cx = b.x + 15, cy = b.y + 24;
    c.save(); c.translate(cx, cy - 12);
    const roll = g.rollt ? g.roll : g.flug * 5 * -g.richtung;
    c.rotate(roll);
    c.fillStyle = '#9a7b5b'; c.beginPath(); c.arc(0, 0, 12, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#6b5236'; c.lineWidth = 2; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * 5, -11); c.quadraticCurveTo(k * 5 + 2, 0, k * 5, 11); c.stroke(); }
    if (!g.rollt) { c.fillStyle = '#c9ad8c'; c.beginPath(); c.ellipse(-10, 4, 6, 4, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#18213a'; c.beginPath(); c.arc(-12, 2, 1.2, 0, Math.PI * 2); c.fill(); }   // Kopf (eingerollt: weg)
    c.restore();
  }
  function mautstation(c, x, y) {   // Tür der Welt 2: Mautstation mit Schlagbaum, der sich beim Öffnen hebt
    c.save(); c.translate(x, y);
    c.fillStyle = '#d9d9d9'; c.fillRect(-70, -150, 240, 150); c.fillStyle = '#c8283a'; c.fillRect(-70, -162, 240, 14);
    c.fillStyle = '#18213a'; c.font = 'bold 13px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.fillText('TOLL  ·  ROUTE 66', 50, -155);
    c.fillStyle = '#9aa3b0'; c.fillRect(-40, -120, 40, 120); c.fillStyle = '#bfe3fa'; c.fillRect(-34, -112, 28, 30);   // Häuschen
    c.fillStyle = '#555'; c.fillRect(4, -40, 10, 40); c.fillStyle = '#ffd93d'; c.beginPath(); c.arc(9, -44, 7, 0, Math.PI * 2); c.fill();
    c.save(); c.translate(9, -40); c.rotate(-tuer.offen * Math.PI / 2.2);   // Schlagbaum hebt sich
    c.fillStyle = '#f4f4f4'; c.fillRect(0, -5, 120, 10); c.fillStyle = '#e63946'; for (let k = 0; k < 4; k++) c.fillRect(10 + k * 30, -5, 15, 10);
    c.restore();
    if (tuer.offen > 0) { c.fillStyle = `rgba(255,240,180,${0.5 * tuer.offen})`; c.fillRect(0, -110, 110, 70); }
    c.fillStyle = tuer.offen > 0.5 ? '#2e9e5b' : '#e63946'; c.beginPath(); c.arc(60, -128, 7, 0, Math.PI * 2); c.fill();   // Ampel
    c.restore();
  }
  function bigRigBob(c, x, y) {   // Boss Welt 2: brummiger Truck mit Gesicht – Scheinwerfer-Augen, Kühlergrill-Mund; fährt von rechts heran, fährt am Ende nach rechts weg
    if (boss.sichtbar <= 0) return;
    c.save();
    c.translate(x + (1 - boss.sichtbar) * 520 + boss.weg * 700, y); c.globalAlpha = 1 - boss.weg * 0.6;
    const m = boss.maul, wackel = Math.sin(zeit * 18) * (zustand === 'boss' ? 1.2 : 0.6);
    c.translate(0, wackel);
    c.fillStyle = '#e9e9e9'; c.beginPath(); c.roundRect(70, -118, 190, 90, 6); c.fill(); c.fillStyle = '#c8283a'; c.fillRect(80, -100, 170, 8);   // Anhänger
    c.fillStyle = '#18213a'; c.font = 'bold 16px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('BIG RIG BOB', 165, -72);
    c.fillStyle = '#c8283a'; c.beginPath(); c.roundRect(-70, -112, 140, 86, 10); c.fill();   // Fahrerhaus
    c.fillStyle = '#8a1c2a'; c.fillRect(-70, -40, 140, 14);
    c.fillStyle = '#bfe3fa'; c.fillRect(-60, -104, 110, 30);   // Windschutzscheibe
    c.fillStyle = '#555'; c.fillRect(30, -150, 8, 40); c.fillStyle = '#777'; c.fillRect(26, -156, 16, 8);   // Auspuff
    if (zustand !== 'finale' || boss.weg < 0.5) { c.fillStyle = 'rgba(90,90,90,.35)'; for (let k = 0; k < 3; k++) { const t = (zeit * 1.3 + k * 0.33) % 1; c.beginPath(); c.arc(34 + t * 12, -160 - t * 40, 5 + t * 9, 0, Math.PI * 2); c.fill(); } }   // Qualm
    // Gesicht: Scheinwerfer-Augen (mit Pupillen), Kühlergrill-Mund (öffnet sich beim Reden), Stoßstange als Kinn
    for (const ex of [-46, 46]) { c.fillStyle = '#ffd93d'; c.beginPath(); c.arc(ex, -62, 12, 0, Math.PI * 2); c.fill(); c.fillStyle = '#18213a'; c.beginPath(); c.arc(ex - 4, -62, 5, 0, Math.PI * 2); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(ex - 6, -64, 1.8, 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = '#8a1c2a'; c.lineWidth = 4; c.beginPath(); c.moveTo(-60, -80); c.lineTo(-34, -74); c.moveTo(60, -80); c.lineTo(34, -74); c.stroke();   // strenge Brauen
    c.fillStyle = '#3a3a3a'; c.beginPath(); c.roundRect(-40, -48, 80, 10 + m * 14, 5); c.fill();
    c.fillStyle = '#d9d9d9'; for (let k = 0; k < 6; k++) c.fillRect(-36 + k * 13, -46, 8, 4 + m * 6);
    c.fillStyle = '#9aa3b0'; c.beginPath(); c.roundRect(-78, -30, 156, 10, 4); c.fill();   // Stoßstange
    for (const rx of [-40, 40, 110, 150, 230]) { c.fillStyle = '#1a1a1a'; c.beginPath(); c.arc(rx, -14, 14, 0, Math.PI * 2); c.fill(); c.fillStyle = '#aaa'; c.beginPath(); c.arc(rx, -14, 6, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }

  /* ---------- Welt 3 Grand Canyon: Kulisse, Felsboden, Schlucht, Felsbrocken, Steine, Hängebrücken, Kakteen, Gegner, Boss Sheriff Rattlesnake, Westerntor ---------- */
  function schildCanyon(c, x, y, s, mitText) {   // Aussichtspunkt-Schild „GRAND CANYON“ (braune Tafel auf zwei Pfosten)
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = '#5a3a22'; c.fillRect(-34, -20, 6, 40); c.fillRect(28, -20, 6, 40);
    c.fillStyle = '#7a4a24'; c.strokeStyle = '#f0e0c0'; c.lineWidth = 2; c.beginPath(); c.roundRect(-44, -52, 88, 38, 4); c.fill(); c.stroke();
    if (mitText !== false) {
      c.fillStyle = '#fff6e0'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = 'bold 11px system-ui, sans-serif'; c.fillText('GRAND', 0, -41); c.fillText('CANYON', 0, -29);
      c.font = 'bold 6px system-ui, sans-serif'; c.fillText('NATIONAL PARK', 0, -18);
    }
    c.restore();
  }
  function geierSilhouette(c, x, y, s, fl) {   // kreisender Geier am Himmel (V-Flügel)
    c.save(); c.translate(x, y); c.scale(s, s); c.strokeStyle = 'rgba(40,25,20,.75)'; c.lineWidth = 2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-14, 2 + fl * 3); c.quadraticCurveTo(-6, -4, 0, 0); c.quadraticCurveTo(6, -4, 14, 2 + fl * 3); c.stroke(); c.restore();
  }
  function hintergrundCanyon(c) {
    const naehe = Math.min(1, kamera / level.ende);   // Himmel: oben Blau, am Horizont Orange; Richtung Ziel wird alles abendlicher
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, mischFarbe('#3f8fdc', '#d96a3a', naehe * 0.55)); g.addColorStop(0.5, mischFarbe('#8fc3ee', '#f5a356', 0.3 + naehe * 0.7)); g.addColorStop(1, mischFarbe('#f7c98a', '#ffb070', naehe));
    c.fillStyle = g; c.fillRect(-viewW, -H, viewW * 3, H * 3);
    const sx = viewW * 0.22 + naehe * viewW * 0.3 - kamera * 0.005, sy = 70 + naehe * 90, sr = 22 + naehe * 10;   // Sonne wandert nach rechts unten
    const sg = c.createRadialGradient(sx, sy, sr * 0.5, sx, sy, sr * 3.2); sg.addColorStop(0, 'rgba(255,235,170,.6)'); sg.addColorStop(1, 'rgba(255,200,120,0)');
    c.fillStyle = sg; c.beginPath(); c.arc(sx, sy, sr * 3.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = mischFarbe('#fff1b0', '#ff8c4a', naehe); c.beginPath(); c.arc(sx, sy, sr, 0, Math.PI * 2); c.fill();
    // Geier kreisen am Himmel (Parallaxe 0,1)
    for (let i = 0; i < 4; i++) {
      const n = viewW + 500, cx = ((i * 430 + 120 - kamera * 0.1) % n + n) % n - 250, cy = 60 + (i % 3) * 26, a = zeit * (0.5 + i * 0.1) + i * 1.7;
      geierSilhouette(c, cx + Math.cos(a) * 46, cy + Math.sin(a) * 12, 0.9 + (i % 2) * 0.3, Math.sin(zeit * 3 + i));
    }
    // ferne Felsschichten (drei Ebenen Parallaxe, Rot wird nach vorn kräftiger), mit Schichtlinien
    const ebenen = [[0.05, 232, '#c98a6a', 70, 300], [0.12, 244, '#b8664a', 56, 240], [0.22, 252, '#9e4a34', 42, 190]];
    for (const [par, basis, farbe, hmax, abst] of ebenen) {
      const n = viewW + 420;
      for (let i = 0; i < 11; i++) {
        const bx = ((i * abst - kamera * par) % n + n) % n - 210, bh = hmax * (0.55 + ((i * 37) % 45) / 100), bw = abst * 0.9;
        c.fillStyle = farbe; c.beginPath(); c.moveTo(bx, basis); c.lineTo(bx + 14, basis - bh); c.lineTo(bx + bw - 18, basis - bh); c.lineTo(bx + bw + 6, basis); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(80,30,20,.18)'; c.lineWidth = 1.5; for (let k = 1; k < 4; k++) { const yy = basis - bh * k / 4; c.beginPath(); c.moveTo(bx + 8, yy); c.lineTo(bx + bw - 10, yy); c.stroke(); }
      }
    }
    // Aussichtspunkt-Schild „GRAND CANYON“ kommt näher: wandert von rechts in die Mitte und wächst bis zum Boss
    schildCanyon(c, viewW * (0.82 - 0.5 * naehe), 252 - naehe * 6, 0.7 + naehe * 1.1, true);
    // Hochplateau hinter dem Boden (rot), darunter Schluchtschatten
    c.fillStyle = mischFarbe('#c2603f', '#a8482e', naehe); c.fillRect(-viewW, 252, viewW * 3, H * 2);
    c.fillStyle = 'rgba(60,20,15,.25)'; c.fillRect(-viewW, 252, viewW * 3, 5);
    // Mittelgrund (Parallaxe 0,35): Felsnadeln, Kakteen, Totenkopf-Steine, Büsche
    const n = viewW + 500;
    for (let i = 0; i < 10; i++) {
      const bx = ((i * 470 + 90 - kamera * 0.35) % n + n) % n - 250, art = i % 4;
      if (art === 0) {   // Felsnadel
        c.fillStyle = '#8e3d2c'; c.beginPath(); c.moveTo(bx, 252); c.lineTo(bx + 10, 196); c.lineTo(bx + 22, 188); c.lineTo(bx + 34, 200); c.lineTo(bx + 46, 252); c.closePath(); c.fill();
        c.fillStyle = 'rgba(255,200,150,.25)'; c.fillRect(bx + 12, 208, 18, 3); c.fillRect(bx + 8, 228, 28, 3);
      } else if (art === 1) {   // Saguaro-Kaktus im Hintergrund
        c.fillStyle = '#3f7a3a'; c.beginPath(); c.roundRect(bx, 198, 12, 54, 6); c.roundRect(bx - 12, 212, 8, 22, 4); c.roundRect(bx + 16, 206, 8, 26, 4); c.fill();
        c.fillRect(bx - 12, 216, 14, 7); c.fillRect(bx + 10, 210, 14, 7);
      } else if (art === 2) {   // Felsbrocken-Gruppe
        c.fillStyle = '#9a5540'; c.beginPath(); c.ellipse(bx + 10, 246, 18, 10, 0, 0, Math.PI * 2); c.ellipse(bx + 36, 244, 12, 9, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = 'rgba(255,220,190,.3)'; c.beginPath(); c.ellipse(bx + 6, 240, 7, 3, 0, 0, Math.PI * 2); c.fill();
      } else {   // trockener Busch
        c.strokeStyle = '#7a5a3a'; c.lineWidth = 2; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(bx + 10, 252); c.quadraticCurveTo(bx + 10 + (k - 3) * 6, 236, bx + 10 + (k - 3) * 9, 226); c.stroke(); }
      }
    }
  }
  function felsboden(c, x0, w, a, b, links, rechts) {   // roter Fels: Schichtlinien, heller Rand oben, Kiesel
    c.fillStyle = '#b4452a'; c.fillRect(x0, BODEN_Y, w, H - BODEN_Y + 200);
    c.fillStyle = '#d9774a'; c.fillRect(x0, BODEN_Y, w, 8);
    c.fillStyle = 'rgba(60,20,10,.22)'; for (let yy = BODEN_Y + 24; yy < H; yy += 22) c.fillRect(x0, yy, w, 3);
    c.fillStyle = 'rgba(255,220,190,.3)';
    for (let x = Math.max(Math.ceil(a / 70) * 70, Math.floor(links / 70) * 70); x < Math.min(b, rechts); x += 70) c.beginPath(), c.ellipse(x - kamera + 20, BODEN_Y + 15, 5, 2.5, 0, 0, Math.PI * 2), c.fill();
  }
  function schlucht(c, a, b) {   // Lücke im Fels: tiefe Schlucht mit Schichten, unten der Colorado als blauer Faden
    const x0 = a - kamera, w = b - a;
    const g = c.createLinearGradient(0, BODEN_Y, 0, H); g.addColorStop(0, '#7a3324'); g.addColorStop(1, '#2b1410');
    c.fillStyle = g; c.fillRect(x0, BODEN_Y, w, H);
    c.fillStyle = 'rgba(255,160,120,.14)'; for (let yy = BODEN_Y + 18; yy < H; yy += 20) c.fillRect(x0 + 4, yy, w - 8, 3);
    c.fillStyle = '#3f8fdc'; c.fillRect(x0 + 6, H - 10, w - 12, 4);
  }
  function felsbrocken(c, x, y) {   // Felsbrocken statt Kiste (40 × 40, rund mit Lichtkante)
    c.fillStyle = '#8d5a46'; c.beginPath(); c.roundRect(x + 1, y + 2, KISTE - 2, KISTE - 2, 13); c.fill();
    c.fillStyle = '#a86e56'; c.beginPath(); c.ellipse(x + 15, y + 13, 9, 5, -0.4, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(40,15,10,.35)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + 8, y + 26); c.lineTo(x + 18, y + 31); c.moveTo(x + 24, y + 20); c.lineTo(x + 32, y + 27); c.stroke();
  }
  function kaktusZeichnen(c, k) {   // Saguaro am Weg (Berührung = Leben weg): Stamm, zwei Arme, Stacheln, Blüte
    const x = k.x - kamera, y = BODEN_Y;
    c.save(); c.translate(x, y);
    c.fillStyle = '#3f8a3e'; c.beginPath(); c.roundRect(-8, -KAKTUS_H, 16, KAKTUS_H, 8); c.fill();
    c.beginPath(); c.roundRect(-22, -34, 8, 20, 4); c.roundRect(14, -40, 8, 22, 4); c.fill(); c.fillRect(-22, -20, 16, 7); c.fillRect(6, -24, 16, 7);
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1; for (let i = 0; i < 6; i++) { const yy = -KAKTUS_H + 8 + i * 7; c.beginPath(); c.moveTo(-9, yy); c.lineTo(-12, yy - 2); c.moveTo(9, yy); c.lineTo(12, yy - 2); c.stroke(); }
    c.fillStyle = '#2f6b2e'; c.fillRect(-2, -KAKTUS_H + 6, 2, KAKTUS_H - 10);
    c.fillStyle = '#ff5d8a'; c.beginPath(); c.arc(0, -KAKTUS_H - 1, 4, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  function steinZeichnen(c, s) {   // fallender Stein: Warnung = Schatten + Staub am Boden, dann Felsbrocken im Fall, liegt kurz (wackelt), zerbröselt
    const x = s.x - kamera;
    if (s.phase === 'warnung') {
      const f = s.t / STEIN_WARNUNG;
      c.fillStyle = `rgba(40,15,10,${0.15 + 0.3 * f})`; c.beginPath(); c.ellipse(x, BODEN_Y + 2, 10 + 14 * f, 4 + 3 * f, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(230,190,150,.6)'; for (let k = 0; k < 4; k++) { const t = (zeit * 2 + k * 0.25) % 1; c.beginPath(); c.arc(x - 14 + k * 9 + Math.sin(zeit * 9 + k) * 3, BODEN_Y - 4 - t * 22, 3 + t * 4, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = 'rgba(0,0,0,.35)'; for (let k = 0; k < 3; k++) c.fillRect(x - 10 + k * 8 + Math.sin(zeit * 20 + k) * 2, -4, 5, 3 + ((k * 7) % 5));   // Geröll oben
      return;
    }
    if (s.phase !== 'faellt' && s.phase !== 'liegt') return;
    c.save(); c.translate(x, s.y);
    if (s.phase === 'faellt') { c.fillStyle = 'rgba(40,15,10,.3)'; c.beginPath(); c.ellipse(0, BODEN_Y - s.y + 2, 22, 6, 0, 0, Math.PI * 2); c.fill(); c.rotate(zeit * 6); }
    else if (s.t < 0.3) c.translate(0, Math.sin(s.t * 40) * 2);
    const f = s.phase === 'liegt' && s.t > STEIN_LIEGT - 0.4 ? Math.max(0.3, (STEIN_LIEGT - s.t) / 0.4) : 1;
    c.globalAlpha = f;
    if (s.phase === 'faellt') c.translate(0, 20);
    c.fillStyle = '#7a4a36'; c.beginPath(); c.moveTo(-20, -8); c.lineTo(-14, -30); c.lineTo(2, -40); c.lineTo(18, -30); c.lineTo(20, -10); c.lineTo(10, 0); c.lineTo(-12, 0); c.closePath(); c.fill();
    c.fillStyle = '#9a6650'; c.beginPath(); c.moveTo(-12, -26); c.lineTo(0, -34); c.lineTo(10, -28); c.lineTo(-2, -20); c.closePath(); c.fill();
    c.restore();
  }
  function brueckeZeichnen(c, b) {   // Hängebrücke: zwei Seile, Bretter, schwingt (stärker mit Figur drauf); kurz vor dem Bruch zittern die Bretter rot; gebrochen fallen Bretter bei bruchX
    const x0 = b.x - kamera, w = b.w, n = Math.max(4, Math.round(w / 24));
    const drauf = spieler.x + PW / 2 > b.x && spieler.x - PW / 2 < b.x + b.w && tot <= 0;
    const schwing = Math.sin(zeit * 3.2 + b.x) * (drauf ? 7 : 3), warn = Math.min(1, Math.max(0, (b.zeit - 0.8) / (BRUECKE_MAX - 0.8)));
    const sag = (f) => Math.sin(f * Math.PI) * (10 + schwing);
    c.save();
    for (const dy of [-34, -2]) {   // Seile
      c.strokeStyle = '#6b4a2a'; c.lineWidth = 3; c.beginPath(); c.moveTo(x0, BODEN_Y + dy);
      for (let i = 1; i <= 12; i++) { const f = i / 12; c.lineTo(x0 + w * f, BODEN_Y + dy + sag(f)); } c.stroke();
    }
    c.fillStyle = '#5a3a22'; c.fillRect(x0 - 6, BODEN_Y - 44, 6, 44); c.fillRect(x0 + w, BODEN_Y - 44, 6, 44);   // Pfosten
    for (let i = 0; i < n; i++) {
      const f = (i + 0.5) / n, px = x0 + (w / n) * i, py = BODEN_Y + sag(f), bx = b.x + (w / n) * i;
      let fallen = 0; if (b.gebrochen && Math.abs(bx + w / n / 2 - b.bruchX) < 50) fallen = b.bruch;
      const zitter = warn > 0 && !b.gebrochen ? Math.sin(zeit * 40 + i) * 2 * warn : 0;
      c.save(); c.translate(px + w / n / 2, py + zitter + fallen * fallen * 320); if (fallen) c.rotate(fallen * 1.2); c.globalAlpha = fallen ? Math.max(0, 1 - fallen / 1.2) : 1;
      c.fillStyle = warn > 0 && !fallen ? mischFarbe('#c98a4a', '#e6553a', warn) : '#c98a4a'; c.fillRect(-w / n / 2 + 1, -4, w / n - 2, 9);
      c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(-w / n / 2 + 1, 2, w / n - 2, 3);
      c.restore();
      c.strokeStyle = '#6b4a2a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(px + w / n / 2, py - 32 + sag(f) * 0); c.lineTo(px + w / n / 2, py - 2); c.stroke();   // Halteseile
    }
    c.restore();
  }
  function klapperschlange(c, g) {   // Klapperschlange: kriecht in Wellen, Rassel am Schwanz, Kopf mit Zunge; plattgedrückt flach
    const b = gegnerBox(g); const cx = b.x + 24, cy = b.y + 18;
    c.save(); c.translate(cx, cy); if (g.richtung > 0) c.scale(-1, 1);
    if (g.tot > 0) c.scale(1, Math.max(0.15, 1 - g.tot * 2));
    c.lineCap = 'round'; c.lineWidth = 9; c.strokeStyle = '#a0783c'; c.beginPath(); c.moveTo(22, -5);
    for (let i = 0; i <= 8; i++) { const x = 22 - i * 5, y = -5 - Math.sin(g.flug * 10 + i * 0.9) * 3 - (i > 6 ? (i - 6) * 3 : 0); c.lineTo(x, y); } c.stroke();
    c.strokeStyle = '#6b4a1e'; c.lineWidth = 3; for (let i = 1; i < 8; i += 2) { const x = 22 - i * 5, y = -5 - Math.sin(g.flug * 10 + i * 0.9) * 3; c.beginPath(); c.moveTo(x - 1.5, y - 4); c.lineTo(x + 1.5, y + 4); c.stroke(); }   // Rautenmuster
    c.fillStyle = '#c9a862'; c.save(); c.translate(26 + Math.sin(g.flug * 30) * 1.5, -8); for (let k = 0; k < 4; k++) c.fillRect(k * 3, -3 + (k % 2), 2.5, 6); c.restore();   // Rassel
    c.fillStyle = '#a0783c'; c.beginPath(); c.ellipse(-20, -12, 8, 5.5, 0, 0, Math.PI * 2); c.fill();   // Kopf
    c.fillStyle = '#ffd93d'; c.beginPath(); c.arc(-22, -14, 1.6, 0, Math.PI * 2); c.fill(); c.fillStyle = '#18213a'; c.beginPath(); c.arc(-22, -14, 0.8, 0, Math.PI * 2); c.fill();
    if (Math.floor(g.flug * 4) % 3 === 0) { c.strokeStyle = '#e63946'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-28, -11); c.lineTo(-34, -10); c.moveTo(-34, -10); c.lineTo(-36, -12); c.moveTo(-34, -10); c.lineTo(-36, -8); c.stroke(); }   // Zunge
    c.restore();
  }
  function geier(c, g) {   // Geier: fliegt auf Kopfhöhe wie die Taube – dunkler Körper, nackter roter Kopf, großer Flügelschlag, Halskrause
    const b = gegnerBox(g); const cx = b.x + 22, cy = b.y + 14;
    c.save(); c.translate(cx, cy); if (g.richtung > 0) c.scale(-1, 1);
    if (g.tot > 0) c.scale(1, Math.max(0.2, 1 - g.tot * 2));
    const fl = Math.sin(g.flug * 9);
    c.fillStyle = '#3a2f2a'; c.beginPath(); c.moveTo(-2, -2); c.quadraticCurveTo(12, -16 - fl * 12, 26, -8 - fl * 16); c.quadraticCurveTo(14, -1, 4, 3); c.closePath(); c.fill();   // hinterer Flügel
    c.fillStyle = '#4a3b34'; c.beginPath(); c.ellipse(0, 3, 14, 8, 0, 0, Math.PI * 2); c.fill();   // Körper
    for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(10, 2); c.lineTo(22, i * 4); c.lineTo(22, 4 + i * 4); c.closePath(); c.fill(); }   // Schwanz
    c.fillStyle = '#e9e2d0'; c.beginPath(); c.ellipse(-10, -1, 5, 5, 0, 0, Math.PI * 2); c.fill();   // Halskrause
    c.fillStyle = '#d9533f'; c.beginPath(); c.arc(-15, -5, 4.2, 0, Math.PI * 2); c.fill();   // nackter Kopf
    c.fillStyle = '#f0e0b0'; c.beginPath(); c.moveTo(-18, -5); c.lineTo(-25, -3); c.lineTo(-18, -2); c.closePath(); c.fill();   // Hakenschnabel
    c.fillStyle = '#18213a'; c.beginPath(); c.arc(-16, -6, 1, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#2a211d'; c.beginPath(); c.moveTo(-3, 0); c.quadraticCurveTo(10, -14 + fl * 12, 24, -4 + fl * 16); c.quadraticCurveTo(12, 2, 2, 5); c.closePath(); c.fill();   // vorderer Flügel
    c.restore();
  }
  function skorpion(c, g) {   // Skorpion: klein und schnell, Scheren vorn, Schwanz mit Stachel über dem Rücken, 8 Beine zappeln
    const b = gegnerBox(g); const cx = b.x + 14, cy = b.y + 16;
    c.save(); c.translate(cx, cy); if (g.richtung > 0) c.scale(-1, 1);
    if (g.tot > 0) c.scale(1, Math.max(0.15, 1 - g.tot * 2));
    const w = Math.sin(g.flug * 22) * 2;
    c.strokeStyle = '#6b3a1e'; c.lineWidth = 1.5; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(-6 + k * 4, -4); c.lineTo(-10 + k * 4 + (k % 2 ? w : -w), 0); c.stroke(); }
    c.fillStyle = '#8a4a26'; c.beginPath(); c.ellipse(0, -6, 9, 4.5, 0, 0, Math.PI * 2); c.fill();   // Körper
    c.strokeStyle = '#8a4a26'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(8, -7); c.quadraticCurveTo(14, -12, 12, -20); c.quadraticCurveTo(10, -24, 6, -22); c.stroke();   // Schwanz
    c.fillStyle = '#e63946'; c.beginPath(); c.moveTo(6, -22); c.lineTo(2, -24); c.lineTo(5, -19); c.closePath(); c.fill();   // Stachel
    c.strokeStyle = '#8a4a26'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-8, -6); c.lineTo(-14, -9 + w); c.moveTo(-8, -5); c.lineTo(-14, -2 - w); c.stroke();   // Scherenarme
    c.fillStyle = '#8a4a26'; c.beginPath(); c.ellipse(-16, -9 + w, 3.5, 2.2, 0, 0, Math.PI * 2); c.ellipse(-16, -2 - w, 3.5, 2.2, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#18213a'; c.beginPath(); c.arc(-7, -8, 0.9, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  function westernTor(c, x, y) {   // Tür der Welt 3: Holztor einer Westernstadt – Pfosten, Querbalken mit Schild, zwei Torflügel schwingen auf
    c.save(); c.translate(x, y);
    c.fillStyle = '#c99a6a'; c.fillRect(-70, -150, 240, 150); c.fillStyle = 'rgba(0,0,0,.08)'; for (let k = 0; k < 6; k++) c.fillRect(-70 + k * 40, -150, 2, 150);   // Bretterwand dahinter
    c.fillStyle = '#5a3a22'; c.fillRect(-52, -170, 14, 170); c.fillRect(38, -170, 14, 170);   // Pfosten
    c.fillStyle = '#7a4a24'; c.fillRect(-60, -182, 120, 20); c.strokeStyle = '#f0e0c0'; c.lineWidth = 2; c.strokeRect(-58, -180, 116, 16);
    c.fillStyle = '#fff6e0'; c.font = 'bold 12px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('CANYON TOWN', 0, -172);
    const offen = tuer.offen;
    if (offen > 0) { c.fillStyle = `rgba(255,240,180,${0.7 * offen})`; c.fillRect(-38, -150, 76, 150); }
    for (const seite of [-1, 1]) {   // Torflügel: schwingen nach hinten auf (in x gestaucht)
      c.save(); c.translate(seite * -38, 0); c.scale(Math.max(0.04, 1 - offen * 0.96), 1);
      c.fillStyle = '#8b5a2b'; c.fillRect(seite > 0 ? -38 : 0, -140, 38, 140);
      c.strokeStyle = '#5a3a22'; c.lineWidth = 2; for (let k = 0; k < 3; k++) { const bx = (seite > 0 ? -38 : 0) + 4 + k * 12; c.beginPath(); c.moveTo(bx, -136); c.lineTo(bx, -4); c.stroke(); }
      c.beginPath(); c.moveTo(seite > 0 ? -36 : 2, -40); c.lineTo(seite > 0 ? -2 : 36, -130); c.stroke();
      c.restore();
    }
    c.fillStyle = '#e0a400'; c.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 0.4, r = 9; c.lineTo(Math.cos(a) * r, -195 + Math.sin(a) * r); c.lineTo(Math.cos(a + Math.PI * 0.2) * 4, -195 + Math.sin(a + Math.PI * 0.2) * 4); } c.closePath(); c.fill();   // Sheriff-Stern auf dem Balken
    c.restore();
  }
  function felsspalt(c, x, y) {   // Riss im Fels, aus dem der Sheriff kommt
    c.save(); c.translate(x, y);
    c.fillStyle = '#2b1410'; c.beginPath(); c.moveTo(-50, 0); c.lineTo(-22, 3); c.lineTo(0, 1); c.lineTo(30, 4); c.lineTo(56, 0); c.lineTo(40, 8); c.lineTo(10, 10); c.lineTo(-24, 9); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(40,10,5,.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-50, 0); c.lineTo(-70, -6); c.moveTo(56, 0); c.lineTo(76, -5); c.stroke();
    if (boss.sichtbar > 0 && boss.sichtbar < 1) { c.fillStyle = 'rgba(230,190,150,.55)'; for (let k = 0; k < 5; k++) { const t = (zeit * 1.6 + k * 0.2) % 1; c.beginPath(); c.arc(-30 + k * 15, -t * 30, 3 + t * 5, 0, Math.PI * 2); c.fill(); } }
    c.restore();
  }
  function sheriffRattlesnake(c, x, y) {   // Boss Welt 3: Riesenklapperschlange mit Cowboyhut und Sternabzeichen – richtet sich aus dem Felsspalt auf, rasselt, verschwindet im Finale wieder
    if (boss.sichtbar <= 0) return;
    c.save();
    c.beginPath(); c.rect(x - 220, -40, 480, y + 44); c.clip();   // unterhalb des Bodens unsichtbar (kommt aus dem Spalt)
    const auf = boss.sichtbar * (1 - boss.weg);
    c.translate(x - 24, y + (1 - auf) * 190); c.scale(0.85, 0.85); c.globalAlpha = 1 - boss.weg * 0.5;   // etwas kleiner, damit der Hut im Zoom der Sequenz sichtbar bleibt
    const m = boss.maul, wiege = Math.sin(zeit * 2.2) * (zustand === 'boss' ? 6 : 3);
    // Körper: dicke Schlangenlinie von unten (Spalt) nach oben (Kopf), geschuppt
    c.lineCap = 'round'; c.lineWidth = 34; c.strokeStyle = '#a0783c';
    c.beginPath(); c.moveTo(20, 10); c.quadraticCurveTo(70, -40, 30, -80); c.quadraticCurveTo(-10, -120, 10 + wiege, -160); c.stroke();
    c.lineWidth = 16; c.strokeStyle = '#d9c07a'; c.beginPath(); c.moveTo(22, 6); c.quadraticCurveTo(66, -40, 30, -78); c.quadraticCurveTo(-4, -118, 10 + wiege, -156); c.stroke();   // heller Bauch
    const kurve = (t) => t < 0.5 ? [(1 - 2 * t) ** 2 * 20 + 2 * (1 - 2 * t) * 2 * t * 70 + (2 * t) ** 2 * 30, (1 - 2 * t) ** 2 * 10 + 2 * (1 - 2 * t) * 2 * t * -40 + (2 * t) ** 2 * -80]
      : [(2 - 2 * t) ** 2 * 30 + 2 * (2 - 2 * t) * (2 * t - 1) * -10 + (2 * t - 1) ** 2 * (10 + wiege), (2 - 2 * t) ** 2 * -80 + 2 * (2 - 2 * t) * (2 * t - 1) * -120 + (2 * t - 1) ** 2 * -160];   // Punkt auf der Körperkurve
    c.fillStyle = '#6b4a1e'; for (let i = 1; i < 8; i++) { const [px, py] = kurve(i / 8.5); c.beginPath(); c.moveTo(px - 7, py); c.lineTo(px, py - 8); c.lineTo(px + 7, py); c.lineTo(px, py + 8); c.closePath(); c.fill(); }   // Rauten
    // Rassel (rechts unten aus dem Spalt), zittert in der Sequenz und beim Reden
    const rz = Math.sin(zeit * 32) * (zustand === 'boss' || zustand === 'sequenz' ? 3 : 1);
    c.fillStyle = '#c9a862'; c.save(); c.translate(72, -8 + rz); for (let k = 0; k < 5; k++) { c.beginPath(); c.roundRect(k * 9, -8 + (k % 2) * 2, 8, 16 - k, 3); c.fill(); } c.restore();
    // Sternabzeichen auf der Brust
    c.save(); c.translate(26 + wiege * 0.4, -96); c.fillStyle = '#e0a400'; c.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 0.4; c.lineTo(Math.cos(a) * 11, Math.sin(a) * 11); c.lineTo(Math.cos(a + Math.PI * 0.2) * 5, Math.sin(a + Math.PI * 0.2) * 5); } c.closePath(); c.fill();
    c.fillStyle = '#7a4a16'; c.font = 'bold 7px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('SHERIFF', 0, 1); c.restore();
    // Kopf mit Maul (Oberkiefer klappt auf), Giftzähne, Zunge, Augen mit strengen Brauen
    c.save(); c.translate(10 + wiege, -168);
    c.fillStyle = '#a0783c'; c.beginPath(); c.roundRect(-8, -6, 56, 26, 10); c.fill();   // Unterkiefer
    c.fillStyle = '#e07a7a'; c.fillRect(4, -4, 36, 6 + m * 10);   // Rachen
    c.save(); c.translate(-4, -2); c.rotate(-0.6 * m);
    c.fillStyle = '#8f6a30'; c.beginPath(); c.roundRect(-6, -26, 60, 26, 12); c.fill();   // Oberkiefer
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(38, -2); c.lineTo(42, 8); c.lineTo(46, -2); c.moveTo(24, -2); c.lineTo(27, 6); c.lineTo(30, -2); c.fill();   // Giftzähne
    for (const ex of [16, 34]) { c.fillStyle = '#ffd93d'; c.beginPath(); c.ellipse(ex, -16, 6, 5, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#18213a'; c.beginPath(); c.ellipse(ex + 1, -16, 1.8, 4, 0, 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = '#5a3a1e'; c.lineWidth = 3; c.beginPath(); c.moveTo(8, -24); c.lineTo(22, -21); c.moveTo(42, -24); c.lineTo(28, -21); c.stroke();   // strenge Brauen
    // Cowboyhut (sitzt auf dem Oberkiefer = Kopf)
    c.fillStyle = '#5a3a22'; c.beginPath(); c.ellipse(24, -28, 40, 7, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.roundRect(2, -52, 44, 26, 8); c.fill(); c.fillStyle = '#e0a400'; c.fillRect(2, -34, 44, 4);
    c.restore();
    if (m > 0.3 || zustand === 'sequenz') { c.strokeStyle = '#e63946'; c.lineWidth = 2; c.beginPath(); c.moveTo(48, 6); c.lineTo(62, 4 + Math.sin(zeit * 20) * 3); c.lineTo(66, 0); c.moveTo(62, 4 + Math.sin(zeit * 20) * 3); c.lineTo(66, 8); c.stroke(); }   // Zunge
    c.restore();
    c.restore();
  }

  /* ---------- Welt 4 Mount Rushmore: Kulisse (Nadelwald, Berge, Präsidentenköpfe, Büffelherde), Waldboden, Bäche mit Trittsteinen, Holzstapel, Baumstämme, Windböen, Bärenhöhlen, Gegner, Boss Grizzly Grandpa, Ranger-Station ---------- */
  function schildRushmore(c, x, y, s, mitText) {   // Holzschild „MOUNT RUSHMORE“ (grüne Nationalpark-Tafel auf zwei Pfosten)
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = '#5a3a22'; c.fillRect(-34, -20, 6, 40); c.fillRect(28, -20, 6, 40);
    c.fillStyle = '#2e6b3f'; c.strokeStyle = '#f0e0c0'; c.lineWidth = 2; c.beginPath(); c.roundRect(-46, -52, 92, 38, 4); c.fill(); c.stroke();
    if (mitText !== false) {
      c.fillStyle = '#fff6e0'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = 'bold 11px system-ui, sans-serif'; c.fillText('MOUNT', 0, -41); c.fillText('RUSHMORE', 0, -29);
      c.font = 'bold 6px system-ui, sans-serif'; c.fillText('NATIONAL MEMORIAL', 0, -18);
    }
    c.restore();
  }
  function tanne(c, x, y, h, farbe, stamm) {   // Nadelbaum: Stamm + drei Stufen; (x, y) = Fußpunkt, h = Höhe
    c.fillStyle = stamm || 'rgba(0,0,0,.25)'; c.fillRect(x - h * 0.04, y - h * 0.25, h * 0.08, h * 0.25);
    c.fillStyle = farbe;
    for (let k = 0; k < 3; k++) { const b = h * (0.42 - k * 0.1), top = y - h * (0.45 + k * 0.27), unten = y - h * (0.18 + k * 0.27); c.beginPath(); c.moveTo(x - b, unten); c.lineTo(x, top); c.lineTo(x + b, unten); c.closePath(); c.fill(); }
  }
  function bueffelSilhouette(c, x, y, s, farbe) {   // grasender Büffel von der Seite (Silhouette): Buckel, tiefer Kopf, Horn, vier Beine
    c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = farbe;
    c.beginPath(); c.ellipse(0, -16, 22, 12, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(6, -24, 12, 9, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(-22, -12, 9, 8, 0, 0, Math.PI * 2); c.fill();
    for (const bx of [-14, -6, 8, 16]) c.fillRect(bx - 2, -8, 4, 8);
    c.beginPath(); c.moveTo(-26, -18); c.quadraticCurveTo(-30, -26, -24, -26); c.lineTo(-24, -22); c.closePath(); c.fill();
    c.restore();
  }
  function koepfeRushmore(c, x, y, s) {   // die vier Präsidentenköpfe als Cartoon-Profile (nach rechts) im Granit; (x, y) = Fußpunkt des Felsens, s = Größe (wächst Richtung Ziel)
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = '#8b8f96'; c.beginPath(); c.moveTo(-150, 0); c.lineTo(-130, -70); c.lineTo(-100, -92); c.lineTo(120, -92); c.lineTo(150, -60); c.lineTo(170, 0); c.closePath(); c.fill();   // Felsmassiv
    c.fillStyle = '#6f737a'; c.beginPath(); c.moveTo(-150, 0); c.lineTo(-120, -40); c.lineTo(-80, -30); c.lineTo(-40, -60); c.lineTo(-40, 0); c.closePath(); c.fill();   // Schatten links
    const kopf = (kx, ky, h, extra) => {   // Hinterkopf → Scheitel → Stirn → Nase → Lippen → Kinn; Roosevelt mit Brille/Schnauzer, Lincoln mit Bart
      c.fillStyle = '#b9bcc2'; c.beginPath();
      c.moveTo(kx - 26, ky); c.lineTo(kx - 26, ky - h * 0.75); c.quadraticCurveTo(kx - 22, ky - h, kx - 4, ky - h);
      c.quadraticCurveTo(kx + 10, ky - h, kx + 12, ky - h * 0.72);
      c.lineTo(kx + 11, ky - h * 0.58); c.lineTo(kx + 20, ky - h * 0.42); c.lineTo(kx + 10, ky - h * 0.38);
      c.lineTo(kx + 13, ky - h * 0.3); c.lineTo(kx + 9, ky - h * 0.26); c.lineTo(kx + 14, ky - h * 0.12);
      c.quadraticCurveTo(kx + 8, ky, kx - 2, ky); c.closePath(); c.fill();
      c.fillStyle = '#7d8188'; c.beginPath(); c.ellipse(kx + 4, ky - h * 0.56, 2.5, 1.6, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#7d8188'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(kx - 1, ky - h * 0.62); c.lineTo(kx + 9, ky - h * 0.63); c.stroke();
      if (extra === 'brille') { c.lineWidth = 1.4; c.beginPath(); c.arc(kx + 4, ky - h * 0.55, 4.5, 0, Math.PI * 2); c.stroke(); c.fillStyle = '#7d8188'; c.fillRect(kx + 8, ky - h * 0.32, 8, 2.5); }
      if (extra === 'bart') { c.fillStyle = '#9fa3aa'; c.beginPath(); c.moveTo(kx + 14, ky - h * 0.2); c.quadraticCurveTo(kx + 14, ky + 6, kx - 4, ky + 4); c.lineTo(kx - 4, ky); c.closePath(); c.fill(); }
    };
    kopf(-96, -36, 56, null); kopf(-44, -40, 54, null); kopf(14, -30, 50, 'brille'); kopf(72, -34, 56, 'bart');
    c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(-100, -92, 220, 4);
    c.restore();
  }
  function hintergrundRushmore(c) {
    const naehe = Math.min(1, kamera / level.ende);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#6fb2e8'); g.addColorStop(0.6, '#c9e4f6'); g.addColorStop(1, '#e9f3ea');   // kühler Himmel
    c.fillStyle = g; c.fillRect(-viewW, -H, viewW * 3, H * 3);
    c.fillStyle = 'rgba(255,255,255,.92)';   // Wolken (Parallaxe 0,08)
    for (let i = 0; i < 6; i++) {
      const n = viewW + 340, wx = ((i * 360 + 60 - kamera * 0.08) % n + n) % n - 170, wy = 36 + (i % 3) * 26;
      c.beginPath(); c.arc(wx, wy, 16, 0, Math.PI * 2); c.arc(wx + 20, wy - 9, 22, 0, Math.PI * 2); c.arc(wx + 46, wy, 15, 0, Math.PI * 2); c.arc(wx + 24, wy + 6, 18, 0, Math.PI * 2); c.fill();
    }
    for (let i = 0; i < 8; i++) {   // ferne Berge (Parallaxe 0,04), bläulich mit Schneekappen
      const n = viewW + 600, bx = ((i * 330 - kamera * 0.04) % n + n) % n - 300, bh = 60 + ((i * 53) % 50);
      c.fillStyle = '#8fa6c4'; c.beginPath(); c.moveTo(bx, 236); c.lineTo(bx + 120, 236 - bh); c.lineTo(bx + 240, 236); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.moveTo(bx + 104, 236 - bh + 14); c.lineTo(bx + 120, 236 - bh); c.lineTo(bx + 136, 236 - bh + 14); c.lineTo(bx + 128, 236 - bh + 11); c.lineTo(bx + 120, 236 - bh + 17); c.lineTo(bx + 112, 236 - bh + 11); c.closePath(); c.fill();
    }
    // Mount Rushmore: die vier Köpfe wandern von rechts in die Mitte und wachsen bis zum Boss
    koepfeRushmore(c, viewW * (0.8 - 0.42 * naehe) - kamera * 0.01, 238, 0.45 + naehe * 1.0);
    for (let i = 0; i < 26; i++) { const n = viewW + 200, bx = ((i * 46 - kamera * 0.1) % n + n) % n - 100; tanne(c, bx, 242, 28 + ((i * 29) % 22), '#3d6b5e', 'rgba(0,0,0,.2)'); }   // ferner Nadelwald (0,1)
    for (let i = 0; i < 18; i++) { const n = viewW + 260, bx = ((i * 70 + 20 - kamera * 0.22) % n + n) % n - 130; tanne(c, bx, 256, 46 + ((i * 37) % 34), '#2e7d4f', '#4a2e18'); }   // mittlerer Nadelwald (0,22)
    c.fillStyle = mischFarbe('#86bf5e', '#6fae55', naehe); c.fillRect(-viewW, 254, viewW * 3, H * 2);   // Wiese
    c.fillStyle = 'rgba(40,80,30,.18)'; c.fillRect(-viewW, 254, viewW * 3, 4);
    for (let i = 0; i < 9; i++) {   // Büffelherde als Silhouette auf der Wiese (Parallaxe 0,32)
      const n = viewW + 700, bx = ((i * 520 + 140 - kamera * 0.32) % n + n) % n - 350, grp = i % 3;
      bueffelSilhouette(c, bx, 292, 0.7, '#3a2a22'); if (grp !== 1) bueffelSilhouette(c, bx + 44, 296, 0.6, '#3a2a22'); if (grp === 2) bueffelSilhouette(c, bx + 80, 290, 0.5, '#3a2a22');
    }
    schildRushmore(c, viewW * (0.86 - 0.5 * naehe), 304 - naehe * 10, 0.6 + naehe * 1.0, true);   // Zielschild kommt näher
    for (let i = 0; i < 8; i++) { const n = viewW + 300, bx = ((i * 230 + 60 - kamera * 0.5) % n + n) % n - 150; tanne(c, bx, 330, 70 + ((i * 41) % 40), '#1f5f3a', '#4a2e18'); }   // nahe Tannen am Wegrand (0,5)
  }
  function waldboden(c, x0, w, a, b, links, rechts) {   // Waldweg: brauner Boden, Grasnarbe oben, Grashalme, Kiesel
    c.fillStyle = '#6b4a2e'; c.fillRect(x0, BODEN_Y, w, H - BODEN_Y + 200);
    c.fillStyle = '#5fa84a'; c.fillRect(x0, BODEN_Y, w, 9);
    c.fillStyle = '#3f8a3e'; c.fillRect(x0, BODEN_Y + 9, w, 2);
    c.fillStyle = 'rgba(0,0,0,.14)'; for (let yy = BODEN_Y + 30; yy < H; yy += 26) c.fillRect(x0, yy, w, 3);
    c.strokeStyle = '#4f9a40'; c.lineWidth = 2;
    for (let x = Math.max(Math.ceil(a / 34) * 34, Math.floor(links / 34) * 34); x < Math.min(b, rechts); x += 34) { const sx = x - kamera; c.beginPath(); c.moveTo(sx, BODEN_Y + 1); c.lineTo(sx - 3, BODEN_Y - 6); c.moveTo(sx + 4, BODEN_Y + 1); c.lineTo(sx + 7, BODEN_Y - 5); c.stroke(); }
    c.fillStyle = 'rgba(255,230,200,.25)';
    for (let x = Math.max(Math.ceil(a / 90) * 90, Math.floor(links / 90) * 90); x < Math.min(b, rechts); x += 90) { c.beginPath(); c.ellipse(x - kamera + 30, BODEN_Y + 20, 5, 2.5, 0, 0, Math.PI * 2); c.fill(); }
  }
  function bachZeichnen(c, a, b) {   // Lücke = Bach: Wasser mit Wellen, Uferkanten und Ufersteine
    const x0 = a - kamera, w = b - a;
    const g = c.createLinearGradient(0, BODEN_Y, 0, H); g.addColorStop(0, '#5fb6e6'); g.addColorStop(1, '#1f5f9e');
    c.fillStyle = g; c.fillRect(x0, BODEN_Y + 6, w, H);
    c.fillStyle = '#6b4a2e'; c.fillRect(x0 - 2, BODEN_Y, 8, H - BODEN_Y); c.fillRect(x0 + w - 6, BODEN_Y, 8, H - BODEN_Y);
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2;
    for (let i = 0; i < Math.ceil(w / 40); i++) { const wx = x0 + 8 + ((i * 40 + zeit * 60) % Math.max(1, w - 24)), wy = BODEN_Y + 16 + (i % 3) * 14; c.beginPath(); c.moveTo(wx, wy); c.quadraticCurveTo(wx + 7, wy - 4, wx + 14, wy); c.stroke(); }
    c.fillStyle = '#9a9a9a'; c.beginPath(); c.ellipse(x0 + 6, BODEN_Y + 10, 9, 5, 0, 0, Math.PI * 2); c.ellipse(x0 + w - 6, BODEN_Y + 12, 10, 5, 0, 0, Math.PI * 2); c.fill();
  }
  function trittstein(c, x, y, w) {   // Trittstein im Bach: flacher grauer Stein mit Moos, Gischt rundherum
    c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(x + w / 2, y + 12, w / 2 + 8 + Math.sin(zeit * 5 + x) * 2, 7, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#7f8388'; c.beginPath(); c.roundRect(x, y - 2, w, 20, 9); c.fill();
    c.fillStyle = '#a9adb3'; c.beginPath(); c.ellipse(x + w / 2, y + 3, w / 2 - 4, 4, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#5fa84a'; c.beginPath(); c.ellipse(x + 10, y + 1, 5, 2, 0, 0, Math.PI * 2); c.fill();
  }
  function holzstapel(c, x, y) {   // Holzstapel statt Kiste (40 × 40): Stammenden mit Jahresringen zwischen zwei Pfählen
    c.fillStyle = '#5a3a22'; c.fillRect(x, y, 4, KISTE); c.fillRect(x + KISTE - 4, y, 4, KISTE);
    const r = 6.2;
    for (const [cx, cy] of [[10, 33], [20, 33], [30, 33], [15, 22.5], [25, 22.5], [10, 12], [20, 12], [30, 12]]) {
      c.fillStyle = '#8b5a2b'; c.beginPath(); c.arc(x + cx, y + cy, r, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#d9b27a'; c.beginPath(); c.arc(x + cx, y + cy, r - 1.8, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(90,50,20,.5)'; c.lineWidth = 1; c.beginPath(); c.arc(x + cx, y + cy, r - 4, 0, Math.PI * 2); c.stroke();
    }
  }
  function stammZeichnen(c, s) {   // Baumstamm: liegt oben am Hang (ruhe) bzw. rollt nach links (rollt): Rinde, Stirnseite mit Jahresringen, Staubwolke dahinter
    const x = (s.phase === 'rollt' ? s.rx : s.x) - kamera;
    c.save(); c.translate(x, BODEN_Y - STAMM_R);
    if (s.phase === 'rollt') { c.fillStyle = 'rgba(120,90,60,.35)'; for (let k = 0; k < 3; k++) { const t = (zeit * 2.5 + k * 0.33) % 1; c.beginPath(); c.arc(STAMM_R + 6 + t * 24, STAMM_R - 4 - t * 10, 4 + t * 6, 0, Math.PI * 2); c.fill(); } }
    else { c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(0, STAMM_R + 1, STAMM_R + 4, 4, 0, 0, Math.PI * 2); c.fill(); }
    c.rotate(s.rot);
    c.fillStyle = '#6b4a2e'; c.beginPath(); c.arc(0, 0, STAMM_R, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#4a2e18'; c.lineWidth = 3; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4; c.beginPath(); c.moveTo(Math.cos(a) * 13, Math.sin(a) * 13); c.lineTo(Math.cos(a) * STAMM_R, Math.sin(a) * STAMM_R); c.stroke(); }
    c.fillStyle = '#d9b27a'; c.beginPath(); c.arc(0, 0, STAMM_R - 6, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(120,80,40,.6)'; c.lineWidth = 1.2; for (const r of [4, 8, 11]) { c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.stroke(); }
    c.fillStyle = '#8b5a2b'; c.beginPath(); c.arc(-3, 2, 1.8, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  function windZeichnen(c) {   // Windböe (Bildschirmkoordinaten): Blätter ziehen quer übers Bild – Warnung: wenige, Schub: dicht + weiße Windlinien; Richtung = Schubrichtung
    const warn = wind.phase === 'warnung', r = wind.richtung, v = (warn ? 260 : 620) * r;
    c.save();
    for (let i = 0; i < (warn ? 10 : 22); i++) {
      const span = viewW + 80, lx = (((i * 131 + 40) + zeit * v) % span + span) % span - 40, ly = 90 + ((i * 67) % 230) + Math.sin(zeit * 6 + i) * 8;
      c.fillStyle = ['#7fbf4a', '#e0a400', '#c8643a', '#4f9a40'][i % 4]; c.globalAlpha = warn ? 0.55 : 0.9;
      c.save(); c.translate(lx, ly); c.rotate(zeit * 9 + i); c.beginPath(); c.ellipse(0, 0, 6, 3.2, 0, 0, Math.PI * 2); c.fill(); c.restore();
    }
    if (!warn) {
      c.globalAlpha = 1; c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2; c.lineCap = 'round';
      for (let i = 0; i < 9; i++) { const span = viewW + 140, lx = (((i * 97) + zeit * 900 * r) % span + span) % span - 70, ly = 70 + ((i * 53) % 250); c.beginPath(); c.moveTo(lx, ly); c.lineTo(lx - 50 * r, ly + 2); c.stroke(); }
    }
    c.restore();
  }
  function hoehleZeichnen(c, h) {   // Bärenhöhle: Felshügel mit dunkler Öffnung (glühende Augen); der Bär schaut heraus (schaut), dann fegt die Pranke davor (pranke) und zieht sich zurück
    const x = h.x - kamera, y = BODEN_Y;
    c.save(); c.translate(x, y);
    c.fillStyle = '#7d7368'; c.beginPath(); c.moveTo(-80, 0); c.quadraticCurveTo(-70, -78, 0, -84); c.quadraticCurveTo(70, -78, 80, 0); c.closePath(); c.fill();
    c.fillStyle = '#5fa84a'; c.beginPath(); c.ellipse(-30, -70, 18, 7, -0.3, 0, Math.PI * 2); c.ellipse(28, -72, 16, 6, 0.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#1a1412'; c.beginPath(); c.moveTo(-38, 0); c.quadraticCurveTo(-40, -62, 0, -64); c.quadraticCurveTo(40, -62, 38, 0); c.closePath(); c.fill();
    const ph = h.phase, t = h.t;
    if ((ph === 'ruhe' || ph === 'weg') && Math.floor(zeit * 1.5) % 2 === 0) { c.fillStyle = '#ffd93d'; c.beginPath(); c.arc(-9, -30, 2.2, 0, Math.PI * 2); c.arc(9, -30, 2.2, 0, Math.PI * 2); c.fill(); }
    if (ph === 'schaut' || ph === 'pranke' || ph === 'zurueck') {
      const raus = Math.max(0.02, ph === 'schaut' ? Math.min(1, t / 0.25) : ph === 'zurueck' ? Math.max(0, 1 - t / 0.5) : 1);
      c.save(); c.translate(0, -22 - raus * 10); c.scale(raus, raus);   // Kopf kommt aus dem Dunkeln
      c.fillStyle = '#5a3a22'; c.beginPath(); c.arc(0, 0, 22, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(-16, -14, 7, 0, Math.PI * 2); c.arc(16, -14, 7, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#c9a070'; c.beginPath(); c.ellipse(0, 7, 11, 8, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#18213a'; c.beginPath(); c.arc(0, 4, 3.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(-8, -4, 3.2, 0, Math.PI * 2); c.arc(8, -4, 3.2, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#18213a'; c.beginPath(); c.arc(-7, -4, 1.6, 0, Math.PI * 2); c.arc(9, -4, 1.6, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#3a2214'; c.lineWidth = 2; c.beginPath(); c.moveTo(-12, -10); c.lineTo(-4, -8); c.moveTo(12, -10); c.lineTo(4, -8); c.stroke();
      c.restore();
    }
    if (ph === 'pranke' || ph === 'zurueck') {   // Pranke fegt vor der Höhle (Trefferzone ± 35 um die Mitte, 44 hoch): Arm aus der Öffnung, Tatze mit Krallen, Schwunglinien
      const f = Math.max(0.02, ph === 'pranke' ? Math.min(1, t / 0.15) : Math.max(0, 1 - t / 0.3));
      c.save(); c.translate(0, -PRANKE_H + 4); c.scale(f, f);
      c.strokeStyle = '#5a3a22'; c.lineCap = 'round'; c.lineWidth = 22; c.beginPath(); c.moveTo(10, -14); c.quadraticCurveTo(-10, -4, -24, 22); c.stroke();
      c.fillStyle = '#5a3a22'; c.beginPath(); c.ellipse(-26, 26, 18, 13, -0.4, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#e9e2d0'; for (let k = 0; k < 4; k++) { const a = -2.6 + k * 0.5; c.beginPath(); c.moveTo(-26 + Math.cos(a) * 15, 26 + Math.sin(a) * 11); c.lineTo(-26 + Math.cos(a) * 28, 26 + Math.sin(a) * 22); c.lineTo(-26 + Math.cos(a + 0.28) * 15, 26 + Math.sin(a + 0.28) * 11); c.closePath(); c.fill(); }
      c.restore();
      if (ph === 'pranke') { c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(-4, -26, 30 + k * 9 + Math.sin(zeit * 30) * 2, Math.PI * 0.55, Math.PI * 1.3); c.stroke(); } }
    }
    c.restore();
  }
  function bueffel(c, g) {   // Büffel: groß und schwer, rennt nach links durch (nicht plattzudrücken, nur überspringen) – Buckel, zottiger Kopf, Horn, Bart, galoppierende Beine, Staub
    const b = gegnerBox(g); const cx = b.x + 36, cy = b.y + 46;
    c.save(); c.translate(cx, cy); if (g.richtung > 0) c.scale(-1, 1);
    const p = g.flug * 16, hop = Math.abs(Math.sin(p)) * 3;
    c.fillStyle = 'rgba(120,90,60,.3)'; for (let k = 0; k < 3; k++) { const t = (g.flug * 2 + k * 0.33) % 1; c.beginPath(); c.arc(30 + t * 26, -4 - t * 8, 4 + t * 6, 0, Math.PI * 2); c.fill(); }
    c.translate(0, -hop);
    c.lineCap = 'round'; c.lineWidth = 7; c.strokeStyle = '#4a3324';
    for (const [bx, ph] of [[18, 0], [26, Math.PI], [-14, Math.PI], [-22, 0]]) { c.beginPath(); c.moveTo(bx, -18); c.lineTo(bx + Math.sin(p + ph) * 9, -2); c.stroke(); }
    c.fillStyle = '#5a3f2e'; c.beginPath(); c.ellipse(4, -26, 30, 16, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#4a3324'; c.beginPath(); c.ellipse(10, -36, 18, 12, 0, 0, Math.PI * 2); c.fill();
    for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(-4 + k * 5, -44 + (k % 2) * 2, 4, 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = '#4a3324'; c.lineWidth = 3; c.beginPath(); c.moveTo(32, -30); c.quadraticCurveTo(42, -22 + Math.sin(p) * 3, 38, -12); c.stroke();
    c.fillStyle = '#3f2a1e'; c.beginPath(); c.ellipse(-26, -22, 14, 12, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#4a3324'; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(-34 + k * 5, -32, 4, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#3f2a1e'; c.beginPath(); c.moveTo(-26, -12); c.lineTo(-22, -2); c.lineTo(-16, -12); c.closePath(); c.fill();
    c.fillStyle = '#e9e2d0'; c.beginPath(); c.moveTo(-28, -30); c.quadraticCurveTo(-36, -42, -26, -42); c.lineTo(-24, -34); c.closePath(); c.fill();
    c.fillStyle = '#18213a'; c.beginPath(); c.arc(-32, -24, 2, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#2a1a12'; c.beginPath(); c.ellipse(-38, -17, 4, 3, 0, 0, Math.PI * 2); c.fill();
    if (Math.floor(g.flug * 3) % 2 === 0) { c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(-44, -16, 3, 0, Math.PI * 2); c.arc(-48, -14, 2, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }
  function biber(c, g) {   // Biber: rundlicher brauner Körper, flacher Kellenschwanz, zwei Nagezähne, kleine Ohren; plattgedrückt flach
    const b = gegnerBox(g); const cx = b.x + 16, cy = b.y + 20;
    c.save(); c.translate(cx, cy); if (g.richtung > 0) c.scale(-1, 1);
    if (g.tot > 0) c.scale(1, Math.max(0.15, 1 - g.tot * 2));
    const w = Math.sin(g.flug * 10) * 2;
    c.fillStyle = '#4a3324'; c.beginPath(); c.ellipse(16, -3, 10, 4.5, 0.15 + w * 0.05, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(10 + k * 4, -6); c.lineTo(12 + k * 4, 0); c.stroke(); }
    c.fillStyle = '#7a5230'; c.beginPath(); c.ellipse(0, -9, 13, 9, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#8f6a45'; c.beginPath(); c.ellipse(-2, -6, 7, 5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#7a5230'; c.beginPath(); c.arc(-11, -13, 7, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(-14, -19, 2.5, 0, Math.PI * 2); c.arc(-7, -19, 2.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#18213a'; c.beginPath(); c.arc(-14, -14, 1.4, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(-18, -11, 1.6, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff6c0'; c.fillRect(-18, -9, 2.2, 4); c.fillRect(-15.4, -9, 2.2, 4);
    c.fillStyle = '#4a3324'; c.beginPath(); c.roundRect(-9 + w, -2, 5, 3, 1.5); c.roundRect(2 - w, -2, 6, 3, 1.5); c.fill();
    c.restore();
  }
  function adler(c, g) {   // Weißkopfseeadler: fliegt auf Kopfhöhe wie die Taube – dunkelbrauner Körper, weißer Kopf und Schwanz, gelber Hakenschnabel, großer Flügelschlag
    const b = gegnerBox(g); const cx = b.x + 26, cy = b.y + 14;
    c.save(); c.translate(cx, cy); if (g.richtung > 0) c.scale(-1, 1);
    if (g.tot > 0) c.scale(1, Math.max(0.2, 1 - g.tot * 2));
    const fl = Math.sin(g.flug * 8);
    c.fillStyle = '#4a3324'; c.beginPath(); c.moveTo(-2, -2); c.quadraticCurveTo(14, -18 - fl * 14, 30, -8 - fl * 18); c.quadraticCurveTo(16, 0, 4, 3); c.closePath(); c.fill();
    c.fillStyle = '#5a3f2e'; c.beginPath(); c.ellipse(0, 3, 15, 8, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f4f4f4'; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(11, 2); c.lineTo(24, i * 4); c.lineTo(24, 4 + i * 4); c.closePath(); c.fill(); }
    c.beginPath(); c.arc(-14, -4, 6, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffd93d'; c.beginPath(); c.moveTo(-19, -5); c.lineTo(-27, -3); c.lineTo(-21, 0); c.lineTo(-19, -2); c.closePath(); c.fill();
    c.fillStyle = '#18213a'; c.beginPath(); c.arc(-16, -6, 1.3, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#3a2a22'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-19, -9); c.lineTo(-12, -8); c.stroke();
    c.strokeStyle = '#ffd93d'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-4, 9); c.lineTo(-6, 13); c.moveTo(0, 9); c.lineTo(-1, 13); c.stroke();
    c.fillStyle = '#3a2a22'; c.beginPath(); c.moveTo(-3, 0); c.quadraticCurveTo(12, -16 + fl * 14, 28, -4 + fl * 18); c.quadraticCurveTo(14, 2, 2, 5); c.closePath(); c.fill();
    c.restore();
  }
  function baerenhoehleBoss(c, x, y) {   // große Höhle im Fels am Boss-Platz: Grizzly Grandpa schläft darin (Zzz), Staub, wenn er herauskommt
    c.save(); c.translate(x, y);
    c.fillStyle = '#7d7368'; c.beginPath(); c.moveTo(-120, 0); c.quadraticCurveTo(-110, -150, 0, -160); c.quadraticCurveTo(110, -150, 120, 0); c.closePath(); c.fill();
    c.fillStyle = '#6a6158'; c.beginPath(); c.moveTo(-120, 0); c.quadraticCurveTo(-100, -90, -60, -120); c.lineTo(-70, 0); c.closePath(); c.fill();
    c.fillStyle = '#5fa84a'; c.beginPath(); c.ellipse(-50, -138, 26, 9, -0.25, 0, Math.PI * 2); c.ellipse(40, -146, 24, 8, 0.2, 0, Math.PI * 2); c.fill();
    tanne(c, 70, -120, 56, '#2e7d4f', '#4a2e18'); tanne(c, -80, -100, 44, '#1f5f3a', '#4a2e18');
    c.fillStyle = '#1a1412'; c.beginPath(); c.moveTo(-62, 0); c.quadraticCurveTo(-66, -118, 0, -122); c.quadraticCurveTo(66, -118, 62, 0); c.closePath(); c.fill();
    c.fillStyle = '#fff6e0'; c.fillRect(-28, -152, 56, 16); c.fillStyle = '#5a3a22'; c.font = 'bold 10px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('KEEP OUT', 0, -144);
    if (boss.sichtbar <= 0 && zustand !== 'finale' && zustand !== 'fertig') { const t = zeit % 2; c.globalAlpha = 1 - t / 2; c.fillStyle = 'rgba(255,255,255,.9)'; c.font = 'bold 16px system-ui, sans-serif'; c.fillText('Z', -4 + t * 14, -90 - t * 30); c.font = 'bold 11px system-ui, sans-serif'; c.fillText('z', 12 + t * 14, -108 - t * 30); c.globalAlpha = 1; }
    if (boss.sichtbar > 0 && boss.sichtbar < 1) { c.fillStyle = 'rgba(200,190,170,.5)'; for (let k = 0; k < 5; k++) { const t = (zeit * 1.6 + k * 0.2) % 1; c.beginPath(); c.arc(-40 + k * 20, -t * 30, 3 + t * 5, 0, Math.PI * 2); c.fill(); } }
    c.restore();
  }
  function grizzlyGrandpa(c, x, y) {   // Boss Welt 4: großer alter Grizzly, aufrecht, mit runder Brille, grauem Bart, buschigen Brauen, Schlafmütze und Wanderstock – kommt gähnend aus dem Dunkel der Höhle, geht im Finale zurück
    if (boss.sichtbar <= 0) return;
    const auf = boss.sichtbar * (1 - boss.weg);
    c.save();
    c.translate(x - 10, y); c.globalAlpha = Math.min(1, auf * 1.4); c.scale(0.55 + 0.45 * auf, 0.55 + 0.45 * auf);
    const gaehn = zustand === 'sequenz' ? Math.sin(Math.min(1, boss.sichtbar) * Math.PI) : 0, m = Math.max(boss.maul, gaehn), wank = Math.sin(zeit * 1.6) * (zustand === 'boss' ? 2 : 1);
    const fell = '#7a5c45', fellD = '#5a3f2e', grau = '#c9c9c9';
    c.translate(wank, 0);
    c.strokeStyle = '#8b5a2b'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(52, -96); c.lineTo(58, -4); c.stroke(); c.fillStyle = '#5a3a22'; c.beginPath(); c.arc(52, -100, 7, 0, Math.PI * 2); c.fill();   // Wanderstock
    c.fillStyle = fellD; c.beginPath(); c.roundRect(-30, -50, 24, 50, 8); c.roundRect(8, -50, 24, 50, 8); c.fill();   // Beine
    c.fillStyle = fell; c.beginPath(); c.ellipse(-16, -4, 18, 8, 0, 0, Math.PI * 2); c.ellipse(22, -4, 18, 8, 0, 0, Math.PI * 2); c.fill();   // Füße
    c.fillStyle = fell; c.beginPath(); c.ellipse(0, -92, 50, 56, 0, 0, Math.PI * 2); c.fill();   // dicker Körper
    c.fillStyle = '#a88563'; c.beginPath(); c.ellipse(4, -84, 30, 36, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = fell; c.lineWidth = 20; c.beginPath(); c.moveTo(34, -120); c.quadraticCurveTo(58, -110, 54, -92); c.stroke();   // Arm am Stock
    c.beginPath(); c.moveTo(-34, -122); c.quadraticCurveTo(-70 + gaehn * 40, -110 - gaehn * 30, -40 + gaehn * 20, -96 - gaehn * 70); c.stroke();   // Arm (hebt sich beim Gähnen vor den Mund)
    c.fillStyle = fellD; c.beginPath(); c.arc(-40 + gaehn * 20, -96 - gaehn * 70, 12, 0, Math.PI * 2); c.arc(54, -92, 11, 0, Math.PI * 2); c.fill();   // Tatzen
    c.save(); c.translate(-4, -160 + m * 2);   // Kopf
    c.fillStyle = fell; c.beginPath(); c.arc(-22, -22, 13, 0, Math.PI * 2); c.arc(22, -22, 13, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#a88563'; c.beginPath(); c.arc(-22, -22, 6, 0, Math.PI * 2); c.arc(22, -22, 6, 0, Math.PI * 2); c.fill();
    c.fillStyle = fell; c.beginPath(); c.ellipse(0, 0, 36, 32, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = grau; c.beginPath(); c.moveTo(-26, 10); c.quadraticCurveTo(-24, 44, 0, 48); c.quadraticCurveTo(24, 44, 26, 10); c.quadraticCurveTo(0, 22, -26, 10); c.closePath(); c.fill();   // grauer Bart
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1.5; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * 7, 22); c.quadraticCurveTo(k * 7 + 1, 32, k * 6, 42); c.stroke(); }
    c.fillStyle = '#a88563'; c.beginPath(); c.ellipse(0, 12, 18, 13, 0, 0, Math.PI * 2); c.fill();   // Schnauze
    c.fillStyle = '#3a2214'; c.beginPath(); c.ellipse(0, 7, 7, 5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#5a1e1e'; c.beginPath(); c.ellipse(0, 20, 9 * (0.4 + m * 0.6), 3 + m * 10, 0, 0, Math.PI * 2); c.fill();   // Maul (gähnt / spricht)
    if (m > 0.3) { c.fillStyle = '#fff'; c.fillRect(-6, 15 + m * 2, 3, 4); c.fillRect(3, 15 + m * 2, 3, 4); }
    c.fillStyle = grau; c.beginPath(); c.ellipse(-16, -13, 9, 3, -0.2, 0, Math.PI * 2); c.ellipse(16, -13, 9, 3, 0.2, 0, Math.PI * 2); c.fill();   // buschige Brauen
    for (const ex of [-13, 13]) {   // müde Augen (Lid senkt sich beim Gähnen) + runde Brille
      c.fillStyle = '#fff'; c.beginPath(); c.arc(ex, -4, 5.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#18213a'; c.beginPath(); c.arc(ex + 1, -3, 2.4, 0, Math.PI * 2); c.fill();
      c.fillStyle = fell; c.fillRect(ex - 6, -10, 12, 3 + gaehn * 6);
      c.strokeStyle = '#e0a400'; c.lineWidth = 2.2; c.beginPath(); c.arc(ex, -4, 8.5, 0, Math.PI * 2); c.stroke();
      c.fillStyle = 'rgba(180,220,255,.25)'; c.beginPath(); c.arc(ex, -4, 8.5, 0, Math.PI * 2); c.fill();
    }
    c.strokeStyle = '#e0a400'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-4.5, -4); c.lineTo(4.5, -4); c.moveTo(-21.5, -5); c.lineTo(-30, -9); c.moveTo(21.5, -5); c.lineTo(30, -9); c.stroke();
    c.fillStyle = '#2a6cff'; c.beginPath(); c.moveTo(-30, -22); c.quadraticCurveTo(-6, -58, 44, -60); c.quadraticCurveTo(14, -50, 30, -24); c.closePath(); c.fill();   // Schlafmütze
    c.fillStyle = '#fff'; c.beginPath(); c.roundRect(-33, -28, 64, 9, 4); c.fill(); c.beginPath(); c.arc(46, -60, 6, 0, Math.PI * 2); c.fill();
    c.restore();
    if (gaehn > 0.5 && zustand === 'sequenz') { c.fillStyle = 'rgba(255,255,255,.9)'; c.font = 'bold 18px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Aaah…', 44, -222 - gaehn * 10); }
    c.restore();
  }
  function rangerTor(c, x, y) {   // Tür der Welt 4: Tor der Ranger-Station – Blockhaus-Wand, Stamm-Pfosten, Balken mit Schild „RANGER STATION“ und Tannen-Logo, zwei Lattenflügel schwingen auf, Laterne
    c.save(); c.translate(x, y);
    c.fillStyle = '#8b5a2b'; c.fillRect(-70, -150, 240, 150); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 2; for (let k = 1; k < 8; k++) { c.beginPath(); c.moveTo(-70, -150 + k * 19); c.lineTo(170, -150 + k * 19); c.stroke(); }
    c.fillStyle = '#2e6b3f'; c.fillRect(-70, -158, 240, 10);
    c.fillStyle = '#6b4a2e'; c.beginPath(); c.roundRect(-56, -176, 18, 176, 8); c.roundRect(38, -176, 18, 176, 8); c.fill();
    c.fillStyle = '#5a3a22'; c.fillRect(-62, -190, 124, 16);
    c.fillStyle = '#2e6b3f'; c.strokeStyle = '#f0e0c0'; c.lineWidth = 2; c.beginPath(); c.roundRect(-66, -214, 132, 26, 5); c.fill(); c.stroke();
    c.fillStyle = '#fff6e0'; c.font = 'bold 12px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('RANGER STATION', 0, -201);
    tanne(c, 0, -216, 22, '#5fa84a', '#4a2e18');
    const offen = tuer.offen;
    if (offen > 0) { c.fillStyle = `rgba(255,240,180,${0.7 * offen})`; c.fillRect(-38, -150, 76, 150); }
    for (const seite of [-1, 1]) {
      c.save(); c.translate(seite * -38, 0); c.scale(Math.max(0.04, 1 - offen * 0.96), 1);
      c.fillStyle = '#c99a6a'; c.fillRect(seite > 0 ? -38 : 0, -140, 38, 140);
      c.strokeStyle = '#7a4a24'; c.lineWidth = 2; for (let k = 0; k < 3; k++) { const bx = (seite > 0 ? -38 : 0) + 5 + k * 12; c.beginPath(); c.moveTo(bx, -136); c.lineTo(bx, -4); c.stroke(); }
      c.beginPath(); c.moveTo(seite > 0 ? -36 : 2, -40); c.lineTo(seite > 0 ? -2 : 36, -130); c.stroke();
      c.restore();
    }
    c.fillStyle = '#3a3a3a'; c.fillRect(-64, -134, 4, 10); c.fillStyle = '#ffd93d'; c.beginPath(); c.arc(-62, -118, 6, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  /* ---------- Welt 5 California · Golden Gate Bridge (30.10.) ---------- */
  const GG_ROT = '#c0462b';   // „International Orange“ der Golden Gate
  function brueckenTurm(c, x, y, h, w, farbe) {   // Golden-Gate-Pfeiler: zwei Stiele mit Querriegeln (Art déco); (x, y) = Fußpunkt Mitte, h = Höhe, w = Breite
    c.fillStyle = farbe;
    c.fillRect(x - w / 2, y - h, w * 0.3, h); c.fillRect(x + w / 2 - w * 0.3, y - h, w * 0.3, h);
    for (let k = 0; k < 4; k++) c.fillRect(x - w / 2, y - h + h * (0.04 + k * 0.27), w, h * 0.07);
    c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(x + w / 2 - w * 0.3, y - h, w * 0.1, h);
  }
  function goldenGateFern(c, x, y, s) {   // die Brücke in der Ferne: zwei Türme, Hauptkabel mit Durchhang, Hänger, Fahrbahn, Nebel darunter; (x, y) = Fahrbahnmitte, s = Größe
    c.save(); c.translate(x, y); c.scale(s, s);
    const kabelY = (hx) => Math.abs(hx) <= 120 ? -150 + (1 - (hx / 120) ** 2) * 110 : -150 + 130 * Math.min(1, (Math.abs(hx) - 120) / 140);
    c.strokeStyle = GG_ROT; c.lineCap = 'round'; c.lineWidth = 1;
    for (let hx = -240; hx <= 240; hx += 20) { if (Math.abs(hx) === 120) continue; c.beginPath(); c.moveTo(hx, kabelY(hx)); c.lineTo(hx, -8); c.stroke(); }
    c.lineWidth = 3.5; c.beginPath(); c.moveTo(-260, -20); c.quadraticCurveTo(-200, -120, -120, -150); c.quadraticCurveTo(0, 70 - 150, 120, -150); c.quadraticCurveTo(200, -120, 260, -20); c.stroke();
    c.fillStyle = GG_ROT; c.fillRect(-270, -10, 540, 7); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(-270, -4, 540, 2);
    brueckenTurm(c, -120, -8, 160, 22, GG_ROT); brueckenTurm(c, 120, -8, 160, 22, GG_ROT);
    c.fillStyle = 'rgba(240,244,248,.75)';   // Nebel zieht unter der Fahrbahn durch
    for (let k = 0; k < 5; k++) { const nx = ((k * 130 + zeit * 14) % 560) - 280; c.beginPath(); c.ellipse(nx, 8 + (k % 2) * 8, 70, 14, 0, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }
  function hollywoodSign(c, x, y) {   // Bonus am Ende: grüner Hügel mit den weißen HOLLYWOOD-Buchstaben
    c.save(); c.translate(x, y);
    c.fillStyle = '#7fa35a'; c.beginPath(); c.moveTo(-170, 0); c.quadraticCurveTo(-60, -96, 60, -80); c.quadraticCurveTo(140, -70, 190, 0); c.closePath(); c.fill();
    c.fillStyle = '#5f8a44'; c.beginPath(); c.moveTo(-170, 0); c.quadraticCurveTo(-120, -40, -40, -50); c.lineTo(-40, 0); c.closePath(); c.fill();
    c.save(); c.translate(-14, -64); c.rotate(-0.06); c.fillStyle = '#fff'; c.font = 'bold 15px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 3; c.strokeText('HOLLYWOOD', 0, 0); c.fillText('HOLLYWOOD', 0, 0); c.restore();
    c.restore();
  }
  function tramZeichnen(c, x, y, s) {   // Cable Car: weinroter Wagen mit cremefarbenem Fensterband, Dach, Glocke, Trittbrett; (x, y) = Fußpunkt Mitte
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = '#4a2a2a'; c.fillRect(-52, -6, 104, 4);
    c.fillStyle = '#8b1e2d'; c.beginPath(); c.roundRect(-50, -44, 100, 38, 4); c.fill();
    c.fillStyle = '#f3e3b6'; c.fillRect(-46, -40, 92, 16);
    c.fillStyle = '#9fd3ee'; for (let k = 0; k < 5; k++) c.fillRect(-42 + k * 18, -38, 12, 12);
    c.fillStyle = '#5a1420'; c.beginPath(); c.roundRect(-54, -50, 108, 8, 3); c.fill();
    c.fillStyle = '#e0a400'; c.beginPath(); c.arc(0, -54, 3, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#2a2a2a'; c.beginPath(); c.arc(-30, -3, 4, 0, Math.PI * 2); c.arc(30, -3, 4, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  function hintergrundGoldenGate(c) {
    const naehe = Math.min(1, kamera / level.ende);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#78b2e2'); g.addColorStop(0.55, '#d3e4f0'); g.addColorStop(1, '#e9eff3');   // dunstiger Küstenhimmel
    c.fillStyle = g; c.fillRect(-viewW, -H, viewW * 3, H * 3);
    c.fillStyle = 'rgba(255,246,214,.9)'; c.beginPath(); c.arc(viewW * 0.18, 66, 26, 0, Math.PI * 2); c.fill();   // blasse Sonne
    c.fillStyle = 'rgba(255,255,255,.85)';   // dünne Wolken (Parallaxe 0,06)
    for (let i = 0; i < 5; i++) { const n = viewW + 400, wx = ((i * 410 + 90 - kamera * 0.06) % n + n) % n - 200, wy = 42 + (i % 3) * 22; c.beginPath(); c.ellipse(wx, wy, 52, 9, 0, 0, Math.PI * 2); c.ellipse(wx + 30, wy - 6, 30, 7, 0, 0, Math.PI * 2); c.fill(); }
    for (let i = 0; i < 7; i++) {   // Marin-Hügel am Horizont (Parallaxe 0,04)
      const n = viewW + 700, hx = ((i * 420 - kamera * 0.04) % n + n) % n - 350;
      c.fillStyle = i % 2 ? '#8e9c7c' : '#7f8f6e'; c.beginPath(); c.moveTo(hx, 248); c.quadraticCurveTo(hx + 150, 248 - 70 - ((i * 37) % 40), hx + 320, 248); c.closePath(); c.fill();
    }
    if (kamera > level.ende - 5200) hollywoodSign(c, viewW + 260 - (kamera - (level.ende - 5200)) * 0.13, 249);   // Bonus-Hintergrund: schiebt sich auf den letzten 5.200 Einheiten herein
    goldenGateFern(c, viewW * (0.82 - 0.4 * naehe) - kamera * 0.01, 250 - naehe * 6, 0.55 + naehe * 0.95);   // die Golden Gate wandert in die Mitte und wächst bis zum Boss
    for (let i = 0; i < 3; i++) tramZeichnen(c, (((i * 760 + 200 + zeit * 22 - kamera * 0.12) % (viewW + 300)) + viewW + 300) % (viewW + 300) - 150, 249, 0.5);   // Cable Cars am gegenüberliegenden Ufer (Parallaxe 0,12)
    c.fillStyle = '#3f86b8'; c.fillRect(-viewW, 248, viewW * 3, H * 2);   // Pazifik
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-viewW, 248, viewW * 3, 3);
    for (let i = 0; i < 3; i++) {   // Segelboote (Parallaxe 0,2)
      const n = viewW + 500, bx = ((i * 640 + 300 - kamera * 0.2) % n + n) % n - 250, by = 262 + i * 6 + Math.sin(zeit * 1.5 + i) * 1.5;
      c.fillStyle = '#fff'; c.beginPath(); c.moveTo(bx, by - 4); c.lineTo(bx, by - 24); c.lineTo(bx + 12, by - 5); c.closePath(); c.fill();
      c.fillStyle = '#2a2a2a'; c.beginPath(); c.moveTo(bx - 9, by - 3); c.lineTo(bx + 11, by - 3); c.lineTo(bx + 8, by + 2); c.lineTo(bx - 7, by + 2); c.closePath(); c.fill();
    }
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2;   // Wellen (Parallaxe 0,3)
    for (let i = 0; i < 16; i++) { const n = viewW + 120, wx = ((i * 100 - kamera * 0.3 + Math.sin(zeit + i) * 6) % n + n) % n - 60, wy = 266 + (i % 4) * 16; c.beginPath(); c.moveTo(wx, wy); c.quadraticCurveTo(wx + 10, wy - 4, wx + 20, wy); c.stroke(); }
    c.fillStyle = 'rgba(236,241,246,.7)';   // Nebelbänke tief über dem Wasser (Parallaxe 0,15)
    for (let i = 0; i < 6; i++) { const n = viewW + 500, nx = ((i * 330 + zeit * 9 - kamera * 0.15) % n + n) % n - 250, ny = 300 + (i % 3) * 9; c.beginPath(); c.ellipse(nx, ny, 110, 11, 0, 0, Math.PI * 2); c.ellipse(nx + 70, ny + 4, 70, 8, 0, 0, Math.PI * 2); c.fill(); }
  }
  function promenade(c, x0, w, a, b, links, rechts) {   // Boden: Küstenpromenade – helle Platten mit Fugen, oranger Bordstein, kleine Pfützen
    c.fillStyle = '#b4b0a6'; c.fillRect(x0, BODEN_Y, w, H - BODEN_Y + 200);
    c.fillStyle = '#d6d2c8'; c.fillRect(x0, BODEN_Y, w, 8);
    c.fillStyle = GG_ROT; c.fillRect(x0, BODEN_Y + 8, w, 3);
    c.strokeStyle = 'rgba(0,0,0,.13)'; c.lineWidth = 1;
    for (let x = Math.max(Math.ceil(a / 60) * 60, Math.floor(links / 60) * 60); x < Math.min(b, rechts); x += 60) { c.beginPath(); c.moveTo(x - kamera, BODEN_Y + 11); c.lineTo(x - kamera, H); c.stroke(); }
    for (let yy = BODEN_Y + 36; yy < H; yy += 26) { c.beginPath(); c.moveTo(x0, yy); c.lineTo(x0 + w, yy); c.stroke(); }
    c.fillStyle = 'rgba(120,170,210,.35)';
    for (let x = Math.max(Math.ceil(a / 150) * 150, Math.floor(links / 150) * 150); x < Math.min(b, rechts); x += 150) { c.beginPath(); c.ellipse(x - kamera + 40, BODEN_Y + 22, 12, 3, 0, 0, Math.PI * 2); c.fill(); }
  }
  function pazifik(c, a, b) {   // Lücke = Pazifik: Wasser mit Wellen und Gischt an den Kaikanten, ein Felsen
    const x0 = a - kamera, w = b - a;
    const g = c.createLinearGradient(0, BODEN_Y, 0, H); g.addColorStop(0, '#5fb0dd'); g.addColorStop(1, '#1f5f9e');
    c.fillStyle = g; c.fillRect(x0, BODEN_Y + 8, w, H);
    c.fillStyle = '#8f8a80'; c.fillRect(x0 - 2, BODEN_Y, 6, H - BODEN_Y); c.fillRect(x0 + w - 4, BODEN_Y, 6, H - BODEN_Y);
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2;
    for (let i = 0; i < Math.ceil(w / 44); i++) { const wx = x0 + 6 + ((i * 44 + zeit * 50) % Math.max(1, w - 24)), wy = BODEN_Y + 20 + (i % 3) * 14; c.beginPath(); c.moveTo(wx, wy); c.quadraticCurveTo(wx + 8, wy - 5, wx + 16, wy); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(x0 + 8, BODEN_Y + 12, 10 + Math.sin(zeit * 6) * 2, 4, 0, 0, Math.PI * 2); c.ellipse(x0 + w - 8, BODEN_Y + 12, 10 + Math.cos(zeit * 6) * 2, 4, 0, 0, Math.PI * 2); c.fill();
    if (w > 300) { c.fillStyle = '#5c5a56'; c.beginPath(); c.ellipse(x0 + w / 2, BODEN_Y + 40, 18, 9, 0, 0, Math.PI * 2); c.fill(); }
  }
  function hafenkiste(c, x, y) {   // Hafenkiste statt Kiste (40 × 40): blaue Fischkiste mit Latten, Griffloch und Seestern-Aufkleber
    c.fillStyle = '#2a6cff'; c.fillRect(x, y, KISTE, KISTE);
    c.fillStyle = '#1d4fc0'; for (let k = 0; k < 3; k++) c.fillRect(x, y + 6 + k * 12, KISTE, 3);
    c.fillStyle = '#5a93ff'; c.fillRect(x, y, KISTE, 4);
    c.fillStyle = '#18213a'; c.beginPath(); c.roundRect(x + 13, y + 9, 14, 4, 2); c.fill();
    c.fillStyle = '#ff9f1c'; c.save(); c.translate(x + 29, y + 29); c.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 2.5 : 6, a = k * Math.PI / 5 - Math.PI / 2; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.restore();
  }
  function nebelZeichnen(c, d) {   // Nebelschleier (Bildschirmkoordinaten): halbtransparente Decke + ziehende Schwaden; d = Dichte 0..1
    c.save();
    c.globalAlpha = d * NEBEL_MAX; c.fillStyle = '#dfe6ec'; c.fillRect(-viewW, -H, viewW * 3, H * 3);
    c.globalAlpha = d * 0.5; c.fillStyle = '#f4f7fa';
    for (let i = 0; i < 9; i++) { const n = viewW + 420, nx = ((i * 230 + zeit * (18 + (i % 3) * 7) - kamera * 0.5) % n + n) % n - 210, ny = 40 + ((i * 71) % 300) + Math.sin(zeit * 0.8 + i) * 10; c.beginPath(); c.ellipse(nx, ny, 120 + (i % 2) * 40, 18 + (i % 3) * 6, 0, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }
  function seilbahnZeichnen(c, g) {   // Seilbahn über dem Pazifik: zwei rote Masten an den Ufern, durchhängendes Seil, Hänger, Gondel (Cable-Car-Wagen, Dach = Plattform)
    const x0 = g.x - 12 - kamera, x1 = g.x + g.w + 12 - kamera, gx = g.gx - kamera, top = BODEN_Y - 170;
    c.fillStyle = GG_ROT; c.fillRect(x0 - 5, top, 10, 170); c.fillRect(x1 - 5, top, 10, 170);
    c.fillStyle = '#8e3220'; c.fillRect(x0 - 9, top - 4, 18, 6); c.fillRect(x1 - 9, top - 4, 18, 6);
    const seilY = (hx) => { const t = (hx - x0) / (x1 - x0); return (1 - t) * (1 - t) * top + 2 * (1 - t) * t * (top + 58) + t * t * top; };
    c.strokeStyle = '#3a3a3a'; c.lineWidth = 3; c.beginPath(); c.moveTo(x0, top); c.quadraticCurveTo((x0 + x1) / 2, top + 58, x1, top); c.stroke();
    const hx = gx + GONDEL_W / 2, hy = seilY(hx), schwank = Math.sin(zeit * 2.2 + g.phase) * 2;
    c.lineWidth = 2.5; c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + schwank, GONDEL_Y - 2); c.stroke();
    c.fillStyle = '#3a3a3a'; c.beginPath(); c.arc(hx, hy, 5, 0, Math.PI * 2); c.fill();
    c.save(); c.translate(gx + GONDEL_W / 2 + schwank, GONDEL_Y);
    c.fillStyle = '#8b1e2d'; c.beginPath(); c.roundRect(-GONDEL_W / 2, 6, GONDEL_W, 26, 4); c.fill();
    c.fillStyle = '#f3e3b6'; c.fillRect(-GONDEL_W / 2 + 6, 10, GONDEL_W - 12, 12);
    c.fillStyle = '#9fd3ee'; for (let k = 0; k < 6; k++) c.fillRect(-GONDEL_W / 2 + 10 + k * 20, 12, 13, 8);
    c.fillStyle = '#5a1420'; c.beginPath(); c.roundRect(-GONDEL_W / 2 - 3, -3, GONDEL_W + 6, 10, 4); c.fill();   // Dach = Plattform
    c.fillStyle = '#e0a400'; c.beginPath(); c.arc(0, -6, 3, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  function surfZeichnen(c, s) {   // Surfbrett-Rutsche: nasser, glänzender Streifen mit Gischt und einem Surfbrett-Schild am Anfang
    const x = s.x - kamera;
    const g = c.createLinearGradient(x, 0, x + s.w, 0); g.addColorStop(0, 'rgba(120,200,240,.0)'); g.addColorStop(0.15, 'rgba(120,200,240,.75)'); g.addColorStop(0.85, 'rgba(120,200,240,.75)'); g.addColorStop(1, 'rgba(120,200,240,.0)');
    c.fillStyle = g; c.fillRect(x, BODEN_Y - 2, s.w, 10);
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 2;
    for (let i = 0; i < Math.ceil(s.w / 36); i++) { const wx = x + 12 + ((i * 36 + zeit * 90) % Math.max(1, s.w - 24)); c.beginPath(); c.moveTo(wx, BODEN_Y + 3); c.quadraticCurveTo(wx + 6, BODEN_Y - 3, wx + 12, BODEN_Y + 3); c.stroke(); }
    c.save(); c.translate(x - 14, BODEN_Y); c.rotate(-0.35);   // Surfbrett als Schild
    c.fillStyle = '#ffd93d'; c.beginPath(); c.ellipse(0, -30, 7, 30, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#ff5e5e'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -56); c.lineTo(0, -6); c.stroke();
    c.restore();
  }
  function surfbrett(c, x, y) {   // Brett unter der Figur, solange sie surft (mit Gischt hinten)
    c.save(); c.translate(x, y + 2);
    c.fillStyle = 'rgba(255,255,255,.7)'; for (let k = 0; k < 3; k++) { const t = (zeit * 4 + k * 0.33) % 1; c.beginPath(); c.arc(-26 - t * 16, -2 - t * 10, 3 + t * 4, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#ffd93d'; c.beginPath(); c.ellipse(4, 0, 32, 6, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ff5e5e'; c.fillRect(-20, -1.5, 44, 3);
    c.restore();
  }
  function moewe(c, g) {   // Möwe: weißer Körper, graue Flügel mit schwarzen Spitzen, gelber Schnabel mit rotem Punkt; mit Beute trägt sie einen kleinen Diamanten im Schnabel
    const b = gegnerBox(g); const cx = b.x + 18, cy = b.y + 12;
    c.save(); c.translate(cx, cy); if (g.richtung > 0) c.scale(-1, 1);
    if (g.tot > 0) c.scale(1, Math.max(0.2, 1 - g.tot * 2));
    const fl = Math.sin(g.flug * (g.klaut ? 16 : 10));
    c.fillStyle = '#9aa3ad'; c.beginPath(); c.moveTo(-2, -2); c.quadraticCurveTo(10, -14 - fl * 12, 24, -8 - fl * 16); c.quadraticCurveTo(12, 0, 2, 3); c.closePath(); c.fill();
    c.fillStyle = '#2a2a2a'; c.beginPath(); c.moveTo(18, -7 - fl * 14); c.lineTo(26, -8 - fl * 16); c.lineTo(22, -3 - fl * 12); c.closePath(); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(0, 3, 14, 7, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#d9dee3'; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(10, 2); c.lineTo(20, i * 3.5 + 1); c.lineTo(20, 5 + i * 3.5); c.closePath(); c.fill(); }
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(-13, -4, 6, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffd93d'; c.beginPath(); c.moveTo(-18, -5); c.lineTo(-27, -3); c.lineTo(-18, -1); c.closePath(); c.fill();
    c.fillStyle = '#e63946'; c.beginPath(); c.arc(-23, -2.5, 1.1, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#18213a'; c.beginPath(); c.arc(-14.5, -6, 1.4, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#ff9f1c'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-3, 9); c.lineTo(-5, 12); c.moveTo(1, 9); c.lineTo(0, 12); c.stroke();
    c.fillStyle = '#b8c0c8'; c.beginPath(); c.moveTo(-3, 0); c.quadraticCurveTo(8, -12 + fl * 12, 22, -4 + fl * 16); c.quadraticCurveTo(10, 2, 0, 5); c.closePath(); c.fill();
    if (g.beute) diamant(c, -27, 2, 6, '#39c6f0');
    c.restore();
  }
  function seeloewe(c, g) {   // Seelöwe: watschelt am Boden, hebt den Kopf, klatscht mit den Flossen, Ball auf der Nase; plattgedrückt flach
    const b = gegnerBox(g); const cx = b.x + 25, cy = b.y + 28;
    c.save(); c.translate(cx, cy); if (g.richtung > 0) c.scale(-1, 1);
    if (g.tot > 0) c.scale(1, Math.max(0.15, 1 - g.tot * 2));
    const w = Math.sin(g.flug * 6), klatsch = Math.abs(Math.sin(g.flug * 3));
    c.fillStyle = '#6b5a4a'; c.beginPath(); c.moveTo(22, 0); c.quadraticCurveTo(24, -6, 12, -8 + w); c.lineTo(10, 0); c.closePath(); c.fill();   // Schwanzflosse
    c.fillStyle = '#7d6a58'; c.beginPath(); c.moveTo(-14, 0); c.quadraticCurveTo(-18, -22, -4, -22); c.quadraticCurveTo(18, -20, 20, 0); c.closePath(); c.fill();   // Körper
    c.fillStyle = '#8f7c69'; c.beginPath(); c.ellipse(0, -6, 10, 5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#6b5a4a'; c.beginPath(); c.ellipse(-2, -8, 7, 3, 0.9 - klatsch * 0.9, 0, Math.PI * 2); c.fill();   // Flosse
    c.fillStyle = '#7d6a58'; c.beginPath(); c.arc(-14, -20, 8, 0, Math.PI * 2); c.fill();   // Kopf
    c.fillStyle = '#4a3a2e'; c.beginPath(); c.ellipse(-21, -19, 3, 2.2, 0, 0, Math.PI * 2); c.fill();   // Nase
    c.fillStyle = '#18213a'; c.beginPath(); c.arc(-15, -23, 1.5, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-20, -17); c.lineTo(-27, -15); c.moveTo(-20, -16); c.lineTo(-27, -12); c.stroke();   // Schnurrhaare
    c.fillStyle = '#ff5e5e'; c.beginPath(); c.arc(-22, -30 + w, 5, 0, Math.PI * 2); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(-22, -30 + w, 5, -0.6, 0.9); c.lineTo(-22, -30 + w); c.closePath(); c.fill();   // Ball
    c.restore();
  }
  function skater(c, g) {   // Skater: rollt schnell entgegen – Board mit Rollen, Knie gebeugt, Hoodie, Helm, Arme ausgestreckt; plattdrückbar oder überspringen
    const b = gegnerBox(g); const cx = b.x + 15, cy = b.y + 44;
    c.save(); c.translate(cx, cy); if (g.richtung > 0) c.scale(-1, 1);
    if (g.tot > 0) c.scale(1, Math.max(0.15, 1 - g.tot * 2));
    const rad = g.flug * 18, wipp = Math.sin(g.flug * 9) * 1.5;
    c.fillStyle = '#3a2a22'; c.beginPath(); c.roundRect(-18, -6, 36, 4, 2); c.fill();
    for (const rx of [-11, 11]) { c.fillStyle = '#e63946'; c.beginPath(); c.arc(rx, -2, 3.2, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 1; c.beginPath(); c.moveTo(rx, -2); c.lineTo(rx + Math.cos(rad) * 3, -2 + Math.sin(rad) * 3); c.stroke(); }
    c.translate(0, wipp);
    c.strokeStyle = '#2f3b5c'; c.lineCap = 'round'; c.lineWidth = 5; c.beginPath(); c.moveTo(-6, -22); c.lineTo(-10, -14); c.lineTo(-8, -7); c.moveTo(6, -22); c.lineTo(10, -14); c.lineTo(8, -7); c.stroke();   // Beine
    c.fillStyle = '#19d3c5'; c.beginPath(); c.roundRect(-9, -36, 18, 16, 5); c.fill();   // Hoodie
    c.strokeStyle = '#19d3c5'; c.lineWidth = 4; c.beginPath(); c.moveTo(-8, -32); c.lineTo(-20, -36); c.moveTo(8, -32); c.lineTo(20, -36 + wipp); c.stroke();   // Arme
    c.fillStyle = '#f1c27d'; c.beginPath(); c.arc(-21, -37, 2.5, 0, Math.PI * 2); c.arc(21, -37 + wipp, 2.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f1c27d'; c.beginPath(); c.arc(-1, -41, 6, 0, Math.PI * 2); c.fill();   // Kopf
    c.fillStyle = '#e0a400'; c.beginPath(); c.arc(-1, -42, 6.6, Math.PI, 0); c.closePath(); c.fill();   // Helm
    c.fillStyle = '#18213a'; c.beginPath(); c.arc(-4, -40.5, 1.1, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  function nebelbank(c, x, y) {   // Nebelbank am Boss-Platz: dichte Schwaden am Boden, eine Glockenboje; beim Auftauchen des Captains wirbelt der Nebel
    c.save(); c.translate(x, y);
    c.fillStyle = '#e0a400'; c.beginPath(); c.moveTo(-70, 0); c.lineTo(-62, -36); c.lineTo(-46, -36); c.lineTo(-38, 0); c.closePath(); c.fill();   // Boje
    c.fillStyle = '#8e3220'; c.fillRect(-58, -48, 8, 14); c.fillStyle = '#c9c9c9'; c.beginPath(); c.arc(-54, -50, 5, Math.PI, 0); c.closePath(); c.fill();
    const wirbel = boss.sichtbar > 0 && boss.sichtbar < 1 ? 1 : 0;
    for (let k = 0; k < 7; k++) {
      const t = (zeit * 0.5 + k * 0.14) % 1, nx = -90 + k * 30 + Math.sin(zeit * 1.1 + k) * 10, ny = -10 - (k % 3) * 8 - wirbel * t * 60;
      c.fillStyle = `rgba(236,241,246,${0.55 + (k % 2) * 0.2 - wirbel * t * 0.4})`; c.beginPath(); c.ellipse(nx, ny, 52 - wirbel * t * 20, 14, 0, 0, Math.PI * 2); c.fill();
    }
    c.restore();
  }
  function captainFog(c, x, y) {   // Boss Welt 5: Captain Fog – halbtransparenter Nebelgeist mit Kapitänsmütze, leuchtenden Augen, Nebelbart und Pfeife; wabert, spricht mit boss.maul, löst sich im Finale auf
    if (boss.sichtbar <= 0) return;
    const auf = boss.sichtbar * (1 - boss.weg), wab = zeit * 2.6, m = boss.maul;
    c.save(); c.translate(x - 10, y - 30 - boss.weg * 150 + Math.sin(zeit * 1.7) * 6); c.globalAlpha = Math.min(0.88, auf * 1.1);
    const s = 0.85 * (0.5 + 0.5 * Math.min(1, boss.sichtbar)); c.scale(s, s);
    c.fillStyle = 'rgba(236,241,246,.45)';   // Schwaden um den Geist
    for (let k = 0; k < 3; k++) { const a = wab * 0.5 + k * 2.1; c.beginPath(); c.ellipse(Math.cos(a) * 70, -80 + Math.sin(a) * 40, 38, 12, 0, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = 'rgba(238,243,248,.92)';   // Körper: Wolkenform, unten ausgefranster Schweif, der wabert
    c.beginPath(); c.moveTo(-62, -40); c.quadraticCurveTo(-74, -150, 0, -162); c.quadraticCurveTo(74, -150, 62, -40);
    for (let k = 0; k < 5; k++) { const x2 = 62 - (k + 1) * 24.8, cxk = x2 + 12.4; c.quadraticCurveTo(cxk, -40 + 30 + Math.sin(wab + k) * 8, x2, -40 + 4 + Math.cos(wab * 1.3 + k) * 5); }
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.ellipse(-20, -120, 26, 30, 0.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(238,243,248,.9)'; c.beginPath(); c.ellipse(-78 + Math.sin(wab) * 4, -92, 24, 13, -0.5, 0, Math.PI * 2); c.ellipse(78 + Math.cos(wab) * 4, -88, 24, 13, 0.5, 0, Math.PI * 2); c.fill();   // Arme
    c.fillStyle = 'rgba(210,220,230,.9)';   // Nebelbart
    for (const [bx, by, r] of [[-22, -72, 14], [-6, -64, 16], [12, -66, 15], [26, -74, 12], [0, -50, 13], [-14, -54, 11], [14, -52, 11]]) { c.beginPath(); c.arc(bx, by, r, 0, Math.PI * 2); c.fill(); }
    for (const ex of [-20, 20]) {   // leuchtende Augen mit Brauen
      c.save(); c.shadowColor = '#7fe6ff'; c.shadowBlur = 14; c.fillStyle = '#bff4ff'; c.beginPath(); c.ellipse(ex, -112, 9, 7, 0, 0, Math.PI * 2); c.fill(); c.restore();
      c.fillStyle = '#18213a'; c.beginPath(); c.arc(ex + (zustand === 'boss' ? 2 : 0), -111, 3.2, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#9aa8b4'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(ex - 10, -124 - (ex < 0 ? 0 : 4)); c.lineTo(ex + 10, -124 - (ex < 0 ? 4 : 0)); c.stroke();
    }
    c.fillStyle = '#2a3a4a'; c.beginPath(); c.ellipse(0, -86, 8 * (0.4 + m * 0.6), 3 + m * 7, 0, 0, Math.PI * 2); c.fill();   // Mund
    c.strokeStyle = '#5a3a22'; c.lineWidth = 3; c.beginPath(); c.moveTo(8, -84); c.lineTo(30, -78); c.stroke(); c.fillStyle = '#5a3a22'; c.beginPath(); c.roundRect(28, -84, 10, 10, 3); c.fill();   // Pfeife
    c.fillStyle = 'rgba(255,255,255,.7)'; for (let k = 0; k < 3; k++) { const t = (zeit * 0.9 + k * 0.33) % 1; c.beginPath(); c.arc(34 + t * 10, -92 - t * 30, 2 + t * 5, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#18213a'; c.beginPath(); c.ellipse(0, -150, 42, 9, 0, 0, Math.PI * 2); c.fill();   // Kapitänsmütze: Schirm, Band, weißer Deckel, goldener Anker
    c.fillStyle = '#f6f6f6'; c.beginPath(); c.moveTo(-36, -152); c.quadraticCurveTo(-38, -190, 0, -192); c.quadraticCurveTo(38, -190, 36, -152); c.closePath(); c.fill();
    c.fillStyle = '#18213a'; c.fillRect(-36, -160, 72, 9);
    c.strokeStyle = '#e0a400'; c.lineWidth = 2; c.beginPath(); c.moveTo(-36, -159); c.lineTo(36, -159); c.stroke();
    c.strokeStyle = '#e0a400'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(0, -182); c.lineTo(0, -166); c.moveTo(-6, -178); c.lineTo(6, -178); c.arc(0, -170, 7, Math.PI * 0.15, Math.PI * 0.85); c.stroke(); c.beginPath(); c.arc(0, -185, 2.2, 0, Math.PI * 2); c.stroke();
    c.restore();
  }
  function brueckenTor(c, x, y) {   // Tür der Welt 5: Brückentor – zwei Golden-Gate-Pfeiler mit Querbalken „GOLDEN GATE BRIDGE“, dazwischen ein Gitter, das zur Seite fährt; Kabel und Fahrbahn dahinter, Leuchte rot → grün
    c.save(); c.translate(x, y);
    c.fillStyle = '#6b6f76'; c.fillRect(-80, -8, 260, 8); c.fillStyle = GG_ROT; c.fillRect(-80, -12, 260, 4);
    c.strokeStyle = GG_ROT; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-96, -50); c.quadraticCurveTo(-70, -170, -50, -206); c.moveTo(50, -206); c.quadraticCurveTo(90, -150, 190, -60); c.stroke();   // Hauptkabel
    c.lineWidth = 1.5; for (let k = 0; k < 6; k++) { const hx = 70 + k * 20, t = (hx - 50) / 140; const ky = (1 - t) * (1 - t) * -206 + 2 * (1 - t) * t * -150 + t * t * -60; c.beginPath(); c.moveTo(hx, ky); c.lineTo(hx, -12); c.stroke(); }
    brueckenTurm(c, -50, 0, 200, 28, GG_ROT); brueckenTurm(c, 50, 0, 200, 28, GG_ROT);
    c.fillStyle = GG_ROT; c.fillRect(-66, -210, 132, 12);
    c.fillStyle = '#18213a'; c.beginPath(); c.roundRect(-60, -196, 120, 22, 4); c.fill();
    c.fillStyle = '#ffd36b'; c.font = 'bold 11px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('GOLDEN GATE BRIDGE', 0, -185);
    const offen = tuer.offen;
    if (offen > 0) { c.fillStyle = `rgba(255,240,180,${0.55 * offen})`; c.fillRect(-36, -150, 72, 150); }
    for (const seite of [-1, 1]) {   // zwei Gitterflügel fahren in die Pfeiler
      c.save(); c.translate(seite * -36, 0); c.scale(Math.max(0.04, 1 - offen * 0.96), 1);
      const x0 = seite > 0 ? -36 : 0;
      c.fillStyle = '#8e3220'; c.fillRect(x0, -150, 36, 150);
      c.strokeStyle = '#ffb37a'; c.lineWidth = 2;
      for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(x0 + k * 9, -146); c.lineTo(x0 + k * 9, -4); c.stroke(); }
      for (let k = 1; k < 6; k++) { c.beginPath(); c.moveTo(x0 + 2, -150 + k * 25); c.lineTo(x0 + 34, -150 + k * 25); c.stroke(); }
      c.restore();
    }
    c.fillStyle = '#3a3a3a'; c.fillRect(-3, -172, 6, 14);
    c.fillStyle = offen > 0.3 ? '#2ecc71' : '#e63946'; c.beginPath(); c.arc(0, -176, 6, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  /* ---------- Welt Westminster · Big Ben (Klasse 6 „London Run“, 31.10.) ---------- */
  const UK_ROT = '#c8102e', UK_BLAU = '#012169';
  function bigBen(c, x, y, s, farbe) {   // Elizabeth Tower: Schaft, Uhrgeschoss mit Zifferblatt (Zeiger laufen), Glockenstube, Turmspitze; (x, y) = Fußpunkt Mitte
    c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = farbe;
    c.fillRect(-14, -150, 28, 150);
    c.fillRect(-17, -188, 34, 40);
    c.fillRect(-15, -210, 30, 22);
    c.beginPath(); c.moveTo(-17, -210); c.lineTo(0, -262); c.lineTo(17, -210); c.closePath(); c.fill();
    c.fillRect(-1.5, -276, 3, 16);
    for (const px of [-17, 13]) { c.beginPath(); c.moveTo(px, -188); c.lineTo(px + 2, -200); c.lineTo(px + 4, -188); c.closePath(); c.fill(); }
    c.fillStyle = 'rgba(0,0,0,.12)'; for (let k = 0; k < 6; k++) c.fillRect(-10, -140 + k * 22, 20, 2);
    for (let k = 0; k < 3; k++) c.fillRect(-11 + k * 8, -206, 5, 14);
    c.fillStyle = '#f3ead2'; c.beginPath(); c.arc(0, -168, 12, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#2a2a2a'; c.lineWidth = 1.6; c.stroke();
    const a = zeit * 0.5;
    c.lineCap = 'round'; c.beginPath(); c.moveTo(0, -168); c.lineTo(Math.cos(a) * 9, -168 + Math.sin(a) * 9); c.moveTo(0, -168); c.lineTo(Math.cos(a / 12 - 1) * 6, -168 + Math.sin(a / 12 - 1) * 6); c.stroke();
    c.restore();
  }
  function parlament(c, x, y, s, farbe) {   // Houses of Parliament links vom Big Ben: lange gotische Front mit Türmchen, Victoria Tower am linken Ende; (x, y) = rechter Fußpunkt
    c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = farbe;
    c.fillRect(-290, -58, 290, 58);
    for (let k = 0; k < 15; k++) { const px = -284 + k * 19; c.fillRect(px, -70, 6, 14); c.beginPath(); c.moveTo(px - 1, -70); c.lineTo(px + 3, -80); c.lineTo(px + 7, -70); c.closePath(); c.fill(); }
    c.fillRect(-150, -96, 18, 40); c.beginPath(); c.moveTo(-152, -96); c.lineTo(-141, -122); c.lineTo(-130, -96); c.closePath(); c.fill();   // Mittelturm
    c.fillRect(-318, -150, 40, 150); for (const px of [-318, -284]) c.fillRect(px, -162, 6, 14);   // Victoria Tower
    c.fillStyle = 'rgba(0,0,0,.13)';
    for (let r = 0; r < 2; r++) for (let k = 0; k < 24; k++) c.fillRect(-282 + k * 11.5, -48 + r * 22, 4, 12);
    for (let k = 0; k < 5; k++) c.fillRect(-312 + k * 7, -130, 3, 16);
    c.restore();
  }
  function londonEye(c, x, y, r) {   // Riesenrad in der Ferne: A-Stütze, Felge, Speichen und Gondeln drehen sich langsam
    c.save(); c.translate(x, y);
    c.strokeStyle = 'rgba(150,165,180,.9)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(-r * 0.55, 0); c.lineTo(0, -r - 6); c.lineTo(r * 0.2, 0); c.stroke();
    c.lineWidth = 2.5; c.beginPath(); c.arc(0, -r - 6, r, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 0.8; const d = zeit * 0.04;
    for (let k = 0; k < 16; k++) { const a = d + k * Math.PI / 8; c.beginPath(); c.moveTo(0, -r - 6); c.lineTo(Math.cos(a) * r, -r - 6 + Math.sin(a) * r); c.stroke(); }
    c.fillStyle = 'rgba(230,238,245,.95)';
    for (let k = 0; k < 16; k++) { const a = d + k * Math.PI / 8 + Math.PI / 16; c.beginPath(); c.ellipse(Math.cos(a) * r, -r - 6 + Math.sin(a) * r, 3.4, 2.4, 0, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }
  function unionJack(c, x, y, w, h) {   // kleine Flagge (x, y) = links oben
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.fillStyle = UK_BLAU; c.fillRect(x, y, w, h);
    c.strokeStyle = '#fff'; c.lineWidth = h * 0.3; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y + h); c.moveTo(x + w, y); c.lineTo(x, y + h); c.stroke();
    c.strokeStyle = UK_ROT; c.lineWidth = h * 0.1; c.stroke();
    c.fillStyle = '#fff'; c.fillRect(x + w / 2 - h * 0.18, y, h * 0.36, h); c.fillRect(x, y + h * 0.32, w, h * 0.36);
    c.fillStyle = UK_ROT; c.fillRect(x + w / 2 - h * 0.1, y, h * 0.2, h); c.fillRect(x, y + h * 0.4, w, h * 0.2);
    c.restore();
  }
  function wimpelKette(c, x1, x2, y) {   // Union-Jack-Wimpel an einer durchhängenden Schnur zwischen zwei Laternen
    c.strokeStyle = 'rgba(40,40,40,.55)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x1, y); c.quadraticCurveTo((x1 + x2) / 2, y + 14, x2, y); c.stroke();
    const n = Math.max(3, Math.floor((x2 - x1) / 14));
    for (let k = 1; k < n; k++) {
      const t = k / n, px = x1 + (x2 - x1) * t, py = y + 14 * 2 * t * (1 - t) * 1, wehen = Math.sin(zeit * 3 + k) * 1.2;
      c.fillStyle = [UK_ROT, '#ffffff', UK_BLAU][k % 3]; c.beginPath(); c.moveTo(px - 4, py); c.lineTo(px + 4, py); c.lineTo(px + wehen, py + 9); c.closePath(); c.fill();
    }
  }
  function telefonzelleKlein(c, x, y, s) {   // Telefonzelle in der Kulisse (am anderen Ufer); (x, y) = Fußpunkt Mitte
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = UK_ROT; c.fillRect(-9, -46, 18, 46); c.beginPath(); c.roundRect(-10, -50, 20, 6, 3); c.fill();
    c.fillStyle = 'rgba(255,255,255,.75)'; for (let r = 0; r < 4; r++) for (let k = 0; k < 2; k++) c.fillRect(-6 + k * 6.5, -38 + r * 8, 5, 6);
    c.restore();
  }
  function laterne(c, x, y, s) {   // viktorianische Laterne; (x, y) = Fußpunkt
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = '#26303a'; c.fillRect(-1.5, -60, 3, 60); c.fillRect(-5, -4, 10, 4);
    c.beginPath(); c.moveTo(-5, -60); c.lineTo(5, -60); c.lineTo(3, -70); c.lineTo(-3, -70); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,230,150,.85)'; c.fillRect(-3, -68, 6, 7);
    c.restore();
  }
  function bootZeichnen(c, x, y, s) {   // Ausflugsboot auf der Themse: weißer Rumpf mit blauem Band, Kajüte mit Fenstern, Wimpel
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = '#f4f4f4'; c.beginPath(); c.moveTo(-40, -8); c.lineTo(42, -8); c.lineTo(34, 2); c.lineTo(-36, 2); c.closePath(); c.fill();
    c.fillStyle = UK_BLAU; c.fillRect(-38, -5, 78, 3);
    c.fillStyle = '#e9e9e9'; c.fillRect(-28, -20, 50, 12);
    c.fillStyle = '#7fb2d6'; for (let k = 0; k < 6; k++) c.fillRect(-25 + k * 8, -17, 5, 6);
    c.fillStyle = '#555'; c.fillRect(14, -30, 2, 10); c.fillStyle = UK_ROT; c.beginPath(); c.moveTo(16, -30); c.lineTo(24, -27); c.lineTo(16, -24); c.closePath(); c.fill();
    c.restore();
  }
  function hintergrundLondon(c) {
    const naehe = Math.min(1, kamera / level.ende);
    const endeF = Math.max(0, Math.min(1, (kamera - (level.ende - 5200)) / 2600));   // auf den letzten Metern: Niesel hört auf, Regenbogen erscheint
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, mischFarbe('#8fa1b3', '#74b9e8', endeF)); g.addColorStop(0.62, mischFarbe('#d3dbe2', '#d6eefa', endeF)); g.addColorStop(1, '#eceae2');
    c.fillStyle = g; c.fillRect(-viewW, -H, viewW * 3, H * 3);
    if (endeF > 0) {   // Regenbogen hinter der Stadt
      c.save(); c.globalAlpha = endeF * 0.7; c.lineWidth = 7;
      REGENBOGEN.forEach((f, i) => { c.strokeStyle = f; c.beginPath(); c.arc(viewW * 0.42, 290, 250 - i * 7, Math.PI, 0); c.stroke(); });
      c.restore();
      c.fillStyle = `rgba(255,240,190,${0.9 * endeF})`; c.beginPath(); c.arc(viewW * 0.12, 62, 24, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = `rgba(178,189,200,${0.95 - 0.55 * endeF})`;   // Nieselwolken (Parallaxe 0,06)
    for (let i = 0; i < 6; i++) {
      const n = viewW + 420, wx = ((i * 340 + 60 - kamera * 0.06) % n + n) % n - 210, wy = 38 + (i % 3) * 22;
      c.beginPath(); c.arc(wx, wy, 22, 0, Math.PI * 2); c.arc(wx + 26, wy - 10, 28, 0, Math.PI * 2); c.arc(wx + 56, wy, 22, 0, Math.PI * 2); c.arc(wx + 30, wy + 6, 20, 0, Math.PI * 2); c.fill();
    }
    londonEye(c, viewW * (0.3 - 0.22 * naehe) - kamera * 0.005, 250, 66);   // London Eye in der Ferne
    c.fillStyle = '#b3bcc6';   // ferne Stadt (Parallaxe 0,08), ab und zu eine Kuppel (St Paul's)
    for (let i = 0; i < 36; i++) {
      const n = viewW + 200, bx = ((i * 74 - kamera * 0.08) % n + n) % n - 100, bh = 22 + ((i * 41) % 46);
      c.fillRect(bx, 250 - bh, 44, bh);
      if (i % 9 === 4) { c.beginPath(); c.arc(bx + 22, 250 - bh, 16, Math.PI, 0); c.fill(); c.fillRect(bx + 20, 250 - bh - 26, 4, 12); }
    }
    const bx = viewW * (0.84 - 0.36 * naehe) - kamera * 0.01, gr = 0.5 + naehe * 0.75;   // Big Ben + Parlament wandern heran und wachsen bis zum Boss
    parlament(c, bx - 22 * gr, 252, gr, '#c3ad84'); bigBen(c, bx, 252, gr, '#c9b48a');
    c.fillStyle = '#5f8299'; c.fillRect(-viewW, 250, viewW * 3, H * 2);   // Themse
    c.fillStyle = '#9b958a'; c.fillRect(-viewW, 247, viewW * 3, 5);         // Ufermauer gegenüber
    for (let i = 0; i < 8; i++) {   // am anderen Ufer: Laternen mit Union-Jack-Wimpeln, rote Telefonzellen (Parallaxe 0,25)
      const n = viewW + 480, lx = ((i * 240 + 40 - kamera * 0.25) % n + n) % n - 240;
      laterne(c, lx, 248, 0.7); if (i % 2 === 0) wimpelKette(c, lx, lx + 120, 202);
      if (i % 3 === 1) telefonzelleKlein(c, lx + 60, 248, 0.6);
    }
    for (let i = 0; i < 3; i++) {   // Ausflugsboote (Parallaxe 0,2, fahren langsam)
      const n = viewW + 520, x = ((i * 610 + 260 + zeit * 12 - kamera * 0.2) % n + n) % n - 260, y = 270 + i * 12 + Math.sin(zeit * 1.4 + i) * 1.5;
      bootZeichnen(c, x, y, 0.6 + i * 0.08);
    }
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2;   // Wellen (Parallaxe 0,3)
    for (let i = 0; i < 14; i++) { const n = viewW + 120, wx = ((i * 110 - kamera * 0.3 + Math.sin(zeit + i) * 6) % n + n) % n - 60, wy = 262 + (i % 4) * 16; c.beginPath(); c.moveTo(wx, wy); c.quadraticCurveTo(wx + 10, wy - 4, wx + 20, wy); c.stroke(); }
    if (endeF < 1 && !ruhig()) {   // Nieselregen (Bildschirm, fällt schräg)
      c.strokeStyle = `rgba(235,242,250,${0.45 * (1 - endeF)})`; c.lineWidth = 1; c.beginPath();
      for (let i = 0; i < 46; i++) { const n = viewW + 40, x = ((i * 53 + zeit * 50) % n + n) % n - 20, y = (i * 97 + zeit * 280) % (H + 20) - 10; c.moveTo(x, y); c.lineTo(x - 3, y + 9); }
      c.stroke();
    }
  }
  function bodenLondon(c, x0, w, a, b, links, rechts) {   // Boden: Uferpromenade (Victoria Embankment) – Steinplatten, Bordstein, nasse Glanzflecken
    c.fillStyle = '#a5a49f'; c.fillRect(x0, BODEN_Y, w, H - BODEN_Y + 200);
    c.fillStyle = '#d2d0ca'; c.fillRect(x0, BODEN_Y, w, 9);
    c.fillStyle = '#6f6e6a'; c.fillRect(x0, BODEN_Y + 9, w, 2);
    c.strokeStyle = 'rgba(0,0,0,.14)'; c.lineWidth = 1;
    for (let x = Math.max(Math.ceil(a / 50) * 50, Math.floor(links / 50) * 50); x < Math.min(b, rechts); x += 50) { c.beginPath(); c.moveTo(x - kamera, BODEN_Y + 11); c.lineTo(x - kamera, H); c.stroke(); }
    c.beginPath(); c.moveTo(x0, BODEN_Y + 40); c.lineTo(x0 + w, BODEN_Y + 40); c.stroke();
    c.fillStyle = 'rgba(200,215,230,.35)';
    for (let x = Math.max(Math.ceil(a / 170) * 170, Math.floor(links / 170) * 170); x < Math.min(b, rechts); x += 170) { c.beginPath(); c.ellipse(x - kamera + 30, BODEN_Y + 24, 14, 3, 0, 0, Math.PI * 2); c.fill(); }
  }
  function themse(c, a, b) {   // Lücke = Themse: Wasser mit Wellen, Ufermauern aus Stein an beiden Rändern, ein Rettungsring
    const x0 = a - kamera, w = b - a;
    const g = c.createLinearGradient(0, BODEN_Y, 0, H); g.addColorStop(0, '#5f8299'); g.addColorStop(1, '#2c4a5e');
    c.fillStyle = g; c.fillRect(x0, BODEN_Y + 10, w, H);
    c.fillStyle = '#8d8a84'; c.fillRect(x0 - 2, BODEN_Y, 7, H - BODEN_Y); c.fillRect(x0 + w - 5, BODEN_Y, 7, H - BODEN_Y);
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2;
    for (let i = 0; i < Math.ceil(w / 44); i++) { const wx = x0 + 8 + ((i * 44 + zeit * 40) % Math.max(1, w - 26)), wy = BODEN_Y + 22 + (i % 3) * 14; c.beginPath(); c.moveTo(wx, wy); c.quadraticCurveTo(wx + 8, wy - 4, wx + 16, wy); c.stroke(); }
    if (w > 165) { const rx = x0 + w / 2, ry = BODEN_Y + 34 + Math.sin(zeit * 2) * 2; c.strokeStyle = '#ff6a1a'; c.lineWidth = 5; c.beginPath(); c.arc(rx, ry, 9, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = '#fff'; c.lineWidth = 5; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(rx, ry, 9, k * Math.PI / 2, k * Math.PI / 2 + 0.4); c.stroke(); } }
  }
  function kisteLondon(c, x, y, k) {   // Blöcke (40 × 40): Telefonzelle (zwei Teile), Postkasten (Pillar Box) oder Teekiste
    const art = k && k.art;
    if (art === 'zelle') {
      c.fillStyle = UK_ROT; c.fillRect(x + 2, y, KISTE - 4, KISTE);
      c.fillStyle = '#9e0c24'; c.fillRect(x + 2, y, 4, KISTE); c.fillRect(x + KISTE - 6, y, 4, KISTE);
      c.fillStyle = 'rgba(225,238,245,.9)';
      const oben = k.teil === 1, start = oben ? y + 13 : y + 2;
      for (let r = 0; r < (oben ? 3 : 4); r++) for (let s = 0; s < 3; s++) c.fillRect(x + 9 + s * 8, start + r * 8.5, 6, 6.5);
      if (oben) {
        c.fillStyle = '#9e0c24'; c.beginPath(); c.roundRect(x, y - 2, KISTE, 6, 3); c.fill();
        c.fillStyle = '#f4f4f4'; c.fillRect(x + 5, y + 5, KISTE - 10, 6);
        c.fillStyle = '#18213a'; c.font = 'bold 5px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('TELEPHONE', x + KISTE / 2, y + 8.2);
      } else { c.fillStyle = '#e0a400'; c.fillRect(x + KISTE - 10, y + 18, 2, 6); c.fillStyle = '#5c0716'; c.fillRect(x, y + KISTE - 3, KISTE, 3); }
      return;
    }
    if (art === 'post') {
      c.fillStyle = '#1a1a1a'; c.fillRect(x + 4, y + KISTE - 5, KISTE - 8, 5);
      c.fillStyle = UK_ROT; c.fillRect(x + 4, y + 7, KISTE - 8, KISTE - 12);
      c.beginPath(); c.ellipse(x + KISTE / 2, y + 7, KISTE / 2 - 2, 7, 0, Math.PI, 0); c.fill();
      c.fillStyle = '#9e0c24'; c.fillRect(x + 2, y + 6, KISTE - 4, 3);
      c.fillStyle = '#1a1a1a'; c.fillRect(x + 12, y + 14, 16, 3);
      c.fillStyle = '#e0a400'; c.font = 'bold 7px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('GR', x + KISTE / 2, y + 25);
      return;
    }
    c.fillStyle = '#b07a3c'; c.fillRect(x, y, KISTE, KISTE);
    c.strokeStyle = '#6e4519'; c.lineWidth = 3; c.strokeRect(x + 1.5, y + 1.5, KISTE - 3, KISTE - 3);
    c.fillStyle = '#6e4519'; c.fillRect(x, y + 18, KISTE, 3);
    c.fillStyle = 'rgba(24,33,58,.75)'; c.font = 'bold 10px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('TEA', x + KISTE / 2, y + 11);
  }
  function londonFahrzeug(c, a) {   // roter Doppeldecker oder Black Cab (fahren nach links, Front links)
    const x = a.x - kamera, y = BODEN_Y;
    c.save(); c.translate(x, y);
    if (a.art === 'bus') {
      c.fillStyle = UK_ROT; c.beginPath(); c.roundRect(0, -a.h, a.w, a.h - 6, [10, 6, 3, 3]); c.fill();
      c.fillStyle = '#f2f2f2'; c.fillRect(0, -a.h + 23, a.w, 3);
      c.fillStyle = '#1e2a36'; c.fillRect(6, -a.h + 5, a.w - 12, 13); c.fillRect(16, -a.h + 30, a.w - 22, 12);
      c.fillStyle = '#9fd3ee'; for (let k = 0; k < 6; k++) c.fillRect(9 + k * 18, -a.h + 7, 14, 9); for (let k = 0; k < 5; k++) c.fillRect(19 + k * 19, -a.h + 32, 15, 8);
      c.fillStyle = '#1a1a1a'; c.fillRect(2, -a.h + 30, 10, 18);   // Fahrertür/Front
      c.fillStyle = '#ffd93d'; c.fillRect(-1, -14, 5, 5);
      c.fillStyle = '#18213a'; c.fillRect(8, -a.h + 1, 34, 4); c.fillStyle = '#ffd36b'; c.font = 'bold 4px system-ui, sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('12 WESTMINSTER', 9, -a.h + 3);
    } else {
      c.fillStyle = '#141414'; c.beginPath(); c.roundRect(0, -a.h + 14, a.w, a.h - 20, 8); c.fill();
      c.beginPath(); c.moveTo(14, -a.h + 15); c.quadraticCurveTo(16, -a.h + 1, 30, -a.h + 1); c.lineTo(60, -a.h + 1); c.quadraticCurveTo(70, -a.h + 2, 70, -a.h + 15); c.closePath(); c.fill();
      c.fillStyle = '#8fb6cc'; c.beginPath(); c.moveTo(19, -a.h + 14); c.quadraticCurveTo(21, -a.h + 5, 30, -a.h + 5); c.lineTo(42, -a.h + 5); c.lineTo(42, -a.h + 14); c.closePath(); c.fill(); c.fillRect(45, -a.h + 5, 20, 9);
      c.fillStyle = '#ffd93d'; c.beginPath(); c.roundRect(36, -a.h - 4, 14, 5, 2); c.fill();
      c.fillStyle = '#18213a'; c.font = 'bold 4px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('TAXI', 43, -a.h - 1.5);
      c.fillStyle = '#c9c9c9'; c.fillRect(-2, -a.h + 20, 5, 8);
      c.fillStyle = '#ffd93d'; c.beginPath(); c.arc(4, -a.h + 19, 3, 0, Math.PI * 2); c.fill();
    }
    for (const rx of a.art === 'bus' ? [20, a.w - 22] : [15, a.w - 16]) {
      c.fillStyle = '#1a1a1a'; c.beginPath(); c.arc(rx, -7, 9, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#aaa'; c.beginPath(); c.arc(rx, -7, 4, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#1a1a1a'; c.lineWidth = 2; c.beginPath(); c.moveTo(rx + Math.cos(a.rad) * 4, -7 + Math.sin(a.rad) * 4); c.lineTo(rx - Math.cos(a.rad) * 4, -7 - Math.sin(a.rad) * 4); c.stroke();
    }
    c.fillStyle = 'rgba(255,240,170,.28)'; c.beginPath(); c.moveTo(0, -18); c.lineTo(-44, -30); c.lineTo(-44, -2); c.closePath(); c.fill();
    c.restore();
  }
  function pfuetzeZeichnen(c, o) {   // Regenpfütze: blaugraue Fläche mit Spiegelung und Regentropfen-Ringen
    const x = o.x - kamera, w = o.w;
    c.save(); c.translate(x + w / 2, BODEN_Y + 4);
    c.fillStyle = '#6d8ca3'; c.beginPath(); c.ellipse(0, 0, w / 2, 6.5, 0, 0, Math.PI * 2); c.ellipse(w / 5, 3, w / 5, 4, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-w / 6, -1.5, w / 5, 1.6, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1;
    for (let k = 0; k < 3; k++) { const t = (zeit * 0.9 + k * 0.33) % 1, rx = (k - 1) * w / 4; c.globalAlpha = 1 - t; c.beginPath(); c.ellipse(rx, 0, 2 + t * 10, 0.8 + t * 2.5, 0, 0, Math.PI * 2); c.stroke(); }
    c.restore();
  }
  function fuchs(c, g) {   // Stadtfuchs: orange, weiße Brust und Schwanzspitze, schwarze Pfoten und Ohrspitzen; läuft hin und her, plattdrückbar
    const b = gegnerBox(g); const cx = b.x + 22, cy = b.y + 30;
    c.save(); c.translate(cx, cy); if (g.richtung > 0) c.scale(-1, 1);
    if (g.tot > 0) c.scale(1, Math.max(0.15, 1 - g.tot * 2));
    const w = Math.sin(g.flug * 10) * 3;
    c.lineCap = 'round'; c.lineWidth = 9; c.strokeStyle = '#d9692a'; c.beginPath(); c.moveTo(16, -16); c.quadraticCurveTo(32, -18 + w, 33, -32 + w); c.stroke();
    c.lineWidth = 6; c.strokeStyle = '#f6f2ea'; c.beginPath(); c.moveTo(32, -27 + w); c.lineTo(33, -33 + w); c.stroke();
    c.fillStyle = '#d9692a'; c.beginPath(); c.ellipse(0, -14, 19, 9.5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f6f2ea'; c.beginPath(); c.ellipse(-8, -10, 9, 5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#d9692a'; c.beginPath(); c.ellipse(-18, -20, 9.5, 8, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(-26, -22); c.lineTo(-35, -19); c.lineTo(-25, -15); c.closePath(); c.fill();   // Schnauze
    c.fillStyle = '#f6f2ea'; c.beginPath(); c.moveTo(-25, -17); c.lineTo(-34, -18.5); c.lineTo(-24, -14); c.closePath(); c.fill();
    c.fillStyle = '#d9692a'; c.beginPath(); c.moveTo(-23, -26); c.lineTo(-22, -37); c.lineTo(-16, -27); c.closePath(); c.moveTo(-14, -27); c.lineTo(-10, -37); c.lineTo(-8, -25); c.closePath(); c.fill();   // Ohren
    c.fillStyle = '#1a1a1a'; c.beginPath(); c.moveTo(-22.5, -33); c.lineTo(-22, -37); c.lineTo(-19.5, -33); c.closePath(); c.moveTo(-11, -33); c.lineTo(-10, -37); c.lineTo(-8.5, -32); c.closePath(); c.fill();
    c.beginPath(); c.arc(-20, -22, 1.8, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(-34.5, -19.5, 1.6, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#2a2420'; c.beginPath(); c.roundRect(-12 + w, -6, 6, 6, 2); c.roundRect(6 - w, -6, 6, 6, 2); c.fill();
    c.restore();
  }
  function schilderhaus(c, x, y) {   // Schilderhaus (Wachhäuschen) hinter dem Sergeant: Holzkasten mit Spitzdach, dunkle Nische
    c.save(); c.translate(x + 46, y);
    c.fillStyle = '#e8e2d2'; c.fillRect(-28, -150, 56, 150);
    c.fillStyle = '#1f2a33'; c.beginPath(); c.moveTo(-20, 0); c.lineTo(-20, -126); c.arc(0, -126, 20, Math.PI, 0); c.lineTo(20, 0); c.closePath(); c.fill();
    c.fillStyle = '#d4ccb8'; c.beginPath(); c.moveTo(-34, -150); c.lineTo(0, -178); c.lineTo(34, -150); c.closePath(); c.fill();
    c.fillStyle = UK_ROT; c.beginPath(); c.arc(0, -160, 6, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#b9b09a'; c.fillRect(-28, -6, 56, 6);
    c.restore();
  }
  function sergeantBearskin(c, x, y) {   // Boss Welt Westminster: Royal Guard mit hoher Bärenfellmütze, roter Uniform; steht stocksteif, nur die Augen wandern (beim Boss: zur Figur)
    const auf = boss.sichtbar, weg = boss.weg;
    const gx = x + (1 - auf) * 46 + weg * 240;   // tritt aus dem Schilderhaus (sichtbar) und marschiert im Finale zur Seite (weg)
    const marsch = weg > 0 && !ruhig() ? Math.sin(zeit * 9) : 0;
    const blick = (zustand === 'boss' || zustand === 'sequenz') ? -2 : (Math.sin(zeit * 0.8) > 0.35 ? 2 : Math.sin(zeit * 0.8) < -0.35 ? -2 : 0);   // nur die Augen bewegen sich
    gardist(c, gx, y, { alpha: 1 - weg * 0.85, marsch, blick });
  }
  // Gardist (Sergeant Bearskin) an (gx, y): o = { alpha, marsch, blick, hut: 'fell' | 'keiner' | 'cap', laecheln 0..1, lachen 0..1 } – Boss nutzt nur alpha/marsch/blick, der Film auch Hut und Mund
  function gardist(c, gx, y, o) {
    const marsch = o.marsch || 0, blick = o.blick || 0, hut = o.hut || 'fell', lachen = o.lachen || 0, laecheln = o.laecheln || 0;
    c.save(); c.translate(gx, y); c.globalAlpha = o.alpha == null ? 1 : o.alpha;
    if (lachen > 0) c.translate(0, -Math.abs(Math.sin(zeit * 16)) * 2 * lachen);   // lacht: hüpft leicht
    for (const [bx, w] of [[-7, marsch], [7, -marsch]]) {   // Beine (navy mit rotem Streifen), Stiefel
      c.save(); c.translate(bx, -52); c.rotate(w * 0.3);
      c.fillStyle = '#16213d'; c.fillRect(-5, 0, 10, 50); c.fillStyle = UK_ROT; c.fillRect(-1, 0, 2, 48);
      c.fillStyle = '#0d0d0d'; c.beginPath(); c.roundRect(-6, 44, 13, 8, 3); c.fill();
      c.restore();
    }
    c.fillStyle = UK_ROT; c.beginPath(); c.roundRect(-19, -112, 38, 64, 6); c.fill();   // Rock
    c.fillStyle = '#16213d'; c.fillRect(-15, -114, 30, 7);                              // Kragen
    c.fillStyle = '#f4f4f4'; c.fillRect(-19, -74, 38, 6);                               // Gürtel
    c.fillStyle = '#e0a400'; c.fillRect(-4, -75, 8, 8);
    for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(0, -102 + k * 8, 1.8, 0, Math.PI * 2); c.fill(); }
    c.beginPath(); c.arc(0, -62, 1.8, 0, Math.PI * 2); c.fill();
    c.fillStyle = UK_ROT; c.fillRect(-27, -110, 9, 50); c.fillRect(18, -110, 9, 50);   // Arme stocksteif
    c.fillStyle = '#16213d'; c.fillRect(-27, -66, 9, 5); c.fillRect(18, -66, 9, 5);
    c.fillStyle = '#e0a400'; c.fillRect(-28, -112, 11, 4); c.fillRect(17, -112, 11, 4);   // Schulterstücke
    c.fillStyle = '#f4f4f4'; c.beginPath(); c.arc(-22.5, -57, 5, 0, Math.PI * 2); c.arc(22.5, -57, 5, 0, Math.PI * 2); c.fill();   // weiße Handschuhe
    c.fillStyle = '#f1c9a5'; c.beginPath(); c.arc(0, -124, 11, 0, Math.PI * 2); c.fill();   // Kopf
    if (lachen > 0.5) {   // lacht: Augen zu (Bögen)
      c.strokeStyle = '#18213a'; c.lineWidth = 1.6; for (const ax of [-4.6, 4.6]) { c.beginPath(); c.arc(ax, -123, 3, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
    } else {
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(-4.6, -125, 3.7, 2.9, 0, 0, Math.PI * 2); c.ellipse(4.6, -125, 3.7, 2.9, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#18213a'; c.beginPath(); c.arc(-4.6 + blick, -125, 1.7, 0, Math.PI * 2); c.arc(4.6 + blick, -125, 1.7, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = '#e3a98a'; c.beginPath(); c.ellipse(0, -122, 2, 2.6, 0, 0, Math.PI * 2); c.fill();   // Nase
    if (lachen > 0) {   // offener Mund unter dem Schnurrbart
      c.fillStyle = '#7a1f1f'; c.beginPath(); c.ellipse(0, -114.5, 4.2, 3.6 * lachen, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff'; c.fillRect(-2.6, -117.5, 5.2, 1.4);
    } else if (laecheln > 0) {   // ein kleines Lächeln
      c.strokeStyle = '#7a2a1a'; c.lineWidth = 1.5; c.lineCap = 'round'; c.beginPath(); c.arc(0, -119.5, 5, Math.PI * (0.5 - 0.32 * laecheln), Math.PI * (0.5 + 0.32 * laecheln)); c.stroke();
    }
    c.fillStyle = '#5a3a22'; c.beginPath(); c.moveTo(0, -119); c.quadraticCurveTo(-6, -121, -10, -116); c.quadraticCurveTo(-5, -117, 0, -117); c.quadraticCurveTo(5, -117, 10, -116); c.quadraticCurveTo(6, -121, 0, -119); c.fill();   // Schnurrbart
    if (hut === 'fell') {
      c.fillStyle = '#0d0d0d'; c.beginPath(); c.moveTo(-15, -130); c.quadraticCurveTo(-21, -188, 0, -196); c.quadraticCurveTo(21, -188, 15, -130); c.closePath(); c.fill();   // Bärenfellmütze (lässt die Augen frei)
      c.strokeStyle = '#2b2b2b'; c.lineWidth = 2;
      for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(-9 + (k % 3) * 9, -176 + Math.floor(k / 3) * 22, 5, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
      c.strokeStyle = '#e0a400'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-11, -129); c.quadraticCurveTo(-9, -112, 0, -111); c.quadraticCurveTo(9, -112, 11, -129); c.stroke();   // Kinnriemen
    } else {
      c.fillStyle = '#8a4b22'; c.beginPath(); c.arc(0, -126, 11.4, Math.PI * 1.05, Math.PI * 1.95); c.closePath(); c.fill();   // ohne Mütze: kurze rotbraune Haare
      if (hut === 'cap') capZeichnen(c, 0, -131, 1);
    }
    c.restore();
  }
  function capZeichnen(c, x, y, s) {   // blaue Cap (wie bei der Figur): Kuppel, Schirm nach rechts, goldener Knopf; (x, y) = Unterkante Mitte
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = '#1d3f8f'; c.beginPath(); c.arc(0, 2, 12.5, Math.PI, 0); c.closePath(); c.fill();
    c.beginPath(); c.roundRect(2, 0, 20, 4, 2); c.fill();
    c.fillStyle = '#e0a400'; c.beginPath(); c.arc(0, -9.5, 2.2, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  function fellmuetze(c, x, y, s) {   // Bärenfellmütze als Gegenstand (Film): (x, y) = Unterkante Mitte
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = '#0d0d0d'; c.beginPath(); c.moveTo(-15, 0); c.quadraticCurveTo(-21, -58, 0, -66); c.quadraticCurveTo(21, -58, 15, 0); c.closePath(); c.fill();
    c.strokeStyle = '#2b2b2b'; c.lineWidth = 2;
    for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(-9 + (k % 3) * 9, -46 + Math.floor(k / 3) * 22, 5, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
    c.restore();
  }
  function horseGuardsTor(c, x, y) {   // Tür der Welt Westminster: Tor der Horse Guards – helle Steinfassade mit Uhrtürmchen, Rundbogen, schwarzes Gittertor mit Goldspitzen, das aufschwingt
    c.save(); c.translate(x, y);
    c.fillStyle = '#e6dcc6'; c.fillRect(-90, -160, 280, 160);
    c.fillStyle = '#d6cab0'; c.fillRect(-90, -166, 280, 8);
    c.fillStyle = 'rgba(0,0,0,.16)'; for (let r = 0; r < 2; r++) for (let k = 0; k < 9; k++) { const wx = -80 + k * 30; if (wx > -46 && wx < 40) continue; c.fillRect(wx, -140 + r * 50, 14, 26); }
    c.fillStyle = '#e6dcc6'; c.fillRect(-28, -212, 56, 50);   // Uhrtürmchen
    c.beginPath(); c.moveTo(-32, -212); c.lineTo(0, -238); c.lineTo(32, -212); c.closePath(); c.fill();
    c.fillStyle = '#5a6a6a'; c.fillRect(-2, -252, 4, 16);
    c.fillStyle = '#f3ead2'; c.beginPath(); c.arc(0, -188, 13, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#2a2a2a'; c.lineWidth = 1.5; c.stroke();
    c.beginPath(); c.moveTo(0, -188); c.lineTo(0, -198); c.moveTo(0, -188); c.lineTo(7, -188); c.stroke();
    c.fillStyle = '#18213a'; c.beginPath(); c.roundRect(-46, -152, 92, 16, 3); c.fill();
    c.fillStyle = '#ffd36b'; c.font = 'bold 10px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('HORSE GUARDS', 0, -144);
    c.fillStyle = '#2c2a26'; c.beginPath(); c.moveTo(-36, 0); c.lineTo(-36, -96); c.arc(0, -96, 36, Math.PI, 0); c.lineTo(36, 0); c.closePath(); c.fill();   // Bogen
    const offen = tuer.offen;
    if (offen > 0) { c.fillStyle = `rgba(255,240,180,${0.9 * offen})`; c.beginPath(); c.moveTo(-34, 0); c.lineTo(-34, -96); c.arc(0, -96, 34, Math.PI, 0); c.lineTo(34, 0); c.closePath(); c.fill(); }
    for (const seite of [-1, 1]) {   // zwei Gitterflügel schwingen auf (werden schmaler)
      c.save(); c.translate(seite * 34, 0); c.scale(Math.max(0.05, 1 - offen * 0.95), 1);
      const x0 = seite > 0 ? -34 : 0;
      c.strokeStyle = '#121212'; c.lineWidth = 2.5;
      for (let k = 0; k <= 5; k++) { const sx = x0 + k * 6.8; c.beginPath(); c.moveTo(sx, -2); c.lineTo(sx, -104); c.stroke(); c.fillStyle = '#e0a400'; c.beginPath(); c.moveTo(sx - 2.5, -104); c.lineTo(sx, -112); c.lineTo(sx + 2.5, -104); c.closePath(); c.fill(); }
      c.beginPath(); c.moveTo(x0, -20); c.lineTo(x0 + 34, -20); c.moveTo(x0, -70); c.lineTo(x0 + 34, -70); c.stroke();
      c.fillStyle = '#e0a400'; c.beginPath(); c.arc(x0 + 17, -45, 5, 0, Math.PI * 2); c.fill();
      c.restore();
    }
    unionJack(c, 60, -228, 30, 18); c.fillStyle = '#555'; c.fillRect(58, -228, 2, 66);
    c.restore();
  }
  function falkeZeichnen(c, x, y) {   // Cameo Felix: Falke über der Figur, Flügel schlagen, Krallen halten die Figur
    c.save(); c.translate(x, y);
    const fl = Math.sin(zeit * 16) * 10;
    c.strokeStyle = '#4a3420'; c.lineWidth = 2; c.beginPath(); c.moveTo(-5, 6); c.lineTo(-6, 22); c.moveTo(5, 6); c.lineTo(6, 22); c.stroke();
    c.fillStyle = '#8a5a2b'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-22, -10 - fl, -44, -4 - fl); c.quadraticCurveTo(-22, 4, 0, 6); c.quadraticCurveTo(22, 4, 44, -4 - fl); c.quadraticCurveTo(22, -10 - fl, 0, 0); c.fill();
    c.fillStyle = '#a8784a'; c.beginPath(); c.ellipse(0, 2, 8, 6, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#e8d8c0'; c.beginPath(); c.arc(-6, -2, 4.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#e0a400'; c.beginPath(); c.moveTo(-10, -2); c.lineTo(-14, 0); c.lineTo(-10, 1); c.closePath(); c.fill();
    c.restore();
  }
  // Cameo: fliegt von oben rechts heran (0,5 s), schwebt neben der Figur (Sprechblase), fliegt wieder davon (0,45 s); runder Ausschnitt des Kartenbilds mit Umhang
  function cameoZeichnen(c) {
    const t = cameo.t, info = cameo.info, R = CAMEO_R;
    const zx = Math.min(viewW - 60, Math.max(60, spieler.x - kamera + 150)), zy = Math.max(118, spieler.y - 195);   // rechts über der Figur, über ihrer Wort-Sprechblase
    let px, py;
    if (t < CAMEO_EIN) { const f = 1 - Math.pow(1 - t / CAMEO_EIN, 3); px = viewW + 50 + (zx - viewW - 50) * f; py = -40 + (zy + 40) * f; }
    else if (t > CAMEO_DAUER - CAMEO_AUS) { const f = (t - (CAMEO_DAUER - CAMEO_AUS)) / CAMEO_AUS; px = zx + (viewW + 90 - zx) * f * f; py = zy - (zy + 90) * f * f; }
    else { px = zx; py = zy + (ruhig() ? 0 : Math.sin(t * 5) * 5); }
    c.save(); c.translate(px, py);
    const wehen = ruhig() ? 0 : Math.sin(zeit * 9) * 6;
    c.fillStyle = info.farbe; c.beginPath(); c.moveTo(-16, 12); c.quadraticCurveTo(-30, 34, -24 + wehen * 0.5, 56); c.quadraticCurveTo(8, 50 + wehen, 40 + wehen, 50); c.quadraticCurveTo(24, 30, 16, 12); c.closePath(); c.fill();
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.moveTo(2, 14); c.quadraticCurveTo(14, 34, 40 + wehen, 50); c.quadraticCurveTo(24, 30, 16, 12); c.closePath(); c.fill();
    const img = cameoBilder[cameo.held && cameo.held.id];
    c.save(); c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.closePath(); c.clip();
    if (img && img.complete && img.naturalWidth > 0) {
      const s = Math.min(img.naturalWidth, img.naturalHeight), sx = (img.naturalWidth - s) / 2, sy = (img.naturalHeight - s) * 0.2;
      c.drawImage(img, sx, sy, s, s, -R, -R, R * 2, R * 2);
    } else {
      c.fillStyle = info.farbe; c.fillRect(-R, -R, R * 2, R * 2);
      c.fillStyle = '#fff'; c.font = 'bold 24px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String((cameo.held && cameo.held.name) || '?').charAt(0), 0, 1);
    }
    c.restore();
    c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = info.farbe; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, R + 2.5, 0, Math.PI * 2); c.stroke();
    c.restore();
    if (t > CAMEO_EIN * 0.6 && t < CAMEO_DAUER - CAMEO_AUS * 0.4) {   // Sprechblase rechts vom Helden (reicht der Platz nicht: links)
      const text = `${info.symbol} ${cameo.satz}`;
      c.save(); c.font = 'bold 15px system-ui, sans-serif'; c.textBaseline = 'middle'; c.textAlign = 'center';
      const w = c.measureText(text).width + 22, h = 30;
      let bx = px + R + 12, links = false;
      if (bx + w > viewW - 6) { bx = Math.max(6, px - R - 12 - w); links = true; }
      const by = py - h / 2;
      c.fillStyle = '#fff'; c.strokeStyle = info.farbe; c.lineWidth = 2;
      c.beginPath(); c.roundRect(bx, by, w, h, 10); c.fill(); c.stroke();
      const sx = links ? bx + w : bx; c.beginPath(); c.moveTo(sx, py - 6); c.lineTo(sx + (links ? 9 : -9), py); c.lineTo(sx, py + 6); c.closePath(); c.fill();
      c.fillStyle = '#18213a'; c.fillText(text, bx + w / 2, py + 1);
      c.restore();
    }
  }

  /* ---------- Story-Modus: Zeichnen (Kristall ♪, Erzähltext oben, Station, Film) ---------- */
  // Story-Kristall: hohes violettes Prisma mit Goldkante und weißem ♪, sanftes Glühen (pulsiert) – klar anders als der türkise Punkte-Diamant
  function kristallZeichnen(c, x, y, t, alpha) {
    c.save(); c.translate(x, y);
    const glow = c.createRadialGradient(0, 0, 2, 0, 0, 32);
    glow.addColorStop(0, 'rgba(255,211,107,.6)'); glow.addColorStop(0.45, 'rgba(176,124,255,.32)'); glow.addColorStop(1, 'rgba(176,124,255,0)');
    c.globalAlpha = alpha * (ruhig() ? 0.85 : 0.7 + 0.3 * Math.sin(t * 4)); c.fillStyle = glow; c.beginPath(); c.arc(0, 0, 32, 0, Math.PI * 2); c.fill();
    c.globalAlpha = alpha;
    const g = c.createLinearGradient(-11, -20, 11, 20); g.addColorStop(0, '#e3ccff'); g.addColorStop(0.45, '#9b5cff'); g.addColorStop(1, '#4a1a9e');
    c.fillStyle = g; c.beginPath(); c.moveTo(0, -21); c.lineTo(12, -9); c.lineTo(12, 9); c.lineTo(0, 21); c.lineTo(-12, 9); c.lineTo(-12, -9); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.moveTo(0, -21); c.lineTo(-12, -9); c.lineTo(-12, 9); c.lineTo(-4, 4); c.lineTo(-4, -12); c.closePath(); c.fill();
    c.strokeStyle = '#ffd36b'; c.lineWidth = 2; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(0, -21); c.lineTo(12, -9); c.lineTo(12, 9); c.lineTo(0, 21); c.lineTo(-12, 9); c.lineTo(-12, -9); c.closePath(); c.stroke();
    c.font = 'bold 19px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 3; c.strokeStyle = 'rgba(60,20,110,.8)'; c.strokeText('♪', 0, 1); c.fillStyle = '#fff'; c.fillText('♪', 0, 1);
    if (!ruhig()) { const f = 1.5 + Math.sin(t * 6) * 1.2; c.fillStyle = '#fff6c0'; c.beginPath(); c.arc(9, -16, Math.max(0.4, f), 0, Math.PI * 2); c.fill(); }
    c.restore();
  }
  function kristalleZeichnen(c) {
    for (const k of kristalle) {
      const x = k.x - kamera; if (x < -50 || x > viewW + 50) continue;
      if (k.puff > 0) {   // das andere ♪ an der Gabelung verschwindet: schrumpft + Ring
        const f = k.puff / 0.6;
        kristallZeichnen(c, x, k.y, k.funkel, f * 0.8);
        c.save(); c.globalAlpha = f; c.strokeStyle = '#d9c8ff'; c.lineWidth = 3; c.beginPath(); c.arc(x, k.y, 14 + (1 - f) * 30, 0, Math.PI * 2); c.stroke(); c.restore();
        continue;
      }
      if (!kristallSichtbar(k)) continue;
      const schweb = ruhig() ? 0 : Math.sin(k.funkel * 2.5) * 4;
      kristallZeichnen(c, x, k.y + schweb, k.funkel, 1);
      if (k.nr === 5 && !story.strang) {   // Gabelung: wer steckt dahinter?
        c.font = '20px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(k.strang === 'A' ? '🦊' : '🕊️', x, k.y + schweb - 36);
      }
    }
  }
  function parkbusZeichnen(c) {   // geparkter Doppeldecker (Gabelung): wie der fahrende, ohne Scheinwerferkegel, mit Warnblinker
    for (const b of level.parkbusse) {
      const x = b.x - kamera; if (x > viewW + 140 || x + PARKBUS_W < -140) continue;
      londonFahrzeug(c, { art: 'bus', x: b.x, w: PARKBUS_W, h: PARKBUS_H, rad: 0 });
      if (Math.floor(zeit * 2) % 2 === 0) { c.fillStyle = '#ffb000'; c.fillRect(x - 1, BODEN_Y - 15, 5, 5); c.fillRect(x + PARKBUS_W - 4, BODEN_Y - 15, 5, 5); }
    }
  }
  function zeilenUmbruch(c, text, maxW) {
    const woerter_ = String(text).split(' '), zeilen = []; let z = '';
    for (const w of woerter_) { const t = z ? z + ' ' + w : w; if (z && c.measureText(t).width > maxW) { zeilen.push(z); z = w; } else z = t; }
    if (z) zeilen.push(z);
    return zeilen;
  }
  // Erzähltext oben mittig: schreibt sich ein (Schreibmaschine, Cursor), bleibt 3,5 s, blasst aus; Box-Größe steht von Anfang an (kein Springen)
  function storyTextZeichnen(c) {
    const a = story.aktiv; if (!a) return;
    const n = a.tipp > 0 ? Math.min(a.text.length, Math.floor(a.t * TIPP_TEMPO)) : a.text.length;
    const alpha = Math.max(0, Math.min(1, a.t / 0.2, (a.dauer - a.t) / STORY_AUS));
    const gr = viewW < 700 ? 19 : 24;
    c.save(); c.globalAlpha = alpha;
    c.font = `bold ${gr}px system-ui, sans-serif`;
    const zeilen = zeilenUmbruch(c, a.text, Math.min(viewW - 120, 760));
    const lh = gr + 8, w = Math.max(...zeilen.map((z) => c.measureText(z).width)) + 78, h = zeilen.length * lh + 26;
    const x = viewW / 2 - w / 2, y = 70;
    c.fillStyle = 'rgba(48,18,96,.88)'; c.strokeStyle = '#ffd36b'; c.lineWidth = 2.5;
    c.beginPath(); c.roundRect(x, y, w, h, 14); c.fill(); c.stroke();
    c.textBaseline = 'middle'; c.textAlign = 'center'; c.fillStyle = '#ffd36b'; c.fillText('♪', x + 26, y + h / 2);
    c.textAlign = 'left'; c.fillStyle = '#fff';
    let rest = n;
    zeilen.forEach((z, i) => {
      const teil = z.slice(0, Math.max(0, rest)); rest -= z.length + 1;
      c.fillText(teil, x + 50, y + 13 + lh * i + lh / 2);
      if (n < a.text.length && rest < 0 && rest > -z.length - 2 && Math.floor(a.t * 4) % 2 === 0) { const cx = x + 50 + c.measureText(teil).width + 2; c.fillStyle = '#ffd36b'; c.fillRect(cx, y + 13 + lh * i + 5, 3, lh - 10); c.fillStyle = '#fff'; }
    });
    c.font = '600 11px system-ui, sans-serif'; c.textAlign = 'right'; c.fillStyle = 'rgba(255,211,107,.85)'; c.fillText('🎙 Mr. Alex', x + w - 10, y + h - 9);
    c.restore();
  }
  function storyHud(c) {   // ♪-Zähler neben den Herzen
    const txt = `♪ ${story.gesammelt.length} / 12`;
    c.save(); c.font = 'bold 16px system-ui, sans-serif'; c.textBaseline = 'middle'; c.textAlign = 'center';
    const w = c.measureText(txt).width + 18, puls = ruhig() ? 1 : 1 + 0.12 * Math.sin(Math.min(1, hudPuls) * Math.PI);
    c.translate(96 + w / 2, 24); c.scale(puls, puls);
    c.fillStyle = 'rgba(74,26,158,.9)'; c.strokeStyle = '#ffd36b'; c.lineWidth = 1.5; c.beginPath(); c.roundRect(-w / 2, -13, w, 26, 13); c.fill(); c.stroke();
    c.fillStyle = '#fff'; c.fillText(txt, 0, 1);
    c.restore();
  }
  // Station „The story so far“: Spiel steht, Liste aller bisherigen Stücke (verpasste „…“), Knopf „Weiter ▶“ (Tap irgendwo)
  function stationZeichnen(c) {
    const st = story.station;
    c.fillStyle = 'rgba(24,10,48,.66)'; c.fillRect(0, 0, viewW, H);
    const lh = st.keys.length > 4 ? 25 : 31, fs = st.keys.length > 4 ? 16 : 18;
    const w = Math.min(viewW - 32, 640), h = 84 + st.keys.length * lh + 58, x = viewW / 2 - w / 2, y = Math.max(6, (H - h) / 2);
    const auf = ruhig() ? 1 : Math.min(1, st.t / 0.25);
    c.save(); c.globalAlpha = auf;
    c.fillStyle = '#fbf6ff'; c.strokeStyle = '#7a3ff0'; c.lineWidth = 3; c.beginPath(); c.roundRect(x, y, w, h, 16); c.fill(); c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = 'bold 24px system-ui, sans-serif'; c.fillStyle = '#4b1fa0'; c.fillText('📖 The story so far', viewW / 2, y + 28);
    c.font = 'italic 600 13px system-ui, sans-serif'; c.fillStyle = '#7a6a99'; c.fillText(`${(storyOpt && storyOpt.titel) || ''} · Station ${st.nr}`, viewW / 2, y + 54);
    c.textAlign = 'left';
    st.keys.forEach((k, i) => {
      const da = story.gesammelt.includes(k), ly = y + 80 + i * lh + lh / 2;
      c.font = `bold ${fs}px system-ui, sans-serif`; c.fillStyle = da ? '#9b5cff' : '#c9c0d9'; c.fillText('♪', x + 22, ly);
      c.font = `600 ${fs}px system-ui, sans-serif`; c.fillStyle = da ? '#18213a' : '#9a92aa';
      c.fillText(da ? storyText(k) : '…', x + 44, ly);
      if (i === 3 && st.keys.length > 4) { c.strokeStyle = 'rgba(122,63,240,.25)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 22, ly + lh / 2); c.lineTo(x + w - 22, ly + lh / 2); c.stroke(); }
    });
    const bw = 150, bx = viewW / 2 - bw / 2, by = y + h - 48;
    c.fillStyle = '#7a3ff0'; c.beginPath(); c.roundRect(bx, by, bw, 36, 18); c.fill();
    c.font = 'bold 17px system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText('Weiter ▶', viewW / 2, by + 18);
    c.font = '600 11px system-ui, sans-serif'; c.fillStyle = '#7a6a99'; c.fillText('🎙 Mr. Alex liest vor · Tippen = weiter', viewW / 2, by - 10);
    c.restore();
  }

  /* Film: Bühne in Weltkoordinaten (Paradeplatz der Horse Guards, Big Ben links dahinter), Kamera je Szene mit sanftem Schwenk/Zoom */
  const FILM_BB = { x: 300, s: 1.25 }, FILM_TOR = 720, FILM_SGT = 585;
  const sanft = (f) => { f = Math.max(0, Math.min(1, f)); return f * f * (3 - 2 * f); };
  const lerp = (a, b, f) => a + (b - a) * f;
  function filmKamera(sz, f, ende) {   // [x, y, zoom] der Bildmitte
    const K = {
      A: [[[250, 215, 1.0], [540, 235, 1.2]], [[360, 235, 1.25], [535, 245, 1.55]], [[548, 228, 1.6], [578, 208, 2.2]]],
      B: [[[250, 215, 1.0], [540, 235, 1.2]], [[FILM_BB.x, 70, 2.1], [530, 245, 1.45]], [[545, 230, 1.5], [560, 228, 1.75]]],
    }[ende][sz];
    const g = ende === 'B' && sz === 1 ? sanft((f - 0.38) / 0.5) : sanft(f);   // Ende B Szene 2: erst das Nest, dann Schwenk hinunter zur Figur
    return [lerp(K[0][0], K[1][0], g), lerp(K[0][1], K[1][1], g), lerp(K[0][2], K[1][2], g)];
  }
  function pferd(c, x, y, t) {   // Pferd der Household Cavalry (schwarz) mit Reiter (rote Jacke, Silberhelm, weißer Federbusch); läuft nach rechts
    const b = ruhig() ? 0 : Math.sin(t * 10);
    c.save(); c.translate(x, y - Math.abs(b) * 2);
    c.strokeStyle = '#141414'; c.lineWidth = 6; c.lineCap = 'round';
    for (const [lx, ph] of [[-22, 0], [-14, 1.6], [16, 0.8], [24, 2.4]]) { const w = ruhig() ? 0 : Math.sin(t * 10 + ph) * 0.45; c.beginPath(); c.moveTo(lx, -38); c.lineTo(lx + Math.sin(w) * 16, -4); c.stroke(); }
    c.fillStyle = '#141414'; c.beginPath(); c.ellipse(0, -46, 34, 15, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(24, -54); c.lineTo(40, -84); c.lineTo(52, -80); c.lineTo(36, -46); c.closePath(); c.fill();   // Hals
    c.beginPath(); c.ellipse(50, -82, 12, 7, 0.5, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(-32, -50); c.quadraticCurveTo(-48, -40, -44, -18); c.lineTo(-38, -40); c.closePath(); c.fill();   // Schweif
    c.fillStyle = '#e0a400'; c.fillRect(-8, -62, 18, 6);   // Sattel
    c.fillStyle = UK_ROT; c.beginPath(); c.roundRect(-6, -92, 16, 30, 4); c.fill();
    c.fillStyle = '#16213d'; c.fillRect(-6, -64, 16, 5);
    c.fillStyle = '#f1c9a5'; c.beginPath(); c.arc(2, -98, 7, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#c9ced6'; c.beginPath(); c.arc(2, -101, 8, Math.PI, 0); c.fill();
    c.fillStyle = '#f4f4f4'; c.beginPath(); c.ellipse(-2, -110, 4, 9, -0.4, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  function babyTauben(c, x, y, t, wach) {   // Bärenfellmütze als Nest (liegt, Öffnung oben) mit drei Babytauben und der Mutter daneben
    c.save(); c.translate(x, y);
    c.fillStyle = '#0d0d0d'; c.beginPath(); c.ellipse(0, 0, 30, 14, 0, 0, Math.PI); c.fill(); c.fillRect(-30, -6, 60, 6);
    c.strokeStyle = '#2b2b2b'; c.lineWidth = 2; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(-18 + k * 12, 4, 5, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
    [-14, 0, 14].forEach((bx, i) => {
      const nick = ruhig() ? 0 : Math.sin(t * (wach ? 7 : 2) + i * 1.7) * (wach ? 3 : 1.2);
      c.fillStyle = '#b8bcc8'; c.beginPath(); c.arc(bx, -10 + nick, 8, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#e8e2d2'; c.beginPath(); c.arc(bx - 2, -15 + nick, 2.5, 0, Math.PI * 2); c.arc(bx + 3, -16 + nick, 2, 0, Math.PI * 2); c.fill();   // Flaum
      c.fillStyle = '#f0a020'; c.beginPath(); c.moveTo(bx + 5, -10 + nick); c.lineTo(bx + 10, -8 + nick); c.lineTo(bx + 5, -7 + nick); c.closePath(); c.fill();
      c.strokeStyle = '#18213a'; c.lineWidth = 1.3; c.beginPath();
      if (wach) c.arc(bx + 2, -12 + nick, 1.3, 0, Math.PI * 2); else c.arc(bx + 2, -12 + nick, 2, Math.PI * 0.1, Math.PI * 0.9);
      c.stroke();
    });
    c.fillStyle = '#8f96a8'; c.beginPath(); c.ellipse(46, -12, 15, 11, 0, 0, Math.PI * 2); c.fill();   // Mutter-Taube
    c.fillStyle = '#7a8296'; c.beginPath(); c.arc(56, -26, 7, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#4fa38a'; c.fillRect(51, -21, 10, 4);
    c.fillStyle = '#f0a020'; c.beginPath(); c.moveTo(62, -27); c.lineTo(68, -25); c.lineTo(62, -23); c.closePath(); c.fill();
    c.fillStyle = '#18213a'; c.beginPath(); c.arc(58, -28, 1.4, 0, Math.PI * 2); c.fill();
    if (!wach && !ruhig()) { c.font = 'bold 12px system-ui, sans-serif'; c.fillStyle = '#5a6a8a'; c.textAlign = 'center'; c.fillText('z', -22, -26 - (t * 8) % 10); c.fillText('Z', -30, -36 - (t * 6) % 10); }
    c.restore();
  }
  function zuschauer(c, x, y, t, lachen) {   // Touristen vorn im Bild (Ende B): Silhouetten, lachen und winken
    const farben = ['#2a6cff', '#e0a400', '#2e9e5b', '#e8467c', '#8a3ffc', '#ff7a1a'];
    for (let i = 0; i < 6; i++) {
      const px = x + i * 46, hb = ruhig() ? 0 : Math.abs(Math.sin(t * 9 + i)) * 4 * lachen;
      c.fillStyle = farben[i]; c.beginPath(); c.roundRect(px - 13, y - 34 - hb, 26, 40, 9); c.fill();
      c.fillStyle = '#f1c27d'; c.beginPath(); c.arc(px, y - 46 - hb, 10, 0, Math.PI * 2); c.fill();
      if (lachen > 0) { c.strokeStyle = farben[i]; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(px - 11, y - 28 - hb); c.lineTo(px - 18, y - 52 - hb); c.moveTo(px + 11, y - 28 - hb); c.lineTo(px + 18, y - 52 - hb); c.stroke();
        c.fillStyle = '#7a1f1f'; c.beginPath(); c.arc(px + 2, y - 43 - hb, 3.5, 0, Math.PI); c.fill(); }
    }
  }
  function filmKulisse(c) {
    const g = c.createLinearGradient(0, -400, 0, BODEN_Y); g.addColorStop(0, '#4f9fdc'); g.addColorStop(0.7, '#bfe3fa'); g.addColorStop(1, '#eef6fb');
    c.fillStyle = g; c.fillRect(-400, -500, 1800, BODEN_Y + 500);
    c.save(); c.globalAlpha = 0.55; c.lineWidth = 9; REGENBOGEN.forEach((f, i) => { c.strokeStyle = f; c.beginPath(); c.arc(520, BODEN_Y - 20, 330 - i * 9, Math.PI, 0); c.stroke(); }); c.restore();
    c.fillStyle = 'rgba(255,255,255,.9)'; for (const [wx, wy] of [[60, 40], [460, -10], [880, 60]]) { c.beginPath(); c.arc(wx, wy, 18, 0, Math.PI * 2); c.arc(wx + 22, wy - 8, 22, 0, Math.PI * 2); c.arc(wx + 46, wy, 16, 0, Math.PI * 2); c.fill(); }
    parlament(c, FILM_BB.x - 22, BODEN_Y, 1.05, '#c9b48a');
    bigBen(c, FILM_BB.x, BODEN_Y, FILM_BB.s, '#c9b48a');
    c.fillStyle = '#d9cfb5'; c.fillRect(-400, BODEN_Y, 1800, 300);
    c.fillStyle = 'rgba(0,0,0,.06)'; for (let k = -10; k < 40; k++) c.fillRect(k * 40, BODEN_Y + 6 + (k % 3) * 9, 22, 2);
    horseGuardsTor(c, FILM_TOR, BODEN_Y);
  }
  // Figur des Schülers im Film: aktuelle Figur (Skin) per zeichneFigur; ohneCap = die Cap ist verschenkt (Ende B)
  function filmFigur(c, x, pose, ausdruck, ohneCap) {
    const s = ohneCap && skin.hut === 'cap' ? Object.assign({}, skin, { hut: 'keiner' }) : skin;
    zeichneFigur(c, x, BODEN_Y, 80, s, pose, zeit, ausdruck);
  }
  function filmZeichnen(c) {
    const f = film, ende = f.ende, sz = f.szene, p = Math.min(1, f.t / f.dauer), tt = f.t;
    if (sz >= 3) return filmTitel(c, f);
    const [kx, ky, kz] = filmKamera(sz, p, ende);
    c.save(); c.translate(viewW / 2, H / 2); c.scale(kz, kz); c.translate(-kx, -ky);
    filmKulisse(c);
    if (sz === 0) {   // Pferde kommen (Uhr: fünf), der Sergeant hat keine Mütze und schaut sich erschrocken um
      for (let i = 0; i < 2; i++) pferd(c, -160 + i * 110 + Math.min(1, tt / 4.2) * 380, BODEN_Y, zeit + i);
      gardist(c, FILM_SGT, BODEN_Y, { hut: 'keiner', blick: Math.sin(tt * 3) > 0 ? -2 : 2 });
      if (tt > 2.4) { c.font = 'bold 26px system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = UK_ROT; c.fillText('!', FILM_SGT + 22, BODEN_Y - 176 - (ruhig() ? 0 : Math.abs(Math.sin(tt * 6)) * 4)); }
    } else if (ende === 'A' && sz === 1) {   // die Figur rennt mit der Mütze über dem Kopf herbei
      const fx = lerp(120, FILM_SGT - 85, sanft(tt / 3.2)), laeuft_ = tt < 3.2;
      gardist(c, FILM_SGT, BODEN_Y, { hut: 'keiner', blick: -2 });
      filmFigur(c, fx, laeuft_ ? 'lauf' : 'steh', 'grinsend');
      fellmuetze(c, fx + 4, BODEN_Y - 96 - (laeuft_ && !ruhig() ? Math.abs(Math.sin(zeit * 13)) * 3 : 0), 0.62);
    } else if (ende === 'A' && sz === 2) {   // die Mütze wandert auf seinen Kopf – er lächelt kurz (nur einmal)
      const fx = FILM_SGT - 85, g = sanft(tt / 1.3);
      filmFigur(c, fx, 'steh', tt > 1.4 ? 'grinsend' : 'erstaunt');
      const lae = tt > 1.6 && tt < 3.3 ? Math.min(1, (tt - 1.6) / 0.3, (3.3 - tt) / 0.3) : 0;
      gardist(c, FILM_SGT, BODEN_Y, { hut: g >= 1 ? 'fell' : 'keiner', blick: -2, laecheln: lae });
      if (g < 1) fellmuetze(c, lerp(fx + 4, FILM_SGT, g), lerp(BODEN_Y - 96, BODEN_Y - 130, g) - Math.sin(g * Math.PI) * 30, lerp(0.62, 1, g));
      if (lae > 0 && !ruhig()) { c.fillStyle = '#ffd36b'; for (let k = 0; k < 4; k++) { const a = zeit * 3 + k * 1.6; c.beginPath(); c.arc(FILM_SGT + 18 + Math.cos(a) * 10, BODEN_Y - 118 + Math.sin(a) * 8, 1.6, 0, Math.PI * 2); c.fill(); } }
    } else if (ende === 'B' && sz === 1) {   // Babytauben schlafen im Hut auf Big Ben; Schwenk hinunter: die Figur nimmt ihre Cap ab
      babyTauben(c, FILM_BB.x - 2, BODEN_Y - 210 * FILM_BB.s + 2, zeit, false);
      gardist(c, FILM_SGT, BODEN_Y, { hut: 'keiner', blick: -2 });
      const fx = lerp(330, FILM_SGT - 85, sanft((tt - 1.6) / 2.4)), hebt = sanft((tt - 3.6) / 0.8);
      filmFigur(c, fx, tt > 1.6 && tt < 4 ? 'lauf' : 'steh', 'grinsend', hebt > 0);
      if (hebt > 0) capZeichnen(c, fx + 16, BODEN_Y - 60 - hebt * 34, 0.9);
    } else {   // Ende B Szene 3: die Cap wandert auf seinen Kopf – er lacht laut, alle sehen es und lachen mit
      const fx = FILM_SGT - 85, g = sanft(tt / 1.2), lacht = tt > 1.4 ? Math.min(1, (tt - 1.4) / 0.3) : 0;
      filmFigur(c, fx, 'steh', lacht > 0 ? 'zunge' : 'grinsend', true);
      gardist(c, FILM_SGT, BODEN_Y, { hut: g >= 1 ? 'cap' : 'keiner', blick: -2, lachen: lacht });
      if (g < 1) capZeichnen(c, lerp(fx + 16, FILM_SGT, g), lerp(BODEN_Y - 94, BODEN_Y - 131, g) - Math.sin(g * Math.PI) * 26, lerp(0.9, 1, g));
      if (lacht > 0) {
        c.font = 'bold 15px system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = UK_ROT;
        for (let k = 0; k < 3; k++) { const q = ruhig() ? 0.5 : ((tt * 0.7 + k * 0.33) % 1); c.globalAlpha = 1 - q; c.fillText('HA!', FILM_SGT + 30 + k * 10, BODEN_Y - 150 - q * 40); }
        c.globalAlpha = 1;
      }
      zuschauer(c, FILM_SGT - 150, BODEN_Y + 34, zeit, lacht);
    }
    c.restore();
    filmUntertitel(c, f);
  }
  function filmUntertitel(c, f) {
    c.save();
    const gr = viewW < 700 ? 18 : 21; c.font = `600 ${gr}px system-ui, sans-serif`;
    const zeilen = zeilenUmbruch(c, f.text, Math.min(viewW - 80, 820)), lh = gr + 7, h = zeilen.length * lh + 18;
    c.globalAlpha = Math.max(0, Math.min(1, f.t / 0.35));
    c.fillStyle = 'rgba(12,8,28,.72)'; c.fillRect(0, H - h - 8, viewW, h + 8);
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
    zeilen.forEach((z, i) => c.fillText(z, viewW / 2, H - h + 1 + lh * i + lh / 2));
    c.globalAlpha = 1; c.font = '600 12px system-ui, sans-serif'; c.textAlign = 'left'; c.fillStyle = 'rgba(255,255,255,.9)';
    c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 3; c.strokeText('🎬 Tippen = überspringen', 12, 18); c.fillText('🎬 Tippen = überspringen', 12, 18);
    c.restore();
  }
  function filmTitel(c, f) {   // Titelkarte: „The End – Ending A (1 of 2)“, Figur und Sergeant klein
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a1060'); g.addColorStop(1, '#18213a');
    c.fillStyle = g; c.fillRect(0, 0, viewW, H);
    const a = ruhig() ? 1 : Math.min(1, f.t / 0.6);
    c.save(); c.globalAlpha = a; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = 'italic 600 16px system-ui, sans-serif'; c.fillStyle = '#c9b8ff'; c.fillText((storyOpt && storyOpt.titel) || '', viewW / 2, 64);
    c.font = `bold ${viewW < 700 ? 30 : 40}px system-ui, sans-serif`; c.fillStyle = '#ffd36b'; c.fillText(`The End – Ending ${f.ende} (1 of 2)`, viewW / 2, 108);
    zeichneFigur(c, viewW / 2 - 50, 300, 70, f.ende === 'B' && skin.hut === 'cap' ? Object.assign({}, skin, { hut: 'keiner' }) : skin, 'steh', zeit, 'grinsend');
    c.save(); c.translate(viewW / 2 + 50, 300); c.scale(0.8, 0.8); gardist(c, 0, 0, { hut: f.ende === 'B' ? 'cap' : 'fell', laecheln: f.ende === 'A' ? 1 : 0, lachen: f.ende === 'B' ? 0.6 : 0, blick: -2 }); c.restore();
    c.font = '600 14px system-ui, sans-serif'; c.fillStyle = 'rgba(255,255,255,.75)'; c.fillText(f.ende === 'A' ? '🦊 🎩' : '🕊️ 🧢', viewW / 2, 340);
    c.fillText('Tippen = weiter', viewW / 2, 368);
    c.restore();
  }

  function hintergrund(c) { W.kulisse(c); }
  function hintergrundNY(c) {
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
    if (W.grube) for (let i = 1; i < level.boden.length; i++) { const a = level.boden[i - 1][1], b = level.boden[i][0]; if (b >= links && a <= rechts) W.grube(c, a, b); }
    for (const [a, b] of level.boden) {
      if (b < links || a > rechts) continue;
      W.boden(c, a - kamera, b - a, a, b, links, rechts);
    }
    for (const p of level.plattformen) {
      const x = p.x - kamera; if (x > viewW + 100 || x + p.w < -100) continue;
      if (p.art === 'stein' && W.stein) { W.stein(c, x, p.y, p.w); continue; }   // Trittstein im Bach (Welt 4)
      c.fillStyle = W.farben.plattform; c.beginPath(); c.roundRect(x, p.y, p.w, 14, 4); c.fill();
      c.fillStyle = W.farben.plattformOben; c.beginPath(); c.roundRect(x - 2, p.y - 3, p.w + 4, 7, 3); c.fill();
    }
    for (const k of level.kisten) {
      const x = k.x - kamera; if (x > viewW + 100 || x + KISTE < -100) continue;
      W.kiste(c, x, k.y, k);
    }
    for (const o of oel) { const x = o.x - kamera; if (x > viewW + 100 || x + o.w < -100) continue; oelZeichnen(c, o); }
    for (const b of bruecken) { const x = b.x - kamera; if (x > viewW + 100 || x + b.w < -100) continue; brueckeZeichnen(c, b); }
    for (const k of kakteen) { const x = k.x - kamera; if (x > viewW + 60 || x < -60) continue; kaktusZeichnen(c, k); }
    for (const h of hoehlen) { const x = h.x - kamera; if (x > viewW + 120 || x < -120) continue; hoehleZeichnen(c, h); }
    for (const s of staemme) { if (s.phase === 'weg') continue; const x = (s.phase === 'rollt' ? s.rx : s.x) - kamera; if (x > viewW + 80 || x < -80) continue; stammZeichnen(c, s); }
    for (const g of gondeln) { const x = g.x - kamera; if (x > viewW + 100 || x + g.w < -100) continue; seilbahnZeichnen(c, g); }   // Welt 5
    for (const s of surfs) { const x = s.x - kamera; if (x > viewW + 100 || x + s.w < -100) continue; surfZeichnen(c, s); }
    for (const cp of checkpoints) { const x = cp.x - kamera; if (x > -60 && x < viewW + 60) fahne(c, x, BODEN_Y, cp.erreicht); }
    if (story) { parkbusZeichnen(c); kristalleZeichnen(c); }
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
      (GEGNER_ZEICHNER[g.art] || waschbaer)(c, g);
      c.restore();
      if (eisZeit > 0 && g.tot <= 0 && !g.rollt && !g.klaut) {   // Cameo Penny: Eisblock um den Gegner
        const b = gegnerBox(g);
        c.fillStyle = 'rgba(160,225,255,.45)'; c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2;
        c.beginPath(); c.roundRect(b.x - kamera - 4, b.y - 4, b.w + 8, b.h + 8, 5); c.fill(); c.stroke();
      }
    }
    for (const a of autos) { const x = a.x - kamera; if (x > viewW + 100 || x + a.w < -100) continue; autoZeichnen(c, a); }
    for (const s of steine) { const x = s.x - kamera; if (x > viewW + 80 || x < -80) continue; steinZeichnen(c, s); }
    if (level.tuerX - kamera < viewW + 400) {
      W.tuer(c, level.tuerX - kamera, BODEN_Y);
      W.boss(c, level.bossX - kamera, BODEN_Y);
      if (bossSpruch) sprechblase(c, level.bossX - kamera - 20, BODEN_Y - W.sprechblaseHoehe, bossSpruch.text);
    }
    if (nebelDichte > 0) {   // Welt 5: Nebelschleier über allem bisher Gezeichneten; die Diamanten glühen durch den Nebel, die Figur bleibt sichtbar
      nebelZeichnen(c, nebelDichte);
      for (const d of diamanten) {
        if (d.weg) continue; const x = d.x - kamera; if (x < -40 || x > viewW + 40) continue;
        const schweb = Math.sin(d.funkel * 3) * 4;
        c.save(); c.globalAlpha = nebelDichte * (0.3 + 0.15 * Math.sin(d.funkel * 5)); c.fillStyle = '#7fe6ff'; c.beginPath(); c.arc(x, d.y + schweb, 30, 0, Math.PI * 2); c.fill(); c.restore();
        c.save(); c.globalAlpha = nebelDichte; c.shadowColor = '#7fe6ff'; c.shadowBlur = 18; diamant(c, x, d.y + schweb, 14, '#39c6f0'); c.restore();
      }
    }
    if (tot <= 0) {
      const blink = spieler.unverwundbar > 0 && Math.floor(zeit * 12) % 2 === 0;
      c.globalAlpha = blink ? 0.35 : durchlaessig > 0 ? 0.45 : 1;   // Cameo Zara: Figur halb unsichtbar
      if (schild > 0) { c.save(); c.globalAlpha = 0.35 + 0.1 * Math.sin(zeit * 6); c.strokeStyle = '#2e9e5b'; c.lineWidth = 4; c.beginPath(); c.ellipse(spieler.x - kamera, spieler.y - 44, 34, 52, 0, 0, Math.PI * 2); c.stroke(); c.restore(); }   // Cameo Tessa: Schutzschild
      if (traegtAktiv) falkeZeichnen(c, spieler.x - kamera, spieler.y - 96);   // Cameo Felix: Falke hält die Figur
      const surfend = surft > 0 && spieler.amBoden && rutscht <= 0;
      if (surfend) surfbrett(c, spieler.x - kamera, spieler.y);   // Welt 5: Surfbrett unter der Figur, Figur lehnt sich nach vorn
      if (rutscht > 0 || surfend) { c.save(); c.translate(spieler.x - kamera, spieler.y); c.rotate(surfend ? 0.16 : -0.22 - 0.06 * Math.sin(zeit * 30)); c.translate(-(spieler.x - kamera), -spieler.y); }   // rutscht: Figur kippt leicht nach hinten
      zeichneFigur(c, spieler.x - kamera, spieler.y, 80, skin, spieler.pose, zeit, rutscht > 0 ? 'erstaunt' : surfend ? 'zunge' : ausdruckAktuell());
      if (rutscht > 0 || surfend) c.restore();
      c.globalAlpha = 1;
    }
    effekteZeichnen(c);
    if (wind) windZeichnen(c);
    if (blase && tot <= 0) wortBlase(c);
    if (cameo) cameoZeichnen(c);
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
    c.fillStyle = '#18213a'; c.fillText(story ? `${diaGesammelt} / ${diamanten.length}` : `${gesammelt} / ${max}`, viewW - 102, 24);   // Story: 💎 = Punkte-Diamanten
    if (story) storyHud(c);
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
    W.hudSymbol(c, viewW / 2 + 92, 34);
    effektChips(c);
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
      const tor = torHinweis();
      if (tor) {
        c.font = 'bold 20px system-ui, sans-serif'; c.textAlign = 'center';
        const txt = (tor === eule ? '🦉 ' : '') + texte.tor(tor.de);
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
    if (story) { storyTextZeichnen(c); if (story.station) stationZeichnen(c); }
  }
  // Tor-Hinweis: ab 520 vor dem Tor; mit Cameo Olivia (eule) schon sofort für das nächste Tor
  function torHinweis() {
    const tor = tore.find(t => !t.erledigt && spieler.x > t.x - 520 && spieler.x < t.x + 40);
    return tor || (eule && !eule.erledigt && spieler.x < eule.x + 40 ? eule : null);
  }
  // Cameo-Effekte als kleine Chips unter den Herzen (Symbol + Restzeit als Balken)
  function effektChips(c) {
    const liste = [];
    if (schild > 0) liste.push(['🛡️', schild / 5]);
    if (sprungBonus > 0) liste.push(['🦘', sprungBonus / 5]);
    if (traegt > 0 || traegtAktiv) liste.push(['🦅', traegtAktiv ? 1 : traegt / 5]);
    if (durchlaessig > 0) liste.push(['👻', durchlaessig / 3]);
    if (eisZeit > 0) liste.push(['❄️', eisZeit / 3]);
    if (eule) liste.push(['🦉', 1]);
    liste.forEach(([sym, f], i) => {
      const x = 14 + i * 40, y = 114;   // unter Wortbank (y 54) und Tor-Hinweis (72–106)
      c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.roundRect(x, y, 34, 30, 9); c.fill();
      c.font = '17px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#18213a'; c.fillText(sym, x + 17, y + 14);
      c.fillStyle = '#2e9e5b'; c.fillRect(x + 4, y + 25, 26 * Math.max(0, Math.min(1, f)), 3);
    });
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
    if (film) { filmZeichnen(ctx); ctx.restore(); return; }   // Story: Film am Ende / Story Library
    if (nurFilm) { ctx.fillStyle = '#18213a'; ctx.fillRect(0, 0, viewW, H); ctx.restore(); return; }
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

  /* ---------- Welten: je Welt Kulisse, Boden, Kisten, Gegnerarten, Boss (Zeichner + Klang), Tür, Banner, Level-Muster ---------- */
  const GEGNER_ZEICHNER = { taube, waschbaer, eichhoernchen, kojote, roadrunner, guerteltier, klapperschlange, geier, skorpion, bueffel, biber, adler, moewe, seeloewe, skater, fuchs };
  function bodenNY(c, x0, w, a, b, links, rechts) {
    c.fillStyle = '#b9ad9a'; c.fillRect(x0, BODEN_Y, w, H - BODEN_Y + 200);
    c.fillStyle = '#d9cfbb'; c.fillRect(x0, BODEN_Y, w, 10);
    c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 1;
    for (let x = Math.max(Math.ceil(a / 40) * 40, Math.floor(links / 40) * 40); x < Math.min(b, rechts); x += 40) { c.beginPath(); c.moveTo(x - kamera, BODEN_Y + 10); c.lineTo(x - kamera, H); c.stroke(); }
    c.fillStyle = '#8f8472'; c.fillRect(x0, BODEN_Y + 10, w, 2);
  }
  function kisteNY(c, x, y) {
    c.fillStyle = '#c98a3e'; c.fillRect(x, y, KISTE, KISTE);
    c.strokeStyle = '#7a4a16'; c.lineWidth = 3; c.strokeRect(x + 1.5, y + 1.5, KISTE - 3, KISTE - 3);
    c.beginPath(); c.moveTo(x + 4, y + 4); c.lineTo(x + KISTE - 4, y + KISTE - 4); c.moveTo(x + KISTE - 4, y + 4); c.lineTo(x + 4, y + KISTE - 4); c.stroke();
  }
  const WELTEN = {
    ny: { id: 'ny', name: 'New York', staat: 'New York', ziel: 'Statue of Liberty', bossName: 'Mr. Alligator', bossSymbol: '🐊', banner: BANNER_TEXT, sturz: 'Splash! 💦',
      gegnerarten: ['taube', 'waschbaer', 'eichhoernchen'], farben: { plattform: '#8b5a2b', plattformOben: '#4fae5f', hud: '#1d3f8f' }, muster: MUSTER_NY, sprechblaseHoehe: 70,
      kulisse: hintergrundNY, boden: bodenNY, grube: null, kiste: kisteNY, hudSymbol: (c, x, y) => freiheitsstatue(c, x, y, 0.14, '#1d3f8f'),
      boss: (c, x, y) => { kanaldeckel(c, x, y); alligator(c, x, y); }, tuer: tuerZeichnen, bossKlang: () => klang.grollen() },
    route66: { id: 'route66', name: 'Route 66', staat: 'Illinois', ziel: 'Route 66 sign', bossName: 'Big Rig Bob', bossSymbol: '🚚', banner: 'Here comes Big Rig Bob!', sturz: 'Crash! 🕳️',
      gegnerarten: ['kojote', 'roadrunner', 'guerteltier'], farben: { plattform: '#7a4a16', plattformOben: '#c99a6a', hud: '#c8283a' }, muster: MUSTER_ROUTE66, sprechblaseHoehe: 150,
      kulisse: hintergrundRoute66, boden: strasseZeichnen, grube: baugrube, kiste: reifen, hudSymbol: (c, x, y) => schild66(c, x, y + 4, 0.28, '#c8283a', false),
      boss: bigRigBob, tuer: mautstation, bossKlang: () => { hupen++; klang.hupe(); klang.diesel(); } },
    az: { id: 'az', name: 'Grand Canyon', staat: 'Arizona', ziel: 'Grand Canyon', bossName: 'Sheriff Rattlesnake', bossSymbol: '🐍', banner: 'Watch out – Sheriff Rattlesnake!', sturz: 'Down the canyon! 🏜️',
      gegnerarten: ['klapperschlange', 'geier', 'skorpion'], farben: { plattform: '#8a3b1e', plattformOben: '#d9774a', hud: '#b4452a' }, muster: MUSTER_AZ, sprechblaseHoehe: 230,
      kulisse: hintergrundCanyon, boden: felsboden, grube: schlucht, kiste: felsbrocken, hudSymbol: (c, x, y) => schildCanyon(c, x, y + 14, 0.34, false),
      boss: (c, x, y) => { felsspalt(c, x, y); sheriffRattlesnake(c, x, y); }, tuer: westernTor, bossKlang: () => { rasseln++; klang.rassel(); } },
    sd: { id: 'sd', name: 'Mount Rushmore', staat: 'South Dakota', ziel: 'Mount Rushmore', bossName: 'Grizzly Grandpa', bossSymbol: '🐻', banner: 'Oh no – Grizzly Grandpa is awake!', sturz: 'Splash! 🏞️',
      gegnerarten: ['bueffel', 'biber', 'adler'], farben: { plattform: '#6b4a2e', plattformOben: '#5fa84a', hud: '#2e7d4f' }, muster: MUSTER_SD, sprechblaseHoehe: 200,
      kulisse: hintergrundRushmore, boden: waldboden, grube: bachZeichnen, kiste: holzstapel, stein: trittstein, hudSymbol: (c, x, y) => schildRushmore(c, x, y + 14, 0.34, false),
      boss: (c, x, y) => { baerenhoehleBoss(c, x, y); grizzlyGrandpa(c, x, y); }, tuer: rangerTor, bossKlang: () => { brummt++; klang.brummen(); } },
    ca: { id: 'ca', name: 'Golden Gate', staat: 'California', ziel: 'Golden Gate Bridge', bossName: 'Captain Fog', bossSymbol: '👻', banner: 'Captain Fog is blocking the bridge!', sturz: 'Splash! 🌊',
      gegnerarten: ['moewe', 'seeloewe', 'skater'], farben: { plattform: '#8e3220', plattformOben: '#e8714a', hud: '#c0462b' }, muster: MUSTER_CA, sprechblaseHoehe: 240,
      kulisse: hintergrundGoldenGate, boden: promenade, grube: pazifik, kiste: hafenkiste, hudSymbol: (c, x, y) => goldenGateFern(c, x, y + 12, 0.11),
      boss: (c, x, y) => { nebelbank(c, x, y); captainFog(c, x, y); }, tuer: brueckenTor, bossKlang: () => { tutet++; klang.nebelhorn(); } },
    // Klasse 6 „London Run“ (31.10.): Welt 1 Westminster · Big Ben
    westminster: { id: 'westminster', name: 'Westminster', staat: 'London', ziel: 'Big Ben', bossName: 'Sergeant Bearskin', bossSymbol: '💂', banner: 'Halt! Sergeant Bearskin is on duty!', sturz: 'Splash! 🌊',
      gegnerarten: ['taube', 'fuchs', 'eichhoernchen'], farben: { plattform: '#3b4a5a', plattformOben: UK_ROT, hud: UK_ROT }, muster: MUSTER_WESTMINSTER, musterStory: MUSTER_WESTMINSTER_STORY, sprechblaseHoehe: 220,
      kulisse: hintergrundLondon, boden: bodenLondon, grube: themse, kiste: kisteLondon, hudSymbol: (c, x, y) => bigBen(c, x, y, 0.075, '#1d3f8f'),
      boss: (c, x, y) => { schilderhaus(c, x, y); sergeantBearskin(c, x, y); }, tuer: horseGuardsTor, bossKlang: () => { trommelt++; klang.trommel(); klang.signal(); } },
  };
  const WELT_LISTE = Object.values(WELTEN).map((w) => ({ id: w.id, name: w.name, staat: w.staat, ziel: w.ziel, boss: w.bossName, bossSymbol: w.bossSymbol, banner: w.banner }));

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
    W = WELTEN[opt.welt] || WELTEN.ny;
    storyOpt = opt.story && W.musterStory ? opt.story : null; nurFilm = false; filmAllein = null; film = null;   // Story-Modus nur mit Option story (Klasse 6) und einer Welt mit Story-Strecke
    level = W.id === 'ny' ? LEVEL_NY : levelBauen(storyOpt ? W.musterStory : W.muster);
    SOLIDE = solideOben();
    texte = Object.assign({}, TEXTE, { bossTitel: `${W.bossName} fragt …` }, opt.texte || {});
    // Cameos (nur wenn die App Helden übergibt): Kartenbilder vorab laden; Ladefehler → Kreis mit Initiale
    cameoListe = (Array.isArray(opt.cameos) ? opt.cameos : []).filter((h) => h && h.id).slice(0, 3);
    for (const h of cameoListe) if (h.bild && !cameoBilder[h.id]) { const img = new Image(); img.decoding = "async"; img.src = h.bild; cameoBilder[h.id] = img; }
    canvas = el("canvas", "runner-canvas"); canvas.setAttribute("aria-label", opt.titel || "Road Trip Run");
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
    if (location.protocol === "file:" || /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) window.__runner = haken; // Test-Haken nur lokal, nie auf der Live-Seite (30.10.)
    return { stopp };
  }
  // Story Library: nur den Film eines Endes abspielen (eigene Figur), Runner.film({ wrapper, skin, ende: 'A'|'B', story, stimme: { erzaehler, still }, onEnde({ film, ende, uebersprungen }) })
  function filmAlleinStart(o) {
    stopp();
    opt = o || {}; wrapper = opt.wrapper;
    if (!wrapper) throw new Error("Runner.film: wrapper fehlt");
    skin = Object.assign({}, SKIN_STANDARD, opt.skin || {});
    stimme = Object.assign({ wort() {}, boss() {} }, opt.stimme || {});
    W = WELTEN.westminster; storyOpt = opt.story || null; texte = TEXTE;
    story = { strang: opt.ende === 'B' ? 'B' : 'A', auto: false, gesammelt: [], schlange: [], aktiv: null, pause: 0, gesprochen: 0, station: null, stationen: 0, filmFertig: null };
    canvas = el("canvas", "runner-canvas"); canvas.setAttribute("aria-label", opt.titel || "Story Library");
    ctx = canvas.getContext("2d"); wrapper.append(canvas);
    groesseAnpassen();
    zeit = 0; endeGemeldet = true; nurFilm = true; filmAllein = opt; laeuft = true;
    filmStart(story.strang);
    startZeit = performance.now(); letzte = startZeit; frames = 0; fpsZeit = 0; fps = 0;
    canvas.addEventListener("pointerdown", aufPointerDown); canvas.addEventListener("pointerup", aufPointerUp); canvas.addEventListener("pointercancel", aufPointerUp);
    window.addEventListener("keydown", aufKeyDown); window.addEventListener("keyup", aufKeyUp); window.addEventListener("resize", aufResize);
    rafId = requestAnimationFrame(schleife);
    if (location.protocol === "file:" || /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) window.__runner = haken;
    return { stopp };
  }
  // ✕ der App während des Films: Film überspringen statt Lauf abbrechen (das Ergebnis geht sonst verloren)
  function ueberspringen() { if (zustand === 'film' && film) { film.gesamt = Math.max(film.gesamt, 1); filmEnde(true); return true; } return false; }
  function stopp() {
    if (!laeuft && !canvas) return;
    laeuft = false; zustand = "aus"; film = null; filmAllein = null; nurFilm = false;
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
      if (nurFilm) return { zustand, laeuft, nurFilm: true, fps, viewW };
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
        gegnerKlaenge, gegnerNah: gegner.filter((g) => g.tot <= 0 && !g.harmlos && g.x - spieler.x > -40 && g.x - spieler.x < GEGNER_NAEHE).map((g) => g.art),
        welt: W.id, rutscht: rutscht > 0, hupen, gegner: gegner.map((g) => ({ art: g.art, x: Math.round(g.x), tot: g.tot > 0, rollt: !!g.rollt, harmlos: !!g.harmlos })),
        autos: autos.map((a) => ({ art: a.art, x: Math.round(a.x), w: a.w, h: a.h })), oel: oel.map((o) => ({ x: o.x, w: o.w, aktiv: o.aktiv, art: o.art || 'oel' })),
        rasseln, steine: steine.map((s) => ({ x: s.x, phase: s.phase, y: Math.round(s.y) })), bruecken: bruecken.map((b) => ({ x: b.x, w: b.w, zeit: Math.round(b.zeit * 100) / 100, gebrochen: b.gebrochen })),
        kakteen: kakteen.map((k) => k.x), meldung: meldung ? meldung.text : null,
        staemme: staemme.map((s) => ({ x: s.x, phase: s.phase, rx: Math.round(s.rx) })), hoehlen: hoehlen.map((h) => ({ x: h.x, phase: h.phase })), winde: winde.map((w) => ({ x: w.x, richtung: w.richtung, aktiv: w.aktiv })),
        wind: wind ? { phase: wind.phase, richtung: wind.richtung, t: Math.round(wind.t * 100) / 100 } : null, sprungFaktor: wind && wind.phase === 'schub' ? WIND_SPRUNG : 1, brummt, baeche: level.baeche.map((b) => ({ x: b.x, w: b.w })),
        nebel: level.nebel.map((n) => ({ x: n.x, w: n.w })), nebelDichte: Math.round(nebelDichte * 100) / 100, gondeln: gondeln.map((g) => ({ x: g.x, w: g.w, gx: Math.round(g.gx), vx: Math.round(g.vx), y: GONDEL_Y })), aufGondel,
        surfs: surfs.map((s) => ({ x: s.x, w: s.w, aktiv: s.aktiv })), surft: surft > 0, geklaut, tutet,
        trommelt, kisten: level.kisten.filter((k) => k.art).map((k) => ({ x: k.x, y: k.y, art: k.art })), luecken: level.boden.length - 1,
        cameo: cameo ? { id: cameo.held && cameo.held.id, t: Math.round(cameo.t * 100) / 100, satz: cameo.satz } : null, cameosGezeigt, cameoEffekt,
        cameoPlan: cameoPlan.map((p) => ({ x: p.x, id: p.held && p.held.id, erledigt: p.erledigt })), cameoBilder: Object.values(cameoBilder).filter((i) => i.complete && i.naturalWidth > 0).length,
        effekte: { schild: Math.round(schild * 100) / 100, sprungBonus: Math.round(sprungBonus * 100) / 100, durchlaessig: Math.round(durchlaessig * 100) / 100, eis: Math.round(eisZeit * 100) / 100, traegt: Math.round(traegt * 100) / 100, traegtAktiv, eule: eule ? eule.x : null },
        tore: tore.map((t) => ({ x: t.x, wort: woerter[t.wort].en, erledigt: t.erledigt, steine: t.steine.map((x) => ({ y: x.y, richtig: x.richtig })) })),
        torHinweis: zustand === 'spiel' && torHinweis() ? torHinweis().de : null, vy: Math.round(spieler.vy), diamantenX: diamanten.map((d) => ({ x: Math.round(d.x), weg: d.weg, verpasst: !!d.verpasst })),
      };
    },
    sammle(i) { const d = diamanten[i]; if (d && !d.weg && zustand === "spiel") diamantSammeln(d); },   // Diamant i direkt einsammeln (Test)
    stampfe(i) { const g = gegner[i]; if (g && g.tot <= 0 && zustand === "spiel") gegnerPlatt(g); },                             // Gegner i plattdrücken (Test)
    gegnerKlang,
    teleport(x, y) { tot = 0; spieler.unverwundbar = 0; spieler.x = x; spieler.y = y == null ? BODEN_Y : y; spieler.vy = 0; spieler.amBoden = y == null; kamera = Math.max(0, Math.min(x - viewW * 0.33, level.ende - viewW)); },   // y optional (Test: in der Luft absetzen)
    teleportBoss() { this.teleport(level.sequenzX - 250); },
    antwort(n) { antwortGeben(n); },
    schaden() { schaden("gegner"); },
    steinLoesen(i) { const s = steine[i]; if (s) { s.phase = 'warnung'; s.t = 0; } },   // Test: Stein i sofort ankündigen (fällt nach 0,6 s)
    windLoesen(richtung = -1) { if (zustand === 'spiel') wind = { phase: 'warnung', t: 0, richtung }; },   // Test: Windböe sofort ankündigen (Schub nach 0,5 s)
    setLeben(n) { leben = Math.max(1, Math.min(3, Number(n) || 3)); },   // Test: Leben zurücksetzen, damit Teilprüfungen nicht am Game over scheitern
    setSkin(o) { Object.assign(skin, o); },
    cameo(id) { if (zustand !== 'spiel') return false; const h = cameoListe.find((x) => x.id === id) || (id ? { id, name: id } : cameoListe[0]); if (!h) return false; cameo = null; cameoStart(h); return true; },   // Test: Cameo sofort auslösen
    sprechListe, get level() { return level; }, SEQUENZ, BANNER_TEXT, get welt() { return W.id; },
    // Story-Modus (Tests): Zustand, Sprung zur Gabelung, Kristall i einsammeln, Station weiter, Film starten/überspringen
    story() {
      if (!story) return null;
      const a = story.aktiv, st = story.station;
      return {
        strang: story.strang, auto: story.auto, gesammelt: story.gesammelt.slice(), anzahl: story.gesammelt.length, warteschlange: story.schlange.slice(), gesprochen: story.gesprochen,
        aktiv: a ? { key: a.key, text: a.text, t: Math.round(a.t * 100) / 100, dauer: Math.round(a.dauer * 100) / 100, sichtbar: a.tipp > 0 ? Math.min(a.text.length, Math.floor(a.t * TIPP_TEMPO)) : a.text.length } : null,
        station: st ? { nr: st.nr, t: Math.round(st.t * 100) / 100, keys: st.keys.slice(), zeilen: st.keys.map((k) => story.gesammelt.includes(k) ? storyText(k) : '…'), gelesen: st.gelesen } : null, stationen: story.stationen,
        film: film ? { ende: film.ende, szene: film.szene, t: Math.round(film.t * 100) / 100, text: film.text } : null, filmFertig: story.filmFertig,
        kristalle: kristalle.map((k) => ({ nr: k.nr, strang: k.strang, key: kristallKey(k), x: k.x, y: k.y, weg: k.weg, sichtbar: kristallSichtbar(k) })),
        diamanten: diaGesammelt, diamantenMax: diamanten ? diamanten.length : 0, parkbusse: level.parkbusse.map((b) => b.x),
      };
    },
    gabelung(dx = 300) { const g = kristalle.filter((k) => k.nr === 5); if (g.length) this.teleport(Math.min(...g.map((k) => k.x)) - dx); },
    kristall(i) { const k = kristalle[i]; if (story && k && kristallSichtbar(k) && zustand === 'spiel') { kristallSammeln(k, false); return true; } return false; },
    stationWeiter() { if (story && story.station) { story.station.t = Math.max(story.station.t, STATION_SPERRE); stationEnde(true); } },
    filmStart(ende) { if (story) filmStart(ende || story.strang || 'A'); },
    filmSkip() { return ueberspringen(); },
  };

  window.Runner = { start, stopp, film: filmAlleinStart, ueberspringen, zeichneFigur, figurHoehe, powerAnwenden, sprechText, sprechListe, skinFrei, skinArtikel, skinPreis, SKIN_PREIS, kurzDe, SKIN_GRUPPEN, SKIN_STANDARD, FARBEN, HAARFARBEN, level: LEVEL_NY, SEQUENZ, BANNER_TEXT, WELTEN: WELT_LISTE };
})();
