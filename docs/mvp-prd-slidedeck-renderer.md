# Deckpipe — MVP PRD

**Agent-first slide rendering engine**
Draft v0.6 · March 2026

---

## Problem

AI agents can reason about content and narrative but have no good way to render slides. PowerPoint XML is brutal to generate, Google Slides API is clunky, and existing "AI slide" tools are monolithic — they own the full pipeline from prompt to render. There is no clean, dedicated rendering layer that any agent can target.

## Product Thesis

Decouple **slide rendering** from **slide creation**. Deckpipe is a rendering engine with an agent-friendly API. Agents describe *what* goes on slides using a simple JSON schema; Deckpipe handles *how* it looks. Users can view, lightly edit, and export the result.

---

## MVP Scope

### 1. Agent Interface (API)

Agents interact with a simple REST API. The schema is semantic and layout-aware — agents pick from named layouts and styles, never calculate coordinates. No authentication in MVP; rate limits are enforced by IP.

#### Endpoints

**`POST /v1/decks`** — Create a new deck

Request body:

```json
{
  "title": "Q1 Product Update",
  "theme": "modern",
  "slides": [
    {
      "layout": "title",
      "content": {
        "title": "Q1 Product Update",
        "subtitle": "March 2026",
        "image_url": "https://example.com/logo.png"
      }
    },
    {
      "layout": "title_and_body",
      "content": {
        "title": "What We Shipped",
        "body": "We launched three major features this quarter...",
        "image_url": "https://example.com/hero.png"
      }
    },
    {
      "layout": "title_and_bullets",
      "content": {
        "title": "Key Metrics",
        "bullets": ["DAU up 34%", "Churn down to 2.1%", "NPS at 72"],
        "image_url": "https://example.com/chart.png"
      }
    },
    {
      "layout": "two_columns",
      "content": {
        "title": "Before & After",
        "left": { "heading": "Before", "body": "Manual reporting..." },
        "right": { "heading": "After", "body": "Automated dashboards..." },
        "image_url": "https://example.com/comparison.png"
      }
    },
    {
      "layout": "section_break",
      "content": {
        "title": "What's Next"
      }
    },
    {
      "layout": "title_and_table",
      "content": {
        "title": "Pricing Comparison",
        "table": {
          "headers": ["Plan", "Price", "Users", "Storage"],
          "rows": [
            ["Starter", "$9/mo", "1", "10 GB"],
            ["Pro", "$29/mo", "5", "100 GB"],
            ["Enterprise", "Custom", "Unlimited", "Unlimited"]
          ],
          "highlight_column": 1
        }
      }
    },
    {
      "layout": "image_and_text",
      "content": {
        "title": "Architecture",
        "body": "The new pipeline handles 10x throughput.",
        "image_url": "https://example.com/diagram.png"
      }
    }
  ]
}
```

Response `201 Created`:

```json
{
  "deck_id": "dk_a1b2c3d4",
  "viewer_url": "https://app.deckpipe.dev/d/dk_a1b2c3d4",
  "created_at": "2026-03-27T14:30:00Z",
  "slide_count": 7
}
```

**`GET /v1/decks/{deck_id}`** — Retrieve deck JSON

Returns the full deck payload as stored, including any user edits. Useful for agents that want to read-back the current state before making updates.

**`PATCH /v1/decks/{deck_id}`** — Update an existing deck

Accepts a partial payload. Agents can update the full slide array, individual slide content, the theme, or the deck title. Used by both the viewer (inline text edits) and agents (regenerating or modifying decks).

```json
{
  "slides": [{ "index": 2, "content": { "title": "Updated Metrics" } }]
}
```

Response `200 OK`: Returns the full updated deck object.

**`DELETE /v1/decks/{deck_id}`** — Delete a deck

Response `204 No Content`.

**`GET /v1/decks/{deck_id}/export/pdf`** — Export deck as PDF

Response: PDF binary with `Content-Type: application/pdf`.

**`POST /v1/images`** — Upload an image

Accepts `multipart/form-data` with a single image file. Returns a hosted URL that can be used in any `image_url` field. Used by the viewer's drag-and-drop feature and by agents uploading local files (e.g. screenshots from the user's desktop).

```
POST /v1/images
Content-Type: multipart/form-data

file: <image binary>
```

Response `201 Created`:

```json
{
  "image_id": "img_x7y8z9",
  "url": "https://api.deckpipe.dev/v1/images/img_x7y8z9.png",
  "size_bytes": 245000,
  "content_type": "image/png"
}
```

Accepted formats: PNG, JPG, WebP. Max file size: 10 MB. Images are stored on a Railway persistent volume and served by the API.

#### Error Responses

All errors return a consistent shape:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Invalid layout 'hero'. Must be one of: title, title_and_body, ...",
    "field": "slides[0].layout"
  }
}
```

Error codes: `validation_error` (400), `not_found` (404), `rate_limited` (429), `server_error` (500).

Agent builders should be able to debug a failed request by reading the error message alone — no guesswork. Field-level pointers (`slides[2].content.title`) tell the agent exactly what to fix.

#### Rate Limiting (MVP)

No auth in MVP. Rate limits are enforced per IP to prevent abuse while keeping integration frictionless.

| Endpoint | Limit | Window |
|---|---|---|
| `POST /v1/decks` | 60 requests | per hour |
| `GET /v1/decks/{id}` | 300 requests | per hour |
| `PATCH /v1/decks/{id}` | 120 requests | per hour |
| `GET .../export/pdf` | 30 requests | per hour |
| `POST /v1/images` | 120 requests | per hour |
| Viewer page loads | 600 requests | per hour |

Rate limit headers are returned on every response: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` (Unix timestamp). When exceeded, the API returns `429` with a `Retry-After` header.

These limits are intentionally generous for legitimate single-agent use. If an IP consistently exceeds limits, we log it for review but don't block permanently in MVP — the data informs v-next pricing tiers.

### 2. Layouts (MVP set)

Seven layouts cover the vast majority of real-world slide needs. All layouts except `section_break` accept an optional `image_url`. When an image is provided, the renderer adapts the layout automatically — for example, `title_and_bullets` shifts the bullets left and places the image on the right; `title_and_body` places the image below or beside the text depending on aspect ratio.

| Layout | Content fields | Image behavior |
|---|---|---|
| `title` | `title`, `subtitle` (opt) | Background or centered below title |
| `title_and_body` | `title`, `body` | Beside text (landscape) or below (portrait) |
| `title_and_bullets` | `title`, `bullets[]` | Right column alongside bullets |
| `title_and_table` | `title`, `table{}` | Not supported (table takes full width) |
| `two_columns` | `title`, `left{heading,body}`, `right{heading,body}` | Spans below both columns |
| `section_break` | `title` | No image support |
| `image_and_text` | `title`, `body`, `image_url` (required) | Primary — image takes ~60% of slide |

Image sizing and placement is handled by the renderer. Agents never specify dimensions or positions — they just pass a URL (either an external URL or a Deckpipe-hosted URL from `POST /v1/images`). When agents pass external URLs, images are fetched and re-hosted to Railway storage on deck creation to prevent broken links. Users can also drag-and-drop images directly onto slides in the viewer (see section 4), and MCP-connected agents can upload local files like screenshots from the user's desktop (see MCP Server section).

#### Tables

Tables are supported as a dedicated layout (`title_and_table`) and also as an inline content element in any layout that has a `body` field — agents can pass a `table` object instead of or alongside `body` text.

**Table schema:**

```json
{
  "table": {
    "headers": ["Plan", "Price", "Users", "Storage"],
    "rows": [
      ["Starter", "$9/mo", "1", "10 GB"],
      ["Pro", "$29/mo", "5", "100 GB"],
      ["Enterprise", "Custom", "Unlimited", "Unlimited"]
    ],
    "highlight_column": 1
  }
}
```

All cells are plain strings — no cell-level formatting, no merged cells, no colspan/rowspan. The renderer handles all styling (alternating row shading, header weight, column alignment, padding) based on the active theme.

**`highlight_column`** (optional, zero-indexed): Gives one column visual emphasis (accent background, bold text) — useful for calling out a recommended plan, key metric, or target date.

**Rendering rules:**
- Auto-size columns based on content, capped at slide width
- Support 2–6 columns comfortably; 7+ triggers auto font-size reduction
- Tables with more than 8 rows auto-shrink or truncate with an overflow indicator
- Table cells are editable inline (same contentEditable behavior as other text elements)

**Design decision:** Tables are deliberately simple. Every cell is a string, so agents basically can't produce invalid output. Cell-level formatting (bold, colors, alignment per cell), numeric formatting, and nested content are all post-MVP.

