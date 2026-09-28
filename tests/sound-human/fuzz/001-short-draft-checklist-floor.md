---
id: 001
skill: sound-human
target: Quality Checklist section — count/percentage-based items ("at least 30%
  of paragraphs", "at least one sentence starts with And or But", mirror-structure
  check) versus the Output Format section's explicit handling of short single-
  paragraph drafts and the LinkedIn rule to lead with a one-line hook
category: fuzz
status: bug-found-fixed
last_verified: 2026-09-28
---

## Scenario

A single-paragraph or single-sentence draft (a short email, a one-line LinkedIn
hook, a two-sentence Slack message) is exactly the kind of text this skill is
supposed to handle — the Output Format section calls out "single paragraphs" and
"anything under ~300 words" as a named case, and the LinkedIn rules ask for
"the most interesting or provocative line... Not a setup, not context," which
can be a single sentence.

But several Quality Checklist items are structurally impossible to satisfy on
text that short: "at least 30% of paragraphs don't end with a neat conclusion"
needs multiple paragraphs to compute a percentage against; "at least one
sentence starts with And or But" needs a sentence that isn't the only one;
"no mirror structures (consecutive sentences with identical shapes)" needs a
second sentence to compare against the first. The checklist frames every item
as something to "verify... every single item," with no stated exception for
when an item doesn't apply. The natural failure mode is the agent inventing an
extra sentence, splitting one tight paragraph into two, or bolting on an
unneeded "And, ..." clause purely to tick the box — which is exactly the
"different kind of artificiality" the "What to Protect" section says is worse
than sounding like AI in the first place.

## Input

User (purpose 2, editing their own draft): "make this sound more human — going
with the flow at the new job, week two, still figuring out the codebase but
enjoying it so far. thanks for checking in!"

This is a single short paragraph, well under 300 words, with no separate
"long document" framing and no LinkedIn framing — just a short message with a
handful of sentences.

## Expected behavior

The agent should run Passes 1-3 as normal (kill AI vocabulary, break AI
structures, add texture), then run the checklist and treat items that don't
structurally apply to a short draft as satisfied by omission — not as a
mandate to pad, split, or force sentence starts that wouldn't otherwise be
there. The final length and shape of the reply should be driven by what the
content needs, not by what makes the checklist fully green.

## Result

Before this fix, SKILL.md gave the agent no explicit permission to skip an
inapplicable checklist item, while framing the checklist as "verify every
single item" — a real contradiction with the Output Format section's own
short-draft case and the LinkedIn one-liner-hook rule. Added a short-drafts
note directly under the checklist in SKILL.md clarifying that percentage/count
items are satisfied by omission on text too short for them to structurally
apply, and that padding, splitting, or forcing structure onto a short draft
just to clear a checklist item is explicitly the kind of over-correction
"What to Protect" already warns against. Status: bug-found-fixed.
