# Story-Spiele – freie Werkzeuge und Quellen (Empfehlungen, Stand 18.11.2026)

Anlass: Frage von Mr. Alex (17./18.11.), ob es bessere und günstigere Wege gibt als Blender-Skripte von Hand, und ob man etwas, das uns gefällt, nachbauen kann („Reverse Engineering“). Erste Übersicht des Masters, am 18.11. berichtigt nach der gründlichen Recherche `werkzeuge-recherche.md` (dort Quellen, Lizenzen und Sicherheit je Fund). **Nichts davon ist bei uns getestet**, außer wo es dabeisteht.

## Grundentscheidungen (stehen)
- **Technik bleibt:** Three.js im Browser (WebGLRenderer, nicht WebGPU; neu prüfen Ende 2027), Räume und Köpfe per Skript aus Blender als glTF. Unreal und Unity scheiden aus (kein Link im Browser, zu schwer für ProBook und iPad, nicht per Code baubar). Godot nur, falls das Spiel einmal eine eigene App werden soll.
- **Figuren:** Körper aus „KayKit Adventurers“ (CC0), eigene Köpfe per Skript (Entscheidung Mr. Alex 17.11.). Räume bleiben eigene; der KayKit-Stil für Räume hat ihn in den Vorschaubildern nicht überzeugt.
- **Vorbild im Gefühl (Mr. Alex 18.11.):** offene Spielwelten wie Grand Theft Auto 5/6 – große Bewegungsfreiheit. Für uns heißt das: Sandbox in Stücken (Vision Abschnitt 3), Hof als Mitte, Orte öffnen sich mit den Schlüsseln; nicht der Umfang, sondern das Gefühl von Freiheit. Belegt ist, dass Freiheit aus Dichte kommt (A Short Hike); technisch: in Stücken laden, jede Schlüsseltür ist eine Ladegrenze.
- **AlexPC:** AMD Radeon RX 6500 XT mit 4 GB, 128 GB Arbeitsspeicher (Master 18.11.). Kein NVIDIA, also Bild-zu-3D lokal praktisch nicht; Licht einbrennen über HIP nach Treiber-Update.

## Reverse Engineering
- Werkzeuge wie Ghidra zerlegen Programmcode. Was uns an Spielen gefällt (Aussehen, Bewegung, Kamera, Licht), steckt nicht im Code.
- Modelle aus gekauften Spielen herausziehen und verwenden ist eine Urheberrechtsverletzung – machen wir nicht.
- **Der erlaubte Weg:** Projekte auseinandernehmen, die dafür veröffentlicht wurden. Bestes Vorbild: **Bruno Simon folio-2025** (MIT, Three.js, mit Blender-Dateien). **DOGWALK** ist ein Godot-4.4-Spiel, kein Three.js-Projekt; Quellpaket CC BY 4.0, Skripte MIT, beides nur im Blender-Studio-Abo oder Steam Supporter Pack und ohne die .blend-Dateien – als Vortrag lehrreich, als Vorlage kaum. Dazu die freien Figuren von Blender Studio (Rain, Snow), die Beispiele von three.js, Entwickler-Vorträge und Werkstattberichte.

## Empfehlungen in Reihenfolge des Nutzens

