# Hörübungen (Station 6 „Hörverstehen“)

Jede Datei `*.txt` in diesem Ordner ist eine Hörübung. Sie erscheinen in der App in der Reihenfolge der Dateinamen
(darum mit Nummer beginnen, z. B. `03-ben-friday.txt`). Neue Woche = neue Datei.

## Ablauf in der App (Grundprinzip)

1. Überschrift, englische Anweisung, Lese-Hinweis und **alle Aufgaben** stehen auf einer Seite.
2. Das Kind liest zuerst und hört dann den ganzen Text; es markiert während des Hörens (änderbar).
3. Zwei komplette Durchgänge, danach Hinweis „Im GLN gibt es nur zwei Hörversuche“ und erst dann der Knopf „Lösung zeigen“.
4. Lösung mit Audio (Aussagen bzw. Personen werden vorgelesen), danach Text zum Mitlesen.

## Aufbau

```
# titel: Mia's Monday
# art: true-false            (oder: weg)
# instruction: Listen and tick: true or false?   (Anweisung auf Englisch)
# anleitung: Lies dir zuerst alle Sätze durch, …  (Lese-Hinweis auf Deutsch)

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
