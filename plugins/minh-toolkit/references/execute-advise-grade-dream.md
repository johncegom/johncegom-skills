# Execute / Advise / Grade / Dream

A reference architecture for splitting a skill's work across four distinct roles instead of one role doing everything. Not every skill needs all four — read "Not every skill needs all four roles" below before adopting this into anything.

## Why this exists

A role that just wrote a draft is bad at grading it, because it still holds the reasoning that produced the draft — a claim can read as clearly stated while writing it and only turn out vague once that reasoning is out of view. This is the exact problem `youtube-video-critic`'s Step 4.5 grading pass was built to fix: the skill used to run its reverse-attitude check and hype-language audit inline, in the same pass that wrote the verdict, and moved them into a separate pass over the finished draft alone. That fix generalizes. This file names the general pattern so it can be applied deliberately elsewhere, instead of re-discovered skill by skill.

## The four roles

**Execute** — does the actual task. The default "doer." Most of a skill's real work happens here: writing the code, drafting the prose, running the analysis, producing the output the user asked for.

**Advise** — a synchronous, mid-run consultation Execute calls out to when it hits a decision it shouldn't resolve alone: an ambiguous judgment call, a need for external verification, a borderline case worth a second opinion. Execute calls Advise and waits for the answer before continuing. This is not a parallel process running alongside Execute — it's a blocking call inside one run, and Execute doesn't proceed until it has the answer.

**Grade** — runs only after Execute finishes one complete run. Scores the finished output against a rubric, given *only* the output and the rubric — not the reasoning, transcript excerpts, or working notes that produced it. This is the same "fresh eyes" principle behind `youtube-video-critic`'s Step 4.5: grading with only the output in view catches vague or inconsistent wording that a writer, still holding the reasoning behind it, tends to read as clear. A failed item should get a targeted fix, not necessarily a full restart of Execute. Fail loops back to Execute; pass moves on to Dream.

**Dream** — runs only after a Grade pass. Reads back the full run history — not just the final output, but the reasoning, any Advise consultations along the way, and the Grade verdict — and distills durable learnings into persistent memory: a ledger, a profile file, a decision log, anything future runs will read. Low-frequency (only on a pass), reflective, and typically asynchronous relative to the user-facing interaction — nothing the user is waiting on.

## Role separation, not parallel execution

The default sequencing: these four roles run one at a time, never in parallel, and Grade/Dream fire at specific gates rather than being always-on:

```
Execute ──(zero or more blocking calls)──> Advise
   │                                          │
   │  <───────── waits for answer ────────────┘
   ▼
Execute finishes one full run
   ▼
Grade (output + rubric only, no reasoning carried over)
   │
   ├── fail ──> back to Execute (targeted fix)
   │
   └── pass ──> Dream (reads back full run history, writes learnings to memory)
```

This is the default flow, not an absolute law — a skill can deliberately run Dream independent of Grade's outcome, same as it can skip roles it doesn't need (see "Not every skill needs all four roles" below). The bar for deviating is that it's a stated, deliberate choice with a reason, not an accidental gap. `youtube-video-critic`'s Step 5 ledger is exactly this kind of deliberate deviation — see its entry below.

Two things worth being explicit about, because they're easy to blur:

- **Advise and Grade are opposite information regimes.** Advise is consulted mid-task, so it needs full relevant context to answer the question in front of it. Grade is deliberately starved of that same context — fresh eyes is the entire point. Don't design a Grade pass that also gets the reasoning "for context"; that quietly turns it back into the same role re-checking its own work.
- **Grade and Dream are not the same gate.** Grade checks one run's output. Dream distills learnings *across* runs (or across one run's full history) into something durable. A skill can have Grade without Dream — most will, since persistent memory is a bigger commitment than a rubric check.

## Default models

Each role has a default model. All four are changeable per skill, and per role within a skill — nothing here is hardcoded.

| Role | Default model | Why |
|---|---|---|
| Execute | Sonnet | Main workhorse — needs strong general capability for the actual task. |
| Advise | Opus | Handles the hardest single-shot judgment calls Execute couldn't resolve alone — worth the strongest available reasoning, since it's a blocking consultation, not routine work. |
| Grade | Haiku | Most rubrics are checklist-shaped — mechanical, fast, cheap pass/fail against explicit criteria. |
| Dream | Opus | Runs rarely (only after a Grade pass), synthesizes across a full run history, and its output (memory) compounds into every future run — worth a stronger model since mistakes here propagate. |

