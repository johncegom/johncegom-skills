---
name: smart-quiz-maker
description: Create and run thoughtful quizzes for almost any subject from a simple request such as “Test me on SQL” or “Help me prepare for an interview.” Use when someone wants a quiz, practice test, interview practice, or questions that check real understanding. Work out the likely level, important topics, difficulty, common mistakes, and question mix. Say what you assumed, ask only when the topic is truly unclear, adjust the quiz based on answers, check facts when needed, and review every question so there is one clearly best answer without obvious guessing clues.
---

# Smart Quiz Maker

Turn a short request into a useful quiz that checks real understanding, not just memory.

Think like a good teacher: work out what matters, explain the choices you made, ask realistic questions, watch how the learner answers, and adjust the next questions.

## Simple flow

1. Read the user's request.
2. Work out what should be tested.
3. Tell the user what you inferred and what is uncertain.
4. Ask a question only if the topic is truly unclear.
5. Create realistic multiple-choice questions with believable wrong answers.
6. Check each question for problems before showing it.
7. If the user is taking the quiz, give questions without revealing answers first.
8. After each answer, explain it and adjust what comes next.
9. When creating a full test, give a short quality check at the end.

## 1. Keep the input simple

Accept requests as short as:

- “Test me on React Native performance.”
- “Prepare me for a senior frontend interview.”
- “Test whether I understand this document.”
- “Quiz my 10-year-old on fractions.”

Do not make the user fill in settings such as learning goals, level, difficulty, question style, or coverage unless that information is truly necessary.

Work those things out yourself when the guess is reasonable and easy to correct.

Ask only when a wrong guess would send the whole quiz in the wrong direction. For example, “Test me on spring” may need clarification because “spring” could mean the season, a mechanical spring, or the Spring software framework.

## 2. Work out what matters

Before writing questions, decide:

- what subject the user means;
- why they likely want the quiz;
- what skills or ideas matter most;
- what background knowledge is needed;
- a sensible starting level;
- useful real-world situations;
- common mistakes worth testing;
- what should be tested through memory and what should be tested through judgment;
- what should be left out because it is trivial, unrelated, unsupported, or outside the request.

Do not turn a broad topic into a list of definition questions by default.

Prefer questions that show whether the learner can recognize when and how to use what they know.

## 3. Say your assumptions out loud

Before the quiz, add a short section titled `How I understood your request`.

Tell the user:

- what you think they are trying to learn or prove;
- the starting level you chose;
- the main areas you will test;
- important assumptions you made;
- anything you chose not to test;
- anything you could not verify;
- any uncertainty that could change the quiz.

Give short conclusions and reasons. Do not reveal hidden step-by-step reasoning.

Example:

> I’m starting at an intermediate practical level because your request sounds like you want to use React Native well, not memorize API names. I’ll focus on debugging, rendering, state, and performance. I don’t know your exact level yet, so I’ll adjust after seeing your answers.

Never present a guess as a fact.

## 4. Test decisions, not just memory

When useful, shape questions like this:

`Situation -> Goal -> What has happened -> Problem or limit -> Best decision`

Ask things such as:

- What should they do next?
- What is the best explanation?
- Which choice fits the evidence best?
- What should be fixed first?
- Which approach is the safest or most useful?
- Which trade-off makes the most sense here?

Use simple memory questions only when remembering the fact is itself important.

## 5. Make one answer clearly best

Before showing a question, make sure the best answer:

- directly solves the stated problem;
- fits the facts in the situation;
- respects the limits given;
- uses the intended idea correctly;
- is stronger than every other choice.

Do not make the right answer easy to spot just because it is longer, more detailed, more technical, or more carefully worded.

## 6. Make wrong answers believable

Wrong answers should usually be mistakes a reasonable learner might make.

Useful patterns include:

- only solving part of the problem;
- solving a nearby problem instead;
- acting too early before checking something important;
- improving the wrong thing;
- choosing a solution that is more complicated than needed;
- following a common misunderstanding;
- using a good method in the wrong situation;
- treating the symptom instead of the cause;
- assuming one thing caused another without enough evidence;
- improving one part while hurting the bigger goal;
- ignoring an important rule or limit in the scenario.

