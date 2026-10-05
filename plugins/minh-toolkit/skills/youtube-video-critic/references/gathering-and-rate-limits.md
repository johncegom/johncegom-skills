# Gathering details and rate limits

Detail for Step 1 and the 429 rule in `SKILL.md`, which holds the request-shape triage and the four rate-limit rules. Read this when the request is not a plain full evaluation, or when a youtube-mcp call is rate-limited.

## Request shapes other than a full evaluation

**Already-scoped request.** If `get_transcript_range` is available, fetch only the window the user named and apply the same six angles to it, scoped to what's actually being asked. If it isn't available, fall back to the full transcript and reason about the range manually.

**Claim verification.** When the full transcript isn't already sitting in context from earlier in the conversation: use `search_transcript` first if available — it matches across segment boundaries and returns surrounding context by default. Even so, don't over-trust it: a "no matches" result isn't proof the claim wasn't made (paraphrasing, caption errors, and unusual phrasing can all cause a miss), and a single matched line shouldn't be read as the full meaning. Follow a promising hit with `get_transcript_range` around that timestamp (or widen `search_transcript`'s own context window) to read fuller context before answering. Fall back to the full transcript if neither tool is available, or the search comes back empty and the claim still needs checking. If the full transcript is already in context, just search it directly rather than re-fetching anything.

**Chapters** (`get_chapters`, or the chapters section of `get_video_brief`) are creator-authored (often parsed straight from the video description). Treat them purely as breakpoint hints for the long-video pacing note in Step 3, never as evidence for the six analysis angles in Step 2. Verify what a chapter claims against what the transcript actually contains before relying on it.

**Playlists** (`list_playlist`, `search_playlist`): list the playlist and ask which video(s) to evaluate. Running a full evaluation (each needing a full transcript) across up to 25 videos is a guaranteed rate-limit cascade, not a real batch evaluation.

Download tools (`download_video`, `download_transcript`, etc.) are out of scope: this skill evaluates videos, it doesn't archive them, and saving full transcripts to disk conflicts with the Copyright constraint in `SKILL.md`.

## Rate limits (HTTP 429): extra detail

The four rules are in `SKILL.md`. They apply to any youtube-mcp call anywhere in the flow: a 429 can equally hit a claim-verification `search_transcript`/`get_transcript_range` follow-up, or video 2 or 3 of a multi-link batch. The reason for not retrying or pivoting to another tool (e.g. `search_transcript` after `get_transcript` 429s) is that YouTube's cooldown gets longer the more the limit is hit while still active.

**`get_video_brief` needs an extra check.** As of this writing, its sections (metadata, chapters, transcript, stats) can fail independently: the call can return successfully overall with one section replaced by a failure line, and only a failed *transcript* section sets a hard error on the whole call. Confirm this is still accurate via the tool's own description if in doubt (per Step 0's tool-behavior principle). Don't key 429 detection purely off a top-level error; check each section. If only metadata or chapters failed (transcript succeeded), proceed with a note that that piece of data is incomplete or unavailable. If the transcript section failed, treat it as a full halt.

## Connector setup hints (Step 0)

The connector's `.mcp.json` entry resolves the binary via `${YOUTUBE_MCP_BIN:-youtube-mcp}`. If it's missing, the fix is either putting the Go bin dir (`go env GOPATH`\bin, e.g. via `go install`) on `PATH`, or setting `YOUTUBE_MCP_BIN` to the binary's full path, then fully quitting and reopening Claude Desktop (closing the window alone isn't enough).
