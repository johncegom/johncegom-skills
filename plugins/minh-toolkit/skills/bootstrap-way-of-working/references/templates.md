# Templates

Adapt wording, filenames, and section headers to the target project's
existing conventions — these are starting points, not fixed schemas. Strip
anything a tier doesn't need rather than leaving placeholder sections that
will never get filled in; an empty "Retrospective Log" section nobody
writes to is worse than not having one.

---

## Anchor doc section (Tier 1+)

Insert into the project's existing `CLAUDE.md`/`AGENTS.md`/`CONTRIBUTING.md`,
or create one if none exists:

```markdown
## Way of working

This project uses [Tier N — describe in one line what that means for this
project, e.g. "a lightweight decision log; no formal task-approval process
since it's currently solo-maintained"].

- Decision log: `docs/DECISIONS.md` — deliberate tradeoffs a future
  reviewer might question. Read before assuming "why is it built this way."
<!-- Tier 2+ only, include the lines that apply: -->
- Task ledger: `docs/LEDGER.md` — current status + links to per-task detail
  under `docs/tasks/<slug>/TASK.md`. Read the ledger first; open only the
  task detail you actually need.
- Bug log: `docs/BUGS.md` — known defects pending a fix decision. Don't
  silently fix a bug found mid-task; log it and wait for a decision unless
  told otherwise.
- Retrospective log: `docs/RETRO.md` — process lessons that generalize
  beyond one task. Skim before starting new work.

### Task approval (Tier 2+)
Before implementing a non-trivial task, write a Definition of Done and
Test Plan into `docs/tasks/<slug>/TASK.md`, including a Program design note
(types, signatures, call graph, and package layout for multi-package tasks)
when the task is multi-file or an agent will generate a substantial chunk
of new code in one pass, and get it reviewed before starting. Don't expand
scope mid-task — log unrelated findings separately.

### Proportionality
Don't add abstraction, defensive code, or process ceremony beyond what a
real, currently-reachable need justifies. "Just in case" isn't a reason.
```

---

## Task ledger index (Tier 2+)

`docs/LEDGER.md` (or equivalent):

```markdown
# Task Ledger

Current status: <one or two lines — what's in flight, what's next>

| # | Task | Status | Detail |
|---|------|--------|--------|
| 1 | <short name> | done / in progress / blocked | `docs/tasks/01-<slug>/TASK.md` |

Resume checklist: <what a new session should read first, and in what order>
```

## Task detail doc (Tier 2+)

`docs/tasks/<slug>/TASK.md`:

```markdown
# Task: <name>

## Definition of Done
- [ ] <concrete, testable exit criterion>
- [ ] <...>

## Test Plan
- Unit-tested: <what, and how>
- Manually smoke-tested: <what, and the exact steps/commands>
- Commands: `<exact commands to run>`

## Program design (fill only when the conditions below apply — otherwise omit this section entirely)
- Types/interfaces to add or change: <...>
- Key method signatures: <...>
- Call graph sketch: <function A calls B calls C, in what order — or, for
  async/event-driven code where a linear call chain doesn't fit, the
  event/data flow instead: what triggers what, in what order>
- Package/file layout (only when the task spans more than one package): <...>

Fill the first three lines when:
- The task touches more than one file/function whose interaction isn't
  obvious, OR
- An agent will generate a substantial chunk of new code in one pass,
  rather than a human extending an existing, obvious pattern by hand or an
  agent making a small, mechanical edit to one (this is exactly where RL
  gives the model no maintainability signal, so a human needs to pin down
  structure before generation — it is not a blanket rule that any agent
  involvement requires this section).

Also fill the package/file layout line when the task spans more than one
package — e.g. deciding whether new logic goes in an existing package or
a new one, and where the boundary sits. Within a single package this
line is usually redundant with the types/call-graph lines above and can
stay blank.

Skip the whole section when the task is a small, localized fix or the
person is coding it by hand without agent generation.

## Sub-tasks (for long-running work — omit if the task is small)
- [x] 1.1 <done>
- [~] 1.2 <partial — note exactly what's left and why, so a resumed
      session doesn't have to re-derive state>
- [ ] 1.3 <not started>

## Notes / deviations
<anything that happened during implementation worth recording here,
specific to this task — NOT a generalizable process lesson, which belongs
in the retro log instead>
```

---

## Bug log entry (Tier 2+)

`docs/BUGS.md`:

```markdown
## BUG-<NNN>: <short symptom description>

**Symptom:** <what's observed>
**Root cause:** <known cause, or explicitly "unknown">
**Reachability:** <real call path today, e.g. "hit whenever a user passes
an empty string to X" — vs. only reachable via a test built to hit it>
**Options:** <if there's an obvious fix, list options; otherwise omit>
**Status:** pending decision / decided: <what was decided> / fixed in <ref>
```

---

## Decision log entry (Tier 1+)

`docs/DECISIONS.md`:

```markdown
## DECISION-<NNN>: <short title>

**Context:** <what problem/choice this addresses>
**Decision:** <what was chosen>
**Alternatives considered:** <what else was on the table, and why not>
**Consequences:** <what this commits the project to, tradeoffs accepted>
```

---

## Retrospective log entry (Tier 2+, optional)

`docs/RETRO.md`:

```markdown
## RETRO-<NNN>: <short title>

**What went well:** <a process/tooling/collaboration pattern worth
repeating deliberately>
**What could improve:** <a concrete friction point — a slow tool, a
missing check, an ambiguous instruction>
**Advice for next time:** <one or two actionable takeaways>
```

Before logging, apply the generalization test: would this change how a
*different future task* gets approached? If it's really just narration of
what happened on this one task, put it in that task's own detail doc
instead.

The generalization test above doesn't apply to the Program design section:
whether to fill it in is a binary condition check (does the task touch
multiple files/packages, or will an agent generate a substantial chunk of
new code in one pass), not a judgment call about whether a future reviewer
would want it explained.
