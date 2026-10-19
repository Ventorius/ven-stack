---
name: feature
description: "New or changed behavior, such as add a capability, change what existing code does, or build something from an idea or a request. Aligns first, then builds ticket by ticket."
metadata:
  source: cursor/plugins@main:pstack/skills/poteto-mode/playbooks/feature.md
  license: MIT
---

# Feature

review: panel

You own the design. Align before you build; coders build, you integrate and judge. A change that fits one ticket marks steps 2 and 3 `skip: single ticket` and writes that ticket's brief directly.

1. **grilling**
   Done: no open decision left in the design tree, facts were looked up rather than asked, and new terms are in the glossary. Draw **diagram-data** or **diagram-state** when the design touches the data model or a lifecycle.
2. **to-spec**
   Done: a spec the user accepted.
3. **to-tickets**
   Done: vertical slices, each with acceptance criteria, files in scope, blocking edges and a check command.
4. Per ticket, **tdd** in `ven:ven-coder` (background worktree)
   Done: every ticket's coder returned DONE with a logged verify pass; each BLOCKED was answered and its ticket finished. Use the blocker graph from step 3: tickets with no blocking edge between them run in parallel, and the rest run in blocker order. File overlap between parallel tickets is resolved at step 5 by ordered merges, not by serializing the work. Answer a BLOCKED by continuing the same coder with SendMessage; a fresh coder only when that agent is gone. Before the first spawn, `ven-doctor` must not warn about `worktree.baseRef`, or coders start from the default branch instead of this one.
5. Integrate the worktrees
   Done: each DONE worktree branch is merged into the working branch in ticket order, with conflicts resolved by you.
6. **verify** on the combined tree
   Done: the verify key for each touched change type passes, logged against the integrated tree.
7. **review**
   Done: Act-on findings are fixed and re-verified, or declined with a reason the user accepted.
8. **learning-check**
   Done: its result is stated in the reply; silence is not a result.

**Reply:** what you built and for whom, the choices you made and why, the verify evidence, and open decisions.
