# Pack layout, eval runner, registration, promotion

## Tree

```text
$(ven-profile path)/packs/
├── .claude-plugin/marketplace.json     the local marketplace; `ven-profile init` creates it, name ven-local-<repo>
└── <pack>/                             plugin <repo>-<pack>
    ├── .claude-plugin/plugin.json      name, version, description, author; the only home of version and owner
    ├── pack.json                       kind, applies_when, and the index of everything below
    ├── skills/<skill>/SKILL.md         paths: copied from applies_when.paths
    ├── playbooks/<name>.md             listed by absolute path in the profile's packs[].playbooks
    ├── references/<library>.md         pack skills link them through the pack's own ${CLAUDE_PLUGIN_ROOT}
    ├── adapters/<slug>.mjs             with <slug>.test.mjs and fixtures/<slug>/; <slug> is the capability with "." as "-"
    ├── rules/<id>/                     a rule ratchet placed: the rule file, bad/ and good/ fixtures
    ├── hooks/hooks.json                rung-4 checks: "command": "node", "args": ["${CLAUDE_PLUGIN_ROOT}/rules/<id>/hook.mjs"]
    ├── scripts/eval.mjs                the eval runner below
    └── evals/<case>/                   claude plugin eval cases; runs write evals/results/
```

Kept out of the pack: `.ven/` (the runner's temporary copy of ven) and `evals/results/`; the template's `.gitignore` lists both for promoted packs.

## pack.json

| Key | Holds | Written by |
|---|---|---|
| `kind` | `tech` or `domain` | forge-pack |
| `applies_when.paths` | globs where the pack's work happens | forge-pack; pack-audit narrows |
| `applies_when.deps` | dependency names from the manifests; `[]` for most domain packs | forge-pack |
| `skills[]` | `{name, evidence[], cases[], delta}` | forge-skill |
| `playbooks[]` | `{name, file, evidence[], cases[]}` | forge-playbook |
| `references[]` | `{file, library, version, lockfile}` | forge-reference |
| `adapters[]` | `{capability, script, test}` | forge-adapter |
| `rules[]` | `{id, rung, check, fixtures}` | ratchet, forge-convention |

Every change to the pack bumps the patch `version` in `.claude-plugin/plugin.json`.

## Placeholders

| Placeholder | Value |
|---|---|
| `{{pack}}` | the pack id |
| `{{repo}}` | `ven-profile get repo.name` in kebab-case |
| `{{kind}}` | `tech` or `domain` |
| `{{owner}}` | the person or team who approves changes to the pack; ask if unknown |
| `{{one line on what the pack makes the agent get right}}` | from the approved plan |
| `{{glob where the pack's work happens}}`, `{{dependency name from a manifest}}` | one list item each; repeat as needed |
| the prompt in `evals/stays-quiet/prompt.md` | a request from this repo unrelated to the pack |

Templates keep their eval cases under `cases/`, never `evals/`: `claude plugin eval` treats every directory named `evals/` inside a plugin as a suite, so a template there would load as a broken case in ven's own suite and in every pack run. The copy into a pack goes under `evals/`.

## Eval runner

```bash
node <pack dir>/scripts/eval.mjs --ven <ven root> --runs 3 --max-cost-usd 15 [--case '<glob>'] [--allow-tools "Bash(ven-profile *)" "Bash(ven-decisions *)" Edit Write]
```

- `<ven root>` is the absolute path SKILL.md gives for ven's root; this file is read raw, so no variable here is filled in.
- A case may load only plugins inside the directory under test, so the runner copies ven to `<pack dir>/.ven/` (without ven's own cases), runs, and removes the copy. Pack cases list `plugins: ["../..", "../../.ven"]`; running `claude plugin eval` on the pack directly fails to load them.
- It always passes `--ablation none --scaffold --trust-plugin --no-publish`. Grant `--allow-tools` for every tool beyond read-only that a case lists; a case that needs ven's tools gets `"Bash(ven-profile *)"` and `"Bash(ven-decisions *)"`, a case that edits gets `Edit Write`, and plain `Bash` only when the task runs repo commands.
- Exit 0 means every case reached the threshold. Scores and cost: the newest `<pack dir>/evals/results/*/aggregate-result.json` (`cases[].aggregates.score`, `costUsd`).
- Runs start in an empty workspace. The case's `fixture.sh` builds the repo and writes its profile to `.ven-state/profile.json` (excluded in `.git/info/exclude`); the case's `env: { EVAL_VEN_STATE_DIR: ".ven-state" }` points ven there.
- Eval runs don't put a plugin's `bin/` on the PATH; the runner prepends the copy's `bin/`, which the runs inherit. Without the runner, `ven-profile` is "command not found" inside a run and the router never sees the pack's playbooks.
- Grade replies and files, the things the user would see.

## Register

1. **Marketplace entry.** Append `{ "name": "<repo>-<pack>", "source": "./<pack>", "description": "<the plugin.json description>" }` to `plugins` in `$(ven-profile path)/packs/.claude-plugin/marketplace.json`. Then `claude plugin validate $(ven-profile path)/packs` passes.
2. **Profile.** Take the list from `ven-profile get packs` (unset means `[]`), append `{ "name": "<pack>", "kind", "plugin": "<repo>-<pack>@<marketplace name>", "applies_when", "skills": [<names>], "playbooks": [<absolute paths>] }`, and write it back with `ven-profile set packs '<the whole list as JSON>'`. Check with `ven-profile packs-for <a file the pack covers>`.
3. **Enable locally**, from the main worktree root (first line of `git worktree list --porcelain`), where onboarding keeps `.claude/settings.local.json`. `claude plugin marketplace list` must show the marketplace onboarding registered; if it doesn't, `claude plugin marketplace add "$(ven-profile path)/packs" --scope local`. Then `claude plugin marketplace update <marketplace name>` and `claude plugin install <repo>-<pack>@<marketplace name> --scope local`, which records it under `enabledPlugins` in `.claude/settings.local.json`. A directory marketplace loads the pack in place, so later edits need only `/reload-plugins`.

## Promote

For a pack the user agreed to share across repos:

1. Ask for the path of their ven-stack checkout. Work on a branch there; never push without asking.
2. Copy `<pack dir>` to `<checkout>/packs/<pack>/`, leaving out `.ven/` and `evals/results/`.
3. Make it generic: plugin `name` becomes `<pack>`; add `"dependencies": ["ven"]` to `plugin.json` (it resolves inside the same marketplace); replace repo-specific globs in `pack.json` and every skill's `paths:` with generic ones; remove repo names, paths and glossary terms from skills, references and eval fixtures.
4. Append `{ "name": "<pack>", "source": "./packs/<pack>", "description": "..." }` to `<checkout>/.claude-plugin/marketplace.json`; `claude plugin validate <checkout>` passes.
5. Run the runner from the copy with `--ven <checkout>/plugins/ven`; every case at 1.00.
6. Commit with the result in the message, e.g. `Add <pack> pack (suite 14/14 at 3 runs)`.
7. In this repo, keep the local pack or disable it in favor of the promoted one; ask which.
