"""Executable stress and fuzz tests for youtube-video-critic's scripts/ledger.py.

Run from the repo root (standard library only, no install step):

    python -m unittest discover -s tests/youtube-video-critic -p "test_*.py" -v

Fuzz tests are seeded so a failure reproduces; set LEDGER_FUZZ_SEED to try another
seed and LEDGER_FUZZ_ROUNDS to run longer. Written-up cases live in fuzz/ (026, 027).
"""
import importlib.util
import os
import random
import string
import subprocess
import sys
import tempfile
import time
import unittest
from argparse import Namespace
from concurrent.futures import ThreadPoolExecutor
from contextlib import redirect_stderr, redirect_stdout
from io import StringIO
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
SCRIPT = REPO / "plugins/minh-toolkit/skills/youtube-video-critic/scripts/ledger.py"
SEED = int(os.environ.get("LEDGER_FUZZ_SEED", "20261004"))
ROUNDS = int(os.environ.get("LEDGER_FUZZ_ROUNDS", "300"))

spec = importlib.util.spec_from_file_location("ledger", SCRIPT)
ledger = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ledger)

ID_ALPHABET = string.ascii_letters + string.digits + "_-"
# Characters that have a meaning in a markdown table row, plus non-ASCII and whitespace.
NASTY = list("|\\ \t\n\r`*_[]()<>&#~\"'") + ["\\|", "||", "\\\\|", "Tiêu đề", "日本語", "🙂", "‮", "\x00"]
VERDICTS = list(ledger.VERDICT_BANDS)


def rand_id(rng):
    return "".join(rng.choice(ID_ALPHABET) for _ in range(11))


def rand_text(rng, max_len=40):
    pool = NASTY + list(string.ascii_letters)
    # Always end on a letter: whitespace-only text is (correctly) rejected by `add`.
    return "".join(rng.choice(pool) for _ in range(rng.randint(0, max_len))) + rng.choice(string.ascii_letters)


def url_forms(vid):
    return [
        f"https://www.youtube.com/watch?v={vid}",
        f"https://youtube.com/watch?v={vid}&t=42s&list=PLabc",
        f"https://www.youtube.com/watch?feature=share&v={vid}",
        f"https://m.youtube.com/watch?v={vid}",
        f"https://youtu.be/{vid}",
        f"https://youtu.be/{vid}?si=abc",
        f"https://www.youtube.com/shorts/{vid}",
        f"https://www.youtube.com/embed/{vid}",
        f"https://www.youtube.com/live/{vid}?feature=share",
        f"https://www.youtube-nocookie.com/embed/{vid}",
        vid,
        f"  {vid}\n",
    ]


def run(*argv):
    """Run the real CLI in a subprocess; return (exit code, stdout, stderr)."""
    p = subprocess.run(
        [sys.executable, str(SCRIPT), *argv], capture_output=True, text=True, encoding="utf-8"
    )
    return p.returncode, p.stdout, p.stderr


def call(fn, **kw):
    """Run a cmd_* function in-process; return (exit code, stdout)."""
    out, err = StringIO(), StringIO()
    code = 0
    with redirect_stdout(out), redirect_stderr(err):
        try:
            fn(Namespace(**kw))
        except SystemExit as e:
            code = e.code
    return code, out.getvalue()


def add_kwargs(path, vid, rng=None, **over):
    rng = rng or random.Random(0)
    verdict = over.pop("verdict", rng.choice(VERDICTS))
    low, high = ledger.VERDICT_BANDS.get(verdict, (1, 3))  # invalid verdicts are passed on purpose
    kw = dict(
        ledger=path,
        date="2026-10-04",
        title="T",
        link=f"https://youtu.be/{vid}",
        channel="C",
        length="10:00",
        verdict=verdict,
        score=f"{rng.randint(low, high)}/10",
        reason="R",
    )
    kw.update(over)
    return kw


def all_rows(path):
    return ledger.read_rows(path)[1]


