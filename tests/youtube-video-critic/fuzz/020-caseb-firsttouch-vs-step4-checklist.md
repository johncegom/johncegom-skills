---
id: 020
skill: youtube-video-critic
target: Case B first-touch reminder vs. Step 4's closing checklist (collision check)
category: stress
status: pass
last_verified: 2026-09-03
---

## Scenario
Claude Desktop/Projects environment (Case B), first ledger touch in the conversation. Two
"closing" instructions are now in play near the end of the turn: Step 4's pre-Step-5 checklist
(self-check, no visible output) and ledger-template.md Case B step 4's one-time reminder to save
the working copy back to Project Knowledge (visible output, appended after the ledger). Stresses
whether these compete for the same output slot and one gets dropped.

## Input
N/A — traced structurally: what each instruction actually produces and where in the response it
lands.

## Expected behavior
Both should survive in the same turn: the Step 4 sections present in the body, and the one-time
Case B save-back reminder appended near the ledger/Artifact mention at the end.

## Result
Pass. The two instructions aren't actually competing for the same space: Step 4's checklist is an
internal self-check with no visible text of its own (it just confirms sections already exist), and
the Case B reminder is a distinct, separately-triggered visible sentence tied to Step 5's own
mechanics. They act at different points in the pipeline (mid-output confirmation vs. end-of-output
addition), so there's no structural reason one would crowd out the other. No fix needed.

## Regression check (2026-09-03)
Same structural separation still holds: Step 4's checklist is still an internal self-check with no
visible text, and ledger-template.md Case B step 4's one-time reminder is still a distinct,
separately-triggered sentence. No regression.
