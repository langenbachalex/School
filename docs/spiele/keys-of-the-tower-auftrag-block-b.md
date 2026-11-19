# The Keys of the Tower – Auftrag Block B „Spiel in den 3D-Raum“ (Entwurf des Masters, 19.11.2026, freigegeben von Mr. Alex 19.11.)

Grundlage: Vision 8b und 9, Drehbuch der ersten Szene (`keys-of-the-tower-drehbuch-szene1.md`), Sprüche-Blatt (`keys-of-the-tower-sprueche-hof.md`), Ton-Entscheidungen (`werkzeuge-recherche.md` §6, Punkte 1–7), „Help the tourist“ (`keys-of-the-tower-help-the-tourist.md`). Gebaut wird lokal auf AlexPC, erst nach dem OK von Mr. Alex und erst, wenn kein anderer Bau-Chat läuft.

## Ziel
Am Ende von Block B lässt sich die erste Szene im 3D-Raum von Anfang bis Ende durchspielen: Figur wählen, Hof, Auftrag vom Sergeant, Gary, Feder, Schlüssel, Tür, Guard Room, Arthur, Schluss. Noch ohne schöne Filme, ohne Nebel und Licht – aber mit dem Gerüst, an dem alles Spätere hängt: **Das Spiel weiß, wie weit die Geschichte ist, und die Welt richtet sich danach.**

Heute gibt es zwei getrennte Teile: das Spiel als Bild zum Antippen (`app/tower/tower.js`, Ablauf fest im Programm) und die 3D-Probe (`app/tower/probe3d.html` mit Figuren, Hof und Guard Room, aber ohne Geschichte). Block B führt beides zusammen.

## Nicht in Block B
- Film-Kamera (Fahrt, Zoom, Blende), Nebel, Licht, der Hof in schön: Block C.
- Neue Texte oder Aufnahmen: Alle Zeilen sind die abgenommenen. Fehlt etwas, meldet der Bau-Chat es dem Master.
- Musik: nur die leere Schiene im Klang-Modul.
- Die Figur des Kindes (Schritt 3 von Block A) und fehlende Figuren: Wo eine Figur noch nicht fertig ist, steht ein Platzhalter.
- The Den, „Who moved my things?“, volles Notizbuch.

## Die sechs Schritte
Nach jedem Schritt: Testprogramm grün (Laptop und iPad), Mr. Alex zeigen, auf seine Rückmeldung warten.

### B1 – Stand der Geschichte und Zustände der Orte (das Grundgerüst)
- Ein eigenes Modul für den Stand: die Liste der erledigten Schritte aus dem Drehbuch (`figur`, `auftakt`, `auftrag`, `gary`, `feder`, `schluessel1`, `tuer1`, `arthur`, `schluss`). Alles andere fragt nur dieses Modul: „Ist Schritt X erledigt?“ und „Schritt X ist jetzt erledigt“.
- Speichert nach jedem Schritt von selbst auf dem Gerät. Ein vorhandener Spielstand aus dem bisherigen Spiel wird übernommen, nicht gelöscht.
- Jeder Ort beschreibt, wie er je Schritt aussieht (Tabelle im Drehbuch): Sergeant marschiert oder steht Wache, Tür zu oder offen, Abzeichen an der Figur, Gary dabei.
- **Uhren:** Turmuhr und Uhr über dem Kamin zeigen die Zeit aus dem Stand (9:15 → 9:16 → 9:20 → 9:30), nie die echte Zeit; die Zeiger laufen beim Schritt sichtbar vor.
- Zum Bauen und Testen: ein Schalter, der direkt zu einem Schritt springt (nur auf dem eigenen Rechner).
- Ein Gespräch, das mittendrin abbricht, beginnt beim nächsten Mal von vorn; ein Film gilt erst als gesehen, wenn er zu Ende ist.

