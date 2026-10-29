# Runner – Konzept-Entwurf (Road Trip Run / London Run)

Stand: 29.10.2026. Abschnitte 1–12: Konzept und Prototyp. **Abschnitt 13: Welt 1 (New York) ist seit 29.10. in der Klasse-9-App spielbar.**

**Anfassen:** `docs/runner/prototyp/index.html` – eine Datei, läuft per Doppelklick (Laptop) und auf dem Handy (am besten quer). Stil-Proben: `stil-a-cartoon.png`, `stil-b-foto.png`, Figur-Skins: `figur-skins.png`.

## 1. Steuerung
- **Auto-Runner:** Die Figur läuft von selbst nach rechts. Ein Finger reicht.
- **Tippen / Leertaste = springen**, **länger halten = höher** (kurzer Tipp ≈ 1 Kistenhöhe, voll gehalten ≈ 2 Kisten bzw. Plattformhöhe). Im Prototyp: Tipp ≈ 72 Einheiten, voll gehalten ≈ 144 Einheiten bei 80 Einheiten Figurhöhe.
- Gegner kann man **überspringen oder von oben plattdrücken** (Giana-/Mario-Gefühl). Berührung von der Seite = ein Leben weg.
- Kisten von der Seite blockieren den Lauf, man muss drüber.
- Boss-Frage: drei Antwortknöpfe (Touch) oder Tasten 1–3.

## 2. Level-Aufbau
- **Welt = Staat/Landmark** (Klasse 9: New York → Statue of Liberty, Kalifornien → Golden Gate, Arizona → Grand Canyon … entlang der vorhandenen Landmark-Reihenfolge; Klasse 6: London-Stationen).
- **1 Level = 60–90 s** Laufzeit. Bei 230 Einheiten/s sind das 14.000–20.000 Einheiten Strecke. Der Prototyp ist bewusst kürzer (≈ 7.900 Einheiten, ≈ 35 s), damit man alles schnell sieht.
- Bausteine je Level: Boden mit Lücken (Wasser/Schlucht), schwebende Plattformen, Kisten (einzeln und gestapelt), 2 Gegnerarten je Welt (New York: Taube und Waschbär), 8–10 Wort-Diamanten, 1–2 Frage-Tore, am Ende Endboss + Tür.
- **Levelziel passend zum Landmark:** Kulisse zeigt das Landmark (Silhouette, kommt per Parallaxe näher), die Tür am Ende trägt das Landmark-Emblem, Abschluss „You found the Statue of Liberty!“.
- Checkpoints: nach einem Sturz geht es am letzten festen Boden weiter (nicht am Levelanfang), damit der Frust klein bleibt.

