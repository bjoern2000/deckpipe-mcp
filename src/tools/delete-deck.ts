import { config } from '../config.js';

export const deleteDeckTool = {
  name: 'delete_deck',
  description: `Delete a deck permanently.

INPUT:
- deck_id (string, required): The deck ID to delete.

RETURNS: Confirmation of deletion.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      deck_id: { type: 'string', description: 'Deck ID to delete' },
    },
    required: ['deck_id'],
  },
  async execute(args: Record<string, unknown>) {
    const res = await fetch(`${config.apiUrl}/v1/decks/${args.deck_id}`, { method: 'DELETE' });
    if (res.status === 204) {
      return { content: [{ type: 'text' as const, text: `Deck ${args.deck_id} deleted successfully.` }] };
    }
    const data = await res.json();
    return { content: [{ type: 'text' as const, text: `Error: ${JSON.stringify(data)}` }] };
  },
};
