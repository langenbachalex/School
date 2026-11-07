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
  const LOB = ["Bravo !", "Super !", "Génial !", "Très bien !", "Excellent !", "Parfait !", "Magnifique !", "Incroyable !"];
  const FEHLER = ["Presque !", "Encore une fois !", "Pas grave – noch mal!", "Oups !"];

  /* ---------- Speicher ---------- */
  function laden() {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(SPEICHER)) || {}; } catch (e) { s = {}; }
    return Object.assign({ punkte: 0, dialoge: {}, namen: {}, spiele: {}, paris: 1, helden: 0, lese: "einfach", tempo: 1 }, s);
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
    stand.punkte += plus; speichern();
    toast(`+${plus} ⭐ ${grund || zufall(LOB)}`);
    const neu = parisFrei();
    if (neu > stand.paris) setTimeout(() => toast(`🗼 Nouveau lieu à Paris : ${D.paris[neu - 1].name} !`), 1200);
    const h = heldenFrei();
    if (h > stand.helden) setTimeout(() => toast(`🦸 Nouveau super-héros : ${D.helden[h - 1].name} !`), 2400);
  }
  /* Superhelden (Stufe 3): alle HELD_PUNKTE Punkte ein neuer Held; stand.helden = Zahl der Helden, deren Film schon lief */
  const HELD_PUNKTE = 30;
  const heldenFrei = () => Math.min((D.helden || []).length, Math.floor(stand.punkte / HELD_PUNKTE));
  /* Paris-Karte (Stufe 2): der erste Ort ist frei, danach alle PARIS_PUNKTE Punkte ein neuer Ort. stand.paris = Zahl der Orte, deren Szene schon lief;
     neue Orte zeigt die Startseite mit ihrer Szene (nicht mitten in einer Übung). */
  const PARIS_PUNKTE = 20;
  const parisFrei = () => Math.min((D.paris || []).length, 1 + Math.floor(stand.punkte / PARIS_PUNKTE));
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
        kachel("🎧", "Beat-Studio", "Mitsingen mit Mr. Alex", beatStudio),
        kachel("🗼", "Paris", `${parisFrei()}/${D.paris.length} Orte · Karte mit Filmen`, parisSeite),
        kachel("🦸", "Super-héros", `${heldenFrei()}/${D.helden.length} Helden gesammelt`, heldenSeite),
        kachel("🏃", "Paris Run", "Lauf zur Tour Eiffel – mit deinen Wörtern", parisRun)));
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

  /* ---------- 🏃 Paris Run (Stufe 4, 7.11.2026) ----------
     Runner-Engine (../runner.js, Welt „paris“) mit französischen Wörtern: Diamanten zeigen das Wort, Tore/Boss fragen „Welcher Diamant heißt …?“ (Deutsch → Französisch).
     Kein Ticket, keine Coins (die Französisch-App hat nur Punkte): geschafft = einmal am Tag +10 ⭐ wie die anderen Spiele. Die Figur kommt aus der Englisch-App (nur gelesen), sonst Standard.
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
        el("p", { class: "klein" }, `🎮 ${r.gespielt} Spiele · ${r.geschafft} geschafft · 🦸 ${heldenFrei()} Helden helfen mit`)),
      el("section", { class: "satzkarte" },
        el("h2", {}, "Welche Wörter?"),
        el("div", { class: "reiter" }, RUN_GRUPPEN.map((x, i) => el("button", { type: "button", class: "reiter-knopf", "aria-selected": String(i === runWahl), onclick: () => { runWahl = i; parisRun(); } }, x.name))),
        el("p", { class: "klein", lang: "fr" }, ws.map((w) => w.fr).join(" · ")),
        el("div", { class: "knopfreihe" }, knopf("▶ Los geht's !", () => parisRunSpiel(ws), "haupt"),
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
    const r = runStand(); r.gespielt++; speichern();
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
      { gesperrt: !!o.gesperrt, hinweis: o.gesperrt ? `${HELD_PUNKTE} ⭐` : null, stufe: st, selten: !o.gesperrt && h.selten }); } catch (e) { /* Karte bleibt leer */ }
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
    { breite: 240, gesperrt, hinweis: gesperrt ? `${HELD_PUNKTE} ⭐` : null, stufe: gesperrt ? 0 : karteVon(h.id).s, selten: !gesperrt && h.selten }); } catch (e) { return ""; } };
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
        if (text === f.richtig) { fertig = true; b.classList.add("richtig"); klang(true); melde(box, "gut", zufall(LOB)); i++; setTimeout(frage, 900); }
        else { fehler++; b.classList.add("falsch"); b.disabled = true; klang(false); melde(box, "hilfe", zufall(FEHLER)); }
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
    const rest = HELD_PUNKTE - (stand.punkte % HELD_PUNKTE);
    zeige(kopf("🦸 Super-héros", startseite, heldenFrei() < D.helden.length ? `${heldenFrei()}/${D.helden.length} gesammelt · noch ${rest} ⭐ bis zum nächsten Helden` : "Alle Helden gesammelt – bravo !"),
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
    const frei = parisFrei(), rest = PARIS_PUNKTE - (stand.punkte % PARIS_PUNKTE);
    const fakt = el("section", { class: "karte paris-fakt", hidden: true });
    const faktZeigen = (o) => {
      fakt.hidden = false;
      fakt.replaceChildren(el("h2", { lang: "fr" }, `${o.symbol} ${o.name}`), el("p", { class: "paris-fr", lang: "fr" }, o.fr), el("p", { class: "klein" }, o.de),
        el("div", { class: "knopfreihe" }, knopf("🔊 Écoute", () => spiele([ton(o)])), hatFilm(o) && knopf("▶ Film", () => parisFilm(o), "leise")));
      fakt.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };
    zeige(kopf("🗼 Paris", startseite, frei < D.paris.length ? `${frei}/${D.paris.length} Orte · noch ${rest} ⭐ bis zum nächsten Ort` : `Alle ${D.paris.length} Orte freigeschaltet – bravo !`),
      parisKarte(frei, (o) => { fakt.hidden = true; if (!parisFilm(o, () => faktZeigen(o))) faktZeigen(o); }),
      el("p", { class: "klein" }, "Tipp auf einen Ort: kleiner Film mit Mr. Alex, danach der Text zum Nachlesen."),
      fakt,
      el("div", { class: "namen-raster" }, D.paris.map((o, i) => i < frei
        ? el("button", { type: "button", class: "namen-knopf gold", onclick: () => { if (!parisFilm(o, () => faktZeigen(o))) faktZeigen(o); } }, el("span", { class: "medaille", "aria-hidden": "true" }, o.symbol), el("span", { lang: "fr" }, o.name))
        : el("button", { type: "button", class: "namen-knopf gesperrt", disabled: true }, el("span", { class: "medaille", "aria-hidden": "true" }, "🔒"), el("span", {}, "?")))));
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
        }))]),
      el("h2", {}, "🦸 Super-héros"), kartenZaehler(), heldenRaster(),
      el("h2", {}, "🗼 Paris"),
      el("div", { class: "namen-raster" }, D.paris.map((o, i) => i < parisFrei()
        ? el("button", { type: "button", class: "namen-knopf gold", onclick: () => parisFilm(o) }, el("span", { class: "medaille", "aria-hidden": "true" }, o.symbol), el("span", { lang: "fr" }, o.name))
        : el("button", { type: "button", class: "namen-knopf gesperrt", onclick: parisSeite }, el("span", { class: "medaille", "aria-hidden": "true" }, "🔒"), el("span", {}, "?")))));
  }

  leiste();
  startseite();
})();
