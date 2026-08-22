---
id: 016
skill: youtube-video-critic
target: Step 5 (SKILL.md, not just ledger-template.md) residual vivid-narrative language
category: stress
status: bug-found-fixed
last_verified: 2026-08-23
---

## Scenario
Direct re-check of the previous fix (trimming the narrated incident out of `ledger-template.md`
Case B). Stress question: was the narrative actually removed from every place it lives, or just
the referenced file?

## Input
N/A — found by re-reading SKILL.md Step 5 top-to-bottom after the ledger-template.md edit.

## Expected behavior
If the root-cause theory (vivid, consequence-laden language pulling disproportionate attention
away from Step 4) is right, no copy of the narrated incident should remain anywhere that loads
unconditionally with Step 5.

## Result
Bug found: SKILL.md line 112 (Step 5's own body, loaded every time, not just on ledger touch)
still carried a near-identical narration: "Critically: never assume a file write is visible to the
human just because a file-write tool is present — that assumption caused a real bug where the
agent reported the ledger as updated while the human saw nothing change, because the write landed
in a container instead of Project Knowledge." Only the copy in `ledger-template.md` had been
trimmed; this one is arguably worse, since it fires on every Step 5 touch (SKILL.md is always
loaded) rather than only when Case B's reference file gets read.

Fixed in SKILL.md Step 5: trimmed to the operative rule only — "Critically: never assume a file
write is visible to the human just because a file-write tool is present; follow the template's
case for the current environment exactly rather than defaulting to 'write a file.'" — dropping the
narrated incident, matching the same trim already applied to ledger-template.md.
