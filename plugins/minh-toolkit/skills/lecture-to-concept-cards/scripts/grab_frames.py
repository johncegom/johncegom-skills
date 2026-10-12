#!/usr/bin/env python3
"""Grab one PNG frame per approved moment from a lecture video, using ffmpeg.

Standard library only. Needs ffmpeg on PATH for a real run; --dry-run needs
nothing and prints what would be grabbed.

  python scripts/grab_frames.py lesson-05.mp4 12:30 21:40 --out lesson-05/images
  python scripts/grab_frames.py lesson-05.mp4 --from-file moments.txt --burst 3
  python scripts/grab_frames.py lesson-05.mp4 1:12:30 --dry-run

A timestamp is SS, MM:SS or HH:MM:SS, with an optional fraction (a dot, or the
comma .srt files use). A --from-file holds one timestamp per line; blank lines
and anything after a # are ignored.

Each frame is named by its moment, HH-MM-SS.png, so 12:30 and 1:12:30 never
collide. With --burst N the moment gives N frames named HH-MM-SS-a.png,
-b.png, ... taken --step seconds apart, because the picture often appears a
few seconds after the words.

An existing file is never overwritten (it may be the user's own capture)
unless --force is given. Exit codes: 0 every frame is ok or skipped, 1 at
least one frame failed, 2 bad input or ffmpeg missing.
"""
import argparse
import math
import re
import shlex
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

# One lowercase letter per frame in a burst.
MAX_BURST = 26
# Seconds between burst frames. A few seconds covers a chart that is drawn just
# after it is mentioned without reaching the next topic. Override with --step.
DEFAULT_STEP = 3

_DIGITS = re.compile(r"[0-9]+")
_SECONDS = re.compile(r"[0-9]+(?:[.,][0-9]+)?")


def parse_timestamp(text):
    """Return seconds as a float. Raise ValueError on anything unclear."""
    s = text.strip()
    if not s:
        raise ValueError("empty timestamp")
    *head, last = s.split(":")
    if len(head) > 2 or not _SECONDS.fullmatch(last):
        raise ValueError(f"not a timestamp: {text!r}")
    if not all(_DIGITS.fullmatch(h) for h in head):
        raise ValueError(f"not a timestamp: {text!r}")
    seconds = float(last.replace(",", "."))
    if not head:
        return seconds
    # With minutes or hours present, seconds and minutes stay under 60.
    if seconds >= 60 or (len(head) == 2 and int(head[1]) >= 60):
        raise ValueError(f"minutes and seconds must be under 60: {text!r}")
    total, unit = seconds, 60
    for part in reversed(head):
        total += int(part) * unit
        unit *= 60
    return total


def frame_name(seconds, suffix=""):
    total = int(math.floor(seconds))
    hours, rest = divmod(total, 3600)
    minutes, secs = divmod(rest, 60)
    tail = f"-{suffix}" if suffix else ""
    return f"{hours:02d}-{minutes:02d}-{secs:02d}{tail}.png"


@dataclass
class Frame:
    name: str
    seconds: float


@dataclass
class Result:
    name: str
    status: str  # ok, skipped, failed or planned
    detail: str = ""


def plan_frames(timestamps, burst, step):
    """Turn requested moments into frames: a name and the second to seek to.

    A name comes from the requested moment, so a burst's frames sit together.
    A name already planned is dropped, which merges two moments in one second."""
    if not 1 <= burst <= MAX_BURST:
        raise ValueError(f"burst must be between 1 and {MAX_BURST}")
    if burst > 1 and step <= 0:
        raise ValueError("step must be greater than 0")
    plan, seen = [], set()
    for moment in timestamps:
        for i in range(burst):
            suffix = chr(ord("a") + i) if burst > 1 else ""
            name = frame_name(moment, suffix)
            if name in seen:
                continue
            seen.add(name)
            plan.append(Frame(name, moment + i * step))
    return plan


def build_command(ffmpeg, video, seconds, out_path):
    # -ss before -i jumps straight to the moment, fast on a long video.
    # PNG is lossless, so there is no -q:v (it only applies to JPEG).
    # -nostdin and -y stop ffmpeg waiting for a prompt that nobody answers.
    stamp = ("%.3f" % seconds).rstrip("0").rstrip(".")
    return [
        ffmpeg, "-nostdin", "-hide_banner", "-loglevel", "error",
        "-ss", stamp, "-i", str(video), "-frames:v", "1", "-y", str(out_path),
    ]


def _last_line(text):
    lines = [ln.strip() for ln in (text or "").splitlines() if ln.strip()]
    return lines[-1] if lines else "ffmpeg failed with no message"


