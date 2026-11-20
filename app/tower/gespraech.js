/* The Keys of the Tower – Gespräche und Filme (Block B2, 20.11.2026).
   Was wann gesprochen wird, steht als Tabelle in den Daten (inhalte/abenteuer/tower_gespraeche.tsv → gespraeche_daten.js), nicht hier.
   - Gespräch: startet, wenn das Kind hingeht (4 m) oder etwas antippt, und nur, wenn der Stand der Geschichte passt. Das Kind tippt jede Zeile weiter;
     an manchen Stellen antwortet es mit Knöpfen. „Sorry?“ = noch einmal, langsamer (die einfache Fassung, wenn es eine gibt). Feder = Deutsch zum Antippen
     (erst, wenn das Kind die Feder hat). Die Kamera geht nah an den, der spricht.
   - Film (Ersatzfassung bis Block C): schwarze Balken, Steuerung aus, die Zeilen laufen von selbst, feste Kamera je Zeile.
   - Ein Schritt der Geschichte gilt erst am Ende („danach“) oder an der Zeile, an der er steht („schritt:…“). Bricht etwas vorher ab, beginnt es beim nächsten Mal von vorn.
   Die Welt (probe3d.html) gibt mit: spiele(id, einfach, { beginn, ende }) · abstand(wer) in Metern · tut(handlung) · sicht(name oder null, hart) · sperre(an). */

const NAH = 4;            // Meter, ab denen ein Gespräch von selbst beginnt
const NAMEN = { erzaehler: "", bild: "", sergeant: "Sergeant Bearskin", gary: "Gary the Great", mrflex: "Mr. Flex", arthur: "Arthur", taube: "The pigeon", tourist: "The tourist" };

