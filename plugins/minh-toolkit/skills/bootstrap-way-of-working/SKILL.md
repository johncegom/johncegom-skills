---
name: bootstrap-way-of-working
description: Opt-in only — do not trigger automatically from general conversation about process, CLAUDE.md, or project setup. Invoke only when the user explicitly runs /bootstrap-way-of-working or directly asks by name. Sets up a CLAUDE.md/AGENTS.md and companion docs (bug log, decision log, retrospective log, task ledger) encoding a disciplined way of working — task approval via Definition-of-Done + Test Plan, bug/decision/retro logging with distinct triggers for each, and a proportionality check against overengineering — calibrated to the target project's actual size, team, and risk profile rather than transplanted wholesale from the source project.
---

# Bootstrap Way of Working

## Why this exists, and the trap to avoid

This skill installs a specific discipline: an anti-drift task-approval gate,
plus three separate logs (bugs, decisions, retrospectives) that exist to
stop the same category of problem — silent, unrecorded judgment calls
piling up until nobody (including a future session of yourself) can
reconstruct why the codebase looks the way it does.

The trap: that discipline was born in a multi-session project porting code
against an upstream ground truth, where drift is expensive and a human
reviews everything. Installing that full ceremony unconditionally into
every project — including someone's weekend script — is itself the exact
mistake the discipline warns against: solving a problem the project doesn't
have. A skill that always installs the heavyweight version isn't being
disciplined, it's being lazy about calibration.

So: **never install anything before Step 1.** Calibration isn't a
courtesy question, it's the actual point of this skill. A one-person
throwaway script and a multi-contributor product that will live for years
need genuinely different amounts of process, and guessing wrong in either
direction has a real cost — too little on a risky project lets drift
accumulate silently; too much on a small project is friction nobody will
maintain, and unmaintained process is worse than no process because it
looks authoritative while being stale.

## Step 1: Calibrate

Ask the user directly, or infer from repo evidence (commit history, existing
docs, `package.json`/`go.mod` age, contributor count via `git shortlog -sn`)
where inference is reliable enough not to need asking. Four questions
matter; don't skip past them to "just install everything":

1. **Contributors** — is this solo, or will multiple people (or multiple
   independent AI sessions acting like separate contributors) work on it?
   Multi-party work is where an approval gate and a ledger earn their cost,
   because nobody has full context by default.
2. **Lifespan / stakes** — a throwaway script, a personal tool used once,
   or something that will be maintained, extended, and revisited for
   months or years? Ceremony amortizes over a long lifespan; it's pure
   overhead on something you'll delete next week.
3. **Ground-truth oracle** — is there an authoritative external reference
   this project is porting or conforming to (an existing implementation in
   another language, a formal spec, a fixed API contract)? If not, the
   strict "derive ground truth before writing the test" TDD pattern
   (source pattern #8) doesn't apply — most projects have no such oracle
   and should just do ordinary test-first development, not invent a fake
   ground-truth step.
4. **Blast radius if something goes wrong silently** — does a silent bug,
   an unreviewed scope-creep decision, or forgotten context actually hurt
   someone (users, other contributors, a future maintainer), or is the
   entire cost of a mistake "notice it and fix it next time you look"?

Map the answers to a tier. Don't treat these as rigid buckets — if a
project is solo but very high-stakes (e.g. a personal finance tool), weight
question 4 over question 1. State your tier choice and reasoning to the
user before writing anything, and let them override it.

| Tier | Typical profile | Install |
|---|---|---|
| **0 — Minimal** | Solo, throwaway/short-lived, low stakes | Nothing, or at most a single running `NOTES.md` for your own memory. Say so explicitly rather than silently skipping — the user should know you considered it and it wasn't worth the overhead. |
| **1 — Light** | Solo or small team, will live for a while, moderate stakes | Decision log only (pattern below). Skip the approval gate and bug log — for one or two people with full context, a gate that stops you and asks yourself for approval is theater. |
| **2 — Standard** | Multi-contributor and/or multi-session, real stakes | Full anchor doc + task-approval gate + ledger/detail-doc split + bug log + decision log. Retro log optional — offer it, install only if the user wants continuous-improvement tracking across tasks. |
| **3 — Standard + ground truth** | Tier 2, plus a real external oracle to port/conform against | Everything in Tier 2, plus the ground-truth-derivation TDD pattern for the specific functions that port against that oracle (not the whole codebase). |

If you're genuinely unsure between two tiers, default to the lighter one and
tell the user you can add more later — process is much easier to add when
a real need shows up than to strip out once it's calcified into habit.

## Step 2: Install the artifacts for the chosen tier

Every artifact below is a **pattern**, not a fixed filename — pick names
that fit the project's existing doc conventions (`CONTRIBUTING.md`,
`CLAUDE.md`, `AGENTS.md`, `docs/DEVELOPMENT.md`, whatever already exists or
whatever the user prefers). Read `references/templates.md` for ready-to-adapt
file content for each artifact; adapt wording to the project's actual domain
and stack rather than pasting generically.

### The anchor doc (Tier 1+)

