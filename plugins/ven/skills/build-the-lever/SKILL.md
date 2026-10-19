---
name: build-the-lever
description: "Apply to any non-trivial edit, sweep, analysis or check, not just bulk work. Build the tool that does or proves it (codemod, script, generator, delegate brief) instead of working by hand; the tool is what a reviewer reruns."
metadata:
  layer: L2
  source: cursor/plugins@1e5c90a:pstack/skills/principle-build-the-lever/SKILL.md
  license: MIT
---

# Build the Lever

When work isn't trivial, build the tool that does it or proves it instead of doing it by hand.

**Why:** A codemod, generator or script does the work the same way every time and reruns for free. It is one artifact a reviewer can read and rerun. Hand-made changes can only be checked by redoing them. A deterministic tool turns "trust me" into "run this".

**Pattern:**
- **Default to the lever.** Skip it only for a couple of obvious edits you can see at a glance.
- **Hand-do the first unit, then automate.** Learn the recipe on one case, write the tool, rerun it on that case and diff against your hand-made version.
- **Pick the right kind:** a codemod or script for edits, a generator for repetitive files, a query over exported data for analysis, a rerunnable check for verification.
- **Make it safe to rerun.** Running it twice leaves the same result as running it once.
- **One deterministic pass beats fan-out.** If the tool can handle every unit, run it yourself. Don't hand delegates work a script can do.
- **When you must fan out, the lever is the brief.** Put the recipe, the check each delegate runs and the do-not-touch fences in one file they all read, kept outside their write scope so nobody quietly edits the contract.
- **Smallest tool that does the job.** A script, not a framework.
- **Commit it** when the work outlives the session.

**The test:** Applying this principle leaves a file. If you claim it and the diff has no script, codemod, generator or delegate brief, you didn't apply it.

**Stop:** The bar is triviality, not repetition. A one-off still earns a lever when the lever is what makes the work checkable.
