"""Liest die Hörübungen aus inhalte/hoeren/*.txt (Format: siehe inhalte/hoeren/LIESMICH.md)."""
import glob, os, re

BASIS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORDNER = os.path.join(BASIS, "inhalte", "hoeren")


def _sprechfassung(text):
    """'Anzeige {Sprechfassung}' -> (Anzeige, Sprechfassung)"""
    m = re.match(r"^(.*?)\s*\{(.+)\}\s*$", text)
    return (m.group(1).strip(), m.group(2).strip()) if m else (text.strip(), text.strip())


def lesen():
    uebungen = []
    for pfad in sorted(glob.glob(os.path.join(ORDNER, "*.txt"))):
        name = os.path.splitext(os.path.basename(pfad))[0]
        u = {"id": name, "titel": name, "art": "true-false", "anleitung": "", "instruction": "", "teile": [], "aufgaben": []}
        with open(pfad, encoding="utf-8") as f:
            for nr, zeile in enumerate(f, 1):
                zeile = zeile.strip()
                if not zeile:
                    continue
                ort = f"{os.path.basename(pfad)}, Zeile {nr}"
                if zeile.startswith("#"):
                    k, _, v = zeile[1:].partition(":")
                    if k.strip() in ("titel", "art", "anleitung", "instruction"):
                        u[k.strip()] = v.strip()
                elif zeile.startswith("@"):
                    m = re.match(r"@(.+?)\s*\((m|f)\)\s*:\s*(.+)", zeile)
                    if not m:
                        raise ValueError(f"{ort}: erwartet '@Name (m|f): Text'")
                    anzeige, sprech = _sprechfassung(m.group(3))
                    i = len(u["teile"]) + 1
                    u["teile"].append({"sprecher": m.group(1), "stimme": "en_" + m.group(2), "text": anzeige,
                                       "sprech": sprech, "datei": f"{name}_text{i:02d}"})
                elif zeile.startswith("?"):
                    teile = [t.strip() for t in zeile[1:].split("|")]
                    if len(teile) < 2 or teile[1] not in ("true", "false"):
                        raise ValueError(f"{ort}: erwartet '? Aussage | true/false | Hinweis'")
                    anzeige, sprech = _sprechfassung(teile[0])
                    i = len(u["aufgaben"]) + 1
                    u["aufgaben"].append({"aussage": anzeige, "sprech": sprech, "loesung": teile[1],
                                          "hinweis": teile[2] if len(teile) > 2 else "",
                                          "datei": f"{name}_aussage{i:02d}"})
                elif zeile.startswith("!"):
                    teile = [t.strip() for t in zeile[1:].split("|")]
                    if len(teile) != 3 or teile[2] not in ("gut", "schlecht", "beides"):
                        raise ValueError(f"{ort}: erwartet '! Name | Verkehrsmittel | gut/schlecht/beides'")
                    u["aufgaben"].append({"name": teile[0], "mittel": teile[1], "gefuehl": teile[2]})
        if u["art"] not in ("true-false", "weg"):
            raise ValueError(f"{pfad}: art muss true-false oder weg sein")
        uebungen.append(u)
    return uebungen
