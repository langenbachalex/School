# Français Classe 5/6 – App (Stufe 1, 7.11.2026)

**Im Internet:** https://langenbachalex.github.io/School/franz/ · 🇬🇧/🇫🇷 oben rechts springt zwischen Englisch (Klasse 6) und Französisch.
Spielstand nur auf dem Gerät (`localStorage` „fr_stand“), getrennt von Englisch. Eigener Offline-Speicher (`sw.js`, „mralex-fr-…“); `style.css` wird mit Klasse 6 geteilt.

**Kacheln:** 💬 Dialogues (D9, D11–D14; Schritte 1 Écoute · 2 Abschreiben · 3 Wendungen · 4 Neue Wörter · 5 Wachsend · 6 Parle de toi) ·
🗣️ Prononciation (58 Namen, Niveau 1 mit / Niveau 2 ohne Vorsprecher) · 🎮 Jeux (Memory, Qui est-ce ?, Dans l'ordre) · 🎧 Beat-Studio · 🏛️ Panthéon.
Lesehilfe oben: „einfach“ (deutsche Umschrift aus der IPA) · „IPA“ · „aus“; betonte (letzte) Silbe jeder Sprechgruppe fett.

**Inhalte ändern:** `inhalte/franz/*.tsv` bearbeiten → `python3 werkzeuge/franz_audio.py` (fehlende Audios, ElevenLabs v4: A Jules, B Cécile, Namen Mr. Alex) → `python3 werkzeuge/franz_bauen.py`.
Fehlt ein Audio, spricht die Geräte-Stimme (fr-FR). Mitlauftexte fürs Beat-Studio in `inhalte/franz/beats.tsv`, Spalte `text` (Zeilenumbruch als `\n` nicht möglich → eine Zeile, oder später Datei je Beat).
