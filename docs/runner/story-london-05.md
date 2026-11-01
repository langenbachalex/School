# London Run – Kapitel 5 „Wembley“ · „The Big Match“ · Text freigegeben 1.11.2026 (Mr. Alex), Bau freigegeben, Vertonung nach dem 13.11. (Credits)

**Status: gebaut (Nationalspieler-Fassung 1.11.), Vertonung nach dem 13.11.** Welt `wembley` in der Engine `app/klasse9/runner.js` (`MUSTER_WEMBLEY_STORY`, `STRUKTUR_WEMBLEY` mit Variante `tube.g1` und Ende-Abschnitt `ende: 'zaehlung'` (E1/E2/E3 nach `story.gute`), rollende Bälle `h.ball` (drüberspringen oder köpfen `ballKoepfen`), Tribünen-Plattformen `h.tribuene` (Weg A) mit Toilettenblock `h.toilette` (nach ♪A8 tritt der Sergeant die Tür ein, `tuerTritt`), Spielertunnel `h.spielertunnel` (Weg B, dunkel) mit Federn `h.federn`, Kulissen `vorplatzDeko`/`tribuenenDeko`/`spielertunnelDeko`/`rasenDeko`/`anzeigeDeko`, Geist schwebend `h.geist(dx, false, y)` oder auf der Bank, Rabe nur bei Variante B (`rabeMit`, `wembleyRabe`), Boss `wembleyBoss`, Tür `spielfeldTor`, Film `filmZeichnenWembley` (drei Enden) + `filmTitel` „Ending 1/2/3 (1 of 3)“; **Nationalspieler-Fassung 1.11.:** Kulissen-Spieler auf dem Rasen `wembleySpielerListe`/`nationalspieler` (England weiß mit Namensschild + Rückennummer KANE 9, BELLINGHAM 10, SAKA 7, FODEN 11, RICE 4, Torwart PICKFORD 1 im Tor, Schottland dunkelblau ohne Namen), Fan-Schilder `fanSchild` „COME ON ENGLAND“ / „IT'S COMING HOME“ / „THREE LIONS“ (Vorplatz, Tribünenwand, Rasen-Tribünen, Film), Anzeigetafel wechselt alle 3 s (KICK-OFF IN 10 MINUTES / NO REFEREE! / ENGLAND 0 – 0 SCOTLAND), Sprüche „Come on, England! 🦁“ (erstes Betreten des Rasens), „What a header! ⚽“ (Kopfball), „Kick-off! ⚽“ (Boss richtig); Film: Kane jubelt in E1 neben dem Sergeant („What a strike, Sergeant!“), der schottische Torwart (dunkelblau) rennt in E2 weg, Pickford lacht in E3; Kopie `app/runner.js`), App `app/app.js` (`STORY.wembley` mit diesem Text, `STORY_KEYS_WEMBLEY`, `STORY_GUT`/`storyGute()`, `storyOption` mit vier Varianten + `gute`, `storyEndeLabel`, Story Library fünf Kapitel mit 🔒-Hinweis „Andere Entscheidungen in Welt 2–4“, Trophäe „Match Winner“ 🏟️, Enden E1 🏆 „The Sergeant scores“ / E2 👻 „The ghost scores“ / E3 🎩 „Bounce“). Details `docs/runner/konzept-entwurf.md` Abschnitt 23. Audio: noch keine Dateien – `werkzeuge/story_audio.py --zaehlen` → wembley 23 Stücke (22 Texte + „The story so far.“), 1.707 Zeichen; `werkzeuge/runner_audio.py --zaehlen` → 5 Dateien `app/audio/runner/wembley_*.mp3`, 158 Zeichen („Halt! Sergeant Bearskin guards the pitch!“, „Correct – the pitch gate opens. Kick-off!“, „Not this time, soldier!“, „Let's find Wembley Stadium!“, „You found Wembley Stadium!“); bis dahin Geräte-Stimme. Test `runner6_welt5.js` (Scratchpad).

