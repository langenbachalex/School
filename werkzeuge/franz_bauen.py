"""Baut die Französisch-App (Sprachkurs Klasse 5/6) in app/franz/.

Liest inhalte/franz/*.tsv und schreibt app/franz/daten_fr.js, kopiert die Beat-Aufnahmen,
legt Icons an und schreibt den Offline-Speicher app/franz/sw.js (eigener Speicher „mralex-fr-…“).
Audios erzeugt werkzeuge/franz_audio.py (fehlt eine Datei, spricht die Geräte-Stimme fr-FR).
Aufruf: python3 werkzeuge/franz_bauen.py
"""
import csv, hashlib, json, os, re, shutil
from runner_skins import skin_artikel  # Figur-Teile wie Englisch 6 (8.11.)
import frei_saarland  # Ferien/Feiertage Saarland (Perfect week wie Englisch, 8.11.)
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


def parle_stueck(t):
    """Parle de toi (8.11.): Schlüssel eines Satzstücks/Chips wie parleStueck() in app/franz/app.js – nur Satzzeichen → leer."""
    x = re.sub(r"^[\s.,!?;:]+", "", t).strip()
    return x if re.search(r"[^\W\d_]", x) else ""


def parle_stuecke():
    """Alle Satzstücke der Parle-Vorlagen (dialoge_info.tsv) und alle Chips (woerter.tsv) → je Stimme A/B eine Datei."""
    stuecke = []
    for z in tsv("dialoge_info.tsv"):
        for vorlage in filter(None, z["parle"].split("|")):
            stuecke += [parle_stueck(t) for t in re.split(r"\{\w+\}", vorlage)]
    stuecke += [parle_stueck(z["fr"]) for z in tsv("woerter.tsv")]
    return sorted({x for x in stuecke if x})


def parle_name(wer, text):
    h = hashlib.sha1(f"{wer}|{text}".encode()).hexdigest()[:10]
    return f"audio/parle/{wer.lower()}_{h}.mp3"


# Feste Sätze, die die App sonst mit der Geräte-Stimme sagt (8.11., Mr. Alex: alles vertonen): Text → Datei; spiele() nimmt die Datei, wenn es sie gibt
SAETZE_FEST = ["Bravo ! Tu es la star du disco !", "Bravo ! Tu es à la tour Eiffel !", "Presque ! Encore une fois !", "Surprise ! Le Disco Run est débloqué !"]


def saetze():
    """(stimme, text, datei): Helden-Wendungen mit der Heldenstimme, Memory-Wendungen und feste Sätze mit Mr. Alex' Stimme."""
    for z in tsv("helden.tsv"):
        yield "held:" + z["stimme"], z["wendung"], satz_name("held_" + z["id"], z["wendung"])
    for t in [z["fr"] for z in tsv("wendungen.tsv")] + SAETZE_FEST:
        yield "alex", t, satz_name("alex", t)


