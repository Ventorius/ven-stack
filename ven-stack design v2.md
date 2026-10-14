# ven-stack: design v2

Oct 14, 2026 · @Sebastian Basznianin

## What changed in v2

ven-stack is a Claude-only Claude Code plugin. Its shipped core knows nothing about any one technology or business domain. It learns each repo through an onboarding skill and grows tech- and domain-specific skills through a skill forge.

| Change | v1 (research report) | v2 (this doc) |
| --- | --- | --- |
| Models | Claude + Codex/Gemini for cross-family review | Claude only: Opus orchestrates, Sonnet codes, Haiku implements and swarms |
| Tech coupling | Drizzle, Convex, NestJS, Stripe baked into skills and bin scripts | Core is agnostic; tech knowledge lives in generated **packs** |
| Domain coupling | billing-change, webhook-incident, money-is-integers in core | Core playbooks are generic; domain playbooks and principles are forged per repo |
| Repo fit | Manual `setup-ven` | `/ven-onboard` detects the stack, writes `.ven/profile.yaml`, wires tools, proposes packs |
| Extensibility | Hand-written skills | `forge-skill`, `forge-pack`, `forge-playbook`, `forge-adapter` create new skills with evals |
| Review diversity | Different model families | Different **lenses** and tiers (Opus vs Sonnet, rubric per reviewer, blind to each other) |

**TL;DR.** Five layers: primitives, principles, workflows, playbooks, router. Everything in them is generic. Each repo gets a **profile** (detected facts and commands) and zero or more **packs** (forged skills for its tech and domain). Each correction gets pushed down the ladder into a check (`/ratchet`). Learnings land in files anchored to code. Self-edits pass evals before they merge.

## Guiding principles

Eight rules decide every design question below. When two conflict, the lower number wins.

1. **Core is agnostic, the repo is specific.** No skill in the plugin names a framework, ORM, vendor or business domain. Specifics come from `.ven/profile.yaml` and packs.
2. **Detect, don't assume.** Onboarding reads manifests, lockfiles, CI and git history, then confirms with the human. Commands and paths are never guessed at run time.
3. **Align before you build.** Grill until the design tree is resolved, writing the glossary as you go (Pocock).
4. **Every change carries proof that matches its type.** "It compiles" is not proof (poteto, Boris Cherny).
5. **Every correction goes down the ladder.** Type, then architecture rule, then lint rule, then hook, then skill line, then CLAUDE.md line. A check counts once it fails on the original mistake.
6. **Generate, don't draw.** A diagram of something in code is generated from code through an adapter. A model-drawn diagram carries a HYPOTHESIS badge.
7. **Small composable skills.** One idea per skill; playbooks name skills, they don't restate them.
8. **Learning compounds, under gates.** Learnings anchor to files and expire. Skill edits and forged skills pass evals before merge.

## Model roles

Opus thinks and decides, Sonnet writes the code that needs judgment, Haiku executes tightly scoped work in parallel. The tier is chosen by how much ambiguity a task has left, not by its size.

| Role | Model | Owns | Never does | Typical effort |
| --- | --- | --- | --- | --- |
| Orchestrator (main session) | Opus | Routing, grilling, specs, ticket slicing, architecture sketches, final review, synthesis of swarm output, merge decisions | Bulk edits, mechanical sweeps | high / xhigh |
| Coder | Sonnet | One ticket end to end: TDD loop, refactors with design choices, bug fixes after the cause is known | Changing the spec silently, spawning more coders | medium / high |
| Implementer / swarm | Haiku | Fully specified edits (a codemod run, rename across N files, fixing lint output), one slice of a fan-out (one package, one file, one hypothesis probe), generators, doc sync | Design decisions; anything whose brief contains "decide" or "figure out" | low / medium |

**Handoff rule.** A task drops a tier only when its brief is complete: inputs, exact files, the expected output shape and a check command. Opus writes briefs for Sonnet. Sonnet (or Opus) writes briefs for Haiku. A Haiku worker that hits ambiguity returns `BLOCKED: <question>` instead of guessing, and the parent escalates.

