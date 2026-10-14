#!/usr/bin/env bash
# Routing fixture: an onboarded repo whose profile lists every playbook of this pack, so the router weighs them against core.
set -euo pipefail
pack_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
git init -q -b main
git config user.email eval@example.com
git config user.name eval

{{write the files the task names, matching the pack's applies_when paths}}

git add -A
git commit -q -m init
# EVAL_VEN_STATE_DIR (set in prompt.md) points ven at .ven-state/ inside the run's workspace.
echo '.ven-state/' >> .git/info/exclude
playbooks="$PWD/.ven-state/packs/{{pack}}/playbooks"
mkdir -p "$playbooks"
cp "$pack_dir"/playbooks/*.md "$playbooks/"
listed=""
for file in "$playbooks"/*.md; do listed="$listed\"$file\","; done
cat > .ven-state/profile.json <<JSON
{
  "schema_version": 1,
  "generated_at": "2099-01-01T00:00:00.000Z",
  "repo": { "name": "{{repo}}", "default_branch": "main", "forge": { "kind": "none", "cli": "" }, "tracker": { "kind": "none", "how": "none" } },
  "stack": { "languages": [], "frameworks": [], "package_manager": "", "typed": false, "sources": [] },
  "commands": { "test": { "all": { "run": "true", "status": "verified" } } },
  "verify": { "logic": "commands.test.all" },
  "tests": { "patterns": [] },
  "docs_only": ["**/*.md"],
  "packs": [{ "name": "{{pack}}", "kind": "{{kind}}", "plugin": "{{repo}}-{{pack}}@{{marketplace}}", "applies_when": {{applies_when from pack.json}}, "skills": {{skills from pack.json, as a list of names}}, "playbooks": [${listed%,}] }]
}
JSON
