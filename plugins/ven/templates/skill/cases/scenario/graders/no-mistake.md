---
type: regex
target: { source: file, path: "{{the file the task changes}}" }
pattern: '{{a pattern matching the mistake as the failing run produced it}}'
match: not_contains
---
{{The mistake recorded when the scenario ran without the skill, in one line.}}
