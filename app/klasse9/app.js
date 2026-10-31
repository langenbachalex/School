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
  // Test-Haken (window.__heute, __catchTempo, __patrolTempo, __updateTest) wirken nur beim Testen auf dem eigenen Rechner,
  // nie auf der Live-Seite (30.10.2026: sonst ließen sich z. B. über ein anderes Datum Tagesboni beliebig oft abholen).
  const LOKAL = location.protocol === "file:" || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);

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
  // spiele(…, { laut: 0.6 }) spielt Dateien leiser (Runner-Echo); die Geräte-Stimme kennt keine Lautstärke und bleibt normal.
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
      if (typeof opt.laut === "number") a.volume = Math.max(0, Math.min(1, opt.laut));
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
  function zeige(...inhalt) { dialogLauf++; stopp(); runnerAus(); app.replaceChildren(...inhalt.filter(Boolean)); if (!leise) window.scrollTo(0, 0); hwLeiste(); }
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
  /* ---------- Arbeitssperre (30.10.2026, Mr. Alex) – wie die Lesezeit-Sperre in Klasse 6 (zeigeLesen) ----------
     Knopf k („Lösung“ / „Weiter“) bleibt im Programm gesperrt (GESPERRT), bis 1. die Mindestzeit sek ab start um ist
     und 2. offen() nichts mehr meldet (Text = Hinweis, true = gesperrt ohne Hinweis, ""/0/null = alles bearbeitet).
     uhr zeigt den Countdown (zeitText(„0:30“)) bzw. was noch fehlt. bereit() prüft neu und gibt true zurück, wenn frei. */
  const LESE_WPM = 80; // Lesezeit: Wörter pro Minute
  function arbeitsSperre(k, { sek = 0, start = Date.now(), zeitText, offen, offenZuerst }) {
    const gebaut = Date.now();
    const uhr = el("p", { class: "klein lese-uhr", role: "status" });
    const rest = () => Math.max(0, Math.ceil(sek - (Date.now() - start) / 1000));
    let aus = false;
    function bereit() {
      if (aus) return false;
      const r = rest(), n = offen ? offen() : "";
      const nText = typeof n === "string" ? n : "";
      uhr.textContent = offenZuerst && nText ? nText : r > 0 ? zeitText(`${Math.floor(r / 60)}:${String(r % 60).padStart(2, "0")}`) : nText;
      const ok = r === 0 && !n;
      if (ok) entsperrt(k); else sperrt(k);
      return ok;
    }
    const takt = setInterval(() => { if (!uhr.isConnected && Date.now() - gebaut > 2000) return clearInterval(takt); bereit(); }, 500);
    bereit();
    return { uhr, bereit, ende: () => { aus = true; clearInterval(takt); uhr.textContent = ""; } };
  }
  const woerterIn = (texte) => texte.join(" ").split(/\s+/).filter(Boolean).length;
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
    // Punkte-Regeln gegen schnelles Abholen (30.10., Mr. Alex):
    // · Erklärteile (nur lesen, dann „Weiter“) geben nie Punkte – sie zählen aber als erledigt.
    // · Wiederholung eines schon erledigten Teils: +5 nur bei Teilen mit Mindestzeit (Sprechen, Quiz – SPRECH_MIN);
    //   alles, was sich schnell noch einmal durchklicken lässt (Lesen, Reihenfolge, Hören, Dialog, Schreiben …), gibt beim Wiederholen keine Punkte.
    //   Power Up (fälliger Teil wird aufgeladen) gibt weiter Punkte – das geht je Teil nur alle 30/60/120 Tage.
    // · Wiederholungen mit Mindestzeit (30.10.): jede weitere Wiederholung halbiert – 5, 2, 1, dann 0; ein Power Up setzt den Zähler (stand.teile[k].w) zurück.
    let wdh = null;
    if (!erstesMal && !aufladen && SPRECH_MIN[teil.art]) {
      const e = stand.teile && stand.teile[teilSchluessel(lage.teil)], w = (e && e.w) || 0;
      wdh = Math.floor(PUNKTE.wiederholung / 2 ** w);
      if (e) e.w = w + 1;
    }
    const ohnePunkte = teil.art === "erklaerung" || (!erstesMal && !aufladen && !SPRECH_MIN[teil.art]) || wdh === 0;
    if (!ohnePunkte) belohne(erstesMal, !lage.hilfe, false, wdh);
    else { hwBonus(0); speichern(); setTimeout(zeigeEreignisse, 50); } // ohne Punkte zählt der Teil trotzdem für die Hausaufgabe (inkl. Feier „Homework done!“)
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
          if (sperre_) sperre_.bereit();
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
        "aria-label": frage(f), placeholder: frage(f), oninput: (e) => { antworten[i][f.key] = e.target.value; if (sperre_) sperre_.bereit(); } });
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
    // Sperre (30.10.2026, Mr. Alex): „Lösung zeigen“ erst nach zwei ganzen Hör-Durchgängen UND wenn jede Frage zu jeder Person
    // eine Antwort hat (G: angetippt, E: mindestens 2 Buchstaben) – im Programm (GESPERRT + Prüfung in loesen).
    let sperre_ = null;
    const fehlt = (w) => (E() ? String(w || "").replace(/[^A-Za-z]/g, "").length < 2 : !w);
    const offenZahl = () => antworten.reduce((n, a) => n + fragen.filter((f) => fehlt(a[f.key])).length, 0);
    sperre_ = arbeitsSperre(loesungKnopf, { offen: () => {
      if (durchgaenge < 2) return true; // Hinweis steht schon darunter („… zweimal ganz gehört …“)
      const n = offenZahl();
      return !n ? "" : E() ? T(`✏️ Füll jedes Feld aus (noch ${n}).`, `✏️ Fill in every box (${n} to go).`)
        : T(`✏️ Tipp bei jeder Frage eine Antwort an (noch ${n}).`, `✏️ Choose an answer for every question (${n} to go).`);
    } });
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
        if (!geloest) sperre_.bereit();
      });
    }

    async function loesen() {
      if (geloest || !sperre_.bereit()) return;
      sperre_.ende();
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
      if (richtig < u.aufgaben.length) lage.hilfe = true; // +5 „ohne Hilfe“ nur, wenn alles richtig ist (30.10.)
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
      el("section", { class: "satzkarte" }, gln, sperre_.uhr, el("div", { class: "knopfreihe" }, loesungKnopf), ergebnis, warten),
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
      if (ganz) { ganzDurch = true; sperre_.bereit(); }
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
    // Sperre (30.10.2026, Mr. Alex): „Weiter“ erst, wenn der ganze Dialog einmal ohne Stopp durchgelaufen ist (hören bzw. mitsprechen)
    // und mindestens 2 s je Zeile (wie Listen & Repeat) ab Start des Teils vergangen sind – im Programm (GESPERRT), nicht nur am Knopf.
    // Schon einmal ganz geschafft (lage.frei, z. B. nach G/E-Umschalten oder „Zurück“): bleibt frei.
    if (!lage.frei) lage.frei = new Set();
    const freiMenge = lage.frei, schluessel = freiSchluessel();
    let ganzDurch = freiMenge.has(schluessel);
    const weiter = weiterKnopf(() => { if (sperre_.bereit()) naechstes(); });
    const sperre_ = arbeitsSperre(weiter, { start: lage.start, sek: ganzDurch ? 0 : zeilen.length * SPRECH_MIN.lr * eile(), offenZuerst: true,
      zeitText: (z) => T(`⏱️ „Weiter“ geht in ${z}.`, `⏱️ “Next” opens in ${z}.`),
      offen: () => {
        if (!ganzDurch) return meine ? T("🗣️ Sprich den ganzen Dialog einmal mit. Dann geht „Weiter“.", "🗣️ Do the whole dialogue once. Then “Next” opens.")
          : T("🎧 Hör dir den ganzen Dialog einmal an. Dann geht „Weiter“.", "🎧 Listen to the whole dialogue once. Then “Next” opens.");
        freiMenge.add(schluessel);
        return "";
      } });
    lage.abspielen = () => { if (!startKnopf.hidden) starten(); };
    lage.weiter = () => { if (sperre_.bereit()) naechstes(); };
    zeige(kopf(k),
      meine ? ansage(`You are ${meine}. Say your lines when it's your turn. The app speaks the other role.`,
        `Du bist ${meine}. Sprich deine Zeilen, wenn du dran bist. Die App spricht die andere Rolle.`)
        : ansage("Listen to the dialogue. A and B.", "Hör dir den Dialog an: A und B."),
      karte(null, liste, balken,
        meine && versteckt && el("div", { class: "knopfreihe" }, tipp("Easier: show my lines", (e) => { e.currentTarget.hidden = true; zeigeMeine(); })),
        el("div", { class: "knopfreihe" }, startKnopf, stoppKnopf), box, sperre_.uhr,
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
    // Lesezeit-Sperre (30.10.2026, Mr. Alex): „Weiter“ erst nach realistischer Lesezeit (80 Wörter pro Minute, ab Start des Teils).
    const weiter = weiterKnopf(() => { if (sperre_.bereit()) naechstes(); });
    const sperre_ = arbeitsSperre(weiter, { start: lage.start, sek: woerterIn(alle.map((id) => D.saetze[id].en)) / LESE_WPM * 60 * eile(),
      zeitText: (z) => T(`📖 Lies den Mustertext genau. „Weiter“ geht in ${z}.`, `📖 Read the model text carefully. “Next” opens in ${z}.`) });
    lage.abspielen = () => vorlesen(alle); lage.weiter = () => { if (sperre_.bereit()) naechstes(); };
    zeige(kopf(k),
      ansage("Read and listen. Look at the structure and the useful phrases (blue).",
        "Lies und hör zu. Achte auf den Aufbau und die blauen Redemittel – die kannst du in deinem Text benutzen."),
      el("section", { class: "satzkarte" },
        el("h2", { lang: "en" }, teil.titel),
        faktenblatt(teil.fakten),
        el("div", { class: "mustertext" }, absaetze),
        sperre_.uhr,
        el("div", { class: "knopfreihe" }, knopf(T("🔊 Ganzen Text vorlesen", "🔊 Read the whole text"), () => vorlesen(alle)), weiter)));
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
      if (sperre_) sperre_.bereit();
    }
    // Schreibzeit-Sperre (30.10.2026, Mr. Alex): „Weiter“ erst nach einer Mindest-Schreibzeit (20 s je geforderten Satz, ab Start des Teils)
    // und wenn der Text fertig bearbeitet ist: mindestens min Sätze und 6 Wörter je Satz, alle Inhaltspunkte drin, keine offenen „…“ aus den Redemitteln.
    // Punkte bleiben wie bisher (kein richtig/falsch); die Sperre sitzt im Programm (GESPERRT + Prüfung beim Weiter).
    const SCHREIB_JE_SATZ = 20, WOERTER_JE_SATZ = 6;
    let sperre_ = null;
    const weiter = weiterKnopf(() => { if (sperre_.bereit()) naechstes(); });
    sperre_ = arbeitsSperre(weiter, { start: lage.start, sek: min * SCHREIB_JE_SATZ * eile(),
      zeitText: (z) => T(`📝 Nimm dir Zeit für deinen Text. „Weiter“ geht in ${z}.`, `📝 Take your time with your text. “Next” opens in ${z}.`),
      offen: () => {
        const t = feld.value, saetzeN = (t.match(/[.!?]+(\s|$)/g) || []).length, woerterN = (t.match(/[A-Za-z']+/g) || []).length;
        const fehltS = Math.max(0, min - saetzeN), fehltW = Math.max(0, min * WOERTER_JE_SATZ - woerterN);
        if (fehltS || fehltW) return T(`✏️ Schreib mindestens ${min} Sätze mit ${min * WOERTER_JE_SATZ} Wörtern (noch ${[fehltS && fehltS + (fehltS === 1 ? " Satz" : " Sätze"), fehltW && fehltW + (fehltW === 1 ? " Wort" : " Wörter")].filter(Boolean).join(", ")}).`,
          `✏️ Write at least ${min} sentences with ${min * WOERTER_JE_SATZ} words (${[fehltS && fehltS + (fehltS === 1 ? " sentence" : " sentences"), fehltW && fehltW + (fehltW === 1 ? " word" : " words")].filter(Boolean).join(", ")} to go).`);
        const fehltI = teil.inhalt.filter((x) => !new RegExp(x.muster, "i").test(t)).length;
        if (fehltI) return T(`✏️ Schreib über alle Inhaltspunkte (noch ${fehltI}).`, `✏️ Write about all content points (${fehltI} to go).`);
        if (/…|\.\.\./.test(t)) return T("✏️ Füll die Lücken (…) in deinem Text aus.", "✏️ Fill in the gaps (…) in your text.");
        return "";
      } });
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
      const los = () => { feld.value = ""; pruefen(); };
      if (feld.value) frage(T("Deinen Text wirklich löschen?", "Really delete your text?"), T("🗑️ Löschen", "🗑️ Delete")).then((ok) => { if (ok) los(); }); else los();
    });
    lage.abspielen = null; lage.weiter = () => { if (sperre_.bereit()) naechstes(); };
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
      sperre_.uhr, el("div", { class: "knopfreihe" }, weiter));
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
        sperre_.bereit();
      } },
      el("span", { class: "bild-nr", "aria-hidden": "true" }, String(i + 1)),
      b.bild ? el("img", { class: "bild-foto", src: b.bild, alt: "" })
        : el("span", { class: "bild-sym", "aria-hidden": "true" }, b.symbol),
      el("span", { class: "bild-text", lang: E() ? "en" : "de", hidden: true }, tx(b)),
      el("span", { class: "bild-haken", "aria-hidden": "true" }, "✓")));
    const vorlesen = () => spiele(text.map(({ s }) => tonSatz(s)));
    async function pruefen() {
      if (geloest || !sperre_.bereit()) return;
      sperre_.ende();
      geloest = true; pruef.hidden = true; weiter.hidden = false; lage.weiter = naechstes;
      app.querySelectorAll(".tipp").forEach((t) => { t.hidden = true; });
      let richtig = 0;
      bilder.forEach((b, i) => {
        const ok = !!b.beleg === gewaehlt.has(i);
        if (ok) richtig++;
        kacheln[i].classList.add(b.beleg ? "soll" : "nicht", ok ? "ok" : "falsch");
        kacheln[i].querySelector(".bild-text").hidden = false;
      });
      if (richtig < bilder.length) lage.hilfe = true; // +5 „ohne Hilfe“ nur, wenn alles richtig ist (30.10.)
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
    // Lesezeit-Sperre (30.10.2026, Mr. Alex): „Lösung prüfen“ erst nach realistischer Lesezeit (80 Wörter pro Minute für den Text
    // + 2,5 s je Bild wie im Quiz, ab Start des Teils) und erst, wenn mindestens ein Bild angekreuzt ist. Sperre im Programm.
    const sperre_ = arbeitsSperre(pruef, { start: lage.start,
      sek: (woerterIn(text.map(({ s }) => s.en)) / LESE_WPM * 60 + bilder.length * QUIZ_MIN) * eile(),
      zeitText: (z) => T(`📖 Lies erst den Text genau. „Lösung prüfen“ geht in ${z}.`, `📖 Read the text carefully first. “Check” opens in ${z}.`),
      offen: () => (gewaehlt.size ? "" : T("✏️ Kreuze die Bilder an, die im Text passieren.", "✏️ Tick the pictures that happen in the text.")) });
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
      el("section", { class: "satzkarte" }, sperre_.uhr, el("div", { class: "knopfreihe" }, pruef, weiter), ergebnis));
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
  const heute = () => (LOKAL && window.__heute ? new Date(window.__heute + "T12:00:00") : new Date());
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
  // Zeitlog „Mr. Alex is watching you“ (30.10.2026, Mr. Alex): mehr als 200 Übungspunkte in 10 Minuten → die App sperrt sich,
  // bis Mr. Alex sie mit seiner Lehrer-PIN freischaltet. Die Punkte bleiben (gute Schüler sollen nicht bestraft werden); im Lehrer-Bereich
  // kann er sie bei Bedarf korrigieren. Gezählt werden nur Punkte für Teile und Word Gym (ohne Boni wie Hausaufgabe, Serie, Woche, Station).
  // Log, Sperre und Warnungen stecken in stand.spiel (Siegel) – Neuladen hebt die Sperre nicht auf. Jede Warnung bleibt mit Zeitpunkt gespeichert.
  const WACHE = { fenster: 10 * 60000, grenze: 200 };
  function mrAlexWacht(sp, basis) {
    const jetzt = Date.now();
    sp.log = (Array.isArray(sp.log) ? sp.log : []).filter((e) => Array.isArray(e) && e[0] <= jetzt && jetzt - e[0] < WACHE.fenster);
    sp.log.push([jetzt, basis]);
    if (sp.log.reduce((a, e) => a + e[1], 0) > WACHE.grenze) {
      sp.gesperrt = jetzt; sp.log = [];
      (sp.warnungen = Array.isArray(sp.warnungen) ? sp.warnungen : []).push(new Date(jetzt).toISOString());
      setTimeout(sperreZeigen, 900); // nach Lob und Toasts
    }
    return true;
  }
  const sperreDialog = el("dialog", { class: "feier frage sperre" });
  sperreDialog.addEventListener("cancel", (e) => e.preventDefault());
  document.body.append(sperreDialog);
  function sperreZeigen() {
    if (!(stand.spiel && stand.spiel.gesperrt)) return;
    stopp();
    sperreDialog.replaceChildren(el("div", { class: "feier-symbol", "aria-hidden": "true" }, "👀"),
      el("h2", { lang: "en" }, "Mr. Alex is watching you!"),
      el("p", { class: "sperre-gross", lang: "en" }, "You are either great or cheating. 😉"),
      el("p", {}, T("Du hast in sehr kurzer Zeit sehr viele Punkte gesammelt. Deine Punkte bleiben. Zeig die App Mr. Alex – er schaltet sie mit seiner PIN wieder frei.", "You collected a lot of points in a very short time. Your points stay. Show the app to Mr. Alex – he unlocks it with his PIN.")),
      el("div", { class: "knopfreihe" }, knopf(T("👩‍🏫 Lehrer-PIN", "👩‍🏫 Teacher PIN"), () => { sperreDialog.close(); lehrerStart(); }, "haupt")));
    if (!sperreDialog.open) sperreDialog.showModal();
  }
  function belohne(erstesMal, ohneHilfe, istGym, wdh) {
    const sp = spielstand(), d = heute(), tag = iso(d);
    const vorher = staatenBei(teileZaehler() - (erstesMal ? 1 : 0));
    let plus = istGym ? PUNKTE.seance : erstesMal ? PUNKTE.teil : (wdh != null ? wdh : PUNKTE.wiederholung);
    if (!mrAlexWacht(sp, plus + (erstesMal && ohneHilfe && !istGym ? PUNKTE.ohneHilfe : 0))) { // Zeitlog: zu viele Punkte in zu kurzer Zeit
      if (!istGym) hwBonus(0); // zählt trotzdem für die Hausaufgabe
      speichern(); setTimeout(zeigeEreignisse, 50); return;
    }
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
    const muenzen = Math.ceil(plus / 2); sp.punkte += plus; sp.coins += muenzen; // seit 30.10.: halb so viele Coins wie Punkte, aufgerundet (Coins sinken nur im Shop)
    ereignisse.unshift({ art: "toast", text: `+${plus} ⭐ · +${muenzen} 🪙` });
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
  // Eigener Bestätigungsdialog statt confirm(): funktioniert auch in eingebetteten Rahmen (Vorschau) und sieht aus wie die App
  const frageDialog = el("dialog", { class: "feier frage" });
  document.body.append(frageDialog);
  function frage(text, ja, nein) {
    return new Promise((fertig) => {
      const zu = (antwort) => { frageDialog.close(); fertig(antwort); };
      frageDialog.replaceChildren(el("p", { class: "frage-text" }, text),
        el("div", { class: "knopfreihe" }, knopf(ja || T("Ja", "Yes"), () => zu(true), "haupt"), knopf(nein || T("Abbrechen", "Cancel"), () => zu(false), "leise")));
      frageDialog.onclose = () => fertig(false);
      frageDialog.showModal();
    });
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
      runnerSammlung(),
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
  async function kaufe(a) {
    const sp = spielstand();
    if (a.bald) { toast(tx(a.hinweis)); return false; }
    if (a.runner) { // Ticket: mehrfach kaufbar, ein Ticket = ein Durchgang (wird beim Start eingelöst)
      if (sp.coins < a.preis) { toast(T(`Noch ${a.preis - sp.coins} Coins`, `${a.preis - sp.coins} more coins`)); return false; }
      if (!(await frage(T(`Ein Ticket für ${a.preis} Coins kaufen?`, `Buy a ticket for ${a.preis} coins?`), T("🎟️ Kaufen", "🎟️ Buy")))) return false;
      sp.coins -= a.preis; sp.ausgegeben += a.preis; runnerStand().tickets = (runnerStand().tickets || 0) + 1; speichern();
      ereignisse.push({ art: "toast", text: `🎟️ +1 · 🪙 −${a.preis}` });
      setTimeout(zeigeEreignisse, 50); konfettiFrei();
      return true;
    }
    if (sp.gekauft.includes(a.id)) { if (a.rahmen) { sp.rahmen = a.rahmen; speichern(); } if (a.skin) { skinSetzen(a.skin[0], a.skin[1]); } return false; }
    if (sp.coins < a.preis) { toast(T(`Noch ${a.preis - sp.coins} Coins`, `${a.preis - sp.coins} more coins`)); return false; }
    if (!(await frage(T(`Für ${a.preis} Coins kaufen?`, `Buy for ${a.preis} coins?`), T("Kaufen", "Buy")))) return false;
    sp.coins -= a.preis; sp.ausgegeben += a.preis; sp.gekauft.push(a.id);
    if (a.rahmen) sp.rahmen = a.rahmen;
    if (a.skin) skinSetzen(a.skin[0], a.skin[1]);
    speichern();
    ereignisse.push({ art: "toast", text: `🪙 −${a.preis}` });
    setTimeout(zeigeEreignisse, 50); konfettiFrei();
    return true;
  }
  // opt (optional): { zurueck: fn, artikel: id } – Rücksprung z. B. zur Figur-Seite des Runners, ein Artikel wird hervorgehoben
  function shop(opt) {
    opt = opt && typeof opt.zurueck === "function" ? opt : {};
    lage = null; ansicht = () => shop(opt);
    const sp = spielstand();
    const artikel = (a) => {
      const hat = sp.gekauft.includes(a.id), fehlt = a.preis - sp.coins;
      const aktiv = hat && ((a.rahmen && sp.rahmen === a.rahmen) || (a.skin && skinWirksam()[a.skin[0]] === a.skin[1]));
      let k;
      if (a.bald) k = el("span", { class: "shop-hinweis" }, tx(a.hinweis));
      else if (a.runner) k = el("div", { class: "knopfreihe ticket-reihe" },
        el("span", { class: "shop-hinweis" }, `🎟️ ${runnerStand().tickets || 0} ${T("Tickets", "tickets")}`),
        fehlt > 0 ? sperrt(knopf(T(`Noch ${fehlt} Coins`, `${fehlt} more coins`), () => { kaufe(a); shop(opt); })) : knopf(T("Ticket kaufen", "Buy ticket"), () => { kaufe(a).then((ok) => { if (ok) shop(opt); }); }, "haupt"),
        (runnerStand().tickets || 0) > 0 && knopf(T("▶ Zum Spiel", "▶ To the game"), () => runnerStart()));
      else if (hat && (a.rahmen || a.skin)) k = aktiv ? el("span", { class: "shop-hinweis ok" }, T("✓ Angelegt", "✓ Wearing it")) : knopf(T("Anlegen", "Put it on"), () => { kaufe(a).then(() => shop(opt)); });
      else if (hat) k = el("span", { class: "shop-hinweis ok" }, T("✓ Gekauft", "✓ Bought"));
      else if (fehlt > 0) k = sperrt(knopf(T(`Noch ${fehlt} Coins`, `${fehlt} more coins`), () => { kaufe(a); shop(opt); }));
      else k = knopf(T("Kaufen", "Buy"), () => { kaufe(a).then((ok) => { if (ok) shop(opt); }); }, "haupt");
      return el("div", { class: "shop-artikel" + (hat ? " gekauft" : "") + (a.bald ? " bald" : "") + (a.rahmen ? " rahmen-" + a.rahmen : "") + (a.id === opt.artikel ? " hervor" : ""), "data-artikel": a.id },
        el("span", { class: "sym", "aria-hidden": "true" }, a.symbol),
        el("strong", {}, tx(a.name)), a.unter && el("span", { class: "unter" }, tx(a.unter)),
        el("span", { class: "preis" }, `🪙 ${a.preis}`),
        a.bald && el("span", { class: "bald-schild" }, T("kommt bald", "coming soon")),
        k);
    };
    const alle = SP.shop || [], skins = alle.filter((a) => a.skin);
    zeige(
      el("header", { class: "kopf" }, knopf(opt.zurueck ? T("← Zurück", "← Back") : "← Start", opt.zurueck || startseite, "leise"), el("h1", {}, "🛍️ Shop")),
      el("section", { class: "satzkarte shop-stand" },
        el("p", { class: "shop-coins" }, `🪙 ${sp.coins} Coins`),
        el("p", { class: "klein" }, T("Für 2 Punkte gibt es 1 Coin. Punkte bleiben – Coins kannst du hier ausgeben.",
          "Two points give you one coin. Points stay – coins are yours to spend here."))),
      el("div", { class: "shop-raster" }, alle.filter((a) => !a.skin).map(artikel)),
      skins.length > 0 && el("h2", { class: "shop-gruppe" }, T("🎨 Figur für Road Trip Run", "🎨 Road Trip Run character"), " ", knopf(T("Figur ansehen", "View character"), () => runnerSkins(), "leise")),
      skins.length > 0 && el("div", { class: "shop-raster" }, skins.map(artikel)),
      el("div", { class: "knopfreihe" }, knopf(T("🏆 Meine Sammlung", "🏆 My collection"), sammlung)));
    const h = opt.artikel && app.querySelector(".shop-artikel.hervor");
    if (h && !leise) h.scrollIntoView({ block: "center" });
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
        el("button", { class: "kachel runner-kachel", onclick: () => runnerStart(k), "aria-label": "Road Trip Run" },
          el("span", { class: "sym", "aria-hidden": "true" }, "🏃"),
          el("span", { class: "titel", lang: "en" }, "Road Trip Run"),
          el("span", { class: "unter" }, `Jump'n'Run · 🎟️ ${T("Ticket", "ticket")} ${RUNNER.preis} 🪙`)),
        el("button", { class: "kachel shop-kachel", onclick: () => shop(), "aria-label": "Shop" },
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
    // Antippen spielt das Wort (Einzelwort-Aufnahme), ersatzweise den ganzen Satz (britisch Mr. Alex, amerikanisch Jeremy/Jessica); solange er läuft, bleibt alles stehen
    // Seit 31.10. mit den Einzelwort-Aufnahmen (britisch Mr. Alex, amerikanisch Jeremy); fehlt eine, wie vorher der ganze Satz
    const tonFuer = (w) => { const datei = w.seite === "be" ? w.p.audio_be : w.p.audio_ae; if (datei) return datei; const satz = D.saetze[w.p.id]; return w.seite === "be" ? (satz.be.audio || { text: satz.be.en, stimme: "m" }) : tonSatz(satz); };
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
      const tempo = PATROL.tempo * (1 + richtig * 0.05) * ((LOKAL && window.__patrolTempo) || 1);
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
      const tempo = CATCH.tempo * (1 + treffer * 0.06) * ((LOKAL && window.__catchTempo) || 1);
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

  /* ---------- Games: Road Trip Run – Jump'n'Run (Modul app/klasse9/runner.js; Konzept docs/runner/konzept-entwurf.md „Einbau Klasse 9“) ----------
     Eintritt 150 Coins je Durchgang (seit 30.10., vorher 100), Sperre im Programm (runnerSpiel), keine Punkte, keine Coins zurück. Belohnung: Trophäe je Welt
     (Gold = alle Diamanten + beide Tore richtig, sonst Silber) und Runner-Titel nach geschafften Leveln (1 · 3 · 6 · 10 · 15).
     Stand in stand.spiel.runner = { level: { ny: "gold"|"silber" }, gespielt, geschafft, titel }, Figur in stand.spiel.skin – beides im Siegel.
     Wörter: 12 aus dem gewählten Abschnitt (wie Catch the Word), aufgefüllt aus der Unit; gesprochen mit den Wortaufnahmen (tonWort).
     Boss-Banner/-Sprüche und Skin-Namen: bis zur Vertonung (Mr. Alex, 13.11.) Geräte-Stimme wie bei fehlenden Aufnahmen (spiele([{ text, stimme }])). */
  // Welten (docs/runner/welten-2-5-plan.md): Reihenfolge = Landmark-Route; Welt n+1 öffnet sich mit Silber in Welt n; alle fünf Welten gebaut (Welt 5 Golden Gate 30.10.).
  // unit = vorbelegte Unit beim Wählen der Welt (der Schüler darf umschalten); boss = Name für Texte/Frage-Titel.
  const RUNNER = { preis: 150, skinPreis: 45, skinPreisTeuer: 90, woerter: 12, titel: ["Noob", "Rookie", "Pro", "Elite", "Legend"], ab: [1, 3, 6, 10, 15],
    welten: [{ id: "ny", name: "New York", staat: "New York", ziel: "Statue of Liberty", trophaee: "Liberty Finder", symbol: "🗽", boss: "Mr. Alligator" },
      { id: "route66", name: "Route 66", staat: "Illinois", ziel: "Route 66 sign", trophaee: "Route 66 Rider", symbol: "🛣️", boss: "Big Rig Bob", unit: "1" },
      { id: "az", name: "Grand Canyon", staat: "Arizona", ziel: "Grand Canyon", trophaee: "Canyon Climber", symbol: "🏜️", boss: "Sheriff Rattlesnake", unit: "2" },
      { id: "sd", name: "Mount Rushmore", staat: "South Dakota", ziel: "Mount Rushmore", trophaee: "Rushmore Ranger", symbol: "🗿", boss: "Grizzly Grandpa", unit: "2" },
      { id: "ca", name: "Golden Gate", staat: "California", ziel: "Golden Gate Bridge", trophaee: "Golden Gate Legend", symbol: "🌉", boss: "Captain Fog", unit: "2" }] };
  // Welt n ist offen, wenn sie gebaut ist (nicht bald) und die Vorwelt mindestens Silber hat
  const runnerWeltOffen = (w) => { const i = RUNNER.welten.indexOf(w); return !w.bald && (i <= 0 || !!runnerStand().level[RUNNER.welten[i - 1].id]); };
  const runnerWeltVon = (id) => RUNNER.welten.find((w) => w.id === id) || RUNNER.welten[0];
  const R = () => window.Runner || null;
  const spieleKategorie = () => D.kategorien.find((k) => k.spiele);
  function runnerStand() {
    const sp = spielstand();
    if (!sp.runner || typeof sp.runner !== "object") sp.runner = { level: {}, gespielt: 0, geschafft: 0, titel: 0 };
    if (!sp.runner.level) sp.runner.level = {};
    if (!sp.skin || typeof sp.skin !== "object") sp.skin = {};
    if (sp.skin.bart === "an") sp.skin.bart = "schnauzer"; // Figur v2 (29.10.): Schnurrbart an/aus → Bart-Auswahl
    return sp.runner;
  }
  const runnerTitelIndex = (n) => RUNNER.ab.filter((a) => n >= a).length; // 0 = noch keiner, 1 = Noob … 5 = Legend
  const runnerTitelName = (i) => (i > 0 ? RUNNER.titel[i - 1] : null);
  const skinWirksam = () => (runnerStand(), R() ? R().powerAnwenden(spielstand().skin, spielstand().titel) : spielstand().skin); // Power-Körper nach Punkte-Titel-Stufe
  const skinFrei = (key, wert) => !R() || R().skinFrei(key, wert) || spielstand().gekauft.includes(R().skinArtikel(key, wert));
  function skinSetzen(key, wert) {
    const s = (runnerStand(), spielstand().skin);
    if (key === "muskeln" && (s.power || "an") === "an") s.muskelnManuell = wert; // Power-Körper an: Muskeln von Hand überschreiben
    else { s[key] = wert; if (key === "power" && wert === "an") delete s.muskelnManuell; }
    speichern();
  }
  const tx2 = (p) => (Array.isArray(p) ? (E() ? p[1] : p[0]) : String(p));
  // Vorschau-Figur (Canvas), läuft nur solange sie in der Seite ist; bei prefers-reduced-motion ein Standbild
  function figurVorschau(breite, hoehe) {
    const cv = el("canvas", { class: "runner-vorschau", width: breite * 2, height: hoehe * 2, style: `width:${breite}px;height:${hoehe}px`, "aria-hidden": "true" });
    const c = cv.getContext("2d");
    const male = (pose, t) => {
      c.setTransform(2, 0, 0, 2, 0, 0); c.clearRect(0, 0, breite, hoehe);
      c.fillStyle = "#e9f4ff"; c.beginPath(); c.roundRect(0, 0, breite, hoehe, 18); c.fill();
      if (R()) { const s = skinWirksam(); R().zeichneFigur(c, breite / 2, hoehe * 0.95, Math.min(hoehe * 0.72, hoehe * 0.9 * 80 / R().figurHoehe(s)), s, pose, t); } // Figur v2: ≈ 88 Einheiten + Hut/Frisur/Giraffenhals → passend skaliert
    };
    const lauf = () => { if (!cv.isConnected) return; male("lauf", performance.now() / 1000); requestAnimationFrame(lauf); };
    requestAnimationFrame(() => (ruhig() ? male("steh", 0) : lauf()));
    cv.neuMalen = () => male(ruhig() ? "steh" : "lauf", performance.now() / 1000); // nach einer Skin-Änderung sofort nachziehen (auch im Standbild)
    return cv;
  }
  // 12 Wörter: zuerst der gewählte Abschnitt (gemischt), dann Wörter der übrigen Abschnitte der Unit
  function runnerWoerter(unit, i) {
    const gruppen = D.units[unit] || [], g = gruppen[i];
    if (!g) return [];
    const ok = (v) => catchOk(v) && v.de;
    const eigene = mischen(g.vokabeln.map(vokabel).filter(ok));
    const rest = mischen(gruppen.filter((x) => x !== g).flatMap((x) => x.vokabeln).map(vokabel).filter((v) => ok(v) && !eigene.includes(v)));
    return eigene.concat(rest).slice(0, RUNNER.woerter);
  }
  let runnerWahl = null, runnerLauf = null, skinTab = "haare";
  function runnerAus() {
    if (runnerLauf) { try { runnerLauf.stopp(); } catch (e) { /* egal */ } runnerLauf = null; }
    document.body.classList.remove("runner-aktiv");
  }
  const runnerFehlt = () => Math.max(0, RUNNER.preis - spielstand().coins);
  const trophaeenText = (st) => (st === "gold" ? "🥇 Gold" : st === "silber" ? T("🥈 Silber", "🥈 Silver") : "–");
  // Startseite: Welt, Figur, Wörter wählen (Unit/Abschnitt wie bei Catch the Word), Coins, Spielen
  function runnerStart(k) {
    k = k || spieleKategorie();
    lage = null; ansicht = () => runnerStart(k);
    const sp = spielstand(), r = runnerStand(), unit = aktuelleUnit(), gruppen = D.units[unit];
    if (!runnerWahl || runnerWahl.unit !== unit || !gruppen[runnerWahl.i]) runnerWahl = { unit, i: 0, welt: runnerWahl && runnerWahl.welt };
    let W = runnerWeltVon(runnerWahl.welt);
    if (!runnerWeltOffen(W)) { W = RUNNER.welten[0]; runnerWahl.welt = W.id; }
    const tickets = r.tickets || 0, fehlt = runnerFehlt(), ws = runnerWoerter(unit, runnerWahl.i), titel = runnerTitelName(r.titel);
    const zumShop = () => shop({ zurueck: () => runnerStart(k), artikel: "runner" });
    // Ohne Ticket führt der Hauptknopf in den Shop (Ticket hervorgehoben), damit klar ist, wo man hin muss
    const spielen = tickets > 0
      ? knopf(`▶ ${T("Spielen", "Play")} (🎟️ 1)`, () => runnerSpiel(k, unit, runnerWahl.i, W.id), "haupt runner-spielen")
      : knopf(T(`🎟️ Erst Ticket kaufen – ${RUNNER.preis} 🪙`, `🎟️ Buy a ticket first – ${RUNNER.preis} 🪙`), zumShop, "haupt runner-spielen");
    if (tickets > 0 && (ws.length < 4 || !R())) sperrt(spielen);
    // Welt-Reiter: offen = wählbar (Welt 2 belegt Unit 1 vor, Welten 3–5 Unit 2; umschaltbar), gesperrt = 🔒 mit Hinweis auf Silber in der Vorwelt, bald = 🔒 ohne Spiel (derzeit keine)
    const weltHinweis = el("p", { class: "klein runner-welt-hinweis", role: "status" });
    const weltReiter = el("div", { class: "reiter runner-welten", role: "listbox", "aria-label": T("Welt", "World") }, RUNNER.welten.map((w, i) => {
      const offen = runnerWeltOffen(w), vor = RUNNER.welten[i - 1];
      return el("button", { class: "reiter-knopf" + (offen ? "" : " gesperrt"), role: "option", "aria-selected": String(w.id === W.id), "aria-disabled": String(!offen), "data-welt": w.id,
        onclick: () => {
          if (!offen) { weltHinweis.textContent = w.bald ? T(`${w.name} kommt bald.`, `${w.name} is coming soon.`) : T(`🔒 Silber in ${vor.name} nötig – schaff erst Level ${i}!`, `🔒 You need silver in ${vor.name} – finish level ${i} first!`); toast(weltHinweis.textContent); return; }
          runnerWahl = { unit: w.unit && D.units[w.unit] && D.units[w.unit].length ? w.unit : unit, i: 0, welt: w.id };
          if (runnerWahl.unit !== unit) { stand.unit = runnerWahl.unit; speichern(); }
          runnerStart(k);
        } }, `${offen ? w.symbol : "🔒"} ${i + 1} · ${w.name}`);
    }));
    zeige(spielKopf(k, "Road Trip Run", () => zeigeSpiele(k)),
      el("section", { class: "satzkarte runner-start" },
        weltReiter, weltHinweis,
        el("div", { class: "runner-welt" },
          el("span", { class: "runner-welt-sym", "aria-hidden": "true" }, W.symbol),
          el("div", {},
            el("h2", { lang: "en" }, `Level ${RUNNER.welten.indexOf(W) + 1} · ${W.name}`),
            el("p", { class: "runner-ziel", lang: "en" }, `Find the ${W.ziel}!`),
            el("p", { class: "klein" }, W.id === "ca"
              ? T(`Tippen oder Leertaste = springen, länger halten = höher. Im Nebel siehst du wenig – die Diamanten leuchten durch, auf Geräusche achten! Über den Pazifik bringen dich Seilbahn-Gondeln: Spring drauf, wenn sie nah ist, und rechtzeitig wieder ab. Auf der Surfbrett-Rutsche bist du kurz richtig schnell. Vorsicht Möwe: Berührt sie dich, klaut sie einen Diamanten (kein Leben) – drauf springen oder mit langem Sprung drüber. Seelöwen und Skater kannst du plattdrücken. Sammle die 12 Wort-Diamanten, nimm die richtigen Tore und beantworte die Frage von ${W.boss} am Brückentor – gut 2 Minuten. Am besten das Handy quer halten.`,
                `Tap or space = jump, hold longer = jump higher. In the fog you can't see much – the diamonds glow through, listen for sounds! Cable-car gondolas carry you across the Pacific: jump on when one is close, and jump off in time. On the surfboard slide you're really fast for a moment. Beware of the seagull: if it touches you, it steals a diamond (not a life) – stomp it or clear it with a long jump. Sea lions and skaters can be squashed. Collect the 12 word diamonds, take the right gates and answer ${W.boss}'s question at the bridge gate – about 2 minutes. Best in landscape mode.`)
              : W.id === "sd"
              ? T(`Tippen oder Leertaste = springen, länger halten = höher. Baumstämme rollen den Hang herunter – drüberspringen! Über Bäche hüpfst du auf den Steinen. Wenn Blätter fliegen, kommt eine Windböe: Sie schiebt dich kurz, und du springst nur halb so hoch. Vor Bärenhöhlen nicht trödeln (Pranke!). Büffel kannst du nicht plattdrücken – nur überspringen. Sammle die 12 Wort-Diamanten, nimm die richtigen Tore und beantworte die Frage von ${W.boss} an der Ranger-Station – gut 2 Minuten. Am besten das Handy quer halten.`,
                `Tap or space = jump, hold longer = jump higher. Logs roll down the hill – jump over them! Cross the streams on the stepping stones. Flying leaves mean a gust of wind: it pushes you for a moment and you only jump half as high. Don't dawdle in front of bear caves (paw!). You can't squash buffalos – only jump over them. Collect the 12 word diamonds, take the right gates and answer ${W.boss}'s question at the ranger station – about 2 minutes. Best in landscape mode.`)
              : W.id === "az" && STORY[W.id]
              ? T(`Tippen oder Leertaste = springen, länger halten = höher. Steine kündigen sich mit Staub an – spring, bevor sie landen! Auf den Hängebrücken nicht trödeln (springen!), Kakteen nicht berühren. Story „${STORY[W.id].titel}“ (Kapitel 3): Die violetten ♪-Kristalle erzählen weiter – der Anfang hängt davon ab, ob du Lucas auf der Route 66 die Wahrheit sofort abverlangt hast${storyStand("route66").wahl.g2 ? "" : " (noch nicht gespielt? Dann hat er sie dir erst hier erzählt)"}. Zweimal entscheidest du: den Maultierpfad hinab in den Canyon oder oben am Rand über die Glasbrücke? Und am Ende: Wem gibst du Grandpas Tagebuch – Lucas oder Maya? Deine Wahl zählt in Kapitel 4. Die 💎-Diamanten zeigen dir Wörter und geben je 1 ⭐ (nur wenn du das Level schaffst). Nimm die richtigen Tore und beantworte die Frage von ${W.boss} am Holztor – etwa 3 Minuten. Irgendwo ist wieder ein verstecktes Tor … Lucas' Tagebuch weiß, wo. Am besten das Handy quer halten.`,
                `Tap or space = jump, hold longer = jump higher. Falling rocks warn you with dust – jump before they land! Don't dawdle on the rope bridges (jump!), don't touch the cacti. Story “${STORY[W.id].titel}” (chapter 3): the purple ♪ crystals carry on – the beginning depends on whether you made Lucas tell the truth right away on Route 66${storyStand("route66").wahl.g2 ? "" : " (not played yet? Then he only tells you here)"}. Twice you choose: down the mule trail into the canyon or along the rim and over the glass bridge? And at the end: who gets Grandpa's journal – Lucas or Maya? Your choice counts in chapter 4. The 💎 diamonds show you words and give 1 ⭐ each (only if you finish the level). Take the right gates and answer ${W.boss}'s question at the wooden gate – about 3 minutes. Somewhere there is a hidden gate again … Lucas's journal knows where. Best in landscape mode.`)
              : W.id === "az"
              ? T(`Tippen oder Leertaste = springen, länger halten = höher. Steine kündigen sich mit Staub an – spring, bevor sie landen! Auf den Hängebrücken nicht trödeln (springen!), Kakteen nicht berühren. Sammle die 12 Wort-Diamanten, nimm die richtigen Tore und beantworte die Frage von ${W.boss} am Holztor – gut 2 Minuten. Am besten das Handy quer halten.`,
                `Tap or space = jump, hold longer = jump higher. Falling rocks warn you with dust – jump before they land! Don't dawdle on the rope bridges (jump!), don't touch the cacti. Collect the 12 word diamonds, take the right gates and answer ${W.boss}'s question at the wooden gate – about 2 minutes. Best in landscape mode.`)
              : W.id === "route66" && STORY[W.id]
              ? T(`Tippen oder Leertaste = springen, länger halten = höher (über Trucks!). Autos kommen von rechts – drüberspringen, Ölflecken lassen dich kurz rutschen. Story „${STORY[W.id].titel}“ (Kapitel 2): Die violetten ♪-Kristalle erzählen weiter – der Anfang hängt davon ab, was du in New York mit der Karte gemacht hast${storyStand("ny").wahl.g2 ? "" : " (noch nicht gespielt? Dann hat die Frau sie nicht bekommen)"}. Zweimal entscheidest du: am Diner anhalten oder weiterfahren? Und am Ende: Lucas die Wahrheit jetzt abverlangen – oder später? Deine Wahl zählt in Kapitel 3. Die 💎-Diamanten zeigen dir Wörter und geben je 1 ⭐ (nur wenn du das Level schaffst). Nimm die richtigen Tore und beantworte die Frage von ${W.boss} an der Mautstation – etwa 3 Minuten. Irgendwo ist wieder ein verstecktes Tor … Am besten das Handy quer halten.`,
                `Tap or space = jump, hold longer = jump higher (over trucks!). Cars come from the right – jump over them, oil slicks make you slide. Story “${STORY[W.id].titel}” (chapter 2): the purple ♪ crystals carry on – the beginning depends on what you did with the map in New York${storyStand("ny").wahl.g2 ? "" : " (not played yet? Then the woman didn't get it)"}. Twice you choose: stop at the diner or keep driving? And at the end: make Lucas tell the truth now – or later? Your choice counts in chapter 3. The 💎 diamonds show you words and give 1 ⭐ each (only if you finish the level). Take the right gates and answer ${W.boss}'s question at the toll booth – about 3 minutes. Somewhere there is a hidden gate again … Best in landscape mode.`)
              : W.id === "route66"
              ? T(`Tippen oder Leertaste = springen, länger halten = höher (über Trucks!). Autos kommen von rechts – drüberspringen, Ölflecken lassen dich kurz rutschen. Sammle die 12 Wort-Diamanten, nimm die richtigen Tore und beantworte die Frage von ${W.boss} an der Mautstation – gut 2 Minuten. Am besten das Handy quer halten.`,
                `Tap or space = jump, hold longer = jump higher (over trucks!). Cars come from the right – jump over them, oil slicks make you slide. Collect the 12 word diamonds, take the right gates and answer ${W.boss}'s question at the toll booth – about 2 minutes. Best in landscape mode.`)
              : STORY[W.id]
              ? T(`Tippen oder Leertaste = springen, länger halten = höher. Story „${STORY[W.id].titel}“ (Kapitel 1): Die violetten ♪-Kristalle erzählen die Geschichte. Zweimal entscheidest du über deinen Weg – unten oder oben? Am Ende: Gibst du die Karte her oder behältst du sie? Deine Wahl zählt auch in den nächsten Kapiteln. Die 💎-Diamanten zeigen dir Wörter und geben je 1 ⭐ (nur wenn du das Level schaffst). Nimm die richtigen Tore und beantworte die Frage von ${W.boss} – etwa 3 Minuten. Irgendwo ist ein verstecktes Tor … Am besten das Handy quer halten.`,
                `Tap or space = jump, hold longer = jump higher. Story “${STORY[W.id].titel}” (chapter 1): the purple ♪ crystals tell the story. Twice you choose your path – down or up? At the end: do you give the map away or keep it? Your choice counts in the next chapters, too. The 💎 diamonds show you words and give 1 ⭐ each (only if you finish the level). Take the right gates and answer ${W.boss}'s question – about 3 minutes. Somewhere there is a hidden gate … Best in landscape mode.`)
              : T(`Tippen oder Leertaste = springen, länger halten = höher. Sammle die 12 Wort-Diamanten, nimm die richtigen Tore und beantworte die Frage von ${W.boss} – gut 2 Minuten. Am besten das Handy quer halten.`,
                `Tap or space = jump, hold longer = jump higher. Collect the 12 word diamonds, take the right gates and answer ${W.boss}'s question – about 2 minutes. Best in landscape mode.`)))),
        el("div", { class: "runner-figur" }, figurVorschau(110, 140),
          el("div", { class: "runner-figur-text" },
            el("p", { class: "klein" }, T("Deine Figur", "Your character")),
            knopf(T("🎨 Figur", "🎨 Character"), () => runnerSkins(k)))),
        el("p", { class: "runner-stand" },
          el("span", {}, `🏃 ${titel || T("noch kein Titel", "no title yet")}`),
          el("span", {}, `🏆 ${W.trophaee}: ${trophaeenText(r.level[W.id])}`),
          el("span", {}, `🎮 ${r.gespielt} ${T("Spiele", "games")} · ${r.geschafft} ${T("Level geschafft", "levels done")}`))),
      el("section", { class: "satzkarte" },
        el("h2", {}, T("Welche Wörter?", "Which words?")),
        unitReiter(() => runnerStart(k)),
        gruppen.length ? el("div", { class: "reiter runner-gruppen", role: "listbox", "aria-label": T("Abschnitt", "Part") }, gruppen.map((g, i) =>
          el("button", { class: "reiter-knopf", role: "option", "aria-selected": String(i === runnerWahl.i), onclick: () => { runnerWahl = { unit, i }; runnerStart(k); } }, g.name)))
          : ansage("Coming soon!", "Diese Unit kommt bald."),
        ws.length > 0 && el("p", { class: "klein runner-woerter", lang: "en" }, ws.map(spielWort).join(" · "))),
      el("section", { class: "satzkarte runner-kasse" },
        el("p", { class: "shop-coins" }, `🎟️ ${tickets} ${T("Tickets", "tickets")} · 🪙 ${sp.coins} Coins`),
        tickets === 0 ? el("p", { class: "runner-hinweis", role: "status" }, fehlt > 0
            ? T(`Zum Spielen brauchst du ein Ticket aus dem Shop (${RUNNER.preis} Coins). Dir fehlen noch ${fehlt} Coins – übe weiter!`, `You need a ticket from the shop (${RUNNER.preis} coins). ${fehlt} more coins – keep practising!`)
            : T(`Zum Spielen brauchst du ein Ticket aus dem Shop (${RUNNER.preis} Coins). Kauf erst ein Ticket, dann geht's los!`, `You need a ticket from the shop (${RUNNER.preis} coins). Buy a ticket first, then off you go!`))
          : el("p", { class: "klein" }, STORY[W.id]
            ? T("Ein Ticket gilt für einen Durchgang – auch wenn du scheiterst. Story: 1 ⭐ je Diamant, +10 für jede ganze Geschichte, höchstens 30 ⭐ je Lauf – nur wenn du das Level schaffst. Dazu Trophäe und Runner-Titel.",
              "One ticket is one run – even if you fail. Story: 1 ⭐ per diamond, +10 for each whole story, max. 30 ⭐ per run – only if you finish the level. Plus a trophy and a runner title.")
            : T("Ein Ticket gilt für einen Durchgang – auch wenn du scheiterst. Keine Punkte und keine Coins zurück, dafür Trophäe und Runner-Titel.",
            "One ticket is one run – even if you fail. No points and no coins back, but a trophy and a runner title.")),
        el("div", { class: "knopfreihe" }, spielen, knopf("🛍️ Shop", zumShop))));
  }
  // Story-Modus New York „The Lost Map – Kapitel 1: Under the City“ (freigegeben 30.10., Text wörtlich aus docs/runner/story-usa-01.md; Erzähler Mr. Alex – bis zur Vertonung Geräte-Stimme).
  // Struktur (Abschnitte, Gabelungen, Stationen, Enden) liefert die Engine je Welt (WELTEN.ny.storyStruktur, passt zur Story-Strecke); story.struktur könnte sie hier überschreiben.
  // Punkte wie im London Run (Klasse 6): 1 ⭐ je Punkte-Diamant, +10 ⭐ einmalig je vollständiger Geschichte eines Endes (alle 20 ♪), höchstens 30 ⭐ je Lauf, nur bei geschafftem Level;
  // zuerst mrAlexWacht (Zeitlog), dann punkteDazu (Coins halb). Stand (im Siegel): stand.spiel.runner.story.ny = { enden, voll, beste, wahl: { g1: "A"|"B", g2: "X"|"Y" } } (letzte Wahl, für Kapitel 2),
  // verstecktes Tor ✦: stand.spiel.runner.realm.ny = { gefunden, kristalle, stuecke: ["R1" …], gegenstand }.
  // Aufnahmen: audio/story/ny_<key>.mp3 je Stück (+ ny_sofar) – nur Dateien, die der Bau findet (SP.story_audio); sonst Geräte-Stimme.
  // Kapitel 2 Route 66 „The Chase“ (31.10., Text wörtlich aus docs/runner/story-usa-02.md): Stücke 1–2 als Variante nach der Wahl aus Kapitel 1 (story.ny.wahl.g2: X = Karte gegeben → 1X/2X, sonst 1Y/2Y);
  // die App übergibt der Engine story.varianten = { "ny.g2": "X" | "Y" } (storyOption). Gabelung 2 (X = die Wahrheit jetzt / Y = später) landet in story.route66.wahl.g2 (für Kapitel 3).
  // Realm Kapitel 2: Sammelstück Dragon Scale 🐉 (STORY.route66.gegenstand) → stand.spiel.runner.realm.route66. Aufnahmen audio/story/route66_<key>.mp3 (vertont 31.10.).
  // Kapitel 3 Grand Canyon „Lucas' Secret“ (31.10., Text wörtlich aus docs/runner/story-usa-03.md): Stücke 1–2 als Variante nach der Wahl aus Kapitel 2 (story.route66.wahl.g2: X = Wahrheit jetzt → 1X/2X, sonst 1Y/2Y);
  // die App übergibt story.varianten["route66.g2"]. Gabelung 2 (X = Tagebuch an Lucas / Y = an Maya) landet in story.az.wahl.g2 (für Kapitel 4 „The Traitor“).
  // Realm Kapitel 3 (Drachenhöhle): Sammelstück Golden Scale ✨ → stand.spiel.runner.realm.az. Aufnahmen audio/story/az_<key>.mp3 (Sprecherplan werkzeuge/story_audio9.py, noch nicht vertont).
  const STORY_KEYS_NY = ["1", "2", "3", "4", "5", "A6", "A7", "A8", "A9", "A10", "B6", "B7", "B8", "B9", "B10", "11", "12", "13", "14", "X15", "X16", "Y15", "Y16",
    "X17", "X18", "X19", "X20", "Y17", "Y18", "Y19", "Y20", "R1", "R2", "R3", "sofar"];
  const STORY_KEYS_R66 = ["1X", "2X", "1Y", "2Y", "3", "4", "5", "A6", "A7", "A8", "A9", "A10", "B6", "B7", "B8", "B9", "B10", "11", "12", "13", "14", "X15", "X16", "Y15", "Y16",
    "X17", "X18", "X19", "X20", "Y17", "Y18", "Y19", "Y20", "R1", "R2", "R3", "sofar"];
  const STORY_KEYS_AZ = STORY_KEYS_R66;   // Kapitel 3 hat dieselben Schlüssel (1X/2X/1Y/2Y, 3–5, A/B, 11–14, X/Y, Enden, R1–R3, sofar)
  // Aufnahmen je Kapitel: ein Stück = eine Datei (<praefix>_<key>.mp3) oder mehrere Teile (<praefix>_<key>_1.mp3, _2 …) hintereinander; nur Dateien, die der Bau findet (SP.story_audio)
  const storyAudioDateien = (praefix, keys) => Object.fromEntries(keys.map((k) => {
    const alle = SP.story_audio || [], eins = `audio/story/${praefix}_${k}.mp3`;
    if (alle.includes(eins)) return [k, eins];
    const teile = []; for (let i = 1; alle.includes(`audio/story/${praefix}_${k}_${i}.mp3`); i++) teile.push(`audio/story/${praefix}_${k}_${i}.mp3`);
    return teile.length ? [k, teile] : null;
  }).filter(Boolean));
  const STORY = {
    ny: { id: "ny", titel: "The Lost Map – Under the City", kapitel: 1, welt: "New York",
      enden: { X: { symbol: "🤝", name: "Gone with the map" }, Y: { symbol: "🗺️", name: "The keeper" } }, wege: { A: "🚇 subway", B: "🏙️ roof", X: "🤝 give the map", Y: "🗺️ keep the map" },
      gegenstand: { name: "Frost Shard", symbol: "❄" }, teile: {
      1: "Our class trip started in Brooklyn on a rainy Monday.", 2: "Maya had a plan. Jayden had snacks. Lucas had secrets.", 3: "In a tiny bookshop, you found an old, folded map.",
      4: "Five places were marked on it – and five glowing gates.", 5: "The first gate was right here, in New York.",
      A6: "A woman with a brass compass smiled at you.", A7: "\"The map chooses its keeper,\" she whispered.", A8: "Then she disappeared into the subway.",
      A9: "You ran after her. Lucas didn't. Why not?", A10: "Deep under the street, the old walls were glowing.",
      B6: "You climbed a fire escape to see better.", B7: "Up on the roof, the map started to glow.", B8: "A golden line pointed down into the city.",
      B9: "Lucas stared at the line. \"I've seen this before.\"", B10: "Before you could ask him, Maya shouted: \"Run!\"",
      11: "A woman with a brass compass stepped out of the shadows.", 12: "\"Give me the map,\" she said. \"Mr. Alligator is coming.\"",
      13: "Jayden laughed. \"There are no alligators in New York!\"", 14: "Something splashed in the dark. Jayden stopped laughing.",
      X15: "You trusted her and gave her the map.", X16: "She smiled. \"Good. Now I can open the gate.\"",
      Y15: "You put the map in your pocket. \"No, thanks.\"", Y16: "Her eyes went cold. \"Then you're on your own.\"",
      X17: "Behind the door, the old gate was shining.", X18: "The woman held up the map, and the gate opened.", X19: "When you turned around, she was gone. With the map.",
      X20: "Lucas whispered: \"I know where she's going. Route 66.\"",
      Y17: "Behind the door, the old gate was shining.", Y18: "You held up the map, and the gate opened for you.", Y19: "A voice came out of the light: \"Keeper, four gates are left.\"",
      Y20: "Lucas went pale. \"She'll be back. And she won't be alone.\"",
      R1: "Snow. Banners. A wall of ice as high as the sky.", R2: "A knight in black armour looked down at you. \"Another keeper?\"", R3: "\"The gates are opening again,\" he said. \"That is never good.\"" },
      // Aufnahmen (31.10., werkzeuge/story_audio9.py): Erzähler Mr. Alex; wörtliche Rede Maya + Frau mit Kompass = Jessica, Jayden/Lucas/Ritter = Jeremy.
      audio: storyAudioDateien("ny", STORY_KEYS_NY) },
    route66: { id: "route66", titel: "The Lost Map – The Chase", kapitel: 2, welt: "Route 66",
      enden: { X: { symbol: "🗣️", name: "Bring the boy" }, Y: { symbol: "⏳", name: "A hundred miles of silence" } }, wege: { A: "🍟 diner", B: "🚗 keep driving", X: "🗣️ the truth – now", Y: "⏳ later" },
      gegenstand: { name: "Dragon Scale", symbol: "🐉" }, teile: {
      "1X": "The woman had the map now – and a head start.", "2X": "\"This is your fault,\" Maya said. You didn't answer.",
      "1Y": "The woman wanted the map back – and she was fast.", "2Y": "\"They'll follow us everywhere,\" Maya said. \"Great plan.\"",
      3: "Jayden rented a car. Orange, old and very loud.", 4: "Route 66. Two thousand miles of desert, diners and dust.", 5: "Then Lucas said something strange: \"My grandpa drove this road.\"",
      A6: "At a diner, Maya exploded: \"Lucas, what are you hiding?\"", A7: "Lucas looked at his plate. \"Nothing. Eat your fries.\"", A8: "Jayden tried a joke. Nobody laughed.",
      A9: "Through the window, you saw a black car. Waiting.", A10: "\"We have to go,\" you said. \"Now.\"",
      B6: "Lucas didn't want to stop. \"Keep driving. Please.\"", B7: "Maya turned around. \"Why? Who's following us?\"", B8: "A black car appeared in the mirror. Then another.",
      B9: "Jayden drove faster. The old car started to shake.", B10: "\"Hold on!\" he shouted. \"This is going to be fun!\"",
      11: "At a gas station, a huge truck blocked the road.", 12: "Big Rig Bob. Everybody on Route 66 knew that truck.",
      13: "The woman with the compass stepped out of it. \"Hello again.\"", 14: "Maya grabbed your arm. \"Whatever happens – we stay together.\"",
      X15: "You looked at Lucas. \"Tell us the truth. Now.\"", X16: "He took a deep breath. \"My grandpa was a keeper. Like you.\"",
      Y15: "You shook your head. \"Later. First we get past that truck.\"", Y16: "Lucas looked relieved. Maya looked angry.",
      X17: "The barrier went up. The woman didn't move.", X18: "\"A keeper's grandson,\" she said. \"How interesting.\"", X19: "Lucas went white. He had never told anyone.",
      X20: "\"Next stop,\" she smiled, \"the Grand Canyon. Bring the boy.\"",
      Y17: "The barrier went up, and Jayden hit the gas.", Y18: "In the mirror, the woman waved. She wasn't angry. She was waiting.", Y19: "Nobody spoke for a hundred miles.",
      Y20: "Finally Lucas whispered: \"At the Grand Canyon, I'll tell you everything.\"",
      R1: "The ice wall again – but now there was a door in it.", R2: "The knight was waiting. \"You came back. Keepers always do.\"", R3: "\"Beyond this door,\" he said, \"the dragon sleeps. Do not wake it.\"" },
      // Aufnahmen (vorbereitet, Dateien noch nicht da): Sprecherplan in werkzeuge/story_audio9.py (Maya + Frau = Jessica, Jayden/Lucas/Ritter = Jeremy, Spieler-Sätze = Erzähler)
      audio: storyAudioDateien("route66", STORY_KEYS_R66) },
    az: { id: "az", titel: "The Lost Map – Lucas' Secret", kapitel: 3, welt: "Grand Canyon",
      enden: { X: { symbol: "📓", name: "Lucas keeps the journal" }, Y: { symbol: "👜", name: "Maya keeps the journal" } }, wege: { A: "🐴 mule trail", B: "🌉 skywalk", X: "📓 give it to Lucas", Y: "👜 give it to Maya" },
      gegenstand: { name: "Golden Scale", symbol: "✨" }, teile: {
      "1X": "The woman knew Lucas's secret now. And she wanted him.", "2X": "\"Stay close to me,\" you told Lucas. He didn't like being watched.",
      "1Y": "Lucas kept his promise. At the Grand Canyon, he started talking.", "2Y": "\"My grandpa was a keeper,\" he said. \"And he lost the map here.\"",
      3: "The Grand Canyon was huge, red and silent. Jayden stopped joking.", 4: "Lucas pulled out an old journal. \"Grandpa's. He wrote everything down.\"",
      5: "\"Page one,\" he read. \"'Don't trust the woman with the compass.'\"",
      A6: "You followed the old mule trail down into the canyon.", A7: "Maya hated walking. \"My feet are killing me,\" she groaned.", A8: "Lucas kept on reading. \"'The gate is behind the waterfall.'\"",
      A9: "A rattling sound. Jayden froze. \"Was that a snake?\"", A10: "It was. A big one. With a sheriff's star.",
      B6: "You walked along the rim. Don't look down – really, don't!", B7: "Jayden was good at climbing. Maya was better at complaining.", B8: "On the glass bridge, Lucas stopped. \"Grandpa stood here. 1974.\"",
      B9: "Far below, something moved between the rocks.", B10: "Something with a star on its chest.",
      11: "Sheriff Rattlesnake blocked the way to the gate.", 12: "\"Nobody passes without my permission,\" he hissed.",
      13: "Behind him stood the woman. She was smiling again.", 14: "\"Give me the boy's journal,\" she said, \"and I'll let you through.\"",
      X15: "You gave the journal to Lucas. \"It's yours. Keep it safe.\"", X16: "Maya was not happy about trusting him. Not at all.",
      Y15: "You gave the journal to Maya. \"You've got the plan. Keep it.\"", Y16: "Lucas looked at the ground. He didn't say a word.",
      X17: "The gate opened. The woman looked at Lucas, not at you.", X18: "\"Your grandpa trusted me once,\" she said. \"He was wrong.\"", X19: "Lucas held the journal tight. \"I'm not my grandpa.\"",
      X20: "Jayden grinned. \"Next stop: Mount Rushmore. Four big heads!\"",
      Y17: "The gate opened. The woman looked at Maya for a long time.", Y18: "\"Smart girl,\" she said. \"Smart people make good deals.\"", Y19: "Maya put the journal in her bag. She didn't answer.",
      Y20: "Lucas whispered to you: \"Why didn't you trust me?\"",
      R1: "The door was open. Inside, a dragon slept on a mountain of gold.", R2: "The knight whispered: \"Stop breathing so loudly.\"", R3: "\"The dragon dreams of the five gates,\" he said. \"Don't wake it. Not yet.\"" },
      // Aufnahmen (vorbereitet, Dateien noch nicht da): Sprecherplan in werkzeuge/story_audio9.py (Maya + Frau = Jessica, Jayden/Lucas/Ritter/Sheriff = Jeremy, Spieler-Sätze und Erzähler = Mr. Alex)
      audio: storyAudioDateien("az", STORY_KEYS_AZ) },
  };
  const STORY_PUNKTE = { diamant: 1, ganz: 10, max: 30 };
  const STORY_KAPITEL = ["ny", "route66", "az"];   // gebaute Kapitel in Reihenfolge (Story Library)
  const REALM_KEYS = ["R1", "R2", "R3"];
  // Story-Option für die Engine: Text + Varianten aus früheren Kapiteln (Kapitel 2 liest die Wahl aus Kapitel 1: X = Karte gegeben, Y = behalten oder Kapitel 1 nicht gespielt;
  // Kapitel 3 liest die Wahl aus Kapitel 2: X = die Wahrheit jetzt, Y = später oder Kapitel 2 nicht gespielt)
  function storyOption(welt) {
    const S = STORY[welt]; if (!S) return null;
    const ny = storyStand("ny"), r66 = storyStand("route66");
    return Object.assign({}, S, { varianten: { "ny.g2": ny.wahl.g2 === "X" ? "X" : "Y", "route66.g2": r66.wahl.g2 === "X" ? "X" : "Y" } });
  }
  function storyStand(welt) {
    const r = runnerStand();
    if (!r.story || typeof r.story !== "object") r.story = {};
    const w = r.story[welt] && typeof r.story[welt] === "object" ? r.story[welt] : (r.story[welt] = {});
    if (!Array.isArray(w.enden)) w.enden = [];
    if (!Array.isArray(w.voll)) w.voll = [];
    if (!w.beste || typeof w.beste !== "object") w.beste = {};
    if (!w.wahl || typeof w.wahl !== "object") w.wahl = {};
    return w;
  }
  function realmStand(welt) {
    const r = runnerStand();
    if (!r.realm || typeof r.realm !== "object") r.realm = {};
    const w = r.realm[welt] && typeof r.realm[welt] === "object" ? r.realm[welt] : (r.realm[welt] = {});
    if (!Array.isArray(w.stuecke)) w.stuecke = [];
    w.gefunden = !!w.gefunden; w.gegenstand = !!w.gegenstand; w.kristalle = w.stuecke.length;
    return w;
  }
  // Erzähler: Aufnahme(n), falls vorhanden, sonst Geräte-Stimme (männlich); im Lauf hinter einer laufenden Wiedergabe, an Station/Film sofort
  const erzaehlerStimme = (text, o) => {
    const dateien = o && o.audio ? [].concat(o.audio) : [];
    const liste = dateien.length && dateien.every(Boolean) ? dateien : [{ text: text.replace(/[–—]/g, ","), stimme: "m" }];
    return spiele(liste, o && o.sofort ? {} : { warten: true });
  };
  const storyTexte = () => ({ stationWeiter: T("Weiter ▶", "Next ▶"), stationHinweis: T("🎙 Mr. Alex liest vor · Tippen = weiter", "🎙 Mr. Alex is reading · tap = next"),
    filmSkip: T("🎬 Tippen = überspringen", "🎬 Tap = skip"), filmWeiter: T("Tippen = weiter", "Tap = continue") });
  // Spiel: Eintritt abbuchen, Vollbild-Bühne ohne Kopfzeile, ✕ mit Rückfrage
  function runnerSpiel(k, unit, i, welt) {
    const sp = spielstand(), r = runnerStand(), ws = runnerWoerter(unit, i), W = runnerWeltVon(welt);
    if (!runnerWeltOffen(W)) return runnerStart(k);
    if (!R()) { toast(T("Das Spiel ist noch nicht geladen.", "The game is not loaded yet.")); return; }
    if (ws.length < 4) return runnerStart(k);
    if (!(r.tickets > 0)) { toast(T("Kauf erst ein Ticket im Shop.", "Buy a ticket in the shop first.")); return shop({ zurueck: () => runnerStart(k), artikel: "runner" }); }
    r.tickets--; r.gespielt++; speichern();
    toast(T("🎟️ Ticket eingelöst", "🎟️ Ticket used"));
    ansicht = null; lage = null;
    const buehne = el("div", { class: "runner-buehne" });
    const abbruch = knopf("✕", () => {
      if (R().ueberspringen && R().ueberspringen()) return; // Story: im Film am Ende überspringt ✕ nur den Film (das Ergebnis bleibt)
      frage(T("Abbrechen? Das Ticket ist weg.", "Quit? Your ticket is gone."), T("Abbrechen", "Quit"), T("Weiterspielen", "Keep playing")).then((ok) => { if (ok) runnerStart(k); });
    }, "runner-x");
    abbruch.setAttribute("aria-label", T("Spiel abbrechen", "Quit game"));
    zeige(buehne, abbruch);
    document.body.classList.add("runner-aktiv");
    runnerLauf = R().start({
      wrapper: buehne, skin: skinWirksam(), welt: W.id, story: storyOption(W.id), // Story-Modus in New York (Kapitel 1), Route 66 (Kapitel 2) und Grand Canyon (Kapitel 3, je mit Variante aus dem Vorkapitel); andere Welten wie bisher
      woerter: ws.map((v) => ({ en: spielWort(v), de: v.de })),
      texte: Object.assign(storyTexte(), {
        quer: T("Tipp: Handy quer halten 📱↔", "Tip: turn your phone sideways 📱↔"),
        tor: (de) => T(`Welcher Diamant heißt „${de}“?`, `Which diamond means “${de}”?`), richtigWaere: T(" – richtig wäre: ", " – correct: "),
        sequenz: T("Zwischensequenz …", "Cutscene …"), boss: T("Boss! Beantworte die Frage.", "Boss! Answer the question."),
        bossTitel: T(`${W.boss} fragt …`, `${W.boss} asks …`), bossHinweis: W.id === "route66" ? T("Richtig = der Schlagbaum geht hoch. Falsch = ein Leben weg.", "Right = the barrier lifts. Wrong = you lose a life.") : W.id === "ca" ? T("Richtig = das Brückentor geht auf. Falsch = ein Leben weg.", "Right = the bridge gate opens. Wrong = you lose a life.") : W.id === "sd" ? T("Richtig = das Ranger-Tor geht auf. Falsch = ein Leben weg.", "Right = the ranger gate opens. Wrong = you lose a life.") : W.id === "az" ? T("Richtig = das Holztor geht auf. Falsch = ein Leben weg.", "Right = the wooden gate opens. Wrong = you lose a life.") : T("Richtig = die Tür geht auf. Falsch = ein Leben weg.", "Right = the door opens. Wrong = you lose a life."),
        frage: (de) => T(`„Was heißt ‚${de}‘ auf Englisch?“`, `“What's ‘${de}’ in English?”`),
      }),
      // wort(j, { leise: true }) = Echo im Spiel: leiser (0,6) und hinter einer laufenden Wiedergabe, statt sie abzuschneiden
      // Aufnahmen der Welt (Boss-Banner/-Sprüche Mr. Alex, Levelstart Jeremy); fehlt eine Datei, spricht die Geräte-Stimme
      audio: runnerAudio(W.id),
      stimme: { wort: (j, o) => spiele([tonWort(ws[j % ws.length])], o && o.leise ? { laut: 0.6, warten: true } : o && o.warten ? { warten: true } : {}),
        erzaehler: erzaehlerStimme, still: () => stopp(),
        boss: (text, o) => spiele([(o && o.audio) || { text, stimme: "m" }]),
        ansage: (text, o) => spiele([(o && o.audio) || { text, stimme: "m" }], { warten: true }) },
      onEnde: (e) => runnerEnde(k, unit, i, e, ws, W.id),
    });
  }
  // Aufnahmen je Welt aus dem Bau (D.spiel.runner_audio) und Levelende-Text der Engine („You made it to …!“)
  const runnerAudio = (id) => (SP.runner_audio && SP.runner_audio[id]) || null;
  const runnerEndeText = (W) => { const rw = ((R() && R().WELTEN) || []).find((x) => x.id === W.id); return (rw && rw.ende) || `You made it to the ${W.ziel}!`; };
  // Ende: Trophäe + Titel speichern (nur bei Erfolg), Wortliste mit 🔊, noch mal (wieder 100) oder Startseite
  function runnerEnde(k, unit, i, e, ws, welt) {
    const r = runnerStand(), W = runnerWeltVon(welt), naechsteWelt = RUNNER.welten[RUNNER.welten.indexOf(W) + 1];
    let stufe = null, neuOffen = false, storyPunkte = 0, storyNeuFrei = false, realmNeu = false;
    const rm = e.story && e.story.realm;
    if (rm && rm.gefunden) { // verstecktes Tor ✦: Fund, R-Stücke und Frost Shard bleiben (auch bei Game over – keine Punkte)
      const rs = realmStand(W.id); realmNeu = !rs.gefunden;
      rs.gefunden = true; rs.stuecke = REALM_KEYS.filter((k) => rs.stuecke.includes(k) || (rm.stuecke || []).includes(k)); rs.kristalle = rs.stuecke.length;
      if (rm.gegenstand) rs.gegenstand = true;
    }
    if (e.geschafft) {
      r.geschafft++;
      stufe = e.diamanten >= e.max && e.toreRichtig >= 2 ? "gold" : "silber";
      neuOffen = !r.level[W.id] && !!naechsteWelt && !naechsteWelt.bald;
      if (stufe === "gold" || !r.level[W.id]) r.level[W.id] = stufe;
      if (e.story && e.story.ende) { // Story: Ende freigespielt, beste ♪-Zahl je Ende, letzte Wahl (für Kapitel 2), Punkte (nur bei geschafftem Level)
        const st = storyStand(W.id), en = e.story.ende;
        if (!st.enden.includes(en)) { st.enden.push(en); storyNeuFrei = true; }
        st.beste[en] = Math.max(st.beste[en] || 0, e.story.anzahl);
        st.wahl = Object.assign({}, st.wahl, e.story.wahl || {});
        const dia = Math.max(0, e.punkteDiamanten || 0) * STORY_PUNKTE.diamant;
        const ganz = e.story.vollstaendig && !st.voll.includes(en) ? STORY_PUNKTE.ganz : 0;
        if (e.story.vollstaendig && !st.voll.includes(en)) st.voll.push(en);
        storyPunkte = Math.min(STORY_PUNKTE.max, dia + ganz);
        if (dia > 0) ereignisse.push({ art: "toast", text: T(`+${dia} ⭐ Diamanten`, `+${dia} ⭐ diamonds`) });
        if (ganz > 0) ereignisse.push({ art: "toast", text: T(`📖 Ganze Geschichte +${ganz}`, `📖 Whole story +${ganz}`) });
      }
      const t = runnerTitelIndex(r.geschafft);
      if (t > (r.titel || 0)) {
        r.titel = t;
        const name = runnerTitelName(t);
        ereignisse.push({ art: "feier", symbol: t === RUNNER.titel.length ? "👑" : "🏃", titel: `Runner: ${name}`,
          text: T(`Neuer Runner-Titel: ${name}!`, `New runner title: ${name}!`), ton: waehleRuf("stark") });
      }
    }
    if (storyPunkte > 0) { mrAlexWacht(spielstand(), storyPunkte); punkteDazu(storyPunkte); } // Zeitlog zuerst, damit Farmen im Road Trip Run auffällt
    speichern();
    const ruf = waehleRuf(e.geschafft ? "stark" : "fehler");
    const S = STORY[welt] || {}, sEnde = e.story && e.story.ende && S.enden ? S.enden[e.story.ende] : null, wahl = (e.story && e.story.wahl) || {}, wege = S.wege || {}, gs = S.gegenstand || { name: "Frost Shard", symbol: "❄" };
    const minuten = `${Math.floor(e.dauer / 60)}:${String(e.dauer % 60).padStart(2, "0")}`;
    const zeichne = () => {
      zeige(spielKopf(k, "Road Trip Run", () => runnerStart(k)),
        el("section", { class: (e.geschafft ? "geschafft" : "satzkarte") + " runner-ende" },
          el("div", { class: "runner-pokal", "aria-hidden": "true" }, e.geschafft ? (stufe === "gold" ? "🥇" : "🥈") : "💤"),
          el("h2", { lang: "en" }, e.geschafft ? "Level complete!" : "Game over"),
          ruf && el("p", { class: "gym-lob" }, el("strong", { lang: "en" }, ruf.text), !E() && ruf.de && el("span", { lang: "de" }, " – " + ruf.de)),
          e.geschafft ? el("p", { lang: "en" }, runnerEndeText(W))
            : el("p", {}, T("Keine Leben mehr. Die Wörter hast du trotzdem gesehen – beim nächsten Mal klappt es!", "No lives left. You still saw the words – next time you'll make it!")),
          el("p", {}, `💎 ${e.diamanten} / ${e.max} · ❤️ ${e.leben} · ⏱ ${minuten}`),
          e.story && el("p", { class: "runner-story-ende" }, `♪ ${e.story.anzahl}/${e.story.max || 20} `, T("Geschichte", "story"),
            sEnde ? ` · 📖 Ending ${e.story.ende} – ${sEnde.symbol} ${sEnde.name}` : "", e.story.vollstaendig ? T(" · ✓ ganze Geschichte", " · ✓ whole story") : ""),
          e.story && (wahl.g1 || wahl.g2) && el("p", { class: "klein runner-story-wege", lang: "en" }, T("Deine Wege: ", "Your paths: "),
            [wahl.g1 && `${wahl.g1} ${wege[wahl.g1] || ""}`, wahl.g2 && `${wahl.g2} ${wege[wahl.g2] || ""}`].filter(Boolean).join(" · ")),
          rm && rm.gefunden && el("p", { class: "runner-realm-ende" }, `✦ The Realm Beyond – ${T("gefunden", "found")}! ✦ ${rm.kristalle}/3`, rm.gegenstand ? ` · ${gs.symbol} ${gs.name}` : ""),
          e.story && el("p", { class: "runner-story-punkte" }, e.geschafft
            ? T(`⭐ Punkte in diesem Lauf: ${storyPunkte}`, `⭐ Points in this run: ${storyPunkte}`) + (storyPunkte >= STORY_PUNKTE.max ? T(" (höchstens 30)", " (max. 30)") : "")
            : T("⭐ Punkte gibt es nur, wenn du das Level schaffst.", "⭐ You only get points if you finish the level.")),
          storyNeuFrei && el("p", { class: "runner-neu-offen" }, T(`📖 Neu in der Story Library: Ending ${e.story.ende}!`, `📖 New in the Story Library: Ending ${e.story.ende}!`)),
          realmNeu && el("p", { class: "runner-neu-offen" }, T("✦ Neu in der Story Library: The Realm Beyond!", "✦ New in the Story Library: The Realm Beyond!")),
          e.maxCombo > 0 && el("p", { class: "klein runner-serie" }, T(`🔥 Beste Serie: ×${e.maxCombo}`, `🔥 Best streak: ×${e.maxCombo}`)),
          e.geschafft && el("p", {}, el("strong", {}, `🏆 ${W.trophaee} – ${stufe === "gold" ? "Gold" : T("Silber", "Silver")}`),
            stufe !== "gold" ? T(" (Gold: alle Diamanten und beide Tore richtig)", " (gold: all diamonds and both gates right)") : ""),
          neuOffen && el("p", { class: "runner-neu-offen" }, `🔓 ${T(`Neue Welt frei: ${naechsteWelt.symbol} ${naechsteWelt.name} (${naechsteWelt.staat})!`, `New world unlocked: ${naechsteWelt.symbol} ${naechsteWelt.name} (${naechsteWelt.staat})!`)}`),
          el("p", { class: "klein" }, `🏃 ${T("Runner-Titel", "Runner title")}: ${runnerTitelName(r.titel) || "–"} · ${r.geschafft} ${T("Level geschafft", "levels done")}`)),
        el("section", { class: "satzkarte" },
          el("h2", {}, T("Die Wörter", "The words")),
          el("ul", { class: "wortliste runner-woerterliste" }, ws.map((v) => el("li", {},
            knopf("🔊", () => spiele([tonWort(v)]), "leise"), " ", el("strong", { lang: "en" }, spielWort(v)), " – ", el("span", { lang: "de" }, v.de))))),
        el("div", { class: "knopfreihe" },
          (r.tickets || 0) > 0 ? knopf(`↻ ${T("Noch mal", "Again")} (🎟️ 1)`, () => runnerSpiel(k, unit, i, W.id), "haupt")
            : knopf(T(`🎟️ Erst Ticket kaufen – ${RUNNER.preis} 🪙`, `🎟️ Buy a ticket first – ${RUNNER.preis} 🪙`), () => shop({ zurueck: () => runnerStart(k), artikel: "runner" }), "haupt"),
          knopf(T("Zur Startseite", "Home"), startseite, "leise")));
    };
    ansicht = zeichne; lage = null; zeichne();
    setTimeout(zeigeEreignisse, 50);
    // Levelende-Ansage (Jessica) vor dem Lob; bei einer Feier (neuer Titel) spricht die Feier
    const endeTon = e.geschafft ? ((runnerAudio(W.id) || {}).ende || { text: runnerEndeText(W), stimme: "f" }) : null;
    if (!ereignisse.some(grossEreignis) && (endeTon || (ruf && ruf.audio))) spiele([endeTon, ruf && ruf.audio]);
  }
  // Hall of Fame: Abschnitt in der Sammlung
  function runnerSammlung() {
    const r = runnerStand(), naechste = RUNNER.ab[r.titel || 0];
    return el("section", { class: "satzkarte runner-sammlung" },
      el("h2", {}, "🏃 Road Trip Run"),
      el("p", {}, `${T("Runner-Titel", "Runner title")}: `, el("strong", { lang: "en" }, runnerTitelName(r.titel) || T("noch keiner", "none yet")),
        ` · ${r.geschafft} ${T("Level geschafft", "levels done")} · ${r.gespielt} ${T("Spiele", "games")}`),
      naechste && el("p", { class: "klein" }, T(`Noch ${naechste - r.geschafft} geschaffte Level bis „${RUNNER.titel[r.titel || 0]}“`, `${naechste - r.geschafft} more levels to “${RUNNER.titel[r.titel || 0]}”`)),
      el("ul", { class: "abzeichen runner-trophaeen" }, RUNNER.welten.map((w) => {
        const st = r.level[w.id];
        return el("li", { class: st ? "ok" : "", "data-welt": w.id },
          el("span", { "aria-hidden": "true" }, st === "gold" ? "🥇" : st === "silber" ? "🥈" : w.bald ? "🔒" : "🏆"),
          el("span", { lang: "en" }, w.trophaee, el("small", {}, ` · ${w.staat}${w.bald ? T(" (bald)", " (soon)") : ""}`)),
          el("span", { class: "unsichtbar" }, st ? "✓" : "–"));
      })),
      storyLibrary(),
      el("div", { class: "knopfreihe" }, knopf("🏃 Road Trip Run", () => runnerStart(), "leise")));
  }
  // 📖 Story Library, Übersicht nach Kapiteln (STORY_KAPITEL): je Kapitel die freigespielten Enden als Filme (Tap = Film mit der eigenen Figur), nicht freigespielte 🔒;
  // dazu die Karte „✦ The Realm Beyond“ des Kapitels (gefundene R-Stücke, Sammelstück: Frost Shard ❄ / Dragon Scale 🐉 / Golden Scale ✨)
  function storyLibrary() {
    const kapitel = STORY_KAPITEL.map((welt) => {
      const st = storyStand(welt), S = STORY[welt], rs = realmStand(welt), gs = S.gegenstand;
      const realmKarte = rs.gefunden
        ? el("div", { class: "story-karte realm-karte", "data-realm": welt, "data-welt": welt },
          el("span", { class: "story-sym", "aria-hidden": "true" }, "✦"),
          el("strong", { lang: "en" }, "✦ The Realm Beyond"),
          el("small", {}, `✦ ${rs.stuecke.length}/3 · ${rs.gegenstand ? `${gs.symbol} ${gs.name}` : T(`${gs.symbol} ${gs.name} noch nicht gefunden`, `${gs.symbol} ${gs.name} not found yet`)}`),
          el("ul", { class: "realm-stuecke", lang: "en" }, REALM_KEYS.map((k) => el("li", { class: rs.stuecke.includes(k) ? "ok" : "" }, rs.stuecke.includes(k) ? S.teile[k] : "…"))))
        : el("div", { class: "story-karte gesperrt realm-karte", "data-realm": welt, "data-welt": welt }, el("span", { class: "story-sym", "aria-hidden": "true" }, "🔒"),
          el("strong", { lang: "en" }, "✦ ??? – a hidden gate somewhere …"));
      return el("div", { class: "story-kapitel", "data-welt": welt },
        el("p", { class: "klein", lang: "en" }, `Chapter ${S.kapitel} · ${S.welt} · ${S.titel}`),
        el("div", { class: "story-karten" }, ["X", "Y"].map((en) => {
          const frei = st.enden.includes(en), E_ = S.enden[en];
          if (!frei) return el("div", { class: "story-karte gesperrt", "data-ende": en, "data-welt": welt }, el("span", { class: "story-sym", "aria-hidden": "true" }, "🔒"), el("strong", { lang: "en" }, "Ending ? – find another way!"));
          return el("button", { class: "story-karte", type: "button", "data-ende": en, "data-welt": welt, onclick: () => storyFilm(welt, en) },
            el("span", { class: "story-sym", "aria-hidden": "true" }, E_.symbol),
            el("strong", { lang: "en" }, `Ending ${en} – ${E_.name}`),
            el("small", {}, `♪ ${st.beste[en] || 0}/20${st.voll.includes(en) ? T(" · ✓ ganze Geschichte", " · ✓ whole story") : ""} · ▶ ${T("Film", "film")}`));
        }).concat([realmKarte])));
    });
    return el("div", { class: "story-library" }, el("h3", {}, "📖 Story Library"), kapitel);
  }
  function storyFilm(welt, ende) {
    if (!R() || !R().film) { toast(T("Das Spiel ist noch nicht geladen.", "The game is not loaded yet.")); return; }
    lage = null; ansicht = null;
    const buehne = el("div", { class: "runner-buehne" });
    const zu = knopf("✕", () => sammlung(), "runner-x");
    zu.setAttribute("aria-label", T("Film schließen", "Close film"));
    zeige(buehne, zu);
    document.body.classList.add("runner-aktiv");
    runnerLauf = R().film({ wrapper: buehne, welt, skin: skinWirksam(), ende, story: STORY[welt], titel: "Story Library", texte: storyTexte(),
      stimme: { erzaehler: erzaehlerStimme, still: () => stopp() }, onEnde: () => sammlung() });
  }
  // Figur-Seite (Fassung 29.10.): Figur + Erklärtext oben (sticky), Reiter-Zeile, darunter die Optionen der Gruppe als Chips, unten feste Knopfzeile.
  // Auswahl und Reiterwechsel zeichnen NICHT die Seite neu (kein Scrollsprung): nur Vorschau + Chips bzw. der Options-Bereich werden aktualisiert.
  const SKIN_SYMBOL = { haar: "💇", haarfarbe: "🎨", haarschmuck: "🎀", hut: { keiner: "🚫", cap: "🧢", cowboy: "🤠", zylinder: "🎩" }, brille: "🕶️", bart: "🥸", nase: "👃",
    top: { shirt: "👕", hoodie: "🧥" }, topfarbe: "🎨", schuhe: { rollschuhe: "🛼" }, schmuck: { keiner: "🚫", ohrring: "💎", kette: "📿", beides: "💍" }, hals: "🦒", bauch: "🫃", brust: "🧍", muskeln: "💪", fuesse: "🦶", power: "⚡", aura: "✨",
    rucksack: { keiner: "🚫", blau: "🎒", rot: "🎒", regenbogen: "🌈" }, handschuhe: { keine: "🚫", "weiß": "🧤", schwarz: "🧤", boxhandschuhe: "🥊" } }; // Extras (Entwurf 30.10.); Schuhfarben bleiben Farbpunkte, Rollschuhe als Symbol
  const SKIN_FARBOPTION = { haarfarbe: 1, topfarbe: 1, schuhe: 1 }; // Farben als runde Farbpunkte (Haarfarben aus HAARFARBEN, Regenbogen als Verlauf)
  const skinFarbe = (M, key, w) => { const f = key === "haarfarbe" ? M.HAARFARBEN[w] : M.FARBEN[w]; return f === "regenbogen" ? "linear-gradient(180deg,#ff2d2d,#ff9f1a,#ffe21a,#2ecc71,#2a8cff,#9b4dff)" : f; };
  function runnerSkins(k) {
    k = k || spieleKategorie();
    lage = null; ansicht = () => runnerSkins(k);
    const sp = spielstand(), M = R();
    runnerStand();
    if (!M) { zeige(spielKopf(k, T("Figur", "Character"), () => runnerStart(k)), el("p", {}, T("Das Spiel ist noch nicht geladen.", "The game is not loaded yet."))); return; }
    let gruppe = M.SKIN_GRUPPEN.find((g) => g.id === skinTab) || M.SKIN_GRUPPEN[0];
    const breit = Math.max(96, Math.min(150, Math.floor((app.clientWidth - 40) * 0.4))), vorschau = figurVorschau(breit, Math.round(breit * 1.27));
    const bereich = el("div", { class: "runner-skin-optionen" });
    const zumShop = (artikel) => shop({ zurueck: () => runnerSkins(k), artikel });
    const symbol = (o, w) => { const sy = SKIN_SYMBOL[o.key]; return typeof sy === "object" ? sy[w] || "" : sy || ""; };
    // Chips der angezeigten Gruppe nachziehen (aktiv/✓), ohne Neuaufbau – auch nach dem Power-Schalter (ändert die wirksamen Muskeln)
    const markiere = () => {
      const w = skinWirksam();
      for (const b of bereich.querySelectorAll(".runner-wert")) {
        const aktiv = w[b.dataset.key] === b.dataset.wert;
        b.classList.toggle("aktiv", aktiv); b.classList.toggle("haupt", aktiv); b.setAttribute("aria-pressed", String(aktiv));
        b.querySelector(".haken").textContent = aktiv ? "✓ " : "";
      }
    };
    const waehle = (o, w) => { skinSetzen(o.key, w); markiere(); vorschau.neuMalen(); spiele([{ text: M.sprechText(skinWirksam(), o.key, w), stimme: "m" }]); };
    const chip = (o, w) => {
      const frei = skinFrei(o.key, w), farbe = SKIN_FARBOPTION[o.key] && skinFarbe(M, o.key, w), preis = M.skinPreis(o.key, w);
      return el("button", { class: "knopf runner-wert" + (frei ? "" : " gesperrt"), "aria-pressed": "false", "data-skin": `${o.key}_${w}`, "data-key": o.key, "data-wert": w,
        onclick: () => (frei ? waehle(o, w) : zumShop(M.skinArtikel(o.key, w))) },
        el("span", { class: "haken", "aria-hidden": "true" }),
        !frei && el("span", { "aria-hidden": "true" }, "🔒 "),
        farbe ? el("span", { class: "farbpunkt", style: `background:${farbe}`, "aria-hidden": "true" }) : el("span", { class: "sym", "aria-hidden": "true" }, symbol(o, w)),
        tx2(o.namen[w]), !frei && el("span", { class: "preis" }, ` · ${preis} 🪙`));
    };
    const zeichneGruppe = () => {
      bereich.replaceChildren(...gruppe.optionen.map((o) => el("div", { class: "runner-option", "data-option": o.key },
        el("h3", {}, tx2(o.label)),
        el("div", { class: "runner-werte" }, o.werte.map((w) => chip(o, w))),
        o.key === "power" && el("p", { class: "klein" }, T(`Mit deinem Punkte-Titel (Stufe ${sp.titel} von 5) werden die Muskeln von selbst stärker, ab Stufe 4 mit kleiner Aura. Die Muskeln kannst du trotzdem von Hand umstellen.`,
          `With your points title (level ${sp.titel} of 5) the muscles grow by themselves, from level 4 with a small aura. You can still set the muscles by hand.`)))));
      markiere();
    };
    const tabs = el("div", { class: "reiter runner-tabs", role: "tablist" }, M.SKIN_GRUPPEN.map((g) =>
      el("button", { class: "reiter-knopf", role: "tab", "aria-selected": String(g.id === gruppe.id), "data-gruppe": g.id, onclick: (e) => {
        skinTab = g.id; gruppe = g;
        for (const t of tabs.children) t.setAttribute("aria-selected", String(t === e.currentTarget));
        e.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" }); // nur die Reiter-Zeile, kein Seitensprung
        zeichneGruppe();
      } }, `${g.symbol} ${tx2(g.titel)}`)));
    zeichneGruppe();
    const kopf = el("div", { class: "runner-skin-kopf" }, vorschau,
          el("div", { class: "runner-skin-text" },
            el("p", {}, T("Die Grundausstattung ist frei.", "The basics are free.")),
            el("p", {}, T(`Weitere Teile (🔒) gibt es im Shop für ${RUNNER.skinPreis} 🪙, Ausgefallenes für ${RUNNER.skinPreisTeuer} 🪙.`, `More parts (🔒) are in the shop for ${RUNNER.skinPreis} 🪙, special ones for ${RUNNER.skinPreisTeuer} 🪙.`)),
            el("p", {}, T(`⚡ Power-Körper: Muskeln wachsen mit deinem Punkte-Titel (Stufe ${sp.titel} von 5).`, `⚡ Power body: muscles grow with your points title (level ${sp.titel} of 5).`))));
    zeige(spielKopf(k, T("Figur", "Character"), () => runnerStart(k)),
      el("section", { class: "satzkarte runner-skins" }, kopf, tabs, bereich,
        el("div", { class: "knopfreihe runner-skin-fuss" }, knopf(T("✓ Fertig – zum Spiel", "✓ Done – to the game"), () => runnerStart(k), "haupt"), knopf("🛍️ Shop", () => zumShop()))));
    const leiste = document.querySelector(".niveau-leiste"); // Kopf klebt genau unter der blauen Leiste (Höhe je nach Knöpfen 60–64 px)
    if (leiste) kopf.style.setProperty("--leiste-h", leiste.offsetHeight + "px");
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

  // Lehrer-Reset (30.10.2026, Mr. Alex): 3 Sekunden auf den App-Titel drücken → Lehrer-PIN → Punkte und Coins dieses Geräts neu setzen (gesiegelt).
  // Im Code steht nur ein langsamer Prüfwert (PBKDF2-SHA-256, 150 000 Runden), nicht die PIN. Nach 3 falschen Versuchen 10 Minuten Pause.
  // Erledigte Teile, Power Up, Hausaufgaben, Käufe und Einstellungen bleiben unverändert.
  const LEHRER = { salz: "f36909248b9e55ac30d93112e0bbb706", pruef: "c7a35a7644e9ddf6422f57ace070e9275cd34740d2e886691f6d245ee670156e", runden: 150000, ziel: "header.gruss h1, .niveau-name" };
  async function lehrerPinOk(pin) {
    try {
      const bytes = new Uint8Array(LEHRER.salz.match(/../g).map((b) => parseInt(b, 16)));
      const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"]);
      const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: bytes, iterations: LEHRER.runden }, k, 256);
      return Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, "0")).join("") === LEHRER.pruef;
    } catch (e) { return false; }
  }
  const lehrerDialog = el("dialog", { class: "feier frage lehrer" });
  document.body.append(lehrerDialog);
  const lehrerZu = () => { lehrerDialog.close(); if (stand.spiel && stand.spiel.gesperrt) setTimeout(sperreZeigen, 50); };
  const lehrerFenster = (...inhalt) => { lehrerDialog.replaceChildren(...inhalt.filter(Boolean)); if (!lehrerDialog.open) lehrerDialog.showModal(); };
  const lehrerLies = () => { try { return JSON.parse(localStorage.getItem(SPEICHER + "-l") || "{}") || {}; } catch (e) { return {}; } };
  const lehrerSchreib = (o) => { try { localStorage.setItem(SPEICHER + "-l", JSON.stringify(o)); } catch (e) { /* egal */ } };
  function lehrerStart() {
    const sperre = lehrerLies();
    if (sperre.bis && Date.now() < sperre.bis) {
      lehrerFenster(el("h2", {}, "👩‍🏫 Lehrer-Bereich"), el("p", {}, `🔒 Zu viele falsche Versuche. Bitte in ${Math.ceil((sperre.bis - Date.now()) / 60000)} Minuten noch einmal.`),
        el("div", { class: "knopfreihe" }, knopf("OK", lehrerZu, "haupt")));
      return;
    }
    const feld = el("input", { type: "password", inputmode: "numeric", autocomplete: "off", maxlength: "6", class: "lehrer-pin", "aria-label": "Lehrer-PIN" });
    const info = el("p", { class: "klein lehrer-info" }, "");
    let laeuft = false;
    const pruefen = async () => {
      if (laeuft) return;
      laeuft = true; info.textContent = "Prüfe …";
      const ok = await lehrerPinOk(feld.value.trim());
      laeuft = false;
      if (ok) { lehrerSchreib({}); lehrerReset(); return; }
      const s = lehrerLies(), n = (s.n || 0) + 1;
      lehrerSchreib(n >= 3 ? { n: 0, bis: Date.now() + 10 * 60000 } : { n });
      if (n >= 3) { lehrerStart(); return; }
      info.textContent = `Falsche PIN (${n} von 3).`; feld.value = ""; feld.focus();
    };
    feld.addEventListener("keydown", (e) => { if (e.key === "Enter") pruefen(); });
    lehrerFenster(el("h2", {}, "👩‍🏫 Lehrer-Bereich"), el("p", {}, "Lehrer-PIN eingeben:"), feld, info,
      el("div", { class: "knopfreihe" }, knopf("Weiter", pruefen, "haupt"), knopf("Abbrechen", lehrerZu, "leise")));
    feld.focus();
  }
  function lehrerReset() {
    const sp = spielstand();
    const zahl = (wert, name) => el("input", { type: "number", min: "0", step: "1", inputmode: "numeric", value: String(wert), "aria-label": name, class: "lehrer-zahl" });
    const p = zahl(sp.punkte, "Punkte"), c = zahl(sp.coins, "Coins");
    const zeile = (text, feld) => el("label", { class: "lehrer-zeile" }, el("span", {}, text), feld);
    const zwei = (n) => String(n).padStart(2, "0");
    const warnungen = (Array.isArray(sp.warnungen) ? sp.warnungen : []).slice(-8).reverse().map((t) => { const d = new Date(t); return `${d.getDate()}.${d.getMonth() + 1}. ${zwei(d.getHours())}:${zwei(d.getMinutes())}`; });
    const gesperrt = !!sp.gesperrt;
    const sichern = () => {
      const np = Math.max(0, Math.floor(Number(p.value) || 0)), nc = Math.max(0, Math.floor(Number(c.value) || 0));
      sp.punkte = np; sp.coins = nc; sp.titel = titelIndex(np);
      delete sp.gesperrt; delete sp.pauseBis; sp.log = []; // Speichern im Lehrer-Bereich schaltet die App wieder frei
      speichern(); lehrerZu();
      toast(`👩‍🏫 Gespeichert: ⭐ ${np} · 🪙 ${nc}`);
      if (!beschaeftigt()) startseite();
    };
    lehrerFenster(el("h2", {}, "👩‍🏫 Spielstand ändern"),
      el("p", { class: "klein" }, "Gilt nur für dieses Gerät. Erledigte Teile, Hausaufgaben, Käufe und Einstellungen bleiben."),
      zeile("⭐ Punkte", p), zeile("🪙 Coins", c),
      el("p", { class: "klein lehrer-wache" }, warnungen.length ? `👀 Warnungen „Mr. Alex is watching you“ (${(sp.warnungen || []).length}): ${warnungen.join(" · ")}` : "👀 Keine Warnungen „Mr. Alex is watching you“."),
      gesperrt && el("p", { class: "lehrer-sperre" }, "🔒 Die App ist gesperrt (zu viele Punkte in zu kurzer Zeit). „Speichern“ schaltet sie wieder frei – die Punkte oben kannst du vorher anpassen."),
      el("div", { class: "knopfreihe" }, knopf("Coins auf 0", () => { c.value = "0"; }, "leise"), knopf("Punkte auf 0", () => { p.value = "0"; }, "leise")),
      el("div", { class: "knopfreihe" }, knopf("Speichern", sichern, "haupt"), knopf("Abbrechen", lehrerZu, "leise")));
  }
  let lehrerUhr = null;
  document.addEventListener("pointerdown", (e) => {
    if (!(e.target && e.target.closest && e.target.closest(LEHRER.ziel))) return;
    clearTimeout(lehrerUhr); lehrerUhr = setTimeout(lehrerStart, 3000);
  });
  for (const art of ["pointerup", "pointercancel", "scroll"]) document.addEventListener(art, () => clearTimeout(lehrerUhr), true);
  document.addEventListener("contextmenu", (e) => { if (e.target && e.target.closest && e.target.closest(LEHRER.ziel)) e.preventDefault(); });

  // Updates (30.10.2026, Mr. Alex): Die App sucht beim Start, beim Zurückkommen aus dem Hintergrund und alle 15 Minuten nach einer neuen Version.
  // Kommt eine neue Version während einer Übung, erscheint der Hinweis erst danach (nichts geht verloren); sonst sofort ein Pop-up „Jetzt aktualisieren“,
  // das man nicht wegdrücken kann. War die App länger als 1 Stunde offen, lädt sie beim Zurückkommen neu (wenn gerade keine Übung läuft).
  const GELADEN = Date.now(), STUNDE = 3600 * 1000;
  const beschaeftigt = () => !!lage || !!runnerLauf;
  let neueVersion = false, updateGezeigt = false;
  const updateDialog = el("dialog", { class: "feier frage update" });
  updateDialog.addEventListener("cancel", (e) => e.preventDefault());
  document.body.append(updateDialog);
  function updateHinweis() {
    if (!neueVersion || updateGezeigt || beschaeftigt()) return;
    updateGezeigt = true;
    updateDialog.replaceChildren(el("div", { class: "feier-symbol", "aria-hidden": "true" }, "🔄"), el("h2", {}, "New version"),
      el("p", {}, "Es gibt eine neue Version der App. Dein Fortschritt ist gespeichert. Tippe auf „Update now“."),
      el("div", { class: "knopfreihe" }, knopf("🔄 Update now", () => location.reload(), "haupt")));
    if (lehrerDialog.open) lehrerDialog.close();
    updateDialog.showModal();
  }
  setInterval(updateHinweis, 3000);
  setTimeout(sperreZeigen, 300); // gesperrt geblieben (auch nach Neuladen)
  if (LOKAL) window.__updateTest = () => { neueVersion = true; updateHinweis(); }; // nur für Tests: tut so, als wäre eine neue Version da

  // Offline-Speicher (nur über eine Webadresse)
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    // Neue Version veröffentlicht? Direkt nach dem Start einfach neu laden (wie bisher), später erst das Pop-up (siehe updateHinweis).
    let hatteVersion = !!navigator.serviceWorker.controller, swReg = null, neuGeladen = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hatteVersion) { hatteVersion = true; return; } // allererste Installation: nichts zu tun
      if (Date.now() - GELADEN < 8000 && !beschaeftigt()) { if (!neuGeladen) { neuGeladen = true; location.reload(); } return; }
      neueVersion = true; updateHinweis();
    });
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" })
      .then((r) => { swReg = r; return r.update(); })
      .catch(() => { /* ohne Offline-Speicher geht es trotzdem */ });
    const suchen = () => { if (swReg && navigator.onLine !== false) swReg.update().catch(() => { /* offline: später */ }); };
    setInterval(() => { if (document.visibilityState === "visible") suchen(); }, 15 * 60 * 1000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - GELADEN > STUNDE && !beschaeftigt()) { location.reload(); return; }
      suchen();
    });
  }
})();
