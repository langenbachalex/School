"""Findet alle Sprechtexte (Stimme Mr. Alex) mit postvokalischem R und schreibt docs/postvokales-r.md.

Postvokalisches R: ein R nach einem Vokal, das nicht vor einem Vokal steht (car, never, morning, rarely, here).
Im amerikanischen Englisch wird es gesprochen, im britischen nicht. Ausnahme im Britischen: Folgt im nächsten
Wort direkt ein Vokal, wird es als Bindungs-R gesprochen (never ever, four o'clock) – diese Fälle sind markiert.
Aufruf: python3 werkzeuge/postvokales_r.py
"""
import os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import audio_erzeugen as ae

VOKALE = set("aeiouy")
STUMMES_E_ENDUNGEN = ("", "s", "d", "ly", "ful", "ment", "less")


def r_stellen(wort):
    """Positionen der postvokalischen R im Wort (kleingeschrieben, nur Buchstaben)."""
    w = re.sub(r"[^a-z]", "", wort.lower())
    if w == "mr":  # Mr. = "mister"
        return [1]
    treffer = []
    i = 0
    while i < len(w):
        if w[i] == "r" and i > 0 and w[i - 1] in VOKALE:
            j = i + 1
            while j < len(w) and w[j] == "r":
                j += 1
            rest = w[j:]
            if (not rest or rest[0] not in VOKALE
                    or (rest[0] == "e" and rest[1:] in STUMMES_E_ENDUNGEN)):
                treffer.append(i)
            i = j
        else:
            i += 1
    return treffer


def markieren(text):
    """Text mit **markierten** Wörtern, Liste der Wörter, Liste der Bindungs-R-Wörter."""
    tokens = re.split(r"(\s+|-)", text)
    woerter, bindung = [], []
    for k, t in enumerate(tokens):
        if t.strip() in ("", "-") or not r_stellen(t):
            continue
        roh = re.sub(r"[^A-Za-z']", "", t)
        # Bindungs-R: Wort endet auf r/re, nächstes Wort beginnt mit Vokal, kein Satzzeichen dazwischen
        naechstes = next((x for x in tokens[k + 1:] if x.strip() and x != "-"), "")
        ist_bindung = (re.search(r"(r|re)$", roh.lower()) and not re.search(r"[.,!?;:…]$", t)
                       and naechstes[:1].lower() in "aeiou" and naechstes[:1] != "")
        (bindung if ist_bindung else woerter).append(roh)
        tokens[k] = re.sub(r"([A-Za-z']+)", r"**\1**", t, count=1) + (" ⁽ᴮ⁾" if ist_bindung else "")
    return "".join(tokens), woerter, bindung


def main():
    import csv
    eintraege = []  # (Bereich, Datei, Anzeige, Sprechtext)
    with open(ae.TSV, encoding="utf-8") as f:
        for z in csv.DictReader(f, delimiter="\t"):
            if z["englisch"]:
                eintraege.append(("Sätze", f"kernsaetze/{z['id']}_en.mp3", z["id"],
                                  z["englisch_gesprochen"] or z["englisch"].replace("[", "").replace("]", "")))
    with open(os.path.join(ae.BASIS, "inhalte", "vokabeln.tsv"), encoding="utf-8") as f:
        for v in csv.DictReader(f, delimiter="\t"):
            eintraege.append(("Vokabeln", f"vokabeln/{v['id']}_en.mp3", v["englisch"], v["englisch_gesprochen"]))
    for u in ae.hoeren.lesen():
        for t in u["teile"]:
            if t["stimme"] != "en_f":
                eintraege.append(("Hörtexte", f"hoeren/{t['datei']}.mp3", t["sprecher"], t["sprech"]))
        for a in u["aufgaben"]:
            if "datei" in a:
                eintraege.append(("Hörtexte", f"hoeren/{a['datei']}.mp3", "Aussage", a["sprech"]))

    # Nur Einzelwörter (Vokabeln und Wort-Audios): In ganzen Sätzen spricht die Stimme das R korrekt britisch.
    eintraege = [("Wort-Audios" if e[0] == "Sätze" else e[0],) + e[1:] for e in eintraege
                 if e[0] == "Vokabeln" or re.search(r"(st8s_|_wort_)", e[1])]
    betroffen, alle_woerter = [], {}
    for bereich, datei, anzeige, text in eintraege:
        markiert, woerter, bindung = markieren(text)
        if woerter or bindung:
            betroffen.append((bereich, datei, anzeige, markiert, woerter, bindung))
            for w in woerter + bindung:
                alle_woerter[w.lower()] = alle_woerter.get(w.lower(), 0) + 1

    ziel = os.path.join(ae.BASIS, "docs", "postvokales-r.md")
    with open(ziel, "w", encoding="utf-8") as f:
        f.write("# Postvokalisches R bei Einzelwörtern (Stimme Mr. Alex)\n\n")
        f.write("Automatisch erzeugt durch `werkzeuge/postvokales_r.py`. Nur Einzelwörter: In ganzen Sätzen spricht "
                "die Stimme das R korrekt britisch, bei einzelnen Wörtern teilweise amerikanisch. "
                "Stand 10.10.2026: bewusst so gelassen.\n\n")
        f.write(f"**{len(betroffen)} von {len(eintraege)} Audios** enthalten mindestens ein postvokalisches R "
                f"({len(alle_woerter)} verschiedene Wörter).\n\n")
        f.write("Markiert (**fett**): R nach Vokal, das nicht vor einem Vokal steht – im amerikanischen Englisch "
                "hörbar, im britischen nicht. ⁽ᴮ⁾ = Bindungs-R: Das nächste Wort beginnt mit einem Vokal, "
                "dann spricht man es auch im Britischen (z. B. *never ever*).\n\n")
        f.write("## Alle betroffenen Wörter\n\n")
        f.write(", ".join(f"{w} ({n})" for w, n in sorted(alle_woerter.items())) + "\n")
        for bereich in ("Wort-Audios", "Vokabeln"):
            zeilen = [b for b in betroffen if b[0] == bereich]
            gesamt = sum(1 for e in eintraege if e[0] == bereich)
            f.write(f"\n## {bereich} ({len(zeilen)} von {gesamt})\n\n| Datei | Sprechtext |\n|---|---|\n")
            for _, datei, anzeige, markiert, _, _ in zeilen:
                f.write(f"| `{datei}` | {markiert} |\n")
    print(ziel, len(betroffen), "von", len(eintraege))
    for bereich in ("Wort-Audios", "Vokabeln"):
        print(bereich, sum(1 for b in betroffen if b[0] == bereich), "von", sum(1 for e in eintraege if e[0] == bereich))
    print(", ".join(sorted(alle_woerter)))


if __name__ == "__main__":
    main()
