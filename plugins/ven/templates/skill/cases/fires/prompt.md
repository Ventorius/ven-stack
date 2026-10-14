---
name: "{{skill}}-fires"
description: The {{skill}} skill fires on a task it governs.
tags: ["{{pack}}", trigger]
plugins: ["../..", "../../.ven"]
runs: 3
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
env: { EVAL_VEN_STATE_DIR: ".ven-state" }
append_system_prompt: "Trigger evaluation. Load the skills that apply to this task, then stop: do not edit files or run commands."
---
{{A second phrasing of a task the skill governs, naming files that match its paths. Never name the skill.}}
