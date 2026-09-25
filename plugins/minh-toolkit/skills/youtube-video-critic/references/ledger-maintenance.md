# Ledger maintenance and Status updates

Detail for Step 5 in `SKILL.md`. The three environment cases and the row format are in `ledger-template.md`.

This step is independent of Step 4 — the ledger row format doesn't include takeaways, so there is no data reason to withhold a ledger update over anything happening in Step 4. Run it regardless of how Step 4 went; never skip it as a side effect of Step 4 trouble, and never let it substitute for Step 4 either. This step is secondary to the evaluation itself — if something has to give under time or token pressure, drop this step, never Steps 1-4.

Where the ledger actually lives depends on the environment — see [references/ledger-template.md](references/ledger-template.md) for the three cases (Claude Code: a real local file; Desktop/Projects/chat: an Artifact or exported text, with Project Knowledge staying canonical; neither available: conversation memory only). Read it before touching the ledger. Critically: never assume a file write is visible to the human just because a file-write tool is present. Follow the template's case for the current environment exactly rather than defaulting to "write a file."

**When to touch the ledger at all (opt-in, checked once per conversation):**

1. On the first evaluation in a conversation, do not create or ask about a ledger unprompted. Only act on it if an existing ledger is found (per the template's Case A/B check), the user has explicitly asked, at some point, to track, list, or rank videos across sessions, or Step 1 identified this as a follow-up on a previously-evaluated video and a ledger already exists.
2. If neither is true, skip this step entirely and don't mention it.
3. Once a ledger exists (just created, tracked in memory per Case C, or found), maintain it automatically on every subsequent evaluation in this and future sessions, without asking again — except the one-time Case B statement about saving the working copy back to Project Knowledge, which happens once on first touch, not per evaluation.

**Updating Status on an existing row (separate trigger, not part of evaluation):**

The ledger has a `Status` column (between `Score` and `Reason`) tracking what the user actually did with a video after it was evaluated — see `references/ledger-template.md` row-format notes for the exact three allowed values (`Watched`, `Applied (not watched)`, or blank for "Not watched"). This is independent of the opt-in ledger-maintenance flow above and is **never** touched automatically as part of running an evaluation — a new or freshly-appended row always leaves `Status` blank.

Only update the `Status` cell of an existing row when the user explicitly volunteers one of these, unprompted:

1. They say they watched a specific video already in the ledger (e.g. they picked one from the queue to watch) → find that row (match by link or title) and set `Status` to `Watched`.
2. They say they applied an insight from a specific video into SiteGuard or minh-toolkit without having watched it → find that row and set `Status` to `Applied (not watched)`.
3. If a row's `Status` already reflects one of these and the user then reports the other action for the same video, combine into `Watched (applied)` rather than inventing a new value.
4. A video can legitimately have more than one row (Step 1 allows a fresh full re-evaluation of a video already in the ledger, which appends a new row rather than replacing the old one). If the link or title matches more than one row, update only the most recent (latest-dated) row by default — never all matching rows, and never guess which one the user means when it's genuinely ambiguous.

Never proactively ask "did you watch this?" or similar after an evaluation — this stays purely reactive to what the user reports on their own.
