# Konzept-Entwurf: Französisch-App (persönlich, für Mr. Alex)

Stand: 13.10.2026 (3. Fassung). **Gerüst gebaut (13.10., Mr. Alex: „fang mit dem Gerüst an“):** `app/franzoesisch/` – Startseite, Ma séance du jour (5 + 15, Leitner), Themen mit Écouter et répéter (3 Stufen), Machine à remonter le temps, Trouve l'expression, Punkte/Serien/Titel, Sammlung. Noch ohne Audio (Stimme des Geräts als Notlösung), Karte und Geschichte in Vorbereitung. Humor-Wunsch (13.10.): Dialoge und Geschichte im Assimil-Stil – ein bisschen lustig, ein bisschen schräg (wie die taube Dame im Bus in Lyon). Inhaltsproben zum Durchsehen: `inhalte/franzoesisch/entre_profs.tsv` (20 Wendungen „Entre profs“), `inhalte/franzoesisch/sentiments.tsv` (24 Wendungen „Sentiments et ambiances“).
Grundprinzip wie in den Schul-Apps: Vor jedem Bauschritt fragt Claude, Mr. Alex segnet ab.
Abschnitte mit **[OFFEN]** sind noch zu entscheiden.

---

## 1. Festgelegt (von Mr. Alex, 13.10.2026)

- **Ausgangslage:** Mr. Alex spricht Französisch, der Wortschatz ist aber eingeschränkt, vieles versteht er nicht. Schwerpunkt: **Vokabelaufbau und feste Wendungen** (Ausdrucksweisen, Redewendungen) – nicht Grammatik von null.
- **Zeit:** etwa **10 Minuten am Tag**. Nichts darf überfordern.
- **Wiederholung mit Abstand (Spaced Repetition):** ja, aber sanft (siehe 3).
- **Zeitformen:** Présent, Passé composé, Futur proche zuerst.
- **Oberfläche auf Französisch.** Jeder Text lässt sich antippen und zeigt dann Deutsch.
- **Tonfall:** persönlich, überwiegend **tu**. Gelegentlich **vous** (Fremde ansprechen, Bäckerei, Behörden), weil das Französische da streng ist.
- **Aurélien** (französischer Freund, Lehrer) darf mit Vornamen in den Dialogen vorkommen.
- **Aurélien (Rolle B in den Dialogen): ElevenLabs-Stimme „Julien – Professional“** (ID eOwAMwUJEGkP44SKOXIH, multilingual v2; gewählt 13.10. nach Hörprobe gegen Guillaume und Victor, `docs/franzoesisch/hoerprobe/aurelien_*.mp3`).
- **Stimme: sonst nur Mr. Alex' eigene Stimme** (ElevenLabs-Klon „Alex Langenbach“, Eleven v4, `language_code: fr`, stability 0.5, similarity 0.75). Hörprobe gefällt („klingt super“): `docs/franzoesisch/hoerprobe/alex_fr_1.mp3`. Keine weibliche Stimme.
- **Serien, Punkte, Lob, Sammlung wie bisher** (Schultage-Logik Saarland, On fire, Perfect week, Weekend bonus …).
- **Sammlung:** eine fortlaufende **Geschichte** und eine **Frankreich-Karte** (wie die USA-Karte in Klasse 9). Landeskunde gern nebenbei, auf Bonus-Ebene.

## 2. Lebenswelt → Themen

| # | Thema | Beispiel-Wendungen |
|---|---|---|
| 1 | **Entre profs** – mit Aurélien | *corriger des copies, la récré, je suis crevé, ça s'est bien passé ?* |
| 2 | **Musique et langue** | *chanter juste, le refrain, ça sonne bien, avoir l'oreille* |
| 3 | **Histoires et fantasy** | *il était une fois, la quête, au fond de la forêt, d'un coup* |
| 4 | **Sport et kung-fu** | *s'entraîner, la souplesse, un coup de pied, garder son calme* |
| 5 | **Les chats** | *ronronner, faire un câlin, griffer, il fait sa toilette* |
| 6 | **Manger et bien vivre** | *manger équilibré, se coucher tôt, prendre soin de soi* |
| 7 | **Enfants et bébés** | *faire ses nuits, un doudou, faire des bêtises* |
| ★ | **Sentiments et ambiances** – früh einbauen (Mr. Alex, 13.10.): Gefühle und Stimmungen, auch düster, traurig, melancholisch | *ça me touche, j'ai le cafard, c'est sombre, mélancolique, ça me fend le cœur, je suis ému, inquiétant, apaisant, j'en ai les larmes aux yeux* |
| ⚡ | **Bonus Anglais:** faux amis EN–FR | *actually ≠ actuellement, library ≠ librairie, sensible ≠ sensible* |

