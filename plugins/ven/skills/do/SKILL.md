---
name: do
description: "Route a task to one playbook (core or from a repo pack), state the pick, copy its steps into the task list and run them with proof and a learning check. Use for any work in a repo onboarded with ven."
argument-hint: <task>
disable-model-invocation: true
metadata:
  layer: L5
  source: cursor/plugins@1e5c90a:pstack/skills/poteto-mode/SKILL.md
  license: MIT
---

# do

The task: $ARGUMENTS

You own the run. Pick one playbook, show the pick, copy its steps, run them in order, prove the result and close with a learning check. You think, decide and delegate; bulk edits go to agents.

## 1. Read the repo state

- `ven-profile show`. If it fails, the repo has no profile. A question you can answer by reading code alone may still run the **investigation** playbook. Anything else: tell the user to run `/ven:onboard` and stop.
- `ven-profile fresh` exits 1: say the profile is stale, suggest `/ven:onboard --refresh`, and treat commands tied to the changed files as unverified.
- `ven-decisions active` shows a playbook in this worktree: a task that continues it routes to **pickup**, a pause routes to **pause**. A new task while a playbook is active (running or paused) is not silent: ask the user (AskUserQuestion) whether to finish, abandon or keep the old one paused, and record the answer. Close it with `ven-decisions end --outcome <done|abandoned|blocked>` only on finish or abandon. A paused playbook keeps its state; run the new task in a separate worktree or branch, or after the pickup.
- Commands come only from the profile. A missing or `unverified` key: say so and don't rely on it.

## 2. Build the playbook list

- `ven-profile playbooks` lists every core and pack playbook with its source, path and one-line description. Pick from that list; read a playbook file only once you've picked it.
- Name the files the task touches (from the task, or a quick search) and run `ven-profile packs-for <files>`. Only those packs apply to this task.

## 3. Pick

Match the task's shape, not its words. First match wins:

1. The task names a ven skill to run ("forge-pack <name>", "ratchet this", "diagram the deps"): run that skill as a one-step sequence, then **learning-check**.
2. A pack playbook whose description fits, from a pack that applies to the task's files. It beats a core playbook of the same shape because it carries the repo's specifics.
3. A core playbook whose description fits.
4. Nothing fits: compose an ad-hoc sequence (section 7).

When two fit, take the one that asks more of the evidence. Close calls:

- Broken, wrong or regressed → **bug-fix**, even when the fix looks like new behavior.
- Same behavior, new structure → **refactor**. One mechanical change across many call sites → **migration**.
- "X got slower": a baseline number exists or the user wants a speed target → **perf**; a functional break (timeouts, wrong results) → **bug-fix**. "Is this slow?" with nothing to measure → **investigation** first.
- A question, no change → **investigation** when it asks a specific question and wants findings; **explain** when it teaches or builds understanding for a person ("explain this PR", "teach me X", "walk me through").
- Production is down or erroring right now, user-facing, needs a fast fix → **hotfix**. A defect with no live fire → **bug-fix**.
- A test that fails intermittently with no code change → **flaky-test**. A test that fails every time → **bug-fix**.
- "Can we do X?", "try it and tell me", a throwaway experiment → **spike**.
- Bump a dependency, runtime or toolchain version → **dependency-upgrade**. Swap one API or pattern across call sites → **migration**.
- Only documentation files change → **docs-only**. Docs plus behavior → **feature**.
- Spans several sessions with an unclear route → **epic**, even when no code changes yet: a chain of decisions to settle before building is epic, one question answered now is **investigation**. Decisions already settled → **feature**.
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
- Parallelize independent work. Tickets follow the blocker graph (feature playbook); direct writes to the same files run in order.
- Read every `VEN-RESULT` trailer. On `BLOCKED: <question>`, answer from the spec or the code, or ask the user if the call is theirs, then continue the same agent with SendMessage (it keeps its worktree and context); never spawn a new one for the answer. Never let an agent guess. A coder's trailer carries `worktree:` and `branch:`; use them to merge.
- You own what agents return. Read the diff and check the logged verify pass (`ven-decisions list`) before you merge a worktree; a trailer is a claim, not proof.
- Ask the user (AskUserQuestion) only for calls that are theirs: product decisions, and irreversible or outward-facing actions (PRs, pushes, comments, tracker tickets, installs). Find facts yourself. Apply **never-block-on-reversible** to the rest.
- Apply the principles in [references/principles.md](references/principles.md) when their trigger fits. Name each one that changed a decision in your reply, and the choice it changed.

## 6. Review panels

Each playbook declares `review: panel` or `review: own-read` in its own text. Feature and migration declare panel; refactor and perf declare panel only when a changed file matches a `risk_areas` glob (`ven-profile get risk_areas`); bug-fix, hotfix, docs-only and spike declare own-read. Budget tier `max` forces a panel. A risk-area match upgrades own-read to panel too. The budget tier never removes a panel from risky work.

Panel: run **review**. Own-read: read the diff against the spec or ticket and record it with `ven-decisions add --step review`.

## 6a. Small-task fast path

A task that touches at most two files, has a known check command, and matches no `risk_areas` glob skips the per-step task-list items and the per-step `ven-decisions add` rows. It still runs `ven-decisions start`, **verify** (`ven-profile verify <key>`), one **learning-check** row and `ven-decisions end`. Say `fast path` in the announce line's reason. A one-line bug fix with an obvious cause may skip diagram-hypotheses' three-cause minimum, never **reproduce**.

## 7. No playbook fits

Compose a one-off sequence from existing skill names only, ending with **learning-check**. State it as `**Playbook: ad-hoc** (composed) — <reason>`, list the sequence on the next line, and run it like a playbook (`ven-decisions start ad-hoc`). If `ven-decisions list --playbook ad-hoc` shows the same shape before, suggest `/ven:forge-playbook` to the user.

## 8. Close

The last step is always **learning-check**. Then `ven-decisions end --outcome <done|abandoned|blocked>`. After **pause**, skip `end`: the playbook stays active for the next pickup.

Reply: what changed and for whom, the evidence (verify keys and exit codes), skipped steps with reasons, and open decisions. Every claim carries its evidence, or is labeled inferred or guess.
