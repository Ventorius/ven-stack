#!/usr/bin/env node
// ven adapter for {{capability}}: {{one line on what it reads, e.g. "the schema files under db/" or "the repo's import-graph tool"}}.
// Prints the capability's output on stdout and exits 0; a rule capability exits 1 when it finds violations; bad arguments exit 2.
// Read-only and dependency-free: it never writes to the repo and uses only the runtime and tools the repo already has.
import { parseArgs } from 'node:util';

const CAPABILITY = '{{capability}}';

// The output contract per capability; skills parse these shapes, so they never change per repo.
const FORMAT = {
  'graph.imports': (edges) => JSON.stringify(edges),
  'graph.boundaries': (violations) => JSON.stringify(violations),
  'schema.read': (schema) => JSON.stringify(schema),
  'code.search': (hits) => hits.map(({ path, line, text }) => `${path}:${line}:${text}`).join('\n'),
  'symbols.list': (symbols) => symbols.map(({ name, kind, line }) => `${name} ${kind} ${line}`).join('\n'),
  'workspace.list': (workspaces) => JSON.stringify(workspaces),
  'lint.custom': (violations) => violations.map(({ path, line, rule, message }) => `${path}:${line}: ${rule}: ${message}`).join('\n'),
  'rules.structural': (violations) => violations.map(({ path, line, rule, message }) => `${path}:${line}: ${rule}: ${message}`).join('\n'),
};
const RULE_CAPABILITIES = new Set(['lint.custom', 'rules.structural']);

// ven-profile fills {file} with nothing and leaves an unknown {name} as the literal text when a caller passes no value.
function provided(value) {
  return value && !/^\{\w+\}$/.test(value) ? value : undefined;
}

function readOptions(argv) {
  const { values } = parseArgs({
    args: argv,
    options: { root: { type: 'string', default: '.' }, file: { type: 'string' }, pattern: { type: 'string' } },
  });
  return { root: values.root, file: provided(values.file), pattern: provided(values.pattern) };
}

// Returns the data FORMAT[CAPABILITY] expects, sorted, with paths relative to root.
// With no file or pattern it covers the whole repo (or returns an empty list), because `ven-profile prove-adapters` runs it bare.
function collect({ root, file, pattern }) {
  {{the extraction for this repo}}
}

try {
  const result = collect(readOptions(process.argv.slice(2)));
  const output = FORMAT[CAPABILITY](result);
  if (output) process.stdout.write(`${output}\n`);
  process.exitCode = RULE_CAPABILITIES.has(CAPABILITY) && result.length > 0 ? 1 : 0;
} catch (error) {
  process.stderr.write(`${CAPABILITY} adapter: ${error.message}\n`);
  process.exitCode = 2;
}
