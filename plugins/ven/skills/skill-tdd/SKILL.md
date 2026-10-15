---
name: skill-tdd
description: Prove a skill change with evals before it lands, a pressure case that fails without the change and passes with it, then the routing and trigger suites with no regression. Use before creating or editing any skill, pack skill, playbook or description, and to apply a queued proposal.
metadata:
  layer: L3
  source: obra/superpowers@main:skills/writing-skills/SKILL.md
  license: MIT
---

# Skill TDD

No skill change without a failing eval first. This covers new skills, edits, descriptions, playbook steps and "just one line". If you did not watch the case fail without the change and pass with it, you do not know that the change teaches anything.

A skill never edits itself in the session that proposed the change: a proposal written while reviewing a session is applied in a later one. Work the user starts for its own sake, such as forging a new skill or updating their mode overlay, is proven in the same session.

## Proposals

Skills that find a change queue it as `$(ven-profile path)/proposals/<YYYY-MM-DD>-<slug>.md`:

```markdown
---
target: <skill, playbook or eval path; core or pack>
kind: <skill-edit | description | new-skill | routing-case | check | pattern-fix>
proposed_by: <skill name>
date: <YYYY-MM-DD>
status: proposed
---
## Rule
<The behavior the change must produce, in one sentence.>
## Evidence
- <Verbatim quote, with session id or transcript turn.>
## Change
<The smallest diff that produces the rule.>
```

When done, set `status: applied` or `status: rejected` and append `## Result` with the eval delta. A `check` proposal is not a skill change: hand it to the ratchet workflow.

## 1. Red: write the case first

Before touching the skill, write a pressure case under the plugin's `evals/skills/<skill>/<skill>-<scenario>/`: a `prompt.md` and `graders/*.md`. A pack keeps its cases in `<pack>/evals/<skill>-<scenario>/` and runs them with `--eval-dir evals`. How to build the pressure and the graders: `references/pressure-cases.md`.

## 2. Baseline: watch it fail

Make a copy of the plugin as it was before the change:

- Plugin in git: `git worktree add <tmp> HEAD`, then copy the skill's eval directory (`evals/skills/<skill>/`, with the new case) to the same path under `<tmp>`, so both copies run the same cases.
- Plugin outside git (a pack in the state directory, a personal overlay): copy the plugin directory to `<tmp>` before editing anything.

Eval runs execute the plugin and its scaffold scripts as the user. Ask once before the first run; on yes, pass `--trust-plugin`. Run the baseline (all commands in this skill also take `--no-publish`, keeping reports local):

```bash
claude plugin eval <tmp>/<plugin> --eval-dir evals/skills/<skill> --case <case> --runs 3 --ablation none --scaffold --max-cost-usd 15 --no-publish --output-dir <results>/baseline
```

The case must fail: at most 1 of 3 runs passes. If the baseline passes, there is nothing to fix. Reject the proposal with that result and stop.

A new skill has no "before": run the candidate once with `--ablation with-without`; the without arm is the baseline.

## 3. Green: smallest change that passes

Make the smallest change that addresses the failure you watched, nothing for hypothetical cases. Run the same command against the working copy with `--output-dir <results>/candidate`. It must pass 3 of 3. When it doesn't, read the traces, find the excuse the agent used, counter that excuse, and rerun.

## 4. No regression

Run each suite against both copies and compare:

```bash
claude plugin eval <plugin> --eval-dir evals/routing --runs 3 --ablation none --scaffold --max-cost-usd 10 --no-publish --output-dir <results>/<copy>/routing
claude plugin eval <plugin> --eval-dir evals/skills/<skill> --runs 3 --ablation none --scaffold --max-cost-usd 15 --no-publish --output-dir <results>/<copy>/trigger
```

For a pack, both suites are the pack's own `evals/`: routing cases for its playbooks, trigger cases for its skills.

The skill's suite holds at least one case where it should fire and one where it should stay quiet. Add them if missing; a description change always gets both.

## 5. Decide

Read pass rate, `costUsd` and token totals from each `aggregate-result.json`. Reject the change when:

- the pressure case did not go from failing to passing,
- the pass rate of any suite dropped, or
- cost or tokens on any suite rose more than 20%.

Then run `ven-lint-skills`. The core line budget (`core_line_budget` in the plugin's `lint.json`) is a cap: an edit that would exceed it removes lines elsewhere. Never raise the budget in the same change.

## 6. Land it

Commit the skill change and its case together. The message body carries the delta:

```text
<imperative subject>

case <case>: 0/3 -> 3/3
routing: <n>/<n> -> <n>/<n>; trigger: <n>/<n> -> <n>/<n>
cost <+/-n>%, tokens <+/-n>%
```

A pack outside git records the same lines under the proposal's `## Result`. Remove the worktree with `git worktree remove <tmp>`.

## Excuses

| Excuse | Answer |
|---|---|
| "It's one line." | One line changes behavior. One case proves which way. |
| "The wording is obviously clear." | Clear to you is not clear to the next agent. |
| "A vibe check with the user is enough." | A vibe check measures taste, not behavior. Write the case. |
| "I'll add the eval after." | A case that never failed proves nothing. |
| "The evals cost too much." | The suites are capped. A bad skill costs every future session. |
