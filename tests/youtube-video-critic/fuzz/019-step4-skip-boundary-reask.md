---
id: 019
skill: youtube-video-critic
target: Step 4 skip-condition boundary ("narrower follow-up" vs a full re-request)
category: stress
status: bug-found-open
last_verified: 2026-08-23
---

## Scenario
Mid-conversation, after a full evaluation already ran, the user says "redo that one, shorter" or
"give me the full breakdown again for that video." Stresses the line "skip [Step 4] only when the
user's request is a narrower follow-up question about something already discussed" against a
request that is about something already discussed but is *not* a narrow question — it's asking for
the full evaluation again.

## Input
N/A — traced as a boundary-condition question against the exact wording of the skip clause.

## Expected behavior
A request for the full evaluation again (even reformatted or shortened) should still include Step
4 — only genuinely scoped questions ("did it mention X", "what was the sponsor segment about")
should skip it.

## Result
Bug found, open (doc gap, not yet fixed): the current clause is binary on the wrong axis — it
distinguishes by *topic* ("something already discussed") rather than by *request shape* (a narrow
question vs. a request for the full evaluation). A literal reading could let a model treat "redo
that evaluation, shorter" as skip-eligible purely because it's about an already-discussed video,
which is the wrong outcome.

Suggested fix (not applied — flagging for confirmation before editing): reword the skip condition
to key off request shape, e.g. "Skip them only for a narrow, scoped question about something
already discussed (e.g. 'did it mention X') — a request to redo, shorten, or re-deliver the full
evaluation still counts as a full evaluation and keeps both sections." Left open pending
confirmation since this changes user-facing behavior, not just internal ordering.
