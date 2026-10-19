#!/usr/bin/env bash
# Fixture repo for routing cases: a small onboarded service so the router finds a profile.
set -euo pipefail
git init -q -b main
git config user.email eval@example.com
git config user.name eval
mkdir -p src/reports src/accounts test
printf '{ "name": "fixture-service", "scripts": { "test": "node --test" } }\n' > package.json
printf 'export function exportReport(rows) { return rows; }\n' > src/reports/export.js
printf 'export function mergeAccounts(a, b) { return { ...a, ...b }; }\n' > src/accounts/merge.js
printf 'import test from "node:test";\ntest("ok", () => {});\n' > test/export.test.js
git add -A && git commit -q -m "init"
# EVAL_VEN_STATE_DIR (set in prompt.md) points ven at .ven-state/ inside the sandboxed workspace.
echo '.ven-state/' >> .git/info/exclude
mkdir -p .ven-state/handoffs
cat > .ven-state/profile.json <<'JSON'
{
  "schema_version": 1,
  "generated_at": "2099-01-01T00:00:00.000Z",
  "repo": { "name": "fixture-service", "default_branch": "main", "forge": { "kind": "none", "cli": "" }, "tracker": { "kind": "none", "how": "none" } },
  "stack": { "languages": ["js"], "frameworks": [], "package_manager": "none", "typed": false, "sources": ["package.json"] },
  "commands": {
    "test": {
      "all": { "run": "node --test", "status": "verified" },
      "single": { "run": "node --test {file}", "status": "verified" }
    }
  },
  "verify": { "logic": "commands.test.all" },
  "tests": { "patterns": ["test/**"] },
  "docs_only": ["**/*.md"],
  "risk_areas": [{ "path": "src/accounts/**", "why": "account data" }],
  "packs": []
}
JSON