Avoid joke answers or obviously silly choices unless the user wants an easy beginner quiz.

## 7. Set difficulty by thinking depth

Make questions harder by requiring better judgment, not by using obscure words.

- **Beginner:** clear clues and one main idea.
- **Intermediate:** several answers seem possible at first, but one fits the situation best.
- **Advanced:** the learner must weigh limits, missing information, or trade-offs.
- **Expert:** several choices could work, but one is best because of timing, risk, cost, evidence, or wider effects.

If the user's level is unknown, start around intermediate and adjust from their answers.

## 8. Match the subject

Do not force every subject into the same kind of question.

Examples:

- Programming: debugging, design choices, code review, performance, incidents.
- Math: choosing methods, modeling, finding bad assumptions, interpreting results.
- History: evidence, causes, source quality, competing explanations, timing.
- Management: priorities, incentives, communication, team limits, trade-offs.
- Language learning: meaning, usage, error correction, context, production.
- High-stakes subjects: be careful with facts, make uncertainty clear, and verify important claims when possible.

If the user provides source material, use it as the main scope of the quiz unless they ask for outside knowledge too.

## 9. Default test size

If the user does not choose a size, use about 8–12 questions for a full test.

A useful default mix is:

- a few foundation questions;
- mostly practical application questions;
- a smaller number of harder judgment questions.

Do not follow fixed percentages when another mix would fit the subject better.

## 10. Question format

For each question, use:

### Question N

[Short realistic situation]

[Decision question]

A. [choice]

B. [choice]

C. [choice]

D. [choice]

If the user is taking the test, do not reveal the answer immediately.

If the user wants an answer key or teacher version, include:

- **Correct answer**
- **What this checks**
- **Why it is best**
- **Why the other choices are tempting but weaker**

## 11. Prefer an adaptive quiz when the user says “test me”

Give one question at a time unless the user asks for the full test at once.

After each answer:

1. say whether it is correct;
2. explain why;
3. explain why the strongest alternative is weaker;
4. point out any likely misunderstanding;
5. decide what to test next;
6. make the next question easier, similar, or harder based on the evidence.

Do not assume the learner has mastered a topic from one lucky answer.

## 12. Check facts before relying on them

Separate what is known from what is guessed.

Use these labels when useful:

- **Verified:** supported by the user's material or a reliable source you checked.
- **Inferred:** a reasonable conclusion from the request.
- **Unknown:** not enough information to know reliably.

If a fact matters to the question and can be checked, check it.

If it cannot be checked, say so instead of pretending certainty.

## 13. Review every question before showing it

Try to break each question.

Ask:

- Could two answers both be right?
- Can someone guess from repeated words?
- Is the right answer always the longest?
- Does grammar give the answer away?
- Are wrong answers made silly by words like “always” or “never”?
- Is this just a memory question when it should test understanding?
- Does the learner need information that was never given?
- Is the answer based mostly on opinion?
- Would knowledgeable people reasonably split between two choices?
- Are the wrong answers too easy to reject?
- Is the question outside the requested topic?
- Does it depend on unrelated cultural knowledge?

If a question has a real problem, rewrite it before showing it.

For more ways to catch weak or misleading questions, read `references/check-the-quiz.md`.

## 14. Review the whole test too

Before delivering a full test, check:

- answer letters do not form an obvious pattern;
- earlier questions do not reveal later answers;
- questions do not repeat the same idea too much;
- wording does not repeatedly give away the correct choice;
- the difficulty makes sense;
- important areas are not missing;
- scenarios are not repetitive;
- there is no accidental bias toward a brand, method, culture, or viewpoint without reason.

Fix problems before presenting the test.

## 15. Give a short quality note

For a full test or teacher version, end with `Quality check` and mention only useful findings, for example:

- Starting level chosen: Intermediate.
- Main areas covered: 5.
- Questions rewritten because two answers were too close: 2.
- One question removed because it relied on missing information.
- Important factual uncertainty: none found in the supplied material.

If something is still uncertain, say so plainly.

## Core rule

A strong question should feel like this:

> Several answers sound reasonable, but one fits the facts and goal best.

The goal is not to trick the learner. The goal is to see whether they can recognize the situation, use the right idea, and explain why it fits better than the alternatives.
