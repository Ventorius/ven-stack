# Synthesis

The reviewers were aggressive on purpose and saw only a diff and one paragraph of intent. They don't know what was tried and rejected, which code is temporary, or what the next change will cover. You do. Filter with that context.

## Merge

- Parse every report. Merge findings that describe one problem: the same mechanism at the same or connected `file:line`. Keep the list of lenses that raised it.
- Open the cited line of every Act on candidate and trace the path yourself. A finding you cannot reproduce from the code drops to Consider or Dismissed, with the reason.

## Rank

Sort by two keys, in order:

1. **Independent lenses.** A finding two or more lenses raised without seeing each other ranks above any single-lens finding.
2. **Proof.** Within the same lens count, a finding with a reproducing test that ran and failed outranks one that is only argued.

Security and correctness findings from a single lens get more scrutiny before you dismiss them, not less.

## Filter

- **Nitpick gravity.** A reviewer who finds nothing serious inflates nits. If a lens returned only nits, that lens passed. Say so.
- **Hypothetical or actual.** "What if this is empty" counts only if a caller can pass empty. Trace the call site; if validation upstream or the types prevent it, dismiss.
- **Preference.** "I would have done it differently" without a concrete failure of the current approach is Dismissed.
- **Premature abstraction.** An extraction with one caller and no second reason to change is Dismissed. Duplication beats the wrong abstraction.
- **Missing context.** Findings on code the diff didn't touch, or against a pattern the repo follows everywhere (check `conventions.md`), are Dismissed politely.

## Buckets

- **Act on.** Wrong or unsafe given the intent; it would block a real merge. More than five means you did not filter hard enough.
- **Consider.** Real, but the cost of fixing now may outweigh it. Name the trade-off.
- **Noted.** Valid, not actionable now: premature, low impact, or outside this change.
- **Dismissed.** Wrong, nitpicky, or missing context, each with a one-line reason. This list is how the user audits your judgment. Never drop it.
