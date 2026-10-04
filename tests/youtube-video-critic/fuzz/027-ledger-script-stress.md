---
id: 027
skill: youtube-video-critic
target: scripts/ledger.py under volume and parallel runs
category: stress
status: bug-found-fixed
last_verified: 2026-10-04
---

## Scenario
Several evaluations can run at once (a batch of links, parallel agents), each calling `ledger.py add`
or `status` on the same file, and a long-lived ledger grows. Checks that nothing is lost or
duplicated under parallel writes and that volume stays practical.

## Input
`Stress`, `Locking` in `tests/youtube-video-critic/test_ledger.py`:
- 8 separate processes x 15 `add` calls onto a ledger that does not exist yet.
- 8 parallel `status` calls on different videos in one ledger.
- 400 distinct rows added then 100 looked up; 200 rows for one video; 200 KB title and reason fields.
- A stale lock file (older than 30 s), a live lock, and a failed command that took the lock.

## Expected behavior
- All 120 parallel rows are present, the header appears once, and no temp or lock file is left behind.
- All 40 parallel status edits land; none is lost to a concurrent rewrite.
- 400 rows add and look up within a minute (the cost per call grows with ledger size, so this guards
  against it growing faster than that); 200 KB fields round-trip intact.
- A stale lock is taken over; a live lock makes the script wait, then exit 2 without touching the
  ledger and without deleting the other run's lock; the lock is always released after a failure.

## Result
Bug found: with 8 parallel writers, 20 of 120 rows were missing and every call still reported `ADDED`.
Cause: on Windows an `O_APPEND` write seeks to the end first, so two writers can overwrite each other;
the same read-modify-write race applied to `status`. Fixed with an exclusive lock file around every
`add` and `status` (`locked()` in `ledger.py`), and `status` now rewrites via a temp file and
`os.replace`. A second bug appeared in the lock itself: on Windows, creating a lock another run is
deleting raises `PermissionError`, which crashed a worker; it now retries until the timeout.
Passes on the default seed and seeds 1-3. Not covered: a lock directory on a network share, where
exclusive file creation may not be reliable. The ledger is a local file under the skill, so this is out of scope.
