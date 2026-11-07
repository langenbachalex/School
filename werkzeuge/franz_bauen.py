"""Baut die Französisch-App (Sprachkurs Klasse 5/6) in app/franz/.

Liest inhalte/franz/*.tsv und schreibt app/franz/daten_fr.js, kopiert die Beat-Aufnahmen,
legt Icons an und schreibt den Offline-Speicher app/franz/sw.js (eigener Speicher „mralex-fr-…“).
Audios erzeugt werkzeuge/franz_audio.py (fehlt eine Datei, spricht die Geräte-Stimme fr-FR).
Aufruf: python3 werkzeuge/franz_bauen.py
"""
import csv, hashlib, json, os, re, shutil
from PIL import Image, ImageDraw, ImageFont

BASIS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INHALT = os.path.join(BASIS, "inhalte", "franz")
APP = os.path.join(BASIS, "app", "franz")
SCHRIFT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def tsv(name):
    with open(os.path.join(INHALT, name), encoding="utf-8") as f:
        return [{k: (v or "").strip() for k, v in z.items()} for z in csv.DictReader(f, delimiter="\t")]


def ohne_klammern(text):
    return re.sub(r"\[([^\]]*)\]", r"\1", text)


def audio_name(wer, text):
    """Gleicher Satz, gleiche Stimme → eine Datei (spart Credits)."""
    h = hashlib.sha1(f"{wer}|{ohne_klammern(text)}".encode()).hexdigest()[:10]
    return f"audio/dialoge/{wer.lower()}_{h}.mp3"


# Lesehilfe „einfach“ aus der IPA (für deutsche Leser): Nasale mit Tilde, ʃ/ʒ = sch, ʁ = r, y = ü, ø/œ/ə = ö, ɛ = ä
EINFACH = [("tʃ", "tsch"), ("ɑ̃", "ã"), ("ɔ̃", "õ"), ("ɛ̃", "ẽ"), ("œ̃", "ẽ"), ("ʃ", "sch"), ("ʒ", "sch"), ("ɲ", "nj"), ("ŋ", "ng"),
           ("ʁ", "r"), ("ɥ", "ü"), ("w", "u"), ("v", "w"), ("z", "s"), ("y", "ü"), ("ø", "ö"), ("œ", "ö"), ("ə", "ö"),
           ("ɛ", "ä"), ("ɑ", "a"), ("ɔ", "o")]


def einfach(silbe):
    platz = []
    for a, b in EINFACH:  # über Platzhalter, damit z. B. „v → w“ das „w → u“ nicht noch einmal trifft
        if a in silbe:
            silbe = silbe.replace(a, f"\x00{len(platz)}\x01")
            platz.append(b)
    silbe = re.sub(r"\x00(\d+)\x01", lambda m: platz[int(m.group(1))], silbe)
    return silbe.replace("s", "ss", 1) if silbe.startswith("s") and len(silbe) > 1 and silbe[1] in "aeiouäöüãõẽ" else silbe


def lautung(ipa):
    """„bɔ̃.ʒuʁ | sa.va“ → [[silben], …] je Sprechgruppe; betont ist die letzte Silbe jeder Gruppe (App: fett)."""
    gruppen = [g.split(".") for g in ipa.replace(" ", "").split("|") if g]
    return {"ipa": gruppen, "einfach": [[einfach(s) for s in g] for g in gruppen]}


def vorhanden(rel):
    return os.path.exists(os.path.join(APP, rel))


