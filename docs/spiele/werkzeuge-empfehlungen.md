# Story-Spiele – freie Werkzeuge und Quellen (Empfehlungen des Masters, 18.11.2026)

Anlass: Frage von Mr. Alex (17./18.11.), ob es bessere und günstigere Wege gibt als Blender-Skripte von Hand, und ob man etwas, das uns gefällt, nachbauen kann („Reverse Engineering“). Stand: erste Übersicht aus Recherche, **nichts davon ist bei uns getestet**, außer wo es dabeisteht. Quellen am Ende.

## Grundentscheidungen (stehen)
- **Technik bleibt:** Three.js im Browser, Räume und Köpfe per Skript aus Blender als glTF. Unreal und Unity scheiden aus (kein Link im Browser, zu schwer für ProBook und iPad, nicht per Code baubar). Godot nur, falls das Spiel einmal eine eigene App werden soll.
- **Figuren:** Körper aus „KayKit Adventurers“ (CC0), eigene Köpfe per Skript (Entscheidung Mr. Alex 17.11.). Räume bleiben eigene; der KayKit-Stil für Räume hat ihn in den Vorschaubildern nicht überzeugt.
- **Vorbild im Gefühl (Mr. Alex 18.11.):** offene Spielwelten wie Grand Theft Auto 5/6 – große Bewegungsfreiheit, eine Welt, in der man sich frei bewegt. Für uns heißt das: Sandbox in Stücken (Vision Abschnitt 3), Hof als Mitte, Orte öffnen sich mit den Schlüsseln; nicht der Umfang, sondern das Gefühl von Freiheit.

## Reverse Engineering
- Werkzeuge wie Ghidra zerlegen Programmcode. Was uns an Spielen gefällt (Aussehen, Bewegung, Kamera, Licht), steckt nicht im Code.
- Modelle aus gekauften Spielen herausziehen und verwenden ist eine Urheberrechtsverletzung – machen wir nicht.
- **Der erlaubte Weg:** Projekte auseinandernehmen, die dafür veröffentlicht wurden: DOGWALK (ganzes kleines Spiel von Blender Studio, Quellpaket CC BY, die Blender-Originale nur für Abonnenten), die freien Figuren von Blender Studio (Rain, Snow) für Gesichter und Skelette, die Beispiele von three.js. Dazu Entwickler-Vorträge und Werkstattberichte zu Spielen, die uns gefallen.

## Empfehlungen in Reihenfolge des Nutzens

| # | Was | Wozu bei uns | Haken | Stand |
|---|---|---|---|---|
| 1 | **BlenderMCP** (MIT) | Claude auf AlexPC steuert Blender direkt und sieht das Ergebnis. Fehler wie „Kopf dreht in den Körper“ fallen dem Bau-Chat selbst auf. | einmalige Einrichtung auf AlexPC; Ersatz: Prüfbilder ohne Fenster rechnen | Probe im Figuren-Chat beauftragt (Schritt 1b, Punkt 7) |
| 2 | **Rhubarb Lip Sync** (quelloffen) | liest unsere vorhandenen Aufnahmen und schreibt Mundformen mit Zeiten; keine neuen Credits | Köpfe brauchen mehrere Mundformen; aus dem Wissen des Masters, am 18.11. nicht nachgeprüft | Probe an fünf Gary-Aufnahmen beauftragt (Punkt 8), Vergleich mit „Mund folgt der Lautstärke“ |
| 3 | **Poly Haven, ambientCG** (CC0) | Stein, Holz, Himmel, Lichtstimmungen – für Nebel und Licht im Auftakt | keiner | bei Block C (Hof) nutzen |
| 4 | **Blender als Python-Paket (`bpy`)** | Cloud-Chats könnten Blender-Skripte selbst ausführen, ohne AlexPC | ungetestet; Licht einbrennen ohne Grafikkarte langsam | kleine Probe in einem Cloud-Chat, wenn ein Block ansteht |
| 5 | **Quaternius Universal Animation Library** (CC0, über 120 Bewegungen) | mehr Bewegungen: joggen, sprinten, sitzen, schieben, kriechen | anderes Skelett als KayKit, Übertragen ungetestet; ein Teil kostet | erst, wenn die 76 KayKit-Bewegungen nicht reichen |
| 6 | **Bild-zu-3D: Hunyuan3D-2, TRELLIS** (quelloffen), **UniRig** (Skelett automatisch) | Zootiere und Requisiten aus einem Bild | braucht starke Grafikkarte (AlexPC: Mr. Alex sieht nach), Ergebnisse schwer und selten in einem Stil | eine Probe mit einem Tier, sobald die Grafikkarte bekannt ist |
| 7 | **ElevenLabs mit Zeitstempeln** | genaue Zeiten je Buchstabe gleich mit der Aufnahme | nur für neue Aufnahmen; die vorhandenen müssten neu bezahlt werden | nur falls Weg 2 nicht reicht |
| 8 | **Effekseer** (quelloffen) | Funken- und Zaubereffekte gestalten | Zusammenspiel mit unserer Browser-Technik ungeprüft | vorerst Funken selbst programmieren |
| 9 | **Bfxr, rFXGen** | kleine Spielgeräusche erzeugen | – | bei Block E (Feinschliff) |
| 10 | **Medieval Fantasy City Generator** | Grundriss für Hof oder Gassen | nur Plan, kein Modell | bei Block C als Vorlage |

**Nicht für uns:** Menschen-Generatoren (MPFB, CharMorph, MakeHuman: lebensechte Menschen, nicht unser Stil) · Needle Engine, Verge3D (ersetzen einen Weg, den wir schon haben) · Synty-Pakete (nur Unity/Unreal) · die Sammlung `thesaravanakumar/blender-projects` (keine Lizenz, teils geschützte Figuren).

**Lernquellen für unsere Baustellen:** CGDive (Skelette) · SouthernShotty (Gesichter über Formschlüssel) · Imphenzia (schnelle Low-Poly-Figuren) · Grant Abbitt (Grundlagen, Spielmodelle). Claude kann Videos nicht ansehen, nur Beschreibungen und Mitschriften lesen.

## Lücken dieser Übersicht
- Dateien für den Browser verkleinern (glTF-Kompression, Texturen): in der Liste `awesome-blender` steht dazu nichts; eigene Recherche nötig, spätestens bei Block E.
- Kein Werkzeug wurde auf AlexPC oder in der Cloud ausprobiert; die beiden Proben (1, 2) laufen im Figuren-Chat.
- Für eine gründliche Recherche: „deep research“ in einem eigenen Chat, mit der Entscheidung als Frage (z. B. „Welche freien Werkzeuge verkürzen den Bau von Figuren und Räumen, getestet oder nur gelesen?“); Bericht dann hierher.

## Quellen
- https://github.com/agmmnn/awesome-blender (vollständig gelesen 18.11.)
- https://github.com/thesaravanakumar/blender-projects
- https://github.com/ahujasid/blender-mcp
- https://github.com/DanielSWolf/rhubarb-lip-sync
- https://blender.org/projects/dogwalk/ · https://blenderstudio.itch.io/dogwalk
- https://quaternius.com/packs/universalanimationlibrary.html
- https://polyhaven.com/plugins/blender
- https://kaylousberg.itch.io/kaykit-adventurers
- https://wavespeed.ai/docs/docs-api/elevenlabs/elevenlabs-eleven-v3-timing
