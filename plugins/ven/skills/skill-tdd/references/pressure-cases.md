# Writing a pressure case

## Layout

```text
evals/skills/<skill>/<skill>-<scenario>/
├── prompt.md        # frontmatter: max_turns, timeout_seconds, allowed_tools; body: the user prompt
├── graders/*.md     # one grader per file: frontmatter type + options; body: pattern or rubric
├── case.yaml        # only with a fixture: context.scaffold_script: scaffold.sh
└── scaffold.sh      # builds the fixture repo; runs only with --scaffold
```

Case names must be unique across the suite; `--case` filters by name. Runs start in an empty directory with no user settings and no other plugins. A case that needs a ven profile scaffolds a git repo, writes `.ven-state/profile.json` with the keys the skill reads, adds `.ven-state/` to `.git/info/exclude`, and sets `env: { EVAL_VEN_STATE_DIR: ".ven-state" }` in prompt.md (runs only receive `EVAL_*` variables; the routing cases in `evals/routing/` are the reference). No absolute paths or `~/` in prompts or graders.

## The prompt

Make the agent act inside a realistic task. "Here is the situation; do it" beats "what should you do?", which only makes it recite the skill.

- **Discipline skills** (the agent knows the rule and skips it): combine three or more pressures such as time, sunk cost, authority, exhaustion and "be pragmatic". Force a concrete choice; leave no "I'd ask someone" exit.
- **Technique skills:** a fresh situation the steps must handle, including one edge case.
- **Trigger cases:** a plain request where the skill should fire, and a near miss where it should stay quiet.

Use neutral nouns (widget, account, report). A scaffolded repo beats a described one.

## Graders

Grade the outcome, not the path taken. In order of preference:

1. `regex` (`target: last_message | files | {source: file, path: <p>}`, `match: contains | not_contains | count:N`) or `file_exists` (`path: <glob>`, `exists: true|false`).
2. `llm` with concrete, checkable claims in the body: "names the file it changed", "quotes an exit code before claiming success". Run with `--judge-model sonnet` or larger, never the model under test.
3. `tool_used` or `tool_order` as a secondary signal only. Trigger check: `tool: Skill`, `input_match: ven:<skill>`. Must-not-fire: add `min: 0`, `max: 0` and `arm: both`.

Tools follow graders: every tool a grader needs must be in `allowed_tools`. A created file needs Write; a command needs Bash; a `tool_used` grader on a tool needs that tool.

```markdown
---
type: llm
---
The reply names the record it wrote, with its path, before reporting the task done.
It does not claim success without showing a command and its exit code.
```

## Match the form to the failure

Read the baseline traces before writing the change. The form that fixes one failure backfires on another.

| Baseline failure | Write | Not |
|---|---|---|
| Knows the rule, skips it under pressure | A hard rule, the excuses you saw with their answers, red flags | Soft "prefer" or "consider" wording |
| Complies, but the output has the wrong shape | The output's parts, in order | A list of things not to do |
| Leaves out a required part | A required slot in the template it fills | A reminder near the template |
| Should depend on a condition | A conditional on something observable | A rule plus exemptions |

No "unless it matters" clauses: each one reopens the negotiation.

## When green won't hold

- Copy each new excuse verbatim from the failing trace and add an explicit answer to that excuse.
- Ask the failing agent, in a follow-up run, how the skill could have made the right choice unambiguous. A concrete wording suggestion goes in. "I saw the rule and chose otherwise" means the rule needs a foundational line near the top: breaking the letter of a rule is breaking its spirit.
- Rerun after every change. Stop when the agent picks the right option under full pressure and cites the skill for it.
