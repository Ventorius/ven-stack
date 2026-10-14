---
type: regex
target: { source: file, path: ".ven-state/diagrams/state-order.html" }
pattern: '(?s)<(caption|figcaption|p)\b[^>]*>(?:(?!</(caption|figcaption|p)>).)*?HYBRID \(\d+/\d+ edges cited\)'
---
The page carries the badge line inside a caption or paragraph.