### B2 – Gespräche mit Auslöser
- Ein Gespräch startet, wenn das Kind hingeht (etwa 4 m) oder die Figur antippt, und nur, wenn der Stand der Geschichte passt.
- Das Kind tippt jede Zeile weiter; an einer Stelle antwortet es mit Knöpfen (für den Sergeant: „Yes, sir!“ · „I think so.“ · „Sorry?“ – alle führen weiter, „Sorry?“ wiederholt die Frage).
- Feder (Deutsch zum Antippen) und „Sorry?“ (noch einmal, langsamer) gehen in jedem Gespräch.
- Die Kamera geht nah an die Sprechenden und danach zurück hinter die Figur. Einfach gehalten; die Feinheiten kommen mit der Film-Kamera in Block C.
- **Die Gespräche stehen als Tabelle in den Daten** (Gespräch, Auslöser, nötiger Schritt, Zeilen, Knöpfe, Schritt danach), nicht fest im Programm. So schreibt der Master spätere Szenen, ohne dass jemand programmiert.
- **Filme als Ersatzfassung:** Die vier Filme der Szene laufen in Block B schlicht – schwarze Balken, Steuerung aus, die Zeilen nacheinander, feste Kamera auf das Geschehen. Damit ist die Szene durchspielbar; Block C ersetzt nur die Kamera.

### B3 – Die Welt: Hof und Guard Room
- Alles, was das bisherige Spiel kann, zieht unverändert im Inhalt in den 3D-Raum: 14 Dinge im Guard Room, Dinge im Hof (Fass, Mauer, Tor, Turmuhr, Tür), Taube am Fenster mit fünf Fragen, Zettel hinter der Uhr, Arthur auf der Treppe mit Ortskarten, Mr. Flex im Spiegel.
- Erste Tür: Schlüssel wie bisher für eine Runde Word Gym oder die Hausaufgabe; der Rabe bringt ihn, das Kind nimmt ihn und schließt selbst auf. Offene Türen bleiben offen.
- Wechsel zwischen Hof und Guard Room, ohne dass der Stand verloren geht.
- **Tipps in drei Stufen** nach etwa 30 Sekunden Stillstand (Zeichen in der Welt, Wink, klarer Satz), Tabelle im Drehbuch. Vor dem Auftritt von Mr. Flex hilft nur Gary.
- Mitschreiben auf dem Gerät und Bericht-Bildschirm bleiben wie bisher (nichts verlässt das Gerät).
- Vorab prüfen, ob die Raumdatei schon verkleinert ist (`werkzeuge-recherche.md`, Punkt 1); wenn nicht, zuerst das, damit das iPad beide Orte lädt.

### B4 – Sprüche aus dem Vorrat
- Die Auswahl: zuerst Sprüche für genau diese Stelle, dann für den Ort, dann allgemeine. Seltenheit 1 (häufig) bis 4 (sehr selten). Nie derselbe Spruch zweimal hintereinander; zuletzt Gehörtes wird zurückgestellt und das Gerät merkt es sich über den Tag hinaus.
- Die Spalte `ort` steht seit 19.11. in `tower_sprueche.tsv` (letzte Spalte): `hof` = fällt nur im Hof (198 Sprüche: Gary 78, Mr. Flex 61, Arthur 26, Tourist 25, Sergeant 8), leer = überall (292). Die **Stelle** im Hof ist der Anlass: `hof_fass`, `hof_mauer`, `hof_raben`, `hof_tor`, `hof_uhr`, `hof_pfuetze`, `hof_sergeant`, `hof_tourist`, `hof_gary`, `hof_kind`; `hof_nacht`, `hof` und `hof_lehrer` gelten überall im Hof; `hof_tipp` und `tipp_fass` sind Tipps, `hilf_*` gehört zu „Help the tourist“. Neue Orte bekommen später ihr eigenes Kürzel (z. B. `guardroom`).
- Mr. Flex spricht nur, wo etwas spiegelt (Spiegel, Scheibe, Pfütze), und im Hof erst, nachdem das Kind ihn kennengelernt hat.
- Wer einen Ort wieder betritt, hört einen neuen kurzen Spruch statt der alten Zeilen.
- „Help the tourist“ als Spiel zum Wiederkommen im Hof, wie im Blatt beschrieben.

