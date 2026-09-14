---
id: 023
skill: youtube-video-critic
target: Whether get_video_brief's per-section partial-failure shape is distinguished from a hard 429 halt
category: error-handling
status: pass
last_verified: 2026-09-15
---

## Scenario
`get_video_brief` is called for a full evaluation. It returns HTTP 200 overall, but the metadata
section is replaced by a failure line (e.g. rate-limited or transiently unavailable) while the
chapters, transcript, and transcript-stats sections all succeeded normally.

Traced by re-reading the new "`get_video_brief` needs an extra check" paragraph in the "Handling
rate limits (HTTP 429)" section against the existing 429 rules 1-4, to check whether the model
would incorrectly treat this as a full rate-limit halt (discarding a transcript it already has)
or correctly recognize it as a narrower, proceed-with-a-note case.

## Input
N/A — doc-gap trace, no live API call.

Sub-case: metadata section fails, transcript/chapters/stats sections succeed.

## Expected behavior
- The model does not invoke the "Do not retry automatically" / "Stop and report" 429 rules for the
  whole call, since those rules are written for a genuine top-level error, not a per-section one.
- The model proceeds to Steps 2-5 using the transcript it successfully has, explicitly noting to
  the user that metadata (title/channel/publish date/view count/duration) is incomplete or
  unavailable for this run, rather than silently omitting it or halting the evaluation.
- If, instead, the *transcript* section had failed, the model would treat that exactly like the
  existing full-halt case (no partial evaluation attempted, since none of the six Step 2 angles
  can be judged without a transcript per Step 1's existing full-evaluation rule).

## Result
Pass. The new paragraph explicitly states: "check each section... If only metadata or chapters
failed (transcript succeeded), proceed with a note that that piece of data is incomplete or
unavailable, rather than halting the whole evaluation. If the transcript section failed, treat it
exactly like the full-halt case below." This gives an unambiguous, section-scoped decision rule
that sits before the existing 429 rules 1-4, so a metadata-only failure inside a `get_video_brief`
call cannot be misread as grounds to discard an already-successful transcript. No conflict found
with Step 1's full-evaluation transcript requirement or Step 2's six-angle dependency on a
transcript.

An independent verification pass flagged that asserting `get_video_brief`'s internal
failure-mode mechanics this specifically sat in tension with Step 0's own "don't restate tool
mechanics, they go stale" principle. Fixed by hedging the paragraph ("As of this writing... confirm
this is still accurate via the tool's own description if in doubt") and separating the mechanism
(which may drift) from the behavioral constraint it justifies (which doesn't depend on the exact
mechanism holding). The section-scoped check behavior itself is unchanged.
