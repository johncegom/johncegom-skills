---
id: 012
skill: bootstrap-eagd-pattern
target: Step 4 reply rule, what to do when an alias moves to a new id
category: fuzz
status: reverted
last_verified: 2026-10-03
---

## Scenario
A first fix for the exact-match stale rule (which blocked a working binding when `opus` moved to a newer version) treated a reply that merely contains the row's family string as "alias drift": overwrite `reported=`, keep the status, and log a Binding-changes row. It changed no user-facing step, so it looked safe.

## Input
`model=opus`, `reported=claude-opus-5-5`, an `ok` row. The reply's first line is `model: claude-opus-4`. A second case: `model=gpt-5`, reply `gpt-5-mini`.

## Expected behavior
A move to an older or smaller model must not be accepted silently. The id is not the verified one, so a human decides.

## Result
Both replies contain the family string, so the auto-accept rule rewrote the row and carried on, hiding a downgrade behind a single log row. The owner rejected it before it was committed. Replaced by a plain two-choice question: use the new id, or keep the binding and use the answer anyway, with the choice logged. Not retried because no check on names can tell a better model from a worse one (`mini` versus none, `opus-4` versus `opus-5-5`), and any ordering table would rot at each release. Do not re-propose automatic acceptance without a source of trusted runtime metadata for the model.
