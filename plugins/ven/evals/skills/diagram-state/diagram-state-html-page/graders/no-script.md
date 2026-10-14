---
type: regex
target: { source: file, path: ".ven-state/diagrams/state-order.html" }
pattern: "<script"
match: not_contains
---
The page is offline: no script element.
