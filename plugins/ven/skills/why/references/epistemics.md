# Epistemics

How to rate confidence when evidence is historical, partial and sometimes contradictory, and how to say it without false certainty. A confident guess misleads the user, because the user will act on it.

## Tiers

Every claim sits in exactly one tier. The tier sets its section and its wording.

1. **Direct.** Someone wrote down why: a PR description, a ticket, a code comment, a design doc, a message from the author. Wording: plain and cited. "This exists because X [PR #12]."
2. **Supported.** Several indirect items point to one conclusion, none of them stating it. A PR titled "speed up import", a ticket labeled for speed, and nearby commits all on the same hot path. Wording: "The evidence points to X:" followed by each item.
3. **Inferred.** Your reading of the context, with nothing explicit behind it. Wording: hedged, with the chain shown. "Given A and B, C seems likely because D."
4. **Speculative.** A plausible story on thin evidence that other stories fit equally well. Wording: "One possibility is X, but we found no direct evidence." It belongs under Competing hypotheses.
5. **Unknown.** You looked and found nothing. Say exactly where: "We searched the tracker for A and B, read the 6 PRs that touched this file, and searched the repo for the constant. None gave a reason."

## Wording

- Words that claim intent or effect need a citation right next to them: "because", "the reason is", "was designed to", "fixes", "the team decided".
- Hedges mark interpretation: "appears to", "likely", "suggests", "is consistent with", "one reading is".
- Never write "obviously", "clearly", "of course", "just", "I think" or "I believe".

## Traps

- **Code is mechanics, not motivation.** A commit changing a limit from 50 to 100 shows the change, not the reason. Never cite code as evidence of its own intent.
- **Rationalization.** Don't fit a clean reason onto messy history, assume the author did the right thing and work backward, or treat copy-paste as a deliberate pattern.
- **Absence.** No one mentioning a concern is not evidence that it wasn't one.
- **The user's guess.** A hypothesis in the question is a candidate. Check it like any other; confirm it only with evidence.
- **Recency.** The newest commit is rarely the whole story. Trace back.

## Contradictions and gaps

When two sources disagree, show both with citations and let the user decide. Don't pick the tidier story.

An honest "we don't know" is a valuable answer: it tells the user the answer is not in the obvious places and who to ask instead. Name each gap concretely. An answer with no gaps is suspicious; historical evidence almost always has some.
