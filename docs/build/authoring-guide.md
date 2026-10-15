# Authoring guide for ven skills

Read this whole file, `ven-stack design v2.md` (the spec), `docs/build/profile-schema.md` and `docs/build/vendoring-map.md` before writing anything. When this guide and the spec disagree, this guide wins: it records decisions made after v2.

## Where things go

```text
plugins/ven/
├── skills/<name>/SKILL.md          # one skill; references/ one hop deep
├── skills/<name>/references/*.md   # loaded on demand by that skill only; never link reference → reference
├── skills/do/playbooks/<name>.md   # core playbooks (L4), read by the router
├── agents/<name>.md                # ven-lead, ven-coder, ven-worker, ven-reviewer, ven-verifier
├── templates/{skill,pack,playbook,adapter}/   # used by the forge
└── bin/                            # ven-profile, ven-decisions, ven-lint-skills, ven-transcripts, ven-doctor (on PATH)
```

The plugin is named `ven`, so skills are invoked as `/ven:<name>` and agents are `ven:ven-coder` etc.

## Layers

| Layer | What | Invocation |
|---|---|---|
| L5 | `do` (router), `help`, `onboard` | user-invoked: `disable-model-invocation: true` |
| L4 | playbooks in `skills/do/playbooks/*.md` | read by the router; not skills |
| L3 | workflows (grilling, tdd, verify, review, diagram-*, ratchet, compound, forge-*, …) | model-invoked |
| L2 | principles (one idea each) | model-invoked |
| L1 | agents, hooks, bin tools | — |

References only point **down** a layer, or sideways **within L3**. L2 never references L3 or another L2. A user-invoked skill never references another user-invoked skill (it may only suggest typing it). `ven-lint-skills` enforces this.

## Frontmatter

Model-invoked skill:

```yaml
---
name: verify
description: Prove a change works with the check that matches its type, and log the pass. Use when a change is ready to call done, before review or stopping.
metadata:
  layer: L3
  source: obra/superpowers@main:skills/verification-before-completion/SKILL.md
  license: MIT
---
```

User-invoked entry:

```yaml
---
name: do
description: Route a task to a playbook and run it step by step.
argument-hint: <task>
disable-model-invocation: true
metadata:
  layer: L5
---
```

Rules:
- `description`: the key use case first, "<what it does>. Use when <situations>." Under 300 characters; the listing budget is shared with every other installed skill.
- `metadata.source` names the upstream repo, ref and path for vendored content (omit for fresh skills). `metadata.license` is the upstream license. Never copy text from Apache or unlicensed sources (anthropics skill-creator, poteto/verification-skill-example); learn from them only.
- Pack skills may add `paths:` (globs) so they activate only on matching files.

## Body rules

1. **One idea per skill.** SKILL.md under 150 lines; aim for 30–100. Push detail into `references/` (one hop).
2. **Name, don't restate.** Cite other skills as bold names: "apply **prove-it-works**", "run **verify**". The lint recognizes `**name**`, `` `name` `` and `ven:name` as references. Never paste another skill's text; 3+ repeated lines across files fail the lint.
3. **Core never names tech, vendors or domains.** No framework, library, language, test runner, code host, tracker, cloud or business-domain words (the full denylist is `plugins/ven/lint.json`). Write "the repo's test runner", "the code host", "the tracker", "a typed language", "a money amount". Specifics come from the profile and packs.
4. **Commands come from the profile, never from memory.** Write "run `ven-profile run commands.test.single --file <path>`", "prove it with `ven-profile verify <key from verify.<type>>`". Read keys with `ven-profile get <key>`. If a key is missing or `unverified`, say so and stop relying on it; never guess a command.
5. **State lives in the state directory**, printed by `ven-profile path` (`~/.ven/repos/<repo>-<hash>/`, outside the repo). Glossary: `GLOSSARY.md`; solutions: `solutions/<area>/<slug>.md`; ADRs: `adr/`; diagrams: `diagrams/`; handoffs: `handoffs/`; verify recipes: `verify.md`. Never write ven files into the working tree.
6. **Decisions and steps** are recorded with `ven-decisions`: `start <playbook>`, `add --step S --decision D --evidence E`, `skip --step S --reason R`, `end`. The bug-fix reproduce gate opens with `ven-decisions add --step reproduce --decision reproduced --evidence "..."`.
7. **Delegation.** Spawn agents with the Agent tool:
   - `ven:ven-coder` (one ticket end to end, worktree, background): `model: ${user_config.coder_model}`.
   - `ven:ven-worker` (fully specified edit or one fan-out slice): `model: ${user_config.swarm_model}`.
   - `ven:ven-reviewer` (one lens, read-only): `model: ${user_config.orchestrator_model}` for the high-risk lens, `${user_config.coder_model}` otherwise.
   - `ven:ven-verifier` (citation and proof checks): `model: ${user_config.swarm_model}`.
   - Budget tier is `${user_config.budget_tier}`: on `lean` pass `effort: low` and skip optional panels; on `max` pass `effort: high`; `standard` uses the agent's default.
   - A brief that drops a tier is complete: inputs, exact files, expected output shape, and a check command. Anything containing "decide" or "figure out" stays with the parent.
