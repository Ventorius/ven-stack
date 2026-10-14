#!/usr/bin/env bash
# Fixture repo: one entity with four states declared as constants and three transitions.
set -euo pipefail
git init -q -b main
git config user.email eval@example.com
git config user.name eval
mkdir -p src/orders
cat > src/orders/status.js <<'JS'
export const STATUS = { DRAFT: "draft", PLACED: "placed", SHIPPED: "shipped", CANCELLED: "cancelled" };
JS
cat > src/orders/order.js <<'JS'
import { STATUS } from "./status.js";
export function createOrder() { return { status: STATUS.DRAFT }; }
export function place(order) {
  if (order.status !== STATUS.DRAFT) throw new Error("not a draft");
  order.status = STATUS.PLACED;
}
export function ship(order) {
  if (order.status !== STATUS.PLACED) throw new Error("not placed");
  order.status = STATUS.SHIPPED;
}
export function cancel(order) {
  if (order.status === STATUS.SHIPPED) throw new Error("already shipped");
  order.status = STATUS.CANCELLED;
}
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
