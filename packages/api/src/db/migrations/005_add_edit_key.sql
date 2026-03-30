ALTER TABLE decks ADD COLUMN IF NOT EXISTS edit_key TEXT;

UPDATE decks SET edit_key = md5(random()::text || clock_timestamp()::text) WHERE edit_key IS NULL;

ALTER TABLE decks ALTER COLUMN edit_key SET NOT NULL;
