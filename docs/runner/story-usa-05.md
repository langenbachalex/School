# Road Trip Run – Kapitel 5 „Golden Gate“ · „The Last Gate“ · Text freigegeben 2.11.2026 (Mr. Alex), Bau (volle Variante) freigegeben, Vertonung nach dem 13.11.

**Status: Kapitel 5 gebaut (2.11.2026), Vertonung nach dem 13.11.** Welt-Id `ca`, Story-Schlüssel `ca`: Engine `app/klasse9/runner.js` (`STRUKTUR_CA` mit Variante aus `story.sd.wahl.g2`, Strecke `MUSTER_CA_STORY`, Gabelung 2 nach dem Boss als Auswahl im Frage-Fenster, Ende nach Zählung `E1/E2/E3`, Realm `MUSTER_REALM_5` = Eisbrücke `REALM_WELT_5`, Film `filmZeichnenCA`; Kopie `app/runner.js`), App `app/klasse9/app.js` (`STORY.ca` mit diesem Text wörtlich, `STORY_GUT`/`storyGute()`, `storyOption` übergibt `sd.g2` + `gute`, Story Library Kapitel 1–5 mit „Dein Weg“ und „✦ Chapter 6 – coming soon“, Startseite Welt 5). Details `docs/runner/konzept-entwurf.md` Abschnitt 25. Audio: Sprecherplan in `werkzeuge/story_audio9.py` (`--zaehlen --welt ca`: 66 Dateien, 2.680 Zeichen), bis dahin Geräte-Stimme.

**Sprache (Regel `story-sprache.md`):** KERN if-clauses Typ 2 (Unit 1: „If I had a car, I would …“, „If we were faster, we would …“, „If I give it to you, will you …?“ Typ 1), passive (Unit 3: „was stolen“, „was built in 1937“, „was painted“), newspaper headlines und Warnschilder (Unit 3), Wortfeld San Francisco/Küste (coast, bay, sea lions, foghorn, cliffs, waves, Alcatraz, cable car, steep, rusty railing, fog, mist, tower). DARÜBER HINAUS (erlaubt): if-clause Typ 3 als Bonus („If we had trusted each other more, we would have won.“), buzzed, fluttered, clammy, swallowed, vanished.

## Fortlaufende Geschichte – Zählung und Enden
Stücke 1–2 nach `story.sd.wahl.g2` (X = Jayden blieb, Y = Jayden ging). **Gute Entscheidungen:** Kapitel 1 `ny.g2 === "Y"` (Karte behalten), Kapitel 2 `route66.g2 === "X"` (Wahrheit jetzt), Kapitel 3 `az.g2 === "X"` (Tagebuch an Lucas), Kapitel 4 `sd.g2 === "X"` (Jayden verzeihen), Kapitel 5 Gabelung 2 `ca.g2 === "X"` (Karte nicht geben). 4–5 → Ende 1 · 2–3 → Ende 2 · 0–1 → Ende 3 (führt zu Kapitel 6). Fehlende Kapitel zählen als nicht gut.

20 ♪ je Lauf: Anfang 5 · Gabelung 1 (A Küste unten / B Brücke oben) je 5 · Station nach 5 und 10 · gemeinsam 4 · Boss Captain Fog · Gabelung 2 (X/Y) 2 · Ende (E1/E2/E3) 4. Verstecktes Tor ✦ auf dem A-Weg halb oben am Brückenturm (Hinweis A10). Realm Kapitel 5: Eisbrücke mit schwarzem Banner, Gegenstand **Black Banner**; wer alle fünf Realm-Gegenstände hat, bekommt einen Hinweis auf Kapitel 6.

## Text
- 1X. San Francisco. Four of you walked up the hill. Jayden was still laughing at his own jokes.
- 2X. "If I had a car," he said, "I would drive us over the bridge." Nobody answered.
- 1Y. San Francisco. Three of you walked up the hill. Nobody was making jokes.
- 2Y. Your phone buzzed. A text from Jayden: "I'm sorry. She's going to the bridge."
3. The Golden Gate Bridge was red, enormous and wrapped in fog.
4. A sign said: WARNING! STRONG WINDS. DO NOT CLIMB.
5. Maya looked up. "The last gate is on the bridge. Of course it is."
- A6. You followed the coast along the bay. Sea lions were barking on the rocks, and a foghorn moaned.
- A7. An old newspaper was stuck to a bench. MAP STOLEN – KEEPER MISSING, 1974.
- A8. "My grandpa's map was stolen here," Lucas said. "Fifty years ago."
- A9. Under the bridge, huge waves were crashing against the cliffs. Alcatraz was hidden in the mist.
- A10. And something was glowing in the fog. Halfway up the tower.
- B6. A cable car took you up the steep hill. Then you walked onto the bridge, into the fog.
- B7. Maya checked the map. "If we were faster, we would be there already."
- B8. The wind was so strong that you had to grab the rusty railing.
- B9. A ship's horn sounded far below. The fog was getting thicker.
- B10. In the middle of the bridge, a door was painted on the red steel. It was glowing.
11. Captain Fog rose out of the grey. A ghost in an old sailor's coat.
12. "This bridge was built in 1937," he whispered. "The gate is much older."
13. Then she stepped out of the fog. "My name is Elena Cruz," she said.
14. "Give me the map," she said, "and your friends can go home."
- X15. "No," you said. "We came together. We'll finish this together."
- X16. Maya took your hand. Lucas took the other one.
- Y15. "If I give it to you, will you leave us alone?" you asked.
- Y16. Elena smiled. "Of course," she said. It didn't sound true.
- E1-17. You put the map on the door. All your hands on it. The gate closed with a bang.
- E1-18. Elena screamed. The fog swallowed her – and then it vanished.
- E1-19. Lucas was laughing and crying at the same time. "Grandpa would be proud."
- E1-20. Next morning, the headline said: FIVE GATES CLOSED – NOBODY KNOWS HOW.
- E2-17. The gate closed. But the map was torn in two.
- E2-18. Elena held the other half. "This isn't over," she said. Then she was gone.
- E2-19. "If we had trusted each other more," Maya said quietly, "we would have won."
- E2-20. Lucas looked at his half of the map. Something was written on the back.
- E3-17. The gate opened. Elena walked through it with the map.
- E3-18. "Thank you, keeper," she said. Then the gate closed behind her.
- E3-19. Nobody spoke. The fog felt cold and clammy on your skin.
- E3-20. Then the last page of the map fluttered down. It said: CHAPTER 6.
- R1. Behind the door, a black banner was hanging over a bridge of ice.
- R2. The knight bowed. "Keeper, you have found five gates. Almost."
- R3. "Take the Black Banner," he said. "When all five are yours, the sixth story begins."