Reihenfolge = Vorschlag. „Sentiments et ambiances“ kommt gleich nach „Entre profs“, damit Mr. Alex über das reden kann, was er liebt. Weitere Themen jederzeit ergänzbar.

## 3. Die tägliche Séance (Kern der App)

- Ein großer Knopf **„Ma séance du jour“**, etwa 10 Minuten.
- **Obergrenze pro Tag:** **5 neue Wendungen + höchstens 15 Wiederholungen** (festgelegt 13.10.). In den Einstellungen änderbar.
- **Kein Schuldenberg:** Fällige Karten über der Grenze werden still auf die nächsten Tage verteilt. Keine roten Zahlen.
- **Selbsteinschätzung mit zwei Knöpfen:** „Je savais 😊“ / „Encore 🔁“. Intervalle nach Leitner (z. B. 1 – 3 – 7 – 14 – 30 Tage).
- Am Ende: „C'est fini pour aujourd'hui !“ mit Lob in Mr. Alex' Stimme.
- Alles andere (Themen stöbern, Dialoge, Geschichte, Bonus) ist freiwillig, zählt für Punkte, erhöht aber nie das Pensum.

## 4. Inhalte

- **Wendungen statt Wortlisten.** Anker sind die häufigsten Verben, Nomen und Adjektive. Frequenzquelle: **Lexique 3** (frei, Untertitel-Häufigkeiten = gesprochene Sprache). Erste Stufe etwa 300 Einträge.
  - *faire:* faire attention · ça fait longtemps · ça ne fait rien
  - *avoir:* avoir envie de · avoir hâte de · avoir du mal à · en avoir marre
  - *Kleine Wörter:* du coup · en fait · quand même · ça vaut le coup
- **Jede Wendung in einem ganzen Satz** aus Mr. Alex' Welt (Prinzip „phrasal“ wie in Klasse 9).
- **Zeitmaschine (Verben):** derselbe Satz in drei Zeiten – *Aujourd'hui je prends le train. / Hier j'ai pris le train. / Demain je vais prendre le train.* Später Imparfait, Futur simple; Höflichkeit als feste Wendungen (*je voudrais, pourriez-vous …*).
- **Adjektive im Paar:** *un petit village / une petite ville*; Stellung vor dem Nomen (beau, âge, bon, taille).
- **Musik der Sprache:** Liaison und Enchaînement sichtbar markiert (*les‿enfants*); Wendung erst langsam, dann normal schnell.

## 5. Übungsformen

| Übung | Herkunft |
|---|---|
| Listen and Repeat, 3 Stufen (FR mit Lösung → Lücke → nur Deutsch) | Klasse 9 |
| Abfrage / Find the word (Erklärung auf Französisch → Wendung) | Klasse 9 |
| Dialoge mit Rollen: die App spricht die andere Rolle, du sprichst in die Pause (Aurélien, Bäckerei mit *vous* …) | Klasse 9 Speaking |
| Zeitmaschine (Satz in Présent / Passé composé / Futur proche) | neu |
| Tägliche Séance mit Spaced Repetition | neu |
| Sprechzeit-Sperre, Lob ohne Wiederholung | beide Apps |

Dialoge: Mr. Alex' Stimme spricht beide Rollen. **[OFFEN]** Aurélien fragen, ob er Sätze gegenliest oder seine Rolle selbst einspricht.

## 6. Gamification (wie bisher, angepasst)

