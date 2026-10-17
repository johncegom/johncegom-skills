---
name: runnable-practice-ladder
description: >
  Runs a graded ladder of small exercises in something a local tool can run
  or check, such as a programming language, SQL, shell, or a config format
  with a parser or linter, at any level from first contact to subtle traps.
  Each rung asks the user to commit to an answer first, then checks it by
  running it: predict what a snippet does, find and minimally fix a bug in
  agent-style code, or write a short piece against tests. Difficulty adapts
  to hints used, every exercise is verified before it is given, and the
  session ends with an unaided check and an optional progress ledger. Use when the
  user asks for drills, a practice ladder, graded exercises, or practice
  reading and reviewing code, queries or scripts, for example "luyện Go theo
  từng nấc". Do NOT use for one problem the learner is building toward their
  own goal (goal-to-code-unblock), a multi-week roadmap
  (learn-technology-by-building), a quiz (smart-quiz-maker), a tired or
  low-energy session (low-power-learning), or when the user just wants it
  written.
---

# Runnable Practice Ladder

Run short sessions of graded, runnable exercises so a learner builds the judgment to read, check and fix code, and still writes small things unaided. It works at any level: difficulty comes from subtler traps, not from more code.

Much code is now written by an agent, so a learner often needs to judge code they did not write. The read and review rungs below train that. They count as active practice only because the learner **commits first**: a prediction, a line, a cause. Writing stays an equal mode, not a lesser one. Recipes, hint templates and worked examples are in [references/rung-recipes.md](references/rung-recipes.md).

**Core rule: the agent never writes the learner's solution.** It sets the exercise, runs it, checks the answer and gives hints.

## What fits

Use this only where a local tool gives an objective result: an interpreter or compiler, a query engine on sample data, a shell in a scratch directory, a parser, a linter or a dry-run mode. That covers syntax, structure, lint results and behavior you can run locally, for example a schedule expression through a parser that prints the next run times in an explicit timezone, or a workflow file through a local linter. Behavior that depends on a hosted service, a scheduler's environment, secrets or triggers can only be verified there. Treat it as unverified under rule 7: have the learner run it, or drop the rung.

One exercise fits on about one screen. Multi-file changes and design tradeoffs that cannot be run or sourced are outside this skill. Say so, and offer learn-technology-by-building if it is available.

## Verification rule (non-negotiable)

A learner who absorbs a false fact is worse off than one who learned nothing. Nothing the learner is asked to accept, predict against or be graded on may be unverified. That covers exercise text, starter code, hints, reference solutions and explanations.

1. **Run what the learner sees.** Before rung 1, prepare the session's code and run exactly that code privately. Reveal the output only after the learner commits. Quote real output; never state an expected output from memory.
2. **Bug rungs need proof both ways:** the buggy version fails (or is wrong on a hidden case) and the fixed version passes. Starter code and the reference solution are run too.
3. **Nondeterminism proves nothing in one run** (map order, scheduling, races, timing). Avoid it, or run repeatedly or with a race detector and say "can happen", not "will happen".
4. **Explain "why" from a primary source** (language spec, official docs) opened in this session. Name it and quote the supporting sentence. For a causal claim, also run a minimal variant that changes the cause and changes the behavior. If the run and the docs disagree, the run wins for this environment: say so and do not teach the docs claim. If you have no way to open a source, ask the learner to paste the passage, or treat the explanation as unverified (rule 7).
5. **Check the real environment**, not just the tool version: the project config that selects language semantics (for Go, the `go` directive in `go.mod`), the OS, dependency versions.
6. **Convention, idiom and performance are not facts.** Label them as convention with a source, or measure. Avoid "always", "never", "idiomatic", "faster" unless a source says so.
7. **Cannot run it, or cannot reach a source:** label the item unverified. Do not teach it and do not grade on it. Ask the learner to run it now (they become the runtime) or drop the rung. If neither of you can run code, say so and stop.
8. **If the learner challenges a claim, or you find your own mistake:** re-verify, retract plainly, fix the ledger. Apply the same checks to claims the learner supplies.
9. **Never cite from memory.** Do not invent URLs, section numbers or quotations.

