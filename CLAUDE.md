# Working in this repo

This is `johncegom/johncegom-skills`, a Claude Code plugin marketplace. See
`plugins/minh-toolkit/skills/*/SKILL.md` for how individual skills work, and
`.claude/skills/update-toolkit-skill/SKILL.md` for the branch/validate/PR
workflow required to land any change here.

## Preview of changes

Whenever you hand work back to the owner after changing files in this repo
(end of task, or the reply that reports a commit, push, or PR), show a
preview of the whole change in the chat reply itself, not only in a file
or artifact:

1. Scope: `git diff --stat $(git merge-base main HEAD)` plus `git status
   --short` for untracked files. This covers committed and uncommitted work
   on the branch.
2. Hunks: the full diff for every file that carries behaviour (SKILL.md,
   this file, docs that direct sessions, scripts, CI), and the full content
   of any new untracked file. One line each is enough for version bumps,
   log/table rows, and generated edits. If you leave anything out, say what.
3. A few plain-words lines on what changed and why.

Show it once per hand-off. If you change files after a preview, show only
the new part. A PR opened from an already-previewed state just gets its
link. Don't skip it because the change is small or wasn't asked for this
time. It is a preview, not an approval gate: keep going unless the owner
asks you to wait. Files written outside the repo are listed by path.
Sub-agents don't preview; their caller does. No files changed means no
preview; say so in one line.

## Skill authoring reference

Before drafting a new `SKILL.md` or substantially editing one (a new or changed
`description`, a new or restructured section, content moved to or from
`references/`), read `docs/skill-authoring-best-practices.md`, a verbatim copy
of Anthropic's skill guide. Don't hand-edit it; refresh steps are in its bottom
comment. Find sections by heading with Grep rather than reading the whole file.
Always read "Checklist for effective Skills"; also "Writing effective
descriptions" when touching a `description`, "Progressive disclosure patterns"
when splitting into `references/`, and "Advanced: Skills with executable code"
for scripts.

This repo wins on conflicts: folded `>` descriptions (`update-toolkit-skill`);
no renaming existing skills (gerund names optional for new ones);
third-person voice only on descriptions you're already editing; Testing items
advisory; Grade item 5 portability over MCP prefix formats and model aliases.

## Claude Code mods

To build a Claude Code mod, load `plugin-authoring` for the API, then store and
ship it per "Adding a Claude Code mod" in `.claude/skills/update-toolkit-skill/SKILL.md`.
A mod is always its own plugin under `plugins/`, never part of `minh-toolkit`.

## Execute / Advise / Grade / Dream

This repo's actual task is authoring and editing skills — a task that
regularly hits ambiguous scope calls and benefits from a fresh-eyes check
before a PR opens. Installed via `bootstrap-eagd-pattern`; design rationale copied into this
repo at `docs/execute-advise-grade-dream.md` (kept local, not a link into
`plugins/minh-toolkit/`, so this mechanism survives if that plugin is ever
uninstalled).

Binding rows are written only by `bootstrap-eagd-pattern`, after a probe. Update
a row in place; never add a second row for the same key. A harness that holds a
different sub-agent tool has no row yet — re-run the skill from that harness.

<!-- eagd-bindings:start -->
eagd-binding: role=advise tool=Agent model=opus status=ok probed=2026-09-24 reported=claude-opus-5-5
eagd-binding: role=grade tool=Agent model=haiku status=ok probed=2026-09-18 reported=claude-haiku-4-5-20251001
eagd-binding: role=dream tool=Agent model=opus status=ok probed=2026-09-24 reported=claude-opus-5-5
<!-- eagd-bindings:end -->

**EAGD log:** `docs/eagd-log.md`

<!-- eagd-directive:start v=1 -->
**EAGD binding mechanics.** Managed by `bootstrap-eagd-pattern`. Do not edit
between these markers: put a local rule in a paragraph that begins
`**Local override.**` outside them, and change this span only by running the
skill's upgrade. The log is the file named on this document's `**EAGD log:**`
line.

