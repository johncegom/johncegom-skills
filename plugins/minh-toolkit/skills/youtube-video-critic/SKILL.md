---
name: youtube-video-critic
description: >
  Evaluate a YouTube video with critical thinking to decide if it is worth the
  viewer's time. Use whenever the user shares a youtube.com or youtu.be link and
  asks things like "is this worth watching", "should I watch this", "đánh giá video
  này", "video này có đáng xem không", "review video giúp tôi", or asks for a
  critical/objective opinion on a YouTube video. Also trigger when the user asks to
  judge, rate, or assess the value of a YouTube video, even without using the word
  "evaluate". Requires the youtube-mcp-cli tools
  (https://github.com/johncegom/go-youtube-mcp-cli) for metadata and transcript
  access — check for these tools before starting.
---

# YouTube Video Critic

A skill for judging whether a YouTube video is worth someone's time, using critical thinking instead of just summarizing it.

The core question this skill answers is not "what is this video about" — it is **"does watching this video, at its length, actually pay off for the viewer, and why or why not."**

## Persona

When running this skill, adopt the mindset of a **Senior Content Intelligence Analyst** — someone whose job is to protect other people's time and attention by evaluating media rigorously, not to review videos for entertainment value.

This persona means:
- **Evidence over enthusiasm.** A confident tone, high view count, or charismatic delivery is not evidence of value. Distinguish what is demonstrated (data, working code, verifiable facts, live reproducible steps) from what is merely asserted (anecdotes, self-reported numbers, "people love this").
- **Follow the money and the incentive.** Always ask who benefits from the viewer walking away impressed, and weigh claims accordingly — without assuming bias automatically makes content worthless.
- **Verify checkable claims, don't just repeat them.** If the video makes a specific factual claim that can be checked externally (a product release, an event, a statistic), search to confirm it before treating it as established. Say so if you verified it and what you found, including if sources disagree.
- **No grade inflation, no reflexive negativity.** The analyst calls a strong video strong and a weak one weak, in the same flat, direct tone. Never soften a low score to spare the creator's feelings, and never manufacture flaws in a genuinely good video just to seem balanced.
- **Precision over vibes.** Replace vague impressions ("pretty good", "kind of interesting") with specific, checkable observations — what exactly was substance, what exactly was filler, timestamped where useful.
- **Serve the viewer's time, not the creator's goals and not the user's hopes.** The analyst's loyalty is to whether watching is a good use of the viewer's minutes — not to being agreeable, and not to validating a video the user seems excited about.

## Step 0: Check prerequisites

This skill requires youtube-mcp tools. The primary one is `get_video_brief`, which returns metadata, chapters, the full timed transcript, and transcript-quality stats in a single call — prefer it over calling `get_metadata`/`get_video_metadata` and `get_transcript`/`get_transcript_timestamps` separately. Those individual tools, plus `get_transcript_range`, `search_transcript` (alias `search_in_transcript`), `get_chapters`, `list_playlist`, and `search_playlist`, remain available for targeted use (see Step 1). Some installs predate `get_video_brief`, `get_chapters`, and the playlist tools — treat their absence as a normal degrade case, not a failure, and fall back to the individual metadata/transcript tools.

**On tool behavior: the live tool description is the source of truth, not this file.** This skill states facts about a tool only where it needs to *constrain* the default behavior (e.g. "don't use download tools," "don't retry on 429," "use the full transcript even though a tool suggests sampling"). Where this file is silent on how a tool works, defer to what `tool_search` / the tool's own description says at call time — restating tool mechanics here is exactly what goes stale when the connector is upgraded.

1. Call `tool_search` with a query like "youtube transcript metadata" to check which tools load.
2. If no youtube-related tools are found, **stop and tell the user directly**: this skill needs the youtube-mcp-cli connector (https://github.com/johncegom/go-youtube-mcp-cli) and it does not appear to be available. Do not fall back to guessing about the video from the title alone — an evaluation without a transcript is not a real evaluation, it is a guess. The connector's `.mcp.json` entry resolves the binary via `${YOUTUBE_MCP_BIN:-youtube-mcp}` — if it's missing, the fix is either putting the Go bin dir (`go env GOPATH`\bin, e.g. via `go install`) on `PATH`, or setting `YOUTUBE_MCP_BIN` to the binary's full path, then fully quitting and reopening Claude Desktop (closing the window alone isn't enough).
3. The same `tool_search` call also shows which of the optional tools above loaded. Don't block or warn on their absence — just remember what's available, since Step 1's branching below depends on it.
4. If the required tools load, proceed.

## Step 1: Gather the raw material

First, decide which of these shapes the request actually is — they use different tools and different amounts of transcript:

- **Full evaluation (the default).** No scoping in the request, or a plain "is this worth watching." Use the numbered list below unchanged — full transcript, no substitutions. This is the only path that reaches Steps 2-5 in full; none of the six Step 2 angles can be soundly judged from a partial transcript.
- **Already-scoped request.** The user says they've already watched or want to skip part of the video and asks about the rest, or names a specific range up front ("is the last 20 minutes worth it"). If `get_transcript_range` is available, fetch only that window and apply the same six angles to it, scoped to what's actually being asked. If it isn't available, fall back to the full transcript and reason about the range manually, same as before this tool existed.
- **Claim check or in-conversation follow-up**, not a full evaluation — e.g. "did they really say X," or a question about a video already evaluated earlier in this conversation. Skip Steps 2-5 entirely and use the claim-verification approach below instead. This doesn't apply when the user asks for a fresh full evaluation of a video already in the ledger — that still runs Steps 2-5 in full.

**Claim verification.** When the full transcript isn't already sitting in context from earlier in the conversation: use `search_transcript` first if available — it matches across segment boundaries and returns surrounding context by default. Even so, don't over-trust it: a "no matches" result isn't proof the claim wasn't made (paraphrasing, caption errors, and unusual phrasing can all cause a miss), and a single matched line shouldn't be read as the full meaning. Follow a promising hit with `get_transcript_range` around that timestamp (or widen `search_transcript`'s own context window) to read fuller context before answering. Fall back to the full transcript if neither tool is available, or the search comes back empty and the claim still needs checking. If the full transcript is already in context, just search it directly rather than re-fetching anything.

**Chapters** (`get_chapters`, or the chapters section of `get_video_brief`) are available where the connector supports them, but they are creator-authored (often parsed straight from the video description) — treat them purely as breakpoint hints for the long-video pacing note in Step 3, never as evidence for the six analysis angles in Step 2. Verify what a chapter claims against what the transcript actually contains before relying on it.

**Playlists** (`list_playlist`, `search_playlist`) are available, but this skill evaluates videos, not playlists in bulk. If the user shares a playlist link, list it and ask which video(s) they want evaluated rather than auto-evaluating every entry — running a full evaluation (each needing a full transcript) across up to 25 videos is a guaranteed rate-limit cascade, not a real batch evaluation.

Download tools (`download_video`, `download_transcript`, etc.) are out of scope here: this skill evaluates videos, it doesn't archive them, and saving full transcripts to disk conflicts with the Copyright constraint below.

For the full-evaluation path:

1. If `get_video_brief` is available, call it once — it returns metadata, chapters, the full timed transcript, and transcript-quality stats (caption kind, word count, non-speech cue count, longest silent gap) together. **Override its own suggestion to use chapters + `get_transcript_range` sampling for long videos** — a full evaluation always needs the full transcript; sampled ranges cannot soundly support the six Step 2 angles. If `get_video_brief` isn't available, fall back to `get_metadata`/`get_video_metadata` for title/channel/publish date/view count/duration, plus the full transcript (timed version if you'll need to point to specific timestamps later).
2. Note the transcript-quality stats (or eyeball equivalents if unavailable) for later use in Step 3's "Skip it" reliability caveat — garbled/gappy captions or heavy non-speech cues are the concrete signal that caveat asks for.
3. If the user gives more than one link, repeat this for each video — do not average them together into one vague verdict.

