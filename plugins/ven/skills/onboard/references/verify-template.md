# verify.md template

Write to `$(ven-profile path)/verify.md`. One section per change type this repo has; leave out types it doesn't have. Candidate types: logic, endpoint, UI flow, CLI, data change, background job, integration, config. Every section rests on a phase 3 answer or a detect fact, and says which.

````markdown
# Verify recipes: <repo name>

How to prove each change type in this repo. `ven-profile verify <key>` runs the check and logs the
result against the current tree; the stop gate reads that log. "It compiles" is never proof.
Verify after the last edit: any later edit needs a new pass.

## <change type>

- **Proof:** <the observable result that shows a change of this type works>
- **Key:** `verify.<change type>` → `<commands.key>` (<verified | unverified: reason>)
- **Run:** `ven-profile verify <commands.key>` <add `--file <path>` if the command takes one>
- **Needs:** <services, env files, seed data, and how to start them; or "nothing">
- **Read back:** <what to inspect after it passes: response body, rendered state, stored record, output file, log line>
- **Manual part:** <steps a person does that the command can't; or "none">
- **Source:** <user answer, <date> | detected from <file>:<line>>

## Gaps

- <change type>: <why no unattended proof exists yet, and what would close the gap>
````

Rules:

- The key must exist in the profile's `verify` map, and the map must not point anywhere this file doesn't explain.
- A proof that needs a running service names how to start it and how to tell it's ready, and keeps the start step out of the verify command (start commands are `manual`).
- When the only proof is manual, say so under **Manual part**, point **Key** at the strongest unattended check that still applies, and list the type under Gaps.
