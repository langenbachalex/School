# Road Trip Run – Kapitel 4 „Mount Rushmore“ · „The Traitor“ · Text freigegeben 31.10.2026 (Mr. Alex), Bau freigegeben, Vertonung nach dem 13.11. (Credits)

**Status: Kapitel 4 gebaut (31.10.2026), Vertonung nach dem 13.11.** Welt-Id der Runner-Welt ist `sd` (South Dakota), darum Story-Schlüssel `sd` (nicht „rushmore“): Engine `app/klasse9/runner.js` (`STRUKTUR_SD` mit Variante am Anfang aus `story.az.wahl.g2`, Strecke `MUSTER_SD_STORY`, Realm Kapitel 4 `MUSTER_REALM_4` = Eishalle `REALM_WELT_4` ('eishalle'), Film `filmZeichnenSD`; Kopie `app/runner.js`), App `app/klasse9/app.js` (`STORY.sd` mit diesem Text wörtlich, `storyOption` übergibt `varianten['az.g2']`, Story Library Kapitel 1–4, Startseite Welt 4 mit Story-Hinweis). Details `docs/runner/konzept-entwurf.md` Abschnitt 21. Verstecktes Tor ✦: auf dem B-Weg im alten Tunnel hinter einer Felsspalte (Abschnitt 18, zwischen ♪B9 „a compass. And an arrow.“ und ♪B10; nur mit Sprung vom Granit-Absatz davor, vom Boden nicht erreichbar). Gegenstand des Realm: **Silver Key 🗝️**. Realm-Mechanik: Spiegelboden (rutschig, spiegelt) + Eiszapfen (zittern 0,6 s, fallen, stecken 1,2 s – drüberspringen, Treffer „Icicle! 🧊“). Audio: noch nicht vertont (Geräte-Stimme) – Sprecherplan in `werkzeuge/story_audio9.py` (`--zaehlen --welt sd`: 65 Dateien `app/klasse9/audio/story/sd_<key>[_n].mp3`, 2.095 Zeichen).

**Sprache in diesem Kapitel (Regel `story-sprache.md`, „Kernsprache anbinden, plus“):** KERN aus der App: **Britisch vs. Amerikanisch** (Border Patrol) organisch eingebaut – das Tagebuch stammt von Lucas' britischem Großvater („torch“ = flashlight; Maya erklärt es Jayden). Weiter: present perfect / past perfect („Someone had taken it“, „I've never been good at …“, „has made a deal“), -ing nach Adjektiven/Verben („good at climbing“, „good at being brave“, „kept slipping“), past simple als Erzählzeit, direkte Rede. PLUS organisch: „No way“, „rolled her eyes“, „for once“, „without looking back“. Folklore nur, wo es der Story dient (hier nicht erzwungen).

**Verknüpfung:** Stücke 1–2 nach `story.az.wahl.g2` (X = Lucas hat das Tagebuch, Y = Maya). Gabelung 2 dieses Kapitels (Jayden verzeihen = X / wegschicken = Y) wird als `story.sd.wahl.g2` gespeichert (Welt-Id `sd`) und wirkt in Kapitel 5 „The Last Gate“ (drei Enden). Standard ohne Wahl: Gabelung 1 A (oben), Gabelung 2 X (verzeihen). Der Verräter ist Jayden – erpresst (die Frau hat sein Handy), nicht böse.

## Kapitel 4 · Mount Rushmore – „The Traitor“
20 ♪ je Lauf: Anfang 5 (1–2 je nach Kapitel 3) · Gabelung 1 (A oben über die Köpfe / B unten durch den Tunnel) je 5 · gemeinsam 4 · Gabelung 2 (X/Y) je 2 · Ende X/Y je 4. Stationen nach 5 und nach 10. Boss Grizzly Grandpa vor dem Tor. Verstecktes Tor ✦ mit R1–R3 (im Tunnel hinter der Felsspalte, B-Weg).

