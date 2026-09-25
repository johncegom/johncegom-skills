---
name: update-toolkit-skill
description: >
  Walks through the correct end-to-end workflow for editing, adding, or
  removing a skill inside this minh-toolkit plugin repo (johncegom/johncegom-skills) and
  landing that change safely — branch, local validation, PR, CI, review/merge,
  and how downstream users pick up the update. Use when the user asks to
  "update a skill", "add a new skill to the toolkit/plugin", "bump the
  plugin/skill version", "publish a skill change", "release this skill", or
  asks how to change something in this repo without breaking the Claude
  Desktop/CLI marketplace install. Specific to this repo's setup: branch
  protection on main, a solo CODEOWNER, and a CI workflow that runs
  `claude plugin validate`. Not a general git/PR skill — only for changes to
  skills, plugin.json, or marketplace.json in this repo.
---

# Update Toolkit Skill

Land a change to a skill (or the plugin/marketplace manifest) in this repo without breaking the Claude Desktop/CLI marketplace install for anyone who has it added. This repo's `main` is protected: no direct pushes, 1 approving review required, code-owner review required. The repo owner is the sole CODEOWNER, so they cannot approve their own PR — every PR from them merges via the admin bypass ("Merge without waiting for requirements"), not a normal green-approve merge. Don't try to work around that by weakening branch protection; it's intentional (see the CODEOWNER-can't-self-approve tradeoff already decided for this repo).

## The workflow

### 1. Branch from `main`
```
git checkout main && git pull origin main
git checkout -b <type>/<short-description>
```
Use conventional-commit-style branch/commit prefixes already used in this repo's history: `feat/`, `fix/`, `chore/`, `ci/`.

### 2. Make the change
This repo is a marketplace of multiple plugins under `plugins/<plugin-name>/`, each with its own `.claude-plugin/plugin.json` and `skills/` directory. The `minh-toolkit` plugin (the real, actively used skill collection) lives at `plugins/minh-toolkit/`; `plugins/template-plugin/` is a copy-this-folder starting point for a new plugin, not a real toolkit.

- Editing an existing skill: edit `plugins/minh-toolkit/skills/<name>/SKILL.md` or its `references/*.md`.
- Adding a new skill to `minh-toolkit`: create `plugins/minh-toolkit/skills/<new-name>/SKILL.md` with YAML frontmatter (`name`, `description`) followed by the skill body, then add `"./skills/<new-name>"` to the `skills` array in `plugins/minh-toolkit/.claude-plugin/plugin.json` — unlike some plugin setups, this repo's `plugin.json` lists skills explicitly rather than auto-discovering them.
- Removing a skill: delete its `plugins/minh-toolkit/skills/<name>/` directory and remove its entry from `plugin.json`'s `skills` array.
- Adding a whole new plugin: copy `plugins/template-plugin/` to `plugins/<new-plugin-name>/`, fill in its `plugin.json` and skills, then add a matching entry (with `"source": "./plugins/<new-plugin-name>"`) to the root `.claude-plugin/marketplace.json`'s `plugins` array.

