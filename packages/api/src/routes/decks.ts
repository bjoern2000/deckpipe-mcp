import { Router } from 'express';
import { CreateDeckSchema, UpdateDeckSchema, generateDeckId, ApiError } from '@deckpipe/shared';
import { validate } from '../middleware/validate.js';
import { createDeckLimiter, getDeckLimiter, updateDeckLimiter, exportPdfLimiter } from '../middleware/rate-limiter.js';
import { query } from '../db/client.js';
import { config } from '../config.js';
import { rehostImagesInDeck } from '../services/image-service.js';

export const decksRouter = Router();

// POST /v1/decks — Create a new deck
decksRouter.post('/', createDeckLimiter, validate(CreateDeckSchema), async (req, res, next) => {
  try {
    const { title, theme, slides } = req.body;
    const deckId = generateDeckId();

    // Re-host external images
    const processedSlides = await rehostImagesInDeck(slides);

    await query(
      'INSERT INTO decks (deck_id, title, theme, slides) VALUES ($1, $2, $3, $4)',
      [deckId, title, theme, JSON.stringify(processedSlides)]
    );

    const result = await query('SELECT created_at FROM decks WHERE deck_id = $1', [deckId]);

    res.status(201).json({
      deck_id: deckId,
      viewer_url: `${config.viewerUrl}/d/${deckId}`,
      created_at: result.rows[0].created_at,
      slide_count: processedSlides.length,
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
      theme: deck.theme,
      slides: deck.slides,
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
    const { title, theme, slides } = req.body;

    // Apply updates
    const newTitle = title ?? deck.title;
    const newTheme = theme ?? deck.theme;
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
    }

    await query(
      'UPDATE decks SET title = $1, theme = $2, slides = $3, updated_at = NOW() WHERE deck_id = $4',
      [newTitle, newTheme, JSON.stringify(newSlides), req.params.id]
    );

    const result = await query('SELECT * FROM decks WHERE deck_id = $1', [req.params.id]);
    const updated = result.rows[0];

    res.json({
      deck_id: updated.deck_id,
      title: updated.title,
      theme: updated.theme,
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
