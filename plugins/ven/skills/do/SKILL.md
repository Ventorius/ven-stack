---
name: do
description: "Route a task to one playbook (core or from a repo pack), state the pick, copy its steps into the task list and run them with proof and a learning check. Use for any work in a repo onboarded with ven."
argument-hint: <task>
disable-model-invocation: true
metadata:
  layer: L5
  source: cursor/plugins@main:pstack/skills/poteto-mode/SKILL.md
  license: MIT
---

# do

The task: $ARGUMENTS

You own the run. Pick one playbook, show the pick, copy its steps, run them in order, prove the result and close with a learning check. You think, decide and delegate; bulk edits go to agents.

## 1. Read the repo state

- `ven-profile show`. If it fails, the repo has no profile. A question you can answer by reading code alone may still run the **investigation** playbook. Anything else: tell the user to run `/ven:onboard` and stop.
- `ven-profile fresh` exits 1: say the profile is stale, suggest `/ven:onboard --refresh`, and treat commands tied to the changed files as unverified.
- `ven-decisions active` shows a playbook in this worktree: a task that continues it routes to **pickup**, a pause routes to **pause**. A new task closes it first with `ven-decisions end --outcome <done|abandoned|blocked>`, whichever it reached.
- Commands come only from the profile. A missing or `unverified` key: say so and don't rely on it.

## 2. Build the playbook list

- Core: the frontmatter `description` of each `${CLAUDE_PLUGIN_ROOT}/skills/do/playbooks/*.md`.
- Packs: `ven-profile get packs` (not set means none). Each pack's `playbooks` are absolute paths; read their frontmatter too.
- Name the files the task touches (from the task, or a quick search) and run `ven-profile packs-for <files>`. Those packs apply to this task.

## 3. Pick

Match the task's shape, not its words. First match wins:

1. The task names a ven skill to run ("forge-pack <name>", "ratchet this", "diagram the deps"): run that skill as a one-step sequence, then **learning-check**.
2. A pack playbook whose description fits, from a pack that applies to the task's files. It beats a core playbook of the same shape because it carries the repo's specifics.
3. A core playbook whose description fits.
4. Nothing fits: compose an ad-hoc sequence (section 7).

When two fit, take the one that asks more of the evidence. Close calls:

- Broken, wrong or regressed → **bug-fix**, even when the fix looks like new behavior.
- Same behavior, new structure → **refactor**. One mechanical change across many call sites → **migration**.
- Slow, with a number or a measurable symptom → **perf**. "Is this slow?" with nothing to measure → **investigation** first.
- A question, no change → **investigation**. "Explain this PR", "teach me X" → **explain**.
- "Run until done" over existing tickets → **autonomous-run**. No spec or tickets yet → **feature**.
- "Continue", "pick up" → **pickup**. "Stop here", "pause" → **pause**. "Open a PR", "ship it" → **ship**.

## 4. Announce and record

The first line of your reply, exactly:

`**Playbook: <name>** (core | pack <pack> | skill) — <one-line reason>`

Keep that shape: `ven-transcripts` parses it to measure misroutes. Then:

1. `ven-decisions start <name>`. Skip it for **pickup** and **pause** while a playbook is active: they work inside that playbook, and `start` would reset its recorded steps and the reproduce gate.
2. Copy the playbook's steps verbatim into the task list (TaskCreate), one task per step: the step line as the subject, its `Done:` line as the description. Task-specific tasks go after them, never instead of them.
3. A step you won't run stays in the list as `skip: <reason>` and is recorded with `ven-decisions skip --step <step> --reason "<reason>"`.
4. After each step: `ven-decisions add --step <step> --decision "<one line>" --evidence "<command + exit code, or file:line>"`. `<step>` is the step's skill name, or its label when it names no skill.

## 5. Run the steps

In order. A step's `Done:` line is its gate: the next step starts only when it holds, or after you record why it can't.

Delegate by the ambiguity left, not by size:

| Work | Agent | Agent tool parameters |
|---|---|---|
| One ticket end to end, test-first | `ven:ven-coder` | `model: ${user_config.coder_model}`; own worktree, background |
| A fully specified edit, or one slice of a fan-out | `ven:ven-worker` | `model: ${user_config.swarm_model}` |
| One review lens, blind to the others | `ven:ven-reviewer` | `model: ${user_config.orchestrator_model}` for the high-risk lens, else `${user_config.coder_model}` |
| Citation and proof checks | `ven:ven-verifier` | `model: ${user_config.swarm_model}` |

- Budget tier: `${user_config.budget_tier}`, unless `ven-profile get budget_tier` sets one for this repo. `lean`: pass `effort: low` and skip optional panels. `max`: pass `effort: high`. `standard`: the agent's default.
- A brief drops a tier only when complete: inputs, exact files, expected output shape, a check command from the profile, and the `playbook` and `step` for its result trailer. A brief that says "decide" or "figure out" stays with you.
- Pack skills: agent preloads are static. For each pack that `ven-profile packs-for <brief files>` returns, add "load skill `<plugin name>:<skill>` before you start" to the brief for each of its `skills`. Load them yourself when you work on those files.
- Parallelize only work on disjoint files. Shared writes run in order.
- Read every `VEN-RESULT` trailer. On `BLOCKED: <question>`, answer from the spec or the code, or ask the user if the call is theirs, then spawn a fresh agent with the consolidated brief. Never let an agent guess.
- You own what agents return. Read the diff and check the logged verify pass (`ven-decisions list`) before you merge a worktree; a trailer is a claim, not proof.
- Ask the user (AskUserQuestion) only for calls that are theirs: product decisions, and irreversible or outward-facing actions (PRs, pushes, comments, tracker tickets, installs). Find facts yourself. Apply **never-block-on-reversible** to the rest.
- Apply the principles in [references/principles.md](references/principles.md) when their trigger fits. Name each one that changed a decision in your reply, and the choice it changed.

## 6. Review panels

Run **review** as a panel of blind lenses only when a changed file matches a profile `risk_areas` glob (`ven-profile get risk_areas`), when the playbook asks for a panel, or when the budget tier is `max`. Otherwise the review step is your own read of the diff against the spec or ticket, recorded with `ven-decisions add --step review`. The budget tier never removes a panel from risky work.

## 7. No playbook fits

Compose a one-off sequence from existing skill names only, ending with **learning-check**. State it as `**Playbook: ad-hoc** (composed) — <reason>`, list the sequence on the next line, and run it like a playbook (`ven-decisions start ad-hoc`). If `ven-decisions list --playbook ad-hoc` shows the same shape before, suggest `/ven:forge-playbook` to the user.

## 8. Close

The last step is always **learning-check**. Then `ven-decisions end --outcome <done|abandoned|blocked>`. After **pause**, skip `end`: the playbook stays active for the next pickup.

Reply: what changed and for whom, the evidence (verify keys and exit codes), skipped steps with reasons, and open decisions. Every claim carries its evidence, or is labeled inferred or guess.
