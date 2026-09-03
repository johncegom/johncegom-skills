---
id: 018
skill: youtube-video-critic
target: Whether Steps 2-5 explicitly repeat per video in a multi-link request
category: stress
status: bug-found-open
last_verified: 2026-09-03
---

## Scenario
User pastes 3 YouTube links in one message. Step 1.3 says to repeat *gathering material* per
video and not average them into one vague verdict. Stresses whether that instruction actually
covers Steps 2 through 5 too, or only the raw-material-gathering step it's literally attached to.

## Input
N/A — traced by re-reading Steps 1-5 for an explicit "repeat per video" statement covering the
full pipeline, not just Step 1.

## Expected behavior
Each video should get its own full Step 2-5 pass (own table, own verdict, own takeaways, own
ledger row) — three independent evaluations, not one shared analysis or one shared takeaways list
covering all three loosely.

## Result
Bug found, open (doc gap, not yet fixed): Step 1.3 only says "repeat this for each video" in the
context of *gathering* metadata/transcript, and "do not average them together into one vague
verdict" implies separate verdicts but is still scoped to Step 1's material-gathering paragraph.
Steps 2, 3, 4, and 5 never restate that the per-video repetition continues through the rest of the
pipeline. A model could plausibly read this as "gather all three transcripts, then produce one
combined table/takeaways/ledger discussion touching on all three" without technically violating
any single sentence in Steps 2-5, since none of them say "per video" explicitly.

Suggested fix (not applied — flagging for confirmation before editing): add one clause to Step
1.3, e.g. "— everything from here through Step 5 (analysis, verdict, takeaways, ledger row) repeats
per video too; there is no combined step." Left open since this is a new scope question, not a
re-check of the ledger/takeaways salience fix this session was focused on.

## Regression check (2026-09-03)
Still open, unchanged. Current SKILL.md Step 1.3 still reads only "If the user gives more than one
link, repeat this for each video — do not average them together into one vague verdict," with no
cross-reference from Steps 2-5. The suggested fix above was never applied. Not a new regression
(nothing made this worse), but still a live doc gap.
