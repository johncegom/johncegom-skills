---
name: codebase-onboarding
description: >
  Fast onboarding into an unfamiliar codebase (a new job, an old project
  handed back, or an open-source dive). The agent reverse-extracts
  architecture and business-logic specs from the code with file evidence,
  has a separate fresh-context verification pass check those claims against
  the source, then saves the notes plus a first-PR checklist to a local
  folder outside the repo. Use when the user says they need to understand a
  project's core fast, just joined a new codebase, or picked back up an old
  or abandoned project and wants a durable orientation, not one answer. Do
  NOT use for a quick question about one file, function, or flow (just
  answer it), for writing onboarding docs or a README for other people, for
  designing new architecture, for learning a technology by building a new
  project (learn-technology-by-building), for being stuck writing one
  function (goal-to-code-unblock), or for debugging or reviewing a specific
  change.
---

# Codebase Onboarding

Get the user oriented in a codebase they did not write, fast, without touching the repo. The agent does the reading and extraction; the output is a small set of notes the user can trust because an independent pass checked them against the source, plus a checklist for landing a first PR.

Everything this skill needs is in this file. Work read-only on the target repo: never create, edit, or commit files inside it.

## 1. Frame the onboarding

Establish, from context first and by asking only what is missing:

- **Situation:** new job, returning to an old project, or open-source dive. It changes the emphasis: a new job needs team conventions and where to ask; a returning user needs what changed and what rotted; an open-source dive needs contribution rules.
- **Goal:** what the user must be able to do soon (fix a bug area, ship a feature, review PRs).
- **Scope:** in a large repo or monorepo, ask which area first instead of skimming everything. Onboard one area well, then extend.
- **Notes folder:** propose `~/onboarding-notes/<repo-name>/` (or the user's preferred location) and get a yes. Refuse any path inside the target repo, and check the chosen path is not under the repo root. If the folder already exists, this is a returning run: read the existing notes and update them rather than regenerating.

## 2. Reverse-extract the specs

Read the repo in this order, stopping when the picture is stable rather than reading everything:

1. Orientation files: README, CONTRIBUTING, docs, architecture or decision records.
2. Build, test, and CI configuration: what actually runs, and how.
3. Entry points, then the main request or data path from input to storage or output.
4. Module and dependency boundaries, data models, and external integrations.
5. Tests, which state intended behavior more honestly than comments do.
6. Recent history (`git log`, hot files) for what is actively changing.

Write two specs. Every non-trivial claim carries evidence as `path:line`, and anything inferred rather than read is marked **(inferred)**.

- **Architecture spec:** components and responsibilities, boundaries and dependency direction, the main runtime flow, external systems, how it is built, tested, and deployed.
- **Business-logic spec:** the domain concepts, the core rules and invariants the code enforces, the important state transitions, and where each rule lives. Describe what the code does, and say plainly when intent is unclear instead of guessing a purpose.

Keep each spec short enough to read in one sitting. Also list **open questions** the code could not answer, worded so the user can ask a teammate.

## 3. Verification pass

Do not save the specs before an independent check.

Spawn a fresh sub-agent with no inherited context, using whatever sub-agent tool this session has. Give it only the two specs and read access to the repo, and withhold your reasoning. Ask it to mark every claim **verified**, **unsupported**, or **wrong**, citing the `path:line` it actually checked, and to list important behavior in the code that the specs omit.

Then fix the specs: correct wrong claims, drop or downgrade unsupported ones to **(inferred)**, and add material omissions. If the verifier finds more than a few wrong claims, redo the affected section and verify it again instead of patching.

If no sub-agent tool exists, do a self-audit instead: re-open the source for each claim without looking at your earlier reasoning. It is weaker, and the notes must say so.

Record in the notes which check ran (independent sub-agent or self-audit) and the tally of verified, corrected, and dropped claims.

## 4. First-PR checklist

Build it from evidence in this repo, not generic advice: the commands actually found for setup, build, test, and lint, the branch and commit conventions from CONTRIBUTING or history, what CI checks, who reviews (CODEOWNERS), and a suggested first change of low risk (a documented issue, a small test gap, a doc fix) with the files it would touch. Mark any step you could not confirm.

## 5. Save and hand over

Write to the notes folder, not the repo: `architecture.md`, `business-logic.md`, `first-pr-checklist.md`, and an `index.md` with the date, repo commit hash, situation, verification result, and open questions. On a returning run, update the files and note what changed since the recorded commit.

Finish with a short summary in chat: the three things to know first, where the notes are, and the open questions.

Then offer, once and without pressing, an optional comprehension check: the user predicts where one behavior lives or explains one flow back, and you compare their answer with the notes. Skip it if declined.

## Guardrails

- Never write inside the target repo, and never save a spec that has not gone through step 3.
- Do not present inference as fact; mark it.
- Do not run the project's code or install dependencies without asking, since that can execute untrusted code.
- Do not turn a quick question into this workflow.
