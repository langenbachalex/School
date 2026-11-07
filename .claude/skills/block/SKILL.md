---
name: block
description: Startet einen neuen Arbeitsblock in einem frischen Chat (Projekt School, Mr. Alex) – liest die Regeln und den Stand aus dem Repo, nennt die offenen Blöcke und fragt, welcher dran ist. Aufruf mit /block, optional mit Thema (z. B. /block Staaten-Fotos).
---

# Arbeitsblock starten

Du bist in einem neuen Chat für genau einen Arbeitsblock. Nichts aus früheren Chats ist bekannt – alles Wichtige steht im Repo.

1. Lies kurz (nur die nötigen Teile): `CLAUDE.md`, `docs/token-sparen.md`, in `docs/briefing.md` die Abschnitte „Regeln von Mr. Alex“, in `docs/ideenspeicher.md` die Tabellenzeilen, die „offen“ enthalten (grep), und `git log --oneline -8`.
2. Antworte in höchstens 10 Zeilen:
   - Stand: letzte 3 Commits in je einer Zeile.
   - Offene Blöcke aus dem Ideenspeicher als nummerierte Liste (Titel + grobe Größe klein/mittel/groß).
   - Falls ein Thema übergeben wurde: ein Vorschlag, wie dieser Block mit möglichst wenig Aufwand gebaut wird, plus schlankere Variante.
   - Frage: „Welcher Block, und gilt das OK gleich für den Push?“
3. Danach gelten die festen Regeln: OK vor dem Bauen, Push nur nach ausdrücklichem OK, Commits nur mit den Dateien des Blocks, Tests gezielt, Antworten kurz, Subagenten nur für große Bauten.
4. Am Ende des Blocks `/abschluss` ausführen (oder Mr. Alex erinnern, es zu sagen).
