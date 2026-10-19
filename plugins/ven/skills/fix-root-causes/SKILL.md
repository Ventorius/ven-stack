---
name: fix-root-causes
description: "Apply when debugging or when a fix makes a symptom go away without explaining it. Trace the symptom to its cause and fix it there; guards, retries and suppressions that hide it are not fixes."
metadata:
  layer: L2
  source: cursor/plugins@1e5c90a:pstack/skills/principle-fix-root-causes/SKILL.md
  license: MIT
---

# Fix Root Causes

Trace each symptom back to its cause and fix it there. A change that only makes the symptom disappear is not a fix.

**Why:** Symptom fixes pile up. Each workaround makes the system harder to reason about, and the real defect stays, waiting for the next input that reaches it. Finding the cause costs more today and less every day after.

**Pattern:**
- **Reproduce before you change anything.** Without a reproduction you can't show the fix works.
- **Keep asking why** until the answer is a defect in code, data or config, not another symptom.
- **Instrument, don't guess.** Read the actual error, add a log line or counter, inspect the real state. A theory you haven't observed is a hypothesis.
- **Fix the pattern, not the instance.** Search for every other place the same mistake is made; fix those too, or list them.
- **Suspect state on restart bugs.** Code doesn't change between runs; state does. When something fails only after a restart, check persisted state first: config, caches, lock files, serialized data. If clearing it restores behavior, the fix is validating that state on load.
- **Leave a signal.** If the deciding fact took a long dig to find, propose the cheap, always-on log, metric or assertion that would have shown it at first look.

**The test:**
- Can you state the cause in one sentence that explains every observed symptom?
- Does the reproduction fail before your change and pass after it?
- Would the same bug appear anywhere else the pattern is used?

**Stop:** these are symptom fixes; don't ship them as the fix.
- A null check, catch-all handler or default value that hides the crash.
- A retry or sleep that makes a race less likely.
- A skipped test, loosened assertion or suppression comment.
- A workaround that needs a paragraph of comment to justify it. If the comment has to argue, the code is wrong.
