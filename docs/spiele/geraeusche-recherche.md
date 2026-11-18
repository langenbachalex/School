# Geräusche für die Story-Spiele – Recherche 18.11.2026

Lieber Mr. Alex, hier steht, welche Geräusche „The Keys of the Tower“ braucht (Figuren, Orte, Gegenstände, Rückmeldung an das Kind), woher wir sie frei und lizenzsicher für eine öffentliche Schul-App bekommen und wie wir sie im Browser so einsetzen, dass die Welt lebt. Musik bleibt draußen. Die Recherche baut auf `werkzeuge-recherche.md` Abschnitt 6 auf und wiederholt ihn nicht; wo sie ihn berichtigt, steht das am Ende.
**Grenze:** Viele Originalseiten waren im Cloud-Netz gesperrt, deshalb beruhen viele Angaben nur auf Auszügen aus Suchtreffern. Gesperrt waren: asoundeffect.com, fmod.com, audiokinetic.com, gamedeveloper.com, 99percentinvisible.org, substack.com, sonniss.com, pixabay.com, zapsplat.com, mixkit.co, elevenlabs.io, freesound.org, threejs.org, developer.mozilla.org, webkit.org, akolytagame.com, blog.criware.com, discovery.ucl.ac.uk. **Nichts wurde ausprobiert, nichts angehört.**

Kennzeichnung: **nachgelesen** = eine Quelle, oft nur ihr Suchauszug · **bestätigt** = mehrere Quellen stimmen überein · **unsicher** = eigene Folgerung, Widerspruch oder nur Vorwissen.
Blöcke der Vision (Abschnitt 10): A Figuren · B Spiel in den 3D-Raum · C Hof und Auftakt · D Umziehen und Sammeln · E Feinschliff · „später“ = weitere Kapitel.
Baustopp bis 25.11.: Alles hier sind Pläne und kleine Proben.

---

## Was wir jetzt tun sollten (nach Nutzen geordnet)

| # | Was | Was es bewirkt | Aufwand | Kosten | Lizenz | Risiko | Block |
|---|---|---|---|---|---|---|---|
| 1 | **Lizenzregel fürs offene Repo festschreiben:** selbst gemacht oder CC0 zuerst, CC BY nur mit Nennung auf einer Info-Seite, sonst nichts. Pixabay, Mixkit, Zapsplat, BBC und London Sound Survey kommen nicht ins Repo, Sonniss nur stark bearbeitet. Je Tonordner eine `QUELLEN.md` | Kein Ärger mit Rechten, obwohl jeder die Rohdateien aus dem öffentlichen Repo laden kann | klein | 0 € | – | Ein CC0-Etikett beweist nicht, dass der Hochlader die Rechte hat | **sofort**, vor dem ersten Ton |
| 2 | **Eigenes kleines Klang-Modul** (etwa 150–250 Zeilen, keine Bibliothek): ein einziger AudioContext, Töne per `fetch` als AudioBuffer geladen, vier Lautstärke-Schienen (Stimmen, Rückmeldung, Gegenstände, Umgebung), ein Sicherheitsbegrenzer, Absenken der Umgebung unter der Stimme | Alle Lautstärken lassen sich regeln, auch auf dem iPad; Schritte setzen ohne Verzögerung ein; Raumklang und Richtung sind möglich | mittel | 0 € | eigener Code; Three.js-Klassen sind schon dabei | Eigenheiten von iPad-Safari (Abschnitt 5) | **B** (früh), Grundlage für alles Weitere |
| 3 | **iPad-Probe zur Lautstärke von Tondateien** (Hinweis unten in 5.1) | Klärt, ob das Leiserdrehen von Tondateien auf den Schul-iPads heute überhaupt wirkt | klein | 0 € | – | Braucht ein iPad und eine erreichbare Probeseite | **vor B** |
| 4 | **Schritte an die Bewegung koppeln:** je Gang eine Zeittabelle „Fuß setzt auf“, je Boden 4–6 Varianten, Tonhöhe leicht zufällig, nie zweimal dieselbe Datei hintereinander | Jede Figur klingt wie sie geht: Gary trippelt, der Sergeant marschiert, Arthur hüpft. Kinder hören, wer kommt | klein bis mittel | 0 € | – | Beim Überblenden von Gehen zu Rennen können Schritte doppelt kommen | **A** (Gang), **B** (Einbau) |
| 5 | **Laute ohne Worte selbst aufnehmen** (Mund-Geräusche wie bei der Gans in „Untitled Goose Game“): je Figur 5–8 Laute (Lachen, Erschrecken, Anstrengung, „Hmm“, stolzes „Hah“, beleidigt), dazu Zauber-„Pop“, Gurren, Raben-„Kraa“ | Eigene Rechte, eigener Stil, die Kinder hören ihren Lehrer; ersetzt nie die englische Sprache | klein bis mittel | 0 € (Handy, Audacity) | eigenes Werk, kann unter CC0 ins Repo | Hall und Rauschen im Raum, braucht eine ruhige Ecke | **A** |
| 6 | **Rückmeldung ohne Lern-App-Piepen festlegen:** Die Welt antwortet. Richtig = Figur lobt und eine Tür geht auf; falsch = kein Summer, sondern eine freundliche Reaktion mit Hinweis; ein Schlüssel-Klang als Markenzeichen des Spiels | Nie Frust (Säule 5); die Information steckt in den Worten der Figuren | klein (Planung) | 0 € | – | Zu viele „Funkel“-Töne nutzen sich ab | **B** |
| 7 | **Kenney-Pakete laden** (Interface Sounds, RPG Audio, Impact Sounds) | Türen, Schlüssel, Münzen, Bücher, Stoff, Schritte als sofort nutzbare Grundausstattung | klein | 0 € | CC0 (bestätigt für Interface, nachgelesen für RPG) | Stil passt evtl. nicht überall, Klang ungeprüft | **B/C** |
| 8 | **ZzFX für Funkeln, Zauber und Notizbuch** (winziger Klang-Erzeuger im Code, eine Zahlenzeile je Klang, keine Datei) | Gary-Zauber, Mr.-Flex-Glanz, Notizbuch-Karte ohne Lizenzfrage und ohne Ladezeit | klein | 0 € | MIT (bestätigt) | Rein künstliche Töne klingen nach 8-Bit-Spiel; weich machen und etwas Hall | **A/D** |
| 9 | **Raumklang je Ort:** zwei leise Grundgeräusche unterschiedlicher Länge, dazu 4–8 zufällige Einzelgeräusche, Nachhall je Raum (im Code erzeugt), Uhr-Ticken per Code | Hof, Wachstube und Den klingen verschieden und lebendig, ohne hörbare Schleife | mittel | 0 € | Freesound CC0 je Datei prüfen, sonst selbst aufnehmen | Zu viel Geräusch macht müde; bei MP3-Schleifen entstehen Lücken (5.3) | **C** (Hof), **E** (Feinschliff) |
| 10 | **ElevenLabs-Geräusche nur gezielt** für das, was man weder aufnehmen noch frei findet (später etwa der einfahrende Tube-Zug); nur auf dem Bezahlplan, Credits vorher auszählen | Schließt Lücken, ohne die Sammlung zu bestimmen | klein | Credits: 40 oder 11 je Sekunde (widersprüchlich, 4.5) | kostenlos nur nicht-kommerziell mit Nennung, bezahlt frei; Rohdatei-Frage offen | Kosten unklar; Aufruf nur mit deinem OK im Bau-Chat | **später** |

**Bewusst nicht auf der Liste:** keine Klang-Bibliothek (howler.js, Tone.js), keine Musik, keine Lautsprache aus Kauderwelsch statt Englisch, keine Original-Ansagen der Tube.

---

## 1 Figuren-Geräusche

