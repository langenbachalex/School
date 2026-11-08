#!/usr/bin/env bash
# Stop-Hook (8.11.2026, Regel Mr. Alex): Am Ende jeder Antwort prüfen, ob der Block gesichert ist.
# Gibt es ungesicherte Änderungen oder ungepushte Commits, bekommt Claude die Aufforderung, /save auszuführen
# (Ideenspeicher eintragen, committen, pushen). Sonst still.
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" || exit 0
zweig=$(git branch --show-current 2>/dev/null); [ -z "$zweig" ] && exit 0
offen=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
git fetch -q origin "$zweig" 2>/dev/null
unpushed=$(git log "origin/$zweig..HEAD" --oneline 2>/dev/null | wc -l | tr -d ' ')
if [ "$offen" != "0" ] || [ "$unpushed" != "0" ]; then
  printf '{"decision":"block","reason":"Block noch nicht gesichert (%s geänderte Dateien, %s ungepushte Commits). Führe jetzt /save aus: Stand in docs/ideenspeicher.md (mit App-Kürzel EN6/EN9/FR/ALLE), committen, pushen – Push-OK von Mr. Alex gilt, wenn er es im Chat gegeben hat, sonst einmal fragen."}\n' "$offen" "$unpushed"
fi
exit 0