### 3. Themes (hardcoded)

Three visual themes ship as hardcoded CSS configurations. The agent picks one per deck via the `theme` field. There is no theme customization in MVP — each theme is a fixed, opinionated design system. This keeps the rendering deterministic and the output quality high. Theme customization via a settings UI is planned for v-next (see below).

**Minimal**
Clean, lots of white space. Light background, dark text, thin sans-serif (e.g. Inter). Accent color used sparingly for highlights. Best for: internal updates, text-heavy decks, developer audiences.

**Modern**
Bold and structured. Dark section headers, vibrant accent palette, geometric shapes as subtle background elements. Medium-weight sans-serif (e.g. DM Sans). Best for: product launches, investor updates, external-facing decks.

**Classic**
Warm and professional. Serif headings (e.g. Playfair Display), sans-serif body. Muted earth-tone accents, subtle borders. Best for: board meetings, consulting deliverables, traditional industries.

Each theme defines: background color, text colors (title/body), accent color, font pairing, bullet style, table styling (header background, row striping, highlight color), and spacing scale. These values map directly to CSS custom properties consumed by the Lit components.

### 4. Viewer & Inline Editing

The viewer is a web app served at `app.deckpipe.dev/d/{deck_id}`.

**Viewer features (MVP):**
- Full-screen slide-by-slide navigation (arrow keys, click, swipe)
- Slide thumbnail strip for quick navigation
- Responsive — works on desktop and mobile

**Inline editing (MVP):**
- Click any text element to edit it directly (contentEditable)
- Edits are saved automatically to the deck
- No layout changes, no drag-and-drop of elements, no adding/removing slides — text and images only
- Visual indicator (subtle pencil icon or border) on hover to signal editability

**Image drag-and-drop (MVP):**
- Users can drag-and-drop or click-to-upload an image onto any slide that supports `image_url`
- The viewer uploads the file to `POST /v1/images`, receives the hosted CDN URL, and patches the slide's `image_url` via `PATCH /v1/decks/{id}`
- A drop zone overlay appears when dragging a file over an image-capable slide area
- Replaces any existing image on that slide; to remove an image, user clicks a small × button on the image
- Accepted formats: PNG, JPG, WebP (matches the API constraint)

**Why text + image editing only:** The agent creates structure; the human refines wording and swaps in the right visuals. This covers the two most common "last mile" edits without opening the complexity of a full slide editor.

#### Viewer UI Design

The viewer is intentionally minimal — it should feel like looking at a printed slide on a desk, not like using a software application. The slide is the star; everything else recedes.

**Layout (desktop):**

```
┌──────────────────────────────────────────────────────────┐
│  light gray background (#f5f5f5)                         │
│                                                          │
│  ┌────────┐   ┌──────────────────────────────────────┐   │
│  │ thumb 1│   │                                      │   │
│  │ ▪▪▪▪▪▪ │   │                                      │   │
│  ├────────┤   │         active slide                 │   │
│  │ thumb 2│   │         (white, soft drop shadow)    │   │
│  │ ▪▪▪▪▪▪ │   │                                      │   │
│  ├────────┤   │                                      │   │
│  │ thumb 3│   │                                      │   │
│  │  active│   │                                      │   │
│  ├────────┤   └──────────────────────────────────────┘   │
│  │ thumb 4│                                              │
│  │ ▪▪▪▪▪▪ │                              slide 3 / 7    │
│  └────────┘                                              │
└──────────────────────────────────────────────────────────┘
```

**Page background:** Light warm gray (`#f5f5f5` or similar neutral). The slide floats on this surface — the contrast makes the slide content pop without any chrome competing for attention.

**Slide canvas:** White (or theme background color), centered in the main area with generous padding around it. A subtle drop shadow (`0 2px 12px rgba(0,0,0,0.08)`) gives it a soft "floating card" feel. 16:9 aspect ratio, scales responsively to fit the viewport.

**Thumbnail strip:** Left sidebar, ~120px wide. Vertically scrollable list of slide miniatures. Each thumbnail is a scaled-down render of the actual slide (not an icon or placeholder). The active slide thumbnail has a 2px accent border (theme accent color). Clicking a thumbnail navigates to that slide. On mobile, the thumbnail strip hides and a slide counter (`3 / 7`) is shown instead.