## 3. Wortschatz-Einbindung
Drei Stufen, von passiv bis aktiv:
1. **Wort-Diamanten (passiv):** Jeder Diamant trägt ein Wort der aktuellen Unit. Beim Einsammeln: Klang, Wort groß eingeblendet (Englisch + Deutsch), Wort gesprochen. Im Prototyp Geräte-Stimme (`speechSynthesis`, abschaltbar), später die Aufnahmen aus der App (Unit-Wörter sind für Klasse 9 größtenteils vertont).
2. **Frage-Tor (wählen):** Oben steht das deutsche Wort („Welcher Diamant heißt ‚Aufzug'?“), drei goldene Diamanten auf drei Höhen tragen englische Wörter; unten = laufen, Mitte = kurzer Sprung, oben = langer Sprung. Der erste berührte Diamant zählt. Richtig = Extra-Diamant + Klang; falsch = Buzzer + Einblendung der richtigen Lösung, **kein Lebensverlust** (Vorschlag: falsch = kurz langsamer, wie im Spiele-Konzept).
3. **Endboss (antworten):** Der Boss (New York: Alligator aus der Kanalisation; weitere: Grizzly, Kojote, Klapperschlange …) stellt eine Frage („Was heißt ‚Bücherei'?“), drei Antworten. Richtig = Tür geht auf, Level geschafft. Falsch = ein Leben weg und neue Frage. Fragen kommen aus den Wörtern des Levels, also aus dem, was man gerade eingesammelt hat.

Wortquelle: `inhalte/klasse9/vokabeln.tsv` (Spalten `englisch`, `deutsch`, dazu `satz_en`/`satz_de` für spätere Satz-Fragen). Der Prototyp nutzt 8 Wörter aus Unit 2: lion, library, trust, incredible, elevator, locker, highlight, promise. Für die Klasse-6-App dieselbe Logik mit deren Wortlisten.

## 4. Leben und Scheitern
- **3 Leben** pro Eintritt. Verlust durch Sturz (Wasser/Schlucht), Gegner von der Seite, falsche Boss-Antwort.
- 0 Leben = „Game over“, Diamanten/Wörter des Durchgangs bleiben sichtbar (Lerneffekt bleibt), neuer Eintritt kostet wieder Coins.
- Shop-Artikel „zweites Leben“ (schon im Ideenspeicher): +1 Herz am Start.
- Schwierigkeit: Level 1 ohne Doppelsprung-Pflicht; spätere Level mit engeren Lücken und schnelleren Gegnern. Tempo konstant, damit die Sprache lesbar bleibt.

## 5. Belohnung: Trophäen und Runner-Titel (keine Coins zurück)
- **Trophäe je Level** (Landmark-Pokal, z. B. „Liberty Finder“), sichtbar auf der Landmark-Karte / in der Hall of Fame. Gold, wenn alle Diamanten und das Tor richtig; Silber sonst.
- **Runner-Titel** (Vorschlag, nach Zahl geschaffter Level): Rookie Runner → Highway Hopper → Landmark Hunter → State Crosser → Coast-to-Coast Legend. Klasse 6: Rookie Runner → Tube Jumper → Bus Hopper → London Hero → Superhero of London.
- Der Titel steht neben dem Punkte-Titel, ersetzt ihn nicht. Keine Punkte, keine Coins aus dem Runner.

## 6. Eintritt (Coins)
- Eintritt pro Durchgang, Vorschlag **20 Coins** (≈ ein Word-Gym-Tag; Wertigkeit ist im Ideenspeicher noch offen). Wird beim Start abgebucht, auch wenn man scheitert.
- Nichts gratis (Beschluss 29.10.). Der Prototyp zeigt nur den Text „Eintritt: 20 Coins“, es gibt noch kein Wallet.
- Technisch: Wallet/Shop kommen aus dem parallelen Coins-Umbau; der Runner fragt nur `coins >= preis` und bucht ab.

## 7. Skins – wie sie als Ebenen funktionieren
Die Figur ist **keine Grafikdatei**, sondern wird im Canvas aus Vektor-Ebenen gezeichnet (Prototyp: Funktion `zeichneFigur`). Reihenfolge von hinten nach vorn: Aura → hinteres Bein → Shorts → vorderes Bein → hinterer Arm → Oberteil → vorderer Arm → Kopf (Ohr, Nase, Mund) → Auge/Brille → Schnurrbart → Frisur → Hut. Jede Ebene liest ihre Variante und Farbe aus einem Skin-Objekt, z. B. `{haar:'zopf', hut:'cap', brille:'an', top:'hoodie', topfarbe:'rot', aura:'an'}`. Ein neuer Skin ist eine kleine Zeichenfunktion plus ein Shop-Eintrag, keine Bilddatei.

Sichtbarkeit bei Spielgröße (Figur = 1/5 der Bildhöhe, auf dem Handy quer ≈ 80 px): Hüte, Frisuren, Brille, Oberteil-Farbe, Aura und Schuhfarbe sind klar erkennbar (siehe `figur-skins.png`, rechts die Spielgröße). Schnurrbart, Nase, Ohrringe/Kette sind bei Spielgröße nur schwach zu sehen – sie lohnen sich eher für die große Vorschau im Menü/Shop.

Liste aus dem Ideenspeicher, Stand im Prototyp:
| Skin | Prototyp | Bemerkung |
|---|---|---|
| Frisuren | kurz, Zopf, Locken + 4 Haarfarben | Zopf wippt beim Laufen |
| Hüte | Cap, Cowboyhut, Zylinder | weitere: Krone, Mütze, Helm |
| Sonnenbrille | an/aus | gut sichtbar |
| Schnurrbart | an/aus | bei Spielgröße klein |
| Oberteile | T-Shirt, Hoodie + 4 Farben | Muster/Logo möglich |
| Shorts | eine Variante | Farbe später wählbar |
| Schuhe | weiß, rot, schwarz | |
| Aura (Superkraft) | an/aus (gelb, pulsiert, Funken) | je Superheld eigene Farbe/Form |
| Nase, Ohrringe/Kette, Haarschmuck, Accessoires | noch nicht | Ebenen vorbereitet (Kopf/Hals), ein paar Stunden je Teil |
| Autos mit Stickern | nicht im Runner | Autos gehören zum Road-Trip-Meter/Word Race, Sticker sind dort eine eigene Ebene |

## 8. Audio-Bedarf (Zeichen je Stimme, grob)
Alles zunächst ohne Audio; Texte werden in die Vormerkliste im Ideenspeicher übernommen (dort steht für den Runner „je ≈ 1.500“).
| Posten | Stimme | Zeichen |
|---|---|---|
| Diamant-Rufe („A lion!“, „Elevator!“ – 10 Wörter × 5 Level) | Jeremy, Jessica | je ≈ 600 (vorhandene Wortaufnahmen können einen Teil ersetzen) |
| Tor-Ansagen („Which one is ‚Aufzug'?“, „Correct!“, „Oops – it's elevator.“) | Mr. Alex | ≈ 300 |
| Boss-Fragen + Sprüche (5 Bosse × 3 Sätze) | Mr. Alex (Boss-Stimme) | ≈ 900 |
| Levelstart/-ende („Let's find the Statue of Liberty!“, „We made it!“) | Jeremy, Jessica | je ≈ 400 |
| Lob/Trost (5 Sätze) | Mr. Alex | ≈ 250 |
| **Summe** | | **Jeremy ≈ 1.000 · Jessica ≈ 1.000 · Mr. Alex ≈ 1.450** |
Klasse 6 (London Run) noch einmal ähnlich für Mr. Alex (≈ 1.500). Alle Klänge (Sprung, Diamant, Buzzer, Fanfare) kommen aus Web Audio, keine Dateien, keine Credits.

## 9. Aufwandsschätzung für die Integration
Prototyp ist da (≈ 800 Zeilen, keine Abhängigkeiten). Übernahme in die Apps:
| Schritt | Aufwand |
|---|---|
| Runner als Modul in Klasse 9 (eigene Seite, Wörter aus der Unit, Coins-Abbuchung, Trophäe speichern) | 2 Tage |
| 5 Welten/Level mit Kulissen (Statue of Liberty, Golden Gate, Grand Canyon, Route 66, Mount Rushmore) und je 2 Gegnern + Boss | 3 Tage (ca. ½ Tag je Welt) |
| Skins + Shop-Anbindung (Ebenen gibt es, Shop-Daten und Vorschau) | 1 Tag |
| Audio einbauen, sobald vertont | ½ Tag |
| Klasse 6: London Run (Bus statt Kisten, Themse, London Eye/Big Ben, Superhelden-Aura je Held, Wortlisten Klasse 6) | 2 Tage zusätzlich |
| Test auf Schulhandys (Tempo, Touch, Ton) | ½ Tag |
| **Summe** | **≈ 7 Tage Klasse 9, + 2 Tage Klasse 6** |
Voraussetzung: Coins/Shop existieren (parallel geplant). Nicht geprüft: Leistung auf alten Schulhandys und iOS-Safari-Ton (im Prototyp nur Chromium headless: 60 fps bei 1280×800 gemessen).

## 10. Offene Fragen an Mr. Alex
1. **Grafikstil A oder B?** A = flacher Cartoon (`stil-a-cartoon.png`), alles aus Vektoren, einheitlich mit der Figur, kein Foto nötig. B = Landmark-Foto als Kulisse (`stil-b-foto.png`); Figur und Plattformen „schweben“ vor dem Foto, Text ist schwerer lesbar, pro Landmark ein Foto im Querformat nötig (die vorhandenen sind Hochformat). Empfehlung: A, mit dem Foto als Belohnungsbild am Levelende.
2. **Schwierigkeit:** Falsches Tor = nur Buzzer (Prototyp) oder auch ein Leben weg? Gegner nur ausweichen oder auch plattdrücken (Prototyp: beides)?
3. **Länge:** 60 s oder 90 s pro Level? Wie viele Diamanten (8–10)? Ein oder zwei Frage-Tore?
4. **Eintrittspreis** (20 Coins?) und Preis für das zweite Leben.
5. **Figur:** eine neutrale Figur mit Skins oder Jeremy/Jessica als Vorlagen (Prototyp: eine Figur, Jeremy-/Jessica-Vorbelegung über Skins)?
6. **Titel-Reihe** Rookie Runner → Coast-to-Coast Legend so in Ordnung?

## 11. Fassung 2 (29.10.2026) – Rückmeldung von Mr. Alex eingearbeitet
Entscheidungen:
- **Grafikstil A (Cartoon)** – beschlossen.
- **Spieldauer ≥ 2 Minuten** je Level (statt 60–90 s): ≈ 28.000 Einheiten Strecke bei 230 Einheiten/s; 12 Wort-Diamanten, 2 Frage-Tore, 2 Checkpoints, 3 Gegnerarten je Welt. Der Prototyp (≈ 35 s) wird entsprechend verlängert.
- **Boss-Zwischensequenz:** Kurz vor dem Endboss übernimmt das Spiel: Die Kamera fährt herunter/heran, die Figur läuft automatisch weiter, das Bild friert einen Moment ein, Mr. Alex spricht („It's time for Mr. Alligator!“), dann erscheint der Boss. Danach normale Boss-Frage. Während der Sequenz keine Eingabe (keine Leben-Verluste möglich).
- **Endboss-Stimme = Mr. Alex** (Boss-Intro, Fragen, „Correct – the door opens!“, „Not this time!“). Jeremy/Jessica sprechen weiterhin Diamanten und Levelstart/-ende. Mehr Mr.-Alex-Stimme in Klasse 9 ist ausdrücklich gewünscht.
- **Skin-Menü mit Stimme:** Jede Auswahl wird gesprochen („Long hair“, „Short hair“, „Curly“, „Afro“, „Cap“, „Cowboy hat“, „Sunglasses on“, „Red hoodie“ …), ≈ 40 kurze Wörter/Wendungen je Stimme (Jeremy für Jungen-, Jessica für Mädchen-Figur, oder immer die Stimme der gewählten Figur). Vormerkliste.
- **Körperform als Skin:** Bauch, Brust/Schultern und Muskeln als eigene Ebenen mit je drei Stufen (schmal · normal · kräftig). Zusätzlich **„Power-Körper“**: Mit steigenden Punkten (Titel-Stufen) wird die Figur automatisch muskulöser – sichtbar an Armen/Schultern und einer kleinen Aura; manuell kann man es im Skin-Menü wieder zurückstellen. Technisch: die Figur wird aus Vektor-Ebenen gezeichnet (`zeichneFigur`), Körperbreite/Arm-Dicke werden Parameter.
- **Eintritt:** Startwert **100 Coins** je Durchgang (Zahl von Mr. Alex, 29.10.; Konzept schlug 20 vor). Anpassung nach Schüler-Feedback, Wertigkeit bleibt im Ideenspeicher offen.
- **Belohnung:** keine Coins zurück; Trophäe je Level (Gold/Silber), Runner-Titel (Rookie Runner → Highway Hopper → Landmark Hunter → State Crosser → Coast-to-Coast Legend), freigeschaltete Skins als Levelbelohnung.
- **Probe ist unvertont** – alle Stimmen kommen erst mit den Credits (13.11.), bis dahin Geräte-Stimme oder stumm.

Nächster Schritt (Prototyp v2, ohne App-Einbau, ≈ 2 Tage): Level auf 2 Minuten verlängern (2 Tore, 12 Diamanten, 2 Checkpoints, 3 Gegner), Boss-Zwischensequenz mit Platzhalter-Text, Körperform-Ebenen + Power-Körper, Skin-Stimme über Geräte-TTS als Platzhalter, Nase/Ohrringe/Haarschmuck als weitere Ebenen, Taube überarbeiten. Danach Abnahme, dann Einbau in Klasse 9 (Coins-Abbuchung 100, Trophäen in der Hall of Fame).

Offene Fragen (Rest): Schwierigkeit (falsches Tor = Leben weg?), Figur neutral oder Jeremy/Jessica als Vorlagen, Titel-Reihe in Ordnung?

**Restfragen beantwortet (29.10.):** falsches Tor = nur Buzzer (kein Leben weg) · neutrale Figur mit Skins (keine Jeremy/Jessica-Vorlagen) · Titel-Reihe: coole, einfache Titel aus gängigen Spielen statt „Rookie Runner → …“. Vorschläge (5 Stufen, kurz, kennen die Schüler): **Noob → Rookie → Pro → Elite → Legend** (Empfehlung) · Alternativen: Bronze → Silver → Gold → Platinum → Diamond (Rang-System wie in Shootern/Fortnite) · Level 1 → Level 5 mit Sternen · Newbie → Player → Champion → Master → Legend.

## 12. Prototyp v2 (29.10.2026) – umgesetzt
Datei weiterhin `docs/runner/prototyp/index.html` (eine Datei, keine Abhängigkeiten, ≈ 1.000 Zeilen). Geprüft mit Playwright/Chromium headless (Skript im Scratchpad `test-runner.js`, 64 Prüfungen bestanden); nicht geprüft: echte Handys, iOS-Safari, echte Geräte-Stimmen.
- **Level ≥ 2 Minuten:** Strecke bis zum Boss 27.780 Einheiten, Tür bei 28.080; rechnerisch 27.780 / 230 ≈ 121 s + mindestens 7 s Zwischensequenz = ≈ 128 s. Level wird aus 28 Abschnitts-Mustern gebaut (`levelBauen`): 12 Wort-Diamanten (Unit 2: lion, library, trust, incredible, elevator, locker, highlight, promise, ancient, debate, contract, volunteer – Deutsch aus der TSV, z. T. gekürzt), 2 Frage-Tore (Aufzug → elevator bei 9.250; Vertrag → contract bei 19.450), 2 Checkpoint-Fahnen (9.900 und 20.100), 15 Gegner aus 3 Arten (Taube neu gezeichnet: kleiner runder Kopf, kurzer Schnabel, schillernder Hals, Schwanzfächer; Waschbär; **Eichhörnchen** neu, hüpft), 9 Lücken (160–200, die beiden breiten nur mit Plattform darüber), Kistenstufen/-pyramide, Dreier-Plattformen. Größter Abstand zwischen zwei Aktionen 900 Einheiten ≈ 3,9 s. Fortschrittsbalken oben mit Marken für Tore (gold) und Checkpoints (grün).
- **Abweichung Checkpoints:** Respawn nach Sturz/Gegner immer an der zuletzt passierten Fahne (Start, 9.900, 20.100) – nicht mehr am „letzten festen Boden" wie in Abschnitt 2. Dadurch kostet ein Sturz bis zu ≈ 40 s; wenn das zu hart ist, lässt sich die alte Regel wieder dazuschalten.
- **Boss-Zwischensequenz:** ab 600 Einheiten vor dem Boss (`sequenzX`) Eingabe gesperrt, keine Lebensverluste. Phasen: Zoom 1,0 → 1,4 um die Figur über 1,5 s, Figur läuft automatisch bis zum Haltepunkt (≈ 1,9 s) → Standbild 1 s → Banner „It's time for Mr. Alligator!" 2,4 s (Geräte-Stimme als Platzhalter für Mr. Alex, mit dem Stimm-Schalter abschaltbar) → Alligator steigt aus einem Kanaldeckel (1,3 s, Grollen aus Web Audio) → Zoom zurück 0,8 s → Boss-Frage wie bisher. Boss-Sprüche als Sprechblase + Zeile im Fragefenster: „Correct – the door opens!", „Not this time!".
- **Körperform:** `zeichneFigur` liest `bauch`, `brust`, `muskeln` (schmal · normal · kräftig: Schulter-/Hüftbreite, Bauchwölbung, Arm-/Beindicke, Oberarm/Oberschenkel) und `powerAura` (0–1, kleine orange Aura um die Schultern, getrennt von der gelben Superkraft-Aura). **Power-Körper nach Punkten** (Schalter, Standard an) mit Test-Regler „Punkte-Stufe 0–5": 0 = schmal, 1–2 = normal, 3+ = kräftig, ab 4 Power-Aura; Muskeln danach von Hand überschreibbar. Bild: `figur-koerper.png`.
- **Weitere Ebenen:** Nase (rund, spitz, Knubbel), Schmuck (Ohrring, Kette, beides – Gold, auch bei Spielgröße noch als Punkt erkennbar), Haarschmuck (Schleife, Haarband), zusätzlich Frisuren „lang" und „Afro". Menü in zwei Gruppen (Aussehen, Körper), Vorschau zeigt alles.
- **Skin-Stimme:** jede Auswahl wird über `speechSynthesis` (en-US) gesprochen, z. B. „Long hair", „Cowboy hat", „Sunglasses on", „Red hoodie", „Strong arms", „Power level 4"; ein Stimm-Schalter für Wörter, Skins und Boss. Alle 57 Wendungen stehen in `docs/runner/skin-stimme.txt` (eine Zeile je Wendung, für die spätere Vertonung mit Jeremy/Jessica).
- **Eintritt:** Startmenü und Game-over-Text zeigen „100 Coins". Ende-Text nennt Gold (alle 14 Diamanten inkl. Tore) oder Silber.
- **Test-Hook `window.__runner`:** `stand()` liefert zusätzlich `zoom`, `sequenz` (Phase), `eingabeGesperrt`, `banner`, `bossSichtbar`, `bossSpruch`, `torErgebnisse`, `checkpoints`, `koerper`, `hochformatHinweis`, `strecke`, `sequenzMinDauer`; neu `teleportBoss()`, `setKoerper()`, `menue()`, `sprechListe()`.
- **Messung:** 60 fps bei 1280×800 (Chromium headless), 390×844 zeigt den Querformat-Hinweis, 844×390 ohne Überlauf (Skin-Menü scrollt in der Box). Nicht auf Schulhandys getestet.

**Titel-Reihe beschlossen (29.10.): Noob → Rookie → Pro → Elite → Legend** (je Anzahl geschaffter Level, Vorschlag: 1 · 3 · 6 · 10 · 15).

## 13. Einbau Klasse 9 (29.10.2026) – Welt 1: New York / Statue of Liberty
Schüler können ab sofort spielen. Der Prototyp bleibt als Referenz liegen; die App nutzt das herausgelöste Modul.
- **Modul `app/klasse9/runner.js`** (≈ 1.150 Zeilen, aus dem Prototyp: Level-Bau, `zeichneFigur` mit allen Ebenen inkl. Körperform/Power-Aura, drei Gegner, Diamanten, Tore, Checkpoints, Boss-Zwischensequenz, Boss-Frage, Web-Audio-Klänge). Kein eigenes Menü mehr. Schnittstelle `window.Runner.start({ wrapper, woerter:[{en,de}], skin, texte, stimme:{ wort(i), boss(text) }, onEnde(ergebnis) })` → Canvas im Wrapper, `ergebnis = { geschafft, diamanten, max, toreRichtig, leben, dauer }`; `Runner.stopp()` beendet Schleife (`cancelAnimationFrame`), Eingabe-Listener und schließt den AudioContext. Hochformat: 16:10-Fenster mit Hinweis „Handy quer halten“, `devicePixelRatio ≤ 2`. Export für die App: `zeichneFigur`, `SKIN_GRUPPEN`, `SKIN_STANDARD`, `powerAnwenden`, `sprechText`, `skinFrei`, `skinArtikel`. Test-Haken `window.__runner` nur während eines Spiels (`stand`, `springe`, `teleport`, `teleportBoss`, `antwort`). `runner.js` wird in `index.html` vor `app.js` geladen; das Bauskript nimmt es automatisch in die `sw.js`-Dateiliste auf (os.walk).
- **Einstieg (app.js „Games: Road Trip Run“):** Kachel „🏃 Road Trip Run · Jump'n'Run · Eintritt 100 🪙“ in Games; das Shop-„Runner-Ticket“ ist kein Kauf mehr, sondern führt zur Startseite (`runnerStart`): Welt 1 mit Ziel, Vorschau-Figur + „🎨 Figur“, Titel-/Trophäen-/Spiele-Stand, Unit-Reiter + Abschnitt-Chips (Wörter wie bei Catch the Word: 12 Wörter, Abschnitt zuerst, Rest aus der Unit aufgefüllt), Coins-Stand, „▶ Spielen – 100 🪙“. Unter 100 Coins: Knopf gesperrt **und** Sperre in `runnerSpiel` (Hinweis „Noch N Coins – übe weiter!“). Start bucht 100 ab (`ausgegeben` +100, Toast „🪙 −100“, `speichern()`), zählt `gespielt` +1 und öffnet die Vollbild-Bühne (`.runner-buehne`, Kopfzeile ausgeblendet, ✕ mit Rückfrage „Abbrechen? Der Eintritt ist weg.“). Jeder Seitenwechsel (`zeige`) stoppt einen laufenden Runner (`runnerAus`). Der Tempo-Knopf wirkt nicht aufs Spiel (nur auf Aufnahmen/Stimme).
- **Wörter im Spiel:** Diamant eingesammelt → `spiele([tonWort(v)])`, also die vorhandenen Wortaufnahmen (keine TTS für Wörter). Boss-Banner und Boss-Sprüche („It's time for Mr. Alligator!“, „Correct – the door opens!“, „Not this time!“) laufen bis zur Vertonung (Mr. Alex, 13.11.) wie fehlende Aufnahmen über `spiele([{ text, stimme: "m" }])` = Geräte-Stimme; ebenso die Skin-Namen beim Antippen. Am 13.11. nur die Audio-Pfade einhängen.
- **Ende (`runnerEnde`):** geschafft → Trophäe „Liberty Finder“ (**Gold** = alle 14 Diamanten inkl. beider Tore richtig, sonst **Silber**; Gold überschreibt Silber, nie umgekehrt) in `stand.spiel.runner = { level: { ny: "gold"|"silber" }, gespielt, geschafft, titel }`; Runner-Titel nach geschafften Leveln **Noob 1 · Rookie 3 · Pro 6 · Elite 10 · Legend 15**, Aufstieg als Feier über `ereignisse` (Konfetti, Ton = starkes Lob `waehleRuf("stark")`). Keine Punkte, keine Coins zurück. Endseite: Pokal, Lob-/Trost-Spruch (Mr. Alex' vorhandene Aufnahmen), 💎/❤️/⏱, Wortliste (12 × EN/DE mit 🔊), „↻ Noch mal (100 🪙)“, „Zur Startseite“. Game over: gleiche Seite ohne Trophäe. Alles in `stand.spiel`, also im Siegel.
- **Skins (`runnerSkins`):** große Vorschau (Canvas), 8 Reiter (Haare · Hut · Gesicht · Oberteil · Schuhe · Schmuck · Körper · Aura), Auswahl sofort sichtbar und in `stand.spiel.skin` gespeichert. **Frei:** je Option die ersten zwei Werte (Muskeln ganz); **kaufbar:** 16 Teile à 30 Coins als Shop-Artikel `skin_<option>_<wert>` (`SKIN_ARTIKEL` in `klasse9_bauen.py`), gesperrte Werte zeigen „🔒 … 30 🪙“ und führen in den Shop (Artikel hervorgehoben, „← Zurück“ zur Figur); Kauf legt das Teil sofort an. **Power-Körper nach Punkten** (Schalter, Standard an): Punkte-Titel-Stufe 0 = schmal, 1–2 = normal, 3+ = kräftig, ab Stufe 4 kleine orange Aura; Muskeln von Hand umstellbar (`skin.muskelnManuell`), Schalter wieder an setzt das zurück.
- **Hall of Fame:** Abschnitt „🏃 Road Trip Run“ in der Sammlung: Runner-Titel, Level/Spiele, nächste Titel-Schwelle, Trophäen (Liberty Finder 🥇/🥈, Platzhalter 🔒 Gate Crosser · California, Canyon Hero · Arizona).
- **Geprüft** (Playwright/Chromium, Skript im Scratchpad `runner9.js`, 57 Prüfungen): Kachel + Shop-Ticket, Sperre < 100 (auch ohne `disabled`), Abbuchung, Spiel in 390×844 (Hinweis quer) und 844×390, Sprung, Diamant + Wortaufnahme, Boss-Sequenz mit Banner, Boss richtig → Endseite, Trophäe Silber, Titel Noob + Feier, Siegel nach Reload, Hall of Fame, Game over ohne Trophäe, Skin-Seite (Auswahl, Sperre → Shop, Kauf 30, Power-Körper, Überschreiben), Abbrechen mit Rückfrage, G/E-Umschaltung. Bestehende Tests (umbau9, coins K9, hw K9, siegel, patrol9, catch9, bee9) weiter grün. Nicht geprüft: echte Handys, iOS-Safari, Geräte-Stimmen.
- **Offen:** Welten 2–5 (Kulissen, Gegner, Bosse), Audio (13.11.: Boss, Skin-Namen, Diamant-Rufe, Levelstart/-ende), „zweites Leben“ als Shop-Artikel, Klasse 6 (London Run), Eintrittspreis nach Schüler-Feedback.

**Ticket-Modell (29.10., Mr. Alex):** Das Runner-Ticket wird im Shop gekauft (100 Coins, mehrfach kaufbar, Zähler 🎟️ in `stand.spiel.runner.tickets`). Spielen und „Noch mal“ lösen ein Ticket ein. Ohne Ticket heißt der Hauptknopf „🎟️ Erst Ticket kaufen – 100 🪙“ und führt in den Shop mit hervorgehobenem Ticket; dazu der Hinweis „Zum Spielen brauchst du ein Ticket aus dem Shop … Kauf erst ein Ticket, dann geht's los!“. Abbrechen verbraucht das Ticket.

**Figur-Seite überarbeitet (29.10.2026, Rückmeldung Mr. Alex: „Knöpfe verwirrend, Seite springt“):** `runnerSkins` baut die Seite nur noch einmal auf. Oben ein klebender Kopf (`.runner-skin-kopf`, `position: sticky` genau unter der blauen Leiste, Höhe wird aus `.niveau-leiste` gelesen; bei Fensterhöhe ≤ 600 px nicht sticky) mit Figur links (≈ 40 % auf dem Handy) und kurzem Erklärtext rechts (frei · Shop 30 🪙 · Power-Körper nach Punkte-Titel). Darunter die acht Reiter als waagerecht scrollbare Chip-Zeile (aktiver Reiter gefüllt + gelber Rand), dann die Optionen der Gruppe als einheitliche Chips: Symbol bzw. runder Farbpunkt + Name, aktiv = gefüllt mit ✓, gesperrt = gestrichelt mit 🔒 und „· 30 🪙“ (→ Shop mit hervorgehobenem Artikel, „← Zurück“ zur Figur). Untergruppen (Frisur/Haarfarbe …, Bauch/Brust/Muskeln/Power) als kleine Überschriften; der Power-Hinweis mit der Titel-Stufe steht in der Gruppe „Körper“. Eine Auswahl speichert, malt nur die Vorschau neu (`canvas.neuMalen`) und zieht `aria-pressed`/✓ der Chips nach – kein `zeige`, also kein Scrollsprung; ein Reiterwechsel tauscht nur den Options-Bereich (`min-height: 50vh`, damit die Seite nicht schrumpft). Unten eine klebende Knopfzeile „✓ Fertig – zum Spiel“ + „🛍️ Shop“. Geprüft (runner9.js, Abschnitt 5, 390×844): Layout nebeneinander, sticky-Kopf/-Fuß, Auswahl und Reiterwechsel ohne Scrollsprung und ohne Neuaufbau von `.runner-skins`, Farbpunkte, Sperre → Shop → Kauf → zurück, Power-Körper an/aus, manuelles Überschreiben, Siegel nach Reload.
