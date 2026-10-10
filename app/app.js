/* Auffrischen mit Mr. Alex – Version 1
   Kein Konto, keine Namen. Fortschritt und Fragen bleiben nur auf diesem Gerät (localStorage).
   Grundsatz: Wird eine Lösung gezeigt, wird sie auch abgespielt. */
(function () {
  "use strict";

  const D = window.DATEN;
  const app = document.getElementById("app");
  const SPEICHER = "auffrischen-v1";

  const LOB = ["Du bist ein Superstar!", "Wahnsinn!", "Superpower!", "Ich kann es nicht glauben, wie krass du bist!"];
  let letztesLob = -1;
  function lob() {
    let i;
    do { i = Math.floor(Math.random() * LOB.length); } while (i === letztesLob && LOB.length > 1);
    letztesLob = i;
    return LOB[i];
  }

  const STUFEN = {
    1: "Hören wir zu. Sprich nach! Das Deutsche kannst du antippen.",
    2: "Jetzt siehst du Englisch und Deutsch. Hör zu und sprich nach!",
    3: "Du hörst den deutschen Satz. Sag ihn auf Englisch! Dann tipp auf „Lösung“.",
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
  function stopp() { lauf++; if (aktuell) { aktuell.pause(); aktuell = null; } }
  function spiele(dateien) {
    stopp();
    const meinLauf = lauf;
    let gesamt = 0;
    return dateien.filter(Boolean).reduce((kette, datei) => kette.then(() => new Promise((fertig) => {
      if (meinLauf !== lauf) return fertig();
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
      if (s.art === "lr") [1, 2, 3, 4].forEach((stufe) =>
        t.push({ art: "lr", stufe, saetze: s.saetze, name: (s.name ? s.name + " · " : "") + "Stufe " + stufe }));
      else t.push(s);
    });
    return t;
  }

  let lage = null; // { nr, teile, teil, pos (Position im Teil), reihe, abspielen, weiter }

  function starteStation(nr) {
    const st = station(nr);
    const t = teileVon(st);
    if (!t.length) return platzhalter(st);
    lage = { nr, teile: t, teil: 0, pos: 0 };
    zeigeTeil();
  }

  function kopf(st) {
    return el("header", { class: "kopf" },
      knopf("← Start", startseite, "leise"),
      el("h1", {}, `Station ${st.nr}: ${st.titel}`),
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
    ({ lr: zeigeSatz, erklaerung: zeigeErklaerung, verbform: zeigeVerbform, hoeren: zeigeHoeren })[teil.art](teil);
  }

  function naechstes() {
    const teil = lage.teile[lage.teil];
    if (lage.pos + 1 < laenge(teil)) { lage.pos++; return zeigeTeil(); }
    if (lage.teil + 1 < lage.teile.length) return zwischenstand();
    stationGeschafft();
  }
  function laenge(teil) {
    if (teil.art === "lr") return teil.saetze.length;
    if (teil.art === "verbform") return teil.aufgaben.length;
    if (teil.art === "hoeren") return teil.uebung.aufgaben.length + 2; // Einstieg, Aufgaben, Text zum Mitlesen
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

  function stationGeschafft() {
    const st = station(lage.nr);
    if (!stand.erledigt.includes(st.nr)) { stand.erledigt.push(st.nr); speichern(); }
    lage = null;
    zeige(kopf(st), el("section", { class: "geschafft" },
      el("h2", {}, `Station ${st.nr} geschafft!`),
      el("p", { class: "ansage" }, `Du bist ein Superstar ${st.lob}!`),
      knopf("Zur Startseite", startseite, "haupt")));
  }

  // Gemeinsamer Rahmen für eine Aufgabe/Karte
  function karte(teil, zaehlerText, ...inhalt) {
    return el("section", { class: "satzkarte" }, zaehlerText && el("p", { class: "zaehler" }, zaehlerText), ...inhalt);
  }
  function rueckmeldung() { return el("div", { class: "rueckmeldung", hidden: true, role: "status" }); }
  function melde(box, art, text) { box.hidden = false; box.className = "rueckmeldung " + art; box.textContent = text; }

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
      symbol && el("span", { class: "symbol", "aria-hidden": "true" }, symbol),
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
      spiele([...ss.map((s) => s.audio.en_m), ...ss.map((s) => s.audio.en_f)]).then((d) => {
        if (d === null) return;
        jetztdu.hidden = false;
        jetztdu.classList.remove("laeuft");
        void jetztdu.offsetWidth;
        jetztdu.style.setProperty("--dauer", Math.max(3, (d / 2) * 1.4 + 1).toFixed(1) + "s");
        jetztdu.classList.add("laeuft");
      });
    }
    function abspielen() {
      if (stufe >= 3 && !geloest) { jetztdu.hidden = true; spiele(ss.map((s) => s.audio.de)); }
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
        knopf("🔊 Anhören", () => spiele([D.saetze[b.audio].audio.de])));
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
              onclick: () => spiele([s.audio.en_m]) }, "🔊")));
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
          spiele([s.audio.en_m, s.audio.en_f]);
        } else {
          e.currentTarget.disabled = true;
          melde(box, "hilfe", `Ich helfe dir: ${a.hilfe} Probier's nochmal!`);
        }
      } }, form)));
    lage.abspielen = () => spiele(geloest ? [s.audio.en_m, s.audio.en_f] : [s.audio.de]);
    zeige(kopf(st),
      el("p", { class: "ansage" }, "Welche Form passt? Tipp auf das richtige Verb!"),
      karte(teil, `Aufgabe ${lage.pos + 1} von ${lage.reihe.length}`,
        el("p", { class: "satz de", lang: "de" }, s.de),
        satz, wahl, box,
        el("div", { class: "knopfreihe" }, knopf("🔊 Anhören", () => lage.abspielen()), weiter)));
    lage.abspielen();
  }

  /* ---------- Hörverstehen ---------- */
  function zeigeHoeren(teil) {
    const st = station(lage.nr);
    const u = teil.uebung;
    const alles = () => spiele(u.teile.map((t) => t.audio));
    const n = u.aufgaben.length;

    if (lage.pos === 0) { // Einstieg
      lage.abspielen = alles;
      lage.weiter = naechstes;
      zeige(kopf(st),
        el("p", { class: "ansage" }, u.anleitung || "Hör gut zu!"),
        karte(teil, null, el("h2", { lang: "en" }, u.titel),
          el("p", {}, "Du kannst den Text so oft hören, wie du willst."),
          el("div", { class: "knopfreihe" }, knopf("🔊 Text hören", alles), knopf("Zu den Aufgaben ➜", naechstes, "haupt"))));
      return alles();
    }
    if (lage.pos === n + 1) { // Text zum Mitlesen
      lage.abspielen = alles;
      lage.weiter = naechstes;
      return zeige(kopf(st),
        el("p", { class: "ansage" }, "Super gemacht! Hier ist der Text zum Mitlesen."),
        karte(teil, null, el("div", { class: "mitlesen", lang: "en" }, u.teile.map((t) => el("p", {},
          el("strong", {}, t.sprecher + ": "), t.text, " ",
          el("button", { class: "knopf leise klein-knopf", "aria-label": "Anhören: " + t.sprecher, onclick: () => spiele([t.audio]) }, "🔊")))),
          el("div", { class: "knopfreihe" }, knopf("Weiter ➜", naechstes, "haupt"))));
    }

    const a = u.aufgaben[lage.pos - 1];
    const box = rueckmeldung();
    const weiter = knopf("Weiter ➜", naechstes, "haupt");
    weiter.disabled = true;
    const fertig = () => { melde(box, "gut", lob()); weiter.disabled = false; lage.weiter = naechstes; };
    const zaehler = `Aufgabe ${lage.pos} von ${n}`;

    if (u.art === "true-false") {
      let geloest = false;
      const wahl = el("div", { class: "wahl", role: "group", "aria-label": "true oder false" },
        [["true", "true ✔"], ["false", "false ✘"]].map(([wert, text]) => el("button", { class: "knopf wahl-knopf", lang: "en",
          onclick: (e) => {
            if (geloest) return;
            if (wert === a.loesung) {
              geloest = true; e.currentTarget.classList.add("richtig"); fertig();
              spiele([a.audio]);
            } else {
              e.currentTarget.disabled = true;
              melde(box, "hilfe", `Ich helfe dir: ${a.hinweis || "Hör den Text noch einmal genau an."} Probier's nochmal!`);
            }
          } }, text)));
      lage.abspielen = () => spiele([a.audio]);
      zeige(kopf(st), el("p", { class: "ansage" }, u.anleitung),
        karte(teil, zaehler, el("p", { class: "satz", lang: "en" }, a.aussage), wahl, box,
          el("div", { class: "knopfreihe" }, knopf("🔊 Satz hören", () => spiele([a.audio])), knopf("🔊 Text hören", alles), weiter)));
      return spiele([a.audio]);
    }

    // art "weg": Verkehrsmittel und Gefühl zuordnen
    const sprecherTeil = u.teile.find((t) => t.sprecher === a.name);
    const hoeren = () => spiele([sprecherTeil && sprecherTeil.audio]);
    const ok = { mittel: false, gefuehl: false };
    function gruppe(art, optionen, richtig, hilfe, label) {
      return el("div", { class: "wahl", role: "group", "aria-label": label },
        optionen.map(([wert, sym, text]) => el("button", { class: "knopf wahl-knopf gross", "aria-label": text,
          onclick: (e) => {
            if (ok[art]) return;
            if (wert === richtig) {
              ok[art] = true; e.currentTarget.classList.add("richtig");
              e.currentTarget.parentElement.querySelectorAll("button").forEach((b) => { b.disabled = b !== e.currentTarget; });
              if (ok.mittel && ok.gefuehl) { fertig(); hoeren(); } else box.hidden = true;
            } else {
              e.currentTarget.disabled = true;
              melde(box, "hilfe", `Ich helfe dir: ${hilfe} Probier's nochmal!`);
            }
          } }, el("span", { class: "wahl-sym", "aria-hidden": "true" }, sym), el("span", {}, text))));
    }
    lage.abspielen = hoeren;
    zeige(kopf(st), el("p", { class: "ansage" }, u.anleitung),
      karte(teil, zaehler,
        el("h2", {}, a.name),
        el("p", { class: "frage" }, `Wie kommt ${a.name} hin?`),
        gruppe("mittel", Object.entries(D.mittel).map(([k, sym]) => [k, sym, MITTEL_NAME[k] || k]), a.mittel,
          `Hör noch einmal, wie ${a.name} hinkommt.`, "Verkehrsmittel"),
        el("p", { class: "frage" }, `Ist der Weg für ${a.name} gut?`),
        gruppe("gefuehl", GEFUEHL, a.gefuehl, `Hör noch einmal, was ${a.name} über den Weg sagt.`, "Gut oder nicht gut"),
        box,
        el("div", { class: "knopfreihe" }, knopf(`🔊 ${a.name} hören`, hoeren), weiter)));
    hoeren();
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
})();
