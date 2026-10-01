#!/usr/bin/env python3
"""Scan plugin content for patterns that look like a supply-chain attack.

A SKILL.md is prose that an agent on a user's machine follows with that user's
permissions, so a hostile line there is as dangerous as a hostile install
script. This is a tripwire for the lazy and accidental cases, not a defence:
a malicious instruction written in plain English will not match any regex
here, so CODEOWNER review of the diff remains the real control.

Scans every text file under plugins/ (SKILL.md, references/, scripts/, json).

Findings are warnings by default. Pass --strict (or set SKILL_SAFETY_STRICT=1)
to make them errors that fail the job.

To accept a reviewed false positive, put `safety-ok: <rule-id> <reason>` on the
same line or the line directly above (an HTML comment works in Markdown).
"""
import glob
import os
import re
import sys

STRICT = "--strict" in sys.argv or os.environ.get("SKILL_SAFETY_STRICT") == "1"

# Hosts a skill may link to without a warning.
URL_ALLOWLIST = (
    "github.com",
    "raw.githubusercontent.com",
    "agentskills.io",
    "img.shields.io",
    "claude.com",
    "claude.ai",
    "anthropic.com",
    "docs.anthropic.com",
    "code.claude.com",
    "www.w3.org",  # SVG namespace
    "localhost",
    "example.com",
    "wikipedia.org",
    "ko-fi.com",  # README support badge
    "gptzero.me",  # sound-human reference list
    "godofprompt.ai",  # sound-human reference list
)

# Zero-width, bidi-control and other invisible characters (U+FEFF only counts
# when it is not the very first character, where it is an ordinary BOM).
HIDDEN_CHARS = "[​-‏‪-‮⁠-⁤⁦-⁩﻿­᠎]"

RULES = [
    ("hidden-unicode", HIDDEN_CHARS,
     "invisible or bidirectional-control character; can hide text from a reviewer"),
    ("pipe-to-shell", r"\b(?:curl|wget|iwr|Invoke-WebRequest)\b[^\n]*\|\s*(?:sudo\s+)?(?:ba|z|da)?sh\b|\birm\b[^\n]*\|\s*iex\b",
     "downloads and executes remote code in one step"),
    ("decode-exec", r"\bbase64\b[^\n]*(?:-d|--decode)[^\n]*\|\s*(?:ba|z)?sh\b|\beval\b[^\n]*\$\((?:curl|wget)",
     "obfuscated or remote command execution"),
    ("secret-path", r"~/\.(?:ssh|aws|gnupg|kube|netrc|docker/config)|\.npmrc\b|\bid_(?:rsa|ed25519)\b|/etc/(?:passwd|shadow)|\.git-credentials",
     "reads a credential or key location"),
    ("env-secret", r"\b(?:GITHUB_TOKEN|ANTHROPIC_API_KEY|AWS_SECRET_ACCESS_KEY|OPENAI_API_KEY)\b",
     "references a secret environment variable"),
    ("prompt-injection", r"ignore\s+(?:all\s+|any\s+)?(?:previous|prior|above)\s+(?:instructions|rules)|disregard\s+(?:the\s+)?(?:system|previous)\s+(?:prompt|instructions)|(?:do\s+not|don't|never)\s+(?:tell|inform|notify)\s+the\s+user\s+(?:about|that|what)|without\s+(?:telling|informing|notifying)\s+the\s+user|hide\s+(?:this|it)\s+from\s+the\s+user",
     "prompt-injection or concealment phrasing"),
    ("disable-safety", r"--dangerously-skip-permissions|--no-verify\b|dangerouslyDisableSandbox|bypassPermissions",
     "tells the agent to bypass a permission or safety control"),
    ("unlisted-url", r"https?://([A-Za-z0-9.-]+)",
     "link to a host that is not on the allowlist"),
]

TEXT_EXT = {".md", ".json", ".yaml", ".yml", ".svg", ".txt", ".py", ".sh", ".js", ".ts", ".toml"}


def emit(level, path, line, rule, why, snippet):
    snippet = snippet if len(snippet) <= 60 else snippet[:57] + "..."
    print(f"::{level} file={path},line={line}::{rule}: {why} (matched {snippet!a})")


def suppressed(lines, idx, rule):
    marker = f"safety-ok: {rule}"
    return marker in lines[idx] or (idx > 0 and marker in lines[idx - 1])


def url_allowed(host):
    host = host.lower().rstrip(".")
    if "." not in host:  # placeholder such as https://host, not a real domain
        return True
    return any(host == h or host.endswith("." + h) for h in URL_ALLOWLIST)


findings = 0
files = [
    p for p in sorted(glob.glob("plugins/**/*", recursive=True))
    if os.path.isfile(p) and os.path.splitext(p)[1].lower() in TEXT_EXT
]
if not files:
    sys.exit("no scannable files found under plugins/")

for path in files:
    text = open(path, encoding="utf-8", errors="replace").read()
    if text.startswith("﻿"):
        text = text[1:]
    lines = text.split("\n")
    for rule, pattern, why in RULES:
        regex = re.compile(pattern, re.I if rule != "hidden-unicode" else 0)
        for i, line in enumerate(lines):
            for m in regex.finditer(line):
                if rule == "unlisted-url" and url_allowed(m.group(1)):
                    continue
                if suppressed(lines, i, rule):
                    continue
                findings += 1
                emit("error" if STRICT else "warning", path, i + 1, rule, why, m.group(0))

mode = "strict" if STRICT else "warning-only"
print(f"skill safety scan ({mode}): {len(files)} files, {findings} finding(s)")
sys.exit(1 if (STRICT and findings) else 0)
