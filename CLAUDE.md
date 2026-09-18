# Working in this repo

This is `johncegom/johncegom-skills`, a Claude Code plugin marketplace. See
`plugins/minh-toolkit/skills/*/SKILL.md` for how individual skills work, and
`.claude/skills/update-toolkit-skill/SKILL.md` for the branch/validate/PR
workflow required to land any change here.

## Execute / Advise / Grade / Dream

This repo's actual task is authoring and editing skills — a task that
regularly hits ambiguous scope calls and benefits from a fresh-eyes check
before a PR opens. Installed via `bootstrap-eagd-pattern`; design rationale copied into this
repo at `docs/execute-advise-grade-dream.md` (kept local, not a link into
`plugins/minh-toolkit/`, so this mechanism survives if that plugin is ever
uninstalled).

**Model bindings.** Each role spawns on a model verified for the sub-agent
tool a session actually holds. Check your own tool list for the tool (do not
guess your vendor), then use the row for `(role, tool)` whose `status=ok`.
Rows are written only by `bootstrap-eagd-pattern`, after a probe. Update a
row in place; never add a second row for the same key. A harness that holds
a different sub-agent tool has no row yet — re-run the skill from that
harness.

<!-- eagd-bindings:start -->
eagd-binding: role=advise tool=Agent model=opus status=ok probed=2026-09-18 reported=claude-opus-5
eagd-binding: role=grade tool=Agent model=haiku status=ok probed=2026-09-18 reported=claude-haiku-4-5-20251001
eagd-binding: role=dream tool=Agent model=opus status=ok probed=2026-09-18 reported=claude-opus-5
<!-- eagd-bindings:end -->

**No usable row** (none for the tool you hold, the row isn't `status=ok`, or
the spawn errors): Advise and Dream **skip** — never run them on your own
model or an unknown one, because a same-model "consultation" looks like a
second opinion and is not. Proceed on your recorded leaning and say in the
PR body or final report that the role did not run. Grade **may fall back** to
a fresh, context-free call on your own model, since fresh eyes is its main
value.

**Advise.** Fires on observable conditions, never on felt doubt:
- a new `SKILL.md`, or a change to an existing skill's `description`
  line — one call on scope, always, before drafting;
- a change with more than one plausible home (existing skill, new skill,
  `references/`, this file) after you've read every candidate;
- an edit to this file or `docs/execute-advise-grade-dream.md` that
  changes how future sessions behave.

Only judgment calls go to Advise: anything answerable by reading the repo,
read; a preference only the user can settle goes to `AskUserQuestion`, or
take the obvious default and say so. Write your leaning and why in one or
two lines, then call the sub-agent tool with the `model` from your
`role=advise` row, giving it the question, your leaning with the case for
and against, and the artifacts verbatim (candidate `description` lines,
README skill-table rows, the diff) — not your summary. Ask it to name any
context it lacked, and to begin its reply with `model: <its own id>`. Wait
for the reply. If the reported id doesn't match the row's `reported=`, treat
the binding as stale: set the row to `status=stale`, add a row to the
"Binding changes" table, and skip Advise until it's fixed. Afterward add one
row to the "Advise calls" table in `docs/eagd-log.md`: date, branch,
question, prior leaning, answer, which was taken, tool, requested model,
reported model, status (`answered`, or `SKIPPED reason=<code>` when no usable
row — e.g. `no-verified-model-binding` — so skips can be counted per tool).

**Grade.** After drafting a new `SKILL.md` or substantially editing an
existing one, before opening the PR, call the sub-agent tool fresh (no
inherited context) with the `model` from your `role=grade` row, giving it
only the finished `SKILL.md` and this rubric (withhold the reasoning that
produced it):
1. Does the frontmatter `description` state precisely when to trigger and
   when not to (no vague "use for X-related tasks")?
2. Does it avoid a mid-line `: ` in an unquoted YAML scalar (breaks
   frontmatter parsing — see `update-toolkit-skill`'s gotcha)?
3. Does it contradict guidance already stated in another installed
   skill's `SKILL.md`?
4. If it's opt-in, does the description say so explicitly, and is that
   reflected in `plugins/minh-toolkit/README.md`'s skill table?

Default fail mode: **full rerun** — send it back to Execute to redraft,
unless Grade can name one single exact offending line whose fix in
isolation resolves the failure with no risk of the same flaw recurring
elsewhere in the file, in which case name that line and apply a targeted
fix only. If Grade had to fall back to your own model (no usable row), add
a row to the "Grade fallbacks" table in `docs/eagd-log.md`: date, branch,
tool, reason.

**Dream.** After a Grade pass (pass or fail) that involved a genuine
design tradeoff — a scope decision, a naming call, a resolved
contradiction — call the sub-agent tool with the `model` from your
`role=dream` row, given the full exchange (the reasoning, the scope
question, any Advise answer, the Grade verdict) and told to begin its reply
with `model: <its own id>`, and have it append one entry to
`docs/skill-design-decisions.md` (create the file with a one-line header if
it doesn't exist yet): what was decided, why, and what alternative was
rejected. If the reported id doesn't match the row, treat the binding as
stale as under Advise. Skip this when nothing about the run was actually a
judgment call worth remembering.

**Re-calibration trigger.** Check `docs/eagd-log.md` occasionally. If
Advise averages more than about one call per PR, or hasn't fired across
roughly ten skill-authoring sessions, or its decision-change rate (calls
where the advisor's answer differed from the prior leaning) sits near
zero, come back and re-run `bootstrap-eagd-pattern` to narrow the
trigger, change the model, or drop the role. Same for Grade and Dream if
they never fire. Before narrowing or widening a trigger, count the
`SKIPPED` rows per Tool — a low firing rate caused by missing bindings is a
binding problem, fixed by re-running the skill from that harness. Read the
decision-change rate per Tool, not in aggregate.
