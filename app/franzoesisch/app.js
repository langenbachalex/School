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
      if (typeof datei === "object") return sprich(datei.text).then((d) => { gesamt += d; fertig(); });
      const a = new Audio(datei);
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
      el("p", { class: "klein" }, frde(`${gelernt} expressions dans ta boîte · ${Object.values(stand.karten).filter((k) => k.s >= 3).length} bien ancrées`,
        `${gelernt} Wendungen in deinem Kasten · ${Object.values(stand.karten).filter((k) => k.s >= 3).length} fest verankert (ab Stufe 3)`)));
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
    const text = alles ? ruf("geschafft") : lob(true);
    const fini = SP.texte.fini;
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
    if (erstesMal && fini) setTimeout(() => spiele([fini.audio || { text: fini.text }]), 1500);
  }

  /* ---------- Themen: Teile und Lage ---------- */
  function gruppenVon(t) {
    const g = [];
    for (let i = 0; i < t.wendungen.length; i += GRUPPE) g.push(t.wendungen.slice(i, i + GRUPPE));
    return g;
  }
  function teileVon(ids) {
    const t = [1, 2, 3].map((stufe) => ({ art: "lr", stufe, ids, name: "Étape " + stufe }));
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
  function kopf() {
    return el("header", { class: "kopf" },
      knopf("← Thème", lage.zurueckZu, "leise"),
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
        while (i < lage.teile.length && lage.teile[i].art === "lr") { gruppe.append(sprung(i, ZIFFERN[lage.teile[i].stufe - 1])); i++; }
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
    ({ lr: zeigeSatz, zeit: zeigeZeitmaschine, abfrage: zeigeAbfrage })[teil.art](teil);
    navErgaenzen();
  }
  const laenge = (teil) => (teil.art === "abfrage" && lage.reihe ? lage.reihe.length : teil.ids.length);
  const SPRECH_MIN = { lr: 2, zeit: 3 }; // Sekunden pro Satz mindestens – schneller geht nicht ehrlich
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
    const t = thema(tid), alle = gruppenVon(t).every((_, i) => gruppeFertig(tid, i));
    speichern();
    const text = lob(true);
    lage = null; tasten(null, null);
    const zeichne = () => zeige(el("header", { class: "kopf" }, knopf("← Thème", zurueckZu, "leise"), el("h1", { lang: "fr" }, titel)),
      el("section", { class: "geschafft" },
        el("h2", { lang: "fr" }, `${titel} : terminé !`),
        el("p", { class: "ansage", lang: "fr" }, text),
        alle && el("p", { class: "ansage", lang: "fr" }, `Tout le thème « ${t.name} » est terminé. Chapeau !`),
        el("div", { class: "knopfreihe" }, knopf("Autres parties", zurueckZu, "haupt"), knopf("Accueil", startseite))));
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
    const w = WENDUNG[teil.ids[lage.pos]], s = w.satz, stufe = teil.stufe;
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
      karte(`Phrase ${lage.pos + 1} / ${teil.ids.length} · ${w.fr}`,
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
    if (!stand.spiel) { stand.spiel = { punkte: 0, tage: {}, wochen: [], feuer: [], wochenende: [], abzeichen: [], titel: 0 }; speichern(); }
    return stand.spiel;
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
  function belohne(erstesMal, istSeance) {
    const sp = spielstand(), d = heute(), tag = iso(d);
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
          ereignisse.push({ art: "feier", symbol: "⭐", titel: "Semaine parfaite !",
            text: `Tu as travaillé chaque jour d'école – +${PUNKTE.woche} points. Chapitre ${sp.wochen.length} de l'histoire : en préparation !`, ton: SP.texte.woche });
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
  function zeigeEreignisse() {
    while (ereignisse.length && ereignisse[0].art === "toast") toast(ereignisse.shift().text);
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
    const abz = [
      ["🔥", "En feu", sp.feuer.length > 0], ["⭐", "Semaine parfaite", sp.wochen.length > 0], ["🏅", "5 × parfaite", sp.wochen.length >= 5],
      ["👑", "Mois parfait", sp.abzeichen.includes("monat")], ["🏖️", "Héros du week-end", sp.wochenende.length > 0],
      ["📦", "100 expressions", karten.length >= 100], ["🧠", "50 bien ancrées", karten.filter((k) => k.s >= 3).length >= 50],
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
        el("h2", {}, `📖 L'histoire (${sp.wochen.length} chapitres)`),
        el("p", { class: "klein" }, frde("Chaque semaine parfaite débloque un chapitre : Julien Lefèvre, professeur à Metz, et le mystère du Louvre. En préparation.",
          "Jede perfekte Woche schaltet ein Kapitel frei: Julien Lefèvre, Lehrer aus Metz, und das Geheimnis des Louvre. In Vorbereitung."))),
      el("section", { class: "satzkarte" },
        el("h2", {}, "🗺️ La carte de France"),
        el("p", { class: "klein" }, frde("Chaque séance terminée débloque un lieu, en partant de Metz. En préparation.", "Jede fertige Séance schaltet einen Ort frei, Start in Metz. In Vorbereitung."))),
      el("section", { class: "satzkarte" },
        el("h2", {}, "Badges"),
        el("ul", { class: "abzeichen" }, abz.map(([sym, name, ok]) => el("li", { class: ok ? "ok" : "" },
          el("span", { "aria-hidden": "true" }, sym), el("span", { lang: "fr" }, name), el("span", { class: "unsichtbar" }, ok ? "✓" : "–"))))));
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
