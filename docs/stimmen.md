# Stimmen-Archiv (ElevenLabs) – welche Stimme wo spricht

Stand: 29.10.2026. Pflicht: Jede neue Stimme oder Einstellung wird hier eingetragen. Vorgabe von Mr. Alex: **nur Eleven v4** für neue Aufnahmen.

## Klasse 6 – English Power Game (`werkzeuge/audio_erzeugen.py`)
| Kürzel | Stimme (ElevenLabs) | Voice-ID | Modell | Einstellungen | Wofür |
|---|---|---|---|---|---|
| `en` | **Mr. Alex** (eigene geklonte Stimme) | `AK2WYGe96RmMwFKM5KEz` | eleven_v4 | stability 0.5, similarity 0.75 | Kernsätze, Vokabeln, Lob, London-Fakten, Superhelden, Spieltexte, Power Up; in Hörtexten bisher auch alle männlichen Figuren (Ben, Harry, Declan) und die Lösungs-Aussagen |
| `en_f` | **Alice** – britische Frauenstimme | `Xb7hH8MSUJpSbSDYk0k2` | eleven_multilingual_v2 | stability 0.6, similarity 0.75, speed 0.9 | weibliche Figuren in Hörtexten (Mia in 01 und 02) |
| Ersatz | George – britische Männerstimme | `JBFqnCBsd6RMkjVDRZzb` | multilingual_v2 | 0.6 / 0.75 / 0.9 | nur Notfall, falls die eigene Stimme nicht verfügbar ist |

**Jugendstimmen für Hörtexte (Wahl von Mr. Alex, 29.10.2026, nach Hörprobe `docs/klasse6/hoerprobe/jugend/`, alle Eleven v4, stability 0.5, similarity 0.75):**
| Kürzel | Stimme | Voice-ID | Rolle |
|---|---|---|---|
| `m1` | **Elrond** – britisch, jung | `5sxKKBj5y1Bji6769iwE` | 1. Junge einer Hörübung (3. Junge wieder m1) |
| `m2` | **John Shaw** – britisch, jung | `qxjGnozOAtD4eqNuXms4` | 2. Junge |
| `f1` | **Emmaline** – britisches Mädchen | `nDJIICjR9zfJExIFeSCN` | 1. Mädchen |
| `f2` | **Alice** (jetzt v4) | `Xb7hH8MSUJpSbSDYk0k2` | 2. Mädchen |
| `en` | Mr. Alex | s. o. | nur Lehrer/Interviewer `(alex)` und Lösungs-Aussagen |
Zuordnung automatisch nach Reihenfolge des ersten Auftretens in der Datei (`werkzeuge/hoeren.py`). Hörübung 03: Mia f1, Ben m1, Priya f2, Luca m2, Noah m1. Hörübungen 01/02 behalten ihre alten Aufnahmen (Mia = Alice v2, Jungen = Mr. Alex), bis Mr. Alex eine Neuvertonung freigibt.

## Klasse 9 – Road Trip USA (`werkzeuge/klasse9_audio.py`)
| Kürzel | Stimme | Voice-ID | Modell | Einstellungen | Wofür |
|---|---|---|---|---|---|
| `m` | **Jeremy B.** – Casual, Warm, Natural (amerikanisch) | `btaSeNTVh1pGx4pjFzub` | eleven_v4 (seit 23.10., vorher v2) | stability 0.5, similarity 0.75 | Sätze, Vokabeln, Staaten-Fakten, Landmarks, Hörtexte, BE/AE amerikanisch (abwechselnd mit Jessica) |
| `f` | **Jessica** – Playful, Bright, Warm (amerikanisch) | `cgSgspJ2msm6clMCkdW9` | eleven_multilingual_v2 | stability 0.5, similarity 0.75 | wie Jeremy, abwechselnd; **noch v2** – Umstellung auf v4 nach Freigabe (Ideenspeicher) |
| `alex` | **Mr. Alex** | `AK2WYGe96RmMwFKM5KEz` | eleven_v4 | 0.5 / 0.75 | Lob (aus Klasse 6), britische BE/AE-Sätze, Titel, Serien, Spieltexte, Power Up; geplant: Endboss und Boss-Intro im Runner |

## Hörproben
- `docs/klasse9/hoerprobe/jeremy-v4/` – Jeremy v2 gegen v4 (Entscheidung 23.10.: Version B, v4, stability 0.5).
- `docs/klasse6/hoerprobe/` – (folgt) Jugendstimmen für Hörtexte Klasse 6.

## Kostenbeobachtung
Eleven v4 kostet nach den Zwischenständen ≈ 0,4–0,5 Credits je Zeichen (siehe `ideenspeicher.md`, Audio-Vormerkliste).
