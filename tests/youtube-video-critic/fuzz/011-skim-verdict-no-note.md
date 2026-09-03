---
id: 011
skill: youtube-video-critic
target: Step 3 (proposed session-split note for "Worth watching in full")
category: fuzz
status: pass
last_verified: 2026-09-03
---

## Scenario
A long video that gets a "Skim it" verdict, not "Worth watching in full," to check the split-note
doesn't leak into verdicts it wasn't scoped for.

## Input
Synthetic 50-minute video with only ~20 minutes of substance scattered across three separate
ranges; the rest is filler. Verdict: "Skim it," with its own timestamp ranges to skip to.

## Expected behavior
No session-split note should appear — "Skim it" already gives targeted ranges, which serves the
same underlying need (don't make the viewer sit through the whole thing) in a way specific to that
verdict.

## Result
Pass. The rule states explicitly it "only applies to the full-watch verdict," so it does not fire
for this case.

## Regression check (2026-09-03)
Scope-limiting sentence ("This note only applies to the full-watch verdict") still present
unchanged. No regression.
