import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { makeRepo, runBin, runHook, stateDir, writeFile, writeState } from '../support/fixture.mjs';

const session = (root, extra = {}) => ({ session_id: 's1', cwd: root, ...extra });

test('verify-gate allows stop when nothing changed this session', () => {
  const root = makeRepo();
  runHook('verify-gate', session(root, { hook_event_name: 'SessionStart' }));
  const result = runHook('verify-gate', session(root, { hook_event_name: 'Stop' }));
  assert.equal(result.code, 0);
});

test('verify-gate blocks a code change with no verify pass, then allows after verify', () => {
  const root = makeRepo();
  runHook('verify-gate', session(root, { hook_event_name: 'SessionStart' }));
  writeFile(root, 'src/app.js', 'export const answer = 43;\n');

  const blocked = runHook('verify-gate', session(root, { hook_event_name: 'Stop' }));
  assert.equal(blocked.code, 2);
  assert.match(blocked.stderr, /no passing verify/);
  assert.match(blocked.stderr, /ven-profile verify commands\.test\.all/);

  const verified = runBin('ven-profile', ['verify', 'test.all'], { cwd: root });
  assert.equal(verified.code, 0);
  assert.equal(runHook('verify-gate', session(root, { hook_event_name: 'Stop' })).code, 0);
});

test('verify-gate ignores a failing verify and an edit made after verifying', () => {
  const root = makeRepo();
  runHook('verify-gate', session(root, { hook_event_name: 'SessionStart' }));
  writeFile(root, 'src/app.js', 'export const answer = 43;\n');
  assert.equal(runBin('ven-profile', ['verify', 'failing'], { cwd: root }).code, 3);
  assert.equal(runHook('verify-gate', session(root, { hook_event_name: 'Stop' })).code, 2);

  runBin('ven-profile', ['verify', 'test.all'], { cwd: root });
  writeFile(root, 'src/app.js', 'export const answer = 44;\n');
  assert.equal(runHook('verify-gate', session(root, { hook_event_name: 'Stop' })).code, 2);
});

test('verify-gate skips docs-only changes', () => {
  const root = makeRepo();
  runHook('verify-gate', session(root, { hook_event_name: 'SessionStart' }));
  writeFile(root, 'README.md', '# changed\n');
  assert.equal(runHook('verify-gate', session(root, { hook_event_name: 'Stop' })).code, 0);
});

test('verify-gate releases after three blocks and records UNVERIFIED', () => {
  const root = makeRepo();
  runHook('verify-gate', session(root, { hook_event_name: 'SessionStart' }));
  writeFile(root, 'src/app.js', 'export const answer = 43;\n');
  for (let i = 0; i < 3; i++) assert.equal(runHook('verify-gate', session(root, { hook_event_name: 'Stop', stop_hook_active: i > 0 })).code, 2);
  assert.equal(runHook('verify-gate', session(root, { hook_event_name: 'Stop', stop_hook_active: true })).code, 0);
  assert.match(readFileSync(join(stateDir(root), 'decisions.tsv'), 'utf8'), /UNVERIFIED/);
});

test('verify-gate without a recorded start tree ignores history already on the default branch', () => {
  const root = makeRepo();
  writeFile(root, 'src/app.js', 'export const answer = 43;\n');
  execFileSync('git', ['commit', '-qam', 'earlier work'], { cwd: root });
  assert.equal(runHook('verify-gate', session(root, { hook_event_name: 'Stop' })).code, 0);

  writeFile(root, 'src/app.js', 'export const answer = 44;\n');
  assert.equal(runHook('verify-gate', session(root, { hook_event_name: 'Stop' })).code, 2);
});

test('verify-gate without a recorded start tree gates commits on a feature branch', () => {
  const root = makeRepo();
  execFileSync('git', ['switch', '-qc', 'feature'], { cwd: root });
  writeFile(root, 'src/app.js', 'export const answer = 43;\n');
  execFileSync('git', ['commit', '-qam', 'feature work'], { cwd: root });
  assert.equal(runHook('verify-gate', session(root, { hook_event_name: 'Stop' })).code, 2);
});

