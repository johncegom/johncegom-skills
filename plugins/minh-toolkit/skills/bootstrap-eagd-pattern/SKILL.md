---
name: bootstrap-eagd-pattern
description: Opt-in only — do not trigger automatically from general conversation about skill design or multi-agent architecture. Invoke only when the user explicitly runs /bootstrap-eagd-pattern or directly asks by name (e.g. "set up the Execute/Advise/Grade/Dream pattern for this skill", "bootstrap EAGD"). Adopts the Execute/Advise/Grade/Dream role-separation pattern (references/execute-advise-grade-dream.md) into a specific skill or project — installing only the roles it actually needs, and always asking the user which model runs each installed role rather than assuming a default.
---

# Bootstrap Execute / Advise / Grade / Dream

## Why this exists, and the trap to avoid

`references/execute-advise-grade-dream.md` names a reusable pattern: split a
skill's work across up to four roles (Execute, Advise, Grade, Dream) instead
of one role doing everything, because a role that just produced an output is
bad at judging it — fresh eyes catch what the author's own reasoning hides
from itself. That file is deliberately just a reference, not a mandate: it
says outright that most skills need one or two roles, not all four, and that
adopting it into any specific skill is "a separate, deliberate pass."

This skill *is* that deliberate pass, made repeatable. The trap to avoid is
the same one `bootstrap-way-of-working` names for its own domain: a
bootstrapper that always installs the full four-role ceremony isn't being
disciplined, it's being lazy about calibration. A one-step mechanical task
doesn't need Advise; a skill with no rubric-shaped output doesn't need
Grade; a skill with nothing worth remembering across runs doesn't need
Dream. Install only what the target actually needs, and say so.

