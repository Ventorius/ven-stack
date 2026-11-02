# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed

- ven is skill-only and runs in any agent that loads `SKILL.md` folders and runs
  shell commands. Claude Code stays an install route through the marketplace.
- The profile fills in as work needs it: `ven-profile learn` finds a command's
  proof on first use; facts only a person knows are asked when first needed
- Model and budget settings move to `~/.ven/config.json` (`ven-profile config`)
- Packs are plain directories the router reads (`packs-for` returns skill files);
  pack hooks become diff checks that `ven-profile verify` runs
- The tools moved into the `setup` skill; `install.mjs` links them into `~/.ven/bin`
- `ven-doctor` checks node, git, the tools on `PATH`, settings and legacy state

### Removed

- The `onboard` skill, `map.md` and session-start context injection
- All hooks. Their gates moved: `ven-decisions end` refuses `done` without a
  passing verify on the current tree, `ven-profile verify` refuses diffs that
  hide checks, and `ven-profile context` / `solutions-for` surface past solutions
- Agent definitions; the `delegate` skill holds the coder, worker, reviewer
  and verifier brief templates and works with or without subagents
- Plugin `userConfig` and `plugins/ven/.claude-plugin/plugin.json`

### Added

- `setup` and `delegate` skills; `ven-profile learn`, `context`, `solutions-for`,
  `config`, `root` and `migrate` (upgrades onboarded repos)
- A portability ratchet in `ven-lint-skills` that bans one agent's tool names,
  variables and frontmatter in core skills

- Playbooks: hotfix, flaky-test, spike, dependency-upgrade, docs-only
- Small-task fast path in the router; review ownership declared per playbook
- `ven-decisions end` requires a learning-check row; `list --step` and `--json`
- `ven-profile stamp`, `prove --strict`, `ven-doctor --strict` and `--json`
- `ven-new-skill` scaffold, `bun run notices`, `bun run pin:sources`
- Cheap routing eval tier (`eval:routing:quick`) and eval history (`eval:history`)
- Linter rules: trigger phrase, description length, name matches directory,
  dead `ven:` references, near-duplicate descriptions
- CI on pull requests: tests, skill lint, routing case drift
- LICENSE, CHANGELOG, CONTRIBUTING

### Changed

- Core line budget raised from 6000 to 7000
- `benchmark-check` folded into `explain-the-number`; `mine-transcripts`
  folded into `conventions-audit`; `help` cut to a short suggester
- One promotion rule (2 occurrences → check, 3 instances → pack skill)
- Profile staleness compares content hashes instead of mtimes
- Bin tools reject unknown or valueless flags; usage errors exit 2
- Upstream `metadata.source` refs pinned to commit SHAs

### Fixed

- State and profile writes are atomic; `prove` no longer overwrites
  concurrent `set`s
- `ven-profile verify` logs no pass when the tree changed during the run
- `verify.jsonl` is bounded to the last 500 entries
- Evals results symlink is ignored by git

## [0.1.0] - 2026-10-14

Initial release.
