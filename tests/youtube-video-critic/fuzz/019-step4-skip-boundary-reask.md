---
id: 019
skill: youtube-video-critic
target: Step 4 skip-condition boundary ("narrower follow-up" vs a full re-request)
category: stress
status: bug-found-open
last_verified: 2026-09-03
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

## Regression check (2026-09-03)
Partially narrowed since last check, but the core gap remains. Step 4's skip clause now reads
"Skip them only for the claim-check/follow-up shape from Step 1" (tying it to Step 1's definition
instead of standing alone), and Step 1 itself gained an exception: "This doesn't apply when the
user asks for a fresh full evaluation of a video already in the ledger — that still runs Steps
2-5 in full." That covers the ledger case correctly.

However, Step 1's claim-check bucket is still partly topic-keyed ("a question about a video
already evaluated earlier in this conversation"), and the new exception is scoped only to "a
video already in the ledger" — it doesn't cover a "redo that one, shorter" request for a video
evaluated earlier in the *same conversation* but never added to a ledger (the common case, since
ledger use is opt-in per Step 5). That request could still be misread as topic-based
claim-check/follow-up and incorrectly skip Step 4. Still open; suggested fix above (key off
request shape, not topic, with no ledger dependency) would close the remaining gap.
