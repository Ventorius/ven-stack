---
name: yeet
description: "Take every local change green through the repo's own checks, slice it into conventional commits, push, and with --pr open a pull request on the code host."
argument-hint: "[--force] [--fast] [--pr] (optional) notes on how to group the commits"
disable-model-invocation: true
metadata:
  layer: L5
---

# Yeet

Ship everything in the working tree: **survey** it, get it **green**, **slice** it into commits, push, and open a PR when asked.

## Flags

Read them from the arguments before step 1; the rest of the arguments are grouping notes. Typing a flag is the user's consent to what it does, so `/ven:yeet` pushes, and `--pr` opens the PR, without asking again.

- `--force`: skip step 2. Commits land on whatever branch `HEAD` is, the default branch included.
- `--fast`: skip step 3. Nothing is run; the report states checks were skipped, and the verify-gate still asks for proof before the session stops.
- `--pr`: run step 7 after the push.

## 1. Survey

Read `git status --porcelain=v1 --untracked-files=all`, `git diff`, `git diff --staged`, the current branch and its upstream. Read the untracked files too.

Done when every changed path sits in a written list with a one-line statement of its intent, and any path you cannot explain is named out loud as such.

## 2. Claim a branch (skipped by `--force`)

Commits land on a topic branch. If `HEAD` is `repo.default_branch` (`ven-profile get repo.default_branch`), create a branch named for the work at hand and carry the changes onto it.

Done when `HEAD` is not the default branch.

## 3. Green (skipped by `--fast`)

Run **verify** for every change type the survey touched. Its keys come from the profile; never type a check command from memory.

Fix the failures your changes caused, then rerun that check. To tell whether a failure was there before, run the same key in a clean worktree of `HEAD` (`git worktree add <tmp> HEAD`, then remove it). Never use `git stash` for this: the stash stack is shared with every worktree. A failure that reproduces there is pre-existing; say so and move on.

Done when every check has either passed, logged against the current tree, or been named as pre-existing.

## 4. Slice

Group the survey into commits by intent: one coherent change per commit, with its own type and scope. A refactor that enabled a feature gets its own commit before the feature.

Show the slices to the user as a numbered list of `type(scope): subject` plus the paths under each, then commit without waiting for a reply unless the grouping notes asked to wait.

Done when every path from the survey belongs to exactly one slice.

## 5. Commit

Per slice: `git add` the slice's explicit paths, read `git diff --staged --stat` to confirm the staged set is exactly that slice, then commit.

Use conventional commits in the repo's commit style: imperative mood, subject under 80 chars, no trailing period, no `Co-Authored-By` trailer. Add a body only when the *why* is not obvious from the subject.

If a pre-commit hook rewrites files, fold its output into the same commit (`git add` the paths, `git commit --amend --no-edit`).

Done when `git status` is clean and `git log` shows one commit per slice.

## 6. Push

Push the branch, setting upstream when it has none. If the remote has moved, rebase onto it and rerun step 3 (unless `--fast`) before pushing.

Done when `git status -sb` reports no `ahead` count.

## 7. Open the PR (only with `--pr`)

Read `ven-profile get repo.forge`. With no `cli` set, print the title and body below and stop. The PR's base is `repo.default_branch`. When `HEAD` is the default branch (`--force`), there is nothing to open; say so and stop.

1. Ask `repo.forge.cli` whether this branch already has an open PR. If it does, the push in step 6 already updated it: report its URL and stop. Never open a second PR.
2. Title: the single commit's subject, or for several commits one `type(scope): subject` line that covers them all, in the repo's commit style.
3. Body, written per **technical-writing**: why the change exists, what changed (one line per commit), and verification (each verify key with its result, or "skipped by `--fast`", and any pre-existing failures). Follow `repo.forge.pr_template` when it is set.
4. Create the PR with `repo.forge.cli` against the base, passing the body through a file rather than inline quoting.

Done when the PR URL was read back from the code host.

## Report

The branch, one line per commit, check results (including anything pre-existing, or "skipped by `--fast`"), the push destination, the PR URL (with `--pr`), and which flags were active.
