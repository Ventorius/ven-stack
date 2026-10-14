---
name: diagram-hypotheses
description: Draw a debug tree for a reproduced bug (symptom, ranked falsifiable causes, the evidence that would falsify each, a status per cause) and keep it current as probes run. Use when debugging, after the bug reproduces and before testing any theory.
metadata:
  layer: L3
  source: mattpocock/skills@main:skills/engineering/diagnosing-bugs/SKILL.md; obra/superpowers@main:skills/systematic-debugging/SKILL.md
  license: MIT
---

# Diagram hypotheses

A map of what might be wrong and how you will find out, drawn before you test anything. It is model-drawn by design, so its badge is always `HYPOTHESIS`. Trust comes from the evidence written into its nodes.

## Before you draw

You need the user's exact symptom and one command that goes red on it, already run. Without that command, get it first: theorizing before the bug reproduces is the failure this tree exists to prevent.

## 1. Write 3 to 5 hypotheses

- Write them all before testing any. A single hypothesis anchors on the first plausible idea.
- Each one is falsifiable. Its prediction reads: "If <cause>, then <changing Y> makes the symptom disappear" (or worse, or move). If you can't state the prediction, the hypothesis is a vibe: sharpen it or drop it.
- Rank by likelihood, then by how cheap the probe is. Prefer causes near where the bad value first appears over causes where it surfaces; apply **fix-root-causes**.

## 2. Draw the tree

Symptom, then hypotheses, then the probe that would falsify each, then its status.

```mermaid
flowchart TD
  S["symptom: report total is one row short at month end"]
  S --> H1["H1 · range end is exclusive"]
  S --> H2["H2 · zone shift moves the last row"]
  S --> H3["H3 · cache serves last month's rows"]
  H1 --> P1["probe: make the end inclusive → repro green?"]
  H2 --> P2["probe: pin the zone to UTC → repro green?<br/>result: still red, repro exit 1"]
  H3 --> P3["probe: bypass the cache → repro green?"]
  classDef open stroke:#757575
  classDef falsified stroke:#9e9e9e,stroke-dasharray:4 3,color:#9e9e9e
  classDef supported stroke:#f9a825,stroke-width:2px
  classDef confirmed stroke:#2e7d32,stroke-width:3px
  class H1,H3 open
  class H2 falsified
```

- **open:** not probed yet.
- **falsified:** the probe ran and the prediction failed.
- **supported:** the symptom moved as predicted, but the cause isn't proven yet.
- **confirmed:** a change at that cause turns the repro green, and the original scenario passes too.

A probe node that has run holds its result and evidence: the command and its exit code, or a `file:line`.

## 3. Show, then probe

- Show the ranked tree to the user before probing. They often re-rank it at once ("H3's area changed yesterday") or have ruled one out. If they're away, proceed with your ranking.
- One probe, one variable. A probe that doesn't confirm is reverted before the next; never stack changes.
- Redraw the tree after every probe with the new status and its evidence. Record it: `ven-decisions add --step diagram-hypotheses --decision "H2 falsified" --evidence "<command> exit 1"`.
- Every hypothesis falsified: your model of the system is wrong. Go back to the symptom and the repro, re-read with what the probes taught you, and write a fresh set. Say "I don't understand X" rather than guessing.

## Badge and saving

The badge stays `HYPOTHESIS` even after a cause is confirmed; the confirmation lives in that node's evidence. When the investigation spans sessions, save the tree per the badge protocol in **diagram-deps** as `hypotheses-<slug>`, so a handoff note can point to it.
