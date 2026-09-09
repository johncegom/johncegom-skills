---
name: personal-planner-engine
description: >
  Create realistic, execution-ready personal plans or harden plans produced by
  other skills without overriding their domain logic. Use when the user asks to
  plan, schedule, roadmap, organize, execute, or make a goal actionable; when
  another planning skill needs feasibility, capacity, buffer, risk, fallback,
  rollback, or review support; or when a proposed plan looks vague, overloaded,
  calendar-driven, or falsely precise. Operate in enhancer mode when another
  domain skill owns the plan, and standalone mode otherwise. Prefer evidence,
  dependency-aware sequencing, conservative commitments, explicit uncertainty,
  and adaptive replanning over wishlists or rigid schedules.
---

# Personal Planner Engine

Turn intentions or domain roadmaps into plans that can survive real execution. Treat the skill as a planning kernel with two modes: enhance another planner without taking over its domain, or generate a complete plan when no domain planner owns the task.

## Select the operating mode

1. Determine whether another active skill, workflow, or supplied plan already owns the domain-specific planning logic.
2. If yes, use **Enhancer Mode**. Preserve its goals, sequencing, terminology, evidence gates, domain constraints, and required output structure. Improve only planning viability and execution mechanics.
3. If no, use **Standalone Mode**. Build the plan end to end, then harden it with the same viability checks.
4. If ownership is ambiguous, prefer Enhancer Mode when overriding the existing structure could destroy domain-specific reasoning.

Read [references/planning-protocol.md](references/planning-protocol.md) for the complete generation and hardening protocol. Read [references/compatibility.md](references/compatibility.md) whenever another skill or supplied domain plan is active. Use [references/templates.md](references/templates.md) when a concrete output frame helps.

## Preserve domain ownership in Enhancer Mode

Treat the domain planner as the architect and this skill as structural engineering: strengthen feasibility without moving load-bearing walls.

Do not override domain-specific:
- outcome semantics or mastery criteria;
- prerequisite or dependency order without a feasibility reason;
- pedagogy, technical architecture, legal/financial/medical logic, or other specialist methodology;
- progress gates or evidence requirements;
- mandatory output structure.

Do improve:
- realistic capacity fit;
- commitment versus stretch scope;
- atomic starting actions;
- buffer and contingency;
- energy placement when the user's pattern is known;
- likely risks, fallback actions, rollback scope, and review triggers;
- explicit handling of unknowns and estimates.

When a conflict exists, preserve domain correctness first. Change timing, scope, or commitment before changing domain logic.

## Generate a plan in Standalone Mode

Build plans through this sequence:

1. **Define** — establish outcome, objective completion evidence, constraints, deadline if real, and non-goals.
2. **Model** — decompose work into workstreams and tasks; identify dependencies, unknowns, external blockers, and decision points.
3. **Prioritize** — separate must-have, should-have, and optional scope; identify the critical path where relevant.
4. **Capacity-fit** — compare estimated effort with actual stated capacity; protect contingency before committing scope.
5. **Operationalize** — give near-term work an objective DoD and a 15–30 minute frictionless starting action.
6. **Harden** — add risk handling, bad-day continuity, rollback scope, and recovery options.
7. **Control** — define evidence, review cadence or trigger, and how estimates or scope change after real execution data arrives.

Keep the horizon proportional to uncertainty. Detail the next execution cycle more than distant work.

## Prevent fake plans

Never manufacture precision merely to complete a template.

Classify planning values internally as:
- **Known** — supplied or observed;
- **Inferred** — supported by available evidence;
- **Estimated** — a planning approximation;
- **Unknown** — unsafe to invent.

Never invent personal availability, peak-energy windows, deadlines, proficiency, environment constraints, or external commitments. Leave them unknown, use a clearly labeled provisional range when safe, or design a plan that remains valid without them.

Treat schedule adherence as an operational health metric, not the primary success criterion. Prefer evidence of completed capability, working output, or accepted deliverable.

## Fit commitments to capacity

Use conservative commitment accounting:

`usable commitment capacity = stated capacity - protected contingency`

Default to roughly 15–20% contingency only when no better estimate exists. Adjust it for uncertainty, novelty, external dependencies, and estimation confidence; explain meaningful deviations.

Classify scope as:
- **Committed** — expected to fit conservative usable capacity;
- **Stretch** — attempted only after committed work clears;
- **Deferred** — explicitly outside the current cycle.

If committed effort exceeds usable capacity, repair the plan before presenting it by reducing scope, extending the horizon, or moving work to stretch/deferred. Do not silently overbook.

## Make degradation graceful

For meaningful execution cycles, define:

- **Bad-day minimum** — a 2–5 minute action that preserves contact with the actual goal or mental model, not meaningless streak maintenance.
- **Rollback trigger** — normally two consecutive missed or overloaded review cycles unless the domain requires another signal.
- **Rollback action** — remove optional scope before prerequisite, safety-critical, quality-critical, or mastery-critical work.
- **Review trigger** — compare estimate versus actual, identify the cause of variance, then adjust the next cycle.

## Gate plan quality before presenting it

Repair the plan if any load-bearing check fails:

- Is success objectively recognizable?
- Is the next action obvious and small enough to start?
- Are dependencies sequenced correctly?
- Does committed work fit conservative capacity?
- Is contingency protected rather than consumed by planned work?
- Are assumptions distinguishable from facts?
- Is at least one likely failure mode handled where meaningful?
- Can optional scope be removed without destroying the core outcome?
- Is there a concrete review or replanning trigger?

Use the smallest output structure that makes execution clear. Do not force OKRs, daily schedules, or tables when another format better preserves the domain plan.
