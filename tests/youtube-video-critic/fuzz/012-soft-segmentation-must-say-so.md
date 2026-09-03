---
id: 012
skill: youtube-video-critic
target: Step 3 (proposed session-split note for "Worth watching in full")
category: fuzz
status: bug-found-fixed
last_verified: 2026-09-03
---

## Scenario
A panel discussion where topics shift gradually with no clean handoff — neither cleanly segmented
nor fully continuous. This is the adversarial middle case the rule has to handle without either
fabricating a breakpoint or silently saying nothing.

## Input
Synthetic 35-minute panel transcript where three speakers drift between related subtopics with
soft, overlapping transitions — no single timestamp marks a clean end-of-topic. Verdict: "Worth
watching in full."

## Expected behavior
The rule must not invent a breakpoint just to satisfy the instruction, and must not silently omit
the note either — it has to explicitly tell the viewer the video doesn't break down cleanly.

## Result
Bug found in the first drafted wording, fixed before landing. An earlier draft phrased the
non-breakpoint branch as "default to not suggesting a split rather than inventing one," which
allowed a silent omission — the viewer would get no signal either way. Reworded to require an
explicit statement in this case ("say so explicitly ... tell the viewer the video doesn't break
down cleanly"), so the rule now has exactly two outcomes for a full-watch verdict: a concrete,
timestamp-grounded split, or an explicit "this doesn't split cleanly, expect one sitting" — never
silence, never a fabricated timestamp.

## Regression check (2026-09-03)
The two-outcomes wording ("a concrete, timestamp-grounded split, or an explicit... never
silence") still present unchanged. No regression.
