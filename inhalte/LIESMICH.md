# inhalte/ – Inhalte der App Klasse 6 (English Power Game)

Alle Dateien sind Tab-getrennte Tabellen (TSV) mit Kopfzeile. Nach jeder Änderung: `python3 werkzeuge/daten_bauen.py` (baut `app/daten.js`) und pushen.

## hausaufgabe.tsv – 📝 Homework

Eine Zeile je Hausaufgabe, Spalten `von	bis	ziel	text` (Tab-getrennt):

| Spalte | Bedeutung |
|---|---|
| `von`, `bis` | Zeitraum `JJJJ-MM-TT`, beide Tage eingeschlossen (Ortszeit des Geräts). Nur in diesem Zeitraum zeigt die App Knopf „📝 HW“, Chip-Zeile und Schilder; Teile der Hausaufgabe bringen dann **+50 % Punkte** (aufgerundet, je Teil einmal). |
| `ziel` | Was zu tun ist – eine ganze Station, ein Abschnitt oder ein einzelner Teil (Schema unten). **Mehrere Ziele** durch `;` getrennt (`6/3; 8`): die App führt sie als Kette in dieser Reihenfolge (Knopf und Chip springen zum ersten noch offenen Ziel, Chip zählt „HW 1/2“, Übersicht über ▾). |
| `text` | Kurzer Text für Chip-Zeile und Knopf, z. B. `Hörübung 3 „Talking about free time“`. |

Mehrere Zeilen = mehrere Wochen im Voraus. Gilt heute mehr als eine, zeigt die App die mit dem frühesten `von`. Zeilen, deren `von` mit `#` beginnt, werden übersprungen.

### Schema der Spalte `ziel`

`Station[/Abschnitt[/Teil]]` – Nummern wie in der App, Namen genau wie angezeigt. Das Bauskript bricht mit einer klaren Meldung ab, wenn es das Ziel nicht gibt, und listet dabei alle Möglichkeiten auf.

| Ziel | Bedeutung |
|---|---|
| `6` | ganze Station 6 (Hörverstehen): alle Teile |
| `6/3` | Station 6, Teil 3 = „Hören 3“ (Station 6 hat keine Abschnitte, darum ist die zweite Zahl der Teil) |
| `6/Hören 3` | dasselbe über den Namen des Teils |
| `7/2` | Station 7 (Vokabeln), Abschnitt 2 („Topic 1 · Teil 1“) mit allen Teilen |
| `7/Topic 1 · Teil 1/2` | Abschnitt über den Namen, dann Teil 2 („Bild → Wort“) |
| `8/How often? (never … always)/Ordnen` | Station 8 (Neu), Thema über den Namen, Teil „Ordnen“ |
| `2/3` | Station 2, Teil 3 = „Teil A · Stufe 3“ (Listen-and-Repeat-Schritte zählen je Stufe als eigener Teil, wie oben in der Sprungleiste) |
| `6/3; 8` | Kette aus zwei Zielen: erst Hören 3, dann die ganze Station 8 (alle drei Themen). Jedes Ziel ist eine Zeile in der Übersicht; `8/1; 8/2; 8/3` würde die drei Themen als drei eigene Ziele zählen. |

Regeln:
- Stationen **mit Abschnitten** (7 Vokabeln, 8 Neu): zweites Feld = Abschnitt (Nummer ab 1 oder Name), drittes Feld = Teil.
- Stationen **ohne Abschnitte** (1–6): zweites Feld = Teil (Nummer ab 1 oder Name), kein drittes Feld.
- Teile werden gezählt, wie die Sprungleiste sie zeigt: `Teil A · Stufe 1` … `Stufe 4`, `Übersicht`, `Hören 3`, `Wörter`, `Bild → Wort` …
- Enthält ein Name einen Schrägstrich (z. B. „a.m. / p.m.“), bitte die Nummer nehmen.
- Mehrere Ziele: mit `;` trennen, Reihenfolge = Reihenfolge der Kette. Ein Ziel gilt als erledigt, wenn alle seine Teile fertig sind.

Beispielzeile:
```
2026-11-02	2026-11-08	6/3; 8	Hörübung 3 + Neu: How often, Sports and hobbies, School clubs
```
Schema und Anzeige: `docs/gamification/konzept.md`, Abschnitt „📝 Homework“.
