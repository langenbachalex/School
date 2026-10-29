# inhalte/klasse9/ – Inhalte der App Klasse 9 (Road Trip USA)

Alle Dateien sind Tab-getrennte Tabellen (TSV) mit Kopfzeile (Listening: `listening.json`). Nach jeder Änderung: `python3 werkzeuge/klasse9_bauen.py` (baut `app/klasse9/daten.js`) und pushen.

## hausaufgabe.tsv – 📝 Homework

Eine Zeile je Hausaufgabe, Spalten `von	bis	ziel	text` (Tab-getrennt):

| Spalte | Bedeutung |
|---|---|
| `von`, `bis` | Zeitraum `JJJJ-MM-TT`, beide Tage eingeschlossen (Ortszeit des Geräts). Nur in diesem Zeitraum zeigt die App Knopf „📝 HW“, Chip-Zeile und Schilder; Teile der Hausaufgabe bringen dann **+50 % Punkte** (aufgerundet, je Teil einmal). |
| `ziel` | Was zu tun ist – eine ganze Kategorie, eine Gruppe (Unit-Abschnitt oder Thema) oder ein einzelner Teil (Schema unten). |
| `text` | Kurzer Text für Chip-Zeile und Knopf, z. B. `Vocabulary Unit 2 · Start` (wird in G und E gleich gezeigt). |

Mehrere Zeilen = mehrere Wochen im Voraus. Gilt heute mehr als eine, zeigt die App die mit dem frühesten `von`. Zeilen, deren `von` mit `#` beginnt, werden übersprungen.

### Schema der Spalte `ziel`

`Kategorie[/Gruppe[/Teil]]` – Nummern wie in der App, Namen genau wie angezeigt. Das Bauskript bricht mit einer klaren Meldung ab, wenn es das Ziel nicht gibt, und listet dabei alle Möglichkeiten auf.

| Ziel | Bedeutung |
|---|---|
| `4` | ganze Kategorie 4 (Listening): alle Gruppen und Teile |
| `1/Task words` | Kategorie 1 (Reading), Gruppe „Task words“ mit allen Teilen |
| `1/1` | dasselbe über die Nummer der Gruppe (Reihenfolge wie in der App) |
| `2/u2:Start` | Vocabulary, Unit 2, Abschnitt „Start“ (Unit-Abschnitte immer als `u<Unit>:<Abschnitt>`, z. B. `u1:Theme 1 · Part 2`) |
| `2/u2:Start/1` | davon Teil 1 („Words“) |
| `2/Unit 1 · p. 20` | Vocabulary, feste Gruppe „BE vs AE“ über den Namen |
| `6/Dialogue 1 · Quick agreement/You are A` | Speaking, Dialog, Teil über den Namen |
| `3/1/Sentences · Step 2` | Language, Gruppe 1, Listen-and-Repeat Stufe 2 (jede Stufe zählt als eigener Teil, wie oben in der Sprungleiste) |
| `8` | Games (nur Sprung und Schild – Spiele sind keine Teile, darum gibt es hier keinen Bonus und kein „Erledigt“) |

Regeln:
- Zweites Feld = Gruppe: Nummer ab 1 (nur für die festen Gruppen einer Kategorie), der Name, oder bei Vocabulary der Unit-Schlüssel `u2:Start`.
- Drittes Feld = Teil: Nummer ab 1 oder Name, gezählt wie die Sprungleiste: `Words`, `Sentences · Step 1` … `Step 3`, `Find the word` (nur wenn der Abschnitt Definitionen hat), `EN → DE`, `DE → EN`.
- Enthält ein Name einen Schrägstrich, bitte die Nummer nehmen.

Beispielzeile:
```
2026-11-02	2026-11-08	2/u2:Start	Vocabulary Unit 2 · Start
```
Schema und Anzeige: `docs/gamification/konzept.md`, Abschnitt „📝 Homework“.
