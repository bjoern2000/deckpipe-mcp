#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { config } from './config.js';

const LAYOUTS = ['title', 'title_and_body', 'title_and_bullets', 'title_and_table', 'two_columns', 'section_break', 'image_and_text', 'image_gallery', 'stats', 'quote', 'full_image', 'timeline', 'comparison', 'code', 'callout', 'icons_and_text', 'team', 'embed', 'pros_and_cons', 'agenda', 'closing', 'swot', 'quadrant', 'venn_diagram'] as const;

function registerTools(server: McpServer) {
  // --- create_deck ---
  server.tool(
    'create_deck',
    `Create a new slide deck and get a shareable viewer URL.

Keep slide copy short and scannable — use shorthand phrases, not full sentences. Bullets: 5-8 words max.

MARKDOWN: All text content fields support markdown rendering. Use **bold**, *italic*, \`code\`, [links](url), and lists (1. ordered, - unordered) in body, subtitle, bullets, table cells, and key_takeaway fields. Body text fields support full block markdown including numbered and bulleted lists.

Layouts: "title", "title_and_body", "title_and_bullets", "title_and_table", "two_columns", "section_break", "image_and_text", "image_gallery", "stats", "quote", "full_image", "timeline", "comparison", "code", "callout", "icons_and_text", "team", "embed", "pros_and_cons", "agenda", "closing", "swot", "quadrant", "venn_diagram".

Content fields per layout (all layouts support optional key_takeaway):
- title: { title, subtitle?, image_url? }
- title_and_body: { title, body, image_url?, image_prompt? }
- title_and_bullets: { title, bullets[], image_url?, image_prompt? }
- title_and_table: { title, table: { headers[], rows[][], highlight_column? } }
- two_columns: { title, left: { heading, body }, right: { heading, body }, image_url?, image_prompt? }
- section_break: { title }
- image_and_text: { title, body, image_url (required unless image_prompt provided), image_prompt? }
- image_gallery: { title?, caption?, images[] (2-5 URLs) }
- stats: { title?, metrics[]: { value, label } (2-4 items) }
- quote: { quote, attribution?, image_url? }
- full_image: { image_url (required unless image_prompt provided), image_prompt?, title?, subtitle? }
- timeline: { title?, events[]: { label, title, description? } (3-6 items) }
- comparison: { title?, left: { heading, bullets[] }, right: { heading, bullets[] }, verdict? }
- code: { title?, code (required), language?, caption? }
- callout: { title?, value (required), label?, body? }
- icons_and_text: { title?, items[]: { icon, heading, description? } (3-6 items) }
- team: { title?, members[]: { name, role, bio?, image_url? } (1-6 items) }
- embed: { title?, url (required), caption?, aspect_ratio?: "16:9"|"4:3"|"1:1" }
- pros_and_cons: { title?, pros_heading?, cons_heading?, pros[], cons[] }
- agenda: { title?, items[]: { topic, duration?, description? } (1-10 items) }
- closing: { heading?, subheading?, contact_lines?[], image_url? }
- swot: { title?, strengths[], weaknesses[], opportunities[], threats[] (1-5 items each) }
- quadrant: { title?, x_label?, y_label?, quadrant_labels?[4], items[]: { label, x: 0-1, y: 0-1 } (1-12 items) }
- venn_diagram: { title?, body?, circles[]: { label, items?[] } (2-3 circles, required), overlaps?[]: { sets: [circle indices], label } (max 4) }

IMAGE PLACEHOLDERS: Use image_prompt (any layout that supports image_url) to suggest an image without providing one. Renders as a dashed placeholder box with your prompt text so the user knows what image to drop in. Example: image_prompt: "Screenshot of the iOS app home screen". When the user drops in an image, it replaces the placeholder.

RICH BULLETS: In any layout with bullets (title_and_bullets, comparison, swot, pros_and_cons, quadrant), bullets can be plain strings OR objects: { text, detail?, sources?: [{ label, url? }] }. Use "detail" for hover-accessible explanations (info icon tooltip). Use "sources" for citation footnotes (superscript numbers at bottom of slide).

Optionally set heading_font and body_font (any Google Font name) and accent_color (hex like "#ff6600") to customize the look.
Use upload_image first to get hosted URLs for any images.`,
    {
      title: z.string().describe('Deck title'),
      heading_font: z.string().optional().describe('Google Font for headings (e.g. "Playfair Display"). Default: DM Sans.'),
      body_font: z.string().optional().describe('Google Font for body text (e.g. "Inter"). Default: DM Sans.'),
      accent_color: z.string().optional().describe('Hex color (e.g. "#ff6600"). Overrides default purple accent.'),
      slides: z.array(z.object({
        layout: z.enum(LAYOUTS),
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
    `Update a deck's title, fonts, accent color, slide content, or slide structure. All text content fields support markdown (**bold**, *italic*, \`code\`, [links](url), numbered/bulleted lists).

Use "slides" for content edits (partial merge by index). Use "slide_operations" for structural changes (insert, delete, move, replace). Operations execute sequentially before content edits — indices in "slides" reference the post-operations array.

Slide operations (executed in order):
- Delete: { "op": "delete", "index": 2 }
- Insert: { "op": "insert", "index": 1, "slide": { "layout": "title_and_body", "content": { "title": "New", "body": "Text" } } }
- Move: { "op": "move", "from": 0, "to": 3 }
- Replace: { "op": "replace", "index": 4, "slide": { "layout": "stats", "content": { "metrics": [{ "value": "99%", "label": "Uptime" }] } } }`,
    {
      deck_id: z.string().describe('Deck ID to update'),
      title: z.string().optional().describe('New deck title'),
      heading_font: z.string().optional().describe('Google Font for headings (e.g. "Playfair Display")'),
      body_font: z.string().optional().describe('Google Font for body text (e.g. "Inter")'),
      accent_color: z.string().optional().describe('Hex color (e.g. "#ff6600")'),
      slide_operations: z.array(z.object({
        op: z.enum(['delete', 'insert', 'move', 'replace']).describe('Operation type'),
        index: z.number().optional().describe('Slide index (for delete, insert, replace)'),
        from: z.number().optional().describe('Source index (for move)'),
        to: z.number().optional().describe('Destination index (for move)'),
        slide: z.object({
          layout: z.enum(LAYOUTS).describe('Slide layout type'),
          content: z.record(z.unknown()).describe('Slide content'),
        }).optional().describe('New slide data (for insert, replace)'),
      })).optional().describe('Ordered structural operations. Executed sequentially before content edits.'),
      slides: z.array(z.object({
        index: z.number().describe('Zero-based slide index (post-operations)'),
        content: z.record(z.unknown()).describe('Partial content to merge'),
      })).optional().describe('Content edits by index (applied after slide_operations)'),
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
        { name: 'title_and_body', description: 'Title + paragraph.', fields: 'title (required), body (required), image_url?, image_prompt?, key_takeaway?' },
        { name: 'title_and_bullets', description: 'Title + bullet list.', fields: 'title (required), bullets[] (required), image_url?, image_prompt?, key_takeaway?' },
        { name: 'title_and_table', description: 'Title + data table.', fields: 'title (required), table: { headers[], rows[][], highlight_column? }, key_takeaway?' },
        { name: 'two_columns', description: 'Title + two columns.', fields: 'title (required), left: { heading, body }, right: { heading, body }, image_url?, image_prompt?, key_takeaway?' },
        { name: 'section_break', description: 'Bold section divider on accent bg.', fields: 'title (required), key_takeaway?' },
        { name: 'image_and_text', description: 'Image-primary (~60%) + text.', fields: 'title (required), body (required), image_url or image_prompt (one required), key_takeaway?' },
        { name: 'image_gallery', description: 'Horizontal row of portrait images — ideal for screenshot galleries.', fields: 'images[] (2-5 URLs, required), title?, caption?, key_takeaway?' },
        { name: 'stats', description: 'Big metrics/numbers with labels.', fields: 'metrics[]: { value, label } (2-4 items, required), title?, key_takeaway?' },
        { name: 'quote', description: 'Large pull-quote with optional attribution.', fields: 'quote (required), attribution?, image_url?, key_takeaway?' },
        { name: 'full_image', description: 'Full-bleed background image with optional overlay text.', fields: 'image_url or image_prompt (one required), title?, subtitle?, key_takeaway?' },
        { name: 'timeline', description: 'Horizontal timeline with 3-6 events.', fields: 'events[]: { label, title, description? } (3-6 items, required), title?, key_takeaway?' },
        { name: 'comparison', description: 'Side-by-side A vs B with optional verdict.', fields: 'left: { heading, bullets[], image_url? }, right: { heading, bullets[], image_url? } (required), title?, verdict?, key_takeaway?' },
        { name: 'code', description: 'Styled code block with language badge.', fields: 'code (required), title?, language?, caption?, key_takeaway?' },
        { name: 'callout', description: 'Hero number or statement with supporting text.', fields: 'value (required), title?, label?, body?, key_takeaway?' },
        { name: 'icons_and_text', description: 'Grid of 3-6 items with emoji icon, heading, description.', fields: 'items[]: { icon, heading, description? } (3-6 items, required), title?, key_takeaway?' },
        { name: 'team', description: 'People grid with photos, names, roles.', fields: 'members[]: { name, role, bio?, image_url? } (1-6 items, required), title?, key_takeaway?' },
        { name: 'embed', description: 'Embedded iframe (YouTube, Figma, etc).', fields: 'url (required), title?, caption?, aspect_ratio? ("16:9"|"4:3"|"1:1"), key_takeaway?' },
        { name: 'pros_and_cons', description: 'Two-column green/red pros and cons list.', fields: 'pros[] (required), cons[] (required), title?, pros_heading?, cons_heading?, key_takeaway?' },
        { name: 'agenda', description: 'Numbered topic list with optional durations.', fields: 'items[]: { topic, duration?, description? } (1-10 items, required), title?, key_takeaway?' },
        { name: 'closing', description: 'Thank you / contact info slide.', fields: 'heading?, subheading?, contact_lines?[], image_url?, key_takeaway?' },
        { name: 'swot', description: '2x2 SWOT analysis grid.', fields: 'strengths[], weaknesses[], opportunities[], threats[] (1-5 items each, all required), title?, key_takeaway?' },
        { name: 'quadrant', description: 'X/Y positioning grid with labeled dots.', fields: 'items[]: { label, x: 0-1, y: 0-1 } (1-12 items, required), title?, x_label?, y_label?, quadrant_labels?[4], key_takeaway?' },
        { name: 'venn_diagram', description: 'Venn diagram with 2 or 3 overlapping circles. Centered when no text; text-left/diagram-right when title/body provided.', fields: 'circles[]: { label, items?[] } (2-3 items, required), overlaps?[]: { sets: [circle indices], label } (max 4), title?, body?, key_takeaway?' },
      ];
      const customization = {
        heading_font: 'Optional Google Font for headings (e.g. "Playfair Display"). Default: DM Sans.',
        body_font: 'Optional Google Font for body text (e.g. "Inter"). Default: DM Sans.',
        accent_color: 'Optional hex color (e.g. "#ff6600"). Default: #7c3aed (purple).',
      };
      const style_guide = {
        copy: 'Keep text short and scannable. Use shorthand phrases, not full sentences. Bullets: 5-8 words max. Stats: abbreviate large numbers (e.g. "2.4M" not "2,400,000"). Quotes: under 30 words.',
        images: 'Use upload_image to host images. image_gallery works best with 2-5 portrait images of consistent aspect ratio. full_image needs high-res landscape images.',
        rich_bullets: 'Bullets in title_and_bullets, comparison, swot, pros_and_cons, and quadrant can be plain strings or objects: { text, detail?, sources?: [{ label, url? }] }. Use detail for hover tooltips. Use sources for footnote citations.',
        image_prompt: 'Use image_prompt instead of image_url to suggest an image the user should provide. Renders as a dashed placeholder with your descriptive text. Example: "Screenshot of the competitor app onboarding flow". User drops in the real image later.',
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
