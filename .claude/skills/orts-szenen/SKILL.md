---
name: orts-szenen
description: Für jede Orts-Szene, Landmark, Welt oder Bonus-Anzeige in den Lern-Apps von Mr. Alex (London Run Klasse 6, Road Trip USA Klasse 9). Jeder Ort bekommt drei Ebenen – Bild (animierte Szene im Runner-Stil), Ton (typisches Geräusch oder Sprache) und ein kleines echtes Foto – und Runner und Szene teilen dieselben Zeichnungen und Klänge.
---

# Orts-Szenen: drei Ebenen (Regel Mr. Alex, 6.11.2026)

Ein Ort ist erst fertig, wenn er alle drei Ebenen hat:

1. **Bild:** animierte Szene im Stil des Runners (6–10 s, Canvas), mit dem vorhandenen Satz als Untertitel. Gezeichnet wird **mit denselben Funktionen wie im Runner** (`app/klasse9/runner.js`, `Runner.szene`). Wird ein Ort für die Szene verbessert, profitiert der Runner davon und umgekehrt – nie zwei verschiedene Zeichnungen desselben Orts.
2. **Ton:** das Geräusch, an dem man den Ort erkennt, oder ein typischer Satz.
   - Bevorzugt eine echte, frei lizenzierte Aufnahme (Wikimedia Commons, Freesound CC0/CC BY), gekürzt und als kleine MP3 (mono, 48–64 kbit/s, 2–6 s, Ziel unter 50 KB), mit Quellenangabe in `QUELLEN.md`.
   - Sonst im Spiel nachgebaut (WebAudio wie `klang.*`), **in der richtigen Tonhöhe/dem richtigen Rhythmus** des Originals (z. B. Big Ben: Stundenglocke in E, davor die Westminster-Viertelmelodie).
   - Sprache (Durchsagen, Sätze) mit der Geräte-Stimme oder – nach Freigabe der Credits – mit den ElevenLabs-Stimmen von Mr. Alex. Keine geschützten Original-Durchsagen kopieren, sondern nachsprechen lassen.
   - Derselbe Klang wird im Runner verwendet, wo der Ort vorkommt.
3. **Foto:** am Ende der Szene ein kleines echtes Foto (etwas weiter gefasst, frei lizenziert), auf ~400 px verkleinert (JPEG ~70, Ziel unter 50 KB), mit Quellenzeile. Es poppt groß auf und nimmt die volle Breite der Szene ein.

Weitere Regeln:
- Freigespielte Szenen sind jederzeit wieder abspielbar; gesperrte bleiben grau.
- Keine Marken, Logos oder Wappen; keine Bildnisse realer Personen (Namen ok).
- Sparsam bauen (CLAUDE.md): Bausteine wiederverwenden, nur betroffene Tests.
