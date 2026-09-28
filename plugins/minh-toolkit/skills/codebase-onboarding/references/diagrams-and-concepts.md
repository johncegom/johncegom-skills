# Diagrams and portable concepts

Read this only when the user said yes to the probe in step 1. It adds two things to a normal run: a diagram in `architecture.md`, and a new, separate `general-concepts.md` that the user can carry to a future repo.

## Diagrams (go in `architecture.md`)

Default to two views. The second is nearly free, since step 2 already requires tracing the primary flow:

- **One structure view:** components and their dependency direction (a container/component diagram).
- **One sequence view:** the primary flow already traced in step 2, as a sequence diagram.

Add a state or data-flow view only if the Goal or the business-logic spec actually needs one — a lifecycle with real states, or data crossing a trust boundary. Don't add a view nothing in the specs calls for. Split static structure from runtime behavior into separate views rather than one crowded diagram.

Render as Mermaid, since it's plain text that also renders in GitHub, GitLab, Obsidian, and most IDE previews. **Never paste the diagram into an online renderer** (mermaid.live, kroki, or similar) for a repo that isn't public — that sends the architecture to a third party, and the whole point of saving notes outside the repo was to keep them local.

Every arrow in a diagram is a claim like any other. Add a short edge table under each diagram: edge → `path:line` or **(inferred)**. Step 3's verification pass checks this table the same way it checks prose claims — an unverified arrow is exactly as risky as an unverified sentence.

## General concepts (a new, separate `general-concepts.md`)

The point of this file is that the user can carry it to a completely different repo later. That only works if it contains **nothing specific to this one**: no file paths, no `path:line`, no product, service, or domain names, nothing that would identify the repo. The instance evidence stays where it already lives — in `architecture.md` and `business-logic.md` — tagged `Concept: <name>` pointing at an entry here. Verification (step 3) covers the tag too: the verifier should confirm the tagged instance actually exhibits the named concept, not just that the concept sounds plausible.

Pick 3-7 concepts, capped, load-bearing, and tied to the Goal — draw from both specs, including architecture-level ideas (e.g. an idempotency key, an outbox, a ports-and-adapters boundary), not just business rules. Skip trivia ("uses MVC") that doesn't carry real transfer value.

For each concept:

- **Name:** a plain descriptive phrase first ("defer an expensive setup until first real use"). Add a canonical name in parentheses (a well-known pattern name, an architecture-pattern term) only when the match is exact — forcing a canonical label onto something that's only a loose resemblance teaches the wrong thing.
- **Problem it solves,** stated in general terms.
- **Tradeoff, or when it's the wrong choice.**
- **How to spot it in a different codebase:** the recognition signal to look for next time — this is where most of the transfer value lives.

**Swap test before writing an entry down:** would this still be true if the language, framework, and business domain were all different? If the sentence names a library or a domain noun, rewrite it until it doesn't.

For a reference study's `reuse-notes.md` (see step 4 in `SKILL.md`), its "Design patterns" section should point at entries here (`Concept: <name>`) instead of restating them.

## Step 5 additions

Add `general-concepts.md` to the saved-files list, on top of whatever the situation already produces. On a returning run, re-check the swap test on each existing entry before deciding whether it still holds, rather than assuming.
