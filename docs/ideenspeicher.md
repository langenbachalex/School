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
| Runner: Rufe beim Einsammeln (Jeremy/Jessica), Boss-Intro und Boss-Fragen (Mr. Alex) | Jeremy, Jessica, Mr. Alex | je ≈ 1.500 | später |
| Hörverstehen 3 Klasse 6 „Talking about free time“ (5 Sprecher + 10 Aussagen) | Mr. Alex | ≈ 1.500 | vorgemerkt, Entwurf wartet auf Freigabe |

## Aufgeschoben – bitte erinnern
| **Manipulations-Reset** | aufgeschoben (29.10.) | Mr. Alex will keine versehentlichen Punktverluste; Reset nur als bewusste „Strafe“ für echte Manipulation, kein Regelfall. Heute: Reset nur, wenn Haupt- und Zweitkopie beide ungültig sind; erledigte Teile bleiben dabei stehen (Punkte auf 0). Nochmal besprechen: z. B. Punkte einfrieren statt löschen, oder nur Banner ohne Reset. |
| Idee | Stand | Entscheidung offen |
|---|---|---|
| **Arcade-Kachel** für Klasse 9 | aufgeschoben (29.10.) | Stattdessen erst Kachel **Games** mit Lernspielen; der Runner könnte später hinter Coins liegen, ohne eigene Kachel. |
| **Coins: Wertigkeit und Zeitkopplung** | aufgeschoben (29.10.) – Coins und Shop sind gebaut (Rahmen 50, Runner-Ticket 100 als Platzhalter) | Startwert ≈ 100 Punkte = 1 Spielrunde; Alternative: Punkte kaufen Spielzeit (z. B. 100 Punkte = 5 Minuten). Preise für beide Klassen festlegen, dann Schüler-Feedback abwarten. |
| **Auto beim Vokabellernen** (Schülerwunsch) | aufgeschoben (29.10.) | Zu aufwendig als Dauer-Grafik. Stattdessen Mini-Rewards – **gebaut 29.10.** (Flamme, Münzen, Auto/Bus im Wechsel, siehe unten). |
| **Grafikstil Runner** | offen | Flach/Cartoon wie die Word-Gym-Figur oder Landmark-Fotos mit kleiner Figur davor. Nächster Schritt nach der Games-Kachel. |
| **Klasse 6 mitziehen** (Games-Umbau, Coins, Runner) | teils gebaut (29.10.) | Coins, Shop und Mini-Rewards sind in beiden Klassen; Games-Umbau und Runner offen. |

