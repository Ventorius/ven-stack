import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, delimiter, join } from 'node:path';
import { test } from 'node:test';
import { BASE_PROFILE, NODE, SCRIPTS_DIR, makeRepo, runBin, writeFile, writeState } from '../support/fixture.mjs';

// Tests share the fixture's VEN_HOME, which also holds repo state; install links tools into its bin/.
const home = process.env.VEN_HOME;
spawnSync(NODE, [join(SCRIPTS_DIR, 'install.mjs')], { env: process.env });
const PATH_WITH_TOOLS = [join(home, 'bin'), dirname(NODE), '/usr/bin', '/bin'].join(delimiter);
const PATH_WITHOUT_TOOLS = [dirname(NODE), '/usr/bin', '/bin'].join(delimiter);

function healthyRepo() {
  const root = makeRepo({ profile: null });
  runBin('ven-profile', ['write'], { cwd: root, input: JSON.stringify(BASE_PROFILE) });
  return root;
}

const doctor = (root, args = [], path = PATH_WITH_TOOLS) => runBin('ven-doctor', args, { cwd: root, env: { PATH: path } });

test('ven-doctor reports a healthy repo without warnings and exits 0 even under --strict', () => {
  const root = healthyRepo();
  const plain = doctor(root);
  assert.equal(plain.code, 0, plain.stderr);
  assert.doesNotMatch(plain.stdout, /WARN|ERROR/);
  assert.equal(doctor(root, ['--strict']).code, 0);
});

test('ven-doctor warns when the tools are not on PATH and names the installer', () => {
  const root = healthyRepo();
  const result = doctor(root, [], PATH_WITHOUT_TOOLS);
  assert.equal(result.code, 0);
  assert.match(result.stdout, /WARN +ven-decisions, .*ven-profile.* not on PATH; run node .*install\.mjs/);
  assert.equal(doctor(root, ['--strict'], PATH_WITHOUT_TOOLS).code, 1);
});

test('ven-doctor --json prints findings as JSON and treats a missing profile as normal', () => {
  const root = makeRepo({ profile: null });
  const { findings } = JSON.parse(doctor(root, ['--json']).stdout);
  assert.ok(findings.every((finding) => ['INFO', 'WARN', 'ERROR'].includes(finding.level) && typeof finding.message === 'string'));
  assert.ok(findings.some((finding) => finding.level === 'INFO' && /no ven profile/.test(finding.message)));
  assert.ok(findings.some((finding) => finding.level === 'INFO' && /node v\d+/.test(finding.message)));
});

test('ven-doctor flags a profile whose manifest changed since it was stamped', () => {
  const root = healthyRepo();
  writeFile(root, 'package.json', '{"name":"changed"}\n');
  const result = doctor(root, ['--strict']);
  assert.equal(result.code, 1);
  assert.match(result.stdout, /WARN +profile stale: package\.json/);
});

test('ven-doctor lists unverified commands', () => {
  const root = healthyRepo();
  runBin('ven-profile', ['set', 'commands.lint', '{"run":"x","status":"unverified"}'], { cwd: root });
  assert.match(doctor(root).stdout, /INFO +commands not verified: commands\.lint \(unverified\)/);
});

test('ven-doctor points at migrate when an older ven left state behind', () => {
  const root = healthyRepo();
  writeState(root, 'map.md', '# Map\n');
  const result = doctor(root, ['--strict']);
  assert.equal(result.code, 1);
  assert.match(result.stdout, /WARN +state from an older ven version: .*map\.md.*; run ven-profile migrate/);
});

test('ven-doctor reports a corrupt profile or config as an error and exits 1', () => {
  const root = healthyRepo();
  writeState(root, 'profile.json', '{ nope');
  const result = doctor(root);
  assert.equal(result.code, 1);
  assert.match(result.stdout, /ERROR +.*corrupt JSON in .*profile\.json/);

  const other = healthyRepo();
  writeFile(home, 'config.json', '{"budget_tier":"huge"}');
  const config = doctor(other);
  writeFile(home, 'config.json', '{}');
  assert.equal(config.code, 1);
  assert.match(config.stdout, /ERROR +.*budget_tier must be one of lean, standard, max/);
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

test('ven-doctor names a corrupt playbook state file and how to fix it', () => {
  const root = healthyRepo();
  const path = writeState(root, 'state/worktrees/broken.json', '{ nope');
  const result = doctor(root);
  assert.equal(result.code, 1);
  assert.ok(result.stdout.includes(`corrupt JSON in ${path}`));
  assert.match(result.stdout, /delete the file/);
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
