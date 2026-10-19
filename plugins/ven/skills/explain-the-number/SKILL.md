---
name: explain-the-number
description: "Apply when you measure or vet a number before you trust, report or act on it: a speedup, regression, throughput, latency or eval result. Name what limits it and rule out that it measured something else; benchmarks follow the protocol."
metadata:
  layer: L2
  source: cursor/plugins@1e5c90a:pstack/skills/principle-explain-the-number/SKILL.md; cursor/plugins@1e5c90a:pstack/skills/benchmark-checklist/SKILL.md
  license: MIT
---

# Explain the Number

Before you trust, report or act on a number you measured, say what limits it and rule out that it measured something other than the work you think.

**Why:** A number without a cause is a guess with decimals. Speedups from skipped work, regressions that were noise, and eval wins from a broken run all look exactly like real results until someone asks why.

**Pattern:**
- **Ask "why not double?"** Name the resource or code path that bounds the result: a core, a lock, the disk, the network, a downstream service, the load generator itself. Get it from a profile or system counters taken during the run, then map it to source. A guess from reading code is not a limiter.
- **List what else it could be measuring, and rule each out with evidence.** The usual suspects: errors, skipped or cached work, code that never ran, a comparison side left on default settings, noise, and a piece too small to matter end to end.
- **Repeat the run.** One run is an anecdote. Record the run count and the spread, and compare the change against that spread.
- **Check it against the whole.** If the time saved exceeds the total time the changed piece took, the measurement is wrong.
- **Keep the evidence with the number:** run count, spread, the limiter, and the command that produced it, in the notes or a linked artifact.

**For eval results,** ask the same of the trials: did every run actually do the task, does the gap hold across trials and models, and does the scenario matter.

**Measuring it yourself:** a speedup, a comparison between options, or a keep-or-revert call on a performance change needs the full procedure in `references/benchmark-protocol.md`: claim, baseline, alternating runs, error counts, limiter, verdict. A quick ballpark the user asked for may be one run; say so.

**The test:** Can you say, with evidence, why the number isn't twice as good and why it isn't an artifact? If not, you don't yet know what you measured.

**Stop:** Don't report a number as a result while its evidence lacks a run count, a spread or a named limiter. Report it as unexplained instead.
