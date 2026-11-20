/* The Keys of the Tower – der STAND DER GESCHICHTE (Block B1, 20.11.2026).
   Ein Modul, das alle fragen: „Ist Schritt X erledigt?“ (ist) und dem alle sagen: „Schritt X ist jetzt erledigt“ (setze).
   Die Schritte und was sie in der Welt ändern, stehen im Drehbuch (docs/spiele/keys-of-the-tower-drehbuch-szene1.md, „Der Stand der Geschichte“).
   - Gespeichert wird nach jedem Schritt von selbst, nur auf diesem Gerät (localStorage „tower-stand“). Nichts verlässt das Gerät.
   - Ein Spielstand aus dem bisherigen Spiel („tower-k1“, tower.js) wird beim ersten Mal übernommen und bleibt unangetastet liegen.
   - Ein Schritt gilt erst, wenn setze() gerufen wurde: Ein Gespräch, das mittendrin abbricht, beginnt beim nächsten Mal von vorn,
     ein Film gilt erst als gesehen, wenn er zu Ende ist.
   - Die Uhren der Welt zeigen die Zeit aus dem Stand (uhrzeit), nie die echte Zeit. */

export const SCHRITTE = ["figur", "auftakt", "auftrag", "gary", "feder", "schluessel1", "tuer1", "arthur", "schluss"];
export const SCHRITT_NAMEN = { figur: "Figur gewählt", auftakt: "Film 1 gesehen", auftrag: "Auftrag vom Sergeant", gary: "Gary ist da", feder: "Feder aufgehoben",
  schluessel1: "Schlüssel genommen", tuer1: "Tür aufgeschlossen", arthur: "Arthur beantwortet", schluss: "Film 4 gesehen" };

/* Uhrzeit in Minuten seit Mitternacht: gilt ab dem genannten Schritt, bis ein späterer Eintrag sie ablöst (Tabelle „Die Uhren“ im Drehbuch) */
const UHR_START = 9 * 60 + 15;
const UHR_AB = { auftrag: 9 * 60 + 16, feder: 9 * 60 + 20, schluss: 9 * 60 + 30 };

const SPEICHER = "tower-stand", ALT = "tower-k1";
const leer = () => ({ v: 1, erledigt: [], figur: 0, name: "" });

/* Der alte Spielstand kannte die Schritte figur → intro → spiegel → tuer → raum → film → ende und einzelne Merker */
export function ausAltemStand(alt) {
  if (!alt || alt.v !== 1) return null;
  const s = leer(), nr = ["figur", "intro", "spiegel", "tuer", "raum", "film", "ende"].indexOf(alt.schritt);
  s.figur = alt.figur || 0; s.name = alt.name || "";
  const ja = (schritt, wenn) => { if (wenn) s.erledigt.push(schritt); };
  ja("figur", nr >= 1);
  ja("auftakt", nr >= 2); ja("auftrag", nr >= 2); ja("gary", nr >= 2);      // der alte Anfang (a01–a19) war ein Stück: erst nach seinem Ende ging es weiter
  ja("feder", nr >= 2 || (nr >= 1 && alt.feder));
  ja("schluessel1", nr >= 4 || (nr >= 2 && alt.schluessel));
  ja("tuer1", nr >= 4);
  ja("arthur", nr >= 5 || (nr >= 4 && alt.arthur));
  ja("schluss", nr >= 6 || !!alt.ende);
  return s;
}

export function machStand(lager = globalThis.localStorage) {
  const lies = (name) => { try { return JSON.parse(lager.getItem(name)); } catch (e) { return null; } };   // kaputter oder gesperrter Speicher: neu anfangen
  let st = lies(SPEICHER), uebernommen = false;
  if (!st || st.v !== 1 || !Array.isArray(st.erledigt)) { st = ausAltemStand(lies(ALT)); uebernommen = !!st; if (!st) st = leer(); }
  st.erledigt = SCHRITTE.filter((s) => st.erledigt.includes(s));
  const hoerer = [];
  const speichere = () => { try { lager.setItem(SPEICHER, JSON.stringify(st)); } catch (e) { /* Speicher voll oder gesperrt: weiterspielen */ } };
  const melde = (schritt) => { for (const h of hoerer) h(schritt); };
  if (uebernommen) speichere();
  const kenne = (schritt) => { if (!SCHRITTE.includes(schritt)) throw new Error("Unbekannter Schritt der Geschichte: " + schritt); };

  const stand = {
    uebernommen,
    ist(schritt) { kenne(schritt); return st.erledigt.includes(schritt); },
    setze(schritt) {                                        // „Schritt X ist jetzt erledigt“ – speichert sofort; ein zweites Mal ändert nichts
      kenne(schritt); if (st.erledigt.includes(schritt)) return false;
      st.erledigt = SCHRITTE.filter((s) => s === schritt || st.erledigt.includes(s)); speichere(); melde(schritt); return true;
    },
    erledigt: () => [...st.erledigt],
    letzter: () => st.erledigt[st.erledigt.length - 1] || null,
    naechster: () => SCHRITTE.find((s) => !st.erledigt.includes(s)) || null,
    figur: () => ({ figur: st.figur, name: st.name }),
    waehleFigur(figur, name) { st.figur = figur; st.name = name || ""; speichere(); },
    uhrzeit() { let zeit = UHR_START; for (const s of SCHRITTE) if (st.erledigt.includes(s) && UHR_AB[s]) zeit = UHR_AB[s]; return zeit; },
    /* Wie sieht die Welt jetzt aus? Jeder Ort liest nur diese Angaben (Tabelle im Drehbuch). */
    welt() {
      const ja = (s) => st.erledigt.includes(s);
      return { uhrzeit: stand.uhrzeit(), sergeant: ja("gary") ? "wache" : "kreis", abzeichen: ja("auftrag"), gary: ja("gary") ? "dabei" : "fass",
        feder: ja("feder"), schluessel: ja("schluessel1") && !ja("tuer1"), tuer1: ja("tuer1") ? "offen" : "zu", treppe: ja("arthur") ? "frei" : "zu", den: ja("schluss") ? "offen" : "zu" };
    },
    beobachte(h) { hoerer.push(h); },
    /* Nur zum Bauen und Testen: direkt zu einem Schritt springen (alles bis dorthin gilt als erledigt, alles danach nicht); null = ganz von vorn */
    springe(schritt) {
      if (schritt) kenne(schritt);
      st.erledigt = schritt ? SCHRITTE.slice(0, SCHRITTE.indexOf(schritt) + 1) : []; speichere(); melde(null);
    },
  };
  return stand;
}

export const uhrText = (minuten) => `${Math.floor(minuten / 60)}:${String(minuten % 60).padStart(2, "0")}`;
