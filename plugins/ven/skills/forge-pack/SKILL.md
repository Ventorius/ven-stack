---
name: forge-pack
description: "Forge a pack for one technology or business domain of this repo: skills, playbooks, references and adapters built from evidence, enabled only when every eval passes. Use when onboarding proposes a pack or the user asks for one."
metadata:
  layer: L3
  source: EveryInc/compound-engineering-plugin@main:skills/ce-setup/references/pack-scaffold.md + garrytan/gstack@main:skillify/SKILL.md.tmpl
  license: MIT
---

# Forge a pack

A pack makes ven specific to one technology or one domain of this repo while core stays generic. It is a plugin in the repo's local marketplace under `$(ven-profile path)/packs/`, enabled only after its whole eval suite passes. The tree, `pack.json`, placeholders, the eval runner and the registration commands are in `references/pack-layout.md`.

**Input:** a tech or domain name. Read the profile first (`ven-profile show`); with no profile, stop and tell the user to run `/ven:onboard`.

**Writes:** only the state directory and the local enablement in `.claude/settings.local.json`. Nothing is committed to the repo. A pack below 100% is never enabled.

## 1. Resolve the target

- **Id:** the name in kebab-case. **Plugin:** `<repo>-<pack>`, with `<repo>` from `ven-profile get repo.name` in kebab-case. `<pack dir>` below means `$(ven-profile path)/packs/<pack>/`; `<ven root>` means `${CLAUDE_PLUGIN_ROOT}`, ven's own directory.
- **Kind:** `tech` when the name is a dependency in the lockfiles the profile lists (`ven-profile get stack.sources`); `domain` when it is a business area (`ven-profile get domain_nouns`, `$(ven-profile path)/GLOSSARY.md`). Neither: ask.
- No `$(ven-profile path)/packs/.claude-plugin/marketplace.json`: run `ven-profile init`.
- `<pack dir>` already has a `pack.json`: the pack exists. Skip step 4 and send each new item to its forge skill. A `<pack dir>` without `pack.json`: stop and report it.

## 2. Mine the evidence

Fan out read-only `ven:ven-worker` briefs (`model: ${user_config.swarm_model}`), one per source. Each returns instances: source, date, `file:line` or link, what went wrong or was needed, and what fixed it.

- **Corrections:** `ven-decisions list --step correction` first, kept to the pack's terms; then `ven-transcripts --kind corrections --since 90` and `--kind routes` as the fallback.
- **Solutions:** entries in `$(ven-profile path)/solutions/` whose symptoms or `files:` touch the area.
- **Merged PRs:** the code host CLI named by `ven-profile get repo.forge.cli`, read-only subcommands only, plus `git log --grep`. Review comments that repeat count; one-off typos don't.
- **Code:** where the tech or domain lives (imports, domain nouns) gives `applies_when.paths`, with a match count per glob; dependency names and locked versions give `applies_when.deps`; heavily used libraries are reference candidates.

Cluster the instances into items:

| Item | Bar | Forged by |
|---|---|---|
| reference | a library whose misuse shows up in the instances | **forge-reference** |
| adapter | a capability a skill needs that `ven-profile adapters` lacks | **forge-adapter** |
| skill | one idea that meets the pack bar | **forge-skill** |
| playbook | a task shape that meets the pack bar and no core playbook fits | **forge-playbook** |

The pack bar is the promotion rule in **encode-lessons-in-structure**: 3 real instances.

- A correction a type, import rule, lint rule or hook can catch is not a skill. List it as a ratchet candidate; once the pack is enabled, `/ven:ratchet` places it in the pack's `rules/`.
- A cluster under the bar becomes a proposed **compound** entry, not pack content.
- No item clears the bar: forge nothing; report the instances and the proposed entries.

## 3. Preview and ask once

Show the whole plan in one message. Each skill carries its settled scope, so the approval also settles **forge-skill**'s steps 1 and 2.

```text
Pack <pack> (<kind>) -> plugin <repo>-<pack>
applies_when  paths: <glob> (<n> files), ...   deps: <name> <locked version>, ...
references    <library> <version>
adapters      <capability> via <existing tool | script>
skills        <name> (L2|L3): <one idea>
                trigger: <words a task uses>  boundary: <what it never does>  cites: ven:<name>
                evidence: <n> instances, one line each
playbooks     <name>: <task shape> (<n> instances)
deferred      ratchet: <corrections>; compound: <clusters under the bar>
evals         <cases planned>; at most $15 per suite run
writes        <pack dir>, the local marketplace, the profile's packs, .claude/settings.local.json
```

Ask with AskUserQuestion: forge it, change the plan, or stop. Write nothing before "forge it". As a subagent, return `VEN-RESULT: BLOCKED: approve the pack plan` with the preview.

## 4. Scaffold

1. Copy `<ven root>/templates/pack/` to `<pack dir>`, rename its `cases/` to `evals/`, and fill every placeholder. Done when `grep -rn '{{' <pack dir>` prints nothing.
2. `claude plugin validate <pack dir>` passes.

## 5. Forge the items

In this order, since each kind uses the ones before it:

1. Each reference: **forge-reference**.
2. Each adapter: **forge-adapter**.
3. Each skill: **forge-skill**, from its step 3; the approved plan is its evidence and scope.
4. Each playbook: **forge-playbook**.

Each forge skill writes its own entry into `pack.json` and runs its own cases. An item that cannot be proven is dropped and reported, never shipped half-done.

## 6. Prove the pack

1. `ven-lint-skills --pack <pack dir>` passes.
2. The whole suite scores 1.00 on every case, through the runner in the reference, at `--runs 3 --max-cost-usd 15`. A failing case goes back to its item's forge skill; rerun the suite after each fix. Never lower `--threshold`.

## 7. Register and enable

1. Follow "Register" in the reference: the marketplace entry, the profile's `packs`, local enablement.
2. Record it: `ven-decisions add --step forge-pack --decision "enabled <pack>: <n> skills, <n> playbooks" --evidence "suite <n>/<n> at 3 runs"`.
3. Tell the user to run `/reload-plugins` (or restart), and which files now bring in which skills.

## Promote

A pack with nothing specific to this repo or to a business domain (kind `tech`, generic globs, no glossary terms) can serve other repos. Offer it; promote only on the user's yes, following "Promote" in the reference.
