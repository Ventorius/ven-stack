---
name: unslop
description: "Cut AI writing tells (filler, model vocabulary, metaphor nouns, hedging, formatting tics) from text while keeping every fact. Use when editing or checking any prose before it ships: docs, PR bodies, reports, skill text."
metadata:
  layer: L3
  source: cursor/plugins@main:pstack/skills/unslop/SKILL.md
  license: MIT
---

# Unslop

Edit text to remove AI patterns. Scan for the patterns below, then rewrite only the sentences that fail. Keep the meaning, the tone, and every fact, number, name and citation.

- **Don't touch** code blocks, quoted text, frontmatter, link targets or identifiers, unless the user names them as the problem.
- **Density decides.** One device is a choice. Flag a passage when patterns pile up, or one pattern repeats across passages.
- **Modes.** Asked to fix: return the rewritten text. Asked to check: list each pattern, quote the line, give the fix in a few words, and don't rewrite.

## Patterns

Rule numbers are stable ids that other skills cite. A removed rule leaves a gap.

### Content

3. **Superficial -ing phrases.** "highlighting...", "ensuring...", "reflecting...", "showcasing...". Delete, or replace with the real fact.
5. **Vague attributions.** "Experts believe", "industry reports suggest". Name the source or delete. Never invent one.

### Language

7. **AI vocabulary.** Additionally, crucial, delve, enduring, enhance, fostering, garner, interplay, intricate, landscape (abstract), pivotal, showcase, tapestry, testament, underscore, vibrant. Use the plain word.
8. **Fancy ways to say "is".** "serves as", "stands as", "boasts", "features". Say "is" or "has".
9. **"Not just X, but Y."** State Y.
10. **Rule of three.** Use the natural number of items, not three by habit.
11. **Synonym cycling.** One thing, one name, repeated.
12. **False ranges.** "From X to Y" where X and Y aren't ends of a scale. List the items.

### Style

13. **Em dashes.** Don't use them. End the sentence or use a comma.
14. **Colon as a connector.** Colons go before a list or an example, not mid-sentence for drama.
15. **Bold overuse.** Bold only what the reader must find.
16. **Inline-header lists.** "**Speed:** Speed improved..." restates its label; write prose. A bold lead-in that ends in a period and is followed by new detail is fine.
17. **Title case headings.** Use sentence case.
18. **Decorative emojis.** Remove.
19. **Curly quotes.** Use straight quotes.

### Communication artifacts

20. **Chatbot phrases.** "I hope this helps!", "Let me know if...", "Certainly!". Remove.
22. **Sycophancy.** "Great question!", "You're absolutely right!". Answer directly.

### Filler

23. **Filler phrases.** "In order to" becomes "to". "Due to the fact that" becomes "because". "It is important to note that" goes.
24. **Stacked hedges.** "Could potentially possibly" becomes "may". One hedge, only when the doubt is real.
25. **Generic conclusions.** "The future looks bright." End on a specific plan or fact.

### Jargon

26. **Abstract metaphor nouns.** Substrate (base), wedge (add), vector (way), locus, vantage, nexus, primitive as a noun, harness as a metaphor, "surface" as in "API surface", bedrock, scaffolding as a metaphor, modality, paradigm, gold-plating (more than the job needs), evacuate for moving code (move out), endgame (the last phase), north star, flywheel. Pick the concrete word. Skill and command names such as ratchet are names, not metaphors: keep them.

### Plain speech

27. **Say what it does, not how it feels.** "Queries you can read" names a feeling; "`toText()` returns the exact query string sent" names the mechanism. If a sentence can't be restated as an instruction, a fact or a number, cut it. If it could appear unchanged in another project's docs, it says nothing about this one.
28. **Dense sentences.** If the reader must backtrack, split it.
29. **Active voice.** "The file is parsed by the loader" becomes "the loader parses the file". Passive only when the actor is unknown or irrelevant.
30. **Adverbs.** "Runs quickly" becomes the number. "Significantly improves" becomes the measured change.
31. **Plain words.** "Utilize" and "leverage" become "use"; "numerous" becomes "many"; "in the event that" becomes "if".
32. **Mannered prose.** Aphorisms, rhetorical fragments, personified code ("the plan holds it"), figurative verbs ("rides along"). Say it literally.
33. **Over-compression.** Dropped articles, verbless fragments and arrows make the reader decode. "Parser rejects bad date → exit 2, no write" becomes "The parser rejects a bad date, exits with code 2 and writes nothing."
