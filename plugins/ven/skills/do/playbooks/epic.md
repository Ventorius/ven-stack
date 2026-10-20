---
name: epic
description: "Plan an effort that spans several sessions and whose route is unclear, such as replace the auth system over weeks, plan a rewrite we haven't scoped, or map a big effort before building. Settles one decision per session and builds nothing."
---

# Epic

review: own-read

Rule for the whole run: no edits inside the repo; the plan-only hook blocks them. Roadmap files, glossary entries and scratch prototypes go outside it. One run is one session; the next session starts a fresh run.

Rule on pause: a pause ends an epic run, and this overrides the pause playbook. Keeping a playbook active would leave the worktree edit-locked. Release the claim, write a **handoff** if it helps, then `ven-decisions end --outcome blocked`. No learning-check row is needed. The next session starts a fresh epic run.

1. Load or chart with **roadmap**
   Done: an existing roadmap for this effort is read at low resolution; otherwise the destination is named, the opening grill ran and the roadmap is written (Charting), seeded by a handoff note in `$(ven-profile path)/handoffs/` when one exists. No fog after the opening grill: say the effort fits feature, run `ven-decisions end --outcome abandoned` and stop.
2. Claim one frontier ticket
   Done: its claim is held as **roadmap** says (Working a session), recorded with `ven-decisions add --step claim --decision "<NN>" --evidence "<ticket path>"`.
3. Resolve it by type, with the skill the roadmap names
   Done: the question has an answer with its reasoning. Ready research tickets may run in parallel on `ven:ven-worker`.
4. Close the ticket
   Done: the ticket is closed as **roadmap** says (Closing a ticket), or on a pause see the rule at the top.
5. Cleared check
   Done: a cleared roadmap tells the user to run feature, where **to-spec** reads it; otherwise the next frontier ticket is named.
6. **learning-check**, then `ven-decisions end --outcome done`
   Done: its result is stated in the reply; silence is not a result.

**Reply:** the destination, the ticket resolved and its answer, what the roadmap holds now (open, blocked, fog), and whether the next step is another epic session or feature.
