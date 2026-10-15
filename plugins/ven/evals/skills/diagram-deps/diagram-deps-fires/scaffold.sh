#!/usr/bin/env bash
# Fixture repo: a small service with three modules and a verified import-graph adapter.
set -euo pipefail
git init -q -b main
git config user.email eval@example.com
git config user.name eval
mkdir -p src/api src/core src/store tools
printf 'import { price } from "../core/price.js";\nimport { load } from "../store/db.js";\nexport const handle = () => price(load());\n' > src/api/handler.js
printf 'import { load } from "../store/db.js";\nexport const price = (x) => x * 2 + load();\n' > src/core/price.js
printf 'export const load = () => 1;\n' > src/store/db.js
cat > tools/graph.mjs <<'JS'
console.log(JSON.stringify([
  { from: "src/api/handler.js", to: "src/core/price.js" },
  { from: "src/api/handler.js", to: "src/store/db.js" },
  { from: "src/core/price.js", to: "src/store/db.js" }
]));
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
cat > .ven-state/adapters.json <<'JSON'
{
  "graph.imports": { "run": "node tools/graph.mjs", "status": "verified", "evidence": "tools/graph.mjs" }
}
JSON
