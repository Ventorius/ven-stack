---
name: citation-check
description: "Check every file and line citation behind a hybrid diagram or a list of claims with parallel ven-verifiers, then badge the result. Use before saving or committing a hybrid diagram, or when claims about code cite lines that need independent checking."
metadata:
  layer: L3
---

# Citation check

A hybrid diagram is only as true as its citations. An edge passes when the cited line says what the edge claims. Nothing less counts.

## 1. Extract the claims

From the diagram (or list), build a numbered claim table:

| id | claim, in words | citation |
|---|---|---|
| E1 | the scheduler hands the report id to the renderer | `path/to/scheduler:42` |

- One row per edge or claim. A citation is `path:line` or `path:start-end`.
- An edge with no citation is **uncited**. It fails without being checked.
- Pin what you check against: `git rev-parse HEAD`, plus whether the tree has uncommitted changes. Citations are read from this working tree.

## 2. Batch and send

- Split the cited claims into batches of about ten, grouped by file so each verifier reads a file once.
- Spawn one `ven:ven-verifier` per batch, all in one message: `model: ${user_config.swarm_model}`, `run_in_background: true`; pass `effort: low` when `${user_config.budget_tier}` is `lean`.
- Each brief holds: the commit, the batch's rows, the rule in section 3, and the output shape: one line per claim, `pass | fail | unverifiable`, the id, the cited text quoted, and for a fail what the line actually says.

## 3. The rule (for the verifier)

- Open the file at the cited lines. The claim passes only if those lines themselves show it: the call, the write, the transition, the condition.
- These fail: the evidence sits on neighboring lines, only a comment or a name suggests it, or it is "somewhere in the file".
- A line that moved fails. Report where the evidence lives now; don't correct the citation silently.
- A file or line that doesn't exist fails. A claim you cannot check (unreadable file, ambiguous claim) is `unverifiable`, with the reason.
- Read only. Never edit.

## 4. Aggregate

- Every claim needs a verdict. Missing verdicts: respawn that batch once. A second miss makes those claims unverifiable.
- `unverifiable` counts as a failure for the badge.
- `n` is the edges that passed, `total` is every edge, uncited ones included. The caption is `HYBRID (n/total edges cited)`.

## 5. Result

- **All pass** (`n = total`): the diagram may be saved as committed quality in `$(ven-profile path)/diagrams/`, captioned `HYBRID (n/n edges cited)` with the commit.
- **Anything less**: it cannot be saved as committed quality. Either:
  - **fix**: correct the citation, redraw the edge, or remove it, then re-check the changed edges (all of them if the code changed since); or
  - **mark**: keep it as a draft with failed and uncited edges drawn dashed and labelled `?`, captioned with the real count, such as `HYBRID (7/9 edges cited)`.
- Never round the count up. List each failure with what the cited line really says.

Record: `ven-decisions add --step citation-check --decision "<n>/<total> edges cited" --evidence "<commit>; failed: <ids or none>"`.
