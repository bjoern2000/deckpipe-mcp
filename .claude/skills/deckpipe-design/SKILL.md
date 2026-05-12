---
name: deckpipe-design
description: Author visually strong slide decks via the Deckpipe MCP. Use when the user asks to make a deck, build slides, create a presentation, or mentions Deckpipe. Covers the brief-clarification questions to ask upfront, density rules, reference-style cheatsheet, the calibrate-one-slide-first iteration loop, and how to read the render report. Pair with the deckpipe MCP server.
---

# Deckpipe design skill

You are authoring slides through the Deckpipe MCP. Each slide is HTML/CSS/JS that Deckpipe renders inside a 1920×1080 shadow root. The MCP tools you'll use most: `preview_slide`, `create_deck`, `update_deck`, `get_slide_screenshot`. This skill is about the *design judgment* layered on top of those tools.

## Before you build — clarify the brief

A real failure mode: an agent gets "make a hi-fi visually compelling deck about X", commits to 12 slides in one shot, packs each slide with a headline + lede + tags + callout + quote, and produces a magazine spread compressed into one frame on every page. The fix is upstream: ask three short questions before you author anything.

1. **Slide count.** "Roughly how many slides — 10? 20? 30?" If the user doesn't have a number, you give one based on the topic, but say so.
2. **Reference style.** "What's the visual reference — Apple keynote? Pentagram case study? NYT Magazine? Investor pitch? Internal status update?" Each implies a wildly different density.
3. **Audience and medium.** "Who's reading this and how — projected at a meeting, sent as a PDF, posted on a deck-sharing site?" Projected decks need bigger type and fewer words; PDFs can carry slightly more.

If the user already gave you a clear brief, skip the questions. If they said "hi-fi, visually compelling" with no further constraint, ASK before you commit — that phrase reads "pack it with craft" to most agents, which is exactly the wrong reading.

## Density rules

These are the rules that produce decks people actually want to look at:

- **One idea per slide.** If you find yourself fitting a headline + lede + tag pills + a callout box + a pull quote + an attribution on one slide, you've compressed three slides into one. Split it.
- **Whitespace is a design element, not wasted space.** A slide with a single quote at huge type, centered, on paper, is doing more work than a slide jammed edge-to-edge with text. Editorial decks read better at 20 sparse slides than 12 dense ones.
- **Headlines ≤ 8 words. Body ≤ 30 words per block.** If you can't say it in a headline, the slide isn't ready.
- **Type scale at HD is not type scale at 16px-base.** H1 ≈ 96–128px, body ≈ 24–32px, padding ≈ 96–144px. Anything sized for a normal browser will look comically small at 1920×1080.
- **One hero element per slide.** A huge number, a single image, one quote, one diagram. If everything is hero, nothing is.

When you catch yourself reaching for "let me fit one more thing in there" — that's the signal to split the slide.

## Reference-style cheatsheet

Each phrase implies a different density and visual register. When the user names a reference, calibrate to it:

| Reference | Density | Type | Imagery |
|---|---|---|---|
| **Apple keynote** | Very sparse. One idea per slide, often one word. | Huge serif or geometric sans. Massive type. | Hero product shots on black. Lots of negative space. |
| **Pentagram case study** | Editorial. Wide margins, generous whitespace. | Mixed type — display serif headlines, clean sans body. | Full-bleed photography + typography compositions. |
| **NYT Magazine** | Editorial dense, but breathing. | Bold display serif (Cheltenham/Fraunces feel). | Strong photography. Captions matter. |
| **Investor pitch** (a16z / YC) | Moderate. Stat-driven slides, lots of charts. | Sans-serif throughout. Numbers are heroes. | Logos, charts, minimal photography. |
| **Internal status update** | High density acceptable. Bullets okay. | Sans-serif. Smaller type acceptable. | Charts, screenshots, dashboards. |
| **Consultancy deck** (BCG/McKinsey) | Very high density. Frameworks, quadrants. | Sans-serif. Hierarchical, lots of labels. | Diagrams, 2×2s, value chains. |

If the user names something not on this list, ask one clarifying question to triangulate ("more like an Apple keynote or more like a BCG strategy doc?").

## Iteration loop

Don't author the whole deck and pray. Calibrate first.

1. **Build the brief.** Confirm count, reference, audience.
2. **Author the stylesheet.** Deck-level CSS that defines `.slide`, `.h1`, `.h2`, `.lead`, `.label`, `.card`, etc. This is your design system; spend time on it.
3. **Pick a representative content-heavy slide.** Not the cover. Pick one that carries real prose — the kind of slide where density will go wrong first.
4. **`preview_slide` it.** Read the actual screenshot, not just the render report. Show it to the user. Ask "is the density right?"
5. **Calibrate.** If too dense, split. If too sparse, the user will tell you. The whole deck inherits this bar.
6. **Author the rest at that bar.** Use `create_deck` to commit. Spot-check 2-3 slides with `get_slide_screenshot` to confirm they hold up.
7. **Iterate one slide at a time.** When the user points at a slide and says "this one's off", strip *that* slide back — don't redo the deck.

