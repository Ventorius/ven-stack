#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { addContext, allow, editedFilePath, runHook } from '../lib/hookio.mjs';
import { matchesAny } from '../lib/globs.mjs';
import { commandSpec, loadProfile, renderCommand, shellQuote } from '../lib/profile.mjs';
import { repoRelative, repoRoot } from '../lib/repo.mjs';

await runHook('format', main);

function main(input) {
  const cwd = input.cwd ?? process.cwd();
  const loaded = loadProfile(cwd);
  if (!loaded) allow();

  const spec = commandSpec(loaded.profile, 'format');
  if (!spec || spec.status !== 'verified') allow();

  const root = repoRoot(cwd);
  const filePath = editedFilePath(input);
  if (!filePath) allow();
  const file = repoRelative(root, filePath);
  if (file.startsWith('..') || file.startsWith('.git/') || (spec.globs && !matchesAny(file, spec.globs))) allow();

  const command = renderCommand(spec.run, { file: shellQuote(file), files: shellQuote(file) });
  try {
    execSync(command, { cwd: join(root, spec.cwd ?? '.'), stdio: 'pipe', timeout: (spec.timeout_s ?? 20) * 1000 });
  } catch (error) {
    const output = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim().split('\n').slice(-15).join('\n');
    addContext('PostToolUse', `ven format: \`${command}\` failed on ${file}. The file is unformatted; fix the syntax error it reports if any.\n${output}`);
  }
  allow();
}
