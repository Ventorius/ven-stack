---
name: investigation
description: "A read-only question that needs a cited answer or a recommendation, such as how does X work, why is Y built this way, are we sure about Z, should we do A or B."
metadata:
  source: cursor/plugins@1e5c90a:pstack/skills/poteto-mode/playbooks/investigation.md
  license: MIT
---

# Investigation

You own the answer. Read-only: no code changes. If the answer calls for a change, stop and hand that change back to the router as its own task.

1. **how** over the code involved
   Done: what happens and where, each claim cited `file:line`. Broad reads (many files, history, several areas) go to `ven:ven-worker` or Explore agents on `${user_config.swarm_model}`, one question each, as **how** does; only their conclusions with citations stay in the main thread.
2. **why** for motivation or history questions ("why is it like this", "where did this number come from")
   Done: the reasons, cited to commits, reviews, decision records or docs; else `skip: not a why question`.
3. Answer with citations
   Done: overview, how it works, where things live and gotchas; for a choice between options, a recommendation with a tradeoffs table. Every claim carries its evidence or is labeled inferred or guess. An answer that will drive a decision gets its citations checked with **citation-check** on `ven:ven-verifier`. Apply **unslop** to the reply.
4. **learning-check**
   Done: its result is stated in the reply; silence is not a result.

**Reply:** the answer itself. For "are we sure?", your real judgment with reasons; push back when the premise is wrong.
