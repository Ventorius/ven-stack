#!/usr/bin/env node
import { relative } from 'node:path';
import { allow, block, editedFilePath, readHookInput } from '../lib/hookio.mjs';
import { matchesAny } from '../lib/globs.mjs';
import { loadProfile } from '../lib/profile.mjs';
import { repoRoot } from '../lib/repo.mjs';
import { readPlaybookState } from '../lib/state.mjs';

const input = await readHookInput();
const cwd = input.cwd ?? process.cwd();
const loaded = loadProfile(cwd);
if (!loaded) allow();

const { dir, profile } = loaded;
const root = repoRoot(cwd);
const state = readPlaybookState(dir, root);
if (state?.playbook !== 'bug-fix' || state.reproduced) allow();

const filePath = editedFilePath(input);
if (!filePath) allow();
const file = relative(root, filePath);
if (file.startsWith('..')) allow();

const testGlobs = profile.tests?.patterns ?? [];
const docsGlobs = profile.docs_only ?? ['**/*.md', '**/*.mdx', 'docs/**'];
if (matchesAny(file, testGlobs) || matchesAny(file, docsGlobs)) allow();

block(`ven repro-first: the bug-fix playbook is active in this worktree and no reproduction is recorded, so source edits are blocked.
Reproduce first: write a failing test (test files match ${testGlobs.join(', ') || 'the profile test patterns'}) or a repro script, run it, and confirm it fails for the reported reason.
Then record it: ven-decisions add --step reproduce --decision reproduced --evidence "<test or script> fails with <error>"
Edits to test and docs files are allowed now. If the bug genuinely cannot be reproduced, record that with --decision cannot-reproduce and the evidence, and ask the user how to proceed.`);
