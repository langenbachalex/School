# Runner-Figur – Vorschläge „lustiger + bessere Proportionen“ (29.10.)

> **Status (29.10.): umgesetzt** – Entscheidungen von Mr. Alex sind in `app/klasse9/runner.js` (`zeichneFigur`) eingebaut: Proportionen aus `zeichneFigurNeu` (Figur ≈ 8 % höher, Trefferbox angepasst), alle 9 Frisuren, 6 Bärte (Bart = Auswahl, `an` → `schnauzer`), 8 Haarfarben, dazu Körper-Übertreibungen (Giraffenhals, Kugelbauch, Hulk, Riesenfüße), Schmuck größer, Hut sitzt immer auf dem Kopf (keine Luft; Frisur darunter gestaucht oder hinten/oben herausragend), Riesen-Afro größer und lockiger. Gesichtsausdruck ist **keine Skin-Option**, sondern Spielreaktion (erstaunt bei Treffer, Zunge bei 5× Combo/On fire; „cool“ = Sonnenbrille-Skin). Preise: 30 🪙, Showstücke 60 🪙 (Mohawk, Regenbogen, Riesen-Afro, Giraffenhals, Hulk, Kugelbauch, Riesenfüße, Fu-Manchu); Wuschelkopf und Pink frei. Ergebnis: `04-umgesetzt.png` (aus der echten runner.js-Funktion). Details: `docs/runner/konzept-entwurf.md` „Figur v2 übernommen“. Die Blätter 01–03 und `zeichne.html` bleiben als Entwurfsstand.

Rückmeldung Mr. Alex (Englisch, Klasse 9): Figur soll lustiger werden können (Frisuren, Schnurrbärte, Haarfarben); Übergang Gesicht → Körper wirkt unförmig.
Hier nur **Vorschläge als Grafik** – `app/klasse9/runner.js` ist unverändert.

## Dateien
- `zeichne.html` – eigenständig (eine HTML-Datei, Canvas, keine Abhängigkeiten). Enthält `zeichneFigurAlt` (wörtliche Kopie aus runner.js) und `zeichneFigurNeu` (Vorschlag) und zeichnet die drei Blätter. Im Browser öffnen, fertig.
- `01-proportionen.png` – alt gegen neu, groß (330 px) und in Spielgröße 80 px (stehen, 3 Laufphasen, Sprung, Körper kräftig/schmal).
- `02-frisuren-baerte.png` – 9 Frisuren + 6 Bärte (+ eine Kombination mit Zylinder), je groß und in 80 px.
- `03-farben-gesichter.png` – 8 Haarfarben (an Wuschelkopf und „lang“) + 4 Gesichtsausdrücke (+ 3 Kombinationen), je groß und in 80 px.
- `04-umgesetzt.png` – **Stand nach Umsetzung** (29.10.): sechs lustige Kombis, Körper-Übertreibungen und die drei Spiel-Gesichter, gezeichnet mit `Runner.zeichneFigur` aus `app/klasse9/runner.js`, groß und in 80 px.
- `05-afro-klein.png` – **Riesen-Afro neu** (29.10., Entscheidung Mr. Alex): kompakte Glocke ≈ 1,7× Kopf, Hütchen (Faktor 0,5) oben auf der Kante, mit Cap/Cowboy/Zylinder/ohne Hut, daneben der normale Afro; aus der echten `runner.js`-Funktion.

Gerendert mit Playwright/Chromium (Skript im Scratchpad, nicht im Repo).

## Was an den Proportionen geändert wurde (`zeichneFigurNeu`)
Koordinaten weiter in Einheiten von h/80, Fußpunkt (0,0); Ebenenfolge wie bisher (Beine → Shorts → hinterer Arm → **Hals** → Torso → vorderer Arm → Haare hinten → Kopf → Gesicht → Bart → Haare vorn → Haarschmuck → Hut).

