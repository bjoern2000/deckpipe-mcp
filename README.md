# deckpipe-mcp

MCP server for [Deckpipe](https://deckpipe.com) — create, edit, and export slide decks from any AI agent.

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
| `update_deck` | Update title, theme, or individual slides by index |
| `delete_deck` | Delete a deck permanently |
| `upload_image` | Upload a base64 image, get a hosted URL |
| `list_layouts` | List available layouts, fields, and themes |

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

## Themes

- **minimal** — Inter, clean and light
- **modern** — DM Sans, purple accent
- **classic** — Playfair Display headings, earth tones

## Example prompt

> Create a 10-slide deck about the history of the internet. Use the modern theme. Include a timeline, key milestones as bullets, and a comparison table of early vs modern internet speeds.

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