**Navigation:**
- Left/right arrow keys → previous/next slide
- Click left/right edges of the slide area → previous/next
- Swipe left/right on touch devices → previous/next
- Thumbnail click → jump to slide
- No visible prev/next buttons by default — they appear on hover as subtle chevrons at the left/right edges of the slide area, semi-transparent, not competing with the slide content

**Slide counter:** Small, muted text (`13px`, `color: #999`) below the slide canvas, right-aligned. Shows `3 / 7` format. Unobtrusive.

**Toolbar:** Minimal bar at the top or bottom, appears on hover/tap. Contains only: deck title (left), export PDF button (right), and a subtle edit mode toggle (pencil icon). No heavy chrome, no menus, no branding in MVP.

**Edit mode indicators:** When hovering over an editable text element, a subtle dashed border appears around it. Cursor changes to text cursor. No persistent edit UI — the editability is discoverable through hover behavior, not through visible buttons on every element.

**Image drop zone:** When dragging a file over an image-capable area, a dashed border with a muted "Drop image here" label appears as an overlay. Subtle, not intrusive.

**Design principles:**
- The viewer should feel like Keynote's presentation mode with a sidebar, not like Google Slides' editor
- No visible grid lines, rulers, or toolbars unless the user is actively editing
- Typography and spacing within slides is controlled by the theme — the viewer adds zero decorative elements of its own
- Animation: only slide transitions (simple crossfade, ~200ms) and hover effects. No entrance animations, no bouncing, no sliding UI panels

**Mobile:**
- Thumbnail strip hidden, replaced by a bottom dot indicator (like iOS page dots) or swipe-only navigation
- Slide counter visible at bottom
- Full-screen slide, edge-to-edge with minimal padding
- Tap to reveal toolbar (auto-hides after 3s)

### 5. Export

**MVP:** PDF export only. The viewer renders slides to a multi-page PDF matching the on-screen appearance.

**Post-MVP:** PPTX export (hard — requires mapping the rendering model to PowerPoint XML, but expected by enterprise users).

---

## Architecture & Tech Stack

### System Overview

```
Agent ──POST JSON──▶ REST API ──validate + store──▶ Postgres (JSONB)
  │                     │                                  │
  └──MCP──▶ MCP Server ─┘                                  │
                        │                                  │
                   POST /v1/images ──store──▶ Railway Volume (/data/images/)
                                                           │
User ──GET viewer──▶ Lit Web App ◀──fetch deck JSON────────┘
                       │                │
                 Renders slides    Drag-and-drop images
                 Inline edits ──PATCH──▶ REST API ──update──▶ Postgres
```

### Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Runtime** | Node.js + TypeScript | Type safety across API, MCP server, and shared schema types. Single language for the entire backend. |
| **API framework** | Express | Minimal, well-understood, good middleware ecosystem for rate limiting and validation. |
| **Database** | PostgreSQL | JSONB for deck storage, relational for metadata (timestamps, IP, rate limit counters). Hosted on Railway. |
| **Image storage** | Railway Volume | Persistent volume mounted at `/data/images/` on the API service. Images served directly by Express via a static file route (`GET /v1/images/:id`). Simple, no external dependencies. Migrate to S3/R2 if storage or CDN needs outgrow Railway. |
| **Frontend** | Lit (web components) | Each slide layout is a self-contained `<slide-*>` component. Themes via CSS custom properties. Tiny bundle (~5kb runtime). No build-step complexity. |
| **MCP server** | `@modelcontextprotocol/sdk` | Thin wrapper over the REST API. Exposes Deckpipe tools to any MCP-compatible agent. |
| **Hosting** | Railway | API, MCP server, and static frontend all deploy from one monorepo. Postgres as a Railway service. |
| **PDF export** | Puppeteer (server-side) | Renders the Lit viewer in headless Chrome and prints to PDF. Matches what the user sees exactly. |

### Project Structure