| # | Was | Wozu bei uns | Haken | Stand |
|---|---|---|---|---|
| 0 | **gltf-transform + Meshopt + KTX2** (MIT) | `guardroom.glb` (14,7 MB, ~297.000 Dreiecke, 2 × 4K-Bilder, geschätzt 290 MB Grafikspeicher) klein genug fürs iPad | `simplify` verschiebt eingebranntes Licht; `flatten/prune/palette` löschen Namen; KTX2 braucht ein Zusatzprogramm (vorher fragen) | **vorgezogen vor den iPad-Test** (Mr. Alex 18.11.) |
| 1 | **MCP for Blender** (früher BlenderMCP, MIT) | Claude auf AlexPC steuert Blender und sieht Bilder aus Ansicht und Kamera | 3 Sicherheitslücken 2026, Verbindung ohne Passwort → nur auf dem eigenen Rechner, neueste Fassung, Telemetrie aus; nur Poly Haven nutzen (Hyper3D, Sketchfab, Meshy, Tripo, Hunyuan nicht frei). Ersatz ohne Einrichtung: Prüfbilder ohne Fenster | **Entscheidung Mr. Alex 18.11.:** installiert auf AlexPC, aber unverbunden. Prüfbilder ohne Fenster sind der Standard für jeden Bau. Hervorgeholt wird es erst bei Bedarf in Block C (Hof, Nebel, Licht), dann mit neuester Fassung, abgeschalteten Nutzungsdaten und nur, wenn Mr. Alex danebensitzt (drei Sicherheitslücken 2026, Verbindung ohne Passwort, auf AlexPC liegen auch andere Daten) |
| 2 | **Rhubarb Lip Sync** (MIT) | liest vorhandene Aufnahmen, schreibt Mundformen mit Zeiten (A–F, G, H, X als JSON); läuft auch unter Linux, also in Cloud-Chats; keine neuen Credits | liest nur WAV/Ogg (MP3 vorher wandeln); Englisch gut, Französisch nur „phonetic“; Köpfe brauchen 6–9 Mundformen | Probe an fünf Gary-Aufnahmen beauftragt, Vergleich mit „Mund folgt der Lautstärke“ |
| 3 | **KayKit Character Animations** (CC0, 133 Bewegungen) | mehr Bewegungen ohne Übertragen, wenn das Skelett gleich ist | offen, ob die Adventurers auf „Rig_Medium“ sitzen | bei Block A, Schritt 2 |
| 4 | **Poly Haven** (CC0) und Bausätze **Quaternius Medieval Village MegaKit, KayKit Furniture/Medieval Builder, Kenney Train/City Kit** (CC0) | Stein, Holz, Himmel; Requisiten umgefärbt mit eigener Farbpalette | Stile passen nur mit der Palette zusammen; ambientCG nicht nachgeprüft | bei Block C (Hof), D (Den), später Tube, Piccadilly, EN9 |
| 5 | **Blender als Python-Paket (`bpy`)** 5.3.0 (GPL, nur Python 3.13, ~430 MB) | Cloud-Chats führen Blender-Skripte selbst aus, Prüfbilder ohne AlexPC | ohne Grafikkarte nur Cycles auf dem Prozessor, Eevee nicht | kleine Probe in einem Cloud-Chat, wenn ein Block ansteht |
| 6 | **Licht einbrennen auf der Grafikkarte** (Cycles über HIP) | Guard Room voraussichtlich 3–5 statt 7 Minuten | Treiber von 1/2022 zu alt: Adrenalin ≥ 24.6.1 nötig, 26.5.1 meiden; HIP RT zunächst aus | Probe auf AlexPC (Treiber erneuern, Vergleich) |
| 7 | **Quaternius Universal Animation Library 2** (CC0, über 130 Bewegungen, ~70 % kostenlos) | joggen, sitzen, schieben, kriechen | anderes Skelett; Übertragen in Blender (Rokoko, „Retarget“), nicht mit `retargetClip` | erst, wenn die KayKit-Bewegungen nicht reichen |
| 8 | **Bild-zu-3D: TRELLIS/TRELLIS.2, TripoSR/SG** (MIT), **Stable Fast 3D** (Stability Community), **Step1X-3D** (Apache 2.0); online **Meshy/Tripo** (gratis als CC BY 4.0 mit Nennung, Bezahlmonat 16–20 $); **UniRig** (Code MIT, Modelldaten offen) | feste Requisiten, vor allem Museumsstücke | auf AlexPC lokal praktisch nicht (AMD, 4 GB); Auswege: online, Hugging-Face-Proben, gemietete RTX 4090 (~0,20–0,70 $/h, 30 Requisiten ≈ 1–3 $); Ergebnisse schwer, müssen reduziert und umgefärbt werden; nicht für Figuren/Tiere. **Hunyuan3D gestrichen** (Lizenz gilt nicht in der EU) | erste Probe mit einem festen Requisit, später British Museum |
| 9 | **ElevenLabs mit Zeitstempeln** (`/with-timestamps`) | genaue Zeiten je Buchstabe gleich mit der Aufnahme; wichtig vor allem für FR | nur für neue Aufnahmen; ob vorhandene nachträglich Zeiten bekommen („Forced Alignment“), ist offen | nur falls Rhubarb nicht reicht, und bei FR |
| 10 | **Effekseer** (quelloffen) | Funken- und Zaubereffekte gestalten | WebGL-Player unsicher; three.quarks lizenzseitig ungeprüft | vorerst Funken selbst programmieren |
| 11 | **Ton:** Kenney Audio (CC0), Freesound nur mit Filter CC0, Sonniss GDC; Bfxr, rFXGen; Lautstärke −16 LUFS mit ffmpeg-loudnorm, MP3 bleibt | Geräusche ohne Lizenzsorgen, alles gleich laut | **nicht:** BBC Sound Effects, YouTube Audio Library; ElevenLabs-Geräusche im Free-Plan nur mit Nennung, Eleven Music schließt „Studio Games“ aus | Hof-Geräusche in C, Rest in E |
| 12 | **Medieval Fantasy City Generator** | Grundriss für Hof oder Gassen | nur Plan, kein Modell; für den Tower ist ein eigenes Skript, das Bausätze auf ein Raster setzt, einfacher als Buildify oder SceneCity | bei Block C als Vorlage |

