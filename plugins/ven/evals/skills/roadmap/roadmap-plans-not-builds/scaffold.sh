#!/usr/bin/env bash
# Fixture repo plus a roadmap with one open grilling ticket that blocks the build.
set -euo pipefail
git init -q -b main
git config user.email eval@example.com
git config user.name eval
mkdir -p src/payments
printf 'Payments live here. No provider client yet.\n' > src/payments/README.md
printf '{ "name": "fixture-service" }\n' > package.json
git add -A && git commit -q -m "init"
# EVAL_VEN_STATE_DIR (set in prompt.md) points ven at .ven-state/ inside the sandboxed workspace.
echo '.ven-state/' >> .git/info/exclude
mkdir -p .ven-state/roadmaps/payments
cat > .ven-state/profile.json <<'JSON'
{
  "schema_version": 1,
  "generated_at": "2099-01-01T00:00:00.000Z",
  "repo": { "name": "fixture-service", "default_branch": "main", "forge": { "kind": "none", "cli": "" }, "tracker": { "kind": "none", "how": "none" } },
  "stack": { "languages": ["js"], "frameworks": [], "package_manager": "none", "typed": false, "sources": ["package.json"] },
  "commands": {},
  "verify": {},
  "tests": { "patterns": [] },
  "docs_only": ["**/*.md"],
  "packs": []
}
JSON
cat > .ven-state/roadmaps/payments/roadmap.md <<'MD'
# Roadmap: payments

## Destination
Orders are paid through the new provider, refunds included.

## Decisions so far
None yet.

## Not yet specified
- Data migration of stored payment methods.

## Out of scope
- Subscriptions.

## Notes
MD
cat > .ven-state/roadmaps/payments/01-grilling-choose-provider.md <<'MD'
# 01: grilling: choose the provider

**Type:** grilling
**Blocked by:** None
**Claimed by:** none
**Status:** open

## Question
Which payment provider do we move to, and what must it support?

## Resolution

## Superseded by
MD
