#!/usr/bin/env node
import { allow, block, runHook, writeAll } from '../lib/hookio.mjs';
import { matchesAny } from '../lib/globs.mjs';
import { loadProfile } from '../lib/profile.mjs';
import { TreeHashError, changedFilesBetween, mergeBaseWithDefault, repoRoot, tryGit, venDir, workingTreeHash } from '../lib/repo.mjs';
import { appendDecision, clearBaseline, passedVerifyFor, readBaseline, readPlaybookState, readSession, writeBaseline, writeSession } from '../lib/state.mjs';

const MAX_BLOCKS = 3;
const GATED_AGENT = /(^|:)ven-coder$/;

const isAgentEvent = (event) => event === 'SubagentStart' || event === 'SubagentStop';
const isGatedAgent = (input) => GATED_AGENT.test(input.agent_type ?? '');

// Only the stop events can block; a failure when a session or agent starts must not lock anyone out.
function failureMode(input) {
  if (input?.hook_event_name === 'Stop') return 'block';
  if (input?.hook_event_name === 'SubagentStop' && isGatedAgent(input)) return 'block';
  return 'allow';
}

await runHook('verify-gate', main, { onError: failureMode, onRelease: recordRelease });

function recordRelease(input, message) {
  const cwd = input?.cwd ?? process.cwd();
  appendDecision(venDir(cwd), { worktree: repoRoot(cwd), step: 'verify', decision: 'UNVERIFIED', evidence: `verify-gate released after an internal error: ${message}` });
}

// No start tree is recorded when the session began before onboarding wrote the profile. Diffing from
// where HEAD left the default branch gates a feature branch's own commits, but on the default branch
// itself only uncommitted work, not the history that was already there when the clone was made.
function branchStartTree(cwd) {
  const from = mergeBaseWithDefault(cwd) ?? 'HEAD';
  return tryGit(['rev-parse', `${from}^{tree}`], cwd);
}

// A new session in a worktree that is still unverified inherits the earlier baseline, so /clear
// can't wash away the work that has not been proven yet.
function recordStart({ dir, root, scopeId, session, cwd, isAgent }) {
  if (session.start_tree) return;
  const currentTree = workingTreeHash(cwd);
  const head = tryGit(['rev-parse', 'HEAD'], cwd);
  const baseline = isAgent ? null : readBaseline(dir, root);
  const inherited = baseline?.start_tree && baseline.head === head && !passedVerifyFor(dir, currentTree);
  const startTree = inherited ? baseline.start_tree : currentTree;
  if (!isAgent && !inherited) writeBaseline(dir, root, currentTree, head);
  writeSession(dir, scopeId, { root, start_tree: startTree, blocks: {} });
}

// An unreadable file makes `git add -A` fail; the session can't fix that by verifying, so warn and release.
function hashOrRelease(cwd) {
  try {
    return workingTreeHash(cwd);
  } catch (error) {
    if (!(error instanceof TreeHashError)) throw error;
    writeAll(2, `ven verify-gate: ${error.message}; allowing stop without a verify check\n`);
    allow();
  }
}

function main(input) {
  const event = input.hook_event_name;
  const isAgent = isAgentEvent(event);
  if (isAgent && !isGatedAgent(input)) allow();

  const cwd = input.cwd ?? process.cwd();
  const loaded = loadProfile(cwd);
  if (!loaded) allow();

  const { dir, profile } = loaded;
  const scopeId = isAgent ? `agent-${input.agent_id}` : input.session_id;
  const root = repoRoot(cwd);
  const session = readSession(dir, scopeId);

  if (event === 'SessionStart' || event === 'SubagentStart') {
    recordStart({ dir, root, scopeId, session, cwd, isAgent });
    allow();
  }

  const startTree = session.root === root && session.start_tree ? session.start_tree : branchStartTree(cwd);
  const currentTree = hashOrRelease(cwd);
  const changed = changedFilesBetween(cwd, startTree, currentTree);
  if (changed.length === 0) {
    if (event === 'Stop') clearBaseline(dir, root);
    allow();
  }

  const docsOnly = profile.docs_only ?? ['**/*.md', '**/*.mdx', 'docs/**'];
  if (changed.every((file) => matchesAny(file, docsOnly))) allow();
  if (passedVerifyFor(dir, currentTree)) {
    if (!isAgent) clearBaseline(dir, root);
    allow();
  }

  const blocks = session.blocks ?? {};
  const count = (blocks[currentTree] ?? 0) + 1;
  const playbook = readPlaybookState(dir, root)?.playbook ?? '';

  if (count > MAX_BLOCKS) {
    appendDecision(dir, {
      worktree: root,
      playbook,
      step: 'verify',
      decision: 'UNVERIFIED',
      evidence: `verify-gate released after ${MAX_BLOCKS} blocks; tree ${currentTree}; files: ${changed.slice(0, 10).join(', ')}`,
    });
    allow();
  }

  writeSession(dir, scopeId, { ...session, root, start_tree: startTree, blocks: { ...blocks, [currentTree]: count } });

  const verifyKeys = Object.entries(profile.verify ?? {})
    .map(([changeType, key]) => `  - ${changeType}: ven-profile verify ${key}`)
    .join('\n');
  const shown = changed.slice(0, 8).join(', ') + (changed.length > 8 ? `, +${changed.length - 8} more` : '');

  block(`ven verify-gate (block ${count}/${MAX_BLOCKS}): code changed (${shown}) and no passing verify is logged for the current working tree.
"It compiles" is not proof. Run the check that proves this change type works, as described in ${dir}/verify.md:
${verifyKeys || '  - ven-profile verify <command key from the profile>'}
\`ven-profile verify\` runs the command and logs the result against this exact tree, so verify after your last edit.
If this change cannot be verified here, say exactly why. After ${MAX_BLOCKS} blocks the gate releases and records UNVERIFIED in the decision log.`);
}
