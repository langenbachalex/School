# Werkzeuge und Quellen für die Story-Spiele – Recherche 18.11.2026

Lieber Mr. Alex, das hier ist die gründliche Recherche, die in `werkzeuge-empfehlungen.md` als Lücke stand. Das Wichtigste vorweg: **Der größte Gewinn ist kein neues Programm, sondern drei Dinge, die wir schon fast haben.** Erstens müssen wir die Raumdatei verkleinern, sonst stürzt das iPad wahrscheinlich ab. Zweitens gibt es für unsere KayKit-Körper ein kostenloses Zusatzpaket mit 133 Bewegungen. Drittens kann ein freies Programm (Rhubarb) aus unseren 389 vorhandenen Aufnahmen Mundbewegungen machen, ohne neue Credits. Zwei Punkte aus der ersten Übersicht müssen korrigiert werden. **Hunyuan3D darf in Deutschland nicht genutzt werden**, weil seine Lizenz die EU ausdrücklich ausschließt. **DOGWALK** ist kein Three.js-Projekt, und sein Quellpaket ist nicht frei herunterladbar. Für die späteren Kapitel (Zoo, Tube, Museum, Piccadilly, Palast, New York) gibt es freie Bauteile für Tube, Straßen und Möbel. Ein freies Paket mit Zootieren im einheitlichen Stil haben wir nicht gefunden; Tiere bauen wir am besten selbst per Skript. **Nichts davon ist bei uns ausprobiert.** Alles stammt aus dem Lesen von Quellen, und viele Originalseiten waren in der Cloud gesperrt (Abschnitt „Grenzen dieser Recherche“).

Kennzeichnung je Fund: **nachgelesen** = in der Originalquelle oder ihrem Suchtreffer gelesen · **bestätigt** = von mehreren Quellen bestätigt · **unsicher** = Einzelquelle, Nebenquelle, Widerspruch oder nur Vorwissen.

Hinweis zum Baustopp: Bis zu den GLN (25.11.) sind das Pläne und kleine Proben. Gebaut wird danach, außer du hebst die Regel auf.

---

## Was wir jetzt tun sollten (nach Nutzen geordnet)

Die Blöcke beziehen sich auf die Vision, Abschnitt 10: A Figuren · B Spiel in den 3D-Raum · C Hof und Auftakt · D Umziehen und Sammeln · E Feinschliff · „später“ = weitere Kapitel, EN9, FR.

| # | Was | Was es uns ermöglicht | Aufwand | Kosten | Lizenz | Risiko | Fällig bei |
|---|---|---|---|---|---|---|---|
| 1 | **Raumdatei verkleinern mit gltf-transform** (Meshopt für die Formen, KTX2 bzw. WebP für die Bilder, 4K-Bilder auf 2K) | Das iPad läuft stabil; Hof und weitere Kapitel werden überhaupt erst ladbar. Der Guard Room hat heute 14,7 MB und braucht geschätzt 290 MB Grafikspeicher, davon allein 180 MB für zwei 4096er-Bilder. Erwartet werden 2–4 MB Download und 20–40 MB Grafikspeicher (geschätzt, nicht gemessen) | klein bis mittel | 0 € | MIT (KTX-Software: Apache 2.0, unsicher) | Vereinfachen kann das eingebrannte Licht verschieben; für KTX2 muss ein Programm installiert werden (vorher fragen) | **vor dem iPad-Test und vor Block C** (laut Plan erst E, das ist zu spät) |
| 2 | **KayKit Character Animations** laden und prüfen | 133 Bewegungen statt der 76 aus der Adventurers-Datei, darunter Werkzeug-Bewegungen wie Hacken, Graben und Angeln. Sie passen ohne Umrechnen auf unsere Körper, wenn das Skelett gleich ist | klein | 0 € (Spende freiwillig) | CC0 (bestätigt) | Es ist noch offen, ob die Adventurers auf demselben Skelett „Rig_Medium“ sitzen | **A, Schritt 2** |
| 3 | **Rhubarb Lip Sync** auf die vorhandenen Aufnahmen | Münder bewegen sich passend zur Sprache, für Gary und alle Begleiter, ohne neue Credits. Das Programm läuft auch in der Cloud | klein bis mittel | 0 € | MIT (nachgelesen) | Französisch geht nur ungenauer; die Köpfe brauchen 6–9 Mundformen | **A, Schritt 1b Punkt 5**, dann jeder neue Begleiter |
| 4 | **Treiber der Grafikkarte erneuern und HIP in Blender einschalten** (AlexPC hat eine AMD RX 6500 XT mit 4 GB, Treiber von Januar 2022) | Laut Ideenspeicher 10b „findet Blender auf AlexPC keine Grafikkarte“; der alte Treiber ist sehr wahrscheinlich der Grund, Blender 4.5 verlangt mindestens Adrenalin 24.6.1. Mit aktuellem Treiber rechnet das Licht-Einbrennen auf der Karte, ehrlich erwartet **etwa 1,5- bis 2,5-mal schneller** (7 Minuten → grob 3–5), nicht zehnmal (geschätzt). Weniger Samples plus Entrauschen und kleinere Einbrenn-Bilder bringen ähnlich viel. Bild-zu-3D geht auf dieser Karte nicht (siehe Nachtrag) | klein | 0 € | – | Adrenalin 26.5.1 hat Cycles kaputt gemacht (dann 26.3.1 nehmen); HIP RT erst ausgeschaltet lassen; 4 GB könnten bei 4K-Bildern knapp werden | **sofort**, wichtig für C (der Hof ist größer als ein Raum) |
| 5 | **Selbstprüfung mit Prüfbildern** aus festen Kameras, im Hintergrund gerechnet. Dazu Prüfzahlen im Skript: Dreiecke, Bildgrößen, „Kopf schneidet Körper nicht“ | Der Bau-Chat erkennt Fehler wie „Kopf dreht in den Körper“ selbst. Das geht auch in der Cloud, ohne AlexPC | klein | 0 € | – | Prüfbilder zeigen keine Bildrate | **A jetzt**, danach jeder Raum |
| 6 | **MCP for Blender** (früher BlenderMCP) nur abgesichert: neueste Fassung, nur auf dem eigenen Rechner, Telemetrie aus, nur Poly Haven. MCP heißt: Claude bedient Blender direkt | Claude kann im laufenden Blender nachbessern und dabei hinsehen | klein | 0 € | MIT (nachgelesen) | 2026 gab es 3 gemeldete Sicherheitslücken; die Verbindung hat kein Passwort | A, Schritt 1b (Probe schon beauftragt) |
| 7 | **Bausätze als Requisiten, umgefärbt mit einer eigenen Farbpalette** (eine kleine Farbtextur für alles): Quaternius Medieval Village MegaKit (Tudor-Häuser), KayKit Furniture Bits (Den), Kenney Train Kit (Tube), Kenney City Kit (Piccadilly, New York) | Schnell viele Dinge in einem einheitlichen Stil, der nicht nach KayKit aussieht. Die Dateien bleiben winzig | mittel | 0 € | CC0 (bestätigt) | Die Stile verschiedener Pakete passen nur mit der Palette zusammen | **C (Hof)**, D (Den), später Tube, Piccadilly, EN9 |
| 8 | **Welt in Stücken laden**: Jede Schlüsseltür ist eine Ladegrenze, Nebel verdeckt den Rand | So entsteht das Gefühl einer offenen Welt wie bei GTA, ohne dass das iPad überläuft. Vorbild ist „A Short Hike“: Freiheit kommt von Dichte, sichtbaren Zielen und Abkürzungen, nicht von Größe | mittel | 0 € | – | Ferne Stücke muss man sauber aus dem Speicher entfernen | **C (Planung des Hofs)** |
| 9 | **Ton-Quellen festlegen**: Kenney (CC0), Freesound nur mit Filter CC0, Sonniss-GDC-Pakete. Dazu je Ordner eine `QUELLEN.md` und alle Töne auf −16 LUFS angleichen (LUFS = Maß für die gefühlte Lautstärke) | Geräusche für Ort, Feuer, Raben und Schritte ohne Lizenzsorgen; Sprache und Geräusche gleich laut | klein | 0 € | CC0 bzw. frei ohne Nennung | BBC Sound Effects meiden; ElevenLabs-Geräusche nur auf dem Bezahlplan | **E**, Hof-Geräusche schon in C |
| 10 | **Bild-zu-3D nur für feste Requisiten** (Büsten, Vasen, Fossilien fürs Museum): **auf AlexPC lokal so gut wie nicht** (4 GB, kein CUDA). Stattdessen Meshy/Tripo online oder TRELLIS.2 bzw. Stable Fast 3D auf einer **gemieteten Grafikkarte** für ein paar Stunden. **Nicht Hunyuan3D** | Museumsstücke und Kleinkram in Mengen, die wir per Skript nie bauen würden | mittel | 0 € (online mit Nennung), ein Monat 16–20 $ oder etwa 1–5 € Mietzeit für 30 Stücke (geschätzt) | MIT / Stability Community / CC BY 4.0 (online, Nennung nötig) | Ergebnisse sind zu schwer und sehen nach Foto aus, man muss sie nacharbeiten. Für Figuren und Tiere taugt es nicht | **später: British Museum** |

**Was bewusst nicht auf der Liste steht:** Wir wechseln nicht auf WebGPU, holen keine Physik-Engine und keine Nachbearbeitungs-Effekte, keine Menschen-Generatoren, kein Mixamo. Zootiere kaufen wir vorerst nicht (Begründungen in den Abschnitten).

## Nachtrag: Was AlexPC kann (RX 6500 XT, 4 GB)

