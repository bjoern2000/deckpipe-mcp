import { z } from 'zod';

// --- Table ---
export const TableSchema = z.object({
  headers: z.array(z.string()).min(2).max(6),
  rows: z.array(z.array(z.string())).min(1).max(8),
  highlight_column: z.number().int().min(0).optional(),
}).refine(
  (data) => data.rows.every(row => row.length === data.headers.length),
  { message: 'Each row must have the same number of cells as headers' }
);
export type Table = z.infer<typeof TableSchema>;

// --- Layout content schemas ---
const TitleContentSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  image_url: z.string().url().optional(),
});

const TitleAndBodyContentSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  image_url: z.string().url().optional(),
  table: TableSchema.optional(),
});

const TitleAndBulletsContentSchema = z.object({
  title: z.string().min(1),
  bullets: z.array(z.string()).min(1),
  image_url: z.string().url().optional(),
});

const TitleAndTableContentSchema = z.object({
  title: z.string().min(1),
  table: TableSchema,
});

const ColumnSchema = z.object({
  heading: z.string().min(1),
  body: z.string().min(1),
});

const TwoColumnsContentSchema = z.object({
  title: z.string().min(1),
  left: ColumnSchema,
  right: ColumnSchema,
  image_url: z.string().url().optional(),
});

const SectionBreakContentSchema = z.object({
  title: z.string().min(1),
});

const ImageAndTextContentSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  image_url: z.string().url(),
});

// --- Slide (discriminated union on layout) ---
export const SlideSchema = z.discriminatedUnion('layout', [
  z.object({ layout: z.literal('title'), content: TitleContentSchema }),
  z.object({ layout: z.literal('title_and_body'), content: TitleAndBodyContentSchema }),
  z.object({ layout: z.literal('title_and_bullets'), content: TitleAndBulletsContentSchema }),
  z.object({ layout: z.literal('title_and_table'), content: TitleAndTableContentSchema }),
  z.object({ layout: z.literal('two_columns'), content: TwoColumnsContentSchema }),
  z.object({ layout: z.literal('section_break'), content: SectionBreakContentSchema }),
  z.object({ layout: z.literal('image_and_text'), content: ImageAndTextContentSchema }),
]);
export type Slide = z.infer<typeof SlideSchema>;

export const LayoutNames = [
  'title', 'title_and_body', 'title_and_bullets', 'title_and_table',
  'two_columns', 'section_break', 'image_and_text',
] as const;
export type Layout = typeof LayoutNames[number];

// --- Deck creation ---
export const CreateDeckSchema = z.object({
  title: z.string().min(1),
  custom_font: z.string().min(1).max(100).optional(),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  slides: z.array(SlideSchema).min(1).max(50),
});
export type CreateDeckInput = z.infer<typeof CreateDeckSchema>;

// --- Deck update ---
const SlideUpdateSchema = z.object({
  index: z.number().int().min(0),
  content: z.record(z.unknown()),
});

export const UpdateDeckSchema = z.object({
  title: z.string().min(1).optional(),
  custom_font: z.string().min(1).max(100).optional(),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  slides: z.array(SlideUpdateSchema).optional(),
}).refine(
  (data) => data.title !== undefined || data.custom_font !== undefined || data.accent_color !== undefined || data.slides !== undefined,
  { message: 'At least one field must be provided for update' }
);
export type UpdateDeckInput = z.infer<typeof UpdateDeckSchema>;

// --- Deck response ---
export const DeckResponseSchema = z.object({
  deck_id: z.string(),
  title: z.string(),
  custom_font: z.string().nullable().optional(),
  accent_color: z.string().nullable().optional(),
  slides: z.array(SlideSchema),
  created_at: z.string(),
  updated_at: z.string(),
});
export type DeckResponse = z.infer<typeof DeckResponseSchema>;

// --- Create deck response ---
export const CreateDeckResponseSchema = z.object({
  deck_id: z.string(),
  viewer_url: z.string(),
  created_at: z.string(),
  slide_count: z.number(),
});
export type CreateDeckResponse = z.infer<typeof CreateDeckResponseSchema>;

// --- Image ---
export const ImageUploadResponseSchema = z.object({
  image_id: z.string(),
  url: z.string(),
  size_bytes: z.number(),
  content_type: z.string(),
});
export type ImageUploadResponse = z.infer<typeof ImageUploadResponseSchema>;