### B5 – Klang-Modul
- Ein Modul für allen Ton, mit fünf getrennten Lautstärke-Schienen (die vier aus dem Geräusche-Bericht und Musik). Die Umgebung wird von selbst leiser, wenn jemand spricht.
- **Raum aus dem Modul, nicht aus der Datei:** ein Hall-Profil je Ort (Hof offen und weich, Wachstube kurzer Steinraum); alle Stimmen und Geräusche des Ortes laufen hindurch.
- Schritte je Boden (Stein, Gras, Holz …), ausgelöst nach der Zeittabelle der Bewegung.
- Geräusche als ein Paket je Ort; Stimmen bleiben einzelne Dateien. `QUELLEN.md` in jedem Tonordner.
- iPad-Stummschalter wird beachtet; beim Start einmal „Ton an? 🔊“ mit Probeton.
- Solange die Geräusche der ersten Szene nicht erzeugt sind, läuft das Modul mit den Stimmen und wenigen Platzhaltern aus eigenem oder freiem Material.

### B6 – Einbau in die App und Aufräumen
- Die Kachel „🗝️ The Keys of the Tower“ startet die 3D-Fassung; der Hinweis mit dem Raben bleibt wie entschieden.
- Die bisherige Fassung bleibt bis zur Abnahme über einen Schalter erreichbar und wird danach entfernt.
- Testprogramm: ein neuer Test spielt die ganze Szene Schritt für Schritt durch (Schnelllauf), prüft den Stand nach jedem Schritt, die Uhren, das Wiederbetreten und dass kein Spruch zweimal hintereinander kommt. Nur Laptop und iPad.

## Umfang und Reihenfolge
Groß. Voraussichtlich drei Bau-Chats nacheinander: **B1 + B2** (Grundgerüst, Gespräche), **B3 + B4** (Welt, Sprüche), **B5 + B6** (Klang, Einbau). Jeder Chat endet mit etwas, das Mr. Alex selbst spielen kann. Schlankere Variante: nach B1–B3 testen und B4–B6 erst danach; dann fehlen beim ersten Blick wechselnde Sprüche und Raumklang.

## Entschieden von Mr. Alex (19.11.2026, „Ja zu allen Vorschlägen“)
1. **Block B startet gleich nach Figuren 8** (sobald Mr. Alex Figuren 8 gesehen hat); Taube und Tourist stehen vorerst als Platzhalter im Hof.
2. **Filme in Block B als schlichte Ersatzfassung** (Balken, feste Kamera); die schöne Kamera kommt in Block C.
3. **Gary flüstert vor dem Auftrag aus dem wackelnden Fass:** `gary_149` „Psst! Talk to the Sergeant!“ und `gary_150` „The tall one! With the big hat! … I am not here.“ (Anlass `tipp_fass`, vertont 19.11., 68 Credits, Hörprüfung in Ordnung; auf der Anhör-Seite in der Gruppe „Neu am 19.11. spät“).
4. **Geräusche der ersten Szene werden trocken erzeugt.** Liste mit Aufforderungen: `inhalte/abenteuer/tower_geraeusche.tsv` (40 Geräusche, 110 Varianten, 236 Sekunden; rund 3.100 Credits bei 12 Credits je Sekunde plus 10 %, mit Auswahl aus je zwei Versuchen rund 6.200). Erzeugt wird im Bau-Chat auf AlexPC zu Beginn von B5, weil die Originale nicht ins öffentliche Repo dürfen und das Paket je Ort erst mit dem Klang-Modul entsteht. Nicht in der Liste: Turmuhr (vorhandene Aufnahme), Ticken und Glanz-Töne (im Programm erzeugt), The Den.
