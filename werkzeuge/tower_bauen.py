"""Keys of the Tower – Spieldaten bauen: inhalte/abenteuer/tower_kapitel1.tsv + app/tower/raum/guardroom.json
-> app/tower/daten.js (window.TOWER_DATEN). Aufruf: python werkzeuge/tower_bauen.py

Je Zeile: id, s (Sprecher), en, de (fuer die Feder), ef (einfachere Fassung), d (Kennung des Gegenstands im Raum),
t (Zahl der Tonteile: 0 = nur Text, 1 = k1_<id>.mp3, n = k1_<id>_1..n.mp3), te (1 = k1_<id>_einfach.mp3 vorhanden).
"""
import csv
import json
import os
import re
import sys

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TSV = os.path.join(WURZEL, "inhalte", "abenteuer", "tower_kapitel1.tsv")
RAUM = os.path.join(WURZEL, "app", "tower", "raum", "guardroom.json")
TON = os.path.join(WURZEL, "app", "audio", "tower")
ZIEL = os.path.join(WURZEL, "app", "tower", "daten.js")


def main():
    with open(RAUM, encoding="utf-8") as f:
        raum = json.load(f)
    kennung = {d["name"]: d["id"] for d in raum["dinge"]}
    dateien = set(os.listdir(TON))
    zeilen, fehler = [], []
    with open(TSV, encoding="utf-8") as f:
        for r in csv.DictReader(f, delimiter="\t"):
            i = r["id"]
            teile = sorted(n for n in dateien if re.fullmatch(rf"k1_{re.escape(i)}_\d+\.mp3", n))
            t = len(teile) if teile else (1 if f"k1_{i}.mp3" in dateien else 0)
            if t == 0 and r["ausloeser"] != "nur_text" and r["sprecher"] not in ("bild", "du", "notizbuch"):
                fehler.append(f"{i}: kein Ton")
            z = {"id": i, "s": r["sprecher"], "en": r["englisch"], "de": r["deutsch"], "t": t}
            if r["einfach"]:
                z["ef"] = r["einfach"]
            if f"k1_{i}_einfach.mp3" in dateien:
                z["te"] = 1
            if r["gegenstand"] in kennung:
                z["d"] = kennung[r["gegenstand"]]
            zeilen.append(z)
    with open(ZIEL, "w", encoding="utf-8", newline="\n") as f:
        f.write("// Automatisch erzeugt von werkzeuge/tower_bauen.py – nicht von Hand ändern.\n")
        f.write("window.TOWER_DATEN = " + json.dumps({"zeilen": zeilen, "raum": raum}, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print(f"Tower: {len(zeilen)} Zeilen, {len(raum['dinge'])} Gegenstände -> app/tower/daten.js")
    if fehler:
        print("FEHLER: " + "; ".join(fehler))
        sys.exit(1)


if __name__ == "__main__":
    main()
