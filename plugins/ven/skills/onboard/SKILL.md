---
name: onboard
description: "Turn an unknown repo into a verified ven profile, local wiring and a list of proposed packs in one session. Use once per repo before other ven work, and with --refresh when manifests, lockfiles or commands change."
argument-hint: "[--refresh]"
disable-model-invocation: true
metadata:
  layer: L5
  source: "cursor/plugins@1e5c90a:pstack/skills/create-verification-skill/SKILL.md; EveryInc/compound-engineering-plugin@7a68002:skills/ce-setup/SKILL.md; mattpocock/skills@49dd158:skills/engineering/setup-matt-pocock-skills/SKILL.md (patterns only)"
  license: MIT
---

# Onboard

Turn this repo into a profile that every other ven skill reads instead of guessing: stack facts, proven commands, verify recipes, a glossary, local wiring, a baseline and the packs worth forging. Plan on 20–40 minutes.

## Ground rules

- **Local only.** Everything goes in the state directory (`ven-profile path`, outside the repo and shared by all its worktrees). Settings go in the main worktree's `.claude/settings.local.json`, merged, with the diff shown first. Never edit the team's `CLAUDE.md`, a tracked file or any source. The only files outside the state directory are that settings file and, with consent, `.worktreeinclude`.
- **Detect, don't assume.** Every fact names the file (and line) that proves it. A fact with no proof becomes a question for the user, never a guess.
- **Ask only what the repo can't answer**, with AskUserQuestion.
- **Proven, not trusted.** A command is `verified` only after it ran here and exited 0. Nothing relies on an `unverified` command. A command with side effects outside the repo is `manual`.
- **Consent.** Installing a tool, dependency or plugin, starting a service, or running a setup step needs the user's explicit yes.
- **No hard-coded config paths.** The user's Claude config dir may be non-default; read paths from tools (`ven-doctor`), never assume them.
- **Log each phase:** `ven-decisions add --playbook onboard --step <phase> --decision "<one line>" --evidence "<command + exit, or file>"`. Log every human answer the same way with `--step confirm`; `--refresh` reads them back.

Not in a git repository: stop, ven needs one. A profile already exists and no `--refresh`: ask whether to refresh (recommended) or start over.

## 1. Detect (read-only)

1. `ven-profile init`, then `ven-profile detect`. It prints the signal files grouped by source.
2. Spawn one `ven:ven-worker` per source, in parallel, with `model: ${user_config.swarm_model}`; budget tier `${user_config.budget_tier}` sets `effort` (`lean` → `low`, `max` → `high`). Sources: manifests and lockfiles, workspaces and structure, CI, scripts, tests, quality configs, runtime and env, agent docs and ADRs, git history. Build each brief from [references/detect-briefs.md](references/detect-briefs.md).
3. Split a source with more than 40 files across workers by top-level directory. Skip a source with no files, except workspaces, tests and git history, which run their own listing commands.
4. A worker that returns BLOCKED gets an answer or a narrower brief. Re-check yourself any fact that conflicts with another or that a command depends on.

## 2. Synthesize (you)

Draft `profile.json` field by field from [references/profile-checklist.md](references/profile-checklist.md): `repo` (forge, tracker), `stack` with `stack.sources`, `workspaces` with per-workspace commands, every command leaf with its `evidence`, `tests.patterns`, `docs_only`, `boundaries`, `risk_areas`, `domain_nouns`, `suppressions` and `assertions` regexes for this repo's tools, `conventions` and a draft `verify` map.

The profile is data: concrete tool names, globs and regexes belong in it. Keep a list of what the facts did not settle; it is the agenda for phase 3.

## 3. Confirm (human)

Run **grilling** over the open list only. Typical questions:

- **Proof per change type.** For each change type this repo has (logic, endpoint, UI flow, CLI, data change, background job, integration), which command proves a change works end to end, and what to read back afterwards.
- **Risk.** What is risky to touch and why. Confirm or correct the drafted `risk_areas` and `boundaries`.
- **Domain words.** What the top domain nouns mean, which synonyms to avoid, which code names they map to.
- **Leftovers.** The tracker, which of two candidate commands is canonical, whether a command has side effects.

Write answers down as they settle: domain words become entries in `$(ven-profile path)/GLOSSARY.md` (apply **glossary**); proof answers become `verify` entries and sections of `verify.md` ([references/verify-template.md](references/verify-template.md)); risk answers update the draft.

## 4. Prove

