---
name: codebase-onboarding
description: >
  Fast onboarding into an unfamiliar codebase: a new job, an old project
  handed back, or an open-source dive. Reverse-extracts architecture and
  business-logic specs with file evidence, has a fresh-context pass verify
  those claims, then saves notes plus a first-PR checklist outside the
  repo. Can also add, on request, an architecture diagram and a
  repo-agnostic list of design concepts worth carrying to a future
  project. Use when the user needs a project's core fast, just joined a
  codebase, or picked one back up and wants a durable orientation, not one
  answer. Do NOT use for a quick one-file/function/flow question (answer
  it directly), writing onboarding docs for other people, designing new
  architecture, mentoring the build of a new project
  (learn-technology-by-building — this skill only writes down concepts
  from an existing repo, it doesn't teach or build with them), being stuck
  on one function (goal-to-code-unblock), or debugging/reviewing a
  specific change.
---

# Codebase Onboarding

Get the user oriented in a codebase they did not write, fast, without touching the repo. The agent does the reading and extraction; the output is a small set of notes the user can trust because an independent pass checked them against the source, plus a checklist for landing a first PR.

Everything is in this file except the optional diagrams-and-concepts pass, in `references/diagrams-and-concepts.md`, loaded only if the user says yes in step 1. Work read-only on the target repo: never create, edit, or commit files inside it.

## 1. Frame the onboarding

Establish, from context first and by asking only what is missing:

- **Situation:** new job, returning to an old project, or open-source dive. It changes the emphasis: a new job needs team conventions and where to ask; a returning user needs what changed and what rotted; an open-source dive needs contribution rules.
- **Goal:** what the user must be able to do soon (fix a bug area, ship a feature, review PRs).
- **Scope:** in a large repo or monorepo, ask which area first instead of skimming everything. Onboard one area well, then extend.
- **Notes folder:** propose `~/onboarding-notes/<repo-name>/` (or the user's preferred location) and get a yes. Refuse any path inside the target repo, and check the chosen path is not under the repo root.

  Detect a returning run by **repo identity**, not by folder name — a repo can be cloned to a new path or renamed between sessions, and two unrelated repos can share a folder name. Compute the identity once: the normalized `origin` remote URL if one exists (strip protocol/`.git`/trailing-slash differences, and treat the SSH form `git@host:org/repo` and the HTTPS form `https://host/org/repo` as the same identity), otherwise the repo's root commit hash(es) (`git rev-list --max-parents=0 HEAD`). If neither is available (no git history reachable, e.g. a shallow clone with no remote), fall back to folder-name matching alone and record in `index.md` that identity detection was weaker for this run.

  If the proposed folder exists and its recorded identity in `index.md` matches: this is a returning run, no further check needed — read the existing notes and update them rather than regenerating. If it exists but the identity does *not* match (a folder-name collision with a different repo): treat this as a fresh run under a disambiguated name, don't overwrite. If the proposed folder doesn't exist, or its identity doesn't match: check sibling folders under the notes root for one whose recorded identity matches — the repo may have been renamed or moved. If found, tell the user and use that existing folder as the returning run rather than silently starting a disconnected new one; if not found, proceed as a fresh run.
- **Diagrams and portable concepts:** ask once, in the same message as the notes-folder question: "Also want an architecture diagram plus a portable `general-concepts.md` — design ideas written without this repo's code or names, so they carry to your next repo? Adds a few minutes." Ask every run; don't self-decide from Situation. Default is no; treat an explicit signal already in the request (e.g. "with diagrams") as the answer instead of asking again. If yes, read `references/diagrams-and-concepts.md` before step 2. On a returning run, reuse the recorded answer from `index.md` rather than asking again.

Carry the Goal forward: it decides which flow gets traced in step 2, which first-PR item to suggest in step 4, and what the handover in step 5 asks the user to try. Notes with no goal behind them read as a pile of facts about the whole repo instead of an answer to what the user actually needs.

## 2. Reverse-extract the specs

Read the repo in this order, stopping when the picture is stable rather than reading everything:

1. Orientation files: README, CONTRIBUTING, docs, architecture or decision records.
2. Build, test, and CI configuration: what actually runs, and how.
3. Entry points, then the main request or data path from input to storage or output.
4. Module and dependency boundaries, data models, and external integrations.
5. Tests, which state intended behavior more honestly than comments do.
6. Recent history (`git log`, hot files) for what is actively changing.

Write two specs. Every non-trivial claim carries evidence as `path:line`, and anything inferred rather than read is marked **(inferred)**.

- **Architecture spec:** components and responsibilities, boundaries and dependency direction, external systems, how it is built, tested, and deployed. Also include a **primary flow**: one concrete path relevant to the Goal, traced in order through the actual files and functions it passes through. This is the throughline that ties the components together — a list of components with no flow through them is why notes can read as inert facts with no "now what".
- **Business-logic spec:** the domain concepts, the core rules and invariants the code enforces, the important state transitions, and where each rule lives. For rules and decisions load-bearing enough to matter for the Goal, also say why: the problem it solves, the tradeoff or alternative it reflects, and what would justify changing it — drawn from commit messages, ADRs, tests, or a contrast visible in the code, and marked **(inferred)** like any other inference, never asserted as known intent. For everything else, describe what the code does and say plainly when intent is unclear instead of guessing a purpose.

If diagrams-and-concepts was requested in step 1, follow `references/diagrams-and-concepts.md` now, alongside the architecture spec.

Keep each spec short enough to read in one sitting. Also list **open questions** the code could not answer, worded so the user can ask a teammate.

## 3. Verification pass

Do not save the specs before an independent check.

Spawn a fresh sub-agent with no inherited context, using whatever sub-agent tool this session has. Give it only the two specs, `general-concepts.md` if diagrams-and-concepts was requested, and read access to the repo, and withhold your reasoning. Ask it to mark every claim **verified**, **unsupported**, or **wrong**, citing the `path:line` it actually checked, and to list important behavior in the code that the specs omit.

Then fix the specs: correct wrong claims, drop or downgrade unsupported ones to **(inferred)**, and add material omissions. If the verifier finds more than a few wrong claims, redo the affected section and verify it again instead of patching.

Why-claims (problem solved, tradeoff, what would justify a change) get checked the same way as any other claim: unsupported ones are downgraded to **(inferred)** or dropped, never left standing as asserted fact just because they read as insight.

If no sub-agent tool exists, do a self-audit instead: re-open the source for each claim without looking at your earlier reasoning. It is weaker, and the notes must say so.

Record in the notes which check ran (independent sub-agent or self-audit) and the tally of verified, corrected, and dropped claims.

If diagrams-and-concepts was requested, the same pass also covers every diagram edge and every kept concept — see `references/diagrams-and-concepts.md`.

## 4. First-PR checklist

Build it from evidence in this repo, not generic advice: the commands actually found for setup, build, test, and lint, the branch and commit conventions from CONTRIBUTING or history, what CI checks, who reviews (CODEOWNERS), and a suggested first change of low risk (a documented issue, a small test gap, a doc fix) with the files it would touch. Prefer a first change that moves toward the Goal from step 1 over an unrelated easy one, when both exist. Mark any step you could not confirm.

## 5. Save and hand over

Write to the notes folder, not the repo: `architecture.md`, `business-logic.md`, `first-pr-checklist.md`, and an `index.md` with the date, repo commit hash, **repo identity** (the remote URL or root commit hash used for returning-run detection, and a note if detection fell back to folder-name only), situation, verification result, and open questions.

If diagrams-and-concepts was requested, add `general-concepts.md` to that list, and record the yes/no answer itself in `index.md` so a returning run doesn't have to ask again.

On a returning run, update the files and note what changed since the recorded commit; re-run the diagrams-and-concepts pass, re-checking every existing entry's gates rather than assuming they still hold, only if it was requested last time.

Finish with a short summary in chat, in this order, not as a document dump:

1. **The next action:** the first checklist item, sized to attempt right now, tied to the Goal.
2. **One prediction:** ask where the user thinks the Goal-relevant behavior lives, or how the primary flow works, before pointing them at the notes to check. This is one question, not a comprehension-check ceremony — it's the difference between reading a fact and testing your own model of it, and it costs the user under a minute.
3. **Where the notes are, and the open questions.**

If the user says up front they just want the notes for now, skip the prediction and stop after step 3 — fast passive reference is a legitimate use of this skill too, not a fallback. Ask at most one prediction; do not turn this into a quiz round.

## Guardrails

- Never write inside the target repo, and never save a spec — or `general-concepts.md`, if produced — that has not gone through step 3.
- Do not present inference as fact; mark it.
- Do not run the project's code or install dependencies without asking, since that can execute untrusted code.
- Do not turn a quick question into this workflow.
