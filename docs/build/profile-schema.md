# Repo state: profile, adapters and the state directory

Every repo ven works in has one state directory: `~/.ven/repos/<repo>-<hash of the git common dir>/` (`VEN_HOME` moves `~/.ven`; `VEN_STATE_DIR` overrides the whole path, which eval fixtures use). It is shared by all worktrees of the repo, never committed, and outside `.git/` because Claude Code protects `.git/` from pre-approved writes. Print it with `ven-profile path`. Nothing ven writes goes into the working tree, and the team's `CLAUDE.md` is never edited; the SessionStart hook injects `map.md` instead.

```text
~/.ven/repos/<repo>-<hash>/
├── profile.json        # stack facts + verified commands (schema below)
├── adapters.json       # capability → command (schema below)
├── verify.md           # how to prove each change type in this repo
├── map.md              # ≤100-line map injected at session start (what CLAUDE.md would hold)
├── GLOSSARY.md         # domain terms → one-line definition → code names
├── adr/                # decision records
├── diagrams/           # committed-style diagrams (badged)
├── solutions/<area>/<slug>.md   # compound entries; frontmatter `files:` is required
├── handoffs/           # pause notes
├── proposals/<date>-<slug>.md     # skill/check proposals awaiting skill-tdd (format defined in skill-tdd)
├── quiz.md             # quiz deck
├── specs/<slug>.md     # to-spec output
├── tickets/<slug>/NN-<title>.md   # to-tickets output when repo.tracker is 'none'
├── conventions.md      # conventions-discover output: patterns the team follows, with example locations
├── explain/<branch>.html          # explain-pr and teach pages (read, not committed)
├── baseline/           # snapshots of existing lint/boundary violations
├── decisions.tsv       # ts, worktree, playbook, step, decision, evidence
├── state/              # active playbook per worktree, sessions, verify.jsonl (last 500 entries; an entry with `tree_changed` never counts as a pass), written by bin tools only
└── packs/              # local marketplace: .claude-plugin/marketplace.json + one plugin dir per forged pack
```

## profile.json

```jsonc
{
  "schema_version": 1,
  "generated_at": "2026-10-14T12:00:00Z",
  "repo": {
    "name": "repo-name",
    "default_branch": "main",
    "forge": { "kind": "<code host>", "cli": "<cli used for PRs>", "pr_template": "path or null" },
    "tracker": { "kind": "<issue tracker>", "how": "how tickets are created/linked, or 'none'" }
  },
  "stack": {
    "languages": [], "frameworks": [], "package_manager": "", "runtime": {},
    "typed": true,
    "sources": ["manifest and lockfile paths the profile was built from"],
    "source_hashes": { "<source path>": "sha256 of the file when the profile was stamped" }
  },
  "workspaces": [{ "name": "", "path": "", "kind": "app|lib|tool", "commands": { "<same shape as commands>": {} } }],
  "commands": {
    "setup": {}, "build": {},
    "test": { "all": {}, "single": {} },
    "typecheck": {}, "lint": {}, "format": {},
    "run": {}, "migrate": {}, "codegen": {}
  },
  "verify": { "<change type>": "commands.<key>" },
  "tests": { "patterns": ["globs that identify test files"], "layout": "colocated|separate" },
  "docs_only": ["globs whose changes need no verify"],
  "boundaries": [{ "from": "glob", "to": "glob", "rule": "never-imports", "why": "" }],
  "risk_areas": [{ "path": "glob", "why": "" }],
  "domain_nouns": [],
  "suppressions": [{ "pattern": "regex", "why": "" }],
  "assertions": [{ "pattern": "regex", "why": "" }],
  "conventions": { "commit_style": "", "branch_naming": "" },
  "packs": [{ "name": "", "kind": "tech|domain", "plugin": "name@marketplace", "applies_when": { "paths": [], "deps": [] }, "skills": [], "playbooks": ["absolute paths"] }],
  "budget_tier": "optional per-repo override of the userConfig tier"
}
```

### Freshness

