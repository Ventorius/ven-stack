// Fixture test for the {{capability}} adapter: run it on a small copy of real repo files and compare stdout byte for byte.
// Layout: adapters/fixtures/{{adapter}}/repo/ (the files) and adapters/fixtures/{{adapter}}/expected.txt (the exact output, written by hand).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, '{{adapter}}.mjs');
const fixture = join(here, 'fixtures', '{{adapter}}');

// The adapter lists files with git, and the fixture lives outside any work tree of its own, so each run gets a fresh one.
function fixtureRepo() {
  const root = mkdtempSync(join(tmpdir(), 'ven-adapter-'));
  cpSync(join(fixture, 'repo'), root, { recursive: true });
  for (const args of [['init', '-q'], ['add', '-A']]) spawnSync('git', args, { cwd: root });
  return root;
}

function runAdapter(...args) {
  return spawnSync(process.execPath, [script, `--root=${fixtureRepo()}`, ...args], { encoding: 'utf8' });
}

test('{{capability}} prints the expected output for the fixture', () => {
  const result = runAdapter({{the arguments the fixture needs, e.g. '--file=src/widgets/index.js' or '--pattern=widget'}});
  assert.equal(result.status, {{0, or 1 for a rule capability whose fixture holds a violation}}, result.stderr);
  assert.equal(result.stdout, readFileSync(join(fixture, 'expected.txt'), 'utf8'));
});

test('{{capability}} accepts a bare run the way ven-profile prove-adapters makes it', () => {
  const result = runAdapter('--file=', '--pattern={pattern}');
  assert.notEqual(result.status, 2, result.stderr);
});
