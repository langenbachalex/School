# Jeremy B. auf Version 4 – Vokabeln erledigt, Rest vorgemerkt

Stand: 23.10.2026. Mr. Alex findet den männlichen amerikanischen Sprecher (Jeremy B., Voice `btaSeNTVh1pGx4pjFzub`) etwas leblos; Jessica klingt lebendiger. Beide laufen heute auf `eleven_multilingual_v2` (Stabilität 0,5, Ähnlichkeit 0,75). Nur Mr. Alex läuft auf `eleven_v4`.

- **Hörprobe:** `docs/klasse9/hoerprobe/jeremy-v4/` – drei Sätze (`d3_03`, `d3_07`, `d4_07`), je Version 4 mit Stabilität 0,5 (`_v4_s05`) und 0,3 (`_v4_s03`); verglichen mit den aktuellen Aufnahmen in `app/klasse9/audio/saetze/`. Kosten: 324 Zeichen.
- **Umfang eines Austauschs nur für Jeremy:** 12.801 Zeichen in 342 Dateien (Vokabeln 6.117, Sätze 3.354, Staaten-Fakten 1.939, Hörverstehen 587, Landmarks 524, BE/AE 280). Credits nach Tarif von V4 prüfen.
- **Entscheidung 23.10.:** Mr. Alex wählt Variante B (Version 4, Stabilität 0,5). **Vokabeln sind neu vertont** (222 Dateien, 6.117 Zeichen). **Staaten-Fakten (25 Dateien) und Sätze (76 Dateien) sind ebenfalls neu** (5.293 Zeichen, 23.10.). Noch auf Version 2: Hörverstehen 587, Landmarks 524, BE/AE 280 Zeichen (zusammen 1.391) – bis er es freigibt.
- **Technik beim Austausch:** In `werkzeuge/klasse9_audio.py` für `stimme == "m"` das Modell auf `eleven_v4` stellen und die vorhandenen `m`-Dateien löschen (das Skript überspringt vorhandene Dateien), dann `klasse9_audio.py` und `klasse9_bauen.py` ausführen. Stufenweise möglich: zuerst Vokabeln und Sätze (ca. 9.500 Zeichen).
