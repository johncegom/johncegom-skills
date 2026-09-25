---
id: 005
skill: bootstrap-eagd-pattern
target: out-of-tree mode when the harness has no user-level instruction file
category: fuzz
status: bug-found-fixed
last_verified: 2026-09-25
---

## Scenario
Out-of-tree mode's loader is a conditional pointer in a user-level instruction file. The skill says to confirm the harness reads one at all. What happens if it does not?

## Input
User answers "keep it out of the repo". Harness is one that only reads repo-level instruction files (no user-level file loaded each session).

## Expected behavior
The skill gives a defined outcome: it tells the user out-of-tree cannot be loaded on this harness and offers the alternatives, and it does not silently write anything inside the repo or leave an unloadable directive.

## Result
First run found a real gap: 'confirm the harness reads a user-level file at all' had no failure branch, so an agent would carry on into Steps 2-4 and leave an unloadable directive. Fixed in SKILL.md by adding to the Out-of-tree bullet: if the harness loads no user-level instruction file, stop before Step 2, tell the user, write nothing, and offer committed mode or no install. A fresh re-run passed. It also noted that an extra option I first drafted (directive kept in the harness's own per-user config) left `<state-dir>` undefined, so that option was dropped rather than patched.
