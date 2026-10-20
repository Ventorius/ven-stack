---
name: roadmap-fires
description: Roadmap trigger case (fires).
tags: [roadmap, trigger]
runs: 3
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
append_system_prompt: "Trigger evaluation: do not edit files or run commands."
env: { EVAL_VEN_STATE_DIR: ".ven-state" }
---
We want to move orders onto a new payment provider. It will take several sessions over a few weeks, and we don't yet know the route: the provider choice, the refund flow and the data migration are all open. Plan it so each session can settle one question and the next picks up where the last stopped.
