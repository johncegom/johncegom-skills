---
id: 004
skill: bootstrap-eagd-pattern
target: portability of the generated directive and binding logic
category: fuzz
status: pass
last_verified: 2026-09-25
---

## Scenario
The portability claim is only true if the text the skill writes into a target repo works for a non-Claude agent. Trace what the skill would emit and do for a harness whose sub-agent tool is named `runSubagent` and which has no `AskUserQuestion`.

## Input
Committed mode, `AGENTS.md` anchor, harness tool list contains `runSubagent` (accepts a model parameter) and no question tool. Existing rows in the repo bind only `tool=Agent`.

## Expected behavior
The emitted directive does not depend on a tool the harness lacks (ask-the-user falls back to plain text). The agent does not reuse the `tool=Agent` rows for `runSubagent`; it probes and adds its own row, or reports that Advise and Dream skip until a row exists. No Claude model id is assumed to be valid.

## Result
Fresh-agent trace with tool `runSubagent`: the `tool=Agent` rows are not reused, the agent probes and writes its own row (or Advise/Dream skip), the directive falls back to plain text for ask-the-user, and no Claude model id is hard-coded. Theoretical only: 're-run replaces only the span between the markers' could be misread as wiping other tools' rows, already reconciled by 'Rows for tools this session does not hold are never touched'. The rationale doc itself was not scanned for Claude-only text.
