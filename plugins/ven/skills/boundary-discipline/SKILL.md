---
name: boundary-discipline
description: "Apply when wiring validation, error handling, config loading or adapters to the outside world. Parse and check data where it enters or leaves the system, trust it inside, and keep decisions in pure functions behind a thin shell."
metadata:
  layer: L2
  source: cursor/plugins@main:pstack/skills/principle-boundary-discipline/SKILL.md
  license: MIT
---

# Boundary Discipline

Validate, narrow and handle errors where data enters or leaves the system. Inside, trust the types. Keep decisions in pure functions and keep the shell around them thin and mechanical.

**Why:** Checks spread through the call graph are noisy, repeat each other, and still miss the one input that matters. Concentrated at the edge, each value is checked exactly once. Logic wired into a transport, storage or framework can only be tested by standing that thing up.

**Pattern:**
- **At the edge** (arguments, config, environment, network, files, third-party responses, stored rows): parse into domain types, return clear errors, be defensive.
- **Inside:** typed values and propagated errors. No re-validation, no null checks for what the edge already ruled out.
- **Across the edge:** expose domain concepts, not the transport's, storage's or framework's representation. Don't re-export wire or row types through a module's public surface.
- **Mechanism inside, policy at the edge.** General machinery lives in the core; special cases that belong to one caller or one integration live in the adapter that serves it.
- **Pure core, thin shell.** Parsing is raw input to typed state. Rendering is state to output. Scoring and planning are state to result. The shell reads, calls the pure function and writes.
- **Config is parsed at startup**, not looked up and checked deep inside the logic.

**The test:**
- Is this value crossing into or out of the system right here? If not, the check is redundant; delete it.
- Could this logic be a pure function the shell just calls? If yes, pull it out.
- Does a domain module import a transport, storage or framework type? Then the edge leaked inward.

**Stop:** Trusting inside code does not mean trusting data that reached it without being parsed. If some path skips the edge, fix the path; don't add checks downstream to cover for it.
