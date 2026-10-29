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

## Entscheidungen (29.10.2026)
- Fristen 30 / 60 / 120 Tage · GLN-Kopplung **an** · **Klasse 6 gleich mit**.
- Das Wort „Auffrischen“ wird **nicht** benutzt (altmodisch). Richtung: Wörter retten / Gehirn droht zu vergessen. Name wird gewählt (Vorschläge unten).
- **Timer bei Wiederholung kürzer:** Sprechzeit, Denkzeit und Mindestzeiten auf **50 %** bei der ersten Wiederholung (Stufe 1), **35 %** bei Stufe 2, **25 %** ab Stufe 3 – wer es kann, darf zügig durch.

## Namensvorschläge (Schild an Kachel/Gruppe, Zeile auf der Startseite)
| Name | Schild | Startseite G / E |
|---|---|---|
| **Rescue** (Empfehlung) | 🆘 Rescue | „🆘 3 Teile brauchen dich!“ / “🆘 3 parts need you!” |
| Save the words | 🧠 Save me! | „🧠 Dein Gehirn will 3 Teile vergessen – rette sie!“ / “🧠 Your brain is about to forget 3 parts – save them!” |
| Recharge | 🔋 Recharge | „🔋 3 Teile fast leer – aufladen!“ / “🔋 3 parts running low – recharge!” |
| Fading | 👻 Fading… | „👻 3 Teile verblassen – hol sie zurück!“ / “👻 3 parts are fading – bring them back!” |

**Name gewählt (29.10.): „Power Up“** – Schild ⚡ Power Up; Startseite G „⚡ 3 Teile fast leer – aufladen!“ / E “⚡ 3 parts running low – power up!”; Knopf im Teil „⚡ Power Up“; nach dem Durchgang „⚡ Aufgeladen!“ / “⚡ Powered up!”.
