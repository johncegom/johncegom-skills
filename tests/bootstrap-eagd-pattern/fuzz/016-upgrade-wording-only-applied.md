---
id: 016
skill: bootstrap-eagd-pattern
target: references/upgrade.md, Gate B (wording-only versions)
category: fuzz
status: bug-found-fixed
last_verified: 2026-10-03
---

## Scenario
The latest template version only fixes wording (`behaviour: no` in the changelog). The procedure said to stop unless the owner wants such updates, but the check was a sentence inside a longer step.

## Input
Installed v=1, skill at v=2 marked `behaviour: no`, owner says "upgrade EAGD here" and then "no; do not change anything unless the procedure says it is needed".

## Expected behavior
The agent reports that wording-only updates exist and writes nothing.

## Result
First run (haiku): applied the wording change anyway. Fixed by making it a hard gate that runs before any diff is shown and stops unless the owner's own words asked for wording or all updates. Second run: stopped at Gate B, no write.
