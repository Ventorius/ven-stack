import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { BASE_PROFILE, makeRepo, runBin } from '../support/fixture.mjs';

const freshHome = () => mkdtempSync(join(tmpdir(), 'ven-home-'));
const config = (args, { cwd, home }) => runBin('ven-profile', ['config', ...args], { cwd, env: { VEN_HOME: home } });

test('config prints defaults when nothing is set', () => {
  const home = freshHome();
  const result = config([], { cwd: tmpdir(), home });
  assert.equal(result.code, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { orchestrator_model: 'inherit', coder_model: 'inherit', swarm_model: 'inherit', budget_tier: 'standard' });
  assert.equal(config(['swarm_model'], { cwd: tmpdir(), home }).stdout.trim(), 'inherit');
});

test('config <key> <value> writes the per-user file and takes any model name', () => {
  const home = freshHome();
  assert.equal(config(['swarm_model', 'some-small-model'], { cwd: tmpdir(), home }).code, 0);
  assert.equal(JSON.parse(readFileSync(join(home, 'config.json'), 'utf8')).swarm_model, 'some-small-model');
  assert.equal(config(['swarm_model'], { cwd: tmpdir(), home }).stdout.trim(), 'some-small-model');
});

test('config rejects unknown keys and budget tiers', () => {
  const home = freshHome();
  assert.equal(config(['color', 'blue'], { cwd: tmpdir(), home }).code, 2);
  const tier = config(['budget_tier', 'huge'], { cwd: tmpdir(), home });
  assert.equal(tier.code, 1);
  assert.match(tier.stderr, /budget_tier must be one of lean, standard, max/);
});

test('a repo profile budget_tier overrides the per-user one', () => {
  // VEN_HOME also locates the repo state, so this case shares the fixture's home.
  const home = process.env.VEN_HOME;
  writeFileSync(join(home, 'config.json'), JSON.stringify({ budget_tier: 'lean' }));
  const root = makeRepo({ profile: { ...BASE_PROFILE, budget_tier: 'max' } });
  assert.equal(config(['budget_tier'], { cwd: root, home }).stdout.trim(), 'max');
  assert.equal(config(['budget_tier'], { cwd: tmpdir(), home }).stdout.trim(), 'lean');
});

test('a corrupt config file names the file', () => {
  const home = freshHome();
  writeFileSync(join(home, 'config.json'), '{nope');
  const result = config([], { cwd: tmpdir(), home });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /config\.json/);
});
