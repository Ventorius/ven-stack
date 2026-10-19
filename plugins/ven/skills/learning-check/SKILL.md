---
name: learning-check
description: Close a playbook by reviewing the session for durable learnings and recording a solution entry, a correction, or an explicit none. Use as the last step of every playbook, before reporting the task done.
metadata:
  layer: L3
  source: garrytan/gstack@47d639a:scripts/resolvers/preamble/generate-completion-status.ts
  license: MIT
---

# Learning check

Every playbook ends here. The review runs every time, not only when something felt noteworthy, and it ends in exactly one of three outcomes. Silence is not an outcome.

## 1. Review the session

Scan the whole session, subagent results included, for:

- **Corrections.** The user said you were wrong, repeated an instruction, or undid your work. A hook blocked you and the block was right.
- **Solved problems.** A fix or decision whose reasoning the final code, tests and docs don't show.
- **Misfires.** A skill or playbook gave wrong guidance, fired when it shouldn't have, or stayed quiet when it should have fired.

Check what is already recorded: `ven-decisions list --limit 20`. Corrections this session are rows with `step=correction` (`ven-decisions list --step correction`); read them before scanning the transcript, and fall back to the transcript only when there are none. A correction already routed earlier in the session is cited, not routed twice.

## 2. Apply the bar

A finding is durable when losing it would make a future session repeat the mistake or redo the investigation. The test: if no record existed, would the next agent reading the final code still get this wrong?

Not durable:

- Obvious facts, and anything the final code, its tests or an existing solution entry already state.
- One-time transient errors: a flaky network call, a typo, a retried command.
- How long it took. Effort and diff size are not learnings.

A short session or a failed task is no reason to skip the review. Failed tasks often hold the best learnings.

## 3. Act

| Found | Do | `--decision` |
|---|---|---|
| A correction or a misfire | Run **correct**, once per rule | correct |
| A solved problem that passes the bar | Run **compound**, one entry per problem | compound |
| Nothing that passes the bar | Write the line below, verbatim | none |

The empty outcome is this exact line in your final message:

```text
No durable learnings this session
```

A session can produce several outcomes: a correction and a solved problem run both skills. Never fold several problems into one entry.

## 4. Record

This step is required: `ven-decisions end` refuses to close a playbook that has no `learning-check` row, whether you add one or skip it. Write one row per outcome:

```bash
ven-decisions add --step learning-check --decision <compound|correct|none> --evidence "<entry path, check or proposal path, or why nothing qualified>"
```

Evidence for `none` is one line naming why, for example "routine rename; the new tests state the rule".

## Report

End the task's final message with one line per outcome:

```text
Learning check: compound -> <entry path>
Learning check: correct -> <check or proposal path>
Learning check: No durable learnings this session
```
