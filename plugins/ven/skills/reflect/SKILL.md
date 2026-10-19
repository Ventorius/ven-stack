---
name: reflect
description: Review a long session through independent lenses and propose edits to existing skills, packs or checks, applied only after they pass skill-tdd. Use at the end of a long or rocky session, or when the user asks to reflect on what the skills got wrong.
metadata:
  layer: L3
  source: cursor/plugins@main:pstack/skills/reflect/SKILL.md
  license: MIT
---

# Reflect

Mine this session for durable learnings about how the work was done, and turn each one into a concrete change to an existing skill, pack or check. Skip trivial sessions, and sessions where the skills were followed and worked. One-offs are not learnings.

Nothing is applied to a skill in this session. Skill edits become proposals that **skill-tdd** applies in a later session, so a skill never edits itself in the session that proposed the change.

## 1. Find the transcript

The transcript is the newest `*.jsonl` in `<config dir>/projects/<repo path with every non-alphanumeric character replaced by ->/`, where `<config dir>` is `$CLAUDE_CONFIG_DIR` or `~/.claude`. Confirm it by matching its first user message to this session's opening request. Stay in this repo's project directory; never read other projects' transcripts.

No match: write a digest instead (the requests, corrections, skills used, hook blocks, outcomes).

Count corrections from the decisions log first: `ven-decisions list --step correction` shows what the user objected to this session and earlier. The transcript is the fallback and the source for everything else.

## 2. Run three blind lenses

Spawn three `ven:ven-reviewer` agents in one message, each with the brief in `references/lenses.md` (shared part plus its lens) and the transcript path or digest:

| Lens | Looks for | `model` |
|---|---|---|
| judgment | The durable principle behind an incident | `${user_config.orchestrator_model}` |
| tooling | Commands, paths and context the agent rediscovered or the user had to hand over | `${user_config.coder_model}` |
| divergent | What the other two miss: second-order effects, skipped proof, skills that never fired | `${user_config.orchestrator_model}` |

Reviewers never see each other's output. On the `lean` budget tier, run the judgment lens only.

## 3. Synthesize

Judge every finding yourself against these tests, in order:

1. **Structural.** If a check could enforce it, route it to **ratchet** instead of skill text (apply **encode-lessons-in-structure**, which also sets the promotion threshold).
2. **Durable.** Still true after paths, versions and code shapes change.
3. **Decision-changing.** A future agent acts differently, not just reads more.
4. **Used.** The target skill ran in this session, or should have fired and didn't (then the change is to its description).
5. **Not already covered.** Read the target skill. Already said clearly: the failure was execution, reject it. Said weakly or buried: propose moving or sharpening that line, not adding another.
6. **Convergent.** A finding from two lenses ranks highest; a singleton must clear every test on its own.
7. **Agnostic.** Tech, vendor or domain specifics go to a pack skill, never to core.

A finding about the repo rather than about how to work goes to **compound**.

## 4. Present and propose

Show the result and wait for the user to pick rows:

```markdown
## Accepted
| Problem | Proposed change | Target (skill and section, or description) |
## Checks
| Rule | Rung | Original mistake it must catch |
## Rejected
- <finding> — <structural | durability | decision-changing | not used | already covered | one-off>
```

For each picked Accepted row, write a proposal file in the format **skill-tdd** defines. For each picked Checks row, run **ratchet** now (a check is not a skill edit) or queue it as a proposal of kind `check`.

## 5. Summarize

- Proposals written: path and one line each.
- Checks: added (with path) or queued.
- Solution entries written.
- Dropped: one line each, with the reason.

```bash
ven-decisions add --step reflect --decision "<n> proposals, <n> checks, <n> dropped" --evidence "<proposal paths>"
```
