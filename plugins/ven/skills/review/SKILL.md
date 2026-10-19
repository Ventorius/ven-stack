---
name: review
description: "Review a diff with a blind panel of lens reviewers (correctness, design and depth, security and data, test honesty) and rank their findings into Act on, Consider, Noted and Dismissed. Use when a change is ready for review, before shipping, or when asked to review a branch or PR."
metadata:
  layer: L3
  source: cursor/plugins@1e5c90a:pstack/skills/interrogate/SKILL.md
  license: MIT
---

# Review

Reviews get their independence from lens and tier, not from a second model family. Each reviewer applies one lens and never sees another reviewer's output before synthesis. You are the lead: you filter and decide, you don't aggregate. Never apply fixes inside this skill.

If you are a `ven:ven-reviewer` with this skill preloaded: your brief carries your lens and its rubric. Apply only that lens and report as your agent file says. The rest of this file is for the lead.

## 1. Scope

- **Diff.** The range the user names, else `git diff $(ven-profile get repo.default_branch)...HEAD` plus uncommitted changes. Confirm it resolves and is non-empty before spawning anyone.
- **Spec.** The ticket or spec the work came from: `$(ven-profile path)/specs/`, `tickets/`, or a tracker link in the commits. None found: the panel reviews against intent alone and the report says "no spec".
- **Intent.** One paragraph from the spec, the commits and the conversation. If you are unsure of it, ask the user.
- **Risk.** The work is high-risk when a changed file matches a `risk_areas` glob (`ven-profile get risk_areas`). Keep each match with its reason (`risk_areas[].why`).
- **Writer.** Who wrote the diff: the coder tier (a `ven:ven-coder` worktree) or you.

## 2. Pick the panel

Whether to run a panel at all is decided by the playbook's `review:` line; this section only sizes the panel you were asked for. The budget tier is `${user_config.budget_tier}`; a profile `budget_tier` overrides it.

| Budget | Not risky | Risky |
|---|---|---|
| lean | correctness, test honesty | correctness, test honesty |
| standard | correctness, test honesty | all four lenses |
| max | all four lenses | all four lenses |

High-risk work adds a risk reviewer: the lens that the risk area's reason points at (security and data for stored data, permissions or secrets; correctness otherwise), scoped to the risky files, on `${user_config.orchestrator_model}`. If that lens is already on the panel, it moves to that tier rather than running twice. Every other lens runs on `${user_config.coder_model}`.

The writer and the risk reviewer must sit on different tiers. If the orchestrator tier wrote the diff, run the risk reviewer on `${user_config.coder_model}` and say so in the report.

Effort follows the budget: `lean` passes `effort: low`, `max` passes `effort: high`, `standard` keeps the agent default.

On risky work at `standard` or `max`, run **blast-radius** first. Its safety fact and risks go into every brief as context, not as findings to confirm.

## 3. Spawn blind reviewers

Spawn the whole panel in one message: `subagent_type: ven:ven-reviewer`, one lens each, with the model from step 2. Each brief contains:

- the lens name and its rubric, pasted whole from `references/lenses.md`;
- the intent paragraph, the exact diff command, and the spec path or "no spec";
- the risk matches with their reasons, and the paths of `$(ven-profile path)/conventions.md` and `GLOSSARY.md` when they exist;
- "For each Act on finding, propose a reproducing test: the file, the test body, and `ven-profile run commands.test.single --file <path>`."

Never pass one reviewer's output, or your own opinion of the diff, into another brief.

## 4. Prove what one lens alone raised

An Act on finding raised by one lens, with a proposed test that nobody ran, gets run before you rank it. Spawn `ven:ven-worker` with `isolation: worktree` and `model: ${user_config.swarm_model}`: add the proposed test only, run it, report the exit code and output. A test that fails for the stated reason proves the finding. A test that passes demotes it. On `lean`, skip this and mark the finding "argued".

## 5. Synthesize

Read `references/synthesis.md`. Merge duplicates, check every Act on finding against the code yourself, then rank and bucket.

## 6. Report

- **Intent:** the paragraph from step 1.
- **Panel:** one line per reviewer: lens, model tier, number of findings.
- **Act on:** the finding, `file:line`, the lenses that raised it, the proof (test and exit code, or "argued"), why it matters.
- **Consider:** the finding, the lenses, the trade-off.
- **Noted:** one line each.
- **Dismissed:** each with its one-line reason.
- **Agreement:** where lenses converged or contradicted, and what that says about the change.

Record the result: `ven-decisions add --step review --decision "<n> act on, <n> consider" --evidence "<lenses run>; <tests run with exit codes>"`.

Posting findings as comments on the code host is outward-facing. Draft them, show the user, and post with `repo.forge.cli` only after the user approves.