```
deckpipe/
├── packages/
│   ├── api/                  # Express REST API
│   │   ├── src/
│   │   │   ├── routes/       # deck CRUD + export endpoints
│   │   │   ├── middleware/    # rate-limiter, error-handler, validation
│   │   │   ├── db/           # Postgres client, migrations
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── mcp-server/           # MCP tool server
│   │   ├── src/
│   │   │   ├── tools/        # create_deck, get_deck, update_deck, etc.
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── viewer/               # Lit frontend
│   │   ├── src/
│   │   │   ├── components/   # slide-title, slide-bullets, slide-two-columns, ...
│   │   │   ├── themes/       # minimal.css, modern.css, classic.css
│   │   │   └── viewer.ts     # deck loader, navigation, inline edit handler
│   │   └── package.json
│   │
│   └── shared/               # Shared TypeScript types
│       ├── src/
│       │   ├── schema.ts     # Deck, Slide, Layout, Theme types + Zod validation
│       │   └── errors.ts     # Error code types
│       └── package.json
│
├── railway.toml
└── package.json              # Workspaces root
```

### MCP Server

The MCP server is the primary agent integration point. It runs as a separate service on Railway and exposes Deckpipe's capabilities as MCP tools. Agents connecting via MCP never need to know about the REST API — the MCP server handles all translation.

**Tools exposed:**

| Tool | Description | Maps to |
|---|---|---|
| `create_deck` | Create a new slide deck from JSON. Returns viewer URL. | `POST /v1/decks` |
| `get_deck` | Retrieve a deck's current state (including user edits). | `GET /v1/decks/{id}` |
| `update_deck` | Update slides, theme, or title of an existing deck. | `PATCH /v1/decks/{id}` |
| `delete_deck` | Delete a deck permanently. | `DELETE /v1/decks/{id}` |
| `upload_image` | Upload a base64-encoded image (e.g. a local screenshot). Returns a hosted URL for use in `image_url` fields. | `POST /v1/images` |
| `list_layouts` | Returns available layouts with their content schemas and image behavior. No REST equivalent — MCP-only convenience tool for agent discovery. | — |

**Local file uploads via MCP:**

A key capability of the MCP integration is that agents running locally (Claude Desktop, Cursor, Claude Code, etc.) have filesystem access. This means an agent can read a file from the user's machine — a screenshot on the desktop, a chart exported from Excel, a logo in Downloads — base64-encode it, and upload it via `upload_image` in a single step. The user says "add the screenshot on my desktop to slide 3" and the agent handles the rest.

The `upload_image` tool accepts:

```json
{
  "image_data": "<base64-encoded image>",
  "filename": "screenshot.png",
  "content_type": "image/png"
}
```

Returns:

```json
{
  "image_id": "img_x7y8z9",
  "url": "https://api.deckpipe.dev/v1/images/img_x7y8z9.png"
}
```

The agent can then call `update_deck` to set the `image_url` on the target slide. Or, for convenience, it can include the image upload as part of a `create_deck` call by using the returned URL inline. This two-step flow (upload → reference) keeps the API simple and avoids mixing binary data into the deck JSON schema.

**Note:** Agents running in hosted/cloud environments (e.g. a remote n8n instance) won't have local filesystem access. For those cases, agents pass external `image_url` values as before, and the API re-hosts them automatically.

**`list_layouts` example response:**

```json
{
  "layouts": [
    {
      "name": "title",
      "description": "Opening or closing slide with a large centered title.",
      "fields": {
        "title": { "type": "string", "required": true },
        "subtitle": { "type": "string", "required": false },
        "image_url": { "type": "url", "required": false, "behavior": "Background or centered below title" }
      }
    },
    {
      "name": "title_and_table",
      "description": "Data slide with a title and a structured table. Use for comparisons, pricing, feature matrices, timelines, or any tabular data.",
      "fields": {
        "title": { "type": "string", "required": true },
        "table": {
          "type": "object", "required": true,
          "properties": {
            "headers": { "type": "string[]", "required": true, "max_items": 6 },
            "rows": { "type": "string[][]", "required": true, "max_items": 8 },
            "highlight_column": { "type": "integer", "required": false, "description": "Zero-indexed column to visually emphasize" }
          }
        }
      }
    }
  ],
  "themes": ["minimal", "modern", "classic"]
}
```

This tool lets agents dynamically discover Deckpipe's capabilities at runtime — no hardcoded layout knowledge required. When we add new layouts or themes, existing agent integrations pick them up automatically.

**MCP endpoint:** `mcp.deckpipe.dev/sse`

**Tool descriptions matter:** Each tool's `description` field is written to be a self-contained prompt for an LLM — it includes purpose, all parameters, constraints (max bullets, required fields), and a minimal example. An agent should be able to use Deckpipe correctly having read nothing but the tool descriptions.

