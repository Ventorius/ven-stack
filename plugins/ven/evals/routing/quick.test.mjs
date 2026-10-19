import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { buildPrompt, gradeReply, loadPlaybooks, runQuick } from './quick.mjs';

const playbooks = [{ name: 'feature', description: 'New behavior.' }, { name: 'bug-fix', description: 'Something is broken.' }];
const cases = [
  { name: 'feature-a', playbook: 'feature', task: 'Add CSV export' },
  { name: 'bugfix-b', playbook: 'bug-fix', task: 'Login 500s' },
];

// Always answers "feature", so only the feature case can pass.
const alwaysFeature = async () => ({ text: '**Playbook: feature** (core) - new', costUsd: 0.01 });

test('buildPrompt carries router body, every playbook description and the task', () => {
  const prompt = buildPrompt({ router: 'ROUTER BODY', playbooks, task: 'Add CSV export' });
  assert.match(prompt, /ROUTER BODY/);
  assert.match(prompt, /feature: New behavior\./);
  assert.match(prompt, /bug-fix: Something is broken\./);
  assert.match(prompt, /Add CSV export/);
  assert.match(prompt, /\*\*Playbook: <name>\*\*/);
});

test('gradeReply passes only the expected playbook name', () => {
  assert.equal(gradeReply('**Playbook: feature** (core) - new', 'feature'), true);
  assert.equal(gradeReply('**Playbook: bug-fix** (core)', 'feature'), false);
  assert.equal(gradeReply('nothing useful', 'feature'), false);
});

test('loadPlaybooks reads names and descriptions from the real playbook files', () => {
  const feature = loadPlaybooks().find((p) => p.name === 'feature');
  assert.ok(feature.description.startsWith('New or changed behavior'));
});

test('runQuick grades each case, honours filter and writes a results file', async () => {
  const resultsDir = mkdtempSync(join(tmpdir(), 'quick-'));
  const summary = await runQuick({ cases, playbooks, router: 'R', runner: alwaysFeature, concurrency: 2, filter: '', resultsDir, now: new Date('2026-10-19T10:00:00Z') });
  assert.deepEqual(summary.cases.map((c) => [c.name, c.pass]), [['feature-a', true], ['bugfix-b', false]]);
  assert.equal(summary.passRate, 0.5);
  assert.equal(summary.costUsd, 0.02);
  const files = readdirSync(resultsDir);
  assert.deepEqual(files, ['quick-2026-10-19T10-00-00-000Z.json']);
  assert.equal(JSON.parse(readFileSync(join(resultsDir, files[0]), 'utf8')).tier, 'quick');

  const filtered = await runQuick({ cases, playbooks, router: 'R', runner: alwaysFeature, concurrency: 1, filter: 'bugfix', resultsDir, now: new Date('2026-10-19T10:00:01Z') });
  assert.deepEqual(filtered.cases.map((c) => c.name), ['bugfix-b']);
});

test('runQuick counts a runner failure as a failed case', async () => {
  const resultsDir = mkdtempSync(join(tmpdir(), 'quick-'));
  const boom = async () => { throw new Error('rate limited'); };
  const summary = await runQuick({ cases: [cases[0]], playbooks, router: 'R', runner: boom, concurrency: 1, filter: '', resultsDir, now: new Date() });
  assert.equal(summary.cases[0].pass, false);
  assert.match(summary.cases[0].error, /rate limited/);
});