## Beschlossen (29.10.2026, zweite Runde)
- **Coins nicht rückwirkend**: Zählung beginnt mit dem Update; alte Punkte bringen keine Coins (sonst hängen Kinder mit Hunderten Coins nur am Spiel). **Gebaut 29.10.** (beide Apps, `stand.spiel.coins`).
- **Zwei Arten von Spielen**: *Lernspiele* (Games-Kachel: Memory, Border Patrol, Catch the Word, Spelling Bee – Lernen im Vordergrund, frei spielbar, kleine Punkte) und *verdiente Spiele* (Runner – Spaß im Vordergrund, kostet Coins, passiv Englisch, Rätsel/Frage-Diamanten).
- **Shop** heißt vorerst „Shop“ (Name später brainstormen). **Gebaut 29.10.**: Kachel in Games (Kl. 9) bzw. Knopf auf der Startseite (Kl. 6) und in der Sammlung; Artikel in `SHOP` der Bauskripte: Runner-Ticket 100 (kommt bald), drei Titel-Rahmen je 50. Details: `gamification/konzept.md` „Coins und Shop“.
- **Skins für den Runner** (müssen bei der Figurgröße deutlich sichtbar sein): Hüte, Tops, Schuhe, Shorts, Frisuren und Haarschmuck, Sonnenbrille, Schnurrbart, Nase, Ohrringe/Kette, Accessoires; Jungs: angedeutete Superkräfte nach den Superhelden der Sammlung; Autos: Sticker.
- **Mini-Rewards beim Vokabellernen**: Mini-Flamme mit Coins-Symbol und Coins-Speicher; im Wechsel wie beim Lob (Flamme, Münz-Kassieren, Auto flitzt). **Gebaut 29.10.** (ohne Audio; Ideen 1, 2 und 6 unten ohne Töne – Hupe/Münzklang und Combo-Sprüche folgen mit den Credits).
- **Dialog-Duell** gehört zu **Speaking**, nicht in Games; zuerst mit den vorhandenen Dialogen. Noch brainstormen.
- **Runner (Rückmeldung 29.10. zum Prototyp):** Cartoon-Stil passt. Spieldauer ≥ 2 Minuten. Vor dem Endboss kleine Zwischensequenz: Kamera fährt herunter, Figur läuft automatisch, kurz eingefroren, Mr. Alex spricht („It's time for Mr. Alligator!“). Endboss-Stimme = Mr. Alex (mehr Mr.-Alex-Stimme in Klasse 9 gewünscht). Skins zusätzlich: Körperform (Bauch, Brust, Muskeln) – Idee: mit mehr Punkten wird die Figur muskulöser. Probe ist unvertont.
- **Runner**: Levelziel passend zum Level (z. B. die Statue of Liberty finden, vorher vorbereitet); **Boss/Endboss** kennen die Schüler: Der Endboss stellt eine Frage, richtige Antwort schließt eine Tür auf.
- **Belohnung im Runner**: keine Coins zurück (wäre komisch); stattdessen eigene Titel/Trophäen fürs normale Spiel – noch brainstormen.

## Aufgeschoben (zweite Runde) – bitte erinnern
| **Nachhaltigkeit „alles grün“ → ⚡ Power Up** | gebaut (29.10.) | Erledigtes wird nach 30 / 60 / 120 Tagen wieder fällig (gelbes Schild ⚡ Power Up), erneut durchmachen gibt 5 Punkte und Stufe +1; GLN-Kopplung an; kürzere Timer bei Wiederholung. Audio „Powered up!“ folgt mit den Credits. Details: `docs/nachhaltigkeit-entwurf.md`. |
| **Runner-Belohnung** (Titel statt Coins) | offen | brainstormen |
| **Dialog-Duell in Speaking** | offen | brainstormen, vorhandene Dialoge nutzen |

## Beschlossen (29.10.2026), noch nicht gebaut
- Klasse 9: **BE vs AE** wird Gruppe in **Vocabulary**.
- Klasse 9: **„New“ auflösen** – neue Inhalte direkt in ihre Kategorie, 14 Tage ✨-Schild an Kachel und Gruppe, Startseite zeigt „✨ Neu diese Woche“.
- Klasse 9: Kachel **Games** (wie Klasse 6) an der Stelle von „New“: Memory (aus Klasse 6, größere Karten), Border Patrol, Catch the Word, Spelling Bee = **Lernspiele**.
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
- Catch the Word – beschlossen (Games)
- Border Patrol – **gebaut 29.10.** (Games, Klasse 9); Variante: Wörter sinken nach unten, antippen = Aussprache, dann links 🇬🇧 / rechts 🇺🇸 wischen; durchgefallen = Minuspunkt
- Spelling Bee – beschlossen (Games)
- Sentence Sprint – offen
- Dialog-Duell – offen (Beschreibung folgt)
- Runner – beschlossen, Planung läuft
- Shop-Artikel: Auto-/Figur-Skins, Sticker für USA-/London-Karte, zweites Leben im Runner – beschlossen (Coins); erste Artikel gebaut 29.10. (Titel-Rahmen, Runner-Ticket als Platzhalter)

## Ältere Ideen
- Symbole für ~60 Klasse-9-Wörter (Bild → Wort) – offen
- Klasse 6: Memory im Word Gym – offen
- E-Kurs Klasse 9: Eintippen wie Klasse 6 – offen
- Geheimakten: weitere Akten (je Superheld/Landmark), Audio nach Freigabe – offen
- Hörverstehen: erst hören, dann antworten – offen (nur auf Wunsch)
- Secret Level Regel B (goldene Akte nach Serien) – offen
