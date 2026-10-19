# Vendoring map

Which upstream file each ven skill, agent and hook is adapted from. Sources were shallow-cloned on 2026-10-14 into `/tmp/ven-sources.BBUQ/` (re-clone if gone: mattpocock/skills, cursor/plugins, poteto/{how,noodle,brainmaxxing,verification-skill-example}, garrytan/gstack, obra/superpowers, anthropics/skills, EveryInc/compound-engineering-plugin).

Prefixes: PS=`cursor_plugins/pstack/`, PB=`PS/skills/poteto-mode/playbooks/`, MP=`mattpocock_skills/skills/`, SP=`obra_superpowers/skills/`, EV=`EveryInc_compound-engineering-plugin/skills/`, GS=`garrytan_gstack/`, CP=`cursor_plugins/`, CTK=`CP/cursor-team-kit/`, BM=`poteto_brainmaxxing/`, NO=`poteto_noodle/.agents/skills/`, HW=`poteto_how/skills/`, AS=`anthropics_skills/skills/skill-creator/`. Numbers in brackets are line counts.

## Licenses

All MIT except: **AS (skill-creator) is Apache-2.0** (Copyright 2026 Anthropic, PBC); copying its text requires shipping the license and marking changes. `poteto_verification-skill-example` has **no license**: pattern only, never copy text. pstack, poteto_how, noodle, brainmaxxing © 2026 Lauren Tan; CP continual-learning/orchestrate/teaching/thermos/ralph-loop/cursor-team-kit © 2026 Cursor; mattpocock © 2026 Matt Pocock; superpowers © 2025 Jesse Vincent; gstack © 2026 Garry Tan; Every © 2025 Every.

## Adaptations that apply almost everywhere

- **X1 Cursor → Claude Code:** Task/`subagent_type`/readonly/model slugs/AskQuestion/`agent-transcripts`/`/loop`/cloud agents become the Agent tool, `ven:ven-*` agents, `${user_config.*}` models, AskUserQuestion, `~/.claude/projects/`.
- **X2 Model-invocable:** pstack marks 53/54 skills `disable-model-invocation: true`. Remove it everywhere except the user-invoked entries (`do`, `help`, `onboard`, `forge-*` entry points that the user types).
- **X3 Cite by name:** replace `../principle-x/SKILL.md` links and restated passages with "apply **x**".
- **X4 Commands from the profile:** hard-coded commands become profile keys (`commands.test.single`, `commands.test.all`, `commands.typecheck`, `commands.lint`, `commands.format`, `commands.run`, `verify.<type>`, `forge`, `tracker`).
- **X5 No tech or domain nouns in core:** move vendor/framework/domain examples to packs or neutral examples.

## Router and entries

