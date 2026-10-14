---
name: technical-writing
description: "Layered writing standard for docs, specs, ADRs, READMEs, PR descriptions and commit messages: pick the document mode, then write plain sentences a tired engineer understands on the first read. Use when writing or reviewing any technical document."
metadata:
  layer: L3
  source: cursor/plugins@main:pstack/skills/technical-writing/SKILL.md
  license: MIT
---

# Technical writing

Write so a tired engineer understands on the first read. Apply all four layers below. Three rules sit above them:

- **Cut every word that does no work.** If the sentence survives without a word, the word goes. "In order to" is "to".
- **Use the short, everyday word.** "Use", not "utilize". "Help", not "facilitate". A long word must buy its length with precision.
- **When a rule makes a sentence worse, fix the sentence another way.** A sentence that obeys every rule and still reads machine-made has failed.

The codebase is the word list. Write the real symbol, file, flag or command name, not a description of it. Skill and command names (ratchet, blast-radius, `ven-profile`) are names: write them exactly as they are.

Don't invent jargon. Use the words a developer says out loud: "move", "delete", "a limit that only goes down", not "evacuate" or "endgame". A named pattern is fine when the doc says what it means the first time. To add a new offender to the metaphor rule in **unslop**, propose it with a diff in your reply; don't edit that skill.

## Vary the rhythm

- Mix sentence lengths on purpose. Short ones land a point; longer ones carry a fact with its condition.
- Split a sentence that carries two thoughts. Keep a long sentence that carries one.
- Have a view where the mode allows it. Reference stays dry.
- Be specific: not "changes can cause issues" but "renaming the field fails the build".

## Pick the mode first

One document, one mode. Does it serve action or understanding, learning or work?

- **Tutorial** (action, learning): the learner's success is your job. Say what they will build. Every step shows a visible result; say what they should see. Explain in one clause and a link.
- **How-to** (action, work): solve a problem a person has. Assume competence. Action only; link the background. Allow forks: "If you want x, do y." Name it by the task: "How to rotate the signing key".
- **Reference** (understanding, work): describe only. Dry, complete, sure. Mirror the structure of the thing described. Generate it from code where possible.
- **Explanation** (understanding, learning): one bounded topic and its why: decisions, history, constraints, alternatives. Opinion belongs here and nowhere else.

Don't mix modes. Split and link instead.

## Write to the reader

- Address the reader as "you", in the present tense.
- Say who does what: "the parser rejects the row", not "the row is rejected".
- Write instructions as commands, with the condition first: "To delete the report, run `x`."
- Common case first, exceptions after.
- No "simply", "easy", "quickly" or "please" in a procedure. No announcing future features.
- Link text says where the link goes. Never "click here".
- Headings carry the point ("Pick the mode first", not "Modes"), in sentence case. One top heading, no skipped levels.
- Numbered lists for sequences, bullets for the rest, items parallel, introduced by a full sentence.
- Code in code font. Serial commas. No "etc."; say up front that a list is partial.

## One statement at a time

- One instruction per sentence. Split instructions over about 20 words and other sentences over about 25.
- Put the warning before the step it guards.
- Keep "the" and "a": "Remove the backup file", not "Remove backup file".
- One word per meaning and one meaning per word. Pick "start" and never switch to "initiate".

## No second reading

- Keep "only" and "not" next to the word they change.
- Break up noun strings: "the export size limit check script" becomes "the script that checks the export size limit".
- Every "it", "they" and "this" points at one obvious thing. Repeat the noun when in doubt.
- Don't drop verbs from the second half of a sentence.
- Periods, not semicolons. No slashes: "a, b, or both".
- Call each thing by one name everywhere. A doc that says "the gate", "the check" and "the guard" for one thing teaches three things.
- No idioms, Latin abbreviations or metaphors.

## Repo specifics

- Run every doc this skill touches through **unslop**.
- PR descriptions and commit messages are writing too; every layer except the mode applies. A PR body is a briefing a reviewer reads in under a minute: link logs and tables, don't paste them. Commit style comes from `ven-profile get conventions.commit_style`.
- Product UI strings follow the product's copy rules, not this skill.
- Every count or tree claim must be true at the commit that lands it; include the command that regenerates it.

## Example

Before:

> Configuration of the export size limit is performed via limits.json. It's important to remember that running with --write, which updates the committed limit to reflect the current count, should only be done when lowering it. If exceeded, the build fails.

After:

> `check-size` reads the limit from `limits.json` and counts the exported files. If the count is over the limit, the build fails. Run `check-size --write` only to lower the limit.
