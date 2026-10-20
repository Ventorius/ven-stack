---
name: routing-near-epic-vs-feature
description: Router picks the feature playbook.
tags: [routing]
runs: 3
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
env: { EVAL_VEN_STATE_DIR: ".ven-state" }
append_system_prompt: "Routing evaluation. After you write the line that names the playbook, stop: do not create tasks, run steps, spawn agents or edit files."
---
/ven:do Add CSV import across the upload form, the parser and the audit log. The design is already decided: reuse the existing batch pipeline and the same validation rules.
