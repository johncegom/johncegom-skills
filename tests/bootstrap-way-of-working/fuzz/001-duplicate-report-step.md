---
id: 001
skill: bootstrap-way-of-working
target: Step 3 vs Step 5 — "Report what you installed — and what you
  deliberately skipped" appears twice, as verbatim-duplicate paragraphs, with
  Step 4 (Revisit and decommission) sandwiched between them
category: fuzz
status: bug-found-fixed
last_verified: 2026-09-28
---

## Scenario

A session runs this skill top to bottom for the first time on a new project:
Step 1 (calibrate), Step 2 (install artifacts for the chosen tier), Step 3
(report what was installed/skipped). Step 3's own closing sentence points
forward to "the re-calibration triggers in Step 1 and the decommissioning path
in Step 4," which only makes sense if Step 3 is read as the general closing
step for the whole skill, not specifically the first-install report.

Then Step 4 describes a *separate, later* occasion — signs that an installed
artifact should be retired — and its own closing instructions already say
"name it to the user as a re-calibration moment... and if they agree" walk
through archive/update-anchor-doc/leave-cross-references-alone. Step 5 repeats
Step 3 word-for-word (same title, same body, same closing sentence about
Step 1/Step 4).

The adversarial part: an agent executing the skill has no signal for why the
same instruction appears twice, or which one it already satisfied. Two
plausible failure modes: (a) it delivers the "what I installed and skipped"
report twice in one session — once as Step 3, then again as Step 5, right
after Step 4's decommission talk that didn't actually happen in this run,
producing a confusing duplicate summary out of nowhere; or (b) on a later
decommission-triggered run, it treats Step 4's own closing instructions as
sufficient and skips Step 5 entirely, since Step 5 reads as identical to a
step it thinks it already completed at bootstrap time.

## Input

A first-time run: user says "/bootstrap-way-of-working" on a small two-person
side project. The session works through Step 1 (calibrates to Tier 2), Step 2
(installs the anchor doc, gate, bug log, decision log), reaches Step 3, then
continues reading the file sequentially into Step 4 and Step 5.

## Expected behavior

Step 3 should be the closing report specific to the initial install (tier
chosen, artifacts created/skipped, why). Step 4 should read as a distinct
later-occasion trigger, not something that happens later in the same
walkthrough. Step 5 should not exist as a duplicate of Step 3 — either it's
removed, or it's rewritten to be the closing report specific to *after* a
re-calibration/decommission pass (what was retired, what tier the project is
on now), which is a genuinely different report than Step 3's.

## Result

Confirmed as a real, verbatim duplication — not a hypothetical misreading.
Fixed in SKILL.md: kept Step 3 as the initial-install report, unchanged.
Rewrote Step 5 to be specific to the post-decommission/re-calibration case —
reporting what changed (tier, retired/added artifacts) rather than repeating
Step 3's full text — and pointed it back at Step 3's reasoning instead of
duplicating it. Status: bug-found-fixed.
