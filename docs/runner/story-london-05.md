# London Run – Kapitel 5 „Wembley“ · „The Big Match“ · Text freigegeben 1.11.2026 (Mr. Alex), Bau freigegeben, Vertonung nach dem 13.11. (Credits)

**Status: gebaut (1.11.2026), Vertonung nach dem 13.11.** Welt `wembley` in der Engine `app/klasse9/runner.js` (`MUSTER_WEMBLEY_STORY`, `STRUKTUR_WEMBLEY` mit Variante `tube.g1` und Ende-Abschnitt `ende: 'zaehlung'` (E1/E2/E3 nach `story.gute`), rollende Bälle `h.ball` (drüberspringen oder köpfen `ballKoepfen`), Tribünen-Plattformen `h.tribuene` (Weg A) mit Toilettenblock `h.toilette` (nach ♪A8 tritt der Sergeant die Tür ein, `tuerTritt`), Spielertunnel `h.spielertunnel` (Weg B, dunkel) mit Federn `h.federn`, Kulissen `vorplatzDeko`/`tribuenenDeko`/`spielertunnelDeko`/`rasenDeko`/`anzeigeDeko`, Geist schwebend `h.geist(dx, false, y)` oder auf der Bank, Rabe nur bei Variante B (`rabeMit`, `wembleyRabe`), Boss `wembleyBoss`, Tür `spielfeldTor`, Film `filmZeichnenWembley` (drei Enden) + `filmTitel` „Ending 1/2/3 (1 of 3)“; Kopie `app/runner.js`), App `app/app.js` (`STORY.wembley` mit diesem Text, `STORY_KEYS_WEMBLEY`, `STORY_GUT`/`storyGute()`, `storyOption` mit vier Varianten + `gute`, `storyEndeLabel`, Story Library fünf Kapitel mit 🔒-Hinweis „Andere Entscheidungen in Welt 2–4“, Trophäe „Match Winner“ 🏟️, Enden E1 🏆 „The Sergeant scores“ / E2 👻 „The ghost scores“ / E3 🎩 „Bounce“). Details `docs/runner/konzept-entwurf.md` Abschnitt 23. Audio: noch keine Dateien – `werkzeuge/story_audio.py --zaehlen` → wembley 23 Stücke (22 Texte + „The story so far.“), 1.489 Zeichen; `werkzeuge/runner_audio.py --zaehlen` → 5 Dateien `app/audio/runner/wembley_*.mp3`, 158 Zeichen („Halt! Sergeant Bearskin guards the pitch!“, „Correct – the pitch gate opens. Kick-off!“, „Not this time, soldier!“, „Let's find Wembley Stadium!“, „You found Wembley Stadium!“); bis dahin Geräte-Stimme. Test `runner6_welt5.js` (Scratchpad).

**Sprache in diesem Kapitel (Regel `story-sprache.md`):** KERN aus Unit 3 Topic 3 „planning to meet“ („Are you free after the match?“, „Let's have tea.“, „I'd love to.“) und Story-Gefühle (angry, sad, surprised, happy); aus Unit 4 (gesichert, Buch): „I can hear / I can smell“, Fragen mit do/does + Kurzantworten („Does anybody know the referee? – No, I don't. / Yes, I do!“, „Does he ever move?“). WIEDERHOLT: Häufigkeit (never, always, rarely), Uhrzeit, Adjektive (dark, big, black, shiny). DARÜBER HINAUS (erlaubt seit 1.11.): simple past einmalig „He never moved. Today he did.“; Fußball-Wortfeld vollständig und realistisch (referee, whistle, kick-off, pitch, goalkeeper, goal, stands, tunnel, big screen, chips, ninety thousand), Kontextwörter stuck, locked, feathers, scare, bounce.

## Fortlaufende Geschichte – Zählung
Liest `story.tube.wahl.g1` (A = zurückgegangen, B = weitergefahren mit Rabe) für die Stücke 1–2. **Ende nach Zählung der guten Entscheidungen:** Welt 2 `story.londoneye.wahl.g1 === "B"` (aufs Rad geklettert) + Welt 3 `story.towerbridge.wahl.g1 === "A"` (Raben gerettet) + Welt 4 `story.tube.wahl.g1 === "A"` (zurückgegangen). 3 gute → Ende 1 · 1–2 → Ende 2 · 0 → Ende 3. Die Gabelung dieses Kapitels (A Tribünen / B Tunnel) wird als `story.wembley.wahl.g1` gespeichert, zählt aber nicht. Alle drei Enden sind lustig, keins ist eine Strafe; andere Enden sind nur über andere Entscheidungen in Welt 2–4 erreichbar (Wiederspielen lohnt sich). Der Geist (Ghost Club) ist in allen Varianten dabei; der Rabe nur in Variante B.

## Kapitel 5 · Wembley – „The Big Match“
12 Kristalle je Lauf: Anfang 4 (1–2 je nach Welt 4) · Gabelung (A Tribünen / B Tunnel) 4 · gemeinsam 2 · Ende 2 (je nach Zählung). Stationen nach 4 und nach 8.

**Anfang** (1–2 je nach Welt 4: A = zurückgegangen, B = weitergefahren)
- 1A. Saturday, 3 p.m. Match day! The ghost is here too. He never pays.
- 2A. "Are you free after the match?" the Sergeant asks. "Let's have tea."
- 1B. Saturday, 3 p.m. Match day! The raven sits on the Sergeant's hat.
- 2B. "Are you free after the match?" the Sergeant asks. "I'd love to," you say.
3. Ninety thousand people. I can hear them. I can smell the chips.
4. Then the big screen says: KICK-OFF IN 10 MINUTES. NO REFEREE!

*Station 1*

**Gabelung – hinauf (A): durch die Tribünen**
- A5. You run up the stands. Row after row. Does anybody know the referee?
- A6. "No, I don't," says a man. "No, I don't," says a woman. "Yes, I do!" A boy.
- A7. The referee is stuck in the toilet! Door locked. He feels angry and sad.
- A8. The Sergeant kicks the door. Boom. He feels surprised. The door too.

**Gabelung – hinunter (B): durch den Spielertunnel**
- B5. You run down the tunnel. It's dark and it smells of grass.
- B6. "Does the Sergeant play football?" the ghost asks. "No, he doesn't."
- B7. The referee is here. But his whistle is gone. Who takes a whistle?
- B8. A bird! Black feathers on the floor. Ravens always take shiny things.

*Station 2*

**Gemeinsam**
9. Kick-off! The Sergeant stands at the pitch gate. Still. Like always.
10. "Does he ever move?" asks the ghost. Wait and see.

*Boss: Sergeant Bearskin am Spielfeldtor (Wort-Frage wie bisher)*

**Ende 1 – drei gute Entscheidungen (Schlüssel E1)**
- E1-11. The ball flies to the gate. The Sergeant moves! One step. He kicks. GOAL!
- E1-12. He never moved. Today he did. He feels happy. Don't tell anyone.

**Ende 2 – ein oder zwei (Schlüssel E2)**
- E2-11. The ball flies to the gate. The Sergeant doesn't move. The ghost does!
- E2-12. Ghosts can't kick. But they can scare. The goalkeeper runs away. GOAL!

**Ende 3 – keine (Schlüssel E3)**
- E3-11. The ball flies to the gate. It hits the Sergeant's hat. Bounce. GOAL?
- E3-12. "Not this time, soldier," the referee says. No goal. But what a day!

**Bild:** Stadion-Außenbereich mit Fans, Tribünen als Stufen (Weg A, Sitzreihen, Fahnen, der verschlossene Toilettenblock), Spielertunnel dunkel mit Rasengeruch-Schild (Weg B), Rasen mit rollenden Bällen als Hindernis, Anzeigetafel „KICK-OFF IN 10 MINUTES“, Geist auf allen Wegen, Rabe in Variante B. Boss am Spielfeldtor. Film je Ende mit eigener Figur: E1 Sergeant schießt und jubelt (Stadion singt), E2 Geist erschreckt den Torwart, E3 Ball prallt vom Hut ab, Schiedsrichter schüttelt den Kopf, alle lachen.

**Story Library:** nach Welt 5 zeigt „Dein Weg“ die Kette über fünf Welten und das erreichte Ende; die anderen beiden Enden als 🔒 mit Hinweis „Andere Entscheidungen in Welt 2–4“.

**Stimme:** Erzähler Mr. Alex (auch Sergeant, Geist, Schiedsrichter, Mann/Frau/Junge). Vertonung nach dem 13.11.: `werkzeuge/story_audio.py` (23 Stücke: 22 Texte + „The story so far.“, 1.489 Zeichen) + `werkzeuge/runner_audio.py` (Boss/Start/Ende wembley, 5 Dateien, 158 Zeichen). Bis dahin Geräte-Stimme.
