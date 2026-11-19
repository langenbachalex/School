#!/usr/bin/env python3
"""Baut die Anhör-Seite für Mr. Alex: app/tower-anhoeren.html

Listet jede Aufnahme in app/audio/tower/ mit Kennung, Figur und Text, Abspielknopf,
Kreuz „neu aufnehmen“ und Stichwort. Die Auswahl bleibt im Browser gespeichert und
lässt sich als Liste kopieren. Aufruf: python3 werkzeuge/tower_anhoerseite.py
"""
import csv, json, os, re

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO = os.path.join(WURZEL, "app", "audio", "tower")
ZIEL = os.path.join(WURZEL, "app", "tower-anhoeren.html")
NAMEN = {"mrflex": "Mr. Flex", "erzaehler": "Erzähler", "karte": "Karten", "gary": "Gary",
         "sergeant": "Sergeant", "taube": "Taube", "arthur": "Arthur", "tourist": "Tourist"}
# Neue Aufnahmen, die Mr. Alex noch nicht gehört hat: eigene Gruppe ganz oben. Nach seiner Abnahme Muster und Titel
# auf die nächste Lieferung setzen (oder NEU = re.compile("^$") für „nichts Neues“).
NEU_TITEL = "Neu am 19.11. spät – Gary flüstert aus dem Fass (2 Zeilen), noch nicht angehört"
NEU = re.compile(r"^gary_(149|150)(_\d)?$")
ZUERST = ["mrflex_01", "k1_p7", "taube_05", "gary_20_1", "gary_20_2", "gary_70_1", "gary_70_2",
          "gary_71_1", "gary_71_2", "gary_72_1", "gary_72_2", "sergeant_01"]


def lesen(name):
    with open(os.path.join(WURZEL, "inhalte", "abenteuer", name), encoding="utf-8") as f:
        return list(csv.DictReader(f, delimiter="\t", quoting=csv.QUOTE_NONE))


def ohne_tags(t):
    return re.sub(r"\s+", " ", re.sub(r"\[[^\]]*\]", "", t)).strip()


def eintraege():
    da = {d[:-4] for d in os.listdir(AUDIO) if d.endswith(".mp3")}
    aus, benutzt = [], set()

    def dazu(datei, figur, text, gruppe, hinweis=""):
        if datei in da and datei not in benutzt:
            benutzt.add(datei)
            aus.append({"d": datei, "f": figur, "t": text, "g": gruppe, "h": hinweis})

    def zeile(basis, figur, text, regie, gruppe):
        teile = [ohne_tags(x) for x in (regie or "").split(" || ")]
        dazu(basis, figur, text, gruppe, "zwei Teile zusammengesetzt" if len(teile) > 1 else "")
        for i, t in enumerate(teile, 1):
            dazu(f"{basis}_{i}", figur, t, gruppe, f"Teil {i} einzeln")

    for z in lesen("tower_kapitel1.tsv"):
        zeile("k1_" + z["id"], z["sprecher"], z["englisch"], z["regie"], "Kapitel 1")
        dazu(f"k1_{z['id']}_einfach", z["sprecher"], z["einfach"], "Kapitel 1", "einfachere Fassung")
    for z in lesen("tower_hof_den.tsv"):                 # Auftakt, Hof, The Den (vertont 17.11.)
        g = {"v": "Auftakt", "w": "Hof", "d": "The Den"}[z["id"][0]]
        zeile("k1_" + z["id"], z["sprecher"], z["englisch"], z["regie"], g)
        dazu(f"k1_{z['id']}_einfach", z["sprecher"], z["einfach"], g, "einfachere Fassung")
    for z in lesen("tower_sprueche.tsv"):
        zeile(z["id"], z["figur"], z["text"], z["regie"], "Sprüche")
    proben = os.path.join(AUDIO, "proben")              # Proben zur Auswahl (Unterordner), Text steht in der Zeile ohne _A/_B/_C
    texte = {z["id"]: z["text"] for z in lesen("tower_sprueche.tsv")}
    for d in sorted(os.listdir(proben)) if os.path.isdir(proben) else []:
        if d.endswith(".mp3"):
            aus.append({"d": "proben/" + d[:-4], "f": d.split("_")[0], "t": texte.get(d[:-4].rsplit("_", 1)[0], ""), "g": "Proben", "h": "Probe " + d[:-4].rsplit("_", 1)[1]})
    for d in sorted(da - benutzt):
        aus.append({"d": d, "f": "?", "t": "(kein Text in den Tabellen gefunden)", "g": "Sonstige", "h": ""})
    neu = [dict(e, g=NEU_TITEL) for e in aus if NEU.match(e["d"])]      # Neues steht als eigene Gruppe ganz oben
    return neu + [e for e in aus if not NEU.match(e["d"])]


