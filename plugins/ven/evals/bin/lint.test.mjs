import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { PLUGIN_ROOT, runBin } from '../support/fixture.mjs';

function makePlugin(files) {
  const root = mkdtempSync(join(tmpdir(), 'ven-lint-'));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

const skillFile = ({ name, description, body = 'Do it.', extra = '' }) =>
  `---\nname: ${name}\ndescription: ${description}\n${extra}metadata:\n  layer: L3\n---\n${body}\n`;

const lint = (files) => runBin('ven-lint-skills', ['--root', makePlugin(files)]);
const config = JSON.parse(readFileSync(join(PLUGIN_ROOT, 'lint.json'), 'utf8'));

test('lint.json sets the core budget and has no dead allowances', () => {
  assert.equal(config.core_line_budget, 7000);
  assert.equal(config.allowed_words, undefined);
});

test('description needs a trigger phrase unless the skill is user-invoked', () => {
  const noTrigger = lint({ 'skills/a/SKILL.md': skillFile({ name: 'a', description: 'Does a thing for people.' }) });
  assert.equal(noTrigger.code, 1);
  assert.match(noTrigger.stderr, /skills\/a\/SKILL\.md: description has no trigger phrase/);

  for (const phrase of ['Use when ready.', 'Use for tests.', 'Apply when editing.', 'Apply to edits.', 'Use weekly.']) {
    const ok = lint({ 'skills/a/SKILL.md': skillFile({ name: 'a', description: `Does a thing. ${phrase}` }) });
    assert.equal(ok.code, 0, `${phrase}: ${ok.stderr}`);
  }
  const exempt = lint({
    'skills/a/SKILL.md': skillFile({ name: 'a', description: 'Does a thing.', extra: 'disable-model-invocation: true\n' }),
  });
  assert.equal(exempt.code, 0, exempt.stderr);
});

test('description over max_description_chars fails', () => {
  const long = `Does a thing. Use when testing. ${'word '.repeat(config.max_description_chars / 5)}`;
  const result = lint({ 'skills/a/SKILL.md': skillFile({ name: 'a', description: long }) });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /skills\/a\/SKILL\.md: description is \d+ chars, limit 350/);
});

test('frontmatter name must match the directory name', () => {
  const result = lint({ 'skills/a/SKILL.md': skillFile({ name: 'b', description: 'Does a thing. Use when testing.' }) });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /skills\/a\/SKILL\.md: name "b" must equal directory name "a"/);
});

test('ven: references must resolve to a skill, playbook, agent or bin tool', () => {
  const files = {
    'skills/a/SKILL.md': skillFile({ name: 'a', description: 'Does a thing. Use when testing.', body: 'Ask ven:ven-helper, run ven:ven-tool, see ven:ghost.' }),
    'agents/ven-helper.md': '---\nname: ven-helper\ndescription: helps\n---\nHelp.\n',
    'bin/ven-tool': '#!/usr/bin/env node\n',
  };
  const result = lint(files);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /skills\/a\/SKILL\.md: dead reference ven:ghost/);
  assert.doesNotMatch(result.stderr, /dead reference ven:ven-/);
});

test('near-duplicate descriptions fail and print the pair and score', () => {
  const description = 'Review a diff with a blind panel of lens reviewers and rank the findings. Use when a change is ready.';
  const result = lint({
    'skills/a/SKILL.md': skillFile({ name: 'a', description }),
    'skills/b/SKILL.md': skillFile({ name: 'b', description: description.replace('rank', 'sort') }),
  });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /descriptions of a and b are too similar \(0\.\d+ > /);

  const distinct = lint({
    'skills/a/SKILL.md': skillFile({ name: 'a', description }),
    'skills/b/SKILL.md': skillFile({ name: 'b', description: 'Draw a state machine of one entity. Use for transitions between states.' }),
  });
  assert.equal(distinct.code, 0, distinct.stderr);
});

test('success prints a single ok line', () => {
  const result = lint({ 'skills/a/SKILL.md': skillFile({ name: 'a', description: 'Does a thing. Use when testing.' }) });
  assert.equal(result.code, 0);
  assert.equal(result.stdout.trim().split('\n').length, 1);
  assert.match(result.stdout, /^ok: /);
});
