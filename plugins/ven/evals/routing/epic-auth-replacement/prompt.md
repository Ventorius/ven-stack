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
/ven:do We want to replace the auth system over the next several weeks. Requirements are unclear and we don't know the route yet. Help me map it out before anyone builds anything.
