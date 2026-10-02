---
id: 011
skill: bootstrap-eagd-pattern
target: Step 4 reply rule, what the call logs after the owner picks "Use <new>", and the stored form of `reported=`
category: fuzz
status: bug-found-fixed
last_verified: 2026-10-03
---

## Scenario
The rule said "Keep the binding and use the answer" logs `answered flag=drift-assumed` but gave no status for the "Use `<new>`" path, and said "set `reported=<new>`" without saying whether that is the id as typed or the normalized id. A reader could log the accepted id as an assumption or store a decorated id.

## Input
`model=haiku`, `reported=claude-haiku-4-5-20251001`, an `ok` row, an ask tool available. The reply's first line is `model: Claude-Haiku-4-5-latest`. The owner picks "Use `<new>`".

## Expected behavior
The row's `reported=` becomes the normalized id `claude-haiku-4-5`, a Binding-changes row records the old and new ids, and the Advise call is logged as plain `answered`: the human approved the id, so it carries no `drift-` flag.

## Result
Found when both haiku-written oracles logged `drift-assumed` for the "Use" path (29 of 5000 differing) and one stored the reply as typed (26 of 5000), while the author and opus oracles did neither. Fixed by adding "(log the call as plain `answered`)" and "set `reported=<new>` (normalized)" to the rule.