export function machGespraeche({ daten, stand, ort, wurzel, welt }) {
  const liste = daten.gespraeche.filter((g) => g.ort === ort), Z = daten.zeilen, gesehen = new Set();
  const log = { sorry: 0, feder: 0 };
  let aktiv = null, lauf = 0, deutschAn = false;

  // ---- Anzeige: Balken für Filme, unten der Kasten mit Sprecher, Satz und Knöpfen ----
  const el = (tag, klasse, text) => { const e = document.createElement(tag); if (klasse) e.className = klasse; if (text) e.textContent = text; return e; };
  const balken = [el("div", "film-balken oben"), el("div", "film-balken unten")];
  const kasten = el("div", "rede"), wer = el("div", "rede-wer"), satz = el("div", "rede-satz"), deutsch = el("div", "rede-deutsch"), knoepfe = el("div", "rede-knoepfe");
  kasten.setAttribute("role", "status"); kasten.hidden = deutsch.hidden = true; kasten.append(wer, satz, deutsch, knoepfe);
  for (const b of balken) { b.hidden = true; wurzel.append(b); }
  wurzel.append(kasten);
  const knopf = (text, klasse, tun) => { const b = el("button", klasse, text); b.type = "button"; b.addEventListener("click", tun); knoepfe.append(b); return b; };

  const passt = (g) => g.noetig.every((s) => (s[0] === "!" ? !stand.ist(s.slice(1)) : stand.ist(s)));
  const fuehreAus = (tut) => { for (const t of tut || []) { if (t.startsWith("schritt:")) stand.setze(t.slice(8)); else welt.tut(t); } };
  const warte = (ms) => new Promise((ok) => setTimeout(ok, window.__towerSchnell ? 5 : ms));

  function zeige(z, einfach) {
    const zeile = aktiv.g.zeilen[aktiv.i];
    wer.textContent = NAMEN[z.s] ?? z.s; wer.hidden = !wer.textContent;
    satz.textContent = einfach && z.ef ? z.ef : z.en; satz.classList.toggle("erzaehlt", z.s === "erzaehler" || z.s === "bild");
    deutsch.textContent = z.de; deutsch.hidden = !deutschAn;
    knoepfe.textContent = "";
    if (!aktiv.film) {
      if (stand.ist("feder")) knopf("🪶 Deutsch", "rede-feder", () => api.feder()).setAttribute("aria-pressed", String(deutschAn));
      if (zeile.knoepfe) zeile.knoepfe.forEach((text, k) => knopf(text, "rede-antwort", () => api.antworte(k)));
      else { knopf("Sorry?", "rede-sorry", () => api.sorry()); knopf("▶", "rede-weiter", () => api.weiter()).setAttribute("aria-label", "Weiter"); }
    }
    kasten.hidden = false; kasten.dataset.zeile = zeile.id;
  }

  function sage(einfach) {
    const meins = ++lauf, zeile = aktiv.g.zeilen[aktiv.i], z = Z[zeile.id], film = aktiv.film;
    const fertig = async () => { if (meins !== lauf || !aktiv) return; if (film) { if (!z.t) await warte(2600); else await warte(350); if (meins === lauf && aktiv) naechste(); } };
    if (!z.t) { zeige(z, einfach); return fertig(); }
    welt.spiele(zeile.id, z, einfach && !!z.te, { beginn: () => { if (meins === lauf && aktiv) zeige(z, einfach); }, ende: fertig });
  }

  function naechste() {
    aktiv.i++;
    if (aktiv.i >= aktiv.g.zeilen.length) return ende();
    const zeile = aktiv.g.zeilen[aktiv.i], z = Z[zeile.id];
    deutschAn = false;
    fuehreAus(zeile.tut);
    if (zeile.bild) welt.sicht(zeile.bild, aktiv.film);
    else if (!aktiv.film && z.s !== "erzaehler" && z.s !== "bild") welt.sicht("nah:" + z.s, false);
    sage(false);
  }

  function starte(g) {
    aktiv = { g, i: -1, film: g.art === "film" }; lauf++;
    welt.sperre(true); document.body.classList.toggle("film", aktiv.film); for (const b of balken) b.hidden = !aktiv.film;
    kasten.classList.toggle("im-film", aktiv.film);
    fuehreAus(g.anfang);
    naechste();
  }

  function ende() {
    const g = aktiv.g;
    aktiv = null; lauf++; kasten.hidden = true; for (const b of balken) b.hidden = true; document.body.classList.remove("film");
    welt.sicht(null); welt.sperre(false);
    gesehen.add(g.id);
    if (g.danach) stand.setze(g.danach);
    const folge = liste.find((n) => n.ausloeser === "nach:" + g.id && passt(n));
    if (folge) starte(folge);
  }

  const api = {
    /* jedes Bild: Beginnt etwas von selbst? */
    pruefe() {
      if (aktiv) return;
      for (const g of liste) {
        if (!passt(g)) continue;
        if (g.ausloeser === "sofort") return starte(g);
        if (g.ausloeser.startsWith("nah:")) { const d = welt.abstand(g.ausloeser.slice(4)); if (d !== null && d < NAH) return starte(g); }
      }
    },
    /* Das Kind hat etwas angetippt und ist hingegangen: gibt es dazu jetzt ein Gespräch? */
    tipp(name) { if (aktiv) return true; const g = liste.find((n) => n.ausloeser === "tipp:" + name && passt(n)); if (g) starte(g); return !!g; },
    weiter() { if (!aktiv || aktiv.film || aktiv.g.zeilen[aktiv.i].knoepfe) return; naechste(); },
    antworte(k) { if (!aktiv) return; const text = (aktiv.g.zeilen[aktiv.i].knoepfe || [])[k]; if (text === "Sorry?") return api.sorry(); if (text) naechste(); },
    sorry() { if (!aktiv || aktiv.film) return; log.sorry++; sage(true); },
    feder() { if (!aktiv || aktiv.film || !stand.ist("feder")) return; deutschAn = !deutschAn; if (deutschAn) log.feder++; deutsch.hidden = !deutschAn; const b = knoepfe.querySelector(".rede-feder"); if (b) b.setAttribute("aria-pressed", String(deutschAn)); },
    laeuft: () => (aktiv ? aktiv.g.id : null),
    zustand: () => ({ laeuft: aktiv ? aktiv.g.id : null, film: !!(aktiv && aktiv.film), zeile: aktiv && aktiv.i >= 0 && aktiv.i < aktiv.g.zeilen.length ? aktiv.g.zeilen[aktiv.i].id : null,
      satz: satz.textContent, deutsch: deutsch.hidden ? null : deutsch.textContent, knoepfe: [...knoepfe.querySelectorAll("button")].map((b) => b.textContent), gesehen: [...gesehen], log: { ...log } }),
  };
  return api;
}
