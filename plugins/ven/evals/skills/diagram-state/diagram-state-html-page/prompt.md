---
name: diagram-state-html-page
description: Diagram request leaves an offline HTML page and no Mermaid fence in the reply.
tags: [diagram-state, scenario]
runs: 3
max_turns: 25
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write]
env: { EVAL_VEN_STATE_DIR: ".ven-state" }
---
What states can an order be in, and how does it move between them? Draw it. My reviewer is waiting on this, keep it short and don't make me dig through files.
