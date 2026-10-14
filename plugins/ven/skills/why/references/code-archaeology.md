# Code archaeology

The history source is tied to the code and always available. It holds commit messages and diffs, PR descriptions and review threads, code comments, ADRs, tests whose names encode the edge case that motivated a change, files changed together, changelogs, and ticket IDs in commit messages.

## Commands (read-only)

| Need | Command |
|---|---|
| History through renames | `git log --follow --oneline -- <file>` |
| Commits that added or removed exact text | `git log -S '<text>' -- <file>` |
| Commits whose diff matches a pattern | `git log -G '<regex>' -- <file>` |
| Who last touched each line, and when | `git blame -L <start>,<end> <file>` |
| One commit in full | `git show <hash>` |
| A commit message, for PR and ticket numbers | `git log -1 --format=%B <hash>` |
| Files that change together with the target | `git log --format=%h -- <file>`, then `git show --name-only --format= <hash>` per commit |

Read PRs, their reviews and their comments with `repo.forge.cli` (`ven-profile get repo.forge.cli`). Read-only calls only.

## Where else to look

- ADRs: `$(ven-profile path)/adr/` and any decision-record directory in the repo.
- Comments near the target that mark workarounds or open problems.
- Tests that mention the target's symbols: their names and assertions often state the case that forced the code.
- Signals of an incident: "hotfix", "revert" followed by "re-apply", "add guard", a merge the same day as the PR opened.
