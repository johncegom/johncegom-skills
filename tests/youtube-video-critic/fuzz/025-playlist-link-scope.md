---
id: 025
skill: youtube-video-critic
target: Whether a shared playlist link is scoped down (list + ask) instead of auto-evaluated in bulk
category: scope-control
status: pass
last_verified: 2026-09-15
---

## Scenario
The user shares a YouTube playlist URL (not a single-video link) and asks something like "is this
worth watching," phrased the same way a single-video evaluation request would be.

Traced by re-reading the new "Playlists" paragraph in Step 1 against Step 1's existing "if the
user gives more than one link, repeat this for each video" multi-video rule and the "Handling rate
limits" section, to check whether the model would conflate a playlist link with a multi-link batch
and attempt a full evaluation (each needing a full transcript) across every entry, which the
25-video playlist cap would turn into a guaranteed rate-limit cascade.

## Input
N/A — doc-gap trace, no live API call.

## Expected behavior
- The model recognizes a playlist URL as a distinct case from Step 1's "user gives more than one
  link" rule (which is about several separate video links in one message, not one playlist link
  containing many videos).
- Instead of calling `list_playlist` and then running a full Step 1-5 evaluation on every entry,
  the model lists the playlist's videos and asks the user which one(s) they want evaluated.
- No automatic bulk evaluation is attempted without that clarification, even though `list_playlist`
  and `search_playlist` are both available and technically capable of returning all entries.

## Result
Pass. The new Step 1 paragraph is explicit: "this skill evaluates videos, not playlists in bulk. If
the user shares a playlist link, list it and ask which video(s) they want evaluated rather than
auto-evaluating every entry — running a full evaluation... across up to 25 videos is a guaranteed
rate-limit cascade, not a real batch evaluation." This is stated as its own rule ahead of the
existing multi-link rule, so a playlist link cannot be silently folded into the "repeat this for
each video" multi-video path. No conflict found with Step 1's multi-video handling (which still
applies once the user names specific videos from the list) or the 429 section's per-video
degradation rule (which remains the right behavior once evaluation actually starts on the
user-selected videos).
