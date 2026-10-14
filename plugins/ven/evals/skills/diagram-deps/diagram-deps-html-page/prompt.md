---
name: diagram-deps-html-page
description: Diagram request leaves an offline HTML page and no Mermaid fence in the reply.
tags: [diagram-deps, scenario]
runs: 3
max_turns: 25
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write]
env: { EVAL_VEN_STATE_DIR: ".ven-state" }
---
I'm about to move some code around and want to see the shape first. Draw me the module dependency graph of this repo, whole repo, one diagram. I'm in a hurry, so keep the answer short.
