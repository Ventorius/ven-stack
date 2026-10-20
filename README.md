# ven-stack

A Claude Code plugin for engineering work in any repo. It knows nothing about a particular stack or business domain. It learns each repo by onboarding it into a verified profile, routes every task through a playbook, requires proof before a change counts as done, and forges repo-specific **packs** for the technologies and domains it finds.

- **Onboard once.** `/ven:onboard` detects the stack, runs every command once to prove it works, and writes a profile that every other skill reads. Skills never guess commands.
- **Route every task.** `/ven:do <task>` picks one playbook (feature, bug-fix, refactor, …), copies its steps into the task list and runs them in order.
- **Prove changes.** A Stop hook blocks the session from finishing until a verify command has passed against the current working tree.
- **Learn under gates.** Each correction is turned into the strongest check that can catch it (`/ven:ratchet`). A skill edit is kept only if its evals pass.
- **Claude only.** Opus orchestrates, Sonnet codes, Haiku runs fully specified work and fan-outs. Reviews stay independent through separate lenses and model tiers rather than different vendors.

The design rationale is in [`ven-stack design v2.md`](ven-stack%20design%20v2.md). Where the implementation differs from it, [`docs/build/authoring-guide.md`](docs/build/authoring-guide.md) is authoritative.

## Requirements

