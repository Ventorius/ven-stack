# Doc shapes

Each outline lists sections in order. Drop a section that has nothing true to say. Add a section only when the reader would otherwise get stuck. Use the repo's doc format; the outlines are written in Markdown only to show the structure.

## Overview

For someone arriving at a repo, module or feature. The reader decides in one minute whether this is what they need, and then gets it working.

```markdown
# <name>

<What it does and who it is for, in one or two sentences.>

## Quick start
<The shortest path from nothing to a visible result.
Say what the reader should see.>

## Usage
<The common tasks, one short subsection each, every one with a working example.>

## Configuration
<Only the settings a user changes: name, default, effect. Link the full list.>

## How it works
<Three to six sentences or one diagram. Link the internals doc for detail.>

## Development
<Test, lint and build commands from the profile. Link contributing rules.>

## Related docs
<Links to the guides and internals docs, one line each saying what the doc answers.>
```

An overview of a part that isn't used on its own skips Quick start. It starts with Usage and says where the part sits in the repo.

## Guide

For someone using a feature. Name the doc by the task: "Exporting reports", not "Export module".

```markdown
# <task the feature does>

<What the feature does, and when to reach for it, in two sentences.>

## Before you start
<Permissions, settings or data the reader needs. Skip if none.>

## <First task>
1. <Step, with the exact command or action.>
2. <Step. Say what the reader should see.>

## <Next task>
<Same shape. Fork with "If you want x, do y.">

## Options
<Table: option, default, effect.>

## When it fails
<Each error a user sees: what it means and what to do.>
```

## Internals

For someone changing the code. Describe it as it is today, with `file:line` citations.

```markdown
# <subject>: how it works

<What it does, and the entry point a change usually starts from.>

## Flow
<The main path from input to output, as numbered steps or one diagram.
Each step names the function or file.>

## Data
<What it stores or passes around, and who owns it.>

## Decisions
<Why it is shaped this way, one line each, linking the ADR when one exists.>

## Changing it
<Where to add a case, which tests cover it, what else breaks if it changes.>
```
