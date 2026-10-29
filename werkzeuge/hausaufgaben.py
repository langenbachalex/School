"""📝 Hausaufgabe: liest inhalte/hausaufgabe.tsv (Klasse 6) bzw. inhalte/klasse9/hausaufgabe.tsv (Klasse 9),
prüft jedes Ziel gegen die App-Daten und gibt D.hausaufgaben aus. Schema der Spalte ziel: siehe LIESMICH.md neben der TSV.
Je Hausaufgabe: {"von", "bis", "ziel" (Rohtext), "text", "ziele": [{"ziel", "nr", "gruppe", "teil", "name", "schluessel": [Teilschlüssel …]} …]}.
Mehrere Ziele durch „;“ (Kette in dieser Reihenfolge); `2/u1` = alle Abschnitte der Unit 1 (je Abschnitt ein Ziel).
Wird von daten_bauen.py und klasse9_bauen.py benutzt.

einheiten: Liste je Station/Kategorie {"nr", "titel", "gruppen": [{"schluessel", "name", "teile": [Teilnamen]}] oder None,
           "teile": [Teilnamen] oder None}. Teilschlüssel wie in der App: "<nr>|<gruppe>|<index>" (Klasse 6 ohne Gruppe: "<nr>||<index>").
"""
import csv, os, re

DATUM = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def fehler(pfad, zeile, text):
    raise SystemExit(f"{os.path.relpath(pfad)}, Zeile {zeile}: {text}")


def _finde(liste, wunsch, was, pfad, zeile, namen=lambda x: [x]):
    """Nummer (1-basiert) oder genauer Name/Schlüssel; sonst Fehler mit allen Möglichkeiten."""
    if wunsch.isdigit():
        i = int(wunsch) - 1
        if 0 <= i < len(liste):
            return i
    else:
        for i, x in enumerate(liste):
            if wunsch in namen(x):
                return i
    auswahl = " · ".join(f"{i + 1} = {' = '.join(dict.fromkeys(namen(x)))}" for i, x in enumerate(liste))
    fehler(pfad, zeile, f"{was} „{wunsch}“ gibt es nicht. Möglich: {auswahl}")


def _ziel(ziel, einheiten, gruppe_leer, pfad, n):
    """Löst ein einzelnes Ziel (Station[/Gruppe[/Teil]]) auf. `2/u1` (ganze Unit) ergibt je Abschnitt ein Ziel."""
    teile = [t.strip() for t in ziel.split("/")]
    if not teile[0].isdigit():
        fehler(pfad, n, f"ziel „{ziel}“ muss mit der Nummer der Station/Kategorie beginnen")
    nr = int(teile[0])
    einheit = next((e for e in einheiten if e["nr"] == nr), None)
    if not einheit:
        fehler(pfad, n, f"Station/Kategorie {nr} gibt es nicht. Möglich: " + ", ".join(f"{e['nr']} = {e['titel']}" for e in einheiten))
    rest = teile[1:]
    if rest and re.match(r"^u\d+$", rest[0]) and einheit.get("gruppen"):  # ganze Unit: alle Abschnitte, jeder ein eigenes Ziel
        abschnitte = [g for g in einheit["gruppen"] if isinstance(g["schluessel"], str) and g["schluessel"].startswith(rest[0] + ":")]
        if not abschnitte:
            fehler(pfad, n, f"ziel „{ziel}“: Unit {rest[0][1:]} hat keine Abschnitte")
        if len(rest) > 1:
            fehler(pfad, n, f"ziel „{ziel}“: bei einer ganzen Unit kann kein Teil gewählt werden (dafür z. B. {nr}/{abschnitte[0]['schluessel']}/1)")
        return [_ziel(f"{nr}/{g['schluessel']}", einheiten, gruppe_leer, pfad, n)[0] for g in abschnitte]
    h = {"ziel": ziel, "nr": nr, "gruppe": None, "teil": None, "name": einheit["titel"]}
    gruppe_schluessel, teilnamen = gruppe_leer, einheit.get("teile")
    if einheit.get("gruppen"):
        if rest:
            gi = _finde(einheit["gruppen"], rest.pop(0), "Gruppe", pfad, n, lambda g: ([g["schluessel"]] if isinstance(g["schluessel"], str) else []) + [g["name"]])
            g = einheit["gruppen"][gi]
            h["gruppe"], gruppe_schluessel, teilnamen = g["schluessel"], g["schluessel"], g["teile"]
            h["name"] += " · " + g["name"]
        else:
            teilnamen = None
    if rest:
        if teilnamen is None:
            fehler(pfad, n, f"ziel „{ziel}“: hier kann kein Teil gewählt werden (erst Gruppe angeben oder nur die Nummer)")
        ti = _finde(teilnamen, rest.pop(0), "Teil", pfad, n)
        h["teil"] = ti
        h["name"] += " · " + teilnamen[ti]
    if rest:
        fehler(pfad, n, f"ziel „{ziel}“ hat zu viele Teile (höchstens Station/Gruppe/Teil)")
    # Alle Teilschlüssel, die zum Ziel gehören (für Schild, Erledigt-Prüfung und Bonus)
    if h["teil"] is not None:
        h["schluessel"] = [f"{nr}|{gruppe_schluessel}|{h['teil']}"]
    elif h["gruppe"] is not None:
        h["schluessel"] = [f"{nr}|{gruppe_schluessel}|{i}" for i in range(len(teilnamen))]
    elif einheit.get("gruppen"):
        h["schluessel"] = [f"{nr}|{g['schluessel']}|{i}" for g in einheit["gruppen"] for i in range(len(g["teile"]))]
    else:
        h["schluessel"] = [f"{nr}|{gruppe_leer}|{i}" for i in range(len(teilnamen or []))]
    return [h]


def lesen(pfad, einheiten, gruppe_leer=""):
    """Gibt die aufgelösten Hausaufgaben zurück (leer, wenn die Datei fehlt)."""
    if not os.path.exists(pfad):
        return []
    ergebnis = []
    with open(pfad, encoding="utf-8") as f:
        zeilen = list(csv.DictReader(f, delimiter="\t"))
    for n, z in enumerate(zeilen, 2):
        if not (z.get("von") or "").strip() or z["von"].startswith("#"):
            continue
        von, bis, ziel, text = (z.get(k, "").strip() for k in ("von", "bis", "ziel", "text"))
        if not (DATUM.match(von) and DATUM.match(bis)):
            fehler(pfad, n, f"von/bis müssen JJJJ-MM-TT sein (ist „{von}“ / „{bis}“)")
        if von > bis:
            fehler(pfad, n, f"von ({von}) liegt nach bis ({bis})")
        if not text:
            fehler(pfad, n, "text fehlt")
        ziele = [z.strip() for z in ziel.split(";") if z.strip()]
        if not ziele:
            fehler(pfad, n, "ziel fehlt")
        h = {"von": von, "bis": bis, "ziel": ziel, "text": text, "ziele": []}
        for z in ziele:
            h["ziele"] += _ziel(z, einheiten, gruppe_leer, pfad, n)
        ergebnis.append(h)
    ergebnis.sort(key=lambda h: (h["von"], h["bis"]))
    return ergebnis


def teile_namen(schritte, stufen_standard, stufe_wort):
    """Teilnamen wie in der App (teileVon): ein Listen-and-Repeat-Schritt wird je Stufe ein Teil."""
    namen = []
    for s in schritte:
        if s["art"] == "lr":
            for st in s.get("stufen", stufen_standard):
                namen.append((s["name"] + " · " if s.get("name") else "") + f"{stufe_wort} {st}")
        else:
            namen.append(s["name"])
    return namen
