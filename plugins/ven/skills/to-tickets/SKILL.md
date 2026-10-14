---
name: to-tickets
description: "Slice a spec into vertical tickets, each a complete brief a coder can finish without asking anything, with dependencies and file overlaps marked. Use after to-spec, when the user asks for tickets, or before handing work to ven-coder agents."
metadata:
  layer: L3
  source: mattpocock/skills@main:skills/engineering/to-tickets/SKILL.md
  license: MIT
---

# To tickets

Break a spec into **tickets**: thin vertical slices, each a brief that `ven:ven-coder` can run end to end without asking anything.

## 1. Gather

- Read the spec: `$(ven-profile path)/specs/<slug>.md`, or the tracker item it points to (body and comments). Without a spec, work from the conversation, and run **to-spec** first if decisions are scattered.
- Read the glossary and ADRs for the area. Titles and goals use glossary terms.
- Read the code each slice will touch. You need real file paths for scope and overlap.
- Look for prefactoring: make the change easy, then make the easy change. Prefactor tickets come first.

## 2. Slice

Apply **sequence-verifiable-units**. Each ticket:

- cuts a narrow but complete path through every layer the feature crosses, never one layer on its own;
- is verifiable on its own with a key from `ven-profile get verify`;
- fits one fresh context window;
- leaves nothing to decide. A brief that would say "decide" or "figure out" isn't ready: settle the point with the user first.

**Wide refactors use expand–contract instead.** When one mechanical change (a rename, a retyped shared symbol) breaks call sites across the codebase at once, no vertical slice can land green. Expand: add the new form beside the old. Migrate: move callers in batches sized by blast radius (per package or directory), one ticket per batch, each blocked by the expand, each green because the old form still exists. Contract: delete the old form in a ticket blocked by every batch. Mechanical batches are good candidates for **sweep**.

## 3. Mark dependencies and overlaps

- **Blocked by:** the tickets that must finish first. None means it can start now.
- **Overlaps:** the tickets whose file sets intersect this one's, and the shared files.
- Only tickets with no blocker between them and disjoint file sets may run in parallel. Overlapping tickets run one after another; give them an order.

## 4. Quiz the user

Show a numbered list: title, blocked by, overlaps, what it delivers. Ask (AskUserQuestion when available): is the granularity right, are the blocking edges real, should any ticket merge or split? Iterate until the user approves.

## 5. Publish

Read `ven-profile get repo.tracker`.

- `repo.tracker.how` is `none` or missing: write one file per ticket, `$(ven-profile path)/tickets/<slug>/NN-<title>.md`, numbered from `01` in dependency order, `<title>` in kebab-case. Never one combined file.
- A tracker is configured: ask before creating anything. On yes, create one item per ticket in dependency order, following `repo.tracker.how`, using its native blocking links where it has them. Never close or edit the parent item.

Record: `ven-decisions add --step to-tickets --decision "<n> tickets, <p> parallel at start" --evidence "<directory or tracker references>"`.

## Ticket template

```markdown
# NN: <title>

**Goal:** the behavior this ticket makes work, end to end, from the user's side.
**Blocked by:** NN, NN | None
**Overlaps:** NN (shared: <paths>) | None
**Status:** ready

## Acceptance criteria
- [ ] <observable behavior, checkable by a test or a read-back>

## Scope
- In scope: <modules and files the coder may change>
- Seams to test at: <public interfaces from the spec's testing decisions>
- Out of scope: <what to leave alone, even if tempting>

## Proof
- `ven-profile verify <command key>` (verify.<change type>), then the read-back in verify.md for that type.
```

File paths belong in tickets (the coder needs them, and overlaps are computed from them); code snippets don't, except a decision-rich one from a prototype.

## Working the tickets

The **frontier** is every ticket whose blockers are done. Start the frontier tickets whose file sets are disjoint; hold the rest until their overlap partner finishes.
