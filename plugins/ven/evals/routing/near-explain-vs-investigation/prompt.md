---
name: routing-near-explain-vs-investigation
description: Router picks the investigation playbook.
tags: [routing]
runs: 3
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
env: { EVAL_VEN_STATE_DIR: ".ven-state" }
append_system_prompt: "Routing evaluation. After you write the line that names the playbook, stop: do not create tasks, run steps, spawn agents or edit files."
---
/ven:do Which code path decides whether a webhook gets retried, and what is the retry limit? I need the answer, not a tutorial.
