import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
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
  assert.equal(runHook('verify-gate', session(root, { hook_event_name: 'Stop' })).code, 0);
  assert.equal(runHook('repro-first', { cwd: root, tool_input: { file_path: join(root, 'src/app.js') } }).code, 0);
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

test('git-guardrails blocks destructive git and allows the rest', () => {
  const bash = (command) => runHook('git-guardrails', { tool_name: 'Bash', tool_input: { command } });
  for (const command of [
    'git push --force origin main',
    'git push -f',
    'git push origin +main',
    'git push --force-with-lease',
    'cd x && git reset --hard HEAD~1',
    'git -C ../repo clean -fd',
    'git branch -D feature',
    'git branch --delete feature',
  ]) {
    assert.equal(bash(command).code, 2, command);
  }
  for (const command of ['git push origin feature', 'git reset --soft HEAD~1', 'git clean -n', 'git branch -a', 'git status', 'echo "git push -f"']) {
    assert.equal(bash(command).code, 0, command);
  }
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
