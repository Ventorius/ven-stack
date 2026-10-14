import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, rmSync, statSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export function git(args, cwd, options = {}) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
    ...options,
  }).trim();
}

export function tryGit(args, cwd, options) {
  try {
    return git(args, cwd, options);
  } catch {
    return null;
  }
}

export function repoRoot(cwd) {
  return tryGit(['rev-parse', '--show-toplevel'], cwd);
}

export function commonDir(cwd) {
  return tryGit(['rev-parse', '--path-format=absolute', '--git-common-dir'], cwd);
}

// State lives in git's common dir so every worktree of the repo shares it and nothing is ever committed.
export function venDir(cwd) {
  const common = commonDir(cwd);
  return common ? join(common, 'ven') : null;
}

export function defaultBranch(cwd) {
  const remoteHead = tryGit(['symbolic-ref', '--short', 'refs/remotes/origin/HEAD'], cwd);
  if (remoteHead) return remoteHead;
  for (const candidate of ['main', 'master']) {
    if (tryGit(['rev-parse', '--verify', '--quiet', candidate], cwd)) return candidate;
  }
  return null;
}

// Hashes the working tree (tracked changes + untracked, non-ignored files) without touching the real index.
// Copying the real index keeps git's stat cache, so only changed files are rehashed.
export function workingTreeHash(cwd) {
  const root = repoRoot(cwd);
  if (!root) return null;
  const realIndex = git(['rev-parse', '--path-format=absolute', '--git-path', 'index'], root);
  const tempIndex = join(tmpdir(), `ven-index-${process.pid}-${Math.random().toString(36).slice(2)}`);
  const env = { ...process.env, GIT_INDEX_FILE: tempIndex };
  try {
    // The copy must keep the real index's mtime, or git's racy-file check trusts stale stat data
    // and misses same-size edits made in the same second as the last index write.
    if (existsSync(realIndex)) {
      copyFileSync(realIndex, tempIndex);
      const { atime, mtime } = statSync(realIndex);
      utimesSync(tempIndex, atime, mtime);
    }
    git(['add', '-A'], root, { env });
    return git(['write-tree'], root, { env });
  } finally {
    rmSync(tempIndex, { force: true });
  }
}

export function changedFilesBetween(cwd, fromTree, toTree) {
  if (!fromTree || !toTree || fromTree === toTree) return [];
  const out = tryGit(['diff', '--name-only', fromTree, toTree], cwd);
  return out ? out.split('\n').filter(Boolean) : [];
}

// Files this branch touches relative to the default branch, plus uncommitted work.
export function branchTouchedFiles(cwd) {
  const files = new Set();
  const base = defaultBranch(cwd);
  const mergeBase = base ? tryGit(['merge-base', 'HEAD', base], cwd) : null;
  if (mergeBase) {
    const committed = tryGit(['diff', '--name-only', mergeBase, 'HEAD'], cwd);
    for (const file of committed ? committed.split('\n') : []) if (file) files.add(file);
  }
  const uncommitted = tryGit(['diff', '--name-only', 'HEAD'], cwd);
  const untracked = tryGit(['ls-files', '--others', '--exclude-standard'], cwd);
  for (const output of [uncommitted, untracked]) {
    for (const file of output ? output.split('\n') : []) if (file) files.add(file);
  }
  return [...files];
}
