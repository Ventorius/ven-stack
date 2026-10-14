---
name: grilling
description: "Interview the user in rounds over a design tree until every decision is settled, giving a recommended answer for each question. Use before building anything non-trivial, when a plan needs stress-testing, or when the user says grill."
metadata:
  layer: L3
  source: mattpocock/skills@main:skills/productivity/grilling/SKILL.md
  license: MIT
---

# Grilling

Reach a shared understanding with the user before anything gets built. Model the work as a **design tree**: each decision branches into the decisions that depend on it.

## Before the first round

- Read `$(ven-profile path)/GLOSSARY.md` and the ADRs in `$(ven-profile path)/adr/` that touch the area. Use their terms. Don't reopen a recorded decision unless the user does.
- Read the code the plan touches, so your questions and recommendations rest on what is there.

## Rounds

1. Compute the **frontier**: every open decision whose prerequisites are settled. These are the questions you can ask now without guessing at answers you haven't heard.
2. Ask the whole frontier as one round. Number the questions and give your recommended answer for each, worded so "yes" accepts it.
3. Wait for the answers. Settled decisions push the frontier outward and unblock what hung off them.
4. Recompute the frontier and ask the next round. A question that depends on another question still open in this round belongs to a later round.

When the client supports AskUserQuestion, use it: one question per decision, your recommendation as the first option, marked "(recommended)". Otherwise use this shape:

```text
Q1. <title>: <the question, with the options if there are any>
Recommended: <your answer>
```

## Facts are yours, decisions are theirs

- Never ask the user for a fact you can look up: what the code does, which command exists, who calls a module, what a test covers. Find it yourself.
- For a lookup that spans many files, send `ven:ven-worker` (`model: ${user_config.swarm_model}`) a read-only brief: the question, where to look, and "return facts, each with file:line".
- Don't block on a running lookup. It is an unsettled prerequisite: only the questions downstream of it wait. Ask the rest of the frontier now.
- Every decision goes to the user, with your recommendation. Never settle one silently, and never present a guess as a fact.

## As terms settle

The moment a term is pinned down (a name chosen, a fuzzy word replaced, a line drawn between two concepts), write it down: apply **glossary**. Don't batch terms for the end. When the user uses a word the glossary defines differently, say so in the next round.

## Done

The frontier is empty: every branch visited, nothing silently assumed. Then:

1. Summarize the settled decisions as a numbered list, one line each.
2. Get the user's confirmation that this is the shared understanding. Don't act on it before that.
3. Record it: `ven-decisions add --step grilling --decision "<n> decisions settled" --evidence "<the one-line gist>"`.
