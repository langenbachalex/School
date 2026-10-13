/* Mon français – persönliche Französisch-App für Mr. Alex (docs/franzoesisch/konzept.md)
   Kein Konto. Fortschritt, Kartenstapel und Punkte bleiben nur auf diesem Gerät (localStorage).
   Oberfläche auf Französisch; jeder Hinweis lässt sich antippen und zeigt dann Deutsch (oder oben „FR + DE“ für alles).
   Kern: „Ma séance du jour“ – 5 neue Wendungen + höchstens 15 Wiederholungen (Leitner), danach ist Schluss.
   Dazu die Themen zum Stöbern: Écouter et répéter (3 Stufen), Machine à remonter le temps, Trouve l'expression. */
(function () {
  "use strict";

  const D = window.DATEN;
  const app = document.getElementById("app");
  const SPEICHER = "francais-v1";
  const PENSUM = D.pensum, INTERVALLE = D.intervalle;
  const GRUPPE = 8; // Wendungen je Teil eines Themas

  /* ---------- Speicher (nur lokal) ---------- */
  function laden() {
    try { return Object.assign({ de: false, teile: {}, karten: {}, tag: null, spiel: null }, JSON.parse(localStorage.getItem(SPEICHER) || "{}")); }
    catch (e) { return { de: false, teile: {}, karten: {}, tag: null, spiel: null }; }
  }
  function speichern() {
    try { localStorage.setItem(SPEICHER, JSON.stringify(stand)); } catch (e) { /* ohne Speicher geht es trotzdem */ }
  }
  const stand = laden();

  /* ---------- FR / FR + DE ---------- */
  let ansicht = null;  // aktuelle Seite – wird beim Umschalten neu gezeichnet
  let leise = false;   // beim Neuzeichnen nichts abspielen
  function setzeDe(an) {
    stand.de = an; speichern();
    document.querySelectorAll(".niveau button").forEach((b) => b.setAttribute("aria-pressed", String((b.dataset.de === "1") === an)));
    if (ansicht) { leise = true; try { ansicht(); } finally { leise = false; } }
  }
  document.querySelectorAll(".niveau button").forEach((b) => b.addEventListener("click", () => setzeDe(b.dataset.de === "1")));
  // Französischer Text mit deutscher Hilfe: antippen zeigt Deutsch darunter; bei „FR + DE“ ist es immer sichtbar
  function frde(fr, de, tag = "span") {
    if (!de) return el(tag, { lang: "fr" }, fr);
    const hilfe = el("span", { class: "frde-de", lang: "de", hidden: !stand.de }, de);
    return el(tag, { class: "frde", lang: "fr", role: "button", tabindex: "0", title: "Deutsch anzeigen",
      onclick: () => { hilfe.hidden = !hilfe.hidden; },
      onkeydown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); hilfe.hidden = !hilfe.hidden; } } }, fr, hilfe);
  }
  const ansage = (fr, de) => el("div", { class: "ansage" }, frde(fr, de, "p"));

  /* ---------- Lob (Mr. Alex' Stimme, solange keine Datei da ist: Stimme des Geräts) ---------- */
  const RUF = D.lob || {};
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
  let vorLob = null, richtigSerie = 0;
  const tonLob = (r) => r.audio || { text: r.text };
  function ruf(art) {
    const r = waehleRuf(art);
    if (!r) return "";
    if (!leise) {
      const t = tonLob(r);
      vorLob = t;
      setTimeout(() => { if (vorLob === t) { vorLob = null; spiele([t]); } }, 0);
    }
    return r.text;
  }
  function lob(stark) {
    richtigSerie++;
    return ruf((stark || richtigSerie % 5 === 0) && RUF.stark ? "stark" : "lob");
  }

  /* ---------- Audio ---------- */
  let lauf = 0, aktuell = null;
  function stopp() {
    lauf++;
    if (aktuell) { aktuell.pause(); aktuell = null; }
    if (window.speechSynthesis) speechSynthesis.cancel();
  }
  // Notlösung: französische Stimme des Geräts, solange die Audiodatei (Mr. Alex' Stimme) fehlt
  function geraeteStimme() {
    const alle = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
    const fr = alle.filter((v) => /^fr[-_]FR/i.test(v.lang));
    const kandidaten = fr.length ? fr : alle.filter((v) => v.lang.startsWith("fr"));
    return kandidaten.find((v) => /thomas|daniel|denis|henri|male/i.test(v.name)) || kandidaten[0] || null;
  }
  function sprich(text) {
    return new Promise((fertig) => {
      if (!window.speechSynthesis) return fertig(0);
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "fr-FR"; u.rate = 0.9;
      const v = geraeteStimme();
      if (v) u.voice = v;
      const start = Date.now();
      let erledigt = false;
      const ende = () => { if (erledigt) return; erledigt = true; clearTimeout(notbremse); setTimeout(() => fertig((Date.now() - start) / 1000), 350); };
      const notbremse = setTimeout(ende, 2500 + text.split(/\s+/).length * 700);
      u.onend = ende; u.onerror = ende;
      speechSynthesis.speak(u);
    });
  }
  // Einträge: Dateipfad (String) oder { text } für die Geräte-Stimme
  function spiele(dateien) {
    if (leise) return Promise.resolve(null);
    if (vorLob) { dateien = [vorLob, ...dateien]; vorLob = null; }
    stopp();
    const meinLauf = lauf;
    let gesamt = 0;
    return dateien.filter(Boolean).reduce((kette, datei) => kette.then(() => new Promise((fertig) => {
      if (meinLauf !== lauf) return fertig();
      if (typeof datei === "object" && !datei.src) return sprich(datei.text).then((d) => { gesamt += d; fertig(); });
      const a = new Audio(datei.src || datei);
      if (datei.rate) a.playbackRate = datei.rate;
      aktuell = a;
      a.onended = () => { gesamt += a.duration || 0; setTimeout(fertig, 350); };
      a.onerror = fertig;
      a.play().catch(fertig);
    })), Promise.resolve()).then(() => (meinLauf === lauf ? gesamt : null));
  }
  const ton = (o) => o.audio || { text: o.fr.replace(/[–—]/g, ",") };

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
  const WENDUNG = Object.fromEntries(D.wendungen.map((w) => [w.id, w]));
  const REIHENFOLGE = Object.fromEntries(D.wendungen.map((w, i) => [w.id, i]));
  const thema = (id) => D.themen.find((t) => t.id === id);
  const knopf = (text, fn, art) => el("button", { class: "knopf" + (art ? " " + art : ""), onclick: fn }, text);
  const weiterKnopf = (fn) => knopf("Suivant ➜", fn || naechstes, "haupt weiter");
  const karte = (zaehlerText, ...inhalt) =>
    el("section", { class: "satzkarte" }, zaehlerText && el("p", { class: "zaehler" }, zaehlerText), ...inhalt);
  const registerSchild = (w) => w.register === "vous" && el("span", { class: "register", title: "Höflichkeitsform" }, "vous · poli");
  // Lücke im Satz: art "voll" | "luecke" | "buchstabe"
  function lueckenSatz(s, art) {
    const w = s.luecke, i = w ? s.fr.indexOf(w) : -1;
    if (i < 0) return [s.fr];
    const mitte = art === "voll" ? el("strong", { class: "ziel" }, w)
      : el("span", { class: "luecke" + (art === "buchstabe" ? " mit-buchstaben" : ""), "aria-label": "trou" },
        art === "buchstabe" ? w.replace(/\S+/g, (x) => x[0] + x.slice(1).replace(/./g, "_")) : w.replace(/\S/g, "_"));
    return [s.fr.slice(0, i), mitte, s.fr.slice(i + w.length)];
  }

  /* ---------- Sprechzeit: „Suivant“ erst nach Hören + Nachsprechen, „Solution“ erst nach Denkzeit ---------- */
  const freiSchluessel = () => (lage ? lage.teil + ":" + lage.pos : "s:" + seancePos);
  function sperre(k) {
    const menge = lage ? (lage.frei = lage.frei || new Set()) : seanceFrei;
    if (menge.has(freiSchluessel())) return k;
    k.disabled = true; k.classList.add("wartet");
    return k;
  }
  function gibFrei(k, sek, merken = true) {
    if (!k.disabled || k.dataset.frei) return;
    k.dataset.frei = "1";
    k.style.setProperty("--warte", sek.toFixed(1) + "s");
    k.classList.add("laeuft");
    const menge = lage ? lage.frei : seanceFrei, schluessel = freiSchluessel();
    setTimeout(() => { k.disabled = false; k.classList.remove("wartet", "laeuft"); if (merken && menge) menge.add(schluessel); }, sek * 1000);
  }
  const sprechDauer = (d, min = 3) => Math.max(min, d * 1.4 + 1);
  const denkzeit = (text) => Math.min(8, Math.max(3, 2 + String(text).split(/\s+/).length * 0.35));
  const wennFrei = (k, fn) => () => { if (!k.disabled) fn(); };
  const tipp = (fr, de, fn) => el("button", { class: "knopf leise tipp", title: de, onclick: (e) => { if (lage) lage.hilfe = true; fn(e); } }, "💡 " + fr);
  function jetztDu() {
    return el("div", { class: "jetztdu", hidden: true, role: "status" }, "À toi ! Répète.",
      el("span", { class: "balken", "aria-hidden": "true" }));
  }
  function nachsprechen(balken, tonListe) {
    balken.hidden = true;
    return spiele([].concat(tonListe)).then((d) => {
      if (d === null) return;
      balken.hidden = false; balken.classList.remove("laeuft"); void balken.offsetWidth;
      balken.style.setProperty("--dauer", sprechDauer(d).toFixed(1) + "s");
      balken.classList.add("laeuft");
      return sprechDauer(d);
    });
  }

  /* ---------- Startseite ---------- */
  let lage = null; // Thema: { thema, gruppe, titel, teile, teil, pos, frei, start, hilfe, reihe }
  let seance = null; // laufende Séance: { schlange: [ids], wieder: Set }
  let seancePos = 0;
  const seanceFrei = new Set();

  function startseite() {
    lage = null; seance = null; ansicht = startseite;
    const plan = tagesplan();
    const gesamt = plan.neu.length + plan.wdh.length, fertig = plan.fertig.length;
    const punkte = [...plan.wdh.map((id) => ({ id, wdh: true })), ...plan.neu.map((id) => ({ id }))];
    const gelernt = Object.keys(stand.karten).length;
    zeige(
      el("header", { class: "gruss" },
        el("h1", { lang: "fr" }, gruss()),
        frde("Dix minutes par jour : la séance, puis ce que tu veux.", "Zehn Minuten am Tag: die Séance, danach was du willst.", "p")),
      el("button", { class: "seance-knopf" + (plan.geschafft ? " fertig" : ""), onclick: starteSeance },
        el("span", { class: "gross" }, plan.geschafft ? "✓ Séance du jour terminée" : "▶ Ma séance du jour"),
        el("span", { class: "unter" }, gesamt ? `${plan.neu.length} nouvelles · ${plan.wdh.length} à réviser · ${fertig} / ${gesamt} faites`
          : "Rien à réviser aujourd'hui – explore les thèmes !"),
        el("span", { class: "seance-fortschritt", "aria-hidden": "true" }, punkte.map((p) =>
          el("span", { class: (p.wdh ? "wdh" : "") + (plan.fertig.includes(p.id) ? " ok" : "") })))),
      el("h2", {}, frde("Les thèmes", "Die Themen")),
      el("nav", { class: "kacheln themen", "aria-label": "Thèmes" },
        D.themen.map((t) => {
          const gruppen = gruppenVon(t), ok = gruppen.filter((g, i) => gruppeFertig(t.id, i)).length;
          return el("button", { class: "kachel" + (ok === gruppen.length ? " erledigt" : ""), onclick: () => zeigeThema(t.id),
            "aria-label": `${t.name} – ${t.de}` },
            el("span", { class: "sym", "aria-hidden": "true" }, t.symbol),
            el("span", { class: "titel", lang: "fr" }, t.name),
            el("span", { class: "unter", lang: "de" }, t.de),
            el("span", { class: "zahl" }, `${t.wendungen.length} expressions · ${ok} / ${gruppen.length} parties`),
            ok === gruppen.length && el("span", { class: "haken", "aria-hidden": "true" }, "✓"));
        }),
        el("div", { class: "kachel bald", "aria-label": "Prochains thèmes" },
          el("span", { class: "sym", "aria-hidden": "true" }, "🎵 🐉 🐈 🥋"),
          el("span", { class: "titel", lang: "fr" }, "Bientôt"),
          el("span", { class: "unter", lang: "fr" }, "Musique et langue · Histoires et fantasy · Les chats · Sport et kung-fu …"),
          el("span", { class: "bald-schild" }, "en préparation"))),
      el("h2", {}, frde("Dialogues avec Aurélien", "Dialoge mit Aurélien")),
      el("nav", { class: "kacheln themen", "aria-label": "Dialogues" }, D.dialoge.map((d, i) => {
        const ok = dialogFertig(d.id);
        return el("button", { class: "kachel" + (ok ? " erledigt" : ""), onclick: () => starteDialog(d.id), "aria-label": `Dialogue ${i + 1} : ${d.titel}${ok ? " ✓" : ""}` },
          el("span", { class: "sym", "aria-hidden": "true" }, "💬"),
          el("span", { class: "titel", lang: "fr" }, `« ${d.titel} »`),
          el("span", { class: "unter", lang: "fr" }, d.ort),
          el("span", { class: "zahl" }, `${d.zeilen.length} répliques`),
          ok && el("span", { class: "haken", "aria-hidden": "true" }, "✓"));
      })),
      el("h2", {}, frde("Prononciation et histoire", "Aussprache und Geschichte")),
      el("nav", { class: "kacheln themen", "aria-label": "Prononciation et histoire" },
        el("button", { class: "kachel", onclick: () => zeigeKapitel(kapitelFrei()), "aria-label": "L'histoire" },
          el("span", { class: "sym", "aria-hidden": "true" }, "📖"),
          el("span", { class: "titel", lang: "fr" }, "Le secret du Louvre"),
          el("span", { class: "unter", lang: "fr" }, "Julien Lefèvre, professeur à Metz – un billet, une salle qui n'existe pas, un chat qui sait."),
          el("span", { class: "zahl" }, `${kapitelFrei()} / ${D.geschichte.length} chapitres · un nouveau par semaine parfaite`)),
        el("button", { class: "kachel" + (nasaleFertig() ? " erledigt" : ""), onclick: starteNasale, "aria-label": "Les nasales" },
          el("span", { class: "sym", "aria-hidden": "true" }, "👃"),
          el("span", { class: "titel", lang: "fr" }, "Les nasales"),
          el("span", { class: "unter", lang: "fr" }, "[ɑ̃] en · [ɔ̃] on · [ɛ̃] in · [œ̃] un – écouter, distinguer, les deux dans un mot"),
          el("span", { class: "zahl" }, `${nasaleTeile().filter((_, i) => stand.teile[`nasale|0|${i}`]).length} / ${nasaleTeile().length} parties`),
          nasaleFertig() && el("span", { class: "haken", "aria-hidden": "true" }, "✓"))),
      el("p", { class: "klein" }, frde(`${gelernt} expressions dans ta boîte · ${Object.values(stand.karten).filter((k) => k.s >= 3).length} bien ancrées · ${orteFrei()} / ${SP.orte.length} lieux visités`,
        `${gelernt} Wendungen in deinem Kasten · ${Object.values(stand.karten).filter((k) => k.s >= 3).length} fest verankert (ab Stufe 3) · ${orteFrei()} / ${SP.orte.length} Orte besucht`)));
    app.querySelector(".gruss").append(statusleiste());
  }
  function gruss() {
    const h = heute().getHours();
    return h < 11 ? "Bonjour ! On y va ?" : h < 18 ? "Salut ! On s'y met ?" : "Bonsoir ! Une petite séance ?";
  }

  /* ---------- Tagesplan (Leitner, sanft) ----------
     Fällige Karten nach Fälligkeit (älteste zuerst), höchstens 15. Was darüber liegt, wartet still auf morgen.
     Neue Wendungen in Themenreihenfolge, höchstens 5. Der Plan wird einmal am Tag gemacht und gespeichert. */
  function tagesplan() {
    const t = iso(heute());
    if (stand.tag && stand.tag.d === t) return stand.tag;
    const faellig = Object.entries(stand.karten).filter(([, k]) => k.f <= t)
      .sort((a, b) => (a[1].f < b[1].f ? -1 : a[1].f > b[1].f ? 1 : REIHENFOLGE[a[0]] - REIHENFOLGE[b[0]]))
      .map(([id]) => id).slice(0, PENSUM.wiederholung);
    const neu = D.wendungen.map((w) => w.id).filter((id) => !stand.karten[id]).slice(0, PENSUM.neu);
    stand.tag = { d: t, wdh: faellig, neu, fertig: [], geschafft: false };
    speichern();
    return stand.tag;
  }
  function naechsteFaelligkeit(stufe) { return iso(plusTage(heute(), INTERVALLE[Math.min(stufe, INTERVALLE.length - 1)])); }

  /* ---------- Ma séance du jour ---------- */
  function starteSeance() {
    const plan = tagesplan();
    lage = null;
    seance = { schlange: [...plan.wdh, ...plan.neu].filter((id) => !plan.fertig.includes(id)), wieder: new Set(), start: Date.now() };
    seancePos = 0;
    if (!seance.schlange.length) return seanceEnde(plan.geschafft);
    zeigeSeanceKarte();
  }
  function seanceKopf() {
    return el("header", { class: "kopf" }, knopf("← Accueil", startseite, "leise"), el("h1", { lang: "fr" }, "Ma séance du jour"));
  }
  function seanceWeiter() {
    const plan = tagesplan();
    if (seancePos + 1 < seance.schlange.length) { seancePos++; return zeigeSeanceKarte(); }
    seanceEnde(plan.geschafft);
  }
  function zeigeSeanceKarte() {
    ansicht = zeigeSeanceKarte;
    const plan = tagesplan();
    const id = seance.schlange[seancePos], w = WENDUNG[id];
    const zaehler = `${seancePos + 1} / ${seance.schlange.length}`;
    if (plan.neu.includes(id) && !stand.karten[id]) return neueKarte(w, zaehler);
    wiederholKarte(w, zaehler);
  }
  // Neue Wendung: hören, nachsprechen, dann ab in den Kasten (Stufe 0, morgen wieder)
  function neueKarte(w, zaehler) {
    const balken = jetztDu();
    const weiter = sperre(weiterKnopf(() => {
      stand.karten[w.id] = { s: 0, f: naechsteFaelligkeit(0) };
      merkeFertig(w.id); seanceWeiter();
    }));
    const abspielen = () => nachsprechen(balken, [ton(w), ton(w.satz)]).then((sek) => { if (sek) gibFrei(weiter, sek); });
    tasten(abspielen, wennFrei(weiter, () => weiter.click()));
    zeige(seanceKopf(),
      ansage("Nouvelle expression ! Écoute et répète.", "Neue Wendung! Hör zu und sprich nach."),
      karte(`${zaehler} · nouvelle`,
        el("div", { class: "vok" }, el("div", {},
          el("p", { class: "wendung", lang: "fr" }, w.fr, " ", registerSchild(w)),
          el("p", { class: "wendung-de", lang: "de" }, w.de))),
        el("div", { class: "spalten" },
          el("div", { class: "spalte" }, el("span", { class: "sprache" }, "Exemple"), el("p", { class: "satz fr", lang: "fr" }, lueckenSatz(w.satz, "voll"))),
          el("div", { class: "spalte" }, el("span", { class: "sprache" }, "Deutsch"), el("p", { class: "satz de", lang: "de" }, w.satz.de))),
        balken,
        el("div", { class: "knopfreihe" }, knopf("🔊 Encore", abspielen), weiter)));
    abspielen();
  }
  // Wiederholung: Deutsch sehen, Französisch sagen, Lösung hören, selbst einschätzen
  function wiederholKarte(w, zaehler) {
    const k = stand.karten[w.id];
    const balken = jetztDu();
    const frage = el("div", {}, el("p", { class: "wendung-de", lang: "de" }, w.de), el("p", { class: "satz de", lang: "de" }, w.satz.de));
    const antwort = el("div", { hidden: true },
      el("p", { class: "wendung", lang: "fr" }, w.fr, " ", registerSchild(w)),
      el("p", { class: "satz fr", lang: "fr" }, lueckenSatz(w.satz, "voll")));
    const bewerten = el("div", { class: "bewerten", hidden: true },
      knopf("😊 Je savais", () => bewerteKarte(w, true), "haupt"),
      knopf("🔁 Encore", () => bewerteKarte(w, false), "encore"));
    const loesung = sperre(knopf("Solution", () => {
      loesung.hidden = true; antwort.hidden = false; bewerten.hidden = false;
      nachsprechen(balken, [ton(w), ton(w.satz)]);
      tasten(() => nachsprechen(balken, [ton(w), ton(w.satz)]), null);
    }, "haupt"));
    gibFrei(loesung, denkzeit(w.satz.fr), false);
    tasten(null, wennFrei(loesung, () => loesung.click()));
    zeige(seanceKopf(),
      ansage("Comment dit-on en français ? Dis-le à voix haute, puis « Solution ».", "Wie sagt man das auf Französisch? Sag es laut, dann „Solution“."),
      karte(`${zaehler} · révision · niveau ${k.s}`,
        el("div", { class: "vok" }, frage), antwort, balken,
        el("div", { class: "knopfreihe" }, loesung), bewerten));
  }
  function bewerteKarte(w, gewusst) {
    const k = stand.karten[w.id];
    if (gewusst) {
      k.s = Math.min(k.s + 1, INTERVALLE.length); k.f = naechsteFaelligkeit(k.s);
      merkeFertig(w.id); lob(); speichern(); seanceWeiter();
    } else {
      k.s = 0; k.f = naechsteFaelligkeit(0); speichern();
      if (!seance.wieder.has(w.id)) { seance.wieder.add(w.id); seance.schlange.push(w.id); }
      else merkeFertig(w.id);
      toast("Pas grave ! Elle revient tout à l'heure.");
      seanceWeiter();
    }
  }
  function merkeFertig(id) {
    const plan = tagesplan();
    if (!plan.fertig.includes(id)) plan.fertig.push(id);
    speichern();
  }
  function seanceEnde(schonGeschafft) {
    const plan = tagesplan();
    const alles = [...plan.wdh, ...plan.neu].every((id) => plan.fertig.includes(id));
    const erstesMal = alles && !plan.geschafft;
    if (erstesMal) { plan.geschafft = true; speichern(); belohne(true, true); }
    // Lob und „À demain“ hintereinander (nicht gleichzeitig, sonst schneidet das eine das andere ab)
    const r = waehleRuf(alles ? "geschafft" : "stark"), text = r ? r.text : "";
    const fini = erstesMal && SP.texte.fini;
    const zeichne = () => zeige(seanceKopf(), el("section", { class: "geschafft" },
      el("h2", { lang: "fr" }, alles ? "C'est fini pour aujourd'hui !" : "Pause !"),
      el("p", { class: "ansage", lang: "fr" }, text),
      frde(alles ? "Ta boîte est à jour. Demain, les expressions reviennent au bon moment. Si tu veux continuer, explore les thèmes – sans pression."
        : "Tu peux reprendre la séance quand tu veux – ce qui est fait reste fait.",
        alles ? "Dein Kasten ist auf dem neuesten Stand. Morgen kommen die Wendungen zum richtigen Zeitpunkt zurück. Wenn du weitermachen willst: die Themen, ohne Druck."
        : "Du kannst die Séance jederzeit fortsetzen – was gemacht ist, bleibt gemacht.", "p"),
      el("div", { class: "knopfreihe" }, knopf("Accueil", startseite, "haupt"), knopf("🏆 Ma collection", sammlung))));
    ansicht = zeichne; seance = null; tasten(null, null);
    zeichne();
    setTimeout(() => spiele([r && tonLob(r), fini && (fini.audio || { text: fini.text })]), 300);
  }

  /* ---------- Themen: Teile und Lage ---------- */
  function gruppenVon(t) {
    const g = [];
    for (let i = 0; i < t.wendungen.length; i += GRUPPE) g.push(t.wendungen.slice(i, i + GRUPPE));
    return g;
  }
  const satzVon = (id) => Object.assign({ titel: WENDUNG[id].fr }, WENDUNG[id].satz);
  function teileVon(ids) {
    const saetze = ids.map(satzVon);
    const t = [1, 2, 3].map((stufe) => ({ art: "lr", stufe, saetze, name: "Étape " + stufe }));
    const mitZeit = ids.filter((id) => WENDUNG[id].zeit);
    if (mitZeit.length) t.push({ art: "zeit", ids: mitZeit, name: "⏳ Machine à remonter le temps" });
    t.push({ art: "abfrage", ids, name: "🔎 Trouve l'expression" });
    return t;
  }
  const teilSchluessel = (i) => `${lage.thema}|${lage.gruppe}|${i}`;
  const istFertig = (i) => !!stand.teile[teilSchluessel(i)];
  function teilFertig(i) { stand.teile[teilSchluessel(i)] = true; speichern(); }
  const gruppeFertig = (tid, g) => teileVon(gruppenVon(thema(tid))[g]).every((_, i) => stand.teile[`${tid}|${g}|${i}`]);
  const alleTeileFertig = () => lage.teile.every((_, i) => istFertig(i));

  function zeigeThema(tid) {
    const t = thema(tid);
    lage = null; seance = null; ansicht = () => zeigeThema(tid);
    const gruppen = gruppenVon(t);
    zeige(
      el("header", { class: "kopf" }, knopf("← Accueil", startseite, "leise"), el("h1", { lang: "fr" }, `${t.symbol} ${t.name}`)),
      ansage("Choisis une partie. Chaque partie : écouter et répéter en trois étapes, la machine à remonter le temps, puis retrouver les expressions.",
        "Wähl einen Teil. Jeder Teil: hören und nachsprechen in drei Stufen, Zeitmaschine, dann die Wendungen wiederfinden."),
      el("nav", { class: "kacheln gruppen" }, gruppen.map((ids, i) => {
        const ok = gruppeFertig(tid, i);
        return el("button", { class: "kachel" + (ok ? " erledigt" : ""), onclick: () => starteGruppe(tid, i), "aria-label": `Partie ${i + 1}${ok ? " ✓" : ""}` },
          el("span", { class: "nr" }, `Partie ${i + 1}`),
          el("span", { class: "titel", lang: "fr" }, ids.map((id) => WENDUNG[id].fr).slice(0, 3).join(" · ") + (ids.length > 3 ? " …" : "")),
          el("span", { class: "zahl" }, `${ids.length} expressions`),
          ok && el("span", { class: "haken", "aria-hidden": "true" }, "✓"));
      })));
  }
  function starteGruppe(tid, g) {
    const t = thema(tid), ids = gruppenVon(t)[g];
    lage = { thema: tid, gruppe: g, titel: `${t.name} · Partie ${g + 1}`, teile: teileVon(ids), teil: 0, pos: 0, zurueckZu: () => zeigeThema(tid) };
    zeigeTeil();
  }
  /* ---------- Dialoge mit Aurélien ----------
     Ablauf: anhören → Zeilen nachsprechen (Stufe 1 und 3) → „Tu es Alex“ (die App spricht Aurélien, du sprichst in die Pause) → Rollentausch. */
  const ROLLEN = { A: "Alex", B: "Aurélien" };
  function dialogTeile(d) {
    const saetze = d.zeilen.map((z) => Object.assign({ titel: ROLLEN[z.rolle] }, z));
    return [{ art: "dialog", name: "👂 Écouter", dialog: d, rolle: null },
      { art: "lr", stufe: 1, saetze, name: "Répéter ①" }, { art: "lr", stufe: 3, saetze, name: "Répéter ③" },
      { art: "dialog", name: "🎭 Tu es Alex", dialog: d, rolle: "A" }, { art: "dialog", name: "🎭 Tu es Aurélien", dialog: d, rolle: "B" }];
  }
  const dialogFertig = (id) => dialogTeile(D.dialoge.find((d) => d.id === id)).every((_, i) => stand.teile[`dialog:${id}|0|${i}`]);
  function starteDialog(id) {
    const d = D.dialoge.find((x) => x.id === id);
    lage = { thema: "dialog:" + id, gruppe: 0, dialog: d, titel: `« ${d.titel} »`, teile: dialogTeile(d), teil: 0, pos: 0, zurueckZu: startseite };
    seance = null;
    zeigeTeil();
  }
  let dialogLauf = 0;
  const warte = (ms) => new Promise((ok) => setTimeout(ok, ms));
  function zeigeDialog(teil) {
    const meine = teil.rolle, zeilen = teil.dialog.zeilen;
    let versteckt = !!meine;
    const balken = el("div", { class: "jetztdu", hidden: true, role: "status" }, "À toi ! Dis ta réplique.", el("span", { class: "balken", "aria-hidden": "true" }));
    const box = el("div", { class: "rueckmeldung", hidden: true, role: "status" });
    const liste = el("ol", { class: "dialog" }, zeilen.map((z) => {
      const eigen = z.rolle === meine;
      return el("li", { class: "dz rolle-" + z.rolle + (eigen ? " meine" : "") },
        el("span", { class: "dz-rolle", "aria-label": "Rôle " + ROLLEN[z.rolle] }, ROLLEN[z.rolle]),
        el("div", {}, el("p", { class: "dz-en", lang: "fr" }, eigen && versteckt ? "…" : z.fr), el("p", { class: "dz-de klein", lang: "de", hidden: !stand.de && !!meine }, z.de)));
    }));
    const zeigeMeine = () => { versteckt = false; zeilen.forEach((z, i) => { if (z.rolle === meine) liste.children[i].querySelector(".dz-en").textContent = z.fr; }); };
    const startKnopf = knopf(meine ? "▶ Commencer le dialogue" : "▶ Écouter le dialogue", starten, "haupt");
    const stoppKnopf = knopf("■ Stop", () => { dialogLauf++; stopp(); fertig(false); });
    stoppKnopf.hidden = true;
    function fertig(ganz) {
      startKnopf.hidden = false; stoppKnopf.hidden = true; balken.hidden = true;
      [...liste.children].forEach((li) => li.classList.remove("spricht"));
      if (ganz) { gibFrei(weiter, 0.6); box.hidden = false; box.className = "rueckmeldung gut"; box.textContent = lob() + " " + (meine ? "Change de rôle – ou encore une fois !" : "Maintenant, à toi de parler !"); }
    }
    async function starten() {
      const meinLauf = ++dialogLauf;
      startKnopf.hidden = true; stoppKnopf.hidden = false; box.hidden = true;
      for (let i = 0; i < zeilen.length; i++) {
        if (meinLauf !== dialogLauf) return;
        const z = zeilen[i];
        [...liste.children].forEach((li, j) => li.classList.toggle("spricht", j === i));
        if (liste.children[i].scrollIntoView) liste.children[i].scrollIntoView({ block: "nearest", behavior: "smooth" });
        if (z.rolle === meine) { // Pause zum Sprechen, so lang wie die Zeile
          const dauer = Math.max(2.5, z.fr.split(/\s+/).length * 0.6 + 1.2);
          balken.hidden = false; balken.classList.remove("laeuft"); void balken.offsetWidth;
          balken.style.setProperty("--dauer", dauer.toFixed(1) + "s"); balken.classList.add("laeuft");
          await warte(dauer * 1000);
          balken.hidden = true;
        } else if ((await spiele([ton(z)])) === null) return;
      }
      if (meinLauf === dialogLauf) fertig(true);
    }
    const weiter = sperre(weiterKnopf());
    tasten(() => { if (!startKnopf.hidden) starten(); }, wennFrei(weiter, naechstes));
    zeige(kopf(),
      meine ? ansage(`Tu es ${ROLLEN[meine]}. Dis tes répliques quand c'est ton tour – l'appli parle pour ${ROLLEN[meine === "A" ? "B" : "A"]}.`,
        `Du bist ${ROLLEN[meine]}. Sprich deine Zeilen, wenn du dran bist – die App spricht ${ROLLEN[meine === "A" ? "B" : "A"]}.`)
        : ansage(`« ${teil.dialog.titel} » – ${teil.dialog.ort}. Écoute le dialogue.`, `„${teil.dialog.titel}“ – ${teil.dialog.ort}. Hör dir den Dialog an.`),
      karte(null, liste, balken,
        meine && el("div", { class: "knopfreihe" }, tipp("Plus facile : montrer mes répliques", "Noch einfacher: meine Zeilen zeigen", (e) => { e.currentTarget.hidden = true; zeigeMeine(); })),
        el("div", { class: "knopfreihe" }, startKnopf, stoppKnopf), box,
        el("div", { class: "knopfreihe" }, weiter)));
  }

  /* ---------- L'histoire « Le secret du Louvre » ----------
     Kapitel 1 ist frei, jede perfekte Woche schaltet das nächste frei. Absätze hören (alle oder einzeln), antippen = Deutsch. */
  const kapitelFrei = () => Math.min(D.geschichte.length, 1 + spielstand().wochen.length);
  const fett = (text) => text.split(/(\*\*[^*]+\*\*)/).map((t) => (t.startsWith("**") ? el("strong", { class: "ziel" }, t.slice(2, -2)) : t));
  const tonAbsatz = (a) => a.audio || { text: a.fr.replace(/\*\*/g, "") };
  function zeigeKapitel(nr) {
    const k = D.geschichte[nr - 1];
    lage = null; seance = null; ansicht = () => zeigeKapitel(nr);
    if (!k || nr > kapitelFrei()) return sammlung();
    const absaetze = k.absaetze.map((a) => {
      const de = el("p", { class: "absatz-de", lang: "de", hidden: !stand.de }, a.de);
      return el("div", { class: "absatz", role: "button", tabindex: "0", onclick: () => { de.hidden = !de.hidden; },
        onkeydown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); de.hidden = !de.hidden; } } },
        el("p", { class: "absatz-fr", lang: "fr" }, fett(a.fr),
          el("button", { class: "knopf leise klein-knopf", "aria-label": "Écouter", onclick: (e) => { e.stopPropagation(); vorlesen([a]); } }, "🔊")), de);
    });
    async function vorlesen(liste) {
      for (const a of liste) {
        absaetze.forEach((x, i) => x.classList.toggle("spricht", k.absaetze[i] === a));
        if ((await spiele([tonAbsatz(a)])) === null) break;
      }
      absaetze.forEach((x) => x.classList.remove("spricht"));
    }
    const kapitelLeiste = el("div", { class: "knopfreihe" }, D.geschichte.map((x) =>
      el("button", { class: "sprung" + (x.nr === nr ? " jetzt" : "") + (x.nr <= kapitelFrei() ? "" : " zu"), disabled: x.nr > kapitelFrei(),
        onclick: () => zeigeKapitel(x.nr), "aria-current": x.nr === nr ? "page" : false }, x.nr <= kapitelFrei() ? `${x.nr}` : `${x.nr} 🔒`)));
    tasten(() => vorlesen(k.absaetze), nr < kapitelFrei() ? () => zeigeKapitel(nr + 1) : null);
    zeige(
      el("header", { class: "kopf" }, knopf("← Accueil", startseite, "leise"), el("h1", { lang: "fr" }, `📖 Chapitre ${k.nr} – ${k.titel}`), kapitelLeiste),
      ansage("Écoute le chapitre, ou lis-le à voix haute. Touche un paragraphe pour l'allemand.", "Hör das Kapitel, oder lies es laut. Tipp auf einen Absatz für Deutsch."),
      el("section", { class: "satzkarte geschichte" },
        el("div", { class: "knopfreihe" }, knopf("▶ Écouter tout le chapitre", () => vorlesen(k.absaetze), "haupt"), knopf("■ Stop", stopp)),
        el("div", { class: "absaetze" }, absaetze),
        el("div", { class: "knopfreihe" },
          nr < kapitelFrei() ? knopf("Chapitre suivant ➜", () => zeigeKapitel(nr + 1), "haupt")
            : nr < D.geschichte.length ? el("p", { class: "klein" }, frde("Le chapitre suivant se débloque avec ta prochaine semaine parfaite.", "Das nächste Kapitel kommt mit deiner nächsten perfekten Woche."))
            : el("p", { class: "klein" }, frde("La suite est en cours d'écriture.", "Die Fortsetzung wird gerade geschrieben.")),
          knopf("🏆 Ma collection", sammlung))));
  }

  /* ---------- Prononciation: les nasales ----------
     1. Écouter: Wörter nach Klang, erst langsam, dann normal, nachsprechen
     2. Distinguer: Minimalpaare – ein Wort hören, das richtige antippen
     3. Les deux: beide Klänge in einem Wort, Klänge farbig markiert */
  const KLANG = { an: ["[ɑ̃]", "en · an · em · am", "bouche ouverte, langue en bas", "Mund offen, Zunge unten (wie in « enfant »)"],
    on: ["[ɔ̃]", "on · om", "lèvres arrondies, bouche presque fermée", "Lippen rund, Mund fast zu (wie in « bon »)"],
    in: ["[ɛ̃]", "in · ain · ein · aim", "bouche étirée, comme un « ä » nasal", "Mund breit, wie ein nasales „ä“ (wie in « vin »)"],
    un: ["[œ̃]", "un · um", "comme [ɛ̃], mais lèvres légèrement arrondies", "wie [ɛ̃], aber Lippen leicht gerundet (wie in « brun »)"] };
  const N = D.nasale;
  function nasaleTeile() {
    const t = ["an", "on", "in", "un"].map((k) => ({ art: "nasal_wort", name: `${KLANG[k][0]} ${k}`, klang: k, woerter: N.klaenge[k] }));
    [["p1", "en ou on ?"], ["p2", "in ou en ?"], ["p3", "in ou on ?"]].forEach(([g, name]) => t.push({ art: "nasal_paar", name: "🎯 " + name, paare: N.paare.filter((p) => p.gruppe === g) }));
    t.push({ art: "nasal_beide", name: "👑 Les deux", woerter: N.beide });
    return t;
  }
  const nasaleFertig = () => nasaleTeile().every((_, i) => stand.teile[`nasale|0|${i}`]);
  function starteNasale() {
    lage = { thema: "nasale", gruppe: 0, nasale: true, titel: "Les nasales", teile: nasaleTeile(), teil: 0, pos: 0, zurueckZu: startseite };
    seance = null;
    zeigeTeil();
  }
  const tonLangsam = (w) => (w.audio ? { src: w.audio, rate: 0.7 } : { text: w.wort });
  const tonWort = (w) => w.audio || { text: w.wort };
  const klangSchild = (k) => el("span", { class: "klang-schild klang-" + k }, KLANG[k][0], " ", el("small", {}, KLANG[k][1]));
  // Markup comm{an|en}ç{on|on}s → Buchstaben, Nasale farbig
  function markiert(markup) {
    const teile = [];
    markup.split(/(\{[a-z]+\|[^}]*\})/).forEach((t) => {
      const m = t.match(/^\{([a-z]+)\|([^}]*)\}$/);
      teile.push(m ? el("span", { class: "nasal klang-" + m[1], title: KLANG[m[1]][0] }, m[2]) : t);
    });
    return teile;
  }
  function zeigeNasalWort(teil) {
    const w = teil.woerter[lage.pos], beide = teil.art === "nasal_beide";
    const balken = jetztDu();
    const weiter = sperre(weiterKnopf());
    const hoeren = (liste) => nachsprechen(balken, liste).then((sek) => { if (sek) gibFrei(weiter, sek); });
    const abspielen = () => hoeren([tonLangsam(w), tonWort(w)]);
    tasten(abspielen, wennFrei(weiter, naechstes));
    zeige(kopf(),
      beide ? ansage("Deux nasales dans un mot. Écoute lentement, puis à vitesse normale – et répète en soignant chaque voyelle.",
        "Zwei Nasale in einem Wort. Hör langsam, dann normal – und sprich nach, jede Nasale sauber.")
        : ansage(`${KLANG[teil.klang][0]} – ${KLANG[teil.klang][2]}. Écoute lentement, puis normalement. Répète !`, `${KLANG[teil.klang][0]} – ${KLANG[teil.klang][3]}. Hör langsam, dann normal. Sprich nach!`),
      karte(`Mot ${lage.pos + 1} / ${teil.woerter.length}`,
        el("div", { class: "vok" }, el("div", {},
          el("p", { class: "nasal-wort", lang: "fr" }, beide ? markiert(w.markup) : w.wort),
          el("p", { class: "wendung-de", lang: "de" }, w.de),
          el("p", { class: "klang-zeile" }, (beide ? w.klaenge : [teil.klang]).map(klangSchild)))),
        balken,
        el("div", { class: "knopfreihe" }, knopf("🐢 Lentement", () => hoeren([tonLangsam(w)])), knopf("🔊 Normal", () => hoeren([tonWort(w)])), weiter)));
    abspielen();
  }
  function zeigeNasalPaar(teil) {
    if (!lage.reihe) lage.reihe = mischen(teil.paare).map((p) => ({ p, ziel: Math.random() < 0.5 ? "a" : "b", links: Math.random() < 0.5 }));
    const { p, ziel, links } = lage.reihe[lage.pos];
    const a = p, b = p.b, gesucht = ziel === "a" ? a : b;
    let geloest = false;
    const box = el("div", { class: "rueckmeldung", hidden: true, role: "status" });
    const weiter = weiterKnopf(); weiter.disabled = true;
    const hoeren = () => spiele([tonWort(gesucht)]);
    const beideHoeren = () => spiele([tonWort(a), tonWort(b)]);
    const wahlKnopf = (w) => el("button", { class: "knopf wahl-knopf gross", lang: "fr", onclick: (e) => {
      if (geloest) return;
      if (w === gesucht) {
        geloest = true; e.currentTarget.classList.add("richtig");
        box.hidden = false; box.className = "rueckmeldung gut"; box.textContent = `${lob()} ${gesucht.wort} ${KLANG[gesucht.klang][0]} – ${gesucht.de}`;
        weiter.disabled = false; tasten(beideHoeren, naechstes);
        beideHoeren();
      } else {
        e.currentTarget.disabled = true;
        box.hidden = false; box.className = "rueckmeldung hilfe";
        box.replaceChildren(frde(`${ruf("fehler")} Je t'aide : ${KLANG[a.klang][0]} ${KLANG[a.klang][2]} · ${KLANG[b.klang][0]} ${KLANG[b.klang][2]}. Écoute encore !`,
          `Ich helfe dir: ${KLANG[a.klang][0]} ${KLANG[a.klang][3]} · ${KLANG[b.klang][0]} ${KLANG[b.klang][3]}. Hör noch mal!`));
        hoeren();
      }
    } }, el("span", {}, w.wort), el("small", { class: "klang-" + w.klang }, KLANG[w.klang][0]));
    const knoepfe = [wahlKnopf(a), wahlKnopf(b)];
    tasten(hoeren, null);
    zeige(kopf(),
      ansage("Écoute le mot. Lequel est-ce ? Touche le bon.", "Hör das Wort. Welches ist es? Tipp auf das richtige."),
      karte(`Paire ${lage.pos + 1} / ${lage.reihe.length}`,
        el("div", { class: "knopfreihe" }, knopf("🔊 Écouter", hoeren, "haupt")),
        el("div", { class: "wahl" }, links ? knoepfe : knoepfe.reverse()),
        box,
        el("div", { class: "knopfreihe" }, tipp("Plus facile : écouter les deux", "Noch einfacher: beide hören", beideHoeren), weiter)));
    hoeren();
  }

  function kopf() {
    return el("header", { class: "kopf" },
      knopf(lage.dialog || lage.nasale ? "← Accueil" : "← Thème", lage.zurueckZu, "leise"),
      el("h1", { lang: "fr" }, lage.titel),
      sprungleiste());
  }
  function sprungleiste() {
    const nochNichts = !lage.teile.some((_, i) => istFertig(i));
    const ZIFFERN = ["①", "②", "③"];
    const sprung = (i, text) => {
      const t = lage.teile[i], fertig = istFertig(i), jetzt = i === lage.teil && !lage.ende, start = nochNichts && i === 0;
      return el("button", { class: "sprung" + (jetzt ? " jetzt" : "") + (fertig ? " fertig" : "") + (start ? " start" : ""),
        "aria-current": jetzt ? "step" : false, title: t.name, "aria-label": `${t.name}${fertig ? " ✓" : ""}`, onclick: () => springe(i) }, text);
    };
    const eintraege = [];
    for (let i = 0; i < lage.teile.length;) {
      const t = lage.teile[i];
      if (t.art === "lr") {
        const gruppe = el("li", { class: "sprung-gruppe" }, el("span", { class: "sprung-label", lang: "fr" }, "Écouter et répéter"));
        while (i < lage.teile.length && lage.teile[i].art === "lr" && lage.teile[i].saetze === t.saetze) { gruppe.append(sprung(i, ZIFFERN[lage.teile[i].stufe - 1])); i++; }
        eintraege.push(gruppe);
      } else { eintraege.push(el("li", {}, sprung(i, t.name))); i++; }
    }
    return el("ol", { class: "schritte", "aria-label": "Parties – accès direct" }, eintraege);
  }
  function springe(i) { lage.teil = i; lage.pos = 0; lage.ende = false; lage.reihe = null; lage.hilfe = false; zeigeTeil(); }
  function zurueck() {
    if (lage.pos > 0) { lage.pos--; return zeigeTeil(); }
    if (lage.teil === 0) return;
    lage.teil--; lage.reihe = null; lage.hilfe = false;
    lage.pos = laenge(lage.teile[lage.teil]) - 1;
    zeigeTeil();
  }
  function navErgaenzen(zurueckFn) {
    if (!lage) return;
    const z = knopf("◀ Retour", zurueckFn || zurueck);
    z.classList.add("zurueck-knopf");
    if (!zurueckFn && lage.teil === 0 && lage.pos === 0) z.disabled = true;
    const w = app.querySelector("button.weiter");
    if (w && !w.closest("[hidden]")) w.before(z);
    else app.append(el("div", { class: "knopfreihe navleiste" }, z));
    const jetzt = app.querySelector(".sprung.jetzt");
    if (jetzt && jetzt.scrollIntoView && !leise) jetzt.scrollIntoView({ block: "nearest", inline: "center" });
  }
  function zeigeTeil() {
    ansicht = zeigeTeil;
    tasten(null, null);
    if (lage.startTeil !== lage.teil) { lage.startTeil = lage.teil; lage.start = Date.now(); }
    const teil = lage.teile[lage.teil];
    ({ lr: zeigeSatz, zeit: zeigeZeitmaschine, abfrage: zeigeAbfrage, dialog: zeigeDialog,
       nasal_wort: zeigeNasalWort, nasal_beide: zeigeNasalWort, nasal_paar: zeigeNasalPaar })[teil.art](teil);
    navErgaenzen();
  }
  const laenge = (teil) => (teil.art === "abfrage" && lage.reihe ? lage.reihe.length : teil.art === "dialog" ? 1 : (teil.saetze || teil.woerter || teil.paare || teil.ids).length);
  const SPRECH_MIN = { lr: 2, zeit: 3, nasal_wort: 1.5, nasal_beide: 2 }; // Sekunden pro Satz mindestens – schneller geht nicht ehrlich
  const zuSchnell = (teil) => SPRECH_MIN[teil.art] && lage.start && (Date.now() - lage.start) / 1000 < laenge(teil) * SPRECH_MIN[teil.art];
  function naechstes() {
    const teil = lage.teile[lage.teil];
    if (lage.pos + 1 < laenge(teil)) { lage.pos++; return zeigeTeil(); }
    if (zuSchnell(teil)) return zuSchnellSeite();
    const erstesMal = !istFertig(lage.teil);
    teilFertig(lage.teil);
    belohne(erstesMal, false);
    if (alleTeileFertig()) return gruppeGeschafft();
    if (lage.teil + 1 < lage.teile.length) return zwischenstand();
    fastGeschafft();
  }
  function zuSchnellSeite() {
    const nochmal = () => { lage.frei = null; lage.startTeil = null; springe(lage.teil); };
    tasten(null, nochmal);
    const zeichne = () => zeige(kopf(), el("section", { class: "geschafft" },
      el("h2", {}, "⏱️ Trop vite !"),
      ansage("Dis vraiment les phrases à voix haute. Ensuite, il y a des points. Encore une fois !", "Sprich die Sätze wirklich laut. Dann gibt es auch Punkte. Noch mal!"),
      knopf("Encore une fois ➜", nochmal, "haupt")));
    ansicht = zeichne; zeichne();
  }
  function zwischenstand() {
    const fertig = lage.teile[lage.teil], text = lob(true);
    const weiter = () => { lage.teil++; lage.pos = 0; lage.reihe = null; lage.hilfe = false; zeigeTeil(); };
    const zeichne = () => {
      tasten(null, weiter);
      zeige(kopf(), el("section", { class: "geschafft" }, el("h2", { lang: "fr" }, text), el("p", { lang: "fr" }, `${fertig.name} : terminé !`), weiterKnopf(weiter)));
      navErgaenzen(() => zeigeTeil());
    };
    ansicht = zeichne; zeichne();
  }
  function fastGeschafft() {
    lage.ende = true; tasten(null, null);
    const text = lob(true);
    const offen = lage.teile.map((t, i) => [t, i]).filter(([, i]) => !istFertig(i));
    const zeichne = () => zeige(kopf(), el("section", { class: "geschafft" },
      el("h2", { lang: "fr" }, text),
      ansage("Presque ! Il manque encore :", "Fast! Es fehlt noch:"),
      el("div", { class: "knopfreihe" }, offen.map(([t, i]) => knopf(t.name, () => { lage.ende = false; springe(i); }))),
      knopf("Accueil", startseite)));
    ansicht = zeichne; zeichne();
  }
  function gruppeGeschafft() {
    const tid = lage.thema, g = lage.gruppe, titel = lage.titel, zurueckZu = lage.zurueckZu;
    stand.gruppen = stand.gruppen || {};
    const schluessel = `${tid}|${g}`;
    if (!stand.gruppen[schluessel]) { stand.gruppen[schluessel] = true; punkteDazu(PUNKTE.einheit); }
    const t = thema(tid), alle = !!t && gruppenVon(t).every((_, i) => gruppeFertig(tid, i));
    speichern();
    const text = lob(true);
    lage = null; tasten(null, null);
    const zeichne = () => zeige(el("header", { class: "kopf" }, knopf(t ? "← Thème" : "← Accueil", zurueckZu, "leise"), el("h1", { lang: "fr" }, titel)),
      el("section", { class: "geschafft" },
        el("h2", { lang: "fr" }, `${titel} : terminé !`),
        el("p", { class: "ansage", lang: "fr" }, text),
        alle && el("p", { class: "ansage", lang: "fr" }, `Tout le thème « ${t.name} » est terminé. Chapeau !`),
        el("div", { class: "knopfreihe" }, t ? knopf("Autres parties", zurueckZu, "haupt") : knopf("Accueil", startseite, "haupt"), t && knopf("Accueil", startseite))));
    ansicht = zeichne; zeichne();
  }

  /* ---------- Écouter et répéter (3 Stufen) ----------
     1: Französisch und Deutsch sichtbar, hören und nachsprechen
     2: Französisch mit Lücke – ganzen Satz sagen, dann Lösung
     3: nur Deutsch – ganzen Satz auf Französisch sagen, dann Lösung */
  const STUFEN = {
    1: ["Écoute et répète ! La phrase allemande t'aide.", "Hör zu und sprich nach! Der deutsche Satz hilft dir."],
    2: ["Quel mot manque ? Dis toute la phrase, puis « Solution ».", "Welches Wort fehlt? Sag den ganzen Satz, dann „Solution“."],
    3: ["Dis la phrase en français, puis « Solution ».", "Sag den Satz auf Französisch, dann „Solution“."],
  };
  function zeigeSatz(teil) {
    const s = teil.saetze[lage.pos], stufe = teil.stufe;
    let geloest = stufe === 1;
    const balken = jetztDu();
    const fr = el("p", { class: "satz fr", lang: "fr" }, lueckenSatz(s, stufe === 1 ? "voll" : "luecke"));
    if (stufe === 3) fr.replaceChildren(el("span", { class: "profi" }, "Dis toute la phrase en français !"));
    const frSpalte = el("div", { class: "spalte" }, el("span", { class: "sprache" }, "Français"), fr);
    const deSpalte = el("div", { class: "spalte" }, el("span", { class: "sprache" }, "Deutsch"), el("p", { class: "satz de", lang: "de" }, s.de));
    const loesung = stufe > 1 ? sperre(knopf("Solution", loesen)) : null;
    const weiter = sperre(weiterKnopf());
    if (loesung) gibFrei(loesung, denkzeit(s.fr), false);
    const sprechen = () => nachsprechen(balken, ton(s)).then((sek) => { if (sek) gibFrei(weiter, sek); });
    const hilfen = el("div", { class: "knopfreihe" });
    if (stufe === 2) hilfen.append(tipp("Plus facile : la première lettre", "Noch einfacher: erster Buchstabe",
      (e) => { e.currentTarget.hidden = true; if (!geloest) fr.replaceChildren(...lueckenSatz(s, "buchstabe")); }));
    if (stufe === 3) hilfen.append(tipp("Plus facile : la phrase à trou", "Noch einfacher: Satz mit Lücke",
      (e) => { e.currentTarget.hidden = true; if (!geloest) fr.replaceChildren(...lueckenSatz(s, "buchstabe")); }));
    function loesen() { geloest = true; loesung.disabled = true; hilfen.hidden = true; fr.replaceChildren(...lueckenSatz(s, "voll")); sprechen(); }
    const abspielen = () => { if (geloest) sprechen(); };
    tasten(abspielen, wennFrei(weiter, naechstes));
    zeige(kopf(),
      ansage(...STUFEN[stufe]),
      karte(`Phrase ${lage.pos + 1} / ${teil.saetze.length}${s.titel ? " · " + s.titel : ""}`,
        el("div", { class: "spalten" }, stufe === 3 ? [deSpalte, frSpalte] : [frSpalte, deSpalte]),
        hilfen, balken,
        el("div", { class: "knopfreihe" }, knopf("🔊 Encore", abspielen), loesung, weiter)));
    abspielen();
  }

  /* ---------- Machine à remonter le temps ----------
     Derselbe Satz in drei Zeiten: aujourd'hui (présent) – hier (passé composé) – demain (futur proche).
     Erst hören, dann selbst „hier“ und „demain“ sagen, Lösung klappt auf und wird gesprochen. */
  const ZEITEN = [["pc", "Hier", "passé composé", "Et hier ?"], ["fp", "Demain", "futur proche", "Et demain ?"]];
  function zeigeZeitmaschine(teil) {
    const w = WENDUNG[teil.ids[lage.pos]], s = w.satz;
    const balken = jetztDu();
    const weiter = sperre(weiterKnopf());
    let offen = 0;
    const zeilen = [el("div", { class: "zeit offen" },
      el("span", { class: "zeit-label" }, el("b", {}, "Aujourd'hui"), "présent"),
      el("p", { class: "zeit-satz", lang: "fr" }, lueckenSatz(s, "voll")))];
    const knoepfe = [];
    ZEITEN.forEach(([k, label, zeitname, frage], i) => {
      const satz = el("p", { class: "zeit-satz", lang: "fr" }, el("span", { class: "profi" }, frage));
      const zeile = el("div", { class: "zeit" + (i === 0 ? " jetzt" : "") }, el("span", { class: "zeit-label" }, el("b", {}, label), zeitname), satz);
      const kn = sperre(knopf(`Solution : ${label.toLowerCase()}`, () => {
        kn.hidden = true; offen++;
        satz.replaceChildren(w.zeit[k].fr); zeile.classList.add("offen"); zeile.classList.remove("jetzt");
        if (knoepfe[i + 1]) { zeilen[i + 2].classList.add("jetzt"); knoepfe[i + 1].hidden = false; gibFrei(knoepfe[i + 1], denkzeit(w.zeit[k].fr), false); }
        nachsprechen(balken, ton(w.zeit[k])).then((sek) => { if (sek && offen === ZEITEN.length) gibFrei(weiter, sek); });
      }, i === 0 ? "haupt" : ""));
      if (i > 0) kn.hidden = true;
      knoepfe.push(kn); zeilen.push(zeile);
    });
    gibFrei(knoepfe[0], denkzeit(s.fr) + 2, false);
    const alles = () => spiele([ton(s), ...ZEITEN.filter((_, i) => i < offen).map(([k]) => ton(w.zeit[k]))]);
    tasten(alles, wennFrei(weiter, naechstes));
    zeige(kopf(),
      ansage("Écoute la phrase d'aujourd'hui. Puis dis-la au passé, et au futur – à voix haute. Ensuite « Solution ».",
        "Hör den Satz von heute. Dann sag ihn in der Vergangenheit und in der Zukunft – laut. Danach „Solution“."),
      karte(`Phrase ${lage.pos + 1} / ${teil.ids.length} · ${w.fr} (${w.anker})`,
        el("p", { class: "satz de", lang: "de" }, s.de),
        el("div", { class: "zeiten" }, zeilen), balken,
        el("div", { class: "knopfreihe" }, knopf("🔊 Encore", alles), ...knoepfe, weiter)));
    spiele([ton(s)]);
  }

  /* ---------- Trouve l'expression: Deutsch → Französisch mit Selbstkontrolle ---------- */
  function zeigeAbfrage(teil) {
    if (!lage.reihe) lage.reihe = mischen(teil.ids);
    const w = WENDUNG[lage.reihe[lage.pos]];
    const balken = jetztDu();
    const frage = el("p", { class: "wendung-de", lang: "de" }, w.de);
    const antwort = el("div", { hidden: true }, el("p", { class: "wendung", lang: "fr" }, w.fr, " ", registerSchild(w)),
      el("p", { class: "klein", lang: "fr" }, w.satz.fr));
    const bewerten = el("div", { class: "bewerten", hidden: true },
      knopf("😊 Je savais", naechstes, "haupt weiter"),
      knopf("🔁 Encore", () => { lage.reihe.push(w.id); naechstes(); }, "encore"));
    const loesung = sperre(knopf("Solution", () => {
      loesung.hidden = true; antwort.hidden = false; bewerten.hidden = false;
      tasten(() => nachsprechen(balken, [ton(w), ton(w.satz)]), naechstes);
      nachsprechen(balken, [ton(w), ton(w.satz)]);
    }, "haupt"));
    gibFrei(loesung, 3, false);
    tasten(null, wennFrei(loesung, () => loesung.click()));
    zeige(kopf(),
      ansage("Comment dit-on en français ? Dis-le à voix haute, puis « Solution ».", "Wie sagt man das auf Französisch? Sag es laut, dann „Solution“."),
      karte(`Expression ${lage.pos + 1} / ${lage.reihe.length}`,
        el("div", { class: "vok" }, el("div", {}, frage, antwort)), balken,
        el("div", { class: "knopfreihe" }, loesung), bewerten));
  }

  /* ---------- Belohnungen (docs/gamification/konzept.md, angepasst) ----------
     Punkte für fertige Teile und die Séance. Serien zählen Schultage im Saarland (Mo–Fr ohne Ferien und Feiertage):
     🔥 3 Schultage am Stück · ⭐ Perfect week = neues Kapitel der Geschichte (in Vorbereitung) · 👑 4 perfekte Wochen
     🏖️ Wochenende = Bonus, keine Pflicht. Titel: französische Delikatessen. Alles nur auf diesem Gerät. */
  const SP = D.spiel;
  const PUNKTE = { teil: 10, wiederholung: 5, seance: 30, einheit: 50, feuer: 30, wochenende: 20, woche: 100, monat: 200 };
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const heute = () => (window.__heute ? new Date(window.__heute + "T12:00:00") : new Date());
  const plusTage = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const montag = (d) => plusTage(d, -((d.getDay() + 6) % 7));
  const istFrei = (t) => SP.frei.some((f) => t >= f.von && t <= f.bis);
  const istSchultag = (d) => d.getDay() >= 1 && d.getDay() <= 5 && !istFrei(iso(d));
  const schultageDerWoche = (mo) => [0, 1, 2, 3, 4].map((i) => plusTage(mo, i)).filter(istSchultag);
  const titelIndex = (p) => SP.titel.reduce((i, t, k) => (p >= t.ab ? k : i), 0);

  function spielstand() {
    if (!stand.spiel) { stand.spiel = { punkte: 0, tage: {}, wochen: [], feuer: [], wochenende: [], abzeichen: [], titel: 0, seances: 0 }; speichern(); }
    if (stand.spiel.seances == null) stand.spiel.seances = 0;
    return stand.spiel;
  }
  // Frankreich-Karte: jede fertige Séance und jeder zum ersten Mal fertige Teil schalten den nächsten Ort frei
  const neueTeile = () => Object.keys(stand.teile).length;
  const orteBei = (n) => Math.min(SP.orte.length, n);
  const orteFrei = () => orteBei(neueTeile() + spielstand().seances);
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
  function belohne(erstesMal, istSeance) {
    const sp = spielstand(), d = heute(), tag = iso(d);
    const vorher = orteBei(neueTeile() + sp.seances - (istSeance ? 0 : erstesMal ? 1 : 0));
    if (istSeance) sp.seances++;
    if (orteFrei() > vorher) ereignisse.push({ art: "ort", ort: SP.orte[orteFrei() - 1] });
    let plus = istSeance ? PUNKTE.seance : erstesMal ? PUNKTE.teil : PUNKTE.wiederholung;
    const ersterDesTages = !sp.tage[tag];
    sp.tage[tag] = (sp.tage[tag] || 0) + 1;
    if (ersterDesTages) {
      if (!istSchultag(d)) {
        if (d.getDay() === 0 || d.getDay() === 6) { sp.wochenende.push(tag); plus += PUNKTE.wochenende; ereignisse.push({ art: "toast", text: `🏖️ Bonus week-end +${PUNKTE.wochenende}` }); }
      } else {
        const n = serie();
        if (n >= 3 && n % 3 === 0 && !sp.feuer.includes(tag)) {
          sp.feuer.push(tag); plus += PUNKTE.feuer;
          ereignisse.push({ art: "feier", symbol: "🔥", titel: `Tu es en feu ! ${n} jours de suite`, text: `${n} jours d'école de suite – +${PUNKTE.feuer} points !`, ton: SP.texte.feuer });
        }
        const mo = montag(d);
        if (schultageDerWoche(mo).every((x) => sp.tage[iso(x)]) && !sp.wochen.includes(iso(mo))) {
          sp.wochen.push(iso(mo)); plus += PUNKTE.woche;
          const kap = D.geschichte[Math.min(D.geschichte.length, 1 + sp.wochen.length) - 1];
          ereignisse.push({ art: "feier", symbol: "⭐", titel: "Semaine parfaite !",
            text: `Tu as travaillé chaque jour d'école – +${PUNKTE.woche} points.` + (sp.wochen.length < D.geschichte.length ? ` Nouveau chapitre : « ${kap.titel} » !` : " La suite de l'histoire arrive bientôt."), ton: SP.texte.woche });
          const ws = wochenSerie(mo);
          if (ws >= 4 && ws % 4 === 0) {
            plus += PUNKTE.monat; if (!sp.abzeichen.includes("monat")) sp.abzeichen.push("monat");
            ereignisse.push({ art: "feier", symbol: "👑", titel: "Mois parfait !", text: `${ws} semaines parfaites de suite – +${PUNKTE.monat} points et un cadre doré !`, ton: SP.texte.monat });
          }
        }
      }
    }
    punkteDazu(plus);
  }
  function punkteDazu(plus) {
    const sp = spielstand();
    sp.punkte += plus;
    ereignisse.unshift({ art: "toast", text: `+${plus} ⭐` });
    const t = titelIndex(sp.punkte);
    if (t > sp.titel) {
      sp.titel = t;
      const ti = SP.titel[t];
      ereignisse.push({ art: "feier", symbol: ti.symbol, titel: ti.name, text: `Nouveau titre : ${ti.name} !`, ton: ti.audio ? ti : { text: `Félicitations ! Tu es maintenant ${ti.name} !` } });
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
  // Reisestempel beim Freischalten eines Ortes: Umriss des Départements, kurz (2 s), antippen schließt
  function ortStempel(ort) {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "stempel-bild"); svg.setAttribute("aria-hidden", "true");
    const pfad = document.createElementNS(NS, "path");
    pfad.setAttribute("d", SP.karte[ort.dep].d); svg.append(pfad);
    const punkt = document.createElementNS(NS, "circle");
    punkt.setAttribute("cx", ort.x); punkt.setAttribute("cy", ort.y); punkt.setAttribute("r", "3"); punkt.setAttribute("class", "stempel-punkt"); svg.append(punkt);
    const farben = ["#0055a4", "#ffffff", "#ef4135"];
    const box = el("div", { class: "stempel-box", role: "status", onclick: () => box.remove() },
      el("div", { class: "stempel-karte" }, svg,
        el("div", { class: "stempel", lang: "fr" }, el("strong", {}, ort.name.toUpperCase()), el("span", {}, `${ort.dep_name} (${ort.dep}) · visité ✓`)),
        el("div", { class: "sterne", "aria-hidden": "true" }, Array.from({ length: 10 }, (_, i) =>
          el("span", { style: `--w:${i * 36}deg;--f:${farben[i % 3]}` }, "★")))));
    document.body.append(box);
    stempelKlang(0.72);
    try {
      const b = pfad.getBBox(), rand = Math.max(b.width, b.height) * 0.15;
      svg.setAttribute("viewBox", `${b.x - rand} ${b.y - rand} ${b.width + 2 * rand} ${b.height + 2 * rand}`);
    } catch { svg.setAttribute("viewBox", "0 0 600 600"); }
    setTimeout(() => box.classList.add("weg"), 2200);
    setTimeout(() => box.remove(), 2700);
  }
  function zeigeEreignisse() {
    while (ereignisse.length && (ereignisse[0].art === "toast" || ereignisse[0].art === "ort")) {
      const e = ereignisse.shift();
      if (e.art === "ort") ortStempel(e.ort); else toast(e.text);
    }
    if (!ereignisse.length || feier.open) return;
    const e = ereignisse.shift();
    const tonE = e.ton && (e.ton.audio || { text: e.ton.text });
    feier.replaceChildren(konfetti(),
      el("div", { class: "feier-symbol", "aria-hidden": "true" }, e.symbol), el("h2", { id: "feier-titel", lang: "fr" }, e.titel), el("p", { lang: "fr" }, e.text),
      el("div", { class: "knopfreihe" },
        tonE && knopf("🔊 Écouter", () => spiele([tonE])),
        knopf("Suivant ➜", () => { feier.close(); stopp(); setTimeout(zeigeEreignisse, 300); }, "haupt")));
    feier.showModal();
    if (tonE) setTimeout(() => { if (feier.open) spiele([tonE]); }, 900);
  }
  function konfetti() {
    const farben = ["#0055a4", "#ffffff", "#ef4135", "#ffd23f", "#8fb0ff"];
    return el("div", { class: "konfetti", "aria-hidden": "true" }, Array.from({ length: 36 }, (_, i) =>
      el("span", { style: `left:${(i * 37) % 100}%;background:${farben[i % 5]};animation-delay:${(i % 9) * 0.12}s` })));
  }
  function statusleiste() {
    const sp = spielstand(), t = SP.titel[sp.titel];
    return el("div", { class: "statusleiste" + (sp.abzeichen.includes("monat") ? " gold" : "") },
      el("span", { class: "status-titel", lang: "fr" }, `${t.symbol} ${t.name}`),
      el("span", {}, `⭐ ${sp.punkte} points`),
      el("span", { title: "Jours d'école de suite" }, `🔥 ${serie()}`),
      knopf("🏆 Ma collection", sammlung, "haupt"));
  }
  function sammlung() {
    lage = null; seance = null; ansicht = sammlung; tasten(null, null);
    const sp = spielstand(), t = sp.titel, naechster = SP.titel[t + 1];
    const mo = montag(heute());
    const TAGE = ["Lun", "Mar", "Mer", "Jeu", "Ven"];
    const woche = TAGE.map((name, i) => {
      const d = plusTage(mo, i), frei = !istSchultag(d), ok = !!sp.tage[iso(d)];
      return el("li", { class: frei ? "frei" : ok ? "ok" : "" }, el("span", {}, name), el("b", {}, frei ? "–" : ok ? "🔥" : "○"));
    });
    const karten = Object.values(stand.karten);
    const stufen = INTERVALLE.map((_, i) => karten.filter((k) => k.s === i).length);
    const fakt = el("div", { class: "fakt", hidden: true, "aria-live": "polite" });
    const frei = orteFrei();
    const karte = frankreichKarte(frei, (o) => {
      fakt.hidden = false;
      fakt.replaceChildren(el("h3", { lang: "fr" }, `${o.name} · ${o.dep_name} (${o.dep}) · ${o.region}`), frde(o.fakt, o.fakt_de, "p"),
        knopf("🔊 Écouter", () => spiele([o.audio || { text: o.fakt }])));
      spiele([o.audio || { text: o.fakt }]);
    });
    const abz = [
      ["🔥", "En feu", sp.feuer.length > 0], ["⭐", "Semaine parfaite", sp.wochen.length > 0], ["🏅", "5 × parfaite", sp.wochen.length >= 5],
      ["👑", "Mois parfait", sp.abzeichen.includes("monat")], ["🏖️", "Héros du week-end", sp.wochenende.length > 0],
      ["🗺️", "Tour de France", orteFrei() === SP.orte.length], ["📦", "100 expressions", karten.length >= 100], ["🧠", "50 bien ancrées", karten.filter((k) => k.s >= 3).length >= 50],
    ];
    zeige(
      el("header", { class: "kopf" }, knopf("← Accueil", startseite, "leise"), el("h1", {}, "🏆 Ma collection")),
      el("section", { class: "satzkarte titel-karte" + (sp.abzeichen.includes("monat") ? " gold" : "") },
        el("p", { class: "klein" }, "Ton titre"),
        el("div", { class: "titel-symbol", "aria-hidden": "true" }, SP.titel[t].symbol),
        el("h2", { lang: "fr" }, SP.titel[t].name),
        el("p", {}, `⭐ ${sp.punkte} points`),
        naechster && el("div", { class: "fortschritt" }, el("span", { style: `width:${Math.round(100 * (sp.punkte - SP.titel[t].ab) / (naechster.ab - SP.titel[t].ab))}%` })),
        naechster && el("p", { class: "klein" }, `Encore ${naechster.ab - sp.punkte} points jusqu'à « ${naechster.name} » ${naechster.symbol}`)),
      el("section", { class: "satzkarte" },
        el("h2", {}, "Cette semaine"),
        el("ol", { class: "wochenleiste" }, woche),
        el("p", { class: "klein" }, frde(`🔥 ${serie()} jours d'école de suite · ⭐ ${sp.wochen.length} semaines parfaites. Vacances et jours fériés ne comptent pas – ta série reste.`,
          `🔥 ${serie()} Schultage am Stück · ⭐ ${sp.wochen.length} perfekte Wochen. Ferien und Feiertage zählen nicht – deine Serie bleibt.`))),
      el("section", { class: "satzkarte" },
        el("h2", {}, `📦 Ma boîte (${karten.length} expressions)`),
        el("p", { class: "klein" }, frde("Niveau 0 = nouvelle ou oubliée · à partir du niveau 3, l'expression est bien ancrée.", "Stufe 0 = neu oder vergessen · ab Stufe 3 sitzt die Wendung.")),
        el("ul", { class: "abzeichen" }, stufen.map((n, i) => el("li", { class: n ? "ok" : "" }, el("span", {}, `${i}`), el("span", {}, `${n} · ${INTERVALLE[i]} j`))))),
      el("section", { class: "satzkarte" },
        el("h2", {}, `📖 Le secret du Louvre (${kapitelFrei()} / ${D.geschichte.length} chapitres)`),
        el("p", { class: "klein" }, frde("Chaque semaine parfaite débloque un chapitre : Julien Lefèvre, professeur à Metz, et le mystère du Louvre.",
          "Jede perfekte Woche schaltet ein Kapitel frei: Julien Lefèvre, Lehrer aus Metz, und das Geheimnis des Louvre.")),
        el("div", { class: "heldenraster" }, D.geschichte.map((k) => k.nr <= kapitelFrei()
          ? el("button", { class: "kapitel-karte", onclick: () => zeigeKapitel(k.nr) }, el("span", { class: "kapitel-nr" }, `Chapitre ${k.nr}`), el("strong", { lang: "fr" }, k.titel))
          : el("div", { class: "held-zu", "aria-label": "Pas encore débloqué" }, el("span", {}, "?"), el("small", {}, "Semaine parfaite"))))),
      el("section", { class: "satzkarte" },
        el("h2", {}, `🗺️ La France (${frei} / ${SP.orte.length} lieux)`),
        el("p", { class: "klein" }, frde("Chaque séance terminée et chaque partie terminée débloquent un lieu, en partant de Metz. Touche un lieu !",
          "Jede fertige Séance und jeder fertige Teil schalten einen Ort frei, Start in Metz. Tipp auf einen Ort!")),
        karte, fakt),
      el("section", { class: "satzkarte" },
        el("h2", {}, "Badges"),
        el("ul", { class: "abzeichen" }, abz.map(([sym, name, ok]) => el("li", { class: ok ? "ok" : "" },
          el("span", { "aria-hidden": "true" }, sym), el("span", { lang: "fr" }, name), el("span", { class: "unsichtbar" }, ok ? "✓" : "–"))))));
  }

  function frankreichKarte(frei, waehle) {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 600 600"); svg.setAttribute("class", "france"); svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Carte de France");
    const offen = SP.orte.slice(0, frei);
    const besucht = new Set(offen.map((o) => o.dep));
    Object.entries(SP.karte).forEach(([code, d]) => {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", d.d);
      p.setAttribute("class", "f-dep" + (besucht.has(code) ? " offen" : ""));
      const t = document.createElementNS(NS, "title"); t.textContent = `${d.nom} (${code}) · ${d.region}`; p.append(t);
      svg.append(p);
    });
    offen.forEach((o, i) => {
      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", "f-ort" + (i === frei - 1 ? " neu" : "")); g.setAttribute("tabindex", "0"); g.setAttribute("role", "button"); g.setAttribute("aria-label", o.name);
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", o.x); c.setAttribute("cy", o.y); c.setAttribute("r", "7"); g.append(c);
      const t = document.createElementNS(NS, "title"); t.textContent = o.name; g.append(t);
      g.addEventListener("click", () => waehle(o));
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); waehle(o); } });
      svg.append(g);
    });
    const liste = offen.map((o, i) => el("button", { class: "staat-chip" + (i % 2 ? " b" : ""), lang: "fr", onclick: () => waehle(o) }, o.name));
    return el("div", { class: "usa-block" }, el("div", { class: "france-rahmen" }, svg),
      el("p", { class: "staaten-zahl" }, `${frei} / ${SP.orte.length} lieux · ${new Set(offen.map((o) => o.dep)).size} départements`),
      el("div", { class: "staaten-liste" }, liste),
      el("p", { class: "klein bildnachweis" }, "Carte : IGN Admin Express via france-geojson (Licence ouverte)."));
  }

  /* ---------- Tasten: Leertaste = Abspielen, Pfeile = Weiter / Zurück ---------- */
  let tastenAbspielen = null, tastenWeiter = null;
  function tasten(abspielen, weiter) { tastenAbspielen = abspielen; tastenWeiter = weiter; }
  document.addEventListener("keydown", (e) => {
    if (feier.open || e.target.closest("textarea, input")) return;
    if (e.code === "Space" && tastenAbspielen) { e.preventDefault(); tastenAbspielen(); }
    else if (e.code === "ArrowRight" && tastenWeiter) { e.preventDefault(); tastenWeiter(); }
    else if (e.code === "ArrowLeft" && lage && !lage.ende) {
      const z = app.querySelector(".zurueck-knopf");
      if (z && !z.disabled) { e.preventDefault(); z.click(); }
    }
  });

  setzeDe(!!stand.de);
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
