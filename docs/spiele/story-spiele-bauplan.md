# Story-Spiele – Bauplan (Master, 17.11.2026)

Wie „The Keys of the Tower“ (EN6) und „After Hours“ (EN9) gebaut werden: Bausteine, Reihenfolge, Werkzeuge, Aufwand, Risiken. Konzept: `story-spiele-konzept.md`, Kapitel 1: `keys-of-the-tower-01.md`. Noch nichts davon ist gebaut. Zahlen zum Aufwand sind Schätzungen.

## 1. Grundsatz: eine Engine, viele Kapitel
Wie beim Runner (`app/klasse9/runner.js`, eine Datei für alle drei Apps) entsteht **eine gemeinsame Abenteuer-Engine** (`adventure.js`). Sie weiß nichts über London oder New York. Alles Inhaltliche steht in Daten: Räume, Gegenstände, Zeilen, Zeugen, Karten. Ein neues Kapitel ist dann Text, Ton und ein Bild – kein neuer Code.

## 2. Die sechs Bausteine
| Baustein | Was er tut | Woraus |
|---|---|---|
| **Raum-Ansicht** | **seit 17.11.: echter 3D-Raum zum Umsehen und Bewegen, Gegenstände direkt antippbar** (vorher: breites Bild zum Schieben) | glTF aus Blender mit eingebranntem Licht, Three.js (Abschnitt 3) |
| **Zeilen-System** | spielt Zeilen mit Ton, zeigt Text; Feder (Deutsch), „Sorry?“ (noch einmal, langsamer), einfachere Zweitfassung bei Kernzeilen | eine Tabelle je Kapitel |
| **Notizbuch** | Karten (Deutsch links, Englisch rechts, Ton), „The story so far“, Fall-Bericht mit Lücken, Detective's Notes | aus derselben Tabelle |
| **Begleiter und Zauberer** | Fuchs kommentiert; Zauberer (Mr. Alex) im Zauberspiegel gibt auf Antippen Tipps | Zeilen mit Auslöser („wenn Gegenstand 3 angetippt“, „wenn 60 s nichts passiert“) |
| **The Den** | eigenes Zimmer: Figur umziehen, Möbel stellen, Fundstücke | vorhandene Figur-Zeichnung (`zeichneFigur`, Skins), Möbelbilder aus Blender |
| **Karte und Fortschritt** | Orte mit „?“, Seitenstränge, gefundene Raben, Entscheidungen | Spielstand im vorhandenen Siegel |

## 3. Der Weg eines Raums – NEU seit 17.11.: echtes 3D im Browser
**Grundsatzentscheidung Mr. Alex 17.11.:** Die Räume laufen als echtes 3D im Browser (Three.js mit glTF-Modellen, Blender baut die Modelle) – wie am 15.11. ursprünglich geplant. Das gerechnete Standbild war nur ein Test. Die frühere Festlegung „gerechnete Bilder statt echtem 3D“ (unten, Abschnitte 2 und 7) kam vom Master aus Vorsicht wegen der Schul-Laptops und war nie seine Entscheidung („Die Laptops schaffen das schon“).
1. **Blender, lokal auf AlexPC:** `werkzeuge/blender/guardroom.py` baut den Raum vollständig in 3D (Modelle und Texturen von Poly Haven, CC0, über `modelle_holen.py`); dazu `tower_jacke.py`, `tower_figuren.py`.
2. **Licht vorrechnen und einbrennen:** Die Stimmung (Kerzen, Kamin, Fenster) wird in Blender gerechnet und in die Oberflächen gebacken; der Browser muss kein Licht rechnen.
3. **Raum als glTF in den Browser:** frei umsehen und bewegen, Gegenstände direkt antippen (statt Tipp-Flächen auf einem Bild).
4. **Figuren live:** mit Gerüst für Gesten und Gesichtsformen für Mimik. Mr. Alex: Die Figuren sind das Wichtigste, dann Mimik und Gestik.
5. **Zuerst eine technische Probe** (`/load Keys of the Tower 3D`, neuer lokaler Chat): der jetzige Raum mit eingebranntem Licht im Browser, umsehen, einen Gegenstand antippen – auf Schul-Laptop und iPad ausprobieren, bevor etwas umgebaut wird. Three.js (frei, rund 1 MB) darf geladen werden.
6. **Reihenfolge danach:** Figuren · Mimik und Gestik · Außenszene am Tower für den Anfang · Feuer · zuletzt das stille Mitschreiben auf dem Gerät.
7. **Bleibt nutzbar:** Texte, Ton, Spiellogik (`app/tower/tower.js`), Testprogramm-Weg; die Bildfassung bleibt vorerst bestehen (Kachel nur mit `?tower`).

