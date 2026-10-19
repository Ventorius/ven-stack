---
name: model-the-domain
description: "Apply when writing stateful logic, or when code branches a lot, keeps flags in sync, or repeats a shape assumption across files. Encode the domain in a data structure so invalid states can't be built and branches disappear."
metadata:
  layer: L2
  source: cursor/plugins@1e5c90a:pstack/skills/principle-model-the-domain/SKILL.md
  license: MIT
---

# Model the Domain

Put the real domain into a data structure instead of spreading it across conditionals. When the structure matches the domain, invalid states can't be represented and whole branches disappear.

**Why:** Choosing the right structure while writing is cheap. Recovering it later looks like a refactor, gets deferred, and meanwhile every new feature adds one more branch to the pile.

**Pattern:** reach for the structure that fits the rules and the way the data is read:
- A state machine instead of scattered booleans, phase flags or lifecycle checks.
- One model type instead of loose parameters that every function re-interprets.
- A lookup table, registry or tagged variant instead of the same branching repeated in several files.
- Commands or events applied by one reducer instead of ad hoc mutation from many places.
- A module that owns one body of domain knowledge, not one step of a pipeline (load, check, transform, save). The order things run in is not who owns them.
- A small module around behavior, ownership or invariants that keep repeating.
- An index, queue, cache, tree or graph when the reads call for one.
- When nothing here fits, write down what the code must never allow and how the data is read, then pick the structure that encodes exactly that.

Name things with the domain's own words, the ones the team and the glossary use.

**The test:** any yes means the structure is missing.
- Does the new feature add one more arm to an existing if/else chain?
- Is there a second flag that has to stay in sync with the first?
- Do phase-named modules each re-check the same domain rule?

**Stop:** Don't force an abstraction. If the current shape is clear, local and unlikely to grow, keep the boring code. Distrust any structure that adds indirection without deleting branches, duplicated rules, invalid states or lifecycle risk.
