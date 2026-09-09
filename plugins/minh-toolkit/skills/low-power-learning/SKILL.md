---
name: low-power-learning
description: >
  Runs a short, near-passive learning session for a user whose brain is tired,
  overloaded, or unable to think, so the learning habit survives without demanding
  generation effort. Use when the user says things like "my brain is fried", "too
  tired to code", "can't think today", "I feel mindless", "brain is mush", "no
  energy but I don't want to skip learning", "give me something easy", or wants to
  keep a streak alive on a low-energy day. Also use, even without an explicit ask,
  when the user is mid-technology and reports fatigue, burnout, or overwhelm. Fully
  standalone; cooperates with learn-technology-by-building and goal-to-code-unblock
  if installed. Do NOT use when the user has normal energy and wants to practice or
  build — active learning or direct help fits better.
---

# Low-Power Learning

Run a 5–15 minute recognition-mode learning session for a depleted brain. The product is habit survival, not content mastery. A tired working memory cannot generate; it can still recognize, follow, and predict between two options. Every design choice below exists to keep effort near zero while keeping learning above zero.

## Core rule

Never ask the user to produce anything from scratch. No blank page, no "explain it back", no open-ended questions, no "what do you think?". Every prompt to the user must be answerable by pointing, pasting, choosing between at most two options, or saying yes/no. If you catch yourself about to ask an open question, convert it to a binary or skip it. The reason: choice and recall both consume working memory, and this user has none to spare.

## Session entry (keep it to one question)

Ask exactly one question: **"How tired, 1 to 3? (1 = can still follow along, 3 = brain is off)"**

Then pick the material and the activity yourself. Do not offer a menu. Do not ask what they want to learn if the answer is already visible in context (see the material ladder below). Selecting for the user is a feature, not laziness — decision fatigue is part of what this skill removes.

## The material source ladder

Familiar material beats new material for a tired brain, because familiarity lowers intrinsic load while re-exposure still strengthens memory. Find material by walking this ladder top-down and stopping at the first rung that works. Never crash or stall because a source is missing.

1. **Ledger or learning profile** — If the learn-technology-by-building skill appears in your available skills, look for its progress record wherever this environment stores state: project files if a filesystem is available, otherwise the agent's memory of past conversations. In Chat mode, use `conversation_search` or `recent_chats` (query on the technology name) to pull up the last checkpoint instead of reading a file. Check availability first; if the skill or any record is absent, fall through silently — never tell the user to install anything mid-session.
2. **Past low-power sessions** — Before asking the user anything, search for prior contact logs (see below). In Chat mode this means `conversation_search` for this skill's own past sessions on the same topic. If a recent one exists, reuse its topic and material directly — this is what makes the skill get cheaper over time even with zero filesystem.
3. **User's own artifacts, asked for cheaply** — Ask one low-effort question: "Paste any code you wrote recently, or just name the topic you're learning." Pasting is pointing, not thinking, so it respects the core rule. Skip this question entirely if the user already said they have nothing to show — go straight to rung 5 with whatever topic they named.
4. **Conversation history** — If this same chat already contains code or a named topic from earlier turns, reuse it directly and skip the question in rung 3. Cheapest rung of all: zero user effort.
5. **Canonical micro-material (last resort)** — The user can only name a topic and has nothing to paste. Generate one tiny canonical snippet (under 10 lines) of the most standard pattern in that topic and run the session on it. Keep it tiny because new material raises intrinsic load; keep it canonical because standard patterns will reappear in any future tutorial, so today's passive exposure becomes tomorrow's pre-familiarity.

## Activity menu (the agent picks; ordered lowest effort first)

Match the pick to the tiredness score: 3 → activities 1 or 4; 2 → activities 2 or 3; 1 → activities 2, 3, or 5. Within a session, one or two activities maximum.

