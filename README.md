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

Hand the `do` skill a task (`/ven:do <task>` in Claude Code; other agents invoke skills by name or pick them from your request):

```text
do: add CSV export to the reports page
help: which skill turns a correction into a lint rule?
```

## Skills

ven ships 68 skills and 17 playbooks. Every skill is a plain `SKILL.md` folder, so every skill can also be invoked directly.

### How a skill gets run

1. **You invoke it.** In Claude Code, type `/ven:<name>` (for example `/ven:review`). Other agents have their own way to call a skill by name; you can also just ask for it ("run the review skill on this branch"). The usual entry points are `do` (any task), `help` (which skill fits), `setup` (install the tools) and `yeet` (commit and push).
2. **The agent picks it from its description.** Each skill's description carries a "Use when …" or "Apply when …" sentence. When your request or the work in front of the agent matches it, the agent loads the skill on its own: "how does the scheduler work?" can load `how` directly, "this export is broken" reaches `do`, which picks `bug-fix` and starts with `reproduce`, and a diff that keeps growing brings in `laziness`. Four skills fire only on an explicit ask, and their descriptions say so: `yeet`, `quality-review`, `quiz` and `automate-me`.
3. **Another skill runs it.** Playbooks name the skill for each step in bold (`**tdd**`), and skills cite each other the same way. The L2 principles are not steps: they apply whenever their "Apply when" condition holds during any step. Work that can be handed off goes through `delegate` to a coder, worker, reviewer or verifier.

Most work starts with `do`. Its description matches any engineering task, so an agent that picks skills by itself reaches it without being told.

### What happens when `do` gets a task

```text
you: "do: <task>"
│
├─ 1. Read the repo state
│     tools missing → setup · ven-profile context (stale profile, active playbook, past solutions)
│     a command the task needs is missing → find it in the repo, ven-profile learn (runs it once)
│     a fact only you know (risk, proof, domain word) → asked once, when a step needs it
│
├─ 2. Pick one playbook
│     the task names a skill → run just that skill
│     else a pack playbook for the files touched → else a core playbook → else an ad-hoc sequence
│     first reply line: **Playbook: <name>** (core | pack <pack> | skill) — <reason>
│
├─ 3. ven-decisions start <playbook>, copy its steps into the task list
│
├─ 4. Run the steps in order; each ends on its `Done:` condition
│     each step runs the skill it names (reproduce, tdd, sweep, …) and logs ven-decisions add
│     principles apply as their triggers fit · pack skills for the touched files are read first
│     complete briefs go to roles through delegate (subagents, or separate passes)
│
├─ 5. verify → review (a blind panel, or an own read, as the playbook declares)
│
└─ 6. learning-check → ven-decisions end
      end refuses `done` while changed code has no passing verify on the current tree
```

A task of at most two files with a known check and no risky paths takes a fast path: it skips the per-step logging but still runs `verify`, a learning check and `end`.

### Playbooks

