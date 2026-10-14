---
name: "{{pack}}-stays-quiet"
description: No skill from the {{pack}} pack fires on work outside the pack's area.
tags: ["{{pack}}", trigger]
plugins: ["../..", "../../.ven"]
runs: 3
max_turns: 6
timeout_seconds: 180
allowed_tools: [Read, Glob, Grep, Skill]
---
{{A request a user of this repo would make that has nothing to do with the pack, such as "Explain what a widget report contains and who reads it."}}