1. **Guided reading of their own code.** Walk through code the user already wrote, narrating what each part does and why, in short plain sentences. The user only reads. This is spaced re-exposure with zero generation cost.
2. **Prediction-lite.** Show a tiny snippet and ask one binary question: "Will this print A or B?" or "Does this compile: yes or no?" Recognition beats pure re-reading because it forces one micro-retrieval, but a two-option choice needs far less working memory than free recall. One question at a time; three questions maximum per session.
3. **Trace along a diagram.** Render a small diagram (Mermaid or the visual tool available) of something the user already built or is learning, then trace one path through it out loud, arrow by arrow. The user just follows with their eyes. No redraw request, ever, in this mode.
4. **Story mode.** Explain one concept as a short concrete story or metaphor, then map each part of the metaphor back to the real mechanism and say where the metaphor stops being true. Pure listening; lowest effort on the menu.
5. **Tomorrow's map.** Preview the next thing they will build or learn, in plain words: what it is, why it matters, what it will feel like. This is the advance-organizer effect — pre-exposure today makes the real session cheaper tomorrow, so ten tired minutes now buy back capacity later.

## Session rules

- **Hard stop at 15 minutes of content.** Keep each turn short. When the session's one or two activities are done, close warmly and stop. Do not extend, do not add "one more thing". A tired brain leaks attention fast, and ending on a positive note protects the habit — which is the real product here.
- **No mastery is recorded.** Recognition does not equal the ability to generate. Log the session as "contact only" (see contact log below). If recognition sessions counted as real progress, the user would build an illusion of competence — the classic failure of passive learning.
- **Tone: warm, low-pressure, zero guilt.** Never mention what they "should" be doing, missed checkpoints, or how behind they are. Never frame the session as lesser; frame it as keeping the connection alive.
- **Wrong answers cost nothing.** If a prediction-lite answer is wrong, give the right answer in one friendly sentence and move on. No follow-up drill, no "let's dig into why".

## Contact log (the micro-ledger this skill produces)

End every session with the same 3-line format, shown to the user in chat regardless of environment:

```
- date: <today> | topic: <what was touched> | material: <snippet/diagram/story seen> | activity: <menu item> | note: <one binary answered, or "listen only">
```

Storage depends on what tools exist right now — check, don't assume:

- **Filesystem available (Code, Cowork, or computer use):** append it to `contact-log.md` in the project or working directory.
- **No filesystem (plain Chat mode):** the log lives in the conversation itself, which is enough — rung 2 of the ladder retrieves it next time via `conversation_search`/`recent_chats`. If durable cross-chat memory editing is available, also add a one-line memory note (topic + date only, not the full log) so a plain "how's my learning going" question can surface it even without a topic keyword to search on.

Two reasons this exists. First, it feeds rung 2 of the ladder: the next low-power session gets cheaper because the skill remembers what was touched, in any mode. Second, it is an export format: if the user later uses learn-technology-by-building in an environment where it can read files, that skill can import these lines into its ledger. The dependency stays optional and bidirectional — an adapter, not a requirement — no matter which mode either skill runs in.

## Exit ramp (optional, offered once)

If the user answers three binary questions quickly and correctly, tiredness may have lifted now that friction is gone. Offer exactly one small generation step: "Feeling okay? Want to change one value in this snippet and predict what happens?"

- If **yes** and the goal-to-code-unblock skill appears in your available skills, hand off to it for that one step, then return here to close the session.
- If **yes** and that skill is not installed, run a restrained miniature inline: ask them to state a one-sentence goal for the one change, let them write the one line, review it kindly, and stop there. Do not expand into a full exercise.
- If **no**, that answer is final. Close the session. Never re-ask, never nudge again this session — re-asking converts a rest day into pressure, which is the exact failure this skill prevents.

## Guardrails

- Do not mention learn-technology-by-building or goal-to-code-unblock by name unless they actually appear in your current available skills — check first, and fall back silently to the ladder and the inline miniature above if they are missing.
- Do not ask more than two questions total before content starts (the tiredness score, plus at most the rung-3 material question).
- Do not present option menus, roadmaps, or plans — this session has no future obligations attached.
- Do not assign homework, reading, videos, or "try this later" tasks.
- Do not run more than three binary questions, two activities, or 15 minutes of content in one session.
- Do not mark any concept as learned, completed, or mastered; log contact only.
- Do not diagnose the user's fatigue or give health advice; if the user describes serious burnout or distress, respond with care as a person first and set the learning session aside.

## One-line summary

**One tiredness question → familiar material via the source ladder → one or two passive activities → 3-line contact log → warm stop.** The user points, chooses between two, or just listens; the agent does everything else.
