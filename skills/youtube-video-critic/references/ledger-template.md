# YouTube video ledger template

This is a blank skeleton, not a finished ledger. Which of the three cases below applies depends on the environment — pick one before touching the ledger (see Step 5 in SKILL.md for when that applies at all).

## Case A — Claude Code (real local filesystem)

Check whether `references/youtube-critic-ledger.md` already exists in this skill's directory.

- **If it doesn't exist:** copy the header below, save it as `references/youtube-critic-ledger.md`, then append the first row for this evaluation. That file — not this template — is the running ledger.
- **If it already exists:** read it, then append one row per evaluation instead of recreating it from scratch.

This file is git-ignored, so it won't be committed to the plugin's source repo by normal git operations (`git add -A`, etc.) — but that also means it isn't backed up anywhere. If this plugin is ever reinstalled from a fresh download rather than updated in place, the ledger may not survive. If the user wants to keep it across a fresh reinstall, tell them to back it up themselves.

## Case B — Claude Desktop/Projects, claude.ai chat, or anywhere a filesystem write can't be confirmed as visible to the human

**Do not write to a container path and assume it reaches Project Knowledge.** A file write can succeed in the agent's own execution environment while staying invisible to the human — file-write tools appearing to be present is not evidence the write is visible, so don't infer visibility from tool availability alone.

Project Knowledge stays the canonical, durable ledger. Everything the agent produces here is a *working copy* for the current conversation, not a replacement for it — the agent can read/search Project Knowledge even though it can't write to it.

1. On the first ledger touch in the conversation, check whether a ledger already exists in Project Knowledge (search/read it). Seed the working copy from that existing content if found; start from the blank header below if not.
2. If Artifact creation/update capability is available: create an Artifact containing the full ledger (seeded per step 1) plus the new row. On every later touch in the same conversation, update that same Artifact in place rather than creating a new one.
3. If no Artifact capability is available: output the full updated ledger content (seeded per step 1, plus the new row) as a markdown code block for the user to copy and save themselves.
4. On the first ledger touch only — not repeated per evaluation — say once that this is a working copy for the conversation, and that the user should save/re-upload the updated content back into Project Knowledge (replacing the old version) so the next conversation reads the latest history.

## Case C — No filesystem and no Artifact capability at all

Keep the same rows in conversation memory instead, using this structure as the row format, and tell the user the ledger won't persist past this conversation.

---

## Skeleton to copy into `youtube-critic-ledger.md`

```markdown
# YouTube Video Critic — Ledger

| Date | Title | Link | Channel | Length | Verdict | Score | Status | Reason |
|---|---|---|---|---|---|---|---|---|
```

## Row format notes

- Format `Date` as `YYYY-MM-DD`.
- Include the video's URL in `Link` — the unambiguous identifier, so `Title` can stay short and readable rather than needing to be the full title.
- Keep `Reason` to one short, precise sentence — no multi-clause summaries.
- Escape any literal `|` inside `Title`, `Channel`, or `Reason` as `\|` before writing the row. An unescaped pipe splits that row into extra columns and corrupts every row after it in rendered markdown.
- Format `Length` as `mm:ss` for videos under one hour, or zero-padded `h:mm:ss` at or above one hour (e.g. `47:12` vs `1:02:03`) — stay consistent within the file.
- Format `Verdict` as the exact verdict name from SKILL.md Step 3 (`Worth watching in full`, `Skim it`, or `Skip it, the summary is enough`) — not an abbreviation or paraphrase.
- Format `Score` as `X/10`, matching the value score from SKILL.md Step 3 exactly (e.g. `8/10`, not `8` or `8.5/10` unless the evaluation itself used a half-point).
- `Status` tracks what the user actually did with the video after evaluation, not the skill's judgment of it — leave it **blank** when creating or appending a row during a normal evaluation; it is never filled in as part of Step 5's per-evaluation ledger maintenance. Allowed values, exactly these three, no others:
  - Blank — the default, treated as "Not watched." Don't write the literal string `Not watched` into a cell; just leave it empty.
  - `Watched`
  - `Applied (not watched)`
  - If a video is both watched and an insight from it is applied, write `Watched (applied)` — a suffix on `Watched`, not a fourth value.
  - `Status` is updated later, in place on an existing row, only when the user explicitly reports watching or applying a specific video — see SKILL.md Step 5 for the two triggers. Never backfill existing rows with a value retroactively; blank stays valid indefinitely.
  - A video can appear as more than one row (a later full re-evaluation of an already-ledgered video appends a new row rather than replacing the old one). When a link or title matches multiple rows, update `Status` on only the most recent (latest-dated) row by default — never on every matching row.
