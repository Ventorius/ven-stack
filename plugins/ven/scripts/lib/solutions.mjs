import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { splitFrontmatter } from './frontmatter.mjs';
import { matchesGlob } from './globs.mjs';

function solutionFiles(dir) {
  const base = join(dir, 'solutions');
  if (!existsSync(base)) return [];
  return readdirSync(base, { recursive: true })
    .filter((entry) => entry.endsWith('.md'))
    .map((entry) => join(base, entry));
}

function covers(anchor, file) {
  return anchor === file || file.startsWith(`${anchor.replace(/\/$/, '')}/`) || matchesGlob(file, anchor);
}

// Solution entries whose `files:` anchors cover at least one touched file, best match first.
export function relevantSolutions(dir, touched) {
  return solutionFiles(dir)
    .map((path) => {
      const { data } = splitFrontmatter(readFileSync(path, 'utf8'), { strict: false });
      const anchors = data?.files ?? [];
      const score = touched.filter((file) => anchors.some((anchor) => covers(anchor, file))).length;
      return { path, data, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function describeSolution(dir, { path, data }) {
  const relativePath = path.slice(dir.length + 1);
  return `- ${relativePath}: ${data?.title ?? ''} — symptoms: ${[].concat(data?.symptoms ?? []).join('; ')}`;
}
