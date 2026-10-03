# Upgrading an installed directive

Use this when the user asks to update or upgrade the EAGD directive in a repo
(for example "upgrade EAGD here"), instead of Steps 2 and 3. Nothing pushes an
update to a repo, so this runs only when asked. The rules an agent follows stay
inline in the anchor doc; this file is only for the person or agent upgrading.

**Hard rules.** Always show the diff and ask before writing, even when the
update is clean; never apply an update on your own. Never stage or commit
anything. Never create a file inside the repo: put every temporary copy (an
extracted span, a backup) in the OS temp directory and delete it when done.
After you finish, `git status --porcelain` may show only the anchor doc as
modified. Any gate below that says STOP means: write nothing, change nothing,
tell the user what you found and why.

## 1. Plan (read-only, nothing written)

**Gate A, markers.** Run `grep -n '^<!-- eagd-directive:' <anchor>` and write the
two counts as `start=<n> end=<n>`, counting only lines outside fenced code
blocks. Proceed only with `start=1 end=1`, the start before the end and no
`eagd-bindings` marker between them. `start=0 end=0` is a legacy install (see
"Legacy installs"). Anything else, for example `start=1 end=0`, is STOP: do not
repair the file, do not add, move or remove a marker, write nothing, and tell
the user what you found.

**Gate B, wording-only.** Read `directive-changelog.md`. If no version after the
installed one is `behaviour: yes`, STOP: say wording-only updates exist and do
nothing, unless the user's own words asked for wording or for "all" updates.

**Gate C, version.** Read the installed `v=` and the latest `v` from
`directive-template.md`. If the installed `v` is higher, STOP (a stale plugin
cache would otherwise downgrade the repo).

**Gate D, hand edits.** Extract the installed span to a temp file and compare it
with the release it came from, not with the latest:
- same `v` as the latest: compare with `directive-template.md`;
- older `v`: compare with `directive-history/v<N>.md`.

Any difference means someone edited the span by hand. Do not replace it. Show
that difference and ask: discard the local edits, move them into a
`**Local override.**` paragraph first, or cancel. Only an explicit "discard"
continues; "cancel", silence or anything unclear writes nothing. No difference
and same `v`: say "up to date, nothing to do" and stop.

Also resolve symlinks and `@import` lines and search every file the harness
loads for the markers; spans in two files is STOP. Then report, without
changing them: binding rows whose keys the new span does not define (owner
extensions); `ok` rows the new version makes suspect; a log table whose header
lacks a column the new version added (add the column to the header only; never
backfill old rows); which file each named harness really loads (an `AGENTs.md`
on a case-sensitive system may load in none); and that the rationale copy
(`docs/execute-advise-grade-dream.md`) is not part of the span and may be older.

## 2. Show and ask

Print the unified diff of the installed span against the latest template, the
findings above, and what will happen. Ask once for the whole diff. A decline
writes nothing and leaves no files behind.

## 3. Make it recoverable

- Tracked file with no uncommitted changes: git is the backup. Tell the user
  the restore command (`git checkout -- <file>`).
- File with uncommitted changes: ask the user to commit first, or copy the
  original to the OS temp directory (in out-of-tree mode, `<state-dir>`).
- Not under git: copy the original to the OS temp directory. Say the path.

Re-read the file just before writing. If it no longer matches what the plan was
made from, redo the plan. Keep the file's line endings, any BOM and its final
newline: write the span in the host file's line ending.

## 4. Write

One exact-match edit whose old text is the whole installed span (or, for a
legacy install, an insertion right after the bindings end marker). Never rewrite
the whole file. If the edit tool reports no match, STOP.

## 5. Verify mechanically

An agent saying the copy is equal is not a check. Use a comparison command:

- `git diff --no-index --ignore-cr-at-eol <template> <extracted span>`
- or `diff --strip-trailing-cr <template> <extracted span>`
- or PowerShell `Compare-Object (Get-Content <template>) (Get-Content <span>)`

Extract the span from the written file to a temp file first. Then check all of:

1. The span equals `directive-template.md` (no output from the comparison).
2. Diff the pre-write copy (or `git diff`) against the file: every changed hunk
   lies between the two markers, and the `eagd-binding:` rows are identical.
3. Exactly one start and one end marker, balanced, outside any code fence.
4. The line endings, BOM and final newline are as they were.
5. `git status --porcelain` shows only the anchor doc as modified.

If no comparison command exists, STOP and give the user the exact command to
run; do not judge equality by eye. If any check fails, restore from the backup
and report, rather than patching.

## Legacy installs (no span)

Never remove old paragraphs on your own. Insert the span immediately after the
`eagd-bindings:end` marker, plus a line `**EAGD log:** <path>` just above it if
the document has none. The precedence clause in the span supersedes older text
about binding rows, judging the `model:` reply and log statuses, so leftover
sentences do no harm. Then print, as a literal search and not your judgement,
the lines outside the span that match `reported|stale|status=|model:|SKIPPED|no usable row`,
and offer each deletion separately. If the user declines, leave the text. Local
rules the owner wants to keep become a `**Local override.**` paragraph that names
the rows or roles it covers.

## Not covered

Out-of-tree mode with no shell, and an environment with no way to diff, are
untested: STOP and hand the user the commands.
