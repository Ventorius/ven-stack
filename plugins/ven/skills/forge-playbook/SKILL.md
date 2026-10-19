---
name: forge-playbook
description: "Compose a pack playbook for a task shape that keeps recurring in this repo, using only skills that already exist, and register it with the router. Use when no core playbook fits a repeated kind of task, or the user asks for a domain playbook."
metadata:
  layer: L3
  source: cursor/plugins@1e5c90a:pstack/skills/figure-it-out/SKILL.md
  license: MIT
---

# Forge a playbook

A playbook is an ordered list of existing skills for one task shape, so the router runs the same proven sequence every time that shape comes up. It holds no know-how of its own: each step names a skill, and the skill holds the how.

**Input:** a pack and a task shape. `<pack dir>` stands for `$(ven-profile path)/packs/<pack>/`; `<ven root>` for `${CLAUDE_PLUGIN_ROOT}`.

## 1. Confirm the shape repeats

Find real tasks of this shape, enough to meet the pack bar in **encode-lessons-in-structure**:

- corrections in `ven-decisions list --step correction` that point at the same missing step;
- sessions in `ven-transcripts --kind routes --since 90` that were rerouted or ran a playbook with steps that didn't fit;
- `ven-decisions list` rows where the same steps keep ending in `skip:` for the same reason;
- merged PRs that followed the same sequence by hand.

Below the bar, or a core playbook fits with at most one skipped step: write nothing, and name the core playbook to use.

## 2. Frame it

Before choosing steps, write down:

- **Done:** a falsifiable statement of what is observed when a task of this shape is finished. Apply **prove-it-works**.
- **Rigor:** what makes the shape risky (a one-way door, paths in `ven-profile get risk_areas`, effects outside the repo). Risk decides which steps are gates.

## 3. Compose from existing skills only

1. List what exists: every skill under `<ven root>/skills/` and `<pack dir>/skills/`, with its description.
2. Order the steps the way core playbooks do: align before building, put the proof harness in place before the change, verify each unit before the next, review before shipping. Riskiest unknown first.
3. Give each step a `Done:` line: the observable condition that ends it for this shape. The router copies it into the task list and treats it as the step's gate; mark the steps that must hold before anything else continues `(gate)`.
4. End with the learning-check step, as every playbook does.

A step with no skill to name means either an existing skill covers it, or the skill is missing: stop and forge it first (suggest `/ven:forge-skill`). Never write the missing know-how into the playbook. Done when every step names a skill that exists and its `Done:` line is checkable.

## 4. Write it

Copy `<ven root>/templates/playbook/playbook.md` to `<pack dir>/playbooks/<name>.md` and fill it:

- `name`: kebab-case, not the name of any file in `<ven root>/skills/do/playbooks/`.
- `description`: the one line the router matches on, in the words a request uses, the leading word first.
- Steps: core skills as `**<name>**`, pack skills as `**<plugin>:<skill>**`, each followed by its `Done:` line; then the `**Reply:**` line saying what the final answer reports.

## 5. Prove the router picks it

Copy `<ven root>/templates/playbook/cases/route/` twice into `<pack dir>/evals/`, filling every `{{` placeholder:

- `route-<name>/`: a task of this shape, in a user's words; the expected playbook is `<name>`.
- `route-<name>-near-miss/`: a task in the same area that a core playbook fits; the expected playbook is that core one.

Run `node <pack dir>/scripts/eval.mjs --ven <ven root> --case 'route-<name>*' --runs 3 --max-cost-usd 5 --allow-tools "Bash(ven-profile *)" "Bash(ven-decisions *)"`; the router reads pack playbooks through `ven-profile`. Both cases pass 3/3. A miss on the first sharpens the description; a miss on the near-miss narrows it. Then the whole pack suite still scores 1.00 per case.

## 6. Register

1. Add `{ "name", "file": "playbooks/<name>.md", "evidence": [<tasks>], "cases": [<route cases>] }` to `playbooks` in `<pack dir>/pack.json`; bump the patch `version` in `<pack dir>/.claude-plugin/plugin.json`.
2. The router finds pack playbooks through the profile: from `ven-profile get packs`, add the playbook's absolute path to this pack's `playbooks`, and save the list with `ven-profile set packs '<json>'`.
3. Tell the user the playbook is live: the router reads the profile on every `/ven:do`, so no reload is needed unless the playbook names a pack skill that isn't loaded yet.
