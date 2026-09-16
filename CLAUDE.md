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

**Advise.** When a new or edited skill's scope is genuinely ambiguous —
it could plausibly duplicate an existing skill, or it's unclear whether a
change belongs in this skill vs. a new one vs. the repo's anchor doc — and
getting it wrong means redoing already-merged work, don't resolve it
alone: call the `Agent` tool with `model: claude-opus-5`, describing only
the specific scope question and the minimum context needed to answer it
(the candidate skill's purpose, the name/description of anything it might
overlap with). Wait for the reply before continuing.

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

**Re-calibration trigger.** If Advise ends up firing on nearly every skill
edit rather than genuinely ambiguous ones, or a role hasn't fired across
many skill-authoring sessions, come back and re-run `bootstrap-eagd-pattern`
to narrow the trigger, change the model, or drop the role.