**Sprache in diesem Kapitel (Regel `story-sprache.md`):** KERN aus Unit 3 Topic 3 „planning to meet“ („Are you free after the match?“, „Let's have tea.“, „I'd love to.“) und Story-Gefühle (angry, sad, surprised, happy); aus Unit 4 (gesichert, Buch): „I can hear / I can smell“, Fragen mit do/does + Kurzantworten („Does anybody know the referee? – No, I don't. / Yes, I do!“, „Does he ever move?“). WIEDERHOLT: Häufigkeit (never, always, rarely), Uhrzeit, Adjektive (dark, big, black, shiny). DARÜBER HINAUS (erlaubt seit 1.11.): simple past einmalig „He never moved. Today he did.“; Fußball-Wortfeld vollständig und realistisch (referee, whistle, kick-off, pitch, goalkeeper, goal, stands, tunnel, big screen, chips, ninety thousand), Kontextwörter stuck, locked, feathers, scare, bounce; **Fußballsprüche** (Mr. Alex 1.11.): „Come on, England!“, „It's coming home!“, „He shoots, he scores!“, „Top corner!“, „What a strike!“, „The ball is in the back of the net!“, „Over the bar!“, „Offside!“; **Nationalspieler** (Namen und Rückennummern, keine Bilder): Harry Kane 9, Jude Bellingham 10, Bukayo Saka 7, Phil Foden 11, Declan Rice 4, Jordan Pickford 1; Gegner Schottland.

## Fortlaufende Geschichte – Zählung
Liest `story.tube.wahl.g1` (A = zurückgegangen, B = weitergefahren mit Rabe) für die Stücke 1–2. **Ende nach Zählung der guten Entscheidungen:** Welt 2 `story.londoneye.wahl.g1 === "B"` (aufs Rad geklettert) + Welt 3 `story.towerbridge.wahl.g1 === "A"` (Raben gerettet) + Welt 4 `story.tube.wahl.g1 === "A"` (zurückgegangen). 3 gute → Ende 1 · 1–2 → Ende 2 · 0 → Ende 3. Die Gabelung dieses Kapitels (A Tribünen / B Tunnel) wird als `story.wembley.wahl.g1` gespeichert, zählt aber nicht. Alle drei Enden sind lustig, keins ist eine Strafe; andere Enden sind nur über andere Entscheidungen in Welt 2–4 erreichbar (Wiederspielen lohnt sich). Der Geist (Ghost Club) ist in allen Varianten dabei; der Rabe nur in Variante B.

## Kapitel 5 · Wembley – „The Big Match“
12 Kristalle je Lauf: Anfang 4 (1–2 je nach Welt 4) · Gabelung (A Tribünen / B Tunnel) 4 · gemeinsam 2 · Ende 2 (je nach Zählung). Stationen nach 4 und nach 8.

**Anfang** (1–2 je nach Welt 4: A = zurückgegangen, B = weitergefahren)
- 1A. Saturday, 3 p.m. England v Scotland at Wembley! The ghost is here too. He never pays.
- 2A. "Are you free after the match?" the Sergeant asks. "Let's have tea."
- 1B. Saturday, 3 p.m. England v Scotland at Wembley! The raven sits on the Sergeant's hat.
- 2B. "Are you free after the match?" the Sergeant asks. "I'd love to," you say.
3. Ninety thousand people. I can hear them: "Come on, England!" I can smell the chips.
4. Then the big screen says: KICK-OFF IN 10 MINUTES. NO REFEREE!

*Station 1*

**Gabelung – hinauf (A): durch die Tribünen**
- A5. You run up the stands. Row after row. Does anybody know the referee?
- A6. "No, I don't," says a man. "No, I don't," says Bukayo Saka. "Yes, I do!" A boy.
- A7. The referee is stuck in the toilet! Door locked. He feels angry and sad.
- A8. The Sergeant kicks the door. Boom. He feels surprised. The door too.

**Gabelung – hinunter (B): durch den Spielertunnel**
- B5. You run down the tunnel. It's dark and it smells of grass.
- B6. "Does Harry Kane play today?" the ghost asks. "Yes, he does. And Phil Foden too."
- B7. The referee is here. But his whistle is gone. Who takes a whistle?
- B8. A bird! Black feathers on the floor. Ravens always take shiny things.

*Station 2*

**Gemeinsam**
9. Kick-off! Kane, Bellingham, Saka and Foden run. "It's coming home!" sings the crowd.
10. The Sergeant stands at the pitch gate. Still. "Does he ever move?" asks Declan Rice.

*Boss: Sergeant Bearskin am Spielfeldtor (Wort-Frage wie bisher)*

**Ende 1 – drei gute Entscheidungen (Schlüssel E1)**
- E1-11. Bellingham passes. The Sergeant moves! One step. He shoots, he scores! Top corner!
- E1-12. He never moved. Today he did. "What a strike, Sergeant!" Harry Kane laughs.

**Ende 2 – ein oder zwei (Schlüssel E2)**
- E2-11. Kane shoots. The ball flies to the gate. The Sergeant doesn't move. The ghost does!
- E2-12. Ghosts can't kick. But they can scare. The Scottish goalkeeper runs away. The ball is in the back of the net!

**Ende 3 – keine (Schlüssel E3)**
- E3-11. Saka shoots. It hits the Sergeant's hat. Bounce. Over the bar! GOAL?
- E3-12. "Not this time, soldier," the referee says. Offside! Jordan Pickford laughs. What a day!

**Bild:** Stadion-Außenbereich mit Fans, Tribünen als Stufen (Weg A, Sitzreihen, Fahnen, der verschlossene Toilettenblock), Spielertunnel dunkel mit Rasengeruch-Schild (Weg B), Rasen mit rollenden Bällen als Hindernis und den Nationalspielern als Kulisse (weiße Trikots mit Namensschild und Rückennummer, Pickford im Tor, Schottland dunkelblau ohne Namen; keine Bildnisse, keine Wappen/Logos), Fan-Schilder „COME ON ENGLAND“ / „IT'S COMING HOME“ / „THREE LIONS“, Anzeigetafel „KICK-OFF IN 10 MINUTES“ / „NO REFEREE!“ / „ENGLAND 0 – 0 SCOTLAND“ im Wechsel, Geist auf allen Wegen, Rabe in Variante B. Boss am Spielfeldtor. Film je Ende mit eigener Figur: E1 Sergeant schießt und jubelt (Stadion singt, Kane jubelt neben ihm), E2 Geist erschreckt den schottischen Torwart, E3 Ball prallt vom Hut ab, Schiedsrichter schüttelt den Kopf, alle lachen (Pickford mit).

**Story Library:** nach Welt 5 zeigt „Dein Weg“ die Kette über fünf Welten und das erreichte Ende; die anderen beiden Enden als 🔒 mit Hinweis „Andere Entscheidungen in Welt 2–4“.

**Stimme:** Erzähler Mr. Alex (auch Sergeant, Geist, Schiedsrichter, Mann/Frau/Junge). Vertonung nach dem 13.11.: `werkzeuge/story_audio.py` (23 Stücke: 22 Texte + „The story so far.“, 1.707 Zeichen) + `werkzeuge/runner_audio.py` (Boss/Start/Ende wembley, 5 Dateien, 158 Zeichen). Bis dahin Geräte-Stimme.
