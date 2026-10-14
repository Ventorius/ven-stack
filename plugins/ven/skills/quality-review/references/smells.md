# Smells and remedies

## Escalate

- A complicated implementation where a different framing would delete whole categories of complexity.
- A refactor that moves code but leaves the reader holding the same number of concepts.
- A file crossing 1000 lines because of this diff, when the new code could live on its own.
- New conditionals bolted onto unrelated code paths; edge-case handling dropped into the middle of an already busy function.
- One-off booleans, nullable modes or flags that fork existing control flow.
- "Temporary" branching that will become permanent.
- Feature-specific logic in a general-purpose module; implementation details leaking through an interface.
- Generic "magic" handling that hides a simple data shape.
- Thin wrappers and identity abstractions that add indirection and clarify nothing.
- Casts, untyped escape hatches or optional parameters that blur the real contract.
- Copy-pasted logic, or a bespoke helper where the repo already has a canonical one.
- Logic in the wrong layer or package when a more central owner exists.
- Independent async steps run one after another, making the flow longer and more brittle.
- Multi-step updates that can stop halfway and leave state inconsistent.

## Prefer, strongest first

1. Delete a layer of indirection instead of polishing it.
2. Reframe the state model so the conditionals disappear rather than get centralized.
3. Move the ownership boundary so the feature becomes a natural extension of an existing abstraction.
4. Turn special cases into a default flow with fewer exceptions.
5. Replace condition chains with a typed model or an explicit dispatcher.
6. Move the logic to the module that already owns the concept; reuse the canonical helper.
7. Make a type boundary explicit so the control flow gets simpler.
8. Separate orchestration from the rules it orchestrates.
9. Collapse duplicate branches into one clearer flow.
10. Split a large file into focused modules; extract a pure function.
11. Run independent work in parallel when that also simplifies the flow; group related updates so they apply atomically.

A rename is not a remedy for a structural problem. A cleaner version of the same messy idea is not enough when a simpler idea is within reach.
