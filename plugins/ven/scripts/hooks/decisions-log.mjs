#!/usr/bin/env node
import { allow, runHook } from '../lib/hookio.mjs';
import { loadProfile } from '../lib/profile.mjs';
import { repoRoot } from '../lib/repo.mjs';
import { appendDecision } from '../lib/state.mjs';

// ven agents end their final message with this trailer; see the agent files for the contract.
const TRAILER = /^VEN-RESULT:\s*(DONE|BLOCKED)\b(.*)$/m;
const FIELD = (name) => new RegExp(`^${name}:\\s*(.+)$`, 'mi');

await runHook('decisions-log', main);

function main(input) {
  const cwd = input.cwd ?? process.cwd();
  const loaded = loadProfile(cwd);
  if (!loaded) allow();

  const message = input.last_assistant_message ?? '';
  const trailer = message.match(TRAILER);
  if (!trailer) allow();

  const tail = message.slice(trailer.index);
  const field = (name) => tail.match(FIELD(name))?.[1]?.trim() ?? '';
  const status = trailer[1];
  const question = trailer[2].replace(/^[:\s]+/, '').trim();

  appendDecision(loaded.dir, {
    worktree: repoRoot(cwd),
    playbook: field('playbook'),
    step: field('step') || input.agent_type || '',
    decision: status === 'BLOCKED' ? `BLOCKED: ${question || field('question')}` : field('decision') || 'DONE',
    evidence: [field('evidence'), input.agent_type && `agent=${input.agent_type}`].filter(Boolean).join(' | '),
  });
  allow();
}
