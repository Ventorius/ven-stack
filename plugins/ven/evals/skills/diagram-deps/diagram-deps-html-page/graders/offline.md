---
type: regex
target: { source: file, path: ".ven-state/diagrams/deps-repo.html" }
pattern: '(<[Ss][Cc][Rr][Ii][Pp][Tt]|\s[Oo][Nn][a-zA-Z]+\s*=|@import|url\(\s*["'']?(https?:)?//|([Ss][Rr][Cc]|[Hh][Rr][Ee][Ff])\s*=\s*["'']?(https?:)?//)'
match: not_contains
---
The page is offline: no script, event handler, import, url() or external src or href.
