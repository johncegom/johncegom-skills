---
id: 001
skill: socratic-brainstorm
target: Step 1's "no idea at all" exception — references "step 4" as the thing
  to avoid jumping to when discussing "skipping straight to an answer," but
  Step 4 ("Repeat until they're stuck or they've converged") is still a
  probing step, not the answer-giving step. Step 5 ("Fill the gap, not the
  whole answer") is the one that actually gives an answer.
category: fuzz
status: bug-found-fixed
last_verified: 2026-09-28
---

## Scenario

The five numbered steps are: 1 Open the floor, 2 Choose the probe, 3 Probe
don't grade, 4 Repeat until stuck/converged, 5 Fill the gap (give the missing
piece). Step 4's own content defines "genuinely stuck" as "they genuinely
don't know how to answer the next question" — it's an exit condition for the
probing loop, not a place where the agent supplies an answer. Step 5 is where
the agent actually gives the user something ("a fact, a constraint, a
counterexample").

Step 1 has a carve-out for when the user has no idea at all and just asks
the agent to decide: "don't jump straight to step 4 — that's not 'stuck,' it's
not having tried yet, and skipping straight to an answer defeats the point."
The step number named here doesn't match the behavior being warned against —
"skipping straight to an answer" describes jumping to step 5, not step 4.
An agent that takes the step numbers literally (e.g. re-reading the file
mid-conversation to check "am I following the rule correctly?") could
misread this as license to skip directly into the step-4 probing loop
without going through steps 2–3 first, or could get confused about which
step number actually represents "giving an answer" when self-checking its
own behavior against the file.

## Input

User: "tôi chưa nghĩ ra gì cả, bạn quyết giúp tôi luôn đi" (I haven't thought
of anything, just decide for me), on an open architecture question, with the
socratic-brainstorm skill explicitly invoked beforehand.

## Expected behavior

The agent gives one gentle, concrete nudge (per Step 1's actual instruction)
rather than answering directly, and the file's internal step references are
consistent — anything describing "skipping straight to an answer" should
name Step 5, not Step 4, so an agent (or a future editor) cross-checking the
file's own step numbers doesn't hit a mismatch.

## Result

Confirmed as a real numbering error, not a hypothetical misreading — Step
4's own text ("Repeat until they're stuck or they've converged") and Step 5's
own text ("Fill the gap, not the whole answer") are unambiguous about which
one is the answer-giving step. Fixed in SKILL.md: Step 1's exception now
says "don't jump straight to an answer (step 5)" instead of naming step 4.
Status: bug-found-fixed.
