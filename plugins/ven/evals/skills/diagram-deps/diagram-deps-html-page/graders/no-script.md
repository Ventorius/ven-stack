---
type: regex
target: { source: file, path: ".ven-state/diagrams/deps-repo.html" }
pattern: "<script"
match: not_contains
---
The page is offline: no script element.
