# Principles index

One line per principle: its name and when it applies. Read the principle's own skill before you cite it; this index says when, never what.

- **laziness**: sizing a change, reviewing a diff that grew, or tempted to add an abstraction, layer, option or helper.
- **model-the-domain**: stateful logic, code that branches a lot, flags kept in sync, or a shape assumption repeated across files.
- **type-discipline**: designing types, data shapes or a signature, or handling outside data (`stack.typed` decides compiler or runtime contracts).
- **boundary-discipline**: wiring validation, parsing, error handling or config where data enters or leaves the system.
- **idempotent-operations**: commands, jobs, handlers, startup steps or loops that can crash, restart or be retried.
- **deep-modules**: designing or reshaping a module's interface, or deciding where a seam goes.
- **fix-root-causes**: debugging, or a fix that makes a symptom go away without explaining it.
- **prove-it-works**: before calling any change done, fixed or passing.
- **sequence-verifiable-units**: multi-step work (sweeps, migrations, runs of similar edits) and the order of commits and pull requests.
- **test-behavior**: writing, changing, reviewing or keeping a test.
- **explain-the-number**: before trusting, reporting or acting on a number you measured.
- **encode-lessons-in-structure**: writing the same instruction or correction a second time.
- **never-block-on-reversible**: about to ask the user about work that can be undone and reviewed.
- **guard-the-context**: large outputs, long files, repeated reads, broad searches or fan-out planning.
- **build-the-lever**: any non-trivial edit, sweep, analysis or check you could script instead of doing by hand.
