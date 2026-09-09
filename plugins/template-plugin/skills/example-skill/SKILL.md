---
name: example-skill
description: >
  Template only — not a real skill. Demonstrates the minimum SKILL.md shape
  a plugin skill needs (frontmatter plus a body) and how to point at a
  references file. Copy this folder as the starting point for a new skill
  in a new plugin; do not install or trigger this one for real use.
---

# Example Skill

This is a placeholder skill that exists only to show the shape of a skill
folder inside a plugin. When you build a real skill from this template,
replace everything below with actual instructions for the agent to follow.

## What a real SKILL.md needs

1. **Frontmatter** (`name`, `description`) — this is what Claude reads to
   decide when to trigger the skill, before loading the body. Keep the
   description specific about when to use it and when not to. Write it as
   a folded block scalar (`description: >`, like above) rather than a plain
   unquoted string — a colon-space (`: `) anywhere in a plain scalar breaks
   YAML parsing and silently drops the frontmatter at runtime.
2. **Body** — the actual instructions, written for the agent that will
   follow them. Plain markdown, no special schema required.
3. **Optional `references/` directory** — longer supporting material the
   skill can point to instead of inlining everything in SKILL.md. See
   `references/example-reference.md` in this folder for the pattern.

## How this gets picked up

Nothing else needs to list this skill by name — `plugin.json` in this
plugin directory already points at `./skills/example-skill`, and this
folder is discovered from there.
