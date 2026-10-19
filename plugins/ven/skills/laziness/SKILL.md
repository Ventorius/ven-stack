---
name: laziness
description: "Apply when sizing a change, reviewing a diff that grew, or tempted to add an abstraction, layer, option or helper. Make the smallest change that solves the problem, and delete before you add."
metadata:
  layer: L2
  source: cursor/plugins@1e5c90a:pstack/skills/principle-laziness-protocol/SKILL.md + pstack/skills/principle-subtract-before-you-add/SKILL.md
  license: MIT
---

# Laziness

Make the smallest change that solves the problem. Remove before you build. Every line you add is a line someone has to read, test and keep correct.

**Why:** Diffs grow by accretion: a helper for one caller, an option nobody sets, a guard for a case that never happens. Each looks cheap alone. Together they bury the change a reviewer needs to see, and they outlive the task that added them.

**Pattern:**
- **One decision, one place.** When the same choice shows up in several spots, make it once behind a single source of truth and pass the result down as a plain value.
- **Subtract first.** Before adding, delete the dead code, stale stubs and redundant checks in the area you touch. Build on the smaller base.
- **Build for observed use.** Handle the cases the spec and real callers need. No speculative parameters, extension points or validators.
- **Cut before you polish.** Reach the minimum that works, then spend effort on quality.
- **Reuse before you write.** Look for an existing function, command or pattern in the repo before adding a new one.
- **Plain beats clever.** Three plain lines that repeat cost less than an abstraction with one user.

**The test:**
- Could the diff be smaller and still solve the problem? Then make it smaller.
- Does every new parameter, branch, file and dependency have a caller today?
- Is the touched area simpler than you found it, or at least no more complex?

**Stop:** Laziness is about the size of the change, not the effort behind it. Never skip the proof, the test or the real cause to keep a diff small. A one-line fix in the wrong place is not lazy; it is unfinished.
