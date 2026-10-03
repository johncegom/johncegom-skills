# usage-band

A one-line band above the Claude Code prompt that shows how much context, 5-hour limit and weekly limit you have used, plus what the session has cost.

![version](https://img.shields.io/badge/version-0.1.0-blue) ![license](https://img.shields.io/badge/license-MIT-lightgrey)

```text
 Context ▰▰▰▰▰▰▱▱▱▱ 62%  124k/200k  │  5h ▰▰▱▱▱▱▱▱▱▱ 23%  resets 15:40  │  7d ▰▱▱▱▱▱▱▱▱▱ 9%  │  $1.42
```

**Needs Claude Code 2.1.287 or later.** It runs in the Claude Code CLI and the Desktop app (the surfaces the mods docs list).

> **Trust note.** A mod is code that runs inside Claude Code with the same access Claude Code has. Read [`hooks/register.tsx`](hooks/register.tsx) before you install it, and again after each update, or turn off "Sync automatically" for this plugin. This one reads only the usage figures Claude Code already has; it makes no network calls and writes no files.

## Install

```
claude plugin marketplace add https://github.com/johncegom/johncegom-skills
claude plugin install usage-band@minh-skills
```

Then run `/reload-plugins`, or restart Claude Code if the band doesn't appear. (Skip the first command if you already added the `minh-skills` marketplace.)

## Use

Nothing to run. The band appears above the prompt and updates after each turn and whenever a limit moves a whole percent.

| Part | Meaning |
|---|---|
| `Context` | How full the context window is, with tokens used out of the window |
| `5h`, `7d` | How much of the 5-hour and weekly limits you have used, and when the 5-hour window resets (local time) |
| `$1.42` | What this session has cost so far |

Bars fill as you use more. **Green** is under 60% used, **yellow** is 60–84%, **red** is 85% and over. A limit at 100% reads `limit reached, resets HH:MM`.

It adapts to what it has and how wide the terminal is:

- **Before the first reply** it says `waiting for first reply`.
- **Without a subscription** (no limits reported) it shows context and cost only.
- **Under about 98 columns** it drops the token counts and the cost.
- **Under about 64 columns** it shortens to one phrase, such as `ctx 62% · 5h 23%`.

## Update / remove

```
claude plugin update usage-band
claude plugin uninstall usage-band
```

## Develop

Run the tests with `claude plugin test plugins/usage-band` and check the mod with `claude plugin validate plugins/usage-band`.
