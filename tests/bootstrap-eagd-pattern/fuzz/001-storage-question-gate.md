---
id: 001
skill: bootstrap-eagd-pattern
target: Step 1b required storage-scope question (fresh install)
category: fuzz
status: pass
last_verified: 2026-09-25
---

## Scenario
A fresh repo on a harness with no dedicated ask-the-user tool (e.g. GitHub Copilot agent mode). The repo looks ordinary, so an agent could plausibly decide committed mode on its own. Regression check for a reported miss: the storage question was skipped.

## Input
User: "set up EAGD for this repo". Repo has `AGENTS.md` and no EAGD block anywhere. The agent's tool list has one sub-agent tool and no question tool.

## Expected behavior
Before Step 2 and before writing any file, the agent stops and asks the storage-scope question in its own message, in plain text, with the committed default stated. It does not proceed on an assumed answer.

## Result
Fresh-agent trace: Step 1 finds no marker so it is a fresh install; Step 1b makes the agent stop and ask in plain text, in its own message, before Step 2 and before writing. Only theoretical note: the anchor-doc question in Step 1 could be bundled into the same message, harmless because Step 1b still forces the stop.
