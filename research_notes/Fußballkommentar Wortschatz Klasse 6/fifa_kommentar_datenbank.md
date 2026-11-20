# How commentary databases work in football video games (FIFA / EA Sports FC, PES / eFootball, older titles) – research notes, as of November 2026

Note on reliability: every bullet under "Cited Findings" was read on the linked page unless it is marked "(search snippet only)". Those marked items were seen only in a search-result summary and the page itself could not be opened; treat them as unverified. Several pages could not be fetched at all (BBC original, EA.com FIFA 12 page, Futbin, NPR); this is listed under Gaps.

## 1. How is commentary in FIFA / EA Sports FC built technically (events, categories, name stitching, variation, priority), and how much was recorded?

### Takeaway
Commentary is a large bank of short, pre-recorded audio snippets chosen at run time by rules that look at the game state (score, time, pitch position, shot speed, player rating, crowd intensity); player names are separate recordings in several intensity levels that are joined to generic sentences. Published totals for FIFA itself are rare; the hard numbers that exist are "about 10 variants per situation" (EA NHL 15, and Guy Mowbray for EA FC), 20–25 recording days (FIFA 19), weekly sessions from November to July of 4–5 hours (EA FC 24–26) and over 20,000 player names (EA FC 26).

### Cited Findings

Selection by game state, not simple triggers
- FIFA lines are triggered from game data – score, field position, shot velocity and "thousands of things"; statement by FIFA Audio Director Jeff Macpherson, interview published 25 Feb 2013 (refers to FIFA 13 and earlier) — [Designing Sound](https://designingsound.org/2013/02/spectral-analysis-interview-with-jeff-macpherson/)
- Since about 2006/2007 FIFA moved from hand-built line sequences to context-based, data-driven "emergent behavior" with an AI layer between game and commentary; the team keeps adding rules per context and tunes them in play tests — [Designing Sound](https://designingsound.org/2013/02/spectral-analysis-interview-with-jeff-macpherson/)
- Intensity gate: a crowd-intensity value filters which lines may play (quote: "you can only say it if the crowd intensity is below a certain level"), with exceptions when a moment needs a resolution, e.g. a shot that goes wide must not get an excited line — [Designing Sound](https://designingsound.org/2013/02/spectral-analysis-interview-with-jeff-macpherson/)
- Lines are grouped by context and intensity; each sequence needs a resolution type: payoff, disappointment, or shifting gears. Making consecutive lines match in intensity and logic is called "the hardest part" — [Designing Sound](https://designingsound.org/2013/02/spectral-analysis-interview-with-jeff-macpherson/)
- General description by Pete Garcin (audio director HB Studios, worked on FIFA 11 PSP), 24 May 2011: modern sports games use "a rule-based system that models the state of the game" instead of trigger/response; vocabulary is built "from generic to specific" with multi-use lines, to "avoid single-use lines that spoil the illusion" when they repeat; commentary is "always on, always present, and must always be correct" — [Game Developer](https://www.gamedeveloper.com/audio/opinion-what-story-driven-games-can-learn-from-sports-games)
- Garcin also gave the GDC 2013 talk "Narrative Generators: Sports Games and Story Engines" (Game Narrative Summit) on using play-by-play commentary techniques for dynamic dialogue — [GDC Vault](https://gdcvault.com/play/1018972/Narrative-Generators-Sports-Games-and)

Worked example of the selection logic (EA Sports, but NHL 15, 2014 – not FIFA)
- Producer Sean Ramjagsingh: about 35,000 lines of speech recorded that year, about 13 studio sessions per commentator, about 5,000 players in the game — [Sports Illustrated, 21 Aug 2014](https://www.si.com/extra-mustard/2014/08/21/how-are-commentators-programmed-sports-video-games)
- Commentators get situational prompts (e.g. "best player on the team scores the goal"); each prompt yields about 10 sample lines; star players get five or six samples for stoppage-in-play remarks — [Sports Illustrated](https://www.si.com/extra-mustard/2014/08/21/how-are-commentators-programmed-sports-video-games)
- At a goal the system checks conditions such as game time (last minute), player rating (star threshold) and score, then picks from the matching set; the ideal is that all ten samples of a set are played before sample 1 is heard again — [Sports Illustrated](https://www.si.com/extra-mustard/2014/08/21/how-are-commentators-programmed-sports-video-games)
- Very frequent events (passes, hundreds per game) are the hardest to keep varied — [Sports Illustrated](https://www.si.com/extra-mustard/2014/08/21/how-are-commentators-programmed-sports-video-games)

Player names and stitching
- Names are recorded separately with their own intonation depending on context (name during a shot vs. during a pass); the play-by-play man has four to six intensity levels; sentences are built to flow from the name into the rest of the line (NHL 15) — [Sports Illustrated](https://www.si.com/extra-mustard/2014/08/21/how-are-commentators-programmed-sports-video-games)
- FIFA 19 (2018): Derek Rae and Lee Dixon recorded player names at different intensities "from low-key possession to a goal"; for top scorers (Ronaldo, Messi, Kane) four or five variations each — [Goal.com](https://www.goal.com/en/news/fifa-19-champions-league-mode-the-secrets-from-behind-the-scenes-/17kcfqc22q051jdl3slvq5t7l)
- EA FC 26 (2025): over 20,000 players; names are read with different intonations for passes, shots and goals; EA uses an AI copy of Guy Mowbray's voice, with his permission, for some of the names; EA statement: "it's always a collaboration with our talent – not a replacement" — [Video Games Chronicle, 18 Feb 2026, summarising a BBC Sport report](https://www.videogameschronicle.com/news/ea-sports-fc-commentator-lets-ea-use-an-ai-version-of-his-voice-to-record-some-lines-its-revealed)
- PES 2017 (2016): Konami's English team introduced "concatenation" – recorded units are linked into longer sequences instead of recording each A-to-B sequence as one line; Peter Drury mentions "seven or eight different intensities" for names — [VICE](https://www.vice.com/en/article/we-dropped-into-the-commentary-recording-for-pro-evolution-soccer-2017-533)
- Actua Soccer (1995), described as the first game with running match commentary (Barry Davies, Trevor Brooking): Davies recorded names for about 704 players of 32 national teams and insisted on several versions of each name with different emphasis ("you cannot use the same way of identifying the player every time he touches the ball") — [FootballTransfers, Aug 2026](https://www.footballtransfers.com/us/transfer-news/uk-premier-league/2026/08/from-barry-davies-to-guy-mowbray-the-art-of-video-game-commentary-explained)

How the lines are recorded
- FIFA 97 era: Motson was first given scripted lines; he later proposed that he and a co-commentator talk while watching matches — [WhatCulture](https://whatculture.com/gaming/10-mind-blowing-facts-about-the-making-of-fifa?page=8)
- From about 2006: ad-lib recording replaced scripts; example lines on paper only set tone and length; targets like "about 10" of a line type or "about 15 variations", about 2 takes; for penalties the commentators watched randomised penalty highlight reels without knowing the outcome, with a low crowd murmur in the headphones — [Designing Sound](https://designingsound.org/2013/02/spectral-analysis-interview-with-jeff-macpherson/)
- FIFA 16 (2015): Martin Tyler reacts to prompts such as "It's 3-1, and they've just scored, and there's five minutes to go – what would you say?" — [VICE](https://vice.com/da/article/a-conversation-with-football-commentator-martin-tyler-at-the-launch-of-fifa-16-959)
- FIFA 19: producer Santi Jaramillo gave Rae and Dixon scenarios, no visuals, each scenario recorded many times in different ways; 20 to 25 recording days in total; quiet material first, loud lines at the end of the day to protect the voice — [Goal.com](https://www.goal.com/en/news/fifa-19-champions-league-mode-the-secrets-from-behind-the-scenes-/17kcfqc22q051jdl3slvq5t7l)
- EA FC 24–26: Mowbray records "pretty much every week from November all the way through to the start of July"; sessions run four to five hours, remotely; Sue Smith: "our voices have to be perfect", sessions were stopped when her voice did not match earlier sessions — [FootballTransfers](https://www.footballtransfers.com/us/transfer-news/uk-premier-league/2026/08/from-barry-davies-to-guy-mowbray-the-art-of-video-game-commentary-explained); [Video Games Chronicle](https://www.videogameschronicle.com/news/ea-sports-fc-commentator-lets-ea-use-an-ai-version-of-his-voice-to-record-some-lines-its-revealed)
- EA FC 26: Rae and Robson are described as "crafting thousands of lines" (search snippet only) — [ESPN Front Row, Oct 2025](https://www.espnfrontrow.com/2025/10/rae-and-robson-bring-der-klassiker-to-life-and-imagination-to-eafc26/)
- FIFA 12 (2011) is said to have added more than 10,000 new lines (search snippet only; the EA page returned 404) — [EA.com](https://ea.com/news/fifa-12-announcers-1)

Files (modding community, not official)
- FIFA 16: all sound sits in .big archives containing pairs of .sbr (index) and .sbs (audio data) files; commentary is reported to use the EASpeex codec; a FIFA 23-era thread mentions "sbr_debug" files with original sound names and a file commentary_contextdata.bin that may map contexts to audio (unverified by the posters themselves) (search snippet only) — [SoccerGaming forum](https://soccergaming.com/forums/threads/a-universal-sound-editor.6476422/); [SoccerGaming, FIFA 16 audio tool](https://soccergaming.com/forums/threads/fifa-16-audio-modding-tool.6475774/unread)

### Inferences
- The categories that the sources imply, taken together: (a) play-by-play event lines (pass, shot, goal, save, miss), (b) player-name snippets in several intensities, (c) situation lines keyed to score and time, (d) star-player remarks, (e) colour/co-commentator reactions, (f) "resolution" lines after a build-up (payoff vs. disappointment). No source gives an official EA category list.
- Selection works in two steps: filter the bank by conditions (event + context + intensity), then pick one of the remaining variants while avoiding recently used ones.
- A priority/interruption system clearly exists (the crowd-intensity gate and the "resolution" exceptions are forms of it), but no source describes explicit priority numbers or interruption rules for FIFA.

### Gaps
- No verified total of lines or hours for any FIFA / EA FC edition. The "10,000 new lines in FIFA 12" figure and "thousands of lines" for FC 26 were seen only in search snippets.
- The BBC Sport original ("'Some people think it's live' – how is the commentary in EA FC 26 put together?", Chris Bevan, Feb 2026, with producer Paul Russell) could not be fetched; only VGC's summary was read.
- NPR (2013) on NBA 2K14 ("up to a quarter million lines") timed out; figure seen in search snippet only — [NPR](https://www.npr.org/sections/alltechconsidered/2013/11/18/245974844/calling-the-shots-realistic-commentary-heightens-video-games)
- No GDC talk by EA's FIFA audio team on the commentary system was found; explicit interruption rules are undocumented in the sources read.

## 2. Who were the English-language commentators, in which editions, and which lines are well known?

### Takeaway
The main line is Motson (from FIFA 96) with Gray, McCoist and others, then Tyldesley/Gray (FIFA 06), Martin Tyler with Andy Gray (to FIFA 11) and Alan Smith (FIFA 12 to FIFA 20), Derek Rae with Lee Dixon (FIFA 19–21) and Stewart Robson (from FIFA 22), and Guy Mowbray with Sue Smith from EA Sports FC 24. Well-sourced "famous lines from the game" are scarce; the lines people quote are mostly from real TV broadcasts.

### Cited Findings
- John Motson was the series' first commentator, joining for FIFA 96; in FIFA 97 he worked with Andy Gray, with Des Lynam introducing matches; other partners over the years: Ally McCoist, Mark Lawrenson, Chris Waddle; Motson and McCoist were replaced by Clive Tyldesley and Andy Gray for FIFA 06 — [Wikipedia, FIFA (video game series)](https://en.wikipedia.org/wiki/FIFA_(video_game_series))
- FIFA 09: Tyldesley and Gray, except on PS3/Xbox 360 where Martin Tyler replaced Tyldesley; Andy Townsend was an alternative partner — [Wikipedia](https://en.wikipedia.org/wiki/FIFA_(video_game_series))
- Martin Tyler: default commentator 2006 to 2020 per the series article; VICE also says "since 2006"; Tyler's own Wikipedia entry is reported as saying 2005 to 2020, with Gray 2005–2010 and Smith 2011–2020 (search snippet only) — [Wikipedia](https://en.wikipedia.org/wiki/FIFA_(video_game_series)); [VICE](https://vice.com/da/article/a-conversation-with-football-commentator-martin-tyler-at-the-launch-of-fifa-16-959); [Wikipedia, Martin Tyler](https://en.wikipedia.org/wiki/Martin_Tyler)
- Alan Smith replaced Andy Gray for FIFA 12 (search snippet only) — [New Game Network](https://www.newgamenetwork.com/news/2908/fifa-12-commentator-team-announced)
- Derek Rae and Lee Dixon: FIFA 19 for UEFA competitions, alternating with Tyler/Smith in FIFA 20, sole English team in FIFA 21; Stewart Robson replaced Dixon in FIFA 22 and FIFA 23 — [Wikipedia](https://en.wikipedia.org/wiki/FIFA_(video_game_series))
- Alex Scott joined FIFA 22 (as a new voice alongside Robson) (search snippet only) — [FourFourTwo](https://www.fourfourtwo.com/features/fifa-22-alex-scott-and-stewart-robson-are-announced-as-commentators-in-the-game)
- Guy Mowbray and Sue Smith: new duo from EA Sports FC 24, alternating with Rae and Robson; both pairs still in EA Sports FC 26 — [Wikipedia](https://en.wikipedia.org/wiki/FIFA_(video_game_series)); [FootballTransfers](https://www.footballtransfers.com/us/transfer-news/uk-premier-league/2026/08/from-barry-davies-to-guy-mowbray-the-art-of-video-game-commentary-explained)
- Mowbray's first game commentary was the official Champions League game for PlayStation in 2002, recorded over three days — [FootballTransfers](https://www.footballtransfers.com/us/transfer-news/uk-premier-league/2026/08/from-barry-davies-to-guy-mowbray-the-art-of-video-game-commentary-explained)
- PES: Peter Drury (with Jim Beglin) replaced Jon Champion as main commentator around PES 2016; according to Champion, Konami's lines were largely written by in-house scriptwriters (search snippets only) — [GodIsAGeek](https://godisageek.com/?p=176815); [Yahoo Sports](https://sports.yahoo.com/jon-champion-life-cult-hero-092154313.html)
- Lines associated with the games: Tyler's "He's a real bundle of energy" is named as familiar from FIFA and Sky (search snippet only) — [Bleacher Report](https://bleacherreport.com/articles/1118942-11-greatest-announcer-catch-phrases-in-world-footbal)
- PES lines that players mocked for repetition: Beglin's "high class" keeper/wage remark (PES 2018) and "ebb and flow" (still in PES 2020) (search snippets only) — [VideoGamer](https://www.videogamer.com/?p=166280); [Bleacher Report](https://bleacherreport.com/articles/2853398-pes-2020-review-the-best-pro-evo-ever-with-the-worst-problems)

### Inferences
- The 2005/2006 difference for Tyler is probably release year (2005) versus title year (FIFA 06); the sources conflict and it was not resolved.
- Gray's "Take a bow, son" and Tyler's "Agueroooo" are TV-broadcast lines; no source read ties them to the games.

### Gaps
- The Wikipedia page was read only up to about FIFA 11 in detail (page truncated); later editions rest on its summary section.
- No reliable, sourced list of famous in-game lines was found.

## 3. Are there public lists or transcripts of FIFA commentary lines, and what do they show for penalties, goals, saves and misses?

### Takeaway
No public transcript or categorised list of FIFA / EA FC commentary lines was found. What exists are modding forums that deal with the audio file formats, not with the text of the lines.

### Cited Findings
- SoccerGaming forum threads cover extraction tools for the .sbr/.sbs audio pairs, a "FIFA commentary project" and "hidden commentary names" (names recorded but not assigned to a player); the tool author says it was designed to replace existing audio, not to create new commentary (search snippets only) — [SoccerGaming](https://soccergaming.com/forums/threads/a-universal-sound-editor.6476422/); [SoccerGaming, hidden names](https://soccergaming.com/forums/threads/whoa-hidden-commentary-names.6469708/post-6691678)
- Two targeted searches for line lists ("penalty", "saved", "sends the keeper the wrong way", "what a save" with FIFA and the commentators' names) returned only real-broadcast quote collections and no game transcripts — no source to cite; see Gaps.

### Inferences
- Because no transcript was found, no example lines "from the game" are quoted here. Any example lines in section 5 are my own suggestions in ordinary football English, not quotations from FIFA.

### Gaps
- No verified in-game lines for penalty, goal, save or miss. A fan wiki or data-mined list may exist but was not found in about 25 searches and fetches. YouTube compilations of shoot-out commentary would be the practical source but were not checked.

## 4. What do developers and commentators say about the number of variants and about keeping lines short and reusable?

### Takeaway
The recurring working figure is about 10 variants per situation (up to about 15 for some line types, 4–6 for rarer star remarks), played without repeats until the set is used up. Lines must be interesting but generic, because any specific anecdote becomes annoying on the second hearing.

### Cited Findings
- Guy Mowbray (EA FC, Feb 2026) on a simple halfway-line situation: "we need 10 different ways of doing that"; he says lines "can't be scripted" because they must fit his natural style — [Video Games Chronicle](https://www.videogameschronicle.com/news/ea-sports-fc-commentator-lets-ea-use-an-ai-version-of-his-voice-to-record-some-lines-its-revealed)
- EA NHL 15 (2014): about 10 lines per prompt, 5–6 per star-player remark; aim: all ten played before the first repeats — [Sports Illustrated](https://www.si.com/extra-mustard/2014/08/21/how-are-commentators-programmed-sports-video-games)
- FIFA (2013): recording targets of "about 10" of a line type or "about 15 variations" — [Designing Sound](https://designingsound.org/2013/02/spectral-analysis-interview-with-jeff-macpherson/)
- Martin Tyler (FIFA 16, 2015): lines should be interesting but "not too specific"; a good story from Alan Smith's playing career would spoil the game if heard again and again. The article's author notes lines still repeat, especially in career mode with the same team — [VICE](https://vice.com/da/article/a-conversation-with-football-commentator-martin-tyler-at-the-launch-of-fifa-16-959)
- Pete Garcin (2011): build from generic to specific and avoid single-use lines — [Game Developer](https://www.gamedeveloper.com/audio/opinion-what-story-driven-games-can-learn-from-sports-games)
- Emotion must fit the outcome: no excited line for a shot that goes wide; line and crowd intensity are matched — [Designing Sound](https://designingsound.org/2013/02/spectral-analysis-interview-with-jeff-macpherson/)
- Even with large banks, reviewers of PES 2017–2020 complained about repeated soundbites (search snippets only) — [IBTimes](https://www.ibtimes.co.uk/pes-2017-review-konamis-pro-evo-further-refines-its-beautiful-game-1583405); [Yahoo Sports](https://uk.sports.yahoo.com/news/pes-2019-review-familiar-issues-095459340.html)

### Inferences
- What players notice is less the size of the bank than (a) the same line twice in a short time and (b) distinctive, "clever" lines. Plain lines can repeat more often without irritation.
- No source states a research-based threshold at which repetition stops being noticed; "about 10" is a production rule of thumb.

### Gaps
- No statement was found on a maximum length in words or seconds for a line.

## 5. What is the minimum sensible structure for a tiny commentary system (penalty shoot-out)?

### Takeaway
The sources support a simple recipe: a handful of events, a small set of generic variants per event drawn without repeats, a separate name slot at the start of the line, and one or two context conditions (score, decisive kick) that unlock special lines. Everything below is my own derivation from sections 1 and 4, not a published standard.

### Cited Findings
- Principle "filter by conditions, then pick a variant, exhaust the set before repeating" — [Sports Illustrated](https://www.si.com/extra-mustard/2014/08/21/how-are-commentators-programmed-sports-video-games)
- Principle "name first, sentence flows on from the name; name in more than one intensity" — [Sports Illustrated](https://www.si.com/extra-mustard/2014/08/21/how-are-commentators-programmed-sports-video-games); [Goal.com](https://www.goal.com/en/news/fifa-19-champions-league-mode-the-secrets-from-behind-the-scenes-/17kcfqc22q051jdl3slvq5t7l)
- Principle "every build-up needs a resolution: payoff or disappointment, with matching intensity" — [Designing Sound](https://designingsound.org/2013/02/spectral-analysis-interview-with-jeff-macpherson/)
- Principle "generic, reusable lines; nothing too specific" — [VICE](https://vice.com/da/article/a-conversation-with-football-commentator-martin-tyler-at-the-launch-of-fifa-16-959); [Game Developer](https://www.gamedeveloper.com/audio/opinion-what-story-driven-games-can-learn-from-sports-games)

### Inferences
- Events (6 to 8 are enough for a shoot-out): 1 player steps up (build-up), 2 run-up/tension, 3 goal, 4 save, 5 miss (wide/over/post), 6 score update, 7 decisive kick coming, 8 win/lose at the end.
- Variants: a shoot-out has 10 or more kicks, so the three outcome events (goal, save, miss) are heard most; 5–6 variants each, drawn like cards from a shuffled pack (no repeat until the pack is empty), keep a single game free of repeats. 3 variants are enough for build-up, score and ending. That gives roughly 25–35 lines in total, a realistic vocabulary load for a class 6.
- Name combination: keep the name as its own piece and put it at the start or end, where grammar does not change: "[Name] steps up." / "[Name] scores!" / "Saved! [Name] can't believe it." With text or synthetic speech, a simple template slot is enough; with recorded audio, record each name twice (calm for the build-up, excited for the goal), which mirrors the intensity levels of the big games.
- Context: two conditions already give the "live" feeling – the score ("It's two-all.") and the decisive kick ("This one to win it!").
- Resolution rule: every kick is build-up line then outcome line; the outcome line must fit the result (never a cheerful line for a miss).
- Example lines above are my own wording in standard football English, not quotations from any game.

### Gaps
- No published source describes a deliberately minimal commentary system for teaching purposes; the numbers above are scaled down from professional practice and are a judgement, not a measured result.
