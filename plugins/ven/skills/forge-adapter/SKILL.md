---
name: forge-adapter
description: "Write a capability adapter (import graph, boundaries, schema, search, symbols, workspaces, custom rules) as a script with a fixture test, register it in adapters.json and prove it. Use when a skill reports a missing or unproven adapter, or a pack needs a capability."
metadata:
  layer: L3
  source: cursor/plugins@1e5c90a:pstack/skills/create-verification-skill/SKILL.md
  license: MIT
---

# Forge an adapter

Visual and conventions skills ask for a capability with `ven-profile adapter <capability>`; the adapter is the repo-specific command behind it. An adapter that was never executed is a draft: it counts only once its fixture test and `ven-profile prove-adapters` both pass.

**Input:** a capability and the pack that will hold the script. The usual trigger is `ven-profile adapter <capability>` exiting 3 with "no adapter" or "prove it first". Here `<pack dir>` is `$(ven-profile path)/packs/<pack>/`, `<ven root>` is `${CLAUDE_PLUGIN_ROOT}`, and `<slug>` is the capability with `.` replaced by `-`.

## Capabilities

| Capability | Prints | Exits 1 when |
|---|---|---|
| `graph.imports` | module import edges, JSON `[{from,to}]` | never |
| `graph.boundaries` | boundary violations, JSON `[{from,to,rule}]` | never |
| `schema.read` | entities, JSON `{entities:[{name,fields,relations}]}` | never |
| `code.search` | `path:line:text` lines matching `{pattern}` | never |
| `symbols.list` | `name kind line` for the symbols in `{file}` | never |
| `workspace.list` | workspaces or containers, JSON | never |
| `lint.custom`, `rules.structural` | `path:line: rule: message` per violation | it finds a violation |

The template's `FORMAT` map prints these shapes; `collect()` only gathers the data.

## 1. Pick the source

Look before writing: `ven-profile adapters` (an unproven entry may only need a fix), the repo's dev dependencies and scripts, and tools on the PATH (`command -v <tool>`). Prefer, in order:

1. A tool the repo already has, wrapped so its output takes the capability's shape.
2. A script that reads the files itself, using only the runtime ven's own tools need.
3. A new tool, only with the user's consent. Ask with AskUserQuestion: what it is, where it installs, and the script you would write instead. Never install without a yes.

## 2. Fixture first

1. Build `<pack dir>/adapters/fixtures/<slug>/repo/`: the smallest copy of real repo files that exercises the capability, including one awkward case the repo really has.
2. Write `<pack dir>/adapters/fixtures/<slug>/expected.txt` by hand, from reading those files: the exact output, ending in a newline.
3. Copy `<ven root>/templates/adapter/adapter.test.mjs` to `<pack dir>/adapters/<slug>.test.mjs` and fill its placeholders.
4. `node --test <pack dir>/adapters/<slug>.test.mjs` fails: there is no script yet. That is the red run.

## 3. Write the script

Copy `<ven root>/templates/adapter/adapter.mjs` to `<pack dir>/adapters/<slug>.mjs` and write `collect()`:

- **Read-only:** it never writes to the repo and never calls the network.
- **Deterministic:** sorted output and repo-relative paths, so two runs diff clean.
- **Scoped:** it honors `--root` and takes its file list from `git ls-files`, so ignored and generated files stay out.
- **Baseline-aware:** a rule capability reports only violations missing from `$(ven-profile path)/baseline/<capability>.txt`, so today's tree exits 0.

Done when the fixture test passes.

## 4. Run it on the real repo

Run `node <pack dir>/adapters/<slug>.mjs --root=<repo root>` with the arguments a skill would pass. Check three entries against the files they name, and one fact you know must appear. A wrong entry is a missing fixture case: add it to the fixture (red), fix `collect()` (green), run again. Apply **prove-it-works**: the output you read is the proof, not the passing test alone.

## 5. Register and prove

1. Add the command under the capability in `$(ven-profile path)/adapters.json`, keeping only the flags the capability uses:

   ```json
   "<capability>": { "run": "node '<pack dir>/adapters/<slug>.mjs' --root=. --file={file} --pattern={pattern}", "status": "unverified", "cwd": ".", "timeout_s": 120, "evidence": "<pack dir>/adapters/<slug>.test.mjs" }
   ```

   Replacing an entry whose status is `verified` needs the user's yes.
2. Prove it with the arguments a skill would pass: `ven-profile prove-adapters <capability> --file <path>` (or `--var pattern=<a word that exists>`) prints `ok` and records the result under `proof`. A bare `ven-profile prove-adapters` must pass too; the template treats an unfilled `{file}` or `{pattern}` as absent.
3. `ven-profile adapter <capability>` with the same arguments prints what step 4 printed.
4. Add `{ "capability", "script": "adapters/<slug>.mjs", "test": "adapters/<slug>.test.mjs" }` to `adapters` in `<pack dir>/pack.json`, and bump the patch `version` in its `.claude-plugin/plugin.json`.

Then rerun the skill that asked for the capability.
