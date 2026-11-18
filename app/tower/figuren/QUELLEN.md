# Figuren – Quellen und Lizenzen

Entscheidung Mr. Alex (17.11.2026): Alle Figuren bekommen einen Körper aus „KayKit Adventurers“ und einen eigenen Kopf aus Blender. Körper und Bewegungen werden nur einmal geladen.

| Datei | Herkunft | Lizenz |
|---|---|---|
| `kind.glb` | eigenes Skript `werkzeuge/blender/tower_kind.py` | eigenes Werk |
| `gary_teile.glb` | eigenes Skript `werkzeuge/blender/tower_gary.py` (Fuchskopf mit Zauberhut und beweglichen Gesichtsteilen, Schwanz, Bühnen-Zauberstab) | eigenes Werk |
| `mund_gary.json` | Zeiten der Mundformen für alle Gary-Aufnahmen, gerechnet mit `werkzeuge/tower_lippen.py` und Rhubarb Lip Sync 1.14.0 (https://github.com/DanielSWolf/rhubarb-lip-sync; das Programm selbst liegt nicht im Repo) | Daten: eigenes Werk; Rhubarb: MIT |
| `koerper_mage.glb` | „KayKit : Adventurers Character Pack (1.0)“ von Kay Lousberg, Figur „Mage“ ohne Kopf, Hut, Bücher und langen Stab; https://kaylousberg.itch.io/kaykit-adventurers, geladen von https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0 | CC0 (gemeinfrei) |
| `kaykit_bewegungen.glb` | dasselbe Paket: Skelett und 12 der 76 Bewegungen (Idle, Walking_A, Running_A, Interact, Cheer, Hit_A, Spellcast_Long, Spellcast_Shoot, Use_Item, PickUp, Throw, Sit_Chair_Idle); gilt für Mage, Knight, Barbarian und Rogue | CC0 (gemeinfrei) |

Das unveränderte Original liegt in `werkzeuge/blender/quellen/kaykit_mage.glb` (nicht in der App). `node werkzeuge/glb_teilen.js` schneidet daraus die beiden Dateien oben; die Geometrie bleibt unverändert. Kopf und Schwanz steckt `probe3d_figuren.js` auf die Knochen des Körpers.

Nicht mehr dabei (Probe vom 17.11., in der Git-Geschichte): `gary1.glb` (ganze Figur per Skript) und `gary2_mixamo_xbot.glb` (Mixamo-Grundfigur).
