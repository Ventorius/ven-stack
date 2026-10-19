import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { appendHistory, flippedCases, toEntry } from './history.mjs';

const quick = { tier: 'quick', startedAt: '2026-10-19T10:00:00.000Z', passRate: 0.5, costUsd: 0.02, cases: [{ name: 'a', pass: true }, { name: 'b', pass: false }] };
const full = {
  schemaVersion: 1,
  startedAt: '2026-10-14T19:38:53.690Z',
  costUsd: 7.0967,
  aggregates: { casesTotal: 2, casesPassed: 1, overallScore: 0.9, overallPassRate: 0.5 },
  cases: [{ name: 'routing-a', aggregates: { passRate: 1 } }, { name: 'routing-b', aggregates: { passRate: 0.67 } }],
};

test('toEntry normalises a quick result', () => {
  assert.deepEqual(toEntry(quick, 'abc1234'), { date: '2026-10-19', commit: 'abc1234', tier: 'quick', passRate: 0.5, costUsd: 0.02, cases: { a: true, b: false } });
});

test('toEntry normalises a full aggregate result and strips the routing- prefix', () => {
  assert.deepEqual(toEntry(full, 'abc1234'), { date: '2026-10-14', commit: 'abc1234', tier: 'full', passRate: 0.5, costUsd: 7.0967, cases: { a: true, b: false } });
});

test('flippedCases compares against the latest entry of the same tier only', () => {
  const history = [
    { tier: 'quick', cases: { a: false, b: false } },
    { tier: 'full', cases: { a: true, b: true } },
  ];
  const entry = toEntry(quick, 'x');
  assert.deepEqual(flippedCases(history, entry), [{ id: 'a', from: false, to: true }]);
  assert.deepEqual(flippedCases([], entry), []);
});

test('appendHistory appends a JSON line and reports flips', () => {
  const dir = mkdtempSync(join(tmpdir(), 'hist-'));
  const historyPath = join(dir, 'history.jsonl');
  const resultPath = join(dir, 'r.json');
  writeFileSync(resultPath, JSON.stringify(quick));
  const first = appendHistory({ historyPath, resultPath, commit: 'c1' });
  assert.deepEqual(first.flips, []);
  writeFileSync(resultPath, JSON.stringify({ ...quick, cases: [{ name: 'a', pass: false }, { name: 'b', pass: false }] }));
  const second = appendHistory({ historyPath, resultPath, commit: 'c2' });
  assert.deepEqual(second.flips, [{ id: 'a', from: true, to: false }]);
  const lines = readFileSync(historyPath, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual(lines.map((l) => l.commit), ['c1', 'c2']);
});
