---
name: quiz
description: Ask one multiple-choice retrieval card per session from a five-card deck built from recent solution entries and decision records. Use only when the user opts in, after a teaching session or a new solution entry.
metadata:
  layer: L3
  source: mattpocock/skills@main:skills/productivity/teach/SKILL.md
  license: MIT
---

# Quiz

Answering from memory builds lasting recall; rereading builds the feeling of it. The quiz is optional, short, and never interrupts work.

## Opt in

Offer once, at a natural stop after a teaching session or a new solution entry: "Want one quiz card on what we just covered?" On no, or no answer, drop it for this session. Never offer twice in a session or in the middle of a task.

## The deck

`$(ven-profile path)/quiz.md` holds five cards. Build or refill it from the newest solution entries (`solutions/**`, by `date:`) and decision records (`adr/`), one card per source, skipping sources a card in the deck already uses.

Each card:

- Asks about a reason, not trivia: the root cause, why the fix works, which option a decision rejected and why, what a glossary term means in this repo.
- Has four options with the same number of words and close to the same number of characters. No option is longer, more specific or more hedged than the rest.
- Uses plausible wrong options, taken from the entry's "What didn't work" or the decision's rejected options.
- Puts the correct answer in a different position than the card before it; across the deck, use all four positions.

```markdown
## <n>. <question>
- A) <option>
- B) <option>
- C) <option>
- D) <option>
answer: <letter>
source: <path under the state directory>
asked: <YYYY-MM-DD, or never>
result: <right | wrong | ->
```

## One card per session

1. Take the first card never asked; with none left, the oldest card answered wrong.
2. Ask it with AskUserQuestion: labels `A` to `D` in deck order, each option's text as its description. No hint in labels, order or formatting.
3. Answer with right or wrong, the correct option, and one sentence of why, citing the source path.
4. Set `asked` and `result`. A right card leaves the deck; a wrong one stays for a later session. Refill to five from sources not yet used.

Stop after one card, even after a right answer: spacing beats cramming. Another card in the same session only when the user asks for it.
