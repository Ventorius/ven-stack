---
type: regex
target: { source: file, path: ".ven-state/diagrams/deps-repo.html" }
pattern: '(?i)(<script|\son[a-z]+\s*=|@import|url\(|(src|href)\s*=\s*["'']?(https?:)?//)'
match: not_contains
---
The page is offline: no script, event handler, import, url() or external src or href.
