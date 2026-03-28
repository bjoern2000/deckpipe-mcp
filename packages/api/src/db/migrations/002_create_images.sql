CREATE TABLE IF NOT EXISTS images (
  image_id TEXT PRIMARY KEY,
  original_filename TEXT,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
