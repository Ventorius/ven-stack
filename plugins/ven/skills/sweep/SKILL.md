---
name: sweep
description: "Fan a mechanical or partitionable job out to parallel ven-workers, one complete brief per slice, and aggregate one evidenced report. Use for renames across many files, per-package migration batches, applying a codemod in slices, or parallel probes."
metadata:
  layer: L3
  source: cursor/plugins@main:pstack/skills/swarm/SKILL.md
  license: MIT
---

# Sweep

Split a job into slices, give each slice to a `ven:ven-worker` with a brief that leaves nothing to decide, and return one report. Open a task list with one entry per phase below before spawning anything.

## 1. Frame

1. **Done predicate.** State what must be true when the sweep is finished, and what the report returns.
2. **Lever first.** Apply **build-the-lever**. If one script or codemod can do every slice the same way, do the first unit by hand, build the script, prove it on that unit by diffing against your hand-done version, and run it yourself. Fan out only what a script can't do in one pass, or the per-slice checking of what it did.
3. **Shape.**
   - **Partition:** one slice per package, directory or file batch. File sets are disjoint: two workers never write the same file.
   - **Race:** N workers on the same brief. Declare the selection rule before spawning: first pass, rank all, or best of.
4. **N** comes from the user or the shape. Each worker that writes gets its own files; each that measures gets the exact commit SHAs and the method.

## 2. Brief

Every brief stands alone. It names:

- the goal and the slice: inputs and the exact files the worker may touch;
- the recipe, or the lever command to run, and the do-not-touch fences;
- the expected output shape;
- the check command, from the profile: `ven-profile run commands.test.single --file <path>`, `ven-profile run commands.typecheck`, or the lever's own check;
- the verdict to report: `PASS`, `ISSUES` (every issue it can prove, each with evidence, not just the first) or `BLOCKED` (one question). `ISSUES` is for probe and check slices; an edit slice whose check fails is fixed within its scope or reported `BLOCKED`.

A brief that contains "decide" or "figure out" is not ready. Make the decision first, or ask the user.

## 3. Fan out

Spawn every worker in one message with the Agent tool: `subagent_type: ven:ven-worker`, `model: ${user_config.swarm_model}`, `run_in_background: true`. Budget tier `${user_config.budget_tier}`: `lean` passes `effort: low`, `max` passes `effort: high`. If a worker drops out, continue with the rest and note it.

## 4. Aggregate

- Read each final result. Drop one that lacks a verdict, lacks the check's exit code, or touched files outside its slice, and respawn that worker once with the same brief plus what was missing. A second miss is a **gap**. A gap is never a pass.
- `BLOCKED`: answer the question (ask the user if it is their decision) and respawn with the answer in the brief.
- Coverage needs a result for every slice. A race applies the rule declared up front.
- A worker's PASS is a claim. Check the combined diff yourself (`git diff --stat` against the slice list) and apply **prove-it-works**.
- Run **verify** on the combined tree.

## 5. Report

One report in chat, no raw worker output:

| Slice | Verdict | Evidence |
|---|---|---|
| `<slice>` | PASS / ISSUES / BLOCKED / gap | `<check command> exit <code>` |

Then one line per issue, the gaps and dropouts, and the race rule if one was used.

Record: `ven-decisions add --step sweep --decision "<n> slices: <p> pass, <i> issues, <g> gaps" --evidence "<combined check> exit <code>"`.
