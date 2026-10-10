/* Auffrischen mit Mr. Alex – App-Gerüst (Version 1)
   Kein Konto, keine Namen. Fortschritt und Fragen bleiben nur auf diesem Gerät (localStorage). */
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
    1: { name: "Stufe 1", ansage: "Hören wir zu. Sprich nach! Das Deutsche kannst du antippen." },
    2: { name: "Stufe 2", ansage: "Jetzt siehst du Englisch und Deutsch. Hör zu und sprich nach!" },
    3: { name: "Stufe 3", ansage: "Du hörst den deutschen Satz. Sag ihn auf Englisch! Dann tipp auf „Lösung“." },
  };

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
  const station = (nr) => D.stationen.find((s) => s.nr === nr);

  /* ---------- Startseite ---------- */
  function startseite() {
    const alleFertig = D.stationen.every((s) => stand.erledigt.includes(s.nr));
    zeige(
      el("header", { class: "gruss" },
        el("h1", {}, "Hallo! Frischen wir zusammen auf!"),
        el("p", { class: "klein" }, "Wähl eine Station. Wenn du fertig bist, bekommt sie ein Häkchen. Dein Mr. Alex")),
      alleFertig ? el("section", { class: "geschafft" },
        el("h2", {}, "Wahnsinn, du hast alles geschafft!"),
        el("p", {}, "Wenn etwas unklar ist, frag mich am Mittwoch – ich helfe dir gern. Dein Mr. Alex")) : null,
      el("nav", { class: "kacheln", "aria-label": "Stationen" },
        D.stationen.map((s) => {
          const fertig = stand.erledigt.includes(s.nr);
          return el("button", { class: "kachel" + (fertig ? " erledigt" : ""), onclick: () => starteStation(s.nr),
            "aria-label": `Station ${s.nr}: ${s.titel}${fertig ? " (geschafft)" : ""}` },
            el("span", { class: "sym", "aria-hidden": "true" }, s.symbol),
            el("span", { class: "nr" }, "Station " + s.nr),
            el("span", { class: "titel" }, s.titel),
            fertig ? el("span", { class: "haken", "aria-hidden": "true" }, "✓") : null);
        })),
      el("div", { class: "knopfreihe" },
        el("button", { class: "knopf", onclick: fragenOeffnen }, "✏️ Frage für Mr. Alex notieren"))
    );
  }

  /* ---------- Station ---------- */
  // Eine Station besteht aus Teilen; ein Listen-and-Repeat-Schritt wird zu drei Teilen (Stufe 1–3).
  function teile(st) {
    const t = [];
    st.schritte.forEach((s) => {
      if (s.art === "lr") [1, 2, 3].forEach((stufe) => t.push({ art: "lr", stufe, saetze: s.saetze }));
      else t.push(s);
    });
    return t;
  }

  let lage = null; // { nr, teile, teil, satz, geloest }

  function starteStation(nr) {
    const st = station(nr);
    const t = teile(st);
    if (!t.length) return platzhalter(st);
    lage = { nr, teile: t, teil: 0, satz: 0, geloest: false };
    zeigeSatz();
  }

  function kopf(st) {
    return el("header", { class: "kopf" },
      el("button", { class: "knopf leise", onclick: startseite }, "← Start"),
      el("h1", {}, `Station ${st.nr}: ${st.titel}`),
      lage ? el("ol", { class: "schritte", "aria-label": "Schritte" },
        lage.teile.map((t, i) => el("li", { class: i === lage.teil ? "jetzt" : i < lage.teil ? "fertig" : "",
          "aria-current": i === lage.teil ? "step" : false }, t.art === "lr" ? STUFEN[t.stufe].name : t.name || t.art))) : null);
  }

  function platzhalter(st) {
    lage = null;
    zeige(kopf(st), el("section", { class: "platzhalter" },
      el("p", { class: "ansage" }, "Diese Station baue ich gerade noch für dich. Schau bald wieder rein!"),
      el("button", { class: "knopf haupt", onclick: startseite }, "Zur Startseite")));
  }

  /* ---------- Listen and Repeat ---------- */
  function zeigeSatz() {
    const st = station(lage.nr);
    const teil = lage.teile[lage.teil];
    const s = D.saetze[teil.saetze[lage.satz]];
    const stufe = teil.stufe;
    lage.geloest = false;

    const jetztdu = el("div", { class: "jetztdu", hidden: true, role: "status" },
      "Jetzt du! Sprich nach.", el("span", { class: "balken", "aria-hidden": "true" }));

    const enBlock = (mitLuecke) => el("div", { class: "spalte", lang: "en" },
      el("span", { class: "sprache" }, "Englisch"),
      s.symbol ? el("span", { class: "symbol", "aria-hidden": "true" }, s.symbol) : null,
      el("p", { class: "satz" }, mitLuecke ? lueckenSatz(s, true) : lueckenSatz(s, false)));
    const deBlock = el("div", { class: "spalte", lang: "de" },
      el("span", { class: "sprache" }, "Deutsch"),
      el("p", { class: "satz de" }, s.de));

    let links, rechts;
    if (stufe === 1) {
      links = enBlock(false);
      rechts = el("div", { class: "spalte" }, el("span", { class: "sprache" }, "Deutsch"),
        el("button", { class: "aufdecken", onclick: () => { rechts.replaceWith(deBlock); rechts = deBlock; } },
          "Deutsch zeigen"));
    } else if (stufe === 2) {
      links = enBlock(false); rechts = deBlock;
    } else {
      links = deBlock; rechts = enBlock(true);
    }

    const nochmal = el("button", { class: "knopf", onclick: abspielen }, "🔊 Nochmal");
    const loesung = stufe === 3 ? el("button", { class: "knopf", onclick: loesen }, "Lösung") : null;
    const weiter = el("button", { class: "knopf haupt", onclick: weiterGehen }, "Weiter ➜");

    zeige(kopf(st),
      el("p", { class: "ansage" }, STUFEN[stufe].ansage),
      el("section", { class: "satzkarte", "aria-label": "Satz" },
        el("p", { class: "zaehler" }, `Satz ${lage.satz + 1} von ${teil.saetze.length}`),
        s.hinweis ? el("p", { class: "hinweis" }, s.hinweis) : null,
        el("div", { class: "spalten" }, links, rechts),
        jetztdu,
        el("div", { class: "knopfreihe" }, nochmal, loesung, weiter)));

    function zeigeJetztDu(dauer) {
      jetztdu.hidden = false;
      jetztdu.classList.remove("laeuft");
      void jetztdu.offsetWidth;
      jetztdu.style.setProperty("--dauer", Math.max(3, dauer * 1.4 + 1).toFixed(1) + "s");
      jetztdu.classList.add("laeuft");
    }
    function englisch() {
      jetztdu.hidden = true;
      spiele([s.audio.en_m, s.audio.en_f]).then((d) => { if (d !== null) zeigeJetztDu(d / 2); });
    }
    function abspielen() {
      if (stufe === 3 && !lage.geloest) { jetztdu.hidden = true; spiele([s.audio.de]); }
      else englisch();
    }
    function loesen() {
      lage.geloest = true;
      rechts.replaceWith(rechts = enBlock(false));
      loesung.disabled = true;
      englisch();
    }
    lage.abspielen = abspielen;
    lage.weiter = weiterGehen;
    abspielen();
  }

  function lueckenSatz(s, mitLuecke) {
    if (!s.luecke) return s.en;
    const i = s.en.indexOf(s.luecke);
    if (i < 0) return s.en;
    const vor = s.en.slice(0, i), nach = s.en.slice(i + s.luecke.length);
    return [vor, mitLuecke
      ? el("span", { class: "luecke", "aria-label": "Lücke" }, s.luecke.replace(/./g, "_"))
      : el("strong", { class: "ziel" }, s.luecke), nach];
  }

  function weiterGehen() {
    const teil = lage.teile[lage.teil];
    if (lage.satz + 1 < teil.saetze.length) { lage.satz++; return zeigeSatz(); }
    if (lage.teil + 1 < lage.teile.length) return zwischenstand();
    stationGeschafft();
  }

  function zwischenstand() {
    const st = station(lage.nr);
    const fertig = lage.teile[lage.teil];
    lage.abspielen = null;
    lage.weiter = () => { lage.teil++; lage.satz = 0; zeigeSatz(); };
    zeige(kopf(st), el("section", { class: "geschafft" },
      el("h2", {}, lob()),
      el("p", {}, `${STUFEN[fertig.stufe].name} geschafft!`),
      el("button", { class: "knopf haupt", onclick: lage.weiter }, "Weiter ➜")));
  }

  function stationGeschafft() {
    const st = station(lage.nr);
    if (!stand.erledigt.includes(st.nr)) { stand.erledigt.push(st.nr); speichern(); }
    lage = null;
    zeige(kopf(st), el("section", { class: "geschafft" },
      el("h2", {}, `Station ${st.nr} geschafft!`),
      el("p", { class: "ansage" }, `Du bist ein Superstar ${st.lob}!`),
      el("button", { class: "knopf haupt", onclick: startseite }, "Zur Startseite")));
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
