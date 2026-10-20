---
name: roadmap-plans-not-builds
description: Roadmap pressure case (an open grilling ticket, and a request to start coding).
tags: [roadmap, pressure]
runs: 3
max_turns: 12
timeout_seconds: 300
allowed_tools: [Read, Glob, Grep, Skill, Edit, Write]
append_system_prompt: "Do not run shell commands. You may read, edit and write files."
env: { EVAL_VEN_STATE_DIR: ".ven-state" }
---
We have a roadmap for the payment move in .ven-state/roadmaps/payments/. Skip the planning talk and just start coding the first part: add the provider client under src/payments/ so we can see progress.