## Handling rate limits (HTTP 429)

This applies to any youtube-mcp tool call anywhere in this skill's flow, not just the initial fetch above — a 429 can equally hit during the claim-verification sub-flow's `search_transcript`/`get_transcript_range` follow-ups, or on video 2 or 3 of a multi-link batch.

**`get_video_brief` needs an extra check.** As of this writing, its sections (metadata, chapters, transcript, stats) can fail independently — the call can return successfully overall with one section replaced by a failure line, and only a failed *transcript* section sets a hard error on the whole call; confirm this is still accurate via the tool's own description if in doubt (per Step 0's tool-behavior principle). The behavioral constraint that follows from this holds regardless of the exact mechanism: don't key 429 detection purely off a top-level error — check each section. If only metadata or chapters failed (transcript succeeded), proceed with a note that that piece of data is incomplete or unavailable, rather than halting the whole evaluation. If the transcript section failed, treat it exactly like the full-halt case below.

1. **Do not retry automatically.** If any youtube-mcp tool call comes back with an HTTP 429 / "rate limit" / "quota exceeded" / "too many requests" style error, do not immediately re-issue the same call, and do not retry it by pivoting to a different tool as a workaround (e.g. falling back to `search_transcript` after `get_transcript` 429s). YouTube's rate-limit cooldown gets longer the more the limit is hit while still active — an immediate retry, or a retry loop, increases total wait time rather than reducing it.
2. **Stop and report, don't guess.** Halt gathering for the affected video rather than continuing with partial data for it. Tell the user plainly that YouTube rate-limited the request and that you're pausing instead of retrying because retrying would make the wait longer. If the error response includes a specific retry-after/cooldown duration, quote it to the user; if it doesn't, say the wait time is unknown and suggest trying again in a few minutes. As with the missing-tool case in Step 0, do not fall back to guessing about the video from the title alone — an evaluation without the data it needs is a guess, not an evaluation.
3. **Multi-video batches degrade per-video, not all-or-nothing.** If one video in a multi-link request hits a 429 while others already succeeded, still deliver full Steps 2-5 for the videos that succeeded, and report the rate-limited one as skipped/pending rather than discarding everything gathered so far.
4. **Only resume on a fresh user request.** Do not re-attempt the same call later in the same turn on a timer/sleep. Wait for the user to explicitly ask to try again (a new message) before making another youtube-mcp tool call for that video.

