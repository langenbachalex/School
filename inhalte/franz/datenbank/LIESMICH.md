# Französisch-Datenbank für die App (Stand 07.11.2026)

`franz_datenbank.json` enthält alles; Pfade darin sind relativ zu diesem Ordner.

| Schlüssel | Inhalt |
|---|---|
| `dialoge` | D1–D14: id, titel, klasse, woche, zeilen (nr, sprecher A/B, fr, de, lesehilfe, audio pro Zeile ab D9). D9, D11–D14 vertont: `audio.dialog` (ganzer Dialog) und `audio.repete` (mit Nachsprech-Pausen). `abschreib_luecken` mit Lösung. D10 ist als verworfen markiert. |
| `lueckentexte` | Lückentexte Woche 9 und 12 (de, fr mit ______, loesung) + offener Moi-Steckbrief. |
| `vokabeln` | Alle Vokabeln mit Woche, fr, de, Symbol (`icons/…png`) und Thema (Loisirs, Vokabelfolie, Hobby-Tafel, Règles). |
| `kernwendungen` | Die Wiederholungs-Bausteine aus allen Dialogen. |
| `zahlenreime` | Zahlen 1–20 mit Lesehilfe, die sechs Reime (fr/de) und das Audio (Julien). |
| `namen` | Fußballer, Präsident & Stars, Orte, historische Personen – jeweils mit IPA, Lesehilfe, Hinweis. |
| `spotlights` | 7 Paare: Personen mit Rolle, Foto + Bildnachweis, Symbol, 5 Sätzen (de/fr), Quiz „Il ou elle ?“; Kanté ↔ Curie zusätzlich mit „Et toi ?“ und Audio in Alex' Stimme. |

**Lesehilfe:** GROSS = betont · ã õ ẽ = durch die Nase · ß = scharfes s · s = weiches s · sch = weiches sch · w = französisches v.

**Bildrechte:** Fotos sind gemeinfrei, CC0, CC BY oder CC BY-SA (Wikimedia Commons). Bei CC-BY/BY-SA-Fotos muss der Bildnachweis (`foto.nachweis`) in der App sichtbar sein, z. B. klein unter dem Bild.
