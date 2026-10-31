# Road Trip Run – Welten 2 bis 5 (Plan, 29.10.2026 – von Mr. Alex abgesegnet: Reihenfolge, Bosse, Freischaltung über Silber)

**Status:** Welt 2 „Illinois · Route 66“ **gebaut 29.10.2026** (Details `konzept-entwurf.md`, Absatz „Welt 2 Route 66“; Test `runner9_welt2.js`). Welt 3 „Arizona · Grand Canyon“ **gebaut 30.10.2026** (Absatz „Welt 3 Grand Canyon“; Test `runner9_welt3.js`; fallende Steine, Hängebrücken mit 1,5-s-Bruch, Kakteen, Klapperschlange/Geier/Skorpion, Sheriff Rattlesnake, Westerntor, Trophäe Canyon Climber, Unit 2 vorbelegt). Welt 4 „South Dakota · Mount Rushmore“ **gebaut 30.10.2026** (Absatz „Welt 4 Mount Rushmore“; Test `runner9_welt4.js`; rollende Baumstämme, Bäche mit Trittsteinen, Windböen mit halbem Sprung, Bärenhöhlen mit Pranke, Büffel (nicht plattdrückbar)/Biber/Adler, Grizzly Grandpa mit Brille, Bart, Schlafmütze und Wanderstock, Ranger-Station-Tor, Trophäe Rushmore Ranger, Unit 2 vorbelegt). Welt 5 „California · Golden Gate Bridge“ **gebaut 30.10.2026** (Absatz „Welt 5 Golden Gate“; Test `runner9_welt5.js`; Nebelabschnitte mit glühenden Diamanten, pendelnde Seilbahn-Gondeln über dem Pazifik, Surfbrett-Rutsche, Möwe klaut einen Diamanten statt ein Leben/Seelöwe/Skater, Captain Fog als Nebelgeist mit Kapitänsmütze und Nebelhorn, Brückentor, Trophäe Golden Gate Legend, Unit 2 vorbelegt). **Damit sind alle fünf Welten gebaut**; offen: Audio (ab 13.11.) und Abnahme durch Schüler/Mr. Alex.

Welt 1 „New York – Statue of Liberty“ ist live. Jede weitere Welt = eigene Kulisse (Cartoon, Parallaxe), 3 Gegnerarten, ein Endboss mit Tür, eine Trophäe und ein Levelziel „Find the …!“. Spielmechanik, Dauer (≈ 2 Minuten), Diamanten (12), Tore (2), Checkpoints (2) und Combo bleiben gleich; neu je Welt sind Kulisse, Hindernisse, Gegner, Boss, Boss-Intro-Satz (Mr. Alex) und Trophäe. Die Welten folgen der Landmark-Reihenfolge der Hall of Fame (Route New York → Westküste).

| Welt | Staat · Landmark | Kulisse (Parallaxe) | Hindernisse / Besonderheit | Gegner (3) | Endboss | Boss-Intro (Mr. Alex) | Trophäe |
|---|---|---|---|---|---|---|---|
| 1 ✓ | New York · Statue of Liberty | Skyline, Hafen, Wasserlücken | Kisten, Wasser | Taube, Waschbär, Eichhörnchen | Mr. Alligator (Kanaldeckel) | „It's time for Mr. Alligator!“ | Liberty Finder |
| 2 ✓ | Illinois · Route 66 (Start in Chicago) | Highway, Tankstellen, Motel-Schilder, Wüste wird Richtung Westen gelb | **Autos/Trucks** als rollende Hindernisse (drüberspringen), Ölflecken (rutschen), Reifenstapel statt Kisten | Kojote, Straßenläufer (Roadrunner), Gürteltier | **Big Rig Bob**, ein brummiger Truck, stellt die Frage per Hupe | „Here comes Big Rig Bob!“ | Route 66 Rider |
| 3 ✓ | Arizona · Grand Canyon | rote Felsen, Schluchten, Hängebrücken, Geier am Himmel | **Fallende Steine**, Hängebrücken, die wackeln (Timing), Kakteen (Berührung = Leben weg) | Klapperschlange, Geier (fliegt wie Taube), Skorpion | **Sheriff Rattlesnake** (Riesenklapperschlange mit Sternabzeichen) | „Watch out – Sheriff Rattlesnake!“ | Canyon Climber |
| 4 ✓ | South Dakota · Mount Rushmore | Wald, Berge, die vier Köpfe wachsen im Hintergrund, Büffelherde als Silhouette | **Baumstämme** rollen, Bäche, Wind-Böen schieben die Figur (kurz), Bärenhöhlen | Büffel (rennt durch, nicht platt zu drücken), Biber, Adler | **Grizzly Grandpa**, ein alter Bär mit Brille, der strenge Fragen stellt | „Oh no – Grizzly Grandpa is awake!“ | Rushmore Ranger |
| 5 ✓ | California · Golden Gate Bridge | Nebel, Brückenpfeiler, Trams, Pazifik, Hollywood-Sign als Bonus-Ende | **Nebelabschnitte** (Sicht eingeschränkt, Diamanten leuchten), Seilbahn-Plattformen, Surfbrett-Rutsche | Möwe (klaut einen Diamanten, wenn man nicht springt), Seelöwe, Skater | **Captain Fog**, ein Nebel-Geist mit Kapitänsmütze, die Tür ist das Brückentor | „Captain Fog is blocking the bridge!“ | Golden Gate Legend |

