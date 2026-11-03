---
name: setup
description: "Install or repair ven's command-line tools (ven-profile, ven-decisions, ven-doctor), set per-user model and budget settings, and migrate state an older ven left behind. Use when a ven-* command is not found, after installing or updating ven, or when ven-doctor or ven-profile context points here."
metadata:
  layer: L1
  license: MIT
---

# Setup

ven's skills call a few command-line tools that ship inside this skill, in `scripts/`. Setup puts them on the PATH, checks the install, and nothing more: there is no per-repo onboarding. A repo's profile fills in as work needs it.

## 1. Install the tools

Run the installer from this skill's directory:

```bash
node <this skill's directory>/scripts/install.mjs
```

It links each `ven-*` tool into `~/.ven/bin` (`VEN_HOME` moves `~/.ven`), repoints links left by another install, and removes links to tools that no longer exist. It is safe to rerun.

If it says the directory is not on PATH, show the user the `export PATH=...` line it printed and ask them to add it to their shell profile; never edit that file yourself. Until a new shell picks it up, call the tools by full path (`~/.ven/bin/ven-profile`).

## 2. Check the install

Run `ven-doctor`. Fix each ERROR before anything else; each finding names its fix. WARNs that matter now:

- tools not on PATH, or from another install: rerun step 1.
- state from an older ven version: run `ven-profile migrate` inside that repo. It moves the old session map aside and deletes hook state; profiles, glossary, solutions and decisions stay.

## 3. Settings

`ven-profile config` prints the per-user settings in `~/.ven/config.json`:

- `orchestrator_model`, `coder_model`, `swarm_model`: the model each delegated role runs on. `inherit` (the default) uses whatever model your agent runs. Set them only if your agent can pick a model per subagent, using its own model names: `ven-profile config swarm_model <name>`.
- `budget_tier`: `lean`, `standard` (default) or `max`. It sets effort and whether optional review panels run. A repo can pin its own with `ven-profile set budget_tier <tier>`.

Ask the user before changing a setting; show the current value first.

## 4. Report

Say what the installer changed, the doctor's remaining findings, and the settings in effect.
