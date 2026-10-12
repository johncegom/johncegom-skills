"""Tests for lecture-to-concept-cards' scripts/grab_frames.py.

Run from the repo root (standard library only, no install step):

    python -m unittest discover -s tests/lecture-to-concept-cards -p "test_*.py" -v

The ffmpeg call is replaced by a fake runner, so these tests need no ffmpeg
and no video. One integration test uses a real ffmpeg and is skipped when
ffmpeg is not on PATH.
"""
import importlib.util
import shutil
import subprocess
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from io import StringIO
from pathlib import Path
from types import SimpleNamespace

REPO = Path(__file__).resolve().parents[2]
SCRIPT = REPO / "plugins/minh-toolkit/skills/lecture-to-concept-cards/scripts/grab_frames.py"

spec = importlib.util.spec_from_file_location("grab_frames", SCRIPT)
gf = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gf)

PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


def fake_runner(calls, returncode=0, write=True, stderr=""):
    """A stand-in for subprocess.run. Records each command; writes the output
    file (the last argument) when `write` is true, as ffmpeg would."""

    def run(cmd, **kwargs):
        calls.append(cmd)
        if write and returncode == 0:
            Path(cmd[-1]).write_bytes(PNG_SIGNATURE + b"fake")
        return SimpleNamespace(returncode=returncode, stderr=stderr)

    return run


class ParseTimestamp(unittest.TestCase):
    def test_plain_seconds(self):
        self.assertEqual(gf.parse_timestamp("750"), 750.0)

    def test_minutes_and_seconds(self):
        self.assertEqual(gf.parse_timestamp("12:30"), 750.0)

    def test_hours_minutes_seconds(self):
        self.assertEqual(gf.parse_timestamp("1:12:30"), 4350.0)
        self.assertEqual(gf.parse_timestamp("00:12:30"), 750.0)

    def test_fraction_with_dot_or_srt_comma(self):
        self.assertEqual(gf.parse_timestamp("00:12:30.5"), 750.5)
        self.assertEqual(gf.parse_timestamp("00:12:30,500"), 750.5)

    def test_surrounding_whitespace_is_ignored(self):
        self.assertEqual(gf.parse_timestamp("  12:30 "), 750.0)

    def test_rejects_bad_input(self):
        for bad in ["", "abc", "-5", "1:2:3:4", "12:75", "1:61:00", "12:", ":30", "1.2.3", "nan", "inf"]:
            with self.subTest(bad=bad):
                with self.assertRaises(ValueError):
                    gf.parse_timestamp(bad)


class FrameName(unittest.TestCase):
    def test_zero_padded_hh_mm_ss(self):
        self.assertEqual(gf.frame_name(750), "00-12-30.png")

    def test_over_an_hour_does_not_collide_with_under(self):
        self.assertNotEqual(gf.frame_name(750), gf.frame_name(4350))
        self.assertEqual(gf.frame_name(4350), "01-12-30.png")

    def test_fraction_is_floored(self):
        self.assertEqual(gf.frame_name(750.9), "00-12-30.png")

    def test_suffix(self):
        self.assertEqual(gf.frame_name(750, "a"), "00-12-30-a.png")


class PlanFrames(unittest.TestCase):
    def test_single_frame_has_no_suffix(self):
        plan = gf.plan_frames([750.0], burst=1, step=3)
        self.assertEqual([(f.name, f.seconds) for f in plan], [("00-12-30.png", 750.0)])

    def test_burst_names_and_times(self):
        plan = gf.plan_frames([750.0], burst=3, step=3)
        self.assertEqual(
            [(f.name, f.seconds) for f in plan],
            [("00-12-30-a.png", 750.0), ("00-12-30-b.png", 753.0), ("00-12-30-c.png", 756.0)],
        )

    def test_burst_is_named_from_the_requested_moment_not_the_offset(self):
        names = [f.name for f in gf.plan_frames([750.0, 760.0], burst=2, step=3)]
        self.assertEqual(
            names,
            ["00-12-30-a.png", "00-12-30-b.png", "00-12-40-a.png", "00-12-40-b.png"],
        )

    def test_same_second_requested_twice_is_planned_once(self):
        plan = gf.plan_frames([750.0, 750.4], burst=1, step=3)
        self.assertEqual(len(plan), 1)

    def test_order_of_first_appearance_is_kept(self):
        plan = gf.plan_frames([900.0, 750.0], burst=1, step=3)
        self.assertEqual([f.name for f in plan], ["00-15-00.png", "00-12-30.png"])

    def test_rejects_bad_burst_and_step(self):
        for burst in (0, -1, 27):
            with self.subTest(burst=burst):
                with self.assertRaises(ValueError):
                    gf.plan_frames([1.0], burst=burst, step=3)
        with self.assertRaises(ValueError):
            gf.plan_frames([1.0], burst=2, step=0)


