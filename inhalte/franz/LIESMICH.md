# inhalte/franz/ – Inhalte der Französisch-App (Sprachkurs Klasse 5/6)

Gebaut 7.11.2026 (Stufe 1): `dialoge.tsv` + `dialoge_info.tsv` (Titel, neue Wörter, Parle-Vorlagen), `wendungen.tsv`, `namen.tsv` (mit IPA: Silben mit Punkt, Sprechgruppen mit |), `woerter.tsv` (Wortkästen für „Parle de toi“), `beats.tsv`. Build: `werkzeuge/franz_bauen.py` → `app/franz/daten_fr.js`; Audio: `werkzeuge/franz_audio.py`. Quelle der Dialoge: `docs/archiv/2026-11-06_franzoesisch-dialog-datenbank.md`.

## datenbank/ – Export aus dem Sprachkurs-Projekt (Stand 7.11.2026, von Mr. Alex)
`franz_datenbank.json` ist die **maßgebliche Quelle** für den Bau (siehe `datenbank/LIESMICH.md`): 14 Dialoge (D9, D11–D14 vertont, ganz + Répète + 52 Einzelzeilen), 4 Lückentexte, 41 Vokabeln mit Symbolen (`icons/`), 26 Kernwendungen, Zahlenreime 1–20 mit Audio, Namen mit IPA (21 Fußballer, 3 Président/Stars, 13 Orte, 21 historische Personen), 7 Spotlight-Paare mit Fotos (`fotos/`, Wikimedia, Nachweis muss in der App sichtbar sein). IPA dort ohne Betonung – beim Bau letzte Silbe der Sprechgruppe fett setzen. Historische Personen haben noch keine Bilder (nur die 6 in Spotlights).

## audio_roh/ – Rohaufnahmen von Mr. Alex (7.11.)
| Datei | Inhalt (Angabe Mr. Alex, nicht abgehört) |
|---|---|
| `w12_alle_dialoge.mp3` (2:56) | Dialoge Woche 12 am Stück, Jules (A) / Cécile (B) – kann neu je Zeile erzeugt werden (Credits vorhanden) |
| `w12_spotlight_kante_curie.mp3` (1:48) | Spotlight Kanté ↔ Curie, Stimme Mr. Alex |
| `dialogue_alt.mp3` (0:25) | ein älterer Dialog, Zuordnung offen |
| `alex_2026-11-06_unklar.mp3` (0:24) | Stimme Mr. Alex, Inhalt noch zu klären |
| `nombres_julien_1..3.mp3` | Zahlenreime 1–20, Julien |
| `beat_01_names_start.mp3`, `beat_03_region.mp3`, `beat_05_nombres.mp3`, `beat_07_dialogue.mp3` | Beat-Fassungen, Stimme Mr. Alex → Kachel „Beat-Studio“; Nummern 02/04/06 fehlen evtl. |
