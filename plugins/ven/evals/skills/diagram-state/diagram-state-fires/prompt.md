---
name: diagram-state-fires
description: Diagram-state trigger case (fires).
tags: [diagram-state, trigger]
runs: 3
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
append_system_prompt: "Trigger evaluation. Load the skills that apply to this task, then stop: do not edit files or run commands."
env: { EVAL_VEN_STATE_DIR: ".ven-state" }
---
Before I add a refund step, show me what states an order has and how it moves between them.
