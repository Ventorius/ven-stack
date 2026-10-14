---
name: tdd
description: "Build behavior test-first, one red-green cycle at a time, testing through public interfaces. Use when implementing a ticket or a fix, when the user asks for TDD or a failing test first, or when a coder needs the rules of the loop."
metadata:
  layer: L3
  source: mattpocock/skills@main:skills/engineering/tdd/SKILL.md + mocking.md; obra/superpowers@main:skills/test-driven-development/SKILL.md; cursor/plugins@main:pstack/skills/tdd/SKILL.md
  license: MIT
---

# TDD

One behavior per cycle: a failing test, the least code that passes it, repeat. What makes a test worth keeping is **test-behavior**; apply it to every test you write.

## Before the first test

- **Commands.** `ven-profile get commands.test.single`. If it is missing or `unverified`, say so. Fall back to `commands.test.all` only if that one is verified; otherwise stop, because there is no loop to run.
- **Vocabulary.** Read `$(ven-profile path)/GLOSSARY.md` so test names and interfaces use domain terms.
- **Seams.** A seam is the public interface a test drives. Test only at agreed seams.
  - In the main session: propose each seam with one line on what it catches and what it misses, and confirm with the user. If the interface's shape is itself the question, apply **deep-modules**.
  - As a background coder you cannot ask. The seams come from the ticket. If the ticket names none and the code offers no single obvious public interface, return `VEN-RESULT: BLOCKED: which seam should <behavior> be tested at?`
- **Bugs.** The first red test is the repro that **reproduce** built, moved to the seam where the bug really happens.

## The cycle

1. **Red.** Write one test for the next behavior in the acceptance criteria. Run `ven-profile run commands.test.single --file <test path>`. Watch it fail, for the expected reason: the assertion on the missing behavior, not a typo, an import error or a broken fixture. A test that passes at once tests something that already exists; fix the test.
2. **Green.** Write the least code that makes it pass. Nothing the test doesn't demand. Re-run: it passes, and the other tests in the file still pass, with clean output.
3. **Next.** Pick the next behavior. Each test is a tracer bullet that reacts to what the last cycle taught you.

## Rules

- **Vertical, never horizontal.** Don't write all the tests and then all the code; bulk tests check imagined behavior and lock in structure too early.
- **No production code without a red test that demands it.** Code written ahead of its test gets deleted and rebuilt from the test, not kept as a reference.
- **Fix the code, not the test.** Never edit a test to match a wrong result, and never weaken an assertion unless the spec changed.
- **Mock only at system boundaries:** outside services, time, randomness, and sometimes the filesystem or a store the repo can't run locally. Never mock your own modules. Pass a boundary in rather than building it inside, and give each outside operation its own narrow function, so each stand-in returns one shape and needs no branching.
- **Tidy only on green**, and re-run after. Reshaping the design is not part of the loop; note it for review.
- **Flaky is red.** Make the test deterministic (pin time, seed randomness) before you trust it.

## Done

- Every acceptance criterion has a test you watched go red, then green.
- The whole suite passes: `ven-profile run commands.test.all` when it is verified. A failure you didn't cause still goes in your report, by name.
- Then run **verify** for each change type you touched.
