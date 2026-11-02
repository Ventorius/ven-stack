# ven-stack

A set of plain skills for engineering work in any repo, usable from any coding agent that loads `SKILL.md` folders and can run shell commands. ven knows nothing about a particular stack or business domain. It routes every task through a playbook, learns each repo's commands the first time a task needs them, requires proof before a change counts as done, and forges repo-specific **packs** for the technologies and domains it finds.

- **No onboarding.** A repo needs no setup step. When a task needs a command, ven finds it in the repo, runs it once and records whether it passed (`ven-profile learn`). Facts only a person knows, such as what is risky to touch, are asked the first time a step needs them.
- **Route every task.** The `do` skill picks one playbook (feature, bug-fix, refactor, …), copies its steps into the task list and runs them in order.
- **Prove changes.** `ven-decisions end` refuses to close a run as done until a verify command passed against the current working tree, and `ven-profile verify` refuses a diff that hides a check (a suppression comment, deleted test assertions).
- **Learn under gates.** Each correction is turned into the strongest check that can catch it (the `ratchet` skill). A skill edit is kept only if its evals pass.
- **Any agent.** No hooks, no agent definitions, no plugin settings. Work that can be handed off goes to a role (coder, worker, reviewer, verifier) as a subagent when the agent supports one, or as a separate pass when it doesn't.

The original design rationale is in [`ven-stack design v2.md`](ven-stack%20design%20v2.md). Where the implementation differs from it, [`docs/build/authoring-guide.md`](docs/build/authoring-guide.md) is authoritative.

## Requirements

