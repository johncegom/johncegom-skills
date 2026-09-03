---
id: 013
skill: youtube-video-critic
target: Step 3 (proposed session-split note for "Worth watching in full")
category: fuzz
status: pass
last_verified: 2026-09-03
---

## Scenario
A short "Worth watching in full" video, to check the ~30-minute soft heuristic actually gates the
note instead of it firing on every full-watch verdict regardless of length.

## Input
Synthetic 22-minute video, clean single-topic explainer, no filler. Verdict: "Worth watching in
full."

## Expected behavior
No session-split note — a 22-minute video isn't the "hard to watch in one sitting" problem this
rule exists for.

## Result
Pass. The rule is scoped to "roughly 30+ minutes," so a 22-minute video falls outside it and no
note is added.

## Regression check (2026-09-03)
"Roughly 30+ minutes" threshold still present unchanged. No regression.
