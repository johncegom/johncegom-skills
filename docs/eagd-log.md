# EAGD log

Append-only record of Execute / Advise / Grade / Dream activity. Add each row at the end of the table in its section. One row per event, single line, no line breaks inside a cell, and write a literal `|` inside a cell as `\|`. Use `—` for a field that does not apply or was not captured.

## Advise calls

| Date | Branch | Question | Prior leaning | Answer | Taken | Tool | Requested | Reported | Status |
|---|---|---|---|---|---|---|---|---|---|
| 2026-09-18 | main | How should bootstrap-eagd-pattern handle multiple vendors' agent harnesses in one repo? | Vendor-neutral protocol + per-harness binding table in one anchor doc, with same-session fallback | Fable 5.1: leaning right on spawn/model axis but wrong on framing (five sub-problems, not one); a table in CLAUDE.md is invisible to other vendors. Prefer shared protocol in AGENTS.md + one-line binding per vendor file, inventory-not-find in Step 1, `harness`/`mechanism` log fields; skip script-shelling-out | Partly: shared protocol in AGENTS.md and the fallback + log fields kept; per-vendor files dropped once round 2 fixed AGENTS.md as the shared file | Agent | fable | — | answered |
| 2026-09-18 | main | With all harnesses reading AGENTS.md, how should the shared directive pick a model per role across vendors? | Capability tiers in the directive + per-vendor resolution table, self-identify vendor, inherit-host-model fallback | Fable 5.1: pinned model id keyed by the sub-agent tool the session holds (not vendor); rows written only after an install-time probe; Advise/Dream refuse to fall back (log SKIPPED + reason), Grade may fall back and logs it; add tool/model_requested/model_reported fields; tiers only as row comments; repo-script advisor only as opt-in | Advisor's answer (pinned id keyed by held tool, probe-gated rows); Execute added a control probe with a different model | Agent | fable | — | answered |
| 2026-09-18 | main | How should a re-run of bootstrap-eagd-pattern in a harness that already has probed bindings in AGENTS.md behave? | Read existing block, re-probe every row by default, decision table per row state, update in place, log changes | Fable 5.1: mostly right but re-probe-by-default is over-engineered, probe only touched rows or on explicit verify; biggest hole is no machine-stable row format, so add greppable `eagd-binding` rows keyed (role, tool) inside start/end markers with status ok/unverified/stale; cannot-probe leaves row untouched; re-run is re-calibration unless user says fresh; report rows not held by this session; no date-based staleness warnings | Advisor's answer: probe only touched rows, greppable marker-delimited rows, re-run = re-calibration; keep-unverifiable-row lean also confirmed | Agent | fable | — | answered |

## Binding changes

| Date | Role | Tool | Old | New | Reason |
|---|---|---|---|---|---|

## Grade fallbacks

| Date | Branch | Tool | Reason |
|---|---|---|---|
