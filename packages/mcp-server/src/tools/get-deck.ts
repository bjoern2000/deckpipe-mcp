import { config } from '../config.js';

export const getDeckTool = {
  name: 'get_deck',
  description: `Retrieve a deck's current state, including any user edits made in the viewer.

INPUT:
- deck_id (string, required): The deck ID (e.g. "dk_a1b2c3d4").

RETURNS: Full deck object with deck_id, title, theme, slides array, created_at, updated_at.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      deck_id: { type: 'string', description: 'The deck ID to retrieve' },
    },
    required: ['deck_id'],
  },
  async execute(args: Record<string, unknown>) {
    const res = await fetch(`${config.apiUrl}/v1/decks/${args.deck_id}`);
    const data = await res.json();
    if (!res.ok) {
      return { content: [{ type: 'text' as const, text: `Error: ${JSON.stringify(data)}` }] };
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
};
