---
name: routing-epic-auth-replacement
description: Router picks the epic playbook.
tags: [routing]
runs: 3
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
env: { EVAL_VEN_STATE_DIR: ".ven-state" }
append_system_prompt: "Routing evaluation. After you write the line that names the playbook, stop: do not create tasks, run steps, spawn agents or edit files."
---
/ven:do We are moving off our homegrown login to some hosted identity provider, and nobody has picked one. We don't know whether sessions, API keys and the admin console can all move, or in what order. Nothing should be built until those answers exist.
