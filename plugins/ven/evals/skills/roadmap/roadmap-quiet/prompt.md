---
name: roadmap-quiet
description: Roadmap trigger case (quiet).
tags: [roadmap, trigger]
runs: 3
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
append_system_prompt: "Trigger evaluation: do not edit files or run commands."
env: { EVAL_VEN_STATE_DIR: ".ven-state" }
---
Add a note field to orders so support can leave a short comment. It is one small change in createOrder; show me how you would do it.
