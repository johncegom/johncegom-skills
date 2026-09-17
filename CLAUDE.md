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
two lines, then call the `Agent` tool with `model: claude-opus-5`, giving
it the question, your leaning with the case for and against, and the
artifacts verbatim (candidate `description` lines, README skill-table
rows, the diff) — not your summary. Ask it to name any context it lacked.
Wait for the reply. Afterward append one line to `docs/eagd-log.md`
(create with a one-line header if missing): date, branch, question, prior
leaning, answer, which was taken.

**Grade.** After drafting a new `SKILL.md` or substantially editing an
existing one, before opening the PR, call the `Agent` tool fresh (no
inherited context) with `model: claude-haiku-4-5-20251001`, giving it only
the finished `SKILL.md` and this rubric:
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
fix only.

**Dream.** After a Grade pass (pass or fail) that involved a genuine
design tradeoff — a scope decision, a naming call, a resolved
contradiction — call the `Agent` tool with `model: claude-opus-5`, given
the full exchange (the scope question, any Advise answer, the Grade
verdict), and have it append one entry to `docs/skill-design-decisions.md`
(create the file with a one-line header if it doesn't exist yet): what was
decided, why, and what alternative was rejected. Skip this when nothing
about the run was actually a judgment call worth remembering.

**Re-calibration trigger.** Check `docs/eagd-log.md` occasionally. If
Advise averages more than about one call per PR, or hasn't fired across
roughly ten skill-authoring sessions, or its decision-change rate (calls
where the advisor's answer differed from the prior leaning) sits near
zero, come back and re-run `bootstrap-eagd-pattern` to narrow the
trigger, change the model, or drop the role. Same for Grade and Dream if
they never fire.
