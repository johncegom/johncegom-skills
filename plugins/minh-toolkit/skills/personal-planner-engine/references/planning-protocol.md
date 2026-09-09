# Planning Protocol

## Contents
- Core model
- Stage A: Define
- Stage B: Model
- Stage C: Prioritize
- Stage D: Capacity-fit
- Stage E: Operationalize
- Stage F: Harden
- Stage G: Control
- Planning heuristics

## Core model

Build a real plan as:

`domain-correct structure + dependency-aware decomposition + objective evidence + capacity-constrained commitments + uncertainty allowance + recovery + feedback`

Do not confuse formatting with planning quality. A polished calendar can still be fake if scope does not fit capacity or progress cannot be verified.

## Stage A: Define

Identify:
- target outcome;
- objective evidence that the outcome exists;
- deadline only if supplied or externally real;
- hard constraints;
- non-goals and exclusions;
- relevant stakeholders or external approvals when applicable.

If the goal is broad, define the smallest meaningful end-state rather than expanding it into every adjacent aspiration.

## Stage B: Model

Decompose the goal into workstreams, then into tasks only as far as useful for the current horizon.

For each meaningful task identify:
- dependency or prerequisite;
- external dependency;
- uncertainty;
- blocking decision;
- output or state transition.

Prefer dependency order over arbitrary calendar order. Do not parallelize work that genuinely depends on an earlier result.

## Stage C: Prioritize

Separate:
- **Must-have** — required for the core outcome;
- **Should-have** — materially improves quality but can move;
- **Could-have** — optional or exploratory.

Map these to **Committed**, **Stretch**, and **Deferred** after capacity is known. Do not cut safety, prerequisites, core validation, or required quality merely to preserve a date unless the user explicitly accepts that tradeoff.

## Stage D: Capacity-fit

Start from stated real capacity, not theoretical free time. Protect contingency before allocating work.

Typical contingency heuristic:
- stable/repetitive work: about 10–15%;
- normal knowledge work: about 15–20%;
- unfamiliar/high-uncertainty work: 20–30% or more;
- external dependencies: consider explicit schedule slack in addition to task-level contingency.

Treat these as heuristics, not laws.

If exact effort is uncertain, use ranges. Prefer `60–90m estimated` over a fabricated `73m`.

If proposed committed effort is too large:
1. preserve the outcome;
2. remove optional scope;
3. reduce batch size;
4. extend the horizon;
5. only then reconsider the goal or deadline.

## Stage E: Operationalize

For near-term work, define:
- objective Definition of Done;
- 15–30 minute first atomic action;
- exact starting artifact, file, location, person, or command when relevant;
- expected observable evidence;
- energy demand: high, medium, or low.

When energy windows are known, place high-demand work in higher-energy periods. When unknown, label energy demand without inventing clock times.

Avoid decomposing every distant task into tiny actions. Detail decays with distance; keep later phases milestone-level until evidence justifies refinement.

## Stage F: Harden

Define the likely failure modes that would materially affect execution, not an exhaustive risk register.

For each major risk, choose one or more:
- prevention;
- early-warning signal;
- contingency;
- rollback;
- escalation;
- acceptance.

### Bad-day minimum

Use a 2–5 minute action that maintains meaningful contact with the current goal. Examples:
- rerun and predict one test in a learning project;
- write the next paragraph heading for a report;
- confirm one required document for an application;
- review the single next action and stage the needed materials.

Avoid empty streak actions such as merely opening an app.

### Rollback

Use a trigger such as two consecutive overloaded cycles, a missed dependency, or a material estimate variance. Remove optional scope before core scope.

## Stage G: Control

A plan is a control loop, not a one-time forecast.

At review:
1. compare planned versus actual effort and evidence;
2. identify variance cause: estimation, interruption, dependency, scope growth, skill gap, or motivation/energy mismatch;
3. update remaining estimates;
4. reclassify committed/stretch/deferred scope;
5. preserve the core outcome or explicitly renegotiate it.

Prefer review triggers tied to natural cycles or milestones. Do not invent a Sunday 20:00 review unless the user supplied or requested it.

## Planning heuristics

- Treat capacity as a budget, not a challenge to fill.
- Keep some unallocated slack when uncertainty is high.
- Prefer one observable milestone over several vague activity goals.
- Separate output metrics from process/adherence metrics.
- Use calendar dates when external deadlines or coordination require them; otherwise phase/checkpoint sequencing may be more robust.
- Use OKRs only when objectives and measurable KRs genuinely improve clarity; do not force them on every personal goal.
- Replan from evidence rather than punishing a missed schedule.
