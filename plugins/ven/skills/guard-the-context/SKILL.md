---
name: guard-the-context
description: "Apply when context is filling up: large outputs, long files, repeated reads, broad searches or fan-out planning. Make every token earn its place; send bulk to subagents and keep conclusions, not raw payloads, in the main thread."
metadata:
  layer: L2
  source: poteto/brainmaxxing@ec4d8e4:brain/principles/guard-the-context-window.md
  license: MIT
---

# Guard the Context

The context window is finite and doesn't refill within a session. Every token that enters it should earn its place.

**Why:** A crowded context degrades reasoning, forces lossy compaction and eventually halts the work. Time and compute can be spent again; context used in a session can't be taken back.

**Pattern:**
- **Send bulk elsewhere.** Long logs, full test output, large files, broad searches and wide fan-outs go to a subagent. The main thread gets the conclusion, the file:line references and the evidence, not the raw payload.
- **Read for the question.** Search first, then read the part you need. Skip files the current task doesn't touch, and don't re-read what you already have.
- **Trim output at the source.** Ask commands for the failing cases only, the tail of a log, a count instead of a list.
- **Keep the always-needed inline.** What a skill uses on every run belongs in the skill; detail used sometimes goes in a reference loaded on demand.
- **Size phases and cap scope.** Limit files per phase, set turn budgets, and count what each mechanism costs before you start it.
- **Write state down.** Plans, decisions and findings go to a file or the task list, so a fresh session or a compaction loses nothing.

**The test:** Before pulling something in, ask what you will do with it. If the answer is "skim it", send it to a subagent or don't fetch it.

**Stop:** Don't starve the work to save tokens. Reading the code a change touches is never waste; reading everything near it usually is.
