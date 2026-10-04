#!/usr/bin/env python3
"""Duplicate check and row maintenance for the youtube-video-critic ledger.

Standard library only. Works on the Case A ledger (a real local file); see
references/ledger-template.md for the row format this enforces.

  python scripts/ledger.py check <url-or-id>
  python scripts/ledger.py add --title T --link URL --channel C --length 47:12 \
      --verdict "Skim it" --score 5/10 --reason "One short sentence."
  python scripts/ledger.py status <url-or-id> watched|applied

Every command accepts --ledger PATH (default: references/youtube-critic-ledger.md
next to this script's parent folder). Exit codes: 0 ok, 2 bad input.
"""
import argparse
import os
import re
import sys
import time
from contextlib import contextmanager
from datetime import date
from pathlib import Path

DEFAULT_LEDGER = (
    Path(__file__).resolve().parent.parent / "references" / "youtube-critic-ledger.md"
)
HEADER = (
    "# YouTube Video Critic — Ledger\n\n"
    "| Date | Title | Link | Channel | Length | Verdict | Score | Status | Reason |\n"
    "|---|---|---|---|---|---|---|---|---|\n"
)
COLUMNS = ["Date", "Title", "Link", "Channel", "Length", "Verdict", "Score", "Status", "Reason"]
# Score band per verdict, from SKILL.md Step 3.
VERDICT_BANDS = {
    "Worth watching in full": (7, 10),
    "Skim it": (4, 6),
    "Skip it, the summary is enough": (1, 3),
}
STATUS_VALUES = {"watched": "Watched", "applied": "Applied (not watched)"}
# YouTube video IDs are always 11 characters of [A-Za-z0-9_-].
VIDEO_ID = r"[A-Za-z0-9_-]{11}"
# Lock file: concurrent runs (parallel agents) must not interleave. On Windows an
# O_APPEND write is not atomic, so unlocked appends overwrite each other.
# Edits take milliseconds, so 30 s of waiting means something is wrong; a lock older
# than 30 s was left by a crashed run and is taken over.
LOCK_WAIT_SECONDS = 30
LOCK_STALE_SECONDS = 30
# A pipe is a column break unless an odd number of backslashes precedes it.
CELL_BREAK = re.compile(r"(?<!\\)(?:\\\\)*\|")


def video_id(text):
    """Return the 11-character video ID from any YouTube URL form or a bare ID."""
    text = text.strip()
    if re.fullmatch(VIDEO_ID, text):
        return text
    for pattern in (
        rf"[?&]v=({VIDEO_ID})",
        rf"youtu\.be/({VIDEO_ID})",
        rf"youtube(?:-nocookie)?\.com/(?:shorts|embed|live|v)/({VIDEO_ID})",
    ):
        m = re.search(pattern, text)
        if m:
            return m.group(1)
    return None


def die(msg):
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(2)


def require_id(text):
    vid = video_id(text)
    if not vid:
        die(f"cannot find a YouTube video ID in {text!r}")
    return vid


def split_cells(line):
    """Split one table line on unescaped pipes, dropping the outer empty edges."""
    cells, start = [], 0
    for m in CELL_BREAK.finditer(line):
        cells.append(line[start : m.end() - 1])
        start = m.end()
    cells.append(line[start:])
    return cells[1:-1]


def read_text(path):
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        die(f"{path} is not valid UTF-8; fix or move it rather than letting a script rewrite it")


def read_rows(path):
    """Return (lines, rows); each row is {'line': index, 'cells': [...]} for data rows."""
    if not path.exists():
        return [], []
    lines = read_text(path).splitlines()
    rows = []
    for i, line in enumerate(lines):
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in split_cells(line.strip())]
        if len(cells) != len(COLUMNS) or cells[0] in ("Date", "---"):
            continue
        rows.append({"line": i, "cells": cells})
    return lines, rows


def matches(rows, vid):
    return [r for r in rows if video_id(r["cells"][2]) == vid]


def describe(row):
    c = dict(zip(COLUMNS, row["cells"]))
    status = c["Status"] or "not watched"
    return f"{c['Date']} | {c['Title']} | {c['Verdict']} | {c['Score']} | {status}"


def cmd_check(args):
    vid = require_id(args.video)
    _, rows = read_rows(args.ledger)
    found = matches(rows, vid)
    if not found:
        print(f"NEW {vid} (ledger has {len(rows)} rows)")
        return
    print(f"DUPLICATE {vid} ({len(found)} row(s); latest first)")
    for r in sorted(found, key=lambda r: (r["cells"][0], r["line"]), reverse=True):
        print("  " + describe(r))


def clean(value, name):
    value = " ".join(value.split())
    if not value:
        die(f"--{name} must not be empty")
    # Double any backslashes already in front of a pipe so the escape stays a pipe escape.
    return re.sub(r"(\\*)\|", lambda m: m.group(1) * 2 + r"\|", value)


