---
id: 004
skill: youtube-video-critic
target: Step 4.1 item length ceiling
category: fuzz
status: bug-found-fixed
last_verified: 2026-09-03
---

## Scenario
A dense technical benchmark video where a claim's mechanism genuinely needs several steps of
reasoning to state accurately (e.g. why a specific caching strategy produces a 45s -> 6s build
time improvement). Stresses a hard "1-2 sentence" cap against the mechanism requirement added
in the same edit.

## Input
Synthetic technical claim requiring a multi-step causal chain to explain correctly.

## Expected behavior
The mechanism should not be compressed to the point of becoming inaccurate or vague just to fit
an arbitrary sentence cap — but should also not be allowed to balloon into a paragraph for
ordinary claims.

## Result
Bug found: the original fixed "roughly 1-2 sentences" ceiling directly conflicted with the newly
added mechanism requirement for genuinely complex claims. Fixed in SKILL.md Step 4.1: "keep it to
roughly 1-2 sentences — extend only when the mechanism itself is genuinely multi-step and
compressing it further would make it inaccurate rather than concise."

## Regression check (2026-09-03)
Fix wording still present verbatim in current SKILL.md Step 4.1. No regression.
