# London Run – Kapitel 3 „Tower Bridge“ · „Up Goes the Bridge“ · Text freigegeben 31.10.2026 (Mr. Alex), Bau + Vertonung freigegeben

**Status: gebaut und vertont (31.10.2026).** Welt `towerbridge` in der Engine `app/klasse9/runner.js` (`MUSTER_TOWERBRIDGE_STORY`, `STRUKTUR_TOWERBRIDGE` mit Variante `londoneye.g1`, Brückenklappen `h.klappe` als Rampen mit Horn, Rabe, Mauer-Plattformen/Tower/Geist für Weg A, Boot-Abschnitte `h.boot` mit Treibgut und Steg für Weg B, Boss `bridgeBoss` ohne Mütze, Tür `brueckenTorLondon`, Film `filmZeichnenBridge`; Kopie `app/runner.js`), App `app/app.js` (`STORY.towerbridge` mit diesem Text, `storyOption` mit beiden Varianten, Story Library drei Kapitel, Trophäe „Bridge Keeper“ 🌉, Enden A 🐦 „The ravens“ / B 🎩 „The hat“). Details `docs/runner/konzept-entwurf.md` Abschnitt 20. Audio: vertont 31.10. – 21 Dateien `app/audio/story/towerbridge_*.mp3` (1.235 Zeichen, Erzähler Mr. Alex) + 5 Dateien `app/audio/runner/towerbridge_*.mp3` (Boss/Start/Ende, 153 Zeichen). Test `runner6_welt3.js` (Scratchpad).

**Sprache in diesem Kapitel (Regel `story-sprache.md`):** KERN aus Station 8 „Neu“ / Unit 3: School clubs (Ghost Club, Key Club, Raven Club – organisch erweitert, Harry-Potter-Flair ausdrücklich erlaubt), Tagesablauf mit Uhrzeit („Thursday, half past three“), Häufigkeit (never · rarely · often · always), „I like … but I don't like …“, Adjektive (loud, black, wet, heavy, cold, brown). PLUS organisch: „Up goes the bridge“, „one by one“, „hedgehog“, „drip, drip, drip“. WIEDERHOLT: he/she/it + s, simple present. Folklore (Rhymes, Chants) nur wo es der Story dient – hier bewusst nicht erzwungen.

## Fortlaufende Geschichte
Liest `story.londoneye.wahl.g1` (A = roter Knopf gedrückt, B = hochgeklettert) für die Stücke 1–2; der Begleiter (Fuchs/Taube aus `story.westminster.wahl.g1`) läuft als „your friend“ weiter mit. Die Gabelung dieses Kapitels (A Raben / B Hut) wird als `story.towerbridge.wahl.g1` gespeichert – A ist die „gute“ Entscheidung für Welt 5 Wembley, B liefert den Cliffhanger (ein Rabe fehlt) für Welt 4 „The Tube“. Der Ghost Club kann in Welt 4 wiederkommen.

## Kapitel 3 · Tower Bridge – „Up Goes the Bridge“
12 Kristalle je Lauf: Anfang 4 (1–2 je nach Welt 2) · Gabelung (A Tower / B Fluss) 4 · gemeinsam 2 · Ende 2. Stationen nach 4 und nach 8.

**Anfang** (1–2 je nach Welt 2: A = Maschinenraum, B = aufs Rad)
- 1A. The Sergeant walks again. But he never goes near red buttons.
- 2A. "You pressed it," he says. "I rarely forget things like that."
- 1B. The Sergeant walks again. In new boots. He often looks at them.
- 2B. "You pulled me out," he says. "I always remember my friends."
3. Thursday, half past three. Club time at the Tower: Ghost Club, Key Club, Raven Club.
4. The Sergeant feeds the ravens. A loud horn! Up goes the bridge. Hat and ravens fly away!

*Station 1*

**Gabelung – Raben (A): zum Tower**
- A5. You run to the Tower. The ravens are gone. All six.
- A6. A ghost from the Ghost Club points to a tree. Ghosts rarely talk.
- A7. The Raven Club has one rule: Never lose a raven. Oops.
- A8. You whistle. The ravens always come for bread. One by one.

**Gabelung – Hut (B): auf den Fluss**
- B5. The hat is in the river. It swims slowly away.
- B6. A boy from the Key Club has a boat. And one hundred keys. "Take it!"
- B7. Row, row, row! The water is cold and brown.
- B8. You catch the hat. It's wet and very, very heavy.

*Station 2*

**Gemeinsam**
9. Back on the bridge, the Sergeant waits. The bridge is still up.
10. "I like ships," the Sergeant says. "But I don't like waiting!"

*Boss: Sergeant Bearskin (Wort-Frage wie bisher)*

**Ende A – Raben gerettet**
- A11. The ravens fly back to the Tower. All six. Phew!
- A12. The Sergeant has no hat. His hair looks like a hedgehog. The Ghost Club laughs. Quietly.

**Ende B – Hut gerettet**
- B11. The Sergeant puts on his wet hat. Drip, drip, drip.
- B12. But the ravens? Only five come back. One is missing …

**Bild:** Tower Bridge mit hochklappenden Brückenhälften als Hindernis; Weg A durch den Tower mit Raben und einem Geist; Weg B im Ruderboot auf der Themse mit dem Schlüssel-Jungen.

**Stimme:** Erzähler Mr. Alex (auch Sergeant, Geist, Junge). Vertonung: `werkzeuge/story_audio.py --welt towerbridge` (Story, 21 Dateien `app/audio/story/towerbridge_<key>.mp3`) + `werkzeuge/runner_audio.py` (Boss/Start/Ende, 5 Dateien `app/audio/runner/towerbridge_*.mp3`: „Halt! Sergeant Bearskin has lost his hat!“, „Correct – the bridge is closing. Carry on!“, „Not this time, soldier!“, „Let's find Tower Bridge!“, „You found Tower Bridge!“). Bis dahin Geräte-Stimme.
