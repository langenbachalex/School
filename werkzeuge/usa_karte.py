"""Wandelt die US-Staaten (us-atlas, Daten: US Census Bureau) in einfache SVG-Pfade um.
Ergebnis: {Kürzel: Pfad} im Koordinatensystem 0..975 × 0..610 (Albers-Projektion)."""
import json, os

KUERZEL = {"Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA", "Colorado": "CO",
    "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL",
    "Indiana": "IN", "Iowa": "IA", "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
    "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO", "Montana": "MT",
    "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
    "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA",
    "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT",
    "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY",
    "District of Columbia": "DC"}


def pfade(datei):
    topo = json.load(open(datei, encoding="utf-8"))
    sx, sy = topo["transform"]["scale"]; tx, ty = topo["transform"]["translate"]
    arcs = []
    for arc in topo["arcs"]:  # delta-kodiert
        x = y = 0; pts = []
        for dx, dy in arc:
            x += dx; y += dy; pts.append((x * sx + tx, y * sy + ty))
        arcs.append(pts)

    def ring(idx):
        pts = []
        for i in idx:
            a = arcs[i] if i >= 0 else arcs[~i][::-1]
            pts.extend(a if not pts else a[1:])
        out, letzt = [], None
        for x, y in pts:  # auf 0,5 px runden und Doppelte weglassen (verkleinert die Datei stark)
            p = (round(x * 2) / 2, round(y * 2) / 2)
            if p != letzt: out.append(p); letzt = p
        if len(out) < 3: return ""
        return "M" + "L".join(f"{x:g},{y:g}" for x, y in out) + "Z"

    ergebnis = {}
    for g in topo["objects"]["states"]["geometries"]:
        polys = g["arcs"] if g["type"] == "MultiPolygon" else [g["arcs"]]
        ergebnis[KUERZEL[g["properties"]["name"]]] = "".join(ring(r) for poly in polys for r in poly)
    return ergebnis


if __name__ == "__main__":
    p = pfade(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "inhalte", "klasse9", "karte", "states-albers-10m.json"))
    print(len(p), "Staaten,", sum(len(v) for v in p.values()) // 1024, "KB")
