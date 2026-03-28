import { config } from '../config.js';

export const updateDeckTool = {
  name: 'update_deck',
  description: `Update an existing deck's title, theme, or individual slide content.

INPUT:
- deck_id (string, required): The deck ID to update.
- title (string, optional): New deck title.
- theme (string, optional): New theme ("minimal", "modern", "classic").
- slides (array, optional): Array of slide updates. Each has:
  - index (number): Zero-based slide index to update.
  - content (object): Partial content fields to merge into the existing slide content.

EXAMPLE: Update slide 2's title:
{ "deck_id": "dk_abc123", "slides": [{ "index": 2, "content": { "title": "New Title" } }] }

RETURNS: Full updated deck object.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      deck_id: { type: 'string', description: 'Deck ID to update' },
      title: { type: 'string', description: 'New deck title' },
      theme: { type: 'string', enum: ['minimal', 'modern', 'classic'] },
      slides: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            index: { type: 'number', description: 'Zero-based slide index' },
            content: { type: 'object', description: 'Partial content to merge' },
          },
          required: ['index', 'content'],
        },
      },
    },
    required: ['deck_id'],
  },
  async execute(args: Record<string, unknown>) {
    const { deck_id, ...body } = args;
    const res = await fetch(`${config.apiUrl}/v1/decks/${deck_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      return { content: [{ type: 'text' as const, text: `Error: ${JSON.stringify(data)}` }] };
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
};
