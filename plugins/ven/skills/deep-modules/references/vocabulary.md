# Deep-module vocabulary

Use these terms exactly, so design discussions stay precise across sessions and reviewers.

- **Module:** anything with an interface and an implementation, at any scale: a function, a class, a package, a slice through several tiers. Not "unit", "component" or "service".
- **Interface:** everything a caller must know to use the module correctly: the signature, plus invariants, ordering constraints, error modes, required configuration and performance characteristics. Wider than the type-level surface.
- **Implementation:** the code inside the module.
- **Depth:** leverage at the interface; how much behavior a caller or test can exercise per unit of interface it has to learn. Deep means much behavior behind a small interface. Shallow means the interface is nearly as complex as what it hides.
- **Seam:** a place where behavior can change without editing that place; where a module's interface lives. Where a seam goes is its own decision, separate from what sits behind it. Say seam, not boundary: here, boundary means where data enters or leaves the system.
- **Adapter:** a concrete thing that fills an interface at a seam. It names a role, not a size: a thin adapter can wrap a large implementation, and a large one can sit over a small fake. Not the same as the repo's capability adapters, which map a capability to a command.
- **Leverage:** what callers get from depth. More capability per thing learned; one implementation pays back across every caller and test.
- **Locality:** what maintainers get from depth. Change, bugs, knowledge and verification gather in one place. Fix once, fixed everywhere.

## How they relate

- A module has exactly one interface, shared by callers and tests.
- Depth is measured against that interface.
- A seam is where the interface lives; an adapter sits at a seam and satisfies the interface.
- Depth produces leverage for callers and locality for maintainers.

## Framings to avoid

- Depth as implementation lines divided by interface lines: it rewards padding the implementation.
- Interface as a language keyword or a class's public methods: too narrow, since it includes every fact a caller must know.
