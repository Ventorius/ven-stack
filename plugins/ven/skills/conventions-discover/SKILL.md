---
name: conventions-discover
description: "Mine the code and merged PRs for the conventions this team actually follows (naming, error handling, module layout, test style, logging, config), with example locations, and write them to conventions.md. Use during onboarding, or when conventions.md is missing or stale."
metadata:
  layer: L3
---

# Conventions discover

Write down the conventions the team follows in practice, not the ones a style guide wishes for. A pattern is a convention when the code shows it again and again and the exceptions are few or explained. Output: `$(ven-profile path)/conventions.md`. This skill describes; it enforces nothing.

## 1. Inputs

- **Written rules:** contributing guides, the team's CLAUDE.md or AGENTS.md, lint and format configs, the PR template (`ven-profile get repo.forge.pr_template`), ADRs. A rules file governs only its own directory and below. Written rules are claims to check against the code, not conventions yet.
- **Merged PRs:** the last 30, read through `repo.forge.cli`, read-only: titles, review comments, changes requested. A comment that recurs is a convention the code may not show yet.
- **Shape:** `ven-profile get workspaces`, `tests.patterns`, `tests.layout`, `boundaries`, and the GLOSSARY.
- **Sample:** the most-changed files of the last 90 days (`git log --since=90.days --name-only --format=`), plus two or three files per workspace. Recent churn shows how the team writes code now.

## 2. One worker per area

Spawn every area in one message: `subagent_type: ven:ven-worker`, `model: ${user_config.swarm_model}`, read-only.

| Area | Look at |
|---|---|
| Naming | files, modules, types, functions, tests, booleans, constants; code names against GLOSSARY terms |
| Error handling | how errors are created, wrapped, passed up, returned or raised, logged and shown; where input is validated |
| Module layout | what lives in which directory, public entry points, what imports what (`ven-profile adapter graph.imports` if present) |
| Test style | location and naming, fixtures and factories, what is faked and what runs for real, assertion style |
| Logging | the logger used, levels, structured fields, what is never logged |
| Config | where settings are read, defaults, environment handling, feature flags |

Add an area only when the profile shows a clear extra axis, such as a data-access layer.

Each brief gives the area, its questions from the table, the sample files, the PR list with numbers, and this output contract, one entry per pattern:

- the pattern in one sentence;
- three or more example `file:line`s;
- counterexamples with `file:line` and their count;
- the source: code, review comment (PR number), or written rule (file);
- any written rule the code contradicts.

Rules for the worker: report only patterns with three or more examples; count, don't estimate; open every `file:line` you cite.

## 3. Synthesize

You do this, on the orchestrator tier.

- Keep a pattern when its examples clearly outnumber its counterexamples. A roughly even split is not a convention: list it under Split with both sides.
- Where a written rule and the code disagree, record both.
- A recurring review request with no code evidence goes under Asked for in review.
- Check what already enforces each pattern: `ven-profile adapters`, the lint config, the profile's `boundaries`, pack rules and hooks.
- Ask the user about splits and contradictions only, batched in one AskUserQuestion. The answers settle which side is the convention.

## 4. Write conventions.md

```markdown
# Conventions

Generated <date> @ <short sha> from <n> files and <n> PRs.

## <Area>

- <Pattern in one sentence.> Examples: `path:line`, `path:line`, `path:line`.
  Exceptions: <n> (`path:line`). Source: code | review #<pr> | written <file>.
  Enforced by: <check, rule or hook> | nothing.

## Split
## Asked for in review
```

## 5. Close

Record: `ven-decisions add --step conventions-discover --decision "<n> conventions, <n> splits" --evidence "conventions.md @ <sha>"`.

List the conventions that are "Enforced by: nothing" and that the user confirmed. Offer each to **ratchet**; don't enforce anything here.
