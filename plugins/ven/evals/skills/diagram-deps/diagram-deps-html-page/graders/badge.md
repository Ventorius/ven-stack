---
type: regex
target: { source: file, path: ".ven-state/diagrams/deps-repo.html" }
pattern: '(?s)<(caption|figcaption|p)\b[^>]*>(?:(?!</(caption|figcaption|p)>).)*?GENERATED ven-profile adapter graph\.imports @ [0-9a-f]{7}'
---
The page carries the badge line inside a caption or paragraph.
