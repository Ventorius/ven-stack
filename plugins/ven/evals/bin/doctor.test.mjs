import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { BASE_PROFILE, makeRepo, runBin, writeFile, writeState } from '../support/fixture.mjs';

const SETTINGS = { worktree: { baseRef: 'head' }, permissions: { allow: ['Bash(ven-profile:*)', 'Bash(ven-decisions:*)'] } };

function healthyRepo() {
  const root = makeRepo({ profile: null });
  runBin('ven-profile', ['write'], { cwd: root, input: JSON.stringify(BASE_PROFILE) });
  writeFile(root, '.claude/settings.local.json', JSON.stringify(SETTINGS));
  return root;
}

function doctor(root, args = [], configDir = mkdtempSync(join(tmpdir(), 'ven-claude-'))) {
  return runBin('ven-doctor', args, { cwd: root, env: { CLAUDE_CONFIG_DIR: configDir } });
}

test('ven-doctor reports a healthy repo without warnings and exits 0 even under --strict', () => {
  const root = healthyRepo();
  const plain = doctor(root);
  assert.equal(plain.code, 0, plain.stderr);
  assert.doesNotMatch(plain.stdout, /WARN/);
  assert.equal(doctor(root, ['--strict']).code, 0);
});

test('ven-doctor warns about worktree.baseRef; only --strict turns the warning into exit 1', () => {
  const root = makeRepo({ profile: null });
  runBin('ven-profile', ['write'], { cwd: root, input: JSON.stringify(BASE_PROFILE) });
  const plain = doctor(root);
  assert.equal(plain.code, 0);
  assert.match(plain.stdout, /WARN +worktree\.baseRef is not "head"/);
  assert.equal(doctor(root, ['--strict']).code, 1);
});

test('ven-doctor --json prints findings as JSON', () => {
  const root = makeRepo({ profile: null });
  const result = doctor(root, ['--json']);
  const { findings } = JSON.parse(result.stdout);
  assert.ok(findings.every((finding) => ['INFO', 'WARN', 'ERROR'].includes(finding.level) && typeof finding.message === 'string'));
  assert.ok(findings.some((finding) => finding.level === 'WARN' && /no ven profile/.test(finding.message)));
  assert.ok(findings.some((finding) => finding.level === 'INFO' && /skill listing/.test(finding.message)));
});

test('ven-doctor flags a profile whose manifest changed since it was stamped', () => {
  const root = healthyRepo();
  writeFile(root, 'package.json', '{"name":"changed"}\n');
  const result = doctor(root, ['--strict']);
  assert.equal(result.code, 1);
  assert.match(result.stdout, /WARN +profile stale: package\.json/);
});

test('ven-doctor lists unverified commands and colliding personal skills', () => {
  const root = healthyRepo();
  const configDir = mkdtempSync(join(tmpdir(), 'ven-claude-'));
  writeFile(configDir, 'skills/tdd/SKILL.md', '---\nname: tdd\ndescription: my own tdd\n---\nbody\n');
  runBin('ven-profile', ['set', 'commands.lint', '{"run":"x","status":"unverified"}'], { cwd: root });
  const result = doctor(root, [], configDir);
  assert.match(result.stdout, /WARN +personal .* also defines: tdd/);
  assert.match(result.stdout, /"tdd": "off"/);
  assert.match(result.stdout, /INFO +commands not verified: commands\.lint \(unverified\)/);
});

test('ven-doctor reports a corrupt profile as an error and exits 1', () => {
  const root = healthyRepo();
  writeState(root, 'profile.json', '{ nope');
  const result = doctor(root);
  assert.equal(result.code, 1);
  assert.match(result.stdout, /ERROR +.*corrupt JSON in .*profile\.json/);
});

test('ven-doctor usage errors exit 2', () => {
  const root = makeRepo();
  assert.equal(doctor(root, ['--bogus']).code, 2);
  assert.equal(doctor(root, ['extra']).code, 2);
  assert.equal(doctor(root, ['--strict=1']).code, 2);
});

test('ven-doctor --help and -h print usage to stdout and exit 0', () => {
  const root = makeRepo();
  for (const flag of ['--help', '-h']) {
    const result = doctor(root, [flag]);
    assert.equal(result.code, 0, flag);
    assert.match(result.stdout, /ven-doctor: check the ven install/, flag);
    assert.equal(result.stderr, '', flag);
  }
});

test('ven-doctor names corrupt state files and how to fix them', () => {
  for (const folder of ['sessions', 'worktrees', 'baselines']) {
    const root = healthyRepo();
    const path = writeState(root, `state/${folder}/broken.json`, '{ nope');
    const result = doctor(root);
    assert.equal(result.code, 1, folder);
    assert.match(result.stdout, /ERROR +/, folder);
    assert.ok(result.stdout.includes(`corrupt JSON in ${path}`), folder);
    assert.match(result.stdout, /delete the file/, folder);
  }
});

test('ven-doctor accepts valid state files', () => {
  const root = healthyRepo();
  writeState(root, 'state/sessions/ok.json', '{"a":1}');
  writeState(root, 'state/baselines/ok.json', '{}');
  assert.equal(doctor(root, ['--strict']).code, 0);
});

test('ven-doctor flags a decisions.tsv with a wrong header or ragged rows', () => {
  const header = 'ts\tworktree\tplaybook\tstep\tdecision\tevidence';
  const cases = {
    'missing header': 'a\tb\tc\td\te\tf\n',
    'ragged row': `${header}\n2026-01-01\troot\tfix\tstep\n`,
  };
  for (const [name, content] of Object.entries(cases)) {
    const root = healthyRepo();
    const path = writeState(root, 'decisions.tsv', content);
    const result = doctor(root);
    assert.equal(result.code, 1, name);
    assert.match(result.stdout, /ERROR +.*malformed decisions\.tsv/, name);
    assert.ok(result.stdout.includes(path), name);
    assert.match(result.stdout, /move it aside/, name);
  }
  const root = healthyRepo();
  writeState(root, 'decisions.tsv', `${header}\n2026-01-01\troot\tfix\tstep\tdone\t\n`);
  assert.equal(doctor(root, ['--strict']).code, 0);
});
