---
name: bootstrap-eagd-pattern
description: >
  Opt-in only. Do not trigger from general conversation about process,
  agent-instruction files (CLAUDE.md, AGENTS.md, Copilot or Cursor rules),
  or multi-agent architecture. Invoke only when the user explicitly asks
  for it by name, by running /bootstrap-eagd-pattern where the harness
  supports slash commands, or by saying something like "set up EAGD for
  this repo" or "give this repo a mechanism to spawn an advisor agent".
  Installs a standing, repo-wide mechanism, as live instructions in the
  project's anchor doc or kept outside the repo when it can't hold agent
  files, that lets a future agent session in this repo autonomously spawn
  an Advise/Grade/Dream role agent when it hits a matching trigger. Works
  on any harness with a sub-agent tool (optimised for Claude Code), with a
  probe-verified model per tool. Also re-runs to re-calibrate (keeping
  bindings) or, on request ("upgrade EAGD here"), upgrades an installed
  directive, diff-first.
---

# Bootstrap Execute / Advise / Grade / Dream — repo-wide spawn mechanism

## What this installs, precisely

A setup skill, same shape as `bootstrap-way-of-working`: it runs, writes
something durable, and doesn't run again until the user asks to set it up
again, re-calibrate, or upgrade an installed copy to this version.

What it writes is not a description of the pattern for a human to read
later. It is a **standing directive addressed to the agent itself**, added
to the project's anchor doc (`CLAUDE.md`/`AGENTS.md`): "when you hit trigger
condition X, spawn a fresh sub-agent call on the model bound for your tool
and do Z with the result." Every session in the repo reads the anchor doc,
so the mechanism is live the moment it's installed.

Two things make that safe when more than one harness reads the same anchor
doc. Model choices are stored as **bindings keyed by the sub-agent tool a
session actually holds** (never by vendor name, which a session would have
to guess), and a binding is only written **after a probe proved the harness
honours the model override**. A session with no verified binding does not
improvise a model — see Step 4.

`references/execute-advise-grade-dream.md` (next to this file) is the design
rationale. **Copy it into the target repo** (Step 4) rather than linking
into the plugin, so the rationale survives the plugin being uninstalled.
This skill's job is narrower: turn that rationale into imperative
instructions an agent will follow mid-task.

`references/storage-and-log.md` holds the out-of-tree mode details, the log
file format, why the runtime `model:` rule is shaped as it is, and extra
re-calibration checks. Read it when Steps 1b, 3, 4 or 6 point there.

`references/directive-template.md` is the generic part of the directive, copied
verbatim into each repo as one managed span (Step 4).
`references/directive-changelog.md` versions it, and `references/upgrade.md` is
how to bring an already-installed copy up to date.

## Step 1: Confirm scope, find the anchor doc, and check for an existing block

This installs a repo-wide capability, not a rewrite of any one skill's
`SKILL.md`. If the user wants one skill or task rewritten to spawn role
agents, that's a separate edit — say so.

Find or ask where the anchor doc lives (`CLAUDE.md`, `AGENTS.md`,
`CONTRIBUTING.md`). Extend it rather than creating a competing one. If
several harnesses are used, target the file they all read (usually
`AGENTS.md`). If none exists, ask whether to create one or fold this into
whatever file the agent reads at session start.

**Then check for an existing block** (the `eagd-bindings:start` marker from
Step 4, in the anchor doc and in `<state-dir>` if the Step 1b pointer
exists). If found, this is a **re-calibration by default**: read the
existing roles, spawn-vs-phase choice and binding rows *before asking
anything*, show them, and carry them forward as defaults in Steps 2 and 3.
Treat it as a fresh setup only if the user says so ("fresh", "start over");
then replace the whole block and log the replacement.

**If the user asked to update or upgrade the installed directive,** follow
`references/upgrade.md` instead of Steps 2 and 3: it shows the diff and asks
before writing, and changes only the managed span.

## Step 1b: Storage scope, committed or out-of-tree

**On a fresh install this is a required question: stop and ask it now, in
its own message, and do not start Step 2 or write anything until answered,
even if the repo looks ordinary.** Use the harness's question tool if it has
one, otherwise plain text. Ask once, default stated: "Everything goes in
committed files unless your repo can't hold agent artifacts. Should it be
kept out of the repo instead?" On a re-run don't ask — the mode is wherever
the existing block was found.

- **Committed (default).** `<state-dir>` is the repo (log and Dream file at
  the Step 4 paths) and the loader is the anchor doc, which every session
  reads.
- **Out-of-tree.** For repos that don't allow agent files in commits.
  `<state-dir>` is a stable per-user directory such as
  `~/.claude/eagd/<repo-key>/` on Claude Code (any equivalent on another
  harness) and nothing is written in the repo; a conditional pointer in a
  user-level instruction file is the loader. Read `references/storage-and-log.md` before writing anything in
  this mode, and state its limits to the user.