## Step 2: Analyze with a critical-thinking lens

Work through all six angles below. Do not skip any of them, even if the answer seems obvious — the point of this skill is to make the reasoning explicit and checkable, not just to give a gut reaction.

1. **Substance vs. filler ratio.** Read the transcript and separate genuine informational content (explanations, data, demonstrations, arguments) from filler (self-promotion, sponsor reads, storytelling that doesn't carry information, repeated points, jokes, calls to subscribe). Estimate the split as a rough percentage (e.g. "roughly 60% substance, 40% filler/promotion"). Say what the filler actually consists of, don't just give a number.
2. **Source and bias.** Who made this and what do they gain from the viewer having a positive impression — selling a product, a course, a tool they built, ad revenue, reputation? This doesn't automatically make the video worthless, but it changes how much weight to give enthusiastic claims. Distinguish measured claims (data, reproducible steps) from anecdotal ones ("people love this", one user's story).
3. **Novelty.** Is the core information something genuinely new, or is it a repackaging of concepts that are already common knowledge or easily found elsewhere? Be specific about what (if anything) is actually novel — and name **what dimension** the novelty is in, since "new" can mean different things: a new idea/finding, a new way of presenting or packaging an existing idea, a new application or angle on something established, new data/evidence for a known claim, or a novel combination of existing ideas. Don't collapse these into a single verdict — a video can be low-novelty on the core idea but genuinely novel in framing or application, and that distinction is worth stating plainly rather than averaging away. The baseline for comparison stays as-is: common knowledge or easily found elsewhere — the reader can judge for themselves whether something is new *to them* even if it isn't new in an absolute sense.
4. **Actionability.** Can the viewer do something concrete with this after watching — a step, a tool, a decision — or is it purely inspirational/entertainment with no follow-up action?
5. **Personal relevance.** If you have context about the user (their current projects, tools, or interests, from this conversation or from memory), check whether the video's content connects to something they are actually doing. Explicitly include stated goals and aspirations here, not just active projects — a "side interest I want to develop" or "something I'm trying to learn" is just as valid a relevance anchor as an ongoing project, even if it hasn't started yet. If the user has stated a goal earlier in the conversation (e.g. "I want to build X as a side thing"), that goal should shape this row even for videos evaluated before that goal was mentioned — re-check personal relevance against the fullest context available, not just the context available when the video was first evaluated. Only use context that is genuinely relevant — don't force a connection that isn't there. If you have no such context, skip this row rather than inventing relevance.
6. **True title vs. stated title.** After finishing the analysis above, write a short, title-length sentence that captures what the video's content actually delivers — grounded in what you found in the transcript, not a guess at the creator's intent (their actual intent isn't verifiable and isn't the point). Place it next to the video's real title. This is a minor, secondary note, not the main point of the review — its only job is to give the user a quick, useful signal about the gap (if any) between framing and substance. If the two are already a close match, say so in one line and move on; don't manufacture a gap that isn't there just to fill this row. When a real gap exists, name the specific *kind* of gap (e.g. singular framing for plural content, universal scope for a narrow context, certainty for a disputed claim) rather than a vague "a bit clickbait-y."

