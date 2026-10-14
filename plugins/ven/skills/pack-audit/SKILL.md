---
name: pack-audit
description: "Audit this repo's packs: skills and playbooks never used, failing evals, references behind the locked version, applies_when matching no files. Reports and proposes removals. Use periodically, after a dependency upgrade, or when a pack feels noisy or slow."
metadata:
  layer: L3
  source: cursor/plugins@main:pstack/skills/maintain-verification-skill/SKILL.md + garrytan/gstack@main:learn/SKILL.md.tmpl
  license: MIT
---

# Pack audit

Packs rot: code moves, libraries upgrade, skills stop firing, and each loaded skill still costs context. This audit finds what no longer earns its place and proposes what to cut. It changes nothing without the user's yes.

**Outcome**, exactly one, stated first in the report:

- **clean:** every check ran and passed; nothing to propose.
- **changed:** the user approved changes, and they are applied and proven.
- **blocked:** a check could not run; say which one and why.

**Input:** every pack in `ven-profile get packs`, or the one named. Per pack, `<pack dir>` is `$(ven-profile path)/packs/<pack>/`, read with its `pack.json` and `.claude-plugin/plugin.json`; `<ven root>` is `${CLAUDE_PLUGIN_ROOT}`. With several packs, fan out one read-only `ven:ven-worker` brief per pack (`model: ${user_config.swarm_model}`) for checks 1, 2, 4 and 5.

## Checks

1. **Registration.** The pack directory, its entry in `$(ven-profile path)/packs/.claude-plugin/marketplace.json`, its entry in the profile's `packs` and `claude plugin list` (enabled as `<plugin>@<marketplace>`) agree. A directory nothing registers is an abandoned draft.
2. **Use in the last 90 days.**
   - Skills: count Skill tool calls naming `<plugin>:<skill>` in the transcripts `ven-transcripts` reads (Grep `"skill":"<plugin>:<skill>"` across `~/.claude*/projects/*<repo>*/*.jsonl`).
   - Playbooks: count the picks in `ven-transcripts --kind routes --since 90`.
   - Zero uses makes an item a candidate; read its `evidence` in `pack.json` before proposing anything.
3. **Evals.** Read the newest `<pack dir>/evals/results/*/aggregate-result.json`. Any case under 1.00, missing results, or results older than the newest pack file outside `evals/results/`: rerun with `node <pack dir>/scripts/eval.mjs --ven <ven root> --runs 3 --max-cost-usd 15`, granting `--allow-tools` for what the cases list. When the budget tier is `lean` (`ven-profile get budget_tier`, else `${user_config.budget_tier}`), report "not rerun" instead of spending.
4. **References.** Compare each `references[]` entry's `version` with the version its `lockfile` locks now; a difference is stale. Check the `file:line` rows in the reference with **citation-check**.
5. **applies_when.** Glob each `applies_when.paths` pattern from the repo root: no match is dead. Each `applies_when.deps` name must still appear in a manifest from `ven-profile get stack.sources`. A skill whose `paths:` match nothing never activates.
6. **Weight.** `claude plugin details <plugin>@<marketplace>` gives the pack's projected context cost. A costly pack with little use is a candidate even when each item is used now and then.

## Report

```text
Outcome: <clean | changed | blocked>
Pack <pack> (<kind>, v<version>): <n> skills, <n> playbooks, <n> references (<n> stale), <n> adapters; <n> uses in 90 days; context ~<n> tokens
| Item | Kind | Uses | Evals | Finding | Proposal |
```

One table per pack. Every finding cites its evidence: the transcript count, the case and score, the lockfile line, the glob.

## Propose, then apply what is approved

Ask once per pack with AskUserQuestion, as a multi-select of its proposals; selecting none keeps everything:

- **Fix** a failing item: send it back through **forge-skill**, or the forge skill that built its kind.
- **Remove** an unused or unfixable item: its directory or file, its `pack.json` entry, its eval cases, its name or path in the profile's `packs`.
- **Refresh** a stale reference with **forge-reference** for the locked version.
- **Narrow** dead `applies_when`: change `pack.json`, every skill's `paths:` and the profile entry together.
- **Retire** a pack with nothing left in use: `claude plugin disable <plugin>@<marketplace> --scope local` and drop its profile entry. Keep the directory until the user says to delete it.

After applying: bump the patch `version` in `plugin.json`, run `ven-lint-skills --pack <pack dir>` and the whole suite (every case 1.00), then record `ven-decisions add --step pack-audit --decision "<outcome>: <changes>" --evidence "suite <n>/<n>"`. Tell the user to run `/reload-plugins` when skills changed.
