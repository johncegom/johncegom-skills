---
id: 002
skill: youtube-video-critic
target: Step 4.1 item count floor
category: fuzz
status: bug-found-fixed
last_verified: 2026-09-03
---

## Scenario
A short (~3 min) video that is almost entirely filler/ads, with exactly one genuine substantive
claim. Stresses the original "(3-6 items)" instruction against the also-stated "skip filler
entirely" rule.

## Input
Synthetic transcript: one real claim, everything else is sponsor read / subscribe reminders.

## Expected behavior
The core-takeaways list should contain exactly the substantive content that exists — one item —
not be padded to a minimum of three with restated or trivial points.

## Result
Bug found: the original wording "(3-6 items)" implied a hard floor of 3, which directly
contradicted "skip filler entirely" whenever a video had fewer than 3 real points. Fixed in
SKILL.md Step 4.1: changed to "up to 6 items... aim for 3-6, but go lower when the video
genuinely doesn't have that many substantive points — never pad the list... a 1-item list is a
legitimate signal about the video, not a formatting failure."

## Regression check (2026-09-03)
Fix wording still present verbatim in current SKILL.md Step 4.1. No regression.
