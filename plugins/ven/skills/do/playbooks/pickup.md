---
name: pickup
description: "Resume in-flight work from a handoff note, a branch or an active playbook, such as continue, pick up where we left off, or take over this branch."
metadata:
  source: cursor/plugins@main:pstack/skills/poteto-mode/playbooks/session-pickup.md
  license: MIT
---

# Pickup

The prior trail is authoritative. Read it; don't redo it.

1. Find the trail
   Done: you have read the newest note in `$(ven-profile path)/handoffs/` (or the one the user named), `ven-decisions active`, recent rows from `ven-decisions list --limit 30`, and the branch state (`git log` and `git diff` against `ven-profile get repo.default_branch`).
2. Name the resume point
   Done: done and pending work are listed, the next step is named, and nothing already done is scheduled again.
3. Re-prove inherited claims
   Done: each claim you will build on has a logged verify pass for the current tree, or you ran **verify** again, or it is marked unverified.
4. Resume the playbook
   Done: the remaining steps of the active or noted playbook are in the task list after this one. If it isn't active in this worktree, `ven-decisions start <name>` it; for a bug fix, rerun the noted repro and record it again. No playbook in the trail: hand the remaining work to the router by its shape.
5. **learning-check**
   Done: `skip: ran at pause`. The resumed playbook's own last step runs it for work finished after the resume; pickup never re-runs the one pause ran.

**Reply:** where the prior session stopped, what you inherited, what you re-proved, and the resume point.