**Frontmatter gotcha (bit us once, see PR #8):** the `description` field is YAML. A plain unquoted scalar breaks if it contains `: ` (colon-space) anywhere mid-sentence — YAML reads it as a new mapping key and the parse fails, silently dropping all frontmatter at runtime. Either avoid colons in the description, or write it as a folded block scalar:
```yaml
description: >
  Some description that safely contains a colon: like this, because
  the folded `>` block scalar doesn't treat mid-line colons specially.
```
Every skill in this repo already uses this style — match it.

### 3. Bump the version once, on the first meaningful change in this PR
If this is the first commit in the PR that changes anything beyond a typo, bump the changed plugin's own `plugins/<plugin-name>/.claude-plugin/plugin.json`'s `"version"` (semver) and keep the root `.claude-plugin/marketplace.json`'s matching `plugins[].version` entry for that same plugin **and that plugin's own `README.md` version badge** in sync with it — all three carry the same number. The badge is a plain shields.io URL (`.../version-X.Y.Z-blue`), not JSON, so it's easy to forget when scripting the other two; grep for it explicitly:
```
grep -n "img.shields.io/badge/version" plugins/<plugin-name>/README.md
```
This is what lets `Sync automatically` in Desktop and `claude plugin update <plugin-name>` detect there's something new, and keeps the README from silently drifting behind the shipped version (it drifted once, fixed alongside this instruction). A change to only one plugin does not require bumping any other plugin's version or the marketplace's own top-level fields.

**If you're adding a further commit to a PR that already bumped the version this session (still open, not yet merged): do NOT bump again.** Keep the same version number across every iteration within that one open PR — update the PR description/commit message to explain what changed in this round, not the version field. A version number identifies one shipped state; bumping it again before the previous bump has even merged just churns the number without a matching release ever existing at the intermediate value. (This is exactly what went wrong in PR #17: the version got bumped, reverted to match `main`, then re-bumped, purely from iterating inside one still-open PR — the fix was landing on one bump per PR, decided at the first meaningful change and held steady after that.)

### 4. Validate locally before pushing
```
claude plugin validate plugins/<plugin-name>/.claude-plugin/plugin.json   # that plugin's manifest + every SKILL.md frontmatter
claude plugin validate .                                                    # marketplace manifest (validates every plugin listed in it)
```
Both must print `✔ Validation passed`. This is the exact check CI runs (looping `claude plugin validate` over every `plugins/*/.claude-plugin/plugin.json`) — catching a failure here saves a round trip.

Also check that the skill loads on other harnesses. The spec (agentskills.io) caps `description` at 1024 characters and requires `name` to equal the folder name; GitHub Copilot and VS Code silently skip a skill that breaks either, and a `description` edit is how this happens without anyone noticing. CI enforces both via `.github/scripts/check_skill_frontmatter.py`, so run it locally too. Separately, CI fails any `SKILL.md` over 20000 bytes and warns from 18000. That is this repo's context budget, not a documented Copilot limit (an earlier 22 KB Copilot failure was really an over-long description).
```
python .github/scripts/check_skill_frontmatter.py   # needs PyYAML
wc -c plugins/*/skills/*/SKILL.md                    # <= 20000; move cold-path detail into references/
```

Optional, for a closer end-to-end check: build a local `.zip`/`.plugin` package (`cd tools/package-plugin && go run . plugins/<plugin-name>`) and load it directly to confirm skills actually resolve:
```
claude --plugin-dir path/to/packaged.plugin -p "list the skill names available to you, one per line"
```

### 5. Commit, push, open a PR into `main`
```
git add <files>
git commit -m "<type>: <what changed>"
git push -u origin <branch>
gh pr create --base main --title "..." --body "..."
```
If this change depends on another open, unmerged PR in this repo, base it on that PR's branch instead of `main` (a GitHub "stack") rather than duplicating its diff — see PR #9 stacked on #10 for the precedent. Retarget to `main` once the base PR merges.

### 6. Let CI run
The `.github/workflows/validate-plugin.yml` workflow runs the same two `claude plugin validate` commands automatically on the PR. Check it's green (`gh pr checks <number>`) before merging.

### 7. Merge
As the sole CODEOWNER you cannot approve your own PR — GitHub disables that. Merge via the admin-bypass option ("Merge without waiting for requirements are met") once CI is green. Don't lower the branch-protection review requirement to work around this; that was already evaluated and rejected in favor of keeping outside contributors' PRs properly gated.

**Watch for the stacked-PR merge-order trap** (bit us in PR #9/#10/#11): if PR B is stacked on PR A, merging A into `main` does not retroactively pull B's already-merged-into-A commits into `main` if B merges into A *after* A already merged into `main`. Merge stacked PRs in dependency order, base-first, and double check the change actually landed on `main` afterward (`git log origin/main --oneline`, or re-run `claude plugin validate` against `origin/main`).

### 8. Downstream pickup
Anyone with the `minh-skills` marketplace added:
- **"Sync automatically" enabled** (Desktop): picks up the change on next sync, no action needed.
- **Manual**: `claude plugin update minh-toolkit` (or the equivalent marketplace sync action in Desktop).

## Quick sanity check after any merge to main
```
git fetch origin
git diff origin/main HEAD --stat   # confirm nothing local diverges unexpectedly
claude plugin marketplace add https://github.com/johncegom/johncegom-skills   # re-add cleanly; should succeed
```
If `add marketplace` fails after a merge, the most likely causes, in order: (1) `claude plugin validate` would also fail — run it against `origin/main` locally to confirm before debugging further; (2) a stacked-PR merge landed on the wrong branch and never reached `main` (see step 7); (3) `marketplace.json`'s `source` path doesn't match the actual directory layout on `main`.

**Claude Desktop "Failed to add marketplace" while the CLI add succeeds:** Desktop stores marketplaces on the claude.ai account, not in `~/.claude/plugins`, and keys them by the GitHub *repo slug*, not by `marketplace.json`'s `name`. The real error is only in `%LOCALAPPDATA%\Claude\Logs\claude.ai-web.log` (`MARKETPLACE_ERROR:REMOTE_NAME_TAKEN`). This bit us when the repo was still called `skills` and collided with `mattpocock/skills` already added on the same account — the reason the repo is now `johncegom-skills`. Don't rename it back to something generic.
