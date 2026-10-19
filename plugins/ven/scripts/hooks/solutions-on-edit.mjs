#!/usr/bin/env node
import { addContext, allow, editedFilePath, runHook } from '../lib/hookio.mjs';
import { loadProfile } from '../lib/profile.mjs';
import { repoRelative, repoRoot } from '../lib/repo.mjs';
import { describeSolution, relevantSolutions } from '../lib/solutions.mjs';
import { readSession, writeSession } from '../lib/state.mjs';

const MAX_SOLUTIONS = 2;

await runHook('solutions-on-edit', main);

function main(input) {
  const filePath = editedFilePath(input);
  if (!filePath) allow();

  const cwd = input.cwd ?? process.cwd();
  const loaded = loadProfile(cwd);
  if (!loaded) allow();

  const { dir } = loaded;
  const file = repoRelative(repoRoot(cwd), filePath);
  if (file.startsWith('..')) allow();

  const sessionId = input.session_id ?? 'unknown';
  const session = readSession(dir, sessionId);
  const seen = new Set(session.solutions_seen ?? []);
  const keyOf = (solution) => `${solution.path.slice(dir.length + 1)}::${file}`;

  const unseen = relevantSolutions(dir, [file])
    .filter((solution) => !seen.has(keyOf(solution)))
    .slice(0, MAX_SOLUTIONS);
  if (unseen.length === 0) allow();

  writeSession(dir, sessionId, { ...session, solutions_seen: [...seen, ...unseen.map(keyOf)] });
  addContext('PreToolUse', `Past solutions covering ${file} (read before changing it):\n${unseen.map((solution) => describeSolution(dir, solution)).join('\n')}`);
}
