import assert from 'node:assert/strict';
import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { makeRepo, runBin, stateDir } from '../support/fixture.mjs';

const json = (result) => JSON.parse(result.stdout);
const decisions = (root, ...args) => runBin('ven-decisions', args, { cwd: root });

test('ven-decisions end refuses until a learning-check row exists', () => {
  const root = makeRepo();
  decisions(root, 'start', 'feature');
  const refused = decisions(root, 'end');
  assert.equal(refused.code, 1);
  assert.match(refused.stderr, /ven-decisions add --step learning-check/);
  assert.match(refused.stderr, /ven-decisions skip --step learning-check --reason R/);
  assert.equal(json(decisions(root, 'active')).playbook, 'feature');

  assert.equal(decisions(root, 'add', '--step', 'learning-check', '--decision', 'none', '--evidence', 'nothing durable').code, 0);
  assert.equal(decisions(root, 'end').code, 0);
  assert.equal(json(decisions(root, 'active')).playbook, null);
});

test('ven-decisions end accepts a skipped learning-check', () => {
  const root = makeRepo();
  decisions(root, 'start', 'fix');
  decisions(root, 'skip', '--step', 'learning-check', '--reason', 'trivial');
  assert.equal(decisions(root, 'end').code, 0);
});

test('a learning-check from an earlier run does not satisfy the next playbook', () => {
  const root = makeRepo();
  decisions(root, 'start', 'fix');
  decisions(root, 'skip', '--step', 'learning-check', '--reason', 'trivial');
  decisions(root, 'end');
  decisions(root, 'start', 'fix');
  assert.equal(decisions(root, 'end').code, 1);
});

test('pause and explain playbooks end without a learning-check', () => {
  for (const playbook of ['pause', 'explain']) {
    const root = makeRepo();
    decisions(root, 'start', playbook);
    assert.equal(decisions(root, 'end').code, 0, playbook);
  }
});

test('add --evidence with no value fails instead of recording "true"', () => {
  const root = makeRepo();
  const result = decisions(root, 'add', '--step', 's', '--decision', 'd', '--evidence');
  assert.equal(result.code, 2);
  assert.match(result.stderr, /--evidence needs a value/);
  assert.equal(decisions(root, 'list').stdout.trim(), '');
});

test('list filters by step and prints JSON on request', () => {
  const root = makeRepo();
  decisions(root, 'add', '--step', 'correction', '--decision', '"no, use the lib"', '--evidence', 'session abc', '--playbook', 'fix');
  decisions(root, 'add', '--step', 'verify', '--decision', 'passed', '--playbook', 'fix');
  const rows = json(decisions(root, 'list', '--step', 'correction', '--json'));
  assert.equal(rows.length, 1);
  assert.deepEqual({ step: rows[0].step, decision: rows[0].decision, evidence: rows[0].evidence }, { step: 'correction', decision: '"no, use the lib"', evidence: 'session abc' });
  assert.equal(decisions(root, 'list', '--step', 'correction').stdout.trim().split('\n').length, 1);
});

test('add keeps the steps already recorded in the playbook state', () => {
  const root = makeRepo();
  decisions(root, 'start', 'fix');
  decisions(root, 'add', '--step', 'reproduce', '--decision', 'reproduced');
  decisions(root, 'add', '--step', 'tdd', '--decision', 'red');
  const active = json(decisions(root, 'active'));
  assert.deepEqual(active.steps.map((step) => step.step), ['reproduce', 'tdd']);
  assert.equal(active.reproduced, true);
});

test('ven-decisions fails clearly on corrupt playbook state', () => {
  const root = makeRepo();
  decisions(root, 'start', 'fix');
  const folder = join(stateDir(root), 'state', 'worktrees');
  writeFileSync(join(folder, readdirSync(folder)[0]), '{ nope');
  const result = decisions(root, 'active');
  assert.equal(result.code, 1);
  assert.match(result.stderr, /ven-decisions: corrupt JSON in .*\.json/);
});

test('ven-decisions exit codes: usage 2, runtime failure 1', () => {
  const root = makeRepo();
  const bare = runBin('ven-decisions', [], { cwd: root });
  assert.equal(bare.code, 2);
  assert.match(bare.stderr, /ven-decisions: the decision log/);
  const unknown = runBin('ven-decisions', ['bogus'], { cwd: root });
  assert.equal(unknown.code, 2);
  assert.match(unknown.stderr, /unknown command bogus/);
  assert.equal(runBin('ven-decisions', ['list', '--bogus'], { cwd: root }).code, 2);
  assert.equal(runBin('ven-decisions', ['end'], { cwd: root }).code, 1);
});
