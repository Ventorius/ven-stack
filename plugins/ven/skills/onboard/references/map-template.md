# map.md template

Write to `$(ven-profile path)/map.md`. The SessionStart hook injects it into every session, in place of what a `CLAUDE.md` would hold. At most 100 lines: pointers, not prose. Leave out any section with nothing in it.

````markdown
# <repo name>

<One line: what the repo is, from its README or manifest.> State directory: `<state dir>` (never committed).

## Workspaces

- `<path>` <name> (<app | lib | tool>): <one line>

## Commands

Run with `ven-profile run <key>`; never type them from memory.

| Key | Status | Needs |
|---|---|---|
| `commands.<key>` | <verified | unverified: reason | manual> | <requires, or -> |

## Prove a change

`ven-profile verify <key>`; recipes in `<state dir>/verify.md`.

- <change type> → `<commands.key>`

## Risk areas

- `<glob>`: <why>

## Boundaries

- `<from>` never imports `<to>`: <why>

## Where things live

- Glossary: `<state dir>/GLOSSARY.md` (<n> terms)
- Solutions: `<state dir>/solutions/`; ADRs: `<state dir>/adr/`; diagrams: `<state dir>/diagrams/`
- Baseline: `<state dir>/baseline/` (<date>, <sha>)
- Adapters: <verified capabilities, comma-separated; or "none">

## Packs

- Enabled: <name> (<tech | domain>) for <paths>
- Proposed: <name> (<tech | domain>): <evidence in one line>

## Entry points

- `/ven:do <task>`: route work through a playbook
- `/ven:help`: which skill fits
- `/ven:onboard --refresh`: after the stack or commands change
````

Rules:

- List every command key with its true status; an `unverified` row says why in a few words.
- No command text, no tool versions, no copied docs: the profile and verify.md hold those.
- Rewrite the whole file on each onboard or refresh; it is generated, not hand-edited.
