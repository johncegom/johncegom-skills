---
id: 006
skill: youtube-video-critic
target: Step 3 "Skip it" verdict caveat
category: fuzz
status: bug-found-fixed
last_verified: 2026-09-03
---

## Scenario
An ordinary, clearly-spoken talking-head video with standard auto-generated captions (the
overwhelming majority of YouTube videos). Stresses whether the "flag unreliable transcript"
caveat added to the "Skip it" verdict triggers so broadly it becomes meaningless boilerplate —
the same failure mode found in case 001, but for a different rule.

## Input
Synthetic description: clean auto-captions, clear single speaker, no visual-dependent content.

## Expected behavior
No caveat should appear — the transcript is reliable and the video isn't visual-heavy, so there's
nothing to flag.

## Result
Bug found: the first version of this rule triggered on "the transcript is auto-generated" alone,
which is true for nearly every video and would have made the caveat a near-default disclaimer,
undermining its own signal value. Fixed in SKILL.md Step 3 (the "Skip it" bullet): narrowed the
trigger to actual signs of unreliability — "garbled passages, frequent `[inaudible]`/gaps, or the
video's core content is visual/demonstrated in a way the transcript only gestures at" — with an
explicit note that "ordinary clean auto-captions on a talking-head video need no caveat at all."

## Regression check (2026-09-03)
Narrowed trigger and explicit no-caveat note still present unchanged in current SKILL.md Step 3.
No regression.
