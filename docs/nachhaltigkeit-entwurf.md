# Nachhaltigkeit: „Alles grün“ wird wieder fällig – ⚡ Power Up (gebaut, siehe unten)

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

## Gebaut (29.10.2026) – beide Klassen
- `stand.teile[key]` ist jetzt `{ am: "JJJJ-MM-TT", s: Stufe }`; alte `true`-Einträge werden beim Laden einmalig zu `{ am: heute, s: 0 }` (Klasse 9 auch die aus `umbau()`).
- **Fällig** (`faellig`): heute ≥ `am` + 30 / 60 / 120 Tage (Stufe 0 / 1 / 2); ab Stufe 3 nie. **GLN-Kopplung an:** `TERMIN["powerup"] = True` in beiden Bauskripten; 14 Tage vor dem Termin bis zum Termin (10.–24.11.) ist alles fällig, was nicht in diesem Fenster erledigt oder aufgeladen wurde.
- Anzeige: Kachel, Abschnitt/Thema, Sprungleiste und Kopf des Teils zeigen gelb mit Schild „⚡ Power Up“ (CSS `.kachel.powerup`, `.powerup-schild`, `.sprung.powerup`, gemeinsam in `app/style.css`). ✓ und grün nur, wenn darin nichts fällig ist; die Abzeichen „All stations“ / „All categories“ ebenso. `stand.erledigt` und `stand.gruppen` bleiben unverändert.
- Startseite: Zeile „⚡ 3 Teile fast leer – aufladen!“ / “⚡ 3 parts running low – power up!” (Singular „1 Teil“ / “1 part”) mit Knopf „⚡ Power Up“ zur ersten fälligen Kachel – nur wenn etwas fällig ist. Klasse 6: „Wahnsinn, du hast alles geschafft!“ erscheint nur, wenn nichts fällig ist.
- Wiederholung eines fälligen Teils: 5 Punkte (wie bisher), `am = heute`, `s + 1`, zusätzlicher Toast „⚡ Aufgeladen!“ / “⚡ Powered up!”. Nicht fälliges Teil noch mal: 5 Punkte, Eintrag unverändert.
- **Timer kürzer** bei jedem Teil, das schon einen Eintrag hat (`lage.tempoFaktor`, beim Start des Teils berechnet): Stufe 0 → 50 %, Stufe 1 → 35 %, ab Stufe 2 → 25 % auf Sprechzeit, Denkzeit und die Mindestzeiten der „Zu schnell“-Prüfung. Word Gym unverändert.
- **Siegel Version 2:** `stand.teile` steckt jetzt im Siegel (`_v: 2`). Ein alter Stand ohne `_v` wird einmalig mit dem alten Siegel geprüft, migriert und neu gesiegelt – kein Banner. Manipulierte `teile` → Sicherung zurück bzw. Reset (dabei werden jetzt auch `teile` und `gruppen` gelöscht, nicht nur `erledigt`).

### Abweichungen vom Entwurf
- Timer-Stufen: Der Entwurf sprach von „50 % bei Stufe 1“; gebaut ist 50 % bei der **ersten Wiederholung** (Eintrag mit Stufe 0), 35 % bei Stufe 1, 25 % ab Stufe 2 – also genau das, was gemeint war (wer ein Teil schon einmal gemacht hat, darf zügig durch).
- Die Kachel zeigt das Schild schon, wenn **ein** fälliges Teil darin liegt – auch wenn die Station noch nicht ganz grün war.
- Kein „Knopf im Teil“; stattdessen Schild im Kopf des Teils und gelbe Markierung in der Sprungleiste (⚡ statt ✓).
- Audio („Powered up!“) wartet auf die ElevenLabs-Credits (Audio-Vormerkliste im Ideenspeicher).

### Tests (Playwright, Scratchpad `powerup.js`)
Erledigen am Tag X → `{am, s: 0}`; X+31 fällig (Zeile, Schild, kein ✓), erneut → +5, Toast „Aufgeladen“, `s: 1`, `am: X+31`; X+31+59 nicht fällig, X+31+61 fällig. GLN-Fenster: erledigt 20.10., heute 12.11. fällig; 9.11. nicht; im Fenster erledigt nicht; nach dem Termin 30-Tage-Regel. Timer: Quizteil mit 1,3 s je Frage beim ersten Mal „Zu schnell“, als fälliges Teil durch. Siegel: Altstand ohne `teile` im Siegel lädt ohne Banner und wird mit `_v: 2` neu gesiegelt; manipulierte `teile` → Banner. Bestehende Tests (gym6t, gym9t, umbau9, akten, siegel) laufen weiter.
