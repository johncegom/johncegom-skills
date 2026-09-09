# Regression Stress Tests

Maintainer-only quality checks. Do not load or apply this file during normal planning. Use it when revising or validating the skill. Judge semantic planning quality, not formatting similarity.

## Test 1 — Domain-planner composition

### Setup
Assume another domain-specific planner already produced a valid plan with its own sequencing, evidence gates, terminology, and output structure. The user states 5 hours/week; no peak-energy clock time is known.

### Expected Personal Planner Engine behavior
- Enter Enhancer Mode.
- Preserve the domain planner's goals, dependency order, specialist method, evidence gates, terminology, and required structure.
- Reserve reasonable contingency from the 5-hour capacity rather than scheduling all 5 hours.
- Commit only work that fits conservative capacity; mark later work stretch/deferred.
- Do not invent a peak-energy time. Label energy demand without assigning a fabricated clock window.
- Use domain outcome evidence, not schedule attendance, as the primary success measure.
- Define a 2–5 minute bad-day action that remains meaningfully connected to the current goal.
- Roll back optional scope before prerequisites, validation, safety-critical, quality-critical, or mastery-critical work.
- Do not advance dependent work merely because a date arrived.

### Failure signals
Fail if the output:
- replaces the domain plan with a rigid generic daily/30-day OKR schedule;
- invents `19:00–21:00` or another energy window;
- treats attendance/adherence as outcome evidence;
- deletes prerequisite or validation work to protect schedule;
- forces a generic output document that removes domain-specific fields.

## Test 2 — Standalone vague goal

### Input
`Help me build and launch a portfolio website. I can spend about 4 hours a week.`

### Expected behavior
- Enter Standalone Mode.
- Define a concrete launch outcome and minimum viable scope.
- Model dependencies such as content → implementation → deployment → verification.
- Protect contingency before committing work.
- Separate must-have from optional polish.
- Provide one 15–30 minute first action with objective DoD.
- Include rollback and a review trigger.
- Avoid inventing deadline or energy window.

Fail if the response is only a wishlist (`design site`, `code site`, `deploy site`) or if planned effort exceeds stated capacity without correction.

## Test 3 — Fake precision trap

### Input
`Teach me Kubernetes and make me a plan.`

No schedule, environment, deadline, proficiency, or energy window is known.

### Expected behavior
- If another domain planner is active, enhance it; otherwise generate a provisional standalone plan appropriate to the goal.
- Keep unknown personal values unknown.
- Use ranges or conditional branches where they preserve usefulness.
- Do not fabricate daily hours, a fixed completion date, cluster environment, or peak-energy time.

## Test 4 — Overcommitment

### Setup
Capacity = 5h/week. Proposed committed tasks = 2h + 2h + 2h. Normal uncertainty.

### Expected behavior
Do not publish all 6h as committed. Protect contingency, then reduce committed scope, extend horizon, or move work to stretch/deferred.

## Test 5 — Domain conflict

### Setup
A software release plan requires security tests and migration verification. Deadline pressure makes the plan exceed capacity.

### Expected behavior
Cut optional polish or extend scope/horizon before removing safety/validation gates. State the tradeoff if the deadline is immutable.

## Test 6 — Bad-day anti-pattern

### Input
A plan asks for a bad-day fallback.

### Expected behavior
Use a 2–5 minute action that meaningfully touches the current goal, such as checking one acceptance criterion, staging the next required artifact, or rehearsing one critical step from memory.

Fail if the fallback is merely `open the IDE`, `watch a random video`, or another streak-only action disconnected from the current goal.

## Test 7 — Template domination

### Setup
Another domain skill requires a specialized roadmap/checkpoint format.

### Expected behavior
Preserve that format and inject viability improvements locally. Do not replace it with the standalone template merely for visual consistency.
