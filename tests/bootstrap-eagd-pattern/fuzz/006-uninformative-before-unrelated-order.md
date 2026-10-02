---
id: 006
skill: bootstrap-eagd-pattern
target: Step 4 "What to do with the result", the first-match order of the `model:` reply cases
category: fuzz
status: bug-found-fixed
last_verified: 2026-10-03
---

## Scenario
The first draft of the reply rule listed "an id that neither contains nor is contained in `model=`" (stale) before "uninformative" (a bare family or display name). A bare family such as `claude` never contains and is never contained in `opus`, so under literal first-match order it hit the stale case and the uninformative case was unreachable for it. The two rules could not both be followed.

## Input
`model=opus`, `reported=claude-opus-5-5`, own model `claude-sonnet-5-5`, an `ok` row. The Advise reply's first line is `model: claude`.

## Expected behavior
The reply is uninformative (it names a family, not a model). On an `ok` row that sets `status=stale`, the same outcome as an unrelated model, but it must be reached through the uninformative case so the `flagged` exception applies: a flagged row takes no action.

## Result
Found by diffing an author-written oracle against a fresh opus oracle written from the prose alone: the two disagreed on 12 of 5000 generated scenarios, all of them bare-family or echo replies, one reading the stale case first and the other the uninformative case first. Fixed by reordering: own id, then equal to `reported=`, then uninformative, then unrelated, then alias moved. After the fix the author and opus oracles agree on 5000 of 5000 scenarios.
