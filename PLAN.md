# Plan: Dartmouth Study Companion

## 1. The problem, in one paragraph

Studying for exams means digging through slide decks and syllabi by hand, looking for practice beyond the problem sets, with no way to know when you've actually covered everything the course expects. Existing AI tools don't fully solve this: many slide decks are image-heavy and resist text extraction, and even tools that can read them choke on 100-200 slide decks. The content also isn't memorization — in math and CS classes it's often notation and derivations, not flashcard facts.

## 2. What this project actually is

A tool that ingests everything available for a course — slides, syllabus, problem sets, in whatever file format they come in — and builds a structured, internal picture of what the course covers. From that, it generates an unlimited, non-repeating stream of practice material grounded in the actual course content, in whatever form fits the subject. It runs on Dartmouth's own AI access, so there's no external cost to worry about. It's being tested by one person (you) before anyone else touches it.

## 3. The core decision: one real proof of concept, not throwaway phases

Building this as a series of small phases — where phase zero is a toy that gets discarded once phase one starts — doesn't work, because a toy phase zero can't actually be tested the way the real thing will be used. Instead, this gets built as **one integrated pipeline from the start**, with every piece present in a minimal but real form, tested end-to-end as a whole. Only once that whole pipeline is genuinely usable does work shift to adding and refining individual features on top of it.

The full proof of concept is not "generate anything that isn't garbage." It is: **you can create a study plan, upload a real course's materials in any format, and study from it indefinitely with material that is actually useful and doesn't repeat itself.**

## 4. What has to exist for the proof of concept to count as done

All of these need to work together, end to end, before this is considered a real v1 — not as separate phases, but as one connected flow:

- **A place to create a study plan.** You start a new study plan (one per course, most likely) as the container everything else attaches to.
- **Upload, in any format.** PDFs, images, slides, documents — whatever you have for the course goes into that study plan's upload box, no format gatekeeping.
- **Batch processing that pulls out everything it can.** Every uploaded file gets processed to extract as much usable text as possible, including the cases that are just images of slides. This is the piece that existing tools handle badly, and it has to be solid here.
- **Storage of what was extracted.** The extracted material is kept somewhere so it can be reused — a database is enough for now; a fully-featured search layer (vector database) is a deliberate "later," not part of this proof of concept.
- **Unlimited, grounded generation.** Once material is stored, you can keep requesting new practice material indefinitely, and it should keep producing things that are new (not repeats of what you already got) and actually tied to the course content, not generic. The only "limit" to worry about is whether a generation request succeeds or comes back with an error — there's no need to track usage against any kind of budget.
- **A basic way to actually use it.** Enough of an interface that you can create a plan, upload files, and request practice material without digging through logs or code to do it.

**Exit criteria for the whole proof of concept:** you can take a real course of yours, create a plan for it, upload everything you have, and sit down and study from it for as long as you want, getting material that feels like it was made for that specific course.

## 5. After the proof of concept

Once the full pipeline above is genuinely usable, future work becomes additive rather than foundational — things like: more sophisticated retrieval over large amounts of stored material (this is where a vector database would come in), tracking which topics you've drilled versus not, supporting more than one active study plan smoothly, and eventually making it usable by other students. None of this needs to be designed now; it just needs to wait until the core loop is solid.

## 6. Instructions for the agent running this unsupervised

Since no one is reviewing this day to day, the agent should operate in a loop, not a single pass:

1. **Build toward the one proof-of-concept definition in Section 4, not a staged toy version of it.** Every piece (upload, extraction, storage, generation, basic interface) should move forward together rather than one being finished in isolation while others don't exist yet. The test at any point should be "can I actually run the full flow end to end," even if each piece is still rough.
2. **Don't consider any piece done in isolation.** Extraction that works in a test script but isn't wired into storage and generation isn't progress toward the proof of concept — integration is the deliverable, not any one component.
3. **Keep a running log.** Every work session should leave behind a short, dated note of what changed and why, in plain language — this is what lets you (or a future session of the agent) pick up context instantly.
4. **Keep a living backlog**, separate from the current build. Ideas that aren't part of the Section 4 definition — including anything from Section 5 — get written down there, not acted on until the proof of concept is actually done.
5. **Self-test against a real course before calling anything done.** Use genuinely messy, real materials (image-heavy slides, long decks) as the test case, not clean synthetic examples — those are exactly the cases existing tools fail on.
6. **Know when to stop and wait.** Pause and leave a clear, specific question for you instead of guessing when something only you can provide is needed — most commonly a credential or environment variable, or a judgment call about whether generated material is actually good. Never invent placeholder values for things like API keys and move on as if they were real.
7. **Prioritize in this order:** (1) anything broken in the end-to-end flow, (2) whichever piece from Section 4 is weakest relative to the others, (3) only once all of Section 4 is solid, anything from the Section 5 / backlog list.

## 7. The experience has to feel considered, not generated

This matters enough to call out on its own, separate from the functional pieces above, because it's easy for an unsupervised build to default to the blandest possible version of every screen.

- **Don't default to flat and static.** Where a 3D element or a bit of motion would make something feel alive — a hover effect, a transition, a piece of the interface that actually moves — use it. The goal is something that feels crafted, not a bare form with labels.
- **No dashboard-with-emojis-as-icons.** If something needs a dashboard-style view at all, it should use a real icon library and components from an actual UI library, not emoji standing in for icons and not a wall of boxes for the sake of filling space. If a screen doesn't need to exist, don't build it just to have something to show.
- **Keep interaction immediate, not deep.** Uploading a file, starting a study plan, or requesting practice material shouldn't require navigating through several separate pages to get there. Prefer small, in-place interactions — a compact overlay or inline panel for a quick input — over a full-page form or a modal that takes over the whole screen for something that only needed a few fields.
- **The test:** would this feel at home in a well-designed modern app, or does it feel like a default template nobody touched? If it's the latter, it needs another pass before it counts as done.

## 8. How you'll actually use this

Once Section 4's exit criteria are met, the expectation is: you show up, create a plan for one of your real courses, upload everything you have for it, provide whatever credentials are needed, and study from it as a student — not as a developer. Anything that breaks or feels off during that use is the most valuable feedback for what comes next.