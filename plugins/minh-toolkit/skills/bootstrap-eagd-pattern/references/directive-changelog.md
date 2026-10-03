# Directive template changelog

`directive-template.md` is the span installed into each repo's anchor doc.
Every byte change bumps `v` in its start marker, so an installed span can be
told apart from the release it came from. Before editing the template, copy the
current one to `directive-history/v<N>.md` (create the folder at v2), so the
upgrade can compare an installed span with the exact text that release shipped.

`behaviour: yes` means what an agent does changes; `no` means wording or
formatting only. An upgrade is offered when any version between the installed
one and the latest is `behaviour: yes`; across `behaviour: no` versions alone it
says wording-only updates exist and changes nothing unless asked.

## v1 — behaviour: yes
First managed span. Gathers the mechanics that used to be paraphrased into each
install: row selection, the no-usable-row fallbacks, the calling convention, the
five-case judging of the `model:` reply (alias moves ask the owner), flagged
rows, and the log vocabulary. Adds the precedence clause so a
`**Local override.**` paragraph wins over the span and stray older text about
the same rules is superseded.