- Claude Code with plugin support
- Node.js 22 or later (hooks and `bin/` tools are plain Node scripts with no dependencies)
- [Bun](https://bun.sh) 1.4 or later, only to develop ven itself (tests, lint)
- A git repository to work in

## Install

The repo is a plugin marketplace (`.claude-plugin/marketplace.json`) that contains one plugin, `ven`. Install from GitHub inside Claude Code:

```text
/plugin marketplace add Ventorius/ven-stack
/plugin install ven@ven-stack
```

Or from a local checkout, from a shell:

```sh
claude plugin marketplace add /path/to/ven-stack
claude plugin install ven@ven-stack
```

To update, refresh the marketplace and reinstall or update the plugin:

```text
/plugin marketplace update ven-stack
```

Releases are tagged `vX.Y.Z`; see [`CHANGELOG.md`](CHANGELOG.md) for what changed.

Skills are namespaced under the plugin name, e.g. `/ven:do` and `/ven:onboard`. The plugin's `bin/` tools (`ven-profile`, `ven-decisions`, …) are put on the `PATH` for the session.

### Settings

Set these in the plugin's `userConfig`:

| Setting | Default | Used for |
|---|---|---|
| `orchestrator_model` | `opus` | The high-risk review lens and synthesis. Run the main session on this model too. |
| `coder_model` | `sonnet` | `ven-coder`: one ticket end to end with TDD |
| `swarm_model` | `haiku` | `ven-worker` and `ven-verifier`: fully specified edits, fan-out slices, citation checks |
| `budget_tier` | `standard` | `lean` passes low effort and skips optional review panels; `max` passes high effort and always runs panels. A repo can override it with `ven-profile set budget_tier <tier>`. |

## Quick start

```text
/ven:onboard                      # once per repo, about 20–40 minutes
/ven:do add CSV export to the reports page
/ven:help which skill turns a correction into a lint rule?
```

1. **`/ven:onboard`** has a Haiku swarm detect the stack, CI, scripts, tests and git history. It then asks you only what the repo can't answer, runs each command once to mark it `verified` or `unverified`, wires local settings (with your consent), records baseline lint violations and proposes packs. Run `/ven:onboard --refresh` after the stack changes. The SessionStart hook warns when manifests or lockfiles are newer than the profile.
2. **`/ven:do <task>`** starts its reply with `**Playbook: <name>** (core | pack <pack> | skill) — <reason>`, logs each step to the decision log and closes with a learning check.
3. **`/ven:help`** suggests the command to type and checks this repo's ven state. It never runs the work itself.

## How it works

### Layers

| Layer | Contents | Invocation |
|---|---|---|
| L5 | `do` (router), `help`, `onboard`, `yeet` | User-invoked only |
| L4 | Playbooks in `skills/do/playbooks/` | Read by the router; not skills |
| L3 | Workflows: align, build, prove, review, understand, write, visual, conventions, learning, forge | Model-invoked |
| L2 | Principles, one idea each | Model-invoked |
| L1 | Agents, hooks, `bin/` tools | — |

References only point down a layer, or sideways within L3. Core skills never name a framework, vendor, language or business domain (see the denylist in [`plugins/ven/lint.json`](plugins/ven/lint.json)). Those specifics come from the profile and packs. `ven-lint-skills` enforces these rules, as well as the 150-line skill limit, the no-duplication rule, the absence of cycles and the line budget for core (`core_line_budget` in `lint.json`).

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
| `migration` | One mechanical change across many call sites: codemod first, then a swarm |
| `explain` | Explain a PR, or teach a subsystem diagram by diagram |
| `autonomous-run` | Run existing tickets to done, with an iteration cap and the Stop-hook gate |
| `pickup` / `pause` | Resume from a handoff note, or park work safely |
| `ship` | Verify → review → PR with the decision log in the body |

A pack playbook beats a core one of the same shape when the pack applies to the files the task touches. When no playbook fits, the router composes an ad-hoc sequence from existing skills.

### Agents

| Agent | Default model | Role |
|---|---|---|
| `ven-lead` | opus | Optional main-session orchestrator: routes, grills, writes briefs, merges |
| `ven-coder` | sonnet | One ticket with TDD, in its own worktree, in the background |
| `ven-worker` | haiku | One fully specified edit or one fan-out slice; cannot spawn agents |
| `ven-reviewer` | sonnet/opus | One review lens, blind to other reviewers, read-only |
| `ven-verifier` | haiku | Checks citations and claims without editing |

Work moves to a cheaper tier only when its brief is complete: inputs, exact files, the expected output shape and a check command. An agent that hits ambiguity returns `VEN-RESULT: BLOCKED: <question>` instead of guessing. Every agent ends with a `VEN-RESULT` trailer, which the SubagentStop hook logs.

### Hooks

| Hook | Event | Behavior |
|---|---|---|
| `verify-gate` | Stop, SubagentStop | Blocks finishing when code changed and no passing verify is logged for the current tree. Skips docs-only diffs. Releases after 3 blocks and logs the change as UNVERIFIED. |
| `repro-first` | PreToolUse Edit/Write | During a bug fix, blocks source edits until a reproduction is logged |
| `no-workaround` | PostToolUse Edit/Write | Blocks suppression patterns from the profile (ignore comments, skipped tests, deleted assertions) unless the line carries `ven-allow: <reason>` |
| `format` | PostToolUse Edit/Write | Runs the profile's `format` command on touched files |
| `decisions-log` | SubagentStop | Appends the agent's `VEN-RESULT` to `decisions.tsv` |
| `context-inject` | SessionStart | Injects `map.md`, profile freshness, the active playbook and relevant solutions |

| `capture-corrections` | UserPromptSubmit | Logs prompts that read as corrections to `decisions.tsv` for `learning-check`; never blocks or prints |
| `solutions-on-edit` | PreToolUse Edit/Write | Shows up to 2 solution entries covering the file about to change, once per session and file |

All hooks are generic and read their patterns and commands from the profile. The gate hooks (`verify-gate` on stop, `repro-first`) block with the cause and the fix when they hit an internal error such as a corrupt profile; every other hook allows and writes a one-line warning to stderr.

### Repo state

ven writes nothing into your working tree and never edits the team's `CLAUDE.md`. Per-repo state lives outside the repo, in a directory shared by all worktrees:

```text
~/.ven/repos/<repo>-<hash>/       # print it with: ven-profile path
├── profile.json     # stack facts and commands, each verified | unverified | manual
├── adapters.json    # capability → tool (graph.imports, schema.read, code.search, …)
├── verify.md        # how to prove each change type in this repo
├── map.md           # ≤100-line map injected at session start
├── GLOSSARY.md      # domain terms → definitions → code names
├── decisions.tsv    # playbook steps, decisions and evidence
├── baseline/        # existing violations, so new checks fail only on new problems
├── solutions/ specs/ tickets/ handoffs/ adr/ diagrams/ explain/
└── packs/           # local marketplace of forged packs
```

`VEN_HOME` moves `~/.ven`, and `VEN_STATE_DIR` overrides the whole path. The full schema is in [`docs/build/profile-schema.md`](docs/build/profile-schema.md).

### Packs and the forge

A pack is a plugin that holds the skills, playbooks, references, rules and adapters for one technology or domain in a repo. Its `applies_when` (paths and dependencies) keeps it quiet where it doesn't apply. Packs are created by the forge skills:

| Skill | Creates |
|---|---|
| `/ven:forge-pack` | A whole pack skeleton with evals |
| `/ven:forge-skill` | One skill in a pack. Needs 3+ real instances as evidence and a scenario that fails without it. |
| `/ven:forge-playbook` | A playbook composed of existing skills |
| `/ven:forge-adapter` | A capability adapter script with a fixture test |
| `/ven:forge-reference` | A distilled reference for a library |
| `/ven:pack-audit` | A pack health report |

### CLI tools

| Tool | Does |
|---|---|
| `ven-profile` | Profile and adapters: `path`, `init`, `detect`, `show`, `get`, `set`, `run`, `prove`, `verify`, `fresh`, `playbooks`, `packs-for`, … |
| `ven-decisions` | Decision log and active playbook per worktree: `start`, `add`, `skip`, `end`, `active`, `list` |
| `ven-doctor` | Diagnoses skill-name collisions, a stale profile, unverified commands, worktree base and missing permission rules |
| `ven-lint-skills` | Checks composition rules. `--graph` prints the skill-reference graph as Mermaid. |
| `ven-transcripts` | Read-only extraction of corrections, hook blocks and routing picks from Claude Code transcripts |
| `ven-new-skill` | Scaffolds a core skill from the template, with its catalog and notices entries (contributors) |

Run any of them with `--help` for usage.

## Repository layout

```text
.claude-plugin/marketplace.json   # marketplace listing the ven plugin
plugins/ven/
├── .claude-plugin/plugin.json    # manifest and userConfig
├── agents/                       # ven-lead, ven-coder, ven-worker, ven-reviewer, ven-verifier
├── skills/                       # one directory per skill; skills/do/playbooks/ holds the core playbooks
├── hooks/hooks.json
├── scripts/hooks/                # hook implementations
├── scripts/lib/                  # shared helpers for hooks and bin tools
├── bin/                          # ven-profile, ven-decisions, ven-doctor, ven-lint-skills, ven-transcripts, ven-new-skill
├── templates/                    # skill (core and pack), pack, playbook and adapter templates
├── evals/                        # unit tests for hooks and bin, routing eval cases
└── lint.json                     # line budgets and the core denylist
scripts/                          # repo tooling: pin-sources, build-notices
docs/build/                       # authoring guide, profile schema, vendoring map, notices
.github/workflows/ci.yml          # tests, skill lint, routing-case drift, notices drift
```

## Development

```sh
bun run test           # unit tests for hooks and bin tools (bun test)
bun run lint:skills    # composition rules, line budgets, denylist
bun run validate       # claude plugin validate on the plugin and the marketplace
bun run notices        # rebuild THIRD_PARTY_NOTICES.md from docs/build/notices/
bun run pin:sources    # pin metadata.source refs to the upstream SHAs
```

CI (`.github/workflows/ci.yml`) runs on every pull request and push to `main`: `bun run test` (which includes a check that `THIRD_PARTY_NOTICES.md` matches its generator), `bun run lint:skills`, and a check that the generated routing cases match `cases.json`. For contributing, see [`CONTRIBUTING.md`](CONTRIBUTING.md).

The routing eval has one prompt per case in [`cases.json`](plugins/ven/evals/routing/cases.json), each with an expected playbook. It runs in two tiers. Edit `cases.json`, regenerate the case directories, then pick a tier:

```sh
bun plugins/ven/evals/routing/generate.mjs
bun run eval:routing:quick   # cheap: one tool-less Haiku call per case
bun run eval:history <result file>   # append the run to history.jsonl and list cases that flipped
claude plugin eval plugins/ven --scaffold --runs 3 --max-cost-usd 10   # full suite, run manually
```

The quick tier is for iterating on router wording. The full suite costs several dollars; run it before a release or when a quick run flips a case.

Before adding or changing a skill, read [`docs/build/authoring-guide.md`](docs/build/authoring-guide.md). It covers frontmatter, body rules, the agent result trailer, evals and how to adapt upstream skills. A skill change counts as done when `ven-lint-skills` passes and its eval passes with the change and fails without it.

## Credits and license

ven adapts skills and patterns from MIT-licensed work by Lauren Tan (pstack, how, noodle, brainmaxxing), Cursor, Matt Pocock, Jesse Vincent (superpowers), Garry Tan (gstack) and Every. Each adapted file records its upstream in `metadata.source`. Full attributions are in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

The `ven` plugin is MIT-licensed (see `plugins/ven/.claude-plugin/plugin.json`).
