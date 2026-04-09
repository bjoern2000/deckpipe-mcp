# deckpipe-mcp

MCP server for [deckpipe](https://deckpipe.com) — create and edit slide decks from any AI agent.

## Install

**Claude Code**
```bash
claude mcp add deckpipe -- npx deckpipe-mcp
```

**Manual MCP config** (Claude Desktop, Cursor, etc.)
```json
{
  "mcpServers": {
    "deckpipe": {
      "command": "npx",
      "args": ["-y", "deckpipe-mcp"]
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| `create_deck` | Create a new deck and get a shareable viewer URL |
| `get_deck` | Retrieve a deck by ID |
| `update_deck` | Update title, fonts, accent color, slide content, or slide structure (insert, delete, move, replace) |
| `delete_deck` | Delete a deck permanently |
| `upload_image` | Upload a base64 image, get a hosted URL |
| `list_layouts` | List available layouts, customization options, and style guide |

## Layouts

| Layout | Description | Required Fields |
|--------|-------------|----------------|
| `title` | Large centered title slide | `title`, optional `subtitle`, `image_url` |
| `title_and_body` | Title + paragraph | `title`, `body`, optional `image_url` |
| `title_and_bullets` | Title + bullet list | `title`, `bullets[]`, optional `image_url` |
| `title_and_table` | Title + data table | `title`, `table: { headers[], rows[][] }` |
| `two_columns` | Title + two columns | `title`, `left: { heading, body }`, `right: { heading, body }` |
| `section_break` | Bold section divider | `title` |
| `image_and_text` | Image-primary (~60%) + text | `title`, `body`, `image_url` or `image_prompt` |
| `image_gallery` | Horizontal row of portrait images | `images[]` (2-5 URLs), optional `title`, `caption` |
| `stats` | Big metrics/numbers with labels | `metrics[]: { value, label }` (2-4), optional `title` |
| `quote` | Inline curly quotation marks with attribution | `quote`, optional `attribution`, `image_url` |
| `full_image` | Full-bleed background image with overlay text | `image_url` or `image_prompt`, optional `title`, `subtitle` |
| `timeline` | Continuous timeline with positioned milestones | `events[]: { label, title, description?, position? }` (3-6). `position` (0-1) places milestone at relative point; events alternate above/below line |
| `comparison` | Side-by-side comparison with verdict | `left: { heading, bullets[] }`, `right: { heading, bullets[] }`, optional `title`, `verdict` |
| `code` | Syntax-highlighted code block (18 languages) | `code`, optional `title`, `language`, `caption` |
| `callout` | Large featured value with context | `value`, optional `title`, `label`, `body` |
| `icons_and_text` | Icon grid with headings and descriptions | `items[]: { icon, heading, description? }` (3-6), optional `title`. `icon` accepts any [Lucide icon name](https://lucide.dev/icons/) (e.g. `"clock"`, `"message-square"`) or emoji |
| `team` | Team member cards with roles and bios | `members[]: { name, role, bio?, image_url? }` (1-6), optional `title` |
| `embed` | Full-slide iframe embed (90% area) | `url`, optional `caption`, `aspect_ratio` |
| `pros_and_cons` | Two-column pros vs cons list | `pros[]`, `cons[]`, optional `title`, `pros_heading`, `cons_heading` |
| `agenda` | Numbered agenda items with durations | `items[]: { topic, duration?, description? }` (1-10), optional `title` |
| `swot` | Four-quadrant SWOT analysis with emoji headers | `strengths[]`, `weaknesses[]`, `opportunities[]`, `threats[]` (1-5 each), optional `title` |
| `quadrant` | 2D scatter plot with labeled axes and items | `items[]: { label, x: 0-1, y: 0-1 }` (1-12), optional `title`, `body`, `bullets[]`, `x_label`, `y_label`, `quadrant_labels[4]` |
| `venn_diagram` | 2 or 3 overlapping circles with labels and items | `circles[]: { label, items[]? }` (2-3), optional `title`, `body`, `overlaps[]: { sets[], label }` |
| `closing` | Accent-colored ending slide with contact info | optional `heading`, `subheading`, `contact_lines[]`, `image_url` |

All layouts support an optional `key_takeaway` field — a highlighted sentence rendered below the title.

**[See all 24 layouts in action →](https://deckpipe.com/d/dk_CsHBYjLY/building-a-saas-startup-from-idea-to-ipo)**

## Image placeholders

Any layout that accepts `image_url` also accepts `image_prompt` as an alternative. When set, a dashed placeholder box is rendered showing the prompt text — useful when you want to create a complete deck without sourcing images, letting the user drop them in later.

```json
{
  "layout": "title_and_bullets",
  "content": {
    "title": "Electric Vehicles",
    "bullets": ["Range anxiety solved", "Charging network expansion"],
    "image_prompt": "Hero shot of a sleek EV on a mountain road at golden hour"
  }
}
```

## Rich bullets

Any `bullets[]`, `pros[]`, `cons[]`, `strengths[]`, `weaknesses[]`, `opportunities[]`, or `threats[]` field accepts either plain strings or rich bullet objects:

```json
{
  "text": "Model 3 leads in range",
  "detail": "EPA-rated 358 miles; closest competitor is 270 miles",
  "sources": [
    { "label": "EPA 2024", "url": "https://fueleconomy.gov" }
  ]
}
```

- `detail` renders as a hover tooltip (ℹ icon) — great for adding nuance without cluttering the slide
- `sources` render as superscript numbers with a footnote row at the bottom of the slide

Plain strings still work as before (backward compatible).

## Slide operations

`update_deck` supports structural slide changes via the `slide_operations` field — an ordered array of operations executed sequentially before any content edits.

| Operation | Fields | Effect |
|-----------|--------|--------|
| `delete` | `index` | Remove slide at index |
| `insert` | `index`, `slide` | Insert new slide at index (shifts others down) |
| `move` | `from`, `to` | Move slide from one position to another |
| `replace` | `index`, `slide` | Replace slide entirely (new layout + content) |

Operations are applied in order, so each operation sees the array as modified by previous ones. Content edits in `slides` use indices relative to the post-operations array.

```json
{
  "deck_id": "dk_abc",
  "slide_operations": [
    { "op": "delete", "index": 3 },
    { "op": "insert", "index": 1, "slide": { "layout": "title_and_body", "content": { "title": "New Slide", "body": "Hello" } } },
    { "op": "move", "from": 0, "to": 4 }
  ],
  "slides": [
    { "index": 2, "content": { "title": "Updated Title" } }
  ]
}
```

## Customization

Both `create_deck` and `update_deck` accept optional styling fields:

| Field | Description | Default |
|-------|-------------|---------|
| `heading_font` | Google Font for headings (e.g. `"Playfair Display"`, `"Space Grotesk"`) | DM Sans |
| `body_font` | Google Font for body text (e.g. `"Inter"`, `"Roboto"`) | DM Sans |
| `accent_color` | Hex color (e.g. `"#ff6600"`) | `#7c3aed` (purple) |

## Example prompts

> Create a deck about the rise of electric vehicles. Search the web for relevant photos and use them. Use heading font "Space Grotesk", body font "Inter", and accent color "#0ea5e9".

> Create a deck about the Apollo 11 moon landing. Search the web for historic NASA photos and use them as full-bleed images. Include a timeline of the mission, stats on the Saturn V rocket, and a famous quote from Neil Armstrong. Use heading font "Libre Baskerville" and accent color "#1e3a5f".

> Build a lecture deck on how neural networks learn. Use a comparison table for activation functions, bullet points for key concepts, and add a key takeaway to each slide.

> Create a travel guide deck for Tokyo. Search the web for photos and include an image gallery of must-visit spots, stats on tourism, and a full-bleed image cover slide.

## Configuration

By default the MCP server connects to `https://deckpipe.com`. To use a different API endpoint:

```json
{
  "mcpServers": {
    "deckpipe": {
      "command": "npx",
      "args": ["-y", "deckpipe-mcp"],
      "env": {
        "DECKPIPE_API_URL": "http://localhost:3010"
      }
    }
  }
}
```

## License

MIT
