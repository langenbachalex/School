/* Français Classe 5/6 – Sprachkurs-App (Mr. Alex)
   Kein Konto, keine Namen. Fortschritt bleibt nur auf diesem Gerät (localStorage, Schlüssel mit Präfix fr_).
   Kacheln: 💬 Dialogues · 🗣️ Prononciation · 🎮 Jeux · 🎧 Beat-Studio · Sammlung „Panthéon“.
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
  const LOB = ["Bravo !", "Super !", "Génial !", "Très bien !", "Excellent !", "Parfait !", "Magnifique !", "Incroyable !"];
  const FEHLER = ["Presque !", "Encore une fois !", "Pas grave – noch mal!", "Oups !"];

  /* ---------- Speicher ---------- */
  function laden() {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(SPEICHER)) || {}; } catch (e) { s = {}; }
    return Object.assign({ punkte: 0, dialoge: {}, namen: {}, spiele: {}, lese: "einfach", tempo: 1 }, s);
  }
  const stand = laden();
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
  function zeige(...inhalt) { stopp(); app.replaceChildren(...inhalt.filter(Boolean)); window.scrollTo(0, 0); }
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
    stand.punkte += plus; speichern();
    toast(`+${plus} ⭐ ${grund || zufall(LOB)}`);
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
  function spiele(liste) {
    stopp();
    const mein = lauf;
    let gesamt = 0;
    return liste.filter(Boolean).reduce((kette, x) => kette.then(() => new Promise((fertig) => {
      if (mein !== lauf) return fertig();
      if (typeof x === "object") return geraet(x.tts).then((d) => { gesamt += d; setTimeout(fertig, 250); });
      const a = new Audio(x);
      aktuell = a; a.playbackRate = tempo(); a.preservesPitch = true;
      a.onended = () => { gesamt += (a.duration || 0) / tempo(); setTimeout(fertig, 300); };
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
        el("p", { class: "klein" }, "Salut ! Wähl eine Kachel. Was du geschafft hast, kommt ins Panthéon."),
        el("div", { class: "statusleiste" }, el("span", {}, `⭐ ${stand.punkte} Punkte`), el("span", {}, `🗣️ ${namenFertig}/${D.namen.length} Namen`),
          knopf("🏛️ Panthéon", pantheon, "haupt"))),
      el("nav", { class: "kacheln", "aria-label": "Kacheln" },
        kachel("💬", "Dialogues", `${D.dialoge.filter((d) => schritteFertig(d) === SCHRITTE.length).length}/${D.dialoge.length} geschafft`, dialogListe),
        kachel("🗣️", "Prononciation", "Namen richtig aussprechen", prononciation),
        kachel("🎮", "Jeux", "Memory, Qui est-ce ?, Dans l'ordre", jeux),
        kachel("🎧", "Beat-Studio", "Mitsingen mit Mr. Alex", beatStudio)));
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
        if (ende) { melde(box, "gut", `${zufall(LOB)} Alle Lücken gefüllt${fehler ? "" : " – ohne Fehler"}!`); schrittFertig(d, nr); }
      },
      falsch: () => { fehler++; melde(box, "hilfe", `${zufall(FEHLER)} Schau noch mal.`); }
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
      richtig: (l, ende) => { if (ende) { melde(box, "gut", zufall(LOB)); spiele([ton(z)]); weiter.disabled = false; weiter.focus(); } },
      falsch: () => melde(box, "hilfe", zufall(FEHLER))
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
      const sprich = () => { if (wahl.every((x) => x.wert)) { let k = 0; spiele([{ tts: teile.map((t) => (/^\{\w+\}$/.test(t) ? wahl[k++].wert : t)).join("") }]); } };
      saetze.push(wahl);
      return el("div", { class: "parle-karte" }, satz, auswahl, el("div", { class: "knopfreihe" }, knopf("🔊 Hören", sprich), el("span", { class: "klein" }, "… und sag es laut!")));
    });
    function fertigTest() { if (saetze.every((w) => w.every((x) => x.wert))) { melde(box, "gut", "Super ! Jetzt sag alle Sätze laut – am besten zu zweit."); schrittFertig(d, 5); } }
    zeige(kopf(d.titel, () => dialogSeite(d), "5. Parle de toi – tipp die Lücke an und wähl dein Wort."),
      el("section", { class: "satzkarte" }, karten, box), weiterLeiste(d, 5));
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
        kachel("🔢", "Dans l'ordre", "Bring den Dialog in die richtige Reihenfolge", () => ordre())));
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
          if (++gefunden === paare.length) melde(box, "gut", `${zufall(LOB)} Alle Paare in ${zuege} Zügen!${spielPunkte("memory")}`);
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
        el("h2", {}, `${richtig} von ${RUNDEN} richtig!`), el("p", {}, richtig >= 7 ? zufall(LOB) + spielPunkte("qui") : "Noch mal? Ab 7 Treffern gibt es Punkte."),
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
          melde(box, gut ? "gut" : "hilfe", gut ? zufall(LOB) : `Das war ${ziel.name}.`);
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
          if (pos === zeilen.length) melde(box, "gut", `${zufall(LOB)} Richtig sortiert!${spielPunkte("ordre")}`);
        } else { b.classList.remove("falsch"); void b.offsetWidth; b.classList.add("falsch"); klang(false); melde(box, "hilfe", zufall(FEHLER)); }
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

  /* ---------- 🏛️ Panthéon ---------- */
  function pantheon() {
    zeige(kopf("🏛️ Panthéon", startseite, "Deine Sammlung: geschaffte Dialoge und Namen. Gold = auch ohne Vorbild."),
      el("h2", {}, "🏅 Dialogues"),
      el("div", { class: "namen-raster" }, D.dialoge.map((d) => {
        const n = schritteFertig(d);
        return el("button", { type: "button", class: "namen-knopf" + (n === SCHRITTE.length ? " gold" : n ? "" : " gesperrt"), onclick: () => dialogSeite(d) },
          el("span", { class: "medaille", "aria-hidden": "true" }, n === SCHRITTE.length ? "🏅" : n ? "💬" : "🔒"), el("span", { lang: "fr" }, d.titel), el("small", {}, `${n}/${SCHRITTE.length}`));
      })),
      Object.entries(D.gruppen).map(([g, titel]) => [el("h2", {}, titel),
        el("div", { class: "namen-raster" }, D.namen.filter((n) => n.gruppe === g).map((n) => {
          const s = namenStufe(n);
          return el("button", { type: "button", class: "namen-knopf" + (s >= 2 ? " gold" : s ? "" : " gesperrt"), onclick: () => { const l = D.namen.filter((x) => x.gruppe === g); namenKarte(l, l.indexOf(n), s >= 1 ? 2 : 1); } },
            bild(n, 64), el("span", { lang: "fr" }, s ? n.name : "?"));
        }))]));
  }

  leiste();
  startseite();
})();
