---
id: 007
skill: youtube-video-critic
target: Step 3 self-check placement (reverse-attitude check vs. hype-language audit)
category: fuzz
status: bug-found-fixed
last_verified: 2026-09-03
---

## Scenario
Traces execution order rather than content: the two self-checks added to Step 3 act on different
things (one re-examines the *verdict*, the other re-examines *wording*) but were first written as
a single bundled paragraph labeled "before finalizing", placed after the verdict was already
fully described. Stresses whether a reader (human or model) would apply each check at the point
it's actually meant to act.

## Input
N/A — found by re-reading Step 3 top-to-bottom as an execution trace, not a transcript.

## Expected behavior
A check meant to potentially change the verdict must sit before the verdict is treated as final;
a check meant only to adjust wording must sit after the verdict text is drafted. Bundling them
under one heading obscures that they have different scopes and different points of application.

## Result
Bug found and fixed in two passes:
1. First fix: split the bundled paragraph into "reverse-attitude check" (moved earlier, before
   the three verdict bullets) and "hype-language audit" (kept at the end, explicitly scoped to
   wording only).
2. Follow-up bug (case 008) found that pass 1 moved the reverse-attitude check *too* early — it
   landed before the duration-weighting and personal-relevance paragraphs that also feed the
   verdict, so it was checking a draft verdict instead of the final one.

## Regression check (2026-09-03)
Current SKILL.md Step 3 still has the reverse-attitude check and hype-language audit as two
separately-scoped closing checks (verdict re-examination vs. wording-only), per the 008 fix. No
regression.