**On Grade's default specifically: Haiku is the default, not a rule.** If a skill's rubric is complex enough — mixing mechanical checks with real judgment calls, not just counting or matching — consider switching that skill's Grade to Sonnet instead. Don't hardcode Haiku for every case just because it's the default.

Concrete contrast from the two skills that already have a Grade-shaped step:

- `youtube-video-critic`'s Step 4.5 rubric has 9 items, and several are judgment calls, not mechanical checks: whether the title-gap line states a real gap or an invented one, whether the verdict paragraph uses hype language, whether the verdict would flip under a reversed user attitude, whether a takeaway actually states a mechanism or just a conclusion. This is a Sonnet-Grade candidate.
- `sound-human`'s Quality Checklist (17 items) leans more mechanical — banned-word counts, structural pattern counts (parallel negation, tricolons, em-dash frequency), paragraph-ending ratios. Most of it is closer to a genuine Haiku fit, though a couple of items ("reads like a real person talking, not a polished essay") are still judgment calls worth watching if Grade were ever formalized here.

## Not every skill needs all four roles

This is a menu, not a mandate. Use only the roles a skill actually needs — forcing all four onto a skill that doesn't need them adds ceremony without benefit. The four skills read while writing this file span the range:

**`youtube-video-critic`** already has Grade and Dream built, just not labeled this way:
- **Execute** — Steps 1-4 (gather, analyze, verdict, takeaways).
- **Grade** — Step 4.5, added this session: a 9-item pass/fail rubric run on the finished draft alone.
- **Dream** — Step 5, the persistent ledger: reads back past evaluations, tracks watched/applied status, informs future personal-relevance judgments.
- **Advise** — not currently present, but a plausible fit: the persona's "verify checkable claims" rule (searching to confirm a specific factual claim before treating it as established) or a borderline verdict call are both mid-run decisions Execute could hand off and wait on.
- **A stated deviation, not a gap:** the skill's Step 5 runs independent of Step 4.5's pass/fail — deliberately, per the skill's own text on why. That's a legitimate deviation from the default Dream-only-after-Grade-pass flow, of exactly the kind this file's "Role separation" section allows: a considered choice with a reason, not an accidental gap. Noted here as the concrete example of what a justified deviation looks like; not something to reconcile by editing the skill in this pass.

**`sound-human`** has Execute (the rewrite itself) and a Grade-shaped step (the Quality Checklist, run silently before returning) — see the Haiku-vs-Sonnet discussion above for what Grade would look like here. Advise and Dream aren't present today. If added: Advise could resolve voice-choice ambiguity mid-rewrite (which of several plausible fixes best matches the selected voice); Dream could persist a learned voice profile across sessions instead of rebuilding "mirror" voice from scratch each time.

**`goal-to-code-unblock`** deliberately has *no* Execute role for the artifact itself — the user is the executor by design; the skill's entire premise is that the agent must not author the implementation. The agent's job is almost entirely **Advise**: checkpoint review, and naming a candidate trap as a question rather than a diagnosis. The closest thing to a Grade moment is the final guardrail step (empty/nil handling, fail-loud vs. fail-silent, cleanup, readability), but it stays advisory feedback rather than a formal rubric gate. No Dream — no persistent cross-session memory in this skill. This is the cleanest example of "only use what's needed": one role, deployed well, is enough here.

**`learn-technology-by-building`** follows the same no-Execute pattern as `goal-to-code-unblock` (the learner writes the code), but has a genuine Dream role where the other skill doesn't:
- **Advise** — concept explanations at the point of use, checkpoint guidance, resource recommendations.
- **Grade** — the trap-check before confirming a checkpoint or stage complete: a rubric checking for achievement, location, progression, and misleading patterns.
- **Dream** — the continuity ledger: completed checkpoints, concepts introduced, and reusable design/architecture decisions are logged, then read back and re-verified ("ask the learner to recall the decision... before reusing it") when they become relevant again in a later session. This is Dream doing exactly what it's meant to: turning one run's history into something a future run actually draws on.

## Scope

This file is a reference for future adoption. It does not change how `sound-human`, `youtube-video-critic`, `goal-to-code-unblock`, or `learn-technology-by-building` currently behave — none of their `SKILL.md` files were edited to write this. Adopting any part of this pattern into a specific skill is a separate, deliberate pass.
