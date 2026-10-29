# Gamification – Konzept zum Absegnen (Stufe A)

Stand: 12.10.2026. **Abgesegnet.** Klasse 6 gebaut (Bilder: Gemini, Stil D; Audio: Mr. Alex). Klasse 9 gebaut (Landmark-Fotos: Carol M. Highsmith, Library of Congress; USA-Karte: US Census Bureau / us-atlas; Fun Facts und Steckbriefe: Jeremy B./Jessica; Titel und Serien: Mr. Alex).
Grundsatz: kein gegenseitiger Wettbewerb, keine Bestenliste. Jeder sammelt für sich. Alles bleibt nur auf dem Gerät (kein Konto, keine Namen).

## 1. Für beide Apps

### Punkte
- Fertiger Teil: **10 Punkte**. Station / Thema komplett: **+50**.
- Beide Klassen: **+5 „ohne Hilfe“**, wenn kein 💡 benutzt wurde (Klasse 6 seit 29.10., bisher nur bei den true/false-Hörübungen mit 💡; Teile ohne Hilfen bekommen den Bonus automatisch). Hilfen kosten nie Punkte.
- Punkte gibt es nur für Teile, die bis zum Ende gemacht wurden. Durchklicken oder Springen bringt nichts.
- **Sprechzeit (13.10.):** Bei Sprechübungen ist „Weiter“ gesperrt, bis der Satz gehört und die Sprechzeit (Balken „Jetzt du!“) abgelaufen ist. „Lösung“ kommt erst nach einer Denkzeit (3–8 s je nach Satzlänge). Wer einen Sprechteil trotzdem viel zu schnell beendet (unter 2 s pro Satz, 1,5 s pro Wort), bekommt kein Lob und keine Punkte, sondern „Zu schnell! Versuch es noch mal“.

### ⚡ Power Up (29.10.2026, beide Apps)
Erledigte Teile bleiben nicht für immer grün: nach **30 / 60 / 120 Tagen** (Stufe 0 / 1 / 2, ab Stufe 3 nie mehr) wird ein Teil **fällig** – Kachel, Abschnitt und Teil zeigen dann ein gelbes Schild „⚡ Power Up“ statt ✓, die Startseite eine Zeile „⚡ 3 Teile fast leer – aufladen!“ mit Sprung zur ersten fälligen Kachel. Erneut durchmachen: **5 Punkte** (Wiederholung), Toast „⚡ Aufgeladen!“, Stufe +1, zählt als Übungstag. Wer ein Teil schon kennt, bekommt kürzere Sprech-, Denk- und Mindestzeiten (50 % / 35 % / 25 % je Stufe). 14 Tage vor einem GLN-Termin (`TERMIN` mit `powerup`) ist alles fällig, was nicht in diesem Fenster gemacht wurde. Punkte, Titel und Abzeichen gehen nie verloren; nur „All stations“ / „All categories“ gilt, solange nichts fällig ist. Details: `docs/nachhaltigkeit-entwurf.md`.

### 🪙 Coins und 🛍️ Shop (29.10.2026, beide Apps)
- **Coins** sind eine gespiegelte Währung: Jeder Punkt, der über `punkteDazu` kommt (Teile, Word Gym, Serien, Boni), bringt zugleich **einen Coin**. Punkte bleiben stehen und tragen Titel und Serien; Coins sinken nur durch Einkäufe im Shop.
- **Nicht rückwirkend:** Die Zählung beginnt mit dem Update. Ein älterer Spielstand ohne `coins` startet bei 0 – alte Punkte bringen keine Coins (Beschluss 29.10.).
- **Anzeige:** Startkarte neben den Punkten („🪙 0“), Sammlung im Titel-Schild („🪙 Coins: 0 · ausgegeben: 0“ mit Shop-Knopf), Toast bei jedem Punktgewinn („+10 ⭐ · +10 🪙“).
- **Speicher:** `stand.spiel.coins`, `stand.spiel.gekauft` (Liste der Artikel-IDs), `stand.spiel.ausgegeben`, `stand.spiel.rahmen` (angelegter Rahmen). Alles liegt in `spiel` und damit im Siegel (v2) – Handänderungen am Coins-Stand werden wie Punktänderungen behandelt.
- **Shop** („🛍️ Shop“): Klasse 9 als Kachel in **Games** und als Knopf in der Sammlung; Klasse 6 als Knopf auf der Startseite neben „Meine Sammlung“ und in der Sammlung. Oben der Coins-Stand, darunter die Artikel als Kacheln mit Preis. **Nichts ist gratis.** Kauf nur mit genug Coins (sonst gesperrter Knopf „Noch 60 Coins“; die Sperre gilt im Programm, nicht nur am Knopf), Bestätigung („Für 50 Coins kaufen?“), dann Toast „🪙 −50“ und Konfetti.
- **Artikel** (Liste `SHOP` in `werkzeuge/daten_bauen.py` bzw. `werkzeuge/klasse9_bauen.py`, erweiterbar):

