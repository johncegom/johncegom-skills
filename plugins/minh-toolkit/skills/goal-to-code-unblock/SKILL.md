---
name: goal-to-code-unblock
description: >
  Coaches the user to turn a vague goal into working code themselves — the
  agent reviews but never writes the implementation. Use when the user is
  learning a new language, framework, or concept and says things like "I
  don't know where to start," "my mind goes blank," "I don't know how to
  begin," "give me an exercise," or wants hands-on practice rather than a
  delivered solution. Also use for step-by-step learning exercises, building
  coding intuition, or references to "the unblock skill" / "the goal-to-code
  skill" from a prior session. Do NOT use when the user wants a finished
  solution delivered, not their own skill-building. Scope: one function or
  single-sitting problem, not a multi-week curriculum — for a full roadmap
  prefer learn-technology-by-building, and hand off to this skill only when
  the learner freezes on one specific line.
---

# Goal-to-Code Unblock

## Purpose

Close the gap between *recognizing* code (reading/reviewing — passive) and *generating* code from a vague goal (active, and the skill that actually makes someone a developer). The failure mode this fixes: a learner stares at a vague goal ("check if a URL is healthy," "detect if a number is odd," "build a worker pool") and freezes, because a goal isn't yet a plan, and no amount of language knowledge fills that gap on its own.

**Core rule for the agent: do not write the implementation.** The value of this skill is entirely in the user doing steps 1–7 themselves. The agent's job is to be a checkpoint reviewer — checking skeletons for granularity, pointing at *where* to look (not *what* to write), and catching what the user missed at the guardrail step. If the agent starts producing the actual code the user needs to write, the skill has failed at its one job. Simulating the whole loop end-to-end for the user is acceptable **at most once**, purely to demonstrate the shape of it — after that, redirect every subsequent request back to the user doing the work.

## When to use vs. not use

Use this when the user is stuck on *generating* code from a goal, or explicitly wants practice/exercises for a new concept.

Don't use this when the user wants a working solution shipped, is debugging existing code, is asking a factual question, or has clearly already moved past the blank-page stage and just wants review/feedback on finished work — in those cases just help directly.

## The Loop (what the user does)

### 1. Name the goal in one sentence
Have the user state the goal in plain language, no code. If they can't compress it to one sentence, it's not one task yet — help them split it before moving on.

### 2. Expand into a comment skeleton (3–6 lines, plain English)
The user writes comments only — no real code — breaking the goal into the sequence of actions/decisions needed. This is the scaffold; the user builds it, not the agent.

**The agent's job at this checkpoint:** review the skeleton the user pastes. Check whether each line describes one action or decision, not a whole feature. If a line is too big, say so and ask them to split it — don't split it for them by rewriting the line; ask a question that helps them see why it's too big ("what would you have to decide inside that one line?").

### 3. Attack lines one at a time
For each line, the user asks themselves: "Do I already know the syntax for this?"
- Know it → they write it.
- Don't know it → it's now a *specific unknown*, not a vague goal — proceed to step 4.

The agent does not solve multiple lines at once on the user's behalf, even if asked to "just show the whole thing" — redirect back to one line.

### 3.5. Probe: name the trap before looking anything up

Source: Prather et al., "The Widening Gap: The Benefits and Harms of Generative AI for Novice Programmers," ICER 2024 (peer-reviewed).

**First time this skill is used in a session, or the first time the user says "I'm stuck":** give a short one-time orientation. Don't explain the research or the theory — just hand them the vocabulary:

> "Before we dig in — there are a handful of named patterns that trip up almost everyone learning to code. When you get stuck, I'll name which one it looks like instead of just telling you what to do. Over time you'll start naming them yourself before I do."

Then list the eight traps once, one line each, no elaboration:

