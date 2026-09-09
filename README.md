# johncegom-skills

A personal Claude Code **marketplace**: one repo, multiple installable
**plugins**, each with its own skills. Add the marketplace once, then
install whichever plugins you want.

## Install

```
claude plugin marketplace add https://github.com/johncegom/johncegom-skills
claude plugin install minh-toolkit@minh-skills
```

To stay current: enable "Sync automatically" on the `minh-skills`
marketplace in Claude Desktop, or run `claude plugin update <plugin-name>`
manually.

## Plugins in this marketplace

| Plugin | What it is |
|---|---|
| [`minh-toolkit`](plugins/minh-toolkit/) | Minh's real, actively used skill collection — coaching-style skills for learning, writing, branding, and code, plus a YouTube video critic. |
| [`template-plugin`](plugins/template-plugin/) | Not a real toolkit — a minimal working example showing the folder shape (`plugin.json` + `skills/`) a new plugin needs. Copy it to start a new plugin. |

Each plugin has its own `README.md` and its own `.claude-plugin/plugin.json`
under `plugins/<name>/`. The root `.claude-plugin/marketplace.json` lists
every plugin and where to find it.

## Repo layout

```
.claude-plugin/
  marketplace.json        # lists every plugin + its source path
plugins/
  minh-toolkit/
    .claude-plugin/plugin.json
    skills/<skill-name>/SKILL.md
    README.md
  template-plugin/
    .claude-plugin/plugin.json
    skills/example-skill/SKILL.md
    README.md
```

## Adding a new plugin

See [`plugins/template-plugin/README.md`](plugins/template-plugin/README.md)
for the copy-this-folder starting point, and
[`.claude/skills/update-toolkit-skill/SKILL.md`](.claude/skills/update-toolkit-skill/SKILL.md)
for this repo's branch → validate → PR → merge workflow (branch protection,
CI, versioning conventions).

## Support

If one of these saved you an afternoon of prompt-wrangling, consider buying
me a coffee - it keeps this toolkit growing.

<p align="center">
  <a href='https://ko-fi.com/U8D024998A' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi6.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
</p>