**Diversity without other vendors.** Reviews get independence from lens and tier, not model family:

- Two reviewers never see each other's output until synthesis.
- Each reviewer gets a different rubric: correctness, design and depth, security and data, test honesty.
- High-risk work adds an Opus reviewer over a Sonnet-written diff, so the writer and reviewer differ.
- Findings raised independently by two lenses rank highest.

**Configuration.** `plugin.json` `userConfig` exposes `orchestrator_model`, `coder_model`, `swarm_model`, and a budget tier (`lean`, `standard`, `max`) that maps to effort levels. Defaults are `opus`, `sonnet`, `haiku`. Agent files read them through `${user_config.*}`, so a model swap is one setting, not a skill edit.

## Architecture

The plugin ships five generic layers. Each repo plugs in a profile at the bottom and packs alongside layers 2 to 4, so the router sees core and pack playbooks as one list.

&#91;embedded content: ven-stack architecture: 5 generic layers + repo-specific packs and profile\]

Calls only run downward. A pack skill sits in the same layer as its core equivalent and follows the same rules.

**Composition rules** (checked by `ven-lint-skills` in CI)

- **Direction.** References point down a layer or sideways within L3. L2 never calls L3. A user-invoked skill may call model-invoked skills, never another user-invoked one (Pocock).
- **Name, don't restate.** A principle's text lives in one SKILL.md; others say "apply **prove-it-works**". Duplicated passages of 3+ lines fail the lint.
- **Core never names tech.** The lint fails if a core skill mentions a framework, vendor or domain noun from a denylist; those words belong in packs.
- **Packs depend on core, never the reverse.** A pack skill may cite core principles and workflows. Core may only reach pack content through the router's playbook table and `applies_when`.
- **Progressive disclosure.** SKILL.md targets under 150 lines; references one hop deep.
- **No cycles.** The lint builds the skill-reference graph (rendered with `diagram-deps`, so the stack diagrams itself) and fails on cycles.
- **Preload, don't re-read.** Agents get exactly their skills via `skills:` frontmatter.

**Directory layout**

```text
ven-stack/                         # the plugin (generic)
├── .claude-plugin/plugin.json     # userConfig: orchestrator/coder/swarm models, budget tier
├── settings.json                  # optional always-on agent: ven-lead
├── skills/
│   ├── ven/  ven-help/  ven-onboard/
│   ├── playbooks/*.md             # core playbooks
│   ├── principles/<idea>/
│   ├── grilling/ to-spec/ to-tickets/ tdd/ verify/ review/ ...
│   ├── diagram-*/ explain-pr/ teach/ how/ why/
│   ├── conventions-*/ ratchet/
│   ├── correct/ compound/ reflect/ skill-tdd/ mine-transcripts/
│   └── forge-pack/ forge-skill/ forge-playbook/ forge-adapter/ forge-reference/ pack-audit/
├── agents/  ven-lead  ven-coder  ven-worker  ven-reviewer  ven-verifier
├── hooks/hooks.json + scripts      # read patterns and commands from the profile
├── bin/  ven-profile  ven-lint-skills  ven-transcripts  ven-decisions
├── templates/  skill  pack  playbook  adapter
└── evals/  routing  hooks  <skill>

<repo>/                            # per repo (specific)
├── CLAUDE.md  GLOSSARY.md
├── .ven/  profile.yaml  adapters.yaml  verify.md  baseline/
│   └── packs/<name>/               # forged packs
└── docs/  solutions/  diagrams/  adr/
```

## Onboarding: /ven-onboard

`/ven-onboard` turns an unknown repo into a profile, a set of wired tools and a list of proposed packs, in one session of about 20–40 minutes. Every other skill reads the profile instead of guessing. Rerun it with `--refresh` when the stack changes; a SessionStart hook warns when the profile is older than the lockfile.

**Phases**