One top-level doc (often the project's existing `CLAUDE.md`/`AGENTS.md`/
`CONTRIBUTING.md` — extend it rather than creating a competing file) that
states which of the artifacts below exist, where they live, and the
project's build/test/lint commands. This is the thing a new session or
contributor reads first; everything else is reached from here.

### Task-approval gate + ledger/detail-doc split (Tier 2+)

The core anti-drift mechanism: before starting non-trivial work, write a
**Definition of Done** (concrete, testable exit criteria) and a **Test
Plan** (what's automated, what's manually checked, exact commands) into a
*committed* doc — not an ephemeral scratch/plan file only the current
session can see. The point is that a future session or a human reviewer
can see what was actually approved, without reconstructing intent from a
diff.

Pair this with the **index/detail split**: one small index doc (current
status, a table linking to per-task detail) that stays cheap to read in
full, and separate per-task detail docs holding the full DoD/Test
Plan/notes. This exists specifically so an agent working on task #47
doesn't have to load the history of tasks #1–46 into context — read the
index, then open only the detail doc(s) actually needed. For long tasks,
break the DoD into numbered checkable sub-items and check them off as you
go, so an interrupted or compacted session can resume from the doc instead
of re-deriving state.

Alongside the gate, install the **no-silent-scope-expansion** rule: if you
notice something unrelated while working (a stale doc, an adjacent bug),
don't fold the fix into the current diff — flag it separately (as a new
ledger entry, bug, or a quick note to the user) and let it be picked up
deliberately.

### Bug log (Tier 2+)

Trigger: **something in the product is already wrong** — a real defect,
including ones inherited from a dependency or an upstream source that got
faithfully carried over.

Every entry needs: symptom, root cause (or an explicit "root cause
unknown" — don't fake certainty), proposed fix options if there's an
obvious one, and a **Reachability** statement — is there a real call path
that hits this today, or only a test built specifically to exercise it?
Reachability matters because it's the gate on how much ceremony the fix
itself deserves (see the proportionality note below) — a bug with no real
caller is a much smaller deal than one live users hit.

Critically: logging a bug is not fixing it. Wait for an explicit decision
before applying a fix, the same way the task gate waits for approval
before implementation — a bug log that gets silently auto-fixed provides
none of its audit value.

### Decision log (Tier 1+)

Trigger: **a deliberate tradeoff where a reasonable, informed person might
have chosen differently.** Not every choice — routine, obviously-correct,
or trivially-reversible choices don't need an entry. The bar is "would a
future reviewer benefit from knowing this was considered and why we didn't
go the other way."

Entry shape: context, the decision, alternatives considered, consequences.
This is the lightest-weight artifact and the one worth installing even at
Tier 1, because "why did we do it this way" is the single most common
question a future contributor (or future you) asks about old code, and
it's cheap to answer if written down once and expensive to reconstruct
later.

### Retrospective log (Tier 2+, optional)

Trigger: a lesson about **process, tooling, or collaboration** — not a
product bug (→ bug log) and not a product/design tradeoff (→ decision
log) — that would change how a *different, future* task gets approached.
This is the hardest trigger to apply correctly; the failure mode is
turning it into a per-task diary. Apply a generalization test before
logging anything: if the lesson is really just "here's what happened on
this specific task," it belongs in that task's own detail doc, not here.

Structure each entry as three short answers: what went well (worth
deliberately repeating), what friction should improve (a specific tool
choice, missing check, or ambiguous instruction — not "make the product
better"), and one or two concrete takeaways for next time. Skim this log
before starting new tasks — an entry that's written once and never
reread isn't continuous improvement, it's a journal.

### Ground-truth TDD pattern (Tier 3 only)

Only for the specific functions that port or conform against a named
external oracle (an upstream implementation, a spec, a fixed contract).
For those functions: derive expected behavior by actually running/reading
the oracle (not by reasoning about what it "should" do), write the test
against that derived ground truth, confirm it fails, then implement to
green. If a test is later found wrong, fix it by re-deriving from the
oracle — never by adjusting it to match whatever the code currently
outputs. Do not apply this pattern to ordinary application logic that has
no oracle — that's just normal test-first development and doesn't need
the extra ceremony of ground-truth derivation.

### Proportionality note (install at every tier, as a stated principle)

Regardless of tier, state this principle explicitly in the anchor doc:
overengineering is code or process that solves a problem the project
doesn't have. Before adding an abstraction, a defensive guard, or another
piece of process ceremony, name the real, currently-reachable reason for
it — "just in case" is not a reason. This principle is also why this
skill calibrates instead of always installing the full set: skipping
Tiers you don't need *is* the principle in action, not a shortcut around
it.

## Step 3: Report what you installed — and what you deliberately skipped

Close by telling the user, in a short summary: the tier chosen and why,
which artifacts were created, and which patterns were *not* installed and
why not (e.g. "skipped the task-approval gate — solo project, you have full
context already; skipped the ground-truth TDD pattern — no external oracle
this project ports against"). This matters for the same reason the
patterns themselves matter: an unstated omission looks like an oversight,
a stated one looks like a decision. If the project's needs change later
(a second contributor joins, stakes go up), the user can come back and ask
for the next tier explicitly rather than the skill guessing wrong now.

See `references/templates.md` for adaptable file content for every
artifact above.
