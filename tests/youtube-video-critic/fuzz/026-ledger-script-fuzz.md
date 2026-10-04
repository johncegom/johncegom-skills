---
id: 026
skill: youtube-video-critic
target: scripts/ledger.py (check, add, status) under hostile and random input
category: fuzz
status: bug-found-fixed
last_verified: 2026-10-04
---

## Scenario
`scripts/ledger.py` replaces the agent reading and hand-editing the ledger, so a bad row or a missed
duplicate now goes unnoticed instead of being caught by a reader. Its inputs are free text from a
video's title and channel, user-supplied URLs, and a ledger file that earlier runs, other tools or the
user may have edited. `tests/youtube-video-critic/test_ledger.py` fuzzes all three with a fixed seed.

## Input
Seeded random data, no live API call:
- URLs: 12 forms of the same random 11-character ID (`watch?v=` with extra params, `youtu.be`,
  `shorts`, `embed`, `live`, `youtube-nocookie`, bare ID, padded with whitespace), plus random Unicode
  junk up to 200 characters and 500 KB strings.
- Row text built from pipes, backslashes, `\|`, newlines, tabs, markdown characters, CJK, emoji, a
  right-to-left override and NUL.
- Malformed dates, lengths, verdicts and scores; every verdict against every score 0-11.
- Garbage ledgers (random table-like lines, wrong cell counts, CRLF, no trailing newline, invalid UTF-8).
- Random add/status/check sequences over six IDs, compared against a plain-Python model.

## Expected behavior
- Every URL form of one video resolves to the same ID; arbitrary text never crashes and only ever
  yields an 11-character ID or nothing.
- Whatever is added, the ledger stays parseable: every row has exactly 9 cells, one line per row,
  `Status` blank, and `check` finds the video afterwards.
- Malformed input exits 2 without writing. A garbage or non-UTF-8 ledger never tracebacks, and an
  invalid-UTF-8 ledger is never rewritten.
- `status` changes only the latest row for that video and no other line, and the add/status/check
  results always match the model.

## Result
Defects fixed in `ledger.py`; the suite keeps them from coming back. The first and last were spotted by
reading the code before the suite first ran, the full-width date was caught by the suite.
- Backslash before a pipe: `a\|b` was escaped to `a\\|b`, which a naive splitter reads as an escaped
  pipe, adding a column and corrupting that row and every one after it. Backslashes before a pipe are now
  doubled and cells are split with an even/odd backslash rule.
- `\d` matched non-ASCII digits, so a full-width date such as `２０２６-10-04` passed validation. The
  patterns are now ASCII-only.
- A ledger that is not valid UTF-8 raised a traceback; it is now refused with exit 2, unmodified.
Passes on seeds 1, 2, 3 and the default at 600 rounds. Not covered: a ledger edited by hand into a state
the header and separator rows no longer describe (the script ignores such lines rather than repairing them).