1. **Detect** (Haiku swarm, read-only). One worker per signal source: manifests and lockfiles, CI config, scripts in package files or Makefiles, test layout, lint/format configs, folder structure, existing CLAUDE.md/AGENTS.md/ADRs, git log (top churn files, commit style, PR template). Each returns facts with the file that proves them.
2. **Synthesize** (Opus). Merges facts into a draft profile: languages, frameworks, package manager, the exact commands for build, test (all and single file), typecheck, lint, format and run; module boundaries; the domain nouns that recur in code and commits.
3. **Confirm** (human). Opus grills only on what detection could not settle: which command proves a change works end to end, what is risky to touch, what the domain words mean. Answers become `GLOSSARY.md` entries.
4. **Prove the commands.** Each command in the profile is run once. A command that fails is marked `unverified` and later skills won't rely on it.
5. **Wire.** Map each generic capability (see the visual and conventions families) to a concrete tool through an adapter; install only with consent. Write a CLAUDE.md of at most \~100 lines that points to the profile, glossary and tool index.
6. **Baseline.** Record current lint and boundary violations as a baseline so new checks fail only on new problems.
7. **Propose packs.** List the tech and domain packs that would pay off (for example "a pack for the ORM you use", "a domain pack for your billing flows") and hand each to the skill forge on approval.

**What it writes**

| File | Holds | Read by |
| --- | --- | --- |
| `.ven/profile.yaml` | Stack facts, verified commands, boundaries, risk areas, budget tier | Every skill and agent |
| `.ven/adapters.yaml` | Capability → tool mapping (for example `diagram.deps → <your dependency tool>`) | Visual and conventions skills |
| `.ven/verify.md` | How to prove each change type in this repo (API call, UI flow, CLI run, data read-back) | `verify`, Stop hook |
| `GLOSSARY.md` | Domain terms with one-line definitions and the code names they map to | Grilling, specs, reviewers |
| `CLAUDE.md` | A short map: commands, tool index, pointers | The model at session start |
| `.ven/baseline/` | Snapshots of existing violations | `ratchet`, hooks |

The profile is data, not prose. Skills say "run the profile's `test.single` command", never a hard-coded command.

## Core skill catalog

The core ships about 35 skills, and none of them names a technology or a business domain. Packs add the specifics.

**Router (L5).** `/ven <task>` is the only user-invoked entry for work. It reads the profile, picks a playbook (core or pack), and states the pick and the reason in its first line. Then it copies the steps verbatim into the task list, where a skipped step stays as `skip: <reason>`. `/ven-help` answers "which skill fits".

**Core playbooks (L4)**

