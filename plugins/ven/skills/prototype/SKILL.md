---
name: prototype
description: "Build throwaway code that answers one design question, either a clickable state-model demo or switchable visual variants. Use when the user wants to feel out logic, a state model or a screen before committing to a design."
metadata:
  layer: L3
  source: mattpocock/skills@49dd158:skills/engineering/prototype/SKILL.md + LOGIC.md + UI.md
  license: MIT
---

# Prototype

A prototype is throwaway code that answers one question. The question decides its shape. No question, no prototype: settle what is being decided first.

## Pick the branch

- **"Does this logic or state model feel right?"** Read [references/logic.md](references/logic.md): a single self-contained page that drives the model through hard cases, usable by a non-developer.
- **"What should this look like?"** Read [references/visual.md](references/visual.md): several structurally different variants on one screen, with a switcher.

Picking wrong wastes the whole prototype. If the question is ambiguous and the user is not around, follow the surrounding code (a module points to logic, a screen points to visual) and state the assumption at the top of the prototype.

## Rules for both

1. **Throwaway, and marked as such.** Put it next to the code it is for, named so a reader sees `prototype` in the path. Follow the repo's existing conventions for where screens and modules live; don't invent a new top-level structure.
2. **Trivial to run.** A logic demo opens by double-click. A visual prototype starts with the profile's run command: `ven-profile get commands.run`.
   - `verified`: start it with `ven-profile run commands.run`.
   - `manual` (dev servers usually are): don't start it. Tell the user the exact command from the leaf's `run`, what it `requires`, and what to open.
   - Missing: say so and ask the user how they start the app.
3. **No persistence by default.** State lives in memory. If persistence is the question, use a scratch store named so anyone sees it is safe to wipe.
4. **No polish.** No tests, no error handling beyond what keeps it runnable, no abstractions, no generalizing.
5. **Show the state.** After every action or variant switch, render the full relevant state so the user sees what changed.
6. **Look before you hand over.** Run it once yourself and check that each action or switch does what you claim. Here the observation is the test.

## Hand over

Reply with: the question, the variants or scenarios built, what you observed, your recommendation, how to run it, and a plain statement that it is throwaway. The interesting feedback is "that shouldn't be possible" or "the header from B with the list from C"; that is the real design. Add scenarios or variants when asked.

## Capture

Once the question is answered:

1. Write the answer (question, verdict, why) into the spec or ticket it informs.
2. Fold the validated decision into real code properly, with tests. Never promote prototype code as is.
3. Commit the prototype to a throwaway branch named `prototype/<slug>`, never the default branch, and note that branch next to the answer. The default branch keeps only the decision.
4. Record: `ven-decisions add --step prototype --decision "<question>: <answer>" --evidence "prototype/<slug>"`.
