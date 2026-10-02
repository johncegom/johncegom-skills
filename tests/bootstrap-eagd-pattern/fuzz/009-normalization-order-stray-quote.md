---
id: 009
skill: bootstrap-eagd-pattern
target: Step 4 reply rule, how an id is normalized before comparison
category: fuzz
status: bug-found-fixed
last_verified: 2026-10-03
---

## Scenario
The first draft said to "strip quotes and backticks and a trailing period" without an order or a scope. Stripping only the ends of the string leaves a stray quote when a quote sits before the final period, and the stray quote then makes an equal id compare as different.

## Input
`model=claude-opus-5-5`, `reported=claude-opus-5-5`, an `ok` row, own model `gpt-5`. The reply's first line is `model: 'claude-opus-5-5'.` (single quotes, then a period).

## Expected behavior
After normalization the reply equals `reported=`, so the call proceeds and nothing is asked.

## Result
Found by an author-written oracle and an independent opus oracle disagreeing on 93 of 5000 scenarios, almost all decorated replies like this one: the author's oracle kept a leftover quote and asked "Use" on an id that was already verified. Fixed by spelling the steps out: lowercase, trim whitespace, remove EVERY quote and backtick character, drop one trailing period, then a trailing `-latest`, applied to the reply and to every id compared, including the row's `model=`.
