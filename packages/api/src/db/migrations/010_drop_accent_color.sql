-- accent_color was forwarded as --dp-accent for the 25 templated layouts.
-- With canvas as the only agent-facing layout, agents control color directly
-- in their own stylesheet and the field is dead weight. Drop it.
-- Legacy decks lose their custom accent visually; deck data otherwise unaffected.

ALTER TABLE decks DROP COLUMN IF EXISTS accent_color;
