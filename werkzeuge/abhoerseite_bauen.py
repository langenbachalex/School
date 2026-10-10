"""Baut abhoeren/kernsaetze.html: alle Kernsatz-Audios zum Durchhören (Audios eingebettet).
Aufruf: python3 werkzeuge/abhoerseite_bauen.py
"""
import base64, csv, html, json, os, re

BASIS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO = os.path.join(BASIS, "app", "audio", "kernsaetze")
ZIEL = os.path.join(BASIS, "abhoeren", "kernsaetze.html")
GRUPPEN = [("st1_", "Station 1 – Wege zur Schule"), ("st2a_", "Station 2 – Teil A: regelmäßig"),
           ("st2u_", "Station 2 – Übersicht"), ("st2_merksatz", "Station 2 – Merksatz"),
           ("st2b_", "Station 2 – Teil B: Ausnahmen"), ("st3_", "Station 3 – Uhrzeiten"),
           ("st4_", "Station 4 – Aufgaben verstehen")]
STIMMEN = [("en", "🔊 Anhören")]

with open(os.path.join(BASIS, "inhalte", "kernsaetze.tsv"), encoding="utf-8") as f:
    zeilen = list(csv.DictReader(f, delimiter="\t"))

daten, teile = {}, []
for praefix, titel in GRUPPEN:
    gruppe = [z for z in zeilen if z["id"].startswith(praefix) and z.get("_drin") is None]
    for z in gruppe:
        z["_drin"] = True
    if not gruppe:
        continue
    karten = []
    for z in gruppe:
        knoepfe = []
        for k, name in STIMMEN:
            pfad = os.path.join(AUDIO, f"{z['id']}_{k}.mp3")
            if os.path.exists(pfad):
                schluessel = f"{z['id']}_{k}"
                with open(pfad, "rb") as a:
                    daten[schluessel] = "data:audio/mpeg;base64," + base64.b64encode(a.read()).decode()
                knoepfe.append(f'<button data-k="{schluessel}">{name}</button>')
        en = html.escape(z["englisch"].replace("[", "").replace("]", ""))
        gespr = z["englisch_gesprochen"] or z["deutsch_gesprochen"]
        gespr = re.sub(r"\s*<break[^>]*/>", " …", gespr or "")
        karten.append(f'''<li class="z" data-id="{z['id']}">
<div class="txt"><p class="en" lang="en">{en}</p><p class="de" lang="de">{html.escape(z['deutsch'])}</p>
{f'<p class="sp">gesprochen: {html.escape(gespr)}</p>' if gespr else ''}<p class="id">{z['id']}</p></div>
<div class="btns"><button class="go" data-row>▶ Ablauf</button>{''.join(knoepfe)}<button class="flag" data-flag aria-pressed="false">⚑ Nochmal</button></div></li>''')
    teile.append(f'<section><div class="kopf"><h2>{titel}</h2><button data-all>▶ Alle abspielen</button></div><ol>{"".join(karten)}</ol></section>')

