<!-- eagd-directive:start v=1 -->
**EAGD binding mechanics.** Managed by `bootstrap-eagd-pattern`. Do not edit
between these markers: put a local rule in a paragraph that begins
`**Local override.**` outside them, and change this span only by running the
skill's upgrade. The log is the file named on this document's `**EAGD log:**`
line.

*Precedence.* A `**Local override.**` paragraph outside this span wins over it
for the rows or roles that paragraph names. Any other text elsewhere about
binding rows, judging the `model:` reply or log statuses is superseded by this
span.

*Rows.* A binding is an `eagd-binding:` row keyed by `(role, tool)`. Find the
sub-agent tool you actually hold in your own tool list (do not guess your
vendor) and use the row for your role and that tool whose `status` is `ok` or
`flagged`. Row keys not defined here are owner extensions: pass `effort` if
your tool takes one, and ignore the rest.

*No usable row* (none for your tool, a status other than `ok` or `flagged`, the
row's model is your own, or the spawn errors). Advise and Dream skip: never run
them on your own model or an unknown one, because a same-model "consultation"
looks like a second opinion and is not. Proceed on your recorded leaning, log
the Advise call `SKIPPED reason=<code>` (for example
`no-verified-model-binding`), and say in the PR body or final report that the
role did not run. Grade may fall back to a fresh, context-free call on your own
model, since fresh eyes is its main value; add a Grade-fallbacks row only when
it does.

*Calling a role.* Call that tool with the row's `model`. Advise gets the
question, your leaning with the case for and against, and the artifacts the
decision turns on, verbatim (not your summary, not the transcript), and is
asked to name any context it lacked. Grade gets only the rubric and the
finished output, withholding the reasoning behind it. Dream gets the full run
history. Ask Advise and Dream to begin their reply with `model: <its own id>`.
A call on a `flagged` row is unverified: pass the explicit id and still ask for
that line.

*Judging the `model:` reply.* Take the id after `model:` on the reply's first
line. Normalize it and every id you compare it with, including the row's
`model=`: lowercase, trim surrounding whitespace, remove every quote and
backtick character, then drop one trailing period, then a trailing `-latest`.
Take the first case that fits:
1. It is your own id → set `status=stale`, add a Binding-changes row, and skip
   Advise until it is fixed.
2. It equals `reported=` → proceed.
3. It is uninformative (empty or missing, equal to `model=`, a bare family (an
   id with no digit in it), or a display name, meaning spaces inside the
   normalized id) → as in 1 on an `ok` row; no change on a `flagged` row.
4. Neither it nor `model=` contains the other → as in 1.
5. Otherwise the alias moved. Do not edit the row yourself. On a `flagged` row,
   proceed. On an `ok` row, if you hold an ask-the-user tool
   (`AskUserQuestion` on Claude Code) and are not a sub-agent, ask once per id
   per conversation, showing both ids:
   - "Use `<new>`": set `reported=<new>` (normalized) on every `ok` row with
     this tool and `model=`, add a Binding-changes row, and log the call as
     plain `answered`.
   - "Keep the binding and use the answer": log `answered flag=drift-assumed`
     and name the id in the final report.
   - Any other reply: set `status=stale` and log `SKIPPED reason=drift-declined`.

   If you cannot ask (a sub-agent, or no ask tool), act as "Keep the binding"
   but log `answered flag=drift-unconfirmed`.

*Flagged rows.* Log a call on a `flagged` row as `answered flag=unverified` and
say in the PR body or final report "Advise ran unverified on `<tool>`: the
model override could not be confirmed". Grade on a flagged row runs and adds a
Grade-fallbacks row with `reason=unverified-binding`. Dream marks its entry
`(model unverified)`. If a flagged call returns an informative `model:` reply
that fits `model=`, do not rewrite `reported=`; suggest re-running the skill to
verify.

*Logging.* Add one row per event at the end of its table in the log: Advise
calls (date, branch, question, prior leaning, answer, which was taken, tool,
requested model, reported model, status, changed yes/no), Binding changes
(date, role, tool, old, new, reason; also whenever a row's model, status or
reported id changes), Grade fallbacks (date, branch, tool, reason). An Advise
status is `answered`, `answered flag=unverified`, `answered flag=drift-assumed`,
`answered flag=drift-unconfirmed`, or `SKIPPED reason=<code>` (including
`drift-declined`). A row's `status` is `ok`, `flagged`, `unverified` or `stale`.
<!-- eagd-directive:end -->
