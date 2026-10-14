---
name: type-discipline
description: "Apply when designing types or data shapes, reviewing a signature, or handling outside data, in any language. Make wrong states fail early: in the compiler for typed languages, in validated runtime contracts for untyped ones."
metadata:
  layer: L2
  source: cursor/plugins@main:pstack/skills/principle-type-system-discipline/SKILL.md
  license: MIT
---

# Type Discipline

Make wrong programs fail early: at compile time in a typed language, at the edge in an untyped one. `ven-profile get stack.typed` says which section applies; mixed repos use both.

**Why:** Every state the code can represent is a state some caller will eventually build. A check that runs on every call beats a rule that lives in a reviewer's head.

## Typed languages

- **Make illegal states unrepresentable.** Model variants as a sum type (tagged union, enum with data, sealed hierarchy), not a record of optional fields. A report with a `published` flag and an optional publish date admits "published, no date"; model it as draft, or published with a date. If a comment has to explain which field combinations are valid, split the type.
- **Construct, don't restrict.** Build the type from the values you want instead of carving them out of a looser one: a non-empty list is a first item plus the rest; a valid range is a start plus a length.
- **Give meaning its own type.** An account id and a widget id may share a primitive but get distinct nominal types. Validate once when the value is made; trust it after.
- **Outside data is untyped until parsed.** Request bodies, files, environment, arguments and stored rows go through a parse function that returns the model or an error.
- **Don't lie to the compiler.** Every cast, unchecked coercion or non-null assertion is a crash waiting for input. Prove the fact (validate, narrow, refine the model), or trace the cast to the edge and parse there.
- **Let the compiler enforce exhaustiveness.** A match over a sum type must stop compiling when a variant is added, so the compiler lists every place to update. No silent default arm.
- **Derive from the source of truth.** When a schema file, migration or generated client owns a shape, derive the type from it instead of keeping a parallel copy.
- **Strengthen only where partiality shows.** A runtime assertion or "can't happen" throw marks a type that is too weak; move that check into the type, then stop. Summing an empty list has an answer, so it takes any list; the first item of an empty list has none, so it demands a non-empty one.

## Untyped languages: contract discipline

Same goals, enforced at runtime and by tests:

- **Validate every input against a schema.** Parse once with a declared schema or a validating constructor; on failure, raise with the field and the reason. Never coerce silently.
- **One shape after parsing.** Downstream code sees one form of each value: no "string or list", no "missing and empty mean the same".
- **Tag variants.** Each record carries a kind field; dispatch through a table that raises on an unknown kind, plus a test that walks every kind.
- **Guard public entry points.** Assert preconditions where a module is called from outside, not in every helper inside it.
- **Make values through one door.** A factory that checks the invariant is the only way to build the value; nothing else assembles raw records.
- **Use the checker the repo has.** If the profile has `commands.typecheck`, annotate the code you touch and run it.

**Stop:** Types track what each caller must handle, not every fact about the data. If nothing would crash or need a check without the stronger type, keep the plain one.
