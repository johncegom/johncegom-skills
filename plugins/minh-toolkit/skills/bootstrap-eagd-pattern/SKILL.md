---
name: bootstrap-eagd-pattern
description: Opt-in only — do not trigger automatically from general conversation about process, CLAUDE.md, or multi-agent architecture. Invoke only when the user explicitly runs /bootstrap-eagd-pattern or directly asks by name (e.g. "set up EAGD for this repo", "give this repo a mechanism to spawn an advisor agent"). Installs a standing, repo-wide mechanism — live instructions in the project's anchor doc — that let any future agent session in this repo autonomously spawn an Advise/Grade/Dream role agent (via the harness's sub-agent tool, with a probe-verified named model per tool) when it hits a matching trigger, without the human setting it up again. Also handles re-runs, where existing model bindings are read and kept rather than re-asked. Runs once per setup or re-calibration; does not run continuously.
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
X, spawn a fresh sub-agent call on the model bound for your tool and do Z
with the result." Because every session working in this repo reads that
anchor doc, the mechanism is live the moment it's installed — an agent
doesn't need to be told again to consult an advisor; the anchor doc
already tells it to, every session, unconditionally. This is what makes it
a *mechanism* rather than a policy essay: the repo didn't have a way to
spawn a role-scoped sub-agent with a specific model before this ran, and
does after.

Two things make that safe when more than one agent harness reads the same
anchor doc. Model choices are stored as **bindings keyed by the sub-agent
tool a session actually holds** (never by vendor name, which a session
would have to guess), and a binding is only written **after a probe proved
the harness honours the model override**. A session with no verified
binding does not improvise a model — see Step 4.

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

## Step 1: Confirm scope, find the anchor doc, and check for an existing block

This installs a repo-wide capability, not a rewrite of any specific
skill's `SKILL.md`. If the user actually wants one particular skill or
task rewritten to spawn role agents, that's a narrower, separate edit —
say so and don't force it through this flow.

Find or ask where the project's anchor doc lives (`CLAUDE.md`, `AGENTS.md`,
`CONTRIBUTING.md`). Extend that file rather than creating a competing one.
If several agent harnesses are used in the repo, target the file they all
read (usually `AGENTS.md`). If none exists, ask whether to create one or
fold this into whatever file the agent is already told to read at session
start.

**Then check whether a mechanism block already exists** (look for the
`eagd-bindings:start` marker from Step 4). If it does, this is a re-run,
and it is a **re-calibration by default** — not a fresh setup. Read the
existing roles, spawn-vs-phase choice, and binding rows *before asking
anything*, show them to the user, and carry them forward as defaults in
Steps 2 and 3. Only treat it as a fresh setup if the user says so
explicitly ("fresh", "start over"); in that case replace the whole block
and log the replacement. The user does not need to remember what was
probed earlier — the file and this session's own tool list answer that.

## Step 2: Calibrate which triggers the mechanism should cover

