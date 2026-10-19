#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { addContext, allow, runHook } from '../lib/hookio.mjs';
import { loadProfile, staleSources } from '../lib/profile.mjs';
import { branchTouchedFiles, repoRoot } from '../lib/repo.mjs';
import { describeSolution, relevantSolutions } from '../lib/solutions.mjs';
import { readPlaybookState } from '../lib/state.mjs';

const MAX_SOLUTIONS = 3;

await runHook('context-inject', main);

function main(input) {
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

  const solutions = relevantSolutions(dir, branchTouchedFiles(cwd)).slice(0, MAX_SOLUTIONS);
  if (solutions.length > 0) {
    const lines = solutions.map((solution) => describeSolution(dir, solution));
    sections.push(`Past solutions touching files on this branch (read before changing them):\n${lines.join('\n')}`);
  }

  addContext('SessionStart', sections.join('\n\n'));
}