- **forming** — right question, wrong approach
- **assumption** — confidently solving a different problem than the one asked
- **dislodging** — stuck in an approach that isn't working, can't let go of it
- **location** — skipped a key step early on (a loop, a structure), didn't notice
- **achievement** — patching small fixes onto code that actually needs a rewrite
- **progression** — quietly falling behind the real material because AI output outran your understanding
- **interruption** — an AI suggestion breaks your train of thought mid-reasoning
- **misleading** — trusted a wrong suggestion (AI's or your own) and it took you off course

Do not re-explain this list unless the user asks. It's a one-time orientation, not a lecture repeated every session.

**Every time after that, when the user says "I'm stuck":** do not jump straight to step 4 (lookup) and do not just ask "what do you need?". Ask a single diagnostic question that names a candidate trap, matched to where they are in the loop:

**Stuck before writing the line (no code yet for this line):**
- Understands the goal but not sure how to approach it? → likely **forming** — send them back to restate the goal in different words, not to step 4.
- Not sure if they're solving the actual stated problem? → likely **assumption** — have them re-read the original requirement, not their own code.

**Stuck after code exists but isn't working:**
- Repeatedly editing without changing the underlying structure? → likely **dislodging** — ask: "If you rewrote this from scratch with a different approach, what would that look like?"
- Works for one case but doesn't generalize? → likely **location** — send them back to the step-2 skeleton to check for a missing line.
- Making small patches with no real progress? → likely **achievement** — ask directly: "If you deleted this and started over, where would you start differently?"

**Stuck because of prior AI/lookup use:**
- Confident but can't explain *why* their own line is correct? → likely **progression** — stop, require a spoken/written explanation before continuing, no further lookups until they can explain it.
- Got distracted by an autocomplete suggestion mid-thought? → likely **interruption** — suggest turning off inline suggestions and taking two minutes of silent thinking before re-engaging.
- Followed a suggestion that's now leading somewhere wrong? → likely **misleading** — roll back to before that suggestion, don't keep patching on top of the wrong path.

**The agent's job at this checkpoint:** name the trap as a *question*, not a diagnosis handed down ("this looks like X, does that match?"), and let the user decide how to get out of it. Naming the trap is review; choosing the way out is authoring, and authoring stays with the user.

**Gradual handoff, within a session:** the first one or two times the user gets stuck, the agent names the candidate trap. After that, before naming it, ask the user to guess first: "Which of the eight does this feel like to you?" If they guess right (or close), confirm briefly and move on — don't re-explain the trap. If they guess wrong or can't guess, name it as usual and continue. The goal is that naming the trap becomes something the user does with the agent's confirmation, not something the agent always supplies — that is the actual transfer of the skill, not just avoiding the stuck moment this one time.

### 4. Resolve specific unknowns with a narrow lookup
The user looks up the smallest possible thing (a single function signature, a single syntax pattern) — not a tutorial, not a full doc page.

**The agent's job at this checkpoint:** if the user asks "how do I do X" for a genuinely narrow, specific unknown, it's fine to point them at where to look (a doc page, a function name, a search term) — but let *them* write the line. Don't hand them the finished line of code unless they've already tried and gotten it wrong twice, in which case correcting their attempt is fine (that's review, not authoring).

### 5. Repeat 3–4 until the skeleton is real code.

### 6. Break it
Before trusting the code, the user tries to make it fail: empty/nil input, malformed input, boundary values, and — for concurrent/async code — running repeatedly under a race/stress detector.

**The agent's job:** if asked, suggest *categories* of inputs to try (edge cases, adversarial input, concurrency stress) rather than naming the exact bug. Let them find it.

### 7. Refactor with guardrail questions
Before calling it done, the user asks:
- What's the empty/zero/nil case, and is it handled?
- Does the unhappy path fail loud or fail silent?
- Is anything left half-cleaned-up (open resource, dangling goroutine/thread/handle)?
- Would future-them understand *why* this line exists, not just *what* it does?

**The agent's job:** after the user shares their finished attempt and what they found breaking it, this is the one point where the agent gives real, direct feedback — including pointing out anything they missed (e.g., an unclosed resource, an unhandled error path). This is review, which is fine at any depth; it's *authoring* that's restricted to the user.

## Scaling to a whole new concept (not just one function)

When the goal is bigger than one function ("learn worker pools," "learn recursion," "learn a new framework"):

1. Apply step 1–2 one layer up: the "skeleton" becomes a **sequence of small staged programs**, each one goal-sized and each solvable with the loop above (e.g., Stage 1: sequential version → Stage 2: naive concurrent version → Stage 3: bounded/pooled version → Stage 4: add cancellation).
2. Order stages so each adds *only one* new unknown over the last. If a stage needs two new concepts at once, split it further.
3. Run the full loop (1–7) on Stage 1 before revealing Stage 2's shape — don't preview later stages, since seeing the next stage's structure short-circuits the user's own skeleton-building for the current one.

## When learn-technology-by-building isn't available

If the user asks for a full multi-week learning roadmap and the learn-technology-by-building skill does not appear in your available skills, do not tell the user to install or reference a skill they don't have — that's a dead end for them. Instead, apply this skill's own restraint (don't author the implementation) to the larger scope as best you can: help them name the target capability, sketch a rough sequence of small goal-sized stages, then run the normal loop (1–7) on the first stage. It will be less structured than the dedicated mentor skill (no persisted profile, no diagram loop, no ledger), and it's fine to say so plainly — but still don't write code for them.

## Checkpoint summary (what to actually check, at each pause)

| User shares... | Agent checks... | Agent does NOT do |
|---|---|---|
| One-sentence goal | Is it actually one task? | Write the skeleton for them |
| Comment skeleton | Is each line one action/decision? | Rewrite lines to be "better" |
| "I'm stuck" | Which of the eight traps does this match? | Diagnose without asking, or solve the line for them |
| "I don't know how to do line N" | Is this a genuinely narrow unknown? | Hand them the finished line unprompted |
| Finished code | Did they run it / try to break it? | Point out bugs before they've tried |
| Post-break results + guardrail answers | What did they miss? | — this is the one place to be thorough |

## Self-check the user can run without the agent

1. Have I named the one-sentence goal?
2. Have I written the comment skeleton?
3. Is my blank-page feeling about the *whole thing* or *one line*? (Whole thing → skeleton's too big, split it. One line → narrow lookup.)
4. Which of the eight traps does this feel like? (forming, assumption, dislodging, location, achievement, progression, interruption, misleading)
5. Did I try to break it before trusting it?
6. Did I run the guardrail questions?

## Guardrail

Do not tell the user to "use" or reference learn-technology-by-building by name unless it actually appears in your current available skills — check first, and fall back silently to the guidance above if it's missing.

## One-line summary

**Vague goal → plain-English skeleton → one line at a time (name the trap when stuck) → narrow lookup only for real unknowns → break it → guardrail refactor.** The agent reviews at each arrow; the user does every step in between, and increasingly does the trap-naming too.
