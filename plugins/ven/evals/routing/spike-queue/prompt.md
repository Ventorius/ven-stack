---
name: routing-spike-queue
description: Router picks the spike playbook.
tags: [routing]
runs: 3
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
env: { EVAL_VEN_STATE_DIR: ".ven-state" }
append_system_prompt: "Routing evaluation. After you write the line that names the playbook, stop: do not create tasks, run steps, spawn agents or edit files."
---
/ven:do Spend an hour finding out whether we could swap our job queue for a managed one. Throwaway code is fine, I just want the answer.
