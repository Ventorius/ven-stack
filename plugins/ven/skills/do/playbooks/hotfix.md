---
name: hotfix
description: "Production is broken right now and needs the smallest safe fix shipped fast, such as an outage, a failing deploy, or a live error spike. Root cause follows as its own ticket."
---

# Hotfix

review: own-read

Speed matters, but the fix still needs evidence. Make the smallest change that stops the damage; the root cause is a follow-up, not part of this fix.

1. **reproduce** (gate)
   Done: one command fails for the reported reason, recorded with `ven-decisions add --step reproduce --decision reproduced --evidence "<command> fails with <error>"`. Not reproducible locally: capture the evidence instead (log lines, request ids, timestamps, the failing deploy diff) and record `--decision evidence-only` with where it lives.
2. Minimal fix
   Done: the smallest change that removes the symptom, with no cleanup, refactor or extra behavior. A revert of the breaking change counts. Anything bigger is listed for step 6.
3. **verify**
   Done: the step 1 command passes (with evidence only, the evidence shows the symptom gone in the check the profile names), and the change type's verify key passes and is logged.
4. Own read of the diff
   Done: you read the whole diff against the evidence and recorded it with `ven-decisions add --step review`.
5. Ship, with one approval (gate)
   Done: the user approved once (AskUserQuestion) for the push and PR together, using the ship playbook's prepare and open steps, and the result was read back from the code host; or the user declined and has the commands.
6. Record the root cause ticket
   Done: a follow-up bug-fix ticket is written to `$(ven-profile path)/tickets/` (or offered for the tracker) with the evidence, what the hotfix left unfixed, and the cleanup it skipped.
7. **learning-check**
   Done: its result is stated in the reply; silence is not a result.

**Reply:** what was broken, the fix, the evidence it works, the approval taken, and the follow-up ticket path.
