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
/ven:do The data layer has three different ORMs and no owner. Whether to consolidate on one, which one, and how to migrate live tables without downtime are all undecided, and each answer depends on the one before it. Work out those answers first, no code yet.
