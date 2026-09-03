---
id: 015
skill: youtube-video-critic
target: Step 4 <-> Step 5 execution order (ledger updates crowding out Core takeaways)
category: fuzz
status: bug-found-fixed
last_verified: 2026-09-03
---

## Scenario
Reported by the user: once Step 5 (ledger maintenance) was hardened to reliably fire on every
evaluation, Step 4 (Core takeaways / Personal application) started getting skipped more often.
Traces execution order and instruction salience rather than transcript content, the same method
used in cases 005/007/008/014.

## Input
N/A — found by re-reading Steps 3-5 top-to-bottom as an execution trace, with an existing ledger
already present (Case A, so Step 5 is guaranteed to fire per the "once a ledger exists, maintain
it automatically" rule in the old Step 5 section).

## Expected behavior
A full evaluation should never end with the ledger updated but Core takeaways/Personal
application missing or truncated from the response. The step that reliably produces a visible
tool action (ledger write) must not out-compete the step that only produces prose output (Step 4).

## Result
Bug confirmed in the pre-edit text: Step 5's warnings ("Critically, never assume a file write is
visible...", named past failure) were far more vivid/imperative than Step 4's soft "always add two
more sections", and the two steps were independent siblings with nothing gating one on the other —
a model could reach the verdict and jump straight to the now-heavily-reinforced ledger action,
treating Step 4 as skippable filler.

Fixed in SKILL.md:
1. Step 4's inclusion rule split into two direct sentences (default-include first, exception
   second) instead of one sentence with the exception embedded before the default.
2. A checklist added at the end of Step 4 reinforcing that its sections are mandatory and don't
   become optional just because Step 5 also needs attention.

Follow-up bug found and fixed in the same session: the first version of fix #3 made Step 5
explicitly conditional on Step 4 ("runs strictly after Step 4's sections have actually been
produced... never update the ledger from a verdict that skipped Step 4"). Checking this against
`ledger-template.md`'s row schema (`Date | Title | Link | Channel | Length | Verdict | Score |
Reason`) showed the ledger never stores takeaways at all — so the "dependency" was purely
rhetorical, not a real data requirement. Since nothing in a prompt doc mechanically enforces a
conditional, that framing only had a downside: if a model took the block literally but still
dropped Step 4, it would now also withhold the previously-reliable ledger update, turning a
partial failure (ledger fine, takeaways missing) into a total one (both missing), for no
data-integrity benefit. Fixed by decoupling: Step 4's checklist now stands on its own without
citing Step 5, and Step 5 states explicitly that it is independent and must run regardless of how
Step 4 went.

Second follow-up, found on a critical re-read of the decoupled wording:
1. The checklist's opening clause ("Before doing anything else, confirm...") lost its referent
   once the Step 5 dependency language was removed — "anything else" no longer pointed at
   anything specific. Reworded to "Before moving on to Step 5, confirm..." to restore a concrete
   sequencing cue without reintroducing a conditional block.
2. The salience imbalance identified as the root cause (Step 5's vivid, consequence-laden
   language out-competing Step 4's plain phrasing) was only rebalanced in SKILL.md itself — Step 5
   still instructs reading `ledger-template.md` "before touching the ledger," and that file's
   Case B section still carried a narrated incident ("this exact failure happened in real use...
   the user never saw the change") that reloads the same disproportionate emphasis right at Step
   5's execution point. Trimmed that file to keep the operative rule (don't infer visibility from
   tool availability) and drop the narration, so the fix doesn't just relocate the asymmetry to a
   file one hop away.

Residual risk noted, not a bug: all of this is prompt-level reinforcement, not mechanically
enforced — it raises Step 4's compliance probability rather than guaranteeing it, and none of it
has been checked against a live run, only static tracing (same method as cases 005/007/008/014).
Worth a real-world check-in if the original symptom recurs.

## Regression check (2026-09-03)
Step 4's default-include/exception split, its pre-Step-5 checklist ("Before moving on to Step 5,
confirm..."), and Step 5's independence statement ("Run it regardless of how Step 4 went... if
something has to give under time or token pressure, drop this step, never Steps 1-4") are all
still present unchanged in current SKILL.md. The new Status-update subsection added since (case
021) sits inside Step 5 and doesn't touch this ordering. No regression.
