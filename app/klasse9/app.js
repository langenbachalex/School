/* Road Trip USA – Klasse 9
   Kein Konto, keine Namen. Fortschritt und Fragen bleiben nur auf diesem Gerät (localStorage).
   Grundsätze wie in Klasse 6: Wird eine Lösung gezeigt, wird sie auch abgespielt.
   Navigation: oben alle Teile anklickbar, „◀ Zurück“ / „Weiter“, verlassene Teile beginnen von vorne.
   Zwei Niveaus: G (Oberfläche Deutsch + Englisch) und E (alles Englisch) – auf jeder Seite umschaltbar. */
(function () {
  "use strict";

  const D = window.DATEN;
  const app = document.getElementById("app");
  const SPEICHER = "america9-v1";

  /* ---------- Speicher (nur lokal) ---------- */
  // Manipulationsschutz (Spielstand nur auf dem Gerät): Punkte, Spiel, Word Gym und erledigte Teile tragen ein Siegel.
  // Wer den Speicher von Hand ändert, passt nicht mehr zum Siegel: Die App nimmt dann die letzte gültige Sicherung
  // oder setzt Punkte und Fortschritt zurück. Kein Server nötig – ein Hindernis, keine Festung.
  const SIEGEL_SALZ = "mrAlex·2026·nine·p7Qx";
  const SIEGEL_BIS = Date.parse("2026-12-01"); // bis dahin werden ältere, noch ungesiegelte Spielstände einmalig übernommen
  // Siegel-Version 2 (Power Up): auch die erledigten Teile (stand.teile) stecken im Siegel; ein Stand ohne _v wird noch mit dem alten Siegel geprüft und beim Laden neu gesiegelt.
  // Siegel-Version 3 (Homework): auch die Hausaufgaben-Boni (stand.hw) stecken im Siegel; ältere Stände werden mit ihrer Version geprüft und beim nächsten Speichern als v3 gesiegelt.
  const siegel = (o, v = 3) => {
    const inhalt = [o.spiel || null, o.gym || null, o.erledigt || null];
    if (v >= 2) inhalt.push(o.teile || null);
    if (v >= 3) inhalt.push(o.hw || null);
    const t = SIEGEL_SALZ + JSON.stringify(inhalt);
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < t.length; i++) { const c = t.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  };
  let manipuliert = false, letzterGueltig = null;
  const lies = (key) => { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { return null; } };
  const echt = (o) => o && typeof o === "object" && o._s === siegel(o, o._v >= 2 ? o._v : 1);
  const grund = () => ({ erledigt: [], fragen: [], niveau: "G" });
  function laden() {
    const haupt = lies(SPEICHER), sicherung = lies(SPEICHER + "-b");
    if (echt(haupt)) { letzterGueltig = JSON.stringify(haupt); return Object.assign(grund(), haupt); }
    if (!haupt || typeof haupt !== "object") return grund();
    if (echt(sicherung)) { manipuliert = true; letzterGueltig = JSON.stringify(sicherung); try { localStorage.setItem(SPEICHER, letzterGueltig); } catch (e) { /* egal */ } return Object.assign(grund(), sicherung); }
    if (!haupt._s && Date.now() < SIEGEL_BIS) return Object.assign(grund(), haupt); // älterer Spielstand: einmal übernehmen, ab jetzt gesiegelt
    manipuliert = true; // verändert, oder ungesiegelt nach der Übergangszeit: Punkte und Fortschritt zurück, Einstellungen bleiben
    const rest = Object.assign(grund(), haupt); delete rest.spiel; delete rest.gym; delete rest._s; rest.erledigt = [];
    return rest;
  }
  function speichern() {
    try {
      stand._v = 3; stand._s = siegel(stand);
      const neu = JSON.stringify(stand);
      localStorage.setItem(SPEICHER + "-b", neu); // Zweitkopie: Wer nur den Hauptspeicher ändert, bekommt den letzten echten Stand zurück
      localStorage.setItem(SPEICHER, neu);
      letzterGueltig = neu;
    } catch (e) { /* ohne Speicher geht es trotzdem */ }
  }
  const stand = laden();

  // Umbau 29.10.2026: „BE vs AE“ (nr 7) sind jetzt Gruppen in Vocabulary (nr 2), „New“ (nr 8, Wörter Unit 2 Start/Theme 1)
  // ist in Vocabulary/Unit 2 aufgegangen, nr 8 heißt jetzt „Games“. Alter Fortschritt wandert einmalig mit (vor dem Siegeln),
  // Punkte bleiben. Idempotent über stand.umbau; der Siegelmechanismus bleibt unverändert.
  function umbau() {
    if (stand.umbau >= 1) return;
    const ZIEL = { "8|Unit 2 · Start": ["2|u2:Start"], "8|Unit 2 · Theme 1": ["2|u2:Theme 1 · Part 1", "2|u2:Theme 1 · Part 2"] };
    const neuePlaetze = (alt) => (alt.startsWith("7|") ? ["2|" + alt.slice(2)] : ZIEL[alt] || []);
    const teile = stand.teile || {};
    for (const alt of Object.keys(teile)) {
      const m = alt.match(/^([78]\|.+)\|(\d+)$/);
      if (!m) continue;
      neuePlaetze(m[1]).forEach((z) => { teile[`${z}|${m[2]}`] = true; });
      delete teile[alt];
    }
    const gr = stand.gruppen || {};
    [7, 8].forEach((nr) => {
      (gr[nr] || []).forEach((name) => neuePlaetze(`${nr}|${name}`).forEach((z) => {
        const liste = (gr[2] = gr[2] || []), g = z.slice(2);
        if (!liste.includes(g)) liste.push(g);
      }));
      delete gr[nr];
    });
    if (Object.keys(gr).length) stand.gruppen = gr;
    stand.erledigt = stand.erledigt.filter((nr) => nr !== 7 && nr !== 8);
    const vok = D.kategorien.find((k) => k.vokabeln);
    if (vok && gr[2] && kategorieGruppen(vok).every((g) => gr[2].includes(g)) && !stand.erledigt.includes(vok.nr)) stand.erledigt.push(vok.nr);
    stand.umbau = 1;
    speichern();
  }
  umbau();

  // Speicher-Wächter: Warnt, wenn der Fortschritt auf diesem Gerät nicht gespeichert werden kann (privater Modus, gesperrter Speicher),
  // und bittet den Browser, die Daten dauerhaft zu behalten (gegen automatisches Aufräumen).
  function speicherPruefen() {
    try {
      localStorage.setItem(SPEICHER + "-test", "1");
      if (localStorage.getItem(SPEICHER + "-test") !== "1") throw new Error("lesen");
      localStorage.removeItem(SPEICHER + "-test");
    } catch (e) { return false; }
    return true;
  }
  function speicherWarnung() {
    if (speicherPruefen()) {
      try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* egal */ }
      return;
    }
    warnBanner((stand.niveau === "E" ? "⚠️ Your progress cannot be saved on this device. Private mode is probably on. Open the app in a normal browser window, best from your home screen, or your points are gone when you close it." : "⚠️ Dein Fortschritt kann auf diesem Gerät nicht gespeichert werden (Hilfe: Your progress cannot be saved). Wahrscheinlich ist der private Modus an. Öffne die App im normalen Browser-Fenster, am besten über „Zum Home-Bildschirm“, sonst sind deine Punkte beim Schließen weg."));
  }
  function warnBanner(meldung) {
    const box = document.createElement("div");
    box.className = "speicher-warnung"; box.setAttribute("role", "alert");
    const text = document.createElement("span");
    text.textContent = meldung;
    const zu = document.createElement("button");
    zu.type = "button"; zu.textContent = "✕"; zu.setAttribute("aria-label", "OK");
    zu.onclick = () => box.remove();
    box.append(text, zu);
    document.body.prepend(box);
  }
  speicherWarnung();
  if (manipuliert) warnBanner("⚠️ Dein Spielstand passte nicht mehr zu sich selbst und wurde zurückgesetzt (Your progress was reset). Punkte bekommst du nur durch Üben in der App.");

  /* ---------- Niveau G / E ---------- */
  const E = () => stand.niveau === "E";
  const T = (g, e) => (E() ? e : g);
  const tx = (o) => (o == null ? "" : typeof o === "string" ? o : E() ? o.E : o.G);
  const HILFE = () => T("Ich helfe dir:", "Let me help you:");
  const NOCHMAL = () => T("Probier's nochmal!", "Try again!");

  let ansicht = null;  // aktuelle Seite – wird beim Umschalten G/E neu gezeichnet
  let leise = false;   // beim Neuzeichnen nichts abspielen
  function setzeNiveau(n) {
    stand.niveau = n; speichern();
    document.querySelectorAll(".niveau button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.niveau === n)));
    document.documentElement.lang = n === "E" ? "en" : "de";
    dialogTexte();
    if (ansicht) { leise = true; try { ansicht(); } finally { leise = false; } }
  }
  document.querySelectorAll(".niveau button").forEach((b) => b.addEventListener("click", () => setzeNiveau(b.dataset.niveau)));

  /* ---------- Lob (Mr. Alex' Stimme) ---------- */
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
    if (!leise && r.audio && !ereignisse.some(grossEreignis)) { // großes Pop-up mit eigener Stimme ansteht: kein Lob davor
      vorLob = r.audio;
      setTimeout(() => { if (vorLob === r.audio) { vorLob = null; spiele([r.audio]); } }, 0);
    }
    return r.text;
  }
  function lob(stark) {
    // Kurze Sprüche für normale Antworten; starke für jede 5. richtige Antwort in Folge und fertige Teile (stark = true)
    richtigSerie++; comboPruefen();
    const art = fehlerSerie >= 2 && RUF.doch ? "doch" : (stark || richtigSerie % 5 === 0) && RUF.stark ? "stark" : "lob";
    fehlerSerie = 0;
    return ruf(art);
  }

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
  // Notlösung: Sprachausgabe des Geräts (amerikanisch), solange eine Audiodatei fehlt
  const FRAU = /samantha|zira|aria|jenny|ava|allison|susan|female|joanna|salli|kendra|kimberly|ivy|emma|michelle/i;
  function geraeteStimme(stimme) {
    const alle = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
    const us = alle.filter((v) => /en[-_]US/i.test(v.lang));
    const kandidaten = us.length ? us : alle.filter((v) => v.lang.startsWith("en"));
    return kandidaten.find((v) => (stimme === "f") === FRAU.test(v.name)) || kandidaten[0] || null;
  }
  function sprich(text, stimme) {
    return new Promise((fertig) => {
      if (!window.speechSynthesis) return fertig(0);
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US"; u.rate = 0.9 * tempo();
      const v = geraeteStimme(stimme);
      if (v) u.voice = v;
      const start = Date.now();
      let erledigt = false;
      const ende = () => { if (erledigt) return; erledigt = true; clearTimeout(notbremse); setTimeout(() => fertig((Date.now() - start) / 1000), 350); };
      const notbremse = setTimeout(ende, 2500 + text.split(/\s+/).length * 700);
      u.onend = ende; u.onerror = ende;
      speechSynthesis.speak(u);
    });
  }
  // Einträge: Dateipfad (String) oder { text, stimme } für die Geräte-Stimme
  // Ende der zuletzt gestarteten Wiedergabe. spiele(…, { warten: true }) reiht sich dahinter ein, statt die laufende abzuschneiden
  // (für Belohnungs-Stimmen: Lob, Schlusssatz, Pop-up). Seitenwechsel oder „Weiter“ im Pop-up (stopp) bricht auch wartende ab.
  let audioEnde = Promise.resolve();
  function spiele(dateien, opt = {}) {
    if (leise) return Promise.resolve(null);
    if (vorLob) { dateien = [vorLob, ...dateien]; vorLob = null; }
    if (!opt.warten) stopp();
    const meinLauf = lauf;
    let gesamt = 0;
    const davor = opt.warten ? audioEnde : Promise.resolve();
    const lauf_ = davor.then(() => dateien.filter(Boolean).reduce((kette, datei) => kette.then(() => new Promise((fertig) => {
      if (meinLauf !== lauf) return fertig();
      if (typeof datei === "object") return sprich(datei.text, datei.stimme).then((d) => { gesamt += d; fertig(); });
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
  const tonSatz = (s) => s.audio || { text: s.en.replace(/[–—]/g, ","), stimme: s.stimme };
  const tonWort = (v) => v.audio || { text: v.en.replace(/\((AE|BE|infml|pl)\)/g, "").replace(/\bsth\./g, "something").replace(/\bsb\./g, "somebody"), stimme: v.stimme };

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
  function zeige(...inhalt) { dialogLauf++; stopp(); app.replaceChildren(...inhalt.filter(Boolean)); if (!leise) window.scrollTo(0, 0); hwLeiste(); }
  function mischen(liste) {
    const a = liste.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  // Tipp-Prüfung (wie Klasse 6): 0 genau · 1 ein Fehler (Vertauschen zählt als einer) · 2 mehr; bis 2 Buchstaben muss es genau stimmen
  const normT = (t) => String(t).toLowerCase().replace(/[’`´]/g, "'").replace(/[.,!?;:"“”]/g, "").replace(/\s+/g, " ").trim();
  function abstand(a, b) { // Damerau-Levenshtein
    const d = Array.from({ length: a.length + 1 }, (_, i) => { const z = new Array(b.length + 1).fill(0); z[0] = i; return z; });
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[a.length][b.length];
  }
  function pruefeTipp(eingabe, ziele) {
    const e = normT(eingabe); let best = 9;
    for (const z of [].concat(ziele)) { const zz = normT(z); best = Math.min(best, zz.length <= 2 ? (e === zz ? 0 : 9) : abstand(e, zz)); }
    return best > 1 ? 2 : best;
  }
  function tippFeld(pruefen) {
    const feld = el("input", { type: "text", class: "eingabe", lang: "en", inputmode: "text", autocomplete: "off", autocapitalize: "off", autocorrect: "off",
      spellcheck: "false", "aria-label": T("Deine Antwort", "Your answer"), enterkeyhint: "done",
      onkeydown: (e) => { if (e.key === "Enter") { e.stopPropagation(); e.preventDefault(); los(); } } });
    const knopf_ = knopf(T("Prüfen", "Check"), () => los(), "haupt");
    const los = () => { if (feld.value.trim()) pruefen(feld.value, { feld, knopf: knopf_ }); };
    return el("div", { class: "eingabe-bereich" }, el("div", { class: "knopfreihe" }, feld, knopf_));
  }
  const kategorie = (nr) => D.kategorien.find((k) => k.nr === nr);
  const vokabel = (id) => D.vokabeln.find((v) => v.id === id);
  // Sperren (Sprechzeit, Denkzeit, „erst richtig antworten“) gelten im Programm, nicht nur am Knopf: Wer im Browser das disabled-Attribut
  // entfernt, kommt trotzdem nicht weiter. GESPERRT ist von außen (Konsole) nicht erreichbar.
  const GESPERRT = new WeakSet();
  const sperrt = (k) => { GESPERRT.add(k); k.disabled = true; return k; };
  const entsperrt = (k) => { GESPERRT.delete(k); k.disabled = false; return k; };
  const knopf = (text, fn, art) => el("button", { class: "knopf" + (art ? " " + art : ""), onclick: (e) => { if (GESPERRT.has(e.currentTarget)) return; fn(e); } }, text);
  const weiterKnopf = (fn) => knopf(T("Weiter ➜", "Next ➜"), fn || naechstes, "haupt weiter");
  /* ---------- Sprechzeit: „Weiter“ erst nach Hören + Nachsprechen, „Lösung“ erst nach Denkzeit ----------
     Der gesperrte Knopf füllt sich sichtbar. Schon freigegebene Sätze (Teil:Position) bleiben frei,
     z. B. nach „Zurück“ oder beim Umschalten. */
  const freiSchluessel = () => lage.teil + ":" + lage.pos;
  function sperre(k) {
    if (!lage.frei) lage.frei = new Set();
    if (lage.frei.has(freiSchluessel())) return k;
    sperrt(k); k.classList.add("wartet");
    return k;
  }
  function gibFrei(k, sek, merken = true) {
    if (!GESPERRT.has(k) || k.dataset.frei) return;
    k.dataset.frei = "1";
    k.style.setProperty("--warte", sek.toFixed(1) + "s");
    k.classList.add("laeuft");
    const menge = lage.frei, schluessel = freiSchluessel();
    setTimeout(() => { entsperrt(k); k.classList.remove("wartet", "laeuft"); if (merken && menge) menge.add(schluessel); }, sek * 1000);
  }
  // Nachsprech-Pause = Länge der Aufnahme (so lange sie bei der gewählten Geschwindigkeit wirklich läuft); nur bei ganz kurzen Aufnahmen gilt ein Minimum (70 % des früheren)
  const sprechDauer = (d, min = 3) => Math.max(min * 0.7, d) * eile();
  const denkzeit = (text) => Math.min(8, Math.max(3, 2 + String(text).split(/\s+/).length * 0.35)) * eile();
  const wennFrei = (k, fn) => () => { if (!k.disabled && !GESPERRT.has(k)) fn(); };
  // Prüfung C: Sprechteile, die viel schneller fertig sind als möglich, bringen keine Punkte
  function zuSchnell(teil) {
    const proEintrag = SPRECH_MIN[teil.art];
    if (!proEintrag || !lage.start) return false;
    return (Date.now() - lage.start) / 1000 < laenge(teil) * proEintrag * eile();
  }
  const QUIZ_MIN = 2.5; // Quizteile: blindes Durchklicken (alle Antworten probieren) bringt keine Punkte
  const SPRECH_MIN = { lr: 2, vok_lernen: 1.5, verbform: QUIZ_MIN, auswahl: QUIZ_MIN, beae_quiz: QUIZ_MIN, vok_def: QUIZ_MIN, vok_abfrage: QUIZ_MIN };
  const istQuiz = (teil) => (SPRECH_MIN[teil.art] || 0) === QUIZ_MIN; // Sekunden pro Satz/Wort mindestens; Dialoge: „Weiter“ erst nach dem ganzen Dialog
  // Ansage: im G-Kurs Englisch + Deutsch, im E-Kurs nur Englisch
  const ansage = (en, de) => el("div", { class: "ansage" }, el("p", { lang: "en" }, en), !E() && de && el("p", { class: "ansage-de", lang: "de" }, de));
  // „Noch einfacher“-Hilfe; wer sie benutzt, bekommt für diesen Teil keinen „ohne Hilfe“-Bonus (aber keinen Abzug)
  const tipp = (text, fn) => el("button", { class: "knopf leise tipp", onclick: (e) => { if (lage) lage.hilfe = true; fn(e); } }, "💡 " + text);

  /* ---------- Startseite ---------- */
  // Countdown in Wochen bis zum nächsten Termin (D.termin, in klasse9_bauen.py): zählt Kalenderwochen, Montag bis Sonntag
  function terminZeile() {
    const t = D.termin;
    if (!t) return null;
    const ziel = new Date(t.datum + "T12:00:00"), jetzt = heute();
    const wochen = Math.round((montag(ziel) - montag(jetzt)) / (7 * 86400000));
    const tage = Math.round((ziel - new Date(iso(jetzt) + "T12:00:00")) / 86400000);
    if (tage < 0) return null;
    const text = tage === 0 ? T(`Heute ist ${t.name} – viel Erfolg!`, `Today is ${t.name} – good luck!`)
      : wochen === 0 ? T(`Diese Woche ist ${t.name}.`, `${t.name} is this week.`)
      : wochen === 1 ? T(`Nächste Woche ist ${t.name}.`, `${t.name} is next week.`)
      : T(`Noch ${wochen} Wochen bis ${t.name}`, `${wochen} weeks until ${t.name}`);
    return el("p", { class: "termin", role: "status" }, "📅 " + text);
  }

  // ✨ „Neu“: 14 Tage ab neu_ab (Kategorie oder Gruppe, in klasse9_bauen.py) – Schild auf Kachel und Gruppe, Zeile auf der Startseite
  const istNeu = (o) => { if (!o || !o.neu_ab) return false; const t = iso(heute()); return t >= o.neu_ab && t < iso(plusTage(new Date(o.neu_ab + "T12:00:00"), 14)); };
  const neuSchild = () => el("span", { class: "neu-schild" }, "✨ " + T("Neu", "New"));
  function neuZeile() {
    const spruenge = [];
    D.kategorien.forEach((k) => {
      if (istNeu(k)) spruenge.push(knopf(`${k.symbol} ${k.titel}`, () => starteKategorie(k.nr), "leise"));
      (k.gruppen || []).forEach((g, i) => { if (istNeu(g)) spruenge.push(knopf(`${g.symbol ? g.symbol + " " : ""}${g.name}`, () => starteGruppe(k, i), "leise")); });
    });
    if (!spruenge.length) return null;
    return el("div", { class: "neu-zeile", role: "status" }, el("span", { class: "neu-text" }, "✨ " + T("Neu diese Woche:", "New this week:")), spruenge);
  }

  function startseite() {
    lage = null; ansicht = startseite;
    zeige(
      el("header", { class: "gruss" },
        el("h1", { lang: "en" }, "Hi! Let's practise together."),
        el("p", { class: "klein" }, T("Wähl eine Kategorie. Oben rechts stellst du deinen Kurs ein: G oder E. Dein Mr. Alex",
          "Choose a category. Top right: choose your course, G or E. Your Mr. Alex"))),
      hwZeile(), gymKarte(),
      neuZeile(), powerupZeile(),
      el("nav", { class: "kacheln raster9", "aria-label": T("Kategorien", "Categories") },
        D.kategorien.map((k) => {
          const auf = faellige(k.nr + "|") > 0, fertig = stand.erledigt.includes(k.nr) && !auf, neu = istNeu(k) || (k.gruppen || []).some(istNeu), hw = hwBei(k.nr);
          return el("button", { class: "kachel" + (fertig ? " erledigt" : "") + (auf ? " powerup" : "") + (k.bald ? " bald" : "") + (neu ? " frisch" : "") + (hw ? " hw" : "") + (k.farbe ? " " + k.farbe : ""),
            onclick: () => starteKategorie(k.nr), "aria-label": `${k.nr} ${k.titel}${k.bald ? T(" (kommt bald)", " (coming soon)") : ""}${neu ? T(" (neu)", " (new)") : ""}${auf ? " (Power Up)" : ""}${hw ? " (Homework)" : ""}${fertig ? " ✓" : ""}` },
            el("span", { class: "sym", "aria-hidden": "true" }, k.symbol),
            el("span", { class: "titel", lang: "en" }, k.titel),
            el("span", { class: "unter" }, tx(k.unter)),
            k.bald && el("span", { class: "bald-schild" }, T("kommt bald", "coming soon")),
            hw && hwSchild(), neu && neuSchild(), auf && powerupSchild(),
            fertig && el("span", { class: "haken", "aria-hidden": "true" }, "✓"));
        })),
      el("div", { class: "knopfreihe" }, knopf(T("✏️ Frage für meinen Lehrer", "✏️ Question for my teacher"), fragenOeffnen)));
    app.querySelector(".gruss").append(statusleiste());
    const tz = terminZeile(); if (tz) app.querySelector(".gruss").append(tz);
  }

  function starteKategorie(nr) {
    const k = kategorie(nr);
    if (k.bald) return platzhalter(k);
    if (k.spiele) return zeigeSpiele(k);
    if (k.vokabeln) return zeigeUnits(k);
    zeigeGruppen(k);
  }

  function platzhalter(k) {
    lage = null; ansicht = () => platzhalter(k);
    zeige(kopf(k), el("section", { class: "platzhalter" },
      ansage("Coming soon!", "Daran baue ich gerade. Schau bald wieder rein!"),
      knopf(T("Zur Startseite", "Back to start"), startseite, "haupt")));
  }

  /* ---------- Gruppen (Themen) einer Kategorie ---------- */
  const gruppenFertig = (nr) => (stand.gruppen && stand.gruppen[nr]) || [];

  function gruppenKachel(k, g, schluessel, nrText, onclick) {
    const auf = faellige(`${k.nr}|${schluessel}|`) > 0, ok = gruppenFertig(k.nr).includes(schluessel) && !auf, neu = istNeu(g), hw = hwBei(k.nr, `${k.nr}|${schluessel}|`);
    return el("button", { class: "kachel" + (ok ? " erledigt" : "") + (auf ? " powerup" : "") + (neu ? " frisch" : "") + (hw ? " hw" : ""), onclick,
      "aria-label": `${g.name}${neu ? T(" (neu)", " (new)") : ""}${auf ? " (Power Up)" : ""}${hw ? " (Homework)" : ""}${ok ? " ✓" : ""}` },
      el("span", { class: "nr" }, nrText),
      el("span", { class: "titel", lang: "en" }, g.name),
      g.unter && el("span", { class: "unter", lang: "en" }, g.unter),
      g.symbol && el("span", { class: "vorschau", "aria-hidden": "true" }, g.symbol),
      hw && hwSchild(), neu && neuSchild(), auf && powerupSchild(),
      ok && el("span", { class: "haken", "aria-hidden": "true" }, "✓"));
  }

  function zeigeGruppen(k) {
    lage = null; ansicht = () => zeigeGruppen(k);
    zeige(kopf(k),
      ansage("Choose a topic.", "Wähl ein Thema."),
      el("nav", { class: "kacheln gruppen" }, k.gruppen.map((g, i) =>
        gruppenKachel(k, g, g.name, "Topic " + (i + 1), () => starteGruppe(k, i)))));
  }

  // Vocabulary: Unit wählen, dann Abschnitt; dahinter die festen Gruppen der Kategorie (BE vs AE)
  const aktuelleUnit = () => (stand.unit && D.units[stand.unit].length ? stand.unit : "2");
  const unitReiter = (zeichne) => el("div", { class: "reiter", role: "tablist" }, Object.keys(D.units).map((u) =>
    el("button", { class: "reiter-knopf", role: "tab", "aria-selected": String(u === aktuelleUnit()),
      onclick: () => { stand.unit = u; speichern(); zeichne(); } }, "Unit " + u)));
  function zeigeUnits(k) {
    lage = null; ansicht = () => zeigeUnits(k);
    const unit = aktuelleUnit(), gruppen = D.units[unit];
    zeige(kopf(k), unitReiter(() => zeigeUnits(k)),
      gruppen.length ? ansage("Choose a part of the unit. The words come in the same order as in your book.",
        "Wähl einen Abschnitt. Die Wörter kommen in derselben Reihenfolge wie im Buch.")
        : ansage("Coming soon!", "Diese Unit kommt bald."),
      el("nav", { class: "kacheln gruppen" },
        gruppen.map((g, i) => gruppenKachel(k, g, `u${unit}:${g.name}`, `${g.vokabeln.length} words`, () => starteUnitGruppe(k, unit, i))),
        (k.gruppen || []).map((g, i) => gruppenKachel(k, g, g.name, g.reihe || "Topic " + (i + 1), () => starteGruppe(k, i)))));
  }

  /* ---------- Teile und Lage ---------- */
  function teileVon(schritte) {
    const t = [];
    schritte.forEach((s) => {
      if (s.art === "lr") (s.stufen || [1, 2, 3]).forEach((stufe) =>
        t.push({ art: "lr", stufe, saetze: s.saetze, basis: s.name || "", name: (s.name ? s.name + " · " : "") + "Step " + stufe }));
      else t.push(s);
    });
    return t;
  }

  let lage = null; // { nr, gruppe (Schlüssel), titel, teile, teil, pos, vok, reihe, vq, ende, abspielen, weiter, zurueckZu }

  function neueLage(werte) { lage = Object.assign({ teil: 0, pos: 0 }, werte); return lage; }
  function teilZuruecksetzen() { lage.reihe = lage.vq = null; lage.hilfe = false; }

  // Vokabel-Abschnitt: Wörter, Sätze in 3 Stufen, Find the word, Abfrage in beide Richtungen
  function vokSchritte(vok) {
    const schritte = [{ art: "vok_lernen", name: "Words" },
      { art: "lr", name: "Sentences", saetze: vok.map((v) => v.satz) }];
    if (vok.some((v) => v.def)) schritte.push({ art: "vok_def", name: "Find the word" });
    schritte.push({ art: "vok_abfrage", name: "EN → DE", richtung: "en_de" }, { art: "vok_abfrage", name: "DE → EN", richtung: "de_en" });
    return schritte;
  }
  function starteGruppe(k, i) {
    const g = k.gruppen[i];
    const vok = g.vokabeln ? g.vokabeln.map(vokabel) : null; // Gruppe aus einer Wortliste (IDs aus vokabeln.tsv)
    neueLage({ nr: k.nr, gruppe: g.name, titel: g.name, vok, teile: teileVon(vok ? vokSchritte(vok) : g.schritte),
      zurueckZu: () => (k.vokabeln ? zeigeUnits(k) : zeigeGruppen(k)) });
    zeigeTeil();
  }
  function starteUnitGruppe(k, unit, i) {
    const g = D.units[unit][i];
    const vok = g.vokabeln.map(vokabel);
    const schritte = vokSchritte(vok);
    neueLage({ nr: k.nr, gruppe: `u${unit}:${g.name}`, titel: `Unit ${unit} · ${g.name}`, vok, teile: teileVon(schritte),
      zurueckZu: () => zeigeUnits(k) });
    zeigeTeil();
  }

  /* ---------- Fortschritt pro Teil ---------- */
  // stand.teile[schluessel] = { am: "JJJJ-MM-TT", s: Stufe } – Stufe steigt bei jedem Power Up (Wiederholung eines fälligen Teils)
  function teilSchluessel(i) { return `${lage.nr}|${lage.gruppe}|${i}`; }
  function istFertig(i) { return !!(stand.teile && stand.teile[teilSchluessel(i)]); }
  const teilFaellig = (i) => faellig(stand.teile && stand.teile[teilSchluessel(i)]);
  function teilFertig(i, aufladen) {
    stand.teile = stand.teile || {};
    const k = teilSchluessel(i), alt = stand.teile[k];
    if (!alt) stand.teile[k] = { am: iso(heute()), s: 0 };
    else if (aufladen) stand.teile[k] = { am: iso(heute()), s: (alt.s || 0) + 1 };
    speichern();
  }
  const alleTeileFertig = () => lage.teile.every((_, i) => istFertig(i));

  /* ---------- ⚡ Power Up (docs/nachhaltigkeit-entwurf.md): Erledigtes wird nach 30 / 60 / 120 Tagen wieder fällig ----------
     Fällig = gelbes Schild statt grün; erneut durchmachen gibt Wiederholungspunkte, Stufe +1, kürzere Timer. Ab Stufe 3 bleibt es grün.
     GLN-Kopplung (D.termin.powerup): 14 Tage vor dem Termin ist alles fällig, was nicht in diesem Fenster erledigt oder aufgeladen wurde. */
  const FRIST = [30, 60, 120];
  const POWERUP_FENSTER = 14;
  function faellig(e) {
    if (!e || typeof e !== "object" || !e.am || e.s >= 3) return false;
    const t = iso(heute());
    if (t >= iso(plusTage(new Date(e.am + "T12:00:00"), FRIST[e.s] || FRIST[2]))) return true;
    const te = D.termin;
    if (!te || !te.powerup || !te.datum) return false;
    const start = iso(plusTage(new Date(te.datum + "T12:00:00"), -POWERUP_FENSTER));
    return t >= start && t <= te.datum && e.am < start;
  }
  // Fällige Teile hinter einem Schlüsselanfang („2|“ = ganze Kategorie, „2|u2:Start|“ = ein Abschnitt)
  const faellige = (anfang) => Object.entries(stand.teile || {}).filter(([k, e]) => k.startsWith(anfang) && faellig(e)).length;
  const powerupSchild = () => el("span", { class: "powerup-schild" }, "⚡ Power Up");
  function powerupZeile() {
    const n = faellige("");
    if (!n) return null;
    const erste = D.kategorien.find((k) => faellige(k.nr + "|"));
    return el("div", { class: "powerup-zeile", role: "status" },
      el("span", { class: "powerup-text" }, n === 1 ? T("⚡ 1 Teil fast leer – aufladen!", "⚡ 1 part running low – power up!")
        : T(`⚡ ${n} Teile fast leer – aufladen!`, `⚡ ${n} parts running low – power up!`)),
      erste && knopf("⚡ Power Up", () => starteKategorie(erste.nr), "leise"));
  }
  // Alte Einträge (true, auch aus umbau()) bekommen Datum und Stufe 0; danach ist der Stand mit Version 2 gesiegelt (einmalig, idempotent)
  function powerupMigration() {
    let geaendert = stand._v !== 3;
    for (const k of Object.keys(stand.teile || {})) if (typeof stand.teile[k] !== "object") { stand.teile[k] = { am: iso(heute()), s: 0 }; geaendert = true; }
    if (geaendert) speichern();
  }
  /* ---------- 📝 Homework (inhalte/klasse9/hausaufgabe.tsv → D.hausaufgaben, Schema in inhalte/klasse9/LIESMICH.md) ----------
     Gilt von ≤ heute ≤ bis (Ortszeit). Dann: Knopf „📝 HW“ in der Leiste, Chip-Zeile über dem Word Gym, Schild an Kachel, Abschnitt und Teil.
     Eine Hausaufgabe ist eine Kette von Zielen (h.ziele, Reihenfolge wie in der TSV, `2/u1` = alle Abschnitte der Unit); Knopf und Chip
     springen zum ersten offenen Ziel, der Chip zählt „HW 1/4“. Jeder Teil der Hausaufgabe bringt im Zeitraum +50 % auf die Teil-Punkte
     (aufgerundet) – einmal je Teil und Hausaufgabe (stand.hw["<von>|<ziel>"] = [Teilschlüssel …], steckt im Siegel). Ziel erledigt = alle
     Teile fertig oder in diesem Zeitraum gemacht; alles erledigt → einmalige Feier (stand.hw["<von>|<ziel>|fertig"] = true). */
  const hwAktiv = () => { const t = iso(heute()); return (D.hausaufgaben || []).find((h) => h.von <= t && t <= h.bis) || null; };
  const hwId = (h) => `${h.von}|${h.ziel}`;
  const hwGemacht = (h) => (stand.hw && stand.hw[hwId(h)]) || [];
  const hwSchluessel = (h) => h.ziele.flatMap((z) => z.schluessel);
  const hwTrifft = (k) => { const h = hwAktiv(); return !!h && hwSchluessel(h).includes(k); };
  const hwBei = (nr, anfang) => { const h = hwAktiv(); return !!h && h.ziele.some((z) => z.nr === nr && (!anfang || z.schluessel.some((k) => k.startsWith(anfang)))); };
  const hwZielFertig = (h, z) => z.schluessel.length > 0 && z.schluessel.every((k) => (stand.teile && stand.teile[k]) || hwGemacht(h).includes(k));
  const hwOffen = (h) => h.ziele.find((z) => !hwZielFertig(h, z)) || null; // erstes offenes Ziel der Kette
  const hwErledigt = (h) => h.ziele.length > 0 && !hwOffen(h);
  const hwZaehler = (h) => `${h.ziele.filter((z) => hwZielFertig(h, z)).length}/${h.ziele.length}`;
  const hwSchild = () => el("span", { class: "hw-schild" }, "📝 HW");
  const hwDatum = (t) => { const d = new Date(t + "T12:00:00"); return E() ? `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()]} ${d.getDate()} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()]}`
    : `${["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}.`; };
  function hwBonus(basis) {
    const h = hwAktiv();
    if (!h || !lage || !lage.teile) return 0;
    const k = teilSchluessel(lage.teil);
    if (!hwSchluessel(h).includes(k)) return 0;
    const neu = !hwGemacht(h).includes(k);
    stand.hw = stand.hw || {};
    if (neu) stand.hw[hwId(h)] = [...hwGemacht(h), k];
    const f = hwId(h) + "|fertig"; // letztes Ziel geschafft → einmalige Feier
    if (!stand.hw[f] && hwErledigt(h)) {
      stand.hw[f] = true;
      ereignisse.push({ art: "feier", symbol: "📝", titel: "Homework done!",
        text: T(`Alle Teile der Hausaufgabe bis ${hwDatum(h.bis)} sind erledigt. Stark!`, `All parts of your homework (due ${hwDatum(h.bis)}) are done. Great job!`), ton: SP.texte.gym_fini });
    }
    return neu ? Math.ceil(basis / 2) : 0;
  }
  // Gruppe über ihren Schlüssel öffnen: Unit-Abschnitt „u2:Start“ oder feste Gruppe (Name)
  function hwOeffne(k, schluessel) {
    const m = schluessel.match(/^u(\d+):(.*)$/);
    if (m) { stand.unit = m[1]; starteUnitGruppe(k, m[1], D.units[m[1]].findIndex((g) => g.name === m[2])); }
    else starteGruppe(k, k.gruppen.findIndex((g) => g.name === schluessel));
  }
  // Direktsprung zu einem Ziel: Kategorie, Gruppe oder Teil – bei ganzer Kategorie/Gruppe zur ersten offenen Gruppe / zum ersten offenen Teil
  function hwStart(z) {
    const k = kategorie(z.nr), offen = (x) => !(stand.teile && stand.teile[x]);
    const gs = kategorieGruppen(k).filter((s) => z.schluessel.some((x) => x.startsWith(`${z.nr}|${s}|`))); // Gruppen des Ziels
    const g = z.gruppe != null ? z.gruppe : gs.find((s) => z.schluessel.some((x) => x.startsWith(`${z.nr}|${s}|`) && offen(x))) || gs[0];
    if (g == null) return starteKategorie(z.nr);
    hwOeffne(k, g);
    const i = z.teil != null ? z.teil : lage.teile.findIndex((_, i) => z.schluessel.includes(teilSchluessel(i)) && !istFertig(i));
    if (i > 0) springe(i);
  }
  const hwWeiterStart = () => { const h = hwAktiv(), z = h && hwOffen(h); if (z) hwStart(z); };
  // Knopf „📝 HW“ oben in der Leiste neben dem Tempo-Knopf (bei jedem Seitenwechsel aktualisiert); langes Drücken öffnet die Übersicht
  function hwLeiste() {
    const h = hwAktiv(), alt = document.getElementById("hw");
    if (!h) { if (alt) alt.remove(); return; }
    const fertig = hwErledigt(h);
    let lang = null, gehalten = false;
    const k = alt || el("button", { id: "hw", type: "button", class: "tempo-knopf hw-knopf",
      onpointerdown: () => { gehalten = false; clearTimeout(lang); lang = setTimeout(() => { gehalten = true; hwUebersicht(); }, 500); },
      onpointerup: () => clearTimeout(lang), onpointerleave: () => clearTimeout(lang), onpointercancel: () => clearTimeout(lang),
      oncontextmenu: (e) => e.preventDefault(),
      onclick: () => { if (gehalten) { gehalten = false; return; } hwWeiterStart(); } });
    k.textContent = fertig ? "📝 HW ✓" : "📝 HW"; k.classList.toggle("fertig", fertig);
    k.setAttribute("aria-label", (fertig ? T("Hausaufgabe erledigt: ", "Homework done: ") : T("Hausaufgabe: ", "Homework: ")) + h.text + T(" (lange drücken: Übersicht)", " (press and hold: overview)"));
    if (!alt) { const t = document.getElementById("tempo"); if (t) t.after(k); }
  }
  // Chip-Zeile auf der Startseite direkt über dem Word Gym: „HW 1/4“ + Text, ▾ öffnet die Übersicht
  function hwZeile() {
    const h = hwAktiv();
    if (!h) return null;
    const fertig = hwErledigt(h);
    return el("div", { class: "hw-zeile" + (fertig ? " fertig" : ""), role: "status" },
      el("button", { class: "hw-chip", onclick: hwWeiterStart, "aria-label": (fertig ? T("Hausaufgabe erledigt: ", "Homework done: ") : T(`Hausaufgabe öffnen (${hwZaehler(h)} erledigt): `, `Open homework (${hwZaehler(h)} done): `)) + h.text }, fertig ? "📝 HW ✓" : `📝 HW ${hwZaehler(h)}`),
      el("span", { class: "hw-text", title: h.text }, fertig ? T(`Erledigt: ${h.text}`, `Done: ${h.text}`) : `${h.text} · ${T("bis", "due")} ${hwDatum(h.bis)} · +50 %`),
      el("button", { class: "hw-liste-knopf", onclick: hwUebersicht, "aria-label": T("Alle Hausaufgaben zeigen", "Show all homework tasks") }, "▾"));
  }
  // Übersicht aller Ziele der Kette: ✓ / ○, Name, ▶ Sprung
  const hwDialog = el("dialog", { class: "feier hw-liste", "aria-label": "Homework" });
  document.body.append(hwDialog);
  function hwUebersicht() {
    const h = hwAktiv();
    if (!h) return;
    const zu = () => hwDialog.close();
    hwDialog.replaceChildren(
      el("h2", {}, `📝 Homework · ${T("bis", "due")} ${hwDatum(h.bis)}`),
      el("p", { class: "hw-liste-text" }, h.text),
      el("p", { class: "klein" }, T("+50 % Punkte für jeden Teil", "+50 % points for every part")),
      el("ul", { class: "hw-liste-ziele" }, h.ziele.map((z) => { const f = hwZielFertig(h, z);
        return el("li", { class: f ? "fertig" : "" },
          el("span", { class: "hw-haken", "aria-label": f ? T("erledigt", "done") : T("offen", "open") }, f ? "✓" : "○"),
          el("span", { class: "hw-name", lang: "en" }, z.name),
          knopf("▶", () => { zu(); hwStart(z); }, "leise")); })),
      el("div", { class: "knopfreihe" }, knopf(T("Schließen", "Close"), zu, "haupt")));
    hwDialog.showModal();
  }
  // Abschluss-Seiten: „Nächste Hausaufgabe ➜“, wenn der eben fertige Teil ein Ziel abgeschlossen hat und noch eins offen ist
  function hwWeiterKnopf(k) {
    const h = hwAktiv();
    if (!h) return null;
    const ziele = h.ziele.filter((z) => z.schluessel.includes(k));
    if (!ziele.length || !ziele.every((z) => hwZielFertig(h, z)) || !hwOffen(h)) return null;
    return knopf(T("📝 Nächste Hausaufgabe ➜", "📝 Next homework task ➜"), hwWeiterStart, "hw-weiter");
  }

  // Timer bei Wiederholung kürzer: Teil hat schon einen Eintrag → Faktor je Stufe (Word Gym bleibt, hat kein lage.tempoFaktor)
  const TEMPO = [0.5, 0.35, 0.25];
  function tempoFaktor(i) { const e = stand.teile && stand.teile[teilSchluessel(i)]; return e ? TEMPO[Math.min(e.s || 0, 2)] : 1; }
  const eile = () => (lage && lage.tempoFaktor) || 1;

  /* ---------- Springen, Vor und Zurück ---------- */
  function springe(i) { lage.teil = i; lage.pos = 0; lage.ende = false; teilZuruecksetzen(); zeigeTeil(); }
  function zurueck() {
    if (lage.pos > 0) { lage.pos--; return zeigeTeil(); }
    if (lage.teil === 0) return;
    lage.teil--; teilZuruecksetzen();
    const t = lage.teile[lage.teil];
    lage.pos = ["lr", "vok_lernen"].includes(t.art) ? laenge(t) - 1 : 0;
    zeigeTeil();
  }
  function navErgaenzen(zurueckFn) {
    if (!lage) return;
    const z = knopf(T("◀ Zurück", "◀ Back"), zurueckFn || zurueck);
    z.classList.add("zurueck-knopf");
    if (!zurueckFn && lage.teil === 0 && lage.pos === 0) z.disabled = true;
    const w = app.querySelector("button.weiter");
    if (w && !w.closest("[hidden]")) w.before(z);
    else app.append(el("div", { class: "knopfreihe navleiste" }, z));
    const jetzt = app.querySelector(".sprung.jetzt");
    if (jetzt && jetzt.scrollIntoView && !leise) jetzt.scrollIntoView({ block: "nearest", inline: "center" });
  }

  function kopf(k) {
    const zurueckZu = lage && lage.zurueckZu;
    return el("header", { class: "kopf" },
      knopf(zurueckZu ? T("← Themen", "← Topics") : T("← Start", "← Start"), zurueckZu || startseite, "leise"),
      el("h1", { lang: "en" }, `${k.titel}` + (lage ? ` · ${lage.titel}` : "")),
      lage && lage.teile && !lage.ende && hwTrifft(teilSchluessel(lage.teil)) && hwSchild(),
      lage && lage.teile && !lage.ende && teilFaellig(lage.teil) && powerupSchild(),
      lage && sprungleiste());
  }

  function sprungleiste() {
    const nochNichts = !lage.teile.some((_, i) => istFertig(i));
    const ZIFFERN = ["①", "②", "③", "④"];
    const sprung = (i, text) => {
      const t = lage.teile[i], auf = teilFaellig(i), fertig = istFertig(i) && !auf, jetzt = i === lage.teil && !lage.ende, hw = hwTrifft(teilSchluessel(i));
      const start = nochNichts && i === 0;
      return el("button", { class: "sprung" + (jetzt ? " jetzt" : "") + (fertig ? " fertig" : "") + (auf ? " powerup" : "") + (start ? " start" : "") + (hw ? " hw" : ""),
        "aria-current": jetzt ? "step" : false, title: t.name,
        "aria-label": `${t.name}${fertig ? " ✓" : ""}${auf ? " (Power Up)" : ""}${hw ? " (Homework)" : ""}${start ? T(" – hier starten", " – start here") : ""}`,
        onclick: () => springe(i) }, text);
    };
    const eintraege = [];
    for (let i = 0; i < lage.teile.length;) {
      const t = lage.teile[i];
      if (t.art === "lr") {
        const gruppe = el("li", { class: "sprung-gruppe" }, el("span", { class: "sprung-label", lang: "en" }, t.basis || "Step"));
        while (i < lage.teile.length && lage.teile[i].art === "lr" && lage.teile[i].saetze === t.saetze) {
          gruppe.append(sprung(i, ZIFFERN[lage.teile[i].stufe - 1])); i++;
        }
        eintraege.push(gruppe);
      } else { eintraege.push(el("li", {}, sprung(i, t.name))); i++; }
    }
    return el("ol", { class: "schritte", "aria-label": T("Teile – direkt anspringen", "Parts – jump straight there") }, eintraege);
  }

  function zeigeTeil() {
    ansicht = zeigeTeil;
    lage.abspielen = null; lage.weiter = null;
    if (lage.startTeil !== lage.teil) { lage.startTeil = lage.teil; lage.start = Date.now(); lage.tempoFaktor = tempoFaktor(lage.teil); }
    const teil = lage.teile[lage.teil];
    ({ lr: zeigeSatz, erklaerung: zeigeErklaerung, verbform: zeigeVerbform, auswahl: zeigeAuswahl, bilder: zeigeBilder,
       vok_lernen: zeigeVokabel, vok_abfrage: zeigeAbfrage, vok_def: zeigeDefinition,
       beae_quiz: zeigeBeaeQuiz, hoeren: zeigeHoeren, dialog: zeigeDialog,
       mustertext: zeigeMustertext, schreiben: zeigeSchreiben })[teil.art](teil);
    navErgaenzen();
  }
  function naechstes() {
    const teil = lage.teile[lage.teil];
    if (lage.pos + 1 < laenge(teil)) { lage.pos++; return zeigeTeil(); }
    if (zuSchnell(teil)) return zuSchnellSeite(teil);
    const erstesMal = !istFertig(lage.teil), aufladen = teilFaellig(lage.teil);
    teilFertig(lage.teil, aufladen);
    if (aufladen) ereignisse.push({ art: "toast", text: T("⚡ Aufgeladen!", "⚡ Powered up!") });
    if (aufladen && SP.texte.powerup && SP.texte.powerup.audio) setTimeout(() => spiele([SP.texte.powerup.audio], { warten: true }), 600); // Stimme nach dem Lob, nicht darüber
    belohne(erstesMal, !lage.hilfe);
    if (alleTeileFertig()) return gruppeGeschafft();
    if (lage.teil + 1 < lage.teile.length) return zwischenstand();
    fastGeschafft();
  }
  function laenge(teil) {
    if (teil.art === "lr") return teil.saetze.length;
    if (teil.art === "verbform" || teil.art === "auswahl") return teil.aufgaben.length;
    if (teil.art === "vok_lernen") return lage.vok.length;
    if (teil.art === "beae_quiz") return teil.paare.length;
    if (teil.art === "vok_def") return lage.vok.filter((v) => v.def).length;
    if (teil.art === "vok_abfrage") return lage.vq ? lage.vq.length : lage.vok.length;
    return 1;
  }

  // Prüfung C: zu schnell durchgeklickt – kein Lob, keine Punkte, Teil noch mal
  function zuSchnellSeite(teil) {
    const k = kategorie(lage.nr);
    const nochmal = () => { lage.frei = null; lage.startTeil = null; springe(lage.teil); };
    lage.abspielen = null; lage.weiter = nochmal;
    const zeichne = () => zeige(kopf(k), el("section", { class: "geschafft" },
      el("h2", {}, T("⏱️ Zu schnell!", "⏱️ Too fast!")),
      istQuiz(teil) ? ansage("Read the tasks carefully and think before you answer. Then you get points. Try again!",
        "Lies die Aufgaben in Ruhe und überleg, bevor du antwortest. Dann gibt es auch Punkte. Versuch es noch mal!")
        : ansage("Really say the sentences out loud. Then you get points. Try again!",
        "Sprich die Sätze wirklich mit. Dann gibt es auch Punkte. Versuch es noch mal!"),
      knopf(T("Noch mal ➜", "Try again ➜"), nochmal, "haupt")));
    ansicht = zeichne;
    zeichne();
  }

  function zwischenstand() {
    const k = kategorie(lage.nr), fertig = lage.teile[lage.teil];
    lage.abspielen = null;
    const text = lob(true);
    const weiter = () => { lage.teil++; lage.pos = 0; teilZuruecksetzen(); zeigeTeil(); };
    const hwTeil = teilSchluessel(lage.teil);
    function zeigeZwischen() {
      lage.weiter = weiter;
      zeige(kopf(k), el("section", { class: "geschafft" },
        el("h2", { lang: "en" }, text),
        el("p", {}, T(`${fertig.name} geschafft!`, `${fertig.name}: done!`)),
        weiterKnopf(weiter), hwWeiterKnopf(hwTeil)));
      navErgaenzen(() => zeigeTeil());
    }
    ansicht = zeigeZwischen;
    zeigeZwischen();
  }

  function fastGeschafft() {
    const k = kategorie(lage.nr), hwTeil = teilSchluessel(lage.teil);
    lage.ende = true; lage.abspielen = null; lage.weiter = null;
    const text = lob(true);
    const offen = lage.teile.map((t, i) => [t, i]).filter(([, i]) => !istFertig(i));
    const zeichne = () => zeige(kopf(k), el("section", { class: "geschafft" },
      el("h2", { lang: "en" }, text),
      ansage("Almost done! These parts are still missing:", "Fast geschafft! Diese Teile fehlen noch:"),
      el("div", { class: "knopfreihe" }, offen.map(([t, i]) => knopf(t.name, () => { lage.ende = false; springe(i); }))),
      hwWeiterKnopf(hwTeil), knopf(T("Zur Startseite", "Back to start"), startseite)));
    ansicht = zeichne;
    zeichne();
  }

  // Schlüssel aller Gruppen einer Kategorie: Unit-Abschnitte (u2:Start) und feste Gruppen (Name)
  function kategorieGruppen(k) {
    return [...(k.vokabeln ? Object.entries(D.units).flatMap(([u, gs]) => gs.map((g) => `u${u}:${g.name}`)) : []), ...(k.gruppen || []).map((g) => g.name)];
  }
  function gruppeGeschafft() {
    const k = kategorie(lage.nr);
    stand.gruppen = stand.gruppen || {};
    const liste = (stand.gruppen[k.nr] = stand.gruppen[k.nr] || []);
    if (!liste.includes(lage.gruppe)) { liste.push(lage.gruppe); einheitBonus(); }
    const alle = kategorieGruppen(k).every((x) => liste.includes(x));
    if (alle && !stand.erledigt.includes(k.nr)) stand.erledigt.push(k.nr);
    speichern();
    const titel = lage.titel, zurueckZu = lage.zurueckZu, hwTeil = teilSchluessel(lage.teil);
    const text = alle ? ruf("geschafft") : lob(true);
    lage = null;
    const zeichne = () => zeige(kopf(k), el("section", { class: "geschafft" },
      el("h2", {}, T(`${titel} geschafft!`, `${titel}: done!`)),
      el("p", { class: "ansage", lang: "en" }, text),
      alle && el("p", { class: "ansage" }, T(`Die ganze Kategorie ${k.titel} ist geschafft. Du bist ein Superstar!`,
        `You finished the whole category ${k.titel}. You are a superstar!`)),
      el("div", { class: "knopfreihe" }, hwWeiterKnopf(hwTeil),
        knopf(T("Weitere Themen", "More topics"), zurueckZu, hwWeiterKnopf(hwTeil) ? "" : "haupt"), knopf(T("Zur Startseite", "Back to start"), startseite))));
    ansicht = zeichne;
    zeichne();
  }

  /* ---------- Bausteine ---------- */
  const karte = (zaehlerText, ...inhalt) =>
    el("section", { class: "satzkarte" }, zaehlerText && el("p", { class: "zaehler" }, zaehlerText, comboFlamme()), ...inhalt);
  const rueckmeldung = () => el("div", { class: "rueckmeldung", hidden: true, role: "status" });
  function melde(box, art, text) {
    if (art === "hilfe") { fehlerSerie++; comboBruch(); text = `${ruf("fehler")} ${HILFE()} ${text}`; }
    box.hidden = false; box.className = "rueckmeldung " + art; box.textContent = text;
  }
  // Satz mit Lücke: art "voll" | "luecke" | "buchstabe" (erster Buchstabe jedes Lückenworts)
  function lueckenSatz(s, art, luecke) {
    const w = luecke || s.luecke;
    const i = w ? s.en.indexOf(w) : -1;
    if (i < 0) return [s.en];
    const mitte = art === "voll" ? el("strong", { class: "ziel" }, w)
      : el("span", { class: "luecke" + (art === "buchstabe" ? " mit-buchstaben" : ""), "aria-label": T("Lücke", "gap") },
        art === "buchstabe" ? w.replace(/\S+/g, (x) => x[0] + x.slice(1).replace(/./g, "_")) : w.replace(/\S/g, "_"));
    return [s.en.slice(0, i), mitte, s.en.slice(i + w.length)];
  }
  function jetztDu() {
    return el("div", { class: "jetztdu", hidden: true, role: "status" }, T("Jetzt du! Sprich nach.", "Your turn! Say it."),
      el("span", { class: "balken", "aria-hidden": "true" }));
  }
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

  /* ---------- Listen and Repeat (3 Stufen) ----------
     Stufe 1: Deutsch und Englisch sichtbar, hören und nachsprechen
     Stufe 2: Englisch mit Lücke – ganzen Satz sagen, dann Lösung
     Stufe 3: nur Deutsch – ganzen Satz auf Englisch sagen, dann Lösung */
  const STUFEN = {
    1: ["Listen and repeat!", "Hör zu und sprich nach! Der deutsche Satz hilft dir."],
    2: ["Which word is missing? Say the whole sentence. Then tap “Solution”.", "Welches Wort fehlt? Sag den ganzen Satz! Dann tipp auf „Lösung“."],
    3: ["Say the sentence in English. Then tap “Solution”.", "Sag den Satz auf Englisch! Dann tipp auf „Lösung“."],
  };
  const STUFEN_BEAE = {
    1: ["Listen: first British, then American English. Repeat the American sentence.", "Hör zu: erst britisch (Mr. Alex), dann amerikanisch. Sprich den amerikanischen Satz nach!"],
    2: ["Which American word is missing? Say the whole sentence. Then tap “Solution”.", "Welches amerikanische Wort fehlt? Sag den ganzen Satz! Dann tipp auf „Lösung“."],
    3: ["Say the sentence in American English. Then tap “Solution”.", "Sag den Satz auf Amerikanisch! Dann tipp auf „Lösung“."],
  };
  function zeigeSatz(teil) {
    const k = kategorie(lage.nr);
    const s = D.saetze[teil.saetze[lage.pos]];
    const stufe = teil.stufe;
    let geloest = stufe === 1;
    const balken = jetztDu();
    const be = s.be; // BE vs AE: links der britische Satz (Mr. Alex), rechts der amerikanische
    const tonBE = be && (be.audio || { text: be.en, stimme: "m" });
    const en = el("p", { class: "satz", lang: "en" }, lueckenSatz(s, stufe === 1 ? "voll" : "luecke"));
    const enSpalte = el("div", { class: "spalte", lang: "en" },
      el("span", { class: "sprache" }, be ? "🇺🇸 American English" : T("Englisch", "English")), en);
    if (stufe === 3) en.replaceChildren(el("span", { class: "profi" }, be ? T("Sag den Satz auf Amerikanisch!", "Say it in American English!")
      : T("Sag den ganzen Satz auf Englisch!", "Say the whole sentence in English!")));
    const deSpalte = be
      ? el("div", { class: "spalte", lang: "en" }, el("span", { class: "sprache" }, "🇬🇧 British English"),
        el("p", { class: "satz be" }, be.en), !E() && el("p", { class: "klein", lang: "de" }, s.de))
      : el("div", { class: "spalte", lang: "de" }, el("span", { class: "sprache" }, T("Deutsch", "German")),
        el("p", { class: "satz de" }, s.de));
    const loesung = stufe > 1 ? sperre(knopf(T("Lösung", "Solution"), loesen)) : null;
    const weiter = sperre(weiterKnopf());
    if (loesung) gibFrei(loesung, denkzeit(s.en), false);
    const sprechen = (ton) => nachsprechen(balken, ton).then((sek) => { if (sek) gibFrei(weiter, sek); });
    const hilfen = el("div", { class: "knopfreihe" });
    if (stufe === 2 && s.luecke) hilfen.append(tipp(T("Noch einfacher: erster Buchstabe", "Easier: first letter"),
      (e) => { e.currentTarget.hidden = true; if (!geloest) en.replaceChildren(...lueckenSatz(s, "buchstabe")); }));
    if (stufe === 3) hilfen.append(tipp(T("Noch einfacher: Satz mit Lücke zeigen", "Easier: show the sentence with a gap"),
      (e) => { e.currentTarget.hidden = true; if (!geloest) en.replaceChildren(...lueckenSatz(s, s.luecke ? "buchstabe" : "luecke")); }));
    function loesen() {
      geloest = true; loesung.disabled = true; hilfen.hidden = true;
      en.replaceChildren(...lueckenSatz(s, "voll"));
      sprechen(tonSatz(s));
    }
    lage.abspielen = () => {
      if (geloest) sprechen(be ? [tonBE, tonSatz(s)] : tonSatz(s));
      else if (be) spiele([tonBE]); // erst nur britisch hören, dann selbst amerikanisch sagen
    };
    lage.weiter = wennFrei(weiter, naechstes);
    zeige(kopf(k),
      ansage(...(be ? STUFEN_BEAE : STUFEN)[stufe]),
      karte(T(`Satz ${lage.pos + 1} von ${teil.saetze.length}`, `Sentence ${lage.pos + 1} of ${teil.saetze.length}`),
        el("div", { class: "spalten" }, deSpalte, enSpalte),
        hilfen, balken,
        el("div", { class: "knopfreihe" }, knopf(T("🔊 Nochmal", "🔊 Again"), () => lage.abspielen()), loesung, weiter)));
    lage.abspielen();
  }

  /* ---------- BE vs AE: British or American? ---------- */
  function zeigeBeaeQuiz(teil) {
    const k = kategorie(lage.nr);
    if (!lage.reihe) lage.reihe = mischen(teil.paare).map((id) => ({ id, seite: Math.random() < 0.5 ? "be" : "ae" }));
    const { id, seite } = lage.reihe[lage.pos];
    const s = D.saetze[id];
    const tonBE = s.be.audio || { text: s.be.en, stimme: "m" };
    let geloest = false;
    const box = rueckmeldung();
    const weiter = weiterKnopf(); sperrt(weiter);
    const beide = el("div", { class: "beae-paar", hidden: true },
      el("p", { lang: "en" }, "🇬🇧 ", s.be.en), el("p", { lang: "en" }, "🇺🇸 ", ...lueckenSatz(s, "voll")),
      !E() && el("p", { class: "klein", lang: "de" }, s.de));
    const hoeren = () => spiele([tonBE, tonSatz(s)]);
    const wahl = el("div", { class: "wahl", role: "group" }, [["be", "🇬🇧 British"], ["ae", "🇺🇸 American"]].map(([w, text]) =>
      el("button", { class: "knopf wahl-knopf gross", onclick: (e) => {
        if (geloest) return;
        if (w === seite) {
          geloest = true; e.currentTarget.classList.add("richtig");
          melde(box, "gut", lob()); beide.hidden = false;
          entsperrt(weiter); lage.weiter = naechstes; lage.abspielen = hoeren;
          hoeren();
        } else {
          e.currentTarget.disabled = true;
          melde(box, "hilfe", T(`Welches Wort ist typisch? Denk an Paare wie sweets 🇬🇧 – candy 🇺🇸. ${NOCHMAL()}`,
            `Which word is typical? Think of pairs like sweets 🇬🇧 – candy 🇺🇸. ${NOCHMAL()}`));
        }
      } }, text)));
    lage.abspielen = null;
    zeige(kopf(k),
      ansage("Is this British or American English? Tap the flag.", "Ist das britisches oder amerikanisches Englisch? Tipp auf die Flagge."),
      karte(T(`Satz ${lage.pos + 1} von ${lage.reihe.length}`, `Sentence ${lage.pos + 1} of ${lage.reihe.length}`),
        el("p", { class: "satz", lang: "en" }, seite === "be" ? s.be.en : s.en),
        wahl, box, beide, el("div", { class: "knopfreihe" }, weiter)));
  }

  /* ---------- Listening (GLN-Prinzip) ----------
     1. Aufgabe und alle Antworten lesen, 2. hören und dabei markieren,
     3. zwei komplette Durchgänge, erst danach gibt es die Lösung (mit Audio).
     G: ankreuzen · E: Tabelle frei ausfüllen */
  function zeigeHoeren(teil) {
    const k = kategorie(lage.nr);
    const u = D.hoeren[teil.uebung];
    const teilVon = (id) => u.teile.find((t) => t.id === id);
    const fragen = u.fragen.filter((f) => !f.nur || f.nur === stand.niveau); // z. B. „What is difficult?“ nur im E-Kurs
    const antworten = u.aufgaben.map(() => ({}));
    let durchgaenge = 0, geloest = false;
    const norm = (t) => (t || "").toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ");
    const passt = (text, gruppen) => gruppen.every((alt) => alt.some((w) => norm(text).includes(w)));

    function umschalter(optionen, setze, label, schluessel) {
      const knoepfe = optionen.map((o) => el("button", { class: "knopf wahl-knopf kompakt", lang: "en",
        "aria-pressed": "false", "data-wert": o.key, onclick: () => {
          if (geloest) return;
          setze(o.key);
          knoepfe.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.wert === o.key)));
        } }, o.symbol && el("span", { class: "wahl-sym", "aria-hidden": "true" }, o.symbol), el("span", {}, o.en)));
      return el("div", { class: "wahl", role: "group", "aria-label": label, "data-frage": schluessel }, knoepfe);
    }
    const zeilen = u.aufgaben.map((a, i) => {
      const name = teilVon(a.teil).sprecher;
      const box = el("p", { class: "rueckmeldung", hidden: true });
      const frage = (f) => tx(f).replace("{name}", name);
      if (!E()) return el("li", { class: "hv-zeile" },
        el("h3", { lang: "en" }, el("span", { class: "hv-nr" }, i + 1 + ". "), name),
        fragen.flatMap((f) => [el("p", { class: "klein" }, frage(f)), umschalter(f.optionen, (w) => { antworten[i][f.key] = w; }, frage(f), f.key)]),
        box);
      const feld = (f) => el("input", { type: "text", class: "eingabe", lang: "en", autocomplete: "off",
        "aria-label": frage(f), placeholder: frage(f), oninput: (e) => { antworten[i][f.key] = e.target.value; } });
      return el("li", { class: "hv-zeile" },
        el("h3", { lang: "en" }, el("span", { class: "hv-nr" }, i + 1 + ". "), name),
        el("div", { class: "hv-tabelle" }, fragen.map(feld)),
        box);
    });

    const hoerKnopf = knopf(T("▶ Hörtext abspielen (1. Durchgang)", "▶ Play the recording (1st time)"), hoeren, "haupt");
    const stoppKnopf = knopf("■ Stop", () => { stopp(); hoerKnopf.disabled = false; stoppKnopf.hidden = true; });
    stoppKnopf.hidden = true;
    const zaehler = el("p", { class: "klein", "aria-live": "polite" }, T("Du hast den Text noch nicht gehört.", "You haven't listened yet."));
    const gln = el("p", { class: "gln", hidden: true }, T("Achtung: Im GLN gibt es nur zwei Hörversuche. Zum Üben darfst du gerne öfter hören.",
      "Remember: In the test you can only listen twice. For practice, you can listen as often as you like."));
    const loesungKnopf = knopf(T("Lösung zeigen", "Show the answers"), loesen, "haupt");
    loesungKnopf.hidden = true;
    const ergebnis = el("div", { class: "rueckmeldung", hidden: true, role: "status" });
    const warten = el("p", { class: "klein" }, T("Die Lösung kommt, wenn du den Text zweimal ganz gehört hast.",
      "You can check your answers after listening twice."));
    const mitlesen = el("section", { class: "satzkarte", hidden: true },
      el("h2", {}, T("Text zum Mitlesen", "Transcript")),
      el("div", { class: "mitlesen", lang: "en" }, u.teile.map((t) => el("p", {},
        el("strong", {}, t.sprecher + ": "), t.text, " ",
        el("button", { class: "knopf leise klein-knopf", "aria-label": "Listen: " + t.sprecher,
          onclick: () => spiele([t.audio || { text: t.text, stimme: t.stimme }]) }, "🔊")))),
      el("div", { class: "knopfreihe" }, weiterKnopf()));
    const tonTeil = (t) => t.audio || { text: t.text, stimme: t.stimme };

    function hoeren() {
      hoerKnopf.disabled = true; stoppKnopf.hidden = false;
      spiele(u.teile.map(tonTeil)).then((d) => {
        if (d === null) return;
        hoerKnopf.disabled = false; stoppKnopf.hidden = true;
        durchgaenge++;
        zaehler.textContent = durchgaenge === 1 ? T("1. Durchgang geschafft! Hör den Text ein zweites Mal.", "1st time done! Listen a second time.")
          : T(`${durchgaenge} Durchgänge gehört.`, `You listened ${durchgaenge} times.`);
        hoerKnopf.textContent = durchgaenge === 1 ? T("▶ Noch mal hören (2. Durchgang)", "▶ Listen again (2nd time)")
          : T("▶ Noch mal hören (Übung)", "▶ Listen again (practice)");
        if (durchgaenge >= 2) { gln.hidden = false; warten.hidden = true; if (!geloest) loesungKnopf.hidden = false; }
      });
    }

    async function loesen() {
      geloest = true; loesungKnopf.hidden = true;
      app.querySelectorAll(".hv-liste .wahl button, .hv-liste input").forEach((b) => { b.disabled = true; });
      let richtig = 0;
      const textVon = (f, a) => (f.optionen ? f.optionen.find((o) => o.key === a[f.key]).en : a[f.key + "_text"]);
      u.aufgaben.forEach((a, i) => {
        const zeile = zeilen[i], box = zeile.querySelector(".rueckmeldung");
        const ok = fragen.every((f) => (E() ? passt(antworten[i][f.key], a[f.key + "_e"]) : antworten[i][f.key] === a[f.key]));
        if (ok) richtig++;
        zeile.classList.add(ok ? "ok" : "falsch");
        box.hidden = false; box.className = "rueckmeldung " + (ok ? "gut" : "hilfe");
        const loesung = fragen.map((f) => textVon(f, a)).join(" – ");
        box.textContent = ok ? T(`✓ Richtig! (${loesung})`, `✓ Correct! (${loesung})`) : `${HILFE()} ${T("Richtig ist:", "The answer is:")} ${loesung}.`;
        zeile.querySelectorAll(".wahl button").forEach((b) => { if (b.dataset.wert === a[b.closest(".wahl").dataset.frage]) b.classList.add("richtig"); });
      });
      ergebnis.hidden = false;
      ergebnis.className = "rueckmeldung " + (richtig === u.aufgaben.length ? "gut" : "hilfe");
      ergebnis.textContent = richtig === u.aufgaben.length ? `${ruf("voll") || lob()} ${T("Alles richtig!", "All correct!")}`
        : T(`Du hast ${richtig} von ${u.aufgaben.length} Personen richtig. Hör dir die Lösung an!`,
          `You got ${richtig} of ${u.aufgaben.length} people right. Listen to the answers!`);
      mitlesen.hidden = false; lage.weiter = naechstes;
      for (let i = 0; i < u.aufgaben.length; i++) { // Lösung mit Audio: jede Person nacheinander
        zeilen.forEach((z) => z.classList.remove("spricht"));
        zeilen[i].classList.add("spricht");
        if ((await spiele([tonTeil(teilVon(u.aufgaben[i].teil))])) === null) break;
      }
      zeilen.forEach((z) => z.classList.remove("spricht"));
    }

    lage.abspielen = () => { if (!hoerKnopf.disabled) hoeren(); };
    zeige(kopf(k),
      el("section", { class: "satzkarte" },
        el("h2", { lang: "en" }, u.titel),
        el("p", { class: "ansage", lang: "en" }, tx(u.instruction)),
        el("p", { class: "hinweis-kasten" }, "📖 " + tx(u.anleitung)),
        el("ol", { class: "hv-liste" }, zeilen)),
      el("section", { class: "satzkarte" }, gln, el("div", { class: "knopfreihe" }, loesungKnopf), ergebnis, warten),
      mitlesen,
      el("div", { class: "hv-spieler" }, el("div", { class: "knopfreihe" }, hoerKnopf, stoppKnopf), zaehler));
  }

  /* ---------- Speaking: Dialog A/B ----------
     Ohne Rolle: ganzen Dialog hören (A = Jeremy B., B = Jessica).
     Mit Rolle: die App spricht die andere Rolle, du sprichst deine Zeilen in die Pause. */
  let dialogLauf = 0;
  const warte = (ms) => new Promise((ok) => setTimeout(ok, ms));
  function zeigeDialog(teil) {
    const k = kategorie(lage.nr);
    const meine = teil.rolle;
    const zeilen = teil.zeilen.map(([id, rolle]) => ({ s: D.saetze[id], rolle }));
    let versteckt = !!meine && E();
    const balken = el("div", { class: "jetztdu", hidden: true, role: "status" }, T("Jetzt du! Sprich deine Zeile.", "Your turn! Say your line."),
      el("span", { class: "balken", "aria-hidden": "true" }));
    const box = rueckmeldung();
    const liste = el("ol", { class: "dialog" }, zeilen.map(({ s, rolle }) => {
      const eigen = rolle === meine;
      return el("li", { class: "dz rolle-" + rolle + (eigen ? " meine" : "") },
        el("span", { class: "dz-rolle", "aria-label": T("Rolle ", "Role ") + rolle }, rolle),
        el("div", {},
          el("p", { class: "dz-en", lang: "en" }, eigen && versteckt ? "…" : s.en),
          !E() && el("p", { class: "dz-de klein", lang: "de" }, s.de)));
    }));
    const zeigeMeine = () => { versteckt = false; zeilen.forEach(({ s, rolle }, i) => { if (rolle === meine) liste.children[i].querySelector(".dz-en").textContent = s.en; }); };
    const startKnopf = knopf(meine ? T("▶ Dialog starten", "▶ Start the dialogue") : T("▶ Dialog anhören", "▶ Listen to the dialogue"), starten, "haupt");
    const stoppKnopf = knopf("■ Stop", () => { dialogLauf++; stopp(); fertig(false); });
    stoppKnopf.hidden = true;
    function fertig(ganz) {
      startKnopf.hidden = false; stoppKnopf.hidden = true; balken.hidden = true;
      [...liste.children].forEach((li) => li.classList.remove("spricht"));
      if (ganz) gibFrei(weiter, 0.6);
      if (ganz) melde(box, "gut", lob() + " " + (meine ? T("Tausch jetzt die Rolle – oder noch mal!", "Now swap roles – or try again!") : T("Jetzt sprich mit!", "Now join in!")));
    }
    async function starten() {
      const meinLauf = ++dialogLauf;
      startKnopf.hidden = true; stoppKnopf.hidden = false; box.hidden = true;
      for (let i = 0; i < zeilen.length; i++) {
        if (meinLauf !== dialogLauf) return;
        const { s, rolle } = zeilen[i];
        [...liste.children].forEach((li, j) => li.classList.toggle("spricht", j === i));
        if (liste.children[i].scrollIntoView) liste.children[i].scrollIntoView({ block: "nearest", behavior: "smooth" });
        if (rolle === meine) { // Pause zum Sprechen, so lang wie die Zeile
          const dauer = Math.max(2.5, s.en.split(/\s+/).length * 0.55 + 1.2);
          balken.hidden = false; balken.classList.remove("laeuft"); void balken.offsetWidth;
          balken.style.setProperty("--dauer", dauer.toFixed(1) + "s"); balken.classList.add("laeuft");
          await warte(dauer * 1000);
          balken.hidden = true;
        } else if ((await spiele([tonSatz(s)])) === null) return;
      }
      if (meinLauf === dialogLauf) fertig(true);
    }
    const weiter = sperre(weiterKnopf());
    lage.abspielen = () => { if (!startKnopf.hidden) starten(); };
    lage.weiter = wennFrei(weiter, naechstes);
    zeige(kopf(k),
      meine ? ansage(`You are ${meine}. Say your lines when it's your turn. The app speaks the other role.`,
        `Du bist ${meine}. Sprich deine Zeilen, wenn du dran bist. Die App spricht die andere Rolle.`)
        : ansage("Listen to the dialogue. A and B.", "Hör dir den Dialog an: A und B."),
      karte(null, liste, balken,
        meine && versteckt && el("div", { class: "knopfreihe" }, tipp("Easier: show my lines", (e) => { e.currentTarget.hidden = true; zeigeMeine(); })),
        el("div", { class: "knopfreihe" }, startKnopf, stoppKnopf), box,
        el("div", { class: "knopfreihe" }, weiter)));
  }

  /* ---------- Writing: Mustertext mit Aufbau (Anfang – Mittelteil – Schluss) ---------- */
  function faktenblatt(f) {
    return f && el("aside", { class: "faktenblatt", lang: "en" }, el("h3", {}, "📋 Fact sheet: " + f.name),
      el("dl", {}, f.punkte.flatMap(([k, v]) => [el("dt", {}, k), el("dd", {}, v)])));
  }
  function zeigeMustertext(teil) {
    const k = kategorie(lage.nr);
    const alle = teil.abschnitte.flatMap((a) => a.saetze);
    const spans = {};
    const absaetze = teil.abschnitte.map((a) => el("div", { class: "muster-abschnitt" },
      el("span", { class: "muster-label" }, tx(a.label)),
      el("p", { lang: "en" }, a.saetze.map((id) => {
        const s = D.saetze[id];
        spans[id] = el("button", { class: "muster-satz" + ((teil.eigene_zeile || []).includes(id) ? " eigene-zeile" : ""), title: E() ? "" : s.de, onclick: () => vorlesen([id]) }, ...lueckenSatz(s, "voll"), " ");
        return spans[id];
      })),
      !E() && el("p", { class: "klein", lang: "de" }, a.saetze.map((id) => D.saetze[id].de).join(" "))));
    async function vorlesen(ids) {
      for (const id of ids) {
        Object.values(spans).forEach((x) => x.classList.toggle("spricht", x === spans[id]));
        if ((await spiele([tonSatz(D.saetze[id])])) === null) break;
      }
      Object.values(spans).forEach((x) => x.classList.remove("spricht"));
    }
    lage.abspielen = () => vorlesen(alle); lage.weiter = naechstes;
    zeige(kopf(k),
      ansage("Read and listen. Look at the structure and the useful phrases (blue).",
        "Lies und hör zu. Achte auf den Aufbau und die blauen Redemittel – die kannst du in deinem Text benutzen."),
      el("section", { class: "satzkarte" },
        el("h2", { lang: "en" }, teil.titel),
        faktenblatt(teil.fakten),
        el("div", { class: "mustertext" }, absaetze),
        el("div", { class: "knopfreihe" }, knopf(T("🔊 Ganzen Text vorlesen", "🔊 Read the whole text"), () => vorlesen(alle)), weiterKnopf())));
  }

  /* ---------- Writing: eigener Text mit Checkliste (bleibt nur auf diesem Gerät) ---------- */
  function zeigeSchreiben(teil) {
    const k = kategorie(lage.nr);
    stand.texte = stand.texte || {};
    const feld = el("textarea", { class: "schreibfeld", lang: "en", rows: 12, spellcheck: "true",
      "aria-label": T("Dein Text", "Your text"), oninput: pruefen }, );
    feld.value = stand.texte[teil.speicher] || "";
    const zaehler = el("p", { class: "klein" });
    const punkte = [];
    const zeile = (text) => { const li = el("li", {}, el("span", { class: "check-sym", "aria-hidden": "true" }, "○"), " ", text); punkte.push(li); return li; };
    const min = tx(teil.min);
    const inhalt = el("ul", { class: "checkliste" }, teil.inhalt.map((x) => zeile(tx(x))));
    const ichGross = (t) => /\bI\b/.test(t) && !/(^|[^\w'])i([\s'’]|$)/.test(t);
    const formListe = [[T(`Mindestens ${min} Sätze`, `At least ${min} sentences`), (t) => (t.match(/[.!?]+(\s|$)/g) || []).length >= min],
      ...(teil.form || []).map((x) => [tx(x), x.test === "ich_gross" ? ichGross
        : (t) => (t.match(new RegExp(x.muster, "gi")) || []).length >= (x.anzahl || 1)])];
    const form = el("ul", { class: "checkliste" }, formListe.map(([text]) => zeile(text)));
    const tests = [...teil.inhalt.map((x) => (t) => new RegExp(x.muster, "i").test(t)), ...formListe.map(([, f]) => f)];
    function pruefen() {
      const t = feld.value;
      stand.texte[teil.speicher] = t; speichern();
      const woerter = (t.match(/[A-Za-z']+/g) || []).length;
      zaehler.textContent = T(`${woerter} Wörter`, `${woerter} words`);
      tests.forEach((f, i) => { const ok = !!t.trim() && f(t); punkte[i].classList.toggle("ok", ok); punkte[i].firstChild.textContent = ok ? "✓" : "○"; });
    }
    const einfuegen = (b) => {
      const a = feld.selectionStart ?? feld.value.length, e = feld.selectionEnd ?? a;
      const vor = feld.value.slice(0, a), rest = feld.value.slice(e);
      const trenner = !vor || /\s$/.test(vor) ? "" : (b === "Best wishes," || /,$/.test(vor) ? "\n" : " ");
      feld.value = vor + trenner + b + (b.endsWith(",") ? "\n" : " ") + rest;
      feld.focus(); pruefen();
    };
    const bausteine = el("div", { class: "bausteine", hidden: E() }, teil.bausteine.map((b) =>
      el("button", { class: "baustein", lang: "en", onclick: () => einfuegen(b) }, b)));
    const kopieren = knopf(T("📋 Text kopieren", "📋 Copy text"), () => {
      feld.select();
      (navigator.clipboard ? navigator.clipboard.writeText(feld.value) : Promise.reject()).catch(() => document.execCommand && document.execCommand("copy"));
      kopieren.textContent = T("✓ Kopiert", "✓ Copied");
    });
    const neu = knopf(T("🗑️ Neu anfangen", "🗑️ Start again"), () => {
      if (feld.value && !confirm(T("Deinen Text wirklich löschen?", "Really delete your text?"))) return;
      feld.value = ""; pruefen();
    });
    lage.abspielen = null; lage.weiter = naechstes;
    zeige(kopf(k),
      el("section", { class: "satzkarte" },
        ansage(...(E() ? [tx(teil.aufgabe)] : tx(teil.aufgabe).split(" – "))),
        el("p", { class: "hinweis-kasten" }, "📝 " + T("Schreib über diese Punkte. Die Checkliste hakt automatisch ab, was schon drin ist. Dein Text bleibt nur auf diesem Gerät.",
          "Write about these points. The checklist ticks off what is already there. Your text stays on this device only.")),
        faktenblatt(teil.fakten),
        el("div", { class: "schreib-raster" },
          el("div", {}, el("h3", {}, T("Inhalt", "Content")), inhalt, el("h3", {}, T("Form", "Form")), form),
          el("div", { class: "schreib-spalte" },
            !E() && el("p", { class: "klein" }, T("Redemittel – tipp drauf, dann landen sie in deinem Text:", "")),
            E() && el("div", { class: "knopfreihe" }, tipp("Easier: show useful phrases", (e) => { e.currentTarget.hidden = true; bausteine.hidden = false; })),
            bausteine, feld, zaehler,
            el("div", { class: "knopfreihe" }, kopieren, neu)))),
      el("div", { class: "knopfreihe" }, weiterKnopf()));
    pruefen();
  }

  /* ---------- Erklärung ---------- */
  function zeigeErklaerung(teil) {
    const k = kategorie(lage.nr);
    const bloecke = teil.bloecke.map((b) => {
      if (b.typ === "text") return el("p", { class: "ansage" }, tx(b));
      if (b.typ === "liste_de") return el("ul", { class: "regeln" }, b.punkte.map((x) => el("li", {}, tx(x))));
      if (b.typ === "liste") return el("ul", { class: "regeln wortliste", lang: "en" }, b.punkte.map((x) => el("li", {}, x)));
      if (b.typ === "merksatz") return el("div", { class: "merksatz" }, el("span", { class: "sprache" }, T("Merksatz", "Remember")), el("p", {}, tx(b)));
      if (b.typ === "regeln") return el("ul", { class: "regeln" }, b.punkte.map(([regel, sid]) => {
        const s = D.saetze[sid];
        return el("li", {}, el("strong", {}, tx(regel)), " ", el("span", { lang: "en" }, lueckenSatz(s, "voll")), " ",
          el("button", { class: "knopf leise klein-knopf", "aria-label": "Listen: " + s.en, onclick: () => spiele([tonSatz(s)]) }, "🔊"));
      }));
      return null;
    });
    lage.weiter = naechstes;
    zeige(kopf(k), karte(null, bloecke, el("div", { class: "knopfreihe" }, weiterKnopf())));
  }

  /* ---------- Übung: richtige Form / Präposition wählen ---------- */
  function zeigeVerbform(teil) {
    const k = kategorie(lage.nr);
    if (!lage.reihe) lage.reihe = mischen(teil.aufgaben);
    const a = lage.reihe[lage.pos];
    const s = D.saetze[a.satz];
    const luecke = a.luecke || s.luecke;
    let geloest = false;
    const satz = el("p", { class: "satz", lang: "en" }, lueckenSatz(s, "luecke", luecke));
    const de = el("p", { class: "satz de", lang: "de", hidden: E() }, s.de);
    const box = rueckmeldung();
    const weiter = weiterKnopf(); sperrt(weiter);
    const wahl = el("div", { class: "wahl", role: "group" },
      mischen([a.richtig, ...a.falsch]).map((form) => el("button", { class: "knopf wahl-knopf", lang: "en", onclick: (e) => {
        if (geloest) return;
        if (form === a.richtig) {
          geloest = true;
          e.currentTarget.classList.add("richtig");
          satz.replaceChildren(...lueckenSatz(s, "voll", luecke));
          melde(box, "gut", lob());
          entsperrt(weiter); lage.weiter = naechstes;
          spiele([tonSatz(s)]);
        } else {
          e.currentTarget.disabled = true;
          melde(box, "hilfe", `${tx(a.hilfe || teil.hilfe)} ${NOCHMAL()}`);
        }
      } }, form)));
    lage.abspielen = () => { if (geloest) spiele([tonSatz(s)]); };
    zeige(kopf(k),
      ansage(...(E() ? [tx(teil.ansage)] : tx(teil.ansage).split(" – "))),
      karte(T(`Aufgabe ${lage.pos + 1} von ${lage.reihe.length}`, `Task ${lage.pos + 1} of ${lage.reihe.length}`),
        a.vorher && el("p", { class: "satz falsch-vorher", lang: "en" }, el("span", { "aria-hidden": "true" }, "✗ "), a.vorher),
        de, satz, wahl, box,
        E() && el("div", { class: "knopfreihe" }, tipp("Easier: show the German sentence", (e) => { e.currentTarget.hidden = true; de.hidden = false; })),
        el("div", { class: "knopfreihe" }, weiter)));
  }

  /* ---------- Übung: Auswahl (Task words: Was musst du tun?) ---------- */
  function zeigeAuswahl(teil) {
    const k = kategorie(lage.nr);
    if (!lage.reihe) lage.reihe = mischen(teil.aufgaben).map((a) => ({ a, optionen: mischen(a.optionen.map((o, i) => ({ o, richtig: i === 0 }))) }));
    const { a, optionen } = lage.reihe[lage.pos];
    const s = D.saetze[a.satz];
    let geloest = false;
    const box = rueckmeldung();
    const weiter = weiterKnopf(); sperrt(weiter);
    const hoeren = () => spiele([tonSatz(s)]);
    const wahl = el("div", { class: "wahl senkrecht", role: "group" }, optionen.map(({ o, richtig }) =>
      el("button", { class: "knopf wahl-knopf", onclick: (e) => {
        if (geloest) return;
        if (richtig) {
          geloest = true; e.currentTarget.classList.add("richtig");
          melde(box, "gut", lob()); entsperrt(weiter); lage.weiter = naechstes;
          hoeren();
        } else {
          e.currentTarget.disabled = true;
          melde(box, "hilfe", T(`Auf Deutsch heißt der Satz: „${s.de}“ ${NOCHMAL()}`,
            `Read the task again and look at the key word. ${NOCHMAL()}`));
        }
      } }, tx(o))));
    lage.abspielen = hoeren;
    zeige(kopf(k),
      ansage("What do you have to do? Tap the right answer.", "Was musst du tun? Tipp auf die richtige Antwort."),
      karte(T(`Aufgabe ${lage.pos + 1} von ${lage.reihe.length}`, `Task ${lage.pos + 1} of ${lage.reihe.length}`),
        el("p", { class: "satz aufgabe", lang: "en" }, "„" + s.en + "“"),
        el("div", { class: "knopfreihe" }, knopf("🔊 " + T("Anhören", "Listen"), hoeren)),
        wahl, box, el("div", { class: "knopfreihe" }, weiter)));
    hoeren();
  }

  /* ---------- Lesen: Bilder ankreuzen (Format aus dem GLN) ---------- */
  function zeigeBilder(teil) {
    const k = kategorie(lage.nr);
    const text = teil.text.map((id) => ({ id, s: D.saetze[id] }));
    // Wie in der Klassenarbeit: Bilder gemischt, nicht in der Reihenfolge des Textes (bleibt beim G/E-Wechsel gleich)
    if (!lage.reihe) lage.reihe = mischen(teil.bilder);
    const bilder = lage.reihe.filter((b) => !b.nur || b.nur === stand.niveau);
    const gewaehlt = new Set();
    let geloest = false, mitText = false;
    const saetze = text.map(({ id, s }) => el("span", { class: "lesesatz", "data-id": id }, s.en + " "));
    const ergebnis = rueckmeldung();
    const weiter = weiterKnopf(); weiter.hidden = true;
    const kacheln = bilder.map((b, i) => el("button", { class: "bild-kachel", "aria-pressed": "false",
      "aria-label": tx(b), onclick: (e) => {
        if (geloest) return;
        gewaehlt.has(i) ? gewaehlt.delete(i) : gewaehlt.add(i);
        e.currentTarget.setAttribute("aria-pressed", String(gewaehlt.has(i)));
      } },
      el("span", { class: "bild-nr", "aria-hidden": "true" }, String(i + 1)),
      b.bild ? el("img", { class: "bild-foto", src: b.bild, alt: "" })
        : el("span", { class: "bild-sym", "aria-hidden": "true" }, b.symbol),
      el("span", { class: "bild-text", lang: E() ? "en" : "de", hidden: true }, tx(b)),
      el("span", { class: "bild-haken", "aria-hidden": "true" }, "✓")));
    const vorlesen = () => spiele(text.map(({ s }) => tonSatz(s)));
    async function pruefen() {
      geloest = true; pruef.hidden = true; weiter.hidden = false; lage.weiter = naechstes;
      app.querySelectorAll(".tipp").forEach((t) => { t.hidden = true; });
      let richtig = 0;
      bilder.forEach((b, i) => {
        const ok = !!b.beleg === gewaehlt.has(i);
        if (ok) richtig++;
        kacheln[i].classList.add(b.beleg ? "soll" : "nicht", ok ? "ok" : "falsch");
        kacheln[i].querySelector(".bild-text").hidden = false;
      });
      ergebnis.hidden = false;
      ergebnis.className = "rueckmeldung " + (richtig === bilder.length ? "gut" : "hilfe");
      ergebnis.textContent = richtig === bilder.length ? `${ruf("voll") || lob()} ${T("Alles richtig!", "All correct!")}`
        : T(`Du hast ${richtig} von ${bilder.length} Bildern richtig. Grün = kommt im Text vor. Hör dir die Textstellen an!`,
          `You got ${richtig} of ${bilder.length} pictures right. Green = it happens in the text. Listen to the evidence!`);
      // Lösung mit Textbeleg: Satz markieren und vorlesen
      for (const b of bilder.filter((x) => x.beleg)) {
        saetze.forEach((x) => x.classList.toggle("beleg", x.dataset.id === b.beleg));
        if ((await spiele([tonSatz(D.saetze[b.beleg])])) === null) break;
      }
    }
    const pruef = knopf(T("Lösung prüfen", "Check"), pruefen, "haupt");
    lage.abspielen = vorlesen;
    zeige(kopf(k),
      el("section", { class: "satzkarte" },
        el("h2", { lang: "en" }, teil.titel),
        ansage(teil.instruction, "Schau dir die Bilder an. Kreuze nur die an, die im Text passieren. Einige Bilder bleiben übrig!"),
        el("p", { class: "hinweis-kasten" }, "📖 " + T("Schau dir zuerst alle Bilder an. Lies dann den Text. Was passiert wirklich?",
          "Look at all the pictures first. Then read the text. What really happens?")),
        el("div", { class: "bilder" }, kacheln),
        el("div", { class: "knopfreihe" }, tipp(T("Noch einfacher: Bildunterschriften zeigen", "Easier: show captions"), (e) => {
          e.currentTarget.hidden = true; kacheln.forEach((x) => { x.querySelector(".bild-text").hidden = false; });
        }))),
      el("section", { class: "satzkarte" },
        el("div", { class: "lesetext", lang: "en" }, el("p", {}, saetze)),
        el("div", { class: "knopfreihe" }, knopf(T("🔊 Text vorlesen", "🔊 Read the text to me"), vorlesen))),
      el("section", { class: "satzkarte" }, el("div", { class: "knopfreihe" }, pruef, weiter), ergebnis));
  }

  /* ---------- Vokabeln ---------- */
  function zeigeVokabel(teil) {
    const k = kategorie(lage.nr);
    const v = lage.vok[lage.pos];
    const balken = jetztDu();
    const weiter = sperre(weiterKnopf());
    const abspielen = () => nachsprechen(balken, tonWort(v)).then((sek) => { if (sek) gibFrei(weiter, sek); });
    lage.abspielen = abspielen; lage.weiter = wennFrei(weiter, naechstes);
    zeige(kopf(k), ansage("Let's learn the words! Listen and repeat.", "Lernen wir die Wörter! Hör zu und sprich nach."),
      karte(T(`Wort ${lage.pos + 1} von ${lage.vok.length}`, `Word ${lage.pos + 1} of ${lage.vok.length}`),
        el("div", { class: "vok" }, el("div", {}, el("p", { class: "vok-en", lang: "en" }, v.en), el("p", { class: "vok-de", lang: "de" }, v.de))),
        balken,
        el("div", { class: "knopfreihe" }, knopf(T("🔊 Nochmal", "🔊 Again"), abspielen), weiter)));
    abspielen();
  }

  // Grundform für die Eingabe: „elevator (AE)“ → „elevator“, „get used to sth.“ → „get used to“
  const grundform = (t) => t.replace(/\(.*?\)/g, "").replace(/\b(sth|sb)\.?/g, "").replace(/[…,.!?]/g, "")
    .replace(/\s+/g, " ").trim().toLowerCase();

  // Find the word: Definition → Wort. G mit Wortkasten (Auswahl), E offen (eintippen)
  function zeigeDefinition(teil) {
    const k = kategorie(lage.nr);
    if (!lage.reihe) lage.reihe = mischen(lage.vok.filter((v) => v.def));
    const v = lage.reihe[lage.pos];
    let geloest = false;
    const box = rueckmeldung();
    const weiter = weiterKnopf(); sperrt(weiter);
    const wortZeile = el("p", { class: "vok-en ziel-satz", lang: "en", hidden: true }, v.en);
    const geschafft = (knopfEl) => {
      geloest = true; if (knopfEl) knopfEl.classList.add("richtig");
      wortZeile.hidden = false; melde(box, "gut", lob());
      entsperrt(weiter); lage.weiter = naechstes; lage.abspielen = () => spiele([tonWort(v)]);
      spiele([tonWort(v)]);
    };
    const wortkasten = () => {
      const andere = mischen(D.vokabeln.filter((x) => x.def && x.id !== v.id && x.unit === v.unit)).slice(0, 3);
      return el("div", { class: "wahl", role: "group" }, mischen([v, ...andere]).map((x) => el("button", { class: "knopf wahl-knopf", lang: "en",
        onclick: (e) => {
          if (geloest) return;
          if (x === v) geschafft(e.currentTarget);
          else { e.currentTarget.disabled = true; melde(box, "hilfe", T(`Lies die Erklärung noch mal genau. ${NOCHMAL()}`, `Read the definition again. ${NOCHMAL()}`)); }
        } }, x.en)));
    };
    let bereich;
    if (!E()) bereich = wortkasten();
    else {
      const feld = el("input", { type: "text", class: "eingabe", lang: "en", autocomplete: "off", autocapitalize: "off", spellcheck: "false",
        "aria-label": "Your word", onkeydown: (e) => { if (e.key === "Enter") { e.stopPropagation(); pruefen(); } } });
      const pruefen = () => {
        if (geloest) return;
        if (grundform(feld.value) === grundform(v.en)) geschafft(null);
        else if (feld.value.trim()) melde(box, "hilfe", `${NOCHMAL()}`);
      };
      const ersterBuchstabe = tipp("Easier: first letter", (e) => { e.currentTarget.hidden = true; feld.value = grundform(v.en)[0]; feld.focus(); });
      const kasten = tipp("Even easier: show the word box", (e) => { e.currentTarget.hidden = true; bereich.replaceWith(wortkasten()); });
      bereich = el("div", { class: "eingabe-bereich" }, el("div", { class: "knopfreihe" }, feld, knopf("Check", pruefen, "haupt")),
        el("div", { class: "knopfreihe" }, ersterBuchstabe, kasten));
    }
    lage.abspielen = () => { if (geloest) spiele([tonWort(v)]); };
    zeige(kopf(k),
      ansage("Find the word.", "Finde das Wort zu der Erklärung. Die Wörter im Kasten helfen dir."),
      karte(T(`Wort ${lage.pos + 1} von ${lage.reihe.length}`, `Word ${lage.pos + 1} of ${lage.reihe.length}`),
        el("p", { class: "satz definition", lang: "en" }, v.def),
        bereich, wortZeile, box, el("div", { class: "knopfreihe" }, weiter)));
  }

  // Abfrage EN → DE / DE → EN mit Selbstkontrolle
  function zeigeAbfrage(teil) {
    const k = kategorie(lage.nr);
    if (!lage.vq) lage.vq = mischen(lage.vok.map((v) => v.id));
    const v = vokabel(lage.vq[lage.pos]);
    const enDe = teil.richtung === "en_de";
    const frage = el("p", { class: "vok-en", lang: enDe ? "en" : "de" }, enDe ? v.en : v.de);
    const antwort = el("p", { class: "vok-de", lang: enDe ? "de" : "en", hidden: true }, enDe ? v.de : v.en);
    const satzZeile = el("p", { class: "klein", lang: "en", hidden: true }, D.saetze[v.satz].en);
    const fragen = () => { if (enDe) spiele([tonWort(v)]); };
    const bewerten = el("div", { class: "knopfreihe", hidden: true },
      knopf(T("✓ Gewusst", "✓ I knew it"), () => { comboTreffer(); naechstes(); }, "haupt weiter"),
      knopf(T("↻ Nochmal üben", "↻ Practise again"), () => { comboBruch(); lage.vq.push(v.id); naechstes(); }));
    const loesung = sperre(knopf(T("Lösung", "Solution"), () => {
      loesung.hidden = true; antwort.hidden = false; bewerten.hidden = false; satzZeile.hidden = false;
      lage.abspielen = () => spiele([tonWort(v)]); lage.weiter = naechstes;
      lage.abspielen();
    }, "haupt"));
    gibFrei(loesung, 3, false);
    lage.abspielen = fragen;
    zeige(kopf(k),
      enDe ? ansage("What's that in German? Say it out loud. Then tap “Solution”.", "Was heißt das auf Deutsch? Sag es laut! Dann tipp auf „Lösung“.")
        : ansage("What's that in English? Say it out loud. Then tap “Solution”.", "Was heißt das auf Englisch? Sag es laut! Dann tipp auf „Lösung“."),
      karte(T(`Wort ${lage.pos + 1} von ${lage.vq.length}`, `Word ${lage.pos + 1} of ${lage.vq.length}`),
        el("div", { class: "vok" }, el("div", {}, frage, antwort, satzZeile)),
        el("div", { class: "knopfreihe" }, knopf(T("🔊 Nochmal", "🔊 Again"), () => lage.abspielen()), loesung),
        bewerten));
    fragen();
  }

  /* ---------- Belohnungen (docs/gamification/konzept.md) ----------
     Punkte nur für fertige Teile (+5 extra ohne 💡-Hilfe). Serien zählen Schultage (Mo–Fr ohne Ferien, Feiertage,
     freie Brückentage im Saarland): 🔥 3 Schultage am Stück · ⭐ Perfect week → neue Landmark-Karte
     👑 4 perfekte Wochen hintereinander (Ferienwochen halten an) · 🏖️ Wochenende = Bonus, keine Pflicht.
     USA-Karte: jeder 4. neu geschaffte Teil schaltet einen Staat frei. Alles nur auf diesem Gerät. */
  const SP = D.spiel;
  const PUNKTE = { teil: 10, wiederholung: 5, ohneHilfe: 5, seance: 30, einheit: 50, feuer: 30, wochenende: 20, ferien: 20, spiel: 10, woche: 100, monat: 200 };
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const heute = () => (window.__heute ? new Date(window.__heute + "T12:00:00") : new Date());
  const plusTage = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const montag = (d) => plusTage(d, -((d.getDay() + 6) % 7));
  const istFrei = (t) => SP.frei.some((f) => t >= f.von && t <= f.bis);
  const istSchultag = (d) => d.getDay() >= 1 && d.getDay() <= 5 && !istFrei(iso(d));
  const schultageDerWoche = (mo) => [0, 1, 2, 3, 4].map((i) => plusTage(mo, i)).filter(istSchultag);
  powerupMigration();
  const titelIndex = (p) => SP.titel.reduce((i, t, k) => (p >= t.ab ? k : i), 0);
  const neueTeile = () => Object.keys(stand.teile || {}).length;
  const staatenBei = (n) => (n ? Math.min(SP.staaten.length, Math.floor((n - 1) / 4) + 1) : 0);
  const teileZaehler = () => neueTeile() + ((stand.gym && stand.gym.seances) || 0); // Teile + fertige Word Gyms
  const staatenFrei = () => staatenBei(teileZaehler());

  function spielstand() {
    if (!stand.spiel) { // Erstes Mal: was schon geschafft ist, zählt mit
      const einheiten = stand.erledigt.length + Object.values(stand.gruppen || {}).reduce((a, l) => a + l.length, 0);
      stand.spiel = { punkte: neueTeile() * PUNKTE.teil + einheiten * PUNKTE.einheit, tage: {}, wochen: [], feuer: [], wochenende: [], karten: [], abzeichen: [], titel: 0 };
      stand.spiel.titel = titelIndex(stand.spiel.punkte);
      speichern();
    }
    const sp = stand.spiel; // Coins (29.10.2026): gespiegelte Währung, nicht rückwirkend – ein älterer Stand startet bei 0
    if (!(sp.coins >= 0)) sp.coins = 0;
    if (!Array.isArray(sp.gekauft)) sp.gekauft = [];
    if (!(sp.ausgegeben >= 0)) sp.ausgegeben = 0;
    return sp;
  }
  function serie() {
    const sp = spielstand();
    let d = heute(), n = 0;
    if (!sp.tage[iso(d)]) d = plusTage(d, -1);
    for (let i = 0; i < 400; i++, d = plusTage(d, -1)) {
      if (!istSchultag(d)) continue;
      if (sp.tage[iso(d)]) n++; else break;
    }
    return n;
  }
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
  function belohne(erstesMal, ohneHilfe, istGym) {
    const sp = spielstand(), d = heute(), tag = iso(d);
    const vorher = staatenBei(teileZaehler() - (erstesMal ? 1 : 0));
    let plus = istGym ? PUNKTE.seance : erstesMal ? PUNKTE.teil : PUNKTE.wiederholung;
    if (erstesMal && ohneHilfe && !istGym) { plus += PUNKTE.ohneHilfe; ereignisse.push({ art: "toast", text: T(`💪 Ohne Hilfe +${PUNKTE.ohneHilfe}`, `💪 No hints +${PUNKTE.ohneHilfe}`) }); }
    const bonus = istGym ? 0 : hwBonus(plus); // 📝 Homework: +50 % auf die Teil-Punkte (aufgerundet), je Teil einmal pro Hausaufgabe
    if (bonus) { plus += bonus; ereignisse.push({ art: "toast", text: `📝 Homework +${bonus}` }); }
    const ersterDesTages = !sp.tage[tag];
    sp.tage[tag] = (sp.tage[tag] || 0) + 1;
    if (staatenFrei() > vorher) ereignisse.push({ art: "staat", staat: SP.staaten[staatenFrei() - 1] });
    if (ersterDesTages) {
      if (!istSchultag(d)) {
        if (d.getDay() === 0 || d.getDay() === 6) { sp.wochenende.push(tag); plus += PUNKTE.wochenende; ereignisse.push({ art: "toast", text: `🏖️ Weekend bonus +${PUNKTE.wochenende}` }); }
        else { (sp.ferien = sp.ferien || []).push(tag); plus += PUNKTE.ferien; ereignisse.push({ art: "toast", text: `🌴 Holiday bonus +${PUNKTE.ferien}` }); }
      } else {
        const n = serie();
        if (n >= 3 && n % 3 === 0 && !sp.feuer.includes(tag)) {
          sp.feuer.push(tag); plus += PUNKTE.feuer;
          ereignisse.push({ art: "feier", symbol: "🔥", titel: `On fire! ${n} days in a row`,
            text: T(`${n} Schultage am Stück – +${PUNKTE.feuer} Punkte!`, `${n} school days in a row – +${PUNKTE.feuer} points!`), ton: SP.texte.feuer });
        }
        const mo = montag(d);
        if (schultageDerWoche(mo).every((x) => sp.tage[iso(x)]) && !sp.wochen.includes(iso(mo))) {
          sp.wochen.push(iso(mo)); plus += PUNKTE.woche;
          const karte = SP.landmarks.find((l) => !sp.karten.includes(l.id));
          if (karte) { sp.karten.push(karte.id); ereignisse.push({ art: "karte", karte }); }
          if (sp.karten.length === SP.landmarks.length && !sp.abzeichen.includes("roadtrip")) {
            sp.abzeichen.push("roadtrip");
            ereignisse.push({ art: "feier", symbol: "🇺🇸", titel: "Great American Road Trip complete!",
              text: T("Du hast alle zehn Landmark-Karten gesammelt!", "You collected all ten landmark cards!"), ton: SP.texte.team });
          }
          const ws = wochenSerie(mo);
          if (ws >= 4 && ws % 4 === 0) {
            plus += PUNKTE.monat; if (!sp.abzeichen.includes("monat")) sp.abzeichen.push("monat");
            ereignisse.push({ art: "feier", symbol: "👑", titel: "Perfect month!",
              text: T(`${ws} perfekte Wochen hintereinander – +${PUNKTE.monat} Punkte und ein goldener Rahmen!`,
                `${ws} perfect weeks in a row – +${PUNKTE.monat} points and a golden frame!`), ton: SP.texte.monat });
          }
        }
      }
    }
    punkteDazu(plus);
  }
  function einheitBonus() { punkteDazu(PUNKTE.einheit); }
  function punkteDazu(plus) {
    const sp = spielstand();
    sp.punkte += plus; sp.coins += plus; // jeder Punkt bringt auch einen Coin (Coins sinken nur im Shop)
    ereignisse.unshift({ art: "toast", text: `+${plus} ⭐ · +${plus} 🪙` });
    const t = titelIndex(sp.punkte);
    if (t > sp.titel) {
      sp.titel = t;
      const ti = SP.titel[t];
      ereignisse.push({ art: "feier", symbol: t === SP.titel.length - 1 ? "👑" : "🎓", titel: ti.name, text: T(`Neuer Titel: ${ti.name}!`, `New title: ${ti.name}!`), ton: ti });
    }
    speichern();
    setTimeout(zeigeEreignisse, 50);
  }

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
  // Reisestempel beim Freischalten eines neuen Staates: kurz (2 s), antippen schließt, hält die Übung nicht auf
  function stempel(bild, name, unter) {
    const farben = ["#c8283a", "#1d3f8f", "#f2b705"];
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
  // Umriss des Staates, Ausschnitt passend zugeschnitten
  function staatStempel(staat) {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "stempel-bild"); svg.setAttribute("aria-hidden", "true");
    const pfad = document.createElementNS(NS, "path");
    pfad.setAttribute("d", SP.karte[staat.id] || ""); svg.append(pfad);
    stempel(svg, staat.name, "Visited ✓");
    try {
      const b = pfad.getBBox(), rand = Math.max(b.width, b.height) * 0.12;
      svg.setAttribute("viewBox", `${b.x - rand} ${b.y - rand} ${b.width + 2 * rand} ${b.height + 2 * rand}`);
    } catch { svg.setAttribute("viewBox", "0 0 975 610"); }
  }
  // Reihenfolge (nie gleichzeitig): kleine Hinweise sofort · großes Pop-up mit Stimme zuerst · Stempel danach, wenn es still ist
  const grossEreignis = (e) => e.art === "feier" || e.art === "karte";
  let stempelLaeuft = false;
  function zeigeEreignisse() {
    for (let i = 0; i < ereignisse.length;) { if (ereignisse[i].art === "toast") toast(ereignisse.splice(i, 1)[0].text); else i++; }
    if (feier.open || stempelLaeuft) return;
    const gi = ereignisse.findIndex(grossEreignis);
    if (gi >= 0) return zeigeFeier(ereignisse.splice(gi, 1)[0]);
    const si = ereignisse.findIndex((e) => e.art === "staat");
    if (si < 0) return;
    const e = ereignisse.splice(si, 1)[0];
    stempelLaeuft = true;
    audioEnde.then(() => setTimeout(() => {
      staatStempel(e.staat);
      setTimeout(() => { stempelLaeuft = false; zeigeEreignisse(); }, 2700);
    }, 250));
  }
  function zeigeFeier(e) {
    const ton = e.art === "karte" ? e.karte : e.ton;
    const inhalt = e.art === "karte"
      ? [el("p", { class: "feier-klein" }, T("⭐ Perfect week! Neue Landmark-Karte:", "⭐ Perfect week! New landmark card:")), landmarkKarte(e.karte, true),
         el("p", { class: "steckbrief", lang: "en" }, e.karte.steckbrief)]
      : [el("div", { class: "feier-symbol", "aria-hidden": "true" }, e.symbol), el("h2", { id: "feier-titel", lang: "en" }, e.titel), el("p", {}, e.text)];
    feier.replaceChildren(konfetti(), ...inhalt,
      el("div", { class: "knopfreihe" },
        ton && ton.audio && knopf(T("🔊 Anhören", "🔊 Listen"), () => spiele([ton.audio])),
        knopf(T("Weiter ➜", "Next ➜"), () => { feier.close(); stopp(); setTimeout(zeigeEreignisse, 300); }, "haupt")));
    feier.showModal();
    if (ton && ton.audio) spiele([ton.audio], { warten: true }); // wartet, falls noch ein Lob läuft
  }
  function konfetti() {
    const farben = ["#c8283a", "#1d3f8f", "#ffffff", "#ffd23f", "#8fb0ff"];
    return el("div", { class: "konfetti", "aria-hidden": "true" }, Array.from({ length: 36 }, (_, i) =>
      el("span", { style: `left:${(i * 37) % 100}%;background:${farben[i % 5]};animation-delay:${(i % 9) * 0.12}s` })));
  }

  function statusleiste() {
    const sp = spielstand(), t = SP.titel[sp.titel];
    return el("div", { class: "statusleiste" + (sp.abzeichen.includes("monat") ? " gold" : "") + rahmenKlasse() },
      el("span", { class: "status-titel", lang: "en" }, (sp.titel === SP.titel.length - 1 ? "👑 " : "🎓 ") + t.name),
      el("span", {}, `⭐ ${sp.punkte} ${T("Punkte", "points")}`),
      el("span", { class: "status-coins", title: "Coins" }, `🪙 ${sp.coins}`),
      el("span", { title: T("Schultage am Stück", "School days in a row") }, `🔥 ${serie()}`),
      knopf(T("🏆 Meine Sammlung", "🏆 My collection"), sammlung, "haupt"));
  }

  function landmarkKarte(l, gross) {
    return el("figure", { class: "landmarkkarte" + (gross ? " gross" : "") },
      el("div", { class: "holo" }, el("img", { src: l.bild, alt: l.name, loading: "lazy" })),
      el("figcaption", { lang: "en" }, el("strong", {}, l.name)));
  }

  function sammlung() {
    lage = null; ansicht = sammlung;
    const sp = spielstand(), t = sp.titel, naechster = SP.titel[t + 1];
    const mo = montag(heute());
    const TAGE = E() ? ["Mon", "Tue", "Wed", "Thu", "Fri"] : ["Mo", "Di", "Mi", "Do", "Fr"];
    const woche = TAGE.map((name, i) => {
      const d = plusTage(mo, i), frei = !istSchultag(d), ok = !!sp.tage[iso(d)];
      return el("li", { class: frei ? "frei" : ok ? "ok" : "" }, el("span", {}, name), el("b", {}, frei ? "–" : ok ? "🔥" : "○"));
    });
    const abz = [
      ["🔥", "On fire", sp.feuer.length > 0], ["⭐", "Perfect week", sp.wochen.length > 0], ["🏅", "5 × perfect", sp.wochen.length >= 5],
      ["👑", "Perfect month", sp.abzeichen.includes("monat")], ["🏖️", "Weekend hero", sp.wochenende.length > 0], ["🌴", "Holiday hero", (sp.ferien || []).length > 0],
      ["🗺️", "All 50 states", staatenFrei() === SP.staaten.length], ["🇺🇸", "Road trip complete", sp.abzeichen.includes("roadtrip")],
      ["🏆", "All categories", D.kategorien.filter((k) => !k.bald && !k.spiele).every((k) => stand.erledigt.includes(k.nr) && !faellige(k.nr + "|"))],
    ];
    const fakt = el("div", { class: "fakt", hidden: true, "aria-live": "polite" });
    const frei = staatenFrei();
    const karte = usaKarte(frei, (s) => {
      fakt.hidden = false;
      fakt.replaceChildren(el("h3", { lang: "en" }, s.name), el("p", { lang: "en" }, s.fakt),
        s.audio && knopf(T("🔊 Anhören", "🔊 Listen"), () => spiele([s.audio])));
      if (s.audio) spiele([s.audio]);
    });
    const karten = el("div", { class: "heldenraster" }, SP.landmarks.map((l) => sp.karten.includes(l.id)
      ? el("button", { class: "held-knopf", onclick: () => karteZeigen(l) }, landmarkKarte(l))
      : el("div", { class: "held-zu", "aria-label": T("Noch nicht gesammelt", "Not collected yet") }, el("span", {}, "?"), el("small", {}, "Perfect week"))));
    zeige(
      el("header", { class: "kopf" }, knopf("← Start", startseite, "leise"), el("h1", {}, T("🏆 Meine Sammlung", "🏆 My collection"))),
      el("section", { class: "satzkarte titel-karte" + (sp.abzeichen.includes("monat") ? " gold" : "") + rahmenKlasse() },
        el("p", { class: "klein" }, T("Dein Titel", "Your title")),
        el("h2", { lang: "en" }, (t === SP.titel.length - 1 ? "👑 " : "🎓 ") + SP.titel[t].name),
        el("p", {}, `⭐ ${sp.punkte} ${T("Punkte", "points")}`),
        el("p", { class: "coins-zeile" }, `🪙 Coins: ${sp.coins} · ${T("ausgegeben", "spent")}: ${sp.ausgegeben}`, " ", knopf("🛍️ Shop", shop, "leise")),
        naechster && el("div", { class: "fortschritt" }, el("span", { style: `width:${Math.round(100 * (sp.punkte - SP.titel[t].ab) / (naechster.ab - SP.titel[t].ab))}%` })),
        naechster && el("p", { class: "klein" }, T(`Noch ${naechster.ab - sp.punkte} Punkte bis „${naechster.name}“`, `${naechster.ab - sp.punkte} more points to “${naechster.name}”`))),
      el("section", { class: "satzkarte" },
        el("h2", {}, `🗺️ USA (${frei} / ${SP.staaten.length} ${T("Staaten", "states")})`),
        el("p", { class: "klein" }, T("Alle 4 geschafften Teile schaltest du einen neuen Staat frei. Tipp auf einen Staat!", "Every 4 parts you finish unlock a new state. Tap a state!")),
        karte, fakt),
      el("section", { class: "satzkarte" },
        el("h2", {}, T("Diese Woche", "This week")),
        el("ol", { class: "wochenleiste" }, woche),
        el("p", { class: "klein" }, T(`🔥 ${serie()} Schultage am Stück · ⭐ ${sp.wochen.length} perfekte Wochen. Übst du an jedem Schultag, bekommst du eine neue Landmark-Karte! Ferien und Feiertage zählen nicht – deine Serie bleibt.`,
          `🔥 ${serie()} school days in a row · ⭐ ${sp.wochen.length} perfect weeks. Practise every school day and you get a new landmark card! Holidays don't count – your streak stays.`))),
      el("section", { class: "satzkarte" },
        el("h2", {}, `🏞️ Landmarks (${sp.karten.length} / ${SP.landmarks.length})`), karten),
      aktenBereich(),
      el("section", { class: "satzkarte" },
        el("h2", {}, T("Abzeichen", "Badges")),
        el("ul", { class: "abzeichen" }, abz.map(([sym, name, ok]) => el("li", { class: ok ? "ok" : "" },
          el("span", { "aria-hidden": "true" }, sym), el("span", { lang: "en" }, name), el("span", { class: "unsichtbar" }, ok ? "✓" : "–"))))),
      el("p", { class: "klein bildnachweis" }, T("Fotos: Carol M. Highsmith, Library of Congress (frei nutzbar). Karte: US Census Bureau / us-atlas.",
        "Photos: Carol M. Highsmith, Library of Congress (no known restrictions). Map: US Census Bureau / us-atlas.")));
  }

  /* ---------- 🛍️ Shop (Coins; docs/gamification/konzept.md „Coins und Shop“) ----------
     Artikel kommen aus D.spiel.shop (Bauskript). Nichts ist gratis. Die Sperre bei zu wenig Coins gilt im Programm (kaufe), nicht nur am Knopf. */
  const rahmenKlasse = () => { const sp = spielstand(); return sp.rahmen && sp.gekauft.includes("rahmen_" + sp.rahmen) ? " rahmen-" + sp.rahmen : ""; };
  function konfettiFrei() {
    const box = el("div", { class: "konfetti-frei", "aria-hidden": "true" }, konfetti());
    document.body.append(box);
    setTimeout(() => box.remove(), 2800);
  }
  function kaufe(a) {
    const sp = spielstand();
    if (a.bald) { toast(tx(a.hinweis)); return false; }
    if (sp.gekauft.includes(a.id)) { if (a.rahmen) { sp.rahmen = a.rahmen; speichern(); } return false; }
    if (sp.coins < a.preis) { toast(T(`Noch ${a.preis - sp.coins} Coins`, `${a.preis - sp.coins} more coins`)); return false; }
    if (!confirm(T(`Für ${a.preis} Coins kaufen?`, `Buy for ${a.preis} coins?`))) return false;
    sp.coins -= a.preis; sp.ausgegeben += a.preis; sp.gekauft.push(a.id);
    if (a.rahmen) sp.rahmen = a.rahmen;
    speichern();
    ereignisse.push({ art: "toast", text: `🪙 −${a.preis}` });
    setTimeout(zeigeEreignisse, 50); konfettiFrei();
    return true;
  }
  function shop() {
    lage = null; ansicht = shop;
    const sp = spielstand();
    const artikel = (SP.shop || []).map((a) => {
      const hat = sp.gekauft.includes(a.id), fehlt = a.preis - sp.coins, aktiv = a.rahmen && sp.rahmen === a.rahmen && hat;
      let k;
      if (a.bald) k = el("span", { class: "shop-hinweis" }, tx(a.hinweis));
      else if (hat && a.rahmen) k = aktiv ? el("span", { class: "shop-hinweis ok" }, T("✓ Angelegt", "✓ Wearing it")) : knopf(T("Anlegen", "Put it on"), () => { kaufe(a); shop(); });
      else if (hat) k = el("span", { class: "shop-hinweis ok" }, T("✓ Gekauft", "✓ Bought"));
      else if (fehlt > 0) k = sperrt(knopf(T(`Noch ${fehlt} Coins`, `${fehlt} more coins`), () => { kaufe(a); shop(); }));
      else k = knopf(T("Kaufen", "Buy"), () => { if (kaufe(a)) shop(); }, "haupt");
      return el("div", { class: "shop-artikel" + (hat ? " gekauft" : "") + (a.bald ? " bald" : "") + (a.rahmen ? " rahmen-" + a.rahmen : ""), "data-artikel": a.id },
        el("span", { class: "sym", "aria-hidden": "true" }, a.symbol),
        el("strong", {}, tx(a.name)), a.unter && el("span", { class: "unter" }, tx(a.unter)),
        el("span", { class: "preis" }, `🪙 ${a.preis}`),
        a.bald && el("span", { class: "bald-schild" }, T("kommt bald", "coming soon")),
        k);
    });
    zeige(
      el("header", { class: "kopf" }, knopf("← Start", startseite, "leise"), el("h1", {}, "🛍️ Shop")),
      el("section", { class: "satzkarte shop-stand" },
        el("p", { class: "shop-coins" }, `🪙 ${sp.coins} Coins`),
        el("p", { class: "klein" }, T("Jeder Punkt bringt dir auch einen Coin. Punkte bleiben – Coins kannst du hier ausgeben.",
          "Every point also gives you a coin. Points stay – coins are yours to spend here."))),
      el("div", { class: "shop-raster" }, artikel),
      el("div", { class: "knopfreihe" }, knopf(T("🏆 Meine Sammlung", "🏆 My collection"), sammlung)));
  }

  /* ---------- Mini-Reward beim Vokabellernen (Word Gym, Vocabulary-Abfrage): ab 3 richtigen in Folge ----------
     Nur Show, keine Punkte. Im Wechsel: Flamme wächst · Münzen fliegen ins 🪙 · ein Auto flitzt vorbei. Bei prefers-reduced-motion nur Text. */
  const COMBO_AB = 3, COMBO_FAHRZEUG = "🚗";
  const comboErlaubt = () => !!lage && (!!lage.gym || (lage.teile && lage.teile[lage.teil] && lage.teile[lage.teil].art === "vok_abfrage"));
  const comboFlamme = () => (comboErlaubt() && richtigSerie >= COMBO_AB
    ? el("span", { class: "combo-flamme", style: `--n:${Math.min(richtigSerie - COMBO_AB, 8)}`, role: "status", "aria-label": T(`${richtigSerie} richtig in Folge`, `${richtigSerie} in a row`) },
        `🔥 ${richtigSerie}`, el("span", { class: "combo-ziel", "aria-hidden": "true" }, "🪙"))
    : null);
  const ruhig = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function comboTreffer() { richtigSerie++; fehlerSerie = 0; comboPruefen(); }
  function comboPruefen() {
    if (!comboErlaubt() || richtigSerie < COMBO_AB) return;
    const art = (richtigSerie - COMBO_AB) % 3;
    setTimeout(() => comboAnimation(art), 80); // die nächste Karte ist dann schon gezeichnet
  }
  function comboAnimation(art) {
    const flamme = app.querySelector(".combo-flamme");
    if (!flamme) return;
    if (ruhig()) { flamme.classList.add("text"); return; }
    if (art === 0) { flamme.classList.remove("wachs"); void flamme.offsetWidth; flamme.classList.add("wachs"); return; }
    if (art === 2) { const f = el("div", { class: "combo-fahrzeug", "aria-hidden": "true" }, COMBO_FAHRZEUG); document.body.append(f); setTimeout(() => f.remove(), 1800); return; }
    const ziel = flamme.querySelector(".combo-ziel"), r = ziel.getBoundingClientRect();
    const zx = r.left + r.width / 2, zy = r.top + r.height / 2, sx = innerWidth / 2, sy = innerHeight * 0.55;
    const box = el("div", { class: "combo-muenzen", "aria-hidden": "true" },
      el("span", { class: "combo-text", style: `left:${sx}px;top:${sy - 40}px` }, "🪙 +Combo"),
      Array.from({ length: 6 }, (_, i) => el("span", { class: "combo-muenze", style: `left:${sx + (i - 2.5) * 22}px;top:${sy}px;--dx:${zx - sx - (i - 2.5) * 22}px;--dy:${zy - sy}px;animation-delay:${i * 0.07}s` }, "🪙")));
    document.body.append(box);
    setTimeout(() => box.remove(), 1600);
  }
  function comboBruch() {
    const war = richtigSerie; richtigSerie = 0;
    const flamme = app.querySelector(".combo-flamme");
    if (war < COMBO_AB || !flamme || ruhig()) return;
    const r = flamme.getBoundingClientRect();
    const puff = el("div", { class: "combo-puff", "aria-hidden": "true", style: `left:${r.left}px;top:${r.top}px` }, "💨");
    document.body.append(puff);
    setTimeout(() => puff.remove(), 900);
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
      el("p", { class: "klein" }, T("Tipp auf ein farbiges Wort: Dann siehst du die Bedeutung.", "Tap a coloured word to see what it means.")),
      ...a.absaetze.map((x) => el("p", { class: "akten-text", lang: "en" }, aktenWoerter(x))),
      el("h3", {}, "Questions"),
      el("ol", { class: "akten-fragen" }, a.fragen.map((f) => {
        const lsg = el("p", { class: "akten-antwort", lang: "en", hidden: true }, f.antwort);
        return el("li", {}, el("span", { lang: "en" }, f.frage), " ", knopf(T("Lösung", "Solution"), () => { lsg.hidden = false; gesehen.add(f); if (gesehen.size === a.fragen.length && !lobBox.textContent) lobBox.textContent = lob(true); }, "leise"), lsg);
      })),
      lobBox,
      el("div", { class: "knopfreihe" }, knopf(T("Schließen", "Close"), () => { feier.close(); feier.classList.remove("akte"); }, "haupt")));
    feier.addEventListener("close", () => feier.classList.remove("akte"), { once: true });
    feier.showModal();
  }
  function aktenBereich() {
    const kacheln = SP.akten.map((a) => {
      const offen = spielstand().karten.includes(a.figur) && SP.staaten.findIndex((s) => s.id === a.ort) < staatenFrei();
      return offen
        ? el("button", { class: "akte-kachel offen", onclick: () => aktenZeigen(a) }, el("span", { "aria-hidden": "true" }, "📂"), el("strong", { lang: "en" }, a.titel))
        : el("div", { class: "akte-kachel zu" }, el("span", { "aria-hidden": "true" }, "🔒"), el("strong", { lang: "en" }, a.titel.replace(/ – .*/, "")),
            el("small", {}, T("Du brauchst: ", "You need: ") + (SP.landmarks.find((l) => l.id === a.figur) || {}).name + " + " + (SP.staaten.find((s) => s.id === a.ort) || {}).name));
    });
    return el("section", { class: "satzkarte" }, el("h2", {}, `🔒 Road Trip Files (${SP.akten.filter((a) => spielstand().karten.includes(a.figur) && SP.staaten.findIndex((s) => s.id === a.ort) < staatenFrei()).length} / ${SP.akten.length})`),
      el("p", { class: "klein" }, T("Eine Akte öffnet sich, wenn du die Landmark-Karte hast und den Staat freigeschaltet hast.", "A file opens when you have the landmark card and have unlocked the state.")), el("div", { class: "akten" }, kacheln));
  }

  function karteZeigen(l) {
    feier.replaceChildren(landmarkKarte(l, true), el("p", { class: "steckbrief", lang: "en" }, l.steckbrief),
      el("div", { class: "knopfreihe" }, l.audio && knopf(T("🔊 Anhören", "🔊 Listen"), () => spiele([l.audio])),
        knopf(T("Schließen", "Close"), () => { feier.close(); stopp(); }, "haupt")));
    feier.showModal();
    if (l.audio) spiele([l.audio]);
  }

  function usaKarte(frei, waehle) {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 975 610"); svg.setAttribute("class", "usa"); svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", T("Karte der USA", "Map of the USA"));
    const offen = new Map(SP.staaten.slice(0, frei).map((s) => [s.id, s]));
    Object.entries(SP.karte).forEach(([id, d]) => {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", d);
      const s = offen.get(id);
      const nr = s ? SP.staaten.indexOf(s) : -1;
      p.setAttribute("class", "u-staat" + (s ? " offen" + (nr % 2 ? " b" : "") + (nr === frei - 1 ? " neu" : "") : ""));
      if (s) {
        p.setAttribute("tabindex", "0"); p.setAttribute("role", "button"); p.setAttribute("aria-label", s.name);
        const t = document.createElementNS(NS, "title"); t.textContent = s.name; p.append(t);
        p.addEventListener("click", () => waehle(s));
        p.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); waehle(s); } });
      }
      svg.append(p);
    });
    const liste = SP.staaten.slice(0, frei).map((s, i) => el("button", { class: "staat-chip" + (i % 2 ? " b" : ""), lang: "en",
      onclick: () => waehle(s) }, s.name));
    return el("div", { class: "usa-block" }, el("div", { class: "usa-rahmen" }, svg),
      el("p", { class: "staaten-zahl" }, T(`${frei} von ${SP.staaten.length} Staaten freigeschaltet`, `${frei} of ${SP.staaten.length} states unlocked`)),
      el("div", { class: "staaten-liste" }, liste));
  }

  /* ---------- Word Gym: tägliches Vokabeltraining (docs/word-gym/konzept.md) ----------
     Jeden Tag ein festes Pensum: neue Wörter hören und nachsprechen, fällige Wörter aus dem Deutschen
     abrufen und selbst bewerten. Boxen mit Stufe 0–7 und Fälligkeit (Intervalle in D.gym.intervalle). */
  const GYM = D.gym || { pensum: { neu: 4, wdh: 8 }, grenzen: { neu: [1, 6], wdh: [4, 12] }, intervalle: [1, 3, 7, 14, 30, 60, 120] };
  const GYM_REIHE = Object.fromEntries(D.vokabeln.map((v, i) => [v.id, i]));
  const GYM_SPRECH_MIN = 1.5;
  const gymFrei = new Set();
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
    const arme = (h) => `M60 66 L40 ${h} M60 66 L80 ${h}`;
    const buecher = (x) => `<g transform="translate(${x} 0)">
      <rect x="2" y="-13" width="26" height="8" rx="1.5" class="b1"/><rect x="4" y="-4" width="22" height="8" rx="1.5" class="b2"/><rect x="1" y="5" width="28" height="8" rx="1.5" class="b3"/></g>`;
    const d = document.createElement("div");
    d.innerHTML = `<svg class="gym-icon${heben ? " hebt" : ""}" viewBox="0 0 120 100" width="${groesse || 96}" height="${Math.round((groesse || 96) * 0.83)}" aria-hidden="true">
      <path class="arme" d="${arme(y0)}">${heben ? `<animate attributeName="d" begin="indefinite" dur="1.4s" fill="freeze" values="${arme(46)}; ${arme(46)}; ${arme(16)}" keyTimes="0; .3; 1" calcMode="spline" keySplines=".4 0 .2 1; .4 0 .2 1"/>` : ""}</path>
      <circle class="kopf" cx="60" cy="52" r="8.5"/><path class="figur" d="M60 62 V78 M60 78 L49 96 M60 78 L71 96"/>
      <g class="hantel" transform="translate(0 ${y0})">${heben ? `<animateTransform attributeName="transform" type="translate" begin="indefinite" dur="1.4s" fill="freeze" values="0 46; 0 46; 0 16" keyTimes="0; .3; 1" calcMode="spline" keySplines=".4 0 .2 1; .4 0 .2 1"/>` : ""}
        <line class="stange" x1="22" y1="0" x2="98" y2="0"/><circle class="stange-f" cx="30" cy="0" r="5.5"/><circle class="stange-f" cx="90" cy="0" r="5.5"/>
        ${buecher(0)}${buecher(90)}<circle class="hand" cx="40" cy="0" r="5"/><circle class="hand" cx="80" cy="0" r="5"/></g></svg>`;
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
    const stand_ = gesamt === 0 ? T("Heute ist nichts fällig – morgen geht's weiter!", "Nothing due today – see you tomorrow!")
      : plan.geschafft ? T("✓ Heute geschafft – bis morgen!", "✓ Done for today – see you tomorrow!")
        : T(`${plan.neu.length} neu · ${plan.wdh.length} wiederholen · ${fertig} / ${gesamt} fertig`, `${plan.neu.length} new · ${plan.wdh.length} to revise · ${fertig} / ${gesamt} done`);
    const einstellung = el("div", { class: "gym-einstellung", hidden: true });
    const wahl = (schluessel, label, grenzen) => {
      const sel = el("select", { "aria-label": label, onchange: () => {
        g.pensum[schluessel] = +sel.value;
        if (g.tag && g.tag.d === iso(heute()) && !g.tag.fertig.length) g.tag = null; // heute noch nicht begonnen: Plan neu
        speichern(); startseite();
      } });
      for (let n = grenzen[0]; n <= grenzen[1]; n++) sel.append(el("option", { value: n, selected: n === p[schluessel] }, n + (n === GYM.pensum[schluessel] ? T(" (Mr. Alex empfiehlt)", " (Mr. Alex recommends)") : "")));
      return el("label", {}, label, sel);
    };
    einstellung.append(wahl("neu", T("Neue Wörter pro Tag", "New words a day"), GYM.grenzen.neu), wahl("wdh", T("Wiederholungen pro Tag", "Revisions a day"), GYM.grenzen.wdh),
      el("p", { class: "klein" }, T("Gilt ab morgen – oder schon heute, wenn du heute noch nicht angefangen hast.", "Applies from tomorrow – or today if you haven't started yet.")));
    return el("section", { class: "gym-karte" + (plan.geschafft ? " fertig" : "") },
      gymIcon(plan.geschafft, false, 92),
      el("div", { class: "gym-text" },
        el("h2", { lang: "en" }, "Word Gym"),
        el("p", { class: "klein" }, stand_), gesamt > 0 && punkte),
      el("div", { class: "gym-knoepfe" },
        knopf(plan.geschafft || gesamt === 0 ? T("Ansehen", "Have a look") : fertig ? T("▶ Weiter", "▶ Continue") : T("▶ Los geht's", "▶ Let's go"), gymStart, plan.geschafft ? "" : "haupt"),
        plan.geschafft && knopf(T("🎲 Memory", "🎲 Memory"), gymMemory, "haupt"),
        el("button", { class: "knopf leise", "aria-label": T("Pensum einstellen", "Set workload"), "aria-expanded": "false",
          onclick: (e) => { einstellung.hidden = !einstellung.hidden; e.currentTarget.setAttribute("aria-expanded", String(!einstellung.hidden)); } }, "⚙")),
      einstellung);
  }

  function gymKopf() {
    return el("header", { class: "kopf" }, knopf("← Start", startseite, "leise"),
      el("h1", { lang: "en", class: "gym-titel" }, gymIcon(false, false, 40), "Word Gym"));
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
    ansicht = gymZeige;
    const plan = gymPlan(), g = gymStand();
    const id = gym.schlange[gym.pos], v = vokabel(id), s = D.saetze[v.satz];
    lage = { gym: true, teil: "gym", pos: id, frei: gymFrei, titel: "Word Gym" };
    const zaehler = `${gym.pos + 1} / ${gym.schlange.length}`;
    if (plan.neu.includes(id) && !g.karten[id]) gymNeu(v, s, zaehler); else gymWiederholung(v, s, zaehler);
  }
  const gymMerke = (id) => { const plan = gymPlan(); if (!plan.fertig.includes(id)) plan.fertig.push(id); speichern(); };
  const gymSatz = (s, art) => s && el("div", { class: "spalten" },
    el("div", { class: "spalte", lang: "en" }, el("span", { class: "sprache" }, "Example"), el("p", { class: "satz" }, lueckenSatz(s, art))),
    !E() && el("div", { class: "spalte", lang: "de" }, el("span", { class: "sprache" }, "Deutsch"), el("p", { class: "satz de" }, s.de)));
  const gymTon = (v, s) => [tonWort(v), s && tonSatz(s)];

  function gymNeu(v, s, zaehler) {
    const balken = jetztDu();
    const weiter = sperre(knopf(T("Weiter ➜", "Next ➜"), () => {
      gymStand().karten[v.id] = { s: 0, f: gymFaellig(0) };
      gymMerke(v.id); gymWeiter();
    }, "haupt weiter"));
    const abspielen = () => nachsprechen(balken, gymTon(v, s), GYM_SPRECH_MIN).then((sek) => { if (sek) gibFrei(weiter, sek); });
    lage.abspielen = abspielen; lage.weiter = wennFrei(weiter, () => weiter.click());
    zeige(gymKopf(),
      ansage("New word! Listen and repeat.", "Neues Wort! Hör zu und sprich nach."),
      karte(`${zaehler} · ${T("neu", "new")}`,
        el("div", { class: "vok" }, el("div", {}, el("p", { class: "vok-en", lang: "en" }, v.en), el("p", { class: "vok-de", lang: "de" }, v.de))),
        gymSatz(s, "voll"), balken,
        el("div", { class: "knopfreihe" }, knopf(T("🔊 Nochmal", "🔊 Again"), abspielen), weiter)));
    abspielen();
  }

  function gymWiederholung(v, s, zaehler) {
    const k = gymStand().karten[v.id] || { s: 0 };
    const balken = jetztDu();
    const frage = el("div", { class: "vok" }, el("div", {}, el("p", { class: "vok-en", lang: "de" }, v.de), s && el("p", { class: "satz de", lang: "de" }, s.de)));
    const antwort = el("div", { class: "gym-antwort", hidden: true },
      el("p", { class: "vok-en", lang: "en" }, v.en), gymSatz(s, "voll"));
    const bewerten = el("div", { class: "knopfreihe gym-bewerten", hidden: true },
      knopf(T("😊 Gewusst", "😊 I knew it"), () => gymBewerte(v, true), "haupt"),
      knopf(T("🔁 Nochmal", "🔁 Again"), () => gymBewerte(v, false), "encore"));
    const loesung = sperre(knopf(T("Lösung", "Solution"), () => {
      loesung.hidden = true; antwort.hidden = false; bewerten.hidden = false;
      nachsprechen(balken, gymTon(v, s), GYM_SPRECH_MIN);
      lage.abspielen = () => nachsprechen(balken, gymTon(v, s), GYM_SPRECH_MIN); lage.weiter = null;
    }, "haupt"));
    gibFrei(loesung, denkzeit(s ? s.en : v.en), false);
    lage.abspielen = null; lage.weiter = wennFrei(loesung, () => loesung.click());
    zeige(gymKopf(),
      ansage("What's that in English? Say it out loud. Then tap “Solution”.", "Was heißt das auf Englisch? Sag es laut! Dann tipp auf „Lösung“."),
      karte(`${zaehler} · ${T("Wiederholung", "revision")} · ${T("Box", "box")} ${k.s + 1}`,
        frage, antwort, balken, el("div", { class: "knopfreihe" }, loesung), bewerten));
  }

  function gymLobToast(r) {
    const t = el("div", { class: "toast lob-toast" }, el("strong", { lang: "en" }, r.text), !E() && r.de && el("span", { lang: "de" }, r.de));
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
      k.s = 0; k.f = gymFaellig(0); fehlerSerie++; comboBruch();
      if (!gym.wieder.has(v.id)) { gym.wieder.add(v.id); gym.schlange.push(v.id); } else gymMerke(v.id);
      toast(T("Kein Problem – kommt gleich noch mal.", "No problem – it comes back in a moment."));
    }
    speichern();
    gymWeiter();
  }

  /* ---------- Word Gym: Memory als Tages-Spiel (frei nach dem Tagespensum, Lösung B) ----------
     Paare aus den Wörtern von heute: englisches Wort ↔ deutsche Bedeutung. Beim Aufdecken hört man das englische Wort. */
  // Memory-Spielfeld (Word Gym und Games): englisches Wort ↔ deutsche Bedeutung, Wort beim Aufdecken vorspielen.
  // Punkte (+10) nur beim ersten gewonnenen Memory des Tages – eine Tagesmarke (gym.memoryTag) für beide Spiele.
  const memKurz = (de) => de.split(/[;,]/)[0].replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim();
  const memOk = (v) => v && memKurz(v.de).length > 0 && memKurz(v.de).length <= 24 && v.en.length <= 24;
  function memoryFeld(ws, gross) {
    const g = gymStand();
    const karten = mischen(ws.flatMap((v) => [{ v, art: "en" }, { v, art: "de" }]));
    let offen = [], gefunden = 0, zuege = 0, wartet = false;
    const box = rueckmeldung();
    const zaehler = el("p", { class: "klein", "aria-live": "polite" }, T("Züge: 0", "Moves: 0"));
    const feld = el("div", { class: "memory" + (gross ? " gross" : "") }, karten.map((c) => {
      const b = el("button", { class: "mem-karte", "aria-label": T("Verdeckte Karte", "Hidden card"), onclick: () => {
        if (wartet || b.classList.contains("auf")) return;
        b.classList.add("auf");
        const text = c.art === "en" ? c.v.en.replace(/\s*\(.*?\)/g, "") : memKurz(c.v.de);
        b.replaceChildren(el("span", { lang: c.art === "en" ? "en" : "de", class: text.length > 11 ? "mem-lang" : "" }, text));
        if (c.art === "en") spiele([tonWort(c.v)]);
        offen.push({ b, c });
        if (offen.length < 2) return;
        zuege++; zaehler.textContent = T(`Züge: ${zuege}`, `Moves: ${zuege}`);
        const [x, y] = offen; offen = [];
        if (x.c.v === y.c.v && x.c.art !== y.c.art) {
          x.b.classList.add("paar"); y.b.classList.add("paar"); x.b.disabled = y.b.disabled = true;
          if (++gefunden === ws.length) {
            const tag = iso(heute());
            const punkte = g.memoryTag !== tag; // Punkte nur beim ersten gewonnenen Memory des Tages
            if (punkte) { g.memoryTag = tag; punkteDazu(PUNKTE.spiel); }
            melde(box, "gut", `${lob(true)} ${T(`Alle ${ws.length} Paare in ${zuege} Zügen!`, `All ${ws.length} pairs in ${zuege} moves!`)}${punkte ? ` +${PUNKTE.spiel} ⭐` : T(" (Punkte gibt es einmal pro Tag.)", " (Points once a day.)")}`);
          }
        } else {
          wartet = true;
          setTimeout(() => { [x, y].forEach(({ b: k }) => { k.classList.remove("auf"); k.replaceChildren("?"); k.setAttribute("aria-label", T("Verdeckte Karte", "Hidden card")); }); wartet = false; }, 1300);
        }
      } }, "?");
      return b;
    }));
    return { feld, zaehler, box };
  }

  function gymMemory() {
    const plan = gymPlan(), g = gymStand();
    let ws = [...plan.wdh, ...plan.neu].map(vokabel).filter(memOk);
    if (ws.length < 6) ws.push(...mischen(Object.keys(g.karten).map(vokabel).filter((v) => memOk(v) && !ws.includes(v))).slice(0, 6 - ws.length));
    ws = mischen(ws).slice(0, 6);
    ansicht = null; lage = null;
    if (ws.length < 3) { zeige(gymKopf(), el("section", { class: "satzkarte" }, el("p", {}, T("Für das Spiel brauchst du erst ein paar geübte Wörter.", "You need a few words before you can play.")), knopf(T("Zur Startseite", "Home"), startseite, "haupt"))); return; }
    const m = memoryFeld(ws);
    lage = { gym: true, teil: "gym-memory", pos: 0, titel: "Word Gym" };
    zeige(gymKopf(), ansage("Memory: Find the pairs! English word and German meaning.", "Memory: Finde die Paare! Englisches Wort und deutsche Bedeutung."),
      karte(null, m.feld, m.zaehler, m.box, el("div", { class: "knopfreihe" }, knopf(T("↻ Neu mischen", "↻ Shuffle again"), gymMemory), knopf(T("Zur Startseite", "Home"), startseite, "leise"))));
  }

  /* ---------- Games: Lernspiele (Kategorie mit „spiele“) – erstes Spiel: Memory mit den Wörtern eines Unit-Abschnitts ---------- */
  const spielKopf = (k, titel, zurueck) => el("header", { class: "kopf" },
    knopf(T("← Zurück", "← Back"), zurueck, "leise"), el("h1", { lang: "en" }, `${k.titel} · ${titel}`));
  function zeigeSpiele(k) {
    lage = null; ansicht = () => zeigeSpiele(k);
    zeige(kopf(k), ansage("Choose a game.", "Wähl ein Spiel."),
      el("nav", { class: "kacheln gruppen" },
        el("button", { class: "kachel", onclick: () => memoryWahl(k), "aria-label": "Memory" },
          el("span", { class: "sym", "aria-hidden": "true" }, "🎲"),
          el("span", { class: "titel", lang: "en" }, "Memory"),
          el("span", { class: "unter" }, T("Wort und Bedeutung finden – 6 Paare", "Match word and meaning – 6 pairs"))),
        el("button", { class: "kachel", onclick: () => spielPatrol(k), "aria-label": "Border Patrol" },
          el("span", { class: "sym", "aria-hidden": "true" }, "🛂"),
          el("span", { class: "titel", lang: "en" }, "Border Patrol"),
          el("span", { class: "unter" }, T("Britisch oder amerikanisch? Wörter einsortieren", "British or American? Sort the words"))),
        el("button", { class: "kachel", onclick: () => catchWahl(k), "aria-label": "Catch the Word" },
          el("span", { class: "sym", "aria-hidden": "true" }, "🎯"),
          el("span", { class: "titel", lang: "en" }, "Catch the Word"),
          el("span", { class: "unter" }, T("Wort hören und fangen, bevor es unten ist", "Hear the word and catch it before it lands"))),
        el("button", { class: "kachel", onclick: () => beeWahl(k), "aria-label": "Spelling Bee" },
          el("span", { class: "sym", "aria-hidden": "true" }, "🐝"),
          el("span", { class: "titel", lang: "en" }, "Spelling Bee"),
          el("span", { class: "unter" }, T("Wort hören und richtig schreiben", "Hear the word and spell it"))),
        el("button", { class: "kachel shop-kachel", onclick: shop, "aria-label": "Shop" },
          el("span", { class: "sym", "aria-hidden": "true" }, "🛍️"),
          el("span", { class: "titel", lang: "en" }, "Shop"),
          el("span", { class: "unter" }, T(`🪙 ${spielstand().coins} Coins – Rahmen und mehr`, `🪙 ${spielstand().coins} coins – frames and more`)))));
  }
  // Memory: Unit und Abschnitt wählen (wie in Vocabulary), dann 6 Paare aus diesen Wörtern
  function memoryWahl(k) {
    lage = null; ansicht = () => memoryWahl(k);
    const unit = aktuelleUnit(), gruppen = D.units[unit];
    zeige(spielKopf(k, "Memory", () => zeigeSpiele(k)), unitReiter(() => memoryWahl(k)),
      gruppen.length ? ansage("Which words do you want to play with? Choose a part of the unit.", "Mit welchen Wörtern willst du spielen? Wähl einen Abschnitt.")
        : ansage("Coming soon!", "Diese Unit kommt bald."),
      el("nav", { class: "kacheln gruppen" }, gruppen.map((g, i) =>
        gruppenKachel(k, g, `u${unit}:${g.name}`, `${g.vokabeln.length} words`, () => spielMemory(k, unit, i)))));
  }
  function spielMemory(k, unit, i) {
    const g = D.units[unit][i];
    const ws = mischen(g.vokabeln.map(vokabel).filter(memOk)).slice(0, 6);
    ansicht = null; lage = null;
    const zurueck = () => memoryWahl(k);
    if (ws.length < 3) { zeige(spielKopf(k, "Memory", zurueck), el("section", { class: "satzkarte" }, el("p", {}, T("Diese Wörter sind zu lang für das Memory – wähl einen anderen Abschnitt.", "These words are too long for Memory – choose another part.")), knopf(T("Andere Wörter", "Other words"), zurueck, "haupt"))); return; }
    const m = memoryFeld(ws, true);
    zeige(spielKopf(k, "Memory", zurueck),
      ansage(`Unit ${unit} · ${g.name}: Find the pairs! English word and German meaning.`, "Finde die Paare! Englisches Wort und deutsche Bedeutung."),
      karte(null, m.feld, m.zaehler, m.box, el("div", { class: "knopfreihe" },
        knopf(T("↻ Neu mischen", "↻ Shuffle again"), () => spielMemory(k, unit, i)), knopf(T("Andere Wörter", "Other words"), zurueck),
        knopf(T("Zur Startseite", "Home"), startseite, "leise"))));
  }

  /* ---------- Games: Border Patrol – Wörter sinken, antippen = hören, nach links 🇬🇧 oder rechts 🇺🇸 wischen ----------
     Pro Runde jedes Paar einmal (zufällig britisch oder amerikanisch). 3 Leben: falsch einsortiert oder durchgefallen kostet eins.
     Punkte (+10) beim ersten geschafften Durchgang des Tages (mind. 13 von 17 richtig), Tagesmarke gym.patrolTag. */
  const PATROL = { leben: 3, tempo: 26, abstand: 2600, ziel: 13 };
  // Flaggen als SVG, weil Emoji-Flaggen auf Windows nur als Buchstaben erscheinen
  function flaggeSvg(seite, klasse) {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 60 36"); svg.setAttribute("class", "flagge " + (klasse || "")); svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", seite === "be" ? "British" : "American");
    const r = (x, y, w, h, f) => { const e = document.createElementNS(NS, "rect"); e.setAttribute("x", x); e.setAttribute("y", y); e.setAttribute("width", w); e.setAttribute("height", h); e.setAttribute("fill", f); svg.append(e); };
    const l = (p, f, w) => { const e = document.createElementNS(NS, "path"); e.setAttribute("d", p); e.setAttribute("stroke", f); e.setAttribute("stroke-width", w); svg.append(e); };
    if (seite === "be") {
      r(0, 0, 60, 36, "#012169");
      l("M0 0L60 36M60 0L0 36", "#fff", 7); l("M0 0L60 36M60 0L0 36", "#C8102E", 2.5);
      l("M30 0V36M0 18H60", "#fff", 11); l("M30 0V36M0 18H60", "#C8102E", 6);
    } else {
      r(0, 0, 60, 36, "#fff");
      for (let i = 0; i < 13; i += 2) r(0, i * 36 / 13, 60, 36 / 13, "#B22234");
      r(0, 0, 24, 36 * 7 / 13, "#3C3B6E");
      for (let y = 0; y < 5; y++) for (let x = 0; x < 6; x++) { const c = document.createElementNS(NS, "circle"); c.setAttribute("cx", 2.2 + x * 4); c.setAttribute("cy", 2 + y * 3.9); c.setAttribute("r", 0.9); c.setAttribute("fill", "#fff"); svg.append(c); }
    }
    return svg;
  }
  function spielPatrol(k) {
    ansicht = null; lage = null; stopp();
    const g = gymStand();
    const reihe = mischen(SP.patrol).map((p) => ({ p, seite: Math.random() < 0.5 ? "be" : "ae" }));
    let leben = PATROL.leben, richtig = 0, naechster = 0, aktiv = null, laeuft = true, letzter = 0, offen = [], zeitstempel = null;
    const zurueck = () => { laeuft = false; stopp(); zeigeSpiele(k); };
    const himmel = el("div", { class: "patrol-himmel", role: "group", "aria-label": "Border Patrol" },
      flaggeSvg("be", "patrol-rand links"), flaggeSvg("ae", "patrol-rand rechts"));
    const stand = el("p", { class: "patrol-stand", "aria-live": "polite" });
    const box = rueckmeldung();
    const zeigeStand = () => { stand.replaceChildren(el("span", {}, "❤️".repeat(leben) + "🖤".repeat(PATROL.leben - leben)), el("span", {}, `✓ ${richtig} / ${reihe.length}`)); };
    // Antippen spielt den ganzen Satz (vorhandene Aufnahmen: britisch Mr. Alex, amerikanisch Jeremy/Jessica); solange er läuft, bleibt alles stehen
    const tonFuer = (w) => { const satz = D.saetze[w.p.id]; return w.seite === "be" ? (satz.be.audio || { text: satz.be.en, stimme: "m" }) : tonSatz(satz); };
    let pause = false;
    const wort = (w) => (w.seite === "be" ? w.p.be : w.p.ae);
    const flagge = (seite) => flaggeSvg(seite);
    const zonen = [["be", "British"], ["ae", "American"]].map(([seite, name]) =>
      el("button", { class: "patrol-zone " + seite, onclick: () => { if (aktiv) sortiere(aktiv, seite); } }, flaggeSvg(seite, "patrol-flagge"), el("span", { lang: "en" }, name)));
    function entferne(w) { offen = offen.filter((x) => x !== w); if (aktiv === w) aktiv = null; setTimeout(() => w.el.remove(), 700); }
    function sortiere(w, seite) {
      if (!laeuft || w.fertig) return;
      w.fertig = true;
      if (seite === w.seite) {
        richtig++; w.el.classList.add("weg-" + seite); richtigSerie++;
      } else {
        leben--; w.el.classList.add("falsch"); w.el.append(flagge(w.seite));
      }
      zeigeStand(); entferne(w); pruefeEnde();
    }
    function durchgefallen(w) {
      if (w.fertig) return;
      w.fertig = true; leben--;
      w.el.classList.add("falsch"); w.el.append(flagge(w.seite));
      zeigeStand(); entferne(w); pruefeEnde();
    }
    function waehle(w) {
      if (!laeuft || w.fertig) return;
      if (aktiv && aktiv !== w) aktiv.el.classList.remove("aktiv");
      aktiv = w; w.el.classList.add("aktiv");
      pause = true; spiele([tonFuer(w)]).then(() => { pause = false; });
    }
    function neues() {
      if (naechster >= reihe.length) return;
      const w = reihe[naechster++]; w.y = -40; w.x = 8 + Math.random() * 64;
      const text = wort(w);
      // Deutsche Bedeutung klein darunter, damit klar ist, welches Wort gemeint ist (z. B. subway · U-Bahn)
      w.el = el("button", { class: "patrol-wort", style: `left:${w.x}%; top:${w.y}px`, "aria-label": T(`Wort: ${text} (${w.p.de}). Links britisch, rechts amerikanisch.`, `Word: ${text} (${w.p.de}). Left British, right American.`) },
        el("span", { lang: "en" }, text), el("small", { lang: "de" }, w.p.de));
      let startX = null;
      w.el.addEventListener("pointerdown", (e) => { startX = e.clientX; w.el.setPointerCapture(e.pointerId); });
      w.el.addEventListener("pointerup", (e) => {
        const dx = startX === null ? 0 : e.clientX - startX; startX = null;
        if (Math.abs(dx) > 40) { waehleLeise(w); sortiere(w, dx < 0 ? "be" : "ae"); } else waehle(w);
      });
      w.el.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") { e.preventDefault(); sortiere(w, "be"); } if (e.key === "ArrowRight") { e.preventDefault(); sortiere(w, "ae"); } });
      himmel.append(w.el); offen.push(w);
    }
    const waehleLeise = (w) => { if (aktiv && aktiv !== w) aktiv.el.classList.remove("aktiv"); aktiv = w; };
    function schritt(t) {
      if (!laeuft) return;
      if (zeitstempel === null) zeitstempel = t;
      const dt = Math.min(0.05, (t - zeitstempel) / 1000); zeitstempel = t;
      if (pause) letzter = t - Math.min(t - letzter, PATROL.abstand - 400);
      else if (t - letzter > PATROL.abstand && offen.filter((w) => !w.fertig).length < 3) { neues(); letzter = t; }
      const tempo = PATROL.tempo * (1 + richtig * 0.05) * (window.__patrolTempo || 1);
      const boden = himmel.clientHeight;
      offen.forEach((w) => {
        if (w.fertig || w === aktiv || pause) return;
        w.y += tempo * dt; w.el.style.top = w.y + "px";
        if (w.y > boden - 10) durchgefallen(w);
      });
      requestAnimationFrame(schritt);
    }
    function pruefeEnde() {
      if (!laeuft) return;
      const alleRaus = naechster >= reihe.length && offen.every((w) => w.fertig);
      if (leben > 0 && !alleRaus) return;
      laeuft = false;
      const geschafft = leben > 0 && richtig >= PATROL.ziel;
      const tag = iso(heute()), punkte = geschafft && g.patrolTag !== tag;
      if (punkte) { g.patrolTag = tag; punkteDazu(PUNKTE.spiel); } else speichern();
      const text = geschafft ? `${lob(true)} ${T(`${richtig} von ${reihe.length} Wörtern richtig einsortiert!`, `${richtig} of ${reihe.length} words sorted correctly!`)}${punkte ? ` +${PUNKTE.spiel} ⭐` : (g.patrolTag === tag ? T(" (Punkte gibt es einmal pro Tag.)", " (Points once a day.)") : "")}`
        : leben <= 0 ? T(`Die Grenze ist dicht! ${richtig} richtig. Du schaffst es – versuch es noch mal.`, `The border is closed! ${richtig} correct. You can do it – try again.`)
        : T(`${richtig} von ${reihe.length} richtig. Für Punkte brauchst du ${PATROL.ziel}. Noch mal?`, `${richtig} of ${reihe.length} correct. You need ${PATROL.ziel} for points. Again?`);
      melde(box, geschafft ? "gut" : "neutral", text);
      liste.hidden = false;
    }
    const liste = el("details", { class: "patrol-liste", hidden: true }, el("summary", {}, T("Alle Paare ansehen", "Show all pairs")),
      el("table", {}, el("tbody", {}, SP.patrol.map((p) => el("tr", {}, el("td", { lang: "en" }, "🇬🇧 " + p.be), el("td", { lang: "en" }, "🇺🇸 " + p.ae), !E() && el("td", { lang: "de" }, p.de))))));
    zeigeStand();
    zeige(spielKopf(k, "Border Patrol", zurueck),
      ansage("Words are coming to the border! Tap a word to hear it, then swipe it left (British) or right (American). Don't let them fall through!",
        "Wörter kommen an die Grenze! Tipp ein Wort an, um es zu hören, dann wisch es nach links (britisch) oder rechts (amerikanisch). Lass keins durchfallen!"),
      el("section", { class: "satzkarte patrol" }, stand, himmel, el("div", { class: "patrol-zonen" }, ...zonen), box, liste,
        el("div", { class: "knopfreihe" }, knopf(T("↻ Noch mal", "↻ Play again"), () => spielPatrol(k)), knopf(T("Andere Spiele", "Other games"), zurueck), knopf(T("Zur Startseite", "Home"), startseite, "leise"))));
    requestAnimationFrame(schritt);
  }

  /* ---------- Games: Catch the Word – ein Wort wird gesprochen, 4–6 Wörter des Abschnitts fallen, das richtige antippen ----------
     10 Runden, 3 Leben: falsches Wort angetippt oder das richtige durchgefallen kostet eins. Treffer = kurzer Klang, dann die deutsche Bedeutung.
     Punkte (+10) beim ersten Durchgang des Tages mit mindestens 7 Treffern (Tagesmarke gym.catchTag). */
  const CATCH = { leben: 3, runden: 10, tempo: 22, ziel: 7 };
  const spielWort = (v) => v.en.replace(/\s*\((AE|BE|infml|pl)\)/g, "").replace(/\s+/g, " ").trim();
  const catchOk = (v) => v && v.en && spielWort(v).length <= 24;
  // Treffer-Klang: zwei kurze helle Töne, im Browser erzeugt (keine Stimme)
  function trefferKlang() {
    try {
      if (!klangCtx) klangCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (klangCtx.state === "suspended") klangCtx.resume();
    } catch { return; }
    const c = klangCtx, t = c.currentTime;
    [[880, 0], [1320, 0.09]].forEach(([f, ab]) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = "triangle"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + ab); g.gain.exponentialRampToValueAtTime(0.35 * KLANG_LAUT, t + ab + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + ab + 0.22);
      o.connect(g).connect(c.destination); o.start(t + ab); o.stop(t + ab + 0.25);
    });
  }
  // Unit und Abschnitt wählen (wie beim Memory) – für Catch the Word und Spelling Bee
  function spielWahl(k, titel, spiel, zeichne) {
    lage = null; ansicht = zeichne;
    const unit = aktuelleUnit(), gruppen = D.units[unit];
    zeige(spielKopf(k, titel, () => zeigeSpiele(k)), unitReiter(zeichne),
      gruppen.length ? ansage("Which words do you want to play with? Choose a part of the unit.", "Mit welchen Wörtern willst du spielen? Wähl einen Abschnitt.")
        : ansage("Coming soon!", "Diese Unit kommt bald."),
      el("nav", { class: "kacheln gruppen" }, gruppen.map((g, i) =>
        gruppenKachel(k, g, `u${unit}:${g.name}`, `${g.vokabeln.length} words`, () => spiel(k, unit, i)))));
  }
  const zuWenig = (k, titel, zurueck) => zeige(spielKopf(k, titel, zurueck), el("section", { class: "satzkarte" },
    el("p", {}, T("Für dieses Spiel passen zu wenige Wörter aus dem Abschnitt – wähl einen anderen.", "Too few words of this part fit this game – choose another one.")),
    knopf(T("Andere Wörter", "Other words"), zurueck, "haupt")));
  const catchWahl = (k) => spielWahl(k, "Catch the Word", spielCatch, () => catchWahl(k));
  function spielCatch(k, unit, i) {
    ansicht = null; lage = null; stopp();
    const g = gymStand(), gruppe = D.units[unit][i];
    const ws = gruppe.vokabeln.map(vokabel).filter(catchOk);
    const zurueck = () => { laeuft = false; stopp(); catchWahl(k); };
    if (ws.length < 4) return zuWenig(k, "Catch the Word", zurueck);
    let ziele = [];
    while (ziele.length < CATCH.runden) ziele.push(...mischen(ws));
    ziele = ziele.slice(0, CATCH.runden);
    let leben = CATCH.leben, treffer = 0, runde = 0, ziel = null, offen = [], laeuft = true, pause = false, zeitstempel = null;
    const himmel = el("div", { class: "patrol-himmel catch-himmel", role: "group", "aria-label": "Catch the Word" });
    const stand = el("p", { class: "patrol-stand", "aria-live": "polite" });
    const info = el("p", { class: "catch-info", role: "status", hidden: true });
    const box = rueckmeldung();
    const zeigeStand = () => stand.replaceChildren(el("span", {}, "❤️".repeat(leben) + "🖤".repeat(Math.max(0, CATCH.leben - leben))),
      el("span", {}, `${T("Runde", "Round")} ${Math.min(runde, CATCH.runden)} / ${CATCH.runden} · ✓ ${treffer}`));
    const hoeren = () => { if (ziel && laeuft) spiele([tonWort(ziel)]); };
    const hoerKnopf = knopf(T("🔊 Nochmal", "🔊 Again"), hoeren);
    function raeume() { offen.forEach((w) => { w.fertig = true; w.el.classList.add("weg"); setTimeout(() => w.el.remove(), 700); }); offen = []; }
    function naechsteRunde() {
      if (!laeuft) return;
      if (runde >= CATCH.runden) return ende();
      ziel = ziele[runde++]; info.hidden = true; pause = false;
      const andere = mischen(ws.filter((v) => v !== ziel)).slice(0, 3 + Math.floor(Math.random() * 3));
      const reihe = mischen([ziel, ...andere]);
      reihe.forEach((v, j) => {
        const text = spielWort(v);
        // Spalten gleichmäßig über die Breite, Höhe versetzt (3 Reihen), damit auch lange Wörter sich nicht überdecken
        const w = { v, y: -40 - (j % 3) * 64 - Math.random() * 16, x: Math.min(92, Math.max(8, (j + 0.5) / reihe.length * 100 + (Math.random() - 0.5) * 10)) };
        w.el = el("button", { class: "patrol-wort catch-wort", lang: "en", style: `left:${w.x}%; top:${w.y}px`, onclick: () => fange(w) }, text);
        himmel.append(w.el); offen.push(w);
        // Lange Wörter ganz ins Bild rücken (links/rechts nicht abschneiden)
        const breite = himmel.clientWidth, halb = w.el.offsetWidth / 2 + 4;
        if (breite && halb * 2 < breite) w.el.style.left = Math.min(breite - halb, Math.max(halb, w.x / 100 * breite)) + "px";
      });
      zeigeStand(); hoeren();
    }
    function fange(w) {
      if (!laeuft || pause || w.fertig) return;
      if (w.v === ziel) {
        treffer++; w.fertig = true; pause = true; richtigSerie++;
        w.el.classList.add("treffer"); trefferKlang();
        info.hidden = false; info.replaceChildren(el("strong", { lang: "en" }, spielWort(ziel)), " = ", el("span", { lang: "de" }, memKurz(ziel.de) || ziel.de));
        zeigeStand();
        setTimeout(() => { raeume(); naechsteRunde(); }, 1400);
      } else {
        leben--; w.fertig = true; w.el.classList.add("falsch"); w.el.disabled = true;
        zeigeStand();
        if (leben <= 0) ende();
      }
    }
    function durchgefallen(w) {
      if (w.fertig) return;
      w.fertig = true;
      if (w.v !== ziel) { w.el.classList.add("weg"); setTimeout(() => w.el.remove(), 700); return; }
      leben--; pause = true; w.el.classList.add("falsch");
      info.hidden = false; info.replaceChildren(T("Das war: ", "That was: "), el("strong", { lang: "en" }, spielWort(ziel)), " = ", el("span", { lang: "de" }, memKurz(ziel.de) || ziel.de));
      zeigeStand();
      if (leben <= 0) return ende();
      setTimeout(() => { raeume(); naechsteRunde(); }, 1600);
    }
    function schritt(t) {
      if (!laeuft) return;
      if (zeitstempel === null) zeitstempel = t;
      const dt = Math.min(0.05, (t - zeitstempel) / 1000); zeitstempel = t;
      const tempo = CATCH.tempo * (1 + treffer * 0.06) * (window.__catchTempo || 1);
      const boden = himmel.clientHeight;
      if (!pause) offen.forEach((w) => {
        if (w.fertig) return;
        w.y += tempo * dt; w.el.style.top = w.y + "px";
        if (w.y > boden - 10) durchgefallen(w);
      });
      requestAnimationFrame(schritt);
    }
    function ende() {
      if (!laeuft) return;
      laeuft = false; pause = true; hoerKnopf.disabled = true;
      offen.forEach((w) => { if (!w.fertig) { w.fertig = true; w.el.classList.add("weg"); } });
      const geschafft = leben > 0 && treffer >= CATCH.ziel;
      const tag = iso(heute()), punkte = geschafft && g.catchTag !== tag;
      if (punkte) { g.catchTag = tag; punkteDazu(PUNKTE.spiel); } else speichern();
      const text = geschafft ? `${lob(true)} ${T(`${treffer} von ${CATCH.runden} Wörtern gefangen!`, `${treffer} of ${CATCH.runden} words caught!`)}${punkte ? ` +${PUNKTE.spiel} ⭐` : (g.catchTag === tag ? T(" (Punkte gibt es einmal pro Tag.)", " (Points once a day.)") : "")}`
        : leben <= 0 ? T(`Alle Leben weg! ${treffer} gefangen. Hör genau hin und versuch es noch mal.`, `No lives left! ${treffer} caught. Listen closely and try again.`)
        : T(`${treffer} von ${CATCH.runden} gefangen. Für Punkte brauchst du ${CATCH.ziel}. Noch mal?`, `${treffer} of ${CATCH.runden} caught. You need ${CATCH.ziel} for points. Again?`);
      melde(box, geschafft ? "gut" : "neutral", text);
    }
    zeigeStand();
    zeige(spielKopf(k, "Catch the Word", zurueck),
      ansage("Listen! Which word did you hear? Tap it before it lands.", "Hör zu! Welches Wort hast du gehört? Tipp es an, bevor es unten ist."),
      el("section", { class: "satzkarte patrol catch" }, stand, info, himmel, el("div", { class: "knopfreihe" }, hoerKnopf), box,
        el("div", { class: "knopfreihe" }, knopf(T("↻ Noch mal", "↻ Play again"), () => spielCatch(k, unit, i)), knopf(T("Andere Wörter", "Other words"), zurueck), knopf(T("Zur Startseite", "Home"), startseite, "leise"))));
    naechsteRunde();
    requestAnimationFrame(schritt);
  }

  /* ---------- Games: Spelling Bee – Wort hören, deutsche Bedeutung lesen, englisch eintippen (1-Fehler-Toleranz wie Klasse 6) ----------
     8 Wörter des Abschnitts, nur eindeutig tippbare (keine Klammern, kein sth./sb., keine Formenreihe). 3 richtig in Folge = 🍯 Honey!
     Punkte (+10) beim ersten Durchgang des Tages mit mindestens 6 richtigen (Tagesmarke gym.beeTag). */
  const BEE = { anzahl: 8, honig: 3 };
  const beeOk = (v) => { if (!v || !v.en) return false; const t = spielWort(v); return t.length >= 2 && t.length <= 20 && t.split(" ").length <= 3 && !/[()…,/]|\bsth\.|\bsb\./.test(t); };
  const beeWahl = (k) => spielWahl(k, "Spelling Bee", spielBee, () => beeWahl(k));
  function spielBee(k, unit, i) {
    ansicht = null; lage = null;
    const g = gymStand(), gruppe = D.units[unit][i];
    const ws = mischen(gruppe.vokabeln.map(vokabel).filter(beeOk)).slice(0, BEE.anzahl);
    const zurueck = () => beeWahl(k);
    if (ws.length < 4) return zuWenig(k, "Spelling Bee", zurueck);
    const ziel = Math.ceil(ws.length * 0.75);
    let pos = 0, richtig = 0, serie = 0;
    const stand = el("p", { class: "patrol-stand", "aria-live": "polite" });
    const frage = el("div", { class: "bee-frage" });
    const box = rueckmeldung();
    const bereich = el("div", { class: "bee-eingabe" });
    const weiter = el("button", { class: "knopf haupt weiter", hidden: true, onclick: () => { pos++; zeigeWort(); } }, T("Weiter ➜", "Next ➜"));
    const hoerKnopf = knopf(T("🔊 Nochmal", "🔊 Again"), () => { if (pos < ws.length) spiele([tonWort(ws[pos])]); });
    const zeigeStand = () => stand.replaceChildren(el("span", {}, `${T("Wort", "Word")} ${Math.min(pos + 1, ws.length)} / ${ws.length}`), el("span", {}, `✓ ${richtig}` + (serie >= 2 ? ` · 🐝 ${serie}` : "")));
    function honig() {
      const h = el("div", { class: "honig", role: "status", "aria-live": "polite" }, "🍯 Honey!");
      karteEl.append(h);
      setTimeout(() => h.classList.add("weg"), 1500);
      setTimeout(() => h.remove(), 2000);
    }
    function zeigeWort() {
      box.hidden = true; weiter.hidden = true;
      if (pos >= ws.length) return ende();
      const v = ws[pos], wort = spielWort(v);
      frage.replaceChildren(el("p", { class: "vok-de", lang: "de" }, v.de));
      const feld = tippFeld((text, ui) => {
        ui.feld.disabled = true; ui.knopf.hidden = true;
        const stufe = pruefeTipp(text, [wort]);
        box.hidden = false;
        if (stufe === 2) { serie = 0; box.className = "rueckmeldung hilfe"; box.textContent = T(`Nicht ganz. So schreibt man es: ${wort}`, `Not quite. This is how you spell it: ${wort}`); }
        else {
          richtig++; serie++;
          box.className = "rueckmeldung gut"; box.textContent = lob() + (stufe === 1 ? T(` So schreibt man es genau: ${wort}`, ` The exact spelling: ${wort}`) : "");
          if (serie % BEE.honig === 0) honig();
        }
        zeigeStand(); weiter.hidden = false; weiter.focus();
      });
      bereich.replaceChildren(feld); zeigeStand();
      spiele([tonWort(v)]);
      feld.querySelector("input").focus({ preventScroll: true });
    }
    function ende() {
      hoerKnopf.disabled = true; bereich.replaceChildren(); frage.replaceChildren();
      const geschafft = richtig >= ziel;
      const tag = iso(heute()), punkte = geschafft && g.beeTag !== tag;
      if (punkte) { g.beeTag = tag; punkteDazu(PUNKTE.spiel); } else speichern();
      const text = geschafft ? `${lob(true)} ${T(`${richtig} von ${ws.length} Wörtern richtig geschrieben!`, `${richtig} of ${ws.length} words spelled correctly!`)}${punkte ? ` +${PUNKTE.spiel} ⭐` : (g.beeTag === tag ? T(" (Punkte gibt es einmal pro Tag.)", " (Points once a day.)") : "")}`
        : T(`${richtig} von ${ws.length} richtig. Für Punkte brauchst du ${ziel}. Noch mal?`, `${richtig} of ${ws.length} correct. You need ${ziel} for points. Again?`);
      melde(box, geschafft ? "gut" : "neutral", text);
    }
    const karteEl = el("section", { class: "satzkarte bee" }, stand, frage, el("div", { class: "knopfreihe" }, hoerKnopf), bereich, box,
      el("div", { class: "knopfreihe" }, weiter),
      el("div", { class: "knopfreihe" }, knopf(T("↻ Noch mal", "↻ Play again"), () => spielBee(k, unit, i)), knopf(T("Andere Wörter", "Other words"), zurueck), knopf(T("Zur Startseite", "Home"), startseite, "leise")));
    zeige(spielKopf(k, "Spelling Bee", zurueck),
      ansage("Listen and spell the word. One small mistake is okay – you'll see the exact spelling.", "Hör zu und schreib das Wort. Ein kleiner Fehler ist okay – du siehst dann die genaue Schreibweise."),
      karteEl);
    zeigeWort();
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
        el("h2", { lang: "en" }, alles ? T("Das war's für heute!", "That's it for today!") : T("Pause!", "Break!")),
        r && el("p", { class: "gym-lob" }, el("strong", { lang: "en" }, r.text), !E() && r.de && el("span", { lang: "de" }, " – " + r.de)),
        el("p", {}, alles ? T("Alle Wörter von heute sind geübt. Morgen gibt es neue und die fälligen von heute kommen wieder.",
          "All of today's words are done. Tomorrow brings new ones, and today's come back when they are due.")
          : T("Erledigtes bleibt gespeichert. Komm später wieder und mach den Rest fertig.", "What you did is saved. Come back later and finish the rest.")),
        el("div", { class: "knopfreihe" }, knopf(T("Zur Startseite", "Home"), startseite, "haupt"),
          alles && knopf(T("🎲 Memory spielen", "🎲 Play Memory"), gymMemory), knopf(T("🏆 Meine Sammlung", "🏆 My collection"), sammlung))));
      if (icon.heben) setTimeout(icon.heben, 400);
    };
    ansicht = zeichne; gym = null; lage = null;
    zeichne();
    // erst belohnen (reiht Pop-ups ein), dann sprechen: das Pop-up wartet auf die Schlussstimme, statt sie abzuschneiden
    if (erstesMal) belohne(true, true, true);
    spiele([!ereignisse.some(grossEreignis) && r && r.audio, fini && fini.audio]);
  }

  /* ---------- Fragen für Mr. Alex ---------- */
  const dlg = document.getElementById("fragen");
  const feld = document.getElementById("frage-text");
  const liste = document.getElementById("fragen-liste");
  function dialogTexte() {
    document.getElementById("fragen-titel").textContent = T("✏️ Frage für meinen Lehrer", "✏️ Question for my teacher");
    document.getElementById("fragen-info").textContent = T("Schreib deine Frage auf. Sie bleibt nur auf diesem Gerät. Zeig sie mir in der nächsten Stunde!",
      "Write down your question. It stays on this device only. Show it to me in the next lesson!");
    feld.placeholder = T("Was ist dir unklar?", "What is not clear?");
    document.getElementById("frage-speichern").textContent = T("Frage speichern", "Save question");
  }
  function fragenZeigen() {
    liste.replaceChildren(...stand.fragen.map((f, i) => el("li", {},
      el("div", {}, el("span", {}, f),
        el("button", { class: "knopf leise", "aria-label": T("Frage löschen", "Delete question"), onclick: () => {
          stand.fragen.splice(i, 1); speichern(); fragenZeigen(); } }, "🗑️")))));
  }
  function fragenOeffnen() { fragenZeigen(); dlg.showModal(); feld.focus(); }
  document.getElementById("frage-speichern").addEventListener("click", () => {
    const t = feld.value.trim();
    if (!t) return feld.focus();
    stand.fragen.push(t); speichern(); feld.value = ""; fragenZeigen();
  });

  /* ---------- Tasten: Leertaste = Abspielen, Pfeile = Weiter / Zurück ---------- */
  document.addEventListener("keydown", (e) => {
    if (dlg.open || feier.open || e.target.closest("textarea, input")) return;
    if (e.code === "Space" && lage && lage.abspielen) { e.preventDefault(); lage.abspielen(); }
    else if (e.code === "ArrowRight" && lage && lage.weiter) { e.preventDefault(); lage.weiter(); }
    else if (e.code === "ArrowLeft" && lage && !lage.ende) {
      const z = app.querySelector(".zurueck-knopf");
      if (z && !z.disabled) { e.preventDefault(); z.click(); }
    }
  });

  setzeNiveau(stand.niveau === "E" ? "E" : "G");
  tempoKnopf();
  startseite();

  // Offline-Speicher (nur über eine Webadresse)
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
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