| Playbook | Use when | Steps (skills in bold) |
|---|---|---|
| `investigation` | A question with no change: how does X work, why is Y like this | **how** · **why** · answer with citations · **learning-check** |
| `feature` | New or changed behavior | **grilling** · **to-spec** · **to-tickets** · **tdd** per ticket in a coder · integrate · **verify** · **review** · **learning-check** |
| `bug-fix` | Something is broken or regressed | **reproduce** · **diagram-hypotheses** · bisect · failing test with **tdd** · fix (**fix-root-causes**) · **verify** · **correct** · **learning-check** |
| `refactor` | Same behavior, new structure | characterization tests with **tdd** · **conventions-audit** · **improve-architecture** · **sweep** · **verify** · **ratchet** · **learning-check** |
| `hotfix` | Production is broken now | **reproduce** · minimal fix · **verify** · own read · ship with one approval · root-cause ticket · **learning-check** |
| `flaky-test` | A test passes and fails without a code change | measure the rate · capture a failing run · **diagram-hypotheses** · fix (**fix-root-causes**, **test-behavior**) · **verify** · **learning-check** |
| `spike` | A time-boxed experiment that answers one question | state the question · **prototype** · summary · discard · **learning-check** |
| `dependency-upgrade` | Move a dependency, runtime or toolchain to a newer version | read the changes · baseline · bump · mechanical changes (**build-the-lever**) · **verify** · **blast-radius** · **review** · **learning-check** |
| `docs-only` | Documentation changes alone | **write-docs** and **technical-writing** · **unslop** · check links · own read · light ship · **learning-check** |
| `perf` | Slow, with a number to measure | baseline (**explain-the-number**) · profile · hypothesis · change · measure again · keep or revert · **learning-check** |
| `migration` | One mechanical change across many call sites | lever first (**build-the-lever**) · **sweep** · **verify** per slice · delete legacy · **learning-check** |
| `explain` | Explain a PR, or teach a subsystem | **explain-pr** or **teach** · **quiz** (optional) · **learning-check** |
| `autonomous-run` | Run existing tickets to done, unattended | check inputs · exit condition and cap · **tdd** per ticket in a coder · stop · **review** · **learning-check** |
| `epic` | Plan an effort that spans sessions; no edits in the repo | **roadmap** · claim one ticket · resolve it · close it · **learning-check** |
| `pickup` | Resume in-flight work | find the trail · resume point · re-prove claims · resume the playbook · **learning-check** |
| `pause` | Park work so a later session can resume it | safe boundary · make it durable · **handoff** · record the pause · **learning-check** |
| `ship` | Turn finished work into a pull request | **verify** · **review** · briefing body (**explain-pr**, **technical-writing**) · prepare · ask, then open · **learning-check** |

Packs add playbooks of their own. A pack playbook beats a core one of the same shape when the pack applies to the files the task touches.

### All skills

"The agent picks it when" is the trigger sentence from the skill's description. "Named in playbooks" lists the playbooks that mention the skill; a dash means no playbook names it, so it runs when you invoke it or when its trigger fits the work.

#### Entry points

| Skill | Does | The agent picks it when | Named in playbooks |
|---|---|---|---|
| `do` | Route a task to one playbook (core or from a repo pack), state the pick, copy its steps into the task list and run them with proof and a learning check. | Use for any engineering task in a git repository. | — |
| `help` | Suggest which ven skill or playbook fits what you want, and check this repo's ven state. | Use when the user asks which ven skill to use or how ven works; it suggests only and never runs the work. | — |
| `yeet` | Take every local change green through the repo's own checks, slice it into conventional commits, push, and with --pr open a pull request on the code host. | Use only when the user explicitly asks to yeet, or to commit and push everything; never on your own initiative. | — |
| `setup` | Install or repair ven's command-line tools (ven-profile, ven-decisions, ven-doctor), set per-user model and budget settings, and migrate state an older ven left behind. | Use when a ven-* command is not found, after installing or updating ven, or when ven-doctor or ven-profile context points here. | — |

#### Align: decide what to build

| Skill | Does | The agent picks it when | Named in playbooks |
|---|---|---|---|
| `grilling` | Interview the user in rounds over a design tree until every decision is settled, giving a recommended answer for each question. | Use before building anything non-trivial, when a plan needs stress-testing, or when the user says grill. | `feature` |
| `to-spec` | Turn a settled design into a written spec, saved in the state directory or the repo's tracker. | Use after grilling, when the user asks for a spec or requirements doc, or before slicing work into tickets. | `epic`, `feature` |
| `to-tickets` | Slice a spec into vertical tickets, each a complete brief a coder can finish without asking anything, with dependencies and file overlaps marked. | Use after to-spec, when the user asks for tickets, or before handing work to coders. | `feature` |
| `glossary` | Keep the domain glossary and decision records current as terms and hard choices settle. | Use when a term is defined, renamed or disputed, when code names and domain words disagree, or when a hard-to-reverse decision deserves an ADR. | — |
| `roadmap` | Map a long effort as an index of decision tickets, settled one per session, and never build from it. | Use when planning an effort that spans several sessions and whose route is unclear, or when resolving a decision ticket. | `epic` |

