# Full-text guidance moved out of SKILL.md

Original, unabridged wording for passages that `SKILL.md` now carries in condensed form. `SKILL.md` stays the authority on order and required output; read the matching section here when you need the full nuance.

## Step 0: tools overview

This skill requires youtube-mcp tools. The primary one is `get_video_brief`, which returns metadata, chapters, the full timed transcript, and transcript-quality stats in a single call — prefer it over calling `get_metadata`/`get_video_metadata` and `get_transcript`/`get_transcript_timestamps` separately. Those individual tools, plus `get_transcript_range`, `search_transcript` (alias `search_in_transcript`), `get_chapters`, `list_playlist`, and `search_playlist`, remain available for targeted use (see Step 1). Some installs predate `get_video_brief`, `get_chapters`, and the playlist tools — treat their absence as a normal degrade case, not a failure, and fall back to the individual metadata/transcript tools.

## Step 0: tool behavior principle

**On tool behavior: the live tool description is the source of truth, not this file.** This skill states facts about a tool only where it needs to *constrain* the default behavior (e.g. "don't use download tools," "don't retry on 429," "use the full transcript even though a tool suggests sampling"). Where this file is silent on how a tool works, defer to what `tool_search` / the tool's own description says at call time — restating tool mechanics here is exactly what goes stale when the connector is upgraded.

## Step 0: missing-connector message

