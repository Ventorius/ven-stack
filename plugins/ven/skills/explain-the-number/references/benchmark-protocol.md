# Benchmark protocol

The procedure for producing a performance number you can stand behind. No verdict without a named limiter.

## Tools

Measurement, load and profiling commands come from the profile or the adapters (`ven-profile get commands`, `ven-profile adapters`), or from a pack for this repo. Run them with `ven-profile run <key>`. If none fits, propose one from repo evidence and add it with the user's yes, the way any missing command is handled: never guess one. Never time things with a command from memory.

## Before running

1. **Write the claim** you expect to make, in the words you would ship: "<operation> is <x>% faster at <percentile> on <dataset>". Every step below tests that sentence.
2. **Read the measurement script.** Note what it times, what it counts and what it ignores.
3. **Check the machine.** Compare the load average with the core count. If something else is busy and you can't stop it, interleave the sides so both see the same noise, and say so.

## Baseline

Measure the unchanged code first, with the same command, data, warmup and environment as the change. Name the exact commits. Build the base in its own worktree so both sides build the same way.

## Runs

- **Tuned like production.** Production build flags, settings, pools, caches as warm or cold as production sees them, the same versions and data on every side. A side left on defaults means you compared configurations, not code; tune it and rerun before picking a winner.
- **At least 5 runs per side, alternating** (A, B, A, B) so warmup, caching and drift favor neither.
- **Errors counted.** Failures and non-success responses, and outputs checked for correctness, not just presence. Rejections are fast, retries are slow. If the script doesn't count errors, add the count.
- **The work happened.** Confirm the timed region really did it: the request arrived, the rows were written, the result was used. Lazy work nobody consumes and timeouts produce numbers for nothing.
- **Within limits.** Do the arithmetic against bandwidth, cores and the share of the run the changed piece takes. Removing a piece that takes 10% of the run makes it at most about 11% faster. A result past a limit measured a cache, a no-op or a bug.
- **The limiter.** Profile in a separate run you don't report (profilers slow the work). Map the hot spot to source.
- **Relevance.** Next to any micro result, measure the end-to-end path a user waits on, at realistic sizes and concurrency, and report the micro result as a share of it.

## Compare

Report the median and the range per side. A gap smaller than the run-to-run spread is no measurable difference. For a close call, use a rank-sum test or the harness's own statistics.

## Verdict

One of: **faster**, **slower**, **no measurable difference**, **inconclusive**. It is inconclusive when the limiter is unnamed, a side ran untuned, or errors and "did the work happen" went unchecked; name the gap.

Report shape: "p50 41 ms → 33 ms, median of 7 runs per side, range 32 to 35 ms after, bound by parsing on one core." A pull request body carries one primary number; the runs, range and limiter evidence go in a linked note.

A quick ballpark the user asked for may be one run: still count errors, confirm the work happened, and say it was one run. A choice between options is never a ballpark.

Record: `ven-decisions add --step explain-the-number --decision "<verdict>: <number>" --evidence "<runs per side>, range <range>, limiter <limiter>"`.