#### Build

| Skill | Does | The agent picks it when | Named in playbooks |
|---|---|---|---|
| `tdd` | Build behavior test-first, one red-green cycle at a time, testing through public interfaces. | Use when implementing a ticket or a fix, when the user asks for TDD or a failing test first, or when a coder needs the rules of the loop. | `autonomous-run`, `bug-fix`, `feature`, `refactor` |
| `sweep` | Fan a mechanical or partitionable job out to parallel workers, one complete brief per slice, and aggregate one evidenced report. | Use for renames across many files, per-package migration batches, applying a codemod in slices, or parallel probes. | `dependency-upgrade`, `migration`, `refactor` |
| `prototype` | Build throwaway code that answers one design question, either a clickable state-model demo or switchable visual variants. | Use when the user wants to feel out logic, a state model or a screen before committing to a design. | `spike` |
| `improve-architecture` | Find shallow modules worth deepening, present ranked candidates, choose one with the user and plan it as small green steps. | Use when code is hard to change or test, before a refactor, or when the user asks where the architecture hurts. | `refactor` |
| `delegate` | Hand a complete brief to a ven role (coder, worker, reviewer, verifier) as a subagent when your agent can spawn one, or as a separate pass you run yourself when it can't. | Use when a ven skill says to delegate to a role, or a task splits into slices with nothing left to decide. | `autonomous-run`, `bug-fix`, `epic`, `feature`, `investigation`, `refactor` |

#### Prove

| Skill | Does | The agent picks it when | Named in playbooks |
|---|---|---|---|
| `reproduce` | Build a red-capable loop for a reported bug, a test or script that fails for the reported reason, and record it before any source edit. | Use first in any bug fix, before forming theories from the code or touching source. | `bug-fix`, `hotfix` |
| `verify` | Prove a change works with the check that matches its type, do the read-back, and log the pass against the exact tree. | Use when a change is ready to call done, before review, commit or stopping, and whenever ven-decisions end refuses an unverified tree. | `autonomous-run`, `bug-fix`, `dependency-upgrade`, `feature`, `flaky-test`, `hotfix`, `migration`, `perf`, `pickup`, `refactor`, `ship` |
| `citation-check` | Check every file and line citation behind a hybrid diagram or a list of claims with parallel verifiers, then badge the result. | Use before saving or committing a hybrid diagram, or when claims about code cite lines that need independent checking. | `investigation` |

#### Review

| Skill | Does | The agent picks it when | Named in playbooks |
|---|---|---|---|
| `review` | Review a diff with a blind panel of lens reviewers (correctness, design and depth, security and data, test honesty) and rank their findings into Act on, Consider, Noted and Dismissed. | Use when a change is ready for review, before shipping, or when asked to review a branch or PR. | `autonomous-run`, `dependency-upgrade`, `feature`, `ship` |
| `blast-radius` | Find what a change can break beyond its diff (callers, data, contracts, config), cite each risk at file:line, and prove the one fact its safety rests on by running code. | Use for 'what could this break', before merging risky work, or for a small diff you don't trust. | `dependency-upgrade` |
| `quality-review` | Run a strict maintainability review of a branch: hunt for restructurings that delete complexity, file-size blowups, ad-hoc branching and leaky boundaries, and return a block or approve verdict. | Use only when the user explicitly asks for a harsh, deep or thermo-nuclear maintainability verdict. | — |

#### Understand

| Skill | Does | The agent picks it when | Named in playbooks |
|---|---|---|---|
| `how` | Explain how part of this codebase works (components, runtime flow, where things live) with every claim citing code. | Use for 'how does X work', walkthroughs before changing code, and placement questions like 'where should this live' or 'which module owns this'. | `investigation` |
| `why` | Find why code is shaped the way it is (design rationale, trade-offs, regressions, odd thresholds) from history, tickets, docs and chat, citing every claim and stating its confidence. | Use for 'why does X work this way', 'why did we pick Y', or before changing code whose purpose is unclear. | `investigation` |