`ven-profile write` always sets `generated_at` and records `stack.source_hashes`. The profile is stale when a source's content hash differs from the recorded one, so a checkout or a touch that leaves the content alone does not make it stale. A profile without `source_hashes` (written by an older version) falls back to comparing each source's mtime with `generated_at`.

`ven-profile stamp` rewrites `generated_at` and `source_hashes` and changes nothing else. Use it after checking that the profile still holds for the changed manifests; use `/ven:onboard --refresh` when it does not.

### Validation

`loadProfile` rejects any `schema_version` other than 1. `ven-profile validate` (and `set`/`write`) also require every `verify.<type>` value to name an existing command and every `packs[]` entry to have `name` and `kind`. `ven-profile prove` and `prove-adapters` re-read the file just before saving and update only the `status`, `proof` and `failure_tail` of the commands they ran, so a `set` made during a long prove survives.

### Command leaf

Every command, in `commands`, `workspaces[].commands` and `adapters.json`, has the same shape:

```jsonc
{
  "run": "shell command; {file} and {files} are filled in and shell-quoted",
  "status": "verified | unverified | manual",
  "cwd": "relative to repo root, default .",
  "timeout_s": 600,
  "requires": ["docker", ".env", "a running dev server"],
  "globs": ["optional: files this command applies to (format uses it)"],
  "evidence": "file that proves the command (e.g. package.json#scripts.test)",
  "proof": "last prove result, written by ven-profile prove (exit code, duration, time)",
  "failure_tail": "last lines of output when unverified"
}
```

`verified` means `ven-profile prove` ran it and it exited 0. Workspace commands are addressed by name: `workspaces.<name>.commands.test.all`. `unverified` commands are never relied on. `manual` commands (dev servers, deploys, anything with side effects outside the repo) are never run by `prove`; a human confirms them.

### Keys skills use

| Need | Key | How |
|---|---|---|
| Run one test file | `commands.test.single` | `ven-profile run commands.test.single --file <path>` |
| Run all tests | `commands.test.all` | `ven-profile run commands.test.all` |
| Typecheck / lint / build | `commands.typecheck`, `commands.lint`, `commands.build` | `ven-profile run <key>` |
| Prove a change works | `verify.<change type>` → a command key | `ven-profile verify <command key>` (logs the pass against the tree; the verify-gate reads it) |
| Where to open PRs | `repo.forge` | use `repo.forge.cli` |
| Where tickets go | `repo.tracker` | follow `repo.tracker.how` |
| Is this a test file | `tests.patterns` | globs |
| Risky paths | `risk_areas` | globs + why |
| Packs for files | `packs` | `ven-profile packs-for <files>` |

## adapters.json

Capabilities the visual and conventions skills ask for. Each value is a command leaf whose stdout is the capability's output.

| Capability | Output | Used by |
|---|---|---|
| `graph.imports` | module import edges as JSON `[{from,to}]` or Mermaid | diagram-deps, diagram-change, blast-radius |
| `graph.boundaries` | boundary violations as JSON `[{from,to,rule}]` | ratchet, diagram-deps |
| `schema.read` | entities and relations as JSON `{entities:[{name,fields,relations}]}` | diagram-data |
| `code.search` | `path:line:text` lines for a pattern `{pattern}` | diagram-flow, how |
| `symbols.list` | symbols in `{file}` as `name kind line` | diagram-state |
| `workspace.list` | workspaces/containers as JSON | diagram-arch |
| `lint.custom` | runs a custom lint rule set; exit 1 on violations | ratchet |
| `rules.structural` | runs structural (AST pattern) rules; exit 1 on violations | ratchet |

Run with `ven-profile adapter <capability> [--file F]`. A missing capability means the skill falls back to reading files itself and suggests **forge-adapter**.

## verify.md

One section per change type the repo has (for example: logic, API endpoint, UI flow, CLI, data/migration, background job, integration). Each section says: what counts as proof, the exact command key (`verify.<type>`), preconditions (`requires`), and what to read back. "It compiles" is never proof.

## map.md

At most ~100 lines: what the repo is, workspaces, the verified command keys, where the glossary and solutions live, enabled packs, risk areas, and the ven entry points (`/ven:do`, `/ven:help`). Pointers, not prose.
