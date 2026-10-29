# Nachhaltigkeit: „Alles grün“ wird wieder fällig (Entwurf zum Absegnen, nichts gebaut)

Stand: 29.10.2026. Problem: Schnelle Schüler haben alle Kacheln grün und keinen Grund, zurückzukommen.

## Regel (Spaced Repetition auf Teil-Ebene)
- Ein erledigter Teil speichert ab jetzt **Datum und Stufe** statt nur „fertig“ (`stand.teile["nr|gruppe|teil"] = { am: "2026-10-29", s: 0 }`; alte `true`-Einträge gelten als heute erledigt, Stufe 0 – nichts geht verloren).
- **Fällig** nach 30 Tagen (Stufe 0), danach 60, 120 Tage (Stufe 1, 2); ab Stufe 3 bleibt es grün.
- Fällig heißt: Teil, Gruppe und Kachel zeigen **gelb mit ↻** („Auffrischen“ / „Refresh“) statt grün. Die Kachel bleibt gelb, bis alle fälligen Teile darin erneut gemacht sind.
- Erneutes Durchmachen eines fälligen Teils: **Wiederholungspunkte** (5, wie heute bei schon erledigten Teilen), zählt als Übungstag für Serie und Perfect week, Stufe +1, wieder grün. Nicht fällige Teile noch mal machen: wie bisher 5 Punkte, aber keine Stufenänderung.
- Mindestzeiten und „Zu schnell“ gelten auch bei der Wiederholung.
- Abzeichen „All categories“ und die ✓-Markierung an der Kachel gelten nur, solange nichts fällig ist.
- Startseite: kleine Zeile „↻ 3 Teile zum Auffrischen“ mit Sprung zur ersten fälligen Kachel (nur wenn etwas fällig ist).

## Optional: Kopplung an GLN-Termine
Zwei Wochen vor dem Termin (`TERMIN` in den Bauskripten, GLN 2 = 24.11.) werden alle erledigten Teile der betroffenen Units **vorzeitig fällig** („Fit für GLN 2“). Kann man an- und abschalten; ich würde es für GLN 2 anschalten.

## Klasse 6
Gleiche Regel, gleiche Fristen (Stationen statt Kategorien). Word Gym bleibt wie es ist (hat schon eigene Boxen).

## Aufwand und Risiko
- 1–2 Tage je App, keine Audios, keine Credits.
- Risiko: Kinder könnten gelb als „Strafe“ empfinden → Wortwahl „Auffrischen“, nie „verloren“; Punkte bleiben, Titel bleiben.
- Siegel: `stand.teile` ist heute nicht im Siegel – ich nehme es mit auf, damit niemand sich „grün“ zurückschreibt.

## Offene Fragen an Mr. Alex
1. 30 / 60 / 120 Tage in Ordnung, oder lieber kürzer (z. B. 21 Tage) für den Start?
2. GLN-Kopplung (zwei Wochen vorher alles fällig) anschalten?
3. Klasse 6 gleich mit?
