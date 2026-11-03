---
name: help
description: "Suggest which ven skill or playbook fits what you want, and check this repo's ven state. Use when the user asks which ven skill to use or how ven works; it suggests only and never runs the work."
metadata:
  layer: L5
  source: cursor/plugins@1e5c90a:pstack/skills/poteto-help/SKILL.md
  license: MIT
---

# help

Answer "which skill fits" with the skill to invoke and what to give it. Never run the skill, playbook or command you suggest; the user sends it. A message that asks for work rather than help gets the "do" skill with their task back, ready to send.

## Default answer

The "do" skill, given the task, for any real work. It picks the playbook, runs its steps, proves the result and closes with a learning check. A good task states the goal and how to tell it's done. Don't list skills for it: a hand-written sequence drops steps the playbook keeps. The router's table is the map of what runs when; don't restate it.

Suggest a single skill only when the user wants one part of the flow. Read `$(ven-profile root)/<name>/SKILL.md` before you say what it does, or route by its frontmatter description. Committing and pushing finished work without a review panel or briefing body is the "yeet" skill (`--pr` also opens the PR); the ship playbook is the reviewed path.

## Playbooks

Playbooks are step lists that the "do" skill runs, not commands. Describing the task picks one:

- investigation: how or why something is, or a choice between options
- feature: add or change behavior
- bug-fix: something is broken or regressed
- hotfix: a production fire that needs the smallest safe patch now
- flaky-test: a test that passes and fails without a code change
- spike: a time-boxed experiment that answers one question
- epic: plan a multi-session effort with an unclear route, one decision per session, no repo edits
- refactor: restructure without changing behavior
- perf: make something measurably faster
- migration: replace an old API or dependency everywhere
- dependency-upgrade: move a dependency to a new version
- docs-only: change documentation and nothing else
- explain: explain a PR, or teach a module
- autonomous-run: run until the tickets are done
- pickup / pause: resume or park the work in flight
- ship: open the PR

Repo packs add playbooks; the router prefers a pack playbook when its pack applies to the files the task touches.

## Check the state

Run these and mention a result only when it changes the answer:

- `ven-profile context`: the active playbook, a stale profile, or state from an older ven version (`ven-profile migrate`). A repo with no profile needs nothing first: commands are learned as work needs them.
- `ven-decisions active` shows a playbook: work is in flight. "do" with `continue` resumes it; "do" with `pause` parks it.
- `ven-doctor`: the tools on PATH, node and git, the per-user settings, unverified commands and state an older ven left. Run it whenever something behaved unexpectedly; for its fixes, suggest **setup**.

## Reply

Lead with the command to type, then one example prompt in a code block and one sentence on why it fits. Add a close call only when the user's words fit two skills. Keep it short unless the user asked for the whole map.
