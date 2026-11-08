# Hinweise für Claude (Projekt School, Mr. Alex)

## Sparsam arbeiten (Regel Mr. Alex, 2.11.2026)
Die Nutzung (Tokens/Credits) ist knapp. Bei jeder neuen Eingabe zuerst prüfen, wie sie mit möglichst wenig Aufwand umgesetzt werden kann, und das kurz sagen.
- Vor größeren Bauten (neue Welt, neues Kapitel, neues Modul, Umbau über mehrere Dateien) eine kurze Rückfrage mit grober Aufwandsschätzung (klein / mittel / groß) und einer schlankeren Variante, statt sofort zu bauen.
- Subagenten nur, wenn die Arbeit wirklich groß oder parallel ist; kleine Änderungen direkt erledigen.
- Tests gezielt: nur die betroffenen Tests laufen lassen, nicht die ganze Sammlung; Screenshots nur, wenn Mr. Alex etwas abnehmen soll.
- Antworten kurz halten; Wiederholungen von Agenten-Berichten und Stop-Hook-Meldungen mit einem Satz beantworten.
- Dateien nur in den Teilen lesen, die gebraucht werden.
- Weitere Sparregeln: `docs/token-sparen.md`. Neuer Chat: `/load <Thema>` am Anfang, `/save` am Ende (Stand in den Ideenspeicher) – **Claude führt `/save` am Ende jedes Blocks selbst aus** (Regel Mr. Alex 8.11.), ohne auf die Aufforderung zu warten.

## Chats und Apps (Regel Mr. Alex, 8.11.2026)
- **Master-Chat** = Planen und Entscheiden (Modell Fable); gebaut wird in Block-Chats. Jeder Block-Chat heißt `School · <App> · <Block> · <Datum>`; der Master heißt `School · MASTER`.
- **App-Kürzel** (in Chat-Namen, Commit-Nachrichten und im Ideenspeicher immer nennen): `EN6` Englisch Klasse 6 (`app/`), `EN9` Englisch Klasse 9 (`app/klasse9/`), `FR` Französisch Klasse 5/6 (`app/franz/`), `ALLE` = app-übergreifend (Runner-Engine, Skills, Doku). Neue Fächer/Apps bekommen ein neues Kürzel und eine Zeile in der Tabelle „Apps“ im Ideenspeicher.
- Chat-Übersicht (laufende und fertige Block-Chats) steht im Ideenspeicher; `/load` zeigt sie, `/save` trägt den eigenen Chat ein. Zwei Chats an derselben App: vor jedem Bau `git pull`.
- `/name` oder „Wie heißt du?“: Claude nennt den Chat-Namen nach dem Schema als Kopiervorlage (Skill `name`). Fertige Blöcke müssen nicht umbenannt werden.
- **Master-Wechsel** (wenn der Master-Chat voll wird, ca. ab 50–60 % Kontext): im alten Master `/save` (Zeile „School · MASTER · bis <Datum>“ in der Chat-Übersicht, offene Entscheidungen auflisten), neuen Chat öffnen, `/model claude-fable-5-1`, `/load MASTER`, in `School · MASTER` umbenennen; den alten in `School · MASTER · bis <Datum>` umbenennen und archivieren. Der Stand lebt im Repo, nicht im Chat.
- Sicherung: Der Stop-Hook `.claude/hooks/save-pruefen.sh` meldet ungesicherte Arbeit; Claude führt dann `/save` aus.

## Orts-Szenen
Jeder Ort hat drei Ebenen: Bild (Szene mit Runner-Zeichnungen), Ton (Geräusch oder Sprache), kleines Foto. Einzelheiten: `.claude/skills/orts-szenen/SKILL.md`.

## Weitere feste Regeln
- Vor dem Implementieren das Ok von Mr. Alex abholen; pushen und Vorschauen veröffentlichen nur nach ausdrücklichem Ok.
- Superhelden (Spielgrafik, Posen, Gesichter, Stimmen mit Tags, Fotos): Regeln von Mr. Alex vom 7.11. in `docs/briefing.md`, gelten auch für Klasse 9.
- Details und alle weiteren Regeln: `docs/briefing.md`, Ideen: `docs/ideenspeicher.md`, Sprache der Geschichten: `docs/runner/story-sprache.md`, Archiv: `docs/archiv/`.
