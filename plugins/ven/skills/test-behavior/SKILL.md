---
name: test-behavior
description: "Apply when writing, changing, reviewing or keeping a test. Call the code the way its users do and assert the exact result they see; rewrite or delete any test that would pass if the code under test returned nothing."
metadata:
  layer: L2
  source: cursor/plugins@main:pstack/skills/principle-test-behavior-not-implementation/SKILL.md + mattpocock/skills@main:skills/engineering/tdd/tests.md
  license: MIT
---

# Test Behavior

A test calls the code the way its users do and asserts the exact result they see. Rewrite or delete any test that would still pass if every function it imports returned nothing or a wrong value.

**Why:** A good test fails when behavior breaks and keeps passing through a refactor that leaves behavior alone. A test tied to internals does the opposite: it breaks on harmless changes and stays green on real ones, so people learn to ignore it.

**These shapes fail the check:**
- A loose assertion or none: "is defined", "is truthy", "does not throw", "greater than zero".
- Only that something was called, or not called, or that a result is empty.
- An expected value computed the way the code computes it, or by calling the code itself.
- A restated constant, config default, table row or prompt string.
- Assertions on data the test built, with no call to the subject.
- Mocks of the module's own collaborators, tests of private functions, assertions on call counts or order.
- Checking through a side door, such as reading storage directly, instead of through the interface.

**Fix:**
- Call the subject in the test body with one concrete input and assert the literal output or effect.
- For a stand-in at a real seam, assert the payload it received, not only that it was called.
- For an absence, also assert the presence on another input.
- For a constant, test the mechanism that reads it with one input instead of restating the value.
- Verify through the interface: create something, then read it back the way a caller would.
- Name the test after the behavior ("a widget over its limit is rejected"), not the mechanism.

**Keep:** checks that relate rows across tables (a key present in both, a parent that exists) and compile-time type tests.

**The test:** Change the implementation without changing behavior: the test should pass. Break the behavior: it should fail. If either doesn't happen, the test is wrong.
