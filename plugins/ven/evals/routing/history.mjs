#!/usr/bin/env node
// Appends one routing-eval run to history.jsonl and prints cases that flipped
// against the previous run of the same tier.
//   bun plugins/ven/evals/routing/history.mjs <quick-*.json | aggregate-result.json> [--commit sha]
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const here = dirname(fileURLToPath(import.meta.url));
export const defaultHistoryPath = join(here, 'history.jsonl');

const quickCases = (result) => result.cases.map((c) => [c.name, c.pass]);
// A full case passes only when every run passed.
const fullCases = (result) => result.cases.map((c) => [c.name.replace(/^routing-/, ''), c.aggregates.passRate === 1]);

export const toEntry = (result, commit) => {
  const isQuick = result.tier === 'quick';
  return {
    date: result.startedAt.slice(0, 10),
    commit,
    tier: isQuick ? 'quick' : 'full',
    passRate: isQuick ? result.passRate : result.aggregates.overallPassRate,
    costUsd: result.costUsd,
    cases: Object.fromEntries(isQuick ? quickCases(result) : fullCases(result)),
  };
};

export const readHistory = (historyPath) =>
  existsSync(historyPath)
    ? readFileSync(historyPath, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line))
    : [];

export const flippedCases = (history, entry) => {
  const previous = history.findLast((h) => h.tier === entry.tier);
  if (!previous) return [];
  return Object.entries(entry.cases)
    .filter(([id, pass]) => id in previous.cases && previous.cases[id] !== pass)
    .map(([id, pass]) => ({ id, from: previous.cases[id], to: pass }));
};

export const appendHistory = ({ historyPath, resultPath, commit }) => {
  const entry = toEntry(JSON.parse(readFileSync(resultPath, 'utf8')), commit);
  const flips = flippedCases(readHistory(historyPath), entry);
  appendFileSync(historyPath, `${JSON.stringify(entry)}\n`);
  return { entry, flips };
};

const main = () => {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { commit: { type: 'string' } } });
  if (positionals.length !== 1) {
    console.error('usage: history.mjs <result.json> [--commit sha]');
    process.exit(2);
  }
  const commit = values.commit ?? execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
  const { entry, flips } = appendHistory({ historyPath: defaultHistoryPath, resultPath: positionals[0], commit });
  console.log(`appended ${entry.tier} run ${entry.date} ${commit}: passRate ${entry.passRate}, $${entry.costUsd}`);
  for (const { id, from, to } of flips) console.log(`flipped ${id}: ${from ? 'pass' : 'fail'} -> ${to ? 'pass' : 'fail'}`);
  if (flips.length === 0) console.log('no flips vs previous run of this tier');
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