**Anfang** (1–2 je nach Kapitel 3: X Lucas hat das Tagebuch, Y Maya)
- 1X. Lucas kept the journal under his pillow. Every night.
- 2X. But in the morning, it was gone. Someone had taken it.
- 1Y. Maya kept the journal in her bag. She never let go of it.
- 2Y. But in the morning, the bag was empty. Someone had taken it.
3. Four stone faces looked down at you. Mount Rushmore. Silent and grey.
4. "A thief in our group?" Jayden laughed nervously. "No way."
5. Maya looked at everybody. "Somebody here is lying," she said.

*Station 1*

**Gabelung 1 – oben (A): über die Köpfe**
- A6. You climbed up to the presidents. Washington's nose was bigger than a bus.
- A7. Jayden kept slipping. "I'm not good at climbing," he complained.
- A8. A page from the journal! Stuck in Lincoln's beard.
- A9. 'I need a torch,' it said. "A torch?" Jayden asked. "Like fire?"
- A10. "Torch means flashlight," Maya said. "Grandpa was British, remember?"

**Gabelung 1 – unten (B): durch den alten Tunnel**
- B6. You went into the old tunnel behind the heads. Cold and dark.
- B7. "Has anyone got a torch?" Lucas asked. Jayden stared. "A what?"
- B8. "A flashlight," Maya sighed. "Lucas talks like his grandpa. British."
- B9. On the wall, a fresh drawing: a compass. And an arrow.
- B10. Somebody had been here before you. Somebody from your group.

*Station 2*

**Gemeinsam**
11. A roar. Grizzly Grandpa stood in front of the gate. Old, grey, enormous.
12. "Who's been stealing in my mountains?" he growled.
13. Then you saw it. The journal. In Jayden's backpack.
14. "She has my phone," Jayden whispered. "She said she'd delete everything."

*Boss: Grizzly Grandpa (Wort-Frage wie bisher)*

**Gabelung 2 – Entscheidung (wirkt in Kapitel 5)**
- X15. "Everybody makes mistakes," you said. "Give it back. Now."
- X16. Jayden handed the journal over. His hands were shaking.
- Y15. "Go," you said. "We can't trust you anymore."
- Y16. Jayden didn't argue. He walked away without looking back.

**Ende X – Jayden bleibt**
- X17. The gate opened. Four of you walked through. Together.
- X18. "Thanks," Jayden said quietly. "I've never been good at being brave."
- X19. Maya rolled her eyes. "You've been good at being annoying."
- X20. Behind you, the woman watched. One friend less? No. Not this time.

**Ende Y – Jayden geht**
- Y17. The gate opened. Three of you walked through. It felt wrong.
- Y18. Lucas looked back. "He was scared, not bad," he said.
- Y19. Maya said nothing. For once.
- Y20. Far away, Jayden walked towards a car. The woman's car.

**Verstecktes Tor ✦ – The Realm Beyond (Kapitel 4)**
- R1. Behind the door: a hall of ice with five doors. Four were closed.
- R2. The knight was waiting. "One of your friends has made a deal," he said.
- R3. "Deals can be broken," he said. "Find the silver key before she does."

**Realm Kapitel 4 (gebaut):** Eishalle mit fünf Türen (vier zu, eine offen und leuchtend, Kulisse bei ✦R1), wartender Ritter hinter ✦R2, Gegenstand **Silver Key 🗝️** hoch oben, Spiegelboden + Eiszapfen, Rückkehr-Tor „✦ Mount Rushmore“. Kapitel 5 bekommt das Black Banner; alle fünf Gegenstände öffnen Kapitel 6.

**Stimmen (wie Kapitel 1–3):** Erzähler Mr. Alex; Maya und die Frau = Jessica; Jayden, Lucas, Ritter, Grizzly Grandpa = Jeremy; Sätze des Spielers (X15, Y15) liest der Erzähler; Tagebuch-Zitat (A9, einfache Anführungszeichen) Jeremy. Vertonung nach dem 13.11. (Sprecherplan: 65 Dateien, 2.095 Zeichen); bis dahin Geräte-Stimme.
