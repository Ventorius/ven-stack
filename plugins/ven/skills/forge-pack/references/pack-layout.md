# Pack layout, eval runner, registration, promotion

## Tree

```text
$(ven-profile path)/packs/<pack>/
├── pack.json                       name, version, owner, kind, applies_when, and the index of everything below
├── skills/<skill>/SKILL.md         read by the router when a task touches applies_when.paths
├── playbooks/<name>.md             listed by absolute path in the profile's packs[].playbooks
├── references/<library>.md         pack skills link them relatively: ../../references/<library>.md
├── adapters/<slug>.mjs             with <slug>.test.mjs and fixtures/<slug>/; <slug> is the capability with "." as "-"
├── rules/<id>/                     a rule ratchet placed: the rule file or check script, bad/ and good/ fixtures
├── scripts/eval.mjs                the eval runner below
└── evals/<case>/                   eval cases; runs write evals/results/
```

A pack is a plain directory. No agent harness registers it: `ven-profile packs-for <files>` returns each matching pack's skill files, and whoever works on those files reads them.

Kept out of the pack: `.ven/` (the runner's temporary copy of ven) and `evals/results/`; the template's `.gitignore` lists both for promoted packs.

## pack.json

| Key | Holds | Written by |
|---|---|---|
| `name`, `version`, `owner`, `description` | identity; every change bumps the patch `version` | forge-pack, then each forge skill |
| `kind` | `tech` or `domain` | forge-pack |
| `applies_when.paths` | globs where the pack's work happens | forge-pack; pack-audit narrows |
| `applies_when.deps` | dependency names from the manifests; `[]` for most domain packs | forge-pack |
| `skills[]` | `{name, evidence[], cases[], delta}` | forge-skill |
| `playbooks[]` | `{name, file, evidence[], cases[]}` | forge-playbook |
| `references[]` | `{file, library, version, lockfile}` | forge-reference |
| `adapters[]` | `{capability, script, test}` | forge-adapter |
| `rules[]` | `{id, rung, check, fixtures}`; a rung-4 rule's `check` is a command over `{files}` | ratchet, forge-convention |

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

Templates keep their eval cases under `cases/`, never `evals/`: the eval tool treats every directory named `evals/` as a suite, so a template there would load as a broken case. The copy into a pack goes under `evals/`.

## Eval runner

Evals run on the `claude` CLI (`claude plugin eval`). Without it, the forge stops at the eval step and reports the pack unproven; it is never registered unproven.

```bash
node <pack dir>/scripts/eval.mjs --ven "$(ven-profile root)" --runs 3 --max-cost-usd 15 [--case '<glob>'] [--allow-tools "Bash(ven-profile *)" "Bash(ven-decisions *)" Edit Write]
```

- `--ven` takes the directory holding ven's skills. A case may load only plugins inside the directory under test, so the runner copies those skills to `<pack dir>/.ven/skills/`, runs, and removes the copy. Pack cases list `plugins: ["../..", "../../.ven"]`; running the eval tool on the pack directly fails to load them.
- It always passes `--ablation none --scaffold --trust-plugin --no-publish`. Grant `--allow-tools` for every tool beyond read-only that a case lists; a case that needs ven's tools gets `"Bash(ven-profile *)"` and `"Bash(ven-decisions *)"`, a case that edits gets `Edit Write`, and plain `Bash` only when the task runs repo commands.
- Exit 0 means every case reached the threshold. Scores and cost: the newest `<pack dir>/evals/results/*/aggregate-result.json` (`cases[].aggregates.score`, `costUsd`).
- Runs start in an empty workspace. The case's `fixture.sh` builds the repo and writes its profile to `.ven-state/profile.json` (excluded in `.git/info/exclude`); the case's `env: { EVAL_VEN_STATE_DIR: ".ven-state" }` points ven there.
- The runner puts the copy's tools first on the PATH, which the runs inherit. Without the runner, `ven-profile` may be missing inside a run and the router never sees the pack's playbooks.
- Grade replies and files, the things the user would see.

## Register

1. **Profile.** Take the list from `ven-profile get packs` (unset means `[]`), append `{ "name": "<pack>", "kind", "applies_when", "skills": [<names>], "playbooks": [<absolute paths>], "checks": [<{id, run} per rung-4 rule>] }`, and write it back with `ven-profile set packs '<the whole list as JSON>'`. A pack outside `$(ven-profile path)/packs/<pack>/` also sets `"dir"`.
2. **Check.** `ven-profile packs-for <a file the pack covers>` lists the pack with its skill files; `ven-profile validate` passes.

## Promote

For a pack the user agreed to share across repos:

1. Ask for the path of their ven-stack checkout. Work on a branch there; never push without asking.
2. Copy `<pack dir>` to `<checkout>/packs/<pack>/`, leaving out `.ven/` and `evals/results/`.
3. Make it generic: replace repo-specific globs in `pack.json`; remove repo names, paths and glossary terms from skills, references and eval fixtures.
4. Run the runner from the copy with `--ven <checkout>/plugins/ven/skills`; every case at 1.00.
5. Commit with the result in the message, e.g. `Add <pack> pack (suite 14/14 at 3 runs)`.
6. In this repo, keep the local pack or point its profile entry's `dir` at the promoted copy; ask which.
