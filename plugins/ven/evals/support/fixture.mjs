import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { venDir } from '../../scripts/lib/repo.mjs';

export const PLUGIN_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Child processes inherit this, so tests never touch the real ~/.ven.
process.env.VEN_HOME = mkdtempSync(join(tmpdir(), 'ven-home-'));

export const BASE_PROFILE = {
  schema_version: 1,
  generated_at: '2026-01-01T00:00:00.000Z',
  stack: { sources: ['package.json'] },
  commands: {
    test: { all: { run: 'node -e "process.exit(0)"', status: 'verified' } },
    failing: { run: 'node -e "process.exit(3)"', status: 'verified' },
  },
  verify: { logic: 'commands.test.all' },
  tests: { patterns: ['**/*.test.js', 'test/**'] },
  docs_only: ['**/*.md', 'docs/**'],
  suppressions: [{ pattern: '@ts-ignore', why: 'hides a type error instead of fixing it' }],
  assertions: [{ pattern: 'expect\\(', why: 'deleting assertions makes tests pass without proving anything' }],
};

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

export function makeRepo({ profile = BASE_PROFILE } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'ven-fixture-')));
  git(root, 'init', '-q', '-b', 'main');
  git(root, 'config', 'user.email', 'fixture@example.com');
  git(root, 'config', 'user.name', 'fixture');
  writeFile(root, 'package.json', '{"name":"fixture"}\n');
  writeFile(root, 'src/app.js', 'export const answer = 42;\n');
  writeFile(root, 'README.md', '# fixture\n');
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', 'init');
  if (profile) {
    const dir = stateDir(root);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'profile.json'), JSON.stringify(profile, null, 2));
  }
  return root;
}

export function stateDir(root) {
  return venDir(root);
}

export function writeState(root, relativePath, content) {
  return writeFile(stateDir(root), relativePath, content);
}

export function writeFile(root, relativePath, content) {
  const path = join(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  return path;
}

export function runHook(name, input) {
  const result = spawnSync('node', [join(PLUGIN_ROOT, 'scripts', 'hooks', `${name}.mjs`)], {
    input: JSON.stringify(input),
    encoding: 'utf8',
  });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

export function runHookRaw(name, stdinText) {
  const result = spawnSync('node', [join(PLUGIN_ROOT, 'scripts', 'hooks', `${name}.mjs`)], { input: stdinText, encoding: 'utf8' });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

export function runBin(name, args, { cwd, input, env } = {}) {
  const result = spawnSync('node', [join(PLUGIN_ROOT, 'bin', name), ...args], { cwd, input, encoding: 'utf8', env: { ...process.env, ...env } });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}