SEITE = """<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Keys of the Tower – Anhören</title>
<style>
:root{--bg:#f6f4ee;--karte:#fff;--text:#1d1b18;--leise:#6b665e;--rand:#d9d4c8;--akzent:#8a1c1c;--neu:#fff1d6}
@media (prefers-color-scheme:dark){:root{--bg:#191817;--karte:#242321;--text:#eeeae2;--leise:#a39d92;--rand:#3a3835;--akzent:#e2a04a;--neu:#3a2f18}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.45 system-ui,sans-serif}
main{max-width:900px;margin:0 auto;padding:16px}
h1{font-size:1.4rem;margin:8px 0 4px}
h2{font-size:1.1rem;margin:28px 0 8px;border-bottom:2px solid var(--rand);padding-bottom:4px}
p.info{color:var(--leise);margin:0 0 12px}
.leiste{position:sticky;top:0;background:var(--bg);padding:8px 0;display:flex;flex-wrap:wrap;gap:8px;align-items:center;z-index:2;border-bottom:1px solid var(--rand)}
select,button,input[type=text]{font:inherit;padding:8px 10px;border:1px solid var(--rand);border-radius:8px;background:var(--karte);color:var(--text)}
button{cursor:pointer}
button.haupt{background:var(--akzent);color:#fff;border-color:var(--akzent)}
.z{background:var(--karte);border:1px solid var(--rand);border-radius:10px;padding:10px 12px;margin:8px 0}
.z.neu{background:var(--neu);border-color:var(--akzent)}
.kopf{display:flex;flex-wrap:wrap;gap:8px;align-items:baseline}
.id{font-family:ui-monospace,monospace;font-size:.85rem;color:var(--leise)}
.fig{font-weight:600}
.hin{font-size:.8rem;color:var(--akzent)}
.txt{margin:4px 0 8px}
.unten{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.unten button{min-width:96px}
.unten label{display:flex;gap:6px;align-items:center;white-space:nowrap}
.unten input[type=text]{flex:1;min-width:160px}
#zahl{color:var(--leise)}
textarea{width:100%;height:160px;font:14px ui-monospace,monospace;margin-top:8px;border:1px solid var(--rand);border-radius:8px;background:var(--karte);color:var(--text);padding:8px}
</style>
</head>
<body>
<main>
<h1>The Keys of the Tower – Aufnahmen anhören</h1>
<p class="info">__ANZAHL__ Aufnahmen. Abspielen, bei Bedarf „neu“ ankreuzen und ein Stichwort schreiben (Akzent, Ton, Tempo, Lautstärke, Naht). Die Auswahl bleibt in diesem Browser gespeichert. Am Ende „Liste kopieren“ und im Master-Chat einfügen.</p>
<div class="leiste">
<select id="filter" aria-label="Figur wählen"></select>
<label><input type="checkbox" id="nurNeu"> nur angekreuzte</label>
<button class="haupt" id="kopieren">Liste kopieren</button>
<span id="zahl"></span>
</div>
<textarea id="ausgabe" hidden readonly></textarea>
<div id="liste"></div>
</main>
<script>
const DATEN = __DATEN__;
const NAMEN = __NAMEN__;
const ZUERST = __ZUERST__;
const KEY = 'tower-anhoeren-v1';
let stand = {};
try { stand = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
const sichern = () => { try { localStorage.setItem(KEY, JSON.stringify(stand)); } catch (e) {} };
const liste = document.getElementById('liste'), filter = document.getElementById('filter');
const nurNeu = document.getElementById('nurNeu'), zahl = document.getElementById('zahl');
const player = new Audio();
let laeuft = null;
player.addEventListener('ended', () => { if (laeuft) laeuft.textContent = '▶ Abspielen'; laeuft = null; });
player.addEventListener('error', () => { if (laeuft) laeuft.textContent = 'Fehler – Datei fehlt?'; laeuft = null; });

const figuren = [...new Set(DATEN.map(e => e.f))];
filter.innerHTML = '<option value="zuerst">Zuerst anhören (' + ZUERST.length + ')</option><option value="">Alle</option>' +
  '<option value="g:Kapitel 1">Kapitel 1 (in Reihenfolge)</option><option value="g:Sprüche">Alle Sprüche</option>' +
  figuren.map(f => '<option value="f:' + f + '">' + (NAMEN[f] || f) + '</option>').join('');

function passt(e) {
  const v = filter.value;
  if (nurNeu.checked && !(stand[e.d] && stand[e.d].neu)) return false;
  if (v === 'zuerst') return ZUERST.includes(e.d);
  if (v.startsWith('g:')) return e.g === v.slice(2);
  if (v.startsWith('f:')) return e.f === v.slice(2);
  return true;
}
function zaehlen() {
  const n = Object.values(stand).filter(s => s.neu).length;
  zahl.textContent = n ? n + ' angekreuzt' : 'nichts angekreuzt';
}
function zeigen() {
  liste.textContent = '';
  let gruppe = '';
  const sicht = DATEN.filter(passt);
  if (filter.value === 'zuerst') sicht.sort((a, b) => ZUERST.indexOf(a.d) - ZUERST.indexOf(b.d));
  for (const e of sicht) {
    if (e.g !== gruppe) { gruppe = e.g; const h = document.createElement('h2'); h.textContent = gruppe; liste.appendChild(h); }
    const s = stand[e.d] || {};
    const z = document.createElement('div'); z.className = 'z' + (s.neu ? ' neu' : '');
    const kopf = document.createElement('div'); kopf.className = 'kopf';
    kopf.innerHTML = '<span class="fig"></span><span class="id"></span><span class="hin"></span>';
    kopf.children[0].textContent = NAMEN[e.f] || e.f; kopf.children[1].textContent = e.d; kopf.children[2].textContent = e.h;
    const txt = document.createElement('div'); txt.className = 'txt'; txt.textContent = e.t;
    const unten = document.createElement('div'); unten.className = 'unten';
    const knopf = document.createElement('button'); knopf.textContent = '▶ Abspielen';
    knopf.onclick = () => {
      if (laeuft === knopf) { player.pause(); knopf.textContent = '▶ Abspielen'; laeuft = null; return; }
      if (laeuft) laeuft.textContent = '▶ Abspielen';
      player.src = 'audio/tower/' + e.d + '.mp3'; player.play().catch(() => {});
      knopf.textContent = '■ Stopp'; laeuft = knopf;
    };
    const lab = document.createElement('label'); const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!s.neu;
    lab.append(cb, 'neu');
    const feld = document.createElement('input'); feld.type = 'text'; feld.placeholder = 'Stichwort'; feld.value = s.w || '';
    feld.setAttribute('aria-label', 'Stichwort zu ' + e.d);
    const merken = () => {
      if (cb.checked || feld.value.trim()) stand[e.d] = { neu: cb.checked, w: feld.value.trim() }; else delete stand[e.d];
      z.className = 'z' + (cb.checked ? ' neu' : ''); sichern(); zaehlen();
    };
    cb.onchange = merken;
    feld.oninput = () => { if (feld.value.trim() && !cb.checked) cb.checked = true; merken(); };
    unten.append(knopf, lab, feld); z.append(kopf, txt, unten); liste.appendChild(z);
  }
  if (!sicht.length) liste.textContent = 'Nichts in dieser Auswahl.';
  zaehlen();
}
filter.onchange = zeigen; nurNeu.onchange = zeigen;
document.getElementById('kopieren').onclick = async () => {
  const zeilen = DATEN.filter(e => stand[e.d] && stand[e.d].neu).map(e => e.d + ' – ' + (stand[e.d].w || 'neu aufnehmen') + ' – „' + e.t + '“');
  const text = zeilen.length ? 'Keys of the Tower – neu aufnehmen (' + zeilen.length + '):\\n' + zeilen.join('\\n') : 'Keys of the Tower – nichts angekreuzt.';
  const aus = document.getElementById('ausgabe'); aus.hidden = false; aus.value = text;
  try { await navigator.clipboard.writeText(text); zahl.textContent = 'kopiert'; } catch (e) { aus.select(); zahl.textContent = 'Text markiert – bitte kopieren'; }
};
zeigen();
</script>
</body>
</html>
"""


def main():
    e = eintraege()
    seite = (SEITE.replace("__ANZAHL__", str(len(e)))
             .replace("__DATEN__", json.dumps(e, ensure_ascii=False).replace("</", "<\\/"))
             .replace("__NAMEN__", json.dumps(NAMEN, ensure_ascii=False))
             .replace("__ZUERST__", json.dumps([x["d"] for x in e if NEU.match(x["d"])] or ZUERST)))   # Vorauswahl „Zuerst anhören“ = das Neue; gibt es nichts Neues, die alte Liste
    with open(ZIEL, "w", encoding="utf-8") as f:
        f.write(seite)
    print(f"{len(e)} Aufnahmen -> {os.path.relpath(ZIEL, WURZEL)}")


if __name__ == "__main__":
    main()
