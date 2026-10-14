# Profile checklist

The profile is data. Concrete tool names, globs and regexes belong in it, so skills never hard-code them. Every value comes from a detect fact or a user answer.

## Shape

```jsonc
{
  "repo": {
    "name": "", "default_branch": "",
    "forge": { "kind": "<code host>", "cli": "<cli for PRs, or null>", "pr_template": "<path or null>" },
    "tracker": { "kind": "<tracker or none>", "how": "<how tickets are created and linked>" }
  },
  "stack": { "languages": [], "frameworks": [], "package_manager": "", "runtime": {}, "typed": true, "sources": [] },
  "workspaces": [{ "name": "", "path": "", "kind": "app|lib|tool", "commands": {} }],
  "commands": {
    "setup": {}, "build": {}, "test": { "all": {}, "single": {} },
    "typecheck": {}, "lint": {}, "format": {}, "run": {}, "migrate": {}, "codegen": {}
  },
  "verify": { "<change type>": "commands.<key>" },
  "tests": { "patterns": [], "layout": "colocated|separate" },
  "docs_only": [], "boundaries": [{ "from": "", "to": "", "rule": "never-imports", "why": "" }],
  "risk_areas": [{ "path": "", "why": "" }], "domain_nouns": [],
  "suppressions": [{ "pattern": "", "why": "" }], "assertions": [{ "pattern": "", "why": "" }],
  "conventions": { "commit_style": "", "branch_naming": "" },
  "packs": []
}
```

Omit a command key the repo doesn't have. Leave out `schema_version` and `generated_at`; `ven-profile write` fills them.

## Command leaf

`{ "run", "status", "cwd", "timeout_s", "requires", "globs", "evidence", "failure_tail" }`

- `run`: the exact command a person types at `cwd`. When a script, a task target and a CI step disagree, the CI step wins; name the others in `evidence`. `{file}` and `{files}` mark file arguments; ven-profile fills and shell-quotes them.
- `status`: `unverified` in the draft. `manual` when the command starts a long-running process (dev server, watcher), deploys or publishes, migrates or seeds a shared database, sends messages, calls a production or paid service, or needs credentials. `prove` never runs `manual`.
- A command that writes tracked files (a formatter or fixer run on the whole repo, codegen into tracked paths) takes `{files}` or is `manual`.
- `evidence`: the source, as `<file>#<key>` or `<file>:<line>`, then the prove result.
- `requires`: what must exist for it to pass (services, env files, a build output, network), from the runtime and CI facts.
- `timeout_s`: the CI timeout when there is one; otherwise generous for full suites and 120 for one file.
- `globs`: on `format` (and any command that applies to some files only), the file types it handles, so the format hook skips everything else, including the state directory.

## Field by field

| Field | From | Rule |
|---|---|---|
| `repo.forge` | remote host, owners file, PR template | `cli` only if `command -v <cli>` succeeds; otherwise null, and say so |
| `repo.tracker` | ticket references in commits and branches, PR template, docs | none found: `kind: "none"`, `how: "tickets in the state directory"`; confirm with the user |
| `stack.frameworks` | direct dependencies | only those that shape the code (app framework, data layer, test runner, UI kit), not every dependency |
| `stack.typed` | type checker config, language | true when a type check runs over most source |
| `stack.sources` | root and workspace manifests, lockfiles, workspace config, task-runner files | repo-relative; freshness compares their mtime with `generated_at`. Not CI files |
| `workspaces` | workspace config, per-workspace manifests | `kind`: app (run or deployed), lib (imported by others), tool (dev tooling). Per-workspace `commands` only where they differ from the root command |
| `commands.setup` | CI install step | the lockfile-strict install mode CI uses; running it needs the user's yes |
| `commands.test.single` | runner, its single-file form | takes `{file}` and runs only that file |
| `commands.format` | formatter | takes `{files}`; set `globs` |
| custom `commands.<name>` | end-to-end suites, smoke checks, CLI runs | add one when a change type needs proof no standard key gives |
| `verify` | phase 3 answers | each value is a `commands.<key>` that runs unattended; types the repo doesn't have are left out |
| `tests.patterns` | test listing | every glob matches at least one tracked file (`git ls-files '<glob>'`) |
| `docs_only` | docs directories, prose files | leave out doc-like files that a build or test reads (generated pages, snapshots, templates) |
| `boundaries` | configured import rules, documented rules, user | only with evidence or confirmation; `boundaries[].why` quotes the source |
| `risk_areas` | fix churn, owners file, docs warnings, user | typical: data migrations, auth and permissions, money amounts, public contracts, generated code; only what the repo has |
| `domain_nouns` | commit words, module and directory names, doc terms | business nouns, not programming ones |
| `conventions` | git facts | `commit_style` with one example; `branch_naming` as a pattern |
| `packs` | — | `[]`; **forge-pack** fills it |

## Suppressions and assertions

The no-workaround hook flags added lines that match `suppressions`, and test-file edits that lower the count of `assertions` matches. Write regexes (matched per line, JS syntax) for the tools this repo uses:

- `suppressions`: each linter's inline disable directive, each type checker's ignore or expect-error directive, coverage-exclusion pragmas, the test runner's skip, focus/only and todo markers. `suppressions[].why` says what the suppression hides.
- `assertions`: the assertion call forms the sampled tests use.

Test each regex on a line with a known occurrence and on an ordinary line: `node -e 'console.log(new RegExp(process.argv[1]).test(process.argv[2]))' '<regex>' '<line>'`. A pattern that matches ordinary code is wrong.

## Prove

1. Run `git status --porcelain` and keep the output.
2. Write the draft with a heredoc: `ven-profile write <<'JSON'` … `JSON`. Fix every validation error.
3. `ven-profile prove` runs every non-manual command that has no file placeholder.
4. `ven-profile prove commands.test.single --file <path>` with one of the small test files. If it prints `skip`, run `ven-profile run commands.test.single --file <path>`; on exit 0, `ven-profile set commands.test.single.status verified` and set its `evidence`. Check the output shows only that file ran.
5. `prove` walks `commands` only. For each workspace leaf, `ven-profile run workspaces.<i>.commands.<key>` and set its `status` and `evidence` the same way.
6. `prove` replaces `evidence` with its result. Put the source back in front: `ven-profile set <key>.evidence "<source>; <prove result>"`.
7. Run `git status --porcelain` again. If it changed, find the command that wrote, make it `manual` or give it `{files}`, and show the user the changed files. Don't revert them yourself.

## Failure triage

Read each `failure_tail`.

| Cause | Signs | Action |
|---|---|---|
| Wrong command | unknown script or target, wrong `cwd`, bad flag, no files matched | fix `run` or `cwd` from the facts; re-prove that key |
| Missing environment | service unreachable, env var or file missing, dependencies not installed, tool not on PATH | keep `unverified`; set `requires`; tell the user what would make it pass. Offer to run `commands.setup` when only dependencies are missing |
| Existing violations | ran as intended and reports real problems in the code | keep `unverified`; `evidence` says "existing violations"; baseline it |
| Flaky or slow | passes on a rerun, or timed out | rerun once; raise `timeout_s` after a timeout; note flakiness in `evidence` |

Never edit repo files, install tools or start services to make a command pass without the user's yes.
