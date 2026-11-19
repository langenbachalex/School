# Musik für die Story-Spiele – Recherche 19.11.2026

Lieber Mr. Alex, hier steht, wie „The Keys of the Tower“ (EN6, später weitere London-Kapitel und EN9) an **wenigen, ausgewählten Stellen** Musik bekommen kann, woher sie lizenzsicher kommt und was das kostet. Der Bericht baut auf `geraeusche-recherche.md` auf (Lizenzregel, Klang-Modul, Technik) und wiederholt das nicht. Geräusche kommen zuerst, die Musik danach (deine Vorgabe).
**Grenze:** Die Seiten von Suno, ElevenLabs, Udio, Stable Audio, OpenGameArt und incompetech waren im Cloud-Netz gesperrt. Fast alles beruht deshalb auf **Auszügen aus Suchtreffern**, oft von Blogs, die einander widersprechen. Gelesen habe ich die Musik-Schnittstelle von ElevenLabs über deren offenes GitHub-Repo (`elevenlabs/skills`). Dein ElevenLabs-Konto habe ich nur abgefragt (Tarif und Guthaben, kostet nichts). **Nichts wurde erzeugt, nichts angehört, kein Konto angelegt.**

Kennzeichnung wie im Geräusche-Bericht: **nachgelesen** = eine Quelle, oft nur ihr Suchauszug · **bestätigt** = mehrere Quellen stimmen überein · **unsicher** = Widerspruch, eigene Folgerung oder Vorwissen. Abrufdatum aller Quellen: 19.11.2026.
Baustopp bis 25.11.: Alles hier sind Pläne und kleine Proben.

---

## Was wir jetzt tun sollten

> **Entschieden von Mr. Alex am 19.11.2026:** (1) **Das Hauptthema schreibt er selbst, allein** – ohne KI-Musik dazu. (2) ElevenLabs Musik wird trotzdem einmal ausprobiert (Probe 1 über die Schnittstelle). (3) ElevenLabs läuft jetzt auf **Pro** (abgefragt 19.11.: 690.191 Credits im Monat statt 141.792 im Creator-Tarif). (4) Erster Versuch der Probe: Der Schlüssel „School“ hat kein Recht `music_generation` (Fehler 401 „missing_permissions“, 0 Credits verbraucht) – Mr. Alex ergänzt das Recht, dann läuft die Probe.


