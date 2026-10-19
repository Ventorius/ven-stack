---
name: routing-flaky-test-order
description: Router picks the flaky-test playbook.
tags: [routing]
runs: 3
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
env: { EVAL_VEN_STATE_DIR: ".ven-state" }
append_system_prompt: "Routing evaluation. After you write the line that names the playbook, stop: do not create tasks, run steps, spawn agents or edit files."
---
/ven:do The invoice totals test passes alone but fails when the whole suite runs, and only sometimes. Measure how often and fix it.
