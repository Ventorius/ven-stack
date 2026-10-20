import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { workingTreeHash } from '../../scripts/lib/repo.mjs';
import { BASE_PROFILE, makeRepo, runBin, runHook, runHookRaw, stateDir, writeFile } from '../support/fixture.mjs';

const session = (root, extra = {}) => ({ session_id: 's1', cwd: root, ...extra });
const corruptProfile = (root) => writeFileSync(join(stateDir(root), 'profile.json'), '{not json');
const edit = (root) => ({ cwd: root, tool_name: 'Edit', tool_input: { file_path: join(root, 'src/app.js') } });

test('gate hooks block on a corrupt profile and name the fix', () => {
  const root = makeRepo();
  corruptProfile(root);
  for (const hook of [
    () => runHook('verify-gate', session(root, { hook_event_name: 'Stop' })),
    () => runHook('verify-gate', { cwd: root, agent_id: 'a', agent_type: 'ven:ven-coder', hook_event_name: 'SubagentStop' }),
    () => runHook('repro-first', edit(root)),
  ]) {
    const result = hook();
    assert.equal(result.code, 2);
    assert.match(result.stderr, /internal error: corrupt JSON/);
    assert.match(result.stderr, /ven-doctor/);
  }
});

test('non-gate hooks and gate start events allow with a one-line warning on a corrupt profile', () => {
  const root = makeRepo();
  corruptProfile(root);
  const results = [
    runHook('verify-gate', session(root, { hook_event_name: 'SessionStart' })),
    runHook('verify-gate', { cwd: root, agent_id: 'a', agent_type: 'ven:ven-coder', hook_event_name: 'SubagentStart' }),
    runHook('context-inject', { cwd: root, hook_event_name: 'SessionStart' }),
    runHook('no-workaround', edit(root)),
    runHook('format', edit(root)),
    runHook('decisions-log', { cwd: root, last_assistant_message: 'VEN-RESULT: DONE' }),
  ];
  for (const result of results) {
    assert.equal(result.code, 0);
    assert.match(result.stderr, /^ven [\w-]+: internal error: .*corrupt JSON/);
    assert.equal(result.stderr.trim().split('\n').length, 1);
  }
});

test('verify-gate blocks Stop on corrupt session state but allows SessionStart', () => {
  const root = makeRepo();
  mkdirSync(join(stateDir(root), 'state', 'sessions'), { recursive: true });
  writeFileSync(join(stateDir(root), 'state', 'sessions', 's1.json'), '{oops');
  assert.equal(runHook('verify-gate', session(root, { hook_event_name: 'SessionStart' })).code, 0);
  const stop = runHook('verify-gate', session(root, { hook_event_name: 'Stop' }));
  assert.equal(stop.code, 2);
  assert.match(stop.stderr, /corrupt JSON/);
});

test('malformed stdin blocks repro-first and plan-only once and is tolerated by other hooks', () => {
  for (const name of ['repro-first', 'plan-only']) {
    const blocked = runHookRaw(name, '{broken');
    assert.equal(blocked.code, 2, name);
    assert.match(blocked.stderr, /internal error/);
  }
  for (const name of ['verify-gate', 'no-workaround', 'format', 'context-inject', 'decisions-log', 'capture-corrections', 'solutions-on-edit']) {
    const result = runHookRaw(name, '{broken');
    assert.equal(result.code, 0, name);
  }
});