test('verify-gate only gates ven-coder subagents', () => {
  const root = makeRepo();
  const agent = { cwd: root, agent_id: 'a1', agent_type: 'ven:ven-worker' };
  runHook('verify-gate', { ...agent, hook_event_name: 'SubagentStart' });
  writeFile(root, 'src/app.js', 'export const answer = 43;\n');
  assert.equal(runHook('verify-gate', { ...agent, hook_event_name: 'SubagentStop' }).code, 0);

  const coder = { cwd: root, agent_id: 'a2', agent_type: 'ven:ven-coder' };
  writeFile(root, 'src/app.js', 'export const answer = 42;\n');
  runHook('verify-gate', { ...coder, hook_event_name: 'SubagentStart' });
  writeFile(root, 'src/app.js', 'export const answer = 45;\n');
  assert.equal(runHook('verify-gate', { ...coder, hook_event_name: 'SubagentStop' }).code, 2);
});

test('hooks are inert in a repo without a profile', () => {
  const root = makeRepo({ profile: null });
  writeFile(root, 'src/app.js', 'export const answer = 43;\n');
  assert.equal(runBin('ven-decisions', ['start', 'epic'], { cwd: root }).code, 0);
  assert.equal(runHook('verify-gate', session(root, { hook_event_name: 'Stop' })).code, 0);
  assert.equal(runHook('repro-first', { cwd: root, tool_input: { file_path: join(root, 'src/app.js') } }).code, 0);
  assert.equal(runHook('plan-only', { cwd: root, tool_input: { file_path: join(root, 'src/app.js') } }).code, 0);
});

test('repro-first blocks source edits during bug-fix until a reproduction is recorded', () => {
  const root = makeRepo();
  const edit = (file) => runHook('repro-first', { cwd: root, tool_name: 'Edit', tool_input: { file_path: join(root, file) } });
  assert.equal(edit('src/app.js').code, 0);

  runBin('ven-decisions', ['start', 'bug-fix'], { cwd: root });
  const blocked = edit('src/app.js');
  assert.equal(blocked.code, 2);
  assert.match(blocked.stderr, /Reproduce first/);
  assert.equal(edit('src/app.test.js').code, 0);
  assert.equal(edit('docs/notes.md').code, 0);
  assert.equal(edit('.git/info/exclude').code, 0);
  assert.equal(runHook('repro-first', { cwd: root, tool_name: 'Write', tool_input: { file_path: join(stateDir(root), 'specs', 'fix.json') } }).code, 0);

  runBin('ven-decisions', ['add', '--step', 'reproduce', '--decision', 'reproduced', '--evidence', 'app.test.js fails'], { cwd: root });
  assert.equal(edit('src/app.js').code, 0);
});

