#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadUpstreams, noticesDir, parseFlags } from './provenance.mjs';

const USAGE = 'build-notices [--root DIR] [--check]: write THIRD_PARTY_NOTICES.md from docs/build/notices/*.md';
// `- <upstream repo>[ (note)] — <what>`; the repo name picks the section, the rest is the bullet.
const LINE = /^- (\S+)(?: \(.*?\))?\s+—\s+(.+)$/;

export function buildNotices(root) {
  const dir = noticesDir(root);
  const upstreams = loadUpstreams(root);
  const bullets = new Map(upstreams.map((upstream) => [upstream.repo, new Set()]));

  const groups = readdirSync(dir).filter((file) => file.endsWith('.md') && !file.startsWith('_')).sort();
  for (const file of groups) {
    for (const line of readFileSync(join(dir, file), 'utf8').split('\n')) {
      const match = line.match(LINE);
      if (!match) continue;
      const [, repo, text] = match;
      if (!bullets.has(repo)) throw new Error(`${file}: upstream ${repo} has no entry in _upstreams.json`);
      bullets.get(repo).add(`- ${text}`);
    }
  }

  const sections = upstreams
    .slice()
    .sort((a, b) => a.repo.localeCompare(b.repo))
    .filter((upstream) => bullets.get(upstream.repo).size > 0)
    .map((upstream) =>
      [
        `## ${upstream.repo} @ ${upstream.sha}`,
        '',
        ...upstream.copyright,
        ...(upstream.copyright.length ? [''] : []),
        ...[...bullets.get(upstream.repo)].sort(),
      ].join('\n'),
    );

  const read = (file) => readFileSync(join(dir, file), 'utf8').trimEnd();
  return `${[read('_preamble.md'), ...sections, read('_license.md')].join('\n\n')}\n`;
}

function main() {
  const flags = parseFlags(process.argv.slice(2));
  const output = join(flags.root, 'THIRD_PARTY_NOTICES.md');
  const built = buildNotices(flags.root);
  if (!flags.check) {
    writeFileSync(output, built);
    return;
  }
  const current = existsSync(output) ? readFileSync(output, 'utf8') : '';
  if (current === built) return;
  process.stderr.write('THIRD_PARTY_NOTICES.md is out of date: run `bun run notices` and commit the result\n');
  process.exit(1);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n${USAGE}\n`);
  process.exit(1);
}
