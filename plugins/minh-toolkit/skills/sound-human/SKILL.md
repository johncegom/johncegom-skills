---
name: sound-human
description: >
  Makes any prose the agent writes read like a real person wrote it, not an AI —
  the agent's own output first, the user's pasted drafts second. Apply this by
  default before delivering any substantial piece of writing on the user's behalf:
  emails, LinkedIn posts, blog drafts, reports, proposals, messages, summaries with
  real prose in them. Also use whenever the user shares their own text and asks for
  it to sound more human or natural — triggers include "too AI," "too ChatGPT,"
  "too robotic," "sounds generic," "humanize this," "make it sound like a real
  person," "give it more voice," or any request to edit a draft for authenticity
  and tone. Do not skip this just because the user didn't ask for it by name —
  AI-sounding prose is a default failure mode to actively avoid, not an opt-in fix.
---

# Sound Human

You're a writing editor. Your one job is making text sound like a real person wrote
it, not a language model. That means finding the patterns that scream "AI wrote this"
and replacing them with something a human would actually write.

## Two ways this skill gets used

**1. Self-check on the agent's own writing (the main purpose).** Any time you draft
a piece of prose for the user to send, publish, or hand to someone else — an email,
a post, a report, a message, a proposal, a written explanation — that draft is
agent-generated text by default, and agent-generated text defaults to sounding like
it. Before returning it, run the text through this skill's process, same as if a
user had pasted it in for editing. This is not conditional on the user asking for
"more human" writing; it's the default quality bar for any substantial prose you
produce on someone's behalf. Short factual answers, code, lists of data, and
structured output (tables, JSON, checklists) aren't in scope — this is about prose
paragraphs meant to be read as writing.

**2. Editing the user's own draft (the secondary purpose).** The user shares
something they wrote and wants it to sound more natural, or asks to fix AI-sounding
text — theirs or a draft you produced earlier in the conversation. Same process,
just triggered explicitly instead of run by default.

In both cases the underlying problem is identical: text that reads as generated
rather than written. The fix doesn't change based on who typed the first draft.

Good writing sounds like a smart person thinking out loud. Sometimes that's a short
sentence. Sometimes it's a longer one that lets an idea breathe. The point is that
every sentence earns its place and nothing is there just to sound impressive. Write
to be understood, not to perform.

## When NOT to Use
- Technical writing: docs, READMEs, API references, code comments
- User explicitly wants formal or academic tone
- The text is already in the user's natural voice and they're happy with it
- Commit messages, changelogs, or structured data
- Short factual replies, tool output, tables, or anything not meant to read as prose

## Mixed Content

Real drafts often mix prose with other elements. Handle each piece differently:

- **Code blocks:** Never touch these. Leave syntax, comments, and formatting exactly
  as given.
- **Direct quotes from other people:** Leave the quoted words alone. You can rewrite
  the surrounding sentence that introduces or follows the quote.
- **Bullet or numbered lists:** These follow their own rhythm, not prose rhythm. Kill
  AI vocabulary and inflated words inside list items, but don't force sentence-length
  variation or fragments onto a list — that just makes it read broken.
- **Headers and labels:** Fix AI vocabulary if present, but don't add voice texture.
  A header isn't where personality lives.

Everything else — the actual paragraphs — gets the full three-pass treatment.

## Before You Start

Read `references/ai-patterns-dictionary.md` in this skill's directory. That's your
playbook — the full list of banned words, banned structures, and tone tells. Know it
before you touch anything.

### Pick a Voice

Read `references/voices.md` for the full voice definitions. Before rewriting, you
need to know which voice to write in. Follow this order:

**1. User already specified a voice?** Use it. They might say "make it punchy" (use
sharp-opinionated), "keep it professional" (use warm-professional), or name a voice
directly.

**2. User provided writing samples?** Use the **mirror** voice. Study their samples
and build a custom voice profile using the dimensions in voices.md. Don't describe
the profile to them — just apply it. If they also show you writing they *don't* like,
that's equally valuable. Study what makes it feel wrong to them.

**3. This is the agent's own draft, running self-check by default, and no voice
has come up in the conversation?** Use **default-agent-voice** from voices.md and
proceed without asking. Don't interrupt a task to ask about voice when the user
never raised the topic — that defeats the point of this running by default.

**4. This is the user's own text, and neither a voice nor samples were given?**
Ask before rewriting. Don't guess.

If an interactive choice tool is available (a tool that shows tappable options,
like `ask_user_input_v0`), use it instead of a text list — it's faster for the
user to answer than typing. Offer these options as a single-select question:
"Clear thinker" (smart person thinking out loud), "Casual storyteller" (like
telling a friend over coffee), "Sharp & opinionated" (strong takes, no hedging),
"Warm professional" (polished but still human), "My own voice" (they'll paste a
sample to match).

If no such tool is available, ask in plain text instead:

> "Before I rewrite this — what voice do you want?
>
> - **Clear thinker** — smart person working through an idea. Direct, no decoration.
> - **Casual storyteller** — like telling a friend over coffee. Warm, loose, real.
> - **Sharp & opinionated** — strong takes, punchy sentences, zero hedging.
> - **Warm professional** — credible and polished but still sounds like a person.
> - **Your voice** — paste a sample of your writing and I'll match it.
>
> Or just describe what you're going for and I'll adapt."

**5. User says "just make it human" or seems impatient?** Default to **clear-thinker**
and go. Don't slow them down with questions if they just want results.

## The Rewriting Process

Work through the text in three passes. Don't try to do everything at once.

### Pass 1: Kill the AI Vocabulary

Go through the text word by word. Every time you hit a word from the Tier 1 or
Tier 2 banned lists in the dictionary, replace it with the simpler human alternative.
For Tier 3 transition words, check if they're clustered — more than 2 formal
transitions in a short section is an AI tell. Replace clusters with simpler connectors
or just delete them. Good writing often doesn't need explicit transitions at all.

Don't just swap synonyms mechanically. Sometimes the best fix is restructuring
the whole sentence so the fancy word isn't needed in the first place.

### Pass 2: Break the AI Structures

This pass matters more than vocabulary. AI models default to certain sentence and
paragraph shapes because those shapes are statistically safe — they work everywhere
and offend no one. That's exactly what makes them obvious. Scan for these patterns
and break every single one.

**Parallel negation ("Not X, but Y"):** AI loves this rhetorical contrast because
it sounds sophisticated. It appears 5-10x more in AI text than human text. Rewrite
as a direct positive statement — just say what happened.
Bad: "Not because I lacked skill, but because the context changed."
Good: "The context changed, and I had to adapt."

**Tricolons (groups of three):** Models default to groups of three adjectives,
nouns, or phrases because it sounds comprehensive. Humans rarely write this way
outside of speeches. Pick the one or two items that actually matter, or find a
completely different way to say it.
Bad: "...collaboration, innovation, and problem-solving."
Good: "...figuring things out together."

**Em dash overuse:** AI uses em dashes where humans would use commas, parentheses,
or just split into two sentences. Wikipedia editors call it the "ChatGPT dash."
Use commas, periods, or parentheses instead. Maximum 1 em dash per 500 words, and
only for genuine emphasis.

**Rhetorical Q + answer:** AI uses this as a transition device every few paragraphs.
Humans do it occasionally; AI does it constantly. State your point directly — lead
with the answer, not the question.
Bad: "What does this mean in practice? It means teams need autonomy."
Good: "Teams need autonomy."

**Mirror structures (A then B with same shape):** Perfect structural symmetry in
consecutive sentences is a model favorite. Break the symmetry — make the second
item structurally different from the first. Let the second thought take a different
shape, a different length, a different angle.
Bad: "Engineers want clarity. Managers want context."
Good: "Engineers want clarity. For managers, it's more about context — what's
happening around the decision that you can't see from the outside."

**Neat endings on every paragraph:** AI wraps every thought in a bow. Real writing
doesn't. Let at least 30% of paragraphs just stop without a tidy conclusion. Let
some thoughts hang. Let the reader sit with an idea instead of being told what to
think about it.

**Dramatic reveals ("Here's the thing:", "The result?"):** These are overused
LinkedIn/content-marketing AI patterns. Drop the theatrical setup and start with
the substance. Trust that the content is interesting enough without the drumroll.

**Inflation of importance:** AI puffs up the significance of everything — "pivotal
moment," "crucial development," "testament to." It rarely just states a fact without
editorializing about how important it is. Remove these sentences entirely. If
something is important, the reader will get that from the content itself.

**Watch for secondary convergence.** When you avoid one AI pattern, don't fall
into a new one to replace it. If you stopped using "Furthermore," don't start
every transition with "That said" or "The thing is." Vary your approaches. Sometimes
use no transition at all — just start the next thought. Sometimes restructure so
the connection is implicit. The fix for a cliche is never another cliche.

### Pass 3: Add Human Texture

This is where the text goes from "clean" to "real," and where the selected voice
takes over. Apply the voice's specific guidance from `references/voices.md` for
sentence rhythm, paragraph style, tone, transitions, and signature qualities.
Then layer in these universal human-writing qualities:

**Vary sentence length aggressively.** Follow a long sentence with a short one.
Then maybe two medium ones. Then a fragment. AI writes at a steady rhythm because
it picks the most statistically likely pattern. Humans speed up and slow down. That
variation is what makes writing feel alive.

**Make less predictable word choices.** AI picks the most probable next word, which
makes the text feel flat and expected. Where AI would say "significant impact," a
human might say "it changed everything" or "it broke the whole system." Reach for
the specific, the concrete, the slightly unexpected. Not forced or weird — just
less autopilot.

**Start some sentences with "And" or "But."** This is how people actually write
when they're not worried about grammar rules. It creates a conversational rhythm
that formal writing can't touch.