The second trap is specific to this pattern: the token-saving pitch ("route
the expensive model to Advise only, save money everywhere else") **only
pays off if the roles genuinely run as separate model calls.** If Execute,
Advise, Grade, and Dream are just labeled sections inside one continuous
agent conversation, nothing is actually being routed to a different model —
you get the quality benefit of fresh-eyes review, but zero cost benefit.
Be explicit with the user about which one they're getting (see Step 3).

## Step 1: Clarify the target and scope

Ask, don't assume:

1. **What is this pattern being applied to?**
   - A single skill (existing or being authored) — the roles live inside
     that skill's own `SKILL.md`, invoked as `Agent` tool calls at defined
     points in its instructions.
   - A repo-wide way of working — the pattern becomes a documented
     convention in the project's anchor doc (`CLAUDE.md`/`AGENTS.md`) that
     future skills or tasks are expected to follow, not runtime code
     installed today. This is closer to policy than implementation.
   - Both — a convention documented at the repo level, demonstrated
     concretely in one pilot skill first rather than retrofitted everywhere
     at once.

2. **If it's a project-wide adoption, is there a pilot skill to start
   with?** Retrofitting every skill in a repo in one pass is exactly the
   kind of unforced ceremony this pattern's own reference doc warns
   against installing wholesale. Prefer one real skill with a genuine need
   for at least one extra role, get that working and reviewed, then let the
   user decide whether to repeat it elsewhere.

## Step 2: Calibrate which roles are actually needed

Never default to installing all four. For the target skill, ask three
concrete questions — mirroring the reference doc's own worked examples
(`goal-to-code-unblock` uses only Advise; `sound-human` has Execute + a
Grade-shaped step and nothing else):

1. **Does Execute hit a mid-run judgment call it shouldn't resolve alone** —
   an ambiguous choice, something needing external verification, a
   borderline case worth a second opinion? If yes → install **Advise**.
   If Execute never pauses for a call like this, skip it.
2. **Does the finished output have a rubric-shaped quality check** — a
   checklist, a pass/fail structure, criteria a fresh reader could apply
   without needing the reasoning that produced the draft? If yes → install
   **Grade**. If quality here isn't checklist-shaped, or the skill doesn't
   need a formal gate, skip it.
3. **Is there something worth persisting across separate runs** — a
   learned profile, a ledger of past decisions, anything a future run
   should read back rather than rebuild from scratch? If yes → install
   **Dream**. Note Dream normally follows a Grade pass — a skill can have
   Grade without Dream, but Dream without any Grade means nothing is
   gating what gets written to memory.

State which roles you're installing and which you're skipping, with the
reason, before writing anything — the same transparency
`bootstrap-way-of-working` requires for its tiers.

## Step 3: Ask about models and routing — don't default

For every role being installed, ask the user directly which model should
run it. Do **not** silently apply the reference doc's suggested defaults
(Sonnet/Opus/Haiku/Opus) — those are a starting point to show the user, not
an instruction to follow. Present the table from
`execute-advise-grade-dream.md` as context, then ask.

Also resolve the mechanism question directly, since it changes what you
build:

- **Real model routing (actual token savings):** each installed
  non-Execute role runs as a genuinely separate `Agent` tool call with an
  explicit `model` override — Advise's call blocks and waits for the
  answer before Execute continues; Grade's call gets only the rubric and
  finished output, no inherited context; Dream's call gets the full run
  history, no output of its own gates anything. This is the only version
  that saves tokens, because it's the only version where a cheaper/faster
  model actually executes some of the work instead of the top-tier model
  doing everything in one long context.
- **Role separation without model routing (quality benefit only, no cost
  benefit):** all roles run in the same session/model, just as distinct,
  clearly separated phases with the fresh-eyes context boundary enforced
  by instruction (Grade genuinely doesn't get shown the reasoning, even
  though it's the same model in the same conversation). This is fine for
  skills where the point is catching a writer's blind spot, not saving
  money — but say explicitly that this is what's being built, so the user
  doesn't expect a token-cost reduction that isn't happening.

If the user wants real routing, confirm each role's model choice by name
(e.g. "Advise: Opus 5, Grade: Haiku 4.5, Dream: Opus 5") and record it in
the skill/doc you're writing — don't leave the model implicit.

## Step 4: Wire up the mechanics for what was chosen

**Skill-scoped, real routing.** In the target `SKILL.md`, write:

- **Execute** — the skill's normal instructions, run in the primary
  session. No change needed here beyond adding call-out points to the
  other roles where relevant.
- **Advise** — at each identified decision point, an explicit instruction
  to call the `Agent` tool with `model: <chosen>`, a prompt containing
  *only* the specific decision and the context needed to resolve it (not
  the whole transcript), and to wait for the reply before continuing. Name
  the trigger condition precisely — "when X is ambiguous," not "whenever
  unsure."
- **Grade** — after Execute finishes one full run, a fresh `Agent` tool
  call (no inherited context) with `model: <chosen>`, given the rubric and
  the finished output only. State explicitly which fail mode applies —
  full rerun (default, when failure isn't localizable to one span) or
  targeted fix (only when Grade can name one exact offending span whose
  fix doesn't require touching anything else) — per the reference doc's
  "Grade's two fail modes."
- **Dream** — after a Grade pass, an `Agent` tool call with
  `model: <chosen>`, given the full run history (reasoning, Advise
  exchanges, Grade verdict), instructed to write durable learnings to a
  named persistent file (ledger, profile, decision log — state the path).

**Skill-scoped, no routing.** Write the same four sections, but as
instructions to the single running session: Execute proceeds normally;
at an Advise point, explicitly reason through the decision as a distinct,
labeled step before continuing; Grade re-reads the finished output fresh
against the rubric as a separate pass without referring back to the
reasoning that produced it; Dream, if installed, writes learnings to the
same kind of persistent file. No `Agent` calls, no model field.

**Repo-wide.** Add a section to the anchor doc naming the pattern, when a
skill should adopt it (the three questions from Step 2), and the default
model-routing stance the user chose in Step 3 for skills that do adopt it.
Do not retrofit existing skills as part of this — that's a separate,
explicit task per skill.

## Step 5: Report what was installed and what was skipped

Close with a short summary: which roles were installed and why, which were
skipped and why, whether real model routing or single-session role
separation was chosen (and therefore whether any token savings should
actually be expected), and which models were assigned to which role. An
unstated omission reads as an oversight; a stated one reads as a decision.

## Step 6: Re-check trigger

Name one condition worth revisiting later: if Advise is being called on
nearly every run rather than rarely, the token-saving premise for routing
it to a pricier model stops paying for itself — that's worth flagging back
to the user rather than letting the routing run unexamined.
