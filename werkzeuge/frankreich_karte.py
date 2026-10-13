"""Wandelt die französischen Départements (france-geojson, Daten: IGN Admin Express, Licence ouverte) in einfache SVG-Pfade um.
Ergebnis: {Code: {"d": Pfad, "nom": Name, "region": Region}} im Koordinatensystem 0..600 × 0..600.
Projektion: einfache Plattkarte mit Breitenkorrektur (für Frankreich ausreichend)."""
import json, math, os

BREITE = 600
LON0, LON1, LAT0, LAT1 = -5.3, 9.7, 41.2, 51.2   # Frankreich mit Korsika
K = math.cos(math.radians((LAT0 + LAT1) / 2))


def projektion():
    w, h = (LON1 - LON0) * K, LAT1 - LAT0
    skala = BREITE / max(w, h)
    dx, dy = (BREITE - w * skala) / 2, (BREITE - h * skala) / 2

    def p(lon, lat):
        return round((lon - LON0) * K * skala + dx, 1), round((LAT1 - lat) * skala + dy, 1)
    return p


def _ringe(geom):
    if geom["type"] == "Polygon":
        return geom["coordinates"]
    return [r for poly in geom["coordinates"] for r in poly]


def _in_ring(x, y, ring):
    drin = False
    for i in range(len(ring)):
        x1, y1 = ring[i - 1]; x2, y2 = ring[i]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            drin = not drin
    return drin


def _enthaelt(geom, lon, lat):
    polys = [geom["coordinates"]] if geom["type"] == "Polygon" else geom["coordinates"]
    return any(_in_ring(lon, lat, poly[0]) and not any(_in_ring(lon, lat, loch) for loch in poly[1:]) for poly in polys)


def laden(ordner):
    deps = json.load(open(os.path.join(ordner, "departements.geojson"), encoding="utf-8"))["features"]
    regs = json.load(open(os.path.join(ordner, "regions.geojson"), encoding="utf-8"))["features"]
    p = projektion()
    karte = {}
    for f in deps:
        code, nom = f["properties"]["code"], f["properties"]["nom"]
        teile = []
        for ring in _ringe(f["geometry"]):
            pts, letzter = [], None
            for lon, lat in ring:
                xy = p(lon, lat)
                if letzter and abs(xy[0] - letzter[0]) < 0.6 and abs(xy[1] - letzter[1]) < 0.6:
                    continue
                pts.append(xy); letzter = xy
            if len(pts) >= 3:
                teile.append("M" + " ".join(f"{x} {y}" for x, y in pts) + "Z")
        # Region über einen inneren Punkt des Départements
        ring = max(_ringe(f["geometry"]), key=len)
        lon = sum(x for x, _ in ring) / len(ring); lat = sum(y for _, y in ring) / len(ring)
        region = next((r["properties"]["nom"] for r in regs if _enthaelt(r["geometry"], lon, lat)), "")
        karte[code] = {"d": "".join(teile), "nom": nom, "region": region}

    def departement(lon, lat):
        for f in deps:
            if _enthaelt(f["geometry"], lon, lat):
                return f["properties"]["code"]
        # Küstenorte (Mont-Saint-Michel, Ajaccio) liegen in der vereinfachten Karte knapp im Meer: nächster Umriss
        naechst = min(deps, key=lambda f: min((x - lon) ** 2 + (y - lat) ** 2 for r in _ringe(f["geometry"]) for x, y in r))
        return naechst["properties"]["code"]
    return karte, departement, p
