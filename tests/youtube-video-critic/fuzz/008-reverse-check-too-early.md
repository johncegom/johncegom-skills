---
id: 008
skill: youtube-video-critic
target: Step 3 self-check placement (reverse-attitude check vs. duration/relevance adjustments)
category: fuzz
status: bug-found-fixed
last_verified: 2026-09-03
---

## Scenario
Follow-up to case 007. After moving the reverse-attitude check before the three verdict bullets,
re-traced the full Step 3 execution order and found the duration-weighting paragraph and the
personal-relevance "pull the verdict up a notch" paragraph — both of which are stated (line 60)
to be factors the verdict "genuinely depends on" — still sat *after* the reverse-attitude check.

## Input
N/A — found by re-reading Step 3 top-to-bottom as an execution trace.

## Expected behavior
The reverse-attitude check needs to run against the fully-formed verdict (substance/filler +
duration weighting + personal relevance all applied), not a preliminary one, or it can pass
cleanly on a draft verdict that then gets silently changed by a later paragraph it never saw.

## Result
Fixed in SKILL.md Step 3: moved both self-checks (reverse-attitude check and hype-language audit)
to a single "closing checks" block placed after the duration-weighting and personal-relevance
paragraphs, so the reverse-attitude check gates the actually-final verdict, and the hype-language
audit still runs last, scoped to wording only. This is the current, verified-consistent state.

## Regression check (2026-09-03)
Confirmed: SKILL.md Step 3 still runs "With the verdict now fully formed — substance/filler,
duration weighting, and personal relevance all folded in — run two closing checks" only after
those paragraphs. No regression.
