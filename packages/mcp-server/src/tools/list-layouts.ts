export const listLayoutsTool = {
  name: 'list_layouts',
  description: `List all available slide layouts and themes. Use this to discover what layouts and content fields are supported before creating a deck. No input required.`,
  inputSchema: {
    type: 'object' as const,
    properties: {},
  },
  async execute() {
    const layouts = [
      {
        name: 'title',
        description: 'Opening or closing slide with a large centered title.',
        fields: {
          title: { type: 'string', required: true },
          subtitle: { type: 'string', required: false },
          image_url: { type: 'url', required: false, behavior: 'Background or centered below title' },
        },
      },
      {
        name: 'title_and_body',
        description: 'Title with a body paragraph. Good for explanatory slides.',
        fields: {
          title: { type: 'string', required: true },
          body: { type: 'string', required: true },
          image_url: { type: 'url', required: false, behavior: 'Beside text (landscape) or below (portrait)' },
        },
      },
      {
        name: 'title_and_bullets',
        description: 'Title with a bullet point list. Best for key points, features, or metrics.',
        fields: {
          title: { type: 'string', required: true },
          bullets: { type: 'string[]', required: true },
          image_url: { type: 'url', required: false, behavior: 'Right column alongside bullets' },
        },
      },
      {
        name: 'title_and_table',
        description: 'Title with a data table. Use for comparisons, pricing, feature matrices.',
        fields: {
          title: { type: 'string', required: true },
          table: {
            type: 'object', required: true,
            properties: {
              headers: { type: 'string[]', required: true, max_items: 6 },
              rows: { type: 'string[][]', required: true, max_items: 8 },
              highlight_column: { type: 'integer', required: false, description: 'Zero-indexed column to emphasize' },
            },
          },
        },
      },
      {
        name: 'two_columns',
        description: 'Title with two side-by-side columns. Each column has a heading and body text. Good for comparisons.',
        fields: {
          title: { type: 'string', required: true },
          left: { type: 'object', required: true, properties: { heading: 'string', body: 'string' } },
          right: { type: 'object', required: true, properties: { heading: 'string', body: 'string' } },
          image_url: { type: 'url', required: false, behavior: 'Spans below both columns' },
        },
      },
      {
        name: 'section_break',
        description: 'Bold section divider with a centered title on an accent background. No image support.',
        fields: {
          title: { type: 'string', required: true },
        },
      },
      {
        name: 'image_and_text',
        description: 'Image-primary slide (~60% image, ~40% text). Image is required.',
        fields: {
          title: { type: 'string', required: true },
          body: { type: 'string', required: true },
          image_url: { type: 'url', required: true, behavior: 'Primary — takes ~60% of slide' },
        },
      },
    ];

    const themes = ['minimal', 'modern', 'classic'];

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({ layouts, themes }, null, 2),
      }],
    };
  },
};
