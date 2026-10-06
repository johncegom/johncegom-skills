# skill-badge

A band above the Claude Code prompt that lists the skills loaded in this session, so you can tell a skill that is in effect from an agent improvising without it.

![version](https://img.shields.io/badge/version-0.1.0-blue) ![license](https://img.shields.io/badge/license-MIT-lightgrey)

```text
 Skills loaded: learn-technology-by-building, sound-human · new this turn: sound-human
```

**Needs Claude Code 2.1.287 or later.** It runs in the Claude Code CLI and the Desktop app (the surfaces the mods docs list).

> **Trust note.** A mod is code that runs inside Claude Code with the same access Claude Code has. Read [`hooks/register.tsx`](hooks/register.tsx) before you install it, and again after each update, or turn off "Sync automatically" for this plugin. This one only reads which skills the engine loaded; it makes no network calls and writes no files.

## Install

```
claude plugin marketplace add https://github.com/johncegom/johncegom-skills
claude plugin install skill-badge@minh-skills
```

Then run `/reload-plugins`, or restart Claude Code if the band doesn't appear. (Skip the first command if you already added the `minh-skills` marketplace.)

## Use

Nothing to run. The band appears once a skill loads and stays for the rest of the session, so a skill that loaded in turn 1 is still listed in turn 20.

- **Listed** means the engine loaded the skill's instructions into the conversation (through the Skill tool, a typed `/name`, or a subagent preload). It does not prove the agent followed them.
- **Not listed** while you expect it means the agent never received the skill and is working from its own habits.
- `· new this turn: x` names skills that loaded since your last prompt.
- A trailing `?` marks a skill that loaded before a `/compact` or auto-compact. The summary may have dropped its text; load it again to clear the mark.
- `/clear` empties the list. The band hides when no skill has loaded.
- A skill read with the `Read` tool (opening its `SKILL.md` as a file) is not seen. Subagent preloads count as loaded for the session.

## Update / remove

```
claude plugin update skill-badge
claude plugin uninstall skill-badge
```

## Develop

Run the tests with `claude plugin test plugins/skill-badge` and check the mod with `claude plugin validate plugins/skill-badge`.