def validate_row(args):
    if not re.fullmatch(r"[0-9]{4}-[0-9]{2}-[0-9]{2}", args.date):
        die("--date must be YYYY-MM-DD")
    if not re.fullmatch(r"[0-9]{1,2}:[0-5][0-9](:[0-5][0-9])?", args.length):
        die("--length must be mm:ss, or h:mm:ss at or above one hour")
    if args.verdict not in VERDICT_BANDS:
        die("--verdict must be exactly one of: " + "; ".join(VERDICT_BANDS))
    m = re.fullmatch(r"([0-9]{1,2}(?:\.5)?)/10", args.score)
    if not m:
        die("--score must look like 8/10 (half-points like 7.5/10 allowed)")
    low, high = VERDICT_BANDS[args.verdict]
    if not low <= float(m.group(1)) <= high:
        die(f"--score {args.score} is outside the {low}-{high} band for {args.verdict!r}")


@contextmanager
def locked(path):
    """Hold an exclusive lock file next to the ledger for the duration of an edit."""
    path.parent.mkdir(parents=True, exist_ok=True)
    lock = path.with_name(path.name + ".lock")
    deadline = time.monotonic() + LOCK_WAIT_SECONDS
    while True:
        try:
            os.close(os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY))
            break
        except (FileExistsError, PermissionError):
            # PermissionError: on Windows, creating a lock that the holder is deleting
            # right now fails this way; it clears on retry.
            try:
                if time.time() - lock.stat().st_mtime > LOCK_STALE_SECONDS:
                    lock.unlink()
            except OSError:
                pass  # released (or being released) meanwhile; the next attempt decides
            if time.monotonic() > deadline:
                die(f"timed out waiting for {lock}; delete it if no other run is active")
            time.sleep(0.01)
    try:
        yield
    finally:
        lock.unlink(missing_ok=True)


def append_row(path, row):
    """Append one row, creating the file with its header first if missing. Caller holds the lock."""
    if not path.exists():
        path.write_text(HEADER + row, encoding="utf-8", newline="\n")
        return
    if not read_text(path).endswith("\n"):
        row = "\n" + row
    with path.open("a", encoding="utf-8", newline="\n") as f:
        f.write(row)


def replace_text(path, text):
    """Rewrite the ledger via a temp file so a crash cannot leave it half-written."""
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(text, encoding="utf-8", newline="\n")
    os.replace(tmp, path)


def cmd_add(args):
    vid = require_id(args.link)
    validate_row(args)
    cells = [
        args.date,
        clean(args.title, "title"),
        args.link.strip(),
        clean(args.channel, "channel"),
        args.length,
        args.verdict,
        args.score,
        "",  # Status is never filled in during an evaluation.
        clean(args.reason, "reason"),
    ]
    row = "| " + " | ".join(cells) + " |\n"
    with locked(args.ledger):
        _, rows = read_rows(args.ledger)
        earlier = len(matches(rows, vid))
        append_row(args.ledger, row)
    note = f" ({earlier} earlier row(s) for this video kept)" if earlier else ""
    print(f"ADDED {vid}{note}")


def cmd_status(args):
    vid = require_id(args.video)
    with locked(args.ledger):
        lines, rows = read_rows(args.ledger)
        found = matches(rows, vid)
        if not found:
            die(f"no row for {vid} in {args.ledger}")
        # Only the most recent row, by date then file position (SKILL.md Step 5).
        target = max(found, key=lambda r: (r["cells"][0], r["line"]))
        current = target["cells"][7]
        new = STATUS_VALUES[args.value]
        if current and current != new:
            new = "Watched (applied)"  # the two actions combine; no fourth value
        target["cells"][7] = new
        lines[target["line"]] = "| " + " | ".join(target["cells"]) + " |"
        replace_text(args.ledger, "\n".join(lines) + "\n")
    print(f"STATUS {vid}: {describe(target)}")


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--ledger", type=Path, default=DEFAULT_LEDGER)
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("check", help="is this video already in the ledger?")
    s.add_argument("video", help="YouTube URL or 11-character ID")
    s.set_defaults(func=cmd_check)

    s = sub.add_parser("add", help="append one evaluation row (Status left blank)")
    s.add_argument("--date", default=date.today().isoformat())
    for name in ("title", "link", "channel", "length", "verdict", "score", "reason"):
        s.add_argument(f"--{name}", required=True)
    s.set_defaults(func=cmd_add)

    s = sub.add_parser("status", help="set Status on the latest row for a video")
    s.add_argument("video")
    s.add_argument("value", choices=sorted(STATUS_VALUES))
    s.set_defaults(func=cmd_status)

    # --ledger is accepted before or after the subcommand.
    argv = sys.argv[1:]
    if "--ledger" in argv:
        i = argv.index("--ledger")
        argv = argv[i : i + 2] + argv[:i] + argv[i + 2 :]
    args = p.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
