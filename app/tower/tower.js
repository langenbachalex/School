/* The Keys of the Tower – Kapitel 1 „It's gone!“ (Probe). Schritt 2: Spielgerüst.
   Figur wählen → Anfang vor der Tür → Mr. Flex im Spiegel → erste Tür (Schlüssel) → Guard Room zum Antippen
   → Taube am Fenster (Hören, fünf Fragen) → Zettel hinter der Uhr → Arthur auf der Treppe (Ortskarte) → Schluss-Film.
   Daten: tower/daten.js (werkzeuge/tower_bauen.py) · Raum: tower/raum/ (werkzeuge/blender/guardroom.py) · Ton: audio/tower/k1_<id>.mp3
   Regeln (docs/spiele/keys-of-the-tower-01.md): gesprochene Zeilen sperren nie, das Spiel speichert nach jedem Schritt von selbst,
   nichts verlässt das Gerät. Aufruf aus app.js: Tower.start(element, { zurueck, schluessel, zumGym }) · Tower.aus() · Tower.stand(). */
(function () {
  "use strict";
  const D = window.TOWER_DATEN;
  const SPEICHER = "tower-k1";
  const Z = {};
  D.zeilen.forEach((z) => { Z[z.id] = z; });
  const WER = {
    erzaehler: ["📖", "Narrator"], sergeant: ["💂", "Sergeant Bearskin"], gary: ["🦊", "Gary the Great"], mrflex: ["🧙", "Mr. Flex"],
    taube: ["🕊️", "The pigeon"], arthur: ["🐦‍⬛", "Arthur"], karte: ["🃏", "Card"],
  };
  const FIGUREN = [["Ruby", "👧🏻"], ["Daisy", "👧🏽"], ["Poppy", "👧🏿"], ["Alfie", "👦🏻"], ["Freddie", "👦🏽"], ["Harry", "👦🏿"]];
  const folge = (muster) => D.zeilen.filter((z) => muster.test(z.id)).map((z) => z.id);
  const ANFANG = folge(/^a\d/), SPIEGEL = folge(/^m\d/);
  // Raum: je Gegenstand die Zeilen in der Reihenfolge der Tipps (erster Tipp = Erzähler, zweiter = Reaktion)
  const RAUM = {};
  D.zeilen.forEach((z) => { if (/^b\d/.test(z.id) && z.d) (RAUM[z.d] = RAUM[z.d] || []).push(z.id); });
  const ZU_FINDEN = Object.keys(RAUM).filter((d) => d !== "truhe"); // die 14 Dinge; die Truhe gehört dem Kind

  let st = null, opt = {}, wurzel = null, lauf = 0, ton = null, spricht = false, wartend = null, zeile = null, einfachAn = false, t0 = 0;
  let textFeld = null, buehne = null;

  /* ---------- Stand (nur auf diesem Gerät) ---------- */
  const leer = () => ({ v: 1, schritt: "figur", figur: 0, name: "", pos: 0, tipps: {}, laterne: false, feder: false, schluessel: false, zeit: 0,
    taube: 0, frage: 0, zettel: false, arthur: false, gary: 0, tipp: {}, ende: false, log: { feder: 0, sorry: 0, tipps: 0, falsch: 0 } });
  function laden() {
    try { const s = JSON.parse(localStorage.getItem(SPEICHER)); if (s && s.v === 1) return Object.assign(leer(), s); } catch (e) { /* kaputter Stand: neu anfangen */ }
    return leer();
  }
  function speichern() {
    if (!st) return;
    if (t0) { st.zeit += Date.now() - t0; t0 = Date.now(); }
    try { localStorage.setItem(SPEICHER, JSON.stringify(st)); } catch (e) { /* Speicher voll oder gesperrt: weiterspielen */ }
  }
  const gefunden = () => ZU_FINDEN.filter((d) => st.tipps[d]).length;

  /* ---------- kleine Helfer ---------- */
  function el(tag, attrs, ...kinder) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") e.className = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) e.setAttribute(k, v === true ? "" : v);
    }
    for (const k of kinder.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(k));
    return e;
  }
  const warte = (ms) => new Promise((ok) => setTimeout(ok, window.__towerSchnell ? 5 : ms));

  /* ---------- Ton: eine Zeile nach der anderen; Antippen unterbricht nie, die neue Zeile wartet ---------- */
  function dateien(z, einfach) {
    if (einfach && z.te) return [`audio/tower/k1_${z.id}_einfach.mp3`];
    if (z.t === 1) return [`audio/tower/k1_${z.id}.mp3`];
    return Array.from({ length: z.t }, (_, i) => `audio/tower/k1_${z.id}_${i + 1}.mp3`);
  }
  function spiele(datei, nr) {
    return new Promise((fertig) => {
      if (nr !== lauf) return fertig();
      if (window.__towerSchnell) return setTimeout(fertig, 5); // Testprogramm: ohne Ton, sofort weiter
      const a = new Audio(datei);
      ton = a;
      a.onended = a.onerror = () => fertig();
      a.play().catch(() => fertig());
    });
  }
  async function sag(id, einfach) {
    const z = Z[id], nr = lauf;
    if (!z || nr !== lauf) return;
    zeile = z; einfachAn = !!einfach;
    zeigeText();
    if (z.t === 0) await warte(900 + z.en.length * 45);
    else for (const d of dateien(z, einfach)) await spiele(d, nr);
    if (nr === lauf) await warte(250);
  }
  // Reihe von Zeilen sprechen; läuft schon eine, wartet die neue (höchstens eine wartet)
  function sprich(ids, danach) {
    if (spricht) { wartend = [ids, danach]; return; }
    spricht = true;
    const nr = lauf;
    (async () => { for (const id of ids) { if (nr !== lauf) return; await sag(id); } })().then(() => {
      if (nr !== lauf) return;
      spricht = false;
      if (danach) danach();
      if (wartend) { const [i, d] = wartend; wartend = null; sprich(i, d); }
    });
  }
  function still() { lauf++; if (ton) { ton.pause(); ton = null; } spricht = false; wartend = null; }

  /* ---------- Textfeld unten: wer spricht, Englisch, Feder (Deutsch), „Sorry?“ (noch einmal, einfacher) ---------- */
  function zeigeText(deutsch) {
    if (!textFeld || !zeile) return;
    const [bild, name] = WER[zeile.s] || ["", ""];
    const en = einfachAn && zeile.ef ? zeile.ef : zeile.en;
    textFeld.hidden = false;
    textFeld.replaceChildren(
      el("span", { class: "wer", "aria-hidden": "true" }, bild),
      el("div", { class: "was" }, el("div", { class: "name" }, name), el("div", { class: "en", lang: "en" }, en), deutsch && el("div", { class: "de", lang: "de" }, zeile.de)),
      el("div", { class: "hilfen" },
        st.feder && el("button", { class: "tower-hilfe", type: "button", "aria-label": "Feder: Deutsch zeigen", onclick: (e) => { e.stopPropagation(); st.log.feder++; speichern(); zeigeText(true); } }, "🪶"),
        el("button", { class: "tower-hilfe", type: "button", lang: "en", onclick: (e) => { e.stopPropagation(); st.log.sorry++; speichern(); const z = zeile; sprich([], () => sag(z.id, true)); } }, "Sorry?")));
  }

  /* ---------- Rahmen ---------- */
  function rahmen(...inhalt) {
    textFeld = el("div", { class: "tower-text", hidden: true, "aria-live": "polite" });
    buehne = el("div", { class: "tower-buehne" }, inhalt, textFeld);
    const zaehler = el("span", { class: "tower-zaehler" }, st.schritt === "raum" ? `🔎 ${gefunden()}/${ZU_FINDEN.length}` : "");
    wurzel.replaceChildren(el("section", { class: "tower" },
      el("header", { class: "tower-kopf" },
        el("button", { class: "knopf leise", type: "button", onclick: () => { aus(); if (opt.zurueck) opt.zurueck(); } }, "← Zurück"),
        el("h1", { lang: "en" }, "🗝️ The Keys of the Tower"), zaehler),
      el("p", { class: "tower-quer" }, "Dreh dein Gerät quer – dann siehst du den ganzen Raum."),
      buehne));
    return zaehler;
  }
  const szene = (...inhalt) => el("div", { class: "tower-szene" }, inhalt);
  function weiter(schritt) { st.schritt = schritt; st.pos = 0; speichern(); zeigeSchritt(); }
  function zeigeSchritt() { still(); zeile = null; ({ figur, intro, spiegel, tuer, raum, film, ende })[st.schritt](); }

  /* ---------- 1. Deine Figur ---------- */
  function figur() {
    const name = el("input", { class: "tower-name", type: "text", maxlength: "14", "aria-label": "Name deiner Figur", value: st.name || FIGUREN[st.figur][0] });
    const knoepfe = FIGUREN.map(([n, bild], i) => el("button", { class: "tower-figur", type: "button", "aria-pressed": String(i === st.figur), "aria-label": n,
      onclick: () => { const alt = FIGUREN[st.figur][0]; st.figur = i; if (!name.value.trim() || name.value === alt) name.value = n; knoepfe.forEach((k, j) => k.setAttribute("aria-pressed", String(j === i))); } },
      el("span", { class: "bild", "aria-hidden": "true" }, bild), n));
    rahmen(szene(
      el("h2", { lang: "en" }, "Who are you, detective?"),
      el("p", {}, "Wähl deine Figur und gib ihr einen Namen."),
      el("div", { class: "tower-figuren" }, knoepfe), name,
      el("button", { class: "tower-gross", type: "button", lang: "en", onclick: () => { st.name = name.value.trim().slice(0, 14) || FIGUREN[st.figur][0]; weiter("intro"); } }, "Start ▶")));
  }

  /* ---------- 2. Vor der Tür und 3. der Spiegel: Zeilen der Reihe nach, mit großem Gesicht ---------- */
  async function reihe(ids, kopf, ende) {
    const gesicht = el("div", { class: "tower-gesicht", "aria-hidden": "true" }, "🏰");
    const mitte = el("div", {});
    rahmen(szene(el("h2", { lang: "en" }, kopf), gesicht, mitte));
    const nr = lauf;
    for (let i = st.pos; i < ids.length; i++) {
      const z = Z[ids[i]];
      if (nr !== lauf) return;
      st.pos = i; speichern();
      if (z.s === "bild") { // Auftrag auf dem Bildschirm
        textFeld.hidden = true; gesicht.textContent = "🗝️";
        mitte.replaceChildren(el("p", { class: "tower-auftrag", lang: "en" }, z.en));
        continue;
      }
      if (z.t === 0) continue; // „he shouts.“ – nur für die Lesefassung
      gesicht.textContent = (WER[z.s] || ["🏰"])[0];
      await sag(z.id);
      if (z.id === "a18") { st.feder = true; speichern(); zeigeText(); } // die Feder: ab jetzt gibt es Deutsch
    }
    if (nr !== lauf) return;
    mitte.append(el("p", {}, el("button", { class: "tower-gross", type: "button", lang: "en", onclick: ende }, "Go on ▶")));
  }
  const intro = () => reihe(ANFANG, "Tower of London, 9:15 pm", () => weiter("spiegel"));
  const spiegel = () => reihe(SPIEGEL, "The mirror on the wall lights up …", () => weiter("tuer"));

  /* ---------- 4. Die erste Tür: echt – der Schlüssel kostet eine Runde Word Gym heute ---------- */
  function tuer() {
    if (!st.schluessel && opt.schluessel && opt.schluessel()) { st.schluessel = true; speichern(); }
    if (!st.schluessel) {
      rahmen(szene(el("div", { class: "tower-gesicht", "aria-hidden": "true" }, "🚪"),
        el("h2", { lang: "en" }, "The Guard Room is locked."),
        el("p", {}, "Der Schlüssel kostet eine Runde Word Gym heute. Dann bringt ihn dir ein Rabe."),
        opt.zumGym && el("button", { class: "tower-gross", type: "button", onclick: () => { aus(); opt.zumGym(); } }, "💪 Zum Word Gym")));
      return;
    }
    const gesicht = el("div", { class: "tower-gesicht", "aria-hidden": "true" }, "🐦‍⬛"), mitte = el("div", {});
    rahmen(szene(el("h2", { lang: "en" }, "A raven has a key for you."), gesicht, mitte));
    gesicht.textContent = "🦊";
    sprich(["t1"], () => {
      mitte.replaceChildren(el("button", { class: "tower-gross", type: "button", lang: "en", onclick: () => { mitte.replaceChildren(); gesicht.textContent = "🚪"; sprich(["t2"], () => weiter("raum")); } }, "🗝️ Unlock the door"));
    });
  }

  /* ---------- 5. Der Guard Room: ein Bild mit Tipp-Flächen (jeder Gegenstand hat in guardroom_ids.png eine Farbe) ----------
     Ablauf: Dinge antippen (erster Tipp Erzähler, zweiter Reaktion) · Fenster zum zweiten Mal = die Taube erzählt, Gary stellt fünf Fragen
     · danach Uhr = Zettel · danach Treppe = Arthur fragt nach dem Ort (Karte „behind the clock“) · Schluss-Film. */
  const FRAGEN = [["q1a", "q1b", 0, "p3"], ["q2a", "q2b", 1, "p3"], ["q3a", "q3b", 2, "p4"], ["q4a", "q4b", 1, "p5"], ["q5a", "q5b", 0, "p6"]]; // Frage, Lob, richtige Karte, Satz der Taube noch einmal
  const ANTWORTEN = ["qa1", "qa2", "qa3"];
  const ORTE = ["k02", "k04", "k06", "k01", "k07", "k09"]; // Karten für Arthurs Frage; richtig: k06 behind the clock
  function raum() {
    const R = D.raum, TOL = R.toleranz || 12;
    const ding = (id) => R.dinge.find((d) => d.id === id);
    const bild = el("img", { class: "tower-bild", src: "tower/raum/" + R.bild, alt: "The Guard Room", draggable: "false" });
    const leuchten = el("canvas", { class: "tower-leuchten" });
    const tk = ding("kleine_tuer");
    const ecke = el("div", { class: "tower-ecke" + (st.laterne ? " hell" : "") });
    if (tk) Object.assign(ecke.style, { left: (tk.box[0] - 0.03) * 100 + "%", top: (tk.box[1] - 0.04) * 100 + "%", width: (tk.box[2] - tk.box[0] + 0.06) * 100 + "%", height: (tk.box[3] - tk.box[1] + 0.08) * 100 + "%" });
    const figuren = el("div", { class: "tower-ebene" });
    const tafel = el("div", { class: "tower-tafel", hidden: true });
    const tipp = el("button", { class: "tower-hilfe tower-tipp", type: "button", "aria-label": "Tipp von Mr. Flex" }, "🧙 Tip");
    const zaehler = rahmen(bild, ecke, leuchten, figuren, tafel);
    wurzel.querySelector(".tower-kopf").append(tipp); // Tipp-Knopf in der Kopfzeile: im Bild würde er das Fenster verdecken
    buehne.classList.add("raum"); // Textfeld oben an der Decke: unten liegen Dinge zum Antippen (Krümel)
    let pixel = null, breit = 0, hoch = 0, lichtAus = 0;

    // Figuren vor dem Raum (vorerst als Zeichen): Taube am Fenster, Arthur auf der Treppe (nach dem Zettel, bis er verschwindet), Gary
    const steht = (zeichen, x, y, name) => el("span", { class: "tower-steht", "aria-label": name, style: `left:${x * 100}%;top:${y * 100}%` }, zeichen);
    function marke() {
      const f = ding("fenster"), t = ding("treppe");
      figuren.replaceChildren(
        f && steht("🕊️", (f.box[0] + f.box[2]) / 2, f.box[3] - 0.07, "pigeon"),
        t && st.zettel && !st.arthur && steht("🐦‍⬛", t.mitte[0], t.box[1] + 0.02, "Arthur"),
        steht("🦊", 0.60, 0.80, "Gary"));
      Object.assign(buehne.dataset, { taube: st.taube, zettel: st.zettel ? "1" : "", arthur: st.arthur ? "1" : "" });
      zaehler.textContent = `🔎 ${gefunden()}/${ZU_FINDEN.length}`;
    }
    marke();

    const karte = new Image();
    karte.onload = () => {
      breit = leuchten.width = karte.naturalWidth; hoch = leuchten.height = karte.naturalHeight;
      const c = document.createElement("canvas");
      c.width = breit; c.height = hoch;
      const k = c.getContext("2d", { willReadFrequently: true });
      k.drawImage(karte, 0, 0);
      pixel = k.getImageData(0, 0, breit, hoch).data;
      buehne.dataset.bereit = "1";
    };
    karte.src = "tower/raum/" + R.flaechen;
    const dingBei = (e) => {
      if (!pixel) return null;
      const r = buehne.getBoundingClientRect();
      const x = Math.floor((e.clientX - r.left) / r.width * breit), y = Math.floor((e.clientY - r.top) / r.height * hoch);
      if (x < 0 || y < 0 || x >= breit || y >= hoch) return null;
      const i = (y * breit + x) * 4;
      const d = R.dinge.find((g) => Math.abs(pixel[i] - g.farbe[0]) <= TOL && Math.abs(pixel[i + 1] - g.farbe[1]) <= TOL && Math.abs(pixel[i + 2] - g.farbe[2]) <= TOL);
      return d && !(d.id === "kleine_tuer" && !st.laterne) ? d : null; // die kleine Tür sieht man erst mit Laterne
    };
    const leuchte = (d) => {
      const k = leuchten.getContext("2d"), b = k.createImageData(breit, hoch);
      for (let i = 0; i < pixel.length; i += 4) {
        if (Math.abs(pixel[i] - d.farbe[0]) <= TOL && Math.abs(pixel[i + 1] - d.farbe[1]) <= TOL && Math.abs(pixel[i + 2] - d.farbe[2]) <= TOL) { b.data[i] = 255; b.data[i + 1] = 214; b.data[i + 2] = 110; b.data[i + 3] = 150; }
      }
      k.putImageData(b, 0, 0);
      leuchten.classList.add("an");
      clearTimeout(lichtAus);
      lichtAus = setTimeout(() => leuchten.classList.remove("an"), 1400);
    };

    // Tafel mit Karten: Antwortkarten für Garys Fragen und Ortskarten für Arthur
    function karten(kopf, ids, wahl) {
      tafel.hidden = false;
      tafel.replaceChildren(el("div", { class: "tower-tafel-kopf", lang: "en" }, kopf),
        el("div", { class: "tower-karten" }, ids.map((id, i) => el("button", { class: "tower-karte", type: "button", lang: "en", onclick: (e) => { e.stopPropagation(); tafel.hidden = true; wahl(id, i); } }, Z[id].en))));
    }
    // Die Taube hat geredet – Gary glaubt ihr nicht: fünf Aussagen, drei Antwortkarten. Falsch: die Taube sagt den Satz noch einmal.
    function frage() {
      const f = FRAGEN[st.frage];
      if (!f) return;
      sprich([f[0]], () => karten(Z[f[0]].en, ANTWORTEN, (id, i) => {
        if (i !== f[2]) { st.log.falsch++; speichern(); return sprich([f[3]], frage); }
        st.frage++; speichern();
        sprich([f[1]], () => { if (st.frage >= FRAGEN.length) { st.taube = 2; speichern(); marke(); } else frage(); });
      }));
    }
    // Hinter der Uhr: der Zettel wird gezeigt und vorgelesen
    function zettel() {
      const blatt = el("div", { class: "tower-zettel", lang: "en" }, Z.e2.en);
      sprich(["e1"], () => buehne.append(blatt));
      sprich(["e2", "e3a", "e3c", "e4"], () => { blatt.remove(); st.zettel = true; speichern(); marke(); });
    }
    // Arthur auf der Treppe: Wo war der Zettel? Antwort mit einer Ortskarte.
    function arthur() {
      const fragen = () => karten(Z.r4.en, ORTE, (id) => {
        if (id !== "k06") { st.log.falsch++; speichern(); return sprich([id === "k02" ? "r4x" : "r4y"], fragen); }
        st.arthur = true; speichern();
        sprich(["r5a", "r5c", "r6", "r7"], marke);          // … then he is gone
        sprich(["r8a", "r8c"], () => weiter("film"));
      });
      sprich(["r1", "r2a", "r2c", "r3a", "r3b", "r3c", "r4"], fragen);
    }
    // Tipp-Leitern von Mr. Flex: je drei Stufen, passend zu dem, was gerade dran ist
    tipp.addEventListener("click", (e) => {
      e.stopPropagation();
      const leiter = st.taube === 0 ? "g1" : !st.zettel ? "g2" : !st.arthur ? "g3" : null;
      if (!leiter) return;
      const stufe = Math.min(3, (st.tipp[leiter] || 0) + 1);
      st.tipp[leiter] = stufe; st.log.tipps++; speichern();
      sprich([`${leiter}_${stufe}`]);
    });

    buehne.addEventListener("pointermove", (e) => buehne.classList.toggle("zeiger", !!dingBei(e)));
    buehne.addEventListener("click", (e) => {
      if (e.target.closest(".tower-text, .tower-tafel, .tower-tipp")) return;
      const d = dingBei(e);
      if (!d) return;
      leuchte(d);
      buehne.dataset.zuletzt = d.id;
      const n = st.tipps[d.id] || 0;
      if (d.id === "treppe") {
        if (st.arthur) weiter("film"); else if (st.zettel) arthur();
        return; // vor dem Zettel leuchtet die Treppe nur
      }
      if (d.id === "fenster" && n >= 1) {
        st.tipps.fenster = n + 1;
        if (st.taube === 0) { st.taube = 1; speichern(); marke(); sprich(["p1", "p2", "p3", "p4", "p5", "p6", "p7", "q0"], frage); }
        else if (st.taube === 1) frage();
        else sprich(["p5", "p6"]);
        return;
      }
      if (d.id === "uhr" && st.taube >= 1 && !st.zettel) { st.tipps.uhr = n + 1; speichern(); return zettel(); }
      const zeilen = RAUM[d.id];
      if (!zeilen) return;
      const erster = gefunden() === 0 && d.id !== "truhe";
      st.tipps[d.id] = n + 1;
      const id = zeilen[n % zeilen.length], ids = [id];
      if (erster) ids.push("h1"); // erster Fund fliegt in die Truhe – Mr. Flex sagt es
      const g = gefunden(); // Gary redet dazwischen, wann er will
      if (g >= 3 && st.gary < 1) { st.gary = 1; ids.push("f1"); }
      else if (g >= 6 && st.gary < 2) { st.gary = 2; ids.push("f2", "f3"); }
      else if (g >= 9 && st.gary < 3 && st.taube === 0) { st.gary = 3; ids.push("f4"); }
      sprich(ids, () => { if (id === "b05b" && !st.laterne) { st.laterne = true; ecke.classList.add("hell"); speichern(); } });
      marke();
      speichern();
    });
  }

  /* ---------- 6. Schluss-Film: die Uhr, dann die dunkle Treppe – und der Haken ---------- */
  async function film() {
    const R = D.raum, uhr = R.dinge.find((d) => d.id === "uhr"), treppe = R.dinge.find((d) => d.id === "treppe");
    const bild = el("img", { class: "tower-bild tower-fahrt", src: "tower/raum/" + R.bild, alt: "" });
    const dunkel = el("div", { class: "tower-dunkel" });
    rahmen(bild, dunkel);
    buehne.classList.add("raum");
    const nr = lauf;
    const fahre = (d, zoom) => { bild.style.transformOrigin = `${d.mitte[0] * 100}% ${d.mitte[1] * 100}%`; bild.style.transform = `scale(${zoom})`; };
    await warte(60);
    fahre(uhr, 3.2);
    await sag("s1");
    if (nr !== lauf) return;
    fahre(treppe, 2.4); dunkel.classList.add("an");
    for (const id of ["s2", "s3", "s4a", "s4c"]) { if (nr !== lauf) return; await sag(id); }
    if (nr !== lauf) return;
    st.ende = true;
    weiter("ende");
  }
  function ende() {
    const mitte = el("div", {});
    rahmen(szene(el("h2", { lang: "en" }, "To be continued …"), el("div", { class: "tower-gesicht", "aria-hidden": "true" }, "🧙"),
      el("p", { class: "tower-auftrag", lang: "en" }, "Chapter 2: The Kitchen"), mitte));
    buehne.classList.add("ende");
    sprich(["s5"], () => mitte.append(el("button", { class: "tower-gross", type: "button", lang: "en", onclick: () => weiter("raum") }, "Back to the Guard Room")));
  }

  /* ---------- Schnittstelle für app.js ---------- */
  function start(element, o) {
    wurzel = element; opt = o || {};
    st = laden();
    t0 = Date.now();
    zeigeSchritt();
  }
  function aus() { if (!st) return; still(); speichern(); t0 = 0; textFeld = buehne = null; }
  function stand() {
    const s = st || laden();
    if (s.schritt === "figur" && !s.name) return "Chapter 1 · neu";
    if (s.ende) return "Chapter 1 · ✓ geschafft";
    if (s.schritt !== "raum" && s.schritt !== "film") return "Chapter 1 · vor der Tür";
    return `Chapter 1 · 🔎 ${ZU_FINDEN.filter((d) => s.tipps[d]).length}/${ZU_FINDEN.length}`;
  }
  // Bis zur Freigabe durch Mr. Alex: Kachel nur auf Geräten, die die App einmal mit „?tower“ am Ende der Adresse geöffnet haben.
  // Gleich beim Laden geprüft, bevor app.js die Adresse aufräumt.
  let frei = false;
  try {
    if (/[?&]tower/.test(location.search)) localStorage.setItem("tower-an", "1");
    frei = localStorage.getItem("tower-an") === "1";
  } catch (e) { /* kein Speicher: Kachel bleibt aus */ }
  window.Tower = { start, aus, stand, an: () => frei };
})();
