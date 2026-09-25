# Storage modes and the log file

Detail for Steps 1b, 4 and 6 of `SKILL.md`. Read the section you need when
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
    Taken, Tool, Requested, Reported, Status
  - `## Binding changes`: Date, Role, Tool, Old, New, Reason
  - `## Grade fallbacks`: Date, Branch, Tool, Reason

  Append each row at the end of its own table. One row per event, a single
  line, no line breaks inside a cell, a literal `|` written as `\|`, `—` for
  a field that doesn't apply. Status is `answered` or
  `SKIPPED reason=<code>`, so skips can be counted per Tool with a search.
- **An existing file the user points at instead** (a decision log, a
  `.jsonl` or `.csv` file). Read it first and follow its format: same file
  type conventions, same field set, new fields at the end. Never put
  markdown table syntax inside a `.jsonl` or `.csv` file, and never
  restructure a file the repo already uses to fit this shape. If its format
  can't hold the fields, say so and ask instead of improvising.
- **A log from an earlier run:** append to it. Don't recreate it, and don't
  rewrite older rows to new columns unless asked (a missing field is `—`).

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
  sessions systematically.