1. **Erst die Geräusche, dann die Musik.** Musik kommt frühestens in Block C (Hof und Auftakt) und richtig in Block E (Feinschliff). Das Klang-Modul aus dem Geräusche-Bericht bekommt dafür von Anfang an eine fünfte Lautstärke-Schiene „Musik“. Das ist nur eine Zeile mehr und erspart später einen Umbau.
2. **Das kostenlose Suno-Konto taugt für uns nicht.** Laut Suno-Hilfe darf man mit dem kostenlosen Konto seit November 2026 **gar nichts mehr herunterladen**, und die Lieder dort gehören Suno, nicht dir. Für die App wäre mindestens „Pro“ nötig (10 $ im Monat). Ein späteres Bezahlkonto gilt nach mehreren Quellen nicht rückwirkend für Lieder aus der kostenlosen Zeit.
3. **ElevenLabs ist der günstigste brauchbare KI-Weg, weil du dort schon zahlst.** Dein Creator-Tarif deckt die Musik mit ab. Eine Minute Musik kostet nach Fremdquellen etwa 900 Credits. Acht kurze Musik-Augenblicke mit je drei Versuchen kosten zusammen etwa 5.000–8.000 Credits, also etwa 4–6 % deines Monatsguthabens. Unsere Skripte können die Musik genauso abrufen wie die Stimmen.
4. **Deine eigene Musik ist der beste Weg für das Wiedererkennbare.** Du schreibst **ein Hauptthema** (8–16 Takte) für „The Seven Keys of London“. Daraus werden die kurzen Einwürfe: der Anfang des Themas, wenn ein Schlüssel gefunden wird, sein Schluss, wenn ein Rätsel gelöst ist. Dafür reichen Noten in MuseScore (ein kostenloses Notenprogramm, das die Noten auch abspielt) oder eine Klavier-Aufnahme mit dem Handy. Die Rechte liegen dann ganz bei dir. Lange Stücke sind aufwendig, und die brauchen wir gar nicht.
5. **Musik nur an etwa acht Stellen der ersten Szene** (Liste in Abschnitt 5): Auftakt, erster Schritt im Hof, Gary aus dem Fass, Schlüssel, Guard Room, Zettel hinter der Uhr, Schluss, Haken. Dazwischen ist bewusst **Stille**, damit Geräusche und Stimmen tragen. Meist sind es kurze Einwürfe von 2–8 Sekunden. Nur der Auftakt und der Schluss bekommen ein durchkomponiertes Stück von 30–40 Sekunden. Schleifen gibt es vorerst keine.
6. **Lizenzregel vom 18.11. auch für Musik:** Ins Repo kommt nur Selbstgemachtes, CC0 und CC BY mit Nennung. Für KI-Musik trägt `QUELLEN.md` den Dienst, den Tarif am Erzeugungstag, die Aufforderung und das Datum ein. **Nicht ins Repo:** Suno aus dem kostenlosen Konto, Udio (dort ist kein Herunterladen mehr möglich), YouTube Audio Library und alles mit „NC“ (nicht kommerziell). Der Grund: Ein öffentliches Repo verteilt jede Datei weiter, und „nicht kommerziell“ ist rechtlich schwer abzugrenzen.
7. **Bei ElevenLabs einen offenen Punkt vorher klären:** Die Musik-Bedingungen schließen auf allen normalen Tarifen „Studio Games“ aus. Nach dem Suchauszug sind das Spiele, die **Geld einbringen und auf mehr als einer Plattform** angeboten werden. Unser kostenloses Schulspiel ohne Werbung fällt danach vermutlich nicht darunter. Gelesen habe ich die Bedingungen aber nicht, deshalb bitte vor dem ersten Stück selbst nachlesen (Adresse in Abschnitt 4).
8. **Suno nur, wenn dir der Klang dort deutlich besser gefällt** und du dafür 10 $ im Monat zahlen willst. Suno hat keine offene Schnittstelle, man arbeitet also von Hand auf der Webseite (etwa 5–10 Minuten je Stück). Dazu kommt ein Rechtsrisiko: Das Landgericht München hat am 31.7.2026 im Streit GEMA gegen Suno überwiegend der GEMA recht gegeben. Das Urteil ist noch nicht rechtskräftig.
9. **Drei Proben von je 10 Minuten** (unten), bevor irgendetwas gebaut wird. Am wichtigsten ist die erste: In der ElevenLabs-Webseite hörst du einen Einwurf und ein 30-Sekunden-Stück an. Das kostet etwa 500–1.000 Credits und ist deine Entscheidung.
10. **Schlanke Variante:** gar keine KI-Musik. Es gibt nur dein Hauptthema als Klavier- oder Celesta-Aufnahme in drei Längen (Auftakt, Schlüssel, Schluss), sonst Stille und Geräusche. Das kostet 0 € und vielleicht zwei Abende Arbeit, und es klingt nach diesem Spiel und nach keinem anderen.

---

## 1 Suno

