# Word Gym – tägliches Vokabeltraining (Konzept)

Stand: 16.10.2026. Abgesegnet von Mr. Alex (Chat 16.10.). Vorlage: « Séance du jour » aus der Französisch-App
(Übergabe `langenbachalex/Languages/docs/export/seance-du-jour`). Reihenfolge: **Klasse 9 zuerst**, Test durch Mr. Alex, dann Klasse 6.

## Idee
Jeden Tag ein kleines, festes Pensum: **neue Wörter hören und nachsprechen, fällige Wörter aus dem Deutschen abrufen**,
laut sagen, dann selbst bewerten („I knew it“ / „Again“). Kein Tippen, keine Auswahl – hören, sprechen, einschätzen. Dauer 5–8 Minuten.

## Entscheidungen
| Punkt | Klasse 9 | Klasse 6 |
|---|---|---|
| Kartenpool | 230 Vokabeln, je mit Beispielsatz | 104 Vokabeln (Symbol + Deutsch); Beispielsätze werden noch geschrieben und aufgenommen |
| Reihenfolge neu | Unit 2 in Buchreihenfolge, danach Unit 1 | Unit 3 in Buchreihenfolge |
| Pensum (Standard) | 4 neu + 8 Wiederholungen | 3 neu + 6 Wiederholungen |
| Einstellbar durch Schüler | neu 1–6, Wiederholungen 4–12; Standard als „von Mr. Alex empfohlen“ markiert; gilt ab morgen (oder heute, wenn heute noch nicht begonnen) | gleich |
| Sprechzeit-Minimum | 1,5 s | 1,5 s |
| Lob | mit deutscher Übersetzung darunter im G-Kurs | immer mit Übersetzung |
| Belohnung | fertiges Word Gym = 30 Punkte, zählt als Übungstag (Serie, Perfect week) und als ein Teil für die USA-Karte | gleich (London) |
| Start | alle Schüler fangen frisch an | gleich |
| Name / Platz | „Word Gym“, große Karte oben auf der Startseite mit Stand und Punkten; Icon: Gewichtheber mit Büchern (Variante C, hebt die Hantel einmal, wenn das Tagespensum fertig ist) | gleich |

## Boxen (Spaced Repetition)
- Jedes Wort hat Stufe 0–7 und Fälligkeitsdatum. Neu: Stufe 0, fällig morgen.
- „I knew it“: Stufe +1, fällig nach 1 · 3 · 7 · 14 · 30 · 60 · 120 Tagen (Stufe 7 → 120 Tage).
- „Again“: Stufe 0, fällig morgen; kommt im selben Word Gym noch einmal ans Ende der Reihe (höchstens einmal).

## Tagesplan
- Einmal pro Kalendertag (Ortszeit) berechnet und gespeichert; bleibt den ganzen Tag gleich.
- Wiederholungen: alle fälligen Wörter, älteste Fälligkeit zuerst, dann Buchreihenfolge; auf das Pensum gekürzt.
- Neu: die nächsten Wörter in Buchreihenfolge, die noch nie gelernt wurden.
- Reihe: erst Wiederholungen, dann Neues. Abbrechen ist harmlos – Erledigtes bleibt, der Rest wartet.

## Bildschirme
1. **Startkarte** (Startseite oben): Icon, „Word Gym“, Stand („4 new · 6 to revise · 2 / 10 done“), Punktereihe, Knopf „▶ Let's go“ bzw. „✓ Done for today“, kleines ⚙ für das Pensum.
2. **Neue Karte:** Wort groß, Deutsch, Beispielsatz (Wort fett) mit Übersetzung (G); Wort und Satz werden vorgespielt; Sprechbalken; „Next“ erst nach der Sprechzeit.
3. **Wiederholkarte:** deutsches Wort (+ deutscher Satz) → Denkzeit → „Solution“ zeigt Englisch, spielt Wort und Satz, Sprechbalken → „😊 I knew it“ / „🔁 Again“.
4. **Ende:** „That's it for today!“ (oder „Break!“ bei Abbruch), ein starkes Lob mit Übersetzung, dann Mr. Alex: „That's it for today. See you tomorrow!“ Beim ersten vollständigen Abschluss des Tages: 30 Punkte, Serien, ggf. neuer Staat; Icon hebt die Hantel.

## Speicher (nur auf dem Gerät, in `america9-v1` bzw. `auffrischen-v1`)
```
gym: { karten: { "u2_001": { s: 2, f: "2026-10-19" } }, tag: { d, wdh, neu, fertig, geschafft }, pensum: { neu: 4, wdh: 8 }, seances: 3 }
```

## Audio
Alle Wörter und Sätze sind vorhanden. Neu (Mr. Alex): „That's it for today. See you tomorrow!“ und „Break! Come back later and finish your Word Gym.“ Lob-Übersetzungen nur als Text (`inhalte/lob.tsv`, Spalte `de`).

## Erfahrungen aus der Französisch-App (übernommen)
Sprechen vor „Next“ erzwingen; Lob übersetzen; Datum in Ortszeit; Tagesplan zwischenspeichern; Pensum klein halten.

## Ergänzungen (23.10.2026)
- **Spiel nach dem Tagespensum (Klasse 9, Lösung B):** Ist das Word Gym des Tages fertig, erscheint auf der Endseite und auf der Startkarte „🎲 Memory“. Die Paare kommen aus den Wörtern von heute (englisches Wort ↔ deutsche Bedeutung, 6 Paare, bei wenigen Wörtern aufgefüllt mit schon geübten). Punkte (24.10.): **+10 für das erste gewonnene Memory pro Tag**, danach keine mehr (kein „Farmen“). Klasse 6 bekommt es später.
- **Vokabeln Klasse 6 (Satztechnik):** Wörter mit Beispielsatz (Audio), neuer Schritt „Bild → Wort“ (27 eindeutig bebilderte Wörter), Lückensätze für alle 104 Wörter, bei der Abfrage erscheint nach „Lösung“ der Satz.
- **Eintippen (Klasse 6, ⌨-Knopf oben):** an/aus, auf dem Gerät gemerkt. Gilt für Bild → Wort, Lückensätze und Deutsch → Englisch (nur Wörter, die man eindeutig tippen kann). 0 Fehler = richtig · 1 Fehler = richtig, die genaue Schreibweise wird gezeigt · mehr als 1 Fehler = neutral „OK. So schreibt man es: …“ ohne Lob (bei der Abfrage kommt das Wort zum Wiederholen). Wörter bis 2 Buchstaben müssen genau stimmen.
- **Ton-Reihenfolge (24.10.):** Belohnungs-Stimmen laufen nie mehr durcheinander. Lob und Schlusssatz werden nicht mehr vom Pop-up abgeschnitten; spricht ein großes Pop-up (Titel, Serie, Landmark/Superheld), entfällt das kleine Lob davor. Der Orts-/Staaten-Stempel erscheint nach dem Pop-up und erst, wenn es still ist.
