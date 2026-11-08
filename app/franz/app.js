/* Français Classe 5/6 – Sprachkurs-App (Mr. Alex)
   Kein Konto, keine Namen. Fortschritt bleibt nur auf diesem Gerät (localStorage, Schlüssel mit Präfix fr_).
   Kacheln: 💬 Dialogues · 🗣️ Prononciation · 🎮 Jeux · 🎧 Beat-Studio · 🗼 Paris (Karte mit Szenen, Stufe 2) · 🦸 Super-héros · 🏃 Paris Run (Stufe 4) · Sammlung „Panthéon“.
   Inhalte: inhalte/franz/*.tsv → werkzeuge/franz_bauen.py → daten_fr.js. Grundsatz: Wird eine Lösung gezeigt, wird sie auch abgespielt. */
(function () {
  "use strict";
  const D = window.DATEN_FR;
  const app = document.getElementById("app");
  const SPEICHER = "fr_stand";
  const TEMPI = [1, 0.85, 0.7];
  const LESE = ["einfach", "ipa", "aus"], LESE_TEXT = { einfach: "Aa einfach", ipa: "Aa IPA", aus: "Aa aus" };
  const SCHRITTE = [
    { sym: "🎧", name: "Écoute", unter: "Hören, mitlesen, nachsprechen" },
    { sym: "🔑", name: "Wendungen", unter: "Lücken bei bekannten Wendungen" },
    { sym: "🆕", name: "Neue Wörter", unter: "Lücken bei den neuen Wörtern" },
    { sym: "📈", name: "Wachsend", unter: "Immer mehr Lücken, Zeile für Zeile" },
    { sym: "🙋", name: "Parle de toi", unter: "Sprich über dich – wähl deine Wörter" }];
  // Lob und Rückmeldungen (8.11.) – gesprochen von Mr. Alex mit [French] (inhalte/franz/lob.tsv, idiomatisch statt übersetzt).
  // Arten: lob, stark (jede 5. richtige Antwort in Folge), fehler, spiel (witzig, nur in Jeux), geschafft, voll (ohne Fehler), doch (nach Fehlern geschafft).
  const RUF = D.lob || {};
  const LOB = (RUF.lob || []).map((r) => r.text).concat(RUF.lob ? [] : ["Bravo !", "Super !", "Génial !"]);
  // Gegen Wiederholung wie in der Englisch-App: derselbe Spruch erst nach 10 anderen derselben Art, kein Stichwort (gruppe) aus den letzten 3.
  const verlauf = [];
  function waehleRuf(art) {
    const liste = RUF[art] || [];
    if (!liste.length) return null;
    const gleicheArt = verlauf.filter((v) => v.art === art).slice(-10).map((v) => v.r);
    const nah = new Set(verlauf.slice(-3).flatMap((v) => v.r.gruppe || []));
    const frisch = (x) => !gleicheArt.includes(x), andere = (x) => !(x.gruppe || []).some((g) => nah.has(g));
    const pool = [liste.filter((x) => frisch(x) && andere(x)), liste.filter(frisch), liste].find((p) => p.length);
    const x = pool[Math.floor(Math.random() * pool.length)];
    verlauf.push({ art, r: x }); if (verlauf.length > 40) verlauf.shift();
    return x;
  }
  let vorLob = null, fehlerSerie = 0, richtigSerie = 0;
  // ruf(art) → Text; die Aufnahme läuft sofort bzw. vor dem nächsten spiele() (dort vorangestellt)
  function ruf(art) {
    const x = waehleRuf(art);
    if (!x) return art === "fehler" || art === "spiel" ? "Presque !" : "Bravo !";
    if (x.audio) { vorLob = x.audio; setTimeout(() => { if (vorLob === x.audio) { vorLob = null; spiele([x.audio]); } }, 0); }
    return x.text;
  }
  function lob(stark) {
    richtigSerie++;
    const art = fehlerSerie >= 2 && RUF.doch ? "doch" : (stark || richtigSerie % 5 === 0) && RUF.stark ? "stark" : "lob";
    fehlerSerie = 0;
    return ruf(art);
  }
  function tadel(imSpiel) { fehlerSerie++; richtigSerie = 0; return ruf(imSpiel && RUF.spiel && Math.random() < 0.3 ? "spiel" : "fehler"); }

  /* ---------- Speicher ---------- */
  function laden() {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(SPEICHER)) || {}; } catch (e) { s = {}; }
    return Object.assign({ punkte: 0, dialoge: {}, namen: {}, spiele: {}, paris: 1, helden: 0, lese: "einfach", tempo: 1 }, s);
  }
  const stand = laden();
  /* Punkte, Coins, Titel (7.11., wie Englisch 6): 1 🪙 je 2 ⭐ (aufgerundet), Coins sinken nur in der Boutique; Titel-Stufen aus D.titel.
     Ältere Stände: Coins einmalig rückwirkend aus den Punkten (der Paris Run war vorher frei), Titel still auf die passende Stufe. */
  function titelIndex(p) { return (D.titel || []).reduce((i, t, k) => (p >= t.ab ? k : i), 0); }
  if (!(stand.coins >= 0)) { stand.coins = Math.ceil(stand.punkte / 2); stand.ausgegeben = 0; }
  if (!(stand.titel >= 0)) stand.titel = titelIndex(stand.punkte);
  if (!Array.isArray(stand.gekauft)) stand.gekauft = [];
  speichern();
  function speichern() { try { localStorage.setItem(SPEICHER, JSON.stringify(stand)); } catch (e) { /* privater Modus: nur für diese Sitzung */ } }
  const heute = () => new Date().toISOString().slice(0, 10);

  /* ---------- Hilfen ---------- */
  function el(tag, attrs, ...kinder) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") e.className = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) e.setAttribute(k, v === true ? "" : v);
    }
    for (const k of kinder.flat(Infinity)) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(k));
    return e;
  }
  const knopf = (text, fn, art) => el("button", { type: "button", class: "knopf" + (art ? " " + art : ""), onclick: fn }, text);
  function zeige(...inhalt) { stopp(); app.replaceChildren(...inhalt.flat(Infinity).filter(Boolean)); window.scrollTo(0, 0); }
  function mischen(liste) {
    const a = liste.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const zufall = (l) => l[Math.floor(Math.random() * l.length)];
  const ohneKlammern = (t) => t.replace(/\[([^\]]*)\]/g, "$1");
  function toast(text) {
    const t = el("div", { class: "toast" }, text);
    document.getElementById("toasts").append(t);
    setTimeout(() => t.classList.add("weg"), 2200);
    setTimeout(() => t.remove(), 2800);
  }
  function punkte(plus, grund) {
    const muenzen = Math.ceil(plus / 2);
    stand.punkte += plus; stand.coins += muenzen;
    const t = titelIndex(stand.punkte), neuerTitel = t > stand.titel;
    if (neuerTitel) stand.titel = t;
    speichern();
    toast(`+${plus} ⭐ +${muenzen} 🪙 ${grund || zufall(LOB)}`);
    if (neuerTitel) { const ti = D.titel[t]; setTimeout(() => { toast(`${ti.symbol} Nouveau titre : ${ti.name} ! – Neuer Titel: ${ti.de}`); klang(true); }, 600); }
    freischalten(true);
  }
  /* Panthéon-Karten (7.11.): Fußballer + Persönlichkeiten in Folien-Reihenfolge (namen.tsv), alle KARTE_PUNKTE ⭐ eine Karte (8.11.: 100 ⭐, höchstens eine pro Tag).
     Offen ist eine Karte auch, wenn der Name in Prononciation schon geschafft ist (ältere Stände). Gold bleibt „ohne Vorbild“ = Niveau 2 in Prononciation. */
  /* Freischalten (8.11., Mr. Alex: viel zu schnell → wie Englisch): Superheld alle 3 Schultage am Stück (Nebenfach: Woche wäre zu schwer;
     Ferien/Feiertage Saarland unterbrechen die Serie nicht), dazu 🔥 Extra-Lob + 30 ⭐; Wochenende/Ferien geübt = Bonus 20 ⭐ (keine Pflicht); Paris- und Frankreich-Orte alle ORT_PUNKTE ⭐, Panthéon-Karten alle KARTE_PUNKTE ⭐ –
     von jeder Sorte höchstens eins pro Tag. stand.frei = schon freigeschaltet (bleibt), stand.freiTag = Tag der letzten Freischaltung je Sorte. */
  const ORT_PUNKTE = 200, KARTE_PUNKTE = 100;
  const NAMEN_REIHE = D.namen.filter((n) => n.gruppe === "foot" || n.gruppe === "histoire");
  const N_PARIS = (D.paris || []).length, N_FRANCE = (D.france || []).length, N_HELDEN = (D.helden || []).length;
  const tagIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const plusTage = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const montag = (d) => plusTage(d, -((d.getDay() + 6) % 7));
  const istSchultag = (d) => d.getDay() >= 1 && d.getDay() <= 5 && !(D.frei || []).some((f) => tagIso(d) >= f.von && tagIso(d) <= f.bis);
  const schultageDerWoche = (mo) => [0, 1, 2, 3, 4].map((i) => plusTage(mo, i)).filter(istSchultag);
  if (!stand.frei) { // ältere Stände: was nach den alten Regeln (Ort 20, Karte 25, Held 30 ⭐) schon frei war, bleibt frei
    const p = stand.punkte, alteParis = Math.min(N_PARIS, 1 + Math.floor(p / 20));
    const alteFrance = alteParis >= N_PARIS ? Math.max(0, Math.min(N_FRANCE, 1 + Math.floor((p - N_PARIS * 20) / 20))) : 0;
    stand.frei = { ort: alteParis + alteFrance, karte: Math.min(NAMEN_REIHE.length, Math.floor(p / 25)), held: Math.min(N_HELDEN, Math.floor(p / 30)) };
  }
  stand.freiTag = stand.freiTag || {}; stand.tage = stand.tage || {}; stand.feuer = stand.feuer || []; stand.bonusTage = stand.bonusTage || []; stand.wochen = stand.wochen || [];
  // Serie: Schultage am Stück bis heute (heute noch nicht geübt: die Serie bis gestern zählt noch)
  function serie() {
    let d = new Date(), n = 0;
    if (!stand.tage[tagIso(d)]) d = plusTage(d, -1);
    for (let i = 0; i < 400; i++, d = plusTage(d, -1)) { if (!istSchultag(d)) continue; if (stand.tage[tagIso(d)]) n++; else break; }
    return n;
  }
  // Perfekte Wochen hintereinander bis zur Woche mo (Wochen ohne Schultage = Ferien halten an), wie Englisch 6
  function wochenSerie(mo) {
    let n = 0;
    for (let w = mo, i = 0; i < 60; i++, w = plusTage(w, -7)) { if (!schultageDerWoche(w).length) continue; if (stand.wochen.includes(tagIso(w))) n++; else break; }
    return n;
  }
  const namenFrei = () => Math.min(NAMEN_REIHE.length, stand.frei.karte);
  const namenOffen = (n) => { const i = NAMEN_REIHE.indexOf(n); return (stand.namen[n.id] || 0) >= 1 || i < 0 || i < namenFrei(); };
  const rahmenKlasse = () => (stand.rahmen && stand.gekauft.includes("rahmen_" + stand.rahmen) ? " rahmen-" + stand.rahmen : "");
  const heldenFrei = () => Math.min(N_HELDEN, stand.frei.held);
  const parisFrei = () => Math.min(N_PARIS, stand.frei.ort);
  const franceFrei = () => Math.max(0, Math.min(N_FRANCE, stand.frei.ort - N_PARIS));
  const naechsterOrtBei = () => stand.frei.ort * ORT_PUNKTE;        // ab so vielen ⭐ ist der nächste Ort fällig (der erste Paris-Ort ist frei)
  const naechsteKarteBei = () => (stand.frei.karte + 1) * KARTE_PUNKTE;
  // Hinweistexte: „noch X ⭐“ – oder „morgen“, wenn genug Punkte da sind, heute aber schon etwas freigeschaltet wurde
  const restText = (bei, sorte, bis, morgen) => { const x = bei - stand.punkte; return x > 0 ? `noch ${x} ⭐ ${bis}` : `${morgen} kommt morgen (höchstens eins pro Tag)`; };
  const restOrt = () => restText(naechsterOrtBei(), "ort", "bis zum nächsten Ort", "Der nächste Ort");
  const restKarte = () => restText(naechsteKarteBei(), "karte", "bis zur nächsten Karte", "Die nächste Karte");
  setTimeout(() => freischalten(false), 0);
  const heldHinweis = () => { const n = serie(); return `🔥 ${n} Schultag${n === 1 ? "" : "e"} am Stück · alle 3 Schultage am Stück ein neuer Held`; };
  // nach Punkten und beim Start: höchstens ein neuer Ort, eine neue Karte, ein neuer Held pro Tag
  function freischalten(geuebt) {
    const tag = tagIso(new Date()), jetzt = new Date();
    const ersterDesTages = geuebt && !stand.tage[tag];
    if (geuebt) stand.tage[tag] = 1;   // Übungstag = an diesem Tag Punkte bekommen
    const meldungen = [];
    const bonus = (plus) => { stand.punkte += plus; stand.coins += Math.ceil(plus / 2); };
    if (ersterDesTages) {
      if (!istSchultag(jetzt)) {   // Wochenende/Ferien: Bonus, keine Pflicht (Serie läuft weiter)
        const we = jetzt.getDay() === 0 || jetzt.getDay() === 6;
        stand.bonusTage.push(tag); bonus(20); meldungen.push(`${we ? "🏖️" : "🌴"} ${ruf(we ? "wochenende" : "ferien")} +20 ⭐`);
      } else {
        const n = serie();
        if (n >= 3 && n % 3 === 0 && !stand.feuer.includes(tag)) {   // 🔥 3, 6, 9 … Schultage am Stück: Extra-Lob, +30 ⭐, neuer Superheld
          stand.feuer.push(tag); bonus(30);
          meldungen.push(`🔥 ${ruf(n === 3 ? "feuer3" : n === 6 ? "feuer6" : n === 9 ? "feuer9" : "feuer")} ${n} jours de suite · +30 ⭐`);
          if (stand.frei.held < N_HELDEN && stand.freiTag.held !== tag) { stand.frei.held++; stand.freiTag.held = tag; meldungen.push(`🦸 Nouveau super-héros : ${D.helden[stand.frei.held - 1].name} !`); }
        }
        // ⭐ Perfect week (8.11., wie Englisch 6): jeden Schultag der Woche geübt → +100 ⭐; 👑 4 perfekte Wochen hintereinander → +200 ⭐ und goldener Rahmen
        const mo = montag(jetzt);
        if (schultageDerWoche(mo).every((x) => stand.tage[tagIso(x)]) && !stand.wochen.includes(tagIso(mo))) {
          stand.wochen.push(tagIso(mo)); bonus(100);
          meldungen.push(`⭐ ${ruf("woche")} Semaine parfaite · +100 ⭐`);
          const ws = wochenSerie(mo);
          if (ws >= 4 && ws % 4 === 0) {
            bonus(200);
            if (!stand.gekauft.includes("rahmen_gold")) { stand.gekauft.push("rahmen_gold"); stand.rahmen = "gold"; }
            meldungen.push(`👑 ${ruf("monat")} Mois parfait · +200 ⭐ · goldener Rahmen`);
          }
        }
      }
    }
    if (stand.frei.ort < N_PARIS + N_FRANCE && stand.punkte >= naechsterOrtBei() && stand.freiTag.ort !== tag) {
      stand.frei.ort++; stand.freiTag.ort = tag;
      meldungen.push(stand.frei.ort <= N_PARIS ? `🗼 Nouveau lieu à Paris : ${D.paris[stand.frei.ort - 1].name} !` : `🇫🇷 Nouveau lieu en France : ${D.france[stand.frei.ort - N_PARIS - 1].name} !`);
    }
    if (stand.frei.karte < NAMEN_REIHE.length && stand.punkte >= naechsteKarteBei() && stand.freiTag.karte !== tag) {
      const n = NAMEN_REIHE[stand.frei.karte]; stand.frei.karte++; stand.freiTag.karte = tag;
      meldungen.push(`${D.gruppen[n.gruppe].split(" ")[0]} Nouvelle carte au Panthéon : ${n.name} !`);
    }
    speichern();
    meldungen.forEach((m, i) => setTimeout(() => toast(m), 1200 + 700 * i));
  }
  function rueckmeldung() { return el("div", { class: "rueckmeldung", hidden: true, role: "status" }); }
  function melde(box, art, text) { box.hidden = false; box.className = "rueckmeldung " + art; box.textContent = text; }
  const kopf = (titel, zurueck, unter) => el("header", { class: "kopf" }, knopf("← Zurück", zurueck, "leise"),
    el("div", {}, el("h1", { lang: "fr" }, titel), unter && el("p", { class: "klein" }, unter)));

  /* ---------- Audio ---------- */
  let lauf = 0, aktuell = null;
  const tempo = () => stand.tempo || 1;
  function stopp() {
    lauf++;
    if (aktuell) { aktuell.pause(); aktuell = null; }
    if (window.speechSynthesis) speechSynthesis.cancel();
  }
  function geraet(text) { // Notlösung: Sprachausgabe des Geräts (fr-FR), solange eine Datei fehlt oder für eigene Sätze
    return new Promise((fertig) => {
      if (!window.speechSynthesis) return fertig(0);
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "fr-FR"; u.rate = 0.9 * tempo();
      const v = speechSynthesis.getVoices().find((s) => s.lang.replace("_", "-").startsWith("fr"));
      if (v) u.voice = v;
      const start = performance.now();
      let erledigt = false;
      const ende = () => { if (erledigt) return; erledigt = true; clearTimeout(nb); fertig((performance.now() - start) / 1000); };
      const nb = setTimeout(ende, 2500 + text.split(/\s+/).length * 700);
      u.onend = ende; u.onerror = ende;
      speechSynthesis.speak(u);
    });
  }
  // spiele([Datei | {tts}]) → Promise mit Sprechdauer in Sekunden (null, wenn abgebrochen)
  function spiele(liste, pause = 300) {
    if (vorLob) { liste = [vorLob, ...liste]; vorLob = null; }
    stopp();
    const mein = lauf;
    let gesamt = 0;
    return liste.filter(Boolean).reduce((kette, x) => kette.then(() => new Promise((fertig) => {
      if (mein !== lauf) return fertig();
      if (typeof x === "object") return geraet(x.tts).then((d) => { gesamt += d; setTimeout(fertig, 250); });
      const a = new Audio(x);
      aktuell = a; a.playbackRate = tempo(); a.preservesPitch = true;
      a.onended = () => { gesamt += (a.duration || 0) / tempo(); setTimeout(fertig, pause); };
      a.onerror = fertig;
      a.play().catch(fertig);
    })), Promise.resolve()).then(() => (mein === lauf ? gesamt : null));
  }
  const ton = (z) => z.audio || { tts: ohneKlammern(z.fr || z.name) };
  const warte = (s) => new Promise((r) => setTimeout(r, s * 1000));
  function klang(gut) { // kurzer Ton aus dem Browser (keine Stimme)
    try {
      const ac = klang.ac || (klang.ac = new (window.AudioContext || window.webkitAudioContext)());
      (gut ? [880, 1320] : [300, 220]).forEach((f, i) => {
        const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + i * 0.11;
        o.frequency.value = f; o.type = gut ? "sine" : "triangle";
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        o.connect(g).connect(ac.destination); o.start(t); o.stop(t + 0.2);
      });
    } catch (e) { /* ohne Ton weiter */ }
  }
  // „Jetzt du!“-Balken: läuft so lange wie die Zeile + 1 s
  const jetztDu = (text) => el("div", { class: "jetztdu", hidden: true, role: "status" }, text || "À toi ! Sprich nach.", el("span", { class: "balken", "aria-hidden": "true" }));
  function balken(b, sek) {
    b.hidden = false; b.classList.remove("laeuft"); void b.offsetWidth;
    b.style.setProperty("--dauer", sek.toFixed(1) + "s"); b.classList.add("laeuft");
    return warte(sek).then(() => { b.hidden = true; });
  }

  /* ---------- Oberleiste ---------- */
  function leiste() {
    const t = document.getElementById("tempo"), l = document.getElementById("lesehilfe");
    const tz = () => { t.textContent = (tempo() < 1 ? "🐢 " : "🔊 ") + String(tempo()).replace(".", ",") + "×"; };
    t.addEventListener("click", () => { stand.tempo = TEMPI[(TEMPI.indexOf(tempo()) + 1) % TEMPI.length]; speichern(); tz(); if (aktuell) aktuell.playbackRate = tempo(); });
    const lz = () => { l.textContent = LESE_TEXT[stand.lese]; l.setAttribute("aria-label", "Lesehilfe: " + stand.lese); document.body.dataset.lese = stand.lese; };
    l.addEventListener("click", () => { stand.lese = LESE[(LESE.indexOf(stand.lese) + 1) % LESE.length]; speichern(); lz(); });
    tz(); lz();
  }
  // Lesehilfe: Sprechgruppen mit |, Silben mit ·, die letzte Silbe jeder Gruppe ist betont (fett)
  function lesehilfe(z) {
    const art = (g) => el("span", { class: "lese lese-" + g, "aria-hidden": "true" }, g === "ipa" ? "/" : "",
      z[g].map((gr, gi) => [gi ? " | " : "", gr.map((s, si) => [si ? "·" : "", si === gr.length - 1 ? el("b", {}, s) : s])]), g === "ipa" ? "/" : "");
    return el("span", { class: "lesehilfe" }, art("einfach"), art("ipa"));
  }

  /* ---------- Startseite ---------- */
  function dialogStand(d) { return stand.dialoge[d.id] || (stand.dialoge[d.id] = {}); }
  const schritteFertig = (d) => SCHRITTE.filter((_, i) => dialogStand(d)[i + 1]).length;
  function startseite() {
    const namenFertig = Object.keys(stand.namen).length;
    zeige(
      el("header", { class: "gruss" },
        el("h1", { lang: "fr" }, "Français 🇫🇷"),
        el("p", { class: "klein" }, "Salut ! Wähl eine Kachel. Paris, Super-héros und Stars sammelst du im Panthéon."),
        el("div", { class: "statusleiste" + rahmenKlasse() }, el("span", { class: "status-titel", lang: "fr", title: D.titel[stand.titel].de }, `${D.titel[stand.titel].symbol} ${D.titel[stand.titel].name}`),
          el("span", {}, `⭐ ${stand.punkte} Punkte`), el("span", { class: "status-coins", title: "Coins" }, `🪙 ${stand.coins}`),
          serie() > 0 && el("span", { title: "Schultage am Stück – alle 3 ein neuer Superheld" }, `🔥 ${serie()} jour${serie() > 1 ? "s" : ""} de suite`), el("span", {}, `🗣️ ${namenFertig}/${D.namen.length} Namen`),
          knopf("🏛️ Panthéon", pantheon, "haupt"))),
      el("nav", { class: "kacheln", "aria-label": "Kacheln" },
        kachel("💬", "Dialogues", `${D.dialoge.filter((d) => schritteFertig(d) === SCHRITTE.length).length}/${D.dialoge.length} geschafft`, dialogListe),
        kachel("🗣️", "Prononciation", "Namen richtig aussprechen", prononciation),
        kachel("🎮", "Jeux", "Memory, Qui est-ce ?, Dans l'ordre", jeux),
        kachel("🎧", "Beat-Studio", "Mitsingen mit Mr. Alex", beatStudio)));
    if (parisFrei() > stand.paris || heldenFrei() > stand.helden) setTimeout(parisNeu, 700);
  }
  const kachel = (sym, titel, unter, fn, extra) => el("button", { type: "button", class: "kachel" + (extra || ""), onclick: fn },
    el("span", { class: "sym", "aria-hidden": "true" }, sym), el("span", { class: "titel", lang: "fr" }, titel), unter && el("span", { class: "unter" }, unter));

  /* ---------- 💬 Dialogues ---------- */
  function dialogListe() {
    zeige(kopf("💬 Dialogues", startseite, "Hören, nachsprechen, Lücken füllen – und am Ende über dich sprechen."),
      el("nav", { class: "kacheln" }, D.dialoge.map((d) => {
        const n = schritteFertig(d);
        return kachel(n === SCHRITTE.length ? "🏅" : "💬", d.titel, `${d.titel_de} · ${n}/${SCHRITTE.length} Schritte`, () => dialogSeite(d), n === SCHRITTE.length ? " erledigt" : "");
      })));
  }
  function dialogSeite(d) {
    const ds = dialogStand(d);
    zeige(kopf(d.titel, dialogListe, `${d.titel_de} · Woche ${d.woche}`),
      el("nav", { class: "kacheln schritte-kacheln" }, SCHRITTE.map((s, i) => kachel(s.sym, `${i + 1}. ${s.name}`, s.unter + (ds[i + 1] ? " ✓" : ""),
        () => schritt(d, i + 1), ds[i + 1] ? " erledigt" : ""))));
  }
  function schritt(d, nr) { [null, ecoute, (x) => luecken(x, 3, 2), (x) => luecken(x, 4, 3), wachsend, parle][nr](d); }
  function schrittFertig(d, nr) {
    const ds = dialogStand(d);
    if (ds[nr]) return;
    ds[nr] = heute(); speichern();
    punkte(10, `${SCHRITTE[nr - 1].name} geschafft!`);
    if (schritteFertig(d) === SCHRITTE.length) setTimeout(() => punkte(20, `🏅 „${d.titel}“ im Panthéon!`), 900);
  }
  const weiterLeiste = (d, nr) => el("div", { class: "knopfreihe" },
    nr < SCHRITTE.length && knopf(`Weiter: ${SCHRITTE[nr].sym} ${SCHRITTE[nr].name} ➜`, () => schritt(d, nr + 1), "haupt"),
    knopf("Alle Schritte", () => dialogSeite(d)));
  const werMarke = (z) => el("span", { class: "wer wer-" + z.wer.toLowerCase(), "aria-label": "Person " + z.wer }, z.wer);

  // Schritt 1: ganzer Dialog, DE links / FR rechts, Zeile antippen = hören; „Répète“ mit Pause zum Nachsprechen
  function ecoute(d) {
    const zeilen = d.zeilen.map((z, i) => el("button", { type: "button", class: "dialogzeile", onclick: () => { markiere(i); spiele([ton(z)]); } },
      werMarke(z), el("span", { class: "de" }, ohneKlammern(z.de)), el("span", { class: "fr", lang: "fr" }, ohneKlammern(z.fr), lesehilfe(z))));
    const markiere = (i) => zeilen.forEach((b, j) => b.classList.toggle("aktiv", i === j));
    const du = jetztDu();
    async function alles(repete) {
      const mein = ++alles.nr;
      for (let i = 0; i < d.zeilen.length; i++) {
        markiere(i);
        zeilen[i].scrollIntoView({ block: "nearest", behavior: "smooth" });
        const t = await spiele([ton(d.zeilen[i])]);
        if (t === null || mein !== alles.nr) return;
        if (repete) { await balken(du, t + 1); if (mein !== alles.nr) return; }
      }
      markiere(-1);
      schrittFertig(d, 1);
    }
    alles.nr = 0;
    zeige(kopf(d.titel, () => dialogSeite(d), "1. Écoute – tipp eine Zeile an, oder hör den ganzen Dialog."),
      el("section", { class: "satzkarte" },
        el("div", { class: "knopfreihe" }, knopf("▶ Tout le dialogue", () => alles(false), "haupt"), knopf("🔁 Répète (nachsprechen)", () => alles(true)),
          knopf("⏹", () => { alles.nr++; stopp(); markiere(-1); du.hidden = true; }, "leise")),
        du, el("div", { class: "dialog" }, el("div", { class: "dialog-kopf", "aria-hidden": "true" }, el("span", {}), el("span", {}, "Deutsch"), el("span", {}, "Français")), zeilen)),
      weiterLeiste(d, 1));
  }

  // Lücken finden: Wörter (für Wachsend) oder feste Wendungen (längste zuerst, ohne Überlappung)
  const WORT = /[A-Za-zÀ-ÿœŒ'’-]+/g;
  function woerter(text) { return [...text.matchAll(WORT)].map((m) => ({ von: m.index, bis: m.index + m[0].length, wort: m[0] })); }
  function treffer(text, liste) {
    const frei = Array(text.length).fill(true), t = [], klein = text.toLowerCase(); // Groß/klein egal; die Lücke zeigt den Text wie im Dialog
    for (const w of liste.map((x) => x.toLowerCase()).sort((a, b) => b.length - a.length)) {
      let ab = 0, i;
      while ((i = klein.indexOf(w, ab)) >= 0) {
        const vor = text[i - 1], nach = text[i + w.length];
        const grenze = !(vor && /[A-Za-zÀ-ÿ]/.test(vor)) && !(nach && /[A-Za-zÀ-ÿ]/.test(nach) && /[A-Za-zÀ-ÿ]$/.test(w));
        if (grenze && frei.slice(i, i + w.length).every(Boolean)) { t.push({ von: i, bis: i + w.length, wort: text.slice(i, i + w.length) }); frei.fill(false, i, i + w.length); }
        ab = i + w.length;
      }
    }
    return t.sort((a, b) => a.von - b.von);
  }
  function lueckenFuer(text, art, anteil) {
    if (art === 3) return treffer(text, D.wendungen.map((w) => w.fr.replace(/ [?!.]$/, "")));
    if (art === 4) return treffer(text, lueckenFuer.neu || []);
    const w = woerter(text), n = Math.max(1, Math.round(w.length * anteil));
    return mischen(w).slice(0, n).sort((a, b) => a.von - b.von);
  }
  // Satz mit Lücken bauen → { knoten, luecken: [{ wort, span, fertig }] }
  function lueckensatz(text, gaps) {
    const teile = [], luecken = [];
    let pos = 0;
    for (const g of gaps) {
      teile.push(text.slice(pos, g.von));
      const span = el("span", { class: "luecke-fr", "aria-label": "Lücke" }, "_".repeat(Math.min(10, Math.max(3, g.wort.length))));
      luecken.push({ wort: g.wort, span, fertig: false });
      teile.push(span); pos = g.bis;
    }
    teile.push(text.slice(pos));
    return { knoten: el("span", { lang: "fr" }, teile), luecken };
  }
  // Wortkasten: Chips antippen füllt die nächste offene Lücke (in Reihenfolge); falsch = kurz wackeln
  function wortkasten(alle, bei, extra = []) {
    const offen = alle.slice(), echte = new Set(alle.map((l) => l.wort));
    const aktiv = () => offen.find((l) => !l.fertig);
    const markiere = () => { alle.forEach((l) => l.span.classList.toggle("dran", l === aktiv())); };
    const kasten = el("div", { class: "wortkasten", "aria-label": "Wortkasten" }, mischen([...alle, ...extra.filter((w) => !echte.has(w)).map((w) => ({ wort: w }))]).map((l) => {
      const chip = el("button", { type: "button", class: "chip", lang: "fr", onclick: () => {
        const a = aktiv();
        if (!a) return;
        if (chip.textContent === a.wort) {
          a.fertig = true; a.span.textContent = a.wort; a.span.classList.add("gefuellt"); chip.remove(); klang(true); markiere(); bei.richtig(a, !aktiv());
        } else { chip.classList.remove("falsch"); void chip.offsetWidth; chip.classList.add("falsch"); klang(false); bei.falsch(a); }
      } }, l.wort);
      return chip;
    }));
    markiere();
    return kasten;
  }

  // Schritte 2–4: der ganze Dialog mit Lücken, Wortkasten darüber
  function luecken(d, art, nr) { // art 3 = Wendungen, 4 = neue Wörter; nr = Schritt
    lueckenFuer.neu = d.neu;
    const box = rueckmeldung(), alle = [];
    const zeilen = d.zeilen.map((z) => {
      const text = ohneKlammern(z.fr), ls = lueckensatz(text, lueckenFuer(text, art));
      ls.luecken.forEach((l) => { l.zeile = z; alle.push(l); });
      return el("div", { class: "dialogzeile" }, werMarke(z), el("span", { class: "de" }, ohneKlammern(z.de)), el("span", { class: "fr" }, ls.knoten));
    });
    let fehler = 0;
    const kasten = wortkasten(alle, {
      richtig: (l, ende) => {
        if (!alle.some((x) => x.zeile === l.zeile && !x.fertig)) spiele([ton(l.zeile)]);
        if (ende) { melde(box, "gut", `${ruf(fehler ? "geschafft" : "voll")} Alle Lücken gefüllt${fehler ? "" : " – ohne Fehler"}!`); schrittFertig(d, nr); }
      },
      falsch: () => { fehler++; melde(box, "hilfe", `${tadel()} Schau noch mal.`); }
    });
    zeige(kopf(d.titel, () => dialogSeite(d), `${nr}. ${SCHRITTE[nr - 1].name} – tipp die Wörter in der richtigen Reihenfolge an.`),
      el("section", { class: "satzkarte" }, el("p", { class: "zaehler" }, "Wortkasten"), kasten, box,
        el("div", { class: "dialog" }, zeilen), alle.length === 0 && el("p", {}, "In diesem Dialog gibt es hier keine Lücken.")),
      weiterLeiste(d, nr));
    if (!alle.length) schrittFertig(d, nr);
  }

  // Schritt 5: Zeile für Zeile, drei Runden mit wachsenden Lücken (ein Drittel → zwei Drittel → alle Wörter)
  function wachsend(d, runde = 0, i = 0) {
    const ANTEIL = [0.34, 0.67, 1];
    const z = d.zeilen[i], text = ohneKlammern(z.fr), ls = lueckensatz(text, lueckenFuer(text, 5, ANTEIL[runde]));
    const box = rueckmeldung(), weiter = knopf("Weiter ➜", () => {
      if (i + 1 < d.zeilen.length) wachsend(d, runde, i + 1);
      else if (runde + 1 < ANTEIL.length) { toast(`Runde ${runde + 2}: mehr Lücken!`); wachsend(d, runde + 1, 0); }
      else { schrittFertig(d, 4); dialogSeite(d); }
    }, "haupt");
    weiter.disabled = true;
    // Ablenker: in Runde 1 und 2 zwei Wörter aus anderen Zeilen dazu, damit es nicht zu leicht wird
    const fremd = runde < 2 ? mischen([...new Set(d.zeilen.filter((x) => x !== z).flatMap((x) => woerter(ohneKlammern(x.fr)).map((w) => w.wort)))]).slice(0, 2) : [];
    const kasten = wortkasten(ls.luecken, {
      richtig: (l, ende) => { if (ende) { melde(box, "gut", lob()); spiele([ton(z)]); weiter.disabled = false; weiter.focus(); } },
      falsch: () => melde(box, "hilfe", tadel())
    }, fremd);
    zeige(kopf(d.titel, () => dialogSeite(d), "4. Wachsend – jede Runde mehr Lücken."),
      el("section", { class: "satzkarte" },
        el("p", { class: "zaehler" }, `Runde ${runde + 1}/3 · Zeile ${i + 1}/${d.zeilen.length}`),
        el("p", { class: "de-hinweis" }, werMarke(z), " ", ohneKlammern(z.de)),
        el("p", { class: "satz gross-fr" }, ls.knoten), kasten, box,
        el("div", { class: "knopfreihe" }, knopf("🔊 Hören", () => spiele([ton(z)])), weiter)));
  }

  // Schritt 6: Parle de toi – Wahl-Lücken aus Wortkästen, dann vorlesen lassen (Geräte-Stimme) und selbst sagen
  const KASTEN_NAME = { hobby: "Hobby", zahl: "Zahl", adj: "Wie ist es?", chant: "Wie?", name: "Name" };
  // Stimmen für Parle de toi (8.11.): keine passenden französischen Kinderstimmen bei ElevenLabs → Jules (Junge/Mann) und Cécile (Mädchen/Frau) wie in den Dialogen
  const PARLE_STIMMEN = [["A", "👦 Jules"], ["B", "👧 Cécile"]];
  const parleStimme = () => (stand.parleStimme === "B" ? "B" : "A");
  // Schlüssel wie parle_stueck() in werkzeuge/franz_bauen.py: Satzzeichen vorne weg, Leerzeichen außen weg; nur Satzzeichen → nichts
  const parleStueck = (t) => { const x = t.replace(/^[\s.,!?;:]+/, "").trim(); return /\p{L}/u.test(x) ? x : ""; };
  function parle(d) {
    const box = rueckmeldung(), saetze = [];
    const karten = d.parle.map((vorlage) => {
      const teile = vorlage.split(/(\{\w+\})/), wahl = [];
      const satz = el("p", { class: "satz gross-fr", lang: "fr" }, teile.map((t) => {
        const m = t.match(/^\{(\w+)\}$/);
        if (!m) return t;
        const w = { kasten: m[1], wert: null, span: el("button", { type: "button", class: "luecke-fr wahl-luecke", onclick: () => oeffne(w) }, "▢ " + KASTEN_NAME[m[1]]) };
        wahl.push(w);
        return w.span;
      }));
      const auswahl = el("div", { class: "wortkasten", hidden: true });
      function oeffne(w) {
        wahl.forEach((x) => x.span.classList.toggle("dran", x === w));
        const liste = D.woerter[w.kasten] || [];
        const frei = w.kasten === "name" && el("input", { class: "eingabe", lang: "fr", placeholder: "Dein Name …", onchange: (e) => e.target.value.trim() && setze(w, e.target.value.trim()) });
        auswahl.replaceChildren(...liste.map((x) => el("button", { type: "button", class: "chip", lang: "fr", onclick: () => setze(w, x.fr) },
          x.symbol ? x.symbol + " " : "", x.fr, x.de !== x.fr && el("small", { lang: "de" }, x.de))), frei || "");
        auswahl.hidden = false;
      }
      function setze(w, wert) {
        w.wert = wert; w.span.textContent = wert; w.span.classList.add("gefuellt"); auswahl.hidden = true;
        const naechste = wahl.find((x) => !x.wert);
        if (naechste) oeffne(naechste); else { wahl.forEach((x) => x.span.classList.remove("dran")); fertigTest(); sprich(); }
      }
      const sprich = () => {
        if (!wahl.every((x) => x.wert)) return;
        let k = 0;
        const satzTeile = teile.map((t) => (/^\{\w+\}$/.test(t) ? { wert: wahl[k++].wert } : { text: t }));
        // 8.11.: echte Stimme (Jules oder Cécile) – Satzstücke und Chips einzeln aufgenommen, hintereinander gespielt; nur der getippte Name = Geräte-Stimme
        const db = (D.parleAudio || {})[parleStimme()] || {}, liste = [];
        for (const x of satzTeile) {
          const stueck = parleStueck(x.wert || x.text);
          if (!stueck) continue;
          if (db[stueck]) liste.push(db[stueck]);
          else if (x.wert) liste.push({ tts: x.wert });
          else return spiele([{ tts: satzTeile.map((y) => y.wert || y.text).join("") }]);   // Satzstück fehlt: ganzer Satz mit Geräte-Stimme
        }
        spiele(liste, 40);
      };
      saetze.push(wahl);
      return el("div", { class: "parle-karte" }, satz, auswahl, el("div", { class: "knopfreihe" }, knopf("🔊 Hören", sprich), el("span", { class: "klein" }, "… und sag es laut!")));
    });
    function fertigTest() { if (saetze.every((w) => w.every((x) => x.wert))) { melde(box, "gut", "Super ! Jetzt sag alle Sätze laut – am besten zu zweit."); schrittFertig(d, 5); } }
    const stimmWahl = el("div", { class: "knopfreihe stimm-wahl" }, el("span", { class: "klein" }, "Stimme:"),
      PARLE_STIMMEN.map(([id, name]) => knopf(name, () => { stand.parleStimme = id; speichern(); stimmWahl.querySelectorAll("button").forEach((b, i) => b.classList.toggle("haupt", PARLE_STIMMEN[i][0] === id)); }, parleStimme() === id ? "haupt" : "leise")));
    zeige(kopf(d.titel, () => dialogSeite(d), "5. Parle de toi – tipp die Lücke an und wähl dein Wort."),
      stimmWahl, el("section", { class: "satzkarte" }, karten, box), weiterLeiste(d, 5));
    const erste = saetze[0] && saetze[0][0];
    if (erste) erste.span.click();
  }

  /* ---------- 🗣️ Prononciation ---------- */
  function namenStufe(n) { return stand.namen[n.id] || 0; }
  function prononciation() {
    zeige(kopf("🗣️ Prononciation", startseite, "Namen französisch aussprechen. Die fette Silbe ist betont – im Französischen immer die letzte."),
      el("nav", { class: "kacheln" }, Object.entries(D.gruppen).map(([g, titel]) => {
        const l = D.namen.filter((n) => n.gruppe === g), f = l.filter((n) => namenStufe(n) >= 1).length;
        return kachel(titel.split(" ")[0], titel.split(" ").slice(1).join(" "), `${f}/${l.length} geschafft`, () => namenGruppe(g), f === l.length ? " erledigt" : "");
      })));
  }
  function namenGruppe(g, stufe) {
    stufe = stufe || stand.stufe || 1;
    const l = D.namen.filter((n) => n.gruppe === g);
    zeige(kopf(D.gruppen[g], prononciation, stufe === 1 ? "Niveau 1: hören und nachsprechen." : "Niveau 2: erst selbst sagen, dann kontrollieren."),
      el("div", { class: "knopfreihe", role: "group", "aria-label": "Niveau" },
        knopf("Niveau 1 · Écoute", () => { stand.stufe = 1; speichern(); namenGruppe(g, 1); }, stufe === 1 ? "haupt" : ""),
        knopf("Niveau 2 · Sans modèle", () => { stand.stufe = 2; speichern(); namenGruppe(g, 2); }, stufe === 2 ? "haupt" : ""),
        knopf("▶ Alle der Reihe nach", () => namenKarte(l, 0, stufe))),
      el("div", { class: "namen-raster" }, l.map((n, i) => el("button", { type: "button", class: "namen-knopf" + (namenStufe(n) >= 2 ? " gold" : namenStufe(n) ? " erledigt" : ""), onclick: () => namenKarte(l, i, stufe) },
        bild(n, 72), el("span", { lang: "fr" }, n.name), namenStufe(n) ? el("span", { class: "haken", "aria-hidden": "true" }, namenStufe(n) >= 2 ? "✓✓" : "✓") : null))));
  }
  function namenKarte(l, i, stufe) {
    const n = l[i], du = jetztDu(stufe === 1 ? "À toi ! Sprich nach." : "Sag den Namen zuerst selbst!");
    const weiter = knopf(i + 1 < l.length ? "Weiter ➜" : "Fertig ✓", () => (i + 1 < l.length ? namenKarte(l, i + 1, stufe) : namenGruppe(n.gruppe, stufe)), "haupt");
    const kontrolle = knopf("🔊 Kontrolle", () => spiele([ton(n)]).then(geschafft));
    weiter.disabled = true; kontrolle.hidden = stufe === 1;
    function geschafft() {
      weiter.disabled = false;
      if (namenStufe(n) < stufe) { stand.namen[n.id] = stufe; speichern(); punkte(2, stufe === 2 ? `${n.name} ohne Vorbild!` : `${n.name} 🏛️`); }
    }
    zeige(kopf(D.gruppen[n.gruppe], () => namenGruppe(n.gruppe, stufe), `Niveau ${stufe} · ${i + 1}/${l.length}`),
      el("section", { class: "satzkarte namen-karte" }, bild(n, 180),
        el("h2", { lang: "fr", class: "name-gross" }, n.name),
        el("p", { class: "lese-gross" }, lesehilfe(n)),
        el("p", { class: "klein" }, el("span", { lang: "fr" }, n.stichwort), " – ", n.de),
        n.quelle && el("p", { class: "quelle" }, "Bild: " + n.quelle),
        du, el("div", { class: "knopfreihe" }, knopf("🔊 Hören", () => spiele([ton(n)])), kontrolle, weiter)));
    if (stufe === 1) spiele([ton(n)]).then((t) => t !== null && balken(du, Math.max(2, t + 1)).then(geschafft));
    else balken(du, 3).then(() => { kontrolle.focus(); });
  }
  // Bilder: Fußballer gezeichnet (Trikot mit Nummer, kein Logo), Persönlichkeiten mit gemeinfreiem Bild (falls geladen), sonst Initialen; Orte als Pin
  function bild(n, px) {
    if (n.foto) return el("img", { class: "namen-bild", src: n.foto, alt: "", width: px, height: px, loading: "lazy" });
    const svg = (inhalt) => { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", "0 0 100 100"); s.setAttribute("width", px); s.setAttribute("height", px); s.setAttribute("class", "namen-bild"); s.setAttribute("aria-hidden", "true"); s.innerHTML = inhalt; return s; };
    if (n.bild.startsWith("trikot:")) {
      const nr = n.bild.split(":")[1], nach = n.name.split(" ").slice(-1)[0].toUpperCase();
      return svg(`<rect width="100" height="100" rx="18" fill="#dfe9f7"/><path d="M30 18 L42 14 Q50 22 58 14 L70 18 L88 32 L80 46 L72 40 L72 88 L28 88 L28 40 L20 46 L12 32 Z" fill="#1d3a75" stroke="#0f1f45" stroke-width="2"/>
        <path d="M42 14 Q50 22 58 14" fill="none" stroke="#fff" stroke-width="3"/><rect x="28" y="80" width="44" height="3" fill="#ef4135"/>
        <text x="50" y="42" text-anchor="middle" font-family="Fredoka,sans-serif" font-size="${nach.length > 9 ? 7 : 9}" fill="#fff">${nach}</text>
        <text x="50" y="72" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="600" font-size="28" fill="#fff">${nr}</text>`);
    }
    if (n.bild === "ort") return svg(`<rect width="100" height="100" rx="18" fill="#e3f5ea"/><path d="M10 70 Q30 55 50 68 T90 62 L90 90 L10 90 Z" fill="#9ccf8f"/>
      <path d="M50 18 a18 18 0 0 1 18 18 c0 14 -18 34 -18 34 s-18 -20 -18 -34 a18 18 0 0 1 18 -18z" fill="#ef4135"/><circle cx="50" cy="36" r="7" fill="#fff"/>`);
    const ini = n.name.replace(/^(Les|Le|La) /, "").split(/[ -]/).filter((w) => /^[A-ZÀ-Ý]/.test(w)).slice(0, 2).map((w) => w[0]).join("");
    const farbe = ["#0055a4", "#ef4135", "#7a4fd1", "#1d8a4e", "#c46a00"][n.id.length % 5];
    return svg(`<rect width="100" height="100" rx="18" fill="${farbe}"/><circle cx="50" cy="40" r="17" fill="#fff" opacity=".9"/><path d="M20 92 Q50 52 80 92Z" fill="#fff" opacity=".9"/>
      <text x="50" y="47" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="600" font-size="18" fill="${farbe}">${ini}</text>`);
  }

  /* ---------- 🏃 Paris Run (Stufe 4, 7.11.2026) ----------
     Runner-Engine (../runner.js, Welt „paris“) mit französischen Wörtern: Diamanten zeigen das Wort, Tore/Boss fragen „Welcher Diamant heißt …?“ (Deutsch → Französisch).
     Start nur mit Ticket aus der Boutique (7.11., 1 Ticket = 1 Lauf, auch Disco Run); geschafft = einmal am Tag +10 ⭐ wie die anderen Spiele. Die Figur kommt aus der Englisch-App (nur gelesen), sonst Standard.
     Gesammelte Paris-Helden springen als Cameos ein. Stimmen: Aufnahmen aus D.runner (Mr. Alex, Helden), fehlende spricht das Gerät (fr-FR). */
  const RUN_GRUPPEN = [
    { id: "hobby", name: "⚽ Hobbys", woerter: () => D.woerter.hobby || [] },
    { id: "adj", name: "🌈 Adjectifs", woerter: () => D.woerter.adj || [] },
    { id: "zahl", name: "🔢 Nombres", woerter: () => D.woerter.zahl || [] },
    { id: "wendungen", name: "💬 Wendungen", woerter: () => D.wendungen.filter((w) => w.fr.length <= 22) }];
  let runWahl = 0, runFrei = true, runKette = Promise.resolve();
  function runStand() { return stand.parisRun || (stand.parisRun = { gespielt: 0, geschafft: 0, beste: 0 }); }
  function runSkin() { try { return ((JSON.parse(localStorage.getItem("auffrischen-v1")) || {}).spiel || {}).skin || null; } catch (e) { return null; } }
  // Haupttexte nacheinander (warten) oder sofort (Boss); Wörter nur, wenn gerade nichts läuft
  function runSag(x, warten) {
    if (!warten) { runFrei = false; return spiele([x]).then(() => { runFrei = true; }); }
    runKette = runKette.then(() => { runFrei = false; return spiele([x]); }).then(() => { runFrei = true; });
    return runKette;
  }
  function parisRun() {
    const r = runStand(), g = RUN_GRUPPEN[runWahl], ws = g.woerter();
    if (discoOffen() && !stand.disco) { stand.disco = 1; speichern(); setTimeout(() => toast("🪩 Überraschung: Disco Run débloqué !"), 600); }   // wer den Paris Run schon vorher geschafft hat
    zeige(kopf("🏃 Paris Run", startseite, "Lauf zur Tour Eiffel! Sammle die Wörter, beantworte Monsieur Gaston."),
      el("section", { class: "satzkarte" },
        el("p", {}, "Tippen oder Leertaste = springen, länger halten = höher. Über Autos und Radfahrer springen, Kisten und Litfaßsäulen sind Stufen, in die Seine fällst du hinein. Mr. Alex ruft dir zu: « Saute ! » = Spring!, « Attention ! » = Achtung!, « Plus vite ! » = Schneller!, « À gauche ! » = Nach links (da kommt was von links)!"),
        el("p", { class: "klein" }, `🎮 ${r.gespielt} Spiele · ${r.geschafft} geschafft · 🦸 ${heldenFrei()} Helden helfen mit`),
        el("p", { class: "ticket-zeile" }, `🎟️ ${r.tickets || 0} Tickets · 🪙 ${stand.coins} Coins · ein Ticket = ein Lauf (${ticketPreis()} 🪙)`, " ", knopf("🛍️ Boutique", () => boutique(parisRun), "leise"))),
      el("section", { class: "satzkarte" },
        el("h2", {}, "Welche Wörter?"),
        el("div", { class: "reiter" }, RUN_GRUPPEN.map((x, i) => el("button", { type: "button", class: "reiter-knopf", "aria-selected": String(i === runWahl), onclick: () => { runWahl = i; parisRun(); } }, x.name))),
        el("p", { class: "klein", lang: "fr" }, ws.map((w) => w.fr).join(" · ")),
        el("div", { class: "knopfreihe" }, (r.tickets || 0) > 0 ? knopf("▶ Los geht's ! (🎟️ −1)", () => parisRunSpiel(ws), "haupt") : knopf(`🎟️ Ticket kaufen (${ticketPreis()} 🪙)`, () => boutique(parisRun), "haupt"),
          discoOffen() && knopf("🪩 Bonus : Disco Run", () => parisRunSpiel(ws, "disco_fr"), "leise"))));
  }
  /* 🪩 Disco Run (Bonus-Level, 7.11.2026, Idee C von Mr. Alex): gleiche Engine, Welt „disco_fr“ (Tanzfläche, DJ Funky Flamingo, Beat) mit denselben Wörtern.
     Einmalige Überraschung nach dem ersten geschafften Paris Run (stand.disco = 1, Feier am Ende des Laufs), danach Knopf auf der Paris-Run-Seite; Punkte wie der Paris Run (einmal am Tag +10 ⭐). */
  const DISCO_AB = 1;
  const discoOffen = () => (runStand().geschafft || 0) >= DISCO_AB;
  function parisRunSpiel(ws, welt = "paris") {
    const disco = welt === "disco_fr";
    if (!window.Runner || !window.Runner.start) { toast("Das Spiel ist noch nicht geladen."); return; }
    if (ws.length < 4) { toast("Zu wenige Wörter."); return; }
    const r = runStand();
    if (!(r.tickets > 0)) { toast("🎟️ Il te faut un ticket ! – Du brauchst ein Ticket aus der Boutique."); boutique(parisRun); return; }
    r.tickets--; r.gespielt++; speichern();
    const liste = mischen(ws).slice(0, 12), helden = mischen(D.helden.slice(0, heldenFrei())).slice(0, 3);
    const buehne = el("div", { class: "runner-buehne" });
    const abbruch = el("button", { type: "button", class: "runner-x", "aria-label": "Spiel abbrechen", onclick: () => {
      if (window.Runner.ueberspringen && window.Runner.ueberspringen()) return;
      window.Runner.stopp(); stopp(); document.body.classList.remove("runner-aktiv"); parisRun(); } }, "✕");   // (Paris und Disco)
    zeige(buehne, abbruch);
    document.body.classList.add("runner-aktiv");
    const tts = (text, o) => (o && o.audio) || { tts: text.replace(/\[[^\]]*\]\s*/g, "") };
    runFrei = true; runKette = Promise.resolve();
    window.Runner.start({
      wrapper: buehne, welt, titel: disco ? "Disco Run" : "Paris Run", skin: runSkin() || undefined,
      woerter: window.Runner.woerterAus(liste),
      cameos: helden.map((h) => ({ id: h.id, name: h.name, kraft: h.kraft })),
      audio: disco ? Object.assign({}, D.disco || {}, { alex: Object.assign({}, (D.runner || {}).alex, (D.disco || {}).alex) }) : D.runner || {},   // Disco: eigene Aufnahmen (D.disco), sonst Paris-Zurufe/Gerätestimme
      texte: { tor: (de) => `Welcher Diamant heißt „${de}“?`, frage: (de) => `„Was heißt ‚${de}‘ auf Französisch?“`, bossTitel: disco ? "DJ Funky Flamingo fragt …" : "Monsieur Gaston fragt …", bossHinweis: disco ? "Richtig = du gewinnst das Tanzduell, der Glitzervorhang geht auf. Falsch = ein Leben weg." : "Richtig = die goldene Grille geht auf. Falsch = ein Leben weg." , ...(disco ? { tuer: "Le rideau est ouvert – vas-y !" } : {}) },
      stimme: {
        wort: (j, o) => { const w = liste[j % liste.length]; if (!runFrei && !(o && o.warten)) return; runSag(w.audio || { tts: w.fr }, true); },
        boss: (text, o) => runSag(tts(text, o), false),
        ansage: (text, o) => runSag(tts(text, o), true),
        cameo: (text, id, o) => runSag(tts(text, o), true),
        alex: (text, key, o) => runSag(tts(text, o), true),
        erzaehler: (text, o) => runSag(tts(text, o), true),
        still: () => stopp(),
        beschaeftigt: () => !runFrei },
      onEnde: (e) => parisRunEnde(e, liste, welt),
    });
  }
  function parisRunEnde(e, liste, welt = "paris") {
    const disco = welt === "disco_fr", warOffen = discoOffen();
    window.Runner.stopp(); document.body.classList.remove("runner-aktiv");
    const r = runStand();
    let plus = "";
    if (e.geschafft) { r.geschafft++; r.beste = Math.max(r.beste || 0, e.diamanten); plus = spielPunkte(disco ? "discorun" : "parisrun"); }
    const discoNeu = !warOffen && discoOffen() && !stand.disco;   // Überraschung: Disco Run frei
    if (discoNeu) { stand.disco = 1; setTimeout(() => { toast("🪩 Disco Run débloqué !"); klang(true); }, 900); }
    speichern();
    const zu = e.alex && (e.alex.audio || { tts: e.alex.text });
    const endeText = disco ? "Bravo ! Tu es la star du disco !" : "Bravo ! Tu es à la tour Eiffel !";
    setTimeout(() => spiele([e.geschafft ? (!disco && D.runner && D.runner.ende) || { tts: endeText } : { tts: "Presque ! Encore une fois !" }, zu, discoNeu && { tts: "Surprise ! Le Disco Run est débloqué !" }].filter(Boolean)), 300);
    zeige(kopf(disco ? "🪩 Disco Run" : "🏃 Paris Run", parisRun),
      discoNeu && el("section", { class: "geschafft disco-feier" },
        el("h2", { lang: "fr" }, "🪩 Disco Run débloqué !"),
        el("p", {}, "Überraschung! Ein Bonus-Level ist frei: Tanzfläche, Discokugel und DJ Funky Flamingo. Du findest es auf der Paris-Run-Seite."),
        knopf("🪩 Jetzt tanzen !", () => parisRunSpiel(RUN_GRUPPEN[runWahl].woerter(), "disco_fr"), "haupt")),
      el("section", { class: e.geschafft ? "geschafft" : "satzkarte" },
        el("h2", { lang: "fr" }, e.geschafft ? (disco ? "🪩 " : "🗼 ") + endeText : "💤 Presque !"),
        el("p", {}, e.geschafft ? `Geschafft!${plus}` : "Keine Leben mehr – beim nächsten Mal klappt es!"),
        el("p", {}, `💎 ${e.diamanten} / ${e.max} · 🚪 ${e.toreRichtig} Tore richtig · ❤️ ${e.leben}` + (e.maxCombo > 0 ? ` · 🔥 ×${e.maxCombo}` : "")),
        el("h3", {}, "Deine Wörter"),
        el("ul", { class: "liste" }, liste.map((w) => el("li", {}, knopf(`🔊 ${w.fr}`, () => spiele([w.audio || { tts: w.fr }]), "leise"), ` – ${w.de}`))),
        el("div", { class: "knopfreihe" }, knopf("↻ Noch mal", () => parisRunSpiel(RUN_GRUPPEN[runWahl].woerter(), welt), "haupt"), knopf("🏠 Start", startseite))));
  }

  /* ---------- 🎮 Jeux ---------- */
  function spielPunkte(spiel) {
    if (stand.spiele[spiel] === heute()) return "";
    stand.spiele[spiel] = heute(); speichern(); punkte(10, "Spiel geschafft!");
    return " +10 ⭐";
  }
  function jeux() {
    zeige(kopf("🎮 Jeux", startseite, "Jeden Tag gibt es für jedes Spiel einmal Punkte."),
      el("nav", { class: "kacheln" },
        kachel("🃏", "Memory", "Wendung und Bedeutung finden", memory),
        kachel("👂", "Qui est-ce ?", "Hör den Namen, tipp das Bild an", quiEstCe),
        kachel("🔢", "Dans l'ordre", "Bring den Dialog in die richtige Reihenfolge", () => ordre()),
        kachel("🏃", "Paris Run", `Lauf zur Tour Eiffel · 🎟️ Ticket ${ticketPreis()} 🪙 (du hast ${runStand().tickets || 0})`, parisRun),
        kachel("🛍️", "Boutique", `🪙 ${stand.coins} Coins – Ticket und Rahmen`, () => boutique(jeux), " shop-kachel")));
  }

  /* ---------- 🛍️ Boutique (7.11., wie der Shop in Englisch 6): Artikel aus D.boutique; Ticket mehrfach kaufbar (1 Ticket = 1 Lauf), Rahmen einmal kaufen, dann anlegen.
     Die Sperre bei zu wenig Coins gilt in kaufe(), nicht nur am Knopf. */
  const ticketPreis = () => ((D.boutique || []).find((a) => a.ticket) || { preis: 150 }).preis;
  function kaufe(a, zurueck) {
    if (stand.coins < a.preis) { toast(`Il te manque ${a.preis - stand.coins} 🪙 – dir fehlen noch ${a.preis - stand.coins} Coins.`); return false; }
    stand.coins -= a.preis; stand.ausgegeben = (stand.ausgegeben || 0) + a.preis;
    if (a.ticket) runStand().tickets = (runStand().tickets || 0) + 1;
    else { if (!stand.gekauft.includes(a.id)) stand.gekauft.push(a.id); if (a.rahmen) stand.rahmen = a.rahmen; }
    speichern(); toast(`${a.symbol} Merci ! −${a.preis} 🪙`); klang(true);
    boutique(zurueck);
    return true;
  }
  function boutique(zurueck) {
    zurueck = typeof zurueck === "function" ? zurueck : startseite;
    const tickets = runStand().tickets || 0;
    const artikel = (a) => {
      const hat = stand.gekauft.includes(a.id), fehlt = a.preis - stand.coins;
      const kauf = () => knopf(fehlt > 0 ? `Noch ${fehlt} 🪙` : "Acheter · Kaufen", () => kaufe(a, zurueck), fehlt > 0 ? "leise" : "haupt");
      let k;
      if (a.ticket) k = el("div", { class: "knopfreihe ticket-reihe" }, el("span", { class: "shop-hinweis" }, `🎟️ ${tickets} Tickets`), kauf(), tickets > 0 && knopf("▶ Paris Run", parisRun));
      else if (hat) k = stand.rahmen === a.rahmen ? el("span", { class: "shop-hinweis ok" }, "✓ Angelegt") : knopf("Anlegen", () => { stand.rahmen = a.rahmen; speichern(); boutique(zurueck); });
      else if (a.verdient) k = el("span", { class: "shop-hinweis" }, a.verdient);
      else k = kauf();
      return el("div", { class: "shop-artikel" + (hat ? " gekauft" : "") + (a.rahmen ? " rahmen-" + a.rahmen : ""), "data-artikel": a.id },
        el("span", { class: "sym", "aria-hidden": "true" }, a.symbol), el("strong", { lang: "fr" }, a.name), a.unter && el("span", { class: "unter" }, a.unter),
        a.verdient ? "" : el("span", { class: "preis" }, `🪙 ${a.preis}`), k);
    };
    zeige(kopf("🛍️ Boutique", zurueck, "Für 2 ⭐ gibt es 1 🪙. Deine Punkte bleiben – Coins gibst du hier aus."),
      el("section", { class: "satzkarte shop-stand" }, el("p", { class: "shop-coins" }, `🪙 ${stand.coins} Coins`)),
      el("div", { class: "shop-raster" }, (D.boutique || []).map(artikel)),
      el("div", { class: "knopfreihe" }, knopf("🏛️ Panthéon", pantheon)));
  }
  function titelKarte() {   // Titel-Schild im Panthéon: Titel (fr + de), Punkte, Coins, Fortschritt zum nächsten Titel
    const t = stand.titel, ti = D.titel[t], naechster = D.titel[t + 1];
    return el("section", { class: "satzkarte titel-karte" + rahmenKlasse() },
      el("p", { class: "klein" }, "Ton titre · Dein Titel"),
      el("h2", { lang: "fr" }, `${ti.symbol} ${ti.name}`), el("p", { class: "klein" }, ti.de),
      el("p", {}, `⭐ ${stand.punkte} Punkte`),
      el("p", { class: "coins-zeile" }, `🪙 Coins: ${stand.coins} · ausgegeben: ${stand.ausgegeben || 0}`, " ", knopf("🛍️ Boutique", () => boutique(pantheon), "leise")),
      naechster && el("div", { class: "fortschritt" }, el("span", { style: `width:${Math.round(100 * (stand.punkte - ti.ab) / (naechster.ab - ti.ab))}%` })),
      naechster && el("p", { class: "klein" }, `Noch ${naechster.ab - stand.punkte} ⭐ bis „${naechster.name}“ (${naechster.de})`));
  }
  function memory() {
    const paare = mischen(D.wendungen.filter((w, i, a) => a.findIndex((x) => x.de.toLowerCase() === w.de.toLowerCase()) === i)).slice(0, 6);
    const karten = mischen(paare.flatMap((p) => [{ p, art: "fr" }, { p, art: "de" }]));
    let offen = [], gefunden = 0, zuege = 0, wartet = false;
    const box = rueckmeldung(), zaehler = el("p", { class: "klein" }, "Züge: 0");
    const feld = el("div", { class: "memory gross" }, karten.map((c) => {
      const b = el("button", { type: "button", class: "mem-karte", "aria-label": "Verdeckte Karte", onclick: () => {
        if (wartet || b.classList.contains("auf")) return;
        b.classList.add("auf");
        const text = c.p[c.art];
        b.replaceChildren(el("span", { lang: c.art, class: text.length > 11 ? "mem-lang" : "" }, text));
        if (c.art === "fr") spiele([{ tts: text }]);
        offen.push({ b, c });
        if (offen.length < 2) return;
        zaehler.textContent = "Züge: " + ++zuege;
        const [x, y] = offen; offen = [];
        if (x.c.p === y.c.p) {
          x.b.classList.add("paar"); y.b.classList.add("paar"); x.b.disabled = y.b.disabled = true; klang(true);
          if (++gefunden === paare.length) melde(box, "gut", `${ruf("geschafft")} Alle Paare in ${zuege} Zügen!${spielPunkte("memory")}`);
        } else {
          wartet = true;
          setTimeout(() => { [x, y].forEach(({ b: k }) => { k.classList.remove("auf"); k.replaceChildren("?"); }); wartet = false; }, 1300);
        }
      } }, "?");
      return b;
    }));
    zeige(kopf("🃏 Memory", jeux, "Finde die Paare: Französisch und Deutsch."),
      el("section", { class: "satzkarte" }, feld, zaehler, box, el("div", { class: "knopfreihe" }, knopf("↻ Neu mischen", memory))));
  }
  function quiEstCe(runde = 0, richtig = 0) {
    const RUNDEN = 10;
    if (runde === RUNDEN) {
      return zeige(kopf("👂 Qui est-ce ?", jeux), el("section", { class: "satzkarte" },
        el("h2", {}, `${richtig} von ${RUNDEN} richtig!`), el("p", {}, richtig >= 7 ? ruf(richtig === RUNDEN ? "voll" : "stark") + spielPunkte("qui") : "Noch mal? Ab 7 Treffern gibt es Punkte."),
        el("div", { class: "knopfreihe" }, knopf("Noch mal", () => quiEstCe(), "haupt"), knopf("Andere Spiele", jeux))));
    }
    const pool = D.namen.filter((n) => n.gruppe !== "lieux"), ziel = zufall(pool);
    const wahl = mischen([ziel, ...mischen(pool.filter((n) => n !== ziel)).slice(0, 3)]);
    const box = rueckmeldung();
    let fertig = false;
    zeige(kopf("👂 Qui est-ce ?", jeux, `Runde ${runde + 1}/${RUNDEN} · ${richtig} richtig`),
      el("section", { class: "satzkarte" }, knopf("🔊 Noch mal hören", () => spiele([ton(ziel)])),
        el("div", { class: "namen-raster" }, wahl.map((n) => el("button", { type: "button", class: "namen-knopf", onclick: (e) => {
          if (fertig) return;
          fertig = true;
          const gut = n === ziel;
          e.currentTarget.classList.add(gut ? "gold" : "falsch"); klang(gut);
          melde(box, gut ? "gut" : "hilfe", gut ? lob() : `${tadel(true)} Das war ${ziel.name}.`);
          setTimeout(() => quiEstCe(runde + 1, richtig + (gut ? 1 : 0)), gut ? 900 : 2200);
        } }, bild(n, 72), el("span", { lang: "fr" }, n.name)))), box));
    spiele([ton(ziel)]);
  }
  function ordre(d) {
    d = d || zufall(D.dialoge);
    const zeilen = d.zeilen.slice(0, 6);
    let pos = 0;
    const box = rueckmeldung(), liste = el("ol", { class: "ordre-liste", lang: "fr" });
    const knoepfe = el("div", { class: "wortkasten" }, mischen(zeilen).map((z) => {
      const b = el("button", { type: "button", class: "chip", lang: "fr", onclick: () => {
        if (z === zeilen[pos] || ohneKlammern(z.fr) === ohneKlammern(zeilen[pos].fr)) {
          pos++; b.remove(); liste.append(el("li", {}, `${z.wer}: ${ohneKlammern(z.fr)}`)); klang(true); spiele([ton(z)]);
          if (pos === zeilen.length) melde(box, "gut", `${ruf("geschafft")} Richtig sortiert!${spielPunkte("ordre")}`);
        } else { b.classList.remove("falsch"); void b.offsetWidth; b.classList.add("falsch");  klang(false); melde(box, "hilfe", tadel(true)); }
      } }, ohneKlammern(z.fr));
      return b;
    }));
    zeige(kopf("🔢 Dans l'ordre", jeux, `„${d.titel}“ – tipp die Zeilen in der richtigen Reihenfolge an.`),
      el("section", { class: "satzkarte" }, liste, knoepfe, box, el("div", { class: "knopfreihe" }, knopf("Anderer Dialog", () => ordre()))));
  }

  /* ---------- 🎧 Beat-Studio ---------- */
  function beatStudio() {
    zeige(kopf("🎧 Beat-Studio", startseite, "Hör zu und mach mit – Mr. Alex auf dem Beat. Hier gibt es keine Punkte, nur Spaß."),
      D.beats.map((b) => el("section", { class: "satzkarte beat" },
        el("h2", { lang: "fr" }, "🎵 " + b.titel), el("p", { class: "klein" }, b.unter),
        el("audio", { controls: true, preload: "none", src: b.audio, onplay: () => stopp() }),
        b.text ? el("pre", { class: "mitlauf", lang: "fr" }, b.text) : el("p", { class: "klein" }, "Mitlauftext folgt."))));
  }


  /* ---------- 🗼 Paris (Stufe 2, 7.11.2026) ----------
     Karte wie der London-Plan in Englisch 6: Orte schalten sich mit Punkten frei; je Ort ein kleiner Film (Runner.szene aus ../runner.js,
     dieselbe Engine wie London Run), Mr. Alex spricht den Text, am Ende ein kleines Foto (falls vorhanden), danach der Text fr/de zum Nachlesen. */
  const hatFilm = (o) => !!(o && window.Runner && window.Runner.hatSzene && window.Runner.hatSzene(o.id));
  function parisFilm(o, fertig) {
    if (!hatFilm(o)) { if (fertig) fertig(); return false; }
    stopp();
    const sz = window.Runner.szene(null, o.id, { text: o.fr, textDe: o.de, lang: "fr", titel: `${o.symbol} ${o.name} · Paris`, foto: o.foto, quelle: o.quelle,
      voice: () => spiele([ton(o)]), voiceStopp: stopp, voiceAudio: () => aktuell, onEnde: () => { if (fertig) fertig(); } });
    if (!sz && fertig) fertig();
    return !!sz;
  }
  function parisNeu() { // neu freigeschaltete Orte (danach Helden) nacheinander mit Film zeigen, danach zählen sie als gesehen
    if (document.querySelector(".ortszene")) return;
    if (parisFrei() <= stand.paris) return heldNeu();
    const o = D.paris[stand.paris];
    stand.paris++; speichern();
    toast(`🗼 ${o.name} – freigeschaltet !`);
    if (!parisFilm(o, () => setTimeout(parisNeu, 400))) setTimeout(parisNeu, 400);
  }
  /* ---------- 🦸 Super-héros (Stufe 3, 7.11.2026) ----------
     10 Paris-Helden, gezeichnet in der Runner-Engine (Spielgrafik wie Englisch 6), je ein Film am Lieblingsort mit eigener Stimme; Sammelkarte = Runner.heldKarteZeichnen. */
  /* Folien-Karten (7.11.2026, Mr. Alex, große Version, angepasst an die Französisch-App ohne Runner):
     stand.karten[id] = { s, c, f, t, d } – s 0 normal · 1 Bronze · 2 Silber · 3 Gold; c = wie oft erlebt, f = fehlerfreie Défis ab Silber (je Tag einer), t = Tag des letzten gezählten Défis, d = Tag des letzten Aufstiegs.
     Bronze = Held 3× erlebt (Film bis zum Ende geschaut oder Défi gespielt) · Silber = Défi des Helden fehlerfrei (Wendung, Kraft, Lieblingsort)
     · Gold = danach je Tag ein fehlerfreies Défi mit „goldenem Moment“ 1:15 (seltene Helden 1:30) oder sicher nach 3 fehlerfreien Défis an verschiedenen Tagen.
     Höchstens ein Aufstieg je Held und Tag. Seltene Helden (Spalte selten in helden.tsv): ✦ RARE, Sammelwert ×2. Keine Punkte für Défis (die Karte ist der Lohn). */
  const KARTE = { erlebt: 3, chance: 15, chanceSelten: 30, fleiss: 3, namen: ["", "Bronze", "Silber", "Gold"], symbol: ["", "🥉", "🥈", "🥇"] };
  function karteVon(id) {
    const ks = (stand.karten = stand.karten && typeof stand.karten === "object" ? stand.karten : {});
    return ks[id] || (ks[id] = { s: 0, c: 0, f: 0, t: "", d: "" });
  }
  const gesammelt = () => D.helden.slice(0, heldenFrei());
  const sammelwert = () => gesammelt().reduce((n, h) => n + (h.selten ? 2 : 1), 0);
  const ortVon = (h) => D.paris.find((o) => o.id === h.ort);
  function karteZiel(h) {   // nächstes Ziel als kurzer Hinweis (Deutsch, wie die übrigen Hilfen)
    const k = karteVon(h.id), vor = h.name.split(" ")[0];
    if (k.s === 0) return `🥉 ${Math.min(k.c, KARTE.erlebt)}/${KARTE.erlebt}× erlebt (Film oder Défi)`;
    if (k.s === 1) return `🥈 Défi mit ${vor} ohne Fehler`;
    if (k.s === 2) return `🥇 Goldener Moment – oder ${Math.min(k.f, KARTE.fleiss)}/${KARTE.fleiss} Défis ohne Fehler (an verschiedenen Tagen)`;
    return "🥇 Gold !";
  }
  // erlebt = Film bis zum Ende oder Défi gespielt; fehlerfrei = Défi ohne Fehler. Gibt die neue Stufe zurück (oder 0) und zeigt die Enthüllung.
  function karteAuswerten(h, fehlerfrei, danach) {
    if (!gesammelt().includes(h)) { if (danach) danach(); return 0; }
    const k = karteVon(h.id), vorher = k.s, tag = heute(), frei = k.d !== tag;
    let moment = false;
    k.c++;
    if (k.s === 0 && k.c >= KARTE.erlebt && frei) k.s = 1;
    else if (k.s === 1 && fehlerfrei && frei) k.s = 2;
    else if (k.s === 2 && fehlerfrei && k.t !== tag) {   // je Tag zählt ein Défi (kein Farmen der Gold-Chance)
      k.t = tag; k.f++;
      moment = frei && Math.random() * (h.selten ? KARTE.chanceSelten : KARTE.chance) < 1;
      if (frei && (moment || k.f >= KARTE.fleiss)) k.s = 3;
    }
    if (k.s > vorher) { k.d = tag; if (k.s === 3) k.m = moment ? 1 : 0; }
    speichern();
    if (k.s > vorher) karteEnthuellen(h, k.s, moment && k.s === 3, danach); else if (danach) danach();
    return k.s > vorher ? k.s : 0;
  }
  // Karte als Canvas (Metallrahmen, Plakette, ✦ RARE) – mit Stufe wandert ein Lichtreflex darüber (Zeit bzw. Neigen des Handys)
  const KARTE_PX = 360;
  function karteCanvas(h, o = {}) {
    const st = o.gesperrt ? 0 : (o.stufe == null ? karteVon(h.id).s : o.stufe);
    const cv = el("canvas", { width: KARTE_PX, height: KARTE_PX * 4 / 3, role: "img", "aria-label": o.gesperrt ? "Noch nicht gesammelt" : `${h.name}: ${h.kraft}${st ? " · " + KARTE.namen[st] : ""}${h.selten ? " · selten" : ""}` });
    try { window.Runner.heldKarteZeichnen(cv.getContext("2d"), 0, 0, KARTE_PX, { id: h.id, name: h.name, kraft: h.kraft },
      { gesperrt: !!o.gesperrt, hinweis: o.gesperrt ? "3 jours de suite" : null, stufe: st, selten: !o.gesperrt && h.selten }); } catch (e) { /* Karte bleibt leer */ }
    if (st && window.Runner && window.Runner.heldKarteGlanz) glanzDazu(cv, st);
    return cv;
  }
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
    glanzKarten.forEach((g) => {
      if (!g.cv.isConnected) { if (g.gesehen) glanzKarten.delete(g); return; }   // erst nach dem Einhängen zählen
      g.gesehen = true;
      glanzMalen(g, ms / (g.stufe === 3 ? 3200 : 4200) + g.versatz + neigung * 0.35);
    });
    if (glanzKarten.size) requestAnimationFrame(glanzBild); else glanzLaeuft = false;
  }
  const karteBild = (h, gesperrt) => { try { return window.Runner.heldKarteBild({ id: h.id, name: h.name, kraft: h.kraft },
    { breite: 240, gesperrt, hinweis: gesperrt ? "3 jours de suite" : null, stufe: gesperrt ? 0 : karteVon(h.id).s, selten: !gesperrt && h.selten }); } catch (e) { return ""; } };
  function heldFilm(h, fertig) {
    if (!(window.Runner && window.Runner.hatSzene && window.Runner.hatSzene("held_" + h.id))) { if (fertig) fertig(); return false; }
    stopp();
    const sz = window.Runner.szene(null, "held_" + h.id, { text: h.intro, textDe: h.intro_de, lang: "fr", titel: `🦸 ${h.name}`, foto: karteBild(h), quelle: `${h.name} · ${h.kraft} (${h.kraft_de})`,
      voice: () => spiele([h.audio || { tts: h.intro }]), voiceStopp: stopp, voiceAudio: () => aktuell,
      onEnde: (r) => { if (r && r.uebersprungen) { if (fertig) fertig(); } else karteAuswerten(h, false, fertig); } });   // Folien-Karten: nur ganz geschaute Filme zählen
    if (!sz && fertig) fertig();
    return !!sz;
  }
  function heldNeu() {
    if (heldenFrei() <= stand.helden || document.querySelector(".ortszene")) return;
    const h = D.helden[stand.helden];
    stand.helden++; speichern();
    toast(`🦸 ${h.name} – nouveau super-héros !`);
    if (!heldFilm(h, () => setTimeout(heldNeu, 400))) setTimeout(heldNeu, 400);
  }
  // Aufstieg: Karte dreht sich, Rahmen leuchtet (goldener Moment: Blitz), der Held spricht seine Vorstellung (vorhandene Aufnahme)
  function karteEnthuellen(h, st, moment, danach) {
    stopp();
    const d = el("dialog", { class: "feier", "aria-labelledby": "karte-titel" });
    const zu = () => { d.close(); };
    d.addEventListener("close", () => { stopp(); d.remove(); if (danach) setTimeout(danach, 300); else if (app.querySelector(".helden-hinweis")) heldenSeite(); });
    d.append(...[moment && el("div", { class: "karte-blitz", "aria-hidden": "true" }),
      el("p", { class: "feier-klein" }, moment ? "⚡ Moment doré ! (goldener Moment)" : `${KARTE.symbol[st]} Nouveau niveau ! (neue Stufe)`),
      el("h2", { id: "karte-titel", lang: "fr" }, `${h.name} : ${KARTE.namen[st]}`),
      el("div", { class: "karte-dreh" }, el("figure", { class: "heldenkarte gross stufe-" + st }, karteCanvas(h, { stufe: st }))),
      el("p", { class: "klein" }, st < 3 ? "Nächstes Ziel: " + karteZiel(h) : "Höchste Stufe – deine Karte glänzt in Gold !"),
      el("div", { class: "knopfreihe" }, h.audio && knopf("🔊 Écoute", () => spiele([h.audio])), knopf("Weiter ➜", zu, "haupt"))].filter(Boolean));
    document.body.append(d);
    try { d.showModal(); } catch (e) { d.setAttribute("open", ""); }
    if (h.audio) spiele([h.audio]);
  }
  /* Défi (Folien-Karten): drei kurze Fragen zum Helden, je 3 Antworten – Bedeutung seiner Wendung, seine Kraft, sein Lieblingsort in Paris.
     Ohne Fehler = Leistung für Silber/Gold; gespielt = einmal erlebt. */
  function defi(h) {
    const andere = (feld) => mischen(D.helden.filter((x) => x.id !== h.id && x[feld])).slice(0, 2);
    const ort = ortVon(h), orte = mischen(D.paris.filter((o) => o.id !== h.ort)).slice(0, 2);
    const fragen = mischen([
      { frage: `${h.name} sagt: « ${h.wendung} » – was bedeutet das?`, ton: { tts: h.wendung }, richtig: h.wendung_de, falsch: andere("wendung_de").map((x) => x.wendung_de), lang: "de" },
      { frage: `Welche Kraft hat ${h.name}? (Quel est son pouvoir ?)`, richtig: `${h.kraft} (${h.kraft_de})`, falsch: andere("kraft").map((x) => `${x.kraft} (${x.kraft_de})`), lang: "fr" },
      ort && { frage: `Wo ist ${h.name} in Paris zu Hause? (Où habite ${h.name.split(" ")[0]} ?)`, richtig: `${ort.symbol} ${ort.name}`, falsch: orte.map((o) => `${o.symbol} ${o.name}`), lang: "fr" },
    ].filter((f) => f && f.richtig && f.falsch.length === 2));
    let i = 0, fehler = 0;
    const frage = () => {
      if (i >= fragen.length) return ende();
      const f = fragen[i], box = rueckmeldung();
      let fertig = false;
      const wahl = (text, b) => {
        if (fertig) return;
        if (text === f.richtig) { fertig = true; b.classList.add("richtig"); klang(true); melde(box, "gut", lob()); i++; setTimeout(frage, 900); }
        else { fehler++; b.classList.add("falsch"); b.disabled = true;  klang(false); melde(box, "hilfe", tadel(true)); }
      };
      zeige(kopf(`🦸 Défi · ${h.name}`, heldenSeite, `Frage ${i + 1}/${fragen.length} · ${karteZiel(h)}`),
        el("section", { class: "satzkarte" }, el("h2", {}, f.frage), f.ton && knopf("🔊 Écoute", () => spiele([f.ton]), "leise"),
          el("div", { class: "wahl defi-wahl" }, mischen([f.richtig, ...f.falsch]).map((t) => { const b = el("button", { type: "button", class: "knopf wahl-knopf", lang: f.lang }, t); b.addEventListener("click", () => wahl(t, b)); return b; })),
          box));
      if (f.ton) spiele([f.ton]);
    };
    const ende = () => karteAuswerten(h, fehler === 0, endeSeite);   // Aufstieg: erst die Enthüllung, danach die Ergebnisseite mit neuer Stufe
    const endeSeite = () => {
      const ohne = fehler === 0;
      zeige(kopf(`🦸 Défi · ${h.name}`, heldenSeite, ohne ? "Ohne Fehler – parfait !" : `${fehler} Fehler – encore une fois ?`),
        el("section", { class: "satzkarte" }, el("div", { class: "heldenkarte gross stufe-" + karteVon(h.id).s }, karteCanvas(h)),
          el("div", { class: "knopfreihe" }, knopf("🔁 Encore", () => defi(h), "leise"), knopf("Weiter ➜", heldenSeite, "haupt"))));
    };
    frage();
  }
  const heldenRaster = () => el("div", { class: "helden-raster" }, D.helden.map((h, i) => {
    const frei = i < heldenFrei(), st = frei ? karteVon(h.id).s : 0;
    return el("div", { class: "held-feld" },
      el("button", { type: "button", class: "held-karte" + (frei ? "" : " gesperrt") + (st ? " stufe-" + st : ""), "aria-label": frei ? h.name : "Noch nicht gesammelt", onclick: frei ? () => heldFilm(h) : null, disabled: !frei },
        karteCanvas(h, { gesperrt: !frei }), frei && el("span", { class: "klein", lang: "fr" }, `« ${h.wendung} »`), frei && el("span", { class: "klein karten-ziel" }, karteZiel(h))),
      frei && knopf("🎯 Défi", () => defi(h), "leise"));
  }));
  const kartenZaehler = () => gesammelt().length > 0 && el("p", { class: "klein karten-zaehler" },
    [3, 2, 1].map((st) => `${KARTE.symbol[st]} ${gesammelt().filter((h) => karteVon(h.id).s === st).length} ${KARTE.namen[st]}`).join(" · ") + ` · ✦ Sammelwert ${sammelwert()}`);
  function heldenSeite() {
    zeige(kopf("🦸 Super-héros", pantheon, heldenFrei() < D.helden.length ? `${heldenFrei()}/${D.helden.length} gesammelt · ${heldHinweis()}` : "Alle Helden gesammelt – bravo !"),
      kartenZaehler(),
      el("p", { class: "klein helden-hinweis" }, "Tipp auf eine Karte: Der Held stellt sich vor. 🎯 Défi: drei Fragen zum Helden. Folien-Karten: Schau den Film ganz oder spiel das Défi – so steigt die Karte auf: Bronze, Silber, Gold. ✦ RARE-Helden zählen doppelt."),
      heldenRaster());
  }
  function parisKarte(frei, waehle) {
    const NS = "http://www.w3.org/2000/svg";
    const s = (tag, attrs, ...kinder) => { const e = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); kinder.forEach((k) => e.append(k)); return e; };
    const svg = s("svg", { viewBox: "0 0 400 200", class: "london", role: "img", "aria-label": "Karte von Paris" });
    svg.append(
      s("rect", { x: 0, y: 0, width: 400, height: 200, rx: 12, class: "l-land" }),
      s("ellipse", { cx: 46, cy: 96, rx: 26, ry: 34, class: "l-park" }),        // Bois de Boulogne
      s("ellipse", { cx: 198, cy: 98, rx: 14, ry: 6, class: "l-park" }),        // Tuileries
      s("ellipse", { cx: 214, cy: 160, rx: 12, ry: 8, class: "l-park" }),       // Luxembourg
      s("ellipse", { cx: 118, cy: 156, rx: 9, ry: 16, class: "l-park" }),       // Champ-de-Mars
      s("path", { d: "M400,150 C360,148 320,140 290,134 C270,130 262,124 250,118 C232,108 214,104 196,104 C176,104 160,108 140,114 C118,120 100,128 84,140 C66,150 40,158 0,162", class: "l-fluss" }),
      s("ellipse", { cx: 254, cy: 120, rx: 11, ry: 4, class: "l-land", transform: "rotate(28 254 120)" }),   // Île de la Cité
      s("text", { x: 318, y: 156, class: "l-name" }, "La Seine"),
      s("text", { x: 12, y: 170, class: "l-name" }, "↙ Versailles"));
    D.paris.forEach((o, i) => {
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
  function parisSeite() {
    const frei = parisFrei();
    const fakt = el("section", { class: "karte paris-fakt", hidden: true });
    const faktZeigen = (o) => {
      fakt.hidden = false;
      fakt.replaceChildren(el("h2", { lang: "fr" }, `${o.symbol} ${o.name}`), el("p", { class: "paris-fr", lang: "fr" }, o.fr), el("p", { class: "klein" }, o.de),
        el("div", { class: "knopfreihe" }, knopf("🔊 Écoute", () => spiele([ton(o)])), hatFilm(o) && knopf("▶ Film", () => parisFilm(o), "leise")));
      fakt.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };
    zeige(kopf("🗼 Paris", pantheon, frei < D.paris.length ? `${frei}/${D.paris.length} Orte · ${restOrt()}` : `Alle ${D.paris.length} Orte freigeschaltet – bravo !`),
      parisKarte(frei, (o) => { fakt.hidden = true; if (!parisFilm(o, () => faktZeigen(o))) faktZeigen(o); }),
      el("p", { class: "klein" }, "Tipp auf einen Ort: kleiner Film mit Mr. Alex, danach der Text zum Nachlesen."),
      fakt,
      el("div", { class: "namen-raster" }, D.paris.map((o, i) => i < frei
        ? el("button", { type: "button", class: "namen-knopf gold", onclick: () => { if (!parisFilm(o, () => faktZeigen(o))) faktZeigen(o); } }, el("span", { class: "medaille", "aria-hidden": "true" }, o.symbol), el("span", { lang: "fr" }, o.name))
        : el("button", { type: "button", class: "namen-knopf gesperrt", disabled: true }, el("span", { class: "medaille", "aria-hidden": "true" }, "🔒"), el("span", {}, "?")))));
  }

  /* Frankreich-Karte (Niveau 2, 7.11.): 13 Régions mit echten Grenzen (regions.tsv: IGN Admin Express über france-geojson, Licence Ouverte, vereinfacht), Moselle-Orte in einer Lupe rechts.
     Régions mit offenem Ort werden farbig; Paris ist als Ausgangspunkt markiert. Tipp auf einen Ort: Text fr/de, Écoute (Aufnahme oder Gerätestimme). */
  function franceKarte(frei, waehle) {
    const NS = "http://www.w3.org/2000/svg";
    const s = (tag, attrs, ...kinder) => { const e = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); kinder.forEach((k) => e.append(k)); return e; };
    const offenR = new Set(D.france.slice(0, frei).map((o) => o.region));
    const svg = s("svg", { viewBox: "0 0 470 380", class: "london france", role: "img", "aria-label": "Karte von Frankreich mit 13 Régions" });
    svg.append(s("rect", { x: 0, y: 0, width: 470, height: 380, rx: 12, class: "f-meer" }));
    D.regions.forEach((r) => r.pfad && svg.append(s("path", { d: r.pfad, class: "f-region" + (offenR.has(r.id) ? " offen" : "") }, s("title", {}, r.name))));
    svg.append(s("text", { x: 10, y: 374, class: "f-name", "font-size": 6 }, "Carte : IGN Admin Express, Licence Ouverte"));
    D.regions.forEach((r) => r.pfad && svg.append(s("text", { x: r.lx, y: r.ly, class: "f-name", "text-anchor": "middle" },
      ...r.kurz.split("|").map((t, i) => s("tspan", { x: r.lx, dy: i ? 8 : 0 }, t)))));
    svg.append(s("rect", { x: 282, y: 79, width: 34, height: 20, rx: 3, class: "f-lupe-rand" }),   // Moselle auf der Karte → Lupe
      s("path", { d: "M316,82 L350,40 M316,96 L350,126", class: "f-lupe-linie" }),
      s("rect", { x: 350, y: 18, width: 112, height: 112, rx: 10, class: "f-lupe" }),
      s("text", { x: 356, y: 30, class: "f-name" }, "🔍 Moselle"),
      s("g", { class: "l-ort offen f-paris", transform: "translate(192 98)", role: "img", "aria-label": "Paris" }, s("circle", { r: 9 }), s("text", { y: 4, "text-anchor": "middle" }, "🗼")));
    D.france.forEach((o, i) => {
      const offen = i < frei;
      const g = s("g", { class: "l-ort" + (offen ? " offen" : ""), transform: `translate(${o.x} ${o.y})`, tabindex: offen ? 0 : -1,
        role: offen ? "button" : "img", "aria-label": offen ? o.name : "Noch nicht freigeschaltet" },
        s("circle", { r: 11 }), s("text", { y: 4.5, "text-anchor": "middle" }, offen ? o.symbol : "?"));
      if (offen) {
        g.addEventListener("click", () => waehle(o));
        g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); waehle(o); } });
      }
      svg.append(g);
    });
    return el("div", { class: "london-rahmen" }, svg);
  }
  function franceAbschnitt() {
    const frei = franceFrei(), n = D.france.length, parisFertig = parisFrei() >= D.paris.length;
    const fakt = el("section", { class: "karte paris-fakt", hidden: true });
    const region = (o) => (D.regions.find((r) => r.id === o.region) || {}).name;
    const zeigen = (o) => {
      fakt.hidden = false;
      fakt.replaceChildren(el("h2", { lang: "fr" }, `${o.symbol} ${o.name}`), region(o) && el("p", { class: "klein", lang: "fr" }, `📍 ${region(o)}`),
        el("p", { class: "paris-fr", lang: "fr" }, o.fr), el("p", { class: "klein" }, o.de),
        el("div", { class: "knopfreihe" }, knopf("🔊 Écoute", () => spiele([ton(o)]))));
      fakt.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };
    const info = !parisFertig ? `🔒 Erst alle ${D.paris.length} Paris-Orte freischalten, dann geht es in Frankreich weiter (ein Ort alle ${ORT_PUNKTE} ⭐).`
      : frei < n ? `${frei}/${n} Orte · ${restOrt()} · tipp auf einen Ort: Text zum Lesen und Hören.` : `Alle ${n} Orte freigeschaltet – bravo !`;
    return el("section", { class: "karte niveau2" }, el("h3", {}, "🇫🇷 La France · Niveau 2"),
      el("p", { class: "klein france-info" }, info),
      franceKarte(frei, zeigen),
      el("div", { class: "region-liste" }, D.france.map((o, i) => i < frei
        ? el("button", { type: "button", class: "chip offen", lang: "fr", onclick: () => zeigen(o) }, `${o.symbol} ${o.name}`)
        : el("span", { class: "chip gesperrt" }, "🔒 ?"))),
      fakt);
  }

  /* ---------- 🏛️ Panthéon ---------- */
  function wochenKarte() {   // 8.11. (wie Englisch 6): Mo–Fr-Zeile dieser Woche, Serie, Abzeichen
    const mo = montag(new Date()), heuteIso = tagIso(new Date());
    const woche = ["Lu", "Ma", "Me", "Je", "Ve"].map((name, i) => {
      const d = plusTage(mo, i), frei = !istSchultag(d), ok = !!stand.tage[tagIso(d)];
      return el("li", { class: (frei ? "frei" : ok ? "ok" : "") + (tagIso(d) === heuteIso ? " heute" : "") }, el("span", {}, name), el("b", {}, frei ? "–" : ok ? "🔥" : "○"));
    });
    const abz = [["🔥", "En feu", stand.feuer.length > 0], ["⭐", "Semaine parfaite", stand.wochen.length > 0], ["🏅", "5 × parfaite", stand.wochen.length >= 5],
      ["👑", "Mois parfait", stand.gekauft.includes("rahmen_gold")], ["🏖️", "Héros du week-end", stand.bonusTage.some((t) => [0, 6].includes(new Date(t + "T12:00").getDay()))],
      ["🌴", "Héros des vacances", stand.bonusTage.some((t) => ![0, 6].includes(new Date(t + "T12:00").getDay()))]];
    const n = serie();
    return el("section", { class: "satzkarte" },
      el("h2", {}, "📅 Ta semaine"),
      el("ul", { class: "wochenleiste" }, woche),
      el("p", { class: "klein" }, `🔥 ${n} Schultag${n === 1 ? "" : "e"} am Stück · ⭐ ${stand.wochen.length} perfekte Woche${stand.wochen.length === 1 ? "" : "n"} · alle 3 Schultage ein neuer Held, jeden Schultag der Woche = ⭐ +100, vier perfekte Wochen hintereinander = 👑 +200 und goldener Rahmen. Ferien und Feiertage zählen nicht – deine Serie bleibt. Wochenende/Ferien üben = Bonus.`),
      el("ul", { class: "abzeichen" }, abz.map(([sym, name, ok]) => el("li", { class: ok ? "ok" : "", title: name }, el("span", { "aria-hidden": "true" }, sym), el("small", { lang: "fr" }, name)))));
  }
  function pantheon() {   // Hall of Fame (7.11.): Paris-Karte oben, dann Niveau 2 (Frankreich-Karte), Super-héros, Stars, Dialogues
    const frei = parisFrei();
    const fakt = el("section", { class: "karte paris-fakt", hidden: true });
    const faktZeigen = (o) => {
      fakt.hidden = false;
      fakt.replaceChildren(el("h2", { lang: "fr" }, `${o.symbol} ${o.name}`), el("p", { class: "paris-fr", lang: "fr" }, o.fr), el("p", { class: "klein" }, o.de),
        el("div", { class: "knopfreihe" }, knopf("🔊 Écoute", () => spiele([ton(o)])), hatFilm(o) && knopf("▶ Film", () => parisFilm(o), "leise")));
      fakt.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };
    const ort = (o) => { fakt.hidden = true; if (!parisFilm(o, () => faktZeigen(o))) faktZeigen(o); };
    zeige(kopf("🏛️ Panthéon", startseite, "Deine Hall of Fame: Paris, Super-héros, Stars und Dialogues."),
      titelKarte(), wochenKarte(),
      el("h2", {}, "🗼 Paris"),
      el("p", { class: "klein" }, frei < D.paris.length ? `${frei}/${D.paris.length} Orte · ${restOrt()} · tipp auf einen Ort: kleiner Film, danach der Text.` : `Alle ${D.paris.length} Orte freigeschaltet – bravo !`),
      parisKarte(frei, ort),
      fakt,
      (D.regions || []).length && (D.france || []).length ? franceAbschnitt() : null,
      el("h2", {}, "🦸 Super-héros"),
      el("p", { class: "klein" }, heldenFrei() < D.helden.length ? `${heldenFrei()}/${D.helden.length} gesammelt · ${heldHinweis()} · tipp auf eine Karte: Vorstellung, Défi, Aufstieg.` : "Alle Helden gesammelt – bravo !"),
      kartenZaehler(), heldenRaster(),
      Object.entries(D.gruppen).map(([g, titel]) => [el("h2", {}, titel),
        g === "foot" && el("p", { class: "klein" }, (namenFrei() < NAMEN_REIHE.length ? `${namenFrei()}/${NAMEN_REIHE.length} Karten · ${restKarte()}` : "Alle Karten gesammelt – bravo !") + " · 🥇 Gold: Name in Prononciation auf Niveau 2 (sans modèle) sagen."),
        el("div", { class: "namen-raster" }, D.namen.filter((n) => n.gruppe === g).map((n) => {
          const s = namenStufe(n), reihe = NAMEN_REIHE.includes(n), offen = namenOffen(n);
          if (reihe && !offen) return el("button", { type: "button", class: "namen-knopf gesperrt", "aria-label": "Gesperrte Karte", onclick: () => toast(`🔒 ${restKarte()}`) },
            el("span", { class: "medaille", "aria-hidden": "true" }, "🔒"), el("span", {}, "?"));
          return el("button", { type: "button", class: "namen-knopf" + (s >= 2 ? " gold" : (reihe ? offen : s) ? "" : " gesperrt"), onclick: () => { const l = D.namen.filter((x) => x.gruppe === g); namenKarte(l, l.indexOf(n), s >= 1 ? 2 : 1); } },
            bild(n, 64), el("span", { lang: "fr" }, (reihe ? offen : s) ? n.name : "?"));
        }))]),
      el("h2", {}, "🏅 Dialogues"),
      el("div", { class: "namen-raster" }, D.dialoge.map((d) => {
        const n = schritteFertig(d);
        return el("button", { type: "button", class: "namen-knopf" + (n === SCHRITTE.length ? " gold" : n ? "" : " gesperrt"), onclick: () => dialogSeite(d) },
          el("span", { class: "medaille", "aria-hidden": "true" }, n === SCHRITTE.length ? "🏅" : n ? "💬" : "🔒"), el("span", { lang: "fr" }, d.titel), el("small", {}, `${n}/${SCHRITTE.length}`));
      })));
  }

  leiste();
  startseite();
})();
