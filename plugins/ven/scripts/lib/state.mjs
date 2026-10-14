import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

function readJson(path, fallback) {
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : fallback;
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
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

export function appendVerify(dir, entry) {
  mkdirSync(join(dir, 'state'), { recursive: true });
  appendFileSync(join(dir, 'state', 'verify.jsonl'), `${JSON.stringify({ ts: new Date().toISOString(), ...entry })}\n`);
}

export function verifyEntries(dir) {
  const path = join(dir, 'state', 'verify.jsonl');
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

export function passedVerifyFor(dir, tree) {
  return verifyEntries(dir).find((entry) => entry.tree === tree && entry.exit === 0) ?? null;
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
