---
name: sequence-verifiable-units
description: "Apply to multi-step work (runs of similar edits, staged changes, long refactors) and to how commits and pull requests are stacked. Split work into small units that each end in a checkable state, check each before the next, and order delivery so it proves itself."
metadata:
  layer: L2
  source: cursor/plugins@1e5c90a:pstack/skills/principle-sequence-verifiable-units/SKILL.md
  license: MIT
---

# Sequence Verifiable Units

Break multi-step work into small units that each end in a state you can check. Check each one before starting the next, and order what you deliver so the sequence proves itself.

**Why:** A break caught in the unit that caused it is cheap to find. A break caught after a batch is buried under later work that was built on top of it. The same units, delivered in order, let a reviewer watch the work go red, then green, instead of taking it on trust.

**Execution:**
- Start from known-good: rebase onto a clean trunk and run the check once, so any later failure is yours.
- One unit is one bracket: a known-good state, one change, the check, then move on.
- Never advance on red. Fix the unit or revert it; don't stack the next change on a failure.
- Keep units small enough that a failure points at one change. If localizing a failure takes a search, the units were too big.
- When a script makes the edits, the per-unit check is almost free. Run it anyway.

**Delivery:**
- Stack commits and pull requests in the order that argues for the work. The usual shape is the failing test first, then the fix on top.
- Other good orders: the deletion before the reshape, the baseline measurement before the change, the scaffold before the feature.
- Each commit builds and passes on its own, so a reviewer can stop at any one of them.

**The test:** Could someone take the commit list and check every step without asking you anything?

**Stop:** Don't split for its own sake. A unit with no checkable end state isn't a unit; fold it into its neighbor.
