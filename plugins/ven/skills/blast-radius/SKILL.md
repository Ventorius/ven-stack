---
name: blast-radius
description: "Find what a change can break beyond its diff (callers, data, contracts, config), cite each risk at file:line, and prove the one fact its safety rests on by running code. Use for 'what could this break', before merging risky work, or for a small diff you don't trust."
metadata:
  layer: L3
  source: cursor/plugins@1e5c90a:pstack/skills/blast-radius/SKILL.md
  license: MIT
---

# Blast radius

Listing the callers is not the job; a search does that in seconds. The job is the breakage a search won't show, plus proof for the one fact that makes the change safe. A write-up that sounds right is worthless until that fact is proven.

## How sure you are

Take each fact the change's safety depends on as far down this list as is cheap, and say where it stopped.

1. You said so. Worthless on its own.
2. You cited it: a real `file:line`, or the dependency's own source at the version the repo pins.
3. You walked the failure step by step and showed it can't be reached.
4. You ran it: a script or test that calls the real code and fails loudly if you're wrong.
5. You reproduced it in the running app with the profile's `verify.<type>` command.

## Steps

1. **Read the change.** The diff, the symbols it adds, changes and deletes, and what it now does differently, including what the diff doesn't spell out. Read the commits and the PR body for intent.
2. **Find the fact it's safe because of.** Most risky-looking changes are safe because of one fact, such as "this only drops cache entries nothing reads any more". If that fact holds, most risks clear at once. Spend your time here, not on a long list of maybes.
3. **Map the reach.** Run `ven-profile adapter graph.imports` and follow edges into the changed modules. Without that adapter, search for each changed symbol (`ven-profile adapter code.search --var pattern=<symbol>`, or a plain search), say the graph was unavailable, and suggest **forge-adapter**. Then look where a symbol search stops:
   - **Callers:** transitive ones, plus dynamic dispatch, string-keyed lookups, reflection and generated code.
   - **Data:** stored fields, files, caches and messages written in the old shape and read in the new one, or the reverse; readers in other services or other languages.
   - **Contracts:** public interfaces, wire and file formats, event payloads, error codes, command-line flags, anything a deployed client or another team reads.
   - **Config:** feature flags, environment variables, defaults, build and deploy settings.
   - **Timing:** teardown order, retries, concurrency, what runs when.
4. **Be honest about each risk.** Give it a real likelihood and a real cost. Keep the confirmed risks; list what you checked and cleared separately. Cite real `file:line`. A search that finds nothing is an answer: say what you searched for. Never invent a caller or an interface.
5. **Prove the fact.** Write the smallest script or test that runs the real code, run it (`ven-profile run commands.test.single --file <path>` for a test), and paste the result. Keep scratch scripts out of the working tree, or delete them when done.
6. **Wide changes.** When the reach spans many modules, fan out one `ven:ven-worker` (`model: ${user_config.swarm_model}`) per reach kind, each with a read-only brief that returns risks with `file:line`. Merge and judge their results yourself.

## Hand back

- **What it does**, including the part that isn't obvious.
- **The safety fact:** stated, the level it reached, and the proof. If you could not prove it, write "unproven".
- **Risks:** how each breaks, `file:line`, likelihood and cost, how to check.
- **Cleared:** what you checked and why it's fine.
- **Before merge:** the cheapest test or repro that would catch the real bug, including any script you wrote.

Run the write-up through **unslop**, and strip anything private before it leaves the session.
