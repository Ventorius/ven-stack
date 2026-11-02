import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdtempSync, readlinkSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { test } from 'node:test';
import { NODE, SCRIPTS_DIR } from '../support/fixture.mjs';

const TOOLS = ['ven-decisions', 'ven-doctor', 'ven-lint-skills', 'ven-profile', 'ven-transcripts'];

function install(home, { path = '/usr/bin:/bin' } = {}) {
  const result = spawnSync(NODE, [join(SCRIPTS_DIR, 'install.mjs')], { encoding: 'utf8', env: { ...process.env, VEN_HOME: home, PATH: path } });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

test('install links every ven tool into VEN_HOME/bin and prints the PATH line when missing', () => {
  const home = mkdtempSync(join(tmpdir(), 'ven-home-'));
  const result = install(home);
  assert.equal(result.code, 0, result.stderr);
  for (const tool of TOOLS) {
    const link = join(home, 'bin', tool);
    assert.ok(lstatSync(link).isSymbolicLink(), tool);
    assert.equal(readlinkSync(link), realpathSync(join(SCRIPTS_DIR, tool)), tool);
  }
  assert.match(result.stdout, new RegExp(`export PATH="${join(home, 'bin').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\$PATH"`));
});

test('the linked tools run through the link', () => {
  const home = mkdtempSync(join(tmpdir(), 'ven-home-'));
  install(home);
  const result = spawnSync(join(home, 'bin', 'ven-profile'), ['--help'], { encoding: 'utf8', env: { ...process.env, VEN_HOME: home } });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /ven-profile: the repo profile/);
});

test('install is idempotent and reports the bin dir on PATH', () => {
  const home = mkdtempSync(join(tmpdir(), 'ven-home-'));
  install(home);
  const again = install(home, { path: [join(home, 'bin'), '/usr/bin', '/bin'].join(delimiter) });
  assert.equal(again.code, 0, again.stderr);
  assert.match(again.stdout, /already on PATH/);
  assert.doesNotMatch(again.stdout, /export PATH/);
});

test('install repoints links to another install and removes dangling ven links', () => {
  const home = mkdtempSync(join(tmpdir(), 'ven-home-'));
  install(home);
  const elsewhere = mkdtempSync(join(tmpdir(), 'ven-old-'));
  writeFileSync(join(elsewhere, 'ven-profile'), '#!/bin/sh\n');
  const link = join(home, 'bin', 'ven-profile');
  spawnSync('rm', [link]);
  symlinkSync(join(elsewhere, 'ven-profile'), link);
  symlinkSync(join(elsewhere, 'ven-gone'), join(home, 'bin', 'ven-new-skill'));

  const result = install(home);
  assert.equal(result.code, 0, result.stderr);
  assert.equal(readlinkSync(link), realpathSync(join(SCRIPTS_DIR, 'ven-profile')));
  assert.equal(existsSync(join(home, 'bin', 'ven-new-skill')), false);
  assert.match(result.stdout, /removed .*ven-new-skill/);
});

test('install refuses to replace a regular file it did not create', () => {
  const home = mkdtempSync(join(tmpdir(), 'ven-home-'));
  install(home);
  const path = join(home, 'bin', 'ven-doctor');
  spawnSync('rm', [path]);
  writeFileSync(path, 'mine\n');
  const result = install(home);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /ven-doctor is a regular file/);
});
