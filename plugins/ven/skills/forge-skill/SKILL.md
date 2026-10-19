---
name: forge-skill
description: "Forge one skill into a repo pack from three or more real instances, proven by a scenario that fails without it and passes with it. Use when a correction or pitfall keeps recurring in one technology or domain, or the user asks for a pack skill."
metadata:
  layer: L3
  source: obra/superpowers@bb92a77:skills/writing-skills/SKILL.md + mattpocock/skills@49dd158:skills/productivity/writing-for-agents/SKILL.md
  license: MIT
---

# Forge a skill

A pack skill earns its place by stopping a mistake the agent really made, often enough to meet the pack bar, and by proving that it does. Run the six steps in order; each ends on a check.

**Input:** a pack and a recurring task, a cluster of corrections, or the user's request. `<pack dir>` is `$(ven-profile path)/packs/<pack>/` and `<ven root>` is `${CLAUDE_PLUGIN_ROOT}`. No pack yet: stop and suggest `/ven:forge-pack <name>`. A caller that already settled the evidence and the scope (an approved pack plan, a convention draft) starts at step 3. A change to one of ven's own skills goes through **skill-tdd** alone.

## 1. Evidence first

Collect real instances of the same mistake or need, enough to meet the pack bar in **encode-lessons-in-structure**:

- corrections from `ven-decisions list --step correction`, then `ven-transcripts --kind corrections --since 90` as the fallback;
- entries in `$(ven-profile path)/solutions/`;
- review comments on merged PRs, read with the code host CLI from `ven-profile get repo.forge.cli` (read-only subcommands), and `git log`.

Each instance records source, date, `file:line`, what went wrong and what fixed it. Done when the instances share one cause.

- Below the bar: forge nothing. Propose a **compound** entry for what you found, and say the skill can be forged once it recurs.
- A type, import rule, lint rule or hook could catch it: it belongs lower on the ladder. Apply **encode-lessons-in-structure** and stop.

## 2. Grill the scope

Settle four answers with **grilling**, each with your recommendation:

1. **One idea**, in one sentence. Two ideas are two skills; forge the better-evidenced one first.
2. **Trigger:** the words a task uses when the idea applies. They become the description and the eval prompts.
3. **Boundary:** what the skill must never do, and where the nearest core or pack skill takes over.
4. **Cites:** the core principles it applies, as `ven:<name>`.

Settle the layer too (L2 for a principle, L3 for a workflow) and a kebab-case name that neither `<ven root>/skills/` nor the pack already uses.

## 3. Write the failing scenario

Brief `ven:ven-coder` (`model: ${user_config.coder_model}`):

- **Inputs:** the instances and the four answers.
- **Files:** `<pack dir>/evals/<skill>-scenario/`, `<skill>-fires/` and `<skill>-quiet/`, copied from `<ven root>/templates/skill/cases/` (`scenario/`, `fires/`, `quiet/`, and `fixture.sh` into each), every `{{` placeholder filled. Nothing else changes: no repo files, so no commit and no verify step.
- **Shape:** the scenario prompt is one instance's task in the user's words and never names the skill. `fixture.sh` builds the smallest repo that reproduces it. `no-mistake` matches the mistake as the instances show it; `outcome` matches the fix. For a rule the agent skips under pressure, the prompt carries the pressures the transcripts show (time, sunk cost, an order to hurry).
- **Check:** with `<pack dir>/skills/<skill>/` absent, `node <pack dir>/scripts/eval.mjs --ven <ven root> --case '<skill>-scenario' --runs 3 --max-cost-usd 5 --allow-tools Edit Write Bash` shows `outcome` or `no-mistake` failing (`skill-fired` fails trivially and proves nothing). Report the per-grader results from `aggregate-result.json` and the agent's failing words verbatim.

Read the failing runs yourself (`--keep-temp` keeps them). When `outcome` and `no-mistake` both pass without the skill, the agent already gets this right: stop and say the skill isn't needed.

## 4. Draft the skill

You write it, at the orchestrator tier. Copy `<ven root>/templates/skill/SKILL.md` to `<pack dir>/skills/<skill>/SKILL.md` and fill it:

- **Description:** "<what it does>. Use when <the trigger>", under 300 characters, the trigger word early, one phrase per distinct case.
- **paths:** `applies_when.paths` from `pack.json`, or narrower when the idea is.
- **Length:** under 150 lines; 30 to 80 is typical. Library facts go to `<pack dir>/references/` through **forge-reference**, linked the way the template's "Library facts" line shows.
- **Content:** only the failures step 3 recorded, each in the form that fixes its kind:

| Recorded failure | Form |
|---|---|
| Knows the rule, skips it under pressure | The rule, then each recorded excuse verbatim with its counter |
| Right content, wrong shape | A recipe: the parts of the output, in order |
| Leaves out a required element | A required slot in the template the agent fills |
| Right only under a condition | A conditional on something observable: "if the file has X, do Y" |

- State the behavior to produce. Use a prohibition only as a hard guardrail, next to what to do instead.
- Cite core by name and never restate it: an L3 skill writes `**ven:prove-it-works**`; an L2 skill may cite nothing, so it names neighbors in plain text. Commands come from the profile.
- Give one example from a real instance, with `file:line`.

Done when `ven-lint-skills --pack <pack dir>` passes.

## 5. Prove it

Apply **skill-tdd**. For a pack skill the cases live in the pack and run through its runner at `--runs 3`:

- `<skill>-scenario` passes 3/3 with the skill, its `skill-fired` grader included;
- `<skill>-fires` fires 3/3 and `<skill>-quiet` stays quiet 3/3;
- the whole pack suite still scores 1.00 per case. It holds the pack's trigger and routing cases, so a drop there is a routing regression.

A failure is new evidence: name the excuse or the gap, change the draft for it, and rerun. After three rounds without a pass, ask the user whether to narrow the idea or drop the skill.

## 6. Register

1. Add `{ "name", "evidence": [<instances>], "cases": [<case names>], "delta": "scenario <without> -> <with>, 3 runs; suite <n>/<n>" }` to `skills` in `<pack dir>/pack.json`, and bump the patch `version` in `<pack dir>/.claude-plugin/plugin.json`.
2. Profile: in the list from `ven-profile get packs`, add the skill to this pack's `skills`, then store the list with `ven-profile set packs '<json>'`.
3. A task shape that needs its own sequence of steps: **forge-playbook**, which registers it with the router.
4. Commit only when the pack lives in a repo, as a promoted pack does: one commit per skill, the delta in the message, e.g. `Add <pack> <skill> skill (scenario 0.00 -> 1.00, suite 14/14)`. Packs under `$(ven-profile path)` are never committed.
5. Tell the user to run `/reload-plugins`.
