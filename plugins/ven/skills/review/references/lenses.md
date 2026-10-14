# Lens rubrics

Paste one section whole into each reviewer's brief. A lens hunts only its own failures. Anything outside it goes under Noted in one line.

## Correctness

Does the code do what the intent says, on every path? Read it by executing it: pick concrete values and trace them through each branch.

Hunt for:
- Boundaries: empty input, one item, the exact limit, the last page, off-by-one.
- Absent values: a function returns nothing on failure and a caller uses the result anyway; a fallback turns "the call failed" into "nothing found".
- Reused sentinels: a new path returns an empty or default value that an old path already used for a different meaning. Check what each consumer shows or does with it.
- Error paths: errors swallowed, rethrown without context, routed to the wrong handler, or leaving state half-applied.
- Ordering: steps that assume a sequence but can interleave; check-then-act gaps; shared state with no single owner.
- Re-runs: what happens when the operation runs twice, or crashes halfway (**idempotent-operations**).
- Symptom fixes: a guard, retry or cast that hides a broken contract instead of fixing it (**fix-root-causes**).

Evidence bar: the input, the branch it takes, and the wrong result at `file:line`. "This could be empty" without a caller that passes empty is not a finding.

Don't flag: style, naming, speed, or checks for values that cannot occur on this path.

## Design and depth

Does this change make the code harder to change, delete or understand? Apply **deep-modules**.

Hunt for:
- Complexity moved, not removed: logic spread over more files, helpers or modes without fewer concepts to hold.
- A missed reframe that would delete whole branches, flags or layers while keeping behavior.
- Special cases bolted into a shared path; another branch-set over a discriminator that is already switched on elsewhere.
- Shallow modules: pass-through wrappers, interfaces with one implementation, extension points with no consumer.
- Wrong home: feature logic in a general module, a new helper that duplicates an existing one, internals exposed through a public interface.
- Edges: validation scattered through the core instead of done once where data enters (**boundary-discipline**); a new import that crosses a profile `boundaries` rule.
- An old path kept alive beside the new one with no outside caller.
- Unrequested surface: a flag, parameter, export or dependency the intent does not need.
- Drift from `conventions.md` where the repo has one established way.

Evidence bar: a concrete reframe that says what to delete, merge or move. "Consider refactoring" is not a finding.

Don't flag: complexity that mirrors real domain rules, abstractions with several real consumers, taste.

## Security and data

How would an attacker, or a deploy in progress, break this? Trace input from where it enters to where it lands.

Hunt for:
- Untrusted input reaching a query, a shell command, a file path, a server-side fetch of a URL, or rendered output, with no escaping, parameters or allowlist.
- Weakened access: an entry point without authentication, an ownership check that lets one account read another's records, a feature gate dropped on one path but kept on its siblings.
- Secrets in code, logs, error messages or URLs; personal data written to logs.
- Stored data: an irreversible change with no way back, a new required field with no backfill, a rename that breaks code still running, a narrowing type that truncates, a multi-step write with no transaction.
- Re-delivery: an event or request handled twice writes twice (**idempotent-operations**).
- The deploy window: old code reading new data, new code reading old data.

Evidence bar: the traced path from entry to sink, or the rows that break. A high-impact path you can't fully confirm is still Act on, marked "unconfirmed".

Don't flag: hardening advice with no path in this diff, development-only config, a second layer of defense on input already handled.

## Test honesty

Do the tests prove the change works, or only that tests exist? Apply **test-behavior**.

Hunt for:
- Behavior changed and no test changed.
- New branches, error paths and fallbacks that no test takes.
- Tests that pass when the code is broken: asserting only "no error" or truthiness; an expected value computed by the code under test; a fake that supplies the very result being tested.
- Tests tied to structure: call counts on fakes, private internals, snapshots of internal data.
- Nondeterminism: real time, real network, shared fixtures, dependence on test order.
- Seams added only so a test can reach an internal that a real entry point could reach.
- A bug fix with no test that fails before the fix.
- Suppressions: skipped tests, weakened assertions, ignore comments (profile `suppressions` and `assertions`).

Evidence bar: run it with `ven-profile run commands.test.single --file <path>`. For "this test passes when the code is broken", name the line to break and what the test would still report.

Don't flag: test layout style, coverage percentages, trivial accessors, old untested code the diff did not touch.