Follow the "Prove" and "Failure triage" sections of [references/profile-checklist.md](references/profile-checklist.md):

1. `ven-profile write` with the draft on stdin, then `ven-profile prove`.
2. Prove `commands.test.single` with a real, small, existing test file: `ven-profile prove commands.test.single --file <path>`. Prove workspace commands too.
3. Triage each failure: **wrong command** (fix `run`, re-prove), **missing environment** (keep `unverified`, record `requires` and `failure_tail`, tell the user what would make it pass) or **existing violations** (keep `unverified`, baseline it in phase 6). Never edit repo files to make a command pass.
4. Show the user the result: verified, unverified with the reason, manual. Each `verify` entry must point at a command that is verified or that the user accepts as unverified with a stated reason.

## 5. Wire

Follow [references/wiring.md](references/wiring.md):

1. `adapters.json`: map each capability to a tool already in the repo and prove it with `ven-profile prove-adapters`. A missing tool is a suggestion, installed only on consent.
2. `.claude/settings.local.json`: `worktree.baseRef` `"head"` (coder worktrees must see the feature branch), allow rules for `ven-profile`, `ven-decisions`, the verified command prefixes and the state directory, and the local pack marketplace. Show the merged diff, ask, then write.
3. Suggest a `.worktreeinclude` for the gitignored env files the tests need. It is a repo file: ask whether to commit it or keep it local through `.git/info/exclude`.
4. Write `map.md` ([references/map-template.md](references/map-template.md), at most 100 lines) and finish `verify.md`.
5. Run `ven-doctor`. Show the skill collisions and its suggested `skillOverrides`; the user decides, then merge their choice.

## 6. Baseline

Record what is already wrong so later checks fail only on new problems.

1. For each lint, boundary and typecheck command that runs as intended (verified, or unverified only because of existing violations), and each verified `graph.boundaries`, `lint.custom` or `rules.structural` adapter: `ven-profile run <key> > "$(ven-profile path)/baseline/<key>.txt"` (adapters: `ven-profile adapter <capability>`).
2. Write `baseline/index.json`: per key, `run`, `exit`, `sha` (`git rev-parse HEAD`), `dirty` (uncommitted changes present), `at`, and `count` with `count_how` (the regex or tool summary line used to count violations; `null` when the output has no countable shape).
3. Tell the user the counts. A baseline taken on a dirty tree includes their uncommitted work; say so.

## 7. Propose packs

1. List the packs that would pay off, each with its evidence:
   - **tech**: a framework, data layer or tool that many files depend on (manifest line, glob with file count);
   - **domain**: a cluster of domain nouns with risk areas or fix churn (glossary terms, paths, commit counts).
   Give each a name, kind, `applies_when` (paths, deps) and what it would hold (principles, a playbook, adapters).
2. Ask which to forge (multi-select), and whether now or later.
3. Hand each approved pack to **forge-pack**, one at a time. Packs left for later go under "Proposed packs" in `map.md` with their evidence.

## Close

1. `ven-profile validate`, then `ven-doctor`: no warning that onboarding owns may remain.
2. Log one verify pass on the final tree: `ven-profile verify <the broadest verified verify key>`. It proves the verify map end to end, and stops the stop gate from charging this session with changes that were already on the branch. If it fails, report why; onboarding never fixes code.
3. Report: the state directory, command counts by status (with the reason for each unverified one), settings changed, open questions, packs forged or proposed. Offer **conventions-discover** to record the team's patterns. Next steps: type `/ven:do <task>` for work, and rerun `/ven:onboard --refresh` when the stack changes.

## Refresh

With `--refresh`, keep what humans settled and re-prove only what moved.

1. Read the current profile (`ven-profile show`), `GLOSSARY.md`, `verify.md`, `map.md` and the confirmed answers (`ven-decisions list --playbook onboard`).
2. Run phase 1. Diff the facts against the profile: commands, sources, workspaces, dependencies, test patterns.
3. Update only what changed. Human-confirmed answers (glossary, `verify` entries, risk areas, boundaries, `manual` statuses) stay unless their evidence is gone; then ask. Run phase 3 only for new open questions.
4. Write the profile without `generated_at` (`ven-profile write` sets it, which resets freshness). Prove only new or changed keys: `ven-profile prove <key>...`.
5. Update `map.md`, `verify.md` and settings (new verified prefixes only). Re-baseline only if the user asks: it hides violations added since the last baseline.
6. Report the diff: added, removed, changed, newly unverified.
