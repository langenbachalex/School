#!/usr/bin/env python3
"""Wortcheck für die Story-Texte (Regel Mr. Alex, 1.11.2026):
Prüft die englischen Sätze eines Story-Dokuments gegen (1) die App-Vokabeln der Klasse,
(2) die CEFR-J-Stufen (A1–B2) und (3) den Häufigkeitsrang, und nennt die Wörter „darüber hinaus“.

  python3 werkzeuge/wortcheck.py docs/runner/story-london-05.md          # Klasse aus dem Dateinamen (london → 6, usa → 9)
  python3 werkzeuge/wortcheck.py --alle                                   # alle Story-Dokumente
  python3 werkzeuge/wortcheck.py --klasse 6 --text "The referee is stuck."

Ausgabe je Dokument: Anzahl Wörter (Tokens), Anteil in App-Liste, Anteil A1/A2 (Kl. 6) bzw. A1–B1 (Kl. 9),
Liste der Wörter darüber hinaus mit Stufe und Rang. Namen (Großschreibung im Satzinneren) werden ausgelassen.
"""
import csv, re, sys, glob, os
HIER = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HIER)

def lade_listen():
    stufe = {}
    for r in csv.DictReader(open(os.path.join(HIER, "wortlisten", "cefrj.tsv"), encoding="utf-8"), delimiter="\t"):
        w = r["wort"]
        if w not in stufe or r["stufe"] < stufe[w]: stufe[w] = r["stufe"]
    rang = {}
    for r in csv.DictReader(open(os.path.join(HIER, "wortlisten", "haeufigkeit.tsv"), encoding="utf-8"), delimiter="\t"):
        rang.setdefault(r["wort"], int(r["rang"]))
    return stufe, rang

def app_woerter(klasse):
    woerter = set()
    dateien = ["inhalte/vokabeln.tsv", "inhalte/kernsaetze.tsv", "inhalte/gym_saetze6.tsv", "inhalte/lob.tsv", "inhalte/london.tsv", "docs/archiv/vokabeln-klasse6-buch.tsv"] if klasse == 6 else \
              ["inhalte/klasse9/vokabeln.tsv", "inhalte/klasse9/saetze.tsv", "inhalte/klasse9/saetze2.tsv", "inhalte/klasse9/beae.tsv", "inhalte/klasse9/landmarks.tsv", "inhalte/klasse9/staaten.tsv",
               "werkzeuge/wortlisten/buch9_vorrat.tsv"]  # Stichwörter der kommenden Units 3–5 (zählen als Buchwortschatz)
    for d in dateien:
        p = os.path.join(REPO, d)
        if not os.path.exists(p): continue
        for zeile in open(p, encoding="utf-8"):
            for t in tokens(zeile): woerter.add(t)
    return woerter

STOP = {"a", "an", "the"}
def tokens(text):
    text = text.replace("’", "'").replace("‘", "'")
    text = re.sub(r"\[([^\]]*)\]", r"\1", text)
    return [t for t in re.findall(r"[a-zA-Z]+(?:'[a-z]+)?", text)]

KONTRAKT = {"n't": "not", "'s": "", "'re": "are", "'ll": "will", "'ve": "have", "'d": "would", "'m": "am"}
def grundformen(w):
    w = w.lower()
    out = [w]
    for k, v in KONTRAKT.items():
        if w.endswith(k):
            basis = w[: -len(k)]
            out += [basis, v]
            if k == "n't" and basis in ("do", "does", "did", "ca", "wo", "is", "are", "was", "were"): out.append({"ca": "can", "wo": "will"}.get(basis, basis))
    for suf, ers in (("ies", "y"), ("es", ""), ("s", ""), ("ed", ""), ("ed", "e"), ("ing", ""), ("ing", "e"), ("er", ""), ("est", ""), ("ly", "")):
        if w.endswith(suf) and len(w) > len(suf) + 2: out.append(w[: -len(suf)] + ers)
    if re.search(r"([a-z])\1(ed|ing)$", w): out.append(re.sub(r"([a-z])\1(ed|ing)$", r"\1", w))
    return [o for o in out if o]

def pruefe_text(saetze, klasse, stufe, rang, app):
    ziel = ("A1", "A2") if klasse == 6 else ("A1", "A2", "B1")
    gesamt = 0; in_app = 0; in_stufe = 0; darueber = {}
    for satz in saetze:
        ws = tokens(satz)
        for i, w in enumerate(ws):
            if w.lower() in STOP: continue
            ist_name = w[0].isupper() and i > 0 and ws[i - 1][-1:].islower() and w.lower() not in stufe and w.lower() not in app
            if ist_name: continue
            gesamt += 1
            formen = grundformen(w)
            if any(f in app for f in formen): in_app += 1; continue
            st = next((stufe[f] for f in formen if f in stufe), None)
            if st in ziel: in_stufe += 1; continue
            rg = min((rang[f] for f in formen if f in rang), default=None)
            key = w.lower()
            darueber.setdefault(key, {"stufe": st or "–", "rang": rg, "n": 0, "satz": satz.strip()[:70]})["n"] += 1
    return gesamt, in_app, in_stufe, darueber

def saetze_aus_doc(pfad):
    saetze = []
    for zeile in open(pfad, encoding="utf-8"):
        m = re.match(r"^\s*(?:-\s*)?([A-Z]?\d{1,2}[A-Z]?(?:[-_]\d{1,2})?|R\d|E\d-\d{1,2})\.\s+(.*)$", zeile)
        if m: saetze.append(m.group(2))
    return saetze

def bericht(name, klasse, saetze, stufe, rang, app):
    gesamt, in_app, in_stufe, darueber = pruefe_text(saetze, klasse, stufe, rang, app)
    if not gesamt: print(f"{name}: keine Story-Sätze gefunden"); return
    rest = gesamt - in_app - in_stufe
    print(f"\n{name} (Klasse {klasse}): {len(saetze)} Stücke, {gesamt} Wörter · App-Liste {in_app/gesamt:.0%} · Stufe {in_stufe/gesamt:.0%} · darüber hinaus {rest/gesamt:.0%} ({len(darueber)} verschiedene)")
    for w, d in sorted(darueber.items(), key=lambda kv: (kv[1]["rang"] is None, kv[1]["rang"] or 0)):
        print(f"  {w:<16} {d['stufe']:<3} Rang {d['rang'] if d['rang'] else '>10000':>6}  ×{d['n']}  „{d['satz']}“")

def main():
    args = sys.argv[1:]
    stufe, rang = lade_listen()
    if "--text" in args:
        klasse = int(args[args.index("--klasse") + 1]) if "--klasse" in args else 6
        bericht("Text", klasse, [args[args.index("--text") + 1]], stufe, rang, app_woerter(klasse)); return
    pfade = sorted(glob.glob(os.path.join(REPO, "docs/runner/story-*.md"))) if "--alle" in args else [a for a in args if a.endswith(".md")]
    apps = {}
    for p in pfade:
        klasse = 9 if "usa" in os.path.basename(p) else 6
        if "--klasse" in args: klasse = int(args[args.index("--klasse") + 1])
        apps.setdefault(klasse, app_woerter(klasse))
        bericht(os.path.basename(p), klasse, saetze_aus_doc(p), stufe, rang, apps[klasse])

if __name__ == "__main__": main()
