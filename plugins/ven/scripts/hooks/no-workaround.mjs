#!/usr/bin/env node
import { relative } from 'node:path';
import { allow, editDelta, editedFilePath, readHookInput } from '../lib/hookio.mjs';
import { matchesAny } from '../lib/globs.mjs';
import { loadProfile } from '../lib/profile.mjs';
import { repoRoot } from '../lib/repo.mjs';
import { appendDecision, readPlaybookState } from '../lib/state.mjs';

const ALLOW_MARKER = /ven-allow:\s*\S+/;

const input = await readHookInput();
const cwd = input.cwd ?? process.cwd();
const loaded = loadProfile(cwd);
if (!loaded) allow();

const { dir, profile } = loaded;
const root = repoRoot(cwd);
const filePath = editedFilePath(input);
if (!filePath) allow();
const file = relative(root, filePath);
if (file.startsWith('..') || file.startsWith('.git/') || matchesAny(file, profile.docs_only ?? ['**/*.md', '**/*.mdx', 'docs/**'])) allow();

const { added, removed } = editDelta(input);
const findings = [];

for (const { pattern, why } of profile.suppressions ?? []) {
  const regex = new RegExp(pattern);
  for (const line of added.split('\n')) {
    if (!regex.test(line)) continue;
    if (ALLOW_MARKER.test(line)) {
      appendDecision(dir, {
        worktree: root,
        playbook: readPlaybookState(dir, root)?.playbook ?? '',
        step: 'no-workaround',
        decision: 'allowed',
        evidence: `${file}: ${line.trim()}`,
      });
      continue;
    }
    findings.push(`- ${file} adds \`${line.trim()}\`: ${why}`);
  }
}

if (matchesAny(file, profile.tests?.patterns ?? [])) {
  for (const { pattern, why } of profile.assertions ?? []) {
    const regex = new RegExp(pattern, 'g');
    const before = removed.match(regex)?.length ?? 0;
    const after = added.match(regex)?.length ?? 0;
    if (before > after && !ALLOW_MARKER.test(added)) {
      findings.push(`- ${file} removes ${before - after} assertion(s) matching \`${pattern}\`: ${why}`);
    }
  }
}

if (findings.length === 0) allow();

// PostToolUse can't undo the edit; exit 2 puts this in front of Claude so it fixes the cause next.
process.stderr.write(`ven no-workaround: this edit suppresses a check instead of fixing the cause.
${findings.join('\n')}
Fix the underlying problem and remove the suppression. If it is genuinely deliberate, put \`ven-allow: <ticket or reason>\` on the same line; every allowance is logged and shows up in review.
`);
process.exit(2);
