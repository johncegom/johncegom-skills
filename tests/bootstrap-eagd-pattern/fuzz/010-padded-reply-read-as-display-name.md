---
id: 010
skill: bootstrap-eagd-pattern
target: Step 4 reply rule, which text the "display name has spaces" test reads
category: fuzz
status: bug-found-fixed
last_verified: 2026-10-03
---

## Scenario
A display name was defined as an id "with spaces". The raw text after `model:` almost always starts with a space, and the rule did not say to trim it or which string the space test applies to. Testing the raw reply makes every ordinary id look like a display name.

## Input
`model=opus`, `reported=claude-opus-5-5`, an `ok` row, own model `claude-sonnet-5-5`. The first line is `model:  claude-opus-5-6  ` (padded with spaces).

## Expected behavior
After trimming, the id is `claude-opus-5-6`: it contains `opus`, is not the session's own model, and is not `reported=`, so the alias has moved and the human is asked once. It is not a display name.

## Result
Found when a haiku-written oracle tested the original reply for spaces (its own comment: "check original reply for spaces") and called 514 of 5000 padded scenarios uninformative, while the author and opus oracles agreed with each other. Fixed in two places: "trim surrounding whitespace" was added to the normalization, and a display name is now "spaces inside the normalized id". After the fix the three oracles agree on every branch decision.
