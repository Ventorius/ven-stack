---
name: "route-{{case}}"
description: The router picks the {{expected playbook}} playbook with the {{pack}} pack enabled.
tags: ["{{pack}}", routing]
plugins: ["../..", "../../.ven"]
runs: 3
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill, Bash]
env: { EVAL_VEN_STATE_DIR: ".ven-state" }
append_system_prompt: "Routing evaluation. After you write the line that names the playbook, stop: do not create tasks, run steps, spawn agents or edit files."
---
/ven:do {{a task of this shape, in the words a user types; never the playbook's name}}