8. **Agent result trailer.** Every ven agent ends its final message with this block (the SubagentStop hook logs it):

   ```text
   VEN-RESULT: DONE            (or: VEN-RESULT: BLOCKED: <one question>)
   playbook: <playbook or ->
   step: <skill name>
   decision: <one line>
   evidence: <command + exit code, or file:line>
   ```
9. **Diagrams** carry a badge in their caption: `GENERATED <command> @ <sha>`, `HYBRID (n/n edges cited)` or `HYPOTHESIS`. Mermaid is the shared format; self-contained HTML is for things you read rather than commit, and diagrams render to a local HTML page per the badge protocol.
10. **Ask the user** with AskUserQuestion when a decision is theirs; find facts yourself (or with ven-worker). Subagents cannot ask the user: they return BLOCKED.
11. **Style.** English. Imperative, short sentences. No filler, no hype, no "it's important to". Headings and lists over walls of text. Examples use neutral nouns (widget, order of operations, account, report), never the denylist.

## Evals

Evals run with `claude plugin eval` (built into Claude Code). A case is a directory with `prompt.md` (the user prompt) and `graders/*.md` (frontmatter `type: tool_used | tool_order | regex | file_exists | llm`, body = pattern or rubric), optionally `case.yaml` with `context.scaffold_script` to build a fixture repo (needs `--scaffold`). Runs are isolated: empty working directory, no user settings, no other plugins. A case that needs a ven profile scaffolds a git repo, writes `.ven-state/profile.json`, excludes `.ven-state/` via `.git/info/exclude`, and sets `env: { EVAL_VEN_STATE_DIR: ".ven-state" }` in prompt.md (see `plugins/ven/evals/routing/`).

- Core: `plugins/ven/evals/routing/<case>/` (router picks), `plugins/ven/evals/skills/<skill>/<case>/` (skill behavior and trigger).
- Packs: `<pack>/evals/<case>/`.
- Typical run: `claude plugin eval plugins/ven --case <name> --runs 3 --ablation none --scaffold --max-cost-usd 15`. Routing suite cap: `--max-cost-usd 10`.
- "Fails without the change" for an edited skill: run the case against a copy of the plugin at the previous commit (`git worktree add <tmp> HEAD`) and against the working copy; compare pass rate and cost from `aggregate-result.json`.

## Outward-facing actions

Opening PRs, posting comments, pushing branches, creating tracker tickets and installing tools are outward-facing or hard to reverse. Skills prepare them and ask the user before doing them.

## Adapting upstream skills

Start from the base named in `vendoring-map.md`. Keep what makes it work (the gates, the stop conditions, the output shapes). Then apply X1–X5 from the map: Cursor → Claude Code, model-invocable, cite by name, commands from the profile, no tech/domain nouns. Remove references to tools ven doesn't have. Keep it shorter than the original whenever possible. Record provenance in `metadata.source` and list each adapted file in `docs/build/notices/<your group>.md` as `- <upstream repo> — plugins/ven/skills/<name>/ adapted from <upstream path>` (these are merged into `THIRD_PARTY_NOTICES.md` later; don't edit that file directly).

## Done means

- `bun run lint:skills` passes for your files (run it; fix every finding in files you own).
- Every skill you reference exists in the catalog below (or you are writing it).
- No placeholder text, no TODOs.

## Catalog (names are final)

- **L5:** `do`, `help`, `onboard`
- **L4 playbooks** (`skills/do/playbooks/`): `investigation`, `feature`, `bug-fix`, `refactor`, `perf`, `migration`, `explain`, `autonomous-run`, `pickup`, `pause`, `ship`
- **L3 align:** `grilling`, `to-spec`, `to-tickets`, `glossary`
- **L3 build:** `tdd`, `sweep`, `prototype`, `improve-architecture`
- **L3 prove:** `reproduce`, `verify`, `benchmark-check`, `citation-check`
- **L3 review:** `review`, `blast-radius`, `quality-review`
- **L3 understand:** `how`, `why`
- **L3 write:** `handoff`, `technical-writing`, `unslop`, `write-docs`
- **L3 visual:** `diagram-deps`, `diagram-data`, `diagram-flow`, `diagram-state`, `diagram-arch`, `diagram-hypotheses`, `diagram-change`, `explain-pr`, `teach`
- **L3 conventions:** `conventions-discover`, `conventions-audit`, `ratchet`, `forge-convention`
- **L3 learning:** `learning-check`, `correct`, `compound`, `compound-refresh`, `reflect`, `mine-transcripts`, `skill-tdd`, `automate-me`, `quiz`
- **L3 forge:** `forge-pack`, `forge-skill`, `forge-playbook`, `forge-adapter`, `forge-reference`, `pack-audit`
- **L2 principles:** `laziness`, `model-the-domain`, `type-discipline`, `boundary-discipline`, `idempotent-operations`, `deep-modules`, `fix-root-causes`, `prove-it-works`, `sequence-verifiable-units`, `test-behavior`, `explain-the-number`, `encode-lessons-in-structure`, `never-block-on-reversible`, `guard-the-context`, `build-the-lever`
- **L1 agents:** `ven-lead`, `ven-coder`, `ven-worker`, `ven-reviewer`, `ven-verifier`
