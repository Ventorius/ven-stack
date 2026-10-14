# Diagram page

How a diagram becomes a local HTML page. The page is a view of what you showed the user; the saved `.md` stays the reusable source.

## Rules

1. **Write, then offer.** Always write the page to `$(ven-profile path)/diagrams/<name>.html` and give its path. Offer once to publish it with the host's tool that publishes a page privately. Publish only after the user says yes; after that, each rewrite republishes to the same page. Without that yes, publish nothing, and never publish probe output.
2. **The page shows what was shown.** It carries exactly the diagram the user saw, including inferred `?` edges and draft edges. The `.md` keeps only what the skill's own saving rules allow. With no drift, reuse renders the page from the saved `.md`.
3. **Folded diagrams get no page.** When a calling skill folds diagrams into its own page (explain-pr panels, the teach ladder), the sub-skill neither renders nor publishes a separate one.
4. **One page per evolving picture.** Rewrite the same page as the picture changes (a hypothesis tree per probe, a teach ladder per frame); never write a page per step.
5. **Reply.** Report lists stay in the reply: violations, new or removed edges, what was folded away, explainer prose. Only the diagram moves to the page. The reply holds the badge, a short summary and the path. A Mermaid fence appears in it only when the user asks for one or no file can be written. A request to keep it short shortens the summary, not the page.

## Names

`<name>` is `<kind>-<scope>`, with each slug part limited to `[a-z0-9-]` and the whole name at most 40 chars.

| Skill | Name |
|---|---|
| diagram-deps | `deps-<scope>`; whole repo is `deps-repo` |
| diagram-change | `change-<base>-<head>` (short shas) |
| diagram-data | `data-<scope>` or `data-<base>-<head>` |
| diagram-flow | `flow-<trigger>` |
| diagram-state | `state-<entity>` |
| diagram-hypotheses | `hypotheses-<slug>` |
| diagram-arch | `arch-context` |
| improve-architecture | `arch-candidates`, one page for every candidate sketch |
| how | `how-<topic>` |
| teach | `explain/teach-<subsystem>.html`, one section per frame |

## Content, top to bottom

- The badge line in a `<figcaption>` or `<p>`.
- A table of the nodes and edges, or the claim table. Always present.
- An inline SVG when about 12 nodes or fewer fit legibly, with exactly the diagram's nodes, edges and labels.
- The Mermaid source in `<details>`, escaped.

## Safety

- Escape `&`, `<`, `>`, `"` and `'` in every interpolated value. Untrusted text never goes into an `on*`, `href`, `src` or `style` attribute.
- Before handing over, check the file: no `<script`, no `on...=` attribute, no `src`, `href`, `@import` or `url(` pointing off the page; a table and a `<details>` block are present.

## Skeleton

```html
<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{name}}</title>
<style>
:root { --fg:#1d1d1b; --bg:#fbfaf7; --edge:#1565c0; --bad:#c62828; color-scheme: light dark; }
@media (prefers-color-scheme: dark) { :root { --fg:#ebeae4; --bg:#151514; } }
body { margin:0 auto; max-width:900px; padding:24px 16px; background:var(--bg); color:var(--fg); font:16px/1.5 system-ui, sans-serif; }
table { border-collapse:collapse; width:100%; }
td, th { text-align:left; border-bottom:1px solid currentColor; padding:4px 8px; }
svg { max-width:100%; height:auto; }
</style></head>
<body>
<figure>
<figcaption>{{badge}}</figcaption>
<svg viewBox="0 0 320 80" role="img" aria-label="{{name}}">
<defs><marker id="a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="currentColor"/></marker></defs>
<rect x="10" y="20" width="90" height="36" fill="none" stroke="currentColor"/>
<text x="55" y="43" text-anchor="middle" fill="currentColor">{{from}}</text>
<line x1="100" y1="38" x2="210" y2="38" stroke="currentColor" marker-end="url(#a)"/>
<rect x="210" y="20" width="90" height="36" fill="none" stroke="currentColor"/>
<text x="255" y="43" text-anchor="middle" fill="currentColor">{{to}}</text>
</svg>
</figure>
<table><tr><th>From</th><th>To</th><th>Citation</th></tr>
<tr><td>{{from}}</td><td>{{to}}</td><td>{{cite}}</td></tr></table>
<details><summary>Mermaid source</summary><pre>{{escaped mermaid}}</pre></details>
</body></html>
```

A violating edge takes `stroke="var(--bad)"` and a dashed `stroke-dasharray`; an inferred one is dashed with `?` in its label.