The most common failure: previewing the cover slide and assuming the body slides will look fine. Covers carry one headline and look great at any density. Body slides are where the density question is actually decided.

## Reading the render report

`preview_slide` and `get_slide_screenshot` both return a screenshot inline plus a render report. The report fields:

- **`js_errors`** — uncaught exceptions in your `js`. Fix these; the slide is broken until you do.
- **`console_errors`** — `console.error` / `console.warn` output. Usually points at missing assets or runtime issues.
- **`overflows`** — elements with real visual breakage. Each entry has a `reason`:
  - `off_canvas`: the element extends past 1920×1080. Almost always a sizing bug — text running off the edge, element positioned wrong.
  - `clipped`: the element has `overflow: hidden|scroll|auto` and its content exceeds its box. The text *is* getting cut off.
  
  The report does NOT flag benign rendering bleed (italic descenders, negative letter-spacing on serif headings, etc.) on elements with `overflow: visible`. If your report comes back clean but the screenshot looks wrong, trust the screenshot. Overflows is a syntactic check; the image is visual truth.
- **`fonts_missing`** — Google Fonts that didn't load. Check the spelling and the `<link>` you injected.
- **`failed_requests`** — image 404s, font 403s, CDN failures.

A clean report is necessary but not sufficient. A slide can have zero overflows and still be a wall of unreadable text. Always read the screenshot.

## The layout-safety pattern

The single most common bug in agent-authored decks is "content overflows or overlaps the footer." Three causes, one playbook:

1. **`box-sizing` is content-box by default.** A `<div>` with `height: 100%` and `padding: 112px 128px` becomes 100% + 224px tall, overflowing its parent. Open every `deck.stylesheet` with:
   ```css
   *, *::before, *::after { box-sizing: border-box; }
   ```
   This single line prevents most overflow bugs.

2. **The footer needs reserved space.** A `.footer-line` absolutely positioned at `bottom: 48px` will collide with in-flow content unless the slide's `padding-bottom` reserves room for it. Pattern: `.slide { padding: 112px 128px 160px }`. For full-bleed slides where `.slide` has no padding, apply the same reserve on the inner content container (`.hero-content { padding: 112px 128px 160px }`).

3. **Sweep for overflows after creating.** After `create_deck`, call `get_slide_screenshot` on at least every slide with a big headline, body paragraph, chart, or footer. Read the `overflows` list. Any entry with `reason: "off_canvas"` or `reason: "clipped"` is a real bug — fix with `update_deck` before declaring the deck done.

Baseline stylesheet snippet that gets these right:

```css
*, *::before, *::after { box-sizing: border-box; }

.slide {
  width: 1920px;
  height: 1080px;
  padding: 112px 128px 160px;  /* bottom reserves footer space */
  position: relative;
  overflow: hidden;
  font-family: 'Inter', system-ui, sans-serif;
}

.footer-line {
  position: absolute;
  bottom: 48px;
  left: 128px;
  right: 128px;
  display: flex;
  justify-content: space-between;
  /* lives inside the reserved 160px-bottom band */
}
```

## Common pitfalls

- **Sizing for the wrong viewport.** Pick concrete pixels at HD scale. `font-size: 1rem` (16px) looks tiny at 1920×1080.
- **Defining CSS per-slide instead of in the stylesheet.** Move shared styles into `deck.stylesheet` once, reference classes from each slide. Per-slide `css` is for one-off overrides.
- **Not using `data-dp-anchor`.** Comment threads on anchored elements survive structural edits. Threads on auto-pathed elements shift when you reorder. Anchor anything you're likely to iterate on.
- **JS that depends on exact text.** The viewer lets reviewers edit text inline. Your `js` should select by class or `data-*` attribute, never by `textContent === 'exact phrase'`.
- **`static_render_only` for animations.** Set `static_render_only: true` for slides whose JS animates into a final state — Deckpipe skips the JS in screenshot and PDF/print modes so the captured frame shows the HTML's final-state values, not a mid-animation snapshot. If you want the animation to play in the live viewer but the screenshot to look correct, this is the right tool.
- **Using CSS `background-image: url(...)` for large hero images.** Background images aren't pre-decoded by the viewer's ready signal, so the screenshot can fire before the image lands and the slide renders without it. Use `<img src="..." />` positioned with `position:absolute; inset:0; object-fit:cover` instead — browsers prioritize `<img>` loading and the screenshot pipeline waits for it.
- **Loading fonts via `@import` inside `stylesheet`.** Shadow-root `adoptedStyleSheets` forbids `@import` (Lit logs a warning). Put `<link rel="stylesheet">` Google Fonts entries in `deck.head` instead, then reference the family in your stylesheet's `font-family`.
- **Mocking what the screenshot will look like in your head.** You can't. Use `preview_slide`.
