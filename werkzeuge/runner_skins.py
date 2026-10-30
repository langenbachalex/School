"""Figur-Teile für den Runner (Shop-Artikel), gemeinsam für Klasse 9 (Road Trip Run) und Klasse 6 (London Run).
Muss zu SKIN_GRUPPEN in app/klasse9/runner.js passen (frei sind dort die ersten Werte je Option, `frei`; Preise `preis`).
Eingebunden von werkzeuge/klasse9_bauen.py und werkzeuge/daten_bauen.py – nur hier pflegen.
"""
SKIN_PREIS = 45
SKIN_PREIS_TEUER = 90
SKIN_ARTIKEL = [  # (option, wert, Name G, Name E[, Preis])
    ("haar", "zopf", "Frisur: Zopf", "Hair: ponytail"), ("haar", "locken", "Frisur: Locken", "Hair: curly"), ("haar", "afro", "Frisur: Afro", "Hair: afro"),
    ("haar", "irokese", "Frisur: Irokese", "Hair: mohawk"), ("haar", "tolle", "Frisur: Elvis-Tolle", "Hair: quiff"), ("haar", "zoepfe", "Frisur: Zöpfe mit Schleifen", "Hair: pigtails with bows"),
    ("haar", "dutt", "Frisur: Dutt", "Hair: bun"), ("haar", "flattop", "Frisur: Flat-Top", "Hair: flat top"), ("haar", "dreihaare", "Frisur: Glatze mit drei Haaren", "Hair: three hairs"),
    ("haar", "riesenafro", "Frisur: Riesen-Afro", "Hair: giant afro", SKIN_PREIS_TEUER), ("haar", "mohawk", "Frisur: Regenbogen-Mohawk", "Hair: rainbow mohawk", SKIN_PREIS_TEUER),
    ("haarfarbe", "schwarz", "Haarfarbe: schwarz", "Hair colour: black"), ("haarfarbe", "rot", "Haarfarbe: rot", "Hair colour: red"),
    ("haarfarbe", "türkis", "Haarfarbe: türkis", "Hair colour: turquoise"), ("haarfarbe", "lila", "Haarfarbe: lila", "Hair colour: purple"), ("haarfarbe", "neongrün", "Haarfarbe: neongrün", "Hair colour: neon green"),
    ("haarfarbe", "feuerrot", "Haarfarbe: feuerrot", "Hair colour: fire red"), ("haarfarbe", "blau", "Haarfarbe: blau", "Hair colour: blue"), ("haarfarbe", "silber", "Haarfarbe: silber", "Hair colour: silver"),
    ("haarfarbe", "regenbogen", "Haarfarbe: Regenbogen", "Hair colour: rainbow", SKIN_PREIS_TEUER),
    ("haarschmuck", "haarband", "Haarband", "Headband"),
    ("hut", "cowboy", "Cowboyhut", "Cowboy hat"), ("hut", "zylinder", "Zylinder", "Top hat"),
    ("nase", "knubbel", "Knubbelnase", "Button nose"),
    ("bart", "zwirbel", "Bart: Zwirbelbart", "Beard: handlebar moustache"), ("bart", "walross", "Bart: Walross", "Beard: walrus moustache"), ("bart", "kinnbart", "Bart: Kinnbart", "Beard: goatee"),
    ("bart", "monobraue", "Bart: Monobraue + Schnauzer", "Beard: unibrow + moustache"), ("bart", "fumanchu", "Bart: Fu-Manchu", "Beard: Fu Manchu", SKIN_PREIS_TEUER),
    ("schmuck", "kette", "Kette", "Necklace"), ("schmuck", "beides", "Ohrring + Kette", "Earring + necklace"),
    ("topfarbe", "gelb", "Oberteil: gelb", "Top: yellow"), ("topfarbe", "grün", "Oberteil: grün", "Top: green"),
    ("schuhe", "schwarz", "Schuhe: schwarz", "Shoes: black"),
    ("hals", "giraffe", "Körper: Giraffenhals", "Body: giraffe neck", SKIN_PREIS_TEUER),
    ("bauch", "kräftig", "Körper: kräftiger Bauch", "Body: big belly"), ("bauch", "kugel", "Körper: Kugelbauch", "Body: ball belly", SKIN_PREIS_TEUER),
    ("brust", "kräftig", "Körper: breite Schultern", "Body: broad shoulders"),
    ("muskeln", "hulk", "Körper: Hulk-Muskeln", "Body: Hulk muscles", SKIN_PREIS_TEUER),
    ("fuesse", "riesen", "Körper: Riesenfüße", "Body: giant feet", SKIN_PREIS_TEUER),
    # Extras (Entwurf 30.10., noch nicht freigegeben): Rollschuhe, Rucksack, Handschuhe
    ("schuhe", "rollschuhe", "Schuhe: Rollschuhe", "Shoes: roller skates", SKIN_PREIS_TEUER),
    ("rucksack", "blau", "Rucksack: blau", "Backpack: blue"), ("rucksack", "rot", "Rucksack: rot", "Backpack: red"), ("rucksack", "regenbogen", "Rucksack: Regenbogen", "Backpack: rainbow", SKIN_PREIS_TEUER),
    ("handschuhe", "weiß", "Handschuhe: weiß", "Gloves: white"), ("handschuhe", "schwarz", "Handschuhe: schwarz", "Gloves: black"), ("handschuhe", "boxhandschuhe", "Boxhandschuhe", "Boxing gloves", SKIN_PREIS_TEUER),
]


def skin_artikel(name, unter):
    """Shop-Artikel skin_<option>_<wert>; name(g, e) und unter liefern die Texte der jeweiligen App (K9: {"G", "E"}, K6: deutscher Text)."""
    return [{"id": f"skin_{a[0]}_{a[1]}", "symbol": "🎨", "name": name(a[2], a[3]), "unter": unter,
             "preis": a[4] if len(a) > 4 else SKIN_PREIS, "skin": [a[0], a[1]]} for a in SKIN_ARTIKEL]
