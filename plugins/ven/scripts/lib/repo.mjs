import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, lstatSync, readlinkSync, realpathSync, rmSync, statSync, utimesSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

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

// State lives outside the repo, keyed by git's common dir: every worktree shares it, nothing is ever
// committed, and it avoids `.git/`, which Claude Code protects from pre-approved writes.
// VEN_STATE_DIR (absolute, or relative to the main worktree) overrides it; eval runs only pass EVAL_* vars.
export function venDir(cwd) {
  const common = commonDir(cwd);
  if (!common) return null;
  const mainRoot = basename(common) === '.git' ? dirname(common) : common;
  const override = process.env.VEN_STATE_DIR ?? process.env.EVAL_VEN_STATE_DIR;
  if (override) return isAbsolute(override) ? override : join(mainRoot, override);
  const slug = basename(mainRoot).replace(/[^a-zA-Z0-9._-]/g, '-');
  const hash = createHash('sha1').update(realpathSync(common)).digest('hex').slice(0, 8);
  return join(process.env.VEN_HOME ?? join(homedir(), '.ven'), 'repos', `${slug}-${hash}`);
}

export function defaultBranch(cwd) {
  const remoteHead = tryGit(['symbolic-ref', '--short', 'refs/remotes/origin/HEAD'], cwd);
  if (remoteHead) return remoteHead;
  for (const candidate of ['main', 'master']) {
    if (tryGit(['rev-parse', '--verify', '--quiet', candidate], cwd)) return candidate;
  }
  return null;
}

export class TreeHashError extends Error {
  constructor(cause) {
    super(`could not hash the working tree (git add -A failed: ${String(cause.stderr ?? cause.message).trim().split('\n')[0]})`);
    this.name = 'TreeHashError';
  }
}

export function untrackedFiles(cwd) {
  const out = tryGit(['ls-files', '--others', '--exclude-standard', '-z'], cwd);
  return out ? out.split('\0').filter(Boolean) : [];
}

const MAX_SYMLINK_HOPS = 32;

// Path of a file relative to the repo root, resolving symlinks. repoRoot is a realpath, so a file_path
// that arrives through a symlink (/tmp vs /private/tmp) would otherwise look like it is outside the repo.
// A file that does not exist yet resolves through its nearest existing parent. A dangling symlink is
// followed to its target, because a write through it creates the target.
export function repoRelative(root, filePath) {
  const unresolved = relative(root, resolve(filePath));
  const rest = [];
  let current = resolve(filePath);
  let hops = 0;
  for (;;) {
    try {
      return relative(root, join(realpathSync(current), ...rest.reverse()));
    } catch {
      const target = danglingTarget(current);
      if (target) {
        if (++hops > MAX_SYMLINK_HOPS) return unresolved;
        current = target;
        continue;
      }
      const parent = dirname(current);
      if (parent === current) return unresolved;
      rest.push(basename(current));
      current = parent;
    }
  }
}

// relative() returns an absolute path when the target is on another drive.
export function isOutsideRepo(file) {
  return file === '..' || file.startsWith(`..${sep}`) || isAbsolute(file);
}

function danglingTarget(path) {
  try {
    if (!lstatSync(path).isSymbolicLink()) return null;
    return resolve(dirname(path), readlinkSync(path));
  } catch {
    return null;
  }
}

// Hashes the working tree (tracked changes + untracked, non-ignored files) without touching the real index.
// Copying the real index keeps git's stat cache, so only changed files are rehashed.
// `exclude` drops those untracked paths from the hash, so `ven-profile verify` can ignore files a
// command created while still hashing everything that existed before it ran.
export function workingTreeHash(cwd, { exclude = [] } = {}) {
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
    try {
      git(['add', '-A'], root, { env });
    } catch (error) {
      throw new TreeHashError(error);
    }
    if (exclude.length > 0) git(['rm', '-q', '--cached', '--ignore-unmatch', '--pathspec-from-file=-', '--pathspec-file-nul'], root, { env, input: `${exclude.join('\0')}\0`, stdio: ['pipe', 'pipe', 'pipe'] });
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

export function mergeBaseWithDefault(cwd) {
  const base = defaultBranch(cwd);
  return base ? tryGit(['merge-base', 'HEAD', base], cwd) : null;
}

// Files this branch touches relative to the default branch, plus uncommitted work.
export function branchTouchedFiles(cwd) {
  const files = new Set();
  const mergeBase = mergeBaseWithDefault(cwd);
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
