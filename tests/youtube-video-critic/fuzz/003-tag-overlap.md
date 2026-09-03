---
id: 003
skill: youtube-video-critic
target: Step 4.1 type tag precedence
category: fuzz
status: pass
last_verified: 2026-09-03
---

## Scenario
A claim that is simultaneously actionable and disputed: "Use the Pomodoro technique (25-minute
work bursts) — though some studies dispute its effectiveness for creative work." Stresses
whether the four type tags (`[Fact/data]`, `[Framework/mental model]`, `[Actionable tip]`,
`[Contested claim]`) are mutually exclusive enough to pick one.

## Input
Single synthetic takeaway claim as described above.

## Expected behavior
The skill should resolve the overlap deterministically rather than picking inconsistently
between runs.

## Result
Handled by the precedence rule already written into SKILL.md line 97: "when they [tags] overlap,
tag it `[Contested claim]` regardless of what else it also looks like, since trustworthiness is
the property the reader most needs flagged." Known accepted trade-off (documented, not a bug):
this loses the explicit "still actionable" signal — flagged during the session as worth
reconsidering if it becomes a recurring complaint, but not changed.

## Regression check (2026-09-03)
Precedence rule still present, same wording, in current SKILL.md. No regression.
