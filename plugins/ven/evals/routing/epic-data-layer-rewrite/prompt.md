---
name: routing-epic-data-layer-rewrite
description: Router picks the epic playbook.
tags: [routing]
runs: 3
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
env: { EVAL_VEN_STATE_DIR: ".ven-state" }
append_system_prompt: "Routing evaluation. After you write the line that names the playbook, stop: do not create tasks, run steps, spawn agents or edit files."
---
/ven:do Plan a multi-month rewrite of the data layer. We haven't scoped it, and I expect it to take many sessions to settle the open questions.
