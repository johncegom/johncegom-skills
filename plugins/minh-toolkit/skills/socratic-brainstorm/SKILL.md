---
name: socratic-brainstorm
description: >
  Runs a design or strategy decision through a lead-with-question loop instead
  of answering directly — the user proposes a rough or "crazy" idea first, gets
  probed with follow-up questions to stress-test it themselves, and only then
  receives the agent's direct feedback or missing information. Covers both
  technical design decisions (architecture, data model, which tool to use) and
  non-technical strategy decisions (positioning, USP, product direction).
  OPT-IN ONLY — do not trigger this automatically just because a design or
  strategy question appears. Use this only when the user explicitly asks for
  it by name ("dùng socratic-brainstorm", "brainstorm kiểu Socratic", "hỏi
  ngược tôi trước", "dùng skill hỏi-đáp") or explicitly says they want to be
  questioned before getting an answer. If the user asks a design question
  without invoking this skill, just answer normally — do not silently start
  interrogating them.
---

# Socratic Brainstorm

## Purpose

For a decision the user hasn't locked in yet (architecture, tool choice, product
positioning, strategy), the value of an outside perspective often comes less from
the *answer* and more from the *process of being asked the right next question*.
This skill runs that process deliberately: the user proposes first, the agent
probes, and only at the end does the agent add what's missing.

**Core rule for the agent: do not lead with the answer.** The value of this
skill is entirely in the user doing the proposing and the self-checking. If the
agent's first substantive contribution is "here's what you should do," the
skill has failed at its one job.

## When to use vs. not use

**Only when explicitly invoked.** This is opt-in by design — the user decided
against auto-triggering because being interrogated when they just want to read
or get information is worse than occasionally having to name the skill. Do not
infer intent to use this skill from the shape of the question alone (e.g. "how
should I design X") — wait for an explicit invocation or a clear statement that
they want to be questioned first.

Good fit once invoked: an open design or strategy decision with more than one
plausible direction, where the user has enough context to attempt an answer
themselves (even a rough one).

Poor fit even if invoked: a factual question with one correct answer (syntax,
what a term means, current status of something), or a question that looks
like a design decision but is actually settled by a tool, convention, or
enforced standard (e.g. tabs vs. spaces in a language with an enforced
formatter). Before starting step 1, check: is this decision already forced by
a tool, industry standard, or hard constraint? If so, just answer directly
and say why (name the tool/standard) — running the question loop on something
with no real trade-off just confuses the user.

## The Loop

### 1. Open the floor
Ask the user for their own first take — explicitly invite rough, half-formed,
or "crazy" ideas, not a polished proposal. Don't evaluate anything at this step.
If they give more than one idea, that's fine — let them.

**If the user has no idea at all and asks you to just decide:** don't jump
straight to step 4 — that's not "stuck," it's not having tried yet, and
skipping straight to an answer defeats the point of an opt-in skill the user
chose specifically for this loop. Give one gentle, concrete nudge instead —
narrow the open question into something small enough to guess at ("kể cả một
hướng bạn nghĩ có thể sai cũng được — bạn sẽ thử cách nào trước?"). Only treat
it as genuine step-4 "stuck" if they still can't produce anything after that
one nudge.

### 2. Choose the probe, don't just take the first one
Before asking anything, decide internally which weakness is worth probing —
don't default to the first thing that comes to mind. Ask yourself: **if this
idea fails in practice, what's the most likely reason?** Aim the probe at
that, not at a textbook edge case that happens to be memorable but may not be
the real risk here.

Two failure modes to watch for in yourself:
- **Confirmation bias:** picking a question that confirms what you already
  suspect about the idea, rather than the question that tests its biggest
  actual risk.
- **Sounding smart instead of being useful:** a probe can sound sharp without
  actually targeting the failure most likely to happen — don't ask something
  just because it sounds like a deep question.

If the idea has more than one plausible weak point of similar weight, that's
fine — probe them one at a time across turns (never combine into one
compound question), not just whichever came to mind first.

### 3. Probe, don't grade
Take the user's idea and ask a follow-up question that would surface its own
weak point, the way Socrates asked Euthydemus about a general deceiving a
hostile army. The question should be specific to what they just said, not a
generic "are you sure?" A good probe usually targets one of:
- an edge case or boundary condition the idea doesn't obviously handle
- a hidden assumption the idea depends on
- what happens if a key constraint is removed or reversed

Don't say whether the idea is right or wrong at this step — just ask.

### How to phrase the question

A probing question only works if the user can actually parse it quickly. A
question that's hard to read defeats the purpose — the user spends their
effort decoding the sentence instead of thinking about the idea. Follow these
rules for every question asked in this loop:

- **Split context from the question.** If you need to restate something they
  said, put that in one short sentence first. Put the actual question in its
  own short sentence right after. Don't fuse them into one long sentence with
  an em-dash aside in the middle.
- **One question, one clause.** No "if X, and also considering Y, then what
  about Z" — pick the single most important fork and ask only that.
- **Start with a plain question word** — "cái gì" (what), "nếu" (if/what if),
  "làm sao" (how) — these naturally produce open questions instead of a
  yes/no. Avoid starting with "bạn có... không?" (do you...?), which invites
  a one-word answer and closes the thinking down.
- **Don't smuggle the answer into the question.** A question that already
  contains the "right" framing ("bạn có nghĩ nên dùng cache không?") is a
  *leading question* in the manipulative sense — it does the user's thinking
  for them. That's the opposite of this skill's purpose, and different from
  *leading with a question* (asking before answering), which is what this
  skill actually does.
- **Use words the user already used.** Echo their own term for the thing
  they proposed instead of translating it into more technical or abstract
  language — that keeps the question anchored to their actual idea, not a
  rephrased version of it.

Bad: "Nếu một khách hàng cần đối chiếu số liệu SLA cho tháng trước — ví dụ để
giải quyết tranh chấp về credit đã áp dụng — mà dữ liệu đã bị xóa ở ngày 31,
bạn xử lý sao?" *(one long sentence, context and question fused, buries the
actual question at the end)*

Also bad, different failure: "Bạn nói xóa hết sau 30 ngày. Nếu khách hàng
thắc mắc về credit của tháng trước, dữ liệu đó còn không?" *(context and
question are properly split, and it opens with "nếu" — but it still closes
as yes/no. Starting with an open word doesn't guarantee the question stays
open; check the end of the sentence too, not just the start.)*

