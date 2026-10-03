---
id: 018
skill: bootstrap-eagd-pattern
target: references/upgrade.md, out-of-tree installs (directive in `<state-dir>/directive.md`)
category: fuzz
status: pass
last_verified: 2026-10-03
---

## Scenario
Out-of-tree install: the directive and bindings live in `~/.claude/eagd/<repo-key>/directive.md`, the repo holds nothing, and a user-level `CLAUDE.md` holds a conditional pointer. The upgrade must treat `directive.md` as the anchor doc and leave the repo, the pointer file and the state dir's other files alone.

## Input
Three fresh copies (v=1 span; the skill holds v=2 and `directive-history/v1.md`), each in a clean git repo with a separate fake home. Weak model (haiku). Owner answers: (1) "yes, apply the update exactly as shown", (2) "no, do not change anything", (3) a hand-edited span, "apply the update; if asked about local edits, cancel".

## Expected behavior
(1) The span in `directive.md` equals the v=2 template, the text outside it and the binding rows are unchanged, no file appears in the repo or the state dir (backup only in the OS temp directory), the user-level file is untouched. (2) and (3) leave every file byte-identical.

## Result
Scored by script on the files, not by the agents' reports: 3/3 pass, no change needed to the skill. Not covered: no shell, symlinked state dir, and a state dir inside a git repo.
