---
name: how
description: "Explain how part of this codebase works (components, runtime flow, where things live) with every claim citing code. Use for 'how does X work', walkthroughs before changing code, and placement questions like 'where should this live' or 'which module owns this'."
metadata:
  layer: L3
  source: cursor/plugins@main:pstack/skills/how/SKILL.md
  license: MIT
---

# How

Answer "how does X work" at the depth a senior engineer needs to start working in the area: a working mental model, not annotated source. Every claim about the code cites `file:line`.

## 1. Scope

State your reading of the question in one line, then explore; the user can redirect. Map domain words to code names with `$(ven-profile path)/GLOSSARY.md`.

- **Simple:** one module, one function, a narrow question. Explore and explain yourself, then go to step 4.
- **Complex:** a subsystem across files or workspaces, a cross-cutting feature, an architecture overview. Go to step 2.

When unsure, take the simple path. You can still fan out if you hit a wall.

## 2. Explore (complex only)

Split the question into 2 to 4 angles that don't overlap, for example: the data model and its state; the entry points and runtime flow; storage and outside calls. Spawn one explorer per angle in one message: `subagent_type: ven:ven-worker`, `model: ${user_config.swarm_model}`, with the brief from `references/explorer.md`.

Give explorers tool output to start from where it exists: `ven-profile adapter code.search --var pattern=<symbol>` and `ven-profile adapter graph.imports`. Without the adapters they search and read files.

## 3. Synthesize (complex only)

You are the explainer, on the orchestrator tier. Reconcile the explorers' findings: merge overlaps, settle contradictions by reading the code, and keep their open questions open. Read code yourself only to fill a gap, not to redo their work.

## 4. Answer

Write the answer in the shape from `references/explainer.md`, dropping sections that don't apply. Before presenting it, open each cited `file:line` you haven't read yourself. On a long answer, hand the citations to `ven:ven-verifier` (`model: ${user_config.swarm_model}`) per **citation-check**.

**Placement questions** ("where should this live"): name the module that owns the concept, cite the code that shows the ownership, and check the answer against `ven-profile get boundaries` and `$(ven-profile path)/conventions.md`.

## Critique (only when asked)

When the user asks what is wrong with the design, not only how it works: answer first, then spawn two `ven:ven-reviewer`s, blind to each other, with the design and depth lens from **review** over the files your answer cites. Judge their findings into Act on, Consider, Noted and Dismissed as **review** does. Present the explanation first and the critique below it, so a reader who only wants to understand can stop early.
