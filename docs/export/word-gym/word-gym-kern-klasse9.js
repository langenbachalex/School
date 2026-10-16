// Referenz-Auszug aus app/klasse9/app.js (Word Gym, 16.10.2026). Nicht lauffähig für sich allein – zeigt Ablauf, Zustandsmodell,
// Icon-Funktion gymIcon() und Karten. Englisch/Deutsch-Umschalter (T/E) und Klasse-9-Helfer (lueckenSatz, tonWort …) kommen aus der App.

  /* ---------- Word Gym: tägliches Vokabeltraining (docs/word-gym/konzept.md) ----------
     Jeden Tag ein festes Pensum: neue Wörter hören und nachsprechen, fällige Wörter aus dem Deutschen
     abrufen und selbst bewerten. Boxen mit Stufe 0–7 und Fälligkeit (Intervalle in D.gym.intervalle). */
  const GYM = D.gym || { pensum: { neu: 4, wdh: 8 }, grenzen: { neu: [1, 6], wdh: [4, 12] }, intervalle: [1, 3, 7, 14, 30, 60, 120] };
  const GYM_REIHE = Object.fromEntries(D.vokabeln.map((v, i) => [v.id, i]));
  const GYM_SPRECH_MIN = 1.5;
  const gymFrei = new Set();
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
    const arme = (h) => `M60 66 L40 ${h} M60 66 L80 ${h}`;
    const buecher = (x) => `<g transform="translate(${x} 0)">
      <rect x="2" y="-13" width="26" height="8" rx="1.5" class="b1"/><rect x="4" y="-4" width="22" height="8" rx="1.5" class="b2"/><rect x="1" y="5" width="28" height="8" rx="1.5" class="b3"/></g>`;
    const d = document.createElement("div");
    d.innerHTML = `<svg class="gym-icon${heben ? " hebt" : ""}" viewBox="0 0 120 100" width="${groesse || 96}" height="${Math.round((groesse || 96) * 0.83)}" aria-hidden="true">
      <path class="arme" d="${arme(y0)}">${heben ? `<animate attributeName="d" begin="indefinite" dur="1.4s" fill="freeze" values="${arme(46)}; ${arme(46)}; ${arme(16)}" keyTimes="0; .3; 1" calcMode="spline" keySplines=".4 0 .2 1; .4 0 .2 1"/>` : ""}</path>
      <circle class="kopf" cx="60" cy="52" r="8.5"/><path class="figur" d="M60 62 V78 M60 78 L49 96 M60 78 L71 96"/>
      <g class="hantel" transform="translate(0 ${y0})">${heben ? `<animateTransform attributeName="transform" type="translate" begin="indefinite" dur="1.4s" fill="freeze" values="0 46; 0 46; 0 16" keyTimes="0; .3; 1" calcMode="spline" keySplines=".4 0 .2 1; .4 0 .2 1"/>` : ""}
        <line class="stange" x1="22" y1="0" x2="98" y2="0"/><circle class="stange-f" cx="30" cy="0" r="5.5"/><circle class="stange-f" cx="90" cy="0" r="5.5"/>
        ${buecher(0)}${buecher(90)}<circle class="hand" cx="40" cy="0" r="5"/><circle class="hand" cx="80" cy="0" r="5"/></g></svg>`;
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
    const stand_ = gesamt === 0 ? T("Heute ist nichts fällig – morgen geht's weiter!", "Nothing due today – see you tomorrow!")
      : plan.geschafft ? T("✓ Heute geschafft – bis morgen!", "✓ Done for today – see you tomorrow!")
        : T(`${plan.neu.length} neu · ${plan.wdh.length} wiederholen · ${fertig} / ${gesamt} fertig`, `${plan.neu.length} new · ${plan.wdh.length} to revise · ${fertig} / ${gesamt} done`);
    const einstellung = el("div", { class: "gym-einstellung", hidden: true });
    const wahl = (schluessel, label, grenzen) => {
      const sel = el("select", { "aria-label": label, onchange: () => {
        g.pensum[schluessel] = +sel.value;
        if (g.tag && g.tag.d === iso(heute()) && !g.tag.fertig.length) g.tag = null; // heute noch nicht begonnen: Plan neu
        speichern(); startseite();
      } });
      for (let n = grenzen[0]; n <= grenzen[1]; n++) sel.append(el("option", { value: n, selected: n === p[schluessel] }, n + (n === GYM.pensum[schluessel] ? T(" (Mr. Alex empfiehlt)", " (Mr. Alex recommends)") : "")));
      return el("label", {}, label, sel);
    };
    einstellung.append(wahl("neu", T("Neue Wörter pro Tag", "New words a day"), GYM.grenzen.neu), wahl("wdh", T("Wiederholungen pro Tag", "Revisions a day"), GYM.grenzen.wdh),
      el("p", { class: "klein" }, T("Gilt ab morgen – oder schon heute, wenn du heute noch nicht angefangen hast.", "Applies from tomorrow – or today if you haven't started yet.")));
    return el("section", { class: "gym-karte" + (plan.geschafft ? " fertig" : "") },
      gymIcon(plan.geschafft, false, 92),
      el("div", { class: "gym-text" },
        el("h2", { lang: "en" }, "Word Gym"),
        el("p", { class: "klein" }, stand_), gesamt > 0 && punkte),
      el("div", { class: "gym-knoepfe" },
        knopf(plan.geschafft || gesamt === 0 ? T("Ansehen", "Have a look") : fertig ? T("▶ Weiter", "▶ Continue") : T("▶ Los geht's", "▶ Let's go"), gymStart, plan.geschafft ? "" : "haupt"),
        el("button", { class: "knopf leise", "aria-label": T("Pensum einstellen", "Set workload"), "aria-expanded": "false",
          onclick: (e) => { einstellung.hidden = !einstellung.hidden; e.currentTarget.setAttribute("aria-expanded", String(!einstellung.hidden)); } }, "⚙")),
      einstellung);
  }

  function gymKopf() {
    return el("header", { class: "kopf" }, knopf("← Start", startseite, "leise"),
      el("h1", { lang: "en", class: "gym-titel" }, gymIcon(false, false, 40), "Word Gym"));
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
    ansicht = gymZeige;
    const plan = gymPlan(), g = gymStand();
    const id = gym.schlange[gym.pos], v = vokabel(id), s = D.saetze[v.satz];
    lage = { gym: true, teil: "gym", pos: id, frei: gymFrei, titel: "Word Gym" };
    const zaehler = `${gym.pos + 1} / ${gym.schlange.length}`;
    if (plan.neu.includes(id) && !g.karten[id]) gymNeu(v, s, zaehler); else gymWiederholung(v, s, zaehler);
  }
  const gymMerke = (id) => { const plan = gymPlan(); if (!plan.fertig.includes(id)) plan.fertig.push(id); speichern(); };
  const gymSatz = (s, art) => s && el("div", { class: "spalten" },
    el("div", { class: "spalte", lang: "en" }, el("span", { class: "sprache" }, "Example"), el("p", { class: "satz" }, lueckenSatz(s, art))),
    !E() && el("div", { class: "spalte", lang: "de" }, el("span", { class: "sprache" }, "Deutsch"), el("p", { class: "satz de" }, s.de)));
  const gymTon = (v, s) => [tonWort(v), s && tonSatz(s)];

  function gymNeu(v, s, zaehler) {
    const balken = jetztDu();
    const weiter = sperre(knopf(T("Weiter ➜", "Next ➜"), () => {
      gymStand().karten[v.id] = { s: 0, f: gymFaellig(0) };
      gymMerke(v.id); gymWeiter();
    }, "haupt weiter"));
    const abspielen = () => nachsprechen(balken, gymTon(v, s), GYM_SPRECH_MIN).then((sek) => { if (sek) gibFrei(weiter, sek); });
    lage.abspielen = abspielen; lage.weiter = wennFrei(weiter, () => weiter.click());
    zeige(gymKopf(),
      ansage("New word! Listen and repeat.", "Neues Wort! Hör zu und sprich nach."),
      karte(`${zaehler} · ${T("neu", "new")}`,
        el("div", { class: "vok" }, el("div", {}, el("p", { class: "vok-en", lang: "en" }, v.en), el("p", { class: "vok-de", lang: "de" }, v.de))),
        gymSatz(s, "voll"), balken,
        el("div", { class: "knopfreihe" }, knopf(T("🔊 Nochmal", "🔊 Again"), abspielen), weiter)));
    abspielen();
  }

  function gymWiederholung(v, s, zaehler) {
    const k = gymStand().karten[v.id] || { s: 0 };
    const balken = jetztDu();
    const frage = el("div", { class: "vok" }, el("div", {}, el("p", { class: "vok-en", lang: "de" }, v.de), s && el("p", { class: "satz de", lang: "de" }, s.de)));
    const antwort = el("div", { class: "gym-antwort", hidden: true },
      el("p", { class: "vok-en", lang: "en" }, v.en), gymSatz(s, "voll"));
    const bewerten = el("div", { class: "knopfreihe gym-bewerten", hidden: true },
      knopf(T("😊 Gewusst", "😊 I knew it"), () => gymBewerte(v, true), "haupt"),
      knopf(T("🔁 Nochmal", "🔁 Again"), () => gymBewerte(v, false), "encore"));
    const loesung = sperre(knopf(T("Lösung", "Solution"), () => {
      loesung.hidden = true; antwort.hidden = false; bewerten.hidden = false;
      nachsprechen(balken, gymTon(v, s), GYM_SPRECH_MIN);
      lage.abspielen = () => nachsprechen(balken, gymTon(v, s), GYM_SPRECH_MIN); lage.weiter = null;
    }, "haupt"));
    gibFrei(loesung, denkzeit(s ? s.en : v.en), false);
    lage.abspielen = null; lage.weiter = wennFrei(loesung, () => loesung.click());
    zeige(gymKopf(),
      ansage("What's that in English? Say it out loud. Then tap “Solution”.", "Was heißt das auf Englisch? Sag es laut! Dann tipp auf „Lösung“."),
      karte(`${zaehler} · ${T("Wiederholung", "revision")} · ${T("Box", "box")} ${k.s + 1}`,
        frage, antwort, balken, el("div", { class: "knopfreihe" }, loesung), bewerten));
  }

  function gymLobToast(r) {
    const t = el("div", { class: "toast lob-toast" }, el("strong", { lang: "en" }, r.text), !E() && r.de && el("span", { lang: "de" }, r.de));
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
      k.s = 0; k.f = gymFaellig(0); fehlerSerie++; richtigSerie = 0;
      if (!gym.wieder.has(v.id)) { gym.wieder.add(v.id); gym.schlange.push(v.id); } else gymMerke(v.id);
      toast(T("Kein Problem – kommt gleich noch mal.", "No problem – it comes back in a moment."));
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
        el("h2", { lang: "en" }, alles ? T("Das war's für heute!", "That's it for today!") : T("Pause!", "Break!")),
        r && el("p", { class: "gym-lob" }, el("strong", { lang: "en" }, r.text), !E() && r.de && el("span", { lang: "de" }, " – " + r.de)),
        el("p", {}, alles ? T("Alle Wörter von heute sind geübt. Morgen gibt es neue und die fälligen von heute kommen wieder.",
          "All of today's words are done. Tomorrow brings new ones, and today's come back when they are due.")
          : T("Erledigtes bleibt gespeichert. Komm später wieder und mach den Rest fertig.", "What you did is saved. Come back later and finish the rest.")),
        el("div", { class: "knopfreihe" }, knopf(T("Zur Startseite", "Home"), startseite, "haupt"), knopf(T("🏆 Meine Sammlung", "🏆 My collection"), sammlung))));
      if (icon.heben) setTimeout(icon.heben, 400);
    };
    ansicht = zeichne; gym = null; lage = null;
    zeichne();
    setTimeout(() => spiele([r && r.audio, fini && fini.audio]), 300);
    if (erstesMal) belohne(true, true, true);
  }

