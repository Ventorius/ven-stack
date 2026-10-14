---
name: write-docs
description: "Write or update documentation from the code: gather facts, pick the shape for the reader, write it plain, and prove every command and path in it. Use when asked to document a repo, module or feature, or to bring stale docs up to date."
metadata:
  layer: L3
---

# Write docs

Write the doc a new teammate reads once and can act on. Every fact comes from the code or the profile, and every command in it has run. Short docs that link to each other beat one long doc.

## 1. Scope

Settle three things before writing:

- **Subject:** the repo, one module, or one feature. One doc covers one subject.
- **Reader:** someone arriving, someone using it, or someone changing it. The answer picks the shape in step 3.
- **Home:** where and in what format the repo keeps docs today. Follow that layout. Ask the user with AskUserQuestion only when the repo has no layout and the choice matters.

Search for existing docs on the subject first. Update the existing doc instead of writing a second one. A fact that already has a home gets a link, not a copy.

## 2. Gather facts

Collect each fact with its source, as `file:line` or a command:

- **Commands:** install, run, test and build come from the profile: `ven-profile get commands.<key>`. A missing or `unverified` key goes into the doc only after you run it in step 5.
- **Behavior:** apply **how** to the subject: entry points, the main flow, inputs and outputs, configuration and its defaults, errors a user sees.
- **Terms:** use the names in `$(ven-profile path)/GLOSSARY.md` when it exists, and the real symbol, flag and file names everywhere else.
- **Why:** design reasons from `$(ven-profile path)/adr/` and the commit history, only when the reader needs them to use or change the code.

Gathering is done when every section of the chosen shape has its facts, or you marked it as unknown. Write the gaps down as questions. Never fill a gap with a guess.

## 3. Pick the shape

Pick the shape by reader. [references/shapes.md](references/shapes.md) holds the outline for each:

| Reader | Shape |
|---|---|
| Someone arriving at the subject | Overview |
| Someone using it | Guide |
| Someone changing it | Internals |

A doc that needs two shapes becomes two docs that link to each other. An overview links down to its guides and internals; each of those links back up.

## 4. Write

Apply **technical-writing**. Then hold these:

- Lead with what the subject does and who it is for, in one or two sentences.
- Put a working example before the full reference. The reader copies it first and reads on second.
- Keep each section short enough to read without scrolling. Move a long section into its own doc and link it.
- Skip what the reader can see in one lookup, such as a full list of files or every flag in `--help`. Link to the source instead.
- Write down what the code doesn't show: the reason for a default, the order that matters, the gotcha.
- For a diagram, apply the matching **diagram-flow**, **diagram-arch** or **diagram-data** skill and embed its Mermaid output.

## 5. Prove it

A doc is done when a reader can follow it without hitting a wrong fact:

- Run every command in the doc once, using `ven-profile run <key>` where a profile key exists. Run a command that writes outside the working tree, or reaches a network service, only after the user approves it. Mark each one you didn't run in your reply.
- Check that every path, symbol, flag and config key in the doc exists at `HEAD`.
- When the doc cites more than five `file:line` claims, run **citation-check** on them.
- Every count in the doc ("three playbooks", "66 skills") must match the tree. Name the command that recounts it.

Fix or remove each fact that fails. Never leave a failing fact in the doc with a note.

## 6. Finish

- Run the doc through **unslop**.
- Record it: `ven-decisions add --step write-docs --decision "<doc path>: <created|updated>, <shape>" --evidence "<commands run, checks passed>"`.
- Reply with the doc path, the commands you didn't run, and the open questions from step 2.

Distinct from **technical-writing**: that skill is the writing standard for any document. This one produces documentation of the code from the code and proves it.
