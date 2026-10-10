# Auffrischen mit Mr. Alex – App

**Starten:** `index.html` doppelklicken (Laptop oder Handy). Ein Server und ein Konto sind nicht nötig.
Fortschritt und notierte Fragen bleiben nur im Browser dieses Geräts.

**Tasten am Laptop:** Leertaste = Abspielen, Pfeil rechts = Weiter.

**Inhalte ändern:**
1. Sätze in `inhalte/kernsaetze.tsv`, Vokabeln in `inhalte/vokabeln.tsv`, Hörübungen in `inhalte/hoeren/`, Symbole in `inhalte/symbole.tsv` bearbeiten.
2. `python3 werkzeuge/audio_erzeugen.py` erzeugt fehlende Audios.
3. `python3 werkzeuge/daten_bauen.py` erzeugt `app/daten.js` neu.

**Eigene Aufnahmen:** MP3 mit gleichem Namen in `app/audio/kernsaetze/` ablegen (Liste: `docs/sprechtexte.md`).
