#!/usr/bin/env node
// Cheap routing tier: one tool-less haiku call per case instead of a full
// `claude plugin eval` run. Usage:
//   bun plugins/ven/evals/routing/quick.mjs [--concurrency N] [--filter substr] [--runner path]
// A runner is an async (prompt) => ({ text, costUsd }) default export.
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const here = dirname(fileURLToPath(import.meta.url));
const skillDir = join(here, '..', '..', 'skills', 'do');
const defaultResultsDir = join(here, '..', 'results');

const stripFrontmatter = (text) => text.replace(/^---\n[\s\S]*?\n---\n/, '');

export const loadRouter = () => stripFrontmatter(readFileSync(join(skillDir, 'SKILL.md'), 'utf8'));

export const loadPlaybooks = () => {
  const dir = join(skillDir, 'playbooks');
  return readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .sort()
    .map((file) => {
      const text = readFileSync(join(dir, file), 'utf8');
      const description = text.match(/^description:\s*(.*)$/m)[1].replace(/^"|"$/g, '');
      return { name: file.replace(/\.md$/, ''), description };
    });
};

export const buildPrompt = ({ router, playbooks, task }) => `${router}

## Playbooks available

${playbooks.map(({ name, description }) => `- ${name}: ${description}`).join('\n')}

## Your job now

You have no tools and the repo state is unknown. Do not run any step. Reply with exactly one line and nothing else, in the form \`**Playbook: <name>** (core) - <one-line reason>\`.

Task: ${task}
`;

// Same match the generated eval cases use (generate.mjs `grader`).
export const gradeReply = (text, playbook) => new RegExp(`Playbook: ${playbook}\\*\\*`).test(text);

export const claudeRunner = (prompt) =>
  new Promise((resolvePromise, reject) => {
    const child = spawn('claude', ['-p', '--model', 'haiku', '--output-format', 'json', '--tools', '', '--no-session-persistence'], { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) return reject(new Error(`claude exited ${code}: ${stderr.trim()}`));
      const parsed = JSON.parse(stdout);
      resolvePromise({ text: parsed.result ?? '', costUsd: parsed.total_cost_usd ?? 0 });
    });
    child.stdin.end(prompt);
  });

const mapWithConcurrency = async (items, limit, fn) => {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
};

export const runQuick = async ({ cases, playbooks, router, runner, concurrency, filter, resultsDir, now }) => {
  const selected = cases.filter(({ name }) => name.includes(filter));
  const graded = await mapWithConcurrency(selected, concurrency, async ({ name, playbook, task }) => {
    try {
      const { text, costUsd } = await runner(buildPrompt({ router, playbooks, task }));
      return { name, playbook, pass: gradeReply(text, playbook), reply: text.trim(), costUsd };
    } catch (error) {
      return { name, playbook, pass: false, reply: '', costUsd: 0, error: error.message };
    }
  });
  const passed = graded.filter((c) => c.pass).length;
  const summary = {
    tier: 'quick',
    startedAt: now.toISOString(),
    passRate: graded.length === 0 ? 0 : passed / graded.length,
    costUsd: Number(graded.reduce((sum, c) => sum + c.costUsd, 0).toFixed(6)),
    cases: graded,
  };
  mkdirSync(resultsDir, { recursive: true });
  writeFileSync(join(resultsDir, `quick-${now.toISOString().replace(/[:.]/g, '-')}.json`), `${JSON.stringify(summary, null, 2)}\n`);
  return summary;
};

const main = async () => {
  const { values } = parseArgs({ options: { concurrency: { type: 'string', default: '4' }, filter: { type: 'string', default: '' }, runner: { type: 'string' } } });
  const concurrency = Number(values.concurrency);
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    console.error('--concurrency must be a positive integer');
    process.exit(2);
  }
  const runner = values.runner ? (await import(pathToFileURL(resolve(values.runner)).href)).default : claudeRunner;
  const cases = JSON.parse(readFileSync(join(here, 'cases.json'), 'utf8'));
  const summary = await runQuick({
    cases,
    playbooks: loadPlaybooks(),
    router: loadRouter(),
    runner,
    concurrency,
    filter: values.filter,
    resultsDir: defaultResultsDir,
    now: new Date(),
  });
  for (const c of summary.cases) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name} (want ${c.playbook})${c.error ? ` error: ${c.error}` : ''}`);
  const passed = summary.cases.filter((c) => c.pass).length;
  console.log(`${passed}/${summary.cases.length} passed, $${summary.costUsd}`);
  process.exitCode = passed === summary.cases.length ? 0 : 1;
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