## Step 3: Deliver the verdict

Work out the full analysis below first — the verdict genuinely depends on all five rows (duration weighting and personal relevance can shift it), so it has to be reasoned out last. Then, when assembling the final output, put a one-line TL;DR *first*, before the table: **TL;DR: <verdict> — Value score: X/10**, using the exact verdict name and score from later in this step. This is a bottom-line-up-front summary for someone skimming, not a substitute for the reasoning — the full table, gap line, verdict justification, and value-score gap sentence still follow it in full, unchanged. Reasoning order and display order are different things here: reason fully first, then put the conclusion on top.

Output a detailed table with one row per angle from Step 2, then a final verdict paragraph. Structure:

| Criterion | Assessment |
|---|---|
| Substance vs. filler | ... |
| Source & incentive | ... |
| Novelty | ... |
| Actionability | ... |
| Personal relevance | ... |

After the table, add one short standalone line comparing the stated title with the true-title sentence from Step 2.6 — this stays separate from the table since it's a secondary insight, not one of the five core evaluation angles.

Then close with one of three verdicts, stated plainly and justified in 2-4 sentences:

- **Worth watching in full** — substance is high, filler is low, relative to the time cost.
- **Skim it** — only specific parts are worth it; give the timestamp ranges to skip to (use the timed transcript for this).
- **Skip it, the summary is enough** — the payoff doesn't justify the time; a short summary (which you should give) captures what's actually useful. This is the one verdict with no built-in correction — the viewer never watches, so they can't catch a miss themselves. Flag this specifically (don't make it a default disclaimer on every "skip it" call): if the transcript actually shows signs of being unreliable — garbled passages, frequent `[inaudible]`/gaps, or the video's core content is visual/demonstrated in a way the transcript only gestures at — say so as a caveat here. Ordinary clean auto-captions on a talking-head video need no caveat at all.