#### Write

| Skill | Does | The agent picks it when | Named in playbooks |
|---|---|---|---|
| `handoff` | Write a handoff note a fresh session can resume from: goal, state, decisions, next step, open questions. | Use when pausing work, before the context fills up, or when passing work to another session or person. | `autonomous-run`, `epic`, `pause` |
| `technical-writing` | Layered writing standard for docs, specs, ADRs, READMEs, PR descriptions and commit messages: pick the document mode, then write plain sentences a tired engineer understands on the first read. | Use when writing or reviewing any technical document. | `docs-only`, `ship` |
| `unslop` | Cut AI writing tells (filler, model vocabulary, metaphor nouns, hedging, formatting tics) from text while keeping every fact. | Use when editing or checking any prose before it ships: docs, PR bodies, reports, skill text. | `docs-only`, `investigation`, `spike` |
| `write-docs` | Write or update documentation from the code: gather facts, pick the shape for the reader, write it plain, and prove every command and path in it. | Use when asked to document a repo, module or feature, or to bring stale docs up to date. | `docs-only` |

#### Visual

| Skill | Does | The agent picks it when | Named in playbooks |
|---|---|---|---|
| `diagram-deps` | Draw the module dependency graph from the repo's import-graph adapter, with boundary violations and cycles highlighted. | Use for "what depends on what", before moving code between modules, or to check layering. Its last section is the badge protocol every diagram follows, including how a diagram renders to a local HTML page. | — |
| `diagram-data` | Draw the entity/relationship view of the data model from the repo's schema adapter, or the data diff between two refs. | Use for "what data do we store and how does it relate", before changing the data model, or to show what a branch changes in it. | `feature` |
| `diagram-flow` | Draw the runtime sequence of one request or event, every arrow citing the file:line that makes the call, checked by citation-check. | Use for "what happens when X runs", tracing a request or event end to end, or before changing a flow. | — |
| `diagram-state` | Draw the state machine of one entity, with states extracted from its enum, union or constants and each transition cited at the code that performs it or marked inferred. | Use for "what states can X be in", "how does X move between them", or before adding a state or transition. | `feature` |
| `diagram-arch` | Draw a C4-style context view of the system (people, deployable containers, external systems) with containers taken from workspace manifests and deploy config and every box and arrow cited. | Use when onboarding, asking how the pieces fit together, or before adding a service or integration. | — |
| `diagram-hypotheses` | Draw a debug tree for a reproduced bug (symptom, ranked falsifiable causes, the evidence that would falsify each, a status per cause) and keep it current as probes run. | Use when debugging, after the bug reproduces and before testing any theory. | `bug-fix`, `flaky-test` |
| `diagram-change` | Draw the before/after of a diff at module level (touched modules, new dependency edges, removed edges) from the repo's import-graph adapter run at both refs. | Use when reviewing or explaining a branch or PR, or to see what a change does to the structure. | — |
| `explain-pr` | Build one self-contained HTML page explaining a branch or PR (change map, data diff, new flows, risks, a linear walkthrough, each panel badged) plus a Markdown summary for the PR body. | Use when asked to explain, walk through or visualize what a branch or PR changes, or to write its description. It explains; it does not review. | `explain`, `ship` |
| `teach` | Explain a subsystem diagram by diagram, from the system overview down to one call path, building each picture up one part at a time, then offer a quiz. | Use for "teach me X", "help me really understand this subsystem", or onboarding someone onto an area of code. | `explain` |

#### Conventions and checks

