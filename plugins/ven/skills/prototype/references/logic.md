# Logic prototype

One self-contained page that lets anyone drive a state model by pressing buttons. Use it when the question is about rules, state transitions or data shape: things that look fine on paper and feel wrong once pushed through real cases.

## 1. State the question

Write the state model and the question in one paragraph, visible at the top of the page (not only in a comment). A prototype that answers the wrong question is pure waste; the paragraph lets anyone check it later.

## 2. Isolate the logic

Put the logic that answers the question in one small, pure block that could be lifted into the real code later. The page around it is throwaway; this block isn't. Pick the shape the question needs, not the one easiest to wire:

- a reducer, `(state, action) → state`, when actions are discrete events;
- a state machine with explicit states and transitions, when "which actions are legal right now" is part of the question;
- a few pure functions over plain data, when there is no current state;
- an object with a clear method surface, when the logic really owns ongoing state.

Keep it pure: it never touches the page, and nothing on the page reaches inside it. The page calls in; nothing flows back.

## 3. Build the page

One file, plain markup with inline style and script, no external dependencies, no build step, no server, so it opens by double-click and survives being sent around. Write it for a non-developer: every label in domain language, from the glossary, never code names.

Top to bottom:

1. **Title and one-line explanation:** the question from step 1.
2. **Current state:** labelled fields, not a raw data dump, re-rendered after every click, with what just changed highlighted.
3. **Free play:** one button per action, always available, in any order.
4. **Guided scenarios:** one tab each, with a short description of the situation and what to watch for, then the buttons to press in order. Starting a scenario resets to a known initial state so it runs the same way every time. Cover the happy path, a tricky edge case, and an attempt at something that should be illegal.

Clean and restrained: readable type, generous spacing, one accent color, no animation.

## 4. Hand over and capture

Send the file or open it for them. When the question is answered, the pure block moves into the real module (rewritten with tests); the page goes to the throwaway branch, where it stays runnable.

## Don't

- Add tests. A prototype that needs tests is no longer a prototype.
- Connect it to a real store. In-memory state, unless persistence is the question.
- Generalize for "later". It answers one question.
- Let the logic touch the page. Then it can't be lifted out.
- Reach for a framework, bundler or server. One file beats all three for this job.
