# Project Structure

**topaitoolrank.com** — Next.js 16 website with isolated tools system.

## Directory Layout

```
app/
├── api/
│   └── discord/
│       └── route.ts           # Secure Discord webhook proxy
├── layout.tsx                  # Root layout (light theme, CSS, GA4)
├── page.tsx                    # Homepage (hero, services, tools, contact)
├── privacy-policy/
│   └── page.tsx               # Privacy policy page
├── terms/
│   └── page.tsx               # Terms of service page
├── blogs/
│   └── page.tsx               # Blog "coming soon" page
└── tools/                      # ALL TOOLS (completely isolated)
    ├── README.md              # Guide to adding new tools
    ├── layout.tsx             # Parent layout for all tools
    └── wa-sender/             # WA Sender tool (isolated)
        ├── .toolinfo          # Tool documentation
        ├── layout.tsx         # Tool layout (loads Tailwind)
        ├── page.tsx           # Full WA Sender component (835+ LOC)
        └── globals.css        # Tool-specific Tailwind styles

public/
├── css/
│   ├── style.css              # Main site theme (light, blue/cyan)
│   └── animations.css         # Scroll animations
├── js/
│   ├── main.js                # Form handling, nav, scroll
│   └── scene.js               # 3D canvas animation
├── favicon.svg
├── robots.txt
└── sitemap.xml

Root Files
├── package.json               # Dependencies (next, react, xlsx, etc.)
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── .env                       # Environment variables (DISCORD_WEBHOOK_URL)
├── .env.example               # Template for .env
└── PROJECT_STRUCTURE.md       # This file
```

## Key Design Decisions

### 1. Tool Isolation
- Tools live in `app/tools/{tool-name}/`
- Each tool has its own `page.tsx`, `layout.tsx`, `globals.css`
- **NO shared state** between tools
- **NO tool files in main app directory**

### 2. Theme Separation
- **Main site:** Light theme with light blue background (#f8fbff), blue/cyan accents
- **Tools:** Each tool can define its own theme via `globals.css` without affecting the main site
- WA Sender uses Tailwind v4 scoped to its folder only

### 3. API Routes
- Discord webhook URL is **server-side only** (`app/api/discord/route.ts`)
- Contact form & access requests POST to `/api/discord`
- Webhook URL stored in `.env` (not exposed to client)

## Adding a New Tool

1. Create `app/tools/new-tool/` folder
2. Add:
   - `page.tsx` (required) — tool component
   - `layout.tsx` (required) — tool layout
   - `globals.css` (optional) — tool styles
   - `.toolinfo` (recommended) — documentation

3. Update homepage navbar in `app/page.tsx`
4. Add to `public/sitemap.xml`
5. Deploy — Vercel auto-deploys on git push

**Example:**
```bash
mkdir app/tools/voice-rating
# Create page.tsx, layout.tsx, .toolinfo
# Update navbar
# Update sitemap
# git push
```

## Environment Variables

Set in Vercel project settings (or `.env` locally):

```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=https://topaitoolrank.com
```

## Dependencies

- `next@16` — Framework
- `react@19` — UI library
- `xlsx` — Excel file parsing (WA Sender)
- `tailwindcss@4` — Utility-first CSS
- `next-auth@4` — Authentication (future)

## Deployment

**Vercel:**
1. Connect repo to Vercel
2. Set environment variables in project settings
3. Configure custom domain (`topaitoolrank.com`)
4. Auto-deploys on git push

**DNS:**
- Add CNAME record at registrar pointing to Vercel

## File Sizes

- Main site CSS: ~15KB (style.css + animations.css)
- WA Sender component: 835+ lines (page.tsx)
- Total unfold: ~2MB (includes node_modules)

## SEO

- Sitemap: `public/sitemap.xml` (all routes)
- Robots: `public/robots.txt` (Allow all)
- Meta tags: All pages have title, description, OG tags
- JSON-LD: Homepage has Organization schema
- Canonical URLs: All pages

## Notes

- Dark theme from earlier attempts **removed** — site is light themed
- Tool folder structure **prevents file mixing** when adding new tools
- WA Sender is **fully functional** — copied directly from source repo
- All URLs use `/tools/wa-sender` format (no `.html` extensions)
