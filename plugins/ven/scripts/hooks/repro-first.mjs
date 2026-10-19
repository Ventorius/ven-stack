#!/usr/bin/env node
import { allow, block, editedFilePath, runHook } from '../lib/hookio.mjs';
import { matchesAny } from '../lib/globs.mjs';
import { loadProfile } from '../lib/profile.mjs';
import { repoRelative, repoRoot } from '../lib/repo.mjs';
import { readPlaybookState } from '../lib/state.mjs';

await runHook('repro-first', main, { onError: 'block-once' });

function main(input) {
  const cwd = input.cwd ?? process.cwd();
  const loaded = loadProfile(cwd);
  if (!loaded) allow();

  const { dir, profile } = loaded;
  const root = repoRoot(cwd);
  const filePath = editedFilePath(input);
  if (!filePath) allow();
  const file = repoRelative(root, filePath);
  if (file.startsWith('..') || file.startsWith('.git/')) allow();

  const testGlobs = profile.tests?.patterns ?? [];
  const docsGlobs = profile.docs_only ?? ['**/*.md', '**/*.mdx', 'docs/**'];
  if (matchesAny(file, testGlobs) || matchesAny(file, docsGlobs)) allow();

  // Read last: corrupt playbook state must never block edits that are allowed anyway.
  const state = readPlaybookState(dir, root);
  if (state?.playbook !== 'bug-fix' || state.reproduced) allow();

  block(`ven repro-first: the bug-fix playbook is active in this worktree and no reproduction is recorded, so source edits are blocked.
Reproduce first: write a failing test (test files match ${testGlobs.join(', ') || 'the profile test patterns'}) or a repro script, run it, and confirm it fails for the reported reason.
Then record it: ven-decisions add --step reproduce --decision reproduced --evidence "<test or script> fails with <error>"
Edits to test and docs files are allowed now. If the bug genuinely cannot be reproduced, record that with --decision cannot-reproduce and the evidence, and ask the user how to proceed.`);
}