def grab(video, plan, out_dir, ffmpeg, run=subprocess.run, force=False, dry_run=False):
    """Grab each planned frame. One failure never stops the rest."""
    out_dir = Path(out_dir)
    if not dry_run:
        out_dir.mkdir(parents=True, exist_ok=True)
    results = []
    for frame in plan:
        target = out_dir / frame.name
        if target.exists() and not force:
            results.append(Result(frame.name, "skipped", "already exists, left untouched"))
            continue
        cmd = build_command(ffmpeg, video, frame.seconds, target.as_posix())
        if dry_run:
            results.append(Result(frame.name, "planned", shlex.join(cmd)))
            continue
        try:
            proc = run(cmd, capture_output=True, text=True)
        except OSError as exc:
            results.append(Result(frame.name, "failed", str(exc)))
            continue
        if proc.returncode != 0:
            target.unlink(missing_ok=True)
            results.append(Result(frame.name, "failed", _last_line(proc.stderr)))
        elif not target.is_file() or target.stat().st_size == 0:
            # ffmpeg exits 0 and writes nothing when the moment is past the end.
            target.unlink(missing_ok=True)
            results.append(
                Result(frame.name, "failed", "no frame written; the moment is past the end of the video")
            )
        else:
            results.append(Result(frame.name, "ok"))
    return results


def _read_moments(path):
    lines = Path(path).read_text(encoding="utf-8").splitlines()
    return [ln.split("#", 1)[0].strip() for ln in lines if ln.split("#", 1)[0].strip()]


def main(argv=None, run=subprocess.run, which=shutil.which):
    ap = argparse.ArgumentParser(
        prog="grab_frames.py", description="Grab one PNG frame per moment from a video with ffmpeg."
    )
    ap.add_argument("video", help="path to the video file")
    ap.add_argument("timestamps", nargs="*", help="SS, MM:SS or HH:MM:SS")
    ap.add_argument("--from-file", metavar="PATH", help="a text file with one timestamp per line")
    ap.add_argument("--out", default="images", help="folder for the PNG files (default: images)")
    ap.add_argument("--burst", type=int, default=1, help=f"frames per moment, 1 to {MAX_BURST} (default: 1)")
    ap.add_argument("--step", type=float, default=DEFAULT_STEP,
                    help=f"seconds between burst frames (default: {DEFAULT_STEP})")
    ap.add_argument("--force", action="store_true", help="overwrite frames that already exist")
    ap.add_argument("--dry-run", action="store_true", help="print the plan, run nothing")
    ap.add_argument("--ffmpeg", metavar="PATH", help="ffmpeg executable (default: found on PATH)")
    args = ap.parse_args(argv)

    raw = list(args.timestamps)
    if args.from_file:
        try:
            raw += _read_moments(args.from_file)
        except OSError as exc:
            print(f"cannot read --from-file: {exc}", file=sys.stderr)
            return 2
    if not raw:
        print("no timestamps given: pass some, or use --from-file", file=sys.stderr)
        return 2

    moments, bad = [], []
    for text in raw:
        try:
            moments.append(parse_timestamp(text))
        except ValueError:
            bad.append(text)
    if bad:
        print("not a timestamp (use SS, MM:SS or HH:MM:SS): " + ", ".join(bad), file=sys.stderr)
        return 2

    try:
        plan = plan_frames(moments, args.burst, args.step)
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    if not Path(args.video).is_file():
        print(f"video not found: {args.video}", file=sys.stderr)
        return 2

    ffmpeg = args.ffmpeg or which("ffmpeg")
    if not ffmpeg and not args.dry_run:
        print(
            "ffmpeg not found on PATH. Install it, or pass --ffmpeg PATH. "
            "Use --dry-run to print the planned frames without it.",
            file=sys.stderr,
        )
        return 2

    results = grab(
        args.video, plan, args.out, ffmpeg or "ffmpeg",
        run=run, force=args.force, dry_run=args.dry_run,
    )
    out_dir = Path(args.out)
    for r in results:
        line = f"{r.status:8} {(out_dir / r.name).as_posix()}"
        if r.detail and r.status in ("failed", "skipped"):
            line += f"  ({r.detail})"
        print(line)

    count = {s: sum(1 for r in results if r.status == s) for s in ("ok", "skipped", "failed", "planned")}
    summary = f"{count['ok']} ok, {count['skipped']} skipped, {count['failed']} failed"
    if args.dry_run:
        summary = f"{count['planned']} planned, " + summary
    print(summary)
    return 1 if count["failed"] else 0


if __name__ == "__main__":
    sys.exit(main())
