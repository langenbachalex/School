# Token sparen – Arbeitsregeln für Claude (Projekt School, Mr. Alex)

Diesen Text am Anfang eines Chats einfügen oder in CLAUDE.md übernehmen.

## Was den Kontext wirklich füllt
Im Kontextfenster sind nicht die Memory-Dateien das Problem (unter 1 %), sondern der **Gesprächsverlauf** (Nachrichten, Werkzeug-Ausgaben, Bilder, Agenten-Berichte) und die **geladenen Werkzeuge** (MCP-Server, Skills, Systemprompt ≈ 5–8 %).

## Regeln für Claude
1. **Kurz antworten.** Keine Wiederholung dessen, was schon gesagt wurde; Agenten-Berichte nur zusammenfassen, nie zitieren.
2. **Werkzeug-Ausgaben klein halten.** Immer `head`, `tail`, `grep`, `wc` oder `cut -c1-200` statt ganze Dateien oder lange Listen; Dateien nur in dem Teil lesen, der gebraucht wird; keine Verzeichnis-Auflistungen mit hunderten Einträgen (z. B. Artefakt-Dateilisten).
3. **Bilder sparsam.** Screenshots nur zur Abnahme, möglichst ein Kontaktbogen statt vieler Einzelbilder; eigene Prüfbilder bei `deviceScaleFactor: 1`.
4. **Große Bauten an Subagenten geben.** Ihre Zwischenschritte landen nicht im Hauptkontext; der Auftrag ist knapp, der Bericht ist knapp (Commit, eine Zeile je Ergebnis, offene Mängel).
5. **Tests gezielt.** Nur den betroffenen Test, Ausgabe auf `FEHLT`/`ALLES OK` filtern.
6. **Keine Rückfrage-Schleifen.** Stop-Hook-Meldungen („unpushed commit“) mit einem Satz beantworten; Pushes sammeln und einmal fragen statt nach jedem Commit.
7. **Vor größeren Bauten eine kurze Rückfrage** mit Aufwandsschätzung (klein/mittel/groß) und schlankerer Variante – spart Fehlbauten.
8. **Nichts erneut herleiten**, was in CLAUDE.md, briefing.md oder ideenspeicher.md steht; dort nachschlagen, nicht im Chatverlauf suchen.

## Regeln für Mr. Alex (so sparst du am meisten)
- **Pro Block ein Chat.** Ein Chat für eine Baustelle (z. B. „Staaten-Szenen“), danach neuer Chat. Was bleiben soll, steht im Repo (briefing.md, ideenspeicher.md), nicht im Chat.
- **Aufträge bündeln.** Mehrere Wünsche in einer Nachricht, mit OK für den Push gleich dabei („bau X und Y, dann push“) – jede Nachricht kostet den ganzen bisherigen Kontext neu.
- **„Kurz“ sagen.** Wenn du nur eine Antwort brauchst: „kurz“ oder „eine Zeile“.
- **Nicht benötigte Verbindungen abschalten.** MCP-Server und Plugins, die im Chat nicht gebraucht werden (Canva, Google Calendar, Wispr Flow, Finance-Plugin, Claude Docs), kosten pro Chat 20–120k Tokens an Werkzeugbeschreibungen – in den Verbindungs-Einstellungen für Code-Chats aus.
- **Skills schlank halten.** Nur die Skills im Projekt lassen, die Code-Chats brauchen (orts-szenen); Unterrichts-Skills gehören in die Unterrichts-Chats.
- **Bilder nur, wenn nötig.** Screenshots von dir nur, wenn Claude etwas sehen muss; Text reicht meist.
- **Vorschauen nur auf Wunsch** neu veröffentlichen (jede Veröffentlichung listet viele Dateien).
- **Bei 50–60 % Kontext** neuen Chat starten (oder `/compact`), bevor die automatische Zusammenfassung Details verliert.
