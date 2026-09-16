---
name: bootstrap-eagd-pattern
description: Opt-in only — do not trigger automatically from general conversation about process, CLAUDE.md, or multi-agent architecture. Invoke only when the user explicitly runs /bootstrap-eagd-pattern or directly asks by name (e.g. "set up EAGD for this repo", "give this repo a mechanism to spawn an advisor agent"). Installs a standing, repo-wide mechanism — live instructions in the project's anchor doc — that let any future agent session in this repo autonomously spawn an Advise/Grade/Dream role agent (via the Agent tool, with a named model) when it hits a matching trigger, without the human setting it up again. Runs once per setup or re-calibration; does not run continuously.
---

# Bootstrap Execute / Advise / Grade / Dream — repo-wide spawn mechanism

## What this installs, precisely

This is a one-time setup skill, same shape as `bootstrap-way-of-working`:
it runs, writes something durable, and then doesn't run again until the
user explicitly asks to set it up again or re-calibrate it.

What it writes is not a description of the Execute/Advise/Grade/Dream
pattern for a human to read later — it's a **standing directive addressed
to the agent itself**, added to the project's anchor doc
(`CLAUDE.md`/`AGENTS.md`), of the shape: "when you hit trigger condition
X, spawn a fresh `Agent` call with model Y and do Z with the result."
Because every session working in this repo reads that anchor doc, the
mechanism is live the moment it's installed — an agent doesn't need to be
told again to consult an advisor; the anchor doc already tells it to, every
session, unconditionally. This is what makes it a *mechanism* rather than
a policy essay: the repo didn't have a way to spawn a role-scoped
sub-agent with a specific model before this ran, and does after.

`references/execute-advise-grade-dream.md` is the design rationale behind
the mechanism (why four roles, why fresh eyes, why routing to a different
model only pays off if the call is genuinely separate). **Copy this file
into the target repo** (Step 4) rather than linking to it inside the
plugin — a plugin can be uninstalled or updated independently of the
repos it was used to bootstrap, and a mechanism whose rationale doc
disappears the moment someone removes `minh-toolkit` isn't durable. The
copy belongs to the target repo from that point on; this skill's job is
narrower and more concrete: turn that rationale into imperative, directly-actionable
instructions an agent will actually follow mid-task.

## Step 1: Confirm scope and find the anchor doc

This installs a repo-wide capability, not a rewrite of any specific
skill's `SKILL.md`. If the user actually wants one particular skill or
task rewritten to spawn role agents, that's a narrower, separate edit —
say so and don't force it through this flow.

Find or ask where the project's anchor doc lives (`CLAUDE.md`, `AGENTS.md`,
`CONTRIBUTING.md`). Extend that file rather than creating a competing one.
If none exists, ask whether to create one or fold this into whatever file
the agent is already told to read at session start.

## Step 2: Calibrate which triggers the mechanism should cover

