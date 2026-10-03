---
id: 015
skill: bootstrap-eagd-pattern
target: references/upgrade.md, Gate D (detecting a hand-edited span)
category: fuzz
status: bug-found-fixed
last_verified: 2026-10-03
---

## Scenario
Someone edited a sentence inside the managed span. A reader that compares the installed span with the LATEST template cannot tell its own update from the local edit and overwrites both.

## Input
Installed span at v=1 with one hand edit; the skill holds v=2 and `directive-history/v1.md`; the owner answers "apply the update; if asked about local edits, cancel".

## Expected behavior
The span is compared with the release it came from (`v1`), the edit is found, the owner is asked what to do with it, and "cancel" leaves the file untouched.

## Result
First run (haiku): compared with the latest template, replaced the span, silently dropped the local edit and committed. Fixed by naming the comparison explicitly (same `v`: with the template; older `v`: with `directive-history/v<N>.md`) and requiring an explicit "discard" to continue. Second run: stopped at the gate and wrote nothing.
