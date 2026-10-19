---
name: docs-only
description: "A change to documentation alone, such as update the README, fix a typo in the docs, write a guide, or document this module. No code behavior changes."
---

# Docs only

review: own-read

Every file touched matches the profile's `docs_only` globs (`ven-profile get docs_only`). A code change found on the way is split out as its own task.

1. Write with **write-docs** and **technical-writing**
   Done: the document says what the reader needs, every claim about code is checked against the code, and commands and paths in it are copied from the profile or the repo, not recalled.
2. **unslop**
   Done: filler, hedging and formatting tics are cut and every fact is kept.
3. Check links
   Done: the profile's lint or link check ran with `ven-profile run commands.lint` when it exists, and passes; with none, `skip: no docs check in the profile`.
4. Own read of the diff
   Done: you read the diff, confirmed no file outside the `docs_only` globs changed, and recorded it with `ven-decisions add --step review`. No verify gate applies.
5. Light ship
   Done: the change is committed in the repo's commit style; a PR is prepared per the ship playbook's prepare step, with no panel and no re-verify, and opened only after the user approves.
6. **learning-check**
   Done: its result is stated in the reply; silence is not a result.

**Reply:** what changed in the docs, the checks that ran, and the commit or PR state.