def satz_name(wer, text):
    h = hashlib.sha1(f"{wer}|{text}".encode()).hexdigest()[:10]
    return f"audio/saetze/{wer.lower()}_{h}.mp3"


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
    info = {z["id"]: z for z in tsv("namen_info.tsv")}  # Infotexte Personnalités (9.11.), Stimme audio/info/<id>.mp3
    for z in tsv("namen.tsv"):
        a, b = f"audio/namen/{z['id']}.mp3", f"bilder/namen/{z['id']}.jpg"
        namen.append({"gruppe": z["gruppe"], "id": z["id"], "name": z["name"], "stichwort": z["stichwort"], "de": z["de"], "jahre": z.get("jahre") or None, "info": {"fr": info[z["id"]]["fr"], "de": info[z["id"]]["de"], "audio": f"audio/info/{z['id']}.mp3" if vorhanden(f"audio/info/{z['id']}.mp3") else None} if z["id"] in info else None,  # Lebensdaten historischer Personen (8.11., Mr. Alex)
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
    # Frankreich-Karte Niveau 2 (7.11.): regions.tsv = 13 Régions mit Umriss (lon,lat; seit 7.11. echte Grenzen aus IGN Admin Express über france-geojson, Licence Ouverte, vereinfacht) und Namens-Platz;
    # hier in SVG-Koordinaten (viewBox 0 0 470 380) umgerechnet. france.tsv = Stationen (x/y wie paris.tsv, Moselle-Orte in der Lupe), Text fr/de,
    # Stimme audio/france/<id>.mp3 falls vorhanden, sonst Gerätestimme fr-FR. Freischaltung nach den Paris-Orten (app.js franceFrei).
    def proj(lon, lat):
        return round((lon + 5.0) * 36 * 0.688 + 10, 1), round((51.3 - lat) * 36 + 10, 1)
    regions = []
    for z in (tsv("regions.tsv") if os.path.exists(os.path.join(INHALT, "regions.tsv")) else []):
        teile = [[proj(*map(float, p.split(","))) for p in t.split()] for t in z.get("umriss", "").split("|") if t.strip()]  # „|“ trennt Inseln (Belle-Île, Oléron, Ré)
        lx, ly = proj(*map(float, z["label"].split(","))) if z.get("label") else (0, 0)
        regions.append({"id": z["id"], "name": z["name"], "chef_lieu": z["chef_lieu"], "symbol": z["symbol"], "kurz": z.get("kurz") or z["name"],
                        "lx": lx, "ly": ly, "pfad": " ".join("M" + " L".join(f"{x},{y}" for x, y in pkt) + " Z" for pkt in teile)})
    # 8.11.: Foto bilder/france/<id>.jpg (Quellen france_fotos.tsv, werkzeuge/france_fotos.py), Film = Runner.szene „fr_<id>“ (Abschnitt „Französisch – Frankreich“)
    fquellen = {z["id"]: z["quelle"] for z in tsv("france_fotos.tsv")} if os.path.exists(os.path.join(INHALT, "france_fotos.tsv")) else {}
    france = []
    for z in (tsv("france.tsv") if os.path.exists(os.path.join(INHALT, "france.tsv")) else []):
        a, b = f"audio/france/{z['id']}.mp3", f"bilder/france/{z['id']}.jpg"
        france.append({"id": z["id"], "name": z["name"], "region": z["region"], "symbol": z["symbol"], "x": int(z["x"]), "y": int(z["y"]),
                       "fr": z["fr"], "de": z["de"], "audio": a if vorhanden(a) else None, "film": "fr_" + z["id"],
                       "foto": b if vorhanden(b) else None, "quelle": fquellen.get(z["id"]) if vorhanden(b) else None})
    # Punkte, Coins, Titel (7.11., wie Englisch 6): Titel-Stufen (ab Punkten, Name fr, Hilfe de) und Boutique (Paris-Run-Ticket + Rahmen)
    titel = [{"ab": ab, "name": n, "de": de, "symbol": sym} for ab, n, de, sym in [
        (0, "Débutant", "Anfänger", "🐣"), (100, "Copain", "Kumpel", "🤝"), (300, "Apprenti héros", "Helden-Lehrling", "🦸"),
        (700, "Héros", "Held", "⚡"), (1200, "Super-héros", "Superheld", "🌟"), (2000, "Méga-héros", "Mega-Held", "👑")]]
    boutique = [
        {"id": "ticket", "symbol": "🎟️", "name": "Ticket Paris Run", "unter": "Ein Ticket = ein Lauf", "preis": 150, "ticket": True},
        {"id": "rahmen_rot", "symbol": "🎨", "name": "Cadre rouge", "unter": "Roter Rahmen für dein Titel-Schild", "preis": 75, "rahmen": "rot"},
        {"id": "rahmen_blau", "symbol": "🎨", "name": "Cadre bleu", "unter": "Blauer Rahmen für dein Titel-Schild", "preis": 75, "rahmen": "blau"},
        {"id": "rahmen_gruen", "symbol": "🎨", "name": "Cadre vert", "unter": "Grüner Rahmen für dein Titel-Schild", "preis": 75, "rahmen": "gruen"},
        {"id": "rahmen_gold", "symbol": "👑", "name": "Cadre doré", "unter": "Nicht zu kaufen: für einen Mois parfait (4 perfekte Wochen hintereinander)", "preis": 0, "rahmen": "gold", "verdient": "👑 Mois parfait"}] + skin_artikel(lambda g, e: g, "Figur im Paris Run") + [   # Paris-Teile (9.11.), nur hier: Zeichnungen in app/klasse9/runner.js (hut beret, top mariniere, baguette an)
        {"id": "skin_hut_beret", "symbol": "🎨", "name": "Béret (Baskenmütze)", "unter": "Figur im Paris Run", "preis": 45, "skin": ["hut", "beret"]},
        {"id": "skin_top_mariniere", "symbol": "🎨", "name": "Marinière (Ringelshirt)", "unter": "Figur im Paris Run", "preis": 45, "skin": ["top", "mariniere"]},
        {"id": "skin_baguette_an", "symbol": "🥖", "name": "Baguette auf dem Rücken", "unter": "Figur im Paris Run", "preis": 90, "skin": ["baguette", "an"]}]
    parle_audio = {w: {x: parle_name(w, x) for x in parle_stuecke() if vorhanden(parle_name(w, x))} for w in ("A", "B")}
    # Lob und Rückmeldungen (8.11.): inhalte/franz/lob.tsv → nach Art gruppiert (lob, stark, fehler, spiel, geschafft, voll, doch), Stimme audio/lob/<id>.mp3
    lob = {}
    for z in (tsv("lob.tsv") if os.path.exists(os.path.join(INHALT, "lob.tsv")) else []):
        a = f"audio/lob/{z['id']}.mp3"
        lob.setdefault(z["art"], []).append({"text": z["text"], "de": z["de"], "gruppe": [g for g in z["gruppe"].split(",") if g], "audio": a if vorhanden(a) else None})
    daten = {"lob": lob, "frei": frei_saarland.als_daten(), "titel": titel, "boutique": boutique, "parleAudio": parle_audio, "saetze": {t: d for _, t, d in saetze() if vorhanden(d) and not _.startswith("held:")}, "heldSatz": {d.split("/")[-1].split("_")[1]: d for _, t, d in saetze() if vorhanden(d) and _.startswith("held:")}, "runner": runner, "disco": disco, "dialoge": list(dialoge.values()), "paris": paris, "helden": helden, "regions": regions, "france": france, "wendungen": [{"fr": z["fr"], "de": z["de"]} for z in tsv("wendungen.tsv")],
             "namen": namen, "woerter": woerter, "beats": beats,
             "gruppen": {"foot": "⚽ Footballeurs", "histoire": "🏛️ Personnalités", "stars": "⭐ Président & stars", "lieux": "📍 Lieux"}}
    with open(os.path.join(APP, "daten_fr.js"), "w", encoding="utf-8") as f:
        f.write("// AUTOMATISCH ERZEUGT von werkzeuge/franz_bauen.py aus inhalte/franz/ – hier nicht ändern.\n")
        f.write("window.DATEN_FR = " + json.dumps(daten, ensure_ascii=False, indent=1) + ";\n")
    for g in (180, 192, 512):
        icon(g, os.path.join(APP, "icons", f"icon-{g}.png"))
    # Offline-Speicher: alle Dateien der App, Version = Prüfsumme
    import sw_vorlage  # 12.11.2026: robuste Einrichtung des Offline-Speichers (nur Geändertes laden), wie EN6 und EN9
    dateien, h = {"./": sw_vorlage.pruefsumme(os.path.join(APP, "index.html")),
                  **{g: sw_vorlage.pruefsumme(os.path.normpath(os.path.join(APP, g))) for g in ("../style.css", "../london-run.css", "../runner.js", "../schriften/TwemojiCountryFlags.woff2")}}, hashlib.sha1()  # style.css und die Runner-Engine (Paris-Szenen) teilt sich die App mit Englisch Klasse 6
    for wurzel, _, namen_ in os.walk(APP):
        for n in sorted(namen_):
            rel = os.path.relpath(os.path.join(wurzel, n), APP).replace(os.sep, "/")
            if rel in ("sw.js",) or n.endswith(".md"):
                continue
            dateien[rel] = sw_vorlage.pruefsumme(os.path.join(wurzel, n))
            with open(os.path.join(wurzel, n), "rb") as f:
                h.update(rel.encode() + f.read())
    for geteilt in ("style.css", "london-run.css", "runner.js"):
        with open(os.path.join(BASIS, "app", geteilt), "rb") as f:
            h.update(f.read())
    dateien = dict(sorted(dateien.items()))
    with open(os.path.join(APP, "sw.js"), "w", encoding="utf-8") as f:
        f.write(f"""// AUTOMATISCH ERZEUGT von werkzeuge/franz_bauen.py – Offline-Speicher der Französisch-App
const VERSION = "mralex-fr-{h.hexdigest()[:10]}r";  // r (8.11.): Update lädt alle Dateien frisch vom Server (cache: "reload"), sonst blieb eine neu vertonte mp3 alt
const DATEIEN = {json.dumps(dateien)};
{sw_vorlage.einrichten_js('k.startsWith("mralex-fr-")')}self.addEventListener("activate", (e) => {{
  e.waitUntil(caches.keys().then((alle) => Promise.all(alle.filter((k) => k.startsWith("mralex-fr-") && k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
}});
self.addEventListener("fetch", (e) => {{
  if (e.request.method !== "GET") return;
  // 11.11.2026: nur im EIGENEN Speicher suchen. caches.match() ohne Namen durchsucht alle Speicher der Seite in der Reihenfolge ihrer Entstehung –
  // die Französisch-App speichert ../style.css mit, und ihr älterer Speicher lieferte der Englisch-App ein altes Stylesheet (Road to GLN rot statt grün).
  e.respondWith(caches.open(VERSION).then((c) => c.match(e.request, {{ ignoreSearch: true }})).then((r) => r || fetch(e.request)));
}});
""")
    fehlt = sum(1 for d in dialoge.values() for z in d["zeilen"] if not z["audio"]) + sum(1 for n in namen if not n["audio"]) + sum(1 for p in paris if not p["audio"]) + sum(1 for h in helden if not h["audio"]) + sum(1 for z in paris_runner() if not vorhanden(z[3]))
    print(f"daten_fr.js: {len(dialoge)} Dialoge, {len(namen)} Namen, {len(beats)} Beats, {len(paris)} Paris-Orte, {len(france)} France-Orte, {len(helden)} Helden · fehlende Audios: {fehlt} · Offline-Dateien: {len(dateien)}")


if __name__ == "__main__":
    main()
