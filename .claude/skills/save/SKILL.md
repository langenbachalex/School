---
name: save
description: Schließt einen Arbeitsblock ab (Projekt School, Mr. Alex) – schreibt Stand und offene Punkte in docs/ideenspeicher.md, committet, pusht nach OK und nennt den Startsatz für den nächsten Chat. Aufruf mit /save.
---

# Arbeitsblock abschließen

Claude führt diesen Ablauf am Ende jedes Blocks selbst aus (Regel Mr. Alex 8.11.), auch wenn der Stop-Hook ihn anmahnt; Mr. Alex muss /save nicht tippen.

1. Prüfe `git status --short` und `git log origin/<branch>..HEAD --oneline`: Was ist noch nicht committet oder gepusht?
2. Trage in `docs/ideenspeicher.md` ein (kurz, in die passende Tabellenzeile oder eine neue): was in diesem Block gebaut wurde (Datum, Commit-Kurzhash), was offen blieb, bekannte kleine Mängel, laufende Hintergrundarbeiten (z. B. Foto-Downloads) und Entscheidungen von Mr. Alex, die noch nirgends im Repo stehen. Regeln von Mr. Alex gehören zusätzlich nach `docs/briefing.md`. Jeden Eintrag mit App-Kürzel (EN6/EN9/FR/ALLE) beginnen und die Zeile dieses Chats in der Tabelle „Chat-Übersicht“ anlegen oder aktualisieren (Name nach Schema `School · <App> · <Block> · <Datum>`, Stand läuft/fertig).
3. Committe nur diese Doku-Änderung (deutsche Nachricht) und frage einmal nach dem Push-OK, falls nicht schon gegeben.
4. Antworte in höchstens 6 Zeilen: was eingetragen wurde, was gepusht ist, und der Startsatz für den nächsten Chat: `/load <nächstes Thema>`.
