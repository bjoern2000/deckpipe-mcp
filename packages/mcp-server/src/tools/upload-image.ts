import { config } from '../config.js';

export const uploadImageTool = {
  name: 'upload_image',
  description: `Upload a base64-encoded image to get a hosted URL for use in slide image_url fields.

Use this to upload local files (screenshots, charts, logos) from the user's machine.

INPUT:
- image_data (string, required): Base64-encoded image data.
- filename (string, required): Filename with extension (e.g. "screenshot.png").
- content_type (string, required): MIME type — "image/png", "image/jpeg", or "image/webp".

RETURNS: { image_id, url } — use the url in any slide's image_url field.

WORKFLOW: Upload the image first, then use the returned URL when creating or updating a deck.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      image_data: { type: 'string', description: 'Base64-encoded image data' },
      filename: { type: 'string', description: 'Filename (e.g. screenshot.png)' },
      content_type: { type: 'string', enum: ['image/png', 'image/jpeg', 'image/webp'] },
    },
    required: ['image_data', 'filename', 'content_type'],
  },
  async execute(args: Record<string, unknown>) {
    const { image_data, filename, content_type } = args as {
      image_data: string;
      filename: string;
      content_type: string;
    };

    const buffer = Buffer.from(image_data, 'base64');
    const blob = new Blob([buffer], { type: content_type });

    const form = new FormData();
    form.append('file', blob, filename);

    const res = await fetch(`${config.apiUrl}/v1/images`, {
      method: 'POST',
      body: form,
    });

    const data = await res.json();
    if (!res.ok) {
      return { content: [{ type: 'text' as const, text: `Error: ${JSON.stringify(data)}` }] };
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
};
