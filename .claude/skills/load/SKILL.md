---
name: load
description: Startet einen neuen Arbeitsblock in einem frischen Chat (Projekt School, Mr. Alex) – liest die Regeln und den Stand aus dem Repo, nennt die offenen Blöcke und fragt, welcher dran ist. Aufruf mit /load, optional mit Thema (z. B. /load Staaten-Fotos).
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
0. Vorab: `git fetch` und den aktuellsten `claude/...`-Branch nehmen (`git branch -r --sort=-committerdate | head -3`), nicht den Standard-Branch; sonst fehlt der Ideenspeicher. „Französisch-App“ = Schul-App Klasse 5/6 in diesem Repo (`app/franz/`), nicht „Mon français“ (Languages).
4. Am Ende des Blocks `/save` ausführen (oder Mr. Alex erinnern, es zu sagen).
