# Compatibility Contract

## Contents
- Ownership rule
- Allowed interventions
- Forbidden takeovers
- Conflict resolution
- Composition examples

## Ownership rule

When another domain-specific skill or workflow is active, let it own **what** should happen and the domain-specific reasons and order. Let Personal Planner Engine own **whether the proposed execution is feasible and resilient**.

Use this mental model:
- domain skill = architect/navigation system;
- Personal Planner Engine = structural engineer/trip computer.

The support layer may reinforce the design, but must not choose a different destination or move load-bearing walls without a domain-grounded reason.

## Allowed interventions

Modify or annotate operational aspects such as:
- committed versus stretch scope;
- horizon length;
- contingency amount;
- task batch size;
- atomic first action;
- energy-demand placement;
- review trigger;
- risk fallback;
- rollback candidates;
- explicit assumptions and unknowns.

Example: if a learning skill proposes three checkpoints but the user's capacity fits only two after contingency, commit to two and mark the third stretch. Do not delete the checkpoint or reorder the curriculum unless the learning dependency graph supports it.

## Forbidden takeovers

Do not replace:
- learning pedagogy with generic productivity scheduling;
- technical sequencing with project-management convenience;
- medical/legal/financial specialist criteria with generic plan rules;
- evidence gates with attendance or schedule-compliance metrics;
- a domain skill's required schema with an OKR template solely for consistency.

Do not invent new domain requirements to make the plan look complete.

## Conflict resolution

Resolve conflicts in this order:
1. safety, policy, and hard external constraints;
2. domain correctness and prerequisite logic;
3. objective evidence of completion;
4. realistic capacity and contingency;
5. user preferences and formatting;
6. aesthetic consistency.

When time and domain quality conflict, first reduce optional scope or extend the horizon. State the tradeoff when neither can move.

## Composition examples

### Learning skill

Domain skill owns target capability, cumulative project, checkpoint sequence, copy/disturb/transfer loop, tests, and mastery evidence.

Planner adds capacity-fit, conservative weekly commitments, contingency, bad-day learning contact, scope rollback, and re-estimation after actual checkpoint duration is known.

Bad behavior: convert a checkpoint roadmap into a rigid 30-day curriculum or use `90% attendance` as the main KR.

### Travel planner

Domain planner owns destination logic, routing, booking constraints, opening times, and local feasibility.

Planner adds budget/capacity buffers, reservation deadlines, contingency time, fallback choices, and priority tiers. Do not reorder geographic routing solely to fit a generic daily template.

### Software project planner

Domain workflow owns architecture, technical dependencies, test gates, release criteria, and production requirements.

Planner adds commitment accounting, risk buffers, milestone feasibility, rollback scope, and review triggers. Do not cut validation or safety-critical work to maintain an arbitrary date.
