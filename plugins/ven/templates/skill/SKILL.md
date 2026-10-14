---
name: "{{skill}}"
description: "{{What it does, in one sentence}}. Use when {{the trigger: the situations, in the words a task uses}}."
paths:
  - "{{glob from pack.json applies_when.paths, or a narrower one}}"
metadata:
  layer: "{{L2 for a principle, L3 for a workflow}}"
  pack: "{{pack}}"
---

# {{Title}}

{{The one idea, stated as the behavior to produce, in one or two sentences.}}

**Why:** {{the failure it prevents, as the evidence recorded it}}

**Pattern:**
1. {{an action, ending on a condition you can check}}
2. {{the next action}}

**Example:** {{one real instance: what went wrong at file:line, and the fix}}

**Stop:**
- {{an excuse recorded in the failing scenario}}: {{its counter}}

Library facts: read `${CLAUDE_PLUGIN_ROOT}/references/{{library}}.md` when {{the moment the facts are needed}}. Drop this line when the skill needs no reference.

{{L3 only: Applies **ven:<core principle>**.}} Distinct from {{the nearest core or pack skill, named in plain text}}: {{the line between them}}.
