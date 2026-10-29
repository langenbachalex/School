# Ideenspeicher

Hier landen alle Ideen und aufgeschobenen Entscheidungen, damit nichts verloren geht. Status: **offen** · **aufgeschoben** (Mr. Alex entscheidet später, bitte erinnern) · **beschlossen** · **gebaut**.
Pflege: Jede neue Idee aus einem Chat kommt hier hinein, auch wenn sie nicht gleich gebaut wird.

## Audio-Vormerkliste (ElevenLabs: neue Credits ab 13.11.2026 – bis dahin nichts vertonen)
Credits-Stand 29.10.: **6.000**. Beobachtung: Eleven v4 kostet nach den Zwischenständen nur **≈ 0,4–0,5 Credits je Zeichen** (23.10.: 11.734 Zeichen → 4.347 Credits; danach 1.391 Zeichen → ≈ 650 Credits). Mit 6.000 Credits sind also grob **12.000 Zeichen** V4 möglich – vor dem 13.11. ist Spielraum für kleine Posten.
Alles Neue wird **ohne Audio** gebaut; die Texte werden hier gesammelt und am 13.11. nach Freigabe vertont (Erinnerung ist eingestellt).
| Posten | Stimme(n) | Zeichen (ca.) | Status |
|---|---|---|---|
| Geheimakten: Leo/Big Ben (Kl. 6), The Last Ferry (Kl. 9) | Mr. Alex / Jeremy + Jessica | je ≈ 900 | vorgemerkt |
| Power Up: „Powered up! Your English is fully charged again.“ | Mr. Alex (beide Klassen) | 48 × 2 | **vertont 29.10.** |
| Mini-Rewards: Combo-Sprüche (≈ 5 Sätze) | Mr. Alex, Jeremy, Jessica | je ≈ 250 | vorgemerkt |
| Border Patrol: 34 Einzelwörter (17 britisch Mr. Alex, 17 amerikanisch Jeremy; bis dahin Geräte-Stimme) | Mr. Alex, Jeremy | 225 gesamt | vorgemerkt (in klasse9_audio.py eingetragen) |
| Border Patrol: Grenzer-Sprüche (≈ 10 Sätze) | Jeremy, Mr. Alex | je ≈ 300 | vorgemerkt |
| Runner: Skin-Menü spricht die Auswahl – **85 Wendungen** in `docs/runner/skin-stimme.txt` („Long hair“, „Rainbow mohawk“, „Walrus moustache“, „Giraffe neck“, „Hulk arms“ …; seit Figur v2 am 29.10. statt 57); seit 29.10. in der App per Geräte-Stimme | Jeremy, Jessica | je ≈ 920 | vorgemerkt |
| Runner: Boss-Banner + Boss-Sprüche Welt 1 („It's time for Mr. Alligator!“, „Correct – the door opens!“, „Not this time!“; in der App seit 29.10. per Geräte-Stimme) | Mr. Alex | 67 | vorgemerkt – zuerst |
| Runner: Boss-Fragen/Tor-Ansagen (≈ 300), Levelstart/-ende („Let's find the Statue of Liberty!“, „We made it!“), Diamant-Rufe (Wortaufnahmen decken Welt 1 ab) | Mr. Alex, Jeremy, Jessica | Mr. Alex ≈ 1.000 · Jeremy/Jessica je ≈ 400 | später |
| Hörverstehen 3 Klasse 6 „Talking about free time“ | Elrond, John Shaw, Emmaline, Alice (v4), Lösungen Mr. Alex | ≈ 1.500 | **vertont 29.10.** |
| Hörübungen 01/02 Klasse 6 neu mit Jugendstimmen (Mia, Ben, Harry, Declan) | Elrond, John Shaw, Emmaline | ≈ 600 | offen – nur auf Wunsch |

## Aufgeschoben – bitte erinnern
| **Manipulations-Reset** | aufgeschoben (29.10.) | Mr. Alex will keine versehentlichen Punktverluste; Reset nur als bewusste „Strafe“ für echte Manipulation, kein Regelfall. Heute: Reset nur, wenn Haupt- und Zweitkopie beide ungültig sind; erledigte Teile bleiben dabei stehen (Punkte auf 0). Nochmal besprechen: z. B. Punkte einfrieren statt löschen, oder nur Banner ohne Reset. |
| Idee | Stand | Entscheidung offen |
|---|---|---|
| **Arcade-Kachel** für Klasse 9 | erledigt (29.10.) | Keine eigene Kachel: **Road Trip Run** liegt als Kachel in **Games** hinter 100 Coins Eintritt. |
| **Coins: Wertigkeit und Zeitkopplung** | aufgeschoben (29.10.) – Coins und Shop sind gebaut (Rahmen 50, Runner-Eintritt 100 echt, Skin-Teile 30) | Startwert ≈ 100 Punkte = 1 Spielrunde; Alternative: Punkte kaufen Spielzeit (z. B. 100 Punkte = 5 Minuten). Preise für beide Klassen festlegen, dann Schüler-Feedback abwarten. |
| **Auto beim Vokabellernen** (Schülerwunsch) | aufgeschoben (29.10.) | Zu aufwendig als Dauer-Grafik. Stattdessen Mini-Rewards – **gebaut 29.10.** (Flamme, Münzen, Auto/Bus im Wechsel, siehe unten). |
| **Grafikstil Runner** | beschlossen (29.10.): Cartoon – **Welt 1 gebaut 29.10.** | `runner/konzept-entwurf.md` Abschnitt 13 (Einbau Klasse 9): Kachel in Games, 100 Coins, Trophäe Liberty Finder, Titel Noob → Legend, Skins + Shop-Teile, Power-Körper. **Streak-Effekte (Combo 3/5/8, „Beste Serie“) und Gegner-Sounds (Web Audio) gebaut 29.10.** Offen: Welten 2–5, Audio ab 13.11., zweites Leben. |
| **Klasse 6 mitziehen** (Games-Umbau, Coins, Runner) | Klasse 6 nachgezogen (29.10.) | Coins, Shop, Mini-Rewards und die Games-Kachel (Station 5 „Spiele“: Memory, Catch the Word, Spelling Bee, -s-Detektiv, Shop) sind in beiden Klassen; Runner (London Run) für Klasse 6 offen – Modul `app/klasse9/runner.js` ist dafür vorbereitet (Wörter, Texte, Skin von außen). |

## Beschlossen (29.10.2026, zweite Runde)
- **Coins nicht rückwirkend**: Zählung beginnt mit dem Update; alte Punkte bringen keine Coins (sonst hängen Kinder mit Hunderten Coins nur am Spiel). **Gebaut 29.10.** (beide Apps, `stand.spiel.coins`).
- **Zwei Arten von Spielen**: *Lernspiele* (Games-Kachel: Memory, Border Patrol, Catch the Word, Spelling Bee – Lernen im Vordergrund, frei spielbar, kleine Punkte) und *verdiente Spiele* (Runner – Spaß im Vordergrund, kostet Coins, passiv Englisch, Rätsel/Frage-Diamanten).
- **Shop** heißt vorerst „Shop“ (Name später brainstormen). **Gebaut 29.10.**: Kachel in Games (Kl. 9) bzw. Knopf auf der Startseite (Kl. 6) und in der Sammlung; Artikel in `SHOP` der Bauskripte: Runner-Ticket 100 (kommt bald), drei Titel-Rahmen je 50. Details: `gamification/konzept.md` „Coins und Shop“.
- **Skins für den Runner** (müssen bei der Figurgröße deutlich sichtbar sein): Hüte, Tops, Schuhe, Shorts, Frisuren und Haarschmuck, Sonnenbrille, Schnurrbart, Nase, Ohrringe/Kette, Accessoires; Jungs: angedeutete Superkräfte nach den Superhelden der Sammlung; Autos: Sticker.
- **Mini-Rewards beim Vokabellernen**: Mini-Flamme mit Coins-Symbol und Coins-Speicher; im Wechsel wie beim Lob (Flamme, Münz-Kassieren, Auto flitzt). **Gebaut 29.10.** (ohne Audio; Ideen 1, 2 und 6 unten ohne Töne – Hupe/Münzklang und Combo-Sprüche folgen mit den Credits).
- **Dialog-Duell** gehört zu **Speaking**, nicht in Games; zuerst mit den vorhandenen Dialogen. Noch brainstormen.
- **Runner (Rückmeldung 29.10. zum Prototyp):** Cartoon-Stil passt. Spieldauer ≥ 2 Minuten. Vor dem Endboss kleine Zwischensequenz: Kamera fährt herunter, Figur läuft automatisch, kurz eingefroren, Mr. Alex spricht („It's time for Mr. Alligator!“). Endboss-Stimme = Mr. Alex (mehr Mr.-Alex-Stimme in Klasse 9 gewünscht). Skins zusätzlich: Körperform (Bauch, Brust, Muskeln) – Idee: mit mehr Punkten wird die Figur muskulöser. Probe ist unvertont.
- **Runner**: Levelziel passend zum Level (z. B. die Statue of Liberty finden, vorher vorbereitet); **Boss/Endboss** kennen die Schüler: Der Endboss stellt eine Frage, richtige Antwort schließt eine Tür auf.
- **Belohnung im Runner**: keine Coins zurück; Trophäen je Level und Runner-Titel **Noob → Rookie → Pro → Elite → Legend** (beschlossen 29.10.).

## Fragen von Mr. Alex (29.10.), beantwortet, nichts gebaut
- **Shop gegen Developer-Mode:** Coins, Käufe und Rahmen liegen in `spiel` und damit unter demselben Siegel wie die Punkte (Zweitkopie, Reset bei Fälschung). Kaufsperre wird im Programm geprüft, nicht am Knopf. Grenze wie bei den Punkten: Wer den Programmcode liest, kann das Siegel nachbauen.
- **Ton-Check: nicht bauen** (Entscheidung 29.10.). Stattdessen Idee: im Nachsprech-Balken („Jetzt du!“) gelegentlich „I can't hear you!“ als Ansporn (Text, später Stimme). Mr. Alex thematisiert Ton und Nachsprechen im Unterricht. – offen
- **Ton-Warnung (Hintergrund):** Ob der Ton am Gerät aus oder leise ist, kann eine Web-App nicht sehen (keine Lautstärke-API, iPhone-Stummschalter unsichtbar). Möglich: ein **Ton-Check beim Start** (kurzer Klang + „Hörst du das? 🔊 Ja / Nein“), Erkennung blockierter Wiedergabe (Autoplay) und ein Hinweis, wenn Hör-Teile mehrfach ohne abgespieltes Audio „geschafft“ wurden. Vorschlag: Ton-Check einmal pro Tag auf der Startseite, Text „Bitte Ton an – sonst verschwendest du Learn Power!“ Noch nicht gebaut.

## Aufgeschoben (zweite Runde) – bitte erinnern
| **Nachhaltigkeit „alles grün“ → ⚡ Power Up** | gebaut (29.10.) | Erledigtes wird nach 30 / 60 / 120 Tagen wieder fällig (gelbes Schild ⚡ Power Up), erneut durchmachen gibt 5 Punkte und Stufe +1; GLN-Kopplung an; kürzere Timer bei Wiederholung. Audio „Powered up!“ folgt mit den Credits. Details: `docs/nachhaltigkeit-entwurf.md`. |
| **Runner-Belohnung** (Titel statt Coins) | gebaut (29.10.) | Trophäe je Welt (Gold/Silber) + Runner-Titel Noob 1 · Rookie 3 · Pro 6 · Elite 10 · Legend 15, keine Coins zurück. |
| **Dialog-Duell in Speaking** | offen | brainstormen, vorhandene Dialoge nutzen |

## Beschlossen (29.10.2026), noch nicht gebaut
- Klasse 9: **BE vs AE** wird Gruppe in **Vocabulary**.
- Klasse 9: **„New“ auflösen** – neue Inhalte direkt in ihre Kategorie, 14 Tage ✨-Schild an Kachel und Gruppe, Startseite zeigt „✨ Neu diese Woche“.
- Klasse 9: Kachel **Games** (wie Klasse 6) an der Stelle von „New“: Memory (aus Klasse 6, größere Karten), Border Patrol, Catch the Word, Spelling Bee = **Lernspiele**. → **alle vier gebaut 29.10.**
- **Coins**: gespiegelte Währung (jeder Punkt = ein Coin), ausgebbar; **nichts gratis**, erste Runde nicht geschenkt. Coins kann man schon sammeln, bevor der Runner fertig ist. → **gebaut 29.10.**
- **Runner** (Jump'n'Run, Giana-Sisters-Gefühl, Tippen = Springen, Diamanten sammeln, Wörter versteckt) = Hauptspiel, liegt hinter Coins. Viel Lob.
- Punkte sinken nie (Titel, Serien bleiben).

## Mini-Rewards beim Vokabellernen (billig, ein paar Stunden je Idee) – zur Auswahl
1. **Flitzer:** 3 richtige in Folge → ein kleines Auto (Klasse 9) bzw. Bus (Klasse 6) flitzt einmal quer über den Bildschirm, mit Hup-Ton (Web Audio, kein Credit). Ab 5 in Folge mit Rauchspur, ab 10 ein Konfetti-Regen.
2. **Combo-Zähler:** kleine Flamme neben dem Zähler („🔥 4“), die bei jedem Treffer wächst und bei Fehler verpufft.
3. **Sticker-Regen:** jedes 5. richtige Wort wirft ein Emoji-Symbol des Wortes (wenn vorhanden) von oben ins Bild, das kurz hüpft.
4. **Streckenbalken:** dünne Straße unter der Karte, Auto rückt pro Treffer ein Stück vor, am Ende des Word Gyms Fanfare (ohne Rückwärtsfahren).
5. **Stimme-Combo:** bei 5 in Folge spricht Jeremy/Jessica einen eigenen Combo-Spruch („Five in a row – you're on fire!“) – ≈ 5 Sätze, ≈ 250 Zeichen je Stimme.
6. **Münzklang:** jedes richtige Wort klimpert hörbar (Coin-Sound, Web Audio), Coins-Zähler oben zählt sichtbar hoch – verbindet Vokabeln direkt mit dem Shop.

## Spiele-Ideen (Details in `spiele/konzept-entwurf.md`)
- Word Race (Autorennen, drei Spuren) – offen
- Catch the Word – **gebaut 29.10.** (Games, Klasse 9; **Klasse 6 nachgezogen 29.10.**): Wort hören, 4–6 Wörter des Abschnitts fallen, das richtige antippen; 10 Runden, 3 Leben, +10 einmal pro Tag ab 7 Treffern
- Border Patrol – **gebaut 29.10.** (Games, Klasse 9); Variante: Wörter sinken nach unten, antippen = Aussprache, dann links 🇬🇧 / rechts 🇺🇸 wischen; durchgefallen = Minuspunkt
- Spelling Bee – **gebaut 29.10.** (Games, Klasse 9; **Klasse 6 nachgezogen 29.10.**): Wort hören, deutsche Bedeutung lesen, eintippen (1-Fehler-Toleranz wie Klasse 6); 8 Wörter, 🍯 Honey bei 3 in Folge, +10 einmal pro Tag ab 6 richtig
- Sentence Sprint – offen
- Dialog-Duell – offen (Beschreibung folgt)
- Runner – **Welt 1 gebaut 29.10.** (Klasse 9, Games: „Road Trip Run“, Eintritt 100 Coins; Details `runner/konzept-entwurf.md` Abschnitt 13); **Streak-Effekte + Gegner-Sounds gebaut 29.10.** (Combo 3× Funken, 5× goldene Spur, 8+ On fire, Beste Serie auf der Endseite; Taube/Waschbär/Eichhörnchen/Plopp aus Web Audio); Welten 2–5 und Klasse 6 offen
- Shop-Artikel: Auto-/Figur-Skins, Sticker für USA-/London-Karte, zweites Leben im Runner – beschlossen (Coins); erste Artikel gebaut 29.10. (Titel-Rahmen, Runner-Ticket → Spielstart, 16 Figur-Teile à 30 Coins für den Runner); zweites Leben offen

## Ältere Ideen
- Symbole für ~60 Klasse-9-Wörter (Bild → Wort) – offen
- Klasse 6: Memory im Word Gym – offen (Memory gibt es seit 29.10. in Station 5 „Spiele“ mit Abschnittswahl; die Tagesmarke `gym.memoryTag` ist dafür schon vorbereitet)
- E-Kurs Klasse 9: Eintippen wie Klasse 6 – offen
- Geheimakten: weitere Akten (je Superheld/Landmark), Audio nach Freigabe – offen
- Hörverstehen: erst hören, dann antworten – offen (nur auf Wunsch)
- Secret Level Regel B (goldene Akte nach Serien) – offen

## Hausaufgaben-Knopf „HW“ (Machbarkeit, 29.10.2026) – **gebaut 29.10.** (Entscheidung Mr. Alex: Bonus +50 %, Chip-Zeile statt großer Karte; Doku in `docs/gamification/konzept.md` „📝 Homework“, Schema in `inhalte/LIESMICH.md` und `inhalte/klasse9/LIESMICH.md`)
- **Machbar, einfach.** Die App kennt jeden Teil über Station/Kategorie, Gruppe und Teilnummer; ein Direktsprung existiert schon (Neu-Zeile, Power-Up-Zeile). Aufwand ≈ ½ Tag je App.
- **Pflege durch Mr. Alex:** eine Zeile in `inhalte/hausaufgabe.tsv` (Klasse 9: `inhalte/klasse9/hausaufgabe.tsv`): `von | bis | ziel | text`, z. B. `2026-11-02 | 2026-11-08 | hoeren:03 | Hörübung 3 „Talking about free time“`. Mehrere Zeilen = mehrere Wochen im Voraus; die App zeigt die, die heute gilt. Danach `daten_bauen.py` + Push (oder ich trage es nach Zuruf im Chat ein).
- **Anzeige:** Knopf „📝 HW“ oben in der Leiste (neben Tempo) **und** eine Zeile auf der Startseite „📝 Homework bis So 8.11.: Hörübung 3“ mit Sprung; am Zielteil ein Schild „HW“ (wie ✨/⚡). Erledigt (Teil fertig) → Häkchen am Knopf, Zeile wird grün. Keine Extra-Punkte (oder kleiner Bonus, offen).
- **Mehrere Aufgaben pro Woche:** Liste statt Zeile. **Kein Server:** Die Hausaufgabe steht in den Daten der App, alle Schüler sehen dieselbe.
- Entschieden 29.10.: Bonus **+50 %** auf die Teil-Punkte (aufgerundet, je Teil einmal), Startseite nur Chip-Zeile „📝 HW“ über dem Word Gym. Offen: Erinnerung am Vorabend (nur möglich, wenn App offen ist – kein Push ohne Server).
- **Kette gebaut 29.10.:** mehrere Ziele je Hausaufgabe (`6/3; 8`, Klasse 9 auch ganze Unit `2/u1`), Knopf/Chip springen zum ersten offenen Ziel, Chip zählt „HW 1/4“, Übersicht ✓/○ mit ▶ (▾ am Chip, langes Drücken auf den Knopf), „📝 Nächste Hausaufgabe ➜“ auf den Abschluss-Seiten, einmalige Feier „Homework done!“ wenn alles erledigt ist. Offen bleibt nur die Erinnerung am Vorabend.
