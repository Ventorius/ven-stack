import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { buildPrompt, gradeReply, loadPlaybooks, loadRouter, runQuick } from './quick.mjs';

const DO_SKILL = join(import.meta.dirname, '..', '..', 'skills', 'do');

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
  assert.equal(gradeReply('**Playbook: investigation** - not a feature', 'feature'), false);
  assert.equal(gradeReply('**Playbook: bug-fix** (core)', 'fix'), false);
});

test('loadPlaybooks reads names and descriptions from the real playbook files', () => {
  const dir = join(DO_SKILL, 'playbooks');
  const files = readdirSync(dir).filter((file) => file.endsWith('.md')).sort();
  const loaded = loadPlaybooks();
  assert.deepEqual(loaded.map((p) => p.name), files.map((file) => file.replace(/\.md$/, '')));
  for (const { name, description } of loaded) {
    const text = readFileSync(join(dir, `${name}.md`), 'utf8');
    assert.ok(description.length > 0, name);
    assert.ok(text.includes(description), name);
    assert.doesNotMatch(description, /^"|"$/, name);
  }
});

test('loadRouter returns the router skill body without its frontmatter', () => {
  const raw = readFileSync(join(DO_SKILL, 'SKILL.md'), 'utf8');
  const router = loadRouter();
  assert.ok(raw.startsWith('---\n'));
  assert.doesNotMatch(router, /^---/);
  assert.doesNotMatch(router, /^name:/m);
  assert.equal(router, raw.slice(raw.indexOf('\n---\n', 3) + 5));
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

test('runQuick sends the runner the router, every playbook and the case task', async () => {
  const resultsDir = mkdtempSync(join(tmpdir(), 'quick-'));
  const prompts = [];
  const recording = async (prompt) => {
    prompts.push(prompt);
    return { text: '**Playbook: feature**', costUsd: 0 };
  };
  await runQuick({ cases, playbooks, router: 'ROUTER TEXT', runner: recording, concurrency: 1, filter: '', resultsDir, now: new Date() });
  assert.equal(prompts.length, 2);
  for (const prompt of prompts) {
    assert.match(prompt, /ROUTER TEXT/);
    assert.match(prompt, /- feature: New behavior\./);
    assert.match(prompt, /- bug-fix: Something is broken\./);
  }
  assert.match(prompts[0], /Task: Add CSV export/);
  assert.doesNotMatch(prompts[0], /Login 500s/);
  assert.match(prompts[1], /Task: Login 500s/);
});

test('runQuick never runs more cases at once than the concurrency limit', async () => {
  const resultsDir = mkdtempSync(join(tmpdir(), 'quick-'));
  const many = Array.from({ length: 7 }, (_, i) => ({ name: `case-${i}`, playbook: 'feature', task: `task ${i}` }));
  for (const limit of [1, 3]) {
    let inFlight = 0;
    let maxInFlight = 0;
    const slow = async () => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 10));
      inFlight--;
      return { text: '**Playbook: feature**', costUsd: 0 };
    };
    const summary = await runQuick({ cases: many, playbooks, router: 'R', runner: slow, concurrency: limit, filter: '', resultsDir, now: new Date() });
    assert.equal(summary.cases.length, 7);
    assert.equal(maxInFlight, limit);
  }
});

test('quick.mjs rejects a concurrency that is not a positive integer before running anything', () => {
  for (const bad of ['x', '0', '1.5']) {
    const result = spawnSync(process.execPath, [join(import.meta.dirname, 'quick.mjs'), '--concurrency', bad], { encoding: 'utf8' });
    assert.equal(result.status, 2, bad);
    assert.match(result.stderr, /--concurrency must be a positive integer/, bad);
  }
});
