---
name: codebase-onboarding
description: >
  Fast onboarding into an unfamiliar codebase: a new job, an old project
  handed back, an open-source dive, or studying a repo's stack and design
  to reuse in a separate app. Reverse-extracts architecture and
  business-logic specs with file evidence, has a fresh-context pass verify
  those claims, then saves notes plus a first-PR checklist or reuse dossier
  outside the repo. Use when the user needs a project's core fast, just
  joined a codebase, picked one back up, or wants a durable orientation on
  an existing repo to build a different app from its patterns, not one
  answer. Do NOT use for a quick one-file/function/flow question (answer
  it directly), writing onboarding docs for other people, designing new
  architecture, mentoring the build of the user's own new project
  (learn-technology-by-building — this skill studies the existing repo,
  that one builds), being stuck on one function (goal-to-code-unblock), or
  debugging/reviewing a specific change.
---

# Codebase Onboarding

Get the user oriented in a codebase they did not write, fast, without touching the repo. The agent does the reading and extraction; the output is a small set of notes the user can trust because an independent pass checked them against the source, plus either a checklist for landing a first PR or a dossier of what to reuse elsewhere, depending on why the user is here.

Everything is in this file except the optional diagrams-and-concepts pass, in `references/diagrams-and-concepts.md`, loaded only if the user says yes in step 1. Work read-only on the target repo: never create, edit, or commit files inside it.

## 1. Frame the onboarding

Establish, from context first and by asking only what is missing:

