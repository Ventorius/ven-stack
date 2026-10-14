#!/usr/bin/env node
import { allow, block, readHookInput } from '../lib/hookio.mjs';

const GLOBAL_OPTIONS_WITH_VALUE = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path']);

// Shell-word split that is good enough to find git invocations; quotes are respected, expansions are not.
function words(segment) {
  const result = [];
  const regex = /"((?:\\.|[^"\\])*)"|'([^']*)'|(\S+)/g;
  let match;
  while ((match = regex.exec(segment))) result.push(match[1] ?? match[2] ?? match[3]);
  return result;
}

function gitInvocations(command) {
  return command
    .split(/&&|\|\||;|\||\n/)
    .map((segment) => words(segment.trim()))
    .flatMap((tokens) => {
      const start = tokens.findIndex((token) => token === 'git' || token.endsWith('/git'));
      if (start === -1) return [];
      let index = start + 1;
      while (index < tokens.length && tokens[index].startsWith('-')) {
        index += GLOBAL_OPTIONS_WITH_VALUE.has(tokens[index]) ? 2 : 1;
      }
      return [{ subcommand: tokens[index], args: tokens.slice(index + 1) }];
    });
}

const RULES = [
  {
    matches: ({ subcommand, args }) =>
      subcommand === 'push' &&
      args.some((arg) => arg === '-f' || arg.startsWith('--force') || /^\+/.test(arg) || /^-[a-zA-Z]*f/.test(arg)),
    why: 'force-push rewrites shared history',
  },
  {
    matches: ({ subcommand, args }) => subcommand === 'reset' && args.includes('--hard'),
    why: 'reset --hard discards uncommitted work irreversibly',
  },
  {
    matches: ({ subcommand, args }) => subcommand === 'clean' && !args.some((arg) => arg === '-n' || arg === '--dry-run'),
    why: 'clean deletes untracked files irreversibly',
  },
  {
    matches: ({ subcommand, args }) =>
      subcommand === 'branch' && args.some((arg) => ['-d', '-D', '--delete'].includes(arg) || /^-[a-zA-Z]*[dD]/.test(arg)),
    why: 'branch deletion can drop unmerged commits',
  },
];

const input = await readHookInput();
const command = input.tool_input?.command ?? '';
for (const invocation of gitInvocations(command)) {
  const rule = RULES.find((candidate) => candidate.matches(invocation));
  if (rule) {
    block(`ven git-guardrails: blocked \`git ${invocation.subcommand} ${invocation.args.join(' ')}\` because ${rule.why}.
Do not work around this block. If the operation is really needed, stop and ask the user to run it themselves.`);
  }
}
allow();
