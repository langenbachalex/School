"""Keys of the Tower – Gespräche und Filme bauen (Block B2, 20.11.2026):
inhalte/abenteuer/tower_gespraeche.tsv  →  app/tower/gespraeche_daten.js

Die Tabelle sagt, WANN WAS gesprochen wird; die Zeilen selbst (Englisch, Deutsch, einfache Fassung) kommen unverändert aus
tower_kapitel1.tsv und tower_hof_den.tsv. So entstehen neue Szenen, ohne dass jemand programmiert.

Spalten der Tabelle (die erste Zeile eines Gesprächs füllt gespraech bis danach, die folgenden nur zeile, knoepfe, tut, bild):
  gespraech  Kennung, frei gewählt
  art        gespraech = das Kind tippt jede Zeile weiter · film = schwarze Balken, Steuerung aus, die Zeilen laufen von selbst
  ort        hof · guardroom
  ausloeser  sofort (sobald der Stand passt) · nah:<figur> (das Kind kommt auf 4 m heran) · tipp:<ding> (angetippt und hingegangen) · nach:<gespraech>
  noetig     Schritte der Geschichte, mit Komma; !schritt = noch nicht erledigt
  danach     Schritt, der am Ende als erledigt gilt (leer = keiner)
  zeile      Kennung der Zeile (a04, w07 …); leer = nur die Spalte tut ausführen
  knoepfe    Antworten des Kindes, getrennt mit | ; „Sorry?“ wiederholt die Zeile, alle anderen führen weiter
  tut        was in der Welt geschieht, wenn die Zeile beginnt (mehrere mit Komma): schritt:<schritt> oder eine Handlung, die der Ort kennt
  bild       Kamera-Standpunkt für diese Zeile (leer: beim Gespräch nah an den, der spricht; beim Film bleibt der letzte)

Aufruf: python werkzeuge/tower_gespraeche.py"""
import csv
import json
import os
import sys

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORDNER = os.path.join(WURZEL, "inhalte", "abenteuer")
TON = os.path.join(WURZEL, "app", "audio", "tower")
ZIEL = os.path.join(WURZEL, "app", "tower", "gespraeche_daten.js")
SCHRITTE = ["figur", "auftakt", "auftrag", "gary", "feder", "schluessel1", "tuer1", "arthur", "schluss"]   # wie app/tower/stand.js


def lies(name):
    with open(os.path.join(ORDNER, name), encoding="utf-8") as f:
        return list(csv.DictReader(f, delimiter="\t"))


def main():
    texte = {r["id"]: r for name in ("tower_kapitel1.tsv", "tower_hof_den.tsv") for r in lies(name)}
    dateien = set(os.listdir(TON))
    gespraeche, zeilen, fehler, g = [], {}, [], None
    for nr, r in enumerate(lies("tower_gespraeche.tsv"), start=2):
        r = {k: (v or "").strip() for k, v in r.items()}
        if r["gespraech"]:
            g = {"id": r["gespraech"], "art": r["art"], "ort": r["ort"], "ausloeser": r["ausloeser"],
                 "noetig": [s for s in r["noetig"].split(",") if s], "danach": r["danach"], "anfang": [], "zeilen": []}
            gespraeche.append(g)
            if g["art"] not in ("gespraech", "film"):
                fehler.append(f"Zeile {nr}: art „{g['art']}“ gibt es nicht")
            for s in g["noetig"] + ([g["danach"]] if g["danach"] else []):
                if s.lstrip("!") not in SCHRITTE:
                    fehler.append(f"Zeile {nr}: Schritt „{s}“ gibt es nicht")
        if g is None:
            fehler.append(f"Zeile {nr}: steht vor dem ersten Gespräch"); continue
        tut = [t.strip() for t in r["tut"].split(",") if t.strip()]
        for t in tut:
            if t.startswith("schritt:") and t[8:] not in SCHRITTE:
                fehler.append(f"Zeile {nr}: Schritt „{t[8:]}“ gibt es nicht")
        i = r["zeile"]
        if not i:
            g["anfang"] += tut; continue
        if i not in texte:
            fehler.append(f"Zeile {nr}: die Zeile „{i}“ steht in keiner Text-Tabelle"); continue
        t = texte[i]
        ton = 1 if f"k1_{i}.mp3" in dateien else 0
        if not ton and t["sprecher"] not in ("bild", "du", "notizbuch"):
            fehler.append(f"Zeile {nr}: für „{i}“ fehlt die Aufnahme k1_{i}.mp3")
        z = {"s": t["sprecher"], "en": t["englisch"], "de": t["deutsch"], "t": ton}
        if t["einfach"]:
            z["ef"] = t["einfach"]
        if f"k1_{i}_einfach.mp3" in dateien:
            z["te"] = 1
        zeilen[i] = z
        eintrag = {"id": i}
        if r["knoepfe"]:
            eintrag["knoepfe"] = [k.strip() for k in r["knoepfe"].split("|") if k.strip()]
        if tut:
            eintrag["tut"] = tut
        if r["bild"]:
            eintrag["bild"] = r["bild"]
        g["zeilen"].append(eintrag)
    kennungen = [g["id"] for g in gespraeche]
    for g in gespraeche:
        if g["ausloeser"].startswith("nach:") and g["ausloeser"][5:] not in kennungen:
            fehler.append(f"{g['id']}: das Gespräch „{g['ausloeser'][5:]}“ gibt es nicht")
        if g["ausloeser"].split(":")[0] not in ("sofort", "nah", "tipp", "nach"):
            fehler.append(f"{g['id']}: Auslöser „{g['ausloeser']}“ gibt es nicht")
    if fehler:
        print("FEHLER:\n  " + "\n  ".join(fehler)); sys.exit(1)
    with open(ZIEL, "w", encoding="utf-8", newline="\n") as f:
        f.write("// Automatisch erzeugt von werkzeuge/tower_gespraeche.py – nicht von Hand ändern.\n")
        f.write("window.TOWER_GESPRAECHE = " + json.dumps({"gespraeche": gespraeche, "zeilen": zeilen}, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print(f"{len(gespraeche)} Gespräche und Filme, {len(zeilen)} Zeilen -> app/tower/gespraeche_daten.js")


if __name__ == "__main__":
    main()
