---
name: explain-pr
description: Build one self-contained HTML page explaining a branch or PR (change map, data diff, new flows, risks, a linear walkthrough, each panel badged) plus a Markdown summary for the PR body. Use when opening or reviewing a PR, or when asked to explain what a branch changes.
metadata:
  layer: L3
  source: cursor/plugins@main:cursor-team-kit/skills/pr-review-canvas/SKILL.md; EveryInc/compound-engineering-plugin@main:skills/ce-explain/SKILL.md, skills/ce-explain/references/explainer-html.md
  license: MIT
---

# Explain PR

One page a reviewer reads top to bottom and comes away knowing what changed, how it behaves now, and what could break, the way a peer would walk them through it. The page is for reading and stays local. The PR body gets a short Markdown version.

## 1. Range and facts

- Use the range **diagram-change** uses: the branch against its merge-base. An empty range: say so and stop.
- Read `git log --oneline <base>..HEAD`, `git diff --stat <base>...HEAD`, the full diff, and the PR's title and body if a PR exists (read-only, with the profile's forge cli from `ven-profile get repo.forge.cli`).
- Sort the files. **Core** files change behavior. **Mechanical** files are renames, moves, formatting, generated output, lockfiles and snapshots; they are listed, not walked through.

## 2. Panels

Each panel carries its own badge per the badge protocol in **diagram-deps**. A panel of claims rather than edges counts claims: `HYBRID (n/n claims cited)`.

| Panel | Built with | When |
|---|---|---|
| Change map | **diagram-change** | always |
| Data diff | **diagram-data**, two-ref diff | the diff touches the data model |
| New flows | **diagram-flow**, one per new entry point, two at most | new routes, handlers, jobs or commands; skipped when `${user_config.budget_tier}` is `lean` |
| Risks | **blast-radius** | always |
| Walkthrough | you, from the diff | always |

- A skipped panel stays on the page as one line saying why ("No data model change").
- **Risks:** the confirmed risks from **blast-radius**, each with what breaks, for whom, and `file:line`, plus what it cleared. Add one line for each touched file that matches `ven-profile get risk_areas`, with the reason from `risk_areas[].why`.
- **Walkthrough:** core files in reading order, entry point first, then what it calls, tests last. Per step: what changed and why in one to three sentences, the hunk, and its `file:line`. Long code that does something simple gets a plain-language pseudocode summary, with the hunk collapsed under it. Open each cited line before you write the claim that cites it.

## 3. Assemble the page

Read `references/page-template.md` and fill its page skeleton. Write `$(ven-profile path)/explain/<branch>.html`, where `<branch>` is `git branch --show-current` with each `/` turned into `-`. Run the template's checks before handing it over.

## 4. Summary for the PR body

Fill the template's summary section. Save it as `$(ven-profile path)/explain/<branch>.md` and show it in the reply, together with the page's path.

## 5. Posting is outward-facing

Ask before posting anything (AskUserQuestion: replace the PR body, add it as a comment, or don't post). On yes, use the profile's forge cli and read its help for the exact subcommand; never guess flags. Post the Markdown summary only. The HTML page stays local: it can hold local paths and unreleased detail.

Write all prose through **unslop**.
