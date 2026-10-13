# Konzept-Entwurf: Französisch-App (persönlich, für Mr. Alex)

Stand: 13.10.2026 (2. Fassung). **Noch nichts gebaut.** Inhaltsprobe zum Durchsehen: `inhalte/franzoesisch/entre_profs.tsv` (20 Wendungen „Entre profs“).
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
- **Stimme: nur Mr. Alex' eigene Stimme** (ElevenLabs-Klon „Alex Langenbach“, Eleven v4, `language_code: fr`, stability 0.5, similarity 0.75). Hörprobe gefällt („klingt super“): `docs/franzoesisch/hoerprobe/alex_fr_1.mp3`. Keine weibliche Stimme.
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
- **Frankreich-Karte (täglich):** Jede fertige Séance schaltet einen Ort frei, Start in **Metz** (Nachbar des Saarlands). Etwa 50 Orte über alle 13 Regionen (Strasbourg, Paris, Lyon, Marseille, Mont-Saint-Michel, Bordeaux, Carcassonne, Chamonix …). Zu jedem Ort ein **Fait amusant** auf Französisch in Mr. Alex' Stimme (antippen = Deutsch). Reisestempel mit Klang.
- **Geschichte (Perfect week):** Jede perfekte Woche schaltet ein **Kapitel** einer fortlaufenden Geschichte frei, erzählt in Mr. Alex' Stimme, im Passé composé und Imparfait, mit den Wendungen der Woche. **Festgelegt (13.10.):** Held ist eine **echte Person, ein Franzose** (kein Tier); Genre **Mystery / Suspense** in Frankreich – Paris, ein Abenteuer im Louvre o. Ä. –, mit etwas Fantastischem. **[OFFEN]** Name und Beruf des Helden (Vorschlag: ein Lehrer aus Metz, der in den Ferien nach Paris fährt).
- **Titel – französische Delikatessen** (Mr. Alex, 13.10.: klein anfangen, bis zur großen Delikatesse): **[OFFEN]** Vorschlag 🥐 Petit éclair → Croissant → Baguette → Crêpe → Fromage → Huîtres → **Caviar**. Alternative: Tour-de-France-Trikots.
- **Lob auf Französisch** in Mr. Alex' Stimme, **[OFFEN]** Liste z. B. *Génial ! · Chapeau ! · Trop fort ! · Magnifique ! · Bravo, champion !*

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
4. Nächster Schritt – Vorschlag: Thema „Sentiments et ambiances“ als zweite Inhaltsprobe, dann Bau des App-Gerüsts.
