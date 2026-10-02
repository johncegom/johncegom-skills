---
id: 007
skill: bootstrap-eagd-pattern
target: Step 4 reply rule, "equal to `reported=` proceeds" versus "unrelated to `model=` is stale"
category: fuzz
status: bug-found-fixed
last_verified: 2026-10-03
---

## Scenario
Some aliases never appear inside the id they resolve to (`default`, `auto`). For those rows `reported=` is unrelated to `model=` by design. The first draft checked "neither contains nor is contained in `model=`" before "equal to `reported=`", so every reply from such a row went stale, even a reply identical to the verified `reported=`.

## Input
`model=default`, `reported=claude-sonnet-5`, own model `claude-opus-5-5`, an `ok` row. The reply's first line is `model: claude-sonnet-5`.

## Expected behavior
The reply equals `reported=`, so the call proceeds with no change to the row and no question. Staleness for an unrelated id applies only to a reply that is NOT the verified `reported=` (and not the session's own model).

## Result
Found by the invariant "a reply equal to `reported=` that is not the session's own model must change nothing", which an author-written oracle broke 287 times in 5000 scenarios. Fixed by checking "equal to `reported=`" before the unrelated-model case. A consequence kept on purpose: for such an alias, a reply that has actually moved (a new id not equal to `reported=`) is judged unrelated and goes stale, because nothing in the strings can show it is the same family; that sends the owner to a manual re-probe, as before.
