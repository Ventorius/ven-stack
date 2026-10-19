---
name: ship
description: "Turn finished work into a pull request with a briefing body and the decision log, such as ship it, open a PR, or make this reviewable."
metadata:
  source: cursor/plugins@1e5c90a:pstack/skills/poteto-mode/playbooks/opening-a-pr.md
  license: MIT
---

# Ship

Opening a PR is outward-facing: prepare everything, then ask before running it.

1. **verify**
   Done: the verify key for each change type on the branch passes, logged against the current tree. A pass already logged for the current tree (`ven-profile` verify log, and a verify row in `ven-decisions list`) is not re-run.
2. **review**
   Done: a review row for the current tree in `ven-decisions list` is not repeated. Otherwise Act-on findings are fixed and re-verified, or declined with a reason the PR body states.
3. Briefing body, with **explain-pr** and **technical-writing**
   Done: the body says why, what changed, scope, blast radius and verification (commands and exit codes); it carries the explain-pr Mermaid diagram and the decision log from `ven-decisions list --playbook <playbook that built the work>`, limited to this branch's run; it follows `repo.forge.pr_template` when set.
4. Prepare the PR
   Done: a title in the repo's commit style, and the exact push and create commands for `repo.forge.cli` (`ven-profile get repo.forge`). No forge CLI in the profile: hand the user the title and body, and stop.
5. Ask, then open (gate)
   Done: the user approved (AskUserQuestion) and the PR URL was read back from the code host; or the user declined and has the title, body and commands to run themselves.
6. **learning-check**
   Done: its result is stated in the reply; silence is not a result.

**Reply:** the PR URL (or the prepared title, body and commands), the verify evidence, and review findings left open.
