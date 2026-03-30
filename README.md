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
| `update_deck` | Update title, fonts, accent color, or individual slides by index |
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
| `image_and_text` | Image-primary (~60%) + text | `title`, `body`, `image_url` |
| `image_gallery` | Horizontal row of portrait images | `images[]` (2-5 URLs), optional `title`, `caption` |
| `stats` | Big metrics/numbers with labels | `metrics[]: { value, label }` (2-4), optional `title` |
| `quote` | Large pull-quote with attribution | `quote`, optional `attribution`, `image_url` |
| `full_image` | Full-bleed background image with overlay text | `image_url`, optional `title`, `subtitle` |

All layouts support an optional `key_takeaway` field — a highlighted sentence rendered below the title.

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
