---
name: routing-near-migration-vs-depupgrade
description: Router picks the migration playbook.
tags: [routing]
runs: 3
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
env: { EVAL_VEN_STATE_DIR: ".ven-state" }
append_system_prompt: "Routing evaluation. After you write the line that names the playbook, stop: do not create tasks, run steps, spawn agents or edit files."
---
/ven:do Replace every use of the callback-style file API with the promise-style one across all modules, then delete the old calls.
