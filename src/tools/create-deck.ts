import { config } from '../config.js';

const LAYOUTS = ['title', 'title_and_body', 'title_and_bullets', 'title_and_table', 'two_columns', 'section_break', 'image_and_text', 'image_gallery', 'stats', 'quote', 'full_image', 'timeline', 'comparison', 'code', 'callout', 'icons_and_text', 'team', 'embed', 'pros_and_cons', 'agenda', 'swot', 'quadrant', 'venn_diagram', 'closing'] as const;

export const createDeckTool = {
  name: 'create_deck',
  description: `Create a new slide deck and get a shareable viewer URL.

Keep slide copy short and scannable — use shorthand phrases, not full sentences. Bullets: 5-8 words max.

MARKDOWN: All text content fields support markdown rendering. Use **bold**, *italic*, \`code\`, [links](url), and lists (1. ordered, - unordered) in body, subtitle, bullets, table cells, and key_takeaway fields. Body text fields support full block markdown including numbered and bulleted lists.

Layouts: "title", "title_and_body", "title_and_bullets", "title_and_table", "two_columns", "section_break", "image_and_text", "image_gallery", "stats", "quote", "full_image", "timeline", "comparison", "code", "callout", "icons_and_text", "team", "embed", "pros_and_cons", "agenda", "swot", "quadrant", "venn_diagram", "closing".

RICH BULLETS: In title_and_bullets, comparison, and pros_and_cons, bullets can be strings OR objects: { text, detail?, sources?[{ label, url? }] }. detail shows as an info tooltip on hover. sources render as numbered footnotes.

Content fields per layout (all layouts support optional key_takeaway):
- title: { title, subtitle?, image_url? }
- title_and_body: { title, body, image_url?, image_prompt? }
- title_and_bullets: { title, bullets[] (strings or { text, detail?, sources?[] }), image_url?, image_prompt? }
- title_and_table: { title, table: { headers[], rows[][], highlight_column? } }
- two_columns: { title, left: { heading, body }, right: { heading, body }, image_url?, image_prompt? }
- section_break: { title }
- image_and_text: { title, body, image_url (required unless image_prompt provided), image_prompt? }
- image_gallery: { title?, caption?, images[] (2-5 URLs, required unless image_prompt provided), image_prompt? }
- stats: { title?, metrics[]: { value, label } (2-4 items) }
- quote: { quote, attribution?, image_url? }
- full_image: { image_url (required unless image_prompt provided), image_prompt?, title?, subtitle? }
- timeline: { title?, events[]: { label, title, description? } (3-6 items) }
- comparison: { title?, left: { heading, bullets[] }, right: { heading, bullets[] }, verdict? }
- code: { title?, code (required), language?, caption? }
- callout: { title?, value (required), label?, body? }
- icons_and_text: { title?, items[]: { icon, heading, description? } (3-6 items) }
- team: { title?, members[]: { name, role, bio?, image_url? } (1-6 items) }
- embed: { title?, url (required), caption? }
- pros_and_cons: { title?, pros[], cons[] }
- agenda: { title?, items[]: { label, description? } (3-8 items) }
- closing: { title, subtitle?, cta? }
- swot: { title?, strengths[], weaknesses[], opportunities[], threats[] }
- quadrant: { title?, x_label?, y_label?, items[]: { label, x, y, size? } }
- venn_diagram: { title?, circles[]: { label, items[] } (2-3 circles), intersection? }

RETURNS: { deck_id, viewer_url, share_url, created_at, slide_count }`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      title: { type: 'string', description: 'Deck title' },
      theme: { type: 'string', enum: ['minimal', 'modern', 'classic'], description: 'Visual theme (default: minimal)' },
      heading_font: { type: 'string', description: 'Google Font for headings (e.g. "Playfair Display"). Default: DM Sans.' },
      body_font: { type: 'string', description: 'Google Font for body text (e.g. "Inter"). Default: DM Sans.' },
      accent_color: { type: 'string', description: 'Hex color (e.g. "#ff6600"). Overrides default accent.' },
      slides: {
        type: 'array',
        description: 'Array of slide objects with layout and content',
        items: {
          type: 'object',
          properties: {
            layout: { type: 'string', enum: LAYOUTS as unknown as string[] },
            content: { type: 'object', additionalProperties: true, description: 'Content fields (vary by layout). All layouts support optional key_takeaway.' },
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
