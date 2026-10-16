# Word Gym – handover for another app

Written for a fresh Claude session that has not seen the school-apps repo. Goal: take the daily vocabulary session
(in the French app it is called « Séance du jour ») and **rename it to "Word Gym"** with the new icon, plus the small
improvements made in the school apps. Everything else about the séance (data model, plan, boxes, screens) stays as in
`seance-du-jour/README.md` of the Languages repo.

Source: `langenbachalex/School`, folder `docs/export/word-gym/` (public, branch `claude/awesome-dijkstra-dy57ir`).
Both school apps (class 6 and class 9) already run this; the full concept is in `docs/word-gym/konzept.md`.

## Files in this folder

| File | What it is |
|---|---|
| `README.md` | This document |
| `word-gym-klasse6.svg` / `.png` | Icon, class-6 colours (blue / red / yellow) |
| `word-gym-klasse9.svg` / `.png` | Icon, class-9 colours (dark blue / red / gold) |
| `word-gym-dunkel.svg` / `.png` | Icon for dark backgrounds (light blue figure, light bar), has its own dark background |
| `word-gym-gehoben.svg` / `.png` | Icon with the barbell lifted overhead (used when the day's plan is done) |
| `word-gym.css` | Styles for the start card, workload setting, icon, end screen, praise toast, "Again" button |
| `word-gym-kern-klasse9.js` | Reference extract of the working code (plan, boxes, cards, icon function `gymIcon()`, start card, end screen). Not runnable alone |

The SVGs have fixed colours so they work as `<img>` or favicon source. For themes use `gymIcon()` in the JS extract:
it builds the same drawing inline and takes its colours from CSS variables (`--blau`, `--rot`, `--gelb`, `--karte`, `--text`),
so light/dark mode works. Recolour by changing those variables; the app's own palette goes there.

## The icon

A stick-figure weightlifter holds a thick bar above his head; **books are the weights** (a stack of three on each end:
red, yellow, blue). Two states:
- **at rest** (`gehoben = false`): bar at y = 34, arms bent (`word-gym-klasse6.svg`)
- **lifted** (`gehoben = true`): bar at y = 16, arms straight; `heben = true` animates the lift once over 1.4 s (SMIL
  `animate` + `animateTransform`, `begin="indefinite"`, started with `beginElement()` ~0.4 s after the end screen appears).
  Reduced-motion users get no animation (CSS hides the `animate` elements).

Use: start card (92 px), page title next to "Word Gym" (40 px), end screen (120 px, lifts once). Works down to 28 px.

## What changes versus the séance in the French app

1. **Name and place.** "Word Gym" everywhere the app says « séance du jour » / « Ma séance du jour ». Keep the French wording
   in the status line if you like (« 3 nouvelles · 8 à réviser · 2 / 11 faites »). The home page shows one large card at the
   top: icon, "Word Gym", status line, one dot per card (round = new, square = revision, filled = done), a main button
   ("▶ Let's go" / "▶ Continue" / "Have a look" when done) and a ⚙ button.
2. **Workload setting (new).** ⚙ opens two selects: new words per day (1–6) and revisions per day (4–12). The default is
   labelled "(recommended)". A change applies to tomorrow's plan, or to today's if nothing has been done today yet
   (`tag = null` → plan is recomputed); otherwise the "plan is fixed for the day" rule stays intact. Stored as
   `gym.pensum = { neu, wdh }`; the code clamps it to the limits in the data (`grenzen`). It never changes points.
3. **Speaking minimum.** `sprechDauer(d, min)` takes a minimum; Word Gym uses 1.5 s (pupils). The adult app can keep 1.8 s.
4. **Praise with translation as toast.** After "I knew it" a toast shows the praise large with its translation underneath
   (the French app already has `de` in the praise lists, so this is a display change only).
5. **"Again" button** gets its own colour (yellow) so it is clearly different from "I knew it"; counter text
   « 2 / 9 · révision · niveau 1 » is unchanged.
6. **Finished Word Gym counts as a practice day** for streak and perfect week, plus the points (30) and as **one part** towards
   the map/places unlock (`teileZaehler = parts + gym.seances`).
7. **End screen** shows the lifting icon, the praise with translation, then the two spoken lines
   ("That's it for today. See you tomorrow!" / break variant) after the praise, never at the same time.
8. **Optional small extras** from the school apps, if wanted (not part of the rename):
   - Reward stamp: when a new place unlocks, a card with the place and a slanted « VISITED ✓ » stamp, plus a short
     "tock + bling" sound made in the browser (Web Audio, no files). Code in `app/klasse9/app.js` (`stempel`, `stempelKlang`),
     styles at the end of `app/style.css` (section "Reisestempel").
   - Praise chooser with "no repeat within 10 and no same keyword within 3" is already in the French app (`waehleRuf`).

## Checklist for the other chat

1. Read `seance-du-jour/README.md` (Languages repo) and this folder.
2. Rename: UI strings `seance`, `seance_fertig`, `seance_stand`, `seance_leer`, `seance_titel`, the home button, the
   end screen, the document title/manifest if they mention « séance »; code identifiers may stay or be renamed to `gym*`
   (the school apps use `gym*`).
3. Copy the SVGs into the app (class-6 colours or the app's own palette); add `word-gym.css` and adapt the colour variables.
4. Replace the séance button/card by `gymKarte()` (start card with ⚙), the title by `gymKopf()`.
5. Add the workload setting and the 1.5 s minimum option.
6. Show praise as translated toast; keep recordings as they are.
7. Rebuild the service-worker file list (new SVG/PNG files), test with a fake date (`window.__heute`) over three days:
   day 1 new cards only, day 2 revisions + new, day 3 workload change before starting.
8. Do not publish or push anything that Mr. Alex has not asked for; ask before each build step.

## Test expectations (from the school apps)

- Day 1: plan = N new, status « N new · 0 to revise · 0 / N done »; finishing gives +30 points, all cards level 0, due tomorrow.
- Day 2: revisions first (due cards), then new; "Again" puts the card at the end once (counter grows by one), "I knew it" → level 1, due in 3 days.
- Day 3 after changing the workload to 2 new before starting: status shows 2 new.
- Toggling help language or colour theme in the middle of a session keeps the position.