test('an invalid suppression regex is skipped with a warning while valid ones still fire', () => {
  const root = makeRepo({ profile: { ...BASE_PROFILE, suppressions: [{ pattern: '(unclosed', why: 'x' }, ...BASE_PROFILE.suppressions] } });
  const result = runHook('no-workaround', { ...edit(root), tool_input: { file_path: join(root, 'src/app.js'), old_string: 'a', new_string: '// @ts-ignore' } });
  assert.equal(result.code, 2);
  assert.match(result.stderr, /invalid suppression pattern .*\(unclosed/);
  assert.match(result.stderr, /adds `\/\/ @ts-ignore`/);
});

test('hooks.json marks only the gate entries onFailure block', () => {
  const config = JSON.parse(readFileSync(new URL('../../hooks/hooks.json', import.meta.url), 'utf8'));
  const flagged = Object.entries(config.hooks).flatMap(([event, groups]) =>
    groups.flatMap((group) => group.hooks.filter((hook) => hook.onFailure === 'block').map((hook) => `${event}:${hook.args[0].split('/').pop()}`)),
  );
  assert.deepEqual(flagged.sort(), ['PreToolUse:plan-only.mjs', 'PreToolUse:repro-first.mjs', 'Stop:verify-gate.mjs', 'SubagentStop:verify-gate.mjs']);
});

test('baseline survives a new session in the same dirty worktree', () => {
  const root = makeRepo();
  runHook('verify-gate', session(root, { hook_event_name: 'SessionStart' }));
  writeFile(root, 'src/app.js', 'export const answer = 43;\n');
  runHook('verify-gate', session(root, { session_id: 'B', hook_event_name: 'SessionStart' }));
  assert.equal(runHook('verify-gate', session(root, { session_id: 'B', hook_event_name: 'Stop' })).code, 2);
});

test('a logged verify pass resets the baseline for the next session', () => {
  const root = makeRepo();
  runHook('verify-gate', session(root, { hook_event_name: 'SessionStart' }));
  writeFile(root, 'src/app.js', 'export const answer = 43;\n');
  assert.equal(runBin('ven-profile', ['verify', 'test.all'], { cwd: root }).code, 0);
  assert.equal(runHook('verify-gate', session(root, { hook_event_name: 'Stop' })).code, 0);

  runHook('verify-gate', session(root, { session_id: 'B', hook_event_name: 'SessionStart' }));
  assert.equal(runHook('verify-gate', session(root, { session_id: 'B', hook_event_name: 'Stop' })).code, 0);
  writeFile(root, 'src/app.js', 'export const answer = 44;\n');
  assert.equal(runHook('verify-gate', session(root, { session_id: 'B', hook_event_name: 'Stop' })).code, 2);
});

test('a verify entry flagged tree_changed does not satisfy the gate', () => {
  const root = makeRepo();
  runHook('verify-gate', session(root, { hook_event_name: 'SessionStart' }));
  writeFile(root, 'src/app.js', 'export const answer = 43;\n');
  const entry = { tree: workingTreeHash(root), exit: 0, tree_changed: true };
  mkdirSync(join(stateDir(root), 'state'), { recursive: true });
  appendFileSync(join(stateDir(root), 'state', 'verify.jsonl'), `${JSON.stringify(entry)}\n`);
  assert.equal(runHook('verify-gate', session(root, { hook_event_name: 'Stop' })).code, 2);
});

const post = (root, file, toolInput) => runHook('no-workaround', { cwd: root, tool_name: 'Write', tool_input: { file_path: join(root, file), ...toolInput } });

function commitAll(root, message) {
  execFileSync('git', ['add', '-A'], { cwd: root });
  execFileSync('git', ['commit', '-qm', message], { cwd: root });
}

test('no-workaround Write flags only suppressions new compared with HEAD', () => {
  const root = makeRepo();
  writeFile(root, 'src/old.js', '// @ts-ignore legacy\nconst a = 1;\n');
  commitAll(root, 'legacy');

  const untouched = post(root, 'src/old.js', { content: '// @ts-ignore legacy\nconst a = 2;\n' });
  assert.equal(untouched.code, 0);

  const added = post(root, 'src/old.js', { content: '// @ts-ignore legacy\n// @ts-ignore new\nconst a = 2;\n' });
  assert.equal(added.code, 2);
  assert.match(added.stderr, /@ts-ignore new/);
  assert.doesNotMatch(added.stderr, /legacy/);

  assert.equal(post(root, 'src/brand-new.js', { content: '// @ts-ignore\n' }).code, 2);
});

test('no-workaround Write flags a test file whose assertion count dropped versus HEAD', () => {
  const root = makeRepo();
  writeFile(root, 'src/a.test.js', 'expect(a).toBe(1);\nexpect(b).toBe(2);\n');
  commitAll(root, 'tests');

  const weakened = post(root, 'src/a.test.js', { content: 'expect(a).toBe(1);\n' });
  assert.equal(weakened.code, 2);
  assert.match(weakened.stderr, /removes 1 assertion/);
  assert.equal(post(root, 'src/a.test.js', { content: 'expect(a).toBe(1);\nexpect(b).toBe(2);\nexpect(c).toBe(3);\n' }).code, 0);
});

const prompt = (root, text, extra = {}) => ({ session_id: 's1', cwd: root, hook_event_name: 'UserPromptSubmit', prompt: text, ...extra });
const decisionRows = (root) => {
  const path = join(stateDir(root), 'decisions.tsv');
  return existsSync(path) ? readFileSync(path, 'utf8').trim().split('\n').slice(1) : [];
};

test('capture-corrections logs a correction row with the active playbook and stays silent', () => {
  const root = makeRepo();
  runBin('ven-decisions', ['start', 'feature'], { cwd: root });
  const text = `No, don't use a mock here.\nUse the real db. ${'x'.repeat(300)}`;
  const result = runHook('capture-corrections', prompt(root, text));
  assert.equal(result.code, 0);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, '');
  const cells = decisionRows(root).find((line) => line.includes('\tcorrection\t')).split('\t');
  assert.equal(cells[2], 'feature');
  assert.equal(cells[3], 'correction');
  assert.equal(cells[4].length, 200);
  assert.match(cells[4], /^No, don't use a mock here\. Use the real db\./);
  assert.equal(cells[5], 'session s1');
});

test('capture-corrections ignores ordinary prompts, un-onboarded repos and bad input', () => {
  const root = makeRepo();
  assert.equal(runHook('capture-corrections', prompt(root, 'please add a logout button')).code, 0);
  assert.equal(decisionRows(root).length, 0);

  const bare = makeRepo({ profile: null });
  assert.equal(runHook('capture-corrections', prompt(bare, 'no, stop')).code, 0);
  assert.equal(decisionRows(bare).length, 0);

  corruptProfile(root);
  const corrupt = runHook('capture-corrections', prompt(root, 'no, stop'));
  assert.equal(corrupt.code, 0);
  assert.equal(corrupt.stderr, '');
});

function writeSolutions(root) {
  const dir = stateDir(root);
  writeFile(dir, 'solutions/a/one.md', '---\ntitle: One\nsymptoms: [s1]\nfiles: [src/app.js]\n---\nbody');
  writeFile(dir, 'solutions/a/two.md', '---\ntitle: Two\nfiles: ["src/**"]\n---\nbody');
  writeFile(dir, 'solutions/a/three.md', '---\ntitle: Three\nfiles: [src]\n---\nbody');
  writeFile(dir, 'solutions/a/other.md', '---\ntitle: Other\nfiles: [lib/x.js]\n---\nbody');
}
const pre = (root, extra = {}) => ({ session_id: 's1', hook_event_name: 'PreToolUse', ...edit(root), ...extra });
const bulletCount = (stdout) => (JSON.parse(stdout).hookSpecificOutput.additionalContext.match(/^- /gm) ?? []).length;

test('solutions-on-edit injects at most two covering solutions once per session and file', () => {
  const root = makeRepo();
  writeSolutions(root);
  const first = runHook('solutions-on-edit', pre(root));
  assert.equal(first.code, 0);
  const output = JSON.parse(first.stdout).hookSpecificOutput;
  assert.equal(output.hookEventName, 'PreToolUse');
  assert.equal(output.permissionDecision, undefined);
  assert.equal(bulletCount(first.stdout), 2);
  assert.doesNotMatch(output.additionalContext, /Other/);

  assert.equal(bulletCount(runHook('solutions-on-edit', pre(root)).stdout), 1);
  assert.equal(runHook('solutions-on-edit', pre(root)).stdout, '');

  assert.equal(bulletCount(runHook('solutions-on-edit', pre(root, { session_id: 's2' })).stdout), 2);
});

test('solutions-on-edit is silent without matches or onboarding', () => {
  const root = makeRepo();
  writeSolutions(root);
  const unmatched = runHook('solutions-on-edit', pre(root, { tool_input: { file_path: join(root, 'docs/none.txt') } }));
  assert.equal(unmatched.stdout, '');
  const bare = makeRepo({ profile: null });
  assert.equal(runHook('solutions-on-edit', pre(bare)).stdout, '');
});