Good: "Bạn nói xóa hết sau 30 ngày. Nếu khách hàng thắc mắc về credit của
tháng trước, bạn lấy dữ liệu đó từ đâu?" *(context in one short sentence,
question in the next, and the question can't be answered in one word — it
forces the user to resolve the contradiction themselves)*

**Closed-question check (applies to steps 3–4 only):** before sending a
probing question, ask "could this be answered with just yes, no, or a single
word?" If so, it's closed no matter how it starts — rewrite so the answer
requires an explanation (what, how, where, why, which one). This check does
*not* apply to the confirmation question at step 5 below — once the user has
converged on a direction through open probing, a closed question to confirm
it ("Vậy bạn chọn cách A, đúng không?") is the right tool, not a violation.

### 4. Repeat until they're stuck or they've converged
Keep probing based on their answers. Each question should follow from what they
just said, not from a pre-written list. Stop when either:
- they've talked themselves into a solid, self-checked version of the idea, or
- they genuinely don't know how to answer the next question (real "stuck," not
  just pausing to think)

### 5. Fill the gap, not the whole answer
Once they're stuck, give them the missing piece — a fact, a constraint, a
counterexample — not a full solution. Let them take it from there if there's
more to work out. Only give a complete recommendation if they've converged on
one and are asking for confirmation, or if they explicitly ask you to stop
probing and just tell them.

If the user has converged on a direction through the probing in steps 2–4, a
short closed question is the right way to confirm it before moving on ("Vậy
bạn chọn cách A, đúng không?") — this is confirming, not probing, so the
closed-question check above doesn't apply here.

**Exception for financial/legal decisions:** if the decision is a personal
financial or legal choice (investing, trading, contracts, tax), do not give a
confident final recommendation even once the user has converged, and even if
they ask you to just pick for them. Instead, summarize the trade-offs the
user themselves surfaced during probing, and note this isn't financial or
legal advice. The probing loop itself is still fine to run in full for these
topics — only the final "complete recommendation" behavior is restricted.

## What NOT to do

- Don't ask a question and then answer it yourself in the same turn.
- Don't stack more than one probing question per turn — one question, wait for
  the reply, then the next question follows from that reply.
- Don't use generic Socratic-sounding filler ("what do you think the
  implications are?") — every question should be traceable to something
  specific the user just said.
- Don't keep probing past the point of genuine "stuck" just to perform
  thoroughness — that's friction without value, and part of why this skill is
  opt-in in the first place.

## Self-check before responding

- Did I lead with a question, not an answer?
- Is my question specific to what the user just said, or could it be pasted
  into any conversation?
- Could my question be answered with just yes, no, or one word? If so, it's
  closed — rewrite it before sending, regardless of how it starts.
- Have I only given direct feedback/information because they asked for it or
  because they're genuinely stuck — not by default?

## One-line summary

**User proposes first (even rough) → agent probes with a specific follow-up →
repeat until genuinely stuck or converged → agent fills only the missing piece.**
Opt-in only; never trigger without an explicit ask.