| Skill | Does | The agent picks it when | Named in playbooks |
|---|---|---|---|
| `conventions-discover` | Mine the code and merged PRs for the conventions this team actually follows (naming, error handling, module layout, test style, logging, config), with example locations, and write them to conventions.md. | Use during onboarding, or when conventions.md is missing or stale. | — |
| `conventions-audit` | Find the mistake classes that keep recurring in this repo, from merged PRs, review comments, the corrections log, past session transcripts and check refusals, and propose a ratchet, skill edit or routing case for each. | Use before a refactor, on a schedule, or when the same comment keeps coming back. | `refactor` |
| `ratchet` | Turn one correction or mistake class into the strongest check that can state it (type, boundary rule, lint rule, diff check, skill line, solution pointer) and prove the check fails on the original mistake. | Use after a correction, a repeated review comment, or a class from conventions-audit. | `migration`, `refactor` |
| `forge-convention` | Write a narrow principle-style skill in the repo's pack for a convention that no type, boundary rule, lint rule or diff check can check, scoped to the files it governs and proven by a failing scenario. | Use when a convention needs judgment and no rule tool can state it. | — |

#### Learning

| Skill | Does | The agent picks it when | Named in playbooks |
|---|---|---|---|
| `learning-check` | Close a playbook by reviewing the session for durable learnings and recording a solution entry, a correction, or an explicit none. | Use as the last step of every playbook, before reporting the task done. | `autonomous-run`, `bug-fix`, `dependency-upgrade`, `docs-only`, `epic`, `explain`, `feature`, `flaky-test`, `hotfix`, `investigation`, `migration`, `pause`, `perf`, `pickup`, `refactor`, `ship`, `spike` |
| `correct` | Turn a user's correction into the strongest lasting fix, a check when the mistake is checkable and a tested skill edit when it needs judgment. | Use when the user corrects you, repeats an instruction or undoes your work, and when learning-check finds a correction. | `bug-fix` |
| `compound` | Record one solved problem as a solution entry anchored to the files it touches, so later sessions on those files see it first. | Use after a fix or decision whose reasoning the final code does not show, or when learning-check finds a durable learning. | — |
| `compound-refresh` | Prune and merge the repo's solution entries, drop those whose files are gone, merge duplicates, promote lessons seen twice to checks, digest pending proposals and cap each area. | Use weekly, on demand, or when surfaced solution entries look stale, duplicated or crowded. | — |
| `reflect` | Review a long session through independent lenses and propose edits to existing skills, packs or checks, applied only after they pass skill-tdd. | Use at the end of a long or rocky session, or when the user asks to reflect on what the skills got wrong. | — |
| `skill-tdd` | Prove a skill change with evals before it lands, a pressure case that fails without the change and passes with it, then the routing and trigger suites with no regression. | Use before creating or editing any skill, pack skill, playbook or description, and to apply a queued proposal. | — |
| `automate-me` | Draft a personal <name>-mode overlay skill from the user's own transcripts and answers, and prove it with evals before installing it. | Use when the user asks to capture their working style, preferences or conventions as a skill, or to refresh their mode skill. | — |
| `quiz` | Ask one multiple-choice retrieval card per session from a five-card deck built from recent solution entries and decision records. | Use only when the user opts in, after a teaching session or a new solution entry. | `explain` |

#### Forge: repo packs

| Skill | Does | The agent picks it when | Named in playbooks |
|---|---|---|---|
| `forge-pack` | Forge a pack for one technology or business domain of this repo: skills, playbooks, references and adapters built from evidence, enabled only when every eval passes. | Use when onboarding proposes a pack or the user asks for one. | — |
| `forge-skill` | Forge one skill into a repo pack from three or more real instances, proven by a scenario that fails without it and passes with it. | Use when a correction or pitfall keeps recurring in one technology or domain, or the user asks for a pack skill. | — |
| `forge-playbook` | Compose a pack playbook for a task shape that keeps recurring in this repo, using only skills that already exist, and register it with the router. | Use when no core playbook fits a repeated kind of task, or the user asks for a domain playbook. | — |
| `forge-adapter` | Write a capability adapter (import graph, boundaries, schema, search, symbols, workspaces, custom rules) as a script with a fixture test, register it in adapters.json and prove it. | Use when a skill reports a missing or unproven adapter, or a pack needs a capability. | — |
| `forge-reference` | Distill one library into a pack reference for the version this repo locks: its idioms as the repo uses them, pitfalls and version notes, every claim cited to official docs or file:line. | Use when a pack skill needs library facts, or corrections show the agent misusing a library. | — |
| `pack-audit` | Audit this repo's packs: skills and playbooks never used, failing evals, references behind the locked version, applies_when matching no files. Reports and proposes removals. | Use periodically, after a dependency upgrade, or when a pack feels noisy or slow. | — |

