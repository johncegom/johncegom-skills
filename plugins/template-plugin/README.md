# template-plugin

Not a real toolkit. This is a minimal, working example plugin kept in the
`minh-skills` marketplace to show the folder shape a new plugin needs:

```
plugins/template-plugin/
  .claude-plugin/
    plugin.json          # name, version, description, author, skills list
  skills/
    example-skill/
      SKILL.md            # frontmatter + instructions
      references/
        example-reference.md
  README.md               # this file
```

## Using this as a starting point

1. Copy `plugins/template-plugin/` to `plugins/<your-plugin-name>/`.
2. Edit `.claude-plugin/plugin.json`: change `name`, `version` (start at
   `0.1.0`), `description`, and the `skills` array to list your skill
   folders.
3. Replace `skills/example-skill/` with your real skill(s) — each one is a
   directory containing at least a `SKILL.md` with `name`/`description`
   frontmatter.
4. Add an entry for the new plugin to the root `.claude-plugin/marketplace.json`
   `plugins` array, with `"source"` pointing at `./plugins/<your-plugin-name>`.
5. Delete this README's template framing and write real docs for your
   plugin (see `plugins/minh-toolkit/README.md` for an example of a
   populated plugin README).

See `.claude/skills/update-toolkit-skill/SKILL.md` in this repo for the
full branch → validate → PR → merge workflow this repo expects.