class TempLedger(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.path = Path(self._tmp.name) / "ledger.md"


class VideoIdFuzz(unittest.TestCase):
    def test_every_url_form_yields_the_same_id(self):
        rng = random.Random(SEED)
        for _ in range(ROUNDS):
            vid = rand_id(rng)
            for form in url_forms(vid):
                self.assertEqual(ledger.video_id(form), vid, form)

    def test_arbitrary_text_never_crashes_and_only_returns_valid_ids(self):
        rng = random.Random(SEED + 1)
        for _ in range(ROUNDS * 10):
            junk = "".join(chr(rng.randint(0, 0x2FFF)) for _ in range(rng.randint(0, 200)))
            got = ledger.video_id(junk)
            self.assertTrue(got is None or len(got) == 11, junk)

    def test_non_ids_are_rejected(self):
        for text in ["", " ", "nonsense", "short", "https://example.com/watch?v=tooshort",
                     "https://www.youtube.com/", "https://www.youtube.com/watch?v=",
                     "x" * 10, "has space!!"]:
            self.assertIsNone(ledger.video_id(text), text)

    def test_very_long_input_is_fast(self):
        vid = "dQw4w9WgXcQ"
        start = time.monotonic()
        self.assertIsNone(ledger.video_id("v=" * 500_000))
        self.assertEqual(ledger.video_id("a" * 1_000_000 + f" youtu.be/{vid}"), vid)
        self.assertLess(time.monotonic() - start, 5)


class RowRoundTripFuzz(TempLedger):
    def test_hostile_text_survives_a_round_trip(self):
        rng = random.Random(SEED + 2)
        expected = []
        for _ in range(ROUNDS):
            vid = rand_id(rng)
            kw = add_kwargs(self.path, vid, rng, title=rand_text(rng),
                            channel=rand_text(rng), reason=rand_text(rng))
            code, _ = call(ledger.cmd_add, **kw)
            self.assertEqual(code, 0, kw)
            expected.append(vid)
        rows = all_rows(self.path)
        self.assertEqual(len(rows), len(expected))
        for row, vid in zip(rows, expected):
            self.assertEqual(len(row["cells"]), len(ledger.COLUMNS))
            self.assertEqual(ledger.video_id(row["cells"][2]), vid)
            self.assertEqual(row["cells"][7], "", "Status must stay blank on add")
        # Nothing but the header and data rows: no stray lines from embedded newlines.
        lines = self.path.read_text(encoding="utf-8").splitlines()
        self.assertEqual(len(lines), 4 + len(expected))  # 4 header lines
        for vid in expected:
            self.assertTrue(call(ledger.cmd_check, ledger=self.path, video=vid)[1].startswith("DUPLICATE"))

    def test_backslash_before_pipe_does_not_break_columns(self):
        # r"a\|b" once became r"a\\|b", which a naive splitter reads as an escaped pipe.
        for title in ["a\\|b", "a\\\\|b", "trailing\\", "\\", "||", "|", "\\|\\|"]:
            self.path.unlink(missing_ok=True)
            call(ledger.cmd_add, **add_kwargs(self.path, "dQw4w9WgXcQ", title=title, reason=title))
            rows = all_rows(self.path)
            self.assertEqual(len(rows), 1, title)
            self.assertEqual(len(rows[0]["cells"]), 9, title)

    def test_newlines_and_tabs_collapse_to_one_line(self):
        call(ledger.cmd_add, **add_kwargs(self.path, "dQw4w9WgXcQ", title="a\nb\r\nc\td", reason="x\n\ny"))
        row = all_rows(self.path)[0]["cells"]
        self.assertEqual((row[1], row[8]), ("a b c d", "x y"))

    def test_blank_free_text_is_rejected_without_touching_the_file(self):
        for field in ("title", "channel", "reason"):
            code, _ = call(ledger.cmd_add, **add_kwargs(self.path, "dQw4w9WgXcQ", **{field: " \n\t "}))
            self.assertEqual(code, 2, field)
        self.assertFalse(self.path.exists())


class ValidationFuzz(TempLedger):
    def test_malformed_fields_exit_2_and_never_write(self):
        bad = {
            "date": ["", "2026-1-1", "26-10-04", "2026/10/04", "2026-10-04T00:00", "today", "２０２６-10-04"],
            "length": ["", "5", "1:2", "10:60", "1:60:00", "100:00", "1:2:3:4", "-1:00", "ten:00", "1:00 "],
            "verdict": ["", "skim it", "Skim it.", "Worth watching", "Skip it", "Skip it, summary is enough"],
            "score": ["", "5", "5/9", "11/10", "0/10", "5.3/10", "5.25/10", "-5/10", "5 /10", "five/10", "05/10x"],
            "link": ["", "https://example.com", "not a url", "https://youtu.be/short"],
        }
        for field, values in bad.items():
            for value in values:
                code, _ = call(ledger.cmd_add, **add_kwargs(self.path, "dQw4w9WgXcQ", **{field: value}))
                self.assertEqual(code, 2, f"{field}={value!r}")
        self.assertFalse(self.path.exists())

    def test_score_band_is_enforced_for_every_verdict_and_score(self):
        for verdict, (low, high) in ledger.VERDICT_BANDS.items():
            for n in range(0, 12):
                code, _ = call(ledger.cmd_add, **add_kwargs(
                    self.path, "dQw4w9WgXcQ", verdict=verdict, score=f"{n}/10"))
                self.assertEqual(code == 0, low <= n <= high, f"{verdict} {n}/10")

    def test_valid_lengths_are_accepted(self):
        for length in ["0:05", "47:12", "9:59", "59:59", "1:02:03", "12:34:56"]:
            code, _ = call(ledger.cmd_add, **add_kwargs(self.path, "dQw4w9WgXcQ", length=length))
            self.assertEqual(code, 0, length)


class HostileLedgerFuzz(TempLedger):
    def test_garbage_ledgers_never_traceback(self):
        rng = random.Random(SEED + 3)
        header = ledger.HEADER
        for _ in range(ROUNDS):
            lines = []
            for _ in range(rng.randint(0, 30)):
                kind = rng.random()
                if kind < 0.3:
                    lines.append("|" + "|".join(rand_text(rng, 10) for _ in range(rng.randint(0, 12))) + "|")
                elif kind < 0.5:
                    lines.append(rand_text(rng, 80))
                elif kind < 0.6:
                    lines.append("")
                else:
                    cells = ["2026-10-0%d" % rng.randint(1, 9), "t", f"https://youtu.be/{rand_id(rng)}",
                             "c", "1:00", "Skim it", "5/10", "", "r"]
                    lines.append("| " + " | ".join(cells) + " |")
            sep = rng.choice(["\n", "\r\n"])
            self.path.write_bytes((header + sep.join(lines)).encode("utf-8"))
            code, out = call(ledger.cmd_check, ledger=self.path, video=rand_id(rng))
            self.assertEqual(code, 0)
            self.assertTrue(out.startswith(("NEW", "DUPLICATE")), out)

    def test_invalid_utf8_is_refused_not_rewritten(self):
        original = ledger.HEADER.encode() + b"| \xff\xfe broken |\n"
        self.path.write_bytes(original)
        for fn, kw in [
            (ledger.cmd_check, dict(video="dQw4w9WgXcQ")),
            (ledger.cmd_add, add_kwargs(self.path, "dQw4w9WgXcQ")),
            (ledger.cmd_status, dict(video="dQw4w9WgXcQ", value="watched")),
        ]:
            kw["ledger"] = self.path
            self.assertEqual(call(fn, **kw)[0], 2, fn.__name__)
        self.assertEqual(self.path.read_bytes(), original)

    def test_crlf_ledger_still_matches_and_status_edits_one_row(self):
        vid = "dQw4w9WgXcQ"
        call(ledger.cmd_add, **add_kwargs(self.path, vid))
        self.path.write_bytes(self.path.read_bytes().replace(b"\n", b"\r\n"))
        self.assertTrue(call(ledger.cmd_check, ledger=self.path, video=vid)[1].startswith("DUPLICATE"))
        self.assertEqual(call(ledger.cmd_status, ledger=self.path, video=vid, value="watched")[0], 0)
        self.assertEqual(all_rows(self.path)[0]["cells"][7], "Watched")

    def test_missing_trailing_newline_is_repaired_on_add(self):
        call(ledger.cmd_add, **add_kwargs(self.path, "dQw4w9WgXcQ"))
        self.path.write_text(self.path.read_text(encoding="utf-8").rstrip("\n"), encoding="utf-8")
        call(ledger.cmd_add, **add_kwargs(self.path, "aaaaaaaaaaa"))
        self.assertEqual(len(all_rows(self.path)), 2)


class ModelBasedFuzz(TempLedger):
    """Random add/status/check sequences compared against a plain-Python model."""

    def test_random_operation_sequences_match_the_model(self):
        rng = random.Random(SEED + 4)
        ids = [rand_id(rng) for _ in range(6)]  # few IDs, so repeats and re-evaluations are common
        model = []  # rows in file order: dicts with id, date, status
        for step in range(ROUNDS):
            vid = rng.choice(ids)
            form = rng.choice(url_forms(vid))
            op = rng.choice(["add", "add", "status", "check"])
            if op == "add":
                date = f"2026-10-{rng.randint(1, 28):02d}"
                kw = add_kwargs(self.path, vid, rng, date=date, link=f"https://youtu.be/{vid}")
                self.assertEqual(call(ledger.cmd_add, **kw)[0], 0)
                model.append({"id": vid, "date": date, "status": ""})
            elif op == "status":
                value = rng.choice(["watched", "applied"])
                code, _ = call(ledger.cmd_status, ledger=self.path, video=form, value=value)
                mine = [r for r in model if r["id"] == vid]
                if not mine:
                    self.assertEqual(code, 2)
                    continue
                self.assertEqual(code, 0)
                # Latest by date; ties go to the later row in the file.
                target = max(enumerate(mine), key=lambda p: (p[1]["date"], p[0]))[1]
                new = ledger.STATUS_VALUES[value]
                if target["status"] and target["status"] != new:
                    new = "Watched (applied)"
                target["status"] = new
            else:
                code, out = call(ledger.cmd_check, ledger=self.path, video=form)
                n = sum(r["id"] == vid for r in model)
                self.assertEqual(code, 0)
                if n:
                    self.assertTrue(out.startswith(f"DUPLICATE {vid} ({n} row(s)"), out)
                else:
                    self.assertTrue(out.startswith(f"NEW {vid}"), out)
            if model:
                rows = all_rows(self.path)
                self.assertEqual([(ledger.video_id(r["cells"][2]), r["cells"][7]) for r in rows],
                                 [(m["id"], m["status"]) for m in model], f"step {step}")

    def test_status_leaves_every_other_line_byte_identical(self):
        rng = random.Random(SEED + 5)
        for i in range(20):
            call(ledger.cmd_add, **add_kwargs(self.path, rand_id(rng), rng, title=rand_text(rng)))
        vid = ledger.video_id(all_rows(self.path)[7]["cells"][2])
        before = self.path.read_text(encoding="utf-8").splitlines()
        call(ledger.cmd_status, ledger=self.path, video=vid, value="applied")
        after = self.path.read_text(encoding="utf-8").splitlines()
        self.assertEqual(len(before), len(after))
        self.assertEqual([i for i, (a, b) in enumerate(zip(before, after)) if a != b],
                         [all_rows(self.path)[7]["line"]])


class Stress(TempLedger):
    def test_four_hundred_rows_stay_correct_and_fast(self):
        rng = random.Random(SEED + 6)
        n, start = 400, time.monotonic()
        ids = [rand_id(rng) for _ in range(n)]
        for vid in ids:
            self.assertEqual(call(ledger.cmd_add, **add_kwargs(self.path, vid, rng))[0], 0)
        self.assertEqual(len(all_rows(self.path)), n)
        for vid in rng.sample(ids, 100):
            self.assertTrue(call(ledger.cmd_check, ledger=self.path, video=vid)[1].startswith("DUPLICATE"))
        self.assertTrue(call(ledger.cmd_check, ledger=self.path, video="zzzzzzzzzzz")[1].startswith("NEW"))
        self.assertLess(time.monotonic() - start, 60, "quadratic blow-up in add/check")

    def test_huge_fields_are_written_intact(self):
        big = "é|" * 200_000
        call(ledger.cmd_add, **add_kwargs(self.path, "dQw4w9WgXcQ", title=big, reason=big))
        row = all_rows(self.path)[0]["cells"]
        self.assertEqual(len(row), 9)
        self.assertEqual(row[1].count(r"\|"), 200_000)

    def test_ledger_with_many_duplicates_of_one_video(self):
        for i in range(200):
            call(ledger.cmd_add, **add_kwargs(self.path, "dQw4w9WgXcQ", date=f"2026-{1 + i % 12:02d}-{1 + i % 28:02d}"))
        out = call(ledger.cmd_check, ledger=self.path, video="dQw4w9WgXcQ")[1]
        self.assertTrue(out.startswith("DUPLICATE dQw4w9WgXcQ (200 row(s)"), out[:60])
        self.assertEqual(call(ledger.cmd_status, ledger=self.path, video="dQw4w9WgXcQ", value="watched")[0], 0)
        self.assertEqual(sum(r["cells"][7] == "Watched" for r in all_rows(self.path)), 1)

    def test_concurrent_adds_to_a_new_ledger_lose_nothing(self):
        # Separate processes, as parallel agents would be. The first writer must not
        # have its rows truncated by a second writer that also saw "no ledger yet".
        workers, per_worker = 8, 15
        ids = [[rand_id(random.Random(w * 1000 + i)) for i in range(per_worker)] for w in range(workers)]

        def worker(w):
            for vid in ids[w]:
                code, _, err = run("--ledger", str(self.path), "add", "--title", "t",
                                   "--link", f"https://youtu.be/{vid}", "--channel", "c",
                                   "--length", "1:00", "--verdict", "Skim it", "--score", "5/10",
                                   "--reason", "r", "--date", "2026-10-04")
                if code != 0:
                    return err
            return None

        with ThreadPoolExecutor(workers) as pool:
            errors = [e for e in pool.map(worker, range(workers)) if e]
        self.assertEqual(errors, [])
        found = sorted(ledger.video_id(r["cells"][2]) for r in all_rows(self.path))
        self.assertEqual(found, sorted(v for group in ids for v in group))
        text = self.path.read_text(encoding="utf-8")
        self.assertEqual(text.count("| Date |"), 1, "header written more than once")
        self.assertEqual([p.name for p in self.path.parent.iterdir()], [self.path.name], "temp or lock file left behind")


class Locking(TempLedger):
    def lock_path(self):
        return self.path.with_name(self.path.name + ".lock")

    def test_stale_lock_from_a_crashed_run_is_taken_over(self):
        self.lock_path().write_text("")
        old = time.time() - ledger.LOCK_STALE_SECONDS - 5
        os.utime(self.lock_path(), (old, old))
        self.assertEqual(call(ledger.cmd_add, **add_kwargs(self.path, "dQw4w9WgXcQ"))[0], 0)
        self.assertFalse(self.lock_path().exists(), "lock must be released")

    def test_live_lock_times_out_with_exit_2_and_leaves_ledger_alone(self):
        self.lock_path().write_text("")
        original = ledger.LOCK_WAIT_SECONDS
        ledger.LOCK_WAIT_SECONDS = 0.2
        self.addCleanup(setattr, ledger, "LOCK_WAIT_SECONDS", original)
        self.assertEqual(call(ledger.cmd_add, **add_kwargs(self.path, "dQw4w9WgXcQ"))[0], 2)
        self.assertFalse(self.path.exists())
        self.assertTrue(self.lock_path().exists(), "someone else's lock must not be deleted")

    def test_lock_is_released_after_a_failed_command(self):
        self.assertEqual(call(ledger.cmd_status, ledger=self.path, video="dQw4w9WgXcQ", value="watched")[0], 2)
        self.assertFalse(self.lock_path().exists())

    def test_concurrent_status_edits_on_different_videos_all_land(self):
        ids = [rand_id(random.Random(i)) for i in range(40)]
        for vid in ids:
            call(ledger.cmd_add, **add_kwargs(self.path, vid))

        def mark(vid):
            return run("--ledger", str(self.path), "status", vid, "watched")[0]

        with ThreadPoolExecutor(8) as pool:
            self.assertEqual(set(pool.map(mark, ids)), {0})
        self.assertEqual([r["cells"][7] for r in all_rows(self.path)], ["Watched"] * len(ids))


class CommandLine(TempLedger):
    def test_cli_end_to_end_and_exit_codes(self):
        led = ["--ledger", str(self.path)]
        self.assertEqual(run(*led, "check", "dQw4w9WgXcQ")[1].split()[0], "NEW")
        code, out, _ = run(*led, "add", "--title", "T", "--link", "https://youtu.be/dQw4w9WgXcQ",
                           "--channel", "C", "--length", "3:33", "--verdict", "Skim it",
                           "--score", "5/10", "--reason", "R")
        self.assertEqual((code, out.split()[0]), (0, "ADDED"))
        self.assertEqual(run(*led, "check", "https://youtube.com/shorts/dQw4w9WgXcQ")[1].split()[0], "DUPLICATE")
        self.assertEqual(run(*led, "status", "dQw4w9WgXcQ", "watched")[0], 0)
        # The option also works after the subcommand.
        self.assertEqual(run("check", "dQw4w9WgXcQ", "--ledger", str(self.path))[0], 0)
        for argv in (["check", "nonsense"], ["status", "aaaaaaaaaaa", "watched"], ["status", "dQw4w9WgXcQ", "bogus"]):
            code, _, err = run(*led, *argv)
            self.assertNotEqual(code, 0, argv)
            self.assertNotIn("Traceback", err, argv)

    def test_non_ascii_output_does_not_crash_the_console_encoding(self):
        call(ledger.cmd_add, **add_kwargs(self.path, "dQw4w9WgXcQ", title="Tiêu đề 日本語 🙂"))
        code, out, err = run("--ledger", str(self.path), "check", "dQw4w9WgXcQ")
        self.assertEqual((code, err), (0, ""))
        self.assertIn("Tiêu đề 日本語 🙂", out)


if __name__ == "__main__":
    unittest.main()
