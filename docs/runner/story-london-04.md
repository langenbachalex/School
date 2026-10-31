# London Run – Kapitel 4 „The Tube“ · „Mind the Gap“ · Text freigegeben 31.10.2026 (Mr. Alex), Bau freigegeben, Vertonung nach dem 13.11. (Credits)

**Status: gebaut (31.10.2026), Vertonung nach dem 13.11.** Welt `tube` in der Engine `app/klasse9/runner.js` (`MUSTER_TUBE_STORY`, `STRUKTUR_TUBE` mit Variante `towerbridge.g1`, Spalt `h.spalt` mit Durchsage-Gong und Schild „MIND THE GAP“, Zugtüren `h.tuer` mit Warnton und blinkenden Kanten, Wagen-Plattformen `h.wagen` (Weg B, der Rabe `rabeMit` fährt ab ♪B6 mit), dunkler Bahnsteig `h.dunkelbahnsteig` mit Geist auf der Bank `h.geist(dx, true)` (Weg A), Rolltreppen `h.rolltreppe`, Koffer `h.koffer`, Maus `maus`, Kulissen `hintergrundTube`/`bahnsteigDeko`/`zugDeko`/`dunkelbahnsteigDeko`, Boss `tubeBoss` (Kissenabdruck, Variante A: zu große Mütze), Tür `stadionTor`, Film `filmZeichnenTube`; Kopie `app/runner.js`), App `app/app.js` (`STORY.tube` mit diesem Text, `STORY_KEYS_TUBE`, `storyOption` mit drei Varianten, Story Library vier Kapitel, Trophäe „Mind the Gap“ 🚇, Enden A 👻 „Back to the Sergeant“ / B 🚇 „Ride on“). Details `docs/runner/konzept-entwurf.md` Abschnitt 22. Audio: noch keine Dateien – `werkzeuge/story_audio.py --zaehlen` → tube 21 Stücke, 1.236 Zeichen; `werkzeuge/runner_audio.py --zaehlen` → 5 Dateien `app/audio/runner/tube_*.mp3`, 153 Zeichen („Halt! Sergeant Bearskin is already here!“, „Correct – the stadium gate opens. Carry on!“, „Not this time, soldier!“, „Let's find Wembley Park!“, „You found Wembley Park!“); bis dahin Geräte-Stimme. Test `runner6_welt4.js` (Scratchpad).

**Sprache in diesem Kapitel (Regel `story-sprache.md`, „Kernsprache anbinden, plus“):** KERN aus Unit 3 „My day“: Wege und Fahrten („by tube“, „journey“, „long“, „stops“, „late“), Uhrzeiten („11 a.m.“), Häufigkeit (always · never · rarely), Adjektive (dark, fast, full, wrong, right, big). PLUS organisch: Folklore „Mind the gap!“ als Durchsage (echte Tube-Ansage), der Geist aus dem Ghost Club (Welt 3) kommt wieder, „Lucky them“, „pillow mark“. WIEDERHOLT: he/she/it + s, simple present.

## Fortlaufende Geschichte
Liest `story.towerbridge.wahl.g1` (A = Raben gerettet, B = Hut gerettet, ein Rabe fehlt) für die Stücke 1–2; der Begleiter (Fuchs/Taube aus Welt 1) läuft weiter mit. Die Gabelung dieses Kapitels (A zurück / B weiterfahren) wird als `story.tube.wahl.g1` gespeichert – A ist die „gute“ Entscheidung für die Zählung in Welt 5 Wembley (den Freund nicht zurücklassen); B löst den Raben-Cliffhanger aus Welt 3 auf (unabhängig von der Variante).

## Kapitel 4 · The Tube – „Mind the Gap“
12 Kristalle je Lauf: Anfang 4 (1–2 je nach Welt 3) · Gabelung (A zurück / B weiter) 4 · gemeinsam 2 · Ende 2. Stationen nach 4 und nach 8.

**Anfang** (1–2 je nach Welt 3: A = Raben gerettet, B = Hut gerettet)
- 1A. The ravens are safe. The Sergeant has a new hat. It's too big.
- 2A. Today he goes to Wembley by tube. The big match is on Saturday!
- 1B. One raven is still missing. The Sergeant rarely sleeps now.
- 2B. "Maybe it's on the tube," he says. "Ravens like trains." Do they?
3. The journey is long: twelve stops. The Sergeant falls asleep at stop two.
4. "Mind the gap!" says a voice. The doors close. You're on the wrong train!

*Station 1*

**Gabelung – zurück (A): aussteigen und zum Sergeant**
- A5. You jump off at the next stop. Quick! Back to the Sergeant!
- A6. The platform is dark. A ghost sits on a bench. "Hello again."
- A7. "Trains here are always late," he says. "I've waited since 1899."
- A8. Train after train. The wrong way, the right way, finally your way.

**Gabelung – weiter (B): sitzen bleiben**
- B5. You stay on the train. The map says: Wembley in six stops.
- B6. A pigeon? No, a raven! It sits on the seat next to you.
- B7. The train is fast and full. Everybody looks at their phones.
- B8. "Mind the gap!" Wembley Park. The raven gets off with you.

*Station 2*

**Gemeinsam**
9. Wembley Stadium, 11 a.m. The Sergeant is already there. How?
10. "I never sleep on the tube," he says. He has a pillow mark on his face.

*Boss: Sergeant Bearskin (am Stadiontor, Wort-Frage wie bisher)*

**Ende A – zurückgegangen**
- A11. The ghost waves from the last train. "See you at the match!"
- A12. Ghosts don't need tickets. Lucky them.

**Ende B – weitergefahren**
- B11. The raven lands on the Sergeant's hat. It likes it there.
- B12. Is it the Tower raven? The Sergeant smiles. "It is now."

**Bild:** Bahnsteig und Zug von innen, Türen, die sich schließen, der Spalt am Bahnsteig als Hindernis mit der Durchsage „Mind the gap!“, Rolltreppen als Stufen, der Geist auf der Bank (Weg A), der Rabe im Zug (Weg B).

**Stimme:** Erzähler Mr. Alex (auch Sergeant, Geist, Durchsage). Vertonung nach dem 13.11.: `werkzeuge/story_audio.py` (21 Stücke) + `werkzeuge/runner_audio.py` (Boss/Start/Ende tube). Bis dahin Geräte-Stimme.
