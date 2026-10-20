---
name: roadmap
description: "Map a long effort as an index of decision tickets, settled one per session, and never build from it. Use when planning an effort that spans several sessions and whose route is unclear, when resolving a decision ticket, or when a roadmap exists for the area."
metadata:
  layer: L3
  source: aihero.dev/skills-wayfinder (design only)
  license: MIT
---

# Roadmap

A **roadmap** maps an effort whose route is unclear. It is an index of **decision tickets**: questions, not build slices. Each session settles one question and records the answer. The roadmap plans. It never builds.

**Never edit a file inside the repo.** Roadmap files, glossary entries and scratch prototypes live outside it. If the user asks to "just start coding", propose resolving the next open decision ticket instead.

"Ticket" alone still means a **to-tickets** build slice. Say "decision ticket" here.

## Storage

Read `ven-profile get repo.tracker`.

- `repo.tracker.how` is `none` or missing: keep files in `$(ven-profile path)/roadmaps/<slug>/`. One `roadmap.md`, plus one `NN-<type>-<title>.md` per decision ticket, numbered from `01`, `<title>` in kebab-case.
- A tracker is configured: show the user the roadmap and ask before publishing anything. On yes, publish following `repo.tracker.how`, use its native blocking links for **Blocked by** and its assignment as the claim, and leave a local pointer file in the same directory.

## Roadmap template

```markdown
# Roadmap: <title>

## Destination
<one or two sentences: what is true when the effort is done>

## Decisions so far
- <one line> ([NN](NN-<type>-<title>.md))

## Not yet specified
- <fog: something we must decide but cannot yet phrase as a question>

## Out of scope
- <what this effort will not do>

## Notes
```

## Decision-ticket template

```markdown
# NN: <type>: <title>

**Type:** grilling | prototype | research | task
**Blocked by:** NN, NN | None
**Claimed by:** <branch> | none
**Status:** open | closed | superseded

## Question
<one question, answerable in one session>

## Resolution
<the answer, with the reasoning and sources a later reader needs>

## Superseded by
<NN | none>
```

## The four types

| Type | Resolved | By |
|---|---|---|
| grilling | with the user | **grilling** |
| prototype | with the user | **prototype**, in a scratch directory outside the repo |
| research | unattended | a read-only `ven:ven-worker` brief that returns cited facts |
| task | with the user | the user does the manual step; the ticket records the result |

For research, fetch external facts from the web and cite each source. Look up facts in the repo with **how** and **why**. Brief the worker with the question, where to look, and "return facts, each with a source".

## Charting

1. Name the destination first. Every decision ticket is measured against it.
2. Run a breadth-first opening grill (**grilling**, wide and shallow). Sort what you learn into four piles: decisions so far, ticket-ready questions, fog, out of scope.
3. No fog: say the effort is small enough for the feature playbook, and stop. A roadmap would be upkeep for nothing.
4. An existing **handoff** note can seed the destination and the piles.
5. Write the roadmap and one file per ticket-ready question. Mark each **Blocked by** honestly.

## Working a session

- **Frontier** = open, every blocker closed, unclaimed.
- Claim before working: write your branch into **Claimed by**. Release it when the ticket closes or the session pauses.
- One grilling, prototype or task ticket per session. Ready research tickets may fan out in parallel in the same session.

## Closing a ticket

1. Write the **Resolution** and set **Status** to `closed`.
2. Add one line to **Decisions so far**, linking the ticket.
3. Graduate fog: each item that is now specific enough becomes a new decision ticket and leaves **Not yet specified**.
4. Release the claim.

## Reopening

Only on the user's explicit word. Never quietly design around a closed decision.

1. Set the old ticket to `superseded` and fill **Superseded by** with the new number.
2. Open the new ticket, blocked by whatever blocked the old one.
3. Under **Notes**, flag every closed ticket whose resolution cites the old one, for review.

## Cleared

No open ticket and empty fog: the roadmap is cleared. Say so, and say: run the feature playbook; **to-spec** reads this roadmap and its closed tickets.
