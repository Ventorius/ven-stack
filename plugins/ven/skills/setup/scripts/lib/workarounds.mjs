import { matchesAny } from './globs.mjs';
import { tryGit } from './repo.mjs';

export const DEFAULT_DOCS_ONLY = ['**/*.md', '**/*.mdx', 'docs/**'];
const ALLOW_MARKER = /ven-allow:\s*\S+/;

export function docsOnlyGlobs(profile) {
  return profile?.docs_only ?? DEFAULT_DOCS_ONLY;
}

// Per-file added and removed lines between two trees. Header lines are only read outside hunks,
// so a content line that happens to start with "+++" is still content.
export function diffLines(cwd, fromTree, toTree) {
  if (!fromTree || !toTree || fromTree === toTree) return [];
  const patch = tryGit(['diff', '-U0', '--no-color', '--no-ext-diff', fromTree, toTree], cwd) ?? '';
  const files = [];
  let current = null;
  let inHunk = false;
  for (const line of patch.split('\n')) {
    if (line.startsWith('diff --git ')) {
      inHunk = false;
      current = null;
    } else if (!inHunk && line.startsWith('+++ ')) {
      const path = line.slice(4);
      current = path === '/dev/null' ? null : { file: path.replace(/^b\//, ''), added: [], removed: [] };
      if (current) files.push(current);
    } else if (line.startsWith('@@')) {
      inHunk = true;
    } else if (inHunk && current && line.startsWith('+')) {
      current.added.push(line.slice(1));
    } else if (inHunk && current && line.startsWith('-')) {
      current.removed.push(line.slice(1));
    }
  }
  return files;
}

// A bad pattern in the profile is reported and skipped, never fatal.
function compilePatterns(entries, kind, flags, warnings) {
  return (Array.isArray(entries) ? entries : []).flatMap(({ pattern, why }) => {
    try {
      return [{ pattern, why, regex: new RegExp(pattern, flags) }];
    } catch (error) {
      warnings.push(`invalid ${kind} pattern \`${pattern}\` skipped: ${error.message}`);
      return [];
    }
  });
}

// Suppressions a diff adds, and assertions it removes from test files: checks hidden instead of fixed.
export function findWorkarounds(files, profile) {
  const warnings = [];
  const suppressions = compilePatterns(profile?.suppressions, 'suppression', '', warnings);
  const assertions = compilePatterns(profile?.assertions, 'assertion', 'g', warnings);
  const testGlobs = profile?.tests?.patterns ?? [];
  const findings = [];
  const allowed = [];

  for (const { file, added, removed } of files.filter(({ file }) => !matchesAny(file, docsOnlyGlobs(profile)))) {
    for (const line of added) {
      const hit = suppressions.find(({ regex }) => regex.test(line));
      if (!hit) continue;
      if (ALLOW_MARKER.test(line)) allowed.push(`${file}: ${line.trim()}`);
      else findings.push(`- ${file} adds \`${line.trim()}\`: ${hit.why}`);
    }
    if (!matchesAny(file, testGlobs) || added.some((line) => ALLOW_MARKER.test(line))) continue;
    for (const { regex, pattern, why } of assertions) {
      const count = (lines) => lines.reduce((sum, line) => sum + (line.match(regex)?.length ?? 0), 0);
      const lost = count(removed) - count(added);
      if (lost > 0) findings.push(`- ${file} removes ${lost} assertion(s) matching \`${pattern}\`: ${why}`);
    }
  }
  return { findings, allowed, warnings };
}
