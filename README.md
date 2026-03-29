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
| `update_deck` | Update title, font, accent color, or individual slides by index |
| `delete_deck` | Delete a deck permanently |
| `upload_image` | Upload a base64 image, get a hosted URL |
| `list_layouts` | List available layouts and customization options |

## Layouts

| Layout | Required Fields |
|--------|----------------|
| `title` | `title`, optional `subtitle`, `image_url` |
| `title_and_body` | `title`, `body`, optional `image_url` |
| `title_and_bullets` | `title`, `bullets[]`, optional `image_url` |
| `title_and_table` | `title`, `table: { headers[], rows[][] }` |
| `two_columns` | `title`, `left: { heading, body }`, `right: { heading, body }` |
| `section_break` | `title` |
| `image_and_text` | `title`, `body`, `image_url` |

## Customization

Both `create_deck` and `update_deck` accept optional styling fields:

| Field | Description | Default |
|-------|-------------|---------|
| `custom_font` | Any Google Font name (e.g. `"Roboto Slab"`, `"Playfair Display"`) | DM Sans |
| `accent_color` | Hex color (e.g. `"#ff6600"`) | `#7c3aed` (purple) |

## Example prompts

> Create a 10-slide deck about the history of the internet. Include a timeline, key milestones as bullets, and a comparison table of early vs modern internet speeds.

> Make a deck about coffee brewing methods. Use the font "Playfair Display" and accent color "#8b4513".

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
