---
id: 009
skill: youtube-video-critic
target: Step 3 (proposed session-split note for "Worth watching in full")
category: fuzz
status: pass
last_verified: 2026-09-03
---

## Scenario
A long interview with clearly distinct topic sections, to check that the split-note correctly
fires and produces a concrete, transcript-grounded suggestion rather than a generic "watch it in
parts" line.

## Input
Synthetic 45-minute interview transcript with three self-contained sections and clean handoffs
between them: 0:00–15:00 career history, 15:00–30:00 current project, 30:00–45:00 general advice.
Verdict from Step 2/3 analysis: "Worth watching in full."

## Expected behavior
The rule should identify the two clean handoff points (15:00, 30:00) and suggest a 2-3 session
split naming what each range covers, using real timestamps — not a vague "split it into two
sittings" with no location.

## Result
Pass. The rule as worded ties the suggestion to actual timed-transcript breakpoints, so applying
it to this input produces "0:00–15:00 covers X, 15:00–30:00 covers Y, 30:00–45:00 covers Z — natural
pauses at 15:00 and 30:00," matching expected behavior.

## Regression check (2026-09-03)
Breakpoint-suggestion rule still present unchanged in current SKILL.md Step 3. No regression.