| ven | Base | Alternative | Adapt |
|---|---|---|---|
| `do` (router) | PS `skills/poteto-mode/SKILL.md` [149] + PB/*.md | EV `lfg/SKILL.md` [59]; MP `engineering/ask-matt/SKILL.md` [97] | Keep match→copy verbatim→`skip: <reason>`, figure-it-out fallback. Add "picked X because Y" first line, pack playbooks. Principles index → reference. |
| `help` | PS `skills/poteto-help/SKILL.md` [156] | MP ask-matt | wants→skill table, close calls, state checks (no profile → /ven:onboard). Suggests, never fires. |
| `onboard` | patterns: PS `skills/create-verification-skill/SKILL.md` [44]; EV `ce-setup/SKILL.md` [103] + `references/config-template.yaml` [206] | MP `engineering/setup-matt-pocock-skills/SKILL.md` [118]; PS `setup-pstack` [74] | Mostly fresh. |

## Playbooks (L4)

| ven | Base | Adapt |
|---|---|---|
| investigation | PB `investigation.md` [14] | near verbatim |
| feature | PB `feature.md` [21]; MP `engineering/implement/SKILL.md` [17] | grilling → to-spec → to-tickets → per ticket tdd → verify → review → learning check |
| bug-fix | PB `bug-fix.md` [15]; MP `engineering/diagnosing-bugs/SKILL.md` [138]; SP `systematic-debugging` [283] | reproduce gate, hypothesis tree, correct |
| refactor | PB `refactoring.md` [16]; MP `improve-codebase-architecture` [71] | needs an `improve-architecture` workflow (missing from v2 catalog) |
| perf | PB `perf-issue.md` [25]; EV `ce-optimize` [62] | keep perf mantras, add keep-or-revert |
| migration / sweep | PS `skills/principle-build-the-lever` [23] + PB `multi-phase-plan.md` [155] | build-the-lever missing from v2 L2 list |
| explain | — | fresh |
| autonomous-run | PB `autonomous-run.md` [13]; CP `ralph-loop/skills/ralph-loop/SKILL.md` [54] | Stop-hook gate, decisions-log |
| pickup / pause | PB `session-pickup.md` [11] + `pause-safely.md` [10]; EV `ce-handoff` [54] | transcript paths |
| ship | PB `opening-a-pr.md` [34]; MP `engineering/pr/SKILL.md` [170]; PB `shipping.md` [12] | forge from profile |

## Principles (L2) — bases under PS `skills/principle-<name>/SKILL.md`

| ven | Base | Adapt |
|---|---|---|
| laziness | `laziness-protocol` [10] (+ `subtract-before-you-add` [18]) | expand |
| model-the-domain | `model-the-domain` [24] | clean |
| type-discipline | `type-system-discipline` [18] | strip language idioms; contract-discipline fresh |
| boundary-discipline | `boundary-discipline` [34] (BM alt [26]) | clean |
| idempotent-operations | `make-operations-idempotent` [24] | rename |
| deep-modules | MP `engineering/codebase-design/SKILL.md` [114] + DEEPENING [37] + DESIGN-IT-TWICE [44] | strip TS snippets / vendor names |
| fix-root-causes | `fix-root-causes` [24] | clean |
| prove-it-works | `prove-it-works` [22]; SP `verification-before-completion` [120] | decisions-log |
| sequence-verifiable-units | `sequence-verifiable-units` [17] | clean |
| test-behavior | `test-behavior-not-implementation` [21]; MP `tdd/tests.md` [77] | generic matcher shapes |
| explain-the-number | `explain-the-number` [17]; PS `skills/benchmark-checklist/SKILL.md` [39] as `references/benchmark-protocol.md` | absorbs benchmark-check |
| encode-lessons-in-structure | BM `brain/principles/encode-lessons-in-structure.md` [23] | + ratchet ladder |
| never-block-on-reversible | `never-block-on-the-human` [15] | rename |
| guard-the-context | BM `brain/principles/guard-the-context-window.md` [11] | — |

## Workflows (L3)

| ven | Base | Alternatives | Adapt |
|---|---|---|---|
| grilling | MP `productivity/grilling/SKILL.md` [30] | SP `brainstorming` | facts → ven-worker; glossary as you go |
| to-spec | MP `engineering/to-spec/SKILL.md` [75] | — | tracker from profile |
| to-tickets | MP `engineering/to-tickets/SKILL.md` [105] | — | tracker from profile, keep expand–contract |
| glossary | MP `engineering/domain-modeling/SKILL.md` [74] + GLOSSARY-FORMAT [60] + ADR-FORMAT [47] | — | neutral examples |
| tdd | MP `engineering/tdd/SKILL.md` [38] + tests [77] + mocking [59] | SP `test-driven-development`; PS `tdd` | seams from the ticket for background coders |
| sweep | PS `skills/swarm/SKILL.md` [46] | SP `dispatching-parallel-agents` | ven-worker, PASS/ISSUES/BLOCKED, respawn once |
| prototype | MP `engineering/prototype/SKILL.md` [26] + LOGIC [67] + UI [112] | PB `prototype.md` | profile `run` |
| reproduce | MP `diagnosing-bugs` phases 1–2 | SP systematic-debugging phase 1 | red-capable loop |
| verify | PS `create-verification-skill` [44] (shape of verify.md) | SP `verification-before-completion` [120]; CTK `skills/verify-this/SKILL.md` [74] | read verify.md, `ven-profile verify` |
| review | PS `skills/interrogate/SKILL.md` [74] + refs rubric/lead-judgment/reviewer-prompt | EV `ce-code-review/references/personas/*`; MP `code-review` [89]; NO `adversarial-review/references/reviewer-lenses.md` | 4 blind lenses, Act on/Consider/Noted/Dismissed |
| blast-radius | PS `skills/blast-radius/SKILL.md` [50] | — | strip framework names |
| quality-review | CTK `skills/thermo-nuclear-code-quality-review/SKILL.md` [181] | — | model-invocable; measure step via profile adapters; smells and remedies → reference; never fixes |
| how | PS `skills/how/SKILL.md` [36] + explorer [35] + explainer [55] | HW `how/SKILL.md` [140] | explorers swarm tier |
| why | PS `skills/why/SKILL.md` [98] + refs epistemics/investigator/synthesizer/sources/code-archaeology | — | vendor sources → packs |
| handoff | MP `productivity/handoff/SKILL.md` [16] | EV `ce-handoff` | near verbatim |
| technical-writing | PS `skills/technical-writing/SKILL.md` [106] | — | allow "ratchet" |
| unslop | PS `skills/unslop/SKILL.md` [62] | EV `ce-noslop` | rule 26 bans "ratchet": allow the skill name |

## Visual, conventions, learning, forge

| ven | Base | Notes |
|---|---|---|
| diagram-deps/data/arch/change/state | fresh (Mermaid patterns: MP `improve-codebase-architecture/HTML-REPORT.md` [123]) | adapter capabilities + badges |
| diagram-flow, citation-check | fresh (PS `how/references/explorer-prompt.md` [35]) | citation-check missing from v2 catalog |
| diagram-hypotheses | MP `diagnosing-bugs` phase 3; SP systematic-debugging phase 3 | tree |
| explain-pr | CTK `skills/pr-review-canvas/SKILL.md` [176]; EV `ce-explain` [81] + `references/explainer-html.md` [29] | template → reference |
| teach | PS `skills/teach/SKILL.md` [21] | build diagrams one part at a time |
| conventions-discover | fresh (MP code-review §3; EV `personas/project-standards-reviewer.md` [77]) | — |
| conventions-audit | PS `skills/correct/SKILL.md` [32]; MP `engineering/retro/SKILL.md` [44]; NO `ruminate/SKILL.md` [110]; BM ruminate [93] | absorbs mine-transcripts (extraction in `bin/ven-transcripts`) |
| ratchet | PS `skills/correct/SKILL.md` [32] | map to ven's 6 rungs; prove red on the past mistake |
| forge-convention | fresh (EV `ce-setup/assets/pack-rule-template.md` [11]) | — |
| learning check | GS `scripts/resolvers/preamble/generate-completion-status.ts` [88] | "No durable learnings" explicit |
| correct | fresh; BM encode-lessons feedback loop; BM `.agents/skills/reflect` [60] | thin router |
| compound | EV `ce-compound/SKILL.md` [79] + `references/schema.yaml`, `yaml-schema.md`, `assets/resolution-template.md`; GS `learn/SKILL.md.tmpl` [197] | add `files:` (from gstack, not Every) |
| compound-refresh | EV `ce-compound-refresh/SKILL.md` [88] + classify/investigate; GS learn prune | lesson twice → ratchet, cap per area |
| reflect | PS `skills/reflect/SKILL.md` [67] + 4 reviewer refs | skill-tdd gate |
| skill-tdd | SP `writing-skills/SKILL.md` [681] + `testing-skills-with-subagents.md` [384] | AS is Apache; condense |
| automate-me | PS `skills/automate-me/SKILL.md` [104] | must pass skill-tdd |
| quiz | fresh (MP `productivity/teach` quiz rules) | — |
| forge-pack | EV `ce-setup/references/pack-scaffold.md` [45] + pack-rule-template | mostly fresh |
| forge-skill | SP writing-skills checklist + MP `productivity/writing-for-agents/SKILL.md` [81] + `SKILL-MECHANICS.md` [22] | — |
| forge-playbook | PS `skills/figure-it-out/SKILL.md` [52] | existing skill names only |
| forge-adapter | fresh (PS create-verification-skill §4) | fixture test |
| forge-reference | PS `typescript-best-practices` [31] + `references/patterns.md`; EV researcher agents; MP `research` | — |
| pack-audit | fresh (PS `maintain-verification-skill` [39], GS learn stats) | — |

## Agents

| ven | Base |
|---|---|
| ven-lead | PS `agents/poteto-agent.md` [9]; SP `using-superpowers` [65] |
| ven-coder | SP `subagent-driven-development/implementer-prompt.md` [154]; CP `orchestrate/skills/orchestrate/prompts/worker.md` [70] |
| ven-worker | CP `orchestrate/.../prompts/worker.md` [70]; PS swarm brief contract |
| ven-reviewer | PS `interrogate/references/reviewer-prompt.md` [62]; EV personas; SP `requesting-code-review/code-reviewer.md` |
| ven-verifier | CP `orchestrate/.../prompts/verifier.md` [74]; CTK verify-this |

## Reference notes

- **pstack principle shape:** `# Title`, one rule, `**Why:**`, then `**Pattern:**` / `**The test:**` / `**Stop:**`, "Distinct from X".
- **Pocock:** model-invoked descriptions read "<what>. Use when <cases>"; `metadata.credits` used for upstream attribution.
- **superpowers TDD for skills:** no skill without a failing test first; pressure scenarios (3+ pressures, forced A/B/C choice); run without the skill, record excuses verbatim; smallest skill that fixes observed failures; each new excuse becomes an explicit counter; always compare to a no-guidance control; 5+ reps.
- **gstack "no silent learnings":** "Before completing, review the session for durable learnings and log each one. The review runs every time… If the review genuinely surfaces none, state "No durable learnings this session"… Do not log obvious facts or one-time transient errors."
- **Every compound frontmatter:** `title`, `date`, `category`, `module`, `problem_type`, `component`, `symptoms[]`, `root_cause`, `resolution_type`, `severity`, `tags[]` (+ ven adds `files[]`). Body: Problem, Symptoms, What Didn't Work, Solution, Why This Works, Prevention, Related Issues.

## Corrections to design v2 found while mapping

- `compound`'s `files:` comes from gstack learnings, not Every.
- skill-creator (cited for skill-tdd) is Apache-2.0, not MIT.
- pstack unslop rule 26 and technical-writing ban the word "ratchet"; allow it as a skill name.
- `improve-architecture` (refactor playbook), `citation-check` (ven-verifier preload) and `build-the-lever` (migration playbook) are referenced but not in the v2 catalog.
