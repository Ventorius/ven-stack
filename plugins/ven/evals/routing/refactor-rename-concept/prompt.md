---
name: routing-refactor-rename-concept
description: Router picks the refactor playbook.
tags: [routing]
runs: 3
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
env: { EVAL_VEN_STATE_DIR: ".ven-state" }
append_system_prompt: "Routing evaluation. After you write the line that names the playbook, stop: do not create tasks, run steps, spawn agents or edit files."
---
/ven:do We call the same thing 'tenant' in some places and 'workspace' in others. Unify on 'workspace' in the code, behavior must stay identical.