Don't install all three non-Execute roles unconditionally — most repos and
most tasks won't need all of them. For each candidate role, confirm with
the user (or infer from the repo's actual shape, e.g. "this repo has no
rubric-shaped output anywhere" would argue against Grade) whether it earns
a place in the mechanism. On a re-run, start from the roles already
installed and ask only whether to change them.

1. **Advise** — will tasks in this repo plausibly hit a mid-run judgment
   call worth a second opinion — a decision no fact settles and the user
   has delegated (not something answerable by reading the repo, and not a
   preference only the user can make)? If yes, install it, and identify
   the *observable* condition that marks such a decision in this repo — a
   kind of change, a stage, or a unit of work that always gets one call.
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

## Step 3: Bind a verified model to each installed role

The binding is per **role and sub-agent tool**. Work out which sub-agent
tool *this* session holds from its own tool list (not from a guess about
which vendor it is). You can only write bindings for the tool you hold —
a harness nobody has run this from gets no row, only the fallback in
Step 4. Ask the user whether other harnesses are used in the repo, and if
so tell them to re-run this skill from each one.

For every role being installed, ask the user directly which model it
should spawn with — do not default to the reference doc's suggested table
(Sonnet/Opus/Haiku/Opus); show it as context, then ask. On a re-run where a
row already exists for this tool, the question becomes "keep `<model>`?"
instead. Get a real, specific value per role, not "a strong model" or
"whatever's cheap" — the value must be **exactly what this tool's model
field accepts** (an alias such as `opus` if the tool takes an enum of
aliases, a full id if it takes ids).

**Probe before writing a row.** Spawn the chosen model once with the prompt
"Reply with exactly the model id you are running as, nothing else."
Then compare:

- Reply is a plausible match for the requested model → write the row with
  `status=ok` and the reply as `reported=`.
- The spawn errors, or the reply names a different model (typically this
  session's own) → the harness rejected or ignored the override. Write no
  `ok` row for that role, tell the user, and let them pick another value
  or accept fallback-only behaviour.
- The requested model is the same as this session's own → the probe proves
  nothing about override support. Probe once with a model *different* from
  this session's own to show overrides work on this tool, then probe the
  requested one.

**On a re-run, probe only what was touched**: a changed model, a missing
row for this tool, or a user request to "verify" (probe every row for tools
this session holds; a mismatch sets `status=stale` and asks for a
replacement). Do not re-probe rows the user kept unchanged — renames are
caught at runtime by the `model_reported` check in Step 4, on the real call
path.

Confirm one more thing before writing the mechanism: **this only saves
tokens if the spawned call is a genuinely separate sub-agent invocation
with its own model field** — Advise blocking and waiting for the answer
before Execute continues, Grade run fresh with no inherited context (only
the rubric and finished output), Dream run after a Grade pass with the
full run history. If the user instead wants same-session role separation
(no spawning, just labeled phases in one conversation for a fresh-eyes
quality benefit with zero cost benefit), that's a legitimate but different
choice — confirm which one they want, because the anchor doc's wording has
to say "spawn a sub-agent call" for the first and "treat this as a distinct
reasoning phase" for the second, and they are not interchangeable.

## Step 4: Copy the rationale doc, then write the mechanism into the anchor doc

**Copy `references/execute-advise-grade-dream.md`'s content into the
target repo first** — e.g. `docs/execute-advise-grade-dream.md`, or
wherever the repo's own docs live — so the design rationale survives
independently of this plugin being installed. Point the anchor doc's
mechanism section at that local copy, not at a path inside
`plugins/minh-toolkit/`. If the repo already has its own copy from a
previous run, don't duplicate it — check first.

**Write the bindings as fixed one-line rows** inside marker comments, so a
later re-run can update them in place instead of re-reading prose:

```
<!-- eagd-bindings:start -->
eagd-binding: role=advise tool=Agent model=opus status=ok probed=2026-09-18 reported=claude-opus-5
eagd-binding: role=grade tool=Agent model=haiku status=ok probed=2026-09-18 reported=claude-haiku-4-5-20251001
<!-- eagd-bindings:end -->
```

The key is `(role, tool)`. Update a row in place, never append a second row
for the same key. A re-run replaces only the span between the markers.
Rows for tools this session does not hold are never touched; list them in
the report as "not re-verified from this harness". If the session holds
the tool but the probe itself errors, leave the row as-is and report
"could not re-verify". A probe result changes a row only when it differs
from what is stored — an identical result refreshes nothing and logs
nothing. Whenever a row's model or status does change, add one row to the
log's "Binding changes" table (see "The log file" below).

**The log file.** Default path `docs/eagd-log.md`. Its format must match
its file type, so the fields stay identical whatever the container is:

- **A markdown file (the default).** Create it if missing with a `# EAGD
  log` heading, one sentence of append rules, and three sections, each a
  real markdown table with a header and separator row: `## Advise calls`
  (Date, Branch, Question, Prior leaning, Answer, Taken, Tool, Requested,
  Reported, Status), `## Binding changes` (Date, Role, Tool, Old, New,
  Reason), and `## Grade fallbacks` (Date, Branch, Tool, Reason). Append
  each row at the end of its own section's table. One row per event, a
  single line, no line breaks inside a cell, a literal `|` written as
  `\|`, `—` for a field that doesn't apply. Status is `answered` or
  `SKIPPED reason=<code>`, so skips can be counted per Tool with a search.
- **An existing file the user points at instead** (a decision log, a
  `.jsonl` or `.csv` file). Read it first and follow its format — same
  file type conventions, same field set, new fields at the end. Never put
  markdown table syntax inside a `.jsonl` or `.csv` file, and never
  restructure a file the repo already uses just to fit this shape. If its
  format can't hold the fields, say so and ask instead of improvising.
- **If a log already exists from an earlier run,** append to it. Don't
  recreate it, and don't rewrite older rows to the new columns unless the
  user asks (a missing field is `—`).

Then write imperative instructions addressed to the agent, not descriptive
prose addressed to a human reader. For each installed role, name:

- **The trigger condition**, stated as something an outside reader could
  check, not as a feeling (Advise: "before drafting any new module's
  public interface" or "one call per new `SKILL.md`, always" — not
  "when genuinely ambiguous" or "whenever unsure"; see "Advise's trigger
  and context" in the reference doc for why felt doubt is the wrong
  trigger). For Advise, also state the routing: verifiable questions go
  to research, preferences go to the user or a stated default, and only
  judgment calls reach Advise — a filter, not a sequence of checkpoints.
- **The exact action**: use the `eagd-binding` row for this role whose
  `tool` you hold and whose `status=ok`, call that sub-agent tool with
  that model, and state what the prompt must and must not contain
  (Advise: the question, Execute's prior leaning with the case for and
  against, and the artifacts the decision turns on verbatim — not
  Execute's summary and not the whole transcript — plus a request that
  the advisor name any context it lacked, and a first instruction to
  begin its reply with `model: <its own id>`; Grade: only the rubric and
  finished output, explicitly withholding the reasoning that produced it;
  Dream: the full run history — reasoning, Advise exchanges, Grade
  verdict, plus the same `model:` first-line instruction).
- **What happens with no usable row** (none for the tool you hold, the row
  isn't `status=ok`, or the spawn errors — an error counts as no row).
  The two fallbacks differ on purpose. **Advise and Dream skip**: never
  run them on the session's own model or an unknown one, because a
  same-model "consultation" produces a log line that looks like a second
  opinion and drags the decision-change rate toward zero for a reason
  re-calibration would misdiagnose. Proceed on the recorded leaning, add
  an Advise-calls row with Status `SKIPPED reason=<code>`, and say in the
  PR body or final report that Advise did not run. **Grade may fall back**
  to a fresh, context-free call on the session's own model, since fresh
  eyes is its main value; add a Grade-fallbacks row only when it falls
  back.
- **What to do with the result**: Advise blocks and Execute waits for the
  answer before continuing, then adds one row to the Advise-calls table of
  the log file (date, branch, question, prior leaning, answer, which was
  taken, tool, requested model, reported model, status) so the
  re-calibration trigger in Step 6 has something to read. If the reported
  model doesn't match the row, treat it as a stale binding: set the row to
  `status=stale`, add a Binding-changes row, and skip Advise until it's
  fixed.
  Grade's fail path names which of the reference doc's two fail modes
  applies by default for this repo (full rerun vs. targeted fix — state one
  as the default and when the other is allowed); Dream writes to a named,
  real file path in this repo (state the path explicitly — don't leave
  "write to memory" unresolved).

Example shape for one role, to calibrate how concrete this needs to be:

> **Advise.** Fires on observable conditions, never on felt doubt: before
> drafting any new `SKILL.md` or changing an existing skill's `description`
> line — one call on scope, always. Only judgment calls go here: anything
> answerable by reading the repo, read; a preference only the user can
> settle goes to `AskUserQuestion`. Write your leaning and why in one or
> two lines. Then find the `eagd-binding` row for `role=advise` whose
> `tool` is the sub-agent tool you actually hold (check your tool list; do
> not guess your vendor) and whose `status=ok`, and call that tool with
> that row's `model`, giving it the question, your leaning with the case
> for and against, and the artifacts verbatim — not your summary. Ask it
> to name any context it lacked, and to begin its reply with
> `model: <its id>`. Wait for the reply. No usable row, or the spawn
> errors: do not run Advise on your own model — proceed on your leaning
> and log the call with Status `SKIPPED reason=no-verified-model-binding`.
> Afterward add one row to the "Advise calls" table in `docs/eagd-log.md`:
> date, branch, question, prior leaning, answer, which was taken, tool,
> requested model, reported model, status.

That's the bar — an agent reading it mid-task should be able to act on it
immediately, without needing to consult the reference doc first.

## Step 5: Report what was installed

State which roles got a live spawn mechanism, which were skipped and why,
the model bound to each installed role for this session's tool, and the
probe result behind each. List any rows left untouched ("not re-verified
from this harness" or "could not re-verify") and any harness the user said
is in use but has no binding yet. Confirm no existing skill was rewritten —
this only touches the anchor doc. If the user wants a specific skill's
`SKILL.md` rewritten to call into this mechanism explicitly, that's a
separate, deliberate task, not something this run did implicitly.

## Step 6: Re-calibration trigger

Name this explicitly in the anchor doc so it isn't lost, and point it at
the log file from Step 4 — without a log, none of these conditions can be
detected. If a spawned role — especially Advise — ends up firing on
nearly every task rather than rarely, the token-saving premise behind
routing it to a pricier model stops paying for itself, and it's worth
coming back to re-run this setup with a narrower trigger or a cheaper
model. Same idea if a role never fires at all after a long period — a
sign the trigger is miscalibrated or the role was never needed, worth
removing rather than leaving as unused ceremony. And if Advise's
decision-change rate (calls where the answer differed from the prior
leaning) sits near zero, the calls are ceremony: the answer was always
what Execute would have done anyway.

Two additions for repos with more than one harness. Before narrowing or
widening a trigger, **count the `SKIPPED` rows per Tool** — a low firing
rate caused by missing bindings is a binding problem, not a trigger
problem, and the fix is to re-run this skill from that harness. And read
the decision-change rate **per Tool value** rather than in aggregate, since different harnesses' advisors can disagree with their
sessions systematically.
