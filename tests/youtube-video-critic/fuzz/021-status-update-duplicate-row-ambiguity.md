---
id: 021
skill: youtube-video-critic
target: Step 5 Status-update trigger vs. re-evaluation producing duplicate ledger rows
category: fuzz
status: bug-found-fixed
last_verified: 2026-09-03
---

## Scenario
Traces the newly added "Updating Status on an existing row" subsection in SKILL.md Step 5 against
an existing, already-documented behavior: Step 1 explicitly allows a video already in the ledger to
be re-evaluated in full ("the user asks for a fresh full evaluation of a video already in the
ledger — that still runs Steps 2-5 in full"), and Step 5's per-evaluation maintenance appends one
row per evaluation rather than overwriting. So the same video can legitimately have two or more
rows in the ledger (e.g. evaluated once, then re-evaluated months later after the video was
updated or the user's context changed).

Later, the user says "I watched that video" or "I applied the idea from that video into
SiteGuard," naming a video that has multiple rows.

## Input
N/A — found by cross-referencing the new Status-update instructions against Step 1's existing
re-evaluation allowance and Step 5's append-not-overwrite behavior, the same static-tracing method
used in cases 015/019.

## Expected behavior
The Status update should land on a specific, well-defined row (most plausibly the most recent
evaluation of that video), and the instructions should say so explicitly — not leave it to
per-run improvisation, since different models/runs could pick the first row, the last row, or
try to update all of them inconsistently.

## Result
Bug found, open (doc gap, not yet fixed). The new Step 5 subsection says to "find that row (match
by link or title)" as if exactly one row will exist per video, and `references/ledger-template.md`'s
row-format notes for `Status` describe it purely in terms of "an existing row" without addressing
the duplicate case. Neither file states a tiebreak rule for a video with more than one row, so:

- A model could update only the first (oldest) row, leaving the row a user would actually expect
  to check (the most recent evaluation) still blank.
- A model could update every matching row, which silently multiplies a single real-world action
  (one watch, one apply) across rows that represent distinct evaluation events — muddying the
  "was this specific evaluation acted on" signal the column exists to provide.
- A model could ask the user to disambiguate, which is reasonable but is nowhere licensed or ruled
  out by the current text, so behavior is unspecified rather than intentional.

Fixed in both files:
1. SKILL.md Step 5's Status-update subsection gained a fourth point stating that a video can
   legitimately have more than one row (citing Step 1's re-evaluation allowance and Step 5's
   append-not-overwrite behavior as the reason), and that when a link/title matches more than one
   row, only the most recent (latest-dated) row gets updated by default — never all matching rows,
   and never a guessed pick when genuinely ambiguous.
2. `references/ledger-template.md`'s `Status` bullet list gained the matching tiebreak note, so the
   rule lives alongside the rest of the column's semantics rather than only in SKILL.md.