**Geräte und Bedienung (Mr. Alex 17.11.):** Zurzeit hat jedes Kind einen **HP ProBook, ein Hybrid-Laptop mit Touch-Bildschirm**; später steigt die Schule auf **iPads** um. Deshalb gilt: **Alle Bewegungen im Raum werden von Anfang an für Touch gebaut** – was mit dem Finger geht, geht auf beiden Geräten und bleibt beim Umstieg gültig. Maus und Touchpad müssen dasselbe können; nichts darf nur mit der Tastatur erreichbar sein.
*Vorschlag des Masters dazu, noch nicht entschieden:* mit einem Finger ziehen = umsehen · Gegenstand antippen = ansehen/auslösen · auf den Boden oder einen markierten Punkt tippen = dorthin gehen (kein Steuerkreuz, keine Tastenbelegung) · zwei Finger = heranholen, nur wenn es sich bewährt · Maus: ziehen und klicken wie der Finger. Die technische Probe prüft genau diese Gesten auf dem ProBook (Touch und Touchpad) und auf einem iPad.

**Risiken des neuen Wegs, vor dem Umbau mit der Probe klären:** Bildrate auf den Schul-Laptops (1366×768, eingebaute Grafik) und iPads · Größe je Raum (Modelle und gebackene Texturen statt 300 KB Bild; Kapitel weiter erst beim Betreten laden) · Bedienung mit Maus, Touchpad und Finger · das Testprogramm muss 3D ohne Grafikkarte prüfen können.

### Früherer Weg (bis 17.11., nur noch für die Bildfassung)
1. **Blender, lokal:** Raum aus freien Modellen (Kenney, Quaternius, Poly Haven – gemeinfrei) zusammenstellen, Licht setzen.
2. **Ein Skript rechnet drei Dinge auf einmal:** das Bild · je Gegenstand eine Maske (für die Tipp-Fläche und das Leuchten) · eine kleine Datei mit Namen und Lage jedes Gegenstands. Niemand zeichnet Tipp-Flächen von Hand.
3. **Im Handy ist es nur ein Bild mit Flächen:** läuft auf alten Geräten, bleibt klein (geschätzt 200–400 KB je Raum), geht offline.
4. **Später möglich:** Rundum-Panorama desselben Raums, kurze Filme zwischen den Kapiteln, echtes 3D für einzelne Szenen.

Grundlage ist das Probe-Skript `werkzeuge/blender/bigben.py` (15.11.).

## 4. Der Weg des Textes
1. Kapitel als lesbares Dokument (wie `keys-of-the-tower-01.md`), Mr. Alex liest gegen.
2. Daraus eine Tabelle je Kapitel: Kennung · Sprecher · Englisch · Deutsch (Feder) · einfachere Fassung (nur Kernzeilen) · Gegenstand, der leuchtet · Auslöser.
3. Prüfungen vor dem Ton: `werkzeuge/wortcheck.py` (Niveau), Satzlänge, jede Wendung kommt dreimal vor.
4. Vertonung mit einem Skript nach dem Muster von `story_audio.py` (zählt zuerst, überschreibt nie); ausgefallene Namen mit Lautschrift-Feld; Probehören durch Mr. Alex.

## 5. Reihenfolge
| Schritt | Inhalt | Wo | Aufwand |
|---|---|---|---|
| A | Texte EN6 Kapitel 1 fertig (Deutsch für die Feder, Zweitfassungen, Zauberer- und Fuchs-Zeilen) | Master oder Text-Chat | klein |
| B | Ton Kapitel 1 (ca. 3.500 Zeichen mit Zauberer und Zweitfassungen) | Text-Chat | klein |
| **C** | **Spielbare Probe von Kapitel 1** mit einfachem Bild (Blender in der Cloud oder gezeichnet), echten Texten und echtem Ton | Block-Chat | mittel |
| **D** | **Fünf bis zehn Kinder spielen die Probe.** Was hält sie, wo steigen sie aus, was tippen sie an? Erst danach weiter. | Mr. Alex | – |
| E | Schöne Räume aus Blender, lokal, mit dem Skript aus 3 | lokaler Chat | mittel je Raum, der erste groß |
| F | The Den (Umziehen, Einrichten) | Block-Chat | mittel bis groß |
| G | Kapitel 2–7, je Text → Ton → Raum; danach EN9 mit derselben Engine | laufend | je Kapitel klein bis mittel |

