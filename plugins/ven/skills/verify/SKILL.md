---
name: verify
description: "Prove a change works with the check that matches its type, do the read-back, and log the pass against the exact tree. Use when a change is ready to call done, before review, commit or stopping, and whenever the verify-gate blocks."
metadata:
  layer: L3
  source: cursor/plugins@main:pstack/skills/create-verification-skill/SKILL.md; obra/superpowers@main:skills/verification-before-completion/SKILL.md
  license: MIT
---

# Verify

A change is done when the check for its change type passed on the exact tree you hand over, and you read back the result yourself. Apply **prove-it-works**: "it compiles" is not proof, and neither is an earlier run, a partial run or an agent's DONE.

## 1. Name the change types

- List what changed: `git status --short` and `git diff --stat` against where the work started.
- Read `$(ven-profile path)/verify.md`. Each section is one change type: what counts as proof, its key, its preconditions, and what to read back. Map every changed file to a type.
- Files matching `ven-profile get docs_only` need no verify. Everything else does.
- `ven-profile get verify` maps each type to a command key.

## 2. Run the check

For each change type touched:

1. Check preconditions: `ven-profile get <key>` shows `requires` (a running server, a local file, a service). Missing one: say which, and don't count that type as proven.
2. Run `ven-profile verify <key>`. It runs the command and logs the exit code against the current working tree.
3. Read the whole output: the exit code, the failure and skip counts. A failure you didn't cause still gets reported, by name.

Any edit after a verify, a formatting fix included, changes the tree: verify again. The verify-gate hook blocks Stop, and SubagentStop for coders, until a pass is logged for the current tree.

## 3. Read back

A green command is half the proof. Do the read-back verify.md names for the type, through the path a user takes, and look at the actual result: the response, the stored data, the screen, the output. Evidence standards:

- Drive the real path, not internal setters or test-only entry points.
- Capture the action and the state it produced, side effects included, not just the final screen.
- Stand-ins only where production already isolates an outside system.
- A dry run or test mode: observe what it really skips; don't trust its name.
- A `manual` command (dev server, deploy) is never yours to run. Give the user the exact command and what to check, and wait for their answer.

Then re-read the ticket or spec's acceptance criteria and check each one against what you observed. A passing suite is not a met requirement.

## 4. Record and report

```bash
ven-decisions add --step verify --decision passed --evidence "<key> exit 0; read-back: <what you observed>"
```

A failure is recorded as `--decision failed` with the evidence, and reported plainly. Never soften a failed or partial result into a pass.

## No verify command for a change type

Say so. Never invent a command. Propose one from evidence in the repo (a script in a manifest, a CI job, an existing harness), naming the file that shows it. On the user's yes:

```bash
ven-profile set commands.<key> '<command leaf as JSON>'
ven-profile prove commands.<key>
ven-profile set verify.<change type> commands.<key>
```

Then add a section for the type to verify.md: proof, key, preconditions, read-back. Until the user agrees, report the change as unverified, with the reason.
