---
name: diagram-deps-fires
description: Diagram-deps trigger case (fires).
tags: [diagram-deps, trigger]
runs: 3
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
append_system_prompt: "Trigger evaluation: do not edit files or run commands."
env: { EVAL_VEN_STATE_DIR: ".ven-state" }
---
What depends on what in src/? I want the dependency picture before I touch anything.
