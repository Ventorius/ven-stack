#!/usr/bin/env node
import { allow, block, readHookInput } from '../lib/hookio.mjs';
import { matchesAny } from '../lib/globs.mjs';
import { loadProfile } from '../lib/profile.mjs';
import { changedFilesBetween, defaultBranch, repoRoot, tryGit, workingTreeHash } from '../lib/repo.mjs';
import { appendDecision, passedVerifyFor, readPlaybookState, readSession, writeSession } from '../lib/state.mjs';

const MAX_BLOCKS = 3;
const GATED_AGENT = /(^|:)ven-coder$/;

const input = await readHookInput();
const cwd = input.cwd ?? process.cwd();
const loaded = loadProfile(cwd);
if (!loaded) allow();

const { dir, profile } = loaded;
const event = input.hook_event_name;
const isAgent = event === 'SubagentStart' || event === 'SubagentStop';
if (isAgent && !GATED_AGENT.test(input.agent_type ?? '')) allow();

const scopeId = isAgent ? `agent-${input.agent_id}` : input.session_id;
const root = repoRoot(cwd);
const session = readSession(dir, scopeId);

if (event === 'SessionStart' || event === 'SubagentStart') {
  if (!session.start_tree) writeSession(dir, scopeId, { root, start_tree: workingTreeHash(cwd), blocks: {} });
  allow();
}

// No start tree is recorded when the session began before onboarding wrote the profile. Diffing from
// where HEAD left the default branch gates a feature branch's own commits, but on the default branch
// itself only uncommitted work, not the history that was already there when the clone was made.
function branchStartTree() {
  const base = defaultBranch(cwd);
  const from = (base && tryGit(['merge-base', 'HEAD', base], cwd)) ?? 'HEAD';
  return tryGit(['rev-parse', `${from}^{tree}`], cwd);
}

const startTree = session.root === root && session.start_tree ? session.start_tree : branchStartTree();
const currentTree = workingTreeHash(cwd);
const changed = changedFilesBetween(cwd, startTree, currentTree);
if (changed.length === 0) allow();

const docsOnly = profile.docs_only ?? ['**/*.md', '**/*.mdx', 'docs/**'];
if (changed.every((file) => matchesAny(file, docsOnly))) allow();
if (passedVerifyFor(dir, currentTree)) allow();

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
