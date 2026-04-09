# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Standalone, npm-publishable MCP server for Deckpipe. Agents install this package (`deckpipe-mcp`) to create, edit, and export slide decks via the Model Context Protocol. Uses stdio transport.

## Commands

```bash
npm install
npm run build    # TypeScript compile to dist/
npm run dev      # tsx watch mode
```

## Architecture

- `src/index.ts` — Entry point, MCP server setup and stdio transport.
- `src/config.ts` — Configuration (API URL, etc.).
- `src/tools/` — One file per MCP tool (`create_deck`, `get_deck`, `update_deck`, `delete_deck`, `upload_image`, `list_layouts`). Each exports a Zod schema and handler that calls the Deckpipe REST API.

## Related Repository

**Deckpipe monorepo** (`/Users/bjornschefzyk/Projects/Deckpipe`) — The main monorepo containing the API, viewer, shared schemas, and the original `packages/mcp-server`. This standalone package mirrors the MCP tool definitions from the monorepo. When changing tool schemas, parameters, or behavior, keep both repos in sync.

## Key Details

- Tools wrap the Deckpipe REST API (`/v1/decks`, `/v1/images`).
- The API URL defaults to `https://api-production-3e7f.up.railway.app` but can be overridden via environment variable.
- Published as an npm package with `dist/index.js` as the bin entry point.
