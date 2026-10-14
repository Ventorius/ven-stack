---
name: "{{skill}}-quiet"
description: The {{skill}} skill stays quiet on a near-miss task in the same files.
tags: ["{{pack}}", trigger]
plugins: ["../..", "../../.ven"]
runs: 3
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
env: { EVAL_VEN_STATE_DIR: ".ven-state" }
append_system_prompt: "Trigger evaluation. Load the skills that apply to this task, then stop: do not edit files or run commands."
---
{{A near miss: a task on files that match the skill's paths but outside its one idea, the boundary settled when the scope was grilled.}}
