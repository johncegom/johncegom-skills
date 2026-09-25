---
id: 003
skill: bootstrap-eagd-pattern
target: frontmatter description trigger and no-trigger boundaries
category: fuzz
status: pass
last_verified: 2026-09-25
---

## Scenario
The description was rewritten to be harness-neutral. Judge only from the description text whether the skill should fire, for prompts from different harnesses, including near-misses that mention the words in the do-not-trigger list.

## Input
Prompts, each from a harness that may have no slash commands:
1. "set up EAGD for this repo"
2. "give this repo a mechanism to spawn an advisor agent"
3. "/bootstrap-eagd-pattern"
4. "can you explain what AGENTS.md is for?"
5. "help me edit .github/copilot-instructions.md to add our lint rules"
6. "how do multi-agent architectures usually split work between agents?"
7. "we should have some kind of review process for our skills"
8. "re-run the EAGD bootstrap, models changed"
9. "add a CLAUDE.md to this project"

## Expected behavior
Fires on 1, 2, 3, 8. Does not fire on 4, 5, 6, 7, 9.

## Result
Fresh-agent judged from the description alone: FIRE on prompts 1, 2, 3, 8; NO-FIRE on 4, 5, 6, 7, 9. Matches Expected on all nine, no wording change needed.
