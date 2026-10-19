---
name: improve-architecture
description: "Find shallow modules worth deepening, present ranked candidates, choose one with the user and plan it as small green steps. Use when code is hard to change or test, before a refactor, or when the user asks where the architecture hurts."
metadata:
  layer: L3
  source: mattpocock/skills@49dd158:skills/engineering/improve-codebase-architecture/SKILL.md
  license: MIT
---

# Improve architecture

Surface friction and propose **deepening opportunities**: changes that turn shallow modules into deep ones, for testability and for agents finding their way. Apply **deep-modules** and use its terms exactly (module, interface, depth, seam, adapter, leverage, locality). Never a big-bang rewrite.

Read `$(ven-profile path)/GLOSSARY.md` and `$(ven-profile path)/adr/` first. Glossary terms name good seams. ADRs are not relitigated: surface a candidate that contradicts one only when the friction is real, marked "contradicts ADR-NNNN, worth reopening because ...".

## 1. Scope

Deepening pays off where code keeps changing, so decide where to look before looking.

- The user named a module, area or pain point: take it.
- Otherwise find hot spots: the files that change most in recent history (`git log --name-only` over a few months), plus `ven-profile get risk_areas`. If `ven-profile adapter graph.imports` works, use its edges to see what leans on the hot spots. Scattered churn means widen the net.

## 2. Explore

Walk the scoped code yourself, or for a wide scope send one read-only `ven:ven-worker` per area (`model: ${user_config.swarm_model}`) with the paths and the questions below, returning findings with `file:line`. Note where you feel friction:

- Understanding one concept means bouncing between many small modules.
- An interface is nearly as complex as its implementation.
- Pure functions were pulled out for testability, but the bugs live in how they are called.
- Modules leak across their seams.
- Code is untested, or hard to test through its current interface.

Apply the deletion test to each suspect. Keep the ones where deleting would concentrate complexity.

## 3. Present candidates

For each candidate:

- **Files:** the modules involved.
- **Problem:** the friction, with `file:line` evidence.
- **Change:** in plain words, no interface proposal yet.
- **Gain:** in locality and leverage, and how tests improve.
- **Before and after:** a small sketch, captioned `HYPOTHESIS`.
- **Strength:** Strong, Worth exploring, or Speculative.

Draw all the sketches on one page, `arch-candidates`. Render it per **Rendering** in the badge protocol of **diagram-deps**. End with your top recommendation and why. Then ask which one to explore (AskUserQuestion when available).

## 4. Settle the chosen one

Run **grilling** on it: constraints, dependencies, the shape of the deepened module, what sits behind the seam, which tests survive. To compare interface designs, design it twice as **deep-modules** describes. Terms and decisions go through **glossary** as they settle; a candidate the user rejects with a lasting reason becomes an ADR there, so it isn't suggested again.

## 5. Plan small green steps

Apply **sequence-verifiable-units**. A typical order:

1. Pin current behavior with tests at the seam that will survive, if the refactor playbook hasn't already.
2. Add the deep module beside the old code.
3. Move callers over in batches; mechanical batches go to **sweep**.
4. Replace tests on the old shallow parts with tests at the new interface.
5. Delete the old path once nothing calls it.

Each step ends green under `ven-profile verify <key>` for the change types it touches. Slice the steps into tickets with **to-tickets** when there are more than a few.

Record: `ven-decisions add --step improve-architecture --decision "<candidate chosen>, <n> steps" --evidence "<files>"`.