| | alt | neu |
|---|---|---|
| Kopf | Kreis r 12,5, Mitte −68, sitzt direkt auf der Schulterlinie (−60) | Ellipse 13 × 13,5, Mitte −74, plus runder Wangen-/Kinnkreis; Kopf ≈ 27 von ≈ 88 Gesamthöhe ≈ 1/3 |
| Hals | keiner | sichtbar, Breite 8,5, von −64 bis −53, Schatten unter dem Kinn, Kragen am Ausschnitt |
| Schultern | gerade Linie, Armgelenk bei −54 (im Kopf-/Halsbereich) | gerundete Schultern ab −54, Halbbreite 11/13/16 (immer > Hals 4), Armgelenk auf (1, −49) |
| Torso/Shorts/Beine | −60…−32 / −40…−24 / ab −34 | −54…−29 / −36…−21 / ab −30 (Beinlänge gleich, Figur insgesamt ≈ 7 Einheiten höher) |
| Auge | r 3,4, keine Braue | r 4,4 (+ Glanzpunkt) mit Augenbraue in Haarfarbe |
| Mund | kleiner Strich-Bogen | offenes Grinsen mit Zahnreihe; je Ausdruck anders |
| Nase/Ohr | wie alt | etwas größer, Ohr als Ellipse mit Innenschatten, Wangenröte |

Alle bisherigen Skin-Werte (kurz/lang/Zopf/Locken/Afro, Cap/Cowboy/Zylinder, Brille, Nase, Kette, Ohrring, Schleife, Haarband, Hoodie, Bauch/Brust/Muskeln) sind in `zeichneFigurNeu` übernommen (Hüte sitzen über große Frisuren per Offset-Tabelle `hoch`). Aura/Power-Aura sind in der Kopie weggelassen (nur Zeichenprobe); sie wären 1:1 übertragbar.

## Vorschläge (Skin-Werte)
**Frisuren** (`haar`): `irokese` Irokese · `riesenafro` Riesen-Afro · `tolle` Elvis-Tolle · `zoepfe` Zöpfe mit Schleifen · `dutt` Dutt oben · `mohawk` Regenbogen-Mohawk (immer bunt, unabhängig von der Haarfarbe) · `wuschel` Wuschelkopf · `dreihaare` Glatze mit drei Haaren · `flattop` Flat-Top
**Bärte** (`bart`, bisher nur aus/an): `zwirbel` Zwirbelbart · `walross` Walross · `fumanchu` Fu-Manchu · `schnauzer` Schnauzer (= bisheriges „an“) · `kinnbart` Kinnbart · `monobraue` Monobraue + Schnauzer
**Haarfarben** (`haarfarbe`, eigene Tabelle `HAARFARBEN`): `pink` · `türkis` · `lila` · `neongrün` · `feuerrot` · `blau` · `regenbogen` (senkrechter Verlauf) · `silber` – Bart und Augenbraue übernehmen die Haarfarbe (Braue bei blond/silber/regenbogen dunkelbraun, sonst unsichtbar)
**Gesichtsausdrücke** (`gesicht`, neu): `grinsend` (Standard) · `cool` (große Sonnenbrille + schiefes Lächeln) · `erstaunt` (großes Auge, Braue hoch, O-Mund) · `zunge` (Auge zugekniffen, Zunge raus)

## Empfehlung: frei vs. Shop (30 🪙)
Regel in runner.js: die ersten `frei` Werte einer Option (Standard 2) sind frei, der Rest ist `skin_<key>_<wert>` für 30 Coins. Vorschlag:

| Option | frei (Grundausstattung) | Shop-Artikel (30 🪙) |
|---|---|---|
| Frisur | kurz, lang (wie bisher) + **Wuschelkopf** (`frei: 3`) | Zopf, Locken, Afro, Irokese, Riesen-Afro, Elvis-Tolle, Zöpfe, Dutt, Flat-Top, Glatze mit drei Haaren, **Regenbogen-Mohawk** (ggf. teurer, z. B. 60, als „Showstück“) |
| Bart | aus, Schnauzer | Zwirbel, Walross, Fu-Manchu, Kinnbart, Monobraue |
| Haarfarbe | braun, blond, schwarz, rot (bisherige; `frei: 4`) + **Pink** als Köder | Türkis, Lila, Neon-Grün, Feuerrot, Blau, Silber, Regenbogen |
| Gesicht | grinsend, cool | erstaunt, Zunge raus |

