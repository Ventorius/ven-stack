---
name: to-spec
description: "Turn a settled design into a written spec, saved in the state directory or the repo's tracker. Use after grilling, when the user asks for a spec or requirements doc, or before slicing work into tickets."
metadata:
  layer: L3
  source: mattpocock/skills@49dd158:skills/engineering/to-spec/SKILL.md
  license: MIT
---

# To spec

Synthesize what has already been decided into a spec. Don't interview the user. If a decision the spec needs is still open, stop and run **grilling** on that branch only.

## Process

1. **Read the area.** The conversation, the code the change touches, `$(ven-profile path)/GLOSSARY.md` and the ADRs in `$(ven-profile path)/adr/`. When `$(ven-profile path)/roadmaps/<slug>/` exists, read its roadmap and closed decision tickets; their decisions count as settled. Use glossary terms throughout; respect the ADRs.
2. **Sketch the test seams.** Prefer seams that already exist, as high as possible, and as few as possible; one is ideal. Name the public interface each seam sits on (apply **deep-modules** for the vocabulary). Confirm the seams with the user before writing.
3. **Map proof.** Name the change types the feature touches and the key that proves each: `ven-profile get verify`. A change type with no key goes under Further notes as an open proof gap.
4. **Write the spec** with the template below. Pick a short kebab-case `<slug>` from the title; tickets reuse it.
5. **Publish.** Read `ven-profile get repo.tracker`.
   - `repo.tracker.how` is `none` or missing: write `$(ven-profile path)/specs/<slug>.md`.
   - A tracker is configured: show the user the spec and ask before creating anything there. On yes, publish it following `repo.tracker.how`, then write `$(ven-profile path)/specs/<slug>.md` containing only the tracker reference, so later steps find it.
6. **Record:** `ven-decisions add --step to-spec --decision "spec written" --evidence "<path or tracker reference>"`.

## Template

```markdown
# <Title>

## Problem
The problem from the user's point of view.

## Solution
The solution from the user's point of view.

## User stories
1. As a <actor>, I want <capability>, so that <benefit>.
(A long, numbered list that covers every aspect of the feature, edge cases included.)

## Implementation decisions
- Modules built or changed, and the interfaces that change.
- Data shape changes, contracts between modules, notable interactions.
- Architectural choices and the reason for each.

## Testing decisions
- The seams, and what each one catches.
- Which modules get tests; prior tests in the repo to follow.
- A good test checks external behavior only.

## Proof
- <change type>: `ven-profile verify <command key>`; read-back: <what verify.md says to check>.

## Out of scope
What this spec deliberately leaves out.

## Further notes
Open proof gaps, risks, anything else a reader needs.
```

## Rules

- No file paths or code in the spec; they go stale. The exception is a snippet from a prototype that pins a decision more precisely than prose (a state machine, a data shape). Inline only the decision-rich part and say it came from a prototype.
- Example stories use neutral nouns: "As a report owner, I want to schedule a report, so that it arrives without a manual step."
- The spec states decisions; it doesn't make new ones. Anything you had to decide while writing goes back to the user.