## Freischaltung und Fortschritt
- Welt n+1 öffnet sich, wenn Welt n mindestens **Silber** hat. Im Runner-Start wählt man die Welt (Reiter mit 🔒 bis freigeschaltet). **Gebaut 29.10.** (`runnerWeltOffen`, Welt-Reiter `.runner-welten`, Hinweis „Silber in New York nötig“).
- Ticket gilt für jede Welt gleich (100 Coins). Trophäen Gold/Silber je Welt, Runner-Titel zählt alle geschafften Level (Noob 1 · Rookie 3 · Pro 6 · Elite 10 · Legend 15 → mit 5 Welten und Wiederholungen erreichbar).
- Wörter: Unit-Wahl wie bisher; **Vorschlag**: Welt 2 Standard Unit 1, Welt 3–5 Unit 2/3 (frei änderbar, der Schüler darf überschreiben).
- Hall of Fame: fünf Trophäen-Plätze (seit 30.10. alle fünf echt, kein 🔒-Platzhalter mehr).

## Schwierigkeit (leicht ansteigend)
Welt 2: schneller Verkehr, sonst wie 1 · Welt 3: Timing (Brücken, Steine) · Welt 4: Schub-Effekte und Gegner, die man nicht plattdrücken kann · Welt 5: Sicht (Nebel) und die Möwe, die Diamanten klaut. Tempo der Figur bleibt gleich, damit die Sprache lesbar bleibt.

## Audio-Bedarf (Vormerkliste, Mr. Alex)
Boss-Intro + 2 Sprüche je Welt (richtig/falsch) ≈ 4 × 110 Zeichen ≈ 450 Zeichen; Levelstart/-ende („Let's find Route 66!“, „You made it to the Grand Canyon!“) Jeremy/Jessica ≈ 4 × 2 × 45 ≈ 360 je Stimme.

## Aufwand
Je Welt ≈ ½–1 Tag (Kulisse, 3 Gegner, Boss mit Animation, Level-Muster mit der Besonderheit, Tests). Gesamt ≈ 3–4 Tage. Reihenfolge: Welt 2 zuerst, nach Abnahme 3–5 (Welt 3, 4 und 5 gebaut 30.10.).

## Fragen an Mr. Alex
1. Reihenfolge und Zuordnung Landmark ↔ Welt so in Ordnung (Route 66 vor Grand Canyon, Rushmore, Golden Gate)?
2. Bosse und Namen (Big Rig Bob, Sheriff Rattlesnake, Grizzly Grandpa, Captain Fog) – passt der Humor?
3. Freischaltung über Silber in der Vorwelt, oder alle Welten sofort offen?
4. Besonderheiten zu hart für Klasse 9 (Nebel, Möwe klaut Diamant)?

## London Run (Klasse 6) – Welten 1 bis 5 (Stand 31.10.2026)
Gleiche Engine, gleiche Regeln (Freischaltung über Silber in der Vorwelt, Ticket 150, Trophäe je Welt, Titel Rookie Runner → Superhero of London). Dazu der fortlaufende Story-Modus mit Sergeant Bearskin (`story-london-0n.md`, `story-sprache.md`): jede Welt hat eine Entscheidung, die gespeichert wird und weiterwirkt.

| Welt | Landmark | Kulisse | Hindernisse / Besonderheit | Gegner | Boss | Story-Kapitel | Trophäe |
|---|---|---|---|---|---|---|---|
| 1 ✓ | Westminster · Big Ben | Themse, Big Ben + Parlament, Niesel → Regenbogen | Doppeldecker/Black Cabs, Pfützen, Telefonzellen/Postkästen, Themse-Lücken | Taube, Stadtfuchs, Eichhörnchen | Sergeant Bearskin am Tor der Horse Guards | „The Guard Who Never Moved“ (Fuchs/Taube → `wahl.g1`) | Big Ben Finder 🔔 |
| 2 ✓ | London Eye (South Bank) | das große Rad steht still, County Hall, Souvenirstände, Straßenkünstler | wie 1 + **Kabinen-Plattformen**, **Maschinenraum** (dunkel, Lampen, roter Knopf) | + **Möwe** (klaut einen Diamanten) | Sergeant Bearskin in der obersten Kabine (Kamera fährt hoch), Tür = Kabinentür | „The Wheel That Stopped“ (Begleiter aus Welt 1; Maschinenraum/aufs Rad → `wahl.g1`) | Eye Spy 👁️ |
| 3 | Tower Bridge | Brücke, die sich öffnet | Brückenklappen (Timing) | geplant | Sergeant Bearskin (Raben?) | „Up Goes the Bridge“ (Raben oder Hut retten; liest `story.londoneye.wahl.g1`) | geplant |
| 4 | The Tube | U-Bahn | Züge, Rolltreppen | geplant | geplant | „Mind the Gap“ (zurückgehen oder weiterfahren) | geplant |
| 5 | Wembley | Stadion | geplant | geplant | geplant | „The Big Match“ (drei Enden je nach Summe der Entscheidungen) | geplant |

**Gebaut:** Welt 1 (31.10., `konzept-entwurf.md` Abschnitt 14/15), Welt 2 (31.10., Abschnitt 18, Test `runner6_welt2.js`). Schwierigkeit: Welt 2 etwas schwerer als Welt 1 (Möwe, Kabinen-Sprünge, Dunkelheit). Audio: Vormerkliste in `docs/ideenspeicher.md`.
