# Answer shape

Adapt the sections to the question; drop any that don't apply.

## Overview

One or two paragraphs: what the thing is, what it does, why it exists. A reader decides from this alone whether to read on.

## Key concepts

The types, modules and abstractions needed to follow the rest. One line each, with `file:line`. Not exhaustive.

## How it works

The longest section. What triggers it, what happens step by step, where data goes, where the decisions are. Prose, not pseudocode. Name the real functions and files so the reader knows where to look; quote code only when a snippet carries the point.

Add a Mermaid diagram only when several components talk to each other or data changes shape through stages. Caption it `HYBRID (n/n edges cited)` when every edge cites `file:line`, otherwise `HYPOTHESIS`. Render it per **Rendering** in the badge protocol of **diagram-deps**.

## Where things live

A short map of the files and directories someone needs to start working here.

## Gotchas

Surprising behavior, history that explains odd code, sharp edges. Skip when there are none.

## Open questions

What nobody could trace. Name them instead of hiding them.

## Style

- Concrete beats abstract: "`WidgetStore.save` calls `Queue.push`", not "the store delegates to the queue".
- When something is complex, explain why it is complex. When it is simple, don't pad it.
- Use an analogy only if a good one exists.
- A claim about the code without a citation moves to Open questions.
