---
name: diagram-deps-mermaid-asked
description: A user who asks for the Mermaid source gets the fence in the reply and the page on disk.
tags: [diagram-deps, scenario]
runs: 3
max_turns: 25
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write]
env: { EVAL_VEN_STATE_DIR: ".ven-state" }
---
I'm about to move some code around and want to see the shape first. Draw me the module dependency graph of this repo, whole repo, one diagram, and paste the Mermaid source in your reply, I want to drop it into my notes.