*Precedence.* A `**Local override.**` paragraph outside this span wins over it
for the rows or roles that paragraph names. Any other text elsewhere about
binding rows, judging the `model:` reply or log statuses is superseded by this
span.

*Rows.* A binding is an `eagd-binding:` row keyed by `(role, tool)`. Find the
sub-agent tool you actually hold in your own tool list (do not guess your
vendor) and use the row for your role and that tool whose `status` is `ok` or
`flagged`. Row keys not defined here are owner extensions: pass `effort` if
your tool takes one, and ignore the rest.

*No usable row* (none for your tool, a status other than `ok` or `flagged`, the
row's model is your own, or the spawn errors). Advise and Dream skip: never run
them on your own model or an unknown one, because a same-model "consultation"
looks like a second opinion and is not. Proceed on your recorded leaning, log
the Advise call `SKIPPED reason=<code>` (for example
`no-verified-model-binding`), and say in the PR body or final report that the
role did not run. Grade may fall back to a fresh, context-free call on your own
model, since fresh eyes is its main value; add a Grade-fallbacks row only when
it does.

*Calling a role.* Call that tool with the row's `model`. Advise gets the
question, your leaning with the case for and against, and the artifacts the
decision turns on, verbatim (not your summary, not the transcript), and is
asked to name any context it lacked. Grade gets only the rubric and the
finished output, withholding the reasoning behind it. Dream gets the full run
history. Ask Advise and Dream to begin their reply with `model: <its own id>`.
A call on a `flagged` row is unverified: pass the explicit id and still ask for
that line.

*Judging the `model:` reply.* Take the id after `model:` on the reply's first
line. Normalize it and every id you compare it with, including the row's
`model=`: lowercase, trim surrounding whitespace, remove every quote and
backtick character, then drop one trailing period, then a trailing `-latest`.
Take the first case that fits:
1. It is your own id → set `status=stale`, add a Binding-changes row, and skip
   Advise until it is fixed.
2. It equals `reported=` → proceed.
3. It is uninformative (empty or missing, equal to `model=`, a bare family (an
   id with no digit in it), or a display name, meaning spaces inside the
   normalized id) → as in 1 on an `ok` row; no change on a `flagged` row.
4. Neither it nor `model=` contains the other → as in 1.
5. Otherwise the alias moved. Do not edit the row yourself. On a `flagged` row,
   proceed. On an `ok` row, if you hold an ask-the-user tool
   (`AskUserQuestion` on Claude Code) and are not a sub-agent, ask once per id
   per conversation, showing both ids:
   - "Use `<new>`": set `reported=<new>` (normalized) on every `ok` row with
     this tool and `model=`, add a Binding-changes row, and log the call as
     plain `answered`.
   - "Keep the binding and use the answer": log `answered flag=drift-assumed`
     and name the id in the final report.
   - Any other reply: set `status=stale` and log `SKIPPED reason=drift-declined`.

   If you cannot ask (a sub-agent, or no ask tool), act as "Keep the binding"
   but log `answered flag=drift-unconfirmed`.

*Flagged rows.* Log a call on a `flagged` row as `answered flag=unverified` and
say in the PR body or final report "Advise ran unverified on `<tool>`: the
model override could not be confirmed". Grade on a flagged row runs and adds a
Grade-fallbacks row with `reason=unverified-binding`. Dream marks its entry
`(model unverified)`. If a flagged call returns an informative `model:` reply
that fits `model=`, do not rewrite `reported=`; suggest re-running the skill to
verify.

*Logging.* Add one row per event at the end of its table in the log: Advise
calls (date, branch, question, prior leaning, answer, which was taken, tool,
requested model, reported model, status, changed yes/no), Binding changes
(date, role, tool, old, new, reason; also whenever a row's model, status or
reported id changes), Grade fallbacks (date, branch, tool, reason). An Advise
status is `answered`, `answered flag=unverified`, `answered flag=drift-assumed`,
`answered flag=drift-unconfirmed`, or `SKIPPED reason=<code>` (including
`drift-declined`). A row's `status` is `ok`, `flagged`, `unverified` or `stale`.
<!-- eagd-directive:end -->

**Advise.** Fires on observable conditions, never on felt doubt:
- a new `SKILL.md`, or a change to an existing skill's `description`
  line — one call on scope, always, before drafting;
- a change with more than one plausible home (existing skill, new skill,
  `references/`, this file) after you've read every candidate;
- an edit to this file or `docs/execute-advise-grade-dream.md` that
  changes how future sessions behave (a binding-row update under EAGD binding
  mechanics is not one).

Only judgment calls go to Advise: anything answerable by reading the repo,
read; a preference only the user can settle goes to `AskUserQuestion`, or
take the obvious default and say so. Write your leaning and why in one or
two lines, then call Advise as described under EAGD binding mechanics, with
the artifacts verbatim (candidate `description` lines, README skill-table
rows, the diff), and log the call there.

**Grade.** After drafting a new `SKILL.md` or substantially editing an
existing one, before opening the PR, call Grade fresh (no inherited
context), as described under EAGD binding mechanics, giving it only the finished `SKILL.md` and this rubric (withhold the reasoning that
produced it):
1. Does the frontmatter `description` state precisely when to trigger and
   when not to (no vague "use for X-related tasks")?
2. Does it avoid a mid-line `: ` in an unquoted YAML scalar (breaks
   frontmatter parsing — see `update-toolkit-skill`'s gotcha)?
3. Does it contradict guidance already stated in another installed
   skill's `SKILL.md`?
4. If it's opt-in, does the description say so explicitly, and is that
   reflected in `plugins/minh-toolkit/README.md`'s skill table?
5. Could an agent on another harness (Copilot, Codex, Cursor) follow every
   instruction? Applies to `plugins/**` skills only. N/A if the `description`
   contains the exact phrase `Claude Code only`, and that phrase must also be
   in the skill's README row. Otherwise fail each line that relies on one of
   these with no harness-neutral alternative in the same sentence or bullet:
   a Claude Code tool name used as a tool (`AskUserQuestion`, `Agent`/`Task`,
   `TodoWrite`, `Skill`, `ToolSearch`); a slash command as the only way to
   invoke something; a `.claude/` or `~/.claude` path, `settings.json`, or a
   hook; `CLAUDE.md` with no mention of `AGENTS.md` or "the anchor doc"; a
   model alias (`opus`, `sonnet`, `haiku`) used as the model to request.
   Not failures: calling the agent "Claude"; Claude-first wording with a
   fallback beside it (e.g. "use AskUserQuestion, or your harness's
   ask-the-user tool, else ask in plain text"); a named MCP server or
   external CLI stated as a requirement; `references/` files, which Grade
   does not see. Quote every offending line and the marker it hits. This
   grades only what could fail, so "optimized for Claude" is kept by allowing
   Claude-first wording, not scored. Item 5 grades the whole file; existing
   skills are not swept and come into line the next time they are
   substantially edited.

Default fail mode: **full rerun** — send it back to Execute to redraft,
unless Grade can name one single exact offending line whose fix in
isolation resolves the failure with no risk of the same flaw recurring
elsewhere in the file, in which case name that line and apply a targeted
fix only. For item 5, fix only the quoted lines unless the skill's
approach itself depends on the Claude-only feature; then either redraft
or declare `Claude Code only`.

**Dream.** After a Grade pass (pass or fail) that involved a genuine
design tradeoff — a scope decision, a naming call, a resolved
contradiction — call Dream as described under EAGD binding mechanics, given the full
exchange (the reasoning, the scope question, any Advise answer, the Grade
verdict), and have it append one entry to
`docs/skill-design-decisions.md` (create the file with a one-line header if
it doesn't exist yet): what was decided, why, and what alternative was
rejected. Skip this when nothing about the run was actually a judgment call
worth remembering.

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
