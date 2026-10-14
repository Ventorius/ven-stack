# Detect briefs

One `ven:ven-worker` per signal source. A brief is the shared preamble with its placeholders filled, followed by one source block. `<files>` comes from `ven-profile detect` (`signals.<source>`); `<root>` is its `root`.

## Shared preamble

```text
Read-only detection brief. Do not create, edit or delete any file. Do not install anything.
Do not run builds, tests, servers, package managers or task runners. The only commands you may
run are the ones this brief lists, plus: git ls-files, git log, git show, grep, wc, head, sed -n, ls.
Never open real env or secret files (only example or sample env files). Report variable names, never values.

Repo root: <root>
Step: detect-<source>
Files to read: <files>

Report facts only, one per line, in exactly this shape:
FACT <key> | <value> | <path>:<line> | <quoted text, at most 100 chars>
A fact proven by a command's output cites it instead of a file: `cmd: <command>` in place of <path>:<line>.
Use the keys below; add another key only if it is a fact a repo profile would need.
A key you looked for and could not prove from a file or a command:
UNKNOWN <key> | <what you checked>
Never infer a value from a file name or from what a tool usually does. If two sources disagree, report both.

Check before reporting: reopen every <path>:<line> you cite and confirm the quoted text is on that line.
Your trailer uses step detect-<source>, decision "<n> facts, <n> unknown", evidence "citations rechecked".
```

## Source blocks

**manifests** (files: `signals.manifests` + `signals.lockfiles`)

```text
Keys, per manifest path:
- lang: the language or ecosystem the manifest belongs to
- pkg_manager: from the lockfile present and any package-manager or engines field
- dep: every direct dependency, runtime and dev, as "name version-spec" (at most 80; say if truncated)
- script: every script or task entry, as "name => exact command text"
- side_effect: a script that deploys, publishes, migrates or seeds a database, starts a long-running
  process, writes outside the repo or calls a network service; quote the line that shows it
- workspace_glob: workspace or member globs the manifest declares
- runtime: engine or runtime version constraints
```

**workspaces** (files: `signals.workspaces`, manifests below the root; `top_level_dirs`)

```text
Run: git ls-files | awk -F/ 'NF>2{print $1"/"$2}' | sort | uniq -c | sort -rn | head -40
Keys:
- workspace: "path | name | manifest path | script names it defines"
- depends_on: workspace A declares workspace B as a dependency (quote the line)
- entrypoint: a file that starts an app or CLI (entry or bin fields, a server start file a script runs)
- dir: top-level directory with its file count and dominant file extension
- generated: a directory that is generated, proven by an ignore entry or a "generated" header
```

**ci** (files: `signals.ci`)

```text
Keys:
- job: "job name | trigger"
- step: "job | exact command" for every run step, in order
- setup: install or toolchain steps, with versions and lockfile-strict flags as written
- service: services or containers a job starts (name, port)
- env_name: variable names jobs set or read (never values)
- timeout: per-job or per-step timeouts
```

**scripts** (files: `signals.scripts`)

```text
Keys:
- task: "file | task name | exact command | tasks it calls"
- side_effect: as for manifests, quoting the line
- help: a task's own description or comment, verbatim
```

**tests** (files: `signals.tests`)

```text
Run: git ls-files | grep -Ei '(^|/)(tests?|specs?|__tests__|e2e|integration)/|[._-](test|spec)s?\.[a-z0-9]+$|(^|/)test_[^/]+$' | head -300
and the same command with `| wc -l` in place of `| head -300`.
Keys:
- pattern: a glob covering a group of the listed test files, with its match count and two example paths
- layout: colocated (test beside its subject; cite both paths) or separate (a dedicated test tree)
- runner: the test runner, from its config file or the script that invokes it
- single_file: how the runner takes one file, from a script, config or doc (UNKNOWN if nothing in the repo shows it)
- kind: unit, integration or end-to-end split by directory or config, and what each needs
  (database, browser, running server, network), quoting the config line
- small_test: the 3 smallest test files by line count (`wc -l`), for proving single-file runs
- assertion: the assertion call forms in 3 sampled test files, with path:line
- marker: skip, focus/only and todo markers used in tests, with path:line and a grep count
```

**quality** (files: `signals.quality`)

```text
Keys:
- tool: "linter | formatter | type checker", with its config path and the files or globs it covers
- boundary_rule: any configured import or dependency restriction, with from and to as written
- directive: each tool's inline disable or ignore directive as it appears in the repo, with a
  `grep -rn` count and two examples (UNKNOWN if none appear)
- format_scope: the file types the formatter handles, from its config or ignore file
```

**runtime** (files: `signals.runtime`)

```text
Keys:
- version: toolchain versions from version files
- service: services in container or compose files (name, port, what depends on it)
- env_name: variable names from example env files (never values)
- env_file: env files the repo expects but ignores; confirm each with `git check-ignore -v <path>`
  and `ls <path>` (existence only; do not open it)
- worktree_include: entries of an existing .worktreeinclude
```

**agent_docs** (files: `signals.agent_docs`, plus README files at the root)

```text
Keys:
- doc_command: a command the docs tell people or agents to run, with its stated purpose
- rule: a stated rule (never import X from Y, never touch Z, naming rules), quoted
- risk: anything described as fragile, critical, legacy, generated or owned by another team
- term: a domain term the docs define or use as a heading, with the definition text if given
- decision: each ADR's title and status
- claude_config: keys present in .claude settings files (never env values), names of project skills and agents
```

**git** (no files; commands only)

```text
Run each and report:
- git remote -v; git symbolic-ref --short refs/remotes/origin/HEAD  => remote host, default_branch
- git log --since='6 months ago' --name-only --format= | grep -v '^$' | sort | uniq -c | sort -rn | head -30
  => churn: "count | path"
- git log --since='6 months ago' -i -E --grep='^(fix|revert|hotfix)' --name-only --format= | grep -v '^$' | sort | uniq -c | sort -rn | head -15
  => fix_churn: "count | path"
- git log -60 --format=%s  => commit_style: the pattern, with 3 example subjects
- git log --since='6 months ago' --format=%s | grep -Eo '[A-Z][A-Z0-9]+-[0-9]+|#[0-9]+' | sort | uniq -c | sort -rn | head -5
  => ticket_ref: the reference style and its count
- git for-each-ref --sort=-committerdate --count=40 --format='%(refname:short)' refs/heads refs/remotes
  => branch_naming: the pattern, with 3 examples
- git ls-files | grep -Ei 'pull_request_template|merge_request_templates?/|(^|/)CODEOWNERS$'
  => pr_template path; owners: "path glob | owner" lines from an owners file
- git log --since='6 months ago' --format=%s | tr -cs 'A-Za-z' '\n' | tr 'A-Z' 'a-z' | sort | uniq -c | sort -rn | head -80
  => word: "count | word" (report all 80; do not filter)
```
