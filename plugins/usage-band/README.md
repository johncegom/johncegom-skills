# usage-band

A one-line band above the Claude Code prompt that shows how much context, 5-hour limit and weekly limit you have used, plus what the session has cost. A small dancer at the end of the band dances while Claude works, then hums, dozes and falls asleep.

![version](https://img.shields.io/badge/version-0.2.1-blue) ![license](https://img.shields.io/badge/license-MIT-lightgrey)

```text
 Context ▰▰▰▰▰▰▱▱▱▱ 62%  124k/200k  │  5h ▰▰▱▱▱▱▱▱▱▱ 23%  resets 15:40  │  7d ▰▱▱▱▱▱▱▱▱▱ 9%  │  ฿1.42
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
| `฿1.42` | What this session has cost so far, in US dollars, with the Belly sign from One Piece as the symbol (`B` with the ASCII option) |

Bars fill as you use more. **Green** is under 60% used, **yellow** is 60–84%, **red** is 85% and over. A limit at 100% reads `limit reached, resets HH:MM`.

### The dancer

A small figure at the end of the band moves with what the session is doing:

| When | Dancer | Moves |
|---|---|---|
| Claude is working, under 60% used | `♪ \(^o^)/` | 5 times a second, easy beat |
| working, 60–84% | `♫ /(•_•)\` | a faster beat |
| working, 85–99% | `♪ \(°O°)/` | the fastest beat |
| working, 100% | `\(x_x)/ !!` | still |
| the first minute after a reply | `♪ (^o^)` | humming, once a second (dim) |
| the next four minutes | `(-_-) zZ` | dozing, every two seconds (dim) |
| after that, and in a new session | `(-_-) zZZ` | asleep, still (dim) |

While working it takes the colour of the fullest meter; at rest it is dim, so it never reads as an alert. A new prompt wakes it, `/clear` puts it to sleep, and a turn you interrupt counts as finished. Once it is asleep nothing redraws, so a quiet session costs nothing. It shows from about 112 columns, or from about 64 on the `waiting for first reply` line, and never in non-interactive runs (`claude -p`, the SDK).

Two options in the plugin's settings:

- **Dancer**: `always` (default), `working` (only while Claude works) or `off`.
- **ASCII dancer**: draws it with `~ * o > <` instead of `♪ ♫ • °`. Turn it on if the band looks misaligned; some East Asian terminals draw those symbols double width.

It adapts to what it has and how wide the terminal is:

- **Before the first reply** it says `waiting for first reply`, with the dancer asleep beside it (and dancing during the first turn).
- **Without a subscription** (no limits reported) it shows context and cost only.
- **Under about 112 columns** it drops the dancer.
- **Under about 98 columns** it drops the token counts and the cost.
- **Under about 64 columns** it shortens to one phrase, such as `ctx 62% · 5h 23%`.

## Update / remove

```
claude plugin update usage-band
claude plugin uninstall usage-band
```

## Develop

Run the tests with `claude plugin test plugins/usage-band` and check the mod with `claude plugin validate plugins/usage-band`.