Later steps write to `<state-dir>` and don't branch on the mode.

## Step 2: Calibrate which triggers the mechanism should cover

Don't install all three non-Execute roles unconditionally. For each, confirm
with the user (or infer from the repo's shape) whether it earns a place. On
a re-run, start from the installed roles and ask only whether to change
them.

1. **Advise** — will tasks here plausibly hit a mid-run judgment call worth
   a second opinion: a decision no fact settles and the user has delegated
   (not answerable by reading the repo, not a preference only the user can
   make)? If yes, install it and identify the *observable* condition that
   marks such a decision here: a kind of change, a stage, or a unit of work
   that always gets one call.
2. **Grade** — does this repo produce outputs with a rubric-shaped quality
   check that benefits from a fresh read with no access to the reasoning
   behind it? If yes, install it.
3. **Dream** — is there something worth persisting across sessions (a
   decision log, a learned profile, a ledger) that a Grade pass should gate?
   Install only if Grade is also installed or already exists; Dream with
   nothing gating it writes on every run, defeating its selectivity.

State which were skipped and why.

## Step 3: Bind a verified model to each installed role

The binding is per **role and sub-agent tool**. Work out which sub-agent
tool *this* session holds from its own tool list, not a guess about vendor.
You can only write bindings for the tool you hold; a harness nobody has run
this from gets no row, only the directive's no-usable-row fallback. Ask whether other
harnesses are used, and if so tell the user to re-run this skill from each.

For every installed role, ask the user which model it should spawn with. Do
not default to the reference doc's suggested table; show it as context, then
ask. On a re-run where a row exists for this tool, ask "keep `<model>`?"
instead. Get a specific value, **exactly what this tool's model field
accepts** (an alias such as `opus` if it takes aliases, a full id if it
takes ids).

**Probe before writing a row.** Spawn the chosen model once with "Reply with
exactly the model id you are running as, nothing else." Then:

- Reply names the requested model specifically (a version or full id; a
  bare family name such as "Claude" or "GPT-4" is uninformative) → write the
  row with `status=ok` and the reply as `reported=`. `ok` means
  self-reported, not proven.
- The spawn errors, or the reply names a different specific model (typically
  this session's own) → the override was rejected or ignored. Write no `ok`
  row, tell the user, and let them pick another value or accept
  fallback-only.
- The reply is uninformative (empty, a bare family name, or the harness hides
  the model) → this tool can't verify the override. Say so plainly and ask
  once per tool: run Advise and Dream anyway with the explicit id, flagged in
  the log (`status=flagged`), or skip them (`status=unverified`)? Write that
  status in every role row for this tool and leave `reported=—`.
- The requested model is the same as this session's own → the probe proves
  nothing. First probe a model *different* from this session's own to show
  overrides work on this tool, then probe the requested one. A tool that
  can't self-report can't run the control probe either: ask the question
  above.

**On a re-run, probe only what was touched**: a changed model, a missing row
for this tool, or a user request to "verify" (probe every row for tools this
session holds; a mismatch other than an alias move sets `status=stale` and
asks for a replacement, and an alias move asks the owner, as the directive says).
Don't re-probe unchanged rows; renames are caught at runtime by the
directive's `model:` reply check. On a re-run, ask "keep `flagged`?" for
unverified tools the way you ask "keep `<model>`?", and re-probe any `ok` row
that `references/storage-and-log.md` lists as suspect.

Confirm one more thing: **this only saves tokens if the spawned call is a
genuinely separate sub-agent invocation with its own model field** — Advise
blocking until answered, Grade run fresh with only the rubric and finished
output, Dream run after a Grade pass with the full run history. If the user
wants same-session role separation instead (labeled phases in one
conversation: fresh-eyes benefit, no cost benefit), that's a legitimate but
different choice. Confirm which, because the anchor doc must say "spawn a
sub-agent call" for the first and "treat this as a distinct reasoning phase"
for the second.

## Step 4: Copy the rationale doc, then write the mechanism into the anchor doc

**Copy `references/execute-advise-grade-dream.md` into the target first** —
in committed mode e.g. `docs/execute-advise-grade-dream.md` (or wherever the
repo's docs live), in out-of-tree mode into `<state-dir>` — and point the
mechanism section at that local copy, not at a path inside
`plugins/minh-toolkit/`. If a copy exists from a previous run, don't
duplicate it.

**Write the bindings as fixed one-line rows** inside marker comments, so a
re-run can update them in place:

```
<!-- eagd-bindings:start -->
eagd-binding: role=advise tool=<tool> model=<requested> status=ok probed=<date> reported=<id from probe>
eagd-binding: role=grade tool=<tool> model=<requested> status=ok probed=<date> reported=<id from probe>
<!-- eagd-bindings:end -->
```

Fill every value from this session's own probe; never copy a model id or
date from this example, since ids drift between model releases. `status` is
one of `ok | flagged | unverified | stale`; none is a prefix of another, so a
loose search for `status=ok` never matches the others.

The key is `(role, tool)`. Update a row in place, never append a second for
the same key. A re-run replaces only the span between the markers. Rows for
tools this session doesn't hold are never touched; list them in the report
as "not re-verified from this harness". If the session holds the tool but
the probe errors, leave the row and report "could not re-verify". A probe
result changes a row only when it differs from what's stored. Whenever a
row's model, status or reported id changes, add one row to the log's "Binding
changes" table.

**The log file** (default `docs/eagd-log.md`; format, tables and
existing-file rules are in `references/storage-and-log.md`). Create it if
missing, and append to it if it exists.

**Write the generic mechanics by copying, not paraphrasing.** Copy
`references/directive-template.md` verbatim into the anchor doc, immediately
after the bindings end marker (out-of-tree mode: into `<state-dir>/directive.md`).
Do not reflow, reword or fill in anything: every install's span must be
byte-identical to the template, so a later upgrade can compare them. Put one
local line just above it, `**EAGD log:** <path to the log file>`. The span
carries the binding-row choice, the no-usable-row fallbacks, how to call each
role, how to judge the `model:` reply and the log vocabulary, so don't restate
them below; point at them as "EAGD binding mechanics".

Then write the **local parts** outside the span, as imperative instructions
addressed to the agent, not descriptive prose for a human. For each installed
role name:

- **The trigger condition**, something an outside reader could check, not a
  feeling (Advise: "before drafting any new module's public interface" or
  "one call per new `SKILL.md`, always" — not "when genuinely ambiguous").
  See "Advise's trigger and context" in the reference doc for why felt doubt
  is the wrong trigger. For Advise, also state the routing: verifiable
  questions go to research, preferences go to the user or a stated default,
  and only judgment calls reach Advise.
- **For Grade**, the rubric, and which of the reference doc's two fail modes is
  the default here (full rerun vs. targeted fix) and when the other is allowed.
- **For Dream**, the named, real file path in this repo that it writes to.
- **Anything specific to this repo or harness** that differs from the span, in
  a paragraph that begins `**Local override.**` and names the rows or roles it
  overrides.

Example shape for one role, local part only:

> **Advise.** Fires on observable conditions, never on felt doubt: before
> drafting any new `SKILL.md` or changing an existing skill's `description`
> line — one call on scope, always. Only judgment calls go here: anything
> answerable by reading the repo, read; a preference only the user can
> settle goes to your harness's ask-the-user tool (`AskUserQuestion` on
> Claude Code), else plain text. Write your leaning and why in one or two
> lines, then call Advise as described under EAGD binding mechanics, and log
> the call there.

That's the bar: an agent reading it mid-task should be able to act on it
without consulting the reference doc first.

## Step 5: Verify, then report what was installed

**Verify first, by reading the files back, not from memory.** Check that the
`eagd-bindings:start` and `:end` markers each appear once, that every
installed role has exactly one `eagd-binding` row per tool you hold, that the
rationale copy and log the directive names exist (the Dream file may wait
for its first run), and that the log's three tables have header rows. Fix
anything that fails before reporting; report it if you can't. Check the span
against `references/directive-template.md` with a comparison command (see
`references/upgrade.md`, section 5), never by eye.

State which roles got a live spawn mechanism, which were skipped and why,
the model bound to each installed role for this session's tool, and the
probe result behind each. List rows left untouched ("not re-verified from
this harness" or "could not re-verify") and any harness the user said is in
use but has no binding yet. Confirm no existing skill was rewritten: this
only touches the anchor doc, or in out-of-tree mode only `<state-dir>` and
the user-level pointer, with nothing inside the repo. In out-of-tree mode,
also tell the user to open a new session in the repo and ask it to quote the
EAGD Advise trigger, a manual check that the directive loads. If the user
wants a specific skill's `SKILL.md` rewritten to call into this mechanism,
that's a separate, deliberate task.

## Step 6: Re-calibration trigger

Name this explicitly in the anchor doc and point it at the log file, since
without a log none of these conditions can be detected. If a role,
especially Advise, fires on nearly every task, routing it to a pricier model
stops paying for itself: re-run this setup with a narrower trigger or
cheaper model. If a role never fires after a long period, the trigger is
miscalibrated or the role was never needed; remove it rather than leave
unused ceremony. If Advise's decision-change rate (calls where the answer
differed from the prior leaning) sits near zero, the calls are ceremony.

Also write the extra checks from `references/storage-and-log.md` (count
`SKIPPED` rows per Tool before changing a trigger, read the decision-change
rate per Tool, and in out-of-tree mode verify the directive still loads) in
one line each.