test('plan-only blocks every repo edit while epic is active, docs and tests included', () => {
  const root = makeRepo();
  const edit = (file, tool = 'Edit') => runHook('plan-only', { cwd: root, tool_name: tool, tool_input: { file_path: file } });
  const inRepo = (file) => join(root, file);

  runBin('ven-decisions', ['start', 'epic'], { cwd: root });
  for (const file of ['src/app.js', 'README.md', 'src/app.test.js']) {
    const blocked = edit(inRepo(file));
    assert.equal(blocked.code, 2, file);
    assert.match(blocked.stderr, /roadmaps\//);
    assert.match(blocked.stderr, /ven-decisions end --outcome done/);
    assert.match(blocked.stderr, /ven-decisions end --outcome abandoned/);
  }
  assert.equal(runHook('plan-only', { cwd: root, tool_name: 'NotebookEdit', tool_input: { notebook_path: inRepo('nb.ipynb') } }).code, 2);

  assert.equal(edit(join(stateDir(root), 'roadmaps', 'x', 'roadmap.md'), 'Write').code, 0);
  assert.equal(edit(join(root, '..', 'scratch', 'proto.js')).code, 0);
  assert.equal(edit(inRepo('.git/info/exclude')).code, 0);
  assert.equal(runHook('plan-only', { cwd: root, tool_name: 'Edit', tool_input: {} }).code, 0);
});

test('plan-only allows the roadmaps directory when the state dir is inside the repo', () => {
  const previous = process.env.VEN_STATE_DIR;
  process.env.VEN_STATE_DIR = '.ven-state';
  try {
    const root = makeRepo();
    runBin('ven-decisions', ['start', 'epic'], { cwd: root });
    const edit = (file, tool = 'Edit') => runHook('plan-only', { cwd: root, tool_name: tool, tool_input: { file_path: file } });
    assert.equal(edit(join(stateDir(root), 'roadmaps', 'x', 'roadmap.md'), 'Write').code, 0);
    assert.equal(edit(join(root, 'src/app.js')).code, 2);
  } finally {
    if (previous === undefined) delete process.env.VEN_STATE_DIR;
    else process.env.VEN_STATE_DIR = previous;
  }
});

test('a file named like a parent-dir prefix is inside the repo for both gates', () => {
  const root = makeRepo();
  runBin('ven-decisions', ['start', 'epic'], { cwd: root });
  assert.equal(runHook('plan-only', { cwd: root, tool_name: 'Edit', tool_input: { file_path: join(root, '..notes.md') } }).code, 2);

  const bugRoot = makeRepo();
  runBin('ven-decisions', ['start', 'bug-fix'], { cwd: bugRoot });
  assert.equal(runHook('repro-first', { cwd: bugRoot, tool_name: 'Edit', tool_input: { file_path: join(bugRoot, '..helper.js') } }).code, 2);
});

test('both gates follow a dangling symlink into the repo', () => {
  const outside = realpathSync(mkdtempSync(join(tmpdir(), 'ven-outside-')));
  const link = (root) => {
    mkdirSync(join(outside, 'out'), { recursive: true });
    const path = join(outside, 'out', `dangling-${Math.random().toString(36).slice(2)}`);
    symlinkSync(join(root, 'src/new.js'), path);
    return path;
  };

  const epicRoot = makeRepo();
  runBin('ven-decisions', ['start', 'epic'], { cwd: epicRoot });
  assert.equal(runHook('plan-only', { cwd: epicRoot, tool_name: 'Write', tool_input: { file_path: link(epicRoot) } }).code, 2);

  const bugRoot = makeRepo();
  runBin('ven-decisions', ['start', 'bug-fix'], { cwd: bugRoot });
  assert.equal(runHook('repro-first', { cwd: bugRoot, tool_name: 'Write', tool_input: { file_path: link(bugRoot) } }).code, 2);
});

test('plan-only releases the lock when the epic run is abandoned', () => {
  const root = makeRepo();
  const edit = () => runHook('plan-only', { cwd: root, tool_name: 'Edit', tool_input: { file_path: join(root, 'src/app.js') } });
  runBin('ven-decisions', ['start', 'epic'], { cwd: root });
  assert.equal(edit().code, 2);
  assert.equal(runBin('ven-decisions', ['end', '--outcome', 'abandoned'], { cwd: root }).code, 0);
  assert.equal(edit().code, 0);
});

test('plan-only allows repo edits with no active playbook or another playbook', () => {
  const root = makeRepo();
  const edit = () => runHook('plan-only', { cwd: root, tool_name: 'Edit', tool_input: { file_path: join(root, 'src/app.js') } });
  assert.equal(edit().code, 0);

  runBin('ven-decisions', ['start', 'feature'], { cwd: root });
  assert.equal(edit().code, 0);
});

test('plan-only on corrupt playbook state blocks once, then allows; outside-repo paths never block', () => {
  const root = makeRepo();
  runBin('ven-decisions', ['start', 'epic'], { cwd: root });
  const folder = join(stateDir(root), 'state', 'worktrees');
  writeFileSync(join(folder, readdirSync(folder)[0]), '{oops');
  const edit = (file) => runHook('plan-only', { cwd: root, tool_name: 'Edit', tool_input: { file_path: file } });

  assert.equal(edit(join(stateDir(root), 'roadmaps', 'x', 'roadmap.md')).code, 0);
  const first = edit(join(root, 'src/app.js'));
  assert.equal(first.code, 2);
  assert.match(first.stderr, /internal error/);
  const second = edit(join(root, 'src/app.js'));
  assert.equal(second.code, 0);
  assert.match(second.stderr, /internal error/);
});

test('no-workaround flags added suppressions and removed assertions, honours ven-allow', () => {
  const root = makeRepo();
  const post = (file, toolInput) => runHook('no-workaround', { cwd: root, tool_name: 'Edit', tool_input: { file_path: join(root, file), ...toolInput } });

  const suppressed = post('src/app.js', { old_string: 'a', new_string: '// @ts-ignore\nconst x = 1' });
  assert.equal(suppressed.code, 2);
  assert.match(suppressed.stderr, /@ts-ignore/);

  const allowed = post('src/app.js', { old_string: 'a', new_string: '// @ts-ignore ven-allow: SUB-1 vendor types' });
  assert.equal(allowed.code, 0);
  assert.match(readFileSync(join(stateDir(root), 'decisions.tsv'), 'utf8'), /no-workaround\tallowed/);

  const weakened = post('src/app.test.js', { old_string: 'expect(a).toBe(1)\nexpect(b).toBe(2)', new_string: 'expect(a).toBe(1)' });
  assert.equal(weakened.code, 2);
  assert.match(weakened.stderr, /removes 1 assertion/);

  assert.equal(post('README.md', { old_string: 'a', new_string: '@ts-ignore in docs is fine' }).code, 0);
});

test('decisions-log appends the agent trailer to decisions.tsv', () => {
  const root = makeRepo();
  const message = 'Renamed 30 files.\n\nVEN-RESULT: DONE\nplaybook: migration\nstep: sweep\ndecision: renamed fooBar to fooBaz\nevidence: typecheck exit 0';
  runHook('decisions-log', { cwd: root, hook_event_name: 'SubagentStop', agent_type: 'ven:ven-worker', last_assistant_message: message });
  runHook('decisions-log', { cwd: root, hook_event_name: 'SubagentStop', agent_type: 'ven:ven-worker', last_assistant_message: 'VEN-RESULT: BLOCKED: which module owns invoices?' });
  const log = readFileSync(join(stateDir(root), 'decisions.tsv'), 'utf8');
  assert.match(log, /migration\tsweep\trenamed fooBar to fooBaz\ttypecheck exit 0 \| agent=ven:ven-worker/);
  assert.match(log, /BLOCKED: which module owns invoices\?/);
});

test('context-inject points un-onboarded repos at /ven:onboard', () => {
  const root = makeRepo({ profile: null });
  const result = runHook('context-inject', { cwd: root, hook_event_name: 'SessionStart' });
  assert.match(JSON.parse(result.stdout).hookSpecificOutput.additionalContext, /\/ven:onboard/);
});

test('context-inject surfaces map, stale profile, playbook and relevant solutions', () => {
  const root = makeRepo();
  writeState(root, 'map.md', '# Map\nCommands: ven-profile get commands');
  writeState(root, 'solutions/billing/rounding.md', '---\ntitle: Rounding drift\nsymptoms: [totals off by one cent]\nfiles: [src/app.js]\n---\nbody');
  writeState(root, 'solutions/other/unrelated.md', '---\ntitle: Unrelated\nfiles: [src/other.js]\n---\nbody');
  writeFile(root, 'src/app.js', 'export const answer = 43;\n');
  runBin('ven-decisions', ['start', 'feature'], { cwd: root });

  const context = JSON.parse(runHook('context-inject', { cwd: root, hook_event_name: 'SessionStart' }).stdout).hookSpecificOutput.additionalContext;
  assert.match(context, /# Map/);
  assert.match(context, /Profile may be stale: package.json/);
  assert.match(context, /Active playbook in this worktree: feature/);
  assert.match(context, /Rounding drift/);
  assert.doesNotMatch(context, /Unrelated/);
});

test('format runs the verified profile format command on the edited file', () => {
  const root = makeRepo({
    profile: {
      schema_version: 1,
      commands: { format: { run: 'node -e "require(\'fs\').appendFileSync(process.argv[1], \'// formatted\\n\')" {file}', status: 'verified', globs: ['src/**'] } },
    },
  });
  const file = join(root, 'src/app.js');
  assert.equal(runHook('format', { cwd: root, tool_name: 'Edit', tool_input: { file_path: file } }).code, 0);
  assert.match(readFileSync(file, 'utf8'), /formatted/);
  runHook('format', { cwd: root, tool_name: 'Edit', tool_input: { file_path: join(root, 'README.md') } });
  assert.doesNotMatch(readFileSync(join(root, 'README.md'), 'utf8'), /formatted/);
  assert.ok(existsSync(file));
});
