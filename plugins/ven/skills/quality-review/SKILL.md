---
name: quality-review
description: "Run a strict maintainability review of a branch: hunt for restructurings that delete complexity, file-size blowups, ad-hoc branching and leaky boundaries, and return a block or approve verdict. Use only when the user explicitly asks for a harsh, deep or thermo-nuclear maintainability verdict."
metadata:
  layer: L3
  source: cursor/plugins@1e5c90a:cursor-team-kit/skills/thermo-nuclear-code-quality-review/SKILL.md
  license: MIT
---

# Quality review

One reviewer, one question: does this change leave the code simpler to read, change and delete, or messier? Behavior is assumed correct; **review** owns correctness, security and test honesty. Working code is not enough to approve.

Be ambitious. Don't stop at "this could be a bit cleaner". Look for the restructuring that keeps behavior and makes whole branches, flags, helpers or layers disappear, the one that makes the change look obvious in hindsight. Moving complexity around is not simplifying it.

Never apply fixes inside this skill. The remedies go back to the user; suggest they type `/ven:do restructure <what>, keep behavior` to apply them.

## 1. Scope

- **Diff:** the range the user names, else `git diff $(ven-profile get repo.default_branch)...HEAD` plus uncommitted changes. Confirm it is non-empty.
- **Intent:** one paragraph from the spec (`$(ven-profile path)/specs/`), the commits and the conversation.
- **House rules:** `$(ven-profile path)/conventions.md`, `GLOSSARY.md` and the profile `boundaries` (`ven-profile get boundaries`), when they exist. A pattern the repo follows everywhere is not a finding.

## 2. Measure

Facts first, so findings rest on numbers, not impressions:

- **File size:** for every touched file, its line count at the merge base and now. A file this diff pushes from under 1000 lines to over 1000 is a presumptive blocker.
- **Branching:** new conditionals, flags, optional parameters and mode switches added to code that existed before the diff.
- **Reach:** run `ven-profile adapter graph.imports` (or `graph.boundaries`) and note new edges across modules. No adapter: say so and read imports directly.
- **Duplicates:** for each new helper, search for an existing one that does the same job (`ven-profile adapter code.search --var pattern=<name or shape>`, or a plain search).

On a wide diff, fan these out: one `ven:ven-worker` per measurement (`model: ${user_config.swarm_model}`), each with a read-only brief that returns facts with `file:line`.

## 3. Review

Read the diff and its surroundings, not only the changed lines. For each meaningful change, ask:

- Is there a reframe that makes this dramatically simpler, with fewer concepts, branches or layers? Apply **deep-modules** and **laziness**.
- Did a cohesive module become more coupled, more stateful or harder to scan?
- Is each piece of logic in the layer that owns the concept, using the repo's canonical helper?
- Are repeated conditionals hinting at a missing model, dispatcher or state machine?
- Does an abstraction earn its keep, or is it a pass-through wrapper?
- Do casts, optionality or loose object shapes hide an invariant a clear boundary would state? Apply **type-discipline** and **boundary-discipline**.
- Is a fallback papering over an unclear contract? Apply **fix-root-causes**.
- Is independent work serialized for no reason, or can related updates leave state half-applied? Apply **idempotent-operations**.

[references/smells.md](references/smells.md) lists what to escalate and the remedies to prefer.

## 4. Rank

Order findings by kind, highest first:

1. Structural regressions.
2. Missed reframes that would delete a category of complexity.
3. Branching and special-case growth.
4. Boundary, abstraction and type-contract problems.
5. File size and decomposition.
6. Legibility.

Each finding names `file:line`, what makes the code harder to work with, and a concrete remedy: what to delete, merge or move, and where. "Consider refactoring" is not a finding. Prefer a few high-conviction findings to a long list; if structural problems exist, drop the cosmetic ones.

## 5. Verdict

**Block** when any of these holds and the author has not justified it:

- a visible reframe would delete much of the incidental complexity, and the diff keeps it;
- the diff pushes a file past 1000 lines;
- ad-hoc branching makes an existing flow more tangled, or feature checks are scattered across shared code;
- a new wrapper, abstraction or cast-heavy contract makes the design more indirect;
- the diff duplicates an existing helper or puts logic in the wrong layer when a clear home exists.

**Approve** otherwise, with the remaining findings as follow-ups.

## Tone

Direct and serious; not rude. Don't soften a structural problem into a mild suggestion. If the change makes the code messier, say so. If it missed a dramatic simplification, say that too. Write findings as questions with a proposal: "this adds a third special case to an already busy flow. Can it move behind its own policy so the branches disappear?"

## Report

- **Intent** and the **measurements** from step 2.
- **Verdict:** block or approve, with the blocking findings named.
- **Findings** in rank order: `file:line`, the problem, the remedy.
- **Cleared:** what you checked and found clean.

Run it through **unslop**. Record it: `ven-decisions add --step quality-review --decision "<block|approve>, <n> findings" --evidence "<measurements and files read>"`.

Posting findings on the code host is outward-facing: draft them, show the user, and post with `repo.forge.cli` only after approval.
