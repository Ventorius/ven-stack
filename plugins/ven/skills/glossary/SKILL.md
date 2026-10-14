---
name: glossary
description: "Keep the domain glossary and decision records current as terms and hard choices settle. Use when a term is defined, renamed or disputed, when code names and domain words disagree, or when a hard-to-reverse decision deserves an ADR."
metadata:
  layer: L3
  source: mattpocock/skills@main:skills/engineering/domain-modeling/SKILL.md + GLOSSARY-FORMAT.md + ADR-FORMAT.md
  license: MIT
---

# Glossary

Sharpen the domain language while design happens, and write it down the moment it settles. Reading the glossary for vocabulary is a habit every skill has; this skill is for changing it.

## Files

- `$(ven-profile path)/GLOSSARY.md`: the terms.
- `$(ven-profile path)/adr/NNNN-<slug>.md`: decision records.

Both live in the state directory, never in the working tree. Create each lazily, when the first entry exists.

## During the session

- **Challenge against the glossary.** When the user's word conflicts with a defined term, say so at once: "The glossary defines a widget as X, but you seem to mean Y. Which is it?"
- **Sharpen fuzzy words.** For a vague or overloaded word, propose one precise term: "By 'account', do you mean the owner or the login? Those are different things."
- **Probe with scenarios.** Invent concrete edge cases that force a boundary between two concepts to be stated.
- **Check the code.** When the user says how something works, search the code. Surface contradictions: "The code archives whole reports, but you said a single section can be archived. Which is right?"
- **Write it inline.** When a term settles, update `GLOSSARY.md` right then. Don't batch.

## Entry format

```markdown
# Glossary

## <Context: a workspace or area; omit the heading when the repo has one>

**Widget**: An assembled unit a customer can order on its own.
Code: `Widget`, `widget_id`, `widgets/`
Avoid: item, product
```

- **One line of definition.** Say what the term is, not what it does.
- **Code names** are the identifiers, tables and paths the term maps to, found by searching the code. When the code uses a different word than the domain, list both and tell the user; it is a rename candidate.
- **Be opinionated.** Pick one word per concept; the rest go under `Avoid`.
- **Only this project's concepts.** General programming ideas (timeouts, retries, error types) stay out, however often the code uses them.
- **No implementation details.** The glossary is not a spec, a scratch pad, or a decision log.
- Group terms under headings when clusters appear; a flat list is fine otherwise.

## ADRs

Offer one (ask the user first) only when all three hold:

1. **Hard to reverse.** Changing your mind later costs real effort.
2. **Surprising without context.** A future reader would ask "why on earth this way?"
3. **A real trade-off.** There were genuine alternatives and one was picked for reasons.

What usually qualifies: the architectural shape; how two contexts integrate; choices with lock-in; ownership and boundary decisions ("only the catalog context writes widgets; others refer to them by id"); deliberate deviations from the obvious path; constraints the code can't show; a rejected alternative someone will propose again. A candidate the user rejects with a load-bearing reason is worth an ADR, so future reviews don't suggest it again.

Format, numbered one past the highest existing file:

```markdown
# <Short title of the decision>

<One to three sentences: the context, what was decided, and why.>
```

Add a `Status` line (proposed, accepted, deprecated, superseded by NNNN), considered options or consequences only when they carry information. One paragraph is a complete ADR.

When a settled term should change the shape of the code, apply **model-the-domain**.