**Nicht für uns:** Menschen-Generatoren (MPFB, CharMorph, MakeHuman: Ausgaben wären CC0, aber lebensechte Menschen, nicht unser Stil) · Ready Player Me (abgeschaltet seit 31.1.2026) · Mixamo (Weitergabe der Rohdatei verboten, Schul-Konten ausgeschlossen) · TalkingHead (nur als Code-Vorbild) · Physik-Engines und Nachbearbeitungs-Effekte · Needle Engine, Verge3D (ersetzen einen Weg, den wir schon haben) · Synty-Pakete (nur Unity/Unreal) · Poly-Pizza-Modelle nur einzeln geprüft (meist CC BY) · „Editorial only“-Modelle · die Sammlung `thesaravanakumar/blender-projects` (keine Lizenz, teils geschützte Figuren).

**Lernquellen:** CGDive (Skelette) · SouthernShotty (Gesichter über Formschlüssel) · Imphenzia (schnelle Low-Poly-Figuren) · Grant Abbitt (Grundlagen) · `czlonkowski/blender-web-3d-skill` (MIT, Ablauf Blender → GLB → Three.js mit Fallen) · folio-2025 · Vortrag „Making of DOGWALK“ (media.ccc.de). Claude kann Videos nicht ansehen, nur Beschreibungen und Mitschriften lesen.

## Lücken
- Speicher des iPads: messen (nach dem Verkleinern).
- Freies Zootier-Paket im einheitlichen Stil: keins gefunden. Entscheidung später: selbst bauen per Skript oder ein Kaufpaket, dessen Lizenz für öffentliche Web-Apps vorher schriftlich geprüft ist.
- Kein Werkzeug wurde auf AlexPC oder in der Cloud ausprobiert; Proben stehen in `werkzeuge-recherche.md` („Auf AlexPC auszuprobieren“).
- Viele Originalseiten waren in der Cloud gesperrt (quaternius.com, itch.io, kenney.nl, helpx.adobe.com u. a.); Mr. Alex 18.11.: keine Freigabe für eine Zweitprüfung.

## Quellen
- Ausführlich mit Lizenz und Sicherheit je Fund: `docs/spiele/werkzeuge-recherche.md`
- https://github.com/agmmnn/awesome-blender (vollständig gelesen 18.11.)
- https://github.com/ahujasid/blender-mcp
- https://github.com/DanielSWolf/rhubarb-lip-sync
- https://github.com/brunosimon/folio-2025
- https://blender.org/projects/dogwalk/
- https://quaternius.com/packs/universalanimationlibrary.html
- https://polyhaven.com/plugins/blender
- https://kaylousberg.itch.io/kaykit-adventurers
- https://elevenlabs.io/docs (Text to Speech with timestamps)
