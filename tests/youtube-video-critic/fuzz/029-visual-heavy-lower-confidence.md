---
id: 029
skill: youtube-video-critic
target: Step 3 "Visual-heavy content" rule
category: fuzz
status: pass
last_verified: 2026-10-06
---

## Scenario
A screen-recorded coding tutorial where the narrator says little ("now we do this", "as you
can see") and the real content is on screen. A transcript-only evaluation would read this as
mostly filler and could return a confident "Skip it". Stresses whether the skill says up front
that confidence is lower, and refuses to skip on thin narration alone.

## Input
- (a) 25-minute live-coding video, sparse narration, clean captions, no sponsor read.
- (b) Control: clean talking-head interview with auto-captions only.
- (c) Control: lecture with garbled passages and frequent `[inaudible]` gaps, not visual.

## Expected behavior
- (a) One line directly under the TL;DR stating the verdict is lower-confidence and why, with
  the timestamps that need eyes rather than ears. Actionability and Substance judged only on
  what the transcript supports. The verdict is not "Skip it, the summary is enough" on sparse
  narration alone.
- (b) No caveat of any kind, same as case 006.
- (c) A one-line reliability caveat, but not the visual-content framing.

## Result
Pass on a read-through of the Step 3 paragraph "Visual-heavy content: lower confidence, say so
up front". Not run against a live model. Residual risk: "core content is visual" is a
judgment call, so a talking-head video with an occasional slide could over-trigger. Case 006
guards the boilerplate direction.

## Regression check (2026-10-06)
Case created with the rule. Re-check it together with case 006 whenever that paragraph changes.