| Artikel | Preis | Stand |
|---|---|---|
| 🎮 Runner-Ticket | 100 Coins | „kommt bald“ – sichtbar, noch nicht kaufbar („Das Spiel kommt bald. Spar schon mal!“) |
| 🎨 Rahmen für dein Titel-Schild – Rot / Blau / Grün | je 50 Coins | kaufbar; wirkt sofort als farbiger Rahmen auf Titel-Schild (Sammlung) und Startkarte; gekaufte Rahmen lassen sich gratis wechseln („Anlegen“) |
| 🔊 Extra-Stimme beim Lob | – | **nicht** gebaut (kein Audio bis zu den neuen Credits) |

- **Offen:** Wertigkeit der Coins und Preise nach Schüler-Feedback (Ideenspeicher „Coins: Wertigkeit und Zeitkopplung“); Runner-Belohnung; Name des Shops.

### 📝 Homework (29.10.2026, beide Apps)
Mr. Alex trägt die Hausaufgabe als Zeile in `inhalte/hausaufgabe.tsv` (Klasse 6) bzw. `inhalte/klasse9/hausaufgabe.tsv` (Klasse 9) ein: `von	bis	ziel	text`. `ziel` ist eine ganze Station/Kategorie (`6`), eine Gruppe (`6/3`, `2/u2:Start`, `1/Task words`) oder ein Teil (`7/Topic 1 · Teil 1/2`) – Schema mit Beispielen in der `LIESMICH.md` neben der TSV. Das Bauskript prüft jedes Ziel gegen die Daten (Abbruch mit Liste der Möglichkeiten) und schreibt `D.hausaufgaben` mit den aufgelösten Teilschlüsseln. Kein Server: alle Schüler sehen dieselbe Hausaufgabe.
- **Gültig** ist eine Zeile von `von` bis `bis` (beide Tage, Ortszeit; mehrere gültige → die mit dem frühesten `von`). Außerhalb ist nichts zu sehen und es gibt keinen Bonus.
- **Anzeige** im Zeitraum: (a) Knopf „📝 HW“ oben in der Leiste neben dem Tempo-Knopf (Klasse 6 `.tempo-leiste`, Klasse 9 `.niveau-leiste`), Antippen = Direktsprung zum Ziel (Station/Gruppe/Teil). (b) Auf der Startseite eine schmale **Chip-Zeile** direkt über der Word-Gym-Karte (Beschluss 29.10.: keine große Karte): roter Chip „📝 HW“ (`.hw-chip`) plus Text in einer Zeile „Hörübung 3 „Talking about free time“ · bis So 8.11. · +50 %“ (E-Kurs: „due Sun 8 Nov“), auf dem Handy mit … gekürzt. (c) Am Ziel ein Schild „📝 HW“ wie ✨/⚡: auf der Kachel der Station/Kategorie, auf der Gruppen-Kachel, im Kopf des Teils und an den Teilen der Sprungleiste („📝“).
- **Erledigt** = alle Teile des Ziels sind fertig (`stand.teile`) oder wurden in diesem Zeitraum gemacht → Chip grün mit „📝 HW ✓“, Text „Erledigt: …“ / „Done: …“, Knopf in der Leiste „📝 HW ✓“. Games (Klasse 9) haben keine Teile: nur Sprung und Schild, nie „Erledigt“.
- **Bonus +50 %:** Wird ein Teil der gültigen Hausaufgabe im Zeitraum abgeschlossen, kommen auf die Teil-Punkte (10 bzw. 5 Wiederholung, plus 5 ohne Hilfe) **50 % aufgerundet** dazu (`Math.ceil(basis / 2)`): 15 → +8 = 23, 10 → +5 = 15, 5 → +3 = 8. Toast „📝 Homework +8“. Serien-, Wochenend- und Einheiten-Boni bleiben unverändert; Coins laufen über `punkteDazu` mit. Jeder Teil nur **einmal je Hausaufgabe**: `stand.hw["<von>|<ziel>"] = [Teilschlüssel …]`. Word Gym bekommt keinen HW-Bonus (ist kein Ziel).
- **Siegel v3:** `stand.hw` steckt im Siegel (Reihenfolge spiel, gym, erledigt, teile, hw). Ältere Stände (v1 ohne teile, v2 ohne hw) werden mit ihrer Version geprüft und beim nächsten Speichern als v3 gesiegelt; ein von Hand geändertes `hw` wird wie jede Manipulation behandelt (Sicherung zurück + Banner).
- Test: Scratchpad `hw.js` (beide Klassen: Knopf, Chip-Zeile, Sprung, Schild, 23 Punkte, zweites Mal kein Bonus, Erledigt, außerhalb nichts, v2 → v3, manipuliertes hw).
- **Offen:** mehrere Hausaufgaben gleichzeitig (Liste statt Zeile), Erinnerung am Vorabend (ohne Server nur bei offener App).

