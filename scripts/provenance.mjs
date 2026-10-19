import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const noticesDir = (root) => join(root, 'docs', 'build', 'notices');

export function loadUpstreams(root) {
  return JSON.parse(readFileSync(join(noticesDir(root), '_upstreams.json'), 'utf8'));
}

export function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

// `--root DIR` points the tools at another tree (tests); `--check` reports drift without writing.
export function parseFlags(argv) {
  const flags = { root: DEFAULT_ROOT, check: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--check') flags.check = true;
    else if (argv[i] === '--root') flags.root = resolve(argv[++i]);
    else throw new Error(`unknown argument: ${argv[i]}`);
  }
  return flags;
}
