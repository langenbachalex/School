# Französisch-App (persönlich) – Startnotiz

Stand: 13.10.2026. **Noch nichts bauen.** Zuerst Brainstorming mit Mr. Alex, dann Konzept (`docs/franzoesisch/konzept.md`), dann vor jedem Bauschritt fragen.

## Ziel
Eine persönliche App für Mr. Alex im Stil der Schul-Apps (Klasse 6 in `app/`, Klasse 9 in `app/klasse9/`):
- die **häufigsten Verben, Nomen und Adjektive** nach Frequenz,
- Verben mit den **Grundzeitformen**,
- alles **ausgehend von seiner Lebenswelt**, damit er es sofort konkret anwenden kann,
- schneller, alltagstauglicher Wortschatzaufbau.

## Offene Fragen fürs Brainstorming
1. **Lebenswelt:** Welche Bereiche zuerst? (z. B. Schule und Unterricht, Familie, Alltag und Haushalt, Reisen, Essen, Hobbys, Gespräche mit Kollegen)
2. **Stand:** Anfänger oder Auffrischen von Schulfranzösisch?
3. **Zeitformen:** Mit welchen anfangen? (Présent, Passé composé, Futur proche, Imparfait …)
4. **Frequenzliste:** Welche Quelle (z. B. Frequenzwörterbuch / Korpuslisten) und wie viele Wörter für die erste Stufe (100? 300?)
5. **Übungsformen:** Was aus den Schul-Apps passt? (Listen and Repeat in Stufen, Vokabel-Abfrage, Lückensätze, Dialoge mit Rollen, Find the word …) Was ist neu nötig (z. B. Konjugationstrainer)?
6. **Stimme:** Französische ElevenLabs-Stimmen (Hörprobe vorab), evtl. Mr. Alex' eigene Stimme für Deutsch.
7. **Gamification:** Wie bei den Schul-Apps (Punkte, Serien, Sammlung)? Welches Sammelthema (z. B. Frankreich-Karte mit Regionen, Pariser Orte)? Serien ohne Schulferien-Logik?
8. **Name und Adresse:** z. B. `app/franzoesisch/` → `https://langenbachalex.github.io/School/franzoesisch/`

## Bauplan (bewährt aus den Schul-Apps)
- Inhalte als TSV in `inhalte/franzoesisch/` → Bauskript in `werkzeuge/` → `app/franzoesisch/daten.js`
- Audio über ElevenLabs (Proxy ist verbunden); Skripte überspringen vorhandene Dateien, `--zaehlen` nur nach Absprache nutzen
- Offline-PWA mit eigenem Service Worker (Cache-Präfix eigen wählen), kein Konto, alle Daten nur auf dem Gerät
- Gemeinsame Bausteine wiederverwenden: Sprechzeit-Sperre („Weiter“ erst nach Hören + Sprechen), Lob-Auswahl ohne Wiederholung (`inhalte/lob.tsv`), Reisestempel mit Klang, Sammlung
- Tests mit Playwright (Chromium ist vorinstalliert)
- Veröffentlichung über GitHub Pages wie die anderen Apps
