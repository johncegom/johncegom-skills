# Diagrams and portable concepts

Read this only when the user said yes to the probe in step 1. It adds a diagram to `architecture.md`, and a new, separate `general-concepts.md` — the one file meant to travel to a future repo.

## Diagrams (go in `architecture.md`)

Default to two views. The second is nearly free, since step 2 already requires tracing the primary flow:

- **One structure view:** components and their dependency direction (a container/component diagram).
- **One sequence view:** the primary flow already traced in step 2, as a sequence diagram.

Add a state or data-flow view only if the Goal or the business-logic spec actually needs one — a lifecycle with real states, or data crossing a trust boundary. Split static structure from runtime behavior into separate views rather than one crowded diagram.

Render as Mermaid — plain text, renders in GitHub, GitLab, Obsidian, and most IDE previews. **Never paste the diagram into an online renderer** (mermaid.live, kroki, or similar) for a repo that isn't public — that sends the architecture to a third party, defeating the point of saving notes outside the repo.

Every arrow is a claim like any other. Add a short edge table under each diagram: edge → `path:line` or **(inferred)**. Step 3's verification pass checks it the same way it checks prose.

## General concepts (a new, separate `general-concepts.md`)

The point of this file is that the user can carry it to a repo they haven't seen yet — including a different job's repo, which is the common case, not the exception. That only works two ways at once: the file must contain **nothing specific to this one repo** (no `path:line`, no product, service, or domain names, nothing that would identify it), and every entry in it must be **true and worth knowing**, not a platitude dressed up as insight. The instructions below exist because the second requirement is the hard one — an instruction to "be general" left unchecked tends to produce safe, obvious sentences, and a safe, obvious sentence is not knowledge worth carrying anywhere.

### Process: draft, then cut

1. **Draft 8-10 candidates** from what step 2 already surfaced — the why-claims in the business-logic spec, a contrast between two places that solve the same problem differently, a test that encodes a past failure, a comment or guard that names one.
2. **Run every candidate through three gates**, in order. A candidate that fails any gate does not become an entry.
3. **Keep the survivors** — zero, one, or a few. There is no floor and no requirement to hit a round number; never add an entry just to pad the list. Cap at 5.
4. **Write a short "Considered and cut" section**, one repo-free line per rejected candidate and why (e.g. "true, but the obvious default — not worth writing down", "no real evidence for why, just a guess"). This is not a failure report: a short kept list next to an honest cut list is a finished judgment, not a thin one.

### The three gates

- **Grounding gate.** The candidate must be traceable to real evidence the repo itself provides: a commit message or revert, an ADR or decision log, a test that encodes a past failure, a guard or comment that names a failure it prevents, or two places in the code that solve the same problem differently on purpose. "I noticed this pattern while reading" does not qualify on its own — everything here already has to clear step 2's own why-claim evidence bar.
- **Deviation gate.** State three things: the default a competent engineer would reach for, what this repo did instead, and the concrete failure or cost that made the default the wrong choice here. If the code just does the ordinary, expected thing, it is not a concept — competence isn't insight.
- **Swap gate.** Would the entry still be true if the language, framework, and business domain were all different? If a sentence names a library or a domain noun, rewrite it until it doesn't, or cut it.

### Per-entry shape

For each surviving concept:

- **Name:** a plain descriptive phrase first ("defer an expensive setup until first real use"). Add a canonical pattern name in parentheses only when the match is exact — forcing a canonical label onto a loose resemblance teaches the wrong thing.
- **Default vs. deviation:** the three things the deviation gate required, written out.
- **Reach for it when / avoid it when:** the conditions under which the tradeoff flips — this is where the entry becomes something the user can actually apply in a different project, not just recognize.
- **How to spot it elsewhere:** the recognition signal to look for in a different codebase.

## Step 3 gets one more job

Alongside verifying `path:line` claims as usual, the verifier also judges each kept concept: could this have been written from just the repo's README and its language, without reading the actual code and history? If yes, it's still a platitude regardless of which gates it nominally passed, and should be cut, not kept. This is the cheapest available check that a concept has real, repo-specific grounding behind its general phrasing.

## Before this feature ships

Run it once against a real repo and report honestly whether the kept entries would have been obvious to a competent engineer who never opened the code. If most of them would, the mechanism isn't working yet — fix the gates, don't ship on the strength of the instructions alone.
