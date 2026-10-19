---
name: compound-refresh
description: Prune and merge the repo's solution entries, drop those whose files are gone, merge duplicates, promote lessons seen twice to checks, digest pending proposals and cap each area. Use weekly, on demand, or when surfaced solution entries look stale, duplicated or crowded.
metadata:
  layer: L3
  source: EveryInc/compound-engineering-plugin@7a68002:skills/ce-compound-refresh/SKILL.md
  license: MIT
---

# Compound refresh

Keep `$(ven-profile path)/solutions/` small and true. An entry the next agent can't trust is worse than no entry.

Entries live in the state directory, outside version control: a deleted entry is gone for good. Deleting anything still accurate needs the user's yes.

## 1. Scope

All `solutions/**/*.md`, or the areas or paths the user names. A scope that matches nothing is reported, never widened. Read every entry's frontmatter first and group by area. With many entries, start with the area that has the most entries or the most missing anchors.

## 2. Check each entry

- **Anchors.** Glob each `files:` entry against the current tree. For a missing path, look for a move: `git log --follow --name-status --oneline -- <old path>`.
- **Claims.** Read the lines the Solution cites. Does the code still do what the entry says?
- **Overlap.** Other entries with the same `root_cause` and overlapping `files:`, or matching symptoms.
- **Recurrence.** The same lesson in two entries, or an entry whose problem came back (a newer entry, or `ven-decisions list` shows the same failure again).

## 3. One outcome per entry

| Outcome | When | Action |
|---|---|---|
| Keep | Accurate and distinct | Nothing. No cosmetic edits. |
| Update | The lesson holds; anchors, names or citations drifted | Fix them in place; add `last_updated:` |
| Merge | Two entries share a root cause and overlapping files | Fold the unique content into the clearer entry; delete the other |
| Promote | The lesson meets the promotion rule in **encode-lessons-in-structure** | Run **ratchet**; once its check fails on the original mistake, cite the check under Prevention |
| Delete | Every anchor is gone and the concept no longer exists in the code, or a check now makes the mistake impossible | Ask first |

Judgment rules:

- Age alone is not staleness. An old entry that matches the code is a Keep.
- Missing files prove the code moved or went, not the problem. Search for the concept (symbol names, symptom text) before deleting; if it lives elsewhere, Update the anchors.
- An entry without `files:` is invalid: anchor it or delete it.
- A claim you cannot check is not false. Act only on contradiction.
- The Solution contradicts the code and you can't write the current answer from evidence: delete it with the user's yes and suggest **compound** the next time someone works in that area.
- Never change product code. Never edit a skill: an entry that contradicts a skill becomes a proposal in the format **skill-tdd** defines.

## 4. Cap each area

At most 20 entries per area. Over the cap, merge first. Then propose deleting the entries worth least: covered by a check, low severity, oldest. Ask before deleting.

## 5. Digest

List what is waiting on the user:
- Files in `$(ven-profile path)/proposals/` with `status: proposed`: path, kind, one-line summary.
- Correction classes at the promotion threshold with no check: cluster `ven-decisions list --step correction` by rule, and list each class with 2 or more independent sessions that no check or solution entry covers.

Put the digest first in the report. Run this skill weekly: schedule it with the `schedule` skill as a cron routine, or run it on demand.

## 6. Apply

- **With the user present:** apply Keep, Update and Merge directly. Batch every Delete and Promote into one AskUserQuestion, with the path and one line of evidence each.
- **Unattended** (a scheduled run, nobody to ask): apply Update and Merge only; list Delete and Promote under Recommended.

## Report

```text
Scope: <areas>   Entries: <n>
Kept <n> · Updated <n> · Merged <n> · Promoted <n> · Deleted <n>
<outcome> <entry path> — <one line of evidence>
Recommended:
<outcome> <entry path> — <evidence>
```

Record the run:

```bash
ven-decisions add --step compound-refresh --decision "<n> kept, <n> updated, <n> merged, <n> promoted, <n> deleted" --evidence "<scope>"
```
