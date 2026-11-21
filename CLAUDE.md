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
- **Master startet Block-Chats selbst (Regel Mr. Alex, 17.11.2026):** Hat Mr. Alex einen Block freigegeben, legt der Master den Bau-Chat selbst an (Name nach Schema, Branch des Repos, erste Eingabe `/load <Thema>`, Entscheidungen und OK von Mr. Alex im Auftrag), statt ihm nur den Startsatz zu nennen. Weiter gilt: immer nur ein Bau-Chat gleichzeitig.
- **OK im Bau-Chat selbst (Erfahrung 17.11.):** Commit/Push und ElevenLabs-Aufrufe gibt die Rechteprüfung in einem Bau-Chat erst frei, wenn Mr. Alex das OK dort selbst geschrieben hat; ein vom Master weitergeleitetes OK reicht nicht. Der Master sagt Mr. Alex das beim Anlegen und nennt den Satz zum Einfügen.
- **Master nie selbst anlegen (Mr. Alex 17.11.):** Ein vom Master mit `create_session` angelegter Chat hängt in der App unter dem Master („eingenestet“). Für Bau-Chats ist das in Ordnung, für einen neuen Master nicht: Den öffnet Mr. Alex selbst als eigenen Chat und tippt `/load MASTER`; der alte Master macht vorher `/save`, hängt danach die Erinnerungen um und benennt sich um. Vom Master angelegte Chats lassen sich nur archivieren, nicht löschen.
- **Bau-Chats melden sich selbst zurück (Regel Mr. Alex, 17.11.2026):** Der Master schreibt seine eigene Sitzungs-Kennung (`get_session`) in den Auftrag. Der Bau-Chat schickt nach `/save` – oder wenn er festhängt und eine Entscheidung braucht – mit `send_message` eine Meldung an den Master, höchstens 6 Zeilen: Commits, was fertig ist, was Mr. Alex lesen oder abnehmen soll, offene Punkte. Der Master gibt das kurz an Mr. Alex weiter und trägt den Stand in die Chat-Übersicht ein.
- Chat-Übersicht (laufende und fertige Block-Chats) steht im Ideenspeicher; `/load` zeigt sie, `/save` trägt den eigenen Chat ein. Zwei Chats an derselben App: vor jedem Bau `git pull`. **Der Master macht zu Beginn jeder Antwort von sich aus `git pull`** (Mr. Alex 17.11.), solange ein Bau-Chat läuft, und meldet neue Commits in einem Satz. Kein Zeitplan dafür: Jedes geplante Aufwecken kostet den ganzen Kontext.
- `/name` oder „Wie heißt du?“: Claude nennt den Chat-Namen nach dem Schema als Kopiervorlage (Skill `name`). Fertige Blöcke müssen nicht umbenannt werden.
- **Master-Wechsel** (wenn der Master-Chat voll wird, ca. ab 50–60 % Kontext): im alten Master `/save` (Zeile „School · MASTER · bis <Datum>“ in der Chat-Übersicht, offene Entscheidungen auflisten), neuen Chat öffnen, Modell Fable wählen (`/model`, zurzeit `claude-fable-5-2`), `/load MASTER`, in `School · MASTER` umbenennen; den alten in `School · MASTER · bis <Datum>` umbenennen und archivieren. Der Stand lebt im Repo, nicht im Chat.
- **Kontext im Blick (Regel Mr. Alex, 17.11.2026):** Claude erinnert Mr. Alex von sich aus, sobald das Kontextfenster bei etwa 50 % ist (im Master und in jedem Block-Chat), und schlägt dann `/save` und einen neuen Chat vor. Nicht schätzen, sondern messen: `get_session` (ohne Kennung) zeigt unter `context_usage` die belegten und die möglichen Tokens (17.11.: der Master lag bei 30 %, als Claude „etwa 50 %“ annahm).
- Sicherung: Der Stop-Hook `.claude/hooks/save-pruefen.sh` meldet ungesicherte Arbeit; Claude führt dann `/save` aus.

## Baustopp und Takt (Regel Mr. Alex, 12.11.2026)
- **Baustopp für Neues bis nach den GLN (25.11.2026):** bis dahin nur Fehler beheben, die Mr. Alex oder den Kindern auffallen. Einzige Ausnahme: Road to GLN für EN9, sobald das Material da ist. Mr. Alex kann die Regel jederzeit aufheben („ich will das trotzdem bauen“) – dann bauen, ohne zu diskutieren.
- **Immer nur ein Bau-Chat gleichzeitig** (gilt dauerhaft): Der nächste Block startet erst, wenn Mr. Alex den vorigen selbst gesehen hat. Schlägt ein Chat einen neuen Bau vor, zuerst auf diese Regel hinweisen.
- Ideen zwischendurch: ein Satz in den Ideenspeicher, kein Bau. Entscheidungen möglichst gesammelt im Master.
- GLN-Material: Formate stehen in `docs/archiv/gln-formate.md`; die Aufgaben selbst kommen nie ins Repo.

