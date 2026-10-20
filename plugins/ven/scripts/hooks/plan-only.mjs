#!/usr/bin/env node
import { allow, block, editedFilePath, runHook } from '../lib/hookio.mjs';
import { loadProfile } from '../lib/profile.mjs';
import { repoRelative, repoRoot } from '../lib/repo.mjs';
import { readPlaybookState } from '../lib/state.mjs';

await runHook('plan-only', main, { onError: 'block-once' });

function main(input) {
  const cwd = input.cwd ?? process.cwd();
  const loaded = loadProfile(cwd);
  if (!loaded) allow();

  const { dir } = loaded;
  const root = repoRoot(cwd);
  const filePath = editedFilePath(input);
  if (!filePath) allow();
  const file = repoRelative(root, filePath);
  if (file.startsWith('..') || file.startsWith('.git/')) allow();

  // Read last: corrupt playbook state must never block edits that are allowed anyway.
  const state = readPlaybookState(dir, root);
  if (state?.playbook !== 'epic') allow();

  block(`ven plan-only: the epic playbook is active in this worktree. Epic plans, it doesn't build, so every edit inside the repo is blocked, docs and tests included.
Planning writes go to the roadmap in the state directory: ${dir}/roadmaps/<slug>/ (outside the repo, so they pass). Prototypes go in a scratch directory outside the repo.
To build, finish this session (ven-decisions end --outcome done, after learning-check) and run the feature playbook.`);
}
