---
name: autonomous-run
description: "Drive specified, sliced work to done without stopping, one ticket per iteration, such as run until done, finish these tickets overnight, or keep going while I'm away."
metadata:
  source: cursor/plugins@main:pstack/skills/poteto-mode/playbooks/autonomous-run.md
  license: MIT
---

# Autonomous run

You own the exit condition. Define done as a check, then drive to it without ending a turn between iterations.

review: panel

Rules for the whole run:
- The Stop-hook verify-gate is the gate: never end a turn on an unverified tree, and never relax the exit condition to finish.
- No push, PR, comment or tracker update unless the user granted it for this run.
- A BLOCKED you can answer from the spec, tickets or code is answered by continuing the same coder with SendMessage, once. Any other BLOCKED stops the run.

1. Check the inputs (gate)
   Done: a spec, its tickets, and a `verified` command behind each `verify.<type>` the tickets touch (`ven-profile get verify`). Anything missing: stop and name it; the feature playbook's alignment steps produce them.
2. Set the exit condition and the cap
   Done: the exit condition is a check that passes or fails (every ticket merged, combined verify green), and the iteration cap is the user's number, else twice the ticket count.
3. Iterate with **tdd** in `ven:ven-coder`, one ticket per coder
   Done per iteration: the ready tickets (blockers merged; independent ones may run as a parallel batch, merged in ticket order) came back DONE, was merged, and **verify** passes on the combined tree, or it was reverted. Logged per ticket with `ven-decisions add --step iteration-<n> --decision "<ticket> merged|reverted" --evidence "<verify key> exit <code>"`.
4. Stop
   Done: the run stopped on the exit condition, the cap, or a BLOCKED. Short of done, a **handoff** note in `$(ven-profile path)/handoffs/` says where and why, and the run ends with outcome `blocked`.
5. **review** over the whole run's diff
   Done: Act-on findings are fixed and re-verified, or listed in the reply for the user.
6. **learning-check**
   Done: its result is stated in the reply; silence is not a result.

**Reply:** the exit condition and its final state, iterations run, tickets merged and reverted, and the reason for any stop short of done.
