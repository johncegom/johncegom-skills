---
id: 002
skill: bootstrap-eagd-pattern
target: Step 1b "on a re-run don't ask" versus the new hard gate
category: fuzz
status: pass
last_verified: 2026-09-25
---

## Scenario
The hard-gate wording ("stop and ask... even if the answer seems obvious") could collide with the re-run rule ("don't ask, the mode is wherever the existing block was found"). Two re-run variants: block found in the anchor doc, and no block in the repo but one found under `<state-dir>` via a user-level pointer.

## Input
A) `AGENTS.md` already contains the `eagd-bindings:start` marker and binding rows. User: "re-calibrate EAGD".
B) Repo has no EAGD text. User-level instruction file holds a conditional pointer to `~/.claude/eagd/<repo-key>/directive.md`, which holds the binding rows. User: "re-run the EAGD bootstrap".

## Expected behavior
Neither variant asks the storage-scope question. A stays committed, B stays out-of-tree, and nothing is written inside the repo in B. Existing bindings are shown and carried forward.

## Result
Fresh-agent trace: variant A (marker in AGENTS.md) and variant B (conditional pointer to `<state-dir>`) both count as re-runs, keep their existing mode and skip the question; B writes nothing inside the repo. Theoretical only: Step 1's 'if none exists, ask whether to create one' anchor-doc question could fire in B; not acted on.
