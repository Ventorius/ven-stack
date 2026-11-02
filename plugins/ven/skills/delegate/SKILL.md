---
name: delegate
description: "Hand a complete brief to a ven role (coder, worker, reviewer, verifier) as a subagent when your agent can spawn one, or as a separate pass you run yourself when it can't. Use when a ven skill says to delegate to a role, or a task splits into slices with nothing left to decide."
metadata:
  layer: L1
  license: MIT
---

# Delegate

A role is a brief template plus a model setting. The role decides how the work is done; your brief decides what.

| Role | For | Model setting | Brief template |
|---|---|---|---|
| coder | one ticket end to end, test-first, in its own worktree | `coder_model` | [references/coder.md](references/coder.md) |
| worker | one fully specified edit, one slice of a fan-out, or a read-only probe | `swarm_model` | [references/worker.md](references/worker.md) |
| reviewer | one review lens, blind to the other lenses | `coder_model`; `orchestrator_model` for the high-risk lens | [references/reviewer.md](references/reviewer.md) |
| verifier | checking citations and proof claims, read-only | `swarm_model` | [references/verifier.md](references/verifier.md) |

Read a setting with `ven-profile config <setting>`. `inherit` means your own model. The budget tier (`ven-profile config budget_tier`) sets effort where your agent supports it: `lean` low, `max` high, `standard` the default.

## 1. Write the brief

A brief drops to a role only when it is complete: inputs, exact files, the expected output shape, a check command from the profile, and the `playbook` and `step` for the result trailer. A brief that says "decide" or "figure out" stays with you.

Add the skills to load: the ones the calling skill names, and for each pack that `ven-profile packs-for <brief files>` returns, its `skills`.

Put the role's template first, then the brief.

## 2. Hand it off

**Your agent can spawn subagents:** spawn one per brief, independent briefs all at once. Pass the role's model unless it is `inherit`. A coder works in its own worktree: use your agent's worktree isolation, or `git worktree add` one for it and put the path in the brief. Run long briefs in the background when your agent allows it.

**It can't:** run each brief yourself, one at a time, as a separate pass. Before each pass, write down what you concluded so far, then work only from the brief. A reviewer pass reads the diff and its own lens, never another lens's findings. Write each pass's result in full before the next pass starts; synthesis comes after the last one.

## 3. Take the result

Every result ends with a `VEN-RESULT` trailer. Log it:

```bash
ven-decisions add --playbook <from the trailer> --step <step> --decision "<decision, or BLOCKED: question>" --evidence "<evidence>"
```

- `BLOCKED: <question>`: answer it from the spec or the code, or ask the user when the call is theirs, then continue the same subagent if your agent can, so it keeps its worktree and context. Never let a role guess.
- `DONE` is a claim. Read the diff and the artifact, and check its logged verify pass (`ven-decisions list`), before you merge or report it.
