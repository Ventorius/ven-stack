---
name: help
description: "Suggest which ven command, skill or playbook fits what you want, and check this repo's ven state (profile, staleness, skill collisions). Suggests only; never runs the work."
argument-hint: <question>
disable-model-invocation: true
metadata:
  layer: L5
  source: cursor/plugins@main:pstack/skills/poteto-help/SKILL.md
  license: MIT
---

# help

Answer "which skill fits" with a command the user can type. Never run the skill, playbook or command you suggest; the user sends it. A message that asks for work rather than help gets `/ven:do <their task>` back, ready to send.

## Check the state first

Run these and mention a result only when it changes the answer:

- `ven-profile show` fails: no profile. Suggest `/ven:onboard` first; most skills need its commands.
- `ven-profile fresh` exits 1: the stack changed since onboarding. Suggest `/ven:onboard --refresh`.
- `ven-decisions active` shows a playbook: work is in flight in this worktree. `/ven:do continue` resumes it; `/ven:do pause` parks it.
- `ven-doctor`: skills from other plugins or personal skills with the same names (another skill may answer instead), unverified commands, the worktree base, missing permission rules. Run it whenever something behaved unexpectedly.

## Default answer

`/ven:do <task>` for any real work. It picks a playbook, copies its steps into the task list, proves the result and closes with a learning check. A good task states the goal and how to tell it's done. It doesn't list skills: a hand-written sequence drops steps the playbook keeps. Suggest a single skill only when the user wants one part of the flow, or more or less of it than a playbook gives.

## Which skill fits

| You want to | Type |
|---|---|
| Do a task with the full workflow | `/ven:do <task>` |
| Set ven up in this repo, or re-detect after the stack changed | `/ven:onboard`, `/ven:onboard --refresh` |
| Be questioned until a plan has no open decisions | `/ven:grilling` |
| Turn a settled design into a spec, then into tickets | `/ven:to-spec`, `/ven:to-tickets` |
| Define or settle domain terms, or record a hard decision | `/ven:glossary` |
| Build one behavior test-first | `/ven:tdd` |
| Apply one mechanical change across many files in parallel | `/ven:sweep` |
| Answer a design question with throwaway code | `/ven:prototype` |
| Find modules worth deepening, or a shape to refactor toward | `/ven:improve-architecture` |
| Get a bug to fail on command before fixing it | `/ven:reproduce` |
| Prove a change works | `/ven:verify` |
| Measure performance and trust the number | `/ven:benchmark-check` |
| Check that cited lines and claims hold | `/ven:citation-check` |
| Review a diff through blind lenses | `/ven:review` |
| Know what a change could break outside the diff | `/ven:blast-radius` |
| Get a strict maintainability verdict on a branch | `/ven:quality-review` |
| Know how code works now, or why it is shaped this way | `/ven:how`, `/ven:why` |
| Hand work to another session or person | `/ven:handoff` |
| Write docs, a PR body or a decision record to a standard | `/ven:technical-writing` |
| Write or update docs for a repo, module or feature from the code | `/ven:write-docs` |
| Clean machine tells out of prose | `/ven:unslop` |
| See the module graph, data model, one request's flow, an entity's states, or the system context | `/ven:diagram-deps`, `/ven:diagram-data`, `/ven:diagram-flow`, `/ven:diagram-state`, `/ven:diagram-arch` |
| Debug with a tree of hypotheses and the evidence against each | `/ven:diagram-hypotheses` |
| See a diff as before and after | `/ven:diagram-change` |
| Read a PR or branch as one page | `/ven:explain-pr` |
| Learn a subsystem diagram by diagram, then be quizzed | `/ven:teach`, `/ven:quiz` |
| Find the conventions the team follows | `/ven:conventions-discover` |
| Find review comments and corrections that keep repeating | `/ven:conventions-audit` |
| Turn a correction into a check that fails on the original mistake | `/ven:ratchet` |
| Keep a convention that no rule tool can check | `/ven:forge-convention` |
| Tell ven it got something wrong, so it stops repeating it | `/ven:correct` |
| Close a task by logging what it taught | `/ven:learning-check` |
| Record how a problem was solved, or prune stale records | `/ven:compound`, `/ven:compound-refresh` |
| Turn a session's lessons into skill edits | `/ven:reflect` |
| Find repeated corrections, hook blocks and misroutes in past sessions | `/ven:mine-transcripts` |
| Prove a skill edit helps before keeping it | `/ven:skill-tdd` |
| Draft a personal mode from your own habits | `/ven:automate-me` |
| Create a pack for a technology or domain this repo uses | `/ven:forge-pack` |
| Add one skill to a pack, or a playbook for a repeating task shape | `/ven:forge-skill`, `/ven:forge-playbook` |
| Give a visual or conventions skill the tool it lacks | `/ven:forge-adapter` |
| Distill a library's docs into a reference | `/ven:forge-reference` |
| Check pack health | `/ven:pack-audit` |

