# Concept card template

One card is one concept, in the lecturer's own term. The headings below are in English, with the Vietnamese heading beside each. Write the headings in the language the user asked in.

## Card

```markdown
# <Concept name, in the lecturer's term>
Label: <the course's own label, or none>
Video moments: Lesson 4 (08:10, 21:40), Lesson 6 (05:00)
See also: <earlier card or lesson, if the concept reappears>

## Definition                      (Định nghĩa)
## How to recognise it             (Điều kiện nhận ra)
## Worked example                  (Ví dụ)
![what the picture shows](../images/00-12-30.png)
Why it fits: <from the transcript>
## Counter-example                 (Phản ví dụ)
![what the picture shows](../images/00-21-40.png)
Why it does NOT fit: <from the transcript>
## Pitfalls                        (Cạm bẫy)
## Reliability                     (Độ tin cậy)
Which figures or claims are the lecturer's own, with no evidence shown?
## Self-test                       (Tự thử)
<A task on new material, answered in two sentences.>
```

## How to fill it

- **Definition.** The lecturer's meaning, paraphrased. A short exact quote (under 15 words) only where the wording matters.
- **How to recognise it.** The observable conditions the lecturer gave. Not your own checklist.
- **Worked example and Counter-example.** The two sections that teach the boundary between right and wrong. If the lecturer showed no counter-example, write "Not shown in the lecture". Don't build one.
- **Why it fits / does NOT fit.** Take the reasoning from what was said, not from reading the image.
- **Reliability.** Name each figure or success rate and say it is the lecturer's claim and whether the lecture backed it up. This section keeps the reader sceptical, so keep it even when it is a single line.
- **Self-test.** Ask the reader to apply the concept to something new, find a key point, spot a planted error, or put steps in order. "What did the video say?" teaches recall of the video, not the concept.

Drop any section with nothing to say, except Counter-example and Reliability, where "Not shown" or "No evidence given" is itself the information.

## Missing image

Keep the line and say what to capture:

```markdown
![TODO 00-12-30: the downtrend line drawn from the high to the second high](../images/00-12-30.png)
youtu.be/<ID>?t=750 (open as a full https link)
```

The user saves the frame under that filename and the card renders.

## Folder layout

Name the folder from the lesson or file name. One file per card.

```
<lesson-name>/
├── index.md
├── cards/
│   ├── 01-<concept>.md
│   └── 02-<concept>.md
├── <appendix>.md          (forecasts and opinions, if any)
└── images/
    ├── 00-12-30.png
    └── 00-21-40.png
```

Cards link images as `../images/00-12-30.png`. The index links cards as `cards/01-<concept>.md`. Start each card file with a link back to the index, and number the cards in lesson order so the file list reads like the lesson.

## Index file

Keep it short:

1. Source: the video and transcript file names, and a line saying the cards are paraphrased and for the user's own study.
2. The term table: "caption says" and "read as", for every term you normalised. Mark guesses.
3. A table of contents: number, card title as a link, and the main video moments.
4. A link to the appendix, if there is one.
