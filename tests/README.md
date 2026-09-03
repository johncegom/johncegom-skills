# Skill tests

This directory holds test cases for the skills in `skills/*/SKILL.md`. A "skill" here is a
natural-language instruction file, not code — so these aren't unit tests in the usual sense.
They're recorded scenarios: a synthetic input, what part of the skill it stresses, and what
correct behavior looks like. The goal is to make skill edits reviewable and, eventually,
checkable by automation instead of only by re-reading the prose and hoping nothing broke.

## Layout

```
tests/
  <skill-name>/
    fuzz/
      NNN-short-slug.md   — one adversarial/edge-case scenario per file
```

Each skill gets its own directory, named to match its folder under `skills/`. Only
`youtube-video-critic` has cases today; add a sibling directory (`tests/<skill-name>/`) the
first time another skill gets this kind of scrutiny — don't pre-create empty ones.

## Case file format

Each fuzz case is a markdown file with YAML frontmatter:

```markdown
---
id: 001
skill: youtube-video-critic
target: <the section/rule of SKILL.md being stressed>
category: fuzz
status: pass | bug-found-fixed | bug-found-open | reverted
last_verified: YYYY-MM-DD
---

## Scenario
What situation this probes and why it's adversarial.

## Input
The synthetic transcript/context used (short — this is a description, not a full transcript).

## Expected behavior
What the skill *should* do when this input hits it.

## Result
What actually happened when checked, and the outcome (bug found + how it was fixed, or pass).
```

`status` is the field a future automated runner would key off of:
- `pass` — checked, held up, no change needed.
- `bug-found-fixed` — checked, found a real defect, SKILL.md was edited to fix it. The case
  stays in the suite as a regression guard — if a future edit reintroduces the same failure,
  this is the case that should catch it.
- `bug-found-open` — checked, found a real gap, but the fix wasn't applied (usually because it
  changes user-facing behavior and needs confirmation first, or per "When to add a new case"
  below, the finding turned out to be a theoretical misreading rather than a real contradiction).
  The case stays open rather than being deleted or silently fixed, so the gap and its suggested
  fix stay visible for the next person instead of getting re-discovered from scratch.
- `reverted` — the case exposed that a proposed change conflicted with the skill's existing
  design; the change was reverted rather than reconciled. Kept as a record of a rejected
  direction, so it doesn't get proposed again without re-litigating why.

## When to add a new case

Not every gap a careful reader can imagine is worth a case file. Static-tracing (reading SKILL.md
top to bottom looking for ambiguity) is good at catching one specific thing — a real
contradiction, where two stated rules can't both be followed at once (e.g. a hard item-count floor
next to a "skip filler entirely" rule). It has no natural stopping point for the other thing it
finds — a maximally literal reader *could* misparse this — because there's always another
hypothetical misreading to go looking for, and each one turns into a permanent new clause in an
already-long file.

Before writing a new case file, sort what you found:

- **Real contradiction.** Two rules that actually conflict. Write the case, fix SKILL.md, done —
  this is what most of the current suite's `bug-found-fixed` entries are.
- **Reported friction.** Something a real conversation actually tripped over, or a regression
  check on an actual SKILL.md edit. Also worth a case.
- **Theoretical misreading, no contradiction, never observed.** Worth a one-line note if you're
  already in the file, but don't promote it to a full case with a proposed SKILL.md fix unless it
  actually happens. If unsure whether a model would really misfire, the cheap way to find out is
  running it (see below), not patching the prose on the strength of "a reader could get this
  wrong."

Before adding a new clause to fix anything, check whether an existing clause already covers it —
the file should grow when there's a real gap, not by default every time someone reads it closely.

## How these are checked today

Manually — read the case, mentally (or actually, via the youtube-mcp tools with a real video)
run the skill against the input, compare against "Expected behavior." This is what produced the
current case files, via Claude Code sessions doing structured critical-thinking passes over
SKILL.md edits.

**When a human asks to run the test suite (or a subset), delegate the actual run to a fresh
subagent rather than running it inline in the main conversation**, then have it report its
verdict back. Two reasons:
- **Context hygiene.** Running a case means exploring, mentally simulating the skill step by
  step — that exploration is disposable once a verdict is reached. Keeping it out of the main
  agent's context avoids bloating a long-running session with reasoning nobody needs to see
  again after the outcome lands.
- **Fairness.** If the main agent just designed or edited the rule under test, checking it in
  the same context risks grading its own homework — it's primed by the reasoning that produced
  the rule, which biases toward finding it correct. A fresh subagent with no memory of *why* the
  rule was written a certain way gives a more independent read on whether it actually holds.

Use a plain subagent (not a fork — a fork inherits the conversation's design reasoning, which
defeats the fairness goal), briefed with: the target skill's `SKILL.md`, the specific case
file(s) to run, and instructions to report back a verdict (pass / bug-found / reverted) with
reasoning. The main agent applies that verdict (updates `status` and `last_verified`, fixes any
bug found) rather than re-deriving it itself.

## Where this could go (not built yet)

The repo's existing CI (`.github/workflows/validate-plugin.yml`) only runs mechanical checks
(manifest validation, description length) — no LLM calls. Two tiers worth separating if this
grows:

1. **Structural/mechanical checks** (no LLM needed, could be a CI script today): required
   sections present in SKILL.md, frontmatter parses, internal cross-references match actual
   step numbers (e.g. a reference to "Step 2.6" should mean angle 6 actually exists), no
   leftover TODO markers.
2. **Semantic fuzz cases** (need an LLM to judge): the case files in this directory. Running
   these automatically would mean invoking Claude non-interactively (`claude -p`) with the
   skill loaded and the case's `Input` as the scenario, then having a judge (human or a second
   LLM pass) check the transcript against `Expected behavior`. Not wired up yet — these files
   exist so that work has a starting fixture set instead of starting from zero.
