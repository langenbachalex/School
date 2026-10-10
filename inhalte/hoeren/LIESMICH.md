# Hörübungen (Station 6 „Hörverstehen“)

Jede Datei `*.txt` in diesem Ordner ist eine Hörübung. Sie erscheinen in der App in der Reihenfolge der Dateinamen
(darum mit Nummer beginnen, z. B. `03-ben-friday.txt`). Neue Woche = neue Datei.

## Aufbau

```
# titel: Mia's Monday
# art: true-false            (oder: weg)
# anleitung: Hör zu! Stimmt der Satz – true oder false?

@Mia (f): Hi, I'm Mia. ...    ← gesprochener Text; (f) = Frauenstimme, (m) = Männerstimme
@Ben (m): Hi, I'm Ben. ...      jede @-Zeile wird eine Audiodatei

? Aussage | true               ← nur bei art true-false
? Aussage | false | Hinweis    ← Hinweis nach „Ich helfe dir:“ (optional)

! Name | Verkehrsmittel | gut  ← nur bei art weg; Verkehrsmittel: bus, car, bike, train, walk
                                  Bewertung: gut, schlecht oder beides
```

Soll die Stimme etwas anders sprechen als geschrieben (z. B. Uhrzeiten), steht die Sprechfassung in
geschweiften Klammern dahinter: `? Mia gets up at 6.45 a.m. {Mia gets up at six forty-five a.m.} | true`

Danach: `python3 werkzeuge/audio_erzeugen.py` und `python3 werkzeuge/daten_bauen.py`.