def icon(groesse, ziel):
    if os.path.exists(ziel):
        return
    img = Image.new("RGB", (groesse, groesse), (255, 255, 255))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, groesse // 3, groesse], fill=(0, 85, 164))
    d.rectangle([groesse * 2 // 3, 0, groesse, groesse], fill=(239, 65, 53))
    d.text((groesse / 2, groesse / 2), "FR", font=ImageFont.truetype(SCHRIFT, int(groesse * 0.34)), fill=(23, 33, 58), anchor="mm",
           stroke_width=max(2, groesse // 40), stroke_fill=(255, 255, 255))
    img.save(ziel)


def paris_runner():
    """Paris Run (Stufe 4, 7.11.2026): Texte stehen nur in der Engine (app/klasse9/runner.js: ALEX_ZURUFE_FR, Welt „paris“, CAMEO der Paris-Helden).
    Liefert (gruppe, key, text, datei, stimme) – stimme "alex" oder "held:<Voice-ID>"; Aufnahmen in app/franz/audio/runner/."""
    with open(os.path.join(BASIS, "app", "klasse9", "runner.js"), encoding="utf-8") as f:
        src = f.read()
    raus = []
    block = src.split("const ALEX_ZURUFE_FR = {", 1)[1].split("\n  };", 1)[0]
    for key, text in re.findall(r'\["(fr_[a-z0-9_]+)", "([^"]+)"\]', block):
        raus.append(("alex", key, text, f"audio/runner/{key}.mp3", "alex"))
    zeile = next(z for z in src.splitlines() if z.strip().startswith("paris: { id: 'paris'"))
    for key in ("banner", "richtig", "falsch", "start", "ende"):
        m = re.search(key + r": (['\"])(.*?)\1", zeile)
        raus.append(("boss" if key in ("banner", "richtig", "falsch") else key, key, m.group(2), f"audio/runner/paris_{key}.mp3", "alex"))
    helden = {z["id"]: z for z in tsv("helden.tsv")}
    cameo = src.split("const CAMEO = {", 1)[1].split("\n  };", 1)[0]
    for hid, text in re.findall(r'^    ([a-z]+): \{ satz: "([^"]+)"', cameo, re.M):
        if hid in helden:
            raus.append(("cameo", hid, text, f"audio/runner/cameo_{hid}.mp3", "held:" + helden[hid]["stimme"]))
    return raus


def disco_runner():
    """Disco Run Französisch (7.11.2026): DISCO_ZURUFE_FR + Welt „disco_fr“ aus app/klasse9/runner.js; Aufnahmen app/franz/audio/runner/disco_fr_<key>.mp3."""
    with open(os.path.join(BASIS, "app", "klasse9", "runner.js"), encoding="utf-8") as f:
        src = f.read()
    raus = []
    block = src.split("const DISCO_ZURUFE_FR = {", 1)[1].split("\n  };", 1)[0]
    for key, text in re.findall(r'\["(disco_[a-z0-9_]+)", "([^"]+)"\]', block):
        raus.append(("alex", key, text, f"audio/runner/fr_{key}.mp3", "alex"))
    zeile = next(z for z in src.splitlines() if z.strip().startswith("disco_fr: { id: 'disco_fr'"))
    for key in ("banner", "richtig", "falsch", "start", "ende"):
        m = re.search(key + r": (['\"])(.*?)\1", zeile)
        raus.append(("boss" if key in ("banner", "richtig", "falsch") else key, key, m.group(2), f"audio/runner/disco_fr_{key}.mp3", "alex"))
    return raus


def main():
    os.makedirs(os.path.join(APP, "icons"), exist_ok=True)
    info = {z["id"]: z for z in tsv("dialoge_info.tsv")}
    dialoge = {}
    for z in tsv("dialoge.tsv"):
        i = info[z["id"]]
        d = dialoge.setdefault(z["id"], {"id": z["id"], "titel": i["titel_fr"], "titel_de": i["titel_de"], "woche": i["woche"],
                                         "neu": [w for w in i["neu"].split("|") if w], "parle": [p for p in i["parle"].split("|") if p], "zeilen": []})
        a = audio_name(z["wer"], z["fr"])
        d["zeilen"].append({"wer": z["wer"], "fr": z["fr"], "de": z["de"], **lautung(z["ipa"]),
                            "audio": a if vorhanden(a) else None})
    namen = []
    for z in tsv("namen.tsv"):
        a, b = f"audio/namen/{z['id']}.mp3", f"bilder/namen/{z['id']}.jpg"
        namen.append({"gruppe": z["gruppe"], "id": z["id"], "name": z["name"], "stichwort": z["stichwort"], "de": z["de"],
                      "bild": z["bild"], "foto": b if vorhanden(b) else None, **lautung(z["ipa"]), "audio": a if vorhanden(a) else None})
    woerter = {}
    for z in tsv("woerter.tsv"):
        a = audio_name("alex", z["fr"])  # Paris Run (7.11.): Wort mit Mr. Alex' Stimme, sonst Geräte-Stimme
        woerter.setdefault(z["kasten"], []).append({"fr": z["fr"], "de": z["de"], "symbol": z["symbol"], "audio": a if vorhanden(a) else None})
    os.makedirs(os.path.join(APP, "audio", "beats"), exist_ok=True)
    beats = []
    for z in tsv("beats.tsv"):
        quelle, ziel = os.path.join(INHALT, "audio_roh", z["datei"]), os.path.join(APP, "audio", "beats", z["datei"])
        if os.path.exists(quelle) and not os.path.exists(ziel):
            shutil.copy(quelle, ziel)
        if os.path.exists(ziel):
            beats.append({"id": z["id"], "titel": z["titel"], "unter": z["unter"], "text": z["text"], "audio": "audio/beats/" + z["datei"]})
    quellen = {}
    if os.path.exists(os.path.join(INHALT, "namen_fotos.tsv")):
        quellen = {z["id"]: z["quelle"] for z in tsv("namen_fotos.tsv")}
    for n in namen:
        n["quelle"] = quellen.get(n["id"]) if n["foto"] else None
    # Paris-Karte (Stufe 2, 7.11.2026): Orte mit Text (fr/de), Stimme Mr. Alex audio/paris/<id>.mp3, Foto bilder/paris/<id>.jpg (Quellen paris_fotos.tsv);
    # die Szenen zeichnet die Runner-Engine (app/klasse9/runner.js, SZENEN „Französisch – Paris“, kopiert nach app/runner.js)
    pquellen = {z["id"]: z["quelle"] for z in tsv("paris_fotos.tsv")} if os.path.exists(os.path.join(INHALT, "paris_fotos.tsv")) else {}
    paris = []
    for z in tsv("paris.tsv"):
        a, b = f"audio/paris/{z['id']}.mp3", f"bilder/paris/{z['id']}.jpg"
        paris.append({"id": z["id"], "name": z["name"], "symbol": z["symbol"], "x": int(z["x"]), "y": int(z["y"]), "fr": z["fr"], "de": z["de"],
                      "audio": a if vorhanden(a) else None, "foto": b if vorhanden(b) else None, "quelle": pquellen.get(z["id"]) if vorhanden(b) else None})
    # Superhelden (Stufe 3, 7.11.2026): gezeichnet in der Runner-Engine (HELDEN_ZEICHNUNG, Filme held_<id>), Stimme je Held audio/helden/intro_<id>.mp3
    helden = []
    wde = {z["fr"]: z["de"] for z in tsv("wendungen_helden.tsv")}   # Folien-Karten (7.11.): deutsche Bedeutung der Wendung für die Défi-Fragen
    for z in tsv("helden.tsv"):
        a = f"audio/helden/intro_{z['id']}.mp3"
        helden.append({"id": z["id"], "name": z["name"], "symbol": z["symbol"], "kraft": z["kraft"], "kraft_de": z["kraft_de"], "wendung": z["wendung"],
                       "intro": z["intro_fr"], "intro_de": z["intro_de"], "audio": a if vorhanden(a) else None,
                       "wendung_de": wde.get(z["wendung"], ""), "ort": z.get("ort", ""), "selten": z.get("selten") == "1"})
    # Paris Run (Stufe 4): Aufnahmen für Runner.start({ audio }) – nur vorhandene Dateien (fehlende spricht das Gerät)
    runner = {"alex": {}, "boss": {}, "cameo": {}}
    for gruppe, key, _, rel, _ in paris_runner():
        if not vorhanden(rel):
            continue
        if gruppe in ("start", "ende"):
            runner[gruppe] = rel
        else:
            runner[gruppe][key] = rel
    disco = {"alex": {}, "boss": {}}
    for gruppe, key, _, rel, _ in disco_runner():
        if vorhanden(rel):
            if gruppe in ("start", "ende"):
                disco[gruppe] = rel
            else:
                disco[gruppe][key] = rel
    # Régions (7.11.): Frankreich-Karte als Niveau 2 im Panthéon, vorbereitet (regions.tsv: 13 Régions mit Chef-lieu und Symbol)
    regions = tsv("regions.tsv") if os.path.exists(os.path.join(INHALT, "regions.tsv")) else []
    # Punkte, Coins, Titel (7.11., wie Englisch 6): Titel-Stufen (ab Punkten, Name fr, Hilfe de) und Boutique (Paris-Run-Ticket + Rahmen)
    titel = [{"ab": ab, "name": n, "de": de, "symbol": sym} for ab, n, de, sym in [
        (0, "Débutant", "Anfänger", "🐣"), (100, "Copain", "Kumpel", "🤝"), (300, "Apprenti héros", "Helden-Lehrling", "🦸"),
        (700, "Héros", "Held", "⚡"), (1200, "Super-héros", "Superheld", "🌟"), (2000, "Méga-héros", "Mega-Held", "👑")]]
    boutique = [
        {"id": "ticket", "symbol": "🎟️", "name": "Ticket Paris Run", "unter": "Ein Ticket = ein Lauf", "preis": 150, "ticket": True},
        {"id": "rahmen_rot", "symbol": "🎨", "name": "Cadre rouge", "unter": "Roter Rahmen für dein Titel-Schild", "preis": 75, "rahmen": "rot"},
        {"id": "rahmen_blau", "symbol": "🎨", "name": "Cadre bleu", "unter": "Blauer Rahmen für dein Titel-Schild", "preis": 75, "rahmen": "blau"},
        {"id": "rahmen_gruen", "symbol": "🎨", "name": "Cadre vert", "unter": "Grüner Rahmen für dein Titel-Schild", "preis": 75, "rahmen": "gruen"}]
    daten = {"titel": titel, "boutique": boutique, "runner": runner, "disco": disco, "dialoge": list(dialoge.values()), "paris": paris, "helden": helden, "regions": regions, "wendungen": [{"fr": z["fr"], "de": z["de"]} for z in tsv("wendungen.tsv")],
             "namen": namen, "woerter": woerter, "beats": beats,
             "gruppen": {"foot": "⚽ Footballeurs", "histoire": "🏛️ Personnalités", "stars": "⭐ Président & stars", "lieux": "📍 Lieux"}}
    with open(os.path.join(APP, "daten_fr.js"), "w", encoding="utf-8") as f:
        f.write("// AUTOMATISCH ERZEUGT von werkzeuge/franz_bauen.py aus inhalte/franz/ – hier nicht ändern.\n")
        f.write("window.DATEN_FR = " + json.dumps(daten, ensure_ascii=False, indent=1) + ";\n")
    for g in (180, 192, 512):
        icon(g, os.path.join(APP, "icons", f"icon-{g}.png"))
    # Offline-Speicher: alle Dateien der App, Version = Prüfsumme
    dateien, h = ["./", "../style.css", "../london-run.css", "../runner.js"], hashlib.sha1()  # style.css und die Runner-Engine (Paris-Szenen) teilt sich die App mit Englisch Klasse 6
    for wurzel, _, namen_ in os.walk(APP):
        for n in sorted(namen_):
            rel = os.path.relpath(os.path.join(wurzel, n), APP).replace(os.sep, "/")
            if rel in ("sw.js",) or n.endswith(".md"):
                continue
            dateien.append(rel)
            with open(os.path.join(wurzel, n), "rb") as f:
                h.update(rel.encode() + f.read())
    for geteilt in ("style.css", "london-run.css", "runner.js"):
        with open(os.path.join(BASIS, "app", geteilt), "rb") as f:
            h.update(f.read())
    dateien.sort()
    with open(os.path.join(APP, "sw.js"), "w", encoding="utf-8") as f:
        f.write(f"""// AUTOMATISCH ERZEUGT von werkzeuge/franz_bauen.py – Offline-Speicher der Französisch-App
const VERSION = "mralex-fr-{h.hexdigest()[:10]}";
const DATEIEN = {json.dumps(dateien)};
self.addEventListener("install", (e) => {{
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
}});
self.addEventListener("activate", (e) => {{
  e.waitUntil(caches.keys().then((alle) => Promise.all(alle.filter((k) => k.startsWith("mralex-fr-") && k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
}});
self.addEventListener("fetch", (e) => {{
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request, {{ ignoreSearch: true }}).then((r) => r || fetch(e.request)));
}});
""")
    fehlt = sum(1 for d in dialoge.values() for z in d["zeilen"] if not z["audio"]) + sum(1 for n in namen if not n["audio"]) + sum(1 for p in paris if not p["audio"]) + sum(1 for h in helden if not h["audio"]) + sum(1 for z in paris_runner() if not vorhanden(z[3]))
    print(f"daten_fr.js: {len(dialoge)} Dialoge, {len(namen)} Namen, {len(beats)} Beats, {len(paris)} Paris-Orte, {len(helden)} Helden · fehlende Audios: {fehlt} · Offline-Dateien: {len(dateien)}")


if __name__ == "__main__":
    main()
