---
type: regex
target: last_message
pattern: '(?i)(```|~~~)\s*(mermaid|\n\s*(flowchart|stateDiagram))'
match: not_contains
---
The reply holds no Mermaid fence, tagged or untagged.
