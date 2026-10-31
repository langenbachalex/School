# London Run – Kapitel 2 „London Eye“ · „The Wheel That Stopped“ · Text freigegeben 31.10.2026 (Mr. Alex), Bau + Vertonung freigegeben

**Status: gebaut (31.10.2026).** Welt `londoneye` in der Engine `app/klasse9/runner.js` (`MUSTER_LONDONEYE_STORY`, `STRUKTUR_LONDONEYE` mit Variante `westminster.g1`, Kabinen, Maschinenraum, Möwe, Boss in der obersten Kabine, Kabinentür, Begleiter, Film; Kopie `app/runner.js`), App `app/app.js` (`STORY.londoneye` mit diesem Text, `storyOption`, Story Library nach Kapiteln mit Pfad-Kette, Trophäe „Eye Spy“ 👁️). Details `docs/runner/konzept-entwurf.md` Abschnitt 18. Audio: bis zur Vertonung Geräte-Stimme (`werkzeuge/story_audio.py --zaehlen` → 21 Stücke, 1.115 Zeichen; Boss-Dateien `werkzeuge/runner_audio.py` → 5 Dateien, 140 Zeichen). Test `runner6_welt2.js` (Scratchpad).

**Sprache in diesem Kapitel (Regel `story-sprache.md`):** NEU aus Station 8 „Neu“: Häufigkeit never · rarely · often · always („He always follows you“, „I rarely follow rules“, „I never say that“), „I like … but I don't like …“ („I like marching, but I don't like heights!“), Adjektive (big, red, dark, noisy, cold, strong, worried, top). WIEDERHOLT: he/she/it + s, simple present, kurze Sätze.

## Fortlaufende Geschichte Klasse 6 (Entscheidung Mr. Alex, 31.10.)
Sergeant Bearskin ist der rote Faden. Jede Welt hat eine Entscheidung, die gespeichert wird und in den nächsten Welten weiterwirkt. Welt 1 ist nachgerüstet: die Wahl Fuchs (A) oder Taube (B) wird gespeichert (`story.westminster.wahl.g1`).
- 2 London Eye – „The Wheel That Stopped“: der Fuchs oder die Taube aus Welt 1 begleitet dich (Stücke 1–2 je nach Wahl).
- 3 Tower Bridge – „Up Goes the Bridge“: Raben oder Hut retten (School clubs: der Raben-Club?).
- 4 The Tube – „Mind the Gap“: zurückgehen oder weiterfahren (Wege zur Schule: by tube/bus, journey).
- 5 Wembley – „The Big Match“: drei Enden, je nachdem, wie viele „gute“ Entscheidungen zusammenkamen (Sports).
Story Library zeigt den eigenen Weg als Kette.

## Kapitel 2 · London Eye – „The Wheel That Stopped“
12 Kristalle je Lauf: Anfang 4 (1–2 je nach Welt 1) · Gabelung (A unten / B oben) 4 · gemeinsam 2 · Ende 2. Stationen nach 4 und nach 8. Gabelung A/B dieses Kapitels wird als `wahl.g1` gespeichert (für Welt 3).

**Anfang** (1–2 je nach Welt 1: A = Fuchs, B = Taube)
- 1A. The fox is your friend now. He always follows you.
- 2A. Today he sniffs the air. "Something smells wrong," he says.
- 1B. The pigeon is your friend now. She often sits on your cap.
- 2B. Today she looks worried. "Something is wrong," she says.
3. The big wheel at the London Eye never stops. But today it doesn't turn.
4. Sergeant Bearskin is up there, in the top cabin. Alone.

*Station 1*

**Gabelung – unten (A): die Maschine im Keller**
- A5. You run down to the machine room. It's dark and noisy.
- A6. A big red button says: DO NOT PRESS.
- A7. The fox grins. "I rarely follow rules. Press it!"
- A8. You press it. The wheel moves. Slowly. The wrong way!

**Gabelung – oben (B): auf das Rad klettern**
- B5. You climb up the wheel. Don't look down!
- B6. Cabin after cabin. The wind is cold and strong.
- B7. The pigeon flies ahead. "This way! Hurry!"
- B8. In the top cabin, the Sergeant stands still. As always.

*Station 2*

**Gemeinsam**
9. "I like marching," the Sergeant says. "But I don't like heights!"
10. His boots are stuck. Somebody put glue on the floor. Who does that?

*Boss: Sergeant Bearskin (Wort-Frage wie bisher)*

**Ende A – von unten**
- A11. The wheel turns again. The Sergeant comes down slowly.
- A12. He steps out of his boots. In his socks! Everybody laughs.

**Ende B – von oben**
- B11. You pull. The pigeon pulls. The boots stay. The Sergeant doesn't!
- B12. "Thank you," he whispers. "I never say that. Don't tell anyone."

**Stimme:** Erzähler Mr. Alex (auch Fuchs, Taube, Sergeant). **Vertonung 31.10.:** 21 Dateien `app/audio/story/londoneye_*.mp3` + Boss/Start/Ende `app/audio/runner/londoneye_*.mp3`.
