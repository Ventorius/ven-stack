---
name: refactor
description: "A behavior-preserving change to structure, such as rename, extract, inline, dedupe, move code or reshape a module. No new behavior."
metadata:
  source: cursor/plugins@main:pstack/skills/poteto-mode/playbooks/refactoring.md
  license: MIT
---

# Refactor

The structure changes; the behavior does not. A missing feature or a real bug found on the way is split out as its own task, not folded in.

1. Pin behavior with **tdd** (characterization tests)
   Done: tests capture what the affected code does today and pass before any structure moves. Typecheck and lint are not a pin.
2. **conventions-audit** over the affected area
   Done: the conventions this code should follow, and the corrections that keep recurring here, are listed with locations.
3. **improve-architecture**
   Done: the target shape (modules, interfaces, call graph) is named, and it deletes branches, layers or invalid states rather than adding indirection (apply **laziness**).
4. **sweep**
   Done: the mechanical moves ran as `ven:ven-worker` slices on disjoint files, every slice reports PASS, callers are migrated and the old shape is deleted in the same wave, with no shims.
5. **verify**
   Done: the pin passes on the combined tree, and the verify key for each touched change type is logged.
6. **ratchet**
   Done: the shape the refactor established is locked by the highest rung that can hold it, proven red on the old code; or `skip: nothing checkable to lock`.
7. **learning-check**
   Done: its result is stated in the reply; silence is not a result.

**Reply:** the structure that changed, the pin it held against, the proof that behavior is unchanged, and anything reverted.