Read a skill's `${CLAUDE_PLUGIN_ROOT}/skills/<name>/SKILL.md` before you say what it does; this table is orientation only. A ven skill missing from it: route by its frontmatter description. Pack skills and playbooks are listed in `ven-profile get packs`.

Principles (`/ven:laziness`, `/ven:prove-it-works` and the rest) are one idea each; the playbooks apply them. Users steer with their names: "apply prove-it-works, show me the real output."

## Close calls

- `/ven:how` explains what code does; `/ven:why` explains the reasons; `/ven:teach` explains a subsystem plainly; `/ven:explain-pr` explains one change.
- `/ven:review` judges the diff; `/ven:blast-radius` looks outside it for what it could break.
- `/ven:review` asks whether the change is right; `/ven:quality-review` asks only whether it leaves the code simpler, and blocks when it doesn't.
- `/ven:technical-writing` is the writing standard for any doc; `/ven:write-docs` documents a repo, module or feature from the code and proves its commands.
- `/ven:correct` handles one mistake now; `/ven:ratchet` turns it into a check; `/ven:conventions-audit` finds the ones that repeat.
- `/ven:learning-check` decides whether a session taught anything; `/ven:compound` records a solved problem; `/ven:reflect` edits skills.
- `/ven:forge-pack` creates a pack; `/ven:forge-skill` adds to one; `/ven:forge-playbook` composes existing skills; `/ven:forge-convention` writes one narrow principle.
- `/ven:sweep` fans out a change you already know how to make; a change that needs a codemod first is a migration through `/ven:do`.
- `/ven:handoff` only writes a note; "pause" and "continue" through `/ven:do` also record and resume the playbook.

## Playbooks

Playbooks are step lists that `/ven:do` runs, not commands. Describing the task picks one. These phrasings pick one reliably:

| Say | Playbook |
|---|---|
| "how does X work", "why is Y like this", "should we A or B" | investigation |
| "add X", "change Y to do Z" | feature |
| "X is broken", "Y regressed", "this test flakes" | bug-fix |
| "clean up X without changing behavior" | refactor |
| "X takes 4 s, make it faster" | perf |
| "replace old API A with B everywhere" | migration |
| "explain this PR", "teach me module X" | explain |
| "run until the tickets are done" | autonomous-run |
| "continue", "pick up where we left off" / "pause here" | pickup / pause |
| "ship it", "open a PR" | ship |

Repo packs add playbooks of their own; the router prefers a pack playbook when its pack applies to the files the task touches.

## When a run went wrong

| Symptom | Fix |
|---|---|
| Source edits blocked during a bug fix | The repro-first hook. Reproduce first, then `ven-decisions add --step reproduce --decision reproduced --evidence "<command> fails with <error>"`. |
| Stopping is blocked by the verify-gate | Run `ven-profile verify <key>` for the change type after the last edit; keys are in `ven-profile get verify`. |
| Coders don't see the current branch | `ven-doctor`; set `worktree.baseRef` to `head`. |
| Background coders keep asking for permission | `ven-doctor`; add allow rules for `ven-profile` and `ven-decisions`. |
| A different skill answered than expected | `ven-doctor` lists name collisions and the `skillOverrides` that hide them. |
| A command fails or is marked unverified | `/ven:onboard --refresh` re-detects and re-proves the commands. |
| The router picked the wrong playbook | Rephrase with the shape from the Playbooks table; `/ven:mine-transcripts` shows misroutes over time. |
| Runs cost too much | Budget tier `lean` in the plugin settings, or `ven-profile set budget_tier lean` for this repo. |

## Reply

Lead with the command to type, then one example prompt in a code block and one sentence on why it fits. Add a close call only when the user's words fit two skills. Keep it short unless the user asked for the whole map.
