import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { runBin, writeFile } from '../support/fixture.mjs';

const line = (entry) => `${JSON.stringify(entry)}\n`;
const user = (text, timestamp) => line({ type: 'user', timestamp, message: { content: text } });
const assistant = (content, timestamp) => line({ type: 'assistant', timestamp, message: { content } });

function transcriptDir() {
  const configDir = mkdtempSync(join(tmpdir(), 'ven-transcripts-'));
  const session = [
    user('add a retry to the client', '2026-10-01T10:00:00Z'),
    assistant([{ type: 'text', text: '**Playbook: feature** because it adds behavior' }], '2026-10-01T10:00:01Z'),
    assistant([{ type: 'tool_use', name: 'Edit', input: { file_path: 'src/client.js' } }], '2026-10-01T10:00:02Z'),
    user("no, don't touch the client, wrap it", '2026-10-01T10:00:03Z'),
    line({ type: 'user', timestamp: '2026-10-01T10:00:04Z', message: { content: [{ type: 'tool_result', content: 'Stop blocked by ven context-inject: rebuild the map' }] } }),
    assistant([{ type: 'text', text: '**Playbook: fix** after the correction' }], '2026-10-01T10:00:05Z'),
    'not json at all\n',
  ].join('');
  writeFile(configDir, 'projects/-Users-me-code-acme/abc123.jsonl', session);
  writeFile(configDir, 'projects/-Users-me-code-other/zzz.jsonl', user("no, wrong repo", '2026-10-01T10:00:00Z'));
  return configDir;
}

const transcripts = (args) => runBin('ven-transcripts', args, { cwd: tmpdir() });

test('ven-transcripts extracts corrections, hook blocks and routes for the matching project only', () => {
  const configDir = transcriptDir();
  const result = transcripts(['--match', 'acme', '--config-dir', configDir]);
  assert.equal(result.code, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.sessions_scanned, 1);
  assert.equal(output.corrections.length, 1);
  assert.equal(output.corrections[0].session, 'abc123');
  assert.equal(output.corrections[0].said, "no, don't touch the client, wrap it");
  assert.equal(output.corrections[0].after, 'Edit {"file_path":"src/client.js"}');
  assert.equal(output.blocks.length, 1);
  assert.match(output.blocks[0].hook, /^ven context-inject: rebuild the map/);
  assert.deepEqual(output.routes.map((route) => [route.session, route.picks, route.rerouted]), [['abc123', ['feature', 'fix'], true]]);
});

test('ven-transcripts --kind narrows the output and rejects unknown kinds', () => {
  const configDir = transcriptDir();
  const blocks = JSON.parse(transcripts(['--match', 'acme', '--kind', 'blocks', '--config-dir', configDir]).stdout);
  assert.deepEqual(Object.keys(blocks), ['match', 'blocks']);
  const unknown = transcripts(['--match', 'acme', '--kind', 'bogus', '--config-dir', configDir]);
  assert.equal(unknown.code, 2);
  assert.match(unknown.stderr, /unknown --kind bogus/);
});

test('ven-transcripts warns on stderr when no project matches --match', () => {
  const configDir = transcriptDir();
  const result = transcripts(['--match', 'nonexistent', '--config-dir', configDir]);
  assert.equal(result.code, 0);
  assert.match(result.stderr, /no transcript directory matches "nonexistent"/);
  assert.equal(JSON.parse(result.stdout).sessions_scanned, 0);
  assert.equal(transcripts(['--match', 'acme', '--config-dir', configDir]).stderr, '');
});

test('ven-transcripts skips sessions older than --since', () => {
  const configDir = transcriptDir();
  const output = JSON.parse(transcripts(['--match', 'acme', '--since', '0', '--config-dir', configDir]).stdout);
  assert.deepEqual(output.corrections, []);
});

test('ven-transcripts rejects unknown flags and valueless flags with exit 2', () => {
  assert.equal(transcripts(['--bogus']).code, 2);
  const valueless = transcripts(['--match']);
  assert.equal(valueless.code, 2);
  assert.match(valueless.stderr, /--match needs a value/);
  assert.equal(transcripts(['--help']).code, 0);
});

test('ven-transcripts --limit keeps the newest N items and rejects bad numbers', () => {
  const configDir = transcriptDir();
  writeFile(configDir, 'projects/-Users-me-code-acme/def456.jsonl', user('no, use the other one', '2026-10-02T10:00:00Z') + user('wrong again, revert it', '2026-10-02T10:00:01Z'));
  const all = JSON.parse(transcripts(['--match', 'acme', '--kind', 'corrections', '--config-dir', configDir]).stdout).corrections;
  assert.equal(all.length, 3);
  const limited = JSON.parse(transcripts(['--match', 'acme', '--kind', 'corrections', '--limit', '2', '--config-dir', configDir]).stdout).corrections;
  assert.deepEqual(limited, all.slice(-2));
  for (const bad of ['x', '0', '1.5']) assert.equal(transcripts(['--match', 'acme', '--limit', bad, '--config-dir', configDir]).code, 2, bad);
  assert.equal(transcripts(['--match', 'acme', '--since', 'abc', '--config-dir', configDir]).code, 2);
});

test('ven-transcripts counts sessions scanned, not project directories', () => {
  const configDir = transcriptDir();
  writeFile(configDir, 'projects/-Users-me-code-acme/def456.jsonl', user('hello', '2026-10-02T10:00:00Z'));
  writeFile(configDir, 'projects/-Users-me-code-acme/notes.txt', 'ignored');
  const output = JSON.parse(transcripts(['--match', 'acme', '--config-dir', configDir]).stdout);
  assert.equal(output.sessions_scanned, 2);
});
