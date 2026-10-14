#!/usr/bin/env node
// Runs this pack's eval suite with the ven core plugin loaded beside it.
// A case may only load plugins inside the directory under test, so ven is copied to .ven/ for the run and removed after.
// Eval runs don't put a plugin's bin/ on the PATH, but they inherit PATH from this process, so the copy's bin/ goes first.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, rmSync } from 'node:fs';
import { delimiter, dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const USAGE = `usage: node scripts/eval.mjs --ven <ven plugin root> [claude plugin eval options]

  Always passes --ablation none --scaffold --trust-plugin --no-publish.
  Typical: --runs 3 --max-cost-usd 15 [--case <glob>] [--allow-tools "Bash(ven-profile *)" Edit Write]`;

const packDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const venFlag = args.indexOf('--ven');
const venRoot = venFlag === -1 ? null : args[venFlag + 1];

if (!venRoot || !existsSync(join(venRoot, '.claude-plugin', 'plugin.json'))) {
  console.error(USAGE);
  process.exit(2);
}

const passThrough = args.filter((_, index) => index !== venFlag && index !== venFlag + 1);
const venCopy = join(packDir, '.ven');
// ven's own eval cases stay out of the copy, or they would run as part of this suite.
const outsideVenEvals = (source) => relative(resolve(venRoot), source).split(sep)[0] !== 'evals';

rmSync(venCopy, { recursive: true, force: true });
cpSync(resolve(venRoot), venCopy, { recursive: true, filter: outsideVenEvals });
try {
  // The forge authored these cases and fixtures, and a Bash-tool run has no terminal to answer the trust prompt.
  const fixed = ['--ablation', 'none', '--scaffold', '--trust-plugin', '--no-publish'];
  const env = { ...process.env, PATH: `${join(venCopy, 'bin')}${delimiter}${process.env.PATH}` };
  const result = spawnSync('claude', ['plugin', 'eval', packDir, ...fixed, ...passThrough], { stdio: 'inherit', env });
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(venCopy, { recursive: true, force: true });
}
