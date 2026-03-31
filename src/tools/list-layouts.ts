import { config } from '../config.js';

export const listLayoutsTool = {
  name: 'list_layouts',
  description: `List all available slide layouts, their content fields, and themes. Use this to discover what is supported before creating a deck. No input required.`,
  inputSchema: {
    type: 'object' as const,
    properties: {},
  },
  async execute() {
    // Fetch live layout data from the API
    try {
      const res = await fetch(`${config.apiUrl}/v1/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: { name: 'list_layouts', arguments: {} },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.result?.content?.[0]?.text;
        if (text) {
          return { content: [{ type: 'text' as const, text }] };
        }
      }
    } catch {
      // Fall through to static fallback
    }

    // Static fallback
    const layouts = [
      { name: 'title', fields: 'title (required), subtitle?, image_url?, key_takeaway?' },
      { name: 'title_and_body', fields: 'title (required), body (required), image_url?, image_prompt?, key_takeaway?' },
      { name: 'title_and_bullets', fields: 'title (required), bullets[] (required — strings or { text, detail?, sources?[] }), image_url?, image_prompt?, key_takeaway?' },
      { name: 'title_and_table', fields: 'title (required), table: { headers[], rows[][], highlight_column? }, key_takeaway?' },
      { name: 'two_columns', fields: 'title (required), left: { heading, body }, right: { heading, body }, image_url?, image_prompt?, key_takeaway?' },
      { name: 'section_break', fields: 'title (required), key_takeaway?' },
      { name: 'image_and_text', fields: 'title (required), body (required), image_url (required unless image_prompt provided), image_prompt?, key_takeaway?' },
      { name: 'image_gallery', fields: 'images[] (2-5 URLs, required unless image_prompt provided), image_prompt?, title?, caption?, key_takeaway?' },
      { name: 'stats', fields: 'metrics[]: { value, label } (2-4 items, required), title?, key_takeaway?' },
      { name: 'quote', fields: 'quote (required), attribution?, image_url?, key_takeaway?' },
      { name: 'full_image', fields: 'image_url (required unless image_prompt provided), image_prompt?, title?, subtitle?, key_takeaway?' },
      { name: 'timeline', fields: 'events[]: { label, title, description?, position?: 0-1 } (3-6 items, required), title?, key_takeaway?' },
      { name: 'comparison', fields: 'left: { heading, bullets[], image_url? }, right: { heading, bullets[], image_url? } (required), title?, verdict?, key_takeaway?' },
      { name: 'code', fields: 'code (required), title?, language?, caption?, key_takeaway?' },
      { name: 'callout', fields: 'value (required), title?, label?, body?, key_takeaway?' },
      { name: 'icons_and_text', fields: 'items[]: { icon, heading, description? } (3-6 items, required), title?, key_takeaway?' },
      { name: 'team', fields: 'members[]: { name, role, bio?, image_url? } (1-6 items, required), title?, key_takeaway?' },
      { name: 'embed', fields: 'url (required), caption?, aspect_ratio? ("16:9"|"4:3"|"1:1"), key_takeaway?' },
      { name: 'pros_and_cons', fields: 'pros[] (required), cons[] (required), title?, pros_heading?, cons_heading?, key_takeaway?' },
      { name: 'agenda', fields: 'items[]: { topic, duration?, description? } (1-10 items, required), title?, key_takeaway?' },
      { name: 'swot', fields: 'strengths[], weaknesses[], opportunities[], threats[] (1-5 items each, all required), title?, key_takeaway?' },
      { name: 'quadrant', fields: 'items[]: { label, x: 0-1, y: 0-1 } (1-12 items, required), title?, body?, bullets?[], x_label?, y_label?, quadrant_labels?[4], key_takeaway?' },
      { name: 'venn_diagram', fields: 'circles[]: { label, items?[] } (2-3 circles, required), overlaps?[]: { sets: number[], label } (max 4), title?, key_takeaway?' },
      { name: 'closing', fields: 'heading?, subheading?, contact_lines?[], image_url?, key_takeaway?' },
    ];

    const customization = {
      heading_font: 'Google Font for headings. Default: DM Sans.',
      body_font: 'Google Font for body text. Default: DM Sans.',
      accent_color: 'Hex color. Default: #7c3aed.',
    };

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({ layouts, customization }, null, 2),
      }],
    };
  },
};
