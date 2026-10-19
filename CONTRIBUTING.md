# Contributing

You need Node 22 or later and [Bun](https://bun.sh) 1.4 or later. ven has no dependencies to install.

## The 15-minute path

1. **Clone and check the baseline.**

   ```sh
   git clone https://github.com/Ventorius/ven-stack && cd ven-stack
   bun run test          # unit tests for hooks, bin tools and scripts
   bun run lint:skills   # composition rules, line budgets, denylist
   ```

   Both pass on a clean checkout. Fix nothing else before you start.

2. **Read the rules.** [`docs/build/authoring-guide.md`](docs/build/authoring-guide.md) wins over the design doc where they disagree.

3. **Scaffold a skill.**

   ```sh
   plugins/ven/bin/ven-new-skill <name> --layer L2 \
     --notice-group <group> --source <owner/repo@main:path>   # --source and --notice-group only for adapted skills
   ```

   It creates `plugins/ven/skills/<name>/SKILL.md`, adds a catalog line to the authoring guide and a notices line to `docs/build/notices/<group>.md`, and runs the linter. Write the body, then move the catalog entry into its group.

4. **Add evals** under `plugins/ven/evals/skills/<name>/`: a case that fails without the skill and passes with it, plus a trigger case. Write the case before the skill text.

5. **Run the checks again** (`bun run test`, `bun run lint:skills`), then commit.

## Eval cost

- `bun run test` and `bun run lint:skills` are free and run in CI.
- `bun run eval:routing:quick` is the cheap tier: one tool-less Haiku call per routing case. Use it while you edit router wording.
- The full routing suite (`claude plugin eval plugins/ven --scaffold --runs 3 --max-cost-usd 10`) costs about $7. Run it manually, before a release or when the quick tier flips a case. CI never runs it.
- `bun run eval:history <result file>` records a run in `plugins/ven/evals/routing/history.jsonl` and lists the cases that flipped since the previous run of the same tier.

## Commits

Use `type(scope): imperative subject`, under 80 characters, no trailing period. Types in use: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`. Example: `docs(readme): document GitHub install`. Open pull requests against `main`; never push to it directly.

## Provenance

Every adapted skill and playbook names its upstream in `metadata.source`.

- Write `<owner/repo>@main:<path>`, then run `bun run pin:sources`. It replaces `@main` with the commit SHA recorded for that upstream in `docs/build/notices/_upstreams.json`.
- List the adapted file in `docs/build/notices/<group>.md` as `- <owner/repo> — plugins/ven/skills/<name>/ adapted from <upstream path>`, then run `bun run notices`.
- Never edit `THIRD_PARTY_NOTICES.md` by hand. A test fails when it differs from the generator output.
- A new upstream needs its SHA, copyright line and license checked first. Never copy text from Apache-licensed or unlicensed sources; learn from them only.

## Release

1. Move the `Unreleased` entries in [`CHANGELOG.md`](CHANGELOG.md) under a new `## [X.Y.Z] - YYYY-MM-DD` heading and leave an empty `Unreleased`.
2. Set `version` in `plugins/ven/.claude-plugin/plugin.json` to `X.Y.Z`.
3. Run `bun run release:check` (tests and lint). Run the full routing suite if the router or any playbook changed.
4. Commit as `chore(release): vX.Y.Z`, merge to `main`, then tag and push:

   ```sh
   git tag vX.Y.Z && git push origin vX.Y.Z
   ```

Users pick the release up with `/plugin marketplace update ven-stack`.