| Playbook | Steps (skills in order) | Borrowed from |
| --- | --- | --- |
| investigation | how → why → answer with citations | pstack |
| feature | grilling → to-spec → to-tickets → per ticket: tdd → verify → review → learning check | Pocock, pstack |
| bug-fix | reproduce (gate) → hypothesis tree → bisect with evidence → failing test → fix → verify → correct → learning check | pstack, superpowers |
| refactor | pin behavior (characterization tests) → conventions-audit → improve-architecture → sweep (swarm) → ratchet | pstack, Pocock |
| perf | baseline → profile → hypothesis → change → benchmark-check → keep or revert | pstack |
| migration / sweep | codemod or script first → Haiku swarm per slice → verify per slice → delete legacy | pstack build-the-lever |
| explain | explain-pr or teach → optional quiz | Willison, pstack |
| autonomous-run | needs spec + tickets + verify command; one ticket per iteration; iteration cap; Stop-hook gate; decision log | Huntley, poteto |
| pickup / pause | handoff note ↔ resume from note and branch | Pocock, pstack |
| ship | verify → review → PR (profile's forge) with briefing body and decision log | pstack |

**Principles (L2), one idea each:** laziness (smallest change), model-the-domain, type-discipline (for typed languages, else contract-discipline), boundary-discipline (parse at edges), idempotent-operations, deep-modules, fix-root-causes, prove-it-works, sequence-verifiable-units, test-behavior, explain-the-number, encode-lessons-in-structure, never-block-on-reversible, guard-the-context. Domain invariants (money as integers, at-least-once event handling) are **not** here; they are forged into packs.

**Workflows (L3), model-invocable:**

- **Align:** grilling, to-spec, to-tickets, glossary.
- **Build:** tdd, sweep, prototype.
- **Prove:** reproduce, verify, benchmark-check.
- **Review:** review (lens-based panel), blast-radius.
- **Understand:** how, why.
- **Write:** handoff, technical-writing, unslop.

Each one reads commands from the profile and cites principles by name.

## Visual representation family

Visual skills ask for a **capability**, and the repo's adapter supplies the tool. Mermaid is the shared output format because it renders in GitHub and diffs in PRs. Self-contained HTML is for anything you read rather than commit.

| Skill | Shows | Source of truth | Adapter capability |
| --- | --- | --- | --- |
| `diagram-deps` | Package and module graph, boundary violations highlighted | Generated | `graph.imports` (any import-graph tool for the language) |
| `diagram-data` | Entity/relationship view of the data model | Generated | `schema.read` (ORM schema, SQL DDL, or live DB introspection) |
| `diagram-flow` | Runtime sequence of one request or event | Hybrid: the model draws, every arrow cites `file:line`, a Haiku verifier checks each citation | `code.search` |
| `diagram-state` | State machine of one entity | Hybrid: states extracted from enums/unions/constants, transitions inferred and badged | `symbols.list` |
| `diagram-arch` | Containers and external systems (C4-style context view) | Hybrid: containers from workspace manifests and deploy config | `workspace.list` |
| `diagram-hypotheses` | Debug tree: symptom → causes → falsifying evidence → status | Model-drawn by design | none |
| `diagram-change` | Before/after of a diff: touched modules, new edges, removed edges | Generated from the diff + `graph.imports` | `graph.imports` |
| `explain-pr` | One HTML page: diagram-change, data diff, new flows, risks, linear walkthrough | Mixed, each panel badged | all of the above |
| `teach` | Subsystem explained diagram by diagram, from overview to one call path | Mixed | all of the above |

**Badge protocol.** Every diagram states its origin in its caption: `GENERATED <command> @ <sha>`, `HYBRID (n/n edges cited)`, or `HYPOTHESIS`. A hybrid with an uncited edge cannot be committed.

**Drift.** Diagrams committed to `docs/diagrams/` are regenerated by a CI step; a diff fails the build. Hybrid diagrams re-run citation checks instead.

**When no adapter exists**, the skill falls back to a slower generic path (the model reads files and cites them) and suggests forging an adapter (see the skill forge).

## Conventions family

Conventions are discovered from the repo, written down once, then compiled into the strongest check the repo's tooling supports. Prose is the last resort.

| Skill | Does | Uses |
| --- | --- | --- |
| `conventions-discover` | Mines the codebase and merged PRs for the patterns the team actually follows (naming, error handling, module layout, test style), with example locations. Runs during onboarding. | Haiku swarm per area, Opus synthesis |
| `conventions-audit` | Samples the last N merged PRs, clusters repeated review comments and agent corrections, proposes ratchets | `mine-transcripts`, review history |
| `ratchet` | Turns one correction into the highest rung that can express it, then proves the check fails on the original bad commit and passes on the fix | `adapters.yaml` (`lint.custom`, `rules.structural`, `graph.boundaries`), hooks |
| `forge-convention` | When no rule tool can express a convention, writes a narrow principle skill for it inside the repo's pack | skill forge |

**The ladder, as `ratchet` applies it**

1. **Type or architecture.** Make the wrong code impossible to write (types, module visibility, a single entry point).
2. **Boundary rule.** An import-graph rule ("layer A never imports layer B").
3. **Structural or lint rule.** A pattern rule through whatever the repo uses (AST-pattern tool or linter plugin).
4. **Hook.** A PreToolUse or PostToolUse check for things only visible at edit time.
5. **Skill line.** One sentence in the right pack skill.
6. **CLAUDE.md pointer.** Only if the agent needs to know a tool exists.

**Where knowledge lives.** CLAUDE.md is the map, skills hold judgment, rules and hooks hold anything checkable. A hook that blocks prints the *why* on stderr, so the block message itself teaches the agent.

## Learning and self-improvement family

The stack learns in three places: the repo (solutions and rules), the packs (skill edits), and the human (teaching). Every write path ends in a gate.

| Skill | Trigger | Writes | Gate |
| --- | --- | --- | --- |
| learning check | Last step of every playbook | A `compound` entry, a `correct` call, or the explicit line "No durable learnings" | Silence is not allowed (gstack) |
| `correct` | You correct the agent | Routes to `ratchet` if checkable, else a candidate skill edit | Rung 2+ preferred |
| `compound` | A problem was solved | `docs/solutions/<area>/<slug>.md` with frontmatter: symptoms, root cause, `files:` | `files:` required so staleness is detectable (Every) |
| `compound-refresh` | Weekly or on demand | Prunes entries whose files are gone, merges duplicates, promotes any lesson seen twice to `ratchet` | Cap per area |
| `reflect` | End of a long session | Proposed diffs to existing skills or packs | Applied only after `skill-tdd` passes |
| `mine-transcripts` | On demand | Top repeated corrections, hook blocks, misroutes from `~/.claude/projects/` | Read-only, proposes only |
| `skill-tdd` | Before any skill change | Pressure scenario: fails without the change, passes with it; then routing and skill evals | Reject if pass rate drops or tokens rise >20% (superpowers, skill-creator) |
| `automate-me` | On demand | A personal `<name>-mode` overlay drafted from your transcripts | Same as `skill-tdd` |
| `teach` / `how` / `why` | You want to understand | Explanations with badged diagrams | Claims cite code or history |
| `quiz` | Optional, after `teach` or `compound` | 5 cards from today's solutions and ADRs | Opt-in, one card per session |

**Guardrails against drift and bloat.**

- Skills are versioned in git. Every skill commit message carries its eval delta.
- A line budget caps core skill text. Adding lines means removing lines.
- About 40 routing prompts with expected playbooks run on every router or pack change.
- A skill never edits itself in the session that proposed the change.

## Skill forge

The forge is how ven-stack becomes specific without its core becoming specific. It writes **packs**: folders of skills, playbooks, rules and adapters for one technology or one domain. Each pack ships with evals and is proven before it is enabled.

**Forge skills**

| Skill | Creates | Input |
| --- | --- | --- |
| `forge-pack` | A whole pack skeleton: `pack.yaml`, skills, references, evals | A tech or domain name + the repo profile |
| `forge-skill` | One skill in an existing pack (principle or workflow) | A recurring task, a correction cluster, or your request |
| `forge-playbook` | A domain playbook built only from existing skill names (for example "incident in event handling") | A task shape that repeats in this repo |
| `forge-adapter` | A capability adapter script (for example `schema.read` for your ORM) with a fixture test | A capability a visual or conventions skill needs |
| `forge-reference` | A distilled reference file for a library: idioms, pitfalls, version notes | Official docs (fetched) + usages in the repo |
| `pack-audit` | A report on pack health: unused skills, failing evals, stale references | Transcripts + eval results |

**How `forge-skill` works**

1. **Evidence first.** Collect three or more real instances from transcripts, PRs or `docs/solutions/`. With fewer than three, the forge proposes a `compound` entry instead of a skill.
2. **Grill the scope.** One idea, the trigger phrase, what it must never do, which core principles it cites.
3. **Write the failing scenario** (Sonnet): a task where the agent goes wrong today. Run it without the skill and record the failure.
4. **Draft the skill** (Opus) from the core template: frontmatter, short body, references one hop deep, at most \~150 lines.
5. **Prove it.** Rerun the scenario with the skill (must pass), run the routing evals (no regression), then run a trigger eval on its description (fires when it should, stays quiet when it should not).
6. **Register.** Add it to the pack's index and to the router's playbook table if it introduces a playbook. Commit with the eval delta.

**Pack layout**

```text
.ven/packs/<name>/
├── pack.yaml          # kind: tech | domain, applies_when: paths/deps, version, owner
├── skills/<skill>/SKILL.md
├── playbooks/*.md
├── references/*.md
├── rules/             # lint, structural, boundary rules
├── adapters/          # capability scripts + fixtures
└── evals/
```

**Where packs live.** A repo pack stays in the repo under `.ven/packs/`, so the team shares it. A pack that proves useful across repos (a framework you use everywhere) is promoted to a separate plugin that depends on ven-stack. `applies_when` keeps a pack quiet in repos where its tech or domain isn't present.

**Examples you'd likely forge first:** a pack for your ORM and database, one for your backend framework, a billing domain pack (money as integers, proration, dunning), and an integrations pack (webhook signature checks, at-least-once handling, replay).

## Agents and hooks

Five agents cover every delegation. Each one preloads only the skills it needs through the `skills:` frontmatter.

| Agent | Model | Key frontmatter | Preloaded skills |
| --- | --- | --- | --- |
| `ven-lead` (optional always-on main agent via plugin `settings.json`) | opus | effort from budget tier | router, principles index |
| `ven-coder` | sonnet | `isolation: worktree`, `background: true` | tdd, prove-it-works, type-discipline |
| `ven-worker` | haiku | `disallowedTools: Agent`, low `maxTurns`, returns `DONE` / `BLOCKED` | sweep, prove-it-works |
| `ven-reviewer` | opus or sonnet (set by lens) | `disallowedTools: Edit, Write` | review, deep-modules, test-behavior |
| `ven-verifier` | haiku | read-only + Bash | verify, citation-check |

Pack skills join an agent's preload only when the pack's `applies_when` matches the task's files.

**Hooks**

| Hook | Event | Behavior |
| --- | --- | --- |
| verify-gate | Stop | If code changed and no verify pass is logged for the current diff, block with the profile's verify command for that change type. Checks `stop_hook_active`, caps at 3 blocks, skips docs-only diffs. |
| repro-first | PreToolUse Edit | Active only during bug-fix: blocks source edits until a failing test or repro artifact exists |
| no-workaround | PostToolUse Edit/Write | Scans touched files for suppression patterns listed in the profile (ignore comments, skipped tests, deleted assertions); exit 2 with the reason; allow with an explicit `ven-allow: <ticket>` |
| git-guardrails | PreToolUse Bash | Blocks force-push, hard reset, clean, branch delete (Pocock) |
| format | PostToolUse Edit/Write | Runs the profile's `format` command on touched files |
| decisions-log | SubagentStop | Appends a row to `decisions.tsv`: playbook, step, decision, evidence |
| context-inject | SessionStart | Profile freshness, active playbook state, the 3 most relevant `docs/solutions/` entries for touched paths |

All hook scripts are generic. They read patterns and commands from the profile. Exit 2 blocks; exit 1 does not, so every hook has a fixture test in `evals/hooks/`.

## End-to-end example

The example uses a fresh repo and a new feature. Everything specific comes from onboarding and packs, not from the core.

1. **Day 0: `/ven-onboard`.** Haiku workers detect the stack and commands. Opus grills on three open questions and writes the profile, glossary, adapters and a 90-line CLAUDE.md. It proposes two packs: one for the ORM, one for the billing domain.
2. **`/ven forge-pack billing`.** `forge-pack` mines 6 past PRs and 4 solutions, then drafts skills `money-is-integers` and `proration-rules` plus a `billing-change` playbook. Their failing scenarios fail without the pack and pass with it, so the pack is enabled.
3. **`/ven add a usage-based add-on`.** The router's first line says it chose `billing-change` (from the billing pack) because the task touches subscription pricing. The steps are copied into the task list.
4. **Align (Opus).** Grilling settles proration and invoice timing and adds two glossary terms. `diagram-state` draws the subscription lifecycle (HYBRID, 9/9 edges cited), and `diagram-data` shows the new table (GENERATED). Then `to-spec` and `to-tickets` produce 4 vertical slices.
5. **Build (Sonnet + Haiku).** One `ven-coder` per ticket works in a worktree using TDD. When a ticket needs a mechanical rename across 30 files, its brief goes to a Haiku `ven-worker` swarm with the check command.
6. **Prove.** The verify-gate blocks one Stop because no read-back ran. The coder runs the profile's verify command for billing changes and logs the pass.
7. **Review.** Two blind lenses run: an Opus correctness/data reviewer and a Sonnet test-honesty reviewer. Both independently flag a missing idempotency key, so it ranks as Act on.
8. **Ship.** `explain-pr` attaches an HTML page, and the PR body carries the decision log.
9. **Learn.** The same idempotency finding appeared twice this month, so `ratchet` adds a structural rule in the billing pack and proves it red on the original commit. `compound` records one solution, and the learning check closes the playbook.

## Build plan, metrics and risks

Build the onboarding and the forge early. Without them, the agnostic core is only a shell.

**Phase 0 (an evening).** Use Matt Pocock's skills in one real repo for a week and tally your corrections. The tally seeds the first principles and ratchets.

**Phase 1 (MVP, 1–2 weekends).**

- `/ven` router + 4 core playbooks: feature, bug-fix, investigation, ship
- `/ven-onboard` with profile, verified commands, CLAUDE.md map
- principles: prove-it-works, fix-root-causes, laziness, model-the-domain
- workflows: grilling, tdd, verify, review (2 lenses), ratchet, compound
- agents: ven-coder (sonnet), ven-worker (haiku), ven-reviewer
- hooks: verify-gate, git-guardrails, no-workaround
- 40-prompt routing eval

**Phase 2 (weeks 3–6).**

- `forge-skill`, `forge-pack`, `skill-tdd`, and your first two packs
- visual skills `diagram-deps`, `diagram-data`, `diagram-flow`, `explain-pr`, with `forge-adapter` for what's missing
- `conventions-discover`, `reflect`, `correct`

**Phase 3 (month 2+).** Remaining playbooks (refactor, perf, migration, autonomous-run), `teach`/`quiz`, `mine-transcripts`, `compound-refresh`, `pack-audit`, and pack promotion to standalone plugins.

**Metrics**

| Metric | Source | Goal |
| --- | --- | --- |
| Repeat-correction rate | `mine-transcripts` | Down: each ratchet zeroes its class |
| Verify-gate catch rate | decisions.tsv | Most blocks lead to a real fix |
| Router misroutes | routing eval + manual tags | Under 10% |
| Tokens per merged PR, by model tier | transcript usage | Flat or down; Haiku share rising |
| Haiku `BLOCKED` rate | worker reports | Low; high means briefs are underspecified |
| Pack eval pass rate | `evals/` | 100% before enable |

**Risks**

| Risk | Mitigation |
| --- | --- |
| Agnostic skills turn vague | Every skill references profile fields and adapters by name; forge specifics instead of generalizing |
| Haiku guesses on ambiguous briefs | Hard `BLOCKED` contract; Opus/Sonnet write briefs with a check command |
| Same-family review misses shared blind spots | Blind lenses, writer ≠ reviewer tier, deterministic checks carry the weight |
| Pack sprawl | Evidence threshold (3 instances), `pack-audit`, line budget |
| Onboarding drift as the stack changes | Profile freshness check at SessionStart, `--refresh` |
| Token cost of panels and swarms | Budget tier in `userConfig`; panels only on risky playbooks |

**Sources:** [mattpocock/skills](https://github.com/mattpocock/skills), [pstack](https://github.com/cursor/plugins/tree/main/pstack), [obra/superpowers writing-skills](https://github.com/obra/superpowers/tree/main/skills/writing-skills), [Every compound engineering](https://every.to/guides/compound-engineering), [gstack learn](https://github.com/garrytan/gstack/blob/main/learn/SKILL.md), [Claude Code hooks](https://code.claude.com/docs/en/hooks), [Claude Code subagents](https://code.claude.com/docs/en/sub-agents), [Claude Code plugin manifest](https://code.claude.com/docs/en/plugins-reference), [skill-creator](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md).