Don't install all three non-Execute roles unconditionally — most repos and
most tasks won't need all of them. For each candidate role, confirm with
the user (or infer from the repo's actual shape, e.g. "this repo has no
rubric-shaped output anywhere" would argue against Grade) whether it earns
a place in the mechanism:

1. **Advise** — will tasks in this repo plausibly hit a mid-run judgment
   call worth a second opinion (an ambiguous choice, something needing
   external verification, a borderline call)? If yes, install it.
2. **Grade** — does this repo produce outputs with a rubric-shaped quality
   check (a checklist, explicit pass/fail criteria) that benefits from a
   fresh read with no access to the reasoning that produced it? If yes,
   install it.
3. **Dream** — is there something in this repo worth persisting across
   separate agent sessions (a decision log, a learned profile, a ledger)
   that a Grade pass should gate? Install only if Grade is also installed
   or already exists — Dream with nothing gating it just writes to memory
   on every run, which defeats the point of it being selective.

Install only the triggers that passed. State which were skipped and why —
same transparency `bootstrap-way-of-working` requires for its tiers.

## Step 3: Ask the user which model runs each installed role

For every role being installed, ask the user directly which model it
should spawn with — do not default to the reference doc's suggested table
(Sonnet/Opus/Haiku/Opus); show it as context, then ask. Record the answer
by name (e.g. "Advise: Opus 5, Grade: Haiku 4.5, Dream: Opus 5"). This is
the actual mechanism this skill exists to install — get a real, specific
model id or name per role, not "a strong model" or "whatever's cheap."

Confirm one more thing before writing the mechanism: **this only saves
tokens if the spawned call is a genuinely separate `Agent` invocation with
its own `model` field** — Advise blocking and waiting for the answer
before Execute continues, Grade run fresh with no inherited context (only
the rubric and finished output), Dream run after a Grade pass with the
full run history. If the user instead wants same-session role separation
(no spawning, just labeled phases in one conversation for a fresh-eyes
quality benefit with zero cost benefit), that's a legitimate but different
choice — confirm which one they want, because the anchor doc's wording has
to say "spawn an Agent call" for the first and "treat this as a distinct
reasoning phase" for the second, and they are not interchangeable.

## Step 4: Copy the rationale doc, then write the mechanism into the anchor doc

**Copy `references/execute-advise-grade-dream.md`'s content into the
target repo first** — e.g. `docs/execute-advise-grade-dream.md`, or
wherever the repo's own docs live — so the design rationale survives
independently of this plugin being installed. Point the anchor doc's
mechanism section at that local copy, not at a path inside
`plugins/minh-toolkit/`. If the repo already has its own copy from a
previous run, don't duplicate it — check first.

Then write imperative instructions addressed to the agent, not descriptive
prose addressed to a human reader. For each installed role, name:

- **The trigger condition**, stated precisely enough to act on without
  re-deriving it each time (e.g. "when a decision is genuinely ambiguous
  and a wrong guess would be costly to unwind" — not "whenever unsure").
- **The exact action**: call the `Agent` tool with `model: <the model
  named in Step 3>`, and what the prompt must and must not contain
  (Advise: only the specific decision plus context needed to resolve it,
  not the whole transcript; Grade: only the rubric and finished output,
  explicitly withholding the reasoning that produced it; Dream: the full
  run history — reasoning, Advise exchanges, Grade verdict).
- **What to do with the result**: Advise blocks and Execute waits for the
  answer before continuing; Grade's fail path names which of the
  reference doc's two fail modes applies by default for this repo (full
  rerun vs. targeted fix — state one as the default and when the other is
  allowed); Dream writes to a named, real file path in this repo (state
  the path explicitly — don't leave "write to memory" unresolved).

Example shape for one role, to calibrate how concrete this needs to be:

> **Advise.** When you hit a decision that's genuinely ambiguous and hard
> to reverse if wrong, don't resolve it alone: call the `Agent` tool with
> `model: claude-opus-5`, describing only the specific decision and the
> minimum context needed to answer it. Wait for the reply before
> continuing.

That's the bar — an agent reading it mid-task should be able to act on it
immediately, without needing to consult the reference doc first.

## Step 5: Report what was installed

State which roles got a live spawn mechanism, which were skipped and why,
the model assigned to each installed role, and confirm no existing skill
was rewritten — this only touches the anchor doc. If the user wants a
specific skill's `SKILL.md` rewritten to call into this mechanism
explicitly, that's a separate, deliberate task, not something this run
did implicitly.

## Step 6: Re-calibration trigger

Name this explicitly in the anchor doc so it isn't lost: if a spawned
role — especially Advise — ends up firing on nearly every task rather
than rarely, the token-saving premise behind routing it to a pricier model
stops paying for itself, and it's worth coming back to re-run this setup
with a narrower trigger or a cheaper model. Same idea if a role never
fires at all after a long period — that's a sign the trigger is either
miscalibrated or the role was never actually needed, and it's worth
removing rather than leaving it as unused ceremony in the anchor doc.
