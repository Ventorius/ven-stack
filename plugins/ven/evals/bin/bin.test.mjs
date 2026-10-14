import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { BASE_PROFILE, makeRepo, runBin, writeFile, writeState } from '../support/fixture.mjs';

const json = (result) => JSON.parse(result.stdout);

test('ven-profile write validates and get/set round-trip', () => {
  const root = makeRepo({ profile: null });
  const invalid = runBin('ven-profile', ['write'], { cwd: root, input: JSON.stringify({ commands: { build: { run: 'x', status: 'maybe' } } }) });
  assert.equal(invalid.code, 1);
  assert.match(invalid.stderr, /status must be verified, unverified or manual/);

  assert.equal(runBin('ven-profile', ['write'], { cwd: root, input: JSON.stringify(BASE_PROFILE) }).code, 0);
  assert.equal(runBin('ven-profile', ['get', 'commands.test.all.status'], { cwd: root }).stdout.trim(), 'verified');
  assert.equal(runBin('ven-profile', ['set', 'risk_areas', '[{"path":"src/**","why":"core"}]'], { cwd: root }).code, 0);
  assert.deepEqual(json(runBin('ven-profile', ['get', 'risk_areas'], { cwd: root })), [{ path: 'src/**', why: 'core' }]);
  assert.equal(runBin('ven-profile', ['get', 'nope'], { cwd: root }).code, 1);
});

test('ven-profile run fills {file} and returns the command exit code', () => {
  const root = makeRepo({
    profile: { ...BASE_PROFILE, commands: { test: { single: { run: 'node -e "console.log(process.argv[1])" {file}', status: 'verified' } } } },
  });
  const result = runBin('ven-profile', ['run', 'test.single', '--file', "src/it's.js"], { cwd: root });
  assert.equal(result.code, 0);
  assert.equal(result.stdout.trim(), "src/it's.js");
  assert.equal(runBin('ven-profile', ['run', 'failing'], { cwd: makeRepo() }).code, 3);
});

test('ven-profile prove marks commands verified or unverified and skips manual ones', () => {
  const root = makeRepo({
    profile: {
      ...BASE_PROFILE,
      commands: {
        build: { run: 'node -e "process.exit(0)"', status: 'unverified' },
        lint: { run: 'node -e "console.error(\'boom\'); process.exit(1)"', status: 'unverified' },
        run: { run: 'sleep 100', status: 'manual' },
      },
    },
  });
  const result = runBin('ven-profile', ['prove'], { cwd: root });
  assert.match(result.stdout, /ok +commands\.build/);
  assert.match(result.stdout, /FAIL +commands\.lint/);
  assert.match(result.stdout, /skip +commands\.run \(manual\)/);
  const profile = json(runBin('ven-profile', ['show'], { cwd: root }));
  assert.equal(profile.commands.build.status, 'verified');
  assert.equal(profile.commands.lint.status, 'unverified');
  assert.match(profile.commands.lint.failure_tail, /boom/);
});

