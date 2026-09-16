---
name: bootstrap-eagd-pattern
description: Opt-in only — do not trigger automatically from general conversation about process, CLAUDE.md, or multi-agent architecture. Invoke only when the user explicitly runs /bootstrap-eagd-pattern or directly asks by name (e.g. "set up EAGD for this repo", "bootstrap the Execute/Advise/Grade/Dream way of working"). Documents the Execute/Advise/Grade/Dream role-separation pattern (references/execute-advise-grade-dream.md) as a repo-wide convention in the project's anchor doc — calibrating which roles the convention should recommend, and always asking the user which model runs each role rather than assuming a default.
---

# Bootstrap Execute / Advise / Grade / Dream — repo-wide way of working

## Why this exists, and the trap to avoid

`references/execute-advise-grade-dream.md` names a reusable pattern: split
work across up to four roles (Execute, Advise, Grade, Dream) instead of one
role doing everything, because a role that just produced an output is bad
at judging it — fresh eyes catch what the author's own reasoning hides from
itself. That file is deliberately just a reference, not a mandate: it says
outright that most skills need one or two roles, not all four, and that
adopting it into anything specific is "a separate, deliberate pass."

This skill installs that pattern as a **documented convention for the
repo**, not as runtime code for any one skill. The output is a section in
the project's anchor doc (`CLAUDE.md`/`AGENTS.md`) that tells future
work — future skills, future sessions, future contributors — when this
pattern applies and how to apply it, so it gets rediscovered deliberately
each time instead of reinvented or skipped by accident. It does not, by
itself, rewrite any existing skill to use the pattern; that stays a
separate, explicit task per skill (see Step 4).

Two traps to avoid, both about calibration:

1. **Don't write a convention that mandates all four roles.** Most tasks
   this repo's skills do won't need Advise, Grade, or Dream at all. A
   convention doc that reads as "every skill should have all four" isn't
   discipline, it's ceremony nobody will actually follow — and an
   unfollowed convention is worse than none, because it looks authoritative
   while being ignored.
2. **Don't let the convention imply cost savings it can't deliver.** The
   pattern's token-saving pitch ("route the expensive model to Advise
   only") only holds if a role genuinely runs as a separate model call.
   If a future skill just labels sections Execute/Advise/Grade/Dream
   inside one continuous conversation, it gets the fresh-eyes quality
   benefit but nothing routes to a different model, so nothing is actually
   saved. The convention must say which of these two modes it's
   recommending, not leave it ambiguous (see Step 3).

## Step 1: Confirm scope and find the anchor doc

Confirm this is about the repo's general way of working, not any one
skill's implementation — if the user actually wants a specific skill
rewritten to use this pattern, that's a different, narrower task than this
skill does; say so and hand it back to a plain editing pass on that skill's
`SKILL.md` instead of forcing it through this convention-writing flow.

Find or ask where the project's anchor doc already lives
(`CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, `docs/DEVELOPMENT.md`).
Extend that file rather than creating a competing one — same rule
`bootstrap-way-of-working` follows for its own anchor doc.

## Step 2: Calibrate what the convention should recommend

Don't write "always use all four roles." Instead, state the same three
trigger questions the reference doc's worked examples use to decide
per-task, so a future session can apply them without re-deriving the
pattern from scratch:

1. **Advise** — does the task hit a mid-run judgment call that shouldn't be
   resolved alone: an ambiguous choice, something needing external
   verification, a borderline case worth a second opinion?
2. **Grade** — does the finished output have a rubric-shaped quality
   check: a checklist or pass/fail structure a fresh reader could apply
   without needing the reasoning that produced the draft?
3. **Dream** — is there something worth persisting across separate runs:
   a learned profile, a ledger, anything a future run should read back
   instead of rebuilding from scratch? (Dream normally follows a Grade
   pass — recommend against installing Dream with no Grade gating what
   gets written to memory.)

The convention's job is to state these questions and the default posture
("Execute alone is enough unless one of these clearly applies") — not to
pre-decide which future tasks need which roles. That decision is made
per-task, when it comes up, same as `bootstrap-way-of-working`'s tiers are
chosen per-project rather than fixed in advance.

## Step 3: Ask the user which model runs each role, and which routing mode

Ask directly — do not default to the reference doc's suggested table
(Sonnet/Opus/Haiku/Opus). That table is context to show the user, not an
instruction to apply silently. Get an explicit answer for each role the
convention will cover (Advise, Grade, Dream — Execute is whatever model is
already running the main task) and record the answer by name (e.g.
"Advise: Opus 5, Grade: Haiku 4.5, Dream: Opus 5").

Also resolve, and state in the convention, which routing mode it
recommends:

- **Real model routing (actual token savings):** a role that gets invoked
  runs as a genuinely separate `Agent` tool call with an explicit `model`
  override — Advise blocks and waits for the answer before Execute
  continues; Grade is a fresh call (no inherited context) given only the
  rubric and finished output; Dream is a call given the full run history,
  writing to a named persistent file. This is the only mode that saves
  tokens, because it's the only one where a different model actually does
  some of the work instead of the top-tier model carrying the whole
  conversation.
- **Role separation without model routing (quality only, no cost
  benefit):** all roles stay in the same session/model, as distinct,
  clearly separated phases with the fresh-eyes boundary enforced by
  instruction alone (Grade genuinely isn't shown the reasoning, even
  though it's the same model in the same conversation). Fine when the
  goal is catching blind spots, not saving money — but the convention
  must say this is what it recommends, so nobody expects a cost reduction
  that isn't happening.

If the user wants both modes available (e.g. real routing for expensive
long-running skills, same-session separation for cheap ones), the
convention should say which situations call for which, not leave every
future skill to guess.

## Step 4: Write the convention section into the anchor doc

Add a section (name it something findable, e.g. "Execute / Advise / Grade
/ Dream") stating:

- One line naming the pattern and pointing at
  `references/execute-advise-grade-dream.md` (or wherever this repo's copy
  of that reference lives) for the full explanation — don't duplicate the
  whole reference doc's content into the anchor doc.
- The three trigger questions from Step 2, and the default posture
  (Execute-only unless one clearly applies).
- The model assignment and routing mode from Step 3, stated as this
  repo's convention, not a personal preference buried in memory.
- An explicit statement that adopting this into any specific skill is a
  separate, deliberate pass — this convention section tells a future
  session *when* and *how* to do that pass, it does not do the pass
  itself. Do not retrofit any existing skill as part of this step.

## Step 5: Report what was written

Close with a short summary: where the convention section was added, what
it recommends (which questions gate which role, which models, which
routing mode), and confirm explicitly that no existing skill was modified
to use the pattern — only the convention was recorded. If the user wants a
pilot skill built against this convention next, that's a distinct,
separate task.

## Step 6: Re-check trigger

Name one condition worth revisiting later: once a skill actually adopts
this convention, if its Advise role ends up called on nearly every run
rather than rarely, the token-saving premise behind routing it to a
pricier model stops paying for itself — worth flagging back to the user
rather than letting the routing run unexamined.
