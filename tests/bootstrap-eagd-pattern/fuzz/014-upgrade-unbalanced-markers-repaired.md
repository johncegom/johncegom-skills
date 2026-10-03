---
id: 014
skill: bootstrap-eagd-pattern
target: references/upgrade.md, Gate A (marker count before any write)
category: fuzz
status: bug-found-fixed
last_verified: 2026-10-03
---

## Scenario
An installed directive span has a start marker but no end marker. The procedure said to stop on anything but exactly one start and one end, but did not require stating the counts or forbid repairing the file.

## Input
A git repo whose `CLAUDE.md` holds `<!-- eagd-directive:start v=1 -->` and the whole span but no end marker, an older skill version available, and a scripted owner who approves whatever is shown.

## Expected behavior
The agent counts `start=1 end=0`, stops, writes nothing, and reports the missing end marker. It does not add or move a marker.

## Result
First run (haiku, prose gate): the agent noticed "end marker was missing", still called the gate passed, added a closing marker, replaced from the start marker onward, deleted local role text and made an unrequested git commit. Fixed by requiring the counts as `start=<n> end=<n>`, proceeding only on `start=1 end=1`, and forbidding any repair. Second run (haiku): stopped at Gate A, file byte-identical.
