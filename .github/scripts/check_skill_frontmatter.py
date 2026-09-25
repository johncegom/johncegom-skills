#!/usr/bin/env python3
"""Check every plugins/*/skills/*/SKILL.md frontmatter against the Agent Skills
spec (https://agentskills.io/specification), which harnesses such as GitHub
Copilot enforce by silently skipping a skill that breaks it:

- frontmatter exists and parses as YAML
- name: 1-64 chars, a-z 0-9 and hyphens, no leading, trailing or double hyphen,
  and equal to the skill's folder name
- description: non-empty, at most 1024 characters of the parsed value
"""
import glob
import os
import re
import sys

try:
    import yaml
except ImportError:
    sys.exit("PyYAML is required: pip install pyyaml")

MAX_DESC = 1024
WARN_DESC = 950
NAME_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


def error(path, msg):
    print(f"::error file={path}::{path}: {msg}")


failed = False
paths = sorted(glob.glob("plugins/*/skills/*/SKILL.md"))
if not paths:
    sys.exit("no SKILL.md files found under plugins/*/skills/")

for path in paths:
    text = open(path, encoding="utf-8").read().lstrip("﻿").replace("\r\n", "\n")
    match = re.match(r"---\n(.*?)\n---(\n|$)", text, re.S)
    if not match:
        error(path, "no YAML frontmatter block; harnesses will skip this skill")
        failed = True
        continue
    try:
        fm = yaml.safe_load(match.group(1))
    except yaml.YAMLError as exc:
        error(path, f"frontmatter is not valid YAML ({exc}); a mid-line ': ' in an unquoted value is the usual cause")
        failed = True
        continue
    if not isinstance(fm, dict):
        error(path, "frontmatter is not a key/value mapping")
        failed = True
        continue

    name, desc = fm.get("name"), fm.get("description")
    folder = os.path.basename(os.path.dirname(path))
    if not isinstance(name, str) or not name:
        error(path, "missing or empty name")
        failed = True
    else:
        if len(name) > 64 or not NAME_RE.match(name):
            error(path, f"name '{name}' must be 1-64 chars of a-z, 0-9 and single hyphens, not starting or ending with a hyphen")
            failed = True
        if name != folder:
            error(path, f"name '{name}' must match its folder name '{folder}'; VS Code Copilot silently skips the skill otherwise")
            failed = True
    if not isinstance(desc, str) or not desc.strip():
        error(path, "missing or empty description")
        failed = True
    else:
        n = len(desc.strip())
        if n > MAX_DESC:
            error(path, f"description is {n} characters, over the {MAX_DESC}-character Agent Skills limit; GitHub Copilot will not load the skill. Move detail into the body")
            failed = True
        elif n >= WARN_DESC:
            print(f"::warning file={path}::{path}: description is {n} characters, within {MAX_DESC - n} of the {MAX_DESC} limit")

sys.exit(1 if failed else 0)