### 🔥 Mini-Reward beim Vokabellernen (29.10.2026, beide Apps)
Nur Show, keine Punkte. Gilt im **Word Gym** und in der **Vokabelabfrage** (Klasse 9: Vocabulary-Abfrage; Klasse 6: Abfrage, Bild → Wort, Lückensatz). Ab **3 richtigen in Folge** (`richtigSerie`) erscheint neben dem Zähler eine Mini-Flamme „🔥 3 🪙“, die mit jedem Treffer etwas wächst. Bei jedem weiteren Treffer eine kleine Animation im Wechsel: (a) Flamme ploppt groß, (b) „🪙 +Combo“ – Münzen fliegen ins 🪙 der Flamme, (c) ein 🚗 (Klasse 9) bzw. 🚌 (Klasse 6) flitzt einmal quer über den Bildschirm. Ein Fehler („Nochmal“, falsche Wahl) lässt die Flamme verpuffen (💨) und setzt die Serie auf 0. Bei `prefers-reduced-motion` nur der Text. Combo-Sprüche mit Stimme folgen mit den Credits (Audio-Vormerkliste).

### Serien (Mr. Alex besonders wichtig)
| Serie | Bedingung | Belohnung |
|---|---|---|
| 🔥 On fire | 3 Schultage am Stück | +30 Punkte, Flammen-Abzeichen |
| ⭐ Perfect week | an **jedem Schultag** der Woche (Mo–Fr) mindestens 1 Teil fertig | **große Wochenbelohnung** (Klasse 6: Superheld, Klasse 9: Landmark-Karte) |
| 🏖️ Weekend bonus | Übung am Samstag oder Sonntag | +20 Punkte; wer am Wochenende nicht übt, verliert nichts |
| 🌴 Holiday bonus | Übung an einem Ferien-, Feiertags- oder Brückentag unter der Woche (16.10.) | +20 Punkte und Abzeichen „Holiday hero“; an Wochenenden gilt nur der Weekend-Bonus; zählt nicht für Serien |
| 👑 Perfect month | 4 perfekte Wochen hintereinander | Spezial-Abzeichen und goldener Rahmen um den Titel |
| 🏅 5 × perfect | insgesamt 5 perfekte Wochen (auch mit Lücken) | Sammel-Abzeichen |

- Ein Tag zählt, wenn mindestens **ein Teil fertig** wurde.
- Die Woche beginnt am Montag. Nach Sonntag startet die neue Woche.
- **Ferien, Feiertage und freie Brückentage zählen nicht als Schultage.** Eine Woche mit nur 3 Schultagen ist perfekt, wenn an diesen 3 Tagen geübt wurde. Eine Woche ganz ohne Schultage (Ferien) **hält die Serie an**, statt sie zu brechen.

### Titel
Aufstieg nach Punkten. Beim Aufstieg spricht Mr. Alex ein Lob, dazu Konfetti.

### Seite „Meine Sammlung“
Karte bzw. Karten-Album, Titel mit Fortschrittsbalken, Wochen-Kalender (Mo–Fr mit 🔥) und Abzeichen.

