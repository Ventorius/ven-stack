#!/usr/bin/env node
import { allow, editDelta, editedFilePath, lineDelta, runHook } from '../lib/hookio.mjs';
import { matchesAny } from '../lib/globs.mjs';
import { loadProfile } from '../lib/profile.mjs';
import { repoRelative, repoRoot, tryGit } from '../lib/repo.mjs';
import { appendDecision, readPlaybookState, readSession, writeSession } from '../lib/state.mjs';

const ALLOW_MARKER = /ven-allow:\s*\S+/;

await runHook('no-workaround', main);

// Compiled once per run; a bad pattern in the profile is reported and skipped, never fatal.
function compilePatterns(entries, kind, flags) {
  const compiled = [];
  for (const { pattern, why } of Array.isArray(entries) ? entries : []) {
    try {
      compiled.push({ pattern, why, regex: new RegExp(pattern, flags) });
    } catch (error) {
      process.stderr.write(`ven no-workaround: invalid ${kind} pattern \`${pattern}\` skipped: ${error.message}\n`);
    }
  }
  return compiled;
}

// A Write replaces the whole file, so only what differs from HEAD counts as this edit's change.
function deltaFor(input, root, file) {
  const content = input.tool_input?.content;
  if (typeof content !== 'string') return editDelta(input);
  const head = tryGit(['show', `HEAD:${file}`], root);
  return head === null ? editDelta(input) : lineDelta(head, content);
}

// A Write of a file that still differs from HEAD repeats the same allowed line on every call; log it once.
function markAllowLogged(dir, sessionId, key) {
  const id = sessionId ?? 'unknown';
  const session = readSession(dir, id);
  const logged = session.allow_logged ?? [];
  if (logged.includes(key)) return false;
  writeSession(dir, id, { ...session, allow_logged: [...logged, key] });
  return true;
}

function main(input) {
  const cwd = input.cwd ?? process.cwd();
  const loaded = loadProfile(cwd);
  if (!loaded) allow();

  const { dir, profile } = loaded;
  const root = repoRoot(cwd);
  const filePath = editedFilePath(input);
  if (!filePath) allow();
  const file = repoRelative(root, filePath);
  if (file.startsWith('..') || file.startsWith('.git/') || matchesAny(file, profile.docs_only ?? ['**/*.md', '**/*.mdx', 'docs/**'])) allow();

  const suppressions = compilePatterns(profile.suppressions, 'suppression', '');
  const assertions = compilePatterns(profile.assertions, 'assertion', 'g');
  const { added, removed } = deltaFor(input, root, file);
  const findings = [];

  for (const { regex, why } of suppressions) {
    for (const line of added.split('\n')) {
      if (!regex.test(line)) continue;
      if (ALLOW_MARKER.test(line)) {
        if (!markAllowLogged(dir, input.session_id, `${file}::${line.trim()}`)) continue;
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
    for (const { regex, pattern, why } of assertions) {
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
}
