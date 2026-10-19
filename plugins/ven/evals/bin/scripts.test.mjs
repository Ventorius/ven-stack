import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { PLUGIN_ROOT } from '../support/fixture.mjs';

const REPO = join(PLUGIN_ROOT, '..', '..');
const script = (name) => join(REPO, 'scripts', name);
const run = (file, args, env = {}) =>
  spawnSync(process.execPath, [file, ...args], { encoding: 'utf8', env: { ...process.env, ...env } });

function write(root, path, content) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
}

function noticesTree() {
  const root = mkdtempSync(join(tmpdir(), 'ven-notices-'));
  write(root, 'docs/build/notices/_preamble.md', '# Notices\n');
  write(root, 'docs/build/notices/_license.md', '## MIT License\n\ntext\n');
  write(
    root,
    'docs/build/notices/_upstreams.json',
    JSON.stringify([
      { repo: 'a/one', sha: 'aaa1111', copyright: ['Copyright (c) 1 One.'] },
      { repo: 'b/two', sha: 'bbb2222', copyright: [] },
    ]),
  );
  write(root, 'docs/build/notices/g1.md', '# group\n\n- b/two — plugins/ven/skills/z/ adapted from z.md\n- a/one (MIT) — plugins/ven/skills/y/ adapted from y.md\n');
  write(root, 'docs/build/notices/g2.md', '- a/one — plugins/ven/skills/x/ adapted from x.md\n- a/one — plugins/ven/skills/x/ adapted from x.md\n');
  return root;
}

test('build-notices groups lines by upstream, sorted and deduplicated', () => {
  const root = noticesTree();
  const result = run(script('build-notices.mjs'), ['--root', root]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    readFileSync(join(root, 'THIRD_PARTY_NOTICES.md'), 'utf8'),
    [
      '# Notices',
      '',
      '## a/one @ aaa1111',
      '',
      'Copyright (c) 1 One.',
      '',
      '- plugins/ven/skills/x/ adapted from x.md',
      '- plugins/ven/skills/y/ adapted from y.md',
      '',
      '## b/two @ bbb2222',
      '',
      '- plugins/ven/skills/z/ adapted from z.md',
      '',
      '## MIT License',
      '',
      'text',
      '',
    ].join('\n'),
  );
});

test('build-notices rejects a line from an upstream with no pinned SHA', () => {
  const root = noticesTree();
  write(root, 'docs/build/notices/g3.md', '- c/three — plugins/ven/skills/q/ adapted from q.md\n');
  const result = run(script('build-notices.mjs'), ['--root', root]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /c\/three/);
});

test('build-notices --check fails when the committed file drifted', () => {
  const root = noticesTree();
  assert.equal(run(script('build-notices.mjs'), ['--root', root]).status, 0);
  assert.equal(run(script('build-notices.mjs'), ['--root', root, '--check']).status, 0);
  writeFileSync(join(root, 'THIRD_PARTY_NOTICES.md'), 'stale\n');
  assert.equal(run(script('build-notices.mjs'), ['--root', root, '--check']).status, 1);
});

test('the committed THIRD_PARTY_NOTICES.md matches the generator', () => {
  const result = run(script('build-notices.mjs'), ['--check']);
  assert.equal(result.status, 0, `${result.stderr}\nrun: bun run notices`);
});

function pinTree(sourceLine) {
  const root = noticesTree();
  write(root, 'plugins/ven/skills/s/SKILL.md', `---\nname: s\nmetadata:\n  layer: L2\n  ${sourceLine}\n---\nBody mentions a/one@main in text.\n`);
  write(root, 'plugins/ven/skills/do/playbooks/p.md', '---\nmetadata:\n  source: b/two@main:p.md\n---\n');
  return root;
}

test('pin-sources replaces @main with the pinned SHA on the source line only, and is idempotent', () => {
  const root = pinTree('source: a/one@main:x.md + b/two@main:y.md; c/three@main:z.md');
  const first = run(script('pin-sources.mjs'), ['--root', root]);
  assert.equal(first.status, 0, first.stderr);
  const skill = readFileSync(join(root, 'plugins/ven/skills/s/SKILL.md'), 'utf8');
  assert.match(skill, /source: a\/one@aaa1111:x\.md \+ b\/two@bbb2222:y\.md; c\/three@main:z\.md/);
  assert.match(skill, /Body mentions a\/one@main in text\./);
  assert.match(readFileSync(join(root, 'plugins/ven/skills/do/playbooks/p.md'), 'utf8'), /b\/two@bbb2222:p\.md/);
  assert.match(first.stdout, /c\/three/);

  const second = run(script('pin-sources.mjs'), ['--root', root]);
  assert.equal(second.status, 0);
  assert.equal(readFileSync(join(root, 'plugins/ven/skills/s/SKILL.md'), 'utf8'), skill);
  assert.match(second.stdout, /0 files changed/);
});