- An agent that loads skills from `SKILL.md` folders and runs shell commands
- Node.js 22 or later (the tools are plain Node scripts with no dependencies)
- git, and a git repository to work in
- The `claude` CLI, only to run evals (routing evals, pack evals, skill-tdd)
- [Bun](https://bun.sh) 1.4 or later, only to develop ven itself (tests, lint)

## Install

### Claude Code

The repo is a plugin marketplace (`.claude-plugin/marketplace.json`) with one plugin, `ven`, which is the `plugins/ven/` skills tree:

```text
/plugin marketplace add Ventorius/ven-stack
/plugin install ven@ven-stack
```

To update: `/plugin marketplace update ven-stack`.

### Other agents

Clone the repo and link each skill folder into the directory your agent loads skills from. Linking, rather than copying, means `git pull` updates the skills:

```sh
git clone https://github.com/Ventorius/ven-stack
ln -s "$PWD"/ven-stack/plugins/ven/skills/* <your agent's skills directory>/
```

ven's skill names are not prefixed (`do`, `review`, `tdd`, …). If your agent already has a skill with one of these names, keep one of the two.

### Then, in any agent

Ask the agent to run the `setup` skill, or run its installer yourself:

```sh
node <ven skills>/setup/scripts/install.mjs
```

It links `ven-profile`, `ven-decisions`, `ven-doctor`, `ven-lint-skills` and `ven-transcripts` into `~/.ven/bin` and prints the `PATH` line to add if that directory is not on your `PATH`. `ven-doctor` checks the result.

### Settings

Per-user settings live in `~/.ven/config.json`. Read and change them with `ven-profile config`:

| Setting | Default | Used for |
|---|---|---|
| `orchestrator_model` | `inherit` | The high-risk review lens |
| `coder_model` | `inherit` | The coder role (one ticket end to end with TDD) and the other review lenses |
| `swarm_model` | `inherit` | The worker and verifier roles: fully specified edits, fan-out slices, citation checks |
| `budget_tier` | `standard` | `lean` lowers effort and skips optional review panels; `max` raises effort and always runs panels. A repo can pin its own with `ven-profile set budget_tier <tier>`. |

`inherit` means the model your agent already runs. Model names are free text, so use your agent's own names, and only if it can pick a model per subagent.

### Upgrading from an onboarded ven

Run `ven-profile migrate` once in each repo you had onboarded. It moves `map.md` and the old pack marketplace into `legacy/`, deletes hook state, turns plugin-era packs into directory packs, and keeps the profile, glossary, solutions and decision log. `ven-doctor` and `ven-profile context` point at it when it is needed.

## Quick start

Invoke the `do` skill with a task (`/ven:do <task>` in Claude Code; other agents invoke skills by name):

```text
do: add CSV export to the reports page
help: which skill turns a correction into a lint rule?
```

1. **`do`** starts its reply with `**Playbook: <name>** (core | pack <pack> | skill) — <reason>`, logs each step to the decision log, learns any command it needs, and closes with a learning check.
2. **`help`** suggests the skill to invoke and checks this repo's ven state. It never runs the work itself.

## How it works

### Layers

| Layer | Contents |
|---|---|
| L5 | `do` (router), `help`, `yeet` |
| L4 | Playbooks in `skills/do/playbooks/`, read by the router |
| L3 | Workflows: align, build, prove, review, understand, write, visual, conventions, learning, forge |
| L2 | Principles, one idea each |
| L1 | `delegate` (roles), `setup` (tools and settings) |

References only point down a layer, or sideways within L3. Core skills never name a framework, vendor, language or business domain, and never use one agent's tool names or variables (see the denylist and the portability list in [`plugins/ven/skills/setup/scripts/lint.json`](plugins/ven/skills/setup/scripts/lint.json)). `ven-lint-skills` enforces these rules, as well as the 150-line skill limit, the no-duplication rule, the absence of cycles and the line budget for core.

### Playbooks

| Playbook | Use when |
|---|---|
| `investigation` | A question with no change: how does X work, why is Y like this |
| `feature` | New behavior: grilling → spec → tickets → TDD per ticket → verify → review |
| `bug-fix` | Something is broken or regressed. A repro must exist before source edits. |
| `refactor` | Same behavior, new structure |
| `hotfix` | Production is broken now: the smallest safe fix first, root cause as its own ticket |
| `flaky-test` | A test that passes and fails without a code change: measure the failure rate, then fix the cause |
| `spike` | A time-boxed throwaway experiment that answers one question; nothing from it is merged |
| `dependency-upgrade` | Move a dependency, runtime or toolchain to a newer version, reading the breaking changes first |
| `docs-only` | A documentation change with no behavior change |
| `perf` | Slow, with a number to measure |
| `migration` | One mechanical change across many call sites: codemod first, then a sweep |
| `explain` | Explain a PR, or teach a subsystem diagram by diagram |
| `autonomous-run` | Run existing tickets to done, with an iteration cap and the verify check at the end |
| `epic` | Plan an effort that spans several sessions: one decision ticket per session, no edits in the repo |
| `pickup` / `pause` | Resume from a handoff note, or park work safely |
| `ship` | Verify → review → PR with the decision log in the body |

A pack playbook beats a core one of the same shape when the pack applies to the files the task touches. When no playbook fits, the router composes an ad-hoc sequence from existing skills.

### Roles

The `delegate` skill holds one brief template per role:

| Role | Model setting | Does |
|---|---|---|
| coder | `coder_model` | One ticket with TDD, in its own worktree |
| worker | `swarm_model` | One fully specified edit, fan-out slice or read-only probe |
| reviewer | `coder_model`; `orchestrator_model` for the high-risk lens | One review lens, blind to the other lenses, read-only |
| verifier | `swarm_model` | Checks citations and claims without editing |

Work moves to a role only when its brief is complete: inputs, exact files, the expected output shape and a check command. A role that hits ambiguity returns `VEN-RESULT: BLOCKED: <question>` instead of guessing. Every result ends with a `VEN-RESULT` trailer, which the caller logs with `ven-decisions add`. In an agent without subagents, each brief runs as a separate pass.

### Checks

| Check | Where | Behavior |
|---|---|---|
| Proof before done | `ven-decisions end` | Refuses `done` when code changed since the playbook started and no passing verify is logged for the current tree. Docs-only changes are exempt. `--unverified "<reason>"` closes the run and logs UNVERIFIED. |
| Hidden checks | `ven-profile verify` | Refuses, before running anything, a diff that adds a profile `suppressions` match or drops test `assertions`, unless the line carries `ven-allow: <reason>` |
| Pack checks | `ven-profile verify` | Runs each pack's diff checks on the changed files the pack covers and refuses on failure |
| Learning check | `ven-decisions end` | Refuses to close most playbooks without a learning-check row |

Every refusal is logged to `decisions.tsv`, so `conventions-audit` can tell a check that teaches from one that keeps firing. The rest (reproduce before editing a bug, plan-only epics, past solutions before an edit) are steps in the playbooks.

### Repo state

ven writes nothing into your working tree and never edits the team's agent instructions. Per-repo state lives outside the repo, in a directory shared by all worktrees:

```text
~/.ven/repos/<repo>-<hash>/       # print it with: ven-profile path
├── profile.json     # stack facts and commands, each verified | unverified | manual; fills in as work needs it
├── adapters.json    # capability → tool (graph.imports, schema.read, code.search, …)
├── verify.md        # how to prove each change type in this repo
├── GLOSSARY.md      # domain terms → definitions → code names
├── decisions.tsv    # playbook steps, decisions, refusals and evidence
├── baseline/        # existing violations, so new checks fail only on new problems
├── solutions/ specs/ tickets/ handoffs/ adr/ diagrams/ explain/
└── packs/           # forged packs, one directory each
```

`ven-profile context` prints the state directory, a stale profile, the active playbook and past solutions for the files the branch touches; the router runs it first. `VEN_HOME` moves `~/.ven`, and `VEN_STATE_DIR` overrides the whole path. The full schema is in [`docs/build/profile-schema.md`](docs/build/profile-schema.md).

### Packs and the forge

A pack is a directory that holds the skills, playbooks, references, rules and adapters for one technology or domain in a repo. Its `applies_when` (paths and dependencies) decides which tasks load it: `ven-profile packs-for <files>` returns the matching packs' skill files, and the router reads them. No agent needs to register a pack. Packs are created by the forge skills:

| Skill | Creates |
|---|---|
| `forge-pack` | A whole pack skeleton with evals |
| `forge-skill` | One skill in a pack. Needs 3+ real instances as evidence and a scenario that fails without it. |
| `forge-playbook` | A playbook composed of existing skills |
| `forge-adapter` | A capability adapter script with a fixture test |
| `forge-reference` | A distilled reference for a library |
| `pack-audit` | A pack health report |

Pack evals run on the `claude` CLI; without it, a pack stays unregistered.

### CLI tools

All live in `plugins/ven/skills/setup/scripts/`.

| Tool | Does |
|---|---|
| `ven-profile` | Profile and adapters: `path`, `root`, `init`, `detect`, `show`, `get`, `set`, `learn`, `run`, `prove`, `verify`, `context`, `solutions-for`, `fresh`, `playbooks`, `packs-for`, `config`, `migrate`, … |
| `ven-decisions` | Decision log and active playbook per worktree: `start`, `add`, `skip`, `end`, `active`, `list` |
| `ven-doctor` | Checks node and git, the tools on `PATH`, settings, a stale or corrupt profile, unverified commands and state an older ven left |
| `ven-lint-skills` | Checks composition and portability rules. `--graph` prints the skill-reference graph as Mermaid. |
| `ven-transcripts` | Read-only extraction of corrections, past hook blocks and routing picks from Claude Code transcripts, when there are any |

Run any of them with `--help` for usage. `scripts/ven-new-skill.mjs` scaffolds a core skill for contributors.

## Repository layout

```text
.claude-plugin/marketplace.json   # Claude Code install route: lists plugins/ven as the ven plugin
plugins/ven/
├── skills/                       # one directory per skill; skills/do/playbooks/ holds the core playbooks
│   ├── delegate/references/      # role brief templates
│   └── setup/
│       ├── scripts/              # the ven-* tools, lib/, install.mjs, lint.json
│       └── assets/templates/     # skill (core and pack), pack, playbook and adapter templates
└── evals/                        # unit tests for the tools, routing eval cases
scripts/                          # repo tooling: ven-new-skill, pin-sources, build-notices
docs/build/                       # authoring guide, profile schema, vendoring map, notices
.github/workflows/ci.yml          # tests, skill lint, routing-case drift, notices drift
```

## Development

```sh
bun run test           # unit tests for the tools (bun test)
bun run lint:skills    # composition rules, portability, line budgets, denylist
bun run validate       # claude plugin validate on the plugin and the marketplace
bun run notices        # rebuild THIRD_PARTY_NOTICES.md from docs/build/notices/
bun run pin:sources    # pin metadata.source refs to the upstream SHAs
```

CI (`.github/workflows/ci.yml`) runs on every pull request and push to `main`: `bun run test` (which includes a check that `THIRD_PARTY_NOTICES.md` matches its generator), `bun run lint:skills`, and a check that the generated routing cases match `cases.json`. For contributing, see [`CONTRIBUTING.md`](CONTRIBUTING.md).

The routing eval has one prompt per case in [`cases.json`](plugins/ven/evals/routing/cases.json), each with an expected playbook. It runs in two tiers. Edit `cases.json`, regenerate the case directories, then pick a tier:

```sh
bun plugins/ven/evals/routing/generate.mjs
bun run eval:routing:quick   # cheap: one tool-less call per case
bun run eval:history <result file>   # append the run to history.jsonl and list cases that flipped
claude plugin eval plugins/ven --scaffold --runs 3 --max-cost-usd 10   # full suite, run manually
```

The full suite runs skills that call ven's tools, so install them from this checkout first (`node plugins/ven/skills/setup/scripts/install.mjs`). It costs several dollars; run it before a release or when a quick run flips a case.

Before adding or changing a skill, read [`docs/build/authoring-guide.md`](docs/build/authoring-guide.md). It covers frontmatter, body rules, the role result trailer, evals and how to adapt upstream skills. A skill change counts as done when `ven-lint-skills` passes and its eval passes with the change and fails without it.

## Credits and license

ven adapts skills and patterns from MIT-licensed work by Lauren Tan (pstack, how, noodle, brainmaxxing), Cursor, Matt Pocock, Jesse Vincent (superpowers), Garry Tan (gstack) and Every. Each adapted file records its upstream in `metadata.source`. Full attributions are in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

ven is MIT-licensed (see [`LICENSE`](LICENSE)).