class BuildCommand(unittest.TestCase):
    def setUp(self):
        self.cmd = gf.build_command("ffmpeg", "lesson 05.mp4", 750.0, "images/00-12-30.png")

    def test_seek_comes_before_input(self):
        self.assertLess(self.cmd.index("-ss"), self.cmd.index("-i"))

    def test_one_frame_and_output_last(self):
        i = self.cmd.index("-frames:v")
        self.assertEqual(self.cmd[i + 1], "1")
        self.assertEqual(self.cmd[-1], "images/00-12-30.png")

    def test_png_gets_no_jpeg_quality_flag(self):
        self.assertNotIn("-q:v", self.cmd)

    def test_never_waits_for_a_prompt(self):
        self.assertIn("-nostdin", self.cmd)
        self.assertIn("-y", self.cmd)

    def test_path_with_spaces_stays_one_argument(self):
        self.assertIn("lesson 05.mp4", self.cmd)


class Grab(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.out = Path(self.tmp.name) / "images"
        self.video = Path(self.tmp.name) / "lesson.mp4"
        self.video.write_bytes(b"not a real video")

    def run_grab(self, plan, run, **kw):
        return gf.grab(str(self.video), plan, self.out, ffmpeg="ffmpeg", run=run, **kw)

    def test_ok_creates_the_file_and_the_folder(self):
        calls = []
        res = self.run_grab(gf.plan_frames([750.0], 1, 3), fake_runner(calls))
        self.assertEqual([r.status for r in res], ["ok"])
        self.assertTrue((self.out / "00-12-30.png").is_file())
        self.assertEqual(len(calls), 1)

    def test_exit_zero_with_no_file_is_a_failure(self):
        # ffmpeg exits 0 and writes nothing when the moment is past the end.
        res = self.run_grab(gf.plan_frames([9999.0], 1, 3), fake_runner([], write=False))
        self.assertEqual(res[0].status, "failed")
        self.assertIn("past the end", res[0].detail)

    def test_nonzero_exit_reports_stderr(self):
        res = self.run_grab(
            gf.plan_frames([750.0], 1, 3), fake_runner([], returncode=1, stderr="Invalid data")
        )
        self.assertEqual(res[0].status, "failed")
        self.assertIn("Invalid data", res[0].detail)

    def test_empty_output_file_is_a_failure_and_is_removed(self):
        def run(cmd, **kwargs):
            Path(cmd[-1]).write_bytes(b"")
            return SimpleNamespace(returncode=0, stderr="")

        res = self.run_grab(gf.plan_frames([750.0], 1, 3), run)
        self.assertEqual(res[0].status, "failed")
        self.assertFalse((self.out / "00-12-30.png").exists())

    def test_existing_frame_is_skipped_not_overwritten(self):
        self.out.mkdir(parents=True)
        target = self.out / "00-12-30.png"
        target.write_bytes(b"user's own capture")
        calls = []
        res = self.run_grab(gf.plan_frames([750.0], 1, 3), fake_runner(calls))
        self.assertEqual(res[0].status, "skipped")
        self.assertEqual(calls, [])
        self.assertEqual(target.read_bytes(), b"user's own capture")

    def test_force_overwrites(self):
        self.out.mkdir(parents=True)
        (self.out / "00-12-30.png").write_bytes(b"old")
        calls = []
        res = self.run_grab(gf.plan_frames([750.0], 1, 3), fake_runner(calls), force=True)
        self.assertEqual(res[0].status, "ok")
        self.assertEqual(len(calls), 1)

    def test_dry_run_runs_nothing_and_creates_nothing(self):
        calls = []
        res = self.run_grab(gf.plan_frames([750.0], 1, 3), fake_runner(calls), dry_run=True)
        self.assertEqual(calls, [])
        self.assertEqual(res[0].status, "planned")
        self.assertFalse(self.out.exists())

    def test_one_failure_does_not_stop_the_rest(self):
        state = {"n": 0}

        def run(cmd, **kwargs):
            state["n"] += 1
            if state["n"] == 1:
                return SimpleNamespace(returncode=1, stderr="boom")
            Path(cmd[-1]).write_bytes(PNG_SIGNATURE)
            return SimpleNamespace(returncode=0, stderr="")

        res = self.run_grab(gf.plan_frames([10.0, 20.0], 1, 3), run)
        self.assertEqual([r.status for r in res], ["failed", "ok"])


class Main(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.dir = Path(self.tmp.name)
        self.video = self.dir / "lesson.mp4"
        self.video.write_bytes(b"x")
        self.out = self.dir / "images"

    def main(self, argv, run=None, which=lambda name: "ffmpeg"):
        out, err = StringIO(), StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            code = gf.main(argv, run=run or fake_runner([]), which=which)
        return code, out.getvalue(), err.getvalue()

    def test_happy_path_exit_0_and_reports_the_file(self):
        code, out, _ = self.main([str(self.video), "12:30", "--out", str(self.out)])
        self.assertEqual(code, 0)
        self.assertIn("00-12-30.png", out)
        self.assertTrue((self.out / "00-12-30.png").is_file())

    def test_output_paths_use_forward_slashes(self):
        _, out, _ = self.main([str(self.video), "12:30", "--out", str(self.out)])
        self.assertNotIn("\\", out)

    def test_missing_video_exit_2(self):
        code, _, err = self.main([str(self.dir / "nope.mp4"), "12:30"])
        self.assertEqual(code, 2)
        self.assertIn("not found", err)

    def test_missing_ffmpeg_exit_2_with_a_way_forward(self):
        code, _, err = self.main([str(self.video), "12:30"], which=lambda name: None)
        self.assertEqual(code, 2)
        self.assertIn("ffmpeg", err)
        self.assertIn("--dry-run", err)

    def test_dry_run_works_without_ffmpeg(self):
        calls = []
        code, out, _ = self.main(
            [str(self.video), "12:30", "--dry-run", "--out", str(self.out)],
            run=fake_runner(calls),
            which=lambda name: None,
        )
        self.assertEqual(code, 0)
        self.assertEqual(calls, [])
        self.assertIn("00-12-30.png", out)

    def test_bad_timestamp_exit_2_and_runs_nothing(self):
        calls = []
        code, _, err = self.main(
            [str(self.video), "12:30", "99:99:99", "--out", str(self.out)], run=fake_runner(calls)
        )
        self.assertEqual(code, 2)
        self.assertIn("99:99:99", err)
        self.assertEqual(calls, [])

    def test_no_timestamps_exit_2(self):
        code, _, err = self.main([str(self.video)])
        self.assertEqual(code, 2)
        self.assertIn("timestamp", err)

    def test_from_file_skips_blank_lines_and_comments(self):
        f = self.dir / "moments.txt"
        f.write_text("# lesson 5\n12:30\n\n  21:40  # the counter-example\n", encoding="utf-8")
        code, out, _ = self.main([str(self.video), "--from-file", str(f), "--out", str(self.out)])
        self.assertEqual(code, 0)
        self.assertIn("00-12-30.png", out)
        self.assertIn("00-21-40.png", out)

    def test_command_line_and_file_timestamps_combine(self):
        f = self.dir / "moments.txt"
        f.write_text("21:40\n", encoding="utf-8")
        code, out, _ = self.main(
            [str(self.video), "12:30", "--from-file", str(f), "--out", str(self.out)]
        )
        self.assertEqual(code, 0)
        self.assertIn("00-12-30.png", out)
        self.assertIn("00-21-40.png", out)

    def test_any_failure_exit_1_and_summary_counts(self):
        code, out, _ = self.main(
            [str(self.video), "12:30", "--out", str(self.out)],
            run=fake_runner([], returncode=1, stderr="boom"),
        )
        self.assertEqual(code, 1)
        self.assertIn("1 failed", out)

    def test_burst_flag(self):
        code, out, _ = self.main(
            [str(self.video), "12:30", "--burst", "2", "--out", str(self.out)]
        )
        self.assertEqual(code, 0)
        self.assertIn("00-12-30-a.png", out)
        self.assertIn("00-12-30-b.png", out)


@unittest.skipUnless(shutil.which("ffmpeg"), "ffmpeg is not installed")
class RealFfmpeg(unittest.TestCase):
    def test_grabs_a_real_png_from_a_generated_video(self):
        with tempfile.TemporaryDirectory() as tmp:
            video = Path(tmp) / "clip.mp4"
            subprocess.run(
                ["ffmpeg", "-nostdin", "-loglevel", "error", "-f", "lavfi",
                 "-i", "testsrc=duration=3:size=320x240:rate=10", "-pix_fmt", "yuv420p", str(video)],
                check=True,
            )
            out = Path(tmp) / "images"
            res = gf.grab(str(video), gf.plan_frames([1.0], 1, 3), out, ffmpeg=shutil.which("ffmpeg"))
            self.assertEqual(res[0].status, "ok")
            self.assertEqual((out / "00-00-01.png").read_bytes()[:8], PNG_SIGNATURE)

    def test_a_moment_past_the_end_is_reported_as_failed(self):
        with tempfile.TemporaryDirectory() as tmp:
            video = Path(tmp) / "clip.mp4"
            subprocess.run(
                ["ffmpeg", "-nostdin", "-loglevel", "error", "-f", "lavfi",
                 "-i", "testsrc=duration=2:size=320x240:rate=10", "-pix_fmt", "yuv420p", str(video)],
                check=True,
            )
            res = gf.grab(
                str(video), gf.plan_frames([60.0], 1, 3), Path(tmp) / "images", ffmpeg=shutil.which("ffmpeg")
            )
            self.assertEqual(res[0].status, "failed")


if __name__ == "__main__":
    unittest.main()
