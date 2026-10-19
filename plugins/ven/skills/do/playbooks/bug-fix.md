---
name: bug-fix
description: "A reported defect to reproduce, root-cause and fix with evidence, such as wrong output, a crash or error, a regression, or a flaky failure."
metadata:
  source: cursor/plugins@main:pstack/skills/poteto-mode/playbooks/bug-fix.md
  license: MIT
---

# Bug fix

review: own-read

Every shipped line traces to evidence. A change that only "might help" is a hypothesis: when the evidence refutes it, revert it.

1. **reproduce** (gate)
   Done: one command fails for the reported reason, recorded with `ven-decisions add --step reproduce --decision reproduced --evidence "<command> fails with <error>"`. Until then the repro-first hook blocks source edits. Can't reproduce: record `--decision cannot-reproduce` with what you tried, and ask the user.
2. **diagram-hypotheses**
   Done: a hypothesis tree, badged HYPOTHESIS: the symptom, three or more candidate causes, and the evidence that would falsify each. A one-line fix with an obvious cause may skip the three-cause minimum, never step 1.
3. Bisect with evidence
   Done: one cause survives, confirmed by a run, a log line or a bisected commit; every other branch is marked falsified with its evidence. Independent probes can fan out to `ven:ven-worker`, one hypothesis each.
4. Failing test, with **tdd**
   Done: a test at a seam that exercises the real bug path fails on the current code for the identified cause. No such seam: record that as a finding and keep the step 1 command as the check.
5. Fix, applying **fix-root-causes**
   Done: the smallest change the evidence justifies, made at the cause; the failing test passes. Steps 4 and 5 go to `ven:ven-coder` when the cause is known and the brief is complete.
6. **verify**
   Done: the step 1 command passes, the change type's verify key passes and is logged, and temporary instrumentation is gone.
7. **correct**
   Done: if an agent wrote the bug, the mistake is routed to a check or a skill edit; otherwise `skip: not an agent mistake`.
8. **learning-check**
   Done: its result is stated in the reply; silence is not a result.

**Reply:** what was broken, the root cause, the fix, and the step 1 output failing before and passing after.