### OpenAPI Spec

Alongside the MCP server, the REST API publishes an OpenAPI 3.1 spec at `api.deckpipe.dev/openapi.json`. This serves agent frameworks that consume OpenAPI directly (OpenAI function calling, LangChain API toolkit, etc.) and powers auto-generated API reference docs. The spec is generated from the same Zod schemas in `packages/shared/` that validate incoming requests — single source of truth, never out of sync.

### Lit Component Architecture

Each slide layout is a Lit web component that receives its content as properties and renders using the active theme's CSS custom properties.

```typescript
// Example: <slide-title>
@customElement('slide-title')
export class SlideTitle extends LitElement {
  @property() title = '';
  @property() subtitle = '';
  @property() imageUrl = '';

  render() {
    return html`
      <div class="slide">
        <h1 contenteditable @blur=${this._onEdit}>${this.title}</h1>
        ${this.subtitle ? html`<p class="subtitle" contenteditable>${this.subtitle}</p>` : ''}
        ${this.imageUrl ? html`<img src="${this.imageUrl}" />` : ''}
      </div>
    `;
  }
}
```

Themes are applied by swapping a CSS class on the deck container (`<div class="theme-minimal">`), which sets custom properties like `--dp-bg`, `--dp-text-title`, `--dp-font-heading`, `--dp-accent`. All components reference these properties — no theme logic in JavaScript.

---

## V-Next: Authentication & Access Control

MVP ships without auth to minimize friction for early agent builders. V-next introduces auth in two phases: API keys first (simple, works everywhere today), then OAuth 2.0 (more secure, better UX as the MCP ecosystem matures).

### Phase 1: API Keys

**User flow:**

1. User signs up at `deckpipe.dev` (email + password or GitHub OAuth)
2. Creates a workspace (the billing and access boundary)
3. Goes to Settings → API Keys → Generate Key
4. Receives a key: `dp_sk_live_abc123...`
5. Pastes it into their MCP config or uses it as a Bearer token in REST API calls

**MCP config with auth:**

```json
{
  "mcpServers": {
    "deckpipe": {
      "url": "https://mcp.deckpipe.dev/sse",
      "headers": {
        "Authorization": "Bearer dp_sk_live_abc123..."
      }
    }
  }
}
```

**REST API with auth:**

```
POST /v1/decks
Authorization: Bearer dp_sk_live_abc123...
Content-Type: application/json
```

**Key management:**
- Keys are scoped to a workspace — all decks created with a key belong to that workspace
- Multiple keys per workspace (one per agent integration, e.g. "Claude Desktop", "n8n workflow", "internal bot")
- Keys can be scoped to specific permissions (create-only, read-only, full CRUD) to support least-privilege patterns
- Keys can be rotated and revoked from the dashboard instantly
- Key prefix `dp_sk_live_` makes them easy to identify in logs and config files (test keys use `dp_sk_test_`)

**Rate limits with auth:**
Authenticated requests get higher rate limits than the MVP per-IP defaults. Free tier keeps MVP limits; paid tiers raise them. Usage is tracked per workspace and visible in a dashboard.

### Phase 2: OAuth 2.0 (backlog)

As more MCP hosts add native OAuth support (Claude Desktop, Copilot Studio, and Cursor are all moving in this direction), Deckpipe will support OAuth 2.0 as a second auth method alongside API keys.

**How it would work:**
- Agent host connects to `mcp.deckpipe.dev/sse` and detects auth is required
- Host opens a browser to `deckpipe.dev/oauth/authorize`
- User logs in and grants permissions
- Token flows back to the agent host automatically — no copy-pasting API keys
- Tokens are scoped, short-lived, and automatically refreshed

**Why not OAuth first:**
OAuth is more secure and a better UX, but the MCP ecosystem isn't fully there yet. Not all hosts support it, and the implementation cost is significantly higher (authorization server, token management, refresh flows, consent screens). API keys work with every MCP client today and are well understood by developers. We ship API keys first, then add OAuth when the ecosystem catches up.

**Viewer access control (v-next):**
Decks gain a `visibility` field: `public` (default, anyone with the link), `unlisted` (link-only, no indexing — same as MVP behavior), or `private` (requires login). Private decks require the viewer to authenticate via email magic link or SSO. Workspace admins can set a default visibility for all decks created under their workspace.