Neu bekannt (18.11.): AlexPC hat eine **AMD Radeon RX 6500 XT mit 4 GB Grafikspeicher** (Bauart RDNA2, Chip Navi 24), den Treiber vom Januar 2022, 128 GB Arbeitsspeicher und einen Prozessor mit etwa 4,5 GHz. Keine NVIDIA-Karte, also kein CUDA (CUDA ist NVIDIAs Rechen-Schnittstelle, die fast alle KI-Programme voraussetzen). **Auch das ist nicht bei uns ausprobiert**, sondern nachgelesen.

**Licht einbrennen auf der Grafikkarte (Blender Cycles mit HIP; HIP ist AMDs Gegenstück zu CUDA):**
- **Die Karte geht grundsätzlich.** Laut Blender-Handbuch läuft HIP unter Windows auf allen AMD-Karten ab RDNA1, die RX 6000-Reihe ist genannt. Die 6500 XT selbst steht in keiner Liste geprüfter Karten, es gibt aber Messungen mit ihr in Blender (bestätigt: [Handbuch 4.5](https://docs.blender.org/manual/en/4.5/render/cycles/gpu_rendering.html), [AMD-Ankündigung 2021](https://code.blender.org/2021/11/next-level-support-for-amd-gpus/), [OpenBenchmarking](https://openbenchmarking.org/result/2302207-TAD-AMDSW22154)).
- **Der Treiber von Januar 2022 ist zu alt.** Blender 3.x verlangte mindestens Adrenalin 21.12.1, das Handbuch zu Blender 4.5 nennt **mindestens Adrenalin 24.6.1** (nachgelesen, Suchauszug). Wahrscheinlich ist das der Grund, warum Blender „keine Grafikkarte findet“ (abgeleitet). Also: aktuellen Adrenalin-Treiber von amd.com installieren.
- **Aber nicht jeden:** Adrenalin **26.5.1** (Mai 2026) hat Cycles kaputt gemacht, weil Blender 5.1 noch alte HIP-Bausteine (ROCm 6) braucht. AMD riet zu **26.3.1**; Blender 5.2 sollte auf ROCm 7 umstellen (bestätigt: [Overclock3D](https://overclock3d.net/news/software/amd-radeon-26-5-1-driver-breaks-blender-cycles-fix-incoming/), [PauseHardware](https://pausehardware.com/blender-cycles-amd-26-5-1-hip/)). Ob Blender 5.3 mit dem neuesten Treiber läuft, ist offen (unsicher). Faustregel: Blender und Treiber zusammen aktuell halten; geht es nicht, 26.3.1 nehmen.
- **HIP RT** (Strahlen-Beschleunigung auf der Karte) ist für RX 6000 und neuer vorgesehen, macht laut Fehlermeldungen aber öfter Abstürze und frisst Speicher. Erst ohne HIP RT messen (nachgelesen: [Issue 108115](https://projects.blender.org/blender/blender/issues/108115), [Issue 120702](https://projects.blender.org/blender/blender/issues/120702)).
- **Ehrliche Erwartung beim Tempo:** In einer Messung rechnete die 6500 XT die Blender-Testszene „BMW“ in 66 Sekunden; schnelle 8-Kern-Prozessoren brauchen dafür etwa 90–170 Sekunden (nachgelesen: [OpenBenchmarking 6500 XT](https://openbenchmarking.org/result/2302207-TAD-AMDSW22154), [CGDirector](https://www.cgdirector.com/blender-benchmark-results-updated-scores/), [OpenBenchmarking 5900X](https://openbenchmarking.org/result/2101192-HA-PHORONIXB24&export=html)). Das heißt: **eher 1,5- bis 2,5-mal schneller, nicht zehnmal.** Aus 7 Minuten würden grob 3–5 Minuten (geschätzt). Testberichte raten von der 6500 XT für Blender ab ([Lanoc](https://lanoc.org/review/video-cards/sapphire-pulse-rx-6500-xt?start=7)).
- **4 GB Speicher:** Für einen kleinen Low-Poly-Raum reicht das wahrscheinlich, die 4K-Bilder sind der größte Brocken (abgeleitet). Ob Blender bei AMD unter Windows in den normalen Arbeitsspeicher ausweicht, wenn die 4 GB voll sind, widerspricht sich in den Quellen (unsicher: [Handbuch 3.6](https://docs.blender.org/manual/en/3.6/render/cycles/gpu_rendering.html), [Blender Artists](https://blenderartists.org/t/is-there-a-swap-from-ram-when-there-is-a-lack-of-vram-when-rendering-cycles-for-video-cards-amd-rx/1547587)).
- **Die schmale Anbindung** der Karte (nur 4 statt 16 Leitungen zum Rechner) bremst vor allem Spiele, wenn der Speicher überläuft. Beim Einbrennen wird die Szene einmal hochgeladen, das fällt kaum ins Gewicht (abgeleitet, keine Messung gefunden).
- **Was ohne neue Karte mehr bringt (abgeleitet bzw. Vorwissen, unsicher):** weniger Samples und danach entrauschen (Open Image Denoise läuft auf dem Prozessor, z. B. als Entrausch-Knoten auf das fertige Einbrenn-Bild); Einbrenn-Bilder 1024 oder 2048 statt 4096 (die werden für das iPad ohnehin verkleinert, Punkt 1); nur die Teile neu einbrennen, die sich geändert haben; das Einbrennen nebenbei ohne Fenster laufen lassen (`blender -b -P`). Eevee kann nicht einbrennen, das geht nur mit Cycles. Eine gemietete Grafikkarte nur zum Einbrennen lohnt für einen Raum nicht: Einrichten und Hochladen dauern länger als 7 Minuten (abgeleitet); erst bei vielen Hof-Stücken auf einmal wäre das eine Überlegung. Die Cloud-Chats können mit bpy auf dem Prozessor einbrennen, Tempo ungemessen.

**Bild-zu-3D und Auto-Skelett auf AlexPC: so gut wie nein.**
- Alle Modelle aus Abschnitt 4 brauchen **mindestens 6 GB** (TripoSR, Stable Fast 3D), meist 8–24 GB, und fast alle sind auf CUDA gebaut (TRELLIS, TRELLIS.2, UniRig, Step1X-3D mit eigenen CUDA-Bausteinen). Mit 4 GB geht keines auf der Karte (abgeleitet).
- **AMDs KI-Weg unter Windows** (ROCm/PyTorch) unterstützt offiziell nur RX 7000 und RX 9000, nicht die RX 6000 (bestätigt: [ROCm-Matrix](https://rocm.docs.amd.com/projects/radeon-ryzen/en/latest/docs/compatibility/compatibilityrad/windows/windows_compatibility.html), [Community-Projekt](https://github.com/ssubedir/RCOm-windows-gfx1030)). **ZLUDA** (lässt CUDA-Programme auf AMD laufen) ist seit Version 6 (Juni 2026) wieder Hobbyprojekt, PyTorch geht nur teilweise (bestätigt: [Phoronix](https://phoronix.com/news/ZLUDA-6-Released), [Tom's Hardware](https://www.tomshardware.com/pc-components/gpu-drivers/cuda-emulator-for-amd-gpus-zluda-loses-funding-with-v6-release-embattled-project-goes-back-to-hobby-status-but-now-includes-32-bit-physx-support)). Für uns nicht lohnend.
- **Nur auf dem Prozessor denkbar:** Stable Fast 3D hat einen Schalter `SF3D_USE_CPU=1` (nachgelesen: [README](https://raw.githubusercontent.com/Stability-AI/stable-fast-3d/main/README.md)); TripoSR läuft laut Stability „auch ohne Grafikkarte“ ([Stability](https://stability.ai/news/triposr-3d-generation)). Mit 128 GB Arbeitsspeicher reicht der Platz; wie lange ein Stück dauert, steht nirgends (geschätzt: Minuten statt Sekunden, unsicher). Höchstens als kleine Probe.
- **Der eigentliche Weg:** online (Meshy, Tripo, Hugging-Face-Seiten) oder eine **gemietete Grafikkarte** für ein paar Stunden. Einzelheiten in Abschnitt 4.

---

## 1 Blender steuern: Das Skript bleibt der Kern, MCP ist Zugabe

Der Weg „Claude schreibt ein Python-Skript, Blender führt es ohne Fenster aus“ (`blender -b -P`) trägt weiter. MCP lohnt sich nur zum Nachbessern mit Hinsehen. Dasselbe „Sehen“ bekommt man billiger, wenn das Skript nach jedem Bau kleine Prüfbilder rechnet und Claude sie liest. Ein fertiges Vorbild genau dafür ist `blender-web-3d-skill`: Es baut in Blender 5.2 ohne Fenster über etwa 30 Skripte, exportiert GLB, verkleinert mit gltf-transform und prüft echte Bildpunkte.

| Fund | Was es ist / bringt | Lizenz | Stand | Quelle |
|---|---|---|---|---|
| **MCP for Blender** (früher blender-mcp, ahujasid) | Werkzeug `look` zeigt Ansicht, Kamera und Render; `execute_blender_code` führt Python aus. Windows-Einrichtung über `uv`; es darf nur eine Instanz gleichzeitig laufen; große Aufträge in kleine Schritte zerlegen | MIT | nachgelesen | [GitHub](https://github.com/ahujasid/blender-mcp) |
| Umbenennung Sept. 2026 | neuer Befehl `uvx mcp-for-blender` | – | unsicher | [aiwiki](https://aiwiki.ai/wiki/blender_mcp) |
| **3 Sicherheitslücken 2026** (CVE-2026-10688, -10661, -10662) | fremder Code und Abrufe über präparierte Adressen möglich, betroffen bis Commit 7636d13 | – | bestätigt | [NVD 10662](https://nvd.nist.gov/vuln/detail/CVE-2026-10662), [NVD 10661](https://nvd.nist.gov/vuln/detail/CVE-2026-10661), [cvefeed 10688](https://cvefeed.io/vuln/detail/CVE-2026-10688) |
| Telemetrie | sendet standardmäßig anonyme Nutzungsdaten, die laut Seite auch für KI-Training dienen dürfen; abschalten mit `DISABLE_TELEMETRY=true` | – | nachgelesen | [GitHub](https://github.com/ahujasid/blender-mcp) |
| Einbindungen in MCP | Poly Haven (CC0, ohne Schlüssel); Sketchfab, Hyper3D, Meshy, Tripo und Hunyuan nur mit Schlüssel, Kosten und eigener Lizenz | – | nachgelesen | [GitHub](https://github.com/ahujasid/blender-mcp) |
| **Offizieller MCP von Blender Lab** | ab Blender 5.1; eher zum Prüfen und Skripten als zum Gestalten; Lizenz und Bildausgabe unbekannt | unklar | unsicher | [strayspark (Suchtreffer)](https://www.strayspark.studio/blog/official-blender-mcp-server-comparison-2026) |
| **bpy als Python-Paket** (Blender ohne Programmfenster, z. B. in der Cloud) | Version 5.3.0 vom 10.11.2026, **nur mit Python 3.13**, etwa 430 MB; Windows, Linux, macOS | GPL | nachgelesen | [PyPI](https://pypi.org/project/bpy/) |
| Rechnen ohne Grafikkarte | Cycles auf dem Prozessor geht ohne Bildschirm. Eevee braucht OpenGL bzw. einen Bildschirm (die Belege dafür sind alt). Einbrennen kann ohnehin nur Cycles. Also könnten auch die Cloud-Chats (ohne Grafikkarte) mit bpy Licht einbrennen; wie schnell, hängt an den Prozessorkernen der Cloud und ist nicht gemessen. Auf AlexPC kann Cycles über HIP die RX 6500 XT nutzen, sobald der Treiber aktuell ist (siehe Nachtrag) | – | bestätigt (alt) / unsicher (Cloud-Tempo) | [devtalk](https://devtalk.blender.org/t/blender-2-8-unable-to-open-a-display-by-the-rendering-on-the-background-eevee/1436), [Issue 77339](https://projects.blender.org/blender/blender/issues/77339) |
| **glTF hat keinen Platz für Lichtkarten** | Entweder das Licht in die Grundfarbe einbrennen (so machen wir es) oder eine zweite UV-Karte mit eigenem Code (`texture.channel = 1`, `flipY = false`). UV-Karte = die Zuordnung, wie ein Bild auf die Oberfläche gelegt wird | – | bestätigt | [three.js-Forum](https://discourse.threejs.org/t/lightmap-uses-wrong-uv-in-loaded-gltf-model/57434), [hackmd](https://hackmd.io/@XR/lightmapping-web) |
| Einbrenn-Erweiterungen | The Lightmapper (GPL, kostenlos, wenig gepflegt); Bake Wrangler und SimpleBake (GPL, 20–80 $); ob sie ohne Fenster laufen, ist nicht belegt | GPL | nachgelesen / unsicher | [Lightmapper](https://github.com/Naxela/The_Lightmapper), [Bake Wrangler](https://superhivemarket.com/products/bake-wrangler) |
| **blender-web-3d-skill** | ein fertiger Claude-Code-Ablauf Blender → GLB → Three.js mit Fehlerliste, auch zu API-Änderungen in Blender 5.x | MIT | nachgelesen | [GitHub](https://github.com/czlonkowski/blender-web-3d-skill) |

**Folgerung:** Unser eigenes Einbrenn-Skript (`tower_gltf.py`) reicht, wir müssen nichts kaufen. Blender auf AlexPC und in der Cloud sollte dieselbe Version haben (5.2 oder 5.3), weil sich die Befehle zwischen 4.x und 5.x geändert haben.

## 2 Figuren: KayKit trägt weiter, Münder kommen gratis, Tiere bauen wir selbst

**Bewegungen.** Laut Ideenspeicher 10d stecken in der Adventurers-Datei 76 Bewegungen, das Zusatzpaket wurde nicht geladen. Dieses Zusatzpaket „KayKit Character Animations“ hat laut Auszügen **133 Bewegungen** für Rig_Medium und Rig_Large. Für Sitzen, Werkzeug und Gesten reicht das voraussichtlich, sodass Quaternius und Mixamo unnötig werden. Fehlt doch etwas, wird die Bewegung **in Blender beim Export** übertragen (Rokoko oder die Erweiterung „Retarget“), nicht erst im Browser. Die Browser-Funktion `retargetClip` hat bekannte Fehler.

**Gesichter.** Für unsere Skript-Köpfe genügen ein kleiner Satz Formschlüssel (Shape Keys, also gespeicherte Verformungen; im Browser heißen sie „Morph Targets“) oder Textur-Gesichter, bei denen Mund und Augen als austauschbare Bildchen aufgemalt sind. Der Bau-Chat hat bewegliche Gesichtsteile gewählt (10e). Das passt, denn die 9 Rhubarb-Mundformen lassen sich als Formen *eines* Teils „mund“ bauen. Volle Gesichts-Skelette und der „TalkingHead“-Standard mit 67 Formen sind für unseren Stil zu viel.

**Kleidung.** Am sichersten ist eine Figuren-Datei, in der alle Kleidungsstücke am selben Skelett hängen; das Spiel schaltet nur sichtbar oder unsichtbar. Hut, Feder, Abzeichen und Handstück werden wie bisher mit `steckeAuf` an einen Knochen gehängt. Kleidung aus getrennten Dateien an ein Skelett zu binden ist fehleranfällig.

| Fund | Was es ist / bringt | Lizenz | Stand | Quelle |
|---|---|---|---|---|
| **KayKit Character Animations** | 133 Bewegungen für Rig_Medium/Large, Update 1.1 mit 28 Werkzeug-Bewegungen; Preis frei wählbar | CC0 | bestätigt | [itch.io](https://kaylousberg.itch.io/kaykit-character-animations), [OpenGameArt](https://opengameart.org/content/kaykit-character-animations) |
| Quaternius Universal Animation Library 2 (Feb. 2026) | über 130 Bewegungen, etwa 70 % davon kostenlos, Quelldatei ab 14,99 $; anderes Skelett | CC0 | bestätigt | [Digital Production](https://digitalproduction.com/2026/02/10/130-animations-one-rig-zero-drama/), [OpenGameArt](https://opengameart.org/content/universal-animation-library-2) |
| Quaternius UAL 1 | „120+“ Bewegungen, davon nur 45 kostenlos | CC0 | bestätigt | [OpenGameArt](https://opengameart.org/content/universal-animation-library) |
| **Mixamo** | kostenlos, aber **Rohdateien weitergeben ist verboten**. Eine öffentlich herunterladbare glTF-Datei ist eine Grauzone; Schul-Konten (Enterprise/Federated) sind ausgeschlossen | Adobe-Bedingungen | bestätigt | [Adobe FAQ](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html), [Adobe Community](https://community.adobe.com/t5/mixamo-discussions/mixamo-faq-licensing-royalties-ownership-eula-and-tos/td-p/13234775) |
| Rokoko-Retargeting (Blender) | kostenlos; ob eine Anmeldung nötig ist und ob es mit Blender 5 läuft, ist unklar | frei | bestätigt / unsicher | [Rokoko Support](https://support.rokoko.com/hc/en-us/articles/4410463481489) |
| Erweiterung „Retarget“ (Nachfolger von Expy Kit) | überträgt viele Bewegungen auf einmal, nur für Blender 5+ | frei | bestätigt | [extensions.blender.org](https://extensions.blender.org/add-ons/retarget/) |
| `SkeletonUtils.retargetClip` (three.js) | existiert, gilt laut einem Betreuer aber als veraltet; Fehler mit gedrehten Füßen | MIT | bestätigt | [Doku](https://threejs.org/docs/pages/module-SkeletonUtils.html), [Forum](https://discourse.threejs.org/t/fixing-skeletonutils-retarget-and-retargetclip-functions/65149) |
| **Rhubarb Lip Sync** | macht aus einer Aufnahme 6 Grund- und 3 Zusatz-Mundformen (A–F, G, H, X) mit Zeiten als JSON; Windows, macOS, **Linux**; liest WAV/Ogg (MP3 vorher umwandeln); `-d` mit dem Text verbessert das Ergebnis; Englisch gut, andere Sprachen nur „phonetic“ | MIT | nachgelesen | [GitHub](https://github.com/DanielSWolf/rhubarb-lip-sync), [LICENSE](https://raw.githubusercontent.com/DanielSWolf/rhubarb-lip-sync/master/LICENSE.md) |
| ElevenLabs „with-timestamps“ | Zeiten je Buchstabe in den Feldern `character_start_times_seconds` usw., auch für Text-to-Dialogue; gilt nur für neue Aufnahmen | ElevenLabs-Plan | bestätigt | [Doku](https://elevenlabs.io/docs/api-reference/streaming-with-timestamps) |
| ElevenLabs „Forced Alignment“ für vorhandene Aufnahmen | wäre die Lösung für Französisch; ob es das gibt und was es kostet, ist offen | ? | unsicher (Vorwissen) | – |
| wawa-lipsync | Rückfall-Lösung „Mund folgt dem Klang“ im Browser; Version 0.0.1 | MIT | nachgelesen | [README](https://app.unpkg.com/wawa-lipsync@0.0.1/files/README.md) |
| TalkingHead | verlangt 52 + 15 Formschlüssel für realistische Avatare; taugt nur als Code-Vorbild | MIT | nachgelesen | [GitHub](https://github.com/met4citizen/TalkingHead) |
| Morph Targets in three.js | seit r133 ohne die alte Grenze von 8; auf einzelnen Handy-Grafikchips gab es Fehler, für das iPad wurde keine Meldung gefunden | – | bestätigt / unsicher | [Forum](https://discourse.threejs.org/t/having-more-than-8-morph-targets/26859), [Issue-Spiegel](https://lightrun.com/answers/mrdoob-three-js-morph-targets-broken-on-some-mobile-devices-using-webgl-2) |
| Kleidung am selben Skelett | Rat aus mehreren Foren-Diskussionen | – | bestätigt | [Forum](https://discourse.threejs.org/t/sharing-a-skeleton-between-different-skinned-meshes/61189), [Forum](https://discourse.threejs.org/t/swapping-out-a-skinned-mesh-with-another-skinned-mesh/34733) |
| **Tiere** von Quaternius | LowPoly Animated Animals (Kuh, Pferd, Lama, Schwein, Mops) und Animated Animales (Wolf, Hund, Katze, Adler), mit Idle/Walk/Run/Jump | CC0 | bestätigt | [itch.io](https://quaternius.itch.io/lowpoly-animated-animals), [OpenGameArt](https://opengameart.org/content/animated-animales-low-poly) |
| Zootiere zum Kaufen | CGTrader-Savanne (10 Tiere), RenderHub „Zoo Animals 99“, Unity-Paket für 4,99 $; die Lizenzen sind „royalty-free“ ohne Weitergabe der Rohdatei, das ist für eine öffentliche Web-App fraglich | kommerziell | unsicher | [CGTrader](https://www.cgtrader.com/3d-models/animal/mammal/low-poly-and-realistic-savanna-animals-animated), [RenderHub](https://www.renderhub.com/absurdox/zoo-animals-99-low-poly-models) |
| Ready Player Me | seit 31.1.2026 abgeschaltet | – | bestätigt | [Wikipedia](https://en.wikipedia.org/wiki/Ready_Player_Me) |
| MakeHuman/MPFB | die Ausgaben wären CC0, sehen aber realistisch aus, nicht nach unserem Stil | CC0 / GPL / AGPL | nachgelesen (Auszug) | [Lizenz](https://static.makehumancommunity.org/about/license.html) |

**Für die Vision heißt das:**
- **Sammelbare Begleiter mit eigenen Sprüchen:** Jeder neue Begleiter kostet nur noch die Stimme (ElevenLabs), denn die Mundbewegung macht Rhubarb kostenlos dazu. Der Mund wird einmal je Kopf gebaut.
- **London Zoo:** Löwe, Pinguin, Giraffe, Elefant und Gorilla gibt es nicht als freies, einheitliches Paket. Der Pinguin (kaum Gelenke, Watscheln per Formel) und der Gorilla (nah an den Menschen-Bewegungen) lassen sich am leichtesten per Skript bauen. Die Quaternius-Tiere dienen als Vorlage für Skelett und Bewegungsablauf von Vierbeinern.
- **Französisch:** Rhubarb arbeitet dort ungenauer. Bei neuen FR-Aufnahmen holen wir besser gleich die ElevenLabs-Zeitstempel ab.

## 3 Räume und Welt: Bausätze als Rohstoff, Freiheit durch Dichte

Du hast den KayKit-Stil für Räume abgelehnt. Deshalb nutzen wir Bausätze nicht als sichtbaren Stil, sondern als **Requisiten und Rohformen, umgefärbt mit unserer eigenen Palette**. Bruno Simon (folio-2025) und „A Short Hike“ machen es so: eine kleine Farbtextur für alles. Das ergibt winzige Dateien und einen einheitlichen Look. Typische London-Dinge wie Telefonzelle, Doppeldeckerbus, Tube-Schild, Wachhäuschen und Palasttor gibt es frei nur als Kaufware oder mit „Editorial only“-Lizenz, die in einem Spiel nicht erlaubt ist. Es sind einfache Formen, Claude baut sie schneller und sicherer per Skript.

| Fund | Wofür bei uns | Lizenz | Stand | Quelle |
|---|---|---|---|---|
| **Quaternius Medieval Village MegaKit** | über 300 Bausteine im Raster, Wände innen und außen, Dächer und Treppen: Tudor-Häuser am Tower Green, rundum geschlossene Räume. Die Grundfassung ist kostenlos, Pro ab 9,99 $ | CC0 | bestätigt | [itch.io](https://quaternius.itch.io/medieval-village-megakit), [OpenGameArt](https://opengameart.org/content/medieval-village-megakit) |
| KayKit Medieval Builder Pack | etwa 200 Teile: Mauern und Türme für den Hof | CC0 | nachgelesen | [OpenGameArt](https://opengameart.org/content/kaykit-medieval-builder-pack-10) |
| KayKit Furniture Bits | Möbel für The Den und den Möbel-Katalog | CC0 | bestätigt | [itch.io](https://kaylousberg.itch.io/furniture-bits) |
| KayKit City Builder Bits | Straßenteile | CC0 | bestätigt | [itch.io](https://kaylousberg.itch.io/city-builder-bits) |
| KayKit Dungeon Remastered, Restaurant Bits | Keller im White Tower, Küche | CC0 | unsicher | – |
| **Kenney Train Kit** | fast 50 Zug-Modelle mit Gleisen: Grundlage für die **Tube Station** | CC0 | nachgelesen | [OpenGameArt](https://opengameart.org/content/train-kit) |
| **Kenney City Kit Commercial 2.0** (+ Roads, Suburban, Industrial) | Ladenfronten, Markisen, Schilder: **Piccadilly Circus** und **EN9 „After Hours“ in New York** | CC0 | bestätigt | [OpenGameArt](https://opengameart.org/content/city-kit-commercial), [GDevelop](https://gdevelop.io/asset-store/free/city-kit-commercial-3d-commercial-city) |
| Kenney Castle Kit | Lizenzseite nicht bestätigt | CC0? | unsicher | [OpenGameArt-Liste](https://opengameart.org/node/189804) |
| Poly Haven | Texturen, Himmelsbilder (HDRIs), Modelle; schon im Einsatz | CC0 | bestätigt | [polyhaven.com](https://polyhaven.com/plugins/blender) |
| Poly Pizza | über 10.600 Modelle, **meist CC BY** (Nennung nötig), nur ein Teil CC0; die Lizenz steht je Modell | gemischt | unsicher | [Cinevva-Übersicht](https://app.cinevva.com/guides/free-3d-model-sites) |
| Telefonzelle/Bus bei Free3D/CGTrader | kostenpflichtig oder „Editorial only“, also im Spiel nicht nutzbar | – | nachgelesen | [Free3D](https://free3d.com/3d-model/red-telephone-box-weathered-low-poly-8062.html) |
| Buildify | Gebäude-Generator für Blender; 0 €, darf in Spielen genutzt werden, der Generator selbst darf nicht weitergegeben werden; ob er mit Blender 5 läuft, ist offen | eigene | bestätigt (2022) | [Gumroad](https://paveloliva.gumroad.com/l/buildify) |
| SceneCity | kostet etwa 20 $, ist für moderne Großstädte gedacht, nicht unser Stil | kommerziell | nachgelesen | [Gumroad](https://couturier-arnaud.gumroad.com/l/scenecity/v2_0_1s2x55q) |
| Fertige Baustein-Gruppen in Blender 5.0 | „Essentials“-Bausteine, z. B. zum Verstreuen | GPL | unsicher | [Release Notes 5.0](https://developer.blender.org/docs/release_notes/5.0/geometry_nodes/) |
| **Speicher des iPads** | Apple nennt keine feste Grenze. Seiten mit vielen Texturen werden beendet und laden dann in einer Schleife neu (WebKit-Fehlermeldung Okt. 2025); in einem Bericht taucht eine Grenze von 256 MB auf | – | bestätigt / unsicher | [WebKit 300782](https://bugs.webkit.org/show_bug.cgi?id=300782), [Apple-Forum](https://developer.apple.com/forums/thread/741624), [Babylon-Forum](https://forum.babylonjs.com/t/ios-cannot-open-an-app-on-ios-browsers-memory-limit/40698) |
| BatchedMesh mit Detailstufen | viele gleiche Dinge mit wenig Aufwand für die Grafikkarte zeichnen (offizielles Beispiel) | MIT | bestätigt | [three.js-Beispiel](https://threejs.org/examples/webgl_batch_lod_bvh.html), [GitHub](https://github.com/agargaro/batched-mesh-extensions/) |

**Offene Welt wie GTA, aber im Kleinen:**
- **Aufteilung:** Der Hof ist die Mitte. Jeder Bereich hinter einer Schlüsseltür ist ein eigenes Stück (eine eigene Datei), das beim Näherkommen lädt; weit entfernte Stücke werden aus dem Speicher entfernt. Nebel verdeckt den Rand.
- **Budget je Blick** (abgeleitet, nicht gemessen): etwa 300.000 Dreiecke, das hat das ProBook mit 60 Bildern pro Sekunde geschafft. Dazu unter 100 Zeichenaufrufe (Draw Calls, also einzelne Zeichenaufträge an die Grafikkarte) und Bilder höchstens 2048 Pixel groß.
- **Das Gefühl von Freiheit** entsteht laut den Vorbildern aus Abkürzungen, sichtbaren Zielen (das zugesperrte Tor) und vielen Dingen zum Antippen.
- **Licht:** Alles, was steht, bekommt sein Licht eingebrannt. Nur die Figuren bekommen echtes Licht im Browser. Feuer = ein bewegtes, leuchtendes Bildchen plus ein kleines Licht nur für die Figuren. Einbrennen kostet heute 7 Minuten je Raum auf dem Prozessor; die RX 6500 XT macht daraus grob 3–5 (geschätzt). Für den größeren Hof zählt deshalb mehr: Einbrenn-Bilder höchstens 2048, wenige Samples plus Entrauschen, nur geänderte Stücke neu einbrennen und das Ganze ohne Fenster im Hintergrund laufen lassen (Nachtrag oben).

## 4 Bild-zu-3D und automatisches Skelett: gut für Museumsstücke, nicht für Figuren

| Fund | Was | Lizenz | Hardware | Stand | Quelle |
|---|---|---|---|---|---|
| **Hunyuan3D 2.1** | Die Lizenz gilt ausdrücklich **nicht in EU, UK und Südkorea**, also haben wir in Deutschland kein Nutzungsrecht. Version 3.0 gibt es nur als Online-Dienst | Tencent Community | 10–29 GB | nachgelesen | [LICENSE](https://raw.githubusercontent.com/Tencent-Hunyuan/Hunyuan3D-2.1/main/LICENSE) |
| **TRELLIS.2** (Microsoft) | Ausgabe als GLB mit Texturen, bis zu 1 Mio. Flächen und 4K-Bild; offiziell nur Linux | MIT (Hilfsbibliothek nvdiffrast evtl. nur nicht-kommerziell, unsicher) | **mindestens 24 GB** | nachgelesen | [GitHub](https://github.com/microsoft/TRELLIS.2) |
| TRELLIS v1 | Windows-Installer aus der Community | MIT | etwa 16 GB | unsicher | – |
| TripoSG / TripoSR | macht schnell eine Form, Textur nur getrennt bzw. grob | MIT | 6–8 GB | unsicher | [cmarix](https://www.cmarix.com/blog/top-open-source-ai-models-for-3d-image-generation/) |
| Stable Fast 3D / SPAR3D | schnell, Zielgröße einstellbar, also von sich aus leichte Modelle | Stability Community (kostenlos unter 1 Mio. $ Umsatz) | 6–10 GB | bestätigt (Lizenz) / unsicher (Speicher) | [HF SF3D](https://huggingface.co/stabilityai/stable-fast-3d/blob/refs%2Fpr%2F8/README.md) |
| Step1X-3D | Form und Textur in zwei Stufen; Speicherbedarf unbekannt | Apache 2.0 | ? | bestätigt | [arXiv](https://arxiv.org/abs/2505.07747) |
| SAM 3D Objects (Meta) | baut Gegenstände aus Fotos nach, sieht realistisch aus | SAM License (gebührenfrei) | ? | nachgelesen | [GitHub](https://github.com/facebookresearch/sam-3d-objects), [LICENSE](https://raw.githubusercontent.com/facebookresearch/sam-3d-objects/main/LICENSE) |
| **Meshy** (online) | kostenlos 100 Credits im Monat, die Ergebnisse sind **öffentlich und CC BY 4.0**; Pro 16–20 $ im Monat, dann ohne Nennung | CC BY 4.0 / eigene | – | bestätigt | [Preise](https://meshy.ai/pricing), [Doku](https://docs.meshy.ai/tr/webapp/pricing) |
| **Tripo** (online) | kostenlos, CC BY 4.0; Auto-Skelett auch kostenlos; aber die AGB widersprechen der Preisseite | widersprüchlich | – | unsicher | [Tripo-Blog](https://www.tripo3d.ai/blog/commercial-use-ai-3d-models) |
| Sloyd | Regler-Generator für saubere Low-Poly-Requisiten (Möbel, Gebäude), Preis nicht lesbar | ? | – | bestätigt (Funktion) | [Sloyd-Blog](https://www.sloyd.ai/blog/using-sloyd-for-low-poly-game-assets) |
| **UniRig** | baut Skelette automatisch, auch für Tiere (Beispiele Giraffe, Hase); fehlen Schwanz- oder Flügelknochen, wird es schlechter; eher Linux/WSL | Code MIT, Lizenz der Modelldaten offen | mindestens 8 GB | nachgelesen | [GitHub](https://github.com/VAST-AI-Research/UniRig) |
| AccuRIG 2.0 | kostenloses Auto-Skelett für Windows, nur für Zweibeiner | nicht gelesen | – | bestätigt (Funktion) | [CG Channel](https://www.cgchannel.com/?p=168596) |
| **AlexPC** (RX 6500 XT, 4 GB, AMD) | keins der Modelle oben passt in 4 GB; AMDs KI-Weg (ROCm/PyTorch unter Windows) unterstützt die RX 6000 nicht offiziell, ZLUDA nur teilweise. Auf dem Prozessor allenfalls Stable Fast 3D (`SF3D_USE_CPU=1`) oder TripoSR als Probe, Dauer unbekannt | – | 4 GB | bestätigt (Unterstützung) / unsicher (Prozessor-Tempo) | [ROCm-Matrix](https://rocm.docs.amd.com/projects/radeon-ryzen/en/latest/docs/compatibility/compatibilityrad/windows/windows_compatibility.html), [SF3D README](https://raw.githubusercontent.com/Stability-AI/stable-fast-3d/main/README.md) |
| **Hugging-Face-Seiten** (z. B. microsoft/TRELLIS.2, Stable Fast 3D) | kostenlos im Browser, aber über „ZeroGPU“ knapp bemessen: etwa 3,5–5 Rechenminuten am Tag mit kostenlosem Konto, PRO 25 Minuten. Für 30 Stücke reicht das über mehrere Tage. Eine Lizenz für die Ergebnisse nennen die Seiten nicht; es gilt wohl die Lizenz des Modells (TRELLIS.2: MIT, SF3D: Stability Community) | Modell-Lizenz | – | bestätigt (Grenze ungefähr) / unsicher (Lizenz der Ergebnisse) | [HF-Forum](https://discuss.huggingface.co/t/what-is-the-free-zerogpu-quota-for-1-space/178610), [HF-Doku](https://huggingface.co/docs/hub/spaces-zerogpu.md), [TRELLIS.2-Space](https://huggingface.co/spaces/microsoft/TRELLIS.2/discussions) |
| **Gemietete Grafikkarte** (RTX 4090, 24 GB) | RunPod etwa 0,34 $/Std. (Community) bzw. 0,69 $/Std. (Secure), Abrechnung nach Sekunden; Vast.ai etwa 0,20–0,52 $/Std. Lambda bietet keine 4090 an. Für 30 Museumsstücke mit TRELLIS.2 grob 2–4 Stunden inklusive Einrichten, also **etwa 1–3 $** plus Speicherplatz (geschätzt). Ergebnisse unter der Modell-Lizenz, keine Nennung eines Dienstes nötig | Modell-Lizenz | 24 GB | bestätigt (Preise schwanken) / unsicher (Stundenzahl) | [RunPod 4090](https://www.runpod.io/gpu-models/rtx-4090), [Hackceleration](https://www.hackceleration.com/labs/runpod-pricing), [computeprices](https://computeprices.com/providers/vast/gpus/rtx4090), [neurohive](https://neurohive.io/en/guides/cloud-gpu-pricing/) |
| Google Colab | kostenlos meist eine T4 mit 16 GB (zu wenig für TRELLIS.2), ohne Zusage; Pro 9,99 $ im Monat für 100 Recheneinheiten, eine L4 (24 GB) kostet etwa 1,7 Einheiten je Stunde | Modell-Lizenz | 16 / 24 GB | unsicher (Nebenquellen) | [hivenet](https://compute.hivenet.com/post/google-colaboratory-gpu-complete-guide-to-free-cloud-gpu-access-and-limitations), [dev.to](https://dev.to/jovan_chan_9500711396d4e6/google-colab-cli-review-2026-free-and-cheap-gpus-for-claude-code-codex-and-cursor-agents-from-5el7) |

**Folgerung:**
- **Wofür:** Bild-zu-3D lohnt sich bei uns für **feste Requisiten** wie Museumsstücke, Essen, Statuen und Pflanzen. Für Figuren, Gesichter, Räume, Schrift und Tiere mit Bewegung lohnt es sich nicht.
- **Den Stil steuert das Eingabebild:** flache Farben, Dreiviertelansicht.
- **Danach immer per Skript nacharbeiten:** auf etwa 1.000–5.000 Dreiecke verkleinern, auf unsere Palette umfärben, mit gltf-transform verkleinern. Ziel nach Faustregel: unter 100–200 KB je Requisit.
- **Online-Dienste:** Meshy oder Tripo gratis gehen, wenn wir sie auf einer Credits-Seite nennen; erst die AGB von Tripo prüfen. Hochgeladen werden nur Bilder von Gegenständen, nie Kinderfotos.
- **Wo es läuft:** Auf AlexPC nicht (4 GB, AMD). Reihenfolge für das Museum: erst 2–3 Stücke kostenlos auf der Hugging-Face-Seite von TRELLIS.2 oder Stable Fast 3D ausprobieren; gefällt es, die 30 Stücke an einem Nachmittag auf einer gemieteten RTX 4090 rechnen (etwa 1–3 $, geschätzt). Das ist billiger als ein Meshy-Monat und braucht keine Nennung. Miete und Konto nur nach deinem OK.

## 5 Browser-Technik: verkleinern ja, WebGPU noch nicht

Kurzer Blick in das, was schon da ist: `probe3d.html` lädt three.js r170 lokal über eine Import-Map, ohne Build-Schritt; der Raum nutzt `MeshBasicMaterial` mit eingebranntem Licht. Aus der Datei `guardroom.glb` ausgelesen (nicht getestet): 14,7 MB, 19 Teile mit 19 Bildern (2 × 4096², 1 × 2048², 16 × 1024²), etwa 297.000 Dreiecke, ohne jede Kompression.

| Fund | Was es bringt | Lizenz | Stand | Quelle |
|---|---|---|---|---|
| **gltf-transform** | `optimize` erledigt viele Verkleinerungen auf einmal; KTX2 spart ausdrücklich Grafikspeicher; WebP und Größenänderung über „Sharp“ | MIT | nachgelesen | [README](https://raw.githubusercontent.com/donmccurdy/glTF-Transform/main/README.md) |
| Standardwerte von `optimize` | Meshopt, und es vereinfacht standardmäßig (`--simplify false` schaltet das ab); für KTX2 muss das Programm `ktx` (KTX-Software ab 4.4) installiert sein | – | unsicher (vor Gebrauch `-h` prüfen) | [Cinevva](https://app.cinevva.com/guides/optimize-glb-for-web), [Changelog](https://www.github.com/donmccurdy/glTF-Transform/blob/main/CHANGELOG.md) |
| **Meshopt statt Draco** | entpackt schneller (iPhone 12: etwa 2,7 s schneller in einem Test) und komprimiert auch Bewegungen und Formschlüssel; Draco ist etwa 11 % kleiner | MIT | bestätigt (Prinzip) / unsicher (Zahlen) | [gltf-transform-Doku](https://gltf-transform.dev/modules/extensions/classes/EXTMeshoptCompression), [Khronos PR 1830](https://github.com/KhronosGroup/glTF/pull/1830), [elf3d](https://elf3d.pages.dev/blog/blog-25-008.html) |
| Fallen beim Verkleinern | `flatten`/`prune` löschen benannte Drehpunkte ohne Warnung, `palette` löscht Materialnamen; Meshopt kann Positionen runden. **Unsere Gegenstände werden über ihre Namen angetippt**, deshalb aufpassen | – | nachgelesen | [blender-web-3d-skill](https://github.com/czlonkowski/blender-web-3d-skill) |
| **iPad-Abstürze durch Texturen** | ein GLB mit drei 4096er-Bildern wurde schwarz; Seiten werden ohne Vorwarnung beendet; ein verlorener Grafik-Zugang blockiert teils auch andere Tabs | – | bestätigt (Belege iOS 15–17) | [WebKit 232357](https://bugs.webkit.org/show_bug.cgi?id=232357), [WebKit 261685](https://bugs.webkit.org/show_bug.cgi?id=261685), [Forum M4-iPad](https://discourse.threejs.org/t/webgl-context-lost-on-m4-ipad-app-and-browsers/79845) |
| Vorbild für den Verkleinerungs-Weg | folio-2025: erst unkomprimiert aus Blender, dann `npm run compress` mit gltf-transform und KTX | MIT | nachgelesen | [GitHub](https://github.com/brunosimon/folio-2025) |
| **WebGPU** | seit Safari 26 (iPadOS 26) eingeschaltet; der WebGPURenderer fällt sonst auf WebGL2 zurück; ob er schon „fertig“ ist, widerspricht sich je nach Quelle | – | bestätigt / unsicher | [web.dev](https://web.dev/blog/webgpu-supported-major-browsers?hl=de), [Forum](https://discourse.threejs.org/t/tsl-and-webgl2-vs-webgpu/87974) |
| three-mesh-bvh | schnelles Antippen und Zusammenstoßen bei großen Räumen | MIT | bestätigt | [ecosyste.ms](https://awesome.ecosyste.ms/projects/github.com%2Fgkjohnson%2Fthree-mesh-bvh) |
| recast-navigation-js | Wegenetz mit Ausweichen in Gruppen; WASM, also ein großer Download | MIT / zlib | bestätigt | [README](https://cdn.jsdelivr.net/npm/@recast-navigation/three@0.43.1/README.md) |
| three-pathfinding | kleines Wegenetz in reinem JavaScript, das Netz wird in Blender gezeichnet | MIT? | unsicher | [ecosyste.ms](https://awesome.ecosyste.ms/projects/github.com%2Fdonmccurdy%2Fthree-pathfinding) |
| GSAP | Zeitleisten für Kamerafahrten, seit 2025 für alle kostenlos, aber unter einer eigenen Webflow-Lizenz, die keine freie Lizenz ist | eigene | nachgelesen | [GSAP-Lizenz](https://gsap.com/community/standard-license/) |
| Theatre.js | Kern Apache 2.0; der Editor stand früher unter AGPL; ob es noch gepflegt wird, ist offen | Apache / AGPL | nachgelesen / unsicher | [GitHub](https://github.com/theatre-js/theatre) |
| three.quarks, Yuka, three-nebula | Partikel bzw. Spielfiguren-Logik; Lizenzen nicht bestätigt | MIT? | unsicher | [three.quarks](https://github.com/Alchemist0823/three.quarks) |

**Folgerung:**
- **Beim WebGLRenderer bleiben.** Bei eingebranntem Licht bringt WebGPU nichts, und Schul-iPads haben oft nicht iPadOS 26. Ende 2027 neu prüfen.
- **Kein Bedarf** für eine Physik-Engine (wir springen nicht), für Nachbearbeitungs-Effekte (jeder Vollbild-Durchgang kostet auf eingebauter Grafik) oder für Draco.
- **Kamerafahrten** für Auftakt und Schluss gehen mit `CatmullRomCurve3`, ganz ohne Bibliothek.
- **Wegsuche:** Die eigene Gehkarte reicht für Räume. Erst im Hof lohnt ein Wegenetz.
- **Testprogramm erweitern:** Nach dem Laden `renderer.info` mitschreiben (Zeichenaufrufe, Dreiecke, Bilder) und Grenzen prüfen. Außerdem `webglcontextlost` abfangen und freundlich „Bitte neu laden“ zeigen.
- **Was die Cloud nicht kann:** Die Bildrate lässt sich dort nicht messen, nur auf dem echten Gerät.

## 6 Ton: Kenney, Freesound-CC0 und Sonniss; BBC bleibt draußen

| Fund | Bedingung | Stand | Quelle |
|---|---|---|---|
| **BBC Sound Effects (RemArc)** | Urheberrecht bleibt bei der BBC; nur „personal, educational or research“, nicht kommerziell; ob eine öffentliche Web-App darunter fällt und ob Bearbeitungen erlaubt sind, ist ungeklärt. **Meiden** | bestätigt (Nebenquellen) | [Podcaster News](https://podcasternews.com/2018/04/19/bbc-released-16000-sound-effects), [PRS for Music](https://www.prsformusic.com/m-magazine/news/bbc-releases-sample-library-with-thousands-of-sound-effects) |
| Pixabay | kommerziell, ohne Nennung; unverändert weitergeben ist verboten; keine Garantie für die Rechte (manche Hochlader stellen Fremdes ein); AGB vom 20.10.2026 | nachgelesen (Auszug) | [Pixabay Terms](https://pixabay.com/service/terms/) |
| **Sonniss #GameAudioGDC** | kostenlos, kommerziell, ohne Nennung; seit 2024 mit KI-Trainingsverbot; Lizenz 2026 nicht gelesen | bestätigt (ältere Jahrgänge) | [gamefromscratch](https://gamefromscratch.com/sonniss-27-5gb-sound-effect-giveaway-at-gdc-2024/), [rekkerd 2026](https://rekkerd.org/sonniss-releases-gdc-2026-game-audio-bundle/) |
| ElevenLabs-Geräusche | im Free-Plan nur mit Nennung bzw. laut Hilfe-Center gar nicht kommerziell; auf Bezahlplänen frei | nachgelesen (Auszug) | [Commercial](https://elevenlabs.io/sound-effects/commercial), [Help Center](https://elevenlabs.io/docs/help-center/legal/can-i-publish-the-content-i-generate-on-the-platform/llms.txt) |
| Eleven Music | Bezahlpläne schließen „Studio Games“ aus; ob ein kostenloses Schulspiel darunter fällt, ist unklar | nachgelesen (Auszug) | [Bedingungen](https://elevenlabs.io/de/eleven-music-model-specific-terms) |
| Kenney Audio (CC0), Freesound (je Datei CC0/BY/BY-NC), incompetech (CC BY 4.0), YouTube Audio Library (nur für YouTube) | in dieser Runde nicht nachgelesen | unsicher | [kenney.nl](https://kenney.nl/assets?q=audio), [Freesound-FAQ](https://freesound.org/help/faq/#licenses), [incompetech](https://incompetech.com/music/royalty-free/licenses/) |
| **Lautheit** | für tragbare Geräte −16 bis −18 LUFS, Spitze höchstens −1 dBTP; −23 LUFS (Rundfunk) ist zu leise | bestätigt | [Audiokinetic](https://audiokinetic.com/en/mastering-a-game-with-wwise-part1), [Meta](https://developers.meta.com/vr/documentation/unreal/audio-loudness-meter-overview/) |
| ffmpeg `loudnorm` in zwei Durchgängen | erst messen, dann linear angleichen, so „pumpt“ nichts | nachgelesen (Auszug) | [Google Developers](https://developers.google.com/assistant/tools/audio-loudness?hl=en) |
| Formate in Safari | Opus/Ogg erst ab iOS 18.4, WebM-Opus uneinheitlich; **MP3 bleibt** | bestätigt (dass es uneinheitlich ist) | [WebKit 245428](https://bugs.webkit.org/show_bug.cgi?id=245428), [Apple-Forum](https://developer.apple.com/forums/thread/775937) |

**Folgerung:**
- **Quellen:** Für Burg, Feuer, Raben, Türen und für den Lärm von Piccadilly genügen Kenney, Freesound mit dem Filter CC0 und Sonniss. Musik am sichersten CC0, sonst CC BY mit Nennung auf einer Info-Seite.
- **Lautstärke:** Die Sprache etwa 2 LU lauter als die Atmosphäre des Raums.
- **Werkzeuge:** ffmpeg-normalize (MIT, unsicher) und audiosprite (fasst viele kurze Töne zu einer Datei zusammen, MIT, unsicher) passen zu unserem Skript-Muster „erst zählen, nie überschreiben“.

## 7 Vorbilder: Bruno Simon zum Auseinandernehmen, A Short Hike fürs Gefühl

| Vorbild | Was wir lernen | Lizenz / Zugang | Stand | Quelle |
|---|---|---|---|---|
| **Bruno Simon folio-2025** | Three.js mit **Blender-Dateien**, Export-Voreinstellungen mit Palette, Instanzen, Verkleinern mit gltf-transform + KTX. Der Weg lässt sich fast 1:1 übernehmen | MIT, alles auf GitHub | nachgelesen | [GitHub](https://github.com/brunosimon/folio-2025), [Awwwards](https://www.awwwards.com/brunos-portfolio-case-study.html) |
| **DOGWALK** (Blender Studio) | Arbeitsweise auf der Blender-Seite. Es ist aber ein **Godot-4.4-Spiel**; das Quellpaket ist CC BY, die Skripte MIT; es gibt es **nur im Abo oder im Steam Supporter Pack**, und zwar **ohne** die .blend-Dateien | CC BY / MIT | bestätigt | [itch.io](https://blenderstudio.itch.io/dogwalk), [Blender Studio](https://studio.blender.org/projects/api/assets/8119/) |
| Sketchbook (swift502) | Kamera hinter der Figur, Zusammenstoß mit einer Kapsel; seit 2024 archiviert; kein Hingehen per Antippen | MIT | nachgelesen | [GitHub](https://github.com/swift502/Sketchbook) |
| A Short Hike | einfache Modelle mit Paletten-Texturen, niedrige Auflösung, Farbstimmung; „kleine offene Welt“ | nur ansehen | unsicher | [itch.io-Beitrag](https://itch.io/post/1081459) |
| Lil Gator Game | von A Short Hike beeinflusst; keine Technik-Beschreibung gefunden | nur ansehen | nachgelesen (Auszug) | [Siliconera](https://www.siliconera.com/?p=943344) |
| Messenger (abeto) | Three.js-Webspiel auf einem winzigen Planeten; kein Quellcode gefunden | nur ansehen | unsicher | [80.lv](https://80.lv/articles/deliver-mail-on-tiny-colorful-planet-in-this-relaxing-web-game) |

**Zu GTA:** Kein Vorbild zeigt, dass Größe nötig ist. Alle kleinen offenen Welten leben von Dichte und Neugier. Das ist genau die „Sandbox in Stücken“ der Vision.

## 8 Arbeitsweise: erst mit Platzhaltern, Namen als Vertrag, feste Budgets

Was in den Quellen belegt ist:
- **Erst das Spiel mit Platzhaltern** in Three.js bauen und die schönen Modelle später einwechseln ([best-games.io](https://best-games.io/blog/codex-claude-code-blender-mcp-game-development-guide), Ratgeber, mittlere Qualität, nachgelesen). So machen wir es schon: 3D-Probe, dann Gary.
- **Modelle nur über Skripte mit Versionen**, nie von Hand.
- **Objektnamen als Vertrag** zwischen Blender und Code. Unsere Kennungen wie `raum_decke` und `braue_l` sind genau das.
- **Feste Grenzen** für Größe und Zeichenaufrufe.
- **Echte Bildpunkte prüfen** statt zu früher Screenshots ([blender-web-3d-skill](https://github.com/czlonkowski/blender-web-3d-skill), nachgelesen).

Für das Testprogramm ohne Grafikkarte:
- Chromium mit SwiftShader oder Mesa llvmpipe (beides rechnet die Grafik auf dem Prozessor nach).
- Erst nach einem „fertig“-Signal und ein paar Bildern fotografieren.
- WebKit zeigt die Zeichenfläche teils nicht im Screenshot.
- Stand: bestätigt, die Schalter selbst sind nicht an aktueller Doku geprüft ([microlink](https://microlink.io/blog/webgl-without-a-gpu), [Playwright-Setup](https://barthpaleologue.github.io/Blog/posts/webgl-webgpu-playwright-setup)).
- Wichtig: Software-Grafik prüft nur „lädt, keine Fehler, Bild nicht leer“, **nie die Bildrate**.

Gefahr, die die Ratgeber nennen: Bei MCP mit Codeausführung können präparierte Modelle oder Szenen Befehle einschmuggeln ([best-games.io](https://best-games.io/blog/codex-claude-code-blender-mcp-game-development-guide)). Deshalb öffnen wir nur Dateien aus geprüften Quellen.

Zwei Regeln, die aus allem folgen (abgeleitet):
- **Eine gemeinsame Paletten- und Material-Datei** als Skript-Baustein für alle Räume, Kapitel und Apps (EN6, EN9, FR). So bleibt der Stil gleich.
- **Prüfbilder aller Räume nebeneinander**, damit sich der Stil nicht schleichend verschiebt.

---

## Grenzen dieser Recherche

Das Cloud-Netz hat viele Originalseiten gesperrt. Deshalb beruhen etliche Angaben auf Auszügen aus Suchtreffern, auf Spiegeln (OpenGameArt, Godot-Bibliothek, GDevelop) oder auf Nebenquellen. **Gesperrt waren:** blender.org, docs.blender.org, projects.blender.org (teilweise), mcp.directory, strayspark.studio, quaternius.com, itch.io (kaylousberg.itch.io, quaternius.itch.io, blenderstudio.itch.io), kaylousberg.com, kenney.nl, helpx.adobe.com, huggingface.co, www.tripo3d.ai, www.sloyd.ai, app.cinevva.com, threejs.org, gltf-transform.dev, pixabay.com, elevenlabs.io, sound-effects.bbcrewind.co.uk, 80.lv. GitHub und raw.githubusercontent.com gingen.

Nicht gefunden wurden: eine feste Speichergrenze für Safari auf iPadOS 26 · die genaue Bewegungsliste und das Skelett des KayKit-Zusatzpakets · die Lizenz der UniRig-Modelldaten · aktuelle Preise und AGB von Tripo und Sloyd · eine Forced-Alignment-Schnittstelle bei ElevenLabs · ein freies Zootier-Paket · Erfahrungsberichte von Einzelentwicklern mit Claude + Blender + Three.js und Zahlen auf schwacher Hardware.

**Für eine zweite Prüfung freizugeben** (Netzwerk der Umgebung, nur lesen): `kaylousberg.itch.io`, `quaternius.com`, `kenney.nl`, `huggingface.co`, `gltf-transform.dev`, `threejs.org`, `elevenlabs.io`, `www.tripo3d.ai`, `freesound.org`, `docs.blender.org`. Alternativ prüft der lokale Chat auf AlexPC diese Seiten im Browser.

---

## Auf AlexPC auszuprobieren (lokaler Chat, je 10–30 Minuten)

Installationen (uv, Rhubarb, KTX-Software, KI-Modelle) brauchen jeweils dein OK vorher (Regel vom 15.11.).

1. **Treiber erneuern** (Grafikkarte ist bekannt: RX 6500 XT, 4 GB): aktuellen AMD-Adrenalin-Treiber für die RX 6500 XT von amd.com installieren (dein OK vorher, Neustart nötig). Nicht 26.5.1; macht der neueste Ärger mit Blender, 26.3.1 nehmen. Danach in Adrenalin die Versionsnummer notieren, dazu `blender --version`.
2. **HIP prüfen und vergleichen:** Bearbeiten → Einstellungen → System → „Cycles Render Devices“ → HIP. Erscheint „AMD Radeon RX 6500 XT“? HIP RT zuerst aus lassen. Dann den Guard Room dreimal einbrennen und die Zeiten notieren: (a) Prozessor wie bisher, (b) Grafikkarte, (c) Grafikkarte mit halb so vielen Samples plus Entrauschen und Einbrenn-Bildern 2048 statt 4096. Bildchen von (a) und (c) nebeneinander ansehen. Läuft (b) mit „Out of memory“ ab, ist der Speicher zu klein.
3. **KayKit Character Animations** laden: Sind die Knochennamen gleich wie bei Mage, Knight, Barbarian und Rogue? Wie viele Bewegungen sind es wirklich? Die Lizenzdatei im Zip lesen.
4. **Rhubarb** an fünf Gary-Aufnahmen: `rhubarb -f json -d gary.txt --extendedShapes GHX gary.wav -o gary.json` (vorher MP3 → WAV mit ffmpeg). Mit dem jetzigen „Mund folgt der Lautstärke“ vergleichen.
5. **Prüfbilder ohne Fenster:** `blender -b -P` mit drei festen Kameras, Cycles, 480 × 270, 32 Samples; die Zeit messen.
6. **MCP for Blender** (falls gewünscht): neueste Fassung, `DISABLE_TELEMETRY=true`, nur Poly Haven. Liefert `look` ein Bild, auf dem Claude den Fehler „Kopf dreht in den Körper“ erkennt?
7. **Stilprobe Hof:** aus dem Quaternius MegaKit drei Wände und ein Dach zu einem Tower-Haus stecken und mit unserer Palette umfärben. Das bekommst du als Bild zum Ansehen.
8. **Kleidung tauschen:** eine Figur mit zwei Oberteilen am selben Skelett exportieren und im Browser umschalten.
9. **Bild-zu-3D (entschieden durch die 4 GB):** nicht lokal auf der Grafikkarte. Zuerst ein **festes Requisit** (Büste oder Vase) auf der Hugging-Face-Seite von TRELLIS.2 oder Stable Fast 3D oder bei Meshy/Tripo ausprobieren; für eine ganze Serie eine gemietete RTX 4090 (nach deinem OK). Wer neugierig ist: Stable Fast 3D mit `SF3D_USE_CPU=1` auf dem Prozessor, nur um die Dauer zu sehen. Danach erst ein Tier.
10. **Ein Quaternius-Tier** als glTF laden: wie sind Skelett und Bewegungen aufgebaut? Vorlage für einen Skript-Pinguin.

**In der Cloud möglich (ohne AlexPC):**
- `npx @gltf-transform/cli inspect` und danach `optimize … --compress meshopt --texture-compress webp --texture-size 2048 --simplify false` auf eine Kopie von `guardroom.glb`. Größe und Aussehen vergleichen; prüfen, ob die Objektnamen erhalten bleiben.
- Die verkleinerte Datei im Testprogramm laden (MeshoptDecoder, ggf. KTX2Loader in `lib/`) und `renderer.info` in allen drei Formaten mitschreiben.
- Rhubarb für Linux an denselben Gary-Aufnahmen laufen lassen.
- ffmpeg-loudnorm, erster Durchgang, über 10 Aufnahmen: Wie stark streut die Lautstärke?
- bpy 5.3 testen (braucht Python 3.13, vorher fragen). Damit könnte die Cloud das Licht auch selbst auf dem Prozessor einbrennen; die Zeit mit den 7 Minuten von AlexPC vergleichen.

**Für dich am Gerät (je 5 Minuten):** auf dem iPad die alte und die neue Raumdatei je dreimal laden: Kommt „Context lost“ oder ein Absturz? Dabei die iPadOS-Version notieren. Auf dem ProBook die Bildrate alt gegen neu vergleichen und ein Foto von `chrome://gpu` machen.

---

## Berichtigungen zu werkzeuge-empfehlungen.md

**Grundentscheidungen:** „Technik bleibt“ ergänzen um „WebGLRenderer, nicht WebGPU; neu prüfen Ende 2027“. „Vorbild GTA“ ergänzen um: Belegt ist, dass Freiheit aus Dichte kommt (A Short Hike); technisch heißt das: in Stücken laden, jede Schlüsseltür ist eine Ladegrenze.

**Reverse Engineering:** DOGWALK ist ein **Godot-4.4-Spiel**, kein Three.js-Projekt. Das Quellpaket ist CC BY 4.0, die Skripte MIT, beides gibt es **nur im Blender-Studio-Abo oder im Steam Supporter Pack**, und zwar **ohne** die .blend-Dateien der Modelle und Level (nicht nur „Blender-Originale für Abonnenten“). Als bestes erlaubtes Vorbild ergänzen: **Bruno Simon folio-2025** (MIT, Three.js, mit Blender-Dateien).

**Zeile 1 BlenderMCP:** heißt seit Sept. 2026 „MCP for Blender“ (`uvx mcp-for-blender`, unsicher). Ergänzen: 3 Sicherheitslücken 2026, Verbindung ohne Passwort, also nur auf dem eigenen Rechner; Telemetrie ist standardmäßig an (abschalten); nur eine Instanz. Hyper3D, Sketchfab, Meshy, Tripo und Hunyuan in MCP sind nicht frei, nur Poly Haven nutzen. Ein offizieller MCP von Blender Lab (ab 5.1) existiert, Einzelheiten unsicher. Gleichwertiger Ersatz ohne Einrichtung: Prüfbilder ohne Fenster.

**Zeile 2 Rhubarb:** „quelloffen“ → **MIT** (nachgelesen). „nicht nachgeprüft“ → nachgeprüft: 6 + 3 Mundformen (A–F, G, H, X), JSON, liest nur WAV/Ogg, läuft auch unter **Linux**, also auch in Cloud-Chats. Englisch gut, Französisch nur „phonetic“.

**Zeile 3 Poly Haven, ambientCG:** Poly Haven bleibt richtig (CC0). ambientCG wurde in dieser Runde nicht nachgelesen. Ergänzen: Bausätze **Quaternius MegaKit, KayKit Furniture/Medieval Builder, Kenney Train/City Kit** (alle CC0) als umgefärbte Requisiten, fällig bei Block C.

**Zeile 4 bpy:** genauer: 5.3.0 vom 10.11.2026, **nur Python 3.13**, etwa 430 MB, GPL. Ohne Grafikkarte nur **Cycles auf dem Prozessor** sicher, Eevee nicht. Neu: AlexPC hat eine AMD RX 6500 XT (4 GB); Blender findet sie wahrscheinlich wegen des alten Treibers nicht – Treiber erneuern, HIP einschalten (Nachtrag, Proben 1–2).

**Zeile 5 Quaternius UAL:** „über 120“ gilt für UAL 1, davon nur 45 kostenlos. UAL 2 (Feb. 2026): über 130, etwa 70 % kostenlos. **Vorher kommt das kostenlose KayKit-Zusatzpaket „Character Animations“ mit 133 Bewegungen (CC0)**, das wahrscheinlich ohne Übertragen passt. Die 76 Bewegungen der Adventurers-Datei sind richtig gezählt, es sind nur nicht alle verfügbaren. Übertragen, falls nötig, in Blender (Rokoko, „Retarget“), nicht mit `retargetClip`.

**Zeile 6 Bild-zu-3D:** **Hunyuan3D-2 streichen**: Die Lizenz gilt nicht in der EU, also auch nicht in Deutschland. Ersatz: TRELLIS/TRELLIS.2 (MIT, 16 bzw. mindestens 24 GB, TRELLIS.2 nur Linux), Stable Fast 3D (Stability Community), TripoSR/SG (MIT, 6–8 GB), Step1X-3D (Apache 2.0); online Meshy/Tripo (gratis als CC BY 4.0 mit Nennung, Bezahlmonat 16–20 $). UniRig: Code MIT, Lizenz der Modelldaten offen, mindestens 8 GB, eher Linux. Erste Probe besser ein **festes Requisit** statt eines Tiers. Einsatzgebiet: Museumsstücke, nicht Figuren.

**Zeile 7 ElevenLabs-Zeitstempel:** Die Quelle durch die offizielle Doku ersetzen (`/with-timestamps`, Felder `character_start_times_seconds`). Ergänzen: wichtig vor allem für **FR** (dort ist Rhubarb schwach). Ob vorhandene Aufnahmen über „Forced Alignment“ nachträglich Zeiten bekommen können, ist offen. Geräusche aus dem Free-Plan nur mit Nennung bzw. gar nicht kommerziell; Eleven Music schließt „Studio Games“ aus.

**Zeile 8 Effekseer:** Es gibt einen WebGL-Player mit eigenem WASM (unsicher). Die Alternative three.quarks ist lizenzseitig ungeprüft. „Vorerst selbst programmieren“ bleibt richtig.

**Zeile 9 Bfxr, rFXGen:** ergänzen um **Kenney Audio (CC0), Freesound nur mit Filter CC0, Sonniss GDC**, Lautheit −16 LUFS mit ffmpeg-loudnorm, MP3 bleibt. Ausdrücklich **nicht**: BBC Sound Effects, YouTube Audio Library.

**Zeile 10 Medieval Fantasy City Generator:** bleibt „nur Plan“. Ergänzen: Für den Tower ist ein eigenes Python-Skript, das Bausätze auf ein Raster setzt, einfacher als Buildify oder SceneCity.

**Neue Zeile ganz oben:** **gltf-transform + Meshopt + KTX2** (MIT). `guardroom.glb` hat 14,7 MB, etwa 297.000 Dreiecke, 2 × 4K-Bilder und braucht geschätzt 290 MB Grafikspeicher. Fällig **vor dem iPad-Test**, nicht erst in E. Fallen: `simplify` verschiebt eingebranntes Licht, `flatten/prune/palette` löschen Namen.

**„Nicht für uns“ ergänzen:** Ready Player Me (abgeschaltet seit 31.1.2026) · Mixamo (Weitergabe der Rohdatei verboten, Schul-Konten ausgeschlossen) · TalkingHead (nur als Code-Vorbild) · Physik-Engines und Nachbearbeitungs-Effekte · Poly-Pizza-Modelle nur einzeln (meist CC BY) · „Editorial only“-Modelle. MPFB/MakeHuman: Die Ausgaben wären CC0, die Begründung „nicht unser Stil“ bleibt.

**Lernquellen ergänzen:** `czlonkowski/blender-web-3d-skill` (MIT) · folio-2025 · der Vortrag „Making of DOGWALK“ ([media.ccc.de](https://app.media.ccc.de/v/godotfest2025-making-of-dogwalk-blender-studio-s-game-project/audio)).

**Lücken:** „Dateien verkleinern“ ist beantwortet (siehe oben). Neu offen: der Speicher des iPads (messen) und ein freies Zootier-Paket (Entscheidung später: selbst bauen per Skript, oder ein Kaufpaket, dessen Lizenz für öffentliche Web-Apps vorher schriftlich geprüft ist).

**Quellen:** wavespeed.ai durch die offizielle ElevenLabs-Doku ersetzen. Vermerken: quaternius.com, itch.io, kenney.nl und helpx.adobe.com waren in der Cloud gesperrt.
