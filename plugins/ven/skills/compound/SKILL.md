---
name: compound
description: Record one solved problem as a solution entry anchored to the files it touches, so later sessions on those files see it first. Use after a fix or decision whose reasoning the final code does not show, or when learning-check finds a durable learning.
metadata:
  layer: L3
  source: EveryInc/compound-engineering-plugin@main:skills/ce-compound/SKILL.md
  license: MIT
---

# Compound

Write one solved problem to `$(ven-profile path)/solutions/<area>/<slug>.md`. At session start, the context hook surfaces entries whose `files:` overlap the branch's changed files, and a refresh later prunes entries whose files are gone. Both depend on `files:`, so it is required.

## The bar

Write only when the problem is solved and verified, and the entry passes this test: if it disappeared, would a future agent reading the final code, tests and docs still repeat the mistake or redo the investigation? Effort and diff size don't count. If the test fails, write nothing and say why in one line.

One problem per entry. Several problems mean several entries, written one at a time.

## Steps

1. **Look for an existing entry.** Search `solutions/` for the files you touched and the symptom text. Same problem: update that entry in place and add `last_updated: <YYYY-MM-DD>`. An entry that became wrong is updated, never left beside a new one.
2. **Ground every claim.** Before stating how code behaves, read the defining line in the current tree and cite it as `path:line`. Mark what you could not check as unverified.
3. **Pick the area.** List `solutions/` and reuse the area directory that covers this part of the code. Create one only when none fits, named after the module or workspace (`ven-profile get workspaces`), in kebab-case.
4. **Fill the template** below. The slug is the title in kebab-case.
5. **Anchor `files:`.** Repo-relative paths or globs for where the problem showed and where the fix landed. Each must match something in the current tree (check with Glob). Prefer narrow anchors: a glob over half the repo surfaces the entry on every branch.
6. **Capture terms.** A domain term the session defined or sharpened goes to `GLOSSARY.md` through **glossary**, not into the entry.
7. **Check the frontmatter.** The hook reads a YAML subset: one `key: value` per line, lists as `- item` lines (inline `[a, b]` only for tags), no nested maps. Quote a list item that starts with a backtick, `[`, `*`, `&`, `!`, `|`, `>`, `%`, `@` or `?`, or that contains `": "`.

## Vocabulary

- `problem_type` (closed): build_error, test_failure, runtime_error, performance_issue, security_issue, data_issue, integration_issue, logic_error, workflow_issue, developer_experience, design_decision, convention.
- `resolution_type` (closed): code_fix, config_change, test_fix, dependency_update, environment_setup, workflow_change, documentation_update, tooling_addition, data_fix.
- `severity` (closed): critical, high, medium, low.
- `root_cause` (open): reuse the spelling other entries use for the same cause; otherwise a short snake_case phrase such as missing_validation, wrong_interface, ordering, shared_state, config_drift, missing_step.

## Template

```markdown
---
title: <the problem in one line, not the fix>
date: <YYYY-MM-DD>
area: <area directory name>
problem_type: <closed list>
symptoms:
  - <observable symptom; quote error text>
root_cause: <open vocabulary>
resolution_type: <closed list>
severity: <critical|high|medium|low>
files:
  - <repo-relative path or glob>
tags: [<keyword>, <keyword>]
---

# <title>

## Problem
<One or two sentences: what broke or was unclear, and who noticed.>

## Symptoms
- <What you saw, verbatim where possible.>

## What didn't work
- <Attempt> — <why it failed.>

## Solution
<The fix, citing path:line. Short snippets only when the shape matters.>

## Why this works
<The root cause, and how the fix removes it.>

## Prevention
- <The check that now guards it, with its path; or "none, judgment only".>
```

## Report

The entry path (or "nothing written" and why), its area, and its `files:` anchors. When Prevention says "none" but a check could catch the mistake, say so: the caller routes it as a correction.
