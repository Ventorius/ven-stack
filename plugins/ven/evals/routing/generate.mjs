#!/usr/bin/env node
// Regenerates one `claude plugin eval` case directory per entry in cases.json.
// Run after editing cases.json: bun plugins/ven/evals/routing/generate.mjs
import { chmodSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const cases = JSON.parse(readFileSync(join(here, 'cases.json'), 'utf8'));
const scaffold = readFileSync(join(here, 'scaffold.sh'), 'utf8');

const prompt = ({ name, playbook, task }) => `---
name: routing-${name}
description: Router picks the ${playbook} playbook.
tags: [routing]
runs: 3
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
env: { EVAL_VEN_STATE_DIR: ".ven-state" }
append_system_prompt: "Routing evaluation. After you write the line that names the playbook, stop: do not create tasks, run steps, spawn agents or edit files."
---
/ven:do ${task}
`;

const grader = (playbook) => `---
type: regex
target: last_message
pattern: 'Playbook: ${playbook}\\*\\*'
---
The router's first line names the ${playbook} playbook.
`;

for (const entry of cases) {
  const dir = join(here, entry.name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, 'graders'), { recursive: true });
  writeFileSync(join(dir, 'prompt.md'), prompt(entry));
  writeFileSync(join(dir, 'case.yaml'), `schema_version: "1.1"\nname: routing-${entry.name}\ncontext:\n  scaffold_script: scaffold.sh\n`);
  writeFileSync(join(dir, 'scaffold.sh'), scaffold);
  chmodSync(join(dir, 'scaffold.sh'), 0o755);
  writeFileSync(join(dir, 'graders', 'picks-playbook.md'), grader(entry.playbook));
}
console.log(`wrote ${cases.length} routing cases`);
