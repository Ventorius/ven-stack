---
name: ratchet
description: "Turn one correction or mistake class into the strongest check that can state it (type, boundary rule, lint rule, hook, skill line, map pointer) and prove the check fails on the original mistake. Use after a correction, a repeated review comment, or a class from conventions-audit."
metadata:
  layer: L3
  source: cursor/plugins@main:pstack/skills/correct/SKILL.md
  license: MIT
---

# Ratchet

A correction given in conversation is gone by the next session. Turn it into a check placed as high on the ladder as the mistake allows, and prove the check catches the original. Apply **encode-lessons-in-structure**; its promotion rule says when a class is ready for a check (2 independent instances).

## 1. State the class

Write four things: the mistake in one sentence, the right way, the *why*, and the original bad code (a commit, a diff hunk, or a transcript excerpt). Without a concrete bad example there is nothing to prove the check against: find one, or write the smallest code that reproduces the mistake.

## 2. Pick the rung

Start at rung 1 and go down. Stop at the first rung that can state the rule without flagging correct code.

1. **Type or architecture.** Make the wrong code impossible to write: a type that can't hold the bad state, a single entry point, internals hidden so the wrong import fails, one source of truth instead of lists kept in sync by hand. This changes product code, so it runs as a ticket through **tdd**. Proof: the bad fixture fails `ven-profile run commands.typecheck` (or `commands.build`) in a scratch worktree.
2. **Boundary rule.** "Modules under A never import B." Add the rule where the `graph.boundaries` adapter reads it, and append it with its reason to the profile's list (`ven-profile get boundaries`, then `ven-profile set boundaries '<whole list as JSON>'`). Proof: `ven-profile adapter graph.boundaries` reports the bad edge.
3. **Structural or lint rule.** A pattern rule run by `rules.structural` (code shape) or `lint.custom` (the repo's linter with custom rules). The rule lives in the pack's `rules/`, and its error message names the right way. Proof: `ven-profile adapter <capability> --file <bad fixture>` exits 1; on the good fixture it exits 0.
4. **Hook.** For what only shows at edit time: a file changed without its pair, an edit inside generated output. A PreToolUse or PostToolUse script in the pack plugin's `hooks/`. It exits 2 to block and prints the *why* and the right way on stderr, so the block itself teaches. Proof: given the bad tool input as JSON on stdin it exits 2; given the good input it exits 0.
5. **Skill line.** A judgment call no check can decide. One sentence in the pack skill whose paths cover the files: an edit gated by **skill-tdd**, a new skill through **forge-skill**, or, for a convention no skill holds yet, **forge-convention**. Proof: the scenario fails without the line and passes with it.
6. **Map pointer.** Only when the agent must know that a tool or file exists. One line in `$(ven-profile path)/map.md`. No proof is possible; say so.

Where things go: `ven-profile packs-for <files the class touches>` names the pack; its directory is `$(ven-profile path)/packs/<pack>/`. No pack fits: propose one through **forge-pack** and stop for the user. Rungs 2 to 4 need their capability in `ven-profile adapters`; if it is missing, build it with **forge-adapter** first, or drop a rung and say why.

## 3. Prove it

The check counts only once it fails on the original mistake.

1. Store the fixtures with the rule: `rules/<slug>/bad.*` (the original mistake, minimal) and `rules/<slug>/good.*` (the fix). Hook fixtures are the tool-input JSON.
2. Run the check on the bad fixture. It must fail, and its message must name the right way.
3. Run it on the good fixture. It must pass.
4. Run it on the whole repo. Write existing violations to `$(ven-profile path)/baseline/<slug>.txt`, one per line, so only new violations fail and the adapter still proves green (`ven-profile prove-adapters <capability>`).

A check that passes the bad fixture is not done. Fix the rule; never weaken it until the repo passes.

## 4. Record and reply

`ven-decisions add --step ratchet --decision "<class>: rung <n>, <check>" --evidence "bad exit <code>; good exit 0; baseline <n>"`

Reply with: the class, the rung and why each higher rung could not state it, the proof output, and the baseline count.

Changes others share are proposed, not applied: a rule added to the team's own lint config or CI, or a type change in shared code outside the current ticket. Show the diff and ask the user first.
