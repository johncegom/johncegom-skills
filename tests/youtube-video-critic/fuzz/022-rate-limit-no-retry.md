---
id: 022
skill: youtube-video-critic
target: Whether the new "Handling rate limits (HTTP 429)" section gives an unambiguous stop/report/no-retry path
category: error-handling
status: pass
last_verified: 2026-09-09
---

## Scenario
A youtube-mcp tool call (e.g. `get_transcript`) returns an HTTP 429 / rate-limit error mid-Step-1.
Traced by re-reading the new "Handling rate limits (HTTP 429)" section against Step 0's existing
missing-tool rule and Step 1's multi-video branch, to check for conflicts or gaps: does the model
have one clear next action, or could it plausibly retry, pivot to another tool, or guess from the
title instead?

## Input
N/A — doc-gap trace, no live API call.

Three sub-cases traced:
1. Single-video request, `get_transcript` 429s.
2. Claim-check follow-up (Step 1's claim-verification sub-flow), `search_transcript` 429s.
3. Multi-link batch (3 videos), video 2's `get_metadata` 429s after video 1 already succeeded.

## Expected behavior
- Case 1: stop gathering for that video, tell the user it was rate-limited, surface a retry-after
  duration if the error included one (else say "unknown, try again in a few minutes"), do not
  retry automatically or fall back to a title-only guess, and do not re-attempt until the user
  sends a new message asking to try again.
- Case 2: same stop/report rule applies even though this is the claim-verification sub-flow, not
  the main fetch — the section's opening line ("applies to any youtube-mcp tool call anywhere in
  this skill's flow") explicitly covers this path, so there's no ambiguity about whether Step 1's
  claim-check branch is exempt.
- Case 3: video 1 still gets a full Steps 2-5 evaluation; video 2 is reported as
  skipped/pending due to rate-limiting rather than the whole batch being abandoned or all three
  being silently reduced to metadata-only guesses.

## Result
Pass. The new section (inserted between Step 1 and Step 2) gives one unambiguous action per case:

- Rule 1 ("Do not retry automatically") explicitly blocks both same-call retries and
  tool-pivot workarounds (the `get_transcript` → `search_transcript` fallback named as the
  motivating example), so Case 1 has no retry path left open.
- Rule 2 ("Stop and report, don't guess") explicitly cross-references Step 0's "don't fall back to
  guessing about the video from the title alone" rule, so the two sections reinforce rather than
  contradict each other — there's no route to a title-only guess in either the fresh-fetch or
  claim-check case.
- The section's framing line up front ("applies to any youtube-mcp tool call anywhere in this
  skill's flow, not just the initial fetch above... the claim-verification sub-flow's
  `search_transcript`/`get_transcript_range` follow-ups") directly covers Case 2 — no separate
  rule needed for the claim-check branch.
- Rule 3 ("Multi-video batches degrade per-video, not all-or-nothing") directly covers Case 3 and
  is consistent with Step 1.3's existing "repeat this for each video... do not average them
  together" instruction — a per-video 429 is just one more reason two videos in the same batch can
  end up in different states, which Step 1.3 already establishes as normal.
- Rule 4 ("Only resume on a fresh user request") closes the remaining gap of a timer-based
  auto-retry within the same turn, which none of the other three rules explicitly ruled out on
  their own.

No conflict found with Step 0, Step 1 (including its multi-video and claim-verification
sub-flows), or Step 4/5's ledger handling (a rate-limited video never reaches Step 4/5 for that
video, so there's nothing for those steps to contradict).
