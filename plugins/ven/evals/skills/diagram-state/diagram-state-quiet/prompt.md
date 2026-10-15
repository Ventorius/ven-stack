---
name: diagram-state-quiet
description: Diagram-state trigger case (quiet).
tags: [diagram-state, trigger]
runs: 3
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
append_system_prompt: "Trigger evaluation: do not edit files or run commands."
env: { EVAL_VEN_STATE_DIR: ".ven-state" }
---
What does cancel() throw on a shipped order? Answer in one sentence.
