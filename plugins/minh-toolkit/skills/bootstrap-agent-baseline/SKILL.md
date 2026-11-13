---
name: bootstrap-agent-baseline
description: >
  Opt-in only. Do not trigger from general talk about prompts, CLAUDE.md or
  AGENTS.md. Use only when the user asks for it by name, or says they want to
  set up or change their personal baseline instructions for agents on this
  machine, for example "add a rule to my global CLAUDE.md" or "update my agent
  baseline". Writes one managed block of the user's own cross-project rules
  (plain writing, verify with real output, project rules win, and a few
  suggested ones) into the user-level instruction file of each harness the user
  names, so every machine and harness behaves the same. A re-run updates the
  block in place. Not for editing one project's CLAUDE.md or AGENTS.md, not for
  per-project process (bootstrap-way-of-working), and not for sub-agent roles
  (bootstrap-eagd-pattern).
---

# Bootstrap Agent Baseline

Put the same short rules into the user-level instruction file of every agent
the user runs, on every machine. One block, same text, safe to re-run.

This is user-level. It is not a project file. Project rules always win.

## Step 1: Pick the harnesses

Ask which agent harnesses the user wants to set up on this machine. Use
your ask-the-user tool, or ask in plain text. Do not assume it is only the one
you run in.

For each one, find its user-level instruction file in
`references/harnesses.md`. Check the path for the version in use. Do not guess a
path. If the harness has no user-level file (a settings screen only), print the
block in Step 4 and tell the user where to paste it.

Never write the block into a project file as a fallback.

## Step 2: Pick the rules

Read `references/baseline.md`. It has the rule text and a stable ID for each rule.

- **Always in the block:** `plain`, `verify`, `project-wins`.
- **Optional:** `ask-first`, `scope`, `confidence`, `private`, `files`. Pick at most four.

Suggest the optional rules. Check your memory or notes first, if your
harness has them. Label each suggestion as "seen in your notes" or "common
default". Do not call a default a memory.

If a block already exists, read the rule IDs in its begin marker. Offer the same
picks. If the user says "same as my other machine", ask for that marker line.

Keep the block small. About 25 lines and 220 words or less. The three always-on rules alone are about 115 words, so the optional rules must fit in the rest.

## Step 3: Build the block

Copy the text for each chosen rule from `references/baseline.md`. Do not
reword it. The exact words are what make the rules work.

Use this frame. List every chosen rule ID in the begin marker.

```
<!-- agent-baseline v1 rules=plain,verify,project-wins,ask-first -->
...rule text...
<!-- /agent-baseline -->
```

## Step 4: Show, then write

For each target file:

1. If the file has no block, show the text that will be added at the end.
2. If the file has a block, show the old and new block side by side. Replace
   only the text between the markers.
3. If a begin marker has no end marker, or the reverse, stop and ask. Do not repair it.
4. Never change text outside the markers.
5. Write only after the user says yes. Approval covers this file only.

If the file does not exist, say so. Create it only after the user agrees.

## Step 5: Report

Say, in a few lines:

- Which file you wrote, or which block you printed for the user to paste.
- The begin marker line, so the user can repeat the same picks on the next machine.
- Which rules you left out, and why.
- Which harnesses are still not done.

If the user keeps their dotfiles in a repo, offer to print the block only,
so they can commit it there.

## Notes

- The plain-writing rule is about replies to the user. If it clashes with the
  `sound-human` skill, plain words win.
- This skill uses its own plain-writing rule. Keep this file that way.
