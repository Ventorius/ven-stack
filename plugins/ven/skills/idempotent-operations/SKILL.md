---
name: idempotent-operations
description: "Apply when designing commands, jobs, startup steps or processing loops that can crash, restart or be retried. Make every state-changing operation converge to the same end state however many times it runs and wherever the last run stopped."
metadata:
  layer: L2
  source: cursor/plugins@1e5c90a:pstack/skills/principle-make-operations-idempotent/SKILL.md
  license: MIT
---

# Idempotent Operations

Design every state-changing operation to reach the same correct end state no matter how many times it runs or where a previous run stopped.

**Why:** Commands, jobs, startup sequences and loops run where crashes, restarts, timeouts and retries are normal. If leftover partial state changes what the next run does, every restart becomes a debugging session and every retry risks doing the work twice.

**Pattern:**
- **Converge on start.** Look at what exists, clean up stale artifacts, adopt work that is still live, then continue. Never assume a blank slate.
- **Key the work, not the attempt.** Give each unit of work a stable key derived from its input and record completion under it, so a repeat is a no-op.
- **Compare by content.** Decide whether something is done or a duplicate by what it contains, not by creation order, timestamps or counters.
- **Order the effect and its record** so a crash between them leads to a safe redo, never a lost or doubled effect.
- **Reclaim stale locks.** A lock carries its owner and age, so one left by a dead process is taken over instead of blocking forever.
- **Retry from the input.** Failed work restarts as a fresh attempt from its input, never from someone's half-written output.
- **Set, don't add.** "Set the count to 5" survives a repeat; "add 1" does not.

**The test:**
1. What happens if this runs twice in a row?
2. What happens if the last run died at each possible point?
3. Does running it again always land in the same end state?

If any answer is "it depends on what was left behind", add a reconciliation step that reads the current state and moves it to the target.

**Stop:** Some effects can't be repeated safely, like sending a message or calling a third party with no deduplication. Put those behind a recorded key and check the key before acting.
