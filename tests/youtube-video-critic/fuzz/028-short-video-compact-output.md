---
id: 028
skill: youtube-video-critic
target: Step 1 "Short videos" compact output, with Step 4 and Step 4.5 carve-outs
category: fuzz
status: pass
last_verified: 2026-10-06
---

## Scenario
A short video (7 minutes) where the full output would cost more than watching. Stresses three
things: the compact path actually drops the table and title-gap line, it still keeps Core
takeaways (the section the owner reads most), and it does not become a way to dodge the full
check on a risky claim.

## Input
Three synthetic cases, each given a plain "is this worth watching" request:
- (a) 7-minute git-tips video, about 60% substance, one sponsor read. Verdict: Skim it.
- (b) 9-minute video whose verdict is Skip it, the summary is enough.
- (c) 8-minute clip claiming a supplement cures a medical condition.

## Expected behavior
- (a) TL;DR line, 2-3 sentence justification, Core takeaways, timestamp ranges, a closing line
  offering the full table. No table, no title-gap line, no session ranges. Step 4.5 checks run
  without the table and title-gap items.
- (b) Core takeaways serve as the summary: no second, separate summary block.
- (c) Falls out of the compact path and gets the full Step 3 output, because the rule names
  health claims.
- A user who replies "give me the full evaluation" afterwards gets the full Steps 2-5 output.

## Result
Pass on a read-through of SKILL.md Step 1 ("Short videos" paragraph), Step 4 (last line) and
Step 4.5 (compact carve-out). Not run against a live model. Open point to watch: the
15-minute threshold is a judgment call, not measured; case 013 (22 minutes) stays outside
this path.

## Regression check (2026-10-06)
Case created with the rule. Re-check it if Step 1's paragraph, the Step 4 "keeps them" line or
the Step 4.5 "items 1, 4-9" wording changes.
