# Quellen der Orts-Klänge (Klasse 6, London)

Echte Aufnahmen für die Orts-Szenen (`Runner.klangDatei`), sonst spielt der WebAudio-Nachbau (`klang.*` in `app/klasse9/runner.js`).

| Datei | Quelle | Lizenz | Bearbeitung | Verwendung |
|---|---|---|---|---|
| westminster_chimes.mp3 | Westminster chimes 1 January 1945, Wikimedia Commons (https://commons.wikimedia.org/wiki/File:Westminster_chimes_1_January_1945.wav) | public domain | gekürzt und entrauscht (erste 14 s + 1,5 s Ausblenden = 15,5 s, mono MP3, 78 KB; von Mr. Alex bereitgestellt, 6.11.2026) | Big-Ben-Szene: `Runner.klangDatei("chimes", …)` in `app/app.js` (`klang.chimes`), ersetzt dort die nachgebaute Viertelmelodie; danach ein Stundenschlag (Nachbau `klang.glocke`). Unter dem Voice-over leiser, beim Schließen gestoppt. Im London Run nicht verwendet (dort der kurze Nachbau). |