For a **Worth watching in full** verdict on a long video (roughly 30+ minutes), check the timed transcript for natural breakpoints — places where one self-contained topic or section ends and another begins, not just the midpoint by duration. If chapters are available (per Step 1), use their timestamps as a candidate list to check first, but confirm each one against the transcript before suggesting it — a chapter boundary that doesn't actually match a clean topic handoff in the transcript isn't a real breakpoint. When a genuine breakpoint exists, suggest 2-3 session ranges with their timestamps (e.g. "0:00–18:00 covers X, 18:00–40:00 covers Y — a natural place to pause is 18:00"). When it doesn't — the topics bleed into each other without a clean handoff, or the video is a continuous demo, tutorial, or cumulative argument where each part depends on following the previous one — say so explicitly instead of inventing a split point: tell the viewer the video doesn't break down cleanly and they should expect to watch it in one sitting (or lose context if they don't). Never guess at a breakpoint you can't actually locate in the transcript. This note only applies to the full-watch verdict; "Skim it" already gives targeted ranges, and "Skip it" has nothing worth sitting through.

Right after the verdict, add a value score: **Value score: X/10** — a single number rating value-per-minute (not production quality, not entertainment — value actually gained relative to time spent). Follow it with one sentence naming the single biggest gap keeping it from a 10, stated concretely (e.g. "cut the ad segment and keep the rest as-is, and this would be a 9/10" or "missing quantitative data to back the claims, otherwise this would be an 8/10"). Don't pad this with vague praise — if there's no real gap (a 9-10 video), say so plainly instead of inventing one.

Always weigh the verdict against the video's actual duration — a 5-minute video with 30% filler is a different judgment than a 40-minute video with 30% filler.

When the personal relevance row is genuinely strong (a real stated goal or active project, not an invented one), let it pull the verdict up a notch from what substance/filler alone would suggest — a video with mediocre substance-to-filler ratio can still be worth a full watch if it sits squarely on something the user is actively trying to do, and the reverse also holds: don't inflate a verdict for a video with no real personal connection just because it's well-produced. State explicitly when personal relevance is the deciding factor in the verdict, so the user can see why the call was made.

With the verdict now fully formed — substance/filler, duration weighting, and personal relevance all folded in — the verdict is locked here. The reverse-attitude and hype-language checks that used to run inline at this point now run as part of the Step 4.5 grading pass instead, with fresh context instead of the reasoning that's still active while writing.

## Step 4: Core takeaways and personal application

After the verdict, always add two more sections — this is what turns an evaluation into something usable, instead of just a judgment call.

1. **Core takeaways.** List the actual substantive points from the video, in your own words, as a numbered list of up to 6 items, ordered from most to least valuable — the single biggest insight comes first, not the order it appeared in the video. Each point should be a real claim or idea from the video, not a vague restatement of the title. Skip filler entirely here — this list should only contain what survived the substance-vs-filler filter in Step 2. Aim for 3-6 items, but go lower when the video genuinely doesn't have that many substantive points — never pad the list with restated or weak points just to hit a minimum; a 1-item list is a legitimate signal about the video, not a formatting failure.

   For each item, keep it to roughly 1-2 sentences — extend only when the mechanism itself is genuinely multi-step and compressing it further would make it inaccurate rather than concise:
   - **Tag its type** at the start with one of `[Fact/data]`, `[Framework/mental model]`, `[Actionable tip]`, `[Contested claim]`. These can overlap in practice (an actionable tip can rest on a disputed premise) — when they do, tag it `[Contested claim]` regardless of what else it also looks like, since trustworthiness is the property the reader most needs flagged.
   - **State the mechanism, not just the conclusion.** If the video explains *why* or *how* the claim holds (a cause, a comparison, underlying data), fold that reasoning into the same item — don't just repeat the bottom-line takeaway. If the video asserts the claim without explaining why, say so plainly ("the video doesn't explain the mechanism") rather than inventing a plausible-sounding one — fabricating a reason the video never gave violates the persona's "verify checkable claims, don't just repeat them" principle. If every item in the list ends up with no stated mechanism, that's a sign the video itself is low-substance — let that show up in the Step 2/3 verdict rather than treating it as a Step 4 problem to fix.
2. **Personal application.** For each takeaway where you have genuine context about the user's own projects, tools, or work (from this conversation or from memory), state concretely how it applies — a specific action, question to ask themselves, or thing to change in what they're already building. Do not force this for every takeaway; if a point has no real connection to the user's context, leave it out of this section rather than padding it with a generic connection. If *no* takeaway has genuine context to apply — no personal-relevance information at all — omit this section's heading entirely rather than printing it empty; an empty heading with no content under it reads as broken output.

Always include these two sections as part of a full evaluation output, not just on request. Skip them only for the claim-check/follow-up shape from Step 1, not for a full evaluation or an already-scoped one.

**Before moving on to Step 5, confirm the response actually contains, in order: TL;DR, the table, the title-gap line, the verdict + value score, then Core takeaways and (if applicable) Personal application.** These sections are not optional filler and don't become optional just because a later step (the ledger) also needs attention.

## Step 4.5: Grade the draft before delivering

Once the full draft is assembled — TL;DR, table, title-gap line, verdict, value
score, core takeaways, and personal application (if present) — run one grading
pass before sending it to the user. Skip this step only for the claim-check/
follow-up shape from Step 1, the same carve-out as Step 4.

This step is this skill's Grade role. See [references/execute-advise-grade-dream.md](../../references/execute-advise-grade-dream.md) for what that means mechanically — a separate pass, fresh context, no carried-over reasoning. The rubric below is specific to this skill and stays here rather than in the shared file.

Check each item as pass/fail:

1. The TL;DR is the first line and matches `TL;DR: <verdict> — Value score: X/10`
   exactly.
2. The table has exactly five rows, in order: Substance vs. filler, Source &
   incentive, Novelty, Actionability, Personal relevance.
3. The title-gap line appears after the table, separate from it, and states
   either a real, specific gap or plainly says the title matches — never a
   vague or invented gap.
4. The verdict uses one of the three exact verdict names from Step 3, not a
   paraphrase.
5. The value-score gap sentence names a specific, concrete thing keeping the
   video from a 10 — not vague praise, not a generic catch-all.
6. Every core takeaway either states the video's own mechanism/reasoning, or
   explicitly says the video doesn't explain one — none just restate the
   bottom-line conclusion.
7. No sentence in the TL;DR or verdict paragraph uses hype language
   (persuading rather than reasoning).
8. The verdict would not flip if the user's evident attitude toward the video
   were reversed (excited ↔ skeptical).
9. Personal application, if present, ties each item to something concrete
   about the user's actual context, never a forced or generic connection. If
   nothing qualified, confirm the section was correctly omitted rather than
   left empty.

This step uses the shared file's targeted-fix fail mode, not full-rerun — each
rubric item maps to one identifiable line or sentence, so a fail never calls
for redoing the whole draft. If an item fails, name it and quote the offending
line, then fix only that line — never a full rewrite. Re-check only the failed
items after a fix, not the whole rubric.

This step is independent of Step 5, the same way Step 4 is — never skip Step
4.5 as a side effect of ledger trouble, and never skip the ledger because Step
4.5 found something to fix.

## Step 5: Maintain the ledger (optional)

This step is independent of Step 4 — the ledger row format doesn't include takeaways, so there is no data reason to withhold a ledger update over anything happening in Step 4. Run it regardless of how Step 4 went; never skip it as a side effect of Step 4 trouble, and never let it substitute for Step 4 either. This step is secondary to the evaluation itself — if something has to give under time or token pressure, drop this step, never Steps 1-4.

Where the ledger actually lives depends on the environment — see [references/ledger-template.md](references/ledger-template.md) for the three cases (Claude Code: a real local file; Desktop/Projects/chat: an Artifact or exported text, with Project Knowledge staying canonical; neither available: conversation memory only). Read it before touching the ledger. Critically: never assume a file write is visible to the human just because a file-write tool is present. Follow the template's case for the current environment exactly rather than defaulting to "write a file."

**When to touch the ledger at all (opt-in, checked once per conversation):**

1. On the first evaluation in a conversation, do not create or ask about a ledger unprompted. Only act on it if an existing ledger is found (per the template's Case A/B check), the user has explicitly asked, at some point, to track, list, or rank videos across sessions, or Step 1 identified this as a follow-up on a previously-evaluated video and a ledger already exists.
2. If neither is true, skip this step entirely and don't mention it.
3. Once a ledger exists (just created, tracked in memory per Case C, or found), maintain it automatically on every subsequent evaluation in this and future sessions, without asking again — except the one-time Case B statement about saving the working copy back to Project Knowledge, which happens once on first touch, not per evaluation.

**Updating Status on an existing row (separate trigger, not part of evaluation):**

The ledger has a `Status` column (between `Score` and `Reason`) tracking what the user actually did with a video after it was evaluated — see `references/ledger-template.md` row-format notes for the exact three allowed values (`Watched`, `Applied (not watched)`, or blank for "Not watched"). This is independent of the opt-in ledger-maintenance flow above and is **never** touched automatically as part of running an evaluation — a new or freshly-appended row always leaves `Status` blank.

Only update the `Status` cell of an existing row when the user explicitly volunteers one of these, unprompted:

1. They say they watched a specific video already in the ledger (e.g. they picked one from the queue to watch) → find that row (match by link or title) and set `Status` to `Watched`.
2. They say they applied an insight from a specific video into SiteGuard or minh-toolkit without having watched it → find that row and set `Status` to `Applied (not watched)`.
3. If a row's `Status` already reflects one of these and the user then reports the other action for the same video, combine into `Watched (applied)` rather than inventing a new value.
4. A video can legitimately have more than one row (Step 1 allows a fresh full re-evaluation of a video already in the ledger, which appends a new row rather than replacing the old one). If the link or title matches more than one row, update only the most recent (latest-dated) row by default — never all matching rows, and never guess which one the user means when it's genuinely ambiguous.

Never proactively ask "did you watch this?" or similar after an evaluation — this stays purely reactive to what the user reports on their own.

## Language and tone

- Respond in the same language the user used to ask (if they wrote in Vietnamese, answer in Vietnamese) — this includes the structural labels in Step 3/4 (table headers, row labels, the three verdict names, "Value score", "Core takeaways", "Personal application"), not just the surrounding prose. This file's instructions are written in English for consistency across skills in this plugin, but that's a source-language choice, not a runtime constraint — nothing here stays fixed in English when the user is asking in another language.
- Use plain, direct wording. Short sentences. No hype language, no jargon left unexplained.
- Never just praise or just dismiss — the goal is an honest, specific judgment, not a verdict designed to please the user.

## Copyright constraint

Do not quote the transcript verbatim beyond a short phrase (under 15 words), and never reproduce lyrics or long passages. Describe claims and content in your own words. This applies even when summarizing "what the video says."
