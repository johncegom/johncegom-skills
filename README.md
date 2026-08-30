# minh-toolkit

Skills I built because I needed them, kept because they still earn their place.

![version](https://img.shields.io/badge/version-0.6.6-blue) ![license](https://img.shields.io/badge/license-MIT-lightgrey)

I build and maintain this collection solo, on my own time, and I use every skill in it myself. That shapes the philosophy: most of these coach instead of doing the work for you — the agent reviews, it doesn't author — and where a skill judges something (a video, a piece of writing, a plan), it's built to call it as it is, not to flatter. No vanity metrics, no grade inflation. Each skill's own `SKILL.md` documents its purpose in full detail.

## Install

```
claude plugin marketplace add https://github.com/johncegom/skills
claude plugin install minh-toolkit@minh-skills
```

To stay current: enable "Sync automatically" on the `minh-skills` marketplace in Claude Desktop, or run `claude plugin update minh-toolkit` manually.

## Skills

| Skill | Purpose |
|---|---|
| `goal-to-code-unblock` | Coaches a learner to write code from a vague goal themselves — the agent reviews, never authors. |
| `learn-technology-by-building` | Multi-session mentor for learning a new technology through one cumulative project, with diagram practice. |
| `low-power-learning` | Short, near-passive learning session for a tired or burned-out brain, to keep a learning habit alive. |
| `personal-planner-engine` | Turns a goal or domain plan into a realistic, execution-ready schedule — capacity-fit, contingency, committed/stretch/deferred scope, bad-day fallback. Hardens another skill's plan without overriding its domain logic, or builds one standalone. |
| `real-personal-branding` | Personal branding help (positioning, content, channels) focused on real-world outcomes, not vanity metrics. |
| `smart-quiz-maker` | Builds and runs a quiz for almost any subject from a short request, calibrated to test real understanding rather than memory or guessing. |
| `socratic-brainstorm` | Opt-in: probes a design or strategy idea with follow-up questions before giving direct feedback, instead of answering right away. Only triggers when explicitly invoked by name. |
| `sound-human` | Makes prose read like a real person wrote it. Its main job is a default self-check the agent runs on its *own* generated prose (emails, posts, reports) before delivering it, not just an on-request edit of a pasted draft. |
| `writing-practice` | Coaches deliberate writing practice — the agent never writes the user's actual piece for them. |
| `youtube-video-critic` | Critically evaluates whether a YouTube video is worth watching, using transcript analysis via the youtube-mcp-cli connector. Requires [go-youtube-mcp-cli](https://github.com/johncegom/go-youtube-mcp-cli) installed and its binary on `PATH`, or `YOUTUBE_MCP_BIN` set to its full path — see `.mcp.json`. |

## Support

If one of these saved you an afternoon of prompt-wrangling, consider buying me a coffee - it keeps this toolkit growing.

<p align="center">
  <a href='https://ko-fi.com/U8D024998A' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi6.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
</p>
