---
name: reproduce
description: "Build a red-capable loop for a reported bug, a test or script that fails for the reported reason, and record it to open the edit gate. Use first in any bug fix, before forming theories from the code or touching source."
metadata:
  layer: L3
  source: mattpocock/skills@49dd158:skills/engineering/diagnosing-bugs/SKILL.md (phases 1-2); obra/superpowers@bb92a77:skills/systematic-debugging/SKILL.md (phase 1)
  license: MIT
---

# Reproduce

No loop, no fix. A tight pass/fail signal that goes red on this bug is the whole job; everything after it only consumes that signal. Spend the effort here.

**Redact** every secret in commands, output and artifacts you show: write `<REDACTED>`. Keep credentials in the environment, not in the loop.

## 1. Read the report

- Read the error, stack trace and logs completely: paths, line numbers, codes.
- Pin the symptom in one sentence: the input, what was expected, what happened.
- Check what changed recently near the symptom: `git log` on those paths, new dependencies, configuration.

## 2. Build the loop

Take the first of these that reaches the bug:

1. A **failing test** at the seam that reaches the bug. Test files match `ven-profile get tests.patterns`; run it with `ven-profile run commands.test.single --file <path>`.
2. A **request script** against the running app. Start it per `commands.run`; if that is `manual`, ask the user to start it.
3. A **command-line run** with a fixture input, diffing output against known-good output.
4. A **scripted UI drive**, with a driver the repo or its packs already have.
5. A **replay** of a captured payload, event or log through the code path.
6. A **throwaway harness**: the smallest piece of the system that reaches the path in one call.
7. A **randomized loop**: many generated inputs, for "sometimes wrong".
8. A **bisect harness**: it broke between two known states, so script "build at X, check" for `git bisect run`.
9. A **differential loop**: the same input through old and new versions or configs, diffing the outputs.
10. Last resort, a **human in the loop**: a script that tells the user exactly what to do and captures what they report.

Repro scripts that are not test files go in a temporary directory outside the repo. The repro-first hook blocks other edits in the working tree until step 5.

**Tighten it.** Faster: narrow the scope, skip unrelated setup. Sharper: assert the exact symptom, not "didn't crash". Deterministic: pin time, seed randomness, isolate files and network. A slow, flaky loop is barely a loop.

**Intermittent bugs** need a higher reproduction rate, not a clean repro: loop the trigger many times, run in parallel, add load, narrow timing windows. Keep raising the rate until it is debuggable, and note it.

## 3. Confirm

Run it and check every box:

- [ ] **Red-capable.** It drives the real bug path and asserts the user's exact symptom, so it goes green only when the bug is fixed.
- [ ] **The reported bug.** Not a different failure nearby. Wrong bug, wrong fix.
- [ ] **Deterministic** (or a pinned, high rate), **fast** (seconds), and runs unattended.
- [ ] **Symptom captured:** the error text, wrong output or timing, for proving the fix later.

Caught yourself reading code to build a theory before these boxes are ticked? Stop. Hypotheses come after this step.

## 4. Minimize

Cut inputs, callers, configuration, data and steps one at a time, re-running after each cut, and keep only what keeps it red. Done when every remaining part is load-bearing. The minimal repro becomes the regression test later.

## 5. Record

```bash
ven-decisions add --step reproduce --decision reproduced --evidence "<test or script> fails with <error>"
```

This opens the repro-first gate on source edits.

## Cannot reproduce

Stop and say so. List what you tried, then record it:

```bash
ven-decisions add --step reproduce --decision cannot-reproduce --evidence "<what was tried>"
```

Ask the user (AskUserQuestion) for one of: access to an environment where it happens, a redacted captured artifact (logs, a request capture, a recording with timestamps), or permission to add temporary instrumentation. Do not guess at causes without a loop. A background agent returns `VEN-RESULT: BLOCKED: <the one thing it needs>` instead.
