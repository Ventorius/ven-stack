---
name: why
description: "Find why code is shaped the way it is (design rationale, trade-offs, regressions, odd thresholds) from history, tickets, docs and chat, citing every claim and stating its confidence. Use for 'why does X work this way', 'why did we pick Y', or before changing code whose purpose is unclear."
metadata:
  layer: L3
  source: cursor/plugins@main:pstack/skills/why/SKILL.md
  license: MIT
---

# Why

Code shows what it does, not why it exists. The why lives in commits, PRs, tickets, docs and conversations, and all of them are incomplete, biased or missing. Work as a careful investigator: report what the record says, mark what you infer, and name what you could not find. Read `references/epistemics.md` before you write the answer.

## 1. Target and question

The target is code, a pattern, a feature or a named decision. The question is a rationale, a trade-off, a motivating edge case, an outside constraint, dead code, or a history sweep. If the target is vague, state your best reading in one line and go on. A guess inside the question ("I assume it's for speed?") is one candidate to check, never the conclusion.

## 2. Code anchor

Build it before spawning anyone, following `references/code-archaeology.md`:

- file paths, line ranges and key symbols;
- the commits that last touched the target, and the commit that introduced the value or branch in question;
- PR numbers and ticket IDs from commit messages, and the PR bodies, reviews and comments, read through `repo.forge.cli`;
- matching ADRs in `$(ven-profile path)/adr/`, `solutions/` entries whose `files:` include the target, and GLOSSARY terms.

Every investigator and the synthesis get the same anchor.

## 3. Discover sources

List what this session can reach: MCP servers, the CLIs in `repo.forge` and `repo.tracker`, and any other read access the user has set up. Map each to one evidence category:

| Category | Best at |
|---|---|
| History: git and the code host | rationale captured during review; always available |
| Issues: the tracker | the product or business pressure behind the work |
| Docs: long-form documents and ADRs | design rationale written before it became code |
| Chat: team conversations | decisions that never reached a doc |
| Runtime: observability and error tracking | the incident, error or load that motivated defensive code |
| Data: the analytics warehouse | where a number or threshold came from |

A tool that fits two categories goes under its primary evidence; note the call. A category with no tool is a gap, not a choice: write it under Sources consulted. Skip a category that has a tool only when it is provably irrelevant ("a build-time script with no runtime path"), and write the reason down.

## 4. Investigate in parallel

Spawn one investigator per available category in one message: `subagent_type: ven:ven-worker`, `model: ${user_config.swarm_model}`, each owning exactly one source. The brief is `references/investigator.md` filled in, plus the anchor and the question. The history investigator also gets `references/code-archaeology.md`. If the target looks defensive (guards, retries, timeouts, limits, flags), every investigator also searches for incidents near the date the code appeared.

On `lean` budget, run history alone first and spawn the rest only if history gives no direct answer; list the unsearched categories with "budget" as the reason.

## 5. Synthesize

You are the synthesizer, on the orchestrator tier. Merge citations that point at the same item, show contradictions with both sources, put every claim in its tier from `references/epistemics.md`, and open any citation you doubt. Write nothing outside the answer and change no outside state.

## 6. Answer

1. **The question**, restated in one or two sentences.
2. **The code:** paths, lines, symbols.
3. **What we found:** `[Direct]` and `[Supported]` claims, each with its citation (commit, PR, ticket, doc, message link, or `file:line`).
4. **What we can infer:** `[Inferred]` claims, hedged, with the chain of reasoning shown. Skip if none.
5. **Competing hypotheses:** each with evidence for and evidence against or missing. Skip if one answer is clear.
6. **What we don't know:** each gap with the question, the sources searched, the queries run, and the result.
7. **Sources consulted:** one line per category, including empty and skipped ones with the reason.
8. **Confidence:** one or two sentences.

If the question comes before a change to this code, end with **Preserve / Change / Avoid / Risk** for planning that change.

Before presenting, check: every Found claim has a citation; phrasing matches its tier; no contradiction was quietly resolved; code is never cited as evidence of its own intent; the gaps section is not empty without a reason. Trace past the newest commit: today's shape is usually several decisions deep.