test('no shipped skill or playbook still pins @main for an upstream with a SHA', () => {
  const result = run(script('pin-sources.mjs'), ['--check']);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('the vendoring map lists the same SHAs as _upstreams.json', () => {
  const map = readFileSync(join(REPO, 'docs/build/vendoring-map.md'), 'utf8');
  const upstreams = JSON.parse(readFileSync(join(REPO, 'docs/build/notices/_upstreams.json'), 'utf8'));
  for (const { repo, sha } of upstreams) {
    assert.match(map, new RegExp(`\\| ${repo.replace(/[./]/g, '\\$&')} \\|[^\\n]*\`${sha}\``), repo);
  }
});

// --- ven-new-skill ---

const NEW_SKILL = join(PLUGIN_ROOT, 'bin', 'ven-new-skill');

function scaffoldTree() {
  const root = mkdtempSync(join(tmpdir(), 'ven-scaffold-'));
  cpSync(join(PLUGIN_ROOT, 'templates', 'skill'), join(root, 'plugins/ven/templates/skill'), { recursive: true });
  write(root, 'plugins/ven/skills/existing/SKILL.md', '---\nname: existing\ndescription: Keeps an old thing tidy. Use when tidying old things.\nmetadata:\n  layer: L2\n---\nBody.\n');
  write(root, 'docs/build/authoring-guide.md', '# Guide\n\n## Catalog\n\n- **L2 principles:** `laziness`\n');
  write(root, 'docs/build/notices/principles.md', '# Principles\n\n- cursor/plugins — plugins/ven/skills/laziness/ adapted from a.md\n');
  return root;
}

const scaffold = (root, args) => run(NEW_SKILL, [...args, '--repo', root]);

test('ven-new-skill creates a lint-clean skill, a catalog line and a notice line', () => {
  const root = scaffoldTree();
  const result = scaffold(root, [
    'widget-check', '--layer', 'L2', '--notice-group', 'principles',
    '--source', 'cursor/plugins@main:pstack/skills/widget/SKILL.md',
  ]);
  assert.equal(result.status, 0, result.stderr + result.stdout);
  const skill = readFileSync(join(root, 'plugins/ven/skills/widget-check/SKILL.md'), 'utf8');
  assert.match(skill, /^---\nname: widget-check\n/);
  assert.match(skill, /\n {2}layer: L2\n/);
  assert.match(skill, /\n {2}source: cursor\/plugins@main:pstack\/skills\/widget\/SKILL\.md\n/);
  assert.doesNotMatch(skill, /paths:|pack:|CLAUDE_PLUGIN_ROOT|\{\{(skill|layer|source)/);
  assert.match(readFileSync(join(root, 'docs/build/authoring-guide.md'), 'utf8'), /- \*\*L2 new:\*\* `widget-check`/);
  assert.match(
    readFileSync(join(root, 'docs/build/notices/principles.md'), 'utf8'),
    /- cursor\/plugins — plugins\/ven\/skills\/widget-check\/ adapted from pstack\/skills\/widget\/SKILL\.md/,
  );
  assert.match(result.stdout, /Next steps/);
  assert.match(result.stdout, /evals\/skills\/widget-check/);
});

test('ven-new-skill without --source writes no source line and no notice', () => {
  const root = scaffoldTree();
  const result = scaffold(root, ['fresh-one', '--layer', 'L3']);
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.doesNotMatch(readFileSync(join(root, 'plugins/ven/skills/fresh-one/SKILL.md'), 'utf8'), /source:/);
  assert.match(readFileSync(join(root, 'docs/build/authoring-guide.md'), 'utf8'), /- \*\*L3 new:\*\* `fresh-one`/);
});

test('ven-new-skill appends to an existing "new" catalog line', () => {
  const root = scaffoldTree();
  scaffold(root, ['one-a', '--layer', 'L3']);
  scaffold(root, ['one-b', '--layer', 'L3']);
  assert.match(readFileSync(join(root, 'docs/build/authoring-guide.md'), 'utf8'), /- \*\*L3 new:\*\* `one-a`, `one-b`\n/);
});

test('ven-new-skill refuses an existing skill and changes nothing', () => {
  const root = scaffoldTree();
  const guide = readFileSync(join(root, 'docs/build/authoring-guide.md'), 'utf8');
  const result = scaffold(root, ['existing', '--layer', 'L2']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /already exists/);
  assert.equal(readFileSync(join(root, 'docs/build/authoring-guide.md'), 'utf8'), guide);
});

test('ven-new-skill exits 2 on bad usage', () => {
  const root = scaffoldTree();
  for (const args of [
    [],
    ['x-skill'],
    ['x-skill', '--layer', 'L9'],
    ['Bad_Name', '--layer', 'L2'],
    ['x-skill', '--layer', 'L2', '--source', 'a/b@main:p.md'],
  ]) {
    const result = scaffold(root, args);
    assert.equal(result.status, 2, `${args.join(' ')}: ${result.stderr}`);
  }
  assert.equal(existsSync(join(root, 'plugins/ven/skills/x-skill')), false);
});

test('ven-new-skill rejects an unknown notice group before writing anything', () => {
  const root = scaffoldTree();
  const result = scaffold(root, ['x-skill', '--layer', 'L2', '--notice-group', 'nope', '--source', 'a/b@main:p.md']);
  assert.equal(result.status, 1);
  assert.equal(existsSync(join(root, 'plugins/ven/skills/x-skill')), false);
});

test('the core skill template is valid core frontmatter', () => {
  const template = readFileSync(join(PLUGIN_ROOT, 'templates/skill/core/SKILL.md'), 'utf8');
  assert.doesNotMatch(template, /paths:|pack:|CLAUDE_PLUGIN_ROOT\}\/references/);
});