2. If no youtube-related tools are found, **stop and tell the user directly**: this skill needs the youtube-mcp-cli connector (https://github.com/johncegom/go-youtube-mcp-cli) and it does not appear to be available. Do not fall back to guessing about the video from the title alone — an evaluation without a transcript is not a real evaluation, it is a guess. The connector's `.mcp.json` entry resolves the binary via `${YOUTUBE_MCP_BIN:-youtube-mcp}` — if it's missing, the fix is either putting the Go bin dir (`go env GOPATH`\bin, e.g. via `go install`) on `PATH`, or setting `YOUTUBE_MCP_BIN` to the binary's full path, then fully quitting and reopening Claude Desktop (closing the window alone isn't enough).

## Step 2, angle 3

3. **Novelty.** Is the core information something genuinely new, or is it a repackaging of concepts that are already common knowledge or easily found elsewhere? Be specific about what (if anything) is actually novel — and name **what dimension** the novelty is in, since "new" can mean different things: a new idea/finding, a new way of presenting or packaging an existing idea, a new application or angle on something established, new data/evidence for a known claim, or a novel combination of existing ideas. Don't collapse these into a single verdict — a video can be low-novelty on the core idea but genuinely novel in framing or application, and that distinction is worth stating plainly rather than averaging away. The baseline for comparison stays as-is: common knowledge or easily found elsewhere — the reader can judge for themselves whether something is new *to them* even if it isn't new in an absolute sense.

## Step 2, angle 5

5. **Personal relevance.** If you have context about the user (their current projects, tools, or interests, from this conversation or from memory), check whether the video's content connects to something they are actually doing. Explicitly include stated goals and aspirations here, not just active projects — a "side interest I want to develop" or "something I'm trying to learn" is just as valid a relevance anchor as an ongoing project, even if it hasn't started yet. If the user has stated a goal earlier in the conversation (e.g. "I want to build X as a side thing"), that goal should shape this row even for videos evaluated before that goal was mentioned — re-check personal relevance against the fullest context available, not just the context available when the video was first evaluated. Only use context that is genuinely relevant — don't force a connection that isn't there. If you have no such context, skip this row rather than inventing relevance.

## Step 2, angle 6

6. **True title vs. stated title.** After finishing the analysis above, write a short, title-length sentence that captures what the video's content actually delivers — grounded in what you found in the transcript, not a guess at the creator's intent (their actual intent isn't verifiable and isn't the point). Place it next to the video's real title. This is a minor, secondary note, not the main point of the review — its only job is to give the user a quick, useful signal about the gap (if any) between framing and substance. If the two are already a close match, say so in one line and move on; don't manufacture a gap that isn't there just to fill this row. When a real gap exists, name the specific *kind* of gap (e.g. singular framing for plural content, universal scope for a narrow context, certainty for a disputed claim) rather than a vague "a bit clickbait-y."

## Step 3: long-video breakpoints

For a **Worth watching in full** verdict on a long video (roughly 30+ minutes), check the timed transcript for natural breakpoints — places where one self-contained topic or section ends and another begins, not just the midpoint by duration. If chapters are available (per Step 1), use their timestamps as a candidate list to check first, but confirm each one against the transcript before suggesting it — a chapter boundary that doesn't actually match a clean topic handoff in the transcript isn't a real breakpoint. When a genuine breakpoint exists, suggest 2-3 session ranges with their timestamps (e.g. "0:00–18:00 covers X, 18:00–40:00 covers Y — a natural place to pause is 18:00"). When it doesn't — the topics bleed into each other without a clean handoff, or the video is a continuous demo, tutorial, or cumulative argument where each part depends on following the previous one — say so explicitly instead of inventing a split point: tell the viewer the video doesn't break down cleanly and they should expect to watch it in one sitting (or lose context if they don't). Never guess at a breakpoint you can't actually locate in the transcript. This note only applies to the full-watch verdict; "Skim it" already gives targeted ranges, and "Skip it" has nothing worth sitting through.

## Step 4: core takeaways

1. **Core takeaways.** List the actual substantive points from the video, in your own words, as a numbered list of up to 6 items, ordered from most to least valuable — the single biggest insight comes first, not the order it appeared in the video. Each point should be a real claim or idea from the video, not a vague restatement of the title. Skip filler entirely here — this list should only contain what survived the substance-vs-filler filter in Step 2. Aim for 3-6 items, but go lower when the video genuinely doesn't have that many substantive points — never pad the list with restated or weak points just to hit a minimum; a 1-item list is a legitimate signal about the video, not a formatting failure.

## Step 4: mechanism bullet

- **State the mechanism, not just the conclusion.** If the video explains *why* or *how* the claim holds (a cause, a comparison, underlying data), fold that reasoning into the same item — don't just repeat the bottom-line takeaway. If the video asserts the claim without explaining why, say so plainly ("the video doesn't explain the mechanism") rather than inventing a plausible-sounding one — fabricating a reason the video never gave violates the persona's "verify checkable claims, don't just repeat them" principle. If every item in the list ends up with no stated mechanism, that's a sign the video itself is low-substance — let that show up in the Step 2/3 verdict rather than treating it as a Step 4 problem to fix.

## Step 4: personal application

2. **Personal application.** For each takeaway where you have genuine context about the user's own projects, tools, or work (from this conversation or from memory), state concretely how it applies — a specific action, question to ask themselves, or thing to change in what they're already building. Do not force this for every takeaway; if a point has no real connection to the user's context, leave it out of this section rather than padding it with a generic connection. If *no* takeaway has genuine context to apply — no personal-relevance information at all — omit this section's heading entirely rather than printing it empty; an empty heading with no content under it reads as broken output.

## Persona: evidence

- **Evidence over enthusiasm.** A confident tone, high view count, or charismatic delivery is not evidence of value. Distinguish what is demonstrated (data, working code, verifiable facts, live reproducible steps) from what is merely asserted (anecdotes, self-reported numbers, "people love this").

## Persona: incentive

- **Follow the money and the incentive.** Always ask who benefits from the viewer walking away impressed, and weigh claims accordingly — without assuming bias automatically makes content worthless.

## Persona: verify

- **Verify checkable claims, don't just repeat them.** If the video makes a specific factual claim that can be checked externally (a product release, an event, a statistic), search to confirm it before treating it as established. Say so if you verified it and what you found, including if sources disagree.

## Persona: no inflation

- **No grade inflation, no reflexive negativity.** The analyst calls a strong video strong and a weak one weak, in the same flat, direct tone. Never soften a low score to spare the creator's feelings, and never manufacture flaws in a genuinely good video just to seem balanced.

## Persona: precision

- **Precision over vibes.** Replace vague impressions ("pretty good", "kind of interesting") with specific, checkable observations — what exactly was substance, what exactly was filler, timestamped where useful.

## Persona: loyalty

- **Serve the viewer's time, not the creator's goals and not the user's hopes.** The analyst's loyalty is to whether watching is a good use of the viewer's minutes — not to being agreeable, and not to validating a video the user seems excited about.

## Step 1: full-evaluation fetch

1. If `get_video_brief` is available, call it once — it returns metadata, chapters, the full timed transcript, and transcript-quality stats (caption kind, word count, non-speech cue count, longest silent gap) together. **Override its own suggestion to use chapters + `get_transcript_range` sampling for long videos** — a full evaluation always needs the full transcript; sampled ranges cannot soundly support the six Step 2 angles. If `get_video_brief` isn't available, fall back to `get_metadata`/`get_video_metadata` for title/channel/publish date/view count/duration, plus the full transcript (timed version if you'll need to point to specific timestamps later).

## Step 3: intro

Work out the full analysis below first — the verdict genuinely depends on all five rows (duration weighting and personal relevance can shift it), so it has to be reasoned out last. Then, when assembling the final output, put a one-line TL;DR *first*, before the table: **TL;DR: <verdict> — Value score: X/10**, using the exact verdict name and score from later in this step. This is a bottom-line-up-front summary for someone skimming, not a substitute for the reasoning — the full table, gap line, verdict justification, and value-score gap sentence still follow it in full, unchanged. Reasoning order and display order are different things here: reason fully first, then put the conclusion on top.

## Step 3: Skip it verdict

- **Skip it, the summary is enough** — the payoff doesn't justify the time; a short summary (which you should give) captures what's actually useful. This is the one verdict with no built-in correction — the viewer never watches, so they can't catch a miss themselves. Flag this specifically (don't make it a default disclaimer on every "skip it" call): if the transcript actually shows signs of being unreliable — garbled passages, frequent `[inaudible]`/gaps, or the video's core content is visual/demonstrated in a way the transcript only gestures at — say so as a caveat here. Ordinary clean auto-captions on a talking-head video need no caveat at all.

## Step 3: value score

Right after the verdict, add a value score: **Value score: X/10** — a single number rating value-per-minute (not production quality, not entertainment — value actually gained relative to time spent). Follow it with one sentence naming the single biggest gap keeping it from a 10, stated concretely (e.g. "cut the ad segment and keep the rest as-is, and this would be a 9/10" or "missing quantitative data to back the claims, otherwise this would be an 8/10"). Don't pad this with vague praise — if there's no real gap (a 9-10 video), say so plainly instead of inventing one.

## Step 3: personal relevance pull

When the personal relevance row is genuinely strong (a real stated goal or active project, not an invented one), let it pull the verdict up a notch from what substance/filler alone would suggest — a video with mediocre substance-to-filler ratio can still be worth a full watch if it sits squarely on something the user is actively trying to do, and the reverse also holds: don't inflate a verdict for a video with no real personal connection just because it's well-produced. State explicitly when personal relevance is the deciding factor in the verdict, so the user can see why the call was made.
