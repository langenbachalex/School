# Mon français – persönliche Französisch-App (Mr. Alex)

Konzept: `docs/franzoesisch/konzept.md`. Noch nicht veröffentlicht (Gerüst, Stand 13.10.2026).

**Lokal öffnen:** `index.html` doppelklicken. Kein Server, kein Konto. Kartenstapel, Fortschritt und Punkte bleiben nur im Browser dieses Geräts.

**Tasten am Laptop:** Leertaste = Abspielen, Pfeil rechts = Weiter / Lösung, Pfeil links = Zurück.

**Inhalte ändern:**
1. Ein TSV je Thema in `inhalte/franzoesisch/` (Reihenfolge der Themen: `THEMEN` in `werkzeuge/franzoesisch_bauen.py`), Lob in `inhalte/franzoesisch/lob.tsv`.
2. `python3 werkzeuge/franzoesisch_audio.py --zaehlen` zählt fehlende Audios; ohne `--zaehlen` erzeugt es sie (Mr. Alex' Stimme, Französisch) – nur nach Absprache.
3. `python3 werkzeuge/franzoesisch_bauen.py` erzeugt `daten.js`, `basis.css`, Icons, Manifest und `sw.js` neu.

**Fehlt eine Audiodatei,** liest die französische Stimme des Geräts den Satz vor. Sobald die Datei da ist, nimmt die App automatisch die Aufnahme.
