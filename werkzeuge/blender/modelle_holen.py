"""Freie Modelle und Texturen von Poly Haven holen (polyhaven.com, alles CC0 = gemeinfrei).

Aufruf:  python werkzeuge/blender/modelle_holen.py
Ziel:    werkzeuge/blender/modelle/<name>/   (wird nicht eingecheckt, siehe .gitignore; schon Vorhandenes wird nicht neu geladen)
Die Liste unten ist die Quellenangabe: jedes Modell hat die Seite https://polyhaven.com/a/<name>.
"""
import json
import os
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ZIEL = os.path.join(HERE, "modelle")
API = "https://api.polyhaven.com/files/"
KOPF = {"User-Agent": "blender-script"}

MODELLE = [
    "tea_set_01", "wooden_spoon", "Lantern_01", "treasure_chest", "WoodenTable_01", "WoodenChair_01", "painted_wooden_bench",
    "mantel_clock_01", "kite_shield", "brass_candleholders", "large_castle_door", "rubber_boots", "wine_barrel_01",
]
TEXTUREN = ["medieval_blocks_02", "old_wood_floor", "dark_wood", "plastered_stone_wall"]
KARTEN = {"Diffuse": "diff", "nor_gl": "nor", "Rough": "rough"}


def hole(url, pfad):
    if os.path.exists(pfad) and os.path.getsize(pfad) > 0:
        return 0
    os.makedirs(os.path.dirname(pfad), exist_ok=True)
    with urllib.request.urlopen(urllib.request.Request(url, headers=KOPF), timeout=120) as r:
        daten = r.read()
    with open(pfad, "wb") as f:
        f.write(daten)
    return len(daten)


def dateien(name):
    with urllib.request.urlopen(urllib.request.Request(API + name, headers=KOPF), timeout=60) as r:
        return json.load(r)


def sicher(ordner, rel):
    pfad = os.path.normpath(os.path.join(ordner, rel))
    if not pfad.startswith(ordner + os.sep):
        raise ValueError("Pfad ausserhalb des Ordners: " + rel)
    return pfad


def main():
    gesamt = 0
    for name in MODELLE:
        ordner = os.path.join(ZIEL, name)
        g = dateien(name)["gltf"]["1k"]["gltf"]
        n = hole(g["url"], os.path.join(ordner, name + ".gltf"))
        for rel, d in g.get("include", {}).items():
            n += hole(d["url"], sicher(ordner, rel))
        gesamt += n
        print(f"Modell  {name:24s} {n / 1e6:6.1f} MB neu", flush=True)
    for name in TEXTUREN:
        ordner = os.path.join(ZIEL, name)
        f, n = dateien(name), 0
        for karte, kurz in KARTEN.items():
            n += hole(f[karte]["1k"]["jpg"]["url"], os.path.join(ordner, f"{kurz}.jpg"))
        gesamt += n
        print(f"Textur  {name:24s} {n / 1e6:6.1f} MB neu", flush=True)
    print(f"Fertig: {gesamt / 1e6:.1f} MB geladen nach {ZIEL}")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # Netz weg, Name geaendert: klar sagen, was fehlt
        print("FEHLER beim Laden:", e)
        sys.exit(1)
