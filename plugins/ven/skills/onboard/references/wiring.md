# Wiring

Everything here stays local. The state directory (`ven-profile path`) sits outside the repo under the user's home, so the Read and Edit allow rules below pre-approve writes to it, including from background agents.

## adapters.json

`$(ven-profile path)/adapters.json` maps a capability to a command leaf (same shape as a profile command, `status: "unverified"` until proven). The command's stdout is the capability's output.

| Capability | Output | Usual source |
|---|---|---|
| `code.search` | `path:line:text` lines for `{pattern}` | `git grep -n -I -e {pattern}` works in any repo |
| `workspace.list` | workspaces as JSON | `ven-profile get workspaces`, when the profile has workspaces |
| `graph.imports` | `[{from,to}]` JSON or Mermaid | an import-graph tool already in the dependencies or config |
| `graph.boundaries` | violations as `[{from,to,rule}]` | the boundary tool behind a `boundary_rule` fact |
| `schema.read` | `{entities:[{name,fields,relations}]}` | the data layer's read-only schema introspection |
| `symbols.list` | `name kind line` for `{file}` | a symbol tool already present |
| `lint.custom` | exit 1 on violations | a linter with a custom rule set |
| `rules.structural` | exit 1 on violations | an AST-pattern rule tool already configured |

- Use only tools already in the repo (dependencies, config, task files) or on PATH (`command -v`). Leave a capability out when nothing provides it, and list it to the user as a gap that **forge-adapter** can fill later. Installing a tool needs explicit consent.
- An adapter that writes files or needs the network is `manual`.
- Prove one at a time with its arguments: `ven-profile prove-adapters code.search --var pattern=<a word that exists>`, `ven-profile prove-adapters symbols.list --file <path>`. Proving replaces `evidence`; put the source back in front as for commands.

## .claude/settings.local.json

The file lives at the main worktree root (first line of `git worktree list --porcelain`). From there, before any change:

1. `git ls-files --error-unmatch .claude/settings.local.json`: exit 0 means the team tracks it. Stop and ask; never edit a tracked file.
2. `git check-ignore -q .claude/settings.local.json`: a non-zero exit means git would see it. Plan to append `.claude/settings.local.json` to `$(git rev-parse --git-path info/exclude)` (local, never committed) and include that line in the diff you show.

Entries to merge:

```jsonc
{
  "worktree": { "baseRef": "head" },
  "permissions": {
    "allow": [
      "Bash(ven-profile:*)",
      "Bash(ven-decisions:*)",
      "Bash(<verified command prefix>:*)",
      "Read(//<state dir without its leading slash>/**)",
      "Edit(//<state dir without its leading slash>/**)"
    ]
  },
  "extraKnownMarketplaces": {
    "<marketplace name>": { "source": { "source": "directory", "path": "<state dir>/packs" } }
  }
}
```

- `<marketplace name>`: the `name` field of `$(ven-profile path)/packs/.claude-plugin/marketplace.json`, written by `ven-profile init`.
- Command prefixes: for each `verified` command, the text up to its first `{` placeholder or shell operator (`&&`, `||`, `;`, `|`), one rule per simple command. Nothing for `manual` or `unverified` commands. Never a bare shell, interpreter or anything else that runs arbitrary code from its arguments; keep the longer prefix instead.
- Paths: `//` followed by the absolute path is an absolute rule; a single leading `/` would anchor at the settings file. `Edit` rules cover every file-writing tool; a `Write(...)` path rule is never consulted, so don't add one.

Merge rules:

- No file yet: create it with exactly these keys.
- Add missing keys and missing array entries. Never remove, reorder or rewrite an existing entry.
- An existing key with a different value (for example `worktree.baseRef` set to `"fresh"`): show both values; the user decides.
- Show the full before and after diff, ask, and write only on yes. Then check it parses: `node -e 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))' <path>`.

## .worktreeinclude

New worktrees are fresh copies, so gitignored files the tests need (env files, local config) are missing there. `.worktreeinclude` (gitignore syntax, at the main worktree root) copies matching files that are gitignored into each new worktree.

1. Candidates: paths from `requires` and `env_file` facts that exist in the main worktree and are gitignored (`git check-ignore -v <path>`). None: skip this step.
2. Show the proposed lines. Ask: keep it local (recommended: write the file and add `.worktreeinclude` to `$(git rev-parse --git-path info/exclude)`), share it (write the file; the user commits it), or skip.
3. An existing `.worktreeinclude` is only appended to, after showing the diff. If it is tracked, adding lines is a team change: ask first.

## ven-doctor

Run `ven-doctor` from the repo root. It reports skill-name collisions between ven and the user's personal or project skills, and prints a suggested `skillOverrides` block. Show both. Per colliding skill the user picks `"off"` (hidden everywhere), `"name-only"` (listed without a description), `"user-invocable-only"` (hidden from the model, still in the `/` menu) or no change. Plugin skills can't be overridden this way; the user manages them through `/plugin`. Merge the choice with the rules above, then rerun `ven-doctor` until every remaining line is INFO or a choice the user made.
