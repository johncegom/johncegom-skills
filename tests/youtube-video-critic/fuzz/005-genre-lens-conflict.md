---
id: 005
skill: youtube-video-critic
target: Step 2 angle 1 (proposed genre-aware substance/filler lens)
category: fuzz
status: reverted
last_verified: 2026-09-03
---

## Scenario
A proposed feature (from an inversion-thinking brainstorm): classify videos as
"informational" vs. "entertainment" before scoring, and judge entertainment videos by
entertainment-craft quality instead of information density — meant to stop punishing genuinely
good entertainment content for not being informational.

## Input
N/A — this was caught by re-reading the whole file for consistency after implementing the
change, not by a synthetic transcript.

## Expected behavior
Any new rule added to Step 2 must not contradict existing, foundational statements elsewhere in
the same file.

## Result
Bug found — critical: the change directly contradicted two pre-existing lines: the persona intro
("not to review videos for entertainment value", line 23) and the Value score definition
("not production quality, not entertainment", line 82/originally 80). Rather than rewrite the
persona and value-score definition to accommodate it (a scope expansion the user did not ask
for), the change was reverted in full. Step 2 angle 1 is back to its original informational-only
wording. Recorded here as a rejected direction: if "score entertainment videos on their own
terms" is proposed again, it needs to also touch the persona line and the Value score definition
in the same edit, not just Step 2.

## Regression check (2026-09-03)
Persona line ("not to review videos for entertainment value") and Value score line ("not
production quality, not entertainment") both still present unchanged; Step 2 angle 1 remains
informational-only. Reverted state holds, no regression.
