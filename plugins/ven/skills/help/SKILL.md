---
name: help
description: "Suggest which ven command, skill or playbook fits what you want, and check this repo's ven state (profile, staleness, skill collisions). Suggests only; never runs the work."
argument-hint: <question>
disable-model-invocation: true
metadata:
  layer: L5
  source: cursor/plugins@main:pstack/skills/poteto-help/SKILL.md
  license: MIT
---

# help

Answer "which skill fits" with a command the user can type. Never run the skill, playbook or command you suggest; the user sends it. A message that asks for work rather than help gets `/ven:do <their task>` back, ready to send.

## Default answer

`/ven:do <task>` for any real work. It picks the playbook, runs its steps, proves the result and closes with a learning check. A good task states the goal and how to tell it's done. Don't list skills for it: a hand-written sequence drops steps the playbook keeps. The router's table is the map of what runs when; don't restate it.

Suggest a single skill only when the user wants one part of the flow. Read `${CLAUDE_PLUGIN_ROOT}/skills/<name>/SKILL.md` before you say what it does, or route by its frontmatter description. Setup is `/ven:onboard` (`--refresh` after the stack changed).

## Playbooks

Playbooks are step lists that `/ven:do` runs, not commands. Describing the task picks one:

- investigation: how or why something is, or a choice between options
- feature: add or change behavior
- bug-fix: something is broken or regressed
- hotfix: a production fire that needs the smallest safe patch now
- flaky-test: a test that passes and fails without a code change
- spike: a time-boxed experiment that answers one question
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

- `ven-profile show` fails: no profile. Suggest `/ven:onboard` first.
- `ven-profile fresh` exits 1: the stack changed since onboarding. Suggest `/ven:onboard --refresh`.
- `ven-decisions active` shows a playbook: work is in flight. `/ven:do continue` resumes it; `/ven:do pause` parks it.
- `ven-doctor`: skill name collisions, unverified commands, the worktree base, missing permission rules. Run it whenever something behaved unexpectedly.

## Reply

Lead with the command to type, then one example prompt in a code block and one sentence on why it fits. Add a close call only when the user's words fit two skills. Keep it short unless the user asked for the whole map.