Begründung: Wuschel und Pink machen die Figur sofort lustiger ohne Kauf (Motivation gleich am Anfang); die auffälligsten Stücke (Mohawk, Regenbogen, Walross, Fu-Manchu) bleiben Sparziele. „cool“ kann die bisherige Option `brille` ersetzen (bei Übernahme: `brille: an` → `gesicht: cool` migrieren) oder daneben bestehen bleiben.

## Aufwand für die Übernahme in runner.js
Die Ebenen-Struktur bleibt; `zeichneFigurNeu` hat die gleiche Signatur `(c, x, y, h, s, pose, t)` und kann `zeichneFigur` ersetzen.
1. `zeichneFigur` durch die neue Funktion ersetzen, Aura/Power-Aura-Block wieder einfügen, `FARBEN` um `HAARFARBEN` ergänzen (Oberteil/Schuhe behalten ihre Tabelle) – ca. 1,5 h inkl. Nachkontrolle in `app.js` (Vorschau zeichnet mit `hoehe*0.78`; Figur ist ≈ 8 % höher, Vorschau-Rahmen prüfen).
2. `SKIN_GRUPPEN` erweitern (Werte, Namen G/E, `frei`), `SKIN_STANDARD.gesicht`, `SPRECH`-Einträge für die Skin-Stimme (Liste `docs/runner/skin-stimme.txt`) – ca. 1 h.
3. Shop: Artikel entstehen automatisch aus `skinArtikel(key, wert)`; prüfen, ob die App-Shopliste/Preisliste die neuen Werte aufnimmt und ob `bart` von Ja/Nein auf Auswahl umgestellt werden muss (bestehende Spielstände mit `bart: "an"` → `schnauzer`) – ca. 1 h.
4. Spieltest in 80 px (Lauf, Sprung, Combo-Flammen, Boss-Overlay), Hut-Offsets über großen Frisuren feinjustieren – ca. 1 h.
Gesamt geschätzt **4–5 h**. Nicht geprüft: Verhalten mit `power`/`muskeln: kräftig` in allen Kombinationen und das Zusammenspiel mit der Kollisionsbox (sie hängt nicht an der Zeichnung, Figur ist aber optisch höher).

## Offene Fragen
- Soll die Figur wirklich ≈ 8 % höher werden (Kopf 1/3) oder bei gleicher Gesamthöhe der Körper schrumpfen? (Letzteres macht Beine/Shorts in 80 px kleiner.)
- `gesicht` als eigene Option oder nur als Reaktion im Spiel (erstaunt bei Treffer, Zunge raus bei Combo)? Beides ist mit derselben Zeichnung möglich.
- Regenbogen-Mohawk: eigene Frisur (so gezeichnet) oder nur Irokese + Haarfarbe Regenbogen? Letzteres spart einen Wert, verliert aber die Streifen.
- Hut + große Frisur (Riesen-Afro, Mohawk, Tolle): Hut darüber (so gezeichnet, wirkt teils albern) oder Hut sperrt die Frisur?
- Preise: alles 30 🪙 oder Staffel (30 / 60 für Showstücke)?
- Namen G/E für die neuen Werte sind noch nicht festgelegt (Vorschlag: Irokese/mohawk, Riesen-Afro/giant afro, Tolle/quiff, Zöpfe/pigtails, Dutt/bun, Wuschel/messy, drei Haare/three hairs, Flat-Top/flat top; Zwirbel/handlebar, Walross/walrus, Fu-Manchu/Fu Manchu, Kinnbart/goatee, Monobraue/unibrow).
