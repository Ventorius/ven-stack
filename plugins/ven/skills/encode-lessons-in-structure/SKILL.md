---
name: encode-lessons-in-structure
description: "Apply when you write the same instruction a second time, get corrected for a repeat mistake, or see a recurring failure. Encode the lesson in the strongest mechanism that can hold it, not in more text."
metadata:
  layer: L2
  source: poteto/brainmaxxing@main:brain/principles/encode-lessons-in-structure.md
  license: MIT
---

# Encode Lessons in Structure

Turn a recurring fix into a mechanism that enforces it, not another line of instructions. Every correction, failed check and surprise is a signal: capture it, put it where it gets enforced, and close the loop.

**Why:** Written instructions get skipped. They depend on the reader noticing, remembering and complying. A type, a rule or a hook enforces itself every time, for every agent and every person.

**Pattern:** put the lesson on the highest step that can hold it.
1. **Type or architecture.** Make the wrong code impossible to write: a type that can't hold the bad value, a module that hides the dangerous call, a single entry point.
2. **Boundary rule.** An import rule saying one layer never depends on another.
3. **Lint or structural rule.** A pattern check run by the repo's linter or structural search tool.
4. **Hook.** A check at edit or command time, for what only shows up then. A blocking hook prints why, so the block itself teaches.
5. **A line in a skill.** One sentence, with an example of the failure, in the skill that does that work. For lessons that need judgment.
6. **A pointer in the repo map.** Only when the agent needs to know a tool or file exists.

A check counts only once it fails on the original mistake and passes on the fix. Run it against the bad version before you trust it.

**Corollary:** If the fix is structural, use only the structural fix and delete the instruction it replaces. The instruction was the symptom.

**Promotion rule.** The single threshold every learning skill uses:
- A mistake class seen in 2 independent sessions or PRs is promoted to a check, at the highest step above that can state it. Several comments on one PR, or repeats inside one session, count once.
- A pack skill or playbook needs 3 real instances of the same cause or task shape. Fewer than 3 stays a solution entry or a watch item.
- Corrections are counted from the decisions log first (`ven-decisions list --step correction`); transcripts are the fallback.

**Close the loop:**
- One-off: note it and move on. Recurring: encode it on the highest step that holds it. Systemic: raise it as a principle.
- Apply the fix now, or leave a concrete task naming the step and the file.

**Stop:**
- "I'll keep that in mind" persists nothing.
- A note saying a rule should exist is waste until the rule exists.
- Fixing one instance while the pattern stays open is fixing without generalizing.
