#!/usr/bin/env node
import { allow, runHook } from '../lib/hookio.mjs';
import { loadProfile } from '../lib/profile.mjs';
import { repoRoot } from '../lib/repo.mjs';
import { CORRECTION, redactSecrets } from '../lib/signals.mjs';
import { appendDecision, readPlaybookState } from '../lib/state.mjs';

const MAX_LENGTH = 200;

await runHook('capture-corrections', main, { silent: true });

// Learning must never get in the way of the prompt: no blocking, no context, no output.
function main(input) {
  const prompt = typeof input.prompt === 'string' ? input.prompt.trim() : '';
  if (!CORRECTION.test(prompt)) allow();

  const cwd = input.cwd ?? process.cwd();
  const loaded = loadProfile(cwd);
  if (!loaded) allow();

  const root = repoRoot(cwd);
  appendDecision(loaded.dir, {
    worktree: root,
    playbook: readPlaybookState(loaded.dir, root)?.playbook ?? '',
    step: 'correction',
    decision: redactSecrets(prompt.replace(/\s+/g, ' ')).slice(0, MAX_LENGTH),
    evidence: `session ${input.session_id ?? ''}`,
  });
  allow();
}
