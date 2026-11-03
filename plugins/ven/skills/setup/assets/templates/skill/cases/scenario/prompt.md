---
name: "{{skill}}-scenario"
description: "{{The mistake this skill prevents, as the evidence recorded it}}"
tags: ["{{pack}}", scenario]
plugins: ["../..", "../../.ven"]
runs: 3
max_turns: 25
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Edit, Write, Bash]
env: { EVAL_VEN_STATE_DIR: ".ven-state" }
---
{{The task from one evidence instance, in the words the user typed. Never name the skill. For a rule the agent skips under pressure, include the pressures the transcripts show.}}
