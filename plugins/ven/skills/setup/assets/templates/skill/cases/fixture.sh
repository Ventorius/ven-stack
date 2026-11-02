#!/usr/bin/env bash
# Fixture repo for one skill's cases: the smallest copy of the situation the evidence shows, onboarded with a ven profile.
# Copy this file into each case directory; case.yaml names it as the scaffold_script.
set -euo pipefail
git init -q -b main
git config user.email eval@example.com
git config user.name eval

{{write the files the task needs, matching the skill's paths, e.g. mkdir -p src/widgets && printf 'export const widget = 1;\n' > src/widgets/index.js}}

git add -A
git commit -q -m init
# EVAL_VEN_STATE_DIR (set in prompt.md) points ven at .ven-state/ inside the run's workspace.
echo '.ven-state/' >> .git/info/exclude
mkdir -p .ven-state
cat > .ven-state/profile.json <<'JSON'
{
  "schema_version": 1,
  "generated_at": "2099-01-01T00:00:00.000Z",
  "repo": { "name": "{{repo}}", "default_branch": "main", "forge": { "kind": "none", "cli": "" }, "tracker": { "kind": "none", "how": "none" } },
  "stack": { "languages": [], "frameworks": [], "package_manager": "", "typed": false, "sources": [] },
  "commands": {{the commands the task needs, copied from `ven-profile get commands`, each with "status": "verified"}},
  "verify": {},
  "tests": { "patterns": [] },
  "docs_only": ["**/*.md"],
  "packs": [{ "name": "{{pack}}", "kind": "{{kind}}", "plugin": "{{repo}}-{{pack}}@{{marketplace}}", "applies_when": {{applies_when from pack.json}}, "skills": ["{{skill}}"], "playbooks": [] }]
}
JSON
