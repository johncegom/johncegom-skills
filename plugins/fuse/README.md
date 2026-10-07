# fuse

A burning-fuse bar above the Claude Code prompt. It tracks how big the current turn has grown, and when a limit is hit it holds the next tool call and asks you whether to go on.

![version](https://img.shields.io/badge/version-0.1.0-blue) ![license](https://img.shields.io/badge/license-MIT-lightgrey)

```text
Lit      ··✦~~~~~~~~~~~~◉   12% · calls 12/100
Burning  ······✦~~~~~~~~◉   45% · 20 of 45 min
Short    ··········✧~~~~◉   72% · context 29% of 40%
Hissing  ·············✸~◉   91% · calls 91/100
HELD     ··············✹  100% · calls 100/100
```

Not tied to any project: install it once and it works in every repo.

**Needs Claude Code 2.1.287 or later.** CLI and Desktop code tab.

> **Trust note.** A mod is code that runs inside Claude Code with the same access Claude Code has. Read [`hooks/register.tsx`](hooks/register.tsx) before you install it, and again after each update. This one can refuse tool calls (that is its job), runs a tiny `sleep` process while it waits for you, and writes one line per turn to a stats file in your project. It makes no network calls.

## Install

```
claude plugin marketplace add https://github.com/johncegom/johncegom-skills
claude plugin install fuse@minh-skills
```

Then `/reload-plugins`, or restart Claude Code. A first install shows a settings screen for the options below.

## What it measures

Three meters, reset at the start of every turn. The fuse is the fullest of them.

| Meter | Counts | Default limit |
| --- | --- | --- |
| minutes | clock time since the turn began; **paused while the decision pane is open** | 45 |
| tool calls | +1 per tool call (subagent calls too, see `countSubagents`) | 100 |
| context growth | context tokens now minus at turn start, as a percent of the context window | 40 (%) |

Stages: under 30% **Lit** `✦`, 30–59% **Burning** `✦`, 60–84% **Short** `✧`, 85–99% **Hissing** `✸`, 100% **HELD** `✹`. The stage word and spark shape change as well as the colour, so it reads without colour. The spark flickers bold on every other tool call. The bar redraws on each tool call, not on a timer, so the minutes meter moves when a tool call happens.

Between turns the last burn stays dim until you send the next prompt: `last burn  ····✦~~~~~~~~~◉   38% · 21 min · 64 calls`.

Narrow terminals (by the width Claude Code gives the band): 60+ columns the full bar and meter text; 40–59 an 8-cell bar and the percent; under 40 just `✦ 45%`.

## At 100%: the next call is held

A call that is already running is never cut off. The **next** one is held and a pane opens:

```
······························✹  FUSE HELD
────────────────────────────────────────────────
 limit hit   calls 100/100
 this turn   45 min · 100 calls · 12% growth
 next call   Bash  npm test
────────────────────────────────────────────────
 1: Extend by half  (↻ 2 of 2 left)     2: Stop
 Esc stops the turn
```

- **Extend by half** (`1`) raises all three limits by half of their base for this turn only (45 → 67.5 → 90). The bar shows `↻ spliced N×`. After `maxExtensions` (default 2) the button is gone and only Stop is left.
- **Stop** (`2`), or **Esc**, or closing the pane, refuses the call and every later call this turn, telling Claude: *"The user stopped this turn. List what you changed and what is left. Do not edit more."*

A pane opened without you asking only seats on a wide terminal (about 144 columns). On a narrower one the same box is drawn above the prompt instead; there press a button with a click, or `ctrl+x tab` then `1` or `2`. Esc as Stop works for the pane, not for the inline box.

## Settings

Set in the install screen or `/config` (rows named `fuse.<name>`).

| Setting | Default | |
| --- | --- | --- |
| `minutes` | 45 | minutes limit |
| `toolCalls` | 100 | tool-call limit |
| `contextGrowth` | 40 | context growth limit, % of the window |
| `maxExtensions` | 2 | Extend uses per turn |
| `countSubagents` | true | count (and hold) subagent tool calls; off ignores them |
| `theme` | dark | `dark` or `light` palette. There is no `auto`: the mod API cannot tell the terminal's background |
| `ascii` | false | draw `. * ~ O` instead of the symbols |
| `emoji` | false | bomb `💣`, held `💥` |
| `statsPath` | `.claude/fuse-stats.jsonl` | where each turn's numbers are appended |

Colours are hex (the API accepts them), so there is no named-colour fallback.

## Stats file: keep it out of git

At the end of each turn one line is appended to `statsPath`, relative to the project:

```json
{"at":"2026-10-07T09:12:00.000Z","turnId":"…","minutes":21.4,"calls":64,"growth":18.2,"pct":53,"extensions":0,"aborted":false}
```

Use it to tune the limits. **Add it to `.gitignore`** (`.claude/fuse-stats.jsonl`); the mod toasts a reminder once per session if it isn't listed there.

## Known limits

- **A hook has 10 s of its own time**, and `$.clock.sleep` spends it. The wait for your key therefore sleeps through short `sleep` child processes (`sleep`, or PowerShell's `Start-Sleep` on Windows), which cost the hook nothing. If neither starts on your machine, the hold falls back to the hook's own clock, runs out after 10 s, and **stops** the turn (it never lets the call through). Checked live (Windows): a hold left open for about 5 minutes still took Extend afterwards, and one Stop refused two parallel calls. The tests use a fake clock.
- **Context growth** reads the context size of the last response, so the first reading of a brand-new session has no baseline (growth starts from the first reading). A `/compact` or auto-compact mid-turn lowers the baseline rather than showing negative growth.
- Subagents raise no turn-start event, so only the main loop resets the meters; their tool calls count toward the main turn's meters.
- Tool calls made in parallel share one hold: the first is held and the rest wait for your answer. One Stop refuses them all (checked live). After an Extend, a waiting call re-checks the raised limit and runs if there is room. With a limit of 3, Extend makes it 4.5, so two parallel calls both ran after one press (checked live); a third call would have been held.

## Update / remove

```
claude plugin update fuse
claude plugin uninstall fuse
```

## Develop

`claude plugin validate plugins/fuse` and `claude plugin test plugins/fuse`. The tests run on a fake clock and fake usage, so the 100% case takes seconds. The kit cannot raise `ui.close`, so Esc-as-Stop is tested through `isEscapeStop` in [`hooks/core.ts`](hooks/core.ts) (the hook's one decision), not through a real Esc.
