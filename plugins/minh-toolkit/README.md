# minh-toolkit

Skills that coach you instead of doing the work for you — so the skill you're learning, the piece you're writing, or the plan you're building is actually yours when you're done.

![version](https://img.shields.io/badge/version-0.13.5-blue) ![license](https://img.shields.io/badge/license-MIT-lightgrey) ![skills](https://img.shields.io/badge/skills-12-informational)

No API keys, no signup, no extra cost beyond your existing Claude plan — these are prompt-level skills, not external services. One skill (`youtube-video-critic`) optionally connects to a separate local tool; everything else works the moment it's installed.

I built and use every one of these myself, daily — that's the only quality bar they have to pass. Where a skill judges something (a video, a piece of writing, a plan), it's built to call it as it is, not to flatter you. No vanity metrics, no grade inflation.

## Install

```
claude plugin marketplace add https://github.com/johncegom/johncegom-skills
claude plugin install minh-toolkit@minh-skills
```

In Claude Desktop: **Settings → Plugins → Marketplaces → Add**, paste the same repo URL, then install `minh-toolkit` from the list.

To stay current: enable "Sync automatically" on the `minh-skills` marketplace in Claude Desktop, or run `claude plugin update minh-toolkit` manually.

## Try it in one message

Nothing to configure, no command to memorize — just talk to Claude normally and the right skill picks itself up:

- *"I don't know where to start with this Django project"* → `goal-to-code-unblock` hands you the first step, not the finished code.
- *"Test me on SQL joins"* → `smart-quiz-maker` builds a quiz calibrated to how well you actually know it.
- *"Help me turn these notes into a blog post, but I want to actually practice writing"* → `writing-practice` coaches you through it instead of writing it for you.
- Ask Claude to draft an email or post for you, normally — `sound-human` quietly checks its own output before handing it back, so you don't get the "clearly written by AI" tone. No trigger phrase needed.

## What's inside

**Ready to use immediately — no setup:**

| Skill | What it does |
|---|---|
| `goal-to-code-unblock` | Coaches you to write the code yourself from a vague goal — reviews, never authors. |
| `learn-technology-by-building` | Multi-session mentor for learning a new technology through one cumulative project, with diagrams. |
| `low-power-learning` | A short, near-passive session for a tired or burned-out brain, so the learning streak survives anyway. |
| `smart-quiz-maker` | Builds and runs a quiz on almost any subject, calibrated to test real understanding, not guessing. |
| `writing-practice` | Coaches deliberate writing practice — never writes your actual piece for you. |
| `sound-human` | Runs automatically on Claude's own generated prose so it doesn't read like AI. Also works on your pasted drafts if you ask. |
| `personal-planner-engine` | Turns a goal into a realistic, execution-ready schedule — capacity-fit, with a bad-day fallback. Also hardens a plan another skill already produced. |
| `real-personal-branding` | Personal branding help focused on real outcomes (opportunities, inbound), not vanity metrics. |
| `socratic-brainstorm` | **Opt-in only** — say "socratic brainstorm this" and it'll stress-test your idea with questions before giving direct feedback. Won't trigger on its own. |
| `bootstrap-way-of-working` | **Opt-in only** — run `/bootstrap-way-of-working` to set up a CLAUDE.md/AGENTS.md plus calibrated bug/decision/retro logs and a task-approval gate, sized to the project's actual risk and team size. Won't trigger on its own. |
| `bootstrap-eagd-pattern` | **Opt-in only** — run `/bootstrap-eagd-pattern` to install a live, repo-wide mechanism (in your CLAUDE.md/AGENTS.md, or kept outside the repo if it can't hold agent files) letting a future agent session spawn an Advise/Grade/Dream sub-agent with a model you name and a probe verifies for each harness, when it hits a matching trigger. Re-runs keep existing bindings. Won't trigger on its own. |

**Needs one extra install step:**

| Skill | What it does | Setup |
|---|---|---|
| `youtube-video-critic` | Tells you honestly whether a YouTube video is worth your time, from real transcript analysis — not the title/thumbnail. | Install [go-youtube-mcp-cli](https://github.com/johncegom/go-youtube-mcp-cli) and put its binary on `PATH` (or set `YOUTUBE_MCP_BIN` to its full path). See `.mcp.json` in this plugin. Without it, this one skill just won't trigger — everything else above is unaffected. |

## FAQ

**Do I need to enable each skill individually?** No — installing the plugin enables all of them. Nine trigger automatically from what you say; `socratic-brainstorm`, `bootstrap-way-of-working`, and `bootstrap-eagd-pattern` are the exceptions and only run when you explicitly ask for them.

**Will this change how Claude normally behaves?** Only `sound-human` runs by default in the background, rewriting Claude's own prose before it reaches you — everything else only activates when it matches what you're asking for.

**A skill isn't triggering — what's wrong?** Say what you want more directly (e.g. "give me a quiz on X" or "coach me through writing this"), or name the skill outright. If it's `youtube-video-critic`, confirm the MCP binary is actually on `PATH`.

**How do I get updates?** "Sync automatically" in Desktop, or `claude plugin update minh-toolkit` from the CLI — see Install above.

**How do I uninstall?** `claude plugin uninstall minh-toolkit`, or remove it from Desktop's plugin list. There's no way to disable a single skill inside the plugin without removing the whole thing.

## Support

If one of these saved you an afternoon of prompt-wrangling, consider buying me a coffee - it keeps this toolkit growing.

<p align="center">
  <a href='https://ko-fi.com/U8D024998A' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi6.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
</p>
