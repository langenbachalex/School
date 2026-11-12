/* English Power Game
   Kein Konto, keine Namen. Fortschritt und Fragen bleiben nur auf diesem Gerät (localStorage).
   Grundsatz: Wird eine Lösung gezeigt, wird sie auch abgespielt. */
(function () {
  "use strict";

  const D = window.DATEN;
  const app = document.getElementById("app");
  const SPEICHER = "auffrischen-v1";
  // Test-Haken (window.__heute, __catchTempo, __patrolTempo, __updateTest) gibt es nur im Test-Build: TESTBUILD setzt das Build-Skript
  // (werkzeuge/daten_bauen.py bzw. klasse9_bauen.py, Schalter --test); der veröffentlichte Build hat immer TESTBUILD = false (31.10.2026, Schutz-Paket 3).
  const TESTBUILD = false;
  const LOKAL = TESTBUILD;
  // Monotone Uhr für Mindestzeiten und Sperren (Sprech-, Denk-, Lese- und Arbeitszeit); das Kalenderdatum kommt weiter von heute().
  const monoton = () => performance.now();

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
    richtigSerie++; comboPruefen();
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
  // Manipulationsschutz (Spielstand nur auf dem Gerät): Punkte, Spiel, Word Gym und erledigte Teile tragen ein Siegel.
  // Wer den Speicher von Hand ändert, passt nicht mehr zum Siegel: Die App nimmt dann die letzte gültige Sicherung
  // oder setzt Punkte und Fortschritt zurück. Kein Server nötig – ein Hindernis, keine Festung.
  const SIEGEL_SALZ = "mrAlex·2026·six·p7Qx";
  const SIEGEL_BIS = Date.parse("2026-11-07"); // bis dahin werden ältere, noch ungesiegelte Spielstände einmalig übernommen; danach nur im Lehrer-Bereich
  // Siegel-Version 2 (Power Up): auch die erledigten Teile (stand.teile) stecken im Siegel; ein Stand ohne _v wird noch mit dem alten Siegel geprüft und beim Laden neu gesiegelt.
  // Siegel-Version 3 (Homework): auch die Hausaufgaben-Boni (stand.hw) stecken im Siegel; ältere Stände werden mit ihrer Version geprüft und beim nächsten Speichern als v3 gesiegelt.
  // Siegel-Version 4 (31.10.2026, Schutz-Paket 3): auch das Ereignisprotokoll (stand.protokoll) steckt im Siegel; v3-Stände werden ohne Hinweis übernommen,
  // als Altbestand markiert und beim nächsten Speichern als v4 gesiegelt.
  const SIEGEL_V = 4;
  const siegel = (o, v = SIEGEL_V) => {
    const inhalt = [o.spiel || null, o.gym || null, o.erledigt || null];
    if (v >= 2) inhalt.push(o.teile || null);
    if (v >= 3) inhalt.push(o.hw || null);
    if (v >= 4) inhalt.push(o.protokoll || null);
    const t = SIEGEL_SALZ + JSON.stringify(inhalt);
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < t.length; i++) { const c = t.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  };
  let manipuliert = false, letzterGueltig = null, altstandRoh = null, speicherLeer = false;
  const lies = (key) => { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { return null; } };
  const echt = (o) => o && typeof o === "object" && o._s === siegel(o, o._v >= 2 ? o._v : 1);
  const grund = () => ({ erledigt: [], fragen: [] });
  function laden() {
    const haupt = lies(SPEICHER), sicherung = lies(SPEICHER + "-b");
    if (echt(haupt)) { letzterGueltig = JSON.stringify(haupt); return Object.assign(grund(), haupt); }
    if (!haupt) speicherLeer = true; // kein Spielstand vorhanden (neues Gerät oder Speicher geleert)
    if (!haupt || typeof haupt !== "object") return grund();
    if (echt(sicherung)) { manipuliert = true; letzterGueltig = JSON.stringify(sicherung); try { localStorage.setItem(SPEICHER, letzterGueltig); } catch (e) { /* egal */ } return Object.assign(grund(), sicherung); }
    if (!haupt._s && Date.now() < SIEGEL_BIS) return Object.assign(grund(), haupt); // älterer Spielstand: einmal übernehmen, ab jetzt gesiegelt
    if (!haupt._s) altstandRoh = haupt; // nach der Übergangszeit: ein ungesiegelter Stand wird nur noch im Lehrer-Bereich übernommen (altstandUebernehmen)
    manipuliert = true; // verändert, oder ungesiegelt nach der Übergangszeit: Punkte und Fortschritt zurück, Einstellungen bleiben
    const rest = Object.assign(grund(), haupt); delete rest.spiel; delete rest.gym; delete rest._s; rest.erledigt = [];
    return rest;
  }
  function speichern() {
    try {
      stand._v = SIEGEL_V; stand._s = siegel(stand);
      const neu = JSON.stringify(stand);
      localStorage.setItem(SPEICHER + "-b", neu); // Zweitkopie: Wer nur den Hauptspeicher ändert, bekommt den letzten echten Stand zurück
      localStorage.setItem(SPEICHER, neu);
      letzterGueltig = neu;
      if (!localStorage.getItem(SPEICHER + "-p")) localStorage.setItem(SPEICHER + "-p", String(Math.floor(Date.now() / 60000))); // ab jetzt gibt es auf diesem Gerät ein Protokoll
    } catch (e) { /* ohne Speicher geht es trotzdem */ }
  }
  const stand = laden();

  /* ---------- Ereignisprotokoll (31.10.2026, Schutz-Paket 3) ----------
     stand.protokoll: die letzten 500 Ereignisse als [t (Minuten seit 1970), art, p], im Siegel. Arten: t Teil · g Word Gym · s Runner-Story ·
     e Einheit/Station · m Spiel des Tages · h Homework-Bonus · gl Road-to-GLN-Bonus (doppelte Punkte) · gr „GLN ready“ (Abschlusstest bestanden, 100 Coins, 0 Punkte) · gs GLN-Serie 7 Tage (50 Coins, 0 Punkte) · bw/bf/bs/bq/bm Boni (Wochenende, Ferien, Serie, Woche, Monat) · k Kauf (Coins, negativ) ·
     w Warnung des Zeitlogs · r Startwert (Lehrer-Bereich, gekürztes Protokoll) · a Altbestand (Stand von vor dem Protokoll) ·
     x Stichproben-Abfrage (Lehrer-Bereich, +1 👍 / −1 👎, keine Punkte – zählt nicht zur Protokoll-Summe) ·
     p Prüfung „Test yourself“ (2.11.: +30 beim ersten Bestehen einer Station, sonst 0 – zählt zur Protokoll-Summe, nicht zum Wächter).
     Geschrieben wird nur in punkteDazu, im Shop und im Lehrer-Bereich. plausibilitaet() prüft beim Laden und markiert für den Lehrer-Bereich –
     nie sperren, nie Punkte ändern. */
  const PROTOKOLL_MAX = 500;
  const minuten = () => Math.floor(Date.now() / 60000);
  // Obergrenze aus dem Protokoll: Startwert (r/a) plus alle positiven Punkte-Einträge
  const protokollSumme = (pl) => pl.reduce((s, e) => (e[1] === "r" || e[1] === "a" ? e[2] : e[1] === "k" || e[1] === "w" || e[1] === "x" ? s : s + Math.max(0, e[2])), 0);
  function protokolliere(art, p) {
    const pl = (stand.protokoll = Array.isArray(stand.protokoll) ? stand.protokoll : []);
    pl.push([minuten(), art, Math.round(p)]);
    if (pl.length > PROTOKOLL_MAX) { // gekürzt: ein Startwert fasst die ältesten Einträge zusammen
      const weg = pl.splice(0, pl.length - PROTOKOLL_MAX + 1);
      pl.unshift([weg[weg.length - 1][0], "r", protokollSumme(weg)]);
    }
  }
  if (!Array.isArray(stand.protokoll)) { // Altbestand: beginnt mit dem vorhandenen Punktestand; -p (gesetzt in speichern) sagt, ob hier schon ein Protokoll gespeichert wurde
    let schonMal = false;
    try { schonMal = !!localStorage.getItem(SPEICHER + "-p"); } catch (e) { /* egal */ }
    stand.protokoll = stand.spiel ? [[minuten(), "a", (stand.spiel && stand.spiel.punkte) || 0, schonMal ? 1 : 0]] : [];
  }
  // Zweiter Warnzähler (nur steigend, unabhängig vom Spielstand): n Warnungen, g Sperren, t zuletzt
  const warnZaehlerLies = () => { try { return JSON.parse(localStorage.getItem(SPEICHER + "-w") || "null") || { n: 0, g: 0, t: 0 }; } catch (e) { return { n: 0, g: 0, t: 0 }; } };
  function warnZaehlerHoch(sperre) {
    const w = warnZaehlerLies();
    try { localStorage.setItem(SPEICHER + "-w", JSON.stringify({ n: (w.n || 0) + 1, g: (w.g || 0) + (sperre ? 1 : 0), t: Date.now() })); } catch (e) { /* egal */ }
  }

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
    warnBanner("⚠️ Dein Fortschritt kann auf diesem Gerät nicht gespeichert werden. Wahrscheinlich ist der private Modus an. Öffne die App im normalen Browser-Fenster, am besten über „Zum Home-Bildschirm“, sonst sind deine Punkte beim Schließen weg.");
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
  if (manipuliert) warnBanner("⚠️ Dein Spielstand passte nicht mehr zu sich selbst und wurde zurückgesetzt. Punkte bekommst du nur durch Üben in der App.");

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
  let hauptNr = 0, hauptLaeuft = false, wortWartet = null; // Runner-Stimmen-Vorrang (hauptText/runnerWort, unten bei spiele)
  function stopp() {
    lauf++;
    if (aktuell) { aktuell.pause(); aktuell = null; }
    if (window.speechSynthesis) speechSynthesis.cancel();
    audioEnde = Promise.resolve(); // die abgebrochene Wiedergabe meldet kein Ende mehr: spätere spiele(…, { warten }) dürfen nicht ewig dahinter hängen
    hauptLaeuft = false; wortWartet = null; // Runner: Seitenwechsel, Runner-Ende, Station übersprungen → wartende Vokabel verwerfen
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
      const start = monoton();
      let erledigt = false;
      const ende = () => { if (erledigt) return; erledigt = true; clearTimeout(notbremse); setTimeout(() => fertig((monoton() - start) / 1000), 350); };
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
      if (opt.laut) a.volume = opt.laut; // spiele(…, { laut: 0.6 }): leiser (Echo im London Run)
      a.onended = () => { gesamt += (a.duration || 0) / (a.playbackRate || 1); setTimeout(fertig, 350); }; // Sprechzeit passt sich an
      a.onerror = fertig;
      a.play().catch(fertig);
    })), Promise.resolve()));
    audioEnde = lauf_.catch(() => {});
    return lauf_.then(() => (meinLauf === lauf ? gesamt : null));
  }
  /* Runner – Haupttext hat Vorrang (1.11., Mr. Alex): Ansage, Erzähler, Boss-Sprüche und Cameo-Sätze laufen über hauptText() und werden nie von einer
     Vokabel unterbrochen. runnerWort(): läuft ein Haupttext (oder wartet einer), kommt die Vokabel in EINEN Warteplatz und wird danach gesprochen;
     eine neuere Vokabel ersetzt die wartende (keine Schlange; ein Echo verdrängt kein frisch gesammeltes Wort). Ohne Haupttext spielt sie sofort wie bisher
     (und darf eine laufende Vokabel abschneiden). Gilt für Audiodateien und Geräte-Stimme gleich; stopp() verwirft das wartende Wort. */
  // Orts-Szene (6.11.): das laufende Audio-Element der Voice-over-Datei (für Untertitel im Takt), sonst null
  const stimmeAudio = (datei) => (aktuell && typeof datei === "string" && decodeURI(aktuell.src).endsWith(datei) ? aktuell : null);
  function hauptText(dateien, opt = {}, wortBehalten = false) {
    const wartend = wortWartet;
    const p = spiele(dateien, opt);
    if (wortBehalten) wortWartet = wartend; // Boss-Spruch (ohne warten) schneidet z. B. die Ansage ab – die wartende Vokabel bleibt; Station/Film (sofort) verwirft sie
    const nr = ++hauptNr;
    hauptLaeuft = true;
    p.then((d) => {
      if (nr !== hauptNr || !hauptLaeuft) return; // ein späterer Haupttext ist dran, oder stopp() hat alles beendet
      hauptLaeuft = false;
      const w = wortWartet; wortWartet = null;
      if (w && d !== null) spiele(w.dateien, Object.assign({}, w.opt, { warten: true }));
    });
    return p;
  }
  function runnerWort(dateien, opt = {}) {
    if (!hauptLaeuft) return spiele(dateien, opt);
    if (!(opt.laut && wortWartet && !wortWartet.opt.laut)) wortWartet = { dateien, opt };
    return Promise.resolve(null);
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
  function zeige(...inhalt) { stopp(); runnerAus(); imSpiel = false; app.replaceChildren(...inhalt.filter(Boolean)); window.scrollTo(0, 0); hwLeiste(); glnLeiste(); }
  function mischen(liste) {
    const a = liste.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const station = (nr) => D.stationen.find((s) => s.nr === nr);
  // Sperren (Sprechzeit, Denkzeit, „erst richtig antworten“) gelten im Programm, nicht nur am Knopf: Wer im Browser das disabled-Attribut
  // entfernt, kommt trotzdem nicht weiter. GESPERRT ist von außen (Konsole) nicht erreichbar.
  const GESPERRT = new WeakSet();
  const sperrt = (k) => { GESPERRT.add(k); k.disabled = true; return k; };
  const entsperrt = (k) => { GESPERRT.delete(k); k.disabled = false; return k; };
  const knopf = (text, fn, art) => el("button", { class: "knopf" + (art ? " " + art : ""), onclick: (e) => { if (GESPERRT.has(e.currentTarget)) return; fn(e); } }, text);
  /* ---------- Arbeitssperre (30.10.2026, Mr. Alex) – wie die Lesezeit-Sperre in zeigeLesen, für weitere Teile ----------
     Knopf k („Lösung zeigen“ / „Weiter“) bleibt im Programm gesperrt (GESPERRT), bis 1. die Mindestzeit sek ab start um ist
     und 2. offen() nichts mehr meldet (Text = Hinweis, true = gesperrt ohne Hinweis, ""/0/null = alles bearbeitet).
     uhr zeigt den Countdown (zeitText(„0:30“)) bzw. was noch fehlt. bereit() prüft neu und gibt true zurück, wenn frei. */
  function arbeitsSperre(k, { sek = 0, start = monoton(), zeitText, offen }) {
    const gebaut = monoton();
    const uhr = el("p", { class: "klein lese-uhr", role: "status" });
    const rest = () => Math.max(0, Math.ceil(sek - (monoton() - start) / 1000));
    let aus = false;
    function bereit() {
      if (aus) return false;
      const r = rest(), n = offen ? offen() : "";
      uhr.textContent = r > 0 ? zeitText(`${Math.floor(r / 60)}:${String(r % 60).padStart(2, "0")}`) : typeof n === "string" ? n : "";
      const ok = r === 0 && !n;
      if (ok) entsperrt(k); else sperrt(k);
      return ok;
    }
    const takt = setInterval(() => { if (!uhr.isConnected && monoton() - gebaut > 2000) return clearInterval(takt); bereit(); }, 500);
    bereit();
    return { uhr, bereit, ende: () => { aus = true; clearInterval(takt); uhr.textContent = ""; } };
  }

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
  const sprechDauer = (d, min = 3) => Math.max(min, d * 1.4 + 1) * eile();
  const denkzeit = (text) => Math.min(8, Math.max(3, 2 + String(text).split(/\s+/).length * 0.35)) * eile();
  const wennFrei = (k, fn) => () => { if (!k.disabled && !GESPERRT.has(k)) fn(); };

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
    return (monoton() - lage.start) / 1000 < laenge(teil) * proEintrag * eile();
  }
  // Sekunden pro Satz/Wort/Frage mindestens. Quizteile (Q): blindes Durchklicken (alle Antworten probieren) bringt keine Punkte.
  const QUIZ_MIN = 2.5;
  const LESE_WPM = 80, LESE_JE_AUSSAGE = 3; // Lesezeit-Sperre für Lesen-Teile (Klasse 6): Wörter pro Minute + Sekunden je Aussage
  const SPRECH_MIN = { lr: 2, vok_lernen: 1.5, vok_luecke: 2, verbform: QUIZ_MIN, auswahl: QUIZ_MIN, hoerwahl: QUIZ_MIN, vok_bild: QUIZ_MIN, vok_abfrage: QUIZ_MIN };
  const istQuiz = (teil) => (SPRECH_MIN[teil.art] || 0) === QUIZ_MIN;

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
    const alleFertig = D.stationen.every((s) => s.spiele || stand.erledigt.includes(s.nr)) && !faellige("");
    zeige(
      el("header", { class: "gruss" },
        el("h1", {}, "English Power Game"),
        el("p", { class: "klein" }, "Hallo! Wähl eine Station. Wenn du fertig bist, bekommt sie ein Häkchen."),
        statusleiste(), terminZeile()),
      hwZeile(), glnZeile(), glnPlanZeile(), gymKarte(),
      powerupZeile(),
      alleFertig && el("section", { class: "geschafft" },
        el("h2", {}, "Wahnsinn, du hast alles geschafft!"),
        el("p", {}, "Wenn etwas unklar ist, frag mich am Mittwoch – ich helfe dir gern. Dein Mr. Alex")),
      el("nav", { class: "kacheln", "aria-label": "Stationen" },
        D.stationen.map((s) => {
          const auf = !s.spiele && faellige(s.nr + "|") > 0, fertig = !s.spiele && stand.erledigt.includes(s.nr) && !auf, hw = hwBei(s.nr), gl = glnBei(s.nr);
          return el("button", { class: "kachel" + (fertig ? " erledigt" : "") + (auf ? " powerup" : "") + (hw ? " hw" : "") + (gl ? " gln" : ""), onclick: () => starteStation(s.nr),
            "aria-label": `Station ${s.nr}: ${s.titel}${fertig ? " (geschafft)" : ""}${auf ? " (Power Up)" : ""}${hw ? " (Hausaufgabe)" : ""}${gl ? " (Road to GLN)" : ""}` },
            el("span", { class: "sym", "aria-hidden": "true" }, s.symbol),
            el("span", { class: "nr" }, "Station " + s.nr),
            el("span", { class: "titel" }, s.titel),
            s.unter && el("span", { class: "unter" }, s.unter),
            hw && hwSchild(), gl && glnSchild(), auf && powerupSchild(),
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

  let lage = null; // { nr, gruppe?, teile, teil, pos (Position im Teil), reihe, runden, vq, hilfe (💡 benutzt), abspielen, weiter }

  function neueLage(werte) {
    lage = Object.assign({ teil: 0, pos: 0 }, werte);
    return lage;
  }
  // Übungszustand eines Teils (Reihenfolge, Runden …) – wird bei jedem Betreten eines Teils neu gemischt.
  function teilZuruecksetzen() { lage.reihe = lage.runden = lage.vq = null; lage.hilfe = false; }

  /* ---------- Fortschritt pro Teil (gespeichert) ---------- */
  // stand.teile[schluessel] = { am: "JJJJ-MM-TT", s: Stufe } – Stufe steigt bei jedem Power Up (Wiederholung eines fälligen Teils)
  function teilSchluessel(i) { return `${lage.nr}|${lage.gruppe != null ? lage.gruppe : ""}|${i}`; }
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
  // Fällige Teile hinter einem Schlüsselanfang („3|“ = ganze Station, „2|1|“ = Abschnitt 1 der Station 2)
  const faellige = (anfang) => Object.entries(stand.teile || {}).filter(([k, e]) => k.startsWith(anfang) && faellig(e)).length;
  const powerupSchild = () => el("span", { class: "powerup-schild" }, "⚡ Power Up");
  function powerupZeile() {
    const n = faellige("");
    if (!n) return null;
    const erste = D.stationen.find((s) => faellige(s.nr + "|"));
    return el("div", { class: "powerup-zeile", role: "status" },
      el("span", { class: "powerup-text" }, n === 1 ? "⚡ 1 Teil fast leer – aufladen!" : `⚡ ${n} Teile fast leer – aufladen!`),
      erste && knopf("⚡ Power Up", () => starteStation(erste.nr), "leise"));
  }
  // Alte Einträge (true) bekommen Datum und Stufe 0; danach ist der Stand mit Version 2 gesiegelt (einmalig, idempotent)
  function powerupMigration() {
    let geaendert = stand._v !== 3;
    for (const k of Object.keys(stand.teile || {})) if (typeof stand.teile[k] !== "object") { stand.teile[k] = { am: iso(heute()), s: 0 }; geaendert = true; }
    if (geaendert) speichern();
  }
  /* ---------- 📝 Homework (inhalte/hausaufgabe.tsv → D.hausaufgaben, Schema in inhalte/LIESMICH.md) ----------
     Gilt von ≤ heute ≤ bis (Ortszeit). Dann: Knopf „📝 HW“ in der Leiste, Chip-Zeile über dem Word Gym, Schild an Kachel, Abschnitt und Teil.
     Eine Hausaufgabe ist eine Kette von Zielen (h.ziele, Reihenfolge wie in der TSV); Knopf und Chip springen zum ersten offenen Ziel,
     der Chip zählt „HW 1/4“. Jeder Teil der Hausaufgabe bringt im Zeitraum +50 % auf die Teil-Punkte (aufgerundet) – einmal je Teil und
     Hausaufgabe (stand.hw["<von>|<ziel>"] = [Teilschlüssel …], steckt im Siegel). Ziel erledigt = alle Teile fertig oder in diesem Zeitraum
     gemacht; alles erledigt → einmalige Feier (stand.hw["<von>|<ziel>|fertig"] = true). */
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
  const hwDatum = (t) => { const d = new Date(t + "T12:00:00"); return `${["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}.`; };
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
      ereignisse.push({ art: "feier", symbol: "📝", titel: "Homework done!", text: `Alle Hausaufgaben bis ${hwDatum(h.bis)} sind erledigt. Stark!`, ton: SP.texte.gym_fini });
    }
    return neu ? Math.ceil(basis / 2) : 0;
  }
  // Direktsprung zu einem Ziel: Station, Abschnitt oder Teil – bei ganzer Station/Abschnitt zum ersten offenen Abschnitt/Teil
  function hwStart(z, offenFn) {
    const st = station(z.nr), offen = offenFn || ((k) => !(stand.teile && stand.teile[k]));
    let g = z.gruppe;
    if (g == null && st.gruppen) { // Abschnitte des Ziels: der erste mit offenen Teilen, sonst der erste
      const gs = st.gruppen.map((_, i) => i).filter((i) => z.schluessel.some((k) => k.startsWith(`${z.nr}|${i}|`)));
      g = gs.find((i) => z.schluessel.some((k) => k.startsWith(`${z.nr}|${i}|`) && offen(k))) ?? gs[0];
    }
    if (g != null) starteGruppe(st, g); else starteStation(z.nr);
    if (!lage) return;
    const i = z.teil != null ? z.teil : lage.teile.findIndex((_, i) => z.schluessel.includes(teilSchluessel(i)) && (offenFn ? offenFn(teilSchluessel(i)) : !istFertig(i)));
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
    k.setAttribute("aria-label", (fertig ? "Hausaufgabe erledigt: " : "Hausaufgabe: ") + h.text + " (lange drücken: Übersicht)");
    if (!alt) { const t = document.getElementById("tempo"); if (t) t.after(k); }
  }
  // Chip-Zeile auf der Startseite direkt über dem Word Gym: „HW 1/4“ + Text, ▾ öffnet die Übersicht
  function hwZeile() {
    const h = hwAktiv();
    if (!h) return null;
    const fertig = hwErledigt(h);
    return el("div", { class: "hw-zeile" + (fertig ? " fertig" : ""), role: "status" },
      el("button", { class: "hw-chip", onclick: hwWeiterStart, "aria-label": (fertig ? "Hausaufgabe erledigt: " : `Hausaufgabe öffnen (${hwZaehler(h)} erledigt): `) + h.text }, fertig ? "📝 HW ✓" : `📝 HW ${hwZaehler(h)}`),
      el("span", { class: "hw-text", title: h.text }, fertig ? `Erledigt: ${h.text}` : `${h.text} · bis ${hwDatum(h.bis)} · +50 %`),
      el("button", { class: "hw-liste-knopf", onclick: hwUebersicht, "aria-label": "Alle Hausaufgaben zeigen" }, "▾"));
  }
  // Übersicht aller Ziele der Kette: ✓ / ○, Name, ▶ Sprung
  const hwDialog = el("dialog", { class: "feier hw-liste", "aria-label": "Homework" });
  document.body.append(hwDialog);
  function hwUebersicht() {
    const h = hwAktiv();
    if (!h) return;
    const zu = () => hwDialog.close();
    hwDialog.replaceChildren(
      el("h2", {}, `📝 Homework · bis ${hwDatum(h.bis)}`),
      el("p", { class: "hw-liste-text" }, h.text),
      el("p", { class: "klein" }, "+50 % Punkte für jeden Teil"),
      el("ul", { class: "hw-liste-ziele" }, h.ziele.map((z) => { const f = hwZielFertig(h, z);
        return el("li", { class: f ? "fertig" : "" },
          el("span", { class: "hw-haken", "aria-label": f ? "erledigt" : "offen" }, f ? "✓" : "○"),
          el("span", { class: "hw-name" }, z.name),
          knopf("▶", () => { zu(); hwStart(z); }, "leise")); })),
      el("div", { class: "knopfreihe" }, knopf("Schließen", zu, "haupt")));
    hwDialog.showModal();
  }
  // Abschluss-Seiten: „Nächste Hausaufgabe ➜“, wenn der eben fertige Teil ein Ziel abgeschlossen hat und noch eins offen ist
  function hwWeiterKnopf(k) {
    const h = hwAktiv();
    if (!h) return glnWeiterKnopf(k);
    const ziele = h.ziele.filter((z) => z.schluessel.includes(k));
    if (!ziele.length || !ziele.every((z) => hwZielFertig(h, z)) || !hwOffen(h)) return glnWeiterKnopf(k);
    return knopf("📝 Nächste Hausaufgabe ➜", hwWeiterStart, "hw-weiter");
  }

  // Timer bei Wiederholung kürzer: Teil hat schon einen Eintrag → Faktor je Stufe (Word Gym bleibt, hat kein lage.tempoFaktor)
  const TEMPO = [0.5, 0.35, 0.25];
  function tempoFaktor(i) { const e = stand.teile && stand.teile[teilSchluessel(i)]; return e ? TEMPO[Math.min(e.s || 0, 2)] : 1; }
  const eile = () => (lage && lage.tempoFaktor) || 1;

  /* ---------- 🏁 Road to GLN (inhalte/gln.tsv → D.gln, Schema in inhalte/LIESMICH.md; 11.11.2026) ----------
     Fenster: 14 Tage vor dem GLN bis zum GLN-Tag (g.von … g.bis, vom Bauskript berechnet). Nur dann: grüner Knopf „🏁 GLN“ in der Leiste,
     grüne Zeile auf der Startseite, GLN-Schild an Kachel, Abschnitt und Teil. Kette wie bei der Hausaufgabe; ein Teil zählt, wenn er IM Fenster
     gemacht wurde (Wiederholen ist der Sinn). Vier Boni: 1. doppelte Punkte je GLN-Teil (einmal je Teil, Protokoll „gl“) · 2. Abschlusstest
     (Test yourself über alle GLN-Teile, frei ab 70 % der Ziele; bestanden = 100 Coins, Protokoll „gr“, Häkchen am Knopf, Abzeichen
     „GLN Ready“ in der Statusleiste bis zum GLN; Ergebnis in stand.spiel.tests["gln:<Datum>"]) · 3. Streak: Tage mit mindestens einem GLN-Teil,
     Flamme am Knopf, 7 Tage in Folge = 50 Coins (Protokoll „gs“) · 4. Zeile im Lehrer-Bereich.
     Gespeichert in stand.hw (im Siegel seit v3, keine neue Siegel-Version): "gln|<Datum>" = [Teilschlüssel], "…|tage" = [Tage], "…|serie7", "…|fertig". */
  const GLN = { testCoins: 100, serieTage: 7, serieCoins: 50 };
  const glnAktiv = () => { const t = iso(heute()); return (D.gln || []).find((g) => g.von <= t && t <= g.bis) || null; };
  const glnId = (g) => "gln|" + g.datum;
  const glnGemacht = (g) => (stand.hw && stand.hw[glnId(g)]) || [];
  const glnTeilFertig = (g, k) => { const e = stand.teile && stand.teile[k]; return glnGemacht(g).includes(k) || !!(e && typeof e === "object" && e.am >= g.von); };
  const glnTrifft = (k) => { const g = glnAktiv(); return !!g && g.ziele.some((z) => z.schluessel.includes(k)); };
  const glnBei = (nr, anfang) => { const g = glnAktiv(); return !!g && g.ziele.some((z) => z.nr === nr && (!anfang || z.schluessel.some((k) => k.startsWith(anfang)))); };
  const glnZielFertig = (g, z) => z.schluessel.length > 0 && z.schluessel.every((k) => glnTeilFertig(g, k));
  const glnOffen = (g) => g.ziele.find((z) => !glnZielFertig(g, z)) || null;
  const glnFertigZahl = (g) => g.ziele.filter((z) => glnZielFertig(g, z)).length;
  const glnZaehler = (g) => `${glnFertigZahl(g)}/${g.ziele.length}`;
  const glnTestKey = (g) => "gln:" + g.datum;
  const glnTestOk = (g) => { const e = testErgebnis(glnTestKey(g)); return !!(e && e.bestanden); };
  const glnTestFrei = (g) => glnFertigZahl(g) * 10 >= g.ziele.length * 7; // frei ab 70 % der Etappen (Mr. Alex, 11.11.)
  const glnNochTage = (g) => Math.round((new Date(g.datum + "T12:00:00") - new Date(iso(heute()) + "T12:00:00")) / 86400000);
  const glnNochText = (g) => { const n = glnNochTage(g); return n <= 0 ? "heute!" : n === 1 ? "morgen!" : `noch ${n} Tage`; };
  const glnTageListe = (g) => (stand.hw && stand.hw[glnId(g) + "|tage"]) || [];
  // Tage in Folge mit GLN-Teil, endend heute (oder gestern, solange heute noch nichts gemacht ist)
  function glnSerie(g) {
    const tage = glnTageListe(g), d = heute();
    if (!tage.includes(iso(d))) d.setDate(d.getDate() - 1);
    let n = 0;
    while (tage.includes(iso(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  // Etappenplan (12.11.2026, g.plan aus gln.tsv): bis wann welche Etappen geschafft sein sollen – nur Anzeige (grün im Plan, gelb hinterher), keine Strafe
  const glnPos = (g) => { const i = g.ziele.findIndex((z) => !glnZielFertig(g, z)); return i < 0 ? g.ziele.length : i; }; // so viele Etappen sind am Stück fertig
  function glnPlan(g) {
    const plan = g.plan || [];
    if (!plan.length) return null;
    const t = iso(heute()), pos = glnPos(g), geschafft = (m) => (m.test ? glnTestOk(g) : pos >= m.n);
    const verpasst = plan.filter((m) => m.bis < t && !geschafft(m)), ziel = verpasst[0] || plan.find((m) => m.bis >= t && !geschafft(m)) || null;
    if (!ziel) return { hinterher: false, text: "Alles im Plan geschafft ✓" };
    const j = plan.indexOf(ziel), von = j > 0 ? plan[j - 1].n + 1 : 1;
    const was = ziel.test ? "Abschlusstest" : von >= ziel.n ? `Etappe ${ziel.n}` : `Etappe ${von}–${ziel.n}`;
    const wo = pos >= g.ziele.length ? "du bist beim Abschlusstest" : `du bist bei ${pos + 1}`;
    return { hinterher: verpasst.length > 0, text: `${verpasst.length ? "War bis" : "Bis"} ${hwDatum(ziel.bis)}: ${was} · ${wo}` };
  }
  const glnPlanBis = (g, i) => { const m = (g.plan || []).find((x) => (i == null ? x.test : !x.test && i < x.n)); return m ? ` · ${"bis"} ${hwDatum(m.bis)}` : ""; };
  function glnPlanZeile() {
    const g = glnAktiv(), p = g && glnPlan(g);
    return p ? el("p", { class: "gln-plan" + (p.hinterher ? " hinterher" : ""), role: "status" }, (p.hinterher ? "⏰ " : "🗓️ ") + p.text) : null;
  }
  const glnSchild = () => el("span", { class: "hw-schild gln-schild" }, "🏁 GLN");
  function glnBonus(basis) {
    const g = glnAktiv();
    if (!g || !lage || !lage.teile) return 0;
    const k = teilSchluessel(lage.teil);
    if (!g.ziele.some((z) => z.schluessel.includes(k))) return 0;
    stand.hw = stand.hw || {};
    const neu = !glnGemacht(g).includes(k), id = glnId(g), t = iso(heute());
    if (neu) stand.hw[id] = [...glnGemacht(g), k];
    if (!glnTageListe(g).includes(t)) { // 🔥 Streak: erster GLN-Teil des Tages
      stand.hw[id + "|tage"] = [...glnTageListe(g), t];
      const n = glnSerie(g);
      if (n >= 2) ereignisse.push({ art: "toast", text: `🔥 Road to GLN: ${n} Tage in Folge` });
      if (n >= GLN.serieTage && !stand.hw[id + "|serie7"]) {
        stand.hw[id + "|serie7"] = true; spielstand().coins += GLN.serieCoins; protokolliere("gs", 0);
        ereignisse.push({ art: "feier", symbol: "🔥", titel: `${GLN.serieTage} days on the Road to GLN!`, text: `${GLN.serieTage} Tage in Folge geübt – +${GLN.serieCoins} Coins!`, ton: SP.texte.feuer });
      }
    }
    if (!stand.hw[id + "|fertig"] && !glnOffen(g)) {
      stand.hw[id + "|fertig"] = true;
      ereignisse.push({ art: "feier", symbol: "🏁", titel: "Road to GLN complete!", text: glnTestOk(g) ? "Alle Etappen geschafft. Du bist bereit!" : "Alle Etappen geschafft. Jetzt noch der Abschlusstest!", ton: SP.texte.gym_fini });
    }
    return neu ? basis : 0;
  }
  const glnStart = (z) => { const g = glnAktiv(); if (g) hwStart(z, (k) => !glnTeilFertig(g, k)); };
  const glnTestStart = () => { const g = glnAktiv(); if (!g) return; if (!glnTestFrei(g)) return toast(`Abschlusstest: erst 70 % der Etappen schaffen (${glnZaehler(g)}).`); testStart({ gln: g, nr: "GLN", titel: "Abschlusstest" }); };
  // Nächster Schritt: erstes offenes Ziel, danach der Abschlusstest, danach die Übersicht
  function glnWeiterStart() {
    const g = glnAktiv(), z = g && glnOffen(g);
    if (!g) return;
    if (z) glnStart(z); else if (!glnTestOk(g)) glnTestStart(); else glnUebersicht();
  }
  function glnLeiste() {
    const g = glnAktiv(), alt = document.getElementById("gln");
    if (!g) { if (alt) alt.remove(); return; }
    const ok = glnTestOk(g), n = glnSerie(g);
    let lang = null, gehalten = false;
    const k = alt || el("button", { id: "gln", type: "button", class: "tempo-knopf hw-knopf gln-knopf",
      onpointerdown: () => { gehalten = false; clearTimeout(lang); lang = setTimeout(() => { gehalten = true; glnUebersicht(); }, 500); },
      onpointerup: () => clearTimeout(lang), onpointerleave: () => clearTimeout(lang), onpointercancel: () => clearTimeout(lang),
      oncontextmenu: (e) => e.preventDefault(),
      onclick: () => { if (gehalten) { gehalten = false; return; } glnWeiterStart(); } });
    k.textContent = "🏁 GLN" + (n ? ` 🔥${n}` : "") + (ok ? " ✓" : "");
    k.setAttribute("aria-label", `Road to GLN: ${glnZaehler(g)} Etappen, ${glnNochText(g)}` + (n ? `, ${n} Tage in Folge` : "") + (ok ? ", Abschlusstest bestanden" : "") + " (lange drücken: Übersicht)");
    if (!alt) { const t = document.getElementById("hw") || document.getElementById("tempo"); if (t) t.after(k); }
  }
  function glnZeile() {
    const g = glnAktiv();
    if (!g) return null;
    const ok = glnTestOk(g);
    return el("div", { class: "hw-zeile gln-zeile", role: "status" },
      el("button", { class: "hw-chip gln-chip", onclick: glnWeiterStart, "aria-label": `Road to GLN öffnen (${glnZaehler(g)} Etappen erledigt)` }, `🏁 Road to GLN · ${glnZaehler(g)}${ok ? " ✓" : ""}`),
      el("span", { class: "hw-text", title: g.text }, `${glnNochText(g)} · Punkte ×2 · ${g.text}`),
      el("button", { class: "hw-liste-knopf", onclick: glnUebersicht, "aria-label": "Alle Etappen der Road to GLN zeigen" }, "▾"));
  }
  function glnUebersicht() {
    const g = glnAktiv();
    if (!g) return;
    const zu = () => hwDialog.close(), ok = glnTestOk(g), frei = glnTestFrei(g), n = glnSerie(g), erg = testErgebnis(glnTestKey(g));
    hwDialog.replaceChildren(
      el("h2", {}, `🏁 Road to GLN · ${glnNochText(g)}`),
      el("p", { class: "hw-liste-text" }, g.text),
      el("p", { class: "klein" }, `Doppelte Punkte für jeden Teil · 🔥 ${n} ${n === 1 ? "Tag" : "Tage"} in Folge (${GLN.serieTage} Tage = +${GLN.serieCoins} Coins)`),
      glnPlanZeile(),
      el("ul", { class: "hw-liste-ziele gln-liste" }, g.ziele.map((z, zi) => { const f = glnZielFertig(g, z);
        return el("li", { class: f ? "fertig" : "" },
          el("span", { class: "hw-haken", "aria-label": f ? "erledigt" : "offen" }, f ? "✓" : "○"),
          el("span", { class: "hw-name" }, `${zi + 1}. ${z.name.replace(/^Station \d+: /, "")}`, el("span", { class: "klein" }, glnPlanBis(g, zi))),
          knopf("▶", () => { zu(); glnStart(z); }, "leise")); }),
        el("li", { class: ok ? "fertig" : "" },
          el("span", { class: "hw-haken", "aria-label": ok ? "bestanden" : "offen" }, ok ? "✓" : "🎯"),
          el("span", { class: "hw-name" }, "Abschlusstest „GLN Ready“" + (ok ? ` · bestanden (${erg.best} %)` : frei ? ` · ab ${TEST.grenze} % +${GLN.testCoins} Coins` + (erg ? ` · bisher ${erg.best} %` : "") : " · frei ab 70 % der Etappen"), el("span", { class: "klein" }, glnPlanBis(g, null))),
          frei ? knopf("▶", () => { zu(); glnTestStart(); }, "leise") : null)),
      el("div", { class: "knopfreihe" }, knopf("Schließen", zu, "haupt")));
    hwDialog.showModal();
  }
  // Abschluss-Seiten: weiter auf der Kette, wenn der eben fertige Teil ein Ziel abgeschlossen hat; am Ende zum Abschlusstest
  function glnWeiterKnopf(k) {
    const g = glnAktiv();
    if (!g) return null;
    const ziele = g.ziele.filter((z) => z.schluessel.includes(k));
    if (!ziele.length || !ziele.every((z) => glnZielFertig(g, z))) return null;
    if (glnOffen(g)) return knopf("🏁 Nächste Etappe ➜", glnWeiterStart, "hw-weiter gln-weiter");
    return glnTestOk(g) ? null : knopf("🏁 Abschlusstest ➜", glnTestStart, "hw-weiter gln-weiter");
  }
  const glnAbzeichen = () => { const g = glnAktiv(); return g && glnTestOk(g) ? el("span", { class: "gln-ready", title: "Abschlusstest der Road to GLN bestanden" }, "🏁 GLN Ready") : null; };
  // Lehrer-Bereich und QR: aktueller oder letzter GLN
  function glnStandLehrer() {
    const t = iso(heute()), g = (D.gln || []).filter((x) => x.von <= t).sort((x, y) => (x.datum < y.datum ? 1 : -1))[0];
    if (!g) return null;
    const e = testErgebnis(glnTestKey(g));
    return { g, z: glnFertigZahl(g), n: g.ziele.length, test: e && e.bestanden ? e.am : null, best: e ? e.best : null, tage: glnTageListe(g).length, serie: glnSerie(g), plan: glnPlan(g) };
  }

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
    if (st.spiele) return zeigeSpiele();
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
      (!lage || lage.gruppe == null) && testKnopf(st), // 🎯 Test yourself: auf der Stations-Seite (nicht innerhalb eines Abschnitts)
      lage && lage.teile && !lage.ende && hwTrifft(teilSchluessel(lage.teil)) && hwSchild(),
      lage && lage.teile && !lage.ende && glnTrifft(teilSchluessel(lage.teil)) && glnSchild(),
      lage && lage.teile && !lage.ende && teilFaellig(lage.teil) && powerupSchild(),
      lage && sprungleiste());
  }

  // Alle Teile oben direkt anklickbar; Stufen eines Listen-and-Repeat-Teils kompakt: „Teil A ① ② ③ ④“
  function sprungleiste() {
    const nochNichts = !lage.teile.some((_, i) => istFertig(i));
    const ZIFFERN = ["①", "②", "③", "④", "⑤"];
    const sprung = (i, text) => {
      const t = lage.teile[i], auf = teilFaellig(i), fertig = istFertig(i) && !auf, jetzt = i === lage.teil && !lage.ende, hw = hwTrifft(teilSchluessel(i)), gl = glnTrifft(teilSchluessel(i)), glOk = gl && glnTeilFertig(glnAktiv(), teilSchluessel(i));
      const start = nochNichts && i === 0;
      return el("button", { class: "sprung" + (jetzt ? " jetzt" : "") + (fertig ? " fertig" : "") + (auf ? " powerup" : "") + (start ? " start" : "") + (hw ? " hw" : "") + (gl ? " gln" : "") + (glOk ? " gln-ok" : ""),
        "aria-current": jetzt ? "step" : false, title: t.name,
        "aria-label": `${t.name}${fertig ? " (geschafft)" : ""}${auf ? " (Power Up)" : ""}${hw ? " (Hausaufgabe)" : ""}${gl ? (glOk ? " (Road to GLN, erledigt)" : " (Road to GLN)") : ""}${start ? " – hier starten" : ""}`,
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
    if (lage.startTeil !== lage.teil) { lage.startTeil = lage.teil; lage.start = monoton(); lage.tempoFaktor = tempoFaktor(lage.teil); }
    const teil = lage.teile[lage.teil];
    ({ lr: zeigeSatz, erklaerung: zeigeErklaerung, verbform: zeigeVerbform, hoeren: zeigeHoeren,
       vok_lernen: zeigeVokabel, vok_luecke: zeigeVokabel, vok_bild: zeigeVokabel, vok_abfrage: zeigeVokabel,
       auswahl: zeigeAuswahl, reihenfolge: zeigeReihenfolge, lesen: zeigeLesen, textfolge: zeigeTextfolge, woche: zeigeWoche, hoerwahl: zeigeHoerwahl })[teil.art](teil);
    navErgaenzen();
  }

  function naechstes() {
    const teil = lage.teile[lage.teil];
    if (lage.pos + 1 < laenge(teil)) { lage.pos++; return zeigeTeil(); }
    if (zuSchnell(teil)) return zuSchnellSeite(teil);
    const erstesMal = !istFertig(lage.teil), aufladen = teilFaellig(lage.teil);
    teilFertig(lage.teil, aufladen);
    if (aufladen) ereignisse.push({ art: "toast", text: "⚡ Aufgeladen!" });
    if (aufladen && SP.texte.powerup && SP.texte.powerup.audio) setTimeout(() => spiele([SP.texte.powerup.audio], { warten: true }), 600); // Stimme nach dem Lob, nicht darüber
    // Punkte-Regeln gegen schnelles Abholen (30.10., Mr. Alex):
    // · Erklärteile (nur lesen, dann „Weiter“) geben nie Punkte – sie zählen aber als erledigt.
    // · Wiederholung eines schon erledigten Teils: +5 nur bei Teilen mit Mindestzeit (Sprechen, Quiz – SPRECH_MIN);
    //   alles, was sich schnell noch einmal durchklicken lässt (Lesen, Reihenfolge, Hören, Dialog, Schreiben …), gibt beim Wiederholen keine Punkte.
    //   Power Up (fälliger Teil wird aufgeladen) gibt weiter Punkte – das geht je Teil nur alle 30/60/120 Tage.
    // · Wiederholungen mit Mindestzeit (30.10.): jede weitere Wiederholung halbiert – 5, 2, 1, dann 0; ein Power Up setzt den Zähler (stand.teile[k].w) zurück.
    // Wiederholen (6.11., Mr. Alex): Ein einzeln wiederholter Teil gibt keine Punkte mehr. Nur wer in EINEM Besuch alle Teile
    // der Station bzw. des Abschnitts noch einmal schafft, bekommt einen Wiederholungsbonus (je Station kleiner: 25, 12, 6, 3, 1, 0).
    // Power Up (fälliger Teil) gibt weiter volle Punkte; ein wiederholter Teil zählt weiter für die Hausaufgabe.
    if (!erstesMal) (lage.wdhLauf = lage.wdhLauf || new Set()).add(lage.teil);
    const wiederholt = !erstesMal && !aufladen;
    const ohnePunkte = teil.art === "erklaerung" || wiederholt;
    if (!ohnePunkte) belohne(erstesMal, !lage.hilfe, false, null);
    else { hwBonus(0); glnBonus(0); speichern(); setTimeout(zeigeEreignisse, 50); } // ohne Punkte zählt der Teil trotzdem für die Hausaufgabe (inkl. Feier „Homework done!“)
    if (!erstesMal && alleTeileFertig() && lage.wdhLauf.size < lage.teile.length) return teilWiederholt();
    if (alleTeileFertig()) return stationGeschafft();
    if (lage.teil + 1 < lage.teile.length) return zwischenstand();
    fastGeschafft();
  }

  // Prüfung C: zu schnell durchgeklickt – kein Lob, keine Punkte, Teil noch mal
  function zuSchnellSeite(teil) {
    const st = station(lage.nr);
    const nochmal = () => { lage.frei = null; lage.startTeil = null; springe(lage.teil); };
    lage.abspielen = null; lage.weiter = nochmal;
    zeige(kopf(st), el("section", { class: "geschafft" },
      el("h2", {}, "⏱️ Zu schnell!"),
      el("p", { class: "ansage" }, istQuiz(teil) ? "Lies die Aufgaben in Ruhe und überleg, bevor du antwortest. Dann gibt es auch Punkte. Versuch es noch mal!" : "Sprich die Sätze wirklich mit. Dann gibt es auch Punkte. Versuch es noch mal!"),
      knopf("Noch mal ➜", nochmal, "haupt")));
  }

  // Letzter Teil fertig, aber vorher wurde etwas übersprungen
  function fastGeschafft() {
    const st = station(lage.nr), hwWeiter = hwWeiterKnopf(teilSchluessel(lage.teil));
    lage.ende = true; lage.abspielen = null; lage.weiter = null;
    const offen = lage.teile.map((t, i) => [t, i]).filter(([, i]) => !istFertig(i));
    zeige(kopf(st), el("section", { class: "geschafft" },
      el("h2", { lang: "en" }, lob(true)),
      el("p", { class: "ansage" }, "Fast geschafft! Diese Teile fehlen noch:"),
      el("div", { class: "knopfreihe" }, offen.map(([t, i]) => knopf(t.name, () => { lage.ende = false; springe(i); }))),
      hwWeiter, knopf("Zur Startseite", startseite)));
  }
  function laenge(teil) {
    if (teil.art === "lr") return teil.saetze.length;
    if (teil.art === "verbform" || teil.art === "auswahl") return teil.aufgaben.length;
    if (teil.art === "hoerwahl") return lage.runden ? lage.runden.length : teil.paare.length * 2;
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
      knopf("Weiter ➜", lage.weiter, "haupt"), hwWeiterKnopf(teilSchluessel(lage.teil))));
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
        const auf = faellige(`${st.nr}|${i}|`) > 0, ok = fertig.includes(g.name) && !auf, hw = hwBei(st.nr, `${st.nr}|${i}|`), gl = glnBei(st.nr, `${st.nr}|${i}|`);
        return el("button", { class: "kachel" + (ok ? " erledigt" : "") + (auf ? " powerup" : "") + (hw ? " hw" : "") + (gl ? " gln" : ""), onclick: () => starteGruppe(st, i),
          "aria-label": `${g.name}${g.vokabeln ? `, ${g.vokabeln.length} Wörter` : ""}${ok ? " (geschafft)" : ""}${auf ? " (Power Up)" : ""}${hw ? " (Hausaufgabe)" : ""}` },
          el("span", { class: "nr" }, g.vokabeln ? `${g.vokabeln.length} Wörter` : `Thema ${i + 1}`),
          el("span", { class: "titel" }, g.name),
          el("span", { class: "vorschau", "aria-hidden": "true" },
            g.symbol || g.vokabeln.slice(0, 5).map((id) => D.vokabeln.find((v) => v.id === id).symbol).join(" ")),
          hw && hwSchild(), gl && glnSchild(), auf && powerupSchild(),
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
    neueLage({ nr: st.nr, gruppe: i, vok, teile: gruppenTeile(st, vok) });
    zeigeTeil();
  }

  // Teile einer Vokabel-Gruppe: Lückensätze nur mit Gym-Satz, Bilder nur mit mindestens zwei Bildern (auch für die Stichprobe)
  const gruppenTeile = (st, vok) => st.schritte.filter((s) => (s.art !== "vok_luecke" || vok.some((v) => v.gymsatz)) && (s.art !== "vok_bild" || vok.filter((v) => v.bild).length >= 2));

  function gruppeGeschafft() {
    const st = station(lage.nr), g = st.gruppen[lage.gruppe], hwWeiter = hwWeiterKnopf(teilSchluessel(lage.teil));
    stand.gruppen = stand.gruppen || {};
    const liste = (stand.gruppen[st.nr] = stand.gruppen[st.nr] || []);
    if (!liste.includes(g.name)) { liste.push(g.name); einheitBonus(); }
    else if (wdhKomplett()) wdhStationBonus(`${st.nr}|${g.name}`);
    const alle = st.gruppen.every((x) => liste.includes(x.name)), stationNeu = alle && !stand.erledigt.includes(st.nr);
    if (stationNeu) stand.erledigt.push(st.nr);
    speichern();
    lage = null;
    zeige(kopf(st), el("section", { class: "geschafft" },
      el("h2", {}, `${g.name} geschafft!`),
      el("p", { class: "ansage" }, alle ? `Station ${st.nr} geschafft! Du bist ein Superstar ${st.lob}!` : ""),
      el("p", { class: "ansage", lang: "en" }, alle ? ruf("geschafft") : lob(true)),
      el("div", { class: "knopfreihe" },
        hwWeiter, knopf("Weitere Abschnitte", () => zeigeGruppen(st), hwWeiter ? "" : "haupt"), knopf("Zur Startseite", startseite))));
    if (stationNeu) megaLob(String(st.nr));
  }

  function stationGeschafft() {
    if (lage.gruppe != null) return gruppeGeschafft();
    const st = station(lage.nr), hwWeiter = hwWeiterKnopf(teilSchluessel(lage.teil)), stationNeu = !stand.erledigt.includes(st.nr);
    if (stationNeu) { stand.erledigt.push(st.nr); speichern(); einheitBonus(); }
    else if (wdhKomplett()) wdhStationBonus(String(st.nr));
    lage = null;
    zeige(kopf(st), el("section", { class: "geschafft" },
      el("h2", {}, `Station ${st.nr} geschafft!`),
      el("p", { class: "ansage" }, `Du bist ein Superstar ${st.lob}!`),
      el("p", { class: "ansage", lang: "en" }, ruf("geschafft")),
      el("div", { class: "knopfreihe" }, hwWeiter, knopf("Zur Startseite", startseite, hwWeiter ? "" : "haupt"))));
    if (stationNeu) megaLob(String(st.nr));
  }

  // Gemeinsamer Rahmen für eine Aufgabe/Karte
  function karte(teil, zaehlerText, ...inhalt) {
    return el("section", { class: "satzkarte" }, zaehlerText && el("p", { class: "zaehler" }, zaehlerText, comboFlamme()), ...inhalt);
  }
  function rueckmeldung() { return el("div", { class: "rueckmeldung", hidden: true, role: "status" }); }
  function melde(box, art, text) {
    if (art === "hilfe") { // nach einem Fehler: kurze Ermutigung (in den Spielen humorvoll), dann „Ich helfe dir“
      fehlerSerie++; comboBruch();
      text = `${ruf(imSpiel && RUF.spiel ? "spiel" : "fehler")} ${text}`;
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
    sperrt(weiter);
    const wahl = el("div", { class: "wahl", role: "group", "aria-label": "Verbform wählen" },
      mischen([a.richtig, ...a.falsch]).map((form) => el("button", { class: "knopf wahl-knopf", lang: "en", onclick: (e) => {
        if (geloest) return;
        if (form === a.richtig) {
          geloest = true;
          e.currentTarget.classList.add("richtig");
          satz.replaceChildren(...[].concat(lueckenSatz(s, false)));
          melde(box, "gut", lob());
          entsperrt(weiter);
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
          if (sperre_) sperre_.bereit();
        } }, inhalt));
      return el("div", { class: "wahl", role: "group", "aria-label": label }, knoepfe);
    }

    // 💡 pro Aussage mit Hinweis: erst nach dem ersten kompletten Durchgang sichtbar (kein Spoiler vor dem Hören);
    // antippen zeigt den Hinweis und kostet den „Ohne Hilfe“-Bonus (lage.hilfe)
    const hilfeKnoepfe = [];
    function hilfeKnopf(a) {
      const text = el("p", { class: "hinweis hv-hinweis", hidden: true }, "💡 " + a.hinweis);
      const k = el("button", { class: "knopf leise klein-knopf hv-hilfe", hidden: true, "aria-label": "Hilfe zu dieser Aussage",
        onclick: () => { lage.hilfe = true; text.hidden = false; k.disabled = true; } }, "💡");
      hilfeKnoepfe.push(k);
      return [k, text];
    }
    const zeilen = u.aufgaben.map((a, i) => {
      if (tf) {
        const [k, hinweis] = a.hinweis ? hilfeKnopf(a) : [null, null];
        return el("li", { class: "hv-zeile" },
          el("div", { class: "hv-kopf" }, el("p", { class: "hv-aussage", lang: "en" }, el("span", { class: "hv-nr" }, i + 1 + ". "), a.aussage), k),
          hinweis,
          umschalter([["true", "true"], ["false", "false"]], (w) => { antworten[i] = w; }, "true oder false"),
          el("p", { class: "rueckmeldung", hidden: true }));
      }
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
    // Sperre (30.10.2026, Mr. Alex): „Lösung zeigen“ erst nach zwei ganzen Hör-Durchgängen UND wenn jede Aufgabe eine Antwort hat –
    // im Programm (GESPERRT + Prüfung in loesen), nicht nur am versteckten Knopf.
    const offenZahl = () => (tf ? antworten.filter((a) => a === null).length : antworten.filter((a) => !a.mittel || !a.gefuehl).length);
    const sperre_ = arbeitsSperre(loesungKnopf, { offen: () => {
      if (durchgaenge < 2) return true; // Hinweis steht schon darunter („… zweimal ganz gehört …“)
      const n = offenZahl();
      return !n ? "" : tf ? `✏️ Kreuze bei jeder Aussage etwas an (noch ${n}).` : `✏️ Wähl bei jeder Person beides aus: wie sie hinkommt und ob der Weg gut ist (noch ${n}).`;
    } });
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
        hilfeKnoepfe.forEach((k) => { k.hidden = false; });
        zaehler.textContent = durchgaenge === 1 ? "1. Durchgang geschafft! Hör den Text ein zweites Mal."
          : `${durchgaenge} Durchgänge gehört.`;
        hoerKnopf.textContent = durchgaenge === 1 ? "▶ Noch mal hören (2. Durchgang)" : "▶ Noch mal hören (Übung)";
        if (durchgaenge >= 2) { gln.hidden = false; warten.hidden = true; if (!geloest) loesungKnopf.hidden = false; }
        if (!geloest) sperre_.bereit();
      });
    }

    async function loesen() {
      if (geloest || !sperre_.bereit()) return;
      sperre_.ende();
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
      if (richtig < u.aufgaben.length) lage.hilfe = true; // +5 „ohne Hilfe“ nur, wenn alles richtig ist (30.10.)
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
      el("section", { class: "satzkarte" }, gln, sperre_.uhr, el("div", { class: "knopfreihe" }, loesungKnopf), ergebnis,
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
    sperrt(weiter);
    const hoeren = () => spiele([s.audio.en]);
    const wahl = el("div", { class: "wahl", role: "group", "aria-label": "Antwort wählen" },
      (a.korrektur ? a.optionen : mischen(a.optionen)).map((o) => el("button", { class: "knopf wahl-knopf", lang: "en", onclick: (e) => {
        if (geloest) return;
        if (o === a.richtig) {
          geloest = true;
          e.currentTarget.classList.add("richtig");
          melde(box, "gut", lob() + (a.korrektur ? (a.frage === s.en ? " Der Satz stimmt." : " So ist es richtig:") : ""));
          loesungZeile.hidden = false;
          entsperrt(weiter); lage.weiter = naechstes; lage.abspielen = hoeren;
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
    const weiter = knopf("Weiter ➜", () => { if (sperre_.bereit()) naechstes(); }, "haupt");
    // Denkzeit-Sperre (30.10.2026, Mr. Alex): Durchprobieren kostet nichts – darum „Weiter“ erst nach 2,5 s je Wort ab Start des Teils
    // und erst, wenn alle Wörter liegen. Jeder Fehlversuch kostet den „Ohne Hilfe“-Bonus (lage.hilfe).
    const sperre_ = arbeitsSperre(weiter, { sek: woerter.length * QUIZ_MIN * eile(), start: lage.start,
      zeitText: (z) => `🤔 Überleg in Ruhe: Was kommt zuerst? „Weiter“ geht in ${z}.`,
      offen: () => (naechster < woerter.length ? `✏️ Tipp alle Wörter der Reihe nach an (noch ${woerter.length - naechster}).` : "") });
    const alle = () => spiele(woerter.map((w) => w.audio.en));
    const knoepfe = mischen(woerter).map((w) => el("button", { class: "knopf wahl-knopf", lang: "en", onclick: (e) => {
      if (naechster >= woerter.length) return;
      if (w === woerter[naechster]) {
        const platz = reihe.children[naechster];
        platz.textContent = ""; platz.append(el("span", { class: "punkte", "aria-hidden": "true" }, w.symbol || ""), " " + w.en);
        platz.classList.add("voll");
        e.currentTarget.hidden = true;
        box.hidden = true;
        spiele([w.audio.en]);
        if (++naechster === woerter.length) {
          melde(box, "gut", lob());
          sperre_.bereit(); lage.weiter = () => { if (sperre_.bereit()) naechstes(); }; lage.abspielen = alle;
          setTimeout(alle, 900);
        }
      } else {
        lage.hilfe = true; // Fehlversuch: kein +5 „ohne Hilfe“ (30.10.)
        melde(box, "hilfe", `Ich helfe dir: ${teil.hilfe} Probier's nochmal!`);
      }
    } }, w.en));
    lage.abspielen = null;
    zeige(kopf(st),
      el("p", { class: "ansage" }, "Bring die Wörter in die richtige Reihenfolge: von „nie“ bis „immer“. Tipp sie nacheinander an!"),
      karte(teil, null, reihe, el("div", { class: "wahl" }, knoepfe), box, sperre_.uhr, el("div", { class: "knopfreihe" }, weiter)));
  }

  /* ---------- 🏁 Road to GLN: zwei neue Übungen (11.11.2026) ----------
     textfolge = Lesen „Reihenfolge“: Text lesen, acht Ereignisse der Reihe nach antippen (Lesezeit-Sperre wie bei Lesen).
     woche = Schreiben „…'s week“: aus Kalender-Notizen Sätze bauen; Satzanfang vorgegeben. Ohne ⌨️ (G-Kurs): Bausteine der Reihe nach antippen,
     ein Ablenker ist das Verb ohne -s. Mit ⌨️ (E-Kurs): Satz zu Ende tippen – geprüft werden Verbform mit -s und Schlüsselwörter, 1 Tippfehler je Wort
     ist erlaubt; nach drei Versuchen kommt der Mustersatz. Beide haben zwei Varianten, die sich bei jedem Durchgang abwechseln (stand.var[Teilschlüssel]). */
  function varianteVon(liste) {
    const k = teilSchluessel(lage.teil), n = (stand.var && stand.var[k]) || 0;
    return { v: liste[n % liste.length], gemacht: () => { (stand.var = stand.var || {})[k] = n + 1; } };
  }
  function zeigeTextfolge(teil) {
    const st = station(lage.nr), { v, gemacht } = varianteVon(teil.texte), ev = v.ereignisse;
    let naechster = 0;
    const box = rueckmeldung();
    const reihe = el("ol", { class: "reihe folge", "aria-label": "Deine Reihenfolge" }, ev.map((_, i) => el("li", { class: "platz" }, `${i + 1}.`)));
    const weiter = knopf("Weiter ➜", () => { if (sperre_.bereit()) naechstes(); }, "haupt");
    const sperre_ = arbeitsSperre(weiter, { sek: (v.text.split(/\s+/).length / LESE_WPM * 60 + ev.length * LESE_JE_AUSSAGE) * eile(), start: lage.start,
      zeitText: (z) => `📖 Lies erst den Text genau. „Weiter“ geht in ${z}.`,
      offen: () => (naechster < ev.length ? `✏️ Tipp die Ereignisse der Reihe nach an (noch ${ev.length - naechster}).` : "") });
    const knoepfe = mischen(ev).map((e) => el("button", { class: "knopf wahl-knopf folge-knopf", lang: "en", onclick: (x) => {
      if (naechster >= ev.length) return;
      if (e === ev[naechster]) {
        const platz = reihe.children[naechster];
        platz.textContent = ""; platz.append(el("span", { class: "punkte", "aria-hidden": "true" }, e.symbol), ` ${naechster + 1}. ${e.satz}`);
        platz.classList.add("voll"); x.currentTarget.hidden = true; box.hidden = true;
        if (++naechster === ev.length) { gemacht(); melde(box, "gut", lob()); sperre_.bereit(); lage.weiter = () => { if (sperre_.bereit()) naechstes(); }; }
      } else {
        lage.hilfe = true; // Fehlversuch: kein „Ohne Hilfe“-Bonus
        melde(box, "hilfe", naechster === 0 ? "Lies den Anfang noch einmal: Was passiert zuerst?" : `Schau im Text nach: Was passiert nach „${ev[naechster - 1].satz}“?`);
      }
    } }, el("span", { "aria-hidden": "true" }, e.symbol), " " + e.satz));
    const hoeren = v.audio ? () => spiele([v.audio]) : null;
    lage.abspielen = hoeren;
    zeige(kopf(st),
      el("p", { class: "ansage" }, "Lies den Text. Bring dann die acht Ereignisse in die richtige Reihenfolge: Tipp sie nacheinander an!"),
      karte(teil, null, el("h2", { lang: "en" }, v.titel), el("div", { class: "lesetext", lang: "en" }, el("p", {}, v.text)),
        hoeren && el("div", { class: "knopfreihe" }, knopf("🔊 Text anhören", hoeren, "leise")),
        el("p", { class: "klein" }, "What happens first? What happens next?"), el("div", { class: "wahl folge-wahl" }, knoepfe), reihe, box, sperre_.uhr, el("div", { class: "knopfreihe" }, weiter)));
  }
  // Getippter Satz (E-Kurs): Verb mit -s und Schlüsselwörter; gibt { ok } oder { hinweis } zurück
  function wochePruefen(text, s) {
    const w = normT(text).split(" ");
    const nah = (ziel) => w.some((x) => (ziel.length <= 3 ? x === ziel : abstand(x, ziel) <= 1));
    const verbOk = w.some((x) => x === s.verb || (s.verb.length > 3 && x !== s.falsch && x.endsWith("s") && abstand(x, s.verb) <= 1));
    if (!verbOk) return { hinweis: w.includes(s.falsch) ? (s.verb === "is" ? "Eine Person: is, nicht are." : `he / she / it – das s muss mit: Wie heißt „${s.falsch}“ mit he/she/it?`)
      : `Dein Satz braucht das Verb „${s.falsch}“ – in der Form für he / she / it.` };
    const fehlt = s.schluessel.filter((k) => !nah(k));
    if (fehlt.length) return { hinweis: `Schau in den Kalender – es fehlt noch: ${fehlt.join(", ")}.` };
    return { ok: true };
  }
  function zeigeWoche(teil) {
    const st = station(lage.nr), { v, gemacht } = varianteVon(teil.wochen), N = v.saetze.length;
    let i = 0;
    const box = rueckmeldung(), bereich = el("div", { class: "woche-bereich" });
    const text = el("ol", { class: "woche-text", lang: "en", "aria-label": "Dein Text" });
    const weiter = knopf("Weiter ➜", () => { if (sperre_.bereit()) naechstes(); }, "haupt");
    const sperre_ = arbeitsSperre(weiter, { sek: N * 2 * QUIZ_MIN * eile(), start: lage.start,
      zeitText: (z) => `✍️ Schreib in Ruhe. „Weiter“ geht in ${z}.`, offen: () => (i < N ? `✏️ Noch ${N - i} ${N - i === 1 ? "Satz" : "Sätze"}.` : "") });
    const muster = (s) => `${s.anfang} ${s.teile.join(" ")}.`;
    function geschafft(s, hinweis) {
      text.append(el("li", {}, muster(s)));
      if (++i < N) { aufgabe(); if (hinweis) melde(box, "hilfe", hinweis); return; }
      gemacht(); bereich.replaceChildren(); melde(box, "gut", (hinweis ? hinweis + " " : "") + lob() + ` Das ist dein Text über ${v.person}'s week.`);
      sperre_.bereit(); lage.weiter = () => { if (sperre_.bereit()) naechstes(); };
    }
    function aufgabe() {
      const s = v.saetze[i];
      box.hidden = true;
      const kopfzeile = el("p", { class: "klein" }, `Satz ${i + 1} von ${N}`);
      if (tippen()) { // E-Kurs: Satz zu Ende tippen
        let versuche = 0;
        const feld = tippFeld((eingabe, ui) => {
          const r = wochePruefen(eingabe, s);
          if (r.ok) return geschafft(s);
          lage.hilfe = true;
          if (++versuche >= 3) return geschafft(s, `So geht der Satz: ${muster(s)}`);
          melde(box, "hilfe", r.hinweis); ui.feld.focus();
        });
        bereich.replaceChildren(kopfzeile, el("p", { class: "woche-satz", lang: "en" }, el("strong", {}, s.anfang), " …"),
          el("p", { class: "klein" }, "Schreib den Satz zu Ende. Denk an he / she / it + s!"), feld);
        return;
      }
      let n = 0; // G-Kurs: Bausteine der Reihe nach antippen
      const zeile = el("p", { class: "woche-satz", lang: "en" }, el("strong", {}, s.anfang), " ");
      const steine = mischen([...s.teile, s.falsch]).map((t) => el("button", { class: "knopf wahl-knopf", lang: "en", onclick: (x) => {
        if (n >= s.teile.length) return;
        if (t === s.teile[n]) {
          zeile.append(el("span", { class: "woche-stein" }, t), " "); x.currentTarget.hidden = true; box.hidden = true;
          if (++n === s.teile.length) geschafft(s);
        } else {
          lage.hilfe = true;
          melde(box, "hilfe", t === s.falsch ? (s.verb === "is" ? "Eine Person: is, nicht are." : "he / she / it – das s muss mit!")
            : n === 0 ? "Wer macht etwas? Fang mit der Person an." : "Reihenfolge im Satz: wer? – macht – was? – wo? – wann?");
        }
      } }, t));
      bereich.replaceChildren(kopfzeile, zeile, el("div", { class: "wahl" }, steine));
    }
    lage.abspielen = null;
    aufgabe();
    zeige(kopf(st),
      el("p", { class: "ansage" }, tippen() ? `Das ist der Kalender von ${v.person}. Schreib über die Woche: Der Satzanfang steht schon da.`
        : `Das ist der Kalender von ${v.person}. Bau die Sätze: Tipp die Bausteine in der richtigen Reihenfolge an. (Mit ⌨️ oben kannst du selbst schreiben.)`),
      karte(teil, null, el("h2", { lang: "en" }, v.titel),
        el("div", { class: "woche-kalender", lang: "en" }, v.kalender.map((k) => el("div", { class: "woche-tag" },
          el("strong", {}, k.tag), el("span", { class: "woche-sym", "aria-hidden": "true" }, k.symbol), el("span", {}, k.notiz), el("span", { class: "klein" }, "🕒 " + k.wann),
          k.warum ? el("span", { class: "klein" }, "💚 " + k.warum) : null))),
        text, bereich, box, sperre_.uhr, el("div", { class: "knopfreihe" }, weiter)));
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
          bereit();
        } }, o));
      return el("li", { class: "hv-zeile" },
        el("p", { class: "hv-aussage", lang: "en" }, el("span", { class: "hv-nr" }, i + 1 + ". "), D.saetze[a.satz].en),
        el("div", { class: "wahl", role: "group", "aria-label": "Antwort" }, knoepfe),
        el("p", { class: "rueckmeldung", hidden: true }));
    });
    const ergebnis = el("div", { class: "rueckmeldung", hidden: true, role: "status" });
    const loesungKnopf = sperrt(knopf("Lösung zeigen", loesen, "haupt"));
    const weiter = knopf("Weiter ➜", naechstes, "haupt");
    weiter.hidden = true;
    // Lesezeit-Sperre (30.10.2026, Mr. Alex): „Lösung zeigen“ erst nach einer realistischen Lesezeit (80 Wörter pro Minute für den Text
    // + 3 s je Aussage) und erst, wenn jede Aussage eine Antwort hat. Die Sperre sitzt im Programm (GESPERRT + Prüfung in loesen).
    const woerterImText = text.en.split(/\s+/).filter(Boolean).length;
    const leseSek = Math.ceil((woerterImText / LESE_WPM * 60 + teil.aufgaben.length * LESE_JE_AUSSAGE) * eile());
    const leseStart = monoton();
    const uhr = el("p", { class: "klein lese-uhr", role: "status" });
    const restSek = () => Math.max(0, Math.ceil(leseSek - (monoton() - leseStart) / 1000));
    function bereit() {
      if (geloest) return false;
      const rest = restSek(), offen = antworten.filter((a) => a === null).length;
      if (rest > 0) uhr.textContent = `📖 Lies erst den Text genau. „Lösung zeigen“ geht in ${Math.floor(rest / 60)}:${String(rest % 60).padStart(2, "0")}.`;
      else if (offen) uhr.textContent = `✏️ Kreuze bei jeder Aussage etwas an (noch ${offen}).`;
      else uhr.textContent = "";
      const ok = rest === 0 && offen === 0;
      if (ok) entsperrt(loesungKnopf); else sperrt(loesungKnopf);
      return ok;
    }
    const leseUhr = setInterval(() => { if (!uhr.isConnected && monoton() - leseStart > 2000) return clearInterval(leseUhr); bereit(); }, 500);
    bereit();
    async function loesen() {
      if (geloest || !bereit()) return;
      clearInterval(leseUhr); uhr.textContent = "";
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
      if (richtig < teil.aufgaben.length) lage.hilfe = true; // +5 „ohne Hilfe“ nur, wenn alles richtig ist (30.10.)
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
      el("section", { class: "satzkarte" }, uhr, el("div", { class: "knopfreihe" }, loesungKnopf, weiter), ergebnis));
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
    sperrt(weiter);
    const hoeren = () => spiele([ziel.audio]);
    const wahl = el("div", { class: "wahl", role: "group", "aria-label": "Welches Wort?" },
      r.paar.optionen.map((o) => el("button", { class: "knopf wahl-knopf gross", lang: "en", onclick: (e) => {
        if (geloest) return;
        if (o === ziel) {
          geloest = true; e.currentTarget.classList.add("richtig");
          melde(box, "gut", lob()); entsperrt(weiter); lage.weiter = naechstes;
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

  /* ---------- Station 5 „Spiele“: Lernspiele wie die Games-Kachel in Klasse 9 (docs/spiele/konzept-entwurf.md) ----------
     Frei spielbar, keine Teile, kein Häkchen, zählt nicht für „All stations“. Je Spiel +10 Punkte beim ersten Erfolg des Tages
     (Tagesmarken gym.memoryTag / catchTag / beeTag / detektivTag). Memory, Catch the Word und Spelling Bee nehmen die
     Wörter eines Abschnitts aus Station 7 (Vokabeln); der -s-Detektiv baut seine Sätze aus festen Bausteinen (D.stationen[5].detektiv). */
  let imSpiel = false; // für die humorvollen Sprüche (lob.tsv, Art „spiel“) in melde()
  const ansage = (en, de) => el("p", { class: "ansage" }, el("strong", { lang: "en" }, en), " ", de);
  const spielKopf = (titel, zurueckFn) => el("header", { class: "kopf" },
    knopf("← Zurück", zurueckFn, "leise"), el("h1", {}, `🎲 Spiele · ${titel}`));
  const spielWort = (v) => (v.form || v.en).replace(/\s+/g, " ").trim(); // Grundform ohne „(to)“, Klammern, Zweitformen
  const memKurz = (de) => de.replace(/\(.*?\)/g, "").split(/[;,]/)[0].replace(/\s+/g, " ").trim(); // erst Klammern weg („die (Wand-, Turm)uhr“), dann die erste Bedeutung
  const memOk = (v) => v && memKurz(v.de).length > 0 && memKurz(v.de).length <= 24 && spielWort(v).length <= 24;
  const catchOk = (v) => v && spielWort(v).length >= 2 && spielWort(v).length <= 24;
  const beeOk = (v) => { if (!v || !v.tippbar) return false; const t = spielWort(v); return t.length >= 2 && t.length <= 20 && t.split(" ").length <= 3 && !/[()…,/]/.test(t); };
  const spielTag = () => iso(heute());
  // Punkte einmal pro Tag und Spiel: Tagesmarke setzen, Text für die Rückmeldung
  function spielPunkte(marke, geschafft) {
    const g = gymStand(), tag = spielTag(), punkte = geschafft && g[marke] !== tag;
    if (punkte) { g[marke] = tag; punkteDazu(PUNKTE.spiel, { art: "m", bonus: true }); } else speichern();
    return punkte ? ` +${PUNKTE.spiel} ⭐` : geschafft && g[marke] === tag ? " (Punkte gibt es einmal pro Tag.)" : "";
  }
  function zeigeSpiele() {
    const st = station(5);
    lage = null;
    const kachel = (sym, titel, unter, fn) => el("button", { class: "kachel", onclick: fn, "aria-label": titel },
      el("span", { class: "sym", "aria-hidden": "true" }, sym), el("span", { class: "titel", lang: "en" }, titel), el("span", { class: "unter" }, unter));
    zeige(el("header", { class: "kopf" }, knopf("← Start", startseite, "leise"), el("h1", {}, `Station ${st.nr}: ${st.titel}`), hwBei(st.nr) && hwSchild(), glnBei(st.nr) && glnSchild()),
      ansage("Choose a game.", "Wähl ein Spiel. Jedes Spiel bringt dir einmal am Tag 10 Punkte."),
      el("nav", { class: "kacheln gruppen", "aria-label": "Spiele" },
        kachel("🎲", "Memory", "Wort und Bedeutung finden – 6 Paare", () => spielWahl("Memory", spielMemory)),
        kachel("🎯", "Catch the Word", "Wort hören und fangen, bevor es unten ist", () => spielWahl("Catch the Word", spielCatch)),
        kachel("🐝", "Spelling Bee", "Wort hören und richtig schreiben", () => spielWahl("Spelling Bee", spielBee)),
        kachel("🔎", "-s-Detektiv", "Fehlt ein -s? Finde es und repariere den Satz", spielDetektiv),
        el("button", { class: "kachel runner-kachel", onclick: () => runnerStart(), "aria-label": "London Run" },
          el("span", { class: "sym", "aria-hidden": "true" }, "🇬🇧"), el("span", { class: "titel", lang: "en" }, "London Run"),
          el("span", { class: "unter" }, `Jump'n'Run · 🎟️ Ticket ${RUNNER.preis} 🪙`)),
        el("button", { class: "kachel shop-kachel", onclick: () => shop(), "aria-label": "Shop" },
          el("span", { class: "sym", "aria-hidden": "true" }, "🛍️"), el("span", { class: "titel", lang: "en" }, "Shop"),
          el("span", { class: "unter" }, `🪙 ${spielstand().coins} Coins – Rahmen und mehr`))));
    imSpiel = true;
  }
  // Abschnitt aus Station 7 wählen (Kacheln wie in Vocabulary), dann das Spiel mit diesen Wörtern
  function spielWahl(titel, spiel) {
    const st = station(7);
    lage = null;
    zeige(spielKopf(titel, zeigeSpiele),
      ansage("Which words do you want to play with?", "Mit welchen Wörtern willst du spielen? Wähl einen Abschnitt."),
      el("nav", { class: "kacheln gruppen", "aria-label": "Abschnitte" }, st.gruppen.map((g, i) =>
        el("button", { class: "kachel", onclick: () => spiel(i), "aria-label": `${g.name}, ${g.vokabeln.length} Wörter` },
          el("span", { class: "nr" }, `${g.vokabeln.length} Wörter`),
          el("span", { class: "titel" }, g.name),
          el("span", { class: "vorschau", "aria-hidden": "true" }, g.vokabeln.slice(0, 5).map((id) => vokabel(id).symbol).join(" "))))));
    imSpiel = true;
  }
  const zuWenig = (titel, zurueckFn) => zeige(spielKopf(titel, zurueckFn), el("section", { class: "satzkarte" },
    el("p", {}, "Für dieses Spiel passen zu wenige Wörter aus dem Abschnitt – wähl einen anderen."),
    knopf("Andere Wörter", zurueckFn, "haupt")));

  /* Memory: englisches Wort ↔ deutsche Bedeutung, 6 Paare, alle Karten auf einen Blick (.memory.gross).
     Wörter mit Symbol zeigen es auf der englischen Karte. Beim Aufdecken hört man das englische Wort. */
  function memoryFeld(ws, fertigText) { // fertigText(): Zusatz zur Schlussmeldung (Word Gym: eigene Tagesmarke), sonst Spiele-Punkte
    const karten = mischen(ws.flatMap((v) => [{ v, art: "en" }, { v, art: "de" }]));
    let offen = [], gefunden = 0, zuege = 0, wartet = false;
    const box = rueckmeldung();
    const zaehler = el("p", { class: "klein", "aria-live": "polite" }, "Züge: 0");
    const feld = el("div", { class: "memory gross" }, karten.map((c) => {
      const b = el("button", { class: "mem-karte", "aria-label": "Verdeckte Karte", onclick: () => {
        if (wartet || b.classList.contains("auf")) return;
        b.classList.add("auf");
        const text = c.art === "en" ? spielWort(c.v) : memKurz(c.v.de);
        b.replaceChildren(...[c.art === "en" && c.v.symbol && el("span", { class: "mem-sym", "aria-hidden": "true" }, c.v.symbol),
          el("span", { lang: c.art, class: text.length > 11 ? "mem-lang" : "" }, text)].filter(Boolean));
        b.setAttribute("aria-label", text);
        if (c.art === "en") spiele([c.v.audio.en]);
        offen.push({ b, c });
        if (offen.length < 2) return;
        zuege++; zaehler.textContent = "Züge: " + zuege;
        const [x, y] = offen; offen = [];
        if (x.c.v === y.c.v && x.c.art !== y.c.art) {
          x.b.classList.add("paar"); y.b.classList.add("paar"); x.b.disabled = y.b.disabled = true;
          if (++gefunden === ws.length) melde(box, "gut", `${lob(true)} Alle ${ws.length} Paare in ${zuege} Zügen!${fertigText ? fertigText() : spielPunkte("memoryTag", true)}`);
        } else {
          wartet = true;
          setTimeout(() => {
            if (Math.random() < 0.3) ruf("spiel"); // ab und zu ein humorvoller Kommentar
            [x, y].forEach(({ b: k }) => { k.classList.remove("auf"); k.replaceChildren("?"); k.setAttribute("aria-label", "Verdeckte Karte"); });
            wartet = false;
          }, 1300);
        }
      } }, "?");
      return b;
    }));
    return { feld, zaehler, box };
  }
  function spielMemory(i) {
    const g = station(7).gruppen[i], zurueckFn = () => spielWahl("Memory", spielMemory);
    const ws = mischen(g.vokabeln.map(vokabel).filter(memOk)).slice(0, 6);
    lage = null;
    if (ws.length < 3) return zuWenig("Memory", zurueckFn);
    const m = memoryFeld(ws);
    zeige(spielKopf("Memory", zurueckFn),
      ansage("Find the pairs!", `${g.name}: Finde die Paare – englisches Wort und deutsche Bedeutung.`),
      karte(null, null, m.feld, m.zaehler, m.box, el("div", { class: "knopfreihe" },
        knopf("↻ Neu mischen", () => spielMemory(i)), knopf("Andere Wörter", zurueckFn), knopf("Zur Startseite", startseite, "leise"))));
    imSpiel = true;
  }

  /* Catch the Word: ein Wort wird gesprochen, 4–6 Wörter des Abschnitts fallen, das richtige antippen.
     10 Runden, 3 Leben: falsches Wort angetippt oder das richtige durchgefallen kostet eins. Treffer = kurzer Klang, dann die deutsche Bedeutung.
     Punkte (+10) beim ersten Durchgang des Tages mit mindestens 7 Treffern (Tagesmarke gym.catchTag). */
  const CATCH = { leben: 3, runden: 10, tempo: 22, ziel: 7 };
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
  function spielCatch(i) {
    lage = null; stopp();
    const gruppe = station(7).gruppen[i];
    const ws = gruppe.vokabeln.map(vokabel).filter(catchOk);
    let laeuft = true;
    const zurueckFn = () => { laeuft = false; stopp(); spielWahl("Catch the Word", spielCatch); };
    if (ws.length < 4) return zuWenig("Catch the Word", zurueckFn);
    let ziele = [];
    while (ziele.length < CATCH.runden) ziele.push(...mischen(ws));
    ziele = ziele.slice(0, CATCH.runden);
    let leben = CATCH.leben, treffer = 0, runde = 0, ziel = null, offen = [], pause = false, zeitstempel = null;
    const himmel = el("div", { class: "spiel-himmel", role: "group", "aria-label": "Catch the Word" });
    const stand_ = el("p", { class: "spiel-stand", "aria-live": "polite" });
    const info = el("p", { class: "catch-info", role: "status", hidden: true });
    const box = rueckmeldung();
    const zeigeStand = () => stand_.replaceChildren(el("span", {}, "❤️".repeat(leben) + "🖤".repeat(Math.max(0, CATCH.leben - leben))),
      el("span", {}, `Runde ${Math.min(runde, CATCH.runden)} / ${CATCH.runden} · ✓ ${treffer}`));
    const hoeren = () => { if (ziel && laeuft) spiele([ziel.audio.en]); };
    const hoerKnopf = knopf("🔊 Noch mal hören", hoeren);
    function raeume() { offen.forEach((w) => { w.fertig = true; w.el.classList.add("weg"); setTimeout(() => w.el.remove(), 700); }); offen = []; }
    function naechsteRunde() {
      if (!laeuft) return;
      if (runde >= CATCH.runden) return ende();
      ziel = ziele[runde++]; info.hidden = true; pause = false;
      const andere = mischen(ws.filter((v) => v !== ziel)).slice(0, 3 + Math.floor(Math.random() * 3));
      const reihe = mischen([ziel, ...andere]);
      reihe.forEach((v, j) => {
        // Spalten gleichmäßig über die Breite, Höhe versetzt (3 Reihen), damit auch lange Wörter sich nicht überdecken
        const w = { v, y: -40 - (j % 3) * 64 - Math.random() * 16, x: Math.min(92, Math.max(8, (j + 0.5) / reihe.length * 100 + (Math.random() - 0.5) * 10)) };
        w.el = el("button", { class: "spiel-wort catch-wort", lang: "en", style: `left:${w.x}%; top:${w.y}px`, onclick: () => fange(w) }, spielWort(v));
        himmel.append(w.el); offen.push(w);
        // Lange Wörter ganz ins Bild rücken (links/rechts nicht abschneiden)
        const breite = himmel.clientWidth, halb = w.el.offsetWidth / 2 + 4;
        if (breite && halb * 2 < breite) w.el.style.left = Math.min(breite - halb, Math.max(halb, w.x / 100 * breite)) + "px";
      });
      zeigeStand(); hoeren();
    }
    const bedeutung = (v) => [el("strong", { lang: "en" }, spielWort(v)), " = ", el("span", { lang: "de" }, memKurz(v.de) || v.de)];
    function fange(w) {
      if (!laeuft || pause || w.fertig) return;
      if (w.v === ziel) {
        treffer++; w.fertig = true; pause = true; richtigSerie++;
        w.el.classList.add("treffer"); trefferKlang();
        info.hidden = false; info.replaceChildren(...bedeutung(ziel));
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
      info.hidden = false; info.replaceChildren("Das war: ", ...bedeutung(ziel));
      zeigeStand();
      if (leben <= 0) return ende();
      setTimeout(() => { raeume(); naechsteRunde(); }, 1600);
    }
    function schritt(t) {
      if (!laeuft) return;
      if (zeitstempel === null) zeitstempel = t;
      const dt = Math.min(0.05, (t - zeitstempel) / 1000); zeitstempel = t;
      const tempo_ = CATCH.tempo * (1 + treffer * 0.06) * ((LOKAL && window.__catchTempo) || 1);
      const boden = himmel.clientHeight;
      if (!pause) offen.forEach((w) => {
        if (w.fertig) return;
        w.y += tempo_ * dt; w.el.style.top = w.y + "px";
        if (w.y > boden - 10) durchgefallen(w);
      });
      requestAnimationFrame(schritt);
    }
    function ende() {
      if (!laeuft) return;
      laeuft = false; pause = true; hoerKnopf.disabled = true;
      offen.forEach((w) => { if (!w.fertig) { w.fertig = true; w.el.classList.add("weg"); } });
      const geschafft = leben > 0 && treffer >= CATCH.ziel;
      const text = geschafft ? `${lob(true)} ${treffer} von ${CATCH.runden} Wörtern gefangen!${spielPunkte("catchTag", true)}`
        : leben <= 0 ? `Alle Leben weg! ${treffer} gefangen. Hör genau hin und versuch es noch mal.`
        : `${treffer} von ${CATCH.runden} gefangen. Für Punkte brauchst du ${CATCH.ziel}. Noch mal?`;
      if (!geschafft) speichern();
      melde(box, geschafft ? "gut" : "neutral", text);
    }
    zeigeStand();
    zeige(spielKopf("Catch the Word", zurueckFn),
      ansage("Listen! Which word did you hear?", "Hör zu! Welches Wort hast du gehört? Tipp es an, bevor es unten ist."),
      el("section", { class: "satzkarte catch" }, stand_, info, himmel, el("div", { class: "knopfreihe" }, hoerKnopf), box,
        el("div", { class: "knopfreihe" }, knopf("↻ Noch mal", () => spielCatch(i)), knopf("Andere Wörter", zurueckFn), knopf("Zur Startseite", startseite, "leise"))));
    imSpiel = true;
    naechsteRunde();
    requestAnimationFrame(schritt);
  }

  /* Spelling Bee: Wort hören, deutsche Bedeutung (bei Bildwörtern das Symbol groß) lesen, englisch eintippen (1-Fehler-Toleranz).
     8 tippbare Wörter des Abschnitts. 3 richtig in Folge = 🍯 Honey! Punkte (+10) beim ersten Durchgang des Tages mit mindestens 6 richtigen (gym.beeTag). */
  const BEE = { anzahl: 8, honig: 3 };
  function spielBee(i) {
    lage = null;
    const gruppe = station(7).gruppen[i], zurueckFn = () => spielWahl("Spelling Bee", spielBee);
    const ws = mischen(gruppe.vokabeln.map(vokabel).filter(beeOk)).slice(0, BEE.anzahl);
    if (ws.length < 4) return zuWenig("Spelling Bee", zurueckFn);
    const ziel = Math.ceil(ws.length * 0.75);
    let pos = 0, richtig = 0, serie = 0;
    const stand_ = el("p", { class: "spiel-stand", "aria-live": "polite" });
    const frage = el("div", { class: "bee-frage" });
    const box = rueckmeldung();
    const bereich = el("div", { class: "bee-eingabe" });
    const weiter = el("button", { class: "knopf haupt weiter", hidden: true, onclick: () => { pos++; zeigeWort(); } }, "Weiter ➜");
    const hoerKnopf = knopf("🔊 Noch mal hören", () => { if (pos < ws.length) spiele([ws[pos].audio.en]); });
    const zeigeStand = () => stand_.replaceChildren(el("span", {}, `Wort ${Math.min(pos + 1, ws.length)} / ${ws.length}`), el("span", {}, `✓ ${richtig}` + (serie >= 2 ? ` · 🐝 ${serie}` : "")));
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
      frage.replaceChildren(...[v.bild && v.symbol && el("div", { class: "vok-bild", "aria-hidden": "true" }, v.symbol), el("p", { class: "vok-de", lang: "de" }, v.de)].filter(Boolean));
      const feld = tippFeld((text, ui) => {
        ui.feld.disabled = true; ui.knopf.hidden = true;
        const stufe = pruefeTipp(text, [wort]);
        if (stufe === 2) { serie = 0; melde(box, "hilfe", `Nicht ganz. So schreibt man es: ${wort}`); }
        else { richtig++; serie++; tippRueckmeldung(box, stufe, wort); if (serie % BEE.honig === 0) honig(); }
        zeigeStand(); weiter.hidden = false; weiter.focus();
      });
      bereich.replaceChildren(feld); zeigeStand();
      spiele([v.audio.en]);
      feld.querySelector("input").focus({ preventScroll: true });
    }
    function ende() {
      hoerKnopf.disabled = true; bereich.replaceChildren(); frage.replaceChildren();
      const geschafft = richtig >= ziel;
      const text = geschafft ? `${lob(true)} ${richtig} von ${ws.length} Wörtern richtig geschrieben!${spielPunkte("beeTag", true)}`
        : `${richtig} von ${ws.length} richtig. Für Punkte brauchst du ${ziel}. Noch mal?`;
      melde(box, geschafft ? "gut" : "neutral", text);
    }
    const karteEl = el("section", { class: "satzkarte bee" }, stand_, frage, el("div", { class: "knopfreihe" }, hoerKnopf), bereich, box,
      el("div", { class: "knopfreihe" }, weiter),
      el("div", { class: "knopfreihe" }, knopf("↻ Noch mal", () => spielBee(i)), knopf("Andere Wörter", zurueckFn), knopf("Zur Startseite", startseite, "leise")));
    zeige(spielKopf("Spelling Bee", zurueckFn),
      ansage("Listen and spell the word.", "Hör zu und schreib das Wort. Ein kleiner Fehler ist okay – du siehst dann die genaue Schreibweise."),
      karteEl);
    imSpiel = true;
    zeigeWort();
  }

  /* -s-Detektiv: fehlendes -s finden und reparieren (nur lesen). 8 Sätze aus festen Bausteinen (4 falsch, 2 he/she/it richtig, 2 I/you/we/they).
     Ein Satz zählt, wenn er ohne Hilfe gelöst wird. Punkte (+10) beim ersten Durchgang des Tages mit mindestens 6 richtigen (gym.detektivTag). */
  const DETEKTIV_ZIEL = 6;
  function spielDetektiv() {
    lage = null;
    const d = station(5).detektiv;
    const he = d.personen.filter((p) => p[1]), ich = d.personen.filter((p) => !p[1]);
    const verben = mischen(d.verben);
    const plan = mischen([...Array(4).fill("falsch"), ...Array(2).fill("he"), ...Array(d.runden - 6).fill("ich")]);
    const saetze = plan.map((typ, i) => {
      const p = typ === "ich" ? ich[Math.floor(Math.random() * ich.length)] : he[Math.floor(Math.random() * he.length)];
      const v = verben[i % verben.length];
      return { person: p[0], dritte: p[1], basis: v[0], sform: v[1], rest: v[2], falsch: typ === "falsch" };
    });
    let pos = 0, richtig = 0;
    const zurueckFn = zeigeSpiele;
    const knoepfe = () => el("div", { class: "knopfreihe" }, knopf("↻ Noch mal", spielDetektiv), knopf("Andere Spiele", zurueckFn), knopf("Zur Startseite", startseite, "leise"));
    function zeigeSatz_() {
      const s = saetze[pos];
      let geloest = false, hilfe = false;
      const box = rueckmeldung();
      const weiter = knopf("Weiter ➜", () => { pos++; if (pos < saetze.length) zeigeSatz_(); else ende(); }, "haupt");
      sperrt(weiter);
      const verbAnzeige = s.falsch ? s.basis : (s.dritte ? s.sform : s.basis);
      const fertig = (text) => { geloest = true; if (!hilfe) richtig++; melde(box, "gut", text); entsperrt(weiter); };
      const hilf = (text) => { hilfe = true; melde(box, "hilfe", text); };
      const verbKnopf = el("button", { class: "wort-knopf", lang: "en", onclick: () => {
        if (geloest) return;
        if (s.falsch) {
          verbKnopf.replaceChildren(el("strong", { class: "ziel" }, s.sform));
          verbKnopf.classList.add("repariert");
          fertig(`${lob()} Repariert: ${s.basis} → ${s.sform}`);
        } else {
          hilf(s.dritte ? "Ich helfe dir: Schau noch mal – das Verb hat sein -s schon. Probier's nochmal!"
            : "Ich helfe dir: Bei I, you, we und they bleibt das Verb ohne -s. Probier's nochmal!");
        }
      } }, verbAnzeige);
      const andere = (t) => el("button", { class: "wort-knopf", lang: "en", onclick: () => {
        if (!geloest) hilf("Ich helfe dir: Schau aufs Verb. Bei he, she, it braucht das Verb ein -s. Probier's nochmal!");
      } }, t);
      const allesRichtig = knopf("✓ Alles richtig!", () => {
        if (geloest) return;
        if (s.falsch) hilf("Ich helfe dir: Hier fehlt etwas. Bei he, she, it braucht das Verb ein -s. Probier's nochmal!");
        else fertig(`${lob()} Der Satz stimmt.`);
      });
      zeige(spielKopf("-s-Detektiv", zurueckFn),
        ansage("Is there an -s missing?", "Du bist der -s-Detektiv! Fehlt ein -s? Dann tipp auf das Verb und repariere es. Sonst: „Alles richtig!“"),
        karte(null, `Satz ${pos + 1} von ${saetze.length} · ✓ ${richtig}`,
          el("p", { class: "satz detektiv-satz" }, s.person.split(" ").map(andere), verbKnopf, s.rest.split(" ").map(andere)),
          el("div", { class: "knopfreihe" }, allesRichtig), box, el("div", { class: "knopfreihe" }, weiter)));
      imSpiel = true;
    }
    function ende() {
      const geschafft = richtig >= DETEKTIV_ZIEL, box = rueckmeldung();
      melde(box, geschafft ? "gut" : "neutral", geschafft ? `${lob(true)} ${richtig} von ${saetze.length} Sätzen ohne Hilfe gelöst!${spielPunkte("detektivTag", true)}`
        : `${richtig} von ${saetze.length} ohne Hilfe gelöst. Für Punkte brauchst du ${DETEKTIV_ZIEL}. Noch mal?`);
      if (!geschafft) speichern();
      zeige(spielKopf("-s-Detektiv", zurueckFn), el("section", { class: "satzkarte detektiv-ende" }, el("h2", {}, "🔎 Fall gelöst!"), box, knoepfe()));
      imSpiel = true;
    }
    zeigeSatz_();
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
      const weiter = knopf("Weiter ➜", naechstes, "haupt"); sperrt(weiter);
      const wortZeile = el("p", { class: "vok-en ziel-satz", lang: "en", hidden: true }, v.form);
      let geloest = false;
      const geschafft = (stufe) => {
        geloest = true; wortZeile.hidden = false; entsperrt(weiter); lage.weiter = naechstes;
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
      knopf("✓ Gewusst", () => { comboTreffer(); naechstes(); }, "haupt"),
      knopf("↻ Nochmal üben", () => { comboBruch(); lage.vq.push(v.id); naechstes(); }));
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
  const PUNKTE = { teil: 10, wiederholung: 5, ohneHilfe: 5, seance: 30, einheit: 50, feuer: 30, wochenende: 20, ferien: 20, spiel: 10, woche: 100, monat: 200 };
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const heute = () => (LOKAL && window.__heute ? new Date(window.__heute + "T12:00:00") : new Date());
  const plusTage = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const montag = (d) => plusTage(d, -((d.getDay() + 6) % 7));
  const istFrei = (t) => SP.frei.some((f) => t >= f.von && t <= f.bis);
  const istSchultag = (d) => d.getDay() >= 1 && d.getDay() <= 5 && !istFrei(iso(d));
  const schultageDerWoche = (mo) => [0, 1, 2, 3, 4].map((i) => plusTage(mo, i)).filter(istSchultag);
  powerupMigration();

  function spielstand() {
    if (!stand.spiel) { // Erstes Mal: was schon geschafft ist, zählt mit
      const n = Object.keys(stand.teile || {}).length;
      const einheiten = stand.erledigt.length + Object.values(stand.gruppen || {}).reduce((a, l) => a + l.length, 0);
      stand.spiel = { punkte: n * PUNKTE.teil + einheiten * PUNKTE.einheit, tage: {}, wochen: [], feuer: [], wochenende: [], helden: [], abzeichen: [], titel: 0 };
      stand.spiel.titel = titelIndex(stand.spiel.punkte);
      protokolliere("r", stand.spiel.punkte); speichern();
    }
    const sp = stand.spiel; // Coins (29.10.2026): gespiegelte Währung, nicht rückwirkend – ein älterer Stand startet bei 0
    if (!(sp.coins >= 0)) sp.coins = 0;
    if (!Array.isArray(sp.gekauft)) sp.gekauft = [];
    if (!(sp.ausgegeben >= 0)) sp.ausgegeben = 0;
    if (sp.tiers !== 1) { sp.titel = Math.max(sp.titel || 0, titelIndex(sp.punkte)); sp.tiers = 1; } // Titel-Tiers (6.11.): Altstand still auf den passenden Titel, ohne Feier
    return sp;
  }
  const titelIndex = (p) => SP.titel.reduce((i, t, k) => (p >= t.ab ? k : i), 0);
  // Titel-Tiers (6.11.2026, Mr. Alex): SP.titel läuft über alle Tiers (t.tier), SP.tiers[i] = { name, farbe, text, audio } (werkzeuge/daten_bauen.py TIERS).
  // Ab Tier 2 trägt das Titel-Schild (Startseite, Sammlung) die Rahmenfarbe des Tiers (CSS --tier-farbe), der Eintritt bekommt eine eigene Feier.
  const tierVon = (i) => ((SP.tiers || [])[(SP.titel[i] || {}).tier || 0]) || {};
  const tierAttr = (i) => (tierVon(i).farbe ? { klasse: " tier-rahmen", stil: `--tier-farbe:${tierVon(i).farbe}` } : { klasse: "", stil: null });
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
  // Zeitlog „Mr. Alex is watching you“ (30.10.2026, Mr. Alex): mehr als 200 Übungspunkte in 10 Minuten → die App sperrt sich,
  // bis Mr. Alex sie mit seiner Lehrer-PIN freischaltet. Die Punkte bleiben (gute Schüler sollen nicht bestraft werden); im Lehrer-Bereich
  // kann er sie bei Bedarf korrigieren. Gezählt werden nur Punkte für Teile und Word Gym (ohne Boni wie Hausaufgabe, Serie, Woche, Station).
  // Log, Sperre und Warnungen stecken in stand.spiel (Siegel) – Neuladen hebt die Sperre nicht auf. Jede Warnung bleibt mit Zeitpunkt gespeichert.
  const WACHE = { fenster: 10 * 60000, grenze: 200 };
  // Seit 31.10. (Schutz-Paket 3) ruft nur punkteDazu den Wächter auf – für Übungspunkte (Teil, Word Gym, Runner-Story), nie für Boni.
  function mrAlexWacht(sp, basis) {
    const jetzt = Date.now();
    sp.log = (Array.isArray(sp.log) ? sp.log : []).filter((e) => Array.isArray(e) && e[0] <= jetzt && jetzt - e[0] < WACHE.fenster);
    sp.log.push([jetzt, basis]);
    const summe = sp.log.reduce((a, e) => a + e[1], 0);
    if (summe > WACHE.grenze) {
      sp.gesperrt = jetzt; sp.log = [];
      (sp.warnungen = Array.isArray(sp.warnungen) ? sp.warnungen : []).push(new Date(jetzt).toISOString());
      warnZaehlerHoch(true); protokolliere("w", summe);
      setTimeout(sperreZeigen, 900); // nach Lob und Toasts
    }
    return true;
  }
  /* Plausibilitätsprüfung (31.10.2026): nur Markierungen für den Lehrer-Bereich, nie eine Sperre, nie geänderte Punkte.
     (1) Punkte höchstens Startwert + Summe der Protokoll-Einträge · (2) jeder Tagesbonus je Datum nur einmal ·
     (3) Übungspunkte je 10-Minuten-Fenster über der Grenze nur mit Warnung · (4) Zeit läuft nur vorwärts (kein Rücksprung über einen Tag, nichts in der Zukunft) ·
     Warnzähler (-w) nicht kleiner als die gespeicherten Warnungen · Altbestand nur einmal je Gerät (-p).
     Ergebnis: pruefung = { altbestand, marker: ["summe","datum","dichte","zeit","protokoll","altbestand"], seit, hinweis } */
  let pruefung = { altbestand: false, marker: [], seit: null, hinweis: "" };
  function plausibilitaet() {
    const sp = stand.spiel || {}, pl = Array.isArray(stand.protokoll) ? stand.protokoll : [], marker = [], w = warnZaehlerLies();
    let seit = null;
    const merke = (m, t) => { if (!marker.includes(m)) marker.push(m); if (t != null && (seit == null || t < seit)) seit = t; };
    if ((sp.punkte || 0) > protokollSumme(pl)) merke("summe", pl.length ? pl[pl.length - 1][0] : null);
    const tage = new Set();
    for (const e of pl) if (typeof e[1] === "string" && e[1][0] === "b") { const k = e[1] + "|" + iso(new Date(e[0] * 60000)); if (tage.has(k)) merke("datum", e[0]); tage.add(k); }
    const ue = pl.filter((e) => e[1] === "t" || e[1] === "g" || e[1] === "s"), warn = pl.filter((e) => e[1] === "w").map((e) => e[0]);
    const fensterMin = WACHE.fenster / 60000 - 1; // Minutenraster: ein Fenster, das sicher innerhalb der 10 Minuten liegt
    for (let i = 0; i < ue.length; i++) {
      let s = 0;
      for (let j = i; j < ue.length && ue[j][0] - ue[i][0] <= fensterMin; j++) {
        s += ue[j][2];
        if (s > WACHE.grenze && !warn.some((t) => t >= ue[i][0] && t <= ue[j][0] + 1)) { merke("dichte", ue[i][0]); break; }
      }
    }
    for (let i = 1; i < pl.length; i++) if (pl[i][0] < pl[i - 1][0] - 1440) merke("zeit", pl[i][0]);
    for (const e of pl) if (e[1] === "a" && e[3]) merke("altbestand", e[0]); // Altbestand übernommen, obwohl hier schon ein Protokoll lief
    if (pl.length && pl[pl.length - 1][0] > minuten() + 1440) merke("zeit", pl[pl.length - 1][0]);
    let hinweis = "";
    if ((w.n || 0) > (Array.isArray(sp.warnungen) ? sp.warnungen : []).length) {
      if (speicherLeer) hinweis = "Speicher geleert"; else { merke("protokoll", w.t ? Math.floor(w.t / 60000) : null); hinweis = "protokoll"; }
    }
    pruefung = { altbestand: pl.some((e) => e[1] === "a"), marker, seit, hinweis };
    return pruefung;
  }
  setTimeout(plausibilitaet, 0);
  const sperreDialog = el("dialog", { class: "feier frage sperre" });
  sperreDialog.addEventListener("cancel", (e) => e.preventDefault());
  document.body.append(sperreDialog);
  function sperreZeigen() {
    if (!(stand.spiel && stand.spiel.gesperrt)) return;
    stopp();
    sperreDialog.replaceChildren(el("div", { class: "feier-symbol", "aria-hidden": "true" }, "👀"),
      el("h2", { lang: "en" }, "Mr. Alex is watching you!"),
      el("p", { class: "sperre-gross", lang: "en" }, "You are either great or cheating. 😉"),
      el("p", {}, "Du hast in sehr kurzer Zeit sehr viele Punkte gesammelt. Deine Punkte bleiben. Zeig die App Mr. Alex – er schaltet sie mit seiner PIN wieder frei."),
      el("div", { class: "knopfreihe" }, knopf("👩‍🏫 Lehrer-PIN", () => { sperreDialog.close(); lehrerStart(); }, "haupt")));
    if (!sperreDialog.open) sperreDialog.showModal();
  }
  // ohneHilfe: im Teil kein 💡 benutzt → +5 beim ersten Mal (Hilfen kosten nie Punkte, wie in Klasse 9)
  function belohne(erstesMal, ohneHilfe, istGym, wdh) {
    const sp = spielstand(), d = heute(), tag = iso(d);
    const orteVorher = orteBei(teileZaehler() - (erstesMal ? 1 : 0));
    let plus = istGym ? PUNKTE.seance : erstesMal ? PUNKTE.teil : (wdh != null ? wdh : PUNKTE.wiederholung);
    const boni = []; // [art, punkte] – in plus enthalten, zählen aber nicht zum Zeitlog (punkteDazu)
    if (erstesMal && ohneHilfe && !istGym) { plus += PUNKTE.ohneHilfe; ereignisse.push({ art: "toast", text: `💪 Ohne Hilfe +${PUNKTE.ohneHilfe}` }); }
    const bonus = istGym ? 0 : hwBonus(plus); // 📝 Homework: +50 % auf die Teil-Punkte (aufgerundet), je Teil einmal pro Hausaufgabe
    if (bonus) { plus += bonus; boni.push(["h", bonus]); ereignisse.push({ art: "toast", text: `📝 Homework +${bonus}` }); }
    const gbonus = istGym ? 0 : glnBonus(plus - bonus); // 🏁 Road to GLN: doppelte Punkte auf die Teil-Punkte, je Teil einmal pro GLN
    if (gbonus) { plus += gbonus; boni.push(["gl", gbonus]); ereignisse.push({ art: "toast", text: `🏁 Road to GLN ×2: +${gbonus}` }); }
    const ersterDesTages = !sp.tage[tag];
    sp.tage[tag] = (sp.tage[tag] || 0) + 1;
    if (orteFrei() > orteVorher) ereignisse.push({ art: "ort", ort: SP.orte[orteFrei() - 1] });
    if (ersterDesTages) {
      if (!istSchultag(d)) {
        if (d.getDay() === 0 || d.getDay() === 6) { sp.wochenende.push(tag); plus += PUNKTE.wochenende; boni.push(["bw", PUNKTE.wochenende]); ereignisse.push({ art: "toast", text: `🏖️ Weekend bonus +${PUNKTE.wochenende}` }); }
        else { (sp.ferien = sp.ferien || []).push(tag); plus += PUNKTE.ferien; boni.push(["bf", PUNKTE.ferien]); ereignisse.push({ art: "toast", text: `🌴 Holiday bonus +${PUNKTE.ferien}` }); }
      } else {
        const n = serie();
        if (n >= 3 && n % 3 === 0 && !sp.feuer.includes(tag)) {
          sp.feuer.push(tag); plus += PUNKTE.feuer; boni.push(["bs", PUNKTE.feuer]);
          ereignisse.push({ art: "feier", symbol: "🔥", titel: `On fire! ${n} days in a row`, text: `${n} Schultage am Stück – +${PUNKTE.feuer} Punkte!`, ton: SP.texte.feuer });
        }
        const mo = montag(d);
        if (schultageDerWoche(mo).every((x) => sp.tage[iso(x)]) && !sp.wochen.includes(iso(mo))) {
          sp.wochen.push(iso(mo)); plus += PUNKTE.woche; boni.push(["bq", PUNKTE.woche]);
          const held = SP.helden.find((h) => !sp.helden.includes(h.id));
          if (held) { sp.helden.push(held.id); ereignisse.push({ art: "held", held }); }
          if (sp.helden.length === SP.helden.length && !sp.abzeichen.includes("team")) {
            sp.abzeichen.push("team");
            ereignisse.push({ art: "feier", symbol: "🦸", titel: "Your team is complete!", text: "Du hast alle zehn Superhelden gesammelt. Du bist eine Legende!", ton: SP.texte.team });
          }
          const ws = wochenSerie(mo);
          if (ws >= 4 && ws % 4 === 0) {
            plus += PUNKTE.monat; boni.push(["bm", PUNKTE.monat]); if (!sp.abzeichen.includes("monat")) sp.abzeichen.push("monat");
            ereignisse.push({ art: "feier", symbol: "👑", titel: "Perfect month!", text: `${ws} perfekte Wochen hintereinander – +${PUNKTE.monat} Punkte und ein goldener Rahmen!`, ton: SP.texte.monat });
          }
        }
      }
    }
    goldPruefen(true); // goldene Akten (Regel B)
    punkteDazu(plus, { art: istGym ? "g" : "t", boni });
  }
  // Wiederholungsbonus für eine komplett wiederholte Station / einen komplett wiederholten Abschnitt (6.11.)
  const WDH_BONUS = 25;
  function wdhKomplett() { return !!(lage && lage.wdhLauf && lage.wdhLauf.size >= lage.teile.length); }
  function wdhStationBonus(schluessel) {
    const sp = spielstand(); sp.stwdh = sp.stwdh || {};
    const n = sp.stwdh[schluessel] || 0; sp.stwdh[schluessel] = n + 1;
    const p = Math.floor(WDH_BONUS / 2 ** n);
    ereignisse.push({ art: "toast", text: "🔁 Ganz wiederholt!" });
    if (p > 0) punkteDazu(p, { art: "e", bonus: true }); else { speichern(); setTimeout(zeigeEreignisse, 50); }
  }
  // Nur ein Teil (oder ein paar Teile) noch einmal gemacht: neutrale Seite, keine Feier, kein Bonus
  function teilWiederholt() {
    const ort = station(lage.nr), rest = lage.teile.map((_, i) => i).filter((i) => !lage.wdhLauf.has(i));
    const weiter = () => springe(rest[0]);
    lage.weiter = weiter;
    zeige(kopf(ort), el("section", { class: "geschafft" },
      el("h2", {}, "Teil wiederholt ✓"),
      el("p", { class: "ansage" }, `Punkte gibt es, wenn du alle ${lage.teile.length} Teile am Stück wiederholst. Noch ${rest.length} Teile.`),
      el("div", { class: "knopfreihe" }, knopf("Nächster Teil", weiter, "haupt"), knopf("Zur Startseite", startseite))));
  }

  function einheitBonus() { punkteDazu(PUNKTE.einheit, { art: "e", bonus: true }); }
  // Alle Punkte und Coins laufen nur hier durch (31.10.): Zeitlog (mrAlexWacht) für Übungspunkte ohne Boni, Ereignisprotokoll für alles.
  // opt: { art: "t"|"g"|"s"|"e"|"m", boni: [[art, punkte], …] (in plus enthalten, ohne Zeitlog), bonus: true (ganz ohne Zeitlog) }
  function punkteDazu(plus, opt = {}) {
    const sp = spielstand(), art = opt.art || "t", boni = Array.isArray(opt.boni) ? opt.boni : [];
    const basis = opt.bonus ? 0 : plus - boni.reduce((a, b) => a + b[1], 0);
    if (basis > 0 && (art === "t" || art === "g" || art === "s")) mrAlexWacht(sp, basis);
    const muenzen = Math.ceil(plus / 2); sp.punkte += plus; sp.coins += muenzen; // seit 30.10.: halb so viele Coins wie Punkte, aufgerundet (Coins sinken nur im Shop)
    if (opt.bonus) protokolliere(art, plus); else { if (basis > 0) protokolliere(art, basis); for (const b of boni) if (b[1] > 0) protokolliere(b[0], b[1]); }
    ereignisse.unshift({ art: "toast", text: `+${plus} ⭐ · +${muenzen} 🪙` });
    const t = titelIndex(sp.punkte);
    if (t > sp.titel) {
      const altTier = (SP.titel[sp.titel] || {}).tier || 0;
      sp.titel = t;
      const ti = SP.titel[t], tr = tierVon(t);
      if ((ti.tier || 0) > altTier && tr.text) // neues Tier: zuerst „Welcome to …“ in der Rahmenfarbe, danach der Titel
        ereignisse.push({ art: "feier", symbol: ti.symbol, titel: `Welcome to ${tr.name}!`, text: tr.text.replace(/^Welcome to [^!]*! */, ""), ton: tr, farbe: tr.farbe });
      ereignisse.push({ art: "feier", symbol: ti.symbol, titel: ti.name, text: `Neuer Titel: ${ti.name}!`, ton: ti, farbe: tr.farbe || null });
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
  const grossEreignis = (e) => e.art === "feier" || e.art === "held" || e.art === "karte";
  let stempelLaeuft = false;
  function zeigeEreignisse() {
    for (let i = 0; i < ereignisse.length;) { if (ereignisse[i].art === "toast") toast(ereignisse.splice(i, 1)[0].text); else i++; }
    if (feier.open || stempelLaeuft) return;
    const gi = ereignisse.findIndex(grossEreignis);
    if (gi >= 0) {
      const e = ereignisse[gi];
      // Heldenfilm (6.11.2026): neuer Superheld → erst sein Film (Runner.szene 'held_<id>'), danach die Karte wie bisher (ohne erneutes Vorlesen)
      if (e.art === "held" && !e.filmGezeigt) {
        e.filmGezeigt = true;
        if (heldFilm(e.held, () => { stempelLaeuft = false; zeigeEreignisse(); })) { stempelLaeuft = true; return; }
      }
      return zeigeFeier(ereignisse.splice(gi, 1)[0]);
    }
    const si = ereignisse.findIndex((e) => e.art === "ort");
    if (si < 0) return;
    const e = ereignisse.splice(si, 1)[0];
    stempelLaeuft = true;
    audioEnde.then(() => setTimeout(() => {
      const weiter = () => { stempelLaeuft = false; zeigeEreignisse(); };
      if (ortSzene(e.ort, weiter)) return; // Orts-Szene statt Stempel, wenn der Runner den Ort zeichnet
      stempel(el("div", { class: "stempel-bild symbol-bild", "aria-hidden": "true" }, e.ort.symbol), e.ort.name, "London ✓");
      setTimeout(weiter, 2700);
    }, 250));
  }
  // Orts-Szenen (6.11.2026, Etappe 1): kurze Runner-Szene (Runner.szene, gleiche Zeichnungen wie im London Run) mit dem Fakt als Untertitel und
  // einem kleinen Foto am Ende; nur für Orte, die der Runner zeichnet (Runner.hatSzene) – sonst bleibt alles wie bisher (Stempel bzw. Fakt-Text)
  const hatSzene = (o) => !!(o && window.Runner && window.Runner.hatSzene && window.Runner.hatSzene(o.id));
  function ortSzene(o, fertig) {
    if (!hatSzene(o)) return false;
    // Big Ben (6.11., Mr. Alex): echte Aufnahme Westminster Chimes + Stundenschlag (app/audio/orte/westminster_chimes.mp3, Quelle app/audio/orte/QUELLEN.md) –
    // nur in der Szene (klang.chimes, ersetzt Viertelmelodie + Schlag des Nachbaus); im London Run bleibt der kurze WebAudio-Nachbau (klang.glocke)
    if (window.Runner.klangDatei) window.Runner.klangDatei("chimes", "audio/orte/westminster_chimes.mp3");
    const sz = window.Runner.szene(null, o.id, { text: o.fakt, titel: `${o.symbol} ${o.name} · London ✓`, foto: o.foto, quelle: o.foto_quelle, onEnde: () => { if (fertig) fertig(); },
      // Voice-over (6.11.): die eingesprochene Aufnahme des Fakts läuft mit der Szene (Haupttext-Vorrang, wartet auf ein laufendes Lob); ✕/Schließen stoppt sie
      voice: o.audio ? () => hauptText([o.audio], { warten: true }) : null, voiceStopp: () => stopp(), voiceAudio: () => stimmeAudio(o.audio),   // Untertitel im Takt der Aufnahme
      stimme: (text, lang) => hauptText([{ tts: text, lang: lang || "en-GB", stimme: "m" }], { warten: true }) });   // Durchsagen der Szene (Tube) mit der Geräte-Stimme
    return !!sz;
  }
  // Heldenfilme (6.11.2026, Mr. Alex): kurzer Film je Superheld (Runner.szene 'held_<id>', der Held als Spielgrafik wie im London Run zeigt seine Kraft in London),
  // Stimme = Selbstvorstellung (inhalte/helden.tsv, Spalte intro; Aufnahme audio/helden/intro_<id>.mp3), Untertitel Satz für Satz, am Ende die Sammelkarte groß (Canvas-Bild, 7.11.)
  const heldHatFilm = (h) => !!(h && window.Runner && window.Runner.hatSzene && window.Runner.hatSzene("held_" + h.id));
  function heldFilm(h, fertig) {
    if (!heldHatFilm(h)) return false;
    const sz = window.Runner.szene(null, "held_" + h.id, { text: h.intro, titel: `🦸 ${h.name}`, foto: heldKarteBild(h), quelle: `${h.name} · ${h.kraft}`, onEnde: () => { if (fertig) fertig(); },
      voice: h.intro_audio ? () => hauptText([h.intro_audio], { warten: true }) : null, voiceStopp: () => stopp(), voiceAudio: () => stimmeAudio(h.intro_audio) });
    return !!sz;
  }
  // Eigener Bestätigungsdialog statt confirm(): funktioniert auch in eingebetteten Rahmen (Vorschau) und sieht aus wie die App
  const frageDialog = el("dialog", { class: "feier frage" });
  document.body.append(frageDialog);
  function frage(text, ja, nein) {
    return new Promise((fertig) => {
      const zu = (antwort) => { frageDialog.close(); fertig(antwort); };
      frageDialog.replaceChildren(el("p", { class: "frage-text" }, text),
        el("div", { class: "knopfreihe" }, knopf(ja || "Ja", () => zu(true), "haupt"), knopf(nein || "Abbrechen", () => zu(false), "leise")));
      frageDialog.onclose = () => fertig(false);
      frageDialog.showModal();
    });
  }
  function zeigeFeier(e) {
    if (e.art === "karte") return karteEnthuellen(e);
    const ton = e.art === "held" ? e.held : e.ton, nachFilm = e.art === "held" && e.filmGezeigt && heldHatFilm(e.held);
    const inhalt = e.art === "held"
      ? [el("p", { class: "feier-klein" }, "⭐ Perfect week! Neuer Superheld:"), heldenKarte(e.held, true),
         el("p", { class: "steckbrief", lang: "en" }, e.held.steckbrief)]
      : [el("div", { class: "feier-symbol", "aria-hidden": "true" }, e.symbol), el("h2", { id: "feier-titel", lang: "en" }, e.titel), el("p", {}, e.text)];
    feier.classList.toggle("tier-feier", !!e.farbe); // Titel-Tiers: Feier in der Rahmenfarbe des Tiers
    if (e.farbe) feier.style.setProperty("--tier-farbe", e.farbe);
    feier.replaceChildren(konfetti(), ...inhalt,
      el("div", { class: "knopfreihe" },
        ton && ton.audio && knopf("🔊 Anhören", () => spiele([ton.audio])),
        knopf("Weiter ➜", () => { feier.close(); stopp(); setTimeout(zeigeEreignisse, 300); }, "haupt")));
    feier.showModal();
    if (ton && ton.audio && !nachFilm) spiele([ton.audio], { warten: true }); // wartet, falls noch ein Lob läuft; nach dem Heldenfilm nur auf Knopfdruck
  }
  /* Mega-Lob (6.11.2026, Mr. Alex): erster Abschluss einer ganzen Station mit laufender Serie → Lichtblitz, Konfetti und ein Satz von Mr. Alex
     (zufällig einer von drei je Stufe). Power ab 3, Superpower ab 5, Mega ab 10 Schultagen am Stück oder mit dem Abzeichen Perfect month.
     Nur Lob, keine Punkte; je Station höchstens einmal (stand.spiel.megalob[station] = Stufe, im Siegel). Nicht blockierend (pointer-events: none);
     wartet, bis ein Feier-Fenster oder eine Orts-Szene fertig ist, und die Stimme reiht sich hinter ein laufendes Lob (spiele … warten). */
  const MEGA = { power: "⚡ POWER!", super: "🦸 SUPERPOWER!", mega: "🌟 MEGA!" };
  function megaStufe() {
    const sp = spielstand(), n = serie();
    return n >= 10 || sp.abzeichen.includes("monat") ? "mega" : n >= 5 ? "super" : n >= 3 ? "power" : null;
  }
  function megaLob(schluessel) {
    const sp = spielstand(), stufe = megaStufe();
    if (!sp.megalob || typeof sp.megalob !== "object") sp.megalob = {};
    if (!stufe || sp.megalob[schluessel]) return null;
    sp.megalob[schluessel] = stufe; speichern();
    const ton = SP.texte[`mega_${stufe}_${1 + Math.floor(Math.random() * 3)}`] || {};
    const zeigen = () => {
      if (feier.open || stempelLaeuft) return setTimeout(zeigen, 400);
      const box = el("div", { class: "megalob megalob-" + stufe, role: "status" }, el("div", { class: "blitz" }), konfetti(),
        el("div", { class: "mega-text" }, el("strong", {}, MEGA[stufe]), el("span", { lang: "en" }, ton.text || "")));
      document.body.append(box);
      setTimeout(() => box.remove(), 3400);
      if (ton.audio) spiele([ton.audio], { warten: true });
    };
    setTimeout(zeigen, 150);
    return stufe;
  }
  function konfetti() {
    const farben = ["#ffd23f", "#1f5fd1", "#e2384d", "#1d8a4e", "#b48cff"];
    return el("div", { class: "konfetti", "aria-hidden": "true" }, Array.from({ length: 36 }, (_, i) =>
      el("span", { style: `left:${(i * 37) % 100}%;background:${farben[i % 5]};animation-delay:${(i % 9) * 0.12}s` })));
  }

  function statusleiste() {
    const sp = spielstand(), t = SP.titel[sp.titel], n = serie(), ta = tierAttr(sp.titel);
    return el("div", { class: "statusleiste" + (sp.abzeichen.includes("monat") ? " gold" : "") + rahmenKlasse() + ta.klasse, style: ta.stil },
      el("span", { class: "status-titel" }, t.symbol + " " + t.name), glnAbzeichen(),
      el("span", {}, `⭐ ${sp.punkte} Punkte`),
      el("span", { class: "status-coins", title: "Coins" }, `🪙 ${sp.coins}`),
      el("span", { title: "Schultage am Stück" }, `🔥 ${n}`),
      knopf("🏆 Hall of Fame", sammlung, "haupt"), knopf("🛍️ Shop", shop));
  }

  // Heldenkarten (7.11.2026, Mr. Alex): Sammelkarte als Canvas-Zeichnung des Runners (Runner.heldKarteZeichnen: Sternenhimmel, Held in Kraftpose mit Glühen, Name + Kraft);
  // gesperrte Helden als graue Silhouette mit „?“. Die alten Fotos bilder/helden/*.jpg bleiben nur noch als Ersatz, falls runner.js fehlt.
  const KARTE_PX = 480;
  function heldKarteCanvas(h, o = {}) {
    if (!(window.Runner && window.Runner.heldKarteZeichnen)) return el("img", { src: h.bild, alt: `${h.name}: ${h.kraft}`, loading: "lazy" });
    const k = o.gesperrt ? null : karteVon(h.id), st = k ? k.s : 0;
    const oo = Object.assign({ stufe: st, selten: !o.gesperrt && KARTE.selten.includes(h.id) }, o);
    const cv = el("canvas", { width: KARTE_PX, height: KARTE_PX * 4 / 3, role: "img", "aria-label": o.gesperrt ? "Noch nicht gesammelt" : `${h.name}: ${h.kraft}${st ? " · " + KARTE.namen[st] : ""}` });
    try { window.Runner.heldKarteZeichnen(cv.getContext("2d"), 0, 0, KARTE_PX, h, oo); } catch (e) { /* Karte bleibt leer */ }
    if (oo.stufe && window.Runner.heldKarteGlanz) glanzDazu(cv, oo.stufe);
    return cv;
  }
  /* Folien-Karten (7.11.2026, Mr. Alex, große Version): Stufe je gesammeltem Held im Spielstand (stand.spiel.karten[id] = { s, c, p }, im Siegel):
     s 0 normal · 1 Bronze (3 Cameo-Auftritte im London Run, Kraft hat gewirkt) · 2 Silber (danach ein Lauf mit ihm: Level geschafft = Boss besiegt, oder 5er-Serie nach seinem Auftritt)
     · 3 Gold (danach jeder Lauf mit ihm: „goldener Moment“ 1:15, seltene Helden 1:30; sicherer Weg: 3 perfekte Läufe mit ihm = Gold-Trophäe).
     c = Auftritte, p = perfekte Läufe ab Silber. Höchstens ein Aufstieg je Lauf; jeder Aufstieg steht im Ereignisprotokoll (Art „c“, ±0 Punkte).
     Seltene Helden (KARTE.selten): kleinere Gold-Chance, ✦ RARE auf der Karte, zählen doppelt im Sammelwert. Karte mit Metallrahmen + wanderndem Lichtreflex (Runner.heldKarteGlanz,
     Zeit bzw. Neigen des Handys; bei „Bewegung reduzieren“ still), Enthüllung beim Aufstieg (Karte dreht sich, Rahmen leuchtet, Held spricht seine Vorstellung – vorhandene Aufnahme). */
  const KARTE = { cameos: 3, serie: 5, chance: 15, chanceSelten: 30, perfekt: 3, selten: ["felix", "zara"],
    namen: ["", "Bronze", "Silber", "Gold"], symbol: ["", "🥉", "🥈", "🥇"] };
  function karteVon(id) {
    const sp = spielstand(), ks = (sp.karten = sp.karten && typeof sp.karten === "object" ? sp.karten : {});
    return ks[id] || (ks[id] = { s: 0, c: 0, p: 0 });
  }
  const sammelwert = () => SP.helden.filter((h) => spielstand().helden.includes(h.id)).reduce((n, h) => n + (KARTE.selten.includes(h.id) ? 2 : 1), 0);
  function karteZiel(h) {   // nächster Schritt als kurzer Hinweis unter der Karte
    const k = karteVon(h.id);
    if (k.s === 0) return `🥉 ${Math.min(k.c, KARTE.cameos)}/${KARTE.cameos} Auftritte im London Run`;
    if (k.s === 1) return `🥈 Level schaffen oder ${KARTE.serie}er-Serie mit ${h.name.split(" ")[0]}`;
    if (k.s === 2) return `🥇 Goldener Moment – oder ${Math.min(k.p, KARTE.perfekt)}/${KARTE.perfekt} perfekte Läufe`;
    return "🥇 Gold!";
  }
  // nach einem London-Run-Lauf: Auftritte zählen, höchstens ein Aufstieg je Held und Lauf (nur gesammelte Helden)
  function kartenAuswerten(e, trophaee) {
    const sp = spielstand();
    (Array.isArray(e.helden) ? e.helden : []).forEach((x) => {
      const h = SP.helden.find((y) => y.id === x.id);
      if (!h || !sp.helden.includes(h.id)) return;
      const k = karteVon(h.id), vorher = k.s;
      k.c += Math.max(0, x.auftritte | 0);
      if (k.s === 0 && k.c >= KARTE.cameos) k.s = 1;
      else if (k.s === 1 && (e.geschafft || (x.serie | 0) >= KARTE.serie)) k.s = 2;
      else if (k.s === 2) {
        if (trophaee === "gold") k.p++;
        const chance = KARTE.selten.includes(h.id) ? KARTE.chanceSelten : KARTE.chance, moment = Math.random() * chance < 1;
        if (moment || k.p >= KARTE.perfekt) { k.s = 3; k.moment = moment ? 1 : 0; }
      }
      if (k.s > vorher) { protokolliere("c", 0); ereignisse.push({ art: "karte", held: h, stufe: k.s, moment: k.s === 3 && !!k.moment }); }
    });
  }
  // Lichtreflex: eine Schleife für alle sichtbaren Karten mit Stufe; Grundbild einmal gezeichnet, darüber je Bild der Glanz
  const glanzKarten = new Set();
  let glanzLaeuft = false, neigung = 0;
  const bewegungRuhig = () => { try { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) { return false; } };
  try { window.addEventListener("deviceorientation", (ev) => { if (ev && typeof ev.gamma === "number") neigung = Math.max(-1, Math.min(1, ev.gamma / 45)); }); } catch (e) { /* egal */ }
  function glanzDazu(cv, stufe) {
    const grund = document.createElement("canvas"); grund.width = cv.width; grund.height = cv.height;
    grund.getContext("2d").drawImage(cv, 0, 0);
    const g = { cv, grund, stufe, versatz: Math.random() };
    if (bewegungRuhig()) { glanzMalen(g, 0.35); return; }
    glanzKarten.add(g);
    if (!glanzLaeuft) { glanzLaeuft = true; requestAnimationFrame(glanzBild); }
  }
  function glanzMalen(g, phase) {
    const c = g.cv.getContext("2d");
    c.clearRect(0, 0, g.cv.width, g.cv.height); c.drawImage(g.grund, 0, 0);
    try { window.Runner.heldKarteGlanz(c, 0, 0, g.cv.width, g.stufe, phase); } catch (e) { /* ohne Glanz */ }
  }
  function glanzBild(ms) {
    let sichtbar = false;
    glanzKarten.forEach((g) => {
      if (!g.cv.isConnected) { if (g.gesehen) glanzKarten.delete(g); return; }   // erst nach dem Einhängen zählen
      g.gesehen = true; sichtbar = true;
      glanzMalen(g, ms / (g.stufe === 3 ? 3200 : 4200) + g.versatz + neigung * 0.35);
    });
    if (glanzKarten.size) requestAnimationFrame(glanzBild); else glanzLaeuft = false;
    return sichtbar;
  }
  const heldKarteBild = (h) => { try { return window.Runner && window.Runner.heldKarteBild ? window.Runner.heldKarteBild(h) : h.bild; } catch (e) { return h.bild; } };
  function heldenKarte(h, gross, mitZiel, stufe) {
    const st = stufe == null ? karteVon(h.id).s : stufe;
    return el("figure", { class: "heldenkarte" + (gross ? " gross" : "") + (st ? " stufe-" + st : ""), lang: "en" }, heldKarteCanvas(h, stufe == null ? {} : { stufe }),
      mitZiel && el("figcaption", { lang: "de" }, el("span", {}, karteZiel(h))));
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
      ["🏆", "All stations", D.stationen.filter((s) => !s.spiele).every((s) => stand.erledigt.includes(s.nr) && !faellige(s.nr + "|"))],
    ];
    // 🎯 Zertifikate (Test yourself, 2.11.): je bestandener Station ein Abzeichen mit bestem Ergebnis und Datum
    const zertifikate = Object.entries(sp.tests && typeof sp.tests === "object" ? sp.tests : {}).filter(([, x]) => x && x.bestanden)
      .sort((x, y) => String(x[0]).localeCompare(String(y[0]), "de", { numeric: true }));
    const fakt = el("div", { class: "fakt", hidden: true, "aria-live": "polite" });
    const frei = orteFrei();
    const faktZeigen = (o, mitTon) => {
      fakt.hidden = false;
      fakt.replaceChildren(el("h3", { lang: "en" }, `${o.symbol} ${o.name}`), el("p", { lang: "en" }, o.fakt),
        el("div", { class: "knopfreihe" }, o.audio && knopf("🔊 Anhören", () => spiele([o.audio])), hatSzene(o) && knopf("▶ Szene", () => ortSzene(o), "leise")));
      if (mitTon && o.audio) spiele([o.audio]);
    };
    const karte = londonKarte(frei, (o) => { // Ort mit Szene: erst die Szene, danach der Fakt (ohne automatisches Vorlesen)
      if (ortSzene(o, () => faktZeigen(o, false))) { fakt.hidden = true; return; }
      faktZeigen(o, true);
    });
    const helden = el("div", { class: "heldenraster" }, SP.helden.map((h) => sp.helden.includes(h.id)
      ? el("button", { class: "held-knopf", onclick: () => { if (!heldFilm(h, () => heldZeigen(h, false))) heldZeigen(h); } }, heldenKarte(h, false, true))   // mit Film: erst der Film, danach die Karte
      : el("div", { class: "held-zu" }, heldKarteCanvas(h, { gesperrt: true, hinweis: "Perfect week" }))));
    zeige(
      el("header", { class: "kopf" }, knopf("← Start", startseite, "leise"), el("h1", {}, "🏆 Hall of Fame")),
      el("section", { class: "satzkarte titel-karte" + (sp.abzeichen.includes("monat") ? " gold" : "") + rahmenKlasse() + tierAttr(t).klasse, style: tierAttr(t).stil },
        el("p", { class: "klein" }, "Dein Titel"),
        tierAttr(t).stil && el("p", { class: "tier-name", lang: "en" }, tierVon(t).name),
        el("h2", { lang: "en" }, SP.titel[t].symbol + " " + SP.titel[t].name),
        el("p", {}, `⭐ ${sp.punkte} Punkte`),
        el("p", { class: "coins-zeile" }, `🪙 Coins: ${sp.coins} · ausgegeben: ${sp.ausgegeben}`, " ", knopf("🛍️ Shop", shop, "leise")),
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
        el("h2", {}, `🦸 Superhelden (${sp.helden.length} von ${SP.helden.length})`),
        sp.helden.length > 0 && el("p", { class: "klein karten-zaehler" }, [3, 2, 1].map((st) => `${KARTE.symbol[st]} ${sp.helden.filter((id) => karteVon(id).s === st).length} ${KARTE.namen[st]}`).join(" · ")
          + ` · ✦ Sammelwert ${sammelwert()}`),
        sp.helden.length > 0 && el("p", { class: "klein" }, "Folien-Karten: Hilft dir ein Held im London Run, steigt seine Karte auf – Bronze, Silber, Gold. ✦ RARE-Helden zählen doppelt."),
        helden),
      runnerSammlung(),
      aktenBereich(),
      el("section", { class: "satzkarte" },
        el("h2", {}, "Abzeichen"),
        el("ul", { class: "abzeichen" }, abz.map(([sym, name, ok]) => el("li", { class: ok ? "ok" : "" },
          el("span", { "aria-hidden": "true" }, sym), el("span", { lang: "en" }, name), el("span", { class: "unsichtbar" }, ok ? "geschafft" : "noch nicht")))),
        zertifikate.length ? el("h3", { class: "zertifikate-titel" }, "🎯 Zertifikate (Test yourself)") : null,
        zertifikate.length ? el("ul", { class: "abzeichen zertifikate" }, zertifikate.map(([k, x]) => el("li", { class: "ok zertifikat" },
          el("span", { "aria-hidden": "true" }, "🎯"), el("span", {}, `${testName(k)} bestanden`, el("small", {}, `${x.best} % · ${testDatum(x.am)}`))))) : null));
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
    if (a.bald) { toast(a.hinweis); return false; }
    if (a.runner) { // London-Run-Ticket: mehrfach kaufbar, ein Ticket = ein Durchgang (wird beim Start eingelöst)
      if (sp.coins < a.preis) { toast(`Noch ${a.preis - sp.coins} Coins`); return false; }
      if (!(await frage(`Ein Ticket für ${a.preis} Coins kaufen?`, "🎟️ Kaufen"))) return false;
      sp.coins -= a.preis; sp.ausgegeben += a.preis; runnerStand().tickets = (runnerStand().tickets || 0) + 1; protokolliere("k", -a.preis); speichern();
      ereignisse.push({ art: "toast", text: `🎟️ +1 · 🪙 −${a.preis}` });
      setTimeout(zeigeEreignisse, 50); konfettiFrei();
      return true;
    }
    if (sp.gekauft.includes(a.id)) { if (a.rahmen) { sp.rahmen = a.rahmen; speichern(); } if (a.skin) skinSetzen(a.skin[0], a.skin[1]); return false; }
    if (sp.coins < a.preis) { toast(`Noch ${a.preis - sp.coins} Coins`); return false; }
    if (!(await frage(`Für ${a.preis} Coins kaufen?`, "Kaufen"))) return false;
    sp.coins -= a.preis; sp.ausgegeben += a.preis; sp.gekauft.push(a.id); protokolliere("k", -a.preis);
    if (a.rahmen) sp.rahmen = a.rahmen;
    if (a.skin) skinSetzen(a.skin[0], a.skin[1]);
    speichern();
    ereignisse.push({ art: "toast", text: `🪙 −${a.preis}` });
    setTimeout(zeigeEreignisse, 50); konfettiFrei();
    return true;
  }
  // opt (optional): { zurueck: fn, artikel: id } – Rücksprung z. B. zur Figur-Seite des London Run, ein Artikel wird hervorgehoben
  function shop(opt) {
    opt = opt && typeof opt.zurueck === "function" ? opt : {};
    lage = null;
    const sp = spielstand();
    const artikel = (a) => {
      const hat = sp.gekauft.includes(a.id), fehlt = a.preis - sp.coins;
      const aktiv = hat && ((a.rahmen && sp.rahmen === a.rahmen) || (a.skin && skinWirksam()[a.skin[0]] === a.skin[1]));
      let k;
      if (a.bald) k = el("span", { class: "shop-hinweis" }, a.hinweis);
      else if (a.runner) k = el("div", { class: "knopfreihe ticket-reihe" },
        el("span", { class: "shop-hinweis" }, `🎟️ ${runnerStand().tickets || 0} Tickets`),
        fehlt > 0 ? sperrt(knopf(`Noch ${fehlt} Coins`, () => { kaufe(a); shop(opt); })) : knopf("Ticket kaufen", () => { kaufe(a).then((ok) => { if (ok) shop(opt); }); }, "haupt"),
        (runnerStand().tickets || 0) > 0 && knopf("▶ Zum Spiel", () => runnerStart()));
      else if (hat && (a.rahmen || a.skin)) k = aktiv ? el("span", { class: "shop-hinweis ok" }, "✓ Angelegt") : knopf("Anlegen", () => { kaufe(a).then(() => shop(opt)); });
      else if (hat) k = el("span", { class: "shop-hinweis ok" }, "✓ Gekauft");
      else if (fehlt > 0) k = sperrt(knopf(`Noch ${fehlt} Coins`, () => { kaufe(a); shop(opt); }));
      else k = knopf("Kaufen", () => { kaufe(a).then((ok) => { if (ok) shop(opt); }); }, "haupt");
      return el("div", { class: "shop-artikel" + (hat ? " gekauft" : "") + (a.bald ? " bald" : "") + (a.rahmen ? " rahmen-" + a.rahmen : "") + (a.id === opt.artikel ? " hervor" : ""), "data-artikel": a.id },
        el("span", { class: "sym", "aria-hidden": "true" }, a.symbol),
        el("strong", {}, a.name), a.unter && el("span", { class: "unter" }, a.unter),
        el("span", { class: "preis" }, `🪙 ${a.preis}`),
        a.bald && el("span", { class: "bald-schild" }, "kommt bald"),
        k);
    };
    const alle = SP.shop || [], skins = alle.filter((a) => a.skin);
    zeige(
      el("header", { class: "kopf" }, knopf(opt.zurueck ? "← Zurück" : "← Start", opt.zurueck || startseite, "leise"), el("h1", {}, "🛍️ Shop")),
      el("section", { class: "satzkarte shop-stand" },
        el("p", { class: "shop-coins" }, `🪙 ${sp.coins} Coins`),
        el("p", { class: "klein" }, "Für 2 Punkte gibt es 1 Coin. Punkte bleiben – Coins kannst du hier ausgeben.")),
      el("div", { class: "shop-raster" }, alle.filter((a) => !a.skin).map(artikel)),
      skins.length > 0 && el("h2", { class: "shop-gruppe" }, "🎨 Figur für den London Run", " ", knopf("Figur ansehen", () => runnerSkins(), "leise")),
      skins.length > 0 && el("div", { class: "shop-raster" }, skins.map(artikel)),
      el("div", { class: "knopfreihe" }, knopf("🏆 Hall of Fame", sammlung)));
    const h = opt.artikel && app.querySelector(".shop-artikel.hervor");
    if (h) h.scrollIntoView({ block: "center" });
  }

  /* ---------- Spiele: 🇬🇧 London Run – Jump'n'Run (Engine runner.js = Kopie von app/klasse9/runner.js; Konzept docs/runner/konzept-entwurf.md „London Run Klasse 6 – Welt 1“) ----------
     Wie Road Trip Run in Klasse 9: Ticket 150 Coins je Durchgang (im Shop kaufen, beim Start eingelöst; Sperre im Programm in runnerSpiel), keine Coins zurück.
     Story-Modus Welt 1 (31.10., STORY unten): ♪-Kristalle erzählen „The Guard Who Never Moved“ (zwei Enden), Punkte nur bei geschafftem Level (1 ⭐ je 💎, +10 je ganzer Geschichte, max. 30), Story Library in der Hall of Fame.
     Belohnung: Trophäe je Welt (Gold = alle Diamanten + beide Tore richtig, sonst Silber) und Runner-Titel nach geschafften Leveln (1 · 3 · 6 · 10 · 15).
     Stand in stand.spiel.runner = { level: { westminster: "gold"|"silber" }, gespielt, geschafft, titel, tickets }, Figur in stand.spiel.skin – beides im Siegel.
     Wörter: 12 aus dem gewählten Abschnitt von Station 7 (eigene zuerst, aufgefüllt aus den anderen Abschnitten), gesprochen mit den Vokabel-Aufnahmen.
     Cameos: 2–3 geheime Superhelden je Lauf, bevorzugt die schon gesammelten (sp.helden). Boss-Banner, Boss-Sprüche, Levelstart/-ende und Cameo-Sätze als Aufnahmen (31.10., D.spiel.runner_audio), fehlende mit der Geräte-Stimme.
     Welt 1 Westminster · Big Ben (31.10.), Welt 2 London Eye (31.10., Kapitel 2 „The Wheel That Stopped“, offen ab Silber in Welt 1), Welt 3 Tower Bridge (31.10., Kapitel 3 „Up Goes the Bridge“, offen ab Silber in Welt 2),
     Welt 4 The Tube (31.10., Kapitel 4 „Mind the Gap“, offen ab Silber in Welt 3), Welt 5 Wembley (1.11., Kapitel 5 „The Big Match“ mit drei Enden nach Zählung der Entscheidungen aus Welt 2–4, offen ab Silber in Welt 4). */
  const RUNNER = { preis: 150, skinPreis: 45, skinPreisTeuer: 90, woerter: 12, titel: ["Rookie Runner", "Tube Jumper", "Bus Hopper", "London Hero", "Superhero of London"], ab: [1, 3, 6, 10, 15],
    welten: [{ id: "westminster", name: "Westminster", staat: "London", ziel: "Big Ben", trophaee: "Big Ben Finder", symbol: "🔔", boss: "Sergeant Bearskin", ort: "am Tor der Horse Guards", tuer: "das Tor der Horse Guards" },
      { id: "londoneye", name: "London Eye", staat: "London", ziel: "the London Eye", trophaee: "Eye Spy", symbol: "🎡", boss: "Sergeant Bearskin", ort: "in der obersten Kabine des London Eye", tuer: "die Kabinentür" },
      { id: "towerbridge", name: "Tower Bridge", staat: "London", ziel: "Tower Bridge", trophaee: "Bridge Keeper", symbol: "🌉", boss: "Sergeant Bearskin", ort: "auf der hochgeklappten Tower Bridge", tuer: "das Brückentor" },
      { id: "tube", name: "The Tube", staat: "London", ziel: "Wembley Park", trophaee: "Mind the Gap", symbol: "🚇", boss: "Sergeant Bearskin", ort: "am Stadiontor von Wembley", tuer: "das Stadiontor" },
      { id: "wembley", name: "Wembley", staat: "London", ziel: "Wembley Stadium", trophaee: "Match Winner", symbol: "🏟️", boss: "Sergeant Bearskin", ort: "am Spielfeldtor von Wembley", tuer: "das Spielfeldtor" }] };
  // Story-Modus Welt 1 „The Guard Who Never Moved“ (freigegeben 30.10., Text wörtlich aus docs/runner/story-london-01.md; Erzähler Mr. Alex – bis zur Vertonung Geräte-Stimme,
  // audio: { key: "audio/…mp3" } kann später je Stück ergänzt werden). Punkte (gegen Farmen): 1 ⭐ je Punkte-Diamant, +10 ⭐ einmalig je vollständiger Geschichte (alle 12 ♪ eines Endes),
  // höchstens 30 ⭐ je Lauf, nur wenn das Level geschafft ist (Game over/Abbruch: keine); läuft über punkteDazu (Zeitlog mrAlexWacht, Coins halb).
  // Stand in stand.spiel.runner.story = { westminster: { enden: ["A"], voll: ["A"], beste: { A: 12 } } } (im Siegel).
  const STORY = {
    westminster: { id: "westminster", titel: "The Guard Who Never Moved", teile: {
      1: "Every morning, Sergeant Bearskin stands at the gate.", 2: "He never moves. He never smiles.", 3: "But today, something is wrong.", 4: "His big black hat is gone!",
      A5: "A fox runs past with something black.", A6: "It's the hat! The fox runs to the river.", A7: "The fox jumps onto a red bus.", A8: "You jump too. The chase is on!",
      B5: "A pigeon sits on Big Ben.", B6: "She has a new nest. The nest is a hat!", B7: "Three baby pigeons sleep in it.", B8: "You climb up. Shhh … quiet!",
      9: "At five o'clock, the King's horses come.", 10: "But the Sergeant has no hat. Oh no!",
      A11: "You give the hat back to the Sergeant.", A12: "He smiles. Just once. Nobody sees it … only you.",
      B11: "The babies need the hat. You give him your cap.", B12: "Sergeant Bearskin laughs! Everybody sees it!" },
      // Erzähler Mr. Alex (vertont 31.10., werkzeuge/story_audio.py): je Stück audio/story/westminster_<key>.mp3, dazu „The story so far.“
      audio: Object.fromEntries(["1", "2", "3", "4", "A5", "A6", "A7", "A8", "B5", "B6", "B7", "B8", "9", "10", "A11", "A12", "B11", "B12", "sofar"].map((k) => [k, `audio/story/westminster_${k}.mp3`])) },
    // Kapitel 2 London Eye „The Wheel That Stopped“ (freigegeben 31.10., Text wörtlich aus docs/runner/story-london-02.md): Stücke 1–2 als Variante nach der Wahl aus Welt 1 (story.westminster.wahl.g1: A = Fuchs → 1A/2A,
    // B = Taube → 1B/2B, keine Wahl → A; die App übergibt der Engine story.varianten = { "westminster.g1": "A" | "B" } und story.begleiter = "fuchs" | "taube", s. storyOption). Gabelung dieses Kapitels:
    // A unten (Maschinenraum) / B oben (Kabinen) → story.londoneye.wahl.g1 (für Welt 3). Aufnahmen audio/story/londoneye_<key>.mp3 (+ _sofar; werkzeuge/story_audio.py) – nur Dateien, die der Bau findet (SP.story_audio), sonst Geräte-Stimme.
    londoneye: { id: "londoneye", titel: "The Wheel That Stopped", kapitel: 2, welt: "London Eye", enden: { A: { symbol: "🔘", name: "The machine room" }, B: { symbol: "🎡", name: "Up the wheel" } }, teile: {
      "1A": "The fox is your friend now. He always follows you.", "2A": "Today he sniffs the air. \"Something smells wrong,\" he says.",
      "1B": "The pigeon is your friend now. She often sits on your cap.", "2B": "Today she looks worried. \"Something is wrong,\" she says.",
      3: "The big wheel at the London Eye never stops. But today it doesn't turn.", 4: "Sergeant Bearskin is up there, in the top cabin. Alone.",
      A5: "You run down to the machine room. It's dark and noisy.", A6: "A big red button says: DO NOT PRESS.", A7: "The fox grins. \"I rarely follow rules. Press it!\"", A8: "You press it. The wheel moves. Slowly. The wrong way!",
      B5: "You climb up the wheel. Don't look down!", B6: "Cabin after cabin. The wind is cold and strong.", B7: "The pigeon flies ahead. \"This way! Hurry!\"", B8: "In the top cabin, the Sergeant stands still. As always.",
      9: "\"I like marching,\" the Sergeant says. \"But I don't like heights!\"", 10: "His boots are stuck. Somebody put glue on the floor. Who does that?",
      A11: "The wheel turns again. The Sergeant comes down slowly.", A12: "He steps out of his boots. In his socks! Everybody laughs.",
      B11: "You pull. The pigeon pulls. The boots stay. The Sergeant doesn't!", B12: "\"Thank you,\" he whispers. \"I never say that. Don't tell anyone.\"" },
      audio: null },   // wird unten aus SP.story_audio gefüllt (storyAudioDateien)
    // Kapitel 3 Tower Bridge „Up Goes the Bridge“ (freigegeben 31.10., Text wörtlich aus docs/runner/story-london-03.md): Stücke 1–2 als Variante nach der Wahl aus Welt 2 (story.londoneye.wahl.g1: A = roter Knopf → 1A/2A,
    // B = aufs Rad geklettert → 1B/2B, keine Wahl → A; die App übergibt story.varianten = { "londoneye.g1": … }); der Begleiter aus Welt 1 läuft als „your friend“ weiter mit. Gabelung dieses Kapitels:
    // A die Raben (Tower) / B der Hut (Fluss) → story.towerbridge.wahl.g1 (A = gute Entscheidung für Wembley, B = Cliffhanger: ein Rabe fehlt). Aufnahmen audio/story/towerbridge_<key>.mp3 (+ _sofar), bis dahin Geräte-Stimme.
    towerbridge: { id: "towerbridge", titel: "Up Goes the Bridge", kapitel: 3, welt: "Tower Bridge", enden: { A: { symbol: "🐦", name: "The ravens" }, B: { symbol: "🎩", name: "The hat" } }, teile: {
      "1A": "The Sergeant walks again. But he never goes near red buttons.", "2A": "\"You pressed it,\" he says. \"I rarely forget things like that.\"",
      "1B": "The Sergeant walks again. In new boots. He often looks at them.", "2B": "\"You pulled me out,\" he says. \"I always remember my friends.\"",
      3: "Thursday, half past three. Club time at the Tower: Ghost Club, Key Club, Raven Club.", 4: "The Sergeant feeds the ravens. A loud horn! Up goes the bridge. Hat and ravens fly away!",
      A5: "You run to the Tower. The ravens are gone. All six.", A6: "A ghost from the Ghost Club points to a tree. Ghosts rarely talk.", A7: "The Raven Club has one rule: Never lose a raven. Oops.", A8: "You whistle. The ravens always come for bread. One by one.",
      B5: "The hat is in the river. It swims slowly away.", B6: "A boy from the Key Club has a boat. And one hundred keys. \"Take it!\"", B7: "Row, row, row! The water is cold and brown.", B8: "You catch the hat. It's wet and very, very heavy.",
      9: "Back on the bridge, the Sergeant waits. The bridge is still up.", 10: "\"I like ships,\" the Sergeant says. \"But I don't like waiting!\"",
      A11: "The ravens fly back to the Tower. All six. Phew!", A12: "The Sergeant has no hat. His hair looks like a hedgehog. The Ghost Club laughs. Quietly.",
      B11: "The Sergeant puts on his wet hat. Drip, drip, drip.", B12: "But the ravens? Only five come back. One is missing …" },
      audio: null },   // wird unten aus SP.story_audio gefüllt (storyAudioDateien)
    // Kapitel 4 The Tube „Mind the Gap“ (freigegeben 31.10., Text wörtlich aus docs/runner/story-london-04.md): Stücke 1–2 als Variante nach der Wahl aus Welt 3 (story.towerbridge.wahl.g1: A = Raben gerettet → 1A/2A,
    // B = Hut gerettet, ein Rabe fehlt → 1B/2B, keine Wahl → A; die App übergibt story.varianten = { "towerbridge.g1": … }); der Begleiter aus Welt 1 läuft weiter mit. Gabelung dieses Kapitels:
    // A zurück zum Sergeant (dunkler Bahnsteig, Geist) / B weiterfahren (im Zug, der Rabe) → story.tube.wahl.g1 (A = gute Entscheidung für Wembley, B löst den Raben-Cliffhanger auf). Aufnahmen audio/story/tube_<key>.mp3 (+ _sofar) nach dem 13.11., bis dahin Geräte-Stimme.
    tube: { id: "tube", titel: "Mind the Gap", kapitel: 4, welt: "The Tube", enden: { A: { symbol: "👻", name: "Back to the Sergeant" }, B: { symbol: "🚇", name: "Ride on" } }, teile: {
      "1A": "The ravens are safe. The Sergeant has a new hat. It's too big.", "2A": "Today he goes to Wembley by tube. The big match is on Saturday!",
      "1B": "One raven is still missing. The Sergeant rarely sleeps now.", "2B": "\"Maybe it's on the tube,\" he says. \"Ravens like trains.\" Do they?",
      3: "The journey is long: twelve stops. The Sergeant falls asleep at stop two.", 4: "\"Mind the gap!\" says a voice. The doors close. You're on the wrong train!",
      A5: "You jump off at the next stop. Quick! Back to the Sergeant!", A6: "The platform is dark. A ghost sits on a bench. \"Hello again.\"", A7: "\"Trains here are always late,\" he says. \"I've waited since 1899.\"", A8: "Train after train. The wrong way, the right way, finally your way.",
      B5: "You stay on the train. The map says: Wembley in six stops.", B6: "A pigeon? No, a raven! It sits on the seat next to you.", B7: "The train is fast and full. Everybody looks at their phones.", B8: "\"Mind the gap!\" Wembley Park. The raven gets off with you.",
      9: "Wembley Stadium, 11 a.m. The Sergeant is already there. How?", 10: "\"I never sleep on the tube,\" he says. He has a pillow mark on his face.",
      A11: "The ghost waves from the last train. \"See you at the match!\"", A12: "Ghosts don't need tickets. Lucky them.",
      B11: "The raven lands on the Sergeant's hat. It likes it there.", B12: "Is it the Tower raven? The Sergeant smiles. \"It is now.\"" },
      audio: null },   // wird unten aus SP.story_audio gefüllt (storyAudioDateien); Dateien gibt es noch nicht → Geräte-Stimme
    // Kapitel 5 Wembley „The Big Match“ (freigegeben 1.11., Text wörtlich aus docs/runner/story-london-05.md): Stücke 1–2 als Variante nach der Wahl aus Welt 4 (story.tube.wahl.g1: A = zurückgegangen → 1A/2A (der Geist),
    // B = weitergefahren → 1B/2B (der Rabe auf der Mütze), keine Wahl → A; die App übergibt story.varianten = { "tube.g1": … }). Gabelung dieses Kapitels: A hinauf über die Tribünen / B hinunter durch den Spielertunnel
    // → story.wembley.wahl.g1 (zählt nicht). DREI ENDEN nach Zählung der guten Entscheidungen (londoneye B + towerbridge A + tube A; fehlende Welten zählen nicht): 3 → E1, 1–2 → E2, 0 → E3 (story.gute → Engine).
    // Aufnahmen audio/story/wembley_<key>.mp3 (+ _sofar) nach dem 13.11., bis dahin Geräte-Stimme.
    wembley: { id: "wembley", titel: "The Big Match", kapitel: 5, welt: "Wembley", wege: { A: { symbol: "🪜", name: "The stands" }, B: { symbol: "🌱", name: "The tunnel" } },
      enden: { E1: { symbol: "🏆", name: "The Sergeant scores" }, E2: { symbol: "👻", name: "The ghost scores" }, E3: { symbol: "🎩", name: "Bounce" } }, teile: {
      "1A": "Saturday, 3 p.m. England v Scotland at Wembley! The ghost is here too. He never pays.", "2A": "\"Are you free after the match?\" the Sergeant asks. \"Let's have tea.\"",
      "1B": "Saturday, 3 p.m. England v Scotland at Wembley! The raven sits on the Sergeant's hat.", "2B": "\"Are you free after the match?\" the Sergeant asks. \"I'd love to,\" you say.",
      3: "Ninety thousand people. I can hear them: \"Come on, England!\" I can smell the chips.", 4: "Then the big screen says: KICK-OFF IN 10 MINUTES. NO REFEREE!",
      A5: "You run up the stands. Row after row. Does anybody know the referee?", A6: "\"No, I don't,\" says a man. \"No, I don't,\" says Bukayo Saka. \"Yes, I do!\" A boy.", A7: "The referee is stuck in the toilet! Door locked. He feels angry and sad.", A8: "The Sergeant kicks the door. Boom. He feels surprised. The door too.",
      B5: "You run down the tunnel. It's dark and it smells of grass.", B6: "\"Does Harry Kane play today?\" the ghost asks. \"Yes, he does. And Phil Foden too.\"", B7: "The referee is here. But his whistle is gone. Who takes a whistle?", B8: "A bird! Black feathers on the floor. Ravens always take shiny things.",
      9: "Kick-off! Kane, Bellingham, Saka and Foden run. \"It's coming home!\" sings the crowd.", 10: "The Sergeant stands at the pitch gate. Still. \"Does he ever move?\" asks Declan Rice.",
      E1_11: "Bellingham passes. The Sergeant moves! One step. He shoots, he scores! Top corner!", E1_12: "He never moved. Today he did. \"What a strike, Sergeant!\" Harry Kane laughs.",
      E2_11: "Kane shoots. The ball flies to the gate. The Sergeant doesn't move. The ghost does!", E2_12: "Ghosts can't kick. But they can scare. The Scottish goalkeeper runs away. The ball is in the back of the net!",
      E3_11: "Saka shoots. It hits the Sergeant's hat. Bounce. Over the bar! GOAL?", E3_12: "\"Not this time, soldier,\" the referee says. Offside! Jordan Pickford laughs. What a day!" },
      audio: null },   // wird unten aus SP.story_audio gefüllt (storyAudioDateien); Dateien gibt es noch nicht → Geräte-Stimme
  };
  const STORY_KEYS_EYE = ["1A", "2A", "1B", "2B", "3", "4", "A5", "A6", "A7", "A8", "B5", "B6", "B7", "B8", "9", "10", "A11", "A12", "B11", "B12", "sofar"];
  // Aufnahmen je Kapitel: ein Stück = eine Datei (<praefix>_<key>.mp3) oder mehrere Teile (<praefix>_<key>_1.mp3, _2 …); nur Dateien, die der Bau findet (SP.story_audio)
  const storyAudioDateien = (praefix, keys) => Object.fromEntries(keys.map((k) => {
    const alle = SP.story_audio || [], eins = `audio/story/${praefix}_${k}.mp3`;
    if (alle.includes(eins)) return [k, eins];
    const teile = []; for (let i = 1; alle.includes(`audio/story/${praefix}_${k}_${i}.mp3`); i++) teile.push(`audio/story/${praefix}_${k}_${i}.mp3`);
    return teile.length ? [k, teile] : null;
  }).filter(Boolean));
  STORY.londoneye.audio = storyAudioDateien("londoneye", STORY_KEYS_EYE);
  const STORY_KEYS_BRIDGE = STORY_KEYS_EYE;   // Kapitel 3 hat dieselben Schlüssel (1A/2A, 1B/2B, 3–4, A5–A8, B5–B8, 9–10, A11–A12, B11–B12, sofar)
  STORY.towerbridge.audio = storyAudioDateien("towerbridge", STORY_KEYS_BRIDGE);
  const STORY_KEYS_TUBE = STORY_KEYS_EYE;   // Kapitel 4 hat dieselben Schlüssel
  STORY.tube.audio = storyAudioDateien("tube", STORY_KEYS_TUBE);   // noch keine Dateien (Vertonung nach dem 13.11.) → leer → Geräte-Stimme
  const STORY_KEYS_WEMBLEY = ["1A", "2A", "1B", "2B", "3", "4", "A5", "A6", "A7", "A8", "B5", "B6", "B7", "B8", "9", "10", "E1_11", "E1_12", "E2_11", "E2_12", "E3_11", "E3_12", "sofar"];   // Kapitel 5: drei Enden E1/E2/E3
  STORY.wembley.audio = storyAudioDateien("wembley", STORY_KEYS_WEMBLEY);   // noch keine Dateien (Vertonung nach dem 13.11.) → leer → Geräte-Stimme
  const STORY_KAPITEL = ["westminster", "londoneye", "towerbridge", "tube", "wembley"];   // gebaute Kapitel in Reihenfolge (Story Library, Dein Weg)
  // Zählung für Welt 5 (Mr. Alex, 1.11.): gute Entscheidungen = aufs Rad geklettert (Welt 2 B) + Raben gerettet (Welt 3 A) + zurückgegangen (Welt 4 A); eine nie gespielte Welt zählt nicht als gut
  const STORY_GUT = { londoneye: "B", towerbridge: "A", tube: "A" };
  const storyGute = () => Object.keys(STORY_GUT).filter((w) => storyStand(w).wahl.g1 === STORY_GUT[w]).length;
  const storyEndeLabel = (welt, en) => `Ending ${welt === "wembley" ? en.replace(/^E/, "") : en}`;   // Wembley: E1 → „Ending 1“
  const storyEnden = (welt) => (STORY[welt] && STORY[welt].enden) || STORY_ENDEN;   // Enden je Kapitel (Welt 1: Fuchs/Taube)
  // Story-Option für die Engine: Text + Varianten und Begleiter aus den vorigen Kapiteln (Kapitel 2 liest story.westminster.wahl.g1: B = Taube, sonst Fuchs; Kapitel 3 liest story.londoneye.wahl.g1:
  // B = aufs Rad geklettert, sonst A = roter Knopf; Kapitel 4 liest story.towerbridge.wahl.g1: B = Hut gerettet (ein Rabe fehlt), sonst A = Raben gerettet – auch wenn die Welt nie geschafft wurde;
  // der Begleiter aus Welt 1 läuft in Welt 2–5 mit; Kapitel 5 liest story.tube.wahl.g1 (B = weitergefahren, sonst A) und bekommt die Zählung der guten Entscheidungen als gute (0–3) für das Ende E1/E2/E3)
  function storyOption(welt) {
    const S = STORY[welt]; if (!S) return null;
    const w1 = storyStand("westminster").wahl.g1 === "B" ? "B" : "A", w2 = storyStand("londoneye").wahl.g1 === "B" ? "B" : "A", w3 = storyStand("towerbridge").wahl.g1 === "B" ? "B" : "A", w4 = storyStand("tube").wahl.g1 === "B" ? "B" : "A";
    return Object.assign({}, S, { varianten: { "westminster.g1": w1, "londoneye.g1": w2, "towerbridge.g1": w3, "tube.g1": w4 }, begleiter: w1 === "B" ? "taube" : "fuchs", gute: storyGute() });
  }
  // 🧭 Dein Weg: Kette der gespeicherten Entscheidungen bis zu einem Kapitel („🦊 The fox → 🔘 machine room“); aktuell = { g1, ende } des laufenden Laufs für das letzte Kapitel.
  // Wembley: der Weg (🪜 The stands / 🌱 The tunnel) zählt nicht – dahinter steht das erreichte Ende (aus dem Lauf, sonst das zuletzt freigespielte)
  function storyPfad(bisWelt, aktuell) {
    const teile = [];
    for (const welt of STORY_KAPITEL) {
      const st = storyStand(welt), g1 = welt === bisWelt && aktuell ? aktuell.g1 : st.wahl.g1, S = STORY[welt];
      if (S && S.wege) {
        const Wg = g1 && S.wege[g1]; if (Wg) teile.push(`${Wg.symbol} ${Wg.name}`);
        const en = welt === bisWelt && aktuell && aktuell.ende ? aktuell.ende : st.enden[st.enden.length - 1], E = en && S.enden[en];
        if (E) teile.push(`${E.symbol} ${E.name}`);
      } else { const E = g1 && storyEnden(welt)[g1]; if (E) teile.push(`${E.symbol} ${E.name}`); }
      if (welt === bisWelt) break;
    }
    return teile.join(" → ");
  }
  const STORY_PUNKTE = { diamant: 1, ganz: 10, max: 30 };
  const STORY_ENDEN = { A: { symbol: "🦊", name: "The fox" }, B: { symbol: "🕊️", name: "The pigeon" } };
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
  // Erzähler: Aufnahme(n), falls vorhanden, sonst Geräte-Stimme (britisch, männlich); im Lauf hinter einer laufenden Wiedergabe, an Station/Film sofort
  const erzaehlerStimme = (text, o) => {
    const dateien = o && o.audio ? [].concat(o.audio) : [];
    const liste = dateien.length && dateien.every(Boolean) ? dateien : [{ tts: text, lang: "en-GB", stimme: "m" }];
    return hauptText(liste, o && o.sofort ? {} : { warten: true });
  };
  const runnerAudio = (id) => (SP.runner_audio && SP.runner_audio[id]) || null;
  const runnerEndeText = (W) => { const rw = ((R() && R().WELTEN) || []).find((x) => x.id === W.id); return (rw && rw.ende) || `You found ${W.ziel}!`; };
  const HELD_STIMME = { leo: "m", kenji: "m", felix: "m", max: "m", camilla: "f", ellie: "f", olivia: "f", zara: "f", penny: "f", tessa: "f" }; // Geräte-Stimme, falls eine Cameo-Aufnahme fehlt
  // 🪩 Disco Run (Bonus-Level, 7.11.2026, Idee C von Mr. Alex): nicht in der Welt-Reihe; einmalige Überraschung nach dem ersten geschafften Level (Feier), danach Knopf unter den Welten, Ticket wie immer
  const RUNNER_DISCO = { id: "disco", name: "Disco Run", staat: "Bonus", ziel: "the disco ball", trophaee: "Disco Star", symbol: "🪩", boss: "DJ Funky Flamingo", tuer: "der Glitzervorhang", bonus: true, ab: 1 };
  const runnerWeltOffen = (w) => { if (w && w.bonus) return (runnerStand().geschafft || 0) >= w.ab; const i = RUNNER.welten.indexOf(w); return !w.bald && (i <= 0 || !!runnerStand().level[RUNNER.welten[i - 1].id]); };
  const runnerWeltVon = (id) => (id === RUNNER_DISCO.id ? RUNNER_DISCO : RUNNER.welten.find((w) => w.id === id) || RUNNER.welten[0]);
  function discoFeier() {   // einmal: „Disco Run unlocked!“ (stand.spiel.runner.disco = 1)
    const r = runnerStand(); if (r.disco || !runnerWeltOffen(RUNNER_DISCO)) return false;
    r.disco = 1; speichern();
    ereignisse.push({ art: "feier", symbol: "🪩", titel: "Disco Run unlocked!", text: "Überraschung! Ein Bonus-Level ist frei: 🪩 Disco Run – Tanzfläche, Discokugel und DJ Funky Flamingo. Du findest es im London Run unter den Welten.", ton: { audio: { tts: "Surprise! Disco Run unlocked! Let's dance!", lang: "en-GB", stimme: "m" } } });
    return true;
  }
  const R = () => window.Runner || null;
  function runnerStand() {
    const sp = spielstand();
    if (!sp.runner || typeof sp.runner !== "object") sp.runner = { level: {}, gespielt: 0, geschafft: 0, titel: 0 };
    if (!sp.runner.level) sp.runner.level = {};
    if (!sp.skin || typeof sp.skin !== "object") sp.skin = {};
    return sp.runner;
  }
  const runnerTitelIndex = (n) => RUNNER.ab.filter((a) => n >= a).length; // 0 = noch keiner, 1 = Rookie Runner … 5 = Superhero of London
  const runnerTitelName = (i) => (i > 0 ? RUNNER.titel[i - 1] : null);
  const skinWirksam = () => (runnerStand(), R() ? R().powerAnwenden(spielstand().skin, spielstand().titel) : spielstand().skin); // Power-Körper nach Punkte-Titel-Stufe
  const skinFrei = (key, wert) => !R() || R().skinFrei(key, wert) || spielstand().gekauft.includes(R().skinArtikel(key, wert));
  function skinSetzen(key, wert) {
    const s = (runnerStand(), spielstand().skin);
    if (key === "muskeln" && (s.power || "an") === "an") s.muskelnManuell = wert; // Power-Körper an: Muskeln von Hand überschreiben
    else { s[key] = wert; if (key === "power" && wert === "an") delete s.muskelnManuell; }
    speichern();
  }
  const de2 = (p) => (Array.isArray(p) ? p[0] : String(p)); // Skin-Namen der Engine: [Deutsch, Englisch] → Deutsch
  // Vorschau-Figur (Canvas), läuft nur solange sie in der Seite ist; bei prefers-reduced-motion ein Standbild
  function figurVorschau(breite, hoehe) {
    const cv = el("canvas", { class: "runner-vorschau", width: breite * 2, height: hoehe * 2, style: `width:${breite}px;height:${hoehe}px`, "aria-hidden": "true" });
    const c = cv.getContext("2d");
    const male = (pose, t) => {
      c.setTransform(2, 0, 0, 2, 0, 0); c.clearRect(0, 0, breite, hoehe);
      c.fillStyle = "#e9f4ff"; c.beginPath(); c.roundRect(0, 0, breite, hoehe, 18); c.fill();
      if (R()) { const s = skinWirksam(); R().zeichneFigur(c, breite / 2, hoehe * 0.95, Math.min(hoehe * 0.72, hoehe * 0.9 * 80 / R().figurHoehe(s)), s, pose, t); }
    };
    const lauf = () => { if (!cv.isConnected) return; male("lauf", performance.now() / 1000); requestAnimationFrame(lauf); };
    requestAnimationFrame(() => (ruhig() ? male("steh", 0) : lauf()));
    cv.neuMalen = () => male(ruhig() ? "steh" : "lauf", performance.now() / 1000);
    return cv;
  }
  // 12 Wörter: zuerst der gewählte Abschnitt (gemischt), dann Wörter der übrigen Abschnitte von Station 7
  function runnerWoerter(i) {
    const gruppen = station(7).gruppen, g = gruppen[i];
    if (!g) return [];
    const ok = (v) => catchOk(v) && v.de;
    const eigene = mischen(g.vokabeln.map(vokabel).filter(ok));
    const rest = mischen(gruppen.filter((x) => x !== g).flatMap((x) => x.vokabeln).map(vokabel).filter((v) => ok(v) && !eigene.includes(v)));
    return eigene.concat(rest).slice(0, RUNNER.woerter);
  }
  // Cameos: bis zu 3 Helden, zuerst die schon gesammelten (gemischt), dann die übrigen
  function runnerCameos() {
    const sp = spielstand(), frei = mischen(SP.helden.filter((h) => sp.helden.includes(h.id))), rest = mischen(SP.helden.filter((h) => !sp.helden.includes(h.id)));
    return frei.concat(rest).slice(0, 3).map((h) => ({ id: h.id, name: h.name, bild: h.bild, kraft: h.kraft }));
  }
  let runnerWahl = null, runnerLauf = null, skinTab = "haare";
  function runnerAus() {
    if (runnerLauf) { try { runnerLauf.stopp(); } catch (e) { /* egal */ } runnerLauf = null; }
    document.body.classList.remove("runner-aktiv");
  }
  const runnerFehlt = () => Math.max(0, RUNNER.preis - spielstand().coins);
  const trophaeenText = (st) => (st === "gold" ? "🥇 Gold" : st === "silber" ? "🥈 Silber" : "–");
  const zumRunnerShop = () => shop({ zurueck: () => runnerStart(), artikel: "runner" });
  // Startseite: Welt, Figur, Wörter (Abschnitt aus Station 7), Tickets und Coins, Spielen
  function runnerStart() {
    lage = null;
    const sp = spielstand(), r = runnerStand(), gruppen = station(7).gruppen;
    if (!runnerWahl || !gruppen[runnerWahl.i]) runnerWahl = { i: 0, welt: runnerWahl && runnerWahl.welt };
    let W = runnerWeltVon(runnerWahl.welt);
    if (!runnerWeltOffen(W) || W.bonus) { W = RUNNER.welten[0]; runnerWahl.welt = W.id; }
    const tickets = r.tickets || 0, fehlt = runnerFehlt(), ws = runnerWoerter(runnerWahl.i), titel = runnerTitelName(r.titel);
    // Ohne Ticket führt der Hauptknopf in den Shop (Ticket hervorgehoben), damit klar ist, wo man hin muss
    const spielen = tickets > 0
      ? knopf("▶ Spielen (🎟️ 1)", () => runnerSpiel(runnerWahl.i, W.id), "haupt runner-spielen")
      : knopf(`🎟️ Erst Ticket kaufen – ${RUNNER.preis} 🪙`, zumRunnerShop, "haupt runner-spielen");
    if (tickets > 0 && (ws.length < 4 || !R())) sperrt(spielen);
    const weltHinweis = el("p", { class: "klein runner-welt-hinweis", role: "status" });
    const weltReiter = el("div", { class: "reiter runner-welten", role: "listbox", "aria-label": "Welt" }, RUNNER.welten.map((w, i) => {
      const offen = runnerWeltOffen(w), vor = RUNNER.welten[i - 1];
      return el("button", { class: "reiter-knopf" + (offen ? "" : " gesperrt"), role: "option", "aria-selected": String(w.id === W.id), "aria-disabled": String(!offen), "data-welt": w.id,
        onclick: () => {
          if (!offen) { weltHinweis.textContent = w.bald ? `${w.name} kommt bald.` : `🔒 Silber in ${vor.name} nötig – schaff erst Level ${i}!`; toast(weltHinweis.textContent); return; }
          runnerWahl = { i: runnerWahl.i, welt: w.id }; runnerStart();
        } }, `${offen ? w.symbol : "🔒"} ${i + 1} · ${w.name}`);
    }));
    zeige(spielKopf("London Run", zeigeSpiele),
      el("section", { class: "satzkarte runner-start" },
        weltReiter, weltHinweis,
        spassKnopf(),   // Spaß-Level (7.11.)
        runnerWeltOffen(RUNNER_DISCO) && el("p", { class: "runner-kapitel6 runner-disco" }, knopf("🪩 Bonus · Disco Run", () => runnerSpiel(runnerWahl.i, RUNNER_DISCO.id), "leise"), " ", el("small", {}, `DJ Funky Flamingo wartet – 🏆 ${RUNNER_DISCO.trophaee}: ${trophaeenText(r.level.disco)}`)),
        el("div", { class: "runner-welt" },
          el("span", { class: "runner-welt-sym", "aria-hidden": "true" }, W.symbol),
          el("div", {},
            el("h2", { lang: "en" }, `Level ${RUNNER.welten.indexOf(W) + 1} · ${W.name}`),
            el("p", { class: "runner-ziel", lang: "en" }, `Find ${W.ziel}!`),
            el("p", { class: "klein" }, runnerStartText(W)))),
        el("div", { class: "runner-figur" }, figurVorschau(110, 140),
          el("div", { class: "runner-figur-text" },
            el("p", { class: "klein" }, "Deine Figur"),
            knopf("🎨 Figur", () => runnerSkins()))),
        el("p", { class: "runner-stand" },
          el("span", {}, `🏃 ${titel || "noch kein Titel"}`),
          el("span", {}, `🏆 ${W.trophaee}: ${trophaeenText(r.level[W.id])}`),
          el("span", {}, `🎮 ${r.gespielt} Spiele · ${r.geschafft} Level geschafft`))),
      el("section", { class: "satzkarte" },
        el("h2", {}, "Welche Wörter?"),
        el("div", { class: "reiter runner-gruppen", role: "listbox", "aria-label": "Abschnitt" }, gruppen.map((g, i) =>
          el("button", { class: "reiter-knopf", role: "option", "aria-selected": String(i === runnerWahl.i), onclick: () => { runnerWahl = { i, welt: W.id }; runnerStart(); } }, g.name))),
        ws.length > 0 && el("p", { class: "klein runner-woerter", lang: "en" }, ws.map(spielWort).join(" · "))),
      el("section", { class: "satzkarte runner-kasse" },
        el("p", { class: "shop-coins" }, `🎟️ ${tickets} Tickets · 🪙 ${sp.coins} Coins`),
        tickets === 0 ? el("p", { class: "runner-hinweis", role: "status" }, fehlt > 0
            ? `Zum Spielen brauchst du ein Ticket aus dem Shop (${RUNNER.preis} Coins). Dir fehlen noch ${fehlt} Coins – übe weiter!`
            : `Zum Spielen brauchst du ein Ticket aus dem Shop (${RUNNER.preis} Coins). Kauf erst ein Ticket, dann geht's los!`)
          : el("p", { class: "klein" }, "Ein Ticket gilt für einen Durchgang – auch wenn du scheiterst. Keine Coins zurück, dafür Trophäe und Runner-Titel. Punkte nur, wenn du das Level schaffst: 1 ⭐ je 💎, +10 ⭐ einmal je ganzer Geschichte (höchstens 30 ⭐ je Lauf)."),
        el("div", { class: "knopfreihe" }, spielen, knopf("🛍️ Shop", zumRunnerShop))));
    if (discoFeier()) setTimeout(zeigeEreignisse, 50);   // wer schon vorher ein Level geschafft hat
  }
  // Erklärtext der Startseite je Welt (deutsche Bedienung, englische Spielsätze)
  function runnerStartText(W) {
    if (W.id === "wembley") {
      const w1 = storyStand("westminster").wahl.g1 === "B" ? "🕊️ die Taube" : "🦊 der Fuchs", w4 = storyStand("tube").wahl.g1 === "B" ? "du weitergefahren bist – der Rabe sitzt jetzt auf seiner Mütze" : "du zu ihm zurückgegangen bist – der Geist ist natürlich auch da";
      return `Tippen oder Leertaste = springen, länger halten = höher. Vor dem Stadion: Stand-Dächer und Ballkisten sind Stufen, in Pfützen rutschst du, in die Baugrube fällst du hinein, Tauben, Füchse und Eichhörnchen kannst du plattdrücken. Neu in Wembley: Bälle rollen dir entgegen – drüberspringen oder im Sprung köpfen (platt!), sonst ist ein Leben weg. ${w1} aus Welt 1 begleitet dich, und der Sergeant weiß noch, dass ${w4}. Die violetten ♪-Kristalle erzählen „${STORY.wembley.titel}“ – hinauf über die Tribünen (Sitzreihen als Stufen, eine verschlossene Toilettentür) oder hinunter durch den dunklen Spielertunnel (es riecht nach Rasen)? Beides führt auf den Rasen. Die Geschichte hat drei Enden: Welches Ende du bekommst, hängt von deinen Entscheidungen in Welt 2 bis 4 ab – nicht von diesem Weg. Die 💎-Diamanten zeigen dir Wörter und geben je 1 ⭐. Nimm die richtigen Tore und beantworte die Frage von ${W.boss} ${W.ort} – gut 2 Minuten. Am besten das Handy quer halten.`;
    }
    if (W.id === "tube") {
      const w1 = storyStand("westminster").wahl.g1 === "B" ? "🕊️ die Taube" : "🦊 der Fuchs", w3 = storyStand("towerbridge").wahl.g1 === "B" ? "seinen nassen Hut gerettet hast – ein Rabe fehlt noch" : "seine Raben gerettet hast";
      return `Tippen oder Leertaste = springen, länger halten = höher. Unter der Erde: Rolltreppen und Koffer sind Stufen, auf nassem Boden rutschst du, Tauben und Mäuse kannst du plattdrücken. Neu in der Tube: „Mind the gap!“ – vor der Lücke zwischen Bahnsteig und Zug kommt eine Durchsage, dann musst du springen, sonst fällst du hinein. Im Zug schließen sich die Türen: Warnton, blinkende Kanten – schnell durch oder drüberspringen! ${w1} aus Welt 1 begleitet dich, und der Sergeant weiß noch, dass du in Welt 3 ${w3}. Die violetten ♪-Kristalle erzählen „${STORY.tube.titel}“ – aussteigen und zurück zum Sergeant (dunkler Bahnsteig, ein alter Bekannter auf der Bank) oder sitzen bleiben und weiterfahren (oben im Zug, mit einem Raben neben dir)? Du entscheidest, wie sie ausgeht. Die 💎-Diamanten zeigen dir Wörter und geben je 1 ⭐. Nimm die richtigen Tore und beantworte die Frage von ${W.boss} ${W.ort} – gut 2 Minuten. Am besten das Handy quer halten.`;
    }
    if (W.id === "towerbridge") {
      const w1 = storyStand("westminster").wahl.g1 === "B" ? "🕊️ die Taube" : "🦊 der Fuchs", w2 = storyStand("londoneye").wahl.g1 === "B" ? "aufs Rad geklettert bist" : "den roten Knopf gedrückt hast";
      return `Tippen oder Leertaste = springen, länger halten = höher. Black Cabs und rote Busse kommen dir entgegen, in Pfützen rutschst du, in die Themse fällst du hinein. Neu an der Tower Bridge: ein Horn, rotes Licht – und die Brückenklappen heben sich! Lauf die Rampe hinauf und spring an der Spitze über die Lücke, sonst landest du im Fluss. Raben fliegen wie Tauben (plattdrücken oder drüber), Möwen klauen einen Diamanten. ${w1} aus Welt 1 begleitet dich, und der Sergeant weiß noch, dass du in Welt 2 ${w2}. Die violetten ♪-Kristalle erzählen „${STORY.towerbridge.titel}“ – oben durch den Tower zu den Raben oder unten im Ruderboot dem Hut hinterher (über Treibgut springen)? Du entscheidest, wie sie ausgeht. Die 💎-Diamanten zeigen dir Wörter und geben je 1 ⭐. Nimm die richtigen Tore und beantworte die Frage von ${W.boss} ${W.ort} – gut 2 Minuten. Am besten das Handy quer halten.`;
    }
    if (W.id === "londoneye") {
      const w1 = storyStand("westminster").wahl.g1 === "B" ? "🕊️ die Taube" : "🦊 der Fuchs";
      return `Tippen oder Leertaste = springen, länger halten = höher. Black Cabs und rote Busse kommen dir entgegen, in Pfützen rutschst du, in die Themse fällst du hinein. Neu am South Bank: schwebende Kabinen des London Eye sind Stufen, unten führt eine Treppe in den dunklen Maschinenraum, und Möwen klauen dir einen Diamanten – drüberspringen oder plattdrücken! ${w1} aus Welt 1 begleitet dich. Die violetten ♪-Kristalle erzählen „${STORY.londoneye.titel}“ – hinunter in den Maschinenraum oder hinauf aufs Rad? Du entscheidest, wie sie ausgeht. Die 💎-Diamanten zeigen dir Wörter und geben je 1 ⭐. Nimm die richtigen Tore und beantworte die Frage von ${W.boss} ${W.ort} – gut 2 Minuten. Am besten das Handy quer halten.`;
    }
    return `Tippen oder Leertaste = springen, länger halten = höher (über Doppeldecker!). Black Cabs und rote Busse kommen dir entgegen – drüberspringen! In Pfützen rutschst du kurz. Telefonzellen und Postkästen sind Stufen, in die Themse fällst du hinein. Tauben, Füchse und Eichhörnchen kannst du plattdrücken. Manchmal helfen dir die geheimen Superhelden. ${STORY[W.id] ? `Die violetten ♪-Kristalle erzählen die Geschichte „${STORY[W.id].titel}“ – oben auf dem Bus oder unten auf der Straße? Du entscheidest, wie sie ausgeht. Die 💎-Diamanten zeigen dir Wörter und geben je 1 ⭐.` : "Sammle die 12 Wort-Diamanten,"} Nimm die richtigen Tore und beantworte die Frage von ${W.boss} ${W.ort || "am Tor der Horse Guards"} – gut 2 Minuten. Am besten das Handy quer halten.`;
  }
  // Spiel: Ticket einlösen, Vollbild-Bühne ohne Kopfzeile, ✕ mit Rückfrage
  function runnerSpiel(i, welt) {
    const r = runnerStand(), ws = runnerWoerter(i), W = runnerWeltVon(welt);
    if (!runnerWeltOffen(W)) return runnerStart();
    if (!R()) { toast("Das Spiel ist noch nicht geladen."); return; }
    if (ws.length < 4) return runnerStart();
    if (!(r.tickets > 0)) { toast("Kauf erst ein Ticket im Shop."); return zumRunnerShop(); }
    r.tickets--; r.gespielt++; speichern();
    toast("🎟️ Ticket eingelöst");
    lage = null;
    const buehne = el("div", { class: "runner-buehne" });
    const abbruch = knopf("✕", () => {
      if (R().ueberspringen && R().ueberspringen()) return; // im Film am Ende: ✕ überspringt nur den Film (das Ergebnis bleibt)
      frage("Abbrechen? Das Ticket ist weg.", "Abbrechen", "Weiterspielen").then((ok) => { if (ok) runnerStart(); });
    }, "runner-x");
    abbruch.setAttribute("aria-label", "Spiel abbrechen");
    zeige(buehne, abbruch);
    document.body.classList.add("runner-aktiv");
    runnerLauf = R().start({
      wrapper: buehne, skin: skinWirksam(), welt: W.id, titel: "London Run", cameos: runnerCameos(), story: storyOption(W.id),   // Story (Welt 1–4; Welt 2–4 mit Varianten aus den vorigen Welten, Begleiter aus Welt 1)
      audio: Object.assign({ alex: runnerAudio("alex") }, runnerAudio(W.id) || {}),   // Aufnahmen: Boss Mr. Alex, Levelstart Elrond, Cameos Jugendstimmen, Zurufe Mr. Alex (fehlende = Geräte-Stimme)
      woerter: ws.map((v) => ({ en: spielWort(v), de: v.de })),
      texte: { bossTitel: `${W.boss} fragt …`, bossHinweis: `Richtig = ${W.tuer || "das Tor der Horse Guards"} geht auf. Falsch = ein Leben weg.` },
      // wort(j, { leise: true }) = Echo im Spiel: leiser und hinter einer laufenden Wiedergabe, statt sie abzuschneiden
      stimme: { wort: (j, o) => runnerWort([ws[j % ws.length].audio.en], o && o.leise ? { laut: 0.6, warten: true } : o && o.warten ? { warten: true } : {}),
        erzaehler: erzaehlerStimme, still: () => stopp(),
        boss: (text, o) => hauptText([(o && o.audio) || { tts: text, lang: "en-GB", stimme: "m" }], {}, true),
        ansage: (text, o) => hauptText([(o && o.audio) || { tts: text, lang: "en-GB", stimme: "m" }], { warten: true }),
        cameo: (text, id, o) => hauptText([(o && o.audio) || { tts: text, lang: "en-GB", stimme: HELD_STIMME[id] || "f" }], { warten: true }),
        // Mr. Alex' Zurufe (7.11.): hinter Held/Erzähler/Boss und hinter einer laufenden Vokabel (warten), nie dazwischen
        alex: (text, key, o) => hauptText([(o && o.audio) || { tts: text, lang: "en-GB", stimme: "m" }], { warten: true }),
        // U-Bahn-Durchsage („Please mind the doors.“): nur wenn gerade kein Haupttext läuft – nie störend
        durchsage: (text, o) => { if (!hauptLaeuft) hauptText([{ tts: text, lang: (o && o.lang) || "en-GB", stimme: "m" }], { warten: true }); },
        beschaeftigt: () => hauptLaeuft },   // Runner 7.11.: läuft gerade ein Haupttext? (der Cameo-Auftritt wartet dahinter, höchstens ≈ 6 s)
      onEnde: (e) => runnerEnde(i, e, ws, W.id),
    });
  }
  // Ende: Trophäe + Titel speichern (nur bei Erfolg), Wortliste mit 🔊, noch mal (neues Ticket) oder Startseite
  function runnerEnde(i, e, ws, welt) {
    const r = runnerStand(), W = runnerWeltVon(welt), naechsteWelt = W.bonus ? null : RUNNER.welten[RUNNER.welten.indexOf(W) + 1];
    let stufe = null, neuOffen = false, storyPunkte = 0, storyNeuFrei = false;
    if (e.geschafft) {
      r.geschafft++;
      stufe = e.diamanten >= e.max && e.toreRichtig >= 2 ? "gold" : "silber";
      neuOffen = !r.level[W.id] && !!naechsteWelt && !naechsteWelt.bald;
      if (stufe === "gold" || !r.level[W.id]) r.level[W.id] = stufe;
      if (e.story && e.story.ende) { // Story: Ende freigespielt, beste ♪-Zahl je Ende, Punkte (nur bei geschafftem Level)
        const ws_ = storyStand(W.id), en = e.story.ende;
        if (!ws_.enden.includes(en)) { ws_.enden.push(en); storyNeuFrei = true; }
        ws_.beste[en] = Math.max(ws_.beste[en] || 0, e.story.anzahl);
        if (e.geschafft) ws_.wahl = Object.assign({}, ws_.wahl, e.story.wahl || {}); // Dein Weg (31.10., Mr. Alex): die Wahl zählt in den nächsten Kapiteln weiter
        const dia = Math.max(0, e.punkteDiamanten || 0) * STORY_PUNKTE.diamant;
        const ganz = e.story.vollstaendig && !ws_.voll.includes(en) ? STORY_PUNKTE.ganz : 0;
        if (e.story.vollstaendig && !ws_.voll.includes(en)) ws_.voll.push(en);
        storyPunkte = Math.min(STORY_PUNKTE.max, dia + ganz);
        if (dia > 0) ereignisse.push({ art: "toast", text: `+${dia} ⭐ Diamanten` });
        if (ganz > 0) ereignisse.push({ art: "toast", text: `📖 Ganze Geschichte +${ganz}` });
      }
      const t = runnerTitelIndex(r.geschafft);
      if (t > (r.titel || 0)) {
        r.titel = t;
        const name = runnerTitelName(t);
        ereignisse.push({ art: "feier", symbol: t === RUNNER.titel.length ? "🦸" : "🏃", titel: `London Run: ${name}`, text: `Neuer Runner-Titel: ${name}!`, ton: waehleRuf("stark") });
      }
    }
    discoFeier();   // 🪩 nach dem ersten geschafften Level: Überraschung
    kartenAuswerten(e, stufe);   // Folien-Karten: Cameos zählen, Aufstiege als Ereignis
    if (storyPunkte > 0) punkteDazu(storyPunkte, { art: "s" }); // Zeitlog (mrAlexWacht) läuft in punkteDazu, damit Farmen im London Run auffällt
    speichern();
    const r_ = waehleRuf(e.geschafft ? "stark" : "fehler");
    const sEnde = e.story && e.story.ende ? storyEnden(W.id)[e.story.ende] : null, pfad = e.story && e.geschafft && sEnde ? storyPfad(W.id, Object.assign({}, e.story.wahl, { ende: e.story.ende })) : "";
    const minuten = `${Math.floor(e.dauer / 60)}:${String(e.dauer % 60).padStart(2, "0")}`;
    const zeichne = () => {
      zeige(spielKopf("London Run", runnerStart),
        el("section", { class: (e.geschafft ? "geschafft" : "satzkarte") + " runner-ende" },
          el("div", { class: "runner-pokal", "aria-hidden": "true" }, e.geschafft ? (stufe === "gold" ? "🥇" : "🥈") : "💤"),
          el("h2", { lang: "en" }, e.geschafft ? "Level complete!" : "Game over"),
          r_ && el("p", { class: "gym-lob" }, el("strong", { lang: "en" }, r_.text), r_.de && el("span", { lang: "de" }, " – " + r_.de)),
          e.geschafft ? el("p", { lang: "en" }, runnerEndeText(W))
            : el("p", {}, "Keine Leben mehr. Die Wörter hast du trotzdem gesehen – beim nächsten Mal klappt es!"),
          el("p", {}, `💎 ${e.diamanten} / ${e.max} · ❤️ ${e.leben} · ⏱ ${minuten}`),
          e.story && el("p", { class: "runner-story-ende" }, `♪ ${e.story.anzahl}/12 Geschichte`,
            sEnde ? ` · 📖 ${storyEndeLabel(W.id, e.story.ende)} – ${sEnde.symbol} ${sEnde.name}` : "", e.story.vollstaendig ? " · ✓ ganze Geschichte" : ""),
          e.story && e.geschafft && sEnde && el("p", { class: "klein runner-story-wege" }, W.id === "wembley"
            ? `🧭 Dein Weg: ${pfad} – dieses Ende kam durch deine Entscheidungen in Welt 2 bis 4 (${storyGute()} von 3 „guten“). Andere Enden: dort anders entscheiden und Wembley noch mal spielen.`
            : `🧭 Dein Weg: ${pfad} – die Geschichte merkt sich das für das nächste Kapitel.`),
          e.story && el("p", { class: "runner-story-punkte" }, e.geschafft
            ? `⭐ Punkte in diesem Lauf: ${storyPunkte}` + (storyPunkte >= STORY_PUNKTE.max ? " (höchstens 30)" : "")
            : "⭐ Punkte gibt es nur, wenn du das Level schaffst."),
          storyNeuFrei && el("p", { class: "runner-neu-offen" }, `📖 Neu in der Story Library: ${storyEndeLabel(W.id, e.story.ende)}!`),
          e.maxCombo > 0 && el("p", { class: "klein runner-serie" }, `🔥 Beste Serie: ×${e.maxCombo}`),
          e.geschafft && el("p", {}, el("strong", {}, `🏆 ${W.trophaee} – ${stufe === "gold" ? "Gold" : "Silber"}`), stufe !== "gold" ? " (Gold: alle Diamanten und beide Tore richtig)" : ""),
          neuOffen && el("p", { class: "runner-neu-offen" }, `🔓 Neue Welt frei: ${naechsteWelt.symbol} ${naechsteWelt.name}!`),
          el("p", { class: "klein" }, `🏃 Runner-Titel: ${runnerTitelName(r.titel) || "–"} · ${r.geschafft} Level geschafft`)),
        el("section", { class: "satzkarte" },
          el("h2", {}, "Die Wörter"),
          el("ul", { class: "wortliste runner-woerterliste" }, ws.map((v) => el("li", {},
            knopf("🔊", () => spiele([v.audio.en]), "leise"), " ", el("strong", { lang: "en" }, spielWort(v)), " – ", el("span", { lang: "de" }, v.de))))),
        el("div", { class: "knopfreihe" },
          (r.tickets || 0) > 0 ? knopf("↻ Noch mal (🎟️ 1)", () => runnerSpiel(i, W.id), "haupt") : knopf(`🎟️ Erst Ticket kaufen – ${RUNNER.preis} 🪙`, zumRunnerShop, "haupt"),
          knopf("Zur Startseite", startseite, "leise")));
    };
    lage = null; zeichne();
    setTimeout(zeigeEreignisse, 50);
    // Levelende-Ansage (Emmaline) vor dem Lob; bei einer Feier (neuer Titel, Held) spricht die Feier
    const endeTon = e.geschafft ? ((runnerAudio(W.id) || {}).ende || { tts: runnerEndeText(W), lang: "en-GB", stimme: "f" }) : null;
    const alexTon = e.alex ? (e.alex.audio || { tts: e.alex.text, lang: "en-GB", stimme: "m" }) : null;   // Mr. Alex' Schlusswort (7.11.) nach der Ansage
    if (!ereignisse.some(grossEreignis) && (endeTon || alexTon || (r_ && r_.audio))) spiele([endeTon, alexTon, r_ && r_.audio]);
  }
  // Spaß-Level „The Silly Run“ (7.11., Idee Mr. Alex): albernes Bonus-Level mit den Wörtern des gewählten Abschnitts (Engine Runner.spass).
  // Einmal am Tag gratis mit Punkten (1 ⭐ je richtige Blase, höchstens 10 – wie ein Spiel), danach nur mit Ticket und ohne Punkte (keine Farm-Lücke).
  const spassGratis = () => { const sl = runnerStand().spass; return !sl || sl.am !== iso(heute()); };
  function spassKnopf() {
    if (!R() || !R().spass) return null;
    const gratis = spassGratis(), tickets = runnerStand().tickets || 0;
    return el("p", { class: "runner-spass" }, knopf(`🤪 The Silly Run · ${gratis ? "heute gratis" : "🎟️ 1"}`, spassSpiel, "leise"), " ",
      el("small", {}, gratis ? "Bonus-Level, total albern – einmal am Tag bis 10 ⭐" : tickets > 0 ? "noch mal mit Ticket, ohne Punkte" : "morgen wieder gratis"));
  }
  function spassSpiel() {
    const r = runnerStand(), i = runnerWahl ? runnerWahl.i : 0, ws = runnerWoerter(i);
    if (!R() || !R().spass || ws.length < 4) return runnerStart();
    const gratis = spassGratis();
    if (!gratis && !(r.tickets > 0)) { toast("Heute schon gespielt – morgen wieder gratis oder mit Ticket."); return; }
    if (gratis) r.spass = { am: iso(heute()), n: ((r.spass && r.spass.n) || 0) + 1 };
    else { r.tickets--; r.spass.n = (r.spass.n || 0) + 1; toast("🎟️ Ticket eingelöst"); }
    speichern();
    lage = null;
    const buehne = el("div", { class: "runner-buehne" });
    const abbruch = knopf("✕", () => frage("Abbrechen?", "Abbrechen", "Weiterspielen").then((ok) => { if (ok) runnerStart(); }), "runner-x");
    abbruch.setAttribute("aria-label", "Spiel abbrechen");
    zeige(buehne, abbruch);
    document.body.classList.add("runner-aktiv");
    runnerLauf = R().spass({ wrapper: buehne, skin: skinWirksam(), klasse: 6, titel: "The Silly Run",
      woerter: ws.map((v) => ({ en: spielWort(v), de: v.de })),
      texte: { tor: (de) => `Welche Blase heißt „${de}“?`, hinweis: "Tippen = springen · 2× tippen = Doppelsprung" },
      stimme: { wort: (j) => runnerWort([ws[j % ws.length].audio.en], {}) },
      onEnde: (e) => spassEnde(e, ws, gratis) });
  }
  function spassEnde(e, ws, gratis) {
    const punkte = gratis ? Math.min(10, e.richtig || 0) : 0;
    if (punkte > 0) punkteDazu(punkte, { art: "s" }); else speichern();   // Protokoll + Siegel wie beim Runner (punkteDazu speichert)
    const v = (en) => ws.find((x) => spielWort(x) === en);
    lage = null;
    zeige(spielKopf("The Silly Run", runnerStart),
      el("section", { class: "geschafft runner-ende" },
        el("div", { class: "runner-pokal", "aria-hidden": "true" }, "🤪"),
        el("h2", { lang: "en" }, "Silly level complete!"),
        el("p", {}, `✔ ${e.richtig} / ${e.fragen} richtig · 🐔 ${e.platt} platt · ⏱ ${e.dauer} s`),
        el("p", { class: "runner-story-punkte" }, gratis ? `⭐ Punkte: ${punkte} (1 je richtige Blase, höchstens 10, einmal am Tag)` : "Mit Ticket gespielt: keine Punkte – nur Spaß.")),
      el("section", { class: "satzkarte" },
        el("h2", {}, "Die Wörter"),
        el("ul", { class: "wortliste runner-woerterliste" }, (e.woerter || []).map((w) => el("li", {},
          v(w.en) && knopf("🔊", () => spiele([v(w.en).audio.en]), "leise"), w.richtig ? " ✅ " : " ❌ ", el("strong", { lang: "en" }, w.en), " – ", el("span", { lang: "de" }, w.de))))),
      el("div", { class: "knopfreihe" }, knopf("🇬🇧 Zum London Run", runnerStart, "haupt"), knopf("Zur Startseite", startseite, "leise")));
    setTimeout(zeigeEreignisse, 50);
  }
  // Hall of Fame: Abschnitt in der Sammlung (eine Trophäe je Welt; seit Welt 5 Wembley (1.11.) gibt es keine „bald“-Welt mehr)
  function runnerSammlung() {
    const r = runnerStand(), naechste = RUNNER.ab[r.titel || 0];
    return el("section", { class: "satzkarte runner-sammlung" },
      el("h2", {}, "🇬🇧 London Run – Hall of Fame"),
      el("p", {}, "Runner-Titel: ", el("strong", { lang: "en" }, runnerTitelName(r.titel) || "noch keiner"), ` · ${r.geschafft} Level geschafft · ${r.gespielt} Spiele`),
      naechste && el("p", { class: "klein" }, `Noch ${naechste - r.geschafft} ${naechste - r.geschafft === 1 ? "geschafftes Level" : "geschaffte Level"} bis „${RUNNER.titel[r.titel || 0]}“`),
      el("ul", { class: "abzeichen runner-trophaeen" }, RUNNER.welten.concat(runnerWeltOffen(RUNNER_DISCO) ? [RUNNER_DISCO] : []).map((w) => {
        const st = r.level[w.id];
        return el("li", { class: st ? "ok" : "", "data-welt": w.id },
          el("span", { "aria-hidden": "true" }, st === "gold" ? "🥇" : st === "silber" ? "🥈" : w.bald ? "🔒" : "🏆"),
          el("span", { lang: "en" }, w.trophaee, el("small", {}, w.bald ? " · bald" : ` · ${w.staat}`)),
          el("span", { class: "unsichtbar" }, st ? "geschafft" : "noch nicht"));
      })),
      storyLibrary(),
      el("div", { class: "knopfreihe" }, knopf("🇬🇧 London Run", () => runnerStart(), "leise")));
  }
  // 📖 Story Library: freigespielte Enden als Karten (Tap = Film mit der eigenen Figur), nicht freigespielte 🔒
  // Übersicht nach Kapiteln (STORY_KAPITEL): Level 1 Westminster, Level 2 London Eye, Level 3 Tower Bridge, Level 4 The Tube, Level 5 Wembley (drei Enden; andere Enden nur über andere Entscheidungen in Welt 2–4);
  // Pfad-Zeile = Kette der gespeicherten Entscheidungen über fünf Welten („🦊 The fox → 🔘 machine room → … → 🏆 The Sergeant scores“); nicht freigespielte Enden 🔒
  function storyLibrary() {
    const pfad = storyPfad(STORY_KAPITEL[STORY_KAPITEL.length - 1]);
    const kapitel = STORY_KAPITEL.map((welt, i) => {
      const st = storyStand(welt), S = STORY[welt], E = storyEnden(welt), offen = runnerWeltOffen(runnerWeltVon(welt));
      return el("div", { class: "story-kapitel", "data-welt": welt },
        el("p", { class: "klein", lang: "en" }, `Level ${i + 1} · ${S.titel}`, !offen ? el("span", { lang: "de" }, ` · 🔒 Silber in ${runnerWeltVon(STORY_KAPITEL[i - 1]).name} nötig`) : ""),
        el("div", { class: "story-karten" }, Object.keys(E).map((en) => {
          const frei = st.enden.includes(en);
          if (!frei) return el("div", { class: "story-karte gesperrt", "data-ende": en, "data-welt": welt }, el("span", { class: "story-sym", "aria-hidden": "true" }, "🔒"), el("strong", { lang: "en" }, "Ending ? – find another way!"),
            welt === "wembley" ? el("small", { lang: "de" }, "Andere Entscheidungen in Welt 2–4") : "");
          return el("button", { class: "story-karte", type: "button", "data-ende": en, "data-welt": welt, onclick: () => storyFilm(welt, en) },
            el("span", { class: "story-sym", "aria-hidden": "true" }, E[en].symbol),
            el("strong", { lang: "en" }, `${storyEndeLabel(welt, en)} – ${E[en].name}`),
            el("small", {}, `♪ ${st.beste[en] || 0}/12${st.voll.includes(en) ? " · ✓ ganze Geschichte" : ""} · ▶ Film`));
        })));
    });
    return el("div", { class: "story-library" },
      el("h3", {}, "📖 Story Library"),
      pfad && el("p", { class: "klein story-pfad" }, `🧭 Dein Weg: ${pfad} – spiel ein Level noch mal, um einen anderen Weg zu gehen.`),
      kapitel);
  }
  function storyFilm(welt, ende) {
    if (!R() || !R().film) { toast("Das Spiel ist noch nicht geladen."); return; }
    lage = null;
    const buehne = el("div", { class: "runner-buehne" });
    const zu = knopf("✕", () => sammlung(), "runner-x");
    zu.setAttribute("aria-label", "Film schließen");
    zeige(buehne, zu);
    document.body.classList.add("runner-aktiv");
    runnerLauf = R().film({ wrapper: buehne, welt, skin: skinWirksam(), ende, story: storyOption(welt), titel: "Story Library",
      stimme: { erzaehler: erzaehlerStimme, still: () => stopp() }, onEnde: () => sammlung() });
  }
  // Figur-Seite (wie Klasse 9): Figur + Erklärtext oben (sticky), Reiter-Zeile, darunter die Optionen der Gruppe als Chips, unten feste Knopfzeile.
  // Auswahl und Reiterwechsel zeichnen NICHT die Seite neu (kein Scrollsprung): nur Vorschau + Chips bzw. der Options-Bereich werden aktualisiert.
  const SKIN_SYMBOL = { haar: "💇", haarfarbe: "🎨", haarschmuck: "🎀", hut: { keiner: "🚫", cap: "🧢", cowboy: "🤠", zylinder: "🎩" }, brille: "🕶️", bart: "🥸", nase: "👃",
    top: { shirt: "👕", hoodie: "🧥" }, topfarbe: "🎨", schuhe: { rollschuhe: "🛼" }, schmuck: { keiner: "🚫", ohrring: "💎", kette: "📿", beides: "💍" }, hals: "🦒", bauch: "🫃", brust: "🧍", muskeln: "💪", fuesse: "🦶", power: "⚡", aura: "✨",
    rucksack: { keiner: "🚫", blau: "🎒", rot: "🎒", regenbogen: "🌈" }, handschuhe: { keine: "🚫", "weiß": "🧤", schwarz: "🧤", boxhandschuhe: "🥊" } };
  const SKIN_FARBOPTION = { haarfarbe: 1, topfarbe: 1, schuhe: 1 };
  const skinFarbe = (M, key, w) => { const f = key === "haarfarbe" ? M.HAARFARBEN[w] : M.FARBEN[w]; return f === "regenbogen" ? "linear-gradient(180deg,#ff2d2d,#ff9f1a,#ffe21a,#2ecc71,#2a8cff,#9b4dff)" : f; };
  function runnerSkins() {
    lage = null;
    const sp = spielstand(), M = R();
    runnerStand();
    if (!M) { zeige(spielKopf("Figur", runnerStart), el("p", {}, "Das Spiel ist noch nicht geladen.")); return; }
    let gruppe = M.SKIN_GRUPPEN.find((g) => g.id === skinTab) || M.SKIN_GRUPPEN[0];
    const breit = Math.max(96, Math.min(150, Math.floor((app.clientWidth - 40) * 0.4))), vorschau = figurVorschau(breit, Math.round(breit * 1.27));
    const bereich = el("div", { class: "runner-skin-optionen" });
    const zumShop = (artikel) => shop({ zurueck: () => runnerSkins(), artikel });
    const symbol = (o, w) => { const sy = SKIN_SYMBOL[o.key]; return typeof sy === "object" ? sy[w] || "" : sy || ""; };
    const markiere = () => {
      const w = skinWirksam();
      for (const b of bereich.querySelectorAll(".runner-wert")) {
        const aktiv = w[b.dataset.key] === b.dataset.wert;
        b.classList.toggle("aktiv", aktiv); b.classList.toggle("haupt", aktiv); b.setAttribute("aria-pressed", String(aktiv));
        b.querySelector(".haken").textContent = aktiv ? "✓ " : "";
      }
    };
    const waehle = (o, w) => { skinSetzen(o.key, w); markiere(); vorschau.neuMalen(); spiele([{ tts: M.sprechText(skinWirksam(), o.key, w), lang: "en-GB", stimme: "m" }]); };
    const chip = (o, w) => {
      const frei = skinFrei(o.key, w), farbe = SKIN_FARBOPTION[o.key] && skinFarbe(M, o.key, w), preis = M.skinPreis(o.key, w);
      return el("button", { class: "knopf runner-wert" + (frei ? "" : " gesperrt"), "aria-pressed": "false", "data-skin": `${o.key}_${w}`, "data-key": o.key, "data-wert": w,
        onclick: () => (frei ? waehle(o, w) : zumShop(M.skinArtikel(o.key, w))) },
        el("span", { class: "haken", "aria-hidden": "true" }),
        !frei && el("span", { "aria-hidden": "true" }, "🔒 "),
        farbe ? el("span", { class: "farbpunkt", style: `background:${farbe}`, "aria-hidden": "true" }) : el("span", { class: "sym", "aria-hidden": "true" }, symbol(o, w)),
        de2(o.namen[w]), !frei && el("span", { class: "preis" }, ` · ${preis} 🪙`));
    };
    const zeichneGruppe = () => {
      bereich.replaceChildren(...gruppe.optionen.map((o) => el("div", { class: "runner-option", "data-option": o.key },
        el("h3", {}, de2(o.label)),
        el("div", { class: "runner-werte" }, o.werte.map((w) => chip(o, w))),
        o.key === "power" && el("p", { class: "klein" }, `Mit deinem Punkte-Titel (Stufe ${sp.titel} von 5) werden die Muskeln von selbst stärker, ab Stufe 4 mit kleiner Aura. Die Muskeln kannst du trotzdem von Hand umstellen.`))));
      markiere();
    };
    const tabs = el("div", { class: "reiter runner-tabs", role: "tablist" }, M.SKIN_GRUPPEN.map((g) =>
      el("button", { class: "reiter-knopf", role: "tab", "aria-selected": String(g.id === gruppe.id), "data-gruppe": g.id, onclick: (e) => {
        skinTab = g.id; gruppe = g;
        for (const t of tabs.children) t.setAttribute("aria-selected", String(t === e.currentTarget));
        e.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" });
        zeichneGruppe();
      } }, `${g.symbol} ${de2(g.titel)}`)));
    zeichneGruppe();
    const kopf = el("div", { class: "runner-skin-kopf" }, vorschau,
      el("div", { class: "runner-skin-text" },
        el("p", {}, "Die Grundausstattung ist frei."),
        el("p", {}, `Weitere Teile (🔒) gibt es im Shop für ${RUNNER.skinPreis} 🪙, Ausgefallenes für ${RUNNER.skinPreisTeuer} 🪙.`),
        el("p", {}, `⚡ Power-Körper: Muskeln wachsen mit deinem Punkte-Titel (Stufe ${sp.titel} von 5).`)));
    zeige(spielKopf("Figur", runnerStart),
      el("section", { class: "satzkarte runner-skins" }, kopf, tabs, bereich,
        el("div", { class: "knopfreihe runner-skin-fuss" }, knopf("✓ Fertig – zum Spiel", runnerStart, "haupt"), knopf("🛍️ Shop", () => zumShop()))));
  }

  /* ---------- Mini-Reward beim Vokabellernen (Word Gym, Vokabel-Abfrage, Bild, Lücke): ab 3 richtigen in Folge ----------
     Nur Show, keine Punkte. Im Wechsel: Flamme wächst · Münzen fliegen ins 🪙 · ein Bus flitzt vorbei. Bei prefers-reduced-motion nur Text. */
  const COMBO_AB = 3, COMBO_FAHRZEUG = "🚌", COMBO_TEILE = ["vok_abfrage", "vok_bild", "vok_luecke"];
  const comboErlaubt = () => !!lage && (!!lage.gym || (lage.teile && lage.teile[lage.teil] && COMBO_TEILE.includes(lage.teile[lage.teil].art)));
  const comboFlamme = () => (comboErlaubt() && richtigSerie >= COMBO_AB
    ? el("span", { class: "combo-flamme", style: `--n:${Math.min(richtigSerie - COMBO_AB, 8)}`, role: "status", "aria-label": `${richtigSerie} richtig in Folge` },
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
  function aktenZeigen(a, gold) {
    const gesehen = new Set(), lobBox = el("p", { class: "gym-lob", "aria-live": "polite" });
    feier.classList.add("akte"); feier.classList.toggle("gold-akte", !!gold);
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
      el("div", { class: "knopfreihe" }, knopf("Schließen", () => { feier.close(); feier.classList.remove("akte", "gold-akte"); }, "haupt")));
    feier.addEventListener("close", () => feier.classList.remove("akte", "gold-akte"), { once: true });
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
      el("p", { class: "klein" }, "Eine Akte öffnet sich, wenn du den Superhelden hast und seinen Ort in London freigeschaltet hast."), el("div", { class: "akten" }, kacheln), goldTeil());
  }
  /* Goldene Akten (Regel B, 7.11.2026, docs/secret-level/konzept-entwurf.md): SP.gold aus inhalte/goldakten.tsv.
     art „serie“ = so viele Schultage am Stück (serie()), art „wochen“ = so viele perfekte Wochen insgesamt (sp.wochen).
     Einmal erreicht, bleibt die Akte offen (sp.gold = [ids], im Siegel) – auch wenn die Serie später reißt. */
  const goldText = (a) => a.art === "serie" ? `${a.ziel} Schultage am Stück` : `${a.ziel} perfekte Wochen`;
  function goldPruefen(feiern) {
    const sp = spielstand(), n = serie();
    if (!Array.isArray(sp.gold)) sp.gold = [];
    const neu = (SP.gold || []).filter((a) => !sp.gold.includes(a.id) && (a.art === "serie" ? n : sp.wochen.length) >= a.ziel);
    for (const a of neu) {
      sp.gold.push(a.id);
      if (feiern) ereignisse.push({ art: "feier", symbol: "🌟", titel: "Gold File unlocked!", text: `${goldText(a)} – eine goldene Akte ist offen: „${a.titel.replace(/^.*? – /, "")}“. Du findest sie in deiner Sammlung.` });
    }
    return neu.length > 0;
  }
  function goldTeil() {
    if (!(SP.gold || []).length) return null;
    if (goldPruefen(false)) speichern();
    const sp = spielstand();
    return el("div", { class: "gold-akten" }, el("h3", {}, `🌟 Goldene Akten (${SP.gold.filter((a) => sp.gold.includes(a.id)).length} von ${SP.gold.length})`),
      el("p", { class: "klein" }, "Besondere Geschichten für alle, die dranbleiben: nach einer Serie von Schultagen oder nach perfekten Wochen."),
      el("div", { class: "akten" }, SP.gold.map((a) => sp.gold.includes(a.id)
        ? el("button", { class: "akte-kachel offen gold", onclick: () => aktenZeigen(a, true) }, el("span", { "aria-hidden": "true" }, "🌟"), el("strong", { lang: "en" }, a.titel))
        : el("div", { class: "akte-kachel zu gold" }, el("span", { "aria-hidden": "true" }, "🔒"), el("strong", { lang: "en" }, a.titel.replace(/ – .*/, "")),
            el("small", {}, `Du brauchst: ${goldText(a)}`)))));
  }

 // Aufstieg einer Folien-Karte: Karte dreht sich, Rahmen leuchtet auf (Gold-Moment: Blitz), der Held spricht seine Vorstellung (vorhandene Aufnahme)
  function karteEnthuellen(e) {
    const h = e.held, st = e.stufe, ton = h.intro_audio || h.audio;
    feier.classList.remove("tier-feier");
    feier.replaceChildren(konfetti(), ...(e.moment ? [el("div", { class: "karte-blitz", "aria-hidden": "true" })] : []),
      el("p", { class: "feier-klein" }, e.moment ? "⚡ Golden moment!" : `${KARTE.symbol[st]} Neue Stufe!`),
      el("h2", { id: "feier-titel", lang: "en" }, `${h.name}: ${KARTE.namen[st]}`),
      el("div", { class: "karte-dreh" }, heldenKarte(h, true, false, st)),
      el("p", { class: "klein" }, st < 3 ? (st === karteVon(h.id).s ? "Nächstes Ziel: " + karteZiel(h) : "") : "Höchste Stufe – deine Karte glänzt in Gold!"),
      el("div", { class: "knopfreihe" }, ton && knopf("🔊 Anhören", () => spiele([ton])),
        knopf("Weiter ➜", () => { feier.close(); stopp(); setTimeout(zeigeEreignisse, 300); }, "haupt")));
    feier.showModal();
    if (ton) spiele([ton], { warten: true });
  }
  function heldZeigen(h, mitTon = true) {
    feier.replaceChildren(heldenKarte(h, true, true), el("p", { class: "steckbrief", lang: "en" }, h.steckbrief),
      el("div", { class: "knopfreihe" }, h.audio && knopf("🔊 Anhören", () => spiele([h.audio])),
        heldHatFilm(h) && knopf("▶ Film", () => { feier.close(); stopp(); heldFilm(h, () => heldZeigen(h, false)); }, "leise"),
        knopf("Schließen", () => { feier.close(); stopp(); }, "haupt")));
    feier.showModal();
    if (h.audio && mitTon) spiele([h.audio]);
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
        gymMemoryOffen() && knopf("🎲 Memory", gymMemory, "haupt"),
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
      k.s = 0; k.f = gymFaellig(0); k.x = (k.x || 0) + 1; fehlerSerie++; // x: Fehler gesamt (Sync Stufe A: schwere Wörter) comboBruch();
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
        alles && gymMemoryOffen() && el("p", { class: "ansage" }, "🎲 Jetzt noch die Memory-Runde von heute: Finde die Paare mit deinen Gym-Wörtern!"),
        el("div", { class: "knopfreihe" }, alles && gymMemoryOffen() ? knopf("🎲 Memory-Runde", gymMemory, "haupt") : knopf("Zur Startseite", startseite, "haupt"),
          alles && gymMemoryOffen() && knopf("Zur Startseite", startseite), knopf("🏆 Hall of Fame", sammlung))));
      if (icon.heben) setTimeout(icon.heben, 400);
    };
    gym = null; lage = null;
    zeichne();
    // erst belohnen (reiht Pop-ups ein), dann sprechen: das Pop-up wartet auf die Schlussstimme, statt sie abzuschneiden
    if (erstesMal) belohne(true, true, true);
    spiele([!ereignisse.some(grossEreignis) && r && r.audio, fini && fini.audio]);
  }

  /* Memory im Word Gym (7.11.2026): einmal pro Tag nach dem Pensum, 6 Paare aus den Wörtern von heute (fällig + neu),
     aufgefüllt mit den nächsten fälligen Gym-Karten. Punkte (PUNKTE.spiel) einmal pro Tag über die eigene Marke gym.memGymTag –
     unabhängig von gym.memoryTag (Memory in Station 5). Abbrechen und neu starten geht, Punkte gibt es nur für die erste fertige Runde. */
  function gymMemoryWoerter() {
    const plan = gymPlan(), g = gymStand(), heute_ = [...plan.wdh, ...plan.neu];
    const rest = Object.entries(g.karten).filter(([id]) => !heute_.includes(id)).sort((a, b) => (a[1].f < b[1].f ? -1 : a[1].f > b[1].f ? 1 : 0)).map(([id]) => id);
    const ok = (ids) => ids.map(vokabel).filter(memOk);
    const ws = mischen(ok(heute_)).slice(0, 6);
    for (const v of ok(rest)) { if (ws.length >= 6) break; if (!ws.some((w) => memKurz(w.de) === memKurz(v.de))) ws.push(v); }
    return mischen(ws.filter((v, i) => ws.findIndex((w) => memKurz(w.de) === memKurz(v.de)) === i));
  }
  const gymMemoryOffen = () => { const plan = gymPlan(); return (plan.geschafft || !(plan.wdh.length + plan.neu.length)) && gymStand().memGymTag !== spielTag() && gymMemoryWoerter().length >= 3; };
  function gymMemory() {
    const ws = gymMemoryWoerter();
    if (ws.length < 3 || gymStand().memGymTag === spielTag()) return startseite();
    const m = memoryFeld(ws, () => {
      const g = gymStand();
      if (g.memGymTag === spielTag()) return "";
      g.memGymTag = spielTag(); punkteDazu(PUNKTE.spiel, { art: "g", bonus: true }); // zeigt den Punkte-Toast selbst
      return ` +${PUNKTE.spiel} ⭐ – Memory für heute geschafft!`;
    });
    lage = null;
    zeige(gymKopf(), ansage("Find the pairs!", "Memory mit deinen Gym-Wörtern: Finde die Paare – englisches Wort und deutsche Bedeutung."),
      karte(null, null, m.feld, m.zaehler, m.box, el("div", { class: "knopfreihe" }, knopf("Zur Startseite", startseite, "leise"))));
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

  /* ---------- 🎯 Test yourself (2.11.2026, Mr. Alex; docs/ideenspeicher.md „Prüfungsformate“ (2) und (3)) ----------
     Je Station (ohne Spiele), sobald mindestens die Hälfte ihrer Teile erledigt ist: 10 Aufgaben aus dem Stoff der Station, gemischt und möglichst
     jede Art: Vokabel (Deutsch gezeigt, Englisch eintippen – Groß/Klein und Satzzeichen egal, ab 6 Buchstaben 1 Tippfehler erlaubt), Lücke im Satz
     (Auswahl aus 3), Lesen (Aussage zum Text: true / false / not in the text), Hören (erst einmal ganz zuhören, dann wählen).
     Keine 💡-Hilfen, jede Aufgabe nur einmal beantwortbar, kein Zurück, Gesamtzeit 8 Minuten (danach zählt alles Offene als falsch).
     Mindestzeit je Aufgabe über arbeitsSperre (monotone Uhr): Quizzeit, beim Lesen die Lesezeit wie in zeigeLesen, beim Hören erst nach einmal Abspielen.
     Ergebnis: Prozent, falsche Aufgaben mit Lösung und dem Teil zum Üben. Ab 80 %: einmalig je Station +30 Punkte über punkteDazu (Art „p“ = Prüfung,
     zählt nicht zum Wächter) und Zertifikat (Abzeichen „🎯 Station n bestanden“). Gespeichert in stand.spiel.tests[Station] = { best, am, bestanden }
     – in spiel und damit im Siegel v4 (keine neue Siegel-Version; Altstände ohne tests laden unverändert). Jeder fertige Test schreibt einen
     Protokoll-Eintrag „p“ (30 beim ersten Bestehen, sonst 0). Aufgabenquelle: dieselben Teile wie die Stichprobe (stichprobeTeil). */
  const TEST = { anzahl: 10, sek: 8 * 60, punkte: 30, grenze: 80 };
  let testLauf = null; // { st, key, aufgaben, i, start, limit, antworten, gehoert, gelesen, takt }
  let testTempo = 1; // Faktor für die Mindestzeiten – nur der Test-Build ändert ihn (window.__testYourself)
  const testKey = (st) => (st.gln ? glnTestKey(st.gln) : String(st.nr)); // st.gln: Abschlusstest der Road to GLN (Pseudo-Station über alle GLN-Teile)
  const testName = (key) => (String(key).startsWith("gln:") ? "GLN Ready" : `Station ${key}`);
  const testTitel = (st) => (st.gln ? "🏁 Road to GLN · Abschlusstest" : `🎯 Test yourself · Station ${st.nr}`);
  const testZurueck = (st) => (st.gln ? startseite() : starteStation(st.nr));
  const testErgebnis = (key) => (stand.spiel && stand.spiel.tests && stand.spiel.tests[key]) || null;
  const testDatum = (t) => { const d = new Date(t + "T12:00:00"); return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`; };
  // Alle Teil-Schlüssel einer Station (wie teilSchluessel: „Station|Gruppe|Index“)
  function testTeilSchluessel(st) {
    if (!st || st.spiele) return [];
    if (st.gln) return [...new Set(st.gln.ziele.flatMap((z) => z.schluessel))];
    if (st.gruppen) return st.gruppen.flatMap((g, gi) => (g.schritte ? teileVon(g)
      : gruppenTeile(st, g.vokabeln.map((id) => D.vokabeln.find((v) => v.id === id)).filter(Boolean))).map((_, i) => `${st.nr}|${gi}|${i}`));
    return teileVon(st).map((_, i) => `${st.nr}||${i}`);
  }
  function testFortschritt(st) {
    const alle = testTeilSchluessel(st);
    return { gesamt: alle.length, fertig: alle.filter((k) => stand.teile && stand.teile[k]).length };
  }
  const testFrei = (f) => f.gesamt > 0 && f.fertig * 2 >= f.gesamt;
  // Einstieg auf der Stations-Seite: frei ab der Hälfte der Teile, vorher ausgegraut mit Hinweis (Sperre im Programm, nicht nur am Knopf)
  function testKnopf(st) {
    if (!st || st.spiele) return null;
    const f = testFortschritt(st);
    if (!f.gesamt) return null;
    const frei = testFrei(f), erg = testErgebnis(testKey(st));
    const k = knopf("🎯 Test yourself", () => testStart(st), "test-knopf");
    if (!frei) sperrt(k);
    return el("div", { class: "test-einstieg" + (frei ? "" : " zu") }, k,
      el("span", { class: "klein test-info" }, !frei ? `Erst die Hälfte der Teile schaffen (${f.fertig} von ${f.gesamt}).`
        : erg && erg.bestanden ? `✓ Bestanden · bestes Ergebnis ${erg.best} %`
        : erg ? `Bestes Ergebnis ${erg.best} % – ab ${TEST.grenze} % bestanden`
        : `10 Aufgaben ohne Hilfe · 8 Minuten · ab ${TEST.grenze} % +${TEST.punkte} Punkte`));
  }

  // Wortvorrat für falsche Antworten in Lücken: alle Lückenwörter und Vokabeln der App
  let testWortVorrat = null;
  const testWoerter = () => testWortVorrat || (testWortVorrat = [...new Set([...Object.values(D.saetze).map((s) => s && s.luecke).filter(Boolean),
    ...D.vokabeln.map((v) => spielWort(v))].filter((w) => w && w.length <= 24))]);
  const wortZahl = (t) => String(t).trim().split(/\s+/).length;
  function testAblenker(richtig, eigene, station_) {
    const raus = new Set([normT(richtig)]), aus = [];
    const gross = /^[A-Z]/.test(richtig);
    const nimm = (liste) => { for (const w of mischen(liste)) { if (aus.length >= 2) return; if (!w || raus.has(normT(w))) continue; raus.add(normT(w)); aus.push(gross && /^[a-z]/.test(w) ? w[0].toUpperCase() + w.slice(1) : w); } };
    nimm(eigene || []);
    nimm((station_ || []).filter((w) => wortZahl(w) === wortZahl(richtig)));
    nimm(testWoerter().filter((w) => wortZahl(w) === wortZahl(richtig)));
    nimm(testWoerter());
    return aus;
  }
  // Englische Lösungen einer Vokabel, die beim Eintippen zählen: „(to) get up“ → get up / to get up, „tooth, pl teeth“ → tooth …
  function testVarianten(v) {
    const s = new Set(), dazu = (x) => { x = String(x || "").replace(/\s+/g, " ").trim(); if (x) s.add(x); };
    const en = v.en.replace(/\(=[^)]*\)/g, "");
    dazu(en); dazu(en.replace(/\(.*?\)/g, "")); dazu(en.replace(/[()]/g, "")); dazu(spielWort(v));
    for (const t of en.split(/\s*[/;,]\s*/)) { dazu(t); dazu(t.replace(/\(.*?\)/g, "")); dazu(t.replace(/[()]/g, "")); }
    return [...s].filter((x) => !/^pl\b/.test(x));
  }
  const testTippOk = (v) => v && v.tippbar !== false && v.de && v.en && v.en.length <= 30 && !/[…]/.test(v.en);
  // Eingabe gegen die Varianten: genau (ohne Groß/Klein und Satzzeichen) oder bei Wörtern ab 6 Buchstaben mit 1 Tippfehler
  function testTippRichtig(eingabe, ziele) {
    const e = normT(eingabe);
    if (!e) return false;
    return ziele.some((z) => { const zz = normT(z); return e === zz || (zz.replace(/\s/g, "").length >= 6 && abstand(e, zz) <= 1); });
  }

  // Kandidaten aus allen Teilen der Station; je Art ein Topf, ein Satz/Wort höchstens einmal im Test (key)
  function testZiehen(st) {
    const toepfe = { vokabel: [], luecke: [], lesen: [], hoeren: [] }, worte = [];
    const satzVok = {};
    for (const v of D.vokabeln) for (const id of [v.satz, v.gymsatz]) if (id) (satzVok[id] = satzVok[id] || []).push(v);
    const dazu = (typ, c) => toepfe[typ].push(c);
    const vokabelDazu = (v, q) => { if (testTippOk(v)) dazu("vokabel", { typ: "vokabel", key: "v:" + v.id, v, q }); };
    const satzDazu = (id, q, s_, extra) => {
      const s = s_ || D.saetze[id];
      if (!s || !s.en) return;
      const w = (extra && extra.richtig) || (s.luecke && s.en.includes(s.luecke) ? s.luecke : null);
      if (w && s.en.includes(w)) {
        worte.push(w);
        if (s.de) dazu("luecke", { typ: "luecke", key: "s:" + id, s, w, falsch: extra && extra.falsch, q });
        if (s.audio && s.audio.en) dazu("hoeren", { typ: "hoeren", form: "luecke", key: "s:" + id, s, w, falsch: extra && extra.falsch, q });
      }
      for (const v of satzVok[id] || []) vokabelDazu(v, q);
    };
    for (const schluessel of testTeilSchluessel(st)) {
      const q = stichprobeTeil(schluessel);
      if (!q) continue;
      q.schluessel = schluessel;
      const { teil, vok } = q;
      if (teil.art === "lr") teil.saetze.forEach((id) => { const x = Array.isArray(id) ? id[id.length - 1] : id; satzDazu(x, q); });
      else if (teil.art === "verbform") teil.aufgaben.forEach((a) => satzDazu(a.satz, q, null, { richtig: a.richtig, falsch: a.falsch }));
      else if (teil.art === "auswahl") teil.aufgaben.forEach((a) => { if (a.frage && a.richtig && a.optionen) dazu("luecke", { typ: "luecke", form: "wahl", key: "s:" + a.satz, a, q, ansage: teil.ansage }); });
      else if (teil.art === "reihenfolge") teil.woerter.forEach((id) => satzDazu(id, q));
      else if (teil.art === "lesen") teil.aufgaben.forEach((a) => { if (D.saetze[a.satz] && D.saetze[teil.text]) dazu("lesen", { typ: "lesen", key: "s:" + a.satz, a, teil, q }); });
      else if (teil.art === "textfolge") teil.texte.forEach((x, ti) => x.ereignisse.slice(0, -1).forEach((e, i) => dazu("lesen", { typ: "lesen", form: "folge", key: `f:${ti}:${i}`, x, i, q })));
      else if (teil.art === "woche") teil.wochen.forEach((x, wi) => x.saetze.forEach((s, i) => { if (s.verb !== "is") dazu("luecke", { typ: "luecke", form: "wahl", key: `k:${wi}:${i}`, q, ansage: "Writing: Welche Form passt? (he / she / it)",
        a: { frage: `${s.anfang} ${s.teile.join(" ")}.`.replace(` ${s.verb} `, " ___ "), richtig: s.verb, optionen: [s.verb, s.falsch, s.falsch.replace(/e$/, "") + "ing"], korrektur: true } }); }));
      else if (teil.art === "hoeren" && teil.uebung) {
        const u = teil.uebung;
        if (u.art === "true-false") u.aufgaben.forEach((a, i) => dazu("hoeren", { typ: "hoeren", form: "tf", key: `h:${u.titel}:${i}`, a, u, q }));
        else u.aufgaben.forEach((a, i) => { const t = u.teile.find((x) => x.sprecher === a.name); if (t && t.audio && D.mittel[a.mittel]) dazu("hoeren", { typ: "hoeren", form: "weg", key: `h:${u.titel}:${i}`, a, t, q }); });
      } else if (teil.art === "hoerwahl") teil.paare.forEach((p) => p.optionen.forEach((o) => { if (o.audio) dazu("hoeren", { typ: "hoeren", form: "wahl", key: "w:" + o.wort, o, p, teil, q }); }));
      else if (teil.art.startsWith("vok_") && vok) {
        for (const v of vok) {
          vokabelDazu(v, q);
          const s = gymSatzFuer(v);
          if (s && v.gymsatz) satzDazu(v.gymsatz, q, s);
        }
      }
    }
    // Ziehen: Arten im Wechsel (gemischte Reihenfolge), bis 10 Aufgaben da sind oder nichts mehr übrig ist
    const arten = mischen(Object.keys(toepfe)).filter((a) => toepfe[a].length);
    arten.forEach((a) => { toepfe[a] = mischen(toepfe[a]); });
    const benutzt = new Set(), gewaehlt = [];
    while (gewaehlt.length < TEST.anzahl && arten.some((a) => toepfe[a].length)) {
      for (const a of arten) {
        if (gewaehlt.length >= TEST.anzahl) break;
        while (toepfe[a].length) { const c = toepfe[a].pop(); if (benutzt.has(c.key)) continue; benutzt.add(c.key); gewaehlt.push(c); break; }
      }
    }
    return mischen(gewaehlt).map((c) => testAufgabe(c, worte)).filter(Boolean);
  }
  // Eine Aufgabe: { typ, form, anweisung, frage, satz (Lücke), text, optionen [{ wert, inhalt }], richtig, ziele, loesung, audio, hoerKey, textKey, ort, schluessel }
  function testAufgabe(c, worte) {
    const ort = c.q.ort + (c.q.teil && c.q.teil.name ? " · " + c.q.teil.name : ""), schluessel = c.q.schluessel;
    const wahl = (richtig, falsche) => mischen([richtig, ...falsche]).map((w) => ({ wert: w, inhalt: w }));
    if (c.typ === "vokabel") return { typ: "vokabel", anweisung: "Wie heißt das auf Englisch? Tipp es ein!", frage: (c.v.symbol ? c.v.symbol + " " : "") + c.v.de,
      ziele: testVarianten(c.v), loesung: c.v.en, ort, schluessel };
    if (c.typ === "luecke" && c.form === "wahl") {
      const a = c.a, falsche = mischen(a.optionen.filter((o) => o !== a.richtig)).slice(0, 2);
      return { typ: "luecke", form: "wahl", lang: a.korrektur ? "en" : "de", anweisung: c.ansage || "Tipp auf die richtige Antwort!", frage: a.frage, optionen: wahl(a.richtig, falsche), richtig: a.richtig, loesung: a.richtig, ort, schluessel };
    }
    if (c.typ === "luecke" || (c.typ === "hoeren" && c.form === "luecke")) {
      const falsche = testAblenker(c.w, c.falsch, worte);
      const i = c.s.en.indexOf(c.w), satz = [c.s.en.slice(0, i), c.s.en.slice(i + c.w.length)];
      const basis = { satz, wort: c.w, optionen: wahl(c.w, falsche), richtig: c.w, loesung: c.s.en, ort, schluessel };
      if (c.typ === "luecke") return Object.assign(basis, { typ: "luecke", anweisung: "Welches Wort passt in die Lücke?", frage: c.s.de });
      return Object.assign(basis, { typ: "hoeren", form: "luecke", anweisung: "Hör zu! Welches Wort hörst du in der Lücke?", audio: [c.s.audio.en], hoerKey: c.s.audio.en });
    }
    if (c.typ === "lesen" && c.form === "folge") { // Reading „Reihenfolge“: Was passiert direkt danach?
      const ev = c.x.ereignisse, richtig = ev[c.i + 1].satz, falsche = mischen(ev.filter((_, j) => j !== c.i && j !== c.i + 1)).slice(0, 2).map((e) => e.satz);
      return { typ: "lesen", form: "folge", anweisung: "Read the text. What happens next?", titel: c.x.titel, text: c.x.text, textKey: "f:" + c.x.titel,
        frage: `${ev[c.i].satz} – What happens next?`, optionen: wahl(richtig, falsche), richtig, loesung: richtig, ort, schluessel };
    }
    if (c.typ === "lesen") {
      const text = D.saetze[c.teil.text];
      return { typ: "lesen", anweisung: c.teil.instruction || "Read the text. True, false or not in the text?", titel: c.teil.titel, text: text.en, textKey: c.teil.text,
        frage: D.saetze[c.a.satz].en, optionen: c.teil.optionen.map((o) => ({ wert: o, inhalt: o })), richtig: c.a.loesung, loesung: c.a.loesung, ort, schluessel };
    }
    if (c.form === "tf") return { typ: "hoeren", form: "tf", anweisung: "Hör zu! True or false?", titel: c.u.titel, frage: c.a.aussage,
      optionen: [{ wert: "true", inhalt: "true" }, { wert: "false", inhalt: "false" }], richtig: c.a.loesung, loesung: c.a.loesung,
      audio: c.u.teile.map((t) => t.audio).filter(Boolean), hoerKey: "u:" + c.u.titel, ort, schluessel };
    if (c.form === "weg") {
      const falsche = mischen(Object.keys(D.mittel).filter((k) => k !== c.a.mittel)).slice(0, 2);
      const name = (k) => `${D.mittel[k]} ${MITTEL_NAME[k] || k}`;
      return { typ: "hoeren", form: "weg", anweisung: `Hör zu! Wie kommt ${c.a.name} zur Schule?`, frage: `Wie kommt ${c.a.name} zur Schule?`,
        optionen: mischen([c.a.mittel, ...falsche]).map((k) => ({ wert: k, inhalt: name(k) })), richtig: c.a.mittel, loesung: name(c.a.mittel),
        audio: [c.t.audio], hoerKey: c.t.audio, ort, schluessel };
    }
    if (c.form === "wahl") {
      const andere = mischen(c.teil.paare.filter((p) => p !== c.p).flatMap((p) => p.optionen)).slice(0, Math.max(0, 3 - c.p.optionen.length));
      const optionen = mischen([...c.p.optionen, ...andere]).slice(0, 3);
      if (!optionen.includes(c.o)) optionen[0] = c.o;
      return { typ: "hoeren", form: "wahl", anweisung: "Hör zu! Welches Wort hörst du?", frage: "🎧",
        optionen: mischen(optionen).map((o) => ({ wert: o.wort, inhalt: `${o.symbol || ""} ${o.wort}`.trim() })), richtig: c.o.wort, loesung: `${c.o.symbol || ""} ${c.o.wort}`.trim(),
        audio: [c.o.audio], hoerKey: c.o.audio, ort, schluessel };
    }
    return null;
  }

  function testStart(st) {
    const f = testFortschritt(st);
    if (st.gln ? !glnTestFrei(st.gln) : !testFrei(f)) return; // gilt im Programm, nicht nur am ausgegrauten Knopf
    const aufgaben = testZiehen(st);
    if (!aufgaben.length) return toast("Für diese Station gibt es noch keine Testaufgaben.");
    lage = null;
    testLauf = { st, key: testKey(st), aufgaben, i: 0, start: monoton(), limit: TEST.sek, antworten: [], gehoert: new Set(), gelesen: new Set(), takt: null };
    const L = testLauf;
    L.takt = setInterval(() => {
      if (testLauf !== L) return clearInterval(L.takt);
      const bar = app.querySelector(".test-zeit");
      if (!bar) { clearInterval(L.takt); testLauf = null; return; } // Seite verlassen: Test abgebrochen, nichts gespeichert
      testUhr(L, bar);
      if (testRest(L) <= 0) testEnde(true);
    }, 250);
    testZeigen();
  }
  const testRest = (L) => Math.max(0, L.limit - (monoton() - L.start) / 1000);
  function testUhr(L, bar) {
    const r = testRest(L), s = Math.ceil(r);
    bar.querySelector("span").style.width = `${Math.max(0, Math.min(100, (100 * r) / TEST.sek))}%`;
    bar.classList.toggle("knapp", r < 60);
    const text = app.querySelector(".test-uhr");
    if (text) text.textContent = `⏱️ ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }
  function testAbbrechen() {
    const L = testLauf;
    frage("Test abbrechen? Dein Ergebnis wird nicht gespeichert.", "Abbrechen", "Weiter testen").then((ja) => {
      if (!ja || testLauf !== L) return;
      clearInterval(L.takt); testLauf = null; testZurueck(L.st);
    });
  }
  function testKopf(st, laeuft) {
    return el("header", { class: "kopf test-kopf" },
      laeuft ? knopf("✕ Abbrechen", testAbbrechen, "leise") : knopf(st.gln ? "← Start" : "← Station", () => testZurueck(st), "leise"),
      el("h1", {}, st.gln ? testTitel(st) : `${testTitel(st)}: ${st.titel}`));
  }
  function testZeigen() {
    const L = testLauf, a = L.aufgaben[L.i], n = L.aufgaben.length;
    if (!a) return testEnde(false);
    let antwort = null;
    const weiter = knopf(L.i + 1 < n ? "Weiter ➜" : "Fertig ➜", () => abgeben(), "haupt test-weiter");
    const lesen = a.typ === "lesen", hoeren = a.typ === "hoeren";
    const sek = (lesen && !L.gelesen.has(a.textKey) ? a.text.split(/\s+/).filter(Boolean).length / LESE_WPM * 60 + LESE_JE_AUSSAGE
      : lesen ? LESE_JE_AUSSAGE : QUIZ_MIN) * testTempo;
    let feld = null;
    const sperre_ = arbeitsSperre(weiter, { sek,
      zeitText: (z) => (lesen ? `📖 Lies erst den Text genau. „Weiter“ geht in ${z}.` : `🤔 Überleg in Ruhe. „Weiter“ geht in ${z}.`),
      offen: () => (hoeren && !L.gehoert.has(a.hoerKey) ? "🔊 Hör erst einmal ganz zu."
        : a.typ === "vokabel" ? (feld && feld.value.trim() ? "" : "✏️ Tipp das englische Wort ein.")
        : antwort === null ? "✏️ Wähl eine Antwort." : "") });
    function abgeben() {
      if (testLauf !== L || L.aufgaben[L.i] !== a || !sperre_.bereit()) return; // jede Aufgabe nur einmal
      sperre_.ende();
      const gegeben = a.typ === "vokabel" ? feld.value.trim() : antwort;
      const ok = a.typ === "vokabel" ? testTippRichtig(gegeben, a.ziele) : gegeben === a.richtig;
      const inhalt = a.optionen && (a.optionen.find((o) => o.wert === gegeben) || {}).inhalt;
      L.antworten.push({ richtig: ok, antwort: inhalt || gegeben });
      if (lesen) L.gelesen.add(a.textKey);
      L.i++; stopp();
      testZeigen();
    }
    let knoepfe = [];
    const wahl = a.optionen && el("div", { class: "wahl", role: "group", "aria-label": "Antwort wählen" }, knoepfe = a.optionen.map((o) =>
      el("button", { class: "knopf wahl-knopf", lang: "en", "aria-pressed": "false", "data-wert": o.wert, onclick: () => {
        if (testLauf !== L || L.aufgaben[L.i] !== a) return;
        antwort = o.wert;
        knoepfe.forEach((k) => k.setAttribute("aria-pressed", String(k.dataset.wert === o.wert)));
        sperre_.bereit();
      } }, o.inhalt)));
    if (a.typ === "vokabel") {
      feld = el("input", { type: "text", class: "eingabe", lang: "en", autocomplete: "off", autocapitalize: "off", autocorrect: "off", spellcheck: "false",
        "aria-label": "Deine Antwort", enterkeyhint: "done", oninput: () => sperre_.bereit(),
        onkeydown: (e) => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); abgeben(); } } });
    }
    let anhoeren = null;
    const abspielen = () => {
      if (!a.audio || !a.audio.length) return;
      anhoeren.disabled = true;
      spiele(a.audio).then((d) => {
        if (testLauf !== L || L.aufgaben[L.i] !== a) return;
        anhoeren.disabled = false;
        if (d !== null) { L.gehoert.add(a.hoerKey); sperre_.bereit(); }
      });
    };
    if (hoeren) anhoeren = knopf(a.form === "tf" ? "🔊 Hörtext abspielen" : "🔊 Anhören", abspielen, "haupt");
    const lueckeSatz = a.satz && el("p", { class: "satz", lang: "en" }, a.satz[0], el("span", { class: "luecke", "aria-label": "Lücke" }, a.wort.replace(/./g, "_")), a.satz[1]);
    const zeit = el("div", { class: "test-zeit", role: "progressbar", "aria-label": "Zeit" }, el("span", {}));
    zeige(testKopf(L.st, true),
      el("div", { class: "test-leiste" }, el("span", { class: "test-fortschritt" }, `${L.i + 1} / ${n}`), zeit, el("span", { class: "test-uhr klein" }, "")),
      el("section", { class: "satzkarte test-aufgabe" },
        el("p", { class: "ansage" }, a.anweisung),
        lesen && el("h2", { lang: "en" }, a.titel),
        lesen && el("div", { class: "lesetext", lang: "en" }, el("p", {}, a.text)),
        hoeren && el("div", { class: "knopfreihe" }, anhoeren),
        a.typ === "vokabel" && el("p", { class: "satz de", lang: "de" }, a.frage),
        a.typ === "luecke" && a.form !== "wahl" && el("p", { class: "satz de", lang: "de" }, a.frage),
        a.form === "wahl" && a.typ === "luecke" && el("p", { class: "satz", lang: a.lang }, a.frage),
        lueckeSatz,
        (lesen || a.form === "tf") && el("p", { class: "satz test-aussage", lang: "en" }, a.frage),
        a.form === "weg" && el("p", { class: "satz", lang: "de" }, a.frage),
        wahl, feld && el("div", { class: "eingabe-bereich" }, el("div", { class: "knopfreihe" }, feld)),
        sperre_.uhr, el("div", { class: "knopfreihe" }, weiter)));
    testUhr(L, zeit);
    if (feld) feld.focus();
    if (hoeren && !L.gehoert.has(a.hoerKey)) setTimeout(() => { if (testLauf === L && L.aufgaben[L.i] === a && !anhoeren.disabled) abspielen(); }, 300);
  }
  // Ergebnis speichern und zeigen; abgelaufen = Zeit um, alle offenen Aufgaben zählen als falsch
  function testEnde(abgelaufen) {
    const L = testLauf;
    if (!L) return;
    clearInterval(L.takt); testLauf = null; stopp();
    while (L.antworten.length < L.aufgaben.length) L.antworten.push({ richtig: false, antwort: null, offen: true });
    const n = L.aufgaben.length, r = L.antworten.filter((x) => x.richtig).length, pct = Math.round((100 * r) / n);
    const sp = spielstand();
    if (!sp.tests || typeof sp.tests !== "object") sp.tests = {};
    const alt = sp.tests[L.key] || null, bestanden = pct >= TEST.grenze, erstes = bestanden && !(alt && alt.bestanden);
    sp.tests[L.key] = { best: Math.max(pct, (alt && alt.best) || 0), am: !alt || pct >= (alt.best || 0) ? iso(heute()) : alt.am, bestanden: !!(alt && alt.bestanden) || bestanden };
    if (erstes && L.st.gln) { // 🏁 GLN ready: 100 Coins (keine Punkte), Protokoll „gr“
      sp.coins += GLN.testCoins; protokolliere("gr", 0);
      ereignisse.push({ art: "feier", symbol: "🏁", titel: "GLN ready!", text: `Abschlusstest bestanden mit ${pct} % – +${GLN.testCoins} Coins und das Abzeichen „GLN Ready“!`, ton: SP.texte.gym_fini });
      speichern(); setTimeout(zeigeEreignisse, 50);
    } else if (erstes) {
      ereignisse.push({ art: "feier", symbol: "🎯", titel: `${testName(L.key)} bestanden`, text: `Zertifikat: ${pct} % im Test yourself – +${TEST.punkte} Punkte!` });
      punkteDazu(TEST.punkte, { art: "p" }); // Prüfung: Protokoll „p“ +30, zählt nicht zum Wächter
    } else { protokolliere("p", 0); speichern(); }
    const t = sp.tests[L.key], st = L.st;
    const falsch = L.aufgaben.map((a, i) => [a, L.antworten[i]]).filter(([, x]) => !x.richtig);
    const frageText = (a) => (a.satz ? `${a.satz[0]}___${a.satz[1]}` : a.form === "wahl" && a.typ === "hoeren" ? "🎧 Welches Wort hast du gehört?" : a.frage);
    const ueben = [...new Map(falsch.map(([a]) => [a.schluessel, a])).values()];
    zeige(testKopf(st, false),
      el("section", { class: "satzkarte test-ergebnis" + (bestanden ? " bestanden" : "") },
        el("p", { class: "klein" }, testTitel(st)),
        el("p", { class: "test-prozent" }, `${pct} %`),
        el("p", {}, `${r} von ${n} richtig` + (abgelaufen ? " · ⏱️ Die Zeit ist abgelaufen – Offenes zählt als falsch." : "")),
        el("h2", {}, bestanden ? "Super, bestanden!" : "Noch nicht ganz – übe die markierten Teile und versuch's nochmal."),
        el("p", { class: "test-punkte" }, erstes && st.gln ? `+${GLN.testCoins} Coins und dein Abzeichen 🏁 GLN Ready!`
          : erstes ? `+${TEST.punkte} Punkte und dein Zertifikat 🎯 ${testName(L.key)} bestanden!`
          : bestanden ? `Bestanden! Die Belohnung gab es schon beim ersten Mal. Bestes Ergebnis: ${t.best} %`
          : t.bestanden ? `Dein Zertifikat hast du schon (bestes Ergebnis: ${t.best} %).` : `Ab ${TEST.grenze} % bestehst du. Bestes Ergebnis: ${t.best} %`)),
      falsch.length ? el("section", { class: "satzkarte" },
        el("h2", {}, `Falsch oder offen (${falsch.length})`),
        el("ol", { class: "test-falsch" }, falsch.map(([a, x]) => el("li", {},
          el("p", { class: "test-frage", lang: a.typ === "vokabel" || a.form === "weg" ? "de" : a.lang || "en" }, frageText(a)),
          el("p", { class: "klein" }, x.offen ? "Keine Antwort." : `Deine Antwort: ${x.antwort || "–"}`),
          el("p", { class: "test-loesung", lang: "en" }, `Richtig: ${a.loesung}`),
          el("p", { class: "klein test-ort" }, "📍 " + a.ort))))) : null,
      ueben.length ? el("section", { class: "satzkarte" }, el("h2", {}, "Üben"),
        el("div", { class: "knopfreihe" }, ueben.map((a) => knopf("📍 " + a.ort.replace(/^Station \d+ · /, ""), () => testZuTeil(a.schluessel))))) : null,
      el("div", { class: "knopfreihe" }, knopf("🎯 Nochmal testen", () => testStart(st), "haupt"), st.gln ? null : knopf("Zur Station", () => starteStation(st.nr)), knopf("Zur Startseite", startseite)));
  }
  // „Üben“: direkt in den Teil springen (wie starteStation/starteGruppe)
  function testZuTeil(schluessel) {
    const [nrS, grS, iS] = schluessel.split("|"), st = station(Number(nrS)), i = Number(iS);
    if (grS === "") neueLage({ nr: st.nr, teile: teileVon(st) });
    else { const g = st.gruppen[Number(grS)], vok = g.vokabeln ? g.vokabeln.map((id) => D.vokabeln.find((v) => v.id === id)) : null;
      neueLage(g.schritte ? { nr: st.nr, gruppe: Number(grS), teile: teileVon(g) } : { nr: st.nr, gruppe: Number(grS), vok, teile: gruppenTeile(st, vok) }); }
    lage.teil = Math.min(i, lage.teile.length - 1);
    zeigeTeil();
  }
  if (LOKAL) window.__testYourself = { // nur Test-Build: Lösung der aktuellen Aufgabe, Restzeit setzen, Mindestzeiten verkürzen
    loesung: () => { const L = testLauf, a = L && L.aufgaben[L.i]; return a ? { typ: a.typ, form: a.form || "", richtig: a.richtig, ziele: a.ziele || null, i: L.i, n: L.aufgaben.length } : null; },
    zeit: (sek) => { if (testLauf) testLauf.limit = (monoton() - testLauf.start) / 1000 + sek; },
    tempo: (f) => { testTempo = f; },
  };

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

  // Lehrer-Reset (30.10.2026, Mr. Alex): 3 Sekunden auf den App-Titel drücken → Lehrer-PIN → Punkte und Coins dieses Geräts neu setzen (gesiegelt).
  // Im Code steht nur ein langsamer Prüfwert (PBKDF2-SHA-256, 150 000 Runden), nicht die PIN. Nach 3 falschen Versuchen 10 Minuten Pause.
  // Erledigte Teile, Power Up, Hausaufgaben, Käufe und Einstellungen bleiben unverändert.
  // Salz und Prüfwert je Klasse getrennt (31.10., vorbereitet): diese App prüft gegen LEHRER.pin[LEHRER.klasse]; PIN 6–10 Stellen.
  const LEHRER = { klasse: "6", runden: 150000, ziel: "header.gruss h1",
    pin: { 6: { salz: "196404a92f6b78cd4a4b22eba8c631f9", pruef: "3911b26ed4164fe1166e1f0dac313c943903e6d606ce04603e1a871702c8d619" },
      9: { salz: "2da1f090afb42ffd361232144df226b8", pruef: "1cad582370030bb8a94891b9573ea63a32b188b6d04c9eabae6cb250a72e1b4f" } } };
  async function lehrerPinOk(pin) {
    try {
      const L = LEHRER.pin[LEHRER.klasse];
      const bytes = new Uint8Array(L.salz.match(/../g).map((b) => parseInt(b, 16)));
      const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"]);
      const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: bytes, iterations: LEHRER.runden }, k, 256);
      return Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, "0")).join("") === L.pruef;
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
    const feld = el("input", { type: "password", inputmode: "numeric", autocomplete: "off", maxlength: "10", minlength: "6", class: "lehrer-pin", "aria-label": "Lehrer-PIN" });
    const info = el("p", { class: "klein lehrer-info" }, "");
    let laeuft = false;
    const pruefen = async () => {
      if (laeuft) return;
      const pin = feld.value.trim();
      if (!/^\d{6,10}$/.test(pin)) { info.textContent = "Die PIN hat 6 bis 10 Stellen."; feld.focus(); return; }
      laeuft = true; info.textContent = "Prüfe …";
      const ok = await lehrerPinOk(pin);
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
    // Stichprobe (31.10., Schutz-Paket 3): Protokoll-Summe, Warnzähler, Plausibilitätsmarker und die letzten 10 Ereignisse – nur lesen
    const pr = plausibilitaet(), w = warnZaehlerLies(), pl = Array.isArray(stand.protokoll) ? stand.protokoll : [];
    const ARTEN = { t: "Teil", g: "Word Gym", s: "Runner-Story", e: "Einheit", m: "Spiel", h: "Homework", bw: "Wochenende", bf: "Ferien", bs: "Serie", bq: "Woche", bm: "Monat", gl: "Road to GLN ×2", gr: "GLN ready (100 Coins)", gs: "GLN-Serie (50 Coins)", k: "Kauf", w: "Warnung", r: "Startwert", a: "Altbestand", x: "Abfrage", p: "Test", c: "Karte" };
    const zeit = (t) => { const d = new Date(t * 60000); return `${d.getDate()}.${d.getMonth() + 1}. ${zwei(d.getHours())}:${zwei(d.getMinutes())}`; };
    const letzte = pl.slice(-10).reverse().map((e) => el("li", {}, e[1] === "x" ? `${zeit(e[0])} · Abfrage · ${e[2] > 0 ? "👍" : "👎"}`
      : `${zeit(e[0])} · ${ARTEN[e[1]] || e[1]} · ${e[2] > 0 && e[1] !== "r" && e[1] !== "a" ? "+" : ""}${e[2]}${e[1] === "k" ? " 🪙" : ""}`));
    // Stichproben-Abfragen (1.11.): Bilanz aus den x-Einträgen; die Zeile dient auch als Hinweis, wenn es nichts abzufragen gibt
    const abfragen = pl.filter((e) => e[1] === "x"), hoch = abfragen.filter((e) => e[2] > 0).length;
    const datum = (t) => { const d = new Date(t * 60000); return `${d.getDate()}.${d.getMonth() + 1}.`; };
    const abfrageZeile = el("p", { class: "klein lehrer-abfragen" }, abfragen.length ? `🎲 Abfragen: ${hoch} 👍 / ${abfragen.length - hoch} 👎 (letzte ${datum(abfragen[abfragen.length - 1][0])})` : "🎲 Abfragen: noch keine Stichprobe.");
    // 🎯 Test yourself (2.11.): bestandene Stationen mit bestem Ergebnis, dahinter die noch nicht bestandenen
    const tests = Object.entries(sp.tests && typeof sp.tests === "object" ? sp.tests : {}).sort((x, y) => String(x[0]).localeCompare(String(y[0]), "de", { numeric: true }));
    const testsOk = tests.filter(([, x]) => x && x.bestanden), testsOffen = tests.filter(([, x]) => x && !x.bestanden);
    const testZeile = el("p", { class: "klein lehrer-tests" }, tests.length
      ? `🎯 Tests: ${testsOk.length} bestanden` + (testsOk.length ? ` (${testsOk.map(([k, x]) => `${testName(k)} ${x.best} %`).join(", ")})` : "")
        + (testsOffen.length ? ` · nicht bestanden: ${testsOffen.map(([k, x]) => `${testName(k)} ${x.best} %`).join(", ")}` : "")
      : "🎯 Tests: noch keiner.");
    const gs = glnStandLehrer();
    const glnZeileL = gs ? el("p", { class: "klein lehrer-gln" }, `🏁 Road to GLN (${gs.g.datum.slice(8)}.${gs.g.datum.slice(5, 7)}.): ${gs.z}/${gs.n} · Abschlusstest `
      + (gs.test ? `bestanden am ${testDatum(gs.test)} (${gs.best} %)` : gs.best != null ? `noch nicht bestanden (bestes Ergebnis ${gs.best} %)` : "noch nicht gemacht")
      + ` · geübt an ${gs.tage} Tagen, Serie ${gs.serie}` + (gs.plan ? ` · ${gs.plan.hinterher ? "⏰ hinterher" : "im Plan"}` : "")) : null;
    const stichprobe = el("div", { class: "lehrer-stichprobe" },
      el("p", { class: "klein" }, `🔎 Stichprobe: ⭐ ${sp.punkte} · 🪙 ${sp.coins} · Protokoll-Summe ${protokollSumme(pl)} (${pl.length} Einträge) · Warnungen ${(Array.isArray(sp.warnungen) ? sp.warnungen : []).length} (Zähler ${w.n || 0})`),
      el("p", { class: "klein lehrer-marker" + (pr.marker.length ? " auffaellig" : "") }, (pr.altbestand ? "Altbestand (Stand von vor dem Protokoll). " : "")
        + (pr.marker.length ? `Marker: ${pr.marker.join(", ")}` + (pr.seit ? ` (seit ${zeit(pr.seit)})` : "") : "Keine Auffälligkeiten.") + (pr.hinweis ? ` · Hinweis: ${pr.hinweis}` : "")),
      abfrageZeile, testZeile, glnZeileL,
      letzte.length ? el("ul", { class: "lehrer-liste" }, letzte) : null);
    const sichern = () => {
      const np = Math.max(0, Math.floor(Number(p.value) || 0)), nc = Math.max(0, Math.floor(Number(c.value) || 0));
      sp.punkte = np; sp.coins = nc; sp.titel = titelIndex(np);
      delete sp.gesperrt; delete sp.pauseBis; sp.log = []; // Speichern im Lehrer-Bereich schaltet die App wieder frei
      protokolliere("r", np); speichern(); lehrerZu();
      toast(`👩‍🏫 Gespeichert: ⭐ ${np} · 🪙 ${nc}`);
      if (!beschaeftigt()) startseite();
    };
    lehrerFenster(el("h2", {}, "👩‍🏫 Spielstand ändern"),
      el("p", { class: "klein" }, "Gilt nur für dieses Gerät. Erledigte Teile, Hausaufgaben, Käufe und Einstellungen bleiben."),
      zeile("⭐ Punkte", p), zeile("🪙 Coins", c),
      el("p", { class: "klein lehrer-wache" }, warnungen.length ? `👀 Warnungen „Mr. Alex is watching you“ (${(sp.warnungen || []).length}): ${warnungen.join(" · ")}` : "👀 Keine Warnungen „Mr. Alex is watching you“."),
      gesperrt && el("p", { class: "lehrer-sperre" }, "🔒 Die App ist gesperrt (zu viele Punkte in zu kurzer Zeit). „Speichern“ schaltet sie wieder frei – die Punkte oben kannst du vorher anpassen."),
      stichprobe,
      el("div", { class: "knopfreihe" }, knopf("🎲 Stichprobe", () => stichprobeStart(abfrageZeile), "leise"), knopf("📲 QR für Lehrer", syncQrZeigen, "leise"), knopf("Coins auf 0", () => { c.value = "0"; }, "leise"), knopf("Punkte auf 0", () => { p.value = "0"; }, "leise"),
        altstandRoh && knopf("Alten Stand übernehmen", altstandUebernehmen, "leise")),
      el("div", { class: "knopfreihe" }, knopf("Speichern", sichern, "haupt"), knopf("Abbrechen", lehrerZu, "leise")));
  }

  /* ---------- 📲 Sync Stufe A ohne Server (10.11.2026, Block 4d, docs/ideenspeicher.md „Strategie“ Punkt 1) ----------
     Nur im Lehrer-Bereich (nach PIN): Mr. Alex trägt je Gerät einmal Lerngruppe und einen pseudonymen Code ein (SPEICHER+"-c", nie ein Name).
     Der QR-Code (qr.js, qrcode-generator von Kazuhiko Arase, MIT) enthält einen Link auf die Übersichtsseite lehrer/ mit den Daten im #-Teil:
     Der #-Teil wird nicht an den Server geschickt – die Daten gehen nur über die Kamera des Lehrergeräts in dessen Browser.
     Format v1 (Stufe B schickt später dasselbe an einen Server): { v:1, a: App, g: Lerngruppe, c: Code, t: Minuten seit 1970,
     n: erledigte Teile, p: Punkte, d: [Übungsereignisse je Tag, heute zuerst, 14 Tage], h: { v, b, z, n } Hausaufgabe (von, bis, Ziele fertig, Ziele),
     w: [[Wort, Fehler im Word Gym] …] die schwersten acht }. */
  const SYNC = { app: "EN6", adresse: "https://langenbachalex.github.io/School/lehrer/" };
  const syncKennLies = () => { try { return JSON.parse(localStorage.getItem(SPEICHER + "-c") || "{}") || {}; } catch (e) { return {}; } };
  const syncKennSchreib = (o) => { try { localStorage.setItem(SPEICHER + "-c", JSON.stringify(o)); } catch (e) { /* egal */ } };
  function syncDaten(kenn) {
    const pl = Array.isArray(stand.protokoll) ? stand.protokoll : [];
    const tage = [];
    for (let i = 0; i < 14; i++) { const d = heute(); d.setDate(d.getDate() - i); tage.push(iso(d)); }
    const d = tage.map(() => 0);
    for (const e of pl) {
      if (!"tgsemh".includes(e[1]) || e[1].length !== 1) continue; // nur Übungen (Teil, Word Gym, Story, Einheit, Spiel, Homework), keine Boni/Käufe/Warnungen
      const i = tage.indexOf(iso(new Date(e[0] * 60000)));
      if (i >= 0) d[i]++;
    }
    const t = iso(heute());
    const h = (D.hausaufgaben || []).filter((x) => x.von <= t).sort((x, y) => (x.von < y.von ? 1 : -1))[0]; // aktuelle oder letzte Hausaufgabe
    const karten = (stand.gym && stand.gym.karten) || {};
    const w = Object.entries(karten).filter(([, k]) => k && k.x > 0).sort((x, y) => y[1].x - x[1].x).slice(0, 8)
      .map(([id, k]) => { const v = D.vokabeln.find((x) => x.id === id); return v ? [v.en, k.x] : null; }).filter(Boolean);
    return { v: 1, a: SYNC.app, g: kenn.g, c: kenn.c, t: Math.floor(Date.now() / 60000), n: Object.keys(stand.teile || {}).length,
      p: spielstand().punkte, d, h: h ? { v: h.von, b: h.bis, z: h.ziele.filter((z) => hwZielFertig(h, z)).length, n: h.ziele.length } : null, w,
      r: ((s) => (s ? { z: s.z, n: s.n, t: s.test ? 1 : 0, p: s.plan ? (s.plan.hinterher ? 0 : 1) : null } : null))(glnStandLehrer()) }; // r: Road to GLN (Ziele fertig, Ziele, Abschlusstest bestanden)
  }
  const syncLink = (daten) => SYNC.adresse + "#d=" + btoa(unescape(encodeURIComponent(JSON.stringify(daten)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  function syncQrZeigen() {
    const kenn = syncKennLies();
    const feld = (wert, name, platz) => el("input", { type: "text", value: wert || "", maxlength: "8", autocomplete: "off", "aria-label": name, placeholder: platz, class: "lehrer-zahl" });
    const g = feld(kenn.g, "Lerngruppe", "z. B. 6a"), c = feld(kenn.c, "Code", "z. B. 07");
    const zeile = (text, f) => el("label", { class: "lehrer-zeile" }, el("span", {}, text), f);
    const bild = el("div", { class: "sync-qr" }), info = el("p", { class: "klein" }, "");
    const zeichnen = () => {
      const k = { g: g.value.trim(), c: c.value.trim() };
      syncKennSchreib(k);
      bild.replaceChildren();
      if (!/^[\w.-]{1,8}$/.test(k.g) || !/^[\w.-]{1,8}$/.test(k.c)) { info.textContent = "Lerngruppe und Code eintragen (Buchstaben, Ziffern, Punkt, Bindestrich; kein Name)."; return; }
      if (typeof qrcode !== "function") { info.textContent = "QR-Baustein fehlt (qr.js)."; return; }
      const daten = syncDaten(k), qr = qrcode(0, "M");
      qr.addData(syncLink(daten)); qr.make();
      bild.append(el("img", { src: qr.createDataURL(5, 4), alt: "QR-Code für das Lehrergerät", style: "image-rendering:pixelated;width:min(80vw,320px);background:#fff" }));
      info.textContent = `${SYNC.app} · ${k.g} · Code ${k.c} · ${daten.d[0]} Übungen heute, ${daten.d.filter((x) => x > 0).length} von 14 Tagen geübt`
        + (daten.h ? ` · HW ${daten.h.z}/${daten.h.n}` : "") + (daten.r ? ` · GLN ${daten.r.z}/${daten.r.n}${daten.r.t ? " ✓" : ""}${daten.r.p === 0 ? " ⏰" : ""}` : "") + ` · Stand ${new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`;
    };
    g.addEventListener("change", zeichnen); c.addEventListener("change", zeichnen);
    lehrerFenster(el("h2", {}, "📲 QR für das Lehrergerät"),
      el("p", { class: "klein" }, "Mit der Kamera des Lehrergeräts scannen: Der Link öffnet die Übersicht und speichert dort den Stand. Kein Server, keine Namen auf dem Schülergerät."),
      zeile("Lerngruppe", g), zeile("Code", c), bild, info,
      el("div", { class: "knopfreihe" }, knopf("Neu zeichnen", zeichnen, "haupt"), knopf("Zurück", lehrerReset, "leise"), knopf("Fertig", lehrerZu, "leise")));
    zeichnen();
  }

  /* ---------- 🎲 Stichproben-Abfrage (1.11.2026, Idee Mr. Alex 31.10., docs/ideenspeicher.md „Prüfungsformate“ (1)) ----------
     Nach PIN zieht die App aus den erledigten Teilen (stand.teile) 3–5 Prüfaufgaben, bevorzugt aus verschiedenen Teilen:
     Vokabel (deutsch → englisch), Satz (deutsch → englisch), Lesen (Aussage → Lösung), Hören (Audio → Satz in Schrift).
     Der Lehrer deckt die Lösung auf und bewertet 👍/👎; je Aufgabe ein Protokoll-Eintrag „x“ mit +1/−1 – keine Punkte, keine Coins,
     keine Haken. Der Dialog umgeht nichts: Sperren (Wächter, Lehrer-PIN) bleiben, wie sie sind. */
  const stichprobeDialog = el("dialog", { class: "feier frage stichprobe" });
  stichprobeDialog.addEventListener("cancel", (e) => e.preventDefault()); // Abbrechen nur über ✕
  document.body.append(stichprobeDialog);
  const zufall = (liste) => liste[Math.floor(Math.random() * liste.length)];
  // 3–5 Aufgaben aus verschiedenen Teilen (erst je Teil-Gruppe eine, dann der Rest), bei weniger erledigten Teilen weniger
  function stichprobeZiehen() {
    const quellen = mischen(Object.keys(stand.teile || {}).map(stichprobeTeil).filter(Boolean));
    const anzahl = Math.min(5, quellen.length < 3 ? quellen.length : 3 + Math.floor(Math.random() * 3));
    const gesehen = new Set(), erste = [], rest = [];
    for (const q of quellen) { if (gesehen.has(q.gruppe)) rest.push(q); else { gesehen.add(q.gruppe); erste.push(q); } }
    const aufgaben = [];
    for (const q of [...erste, ...rest]) { if (aufgaben.length >= anzahl) break; const a = stichprobeAufgabe(q); if (a) aufgaben.push(a); }
    return aufgaben;
  }

  // Teile und Vokabeln hinter einem Schlüssel „Station|Gruppe|Index“ (wie starteStation/starteGruppe); gruppe fasst Stufen eines Listen-and-Repeat-Blocks zusammen
  function stichprobeTeil(schluessel) {
    const [nrS, grS, iS] = schluessel.split("|"), st = station(Number(nrS));
    if (!st || st.spiele) return null;
    let teile, vok = null, ort = "Station " + st.nr;
    if (grS === "") teile = teileVon(st);
    else {
      const g = st.gruppen && st.gruppen[Number(grS)];
      if (!g) return null;
      ort += " · " + g.name;
      if (g.schritte) teile = teileVon(g);
      else { vok = g.vokabeln.map((id) => D.vokabeln.find((v) => v.id === id)).filter(Boolean); teile = gruppenTeile(st, vok); }
    }
    const teil = teile[Number(iS)];
    if (!teil) return null;
    return { teil, vok, ort, gruppe: `${nrS}|${grS}|${teil.art === "lr" ? "lr:" + teil.basis : vok ? "vok" : iS}` };
  }
  // Eine Prüfaufgabe: { typ, ort, frage (für den Schüler), symbol, text (z. B. Lesetext), loesung, zusatz, hinweis, audio }
  function stichprobeAufgabe(q) {
    const { teil, vok } = q;
    const satzVon = (id) => (Array.isArray(id) ? D.saetze[id[id.length - 1]] : D.saetze[id]);
    const satz = (id) => { const s = satzVon(id); return s && s.en && s.de ? { typ: "Satz", frage: s.de, symbol: s.symbol || "", loesung: s.en, audio: s.audio && s.audio.en } : null; };
    let a = null;
    if (teil.art === "lr") a = satz(zufall(teil.saetze));
    else if (teil.art.startsWith("vok_") && vok && vok.length) { const v = zufall(vok); a = { typ: "Vokabel", frage: v.de, symbol: v.symbol || "", loesung: v.en, audio: v.audio && v.audio.en }; }
    else if (teil.art === "verbform" || teil.art === "auswahl") { const auf = zufall(teil.aufgaben); a = auf.satz ? satz(auf.satz) : auf.frage ? { typ: "Aufgabe", frage: auf.frage, loesung: auf.richtig } : null; }
    else if (teil.art === "reihenfolge") a = satz(zufall(teil.woerter));
    else if (teil.art === "lesen") { const auf = zufall(teil.aufgaben), s = satzVon(auf.satz), text = satzVon(teil.text); if (s) a = { typ: "Lesen", frage: s.en, text: text && text.en, loesung: auf.loesung, hinweis: auf.hinweis }; }
    else if (teil.art === "hoeren" && teil.uebung) {
      const u = teil.uebung;
      if (u.art === "true-false" && Array.isArray(u.aufgaben)) { const auf = zufall(u.aufgaben.filter((x) => x.audio)); if (auf) a = { typ: "Hören", audio: auf.audio, loesung: auf.aussage, zusatz: "→ " + auf.loesung }; }
      else { const t = zufall((u.teile || []).filter((x) => x.audio)); if (t) a = { typ: "Hören", audio: t.audio, loesung: t.text, zusatz: t.sprecher }; }
    } else if (teil.art === "hoerwahl") { const o = zufall(zufall(teil.paare).optionen); a = { typ: "Hören", audio: o.audio, symbol: o.symbol, loesung: o.wort }; }
    if (!a || !a.loesung || (a.typ !== "Hören" && !a.frage)) return null;
    a.ort = q.ort + " · " + a.typ;
    return a;
  }

  let stichprobeLauf = null; // { aufgaben, i, hoch, runter }
  function stichprobeStart(hinweis) {
    const aufgaben = stichprobeZiehen();
    if (!aufgaben.length) { if (hinweis) hinweis.textContent = "🎲 Noch nichts erledigt – es gibt nichts abzufragen."; return; }
    stichprobeLauf = { aufgaben, i: 0, hoch: 0, runter: 0 };
    lehrerDialog.close();
    stichprobeZeigen();
  }
  const stichprobeEnde = () => { stopp(); stichprobeDialog.close(); stichprobeLauf = null; lehrerReset(); }; // zurück in den Lehrer-Dialog (ohne neue PIN)
  const STICHPROBE_ANWEISUNG = { Vokabel: "Wie heißt das auf Englisch?", Satz: "Sag den Satz auf Englisch:", Aufgabe: "Wie sagst du das auf Englisch?",
    Lesen: "Richtig, falsch oder nicht im Text?", Hören: "Hör zu – was hast du gehört?" };
  function stichprobeZeigen() {
    const L = stichprobeLauf, a = L.aufgaben[L.i], n = L.aufgaben.length;
    const zu = el("button", { class: "knopf leise stichprobe-zu", "aria-label": "Stichprobe abbrechen", onclick: stichprobeEnde }, "✕");
    if (!a) { // Zusammenfassung
      stichprobeDialog.replaceChildren(el("header", { class: "stichprobe-kopf" }, el("span", { class: "klein" }, `Stichprobe · ${n} Aufgaben`), zu),
        el("div", { class: "feier-symbol", "aria-hidden": "true" }, "🎲"), el("h2", {}, "Stichprobe fertig"),
        el("p", { class: "stichprobe-gross stichprobe-bilanz" }, `${L.hoch} 👍 · ${L.runter} 👎`),
        el("p", { class: "klein" }, "Im Protokoll notiert (ohne Punkte)."),
        el("div", { class: "knopfreihe" }, Object.assign(knopf("Fertig", stichprobeEnde, "haupt"), { autofocus: true }),
          knopf("🎲 Noch einmal", () => { const neu = stichprobeZiehen(); if (neu.length) { stichprobeLauf = { aufgaben: neu, i: 0, hoch: 0, runter: 0 }; stichprobeZeigen(); } }, "leise")));
      if (!stichprobeDialog.open) stichprobeDialog.showModal();
      return;
    }
    const hoeren = a.typ === "Hören";
    const anhoeren = a.audio ? knopf("🔊 Anhören", () => spiele([a.audio]), hoeren ? "haupt" : "leise") : null;
    const loesung = el("div", { class: "stichprobe-loesung", hidden: true }, el("p", { class: "klein" }, "Lösung"),
      el("p", { class: "stichprobe-gross", lang: "en" }, a.loesung),
      a.zusatz && el("p", { class: "klein stichprobe-zusatz", lang: "en" }, a.zusatz), a.hinweis && el("p", { class: "klein stichprobe-zusatz" }, a.hinweis),
      !hoeren && anhoeren && el("div", { class: "knopfreihe" }, anhoeren));
    const werten = (gut) => { protokolliere("x", gut ? 1 : -1); speichern(); if (gut) L.hoch++; else L.runter++; L.i++; stopp(); stichprobeZeigen(); }; // keine Punkte, keine Coins
    const daumen = el("div", { class: "knopfreihe stichprobe-daumen", hidden: true }, knopf("👍 Kann es", () => werten(true), "haupt"), knopf("👎 Kann es nicht", () => werten(false), "leise"));
    const zeigen = knopf("Lösung zeigen", () => { loesung.hidden = false; daumen.hidden = false; zeigen.hidden = true; }, "haupt");
    zeigen.setAttribute("autofocus", ""); // Fokus auf den Hauptknopf, nicht auf ✕
    stichprobeDialog.replaceChildren(
      el("header", { class: "stichprobe-kopf" }, el("span", { class: "klein" }, `Stichprobe ${L.i + 1} von ${n} · ${a.ort}`), zu),
      el("div", { class: "stichprobe-aufgabe" }, el("p", { class: "klein stichprobe-anweisung" }, STICHPROBE_ANWEISUNG[a.typ] || ""),
        a.text && el("p", { class: "stichprobe-text", lang: "en" }, a.text),
        hoeren ? el("p", { class: "stichprobe-gross", "aria-hidden": "true" }, a.symbol || "🎧")
          : el("p", { class: "stichprobe-gross", lang: a.typ === "Lesen" ? "en" : "de" }, (a.symbol ? a.symbol + " " : "") + a.frage),
        hoeren && anhoeren && el("div", { class: "knopfreihe" }, anhoeren)),
      loesung,
      el("div", { class: "knopfreihe" }, zeigen), daumen);
    if (!stichprobeDialog.open) stichprobeDialog.showModal();
    if (hoeren && a.audio) setTimeout(() => spiele([a.audio]), 300);
  }

  // Vorbereitet (31.10.): Nach Ablauf von SIEGEL_BIS wird ein älterer, noch ungesiegelter Stand nur hier (nach PIN) übernommen und gesiegelt.
  function altstandUebernehmen() {
    if (!altstandRoh || typeof altstandRoh !== "object") return;
    Object.assign(stand, altstandRoh); delete stand._s; delete stand._v;
    stand.protokoll = [[minuten(), "a", (stand.spiel && stand.spiel.punkte) || 0]];
    altstandRoh = null; speichern(); lehrerZu(); location.reload();
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
  const beschaeftigt = () => !!lage || !!runnerLauf || stichprobeDialog.open || !!testLauf; // auch im London Run kein Update-Pop-up mitten im Lauf
  let neueVersion = false, updateGezeigt = false;
  const updateDialog = el("dialog", { class: "feier frage update" });
  updateDialog.addEventListener("cancel", (e) => e.preventDefault());
  document.body.append(updateDialog);
  function updateHinweis() {
    if (!neueVersion || updateGezeigt || beschaeftigt()) return;
    updateGezeigt = true;
    updateDialog.replaceChildren(el("div", { class: "feier-symbol", "aria-hidden": "true" }, "🔄"), el("h2", {}, "Neue Version"),
      el("p", {}, "Es gibt eine neue Version der App. Dein Fortschritt ist gespeichert. Tippe auf „Jetzt aktualisieren“."),
      el("div", { class: "knopfreihe" }, knopf("🔄 Jetzt aktualisieren", () => location.reload(), "haupt")));
    if (lehrerDialog.open) lehrerDialog.close();
    updateDialog.showModal();
  }
  setInterval(updateHinweis, 3000);
  setTimeout(sperreZeigen, 300); // gesperrt geblieben (auch nach Neuladen)
  if (LOKAL) window.__ortEreignis = (id) => { ereignisse.push({ art: "ort", ort: SP.orte.find((o) => o.id === id) }); zeigeEreignisse(); }; // nur Test-Build: Freischalt-Anzeige eines Orts (Orts-Szene/Stempel) auslösen
  if (LOKAL) window.__karteTest = { auswerten: kartenAuswerten, karteVon, zeige: zeigeEreignisse, sp: spielstand, sammlung };   // nur Test-Build: Folien-Karten prüfen
  if (LOKAL) window.__heldEreignis = (id) => { ereignisse.push({ art: "held", held: SP.helden.find((h) => h.id === id) }); zeigeEreignisse(); }; // nur Test-Build: neuer Superheld (Heldenfilm, danach Karte)
  if (LOKAL) window.__gln = { naechstes, zu: (k) => testZuTeil(k), lage: () => lage, stand: () => stand, lehrer: glnStandLehrer, aufgaben: () => testLauf && testLauf.aufgaben.map((a) => a.typ), // nur Test-Build: Road to GLN
    bestehen: () => { testLauf.antworten = testLauf.aufgaben.map(() => ({ richtig: true, antwort: "" })); testEnde(false); } };
  if (LOKAL) window.__punkte = (n) => punkteDazu(n, { art: "e", bonus: true }); // nur Test-Build: Bonuspunkte (Titel-Tiers)
  if (LOKAL) window.__station = (nr) => { lage = { nr, gruppe: null, teil: 0 }; stationGeschafft(); }; // nur Test-Build: Station abschließen (Mega-Lob)
  if (LOKAL) window.__updateTest = () => { neueVersion = true; updateHinweis(); }; // nur für Tests: tut so, als wäre eine neue Version da

  // Offline-Speicher (nur wenn die App über eine Webadresse läuft, nicht per Doppelklick)
  // Selbstheilung (11.11.2026): Lief die App mit neuem Programm, aber altem Stylesheet aus dem Zwischenspeicher (Road to GLN war rot statt grün),
  // fehlt die Farbe --gln. Dann das Stylesheet aus dem Offline-Speicher werfen, frisch vom Server holen und direkt einsetzen.
  (async () => {
    if (!location.protocol.startsWith("http") || getComputedStyle(document.documentElement).getPropertyValue("--gln").trim()) return;
    for (const datei of ["style.css"]) {
      try {
        if (window.caches) for (const k of await caches.keys()) if (/^mralex-[0-9a-f]+$/.test(k)) await (await caches.open(k)).delete(datei, { ignoreSearch: true });
        const css = await (await fetch(datei, { cache: "reload" })).text(), neu = document.createElement("style"), alt = document.querySelector(`link[href="${datei}"]`);
        neu.textContent = css;
        if (alt) alt.after(neu); else document.head.append(neu);
      } catch (e) { /* offline: beim nächsten Start noch einmal */ }
    }
  })();
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
