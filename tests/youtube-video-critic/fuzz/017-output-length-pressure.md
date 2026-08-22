---
id: 017
skill: youtube-video-critic
target: Step 4 vs Step 5 priority under genuine output-length/token pressure
category: stress
status: pass
last_verified: 2026-08-23
---

## Scenario
A very long, dense video (e.g. a 3-hour multi-topic podcast transcript) that already produces a
long table, long verdict, and a full 6-item takeaways list before Step 5 is even reached. Stresses
whether something has to get cut once the response is already large, and which step loses.

## Input
N/A — traced as an execution/priority order question, not a synthetic transcript.

## Expected behavior
If anything is dropped under real length/token pressure, it should be Step 5 (ledger), never Step
4 — the opposite of the original bug, where Step 5 was surviving at Step 4's expense.

## Result
Pass, with a caveat already recorded elsewhere in this suite. SKILL.md Step 5 states this
explicitly: "if something has to give under time or token pressure, drop this step, never Steps
1-4." That is the correct priority order and directly protects Step 4. Caveat (not a new finding,
restated because it applies directly here): this is a soft instruction with no trigger mechanism —
the model has to recognize it is "under pressure" and recall the rule itself; there's no mechanical
enforcement forcing Step 5 to actually get cut first. Consistent with the residual-risk note in
case 015: raises the odds of correct behavior, doesn't guarantee it.