- **Situation:** new job, returning to an old project, open-source dive, or reference study (learning this repo's stack and design to build a different, separate app). It changes the emphasis: a new job needs team conventions and where to ask; a returning user needs what changed and what rotted; an open-source dive needs contribution rules; a reference study needs the technology choices and their rationale, not this repo's contribution process. Infer reference study from the Goal or the user's own phrasing ("build something like this", "reuse its architecture") — don't ask a separate question for it.
- **Goal:** what the user must be able to do soon. For the first three situations: fix a bug area, ship a feature, review PRs. For a reference study: what the user's own app is, and how it differs from this repo (domain, scale, constraints) — this decides what's worth adopting versus what's specific to this repo and shouldn't be copied uncritically.
- **Scope:** in a large repo or monorepo, ask which area first instead of skimming everything. Onboard one area well, then extend.
- **Notes folder:** propose `~/onboarding-notes/<repo-name>/` (or the user's preferred location) and get a yes. Refuse any path inside the target repo, and check the chosen path is not under the repo root. If the folder already exists, this is a returning run: read the existing notes and update them rather than regenerating.
- **Diagrams and portable concepts:** ask once, in the same message as the notes-folder question, for every situation: "Also want an architecture diagram plus a portable `general-concepts.md` — design ideas written without this repo's code or names, so they carry to your next repo? Adds a few minutes." Default is no; treat an explicit signal already in the request (e.g. "with diagrams") as the answer instead of asking again. If yes, read `references/diagrams-and-concepts.md` before step 2. On a returning run, reuse the recorded answer from `index.md` rather than asking again.

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

For a reference study, shift emphasis rather than the reading order: weight dependency manifests and the reasoning behind each technology choice over CONTRIBUTING and git-history hot files, and keep the business-logic spec short unless the user's own app shares this repo's domain.

If diagrams-and-concepts was requested in step 1, follow `references/diagrams-and-concepts.md`'s diagram guidance now, alongside the architecture spec.

Keep each spec short enough to read in one sitting. Also list **open questions** the code could not answer, worded so the user can ask a teammate.

## 3. Verification pass

Do not save the specs before an independent check.

Spawn a fresh sub-agent with no inherited context, using whatever sub-agent tool this session has. Give it only the two specs, `general-concepts.md` if diagrams-and-concepts was requested, and read access to the repo, and withhold your reasoning. Ask it to mark every claim **verified**, **unsupported**, or **wrong**, citing the `path:line` it actually checked, and to list important behavior in the code that the specs omit.

Then fix the specs: correct wrong claims, drop or downgrade unsupported ones to **(inferred)**, and add material omissions. If the verifier finds more than a few wrong claims, redo the affected section and verify it again instead of patching.

Why-claims (problem solved, tradeoff, what would justify a change) get checked the same way as any other claim: unsupported ones are downgraded to **(inferred)** or dropped, never left standing as asserted fact just because they read as insight.

If no sub-agent tool exists, do a self-audit instead: re-open the source for each claim without looking at your earlier reasoning. It is weaker, and the notes must say so.

Record in the notes which check ran (independent sub-agent or self-audit) and the tally of verified, corrected, and dropped claims.

If diagrams-and-concepts was requested, the same pass also covers every diagram edge and every `Concept:` tag — see `references/diagrams-and-concepts.md`.

## 4. First-PR checklist, or reuse dossier

For the first three situations, build a **first-PR checklist** from evidence in this repo, not generic advice: the commands actually found for setup, build, test, and lint, the branch and commit conventions from CONTRIBUTING or history, what CI checks, who reviews (CODEOWNERS), and a suggested first change of low risk (a documented issue, a small test gap, a doc fix) with the files it would touch. Prefer a first change that moves toward the Goal from step 1 over an unrelated easy one, when both exist. Mark any step you could not confirm.

For a **reference study**, build a **reuse dossier** instead — there is no PR to make here. In this order:

1. **Target app:** the user's app in one line (from the Goal), and how it differs from this repo.
2. **Stack table:** technology → its role here → why this repo chose it (`path:line` or **(inferred)**) → verdict for the user's app: adopt, adapt, or skip, with the reason.
3. **Design patterns:** for each, where it lives (`path:line`), the problem it solves, the constraint of this repo it depends on, and the same adopt/adapt/skip verdict. If diagrams-and-concepts was requested, point each pattern at its `general-concepts.md` entry (`Concept: <name>`) instead of restating it here.
4. **Don't copy:** complexity that is scale-driven, legacy, or specific to this repo's own organization or constraints.
5. **License:** what this repo's `LICENSE` file says, in one line, so the user knows what copying code (not just ideas) would require.
6. **First slice:** the smallest pattern worth reimplementing first.

The verdicts in 2-4 are recommendations, not verified claims — step 3's verification pass covers the factual claims underneath them (what the code does, what the repo's own docs say about why), not the adopt/adapt/skip judgment itself.

## 5. Save and hand over

For the first three situations, write to the notes folder, not the repo: `architecture.md`, `business-logic.md`, `first-pr-checklist.md`, and an `index.md` with the date, repo commit hash, situation, verification result, and open questions.

For a reference study, write `architecture.md`, `business-logic.md`, `reuse-notes.md`, and the same `index.md`.

If diagrams-and-concepts was requested, add `general-concepts.md` to whichever list above applies, and record the yes/no answer itself in `index.md` so a returning run doesn't have to ask again.

On a returning run, update the files and note what changed since the recorded commit; re-run the diagrams-and-concepts pass only if it was requested last time.

Finish with a short summary in chat, in this order, not as a document dump:

1. **The next action.** First three situations: the first checklist item, sized to attempt right now, tied to the Goal. Reference study: rebuild the dossier's first slice in the user's own project from their own understanding, not by pasting — this serves both learning and the license at once.
2. **One prediction:** ask where the user thinks the Goal-relevant behavior lives, how the primary flow works, or (reference study) what would break in their version if they dropped one of this repo's constraints — before pointing them at the notes to check. This is one question, not a comprehension-check ceremony — it's the difference between reading a fact and testing your own model of it, and it costs the user under a minute.
3. **Where the notes are, and the open questions.**

If the user says up front they just want the notes for now, skip the prediction and stop after step 3 — fast passive reference is a legitimate use of this skill too, not a fallback. Ask at most one prediction; do not turn this into a quiz round.

For a reference study, if the user then wants to actually build the new app and `learn-technology-by-building` is available, offer a handoff there with `reuse-notes.md` as its input — this skill studies the existing repo, that skill mentors the new build.

## Guardrails

- Never write inside the target repo, and never save a spec that has not gone through step 3.
- Do not present inference as fact; mark it.
- Do not run the project's code or install dependencies without asking, since that can execute untrusted code.
- Do not turn a quick question into this workflow.
- For a reference study: the dossier is for reimplementing ideas, not pasting code. If the user does copy code, its license governs — permissive licenses (MIT, Apache) generally require attribution, copyleft licenses (GPL family) impose terms on the result, and no `LICENSE` file at all means no permission was granted. State this once in the dossier, don't lecture. If the repo looks like an employer's private or proprietary codebase rather than the user's own or a public one, note once that carrying its code or non-public design details into a separate app can breach an NDA or employment terms — a fact to flag, not a reason to refuse.
