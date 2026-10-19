---
name: correct
description: Turn a user's correction into the strongest lasting fix, a check when the mistake is checkable and a tested skill edit when it needs judgment. Use when the user corrects you, repeats an instruction or undoes your work, and when learning-check finds a correction.
metadata:
  layer: L3
  source: poteto/brainmaxxing@ec4d8e4:brain/principles/encode-lessons-in-structure.md
  license: MIT
---

# Correct

Every correction is a learning signal. Acknowledging is not recording: "I'll keep that in mind" does not reach the next session. Route each correction to the place that stops the next agent from repeating it. This skill routes; the skills it names do the work.

## 1. Fix the work first

Apply the correction to the task in front of you. Routing never replaces the fix.

## 2. Write the rule

State the correction as one rule an agent could follow without this conversation:

```text
<do X | never Y> when <situation>, because <why>
```

Quote the user's words as evidence. A rule you cannot write without naming this one task is a one-off: say so in one line, record it (step 4) and stop.

If the rule was already written down (a skill line, `map.md`) and the agent broke it anyway, text has failed once. Treat it as checkable if any check could catch it, even an expensive one.

## 3. Route it

Apply **encode-lessons-in-structure**: can a machine tell the wrong version from the right one? **ratchet** holds the ladder of checks, strongest first; do not restate it here.

| The rule | Route | Gate |
|---|---|---|
| Checkable: a type, a module boundary, a pattern a rule tool can match, something visible at edit time | **ratchet**, preferring its upper rungs | The check fails on the original mistake |
| Needs judgment: intent, context, taste | A proposal to edit the skill that should have prevented it | **skill-tdd**, in a later session |
| Repo knowledge, not a rule about how to work | **compound** | Its durable bar |

**Checkable.** Run **ratchet** now, in its own commit, when the check is small. When it is large or would derail the task, write it as a proposal of kind `check` and say so.

**Needs judgment.** Find the target:

- The skill or playbook that was in use when the mistake happened, or the one that should have fired and didn't (then the fix is its description).
- A rule that names this repo's tech or domain goes to a pack skill (`ven-profile get packs`). Core skills stay agnostic.

Write the smallest change that would have prevented the mistake as a proposal file in the format **skill-tdd** defines. Do not edit the skill in this session.

## 4. Count and record

The hook appends each user correction to the decisions log as `step=correction`. Count this class there first: `ven-decisions list --step correction`. Use transcripts (`ven-transcripts --kind corrections`) only when the log has nothing. Two independent instances meet the promotion rule in **encode-lessons-in-structure**; with one, route as above and note it is the first.


```bash
ven-decisions add --step correct --decision <ratchet|proposal|compound|one-off> --evidence "<check, proposal or entry path; or the quoted correction>"
```

## Reply

One short block per correction:

- **Rule:** the sentence from step 2.
- **Route:** the rung, proposal path or entry path.
- **Why not higher:** why no stronger rung could express it. Skip for rung 1.

## Anti-patterns

- Recording without routing: a note about a check that should exist is wasted until the check exists.
- Fixing the instance and leaving the pattern: the next agent copies the nearest example.
- Routing to skill text what a check could enforce. The instruction is the symptom.
