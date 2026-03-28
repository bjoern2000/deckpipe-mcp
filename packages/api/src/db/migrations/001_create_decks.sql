CREATE TABLE IF NOT EXISTS decks (
  deck_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'minimal',
  slides JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decks_created_at ON decks(created_at DESC);
