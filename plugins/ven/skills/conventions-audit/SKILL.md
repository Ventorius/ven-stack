---
name: conventions-audit
description: "Find the mistake classes that keep recurring in this repo, from recent merged PRs, review comments, agent corrections and hook blocks, and propose a ratchet for each. Use before a refactor, on a schedule, or when the same review comment keeps coming back."
metadata:
  layer: L3
  source: cursor/plugins@main:pstack/skills/correct/SKILL.md
  license: MIT
---

# Conventions audit

Find the mistakes that keep coming back and propose the check that ends each one. Assume every contributor is an agent that sees only the files it opened, copies the nearest example, and takes the shortest path that passes. A repeated mistake is a fault in the repo, not in whoever made it.

## 1. Collect

The window is the last N merged PRs (default 20) and the same period of sessions; the user can change N.

- **Review comments:** the merged PRs in the window through `repo.forge.cli`, read-only: review comments, changes requested, fix-up commits pushed after review.
- **Reverts and follow-ups:** reverts, and fixes to work merged days before, from `git log --oneline` over the window.
- **Agent corrections:** `ven-transcripts --kind corrections --since <days>`: what the user objected to and what the agent had just done.
- **Hook blocks:** `ven-transcripts --kind blocks --since <days>`: which checks fired and how often.
- **Known gaps:** `conventions.md` patterns marked "Enforced by: nothing", and `$(ven-profile path)/solutions/` entries that describe the same problem.

For a large window, fan out one `ven:ven-worker` (`model: ${user_config.swarm_model}`) per source, read-only. Each returns one row per item: source, date, PR number or session, the quoted comment or correction, and the `file:line` it was about.

## 2. Cluster

Group items by the mistake, not by the wording: "don't read the clock directly" and "use the time module here" are one class. For each class write the mistake in one sentence, the right way, every instance with its citation, and when it was first and last seen.

A class counts once it has two instances from different PRs or sessions. Several comments on one PR count once. Classes with one instance go under Watch.

Hook blocks are their own signal:
- The same block firing again and again means the check works but its message doesn't teach. Fix the message, or add a skill line.
- A block the user overrode or allowed means the check may be wrong. Flag it for review.

## 3. Propose

For each class:
1. Check whether something already enforces it (`ven-profile adapters`, the pack's `rules/` and `hooks/`, the profile's `boundaries`). An enforced class that still recurs is the finding: the check is broken, unwired, baselined away, or silent about the fix.
2. Otherwise propose the highest rung of **ratchet** that could state it, with one line on why each higher rung can't.

## 4. Report and hand off

| Class | Instances | Proposed rung | Why not higher | Already enforced |
|---|---|---|---|---|

Order by instance count, then by the cost of the mistake. Under the table: the hook-block findings, then Watch.

Ask the user which classes to fix, with one multi-select AskUserQuestion. Hand each approved class to **ratchet**, one at a time.

Record: `ven-decisions add --step conventions-audit --decision "<n> classes, <n> approved" --evidence "<n> PRs, <n> sessions, window <dates>"`.
