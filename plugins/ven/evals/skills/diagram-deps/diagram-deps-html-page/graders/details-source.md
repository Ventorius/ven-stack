---
type: regex
target: { source: file, path: ".ven-state/diagrams/deps-repo.html" }
pattern: '<details[\s\S]*flowchart'
---
The page folds the Mermaid source into a details block.
