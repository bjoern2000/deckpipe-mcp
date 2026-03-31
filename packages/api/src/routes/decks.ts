import { Router } from 'express';
import { CreateDeckSchema, UpdateDeckSchema, generateDeckId, generateEditKey, slugify, ApiError } from '@deckpipe/shared';
import { validate } from '../middleware/validate.js';
import { createDeckLimiter, getDeckLimiter, updateDeckLimiter, exportPdfLimiter } from '../middleware/rate-limiter.js';
import { query } from '../db/client.js';
import { config } from '../config.js';
export const decksRouter = Router();

function isPlaceholderUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname === 'placehold.co' || u.hostname === 'via.placeholder.com';
  } catch { return false; }
}

function extractPlaceholderText(url: string): string {
  try {
    const u = new URL(url);
    const text = u.searchParams.get('text');
    if (text) return text.replace(/\+/g, ' ');
    // placehold.co encodes text in the path: /800x500/bg/fg?text=...
    return '';
  } catch { return ''; }
}

function convertPlaceholderUrls(slides: any[]): any[] {
  return slides.map(slide => {
    const c = { ...slide.content };

    // Convert image_url placeholder to image_prompt
    if (c.image_url && isPlaceholderUrl(c.image_url)) {
      const text = extractPlaceholderText(c.image_url);
      if (text) c.image_prompt = c.image_prompt || text;
      delete c.image_url;
    }

    // Filter placeholder URLs from image_gallery images[]
    if (Array.isArray(c.images)) {
      c.images = c.images.filter((img: string) => !isPlaceholderUrl(img));
      if (c.images.length === 0) delete c.images;
    }

    return { ...slide, content: c };
  });
}

// POST /v1/decks — Create a new deck
decksRouter.post('/', createDeckLimiter, validate(CreateDeckSchema), async (req, res, next) => {
  try {
    const { title, heading_font, body_font, accent_color, slides: rawSlides } = req.body;
    const slides = convertPlaceholderUrls(rawSlides);
    const deckId = generateDeckId();
    const editKey = generateEditKey();
    const slug = slugify(title);

    await query(
      'INSERT INTO decks (deck_id, title, heading_font, body_font, accent_color, slides, edit_key) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [deckId, title, heading_font ?? null, body_font ?? null, accent_color ?? null, JSON.stringify(slides), editKey]
    );

    const result = await query('SELECT created_at FROM decks WHERE deck_id = $1', [deckId]);
    const shareUrl = `${config.viewerUrl}/d/${deckId}/${slug}`;

    res.status(201).json({
      deck_id: deckId,
      viewer_url: `${shareUrl}?key=${editKey}`,
      share_url: shareUrl,
      created_at: result.rows[0].created_at,
      slide_count: slides.length,
    });
  } catch (err) {
    next(err);
  }
});

// GET /v1/decks/:id — Retrieve deck
decksRouter.get('/:id', getDeckLimiter, async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM decks WHERE deck_id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      throw new ApiError('not_found', `Deck '${req.params.id}' not found`);
    }

    const deck = result.rows[0];
    res.json({
      deck_id: deck.deck_id,
      title: deck.title,
      heading_font: deck.heading_font ?? null,
      body_font: deck.body_font ?? null,
      accent_color: deck.accent_color ?? null,
      slides: deck.slides,
      edit_key: deck.edit_key,
      created_at: deck.created_at,
      updated_at: deck.updated_at,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /v1/decks/:id — Update deck
decksRouter.patch('/:id', updateDeckLimiter, validate(UpdateDeckSchema), async (req, res, next) => {
  try {
    const existing = await query('SELECT * FROM decks WHERE deck_id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      throw new ApiError('not_found', `Deck '${req.params.id}' not found`);
    }

    const deck = existing.rows[0];
    const { title, heading_font, body_font, accent_color, slides } = req.body;

    // Apply updates
    const newTitle = title ?? deck.title;
    const newHeadingFont = heading_font !== undefined ? heading_font : deck.heading_font;
    const newBodyFont = body_font !== undefined ? body_font : deck.body_font;
    const newAccentColor = accent_color !== undefined ? accent_color : deck.accent_color;
    let newSlides = deck.slides;

    if (slides) {
      // Index-based partial slide updates with deep merge
      for (const update of slides) {
        const { index, content } = update;
        if (index < 0 || index >= newSlides.length) {
          throw new ApiError('validation_error', `Slide index ${index} out of range (0-${newSlides.length - 1})`, `slides[${index}].index`);
        }
        newSlides[index] = {
          ...newSlides[index],
          content: { ...newSlides[index].content, ...content },
        };
      }
      // Clean up any placeholder URLs in the updated slides
      newSlides = convertPlaceholderUrls(newSlides);
    }

    await query(
      'UPDATE decks SET title = $1, heading_font = $2, body_font = $3, accent_color = $4, slides = $5, updated_at = NOW() WHERE deck_id = $6',
      [newTitle, newHeadingFont ?? null, newBodyFont ?? null, newAccentColor ?? null, JSON.stringify(newSlides), req.params.id]
    );

    const result = await query('SELECT * FROM decks WHERE deck_id = $1', [req.params.id]);
    const updated = result.rows[0];

    res.json({
      deck_id: updated.deck_id,
      title: updated.title,
      heading_font: updated.heading_font ?? null,
      body_font: updated.body_font ?? null,
      accent_color: updated.accent_color ?? null,
      slides: updated.slides,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /v1/decks/:id
decksRouter.delete('/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM decks WHERE deck_id = $1 RETURNING deck_id', [req.params.id]);
    if (result.rows.length === 0) {
      throw new ApiError('not_found', `Deck '${req.params.id}' not found`);
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// GET /v1/decks/:id/export/pdf — placeholder, implemented in Phase 7
decksRouter.get('/:id/export/pdf', exportPdfLimiter, async (_req, res) => {
  res.status(501).json({ error: { code: 'server_error', message: 'PDF export not yet implemented' } });
});