#### Principles (L2)

| Skill | Does | The agent picks it when | Named in playbooks |
|---|---|---|---|
| `laziness` | Make the smallest change that solves the problem, and delete before you add. | Apply when sizing a change, reviewing a diff that grew, or tempted to add an abstraction, layer, option or helper. | `refactor` |
| `model-the-domain` | Encode the domain in a data structure so invalid states can't be built and branches disappear. | Apply when writing stateful logic, or when code branches a lot, keeps flags in sync, or repeats a shape assumption across files. | — |
| `type-discipline` | Make wrong states fail early: in the compiler for typed languages, in validated runtime contracts for untyped ones. | Apply when designing types or data shapes, reviewing a signature, or handling outside data, in any language. | — |
| `boundary-discipline` | Parse and check data where it enters or leaves the system, trust it inside, and keep decisions in pure functions behind a thin shell. | Apply when wiring validation, error handling, config loading or adapters to the outside world. | — |
| `idempotent-operations` | Make every state-changing operation converge to the same end state however many times it runs and wherever the last run stopped. | Apply when designing commands, jobs, startup steps or processing loops that can crash, restart or be retried. | — |
| `deep-modules` | Put a lot of behavior behind a small interface, at a seam where something really varies, and test through it. | Apply when designing or reshaping a module's interface, deciding where a seam goes, or making code easier to test. | — |
| `fix-root-causes` | Trace the symptom to its cause and fix it there; guards, retries and suppressions that hide it are not fixes. | Apply when debugging or when a fix makes a symptom go away without explaining it. | `bug-fix`, `flaky-test` |
| `prove-it-works` | Observe the real thing doing what was asked, with the proof that matches the change type; a build, a proxy or a self-report is not proof. | Apply before calling any task done, fixed or passing. | — |
| `sequence-verifiable-units` | Split work into small units that each end in a checkable state, check each before the next, and order delivery so it proves itself. | Apply to multi-step work (runs of similar edits, staged changes, long refactors) and to how commits and pull requests are stacked. | `perf` |
| `test-behavior` | Call the code the way its users do and assert the exact result they see; rewrite or delete any test that would pass if the code under test returned nothing. | Apply when writing, changing, reviewing or keeping a test. | `flaky-test` |
| `explain-the-number` | Name what limits it and rule out that it measured something else; benchmarks follow the protocol. | Apply when you measure or vet a number before you trust, report or act on it: a speedup, regression, throughput, latency or eval result. | `perf` |
| `encode-lessons-in-structure` | Encode the lesson in the strongest mechanism that can hold it, not in more text. | Apply when you write the same instruction a second time, get corrected for a repeat mistake, or see a recurring failure. | — |
| `never-block-on-reversible` | Decide, do it, and report why; ask first only for hard-to-reverse actions or for direction that is the human's call. | Apply when tempted to ask 'should I do X?' about work that can be undone and reviewed. | — |
| `guard-the-context` | Make every token earn its place; send bulk to subagents and keep conclusions, not raw payloads, in the main thread. | Apply when context is filling up: large outputs, long files, repeated reads, broad searches or fan-out planning. | — |
| `build-the-lever` | Build the tool that does or proves it (codemod, script, generator, delegate brief) instead of working by hand; the tool is what a reviewer reruns. | Apply to any non-trivial edit, sweep, analysis or check, not just bulk work. | `dependency-upgrade`, `migration` |

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
