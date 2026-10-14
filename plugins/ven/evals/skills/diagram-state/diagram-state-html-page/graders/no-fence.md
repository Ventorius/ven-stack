---
type: regex
target: last_message
pattern: '(```|~~~)[ \t]*([Mm][Ee][Rr][Mm][Aa][Ii][Dd]|\n\s*(flowchart|stateDiagram))'
match: not_contains
---
The reply holds no Mermaid fence, tagged or untagged.
