---
id: 024
skill: youtube-video-critic
target: Whether chapters are used only as breakpoint hints, never as evidence for the six Step 2 angles
category: analysis-quality
status: bug-found-fixed
last_verified: 2026-09-15
---

## Scenario
A video has creator-authored chapters (e.g. parsed from the description) that label a section
"Deep technical explanation," but the actual transcript content in that time range is mostly
sponsor-read and repeated hype, not a real explanation — the chapter title and the transcript
content disagree.

Traced by re-reading the new "Chapters" paragraph in Step 1 against Step 2's six analysis angles
and Step 3's long-video breakpoint guidance, to check whether the model would let the chapter
title stand in for actual transcript-based judgment on substance/novelty/actionability, or
correctly treat the mismatch as a signal to trust the transcript over the label.

## Input
N/A — doc-gap trace, no live API call.

## Expected behavior
- The Step 2 "Substance vs. filler ratio" and "Novelty" angles are judged from what the transcript
  actually contains in that range, not from the chapter's title — the mismatch itself (a chapter
  claiming "deep technical explanation" over what is actually filler) should be visible in the
  substance/filler assessment, not smoothed over.
- Chapters are used only where Step 3 already calls for timestamped breakpoints (the "Worth
  watching in full" long-video pacing note) — as candidate pause points to verify against the
  transcript, not as a free pass to skip verifying that section's actual content.
- No Step 2 row cites the chapter title itself as evidence ("the chapters confirm this is
  technical") without separately grounding that claim in the transcript.

## Result
Pass. The new Step 1 paragraph is explicit: "treat them purely as breakpoint hints for the
long-video pacing note in Step 3, never as evidence for the six analysis angles in Step 2. Verify
what a chapter claims against what the transcript actually contains before relying on it." This
directly rules out using a mismatched or misleading chapter title as a substitute for reading the
actual transcript content.

An independent verification pass caught that Step 3's breakpoint paragraph originally never
mentioned chapters at all — Step 1 promised chapters were "hints for... Step 3" but Step 3 derived
breakpoints purely from the transcript, leaving a one-way pointer with no receiving mechanism.
Fixed by adding a clause to Step 3: "If chapters are available (per Step 1), use their timestamps
as a candidate list to check first, but confirm each one against the transcript before suggesting
it — a chapter boundary that doesn't actually match a clean topic handoff in the transcript isn't
a real breakpoint." Chapters' only legitimate use is now explicitly scoped and wired into Step 3's
existing "never guess at a breakpoint you can't actually locate in the transcript" rule. No
remaining conflict found with Step 2's angle definitions or Step 3's breakpoint guidance.