## Testprogramm (Regel Mr. Alex, 15.11.2026)
Befehl: `node werkzeuge/testprogramm.js` (alle Apps, ca. 1–2 Min.; `EN6`/`EN9`/`FR` = nur diese, `--ohne-update` = schneller ohne Service-Worker-Test). Prüft je App in drei Formaten – Windows-Laptop 1366×768, Handy 360×740, iPad 820×1180 (Mr. Alex 15.11.: heute Laptop, Handy muss gehen, künftig iPad) –: Laden ohne Konsolenfehler, Start, eine Übung, Runner-Start, Shop, nichts breiter als der Bildschirm, Update kommt an. `--format=handy` (oder `laptop`, `ipad`) = nur ein Format. Das iPad läuft in WebKit (Safari-Technik); fehlt es, installiert das Testprogramm es selbst (ca. 1 Min., `cdn.playwright.dev` ist seit 15.11. in der Default-Umgebung freigegeben).
- **Kein Handy-Test für das Story-Spiel (Regel Mr. Alex, 18.11.2026):** Die Tower-Tests (`towerTest`, `probe3dTest`) laufen nur in den Formaten Laptop und iPad; das Testprogramm lässt sie im Handy-Format von selbst aus. Die Lern-Apps EN6, EN9 und FR werden weiter auch im Handy-Format geprüft.
- Bei jedem Fehler zuerst einen Test ins Testprogramm, der ihn zeigt, dann reparieren.
- Fertig heißt: Testprogramm grün („ALLES OK“).
- Nach jedem Bau läuft es (die betroffene App reicht); keinen eigenen Browser-Test neu schreiben, sondern das Testprogramm erweitern.

## Erst spiegeln und fragen, dann weiterverfolgen (Regel Mr. Alex, 20.11.2026)
Eine Idee, die Mr. Alex noch nicht abgenommen hat, wird nicht von selbst weiterverfolgt: keine Recherche, kein Agent, keine Ausarbeitung dazu starten. Zuerst zurückspiegeln, was verstanden wurde, die offenen Punkte fragen und sein OK abwarten. („Du hast gleich schon den Agenten gestartet. So etwas nervt mich.“)

## Verifizieren, nicht raten (Regel Mr. Alex, 21.11.2026)
Aussagen über Geräte, Leistung, Grenzen und Dateigrößen werden vorher nachgeschlagen (Datenblatt des Herstellers, Websuche) oder gemessen, nicht geschätzt. In der Antwort trennen: gemessen · nachgeschlagen (mit Quelle) · nicht bekannt. Keine Bauten, Vereinfachungen oder Testläufe auf der Grundlage von Vermutungen: erst prüfen, dann vorschlagen. („Hör auf mit dem Schätzen. Das ist jetzt schon öfter passiert.“) Schülergerät: HP ProBook x360 435 G10.

## Fehlt etwas? Nachfragen statt aufgeben (Regel Mr. Alex, 15.11.2026)
Ist ein Werkzeug, Browser oder Paket nicht installiert, nicht aufgeben und nicht stillschweigend ausweichen: Mr. Alex Bescheid geben, was fehlt, was es ermöglichen würde und wie aufwendig die Installation ist, und fragen, ob installiert werden soll.

## Anleitungen für Mr. Alex (Regel Mr. Alex, 17.11.2026)
Soll Mr. Alex selbst etwas am Rechner tun, bekommt er eine vollständige Schritt-für-Schritt-Anleitung: nummeriert, ein Handgriff je Schritt, nichts voraussetzen (auch nicht „Repo klonen“ oder „Terminal öffnen“), jeder Befehl in einem eigenen Kasten zum Kopieren, nach jedem Abschnitt sagen, woran er erkennt, dass es geklappt hat. Erst fragen, welches Betriebssystem, wenn es darauf ankommt und nicht bekannt ist.

## Nur ändern, was bemängelt wurde (Regel Mr. Alex, 17.11.2026)
Bei jeder Überarbeitung (Bilder, Räume, Texte, App) genau die Punkte ändern, die Mr. Alex genannt hat, und sonst nichts. Was er gesehen und nicht beanstandet hat, gilt als abgenommen. Eigene Verbesserungsideen als Vorschlag in die Rückmeldung schreiben und auf sein OK warten. Sagt er „erst zurückmelden“, nichts bauen, nur antworten.

## Anrede und Fragen (Regel Mr. Alex, 17.11.2026)
Mr. Alex wird geduzt. Fragen an ihn sind ganze, klare Sätze, keine Stichworte oder Rumpfsätze: sagen, worum es geht, was die Möglichkeiten sind und was sie für ihn bedeuten. Keine Fachwörter ohne Erklärung.
**Als Profi von der Vision her denken (Mr. Alex 17.11.):** Vor jeder Frage prüfen, ob die Vision sie schon beantwortet (`docs/spiele/keys-of-the-tower-vision.md` für die Story-Spiele); dann selbst entscheiden, begründen und weitermachen. Fragen nur, wenn es wirklich seine Entscheidung ist.

## Orts-Szenen
Jeder Ort hat drei Ebenen: Bild (Szene mit Runner-Zeichnungen), Ton (Geräusch oder Sprache), kleines Foto. Einzelheiten: `.claude/skills/orts-szenen/SKILL.md`.

## Weitere feste Regeln
- Vor dem Implementieren das Ok von Mr. Alex abholen; pushen und Vorschauen veröffentlichen nur nach ausdrücklichem Ok.
- Superhelden (Spielgrafik, Posen, Gesichter, Stimmen mit Tags, Fotos): Regeln von Mr. Alex vom 7.11. in `docs/briefing.md`, gelten auch für Klasse 9.
- Details und alle weiteren Regeln: `docs/briefing.md`, Ideen: `docs/ideenspeicher.md`, Sprache der Geschichten: `docs/runner/story-sprache.md`, Archiv: `docs/archiv/`.
