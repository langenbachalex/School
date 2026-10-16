# English Power Game – App

**Im Internet:** https://langenbachalex.github.io/School/ (QR-Code: `docs/qr-code-app.png`). Nach dem ersten Öffnen läuft die App auch offline und lässt sich auf den Startbildschirm legen („Zum Startbildschirm hinzufügen“ bzw. „App installieren“).

**Ohne Internet-Adresse:** `index.html` doppelklicken (Laptop). Ein Server und ein Konto sind nicht nötig.
Fortschritt und notierte Fragen bleiben nur im Browser dieses Geräts.

**Tasten am Laptop:** Leertaste = Abspielen, Pfeil rechts = Weiter.

**Inhalte ändern:**
1. Sätze in `inhalte/kernsaetze.tsv`, Vokabeln in `inhalte/vokabeln.tsv`, Hörübungen in `inhalte/hoeren/`, Symbole in `inhalte/symbole.tsv` bearbeiten.
2. `python3 werkzeuge/audio_erzeugen.py` erzeugt fehlende Audios.
3. `python3 werkzeuge/daten_bauen.py` erzeugt `app/daten.js` neu.

**Eigene Aufnahmen:** MP3 mit gleichem Namen in `app/audio/kernsaetze/` ablegen (Liste: `docs/sprechtexte.md`).

**Fehlt eine Audiodatei** (z. B. weil das ElevenLabs-Kontingent aufgebraucht ist), liest die Sprachausgabe des Geräts den Satz vor (britisches Englisch bzw. Deutsch). Sobald die Datei erzeugt ist, nimmt die App automatisch die ElevenLabs-Aufnahme.

**Veröffentlichen:** Jede Änderung im Ordner `app/` wird über `.github/workflows/pages.yml` automatisch neu veröffentlicht.
