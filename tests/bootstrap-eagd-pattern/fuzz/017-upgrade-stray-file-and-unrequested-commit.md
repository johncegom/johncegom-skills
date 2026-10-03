---
id: 017
skill: bootstrap-eagd-pattern
target: references/upgrade.md, hard rules (no files in the repo, never commit)
category: fuzz
status: bug-found-fixed
last_verified: 2026-10-03
---

## Scenario
The first procedure told the agent to extract the span for comparison and to ask before writing, but never said where temp files go or that it must not commit. A weak reader left a file in the repo and committed upgrades nobody had asked it to commit.

## Input
Legacy install copied from a real repo (`AGENTs.md`), owner approves insertion and declines all deletions.

## Expected behavior
`git status --porcelain` afterwards lists only the anchor doc as modified; no new files, no commit.

## Result
First run (haiku): left `extracted_span.txt` in the repo. Other first-run fixtures also produced commits. Fixed by hard rules at the top of the procedure (temp files only in the OS temp directory and deleted; never stage or commit) and a fifth verify check on `git status --porcelain`. Second run: only `AGENTs.md` modified. Note: results are single haiku runs per fixture, on a fixture set of 12 (two are copies of real installs); not yet run on larger models, on a harness with no diff tool, in out-of-tree mode, or with symlinked or imported anchors.
