# Storage modes and the log file

Detail for Steps 1b, 3, 4 and 6 of `SKILL.md`. Read the section you need when
the step points here.

## Out-of-tree mode

For a repo or organisation that does not allow agent files in commits.

- `<state-dir>` is `~/.claude/eagd/<repo-key>/` (Claude Code's default; any
  stable per-user directory works on another harness). It holds the
  directive, the `eagd-binding` rows, the rationale-doc copy, the log and
  the Dream file. **Nothing is written inside the repo** — not even a
  `.gitignore` edit, which would itself be a committed change.
- Key `<repo-key>` on the remote URL slug, not a local path, so two clones
  of one repo share one state.
- The loader is a pointer in a user-level instruction file the harness
  loads every session (for Claude Code, `~/.claude/CLAUDE.md`; confirm your
  version supports it and any `@import` you rely on). The pointer must be
  conditional — "only when working in the repo whose remote is X, read
  `<state-dir>/directive.md`" — because a user-level file applies to every
  repo.
- If the harness loads no user-level instruction file, stop before Step 2:
  tell the user out-of-tree cannot be loaded here, write nothing, and offer
  committed mode or no install.

Limits to state to the user: teammates do not get the mechanism, and if the
org's policy also covers files under `~/.claude` (synced or managed), this
does not satisfy it. Do not offer a local-untracked variant (files hidden
with `.git/info/exclude`): the directive would still need an untracked
loader, and the files vanish on re-clone and in new worktrees.

## The log file

Default path `docs/eagd-log.md` in committed mode, `<state-dir>/eagd-log.md`
in out-of-tree mode. Its format must match its file type; the fields stay
identical whatever the container is.

- **Markdown file (default).** Create it if missing with a `# EAGD log`
  heading, one sentence of append rules, and three sections, each a real
  markdown table with header and separator rows:
  - `## Advise calls`: Date, Branch, Question, Prior leaning, Answer,
    Taken, Tool, Requested, Reported, Status, Changed (`yes`, `no` or `—`;
    `yes` when the answer altered the prior leaning)
  - `## Binding changes`: Date, Role, Tool, Old, New, Reason
  - `## Grade fallbacks`: Date, Branch, Tool, Reason

  Append each row at the end of its own table. One row per event, a single
  line, no line breaks inside a cell, a literal `|` written as `\|`, `—` for
  a field that doesn't apply. The Status values and what each means are
  defined in the directive template (`directive-template.md`), so they are not
  repeated here: search them per Tool to count skips and flagged answers.
  Older rows without a Changed cell read as `—`; don't backfill them.
- **An existing file the user points at instead** (a decision log, a
  `.jsonl` or `.csv` file). Read it first and follow its format: same file
  type conventions, same field set, new fields at the end. Never put
  markdown table syntax inside a `.jsonl` or `.csv` file, and never
  restructure a file the repo already uses to fit this shape. If its format
  can't hold the fields, say so and ask instead of improvising.
- **A log from an earlier run:** append to it. Don't recreate it, and don't
  rewrite older rows to new columns unless asked (a missing field is `—`).

## Judging the `model:` reply at runtime

Aliases move: `model=opus` resolves to a newer version at each release, so an
exact match against `reported=` stalls a working binding. A name can't say
whether the new version is better or worse (`opus-4` vs `opus-5-5`, `mini`
vs none), so the agent never decides that: it asks the human a plain
two-choice question and records the answer. The rule itself (the normalization
and the five cases, first match wins) is in `directive-template.md`; this section
is the reasoning behind it.

Notes:
- With a full-id `model=` (`claude-opus-5-5`) any other version is the fourth
  case, not an alias move; an alias move needs a family-style `model=`.
- "Use `<new>`" rewrites `reported=` on every `ok` row sharing the tool and
  `model=`, leaves `model=` and `probed=` alone, and adds one Binding-changes
  row per row (old id, new id, "version drift, owner chose the new id"). The
  row then matches under the second case, so nothing asks again. In committed
  mode it is a file edit on the current branch: other branches keep asking
  until it merges, and two branches that both accept can conflict on the row.
- "Keep the binding" leaves the row `ok`, not `flagged`: `flagged` means the
  tool can't self-report and carries `reported=—`. The next conversation asks
  again because the row still holds the old id. Three or more
  `drift-assumed` rows for one new id mean it is time to pick "Use `<new>`" or
  re-run verify.
- Ask only with an ask-the-user tool, and not from a sub-agent. A plain-text
  question in a headless run (`-p`, CI, a scheduled run) ends the run with
  nothing logged; the unconfirmed path still runs the call and logs it.
- "Once per id" means once per conversation; after context compaction the
  agent may ask again, which is harmless.
- A flagged row's alias-moved reply asks nothing: proceed and suggest a
  verify re-run.
- Self-reports can flap (a model sometimes names an older sibling), so one
  id can reappear in `drift-*` rows; that is noise, not a failing binding.
- The rule lives in the managed span, so an installed copy is brought up to
  date by the upgrade in `upgrade.md`, which shows the diff and asks first. A
  re-run of setup still replaces only the binding rows.

## Suspect `ok` rows from an older probe

An earlier probe text had no branch for an uninformative reply, so a row
written then may say `status=ok` with `reported=` empty, `—`, a bare family
name ("Claude", "GPT-4"), or just the requested string. Treat such a row as
unprobed: on a re-run or verify, re-probe it, and if the reply is still
uninformative, ask the run-and-flag or skip question and add a
Binding-changes row. Rows with a specific reported id need no change.

## Re-calibration, extra checks

- In out-of-tree mode, if a role never fires, first check the directive is
  still loading (the manual check in Step 5) before narrowing its trigger:
  a pointer that stopped loading looks exactly like a role that was never
  needed.
- For repos with more than one harness, before narrowing or widening a
  trigger **count the `SKIPPED` rows per Tool**: a low firing rate caused by
  missing bindings is a binding problem, fixed by re-running this skill from
  that harness. Read the decision-change rate **per Tool value**, not in
  aggregate, since different harnesses' advisors can disagree with their
  sessions systematically. The rate is `Changed=yes` over answered rows,
  with `flag=unverified` rows counted separately.
- The rate cannot detect an ignored override: a same-model advisor still
  disagrees sometimes, a good leaning gets agreement from any model, and
  Advise fires about once per PR, too few calls for a baseline. Use it for
  re-calibration only, and never switch a `flagged` tool to skip
  automatically; the user decides.
- A per-call resolved-model field in the harness's tool result could later
  earn `ok`, but only if it passes a discrimination test: a bogus id errors
  or comes back as something else, an alias resolves to a full id, and a
  model different from the session's own comes back as that model. A field
  that echoes the request, or lists the ids the tool accepts, proves nothing.
