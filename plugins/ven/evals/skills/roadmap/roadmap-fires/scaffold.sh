#!/usr/bin/env bash
# Fixture repo: a small order module and an empty ven profile.
set -euo pipefail
git init -q -b main
git config user.email eval@example.com
git config user.name eval
mkdir -p src/orders
cat > src/orders/order.js <<'JS'
export function createOrder() { return { status: "draft" }; }
JS
printf '{ "name": "fixture-service" }\n' > package.json
git add -A && git commit -q -m "init"
# EVAL_VEN_STATE_DIR (set in prompt.md) points ven at .ven-state/ inside the sandboxed workspace.
echo '.ven-state/' >> .git/info/exclude
mkdir -p .ven-state
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
