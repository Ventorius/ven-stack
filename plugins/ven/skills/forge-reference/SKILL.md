---
name: forge-reference
description: "Distill one library into a pack reference for the version this repo locks: its idioms as the repo uses them, pitfalls and version notes, every claim cited to official docs or file:line. Use when a pack skill needs library facts, or corrections show the agent misusing a library."
metadata:
  layer: L3
  source: cursor/plugins@1e5c90a:pstack/skills/typescript-best-practices/SKILL.md + EveryInc/compound-engineering-plugin@7a68002:skills/ce-plan/references/agents/framework-docs-researcher.md + mattpocock/skills@49dd158:skills/engineering/research/SKILL.md
  license: MIT
---

# Forge a reference

A reference holds the library facts a pack skill reads on demand: short, pinned to the locked version, and cited claim by claim. Skills hold judgment; references hold facts.

**Input:** a library and the pack. `<pack dir>` is `$(ven-profile path)/packs/<pack>/`.

## 1. Pin the version

Read the resolved version from the lockfiles the profile lists (`ven-profile get stack.sources`). No lockfile entry for the library: stop and say so. An unpinned reference goes stale without anyone noticing.

## 2. Gather, in parallel

Send two read-only briefs to `ven:ven-worker` (`model: ${user_config.swarm_model}`). They gather; you synthesize.

- **Docs:** fetch the official documentation for the locked version with WebFetch: the docs pages for the APIs the repo calls, the changelog or release notes, and the migration guide from the version most examples assume. Check deprecations first. Primary sources only: the library's own docs, repository and changelog. Return claims, each with its URL.
- **Usages:** Grep the repo for the library's imports and calls. Return each distinct usage pattern with a count and up to three `file:line` examples, and every usage that contradicts the docs.

## 3. Distill

Write `<pack dir>/references/<library>.md` in this shape:

```markdown
# <library> <version>

Locked in <lockfile>. Docs fetched <date>.

## Idioms
| Idiom | How this repo does it | Seen at |

## Pitfalls
| Pitfall | Symptom | Do instead | Source |

## Version notes
- <what differs in this version from what most examples assume: new, deprecated, removed> (<source>)

## Sources
- <url>
```

- Every row cites a docs URL or `file:line`. A claim with no source is cut.
- Keep what changes the agent's behavior in this repo. A generic tutorial is noise the agent already knows.
- Where the repo contradicts the docs, record it as a pitfall and flag it to the user; deciding which side is right is theirs.
- One library per file, under 150 lines.

## 4. Check the citations

Apply **citation-check** through `ven:ven-verifier` (`model: ${user_config.swarm_model}`): each `file:line` says what its row claims, and each URL contains its claim. Fix or cut every row that fails.

## 5. Register

1. Add `{ "file": "references/<library>.md", "library", "version", "lockfile" }` to `references` in `<pack dir>/pack.json`. Pack audits compare that version with the lockfile to find stale references.
2. In each pack skill that needs the facts, fill the "Library facts" line that ven's skill template (`${CLAUDE_PLUGIN_ROOT}/templates/skill/SKILL.md`) provides: when to read the reference, in one line.
3. Bump the patch `version` in `<pack dir>/.claude-plugin/plugin.json`.
