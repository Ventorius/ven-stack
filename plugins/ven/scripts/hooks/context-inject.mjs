#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { splitFrontmatter } from '../lib/frontmatter.mjs';
import { matchesGlob } from '../lib/globs.mjs';
import { addContext, allow, readHookInput } from '../lib/hookio.mjs';
import { loadProfile, staleSources } from '../lib/profile.mjs';
import { branchTouchedFiles, repoRoot } from '../lib/repo.mjs';
import { readPlaybookState } from '../lib/state.mjs';

const MAX_SOLUTIONS = 3;

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

function relevantSolutions(dir, touched) {
  return solutionFiles(dir)
    .map((path) => {
      const { data } = splitFrontmatter(readFileSync(path, 'utf8'), { strict: false });
      const anchors = data?.files ?? [];
      const score = touched.filter((file) => anchors.some((anchor) => covers(anchor, file))).length;
      return { path, data, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SOLUTIONS);
}

const input = await readHookInput();
const cwd = input.cwd ?? process.cwd();
const root = repoRoot(cwd);
if (!root) allow();

const loaded = loadProfile(cwd);
if (!loaded) {
  addContext('SessionStart', 'ven: this repo has no ven profile yet. Commands and paths are unknown; run /ven:onboard before /ven:do.');
}

const { dir, profile } = loaded;
const sections = [`ven: this repo is onboarded. State directory (never committed): ${dir}`];

const mapPath = join(dir, 'map.md');
if (existsSync(mapPath)) sections.push(readFileSync(mapPath, 'utf8').trim());

const stale = staleSources(profile, root);
if (stale.length > 0) {
  sections.push(`Profile may be stale: ${stale.join(', ')} changed after ${profile.generated_at}. Run /ven:onboard --refresh before relying on its commands.`);
}

const state = readPlaybookState(dir, root);
if (state?.playbook) {
  const steps = (state.steps ?? []).map((step) => `${step.step}=${step.decision}`).join(', ');
  sections.push(`Active playbook in this worktree: ${state.playbook} (since ${state.started_at})${steps ? `; recorded: ${steps}` : ''}.`);
}

const solutions = relevantSolutions(dir, branchTouchedFiles(cwd));
if (solutions.length > 0) {
  const lines = solutions.map(({ path, data }) => `- ${relative(dir, path)}: ${data?.title ?? ''} — symptoms: ${[].concat(data?.symptoms ?? []).join('; ')}`);
  sections.push(`Past solutions touching files on this branch (read before changing them):\n${lines.join('\n')}`);
}

addContext('SessionStart', sections.join('\n\n'));