## Session shape

- **Open.** If a ledger exists, ask one cold-recall question about an earlier capability, no hints. On a first session, ask one level-probe question (topic and goal; infer the mode below) and treat that probe as rung 0, already done, so the progress map starts with a mark.
- **Core.** Up to about three rungs, the last one being the unaided check, under about 20 minutes. After each rung offer two next rungs and "stop here". Ask before extending past the limit.
- **Close.** One sentence naming a capability the learner now has, with its `verified by` tag. Prepare the next rung and write it to the ledger as the starting point for next time.

**Mode.** Infer it from the request: read/review (mostly predict and review rungs) or write (mostly write-small rungs). Ask about the mode only when it is truly unclear.

## Rung types

1. **Predict.** The learner writes a one-line prediction first, then you run the code. A mismatch is the lesson. Choose snippets where a real language trap has an observable result.
2. **Review and fix.** Show agent-style code with one defect, in one of two forms: a visible failing test, or code that passes the visible tests but is wrong on a hidden case. The learner states the offending line and the cause in one sentence first, then changes as few lines as possible. A correct fix with a wrong cause earns half credit.
3. **Write small.** A spec, tests and an edge case. A function of about ten lines with exactly one new concept.

## Difficulty and hints

- Pass with no hint: go up one level. A level means a subtler trap, not more code.
- Pass with a hint: stay, and set a new exercise of the same kind.
- Fail twice: split the rung into two smaller ones.

Hints come in three tiers: direction, then the tool or concept name, then a one-line sample on different data from the exercise, and only after the learner has failed twice. Never give the full solution. Hints fall under the verification rule too.

**Unaided check.** Every session of two or more rungs ends with a new exercise as its last rung: no hints, no lookup. This result, not the rung reached, is the measure of progress.

## Progress ledger

Keep an optional `practice-ledger.md` in the working directory. The session works without it. It is separate from the project ledger of learn-technology-by-building: that one tracks project state, this one tracks drill capabilities.

```markdown
# Practice ledger - <language/topic>

Practiced in the last 7 days: <n>
Next rung: <prepared exercise, one line>

| Date | Rung | Result | Hints | Capability | Verified by |
|---|---|---|---|---|---|
```

The `Verified by` cell holds the literal command run and, if a source was used, its name and the quoted line. Unverified items never get a row.

## Why the learner comes back

These choices are deliberate and each has a reason.

- **Progress is a real capability**, stated in words ("can predict when a write to a nil map panics"), not points.
- **Autonomy:** the learner picks the next rung, and "stop here" is always offered.
- **A mark on the first day:** the level probe counts as rung 0.
- **Immediate feedback:** every rung has a pass or fail the learner can see at once.
- **A prepared next rung** at the end of each session, so there is an unfinished task to return to.
- **Forgiving rhythm:** show "practiced n of the last 7 days". A gap earns a plain welcome back, with no penalty and no guilt message.
- **Surprise comes from content:** the satisfying moment is a real language trap, not a random reward.
- **Cold recall and the unaided check** keep ease from being mistaken for learning.

**Deliberately not included:** streak-loss penalties and countdown timers (they raise return rate without evidence of more learning), random rewards (they work like gambling), and points, badges and leaderboards (mixed results, and tangible rewards can reduce intrinsic motivation). If one is added later, measure sessions per week and the unaided check before and after, and keep it only if both improve.

## Handoffs

Use another skill only if it appears in your available skills.

- The learner freezes on one line in a write-small rung: hand off to goal-to-code-unblock, then return to the ladder.
- The learner is tired or overloaded: switch to low-power-learning.
- The learner wants a multi-week roadmap: point them to learn-technology-by-building.

If the skill is not available, apply its idea in plain words and keep going.

## One-line summary

**Verify the exercise by running it, let the learner commit before anything runs, adjust difficulty by hints used, end with an unaided check, and bring them back with real capability, not points.**
