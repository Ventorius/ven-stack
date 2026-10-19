---
name: handoff
description: "Write a handoff note a fresh session can resume from: goal, state, decisions, next step, open questions. Use when pausing work, before the context fills up, or when passing work to another session or person."
metadata:
  layer: L3
  source: mattpocock/skills@49dd158:skills/productivity/handoff/SKILL.md
  license: MIT
---

# Handoff

Write a note that lets a fresh agent continue this work without this conversation.

## Where

`$(ven-profile path)/handoffs/<branch>-<YYYY-MM-DD>.md`, where `<branch>` is `git branch --show-current` with each `/` replaced by `-`. If today's note for this branch exists, update it instead of writing a second one. Never write the note into the working tree.

## Gather

- `git status --short`, `git log --oneline $(ven-profile get repo.default_branch)..HEAD`, and the worktree path.
- `ven-decisions active` for the playbook and its step; `ven-decisions list --limit 30` for the decisions and the last verify result.
- Decisions made in this conversation that aren't logged yet. Log each first: `ven-decisions add --step <step it belongs to> --decision "<decision>" --evidence "<why>"`.
- Paths of the specs, tickets, ADRs, solutions and diagrams this work produced or relied on.

## Write

```markdown
# <goal in one line>

Branch: <branch> · Worktree: <path> · Playbook: <name>, step <step> · <date>

## Goal
What done looks like, in one or two sentences, with the spec or ticket path.

## State
Done, in progress, not started. Commits by short hash. Uncommitted files.
The last verify result and the tree it ran on.

## Decisions
One line each with its reason, from the decision log and this conversation.

## Next step
The single next action: the file, the test, the profile command key to run.

## Open questions
Each question, and who or what can answer it.

## Read first
Paths to the spec, tickets, ADRs, solutions and diagrams, and the skill to resume with.
```

## Rules

- Point to artifacts by path. Never copy a spec, diff or decision log into the note.
- Redact secrets, tokens, passwords and personal data.
- If the user said what the next session is for, shape the note around that.
- Reply with the note's path and its next step.
