---
name: routing-near-perf-vs-bugfix-perf
description: Router picks the perf playbook.
tags: [routing]
runs: 3
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
env: { EVAL_VEN_STATE_DIR: ".ven-state" }
append_system_prompt: "Routing evaluation. After you write the line that names the playbook, stop: do not create tasks, run steps, spawn agents or edit files."
---
/ven:do Report generation got slower, from 2s to 9s on the benchmark we track. I want it back under 3s.
