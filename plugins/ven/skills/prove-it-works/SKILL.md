---
name: prove-it-works
description: "Apply before calling any task done, fixed or passing. Observe the real thing doing what was asked, with the proof that matches the change type; a build, a proxy or a self-report is not proof."
metadata:
  layer: L2
  source: cursor/plugins@1e5c90a:pstack/skills/principle-prove-it-works/SKILL.md + obra/superpowers@bb92a77:skills/verification-before-completion/SKILL.md
  license: MIT
---

# Prove It Works

Before you call work done, watch the real thing do what was asked, using the check that matches the kind of change. "It compiles" is not proof. Neither is "the tests should pass".

**Why:** Unverified work has unknown correctness. Proxies (a clean build, a fresh timestamp, a delegate's "done", output from before the last edit) feel cheaper than looking, but acting on a wrong inference costs far more than one more run.

**Proof matches the change type:**
- Logic: a test that calls the code and asserts the exact result, red before the change and green after.
- An endpoint or command: call it the way a user would and read the response or output.
- A user-facing flow: drive the flow and look at what the user sees.
- A data or schema change: apply it, then read the stored data back.
- A background job or integration: trigger it and check the effect at the far end.
- Delegated work: inspect the diff and the artifact, never the delegate's summary.

**Pattern:**
1. Find the proof for this change type. `ven-profile get verify` maps change types to command keys; `$(ven-profile path)/verify.md` says what to read back.
2. Run it with `ven-profile verify <key>`. That logs the result against the exact tree, so any edit afterwards needs a new run.
3. Read the whole output and the exit code. Count failures; don't skim.
4. State the claim with its evidence: the command, the exit code, the value you read back. With a playbook active, record it: `ven-decisions add --step <step> --decision proven --evidence "<command> exit 0"`.
5. If the key is missing or unverified, say so. Never guess a command; prove it by hand and name exactly what you observed.

**Script the check when you can.** A rerunnable script that compares real output beats a one-time look, and a reviewer can run it instead of taking your word.

**Stop:**
- "Should", "probably" and "seems to" in a status mean it isn't proven yet.
- When a check fails, suspect how you observed before you suspect the system.
- When it passes suspiciously fast, confirm the code you changed actually ran.
