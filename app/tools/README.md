# Tools Directory

This folder contains all site tools. Each tool is completely isolated to prevent file mixing when adding new tools.

## Folder Structure

```
tools/
├── README.md (this file)
├── layout.tsx (parent layout for all tools)
└── wa-sender/ (isolated tool folder)
    ├── .toolinfo (documentation)
    ├── page.tsx (tool component)
    ├── globals.css (tool styles)
    └── layout.tsx (tool layout)
```

## Adding a New Tool

1. **Create folder:**
   ```bash
   mkdir app/tools/new-tool
   ```

2. **Add required files:**
   - `page.tsx` — Main tool component
   - `layout.tsx` — Tool page layout
   - `globals.css` (optional) — Tool-specific styles
   - `.toolinfo` — Documentation

3. **Update navbar** in `app/page.tsx`:
   ```jsx
   <li><a href="/tools/new-tool">New Tool</a></li>
   ```

4. **Add to sitemap.xml:**
   ```xml
   <url>
     <loc>https://topaitoolrank.com/tools/new-tool</loc>
     <lastmod>2026-04-29</lastmod>
     <changefreq>weekly</changefreq>
     <priority>0.8</priority>
   </url>
   ```

5. **Deploy** — git push and Vercel auto-deploys

## Tool Isolation

- **No shared state between tools** — each tool manages its own state
- **No tool files in main `app/` directory** — all tool code stays in `tools/`
- **Each tool has own CSS scope** — use `globals.css` inside tool folder
- **Independent dependencies** — if a tool needs a library, add to main `package.json`

## Current Tools

- **WA Sender** (`/tools/wa-sender`) — WhatsApp & Email campaign tool
  - Files: `page.tsx`, `globals.css`, `layout.tsx`
  - Depends on: `xlsx` library

## Notes

- Tools route format: `/tools/{tool-name}`
- All tools inherit site navbar/header structure
- Tools can customize styling via `globals.css` without affecting main site