**Workspace model:**
A workspace is the billing and access boundary. One workspace can have multiple API keys (one per agent integration), multiple team members (for viewer access), and a shared deck library. This maps naturally to a team or company.

**Migration path from MVP:**
Decks created during the no-auth MVP phase become "unowned." Once a user signs up, they can claim existing decks by providing the `deck_id` — since MVPs are unlisted-link-only, knowing the ID is proof of ownership. Claimed decks move into the user's workspace.

### V-Next: Theme Customization (Settings UI)

MVP themes are hardcoded — great defaults, zero configuration. V-next introduces a settings UI where authenticated users can customize themes to match their brand.

**Settings UI** (`app.deckpipe.dev/settings/themes`):
A visual editor where users can create custom themes by overriding the CSS custom properties that drive the renderer. The UI exposes a manageable set of controls rather than raw CSS:

- **Colors:** Background, title text, body text, accent/highlight, table header background, table row stripe
- **Fonts:** Heading font family + weight, body font family + weight (from a curated list of Google Fonts to ensure reliable rendering)
- **Bullet style:** Disc, dash, arrow, numbered, or custom character
- **Spacing:** Compact, default, or generous (maps to a spacing scale multiplier)
- **Logo:** Upload a logo image that appears on every slide (position: top-left, top-right, or bottom-right)

**Live preview:** The settings UI includes a live slide preview (using the actual Lit components) that updates as the user adjusts values. Users can flip through sample slides in each layout to see how their customizations look across the full layout set.

**Custom theme API:**
Custom themes are stored per workspace and selectable via the `theme` field in the deck payload — either by name (`"theme": "minimal"`) for built-in themes or by ID (`"theme": "ct_abc123"`) for custom ones. The `list_layouts` MCP tool returns both built-in and workspace-specific custom themes.

**Starting point:** Users always start from one of the three built-in themes and override individual properties. This ensures every custom theme has sensible defaults and avoids the "blank canvas" problem where users create themes that look broken.

**Design rationale:** The settings UI is a *human* interface, not an agent interface. Agents pick themes; humans configure them. This keeps the agent's job simple (just reference a theme name) while giving end users the brand control they need.

---

## What's Explicitly Out of MVP

- Authentication Phase 1: API keys, viewer login, workspace model (see v-next section)
- Authentication Phase 2: OAuth 2.0 for MCP (see v-next backlog)
- Theme customization / settings UI (see v-next section — MVP themes are hardcoded)
- Slide reordering, adding, or deleting via the UI
- Cell-level table formatting (bold, colors, alignment per cell, merged cells)
- Animations and transitions
- Speaker notes
- Collaborative editing / multiplayer
- PPTX / Google Slides export
- Streaming/incremental deck building
- Versioning or undo history

---

## Success Criteria

1. An agent can go from JSON payload to a shareable, good-looking deck in under 2 seconds.
2. A non-technical user can open the viewer link, read the deck, and fix a typo — without any instructions.
3. The three themes produce visually distinct, professional results with zero configuration.
4. Rate limits don't block any legitimate single-agent workflow during normal use.

---

## Open Questions

- **Markdown in body fields:** Should `body` text support basic Markdown (bold, italic, links) or only plain text?
- **SVG support:** Do we accept SVGs in addition to raster formats? Great for diagrams but introduce rendering complexity and potential XSS vectors.
- **Pricing model:** Per-deck, per-workspace, or usage-based? Free tier limits?
- **Deck expiry:** Should unowned MVP decks expire after N days to manage storage?
- **Image cleanup:** When a deck is deleted or an image is replaced, do we garbage-collect orphaned images from the Railway volume immediately or on a schedule?
- **Image size limits per deck:** 10 MB per image, but should there be a total storage cap per deck (e.g. 50 MB) to prevent abuse?
- **Railway volume scaling:** Railway volumes are single-region and tied to one service instance. At what usage threshold do we migrate to S3/R2 for multi-region CDN delivery?
- **Table cell content length:** Should we enforce a max character limit per cell to prevent layout overflow, or let the renderer handle it gracefully?
- **Custom theme font licensing:** When v-next allows custom fonts, do we restrict to Google Fonts (free, hosted) or allow any web font URL?
- **OAuth scope granularity:** When OAuth ships, what permission scopes do we expose? Candidates: `decks:read`, `decks:write`, `decks:delete`, `images:write`. Keep it simple or go granular?
