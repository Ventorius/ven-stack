import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`corrupt JSON in ${path}: ${error.message}`);
  }
}

// Temp file in the same directory, then rename: a crash or a concurrent reader never sees half a file.
export function writeFileAtomic(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  writeFileSync(temp, text);
  renameSync(temp, path);
}

export function writeJson(path, value) {
  writeFileAtomic(path, `${JSON.stringify(value, null, 2)}\n`);
}

function worktreeKey(worktreeRoot) {
  return createHash('sha1').update(worktreeRoot).digest('hex').slice(0, 12);
}

// The active playbook is per worktree, not per session: bin tools run by Claude can't see the session id.
export function readPlaybookState(dir, worktreeRoot) {
  return readJson(join(dir, 'state', 'worktrees', `${worktreeKey(worktreeRoot)}.json`), null);
}

export function writePlaybookState(dir, worktreeRoot, state) {
  writeJson(join(dir, 'state', 'worktrees', `${worktreeKey(worktreeRoot)}.json`), { root: worktreeRoot, ...state });
}

export function readSession(dir, sessionId) {
  return readJson(join(dir, 'state', 'sessions', `${sessionId}.json`), {});
}

export function writeSession(dir, sessionId, session) {
  writeJson(join(dir, 'state', 'sessions', `${sessionId}.json`), session);
}

const VERIFY_LOG_LIMIT = 500;

function verifyLines(path) {
  return existsSync(path) ? readFileSync(path, 'utf8').split('\n').filter(Boolean) : [];
}

export function appendVerify(dir, entry) {
  const path = join(dir, 'state', 'verify.jsonl');
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, `${JSON.stringify({ ts: new Date().toISOString(), ...entry })}\n`);
  const lines = verifyLines(path);
  if (lines.length > VERIFY_LOG_LIMIT) writeFileAtomic(path, `${lines.slice(-VERIFY_LOG_LIMIT).join('\n')}\n`);
}

// A torn line from a concurrent append must not take the verify gate down with it.
export function verifyEntries(dir) {
  return verifyLines(join(dir, 'state', 'verify.jsonl')).flatMap((line) => {
    try {
      return [JSON.parse(line)];
    } catch {
      return [];
    }
  });
}

// An entry flagged tree_changed ran against a tree that moved under it, so it proves nothing.
export function passedVerifyFor(dir, tree) {
  return verifyEntries(dir).find((entry) => entry.tree === tree && entry.exit === 0 && !entry.tree_changed) ?? null;
}

const DECISION_COLUMNS = ['ts', 'worktree', 'playbook', 'step', 'decision', 'evidence'];

function tsvCell(value) {
  return String(value ?? '').replace(/[\t\n\r]+/g, ' ').trim();
}

export function appendDecision(dir, row) {
  const path = join(dir, 'decisions.tsv');
  mkdirSync(dir, { recursive: true });
  if (!existsSync(path)) writeFileSync(path, `${DECISION_COLUMNS.join('\t')}\n`);
  const record = { ts: new Date().toISOString(), ...row };
  appendFileSync(path, `${DECISION_COLUMNS.map((column) => tsvCell(record[column])).join('\t')}\n`);
}

export function readDecisions(dir) {
  const path = join(dir, 'decisions.tsv');
  if (!existsSync(path)) return [];
  const [header, ...lines] = readFileSync(path, 'utf8').split('\n').filter(Boolean);
  const columns = header.split('\t');
  return lines.map((line) => Object.fromEntries(line.split('\t').map((cell, index) => [columns[index], cell])));
}
