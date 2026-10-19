---
name: pause
description: "Stop in-flight work cleanly so a later session can resume it, such as pause, stop here for today, or context is running out. Only on an explicit pause."
metadata:
  source: cursor/plugins@main:pstack/skills/poteto-mode/playbooks/pause-safely.md
  license: MIT
---

# Pause

Leave a checkpoint a cold-start agent can resume from. "Keep going" or "don't stop" is not a pause.

1. Stop at a safe boundary
   Done: the current atomic step is finished or backed out, nothing new is started, and every background agent has returned or its worktree path is noted.
2. Make the work durable
   Done: uncommitted work is one local `wip` commit in the repo's commit style (`ven-profile get conventions.commit_style`), with a one-line warning in the body if the tree is broken. No push, no PR.
3. **handoff**
   Done: a note in `$(ven-profile path)/handoffs/` names the active playbook and its last recorded step (`ven-decisions active`), the branch and worktrees, what is verified and what isn't, and the first action on resume.
4. Record the pause
   Done: `ven-decisions add --step pause --decision paused --evidence "<note path>"` is logged, and the playbook stays active (no `ven-decisions end`) so the next pickup finds it.
5. **learning-check**
   Done: its result is stated in the reply; silence is not a result. This is the only place it runs for paused work; pickup does not repeat it.

**Reply:** where you stopped, what is on disk and what isn't, the commit you made, the note path, and the first action on resume.
