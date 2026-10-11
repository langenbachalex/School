/* America with Mr. Alex – Klasse 9.3
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
  function laden() {
    try { return Object.assign({ erledigt: [], fragen: [], niveau: "G" }, JSON.parse(localStorage.getItem(SPEICHER) || "{}")); }
    catch (e) { return { erledigt: [], fragen: [], niveau: "G" }; }
  }
  function speichern() {
    try { localStorage.setItem(SPEICHER, JSON.stringify(stand)); } catch (e) { /* ohne Speicher geht es trotzdem */ }
  }
  const stand = laden();

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
  const zuletzt = {};
  let vorLob = null, fehlerSerie = 0;
  function ruf(art) {
    const liste = RUF[art] || [];
    if (!liste.length) return "";
    let i;
    do { i = Math.floor(Math.random() * liste.length); } while (liste.length > 1 && i === zuletzt[art]);
    zuletzt[art] = i;
    const r = liste[i];
    if (!leise && r.audio) {
      vorLob = r.audio;
      setTimeout(() => { if (vorLob === r.audio) { vorLob = null; spiele([r.audio]); } }, 0);
    }
    return r.text;
  }
  function lob() {
    const art = fehlerSerie >= 2 && RUF.doch ? "doch" : "lob";
    fehlerSerie = 0;
    return ruf(art);
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
      u.lang = "en-US"; u.rate = 0.9;
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
  function spiele(dateien) {
    if (leise) return Promise.resolve(null);
    if (vorLob) { dateien = [vorLob, ...dateien]; vorLob = null; }
    stopp();
    const meinLauf = lauf;
    let gesamt = 0;
    return dateien.filter(Boolean).reduce((kette, datei) => kette.then(() => new Promise((fertig) => {
      if (meinLauf !== lauf) return fertig();
      if (typeof datei === "object") return sprich(datei.text, datei.stimme).then((d) => { gesamt += d; fertig(); });
      const a = new Audio(datei);
      aktuell = a;
      a.onended = () => { gesamt += a.duration || 0; setTimeout(fertig, 350); };
      a.onerror = fertig;
      a.play().catch(fertig);
    })), Promise.resolve()).then(() => (meinLauf === lauf ? gesamt : null));
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
  function zeige(...inhalt) { stopp(); app.replaceChildren(...inhalt.filter(Boolean)); if (!leise) window.scrollTo(0, 0); }
  function mischen(liste) {
    const a = liste.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const kategorie = (nr) => D.kategorien.find((k) => k.nr === nr);
  const vokabel = (id) => D.vokabeln.find((v) => v.id === id);
  const knopf = (text, fn, art) => el("button", { class: "knopf" + (art ? " " + art : ""), onclick: fn }, text);
  const weiterKnopf = (fn) => knopf(T("Weiter ➜", "Next ➜"), fn || naechstes, "haupt weiter");
  // Ansage: im G-Kurs Englisch + Deutsch, im E-Kurs nur Englisch
  const ansage = (en, de) => el("div", { class: "ansage" }, el("p", { lang: "en" }, en), !E() && de && el("p", { class: "ansage-de", lang: "de" }, de));
  const tipp = (text, fn) => el("button", { class: "knopf leise tipp" , onclick: fn }, "💡 " + text);

  /* ---------- Startseite ---------- */
  function startseite() {
    lage = null; ansicht = startseite;
    zeige(
      el("header", { class: "gruss" },
        el("h1", { lang: "en" }, "Hi! Let's practise together."),
        el("p", { class: "klein" }, T("Wähl eine Kategorie. Oben rechts stellst du deinen Kurs ein: G oder E. Dein Mr. Alex",
          "Choose a category. Top right: choose your course, G or E. Your Mr. Alex"))),
      el("nav", { class: "kacheln raster9", "aria-label": T("Kategorien", "Categories") },
        D.kategorien.map((k) => {
          const fertig = stand.erledigt.includes(k.nr);
          return el("button", { class: "kachel" + (fertig ? " erledigt" : "") + (k.bald ? " bald" : "") + (k.farbe ? " " + k.farbe : ""),
            onclick: () => starteKategorie(k.nr), "aria-label": `${k.nr} ${k.titel}${k.bald ? T(" (kommt bald)", " (coming soon)") : ""}${fertig ? " ✓" : ""}` },
            el("span", { class: "sym", "aria-hidden": "true" }, k.symbol),
            el("span", { class: "titel", lang: "en" }, k.titel),
            el("span", { class: "unter" }, tx(k.unter)),
            k.bald && el("span", { class: "bald-schild" }, T("kommt bald", "coming soon")),
            fertig && el("span", { class: "haken", "aria-hidden": "true" }, "✓"));
        })),
      el("div", { class: "knopfreihe" }, knopf(T("✏️ Frage für meinen Lehrer", "✏️ Question for my teacher"), fragenOeffnen)));
  }

  function starteKategorie(nr) {
    const k = kategorie(nr);
    if (k.bald) return platzhalter(k);
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
    const ok = gruppenFertig(k.nr).includes(schluessel);
    return el("button", { class: "kachel" + (ok ? " erledigt" : ""), onclick,
      "aria-label": `${g.name}${ok ? " ✓" : ""}` },
      el("span", { class: "nr" }, nrText),
      el("span", { class: "titel", lang: "en" }, g.name),
      g.symbol && el("span", { class: "vorschau", "aria-hidden": "true" }, g.symbol),
      ok && el("span", { class: "haken", "aria-hidden": "true" }, "✓"));
  }

  function zeigeGruppen(k) {
    lage = null; ansicht = () => zeigeGruppen(k);
    zeige(kopf(k),
      ansage("Choose a topic.", "Wähl ein Thema."),
      el("nav", { class: "kacheln gruppen" }, k.gruppen.map((g, i) =>
        gruppenKachel(k, g, g.name, "Topic " + (i + 1), () => starteGruppe(k, i)))));
  }

  // Vocabulary: Unit wählen, dann Abschnitt
  function zeigeUnits(k) {
    lage = null; ansicht = () => zeigeUnits(k);
    const unit = stand.unit && D.units[stand.unit].length ? stand.unit : "2";
    const reiter = el("div", { class: "reiter", role: "tablist" }, Object.keys(D.units).map((u) =>
      el("button", { class: "reiter-knopf", role: "tab", "aria-selected": String(u === unit),
        onclick: () => { stand.unit = u; speichern(); zeigeUnits(k); } }, "Unit " + u)));
    const gruppen = D.units[unit];
    zeige(kopf(k), reiter,
      gruppen.length ? ansage("Choose a part of the unit. The words come in the same order as in your book.",
        "Wähl einen Abschnitt. Die Wörter kommen in derselben Reihenfolge wie im Buch.")
        : ansage("Coming soon!", "Diese Unit kommt bald."),
      el("nav", { class: "kacheln gruppen" }, gruppen.map((g, i) =>
        gruppenKachel(k, g, `u${unit}:${g.name}`, `${g.vokabeln.length} words`, () => starteUnitGruppe(k, unit, i)))));
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
  function teilZuruecksetzen() { lage.reihe = lage.vq = null; }

  function starteGruppe(k, i) {
    const g = k.gruppen[i];
    neueLage({ nr: k.nr, gruppe: g.name, titel: g.name, teile: teileVon(g.schritte), zurueckZu: () => zeigeGruppen(k) });
    zeigeTeil();
  }
  function starteUnitGruppe(k, unit, i) {
    const g = D.units[unit][i];
    const vok = g.vokabeln.map(vokabel);
    const schritte = [{ art: "vok_lernen", name: "Words" },
      { art: "lr", name: "Sentences", saetze: vok.map((v) => v.satz) }];
    if (vok.some((v) => v.def)) schritte.push({ art: "vok_def", name: "Find the word" });
    schritte.push({ art: "vok_abfrage", name: "EN → DE", richtung: "en_de" }, { art: "vok_abfrage", name: "DE → EN", richtung: "de_en" });
    neueLage({ nr: k.nr, gruppe: `u${unit}:${g.name}`, titel: `Unit ${unit} · ${g.name}`, vok, teile: teileVon(schritte),
      zurueckZu: () => zeigeUnits(k) });
    zeigeTeil();
  }

  /* ---------- Fortschritt pro Teil ---------- */
  function teilSchluessel(i) { return `${lage.nr}|${lage.gruppe}|${i}`; }
  function istFertig(i) { return !!(stand.teile && stand.teile[teilSchluessel(i)]); }
  function teilFertig(i) { stand.teile = stand.teile || {}; stand.teile[teilSchluessel(i)] = true; speichern(); }
  const alleTeileFertig = () => lage.teile.every((_, i) => istFertig(i));

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
      lage && sprungleiste());
  }

  function sprungleiste() {
    const nochNichts = !lage.teile.some((_, i) => istFertig(i));
    const ZIFFERN = ["①", "②", "③", "④"];
    const sprung = (i, text) => {
      const t = lage.teile[i], fertig = istFertig(i), jetzt = i === lage.teil && !lage.ende;
      const start = nochNichts && i === 0;
      return el("button", { class: "sprung" + (jetzt ? " jetzt" : "") + (fertig ? " fertig" : "") + (start ? " start" : ""),
        "aria-current": jetzt ? "step" : false, title: t.name,
        "aria-label": `${t.name}${fertig ? " ✓" : ""}${start ? T(" – hier starten", " – start here") : ""}`,
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
    const teil = lage.teile[lage.teil];
    ({ lr: zeigeSatz, erklaerung: zeigeErklaerung, verbform: zeigeVerbform, auswahl: zeigeAuswahl, bilder: zeigeBilder,
       vok_lernen: zeigeVokabel, vok_abfrage: zeigeAbfrage, vok_def: zeigeDefinition,
       beae_quiz: zeigeBeaeQuiz, hoeren: zeigeHoeren })[teil.art](teil);
    navErgaenzen();
  }
  function naechstes() {
    const teil = lage.teile[lage.teil];
    if (lage.pos + 1 < laenge(teil)) { lage.pos++; return zeigeTeil(); }
    teilFertig(lage.teil);
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

  function zwischenstand() {
    const k = kategorie(lage.nr), fertig = lage.teile[lage.teil];
    lage.abspielen = null;
    const text = lob();
    const weiter = () => { lage.teil++; lage.pos = 0; teilZuruecksetzen(); zeigeTeil(); };
    function zeigeZwischen() {
      lage.weiter = weiter;
      zeige(kopf(k), el("section", { class: "geschafft" },
        el("h2", { lang: "en" }, text),
        el("p", {}, T(`${fertig.name} geschafft!`, `${fertig.name}: done!`)),
        weiterKnopf(weiter)));
      navErgaenzen(() => zeigeTeil());
    }
    ansicht = zeigeZwischen;
    zeigeZwischen();
  }

  function fastGeschafft() {
    const k = kategorie(lage.nr);
    lage.ende = true; lage.abspielen = null; lage.weiter = null;
    const text = lob();
    const offen = lage.teile.map((t, i) => [t, i]).filter(([, i]) => !istFertig(i));
    const zeichne = () => zeige(kopf(k), el("section", { class: "geschafft" },
      el("h2", { lang: "en" }, text),
      ansage("Almost done! These parts are still missing:", "Fast geschafft! Diese Teile fehlen noch:"),
      el("div", { class: "knopfreihe" }, offen.map(([t, i]) => knopf(t.name, () => { lage.ende = false; springe(i); }))),
      knopf(T("Zur Startseite", "Back to start"), startseite)));
    ansicht = zeichne;
    zeichne();
  }

  function gruppeGeschafft() {
    const k = kategorie(lage.nr);
    stand.gruppen = stand.gruppen || {};
    const liste = (stand.gruppen[k.nr] = stand.gruppen[k.nr] || []);
    if (!liste.includes(lage.gruppe)) liste.push(lage.gruppe);
    const alleGruppen = k.vokabeln ? Object.entries(D.units).flatMap(([u, gs]) => gs.map((g) => `u${u}:${g.name}`))
      : k.gruppen.map((g) => g.name);
    const alle = alleGruppen.every((x) => liste.includes(x));
    if (alle && !stand.erledigt.includes(k.nr)) stand.erledigt.push(k.nr);
    speichern();
    const titel = lage.titel, zurueckZu = lage.zurueckZu;
    const text = alle ? ruf("geschafft") : lob();
    lage = null;
    const zeichne = () => zeige(kopf(k), el("section", { class: "geschafft" },
      el("h2", {}, T(`${titel} geschafft!`, `${titel}: done!`)),
      el("p", { class: "ansage", lang: "en" }, text),
      alle && el("p", { class: "ansage" }, T(`Die ganze Kategorie ${k.titel} ist geschafft. Du bist ein Superstar!`,
        `You finished the whole category ${k.titel}. You are a superstar!`)),
      el("div", { class: "knopfreihe" },
        knopf(T("Weitere Themen", "More topics"), zurueckZu, "haupt"), knopf(T("Zur Startseite", "Back to start"), startseite))));
    ansicht = zeichne;
    zeichne();
  }

  /* ---------- Bausteine ---------- */
  const karte = (zaehlerText, ...inhalt) =>
    el("section", { class: "satzkarte" }, zaehlerText && el("p", { class: "zaehler" }, zaehlerText), ...inhalt);
  const rueckmeldung = () => el("div", { class: "rueckmeldung", hidden: true, role: "status" });
  function melde(box, art, text) {
    if (art === "hilfe") { fehlerSerie++; text = `${ruf("fehler")} ${HILFE()} ${text}`; }
    box.hidden = false; box.className = "rueckmeldung " + art; box.textContent = text;
  }
  // Satz mit Lücke: art "voll" | "luecke" | "buchstabe" (erster Buchstabe jedes Lückenworts)
  function lueckenSatz(s, art, luecke) {
    const w = luecke || s.luecke;
    const i = w ? s.en.indexOf(w) : -1;
    if (i < 0) return [s.en];
    const mitte = art === "voll" ? el("strong", { class: "ziel" }, w)
      : el("span", { class: "luecke", "aria-label": T("Lücke", "gap") },
        art === "buchstabe" ? w.replace(/\S+/g, (x) => x[0] + x.slice(1).replace(/./g, "_")) : w.replace(/\S/g, "_"));
    return [s.en.slice(0, i), mitte, s.en.slice(i + w.length)];
  }
  function jetztDu() {
    return el("div", { class: "jetztdu", hidden: true, role: "status" }, T("Jetzt du! Sprich nach.", "Your turn! Say it."),
      el("span", { class: "balken", "aria-hidden": "true" }));
  }
  function nachsprechen(balken, ton) {
    balken.hidden = true;
    return spiele([].concat(ton)).then((d) => {
      if (d === null) return;
      balken.hidden = false; balken.classList.remove("laeuft"); void balken.offsetWidth;
      balken.style.setProperty("--dauer", Math.max(3, d * 1.4 + 1).toFixed(1) + "s");
      balken.classList.add("laeuft");
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
    const loesung = stufe > 1 ? knopf(T("Lösung", "Solution"), loesen) : null;
    const hilfen = el("div", { class: "knopfreihe" });
    if (stufe === 2 && s.luecke) hilfen.append(tipp(T("Noch einfacher: erster Buchstabe", "Easier: first letter"),
      (e) => { e.currentTarget.hidden = true; if (!geloest) en.replaceChildren(...lueckenSatz(s, "buchstabe")); }));
    if (stufe === 3) hilfen.append(tipp(T("Noch einfacher: Satz mit Lücke zeigen", "Easier: show the sentence with a gap"),
      (e) => { e.currentTarget.hidden = true; if (!geloest) en.replaceChildren(...lueckenSatz(s, s.luecke ? "buchstabe" : "luecke")); }));
    function loesen() {
      geloest = true; loesung.disabled = true; hilfen.hidden = true;
      en.replaceChildren(...lueckenSatz(s, "voll"));
      nachsprechen(balken, tonSatz(s));
    }
    lage.abspielen = () => {
      if (geloest) nachsprechen(balken, be ? [tonBE, tonSatz(s)] : tonSatz(s));
      else if (be) spiele([tonBE]); // erst nur britisch hören, dann selbst amerikanisch sagen
    };
    lage.weiter = naechstes;
    zeige(kopf(k),
      ansage(...(be ? STUFEN_BEAE : STUFEN)[stufe]),
      karte(T(`Satz ${lage.pos + 1} von ${teil.saetze.length}`, `Sentence ${lage.pos + 1} of ${teil.saetze.length}`),
        el("div", { class: "spalten" }, deSpalte, enSpalte),
        hilfen, balken,
        el("div", { class: "knopfreihe" }, knopf(T("🔊 Nochmal", "🔊 Again"), () => lage.abspielen()), loesung, weiterKnopf())));
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
    const weiter = weiterKnopf(); weiter.disabled = true;
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
          weiter.disabled = false; lage.weiter = naechstes; lage.abspielen = hoeren;
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
    const antworten = u.aufgaben.map(() => ({ was: null, wann: null }));
    let durchgaenge = 0, geloest = false;
    const norm = (t) => (t || "").toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ");
    const passt = (text, gruppen) => gruppen.every((alt) => alt.some((w) => norm(text).includes(w)));

    function umschalter(optionen, setze, label) {
      const knoepfe = optionen.map((o) => el("button", { class: "knopf wahl-knopf kompakt", lang: "en",
        "aria-pressed": "false", "data-wert": o.key, onclick: () => {
          if (geloest) return;
          setze(o.key);
          knoepfe.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.wert === o.key)));
        } }, o.symbol && el("span", { class: "wahl-sym", "aria-hidden": "true" }, o.symbol), el("span", {}, o.en)));
      return el("div", { class: "wahl", role: "group", "aria-label": label }, knoepfe);
    }
    const zeilen = u.aufgaben.map((a, i) => {
      const name = teilVon(a.teil).sprecher;
      const box = el("p", { class: "rueckmeldung", hidden: true });
      if (!E()) return el("li", { class: "hv-zeile" },
        el("h3", { lang: "en" }, el("span", { class: "hv-nr" }, i + 1 + ". "), name),
        el("p", { class: "klein" }, "What? – Was macht " + name + "?"),
        umschalter(u.was, (w) => { antworten[i].was = w; }, "What?"),
        el("p", { class: "klein" }, "When? – Wann?"),
        umschalter(u.wann, (w) => { antworten[i].wann = w; }, "When?"),
        box);
      const feld = (art, label) => el("input", { type: "text", class: "eingabe", lang: "en", autocomplete: "off",
        "aria-label": `${name}: ${label}`, placeholder: label, oninput: (e) => { antworten[i][art] = e.target.value; } });
      return el("li", { class: "hv-zeile" },
        el("h3", { lang: "en" }, el("span", { class: "hv-nr" }, i + 1 + ". "), name),
        el("div", { class: "hv-tabelle" }, feld("was", "What does " + name + " do?"), feld("wann", "When?")),
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
      const was = (key) => u.was.find((o) => o.key === key), wann = (key) => u.wann.find((o) => o.key === key);
      u.aufgaben.forEach((a, i) => {
        const zeile = zeilen[i], box = zeile.querySelector(".rueckmeldung");
        const ok = E() ? passt(antworten[i].was, a.was_e) && passt(antworten[i].wann, a.wann_e)
          : antworten[i].was === a.was && antworten[i].wann === a.wann;
        if (ok) richtig++;
        zeile.classList.add(ok ? "ok" : "falsch");
        box.hidden = false; box.className = "rueckmeldung " + (ok ? "gut" : "hilfe");
        const loesung = `${was(a.was).en} – ${wann(a.wann).en}`;
        box.textContent = ok ? T(`✓ Richtig! (${loesung})`, `✓ Correct! (${loesung})`) : `${HILFE()} ${T("Richtig ist:", "The answer is:")} ${loesung}.`;
        zeile.querySelectorAll(".wahl button").forEach((b) => { if (b.dataset.wert === a.was || b.dataset.wert === a.wann) b.classList.add("richtig"); });
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

  /* ---------- Erklärung ---------- */
  function zeigeErklaerung(teil) {
    const k = kategorie(lage.nr);
    const bloecke = teil.bloecke.map((b) => {
      if (b.typ === "text") return el("p", { class: "ansage" }, tx(b));
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
    const weiter = weiterKnopf(); weiter.disabled = true;
    const wahl = el("div", { class: "wahl", role: "group" },
      mischen([a.richtig, ...a.falsch]).map((form) => el("button", { class: "knopf wahl-knopf", lang: "en", onclick: (e) => {
        if (geloest) return;
        if (form === a.richtig) {
          geloest = true;
          e.currentTarget.classList.add("richtig");
          satz.replaceChildren(...lueckenSatz(s, "voll", luecke));
          melde(box, "gut", lob());
          weiter.disabled = false; lage.weiter = naechstes;
          spiele([tonSatz(s)]);
        } else {
          e.currentTarget.disabled = true;
          melde(box, "hilfe", `${tx(teil.hilfe)} ${NOCHMAL()}`);
        }
      } }, form)));
    lage.abspielen = () => { if (geloest) spiele([tonSatz(s)]); };
    zeige(kopf(k),
      ansage(...(E() ? [tx(teil.ansage)] : tx(teil.ansage).split(" – "))),
      karte(T(`Aufgabe ${lage.pos + 1} von ${lage.reihe.length}`, `Task ${lage.pos + 1} of ${lage.reihe.length}`),
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
    const weiter = weiterKnopf(); weiter.disabled = true;
    const hoeren = () => spiele([tonSatz(s)]);
    const wahl = el("div", { class: "wahl senkrecht", role: "group" }, optionen.map(({ o, richtig }) =>
      el("button", { class: "knopf wahl-knopf", onclick: (e) => {
        if (geloest) return;
        if (richtig) {
          geloest = true; e.currentTarget.classList.add("richtig");
          melde(box, "gut", lob()); weiter.disabled = false; lage.weiter = naechstes;
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
    const bilder = teil.bilder.filter((b) => !b.nur || b.nur === stand.niveau);
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
      el("span", { class: "bild-sym", "aria-hidden": "true" }, b.symbol),
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
    const abspielen = () => nachsprechen(balken, tonWort(v));
    lage.abspielen = abspielen; lage.weiter = naechstes;
    zeige(kopf(k), ansage("Let's learn the words! Listen and repeat.", "Lernen wir die Wörter! Hör zu und sprich nach."),
      karte(T(`Wort ${lage.pos + 1} von ${lage.vok.length}`, `Word ${lage.pos + 1} of ${lage.vok.length}`),
        el("div", { class: "vok" }, el("div", {}, el("p", { class: "vok-en", lang: "en" }, v.en), el("p", { class: "vok-de", lang: "de" }, v.de))),
        balken,
        el("div", { class: "knopfreihe" }, knopf(T("🔊 Nochmal", "🔊 Again"), abspielen), weiterKnopf())));
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
    const weiter = weiterKnopf(); weiter.disabled = true;
    const wortZeile = el("p", { class: "vok-en ziel-satz", lang: "en", hidden: true }, v.en);
    const geschafft = (knopfEl) => {
      geloest = true; if (knopfEl) knopfEl.classList.add("richtig");
      wortZeile.hidden = false; melde(box, "gut", lob());
      weiter.disabled = false; lage.weiter = naechstes; lage.abspielen = () => spiele([tonWort(v)]);
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
      knopf(T("✓ Gewusst", "✓ I knew it"), naechstes, "haupt weiter"),
      knopf(T("↻ Nochmal üben", "↻ Practise again"), () => { lage.vq.push(v.id); naechstes(); }));
    const loesung = knopf(T("Lösung", "Solution"), () => {
      loesung.hidden = true; antwort.hidden = false; bewerten.hidden = false; satzZeile.hidden = false;
      lage.abspielen = () => spiele([tonWort(v)]); lage.weiter = naechstes;
      lage.abspielen();
    }, "haupt");
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
    if (dlg.open || e.target.closest("textarea, input")) return;
    if (e.code === "Space" && lage && lage.abspielen) { e.preventDefault(); lage.abspielen(); }
    else if (e.code === "ArrowRight" && lage && lage.weiter) { e.preventDefault(); lage.weiter(); }
    else if (e.code === "ArrowLeft" && lage && !lage.ende) {
      const z = app.querySelector(".zurueck-knopf");
      if (z && !z.disabled) { e.preventDefault(); z.click(); }
    }
  });

  setzeNiveau(stand.niveau === "E" ? "E" : "G");
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
