# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

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