seite = f'''<title>Kernsätze abhören</title>
<style>
/* Layout: eine Spalte, Station als Abschnitt, Satzzeilen mit großen Fingertasten */
:root{{--bg:#f6f7f9;--card:#fff;--fg:#1c2433;--mute:#5b6577;--accent:#1d5fbf;--line:#d9dee7;--warn:#b45309;--warnbg:#fff4e5;
--display:"Fredoka",system-ui,sans-serif;--body:"Atkinson Hyperlegible",system-ui,sans-serif;--mono:ui-monospace,Menlo,Consolas,monospace}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#12161d;--card:#1b212b;--fg:#e8ecf3;--mute:#9aa4b5;--accent:#7fb0ff;--line:#2c3542;--warn:#fbbf24;--warnbg:#2e2412;color-scheme:dark}}}}
:root[data-theme="dark"]{{--bg:#12161d;--card:#1b212b;--fg:#e8ecf3;--mute:#9aa4b5;--accent:#7fb0ff;--line:#2c3542;--warn:#fbbf24;--warnbg:#2e2412;color-scheme:dark}}
body{{background:var(--bg);color:var(--fg);font:16px/1.5 var(--body)}}
main{{max-width:52rem;margin:0 auto;padding-block:24px 64px;padding-inline:16px;display:grid;gap:28px}}
h1{{font:600 1.9rem/1.2 var(--display);margin:0}} h2{{font:600 1.25rem/1.3 var(--display);margin:0;text-wrap:balance}}
.intro{{color:var(--mute);margin:0;max-width:65ch}}
.kopf{{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;margin-bottom:10px}}
ol{{list-style:none;margin:0;padding:0;display:grid;gap:8px}}
.z{{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px;display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;justify-content:space-between}}
.z.spielt{{border-color:var(--accent)}} .z.fl{{background:var(--warnbg);border-color:var(--warn)}}
.txt{{min-width:0;flex:1 1 18rem}} .txt p{{margin:0}}
.en{{font:500 1.15rem/1.3 var(--display)}} .de{{color:var(--mute)}} .sp{{font-size:.85rem;color:var(--mute);font-style:italic}}
.id{{font-size:.75rem;font-family:var(--mono);color:var(--mute)}}
.btns{{display:flex;flex-wrap:wrap;gap:6px}}
button{{font:inherit;min-height:44px;padding:0 14px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--fg);cursor:pointer}}
button:focus-visible{{outline:3px solid var(--accent);outline-offset:2px}}
button.go,[data-all]{{background:var(--accent);border-color:var(--accent);color:var(--bg)}}
button.flag[aria-pressed="true"]{{background:var(--warn);border-color:var(--warn);color:var(--bg)}}
.leiste{{position:sticky;top:env(safe-area-inset-top,0px);z-index:2;background:var(--bg);padding-block:10px;border-bottom:1px solid var(--line);display:flex;flex-wrap:wrap;gap:8px;align-items:center}}
.leiste .now{{flex:1 1 12rem;color:var(--accent);font-weight:700;min-height:1.5em}}
.merk{{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px;display:grid;gap:8px}}
.merk textarea{{width:100%;box-sizing:border-box;min-height:5rem;font:14px var(--mono);background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:8px}}
</style>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&family=Atkinson+Hyperlegible:wght@400;700&display=swap">
<main>
<header style="display:grid;gap:8px"><h1>Kernsätze abhören</h1>
<p class="intro">{len(daten)} Audios. Jeder Satz hat ein Audio (Englisch, Stimme Mr. Alex). Klingt etwas falsch, tippe auf „⚑ Nochmal“. Die markierten Sätze stehen unten zum Kopieren bereit.</p></header>
<div class="leiste"><span class="now" id="now" aria-live="polite"></span><button id="stop">■ Stopp</button></div>
{''.join(teile)}
<section class="merk"><h2>Markiert zum Nachbessern</h2>
<textarea id="liste" readonly aria-label="Markierte Sätze"></textarea>
<div class="btns"><button id="kopie">Liste kopieren</button><button id="leer">Markierungen löschen</button></div></section>
</main>
<script>
const A={json.dumps(daten)};
const now=document.getElementById("now"),liste=document.getElementById("liste");
const NAME={{en:"Englisch"}};
let audio=null,queue=[],run=0;
function stop(){{run++;queue=[];if(audio)audio.pause();now.textContent="";document.querySelectorAll(".spielt").forEach(x=>x.classList.remove("spielt"))}}
function play(items){{stop();queue=items;step(run)}}
function step(r){{if(r!==run)return;document.querySelectorAll(".spielt").forEach(x=>x.classList.remove("spielt"));
 const it=queue.shift();if(!it){{now.textContent="";return}}
 if(it.pause){{setTimeout(()=>step(r),it.pause);return}}
 const li=document.querySelector(`[data-id="${{it.id}}"]`);li.classList.add("spielt");
 if(it.scroll)li.scrollIntoView({{block:"nearest",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"}});
 const k=it.k.slice(it.id.length+1);now.textContent="Spielt: "+it.id+" · "+NAME[k];
 audio=new Audio(A[it.k]);audio.onended=()=>setTimeout(()=>step(r),700);audio.play().catch(()=>{{now.textContent=""}})}}
function rowItems(li,scroll){{const id=li.dataset.id;return [...li.querySelectorAll("[data-k]")].map((b,i)=>({{id,k:b.dataset.k,scroll:scroll&&i===0}}))}}
const KEY="kernsaetze-markiert";
function lesen(){{try{{return JSON.parse(localStorage.getItem(KEY)||"[]")}}catch(e){{return []}}}}
function speichern(a){{try{{localStorage.setItem(KEY,JSON.stringify(a))}}catch(e){{}}}}
function zeigen(){{const ids=[...document.querySelectorAll(".z.fl")].map(li=>li.dataset.id+": "+li.querySelector(".en").textContent+(li.querySelector(".de").textContent?" / "+li.querySelector(".de").textContent:""));
 liste.value=ids.join("\\n")||"(noch nichts markiert)"}}
lesen().forEach(id=>{{const li=document.querySelector(`[data-id="${{id}}"]`);if(li){{li.classList.add("fl");li.querySelector("[data-flag]").setAttribute("aria-pressed","true")}}}});zeigen();
document.addEventListener("click",e=>{{const b=e.target.closest("button");if(!b)return;const li=b.closest(".z");
 if(b.dataset.k)play([{{id:li.dataset.id,k:b.dataset.k}}]);
 else if(b.hasAttribute("data-row"))play(rowItems(li,false));
 else if(b.hasAttribute("data-all"))play([...b.closest("section").querySelectorAll(".z")].flatMap(l=>[...rowItems(l,true),{{pause:900}}]));
 else if(b.hasAttribute("data-flag")){{const on=li.classList.toggle("fl");b.setAttribute("aria-pressed",on);speichern([...document.querySelectorAll(".z.fl")].map(x=>x.dataset.id));zeigen()}}
 else if(b.id==="stop")stop();
 else if(b.id==="leer"){{document.querySelectorAll(".z.fl").forEach(x=>{{x.classList.remove("fl");x.querySelector("[data-flag]").setAttribute("aria-pressed","false")}});speichern([]);zeigen()}}
 else if(b.id==="kopie"){{navigator.clipboard.writeText(liste.value).then(()=>{{b.textContent="Kopiert"}},()=>{{liste.select()}})}}
}});
document.addEventListener("keydown",e=>{{if(e.code==="Escape")stop()}});
</script>'''
os.makedirs(os.path.dirname(ZIEL), exist_ok=True)
with open(ZIEL, "w", encoding="utf-8") as f:
    f.write(seite)
print(ZIEL, len(daten), "Audios", round(len(seite) / 1e6, 1), "MB")