test('ven-profile prove covers workspace commands, file commands with --file, and keeps source evidence', () => {
  const root = makeRepo({
    profile: {
      ...BASE_PROFILE,
      commands: {
        test: { single: { run: 'node -e "process.exit(require(\'fs\').existsSync(process.argv[1]) ? 0 : 1)" {file}', status: 'unverified', evidence: 'package.json#scripts.test' } },
      },
      workspaces: [{ name: 'api', path: 'src', commands: { build: { run: 'node -e "process.exit(0)"', status: 'unverified' } } }],
    },
  });
  assert.match(runBin('ven-profile', ['prove'], { cwd: root }).stdout, /skip +commands\.test\.single \(needs a file argument/);
  assert.match(runBin('ven-profile', ['prove', 'workspaces.api.commands.build'], { cwd: root }).stdout, /ok +workspaces\.api\.commands\.build/);
  assert.match(runBin('ven-profile', ['prove', 'test.single', '--file', 'src/app.js'], { cwd: root }).stdout, /ok +commands\.test\.single/);

  const profile = json(runBin('ven-profile', ['show'], { cwd: root }));
  assert.equal(profile.workspaces[0].commands.build.status, 'verified');
  assert.equal(profile.commands.test.single.status, 'verified');
  assert.equal(profile.commands.test.single.evidence, 'package.json#scripts.test');
  assert.match(profile.commands.test.single.proof, /^exit 0/);
  assert.equal(runBin('ven-profile', ['run', 'workspaces.api.commands.build'], { cwd: root }).code, 0);
});

test('ven-profile fresh reports manifests changed after generation', () => {
  const root = makeRepo();
  assert.equal(runBin('ven-profile', ['fresh'], { cwd: root }).code, 1);
  runBin('ven-profile', ['set', 'generated_at', new Date(Date.now() + 60000).toISOString()], { cwd: root });
  assert.equal(runBin('ven-profile', ['fresh'], { cwd: root }).code, 0);
});

test('ven-profile packs-for filters packs by applies_when paths', () => {
  const root = makeRepo({
    profile: {
      ...BASE_PROFILE,
      packs: [
        { name: 'orm', plugin: 'repo-orm@local', applies_when: { paths: ['src/db/**'] }, skills: ['query-rules'] },
        { name: 'domain', plugin: 'repo-domain@local', applies_when: { paths: ['src/accounts/**'] }, skills: [] },
      ],
    },
  });
  const matched = json(runBin('ven-profile', ['packs-for', 'src/db/schema.js'], { cwd: root }));
  assert.deepEqual(matched.map((pack) => pack.name), ['orm']);
});

test('ven-profile adapter runs verified adapters and exits 3 otherwise', () => {
  const root = makeRepo();
  writeState(root, 'adapters.json', JSON.stringify({
    'code.search': { run: 'node -e "console.log(\'hit:\' + process.argv[1])" {pattern}', status: 'verified' },
    'graph.imports': { run: 'echo nope', status: 'unverified' },
  }));
  const hit = runBin('ven-profile', ['adapter', 'code.search', '--var', 'pattern=needle'], { cwd: root });
  assert.equal(hit.code, 0);
  assert.equal(hit.stdout.trim(), 'hit:needle');
  assert.equal(runBin('ven-profile', ['adapter', 'graph.imports'], { cwd: root }).code, 3);
  assert.equal(runBin('ven-profile', ['adapter', 'schema.read'], { cwd: root }).code, 3);
});

test('ven-profile init and detect describe the repo without a profile', () => {
  const root = makeRepo({ profile: null });
  writeFile(root, '.github/workflows/ci.yml', 'on: push\n');
  writeFile(root, 'vitest.config.ts', 'export default {}\n');
  const dir = runBin('ven-profile', ['init'], { cwd: root }).stdout.trim();
  const marketplace = JSON.parse(readFileSync(join(dir, 'packs', '.claude-plugin', 'marketplace.json'), 'utf8'));
  assert.match(marketplace.name, /^ven-local-ven-fixture-/);
  const detected = json(runBin('ven-profile', ['detect'], { cwd: root }));
  assert.deepEqual(detected.signals.manifests, ['package.json']);
  assert.deepEqual(detected.signals.ci, ['.github/workflows/ci.yml']);
  assert.deepEqual(detected.signals.tests, ['vitest.config.ts']);
});

test('ven-decisions tracks the active playbook, steps and skips', () => {
  const root = makeRepo();
  assert.equal(runBin('ven-decisions', ['start', 'feature'], { cwd: root }).code, 0);
  runBin('ven-decisions', ['add', '--step', 'grilling', '--decision', 'scope settled', '--evidence', 'spec.md'], { cwd: root });
  runBin('ven-decisions', ['skip', '--step', 'review', '--reason', 'docs only'], { cwd: root });
  const active = json(runBin('ven-decisions', ['active'], { cwd: root }));
  assert.equal(active.playbook, 'feature');
  assert.deepEqual(active.steps.map((step) => step.decision), ['scope settled', 'skip: docs only']);
  runBin('ven-decisions', ['end', '--outcome', 'done'], { cwd: root });
  assert.equal(json(runBin('ven-decisions', ['active'], { cwd: root })).playbook, null);
  const rows = runBin('ven-decisions', ['list', '--playbook', 'feature'], { cwd: root }).stdout.trim().split('\n');
  assert.equal(rows.length, 4);
});

function makePlugin(skills) {
  const root = mkdtempSync(join(tmpdir(), 'ven-lint-'));
  for (const [path, content] of Object.entries(skills)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

const skill = (name, layer, body, extra = '') => `---\nname: ${name}\ndescription: ${name} does a thing. Use when testing.\n${extra}metadata:\n  layer: ${layer}\n---\n${body}\n`;

test('ven-lint-skills passes a well-formed plugin', () => {
  const root = makePlugin({
    'skills/router/SKILL.md': skill('router', 'L5', 'Pick a playbook.', 'disable-model-invocation: true\n'),
    'skills/router/playbooks/fix.md': '---\nname: fix\ndescription: fix things\n---\n1. **work**\n2. **careful**\n',
    'skills/work/SKILL.md': skill('work', 'L3', 'Apply **careful**. Then run **other**.'),
    'skills/other/SKILL.md': skill('other', 'L3', 'Standalone workflow.'),
    'skills/careful/SKILL.md': skill('careful', 'L2', 'Be careful.'),
  });
  const result = runBin('ven-lint-skills', ['--root', root]);
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /ok: 5 skills\/playbooks/);
});

test('ven-lint-skills catches direction, invocation, cycles, denylist, duplicates and depth', () => {
  const repeated = 'This sentence is long enough to count for duplicates.\nAnd this second line is also long enough to count.\nA third long line makes the window of three complete.';
  const root = makePlugin({
    'skills/router/SKILL.md': skill('router', 'L5', 'Suggest /ven:helper, then call `helper`.', 'disable-model-invocation: true\n'),
    'skills/helper/SKILL.md': skill('helper', 'L5', 'Help.', 'disable-model-invocation: true\n'),
    'skills/careful/SKILL.md': skill('careful', 'L2', 'Run **work** after.'),
    'skills/work/SKILL.md': skill('work', 'L3', `Run **loop** and deploy with Stripe.\n${repeated}`),
    'skills/loop/SKILL.md': skill('loop', 'L3', `Run **work**.\n${repeated}`),
    'skills/loop/references/deep.md': 'See [more](more.md).',
    'skills/long/SKILL.md': skill('long', 'L3', 'line\n'.repeat(160)),
  });
  const { code, stderr } = runBin('ven-lint-skills', ['--root', root]);
  assert.equal(code, 1);
  assert.match(stderr, /user-invoked router references user-invoked helper/);
  assert.doesNotMatch(stderr, /ven:helper/);
  assert.match(stderr, /careful \(L2\) references work \(L3\)/);
  assert.match(stderr, /cycle: (work -> loop -> work|loop -> work -> loop)/);
  assert.match(stderr, /core names "Stripe"/);
  assert.match(stderr, /repeats 3\+ lines/);
  assert.match(stderr, /keep references one hop deep/);
  assert.match(stderr, /lines, limit 150/);
});
