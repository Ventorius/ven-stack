---
name: teach
description: Explain a subsystem diagram by diagram, from the system overview down to one call path, building each picture up one part at a time, then offer a quiz. Use for "teach me X", "help me really understand this subsystem", or onboarding someone onto an area of code.
metadata:
  layer: L3
  source: cursor/plugins@main:pstack/skills/teach/SKILL.md
  license: MIT
---

# Teach

The goal is that the person understands the subsystem well enough to work in it, not that anything changes. Build the picture from the outside in: where it sits, what it is made of, what it stores, how its main thing changes state, and one request through it. Every picture grows one part at a time.

## 1. Aim

- Read from the conversation why they're asking (about to change it, reviewing it, debugging it, new to it) and what they already know. Ask only when neither is clear.
- Pick the two or three things they should walk away understanding. Put the depth where their question is, and skip what they plainly know.

## 2. Ground

- Run **how** for how the subsystem works and **why** for why it is shaped this way, in parallel. Keep **why** narrow (git history plus a source or two) unless the reasons are the point. Use their findings; don't redo the digging.
- Keep the confidence words from **why** as they are. Its hedges are findings, not style.

## 3. The ladder

Climb from overview to one call path. Skip a rung that doesn't apply and say why in one line.

| Rung | Shows | Built with |
|---|---|---|
| 1. Context | where the subsystem sits among containers and external systems | **diagram-arch**, cropped to what it touches |
| 2. Parts | its modules and what they depend on | **diagram-deps**, scoped to the subsystem |
| 3. Data | the entities it owns | **diagram-data**, if it owns data |
| 4. Lifecycle | how its main entity changes state | **diagram-state**, if it has states |
| 5. One call path | the most common request, end to end | **diagram-flow** |

Those skills produce each rung's content and badge, and their diagrams are folded into this skill's page, so they render none of their own. This skill decides the order and the pace. A saved diagram from an earlier run can stand in for a rung once its drift check passes.

## 4. Build each picture up

- Never show a diagram with three or more moving parts all at once. Draw a series: each frame redraws the previous one and adds one part (a node, an edge, a participant), with one or two sentences on what the new part does.
- To teach A to B to C: draw A to B, then redraw with C added, then redraw with the return edge.
- Each frame carries the badge of the diagram it is cut from, counted for that frame (`HYBRID (2/2 edges cited)`, then `HYBRID (3/3 edges cited)`).
- Open each part with a plain definition: name the thing, say what it is in general terms, then tie it to this repo ("here, the report worker does this by ...").

## 5. Pace and voice

- With a live person: one rung per turn. Give the smallest complete answer, then stop and let them steer: deeper, next rung, or a different path.
- One-shot with no live person: deliver the whole ladder cleanly and put the offers at the end.
- Write through **unslop**: plain spoken sentences, the concrete mechanism rather than a metaphor, one name per concept. No framing labels ("the key insight"), no pacing theater, no wall of text.

## 6. Close

- Recap in three lines: the parts, the data, the path.
- Offer **quiz** on what you covered. It is opt-in; don't start it unasked.
- Show the ladder as one page, `$(ven-profile path)/explain/teach-<subsystem>.html`: every frame is a section in order, and the rung diagrams are folded into it. Render it per **Rendering** in the badge protocol of **diagram-deps**.
- Offer to save the ladder to `teach-<subsystem>.md` beside it, holding the same frames with their badges and captions. Diagrams saved on their own follow the badge protocol in **diagram-deps**.
