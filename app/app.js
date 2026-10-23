/* English Power Game
   Kein Konto, keine Namen. Fortschritt und Fragen bleiben nur auf diesem Gerät (localStorage).
   Grundsatz: Wird eine Lösung gezeigt, wird sie auch abgespielt. */
(function () {
  "use strict";

  const D = window.DATEN;
  const app = document.getElementById("app");
  const SPEICHER = "auffrischen-v1";

  // Lob und Rückmeldungen – gesprochen von Mr. Alex (inhalte/lob.tsv).
  // Arten: lob, fehler, spiel (nur Station Spiele), geschafft, voll (alles richtig), doch (nach mehreren Fehlern geschafft)
  const RUF = D.lob || {};
  // Gegen Wiederholung: derselbe Spruch erst nach 10 anderen derselben Art, und kein Schlüsselwort
  // (gruppe in inhalte/lob.tsv, z. B. „right“) aus den letzten 3 Sprüchen. Reicht die Liste nicht, wird gelockert.
  const verlauf = [];
  function waehleRuf(art) {
    const liste = RUF[art] || [];
    if (!liste.length) return null;
    const gleicheArt = verlauf.filter((v) => v.art === art).slice(-10).map((v) => v.r);
    const nahGruppen = new Set(verlauf.slice(-3).flatMap((v) => v.r.gruppe || []));
    const frisch = (r) => !gleicheArt.includes(r);
    const andereGruppe = (r) => !(r.gruppe || []).some((g) => nahGruppen.has(g));
    const pool = [liste.filter((r) => frisch(r) && andereGruppe(r)), liste.filter(frisch),
      liste.filter((r) => r !== (verlauf[verlauf.length - 1] || {}).r), liste].find((p) => p.length);
    const r = pool[Math.floor(Math.random() * pool.length)];
    verlauf.push({ art, r }); if (verlauf.length > 40) verlauf.shift();
    return r;
  }
  let vorLob = null, fehlerSerie = 0, richtigSerie = 0, letzterRuf = null;
  function ruf(art) {
    const r = waehleRuf(art);
    letzterRuf = r || null;
    if (!r) return "";
    // Das Audio wird vor das nächste spiele() gesetzt; folgt keins, spielt es allein.
    // Steht ein großes Pop-up mit eigener Stimme an (Titel, Superheld, Serie), spricht nur dieses: kein Lob davor.
    if (ereignisse.some(grossEreignis)) return r.text;
    vorLob = r.audio;
    setTimeout(() => { if (vorLob === r.audio) { vorLob = null; spiele([r.audio]); } }, 0);
    return r.text;
  }
  function lob(stark) {
    // Kurze Sprüche für normale Antworten; starke für jede 5. richtige Antwort in Folge und fertige Teile (stark = true)
    richtigSerie++;
    const art = fehlerSerie >= 2 && RUF.doch ? "doch" : (stark || richtigSerie % 5 === 0) && RUF.stark ? "stark" : "lob";
    fehlerSerie = 0;
    return ruf(art);
  }

  const STUFEN = {
    1: "Hören wir zu. Sprich nach! Das Deutsche kannst du antippen.",
    2: "Jetzt siehst du Englisch und Deutsch. Hör zu und sprich nach!",
    3: "Lies den deutschen Satz. Sag ihn auf Englisch! Dann tipp auf „Lösung“.",
    4: "Jetzt bist du der Profi: Sag den ganzen Satz auf Englisch! Dann tipp auf „Lösung“.",
  };
  const MITTEL_NAME = { bus: "Bus", car: "Auto", bike: "Fahrrad", train: "Zug", walk: "zu Fuß" };
  const GEFUEHL = [["gut", "😊", "gut"], ["schlecht", "😟", "nicht gut"], ["beides", "😊😟", "beides"]];

  /* ---------- Speicher (nur lokal) ---------- */
  function laden() {
    try { return Object.assign({ erledigt: [], fragen: [] }, JSON.parse(localStorage.getItem(SPEICHER) || "{}")); }
    catch (e) { return { erledigt: [], fragen: [] }; }
  }
  function speichern() {
    try { localStorage.setItem(SPEICHER, JSON.stringify(stand)); } catch (e) { /* ohne Speicher geht es trotzdem */ }
  }
  const stand = laden();

  // Sprechtempo: 1,0 · 0,7 (Knopf oben, wird auf dem Gerät gemerkt); gilt für alle Aufnahmen und die Geräte-Stimme
  const TEMPI = [1, 0.7];
  const tempo = () => (TEMPI.includes(stand.tempo) ? stand.tempo : 1);
  const tempoText = (t) => String(t).replace(".", ",").replace(/^1$/, "1,0");
  function tempoKnopf() {
    const k = document.getElementById("tempo");
    if (!k) return;
    const zeige_ = () => { k.textContent = (tempo() < 1 ? "🐢 " : "🔊 ") + tempoText(tempo()) + "×"; k.setAttribute("aria-label", "Sprechtempo " + tempoText(tempo())); };
    k.addEventListener("click", () => {
      stand.tempo = TEMPI[(TEMPI.indexOf(tempo()) + 1) % TEMPI.length]; speichern(); zeige_();
      if (aktuell) { aktuell.playbackRate = tempo(); aktuell.preservesPitch = true; } // läuft gerade etwas, wird es sofort langsamer
    });
    zeige_();
  }
  /* ---------- Audio ---------- */
  let lauf = 0, aktuell = null;
  function stopp() {
    lauf++;
    if (aktuell) { aktuell.pause(); aktuell = null; }
    if (window.speechSynthesis) speechSynthesis.cancel();
  }
  // Notlösung: Sprachausgabe des Geräts, solange eine Audiodatei fehlt
  const FRAU = /hazel|libby|sonia|susan|kate|serena|female|frau|katja|hedda|anna|vicki|petra/i;
  function geraeteStimme(lang, stimme) {
    const alle = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
    const passend = alle.filter((v) => v.lang.replace("_", "-").startsWith(lang));
    const kandidaten = passend.length ? passend : alle.filter((v) => v.lang.startsWith(lang.slice(0, 2)));
    return kandidaten.find((v) => (stimme === "f") === FRAU.test(v.name)) || kandidaten[0] || null;
  }
  function sprich(eintrag) {
    return new Promise((fertig) => {
      if (!window.speechSynthesis) return fertig(0);
      const u = new SpeechSynthesisUtterance(eintrag.tts);
      u.lang = eintrag.lang;
      u.rate = 0.9 * tempo();
      const v = geraeteStimme(eintrag.lang, eintrag.stimme);
      if (v) u.voice = v;
      const start = Date.now();
      let erledigt = false;
      const ende = () => { if (erledigt) return; erledigt = true; clearTimeout(notbremse); setTimeout(() => fertig((Date.now() - start) / 1000), 350); };
      // Manche Browser melden das Ende nie: spätestens nach geschätzter Sprechdauer weiter
      const notbremse = setTimeout(ende, 2500 + eintrag.tts.split(/\s+/).length * 700);
      u.onend = ende;
      u.onerror = ende;
      speechSynthesis.speak(u);
    });
  }
  // Ende der zuletzt gestarteten Wiedergabe. spiele(…, { warten: true }) reiht sich dahinter ein, statt die laufende abzuschneiden
  // (für Belohnungs-Stimmen: Lob, Schlusssatz, Pop-up). Seitenwechsel oder „Weiter“ im Pop-up (stopp) bricht auch wartende ab.
  let audioEnde = Promise.resolve();
  function spiele(dateien, opt = {}) {
    if (vorLob) { dateien = [vorLob, ...dateien]; vorLob = null; }
    if (!opt.warten) stopp();
    const meinLauf = lauf;
    let gesamt = 0;
    const davor = opt.warten ? audioEnde : Promise.resolve();
    const lauf_ = davor.then(() => dateien.filter(Boolean).reduce((kette, datei) => kette.then(() => new Promise((fertig) => {
      if (meinLauf !== lauf) return fertig();
      if (typeof datei === "object") return sprich(datei).then((d) => { gesamt += d; fertig(); });
      const a = new Audio(datei);
      aktuell = a;
      a.playbackRate = tempo(); a.preservesPitch = true; // langsamer, ohne dass die Stimme tiefer klingt
      a.onended = () => { gesamt += (a.duration || 0) / (a.playbackRate || 1); setTimeout(fertig, 350); }; // Sprechzeit passt sich an
      a.onerror = fertig;
      a.play().catch(fertig);
    })), Promise.resolve()));
    audioEnde = lauf_.catch(() => {});
    return lauf_.then(() => (meinLauf === lauf ? gesamt : null));
  }

  /* ---------- Hilfen ---------- */
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
  function zeige(...inhalt) { stopp(); app.replaceChildren(...inhalt.filter(Boolean)); window.scrollTo(0, 0); }
  function mischen(liste) {
    const a = liste.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const station = (nr) => D.stationen.find((s) => s.nr === nr);
  const knopf = (text, fn, art) => el("button", { class: "knopf" + (art ? " " + art : ""), onclick: fn }, text);

  /* ---------- Sprechzeit: „Weiter“ erst nach Hören + Nachsprechen, „Lösung“ erst nach Denkzeit ----------
     Der gesperrte Knopf füllt sich sichtbar. Schon freigegebene Sätze (Teil:Position) bleiben frei,
     z. B. nach „Zurück“ oder beim Umschalten. */
  const freiSchluessel = () => lage.teil + ":" + lage.pos;
  function sperre(k) {
    if (!lage.frei) lage.frei = new Set();
    if (lage.frei.has(freiSchluessel())) return k;
    k.disabled = true; k.classList.add("wartet");
    return k;
  }
  function gibFrei(k, sek, merken = true) {
    if (!k.disabled || k.dataset.frei) return;
    k.dataset.frei = "1";
    k.style.setProperty("--warte", sek.toFixed(1) + "s");
    k.classList.add("laeuft");
    const menge = lage.frei, schluessel = freiSchluessel();
    setTimeout(() => { k.disabled = false; k.classList.remove("wartet", "laeuft"); if (merken && menge) menge.add(schluessel); }, sek * 1000);
  }
  const sprechDauer = (d, min = 3) => Math.max(min, d * 1.4 + 1);
  const denkzeit = (text) => Math.min(8, Math.max(3, 2 + String(text).split(/\s+/).length * 0.35));
  const wennFrei = (k, fn) => () => { if (!k.disabled) fn(); };

  /* ---------- Eintippen (optional, ⌨-Knopf oben): Antworten tippen statt auswählen ----------
     0 Fehler = richtig · 1 Fehler = gilt auch als richtig, die richtige Schreibweise wird gezeigt ·
     mehr als 1 Fehler = „OK“ mit der richtigen Schreibweise (ohne Lob). Sehr kurze Wörter (bis 2 Buchstaben) müssen genau stimmen. */
  const tippen = () => !!stand.tippen;
  const normT = (t) => String(t).toLowerCase().replace(/[’`´]/g, "'").replace(/[.,!?;:"“”]/g, "").replace(/\s+/g, " ").trim();
  function abstand(a, b) { // Damerau-Levenshtein: Vertauschen zweier Buchstaben zählt als 1 Fehler
    const d = Array.from({ length: a.length + 1 }, (_, i) => { const z = new Array(b.length + 1).fill(0); z[0] = i; return z; });
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[a.length][b.length];
  }
  function pruefeTipp(eingabe, ziele) { // 0 genau · 1 ein Fehler · 2 mehr
    const e = normT(eingabe); let best = 9;
    for (const z of [].concat(ziele)) {
      const zz = normT(z);
      best = Math.min(best, zz.length <= 2 ? (e === zz ? 0 : 9) : abstand(e, zz));
    }
    return best > 1 ? 2 : best;
  }
  function tippFeld(pruefen) {
    const feld = el("input", { type: "text", class: "eingabe", lang: "en", autocomplete: "off", autocapitalize: "off", autocorrect: "off",
      spellcheck: "false", "aria-label": "Deine Antwort", enterkeyhint: "done",
      onkeydown: (e) => { if (e.key === "Enter") { e.stopPropagation(); e.preventDefault(); los(); } } });
    const knopf_ = knopf("Prüfen", () => los(), "haupt");
    const los = () => { if (feld.value.trim()) pruefen(feld.value, { feld, knopf: knopf_ }); };
    return el("div", { class: "eingabe-bereich" }, el("div", { class: "knopfreihe" }, feld, knopf_));
  }
  // Rückmeldung zum Tippen: Stufe 0/1 mit Lob (bei 1 Fehler zusätzlich die richtige Schreibweise), Stufe 2 neutral
  function tippRueckmeldung(box, stufe, richtig) {
    box.hidden = false;
    if (stufe === 2) { box.className = "rueckmeldung hilfe"; box.textContent = `OK. So schreibt man es: ${richtig}`; return; }
    box.className = "rueckmeldung gut";
    box.textContent = lob() + (stufe === 1 ? ` So schreibt man es genau: ${richtig}` : "");
  }
  // Beispielsatz zu einem Wort: Kernsatz oder Word-Gym-Satz. Bei Kernsätzen ist die Lücke das Wort der Karte.
  function gymSatzFuer(v) {
    if (!v.gymsatz) return null;
    const s = D.saetze[v.gymsatz];
    return v.gymsatz.startsWith("gym_") ? s : { ...s, luecke: v.luecke };
  }
  // Prüfung C: Sprechteile, die viel schneller fertig sind als möglich, bringen keine Punkte
  function zuSchnell(teil) {
    const proEintrag = SPRECH_MIN[teil.art];
    if (!proEintrag || !lage.start) return false;
    return (Date.now() - lage.start) / 1000 < laenge(teil) * proEintrag;
  }
  const SPRECH_MIN = { lr: 2, vok_lernen: 1.5, vok_luecke: 2 }; // Sekunden pro Satz/Wort mindestens

  /* ---------- Startseite ---------- */
  // Countdown in Wochen bis zum nächsten Termin (D.termin, in daten_bauen.py): zählt Kalenderwochen, Montag bis Sonntag
  function terminZeile() {
    const t = D.termin;
    if (!t) return null;
    const ziel = new Date(t.datum + "T12:00:00"), jetzt = heute();
    const wochen = Math.round((montag(ziel) - montag(jetzt)) / (7 * 86400000));
    const tage = Math.round((ziel - new Date(iso(jetzt) + "T12:00:00")) / 86400000);
    if (tage < 0) return null;
    const text = tage === 0 ? `Heute ist ${t.name} – viel Erfolg!`
      : wochen === 0 ? `Diese Woche ist ${t.name}.`
      : wochen === 1 ? `Nächste Woche ist ${t.name}.`
      : `Noch ${wochen} Wochen bis ${t.name}`;
    return el("p", { class: "termin", role: "status" }, "📅 " + text);
  }

  function startseite() {
    lage = null;
    const alleFertig = D.stationen.every((s) => stand.erledigt.includes(s.nr));
    zeige(
      el("header", { class: "gruss" },
        el("h1", {}, "English Power Game"),
        el("p", { class: "klein" }, "Hallo! Wähl eine Station. Wenn du fertig bist, bekommt sie ein Häkchen."),
        statusleiste(), terminZeile()),
      gymKarte(),
      alleFertig && el("section", { class: "geschafft" },
        el("h2", {}, "Wahnsinn, du hast alles geschafft!"),
        el("p", {}, "Wenn etwas unklar ist, frag mich am Mittwoch – ich helfe dir gern. Dein Mr. Alex")),
      el("nav", { class: "kacheln", "aria-label": "Stationen" },
        D.stationen.map((s) => {
          const fertig = stand.erledigt.includes(s.nr);
          return el("button", { class: "kachel" + (fertig ? " erledigt" : ""), onclick: () => starteStation(s.nr),
            "aria-label": `Station ${s.nr}: ${s.titel}${fertig ? " (geschafft)" : ""}` },
            el("span", { class: "sym", "aria-hidden": "true" }, s.symbol),
            el("span", { class: "nr" }, "Station " + s.nr),
            el("span", { class: "titel" }, s.titel),
            fertig && el("span", { class: "haken", "aria-hidden": "true" }, "✓"));
        })),
      el("div", { class: "knopfreihe" }, knopf("✏️ Frage für meinen Lehrer", fragenOeffnen))
    );
  }

  /* ---------- Station ---------- */
  // Teile einer Station: ein Listen-and-Repeat-Schritt wird zu vier Teilen (Stufe 1–4).
  function teileVon(st) {
    const t = [];
    st.schritte.forEach((s) => {
      if (s.art === "lr") (s.stufen || [1, 2, 3, 4]).forEach((stufe) =>
        t.push({ art: "lr", stufe, saetze: s.saetze, basis: s.name || "", name: (s.name ? s.name + " · " : "") + "Stufe " + stufe }));
      else t.push(s);
    });
    return t;
  }

  let lage = null; // { nr, gruppe?, teile, teil, pos (Position im Teil), reihe, runden, detektiv, vq, abspielen, weiter }

  function neueLage(werte) {
    lage = Object.assign({ teil: 0, pos: 0 }, werte);
    return lage;
  }
  // Übungszustand eines Teils (Reihenfolge, Runden …) – wird bei jedem Betreten eines Teils neu gemischt.
  function teilZuruecksetzen() { lage.reihe = lage.runden = lage.detektiv = lage.vq = null; }

  /* ---------- Fortschritt pro Teil (gespeichert) ---------- */
  function teilSchluessel(i) { return `${lage.nr}|${lage.gruppe != null ? lage.gruppe : ""}|${i}`; }
  function istFertig(i) { return !!(stand.teile && stand.teile[teilSchluessel(i)]); }
  function teilFertig(i) {
    stand.teile = stand.teile || {};
    stand.teile[teilSchluessel(i)] = true;
    speichern();
  }
  const alleTeileFertig = () => lage.teile.every((_, i) => istFertig(i));

  /* ---------- Springen, Vor und Zurück ---------- */
  function springe(i) {
    lage.teil = i; lage.pos = 0; lage.ende = false; teilZuruecksetzen();
    zeigeTeil();
  }
  // Zurück: im Teil einen Schritt zurück; am Anfang ans Ende des vorigen Teils
  // (Übungsteile beginnen dabei immer von vorne).
  function zurueck() {
    if (lage.pos > 0) { lage.pos--; return zeigeTeil(); }
    if (lage.teil === 0) return;
    lage.teil--; teilZuruecksetzen();
    const t = lage.teile[lage.teil];
    lage.pos = ["lr", "vok_lernen", "vok_luecke", "vok_bild"].includes(t.art) ? laenge(t) - 1 : 0;
    zeigeTeil();
  }
  // „◀ Zurück“ neben den Weiter-Knopf der Seite setzen (oder unten anfügen, falls der noch versteckt ist)
  function navErgaenzen(zurueckFn) {
    if (!lage) return;
    const z = knopf("◀ Zurück", zurueckFn || zurueck);
    z.classList.add("zurueck-knopf");
    if (!zurueckFn && lage.teil === 0 && lage.pos === 0) z.disabled = true;
    const w = [...app.querySelectorAll("button")].find((b) => /^Weiter/.test(b.textContent));
    if (w && !w.closest("[hidden]")) w.before(z);
    else app.append(el("div", { class: "knopfreihe navleiste" }, z));
    const jetzt = app.querySelector(".sprung.jetzt");
    if (jetzt && jetzt.scrollIntoView) jetzt.scrollIntoView({ block: "nearest", inline: "center" });
  }

  function starteStation(nr) {
    const st = station(nr);
    if (st.gruppen) return zeigeGruppen(st);
    const t = teileVon(st);
    if (!t.length) return platzhalter(st);
    neueLage({ nr, teile: t });
    zeigeTeil();
  }

  function kopf(st) {
    return el("header", { class: "kopf" },
      lage && lage.gruppe != null ? knopf(st.gruppen[0].vokabeln ? "← Abschnitte" : "← Themen", () => zeigeGruppen(st), "leise") : knopf("← Start", startseite, "leise"),
      el("h1", {}, `Station ${st.nr}: ${st.titel}` + (lage && lage.gruppe != null ? ` · ${st.gruppen[lage.gruppe].name}` : "")),
      lage && sprungleiste());
  }

  // Alle Teile oben direkt anklickbar; Stufen eines Listen-and-Repeat-Teils kompakt: „Teil A ① ② ③ ④“
  function sprungleiste() {
    const nochNichts = !lage.teile.some((_, i) => istFertig(i));
    const ZIFFERN = ["①", "②", "③", "④", "⑤"];
    const sprung = (i, text) => {
      const t = lage.teile[i], fertig = istFertig(i), jetzt = i === lage.teil && !lage.ende;
      const start = nochNichts && i === 0;
      return el("button", { class: "sprung" + (jetzt ? " jetzt" : "") + (fertig ? " fertig" : "") + (start ? " start" : ""),
        "aria-current": jetzt ? "step" : false, title: t.name,
        "aria-label": `${t.name}${fertig ? " (geschafft)" : ""}${start ? " – hier starten" : ""}`,
        onclick: () => springe(i) }, text);
    };
    const eintraege = [];
    for (let i = 0; i < lage.teile.length;) {
      const t = lage.teile[i];
      if (t.art === "lr") {
        const gruppe = el("li", { class: "sprung-gruppe" }, el("span", { class: "sprung-label" }, t.basis || "Stufe"));
        while (i < lage.teile.length && lage.teile[i].art === "lr" && lage.teile[i].saetze === t.saetze) {
          gruppe.append(sprung(i, ZIFFERN[lage.teile[i].stufe - 1] || String(lage.teile[i].stufe)));
          i++;
        }
        eintraege.push(gruppe);
      } else {
        eintraege.push(el("li", {}, sprung(i, t.name)));
        i++;
      }
    }
    return el("ol", { class: "schritte", "aria-label": "Teile – direkt anspringen" }, eintraege);
  }

  function platzhalter(st) {
    lage = null;
    zeige(kopf(st), el("section", { class: "platzhalter" },
      el("p", { class: "ansage" }, "Diese Station baue ich gerade noch für dich. Schau bald wieder rein!"),
      knopf("Zur Startseite", startseite, "haupt")));
  }

  function zeigeTeil() {
    lage.abspielen = null; lage.weiter = null;
    if (lage.startTeil !== lage.teil) { lage.startTeil = lage.teil; lage.start = Date.now(); }
    const teil = lage.teile[lage.teil];
    ({ lr: zeigeSatz, erklaerung: zeigeErklaerung, verbform: zeigeVerbform, hoeren: zeigeHoeren,
       vok_lernen: zeigeVokabel, vok_luecke: zeigeVokabel, vok_bild: zeigeVokabel, vok_abfrage: zeigeVokabel,
       auswahl: zeigeAuswahl, reihenfolge: zeigeReihenfolge, lesen: zeigeLesen, hoerwahl: zeigeHoerwahl,
       memory: zeigeMemory, detektiv: zeigeDetektiv })[teil.art](teil);
    navErgaenzen();
  }

  function naechstes() {
    const teil = lage.teile[lage.teil];
    if (lage.pos + 1 < laenge(teil)) { lage.pos++; return zeigeTeil(); }
    if (zuSchnell(teil)) return zuSchnellSeite();
    const erstesMal = !istFertig(lage.teil);
    teilFertig(lage.teil);
    belohne(erstesMal);
    if (alleTeileFertig()) return stationGeschafft();
    if (lage.teil + 1 < lage.teile.length) return zwischenstand();
    fastGeschafft();
  }

  // Prüfung C: zu schnell durchgeklickt – kein Lob, keine Punkte, Teil noch mal
  function zuSchnellSeite() {
    const st = station(lage.nr);
    const nochmal = () => { lage.frei = null; lage.startTeil = null; springe(lage.teil); };
    lage.abspielen = null; lage.weiter = nochmal;
    zeige(kopf(st), el("section", { class: "geschafft" },
      el("h2", {}, "⏱️ Zu schnell!"),
      el("p", { class: "ansage" }, "Sprich die Sätze wirklich mit. Dann gibt es auch Punkte. Versuch es noch mal!"),
      knopf("Noch mal ➜", nochmal, "haupt")));
  }

  // Letzter Teil fertig, aber vorher wurde etwas übersprungen
  function fastGeschafft() {
    const st = station(lage.nr);
    lage.ende = true; lage.abspielen = null; lage.weiter = null;
    const offen = lage.teile.map((t, i) => [t, i]).filter(([, i]) => !istFertig(i));
    zeige(kopf(st), el("section", { class: "geschafft" },
      el("h2", { lang: "en" }, lob(true)),
      el("p", { class: "ansage" }, "Fast geschafft! Diese Teile fehlen noch:"),
      el("div", { class: "knopfreihe" }, offen.map(([t, i]) => knopf(t.name, () => { lage.ende = false; springe(i); }))),
      knopf("Zur Startseite", startseite)));
  }
  function laenge(teil) {
    if (teil.art === "lr") return teil.saetze.length;
    if (teil.art === "verbform" || teil.art === "auswahl") return teil.aufgaben.length;
    if (teil.art === "hoerwahl") return lage.runden ? lage.runden.length : teil.paare.length * 2;
    if (teil.art === "detektiv") return teil.runden;
    if (teil.art === "vok_abfrage") return lage.vq ? lage.vq.length : lage.vok.length; // wächst bei „Nochmal üben“
    if (teil.art === "vok_lernen") return lage.vok.length;
    if (teil.art === "vok_luecke") return lage.vok.filter((v) => v.gymsatz).length;
    if (teil.art === "vok_bild") return lage.vok.filter((v) => v.bild).length;
    return 1;
  }

  function zwischenstand() {
    const st = station(lage.nr);
    const fertig = lage.teile[lage.teil];
    lage.abspielen = null;
    lage.weiter = () => { lage.teil++; lage.pos = 0; teilZuruecksetzen(); zeigeTeil(); };
    zeige(kopf(st), el("section", { class: "geschafft" },
      el("h2", {}, lob(true)),
      el("p", {}, `${fertig.name} geschafft!`),
      knopf("Weiter ➜", lage.weiter, "haupt")));
    navErgaenzen(() => zeigeTeil());
  }

  /* Station mit Abschnitten (Vokabeln): erst Abschnitt wählen, jeder Abschnitt bekommt ein eigenes Häkchen */
  function zeigeGruppen(st) {
    lage = null;
    const fertig = (stand.gruppen && stand.gruppen[st.nr]) || [];
    zeige(kopf(st),
      el("p", { class: "ansage" }, st.gruppen[0].vokabeln ? "Wähl einen Abschnitt. Die Wörter kommen in derselben Reihenfolge wie im Buch."
        : "Wähl ein Thema. Hier lernen wir Neues: erst die Erklärung, dann üben."),
      el("nav", { class: "kacheln gruppen", "aria-label": "Abschnitte" }, st.gruppen.map((g, i) => {
        const ok = fertig.includes(g.name);
        return el("button", { class: "kachel" + (ok ? " erledigt" : ""), onclick: () => starteGruppe(st, i),
          "aria-label": `${g.name}${g.vokabeln ? `, ${g.vokabeln.length} Wörter` : ""}${ok ? " (geschafft)" : ""}` },
          el("span", { class: "nr" }, g.vokabeln ? `${g.vokabeln.length} Wörter` : `Thema ${i + 1}`),
          el("span", { class: "titel" }, g.name),
          el("span", { class: "vorschau", "aria-hidden": "true" },
            g.symbol || g.vokabeln.slice(0, 5).map((id) => D.vokabeln.find((v) => v.id === id).symbol).join(" ")),
          ok && el("span", { class: "haken", "aria-hidden": "true" }, "✓"));
      })));
  }

  function starteGruppe(st, i) {
    const g = st.gruppen[i];
    if (g.schritte) { // Thema mit eigenen Schritten (Neu)
      neueLage({ nr: st.nr, gruppe: i, teile: teileVon(g) });
      return zeigeTeil();
    }
    const vok = g.vokabeln.map((id) => D.vokabeln.find((v) => v.id === id));
    const t = st.schritte.filter((s) => (s.art !== "vok_luecke" || vok.some((v) => v.gymsatz)) && (s.art !== "vok_bild" || vok.filter((v) => v.bild).length >= 2));
    neueLage({ nr: st.nr, gruppe: i, vok, teile: t });
    zeigeTeil();
  }

  function gruppeGeschafft() {
    const st = station(lage.nr), g = st.gruppen[lage.gruppe];
    stand.gruppen = stand.gruppen || {};
    const liste = (stand.gruppen[st.nr] = stand.gruppen[st.nr] || []);
    if (!liste.includes(g.name)) { liste.push(g.name); einheitBonus(); }
    const alle = st.gruppen.every((x) => liste.includes(x.name));
    if (alle && !stand.erledigt.includes(st.nr)) stand.erledigt.push(st.nr);
    speichern();
    lage = null;
    zeige(kopf(st), el("section", { class: "geschafft" },
      el("h2", {}, `${g.name} geschafft!`),
      el("p", { class: "ansage" }, alle ? `Station ${st.nr} geschafft! Du bist ein Superstar ${st.lob}!` : ""),
      el("p", { class: "ansage", lang: "en" }, alle ? ruf("geschafft") : lob(true)),
      el("div", { class: "knopfreihe" },
        knopf("Weitere Abschnitte", () => zeigeGruppen(st), "haupt"), knopf("Zur Startseite", startseite))));
  }

  function stationGeschafft() {
    if (lage.gruppe != null) return gruppeGeschafft();
    const st = station(lage.nr);
    if (!stand.erledigt.includes(st.nr)) { stand.erledigt.push(st.nr); speichern(); einheitBonus(); }
    lage = null;
    zeige(kopf(st), el("section", { class: "geschafft" },
      el("h2", {}, `Station ${st.nr} geschafft!`),
      el("p", { class: "ansage" }, `Du bist ein Superstar ${st.lob}!`),
      el("p", { class: "ansage", lang: "en" }, ruf("geschafft")),
      knopf("Zur Startseite", startseite, "haupt")));
  }

  // Gemeinsamer Rahmen für eine Aufgabe/Karte
  function karte(teil, zaehlerText, ...inhalt) {
    return el("section", { class: "satzkarte" }, zaehlerText && el("p", { class: "zaehler" }, zaehlerText), ...inhalt);
  }
  function rueckmeldung() { return el("div", { class: "rueckmeldung", hidden: true, role: "status" }); }
  function melde(box, art, text) {
    if (art === "hilfe") { // nach einem Fehler: kurze Ermutigung (in den Spielen humorvoll), dann „Ich helfe dir“
      fehlerSerie++; richtigSerie = 0;
      text = `${ruf(lage && lage.nr === 5 && RUF.spiel ? "spiel" : "fehler")} ${text}`;
    }
    box.hidden = false; box.className = "rueckmeldung " + art; box.textContent = text;
  }

  /* ---------- Listen and Repeat (Stufe 1–4, auch mit Satzpaaren) ---------- */
  function zeigeSatz(teil) {
    const st = station(lage.nr);
    const eintrag = teil.saetze[lage.pos];
    const ss = (Array.isArray(eintrag) ? eintrag : [eintrag]).map((id) => D.saetze[id]);
    const stufe = teil.stufe;
    let geloest = false;
    const symbol = (ss.find((s) => s.symbol) || {}).symbol;
    const hinweis = ss.map((s) => s.hinweis).find(Boolean);

    const jetztdu = el("div", { class: "jetztdu", hidden: true, role: "status" },
      "Jetzt du! Sprich nach.", el("span", { class: "balken", "aria-hidden": "true" }));

    const enBlock = (mitLuecke) => el("div", { class: "spalte", lang: "en" },
      el("span", { class: "sprache" }, "Englisch"),
      symbol && el("span", { class: /[○●]/.test(symbol) ? "symbol punkte-zeile" : "symbol", "aria-hidden": "true" }, symbol),
      ss.map((s) => el("p", { class: "satz" }, lueckenSatz(s, mitLuecke))));
    const deBlock = () => el("div", { class: "spalte", lang: "de" },
      el("span", { class: "sprache" }, "Deutsch"),
      ss.map((s) => el("p", { class: "satz de" }, s.de)));

    let links, rechts;
    if (stufe === 1) {
      links = enBlock(false);
      rechts = el("div", { class: "spalte" }, el("span", { class: "sprache" }, "Deutsch"),
        el("button", { class: "aufdecken", onclick: () => { const d = deBlock(); rechts.replaceWith(d); rechts = d; } },
          "Deutsch zeigen"));
    } else if (stufe === 2) {
      links = enBlock(false); rechts = deBlock();
    } else if (stufe === 3) {
      links = deBlock(); rechts = enBlock(true);
    } else {
      links = deBlock();
      rechts = el("div", { class: "spalte" }, el("span", { class: "sprache" }, "Englisch"),
        el("p", { class: "profi" }, "Sag den ganzen Satz auf Englisch!"));
    }

    const loesung = stufe >= 3 ? sperre(knopf("Lösung", loesen)) : null;
    const weiter = sperre(knopf("Weiter ➜", naechstes, "haupt"));
    if (loesung) gibFrei(loesung, denkzeit(ss.map((s) => s.en).join(" ")), false);

    zeige(kopf(st),
      el("p", { class: "ansage" }, STUFEN[stufe]),
      karte(teil, `Satz ${lage.pos + 1} von ${teil.saetze.length}`,
        hinweis && el("p", { class: "hinweis" }, hinweis),
        el("div", { class: "spalten" }, links, rechts),
        jetztdu,
        el("div", { class: "knopfreihe" }, knopf("🔊 Nochmal", abspielen), loesung, weiter)));

    function englisch() {
      jetztdu.hidden = true;
      spiele(ss.map((s) => s.audio.en)).then((d) => {
        if (d === null) return;
        jetztdu.hidden = false;
        jetztdu.classList.remove("laeuft");
        void jetztdu.offsetWidth;
        jetztdu.style.setProperty("--dauer", sprechDauer(d).toFixed(1) + "s");
        jetztdu.classList.add("laeuft");
        gibFrei(weiter, sprechDauer(d));
      });
    }
    function abspielen() {
      if (stufe >= 3 && !geloest) { jetztdu.hidden = true; } // Deutsch wird nur angezeigt, nicht gesprochen
      else englisch();
    }
    function loesen() {
      geloest = true;
      const neu = enBlock(false);
      rechts.replaceWith(neu); rechts = neu;
      loesung.disabled = true;
      englisch();
    }
    lage.abspielen = abspielen;
    lage.weiter = wennFrei(weiter, naechstes);
    abspielen();
  }

  function lueckenSatz(s, mitLuecke) {
    if (!s.luecke) return s.en;
    const i = s.en.indexOf(s.luecke);
    if (i < 0) return s.en;
    return [s.en.slice(0, i), mitLuecke
      ? el("span", { class: "luecke", "aria-label": "Lücke" }, s.luecke.replace(/./g, "_"))
      : el("strong", { class: "ziel" }, s.luecke), s.en.slice(i + s.luecke.length)];
  }

  /* ---------- Erklärung ---------- */
  function zeigeErklaerung(teil) {
    const st = station(lage.nr);
    const bloecke = teil.bloecke.map((b) => {
      if (b.typ === "text") return el("p", { class: "ansage" }, b.text);
      if (b.typ === "merksatz") return el("div", { class: "merksatz" },
        el("span", { class: "sprache" }, "Merksatz"),
        el("p", {}, b.text),
        b.dateien && b.dateien.length && knopf("🔊 Anhören", () => spiele(b.dateien)));
      if (b.typ === "regeln") return el("ul", { class: "regeln" },
        b.punkte.map(([regel, beispiel]) => el("li", {}, el("strong", {}, regel), " ", el("span", { lang: "en" }, beispiel))));
      if (b.typ === "tabelle") return el("div", { class: "tabelle-rahmen" }, el("table", { class: "tabelle" },
        el("tbody", {}, b.zeilen.map(([wer, rest, id], i) => {
          const s = D.saetze[id];
          return el("tr", { class: i === b.markiert ? "markiert" : "" },
            el("th", { scope: "row", lang: "en" }, wer),
            el("td", { lang: "en" }, i === b.markiert ? verbMitS(rest) : rest),
            el("td", { class: "de" }, s.de),
            el("td", {}, el("button", { class: "knopf leise klein-knopf", "aria-label": "Anhören: " + s.en,
              onclick: () => spiele([s.audio.en]) }, "🔊")));
        }))));
      return null;
    });
    lage.weiter = naechstes;
    zeige(kopf(st), karte(teil, null, bloecke, el("div", { class: "knopfreihe" }, knopf("Weiter ➜", naechstes, "haupt"))));
  }

  // "walks to school." -> walk + hervorgehobenes s + " to school."
  function verbMitS(text) {
    const m = text.match(/^(\w+?)(e?s)( .*)$/);
    return m ? [m[1], el("strong", { class: "s" }, m[2]), m[3]] : text;
  }

  /* ---------- Übung: richtige Verbform wählen ---------- */
  function zeigeVerbform(teil) {
    const st = station(lage.nr);
    if (!lage.reihe) lage.reihe = mischen(teil.aufgaben);
    const a = lage.reihe[lage.pos];
    const s = D.saetze[a.satz];
    let geloest = false;
    const satz = el("p", { class: "satz", lang: "en" }, lueckenSatz(s, true));
    const box = rueckmeldung();
    const weiter = knopf("Weiter ➜", naechstes, "haupt");
    weiter.disabled = true;
    const wahl = el("div", { class: "wahl", role: "group", "aria-label": "Verbform wählen" },
      mischen([a.richtig, ...a.falsch]).map((form) => el("button", { class: "knopf wahl-knopf", lang: "en", onclick: (e) => {
        if (geloest) return;
        if (form === a.richtig) {
          geloest = true;
          e.currentTarget.classList.add("richtig");
          satz.replaceChildren(...[].concat(lueckenSatz(s, false)));
          melde(box, "gut", lob());
          weiter.disabled = false;
          lage.weiter = naechstes;
          spiele([s.audio.en]);
        } else {
          e.currentTarget.disabled = true;
          melde(box, "hilfe", `Ich helfe dir: ${a.hilfe} Probier's nochmal!`);
        }
      } }, form)));
    lage.abspielen = () => { if (geloest) spiele([s.audio.en]); };
    zeige(kopf(st),
      el("p", { class: "ansage" }, "Welche Form passt? Tipp auf das richtige Verb!"),
      karte(teil, `Aufgabe ${lage.pos + 1} von ${lage.reihe.length}`,
        el("p", { class: "satz de", lang: "de" }, s.de),
        satz, wahl, box,
        el("div", { class: "knopfreihe" }, knopf("🔊 Anhören", () => lage.abspielen()), weiter)));
    lage.abspielen();
  }

  /* ---------- Hörverstehen ----------
     Grundprinzip: 1. Überschrift und alle Aufgaben lesen, 2. hören und dabei markieren,
     3. zwei komplette Durchgänge, erst danach gibt es die Lösung (mit Audio). */
  const GLN_HINWEIS = "Achtung: Im GLN gibt es nur zwei Hörversuche. Zum Üben darfst du gerne öfter hören.";
  function zeigeHoeren(teil) {
    const st = station(lage.nr);
    const u = teil.uebung;
    const tf = u.art === "true-false";
    const antworten = u.aufgaben.map(() => (tf ? null : { mittel: null, gefuehl: null }));
    let durchgaenge = 0, geloest = false;

    // Eine Auswahlgruppe (Umschalter, jederzeit änderbar bis zur Lösung)
    function umschalter(optionen, setze, label, gross) {
      const knoepfe = optionen.map(([wert, inhalt, name]) => el("button", {
        class: "knopf wahl-knopf" + (gross ? " gross" : ""), "aria-pressed": "false", "aria-label": name || null,
        "data-wert": wert, onclick: () => {
          if (geloest) return;
          setze(wert);
          knoepfe.forEach((k) => k.setAttribute("aria-pressed", String(k.dataset.wert === wert)));
        } }, inhalt));
      return el("div", { class: "wahl", role: "group", "aria-label": label }, knoepfe);
    }

    const zeilen = u.aufgaben.map((a, i) => {
      if (tf) return el("li", { class: "hv-zeile" },
        el("p", { class: "hv-aussage", lang: "en" }, el("span", { class: "hv-nr" }, i + 1 + ". "), a.aussage),
        umschalter([["true", "true"], ["false", "false"]], (w) => { antworten[i] = w; }, "true oder false"),
        el("p", { class: "rueckmeldung", hidden: true }));
      const mittel = Object.entries(D.mittel).map(([k, sym]) => [k,
        [el("span", { class: "wahl-sym", "aria-hidden": "true" }, sym), el("span", {}, MITTEL_NAME[k] || k)], MITTEL_NAME[k] || k]);
      const gefuehl = GEFUEHL.map(([w, sym, text]) => [w,
        [el("span", { class: "wahl-sym", "aria-hidden": "true" }, sym), el("span", {}, text)], text]);
      return el("li", { class: "hv-zeile" },
        el("h3", {}, el("span", { class: "hv-nr" }, i + 1 + ". "), a.name),
        umschalter(mittel, (w) => { antworten[i].mittel = w; }, `Wie kommt ${a.name} hin?`, true),
        umschalter(gefuehl, (w) => { antworten[i].gefuehl = w; }, `Ist der Weg für ${a.name} gut?`, true),
        el("p", { class: "rueckmeldung", hidden: true }));
    });

    const hoerKnopf = knopf("▶ Hörtext abspielen (1. Durchgang)", hoeren, "haupt");
    const stoppKnopf = knopf("■ Stopp", () => { stopp(); hoerKnopf.disabled = false; stoppKnopf.hidden = true; });
    stoppKnopf.hidden = true;
    const zaehler = el("p", { class: "klein", "aria-live": "polite" }, "Du hast den Text noch nicht gehört.");
    const gln = el("p", { class: "gln", hidden: true }, GLN_HINWEIS);
    const loesungKnopf = knopf("Lösung zeigen", loesen, "haupt");
    loesungKnopf.hidden = true;
    const ergebnis = el("div", { class: "rueckmeldung", hidden: true, role: "status" });
    const warten = el("p", { class: "klein" }, "Die Lösung kommt, wenn du den Text zweimal ganz gehört hast.");
    const mitlesen = el("section", { class: "satzkarte", hidden: true },
      el("h2", {}, "Text zum Mitlesen"),
      el("div", { class: "mitlesen", lang: "en" }, u.teile.map((t) => el("p", {},
        el("strong", {}, t.sprecher + ": "), t.text, " ",
        el("button", { class: "knopf leise klein-knopf", "aria-label": "Anhören: " + t.sprecher, onclick: () => spiele([t.audio]) }, "🔊")))),
      el("div", { class: "knopfreihe" }, knopf("Weiter ➜", naechstes, "haupt")));

    function hoeren() {
      hoerKnopf.disabled = true; stoppKnopf.hidden = false;
      spiele(u.teile.map((t) => t.audio)).then((d) => {
        if (d === null) return; // abgebrochen: zählt nicht
        hoerKnopf.disabled = false; stoppKnopf.hidden = true;
        durchgaenge++;
        zaehler.textContent = durchgaenge === 1 ? "1. Durchgang geschafft! Hör den Text ein zweites Mal."
          : `${durchgaenge} Durchgänge gehört.`;
        hoerKnopf.textContent = durchgaenge === 1 ? "▶ Noch mal hören (2. Durchgang)" : "▶ Noch mal hören (Übung)";
        if (durchgaenge >= 2) { gln.hidden = false; warten.hidden = true; if (!geloest) loesungKnopf.hidden = false; }
      });
    }

    async function loesen() {
      geloest = true;
      loesungKnopf.hidden = true;
      app.querySelectorAll(".hv-liste .wahl button").forEach((b) => { b.disabled = true; });
      let richtig = 0;
      u.aufgaben.forEach((a, i) => {
        const zeile = zeilen[i], box = zeile.querySelector(".rueckmeldung");
        let ok, hilfe;
        if (tf) {
          ok = antworten[i] === a.loesung;
          hilfe = antworten[i] === null ? `Du hast nichts markiert. Richtig ist: ${a.loesung}.`
            : `Richtig ist: ${a.loesung}. ${a.hinweis || ""}`;
        } else {
          ok = antworten[i].mittel === a.mittel && antworten[i].gefuehl === a.gefuehl;
          const g = GEFUEHL.find((x) => x[0] === a.gefuehl);
          hilfe = `Richtig ist: ${D.mittel[a.mittel]} ${MITTEL_NAME[a.mittel]} und ${g[1]} ${g[2]}.`;
        }
        if (ok) richtig++;
        zeile.classList.add(ok ? "ok" : "falsch");
        box.hidden = false;
        box.className = "rueckmeldung " + (ok ? "gut" : "hilfe");
        box.textContent = ok ? "✓ Richtig!" : `Ich helfe dir: ${hilfe.trim()}`;
        // richtige Antwort markieren
        zeile.querySelectorAll(".wahl button").forEach((b) => {
          const w = b.dataset.wert;
          if (tf ? w === a.loesung : w === a.mittel || w === a.gefuehl) b.classList.add("richtig");
        });
      });
      ergebnis.hidden = false;
      ergebnis.className = "rueckmeldung " + (richtig === u.aufgaben.length ? "gut" : "hilfe");
      ergebnis.textContent = richtig === u.aufgaben.length ? `${ruf("voll") || lob()} Alles richtig!`
        : `Du hast ${richtig} von ${u.aufgaben.length} richtig. Hör dir die Lösung an!`;
      mitlesen.hidden = false;
      lage.weiter = naechstes;
      // Lösung mit Audio: jede Aufgabe nacheinander vorlesen
      for (let i = 0; i < u.aufgaben.length; i++) {
        const a = u.aufgaben[i];
        const datei = tf ? a.audio : (u.teile.find((t) => t.sprecher === a.name) || {}).audio;
        zeilen.forEach((z) => z.classList.remove("spricht"));
        zeilen[i].classList.add("spricht");
        const d = await spiele([datei]);
        if (d === null) break;
      }
      zeilen.forEach((z) => z.classList.remove("spricht"));
    }

    lage.abspielen = () => { if (!hoerKnopf.disabled) hoeren(); };
    zeige(kopf(st),
      el("section", { class: "satzkarte" },
        el("h2", { lang: "en" }, u.titel),
        el("p", { class: "ansage", lang: "en" }, u.instruction || (tf ? "Listen and tick: true or false?" : "Listen and match.")),
        el("p", { class: "hinweis-kasten" }, "📖 " + (u.anleitung || "Lies dir zuerst alle Aufgaben durch, damit du weißt, worauf du beim Hören achten musst.")),
        el("ol", { class: "hv-liste" }, zeilen)),
      el("section", { class: "satzkarte" }, gln, el("div", { class: "knopfreihe" }, loesungKnopf), ergebnis,
        warten),
      mitlesen,
      el("div", { class: "hv-spieler" }, el("div", { class: "knopfreihe" }, hoerKnopf, stoppKnopf), zaehler));
  }

  /* ---------- Übung: Auswahl (eine richtige Antwort; Lösung immer mit Audio) ---------- */
  function zeigeAuswahl(teil) {
    const st = station(lage.nr);
    const a = teil.aufgaben[lage.pos];
    const s = D.saetze[a.satz];
    let geloest = false;
    const box = rueckmeldung();
    const loesungZeile = el("p", { class: "satz ziel-satz", lang: "en", hidden: true }, s.en);
    const weiter = knopf("Weiter ➜", naechstes, "haupt");
    weiter.disabled = true;
    const hoeren = () => spiele([s.audio.en]);
    const wahl = el("div", { class: "wahl", role: "group", "aria-label": "Antwort wählen" },
      (a.korrektur ? a.optionen : mischen(a.optionen)).map((o) => el("button", { class: "knopf wahl-knopf", lang: "en", onclick: (e) => {
        if (geloest) return;
        if (o === a.richtig) {
          geloest = true;
          e.currentTarget.classList.add("richtig");
          melde(box, "gut", lob() + (a.korrektur ? (a.frage === s.en ? " Der Satz stimmt." : " So ist es richtig:") : ""));
          loesungZeile.hidden = false;
          weiter.disabled = false; lage.weiter = naechstes; lage.abspielen = hoeren;
          hoeren();
        } else {
          e.currentTarget.disabled = true;
          melde(box, "hilfe", `Ich helfe dir: ${a.hilfe} Probier's nochmal!`);
        }
      } }, o)));
    lage.abspielen = null;
    zeige(kopf(st),
      el("p", { class: "ansage" }, teil.ansage || "Tipp auf die richtige Antwort!"),
      karte(teil, `Aufgabe ${lage.pos + 1} von ${teil.aufgaben.length}`,
        el("p", { class: "satz", lang: a.korrektur ? "en" : "de" }, a.frage),
        wahl, box, loesungZeile,
        el("div", { class: "knopfreihe" }, weiter)));
  }

  /* ---------- Übung: Wörter in die richtige Reihenfolge bringen ---------- */
  function zeigeReihenfolge(teil) {
    const st = station(lage.nr);
    const woerter = teil.woerter.map((id) => D.saetze[id]);
    let naechster = 0;
    const box = rueckmeldung();
    const reihe = el("ol", { class: "reihe", "aria-label": "Deine Reihenfolge" },
      woerter.map(() => el("li", { class: "platz" }, "…")));
    const weiter = knopf("Weiter ➜", naechstes, "haupt");
    weiter.disabled = true;
    const alle = () => spiele(woerter.map((w) => w.audio.en));
    const knoepfe = mischen(woerter).map((w) => el("button", { class: "knopf wahl-knopf", lang: "en", onclick: (e) => {
      if (w === woerter[naechster]) {
        const platz = reihe.children[naechster];
        platz.textContent = ""; platz.append(el("span", { class: "punkte", "aria-hidden": "true" }, w.symbol || ""), " " + w.en);
        platz.classList.add("voll");
        e.currentTarget.hidden = true;
        box.hidden = true;
        spiele([w.audio.en]);
        if (++naechster === woerter.length) {
          melde(box, "gut", lob());
          weiter.disabled = false; lage.weiter = naechstes; lage.abspielen = alle;
          setTimeout(alle, 900);
        }
      } else {
        melde(box, "hilfe", `Ich helfe dir: ${teil.hilfe} Probier's nochmal!`);
      }
    } }, w.en));
    lage.abspielen = null;
    zeige(kopf(st),
      el("p", { class: "ansage" }, "Bring die Wörter in die richtige Reihenfolge: von „nie“ bis „immer“. Tipp sie nacheinander an!"),
      karte(teil, null, reihe, el("div", { class: "wahl" }, knoepfe), box, el("div", { class: "knopfreihe" }, weiter)));
  }

  /* ---------- Lesen: Text und alle Aussagen auf einer Seite (true / false / not in the text) ---------- */
  function zeigeLesen(teil) {
    const st = station(lage.nr);
    const text = D.saetze[teil.text];
    const antworten = teil.aufgaben.map(() => null);
    let geloest = false;
    const zeilen = teil.aufgaben.map((a, i) => {
      const knoepfe = teil.optionen.map((o) => el("button", { class: "knopf wahl-knopf", lang: "en", "aria-pressed": "false",
        "data-wert": o, onclick: () => {
          if (geloest) return;
          antworten[i] = o;
          knoepfe.forEach((k) => k.setAttribute("aria-pressed", String(k.dataset.wert === o)));
        } }, o));
      return el("li", { class: "hv-zeile" },
        el("p", { class: "hv-aussage", lang: "en" }, el("span", { class: "hv-nr" }, i + 1 + ". "), D.saetze[a.satz].en),
        el("div", { class: "wahl", role: "group", "aria-label": "Antwort" }, knoepfe),
        el("p", { class: "rueckmeldung", hidden: true }));
    });
    const ergebnis = el("div", { class: "rueckmeldung", hidden: true, role: "status" });
    const loesungKnopf = knopf("Lösung zeigen", loesen, "haupt");
    const weiter = knopf("Weiter ➜", naechstes, "haupt");
    weiter.hidden = true;
    async function loesen() {
      geloest = true; loesungKnopf.hidden = true; weiter.hidden = false; lage.weiter = naechstes;
      app.querySelectorAll(".hv-liste .wahl button").forEach((b) => { b.disabled = true; });
      let richtig = 0;
      teil.aufgaben.forEach((a, i) => {
        const ok = antworten[i] === a.loesung, box = zeilen[i].querySelector(".rueckmeldung");
        if (ok) richtig++;
        box.hidden = false;
        box.className = "rueckmeldung " + (ok ? "gut" : "hilfe");
        box.textContent = ok ? "✓ Richtig!" : `Ich helfe dir: ${antworten[i] === null ? "Du hast nichts markiert. " : ""}Richtig ist: ${a.loesung}. ${a.hinweis || ""}`.trim();
        zeilen[i].querySelectorAll(".wahl button").forEach((b) => { if (b.dataset.wert === a.loesung) b.classList.add("richtig"); });
      });
      ergebnis.hidden = false;
      ergebnis.className = "rueckmeldung " + (richtig === teil.aufgaben.length ? "gut" : "hilfe");
      ergebnis.textContent = richtig === teil.aufgaben.length ? `${ruf("voll") || lob()} Alles richtig!`
        : `Du hast ${richtig} von ${teil.aufgaben.length} richtig. Hör dir die Lösung an!`;
      for (let i = 0; i < teil.aufgaben.length; i++) { // Lösung mit Audio
        zeilen.forEach((z) => z.classList.remove("spricht"));
        zeilen[i].classList.add("spricht");
        if ((await spiele([D.saetze[teil.aufgaben[i].satz].audio.en])) === null) break;
      }
      zeilen.forEach((z) => z.classList.remove("spricht"));
    }
    lage.abspielen = () => spiele([text.audio.en]);
    zeige(kopf(st),
      el("section", { class: "satzkarte" },
        el("h2", { lang: "en" }, teil.titel),
        el("p", { class: "ansage", lang: "en" }, teil.instruction),
        el("p", { class: "hinweis-kasten" }, "📖 Lies zuerst den Text genau. Dann lies alle Sätze. Steht das wirklich im Text? Wenn nicht: not in the text!"),
        el("div", { class: "lesetext", lang: "en" }, el("p", {}, text.en)),
        el("div", { class: "knopfreihe" }, knopf("🔊 Text vorlesen", () => spiele([text.audio.en])))),
      el("section", { class: "satzkarte" }, el("ol", { class: "hv-liste" }, zeilen)),
      el("section", { class: "satzkarte" }, el("div", { class: "knopfreihe" }, loesungKnopf, weiter), ergebnis));
  }

  /* ---------- Hörwahl: Wort hören, richtiges Bild wählen ---------- */
  function zeigeHoerwahl(teil) {
    const st = station(lage.nr);
    if (!lage.runden)
      lage.runden = mischen(teil.paare.flatMap((p) => p.optionen.map((_, i) => ({ paar: p, richtig: i }))));
    const r = lage.runden[lage.pos];
    const ziel = r.paar.optionen[r.richtig];
    let geloest = false;
    const box = rueckmeldung();
    const weiter = knopf("Weiter ➜", naechstes, "haupt");
    weiter.disabled = true;
    const hoeren = () => spiele([ziel.audio]);
    const wahl = el("div", { class: "wahl", role: "group", "aria-label": "Welches Wort?" },
      r.paar.optionen.map((o) => el("button", { class: "knopf wahl-knopf gross", lang: "en", onclick: (e) => {
        if (geloest) return;
        if (o === ziel) {
          geloest = true; e.currentTarget.classList.add("richtig");
          melde(box, "gut", lob()); weiter.disabled = false; lage.weiter = naechstes;
          hoeren();
        } else {
          e.currentTarget.disabled = true;
          melde(box, "hilfe", `Ich helfe dir: ${r.paar.hilfe} Hör noch mal hin!`);
          hoeren();
        }
      } }, el("span", { class: "wahl-sym", "aria-hidden": "true" }, o.symbol), el("span", {}, o.wort))));
    lage.abspielen = hoeren;
    zeige(kopf(st),
      el("p", { class: "ansage" }, "Hör gut zu! Welches Wort hörst du? Tipp auf das richtige Bild."),
      karte(teil, `Wort ${lage.pos + 1} von ${lage.runden.length}`,
        el("div", { class: "knopfreihe" }, knopf("🔊 Noch mal hören", hoeren, "haupt")),
        wahl, box, el("div", { class: "knopfreihe" }, weiter)));
    hoeren();
  }

  /* ---------- Memory: Symbol und englisches Wort finden zusammen ---------- */
  function zeigeMemory(teil) {
    const st = station(lage.nr);
    const paare = mischen(teil.karten).slice(0, teil.paare);
    const karten = mischen(paare.flatMap((k) => [{ k, art: "symbol" }, { k, art: "wort" }]));
    let offen = [], gefunden = 0, zuege = 0, sperre = false;
    const box = rueckmeldung();
    const zaehler = el("p", { class: "klein", "aria-live": "polite" }, "Züge: 0");
    const weiter = knopf("Weiter ➜", naechstes, "haupt");
    weiter.hidden = true;
    const feld = el("div", { class: "memory" }, karten.map((c) => {
      const b = el("button", { class: "mem-karte", "aria-label": "Verdeckte Karte", onclick: () => {
        if (sperre || b.classList.contains("auf")) return;
        b.classList.add("auf");
        b.replaceChildren(c.art === "symbol" ? el("span", { class: "mem-sym" }, c.k.symbol)
          : el("span", { lang: "en", class: c.k.wort.length > 7 ? "mem-lang" : "" }, c.k.wort));
        b.setAttribute("aria-label", c.art === "symbol" ? `Bild: ${c.k.wort}` : c.k.wort);
        spiele([c.k.audio]);
        offen.push({ b, c });
        if (offen.length < 2) return;
        zuege++; zaehler.textContent = "Züge: " + zuege;
        const [x, y] = offen; offen = [];
        if (x.c.k === y.c.k) {
          x.b.classList.add("paar"); y.b.classList.add("paar"); x.b.disabled = y.b.disabled = true;
          if (++gefunden === paare.length) {
            melde(box, "gut", `${lob()} Alle ${paare.length} Paare gefunden – in ${zuege} Zügen!`);
            weiter.hidden = false; lage.weiter = naechstes;
          }
        } else {
          sperre = true;
          setTimeout(() => {
            if (Math.random() < 0.3) ruf("spiel"); // ab und zu ein humorvoller Kommentar
            [x, y].forEach(({ b }) => { b.classList.remove("auf"); b.replaceChildren("?"); b.setAttribute("aria-label", "Verdeckte Karte"); });
            sperre = false;
          }, 1300);
        }
      } }, "?");
      return b;
    }));
    lage.abspielen = null;
    zeige(kopf(st),
      el("p", { class: "ansage" }, "Finde die Paare: Bild und englisches Wort. Beim Aufdecken hörst du das Wort."),
      karte(teil, null, feld, zaehler, box,
        el("div", { class: "knopfreihe" }, weiter, knopf("↻ Neu mischen", () => zeigeTeil()))));
  }

  /* ---------- -s-Detektiv: fehlendes -s finden und reparieren (nur lesen) ---------- */
  function zeigeDetektiv(teil) {
    const st = station(lage.nr);
    if (!lage.detektiv) {
      const he = teil.personen.filter((p) => p[1]), ich = teil.personen.filter((p) => !p[1]);
      const verben = mischen(teil.verben);
      const plan = mischen([...Array(4).fill("falsch"), ...Array(2).fill("he"), ...Array(teil.runden - 6).fill("ich")]);
      lage.detektiv = plan.map((typ, i) => {
        const p = typ === "ich" ? ich[Math.floor(Math.random() * ich.length)] : he[Math.floor(Math.random() * he.length)];
        const v = verben[i % verben.length];
        return { person: p[0], dritte: p[1], basis: v[0], sform: v[1], rest: v[2], falsch: typ === "falsch" };
      });
    }
    const s = lage.detektiv[lage.pos];
    let geloest = false;
    const box = rueckmeldung();
    const weiter = knopf("Weiter ➜", naechstes, "haupt");
    weiter.disabled = true;
    const verbAnzeige = s.falsch ? s.basis : (s.dritte ? s.sform : s.basis);
    const fertig = (text) => { geloest = true; melde(box, "gut", text); weiter.disabled = false; lage.weiter = naechstes; };
    const verbKnopf = el("button", { class: "wort-knopf", lang: "en", onclick: () => {
      if (geloest) return;
      if (s.falsch) {
        verbKnopf.replaceChildren(el("strong", { class: "ziel" }, s.sform));
        verbKnopf.classList.add("repariert");
        fertig(`${lob()} Repariert: ${s.basis} → ${s.sform}`);
      } else {
        melde(box, "hilfe", s.dritte ? "Ich helfe dir: Schau noch mal – das Verb hat sein -s schon. Probier's nochmal!"
          : "Ich helfe dir: Bei I, you, we und they bleibt das Verb ohne -s. Probier's nochmal!");
      }
    } }, verbAnzeige);
    const andere = (t) => el("button", { class: "wort-knopf", lang: "en", onclick: () => {
      if (!geloest) melde(box, "hilfe", "Ich helfe dir: Schau aufs Verb. Bei he, she, it braucht das Verb ein -s. Probier's nochmal!");
    } }, t);
    const allesRichtig = knopf("✓ Alles richtig!", () => {
      if (geloest) return;
      if (s.falsch) melde(box, "hilfe", "Ich helfe dir: Hier fehlt etwas. Bei he, she, it braucht das Verb ein -s. Probier's nochmal!");
      else fertig(`${lob()} Der Satz stimmt.`);
    });
    lage.abspielen = null;
    zeige(kopf(st),
      el("p", { class: "ansage" }, "Du bist der -s-Detektiv! Fehlt ein -s? Dann tipp auf das Verb und repariere es. Sonst: „Alles richtig!“"),
      karte(teil, `Satz ${lage.pos + 1} von ${lage.detektiv.length}`,
        el("p", { class: "satz detektiv-satz" }, s.person.split(" ").map(andere), verbKnopf, s.rest.split(" ").map(andere)),
        el("div", { class: "knopfreihe" }, allesRichtig), box, el("div", { class: "knopfreihe" }, weiter)));
  }

  /* ---------- Vokabeln ---------- */

  function zeigeVokabel(teil) {
    const st = station(lage.nr);
    if (teil.art === "vok_abfrage" && !lage.vq) lage.vq = mischen(lage.vok.map((v) => v.id));
    const v = teil.art === "vok_abfrage" ? lage.vok.find((x) => x.id === lage.vq[lage.pos])
      : teil.art === "vok_luecke" ? lage.vok.filter((x) => x.gymsatz)[lage.pos]
      : teil.art === "vok_bild" ? lage.vok.filter((x) => x.bild)[lage.pos] : lage.vok[lage.pos];
    const anzahl = laenge(teil);
    const bild = (sichtbar) => el("span", { class: "vok-bild", "aria-hidden": "true" }, sichtbar ? v.symbol : "❔");

    const satzBlock = (s, mitLuecke) => s && el("div", { class: "spalten" },
      el("div", { class: "spalte", lang: "en" }, el("span", { class: "sprache" }, "Beispiel"), el("p", { class: "satz" }, lueckenSatz(s, mitLuecke))),
      el("div", { class: "spalte", lang: "de" }, el("span", { class: "sprache" }, "Deutsch"), el("p", { class: "satz de" }, s.de)));

    if (teil.art === "vok_lernen") {
      const s = gymSatzFuer(v);
      const jetztdu = el("div", { class: "jetztdu", hidden: true, role: "status" }, "Jetzt du! Sprich nach.",
        el("span", { class: "balken", "aria-hidden": "true" }));
      const abspielen = () => { jetztdu.hidden = true; spiele([v.audio.en, s && s.audio.en]).then((d) => {
        if (d === null) return;
        jetztdu.hidden = false; jetztdu.classList.remove("laeuft"); void jetztdu.offsetWidth;
        jetztdu.style.setProperty("--dauer", sprechDauer(d, 2.5).toFixed(1) + "s"); jetztdu.classList.add("laeuft");
        gibFrei(weiter, sprechDauer(d, 2.5));
      }); };
      const weiter = sperre(knopf("Weiter ➜", naechstes, "haupt"));
      lage.abspielen = abspielen; lage.weiter = wennFrei(weiter, naechstes);
      zeige(kopf(st), el("p", { class: "ansage" }, "Lernen wir die Wörter! Hör zu und sprich nach."),
        karte(teil, `Wort ${lage.pos + 1} von ${anzahl}`,
          el("div", { class: "vok" }, bild(true),
            el("div", {}, el("p", { class: "vok-en", lang: "en" }, v.en), el("p", { class: "vok-de" }, v.de))),
          satzBlock(s, false),
          jetztdu,
          el("div", { class: "knopfreihe" }, knopf("🔊 Nochmal", abspielen), weiter)));
      return abspielen();
    }

    // Bild → Wort: das Symbol zeigt ein Wort; auswählen oder (⌨) eintippen
    if (teil.art === "vok_bild") {
      const box = rueckmeldung();
      const weiter = knopf("Weiter ➜", naechstes, "haupt"); weiter.disabled = true;
      const wortZeile = el("p", { class: "vok-en ziel-satz", lang: "en", hidden: true }, v.form);
      let geloest = false;
      const geschafft = (stufe) => {
        geloest = true; wortZeile.hidden = false; weiter.disabled = false; lage.weiter = naechstes;
        tippRueckmeldung(box, stufe, v.form);
        lage.abspielen = () => spiele([v.audio.en]); lage.abspielen();
      };
      let bereich;
      if (tippen()) bereich = tippFeld((text, ui) => { if (geloest) return; ui.feld.disabled = ui.knopf.disabled = true; geschafft(pruefeTipp(text, [v.form, v.en])); });
      else {
        const pool = D.vokabeln.filter((x) => x.bild && x.id !== v.id);
        bereich = el("div", { class: "wahl", role: "group" }, mischen([v, ...mischen(pool).slice(0, 3)]).map((x) =>
          el("button", { class: "knopf wahl-knopf", lang: "en", onclick: (e) => {
            if (geloest) return;
            if (x === v) { e.currentTarget.classList.add("richtig"); geschafft(0); }
            else { e.currentTarget.disabled = true; melde(box, "hilfe", "Schau dir das Bild noch mal an. Probier's nochmal!"); }
          } }, x.form)));
      }
      lage.abspielen = null; lage.weiter = null;
      zeige(kopf(st), el("p", { class: "ansage" }, tippen() ? "Was ist das? Tipp das englische Wort ein." : "Was ist das? Wähl das englische Wort."),
        karte(teil, `Bild ${lage.pos + 1} von ${anzahl}`,
          el("div", { class: "vok" }, el("span", { class: "vok-bild gross", "aria-hidden": "true" }, v.symbol)),
          bereich, wortZeile, box, el("div", { class: "knopfreihe" }, weiter)));
      return;
    }

    if (teil.art === "vok_luecke") {
      const s = gymSatzFuer(v);
      const w = s.luecke, i = s.en.toLowerCase().indexOf(w.toLowerCase());
      const teileSatz = (luecke) => [s.en.slice(0, i), luecke
        ? el("span", { class: "luecke", "aria-label": "Lücke" }, w.replace(/./g, "_"))
        : el("strong", { class: "ziel" }, s.en.slice(i, i + w.length)), s.en.slice(i + w.length)];
      const satz = el("p", { class: "satz", lang: "en" }, teileSatz(true));
      let geloest = false;
      const box = rueckmeldung();
      const weiter = sperre(knopf("Weiter ➜", naechstes, "haupt"));
      let ui = null;
      const aufloesen = () => {
        geloest = true; loesung.disabled = true; if (ui) ui.feld.disabled = ui.knopf.disabled = true;
        satz.replaceChildren(...teileSatz(false));
        spiele([s.audio.en]).then((d) => { if (d !== null) gibFrei(weiter, sprechDauer(d)); });
      };
      const loesung = sperre(knopf("Lösung", aufloesen));
      gibFrei(loesung, denkzeit(s.en), false);
      let bereich = null;
      if (tippen()) bereich = tippFeld((text, u) => { if (geloest) return; ui = u; tippRueckmeldung(box, pruefeTipp(text, w), w); aufloesen(); });
      lage.abspielen = () => { if (geloest) spiele([s.audio.en]); };
      lage.weiter = wennFrei(weiter, naechstes);
      zeige(kopf(st), el("p", { class: "ansage" }, tippen() ? "Welches Wort fehlt? Tipp es ein. Du kannst auch „Lösung“ antippen."
        : "Welches Wort fehlt? Sag den ganzen Satz auf Englisch! Dann tipp auf „Lösung“."),
        karte(teil, `Satz ${lage.pos + 1} von ${anzahl}`,
          el("div", { class: "vok" }, bild(true), el("p", { class: "satz de" }, s.de)),
          satz, bereich, box,
          el("div", { class: "knopfreihe" }, knopf("🔊 Nochmal", () => lage.abspielen()), loesung, weiter)));
      return lage.abspielen();
    }

    // Abfrage Englisch → Deutsch oder Deutsch → Englisch, mit Selbstkontrolle (Deutsch → Englisch auf Wunsch zum Eintippen)
    const enDe = teil.richtung === "en_de";
    const s = gymSatzFuer(v);
    const frage = enDe ? el("p", { class: "vok-en", lang: "en" }, v.en) : el("p", { class: "vok-en" }, v.de);
    const antwort = el("p", { class: "vok-de", lang: enDe ? "de" : "en", hidden: true }, enDe ? v.de : v.en);
    const satzZeile = el("div", { hidden: true }, satzBlock(s, false));
    const box = rueckmeldung();
    const bildPlatz = bild(false);
    const fragen = () => { if (enDe) spiele([v.audio.en]); };
    const bewerten = el("div", { class: "knopfreihe", hidden: true },
      knopf("✓ Gewusst", naechstes, "haupt"),
      knopf("↻ Nochmal üben", () => { lage.vq.push(v.id); naechstes(); }));
    const zeigeLoesung = () => {
      loesung.hidden = true; antwort.hidden = false; satzZeile.hidden = !s;
      bildPlatz.textContent = v.symbol;
      lage.abspielen = () => spiele([v.audio.en, s && s.audio.en]);
      lage.abspielen();
    };
    const loesung = sperre(knopf("Lösung", () => { zeigeLoesung(); bewerten.hidden = false; if (bereich) bereich.hidden = true; lage.weiter = naechstes; }, "haupt"));
    gibFrei(loesung, 3, false);
    let bereich = null;
    const tippModus = tippen() && !enDe && v.tippbar;
    if (tippModus) {
      const weiterT = knopf("Weiter ➜", null, "haupt"); weiterT.hidden = true;
      bereich = el("div", {}, tippFeld((text, ui) => {
        ui.feld.disabled = ui.knopf.disabled = true; loesung.hidden = true;
        const stufe = pruefeTipp(text, [v.form, v.en]);
        tippRueckmeldung(box, stufe, v.form);
        zeigeLoesung();
        weiterT.hidden = false;
        weiterT.onclick = () => { if (stufe === 2) lage.vq.push(v.id); naechstes(); };
        lage.weiter = weiterT.onclick;
      }), el("div", { class: "knopfreihe" }, weiterT));
    }
    lage.abspielen = fragen;
    zeige(kopf(st),
      el("p", { class: "ansage" }, enDe ? "Was heißt das auf Deutsch? Sag es laut! Dann tipp auf „Lösung“."
        : tippModus ? "Was heißt das auf Englisch? Tipp es ein. Du kannst auch „Lösung“ antippen."
          : "Was heißt das auf Englisch? Sag es laut! Dann tipp auf „Lösung“."),
      karte(teil, `Wort ${lage.pos + 1} von ${lage.vq.length}`,
        el("div", { class: "vok" }, bildPlatz, el("div", {}, frage, antwort)),
        satzZeile, bereich, box,
        el("div", { class: "knopfreihe" }, knopf("🔊 Nochmal", () => lage.abspielen()), loesung),
        bewerten));
    fragen();
  }

  /* ---------- Belohnungen (docs/gamification/konzept.md) ----------
     Punkte nur für fertige Teile. Serien zählen Schultage (Mo–Fr ohne Ferien, Feiertage, freie Brückentage):
     🔥 3 Schultage am Stück · ⭐ Perfect week = jeden Schultag der Woche geübt → neuer Superheld
     👑 4 perfekte Wochen hintereinander (Ferienwochen halten an) · 🏖️ Wochenende = Bonus, keine Pflicht.
     London: jeder 4. neu geschaffte Teil schaltet einen Ort frei. Alles nur auf diesem Gerät. */
  const SP = D.spiel;
  const PUNKTE = { teil: 10, wiederholung: 5, seance: 30, einheit: 50, feuer: 30, wochenende: 20, ferien: 20, woche: 100, monat: 200 };
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const heute = () => (window.__heute ? new Date(window.__heute + "T12:00:00") : new Date());
  const plusTage = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const montag = (d) => plusTage(d, -((d.getDay() + 6) % 7));
  const istFrei = (t) => SP.frei.some((f) => t >= f.von && t <= f.bis);
  const istSchultag = (d) => d.getDay() >= 1 && d.getDay() <= 5 && !istFrei(iso(d));
  const schultageDerWoche = (mo) => [0, 1, 2, 3, 4].map((i) => plusTage(mo, i)).filter(istSchultag);

  function spielstand() {
    if (!stand.spiel) { // Erstes Mal: was schon geschafft ist, zählt mit
      const n = Object.keys(stand.teile || {}).length;
      const einheiten = stand.erledigt.length + Object.values(stand.gruppen || {}).reduce((a, l) => a + l.length, 0);
      stand.spiel = { punkte: n * PUNKTE.teil + einheiten * PUNKTE.einheit, tage: {}, wochen: [], feuer: [], wochenende: [], helden: [], abzeichen: [], titel: 0 };
      stand.spiel.titel = titelIndex(stand.spiel.punkte);
      speichern();
    }
    return stand.spiel;
  }
  const titelIndex = (p) => SP.titel.reduce((i, t, k) => (p >= t.ab ? k : i), 0);
  const neueTeile = () => Object.keys(stand.teile || {}).length;
  const orteBei = (n) => (n ? Math.min(SP.orte.length, Math.floor((n - 1) / 4) + 1) : 0);
  const teileZaehler = () => neueTeile() + ((stand.gym && stand.gym.seances) || 0); // Teile + fertige Word Gyms
  const orteFrei = () => orteBei(teileZaehler());

  // Serie: Schultage am Stück bis heute (Ferien und Feiertage werden übersprungen, nicht gebrochen)
  function serie() {
    const sp = spielstand();
    let d = heute(), n = 0;
    if (!sp.tage[iso(d)]) d = plusTage(d, -1); // heute noch nicht geübt: Serie von gestern zählt noch
    for (let i = 0; i < 400; i++, d = plusTage(d, -1)) {
      if (!istSchultag(d)) continue;
      if (sp.tage[iso(d)]) n++; else break;
    }
    return n;
  }
  // Perfekte Wochen hintereinander, endend mit der Woche wo (Wochen ohne Schultage halten an)
  function wochenSerie(mo) {
    const sp = spielstand();
    let n = 0;
    for (let w = mo, i = 0; i < 60; i++, w = plusTage(w, -7)) {
      if (!schultageDerWoche(w).length) continue;
      if (sp.wochen.includes(iso(w))) n++; else break;
    }
    return n;
  }

  const ereignisse = [];
  function belohne(erstesMal, istGym) {
    const sp = spielstand(), d = heute(), tag = iso(d);
    const orteVorher = orteBei(teileZaehler() - (erstesMal ? 1 : 0));
    let plus = istGym ? PUNKTE.seance : erstesMal ? PUNKTE.teil : PUNKTE.wiederholung;
    const ersterDesTages = !sp.tage[tag];
    sp.tage[tag] = (sp.tage[tag] || 0) + 1;
    if (orteFrei() > orteVorher) ereignisse.push({ art: "ort", ort: SP.orte[orteFrei() - 1] });
    if (ersterDesTages) {
      if (!istSchultag(d)) {
        if (d.getDay() === 0 || d.getDay() === 6) { sp.wochenende.push(tag); plus += PUNKTE.wochenende; ereignisse.push({ art: "toast", text: `🏖️ Weekend bonus +${PUNKTE.wochenende}` }); }
        else { (sp.ferien = sp.ferien || []).push(tag); plus += PUNKTE.ferien; ereignisse.push({ art: "toast", text: `🌴 Holiday bonus +${PUNKTE.ferien}` }); }
      } else {
        const n = serie();
        if (n >= 3 && n % 3 === 0 && !sp.feuer.includes(tag)) {
          sp.feuer.push(tag); plus += PUNKTE.feuer;
          ereignisse.push({ art: "feier", symbol: "🔥", titel: `On fire! ${n} days in a row`, text: `${n} Schultage am Stück – +${PUNKTE.feuer} Punkte!`, ton: SP.texte.feuer });
        }
        const mo = montag(d);
        if (schultageDerWoche(mo).every((x) => sp.tage[iso(x)]) && !sp.wochen.includes(iso(mo))) {
          sp.wochen.push(iso(mo)); plus += PUNKTE.woche;
          const held = SP.helden.find((h) => !sp.helden.includes(h.id));
          if (held) { sp.helden.push(held.id); ereignisse.push({ art: "held", held }); }
          if (sp.helden.length === SP.helden.length && !sp.abzeichen.includes("team")) {
            sp.abzeichen.push("team");
            ereignisse.push({ art: "feier", symbol: "🦸", titel: "Your team is complete!", text: "Du hast alle zehn Superhelden gesammelt. Du bist eine Legende!", ton: SP.texte.team });
          }
          const ws = wochenSerie(mo);
          if (ws >= 4 && ws % 4 === 0) {
            plus += PUNKTE.monat; if (!sp.abzeichen.includes("monat")) sp.abzeichen.push("monat");
            ereignisse.push({ art: "feier", symbol: "👑", titel: "Perfect month!", text: `${ws} perfekte Wochen hintereinander – +${PUNKTE.monat} Punkte und ein goldener Rahmen!`, ton: SP.texte.monat });
          }
        }
      }
    }
    punkteDazu(plus);
  }
  function einheitBonus() { punkteDazu(PUNKTE.einheit); }
  function punkteDazu(plus) {
    const sp = spielstand();
    sp.punkte += plus;
    ereignisse.unshift({ art: "toast", text: `+${plus} ⭐` });
    const t = titelIndex(sp.punkte);
    if (t > sp.titel) {
      sp.titel = t;
      const ti = SP.titel[t];
      ereignisse.push({ art: "feier", symbol: ti.symbol, titel: ti.name, text: `Neuer Titel: ${ti.name}!`, ton: ti });
    }
    speichern();
    setTimeout(zeigeEreignisse, 50);
  }

  /* Anzeige: kleine Meldungen unten, große Momente als Feier-Fenster (nacheinander) */
  const toastBox = el("div", { class: "toasts", "aria-live": "polite" });
  document.body.append(toastBox);
  const feier = el("dialog", { class: "feier", "aria-labelledby": "feier-titel" });
  document.body.append(feier);
  function toast(text) {
    const t = el("div", { class: "toast" }, text);
    toastBox.append(t);
    setTimeout(() => t.classList.add("weg"), 2200);
    setTimeout(() => t.remove(), 2800);
  }
  // Klang zum Stempel: „Tock“ (Aufschlag) + „Bling“ (zwei Glockentöne), im Browser erzeugt, leiser als die Stimme
  let klangCtx = null;
  const KLANG_LAUT = 0.5;
  function stempelKlang(verzoegerung) {
    try {
      if (!klangCtx) klangCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (klangCtx.state === "suspended") klangCtx.resume();
    } catch { return; }
    const c = klangCtx, t = c.currentTime + verzoegerung;
    const glocke = (start, f, dauer, vol) => {
      const m = c.createGain();
      m.gain.setValueAtTime(0.0001, start);
      m.gain.exponentialRampToValueAtTime(vol * KLANG_LAUT, start + 0.006);
      m.gain.exponentialRampToValueAtTime(0.0001, start + dauer);
      m.connect(c.destination);
      [[1, 1], [2.76, 0.22], [5.4, 0.08]].forEach(([mal, v]) => {
        const o = c.createOscillator(), g = c.createGain();
        o.frequency.value = f * mal; g.gain.value = v;
        o.connect(g).connect(m); o.start(start); o.stop(start + dauer + 0.05);
      });
    };
    const o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.09);
    g.gain.setValueAtTime(0.9 * KLANG_LAUT, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.14);
    const len = Math.ceil(c.sampleRate * 0.05), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const q = c.createBufferSource(), f = c.createBiquadFilter(), gq = c.createGain();
    q.buffer = buf; f.type = "lowpass"; f.frequency.value = 900; gq.gain.value = 0.45 * KLANG_LAUT;
    q.connect(f).connect(gq).connect(c.destination); q.start(t);
    glocke(t + 0.11, 1318.5, 0.7, 0.32); glocke(t + 0.2, 1760, 0.9, 0.3);
  }
  // Reisestempel beim Freischalten eines neuen Ortes in London: kurz (2 s), antippen schließt, hält die Übung nicht auf
  function stempel(bild, name, unter) {
    const farben = ["#e2384d", "#1f5fd1", "#f2b705"];
    const box = el("div", { class: "stempel-box", role: "status", onclick: () => box.remove() },
      el("div", { class: "stempel-karte" }, bild,
        el("div", { class: "stempel", lang: "en" }, el("strong", {}, name.toUpperCase()), el("span", {}, unter)),
        el("div", { class: "sterne", "aria-hidden": "true" }, Array.from({ length: 10 }, (_, i) =>
          el("span", { style: `--w:${i * 36}deg;--f:${farben[i % 3]}` }, "★")))));
    document.body.append(box);
    stempelKlang(0.72); // wenn der Stempel aufschlägt (Animation: 0,4 s Pause + 0,35 s)
    setTimeout(() => box.classList.add("weg"), 2000);
    setTimeout(() => box.remove(), 2500);
    return box;
  }
  // Reihenfolge (nie gleichzeitig): kleine Hinweise sofort · großes Pop-up mit Stimme zuerst · Stempel danach, wenn es still ist
  const grossEreignis = (e) => e.art === "feier" || e.art === "held";
  let stempelLaeuft = false;
  function zeigeEreignisse() {
    for (let i = 0; i < ereignisse.length;) { if (ereignisse[i].art === "toast") toast(ereignisse.splice(i, 1)[0].text); else i++; }
    if (feier.open || stempelLaeuft) return;
    const gi = ereignisse.findIndex(grossEreignis);
    if (gi >= 0) return zeigeFeier(ereignisse.splice(gi, 1)[0]);
    const si = ereignisse.findIndex((e) => e.art === "ort");
    if (si < 0) return;
    const e = ereignisse.splice(si, 1)[0];
    stempelLaeuft = true;
    audioEnde.then(() => setTimeout(() => {
      stempel(el("div", { class: "stempel-bild symbol-bild", "aria-hidden": "true" }, e.ort.symbol), e.ort.name, "London ✓");
      setTimeout(() => { stempelLaeuft = false; zeigeEreignisse(); }, 2700);
    }, 250));
  }
  function zeigeFeier(e) {
    const ton = e.art === "held" ? e.held : e.ton;
    const inhalt = e.art === "held"
      ? [el("p", { class: "feier-klein" }, "⭐ Perfect week! Neuer Superheld:"), heldenKarte(e.held, true),
         el("p", { class: "steckbrief", lang: "en" }, e.held.steckbrief)]
      : [el("div", { class: "feier-symbol", "aria-hidden": "true" }, e.symbol), el("h2", { id: "feier-titel", lang: "en" }, e.titel), el("p", {}, e.text)];
    feier.replaceChildren(konfetti(), ...inhalt,
      el("div", { class: "knopfreihe" },
        ton && ton.audio && knopf("🔊 Anhören", () => spiele([ton.audio])),
        knopf("Weiter ➜", () => { feier.close(); stopp(); setTimeout(zeigeEreignisse, 300); }, "haupt")));
    feier.showModal();
    if (ton && ton.audio) spiele([ton.audio], { warten: true }); // wartet, falls noch ein Lob läuft
  }
  function konfetti() {
    const farben = ["#ffd23f", "#1f5fd1", "#e2384d", "#1d8a4e", "#b48cff"];
    return el("div", { class: "konfetti", "aria-hidden": "true" }, Array.from({ length: 36 }, (_, i) =>
      el("span", { style: `left:${(i * 37) % 100}%;background:${farben[i % 5]};animation-delay:${(i % 9) * 0.12}s` })));
  }

  function statusleiste() {
    const sp = spielstand(), t = SP.titel[sp.titel], n = serie();
    return el("div", { class: "statusleiste" + (sp.abzeichen.includes("monat") ? " gold" : "") },
      el("span", { class: "status-titel" }, t.symbol + " " + t.name),
      el("span", {}, `⭐ ${sp.punkte} Punkte`),
      el("span", { title: "Schultage am Stück" }, `🔥 ${n}`),
      knopf("🏆 Meine Sammlung", sammlung, "haupt"));
  }

  function heldenKarte(h, gross) {
    return el("figure", { class: "heldenkarte" + (gross ? " gross" : "") },
      el("img", { src: h.bild, alt: `${h.name}: ${h.kraft}`, loading: "lazy" }),
      el("figcaption", { lang: "en" }, el("strong", {}, h.name), el("span", {}, h.kraft)));
  }

  function sammlung() {
    lage = null;
    const sp = spielstand(), t = sp.titel, naechster = SP.titel[t + 1];
    const mo = montag(heute());
    const woche = ["Mo", "Di", "Mi", "Do", "Fr"].map((name, i) => {
      const d = plusTage(mo, i), frei = !istSchultag(d), ok = !!sp.tage[iso(d)];
      return el("li", { class: frei ? "frei" : ok ? "ok" : "" }, el("span", {}, name), el("b", {}, frei ? "–" : ok ? "🔥" : "○"));
    });
    const abz = [
      ["🔥", "On fire", sp.feuer.length > 0], ["⭐", "Perfect week", sp.wochen.length > 0], ["🏅", "5 × perfect", sp.wochen.length >= 5],
      ["👑", "Perfect month", sp.abzeichen.includes("monat")], ["🏖️", "Weekend hero", sp.wochenende.length > 0], ["🌴", "Holiday hero", (sp.ferien || []).length > 0],
      ["🗺️", "London complete", orteFrei() === SP.orte.length], ["🦸", "Team complete", sp.abzeichen.includes("team")],
      ["🏆", "All stations", D.stationen.every((s) => stand.erledigt.includes(s.nr))],
    ];
    const fakt = el("div", { class: "fakt", hidden: true, "aria-live": "polite" });
    const frei = orteFrei();
    const karte = londonKarte(frei, (o) => {
      fakt.hidden = false;
      fakt.replaceChildren(el("h3", { lang: "en" }, `${o.symbol} ${o.name}`), el("p", { lang: "en" }, o.fakt),
        o.audio && knopf("🔊 Anhören", () => spiele([o.audio])));
      if (o.audio) spiele([o.audio]);
    });
    const helden = el("div", { class: "heldenraster" }, SP.helden.map((h) => sp.helden.includes(h.id)
      ? el("button", { class: "held-knopf", onclick: () => heldZeigen(h) }, heldenKarte(h))
      : el("div", { class: "held-zu", "aria-label": "Noch nicht gesammelt" }, el("span", {}, "?"), el("small", {}, "Perfect week"))));
    zeige(
      el("header", { class: "kopf" }, knopf("← Start", startseite, "leise"), el("h1", {}, "🏆 Meine Sammlung")),
      el("section", { class: "satzkarte titel-karte" + (sp.abzeichen.includes("monat") ? " gold" : "") },
        el("p", { class: "klein" }, "Dein Titel"),
        el("h2", { lang: "en" }, SP.titel[t].symbol + " " + SP.titel[t].name),
        el("p", {}, `⭐ ${sp.punkte} Punkte`),
        naechster && el("div", { class: "fortschritt" }, el("span", { style: `width:${Math.round(100 * (sp.punkte - SP.titel[t].ab) / (naechster.ab - SP.titel[t].ab))}%` })),
        naechster && el("p", { class: "klein" }, `Noch ${naechster.ab - sp.punkte} Punkte bis „${naechster.name}“`)),
      el("section", { class: "satzkarte" },
        el("h2", {}, `🗺️ London (${frei} von ${SP.orte.length} Orten)`),
        el("p", { class: "klein" }, "Alle 4 geschafften Teile schaltest du einen neuen Ort frei. Tipp auf einen Ort!"),
        karte, fakt),
      el("section", { class: "satzkarte" },
        el("h2", {}, "Diese Woche"),
        el("ol", { class: "wochenleiste" }, woche),
        el("p", { class: "klein" }, `🔥 ${serie()} Schultage am Stück · ⭐ ${sp.wochen.length} perfekte Wochen. Übst du an jedem Schultag, bekommst du einen neuen Superhelden! Ferien und Feiertage zählen nicht – deine Serie bleibt.`)),
      el("section", { class: "satzkarte" },
        el("h2", {}, `🦸 Superhelden (${sp.helden.length} von ${SP.helden.length})`), helden),
      aktenBereich(),
      el("section", { class: "satzkarte" },
        el("h2", {}, "Abzeichen"),
        el("ul", { class: "abzeichen" }, abz.map(([sym, name, ok]) => el("li", { class: ok ? "ok" : "" },
          el("span", { "aria-hidden": "true" }, sym), el("span", { lang: "en" }, name), el("span", { class: "unsichtbar" }, ok ? "geschafft" : "noch nicht"))))));
  }

  /* ---------- Geheimakten (docs/secret-level): öffnen sich, wenn Figur/Karte UND Ort/Staat freigeschaltet sind ---------- */
  function aktenWoerter(absatz) {
    return absatz.split(/(\{[^}]+\})/).map((t) => {
      const m = t.match(/^\{(.+)\|(.+)\}$/);
      if (!m) return t;
      return el("button", { class: "akten-wort", type: "button", lang: "en", onclick: (e) => { e.currentTarget.classList.toggle("auf"); } },
        m[1], el("span", { class: "akten-de", lang: "de" }, m[2]));
    });
  }
  function aktenZeigen(a) {
    const gesehen = new Set(), lobBox = el("p", { class: "gym-lob", "aria-live": "polite" });
    feier.classList.add("akte");
    feier.replaceChildren(
      el("h2", { lang: "en" }, a.titel),
      el("p", { class: "klein" }, "Tipp auf ein farbiges Wort: Dann siehst du die Bedeutung."),
      ...a.absaetze.map((x) => el("p", { class: "akten-text", lang: "en" }, aktenWoerter(x))),
      el("h3", {}, "Questions"),
      el("ol", { class: "akten-fragen" }, a.fragen.map((f) => {
        const lsg = el("p", { class: "akten-antwort", lang: "en", hidden: true }, f.antwort);
        return el("li", {}, el("span", { lang: "en" }, f.frage), " ", knopf("Lösung", () => { lsg.hidden = false; gesehen.add(f); if (gesehen.size === a.fragen.length && !lobBox.textContent) lobBox.textContent = lob(true); }, "leise"), lsg);
      })),
      lobBox,
      el("div", { class: "knopfreihe" }, knopf("Schließen", () => { feier.close(); feier.classList.remove("akte"); }, "haupt")));
    feier.addEventListener("close", () => feier.classList.remove("akte"), { once: true });
    feier.showModal();
  }
  function aktenBereich() {
    const kacheln = SP.akten.map((a) => {
      const offen = spielstand().helden.includes(a.figur) && SP.orte.findIndex((o) => o.id === a.ort) < orteFrei();
      return offen
        ? el("button", { class: "akte-kachel offen", onclick: () => aktenZeigen(a) }, el("span", { "aria-hidden": "true" }, "📂"), el("strong", { lang: "en" }, a.titel))
        : el("div", { class: "akte-kachel zu" }, el("span", { "aria-hidden": "true" }, "🔒"), el("strong", { lang: "en" }, a.titel.replace(/ – .*/, "")),
            el("small", {}, `Du brauchst: ${(SP.helden.find((h) => h.id === a.figur) || {}).name} + ${(SP.orte.find((o) => o.id === a.ort) || {}).name}`));
    });
    return el("section", { class: "satzkarte" }, el("h2", {}, `🔒 Geheimakten (${SP.akten.filter((a) => spielstand().helden.includes(a.figur) && SP.orte.findIndex((o) => o.id === a.ort) < orteFrei()).length} von ${SP.akten.length})`),
      el("p", { class: "klein" }, "Eine Akte öffnet sich, wenn du den Superhelden hast und seinen Ort in London freigeschaltet hast."), el("div", { class: "akten" }, kacheln));
  }

  function heldZeigen(h) {
    feier.replaceChildren(heldenKarte(h, true), el("p", { class: "steckbrief", lang: "en" }, h.steckbrief),
      el("div", { class: "knopfreihe" }, h.audio && knopf("🔊 Anhören", () => spiele([h.audio])),
        knopf("Schließen", () => { feier.close(); stopp(); }, "haupt")));
    feier.showModal();
    if (h.audio) spiele([h.audio]);
  }

  function londonKarte(frei, waehle) {
    const NS = "http://www.w3.org/2000/svg";
    const s = (tag, attrs, ...kinder) => { const e = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); kinder.forEach((k) => e.append(k)); return e; };
    const svg = s("svg", { viewBox: "0 0 400 200", class: "london", role: "img", "aria-label": "Karte von London" });
    svg.append(
      s("rect", { x: 0, y: 0, width: 400, height: 200, rx: 12, class: "l-land" }),
      s("ellipse", { cx: 128, cy: 116, rx: 22, ry: 13, class: "l-park" }),
      s("ellipse", { cx: 158, cy: 52, rx: 18, ry: 12, class: "l-park" }),
      s("path", { d: "M0,170 C40,166 70,152 110,154 C150,156 170,164 196,152 C222,140 226,122 254,124 C284,126 300,124 326,136 C352,148 372,174 400,168", class: "l-fluss" }),
      s("text", { x: 300, y: 158, class: "l-name" }, "River Thames"));
    SP.orte.forEach((o, i) => {
      const offen = i < frei;
      const g = s("g", { class: "l-ort" + (offen ? " offen" : ""), transform: `translate(${o.x} ${o.y})`, tabindex: offen ? 0 : -1,
        role: offen ? "button" : "img", "aria-label": offen ? o.name : "Noch nicht freigeschaltet" },
        s("circle", { r: 12 }), s("text", { y: 4.5, "text-anchor": "middle" }, offen ? o.symbol : "?"));
      if (offen) {
        g.addEventListener("click", () => waehle(o));
        g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); waehle(o); } });
      }
      svg.append(g);
    });
    return el("div", { class: "london-rahmen" }, svg);
  }

  /* ---------- Word Gym: tägliches Vokabeltraining (docs/word-gym/konzept.md) ----------
     Jeden Tag ein festes Pensum: neue Wörter hören und nachsprechen, fällige Wörter aus dem Deutschen
     abrufen und selbst bewerten. Boxen mit Stufe 0–7 und Fälligkeit (Intervalle in D.gym.intervalle). */
  const GYM = D.gym || { pensum: { neu: 4, wdh: 8 }, grenzen: { neu: [1, 6], wdh: [4, 12] }, intervalle: [1, 3, 7, 14, 30, 60, 120] };
  const GYM_REIHE = Object.fromEntries(D.vokabeln.map((v, i) => [v.id, i]));
  const vokabel = (id) => D.vokabeln.find((v) => v.id === id);
  const GYM_SPRECH_MIN = 1.5;
  const gymFrei = new Set();
  function nachsprechen(balken, ton, min) {
    balken.hidden = true;
    return spiele([].concat(ton)).then((d) => {
      if (d === null) return;
      balken.hidden = false; balken.classList.remove("laeuft"); void balken.offsetWidth;
      balken.style.setProperty("--dauer", sprechDauer(d, min).toFixed(1) + "s");
      balken.classList.add("laeuft");
      return sprechDauer(d, min);
    });
  }
  const jetztDu = () => el("div", { class: "jetztdu", hidden: true, role: "status" }, "Jetzt du! Sprich nach.", el("span", { class: "balken", "aria-hidden": "true" }));
  let gym = null; // laufendes Training: { schlange, wieder, pos }

  function gymStand() {
    if (!stand.gym) stand.gym = { karten: {}, tag: null, pensum: { ...GYM.pensum }, seances: 0 };
    return stand.gym;
  }
  const gymPensum = () => {
    const p = gymStand().pensum, g = GYM.grenzen;
    return { neu: Math.min(g.neu[1], Math.max(g.neu[0], p.neu | 0)), wdh: Math.min(g.wdh[1], Math.max(g.wdh[0], p.wdh | 0)) };
  };
  // Tagesplan: einmal pro Kalendertag (Ortszeit) berechnet und gespeichert
  function gymPlan() {
    const g = gymStand(), t = iso(heute());
    if (g.tag && g.tag.d === t) return g.tag;
    const p = gymPensum();
    const wdh = Object.entries(g.karten).filter(([, k]) => k.f <= t)
      .sort((a, b) => (a[1].f < b[1].f ? -1 : a[1].f > b[1].f ? 1 : GYM_REIHE[a[0]] - GYM_REIHE[b[0]]))
      .map(([id]) => id).slice(0, p.wdh);
    const neu = D.vokabeln.map((v) => v.id).filter((id) => !g.karten[id]).slice(0, p.neu);
    g.tag = { d: t, wdh, neu, fertig: [], geschafft: false };
    speichern();
    return g.tag;
  }
  const gymFaellig = (stufe) => iso(plusTage(heute(), GYM.intervalle[Math.min(stufe, GYM.intervalle.length - 1)]));
  const gymAlles = (plan) => [...plan.wdh, ...plan.neu].every((id) => plan.fertig.includes(id));

  // Icon: Gewichtheber, die Hantel mit Büchern als Gewichten. gehoben = Pensum fertig; heben = einmal hochstemmen
  function gymIcon(gehoben, heben, groesse) {
    const y = gehoben ? 16 : 34, y0 = heben ? 46 : y;
    const arme = (h) => `M60 64 L44 ${h} M60 64 L76 ${h}`;
    const buecher = (x) => `<g transform="translate(${x} 0)">
      <rect x="2" y="-13" width="26" height="8" rx="1.5" class="b1"/><rect x="4" y="-4" width="22" height="8" rx="1.5" class="b2"/><rect x="1" y="5" width="28" height="8" rx="1.5" class="b3"/></g>`;
    const d = document.createElement("div");
    d.innerHTML = `<svg class="gym-icon${heben ? " hebt" : ""}" viewBox="0 0 120 100" width="${groesse || 96}" height="${Math.round((groesse || 96) * 0.83)}" aria-hidden="true">
      <path class="arme" d="${arme(y0)}">${heben ? `<animate attributeName="d" begin="indefinite" dur="1.4s" fill="freeze" values="${arme(46)}; ${arme(46)}; ${arme(16)}" keyTimes="0; .3; 1" calcMode="spline" keySplines=".4 0 .2 1; .4 0 .2 1"/>` : ""}</path>
      <circle class="kopf" cx="60" cy="52" r="8.5"/><path class="figur" d="M60 62 V78 M60 78 L49 96 M60 78 L71 96"/>
      <g class="hantel" transform="translate(0 ${y0})">${heben ? `<animateTransform attributeName="transform" type="translate" begin="indefinite" dur="1.4s" fill="freeze" values="0 46; 0 46; 0 16" keyTimes="0; .3; 1" calcMode="spline" keySplines=".4 0 .2 1; .4 0 .2 1"/>` : ""}
        <line class="stange" x1="22" y1="0" x2="98" y2="0"/><circle class="stange-f" cx="30" cy="0" r="5.5"/><circle class="stange-f" cx="90" cy="0" r="5.5"/>
        ${buecher(0)}${buecher(90)}<circle class="hand" cx="44" cy="0" r="5"/><circle class="hand" cx="76" cy="0" r="5"/></g></svg>`;
    const svg = d.firstElementChild;
    if (heben) svg.heben = () => svg.querySelectorAll("animate, animateTransform").forEach((a) => a.beginElement && a.beginElement());
    return svg;
  }

  // Startkarte auf der Startseite
  function gymKarte() {
    const plan = gymPlan(), g = gymStand(), p = gymPensum();
    const gesamt = plan.wdh.length + plan.neu.length, fertig = plan.fertig.length;
    const punkte = el("div", { class: "gym-punkte", "aria-hidden": "true" },
      [...plan.wdh, ...plan.neu].map((id) => el("span", { class: (plan.wdh.includes(id) ? "wdh" : "neu") + (plan.fertig.includes(id) ? " fertig" : "") })));
    const stand_ = gesamt === 0 ? "Heute ist nichts fällig – morgen geht's weiter!"
      : plan.geschafft ? "✓ Heute geschafft – bis morgen!"
        : `${plan.neu.length} neu · ${plan.wdh.length} wiederholen · ${fertig} / ${gesamt} fertig`;
    const einstellung = el("div", { class: "gym-einstellung", hidden: true });
    const wahl = (schluessel, label, grenzen) => {
      const sel = el("select", { "aria-label": label, onchange: () => {
        g.pensum[schluessel] = +sel.value;
        if (g.tag && g.tag.d === iso(heute()) && !g.tag.fertig.length) g.tag = null; // heute noch nicht begonnen: Plan neu
        speichern(); startseite();
      } });
      for (let n = grenzen[0]; n <= grenzen[1]; n++) sel.append(el("option", { value: n, selected: n === p[schluessel] }, n + (n === GYM.pensum[schluessel] ? " (Mr. Alex empfiehlt)" : "")));
      return el("label", {}, label, sel);
    };
    einstellung.append(wahl("neu", "Neue Wörter pro Tag", GYM.grenzen.neu), wahl("wdh", "Wiederholungen pro Tag", GYM.grenzen.wdh),
      el("p", { class: "klein" }, "Gilt ab morgen – oder schon heute, wenn du heute noch nicht angefangen hast."));
    return el("section", { class: "gym-karte" + (plan.geschafft ? " fertig" : "") },
      gymIcon(plan.geschafft, false, 92),
      el("div", { class: "gym-text" },
        el("h2", { lang: "en" }, "Word Gym"),
        el("p", { class: "klein" }, stand_), gesamt > 0 && punkte),
      el("div", { class: "gym-knoepfe" },
        knopf(plan.geschafft || gesamt === 0 ? "Ansehen" : fertig ? "▶ Weiter" : "▶ Los geht's", gymStart, plan.geschafft ? "" : "haupt"),
        el("button", { class: "knopf leise", "aria-label": "Pensum einstellen", "aria-expanded": "false",
          onclick: (e) => { einstellung.hidden = !einstellung.hidden; e.currentTarget.setAttribute("aria-expanded", String(!einstellung.hidden)); } }, "⚙")),
      einstellung);
  }

  function gymKopf() {
    return el("header", { class: "kopf" }, knopf("← Start", startseite, "leise"),
      el("h1", { class: "gym-titel" }, gymIcon(false, false, 40), "Word Gym"));
  }

  function gymStart() {
    const plan = gymPlan();
    gym = { schlange: [...plan.wdh, ...plan.neu].filter((id) => !plan.fertig.includes(id)), wieder: new Set(), pos: 0 };
    if (!gym.schlange.length) return gymEnde();
    gymZeige();
  }
  function gymWeiter() {
    if (gym.pos + 1 < gym.schlange.length) { gym.pos++; return gymZeige(); }
    gymEnde();
  }
  function gymZeige() {
    const plan = gymPlan(), g = gymStand();
    const id = gym.schlange[gym.pos], v = vokabel(id);
    const s = gymSatzFuer(v);
    lage = { gym: true, teil: "gym", pos: id, frei: gymFrei };
    const zaehler = `${gym.pos + 1} / ${gym.schlange.length}`;
    if (plan.neu.includes(id) && !g.karten[id]) gymNeu(v, s, zaehler); else gymWiederholung(v, s, zaehler);
  }
  const gymMerke = (id) => { const plan = gymPlan(); if (!plan.fertig.includes(id)) plan.fertig.push(id); speichern(); };
  const gymSatz = (s, art) => s && el("div", { class: "spalten" },
    el("div", { class: "spalte", lang: "en" }, el("span", { class: "sprache" }, "Example"), el("p", { class: "satz" }, lueckenSatz(s, false))),
    el("div", { class: "spalte", lang: "de" }, el("span", { class: "sprache" }, "Deutsch"), el("p", { class: "satz de" }, s.de)));
  const gymTon = (v, s) => [v.audio.en, s && s.audio.en];

  function gymNeu(v, s, zaehler) {
    const balken = jetztDu();
    const weiter = sperre(knopf("Weiter ➜", () => {
      gymStand().karten[v.id] = { s: 0, f: gymFaellig(0) };
      gymMerke(v.id); gymWeiter();
    }, "haupt weiter"));
    const abspielen = () => nachsprechen(balken, gymTon(v, s), GYM_SPRECH_MIN).then((sek) => { if (sek) gibFrei(weiter, sek); });
    lage.abspielen = abspielen; lage.weiter = wennFrei(weiter, () => weiter.click());
    zeige(gymKopf(),
      el("p", { class: "ansage" }, "Neues Wort! Hör zu und sprich nach."),
      karte(null, `${zaehler} · neu`,
        el("div", { class: "vok" }, el("span", { class: "vok-bild", "aria-hidden": "true" }, v.symbol),
          el("div", {}, el("p", { class: "vok-en", lang: "en" }, v.en), el("p", { class: "vok-de", lang: "de" }, v.de))),
        gymSatz(s, "voll"), balken,
        el("div", { class: "knopfreihe" }, knopf("🔊 Nochmal", abspielen), weiter)));
    abspielen();
  }

  function gymWiederholung(v, s, zaehler) {
    const k = gymStand().karten[v.id] || { s: 0 };
    const balken = jetztDu();
    const frage = el("div", { class: "vok" }, el("span", { class: "vok-bild", "aria-hidden": "true" }, v.symbol),
      el("div", {}, el("p", { class: "vok-en", lang: "de" }, v.de), s && el("p", { class: "satz de", lang: "de" }, s.de)));
    const antwort = el("div", { class: "gym-antwort", hidden: true },
      el("p", { class: "vok-en", lang: "en" }, v.en), gymSatz(s, "voll"));
    const bewerten = el("div", { class: "knopfreihe gym-bewerten", hidden: true },
      knopf("😊 Gewusst", () => gymBewerte(v, true), "haupt"),
      knopf("🔁 Nochmal", () => gymBewerte(v, false), "encore"));
    const loesung = sperre(knopf("Lösung", () => {
      loesung.hidden = true; antwort.hidden = false; bewerten.hidden = false;
      nachsprechen(balken, gymTon(v, s), GYM_SPRECH_MIN);
      lage.abspielen = () => nachsprechen(balken, gymTon(v, s), GYM_SPRECH_MIN); lage.weiter = null;
    }, "haupt"));
    gibFrei(loesung, denkzeit(s ? s.en : v.en), false);
    lage.abspielen = null; lage.weiter = wennFrei(loesung, () => loesung.click());
    zeige(gymKopf(),
      el("p", { class: "ansage" }, "Was heißt das auf Englisch? Sag es laut! Dann tipp auf „Lösung“."),
      karte(null, `${zaehler} · Wiederholung · Box ${k.s + 1}`,
        frage, antwort, balken, el("div", { class: "knopfreihe" }, loesung), bewerten));
  }

  function gymLobToast(r) {
    const t = el("div", { class: "toast lob-toast" }, el("strong", { lang: "en" }, r.text), r.de && el("span", { lang: "de" }, r.de));
    toastBox.append(t);
    setTimeout(() => t.classList.add("weg"), 2600);
    setTimeout(() => t.remove(), 3200);
  }
  function gymBewerte(v, gewusst) {
    const g = gymStand(), k = g.karten[v.id] || (g.karten[v.id] = { s: 0, f: gymFaellig(0) });
    if (gewusst) {
      k.s = Math.min(k.s + 1, GYM.intervalle.length); k.f = gymFaellig(k.s);
      gymMerke(v.id);
      lob(); if (letzterRuf) gymLobToast(letzterRuf);
    } else {
      k.s = 0; k.f = gymFaellig(0); fehlerSerie++; richtigSerie = 0;
      if (!gym.wieder.has(v.id)) { gym.wieder.add(v.id); gym.schlange.push(v.id); } else gymMerke(v.id);
      toast("Kein Problem – kommt gleich noch mal.");
    }
    speichern();
    gymWeiter();
  }

  function gymEnde() {
    const plan = gymPlan(), alles = gymAlles(plan), erstesMal = alles && !plan.geschafft;
    if (erstesMal) { plan.geschafft = true; gymStand().seances++; speichern(); }
    const r = waehleRuf(alles ? "stark" : "lob");
    const fini = SP.texte[alles ? "gym_fini" : "gym_pause"];
    const icon = gymIcon(alles, erstesMal, 120);
    const zeichne = () => {
      zeige(gymKopf(), el("section", { class: "geschafft gym-ende" },
        icon,
        el("h2", { lang: "en" }, alles ? "Das war's für heute!" : "Pause!"),
        r && el("p", { class: "gym-lob" }, el("strong", { lang: "en" }, r.text), r.de && el("span", { lang: "de" }, " – " + r.de)),
        el("p", {}, alles ? "Alle Wörter von heute sind geübt. Morgen gibt es neue und die fälligen von heute kommen wieder."
          : "Erledigtes bleibt gespeichert. Komm später wieder und mach den Rest fertig."),
        el("div", { class: "knopfreihe" }, knopf("Zur Startseite", startseite, "haupt"), knopf("🏆 Meine Sammlung", sammlung))));
      if (icon.heben) setTimeout(icon.heben, 400);
    };
    gym = null; lage = null;
    zeichne();
    // erst belohnen (reiht Pop-ups ein), dann sprechen: das Pop-up wartet auf die Schlussstimme, statt sie abzuschneiden
    if (erstesMal) belohne(true, true);
    spiele([!ereignisse.some(grossEreignis) && r && r.audio, fini && fini.audio]);
  }

  /* ---------- Fragen für Mr. Alex ---------- */
  const dlg = document.getElementById("fragen");
  const feld = document.getElementById("frage-text");
  const liste = document.getElementById("fragen-liste");
  function fragenZeigen() {
    liste.replaceChildren(...stand.fragen.map((f, i) => el("li", {},
      el("div", {}, el("span", {}, f),
        el("button", { class: "knopf leise", "aria-label": "Frage löschen", onclick: () => {
          stand.fragen.splice(i, 1); speichern(); fragenZeigen(); } }, "🗑️")))));
  }
  function fragenOeffnen() { fragenZeigen(); dlg.showModal(); feld.focus(); }
  document.getElementById("frage-speichern").addEventListener("click", () => {
    const t = feld.value.trim();
    if (!t) return feld.focus();
    stand.fragen.push(t); speichern(); feld.value = ""; fragenZeigen();
  });

  /* ---------- Tasten: Leertaste = Abspielen, Pfeil rechts = Weiter ---------- */
  document.addEventListener("keydown", (e) => {
    if (dlg.open || feier.open || e.target.closest("textarea, input")) return;
    if (e.code === "Space" && lage && lage.abspielen) { e.preventDefault(); lage.abspielen(); }
    else if (e.code === "ArrowRight" && lage && lage.weiter) { e.preventDefault(); lage.weiter(); }
    else if (e.code === "ArrowLeft" && lage && !lage.ende) {
      const z = app.querySelector(".zurueck-knopf");
      if (z && !z.disabled) { e.preventDefault(); z.click(); }
    }
  });

  tempoKnopf();
  (function tippKnopf() { // ⌨ oben: Antworten eintippen statt auswählen (an/aus, auf dem Gerät gemerkt)
    const k = document.getElementById("tippen");
    if (!k) return;
    const z = () => { k.setAttribute("aria-pressed", String(tippen())); k.title = tippen() ? "Eintippen ist an" : "Eintippen ist aus"; };
    k.addEventListener("click", () => { stand.tippen = !tippen(); speichern(); z(); });
    z();
  })();
  startseite();

  // Offline-Speicher (nur wenn die App über eine Webadresse läuft, nicht per Doppelklick)
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    // Neue Version veröffentlicht? Dann sofort holen und einmal neu laden (nur wenn schon eine alte Version lief).
    const hatteAlteVersion = !!navigator.serviceWorker.controller;
    let neuGeladen = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (hatteAlteVersion && !neuGeladen) { neuGeladen = true; location.reload(); }
    });
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" })
      .then((r) => r.update())
      .catch(() => { /* ohne Offline-Speicher geht es trotzdem */ });
  }
})();
