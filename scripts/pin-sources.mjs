#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { loadUpstreams, parseFlags, walk } from './provenance.mjs';

const USAGE = 'pin-sources [--root DIR] [--check]: replace @main in metadata.source with the SHA in _upstreams.json';
const SOURCE_LINE = /^[ \t]+source:[^\n]*$/m;

export function pinLine(line, shas) {
  const unpinned = new Set();
  const pinned = line.replace(/([\w.-]+\/[\w.-]+)@main\b/g, (whole, repo) => {
    if (shas.has(repo)) return `${repo}@${shas.get(repo)}`;
    unpinned.add(repo);
    return whole;
  });
  return { pinned, unpinned };
}

// Only the `source:` frontmatter line is touched; prose that mentions @main stays as written.
export function pinSources(root) {
  const shas = new Map(loadUpstreams(root).map(({ repo, sha }) => [repo, sha]));
  const files = walk(join(root, 'plugins', 'ven', 'skills')).filter((path) => path.endsWith('.md'));
  const changed = [];
  const unpinned = new Set();
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const frontmatter = text.match(/^---\n[\s\S]*?\n---\n/);
    const line = frontmatter?.[0].match(SOURCE_LINE)?.[0];
    if (!line) continue;
    const result = pinLine(line, shas);
    result.unpinned.forEach((repo) => unpinned.add(repo));
    if (result.pinned !== line) changed.push({ file, text: text.replace(line, () => result.pinned) });
  }
  return { changed, unpinned: [...unpinned].sort() };
}

function main() {
  const flags = parseFlags(process.argv.slice(2));
  const { changed, unpinned } = pinSources(flags.root);
  if (!flags.check) for (const { file, text } of changed) writeFileSync(file, text);
  const names = changed.map(({ file }) => `\n  ${relative(flags.root, file)}`).join('');
  console.log(`${changed.length} files ${flags.check ? 'need pinning' : 'changed'}${names}`);
  if (unpinned.length) console.log(`left at @main (no SHA in _upstreams.json): ${unpinned.join(', ')}`);
  if (flags.check && changed.length) process.exit(1);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n${USAGE}\n`);
  process.exit(1);
}
