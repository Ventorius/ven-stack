---
name: migration
description: "One mechanical change applied across many files or call sites, such as replacing an API, renaming across modules, swapping a pattern or dependency, or changing a format, ending with the old path deleted."
metadata:
  source: cursor/plugins@main:pstack/skills/principle-build-the-lever/SKILL.md
  license: MIT
---

# Migration

Build the tool that makes the change; don't hand-edit call sites. Old and new paths don't outlive the wave.

1. Lever first (apply **build-the-lever**)
   Done: the first unit is migrated by hand, a codemod or script reproduces that edit with an empty diff, and the script is safe to rerun.
2. **sweep** with `ven:ven-worker` per slice
   Done: the remaining call sites are split into slices with disjoint files; each worker ran the lever on its slice, fixed only what its brief allows, and returned PASS or a BLOCKED you resolved.
3. **verify** per slice
   Done: each slice's check passes before it merges, and the combined tree passes the verify key for each touched change type.
4. Delete legacy
   Done: the old API, shims and flags are gone, a search for the old name finds nothing outside history, and verify passes again. If the old pattern could creep back, lock it out with **ratchet**.
5. **learning-check**
   Done: its result is stated in the reply; silence is not a result.

**Reply:** the lever and how it was proven, slices run and their results, what was deleted, and the final verify evidence.