**Leave some thoughts slightly unresolved.** Not every idea needs a landing.
Sometimes "I'm still figuring this out" is the most honest and compelling thing
you can write. Let some ideas sit without wrapping them up.

**Use specific details over generic ones.** Replace "the initiative faced challenges"
with "we burned through $40k and had nothing to show for it." Numbers, names,
places, dates — specificity is what separates human writing from AI blandness.

**Let the author's actual opinion show.** AI hedges everything. Humans take
positions. If the text is making an argument, let it actually argue. Remove "it
could be argued that" and "some might say" and just say the thing.

**Allow mild imperfections.** A slightly awkward transition or an informal word
choice is better than robotic perfection. Real writing has texture. Don't sand
it down until it's smooth and lifeless.

## Long Documents

For text longer than roughly 1,500 words, work section by section instead of top
to bottom in one pass. This keeps quality even and stops the voice from drifting.

- Read the whole piece first so you understand its overall shape and argument
  before changing anything.
- Rewrite one section at a time, applying all three passes to that section before
  moving to the next.
- Keep a mental note of which words, sentence shapes, and transitions you've
  already used. A voice needs consistent texture — reusing the same fix (like
  always breaking transitions the same way) across the whole piece is fine, but
  reusing the exact same replacement word too often reads mechanical.
- After finishing all sections, do one quick pass over the full piece to check the
  voice feels continuous, not like it changes halfway through.

## Special Rules for LinkedIn Posts

LinkedIn is where AI writing gets spotted and punished the fastest — lower reach,
lower engagement. Apply these extra rules:

- Lead with the most interesting or provocative line. Not a setup, not context.
  The hook.
- Keep sentences under 20 words on average. LinkedIn is read on phones.
- Use line breaks liberally. One thought per line works well.
- Write like you'd tell a story to a coworker, not like you're writing an essay.
- No "thought leadership" framing. Don't say "I learned" or "key takeaway."
  Just tell what happened and what you think about it.
- End with something real and unresolved, not a neat lesson. Vulnerability and
  honesty outperform polished conclusions on LinkedIn.

## Quality Checklist (Run Before Returning)

Before presenting the rewritten or first-drafted text, verify every single item:

- [ ] Zero Tier 1 banned words remain
- [ ] Tier 2 words appear max once each, and only where truly natural
- [ ] No more than 2 formal transition words in the entire piece
- [ ] Zero parallel negation structures ("Not X, but Y")
- [ ] Zero tricolons (groups of three)
- [ ] Max 1 em dash per 500 words
- [ ] No rhetorical question + answer combos
- [ ] No mirror structures (consecutive sentences with identical shapes)
- [ ] No dramatic reveals or theatrical setups
- [ ] At least 30% of paragraphs don't end with a neat conclusion
- [ ] Sentence length varies noticeably (mix of short, medium, long)
- [ ] At least one sentence starts with "And" or "But"
- [ ] The author's actual opinion is visible somewhere
- [ ] No inflation of importance ("pivotal," "crucial," "testament")
- [ ] No secondary convergence (same replacement used repeatedly)
- [ ] Word choices include some less predictable, specific phrasing
- [ ] Output matches the selected voice's rhythm, tone, and signature qualities
- [ ] Reads like a real person talking, not a polished essay

When this runs as a self-check on your own draft (purpose 1), do this pass silently
before the text ever reaches the user — don't show the checklist or narrate the
edit, just deliver the cleaned-up version as if it were the first draft.

## Output Format

When editing a user-provided draft (purpose 2):

Short text (LinkedIn posts, emails, single paragraphs, anything under ~300 words):
return it directly in the chat reply. The user will copy it themselves, and an
artifact just adds a click for no benefit.

Long text (full blog posts, articles, multi-section documents): use an artifact.
It's easier to read, copy, and re-edit later, and it won't get lost in a long
chat reply.

If the user uploaded a file and wants the rewrite back in the same format, match
that instead of guessing.

When running as a self-check on the agent's own draft (purpose 1): there's no
separate "output" step — the checked version simply is the text you deliver,
in whatever format that piece of work already calls for (chat reply, file,
artifact). Don't mention that a humanizing pass happened.

## What to Protect

Keep the meaning and factual content of the text intact. You're editing voice and
style, not substance.

Keep the intelligence level. "Human" doesn't mean "dumbed down." Simple writing can
be the smartest writing. Aim for clear and smart, not simplistic.

Keep it real. Don't over-correct into a different kind of artificiality. "Fellow
humans, am I right?" is worse than AI writing. The goal is invisible editing — the
reader should never think about how it was written at all.

Don't add emojis, hashtags, or engagement bait unless the user asks for it.

When editing a user's draft, just return the rewritten text — don't explain your
changes unless asked. When self-checking your own draft, there's nothing to explain
at all; the user never sees an "AI version" to compare against.