**Warum C und D vor den schönen Räumen:** Die teuerste Arbeit sind Räume und Zimmer. Ob die Kinder die Geschichte freiwillig spielen, zeigt eine einfache Probe für einen Bruchteil davon. Das ist die Regel „Würden die Kinder das freiwillig spielen?“ als Arbeitsschritt.

## 6. Einbau in die Apps
- Eigene Kachel neben dem Runner; die Engine als eine Datei für EN6 und EN9.
- Spielstand im vorhandenen Siegel und Protokoll; Punkte und Coins nur dort, wo Mr. Alex es entscheidet.
- **Größe:** Die Apps haben heute zusammen rund 160 MB. Kapitel werden deshalb erst beim ersten Betreten geladen, nicht bei der Einrichtung.
- **Testprogramm:** neue Wege „Kapitel starten, Gegenstand antippen, Zeuge, Ausgang“ in allen drei Formaten; jeder gemeldete Fehler zuerst als Test.

## 7. Risiken
| Risiko | Gegenmittel |
|---|---|
| Die Kinder spielen es nicht | Probe mit echten Kindern (Schritt D), bevor Räume gebaut werden |
| Zu viel Text, zu wenig Tun | je Zeile höchstens ein Satz am Stück, alle 20–30 Sekunden etwas zum Antippen |
| Ton wird teuer | erst Kapitel 1; Zweitfassungen nur für Kernzeilen; vor jedem Lauf zählen |
| App wird zu groß | Kapitel nachladen, Bilder klein halten |
| Schwächere Schul-Laptops | **seit 17.11.:** Licht vorrechnen und einbrennen, technische Probe auf Schul-Laptop und iPad vor jedem Umbau (vorher: gerechnete Bilder statt echtem 3D – aufgehoben von Mr. Alex) |
| Aussprache der Namen | Probehören, Lautschrift |
| Zu viele Baustellen gleichzeitig | ein Bau-Chat zur Zeit; der Den kommt nach der Probe |

## 8. Entschieden (Mr. Alex, 17.11.)
Raben nach König Artus' Hof (Arthur, Guinevere, Lancelot, Morgana, Gawain, Percival, Mordred = die Elster) · Zauberer mit seiner Stimme als antippbarer Tippgeber · der Fuchs als frecher Begleiter · Toni/Jonas gestrichen · Feder und „Sorry?“ als Hilfen · eigenes Zimmer The Den · Texte und Ton dürfen jetzt entstehen, gebaut wird nach den GLN.

## 9. Antworten Mr. Alex (17.11.) und was noch offen ist
- **Probe:** ja, in Klasse 6.
- **Zugang:** frei, nie hinter Coins; niedrige Schwelle, aber verdient – eine Runde Word Gym oder die Hausaufgabe öffnet das nächste Kapitel; die ersten zwei Minuten sind für alle frei.
- **Dauer und Speichern:** 10–15 Minuten je Kapitel, überall unterbrechbar, von selbst gespeichert, sichtbar als Truhe (Konzept 7a). Ein Kapitel noch einmal machen zu müssen wäre der „Frust des Monats“.
- **Frust vermeiden** ist ein eigenes Konzept (Konzept 7b).
- **Belohnung:** Punkte, Fundstücke und Möbel.
- **Erscheinen:** Kapitel werden freigespielt; Film mit Haken, dann Schlüssel (Konzept 7c).
- **Wiederspielen** ist Pflichtbestandteil (Konzept 7d).
- **Geräte:** gebaut für Laptops und iPads (Querformat, große Fläche). Handys sind nur die Notlösung, werden aber weiter mitgetestet.
- **Der Fuchs:** Gary the Great, der Möchtegern-Zauberer; wahrer Name Foxy McFoxface (Seitenstrang). **Für eine spätere Figur aufgehoben:** Colin, der Fuchs bzw. das Tier, das sich für einen Geheimagenten hält („Agent Colin to base. There is no base.“). **Der Zauberer heißt Mr. Flex** (entschieden 17.11., zuerst Mr. Flex): nach einem Foto von Mr. Alex gezeichnet, etwas Gandalf/Dumbledore, mit Sonnenbrille.
- **Arbeitsreihenfolge (Mr. Alex 17.11.):** erst die Figuren, dann die Orte, dann die Geschichte, dann die Kapitel. Figuren: `keys-of-the-tower-figuren.md`.
