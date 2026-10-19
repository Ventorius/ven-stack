---
name: deep-modules
description: "Apply when designing or reshaping a module's interface, deciding where a seam goes, or making code easier to test. Put a lot of behavior behind a small interface, at a seam where something really varies, and test through it."
metadata:
  layer: L2
  source: mattpocock/skills@49dd158:skills/engineering/codebase-design/SKILL.md + DEEPENING.md + DESIGN-IT-TWICE.md
  license: MIT
---

# Deep Modules

Put a lot of behavior behind a small interface, at a seam where something actually varies, and test it through that interface.

**Why:** A deep module gives callers leverage (more capability per thing they must learn) and maintainers locality (change, bugs and verification gather in one place). A shallow module makes every caller learn nearly as much as the implementation knows, so complexity spreads instead of shrinking.

The interface is everything a caller must know: the signature, plus invariants, ordering, error modes, required configuration and performance. Use the exact terms in [references/vocabulary.md](references/vocabulary.md).

**Pattern:**
- **Shrink the interface.** Fewer entry points, simpler parameters, more hidden inside. A good default makes the common call trivial.
- **Depth belongs to the interface.** The inside may be small swappable parts with their own internal seams; they just aren't exposed.
- **One adapter is a guess; two make a seam.** Add a seam only where something varies, usually production and test.
- **Take dependencies, don't create them.** Pass collaborators in, so a test can hand over a stand-in.
- **Return results instead of mutating.** A function that returns a value is easier to test than one that edits its argument in place.
- **Test where callers call.** Tests cross the same seam callers do. After deepening, replace the old tests on the shallow parts with tests at the new interface.
- **Design it twice** when the interface is a real decision. Dependency kinds, seam rules and how to compare alternatives are in [references/deepening.md](references/deepening.md).

**The test:**
- **Deletion:** imagine deleting the module. If complexity vanishes, it was a pass-through. If it reappears in every caller, it was earning its keep.
- **Surface:** is the interface nearly as large as the implementation? Then it is shallow.
- **Reach:** does a test have to get past the interface to check something? Then the module is the wrong shape.

**Stop:** Don't measure depth as implementation lines over interface lines; that rewards padding. Don't split a module into a chain of tiny pass-throughs so each piece looks simple.
