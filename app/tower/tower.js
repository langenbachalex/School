/* The Keys of the Tower – Kapitel 1 „It's gone!“ (Probe). Schritt 2: Spielgerüst.
   Figur wählen → Anfang vor der Tür → Mr. Flex im Spiegel → erste Tür (Schlüssel) → Guard Room zum Antippen.
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
  const leer = () => ({ v: 1, schritt: "figur", figur: 0, name: "", pos: 0, tipps: {}, laterne: false, feder: false, schluessel: false, zeit: 0, log: { feder: 0, sorry: 0 } });
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
  function zeigeSchritt() { still(); zeile = null; ({ figur, intro, spiegel, tuer, raum })[st.schritt](); }

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

  /* ---------- 5. Der Guard Room: ein Bild mit Tipp-Flächen (jeder Gegenstand hat in guardroom_ids.png eine Farbe) ---------- */
  function raum() {
    const R = D.raum, TOL = R.toleranz || 12;
    const bild = el("img", { class: "tower-bild", src: "tower/raum/" + R.bild, alt: "The Guard Room", draggable: "false" });
    const leuchten = el("canvas", { class: "tower-leuchten" });
    const tk = R.dinge.find((d) => d.id === "kleine_tuer");
    const ecke = el("div", { class: "tower-ecke" + (st.laterne ? " hell" : "") });
    if (tk) Object.assign(ecke.style, { left: (tk.box[0] - 0.03) * 100 + "%", top: (tk.box[1] - 0.04) * 100 + "%", width: (tk.box[2] - tk.box[0] + 0.06) * 100 + "%", height: (tk.box[3] - tk.box[1] + 0.08) * 100 + "%" });
    const zaehler = rahmen(bild, ecke, leuchten);
    buehne.classList.add("raum"); // Textfeld oben an der Decke: unten liegen Dinge zum Antippen (Krümel)
    let pixel = null, breit = 0, hoch = 0, lichtAus = 0;
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
    buehne.addEventListener("pointermove", (e) => buehne.classList.toggle("zeiger", !!dingBei(e)));
    buehne.addEventListener("click", (e) => {
      if (e.target.closest(".tower-text")) return;
      const d = dingBei(e);
      if (!d) return;
      leuchte(d);
      const zeilen = RAUM[d.id];
      if (!zeilen) return; // Treppe, Taube am Fenster: kommen in Schritt 3
      const n = st.tipps[d.id] || 0, erster = gefunden() === 0 && d.id !== "truhe";
      st.tipps[d.id] = n + 1;
      buehne.dataset.zuletzt = d.id;
      const id = zeilen[n % zeilen.length];
      const ids = erster ? [id, "h1"] : [id]; // erster Fund fliegt in die Truhe – Mr. Flex sagt es
      sprich(ids, () => { if (id === "b05b" && !st.laterne) { st.laterne = true; ecke.classList.add("hell"); speichern(); } });
      zaehler.textContent = `🔎 ${gefunden()}/${ZU_FINDEN.length}`;
      speichern();
    });
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
    if (s.schritt !== "raum") return "Chapter 1 · vor der Tür";
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
