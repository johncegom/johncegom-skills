# Learner profile template

This is a blank skeleton, not a finished profile. The first time this skill runs
for a given learner, check whether `references/learning-profile.md` already
exists in this skill's directory.

- **If it doesn't exist:** copy the structure below, fill in what you already
  know from the current conversation (or leave sections empty if you don't know
  yet), and save it as `references/learning-profile.md`. That file — not this
  template — is what step "Calibrate the path" in SKILL.md means by "reuse known
  context about the learner."
- **If it already exists:** read it before designing or resuming a learning
  path, and update it after meaningful progress instead of recreating it from
  scratch. Treat it as cumulative memory, not a snapshot you overwrite each time.
- **If there's no filesystem available** (e.g. plain chat mode with no file
  tools): keep the same information in conversation memory instead, using this
  structure as the mental checklist of what to track.

Never fill this template in with invented details. Every field should come from
something the learner actually said or something you directly observed in their
work — leave a field blank rather than guessing, and ask only when the missing
detail would materially change how you teach.

---

## Skeleton to copy into `learning-profile.md`

```markdown
# Learner profile

## Stable learning preferences

- <How they like to learn: coding-along vs. reading first, pace, how they like
  checkpoints structured, how much explanation they want up front vs. at point
  of use, language for explanations, etc. Fill in only what's actually been
  observed.>

## Evidence from prior projects

### <Project name> (<status: completed / current>)

- <What was built, and which concepts it exercised.>
- <What worked well in how they learned it.>
- <Any real friction — a bug they caught, a concept that needed a second pass,
  a preference that surfaced mid-project.>

<Repeat one subsection per project as the learner completes or works through them.>

## Mentor interpretation

<Your read on their experience level, what kind of scaffolding they need, and
how to calibrate metaphors, pacing, and depth. Update this as evidence accumulates
— don't leave it as a first impression.>

## Dynamic values to recalibrate

Do not assume these remain constant across subjects:

- weekly time budget;
- target technology and proficiency level;
- project domain;
- machine, operating system, permissions, and company restrictions;
- preferred language version, framework, or testing tools;
- current phase and existing codebase.

Infer these from current context or ask only when the answer changes the
learning architecture.
```
