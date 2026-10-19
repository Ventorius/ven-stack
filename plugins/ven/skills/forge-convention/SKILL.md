---
name: forge-convention
description: "Write a narrow principle-style skill in the repo's pack for a convention that no type, boundary rule, lint rule or hook can check, scoped to the files it governs and proven by a failing scenario. Use when a convention needs judgment and no rule tool can state it."
metadata:
  layer: L3
---

# Forge convention

Some conventions need judgment, such as "a new widget kind gets its own module, never a branch in the shared one". No check can decide them, so they become a narrow skill that loads only on the files it governs. This is the last structural step: confirm first that a type, a boundary rule, a lint or structural rule, and a hook each fail to state the convention, and write down why.

## 1. Evidence

Collect real instances, enough to meet the pack bar in **encode-lessons-in-structure**: `conventions.md` examples and exceptions, review comments, corrections from `ven-decisions list --step correction` (then `ven-transcripts --kind corrections` as the fallback), `solutions/` entries. Each with a citation. Below the bar, record the lesson with **compound** and stop.

## 2. Scope

Settle these, then confirm the rule text with the user in one AskUserQuestion. The text becomes the team's rule, so it is their call.

- **The rule.** What to do, what not to do, and the one exception if there is one. Short enough to quote whole.
- **Where.** The files it governs as globs, and the situations in the words a task would use ("adding a widget kind", "changing how reports load").
- **Why.** The cost of breaking it, shown by one cited instance.
- **Never.** What the skill must not do, such as spread to files outside its globs or restate a core principle.
- **Neighbors.** The nearest core principle and how this rule differs from it.

## 3. Draft

The skill goes in the pack that `ven-profile packs-for <governed files>` returns. Its content, in this order:

- `name`: the rule in kebab case. `description`: "<What must always or never happen>. Use when <the situations>." `paths:` the globs. `metadata.layer: L2`.
- A title that states the rule in one sentence.
- The rule paragraph from step 2.
- **Why:** the cost, with the cited instance.
- **Example:** a `file:line` that follows the rule. **Counterexample:** the original mistake, cited.
- **Distinct from:** the nearest principle, named in plain text. An L2 skill may not reference another L2 skill or any L3 skill.

Keep it under 40 lines. A rule that needs more is two rules, or a workflow.

## 4. Prove and register

Hand the scope and the draft to **forge-skill**. It writes the failing scenario (an agent breaks the convention without the skill), proves the skill fixes it, runs the routing and trigger evals, and registers the skill in the pack. Don't skip that gate, and don't enable a skill whose scenario passes without it.

## 5. Record

`ven-decisions add --step forge-convention --decision "<pack> skill <name>" --evidence "<scenario>: fails without, passes with"`

If `conventions.md` lists the convention, set its "Enforced by" to the skill name.
