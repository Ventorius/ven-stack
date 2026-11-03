#!/usr/bin/env node
// Runs this pack's eval suite with ven's skills loaded beside it. Pack evals run on the `claude` CLI.
// A case may only load plugins inside the directory under test, so ven's skills are copied to .ven/skills/
// for the run and removed after. Runs inherit PATH from this process, so the copy's tools go first.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, rmSync } from 'node:fs';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const USAGE = `usage: node scripts/eval.mjs --ven <ven skills dir, from ven-profile root> [claude plugin eval options]

  Always passes --ablation none --scaffold --trust-plugin --no-publish.
  Typical: --runs 3 --max-cost-usd 15 [--case <glob>] [--allow-tools "Bash(ven-profile *)" Edit Write]`;

const packDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const venFlag = args.indexOf('--ven');
const venSkills = venFlag === -1 ? null : args[venFlag + 1];

if (!venSkills || !existsSync(join(venSkills, 'setup', 'scripts', 'ven-profile'))) {
  console.error(USAGE);
  process.exit(2);
}

const passThrough = args.filter((_, index) => index !== venFlag && index !== venFlag + 1);
const venCopy = join(packDir, '.ven');

rmSync(venCopy, { recursive: true, force: true });
cpSync(resolve(venSkills), join(venCopy, 'skills'), { recursive: true });
try {
  // The forge authored these cases and fixtures, and a Bash-tool run has no terminal to answer the trust prompt.
  const fixed = ['--ablation', 'none', '--scaffold', '--trust-plugin', '--no-publish'];
  const env = { ...process.env, PATH: `${join(venCopy, 'skills', 'setup', 'scripts')}${delimiter}${process.env.PATH}` };
  const result = spawnSync('claude', ['plugin', 'eval', packDir, ...fixed, ...passThrough], { stdio: 'inherit', env });
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(venCopy, { recursive: true, force: true });
}
