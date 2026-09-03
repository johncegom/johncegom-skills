---
id: 001
skill: youtube-video-critic
target: Step 4.1 mechanism requirement
category: fuzz
status: pass
last_verified: 2026-09-03
---

## Scenario
A motivational-speaker style video that only asserts conclusions ("successful people wake up
early", "be disciplined", "never give up") with zero reasoning behind any of them. Stresses
whether the mechanism requirement degrades into repetitive boilerplate when nothing in the
source ever explains "why".

## Input
Synthetic transcript: 5 short motivational assertions, no data, no causal explanation for any
of them, no demonstrations.

## Expected behavior
Every takeaway item ends up tagged with "the video doesn't explain the mechanism" rather than a
fabricated reason. Repetition across items is expected and correct here — it should read as a
signal about the video (low substance), not as a Step 4 formatting bug.

## Regression check (2026-09-03)
Re-verified against current SKILL.md: the same line ("If every item in the list ends up with no
stated mechanism, that's a sign the video itself is low-substance — let that show up in the Step
2/3 verdict rather than treating it as a Step 4 problem to fix") is still present, unchanged by
the recent ledger Status-column work. No regression.

## Result
Behaves as intended: the guardrail against inventing a mechanism holds, and SKILL.md line 98
now explicitly says a list where every item lacks a mechanism should already be reflected in the
Step 2/3 substance verdict, not treated as something Step 4 needs to fix. No change needed to
this specific rule.
