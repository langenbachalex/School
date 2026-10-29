# Hörverstehen 3 „Talking about free time“ – Vorschlag (Klasse 6, GLN-2-nah, nichts gebaut)

Stand: 29.10.2026. Text und Aufgaben: `docs/hoerverstehen/03-talking-about-free-time.entwurf.txt` (Entwurf; kommt nach Freigabe nach `inhalte/hoeren/`). Keine echte GLN-Aufgabe, nur gleiches Format und Thema.

## Warum schwerer als 01/02
| | 01 Mia's Monday / 02 How do you get there? | 03 Talking about free time |
|---|---|---|
| Sprecher | 1 bzw. 4, je 2–3 Sätze | 5 Sprecher (Mia, Ben, Priya, Luca, Noah – die Figuren aus dem Unterricht), je 4–5 Sätze, ≈ 170 Wörter |
| Infos pro Person | 1 (true/false) bzw. 2 (Weg + Gefühl) | **3**: AG, Tag/Uhrzeit, Gefühl |
| Ablenker | keine | AG-Liste mit 8 Angeboten, nur 5 kommen vor (trampolining wird genannt, ist aber *nicht* Bens AG) |
| Fallen | – | a.m./p.m. (8 a.m. vs. 8 p.m.), half past three, „I don't like it“ trotz „I'm good“, never vs. sometimes, „it's OK“ = beides |
| Zweite Aufgabe | – | richtig / falsch / **nicht gesagt** (die Falle aus dem Reading, jetzt auch beim Hören) |
| Wortschatz | Topic 1 | Topic 2 (club, drama, hike, trampolining, sometimes/never, competition, prize, article, I'd love to, sea) |

## Ablauf in der App (wie abgesegnet, Station 6)
Erst lesen, dann zwei komplette Durchgänge, währenddessen markieren; danach Hinweis „Im GLN gibt es nur zwei Hörversuche“, dann Lösung mit Audio und Text zum Mitlesen. Neu für 03: **zwei Aufgaben nacheinander** (erst Zuordnen, dann richtig/falsch/nicht gesagt), beide mit demselben Hörtext; der Text wird vor Teil 2 nicht noch einmal automatisch gespielt (zwei Hörversuche insgesamt, wie im GLN).

## Was dafür gebaut werden muss
- Neue Aufgabenart **„zuordnen“** (Person → AG aus Liste, Tag/Uhrzeit aus Liste, 😊/😟/😊😟) in `werkzeuge/hoeren.py`, `daten_bauen.py`, `app/app.js` – wie „weg“, nur mit frei wählbaren Spalten und Ablenkern. ≈ 1 Tag.
- Dritte Antwort **„nicht gesagt“** bei true/false (Hörtext-Variante). ≈ 2 Stunden.
- Audio: 5 Sprechertexte ≈ 1.050 Zeichen + Lösungen (Aussagen/Zuordnungen) ≈ 600 Zeichen = **≈ 1.650 Zeichen Mr. Alex** (alle Stimmen Mr. Alex, wie bisher in Klasse 6; Frau/Mann-Markierung (f)/(m) bleibt für später). Nach V4-Beobachtung ≈ 800 Credits – passt vor dem 13.11., wenn gewünscht.

## Offene Fragen an Mr. Alex
1. Passt das Format zur geplanten GLN-2-Aufgabe (Zuordnen mit mehreren Infos + richtig/falsch)? Oder ist die GLN-Aufgabe anders (z. B. Multiple Choice)? Dann passe ich an.
2. Texte so in Ordnung (Namen, Uhrzeiten, Fallen)? Zu schwer / zu leicht?
3. Jetzt vertonen (≈ 800 Credits) oder bis 13.11. warten?
