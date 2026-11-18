# Figuren – Quellen und Lizenzen

Entscheidung Mr. Alex (17.11.2026): Alle Figuren bekommen einen Körper aus „KayKit Adventurers“ und einen eigenen Kopf aus Blender. Körper und Bewegungen werden nur einmal geladen.

| Datei | Herkunft | Lizenz |
|---|---|---|
| `kind.glb` | eigenes Skript `werkzeuge/blender/tower_kind.py` | eigenes Werk |
| `gary_teile.glb` | eigenes Skript `werkzeuge/blender/tower_gary.py` (Fuchskopf mit Zauberhut und beweglichen Gesichtsteilen, Schwanz, Bühnen-Zauberstab) | eigenes Werk |
| `mund_gary.json` | Zeiten der Mundformen für alle Gary-Aufnahmen, gerechnet mit `werkzeuge/tower_lippen.py` und Rhubarb Lip Sync 1.14.0 (https://github.com/DanielSWolf/rhubarb-lip-sync; das Programm selbst liegt nicht im Repo) | Daten: eigenes Werk; Rhubarb: MIT |
| `koerper_mage.glb` | „KayKit : Adventurers Character Pack (1.0)“ von Kay Lousberg, Figur „Mage“ ohne Kopf, Hut, Bücher und langen Stab; https://kaylousberg.itch.io/kaykit-adventurers, geladen von https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0 | CC0 (gemeinfrei) |
| `kaykit_bewegungen.glb` | dasselbe Paket: Skelett und 12 der 76 Bewegungen (Idle, Walking_A, Running_A, Interact, Cheer, Hit_A, Spellcast_Long, Spellcast_Shoot, Use_Item, PickUp, Throw, Sit_Chair_Idle); gilt für Mage, Knight, Barbarian und Rogue | CC0 (gemeinfrei) |
| `koerper_knight.glb`, `koerper_barbarian.glb`, `koerper_rogue.glb` | dasselbe Paket (Adventurers 1.0, GitHub): Figuren „Knight“, „Barbarian“, „Rogue“ ohne Kopf, Kopfbedeckung, Umhang, Waffen und Schilde (18.11.2026) | CC0 (gemeinfrei) |
| `gesten.glb`, `kungfu.glb` | eigenes Skript `werkzeuge/blender/tower_gesten.py` (20 Rede- und Figuren-Gesten, 6 Kung-Fu-Bewegungen; nur Bewegungen für das KayKit-Skelett, keine Formen), geschnitten mit `glb_teilen.js` aus `werkzeuge/blender/quellen/tower_gesten_roh.glb` (18.11.2026, erster Entwurf, in der App noch nicht benutzt) | eigenes Werk |
| `haende.glb` | eigenes Skript `werkzeuge/blender/tower_haende.py` (drei Handformen zum Aufstecken: offen, zeigen, faust; Probe A2 vom 18.11.2026, in der App noch nicht benutzt) | eigenes Werk |
| `probe_mage_ganz.glb` | „KayKit : Adventurers“ wie oben: ganzer Mage mit Kopf und Hut, ohne Bücher und Stäbe – nur für die Körperbau-Probe in `probe3d.html` (A3, 18.11.2026), fällt weg, wenn Mr. Flex seinen Kopf hat | CC0 (gemeinfrei) |

Das unveränderte Original liegt in `werkzeuge/blender/quellen/kaykit_mage.glb` (nicht in der App). `node werkzeuge/glb_teilen.js` schneidet daraus die beiden Dateien oben; die Geometrie bleibt unverändert. Kopf und Schwanz steckt `probe3d_figuren.js` auf die Knochen des Körpers.

Nicht mehr dabei (Probe vom 17.11., in der Git-Geschichte): `gary1.glb` (ganze Figur per Skript) und `gary2_mixamo_xbot.glb` (Mixamo-Grundfigur).

**Bewegungs-Vorrat (18.11.2026, noch nicht in der App):** „KayKit – Character Animations (1.1)“ von Kay Lousberg, CC0, https://kaylousberg.itch.io/kaykit-character-animations (Fassung „Free“, 14 MB, 161 Bewegungen). Fünf Dateien für das mittlere Skelett liegen in `werkzeuge/blender/quellen/kaykit_animations/` (General, MovementBasic, MovementAdvanced, Simulation, CombatMelee; 4 MB). Geprüft: gleiche Knochennamen und gleiche Ruhehaltung wie bei unseren Körpern, die Bewegungen laufen ohne Umrechnen (Prüfblatt `werkzeuge/blender/frames/kaykit_bewegungen_sichtung.jpg`, lokal).
