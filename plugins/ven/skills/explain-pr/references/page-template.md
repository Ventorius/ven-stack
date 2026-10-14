# Explain page template

Fill the page skeleton, then the summary. The rules keep the page one portable file that is honest about where each part came from.

## Rules

- **One file, offline.** CSS stays in the `<style>` block. No scripts, no web fonts, no images by URL, no requests of any kind: the page reads the same with no network.
- **Escape what you paste.** Every hunk, path, label and Mermaid source goes in with `&` as `&amp;`, `<` as `&lt;` and `>` as `&gt;`.
- **Visible metadata only.** The header `<dl>` is the single source of branch, range, size and date. No hidden copies.
- **Badge first.** Every panel opens with its badge line.
- **Each diagram in three layers.** A table view that is always there (the edge list, the claim table, or the field changes). An inline SVG drawn from the Mermaid source when it has 12 nodes or fewer, with exactly its nodes, edges and labels. The Mermaid source inside `<details>`. A reader who skips the picture still gets everything.
- **Hunks** are one `<span>` per line with class `add`, `del` or none, and no newline between spans.
- **Mechanical files** go in one closed `<details>` at the end of the walkthrough.

## Page skeleton

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{branch}}: {{title}}</title>
<style>
:root { --bg:#fbfaf7; --fg:#1d1d1b; --muted:#66655f; --line:#e2e0d8; --panel:#fff; --code:#f3f1ea;
  --accent:#1565c0; --add:#2e7d32; --del:#c62828; --warn:#b26a00; color-scheme: light dark; }
@media (prefers-color-scheme: dark) { :root { --bg:#151514; --fg:#ebeae4; --muted:#a19f97;
  --line:#34332f; --panel:#1d1c1a; --code:#24231f; } }
body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.55 system-ui, sans-serif; }
main { max-width: 960px; margin: 0 auto; padding: 40px 24px 80px; }
p, li, dd, figcaption { max-width: 70ch; }
code, pre, .badge, .cite { font-family: ui-monospace, monospace; }
pre { background: var(--code); font-size: 13px; padding: 12px; overflow-x: auto; border-radius: 6px; }
.meta { display: grid; grid-template-columns: max-content 1fr; gap: 2px 16px; color: var(--muted); }
.meta dd { margin: 0; }
.summary { border-left: 3px solid var(--accent); padding-left: 14px; }
nav a { margin-right: 14px; color: var(--accent); }
section { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 20px 22px; margin: 22px 0; }
.badge { display: inline-block; font-size: 12px; border: 1px solid var(--line); border-radius: 4px; padding: 2px 8px; color: var(--muted); }
table { border-collapse: collapse; width: 100%; font-size: 14px; margin: 12px 0; }
th, td { text-align: left; border-bottom: 1px solid var(--line); padding: 6px 8px; vertical-align: top; }
.cite { color: var(--muted); font-size: 12px; }
svg { max-width: 100%; height: auto; color: var(--fg); }
svg .node rect { fill: var(--panel); stroke: currentColor; stroke-width: 1.5; }
svg .touched rect { stroke: var(--accent); stroke-width: 2.5; }
svg .added rect { stroke: var(--add); stroke-width: 2.5; }
svg .removed rect { stroke: var(--del); stroke-dasharray: 5 3; }
svg text { fill: currentColor; font: 13px system-ui, sans-serif; text-anchor: middle; }
svg .edge { stroke: currentColor; stroke-width: 1.5; fill: none; }
svg .edge.new { stroke: var(--add); stroke-width: 3; }
svg .edge.removed, svg .edge.violation { stroke: var(--del); stroke-dasharray: 6 4; }
.hunk span { display: block; }
.hunk .add { background: color-mix(in srgb, var(--add) 16%, transparent); }
.hunk .del { background: color-mix(in srgb, var(--del) 16%, transparent); }
.risk { border-left: 3px solid var(--warn); padding-left: 12px; margin: 14px 0; }
.step { border-top: 1px solid var(--line); margin-top: 16px; padding-top: 12px; }
footer { color: var(--muted); font-size: 13px; margin-top: 40px; }
</style>
</head>
<body>
<main>
<header>
  <h1>{{title}}</h1>
  <dl class="meta">
    <dt>Branch</dt><dd>{{branch}}</dd>
    <dt>Range</dt><dd><code>{{base sha}}..{{head sha}}</code></dd>
    <dt>Size</dt><dd>{{n}} files, +{{added}} −{{removed}}, {{m}} mechanical</dd>
    <dt>Date</dt><dd>{{date}}</dd>
  </dl>
  <p class="summary">{{two or three sentences: what the change does and why}}</p>
  <nav><a href="#map">Change map</a><a href="#data">Data</a><a href="#flows">Flows</a><a href="#risks">Risks</a><a href="#walk">Walkthrough</a></nav>
</header>

<section id="map">
  <h2>Change map</h2>
  <p class="badge">{{badge}}</p>
  <figure>
    <svg viewBox="0 0 520 110" role="img" aria-label="{{one-line text equivalent}}">
      <defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>
      <g class="node touched"><rect x="10" y="35" width="130" height="40" rx="6"/><text x="75" y="60">{{module}}</text></g>
      <g class="node added"><rect x="380" y="35" width="130" height="40" rx="6"/><text x="445" y="60">{{module}}</text></g>
      <line class="edge new" x1="140" y1="55" x2="376" y2="55" marker-end="url(#arrow)"/>
      <text x="258" y="47">new</text>
    </svg>
    <figcaption>{{text equivalent of the diagram}}</figcaption>
  </figure>
  <table><tr><th>Edge</th><th>Change</th><th>Evidence</th></tr>
    <tr><td>{{from}} → {{to}}</td><td>{{new | removed | kept}}</td><td class="cite">{{path:line}}</td></tr></table>
  <details><summary>Mermaid source</summary><pre>{{escaped Mermaid}}</pre></details>
</section>

<section id="data">
  <h2>Data diff</h2>
  <p class="badge">{{badge}}</p>
  <table><tr><th>Entity</th><th>Change</th><th>Evidence</th></tr>
    <tr><td>{{entity.field}}</td><td>{{added | removed | type changed, was X}}</td><td class="cite">{{path:line}}</td></tr></table>
  <details><summary>Mermaid source</summary><pre>{{escaped Mermaid}}</pre></details>
</section>

<section id="flows">
  <h2>New flows</h2>
  <h3>{{trigger}}</h3>
  <p class="badge">{{badge}}</p>
  <table><tr><th>#</th><th>Step</th><th>Citation</th></tr>
    <tr><td>1</td><td>{{claim}}</td><td class="cite">{{path:line}}</td></tr></table>
  <details><summary>Mermaid source</summary><pre>{{escaped Mermaid}}</pre></details>
</section>

<section id="risks">
  <h2>Risks</h2>
  <p class="badge">{{badge}}</p>
  <div class="risk"><strong>{{what breaks, for whom}}</strong>
    <p>{{mechanism, likelihood, cheapest check}}</p><span class="cite">{{path:line}}</span></div>
  <p>Cleared: {{what was checked and found fine}}</p>
</section>

<section id="walk">
  <h2>Walkthrough</h2>
  <p class="badge">{{badge}}</p>
  <div class="step">
    <h3>{{n}}. {{path}} <span class="cite">{{path:line}}</span></h3>
    <p>{{what changed and why}}</p>
    <pre class="hunk"><span class="del">{{removed line}}</span><span class="add">{{added line}}</span><span>{{context line}}</span></pre>
  </div>
  <details><summary>Mechanical files ({{m}})</summary><ul><li>{{path}}: {{rename | formatting | generated | lockfile}}</li></ul></details>
</section>

<footer>Composed {{date}} by explain-pr at {{head sha}}.</footer>
</main>
</body>
</html>
```

A skipped panel keeps its `<section>` and `<h2>` and replaces the rest with one `<p>` saying why.

## Checks before handing it over

- No `<script`, and no `src=` or `href=` that leaves the page. Source links, if any, are plain text.
- Every panel has a badge line. Every SVG has an `aria-label`, and its panel has the table view.
- Every `{{...}}` slot is filled or its element removed.
- If a browser tool is available, open the file and look at it once.

## PR-body summary

Plain Markdown, at most about 40 lines, no HTML and no paths into the state directory. The badge sits on the line above the diagram.

````markdown
## What changes

- {{two to four bullets: behavior that changes, and why}}

## Change map

{{badge}}

```mermaid
{{the change map's Mermaid source}}
```

## Risks

- {{what breaks, for whom}} (`{{path:line}}`)

## Reading order

1. `{{path}}`: {{one line on what to look at}}
````