### 1.1 Schritte
- Pro Boden **mindestens drei** Dateien, sonst klingt es eintönig; viel Tonhöhen-, wenig Lautstärke-Schwankung; Zufallsliste ohne direkte Wiederholung – [GameDev Academy, FMOD Teil 2](https://gamedevacademy.org/hey-listen-sound-design-with-unity-fmod-part-2/) (nachgelesen).
- Tonhöhe höchstens etwa **±10 %**, sonst „klingt es wie ein anderes Wesen“ – [uhiyama-lab](https://uhiyama-lab.com/en/notes/ue/sound-cue-vs-sound-wave-best-practices/), [Unity-Forum](https://discussions.unity.com/t/foot-step-audio-randomize-pitch/26725) (bestätigt).
- Schritte werden von der Bewegung ausgelöst, je Fuß ein Ereignis auf dem Bild, in dem der Fuß aufsetzt – [bugnet](https://bugnet.io/blog/how-to-fix-footsteps-out-of-sync-with-animation), [CryEngine](https://www.cryengine.com/docs/static/engines/cryengine-5/categories/23756816/pages/44964889), [Animancer](https://kybernetik.com.au/animancer/docs/examples/events/footsteps) (bestätigt).
- Untitled Goose Game: Gänseschritte mit einem Gummihandschuh auf verschiedene Flächen geklatscht; Stoff und Schritte je Bewegung selbst aufgenommen – [A Sound Effect](https://asoundeffect.com/untitled-goose-game-sound/), [arts.ac.uk](https://hypophysis.myblog.arts.ac.uk/?p=385) (bestätigt, beide als Auszug).
- Animal Crossing macht den Boden über Schritte so deutlich, dass blinde Spieler sich zurechtfinden – [Audiokinetic](https://www.audiokinetic.com/en/blog/animal-crossing-is-playable-by-the-totally-blind) (nachgelesen, nur Titel und Auszug).
- **Für uns (unsicher, eigene Folgerung):** Böden Kopfstein (Hof), Steinboden (Wachstube, Treppe), Holzdielen (Den), Gras (Rabengehege), Kies (Wege). Schuhtypen: Stiefel (Sergeant hart und gleichmäßig, nur ±3 % Schwankung, damit der Marsch mechanisch klingt; Mr. Flex lang, Ferse zuerst), weiche Schuhe (Kinder), Pfoten (Gary: weich mit kleinem Krallen-Tick auf Stein, schnell), Vogelfüße (Arthur hüpft mit beiden Füßen = ein dumpfer Doppelschlag; Taube winzige schnelle Ticks). Der Sergeant „geht schnell“ mit derselben Datei im doppelten Takt – der Witz wird hörbar. Für Werte zu Cartoon- oder Pfotenschritten gibt es keine Quelle.

### 1.2 Gesten, Zaubern, Funkeln, Slapstick
- Funkeln: Für einen einzelnen Lichtpunkt (Zahnblitzen) passt **ein heller „Ding“**, für einen Schimmer viele kleine Glöckchen; der hellste Moment muss genau auf dem Bild liegen, in dem das Licht aufblitzt; ein großer Schimmer unter einem kurzen Blitz wirkt übertrieben – [Morphic Funkeln](https://morphic.com/resources/sounds/cartoon-sparkle-sound-effects), [Morphic Schimmer](https://morphic.com/resources/sounds/shimmer-sound-effects) (unsicher, Werbeseiten eines KI-Anbieters, aber einleuchtend).
- Ein kleiner Zusatzton erzählt Geschichte: Bei der Gans gibt es einen Knopfdruck-Ton, damit sie das Funkgerät absichtlich bedient – [A Sound Effect](https://asoundeffect.com/untitled-goose-game-sound/) (nachgelesen).
- Die Gans klingt trotz Cartoon-Bild „ziemlich realistisch“: Der Stil ist frei, wichtig ist, dass er einheitlich bleibt – [gameplay.co](https://gameplay.co/untitled-goose-game-music-sound-design/) (nachgelesen).
- Die klassischen Cartoon-Geräusche (Warner, Hanna-Barbera) stammen von Treg Brown bzw. aus der Hanna-Barbera-Sammlung, die heute kommerziell verkauft wird – [Wikipedia](https://en.wikipedia.org/wiki/Treg_Brown), [Sound Ideas](https://portal.sound-ideas.com/Product/409/Hanna-Barbera-Sound-Effects-Library) (bestätigt bzw. nachgelesen). Für uns: nachmachen, nicht kopieren (unsicher).
- **Bedarfsliste je Figur (unsicher, eigene Folgerung aus dem Profil in `keys-of-the-tower-figuren.md`):**

| Figur | Geräusche | Erkennungston |
|---|---|---|
| Gary | kurzes Umhang-Wusch, „Ta-daa“-Zauber = Funken + Pop, schiefer Zauber = derselbe Anfang, endet im absteigenden Zischen und Puff, Erschrecken = schnelles „Boing“, Bauchknurren, Sandwich aus dem Hut = Stoff + Pop | viele kleine, hohe, kurze Töne |
| Mr. Flex | großes Wusch für Kick und Reiterstand (Stoff-Schnalzen + Stampfen), Bizeps-Knarzen, Augen- und Zahnglanz = ein heller Ding, Zauberstab wirbeln + Klappern beim Fallen, Sonnenbrille Klick, Teetasse | der „Bling“-Ding |
| Sergeant | Stiefel-Klack, Salut = Stoff + Hackenknall, wippender Fuß, Fellmütze fällt = weiches „Flump“, rote Ohren = kleiner Pfeifkessel-Ton | Hackenknall |
| Arthur | langsamer einzelner Flügelschlag, Federn plustern, Verschwinden = leises „Fwip“, selten ein tiefes Krächzen | Stille und ein Krächzen |
| Taube | schnelles Flattern, Picken an der Scheibe, Gurren | Gurren |
| Slapstick | KLONG (Helm, Rüstung), Bonk, Hut fällt, Rutschpfeife beim Fallen – sparsam | – |

- Zauber in Schichten (unsicher): Wusch (Geste) + Knistern (Funken) + ein Ding (Erfolg). Weil der Fehlschlag gleich beginnt, erkennt man ihn als Garys Zauber.

### 1.3 Laute ohne Worte
- Drei bekannte Muster (bestätigt): **Animal Crossing** reiht kurze Silben-Schnipsel schnell aneinander, Tonhöhe je Figur – [UX Collective](https://uxdesign.cc/animal-crossing-delight-by-design-e2c0a1a4d462), [itch.io](https://geolojosh.itch.io/goodlands/devlog/314373/how-to-animal-crossing-dialogue-sounds); **Banjo-Kazooie** wenige Murmel-Aufnahmen, aus Speichernot geboren – [Game Developer](https://gamedeveloper.com/audio/how-i-goldeneye-i-s-composer-used-tech-limitations-to-create-an-iconic-sound) (nachgelesen); **Celeste** je Figur ein künstlicher Ton, der wie Vokale verformt wird – [Shacknews](https://shacknews.com/article/125697/devs-share-insight-into-celestes-dialogue-design-process), [TheGamer](https://www.thegamer.com/celeste-sound-designer-reveals-how-the-games-dialogue-audio-was-created/).
- **Wind Waker:** Link sagt nur wenige Wörter, sonst Ächzen und Ausrufe – [Zelda Universe](https://zeldauniverse.net/features/the-sound-of-silence-how-link-has-communicated-across-the-generations/) (bestätigt).
- **Für uns (unsicher):** Unser Spiel hat echte englische Stimmen, das ist Lernziel. Kauderwelsch darf sie nie ersetzen. Laute ohne Worte nur für Reaktionen (Gary „Hmpf“, „Hehe“; Sergeant „Hrrm!“; Taube gurrt; Arthur krächzt), Nebenfiguren und kurze Laute beim Gehen. Das Wind-Waker-Modell passt: 5–8 Laute je Figur.

### 1.4 Stil und Kinder
- Bei Kinderspielen wiederholt sich alles 30-mal und öfter, und Eltern erleben das Spiel vor allem über den Ton – George Sanger, [Game Developer](https://www.gamedeveloper.com/audio/the-sound-of-money-down-the-potty-common-audio-mistakes-in-kids-games) (nachgelesen, alt). Laute Lieblingsgeräusche von Kindern sind nicht automatisch gut – [Game Developer](https://www.gamedeveloper.com/art/getting-making-game-music-that-fits-comparative-music-series-kids-vs-kids) (nachgelesen).
- „Nerv-Wert“ als Prüfliste für häufige Geräusche (Schritte, Türen): zwischen Langeweile und Wiedererkennen – [A Sound Effect](https://asoundeffect.com/game-audio-immersion/) (nachgelesen).
- **Für uns (unsicher):** Übertreiben nur dort, wo das Bild übertreibt (Garys Sprung, Flex' Glanz, Slapstick); Alltagsgeräusche leise und weich. Keine plötzlichen lauten Spitzen, Erschrecken = komisches „Boing“, kein Schrei. Echte Rabenrufe können unheimlich klingen: selten als Akzent, nie als Schleife.

---

## 2 Umgebung

### 2.1 Aufbau eines Ortes
- Grundgeräusch (leiser „Raumton“) plus zufällige Einzelgeräusche; ein schlicht wiederholter Raumton fällt auf, deshalb in Stücke schneiden und zufällig aneinanderreihen; mehrere Schichten mit **unterschiedlicher Länge**, damit die Summe sich nie hörbar wiederholt – [Designing Sound](https://designingsound.org/2012/11/15/room-tone-emotional-tone-the-importance-of-hearing-ambience), [bugnet](https://bugnet.io/blog/how-to-design-ambient-sound-layers), [Wayline](https://www.wayline.io/blog/game-audio-ambiance-walkthrough) (bestätigt).
- Ein Indie-Spiel (Akolyta, 2026): eine Schleife je Bereich plus **bis zu acht** Einzelgeräusche an zufälligen Stellen mit zufälliger Pause zwischen Mindest- und Höchstwert – [Akolyta](https://www.akolytagame.com/2026/06/behind-the-scenes-building-the-soundscape-of-akolyta/) (nachgelesen, Auszug); CRI: zusätzlich eine Sperrzeit, damit ein Geräusch nicht zu oft kommt – [CRIWARE](https://blog.criware.com/?p=3193) (nachgelesen, Auszug).
- Eine nahe Quelle (Wasserfall) ersetzt das allgemeine Grundgeräusch, statt es zu überlagern – [Roblox](https://create.roblox.com/docs/en-us/resources/beyond-the-dark/sound-design) (nachgelesen).
- **Rezept je Ort (unsicher):** 2 Grundgeräusche (z. B. 23 s und 37 s, keine Vielfachen) + 4–8 Einzelgeräusche alle 4–20 s, Richtung zufällig, Tonhöhe ±5 %, Lautstärke ±3 dB, Sperrzeit. Etwa 3–4 hörbare Schichten gleichzeitig. Die Uhr tickt per Code (Einzelticks, kann auf Stichwort stehenbleiben), nicht als Schleife.

### 2.2 Woran man den Ort erkennt
- 1–2 Erkennungsgeräusche je Ort plus der passende Hall; Stein hallt lang (große Steinkirchen 2–5 s Nachhall) – [commercial-acoustics](https://commercial-acoustics.com/sound-advice/rt60-chart/), [Wikipedia](https://Www.Wikipedia.org/wiki/Room_acoustics) (bestätigt für die Spanne). Ein kleiner Steinraum wie die Wachstube hallt dagegen kurz (unsicher).
- Monument Valley: Die „Miniatur“-Optik führte zu etwas verkleinerten, weicheren Klängen – [MCV](https://mcvuk.com/development-news/heard-about-the-sounds-of-monument-valley) (nachgelesen).
- Big Ben: Viertelglocken Gis–Fis–E–H, Stundenglocke E – [Parlament](https://webtest.parliament.uk/about/living-heritage/building/palace/big-ben/facts-figures/great-bell), [Wikipedia](https://en.wikipedia.org/wiki/Westminster_Quarters) (bestätigt); Aufnahmen klingen eher nach F (unsicher, Widerspruch). Wir bleiben bei E wie im Skill `orts-szenen`. Im Repo liegt schon `app/audio/orte/westminster_chimes.mp3` (gemeinfrei, Wikimedia Commons) – für den Auftakt um Viertel nach neun wiederverwendbar.
- „Mind the gap“ stammt von einem echten Sprecher (Oswald Laurence) – [Wikipedia](https://en.wikipedia.org/wiki/Mind_the_gap), [London Transport Museum](https://ltmuseum.co.uk/blog/mind-gap-story-embankment-stations-announcement) (bestätigt). Also selbst sprechen lassen, nicht kopieren (später, Tube).
- **Klangbild je Ort (unsicher, Vorschlag):**

| Ort | Grundgeräusch | Einzelgeräusche | Erkennung | Hall |
|---|---|---|---|---|
| Hof bei Nacht | leichter Wind, ganz fernes Stadtrauschen | Raben krächzen und flattern, Fahnenseil klirrt, ferne Schiffshupe, Kies unter einem Wachposten | Viertelschlag der Uhr | Freiluft mit kurzem Echo von den Mauern |
| Wachstube | Feuer knistert, leiser Raumton | Holzscheit knackt, Uhr tickt, Stuhl knarrt, Wind am Fenster, Taube gurrt | Uhr und Feuer | kurz und hell (etwa 0,6–1 s) |
| The Den | sehr leiser Raumton, Wind am Dach | Diele knarrt, ferne Raben, Rabe auf der Stange | die Stille: leisester Ort im Spiel | trocken, Holz |
| später: Zoo, Tube, Museum, Piccadilly | siehe Notizen; Tube-Zug, Museumshall 2–3 s, Busse | | | |

### 2.3 Gegenstände, Türen, Schlüssel
- Monument Valley 2: Angetippte Dinge antworten mit Glöckchen und Zwitschern, Untersuchen mit kurzen Tönen – [Audiokinetic](https://audiokinetic.com/en/blog/behind-the-beautiful-sound-of-monument-valley-2-with-todd-baker) (nachgelesen). Professor Layton: Antippen im Hintergrund findet Hinweis-Münzen mit kleinem „Ding“ – [Layton-Wiki](https://layton.fandom.com/wiki/Hints) (nachgelesen).
- Häufige Töne in Datei und Tonhöhe abwechseln – [Audiokinetic UI](https://www.audiokinetic.com/en/approaching-ui-audio-ui-design-perspective-2), [bugnet](https://bugnet.io/blog/how-to-make-ui-sounds-satisfying) (bestätigt).
- **Für uns (unsicher):** Materialklassen statt eines Tons je Ding: Holz klopfen, Metall „tink“, Papier rascheln, Stoff, Glas, Stein – etwa 6 × 3 = 18 Dateien für die 14 Dinge der Wachstube. **Tür verschlossen** = Klinke rüttelt + dumpfes Klonk (kein Summer). **Aufschließen** = Schlüssel rein, zwei Drehungen, Riegel. **Öffnen** = Knarren. **Schlüssel gefunden** = heller Schlüsselbund-Klang, der wiedererkennbarste Ton des Spiels, derselbe beim Haken in The Den. Kuchendose: Deckel + hohles Klopfen (leer). Leiter im Den: Holz und Seil rattern. Ton und Bild höchstens etwa 50 ms auseinander, sonst wirkt Tippen träge (unsicher, Wert ohne Quelle).

---

## 3 Rückmeldung an das Kind

- Kinder verstehen hörbare Fehler-Rückmeldung allein kaum, auch ältere – Gauthier u. a. 2022, Zusammenfassung [UniversityXP](https://www.universityxp.com/research/2026/1/28/i-dont-usually-listen-i-read-how-different-learner-groups-process-game-feedback) (nachgelesen, Nebenquelle). Bloßes „richtig/falsch“ hilft wenig, erklärende Rückmeldung hilft – [Frontiers 2018](https://www.frontiersin.org/articles/10.3389/fpsyg.2018.00444/full) (nachgelesen). Lernspiele loben fast immer, vernachlässigen aber Fehler-Rückmeldung – [Harvard Reach Every Reader](https://reacheveryreader.gse.harvard.edu/review-of-feedback-in-edutainment-games-for-preschoolers-in-the-usa), [UCL](https://discovery.ucl.ac.uk/10041423/1/A%20Critical%20Examination%20of%20Feedback%20in%20Early%20Reading%20Games%20camera%20ready.pdf) (nachgelesen). Diese Studien betreffen jüngere Kinder (unsicher, ob übertragbar auf Klasse 6).
- Effekte können vom Lerninhalt ablenken („verführerische Details“) – [Arif 2017](https://asarif.com/pub/Arif_SMC2017_Correctness_Feedback.pdf) (nachgelesen).
- Stille gehört zu guter Bedienung; häufige Töne müssen leise und abwechslungsreich sein; scharfe Anschläge stören empfindliche Ohren – [Material Design](https://m2.material.io/design/sound/applying-sound-to-ui.html), [CreatorSoundsPro](https://creatorsoundspro.com/the-coming-audio-fatigue-problem-in-modern-games) (bestätigt).
- In der Gans reagiert der Ton auf das, was der Spieler anrichtet – [Game Developer](https://gamedeveloper.com/audio/getting-goosey-with-debussy-creating-an-adaptive-score-for-i-untitled-goose-game-i-) (bestätigt; dort Musik, das Prinzip passt aber auf Geräusche).
- **Rückmelde-Leiter (unsicher, Vorschlag): je seltener, desto größer.**

| Ereignis | Wie oft | Ton |
|---|---|---|
| Tippen auf den Boden | sehr oft | nur die Schritte der Figur, kein Klick |
| Tippen auf ein Ding | oft | leiser Materialklang |
| Tippen ins Leere | oft | Stille |
| Neue Notizbuch-Karte | mehrmals je Szene | weicher Zwei-Ton-Glanz (Glocke in E) + Seite blättern |
| Fundstück, Rabe gefunden | wenige je Szene | Eigenklang des Dings + Rabenruf |
| Richtige Antwort | je Aufgabe | Figur lobt mit Stimme, die Welt ändert sich (Tür, Rabe fliegt) |
| Falsche Antwort | je Aufgabe | **kein Summer**; freundliche Reaktion („Hmm, not quite – look at the clock“) + Feder bzw. „Sorry?“; höchstens ein neutrales leises Holzklopfen |
| Schlüssel gefunden | etwa einmal je Szene | der Schlüssel-Klang, kurz warm anschwellend |
| Kapitel-Ende | selten | in der Zwischensequenz (Glockenschlag, Applaus) |

- Lern-App-Piepen vermeiden wir, indem kein Rückmeldeton ein reiner künstlicher Sinus- oder Rechteckton ist: Alles kommt aus Stoffen der Welt (Glocken, Schlüssel, Holz, Raben). Ein gelöster Raum bekommt ein Geräusch dazu (die Taube beginnt zu gurren, die Raben beruhigen sich) (unsicher).

---

## 4 Quellen und Lizenzen

**Kernpunkt (bestätigt durch mehrere Lizenztexte, Anwendung auf uns unsicher):** Das Repo ist öffentlich, jede Tondatei ist einzeln herunterladbar. Viele „lizenzfreie“ Sammlungen erlauben die Nutzung *im* Spiel, verbieten aber die Weitergabe der Datei „wie sie ist“. Sauber sind nur selbst gemachte, im Code erzeugte, CC0- und CC-BY-Töne.

### 4.1 Sammlungen
| Quelle | Bedingung | Für unser Repo | Stand | Quelle |
|---|---|---|---|---|
| **Kenney** Interface (100 Töne), RPG Audio (50: Metall, Stoff, Buch, Schritte, Knarren, Münzen), Impact | CC0 | **ja** | bestätigt (Interface), nachgelesen (RPG), unsicher (Paketliste) | [kenney.nl](https://kenney.nl/assets/interface-sounds), [GitHub-Spiegel](https://github.com/Calinou/kenney-interface-sounds), [OpenGameArt RPG](https://opengameart.org/content/50-rpg-sound-effects) |
| **Freesound** | Lizenz je Datei (CC0, CC BY, CC BY-NC, alte Sampling+); Filter auf CC0 versteckt CC BY | **nur CC0 oder CC BY**, je Datei prüfen; BY-NC meiden | nachgelesen | [FAQ](https://www.freesound.org/help/faq), [freegamedev](https://freegamedev.net/d/821-freesoundorg-makes-it-easier-to-find-libre-media-now) |
| **OpenGameArt** | je Stück CC0, CC BY, OGA-BY, BY-SA, GPL | nur CC0/BY | bestätigt | [FAQ](https://opengameart.org/content/faq), [CC0-Sammlung](https://opengameart.org/content/cc0-sounds-library) |
| Wikimedia Commons (gemeinfreie Aufnahmen) | je Datei | ja, wie bei `westminster_chimes.mp3` | aus dem Repo, nicht neu geprüft | `app/audio/orte/QUELLEN.md` |
| **Sonniss GDC** | frei, kommerziell, ohne Nennung, KI-Trainingsverbot; laut Forum-Zitat kein Weitergeben „as-is“ | **nur stark bearbeitet** (geschichtet, gemischt), in `QUELLEN.md` vermerken | Nutzung bestätigt, Weitergabe unsicher; Lizenz 2026 nicht gelesen | [itch.io](https://itch.io/post/7585344), [Lizenz 2023 (Spiegel)](https://scrubby.duckdns.org/Sonniss.com%20-%20GDC%202023%20-%20Game%20Audio%20Bundle/License.pdf), [rekkerd 2026](https://rekkerd.org/sonniss-releases-gdc-2026-game-audio-bundle/) |
| Pixabay | kein Weitergeben „standalone“; auch nur zugeschnitten zählt als standalone | **nein** | nachgelesen | [Terms](https://pixabay.com/service/terms/) |
| Mixkit | frei, ohne Nennung, nur im fertigen Werk | **nein** | nachgelesen/unsicher | [mixkit](https://mixkit.co/llm-info/) |
| Zapsplat | Nennung Pflicht, Weitergabe „as-is“ verboten | **nein** | nachgelesen | [FAQ](https://www.zapsplat.com/faq-category/license-and-usage/) |
| BBC RemArc | nur privat, Bildung, Forschung | **nein** | bestätigt | [PRS](https://www.prsformusic.com/m-magazine/news/bbc-releases-sample-library-with-thousands-of-sound-effects) |
| London Sound Survey | CC nicht-kommerziell, Nennung | **nein**, nur zum Anhören als Vorbild | unsicher | [CC-Wiki](https://wiki.creativecommons.org/wiki/London_Sound_Survey) |

### 4.2 Klang-Erzeuger im Code und zum Klicken
- **ZzFX** (Frank Force): MIT, winzig, im Browser; ein Klang ist eine Zahlenzeile im Code – [npm](https://npmjs.com/package/zzfx) (bestätigt). Selbst eingestellte Klänge sind praktisch eigenes Werk (unsicher, keine Quelle zu Rechten am Ergebnis).
- **sfxr-Familie:** sfxr.js laut README gemeinfrei (unsicher) – [unpkg](https://app.unpkg.com/sfxr.js@1.0.0/files/README.md); jsfxr bzw. sfxr.me mit „Pro“-Fassung für ausdrückliche kommerzielle Rechte (unsicher) – [sfxr.me](https://sfxr.me); jfxr als Nachfolger im Browser – [GitHub](https://github.com/ttencate/jfxr). **Bfxr** kommt aus derselben Familie; seine Bedingungen wurden in dieser Runde nicht nachgelesen (unsicher).
- **rFXGen** (raylib, vermutlich zlib) und ChipTone: Bedingungen für das Ergebnis nicht gefunden (unsicher, nur Vorwissen).
- Stil (unsicher): Reine 8-Bit-Töne beißen sich mit einer beleuchteten 3D-Welt. Weich einstellen (wenig Rauschen, kurzer Anstieg) und durch den Raumhall schicken. Gut für Funkeln, Zauber, Notizbuch; nicht für Schritte, Türen, Umgebung.

### 4.3 Selbst aufnehmen (Mund-Geräusche und echte Dinge)
- Vorbild: Die Gans-Hupe wurde aufgenommen und dann wie ein Funkgerät bearbeitet (Klangfilter, Raumantwort, Rauschschicht); Stoffgeräusche selbst aufgenommen – [A Sound Effect](https://asoundeffect.com/untitled-goose-game-sound/), [FMOD-Interview](https://fmod.com/blog/untitled-goose-game-interview) (nachgelesen). Ob die Hupe eine menschliche Stimme war, ist nicht belegt (unsicher).
- **Aufnahme (unsicher, Vorwissen):** ruhige Ecke (Kleiderschrank, Decke über einem Stuhl), Kühlschrank und Heizung aus, Handy 10–20 cm vom Mund, leicht seitlich; 30 s Stille aufnehmen (für das Entrauschen); je Laut 5–10 Versuche mit Abwandlungen; echte Dinge gleich mit: Schlüssel, Buch als Tür, Kies in einer Kiste für Schritte, Jacke für Stoff, Handschuh für Pfoten.
- **Aufbereitung in Audacity (frei):** 1 zuschneiden · 2 Rauschen entfernen mit dem Stille-Profil, sanft (6–12 dB), sonst „blubbert“ es · 3 Tiefen unter 80–100 Hz weg · 4 Klang anpassen · 5 Tonhöhe: tiefer = groß, höher = klein und niedlich · 6 ein- und ausblenden · 7 Spitze auf −1 dB · 8 als MP3 ausgeben (unsicher).
- Eigene Aufnahmen sind dein Werk und können unter CC0 ins Repo; die Kinder hören ihren Lehrer, wie bei den eigenen Stimmen (unsicher).

### 4.4 Lokale KI-Klangerzeuger
- Meta AudioGen: Code MIT, Modell **CC BY-NC** – [Model Card](https://huggingface.co/spaces/Nymbo/MusicGen/raw/main/model_cards/AUDIOGEN_MODEL_CARD.md) (bestätigt). Stable Audio Open: Lizenzgeschichte widersprüchlich – [VentureBeat](https://venturebeat.com/ai/stability-ai-debuts-new-stable-audio-open-for-sound-design) (unsicher). Auf AlexPC (4 GB AMD, kein CUDA) ohnehin kaum machbar (unsicher). → nicht verfolgen.

### 4.5 ElevenLabs-Geräusche
- Kostenloser Plan: **keine kommerzielle Lizenz**; Bezahlplan: kommerziell erlaubt – [Help Center](https://elevenlabs.io/docs/help-center/legal/can-i-publish-the-content-i-generate-on-the-platform/llms.txt) (nachgelesen). Nennung „elevenlabs.io“ im kostenlosen Plan (unsicher, Nebenquelle) – [licenseorg](https://licenseorg.com/blog/elevenlabs-licensing-guide-ai-voices). Eigene Geräusch-Bedingungen, Verkauf als Einzeldatei verboten (unsicher) – [sound-effects-terms](https://elevenlabs.io/sound-effects-terms).
- Höchstens **30 s** je Erzeugung, Schleifen-Option – [Docs](https://elevenlabs.io/docs/overview/capabilities/sound-effects) (nachgelesen).
- **Widerspruch bei den Credits:** Die Docs nennen **40 Credits je Sekunde** (bei fester Dauer), das Hilfe-Center **11 Credits je Sekunde** – [Hilfe: Kosten](https://elevenlabs.io/docs/help-center/product/content-production/sound-effects/how-much-does-it-cost-to-generate-sound-effects) (unsicher). Beispiel: ein 3-s-Türgeräusch in 4 Varianten kostet 480 oder 132 Credits; eine 20-s-Schleife 800 oder 220 Credits. Vor jedem Einsatz auf der Preisseite nachsehen.
- **Für uns (unsicher):** nur auf dem Bezahlplan, Aufforderungstext und Datum in `QUELLEN.md`, Ergebnis bearbeiten (schneiden, schichten). Aufrufe nur mit deinem OK im Bau-Chat (CLAUDE.md).

### 4.6 Welche Quelle wofür (unsicher, Vorschlag)
| Art | 1. Wahl | 2. Wahl |
|---|---|---|
| Funkeln, Zauber, Notizbuch, Schlüssel-Glanz | ZzFX + Hall | Mund-Geräusch mit Tonhöhe |
| Türen, Schlüssel, Münzen, Bücher, Stoff | Kenney RPG (CC0) | selbst aufgenommen |
| Schritte | Kenney Impact/RPG (CC0) | selbst aufgenommen, Sonniss bearbeitet |
| Laute ohne Worte | selbst aufgenommen | – |
| Raben, Tauben | Freesound CC0 je Datei | Sonniss bearbeitet |
| Wind, Feuer, Raumton | Freesound CC0 | selbst aufgenommen, Sonniss geschichtet |
| Glocke, Uhrschlag | vorhandene gemeinfreie Aufnahme | im Code erzeugt |

---

## 5 Technik im Browser

### 5.1 Vorsichtiger Hinweis zu den bestehenden Apps (unsicher, nicht am Gerät geprüft)
Die Lern-Apps setzen die Lautstärke von Tondateien direkt am Audio-Element: `app/runner.js:236` (`EFFEKT_LAUT`, `effektDaempf`) und `app/runner.js:275` (`a.volume = …`), ebenso in `app/klasse9/runner.js`. **iOS ignoriert `volume` am Audio-Element, es bleibt immer 1** – [Apple-Forum](https://developer.apple.com/forums/thread/82939), [WebKit 151589](https://bugs.webkit.org/show_bug.cgi?id=151589) (bestätigt). Das Leiserstellen von Tondateien unter der Orts-Stimme wirkt deshalb auf iPads heute **vermutlich nicht**; die im Code erzeugten Klänge folgen ihm dagegen. **Vorschlag: auf einem iPad prüfen (Probe 1), nichts reparieren**, bis du es entschieden hast.

### 5.2 Three.js und Web Audio
- `THREE.Audio` ist eine dünne Schicht über Web Audio; jedes `play()` erzeugt eine neue Quelle; ein Objekt spielt immer nur einen Ton zugleich, für Überlappung braucht man mehrere – [Audio.js r170](https://raw.githubusercontent.com/mrdoob/three.js/r170/src/audio/Audio.js) (nachgelesen, im Quelltext).
- `PositionalAudio` (Ton mit Richtung) stellt fest das teure Verfahren „HRTF“ ein – [PositionalAudio.js r170](https://raw.githubusercontent.com/mrdoob/three.js/r170/src/audio/PositionalAudio.js) (nachgelesen). HRTF kostet viel Rechenzeit, auf schwachen Mobilgeräten „super CPU intensive“ – [W3C](https://lists.w3.org/Archives/Public/public-audio/2014JulSep/0033.html), [Mozilla-Bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1128494) (bestätigt); Faustregel 4–8 solche Quellen auf Mobilgeräten – [abratabia](https://www.abratabia.com/web-game-audio/audio-performance.php) (unsicher). → Auf dem iPad `panner.panningModel = 'equalpower'` setzen, Richtungston nur für wenige Quellen (Feuer, Taube, Rabe).
- Der Hörer gehört an die Kamera – [AudioListener.js r170](https://raw.githubusercontent.com/mrdoob/three.js/r170/src/audio/AudioListener.js) (nachgelesen).
- Hall: ein `ConvolverNode` je Ort als gemeinsamer Hallweg, nicht je Ton; beim Ortswechsel zwei Hallwege überblenden. Raumantworten lassen sich im Code aus abklingendem Rauschen erzeugen – keine Datei, keine Lizenz (unsicher). Freie Sammlungen wie OpenAIR haben Lizenzen je Datei – [OpenAIR](https://www.openair.hosted.york.ac.uk/?page_id=2) (nachgelesen).
- Keine Bibliothek: howler.js seit September 2023 ohne neue Fassung – [npm](https://registry.npmjs.org/howler) (nachgelesen); Tone.js ist für Musik gebaut, für Geräusche zu viel (unsicher). Three.js bringt die Klassen schon mit.

### 5.3 Dateien, Formate, Speicher, Offline
- **MP3 bleibt.** Ogg Opus in Safari 18.4/18.5 noch fehlerhaft – [frequal](https://frequal.com/java/OggOpusStillNotWorkingInSafari18_4.html), [WebKit 293310](https://bugs.webkit.org/show_bug.cgi?id=293310) (bestätigt, dass es wackelt).
- **Schleifen-Falle:** MP3 hängt am Anfang und Ende Stille an (Encoder-Verzögerung), dadurch entsteht beim Wiederholen eine Lücke, besonders mit `<audio loop>` in Safari – [bugnet](https://bugnet.io/blog/how-to-fix-web-audio-scheduled-loop-gap-with-audiobuffersourcenode), [Jake Archibald](https://jakearchibald.com/2016/sounds-fun/) (bestätigt). Abhilfe: als AudioBuffer laden und `loopStart/loopEnd` auf den echten Bereich setzen.
- **Offline-Falle:** Safari fragt Tondateien in Stücken an („Range-Anfrage“); der Service Worker muss das beantworten können, sonst spielt nichts – [Chrome Workbox](https://developer.chrome.com/docs/workbox/serving-cached-audio-and-video.md.txt), [Phil Nash](https://dev.to/philnash/service-workers-beware-safaris-range-request-38i7) (bestätigt). Das betrifft nur das Audio-Element; `fetch` + Entschlüsseln holt die Datei normal ganz (unsicher, Folgerung) – ein weiterer Grund für AudioBuffer.
- Speicher (Rechnung, unsicher): 1 s mono entschlüsselt ≈ 192 KB; 100 kurze Töne ≈ 19 MB; eine 60-s-Stereoschleife ≈ 23 MB. Also: kurze Töne mono, Grundgeräusche 20–40 s, je Ort laden und beim Verlassen freigeben. Das teilt sich das iPad mit den Bildern.
- Viele kleine Dateien sind mit HTTP/2 und Service Worker einfacher zu pflegen als eine Sammeldatei („Sprite“); ein Kompromiss sind Sammeldateien je Ort (unsicher).

### 5.4 iPad-Safari
- AudioContext beim ersten Tippen starten bzw. fortsetzen, im Tipp-Handler selbst (wie `audioAn()` heute); nur **ein** AudioContext für das ganze Spiel – [WebKit 205599](https://bugs.webkit.org/show_bug.cgi?id=205599) (unsicher als Regel). Die Figurenwahl ist das natürliche erste Tippen.
- **Stummschalter:** Web Audio ist auf iOS mit Stummschalter stumm; `navigator.audioSession.type = 'playback'` hebt das auf, `'ambient'` respektiert ihn – [W3C](https://www.w3.org/TR/audio-session/), [WebKit 264473](https://bugs.webkit.org/show_bug.cgi?id=264473) (bestätigt). **Deine Entscheidung:** Ich empfehle, den Stummschalter zu respektieren, damit im Unterricht „Ton aus“ am Gerät funktioniert.
- Zustand „interrupted“ (z. B. Anruf): dann `resume()`; beim Verlassen der Seite pausieren – [MDN](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/state), [WebKit 273511](https://bugs.webkit.org/show_bug.cgi?id=273511) (bestätigt, dass es den Zustand gibt; Fehlerstand unsicher).

### 5.5 Lautstärke, Absenken unter der Stimme, Begrenzer
- Reihenfolge: Stimme > wichtige Rückmeldung > Gegenstände > Einzelgeräusche > Grundgeräusche; Umgebung unter der Stimme schnell absenken, langsam zurück – [bugnet](https://bugnet.io/blog/how-to-mix-game-audio-so-nothing-drowns-out), [Unity Learn](https://learn.unity.com/course/tanks-make-a-battle-game-for-web-and-mobile/tutorial/audio-mixing-1?version=6.3) (bestätigt).
- **Umsetzung (unsicher):** Bei Stimmbeginn Umgebung auf etwa −6 bis −9 dB (`setTargetAtTime(0.35…0.5, t, 0.05)`), danach in etwa 0,4 s zurück; neue Einzelgeräusche während der Stimme aussetzen. Stimme mono, trocken, in der Mitte, nicht mit Richtung – die Aussprache bleibt klar. Am Ende ein `DynamicsCompressorNode` als Sicherheitsbegrenzer. Zwei Regler (Stimmen, Geräusche) und eine „ruhig“-Einstellung für empfindliche Kinder. „Nahaufnahme/Gespräch“ = Umgebung leiser, Einzelgeräusche aus.
- Bezugswerte (Spiele allgemein): Geräusche um −16 dB RMS, Dialog um −12 dB – [Audiokinetic](https://blog.audiokinetic.com/loudness-processing-best-practice-chapter-3-scalable-loudness-processing-for-games/) (nachgelesen); Mobilgeräte −16 bis −18 LUFS – [IESD](https://www.audiogang.org/wp-content/uploads/2015/04/IESD-Mix-Ref-Levels-v03.02.pdf) (bestätigt). Für Kinder gibt es keine eigenen Werte.

### 5.6 Kopplung an Bewegungen
- Der AnimationMixer von Three.js kennt keine Ereignisse mitten in einer Bewegung, nur „Schleife“ und „fertig“; man prüft in jedem Bild die Zeit der Bewegung gegen eigene Zeitpunkte – [abratabia](https://www.abratabia.com/game-animation/animate-3d-characters.php), [sbcode](https://sbcode.net/threejs/gltf-animations) (nachgelesen).
- Blender exportiert eigene Eigenschaften als glTF-„extras“; Zeitmarken werden nicht erwähnt – [glTF-Blender-IO](https://raw.githubusercontent.com/KhronosGroup/glTF-Blender-IO/main/docs/blender_docs/scene_gltf2.rst) (nachgelesen).
- **Vorschlag (unsicher):** Tabelle je Bewegung, z. B. `{gehen: [0.12, 0.62]}` als Anteil der Bewegungsdauer; per Blender-Skript aus Zeitmarken als JSON geschrieben oder von Hand eingetragen. Beim Überblenden Gehen↔Rennen (wie in `probe3d_figuren.js`) nur die Bewegung mit Gewicht über 0,5 Schritte auslösen lassen. Tempoänderungen (`timeScale`) sind automatisch drin. Den Ton auf die Uhr des AudioContext legen, dann gibt es kein Ruckeln. Gesten genauso: Glanz-Ding auf das Bild des Aufblitzens, Hackenknall auf das Salut-Bild.
- Abwechslung: `playbackRate` ±5 %, Lautstärke ±2–3 dB, 3–5 Aufnahmen reihum ohne Wiederholung; je Ton höchstens wenige gleichzeitig (Schritte 2, Rückmeldung 3), insgesamt etwa 16–24; beim Überlauf den ältesten leisesten Ton mit kurzem Ausblenden stoppen (unsicher, übliche Werte).

---

## 6 Arbeitsweise und Ordnung

- **Ordner (Vorschlag, unsicher):** `app/tower/klang/` mit Unterordnern `figuren/`, `orte/`, `dinge/`, `rueckmeldung/`; je Ordner eine `QUELLEN.md`.
- **Dateinamen-Schema:** `<bereich>_<wer-oder-wo>_<was>_<variante>.mp3`, nur Kleinbuchstaben, keine Umlaute, Variante zweistellig. Beispiele: `fig_gary_schritt_stein_01.mp3`, `fig_sergeant_salut_01.mp3`, `ort_hof_wind_bett.mp3`, `ort_guardroom_feuer_bett.mp3`, `ding_tuer_auf_02.mp3`, `rm_schluessel_gefunden.mp3`. Im Code erzeugte Klänge stehen mit demselben Namen in einer Tabelle (`zzfx_gary_zauber`). So findet der Bau-Chat zu jedem Namen genau eine Datei (passt zur Regel „Namen als Vertrag“ aus `werkzeuge-recherche.md` §8).
- **`QUELLEN.md` je Ordner** wie im bestehenden `app/audio/orte/QUELLEN.md`: Spalten Datei · Quelle (Adresse) · Urheber · Lizenz · Bearbeitung · Abrufdatum · Verwendung. Bei CC BY zusätzlich eine Zeile auf einer Info-Seite im Spiel; bei Sonniss „bearbeitet: …“; bei ElevenLabs Aufforderungstext und Datum; bei eigenen Aufnahmen „Mr. Alex, CC0“.
- **Lautstärke-Ziel (unsicher, Vorschlag):** Stimmen −16 LUFS (vorher messen, ob die 389 ElevenLabs-Aufnahmen schon dort liegen); Grundgeräusche −26 bis −30 LUFS; Spitze überall höchstens −1 dBTP. **Kurze Töne unter etwa einer Sekunde nicht nach LUFS angleichen** (das Messverfahren ist für längere Stücke gebaut), sondern nach Spitze, dann im Spiel nach Gehör einstellen. Werkzeug: ffmpeg `loudnorm` in zwei Durchgängen und mit `ebur128` nachmessen – [DEV](https://dev.to/masonwritescode/two-pass-loudness-normalization-with-ffmpeg-loudnorm-the-right-way-1nm3), [rentry](https://rentry.co/ebur128) (bestätigt).
- **Formate:** kurze Töne mono MP3 64–96 kbit/s, Grundgeräusche 96–128 kbit/s, Schleifen mit `loopStart/loopEnd` (unsicher).
- **Anhören als Abnahme:** Jede Geräusch-Runde endet mit einer kleinen Hörseite für dich (je Figur, je Ort), nicht mit Bildschirmfotos. Der „Nerv-Wert“ kommt als Frage dazu: Würde dich das nach 30-mal stören?
- **Testprogramm:** kann nicht hören, aber prüfen: alle Namen haben eine Datei, keine Konsolenfehler beim Laden, Schritte lösen beim Gehen aus (Zähler), AudioContext startet nach dem ersten Tippen (unsicher, ob das in WebKit-Tests geht).

---

## Geräusche für die erste Szene

| Geräusch | wofür | Varianten | Quelle (Vorschlag) | Lizenz |
|---|---|---|---|---|
| **Auftakt im Hof (Nacht)** | | | | |
| Wind, leicht böig (Grundgeräusch) | Nacht, Weite | 1 Schleife 30–40 s | Freesound CC0 | CC0 |
| fernes Stadtrauschen (Grundgeräusch) | London ist nah | 1 Schleife, andere Länge | Freesound CC0 | CC0 |
| Raben krächzen | sieben Raben auf der Mauer | 4–5, selten | Freesound CC0, notfalls selbst („Kraa“) | CC0 / eigen |
| Raben flattern | Raben fliegen auf | 3 | selbst aufgenommen (Tuch schütteln) oder Kenney RPG (Stoff) | eigen / CC0 |
| Uhr schlägt Viertel nach neun | Erkennung, Story-Moment | 1 | vorhandene `westminster_chimes.mp3`, Ausschnitt | gemeinfrei |
| Fahnenseil klirrt | Leben am Rand | 2 | selbst aufgenommen | eigen |
| Sergeant „geht schnell“ auf Kopfstein | erster Witz | 4–6 (±3 %) | Kenney Impact/RPG oder selbst (Absätze auf Stein) | CC0 / eigen |
| Gary klettert aus dem Fass | Auftritt | 2 (Holz poltern, Deckel) | Kenney RPG (Holz) | CC0 |
| Tür ist zu | erste Tür | 2 (Klinke rüttelt, Klonk) | Kenney RPG oder selbst | CC0 / eigen |
| **Guard Room** | | | | |
| Feuer knistert (Grundgeräusch, mit Richtung) | Wärme, Mittelpunkt | 1 Schleife + 4 Knacker | Freesound CC0 | CC0 |
| Uhr tickt | Erkennung, „Zettel hinter der Uhr“ | 2 Ticks (tick/tack) | im Code erzeugt oder selbst aufgenommen | eigen |
| Holz knarrt, Wind am Fenster | Einzelgeräusche | je 2–3 | selbst / Freesound CC0 | eigen / CC0 |
| 14 Dinge antippen | Materialklänge | 6 Stoffe × 3 | Kenney RPG + selbst | CC0 / eigen |
| Zettel, Papier | Fund hinter der Uhr | 2 | Kenney RPG (Buch) oder selbst | CC0 / eigen |
| Notizbuch-Karte | neue Wendung | 1–2 | ZzFX (weiche Glocke in E) + Blättern | MIT-Code / CC0 |
| Schlüssel gefunden | Markenzeichen | 2 | selbst aufgenommen (echter Schlüsselbund) + ZzFX-Glanz | eigen |
| **The Den** | | | | |
| Raumton, Wind am Dach | leisester Ort | 1 Schleife | selbst aufgenommen | eigen |
| Diele knarrt | beim Gehen | 3 | selbst / Kenney RPG (creak) | eigen / CC0 |
| Leiter wird heruntergelassen | Zimmer öffnet sich | 1 | selbst (Holz + Seil) | eigen |
| Schlüssel auf dem Haken | Sammlung | 1 | wie „Schlüssel gefunden“, leiser | eigen |
| **Gary** | | | | |
| Trippelschritte (Pfote) | Gang | 4 je Boden | selbst (Handschuh) | eigen |
| Umhang-Wusch | Umhang werfen | 3 | selbst (Jacke) / Kenney RPG (cloth) | eigen / CC0 |
| Zauber gelingt / geht schief | Ta-daa | je 2 | ZzFX + Mund-Pop | MIT-Code / eigen |
| Erschrecken-Boing, Bauchknurren | Slapstick | je 2 | selbst (Mund) | eigen |
| Laute ohne Worte | „Hehe“, „Hmpf“, stolz | 6–8 | selbst; oder Gary-Stimme bei ElevenLabs (bezahlt) | eigen / bezahlt |
| **Sergeant** | | | | |
| Stiefel-Klack, Hackenknall beim Salut | Gang, Salut | 4 / 2 | Kenney Impact oder selbst | CC0 / eigen |
| Fuß wippt | „That is my foot. Not me.“ | 3 | selbst | eigen |
| Mütze fällt („Flump“) | sucht seinen Hut | 1 | selbst (Kissen) | eigen |
| „Hrrm!“ | Laut | 3 | selbst oder seine ElevenLabs-Stimme | eigen / bezahlt |
| **Taube (am Fenster)** | | | | |
| Gurren | Erkennung, Taube redet | 4 | Freesound CC0 oder selbst | CC0 / eigen |
| Picken an der Scheibe | ans Fenster picken | 3 | selbst (Fingernagel an Glas) | eigen |
| Flattern, Trippeln | Bewegung | je 3 | selbst | eigen |
| **Arthur (Treppe)** | | | | |
| ein langsamer Flügelschlag | Ankunft | 2 | selbst (Tuch langsam) | eigen |
| Federn plustern | Geste | 2 | selbst (Federwedel) | eigen |
| Verschwinden „Fwip“ | blinzeln, weg | 1 | selbst / ZzFX | eigen / MIT-Code |
| tiefes Krächzen, selten | Würde | 2 | Freesound CC0, tiefer gestimmt | CC0 |
| **Mr. Flex hinter dem Glas** | | | | |
| Glas „klingt“ beim Erscheinen | Spiegel wird blank | 2 | selbst (Glas anschlagen) + ZzFX | eigen |
| Glanz-Ding (Augen, Zähne) | Erkennungston | 2 | ZzFX, weich | MIT-Code |
| Kung-Fu-Wusch, Stampfen, Stoff-Schnalzen | Kick, Reiterstand | je 3 | selbst | eigen |
| Sonnenbrille Klick, Teetasse | Gesten | je 2 | selbst | eigen |
| Klangfilter „hinter Glas“ | seine Geräusche etwas gedämpft und eng, Stimme nur leicht, damit sie verständlich bleibt | – | im Code (Tiefpass + kleiner Hall) | – |

Alle Zeilen sind ein Vorschlag (unsicher); angehört ist nichts.

---

## Kurze Proben für AlexPC bzw. einen Cloud-Chat

1. **iPad-Lautstärke** (15 min, Cloud-Chat baut eine winzige Probeseite, du öffnest sie auf dem iPad): ein Ton dreimal per Audio-Element mit `volume` 1 / 0,3 / 0,1 und dreimal über Web Audio mit Gain. Zeigt, ob 5.1 stimmt und ob der Stummschalter Web Audio stumm macht. Die Seite muss fürs iPad erreichbar sein: AlexPC im selben WLAN oder eine Vorschau, die nur mit deinem OK veröffentlicht wird.
2. **Lautheit der vorhandenen Stimmen messen** (10 min, Cloud-Chat, falls ffmpeg installiert ist – sonst erst fragen): 20 der 389 Aufnahmen mit `ebur128` messen. Zeigt, ob die Stimmen schon bei −16 LUFS liegen.
3. **Zehn Mund-Geräusche** (30 min, AlexPC + Handy + Audacity): Gary „Hehe“, Erschrecken, Pop, Taube gurrt, Rabe „Kraa“, Hackenknall mit Schuh, Schlüsselbund. Zeigt, ob die Aufnahme zu Hause gut genug klingt und wie lange die Aufbereitung dauert.
4. **Kenney-Pakete durchhören** (20 min, AlexPC, kenney.nl ist in der Cloud gesperrt): Interface, RPG Audio, Impact laden und eine Liste machen, was für Türen, Schlüssel, Schritte und Stoff taugt.
5. **ZzFX-Glanz und Zauber** (20 min, AlexPC im Browser): fünf Klänge einstellen (Funkeln, Zauber gelingt, Zauber schief, Notizbuch, Mr.-Flex-Ding). Zeigt, ob die Töne weich genug werden oder nach 8-Bit klingen.
6. **Freesound CC0 suchen** (30 min, AlexPC, freesound.org ist in der Cloud gesperrt): „raven“, „wind night“, „fireplace“, „pigeon“, „clock tick“ mit CC0-Filter; zehn Kandidaten mit Adresse und Lizenz in einen Entwurf der `QUELLEN.md`.
7. **Schritte im Takt** (30 min, Cloud-Chat, in `probe3d`, nur als Probe): beim vorhandenen Gang von Mr. Flex an zwei Zeitpunkten einen Klick auslösen und im Testprogramm zählen. Zeigt, ob die Zeittabelle auch beim Überblenden ohne doppelte Schritte geht.
8. **Hall im Code** (20 min, Cloud-Chat baut, AlexPC hört): derselbe Schritt trocken, mit „kleiner Steinraum“ und mit „Holzzimmer“ aus erzeugtem Rauschen. Zeigt, ob man ohne Hall-Dateien auskommt.
9. **Blender-Zeitmarken** (20 min, wo Blender läuft): Marken im Gang setzen, als glTF exportieren, nachsehen, ob sie per Skript als „extras“ ankommen.

---

## Grenzen dieser Recherche

- **Gesperrte Seiten** (nur Suchauszüge gelesen): asoundeffect.com, fmod.com, audiokinetic.com, gamedeveloper.com, 99percentinvisible.org, substack.com, sonniss.com, pixabay.com, zapsplat.com, mixkit.co, elevenlabs.io, freesound.org, threejs.org, developer.mozilla.org, webkit.org, akolytagame.com, blog.criware.com, discovery.ucl.ac.uk. Der Three.js-Quelltext ging über raw.githubusercontent.com.
- **Nicht gelesen:** Sonniss-Lizenz 2026, Lizenztexte von Pixabay, Mixkit, Zapsplat vollständig, aktuelle ElevenLabs-Preise (daher der Credit-Widerspruch), Bedingungen von Bfxr, rFXGen und ChipTone, Lizenz der British-Library-Aufnahmen.
- **Nicht gefunden:** Werte für Cartoon-, Pfoten- und Vogelschritte; Lautstärkewerte speziell für Kinder; eine Studie zu Summer oder neutralem Ton bei 11- bis 12-Jährigen; Messungen, wie viele gleichzeitige Töne ein iPad oder Schul-Laptop schafft; der Kosten-Unterschied HRTF/equalpower auf dem iPad; welche iPadOS-Fassung die Schul-iPads haben (wichtig für Ogg); ob Blender Zeitmarken nach glTF exportiert; geprüfte CC0-Aufnahmen von Tower-Raben.
- **Nichts angehört und nichts getestet.** Klangqualität der Quellen ist nicht verglichen.
- **Für eine zweite Prüfung freizugeben** (nur lesen): `sonniss.com`, `freesound.org`, `kenney.nl`, `elevenlabs.io`, `asoundeffect.com`, `developer.mozilla.org`, `webkit.org`. Alternativ liest der lokale Chat auf AlexPC diese Seiten im Browser.

## Berichtigungen zu werkzeuge-recherche.md

1. **Sonniss** stand dort als „frei ohne Nennung“. Für die Nutzung stimmt das, aber die Lizenz verbietet nach einem Forum-Zitat die Weitergabe der Datei „as-is“, und ein öffentliches Repo stellt jede Datei einzeln zum Herunterladen bereit. **Sonniss also nur stark bearbeitet** und mit Vermerk in `QUELLEN.md` (unsicher, Lizenz 2026 nicht gelesen).
2. **Pixabay** stand in der Tabelle ohne klare Empfehlung. Die Nutzungsbedingungen zählen auch nur zugeschnittene Dateien als „standalone“: **für unser Repo nicht nutzen** (nachgelesen). Dasselbe gilt für Mixkit und Zapsplat (neu geprüft).
3. **„Sprache etwa 2 LU lauter als die Atmosphäre“** ist für Kinder an iPad-Lautsprechern vermutlich zu wenig. Vorschlag: Grundgeräusche −26 bis −30 LUFS (mindestens 6 LU unter der Stimme) und zusätzlich das Absenken unter der Stimme im Spiel (unsicher).
4. **„Alle Töne auf −16 LUFS angleichen“** passt nur für Stimmen und längere Geräusche. Kurze Töne werden nach Spitze angeglichen, LUFS ist für sie kaum aussagekräftig (unsicher, Folgerung).
5. **Zeitpunkt:** Dort stand „Ton fällig bei E, Hof-Geräusche schon in C“. Das Klang-Modul und die Kopplung der Schritte an die Bewegung gehören aber schon in **A/B**, weil sie in die Figuren und die Spiellogik eingebaut werden; nur Raumklang und Feinschliff bleiben C und E.
6. **audiosprite** (Sammeldatei) ist mit HTTP/2 und Service Worker weniger nötig; einzelne Dateien oder Sammeldateien je Ort sind leichter zu pflegen (unsicher). Neu ist außerdem die MP3-Lücke bei Schleifen (5.3).
