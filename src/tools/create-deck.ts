import { config } from '../config.js';

export const createDeckTool = {
  name: 'create_deck',
  description: `Create a new slide deck and get a shareable viewer URL.

MARKDOWN: All text content fields support markdown rendering. Use **bold**, *italic*, \`code\`, [links](url), and lists (1. ordered, - unordered) in body, subtitle, bullets, table cells, and key_takeaway fields. Body text fields support full block markdown including numbered and bulleted lists.

INPUT:
- title (string, required): The deck title.
- theme (string, optional): Visual theme. One of: "minimal" (clean, light, Inter font), "modern" (bold, vibrant, DM Sans), "classic" (warm, serif headings, earth tones). Default: "minimal".
- slides (array, required, 1-50 items): Array of slide objects. Each slide has:
  - layout (string, required): One of: "title", "title_and_body", "title_and_bullets", "title_and_table", "two_columns", "section_break", "image_and_text".
  - content (object, required): Fields depend on layout:
    - title: { title, subtitle? }
    - title_and_body: { title, body }
    - title_and_bullets: { title, bullets[] }
    - title_and_table: { title, table: { headers[], rows[][], highlight_column? } }
    - two_columns: { title, left: { heading, body }, right: { heading, body } }
    - section_break: { title }
    - image_and_text: { title, body, image_url (required) }
  - All layouts except section_break accept an optional image_url field.

EXAMPLE:
{
  "title": "Q1 Update",
  "theme": "modern",
  "slides": [
    { "layout": "title", "content": { "title": "Q1 Update", "subtitle": "March 2026" } },
    { "layout": "title_and_bullets", "content": { "title": "Highlights", "bullets": ["Revenue up 25%", "3 new features shipped"] } }
  ]
}

RETURNS: { deck_id, viewer_url, created_at, slide_count }`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      title: { type: 'string', description: 'Deck title' },
      theme: { type: 'string', enum: ['minimal', 'modern', 'classic'], description: 'Visual theme (default: minimal)' },
      slides: {
        type: 'array',
        description: 'Array of slide objects with layout and content',
        items: {
          type: 'object',
          properties: {
            layout: { type: 'string', enum: ['title', 'title_and_body', 'title_and_bullets', 'title_and_table', 'two_columns', 'section_break', 'image_and_text'] },
            content: { type: 'object', description: 'Content fields (vary by layout)' },
          },
          required: ['layout', 'content'],
        },
      },
    },
    required: ['title', 'slides'],
  },
  async execute(args: Record<string, unknown>) {
    const res = await fetch(`${config.apiUrl}/v1/decks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });

    const data = await res.json();
    if (!res.ok) {
      return { content: [{ type: 'text' as const, text: `Error: ${JSON.stringify(data)}` }] };
    }

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
    };
  },
};