## 2. Klasse 6 – London und tierische Superhelden

- **London-Karte (täglich):** Jeder fertige Teil schaltet einen Ort frei (ca. 25 Orte: Big Ben, Tower Bridge, London Eye, Buckingham Palace, Tower of London, Hyde Park, Camden Market, Wembley …). Zu jedem Ort gibt es einen **Fun Fact in Mr. Alex' Stimme**.
- **Tierische Superhelden (Perfect week):** etwa 10 Karten, männlich und weiblich gemischt. Die Fähigkeit ist im Bild klar zu sehen. Jede Karte hat einen **Steckbrief auf Englisch** (he/she/it + s, *can*). Ideen:
  - Leo the Lion – superschnell
  - Camilla the Camel – superstark
  - Ellie the Elephant – Supergedächtnis
  - Olivia the Owl – sieht im Dunkeln
  - Kenji the Kangaroo – Riesensprünge
  - Zara the Zebra – unsichtbar
  - Penny the Penguin – Eiskräfte
  - Felix the Falcon – fliegt um die Welt
  - Tessa the Turtle – unzerstörbar
  - Max the Monkey – Erfinder-Genie
- **Alle Karten voll:** Team-Poster aller Superhelden und eine persönliche Audio-Botschaft von Mr. Alex.
- **Titel (geändert 12.10., Vorschlag A):** 🧈 Butterfingers → 🎒 Sidekick → 🦸 Hero in Training → ⚡ Hero → 🌟 Superhero → 👑 **Mega Hero**

## 3. Klasse 9 – USA

- **USA-Karte (täglich):** 50 Staaten. Jeder fertige Teil schaltet einen Staat frei, mit Fun Fact (Jeremy B. / Jessica). Start in New York (Unit 1), Unit 3 führt nach Kalifornien.
- **Landmark-Karten (Perfect week):** Statue of Liberty, Golden Gate Bridge, Grand Canyon, Route 66, Hollywood Sign, Mount Rushmore, Niagara Falls, Yellowstone … Jede Karte mit kurzem Steckbrief. Alle voll: Urkunde „Great American Road Trip complete“.
- **Titel:** Freshman → Sophomore → Junior → Senior → Graduate → **All-American Legend**

## 4. Freie Tage Saarland (Schuljahr 2026/27)

Quelle: kalenderpedia.de (ohne Gewähr; schulinterne Tage werden nicht berücksichtigt).

| Art | Datum |
|---|---|
| Herbstferien | 5.–16.10.2026 (in den Apps zählen ab 12.10. die Wochentage schon als Schultage, damit man in den Ferien Serien sammeln kann) |
| Weihnachtsferien | 21.12.2026 – 3.1.2027 |
| Winterferien (Fastnacht) | 8.–12.2.2027 |
| Karfreitag / Ostermontag | 26.3. / 29.3.2027 |
| Osterferien | 30.3.–9.4.2027 |
| Christi Himmelfahrt + Brückentag | Do 6.5. + Fr 7.5.2027 |
| Pfingstmontag | 17.5.2027 |
| Fronleichnam + Brückentag | Do 27.5. + Fr 28.5.2027 |
| Sommerferien | 28.6.–6.8.2027 |

Feiertage am Wochenende (1.11.2026, 1.5.2027) spielen keine Rolle. Für das nächste Schuljahr trage ich die Termine rechtzeitig nach.

## 5. Bilder

- Die Superhelden und Landmark-Karten erstelle ich mit **Canva-KI**.
- Der Stil soll **reifer** sein als der erste Probe-Entwurf. Dazu gibt es vier Vorschläge: `stil-a-esports.jpg`, `stil-b-kino.jpg`, `stil-c-graphic-novel.jpg` und `stil-d-sammelkarte.jpg`.
- Keine Embleme oder Zeichen, die an bekannte Superhelden erinnern.
- Die Karten selbst (Rahmen, Name) zeichnet die App einheitlich.

## 6. Aufwand und Credits

- **Bau:** etwa 2 Tage pro App.
- **Audio:** etwa 8.000 Zeichen. London-Fakten in Mr. Alex' Stimme, Staaten-Fakten und Steckbriefe mit den bisherigen Stimmen.
- **Grenze:** Wer auf zwei Geräten übt, hat zwei getrennte Sammlungen.
