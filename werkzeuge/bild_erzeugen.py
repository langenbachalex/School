"""Bild über Pollinations.ai erzeugen (kostenlos, kein Konto, kein API-Schlüssel).

Aufruf:
  python3 werkzeuge/bild_erzeugen.py ZIEL.jpg "Beschreibung der Szene"
  python3 werkzeuge/bild_erzeugen.py ZIEL.jpg "..." --roh      # ohne GLN-Stilvorgabe
  python3 werkzeuge/bild_erzeugen.py ZIEL.jpg "..." --seed 7  # andere Variante

Standard ist der GLN-1-Stil (Schwarz-Weiß-Strichzeichnung, graue Schattierung, 4:3).
Das Bild wird in Graustufen auf 800 px Breite gespeichert.
"""
import argparse, io, os, sys, urllib.parse, urllib.request

STIL = ("Black and white ink line drawing in the style of a school textbook exam illustration, "
        "clear outlines, grey shading, no color: {}. Simple, unambiguous scene, no text.")


def erzeugen(prompt, seed=1, breite=1024, hoehe=768):
    url = ("https://image.pollinations.ai/prompt/" + urllib.parse.quote(prompt)
           + "?" + urllib.parse.urlencode({"width": breite, "height": hoehe, "seed": seed, "nologo": "true"}))
    with urllib.request.urlopen(url, timeout=180) as r:
        return r.read()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ziel")
    ap.add_argument("beschreibung")
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--roh", action="store_true", help="Beschreibung ohne Stilvorgabe senden")
    a = ap.parse_args()
    prompt = a.beschreibung if a.roh else STIL.format(a.beschreibung)
    daten = erzeugen(prompt, a.seed)
    from PIL import Image
    bild = Image.open(io.BytesIO(daten)).convert("L")
    bild = bild.resize((800, round(800 * bild.height / bild.width)), Image.LANCZOS)
    os.makedirs(os.path.dirname(os.path.abspath(a.ziel)), exist_ok=True)
    bild.save(a.ziel, quality=80, optimize=True, progressive=True)
    print(f"{a.ziel}: {bild.width}×{bild.height}")


if __name__ == "__main__":
    sys.exit(main())
