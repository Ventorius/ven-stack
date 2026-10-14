# Deepening and designing it twice

## Classify the dependencies

How a deepened module is tested across its seam depends on what it depends on.

1. **In-process.** Pure computation and in-memory state, no I/O. Merge the shallow modules and test through the new interface directly. No adapter.
2. **Local stand-in exists.** A dependency with a faithful local substitute (an in-memory store, a temporary directory, an embedded database). Run the stand-in inside the test suite. The seam stays internal, with no port on the module's interface.
3. **Remote but owned.** Your own services across a network. Define a port at the seam: the deep module owns the logic and receives the transport as an adapter. Tests use an in-memory adapter; production uses the network one.
4. **Truly external.** Third-party services you don't control. Inject them through a port; tests supply a fake adapter.

## Seam rules

- Introduce a port only when at least two adapters are justified, usually production and test. A port with a single adapter is just indirection.
- Internal seams, used by the module's own tests, stay private. Don't widen the interface because a test wants to reach in.

## Replace, don't layer

- Once tests exist at the deepened interface, delete the old tests on the shallow parts.
- New tests assert observable outcomes through the interface, not internal state.
- A test that must change when only the implementation changes is testing past the interface.

## Design it twice

The first interface you think of is rarely the best. When the interface is a real decision:

1. Write down the constraints any interface must meet, the dependencies and their category, and a rough sketch that makes the constraints concrete. The sketch is an illustration, not a proposal.
2. Produce at least three radically different interfaces, each under one pressure: the fewest entry points (one to three) with the most leverage each; the most flexibility for many uses; a trivial default for the most common caller; and, when dependencies cross a seam, ports and adapters first. Parallel subagents suit this, each with its own brief and the repo's glossary terms.
3. For each design, give the interface (operations, parameters, invariants, ordering, error modes), a caller's usage, what it hides, its dependency strategy, and where leverage is high or thin.
4. Compare them on depth, locality and seam placement. Recommend one, or a hybrid of their best parts, and say why. Be opinionated; a menu is not a recommendation.
