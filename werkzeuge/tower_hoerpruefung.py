#!/usr/bin/env python3
"""Hörprüfung für die Tower-Aufnahmen: lässt jede Aufnahme von ElevenLabs mitschreiben (Speech to Text, Modell scribe_v1)
und vergleicht mit dem Soll-Text aus den Tabellen. Findet vor allem doppelt gesprochene Wörter („Yep. Yep.“, „The the woman“),
die bei niedriger Stabilität und Regie wie „goofy“ entstehen (Mr. Alex 19.11.2026: nach jeder Vertonung laufen lassen).

Aufruf: python3 werkzeuge/tower_hoerpruefung.py [figur …] [--neu DATEI …]
  ohne Angabe alle Aufnahmen; mit Figur(en) nur diese; --neu prüft nur die genannten Dateien (ohne .mp3).
Ausgabe: je Fund eine Zeile DOPPELT / ANDERS / LEER; am Ende die Zahlen. Kostet Credits für das Mitschreiben (wenig).
Braucht am Schlüssel das Recht „Speech to Text“. In der Cloud nur über HTTP/1.1 (curl --http1.1).
Falsche Treffer sind möglich (gewollte Wiederholungen wie „Dun-dun-dun“, Zahlen, britische Schreibweise) – selbst urteilen.
"""
import json, os, re, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tower_audio as ta

GEWOLLT = {"gary_44"}   # Wiederholung steht so im Text


def norm(t):
    return re.sub(r"[^a-z0-9' ]", " ", t.lower().replace("’", "'").replace("…", " ")).split()


def soll(teile):
    return " ".join(re.sub(r"\s+", " ", re.sub(r"\[[^\]]*\]", "", t)).strip() for t in teile)


def mitschrift(pfad):
    fehler = ""
    for _ in range(3):
        r = subprocess.run(["curl", "-sS", "--http1.1", "--max-time", "90", "-X", "POST", "https://api.elevenlabs.io/v1/speech-to-text",
                            "-H", "xi-api-key: " + os.environ.get("ELEVENLABS_API_KEY", "dummy"), "-F", "model_id=scribe_v1",
                            "-F", "language_code=en", "-F", "tag_audio_events=false", "-F", "file=@" + pfad], capture_output=True, text=True)
        try:
            d = json.loads(r.stdout)
            if d.get("text", "").strip():
                return d["text"].strip()
            fehler = str(d)[:150]
        except Exception:
            fehler = (r.stdout + r.stderr)[:150]
    return "FEHLER " + fehler


def doppelt(a, b):
    """wiederholte Wortfolge in der Mitschrift, die im Soll-Text nicht wiederholt ist"""
    for n in (4, 3, 2, 1):
        for i in range(len(b) - 2 * n + 1):
            if b[i:i + n] == b[i + n:i + 2 * n]:
                rep = b[i:i + n]
                if not any(a[j:j + n] == rep and a[j + n:j + 2 * n] == rep for j in range(len(a) - 2 * n + 1)):
                    return " ".join(rep)
    return ""


def pruefen(stuecke):
    def eins(s):
        d, fig, teile, _ = s
        t, g = soll(teile), mitschrift(os.path.join(ta.ZIEL, d))
        a, b = norm(t), norm(g)
        return {"d": d[:-4], "f": fig, "soll": t, "ist": g, "doppelt": "" if d[:-4] in GEWOLLT else doppelt(a, b), "mehr": len(b) - len(a)}
    with ThreadPoolExecutor(6) as ex:
        return list(ex.map(eins, stuecke))


def main():
    arg = sys.argv[1:]
    neu = set(arg[arg.index("--neu") + 1:]) if "--neu" in arg else None
    figuren = [x for x in (arg[:arg.index("--neu")] if "--neu" in arg else arg)]
    st = [s for s in ta.stuecke() if os.path.exists(os.path.join(ta.ZIEL, s[0]))]
    st = [s for s in st if (not figuren or s[1] in figuren) and (neu is None or s[0][:-4] in neu)]
    res = pruefen(st)
    n = 0
    for r in res:
        art = "LEER" if r["ist"].startswith("FEHLER") else "DOPPELT" if r["doppelt"] else "ANDERS" if abs(r["mehr"]) >= 2 else ""
        if art:
            n += 1
            print(f"{art} {r['d']} [{r['f']}] {('«' + r['doppelt'] + '» ') if r['doppelt'] else ''}| soll: {r['soll']} | ist: {r['ist']}")
    print(f"{len(res)} geprüft, {n} auffällig" + ("" if n else " – ALLES OK"))
    return res


if __name__ == "__main__":
    main()
