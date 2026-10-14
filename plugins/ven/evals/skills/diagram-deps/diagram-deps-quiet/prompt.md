---
name: diagram-deps-quiet
description: Diagram-deps trigger case (quiet).
tags: [diagram-deps, trigger]
runs: 3
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
append_system_prompt: "Trigger evaluation. Load the skills that apply to this task, then stop: do not edit files or run commands."
env: { EVAL_VEN_STATE_DIR: ".ven-state" }
---
What does the price function in src/core/price.js compute? Answer in one sentence.
