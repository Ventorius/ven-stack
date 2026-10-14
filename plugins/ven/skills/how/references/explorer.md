# Explorer brief

Fill in the braces. One brief per explorer.

---

Read-only. Other explorers are covering other angles of the same question in parallel. Go deep on your angle; don't try to cover everything.

**Question:** {QUESTION}

**Your angle:** {ANGLE}

**Start from:** {ADAPTER OUTPUT, SYMBOLS OR SEARCH TERMS}

**Glossary:** {DOMAIN TERMS AND THEIR CODE NAMES}

Find the entry point, then follow the thread: callers, callees, the data passed, the types. Read the code; don't guess from file names. Stop when you can describe the path from trigger to effect without hand-waving any step.

Return these sections:

- **Components:** name, `file:line`, one sentence on what it does.
- **Flow:** each step's function, `file:line`, what it does, what it calls next, and the data it hands over.
- **Boundaries:** where this part connects to the rest of the code; its inputs and outputs.
- **Non-obvious:** surprises, sharp edges, things that look like they work one way and work another.
- **Open questions:** what you could not trace. Be honest about gaps.
- **Files read:** every file you opened.

End with the agent result trailer, `step: how`.
