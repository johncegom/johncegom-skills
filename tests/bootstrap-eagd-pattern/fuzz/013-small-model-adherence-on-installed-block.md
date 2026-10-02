---
id: 013
skill: bootstrap-eagd-pattern
target: the reply rule as installed in an anchor doc, followed by readers of different sizes
category: fuzz
status: bug-found-open
last_verified: 2026-10-03
---

## Scenario
The rule is deterministic, so a reader that follows it gets one right answer per input. A prose rule is only as good as its weakest reader. This case checks how well fresh agents of two sizes follow the installed text, as opposed to whether the rule is internally consistent (cases 006 to 011).

## Input
29 scenarios against this repo's installed `CLAUDE.md` block: 20 hand-picked adversarial replies (padding, decoration, `-latest`, echoes, bare families, display names, an own-model reply equal to `reported=`, an alias like `default`) and 10 random ones. Each reader returns the ordered actions and a summary; scored against the consensus of the independent oracles. Flagged-row scenarios are excluded because the installed block predates `flagged` and says to skip any row that is not `status=ok`.

## Expected behavior
Every reader reaches the same branch, asks only when the rule says to, and never edits a binding before the human has answered.

## Result
On the final wording: sonnet matched on 27 of 27 in both runs; haiku matched on 13 to 25 of 27 across seven runs. No action-order violation occurred in any run. The haiku misses are scattered (no scenario failed in every run, and a scenario one run missed another got right), so this is mostly capacity noise on a batch of hard cases, not one ambiguity. Rewriting the rule from a paragraph into a numbered list did not help (20, 22, 13, 22 versus 25, 20, 16 beforehand). Recurring haiku misses: not applying the `-latest` strip to `model=` (so `sonnet-latest` never matches `sonnet`), and miscounting changed rows for a stale row. Left open: the cheap fix (worked examples in the directive) costs context in every session and was not applied. Re-run on any model or wording change; do not read an old pass as current.
