---
name: perf
description: "Make something measurably faster or lighter (latency, throughput, memory, build or test time) against a baseline. Needs a number or a symptom you can measure."
metadata:
  source: cursor/plugins@main:pstack/skills/poteto-mode/playbooks/perf-issue.md
  license: MIT
---

# Perf

You own the measurement story. Every change ties to a measurement; don't read source instead of measuring.

1. Baseline with **benchmark-check**
   Done: a number with its unit, its spread across runs and the exact command, vetted by benchmark-check and logged with `ven-decisions add --step baseline`.
2. Profile
   Done: an artifact path (profile, trace, query plan) and the top cost centers it shows, captured with the tool the profile or a pack names; with no such tool, instrument and say so.
3. Hypothesis
   Done: one falsifiable prediction ("removing X cuts the number by about Y") using the cheapest lever that could work, tried in order: don't do it, don't do it again, do less, do it later, do it concurrently, do it cheaper.
4. Change
   Done: one change per measurement (apply **sequence-verifiable-units**), and `ven-profile run commands.test.all` still passes.
5. **benchmark-check**
   Done: the same command under the same conditions gives the after number, and you can say what limits it (apply **explain-the-number**).
6. Keep or revert
   Done: kept only if the delta beats run-to-run noise, then proven with **verify**; otherwise reverted and back to step 3. Logged with `ven-decisions add --step keep-or-revert --decision kept|reverted --evidence "<before> → <after>"`.
7. **learning-check**
   Done: its result is stated in the reply; silence is not a result.

**Reply:** baseline, after number, delta with its noise, what limits the new number, and the artifact paths.
