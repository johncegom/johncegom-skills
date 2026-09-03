---
id: 010
skill: youtube-video-critic
target: Step 3 (proposed session-split note for "Worth watching in full")
category: fuzz
status: pass
last_verified: 2026-09-03
---

## Scenario
A long tutorial where every step depends on the previous one, to check the rule correctly refuses
to suggest a split and instead tells the viewer to expect one sitting.

## Input
Synthetic 50-minute live-coding tutorial transcript building a single feature step by step, each
step referencing state set up in the prior step, no independent sections. Verdict: "Worth watching
in full."

## Expected behavior
The rule should recognize this as a continuous, dependency-chained video and say so explicitly —
no invented split point, and an explicit statement that watching in one sitting (or accepting lost
context) is the tradeoff.

## Result
Pass. The rule's second branch ("cumulative argument where each part depends on following the
previous one ... say so explicitly instead of inventing a split point") covers this case directly.

## Regression check (2026-09-03)
Continuous/dependency-chained branch still present unchanged in current SKILL.md Step 3. No
regression.
