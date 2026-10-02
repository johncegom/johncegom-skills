---
id: 008
skill: bootstrap-eagd-pattern
target: Step 4 reply rule, the definition of "uninformative"
category: fuzz
status: bug-found-fixed
last_verified: 2026-10-03
---

## Scenario
The rule listed "a bare family or a display name" as uninformative but never defined a bare family and never mentioned an empty or missing `model:` line. Readers filled the gap differently, and a model that reads `unknown` or an empty string as an id would ask the human to "Use ''".

## Input
`model=claude-haiku-4-5-20251001`, an `ok` row, own model `gpt-5`. Replies tried: an empty first line, `unknown`, `claude`, `Claude`, and `claude-opus`.

## Expected behavior
Every one of those is uninformative: no id with a version digit was given. None may reach the question that asks the human to adopt a new id.

## Result
Found when a haiku-written oracle asked the human to "Use ''" in 221 of 5000 scenarios (mostly an empty reply) while an opus-written oracle called the same scenarios uninformative; the same bucket held `unknown`. Fixed by adding "empty or missing" and defining a bare family as an id with no digit in it. One later haiku writer still misread "no digits" as "no digits in the reply AND digits in `model=`" (652 of 5000 differing), which was closed by the explicit parenthetical "an id with no digit in it".
