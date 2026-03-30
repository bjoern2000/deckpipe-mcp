#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { config } from './config.js';

function registerTools(server: McpServer) {
  // --- create_deck ---
  server.tool(
    'create_deck',
    `Create a new slide deck and get a shareable viewer URL.

Keep slide copy short and scannable — use shorthand phrases, not full sentences. Bullets: 5-8 words max.

MARKDOWN: All text content fields support markdown rendering. Use **bold**, *italic*, \`code\`, [links](url), and lists (1. ordered, - unordered) in body, subtitle, bullets, table cells, and key_takeaway fields. Body text fields support full block markdown including numbered and bulleted lists.

Layouts: "title", "title_and_body", "title_and_bullets", "title_and_table", "two_columns", "section_break", "image_and_text", "image_gallery", "stats", "quote", "full_image".

Content fields per layout (all layouts support optional key_takeaway):
- title: { title, subtitle?, image_url? }
- title_and_body: { title, body, image_url? }
- title_and_bullets: { title, bullets[], image_url? }
- title_and_table: { title, table: { headers[], rows[][], highlight_column? } }
- two_columns: { title, left: { heading, body }, right: { heading, body }, image_url? }
- section_break: { title }
- image_and_text: { title, body, image_url (required) }
- image_gallery: { title?, caption?, images[] (2-5 URLs) }
- stats: { title?, metrics[]: { value, label } (2-4 items) }
- quote: { quote, attribution?, image_url? }
- full_image: { image_url (required), title?, subtitle? }

Optionally set heading_font and body_font (any Google Font name) and accent_color (hex like "#ff6600") to customize the look.
Use upload_image first to get hosted URLs for any images.`,
    {
      title: z.string().describe('Deck title'),
      heading_font: z.string().optional().describe('Google Font for headings (e.g. "Playfair Display"). Default: DM Sans.'),
      body_font: z.string().optional().describe('Google Font for body text (e.g. "Inter"). Default: DM Sans.'),
      accent_color: z.string().optional().describe('Hex color (e.g. "#ff6600"). Overrides default purple accent.'),
      slides: z.array(z.object({
        layout: z.enum(['title', 'title_and_body', 'title_and_bullets', 'title_and_table', 'two_columns', 'section_break', 'image_and_text', 'image_gallery', 'stats', 'quote', 'full_image']),
        content: z.record(z.unknown()).describe('Content fields (vary by layout). All layouts support optional key_takeaway.'),
      })).describe('Array of slides'),
    },
    async (args) => {
      const res = await fetch(`${config.apiUrl}/v1/decks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      });
      const data = await res.json();
      if (!res.ok) return { content: [{ type: 'text' as const, text: `Error: ${JSON.stringify(data)}` }] };
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  // --- get_deck ---
  server.tool(
    'get_deck',
    'Retrieve a deck by ID, including any user edits made in the viewer.',
    {
      deck_id: z.string().describe('The deck ID (e.g. "dk_a1b2c3d4")'),
    },
    async ({ deck_id }) => {
      const res = await fetch(`${config.apiUrl}/v1/decks/${deck_id}`);
      const data = await res.json();
      if (!res.ok) return { content: [{ type: 'text' as const, text: `Error: ${JSON.stringify(data)}` }] };
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  // --- update_deck ---
  server.tool(
    'update_deck',
    `Update a deck's title, fonts, accent color, or individual slide content. All text content fields support markdown (**bold**, *italic*, \`code\`, [links](url), numbered/bulleted lists). Slides are updated by index with partial content merge.

Example: { "deck_id": "dk_abc", "slides": [{ "index": 2, "content": { "title": "New Title" } }] }`,
    {
      deck_id: z.string().describe('Deck ID to update'),
      title: z.string().optional().describe('New deck title'),
      heading_font: z.string().optional().describe('Google Font for headings (e.g. "Playfair Display")'),
      body_font: z.string().optional().describe('Google Font for body text (e.g. "Inter")'),
      accent_color: z.string().optional().describe('Hex color (e.g. "#ff6600")'),
      slides: z.array(z.object({
        index: z.number().describe('Zero-based slide index'),
        content: z.record(z.unknown()).describe('Partial content to merge'),
      })).optional().describe('Slide updates'),
    },
    async ({ deck_id, ...body }) => {
      const res = await fetch(`${config.apiUrl}/v1/decks/${deck_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) return { content: [{ type: 'text' as const, text: `Error: ${JSON.stringify(data)}` }] };
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  // --- delete_deck ---
  server.tool(
    'delete_deck',
    'Delete a deck permanently.',
    {
      deck_id: z.string().describe('Deck ID to delete'),
    },
    async ({ deck_id }) => {
      const res = await fetch(`${config.apiUrl}/v1/decks/${deck_id}`, { method: 'DELETE' });
      if (res.status === 204) {
        return { content: [{ type: 'text' as const, text: `Deck ${deck_id} deleted successfully.` }] };
      }
      const data = await res.json();
      return { content: [{ type: 'text' as const, text: `Error: ${JSON.stringify(data)}` }] };
    }
  );

  // --- upload_image ---
  server.tool(
    'upload_image',
    `Upload a base64-encoded image to get a hosted URL for use in slide image_url fields.

Accepts PNG, JPG, WebP up to 10MB. Upload first, then use the returned URL when creating or updating a deck.`,
    {
      image_data: z.string().describe('Base64-encoded image data'),
      filename: z.string().describe('Filename with extension (e.g. "photo.jpg")'),
      content_type: z.enum(['image/png', 'image/jpeg', 'image/webp']).describe('MIME type'),
    },
    async ({ image_data, filename, content_type }) => {
      const buffer = Buffer.from(image_data, 'base64');
      const blob = new Blob([buffer], { type: content_type });

      const form = new FormData();
      form.append('file', blob, filename);

      const res = await fetch(`${config.apiUrl}/v1/images`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (!res.ok) return { content: [{ type: 'text' as const, text: `Error: ${JSON.stringify(data)}` }] };
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  // --- list_layouts ---
  server.tool(
    'list_layouts',
    'List all available slide layouts, their content fields, and themes. Use this to discover what is supported before creating a deck.',
    {},
    async () => {
      const layouts = [
        { name: 'title', description: 'Large centered title slide.', fields: 'title (required), subtitle?, image_url?, key_takeaway?' },
        { name: 'title_and_body', description: 'Title + paragraph.', fields: 'title (required), body (required), image_url?, key_takeaway?' },
        { name: 'title_and_bullets', description: 'Title + bullet list.', fields: 'title (required), bullets[] (required), image_url?, key_takeaway?' },
        { name: 'title_and_table', description: 'Title + data table.', fields: 'title (required), table: { headers[], rows[][], highlight_column? }, key_takeaway?' },
        { name: 'two_columns', description: 'Title + two columns.', fields: 'title (required), left: { heading, body }, right: { heading, body }, image_url?, key_takeaway?' },
        { name: 'section_break', description: 'Bold section divider on accent bg.', fields: 'title (required), key_takeaway?' },
        { name: 'image_and_text', description: 'Image-primary (~60%) + text.', fields: 'title (required), body (required), image_url (required), key_takeaway?' },
        { name: 'image_gallery', description: 'Horizontal row of portrait images — ideal for screenshot galleries.', fields: 'images[] (2-5 URLs, required), title?, caption?, key_takeaway?' },
        { name: 'stats', description: 'Big metrics/numbers with labels.', fields: 'metrics[]: { value, label } (2-4 items, required), title?, key_takeaway?' },
        { name: 'quote', description: 'Large pull-quote with optional attribution.', fields: 'quote (required), attribution?, image_url?, key_takeaway?' },
        { name: 'full_image', description: 'Full-bleed background image with optional overlay text.', fields: 'image_url (required), title?, subtitle?, key_takeaway?' },
      ];
      const customization = {
        heading_font: 'Optional Google Font for headings (e.g. "Playfair Display"). Default: DM Sans.',
        body_font: 'Optional Google Font for body text (e.g. "Inter"). Default: DM Sans.',
        accent_color: 'Optional hex color (e.g. "#ff6600"). Default: #7c3aed (purple).',
      };
      const style_guide = {
        copy: 'Keep text short and scannable. Use shorthand phrases, not full sentences. Bullets: 5-8 words max. Stats: abbreviate large numbers (e.g. "2.4M" not "2,400,000"). Quotes: under 30 words.',
        images: 'Use upload_image to host images. image_gallery works best with 2-5 portrait images of consistent aspect ratio. full_image needs high-res landscape images.',
      };
      return { content: [{ type: 'text' as const, text: JSON.stringify({ layouts, customization, style_guide }, null, 2) }] };
    }
  );
}

// Start with stdio or HTTP transport based on PORT env var
async function main() {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : null;

  if (port) {
    // HTTP mode — for remote MCP (Claude.ai, etc.)
    const transports = new Map<string, StreamableHTTPServerTransport>();

    const httpServer = createServer(async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');
      res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.url !== '/mcp') {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      // Check for existing session
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      if (sessionId && transports.has(sessionId)) {
        const transport = transports.get(sessionId)!;
        await transport.handleRequest(req, res);
        return;
      }

      if (req.method === 'GET' || req.method === 'DELETE') {
        if (sessionId) {
          res.writeHead(404);
          res.end('Session not found');
        } else {
          res.writeHead(400);
          res.end('Session ID required');
        }
        return;
      }

      // New session (POST without session ID = initialization)
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          transports.delete(transport.sessionId);
        }
      };

      const mcpServer = new McpServer({
        name: 'deckpipe',
        version: '0.2.0',
      });
      registerTools(mcpServer);
      await mcpServer.connect(transport);

      if (transport.sessionId) {
        transports.set(transport.sessionId, transport);
      }

      await transport.handleRequest(req, res);
    });

    httpServer.listen(port, () => {
      console.error(`Deckpipe MCP server running on http://0.0.0.0:${port}/mcp`);
    });
  } else {
    // Stdio mode — for CLI (npx deckpipe-mcp)
    const server = new McpServer({
      name: 'deckpipe',
      version: '0.2.0',
    });
    registerTools(server);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Deckpipe MCP server running on stdio');
  }
}

main().catch((err) => {
  console.error('MCP server error:', err);
  process.exit(1);
});