| Frage | Antwort | Stand | Quelle |
|---|---|---|---|
| Guthaben kostenlos | 50 Credits am Tag, ohne Übertrag; etwa 10 Lieder am Tag (je Erzeugung 10 Credits für 2 Fassungen) | bestätigt (mehrere Blogs) | [techjacksolutions](https://techjacksolutions.com/ai-tools/suno/is-suno-free/), [suno.bi](https://suno.bi/en/blog/suno-ai-free-what-you-get) |
| **Herunterladen kostenlos** | **0 Downloads**; früher 7 Probe-Downloads, seit November 2026 abgeschafft | nachgelesen (Suno-Hilfe, Auszug); ältere Blogs nennen noch 7 | [Suno-Hilfe „Upcoming Changes FAQ“](https://help.suno.com/en/articles/13614785), [mubert](https://mubert.com/blog/suno-download-caps) |
| Modell kostenlos | „v6-mini“ (die Bezahlkonten haben v6) | unsicher (ein Blog, Preisseite vom 20.10.) | [mubert](https://mubert.com/blog/suno-download-caps) |
| Instrumental, Länge | Instrumental per Schalter möglich, Länge bis mehrere Minuten | unsicher (Vorwissen, nicht neu nachgelesen) | – |
| Rechte kostenlos | Die Lieder **gehören Suno**; du darfst sie nur nicht kommerziell nutzen und musst Suno nennen | bestätigt | [Suno-Hilfe](https://help.suno.com/en/articles/2871105), [neonmusic](https://neonmusic.co.uk/suno-ai-music-ownership-terms-of-service) |
| Rechte bezahlt | Pro und Premier: Die Lieder **gehören dir**, kommerzielle Nutzung erlaubt | bestätigt (Suno auf X) | [Suno auf X](https://x.com/suno/status/2008732260477079754) |
| Rückwirkend? | **Nein**, ein Lied aus der kostenlosen Zeit bleibt nicht kommerziell; Suno rät auch bei „Verlängerungen“ alter Lieder ab | nachgelesen (Blog + Suno-Hilfe) | [freeaimusictools](https://freeaimusictools.com/blog/is-suno-actually-free-2026/), [Suno-Hilfe](https://help.suno.com/en/articles/2871105) |
| Preise | Pro 10 $/Monat (96 $/Jahr), 20 Downloads im Monat · Premier 30 $/Monat (288 $/Jahr), 60 Downloads | nachgelesen (Suno-Hilfe + Blogs) | [lumimusic](https://lumimusic.ai/blog/suno-pricing), [veena](https://www.veena.studio/blog/suno-download-limits) |
| Schnittstelle | **keine öffentliche**; seit Juli 2026 ein Partnerprogramm nur auf Einladung; inoffizielle Umwege verstoßen vermutlich gegen die Bedingungen | bestätigt | [Digital Music News](https://www.digitalmusicnews.com/2026/07/03/suno-is-opening-an-api-partner-program/), [aimlapi](https://aimlapi.com/blog/the-suno-api-reality) |

**Folgerung:** Mit dem kostenlosen Konto kannst du nur anhören und vergleichen. Für die App wäre Pro nötig: Du arbeitest von Hand auf der Webseite, lädst das Stück herunter und legst es ins Repo. Das sind etwa 5–10 Minuten je Stück plus Auswahl (unsicher, geschätzt).

## 2 ElevenLabs Musik („Eleven Music“)

**Dein Konto (abgefragt 19.11. über die Schnittstelle, ohne Kosten):** Tarif **Creator**, jährlich bezahlt, **141.792 Credits im Monat**, davon 53.720 verbraucht. Die Musik zieht vom selben Guthaben ab wie die Stimmen (bestätigt).

| Frage | Antwort | Stand | Quelle |
|---|---|---|---|
| Schnittstelle | `POST /v1/music` (alias „compose“), Antwort ist die MP3-Datei; dazu `POST /v1/music/plan` (Ablaufplan, **kostet keine Credits**) und `/v1/music/detailed` | nachgelesen (Referenz von ElevenLabs auf GitHub) | [elevenlabs/skills api_reference.md](https://github.com/elevenlabs/skills/blob/main/music/references/api_reference.md) |
| Länge | 3 Sekunden bis 10 Minuten (`music_length_ms` 3.000–600.000) | nachgelesen (dieselbe Referenz) | ebd. |
| Instrumental | `force_instrumental: true` garantiert ein Stück ohne Gesang | nachgelesen | ebd. |
| Abschnitte | Ablaufplan aus bis zu 30 Abschnitten (je 3–120 s) mit Stil-Wörtern „ja“ und „nein“ (`positive_styles`, `negative_styles`) und Text wie `[Intro]`; man kann den Plan erst erzeugen (kostenlos), dann von Hand ändern, dann vertonen | nachgelesen | ebd. |
| Modelle | `music_v1` (Grundeinstellung), `music_v2`, `music_v2_5` (empfohlen) | nachgelesen | ebd. |
| Schleifen | **keine Schleifen-Einstellung** in der Musik-Schnittstelle (anders als bei den Geräuschen); Schleifen also selbst schneiden | nachgelesen (fehlt in der Referenz) | ebd. |
| Eigenes Material hochladen | nur für Großkunden („Enterprise“), d. h. **dein Thema als Vorlage geht nicht** | nachgelesen | ebd. |
| Kosten | etwa **900 Credits je Minute** in der Webseite; über die Schnittstelle 0,15 $ je Minute; die Creator-Werbung nennt „134 Minuten“ (121.000 ÷ 900); ein Test nennt weniger nutzbare Minuten | unsicher (nur Fremdquellen, widersprüchlich) | [cartesia](https://www.cartesia.ai/learn/elevenlabs-pricing), [musegen](https://www.musegen.ai/blog/elevenlabs-music-review-2026), [musicapi](https://musicapi.ai/eleven-music-api) |
| Kostenloser Tarif | keine Musik über die Schnittstelle, keine kommerzielle Nutzung | nachgelesen | [musicapi](https://musicapi.ai/eleven-music-api) |
| Rechte bezahlt | ab Starter kommerziell, **außer Film, Fernsehen, Radio und „Studio Games“**; Studio Games = Spiele, die Geld einbringen (Verkauf, Werbung, sonstige Einnahmen) **und** auf mehr als einer Plattform zu haben sind | nachgelesen (Suchauszug der Bedingungen) | [Eleven Music Model-Specific Terms](https://elevenlabs.io/eleven-music-model-specific-terms) |
| Recht am Schlüssel | Schlüssel lassen sich auf einzelne Bereiche beschränken; die Musik heißt vermutlich `music_generation`. Dein Schlüssel „School“ hat bisher nur „Text to Speech“ (Ideenspeicher 11b), er bräuchte also das Recht **Music Generation** dazu | nachgelesen (Fremdquelle) / Schlüssel-Stand aus dem Repo | [melius](https://docs.melius.com/integrations/elevenlabs), [ElevenLabs-Blog](https://elevenlabs.io/blog/api-key-permissions) |

**Rechnung neben der Vertonung (unsicher, mit 900 Credits je Minute):** Ein Einwurf von 5 s kostet etwa 75 Credits, ein Auftakt von 35 s etwa 525 Credits. Die acht Augenblicke aus Abschnitt 5 dauern zusammen etwa 1,5 Minuten. Mit drei Versuchen je Stück sind das etwa 4.000 Credits, mit Abschnitts-Feinarbeit eher 8.000. Zum Vergleich: Dafür bekäme man rund 9.000–18.000 Zeichen Vertonung (0,44 Credits je Zeichen). **Ein höherer Tarif ist nicht nötig.**

**Einbau in unsere Skripte (Aufwand klein):** ein neues Skript `werkzeuge/tower_musik.py` nach dem Muster von `tower_audio.py`. Es liest eine Tabelle (`inhalte/abenteuer/tower_musik.tsv`: id, Länge, Aufforderung, Stil-Wörter, „instrumental“), hat einen Schalter `--zaehlen` (rechnet die Credits vorher aus, kostet nichts), überschreibt nie vorhandene Dateien, legt die Rohdatei in `audio-roh/` und die fertige in `app/tower/klang/musik/`, gleicht die Lautheit an und schreibt die Kosten ins Protokoll. Es ist dieselbe Abfrage wie bei den Stimmen, nur mit anderem Endpunkt. Ein Bau-Chat bräuchte dafür etwa eine Stunde, wenn das Recht am Schlüssel ergänzt ist (unsicher, geschätzt).

## 3 Weitere Wege

| Weg | Rechte | Kosten | Aufwand | Qualität für uns | Urteil |
|---|---|---|---|---|---|
| **Eigenes Hauptthema** (Noten in MuseScore oder Klavier/Celesta mit dem Handy aufgenommen) | ganz bei dir; kann unter CC0 oder CC BY ins Repo | 0 € | Thema 1–2 Abende; Einwürfe daraus je 15–30 min | wiedererkennbar, persönlich, passt zum Gedanken „die Kinder hören ihren Lehrer“ | **erste Wahl für Thema und Einwürfe** |
| **Kinderchor** (z. B. ein „Uuuh“-Akkord, ein gesummtes Thema für den Schluss oder den Den) | eigenes Werk; **Einwilligung der Eltern** für Aufnahmen nötig, besser ohne Namen | 0 € | eine Probe, 15 min Aufnahme | stark und rührend, aber nur für 1–2 Stellen | **später, als Höhepunkt** (unsicher wegen Einwilligung) |
| **Musik im Code** (Web Audio spielt dein Thema mit einfachem Klang, z. B. Glocke oder Celesta) | eigener Code + dein Thema | 0 € | mittel (Klang, Hall) | klingt schnell nach Spielzeug; für Glocken und Spieluhr gut, für Stimmung schwach | nur für „Spieluhr“-Einwürfe |
| **CC0-Musik** (OpenGameArt mit Filter CC0, z. B. „Pack of loopable game music“) | frei, ohne Nennung | 0 € | Suche 30–60 min | gemischt, oft 8-Bit oder Fantasy von der Stange | Notlösung für Schleifen, falls wir doch welche brauchen |
| **CC BY** (incompetech/Kevin MacLeod, CC BY 4.0) | Nennung „Titel – Kevin MacLeod (incompetech.com), CC BY 4.0“ auf der Info-Seite | 0 € | Suche 30 min | solide, aber sehr bekannt (YouTube) | möglich, aber nicht eigen | 
| **Udio** | Seit dem 29.10.2025 (Vergleich mit Universal) **kein Herunterladen mehr**, auch nicht für alte Stücke | – | – | – | **nicht nutzbar** (bestätigt: [loop.fans](https://music.loop.fans/ai/what-happened-to-udio), [musegen](https://www.musegen.ai/blog/udio-review-2026)) |
| **Stable Audio 2.5** | kostenlos laut den meisten Quellen nur privat, bezahlt kommerziell; Preise und Tarifnamen widersprüchlich (etwa 12–30 $/Monat) | ab ~12 $/Monat | Webseite, Handarbeit | gut für Klangflächen und Stimmung | **nicht nötig**, solange ElevenLabs reicht (unsicher: [costbench](https://www.costbench.com/software/ai-music-generators/stable-audio/free-plan/), [fast.io](https://fast.io/resources/stability-ai-review-2026/)) |
| YouTube Audio Library, Pixabay-Musik | nur YouTube bzw. kein Weitergeben der Datei | – | – | – | **nicht ins Repo** (siehe Geräusche-Bericht 4.1) |

**Mischform (Vorschlag, unsicher):** Du schreibst das Thema. Die Einwürfe sind Bruchstücke daraus, von dir gespielt oder in MuseScore gesetzt. Nur wo eine Klangfläche ohne Melodie gebraucht wird (Nebel am Auftakt, Spannung beim Zettel), kommt ElevenLabs dazu, und zwar in **derselben Tonart und demselben Tempo** wie dein Thema: Die Aufforderung nennt zum Beispiel „D minor, 72 bpm, celesta, low strings, no melody“. So passen beide Teile zusammen, obwohl ElevenLabs dein Thema nicht hören kann.

## 4 Rechtslage (kurz)

- **Wem gehört KI-Musik? (Deutschland, bestätigt in Fachbeiträgen, kein Musik-Urteil):** Geschützt sind nur „persönliche geistige Schöpfungen“ (§ 2 UrhG). Rein KI-erzeugte Musik hat danach **keinen Urheber** und ist vermutlich gemeinfrei. Das AG München (13.2.2026, 142 C 9786/25, es ging um Logos) verlangt für Schutz einen deutlichen menschlichen Einfluss; eine lange Aufforderung allein genügt wohl nicht – [CMS](https://cms.law/de/deu/legal-updates/urheberrechtsschutz-oder-frei-verfuegbar-zwei-gerichte-entscheiden-ueber-ki-inhalte), [Taylor Wessing](https://www.taylorwessing.com/de/insights-and-events/insights/2026/02/once-again-no-copyright-proetection-for-ai-generated-output). **Für uns heißt das:** Eine KI-Datei im Repo kann jeder mitnehmen. Das stört nicht, wir geben ja ohnehin frei. Entscheidend sind die Nutzungsbedingungen des Dienstes, und die gelten für dich als Nutzer.
- **Suno:** Bei kostenlos erzeugten Liedern ist Suno Eigentümer, und die Nutzung ist nur nicht kommerziell mit Nennung erlaubt (bestätigt). Gegen Suno laufen Verfahren: Warner hat sich im November 2025 verglichen (bestätigt). Universal und Sony klagen weiter (nachgelesen). **Das LG München I hat am 31.7.2026 (42 O 763/25) der GEMA überwiegend recht gegeben**, nicht rechtskräftig, Suno prüft Berufung. Haftbar ist nach dem Urteil Suno, nicht der Nutzer – [GEMA](https://www.gema.de/de/w/suno-entscheidung-2026), [Bird & Bird](https://www.twobirds.com/en/insights/2026/germany/munich-district-court-rules-on-ai-generated-music-gema-v-suno) (nachgelesen; die GEMA ist Partei). **Risiko für die Schule (unsicher):** gering, solange kein Stück einem bekannten Lied ähnelt. Der Ruf ist aber schwierig, wenn eine Schul-App gerade den Dienst nutzt, der vor Gericht verloren hat.
- **ElevenLabs:** Nach Angaben von ElevenLabs mit lizenzierten Daten trainiert (bestätigt in mehreren Berichten, z. B. [invideo](https://invideo.io/blog/elevenlabs-music-ai-generator/)). Bezahlt ist die Nutzung kommerziell erlaubt, ausgenommen Film, Fernsehen, Radio und „Studio Games“ (nachgelesen). Zur Weitergabe der Datei in einem öffentlichen Repo habe ich nichts gefunden (**unsicher**). Für die Geräusche gab es ein Verbot, sie als Einzeldatei zu verkaufen (Geräusche-Bericht 4.5); Verschenken in einer App ist etwas anderes, aber nicht geprüft. **Bitte selbst nachlesen:** `elevenlabs.io/eleven-music-model-specific-terms` (Abschnitte „Permitted Use“ und „Studio Games“).
- **Udio, Stable Audio:** Udio scheidet aus (kein Herunterladen). Bei Stable Audio sind die Bedingungen nicht gelesen (unsicher).

## 5 Einsatz im Spiel

**Grundsatz (bestätigt für Breath of the Wild, sonst unsicher):** Gute Spiele mit wenig Musik lassen meist **Wind, Schritte und Stimmen** die Welt tragen. Musik setzen sie nur bei Ereignissen ein, sparsam und eher hoch, mit viel Stille dazwischen – [IADT-Aufsatz](https://onshow.iadt.ie/sites/default/files/2026-05/Padraig%20Gilmore%20Critical%20Essay.docx), [A Closer Listen](https://acloserlisten.com/2018/04/03/press-a-the-music-of-zelda-breath-of-the-wild/), [Zelda Dungeon](https://www.zeldadungeon.net/musical-musings-listening-closely-to-the-emptiness-of-breath-of-the-wilds-hyrule-field-day/). Ein zweites Vorbild ist Untitled Goose Game: Dort spielt Debussy-artiges Klavier nur, wenn etwas passiert (unsicher, Vorwissen; im Geräusche-Bericht nur der Klang-Teil belegt). Zu A Short Hike habe ich nichts gefunden.

**Die drei Arten:**
- **Einwurf** (2–8 s): Er belohnt und markiert, zum Beispiel bei Fund, Tür, gelöstem Rätsel oder einem Witz. Er nutzt sich schnell ab, deshalb kommt jede Art höchstens einmal je Ereignis und in 2–3 Fassungen.
- **Durchkomponiertes Stück** (20–40 s): für Zwischensequenzen, weil deren Länge feststeht. Das ist der einfachste Fall, denn das Stück wird genau auf die Kamerafahrt gelegt.
- **Schleife**: Sie läuft unter dem freien Spielen. Sie kostet Arbeit (nahtlos schneiden) und ermüdet. **Vorerst keine**, im Hof und im Guard Room trägt der Raumklang.
- **Stille als Mittel**: Kurz bevor etwas Wichtiges passiert (der Zettel, die leere Dose), wird auch die Umgebung leiser. Die Kinder merken, dass etwas kommt.

**Vorschlag für die erste Szene (höchstens acht Augenblicke, Längen unsicher, Art = Wer macht's):**
| # | Augenblick | Länge | Art | Vorschlag Quelle |
|---|---|---|---|---|
| 1 | **Auftakt** bei Nacht: Nebel, Uhr schlägt, sieben Raben, Sergeant rennt | 35 s | durchkomponiert, auf die Kamerafahrt gelegt; Hauptthema leise, dann Tempo, wenn der Sergeant rennt | dein Thema + ElevenLabs-Fläche oder ganz ElevenLabs |
| 2 | Erster eigener Schritt im Hof (Kamera übergibt an das Kind) | 3–4 s | Einwurf, dann Ausklang in **Stille** | dein Thema (Schlusswendung) |
| 3 | Gary klettert aus dem Fass | 2 s | Witz-Einwurf (Fagott oder Pizzicato) | du oder ElevenLabs |
| 4 | **Schlüssel gefunden** / Rabe bringt ihn | 3 s | **Markenzeichen**: die ersten vier Töne des Themas auf Celesta + Schlüssel-Geräusch | dein Thema (immer gleich, in jedem Kapitel) |
| 5 | Tür zum Guard Room geht auf | 4–6 s | Einwurf, warm, dann Raumklang | dein Thema (Variante) |
| 6 | Zettel hinter der Uhr (Wendepunkt) | 6–8 s | Spannungs-Einwurf nach 1 s Stille | ElevenLabs-Fläche oder tiefe Streicher |
| 7 | Arthur, richtige Antwort | 2–3 s | Rätsel-gelöst-Einwurf (Kadenz des Themas) | dein Thema |
| 8 | **Schluss und Haken** (Treppe, Kuchenduft, jemand singt) | 20–25 s | durchkomponiert; endet offen, ohne Schlussakkord. Das „Singen“ könnte der Kinderchor sein | dein Thema / Chor |

Zusammen etwa 80 Sekunden Musik in 10–15 Minuten Spiel (unsicher, Vorschlag). Musik kommt nie gleichzeitig mit dem Lob der Figuren: Erst spricht die Figur, dann kommt der Einwurf.

## 6 Technik (nur was über den Geräusche-Bericht hinausgeht)

- **Fünfte Schiene „Musik“** im Klang-Modul: ein eigener Lautstärke-Knoten vor dem Sicherheitsbegrenzer, mit eigenem Regler im Menü (Stimmen · Geräusche · Musik). Ein Kind kann so die Musik abschalten und die Stimmen behalten (unsicher, Vorschlag).
- **Ein- und Ausblenden:** Musik nie hart abbrechen. Beim Ende einer Zwischensequenz in 1–2 s ausblenden (`gain.setTargetAtTime(0, t, 0.4)`). Einwürfe dürfen hart beginnen, klingen aber natürlich aus. Zwei Musikstücke nie gleichzeitig, das neue blendet das alte in 0,5 s aus (unsicher, übliche Werte).
- **Leiser unter der Stimme:** Musik stärker absenken als die Umgebung, etwa −10 bis −12 dB statt −6 bis −9 dB, weil Musik mit Melodie die Aussprache stärker verdeckt als Rauschen. Langsamer zurückführen (etwa 0,8 s). In Zwischensequenzen ist die Musik von vornherein so gemischt, dass die Stimme darüber liegt (unsicher).
- **Lautheit:** Musikstücke um −22 bis −24 LUFS, also hörbar leiser als die Stimmen (−16), Einwürfe nach Gehör (zu kurz für LUFS, siehe Geräusche-Bericht 6). ffmpeg `loudnorm` wie bei den Stimmen (unsicher).
- **Nahtlose Schleifen** (falls später nötig): Die MP3-Lücke gilt auch hier (Geräusche-Bericht 5.3). Zusätzlich gilt für Musik: Eine Schleife nur im Takt schneiden (Länge = ganze Takte, aus Tempo berechnet) und `loopStart/loopEnd` am AudioBuffer setzen. Bei ElevenLabs gibt es keine Schleifen-Einstellung, also das Stück länger erzeugen und eine Stelle im Takt herausschneiden (unsicher).
- **Dateigröße:** Musik in Stereo, MP3 128 kbit/s. Das sind etwa 1 MB je Minute zum Herunterladen, aber entschlüsselt etwa 21 MB je Minute im Speicher (44,1 kHz, Stereo, 32 bit; Rechnung). 80 Sekunden Musik der ersten Szene: etwa 1,3 MB im Offline-Speicher, aber knapp 30 MB entschlüsselt. **Deshalb:** Stücke erst kurz vor der Szene entschlüsseln und danach freigeben; Einwürfe dürfen dauerhaft im Speicher bleiben (wenige Sekunden). Für Zwischensequenzen ginge auch das Audio-Element statt eines AudioBuffers, dann muss der Service Worker aber die Range-Anfragen von Safari beantworten (Geräusche-Bericht 5.3), und die Lautstärke lässt sich auf dem iPad nicht regeln (Geräusche-Bericht 5.1). Also besser alles über Web Audio.
- **Stummschalter:** Entschieden ist, dass er beachtet wird (`'ambient'`). Für Musik ist nichts Neues zu tun, Web Audio ist dann auf dem iPad stumm wie alles andere.

## 7 Empfehlung

**Reihenfolge:** (1) Geräusche nach dem Geräusche-Bericht, Klang-Modul gleich mit Musik-Schiene. (2) Nach den GLN schreibst du das Hauptthema; ich schlage vor, nach dem 25.11. an einem ruhigen Abend. (3) Die Einwürfe 2, 4, 5, 7 entstehen aus dem Thema, als MuseScore-Datei und MP3. (4) Erst dann entscheiden wir, ob Auftakt (1), Zettel (6) und Schluss (8) eine ElevenLabs-Fläche bekommen oder ob dein Thema allein trägt. (5) Später: der Kinderchor für den Schluss oder The Den.

**Günstigster brauchbarer Weg:** dein Thema + ElevenLabs im bestehenden Creator-Tarif.
- **Kosten im Monat:** 0 € zusätzlich. An Credits einmalig etwa 4.000–8.000 für die erste Szene, je weiteres Kapitel ähnlich viel (unsicher).
- **Aufwand je Stück:** eigener Einwurf 15–30 min. ElevenLabs-Stück über das Skript etwa 10 min für Aufforderung und Anhören plus 1–2 Minuten Rechenzeit; über die Webseite etwas mehr. Suno-Stück 5–10 min Handarbeit plus Pro-Konto.
- **Vor dem Start:** ElevenLabs-Bedingungen „Studio Games“ lesen und dem Schlüssel „School“ das Recht Music Generation geben. Erst danach kann ein Bau-Chat das Skript schreiben, und Aufrufe gehen nur mit deinem OK im Bau-Chat.

**Schlanke Variante:** nur dein Thema in drei Längen (Auftakt 30 s, Einwurf 3 s, Schluss 20 s), am Klavier oder in MuseScore. Keine KI, keine neuen Kosten, keine Rechtsfragen.

## Drei Proben für dich (je etwa 10 Minuten)

1. **ElevenLabs im Browser** (kostet etwa 500–1.000 Credits, deine Entscheidung): Gehe auf elevenlabs.io in den Bereich „Music“. Erzeuge zuerst einen 5-Sekunden-Einwurf mit „Instrumental, celesta and pizzicato strings, a magical key is found, short and bright, D major, ends on a held note“. Dann ein 30-Sekunden-Stück mit „Instrumental, mysterious night at an old castle in London, fog, low strings and soft celesta, slow, D minor, 72 bpm, no drums, cinematic but gentle for children“. Darauf achten: Klingt es nach Kinderfilm oder nach Werbung, und passt es zu dir?
2. **Suno kostenlos anhören** (kostet nichts, Konto nötig, nichts herunterladen): dieselben zwei Aufforderungen auf suno.com mit dem Schalter „Instrumental“. Vergleiche nur den Klang. Wenn Suno deutlich besser ist, müssten wir über Pro reden.
3. **Dein Thema als Handy-Skizze** (kostet nichts): Spiel 8 Takte am Klavier und nimm sie mit dem Handy auf. Dann spiel nur die ersten vier Töne einmal hoch (Schlüssel) und die letzten zwei Takte langsam (Schluss). Lege die drei Aufnahmen neben Probe 1. Die Frage ist: Was davon würden die Kinder nach dem Spiel summen?

---

## Grenzen dieser Recherche

- **Gesperrt** (nur Suchauszüge gelesen): suno.com, help.suno.com, elevenlabs.io (auch Preise und Musik-Bedingungen), udio.com, stableaudio.com, opengameart.org, incompetech.com, freemusicarchive.org. Gelesen wurde nur `raw.githubusercontent.com` (ElevenLabs-Referenz) und dein Kontostand über die Schnittstelle.
- **Nicht nachgelesen und deshalb unsicher:** die genauen Credits je Minute bei ElevenLabs (900 ist eine Fremdangabe; bitte in der Webseite vor dem Erzeugen ablesen, sie zeigt die Kosten an); der volle Wortlaut zu „Studio Games“ und zur Weitergabe der Datei; ob dein Creator-Tarif Musik-Minuten begrenzt (ein Test nennt weniger als die Werbung); Sunos Modellversion und Längen im kostenlosen Konto; die Bedingungen von Stable Audio; die Lizenz einzelner CC0-Stücke.
- **Nicht gefunden:** belegte Aussagen zur Musik in A Short Hike; Werte, wie stark Musik unter Kinderstimmen abgesenkt werden sollte; Rechtsprechung zu KI-Musik (nur zu Logos und Texten).
- **Nichts angehört, nichts erzeugt.** Ob ElevenLabs oder Suno für „Kinder, Nacht, Tower“ gut klingen, zeigen erst die Proben.
- **Selbst nachsehen kannst du:** Suno-Preise und Downloads unter suno.com/pricing und help.suno.com („Upcoming Changes FAQ“); ElevenLabs unter elevenlabs.io/pricing und elevenlabs.io/eleven-music-model-specific-terms; das Schlüssel-Recht unter elevenlabs.io → Developers → API Keys → „School“ → Music Generation.