- **Punkte, Serien, Wochen-Kalender, Abzeichen:** wie im Gamification-Konzept (Schultage Saarland).
- **Frankreich-Karte – gebaut 13.10.:** Jede fertige Séance **und jeder zum ersten Mal fertige Teil** schalten den nächsten Ort frei, Start in **Metz**. 50 Orte als Reise durch alle 13 Regionen (`inhalte/franzoesisch/orte.tsv`). Karte mit allen **96 Départements** (Mr. Alex, 13.10.: „ich brauche die Departements“; Daten: IGN Admin Express via france-geojson, Licence ouverte); besuchte Départements farbig, Orte als Punkte, Fakt zeigt Ort · Département (Nummer) · Region. Zu jedem Ort ein **Fait amusant** in Mr. Alex' Stimme (antippen = Deutsch). Reisestempel mit Département-Umriss und Klang.
- **Geschichte (Perfect week):** Jede perfekte Woche schaltet ein **Kapitel** einer fortlaufenden Geschichte frei, erzählt in Mr. Alex' Stimme, im Passé composé und Imparfait, mit den Wendungen der Woche. **Festgelegt (13.10.):** Held ist eine **echte Person, ein Franzose** (kein Tier); Genre **Mystery / Suspense** in Frankreich – Paris, ein Abenteuer im Louvre o. Ä. –, mit etwas Fantastischem. **Held (festgelegt 13.10.): Julien Lefèvre**, Lehrer aus Metz, der in den Ferien nach Paris fährt und im Louvre auf ein Geheimnis stößt. Alternativen: Étienne Moreau, Mathieu Garnier.
- **Titel – französische Delikatessen** (Mr. Alex, 13.10.: klein anfangen, bis zur großen Delikatesse): **[OFFEN]** Vorschlag 🥐 Petit éclair → Croissant → Baguette → Crêpe → Fromage → Huîtres → **Caviar**. Alternative: Tour-de-France-Trikots.
- **Lob auf Französisch** in Mr. Alex' Stimme, **[OFFEN]** Liste z. B. *Génial ! · Chapeau ! · Trop fort ! · Magnifique ! · Bravo, champion !*

## 6a. Vorgemerkt: Kategorie „Prononciation“ – Nasallaute (Mr. Alex, 13.10.)

Idee, noch nicht gebaut. Die vier Nasale **[ɑ̃] en/an – [ɔ̃] on – [ɛ̃] in/ain – [œ̃] un** hören und unterscheiden lernen, vor allem das Paar **en ↔ on**.
- **Stufe 1 – Hören und nachsprechen:** Wörter auf Wortbasis, nach Klang sortiert (*enfant, temps, vent* · *bon, pont, mon* · *vin, pain, main* · *un, brun*).
- **Stufe 2 – Gegenüberstellen (Minimalpaare):** *vent – vont · lent – long · banc – bon · sans – son · tant – ton · dent – don*. Hören, dann tippen: welches Wort war das? Zwei Knöpfe.
- **Königsstufe – beide Klänge in einem Wort:** *commençons, montant, pension, mon enfant, en avion, onction, bonbon (on-on), maintenant (in-an)*. Hören, nachsprechen, Klänge markieren.
- Wie überall: Mr. Alex' Stimme, Sprechzeit-Sperre, langsam und dann normal. Später vielleicht auch *é/è* und *u/ou* nach demselben Muster.

## 7. Technik (bewährt)

- Adresse: `app/franzoesisch/` → https://langenbachalex.github.io/School/franzoesisch/
- Inhalte als TSV in `inhalte/franzoesisch/` → Bauskript in `werkzeuge/` → `app/franzoesisch/daten.js`.
- Audio: ElevenLabs, nur fehlende Dateien erzeugen.
- Offline-PWA, eigener Service Worker, kein Konto, Fortschritt nur im Gerät.
- Karte aus freien Geodaten, Bilder mit Quellenangabe.
- Tests mit Playwright.

## 8. Offene Fragen

1. Inhaltsprobe `inhalte/franzoesisch/entre_profs.tsv`: Format und Ton in Ordnung?
2. Held der Geschichte: Name, Beruf, Ausgangspunkt.
3. Titel: Delikatessen-Reihe so in Ordnung, oder Tour de France?
4. Reihenfolge (Mr. Alex, 13.10.): **1. Dialoge mit Aurélien (mit Humor) · 2. Frankreich-Karte · 3. Nasallaute.** Lob-Liste: `docs/franzoesisch/lob-vorschlag.md` (zum Absegnen).
5. Früherer Vorschlag: Audios erzeugen (174 Dateien, ca. 5.100 Zeichen), Veröffentlichung unter `/franzoesisch/` (Option A, 13.10.: Französisch-Branch in den Hauptbranch `claude/awesome-dijkstra-dy57ir` mergen), dann Dialoge mit Aurélien und die Frankreich-Karte.
