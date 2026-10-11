/* Auffrischen mit Mr. Alex – Version 1
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
  const zuletzt = {};
  let vorLob = null, fehlerSerie = 0;
  function ruf(art) {
    const liste = RUF[art] || [];
    if (!liste.length) return "";
    let i;
    do { i = Math.floor(Math.random() * liste.length); } while (liste.length > 1 && i === zuletzt[art]);
    zuletzt[art] = i;
    const r = liste[i];
    // Das Audio wird vor das nächste spiele() gesetzt; folgt keins, spielt es allein.
    vorLob = r.audio;
    setTimeout(() => { if (vorLob === r.audio) { vorLob = null; spiele([r.audio]); } }, 0);
    return r.text;
  }
  function lob() {
    const art = fehlerSerie >= 2 && RUF.doch ? "doch" : "lob";
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
      u.rate = 0.9;
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
  function spiele(dateien) {
    if (vorLob) { dateien = [vorLob, ...dateien]; vorLob = null; }
    stopp();
    const meinLauf = lauf;
    let gesamt = 0;
    return dateien.filter(Boolean).reduce((kette, datei) => kette.then(() => new Promise((fertig) => {
      if (meinLauf !== lauf) return fertig();
      if (typeof datei === "object") return sprich(datei).then((d) => { gesamt += d; fertig(); });
      const a = new Audio(datei);
      aktuell = a;
      a.onended = () => { gesamt += a.duration || 0; setTimeout(fertig, 350); };
      a.onerror = fertig;
      a.play().catch(fertig);
    })), Promise.resolve()).then(() => (meinLauf === lauf ? gesamt : null));
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

  /* ---------- Startseite ---------- */
  function startseite() {
    lage = null;
    const alleFertig = D.stationen.every((s) => stand.erledigt.includes(s.nr));
    zeige(
      el("header", { class: "gruss" },
        el("h1", {}, "Hallo! Frischen wir zusammen auf!"),
        el("p", { class: "klein" }, "Wähl eine Station. Wenn du fertig bist, bekommt sie ein Häkchen. Dein Mr. Alex")),
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
      el("div", { class: "knopfreihe" }, knopf("✏️ Frage für Mr. Alex notieren", fragenOeffnen))
    );
  }

  /* ---------- Station ---------- */
  // Teile einer Station: ein Listen-and-Repeat-Schritt wird zu vier Teilen (Stufe 1–4).
  function teileVon(st) {
    const t = [];
    st.schritte.forEach((s) => {
      if (s.art === "lr") (s.stufen || [1, 2, 3, 4]).forEach((stufe) =>
        t.push({ art: "lr", stufe, saetze: s.saetze, name: (s.name ? s.name + " · " : "") + "Stufe " + stufe }));
      else t.push(s);
    });
    return t;
  }

  let lage = null; // { nr, teile, teil, pos (Position im Teil), reihe, vq, abspielen, weiter }

  function starteStation(nr) {
    const st = station(nr);
    if (st.gruppen) return zeigeGruppen(st);
    const t = teileVon(st);
    if (!t.length) return platzhalter(st);
    lage = { nr, teile: t, teil: 0, pos: 0 };
    zeigeTeil();
  }

  function kopf(st) {
    return el("header", { class: "kopf" },
      lage && lage.gruppe != null ? knopf(st.gruppen[0].vokabeln ? "← Abschnitte" : "← Themen", () => zeigeGruppen(st), "leise") : knopf("← Start", startseite, "leise"),
      el("h1", {}, `Station ${st.nr}: ${st.titel}` + (lage && lage.gruppe != null ? ` · ${st.gruppen[lage.gruppe].name}` : "")),
      lage && el("ol", { class: "schritte", "aria-label": "Schritte" },
        lage.teile.map((t, i) => el("li", { class: i === lage.teil ? "jetzt" : i < lage.teil ? "fertig" : "",
          "aria-current": i === lage.teil ? "step" : false }, t.name))));
  }

  function platzhalter(st) {
    lage = null;
    zeige(kopf(st), el("section", { class: "platzhalter" },
      el("p", { class: "ansage" }, "Diese Station baue ich gerade noch für dich. Schau bald wieder rein!"),
      knopf("Zur Startseite", startseite, "haupt")));
  }

  function zeigeTeil() {
    lage.abspielen = null; lage.weiter = null;
    const teil = lage.teile[lage.teil];
    ({ lr: zeigeSatz, erklaerung: zeigeErklaerung, verbform: zeigeVerbform, hoeren: zeigeHoeren,
       vok_lernen: zeigeVokabel, vok_luecke: zeigeVokabel, vok_abfrage: zeigeVokabel,
       auswahl: zeigeAuswahl, reihenfolge: zeigeReihenfolge, lesen: zeigeLesen, hoerwahl: zeigeHoerwahl,
       memory: zeigeMemory, detektiv: zeigeDetektiv })[teil.art](teil);
  }

  function naechstes() {
    const teil = lage.teile[lage.teil];
    if (lage.pos + 1 < laenge(teil)) { lage.pos++; return zeigeTeil(); }
    if (lage.teil + 1 < lage.teile.length) return zwischenstand();
    stationGeschafft();
  }
  function laenge(teil) {
    if (teil.art === "lr") return teil.saetze.length;
    if (teil.art === "verbform" || teil.art === "auswahl") return teil.aufgaben.length;
    if (teil.art === "hoerwahl") return lage.runden ? lage.runden.length : teil.paare.length * 2;
    if (teil.art === "detektiv") return teil.runden;
    if (teil.art === "vok_abfrage") return lage.vq ? lage.vq.length : lage.vok.length; // wächst bei „Nochmal üben“
    if (teil.art === "vok_lernen") return lage.vok.length;
    if (teil.art === "vok_luecke") return lage.vok.filter((v) => v.satz).length;
    return 1;
  }

  function zwischenstand() {
    const st = station(lage.nr);
    const fertig = lage.teile[lage.teil];
    lage.abspielen = null;
    lage.weiter = () => { lage.teil++; lage.pos = 0; zeigeTeil(); };
    zeige(kopf(st), el("section", { class: "geschafft" },
      el("h2", {}, lob()),
      el("p", {}, `${fertig.name} geschafft!`),
      knopf("Weiter ➜", lage.weiter, "haupt")));
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
    if (g.schritte) { // Thema mit eigenen Schritten (Neu erklärt)
      lage = { nr: st.nr, gruppe: i, teile: teileVon(g), teil: 0, pos: 0 };
      return zeigeTeil();
    }
    const vok = g.vokabeln.map((id) => D.vokabeln.find((v) => v.id === id));
    const t = st.schritte.filter((s) => s.art !== "vok_luecke" || vok.some((v) => v.satz));
    lage = { nr: st.nr, gruppe: i, vok, teile: t, teil: 0, pos: 0 };
    zeigeTeil();
  }

  function gruppeGeschafft() {
    const st = station(lage.nr), g = st.gruppen[lage.gruppe];
    stand.gruppen = stand.gruppen || {};
    const liste = (stand.gruppen[st.nr] = stand.gruppen[st.nr] || []);
    if (!liste.includes(g.name)) liste.push(g.name);
    const alle = st.gruppen.every((x) => liste.includes(x.name));
    if (alle && !stand.erledigt.includes(st.nr)) stand.erledigt.push(st.nr);
    speichern();
    lage = null;
    zeige(kopf(st), el("section", { class: "geschafft" },
      el("h2", {}, `${g.name} geschafft!`),
      el("p", { class: "ansage" }, alle ? `Station ${st.nr} geschafft! Du bist ein Superstar ${st.lob}!` : ""),
      el("p", { class: "ansage", lang: "en" }, alle ? ruf("geschafft") : lob()),
      el("div", { class: "knopfreihe" },
        knopf("Weitere Abschnitte", () => zeigeGruppen(st), "haupt"), knopf("Zur Startseite", startseite))));
  }

  function stationGeschafft() {
    if (lage.gruppe != null) return gruppeGeschafft();
    const st = station(lage.nr);
    if (!stand.erledigt.includes(st.nr)) { stand.erledigt.push(st.nr); speichern(); }
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
      fehlerSerie++;
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

    const loesung = stufe >= 3 ? knopf("Lösung", loesen) : null;

    zeige(kopf(st),
      el("p", { class: "ansage" }, STUFEN[stufe]),
      karte(teil, `Satz ${lage.pos + 1} von ${teil.saetze.length}`,
        hinweis && el("p", { class: "hinweis" }, hinweis),
        el("div", { class: "spalten" }, links, rechts),
        jetztdu,
        el("div", { class: "knopfreihe" }, knopf("🔊 Nochmal", abspielen), loesung, knopf("Weiter ➜", naechstes, "haupt"))));

    function englisch() {
      jetztdu.hidden = true;
      spiele(ss.map((s) => s.audio.en)).then((d) => {
        if (d === null) return;
        jetztdu.hidden = false;
        jetztdu.classList.remove("laeuft");
        void jetztdu.offsetWidth;
        jetztdu.style.setProperty("--dauer", Math.max(3, d * 1.4 + 1).toFixed(1) + "s");
        jetztdu.classList.add("laeuft");
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
    lage.weiter = naechstes;
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
    if (lage.pos === 0 || !lage.reihe) lage.reihe = mischen(teil.aufgaben);
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
    if (lage.pos === 0 || !lage.runden)
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
        el("div", { class: "knopfreihe" }, weiter, knopf("↻ Neu mischen", () => zeigeMemory(teil)))));
  }

  /* ---------- -s-Detektiv: fehlendes -s finden und reparieren (nur lesen) ---------- */
  function zeigeDetektiv(teil) {
    const st = station(lage.nr);
    if (lage.pos === 0 || !lage.detektiv) {
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
    if (teil.art === "vok_abfrage" && lage.pos === 0) lage.vq = mischen(lage.vok.map((v) => v.id));
    const v = teil.art === "vok_abfrage" ? lage.vok.find((x) => x.id === lage.vq[lage.pos])
      : teil.art === "vok_luecke" ? lage.vok.filter((x) => x.satz)[lage.pos] : lage.vok[lage.pos];
    const anzahl = laenge(teil);
    const bild = (sichtbar) => el("span", { class: "vok-bild", "aria-hidden": "true" }, sichtbar ? v.symbol : "❔");

    if (teil.art === "vok_lernen") {
      const jetztdu = el("div", { class: "jetztdu", hidden: true, role: "status" }, "Jetzt du! Sprich nach.",
        el("span", { class: "balken", "aria-hidden": "true" }));
      const abspielen = () => { jetztdu.hidden = true; spiele([v.audio.en]).then((d) => {
        if (d === null) return;
        jetztdu.hidden = false; jetztdu.classList.remove("laeuft"); void jetztdu.offsetWidth;
        jetztdu.style.setProperty("--dauer", Math.max(2.5, d * 1.4 + 1).toFixed(1) + "s"); jetztdu.classList.add("laeuft");
      }); };
      lage.abspielen = abspielen; lage.weiter = naechstes;
      zeige(kopf(st), el("p", { class: "ansage" }, "Lernen wir die Wörter! Hör zu und sprich nach."),
        karte(teil, `Wort ${lage.pos + 1} von ${anzahl}`,
          el("div", { class: "vok" }, bild(true),
            el("div", {}, el("p", { class: "vok-en", lang: "en" }, v.en), el("p", { class: "vok-de" }, v.de))),
          jetztdu,
          el("div", { class: "knopfreihe" }, knopf("🔊 Nochmal", abspielen), knopf("Weiter ➜", naechstes, "haupt"))));
      return abspielen();
    }

    if (teil.art === "vok_luecke") {
      const s = D.saetze[v.satz];
      const w = v.luecke, i = s.en.toLowerCase().indexOf(w.toLowerCase());
      const teileSatz = (luecke) => [s.en.slice(0, i), luecke
        ? el("span", { class: "luecke", "aria-label": "Lücke" }, w.replace(/./g, "_"))
        : el("strong", { class: "ziel" }, s.en.slice(i, i + w.length)), s.en.slice(i + w.length)];
      const satz = el("p", { class: "satz", lang: "en" }, teileSatz(true));
      let geloest = false;
      const loesung = knopf("Lösung", () => {
        geloest = true; loesung.disabled = true;
        satz.replaceChildren(...teileSatz(false));
        spiele([s.audio.en]);
      });
      lage.abspielen = () => { if (geloest) spiele([s.audio.en]); };
      lage.weiter = naechstes;
      zeige(kopf(st), el("p", { class: "ansage" }, "Welches Wort fehlt? Sag den ganzen Satz auf Englisch! Dann tipp auf „Lösung“."),
        karte(teil, `Satz ${lage.pos + 1} von ${anzahl}`,
          el("div", { class: "vok" }, bild(true), el("p", { class: "satz de" }, s.de)),
          satz,
          el("div", { class: "knopfreihe" }, knopf("🔊 Nochmal", () => lage.abspielen()), loesung, knopf("Weiter ➜", naechstes, "haupt"))));
      return lage.abspielen();
    }

    // Abfrage Englisch → Deutsch oder Deutsch → Englisch, mit Selbstkontrolle
    const enDe = teil.richtung === "en_de";
    const frage = enDe ? el("p", { class: "vok-en", lang: "en" }, v.en) : el("p", { class: "vok-en" }, v.de);
    const antwort = el("p", { class: "vok-de", lang: enDe ? "de" : "en", hidden: true }, enDe ? v.de : v.en);
    const bildPlatz = bild(false);
    const fragen = () => { if (enDe) spiele([v.audio.en]); };
    const bewerten = el("div", { class: "knopfreihe", hidden: true },
      knopf("✓ Gewusst", naechstes, "haupt"),
      knopf("↻ Nochmal üben", () => { lage.vq.push(v.id); naechstes(); }));
    const loesung = knopf("Lösung", () => {
      loesung.hidden = true; antwort.hidden = false; bewerten.hidden = false;
      bildPlatz.textContent = v.symbol;
      lage.abspielen = () => spiele([v.audio.en]);
      lage.weiter = naechstes;
      lage.abspielen();
    }, "haupt");
    lage.abspielen = fragen;
    zeige(kopf(st),
      el("p", { class: "ansage" }, enDe ? "Was heißt das auf Deutsch? Sag es laut! Dann tipp auf „Lösung“."
        : "Was heißt das auf Englisch? Sag es laut! Dann tipp auf „Lösung“."),
      karte(teil, `Wort ${lage.pos + 1} von ${lage.vq.length}`,
        el("div", { class: "vok" }, bildPlatz, el("div", {}, frage, antwort)),
        el("div", { class: "knopfreihe" }, knopf("🔊 Nochmal", () => lage.abspielen()), loesung),
        bewerten));
    fragen();
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
    if (dlg.open || e.target.closest("textarea, input")) return;
    if (e.code === "Space" && lage && lage.abspielen) { e.preventDefault(); lage.abspielen(); }
    else if (e.code === "ArrowRight" && lage && lage.weiter) { e.preventDefault(); lage.weiter(); }
  });

  startseite();

  // Offline-Speicher (nur wenn die App über eine Webadresse läuft, nicht per Doppelklick)
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => { /* ohne Offline-Speicher geht es trotzdem */ });
  }
})();
