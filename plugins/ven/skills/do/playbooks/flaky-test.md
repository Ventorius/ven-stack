---
name: flaky-test
description: "A test that passes and fails without a code change, such as fails one run in ten, only fails in CI, or depends on order or timing. Measures the failure rate, then fixes the cause."
---

# Flaky test

review: own-read

Retries and longer timeouts hide a flake; they don't fix it. The failure rate is the red check.

1. Measure the rate
   Done: the test ran N times (default 20, or the user's number) with `ven-profile run commands.test.single --file <path>`, and the failures out of N are recorded with `ven-decisions add --step baseline --decision "<k>/<N> failed" --evidence "<command>"`. Zero failures: raise N once, then ask the user for the CI conditions.
2. Capture a failing run
   Done: one failing seed, ordering, timing or environment is saved with the command that reproduces it, and recorded with `ven-decisions add --step reproduce --decision reproduced --evidence "<command> fails with <error>"`. That opens the edit gate.
3. **diagram-hypotheses**
   Done: a tree badged HYPOTHESIS with candidate causes (shared state, ordering, time, randomness, concurrency, an outside service) and the evidence that would falsify each; one survives, confirmed by a run.
4. Fix, applying **fix-root-causes** and **test-behavior**
   Done: the cause is removed (pin time, seed randomness, isolate state, wait on a condition instead of a delay), with no retry or skip added.
5. **verify**
   Done: the test ran N times with 0 failures, the captured failing run now passes, and the change type's verify key passes and is logged.
6. **learning-check**
   Done: its result is stated in the reply; silence is not a result.

**Reply:** the failure rate before (k/N) and after (0/N), the cause, the fix, and the command that reproduced it.
