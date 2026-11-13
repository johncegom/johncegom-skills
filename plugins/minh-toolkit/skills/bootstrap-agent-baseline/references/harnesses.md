# User-level instruction locations

These paths were believed correct when this file was written. Tools change them.
Check the docs for the version the user runs before you write anything.

| Harness | User-level file | If there is no file |
|---|---|---|
| Claude Code | `~/.claude/CLAUDE.md` | n/a |
| OpenAI Codex CLI | `~/.codex/AGENTS.md` | n/a |
| Gemini CLI | `~/.gemini/GEMINI.md` | n/a |
| GitHub Copilot | A user-level instructions file in VS Code, or personal instructions in GitHub settings | Print the block, user pastes it |
| Cursor | User Rules in the settings screen | Print the block, user pastes it |

On Windows, `~` is the user's home folder, for example `C:\Users\<name>`.

If the harness is not in the table, ask the user where its global instructions
live. If there is no answer, print the block.
